const { LiveSyncController } = require('./live-sync-v5');
const cdp = require('./cdp');

function tab(id, url) { return { id, type: 'page', url, title: id, webSocketDebuggerUrl: `ws://fake/${id}` }; }
function assert(value, message) { if (!value) throw new Error(message); }

async function main() {
  const originals = Object.fromEntries(['targets', 'tabs', 'newTab', 'closeTab', 'call'].map((name) => [name, cdp[name]]));
  const lists = new Map([
    [1, [tab('m1', 'file:///openbrowser-start.html'), tab('m2', 'https://example.test/arcus')]],
    [2, [tab('s21', 'file:///openbrowser-start.html'), tab('s22', 'https://example.test/arcus'), tab('s2x1', 'about:blank'), tab('s2x2', 'about:blank')]],
    [3, [tab('s31', 'file:///openbrowser-start.html'), tab('s32', 'https://example.test/arcus'), tab('s3x1', 'about:blank'), tab('s3x2', 'about:blank')]],
    [4, [tab('s41', 'file:///openbrowser-start.html'), tab('s42', 'https://example.test/arcus'), tab('s4x1', 'about:blank'), tab('s4x2', 'about:blank')]],
  ]);
  let generated = 0; const closed = []; const navigated = [];
  try {
    cdp.tabs = async (port) => (lists.get(port) || []).map((item) => ({ ...item }));
    cdp.targets = cdp.tabs;
    cdp.newTab = async (port, url) => { const value = tab(`generated-${++generated}`, url); lists.get(port).push(value); return { ...value }; };
    cdp.closeTab = async (port, id) => { lists.set(port, lists.get(port).filter((item) => item.id !== id)); closed.push({ port, id }); };
    cdp.call = async (socket, method, params = {}) => { if (method === 'Page.navigate') { for (const [port, values] of lists) { const value = values.find((item) => item.webSocketDebuggerUrl === socket); if (value) { value.url = params.url; navigated.push({ port, id: value.id, url: params.url }); } } } return { result: { value: true } }; };

    const events = []; const controller = new LiveSyncController({ running: new Map(), on: () => () => {} }, (event) => events.push(event));
    controller.master = { id: 'master', item: { port: 1 } };
    controller.slaves = [{ id: 'slave-2', port: 2 }, { id: 'slave-3', port: 3 }, { id: 'slave-4', port: 4 }];
    controller.masterTabs = lists.get(1).map((item) => ({ ...item }));

    const initialLists = new Map(); for (const slave of controller.slaves) initialLists.set(slave.id, await cdp.tabs(slave.port));
    for (let index = 0; index < controller.masterTabs.length; index += 1) await controller.ensureMapping(controller.masterTabs[index], index, initialLists);
    await controller.reconcileSlaveTabs(controller.masterTabs, initialLists);
    assert(controller.slaves.every((slave) => lists.get(slave.port).length === 2), 'stale slave tabs were not removed');
    assert(generated === 0, 'initial exact tabs should have been adopted');

    const masterBlank = tab('m3', 'chrome://newtab'); lists.get(1).push(masterBlank); controller.masterTabs.push(masterBlank);
    for (const slave of controller.slaves) lists.get(slave.port).push(tab(`native-${slave.id}`, 'about:blank'));
    const mirroredLists = new Map(); for (const slave of controller.slaves) mirroredLists.set(slave.id, await cdp.tabs(slave.port));
    await controller.ensureMapping(masterBlank, 2, mirroredLists); await controller.reconcileSlaveTabs(controller.masterTabs, mirroredLists);
    assert(controller.slaves.every((slave) => lists.get(slave.port).length === 3), 'mirrored tab creation did not converge to three tabs');
    assert(generated === 0, 'CDP created duplicate tabs instead of adopting native-created tabs');

    const lost = controller.tabMap.get('m2').get('slave-2'); lists.set(2, lists.get(2).filter((item) => item.id !== lost)); lists.get(2).push(tab('replacement-arcus', 'https://example.test/arcus'));
    const repairLists = new Map(); for (const slave of controller.slaves) repairLists.set(slave.id, await cdp.tabs(slave.port));
    await controller.ensureMapping(controller.masterTabs[1], 1, repairLists);
    assert(controller.tabMap.get('m2').get('slave-2') === 'replacement-arcus', 'missing mapped tab was not repaired');

    let connectionCloses = 0;
    const openConnection = () => ({ socket: { readyState: 1 }, close() { connectionCloses += 1; } }); const dead = { socket: { readyState: 3 }, close() { connectionCloses += 1; } };
    // The newtab master tab must be attach-eligible for the reattach/eviction
    // assertions below. chrome://newtab is an internal page —
    // refreshMasterTabs never attaches it (canDomLiveSyncTabUrl is false) —
    // so the URL changes once the mapping phase is done: master has now
    // "navigated" the newtab page to real content.
    const mappedBlank = controller.masterTabs[2];
    mappedBlank.url = 'https://example.test/native'; lists.get(1).find((item) => item.id === mappedBlank.id).url = 'https://example.test/native';
    controller.connections.set('m1', { tab: controller.masterTabs[0], connection: openConnection(), scroll: { x: 0, y: 0 } });
    controller.connections.set('m2', { tab: controller.masterTabs[1], connection: dead, scroll: { x: 0, y: 0 } });
    controller.connections.set('m3', { tab: controller.masterTabs[2], connection: openConnection(), scroll: { x: 0, y: 0 } });
    let reattached = 0;
    controller.attach = async (value) => { reattached += 1; controller.connections.set(value.id, { tab: value, connection: openConnection(), scroll: { x: 0, y: 0 } }); };
    controller.pollTabState = async () => {};
    controller.syncWindowGeometry = async () => {};
    controller.lastHealthCheck = Date.now();
    await controller.refreshMasterTabs();
    assert(reattached === 1 && controller.connections.get('m2').connection !== dead, 'closed persistent CDP connection was not reattached');

    controller.pollTabState = async (value) => { if (value.tab.id === 'm3') throw new Error('simulated persistent command failure'); };
    await controller.refreshMasterTabs();
    assert(!controller.connections.has('m3'), 'failed persistent command did not evict the stale connection');
    controller.pollTabState = async () => {};
    await controller.refreshMasterTabs();
    assert(reattached === 2 && controller.connections.has('m3'), 'evicted persistent connection was not reattached on the next refresh');

    // Hold a real asynchronous allocation open while a forwarded event asks
    // for the same master tab. Both callers must reserve one slave target.
    const racedMaster=tab('m-race','https://example.test/race');lists.get(1).push(racedMaster);controller.masterTabs.push(racedMaster);
    const originalNew=cdp.newTab;let releaseAllocation,allocationStarted;
    const entered=new Promise(resolve=>allocationStarted=resolve),gate=new Promise(resolve=>releaseAllocation=resolve);
    cdp.newTab=async(port,url)=>{allocationStarted();await gate;return originalNew(port,url);};
    const beforeRace=generated,staleLists=new Map(controller.slaves.map(slave=>[slave.id,[]]));
    const mappingRequest=controller.ensureMapping(racedMaster,-1,staleLists);await entered;
    const forwardedRequest=controller.slaveTab(controller.slaves[0],racedMaster.id);releaseAllocation();
    const [,forwarded]=await Promise.all([mappingRequest,forwardedRequest]);
    assert(generated-beforeRace===controller.slaves.length,'concurrent forwarded event created duplicate mapped targets');
    assert(forwarded.id===controller.tabMap.get(racedMaster.id).get(controller.slaves[0].id),'forwarded event used different reservation');
    cdp.newTab=originalNew;
    const preservedIds=controller.slaves.flatMap(slave=>lists.get(slave.port).map(value=>value.id));
    await controller.ensureMapping(racedMaster,-1,staleLists);
    assert(controller.slaves.flatMap(slave=>lists.get(slave.port).map(value=>value.id)).join(',')===preservedIds.join(','),'stale refresh snapshot discarded new target reservation');
    const laterMaster=tab('m-after-snapshot','https://example.test/later');lists.get(1).push(laterMaster);
    const closedBeforeSnapshot=closed.length;await controller.reconcileSlaveTabs(controller.masterTabs,new Map(controller.slaves.map(slave=>[slave.id,lists.get(slave.port)])));
    assert(closed.length===closedBeforeSnapshot,'cleanup closed tabs using a stale master snapshot');

    const stopped=new LiveSyncController({running:new Map(),on:()=>()=>{}},()=>{});stopped.master={id:'stop-master',item:{port:1}};stopped.slaves=[{id:'stop-slave',port:2}];
    let allocationEntered,finishStoppedAllocation,queuedAfterStop=false;
    const stoppedEntered=new Promise(resolve=>allocationEntered=resolve),stoppedGate=new Promise(resolve=>finishStoppedAllocation=resolve);
    const beforeStoppedIds=lists.get(2).map(value=>value.id).join(',');
    cdp.newTab=async(port,url)=>{allocationEntered();await stoppedGate;return originalNew(port,url);};
    const stoppedAllocation=stopped.ensureMapping(tab('m-stopped','https://example.test/stopped'),-1,new Map([['stop-slave',[]]]));await stoppedEntered;
    const cancelledQueue=stopped.serializeTabMapping(()=>{queuedAfterStop=true;});stopped.stop();finishStoppedAllocation();await Promise.all([stoppedAllocation,cancelledQueue]);cdp.newTab=originalNew;
    assert(stopped.tabMap.size===0&&!queuedAfterStop,'stop resurrected mapping or executed queued session work');
    assert(lists.get(2).map(value=>value.id).join(',')===beforeStoppedIds,'cancelled allocation left an unowned browser tab');

    process.stdout.write(JSON.stringify({ status: 'PASS', success: true, staleTabsClosed: closed.length, nativeTabsAdopted: 3, generatedTabs: generated, repairedMapping: controller.tabMap.get('m2').get('slave-2'), reattachedConnections: reattached, evictedFailedConnections: events.filter((event) => event.type === 'live-sync-reattach').length, connectionCloses, finalCounts: controller.slaves.map((slave) => lists.get(slave.port).length), reconciliationEvents: events.filter((event) => event.type === 'live-sync-tab-reconcile').length, navigated }, null, 2));
  } finally {
    for (const [name, value] of Object.entries(originals)) cdp[name] = value;
  }
}

main().catch((error) => { process.stderr.write(error.stack || error.message); process.exitCode = 1; });

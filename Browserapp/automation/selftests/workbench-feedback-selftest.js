'use strict';
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { BrowserEngine } = require('../../engine');
const { fromRoxy } = require('../../rebuild/profile-dto');
const preview = require('../../rebuild/routes/host').find(([name]) => name === 'fingerprint:preview')[1];
const { WorkspaceWindows, workspaceRoute } = require('../../rebuild/workspace-windows');

async function main() {
  const engine = {
    profiles: new Map(), running: new Map(),
    profilePrefersFirefox: profile => profile.engine === 'firefox',
    chooseBrowser: profile => ({ version: profile.engine === 'firefox' ? '159.0' : '159.0.8154.6' }),
    fingerprintFor: BrowserEngine.prototype.fingerprintFor,
  };
  for (const coreType of ['Chrome', 'Firefox']) {
    let previousUserAgent = '', previousSeed = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      const selected = { os: 'Windows', coreType, coreVersion: '159' };
      const [row] = await preview({ engine }, selected);
      assert.match(row.userAgent, coreType === 'Firefox' ? /Firefox\/159\.0$/ : /Chrome\/159\.0\.0\.0 /);
      if (previousUserAgent) assert.equal(row.userAgent, previousUserAgent, 'randomization retains the installed browser UA');
      assert.notEqual(row._fingerprintDraft.seed, previousSeed);
      assert.equal(row._openbrowser.platform, 'Win32');
      const saved = fromRoxy({ ...selected, ...row });
      assert.equal(saved.fingerprintSeed, row._fingerprintDraft.seed);
      assert.equal(saved.privacy.fingerprint.uaGenerated, true);
      assert.equal(saved.privacy.fingerprint.uaPatchRandomized, false);
      const delivered = engine.fingerprintFor({ ...saved, kernelVersion: engine.chooseBrowser(saved).version });
      assert.equal(delivered.userAgent, row.userAgent, 'saved UA format survives runtime generation');
      if (coreType === 'Chrome') assert.equal(delivered.userAgentMetadata.fullVersion, engine.chooseBrowser(saved).version);
      const manual = fromRoxy({ userAgent: row.userAgent + ' Custom' }, saved);
      assert.equal(manual.privacy.fingerprint.uaPatchRandomized, undefined);
      const restored = structuredClone(saved);
      const nextVersion = coreType === 'Firefox' ? '160.0' : '160.0.9000.1';
      const upgradedEngine = { ...engine, chooseBrowser: () => ({ version: nextVersion }) };
      const upgraded = upgradedEngine.fingerprintFor({ ...restored, kernelVersion: nextVersion });
      assert.ok(coreType === 'Firefox' ? upgraded.userAgent.endsWith('Firefox/160.0') : upgraded.userAgent.includes('Chrome/160.0.'));
      previousUserAgent = row.userAgent; previousSeed = row._fingerprintDraft.seed;
    }
  }

  const draft = await import('../../rebuild/workbench-fingerprint-draft.mjs');
  const groups = [[{ name: 'os', value: 'Windows' }, { name: 'coreType', value: 'Chrome' },
    { name: 'coreVersion', value: '159' }, { name: 'userAgent', value: 'Chrome/159.0.0.0' }]];
  const read = value => draft.serializeFingerprintDraft(value, Object.fromEntries(value[0].map(row => [row.name, row.value])));
  const find = (value, name) => value.find(row => row.name === name);
  const apply = (value, fields) => value[0].forEach(row => { if (Object.hasOwn(fields, row.name)) row.value = fields[row.name]; });
  let releaseOld;
  const old = draft.refreshFingerprintDraft(groups, { read, find, apply, request: () => new Promise(resolve => { releaseOld = resolve; }) });
  find(groups[0], 'coreType').value = 'Firefox';
  const identity = { profileId: 'fixture-window', seed: 'new-seed', version: 2, allocation: 'fixture-allocation',
    userAgent: 'Firefox/159', uaReduced: true };
  const current = await draft.refreshFingerprintDraft(groups, { read, find, apply,
    request: async () => [{ userAgent: identity.userAgent, _fingerprintDraft: identity }] });
  assert.equal(current.length, 1);
  releaseOld([{ userAgent: 'Chrome/159.0.8154.6', _fingerprintDraft: { seed: 'old-seed' } }]);
  assert.equal((await old).length, 0);
  assert.equal(read(groups).userAgent, 'Firefox/159');
  assert.equal(read(groups)._fingerprintDraft.seed, 'new-seed');
  let releaseManual;
  const manual = draft.refreshFingerprintDraft(groups, { read, find, apply,
    request: () => new Promise(resolve => { releaseManual = resolve; }) });
  find(groups[0], 'userAgent').value = 'manual Firefox/159';
  draft.invalidateFingerprintDraft(groups);
  releaseManual([{ userAgent: 'Firefox/159.0', _fingerprintDraft: identity }]);
  await manual;
  assert.equal(read(groups).userAgent, 'manual Firefox/159');
  await draft.refreshFingerprintDraft(groups, { read, find, apply, request: async () => { throw Error('请先安装 Firefox 内核'); } });
  assert.equal(read(groups).userAgent, '');
  assert.equal(read(groups)._fingerprintDraft, undefined);
  assert.match(find(groups[0], 'userAgent').help, /安装 Firefox/);
  const validatingRead = value => {
    if (find(value[0], 'userAgent').invalid) throw Error('invalid UA');
    return read(value);
  };
  await draft.refreshFingerprintDraft(groups, { read: validatingRead, find, apply,
    request: async () => [{ userAgent: identity.userAgent, _fingerprintDraft: identity }] });
  assert.equal(read(groups).userAgent, identity.userAgent, 'a failed preview can recover after installing/selecting a kernel');
  const firstDraft = { ...identity, profileId: 'preview-window', allocation: 'preview-proof' };
  draft.restoreFingerprintDraft(groups, { _fingerprintDraft: { ...firstDraft,
    generatedHardware: { hardwareConcurrent: '8', deviceMemory: '8', webGLRender: 'generated' } } });
  const explicit = draft.serializeFingerprintDraft(groups, { hardwareConcurrent: '8', deviceMemory: '8' });
  assert.deepEqual(explicit._fingerprintDraft.generatedHardware, { webGLRender: 'generated' });
  const pinned = fromRoxy(explicit);
  assert.equal(pinned.privacy.cores, 8);
  assert.equal(pinned.privacy.memory, 8);
  draft.restoreFingerprintDraft(groups, { _fingerprintDraft: firstDraft });
  const uaOnly = { ...firstDraft, userAgent: 'Firefox/160' };
  await draft.refreshFingerprintDraft(groups, { read, find, apply, keepSeed: true,
    request: async payload => {
      assert.equal(payload.reuseDraft.seed, firstDraft.seed);
      assert.equal(payload.reuseDraft.profileId, firstDraft.profileId);
      return [{ userAgent: uaOnly.userAgent, _fingerprintDraft: uaOnly }];
    } });
  assert.equal(read(groups).userAgent, uaOnly.userAgent);
  assert.equal(read(groups)._fingerprintDraft.seed, firstDraft.seed);
  assert.equal(read(groups)._fingerprintDraft.profileId, firstDraft.profileId);
  assert.equal(read(groups)._fingerprintDraft.allocation, firstDraft.allocation);
  await draft.refreshFingerprintDraft(groups, { read, find, apply, keepSeed: true,
    request: async () => { throw Error('内核暂时不可用'); } });
  assert.equal(read(groups).userAgent, uaOnly.userAgent);
  assert.equal(read(groups)._fingerprintDraft.seed, firstDraft.seed);
  let releasePreviousEditor;
  const previousEditor = draft.refreshFingerprintDraft(groups, { read, find, apply,
    request: () => new Promise(resolve => { releasePreviousEditor = resolve; }) });
  draft.restoreFingerprintDraft(groups, { id: 'persisted-window', windowId: 'persisted-window', fingerprintSeed: 'stored-seed', fingerprintVersion: 1 });
  releasePreviousEditor([{ userAgent: 'Firefox/159.0', _fingerprintDraft: identity }]);
  assert.equal((await previousEditor).length, 0, 'restoring an editor invalidates pending previews even when OS/kernel are unchanged');
  await draft.refreshFingerprintDraft(groups, { read, find, apply,
    request: async payload => { assert.equal(payload.profileId, 'persisted-window');return [{ userAgent: identity.userAgent, _fingerprintDraft: identity }]; } });
  draft.restoreFingerprintDraft(groups, { _fingerprintDraft: { ...identity, profileId: 'template-old-window' } });
  await draft.refreshFingerprintDraft(groups, { read, find, apply,
    request: async payload => { assert.equal(payload.profileId, undefined, 'templates do not take ownership of an old window');return [{ userAgent: identity.userAgent, _fingerprintDraft: identity }]; } });

  const firstDevice = { deviceName: 'LAPTOP-ABCD123', macAddr: '02:00:00:01:02:03' };
  const secondDevice = { deviceName: 'DESKTOP-XYZ4321', macAddr: '02:00:00:03:02:01' };
  const deviceGroups = [[{ name: 'os', value: 'Windows' }, { name: 'coreType', value: 'Chrome' },
    { name: 'userAgent', value: 'Chrome/159.0.0.0' }, { name: 'deviceNameSwitch', value: true },
    { name: 'macInfo', value: true }, { name: 'position', value: 0 }, { name: 'isPositionBaseIp', value: false },
    { name: 'latitude', value: 0 }, { name: 'longitude', value: 0 }, { name: 'precisionPos', value: 20 },
    ...Object.entries(firstDevice).map(([name, value]) => ({ name, value }))]];
  const beforeDevice = { ...firstDraft, version: 4, userAgent: 'Chrome/159.0.0.0', generatedHardware: firstDevice };
  const afterDevice = { ...beforeDevice, seed: 'reroll', generatedHardware: secondDevice };
  draft.restoreFingerprintDraft(deviceGroups, { _fingerprintDraft: beforeDevice });
  draft.markFingerprintFieldExplicit(deviceGroups, 'deviceName');
  assert.equal(beforeDevice.generatedHardware.deviceName, firstDevice.deviceName, 'manual edits cannot mutate the original preview');
  await draft.refreshFingerprintDraft(deviceGroups, { read, find, apply, request: async payload => {
    assert.equal(payload.deviceName, firstDevice.deviceName);
    assert.deepEqual([payload.position, payload.isPositionBaseIp, payload.latitude, payload.longitude, payload.precisionPos],
      [0, false, 0, 0, 20]);
    assert.equal(payload.macAddr, '', 'the displayed automatic MAC must not be pinned by the next sample');
    return [{ ...secondDevice, userAgent: afterDevice.userAgent, _fingerprintDraft: afterDevice }];
  } });
  const editedIdentity = read(deviceGroups);
  assert.equal(editedIdentity.deviceName, firstDevice.deviceName);
  assert.equal(editedIdentity.macAddr, secondDevice.macAddr);
  const mappedIdentity = fromRoxy(editedIdentity);
  assert.equal(mappedIdentity.privacy.deviceName, firstDevice.deviceName);
  assert.equal(mappedIdentity.privacy.mac, '');

  const { createNetworkIndicator } = await import('../../rebuild/workbench-network.mjs');
  let mounted, calls = 0;
  const network = createNetworkIndicator({ ref: value => ({ value }), onMounted: fn => { mounted = fn; },
    request: async (_method, args) => { calls++; assert.equal(args.probe, true); return { ip: '198.51.100.45', localAddress: '192.168.1.2' }; } });
  await mounted();
  assert.equal(network.network.value.ip, '198.51.100.45');
  await Promise.all([network.refresh(), network.refresh()]);
  assert.equal(calls, 2, 'concurrent refreshes share one request');
  const unavailable = createNetworkIndicator({ ref: value => ({ value }), onMounted: fn => { mounted = fn; },
    request: async () => ({ localAddress: '192.168.1.2' }) });
  await mounted();
  assert.equal(unavailable.network.value.ip, '--');
  assert.match(unavailable.network.value.city, /未获取/);

  class Window extends EventEmitter {
    constructor(options) { super(); this.options = options; this.webContents = new EventEmitter(); this.sent = [];
      this.webContents.send = (...args) => this.sent.push(args); this.webContents.setWindowOpenHandler = () => {}; }
    isDestroyed() { return !!this.destroyed; }
    isMinimized() { return false; }
    loadURL(url) { this.url = url; return Promise.resolve(); }
    show() {} focus() {} restore() {}
    destroy() { this.destroyed = true; this.emit('closed'); }
  }
  const parent = new Window({}), windows = new Set([parent]);
  const manager = new WorkspaceWindows({ BrowserWindow: Window, parent: () => parent, windows });
  for (const route of ['https://example.test', '//example.test', '/browser/list', '/agent-console/../browser/list', '/__proto__'])
    assert.throws(() => workspaceRoute(route));
  await Promise.all([manager.request('ui:workspace:open', { route: '/agent-console/task-manager' }),
    manager.request('ui:workspace:open', { route: '/agent-console/task-manager' })]);
  assert.equal(manager.entries.size, 1);
  const child = manager.entries.values().next().value.window;
  assert.equal(child.options.frame, true);
  assert.equal(child.options.webPreferences.sandbox, true);
  assert.equal(manager.owns(child.webContents), true);
  await manager.request('ui:workspace:ready', {}, child.webContents);
  await manager.request('ui:workspace:open', { route: '/agent-console/task-manager?task=next' });
  assert.equal(child.sent[0][1].channel, 'workspace:navigate');
  await manager.request('ui:workspace:open', { route: '/api-keys' });
  assert.equal(manager.entries.size, 2);
  await manager.request('ui:workspace:open', { route: '/agent-console/mcp' });
  const mcpChild = manager.entries.get('/agent-console/mcp').window;
  await manager.request('ui:workspace:ready', {}, mcpChild.webContents);
  await Promise.all([
    manager.request('ui:workspace:open', { route: '/agent-console/mcp?tab=old' }),
    manager.request('ui:workspace:open', { route: '/agent-console/mcp?tab=current' }),
  ]);
  assert.deepEqual(mcpChild.sent.map(([, event]) => event.payload), ['/agent-console/mcp?tab=current']);
  manager.closeAll();
  assert.equal(manager.entries.size, 0);
  assert.equal(windows.size, 1);
  console.log('WORKBENCH_FEEDBACK_SELFTEST OK (UA/seed persistence, stale previews, public IP and owned native workspaces)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

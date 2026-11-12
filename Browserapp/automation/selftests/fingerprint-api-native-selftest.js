'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');

async function navigate(page, url) {
  const expected = new URL(url).href;
  await page.command('Page.navigate', { url: expected });
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      const current = await h.evaluate(page, '({url:document.documentURI,ready:document.readyState})');
      if (current.url === expected && current.ready === 'complete') return;
    } catch (error) {
      if (!/Execution context was destroyed|Cannot find context/i.test(error.message)) throw error;
    }
    await h.delay(20);
  }
  throw new Error('Native API test document did not load: ' + expected);
}

async function workerSnapshot() {
  const estimate = await navigator.storage.estimate();let reads = 0;
  const status = await navigator.permissions.query({ get name() { reads++;return 'geolocation'; } });
  return { quota: estimate.quota, usage: estimate.usage, keys: Object.keys(estimate).sort(), reads, state: status.state };
}
async function probe() {
  const out = { permissions: {}, storage: {}, geo: {} };
  let reads = 0;
  const status = await navigator.permissions.query({ get name() { if (++reads > 1) throw new Error('descriptor replay');return 'geolocation'; } });
  out.permissions.getter = { reads, state: status.state };
  let coercions = 0;
  const frozen = Object.freeze({ name: { toString() { coercions++;return 'geolocation'; } } });
  out.permissions.frozen = { state: (await navigator.permissions.query(frozen)).state, coercions };
  let forgedReads = 0;
  try { await Permissions.prototype.query.call({}, { get name() { forgedReads++;return 'geolocation'; } }); }
  catch (error) { out.permissions.forged = { name: error.name, reads: forgedReads }; }
  const frame = document.createElement('iframe');document.body.append(frame);const child = frame.contentWindow;
  const readings = [
    ['main', navigator.storage.estimate, navigator.storage],
    ['child', child.navigator.storage.estimate, child.navigator.storage],
    ['borrowed', StorageManager.prototype.estimate, child.navigator.storage],
    ['reverse', child.StorageManager.prototype.estimate, navigator.storage],
  ];
  for (const [key, fn, receiver] of readings) {
    const result = await fn.call(receiver);
    out.storage[key] = { quota: result.quota, keys: Object.keys(result).sort(),
      parentObject: Object.getPrototypeOf(result) === Object.prototype,
      childObject: Object.getPrototypeOf(result) === child.Object.prototype };
  }
  try { await StorageManager.prototype.estimate.call({}); } catch (error) { out.storage.forged = error.name; }
  for (const [key, invoke] of [
    ['missing', () => navigator.geolocation.getCurrentPosition()],
    ['receiver', () => Geolocation.prototype.getCurrentPosition.call({}, () => {})],
    ['callback', () => navigator.geolocation.getCurrentPosition(1)],
    ['options', () => navigator.geolocation.getCurrentPosition(() => {}, () => {}, { get timeout() { throw new RangeError('timeout getter'); } })],
  ]) {
    try { invoke();out.geo[key] = 'accepted'; } catch (error) { out.geo[key] = error.name; }
  }
  out.geo.watch = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('native watch callback timeout')), 5000);
    const id = navigator.geolocation.watchPosition(() => reject(new Error('denied watch succeeded')), error => {
      clearTimeout(timer);navigator.geolocation.clearWatch(id);
      resolve({ positiveId: id > 0, code: error.code, keys: Object.keys(error), genuine: error instanceof GeolocationPositionError });
    });
  });
  let callbacks = 0;
  const cancelled = navigator.geolocation.watchPosition(() => { callbacks++; }, () => { callbacks++; });
  navigator.geolocation.clearWatch(cancelled);await new Promise(resolve => setTimeout(resolve, 60));
  out.geo.cancelledCallbacks = callbacks;
  frame.remove();return out;
}
const locationProbe = `(async()=>({state:(await navigator.permissions.query({name:'geolocation'})).state,
  position:await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('geolocation timeout')),5000);
    navigator.geolocation.getCurrentPosition(p=>{clearTimeout(timer);resolve({lat:p.coords.latitude,lon:p.coords.longitude})},
      e=>{clearTimeout(timer);resolve({code:e.code})});})}))()`;

async function main() {
  const browser = h.chooseChromiumBinary();
  const worker = '(' + workerSnapshot.toString() + ')()';
  const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', request.url.endsWith('.js') ? 'text/javascript' : 'text/html');
    if (request.url === '/dedicated.js') response.end(worker + '.then(postMessage);');
    else if (request.url === '/shared.js') response.end(`onconnect=e=>{const p=e.ports[0];${worker}.then(v=>{p.postMessage(v);p.close()})};`);
    else if (request.url === '/sw.js') response.end(`addEventListener('install',e=>e.waitUntil(skipWaiting()));
      addEventListener('activate',e=>e.waitUntil(clients.claim()));addEventListener('message',e=>e.waitUntil(${worker}.then(v=>{e.ports[0].postMessage(v);e.ports[0].close()})));`);
    else { if (request.url === '/policy') response.setHeader('Permissions-Policy', 'geolocation=()');response.end('<!doctype html><body>native contracts'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let baseline;
  try {
    for (const injected of [false, true]) {
      const profile = sanitizeProfile({ id: 'native-api-contracts', name: 'Native contracts', os: 'Windows',
        privacy: { geoMode: 'disabled', fontListMode: 'real' } });
      const fingerprint = buildFingerprint({ ...profile, kernelVersion: browser.version });
      assert.equal(fingerprint.geoPermission, 'denied');
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint }, { injectFingerprint: injected });let page;
      try {
        page = await h.openPage(session.port);
        if (!injected) await page.command('Browser.setPermission', { permission: { name: 'geolocation' }, setting: 'denied' });
        await navigate(page, origin);
        const tree = await page.command('Page.getFrameTree');
        const world = await page.command('Page.createIsolatedWorld', { frameId: tree.frameTree.frame.id, worldName: 'native-api-reference' });
        const reference = await page.command('Runtime.evaluate', { expression: 'navigator.storage.estimate().then(v=>({quota:v.quota,keys:Object.keys(v).sort()}))',
          contextId: world.executionContextId, awaitPromise: true, returnByValue: true });
        assert.equal(reference.exceptionDetails, undefined);
        const stock = reference.result.value;
        const actual = await h.evaluate(page, '(' + probe.toString() + ')()');
        assert.deepEqual(actual.permissions, { getter: { reads: 1, state: 'denied' }, frozen: { state: 'denied', coercions: 1 }, forged: { name: 'TypeError', reads: 0 } });
        assert.deepEqual(actual.geo, { missing: 'TypeError', receiver: 'TypeError', callback: 'TypeError', options: 'RangeError',
          watch: { positiveId: true, code: 1, keys: [], genuine: true }, cancelledCallbacks: 0 });
        assert.equal(actual.storage.forged, 'TypeError');
        for (const key of ['main', 'child', 'borrowed', 'reverse']) {
          assert.ok(actual.storage[key].quota <= stock.quota, 'do not claim more quota than the unmodified native realm');
          assert.deepEqual(actual.storage[key].keys, stock.keys);
          if (injected) {
            assert.equal(actual.storage[key].parentObject, baseline.storage[key].parentObject, key + ' result realm');
            assert.equal(actual.storage[key].childObject, baseline.storage[key].childObject, key + ' result realm');
          }
        }
        if (!injected) { baseline = actual;baseline.workers = {}; }
        for (const kind of ['dedicated', 'shared', 'service']) {
          const result = await h.evaluate(page, kind === 'dedicated'
            ? `new Promise((resolve,reject)=>{const w=new Worker('/dedicated.js');w.onmessage=e=>{w.terminate();resolve(e.data)};w.onerror=e=>reject(new Error(e.message))})`
            : kind === 'shared' ? `new Promise((resolve,reject)=>{const w=new SharedWorker('/shared.js');w.port.onmessage=e=>{w.port.close();resolve(e.data)};w.onerror=e=>reject(new Error(e.message));w.port.start()})`
            : `(async()=>{await navigator.serviceWorker.register('/sw.js');const r=await navigator.serviceWorker.ready;return new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>{c.port1.close();resolve(e.data)};r.active.postMessage('read',[c.port2])})})()`);
          // Chromium pads quota by current usage. Injected SW script-cache
          // bytes count as usage; compare available space rather than total
          // quota from two profiles with different stored byte counts.
          if (injected) assert.ok(result.quota - result.usage <= baseline.workers[kind].quota - baseline.workers[kind].usage,
            kind + ' stock worker quota bound: ' + JSON.stringify({ actual: result, native: baseline.workers[kind] }));
          else baseline.workers[kind] = result;
          assert.deepEqual(result.keys, stock.keys);
          assert.equal(result.reads, 1);assert.equal(result.state, 'denied');
        }
        assert.equal(session.events.some(event => /injection-failed|harness-browser-stop/.test(event.type)), false, JSON.stringify(session.events));
        console.log('PASS ' + (injected ? 'injected' : 'stock') + ' permission coercions, native geolocation validation/cancellation/errors, storage bounds and borrowed-call result realms across page/frame/three worker families');
      } finally { page?.close();await session.close(); }
    }
    const profile = sanitizeProfile({ id: 'native-geo-policy', name: 'Geo policy', os: 'Windows',
      privacy: { geoMode: 'custom', geoPermission: 'allow', latitude: 0, longitude: 0, fontListMode: 'real' } });
    const fingerprint = buildFingerprint({ ...profile, kernelVersion: browser.version });
    const session = await h.launchPersonaBrowser(browser, { profile, fingerprint });let page;
    try {
      page = await h.openPage(session.port);await navigate(page, origin);
      assert.deepEqual(await h.evaluate(page, locationProbe), { state: 'granted', position: { lat: 0, lon: 0 } });
      await navigate(page, origin + '/policy');
      const tree = await page.command('Page.getFrameTree');
      const world = await page.command('Page.createIsolatedWorld', { frameId: tree.frameTree.frame.id, worldName: 'native-permission-reference' });
      const reference = await page.command('Runtime.evaluate', { expression: locationProbe, contextId: world.executionContextId, awaitPromise: true, returnByValue: true });
      assert.equal(reference.exceptionDetails, undefined);
      const actual = await h.evaluate(page, locationProbe), native = reference.result.value;
      assert.deepEqual(native.position, { code: 1 }, 'the native policy blocks position access');
      assert.deepEqual(actual, native, 'permission status retains native behavior under a Permissions-Policy restriction');
      console.log('API_POLICY_REFERENCE ' + JSON.stringify({ actual, native }));
      console.log('PASS configured geolocation (0,0), native permission status and Permissions-Policy enforcement');
    } finally { page?.close();await session.close(); }
  } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error((error instanceof h.Unavailable ? 'SKIP ' : 'FAIL ') + error.stack);process.exitCode = error instanceof h.Unavailable ? 2 : 1; });

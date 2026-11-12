'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const methods = require('../../engine/profile-proxy');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { TrackedProfileMap } = require('../../engine/profile-revisions');
const { runProxyProbes } = require('../../engine/proxy-probe-runner');

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
function fixture(extra = {}) {
  const profile = sanitizeProfile({ id: 'proxy-race', name: 'Original', proxy: 'http://127.0.0.1:9', ...extra });
  return Object.assign({}, methods, {
    profiles: new TrackedProfileMap([[profile.id, profile]]), networkInfo: new Map(), running: new Map(),
    profileMaintenance: new Map(), sanitizeProfile,
    resolveStoredProxyProfile: (value) => value, restoreStoredProxyCredentials: (value) => value,
    fingerprintPatchFromNetwork: (network) => ({ exitIp: network.ip }),
    emit() {}, invalidateStatusCache() {}, async persist() {},
  });
}

(async () => {
  let checks = 0;
  for (const mutation of ['edit', 'delete', 'recreate', 'maintenance']) {
    const host = fixture(), gate = deferred();
    const original = host.profiles.get('proxy-race');
    host.testProxy = () => gate.promise;
    const operation = host.checkProxy(original);
    if (mutation === 'edit') host.profiles.set(original.id, { ...original, name: 'New edit' });
    if (mutation === 'delete' || mutation === 'recreate') host.profiles.delete(original.id);
    if (mutation === 'recreate') host.profiles.set(original.id, original);
    if (mutation === 'maintenance') host.profileMaintenance.set(original.id, Symbol('restore'));
    const current = host.profiles.get(original.id);
    const rejection = assert.rejects(operation, (error) => error.code ===
      (mutation === 'maintenance' ? 'PROFILE_MAINTENANCE' : 'PROFILE_STALE_REV'));
    gate.resolve({ ip: '192.0.2.10' });
    await rejection;
    assert.equal(host.profiles.get(original.id), current);
    assert.equal(host.networkInfo.size, 0);
    checks += 1;
  }
  {
    const host = fixture(), gate = deferred();
    const profile = host.profiles.get('proxy-race');
    host.testProxy = () => gate.promise;
    const operation = host.checkProxy(profile);
    host.profiles.set(profile.id, { ...profile });
    gate.resolve({ ip: '192.0.2.11' });
    assert.equal((await operation).profile.exitIp, '192.0.2.11', 'identical rewrites do not invalidate a probe');
    host.profileMaintenance.set(profile.id, Symbol('restore'));
    host.testProxy = () => { throw new Error('probe must not start under maintenance'); };
    await assert.rejects(host.checkProxy(profile), (error) => error.code === 'PROFILE_MAINTENANCE');
    checks += 2;
  }
  {
    const host = fixture(), gate = deferred();
    let calls = 0;
    host._testProxy = () => { calls += 1; return gate.promise; };
    const profile = host.profiles.get('proxy-race');
    const requests = [host.testProxy(profile), host.testProxy({ ...profile })];
    assert.equal(calls, 1, 'equivalent requests share the in-flight probe');
    for (const patch of [
      { proxyMeta: { ...profile.proxyMeta, backupProxies: ['http://127.0.0.1:10'] } },
      { proxyMeta: { ...profile.proxyMeta, apiExtractUrl: 'https://example.test/extract' } },
      { exitIp: '192.0.2.20' },
    ]) requests.push(host.testProxy({ ...profile, ...patch }));
    host.networkInfo.set(profile.id, { transportVerified: true });
    requests.push(host.testProxy(profile));
    assert.equal(calls, 5, 'different extraction, fallback and verification inputs are independent');
    gate.resolve({ ip: '192.0.2.21' });
    await Promise.all(requests);
    assert.equal(host._proxyTests.size, 0);
    checks += 1;
  }
  {
    const requested = deferred(), response = deferred();
    const server = http.createServer(async (_req, res) => {
      requested.resolve(); await response.promise;
      res.end('http://127.0.0.1:12345');
    });
    const previous = process.env.OPENBROWSER_ALLOW_PRIVATE_OUTBOUND;
    process.env.OPENBROWSER_ALLOW_PRIVATE_OUTBOUND = '1';
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const host = fixture({ proxyMeta: { apiExtractUrl: `http://127.0.0.1:${server.address().port}/extract` } });
      const profile = host.profiles.get('proxy-race');
      host.checkProxy = () => { throw new Error('stale extraction must not reach the probe'); };
      const operation = host.refreshProfileProxy(profile);
      const rejection = assert.rejects(operation, (error) => error.code === 'PROFILE_STALE_REV');
      await requested.promise;
      host.profiles.delete(profile.id);
      response.resolve();
      await rejection;
      assert.equal(host.profiles.has(profile.id), false, 'late extraction cannot resurrect a deleted profile');
      checks += 1;
    } finally {
      response.resolve(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
      if (previous === undefined) delete process.env.OPENBROWSER_ALLOW_PRIVATE_OUTBOUND;
      else process.env.OPENBROWSER_ALLOW_PRIVATE_OUTBOUND = previous;
    }
  }
  {
    // The service is unavailable through both routes. Only the route with a
    // genuine prior verification may reuse that evidence.
    const filename = require.resolve('../../engine/profile-proxy');
    const realRequire = createRequire(filename), isolated = { exports: {} };
    const forwarded = [];
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
      module: isolated, console,
      require: (name) => name === '../proxy-forwarder' ? { ...realRequire(name),
        lookupProxyCountry: async (_config, options) => {
          forwarded.push(options);
          return { ip: options.exitIp || '', transportVerified: options.previousResult?.transportVerified === true };
        },
      } : realRequire(name),
    }, { filename });
    const endpoint = 'http://127.0.0.1:9';
    const host = fixture({ proxy: endpoint, exitIp: '192.0.2.30', exitCountryCode: 'US' });
    host._testProxy = isolated.exports._testProxy;
    const profile = host.profiles.get('proxy-race');
    host.networkInfo.set(profile.id, { ip: '192.0.2.30', countryCode: 'US', transportVerified: true, proxyRaw: endpoint });
    const same = await host._testProxy(profile, { allowExtract: false, totalTimeoutMs: 500, attemptTimeoutMs: 250 });
    assert.equal(same.transportVerified, true);
    const changedIdentity = endpoint.replace('http://', 'http://other:account@');
    const changed = await host._testProxy(profile, { proxy: changedIdentity });
    assert.equal(changed.transportVerified, false, 'a new proxy account cannot inherit the old verification');
    assert.equal(forwarded[1].previousResult, undefined);
    assert.equal(forwarded[1].profile, undefined, 'old geography cannot become fallback data for another route');
    await host._testProxy({ ...profile, proxy: 'http://127.0.0.1:10' }, { allowExtract: false });
    assert.equal(forwarded[2].previousResult, undefined, 'extracted routes are checked against the stored identity');
    assert.equal(forwarded[2].exitIp, undefined);
    checks += 3;
  }
  {
    const originalSet = global.setTimeout, originalClear = global.clearTimeout;
    const timers = new Set();
    global.setTimeout = (callback) => { const timer = { callback, unref() {} }; timers.add(timer); return timer; };
    global.clearTimeout = (timer) => timers.delete(timer);
    try {
      const values = await runProxyProbes([() => ({ ip: '192.0.2.1' }), () => { throw new Error('unavailable'); }]);
      assert.equal(values.length, 1); assert.equal(values.errors.length, 1);
      assert.equal(timers.size, 0, 'completed probes release every deadline timer');
      checks += 1;
    } finally { global.setTimeout = originalSet; global.clearTimeout = originalClear; }
  }
  console.log(`PROXY_OPERATION_RACE_SELFTEST OK ${checks}/${checks}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });

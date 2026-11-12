'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const proxy = require('../../engine/profile-proxy');
const locale = require('../../engine/start-page');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { TrackedProfileMap } = require('../../engine/profile-revisions');
const { profileWriteGuard } = require('../../engine/profile-write-guard');
const { mergeLaunchProfileUpdate } = require('../../engine/start');
const chromiumStart = require('../../engine/start')._start;
const firefoxStart = require('../../engine/start-firefox')._startFirefox;

const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const network = { ip: '192.0.2.10', countryCode: 'DE', timezone: 'Europe/Berlin', latitude: null, longitude: null,
  checkedAt: '2026-11-12T00:00:00Z', latencyMs: 0, networkType: 'hosting', proxyRaw: 'http://127.0.0.1:10' };
function fixture(extra = {}) {
  const profile = sanitizeProfile({ id: 'launch-race', name: 'Original', proxy: 'http://127.0.0.1:9', ...extra });
  return Object.assign({}, proxy, locale, {
    profiles: new TrackedProfileMap([[profile.id, profile]]), networkInfo: new Map(), running: new Map(), profileMaintenance: new Map(),
    sanitizeProfile, resolveStoredProxyProfile: (value) => value,
    fingerprintPatchFromNetwork: (net) => ({ exitIp: net.ip, exitCheckedAt: net.checkedAt, exitLatencyMs: net.latencyMs }),
    emit() {}, invalidateStatusCache() {}, async persist() { this.persisted = [...this.profiles.values()]; },
  });
}

(async () => {
  let checks = 0;
  for (const stage of ['proxy', 'locale']) {
    for (const mutation of ['edit', 'delete', 'recreate', 'maintenance', 'in-place']) {
      const host = fixture(), gate = deferred(), original = host.profiles.get('launch-race');
      host.needsExitNetworkForLocale = () => true;
      host.testProxy = () => gate.promise;
      const operation = stage === 'proxy' ? host.prepareProfileProxyForStart(original)
        : host.ensureExitNetworkForLocale(original);
      const rejection = assert.rejects(operation, (error) => error.code ===
        (mutation === 'maintenance' ? 'PROFILE_MAINTENANCE' : 'PROFILE_STALE_REV'));
      if (mutation === 'edit') host.profiles.set(original.id, sanitizeProfile({ ...original, privacy: { ...original.privacy, canvas: 'real' } }));
      if (mutation === 'delete' || mutation === 'recreate') host.profiles.delete(original.id);
      if (mutation === 'recreate') host.profiles.set(original.id, original);
      if (mutation === 'maintenance') host.profileMaintenance.set(original.id, Symbol('restore'));
      if (mutation === 'in-place') original.privacy.canvas = 'real';
      const latest = host.profiles.get(original.id);
      gate.resolve(network);
      await rejection;
      assert.equal(host.profiles.get(original.id), latest);
      assert.equal(host.networkInfo.size, 0, 'stale probe cannot publish network data');
      assert.equal(host.persisted, undefined);
      checks++;
    }
  }
  {
    const host = fixture(), original = host.profiles.get('launch-race');
    const guard = profileWriteGuard(host, original.id);
    host.testProxy = async () => network;
    let result;
    const prepared = await host.prepareProfileProxyForStart(original, { publish: false, onNetwork: (value) => { result = value; } });
    assert.equal(host.profiles.get(original.id), original);
    assert.equal(host.networkInfo.size, 0);
    assert.equal(prepared.exitIp, network.ip, 'returned snapshot includes the applied exit result');
    assert.equal(prepared.exitCheckedAt, network.checkedAt);
    const resolved = host.applyResolvedLocale(prepared, result);
    assert.equal(resolved.privacy.timezone, network.timezone);
    assert.equal(resolved.exitLatitude, null, 'unknown coordinates do not become (0,0)');
    assert.equal(resolved.exitLatencyMs, 0);
    const committed = mergeLaunchProfileUpdate(host, resolved, guard);
    await host.persist();
    assert.equal(host.persisted[0], committed, 'the actual persisted map contains the resolved locale');
    checks++;
  }
  for (const mutation of ['edit', 'delete', 'recreate']) {
    const host = fixture(), original = host.profiles.get('launch-race');
    const guard = profileWriteGuard(host, original.id);
    if (mutation === 'edit') host.profiles.set(original.id, { ...original, name: 'Edited' });
    else { host.profiles.delete(original.id); if (mutation === 'recreate') host.profiles.set(original.id, original); }
    const latest = host.profiles.get(original.id);
    assert.throws(() => mergeLaunchProfileUpdate(host, { ...original, exitIp: network.ip }, guard), { code: 'PROFILE_STALE_REV' });
    assert.equal(host.profiles.get(original.id), latest);
    checks++;
  }
  {
    const host = fixture();
    const original = host.profiles.get('launch-race');
    host.networkInfo.set(original.id, { ip: '192.0.2.1' });
    let calls = 0;
    host.testProxy = async (_profile, options) => { calls++; assert.equal(options.force, true); return network; };
    await host.ensureExitNetworkForLocale(original, { force: true, publish: false });
    assert.equal(calls, 1, 'forced network guard never reuses the locale cache');
    checks++;
  }
  {
    // Direct lookup has no proxy check to guard it: deletion must still win.
    const filename = require.resolve('../../engine/start-page'), realRequire = createRequire(filename), isolated = { exports: {} };
    const gate = deferred(); let forced;
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module: isolated, console,
      require: (name) => name === '../proxy-forwarder' ? { lookupDirectCountry: (options) => { forced = options.force; return gate.promise; } } : realRequire(name),
    }, { filename });
    const host = fixture({ networkMode: 'direct', proxy: 'Direct' });
    const original = host.profiles.get('launch-race');
    const operation = isolated.exports.ensureExitNetworkForLocale.call(host, original, { force: true });
    const rejection = assert.rejects(operation, { code: 'PROFILE_STALE_REV' });
    host.profiles.delete(original.id);gate.resolve(network);await rejection;
    assert.equal(forced, true);
    assert.equal(host.profiles.size, 0);
    checks++;
  }
  for (const start of [chromiumStart, firefoxStart]) {
    for (const stage of ['proxy', 'locale', 'forced-locale']) {
      for (const mutation of ['edit', 'delete']) {
        const host = fixture({ advanced: { stopOpenNet: stage === 'forced-locale' } });
        const original = host.profiles.get('launch-race'), gate = deferred(), entered = deferred();
        let captured;
        Object.assign(host, {
          app: { getPath: () => require('node:os').tmpdir() },
          _platformPreflightDone: true, assertStartGenerationActive() {}, assertProxyConcurrencyAvailable() {}, emitStartProgress() {},
          profileRoot: () => '/unused-launch-fixture', cleanupStartupResources: async () => ({ exited: true, lockReleased: true }),
          chooseBrowser: () => { throw new Error('a stale start must not reach kernel launch'); },
          prepareProfileProxyForStart: async (value) => {
            if (stage !== 'proxy') return value;
            captured = value;entered.resolve();return gate.promise;
          },
          ensureExitNetworkForLocale: async (_value, options) => {
            entered.resolve();const net = await gate.promise;options.onNetwork?.(net);return net;
          },
        });
        const operation = start.call(host, original);
        const rejection = assert.rejects(operation, { code: 'PROFILE_STALE_REV' });
        await entered.promise;
        if (mutation === 'edit') host.profiles.set(original.id, sanitizeProfile({ ...host.profiles.get(original.id), privacy: { canvas: 'real' } }));
        else host.profiles.delete(original.id);
        const latest = host.profiles.get(original.id);
        gate.resolve(stage === 'proxy' ? captured : network);
        await rejection;
        assert.equal(host.profiles.get(original.id), latest, `${start.name}/${stage}: latest configuration survives`);
        assert.equal(host.running.size, 0);
        checks++;
      }
    }
  }
  console.log(`LAUNCH_PROFILE_WRITEBACK_SELFTEST OK ${checks}/${checks}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });

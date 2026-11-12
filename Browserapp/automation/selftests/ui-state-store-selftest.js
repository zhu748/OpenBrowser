'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createUiStateStore } = require('../../ui/ui-state-store');
const { reconcileProfiles, mergeExitState } = require('../../ui/ui-profile-state');
const { redactProxyCredentials } = require('../../shared/proxy-redact');

const timers = new Map(); let serial = 0; let writes = []; let normalized = 0;
let state = { profiles: [{ id: 'a', note: 'keep-note', tag: 'keep-tag', proxy: 'http://u:primary-secret@host:80', cookies: 'cookie-secret',
  proxyMeta: { backupProxies: ['socks5://b:backup-secret@backup:1080'] },
  platform: { password: 'platform-secret', accounts: [{ username: 'visible', password: 'row-secret' }] } }], logs: [] };
const original = structuredClone(state);
const options = { getState: () => state, read: () => JSON.stringify(original), write: (value) => writes.push(value),
  normalizeProfile: (value) => { normalized += 1; return value; }, fallback: () => ({ profiles: [], logs: [] }),
  setTimer: (fn) => { const id = serial++; timers.set(id, fn); return id; }, clearTimer: (id) => timers.delete(id) };
const store = createUiStateStore(options);
state = store.load();
assert.equal(store.save().ok, true, 'startup can immediately scrub a legacy snapshot');
for (const secret of ['primary-secret', 'backup-secret', 'platform-secret', 'row-secret', 'cookie-secret']) {
  assert.ok(!writes[0].includes(secret), 'storage must not contain ' + secret);
}
assert.deepEqual(state, original, 'redaction must retain authoritative in-memory credentials');
store.request(); store.request();
assert.equal(timers.size, 1, 'log and status bursts share one persistence timer, including timer ID zero');
state = { ...state, logs: [{ message: 'latest' }] };
const timer = [...timers.values()][0]; timers.clear(); timer();
assert.equal(JSON.parse(writes.at(-1)).logs[0].message, 'latest', 'scheduled saves read the latest state');
store.request(); const count = writes.length; store.save();
assert.equal(timers.size, 0);
assert.equal(writes.length, count + 1, 'an immediate edit consumes the pending background save');
store.request(); store.flush(); store.flush();
assert.equal(timers.size, 0, 'pagehide/unload flush is idempotent');
store.request(); store.dispose(); store.request(); store.save();
assert.equal(timers.size, 0, 'disposed state stores cannot schedule more writes');

let attempts = 0; let warnings = 0;
normalized = 0; writes = [];
const quota = createUiStateStore({ ...options, onQuota: () => { warnings += 1; },
  write(value) { attempts += 1; if (attempts === 1) throw new Error('quota'); writes.push(value); } });
assert.deepEqual(quota.save(), { ok: true, trimmed: true });
assert.equal(normalized, state.profiles.length, 'quota fallback reuses the already-redacted snapshot');
assert.equal(warnings, 1);
assert.deepEqual(JSON.parse(writes[0]).logs, []);
assert.equal(JSON.parse(writes[0]).profiles[0].note, 'keep-note');
assert.equal(JSON.parse(writes[0]).profiles[0].tag, 'keep-tag');
let failures = 0;
const blocked = createUiStateStore({ ...options, read: () => { throw new Error('blocked'); },
  write: () => { throw new Error('blocked'); }, onQuota() { throw new Error('observer'); }, onFailure: () => { failures += 1; } });
assert.deepEqual(blocked.load(), { profiles: [], logs: [] });
assert.equal(blocked.save().ok, false);
assert.equal(failures, 1);

const stored = JSON.parse(writes[0]);
// Full snapshots retain redacted backup endpoints; recover matching secrets on reload.
const redacted = require('../../ui/ui-state-store').redactProfileForStorage(original.profiles[0]);
const restored = reconcileProfiles({ localProfiles: [redacted], engineProfiles: original.profiles,
  normalizeProfile: (value) => value, mergeProxy: (local, remote) => redactProxyCredentials(local) === redactProxyCredentials(remote) ? remote : local });
assert.equal(restored[0].proxyMeta.backupProxies[0], original.profiles[0].proxyMeta.backupProxies[0]);
const backups = ['http://first:one@backup:8080', 'http://second:two@backup:8080'];
const repeated = reconcileProfiles({ localProfiles: [{ id: 'b', proxyMeta: { backupProxies: backups.map(redactProxyCredentials) } }],
  engineProfiles: [{ id: 'b', proxyMeta: { backupProxies: backups } }], normalizeProfile: (value) => value, mergeProxy: (_local, remote) => remote });
assert.deepEqual(repeated[0].proxyMeta.backupProxies, backups, 'same-endpoint backup accounts retain their own row credentials');
const renamed = reconcileProfiles({ localProfiles: [{ id: 'b', proxyMeta: { backupProxies: ['http://backup:8080/#old-note'] } }],
  engineProfiles: [{ id: 'b', proxyMeta: { backupProxies: ['http://user:secret@backup:8080/#new-note'] } }],
  normalizeProfile: (value) => value, mergeProxy: (_local, remote) => remote });
assert.equal(renamed[0].proxyMeta.backupProxies[0], 'http://user:secret@backup:8080/#new-note', 'remarks do not change backup endpoint identity');
assert.equal(stored.profiles[0].id, 'a');

const fleet = Array.from({ length: 10000 }, (_, i) => ({ id: String(i), exitIp: '192.0.2.1', exitLatitude: 10, proxy: 'Direct' }));
const config = { profiles: fleet, engineProfiles: fleet, hasCredentials: () => false };
const unchanged = mergeExitState(config);
assert.strictEqual(unchanged.profiles, fleet, 'unchanged polls retain the list and every profile reference');
assert.equal(unchanged.changed, false);
const changed = mergeExitState({ ...config, engineProfiles: [{ id: '1', exitIp: '192.0.2.2', exitLatitude: null, exitLongitude: 0 }] });
assert.notStrictEqual(changed.profiles, fleet);
assert.strictEqual(changed.profiles[0], fleet[0]);
assert.equal(changed.profiles[1].exitLatitude, null, 'authoritative clearing must remove stale coordinates');
assert.equal(changed.profiles[1].exitLongitude, 0, 'zero is a valid update');
assert.equal(fleet[1].exitLatitude, 10, 'polling merge does not mutate source state');
const cleared = mergeExitState({ ...config, engineProfiles: [{ id: '1', exitIp: '', exitLatitude: null, exitLongitude: null, exitCountryCode: '' }] });
assert.equal(cleared.profiles[1].exitIp, '', 'an explicitly cleared exit cannot remain visible');
assert.equal(cleared.profiles[1].exitCountryCode, '');
assert.equal(cleared.profiles[1].exitLatitude, null);
assert.equal(mergeExitState({ ...config, engineProfiles: [{ id: '1', exitIp: undefined }] }).profiles, fleet,
  'omitted exit data leaves the last known UI value intact');
const startupCleared = reconcileProfiles({ localProfiles: [fleet[1]], engineProfiles: [{ id: '1', exitIp: '', exitLatitude: null }],
  normalizeProfile: (value) => value, mergeProxy: (value) => value });
assert.equal(startupCleared[0].exitIp, '', 'startup also honors authoritative exit clearing');
assert.equal(startupCleared[0].exitLatitude, null);

const browser = { setTimeout, clearTimeout, URL };
for (const name of ['../../shared/proxy-redact', '../../ui/ui-state-store']) {
  vm.runInNewContext(fs.readFileSync(require.resolve(name), 'utf8'), browser);
}
assert.equal(browser.OpenBrowserUiState.redactProfileForStorage(original.profiles[0]).proxy, redacted.proxy);
console.log('UI_STATE_STORE_SELFTEST OK (legacy scrub, redaction, quota, coalescing, flush, disposal, backup restoration and 10000-profile identity)');

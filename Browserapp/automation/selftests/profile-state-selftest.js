'use strict';

const assert = require('node:assert/strict');
const { reconcileProfiles } = require('../../ui/ui-profile-state');

const local = [
  { id: 'b', name: 'Local B', proxy: 'redacted', platform: { username: 'local-user', password: 'local-pass' } },
  { id: 'deleted' },
  { id: 'a', cookies: 'local-cookie', proxyId: 'library', platform: {} },
];
const remote = [
  { id: 'a', cookies: 'remote-cookie', proxy: 'remote-a', exitIp: '192.0.2.1', platform: { totpSecret: 'totp' } },
  { id: 'b', cookies: 'engine-cookie', proxy: 'remote-b', platform: { password: 'remote-pass' } },
  { id: 'c', name: 'First C' }, { id: 'c', name: 'Second C' },
];
const original = structuredClone({ local, remote });
const options = {
  localProfiles: local, engineProfiles: remote,
  normalizeProfile: (profile) => structuredClone(profile),
  mergeProxy: (_local, engine) => engine,
  restoreProxy: (proxy, id) => id === 'library' ? 'library-with-auth' : proxy,
};
const result = reconcileProfiles(options);
assert.deepEqual(result.map((profile) => profile.id), ['b', 'a', 'c'], 'local order, deletion, and engine-only duplicates');
assert.equal(result[0].name, 'Local B');
assert.equal(result[0].platform.username, 'local-user');
assert.equal(result[0].platform.password, 'local-pass');
assert.equal(result[0].cookies, 'engine-cookie');
assert.equal(result[1].cookies, 'local-cookie');
assert.equal(result[1].platform.totpSecret, 'totp');
assert.equal(result[1].proxy, 'library-with-auth');
assert.equal(result[1].exitIp, '192.0.2.1');
assert.equal(result[2].name, 'First C');
assert.deepEqual({ local, remote }, original, 'merging does not mutate either source');
assert.equal(reconcileProfiles({ ...options, engineProfiles: [] }), local, 'empty engine preserves first-launch legacy profiles');

// Count ID reads to guard complexity without depending on wall-clock timings.
let reads = 0;
const fleet = Array.from({ length: 1000 }, (_, id) => ({ get id() { reads += 1; return id; } }));
assert.equal(reconcileProfiles({ ...options, localProfiles: [], engineProfiles: fleet }).length, 1000);
assert.ok(reads < 10 * fleet.length, 'engine-only restore performs linear membership checks');
console.log('PROFILE_STATE_SELFTEST OK (ordering, credentials, proxies, mutation isolation, linear restore)');

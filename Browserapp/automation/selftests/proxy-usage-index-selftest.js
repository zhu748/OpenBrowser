'use strict';

const assert = require('node:assert/strict');
const { summarizeProxyUsage, profileMatchesProxy } = require('../proxy-usage');
const storeApi = require('../proxy-store');

const raws = ['', 'invalid', 'none', 'host.test:1080', 'http://host.test:1080',
  'socks5://host.test:1080', 'socks5h://u:p@host.test:1080',
  'https://host.test:1080', 'socks5://[::1]:1080', '[::1]:1080'];
const proxies = raws.flatMap((raw, index) => [
  { id: `proxy-${index}`, raw, maxConcurrency: 2 },
  { id: `other-${index}`, raw, maxConcurrency: 1 },
]);
const profiles = raws.flatMap((raw, index) => [
  { id: `raw-${index}`, proxy: raw },
  { id: `alias-${index}`, raw },
  { id: `url-${index}`, proxyUrl: raw },
  { id: `linked-${index}`, proxy: raw, proxyId: `proxy-${index}` },
  { id: `meta-${index}`, proxy: raw, proxyMeta: { proxy_library_id: `proxy-${index}` } },
  { id: `unlinked-${index}`, proxy: raw, proxyId: null, proxyMeta: { proxyId: 'proxy-4' } },
  { id: `missing-${index}`, proxy: raw, proxyId: 'missing' },
  { id: `direct-${index}`, proxy: raw, networkMode: 'direct', proxyId: `proxy-${index}` },
  { id: `offline-${index}`, proxy: 'offline', proxyId: `proxy-${index}` },
]);
profiles.push(null);
for (const value of [...profiles, ...proxies]) if (value) Object.freeze(value);
const summary = summarizeProxyUsage(proxies, profiles);
for (const [index, proxy] of proxies.entries()) {
  const expected = profiles.filter((profile) => profileMatchesProxy(profile, proxy)).map((p) => ({ id: String(p.id), name: String(p.name || p.title || p.id) }));
  assert.deepEqual(summary[index].profiles, expected, JSON.stringify(proxy));
  assert.equal(summary[index].count, expected.length);
  assert.equal(summary.byId.get(proxy.id), summary[index]);
}
assert.equal(storeApi.summarizeProxyUsage, summarizeProxyUsage, 'public store export stays compatible');
assert.equal(Object.keys(summary).length, summary.length, 'convenience getters remain non-enumerable');
assert.deepEqual(summary.idle, summary.filter((item) => item.isIdle));
assert.deepEqual(summary.full, summary.filter((item) => item.isFull));

let reads = 0;
const manyProxies = Array.from({ length: 300 }, (_, i) => ({ id: `p-${i}`, raw: `socks5://host-${i}.test:1080` }));
const manyProfiles = Array.from({ length: 3000 }, (_, i) => ({
  id: `env-${i}`, get proxy() { reads += 1; return `host-${i % 300}.test:1080`; },
}));
const indexed = summarizeProxyUsage(manyProxies, manyProfiles);
assert.ok(reads < manyProfiles.length * 10, `profile reads must scale with profiles, got ${reads}`);
assert.ok(indexed.every((row) => row.count === 10));
manyProfiles[0].proxyId = 'p-1';
assert.equal(summarizeProxyUsage(manyProxies, manyProfiles)[0].count, 9, 'in-place edits invalidate the next snapshot naturally');
console.log('PROXY_USAGE_INDEX_SELFTEST OK (matching parity, output shape, linear snapshot reads, edits)');

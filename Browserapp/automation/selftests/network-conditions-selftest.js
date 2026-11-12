'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const values = require('../../shared/profile-values');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { applyNetworkConditions } = require('../../engine/network-conditions');

(async () => {
  const filename = require.resolve('../../ui/ui-editor.js'), source = fs.readFileSync(filename, 'utf8');
  const context = vm.createContext({ window: { OpenBrowserProfileValues: values }, positiveProfileNumber: () => null });
  vm.runInContext(source.slice(0, source.indexOf('function editorDraft(')), context, { filename });
  for (const missing of [null, undefined, '', ' ', false, {}, Infinity, NaN]) {
    const raw = { offline: false, latency: 80, downloadThroughput: missing, uploadThroughput: missing };
    const expected = { offline: false, latency: 80, downloadThroughput: null, uploadThroughput: null };
    const profile = { id: 'network-conditions', name: 'Network', privacy: { networkConditions: raw } };
    assert.deepEqual(values.normalizeNetworkConditions(raw), expected);
    const saved = sanitizeProfile(JSON.parse(JSON.stringify(profile)));
    assert.deepEqual(saved.privacy.networkConditions, expected);
    const restored = context.normalizeProfileSettings(saved);
    assert.deepEqual(restored.privacy.networkConditions, expected);
    assert.equal(context.fpSeedText(restored.privacy.networkConditions.downloadThroughput), '');
    const calls = [];
    await applyNetworkConditions(async (method, params) => { calls.push({ method, params }); }, raw);
    assert.deepEqual(calls[1].params, { offline: false, latency: 80, downloadThroughput: -1, uploadThroughput: -1 });
  }
  for (const raw of [null, {}, [], { offline: false, latency: '', uploadThroughput: null }]) assert.equal(values.normalizeNetworkConditions(raw), null);
  const calls = [];
  await applyNetworkConditions(async (_method, params) => calls.push(params), { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: '0' });
  assert.deepEqual(calls[1], { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await applyNetworkConditions(async (_method, params) => calls.push(params), null);
  assert.deepEqual(calls[3], { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }, 'clearing settings restores the native network');
  for (const command of ['Network.enable', 'Network.emulateNetworkConditions']) {
    await assert.rejects(applyNetworkConditions(async (method) => { if (method === command) throw new Error('unsupported'); }, { offline: true }),
      { code: 'NETWORK_CONDITIONS_APPLY_FAILED' });
  }
  const firefox = require('../../engine/start-firefox');
  await assert.rejects(firefox._startFirefox.call({
    sanitizeProfile, resolveStoredProxyProfile: (value) => value, profiles: new Map(), running: new Map(), assertStartGenerationActive() {},
  }, { id: 'firefox-network', name: 'Firefox', privacy: { networkConditions: { offline: true } } }), { code: 'NETWORK_CONDITIONS_UNSUPPORTED' });
  console.log('NETWORK_CONDITIONS_SELFTEST OK (save/load/editor, invalid values, zero, unlimited, reset, protocol failure, Firefox capability gate)');
})().catch((error) => { console.error(error); process.exitCode = 1; });

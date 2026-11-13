'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { BoundedLru } = require('../bounded-lru');
const { buildFingerprint, buildInjectionScript } = require('../fingerprint');
const { injectSourceKeyCached, injectionCacheKeyFor } = require('../fingerprint/injection-script');
const { createTextMetricJitterCache } = require('../fingerprint/runtime/text-metrics-cache');
const { createAudioWriteTracker } = require('../fingerprint/runtime/audio-write-tracker');
const { captureImageEncodeOptions } = require('../fingerprint/native-arguments');

const audioWrites = createAudioWriteTracker(), audioBuffer = {};
for (let i = 0; i < 100000; i++) audioWrites.record(audioBuffer, 0, i % 8, 8, 64);
assert.deepEqual(audioWrites.spansFor(audioBuffer, 0), [[0, 15]], 'repeated overlapping writes retain one merged span');
audioWrites.record(audioBuffer, 0, 40, 4, 64);
audioWrites.record(audioBuffer, 0, 60, 50, 64);
assert.equal(audioWrites.contains(audioWrites.spansFor(audioBuffer, 0), 20), false);
assert.equal(audioWrites.contains(audioWrites.spansFor(audioBuffer, 0), 63), true, 'writes are clipped to the native buffer boundary');
audioWrites.record(audioBuffer, 1, 0, 8, 64);
audioWrites.finish(audioBuffer, 0);
for (let i = 0; i < 100000; i++) audioWrites.record(audioBuffer, 0, 0, 64, 64);
assert.equal(audioWrites.spansFor(audioBuffer, 0), null, 'processed channels never retain later writes');
assert.equal(audioWrites.isProcessed(audioBuffer, 0), true);
assert.deepEqual(audioWrites.spansFor(audioBuffer, 1), [[0, 8]], 'channels have independent lifetimes');

const accesses = [];
const encodeOptions = Object.freeze({
  get quality() { assert.equal(this, encodeOptions); accesses.push('quality'); return { valueOf() { accesses.push('number'); return 0.8; } }; },
  type: Object.freeze({ toString() { accesses.push('type'); return 'image/png'; } }),
});
const encoding = captureImageEncodeOptions(encodeOptions);
const convert = (options) => ({ quality: +options.quality, type: `${options.type}` });
assert.deepEqual(convert(encoding.options), { quality: 0.8, type: 'image/png' });
assert.deepEqual(convert(encoding.replay), { quality: 0.8, type: 'image/png' });
assert.deepEqual(accesses, ['quality', 'number', 'type'], 'frozen dictionary members are converted once with their original receiver');

const textCache = createTextMetricJitterCache('https://example.test', 'test-seed');
const expectedJitter = (font, text) => {
  const key = 'https://example.test:test-seed:' + font + ':' + text;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  return { jitter: (hash % 100) / 10000, widthJitter: ((hash % 200) - 100) / 10000 };
};
const hotText = textCache.get('16px sans-serif', 'Repeated label');
assert.equal(textCache.get('16px sans-serif', 'Repeated label'), hotText, 'short repeated labels reuse cached jitter');
assert.deepEqual(hotText, expectedJitter('16px sans-serif', 'Repeated label'), 'cache changes preserve existing string fingerprints');
for (let i = 0; i < 1024; i++) textCache.get('16px sans-serif', 'x'.repeat(2048) + i);
assert.ok(textCache.bytes <= 256 * 1024 && textCache.size < 512, 'long strings are limited by retained bytes before the entry ceiling');
const retainedBytes = textCache.bytes, retainedEntries = textCache.size;
const hugeText = 'large'.repeat(100000);
assert.deepEqual(textCache.get('16px sans-serif', hugeText), expectedJitter('16px sans-serif', hugeText));
assert.equal(textCache.bytes, retainedBytes); assert.equal(textCache.size, retainedEntries, 'oversized texts cannot evict or occupy the hot cache');
assert.deepEqual(textCache.get('16px sans-serif', 'Repeated label'), hotText, 'eviction never changes deterministic output');
assert.notEqual(textCache.get('a\0b', 'c'), textCache.get('a', 'b\0c'), 'font/text separators cannot alias cache entries');

const cache = new BoundedLru({ maxEntries: 2, maxBytes: 24, sizeOf: (value) => value.length * 2 });
cache.set('a', '1234'); cache.set('b', '5678');
assert.equal(cache.get('a'), '1234');
cache.set('c', '90');
assert.equal(cache.get('b'), undefined, 'least recently used value is evicted');
assert.ok(cache.bytes <= 24 && cache.size <= 2);
assert.equal(cache.set('a', 'x'.repeat(20)), false, 'oversized replacements are not retained');
assert.equal(cache.get('a'), undefined, 'oversized replacement cannot leave an old value');
assert.throws(() => new BoundedLru({ maxEntries: 0, maxBytes: 1, sizeOf: () => 1 }), TypeError);
cache.clear(); assert.equal(cache.bytes, 0); assert.equal(cache.size, 0);

function make(extra = {}) {
  return { ...buildFingerprint({ id: 'cache-contract', os: 'Windows', privacy: { deviceProfile: 'persona' } }),
    bridgeChannel: 'custom_font_channel', ...extra };
}
const cold = make(), first = buildInjectionScript(cold);
const hot = make();
assert.equal(buildInjectionScript(hot), first);
assert.deepEqual(hot.fontBlobBridge, cold.fontBlobBridge, 'a hit restores the same host channel contract as a cold build');
hot.fontBlobBridge.channelName = 'caller mutation';
const another = make(); buildInjectionScript(another);
assert.equal(another.fontBlobBridge.channelName, 'custom_font_channel', 'callers cannot mutate cached bridge metadata');
const metadataOnly = make({ bridgeChannel: '' });
metadataOnly.fontBlobBridge.channelName = 'metadata_channel';
buildInjectionScript(metadataOnly);
const defaultChannel = make({ bridgeChannel: '' });
const expectedChannel = defaultChannel.fontBlobBridge.channelName;
buildInjectionScript(defaultChannel);
assert.equal(defaultChannel.fontBlobBridge.channelName, expectedChannel, 'metadata-only channels cannot contaminate another caller with the same fingerprint');
buildInjectionScript(another, { livePatch: true });
assert.equal(another.fontBlobBridge.channelName, 'custom_font_channel', 'live patches leave the full bridge policy intact');
for (let i = 0; i < 2; i++) {
  const nonLazy = make({ lazyPayload: false });
  buildInjectionScript(nonLazy);
  assert.equal(nonLazy.fontBlobBridge, null, 'both cold and warm opt-outs disable the bridge');
}
const original = process.env.OPENBROWSER_FP_TELEMETRY;
try {
  process.env.OPENBROWSER_FP_TELEMETRY = '0';
  const fp = make({ fonts: null });
  const off = buildInjectionScript(fp), offKey = injectionCacheKeyFor(fp);
  process.env.OPENBROWSER_FP_TELEMETRY = '1';
  const on = buildInjectionScript(fp), onKey = injectionCacheKeyFor(fp);
  assert.notEqual(on, off); assert.notEqual(onKey, offKey);
  assert.ok(on.includes('"telemetry":true') && off.includes('"telemetry":false'));
  const digest = (source) => crypto.createHash('sha1').update(source).digest('hex').slice(0, 16);
  assert.equal(injectSourceKeyCached(onKey, on), digest(on));
  assert.equal(injectSourceKeyCached(onKey, 'different source'), digest('different source'), 'a reused key cannot return a digest for different bytes');
} finally {
  if (original === undefined) delete process.env.OPENBROWSER_FP_TELEMETRY;
  else process.env.OPENBROWSER_FP_TELEMETRY = original;
}
console.log('INJECTION_CACHE_SELFTEST OK (bounded LRU, warm metadata, caller isolation, opt-outs, live variants, telemetry, source digests)');

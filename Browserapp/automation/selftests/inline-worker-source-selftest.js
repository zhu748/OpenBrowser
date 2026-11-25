'use strict';

const assert = require('node:assert/strict');
const { inlineWorkerSourceTools } = require('../inline-worker-source');
const { buildFirefoxFingerprint } = require('../firefox-fingerprint');
const { buildInjectionScript, buildWorkerInjectionScript } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

async function main() {
  const tools = inlineWorkerSourceTools(URL, TextEncoder, TextDecoder, Uint8Array, atob, 'chromium');
  const sources = [
    'data:application/javascript,postMessage("Caf%C3%A9")',
    'data:application/javascript,postMessage("%FF")',
    'data:application/javascript,postMessage("%zz")',
    'data:application/javascript,%EF%BB%BFpostMessage(1)',
    'data:application/javascript; BASE64,cG9zdE1lc3NhZ2UoMSk=',
    'data:text/plain; charset=windows-1252,caf%C3%A9',
    'data:,question?mark#fragment',
    'data:application/javascript;base64,%%%'
  ];
  sources.push('data:application/javascript,' + Array.from({ length: 256 }, (_, i) => '%' + i.toString(16).padStart(2, '0')).join(''));
  for (const url of sources) {
    let response;
    try { response = await fetch(url); }
    catch (_) { assert.equal(tools.readData(url), null, 'invalid data stays a native load failure');continue; }
    assert.equal(tools.readData(url).text, await response.text(), 'worker decoding matches the native data URL processor: ' + url);
  }
  for (const raw of ['DATA:text/plain,one', ' \tdata:text/plain,two\n', 'da\tta:text/plain,three', '\0data:,four']) {
    assert.equal(tools.resolve(raw), new URL(raw).href);
  }
  const gecko = inlineWorkerSourceTools(URL, TextEncoder, TextDecoder, Uint8Array, atob, 'firefox', '159.0');
  assert.equal(gecko.resolve('da\tta:text/plain,one'), null, 'delegate Gecko scheme errors to its Worker constructor');
  assert.equal(gecko.resolve('BLOB:https://example.test/id'), null, 'do not turn Gecko native Blob load errors into executable sources');
  assert.equal(gecko.resolve('DATA:text/plain,one'), 'data:text/plain,one');
  const gecko160 = inlineWorkerSourceTools(URL, TextEncoder, TextDecoder, Uint8Array, atob, 'firefox', '160.0');
  assert.equal(gecko160.resolve('BLOB:https://example.test/id'), 'blob:https://example.test/id');
  assert.equal(gecko160.resolve('da\tta:text/plain,one'), null);
  assert.equal(tools.resolve('/relative-worker.js'), null, 'ordinary URLs keep their native base URL resolution');
  assert.equal(tools.resolve('https://example.test/worker.js'), null);
  const profile = sanitizeProfile({ id: 'native-version-cache', name: 'Native version cache', engine: 'firefox',
    os: 'Windows', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:160.0) Gecko/20100101 Firefox/160.0',
    fingerprintSeed: 'native-version-cache', privacy: { fontListMode: 'real' } });
  const first = buildFirefoxFingerprint(profile, '160.0.1'), second = buildFirefoxFingerprint(profile, '160.0.2');
  assert.equal(first.userAgent, second.userAgent, 'the pinned UA does not identify the native patch version');
  for (const build of [buildInjectionScript, buildWorkerInjectionScript]) {
    const older = build(first), newer = build(second);
    assert.notEqual(older, newer, 'cached source must follow the actual kernel even with an unchanged UA');
    assert.ok(older.includes('"kernelVersion":"160.0.1"') && newer.includes('"kernelVersion":"160.0.2"'));
  }
  console.log('INLINE_WORKER_SOURCE OK (native fetch decoding, malformed bytes, MIME metadata, base64 and per-engine URL contracts)');
}

main().catch(error => { console.error(error);process.exitCode = 1; });

'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { injectWorkerSource, isJavaScriptMime } = require('../worker-source');
const { WorkerScriptPrefixer } = require('../worker-script-prefixer');

async function main() {
  for (const mime of ['text/javascript', 'text/javascript1.5', 'text/jscript', 'application/x-ecmascript; charset=utf-8']) assert.ok(isJavaScriptMime(mime));
  for (const mime of ['text/plain', 'application/json', 'text/javascript-invalid']) assert.equal(isJavaScriptMime(mime), false);
  const read = 'globalThis.strict=(function(){return this})()===undefined;';
  for (const source of [read, '"use strict";' + read, '#!worker\r\n"use strict"\n' + read,
    '/* comment */ "first";\n"use strict";\n' + read, '"use strict"\n+1;\n' + read,
    '"use strict"; ;"second";' + read, '"first"\n"use strict"\n' + read]) {
    const native = {}, patched = {};
    vm.runInNewContext(source, native);
    vm.runInNewContext(injectWorkerSource(source, 'globalThis.installed=true;').toString(), patched);
    assert.equal(patched.strict, native.strict, 'original directive semantics');
    assert.equal(patched.installed, true);
  }
  for (const source of ['"use strict"; with({}){}', '"use strict" missingSeparator()', '"unterminated', 'let = ;']) {
    assert.throws(() => new vm.Script(source));
    assert.throws(() => new vm.Script(injectWorkerSource(source, 'globalThis.installed=true;').toString()), 'do not repair malformed programs');
  }
  const original = '"use strict";globalThis.first=globalThis.installed;';
  const event = (id, extra = {}) => ({ sessionId: 's', params: { requestId: id, resourceType: 'Other',
    request: { url: 'https://example.invalid/worker.js' }, responseStatusCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' },
      { name: 'Content-Security-Policy', value: "connect-src 'none'" },
      { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'ETag', value: 'old' }], ...extra } });
  const prefixer = new WorkerScriptPrefixer({ source: 'globalThis.installed=true;' });
  const calls = [];
  let release;
  const connection = { command: async (method, params) => {
    calls.push({ method, params });
    if (method === 'Fetch.getResponseBody') return new Promise((resolve) => { release = () => resolve({ body: original }); });
    return {};
  } };
  const first = event('first'); prefixer.track(first);
  const a = prefixer.handlePaused(first, connection), b = prefixer.handlePaused(first, connection);
  assert.equal(a, b, 'duplicate response shares its operation');
  await Promise.resolve(); release(); await a;
  assert.equal(calls.filter((c) => c.method === 'Fetch.getResponseBody').length, 1);
  const fulfilled = calls.find((c) => c.method === 'Fetch.fulfillRequest').params;
  assert.equal(fulfilled.responseHeaders.find((h) => h.name === 'Content-Security-Policy').value, "connect-src 'none'");
  assert.equal(fulfilled.responseHeaders.find((h) => h.name === 'Access-Control-Allow-Origin').value, '*');
  assert.equal(fulfilled.responseHeaders.some((h) => h.name === 'ETag'), false);
  const context = {};
  vm.runInNewContext(Buffer.from(fulfilled.body, 'base64').toString(), context);
  assert.equal(context.first, true);
  assert.deepEqual(Object.keys(context).filter((key) => key.startsWith('__ob')), []);

  for (const extra of [{ resourceType: 'Script' }, { responseStatusCode: 302 }, { responseStatusCode: 404 },
    { responseHeaders: [{ name: 'Content-Type', value: 'image/png' }] },
    { responseStatusCode: undefined, responseErrorReason: 'Failed' }]) {
    const request = event('pass-' + calls.length, extra); prefixer.track(request);
    const before = calls.length; await prefixer.handlePaused(request, connection);
    assert.deepEqual(calls.slice(before).map((c) => c.method), ['Fetch.continueRequest'], 'release non-worker and failed responses');
  }
  const late = event('late'); prefixer.track(late);
  const before = calls.length, pending = prefixer.handlePaused(late, connection);
  await Promise.resolve(); prefixer.cleanupSession('s'); release(); await pending;
  assert.deepEqual(calls.slice(before).map((c) => c.method), ['Fetch.getResponseBody'], 'detached session cannot fulfill late');
  const broken = event('broken'); prefixer.track(broken);
  const failed = [];
  await assert.rejects(prefixer.handlePaused(broken, { command: async (method) => {
    failed.push(method);
    if (method === 'Fetch.getResponseBody') throw new Error('Can only get response body after response stage');
    return {};
  } }));
  assert.deepEqual(failed, ['Fetch.getResponseBody', 'Fetch.failRequest']);
  const created = event('created', { responseStatusCode: 201 }); prefixer.track(created);
  const createdCalls = [];
  await prefixer.handlePaused(created, { command: async (method, params) => {
    createdCalls.push({ method, params }); return { body: original };
  } });
  assert.equal(createdCalls.at(-1).method, 'Fetch.fulfillRequest');
  assert.equal(createdCalls.at(-1).params.responseCode, 201);
  const partial = event('partial', { responseStatusCode: 206 }); prefixer.track(partial);
  const partialCalls = [];
  await assert.rejects(prefixer.handlePaused(partial, { command: async (method) => { partialCalls.push(method); return {}; } }), /Partial worker/);
  assert.deepEqual(partialCalls, ['Fetch.failRequest']);
  const rejected = event('network-error', { networkId: 'network-1' }); prefixer.track(rejected);
  prefixer.cleanupFailedRequest({ sessionId: 's', params: { requestId: 'network-1' } });
  assert.equal(prefixer.hasTracked(rejected), false, 'network failure releases speculative request tracking');
  prefixer.destroy();
  assert.equal(prefixer.requestStage.size + prefixer.inFlight.size + prefixer.fulfilledUrls.size, 0);
  console.log('PASS network worker directives, native syntax errors, security headers, duplicate events, detach and failure cleanup');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

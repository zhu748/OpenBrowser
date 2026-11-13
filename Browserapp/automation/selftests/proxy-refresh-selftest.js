'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const requests = [], messages = [];
let renders = 0;
const scope = {
  window: { ops: { proxyList(...args) {
    assert.equal(args.length, 0, 'a view search cannot narrow the shared proxy library');
    return new Promise((resolve, reject) => requests.push({ resolve, reject }));
  } } },
  proxyLibrary: [{ id: 'kept' }], loadedViews: new Set(),
  $: (selector) => selector === '#proxy-search' ? { value: 'narrow' } : null,
  document: { getElementById: () => null },
  renderProxyLibrarySelectors() { renders++; }, afterUiRender() {},
  toast: (message) => messages.push(message), tx: (value) => value,
};
vm.runInNewContext(fs.readFileSync(require.resolve('../../ui/ui-proxy'), 'utf8'), scope);
async function main() {
  const old = scope.refreshProxies(), current = scope.refreshProxies();
  const latest = [{ id: 'alpha' }, { id: 'beta' }];
  requests[1].resolve(latest); assert.equal(await current, true);
  requests[0].resolve([{ id: 'stale' }]); assert.equal(await old, false);
  assert.equal(scope.proxyLibrary, latest);
  assert.equal(renders, 1, 'an old reply cannot replace newer selectors');
  const failing = scope.refreshProxies(); requests.at(-1).reject(new Error('offline'));
  assert.equal(await failing, false);
  assert.equal(scope.proxyLibrary, latest, 'network failures preserve the last complete inventory');
  assert.equal(scope.loadedViews.has('proxies'), false, 'a failed read remains retryable');
  const invalid = scope.refreshProxies(); requests.at(-1).resolve([null]);
  assert.equal(await invalid, false); assert.equal(scope.proxyLibrary, latest);
  const staleFailure = scope.refreshProxies(), recovery = scope.refreshProxies();
  requests.at(-1).resolve(latest); await recovery;
  const count = messages.length;
  requests.at(-2).reject(new Error('stale failure')); await staleFailure;
  assert.equal(messages.length, count, 'stale failures do not overwrite a successful refresh');
  assert.equal(scope.loadedViews.has('proxies'), true);
  console.log('PROXY_REFRESH_SELFTEST OK (complete inventory, out-of-order replies, last-good state, retry and stale failures)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

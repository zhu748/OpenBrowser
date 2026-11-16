'use strict';

// Serialized unchanged into each real browser, before and after installation.
async function probeInlineWorkerSources() {
  const results = {};
  const snapshot = '({cores:navigator.hardwareConcurrency,ua:navigator.userAgent,strict:(function(){return this})()===undefined,url:location.href,value:"Café €",markers:Object.getOwnPropertyNames(self).filter(k=>/^__ob/.test(k))})';
  const source = 'postMessage(' + snapshot + ')';
  const data = text => 'data:application/javascript,' + encodeURIComponent(text);
  const blob = (text, type = 'application/javascript') => URL.createObjectURL(new Blob([text], { type }));
  const cases = [
    ['data', () => data(source)],
    ['data-upper', () => data(source).replace('data:', 'DATA:')],
    ['data-leading-space', () => ' \t' + data(source) + '\n'],
    ['data-inner-tab', () => data(source).replace('data:', 'da\tta:\n')],
    ['data-null-space', () => '\0' + data(source)],
    ['data-form-feed', () => '\f' + data(source)],
    ['data-body-newline', () => 'data:application/javascript,\n' + encodeURIComponent(source)],
    ['data-utf8-invalid', () => data(source).replace('Caf%C3%A9', '%FF')],
    ['data-percent-literal', () => data(source).replace('Caf%C3%A9', '%zz')],
    ['data-plain', () => 'data:text/plain,' + encodeURIComponent(source)],
    ['data-base64', () => 'data:application/javascript;base64,' + btoa(unescape(encodeURIComponent(source)))],
    ['data-base64-space', () => 'data:application/javascript; BASE64,' + btoa(unescape(encodeURIComponent(source)))],
    ['data-base64-invalid', () => 'data:application/javascript;base64,%%%'],
    ...['\n', '\r', '\r\n', '\u2028', '\u2029'].map((line, i) => ['hashbang-' + i, () => data('#!worker' + line + '"use strict";' + source)]),
    ...['application/javascript', 'text/plain', '', 'text/javascript; charset=windows-1252'].map((type, i) => ['blob-mime-' + i, () => blob(source, type)]),
    ['blob-upper', () => blob(source).replace('blob:', 'BLOB:')],
    ...['application/javascript', 'text/plain', '', 'text/javascript; charset=windows-1252'].map((type, i) => ['blob-module-mime-' + i, () => blob(source, type), 'module']),
    ['data-module-plain', () => 'data:text/plain,' + encodeURIComponent(source), 'module'],
    ['data-module', () => data(source), 'module'],
    ['module-dependency-cr', () => blob('#!worker\r"use strict";import {first} from '
      + JSON.stringify(data('export const first=' + snapshot)) + ';postMessage({...first,moduleUrl:import.meta.url})'), 'module'],
    ['malformed-program', () => data('"use strict";let = ;')],
    ['nested-data-upper', () => blob('const w=new Worker(' + JSON.stringify(data(source).replace('data:', 'DATA:'))
      + ');w.onmessage=e=>{w.terminate();postMessage(e.data)};w.onerror=()=>postMessage({failed:true});')],
    ['nested-blob-upper', () => blob('const url=URL.createObjectURL(new Blob([' + JSON.stringify(source)
      + '],{type:"application/javascript"})).replace("blob:","BLOB:");const w=new Worker(url);'
      + 'w.onmessage=e=>{w.terminate();URL.revokeObjectURL(url);postMessage(e.data)};'
      + 'w.onerror=e=>{e.preventDefault();URL.revokeObjectURL(url);throw Error("Nested Blob load failed")};')],
  ];
  const run = (factory, type = 'classic', shared = false) => new Promise(resolve => {
    let worker, url, timer;
    const finish = value => {
      clearTimeout(timer);if (shared) worker?.port.close();else worker?.terminate();
      if (url && /^blob:/i.test(url)) URL.revokeObjectURL(url);
      resolve(value);
    };
    try {
      url = factory();
      worker = shared ? new SharedWorker(url, { type }) : new Worker(url, { type });
      const port = shared ? worker.port : worker;
      port.onmessage = e => finish({ status: 'message', ...e.data });
      worker.onerror = e => { e.preventDefault();finish({ status: 'error' }); };
      if (shared) port.start();
      timer = setTimeout(() => finish({ status: 'timeout' }), 5000);
    } catch (error) { finish({ status: 'throw', name: error.name }); }
  });
  for (const [name, factory, type] of cases) results[name] = await run(factory, type);
  if (typeof SharedWorker === 'function') {
    const shared = 'const first=' + snapshot + ';self.onconnect=e=>e.ports[0].postMessage(first);';
    results['shared-blob-upper'] = await run(() => blob(shared).replace('blob:', 'BLOB:'), 'classic', true);
    results['shared-data-upper'] = await run(() => data(shared).replace('data:', 'DATA:'), 'classic', true);
    results['shared-hashbang-cr'] = await run(() => blob('#!worker\r"use strict";' + shared), 'classic', true);
    results['shared-module-plain'] = await run(() => blob(shared, 'text/plain'), 'module', true);
  }

  // Native Worker loading never calls page-writable XHR/codec/URL methods.
  // Installation must capture those intrinsics before page code can wrap them.
  const restore = [], reads = {};
  const wrap = (prototype, key) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    if (!descriptor?.configurable) return;
    const field = descriptor.get ? 'get' : 'value', original = descriptor[field];
    if (typeof original !== 'function') return;
    reads[key] = 0;
    Object.defineProperty(prototype, key, { ...descriptor, [field]: function(...args) {
      reads[key]++;return Reflect.apply(original, this, args);
    } });
    restore.push(() => Object.defineProperty(prototype, key, descriptor));
  };
  try {
    for (const key of ['open', 'send', 'getResponseHeader', 'overrideMimeType', 'status', 'responseText']) wrap(XMLHttpRequest.prototype, key);
    wrap(TextEncoder.prototype, 'encode');wrap(TextDecoder.prototype, 'decode');
    wrap(URL.prototype, 'href');wrap(URL.prototype, 'protocol');
    results['captured-data'] = await run(() => data(source));
    results['captured-blob'] = await run(() => blob(source, 'text/javascript; charset=windows-1252'));
  } finally { for (const undo of restore.reverse()) undo(); }
  return { results, reads };
}

function verifyInlineWorkerSources(actual, native, fingerprint, label) {
  const assert = require('node:assert/strict');
  assert.deepEqual(Object.keys(actual.results), Object.keys(native.results), label + ' all native cases ran');
  for (const [name, control] of Object.entries(native.results)) {
    const value = actual.results[name], message = label + ' ' + name;
    assert.notEqual(control.status, 'timeout', message + ' native control must settle');
    assert.equal(value.status, control.status, message + ' retains native loading outcome');
    if (control.status === 'throw') assert.equal(value.name, control.name, message + ' native exception');
    if (control.status !== 'message') continue;
    assert.equal(value.cores, fingerprint.hardwareConcurrency, message + ' first-read cores');
    assert.equal(value.ua, fingerprint.userAgent, message + ' first-read UA');
    assert.equal(value.value, control.value, message + ' UTF-8 source value');
    assert.equal(value.strict, control.strict, message + ' strict semantics');
    assert.deepEqual(value.markers, [], message + ' no public installation markers');
    if (control.url.startsWith('data:')) assert.equal(value.url, control.url, message + ' original WorkerLocation');
    if (control.moduleUrl) assert.equal(value.moduleUrl, value.url, message + ' original import.meta.url');
  }
  assert.ok(Object.values(native.reads).every(count => count === 0), label + ' native intrinsic control');
  assert.deepEqual(actual.reads, native.reads, label + ' page callbacks are not invoked by private loading');
}

module.exports = { probeInlineWorkerSources, verifyInlineWorkerSources };

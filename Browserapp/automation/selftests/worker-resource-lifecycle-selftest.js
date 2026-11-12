'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { Blob, resolveObjectURL } = require('node:buffer');
const { webcrypto } = require('node:crypto');
const { installerSource } = require('../fingerprint/runtime/worker-constructor-patch');

async function main() {
  const created = [], originals = new Map();
  class FixtureURL extends URL {}
  FixtureURL.createObjectURL = (blob) => {
    const url = URL.createObjectURL(blob); created.push(url); return url;
  };
  FixtureURL.revokeObjectURL = (url) => URL.revokeObjectURL(url);
  class LocalXHR {
    open(_method, url) { this.url = String(url); }
    send() {
      if (!originals.has(this.url)) throw new DOMException('missing local blob', 'NetworkError');
      this.status = 200; this.responseText = originals.get(this.url);
    }
  }
  class FixtureWorker extends EventTarget {
    constructor(url, options = {}) {
      super();
      this.url = `${url}`;
      if (options.type && !['classic', 'module'].includes(options.type)) throw new TypeError('invalid type');
    }
    terminate() { this.stopped = true; }
  }
  const scope = vm.createContext({ Blob, URL: FixtureURL, XMLHttpRequest: LocalXHR, Worker: FixtureWorker,
    EventTarget, Event, MessageEvent, DOMException, TextDecoder, Uint8Array, Uint32Array,
    WeakRef, crypto: webcrypto, console, nativeLike: (proxy) => proxy });
  vm.runInContext(`{
    const original = Function.prototype.toString;
    let registry;
    Function.prototype.toString = function(...args) {
      if(args[0]==='fixture' && args[1]==='sharedWorkers') {
        if(args[2]) registry=args[2]; return registry;
      }
      return original.apply(this,args);
    };
  }`, scope);
  vm.runInContext(`(${installerSource})('(function installWorkerIdentity(){})', nativeLike, 'fixture')`, scope);
  const allocate = (source) => {
    const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
    originals.set(url, source); return url;
  };
  const original = allocate('postMessage(import.meta.url)');
  const start = created.length;
  scope.entry = original;
  vm.runInContext("globalThis.worker = new Worker(entry,{type:'module'});", scope);
  const resources = created.slice(start);
  assert.equal(resources.length, 2, 'one entry URI and one module installation URI');
  assert.ok(resolveObjectURL(resources[0]), 'module prefix must survive until load or termination');
  assert.equal(resolveObjectURL(resources[1]), undefined, 'native constructor captured the entry URI');
  vm.runInContext('worker.terminate()', scope);
  assert.ok(resources.every((url) => !resolveObjectURL(url)), 'termination releases pending prefix resources');
  vm.runInContext('worker.terminate()', scope);

  const loadedAt = created.length;
  vm.runInContext("globalThis.loaded = new Worker(entry,{type:'module'})", scope);
  const loadedResources = created.slice(loadedAt);
  const prefix = await resolveObjectURL(loadedResources[0]).text();
  const signal = JSON.parse(prefix.match(/\n;postMessage\((\{"ready":"[a-f0-9-]+"\})\);$/)[1]);
  let publicMessages = 0;
  scope.loaded.addEventListener('message', () => publicMessages++);
  scope.loaded.dispatchEvent(new MessageEvent('message', { data: signal }));
  assert.ok(loadedResources.every((url) => !resolveObjectURL(url)), 'successful initialization releases module helper resources');
  assert.equal(publicMessages, 0, 'private initialization message stays private');
  scope.loaded.dispatchEvent(new MessageEvent('message', { data: { ready: 'user-message' } }));
  assert.equal(publicMessages, 1, 'ordinary worker messages retain native delivery');

  const errorAt = created.length;
  vm.runInContext("globalThis.failed = new Worker(entry,{type:'module'})", scope);
  scope.failed.dispatchEvent(new Event('error'));
  assert.ok(created.slice(errorAt).every((url) => !resolveObjectURL(url)), 'native loading errors release pending module helpers');

  const failedAt = created.length;
  assert.throws(() => vm.runInContext("new Worker(entry,{type:'invalid'})", scope), /invalid type/);
  assert.ok(created.slice(failedAt).every((url) => !resolveObjectURL(url)), 'constructor rejection releases every generated URI');

  const classic = allocate('"use strict";postMessage(1)');
  scope.entry = classic;
  const classicAt = created.length;
  vm.runInContext('new Worker(entry).terminate()', scope);
  assert.ok(created.slice(classicAt).every((url) => !resolveObjectURL(url)), 'classic workers retain no helper URI');
  for (const url of originals.keys()) URL.revokeObjectURL(url);
  console.log('WORKER_RESOURCE_LIFECYCLE OK (module readiness/privacy, errors, early termination, failed construction, classic release)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

'use strict';

const constructors = require('./worker-constructor-patch').workerRuntime;

// The named installer can reconstruct itself without a public source hook.
// Rewritten inline workers retain the original, observable WorkerLocation.
module.exports = `
  if (typeof originalWorkerUrl === 'string' && typeof location === 'object') {
    try {
      const resolved = new URL(originalWorkerUrl);
      const proto = Object.getPrototypeOf(location);
      for (const key of ['href', 'origin', 'protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash']) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (!descriptor?.get || !descriptor.configurable) continue;
        const getter = new Proxy(descriptor.get, {
          apply(target, receiver, args) {
            const native = Reflect.apply(target, receiver, args);
            return receiver === location ? resolved[key] : native;
          },
        });
        nativeLike(getter, descriptor.get, descriptor.get.name, descriptor.get.length, true);
        Object.defineProperty(proto, key, { ...descriptor, get: getter });
      }
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'toString');
      if (typeof descriptor?.value === 'function') {
        const original = descriptor.value;
        const method = new Proxy(original, {
          apply(target, receiver, args) {
            const native = Reflect.apply(target, receiver, args);
            return receiver === location ? resolved.href : native;
          },
        });
        nativeLike(method, original, original.name, original.length, true);
        Object.defineProperty(proto, 'toString', { ...descriptor, value: method });
      }
    } catch (_) {}
  }
` + constructors;

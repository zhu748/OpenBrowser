'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const ua = require('../user-agent');
const { sanitizeInjectionScript } = require('../../engine/cdp-hardening');

const build = ua.buildUaInjectionScript;
const samples = ['windows', 'macos', 'linux', 'android', 'ios'].map((os) => ua.buildUaProfile({ os, seed: 1234 }));
const before = samples.map(build);
require('../../engine');
assert.equal(ua.buildUaInjectionScript, build, 'loading the engine does not replace the shared UA builder');
assert.deepEqual(samples.map(build), before, 'builder output does not depend on engine load order');

for (const profile of samples) {
  const source = build(profile);
  new vm.Script(source);
  assert.equal(sanitizeInjectionScript(source), source, 'the builder already emits the hardened form');
  for (const kind of ['Navigator', 'WorkerNavigator']) {
    const scope = vm.createContext({});
    vm.runInContext(`
      class ${kind} {}
      const navigator = new ${kind}();
      Object.defineProperty(${kind}.prototype, 'userAgent', { configurable: true, get() {
        if (!(this instanceof ${kind}) || this === ${kind}.prototype) throw new TypeError('Illegal invocation');
        return 'native';
      }});
    `, scope);
    vm.runInContext(source, scope);
    assert.equal(vm.runInContext('navigator.userAgent', scope), profile.userAgent);
    assert.equal(vm.runInContext(`typeof Function.prototype.toString.call(
      Object.getOwnPropertyDescriptor(${kind}.prototype, 'userAgent').get, 'arbitrary-secret')`, scope), 'string',
    'arbitrary strings do not expose the internal bridge');
    assert.equal(vm.runInContext(`typeof Function.prototype.toString.call(
      Object.getOwnPropertyDescriptor(${kind}.prototype, 'userAgent').get, '__UA_BRIDGE_TOKEN__')`, scope), 'string', 'fixed public token must not expose the private bridge');
    assert.throws(() => vm.runInContext(`Object.getOwnPropertyDescriptor(${kind}.prototype, 'userAgent').get.call(${kind}.prototype)`, scope),
      (error) => error.name === 'TypeError', 'prototype receiver still rejects illegal invocation');
  }
}
console.log('UA_BUILDER_SELFTEST OK (load order, 5 personas, Navigator/WorkerNavigator, bridge and receiver behavior)');

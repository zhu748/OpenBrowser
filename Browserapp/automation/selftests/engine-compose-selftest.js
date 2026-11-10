'use strict';

const assert = require('node:assert/strict');
const { installEngineModules } = require('../../engine/compose');
const { BrowserEngine } = require('../../engine');

const prototype = {};
const run = () => 'run';
const owners = installEngineModules(prototype, [['lifecycle', { run }]]);
assert.strictEqual(prototype.run, run);
assert.equal(owners.run, 'lifecycle');
assert.ok(Object.isFrozen(owners));
assert.throws(() => { owners.run = 'other'; }, TypeError);
assert.throws(() => installEngineModules(prototype, [['other', { run: () => {} }]]), /run.*BrowserEngine.*other/);
const untouched = {};
assert.throws(() => installEngineModules(untouched, [['first', { start: run }], ['second', { start: run }]]), /first.*second/);
assert.deepEqual(Reflect.ownKeys(untouched), [], 'all contributions are checked before any method is installed');
let getterCalled = false;
assert.throws(() => installEngineModules({}, [['unsafe', { get start() { getterCalled = true; return run; } }]]), /accessor/);
assert.equal(getterCalled, false, 'composition does not execute export getters');
assert.throws(() => installEngineModules({}, [['unsafe', { toString: run }]]), /collision/);
assert.throws(() => installEngineModules(Object.freeze({}), [['frozen', { run }]]), /not extensible/);
for (const [key, owner] of Object.entries(BrowserEngine.methodOwners)) {
  assert.strictEqual(BrowserEngine.prototype[key], require('../../engine/' + owner)[key], 'real engine contribution identity: ' + key);
}
assert.equal(BrowserEngine.methodOwners.sessions, 'session-api');
assert.equal(BrowserEngine.methodOwners.persist, 'persistence');
console.log('ENGINE_COMPOSE_SELFTEST OK (identity, ownership, collision preflight, getters and complete engine registry)');

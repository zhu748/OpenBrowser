'use strict';

const assert = require('node:assert/strict');
const { cloneVariableValue, snapshotVariables, interpolate, getVariableValue, resolveConditionValue } = require('../rpa/variables');
const { RpaEngine } = require('../rpa-engine');

const initialVariables = (task) => RpaEngine.prototype.initialVariables.call({}, task);
const template = { process_content: { nodes: [{ type: 'startNode', globalVariable: [
  { key: 'rows', value: [{ count: 1 }] },
  { key: 'constructor', value: 'user-defined' },
  { key: '__proto__', value: { count: 2 } },
] }] } };
const firstTask = initialVariables(template);
const secondTask = initialVariables(template);
firstTask.rows[0].count = 99;
assert.equal(secondTask.rows[0].count, 1, 'start-node objects must be detached for each task');
assert.equal(template.process_content.nodes[0].globalVariable[0].value[0].count, 1, 'the installed template stays unchanged');
assert.equal(firstTask.constructor, 'user-defined', 'prototype member names are valid variable names');
assert.equal(Object.hasOwn(firstTask, '__proto__'), true);
assert.equal(Object.getPrototypeOf(firstTask), null, 'variable writes cannot change the dictionary prototype');
const specialTask = initialVariables({ variables: JSON.parse('{"__proto__":{"flag":true},"constructor":7}') });
assert.equal(Object.getPrototypeOf(specialTask), null);
assert.equal(Object.hasOwn(specialTask, '__proto__'), true);
assert.equal(specialTask.constructor, 7);
const priority = initialVariables({ ...template, variables: { rows: ['explicit'], constructor: 'explicit' } });
assert.deepEqual(priority.rows, ['explicit']);
assert.equal(priority.constructor, 'explicit');
assert.equal(interpolate('${constructor}/${toString}/${__proto__}', {}), '//', 'missing variables never resolve through Object.prototype');
assert.equal(getVariableValue('${constructor}', {}), undefined);
assert.equal(resolveConditionValue('${toString}', {}), undefined);

const original = { nested: [{ value: 1 }] };
const copy = cloneVariableValue(original);
copy.nested[0].value = 2;
assert.equal(original.nested[0].value, 1);
const cycle = { nested: { value: 1 } }; cycle.self = cycle;
const detached = cloneVariableValue(cycle);
assert.equal(detached.self, detached);
detached.nested.value = 2;
assert.equal(cycle.nested.value, 1, 'cyclic variables cannot leak changes between tasks');
cycle.callback = () => 'value';
const withFunction = cloneVariableValue(cycle);
assert.equal(withFunction.self, withFunction);
withFunction.nested.value = 3;
assert.equal(cycle.nested.value, 1, 'cyclic objects with callable leaves also detach');
const bigint = cloneVariableValue({ value: 1n });
assert.equal(bigint.value, 1n);
assert.equal(interpolate('${ user }/${missing}/${count}', { user: 'A', count: 0 }), 'A//0');
assert.deepEqual(getVariableValue(['${count}', 'hello ${user}'], { count: 2, user: 'A' }), [2, 'hello A']);
assert.equal(resolveConditionValue('false'), false);
assert.equal(resolveConditionValue('unknownVariable'), undefined);
assert.equal(resolveConditionValue('${value}', { value: 7 }), 7);
const result = snapshotVariables({ cycle, fn: () => {} });
assert.equal(result.cycle.self, '[circular]');
assert.equal(result.fn, '[function]');
assert.doesNotThrow(() => JSON.stringify(snapshotVariables({ cycle })));
assert.deepEqual(snapshotVariables({ large: 12345678901234567890n }), { large: '12345678901234567890' });
const specialKeys = JSON.parse('{"__proto__":{"admin":true},"nested":{"__proto__":{"value":1}}}');
const safe = snapshotVariables(specialKeys);
assert.equal(Object.getPrototypeOf(safe), Object.prototype);
assert.equal(Object.hasOwn(safe, '__proto__'), true);
assert.equal(Object.getPrototypeOf(safe.nested), Object.prototype);
assert.deepEqual(JSON.parse(JSON.stringify(safe)), specialKeys, 'literal keys survive without changing object prototypes');
console.log('RPA_VARIABLES_SELFTEST OK (task isolation, cycles, callable leaves, interpolation, snapshot serialization)');

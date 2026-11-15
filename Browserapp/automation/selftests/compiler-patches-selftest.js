'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createPatch, patchSource, patchComponentSetups, replaceExactly, replaceOneOf } = require('../../rebuild/compiler/patch-source.cjs');

const original = 'const count = 1; function value() { return count; }';
const patched = patchSource(original, { count: '4' }, { value: 'return count * 2;' });
assert.equal(vm.runInNewContext(patched + '; value()'), 8);
assert.throws(() => patchSource(original, { missing: '2' }), /expected 1 match, found 0/);
assert.throws(() => patchSource('const a = 1; function f() { const a = 2; }', { a: '3' }), /found 2/);
assert.throws(() => patchSource('let a;', { a: '3' }), /no initializer/);
assert.throws(() => patchSource('function f() { const a = 1; }', { a: '2' }, { f: 'return 3;' }), /overlapping/);
assert.throws(() => patchSource(original, { count: '(' }), SyntaxError);
assert.equal(replaceExactly('before', 'before', 'after'), 'after');
assert.equal(replaceExactly('x x', 'x', 'y', 'fixture', 2), 'y y');
assert.throws(() => replaceExactly('changed', 'before', 'after', 'fixture'), /fixture:.*found 0/);
assert.throws(() => replaceExactly('x x', 'x', 'y'), /found 2/);
assert.throws(() => replaceExactly('x', '', 'y'), /invalid literal patch/);
assert.equal(replaceOneOf('label="old"', ["label='old'", 'label="old"'], 'label="new"'), 'label="new"');
assert.throws(() => replaceOneOf('zzz', ['a', 'b'], 'c'), /found 0/);
assert.throws(() => replaceOneOf('a b', ['a', 'b'], 'c'), /found 2/);

const component = "const Card = { setup() { const message = 'archived'; return (0, () => message); } };";
const adapted = patchComponentSetups(component, { Card: "const message = 'local'" }, 'component');
assert.equal(vm.runInNewContext(adapted + '; Card.setup()()'), 'local');
assert.throws(() => patchComponentSetups(component, { Missing: '' }), /found 0/);
assert.throws(() => patchComponentSetups(component + "{ const Card = { setup() { return () => 1; } }; }", { Card: '' }), /found 2/);
assert.throws(() => patchComponentSetups('let Card;', { Card: '' }), /no initializer/);
assert.throws(() => patchComponentSetups('const Card = { setup() {} };', { Card: '' }), /no setup render/);
assert.throws(() => patchComponentSetups(component, { Card: 'const = ;' }), SyntaxError);

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-patch-'));
try {
  const file = path.join(directory, 'fixture.js');
  fs.writeFileSync(file, original);
  const patch = createPatch(directory);
  assert.throws(() => patch('fixture', { count: '2', missing: '3' }), /fixture: variable:missing/);
  assert.equal(fs.readFileSync(file, 'utf8'), original, 'a failed patch must not publish a partial edit');
  patch('fixture', { count: '5' });
  assert.equal(vm.runInNewContext(fs.readFileSync(file, 'utf8') + '; value()'), 5);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
console.log('PASS compiler patches: exact matches, overlap, syntax and publication boundaries');

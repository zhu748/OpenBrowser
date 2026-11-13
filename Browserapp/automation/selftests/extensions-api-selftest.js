'use strict';

const assert = require('assert/strict');
const { BrowserEngine } = require('../../engine');

async function main() {
  // Exercise the public prototype, including the extracted mixin, without
  // filesystem persistence or launching a browser.
  const engine = Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new Map([['env-002', { id: 'env-002' }], ['env-001', { id: 'env-001' }]]),
    extensions: new Map([['a', { id: 'a' }], ['b', { id: 'b', builtIn: true }]]),
    assignments: new Map(),
    running: new Map(),
    networkInfo: new Map(),
    listeners: new Set(),
    publicRunning: () => ({ running: false }),
    persist: async () => {},
  });
  const events = [];
  engine.on((event) => events.push(event));

  assert.deepEqual(engine.status()[0].assignedExtensions, []);
  await engine.assignExtension('a', ['env-001', 'env-002'], true);
  assert.deepEqual(engine.status()[0].assignedExtensions, ['a'], 'assignment invalidates a previously read status snapshot');

  await engine.assignExtension('a', ['env-001', 'env-002'], false);
  await assert.rejects(engine.assignExtension('a', ['env-001', '../escape'], true), /profile|invalid/i);
  assert.equal(engine.assignments.get('env-001').has('a'), false, 'invalid batch does not partially update valid entries');

  engine.assignments.set('env-001', new Set(['a', 'b', 'deleted-extension']));
  engine.assignments.set('env-002', new Set(['a']));
  engine.assignments.set('deleted-profile', new Set(['a', 'b']));
  const [all, partial] = engine.listExtensions();
  assert.deepEqual(all.assignedProfileIds, ['env-002', 'env-001'], 'profile order is stable and orphan assignments are ignored');
  assert.equal(all.enabledAll, true);
  assert.deepEqual(partial.assignedProfileIds, ['env-001']);
  assert.equal(partial.enabledAll, false);
  assert.equal(engine.listExtensions().length, 2, 'unknown extension ids do not appear');

  engine.invalidateStatusCache();
  const cached = engine.status();
  engine.usingSqlite = true;
  engine.persist = async () => { throw new Error('synthetic SQL failure'); };
  await assert.rejects(engine.removeExtension('a'), /synthetic SQL failure/);
  assert.equal(engine.extensions.has('a'), true, 'database failure retains the extension');
  assert.equal(engine.assignments.get('env-002').has('a'), true, 'database failure retains assignments');
  assert.deepEqual(engine.status(), cached, 'failed removal restores the public state');
  engine.usingSqlite = false;
  engine.persist = async () => {};
  events.length = 0;
  await engine.removeExtension('a');
  assert.deepEqual(engine.status()[0].assignedExtensions, [], 'removal invalidates the status snapshot');
  assert.equal(engine.assignments.get('env-001').has('a'), false);
  assert.deepEqual(events, [{ type: 'extensions' }], 'removal notifies subscribers');
  await assert.rejects(engine.removeExtension('b'), /Built-in/);

  engine.profiles.clear();
  assert.equal(engine.listExtensions()[0].enabledAll, false, 'an empty fleet has no globally enabled extension');
  console.log('extensions-api-selftest: OK');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

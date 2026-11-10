'use strict';

const assert = require('node:assert/strict');
const { createSessionController, reconcileSessions } = require('../../ui/ui-session-controller');
const rows = [{ id: 'one' }, { id: 'two' }];

async function main() {
  let state = { selectedIds: new Set(), initialized: false, preferredMasterId: null, syncState: { active: false } };
  assert.deepEqual([...reconcileSessions(rows, state).selectedIds], ['one', 'two']);
  const replies = [];
  const errors = [];
  let calls = 0, running = 0, peak = 0;
  const controller = createSessionController({
    fetchSessions: () => {
      calls += 1; peak = Math.max(peak, ++running);
      return new Promise((resolve, reject) => replies.push({
        resolve: (value) => { running -= 1; resolve(value); },
        reject: (error) => { running -= 1; reject(error); },
      }));
    },
    getState: () => state, setState: (next) => { state = { ...next, syncState: state.syncState }; },
    onError: (error) => { errors.push(error.message); throw new Error('observer'); },
  });
  const first = controller.refresh(); replies.shift().resolve(rows); await first;
  assert.equal(state.preferredMasterId, 'one');
  const slow = controller.refresh();
  state.selectedIds = new Set(['two']); state.preferredMasterId = 'two';
  replies.shift().resolve(rows); await slow;
  assert.deepEqual([...state.selectedIds], ['two'], 'a click during IPC wins over the old selection');
  assert.equal(state.preferredMasterId, 'two');
  const second = controller.refresh();
  const trailing = controller.refresh();
  for (let i = 0; i < 100; i += 1) assert.equal(controller.refresh(), trailing);
  let completed = false; trailing.then(() => { completed = true; });
  replies.shift().resolve(rows); await second;
  assert.equal(calls, 4, 'a late burst creates exactly one trailing fetch');
  assert.equal(completed, false, 'late callers wait for their requested refresh');
  state.syncState = { active: true, master: 'two', selected: ['two', 'gone'] };
  replies.shift().resolve(rows); await trailing;
  assert.deepEqual([...state.selectedIds], ['two']);
  assert.equal(state.preferredMasterId, 'two');
  assert.equal(peak, 1);
  const failing = controller.refresh(); const recovery = controller.refresh();
  replies.shift().reject(new Error('offline')); assert.equal(await failing, false);
  replies.shift().resolve([{ id: 'one' }]); await recovery;
  assert.deepEqual([...state.selectedIds], []);
  assert.equal(state.preferredMasterId, null);
  assert.deepEqual(errors, ['offline']);
  const invalid = controller.refresh(); replies.shift().resolve(null);
  assert.equal(await invalid, false, 'invalid responses do not overwrite state');
  console.log('SESSION_CONTROLLER_SELFTEST OK (late selection, sync state, trailing promise, single lane, failure recovery)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

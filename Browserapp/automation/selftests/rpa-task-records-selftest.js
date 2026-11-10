'use strict';

const assert = require('node:assert/strict');
const { createTaskRecord, pruneTaskHistory } = require('../rpa/task-records');
const { RpaStore } = require('../rpa-store');

async function main() {
  const input = { id: 7, profile_id: 4, plan_id: 3, process_name: 'x'.repeat(150), variables: { value: 1 }, status: 'success' };
  const record = createTaskRecord(input, 'now');
  assert.equal(record.id, '7');
  assert.equal(record.profile_id, '4');
  assert.equal(record.plan_id, '3');
  assert.equal(record.status, 'pending');
  assert.equal(record.process_name.length, 120);
  assert.equal(record.create_time, 'now');
  assert.equal(record.update_time, 'now');
  assert.deepEqual(record.variables, input.variables);
  assert.notEqual(record.variables, input.variables);
  assert.deepEqual(createTaskRecord({ variables: [] }).variables, {});
  assert.notEqual(createTaskRecord().id, createTaskRecord().id);

  const tasks = [
    { id: 'new', status: 'success' }, { id: 'pending', status: 'pending' },
    { id: 'old', status: 'failed' }, { id: 'running', status: 'running' },
    { id: 'oldest', status: 'cancelled' },
  ];
  assert.deepEqual(pruneTaskHistory(tasks, 3), ['oldest', 'old']);
  assert.deepEqual(tasks.map((task) => task.id), ['new', 'pending', 'running']);
  assert.deepEqual(pruneTaskHistory(tasks, 1), ['new']);
  assert.deepEqual(tasks.map((task) => task.id), ['pending', 'running'], 'active records survive over-budget history');
  assert.deepEqual(pruneTaskHistory(tasks, 1), []);
  const large = Array.from({ length: 20000 }, (_, index) => ({ id: index, status: index % 2 ? 'running' : 'success' }));
  assert.equal(pruneTaskHistory(large, 100).length, 10000);
  assert.equal(large.length, 10000);
  assert.ok(large.every((task, index) => task.id === index * 2 + 1));

  // Exercise the actual store entry points: both must use the same schema and one save.
  const store = new RpaStore('unused-in-memory-test.json');
  let saves = 0;
  store.save = async () => { saves += 1; };
  const single = await store.createTask(input);
  const [batch] = await store.createTasks([input]);
  for (const key of ['create_time', 'update_time']) { single[key] = 'time'; batch[key] = 'time'; }
  assert.deepEqual(single, batch);
  assert.equal(saves, 2);
  const before = store.data.tasks;
  assert.deepEqual(await store.createTasks([]), []);
  assert.equal(store.data.tasks, before);
  assert.equal(saves, 2, 'empty batch does not write');
  console.log('RPA_TASK_RECORDS_SELFTEST OK (single/batch schema, defaults, retention, active work, large history)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

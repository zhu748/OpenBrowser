'use strict';

const assert = require('node:assert/strict');
const { registerAutomationControlIpc } = require('../../main/automation-ipc');

async function main() {
  const handlers = new Map();
  let automation = null;
  let created = 0; let runs = 0;
  registerAutomationControlIpc({
    registerTrustedIpc(channel, handler) {
      assert.equal(handlers.has(channel), false, 'IPC channels cannot shadow each other');
      handlers.set(channel, handler);
    },
    getAutomation: () => automation, getMainWindow: () => null,
    app: { getPath: () => '/test-user-data' }, dialog: {},
  });
  const call = (channel, payload) => handlers.get(channel)({}, payload);
  assert.equal(handlers.size, 22);
  assert.deepEqual(call('automation:rpa-status'), { running: [], count: 0 });
  await assert.rejects(call('automation:rpa-run', { steps: [{ type: 'wait' }] }), /not ready/);
  automation = { apiKey: '', info: { port: 1234 }, rpaEngine: {
    getStatus: () => ({ running: ['active'], count: 1 }),
    async runTask(id) { runs += 1; return { taskId: id, success: true }; },
  }, rpaStore: {
    async createTask() { created += 1; return { id: 'task' }; },
    async deleteTask() { return { deleted: true }; },
  }, async rotateApiKey() { return 'rotated-test-key'; } };
  assert.equal(call('automation:rpa-status').count, 1, 'handlers read the current stack after registration');
  await assert.rejects(call('automation:rpa-run', { steps: [{ type: 'getCaptcha' }] }), /Invalid RPA steps/);
  assert.equal(created, 0, 'unsupported IPC actions are rejected before task persistence');
  assert.equal(runs, 0);
  assert.equal((await call('automation:rpa-run', { profile_id: 'p', steps: [{ type: 'wait', ms: 1 }] })).success, true);
  assert.equal(created, 1);
  assert.deepEqual(await call('automation:rpa-task-delete', ['active', 'done', 'done']), { deleted: ['done'], skipped: ['active'] });
  assert.equal((await call('automation:api-key-rotate')).apiKey, 'rotated-test-key');
  assert.equal(call('automation:mcp-paths').port, 1234);
  assert.match(call('automation:mcp-paths').mcpScript, /automation[/\\]mcp-server\.js$/);
  console.log('AUTOMATION_IPC_SELFTEST OK (trusted registration, live dependencies, preflight validation and task lifecycle)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

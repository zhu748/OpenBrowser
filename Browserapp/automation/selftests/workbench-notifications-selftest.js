'use strict';

const assert = require('node:assert/strict');

async function main() {
  const { createNotifications } = await import('../../rebuild/workbench-notifications.mjs');
  let mounted, rows = [{ id: 'one', title: '<script>', message: 'a & "b"', at: '2026-01-01', read: false }];
  const calls = [], toggles = [];
  const popover = { value: { instance: { toggle: (...args) => toggles.push(args) } } };
  const request = async (method, payload) => {
    calls.push([method, payload]);
    if (method === 'notifications:list') return rows;
    rows = rows.map(row => ({ ...row, read: !payload || payload.ids.includes(row.id) }));
  };
  const state = createNotifications({
    templateRef: () => popover,
    ref: value => ({ value }), computed: read => ({ get value() { return read(); } }),
    onMounted: callback => { mounted = callback; }, translate: value => value,
    transport: { list: () => request('notifications:list'), read: payload => request('notifications:read', payload) },
  });
  await mounted();
  assert.equal(state.unreadCount.value, 1);
  assert.equal(state.groups.value[0].list[0].notify, '&lt;script&gt;<br><span>a &amp; &quot;b&quot;</span>');
  const target = {};
  const event = { currentTarget: target };
  const opening = state.toggle(event);
  event.currentTarget = null;
  await opening;
  assert.strictEqual(toggles[0][1], target, 'async loading retains the original DOM anchor');
  await state.markRead(state.groups.value[0].list[0]);
  assert.equal(state.unreadCount.value, 0);
  const count = calls.length;
  await state.markRead(state.groups.value[0].list[0]);
  assert.equal(calls.length, count, 'already-read rows do not write again');
  await state.markAllRead();
  assert.ok(calls.some(([method, payload]) => method === 'notifications:read' && payload === undefined));
  assert.throws(() => state.showDetails(), /没有云端详情/);
  console.log('PASS notifications: escaping, unread state, anchored popover and read commands');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

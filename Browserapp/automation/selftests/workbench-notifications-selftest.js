'use strict';

const assert = require('node:assert/strict');

async function overlappingLoadChecks(createNotifications) {
  const pending = [], errors = [];
  const notice = { id: 'race', title: 'Race', message: 'Fixture', at: '2026-01-01', read: false };
  const originalError = globalThis.__localUiError;
  const popover = { value: { instance: { toggle() {} } } };
  let mount;
  const state = createNotifications({
    templateRef: () => popover,
    ref: value => ({ value }), computed: read => ({ get value() { return read(); } }),
    onMounted: callback => { mount = callback; }, translate: value => value,
    transport: {
      list: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
      read: async () => {},
    },
  });
  globalThis.__localUiError = message => errors.push(message);
  const click = { currentTarget: {} };
  try {
    const mounting = mount();
    const opening = state.toggle(click);
    pending[1].resolve([notice]);
    await opening;
    pending[0].reject(Error('stale initial load'));
    await mounting;
    assert.deepEqual(errors, [], 'a late superseded mount failure must not report an error');
    assert.equal(state.unreadCount.value, 1);

    const stale = state.toggle(click);
    const marking = state.markRead(state.groups.value[0].list[0]);
    await Promise.resolve(); // the acknowledged write now requests fresh rows
    pending[3].resolve([{ ...notice, read: true }]);
    await marking;
    pending[2].resolve([notice]);
    await stale;
    assert.equal(state.unreadCount.value, 0, 'a late snapshot must not revert marked-read state');
    assert.equal(state.groups.value[0].list[0].status, 1);

    const failed = state.toggle(click);
    pending[4].reject(Error('current load failed'));
    await failed;
    assert.deepEqual(errors, ['current load failed'], 'a current failure still reports its error');
    assert.equal(state.unreadCount.value, 0, 'a failed refresh leaves the last successful view intact');
  } finally {
    if (originalError === undefined) delete globalThis.__localUiError;
    else globalThis.__localUiError = originalError;
  }
}

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
  await overlappingLoadChecks(createNotifications);
  console.log('PASS notifications: escaping, unread state, anchored popover, read commands, and overlapping loads');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

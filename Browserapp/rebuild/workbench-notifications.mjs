// Dependencies are the archive's Vue hooks and the local RPC boundary. Keeping
// notification behavior here makes it lintable independently of generated code.
const localTransport = {
  list: () => globalThis.__localRequest('notifications:list'),
  read: payload => globalThis.__localRequest('notifications:read', payload),
};

export function createNotifications({ templateRef, ref, computed, onMounted, translate, transport = localTransport }) {
  const popover = templateRef('pop');
  const groups = ref([{ value: 'sys', title: translate('系统通知'), list: [], noRead: 0 }]);
  const selectedGroup = ref('sys');
  const selectedItems = ref(new Set());
  const unreadCount = computed(() => groups.value[0].noRead);
  const escape = value => String(value).replace(/[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  async function load() {
    const rows = await transport.list();
    groups.value[0].list = rows.map(row => ({
      id: row.id, status: row.read ? 1 : 0, messageModule: 'sys', _icon: 'status/speaker',
      notify: escape(row.title) + '<br><span>' + escape(row.message) + '</span>',
      createTime: new Date(row.at).toLocaleString(),
    }));
    groups.value[0].noRead = rows.filter(row => !row.read).length;
  }
  async function toggle(event) {
    const target = event.currentTarget;
    await load();
    popover.value.instance.toggle(event, target);
  }
  async function markRead(row) {
    if (row.status) return;
    await transport.read({ ids: [row.id] });
    await load();
  }
  async function markAllRead() {
    await transport.read();
    await load();
  }
  function preventDefault(event) { event.preventDefault(); }
  function showDetails() { throw Error('本地通知没有云端详情'); }

  onMounted(load);
  return { popover, groups, selectedGroup, selectedItems, unreadCount, toggle,
    markRead, markAllRead, preventDefault, showDetails };
}

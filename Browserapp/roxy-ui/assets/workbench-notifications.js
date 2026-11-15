const localTransport = {
  list: () => globalThis.__localRequest("notifications:list"),
  read: (payload) => globalThis.__localRequest("notifications:read", payload)
};
function createNotifications({ templateRef, ref, computed, onMounted, translate, transport = localTransport }) {
  const popover = templateRef("pop"), groups = ref([{ value: "sys", title: translate("\u7CFB\u7EDF\u901A\u77E5"), list: [], noRead: 0 }]), selectedGroup = ref("sys"), selectedItems = ref(/* @__PURE__ */ new Set()), unreadCount = computed(() => groups.value[0].noRead), escape = (value) => String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
  async function load() {
    const rows = await transport.list();
    groups.value[0].list = rows.map((row) => ({
      id: row.id,
      status: row.read ? 1 : 0,
      messageModule: "sys",
      _icon: "status/speaker",
      notify: escape(row.title) + "<br><span>" + escape(row.message) + "</span>",
      createTime: new Date(row.at).toLocaleString()
    })), groups.value[0].noRead = rows.filter((row) => !row.read).length;
  }
  async function toggle(event) {
    const target = event.currentTarget;
    await load(), popover.value.instance.toggle(event, target);
  }
  async function markRead(row) {
    row.status || (await transport.read({ ids: [row.id] }), await load());
  }
  async function markAllRead() {
    await transport.read(), await load();
  }
  function preventDefault(event) {
    event.preventDefault();
  }
  function showDetails() {
    throw Error("\u672C\u5730\u901A\u77E5\u6CA1\u6709\u4E91\u7AEF\u8BE6\u60C5");
  }
  return onMounted(load), {
    popover,
    groups,
    selectedGroup,
    selectedItems,
    unreadCount,
    toggle,
    markRead,
    markAllRead,
    preventDefault,
    showDetails
  };
}
export {createNotifications as createNotifications};
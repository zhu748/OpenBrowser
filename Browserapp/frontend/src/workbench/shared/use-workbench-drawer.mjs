import { getCurrentInstance, h, nextTick, onUnmounted, ref, watch } from './workbench-vue.js';
import { a as render } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { cr as clone } from './utils-BIWenCnY.js';
import { useRemarkPreference } from './useRemarkDisplay-C7h7k7ja.js';
import WorkbenchDrawer from './workbench-drawer.js';
import { t as SingleProxyEditor } from './single-proxies-C7CAMkyq.js';
export { default as a } from './workbench-advanced-search.js';
export { default as i } from './workbench-related-profiles.js';
export { Drawer as DrawerHost } from './workbench-prime-drawer.js';

function useDrawer() {
  const context = getCurrentInstance()?.appContext;
  if (!context) throw Error('useDrawer must be used within a component setup');
  const visible = ref(false);
  let host;
  let sequence = 0;
  function cleanup() {
    if (!host) return;
    const container = host;
    host = undefined;
    render(null, container);
    container.remove();
  }
  async function showDrawer({ slots, ...options }) {
    const current = ++sequence;
    visible.value = false;
    cleanup();
    host = document.createElement('div');
    document.body.append(host);
    const node = h(() => h(WorkbenchDrawer, { ...options, visible: visible.value, 'onUpdate:visible': value => { visible.value = value; },
      'onAfter-hide': () => {
        options['onAfter-hide']?.();
        if (current === sequence && !visible.value) cleanup();
      },
    }, slots));
    node.appContext = context;
    try {
      render(node, host);
      await nextTick();
      if (current === sequence) visible.value = true;
    } catch (error) {
      if (current === sequence) cleanup();
      console.error('Failed to show drawer:', error);
    }
  }
  onUnmounted(() => { sequence++; cleanup(); });
  return { showDrawer, hideDrawer: () => { visible.value = false; } };
}
function configureColumns(columns, { filters = [], inserts = [] } = {}) {
  const copied = clone(columns);
  for (const [index, column] of inserts ?? []) copied.splice(index, 0, column);
  return copied.filter(column => !filters?.includes(column.key));
}
function readColumns(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return new Map(Array.isArray(stored) ? stored.filter(entry => Array.isArray(entry) && entry.length === 2) : []);
  } catch { return new Map(); }
}
function useColumnPreferences({ key, data }, excluded) {
  const updateRemarkDisplayStatus = useRemarkPreference();
  const saved = readColumns(key);
  const columns = ref(data.filter(column => !excluded?.includes(column.key)).map((column, index) => {
    const { sort, visible, cache } = saved.get(column.key) ?? {};
    const settings = cache ?? column._cache;
    return { ...column, _sort: sort ?? column._sort ?? index, _visible: visible ?? column._visible ?? true,
      ...(settings && { _cache: settings }) };
  }).sort((left, right) => left._sort - right._sort));
  let timer;
  function save() {
    clearTimeout(timer);
    timer = undefined;
    const prefs = columns.value.map((column, sort) => [column.key, { visible: column._visible, sort, cache: column._cache }]);
    try { localStorage.setItem(key, JSON.stringify(prefs)); }
    catch (error) { console.error('保存表格列设置失败', error); }
  }
  watch(columns, () => { clearTimeout(timer); timer = setTimeout(save, 200); }, { deep: true });
  window.addEventListener('pagehide', save);
  onUnmounted(() => { save(); window.removeEventListener('pagehide', save); });
  return { columns, updateColumns: update => update(columns.value), updateRemarkDisplayStatus };
}
function useProxyFormDrawer(drawer = useDrawer()) {
  function showProxyFormDrawer({ title, data, showRemark, mode, dismissable, closeOnEscape, onHide, onConfirm }) {
    return drawer.showDrawer({ title, dismissable, closeOnEscape, onHide,
      slots: { container: () => h(SingleProxyEditor, { data, showRemark, mode, async onConfirm(value) {
        if (await onConfirm?.(value) !== false) drawer.hideDrawer();
      } }) },
    });
  }
  return { drawerInstance: drawer, hideDrawer: drawer.hideDrawer, showProxyFormDrawer };
}

export { configureColumns as n, useDrawer as o, useColumnPreferences as r, useProxyFormDrawer as t };

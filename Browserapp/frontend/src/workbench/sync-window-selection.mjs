import { t as translate } from './locales-BfKu2SD4.js';
import {
  F as nextTick, St as ref, V as onMounted, R as onBeforeUnmount, at as useTemplateRef,
  d as computed, st as watch,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { qt as coreType } from './utils-BIWenCnY.js';
import { n as useNotifications } from './usetoast-DphSlejX.js';

const sortKey = 'sync-control:synchronizer:window-list:sort';
const defaultSort = { sortField: 'windowSortNum', sortOrder: 1 };
const desktopSystems = ['Windows', 'macOS', 'Linux'];
const mobileSystems = ['Android', 'IOS'];

function uniqueOptions(rows, valueOf, labelOf) {
  return [...new Map(rows.map(row => [valueOf(row), { label: labelOf(row), value: valueOf(row) }])).values()];
}

export function useSyncWindowSelection(props) {
  const table = useTemplateRef('syncControlTable');
  const toast = useNotifications();
  const api = globalThis.electronAPI;
  const filters = ref({ projectIds: [], labelIds: [], os: [], windowName: '' });
  const windows = ref([]);
  const selection = ref([]);
  const master = ref(props.mainControlWindowDirId);
  const starting = ref(false);
  const syncing = computed(() => props.showType === 'syncing');
  const eligible = computed(() => (selection.value || []).filter(row => row.$canUseSyncControl &&
    windows.value.some(current => current.dirId === row.dirId && current.$canUseSyncControl)));
  const startDisabled = computed(() => starting.value || eligible.value.length < 2 ||
    !eligible.value.some(row => row.dirId === master.value));
  const columns = [
    { title: translate('窗口信息'), key: 'windowSortNum', sortable: true, slot: 'profile', style: { width: '0%', minWidth: '125px' } },
    { title: translate('窗口名称'), key: 'windowName', sortable: true, slot: 'windowName', style: { width: '10%', minWidth: '120px' } },
    { title: translate('状态'), key: 'status', slot: 'status', style: { width: '25%' } },
    { title: translate('操作'), key: 'actions', slot: 'actions', style: { width: '10%' } },
  ];
  const filterOptions = computed(() => {
    const rows = windows.value;
    const labels = rows.flatMap(row => row.labelInfo || []);
    const byLabel = new Map(labels.map(label => [label.labelId, { ...label, label: label.labelName, value: label.labelId }]));
    return [
      { name: 'projectIds', placeholder: translate('全部项目'), options: uniqueOptions(rows, row => row.projectId, row => row.projectName) },
      { name: 'labelIds', placeholder: translate('全部标签'), options: [...byLabel.values()] },
      { name: 'os', placeholder: translate('全部系统'), options: uniqueOptions(rows, row => row.os, row => row.os === 'IOS' ? 'iOS' : row.os) },
    ];
  });
  const visible = computed(() => {
    const { projectIds, labelIds, os, windowName } = filters.value;
    return windows.value.filter(row =>
      (!projectIds.length || projectIds.includes(row.projectId)) &&
      (!labelIds.length || row.labelInfo?.some(label => labelIds.includes(label.labelId))) &&
      (!os.length || os.includes(row.os)) &&
      (!windowName || row.windowName.includes(windowName)));
  });
  let explicitMaster = false;
  let alive = true;
  let reloadSequence = 0;

  const validSort = value => [1, -1].includes(value?.sortOrder) &&
    columns.some(column => column.sortable && column.key === value.sortField);
  function tableSort() {
    let data = { ...defaultSort };
    try {
      const stored = JSON.parse(localStorage.getItem(sortKey) || 'null');
      if (validSort(stored)) data = stored;
    } catch {
      // A malformed saved sort falls back to the default order.
    }
    return { data, onChange: value => {
      if (validSort(value)) localStorage.setItem(sortKey, JSON.stringify(value));
      else localStorage.removeItem(sortKey);
    } };
  }

  function updateWindows(rows) {
    windows.value = rows.filter(row => row.coreType !== coreType.Firefox);
  }

  async function refresh() {
    const ticket = ++reloadSequence;
    const channel = syncing.value ? 'syncControl:getAllSyncingWindows' : 'browser:getOpenedBrowser';
    try {
      const rows = await api.send(channel);
      if (alive && ticket === reloadSequence) updateWindows(rows);
    } catch (error) {
      if (alive && ticket === reloadSequence) toast.add({ severity: 'error', summary: error.message, life: 5000 });
    }
  }

  function updateTableOrder(rows) {
    updateWindows(rows);
    if (rows.length && !explicitMaster && !props.mainControlWindowDirId) master.value = rows[0].dirId;
  }

  function setMaster(row) {
    if (syncing.value || !row.$canUseSyncControl) return;
    master.value = row.dirId;
    explicitMaster = true;
  }

  function openWindow(id) {
    return api.send('browser:batchLaunch', [id]);
  }

  const disabledRows = () => table.value?.rootElRef?.querySelectorAll(
    '.p-datatable-selectable-row:not(:has(.can-use-sync-control))',
  ) || [];

  async function normalizeSelectedRows() {
    await nextTick();
    for (const row of disabledRows()) {
      const checkbox = row.querySelector('.p-checkbox-checked');
      checkbox?.classList.remove('p-checkbox-checked');
      if (checkbox) {
        const icon = checkbox.querySelector('.p-checkbox-icon');
        if (icon) icon.style.display = 'none';
      }
    }
  }

  watch(visible, async rows => {
    if (rows.length <= 1) return;
    if (!props.mainControlWindowDirId) {
      const allowed = rows.filter(row => row.$canUseSyncControl);
      if (!allowed.some(row => row.dirId === master.value)) master.value = allowed[0]?.dirId || '';
    }
    await nextTick();
    if (!alive) return;
    for (const row of disabledRows()) {
      if (row.querySelector('.disable-mask')) continue;
      const mask = document.createElement('div');
      mask.className = 'disable-mask';
      mask.title = translate('此窗口暂不支持同步');
      mask.onclick = event => event.stopPropagation();
      row.appendChild(mask);
    }
  });

  async function start() {
    if (syncing.value || startDisabled.value) return;
    const rows = eligible.value;
    if (rows.some(row => desktopSystems.includes(row.platform)) &&
        rows.some(row => mobileSystems.includes(row.platform))) {
      toast.add({
        severity: 'warn',
        summary: translate('同步窗口失败'),
        detail: translate('桌面系统的窗口暂时无法和手机系统进行同步操作'),
      });
      return;
    }
    starting.value = true;
    try {
      const ordered = [master.value, ...rows.map(row => row.dirId).filter(id => id !== master.value)];
      await api.send('syncControl:start', ordered);
    } catch (error) {
      if (alive) toast.add({ severity: 'error', summary: error.message, life: 5000 });
    } finally {
      if (alive) starting.value = false;
    }
  }

  api.on('browser:on-close', ids => {
    selection.value = (selection.value || []).filter(row => !ids.includes(row.dirId));
    void refresh();
  });
  api.on('browser:opened-browser-list-change', rows => {
    if (syncing.value) return;
    reloadSequence++;
    updateWindows(rows);
  });
  if (!syncing.value) api.on('syncControl:start', start);
  onMounted(refresh);
  onBeforeUnmount(() => { alive = false; reloadSequence++; });

  return {
    filters, windows, master, columns, tableSort, selection, eligible, syncing,
    startDisabled, filterOptions, visible, start, openWindow, normalizeSelectedRows, setMaster, updateTableOrder,
  };
}

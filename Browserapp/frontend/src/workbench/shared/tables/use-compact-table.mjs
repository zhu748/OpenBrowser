import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from './workbench-vue.js';
import { Dr as parseJson, jr as sortDirection, o as readFilters } from './utils-BIWenCnY.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { t as usePreventMask } from './usePreventMask-Cud6gNnu.js';

const rememberedTables = new Map();
const maxRememberedTables = 24;
const skeletonRows = Array.from({ length: 6 }, () => ({ __labSkeleton: true }));

function remember(key, snapshot) {
  rememberedTables.delete(key);
  rememberedTables.set(key, snapshot);
  if (rememberedTables.size > maxRememberedTables) rememberedTables.delete(rememberedTables.keys().next().value);
}

function allows(rule) {
  return (typeof rule === 'function' ? rule() : rule) !== false;
}

function permitted(items) {
  const result = [];
  for (const item of items) {
    if (!allows(item.power) || item.separator && (!result.length || result.at(-1).separator)) continue;
    if (!item.items?.length) {
      result.push(item);
      continue;
    }
    const children = permitted(item.items);
    if (children.length || item.command) result.push({ ...item, items: children });
  }
  if (result.at(-1)?.separator) result.pop();
  return result;
}

export function isSkeleton(row) {
  return row?.__labSkeleton === true;
}

function useColumnPreferences(props) {
  const order = ref([]);
  const visibility = reactive(Object.create(null));
  const settings = reactive(Object.create(null));
  const storageKey = props.displayKey && `ts-table:${props.displayKey}`;
  const stored = storageKey ? parseJson(localStorage.getItem(storageKey)) : [];
  const preferences = new Map(Array.isArray(stored) ? stored : []);
  const initial = props.columns.map((column, index) => {
    const saved = preferences.get(column.field) ?? {};
    return {
      ...column, _sort: saved.sort ?? column._sort ?? index,
      _visible: saved.visible ?? column._visible ?? true, _cache: saved.cache ?? column._cache,
    };
  }).sort((left, right) => left._sort - right._sort);
  const columns = computed({
    get() {
      const byField = new Map(props.columns.map(column => [column.field, column]));
      const fields = order.value.filter(field => byField.has(field));
      for (const field of byField.keys()) if (!fields.includes(field)) fields.push(field);
      return fields.map((field, index) => ({
        ...byField.get(field), _sort: index,
        _visible: visibility[field] ?? byField.get(field)._visible ?? true,
        _cache: Object.hasOwn(settings, field) ? settings[field] : byField.get(field)._cache,
      }));
    },
    set(next) {
      const fields = next.map(column => column.field);
      if (fields.length !== order.value.length || fields.some((field, index) => field !== order.value[index])) order.value = fields;
      for (const column of next) {
        visibility[column.field] = column._visible ?? true;
        if (column._cache !== undefined) settings[column.field] = column._cache;
      }
    },
  });
  columns.value = initial;
  onBeforeUnmount(() => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(columns.value.map((column, sort) => [
      column.field, { sort, visible: column._visible, cache: column._cache },
    ])));
  });
  return columns;
}

export function useCompactTable(props, attrs, providedSelection, controlled, root, menu) {
  const route = useRoute();
  const { showPreventMask, hidePreventMask } = usePreventMask();
  const columns = useColumnPreferences(props);
  const visibleColumns = computed(() => columns.value.filter(column => column._visible));
  const regions = computed(() => ({ header: true, reload: true, paginator: true, actions: true, selectionBar: true, ...props.regions }));
  const showActions = computed(() => regions.value.actions !== false && columns.value.every(column => column.field !== 'actions'));
  const sort = reactive({ field: '', order: 0, change: undefined, enabled: false });
  const savedPageSize = Number(localStorage.getItem(`table:${props.cacheKey}`)) || props.pageSize;
  const page = reactive({
    size: savedPageSize, first: savedPageSize * ((Number(route.query.page_index) || 1) - 1), total: 0,
  });
  const emptySelection = () => props.selectionMode === 'multiple' ? [] : null;
  const rowKey = row => String(row?.[props.dataKey] ?? '');
  const isSelectable = row => !!row && !isSkeleton(row) && !props.isRowDisabled?.(row);
  const localSelection = ref(emptySelection());
  const selectionSource = controlled ? providedSelection : localSelection;
  function selectionRows(value) {
    if (props.selectionMode === 'multiple') return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }
  function sanitizeSelection(value) {
    return props.selectionMode === 'multiple'
      ? selectionRows(value).filter(isSelectable)
      : isSelectable(value) ? value : null;
  }
  const selection = computed({
    get() {
      const value = selectionSource.value;
      return props.selectionMode === 'multiple' ? selectionRows(value) : value ?? null;
    },
    set(value) { selectionSource.value = sanitizeSelection(value); },
  });
  watch(selectionSource, value => {
    const clean = sanitizeSelection(value);
    if (selectionRows(clean).map(rowKey).join('\0') !== selectionRows(value).map(rowKey).join('\0')) selectionSource.value = clean;
  });
  const selectedRows = computed(() => selectionRows(sanitizeSelection(selection.value)));
  function clearSelection() { selection.value = emptySelection(); }
  const filters = ref();
  const params = ref();
  const resultRows = ref();
  const loading = ref(false);
  const ready = ref(false);
  const showSkeleton = computed(() => props.loading === 'skeleton' && loading.value);
  const rows = computed(() => props.dataList === undefined ? resultRows.value : props.dataList);
  const displayedRows = computed(() => showSkeleton.value ? skeletonRows : rows.value);
  const selectAll = computed(() => {
    const eligible = (displayedRows.value ?? []).filter(isSelectable);
    const checked = new Set(selectedRows.value.map(rowKey));
    return eligible.length > 0 && eligible.every(row => checked.has(rowKey(row)));
  });
  function toggleAll({ checked }) {
    selection.value = checked ? (displayedRows.value ?? []).filter(isSelectable) : emptySelection();
  }
  const virtualScrollerOptions = computed(() => {
    const options = attrs.virtualScrollerOptions ?? attrs['virtual-scroller-options'];
    if (options) return options;
    if ((displayedRows.value?.length ?? 0) > 40) return { itemSize: attrs.size === 'small' ? 40 : 60 };
  });
  const tableProps = computed(() => {
    const { class: wrapperClass, ...forwarded } = attrs;
    return {
      dataKey: props.dataKey, scrollable: true, scrollHeight: 'flex', contextMenu: true,
      showGridlines: false, resizableColumns: true, columnResizeMode: 'expand',
      onRowContextmenu: openRowMenu, ...forwarded,
    };
  });

  const contextSelection = ref();
  const menuItems = ref([]);
  const pending = reactive(new Set());
  function isPending(item) { return pending.has(item.pendingKey); }
  function bindAction(item, data, identity) {
    const pendingKey = `${identity}:${String(item.key ?? item.icon ?? item.label ?? '')}`;
    const action = { ...item, pendingKey };
    if (item.items?.length) action.items = item.items.map(child => bindAction(child, data, identity));
    if (typeof item.command === 'function') {
      action.command = async event => {
        if (pending.has(pendingKey)) return false;
        pending.add(pendingKey);
        try {
          return await item.command({ ...event, data: event?.data ?? data });
        } finally {
          pending.delete(pendingKey);
        }
      };
    }
    return action;
  }
  function actionsFor(target) {
    const items = typeof props.model === 'function' ? props.model(target) : props.model;
    const data = toRaw(target.row ?? target.rows);
    const identity = target.row ? `row:${rowKey(target.row)}` : 'batch';
    return permitted(items ?? []).map(item => bindAction(item, data, identity));
  }
  const selectedActions = computed(() => actionsFor({ rows: selectedRows.value }));
  function menuAction(item, bulk, selectionData) {
    const action = { ...item };
    if (item.items?.length) {
      action.items = item.items.filter(child => allows(child.visible) && (!bulk || child.multiple !== false))
        .map(child => menuAction(child, bulk, selectionData));
    }
    if (typeof item.command === 'function') {
      action.command = async event => {
        const result = await item.command({ ...event, data: toRaw(selectionData) });
        if (bulk && result !== false) clearSelection();
        return result;
      };
    }
    return action;
  }
  async function openMenu(event, target) {
    const bulk = !!target.rows;
    const data = target.rows ?? target.row;
    const items = actionsFor(target).filter(item => allows(item.visible) && (bulk
      ? item.multiple && !item.onlyQuick : !item.onlyQuick && !item.onlyMultiple));
    if (!items.some(item => !item.separator)) return menu.value?.hide();
    if (!bulk && props.selectionMode === 'multiple' && selectedRows.value.length) clearSelection();
    contextSelection.value = data;
    menuItems.value = items.map(item => menuAction(item, bulk, data));
    await nextTick();
    menu.value?.show(event);
  }
  function openRowMenu({ data, originalEvent }) {
    if (isSelectable(data)) return openMenu(originalEvent, { row: data });
  }
  function openBulkMenu(event) { return openMenu(event, { rows: selectedRows.value }); }
  function menuPending(items) {
    return items.some(item => isPending(item) || item.items?.length && menuPending(item.items));
  }
  async function runMenuAction(event, item) {
    if (item.items?.length || item.separator || item.disabled || isPending(item)) return;
    const result = await item.command?.({ originalEvent: event, item });
    if (result !== false && !menuPending(menuItems.value)) menu.value?.hide();
  }

  let initialization;
  let loadRevision = 0;
  let scrollRevision = 0;
  let disposed = false;
  function getParams() {
    const query = {
      page_index: Math.ceil(page.first / page.size) + 1, page_size: page.size,
      ...readFilters(filters.value), ...props.tableParams, ...params.value,
    };
    if (sort.enabled && sort.field) {
      query.orderName = sort.field;
      const direction = sortDirection(sort.order);
      if (direction) query.orderType = direction;
    }
    return query;
  }
  function rememberResults() {
    if (!props.remember) return;
    remember(props.remember, {
      rows: resultRows.value ?? [], total: page.total, first: page.first, size: page.size, params: { ...params.value },
      sort: { field: sort.field, order: sort.order },
      filters: Object.fromEntries((filters.value ?? []).filter(filter => filter?.name).map(filter => [filter.name, filter.value])),
      scrollTop: rememberedTables.get(props.remember)?.scrollTop ?? 0,
    });
  }
  function restoreResults() {
    if (props.dataList !== undefined || !props.remember) return false;
    const snapshot = rememberedTables.get(props.remember);
    if (!snapshot) return false;
    remember(props.remember, snapshot);
    params.value = { ...snapshot.params };
    page.first = snapshot.first;
    if (snapshot.size) page.size = snapshot.size;
    page.total = snapshot.total;
    resultRows.value = snapshot.rows;
    if (snapshot.sort?.field) Object.assign(sort, snapshot.sort, { enabled: true });
    for (const filter of filters.value ?? []) {
      if (filter?.name && Object.hasOwn(snapshot.filters, filter.name)) filter.value = snapshot.filters[filter.name];
    }
    return true;
  }
  function scroller() {
    return root.value?.querySelector('.p-virtualscroller') ?? root.value?.querySelector('.p-datatable-table-container');
  }
  async function restoreScroll() {
    const saved = props.remember && rememberedTables.get(props.remember);
    if (!saved?.scrollTop) return;
    const revision = ++scrollRevision;
    const deadline = performance.now() + 480;
    while (!disposed && revision === scrollRevision && performance.now() < deadline) {
      await nextTick();
      const target = scroller();
      if (target && target.scrollHeight - target.clientHeight >= saved.scrollTop) {
        target.scrollTop = saved.scrollTop;
        if (target.scrollTop > 0) {
          saved.scrollTop = 0;
          return;
        }
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }
  async function load() {
    if (disposed) return;
    const revision = ++loadRevision;
    loading.value = true;
    try {
      await initialization;
      if (disposed || revision !== loadRevision) return;
      const response = await props.tableRequest(getParams());
      if (disposed || revision !== loadRevision) return;
      const data = response?.data ?? response;
      resultRows.value = data?.rows ?? [];
      page.total = data?.total ?? 0;
      if (!controlled) clearSelection();
      if (props.dataList === undefined && (typeof response?.code !== 'number' || response.code === 0)) rememberResults();
    } finally {
      if (!disposed && revision === loadRevision) loading.value = false;
    }
  }
  function onFilterChange() {
    page.first = 0;
    return load();
  }
  async function onSort({ sortField, sortOrder }) {
    if (!sort.enabled) return;
    Object.assign(sort, { field: sortField ?? '', order: sortOrder ?? 0 });
    page.first = 0;
    await sort.change?.({ sortField: sort.field, sortOrder: sort.order });
    return load();
  }
  async function reload(dropCache = false) {
    if (dropCache && props.remember) rememberedTables.delete(props.remember);
    await props.beforeRefresh?.();
    await load();
    await props.afterRefresh?.();
  }
  function refresh(nextParams = {}, reset = true) {
    if (reset) page.first = 0;
    params.value = nextParams;
    return reload();
  }
  function update(data) { resultRows.value = data ?? []; }
  onBeforeMount(async () => {
    initialization = Promise.all([props.tableFilters(), props.tableSort?.()]).then(([initialFilters, initialSort]) => {
      filters.value = initialFilters;
      if (initialSort) Object.assign(sort, {
        field: initialSort.data?.sortField ?? '', order: initialSort.data?.sortOrder ?? 0, change: initialSort.onChange, enabled: true,
      });
    });
    try {
      await initialization;
      if (!restoreResults() && props.immediate && props.dataList === undefined) await load();
    } finally {
      ready.value = true;
    }
  });
  onMounted(restoreScroll);
  watch(rows, restoreScroll);
  onBeforeUnmount(() => {
    disposed = true;
    const saved = props.remember && rememberedTables.get(props.remember);
    const scrollTop = scroller()?.scrollTop;
    if (saved && scrollTop != null) remember(props.remember, { ...saved, scrollTop });
  });
  return {
    columns, visibleColumns, regions, showActions, sort, page, selection, selectedRows, selectedActions, clearSelection,
    filters, ready, loading, rows, displayedRows, showSkeleton, selectAll, toggleAll, virtualScrollerOptions, tableProps,
    contextSelection, menuItems, showPreventMask, hidePreventMask, isPending, actionsFor, openRowMenu, openBulkMenu,
    runMenuAction, getParams, load, onFilterChange, onSort, reload, refresh, update,
  };
}

import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from './workbench-vue.js';
import {
  bt as useListCache, cr as clone, mt as useWorkspace, o as readFilters,
} from './utils-BIWenCnY.js';
import { y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { buildTableQuery, createTableLoader, isProfileTable, listCacheVersion } from './workbench-table.js';
import { permittedActions } from './workbench-table-actions.js';
import { useTableContextMenu } from './workbench-table-context.js';

const columnClasses = {
  columntitle: '_columntitle_1b0eh_1',
  headerrow: '_headerrow_1b0eh_8',
  headercell: '_headercell_1b0eh_8',
  bodyrow: '_bodyrow_1b0eh_27',
  bodycell: '_bodycell_1b0eh_27',
  tableroot: '_tableroot_1b0eh_46',
  table: '_table_1b0eh_46',
  tbody: '_tbody_1b0eh_56',
};

export function useBrowserTable(props, columns, attrs, root, dataTable) {
  const route = useRoute();
  const workspace = useWorkspace();
  const cache = useListCache();
  const [openContextMenu, closeContextMenu] = useTableContextMenu();
  const loaded = ref(false);
  const loading = ref(false);
  const loadFailed = ref(false);
  const results = ref();
  const filters = ref();
  const outerParams = ref();
  const disabledIds = ref([]);
  const sort = reactive({ sortField: '', sortOrder: 0, onChange: undefined });
  const contextSelection = ref();
  const localSelection = ref();
  const waitingForSelectionReset = ref(false);
  const visibleColumns = computed(() => columns.value.filter(column => column._visible ?? true));
  const rows = computed(() => Array.isArray(props.dataList) ? props.dataList : results.value);
  const showLoadError = computed(() => isProfileTable(props.cacheKey) && loadFailed.value && !rows.value?.length);
  const selection = computed({
    get() {
      return attrs['onUpdate:selection']
        ? waitingForSelectionReset.value ? undefined : attrs.selection
        : localSelection.value;
    },
    set(value) {
      if (value != null) waitingForSelectionReset.value = false;
      const callback = attrs['onUpdate:selection'];
      if (Array.isArray(callback)) callback.forEach(listener => listener(value));
      else if (typeof callback === 'function') callback(value);
      else localSelection.value = value;
    },
  });
  const selectionData = computed(() => Array.isArray(selection.value)
    ? selection.value.filter(row => !disabledIds.value.includes(String(row[props.dataKey])))
    : selection.value);
  const defaultRows = Number(localStorage.getItem('table:' + props.cacheKey)) || props.pageRows;
  const pageSizeOptions = [5, 10, 20, 50, 100, 500].map(count => ({ label: $t('{count} 条/页', { count }), value: count }));
  const page = reactive({
    rows: defaultRows,
    first: defaultRows * ((Number(route.query.page_index) || 1) - 1),
    total: 0,
  });
  const pageLabel = computed(() => $t('总计 {total} 个', { total: page.total }));
  const cellParts = { headercell: columnClasses.headercell, bodycell: columnClasses.bodycell };
  let initialization, sortRevision = 0, activation = 0;
  watch(() => attrs.selection, value => {
    if (value == null || Array.isArray(value) && !value.length) waitingForSelectionReset.value = false;
  }, { flush: 'sync' });

  function clearSelection() {
    selection.value = undefined;
    disabledIds.value = [];
  }
  async function excludeDisabledRows() {
    const scope = activation;
    await nextTick();
    if (scope !== activation) return;
    disabledIds.value = [...root.value?.querySelectorAll('.p-datatable-selectable-row.row-disabled') ?? []].map(row => {
      const checkbox = row.querySelector('.p-checkbox-checked');
      checkbox?.classList.remove('p-checkbox-checked');
      const icon = checkbox?.querySelector('.p-checkbox-icon');
      if (icon) icon.style.display = 'none';
      return row.getAttribute('data-row-id');
    });
  }

  const bindings = computed(() => {
    const { selection: controlled, 'onUpdate:selection': update, ...rest } = attrs;
    return {
      dataKey: props.dataKey,
      scrollable: true, scrollHeight: 'flex', contextMenu: true,
      showGridlines: false, resizableColumns: true, columnResizeMode: 'expand',
      selectionMode: props.selectionMode, onRowSelectAll: excludeDisabledRows,
      ...rest,
    };
  });

  function cacheRef() {
    const id = workspace.currentWorkspace?.id;
    if (!props.listCacheKey || !id) return;
    return [props.listCacheKey, String(id), props.listCacheScope?.() ?? {}];
  }
  function scroller() {
    const reference = dataTable.value?.getVirtualScrollerRef?.();
    const element = reference?.element ?? reference?.$el;
    return element instanceof HTMLElement ? element : root.value?.querySelector('.p-virtualscroller');
  }
  function saveScroll() {
    const key = cacheRef();
    if (key && results.value !== undefined) cache.setScrollOffset(...key, scroller()?.scrollTop ?? 0);
  }
  async function restoreScroll() {
    const scope = activation;
    const key = cacheRef();
    if (!key) return;
    const top = cache.peekScrollOffset(...key);
    if (!top) return;
    for (let attempt = 0; attempt < 16; attempt++) {
      await nextTick();
      if (scope !== activation) return;
      const element = scroller();
      if (!element || element.scrollHeight - element.clientHeight < top) continue;
      dataTable.value?.getVirtualScrollerRef?.()?.scrollTo?.({ top });
      element.scrollTo({ top });
      if (element.scrollTop > 0) {
        cache.clearScrollOffset(...key);
        return;
      }
    }
  }
  function getCachedEntry() {
    const key = cacheRef();
    return key ? cache.get(...key) : null;
  }
  function restoreFromCache() {
    const key = cacheRef();
    const saved = getCachedEntry();
    if (!key || !saved) return null;
    invalidateViewReads();
    cache.touch(...key);
    outerParams.value = { ...saved.outerParams };
    page.first = saved.paginator.first;
    page.rows = saved.paginator.rows;
    page.total = saved.total;
    results.value = saved.rows;
    loaded.value = true;
    loadFailed.value = false;
    return saved;
  }
  function saveResults() {
    const key = cacheRef();
    if (!key) return;
    cache.set(...key, {
      rows: results.value ?? [],
      total: page.total,
      outerParams: { ...outerParams.value },
      paginator: { first: page.first, rows: page.rows },
      meta: props.listCacheMeta?.() ?? {},
      lastAccessedAt: Date.now(),
    });
  }
  function invalidateCache(resetScroll = false) {
    const key = cacheRef();
    if (!key) return;
    cache.invalidate(...key);
    if (resetScroll) cache.clearScrollOffset(...key);
  }

  function getParams() {
    return buildTableQuery({
      first: page.first, pageSize: page.rows, filters: readFilters(filters.value),
      tableParams: props.tableParams, runtimeParams: outerParams.value,
      sortField: sort.sortOrder && sort.sortField, sortOrder: sort.sortOrder,
    });
  }

  const loader = createTableLoader({
    wait: () => initialization,
    params: getParams,
    read: (query, current) => props.tableRequest(query, current),
    paginate: () => isProfileTable(props.cacheKey) || props.cacheKey === 'project-list',
    version: () => props.cacheKey === 'project-list' ? listCacheVersion(props.cacheKey) : undefined,
    busy: value => { loading.value = value; },
    failed(error) {
      loaded.value = true;
      loadFailed.value = true;
      globalThis.__localUiError?.(error.message);
    },
    apply({ rows: items, total }, { background, first }) {
      if (first !== undefined) page.first = first;
      page.total = total;
      results.value = items;
      loaded.value = true;
      loadFailed.value = false;
      if (props.listCacheKey) saveResults();
      if (!props.clearSelectionOnRequest) return;
      if (!background) return clearSelection();
      if (!Array.isArray(selection.value) || !selection.value.length) return;
      const byId = new Map(items.map(row => [String(row[props.dataKey]), row]));
      selection.value = selection.value.map(row => byId.get(String(row[props.dataKey]))).filter(Boolean);
      disabledIds.value = [];
    },
  });

  function invalidateViewReads() {
    activation++;
    sortRevision++;
    loader.invalidate();
  }
  // A synchronous boundary catches A → B → A, even before either new view
  // reaches an awaited filter setup or uses a cache-only activation.
  watch(() => {
    const key = cacheRef();
    return key && JSON.stringify([key[0], key[1], cache.buildScopeKey(key[2])]);
  }, () => {
    invalidateViewReads();
    closeContextMenu?.();
    contextSelection.value = undefined;
    const selected = attrs.selection;
    waitingForSelectionReset.value = !!attrs['onUpdate:selection'] && selected != null
      && (!Array.isArray(selected) || selected.length > 0);
    clearSelection();
    outerParams.value = undefined;
    results.value = undefined;
    page.first = 0;
    page.total = 0;
    loaded.value = false;
    loadFailed.value = false;
  }, { flush: 'sync' });

  function retry() {
    // A foreground load sets loading synchronously, including before it awaits IPC.
    if (showLoadError.value && !loading.value) return loader.load();
  }

  const disposeChanges = globalThis.electronAPI?.on('local:profiles-change', () => {
    if (!initialization || !isProfileTable(props.cacheKey)) return;
    if (props.listCacheKey) invalidateCache();
    loader.refresh();
  });
  const disposeProjectChanges = props.cacheKey === 'project-list' && globalThis.electronAPI?.on('local:projects-change', () => {
    if (initialization) loader.refresh();
  });

  onBeforeMount(async () => {
    const scope = activation;
    initialization = Promise.all([props.tableSort(), props.tableFilters()]).then(([initialSort, initialFilters]) => {
      filters.value = initialFilters;
      sort.sortField = initialSort.data?.sortField ?? '';
      sort.sortOrder = initialSort.data?.sortOrder ?? 0;
      sort.onChange = initialSort.onChange;
    });
    try {
      await initialization;
      if (scope !== activation) return;
      const restored = props.listCacheKey && (!props.listCacheShouldRestore || props.listCacheShouldRestore())
        && restoreFromCache();
      if (!restored && props.immediate) await loader.load();
    } finally {
      if (scope === activation) loaded.value = true;
    }
  });
  onMounted(restoreScroll);
  watch(rows, restoreScroll);
  onBeforeUnmount(() => {
    saveScroll();
    loader.dispose();
    activation++;
    sortRevision += 1;
    if (typeof disposeChanges === 'function') disposeChanges();
    if (typeof disposeProjectChanges === 'function') disposeProjectChanges();
  });

  function onFilterChange() {
    page.first = 0;
    return loader.load();
  }
  async function onSort(event) {
    sort.sortOrder = event.sortOrder ?? 0;
    sort.sortField = sort.sortOrder ? String(event.sortField ?? '') : '';
    page.first = 0;
    const revision = ++sortRevision;
    // Applying a sort is independent of remembering it for the next visit.
    const refreshed = loader.load();
    try {
      const saved = await sort.onChange?.({ sortField: sort.sortField, sortOrder: sort.sortOrder });
      if (saved?.code != null && saved.code !== 0) throw Error(saved.msg || saved.message || $t('保存失败'));
    } catch (error) {
      if (revision === sortRevision) globalThis.__localUiError?.(error?.message || String(error));
    }
    return refreshed;
  }
  function onPageSize(event) {
    if (props.cacheKey && event.value) localStorage.setItem('table:' + props.cacheKey, event.value);
    page.first = 0;
    return loader.load();
  }

  async function reload(invalidate = false) {
    const scope = activation;
    if (invalidate && props.listCacheKey) invalidateCache(true);
    await props.beforeRefresh?.();
    if (scope !== activation) return;
    await loader.load();
    if (scope === activation) await props.afterRefresh?.();
  }
  async function refresh(params = {}, reset = true) {
    outerParams.value = params;
    if (reset) page.first = 0;
    return reload();
  }
  function updateDataList(items) {
    results.value = items || [];
  }

  function operations(record) {
    return permittedActions(props.operation?.length ? props.operation : props.tableOperation(record));
  }

  function showMenu({ event, operation }, record, mode, onHide) {
    const scope = activation;
    openContextMenu(event, {
      operation: typeof props.operationHandler === 'function'
        ? operation.map(({ command, ...item }) => item) : operation,
      operationHandler: async item => {
        if (scope !== activation) return;
        try {
          await props.operationHandler?.({ ...clone(toRaw(item)), _event: event }, record, mode);
        } catch (error) {
          console.log(error);
        }
      },
      onHide: (...args) => { if (scope === activation) onHide?.(...args); },
    });
  }
  async function onContextMenu({ data, originalEvent }) {
    const scope = activation;
    if (!bindings.value.contextMenu) {
      contextSelection.value = undefined;
      return;
    }
    try {
      await props.prepareRowMenu?.(data);
    } catch (error) {
      if (scope === activation) console.error('[Table] prepare row menu failed', error);
    }
    if (scope !== activation) return;
    const operation = operations(data);
    if (!operation.some(item => item.visible !== false)) {
      contextSelection.value = undefined;
      return;
    }
    if (props.selectionMode === 'multiple' && selectionData.value?.length) clearSelection();
    showMenu({ event: originalEvent, operation }, data, 'single', () => { contextSelection.value = undefined; });
  }
  async function batchOperation(item) {
    const scope = activation, selected = selectionData.value;
    if (!selected?.length) return;
    try {
      const completed = await props.operationHandler?.(item, selected, 'batch');
      if (completed !== false && scope === activation) clearSelection();
    } catch (error) {
      console.log(error);
    }
  }

  function columnDetails(column) {
    const { key, style, alignFrozen, pt, headerSlot, slot, render, headerRender, ...details } = column;
    return { key, style, alignFrozen, pt, ...details };
  }
  function columnProps(column) {
    const { key, style, alignFrozen, pt, ...details } = columnDetails(column);
    return { field: key, headerStyle: style, frozen: !!alignFrozen, alignFrozen, pt: { ...cellParts, ...pt }, ...details };
  }

  const tableParts = computed(() => ({
    root: columnClasses.tableroot,
    table: [columnClasses.table, rows.value?.length ? 'pb-15' : 'flex-1 !h-full'],
    emptymessagecell: '!whitespace-normal !text-center',
    tbody: columnClasses.tbody,
    headerrow: columnClasses.headerrow,
    bodyrow: ({ props: parts }) => ({ class: columnClasses.bodyrow, 'data-row-id': parts.rowData[props.dataKey] }),
  }));

  return {
    loaded, loading, showLoadError, retry, rows, visibleColumns, filters, sort, selection, selectionData, contextSelection,
    page, pageSizeOptions, pageLabel, bindings, tableParts, cellParts, columnClasses, columnProps, columnDetails,
    onFilterChange, onSort, onPageSize, load: loader.load, reload, refresh, clearSelection, updateDataList,
    getParams, restoreFromCache, getCachedEntry, operations, showMenu, onContextMenu, batchOperation,
  };
}

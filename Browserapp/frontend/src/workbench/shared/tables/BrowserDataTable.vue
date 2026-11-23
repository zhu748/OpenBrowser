<script setup>
import { useAttrs, useTemplateRef } from './workbench-vue.js';
import { yr as sortIcon } from './utils-BIWenCnY.js';
import { a as Column, i as Select, o as DataTable } from './contextmenu-BBjizTDn.js';
import { t as Paginator } from './paginator-vnwyVxKC.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
import { t as Divider } from './divider-BXJIHZjP.js';
import { n as LoadingCover } from './m-input-select-C8pih1gY.js';
import { t as AnimatePresence } from './AnimatePresence-d-29l3Fb.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import RowActions from './workbench-row-actions.js';
import ColumnSettings from './workbench-column-settings.js';
import TableFilters from './workbench-table-filters.js';
import TableRefresh from './workbench-table-refresh.js';
import SelectionToolbar from './workbench-selection-toolbar.js';
import { useBrowserTable } from './workbench-browser-table-state.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  dataKey: { type: String, default: 'id' }, cacheKey: { type: String, default: '' },
  dataList: Array, operation: Array, tableParams: Object, selectionMode: String,
  immediate: { type: Boolean, default: true }, multipleOperation: { type: Boolean, default: true },
  paginator: { type: Boolean, default: true }, showTableHeader: { type: Boolean, default: true },
  showDisplay: { type: Boolean, default: true }, showReload: { type: Boolean, default: true },
  showActions: { type: Boolean, default: true }, showActionsMenu: { type: Boolean, default: true },
  skeleton: Boolean, pageRows: { type: Number, default: 10 },
  clearSelectionOnRequest: { type: Boolean, default: true },
  tableSort: { type: Function, default: () => ({}) }, tableFilters: { type: Function, default: () => [] },
  tableRequest: { type: Function, default: () => ({}) }, tableOperation: { type: Function, default: () => [] },
  operationHandler: Function, beforeRefresh: Function, afterRefresh: Function,
  listCacheKey: String, listCacheScope: Function, listCacheMeta: Function, listCacheShouldRestore: Function,
  prepareRowMenu: Function,
});
const columns = defineModel('columns', { type: Array, required: true });
const root = useTemplateRef('rootEl');
const table = useTemplateRef('dataTable');
const attrs = useAttrs();
const {
  loaded, loading, showLoadError, retry, rows, visibleColumns, filters, sort, selection, selectionData, contextSelection, page, pageSizeOptions,
  pageLabel, bindings, tableParts, cellParts, columnClasses, columnProps, columnDetails, onFilterChange, onSort, onPageSize,
  load, reload, refresh, clearSelection, updateDataList, getParams, restoreFromCache, getCachedEntry, operations, showMenu,
  onContextMenu, batchOperation,
} = useBrowserTable(props, columns, attrs, root, table);

defineExpose({
  rootElRef: root, selectionData, refresh, clearSelection, updateDataList, getDataList: () => rows.value,
  getParams, restoreFromCache, getCachedEntry,
});
</script>

<template>
  <div ref="rootEl" class="relative w-full h-full flex flex-col" :class="attrs.class">
    <div v-if="showTableHeader" class="flex items-start justify-between self-stretch gap-2 rx-header">
      <slot name="table-header">
        <div class="flex flex-1 gap-2 flex-wrap">
          <slot name="filter-before" />
          <TableFilters :filters="filters" @change="onFilterChange" />
          <slot name="filter-after" />
        </div>
        <div class="flex gap-2 items-center">
          <template v-if="showDisplay">
            <ColumnSettings v-model:columns="columns" :sort-field="sort.sortField" :sort-order="sort.sortOrder">
              <template #before><slot name="display-before" /></template>
            </ColumnSettings>
            <Divider layout="vertical" class="!mx-0 h-4" />
          </template>
          <slot name="reload-before" />
          <TableRefresh v-if="showReload" :loading="loading" @click="reload(true)" />
        </div>
      </slot>
    </div>
    <div class="table-wrapper position-relative flex-1 overflow-hidden">
      <DataTable ref="dataTable" v-model:context-menu-selection="contextSelection" v-model:selection="selection"
        :value="rows" v-bind="bindings" :sort-order="sort.sortOrder" :sort-field="sort.sortField"
        :pt="tableParts" @sort="onSort" @row-contextmenu="onContextMenu">
        <template #default>
          <slot name="column-before" :pt-props="cellParts" />
          <Column v-if="selectionMode" header-style="width:0%; " body-style="width:0%; "
            :selection-mode="selectionMode" :pt="cellParts">
            <template #headercheckboxicon="{ checked }">
              <Icon v-show="checked" name="base/rx_ic_checkmark" color="#ffffff" />
            </template>
            <template #rowcheckboxicon="{ checked }">
              <Icon v-show="checked" name="base/rx_ic_checkmark" color="#ffffff" />
            </template>
          </Column>
          <Column v-for="column in visibleColumns" :key="column.key" v-bind="columnProps(column)">
            <template #header>
              <div :class="columnClasses.columntitle">
                <slot :name="column.headerSlot" :column="columnDetails(column)">
                  <component v-if="column.headerRender" :is="column.headerRender" :column="columnDetails(column)" />
                  <template v-else>{{ column.title }}</template>
                </slot>
              </div>
            </template>
            <template #body="{ data, index }">
              <slot :name="column.slot" :data="data" :index="index" :column="columnDetails(column)">
                <Skeleton v-if="column.skeleton && !data.id" v-bind="column.skeleton" />
                <component v-else-if="column.render" :is="column.render" :data="data" :index="index"
                  :column="columnDetails(column)" :class="column.classes" />
                <div v-else :style="{ width: column.width ? column.width + 'px' : undefined }" :class="column.classes"
                  :title="column.getText?.(data) || data[column.key]">{{ column.getText?.(data) || data[column.key] }}</div>
              </slot>
            </template>
            <template #sorticon="{ sorted, sortOrder, class: iconClass }">
              <div :class="iconClass">
                <Icon :name="sortIcon(sorted ? sortOrder : 0)" size="12px" color="var(--colors-icon-icon-note)" />
              </div>
            </template>
          </Column>
          <Column v-if="showActions" field="actions" :header="$t('操作')" align-frozen="right"
            frozen header-style="width: 0px;" :pt="{ columntitle: columnClasses.columntitle, ...cellParts }">
            <template #body="{ data }">
              <div class="flex items-center">
                <slot name="actions-extra" :data="data" />
                <slot name="actions" :data="data">
                  <RowActions :show-menu="showActionsMenu" :loading-operation-map="data.loadingOperationMap"
                    :operation="operations(data)" @quick-click="operationHandler?.($event, data, 'single')"
                    @more="showMenu($event, data, 'single')" />
                </slot>
              </div>
            </template>
          </Column>
        </template>
        <template v-for="(_, name) in $slots" #[name]="scope"><slot :name="name" v-bind="scope ?? {}" /></template>
        <template #empty>
          <div v-if="showLoadError" class="flex flex-col items-center justify-center gap-3 py-6">
            <div role="status">{{ $t('列表读取失败') }}</div>
            <button type="button" class="table-retry" :aria-disabled="loading" @click="retry">{{ $t('重试') }}</button>
          </div>
          <slot v-else-if="loaded" name="table-empty" />
        </template>
      </DataTable>
      <LoadingCover v-if="!skeleton" v-model="loading" :opacity="0.9" />
    </div>
    <div v-if="paginator" class="rx-paginator">
      <Paginator v-model:first="page.first" template="JumpToPageInput PrevPageLink PageLinks NextPageLink"
        :page-link-size="5" :rows="page.rows" :total-records="page.total" @page="load()">
        <template #start>
          <div class="flex flex-1 items-center rx-paginator-jump">
            <div>{{ pageLabel }}</div>
            <Select v-model="page.rows" name="rowsPerPage" style="width: fit-content;" size="xxs" :filter="false"
              option-value="value" :options="pageSizeOptions" @change="onPageSize" />
            <div class="flex flex-1 items-center gap-2 justify-end"><div>{{ $t('跳转页数至') }}</div></div>
          </div>
        </template>
      </Paginator>
    </div>
    <AnimatePresence>
      <SelectionToolbar v-if="multipleOperation && selectionMode === 'multiple' && selectionData?.length"
        :selection="selectionData" :total="rows.length" :operation="operations(selectionData)" :batch-operation="batchOperation"
        @clear-selection="clearSelection" @batch-more="showMenu($event, selectionData, 'batch')">
        <template v-if="$slots['multiple-operation']" #custom-operation>
          <slot name="multiple-operation" :selection="selectionData" :clear-selection="clearSelection" />
        </template>
      </SelectionToolbar>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.table-retry {
  padding: 4px 12px;
  border: 1px solid var(--colors-border-border-action, currentColor);
  border-radius: 6px;
  background: var(--colors-background-bg-action, transparent);
  color: var(--colors-text-text-primary, inherit);
  cursor: pointer;
}
.table-retry:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.table-retry[aria-disabled="true"] {
  cursor: wait;
  opacity: 0.7;
}
</style>

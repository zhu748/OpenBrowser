<script setup>
import { computed, getCurrentInstance, useAttrs, useTemplateRef } from './workbench-vue.js';
import { yr as sortIcon } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { a as Column, o as DataTable, t as ContextMenu } from './contextmenu-BBjizTDn.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
import { t as Divider } from './rx-divider-Ci3C58Q3.js';
import { n as LoadingCover } from './m-input-select-C8pih1gY.js';
import { t as Paginator } from './table-paginator-DmCNA2td.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import TableColumns from './workbench-compact-table-columns.js';
import TableFilters from './workbench-compact-table-filters.js';
import TableRefresh from './workbench-table-refresh.js';
import RowActions from './workbench-compact-row-actions.js';
import SelectionBar from './workbench-compact-selection-bar.js';
import { isSkeleton, useCompactTable } from './workbench-compact-table-state.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  dataKey: { default: 'id' }, cacheKey: { default: '' }, displayKey: {},
  model: { default: () => [] }, columns: { default: () => [] }, dataList: {}, selectionMode: {}, tableParams: {},
  immediate: { type: Boolean, default: true }, pageSize: { default: 10 }, loading: { default: 'mask' },
  regions: {}, actionsPinned: { type: Boolean, default: true }, isRowDisabled: Function, remember: {},
  tableRequest: { type: Function, default: () => ({}) }, tableFilters: { type: Function, default: () => [] },
  tableSort: Function, beforeRefresh: Function, afterRefresh: Function,
});
const providedSelection = defineModel('selection');
const controlled = Object.keys(getCurrentInstance().vnode.props ?? {})
  .some(key => key === 'selection' || key.toLowerCase() === 'onupdate:selection');
const root = useTemplateRef('rootEl');
const menu = useTemplateRef('ctxmenu');
const attrs = useAttrs();
const {
  columns, visibleColumns, regions, showActions, sort, page, selection, selectedRows, selectedActions, clearSelection,
  filters, ready, loading, rows, displayedRows, showSkeleton, selectAll, toggleAll, virtualScrollerOptions, tableProps,
  contextSelection, menuItems, showPreventMask, hidePreventMask, isPending, actionsFor, openRowMenu, openBulkMenu,
  runMenuAction, getParams, load, onFilterChange, onSort, reload, refresh, update,
} = useCompactTable(props, attrs, providedSelection, controlled, root, menu);

const checkboxParts = { headercell: '_headercell_yncx7_54', bodycell: '_bodycell_yncx7_15' };
function cellParts(column) {
  return {
    headercell: checkboxParts.headercell, columnheadercontent: '_header_text_yncx7_1',
    bodycell: { class: [checkboxParts.bodycell, '_body_text_yncx7_8'], ...column?.cellProps },
  };
}
const tableParts = computed(() => ({
  root: '_tableroot_yncx7_15',
  table: ['_table_yncx7_15', { 'flex-1 !h-full': !displayedRows.value?.length }],
  emptymessagecell: '!whitespace-normal !text-center',
  tbody: '_tbody_yncx7_25',
  headerrow: '_headerrow_yncx7_54',
  bodyrow: ({ props: { rowData } }) => ({
    class: ['_bodyrow_yncx7_25', (isSkeleton(rowData) || props.isRowDisabled?.(rowData)) && 'row-disabled'],
    dataRowId: rowData?.[props.dataKey],
  }),
}));
function columnDetails({ headerRender, headerSlot, render, slot, ...column }) { return column; }

defineExpose({ getParams, getColumns: () => columns.value, getRows: () => rows.value ?? [], clearSelection, refresh, update });
</script>

<template>
  <div ref="rootEl" class="w-full h-full flex flex-col" :class="attrs.class">
    <div v-if="regions.header" class="w-full px-6 py-2 flex flex-wrap items-start justify-between gap-2">
      <slot name="header">
        <div class="flex flex-1 flex-wrap items-center gap-2 min-w-0 basis-64">
          <slot name="filter-before" />
          <TableFilters v-if="filters?.length" :filters="filters" @change="onFilterChange" />
          <slot name="filter-after" />
        </div>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <slot name="toolbar" />
          <TableColumns v-if="displayKey" v-model="columns" :sort-field="sort.enabled ? sort.field : ''" :sort-order="sort.enabled ? sort.order : 0" />
          <Divider v-if="displayKey && regions.reload" class="!h-5" vertical line-only />
          <TableRefresh v-if="regions.reload" :loading="loading" show-label @click="reload(true)" />
        </div>
      </slot>
    </div>
    <div class="relative flex-1 overflow-hidden">
      <DataTable v-bind="tableProps" v-model:selection="selection" :virtual-scroller-options="virtualScrollerOptions"
        :selection-mode="showSkeleton ? undefined : selectionMode" :select-all="selectAll" :value="displayedRows"
        :context-menu-selection="contextSelection" :sort-field="sort.enabled ? sort.field : undefined"
        :sort-order="sort.enabled ? sort.order : undefined" :pt="tableParts" @sort="onSort" @select-all-change="toggleAll">
        <template #default>
          <slot name="column-before" :pt-props="checkboxParts" />
          <Column v-if="selectionMode && !showSkeleton" :selection-mode="selectionMode" header-style="width:0%" body-style="width:0%" :pt="checkboxParts">
            <template #headercheckboxicon="{ checked }">
              <Icon v-show="checked" name="base/rx_ic_checkmark" color="#ffffff" />
            </template>
            <template #rowcheckboxicon="{ checked }">
              <Icon v-show="checked" name="base/rx_ic_checkmark" color="#ffffff" />
            </template>
          </Column>
          <Column v-for="column in visibleColumns" :key="column.field" v-bind="column.props" :field="column.field" :pt="cellParts(column)">
            <template #header>
              <component :is="column.headerRender" v-if="column.headerRender" :column="columnDetails(column)" />
              <slot v-else :name="column.headerSlot" :column="columnDetails(column)">{{ column.header }}</slot>
            </template>
            <template #body="{ data, index }">
              <template v-if="isSkeleton(data)">
                <Skeleton v-if="column.skeleton" v-bind="column.skeleton" />
                <Skeleton v-else width="60%" height="1rem" />
              </template>
              <component :is="column.render" v-else-if="column.render" :column="columnDetails(column)" :data="data" :index="index" />
              <slot v-else :name="column.slot" :column="columnDetails(column)" :data="data" :index="index">
                {{ column.getText?.(data) || data[column.field] }}
              </slot>
            </template>
            <template v-if="sort.enabled && column.props?.sortable" #sorticon="{ sorted, sortOrder, class: iconClass }">
              <div :class="iconClass"><Icon :name="sortIcon(sorted ? sortOrder : 0)" size="12px" color="var(--colors-icon-icon-note)" /></div>
            </template>
          </Column>
          <Column v-if="showActions" field="actions" :header="$t('操作')" :frozen="actionsPinned"
            :align-frozen="actionsPinned ? 'right' : undefined"
            header-style="width: 0; min-width: max-content; white-space: nowrap"
            body-style="width: 0; min-width: max-content; white-space: nowrap" :pt="cellParts()">
            <template #body="{ data, index }">
              <Skeleton v-if="isSkeleton(data)" width="4rem" height="1rem" />
              <slot v-else name="actions" :data="data" :index="index" :is-pending="isPending" :model="actionsFor({ row: data })"
                :open-menu="event => openRowMenu({ originalEvent: event, data, index })">
                <RowActions :model="actionsFor({ row: data })" :data="data" :is-pending="isPending"
                  :show-menu="regions.actions !== 'quick'" @more="openRowMenu({ originalEvent: $event, data, index })" />
              </slot>
            </template>
          </Column>
        </template>
        <template #empty><slot v-if="ready && !showSkeleton" name="empty" /></template>
      </DataTable>
      <SelectionBar v-if="regions.selectionBar && selectionMode === 'multiple' && selectedRows.length"
        v-model:selection="selection" :total="rows?.length ?? 0" :model="selectedActions" :is-pending="isPending" @more="openBulkMenu">
        <slot name="selection-actions" :selection="selectedRows" :clear="clearSelection" />
      </SelectionBar>
      <LoadingCover v-if="props.loading !== 'skeleton'" v-model="loading" :opacity="0.9" />
    </div>
    <Paginator v-if="regions.paginator" v-model:first="page.first" v-model:rows="page.size"
      :cache-key="cacheKey" :total-records="page.total" @update="load()" />
    <ContextMenu ref="ctxmenu" :model="menuItems" :pt="{ root: '!border-0.5' }"
      @show="showPreventMask" @before-hide="hidePreventMask" @hide="contextSelection = null">
      <template #item="{ item, props: menuProps }">
        <div v-if="item.separator" class="w-full h-px bg-[var(--colors-border-border-subtle,#e6e8ea)] my-1"></div>
        <div v-else-if="item.render" class="w-full" @click.stop><component :is="item.render" :item="item" /></div>
        <a v-else-if="item.items?.length" v-bind="menuProps.action" class="!pa-0">
          <div class="flex items-center w-full gap-1.5 px-2.5 py-2 text-13px">
            <Icon v-if="item.icon" :name="item.icon" :class="item.iconClass" />
            <span class="flex-1">{{ item.label }}</span>
            <Icon name="base/rx_ic_chevron_right" />
          </div>
        </a>
        <div v-else v-tooltip="{ value: item.menuTooltip, delay: 300 }"
          class="flex items-center w-full gap-1.5 px-2.5 py-2 text-13px cursor-pointer"
          :class="{ 'opacity-40 pointer-events-none': item.disabled || isPending(item) }" @click.stop="runMenuAction($event, item)">
          <Icon v-if="item.icon || isPending(item)" :name="isPending(item) ? 'base/rx_ic_progress_bar' : item.icon"
            :class="[item.iconClass, isPending(item) && 'animate-spin']" />
          <span class="flex-1">{{ item.label }}</span>
          <div v-if="item.suffixLabel || item.suffixIcon" class="flex items-center gap-1 shrink-0">
            <Icon v-if="item.suffixIcon" :name="item.suffixIcon" :class="item.iconClass" />
            <span v-if="item.suffixLabel" :class="item.suffixLabelClass">{{ item.suffixLabel }}</span>
          </div>
        </div>
      </template>
    </ContextMenu>
  </div>
</template>

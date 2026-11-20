<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as workspaceCode } from './workspace-CNvgSgaH.js';
import { a as Select, i as Button, n as Badge, r as Checkbox } from './ScriptSchemaForm-z_48GvPJ.js';

const props = defineProps({
  allSelected: Boolean, activeItem: Object, hasMore: Boolean, items: { type: Array, required: true }, loadError: String,
  loadingMore: Boolean, projectOptions: Array, query: String, selectedCount: Number, selectedIds: Set,
  selectedProjectId: String, selectAllLoading: Boolean,
});
const emit = defineEmits(['cancel', 'choose', 'confirm', 'hover', 'loadMore', 'projectChange', 'retry', 'search', 'toggleAll']);
function code(item) {
  const { workspaceName, windowSortNum, windowName } = item.payload;
  if (!windowSortNum) return windowName ? '' : item.title;
  const workspace = workspaceCode(workspaceName);
  return workspace ? workspace + '-' + windowSortNum : windowSortNum;
}
function loadMore(event) {
  if (!props.hasMore || props.loadingMore || props.selectAllLoading || props.loadError) return;
  const list = event.currentTarget;
  if (list.scrollHeight - list.scrollTop - list.clientHeight <= 24) emit('loadMore');
}
function chooseActive(event) {
  if (event.isComposing || event.keyCode === 229) return;
  const item = props.activeItem ?? props.items[0];
  if (item) emit('choose', item);
}
</script>

<template>
  <div class="window-picker-popover">
    <div class="window-picker-header">
      <span>{{ $t('选择窗口') }}</span><span class="window-picker-count">{{ $t('已选择{count}项', { count: selectedCount }) }}</span>
    </div>
    <div class="window-picker-search-wrap">
      <Checkbox :model-value="allSelected" class="window-picker-select-all" input-id="window-picker-select-all"
        :disabled="selectAllLoading || (!items.length && !hasMore)" @update:model-value="emit('toggleAll')">
        <i v-if="selectAllLoading" class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>{{ $t('全选') }}</span>
      </Checkbox>
      <Select class="window-picker-project-select" :model-value="selectedProjectId" :options="projectOptions" :aria-label="$t('项目')"
        @mousedown.stop @update:model-value="emit('projectChange', String($event ?? ''))" />
      <label class="window-picker-search" @mousedown.stop>
        <Icon name="base/rx_ic_magnify" size="16" />
        <input :value="query" :placeholder="$t('搜索窗口')" type="text" @input="emit('search', $event.target.value)" @keydown.enter.prevent="chooseActive">
      </label>
    </div>
    <div class="window-picker-list" :aria-busy="loadingMore || selectAllLoading" @scroll.passive="loadMore">
      <Checkbox v-for="item in items" :key="item.id" :model-value="selectedIds.has(item.id)" class="window-picker-item"
        :class="{ 'window-picker-item--active': activeItem?.id === item.id, 'window-picker-item--selected': selectedIds.has(item.id) }"
        :input-id="'window-picker-' + item.id" @mouseenter="emit('hover', item)" @update:model-value="emit('choose', item)">
        <Icon class="window-picker-flag" :name="item.iconName || 'base/rx_ic_route2'" fallback="base/rx_ic_route2" size="16" color="var(--colors-icon-icon-tertiary)" />
        <span class="window-picker-title">
          <span v-if="code(item)" class="window-picker-title__code">{{ code(item) }}</span>
          <span v-if="item.payload.windowName" class="window-picker-title__name">{{ code(item) ? '· ' : '' }}{{ item.payload.windowName }}</span>
          <span v-if="item.payload.windowRemark" class="window-picker-title__remark">{{ code(item) || item.payload.windowName ? '· ' : '' }}{{ item.payload.windowRemark }}</span>
        </span>
        <Badge v-if="item.isOpen" class="window-open-badge" type="open" :label="$t('窗口已打开')" />
      </Checkbox>
      <div v-if="loadingMore" class="window-picker-list-state" role="status">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>{{ $t('加载中...') }}</span>
      </div>
      <div v-else-if="loadError" class="window-picker-list-state window-picker-list-state--error" role="alert">
        <span>{{ loadError }}</span><button type="button" @click="emit('retry')">{{ $t('重试') }}</button>
      </div>
      <div v-else-if="!items.length" class="window-picker-list-state">{{ $t('没有找到结果') }}</div>
    </div>
    <div class="window-picker-footer">
      <div class="window-picker-actions">
        <Button :icon="false" class="window-picker-cancel" variant="secondary" @mousedown.prevent="emit('cancel')">{{ $t('取消') }}</Button>
        <Button :icon="false" class="window-picker-done" variant="primary" @mousedown.prevent="emit('confirm')">{{ $t('完成') }} ({{ selectedCount }}) </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, useTemplateRef, watch } from './workbench-vue.js';
import { yr as sortIcon } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as Draggable, r as Popover } from './contextmenu-BBjizTDn.js';
import { t as Toggle } from './rx-toggle-switch-BI8eb18U.js';

const props = defineProps({ sortField: { default: '' }, sortOrder: { default: 0 } });
const columns = defineModel({ type: Array, default: () => [] });
const displayed = ref([]);
const dragInProgress = ref(false);
const popover = useTemplateRef('popover');
const hiddenSort = computed(() => {
  if (!props.sortField || !columns.value.length) return false;
  const sorted = columns.value.find(column => column.field === props.sortField);
  return !sorted || sorted._visible === false;
});
watch(columns, items => {
  if (!dragInProgress.value) displayed.value = items.map(column => ({ ...column }));
}, { immediate: true });
function finishDrag() {
  dragInProgress.value = false;
  columns.value = displayed.value;
}
function toggleColumn(column, visible) {
  column._visible = visible;
  columns.value = columns.value.map(item => item.field === column.field ? { ...item, _visible: visible } : item);
}
</script>

<template>
  <div class="flex">
    <div class="relative inline-flex">
      <Button severity="secondary" size="xxs" outlined icon="base/rx_ic_slider_v"
        :label="$t('自定义排版')" @click="popover?.instance?.toggle($event)" />
      <div v-if="hiddenSort" class="pointer-events-none absolute top-0 right-0 size-8px translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--colors-background-bg-brand)]"></div>
    </div>
    <Popover ref="popover">
      <div class="py-1.5 px-1">
        <Draggable v-model="displayed" :animation="150" handle=".handle" @start="dragInProgress = true" @end="finishDrag">
          <div v-for="column in displayed" :key="column.field" class="flex items-center _item_1ror2_1">
            <Icon name="base/rx_ic_dots_drag" class="handle cursor-grab" />
            <span class="flex-auto font-500" :class="{ 'text-[var(--colors-text-text-brand)]': sortField === column.field }">
              {{ column.header }}
              <Icon v-if="sortField === column.field" :name="sortIcon(sortOrder ?? 0)" size="12px" color="var(--colors-icon-icon-note)" />
            </span>
            <Toggle v-if="!column.disabledToggle" :model-value="column._visible" @update:model-value="toggleColumn(column, $event)" />
          </div>
        </Draggable>
      </div>
      <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    </Popover>
  </div>
</template>

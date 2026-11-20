<script setup>
import { computed, toRaw } from './workbench-vue.js';
import { cr as clone } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { permittedActions } from './workbench-table-actions.js';

const props = defineProps({
  operation: Array, loadingOperationMap: Object,
  showMenu: { type: Boolean, default: true },
  actionIcon: { type: String, default: 'base/rx_ic_more-v' },
});
const emit = defineEmits(['quickClick', 'more']);
const operations = computed(() => permittedActions(props.operation));
const shortcuts = computed(() => {
  const result = [];
  const pending = [...operations.value];
  while (pending.length) {
    const action = pending.pop();
    if (action.quick) result.unshift(action);
    if (action.items?.length) pending.unshift(...action.items);
  }
  return result;
});
const hasMenu = computed(() => operations.value.some(item => item.visible !== false));

function isLoading(item) {
  return props.loadingOperationMap?.[item.name];
}
function clickShortcut(event, item) {
  if (item.disabled || isLoading(item)) return;
  emit('quickClick', { ...clone(toRaw(item)), _event: event, _type: 'quick' });
}
function showMore(event) {
  emit('more', { event, operation: toRaw(operations.value) });
}
</script>
<template>
  <div class="flex items-center">
    <div class="flex items-center gap-2 quick">
      <div v-for="item in shortcuts" :key="item.name" class="quick-item" :class="{ disabled: item.disabled || isLoading(item) }">
        <component :is="item.render" v-if="item.render" />
        <div v-else v-tooltip.top="{ value: item.disabled ? item.disabledTooltip : item.tooltip, showDelay: 500, pt: { root: '!max-w-sm' } }"
          class="flex items-center" @click.stop="clickShortcut($event, item)">
          <Icon class="pointer-events-none quick-icon" :class="[item.iconClass, { 'pi-spin': isLoading(item) }]"
            :name="isLoading(item) ? 'base/rx_ic_progress_bar' : item.icon" />
        </div>
      </div>
      <div v-if="showMenu && hasMenu" v-tooltip.top="{ value: $t('更多操作'), showDelay: 500, pt: { text: { class: '!whitespace-nowrap !break-keep' } } }"
        class="quick-item" @click.stop="showMore">
        <slot name="more-icon"><Icon :name="actionIcon" class="pointer-events-none quick-icon" /></slot>
      </div>
    </div>
  </div>
</template>

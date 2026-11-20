<script setup>
import { computed, reactive } from './workbench-vue.js';
import { wr as isObject } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const props = defineProps({ total: {}, model: { type: Array, default: () => [] }, isPending: { type: Function, default: () => false } });
const selection = defineModel('selection');
const emit = defineEmits(['more']);
const executing = reactive(new Set());
const bulkActions = computed(() => props.model.filter(item => !item.onlyQuick && item.multiple));
const groups = computed(() => {
  const groupsByName = new Map();
  for (const item of bulkActions.value) {
    if (!isObject(item.multiple) || item.separator) continue;
    const { name = 'default', render, showLabel, iconProps, discountBadge, ...props } = item.multiple;
    if (!groupsByName.has(name)) groupsByName.set(name, []);
    groupsByName.get(name).push({ ...item, render, showLabel, iconProps, props });
  }
  return Array.from(groupsByName).sort(([left], [right]) => left.localeCompare(right));
});
const hasMore = computed(() => bulkActions.value.length > groups.value.reduce((count, [, items]) => count + items.length, 0));
function key(item) {
  return String(item.key ?? item.icon ?? item.label ?? '');
}
function pending(item) {
  return executing.has(key(item)) || props.isPending(item);
}
async function run(event, item) {
  if (item.disabled || pending(item)) return;
  const id = key(item);
  executing.add(id);
  try {
    const result = await item.command?.({ originalEvent: event, item, data: selection.value });
    if (result !== false) selection.value = [];
  } finally {
    executing.delete(id);
  }
}
</script>

<template>
  <div class="absolute bottom-3/20 left-1/2 -translate-x-1/2 flex items-center z-100 actionbar">
    <div class="flex items-center baritem">
      <i18n-t tag="div" scope="global" :keypath="$t('{selected} / {total} 已选中', { selected: '{selected}', total: '{total}' })">
        <template #selected><span class="baritem-light">{{ selection?.length }}</span></template>
        <template #total><span class="baritem-light">{{ total }}</span></template>
      </i18n-t>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" color="#FAFAFA" @click="selection = []" />
    </div>
    <div v-for="[name, items] in groups" :key="name" class="icons" :class="{ 'has-label': items.some(item => item.showLabel) }">
      <template v-for="item in items" :key="key(item)">
        <component :is="item.render" v-if="item.render" :item="item" />
        <div v-else v-tooltip.top="{ value: item.disabled ? item.disabledTooltip : '', showDelay: 500 }"
          class="icon-item" :class="{ disabled: item.disabled || pending(item) }" @click="run($event, item)">
          <Icon class="pointer-events-none" :class="{ 'animate-spin': pending(item) }" color="#FAFAFA"
            :name="pending(item) ? 'base/rx_ic_progress_bar' : item.icon" v-bind="pending(item) ? {} : item.iconProps" />
          <span v-if="item.showLabel" class="icon-label">{{ item.label }}</span>
        </div>
      </template>
    </div>
    <div><slot /></div>
    <div v-if="hasMore" class="icons cursor-pointer" @click.stop="emit('more', $event)">
      <Icon class="pointer-events-none" name="base/rx_ic_more-v" color="#FAFAFA" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, toRaw } from './workbench-vue.js';
import { cr as clone } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as motion } from './motion-BwnyBP9B.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const props = defineProps({
  selection: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  operation: { type: Array, default: () => [] },
  batchOperation: Function,
});
const emit = defineEmits(['clearSelection', 'batchMore']);
const pending = ref({});
const actions = computed(() => {
  const menu = [];
  const groups = new Map();
  let shortcuts = 0;
  for (const action of props.operation) {
    if (!action.multiple) continue;
    const { items, ...details } = toRaw(action);
    menu.push({ ...details, items: items?.filter(item => item.multiple !== false) });
    const settings = details.multipleProps;
    if (!settings) continue;
    if (!groups.has(settings.name)) groups.set(settings.name, []);
    groups.get(settings.name).push({ ...details, ...settings, source: details });
    shortcuts++;
  }
  return { menu, showMore: menu.length > shortcuts, groups: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)) };
});

async function runShortcut(event, item) {
  if (item.disabled || pending.value[item.name]) return;
  pending.value[item.name] = true;
  try {
    await props.batchOperation?.({ ...clone(toRaw(item)), _event: event, _type: 'batch_quick' });
  } finally {
    delete pending.value[item.name];
  }
}
function onKey(event, disabled) {
  if (event.repeat || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (!disabled) event.currentTarget.click();
}
function more(event) {
  emit('batchMore', { event, operation: actions.value.menu });
}
</script>
<template>
  <motion.div class="multiple" :initial="{ scale: 0.98, x: '-50%', opacity: 0 }" :animate="{ scale: 1, x: '-50%', opacity: 1 }"
    :exit="{ scale: 0.98, x: '-50%', opacity: 0 }" :transition="{ duration: 0.32, ease: [0, 0.71, 0.2, 1.01] }">
    <div class="multiple-selected">
      <div>
        <i18n-t :keypath="$t('{selected} / {total} 已选中', { selected: '{selected}', total: '{total}' })" scope="global">
          <template #selected><span class="text-white font-semibold">{{ selection.length }}</span></template>
          <template #total><span class="text-white font-semibold">{{ total }}</span></template>
        </i18n-t>
      </div>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" color="#ffffff" @click="emit('clearSelection')" />
    </div>
    <slot name="custom-operation">
      <div v-for="[name, group] in actions.groups" :key="name" class="multiple-group">
        <div v-for="item in group" :key="item.name" v-tooltip.top="{ value: item.disabled ? item.disabledTooltip : '', showDelay: 500 }"
          :class="[{ disabled: item.disabled }, 'multiple-group-item']" role="button"
          :tabindex="item.disabled ? -1 : 0" :aria-disabled="item.disabled"
          @click="runShortcut($event, item.source)" @keydown="onKey($event, item.disabled)">
          <Icon class="pointer-events-none" :name="item.icon" v-bind="item.iconProps" />
          <span v-if="item.showLabel" class="icon-label">{{ typeof item.label === 'function' ? item.label() : item.label }}</span>
        </div>
      </div>
      <div v-if="actions.showMore" class="multiple-group cursor-pointer" role="button" tabindex="0"
        :aria-disabled="false" @click.stop="more" @keydown="onKey">
        <Icon name="base/rx_ic_more-v" class="pointer-events-none" />
      </div>
    </slot>
  </motion.div>
</template>

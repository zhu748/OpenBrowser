<script setup>
import { computed } from './workbench-vue.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const props = defineProps({
  model: { type: Array, default: () => [] },
  data: {},
  showMenu: { type: Boolean, default: true },
  isPending: { type: Function, default: () => false },
});
const emit = defineEmits(['more']);
const items = computed(() => props.model.filter(item => item.quick && item.icon && !item.onlyMultiple));
</script>

<template>
  <div class="flex items-center gap-1">
    <div v-for="item in items" :key="item.key ?? item.icon"
      v-tooltip.top="{ value: item.disabled && item.disabledTooltip ? item.disabledTooltip : item.label, showDelay: 500 }">
      <Button :icon="item.icon" :disabled="item.disabled || isPending(item)" :loading="isPending(item)"
        text size="xxs" severity="secondary" :on-click="event => item.command?.({ originalEvent: event, item, data })" />
    </div>
    <Button v-if="showMenu" text size="xxs" severity="secondary" icon="base/rx_ic_more-v"
      :on-click="event => emit('more', event)" />
  </div>
</template>

<script setup>
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
const props = defineProps({ disabled: Boolean, disabledTooltip: {}, options: { type: Array, default: () => [] } });
const value = defineModel();
const emit = defineEmits(['change']);
function tooltip(option) {
  return props.disabled ? props.disabledTooltip : option.disabled ? option.disabledTooltip : option.tooltip;
}
function select(option) {
  if (option.disabled || props.disabled) return;
  value.value = option;
  emit('change', option);
}
</script>

<template>
  <div class="flex overflow-hidden rounded-1.5 switch-group">
    <button v-for="option in options" :key="option.value" type="button"
      v-tooltip.top="{ value: tooltip(option), showDelay: 500 }" :aria-label="option.label"
      :aria-pressed="value?.value === option.value" :disabled="option.disabled || disabled"
      class="flex-1 min-w-0 flex items-center justify-center cursor-pointer select-none transition-all duration-200 switch-group-item"
      :class="{ active: value?.value === option.value, disabled: option.disabled || disabled }" @click="select(option)">
      <slot name="item" :item="option">{{ option.label }}</slot>
    </button>
  </div>
</template>

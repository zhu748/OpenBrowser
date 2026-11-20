<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Select } from './select-Cc8zLK4m.js';

defineOptions({ inheritAttrs: false });
defineProps({ name: {}, icon: {}, iconColor: { default: 'var(--colors-text-text-placeholder, #575D60);' },
  size: { default: 'sm' }, filter: { type: Boolean, default: true }, optionLabel: { default: 'label' }, optionValue: {} });
const emit = defineEmits(['change']);
</script>

<template>
  <Select class="w-full" v-bind="$attrs" :option-label="optionLabel" :option-value="optionValue" :filter="filter" :input-id="name"
    :pt="{ root: size, option: '_option_1fjol_1' }" @change="emit('change', $event)">
    <template #dropdownicon><Icon name="base/rx_ic_chevron_down" /></template>
    <template #option="{ option }">
      <div v-tooltip.top="{ value: option.tooltip }" class="select-item">
        <Icon v-if="option.icon || icon" :name="option.icon || icon" :color="iconColor" fallback="base/rx_ic_earth" />
        <img v-if="option.image" class="select-item__image" :src="option.image" alt="" />
        <div>{{ option.label }}</div>
        <slot name="option-extra" :option="option" />
      </div>
    </template>
    <template v-if="!optionValue" #value="{ value, placeholder }">
      <div v-if="value" class="select-item">
        <Icon v-if="value.icon || icon" :name="value.icon || icon" :color="iconColor" fallback="base/rx_ic_earth" />
        <img v-if="value.image" class="select-item__image" :src="value.image" alt="" />
        <div>{{ value.label }}</div>
      </div>
      <div v-else>{{ placeholder }}</div>
    </template>
  </Select>
</template>

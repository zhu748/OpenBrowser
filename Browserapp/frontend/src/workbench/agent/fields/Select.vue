<script setup>
import { computed, normalizeClass, useAttrs } from './workbench-vue.js';
import { t as Select } from './select-Cc8zLK4m.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  optionLabel: { type: String, default: 'label' },
  optionValue: { type: String, default: 'value' },
  options: { type: Array, default: () => [] },
  overlayClass: null,
});
const model = defineModel();
const attrs = useAttrs();
const overlay = computed(() => normalizeClass(['agent-select-overlay', props.overlayClass ?? attrs['overlay-class']]));
</script>

<template>
  <Select v-bind="{ ...attrs, optionLabel, optionValue, options }" v-model="model"
    class="agent-select" :overlay-class="overlay" fluid>
    <template #dropdownicon><Icon name="base/rx_ic_chevron_down" size="12" /></template>
    <template #option="{ option }"><slot name="option" :option="option"><span>{{ option?.[optionLabel] ?? option }}</span></slot></template>
  </Select>
</template>

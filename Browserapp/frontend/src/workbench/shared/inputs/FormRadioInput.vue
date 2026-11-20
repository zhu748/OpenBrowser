<script setup>
import { t as RadioButton } from './radiobutton-B3i1EP5M.js';
defineOptions({ inheritAttrs: false });
defineProps({ name: {}, size: { default: 'sm' }, options: { type: Array, default: () => [] } });
function optionProps({ label, value, disabled, ...rest }) { return rest; }
</script>

<template>
  <div class="flex items-start flex-wrap gap-2" :class="size">
    <label v-for="option in options" :key="option.label" :for="name + '_' + option.value"
      class="flex items-center cursor-pointer min-w-25 radio" :class="{ 'cursor-not-allowed': option.disabled }">
      <RadioButton v-bind="{ ...$attrs, ...optionProps(option) }" :input-id="name + '_' + option.value"
        :name="name" :value="option.value" :disabled="option.disabled" />
      <div class="select-none text">{{ option.label }}</div>
    </label>
  </div>
</template>

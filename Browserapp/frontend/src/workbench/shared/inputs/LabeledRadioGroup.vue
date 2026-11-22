<script setup>
import { t as Radio } from './radiobutton-B3i1EP5M.js';

defineOptions({ inheritAttrs: false });
defineProps({ size: { default: 'sm' }, options: { type: Array, default: () => [] }, disabled: Boolean });
const emit = defineEmits(['change']);
const sizes = { xxs: '_xxs_1bi1f_1', xs: '_xs_1bi1f_10', sm: '_sm_1bi1f_19', md: '_md_1bi1f_28', lg: '_lg_1bi1f_37' };
function radioAttributes({ label, value, afterRender, disabled, ...attrs }) { return attrs; }
</script>

<template>
  <div class="flex items-start flex-wrap gap-2 rx-radio-group" :class="$attrs.class">
    <template v-for="option in options" :key="option.label">
      <label class="flex items-center rx-radio-group-item"
        :class="[sizes[size], disabled || option.disabled ? 'cursor-not-allowed' : 'cursor-pointer']"
        :for="$attrs.name + '_' + option.value">
        <Radio v-bind="{ ...$attrs, ...radioAttributes(option) }" :input-id="$attrs.name + '_' + option.value"
          :disabled="disabled || option.disabled" :value="option.value" @change="emit('change')" />
        <div class="select-none rx-radio-group-item__text">{{ option.label }}</div>
      </label>
      <component :is="option.afterRender" v-if="option.afterRender" />
    </template>
  </div>
</template>

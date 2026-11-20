<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
defineProps({ label: {}, tooltip: {}, required: Boolean });
</script>

<template>
  <label class="inline-flex items-center" :class="{ 'label--required': required }">
    <span class="tt-primary text-3 font-500 leading-5 label">{{ label }}</span>
    <Icon v-if="tooltip" v-tooltip.top="{ value: tooltip, showDelay: 300, pt: { root: '!max-w-70' } }"
      class="ml-1 align-middle" name="base/rx_ic_info" color="var(--colors-icon-icon-note, #AFB7BB)" size="12" />
  </label>
</template>

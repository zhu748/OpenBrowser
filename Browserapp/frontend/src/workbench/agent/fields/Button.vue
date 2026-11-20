<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineProps({
  disabled: Boolean,
  icon: { type: [Boolean, String], default: 'base/rx_ic_plus' },
  iconSize: { type: [Number, String], default: 18 },
  label: { type: String, default: 'button' },
  loading: Boolean,
  nativeType: { type: String, default: 'button' },
  variant: { type: String, default: 'accent' },
});
</script>

<template>
  <button class="agent-button" :class="`agent-button--${variant}`" :type="nativeType"
    :disabled="disabled || loading" :aria-busy="loading || undefined">
    <slot name="icon">
      <i v-if="loading" class="agent-button__icon i-svg-spinners:180-ring-with-bg" aria-hidden="true"></i>
      <Icon v-else-if="icon" class="agent-button__icon" :name="icon" :size="iconSize" aria-hidden="true" />
    </slot>
    <span class="agent-button__label"><slot>{{ label }}</slot></span>
  </button>
</template>

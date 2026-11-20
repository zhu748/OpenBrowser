<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
defineProps({ icon: {}, label: {}, disabled: Boolean, readonly: Boolean, tooltip: {} });
</script>

<template>
  <div v-tooltip.top="tooltip" class="flex items-center rx-tag" :class="{ 'icon-only': !label, disabled, readonly }">
    <Icon v-if="icon" class="pointer-events-none" :name="icon" :size="14" />
    <div v-if="label" class="select-none pointer-events-none rx-tag-label">{{ label }}</div>
  </div>
</template>

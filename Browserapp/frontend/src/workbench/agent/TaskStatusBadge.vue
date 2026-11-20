<script setup>
import { computed } from './workbench-vue.js';
import { t as GridLoader } from './grid-loader-BbJvp9z6.js';
defineProps({ status: {} });
const labels = computed(() => ({
  running: $t('执行中'), idle: $t('空闲中'), queued: 'Queued', completed: 'Completed', failed: 'Failed',
}));
</script>

<template>
  <span class="status-badge" :class="status">
    <GridLoader v-if="status === 'running'" class="status-icon" aria-hidden="true" />
    <span v-else class="status-icon" aria-hidden="true"></span>
    <span class="status-label">{{ labels[status] }}</span>
  </span>
</template>

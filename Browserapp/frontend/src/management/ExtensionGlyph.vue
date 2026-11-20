<script setup lang="ts">
defineProps<{ name: 'download' | 'upload' | 'refresh' | 'pin' | 'shield' | 'check' | 'more' | 'project' | 'previous' | 'next' }>();
</script>

<template>
  <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
    <path v-if="name === 'download'" d="M12 4v11m-4-4 4 4 4-4M5 16v4h14v-4" />
    <path v-else-if="name === 'upload'" d="M12 15V4m-4 4 4-4 4 4M5 16v4h14v-4" />
    <path v-else-if="name === 'refresh'" d="M20 4v5h-5m4.5 0A8 8 0 1 0 20 15" />
    <path v-else-if="name === 'pin'" d="M9 4h6l-.5 7 3 3v2h-11v-2l3-3L9 4Zm3 12v4" />
    <path v-else-if="name === 'shield'" d="M12 3 5 6v5c0 4 2.7 7.4 7 10 4.3-2.6 7-6 7-10V6l-7-3Zm-3 9 2 2 4-4" />
    <path v-else-if="name === 'check'" d="M20 11a8 8 0 1 0-3 7.2M12 7v5l3 2m5 2v4h-4" />
    <path v-else-if="name === 'project'" d="m12 4 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4m-16 4 8 4 8-4" />
    <path v-else-if="name === 'previous'" d="m14 6-6 6 6 6" />
    <path v-else-if="name === 'next'" d="m10 6 6 6-6 6" />
    <path v-else d="M5 12h.01m6.99 0h.01m6.99 0h.01" stroke-width="3" />
  </svg>
</template>

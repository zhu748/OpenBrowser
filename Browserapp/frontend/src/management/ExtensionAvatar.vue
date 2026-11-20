<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{ name: string; icon?: string }>();
const failed = ref('');
const src = computed(() => props.icon?.startsWith('data:image/') && props.icon !== failed.value ? props.icon : undefined);
</script>

<template>
  <img v-if="src" :src="src" @error="failed = src" class="extension-avatar" alt="" width="36" height="36">
  <span v-else class="extension-avatar extension-icon-fallback" aria-hidden="true">{{ [...name.trim()][0] || '扩' }}</span>
</template>

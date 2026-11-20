<script setup>
import { computed } from './workbench-vue.js';
import { n as useTheme } from './theme-mq6SsndU.js';
const props = defineProps({ platformIconDark: {}, platformIcon: {} });
const theme = useTheme();
const source = computed(() => theme.realTheme === 'dark' && props.platformIconDark || props.platformIcon);
</script>

<template>
  <img v-if="source" class="block" draggable="false" :src="source" alt="" />
</template>

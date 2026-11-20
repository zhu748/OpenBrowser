<script setup>
import { computed } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';

const props = defineProps({ opacity: { default: 0.7 }, size: { default: 32 } });
const visible = defineModel({ type: Boolean, required: true });
const iconSize = computed(() => Number.isNaN(Number(props.size)) ? props.size : Number(props.size) + 'px');
useCssVars(() => ({ ceca54c0: props.opacity, v743c8125: iconSize.value }));
</script>

<template>
  <div v-if="visible" class="absolute inset-0 flex items-center justify-center z-10 select-none">
    <div class="absolute inset-0 z-1 mask"></div>
    <img class="block mx-auto loading-circle z-2 loading-icon" src="/assets/loading-DReOWtmn.png" alt="" />
  </div>
</template>

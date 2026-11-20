<script setup>
import { computed } from './workbench-vue.js';

const props = defineProps({ value: { default: 0 }, size: { default: 32 }, strokeWidth: { default: 2 } });
const diameter = computed(() => Number(props.size) + Number(props.strokeWidth));
const center = computed(() => diameter.value / 2);
const radius = computed(() => Math.max(0, center.value - Math.max(1, diameter.value * 0.03) - Number(props.strokeWidth) / 2));
const path = computed(() => {
  const r = radius.value;
  return `M${center.value} ${center.value - r} a ${r} ${r} 0 0 1 0 ${2 * r} a ${r} ${r} 0 0 1 0 ${-2 * r}`;
});
const dash = computed(() => {
  const length = 2 * Math.PI * radius.value;
  return `${Number(props.value) / 100 * length}, ${length}`;
});
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${diameter} ${diameter}`" :width="size" class="block">
      <path class="circle-bg" :stroke-width="strokeWidth" :d="path" />
      <path class="circle-val" :stroke-width="strokeWidth" :stroke-dasharray="dash"
        :stroke-linecap="Number(value) <= 2 ? 'butt' : 'round'" :d="path" />
    </svg>
  </div>
</template>

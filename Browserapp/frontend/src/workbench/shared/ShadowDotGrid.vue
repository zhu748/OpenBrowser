<script setup>
import { computed } from './workbench-vue.js';

const dots = computed(() => {
  const shadows = [];
  for (let row = 0; row < 100; row++) {
    for (let column = 0; column < 100; column++) {
      shadows.push(`${column * 24}px ${row * 24}px var(--colors-background-bg-mode-reverse)`);
    }
  }
  return { boxShadow: shadows.join(', '), opacity: 0.1 };
});
</script>

<template>
  <div class="absolute inset-0 bg-[var(--colors-background-bg-example)] w-full h-full">
    <div class="size-2px rounded-full translate-x-[-10px] translate-y-[-10px]" :style="dots" />
  </div>
</template>

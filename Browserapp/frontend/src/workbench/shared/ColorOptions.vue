<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
defineProps({ colors: { type: Array, default: () => [] } });
const value = defineModel();
</script>

<template>
  <div class="flex items-center gap-5">
    <template v-for="color in colors" :key="color">
      <Icon v-if="color === value" name="base/rx_ic_check_line" :size="20" :color="color" />
      <div v-else class="w-5 h-5 rounded-full cursor-pointer" :style="{ backgroundColor: color }" @click="value = color"></div>
    </template>
  </div>
</template>

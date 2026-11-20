<script setup>
import { ref, useId } from './workbench-vue.js';
import { t as RadioButton } from './radiobutton-B3i1EP5M.js';
defineProps({ options: { type: Array, default: () => [] } });
const id = useId();
const selected = defineModel({ default: '' });
</script>

<template>
  <div class="card flex justify-center">
    <div class="flex flex-wrap gap-4">
      <div v-for="item in options" :key="item.value" class="flex items-center">
        <RadioButton v-model="selected" :input-id="`${item.value}-${id}`" :value="item.value" />
        <label :for="`${item.value}-${id}`" class="ml-2">{{ item.label }}</label>
      </div>
    </div>
  </div>
</template>

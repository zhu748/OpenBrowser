<script setup>
import { computed } from 'vue';

const props = defineProps({ inputs: { type: Array, default: () => [] } });
const fields = computed(() => props.inputs.filter(input => input.separator || ['number', 'text'].includes(input.type)));

function fieldAttrs(field) {
  return {
    ...field,
    oninput: () => {
      field.invalid = false;
      field.oninput?.();
    },
  };
}
</script>

<template>
  <div class="number-group">
    <template v-for="(field, index) in fields" :key="index">
      <div v-if="field.separator" class="number-group-separator">{{ field.value || ':' }}</div>
      <div v-else class="number-group-item">
        <input v-model="field.value" class="number-group-item-input" type="number" v-bind="fieldAttrs(field)">
        <div v-if="field.invalid" :class="['number-group-item-error', field.errorClass]">{{ field.errorMsg }}</div>
      </div>
    </template>
  </div>
</template>

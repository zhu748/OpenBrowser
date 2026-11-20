<script setup>
import { t as NumberInput } from './inputnumber-BD6BwCgc.js';
defineOptions({ inheritAttrs: false });
defineProps({ size: { default: 'sm' } });
defineEmits(['change']);
</script>

<template>
  <NumberInput v-bind="$attrs" :pt="{ root: size }" fluid @input="$emit('change')" />
</template>

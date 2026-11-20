<script setup>
import SelectButton from './workbench-prime-select-button.js';

defineProps({ size: { default: 'sm' }, allowEmpty: Boolean });
</script>

<template>
  <SelectButton :class="size" :allow-empty="allowEmpty">
    <template v-for="(_, name) in $slots" #[name]="slotProps"><slot :name="name" v-bind="slotProps ?? {}" /></template>
  </SelectButton>
</template>

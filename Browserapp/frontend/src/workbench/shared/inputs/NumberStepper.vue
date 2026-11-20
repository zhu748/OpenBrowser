<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as NumberInput } from './inputnumber-BD6BwCgc.js';
defineOptions({ inheritAttrs: false });
const value = defineModel();
</script>

<template>
  <NumberInput v-model="value" class="rx-input-number" button-layout="horizontal" show-buttons fluid v-bind="$attrs">
    <template #incrementicon><Icon name="base/rx_ic_plus" /></template>
    <template #decrementicon><Icon name="base/rx_ic_minus" /></template>
  </NumberInput>
</template>

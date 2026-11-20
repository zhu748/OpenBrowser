<script setup>
import { Accordion } from './workbench-prime-accordion.js';
</script>

<template>
  <Accordion>
    <template #collapseicon></template>
    <template #expandicon></template>
    <slot />
  </Accordion>
</template>

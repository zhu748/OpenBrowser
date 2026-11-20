<script setup>
import { t as InputNumber } from './inputnumber-BD6BwCgc.js';
defineProps({ size: { default: 'sm' }, fluid: { type: Boolean, default: true } });
</script>

<template><InputNumber :class="size" :fluid="fluid" /></template>

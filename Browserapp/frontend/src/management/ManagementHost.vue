<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { mountManagement, type ManagementScreen } from './mount';

const props = defineProps<{ screen: ManagementScreen }>();
const host = ref<HTMLElement>();
let dispose: (() => void) | undefined;

function render() {
  if (!host.value) return;
  dispose?.();
  dispose = mountManagement(host.value, props.screen);
}
onMounted(render);
watch(() => props.screen, render);
onBeforeUnmount(() => dispose?.());
</script>

<template><div ref="host"></div></template>

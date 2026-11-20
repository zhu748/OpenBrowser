<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { request, subscribe } from './desktop';
import { mountKernels } from './kernels/mount';
import { mountTemplates } from './templates/mount';

const { kind, openTemplate } = defineProps<{ kind: 'kernels' | 'templates'; openTemplate: (id?: number) => void }>();
const host = ref<HTMLElement>();
let dispose: (() => void) | undefined;
onMounted(() => {
  if (!host.value) return;
  dispose = kind === 'kernels'
    ? mountKernels(host.value, { request, subscribe, ops: window.ops })
    : mountTemplates(host.value, { request, openEditor: async id => openTemplate(id) });
});
onBeforeUnmount(() => dispose?.());
</script>

<template><div ref="host"></div></template>

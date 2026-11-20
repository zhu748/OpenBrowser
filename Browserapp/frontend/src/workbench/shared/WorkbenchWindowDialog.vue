<script setup>
import { ref } from './workbench-vue.js';
import { t as Dialog } from './dialog-CrBr3eoy.js';

defineOptions({ inheritAttrs: false });
defineEmits(['hide']);
const visible = ref(true);
globalThis.electronAPI.send('app:showCurrentWebviewWindow');
</script>

<template>
  <Dialog v-model:visible="visible" v-bind="$attrs"
    :style="{ width: '100vw', height: '100vh', maxHeight: '100vh', border: 'none' }" @hide="$emit('hide')">
    <slot />
  </Dialog>
</template>

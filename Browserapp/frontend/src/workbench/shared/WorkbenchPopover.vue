<script setup>
import { useTemplateRef } from './workbench-vue.js';
import { Popover } from './workbench-prime-contextmenu.js';
import { t as usePreventMask } from './usePreventMask-Cud6gNnu.js';

const instance = useTemplateRef('popover');
const { showPreventMask, hidePreventMask } = usePreventMask();
defineExpose({ instance, show(event, target) { instance.value?.show(event, target); showPreventMask(); },
  hide() { instance.value?.hide(); hidePreventMask(); } });
</script>

<template>
  <Popover ref="popover" class="_popover_1xqvm_1" @show="showPreventMask" @hide="hidePreventMask">
    <div><slot /></div>
    <div v-if="$slots.footer" class="_footer_1xqvm_12"><slot name="footer" /></div>
  </Popover>
</template>

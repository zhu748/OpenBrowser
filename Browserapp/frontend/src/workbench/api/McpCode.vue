<script setup>
import { t as Button } from './rx-button-DyzuUt-V.js';
import CodeEditor from './workbench-code-editor.js';

defineProps({ value: { type: String, required: true } });
defineEmits(['copy']);
</script>

<template>
  <div class="relative w-full _copy_osijo_32">
    <Button class="_copy-btn_osijo_32" text size="xxs" icon="base/rx_ic_copy" :label="$t('复制')" @click="$emit('copy', value)" />
    <CodeEditor class="min-h-75" :model-value="value" :editable="false" />
  </div>
</template>

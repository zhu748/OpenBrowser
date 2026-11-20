<script setup>
import { computed, useTemplateRef } from './workbench-vue.js';

defineProps({ placeholder: { type: String, default: '' } });
const text = defineModel({ type: String, default: '' });
const gutter = useTemplateRef('gutter');
const lineNumbers = computed(() => {
  const count = text.value.replace(/\r/g, '').split('\n').length;
  return Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, '0')).join('\n') + '\n';
});

function synchronizeScroll(event) {
  gutter.value.scrollTop = event.target.scrollTop;
}
</script>

<template>
  <div class="textarea">
    <textarea ref="gutter" :value="lineNumbers" class="textarea-line" wrap="off" cols="2" disabled />
    <textarea v-model="text" class="textarea-content" spellcheck="false" :placeholder="placeholder"
      @scroll="synchronizeScroll" />
  </div>
</template>

<script>
// Dialogs may be mounted as separate roots in the same document.
let nextSimpleDialogId = 0;
</script>
<script setup>
import { onBeforeMount, ref } from './workbench-vue.js';
import { t as vFocustrap } from './focustrap-DJJkEqE8.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Form } from './form-BQBA_XzO.js';

const props = defineProps({
  title: {}, content: {}, inputs: { type: Array, default: () => [] }, afterRender: {},
  cancelText: { default: () => $t('取消') }, confirmText: { default: () => $t('保存') },
  onConfirm: Function, onCancel: Function,
});
const emit = defineEmits(['close']);
const loading = ref(false);
const formId = 'simpleform-' + ++nextSimpleDialogId;
onBeforeMount(() => {
  if (props.inputs[0]) props.inputs[0].props = { ...props.inputs[0].props, autofocus: true };
});
function close() {
  props.onCancel?.();
  emit('close');
}
async function submit(values) {
  if (loading.value) return;
  loading.value = true;
  try {
    if (await props.onConfirm?.(values) !== false) emit('close');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 pt-4 pb-6 px-6 w-120 popup">
    <div v-if="title" class="title">{{ title }}</div>
    <div v-if="content" class="content">{{ content }}</div>
    <Form v-focustrap :id="formId" :inputs="inputs" @submit="submit" />
    <component :is="afterRender" v-if="afterRender" />
    <slot name="footer" :close="close" :loading="loading" :cancel-text="cancelText" :confirm-text="confirmText" :form-id="formId">
      <div class="flex justify-end items-center self-stretch gap-3">
        <Button size="sm" text severity="secondary" :label="cancelText" @click="close" />
        <Button size="sm" type="submit" :form="formId" :label="confirmText" :loading="loading" />
      </div>
    </slot>
  </div>
</template>

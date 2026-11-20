<script setup>
import { computed, inject, onMounted, ref, watch } from './workbench-vue.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as TextInput } from './m-input-text-JVbCgVJP.js';
import { r as colors } from './constants-DLlGaEfk.js';
import { t as ColorOptions } from './colors-select-CQM6_O2z.js';

const props = defineProps({ name: {}, color: {}, submit: Function });
const emit = defineEmits(['close']);
const dialog = inject('dialogRef', null);
const color = ref(props.color || colors[1]);
const name = ref(props.name ?? '');
const error = ref('');
const editing = ref(props.name !== undefined);
const options = computed(() => color.value && !colors.some(option => option.toLowerCase() === String(color.value).toLowerCase())
  ? [color.value, ...colors] : colors);
watch(name, () => { error.value = ''; });
onMounted(() => {
  const data = dialog?.value?.data;
  if (!data) return;
  editing.value = data.props?.name !== undefined;
  name.value = data.props?.name ?? '';
  color.value = data.props?.color || colors[1];
});
function close(cancel) {
  if (dialog?.value) {
    if (cancel) dialog.value.data?.onCancel?.();
    dialog.value.close();
  } else emit('close');
}
async function save() {
  const value = name.value.trim();
  if (!value) { error.value = $t('请输入标签名称'); return; }
  const submit = dialog?.value?.data?.onConfirm ?? props.submit;
  if (await submit?.({ name: value, color: color.value }) !== false) close(false);
}
</script>

<template>
  <div class="w-100 flex flex-col gap-6 pt-5 popup">
    <div class="title">{{ $t(editing ? '编辑标签' : '新增标签') }}</div>
    <ColorOptions v-model="color" :colors="options" />
    <div class="flex flex-col gap-1">
      <TextInput v-model="name" size="md" type="text" :invalid="!!error" :placeholder="$t('请输入标签名')" />
      <p v-if="error" class="m-0 text-3 leading-4 text-[var(--colors-text-text-error,#F53838)]">{{ error }}</p>
    </div>
    <div class="flex justify-end items-center self-stretch gap-3">
      <Button :label="$t('取消')" text severity="secondary" @click="close(true)" />
      <Button :label="$t('保存')" @click="save" />
    </div>
  </div>
</template>

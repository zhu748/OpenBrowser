<script setup>
import { inject, ref } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Radio } from './rx-input-radio-BGeLgzak.js';

const dialog = inject('dialogRef');
const asWorkbook = ref(true);
const includeCredentials = ref(false);
const saving = ref(false);
const error = ref('');
const canExportCredentials = dialog?.value?.data?.props?.canViewPassword === true;
const fileTypes = [{ label: 'Excel (.xlsx)', value: true }, { label: 'Text (.txt)', value: false }];

function close() {
  dialog?.value?.close();
}

async function download() {
  if (saving.value) return;
  const { ids = [] } = dialog?.value?.data?.props ?? {};
  saving.value = true;
  error.value = '';
  try {
    const result = await globalThis.__localRequest('accounts:export', {
      ids, includeCredentials: canExportCredentials && includeCredentials.value,
      format: asWorkbook.value ? 'xlsx' : 'txt', includeBindings: asWorkbook.value,
    });
    if (!result.canceled) close();
  } catch (cause) {
    error.value = cause.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 pt-6 export-accounts">
    <div class="flex justify-between items-center">
      <span class="title">{{ $t('导出数据') }}</span>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20" color="#575D60" @click="!saving && close()" />
    </div>
    <div class="desc">{{ $t('请选择您要导出的数据:') }}</div>
    <Radio v-model="asWorkbook" :options="fileTypes" />
    <label v-if="canExportCredentials" class="flex items-center gap-2">
      <input type="checkbox" :checked="includeCredentials" :disabled="saving" @change="includeCredentials = $event.target.checked" />
      {{ $t('包含明文密码和 2FA 密钥') }}
    </label>
    <p v-if="error" role="alert">{{ error }}</p>
    <div class="flex justify-end gap-2">
      <Button severity="secondary" outlined :label="$t('取消')" :disabled="saving" @click="close" />
      <Button :label="$t('导出数据')" :loading="saving" :disabled="saving" @click="download" />
    </div>
  </div>
</template>

<script setup>
import { computed, h, inject, ref, resolveComponent } from './workbench-vue.js';
import { Kt as clearType } from './utils-BIWenCnY.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { t as Radio } from './rx-input-radio-BGeLgzak.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as Button } from './rx-button-DyzuUt-V.js';

const dialog = inject('dialogRef');
const labels = useProfileLabels();
const config = computed(() => dialog.value?.data?.props);
const selection = ref(clearType.partial);
const saving = ref(false);
const I18nText = resolveComponent('i18n-t');
const options = computed(() => [
  { label: $t('清除本地缓存（保留插件）'), value: clearType.partial, note: labels.value.clearCachePartialNote },
  { label: $t('清除本地缓存'), value: clearType.all, note: labels.value.clearCacheAllNote },
].map(option => ({
  ...option,
  afterRender: () => selection.value === option.value && h(Alert, {
    closable: false, class: '!w-full', type: 'warn', title: $t('说明'),
  }, {
    content: () => h('div', { class: 'whitespace-pre-wrap' }, [
      h(I18nText, { keypath: option.note, scope: 'global' }, {
        light: () => h('span', { class: 'text-orange-400' }, $t('登录状态不会失效')),
      }),
    ]),
  }),
})));

function close() {
  const { onCancel } = dialog.value.data;
  dialog.value.close();
  onCancel?.();
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    await dialog.value.data.onConfirm?.(selection.value);
    close();
  } catch (error) {
    globalThis.__localUiError(error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="config" class="flex flex-col cache">
    <div v-if="config.title" class="cache-title">{{ config.title }}</div>
    <div v-if="config.content" class="cache-content">{{ config.content }}</div>
    <Radio v-model="selection" name="clearType" :options="options" />
    <div class="footer">
      <Button size="sm" :label="$t('取消')" text severity="secondary" :disabled="saving" @click="close" />
      <Button size="sm" :label="$t('保存')" :loading="saving" @click="save" />
    </div>
  </div>
</template>

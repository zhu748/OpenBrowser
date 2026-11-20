<script setup>
import { inject, ref, resolveComponent } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useToast } from './usetoast-DphSlejX.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';
import { t as Textarea } from './textarea-DvuriTzI.js';
import { useExtensionText } from './extension-labels.js';

const dialog = inject('dialogRef');
const toast = useToast();
const text = useExtensionText();
const I18nText = resolveComponent('i18n-t');
const selected = ref();
let pending = false;

async function choose(kind) {
  if (pending) return;
  pending = true;
  try {
    const result = await globalThis.electronAPI.send('extension:getSelectedExtensionInfo', kind);
    if (result.type === 'cancel') return;
    if (result.type !== 'success') throw Error(result.message || translate('扩展读取失败'));
    selected.value = { type: 'success', isSuccess: true, ...result.data };
  } catch (error) {
    toast.add({ severity: 'error', summary: error.message, life: 5000 });
  } finally {
    pending = false;
  }
}

function close() {
  dialog.value.close();
  dialog.value.data.onCancel?.();
}

async function upload() {
  if (pending || !selected.value) return;
  pending = true;
  try {
    const { pluginDir, localKey, onConfirm } = dialog.value.data;
    const { pluginPath, pluginIconPath } = selected.value;
    const staged = await globalThis.electronAPI.send('extension:stageLocal', { pluginDir, pluginPath, pluginIconPath, localKey });
    await onConfirm?.({ source: 'local', ...selected.value, ...staged });
    close();
  } catch (error) {
    toast.add({ severity: 'error', summary: translate('发生错误'), detail: error.message, life: 2500 });
  } finally {
    pending = false;
  }
}
</script>

<template>
  <div class="flex flex-col popup">
    <div class="popup-title">{{ translate('本地上传') }}</div>
    <div>
      <div class="upload-title">{{ translate('请选择上传方式') }}</div>
      <div class="flex items-center gap-4 mt-1">
        <Button outlined icon="base/rx_ic_export" :label="translate('选择压缩包')" @click="choose('file')" />
        <span class="upload-or">{{ translate('或') }}</span>
        <Button outlined severity="secondary" icon="base/rx_ic_folder" :label="translate('选择文件夹')" @click="choose('dir')" />
      </div>
      <div class="flex items-center gap-1 mt-1">
        <Icon name="base/rx_ic_info_fill" :size="12" color="#A3A9AD" />
        <span class="upload-tip">{{ text.uploadFormat }}</span>
      </div>
      <div class="flex items-center gap-1 mt-1">
        <Icon name="base/rx_ic_info_fill" :size="12" color="#A3A9AD" />
        <span class="upload-tip">{{ text.googleOnly }}</span>
      </div>
    </div>
    <div v-if="selected" class="extension">
      <div class="extension-icon">
        <img class="extension-icon-image" :src="selected.pluginIconPath">
      </div>
      <div class="flex justify-between items-center extension-name">
        <span>{{ text.nameLabel }}</span>
        <span class="extension-name-length">{{ selected.pluginName.length }}/50</span>
      </div>
      <InputText v-model="selected.pluginName" class="extension-input" maxlength="50" type="text" />
    </div>
    <div v-if="selected" class="flex flex-col gap-1.5 description">
      <div class="flex justify-between items-center">
        <span>{{ text.descLabel }}</span>
        <span class="description-length">{{ selected.pluginDesc?.length || 0 }}/500</span>
      </div>
      <Textarea v-model="selected.pluginDesc" class="w-full description-input" maxlength="500" rows="3" />
    </div>
    <div class="guide">
      <I18nText :keypath="text.guideNoteKeypath" scope="global">
        <template #guide>
          <a class="text-blue decoration-underline cursor-pointer" href="https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline#june_3_2024_the_manifest_v2_phase-out_begins" target="_blank" rel="noopener noreferrer">{{ text.googleProtocolLink }}</a>
        </template>
      </I18nText>
    </div>
    <div class="footer">
      <Button size="sm" :label="translate('取消')" text severity="secondary" autofocus @click="close" />
      <Button size="sm" :label="translate('上传')" :disabled="!selected" autofocus @click="upload" />
    </div>
  </div>
</template>

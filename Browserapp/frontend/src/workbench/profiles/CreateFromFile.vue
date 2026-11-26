<script setup>
import { h, ref } from 'vue';
import { h as requests, mt as useWorkspace, qt as browsers, s as readFields } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useNotice } from './agent-BmSFI9WH.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { n as Spinner } from './m-input-select-C8pih1gY.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { n as ProfileForm } from './useAsyncGate-D7VA7DLY.js';
import { r as Fingerprint, t as createAccordions } from './createDefaultAccordions-CO1KkbkO.js';
import { t as ProfileMetadata } from './mate-group-CBm6kY0g.js';
import ProfileImportFile from './workbench-profile-import-file.js';
import { fingerprintPreviewInput, requireFingerprintPreviewRows } from './workbench-fingerprint-draft.js';

const props = defineProps({ shared: { type: Object, required: true } });
const { collapsed, inputsGroup, previewInputs, isBatch, createCount, shuffleFingerprint, choosePreset, metaData,
  canSubmit, loading, formGate, clearGuide, prepareCreateParams, onBack } = props.shared;
const { currentWorkspace } = storeToRefs(useWorkspace());
const [openDialog] = useDialog();
const [showSuccess, showStatus] = useNotice();
const accordions = ref(createAccordions());
const upload = ref();
const importError = ref();

function showProgress() {
  return openDialog({
    showHeader: false, modal: true, blockScroll: true, closeOnEscape: false,
    pt: { root: '!border-none !shadow-none rounded-lg' },
    slots: { container: () => h('div', { class: 'flex flex-col justify-center items-center gap-6 w-60 h-37' }, [
      h('div', { class: 'relative w-8 h-8' }, [h(Spinner, { modelValue: true, opacity: 0.9 })]),
      h('div', null, [$t('创建中...')]),
    ]) },
  });
}

async function create() {
  if (loading.value) return;
  loading.value = true;
  try {
    await formGate.waitUntilReady();
    clearGuide();
    const { os, osVersion, coreType } = readFields(previewInputs.value, {}, { validate: false });
    const params = await prepareCreateParams({ inputs: inputsGroup.value, metadata: metaData.value, createCount: createCount.value,
      additionalParams: { os, osVersion, coreType } });
    if (importError.value) return showStatus(-1, importError.value);
    if (!upload.value) return showStatus(-1, $t('请选择要导入的文件。'));
    const currentUpload = upload.value;
    const progress = showProgress();
    try {
      const fingerprints = await fingerprintRows(currentUpload.excelData, params);
      const { code, msg } = await requests.window.userImportWindowInfoV2Create({
        ...params, ...currentUpload, workspaceId: currentWorkspace.value?.id, fingerDetail: fingerprints,
      });
      if (code === 0) {
        showSuccess(0, msg);
        onBack();
      } else importError.value = Array.isArray(msg) ? msg.join('\n') : msg;
    } finally {
      progress.hideModal();
    }
  } catch (error) {
    showStatus(-1, error.message);
  } finally {
    loading.value = false;
  }
}

async function fingerprintRows(rows, params) {
  const groups = new Map();
  rows.forEach((row, index) => {
    const os = row.os || params.os;
    const matchesDefaultOs = String(os || '').toLowerCase() === String(params.os || '').toLowerCase();
    const selection = fingerprintPreviewInput({ ...params, ...row,
      coreType: row.coreType || params.coreType || browsers.Chrome,
      coreVersion: row.coreVersion || '',
      useLatestCore: !row.coreVersion,
      os,
      osVersion: row.osVersion || (matchesDefaultOs ? params.osVersion : '') || '',
      userAgent: row.userAgent,
      _custom_ua: true,
    });
    const key = JSON.stringify(selection);
    if (!groups.has(key)) groups.set(key, { selection, indices: [] });
    groups.get(key).indices.push(index);
  });
  const fingerprints = new Array(rows.length);
  await Promise.all(Array.from(groups.values(), async ({ selection, indices }) => {
    // File import allows 200 rows, while a single preview request accepts 100.
    const previewLimit = 100;
    for (let offset = 0; offset < indices.length; offset += previewLimit) {
      const batch = indices.slice(offset, offset + previewLimit);
      try {
        const generated = await globalThis.electronAPI.send('util:genRandomFingerprint', selection, batch.length);
        const previews = requireFingerprintPreviewRows(generated, batch.length);
        batch.forEach((index, position) => { fingerprints[index] = previews[position]; });
      } catch (error) {
        throw new Error(`第 ${rows[batch[0]].rowNum || batch[0] + 1} 行：${error.message}`, { cause: error });
      }
    }
  }));
  return fingerprints;
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="profile-editor-viewport flex flex-1 min-h-0 overflow-hidden">
      <div class="profile-editor-layout w-full h-full flex min-h-0 ma-auto" :class="collapsed ? 'max-w-192' : 'max-w-285'">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <ProfileForm class="flex-1 min-h-0" :accordions="accordions" :inputs-group="inputsGroup">
            <template #before>
              <ProfileImportFile v-model:error="importError" class="pt-4"
                @invalidate="upload = null" @import-success="upload = $event" />
            </template>
          </ProfileForm>
          <div class="footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16">
            <ProfileMetadata v-model="metaData" class="flex-1" :show-remark="false" />
            <Button v-tooltip.top="canSubmit ? '' : $t('正在生成新指纹，请稍后')" class="guide2" :label="$t('创建窗口')" :disabled="!canSubmit" :loading="loading" @click.stop="create" />
          </div>
        </div>
        <Fingerprint v-model:collapsed="collapsed" :inputs-group="previewInputs" :is-batch="isBatch" :create-count="createCount"
          is-import :on-shuffle="shuffleFingerprint" :choose-preset="choosePreset" />
      </div>
    </div>
  </div>
</template>

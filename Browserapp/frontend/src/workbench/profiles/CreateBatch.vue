<script setup>
import { ref } from 'vue';
import { a as findField, h as requests } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { o as SplitButton } from './hook-CnJE4hRq.js';
import { i as getWindowName } from './quick-kroUOSn_.js';
import { o as hasName } from './utils-CnUy4XUk.js';
import { t as bindMode } from './account-2bDq0W_G.js';
import { t as NumberInput } from './rx-input-number-EcSY6ALQ.js';
import { n as ProfileForm } from './useAsyncGate-D7VA7DLY.js';
import { r as Fingerprint, t as createAccordions } from './createDefaultAccordions-CO1KkbkO.js';
import { t as generateFingerprints } from './form-inputs-CnnG6T0O.js';
import { t as ProfileMetadata } from './mate-group-CBm6kY0g.js';

const props = defineProps({ shared: { type: Object, required: true } });
const { collapsed, inputsGroup, previewInputs, isBatch, createCount, maxWindowCount, shuffleFingerprint, choosePreset,
  profileTemplate, showTemplates, metaData, items, saveTemplatePopup, canSubmit, loading,
  formGate, clearGuide, prepareCreateParams, onBack } = props.shared;
const accordions = ref(createAccordions());
const [, showStatus] = useNotice();
let submitting = false;

async function create() {
  if (submitting) return;
  submitting = true;
  try {
    await formGate.waitUntilReady();
    clearGuide();
    const params = await prepareCreateParams({ inputs: inputsGroup.value, metadata: metaData.value, createCount: createCount.value });
    const proxies = Array.isArray(params.proxyInfoList) ? params.proxyInfoList : [];
    const accounts = Array.isArray(params.windowPlatformList) ? params.windowPlatformList : [];
    const platforms = Array.isArray(params.platformUrlIds) ? params.platformUrlIds : [];
    const missingProxies = params.createCount - proxies.length;
    if (missingProxies < 0) return showStatus(-1, $t('代理 IP 数量不能大于窗口'));
    if (params.platformBindType === bindMode.Order && params.createCount < accounts.length + platforms.length) {
      return showStatus(-1, $t('账号数量不能大于窗口'));
    }
    const name = getWindowName(findField(inputsGroup.value[0] ?? [], 'windowName'));
    if (name && !hasName(params.windowName) && !hasName(params.windowNamePrefix)) params.windowNamePrefix = params.windowName = name;
    loading.value = true;
    const fingerprints = await generateFingerprints(previewInputs.value, { count: params.createCount, preview: false });
    params.proxyInfoList = [...proxies, ...Array.from({ length: missingProxies }, () => ({ id: 0, proxyCategory: 'noproxy' }))];
    params.fingerDetail = fingerprints.map(row => ({
      ...row,
      userAgent: params._custom_ua ? params.userAgent : row.userAgent,
      webGLManufacturer: params.webGLInfo === 2 ? params.webGLManufacturer : row.webGLManufacturer,
      webGLRender: params.webGLInfo === 2 ? params.webGLRender : row.webGLRender,
      hardwareConcurrent: params.hardwareConcurrent || row.hardwareConcurrent,
      deviceMemory: params.deviceMemory || row.deviceMemory,
    }));
    const { code, msg } = await requests.window.userBatchWindowInfoV2Create(params);
    showStatus(code, msg);
    if (code === 0) onBack();
  } catch (error) {
    showStatus(-1, error.message);
  } finally {
    loading.value = false;
    submitting = false;
  }
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="profile-editor-viewport flex flex-1 min-h-0 overflow-hidden">
      <div class="profile-editor-layout w-full h-full flex min-h-0 ma-auto" :class="collapsed ? 'max-w-192' : 'max-w-285'">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <div class="mx-4 py-4 multiple">
            <div class="flex items-start justify-between">
              <div class="subtitle h-8 flex items-center">{{ $t('窗口数量') }}</div>
              <div class="batch-count">
                <NumberInput v-model="createCount" :min="1" :step="1" :max="maxWindowCount" />
                <div class="select-none multiple-tip"> * {{ $t('最多一次可批量创建 {maxWindowCount} 个', { maxWindowCount }) }}</div>
              </div>
            </div>
          </div>
          <ProfileForm class="flex-1 min-h-0" :accordions="accordions" :inputs-group="inputsGroup">
            <template #before>
              <div class="flex items-center justify-between px-4 py-4">
                <div class="subtitle">{{ $t('窗口信息') }}</div>
                <Button text severity="secondary" icon="base/rx_ic_template" :label="profileTemplate.label" @click.stop="showTemplates" />
              </div>
            </template>
          </ProfileForm>
          <div class="footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16">
            <ProfileMetadata v-model="metaData" class="flex-1" />
            <SplitButton severity="secondary" :label="$t('存为新模板')" :model="items" @click.stop="saveTemplatePopup($event)" />
            <Button v-tooltip.top="canSubmit ? '' : $t('正在生成新指纹，请稍后')" class="guide2" :label="$t('创建窗口')" :disabled="!canSubmit" :loading="loading" @click.stop="create" />
          </div>
        </div>
        <Fingerprint v-model:collapsed="collapsed" :inputs-group="previewInputs" :is-batch="isBatch" :create-count="createCount"
          :is-import="false" :on-shuffle="shuffleFingerprint" :choose-preset="choosePreset" />
      </div>
    </div>
  </div>
</template>

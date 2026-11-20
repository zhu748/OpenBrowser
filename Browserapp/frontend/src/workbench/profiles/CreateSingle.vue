<script setup>
import { computed, ref } from 'vue';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { o as SplitButton } from './hook-CnJE4hRq.js';
import { n as ProfileForm } from './useAsyncGate-D7VA7DLY.js';
import { i as WindowInputs, n as createAccordions, r as Fingerprint } from './createDefaultAccordions-CO1KkbkO.js';
import { t as ProfileMetadata } from './mate-group-CBm6kY0g.js';

const props = defineProps({ shared: { type: Object, required: true } });
const { collapsed, inputsGroup, previewInputs, isBatch, createCount, shuffleFingerprint, choosePreset,
  profileTemplate, showTemplates, metaData, items, saveTemplatePopup, canSubmit, loading,
  formGate, clearGuide, buildCreateParams, executeSingleCreate, onBack } = props.shared;
const accordions = ref(createAccordions());
const basicInputs = computed(() => inputsGroup.value[0] ?? []);

async function create() {
  await formGate.waitUntilReady();
  clearGuide();
  const params = buildCreateParams({ inputs: inputsGroup.value, metadata: metaData.value, createCount: createCount.value });
  return executeSingleCreate({ params, onSuccess: profile => onBack(profile, false) });
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="px-16 flex flex-1 min-h-0 overflow-hidden overflow-x-auto">
      <div class="w-full h-full flex min-h-0 gap-8 ma-auto" :class="collapsed ? 'min-w-192 max-w-192' : 'min-w-240 max-w-285'">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <ProfileForm class="flex-1 min-h-0" :accordions="accordions" :inputs-group="inputsGroup">
            <template #before>
              <WindowInputs :window-inputs="basicInputs" show-template :template-label="profileTemplate.label" @show-templates="showTemplates" />
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

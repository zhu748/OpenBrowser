<script setup>
import { computed, onBeforeMount, ref } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { gr as assetUrl } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useFeedback } from './agent-BmSFI9WH.js';
import { n as useTheme } from './theme-mq6SsndU.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { a as provideCreationMode, n as FormAccordions } from './useAsyncGate-D7VA7DLY.js';
import { i as WindowInputs, n as defaultAccordions, r as FingerprintPreview } from './createDefaultAccordions-CO1KkbkO.js';
import { t as useCreateCore } from './useWindowCreateCore-01alf0RN.js';

const props = defineProps({ template: Object, onClose: Function, onSaved: Function });
const { realTheme } = storeToRefs(useTheme());
const [, showFeedback] = useFeedback();
provideCreationMode({ isBatch: ref(false), createCount: ref(1), presetTemplate: ref(), oneClickSettings: ref() });
const accordions = ref(defaultAccordions());
const collapsed = ref(true);
const ready = ref(false);
const saving = ref(false);
const {
  inputsGroup, loading, formGate, canSubmit, initialize, shuffleFingerprint, buildCreateParams, prepareCreateParams,
} = useCreateCore();
const windowInputs = computed(() => inputsGroup.value?.[0] ?? []);
const canSave = computed(() => ready.value && canSubmit.value && !saving.value);
const background = computed(() => {
  const artwork = realTheme.value === 'light' ? 'quick_create_bg_light.svg' : 'quick_create_bg_dark.svg';
  return `url('${assetUrl('browser/' + artwork)}')`;
});
useCssVars(() => ({ f9b7735c: background.value }));
onBeforeMount(async () => {
  const template = props.template ?? {};
  try {
    await initialize(template, { refreshFingerprint: Object.keys(template).length === 0 });
    ready.value = true;
  } catch (error) {
    showFeedback(-1, error.message);
  }
});

async function save(createAndRun) {
  if (!canSave.value) return;
  saving.value = true;
  try {
    await formGate.waitUntilReady();
    const formData = createAndRun ? await prepareCreateParams() : buildCreateParams();
    await props.onSaved?.({ formData, createAndRun });
  } catch (error) {
    console.error('[QuickCreate] save template failed', error);
    showFeedback(-1, error.message || $t('保存配置'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="quick-create-editor flex flex-col overflow-hidden popup">
    <div class="flex shrink-0 items-start justify-between gap-4 px-6 pt-4 pb-2">
      <div class="tt-primary text-5 font-600 leading-normal">{{ $t('快速创建') }}</div>
      <Icon class="mt-1 shrink-0 cursor-pointer" name="base/rx_ic_delete" size="20"
        color="var(--colors-icon-icon-secondary)" @click="onClose?.()" />
    </div>
    <div class="flex min-h-0 flex-1 overflow-hidden overflow-x-auto px-6">
      <div class="ma-auto flex h-full min-h-0 w-full gap-8" :class="collapsed ? 'min-w-192 max-w-192' : 'min-w-240 max-w-285'">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <FormAccordions class="min-h-0 min-w-0 flex-1" :accordions="accordions" :inputs-group="inputsGroup">
            <template #before>
              <WindowInputs v-if="ready" :window-inputs="windowInputs" :autofill-window-name="false" />
            </template>
          </FormAccordions>
          <div class="footer flex shrink-0 items-center justify-end gap-2 px-4 py-4 min-h-16">
            <Button v-tooltip.top="canSave ? '' : $t('正在生成新指纹，请稍后')" severity="secondary" outlined
              :label="$t('保存并运行')" :disabled="!canSave" :loading="saving || loading" @click="save(true)" />
            <Button v-tooltip.top="canSave ? '' : $t('正在生成新指纹，请稍后')"
              :label="$t('保存配置')" :disabled="!canSave" :loading="saving || loading" @click="save(false)" />
          </div>
        </div>
        <FingerprintPreview v-model:collapsed="collapsed" :inputs-group="inputsGroup" :is-batch="false" :create-count="1"
          :is-import="false" :on-shuffle="shuffleFingerprint" />
      </div>
    </div>
  </div>
</template>

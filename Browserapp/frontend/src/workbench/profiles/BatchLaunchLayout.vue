<script setup>
import { ref, useId } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';
import { t as useOnboarding } from './hooks-BozaoB_u.js';
import { n as useProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { t as useConfig } from './useCommonUtil-C7F4fHRj.js';

defineProps({ count: {} });
const emit = defineEmits(['close', 'confirm']);
const labels = useProfileLabels();
const { saveUserConfig } = useConfig();
const { updateOnboardingTaskStatus } = useOnboarding();
const remember = ref(false);
const checkedId = useId();
const options = [
  { label: $t('网格'), img: 'other/grid', value: 'grid' },
  { label: $t('层叠'), img: 'other/cascade', value: 'cascade' },
  { label: $t('重叠'), img: 'other/stack', value: 'stack' },
  { label: $t('跟随上次'), img: 'other/restore', value: 'lastClosed' },
];
const mode = ref(options[0].value);
function finish(accepted) {
  if (remember.value) {
    updateOnboardingTaskStatus({ batchOpenWindowNoPromptStatus: true });
    saveUserConfig({ name: 'batchOpenLayout', value: mode.value });
  }
  if (accepted) emit('confirm', mode.value);
  else emit('close');
}
</script>

<template>
  <div class="w-160 flex flex-col gap-4 pa-6 pt-4 rounded-2">
    <div class="h-9 flex items-center justify-between">
      <div class="tt-primary text-4 font-600 leading-normal">{{ labels.batchOpenAndArrange(count) }}</div>
      <Icon class="cursor-pointer" name="base/rx_ic_delete" size="20"
        color="var(--colors-icon-icon-secondary)" @click="finish(false)" />
    </div>
    <div class="flex flex-col self-stretch gap-4">
      <div class="tt-primary text-3.5 leading-4">{{ $t('请选择您的窗口布局') }}</div>
      <div class="grid grid-cols-3 gap-4">
        <div v-for="option in options" :key="option.value" class="flex flex-col gap-3 items-center justify-center"
          :class="{ active: mode === option.value }">
          <div class="self-stretch flex items-center justify-center py-3.5 rounded-2 cursor-pointer radio" @click="mode = option.value">
            <Icon :name="option.img" class="block icon" width="100" height="62" />
          </div>
          <div class="text text-center">{{ option.label }}</div>
        </div>
      </div>
      <div class="mt-4 flex gap-3 items-center">
        <div class="flex-1 flex items-center gap-2">
          <Checkbox v-model="remember" :input-id="checkedId" name="rememberLayout" binary />
          <label class="tt-secondary text-3" :for="checkedId">{{ $t('不再提醒') }}</label>
        </div>
        <Button :label="$t('取消')" size="md" outlined severity="secondary" @click="finish(false)" />
        <Button :label="$t('确认')" size="md" @click="finish(true)" />
      </div>
    </div>
  </div>
</template>

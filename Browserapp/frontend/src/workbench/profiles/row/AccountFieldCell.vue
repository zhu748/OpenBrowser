<script setup>
import { or as copyText } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const props = defineProps({ value: {}, masked: Boolean, showCopy: Boolean, showEdit: Boolean, showMasked: Boolean });
const emit = defineEmits(['edit', 'toggleMasked']);
const [feedback] = useFeedback();
function copy() {
  if (!props.value || props.masked) return;
  copyText(props.value);
  feedback(0, $t('已复制'));
}
function toggleMasked() {
  if (props.showMasked) emit('toggleMasked');
}
</script>

<template>
  <div class="w-full h-full min-h-6 flex items-center gap-1 select-none">
    <span class="min-w-0 tt-primary text-3 leading-4 font-500 truncate" :title="masked ? undefined : value"
      @click.stop="toggleMasked">{{ value ? masked ? '••••••••' : value : '--' }}</span>
    <div v-if="showCopy || showEdit" class="cell_actions row-hover-action">
      <Button v-if="showCopy && value && !masked" v-tooltip.top="{ value: $t('复制'), showDelay: 500 }"
        class="shrink-0" text severity="secondary" size="xxs" icon="base/rx_ic_copy" @click.stop="copy" />
      <Button v-if="showEdit && !masked" v-tooltip.top="{ value: $t('编辑'), showDelay: 500 }"
        class="shrink-0" text severity="secondary" size="xxs" icon="base/rx_ic_edit" @click.stop="emit('edit')" />
      <Button v-if="showMasked" v-tooltip.top="{ value: masked ? $t('显示') : $t('隐藏'), showDelay: 500 }"
        class="shrink-0" text severity="secondary" size="xxs" :icon="masked ? 'base/rx_ic_hidden' : 'base/rx_ic_eye'" @click.stop="toggleMasked" />
    </div>
  </div>
</template>

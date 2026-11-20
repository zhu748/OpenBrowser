<script setup>
import { computed } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as useSimpleDialog } from './simplePopup-D6H7ykCr.js';

const props = defineProps({ value: {}, title: {}, content: {}, placeholder: {}, label: {}, hideLabel: Boolean,
  mode: {}, disabled: Boolean, onConfirm: Function, onCancel: Function });
const { showSimpleDialog } = useSimpleDialog();
const tooltip = computed(() => props.value?.trim() || props.label || '');
const icon = computed(() => props.value ? 'base/rx_ic_doc_fill' : 'base/rx_ic_doc_add');
function edit() {
  if (props.disabled) return;
  showSimpleDialog({ title: props.title, content: props.content,
    inputs: [{ type: 'textarea', name: 'remark', value: props.value, props: { placeholder: props.placeholder || $t('请输入备注'), rows: 6 } }],
    onConfirm: async ({ remark }) => { await props.onConfirm?.(remark); }, onCancel: props.onCancel });
}
</script>

<template>
  <Button v-if="mode === 'button'" v-tooltip.top="tooltip" class="!gap-0 !text-0 !min-w-auto" :disabled="disabled"
    outlined severity="secondary" @click.stop="edit">
    <Icon :name="icon" :class="{ disabled, light: value }" />
    <span v-if="label && !hideLabel" class="ml-2 text-[12px] ellipsis-1">{{ label }}</span>
    <span class="p-button-label" data-pc-section="label">&nbsp;</span>
  </Button>
  <Icon v-else v-tooltip.top="value" :name="icon" :class="{ disabled, light: value }" @click.stop="edit" />
</template>

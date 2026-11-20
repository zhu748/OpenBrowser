<script setup>
import { ref, useTemplateRef, watch } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { a as useElementSize } from './dist-NctnpPRe.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ name: {}, label: {}, tooltip: {}, labelWidth: {} });
const labelElement = useTemplateRef('label');
const { height, stop } = useElementSize(labelElement);
const lineHeight = ref('32px');
const disable = watch(height, value => {
  if (value <= 50) return;
  lineHeight.value = 'auto';
  stop();
  disable();
});
useCssVars(() => ({ v93e37742: props.labelWidth, v0bd29930: lineHeight.value }));
</script>

<template>
  <label v-if="label" ref="label" class="rx-label" :for="name" v-bind="$attrs">
    <span>{{ label }}</span>
    <Icon v-if="tooltip" v-tooltip.top="{ value: tooltip, showDelay: 500 }"
      class="align-middle ml-1" name="base/rx_ic_info" :size="12" color="var(--colors-icon-icon-note)" />
  </label>
</template>

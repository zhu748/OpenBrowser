<script setup>
import { computed } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';

const props = defineProps({
  vertical: Boolean, lineOnly: Boolean, text: { default: () => $t('或') },
  color: { default: 'var(--colors-text-text-primary)' }, lineWidth: { default: 1 },
  lineStyle: { default: 'solid' }, lineColor: { default: 'var(--divider-border-color)' },
});
const width = computed(() => Number.isNaN(Number(props.lineWidth)) ? props.lineWidth : Number(props.lineWidth) + 'px');
useCssVars(() => ({ a05b1bd4: props.color, v05bed5e0: width.value, v4643f160: props.lineStyle, v480bcdfc: props.lineColor }));
</script>

<template>
  <div :class="vertical ? 'vertical' : 'horizontal'"><span v-if="!lineOnly" class="text">{{ text }}</span></div>
</template>

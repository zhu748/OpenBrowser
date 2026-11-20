<script setup>
import { computed } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
const props = defineProps({
  borderWidth: { default: 2 }, borderRadius: { default: 6 }, deg: { default: 0 },
  animation: { type: Boolean, default: true }, animationDuration: { default: 8 }, bgColor: { default: 'transparent' },
  gradient: { default: () => ['#12a3fc', '#ec51f7', '#ec51f7'] },
});
const style = computed(() => ({
  '--angle': props.deg + 'deg', '--animation-duration': props.animationDuration + 's', '--gradient-stops': props.gradient.join(', '),
}));
useCssVars(() => ({ c78525da: Number(props.borderWidth) + 'px', v3b11d236: Number(props.borderRadius) + 'px', v7a3cc546: props.bgColor }));
</script>

<template>
  <div class="gradient" :class="{ animation }" :style="style"><slot /></div>
</template>

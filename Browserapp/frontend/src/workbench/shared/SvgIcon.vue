<script setup>
import { computed } from './workbench-vue.js';
import { s as useCssVars } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { iconComponents } from './workbench-icon-catalog.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ name: {}, size: { default: 16 }, color: { default: 'inherit' }, fallback: {}, onClick: {} });
const component = computed(() => iconComponents.get(props.name) ?? iconComponents.get(props.fallback));
const size = computed(() => Number.isNaN(Number(props.size)) ? props.size : `${Number(props.size)}px`);
useCssVars(() => ({ e49b1ef0: size.value, v30a509d2: props.color || 'inherit' }));
</script>

<template>
  <component v-if="component" :is="component" class="svg" :data-name="name" v-bind="$attrs" @click="onClick" />
</template>

<script setup>
import { computed } from './workbench-vue.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({
  list: { type: Array, default: () => [] }, icon: {}, field: {}, showMax: { default: 1 },
  disabled: { type: Boolean, default: true },
});
const labels = computed(() => props.field ? props.list.map(item => item[props.field]) : props.list);
const visible = computed(() => labels.value.slice(0, props.showMax));
const hidden = computed(() => labels.value.slice(props.showMax));
</script>

<template>
  <div v-if="list.length" class="flex gap-2" v-bind="$attrs">
    <Tag v-for="(label, index) in visible" :key="index" :icon="icon" :label="label" :readonly="disabled" />
    <Tag v-if="hidden.length" v-tooltip.top="{ value: hidden.join(', '), showDelay: 500 }" :label="'+' + hidden.length" :readonly="disabled" />
  </div>
  <slot v-else name="empty"><div class="select-none" v-bind="$attrs"> -- </div></slot>
</template>

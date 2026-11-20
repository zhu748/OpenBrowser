<script setup>
import { ref, useTemplateRef } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Button } from './button-BKeo7L17.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ size: { default: 'sm' }, icon: {}, rotate: Boolean, disabled: Boolean, onClick: Function });
const loading = defineModel('loading', { default: false });
const button = useTemplateRef('btnEl');
const pending = ref(false);
async function click(event) {
  if (props.disabled || pending.value || loading.value || !props.onClick) return;
  pending.value = true;
  try {
    await props.onClick(event);
  } finally {
    pending.value = false;
  }
}
defineExpose({ get btnEl() { return button.value?.$el; } });
</script>

<template>
  <Button ref="btnEl" v-bind="$attrs" :icon="icon" :rotate="rotate" class="rx_button" :class="size"
    :disabled="disabled || pending || loading" :loading="pending || loading" @click="click">
    <template #loadingicon><slot name="loadingicon"><Icon name="base/rx_ic_spin" class="loading-circle" /></slot></template>
    <template v-if="icon || $slots.icon" #icon>
      <slot name="icon"><Icon :name="icon" class="animate-duration-2500" :class="{ 'animate-spin': rotate }" /></slot>
    </template>
    <template v-if="$slots.default" #default>
      <Icon v-if="pending || loading" class="loading-circle" name="base/rx_ic_spin" />
      <Icon v-if="icon" :name="icon" />
      <slot />
    </template>
  </Button>
</template>

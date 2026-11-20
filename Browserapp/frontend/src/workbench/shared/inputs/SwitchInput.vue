<script setup>
import { computed, ref } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Toggle } from './toggleswitch-DKDK40Mk.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  disabled: Boolean, readonly: Boolean, trueValue: { default: true },
  falseValue: { default: false }, beforeChange: Function,
});
const emit = defineEmits(['valueChange', 'change']);
const model = defineModel();
const pending = ref(false);
const locked = computed(() => props.disabled || props.readonly || pending.value);

async function toggle() {
  if (locked.value) return;
  const value = model.value === props.trueValue ? props.falseValue : props.trueValue;
  if (props.beforeChange) {
    pending.value = true;
    try {
      if (await props.beforeChange(value) === false) return;
    } finally {
      pending.value = false;
    }
  }
  model.value = value;
  emit('valueChange', value);
  emit('change', value);
}
</script>

<template>
  <div class="flex items-center" :class="{ 'cursor-pointer': !locked, 'cursor-not-allowed': disabled }" @click="toggle">
    <Toggle class="pointer-events-none" v-bind="$attrs" :readonly="readonly" :true-value="trueValue" :false-value="falseValue"
      :model-value="model" :disabled="disabled || pending">
      <template v-if="pending" #handle><Icon name="base/rx_ic_spin" class="loading-circle" /></template>
    </Toggle>
  </div>
</template>

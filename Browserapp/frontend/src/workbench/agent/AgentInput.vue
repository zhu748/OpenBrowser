<script setup>
import { useTemplateRef } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
defineOptions({ inheritAttrs: false });
defineProps({ icon: {}, iconSize: { default: 14 }, preIcon: {}, preIconSize: { default: 16 } });
const model = defineModel();
const input = useTemplateRef('input');
defineExpose({ focus: () => input.value?.$el.focus(), blur: () => input.value?.$el.blur() });
</script>

<template>
  <IconField class="agent-input">
    <InputIcon v-if="preIcon || $slots.preIcon" class="agent-input__icon agent-input__icon--left">
      <slot name="preIcon"><Icon :name="preIcon" :size="preIconSize" /></slot>
    </InputIcon>
    <InputText ref="input" v-model="model" v-bind="$attrs" fluid />
    <InputIcon v-if="icon || $slots.icon" class="agent-input__icon agent-input__icon--right">
      <slot name="icon"><Icon :name="icon" :size="iconSize" /></slot>
    </InputIcon>
  </IconField>
</template>

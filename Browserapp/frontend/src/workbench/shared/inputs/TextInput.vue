<script setup>
import { useTemplateRef } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';

defineOptions({ inheritAttrs: false });
defineProps({
  size: { default: 'sm' }, icon: {}, iconClass: {}, preIcon: {},
  fluid: { type: Boolean, default: true }, fieldProps: Object,
});
defineEmits(['preIconClick', 'iconClick']);
const input = useTemplateRef('input');
defineExpose({
  focus: () => input.value?.$el.focus(),
  blur: () => input.value?.$el.blur(),
});
</script>

<template>
  <IconField class="w-full" :class="size" v-bind="fieldProps">
    <InputIcon v-if="preIcon || $slots.preIcon">
      <slot name="preIcon"><Icon :name="preIcon" @click="$emit('preIconClick')" /></slot>
    </InputIcon>
    <InputText ref="input" v-bind="$attrs" :fluid="fluid" />
    <InputIcon v-if="icon || $slots.icon">
      <slot name="icon"><Icon class="cursor-pointer" :class="iconClass" :name="icon" @click="$emit('iconClick')" /></slot>
    </InputIcon>
  </IconField>
</template>

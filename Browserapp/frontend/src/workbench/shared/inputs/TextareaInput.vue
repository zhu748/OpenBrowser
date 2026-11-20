<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as Textarea } from './textarea-DvuriTzI.js';

defineOptions({ inheritAttrs: false });
defineProps({
  size: { default: 'sm' }, rows: { default: 3 }, cols: { default: 30 },
  fluid: { type: Boolean, default: true }, icon: {}, preIcon: {}, fieldProps: Object,
});
defineEmits(['preIconClick', 'iconClick']);
</script>

<template>
  <IconField class="w-full" :class="size" v-bind="fieldProps">
    <InputIcon v-if="preIcon"><Icon class="cursor-pointer" :name="preIcon" @click="$emit('preIconClick')" /></InputIcon>
    <Textarea v-bind="$attrs" :fluid="fluid" :rows="rows" :cols="cols" />
    <InputIcon v-if="icon"><Icon class="cursor-pointer" :name="icon" @click="$emit('iconClick')" /></InputIcon>
  </IconField>
</template>

<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as Password } from './password-CRxCSpUp.js';

defineProps({
  size: { default: 'sm' }, preIcon: {}, fluid: { type: Boolean, default: true }, fieldProps: Object,
  feedback: Boolean, toggleMask: { type: Boolean, default: true },
});
defineEmits(['preIconClick']);
</script>

<template>
  <IconField class="w-full" :class="size" v-bind="fieldProps">
    <InputIcon v-if="preIcon">
      <Icon class="cursor-pointer" :name="preIcon" @click="$emit('preIconClick')" />
    </InputIcon>
    <Password :fluid="fluid" :feedback="feedback" :toggle-mask="toggleMask" v-bind="$attrs" />
  </IconField>
</template>

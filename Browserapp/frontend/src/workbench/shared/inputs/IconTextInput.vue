<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as InputText } from './inputtext-Crzvb5jQ.js';

defineOptions({ inheritAttrs: false });
defineProps({ size: { default: 'sm' }, leftIcon: {}, icon: {}, iconFieldClass: {} });
defineEmits(['leftIconClick', 'iconClick', 'change']);
</script>

<template>
  <IconField class="w-full" :class="iconFieldClass" :pt="{ root: size }">
    <InputIcon v-if="leftIcon"><Icon :name="leftIcon" class="cursor-pointer" @click="$emit('leftIconClick')" /></InputIcon>
    <InputText v-bind="$attrs" fluid @input="$emit('change')" />
    <InputIcon v-if="icon || $slots.icon">
      <slot name="icon"><Icon :name="icon" class="cursor-pointer" @click="$emit('iconClick')" /></slot>
    </InputIcon>
  </IconField>
</template>

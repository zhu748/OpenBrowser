<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as Textarea } from './textarea-DvuriTzI.js';

defineOptions({ inheritAttrs: false });
defineProps({ size: { default: 'sm' }, leftIcon: {}, icon: {}, rows: { default: 3 }, cols: { default: 30 } });
defineEmits(['iconClick', 'change']);
</script>

<template>
  <IconField class="w-full" :pt="{ root: size }">
    <InputIcon v-if="leftIcon"><Icon :name="leftIcon" class="cursor-pointer" @click="$emit('iconClick')" /></InputIcon>
    <Textarea class="block" v-bind="$attrs" fluid :rows="rows" :cols="cols" @input="$emit('change')" />
    <InputIcon v-if="icon"><Icon :name="icon" class="cursor-pointer" @click="$emit('iconClick')" /></InputIcon>
  </IconField>
</template>

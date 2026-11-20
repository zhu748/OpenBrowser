<script setup>
import { t as Select } from './multiselect-DS9bwX-7.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineOptions({ inheritAttrs: false });
defineProps({ size: { type: String, default: 'sm' } });
const emit = defineEmits(['change']);
</script>

<template>
  <Select filter option-label="label" option-value="value" v-bind="$attrs"
    :pt="{ root: size, optionlabel: '_optionlabel_ex20s_2', list: 'text-3.25', emptymessage: 'text-3.25' }" @change="emit('change')">
    <template #dropdownicon><Icon name="base/rx_ic_chevron_down" /></template>
    <template #chipicon="{ removeCallback, ...icon }"><Icon name="base/rx_ic_delete" v-bind="icon" @click="removeCallback" /></template>
  </Select>
</template>

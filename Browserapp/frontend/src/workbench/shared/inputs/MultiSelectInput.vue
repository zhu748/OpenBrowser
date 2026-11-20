<script setup>
import { t as MultiSelect } from './multiselect-DS9bwX-7.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

const props = defineProps({
  size: { default: 'sm' }, filter: { type: Boolean, default: true },
  optionLabel: { default: 'label' }, optionValue: { default: 'value' }, onChange: Function,
});
function change(event) {
  props.onChange?.({ ...event, props: { filter: props.filter, optionLabel: props.optionLabel, optionValue: props.optionValue } });
}
</script>

<template>
  <MultiSelect :filter="filter" :option-label="optionLabel" :option-value="optionValue"
    :pt="{ root: size, optionlabel: '_optionlabel_1jjhn_2', emptymessage: 'text-3.25' }" @change="change">
    <template #dropdownicon="icon"><Icon name="base/rx_ic_chevron_down" v-bind="icon" /></template>
    <template #chipicon="{ removeCallback, ...icon }"><Icon name="base/rx_ic_delete" v-bind="icon" @click="removeCallback" /></template>
    <template #headercheckboxicon="{ checked }"><Icon v-show="checked" name="base/rx_ic_checkmark" color="#ffffff" /></template>
    <template #optioncheckboxicon="{ checked }"><Icon v-show="checked" name="base/rx_ic_checkmark" color="#ffffff" /></template>
    <template v-for="(_, name) in $slots" #[name]="slotProps"><slot :name="name" v-bind="slotProps ?? {}" /></template>
  </MultiSelect>
</template>

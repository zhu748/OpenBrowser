<script setup>
import { t as Label } from './input-label-qeCNGFwS.js';
import { t as SelectButton } from './rx-select-button-DQtmZ0kT.js';
import { i as Select } from './contextmenu-BBjizTDn.js';
import { t as Radio } from './rx-input-radio-BGeLgzak.js';
import { i as DatePicker } from './ry-table-do6kugym.js';
import { t as NumberField } from './rx-input-number-aNUE_OpE.js';
import { t as Text } from './rx-input-text-CytLc5Og.js';
import { t as Textarea } from './rx-input-textarea-BWwP6OaO.js';
import MultiSelect from './workbench-profile-multi-select.js';

defineOptions({ inheritAttrs: false });
defineProps({ name: null, type: { type: String, default: 'text' }, label: null, tooltip: null, labelPosition: { type: String, default: 'top' } });
const fieldTypes = { multiSelect: MultiSelect, select: Select, radio: Radio, date: DatePicker, number: NumberField, text: Text, textarea: Textarea };
</script>

<template>
  <div class="rx-input" :class="{ 'rx-label-left': labelPosition === 'left' }">
    <slot name="label"><Label :name="name" :label="label" :tooltip="tooltip" /></slot>
    <slot name="input">
      <div class="flex-1">
        <SelectButton v-if="type === 'selectButton'" class="w-full" option-label="label" option-value="value"
          data-key="value" v-bind="$attrs" :name="name" />
        <component v-else :is="fieldTypes[type]" class="w-full" v-bind="$attrs" :name="name" />
        <small v-if="$attrs.invalid" class="rx-input-help">{{ $attrs.errorMsg || $attrs.placeholder }}</small>
        <small v-if="$attrs.help" class="rx-input-help">{{ $attrs.help }}</small>
      </div>
    </slot>
  </div>
</template>

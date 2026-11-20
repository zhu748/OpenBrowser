<script setup>
import { t as Select } from './m-input-select-C8pih1gY.js';
import { t as MultiSelect } from './m-input-multi-select-B7lX5Cnm.js';
import { t as DatePicker } from './m-input-date-picker-CPwsZFnI.js';

defineProps({ filters: { type: Array, default: () => [] } });
const emit = defineEmits(['change']);
const inputs = { select: Select, mselect: MultiSelect, date: DatePicker };
const inputDefaults = {
  select: { size: 'xxs' },
  mselect: { size: 'xxs', filter: false, showToggleAll: false, maxSelectedLabels: 1 },
  date: { size: 'xxs' },
};
let changed = false;
function onUpdate(filter, value) {
  filter.value = value;
  changed = true;
}
function onClose() {
  if (!changed) return;
  changed = false;
  emit('change');
}
</script>

<template>
  <div class="flex items-center gap-2">
    <component :is="inputs[filter.type]" v-for="filter in filters" :key="filter.name"
      :model-value="filter.value" v-bind="{ ...inputDefaults[filter.type], ...filter.props }"
      @update:model-value="onUpdate(filter, $event)" @hide="onClose" />
  </div>
</template>

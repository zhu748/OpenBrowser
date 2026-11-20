<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as MultiSelect } from './multiselect-DS9bwX-7.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
import DateRange from './workbench-table-date-range.js';

defineProps({ filters: { type: Array, default: () => [] } });
const emit = defineEmits(['change']);
const pending = new Set();
const visitedDates = new Set();
function change(filter, value) {
  filter.value = value;
  if (Array.isArray(value) && value.some(Boolean)) visitedDates.add(filter);
}
function closeSelect(filter) {
  if (pending.delete(filter)) emit('change');
}
function closeDate(filter) {
  if (visitedDates.delete(filter)) emit('change');
}
function clearDate(filter) {
  visitedDates.delete(filter);
  emit('change');
}
</script>
<template>
  <div v-for="filter in filters" :key="filter.name || filter.key" class="flex items-start shrink-0">
    <MultiSelect v-if="filter.type === 'multiple'" v-model="filter.value" class="min-w-37.5 shrink-0"
      option-label="label" option-value="value" :max-selected-labels="1" :show-toggle-all="false"
      :pt="{ list: 'text-3.25', emptymessage: 'text-3.25' }" v-bind="filter"
      @change="pending.add(filter)" @hide="closeSelect(filter)">
      <template #dropdownicon><Icon name="base/rx_ic_chevron_down" /></template>
    </MultiSelect>
    <Select v-else-if="filter.type === 'select'" v-model="filter.value" class="!min-w-37.5 shrink-0" size="xxs"
      show-clear :highlight-on-select="false" v-bind="{ filter: false, optionValue: 'value', ...filter }"
      @change="emit('change')" />
    <DateRange v-else-if="filter.type === 'date'" class="min-w-37.5 flex-row-reverse shrink-0"
      selection-mode="range" :manual-input="false" show-icon show-button-bar date-format="yy/mm/dd"
      :placeholder="filter.placeholder" v-bind="filter" :model-value="filter.value"
      @update:model-value="change(filter, $event)" @hide="closeDate(filter)" @clear-click="clearDate(filter)" />
  </div>
</template>

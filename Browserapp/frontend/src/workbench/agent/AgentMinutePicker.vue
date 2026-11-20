<script setup>
import { computed } from './workbench-vue.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as DatePicker } from './datepicker-Bd-h5Ks4.js';

defineOptions({ inheritAttrs: false });
defineProps({ disabled: Boolean });
const minute = defineModel({ required: true });
const normalized = value => Number.isInteger(value) && value >= 0 && value <= 59 ? value : 0;
const time = computed({ get: () => new Date(2000, 0, 1, 0, normalized(minute.value), 0, 0),
  set: value => { minute.value = normalized(value?.getMinutes()); } });
const formatted = computed(() => String(normalized(minute.value)).padStart(2, '0'));
const pickerParts = { hourPicker: { style: 'display: none' }, separatorContainer: { style: 'display: none' } };
</script>

<template>
  <span v-bind="$attrs" class="agent-minute-picker" :class="{ disabled }">
    <DatePicker v-model="time" class="agent-minute-picker__datepicker" panel-class="agent-schedule-datepicker-panel agent-minute-datepicker-panel"
      time-only hour-format="24" show-icon icon-display="input" fluid :aria-label="$t('每小时执行分钟')" :disabled="disabled" :manual-input="false" :pt="pickerParts">
      <template #inputicon="slot"><Icon name="base/rx_ic_chevron_down" size="12" :class="slot.class" @click.stop="slot.clickCallback" /></template>
    </DatePicker>
    <span class="agent-minute-picker__value" aria-hidden="true">{{ formatted }}</span>
  </span>
</template>

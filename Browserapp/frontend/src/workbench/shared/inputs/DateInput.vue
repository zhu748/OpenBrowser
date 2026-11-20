<script setup>
import { t as DatePicker } from './datepicker-Bd-h5Ks4.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';

defineProps({
  size: { default: 'sm' }, dateFormat: { default: 'yy/mm/dd' },
  showIcon: { type: Boolean, default: true }, iconDisplay: { default: 'input' },
  showButtonBar: { type: Boolean, default: true }, manualInput: Boolean,
});
</script>

<template>
  <DatePicker :class="size" :date-format="dateFormat" :show-icon="showIcon" :icon-display="iconDisplay"
    :show-button-bar="showButtonBar" :manual-input="manualInput">
    <template #inputicon="{ class: iconClass, clickCallback }">
      <Icon name="base/rx_ic_calendar" :class="iconClass" @click.stop="clickCallback" />
    </template>
  </DatePicker>
</template>

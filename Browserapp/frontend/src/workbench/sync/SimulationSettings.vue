<script setup>
import { watch } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as NumberInput } from './inputnumber-BD6BwCgc.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';
import { t as RadioButton } from './radiobutton-B3i1EP5M.js';
import { t as ToggleSwitch } from './toggleswitch-DKDK40Mk.js';
import RadioButtonGroup from './sync-radio-group.js';

const props = defineProps({ modelValue: { type: Object, required: true } });
defineEmits(['update:modelValue']);

const delays = [
  { enabled: 'enableClickDelay', min: 'clickIntervalMinMs', max: 'clickIntervalMaxMs', label: '点击延迟', interval: '点击延迟间隔' },
  { enabled: 'enableInputDelay', min: 'inputIntervalMinMs', max: 'inputIntervalMaxMs', label: '输入延迟', interval: '字符输入间隔' },
];
const modes = [
  { id: 'parallel-delay', value: 1, label: '并行延迟', hint: '并行延迟模式下，所有窗口同步执行延迟间隔' },
  { id: 'serialization-delay', value: 0, label: '串行延迟', hint: '串行延迟模式下，窗口逐个依次执行延迟间隔' },
];
for (const { min, max } of delays) {
  watch(() => props.modelValue[min], value => {
    if (value >= props.modelValue[max]) props.modelValue[max] = value + 1;
  });
  watch(() => props.modelValue[max], value => {
    if (value <= props.modelValue[min]) props.modelValue[min] = Math.max(0, value - 1);
  });
}
</script>

<template>
  <div class="simulate-settings">
    <template v-for="delay in delays" :key="delay.enabled">
      <div class="form-item">
        <label class="form-item-label">{{ $t(delay.label) }}</label>
        <div class="form-item-content"><ToggleSwitch v-model="modelValue[delay.enabled]" /></div>
      </div>
      <div v-if="modelValue[delay.enabled]" class="form-item">
        <label class="form-item-label">{{ $t(delay.interval) }}</label>
        <div class="form-item-content">
          <div class="input-number-row">
            <IconField class="w-[92px]">
              <NumberInput v-model="modelValue[delay.min]" :min="0" :use-grouping="false" fluid size="small" />
              <InputIcon> ms </InputIcon>
            </IconField>
            <div class="divider"></div>
            <IconField class="w-[92px]">
              <NumberInput v-model="modelValue[delay.max]" :min="1" :use-grouping="false" fluid size="small" />
              <InputIcon> ms </InputIcon>
            </IconField>
          </div>
        </div>
      </div>
    </template>
    <div class="form-item">
      <label class="form-item-label">{{ $t('延迟模式') }}</label>
      <div class="form-item-content">
        <RadioButtonGroup v-model="modelValue.clickDelayMode" name="ingredient" class="flex flex-wrap gap-4">
          <div v-for="mode in modes" :key="mode.id" class="flex items-center gap-2">
            <RadioButton :input-id="mode.id" :value="mode.value" size="small" />
            <div>
              <label :for="mode.id">{{ $t(mode.label) }}</label>
              <Icon v-tooltip.top="$t(mode.hint)" class="align-middle ml-1" name="base/rx_ic_info" :size="12" color="#C7CDD1" />
            </div>
          </div>
        </RadioButtonGroup>
      </div>
    </div>
  </div>
</template>

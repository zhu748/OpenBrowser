<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as NumberInput } from './inputnumber-BD6BwCgc.js';
import { n as IconField, t as InputIcon } from './inputicon-Bn1KerIx.js';

const props = defineProps({ modelValue: { type: Object, required: true } });
defineEmits(['update:modelValue']);

const sizes = [
  { key: 'w', prefix: 'W', hint: '宽度' },
  { key: 'h', prefix: 'H', hint: '高度' },
];
const gaps = [
  { key: 'gap_horizontal', icon: 'base/rx_ic_gap_h', hint: '水平间距' },
  { key: 'gap_vertical', icon: 'base/rx_ic_gap_v', hint: '垂直间距' },
];

globalThis.electronAPI.send('syncControl:getMainControlBrowserSize').then(size => {
  props.modelValue.w ||= size?.width || 0;
  props.modelValue.h ||= size?.height || 0;
}).catch(error => console.warn(error));
</script>

<template>
  <div class="custom-layout">
    <template v-if="modelValue.type === 'custom'">
      <div class="form-item">
        <label class="form-item-label">{{ $t('窗口大小') }}</label>
        <div class="form-item-content">
          <div class="input-number-row">
            <IconField v-for="size in sizes" :key="size.key">
              <InputIcon class="prefix"> {{ size.prefix }} </InputIcon>
              <NumberInput v-model="modelValue[size.key]" v-tooltip.top="$t(size.hint)" fluid size="small" :min="0" :use-grouping="false" />
            </IconField>
          </div>
        </div>
      </div>
      <div class="form-item">
        <label class="form-item-label">{{ $t('窗口间距') }}</label>
        <div class="form-item-content">
          <div class="input-number-row">
            <IconField v-for="gap in gaps" :key="gap.key">
              <InputIcon class="prefix"><Icon :name="gap.icon" size="14px" /></InputIcon>
              <NumberInput v-model="modelValue[gap.key]" v-tooltip.top="$t(gap.hint)" :min="0" :use-grouping="false" fluid size="small" />
            </IconField>
          </div>
        </div>
      </div>
      <div class="form-item">
        <label class="form-item-label">{{ $t('每行数量') }}</label>
        <div class="form-item-content flex items-center gap-[12px]">
          <NumberInput v-model="modelValue.count_per_row" class="!w-[120px]" :min="1" :max="1000" fluid size="small" />
          <span>{{ $t('个/每行') }}</span>
        </div>
      </div>
    </template>
  </div>
</template>


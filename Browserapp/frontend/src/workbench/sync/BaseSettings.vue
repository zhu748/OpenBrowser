<script setup>
import { t as ColorSelect } from './colors-select-CQM6_O2z.js';
import { t as ToggleSwitch } from './toggleswitch-DKDK40Mk.js';
import { t as Checkbox } from './rx-checkbox-BrC0MzoD.js';

defineProps({ modelValue: { type: Object, required: true } });
defineEmits(['update:modelValue']);

const colors = ['#FF12A3FC', '#FFEB5757', '#FFD17CFE', '#FFFBC26F', '#C7CDD1']
  .map(color => color.at(0) + color.slice(3) + color.slice(1, 3));
const mouseActions = [
  { key: 'enableSyncMouseClick', label: '点击' },
  { key: 'enableSyncMouseScroll', label: '滚动' },
  { key: 'enableSyncMouseMove', label: '轨迹' },
];
</script>

<template>
  <div class="base-settings">
    <div class="form-item">
      <label class="form-item-label">{{ $t('主控窗口颜色') }}</label>
      <div class="form-item-content"><ColorSelect v-model="modelValue.mainControlWindowColor" :colors="colors" /></div>
    </div>
    <div class="form-item">
      <label class="form-item-label">{{ $t('同步键盘输入') }}</label>
      <div class="form-item-content"><ToggleSwitch v-model="modelValue.enableSyncKeybord" size="small" /></div>
    </div>
    <div class="form-item">
      <label class="form-item-label">{{ $t('同步鼠标输入') }}</label>
      <div class="form-item-content">
        <div class="checkbox-list">
          <div v-for="action in mouseActions" :key="action.key" class="checkbox-item">
            <Checkbox v-model="modelValue[action.key]" binary size="small" :input-id="action.key" />
            <label :for="action.key">{{ $t(action.label) }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

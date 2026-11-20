<script setup>
import { ref, watch } from 'vue';
import { t as translate } from './locales-BfKu2SD4.js';
import { t as Radio } from './radiobutton-B3i1EP5M.js';
import { t as NumberInput } from './inputnumber-BD6BwCgc.js';
import { t as DecimalInput } from './rx-input-number-EcSY6ALQ.js';

const form = ref({ min: 0, max: 10, data_type: 'int', decimal_place_count: 1 });
watch(() => form.value.min, min => { if (min >= form.value.max) form.value.max = min + 1; });
watch(() => form.value.max, max => { if (max <= form.value.min) form.value.min = max - 1; });
defineExpose({
  get formData() {
    return { ...form.value, min: String(form.value.min), max: String(form.value.max) };
  },
});
</script>

<template>
  <div class="random-text">
    <div class="form-item">
      <label class="form-item-label">{{ translate('数值类型') }}</label>
      <div class="form-item-content">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <Radio v-model="form.data_type" input-id="int" name="type" value="int" /><label for="int">{{ translate('整数') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <Radio v-model="form.data_type" input-id="float" name="type" value="float" /><label for="float">{{ translate('小数') }}</label>
          </div>
        </div>
      </div>
    </div>
    <div v-if="form.data_type === 'float'" class="form-item">
      <label class="form-item-label">{{ translate('小数点后位数') }}</label>
      <div class="form-item-content">
        <DecimalInput v-model="form.decimal_place_count" :max="10" :min="1" class="!w-120px" />
      </div>
    </div>
    <div class="form-item">
      <label class="form-item-label">{{ translate('数字范围') }}</label>
      <div class="form-item-content">
        <div class="input-number-row">
          <NumberInput v-model="form.min" :use-grouping="false" fluid size="small" />
          <div class="gap-line"></div>
          <NumberInput v-model="form.max" :use-grouping="false" fluid size="small" />
        </div>
      </div>
    </div>
  </div>
</template>

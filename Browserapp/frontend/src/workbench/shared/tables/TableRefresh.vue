<script setup>
import { ref, watch } from './workbench-vue.js';
import { fr as formatTime } from './utils-BIWenCnY.js';
import { y as useInterval } from './dist-ufdnm93_.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';

const props = defineProps({ loading: Boolean, showLabel: Boolean });
const time = ref('');
let updated = Date.now();
function refreshTime() {
  time.value = formatTime(updated);
}
watch(() => props.loading, loading => {
  if (!loading) {
    updated = Date.now();
    refreshTime();
  }
});
useInterval(refreshTime, 60000);
</script>
<template>
  <div class="position-relative flex">
    <Button v-tooltip.left="{ value: $t('最后刷新: {time}', { time }), pt: { text: '' } }"
      severity="secondary" size="xxs" outlined icon="base/rx_ic_refresh" :disabled="loading"
      :label="showLabel ? $t('刷新') : undefined" />
  </div>
</template>

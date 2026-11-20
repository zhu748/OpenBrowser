<script setup>
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useLabels } from './proxy-shop-labels-nJaBS4W_.js';

defineProps({ completed: {}, total: {} });
const labels = useLabels();
</script>

<template>
  <Teleport to="body">
    <div class="concurrent-task-top-bar" role="status" aria-live="polite">
      <div class="flex flex-col gap-2 max-w-90 pa-3 rounded-1 pointer-events-auto concurrent-task-top-bar__inner">
        <div class="flex items-center gap-2 text-white">
          <Icon class="loading-circle" name="base/rx_ic_spin" size="18" />
          <div class="flex items-center gap-1 text-3 font-500 leading-normal">
            <span>{{ completed }} / {{ total }}</span><span>{{ labels.concurrentTestingLabel }}</span>
          </div>
        </div>
        <div class="pl-6 text-white opacity-80 text-3 leading-normal">{{ $t('当前操作可能需要几分钟时间，请勿离开此页面。') }}</div>
      </div>
    </div>
  </Teleport>
</template>

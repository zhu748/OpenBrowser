<script setup>
import { computed } from './workbench-vue.js';
import { Ar as addSuffix } from './utils-BIWenCnY.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as Loading } from './m-input-select-C8pih1gY.js';

const props = defineProps({ phase: String, checkResult: { default: null }, historyMatched: Boolean,
  showHistoryCheck: { type: Boolean, default: true }, checkingText: { default: () => $t('正在检测设备...') } });
const connected = computed(() => props.phase !== 'connectivity-failed');
const location = computed(() => {
  const { lastCountry, lastCity, lastIp } = props.checkResult ?? {};
  return lastCountry || lastCity || lastIp ? `${lastCountry ?? ''}${addSuffix('/', lastCity)} · ${lastIp ?? '--'}` : '--';
});
const states = computed(() => ({
  success: { icon: 'status/rx_ic_check_fill', tone: 'success', title: $t('检测通过'), detail: $t('设备连通正常，且未匹配到平台半年内的历史库，可放心绑定账号。') },
  'connectivity-failed': { icon: 'base/rx_ic_delete_fill', tone: 'error', title: $t('设备连通失败'), detail: $t('无法连通该设备，请检查主机 / 端口 / 账号密码后重试') },
  'history-risk': { icon: 'base/rx_ic_warn_fill', tone: 'warning', title: $t('检测到关联风险'), detail: $t('该设备在过去 6 个月内曾被导入使用，继续绑定可能造成账号关联风险，建议更换设备。') },
}));
const state = computed(() => states.value[props.phase]);
</script>

<template>
  <div v-if="phase === 'checking'" class="flex flex-col items-center gap-4 py-8">
    <div class="relative size-10 shrink-0"><Loading :model-value="true" :size="40" :opacity="1" /></div>
    <span class="tt-secondary text-3.25">{{ checkingText }}</span>
  </div>
  <template v-else-if="state">
    <div class="flex flex-col items-center gap-3 text-center">
      <Icon :name="state.icon" size="48" :color="`var(--colors-icon-icon-${state.tone})`" />
      <div class="tt-primary text-4.5 font-600 leading-normal">{{ state.title }}</div>
      <p class="tt-secondary text-3.25 leading-5 m-0">{{ state.detail }}</p>
    </div>
    <div class="detect-status-panel flex flex-col gap-3 pa-4 rounded-3">
      <div class="flex items-center gap-2">
        <Icon :name="connected ? 'base/rx_ic_check' : 'base/rx_ic_delete_fill'" size="16"
          :color="connected ? 'var(--colors-icon-icon-success)' : 'var(--colors-icon-icon-error)'" />
        <span class="tt-primary text-3.25 leading-4.5">{{ $t('设备连通性检测') }} · {{ connected ? $t('正常') : $t('失败') }}</span>
      </div>
      <div v-if="connected && showHistoryCheck" class="flex items-center gap-2">
        <Icon :name="historyMatched ? 'base/rx_ic_warn_fill' : 'base/rx_ic_check'" size="16"
          :color="historyMatched ? 'var(--colors-icon-icon-warning)' : 'var(--colors-icon-icon-success)'" />
        <span class="tt-primary text-3.25 leading-4.5">{{ $t('平台半年内历史库匹配') }} · {{ historyMatched ? $t('命中') : $t('未命中') }}</span>
      </div>
    </div>
    <div v-if="connected" class="detect-exit-panel flex items-center justify-between gap-3 pa-3 rounded-2">
      <span class="tt-secondary text-3 shrink-0">{{ $t('设备出口') }}</span>
      <div class="flex items-center gap-2 min-w-0">
        <Icon v-if="checkResult?.lastCountry" :name="'country-code/' + checkResult.lastCountry" fallback="base/rx_ic_earth" size="16" class="shrink-0" />
        <span class="tt-primary text-3.25 leading-4.5 truncate">{{ location }}</span>
      </div>
    </div>
  </template>
</template>

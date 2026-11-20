<script setup>
import { computed, ref } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { E as useNetwork } from './hooks-Jw3GridD.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
const network = useNetwork();
const [notify] = useNotice();
const refreshing = ref(false);
const region = computed(() => [network.info?.country_code, network.info?.city].filter(Boolean).join('·') || '--');
async function refresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    const preferences = await globalThis.electronAPI.send('app:getSoftConfig');
    network.setNetworkInfo(await globalThis.electronAPI.send('proxy:detectNetwork', preferences.networkMode));
  } catch {
    notify(-1, $t('网络检测失败'));
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-1 tt-tertiary text-3">
    <div class="flex items-center gap-2">
      <span>{{ $t('当前环境使用本机网络：') }}</span>
      <Icon :name="'country-code/' + network.info?.country_code" fallback="base/rx_ic_earth" />
      <span class="font-500">{{ region }}</span><span class="font-500">{{ network.info?.ip || '--' }}</span>
      <Icon class="cursor-pointer" :class="{ 'pi-spin': refreshing }" :name="refreshing ? 'base/rx_ic_progress_bar' : 'base/rx_ic_refresh'"
        size="14" color="var(--colors-icon-icon-tertiary)" @click="refresh" />
    </div>
    <div class="tt-warning">{{ $t('* 多个窗口或业务账号共用同一出口 IP，可能增加账号关联或平台风控风险。') }}</div>
    <div class="tt-warning">{{ $t('* 建议为每个窗口配置独立代理 IP。') }}</div>
  </div>
</template>

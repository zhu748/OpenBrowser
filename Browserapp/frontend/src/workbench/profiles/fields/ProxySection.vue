<script setup>
import { computed, reactive, ref, toRaw, watch } from 'vue';
import { n as CustomProxy, t as ChooseProxy } from './choose-panel-CC3iR_nA.js';
import { t as SelectButton } from './rx-select-button-DQtmZ0kT.js';
import { t as Label } from './input-label-qeCNGFwS.js';
import { o as useForm } from './useAsyncGate-D7VA7DLY.js';
import LocalNetwork from './workbench-profile-local-network.js';

defineOptions({ inheritAttrs: false });
const proxies = defineModel({ type: Array, default: () => [] });
const { presetTemplate } = useForm();
const mode = ref('noproxy');
const drafts = reactive({ custom: null, choose: null });
let lastLocalProxy;
const options = computed(() => [
  { label: $t('不使用'), value: 'noproxy' }, { label: $t('添加代理 IP'), value: 'custom' }, { label: $t('选择代理 IP'), value: 'choose' },
]);
function modeFor(proxy) {
  if (!proxy || String(proxy.proxyCategory || proxy.protocol || '').toLowerCase() === 'noproxy') return 'noproxy';
  if (proxy.proxyMethod === 'api') return proxy.host || proxy.extraUrl ? 'custom' : 'noproxy';
  if (proxy.proxyMethod === 'choose' || (proxy.id != null && !['0', ''].includes(String(proxy.id)))) return 'choose';
  return proxy.proxyMethod === 'custom' || proxy.host ? 'custom' : 'noproxy';
}
function syncDrafts(proxy) {
  if (proxy && toRaw(proxy) === lastLocalProxy) return;
  if (!proxy && lastLocalProxy === null) return;
  mode.value = modeFor(proxy);
  if (mode.value !== 'noproxy' && proxy) drafts[mode.value] = { ...toRaw(proxy) };
}
watch(() => proxies.value?.[0], syncDrafts, { immediate: true });
function save() {
  if (presetTemplate) presetTemplate.value = undefined;
  const proxy = mode.value === 'noproxy' ? null : drafts[mode.value];
  lastLocalProxy = proxy ? toRaw(proxy) : null;
  proxies.value = proxy ? [proxy] : [];
}
function setDraft(key, proxy) {
  drafts[key] = proxy;
  if (mode.value === key) save();
}
</script>

<template>
  <div class="w-full flex items-start proxy-info">
    <Label class="shrink-0 max-w-25 !min-w-25 text-right" :label="$t('代理 IP')"
      :tooltip="$t('代理 IP 是使用特定 IP 地址进行网络访问的方式，平台会获取您的 IP 地址来追踪您，强烈建议配置此项！')" />
    <div class="min-w-0 flex-1 flex flex-col gap-4">
      <div class="flex flex-col items-start gap-4 w-full">
        <SelectButton v-model="mode" :options="options" size="lg" option-label="label" option-value="value" data-key="value" @change="save" />
      </div>
      <div class="pa-4 rounded-2 panel">
        <KeepAlive>
          <LocalNetwork v-if="mode === 'noproxy'" key="noproxy" />
          <CustomProxy v-else-if="mode === 'custom'" key="custom" :model-value="drafts.custom" @update:model-value="setDraft('custom', $event)" />
          <ChooseProxy v-else-if="mode === 'choose'" key="choose" :model-value="drafts.choose" @update:model-value="setDraft('choose', $event)" />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

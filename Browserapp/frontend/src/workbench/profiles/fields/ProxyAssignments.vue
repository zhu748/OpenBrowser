<script setup>
import { computed, h, reactive, toRaw } from 'vue';
import { cr as clone, nn as usePermissions } from './utils-BIWenCnY.js';
import { n as useNotice } from './agent-BmSFI9WH.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as Card } from './rx-card-De8gGY1x.js';
import { E as useNetwork, t as useProxyTests } from './hooks-Jw3GridD.js';
import { t as proxyFormTitle } from './proxy-create-mode-BCcLAAf5.js';
import { o as useDrawer, t as useProxyFormDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import { t as useSimpleDialog } from './simplePopup-D6H7ykCr.js';
import { t as ProxyPicker } from './simple-zBOi42-i.js';
import { o as useProfileForm } from './useAsyncGate-D7VA7DLY.js';

defineOptions({ inheritAttrs: false });
const proxies = defineModel({ type: Array, default: () => [] });
const { isBatch, createCount } = useProfileForm();
const { check } = usePermissions();
const [notify, notifyError] = useNotice();
const drawer = useDrawer();
const { showProxyFormDrawer } = useProxyFormDrawer(drawer);
const form = proxyFormTitle('proxy');
const network = useNetwork();
const { testProxy, batchTestShowToast } = useProxyTests();
const { showSimpleDialog } = useSimpleDialog();
const testing = reactive(new Set());
const selected = computed(() => proxies.value.filter(proxy => proxy.id));
const used = computed(() => proxies.value.reduce((sum, proxy) => sum + (proxy?._proxyCount || 0), 0));
const warning = computed(() => used.value > createCount.value
  ? $t('仅 {count} 个窗口将会绑定代理 IP。请移除多余的 {beyond} 条代理 IP。', { count: createCount.value, beyond: used.value - createCount.value })
  : $t('仅 {count} 个窗口将会绑定代理 IP', { count: used.value }));
const localNetworkName = computed(() => [network.info?.country_code, network.info?.city].filter(Boolean).join('/'));
function addOrEdit(proxy) {
  showProxyFormDrawer({ title: form.pageTitle, data: clone(proxy), mode: 'proxy', onConfirm: save });
}
function choose() {
  const data = isBatch.value ? selected.value : selected.value[0];
  drawer.showDrawer({ title: $t('代理 IP 列表'), slots: { container: () => h(ProxyPicker, { data, isBatch: isBatch.value, onConfirm: selection => {
    if (selection != null) {
      if (isBatch.value) proxies.value = proxies.value.filter(proxy => !proxy.id).concat(selection)
        .map(({ bindList: _bindList, ...proxy }) => toRaw(proxy));
      else proxies.value = [toRaw(selection)];
    }
    drawer.hideDrawer();
  } }) } });
}
function save(proxy) {
  if (proxy._tempId) {
    const index = proxies.value.findIndex(item => item._tempId === proxy._tempId);
    if (index >= 0) proxies.value[index] = { ...proxies.value[index], ...proxy };
    return;
  }
  const next = proxy.id ? proxy : { ...proxy, _tempId: Date.now().toString(32) };
  if (isBatch.value) proxies.value.push({ ...next, _proxyCount: 1 });
  else proxies.value = [next];
}
function edit(proxy) {
  if (!check('Profiles_edit_proxy_outside')) return;
  if (proxy.isEncryptProxy) {
    notify(-1, $t('该代理 IP 已加密无法编辑，如需更换，请先删除此代理 IP 或选择其他代理 IP'));
  } else if (proxy.id) choose();
  else addOrEdit(proxy);
}
async function test(proxy) {
  if (testing.has(proxy)) return;
  testing.add(proxy);
  try {
    const { _checkRes, bindList, ...configuration } = toRaw(proxy);
    const result = await testProxy({ ...configuration, apiCheck: false });
    batchTestShowToast({ ...result, proxyType: proxy.proxyType ?? proxy.buyProxyType }, { reCheck: () => test(proxy) });
    if (proxies.value.includes(proxy)) Object.assign(proxy, result);
  } catch (error) {
    notifyError(-1, error.message || $t('代理 IP 测试失败'));
  } finally {
    testing.delete(proxy);
  }
}
function changeCount(proxy) {
  showSimpleDialog({ content: $t('设置绑定的窗口数量'), inputs: [{ type: 'number', name: 'proxyCount', value: proxy._proxyCount,
    props: { placeholder: $t('请输入数量') },
    resolver: schema => schema.number({ invalid_type_error: $t('数量必须大于{min}', { min: 1 }) }).min(1, $t('数量必须大于{min}', { min: 1 })),
  }], onConfirm: value => { proxy._proxyCount = Number.parseInt(value.proxyCount, 10); } });
}
function details(proxy) {
  return { value: [$t('代理 IP 信息'), proxy.ipType, [proxy.protocol, proxy.host].filter(Boolean).join('://') + (proxy.port ? ':' + proxy.port : ''),
    $t('动态代理 IP 刷新 URL') + ': ' + (proxy.refreshUrl || '--'), $t('位置') + ': ' + [proxy.lastCountry, proxy.lastCity].filter(Boolean).join('/'),
    $t('检测时间') + ': ' + (proxy.checkTime || '--')].join('\n'), showDelay: 300, pt: { root: '!max-w-80' } };
}
</script>

<template>
  <div class="w-full flex flex-col gap-3">
    <div class="flex items-center self-stretch gap-2">
      <div class="flex-1 flex flex-col gap-1.5">
        <div class="title">{{ $attrs.label }}</div>
        <div v-if="!proxies.length" class="flex items-center gap-1 tips">
          <span>{{ $t('本机网络环境: {value}({ip})', { value: localNetworkName, ip: network.info?.ip }) }}</span>
          <Icon v-tooltip.top="{ value: $t('无代理 IP 的情况下该窗口将使用当前 IP 作为出口 IP') }" name="base/rx_ic_info" size="14" color="var(--colors-icon-icon-note)" />
        </div>
      </div>
      <div v-if="(isBatch || !proxies.length) && check('Profiles_add_proxy_outside')" class="flex items-center gap-2">
        <Button size="xxs" text severity="secondary" icon="base/rx_ic_plus" :label="$t('添加')" @click="addOrEdit()" />
      </div>
      <Button v-if="check('Profiles_select_proxy')" size="xxs" text severity="secondary" icon="base/rx_ic_exchange" :label="$t('选择')" @click="choose" />
    </div>
    <div class="pl-27 flex flex-col gap-3 empty:hidden">
      <Alert v-if="isBatch && used && used !== createCount" class="w-full whitespace-pre-line" :type="used > createCount ? 'warn' : 'info'" :closable="false" :title="warning" />
      <div v-if="proxies.length" class="grid gap-2 list">
        <Card v-for="(proxy, index) in proxies" :key="proxy._tempId || proxy.id || index"
          class="flex gap-2 items-start overflow-hidden" :closable="false" @click="edit(proxy)">
          <Icon class="mt-0.5" :name="'country-code/' + proxy.lastCountry" fallback="base/rx_ic_earth" color="var(--colors-icon-icon-tertiary)" />
          <div class="flex-1 flex flex-col gap-1 overflow-hidden">
            <div class="flex items-center gap-2 region">
              <span>{{ proxy.lastCountry || '--' }}{{ proxy.lastCity ? '/' + proxy.lastCity : '' }}</span>
              <Icon v-tooltip.top="details(proxy)" name="base/rx_ic_info_fill" size="12" color="var(--colors-icon-icon-note)" />
            </div>
            <div v-if="isBatch" class="flex items-center gap-1.5 info">
              <span>{{ $t('绑定窗口数:') }}</span><span class="text-[var(--colors-text-text-primary)] font-bold">{{ proxy._proxyCount }}</span>
              <span class="text-[var(--colors-text-text-link)] cursor-pointer" @click.stop="changeCount(proxy)">{{ $t('修改') }}</span>
            </div>
            <div v-else class="flex items-center gap-1.5 info">
              <div>{{ proxy.ipType }}</div><div class="line"></div>
              <div class="flex-1 ellipsis-1">{{ proxy.proxyCategory || proxy.protocol }}{{ proxy.host ? '://' + proxy.host : '' }}{{ proxy.port ? ':' + proxy.port : '' }}</div>
            </div>
          </div>
          <div class="mt-0.5 flex gap-2">
            <Icon v-if="check('Profiles_speed_test_proxy')" class="cursor-pointer" :class="{ 'pi-spin': testing.has(proxy) }"
              :name="testing.has(proxy) ? 'base/rx_ic_progress_bar' : 'base/rx_ic_speed_test'" color="var(--colors-icon-icon-tertiary)" @click.stop="test(proxy)" />
            <Icon v-if="check('Profiles_delete_proxy_outside')" class="cursor-pointer" name="base/rx_ic_delete"
              color="var(--colors-icon-icon-tertiary)" @click.stop="proxies.splice(index, 1)" />
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

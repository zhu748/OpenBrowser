<script setup>
import { cr as clone, h as api } from './utils-BIWenCnY.js';
import { toRaw, ref, onMounted, computed, watch } from './workbench-vue.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { i as requestType } from './permission-DOhNJfB3.js';
import { m as proxyTypes, n as proxyUsage } from './proxy-D7e36h-l.js';
import { o as isDeploying, t as useProxyTest } from './hooks-Jw3GridD.js';
import { t as useProxyUpdate } from './useProxyModuleCreate-DnWsQ0mq.js';
import { a as I18nText } from './locales-BfKu2SD4.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Select } from './m-input-select-C8pih1gY.js';
const model = defineModel({ default: null });

let { testProxy: testProxy, batchTestShowToast: showTestResult } =
    useProxyTest(),
  { updateProxyModules: updateProxyModules } = useProxyUpdate(),
  [notify] = useToast(),
  checking = ref(false),
  shuffling = ref(false),
  loading = ref(false),
  catalog = ref([]),
  version = 0;
function location(e3) {
  return [e3.lastCountry, e3.lastCity].filter(Boolean).join(' / ') || '--';
}
function proxyDeploying(e3) {
  return isDeploying(e3?.orderStatus);
}
function deployingMessage() {
  return $t('配置中, 预计 {time} 分钟内完成', { time: 2 });
}
function locationLabel(e3) {
  let t2 = location(e3);
  return t2 === '--' && proxyDeploying(e3) ? deployingMessage() : t2;
}
function endpoint(e3) {
  let t2 = String(e3.proxyCategory || e3.protocol || '').trim(),
    n2 = String(e3.host || '').trim(),
    r3 = String(e3.port ?? '').trim();
  if ((!n2 && !r3) || e3.isEncryptProxy) return '';
  let i3 = [n2, r3].filter(Boolean).join(':');
  return t2 ? `${t2.toLocaleLowerCase()}://${i3}` : i3;
}
function countBindings(e3) {
  if (Array.isArray(e3)) return e3.length;
  if (e3 == null || e3 === '') return 0;
  try {
    let t2 = JSON.parse(String(e3));
    return Array.isArray(t2) ? t2.length : 0;
  } catch {
    return 0;
  }
}
let cloudPhone = !!globalThis.isCloudPhoneApp;
function bindingCount(e3) {
  if (cloudPhone) {
    if (e3.phoneBindCount != null && e3.phoneBindCount !== '') {
      let t3 = Number(e3.phoneBindCount);
      if (Number.isFinite(t3)) return Math.max(0, Math.trunc(t3));
    }
    return countBindings(e3.phoneBindList);
  }
  let t2 = countBindings(e3.bindList),
    n2 = Number(e3.bindCount);
  return Math.max(t2, Number.isFinite(n2) ? n2 : 0);
}
function bindingKey() {
  return cloudPhone
    ? $t('已关联 {count} 个云手机', { count: '{count}' })
    : $t('已关联 {count} 个窗口', { count: '{count}' });
}
function remark(e3) {
  let t2 = String(e3.remark ?? '').trim();
  return t2 ? $t('备注: {remark}', { remark: t2 }) : '';
}
function describe(e3) {
  let t2 = location(e3),
    n2 = locationLabel(e3),
    r3 = String(e3.lastIp || '').trim(),
    i3 = [n2 === '--' ? '' : n2, r3].filter(Boolean).join(' • ') || '--';
  return {
    ...e3,
    icon: e3.lastCountry
      ? `country-code/${e3.lastCountry}`
      : 'base/rx_ic_earth',
    label: i3,
    searchText: [
      e3.lastCountry,
      e3.lastCity,
      t2,
      n2,
      r3,
      e3.protocol,
      e3.host,
      e3.port,
      e3.remark,
    ]
      .filter(Boolean)
      .join(' '),
  };
}
let statusKeys = [
  'lastIp',
  'lastCountry',
  'lastCity',
  'lastState',
  'checkStatus',
  'checkTime',
];
function applyStatus(e3, t2) {
  let n2 = {};
  for (let e4 of statusKeys) {
    let r3 = t2[e4];
    r3 != null && r3 !== '' && (n2[e4] = r3);
  }
  return describe({ ...e3, ...n2 });
}
function hasConnection(e3) {
  return e3
    ? e3.isEncryptProxy && e3.proxyEncryptInfo
      ? true
      : !!(String(e3.host || '').trim() && String(e3.port ?? '').trim())
    : false;
}
function reconcileSelection() {
  let e3 = model.value;
  if (!e3?.id || hasConnection(e3)) return;
  let t2 = catalog.value.find((t3) => String(t3.id) === String(e3.id));
  t2 &&
    (hasConnection(t2) || proxyDeploying(t2)) &&
    (model.value = { ...applyStatus(t2, e3), proxyMethod: 'choose' });
}
let options = computed(() => {
    let e3 = catalog.value,
      t2 = model.value;
    if (!t2?.id) return e3;
    let n2 = e3.findIndex((e4) => String(e4.id) === String(t2.id));
    if (n2 < 0) return [describe(t2), ...e3];
    let r3 = e3.slice();
    return ((r3[n2] = applyStatus(e3[n2], t2)), r3);
  }),
  selectedId = computed({
    get: () => {
      let e3 = model.value?.id;
      return e3 == null || e3 === ''
        ? null
        : (options.value.find((t2) => String(t2.id) === String(e3))?.id ?? e3);
    },
    set: (e3) => {
      if (e3 == null || e3 === '') {
        model.value = null;
        return;
      }
      let t2 =
        catalog.value.find((t3) => String(t3.id) === String(e3)) ??
        options.value.find((t3) => String(t3.id) === String(e3));
      model.value = t2 ? { ...t2, proxyMethod: 'choose' } : null;
    },
  });
onMounted(() => {
  loadOptions();
});
async function loadOptions() {
  let e3 = ++version;
  loading.value = true;
  try {
    let { code: t2, data: r3 } = await api.proxy.userGetProxyListMergedList({
      type: proxyUsage.UseDeploy,
      page_index: '1',
      page_size: '200',
    });
    if (e3 !== version || t2 !== 0) return;
    ((catalog.value = (r3?.rows ?? []).map((e4) => describe(e4))),
      reconcileSelection());
  } catch (error) {
    if (e3 === version) notify(-1, error.message);
  } finally {
    e3 === version && (loading.value = false);
  }
}
watch(
  () => [model.value?.id, catalog.value],
  () => {
    reconcileSelection();
  },
);
async function chooseRandom() {
  if (shuffling.value) return;
  shuffling.value = true;
  try {
    let {
      code: e3,
      data: t2,
      msg: r3,
    } = await api.proxy.userGetRandomAvailableProxyMergedList();
    if (e3 !== 0 || !t2) {
      notify(e3 === 0 ? -1 : e3, r3 || $t('暂无可用代理 IP'));
      return;
    }
    model.value = { ...describe(t2), proxyMethod: 'choose' };
  } finally {
    shuffling.value = false;
  }
}
defineExpose({ checkProxy: checkProxy });
function setTestResult(id, result) {
  if (String(model.value?.id) === String(id)) {
    model.value = { ...toRaw(model.value), ...result };
  }
}
async function refreshDeploying() {
  let e3 = model.value,
    t2 = e3?.id;
  if (t2 == null || t2 === '') return e3;
  try {
    let { code: r3, data: i3 } = await api.proxy.userGetProxyDetailMergedList({
      id: String(t2),
    });
    if (String(model.value?.id) !== String(t2)) return;
    if (r3 !== 0 || !i3) return e3;
    let a3 = describe({ ...i3, id: t2, proxyMethod: 'choose' }),
      s2 = catalog.value.findIndex((e4) => String(e4.id) === String(t2));
    return (
      s2 < 0
        ? (catalog.value = [a3, ...catalog.value])
        : (catalog.value[s2] = a3),
      (model.value = { ...a3, proxyMethod: 'choose' }),
      model.value
    );
  } catch (t3) {
    return (
      console.error(
        '[Proxy:choose-panel] refresh configuring proxy failed',
        t3,
      ),
      e3
    );
  }
}
async function loadDetail() {
  if ((reconcileSelection(), hasConnection(model.value))) return model.value;
  let e3 = model.value?.id;
  if (e3 == null || e3 === '') return null;
  if (
    !catalog.value.length &&
    (await loadOptions(), hasConnection(model.value))
  )
    return model.value;
  try {
    let { code: t2, data: r3 } = await api.proxy.userGetProxyDetailMergedList({
      id: String(e3),
    });
    if (String(model.value?.id) !== String(e3)) return null;
    if (t2 !== 0 || !r3) return hasConnection(model.value) ? model.value : null;
    let i3 = describe({ ...r3, id: e3, proxyMethod: 'choose' }),
      a3 = catalog.value.findIndex((t3) => String(t3.id) === String(e3));
    return (
      a3 < 0
        ? (catalog.value = [i3, ...catalog.value])
        : (catalog.value[a3] = applyStatus(i3, catalog.value[a3])),
      (model.value = {
        ...applyStatus(i3, model.value || i3),
        proxyMethod: 'choose',
      }),
      model.value
    );
  } catch (e4) {
    return (
      console.error('[Proxy:choose-panel] fetch proxy detail failed', e4),
      hasConnection(model.value) ? model.value : null
    );
  }
}
async function checkProxy() {
  const id = model.value?.id;
  if (!id) {
    notify(-1, $t('请先选择代理 IP'));
    return;
  }
  if (checking.value) return;
  checking.value = true;
  try {
    let e3 = options.value.find(
      (e4) => String(e4.id) === String(model.value?.id),
    );
    if (
      (proxyDeploying(model.value) || proxyDeploying(e3)) &&
      proxyDeploying(await refreshDeploying())
    ) {
      notify(-1, deployingMessage());
      return;
    }
    if (String(model.value?.id) !== String(id)) return;
    let n2 = await loadDetail();
    if (String(model.value?.id) !== String(id)) return;
    if (!n2 || !hasConnection(n2)) {
      notify(-1, $t('未找到已绑定的代理 IP'));
      return;
    }
    if (!globalThis.isElectron)
      return globalThis.electronAPI.send('proxy:detect', {});
    let r3 = clone(n2),
      i3 = r3.proxyType ?? r3.buyProxyType;
    let a3 = await testProxy({ ...r3, apiCheck: false, proxyType: i3 });
    if (String(model.value?.id) === String(id)) {
      showTestResult({ ...a3, proxyType: i3 }, { reCheck: () => checkProxy() });
      setTestResult(id, a3);
    }
    if (i3 === proxyTypes.resource) {
      await updateProxyModules({
        proxyList: [{ ...a3, id: r3.id, proxyType: i3 }],
        requestType: requestType.SpeedTest,
      });
    }
  } catch (error) {
    notify(-1, error.message);
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <div class="tt-tertiary text-3">{{ $t('已有代理 IP：') }}</div>
    <div class="flex-1 min-w-0 flex items-center gap-1.5">
      <Select
        v-model="selectedId"
        class="flex-1 min-w-0"
        :options="options"
        option-value="id"
        option-label="label"
        filter
        show-clear
        overlay-auto-width
        :filter-fields="[
          'searchText',
          'label',
          'lastCountry',
          'lastCity',
          'lastIp',
          'remark',
          'host',
          'protocol',
        ]"
        :filter-placeholder="$t('搜索地区 / IP / 备注')"
        :placeholder="$t('请选择已有代理 IP')"
        :empty-message="$t(loading ? '加载中...' : '暂无代理 IP')"
        overlay-class="proxy-picker-panel"
        scroll-height="20rem"
        @before-show="loadOptions"
      >
        <template #option="{ option }">
          <div class="w-90 min-w-0 flex flex-col gap-0.5">
            <div class="min-w-0 flex items-center gap-2">
              <Icon
                class="shrink-0"
                :name="option.icon"
                fallback="base/rx_ic_earth"
                color="var(--colors-icon-icon-inactive)"
                size="14"
              />
              <div class="min-w-0 ellipsis-1 tt-tertiary text-3 leading-4">
                {{ locationLabel(option) }}
              </div>
              <I18nText
                tag="div"
                class="mx-auto mr-0 shrink-0 tt-tertiary text-3 leading-4"
                :keypath="bindingKey()"
                scope="global"
              >
                <template #count
                  ><span :class="{ 'tt-brand': bindingCount(option) > 0 }">{{
                    bindingCount(option)
                  }}</span></template
                >
              </I18nText>
            </div>
            <div
              v-if="endpoint(option)"
              class="pl-5.5 ellipsis-1 tt-secondary text-3.5 leading-4.5 font-600"
            >
              {{ endpoint(option) }}
            </div>
            <div
              v-if="String(option.lastIp || '').trim()"
              class="pl-5.5 ellipsis-1 tt-tertiary text-3.25 leading-4.5 font-[JetBrains_Mono]"
            >
              {{ option.lastIp }}
            </div>
            <div
              v-if="remark(option)"
              class="pl-5.5 ellipsis-1 tt-tertiary text-3 leading-4"
            >
              {{ remark(option) }}
            </div>
          </div>
        </template>
        <template #footer><div class="pa-1"></div></template>
      </Select>
      <Button
        v-tooltip.top="$t('从当前可选的代理 IP 中随机选择 1 个代理 IP')"
        severity="secondary"
        variant="text"
        icon="base/rx_ic_shuffle"
        :loading="shuffling"
        @click="chooseRandom"
      />
      <Button
        severity="secondary"
        variant="outlined"
        icon="base/rx_ic_speed_test"
        :label="$t('测试代理 IP')"
        :loading="checking"
        @click="checkProxy"
      />
    </div>
  </div>
</template>

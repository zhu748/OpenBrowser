<script setup>
import { h, onBeforeMount, onBeforeUnmount, ref, toRaw, useTemplateRef, watch } from 'vue';
import { h as requests, mr as usePoller, nn as usePermission, o as cleanParams, r as mergeParams,
  sn as useLocale, v as useConfig, xr as isEmpty } from './utils-BIWenCnY.js';
import { a as storeToRefs, n as useNotice } from './agent-BmSFI9WH.js';
import { i as proxyRequest } from './permission-DOhNJfB3.js';
import { m as proxyType, n as listMode, o as testStatus, s as expiration } from './proxy-D7e36h-l.js';
import { b as useRouter, i as onWorkbenchEvent, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { c as runRowOperation, s as setRowOperation, t as Table } from './ry-table-do6kugym.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as vTooltip } from './tooltip-BYYKWrvu.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Divider } from './divider-BXJIHZjP.js';
import { t as FilterEmpty } from './custom-empty-CChX4pJt.js';
import { t as normalizeId } from './id-Bjy_bMW8.js';
import { m as Outbound, n as useProxyExport, s as canTest, t as useTests } from './hooks-Jw3GridD.js';
import { t as useSimplePopup } from './simplePopup-D6H7ykCr.js';
import { a as Search, i as RelatedRows, o as useDrawer, t as useProxyEditor } from './useProxyFormDrawer-r-7UykRS.js';
import { a as windowNumbers } from './quick-CZrtqSCy.js';
import { a as requestRows, i as rowOperations, n as defaultQuery, o as relatedWindows, r as tableSort,
  s as useColumns, t as proxySearchOptions } from './operation-zwm3okqF.js';
import { t as Empty } from './custom-new-empty-CLCRgYs2.js';
import { t as useProxySave } from './useProxyModuleCreate-DnWsQ0mq.js';
import { t as Remark } from './remark-cell-DMyo1A0X.js';
import { a as phoneNames, i as phoneIds, n as hasPhoneBindings, o as bindingContext, r as phoneCount } from './simple-zBOi42-i.js';
import { t as Filter } from './proxy-filter-Ct5F0LvB.js';
import { t as ProfileSelect } from './profile-select-Cn2Zq-u9.js';
import { r as loadBoundPhones } from './relatedPhones-BgFrJS53.js';
import { n as useProxyFilter, t as proxyFilterGroups } from './useProxyFilter-A8Qveof-.js';

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const drawer = useDrawer();
const { showProxyFormDrawer } = useProxyEditor(drawer);
const { updateProxyModules } = useProxySave();
const [showMessage, showStatus] = useNotice();
const config = useConfig();
const { userConfig } = storeToRefs(config);
const { getOfficialWebsite } = useLocale();
const { check } = usePermission();
const context = bindingContext();
const { columns } = useColumns({ storageKey: context.columnStorageKey, relatedColumnTitle: context.relatedColumn });
const { testProxy, batchTestShowToast, concurrentProxyTest } = useTests();
const { showSimpleDialog } = useSimplePopup();
const { downloadProxy } = useProxyExport();
const table = useTemplateRef('shoptable');
const searchOptions = proxySearchOptions();

const query = ref();
const isFiltered = ref(false);
const testableRows = ref([]);
const highlightedOrder = ref();
const testing = ref(false);
const checks = ref({});
const relatedPhones = ref({});
let highlightTimer;
let relatedRequest = 0;

const filter = useProxyFilter({
  multiple: true, onApply: () => refresh(),
  initialValues: route.query.expireStatus ? { proxyExpireStatus: Number(route.query.expireStatus) } : undefined,
  filterGroups: context.isCloudPhone ? proxyFilterGroups().map(group => group.key === 'proxyBindStatus' ? { ...group, label: context.relatedColumn } : group) : undefined,
});
const poller = usePoller({ intervalMs: 300000, checkOnce: async () => !userConfig.value.autoDetectProxy || (await testAll(true), false) });

function refresh(params = {}, firstPage = false) {
  const merged = { ...params, ...filter.getApiParams(), ...mergeParams(cleanParams(query.value)) };
  isFiltered.value = !isEmpty(merged);
  table.value?.refresh(merged, firstPage);
}
function search({ key, value } = {}) {
  refresh({ queryKey: value && (key || 'fuzzy'), queryValue: value }, true);
}

function cachedPhones(id) {
  const key = normalizeId(id);
  return key ? relatedPhones.value[key] ?? [] : [];
}
function related(row) {
  if (!context.isCloudPhone) return relatedWindows(row);
  const names = phoneNames(row);
  if (names.length) return names;
  const loadedNames = cachedPhones(row.id).map(phone => phone.name?.trim() || phone.serialNo?.trim() || '').filter(Boolean);
  if (loadedNames.length) return loadedNames;
  const count = phoneCount(row);
  return count ? [$t('{count} 个', { count })] : [];
}
function relatedPhoneIds(row) {
  const known = phoneIds(row);
  return known.length ? known : cachedPhones(row.id).map(phone => String(phone.id || '').trim()).filter(Boolean);
}
async function refreshPhoneBindings(rows) {
  const ticket = ++relatedRequest;
  const bound = rows.filter(hasPhoneBindings);
  if (!bound.length) {
    relatedPhones.value = {};
    return;
  }
  const bindings = await loadBoundPhones(bound.map(row => row.id));
  if (relatedRequest === ticket) relatedPhones.value = Object.fromEntries(bindings);
}
async function load(params) {
  const result = await requestRows({ ...filter.getApiParams(), type: listMode.List, ...params });
  const rows = result.data?.rows || [];
  testableRows.value = rows.filter(canTest);
  if (context.isCloudPhone) await refreshPhoneBindings(rows);
  return result;
}

function create() {
  config.mixpanelTrack('proxy_create_click');
  router.push({ name: 'agent-create' });
}
function edit(row) {
  showProxyFormDrawer({
    title: $t('编辑代理 IP'), data: row, showRemark: true, mode: 'proxy',
    onConfirm: async values => {
      if (!await updateProxyModules({ proxyList: [values] })) return false;
      refresh();
    },
  });
}
function remove(rows) {
  return new Promise(resolve => {
    confirm.require({
      header: $t('删除代理 IP'), message: $t('您确认要删除所选代理 IP 吗？'),
      rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
      acceptProps: { label: $t('确认'), severity: 'danger' },
      accept: async () => {
        try {
          const { code, msg } = await requests.proxy.userDelProxyModuleV2Create({ ids: rows.map(row => row.id) });
          showStatus(code, msg);
          if (code === 0) refresh();
          resolve(code === 0);
        } catch (error) {
          showStatus(-1, error.message);
          resolve(false);
        }
      },
      reject: () => resolve(false), onHide: () => resolve(false),
    });
  });
}
function refreshProxy(row) {
  const raw = toRaw(row);
  const count = context.isCloudPhone ? phoneCount(raw) ?? cachedPhones(raw.id).length : (raw.bindList ?? []).length;
  const accept = async () => {
    const success = await runRowOperation(raw, 'refresh', () => globalThis.electronAPI.send('proxy:refreshUrl', raw.refreshUrl));
    showMessage(success ? 0 : -1, raw.refreshUrl);
  };
  if (!count) return accept();
  confirm.require({
    header: $t('刷新代理 IP'), message: context.refreshConfirm(count),
    rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
    acceptProps: { label: $t('确认'), severity: 'danger' }, accept,
  });
}
function editRemark(row) {
  if (!check('Proxy_List_notes')) return;
  showSimpleDialog({
    title: $t('为所选代理 IP 添加备注'),
    inputs: [{ type: 'textarea', name: 'remark', value: row.remark, props: { placeholder: $t('请输入备注'), rows: 6 } }],
    onConfirm: async ({ remark }) => {
      const { code, msg } = await requests.proxy.userMdfProxyModuleCreate({ id: row.id, proxyRemark: remark });
      showStatus(code, msg);
      if (code === 0) refresh();
    },
  });
}
function dispatch(action, row) {
  const rows = [].concat(row);
  switch (action.name) {
    case 'edit': return edit(row);
    case 'refresh': return refreshProxy(row);
    case 'delete': return remove(rows);
    case 'test': return concurrentProxyTest(testOperations(rows));
    case 'download': return downloadProxy({ items: rows });
    case 'remark': return editRemark(row);
  }
}


async function testAll(silent = false) {
  if (!check('Proxy_List_speed_test')) return;
  if (!testableRows.value.length) {
    if (!silent) showStatus(-1, $t('暂无代理 IP'));
    return;
  }
  if (testing.value) return;
  testing.value = true;
  try {
    await concurrentProxyTest(testOperations(testableRows.value, silent));
    const data = table.value?.getDataList();
    const rows = data?.length ? data : testableRows.value;
    const failed = row => canTest(row) && (checks.value[row.id] ?? row.checkStatus) === testStatus.failure;
    const failures = rows.filter(failed);
    if (failures.length) {
      const sorted = [...failures, ...rows.filter(row => !failed(row))];
      table.value?.updateDataList(sorted);
      const index = new Map(sorted.map((row, position) => [row.id, position]));
      testableRows.value = [...testableRows.value].sort((a, b) => (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0));
    }
  } finally {
    testing.value = false;
  }
}

function testOperations(rows, silent = false) {
  const tasks = rows.map(row => {
    setRowOperation(row, 'test', true);
    return async () => {
      try {
        const result = await testProxy({ ...toRaw(row), apiCheck: row.proxyType === proxyType.buy, id: row.id });
        Object.assign(row, result);
        checks.value[row.id] = result.checkStatus;
        return { ...result, id: row.id, proxyType: row.proxyType };
      } finally {
        setRowOperation(row, 'test', false);
      }
    };
  });
  return {
    tasks,
    async tasksCompleted(results, cancelled) {
      results.forEach((result, index) => { if (result === undefined) setRowOperation(rows[index], 'test', false); });
      const completed = results.filter(Boolean);
      if (!cancelled && !silent) batchTestShowToast(completed, { reCheck: () => concurrentProxyTest(testOperations(rows, silent)) });
      if (context.isCloudPhone && !await savePhoneChecks(rows, completed) && !silent) showStatus(-1, $t('保存代理 IP 检测结果失败'));
      const saved = completed.filter(row => row.proxyType === proxyType.resource);
      if (saved.length) {
        if (silent) void requests.proxy.userBatchMdfProxyModuleCheckCreate({ proxyList: saved });
        else void updateProxyModules({ proxyList: saved, requestType: proxyRequest.SpeedTest });
      }
    },
  };
}

async function savePhoneChecks(rows, completed) {
  const byId = new Map(rows.map(row => [row.id, row]));
  const checksToSave = completed.flatMap(({ id, lastIp, lastCountry, lastCity, checkStatus, checkTime, timezone }) => {
    const original = byId.get(id);
    const ids = original ? relatedPhoneIds(original) : [];
    return ids.length ? [{ phoneIds: ids, proxyType: original.protocol, proxyServer: original.host, proxyPort: original.port,
      lastIp, lastCountry, lastCity, checkStatus, checkTime, timezone }] : [];
  });
  if (!checksToSave.length) return true;
  const { persistChecksForBoundPhones } = await import('./persistProxyCheck-GOErCdJb.js');
  return persistChecksForBoundPhones(checksToSave);
}

function canOpenIp(row) {
  return Boolean(row.lastIp && row.proxyExpireStatus !== expiration.expired);
}
function openIp(row) {
  if (canOpenIp(row)) window.open(getOfficialWebsite('/whoer?ip=' + row.lastIp), '_blank');
}
function rowClass(row) {
  return { 'row-success': row.orderNo === highlightedOrder.value };
}

function highlightOrder(number) {
  if (!number) return;
  clearTimeout(highlightTimer);
  highlightedOrder.value = number;
  highlightTimer = setTimeout(() => {
    highlightedOrder.value = '';
    const { orderNo, ...query } = route.query;
    router.replace({ name: 'agent-list', query });
  }, 3000);
}

async function bind(row) {
  if (context.isCloudPhone) {
    if (!row.id) return;
    const { default: PhoneSelect } = await import('./phone-select-DbsQ1A1T.js');
    drawer.showDrawer({
      title: context.selectTitle,
      slots: { container: () => h(PhoneSelect, {
        proxyId: row.id, onClose: () => drawer.hideDrawer(),
        onConfirm: () => { drawer.hideDrawer(); refresh(); },
      }) },
    });
    return;
  }
  drawer.showDrawer({
    title: context.selectTitle,
    slots: { container: () => h(ProfileSelect, {
      linkedWindowSortNums: windowNumbers(row.bindList), cacheKey: 'agent-profile-select',
      onClose: () => drawer.hideDrawer(),
      onConfirm: async windows => {
        if (!row.id) return;
        const { code, msg } = await requests.proxy.userMdfProxyBindWindowCreate({ proxyId: row.id, windowIds: windows.map(window => window.id) });
        showStatus(code, msg);
        if (code === 0) refresh();
      },
    }) },
  });
}

watch(() => route.query._t, timestamp => {
  if (!timestamp) return;
  const status = Number(route.query.expireStatus);
  if (route.query.expireStatus && filter.applied.value.proxyExpireStatus !== status) filter.setApplied({ proxyExpireStatus: status });
  refresh();
});
onBeforeMount(async () => {
  poller.check();
  query.value = await defaultQuery();
  highlightOrder(route.query.orderNo);
});
onWorkbenchEvent('updateShopList', order => { refresh(); highlightOrder(order); });
onBeforeUnmount(() => {
  relatedRequest++;
  poller.stop();
  clearTimeout(highlightTimer);
});
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <div class="flex flex-1 overflow-hidden">
      <Table ref="shoptable" v-model:columns="columns" lazy :cache-key="context.tableCacheKey" selection-mode="multiple" class="agent-shop-table"
        :table-request="load" :table-operation="rowOperations" removable-sort :table-sort="tableSort" :row-class="rowClass"
        :operation-handler="dispatch" :before-refresh="() => checks = {}" :virtual-scroller-options="{ itemSize: 60 }">
        <template #filter-after>
          <div class="w-full flex gap-1.5 items-start justify-between">
            <div class="flex items-center gap-2">
              <div class="relative"><div class="new-dot"></div></div>
              <Button v-if="check('Proxy_List_add')" size="xxs" icon="base/rx_ic_plus" variant="outlined" :label="$t('添加')" @click.stop="create" />
              <Divider layout="vertical" class="!ml-0 !mr-0 h-4" />
              <Filter :filter="filter" />
            </div>
            <div class="flex items-center gap-2">
              <Search :options="searchOptions" :search="search" :clear="search" />
              <Divider layout="vertical" class="!ml-0 !mr-0 h-4" />
              <Button v-if="check('Proxy_List_speed_test')" size="xxs" variant="outlined" severity="secondary" icon="base/rx_ic_speed_test"
                :label="$t('测试全部代理 IP')" :loading="testing" @click.stop="testAll()" />
              <Divider layout="vertical" class="!ml-0 !mr-0 h-4" />
            </div>
          </div>
        </template>
        <template #table-empty>
          <FilterEmpty v-if="isFiltered" icon="rx_illustration_filter.svg" :title="$t('暂无查询结果')" :desc="$t('当前条件下没有匹配的结果，请尝试更换其他筛选条件。')" />
          <Empty v-else icon="base/rx_ic_internet" img="empty-proxies.png" :title="$t('暂无代理 IP')" :desc="context.emptyBindDesc">
            <template #extra>
              <div class="flex gap-3">
                <Button v-if="check('Proxy_List_add')" outlined severity="secondary" size="xs" icon="base/rx_ic_plus" :label="$t('添加')" @click.stop="create" />
              </div>
            </template>
          </Empty>
        </template>
        <template #outbound="{ data }">
          <div class="flex items-center gap-2.5">
            <Outbound v-tooltip.top="{ value: canOpenIp(data) ? $t('点击查看 IP 地址详情') : '' }"
              :class="canOpenIp(data) ? 'cursor-pointer' : 'cursor-default'" :country="data.lastCountry" :city="data.lastCity" :last-ip="data.lastIp"
              :time="data.checkTime" :status="checks[data.id]" :badge-desc="data.badgeTypeDesc" :is-loading="data.loadingOperationMap?.test"
              :expire-status="data.proxyExpireStatus" @click.stop="openIp(data)" />
          </div>
        </template>
        <template #price><div> -- </div></template>
        <template #renew><div> -- </div></template>
        <template #providerType><div> -- </div></template>
        <template #remark="{ data, column: { _cache } }"><Remark :remark="data.remark" :extend="_cache.extend" @click.stop="editRemark(data)" /></template>
        <template #bindList="{ data }">
          <RelatedRows :list="related(data)" :show-add="check('Profiles_select_proxy')" :add-tooltip="context.selectTooltip" @add="bind(data)" />
        </template>
      </Table>
    </div>
  </div>
</template>

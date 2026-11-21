<script setup>
import { computed, ref, toRaw, useTemplateRef } from './workbench-vue.js';
import { ar as runLimited, h as api } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { m as Proxy, n as Usage, o as Check } from './proxy-D7e36h-l.js';
import { o as OperationButtons, r as ReloadButton, s as setLoading, t as Table } from './ry-table-do6kugym.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as Empty } from './custom-empty-CChX4pJt.js';
import { a as hasEndpoint, m as OutboundIp, o as isDeploying, t as useProxyChecks } from './hooks-Jw3GridD.js';
import { a as Search, i as BoundEntities } from './useProxyFormDrawer-r-7UykRS.js';
import { t as SelectButton } from './rx-select-button-DQtmZ0kT.js';
import { a as requestRows, i as operations, o as listBoundWindows, s as useColumns, t as searchFields } from './operation-zwm3okqF.js';
import { t as NumberInput } from './rx-input-number-EcSY6ALQ.js';
import { t as Remark } from './remark-cell-DMyo1A0X.js';
import { a as phoneNames, o as bindingContext, r as phoneCount } from './simple-zBOi42-i.js';

const props = defineProps({ data: {}, isBatch: Boolean, syncCheckToModule: { type: Boolean, default: true }, onConfirm: Function });
const total = defineModel('total');
const data = toRaw(props.data);
const selected = ref(props.isBatch ? (Array.isArray(data) ? data : []) : data?.id && String(data.id) !== '0' ? data : undefined);
const context = bindingContext();
const { columns } = useColumns({
  inserts: props.isBatch ? [[5, { title: $t('关联窗口数量'), slot: 'bounded' }]] : [],
  filters: ['proxy', 'ipChecker', 'proxyProviderPrice', 'autoRenew'],
  storageKey: context.isCloudPhone ? 'cloud_phone_proxy_quick_display_v1' : 'proxy_quick_display_v1', relatedColumnTitle: context.relatedColumn,
});
const { testProxy, batchTestShowToast } = useProxyChecks();
const [notice, notify] = useFeedback();
const table = useTemplateRef('agent');
const searchOptions = searchFields();
const importFilter = ref();
const filterOptions = computed(() => [{ name: $t('全部'), value: undefined }, { name: $t('导入'), value: String(Proxy.resource) }]);
const rows = ref([]);
const query = ref({});
const refreshing = ref(false);
const saving = ref(false);
const selectionCount = computed(() => props.isBatch ? selected.value.length : Number(Boolean(selected.value)));
const pending = new Set();
function refresh(params = query.value, firstPage = false) {
  query.value = params;
  return table.value?.refresh(params, firstPage);
}
async function reload() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await refresh();
  } finally {
    refreshing.value = false;
  }
}
function search({ key, value } = {}) {
  refresh({ queryKey: value && (key || 'fuzzy'), queryValue: value }, true);
}
async function load(params) {
  const response = await requestRows({ ...(importFilter.value && { proxyType: importFilter.value }), ...params, type: Usage.UseDeploy });
  if (response.code !== 0) return response;
  let items = response.data.rows;
  if (props.isBatch) {
    const current = new Map(selected.value.map(row => [String(row.id), row]));
    items = items.map(row => ({ ...row, _proxyCount: current.get(String(row.id))?._proxyCount ?? 1 }));
  } else if (selected.value?.id != null) {
    const match = items.find(row => String(row.id) === String(selected.value.id));
    if (match) selected.value = match;
  }
  rows.value = items;
  total.value = response.data.total;
  return { ...response, data: { ...response.data, rows: items } };
}
function bindList(row) {
  if (!context.isCloudPhone) return listBoundWindows(row);
  const names = phoneNames(row);
  const count = phoneCount(row);
  return names.length ? names : count ? [$t('{count} 个', { count })] : [];
}
function selectedRow(row) {
  return props.isBatch && selected.value.some(item => String(item.id) === String(row.id));
}
function testActions(row) {
  return operations(row).filter(operation => operation.name === 'test');
}
async function checkRows(candidates, { apiCheck = true, retry = true } = {}) {
  const items = candidates.filter(row => !pending.has(row.id));
  if (!items.length) return;
  for (const row of items) {
    pending.add(row.id);
    setLoading(row, 'test', true);
  }
  try {
    const tests = items.map(row => async () => {
      let result;
      try {
        result = await testProxy({ ...toRaw(row), apiCheck: apiCheck && row.proxyType === Proxy.buy,
          persistProxyCheck: props.syncCheckToModule });
      } catch (error) {
        result = { checkStatus: Check.failure, error };
      }
      if (!result.stale) Object.assign(row, result, { _checkRes: result });
      return { ...result, id: row.id, proxyType: row.proxyType };
    });
    const results = await runLimited(tests, 5);
    batchTestShowToast(results, { reCheck: retry ? () => checkRows(items, { apiCheck, retry }) : undefined });
  } finally {
    for (const row of items) {
      pending.delete(row.id);
      setLoading(row, 'test', false);
    }
  }
}
function checkAll() {
  if (!rows.value.length) return notify(-1, $t('暂无代理 IP'));
  return checkRows(rows.value);
}
async function isReady(row) {
  if (!isDeploying(row.orderStatus)) return true;
  if (!row.id) return false;
  const { code, data } = await api.proxy.userGetProxyDetailMergedList({ id: String(row.id) });
  if (code !== 0 || !data) return false;
  Object.assign(row, data, { id: row.id, loadingOperationMap: row.loadingOperationMap });
  return !isDeploying(row.orderStatus) && hasEndpoint(row);
}
async function save() {
  if (!selectionCount.value || saving.value) return;
  saving.value = true;
  try {
    const items = [].concat(selected.value);
    const ready = [];
    for (const item of items) if (await isReady(item)) ready.push(item);
    if (items.length !== ready.length) {
      notice(0, $t('当前代理 IP 还在部署中，暂时无法使用。建议更换其它可用的代理 IP 或稍后重新测试当前代理 IP。'));
      return;
    }
    await checkRows(ready, { apiCheck: false, retry: false });
    const result = items.map(({ loadingOperationMap: _loading, _disabled, ...row }) => toRaw(row));
    await props.onConfirm?.(props.isBatch ? result : result[0]);
  } catch (error) {
    notify(-1, error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col h-full w-full px-4 pt-4 pb-0 proxy-content">
    <div class="flex flex-wrap gap-1.5 items-center justify-between proxy-header">
      <div class="flex items-center gap-1.5 flex-wrap">
        <Search :options="searchOptions" :search="search" :clear="search" />
        <SelectButton v-model="importFilter" :options="filterOptions" size="sm" option-label="name" option-value="value" data-key="value"
          @change="refresh(query, true)" />
      </div>
      <div class="flex items-center gap-1.5 flex-wrap">
        <Button outlined severity="secondary" size="xxs" icon="base/rx_ic_speed_test" :label="$t('测试全部')" @click.stop="checkAll" />
        <ReloadButton :loading="refreshing" @click="reload" />
      </div>
    </div>
    <Alert :visible="isBatch" class="w-full proxy-alert" type="info" :title="$t('已选择 {count} 条代理 IP', { count: selectionCount })" :closable="false" />
    <div class="flex-ovh-1">
      <Table ref="agent" v-model:selection="selected" v-model:columns="columns" cache-key="proxy-quick-list" :table-request="load"
        :selection-mode="isBatch ? 'multiple' : 'single'" :clear-selection-on-request="false" :show-display="false" :show-gridlines="false"
        :context-menu="false" :multiple-operation="false" :virtual-scroller-options="{ itemSize: 60 }" :show-table-header="false">
        <template #table-empty><Empty icon="rx_illustration_star.svg" :title="$t('暂无代理 IP')" /></template>
        <template #outbound="{ data: row }">
          <OutboundIp class="select-none" :country="row.lastCountry" :city="row.lastCity" :last-ip="row.lastIp" :time="row.checkTime"
            :status="row.checkStatus" :badge-desc="row.badgeTypeDesc" :is-loading="row.loadingOperationMap?.test" :expire-status="row.proxyExpireStatus" />
        </template>
        <template #remark="{ data: row, column }"><Remark :remark="row.remark" :extend="column._cache.extend" /></template>
        <template #bounded="{ data: row }">
          <div class="bounded" @click.stop><NumberInput v-model="row._proxyCount" :disabled="!selectedRow(row)" :min="1" :step="1" /></div>
        </template>
        <template #bindList="{ data: row }"><BoundEntities :list="bindList(row)" /></template>
        <template #actions="{ data: row }">
          <OperationButtons :operation="testActions(row)" :loading-operation-map="row.loadingOperationMap" :show-menu="false" @quick-click="checkRows([row])" />
        </template>
      </Table>
    </div>
    <div class="w-full flex justify-end gap-3 button-group">
      <Button :label="saving ? $t('检测中...') : $t('保存')" :disabled="!selectionCount || saving" @click.stop="save" />
    </div>
  </div>
</template>

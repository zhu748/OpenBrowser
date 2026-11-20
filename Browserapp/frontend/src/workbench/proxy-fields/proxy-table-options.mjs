import { h, onBeforeMount } from './workbench-vue.js';
import { h as api, jr as orderDirection, m as loadDictionary, mt as useWorkspace, nn as usePermissions, v as useUser } from './utils-BIWenCnY.js';
import { a as storeToRefs } from './agent-BmSFI9WH.js';
import { l as orderStatus, m as proxyType, s as expiryStatus } from './proxy-D7e36h-l.js';
import { n as workspaceTitle } from './workspace-CNvgSgaH.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { b as blocksExport, s as canTestProxy } from './hooks-Jw3GridD.js';
import { n as configureColumns, r as useColumnPreferences } from './useProxyFormDrawer-r-7UykRS.js';
import { t as Tag } from './rx-tag-BIY_xUFU.js';
import ProxyBasicInfo from './workbench-proxy-basic-info.js';
import ProxyRemarkHeader from './workbench-proxy-remark-header.js';

const { check } = usePermissions();
const localType = row => row.proxyType === proxyType.resource;
const expired = row => row.proxyExpireStatus === expiryStatus.expired;
const blocked = row => expired(row) || row.orderStatus === orderStatus.pending || row.orderStatus === orderStatus.refunded;
const showOnly = { render: () => null };
export { showOnly as c, showOnly as l };

function relatedWindows(row) {
  const workspace = workspaceTitle(useWorkspace().currentWorkspace?.workspaceName);
  return (row.bindList ?? []).map(number => `${workspace}-${number}`);
}
function proxyColumns(options) {
  return configureColumns([
    { title: $t('出口 IP'), key: 'lastCountry', sortable: true, slot: 'outbound' },
    { title: $t('代理 IP 信息'), key: 'proxy', render: ({ data }) => h(ProxyBasicInfo, { data }) },
    { title: $t('备注'), key: 'proxyRemark', headerSlot: 'remarkHeader', headerRender: ({ column }) => h(ProxyRemarkHeader, { column }),
      slot: 'remark', _cache: { extend: true } },
    { title: options?.relatedColumnTitle ?? $t('已关联窗口'), key: 'bindList', slot: 'bindList', style: { minWidth: '120px' } },
    { title: $t('IP 用途'), key: 'businessUse' },
    { title: $t('IP 查询渠道'), key: 'ipChecker', render: ({ data }) => h(Tag, {
      tooltip: $t('为保障测试结果统一，暂时仅支持官方指定的测试渠道。'), icon: 'base/rx_ic_network', label: data.checkChannelValue, disabled: true,
    }) },
    { title: $t('来源'), key: 'proxyType', sortable: true, getText: row => row.proxyType === proxyType.buy ? $t('购买') : $t('添加') },
    { title: $t('代理 IP 类型'), key: 'providerType', slot: 'providerType', _visible: false },
    { title: $t('创建时间'), key: 'createTime', _visible: false, sortable: true,
      getText: row => row.createTime ? formatDate(row.createTime, 'yyyy-MM-dd') : '--' },
    { title: $t('服务商'), key: 'proxyProviderName', _visible: false, sortable: true,
      getText: row => row.proxyType === proxyType.buy ? row.proxyProviderName || $t('官方赠送') : '--' },
  ], options);
}
function useColumns({ storageKey = 'proxy_display_v1', ...options } = {}) {
  const { userConfig } = storeToRefs(useUser());
  const { columns, updateColumns } = useColumnPreferences({ key: storageKey, data: proxyColumns(options) });
  onBeforeMount(() => updateColumns(items => {
    const column = items.find(item => item.key === 'proxyRemark');
    if (column?._cache) column._cache.extend = userConfig.value.remarkDisplayStatus;
  }));
  return { columns };
}
function rowOperations(selection) {
  const rows = [].concat(selection ?? []);
  const notLocal = !rows.every(localType);
  const unavailable = rows.some(blocked);
  const gift = rows.some(row => !row.proxyProviderId && !row.renewalTime && row.proxyType === proxyType.buy);
  const direct = rows.some(row => row.isDirect);
  const refresh = rows.every(row => Boolean(row.refreshUrl));
  return [
    { name: 'edit', label: $t('编辑'), icon: 'base/rx_ic_edit', power: check('Proxy_List_edit'), tooltip: $t('编辑'), disabled: notLocal },
    { name: 'test', label: $t('测试代理 IP'), icon: 'base/rx_ic_speed_test', tooltip: $t('测试代理 IP'),
      disabled: !rows.every(canTestProxy), power: check('Proxy_List_speed_test'), quick: true, multiple: true,
      multipleProps: { name: 'G1', showLabel: true } },
    { name: 'refresh', label: $t('刷新动态 IP'), icon: 'base/rx_ic_refresh', power: check('Proxy_List_refresh_proxy'),
      tooltip: $t('刷新动态 IP'), disabled: unavailable || gift || direct || !refresh,
      disabledTooltip: refresh ? undefined : $t('未配置动态代理 IP 刷新 URL') },
    { name: 'download', label: $t('下载'), icon: 'base/rx_ic_download', tooltip: $t('下载'),
      power: check('Proxy_Store_download_proxy_info'), disabled: unavailable || gift || direct || rows.some(blocksExport), multiple: true,
      multipleProps: { name: 'G2', showLabel: true, disabledTooltip: gift ? $t('官方赠送的代理 IP 无法下载') : undefined } },
    { name: 'remark', label: $t('添加备注'), icon: 'base/rx_ic_doc_add', power: check('Proxy_List_notes') },
    { separator: true, power: check('Proxy_List_delete') },
    { name: 'delete', label: $t('删除'), icon: 'base/rx_ic_bin_1', power: check('Proxy_List_delete'),
      tooltip: $t('删除'), disabled: notLocal && !rows.some(expired), multiple: true,
      multipleProps: { name: 'G4', showLabel: true, disabledTooltip: $t('已购买代理 IP 无法进行此操作') } },
  ];
}
function requestRows(query) { return api.proxy.userGetProxyListMergedList(query); }
async function filters() {
  const [dictionary, countries, providers] = await Promise.all([
    loadDictionary(), api.proxy.userGetProxyAllCountriesList({}), api.proxy.userGetProxyProvidersTypeList(),
  ]);
  const values = filter => filter.value?.map(item => item.value);
  return [
    { type: 'Checkbox', label: $t('国家/地区'), name: 'proxyLastCountry', search: true, searchPlaceholder: $t('搜索国家/地区'),
      searchKeys: ['alias'], getOptions: () => (countries.data ?? []).map(({ value, label }) => ({
        parentName: 'proxyLastCountry', value, label, alias: label + '/' + value,
      })), formatValue: values },
    { type: 'Checkbox', label: $t('代理 IP 类型'), name: 'proxyProtocol', getOptions: () =>
      (dictionary.protocol ?? []).map(({ label, value }) => ({ parentName: 'proxyProtocol', label, value })), formatValue: values },
    { type: 'text', label: $t('代理 IP 主机'), name: 'proxyHost' },
    { type: 'text', label: $t('备注'), name: 'proxyRemark' },
    { type: 'Checkbox', label: $t('服务商'), name: 'proxyProvider', getOptions: () =>
      ['PrivateProxy', 'RoxyBrowser'].map(value => ({ parentName: 'proxyProvider', label: value, value })), formatValue: values },
    { type: 'switchGroup', name: 'providerType', label: $t('供应商类型'),
      options: (providers.data ?? []).map(value => ({ label: value, value, text: value })) },
  ];
}
async function tableSort({ getColumnState = useColumns } = {}) {
  const columns = getColumnState().columns.value;
  const { data } = await api.proxy.userGetProxyTableSortOrderList();
  function valid(field) { return field && columns.some(column => column.key === field && column.sortable); }
  return {
    data: { sortField: valid(data?.orderName) ? data.orderName : undefined, sortOrder: orderDirection(data?.orderType ?? 'desc') },
    onChange({ sortField, sortOrder }) {
      return api.proxy.userSaveProxyTableSortOrderCreate(valid(sortField) ? { orderName: sortField, orderType: orderDirection(sortOrder) } : {});
    },
  };
}
function searchOptions() {
  return [
    { key: 'proxyHost', label: $t('代理 IP'), icon: 'base/rx_ic_internet', syntax: 'host::' },
    { key: 'proxyLastCountry', label: $t('国家/地区'), icon: 'base/rx_ic_earth', syntax: 'region::' },
    { key: 'username', label: $t('代理 IP 用户名'), icon: 'base/rx_ic_user_sm', syntax: 'name::' },
    { key: 'proxyRemark', label: $t('备注'), icon: 'base/rx_ic_doc_article', syntax: 'note::' },
    { key: 'proxyProvider', label: $t('服务商'), icon: 'base/rx_ic_browser_proxy', syntax: 'provider::' },
  ];
}
export {
  requestRows as a, rowOperations as i, filters as n, relatedWindows as o,
  tableSort as r, useColumns as s, searchOptions as t,
};

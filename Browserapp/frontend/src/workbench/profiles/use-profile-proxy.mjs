import { computed, ref, toRaw } from './workbench-vue.js';
import { h as api, nn as usePermissions } from './utils-BIWenCnY.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { n as permissions } from './permission-DOhNJfB3.js';
import { m as proxyTypes, o as checkStatus } from './proxy-D7e36h-l.js';
import { s as setLoading } from './ry-table-do6kugym.js';
import { n as useConfirm } from './useconfirm-CV4GTWBW.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { c as readOrderStatus, o as isDeploying, s as canTest, t as useProxyTest } from './hooks-Jw3GridD.js';

const windowStatus = Object.freeze({ opened: 1, closed: 0, 1: 'opened', 0: 'closed' });
const operation = Object.freeze({ ProxySelect: 'proxy_select', ProxyAdd: 'proxy_add', ProxyDelete: 'proxy_delete',
  PlatformAdd: 'platform_add', PlatformSelect: 'platform_select', PlatformEdit: 'platform_edit', CookieEdit: 'cookie_edit' });
const proxyDrawerKey = Symbol('proxyBuyAddDrawer');
const historyFields = [['lastIp', 'beforeIp'], ['lastCity', 'beforeCity'], ['lastCountry', 'beforeCountry'], ['checkTime', 'beforeTime']];
const endpointFields = ['host', 'ipType', 'port', 'proxyPassword', 'proxyUserName', 'refreshUrl'];
const checkFields = ['checkStatus', 'lastIp', 'lastCity', 'lastCountry', 'timezone', 'checkTime'];
const transportFields = ['proxyRules', 'proxyCategory', 'checkChannel', 'protocol'];
const profileProxyFields = ['moduleId', 'proxyMethod', ...checkFields, ...endpointFields, ...transportFields,
  'country', 'proxyNetwork', 'buyProxyType', 'isDirect', 'isEncryptProxy', 'proxyEncryptInfo'];
const accountFields = ['id', '_tempId', 'platformEfa', 'platformName', 'platformIcon', 'platformIconDark', 'platformPassword',
  'platformUrl', 'platformUserName', 'platformRemarks'];

const pick = (value, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]));
const present = value => typeof value === 'string' ? Boolean(value.trim()) : value != null;
function lastKnownCountry(profile) {
  if (profile._checkRes?.checkStatus !== checkStatus.failure) return;
  const value = profile.beforeProxyInfo?.beforeCountry;
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}
function updateProxy(profile, changes, { replaceProxy = true } = {}) {
  const previous = profile.beforeProxyInfo ?? {};
  const usePrevious = !present(profile.lastIp) && !present(profile.lastCountry) && (present(previous.beforeCountry) || present(previous.beforeIp));
  const history = {};
  for (const [field, prior] of historyFields) {
    if (Object.hasOwn(changes, field)) history[prior] = usePrevious && present(previous[prior]) ? previous[prior] : profile[field];
  }
  profile.beforeProxyInfo = history;
  Object.assign(profile, pick(changes, profileProxyFields));
  if (replaceProxy && !changes.isEncryptProxy) {
    delete profile.isEncryptProxy;
    delete profile.proxyEncryptInfo;
  }
}
function updateAccounts(profile, accounts, field = 'windowPlatformList') {
  profile[field] = accounts.map(account => pick(account, accountFields));
}
function proxyCheckFromNetwork(result) {
  if (!result?.ip) return null;
  const { ip, city = '', country_code: country = '', timezone = '' } = result;
  return { lastIp: ip, lastCity: city ?? '', lastCountry: country ?? '', timezone: timezone ?? '',
    checkStatus: checkStatus.success, checkTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss') };
}
function exportProxyFields(proxy) {
  return { ...Object.fromEntries([...checkFields, ...endpointFields, ...transportFields].map(key => [key, proxy[key]])),
    port: proxy.port == null ? undefined : String(proxy.port), proxyCategory: proxy.proxyCategory || proxy.protocol };
}
const customProxyRows = rows => rows.map(row => ({ ...exportProxyFields(row), moduleId: 0, proxyMethod: 'custom' }));
function selectedProxyRows(rows) {
  return rows.flatMap(({ _proxyCount, ...row }) => {
    const proxy = { ...exportProxyFields(row), moduleId: row.id ?? 0, proxyMethod: 'choose' };
    return Array.from({ length: Math.max(1, Number(_proxyCount) || 1) }, () => ({ ...proxy }));
  });
}
function useProxyData() {
  const dialog = useConfirm();
  const [, notify] = useToast();
  function buildProxyData(profile) {
    const fields = [...endpointFields, 'protocol', 'proxyCategory', 'checkChannel', 'lastCountry', 'buyProxyType'];
    return { id: profile.moduleId, ...Object.fromEntries(fields.map(field => [field, profile[field]])) };
  }
  function confirmDeleteProxy(selection) {
    const profiles = [].concat(selection);
    const ids = profiles.map(profile => profile.id);
    const { promise, reject, resolve } = Promise.withResolvers();
    dialog.require({ header: $t('删除代理 IP'), message: $t('您确认要删除代理 IP 吗？'),
      rejectProps: { label: $t('取消'), severity: 'secondary', outlined: true },
      acceptProps: { label: $t('确认'), severity: 'danger' },
      async accept() {
        try {
          const { code, msg } = await api.window.userMdfWindowDataBatchCreate({ ids, type: operation.ProxyDelete, requestType: permissions.DeleteProxy });
          notify(code, msg);
          if (code === 0) for (const profile of profiles) {
            updateProxy(profile, { ...Object.fromEntries(endpointFields.map(field => [field, ''])), moduleId: 0, proxyCategory: 'noproxy',
              proxyMethod: 'custom', buyProxyType: proxyTypes.resource, checkStatus: checkStatus.none, ...(!profile.openTime && { lastIp: '' }) });
          }
          resolve();
        } catch (error) {
          notify(-1, error.message);
          reject(error);
        }
      }, reject, onHide: reject,
    });
    return promise;
  }
  return { buildProxyData, confirmDeleteProxy };
}
function useProxyAddDrawer() {
  const { check } = usePermissions();
  const showAdd = computed(() => check('Profiles_add_proxy_outside'));
  const visible = ref(false);
  let callbacks;
  function openProxyBuyAddDrawer(options = {}) {
    if (!showAdd.value) return;
    callbacks = options;
    visible.value = true;
  }
  function closeProxyBuyAddDrawer() { visible.value = false; }
  async function onProxyBuyAddAddConfirm(value) {
    try { await callbacks?.onAddConfirm?.(value); }
    finally { closeProxyBuyAddDrawer(); }
  }
  return { visible, showAdd, showBuy: computed(() => false), provider: computed(() => undefined),
    openProxyBuyAddDrawer, closeProxyBuyAddDrawer, onProxyBuyAddBuySuccess: closeProxyBuyAddDrawer, onProxyBuyAddAddConfirm };
}
function legacyPurchaseAdapter() { return { async purchaseImmediateOfficialProxy() {} }; }

const isPending = row => isDeploying(readOrderStatus(row));
async function refreshPending(profiles) {
  const groups = new Map();
  for (const row of profiles) if (isPending(row) && row.moduleId) {
    const id = String(row.moduleId);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  await Promise.all([...groups].map(async ([id, rows]) => {
    try {
      const { code, data } = await api.proxy.userGetProxyDetailMergedList({ id });
      if (code !== 0 || !data || isDeploying(data.orderStatus)) return;
      const protocol = data.protocol || data.proxyCategory;
      const fields = [...endpointFields, 'checkChannel', 'lastIp', 'lastCountry', 'lastCity'];
      const updates = Object.fromEntries(fields.filter(field => present(data[field])).map(field => [field, data[field]]));
      if (protocol) Object.assign(updates, { protocol, proxyCategory: protocol });
      if (data.proxyType != null) updates.buyProxyType = data.proxyType;
      if (data.isDirect != null) updates.isDirect = data.isDirect;
      if (data.isEncryptProxy != null) updates.isEncryptProxy = data.isEncryptProxy;
      if (data.proxyEncryptInfo) updates.proxyEncryptInfo = data.proxyEncryptInfo;
      for (const row of rows) {
        updateProxy(row, updates, { replaceProxy: false });
        row.proxyOrderStatus = data.orderStatus;
        if (data.proxyExpireStatus != null) row.proxyExpireStatus = data.proxyExpireStatus;
      }
    } catch (error) { console.error('[Profile:proxy] refresh deploying proxy failed', error); }
  }));
}
const pendingFailure = () => ({ loading: false, checkStatus: checkStatus.failure,
  error: $t('代理 IP 正在配置中，暂时无法使用。请选择其他代理 IP，或稍后重新测试。'), lastIp: '', lastCity: '', lastCountry: '', timezone: '' });
async function persistChecks(results, notify) {
  const modules = new Map();
  const profiles = [];
  for (const { item, checkRes } of results) {
    if (item.moduleId && item.buyProxyType === proxyTypes.resource && !modules.has(item.moduleId)) {
      modules.set(item.moduleId, { id: item.moduleId, ...checkRes });
    }
    if (checkRes.checkStatus !== checkStatus.none) profiles.push({ id: item.id, dirId: item.dirId, ...checkRes });
  }
  if (modules.size) await api.proxy.userMdfProxyModuleCreate({ proxyList: [...modules.values()], requestType: permissions.SpeedTest });
  if (profiles.length) {
    const { code, msg } = await api.window.userMdfWindowProxyCheckBatchCreate({ proxyList: profiles, requestType: permissions.SpeedTest });
    notify?.(code, msg);
  }
}
function useProxySpeedTest() {
  const { testProxy, batchTestShowToast, concurrentProxyTest } = useProxyTest();
  const [, notify] = useToast();
  let active = false;
  async function runProxySpeedTestForRows(rows, options = {}) {
    if (!rows.length || active) return;
    const { operationName = 'checkProxy', showConcurrentTaskTopBar = false, silent = false } = options;
    active = true;
    for (const row of rows) setLoading(row, operationName, true);
    try {
      const pending = new Set(rows.filter(isPending));
      await refreshPending(rows);
      const tasks = rows.map(row => async () => {
        try {
          delete row._checkRes;
          if (isPending(row)) return { checkRes: pendingFailure(), skipPersist: true };
          if (pending.has(row) && !canTest(row)) return;
          const result = await testProxy(toRaw(row));
          updateProxy(row, result, { replaceProxy: false });
          row._checkRes = toRaw(result);
          return { item: row, checkRes: result };
        } catch (error) {
          return { checkRes: { error: error?.message || String(error) }, skipPersist: true };
        } finally { setLoading(row, operationName, false); }
      });
      await concurrentProxyTest({ tasks, showConcurrentTaskTopBar, async tasksCompleted(results, aborted) {
        const outcomes = results.filter(result => result?.checkRes);
        const detected = outcomes.filter(result => !result.skipPersist);
        if (!aborted && !silent) {
          const incomplete = outcomes.find(result => result.skipPersist);
          if (incomplete) notify(-1, incomplete.checkRes.error);
          if (detected.length) batchTestShowToast(detected.map(({ item, checkRes }) => ({ ...checkRes, proxyType: item.buyProxyType })),
            { reCheck: () => runProxySpeedTestForRows(rows, options) });
        }
        await persistChecks(detected, silent ? undefined : notify);
      } });
    } catch (error) { if (!silent) notify(-1, error.message); }
    finally {
      active = false;
      for (const row of rows) setLoading(row, operationName, false);
    }
  }
  return { runProxySpeedTestForRows };
}

export { useProxySpeedTest as a, proxyCheckFromNetwork as c, updateProxy as d, operation as f, useProxyData as i,
  lastKnownCountry as l, selectedProxyRows as n, useProxyAddDrawer as o, windowStatus as p, customProxyRows as r,
  legacyPurchaseAdapter as s, proxyDrawerKey as t, updateAccounts as u };

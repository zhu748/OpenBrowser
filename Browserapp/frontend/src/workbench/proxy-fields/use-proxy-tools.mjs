import { computed, getCurrentInstance, h, onBeforeUnmount, reactive, ref, watch } from './workbench-vue.js';
import { a as render } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { Ar as addSuffix, Tt as isDevice, ar as runLimited, cr as clone, tr as decryptProxy } from './utils-BIWenCnY.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { i as defineStore, n as useFeedback } from './agent-BmSFI9WH.js';
import { l as Order, m as Proxy, o as Check, s as Expiry } from './proxy-D7e36h-l.js';
import { b as useRouter, y as useRoute } from './rich-html-link-VdBpR3Cm.js';
import { t as Button } from './rx-button-DyzuUt-V.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { t as proxyLabels } from './proxy-shop-labels-nJaBS4W_.js';
import ProxyTestProgress from './workbench-proxy-test-progress.js';
export { default as m } from './workbench-proxy-outbound.js';

const useNetworkStore = defineStore('network', () => {
  const current = ref();
  return { info: computed(() => current.value), async setNetworkInfo(info) { current.value = info; } };
});
const absent = value => !value || value === '--';
const preferred = (first, fallback) => absent(first) ? (absent(fallback) ? undefined : fallback) : first;
function isDirectWithoutCredentials(row) {
  return Boolean(row.isDirect && !(row.isEncryptProxy && row.proxyEncryptInfo));
}
function wasPurchased(row) {
  return row.proxyType === Proxy.buy;
}
function canUseCredentials(row) {
  return !isDirectWithoutCredentials(row) && Boolean((!absent(row.proxyUserName) && !absent(row.proxyPassword)) ||
    (row.isEncryptProxy && row.proxyEncryptInfo) || (wasPurchased(row) && row.proxyUserName === '--' && row.proxyPassword === '--'));
}
function exportRestriction(locale, owner) {
  return locale === 'zh-CN' ? owner ? 'owner' : 'member' : 'support';
}
function exportRestrictionMessage(locale, owner) {
  const restriction = exportRestriction(locale, owner);
  const labels = proxyLabels(isDevice());
  if (restriction === 'member') return labels.exportRequiresKycDescMember;
  if (restriction === 'owner') return labels.exportRequiresKycDesc;
  return $t('当前无法直接下载，请联系 Roxy AI 技术支持人工审核并开通权限');
}
async function getProxySecrets(proxy) {
  const details = proxy.isEncryptProxy && proxy.proxyEncryptInfo ? await decryptProxy(proxy.proxyEncryptInfo) : {};
  return { host: preferred(details.host, proxy.host), port: preferred(details.port, proxy.port),
    username: preferred(details.proxyUserName ?? details.username, proxy.proxyUserName), password: preferred(details.proxyPassword ?? details.password, proxy.proxyPassword) };
}
const orderStatus = row => row.proxyOrderStatus ?? row.orderStatus;
const isDeploying = state => state === Order.pending || state === '0';
const hasEndpoint = row => Boolean((row.isEncryptProxy && row.proxyEncryptInfo) || (!absent(String(row.host ?? '').trim()) && !absent(String(row.port ?? '').trim())));
function canTest(row) {
  const status = orderStatus(row);
  return !isDeploying(status) && status !== Order.refunded && status !== '4' && (row.proxyExpireStatus !== Expiry.expired || (row.proxyType ?? row.buyProxyType) === Proxy.resource);
}
function wasBlockedByNetwork(message) {
  return message === $t('网络不通停止打开');
}
function isEndpointFailure(message) {
  return [$t('代理 IP 检测失败'), $t('设备检测失败'), $t('无法连接至代理 IP，请检查您当前的网络环境并重试。'),
    $t('无法连接至设备，请检查您当前的网络环境并重试。')].includes(message);
}

function useProgressBanner() {
  const context = getCurrentInstance()?.appContext;
  const counters = reactive({ completed: 0, total: 0 });
  let host;
  function show(total) {
    Object.assign(counters, { completed: 0, total });
    host = document.createElement('div');
    document.body.append(host);
    const node = h(() => h(ProxyTestProgress, { ...counters }));
    node.appContext = context;
    render(node, host);
  }
  function close() {
    if (!host) return;
    render(null, host);
    host.remove();
    host = undefined;
  }
  onBeforeUnmount(close);
  return { show, close, update: values => Object.assign(counters, values) };
}
function useProxyTests() {
  const [notify] = useFeedback();
  const banner = useProgressBanner();
  let active;
  let disposed = false;
  onBeforeUnmount(() => {
    disposed = true;
    active?.abort();
  });
  async function testProxy({ isEncryptProxy, proxyEncryptInfo, apiCheck, id, persistProxyCheck = true, ...configuration }) {
    const options = clone(configuration);
    if (!options.moduleId && apiCheck && id) options.moduleId = id;
    if (!persistProxyCheck) options.persist = false;
    if (isEncryptProxy && proxyEncryptInfo) Object.assign(options, await decryptProxy(proxyEncryptInfo));
    const protocol = String(options.proxyCategory || options.protocol || '').trim().toLowerCase();
    const result = { loading: false, checkStatus: Check.failure, lastIp: '', lastCity: '', lastCountry: '', timezone: '' };
    if (!options.moduleId && protocol && protocol !== 'noproxy' && !hasEndpoint(options)) {
      return { ...result, error: translate('代理 IP 检测失败，请检查相关配置。'), checkTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss') };
    }
    options.dirId ||= Math.random().toString(36).slice(2);
    try {
      const network = await globalThis.electronAPI.send('proxy:detect', options);
      Object.assign(result, { checkStatus: network.ip ? Check.success : Check.failure, lastIp: network.ip ?? '',
        lastCity: network.city ?? '', lastCountry: network.country_code ?? '', timezone: network.timezone ?? '' });
    } catch (error) {
      const message = String(error?.message ?? error);
      result.error = error;
      result.stale = error?.code === 'PROXY_CHECK_STALE';
      result.systemError = message.startsWith('[IPC]') || message.includes('Unknown message');
    }
    result.checkTime = formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const lastCountry = configuration.lastCountry?.trim?.() || configuration.beforeProxyInfo?.beforeCountry?.trim?.();
    if (lastCountry && result.checkStatus === Check.failure && !result.systemError && (configuration.proxyType ?? configuration.buyProxyType) !== Proxy.buy) {
      result.preDetectLastCountry = lastCountry;
    }
    return result;
  }
  function messageWithRetry(text, onRetry) {
    return h('div', { class: 'w-full flex flex-col gap-3' }, [h('div', { class: 'flex items-center' }, [
      h('div', null, [h('span', null, String(text?.message ?? text ?? ''))]),
      onRetry && h(Button, { class: 'ml-auto', text: true, size: 'xxs', label: translate('重新检测'), onClick: onRetry }),
    ])]);
  }
  function batchTestShowToast(items, options) {
    const results = [].concat(items).filter(Boolean);
    const failed = results.filter(row => row.checkStatus === Check.failure);
    const success = results.filter(row => row.checkStatus === Check.success);
    const failures = failed.some(row => !row.systemError);
    const notifyOptions = failures ? { life: 8000 } : undefined;
    if (results.length === 1) {
      const [row] = results;
      if (failed.length) {
        const reason = row.proxyType === Proxy.buy ? row.error : proxyLabels(isDevice()).testFailedCheckConfig;
        notify(-1, messageWithRetry(reason, options?.reCheck), notifyOptions);
      } else notify(0, translate('位置: {location}\nIP: {ip}\n时区: {timezone}', {
        location: row.lastCountry + addSuffix('/', row.lastCity), ip: row.lastIp, timezone: row.timezone,
      }), notifyOptions);
      return;
    }
    const message = translate('{success} 条成功，{error} 条失败', { success: success.length, error: failed.length });
    notify(success.length ? 0 : -1, messageWithRetry(message, options?.reCheck), notifyOptions);
  }
  async function concurrentProxyTest({ tasks, tasksCompleted, showConcurrentTaskTopBar = false }) {
    if (active) throw Error($t('测速进行中，请稍候'));
    const controller = new AbortController();
    active = controller;
    try {
      if (showConcurrentTaskTopBar) banner.show(tasks.length);
      const results = await runLimited(tasks, 5, { signal: controller.signal, onProgress: progress => {
        if (!disposed && showConcurrentTaskTopBar) banner.update(progress);
      } });
      await tasksCompleted?.(results, disposed);
    } finally {
      if (showConcurrentTaskTopBar) banner.close();
      if (active === controller) active = undefined;
    }
  }
  return { testProxy, batchTestShowToast, concurrentProxyTest };
}
function useProxyExport() {
  return { async downloadProxy({ items, confirm }) {
    await globalThis.electronAPI.send('proxy:export', { ids: items.map(item => item.id) });
    confirm?.();
  } };
}
function watchRemovedPurchaseLink() {
  const route = useRoute();
  const router = useRouter();
  watch(() => route.query.openRoxyIpBuy, value => {
    if (value !== '1') return;
    const { openRoxyIpBuy: _removed, ...query } = route.query;
    router.replace({ name: route.name, query });
  }, { immediate: true });
}
function unavailableProvider() {
  return { isProviderJump: () => false, async jumpToProvider() { throw Error('代理商服务已移除'); } };
}
const identityVerificationAvailable = () => false;
const proxyExportAvailable = () => true;

export { getProxySecrets as C, useNetworkStore as E, unavailableProvider as O, exportRestrictionMessage as _, hasEndpoint as a,
  isDirectWithoutCredentials as b, orderStatus as c, proxyExportAvailable as g, canUseCredentials as h, wasBlockedByNetwork as l, useProxyExport as n,
  isDeploying as o, watchRemovedPurchaseLink as r, canTest as s, useProxyTests as t, isEndpointFailure as u, exportRestriction as v,
  identityVerificationAvailable as x, wasPurchased as y };

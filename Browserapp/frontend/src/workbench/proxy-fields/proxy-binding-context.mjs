const isCloudPhoneApp = () => Boolean(globalThis.isCloudPhoneApp);
function bindingContext() {
  const isCloudPhone = isCloudPhoneApp();
  return { isCloudPhone,
    relatedColumn: isCloudPhone ? $t('已关联云手机') : $t('已关联窗口'),
    selectTitle: isCloudPhone ? $t('选择云手机') : $t('选择窗口'),
    selectTooltip: isCloudPhone ? $t('选择云手机') : undefined,
    emptyBindDesc: isCloudPhone ? $t('添加代理 IP 后可以与云手机绑定。') : $t('添加代理 IP 后可以与窗口绑定。'),
    refreshConfirm: count => isCloudPhone ? $t('此代理 IP 已关联 {count} 个云手机，您确认要刷新代理 IP 吗？', { count })
      : $t('此代理 IP 已关联 {count} 个窗口，您确认要刷新代理 IP 吗？', { count }),
    tableCacheKey: isCloudPhone ? 'cloud-phone-agent-shop' : 'agent-shop',
    columnStorageKey: isCloudPhone ? 'cloud_phone_proxy_display_v1' : 'proxy_display_v1',
  };
}
function bindings(proxy) {
  return Array.isArray(proxy?.phoneBindList) ? proxy.phoneBindList.filter(phone => phone && typeof phone === 'object') : [];
}
const phoneNames = proxy => bindings(proxy).map(phone => String(phone.name || phone.serialNo || phone.phone || '').trim()).filter(Boolean);
const phoneIds = proxy => bindings(proxy).map(phone => String(phone.id ?? '').trim()).filter(Boolean);
function phoneCount(proxy) {
  if (proxy?.phoneBindCount == null) return null;
  const count = Number(proxy.phoneBindCount);
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : null;
}
function shouldLoadPhoneBindings(proxy) {
  if (phoneIds(proxy).length || phoneNames(proxy).length) return false;
  const count = phoneCount(proxy);
  return count == null || count > 0;
}

export { phoneNames as a, phoneIds as i, shouldLoadPhoneBindings as n, bindingContext as o, phoneCount as r, isCloudPhoneApp as s };
export { default as t } from './workbench-proxy-picker.js';

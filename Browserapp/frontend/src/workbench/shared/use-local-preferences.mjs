import { inject, toRaw } from './workbench-vue.js';
import { h as api, sn as useLocale, v as useUserStore } from './utils-BIWenCnY.js';
import { ht as isReactiveProxy } from './runtime-core.esm-bundler-CBj16o9G.js';
import { t as translate } from './locales-BfKu2SD4.js';
import { n as useToast } from './agent-BmSFI9WH.js';
import { t as useFormDialog } from './useFormDialog-ChvKgFzE.js';
import { t as useProxyTest } from './hooks-Jw3GridD.js';

const proxyFields = ['proxyHostPort', 'proxyUsername', 'proxyPassword', 'proxyProtocol'];
const unwrap = value => isReactiveProxy(value) ? toRaw(value) : value;
function settingsPatch(field) {
  const value = field.formatValue?.(field) ?? field.value;
  if (field.formatValue && value && typeof value === 'object' && !Array.isArray(value)) return value;
  return { [field.name]: unwrap(value) };
}
function remember(field) {
  field.oldValue = field.name === 'proxyHostPort' && Array.isArray(field.value) ? [...field.value] : field.value;
}
function prepareEndpoint(find, config = {}) {
  const value = toRaw(find('proxyHostPort')?.value);
  const [newHost, newPort] = Array.isArray(value) ? value : [];
  const host = String(newHost ?? '').trim() || String(config.proxyHost || '127.0.0.1').trim();
  const candidate = Number(newPort || config.proxyPort);
  const port = Number.isFinite(candidate) && candidate >= 1 && candidate <= 65535 ? String(candidate) : '';
  const protocol = find('proxyProtocol')?.value ?? config.proxyProtocol;
  return { host, port, proxyCategory: protocol?.value || protocol || 'SOCKS5', proxyUserName: find('proxyUsername')?.value ?? config.proxyUsername ?? '',
    proxyPassword: find('proxyPassword')?.value ?? config.proxyPassword ?? '', systemProxySwitch: false, outerParamFirst: true };
}
function useLocalPreferences() {
  const [showFormDialog] = useFormDialog();
  const [showToast, onlyErrorToast] = useToast();
  const { testProxy, batchTestShowToast } = useProxyTest();
  const simpleLocale = useLocale();
  const userStore = useUserStore();
  const dialogRef = inject('dialogRef', undefined);
  const saveSettings = patch => globalThis.electronAPI.send('app:saveSoftConfig', patch);
  async function updateUserName(field) {
    if (field.oldValue === field.value) return;
    const { code, msg } = await api.base.userChangeUsernameCreate({ userName: field.value });
    onlyErrorToast(code, msg);
    if (code === 0) { userStore.fetchUserInfo(); remember(field); }
  }
  async function saveUserConfig(field) {
    if (field.vaildator && !field.vaildator(field)) return;
    const value = field.formatValue?.(field) ?? field.value;
    const { code, msg } = await api.base.userSetUserConfigCreate({ [field.name]: value });
    onlyErrorToast(code, msg);
    if (code === 0) {
      await saveSettings({ [field.name]: unwrap(value) });
      userStore.updateUserConfig();
    }
  }
  async function saveLocalConfig(field) {
    if (field.vaildator && !field.vaildator(field)) return;
    await saveSettings(settingsPatch(field));
    remember(field);
  }
  async function detectNetwork(field, mode) {
    try { field.value = await globalThis.electronAPI.send('proxy:detectNetwork', mode); }
    catch (error) { field.value = null; onlyErrorToast(-1, error); }
  }
  async function detectCustomAppNetwork(field, form) {
    if (!form) return;
    const inputs = form.list.flatMap(group => group.items);
    const find = name => inputs.find(item => item.name === name);
    try {
      const proxy = prepareEndpoint(find);
      if (!proxy.host || !proxy.port) {
        field.value = null;
        onlyErrorToast(-1, translate('请先填写完整的代理 IP 信息'));
        return;
      }
      const configured = proxyFields.map(find).filter(Boolean);
      await saveSettings(Object.assign({}, ...configured.map(settingsPatch)));
      for (const input of configured) remember(input);
      const result = await testProxy(proxy);
      field.value = result;
      batchTestShowToast([result], { reCheck: () => detectCustomAppNetwork(field, form) });
    } catch (error) { field.value = null; onlyErrorToast(-1, error); }
  }
  return { dialogRef, showFormDialog, showToast, userStore, simpleLocale, updateUserName, saveUserConfig, saveLocalConfig,
    detectLocalNetwork: field => detectNetwork(field, 'local'), detectSystemNetwork: field => detectNetwork(field, 'system'),
    detectCustomAppNetwork, onlyErrorToast };
}
export { useLocalPreferences as t };

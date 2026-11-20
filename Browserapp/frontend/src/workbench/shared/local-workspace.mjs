import { computed, ref } from './workbench-vue.js';
import { i as defineStore } from './agent-BmSFI9WH.js';
import { n as bootLocale } from './locales-BfKu2SD4.js';
import { b as useRouter } from './rich-html-link-VdBpR3Cm.js';
import './local-api.js';

const localId = 'local';
const workspaceName = 'OpenBrowser';
const privateWorkspace = 0;
const publicWorkspace = 1;
const ecommerceWorkspace = 2;
const owner = 3;
const workspaceTypes = { Private: privateWorkspace, Public: publicWorkspace, ECommerce: ecommerceWorkspace, 0: 'Private', 1: 'Public', 2: 'ECommerce' };
const workspaceRoles = { VIEWER: 0, EDITOR: 1, MANAGER: 2, OWNER: owner, 0: 'VIEWER', 1: 'EDITOR', 2: 'MANAGER', 3: 'OWNER' };
const browserEngine = { Chrome: 'Chrome', Firefox: 'Firefox' };
const requestModes = { partial: 'partial', all: 'all', cloud: 'cloud' };
const toggleState = { close: 0, open: 1, 0: 'close', 1: 'open' };
const agentToggle = { Close: 0, Open: 1, 0: 'Close', 1: 'Open' };
const taskPlan = { Manual: 'manual', Once: 'once', Cron: 'cron' };
const taskRunKind = { ...taskPlan };
const accountPermissions = { ViewPage: 'Platform_view_page', Add: 'Platform_add', Edit: 'Platform_edit', Delete: 'Platform_delete',
  ViewPassword: 'Platform_view_password', BatchExport: 'Platform_batch_export' };

const allow = () => true;
function usePermissions() {
  return { can: allow, cannot: () => false, canAny: allow, canAll: allow, check: allow };
}
const noOp = () => {};
const noOpAsync = async () => {};
const useWorkspace = defineStore('workspace', () => {
  const summary = { id: localId, workspaceType: privateWorkspace, role: owner, workspaceName };
  return { currentWorkspace: ref({ ...summary, workspaceDefault: 1 }), workspaceList: ref([summary]),
    init: noOpAsync, prepareWorkspace: noOpAsync, enterWorkspace: noOpAsync, setCurrentWorkspace: noOpAsync, fetchWorkspaceList: async () => [] };
});
const useRole = defineStore('role', () => {
  const workspace = useWorkspace();
  const hasRole = role => computed(() => workspace.currentWorkspace?.role === role);
  return { isViewer: hasRole(workspaceRoles.VIEWER), isEditor: hasRole(workspaceRoles.EDITOR),
    isManager: hasRole(workspaceRoles.MANAGER), isOwner: hasRole(owner) };
});
const workspaceType = value => value === ecommerceWorkspace || value === publicWorkspace ? value : privateWorkspace;
const isPublicMember = (type, role) => type === publicWorkspace && role !== owner;
const isPrivate = type => workspaceType(type) === privateWorkspace;
const isEcommerce = () => workspaceType(useWorkspace().currentWorkspace?.workspaceType) === ecommerceWorkspace;
const localApi = globalThis.__localApi;
const useAgentApi = () => globalThis.__localAgentApi;
const loadDictionary = async () => globalThis.__localDict;
const supportedLanguages = new Set(['zh-CN', 'en', 'ru']);
const useLocale = defineStore('locale', () => {
  const currentLocale = ref(bootLocale);
  async function setSimpleLocale(language) {
    if (!supportedLanguages.has(language)) throw Error('不支持此界面语言');
    await localApi.base.userSetUserConfigCreate({ language });
    currentLocale.value = language;
    localStorage.setItem('locale', JSON.stringify({ currentLocale: language }));
    location.reload();
  }
  const noAssets = () => '';
  return { currentLocale, siteLocale: computed(() => currentLocale.value.split('-')[0]), isZh: computed(() => currentLocale.value.startsWith('zh')),
    setSimpleLocale, getVideoSource: noAssets, getOfficialWebsite: noAssets, getOfficialFaqWebsite: noAssets,
    getLocaleAppBaseUrl: (target = '') => `obui://app/index.html#${target}`,
    async openTelegram() { throw Error('远程社群入口已移除'); } };
}, { persist: true });
const useUser = defineStore('user', () => {
  const defaults = { batchOpenLayout: 'stack', ipChecker: 'local' };
  const settings = globalThis.__localSettings;
  const userConfig = ref({ ...defaults, ...settings });
  globalThis.__applyLocalUserConfig = saved => { userConfig.value = { ...defaults, ...saved }; };
  const userInfo = ref({ userId: localId, id: localId, userName: settings?.localUserName || workspaceName,
    workspaceId: localId, workspaceType: privateWorkspace, onboardingTaskStatus: settings?.onboardingTaskStatus || {} });
  async function fetchUserInfo() {
    const data = await globalThis.__localRequest('settings:get');
    userInfo.value.userName = data.localUserName || workspaceName;
    userInfo.value.onboardingTaskStatus = data.onboardingTaskStatus || {};
  }
  return { userInfo, fetchUserInfo, updateUserConfig: async patch => { await localApi.base.userSetUserConfigCreate(patch); },
    token: ref(localId), appVersion: ref(globalThis.$appVersion), userConfig,
    getUserConfig: async () => (await localApi.base.userGetUserConfigList()).data, identityInfo: ref({}),
    initUserInfo: noOpAsync, setToken: noOp, mixpanelTrack: noOp, clearUserInfo: noOp };
});
const useProxyVendors = defineStore('proxy', () => {
  const proxyVendors = ref();
  async function getProxyVendors() { return []; }
  function clearProxyVendors() { proxyVendors.value = undefined; }
  return { proxyVendors, getProxyVendors, clearProxyVendors };
});
let headersRequest;
function getRequestHeaders() {
  headersRequest ??= globalThis.electronAPI.send('util:getCommonRequestHeaders').catch(() => ({})).finally(() => { headersRequest = undefined; });
  return headersRequest;
}
function backRoute() {
  const router = useRouter();
  const [path, search] = String(router.options.history.state.back).split('?');
  return { path, query: { ...Object.fromEntries(new URLSearchParams(search)), ...router.currentRoute.value.query } };
}
function registerRouter() {}

export { useWorkspace, workspaceType as Ot, workspaceTypes as tn, workspaceRoles as Ut, requestModes as Kt,
  isPrivate as Dt, isPublicMember as Pt, isEcommerce as Tt, usePermissions as nn, useRole as at, browserEngine as qt,
  toggleState as en, agentToggle as H, taskPlan as F, taskRunKind as P, accountPermissions as rn, useUser as v,
  useLocale as sn, useProxyVendors as _t, localApi as h, useAgentApi as N, loadDictionary as m, getRequestHeaders as ln,
  backRoute as wt, registerRouter as Ct };

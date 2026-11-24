import {
  mt as currentScope,
  yt as onScopeDispose,
} from "./runtime-core.esm-bundler-CBj16o9G.js";
import { createProfileLifecycleBridge } from './workbench-profile-lifecycle.js';
import { invalidateProfileTableCache, invalidateProjectListCache, isProjectListChange } from './workbench-table.js';
// Vue reactive proxies cannot cross Electron structured-clone IPC. Copy the DTO explicitly.
const plain = (value, seen = new WeakSet()) => {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol")
      throw Error("IPC 参数包含不可序列化的值");
    return value;
  }
  if (value instanceof ArrayBuffer) return value;
  if (seen.has(value)) throw Error("IPC 参数不能包含循环引用");
  seen.add(value);
  const copy = Array.isArray(value)
    ? value.map((v) => plain(v, seen))
    : Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, plain(v, seen)]),
      );
  seen.delete(value);
  return copy;
};
const request = async (method, payload = {}) => {
  if (!globalThis.rebuild) throw Error("请在 OpenBrowser 桌面程序中打开");
  globalThis.__localRequests?.push(method);
  return globalThis.rebuild.request(method, plain(payload)).then((result) => {
    // Keep domain errors as data across Electron's context bridge; see shared/ipc-result.js.
    if (!result || result.ipcResult !== 1) return result;
    if (result.ok) return result.value;
    const detail = result.error || {};
    const error = new Error(detail.message || "Operation failed");
    if (detail.code !== undefined) error.code = detail.code;
    if (Array.isArray(detail.stale)) error.stale = detail.stale;
    if (Number.isSafeInteger(detail.completed)) error.completed = detail.completed;
    if (Array.isArray(detail.remainingIds)) error.remainingIds = detail.remainingIds;
    throw error;
  });
};
const ok = (data) => ({ code: 0, data, msg: "" });
let settingsReadRevision = 0;
let appliedSettingsReadRevision = 0;
async function readLocalUserConfig() {
  // The local service queues reads with writes, but IPC replies can arrive late.
  // Order the reads, not save intents: a newer failed edit has no snapshot and
  // must not discard a previous successful edit that has not reached the UI.
  const revision = ++settingsReadRevision;
  const saved = await request("settings:get");
  if (!saved || typeof saved !== "object" || Array.isArray(saved))
    throw Object.assign(Error("本地设置读取结果无效"), { code: "LOCAL_SETTINGS_INVALID_SNAPSHOT" });
  if (revision < appliedSettingsReadRevision) return globalThis.__localSettings;
  appliedSettingsReadRevision = revision;
  globalThis.__localSettings = saved;
  globalThis.__applyLocalUserConfig?.(saved);
  return saved;
}
const unavailable = (name) => {
  globalThis.__localUiError?.("此功能尚未完成本地接线，操作未执行。");
  throw Object.assign(Error("尚未接线: " + name), {
    code: "LOCAL_CHANNEL_UNIMPLEMENTED",
    localUiNotified: typeof globalThis.__localUiError === "function",
  });
};
globalThis.__localRequest = request;
globalThis.__localListenWindow = (type, callback, options) => {
  window.addEventListener(type, callback, options);
  const dispose = () => window.removeEventListener(type, callback, options);
  if (currentScope()) onScopeDispose(dispose);
  return dispose;
};
const opts = (values) =>
  values.map((v) => ({ label: String(v), value: String(v) }));
const dictionary = {
  protocol: opts(["HTTP", "HTTPS", "SOCKS5"]),
  ipType: opts(["IPV4", "IPV6"]),
  checkChannel: opts(["ip-api", "ipinfo"]),
  "ipv6-query-channels": opts(["ip-api", "ipinfo"]),
  os: opts(["Windows", "macOS", "Linux", "Android", "IOS"]),
  osversion_windows: opts(["11", "10", "8", "7"]),
  osversion_macos: opts(["15", "14", "13", "12"]),
  osversion_linux: opts(["Ubuntu"]),
  osversion_android: opts(["14", "13", "12"]),
  osversion_ios: opts(["18", "17", "16"]),
  coreVersion: [],
  firefoxCoreVersion: [],
  language: opts(["en-US", "zh-CN", "en-GB"]),
  timeZone: opts(["America/New_York", "Asia/Shanghai", "Europe/London", "UTC"]),
  resolution: opts(["1920 x 1080", "1366 x 768", "1280 x 720"]),
  mobileResolution: opts(["390 x 844", "412 x 915"]),
  hardwareConcurrent: opts(["0", "2", "4", "6", "8", "10", "12", "16", "20", "24"]),
  deviceMemory: opts(["0", "2", "4", "8"]),
  webGLVendor: opts(["Google Inc. (Intel)"]),
  nettype: opts(["wifi", "ethernet"]),
  effectiveType: opts(["4g", "3g", "2g", "slow-2g"]),
  disableSslList: [
    { label: "TLS_AES_128_GCM_SHA256", value: "0x1301" },
    { label: "TLS_AES_256_GCM_SHA384", value: "0x1302" },
    { label: "TLS_CHACHA20_POLY1305_SHA256", value: "0x1303" },
  ],
};
globalThis.__loadLocalDictionary = async () => {
  const data = await request("host:dictionary");
  const names = new Intl.DisplayNames(["zh-CN"], { type: "language" });
  dictionary.language = data.languages.map((value) => ({
    label: names.of(value),
    value,
  }));
  dictionary.timeZone = opts(data.timezones);
};
globalThis.__localDict = new Proxy(dictionary, { get: (o, k) => o[k] ?? [] });
const listeners = new Map();
const emit = (channel, value) => {
  const report = error => console.error("[OpenBrowser] renderer event listener failed:", channel, error);
  for (const fn of [...(listeners.get(channel) || [])]) {
    try {
      const result = fn(value);
      if (result?.then) Promise.resolve(result).catch(report);
    } catch (error) { report(error); }
  }
};
const profileLifecycle = createProfileLifecycleBridge({ emit, notify: message => globalThis.__localUiError?.(message) });
let receiptRefresh = null, receiptRefreshNeeded = false;
function refreshLaunchReceipts() {
  receiptRefreshNeeded = true;
  if (receiptRefresh) return;
  receiptRefresh = Promise.resolve().then(async () => {
    while (receiptRefreshNeeded) {
      receiptRefreshNeeded = false;
      const cursor = profileLifecycle.snapshotCursor();
      try { profileLifecycle.refreshReceipts(await request("profiles:lifecycle-rows"), cursor); }
      catch (error) { console.error("[OpenBrowser] could not refresh launch status:", error); }
    }
  }).finally(() => {
    receiptRefresh = null;
    if (receiptRefreshNeeded) refreshLaunchReceipts();
  });
}
globalThis.rebuild?.onEvent?.((event) => {
  profileLifecycle.handle(event);
  if (event.type === "profile-start-page-warning") globalThis.__localUiError?.(event.message);
  if (event.type === "status" && event.action === "profiles-update" && listeners.get("browser:launch-process-message")?.size)
    refreshLaunchReceipts();
  if (
    event.type === "profiles" ||
    (event.type === "status" && event.action === "profiles-update") ||
    (/^profile-(start|stop|sync)-progress$/.test(event.type) && event.lifecycle && !event.lifecycle.pending)
  ) {
    invalidateProfileTableCache();
    emit("local:profiles-change", event);
  }
  if (isProjectListChange(event)) {
    invalidateProjectListCache();
    emit("local:projects-change", event);
  }
  if (event.channel) emit(event.channel, event.payload);
  if (event.channel === "local:navigate")
    globalThis.__router?.push(event.payload);
  if (event.channel === "local:error")
    globalThis.__localUiError?.(event.payload);
});
const batch = async (ids, restart = false) =>
  Promise.all(
    ids.map(async (id) => {
      const operation = profileLifecycle.beginStart(id);
      try {
        if (restart) await request("profiles:stop", { id });
        const result = await request("profiles:start", { id });
        if (result?.running !== true) throw Object.assign(new Error(typeof globalThis.$t === "function"
          ? globalThis.$t("未确认窗口已打开") : "未确认窗口已打开"), { code: "PROFILE_WINDOW_NOT_CONFIRMED" });
        profileLifecycle.finishStart(operation, result);
        return { id, ok: true, alreadyRunning: Boolean(result?.alreadyRunning),
          ...(result?.launchStatus ? { launchStatus: result.launchStatus } : {}) };
      } catch (error) {
        profileLifecycle.finishStart(operation, null, error);
        return { id, ok: false, error: error.message, code: error.code };
      }
    }),
  );
const closeBatch = async ids => {
  const results = await Promise.allSettled(ids.map(id => request("profiles:stop", { id })));
  const failed = results.filter(row => row.status === "rejected").length;
  if (failed) globalThis.__localUiError?.(`${failed} 个窗口未能确认关闭，请检查状态后重试。`);
  return results.map((result, index) => result.status === "fulfilled" ? result.value :
    { id: ids[index], ok: false, error: result.reason.message, code: result.reason.code });
};
const proxyRow = (v) => ({
  ...v,
  proxyType: 0,
  ipType: String(v.host || "").includes(":") ? "IPV6" : "IPV4",
  ...(Object.hasOwn(v, "username") && { proxyUserName: v.username }),
  ...(Object.hasOwn(v, "password") && { proxyPassword: v.password }),
  proxyCategory: String(v.protocol || "http").toUpperCase(),
  proxyMethod: "choose",
  moduleId: v.id,
  proxyRemark: v.remark,
  checkStatus: v.lastCheckOk === true ? 1 : v.lastCheckOk === false ? 2 : 0,
  countryCode: v.lastCountryCode || "",
  country: v.lastCountry || "",
  timeZone: v.lastTimezone || "",
  createTime: v.create_time,
  windowCount: v.bindList?.length || 0,
});
const proxyInput = (v) => {
  const fields = plain(v);
  // A row includes its old canonical URL. Once the form supplies endpoint
  // fields, that URL must not override the user's new host/port/credentials.
  if (Object.hasOwn(v, "host"))
    for (const key of ["raw", "proxy", "proxyUrl", "url"]) delete fields[key];
  return {
    ...fields,
    protocol: String(v.protocol || v.proxyCategory || "http").toLowerCase(),
    username: v.proxyUserName ?? v.username,
    password: v.proxyPassword ?? v.password,
  };
};
const proxyList = async (p) => {
  const { rows, total } = await request("proxies:query", p);
  return { rows: rows.map(proxyRow), total };
};
globalThis.__localActionTrack = (action) =>
  request("activity:append", { action: String(action || "") });
function saveWindowFilter(payload) {
  const condition = payload?.filter_condition;
  if (!condition || typeof condition !== "object" || Array.isArray(condition))
    return request("filters:save", payload);
  // Saved calendar selections must survive the bridge's plain-object copy.
  const filter_condition = { ...condition };
  for (const field of ["createTime", "modfiyTime"]) {
    if (!Array.isArray(condition[field])) continue;
    filter_condition[field] = condition[field].map(value => {
      if (!(value instanceof Date)) return value;
      if (!Number.isFinite(value.getTime())) throw Error("筛选器日期无效");
      return value.toISOString();
    });
  }
  return request("filters:save", { ...payload, filter_condition });
}
const methods = {
  userAnalysisWindowInfoCreate: (p) => request("profiles:analyse-import", p),
  userImportWindowInfoV2Create: (p) => request("profiles:import", p),
  userGetWindowInfoListList: async (p = {}) => {
    const result = await request("profiles:query", p);
    return { ...result, rows: result.rows.map(row => ({ ...row, projectName: row.projectId ? row.projectName : globalThis.$t("默认项目") })) };
  },
  userGetWindowInfoV2List: async (p) => {
    const ids = String(p.windowIds || p.id || p.windowId || "")
      .split(",")
      .filter(Boolean);
    return {
      rows: await Promise.all(
        ids.map((id) => request("profiles:read", { id })),
      ),
      total: ids.length,
    };
  },
  userGetWindowInfoList: (p) =>
    request("profiles:read", { id: p.id || p.windowId }),
  userAddWindowInfoV2Create: (p) => request("profiles:create", p),
  userMdfWindowInfoSingleV2Create: (p) =>
    p.rev != null || p.coreType
      ? request("profiles:update", p)
      : request("profiles:patch", { ids: [p.id || p.windowId], patch: p }),
  userDelWindowInfoBatchCreate: (p) => request("profiles:delete", p),
  userMdfWindowSyncV2Create: async (p) => {
    const rows = await request("profiles:selection-status", { ids: p.map(row => row.id) });
    if (rows.some(row => row.openStatus))
      throw Error("请先关闭窗口");
    return true;
  },
  userMdfWindowDataBatchCreate: (p) => request("profiles:edit-data", p),
  userDelWindowInfoCreate: (p) => request("profiles:purge", p),
  userDelWindowInfoRecycleCreate: (p) => request("profiles:purge-trash", p),
  userGetUaWebglV2List: (p) => request("fingerprint:preview", { ...p, includeRuntime: false }),
  userGetDeviceNameV2List: async (p) => [await request("fingerprint:sample-fields", p)],
  userGetMacAddrV2List: async (p) => [await request("fingerprint:sample-fields", { ...p, macInfo: true })],
  userGetBrowserVersionInfoList: async () =>
    (await request("kernels:list"))
      .filter((v) => v.engine === "chromium")
      .map((v) => ({ browserVersion: v.version.split("-")[0] })),
  userGetWindowStatusInfoCreate: (p) => request("profiles:selection-status", p),
  userRestoreWindowInfoCreate: (p) => request("profiles:restore", p),
  userCopyWindowInfoCreate: (p) => request("profiles:clone", p),
  userBatchWindowInfoV2Create: (p) => request("profiles:create-batch", p),
  userGetWindowSortNumList: () => request("profiles:next-number"),
  userGetWindowFilterNameListList: () => request("filters:list"),
  userUpdateWindowFilterNameCreate: saveWindowFilter,
  userAddWindowFilterNameCreate: saveWindowFilter,
  userDeleteWindowFilterNameCreate: (p) => request("filters:delete", p),
  userUpdateWindowFilterSortCreate: (p) =>
    request("settings:set", { filterSort: p.sort_data }),
  userGetWindowTemplateListList: () => request("templates:list"),
  userAddWindowTemplateInfoCreate: (p) => request("templates:save", p),
  userMdfWindowTemplateInfoCreate: (p) => request("templates:save", p),
  userDeleteWindowTemplateInfoCreate: (p) =>
    request("templates:delete", { ids: [p.id] }),
  userGetUserConfigList: readLocalUserConfig,
  userSetUserConfigCreate: async (p) => {
    await request("settings:set", p);
    return readLocalUserConfig();
  },
  userGetUserApiList: () => request('api:get'),
  userSetUserApiCreate: p => request('api:set',p),
  userChangeUsernameCreate: p => {
    if(typeof p.userName!=='string'||!p.userName.trim()||p.userName.length>100)throw Error('本地名称须为 1–100 字');
    return request('settings:set',{localUserName:p.userName.trim()});
  },
  userGetProjectInfoByWorkspaceList: async (p = {}) => {
    if (p.page_index != null || p.page_size != null || p.pageIndex != null || p.pageSize != null)
      return request("groups:query", p);
    const rows = await request("groups:list", p);
    return { rows, total: rows.length };
  },
  userGetPluginListList: p => request('extensions:list',p),
  userFixedPluginToWindowCreate: p => request('extensions:pin',p),
  userUploadChromePluginsV2Create: p => request('extensions:store',p),
  userUploadPluginInfoCreate: p => request('extensions:finish',p),
  userAddPluginToWindowCreate: p => request('extensions:assign',p),
  userGetPluginInfoByIdList: p => request('extensions:read',p),
  userCheckAllPluginsVersionList: p => request('extensions:reload',{...p,check:true}),
  userUpgradePluginsCreate: p => request('extensions:reload',p),
  userBatchDelPluginInfoCreate: p => request('extensions:remove',p),
  userGetTopProjectInfoList: async () => {const rows=await request('groups:list',{default:2,pinnedOnly:true});return {rows,total:rows.length};},
  userAddProjectInfoCreate: (p) => request("groups:save", p),
  userMdfProjectInfoCreate: (p) => request("groups:save", p),
  userDelProjectInfoCreate: (p) =>
    request("groups:delete", { ids: [p.projectId] }),
  userMdfProjectSortCreate: (p) => request("groups:sort", p),
  userGetProxyListMergedList: proxyList,
  userGetProxyAllCountriesList: async () =>
    (await request("proxies:options")).countries.map((v) => ({ label: v, value: v })),
  userGetProxyProvidersTypeList: () => ["本地"],
  userGetProxyVendorListList: async () =>
    (await request("proxies:options")).vendors.map((v) => ({ id: v, name: v })),
  userGetProxyTableSortOrderList: async () =>
    (await request("settings:get")).proxyTableSort || {},
  userSaveProxyTableSortOrderCreate: (p) =>
    request("settings:set", { proxyTableSort: p }),
  userGetProxyModuleListList: proxyList,
  userGetProxyModuleV2List: proxyList,
  userGetProxyModuleList: proxyList,
  userGetProxyDetailMergedList: async (p) =>
    proxyRow(await request("proxies:read", p)),
  userGetRandomAvailableProxyMergedList: async () => {
    const row = await request("proxies:random");
    return row ? proxyRow(row) : null;
  },
  userBatchCheckProxyImportCreate: (p) => request("proxies:duplicates", p),
  userMdfProxyBindWindowCreate: (p) => request("proxies:bind", p),
  userBatchMdfProxyModuleCheckCreate: (p) => request("proxies:save-results", p),
  userMdfWindowProxyCheckBatchCreate: (p) =>
    request("profiles:proxy-results", p),
  userAddProxyModuleV2Create: (p) =>
    request("proxies:create-many", { items: p.proxyList.map(proxyInput) }),
  userMdfProxyModuleCreate: (p) =>
    p.proxyList
      ? (p.requestType === "speed_test"
        ? request("proxies:save-results", p)
        : request("proxies:update-many", { items: p.proxyList.map(v => ({ ...proxyInput(v), id: v.id || v.moduleId })) }))
      : request("proxies:update", { ...proxyInput(p), id: p.id || p.moduleId }),
  userDelProxyModuleV2Create: (p) =>
    request("proxies:delete", { ids: p.ids || p.proxyIds || [p.id] }),
  userMdfWindowInfoBatchV2Create: (p) =>
    Object.hasOwn(p, "isDelete")
      ? request(p.isDelete ? "profiles:delete" : "profiles:restore", {
          ids: p.ids,
        })
      : request("profiles:patch", { ids: p.ids || p.windowIds, patch: p }),
  userGetProjectListList: async () => ({ rows: await request("groups:list") }),
  userGetLabelInfoList: async () => {
    const rows = await request("labels:list");
    return { rows, total: rows.length };
  },
  userAddLabelInfoCreate: (p) => request("labels:save", p),
  userMdfLabelInfoCreate: (p) => request("labels:save", p),
  userDelLabelInfoCreate: (p) => request("labels:delete", p),
  userGetWindowPlatformAccountListList: () => request("profiles:platform-options"),
  userGetPlatformInfoList: () => ({
    rows: [
      ["Google", "https://accounts.google.com"],
      ["Facebook", "https://facebook.com"],
      ["TikTok", "https://tiktok.com"],
      ["Amazon", "https://amazon.com"],
    ].map(([platformAbbr, platformUrl]) => ({
      platformAbbr,
      platformUrl,
      platformName: platformAbbr,
      platformIcon: "",
      platformIconDark: "",
    })),
  }),
  userGetPlatformInfoV2List: (p = {}) => request("accounts:list", p),
  userAddPlatformInfoCreate: (p) => request("accounts:create", { values: [p] }),
  userAddPlatformInfoBatchCreate: (p) =>
    request("accounts:create", {
      values: Array.isArray(p) ? p : p.platformList,
    }),
  userMdfPlatformInfoCreate: (p) => request("accounts:update", p),
  userMdfPlatformBindWindowCreate: (p) => request("accounts:bind", p),
  userDelPlatformInfoCreate: (p) => request("accounts:delete", p),
  userGetSearchEnginesList: () => [
    {
      code: "Google",
      name: "Google",
      url: "https://www.google.com/search?q={keyword}",
    },
    {
      code: "Bing",
      name: "Bing",
      url: "https://www.bing.com/search?q={keyword}",
    },
  ],
  userGetWindowTableSortOrderList: async () =>
    (await request("settings:get")).tableSort || {},
  userSaveWindowTableSortOrderCreate: (p) =>
    request("settings:set", { tableSort: p }),
  userCheckWindowTotalCountList: () => null,
  userGetQuickCreateTemplateList: async () =>
    (await request("settings:get")).quickTemplate || null,
  userAddQuickCreateTemplateCreate: (p) =>
    request("settings:set", { quickTemplate: { templateInfo: p } }),
  userMdfQuickCreateTemplateCreate: (p) =>
    request("settings:set", { quickTemplate: { id: p.id, templateInfo: p } }),
};
globalThis.__localApi = new Proxy(
  {},
  {
    get: (_, ns) =>
      new Proxy(
        {},
        {
          get:
            (_, method) =>
            async (...args) => {
              globalThis.__localApiCalls?.push(
                String(ns) + "." + String(method),
              );
              if (!Object.hasOwn(methods, method))
                return unavailable(String(ns) + "." + String(method));
              return ok(await methods[method](...args));
            },
        },
      ),
  },
);
const attachmentPreviews = new Map();
globalThis.__attachmentPreviewPath = (value) =>
  attachmentPreviews.get(value) || "";
const sends = {
  'api:getStatus': () => request('api:status'),
  'util:checkPort': port => request('api:check-port',{port}),
  'util:genApiKey': async () => (await globalThis.ops.rotateApiKey()).apiKey,
  'browser:createDesktopShortcut': p => request('host:shortcut',p),
  'browser:setAsDefaultBrowser': p => request('host:default-browser',p),
  'util:getCommonRequestHeaders': () => ({}),
  'extension:getSelectedExtensionInfo': kind => request('extensions:select',{kind}),
  'extension:stageLocal': p => request('extensions:stage',p),
  'extension:getExtensionInfo': id => request('extensions:exists',{id}),
  'extension:showExtensionDir': id => request('extensions:show',{id}),
  'extension:download': rows => request('extensions:verify',{ids:rows.map(row=>row.id||row.pluginDir)}),
  // The SDK removal already completed the native deletion; no second mutation.
  'extension:remove': ids => request('extensions:verify-removed',{ids}),
  "dialog:selectFileOrDirInfo": async () => {
    const chosen = await request("agent:files:choose");
    if (chosen?.type === "file")
      attachmentPreviews.set(chosen.path, chosen.files[0].url);
    // Bound the renderer-side preview map: it used to grow for the whole
    // process lifetime, one data-URL entry per picked file.
    if (attachmentPreviews.size > 100)
      attachmentPreviews.delete(attachmentPreviews.keys().next().value);
    return chosen;
  },
  "app:downloadLocalFile": (payload) => request("agent:files:export", payload),
  "syncControl:open": async () => {
    await request("sync:restore", await request("settings:get"));
    return globalThis.__router.push("/synchronizer");
  },
  "syncControl:close": async () => {
    await request("sync:shortcuts:clear");
    return globalThis.__router.push("/browser/list");
  },
  "syncControl:start": async (ids) => {
    const selected = Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string' && id))] : [];
    if (selected.length < 2) throw Error('请至少选择两个运行中的窗口');
    await request("sync:restore", await request("settings:get"));
    const result = await globalThis.ops.startSync(plain(selected));
    await globalThis.__router.push("/synchronizer/active");
    return result;
  },
  "syncControl:stop": async () => {
    const result = await globalThis.ops.stopSync();
    await globalThis.__router.push("/synchronizer");
    return result;
  },
  "syncControl:pause": async () => {
    await request("sync:shortcuts:clear");
    return globalThis.ops.stopSync();
  },
  "syncControl:resume": async () => {
    const { selected } = await globalThis.ops.getSyncState();
    if (selected.length < 2) throw Error('请至少选择两个运行中的窗口');
    await request("sync:restore", await request("settings:get"));
    return globalThis.ops.startSync(selected);
  },
  "syncControl:getSyncWindowCount": async () => {
    const ids = (await globalThis.ops.getSyncState()).selected || [];
    return (await request("profiles:selection-status", { ids })).filter(row => row.openStatus).length;
  },
  "syncControl:showAll": async () =>
    globalThis.ops.windowAction(
      (await globalThis.ops.getSyncState()).selected,
      "normal",
      {},
    ),
  "syncControl:doLayout": (p) => request("sync:layout", p),
  "syncControl:openPreferencesDialog": (p) =>
    request("ui:dialog:open", { kind: "preferences", ...p }),
  "syncControl:openBatchInputsDialog": (p) =>
    request("ui:dialog:open", { kind: "batch-inputs", ...p }),
  "syncControl:openOpenSitesDialog": () =>
    request("ui:dialog:open", { kind: "open-sites" }),
  "syncControl:openSyncingWindowListDialog": () =>
    request("ui:dialog:open", { kind: "syncing-window-list" }),
  "syncControl:closePreferencesDialog": () => request("ui:dialog:close"),
  "syncControl:closeBatchInputsDialog": () => request("ui:dialog:close"),
  "syncControl:closeOpenSitesDialog": () => request("ui:dialog:close"),
  "syncControl:closeSyncingWindowListDialog": () => request("ui:dialog:close"),
  "syncControl:resizePreferencesDialog": (p) => request("ui:dialog:resize", p),
  "syncControl:resizeBatchInputsDialog": (p) => request("ui:dialog:resize", p),
  "syncControl:getMainControlDirId": async () => {
    const state = await globalThis.ops.getSyncState();
    return state.master || state.selected?.[0];
  },
  "syncControl:getMainControlBrowserSize": () => request("sync:master-bounds"),
  "syncControl:batchInputText": (p) => request("sync:batch-text", p),
  "syncControl:openSites": (p) => request("sync:open-sites", p),
  "syncControl:checkShortcutKeysIsOccupied": (p) =>
    request("sync:shortcuts:check", p),
  "syncControl:registerShortcut": (p) => request("sync:shortcuts:register", p),
  ...Object.fromEntries(
    Object.entries({
      unifyTabs: "sync",
      closeOtherTabs: "closeOthers",
      closeCurrentTab: "close",
      closeBlankTabs: "closeBlank",
    }).map(([channel, action]) => [
      "syncControl:" + channel,
      async () =>
        globalThis.ops.tabAction(
          (await globalThis.ops.getSyncState()).selected,
          action,
          {},
        ),
    ]),
  ),
  "syncControl:changeSyncSettings": (p) => request("sync:settings", p),
  "syncControl:getAllSyncingWindows": async () => {
    const state = await globalThis.ops.getSyncState();
    const ids = state.selected || [];
    return (await request("profiles:open-rows", { ids }))
      .map((row) => ({
        ...row,
        $pId: row.pid,
        platform: row.os,
        $canUseSyncControl: row.coreType === "Chrome",
      }));
  },
  "app:getMacAddress": () => request("host:mac"),
  "proxy:detect": (p) => request("proxies:detect", p),
  "proxy:detectNetwork": (mode) => request("host:network", { probe: true, mode }),
  "proxy:refreshUrl": (url) => request("proxies:refresh", { url }),
  "proxy:refreshSaved": (id) => request("proxies:refresh", { id }),
  "proxy:extract": (url) => request("proxies:extract", { url }),
  "proxy:export": (p) =>
    request("proxies:export", Array.isArray(p) ? { ids: p } : p),
  "util:removeProject": () => true,
  "browser:batchRemove": (ids) => request("profiles:purge", { ids }),
  "browser:clearCache": (p) => request("profiles:clear-cache", p),
  "browser:exportProfiles": (payload) => request("transfer:export", payload),
  "util:genRandomFingerprint": (p, count) =>
    request("fingerprint:preview", { ...p, count, includeRuntime: false }),
  "util:callRandomFingerprintFunc": async (functions) => {
    const os = functions.getSpeechSynthesis?.[0] || functions.getAllowFontList?.[0];
    const values = await request('fingerprint:sample-fields', { os });
    const result = {};
    for (const k of Object.keys(functions)) {
      if (!Object.hasOwn(values, k)) throw Error("未映射指纹函数: " + k);
      result[k] = values[k];
    }
    return result;
  },
  "util:genRandomFonts": async () =>
    (await request('fingerprint:sample-fields')).getAllowFontList,
  "app:isMainWindow": () => !new URL(location.href).searchParams.has("dialog"),
  "app:showCurrentWebviewWindow": () => request("ui:dialog:show"),
  "app:resizeWindow": (p) => request("ui:dialog:resize", p),
  "app:getAppVersion": async () => (await globalThis.ops.getInfo()).appVersion,
  "app:getSoftConfig": () => request("settings:get"),
  "app:saveSoftConfig": (p) => request("settings:set", p),
  "app:getCoreList": async () => {
    const v = await request("kernels:list");
    const rows = v.map((k) => ({
      coreType: k.engine === "firefox" ? "Firefox" : "Chrome",
      coreVersion: String(k.version).split(".")[0],
    }));
    dictionary.coreVersion = opts([
      ...new Set(
        rows.filter((k) => k.coreType === "Chrome").map((k) => k.coreVersion),
      ),
    ]).map(option => ({ ...option, label: 'Chrome ' + option.value }));
    dictionary.firefoxCoreVersion = opts([
      ...new Set(
        rows.filter((k) => k.coreType === "Firefox").map((k) => k.coreVersion),
      ),
    ]).map(option => ({ ...option, label: 'Firefox ' + option.value }));
    return rows;
  },
  "app:setSystemTheme": (p) => request("settings:set", { colorScheme: p }),
  "browser:getOpenedBrowser": async () =>
    (await request("profiles:open-rows"))
      .map((row) => ({
        ...row,
        platform: row.os,
        $canUseSyncControl: row.coreType === "Chrome",
      })),
  "browser:getOpenedBrowserMessage": async () => {
    const cursor = profileLifecycle.snapshotCursor();
    return profileLifecycle.messages(await request("profiles:lifecycle-rows"), cursor);
  },
  "browser:batchLaunch": (ids) => batch(ids),
  "browser:startCookieRobot": (payload) =>
    request("cookie-robot:start", payload),
  "browser:chunkBrowsersByScreen": async (ids) => {
    const result = await batch(ids);
    const active = result.filter((v) => v.ok).map((v) => v.id);
    if (active.length) await globalThis.ops.windowAction(active, "tile", {});
    return result;
  },
  "browser:openBatchLayout": async (p) => {
    const result = await batch(p.dirIds);
    const active = result.filter((v) => v.ok).map((v) => v.id);
    if (active.length)
      await globalThis.ops.windowAction(
        active,
        p.layout === "minimize"
          ? "minimized"
          : p.layout === "cascade"
            ? "cascade"
            : "tile",
        {},
      );
    return result;
  },
  "browser:batchRelaunch": (ids) => batch(ids, true),
  "browser:batchClose": closeBatch,
  "browser:isProcessExists": async (ids) => {
    const rows = await request("profiles:selection-status", { ids });
    const opened = new Set(rows.filter(row => row.openStatus).map(row => row.id));
    return ids.map(id => opened.has(String(id)));
  },
  "browser:open": (p) =>
    request("profiles:start", { id: p.id || p.windowId || p.dirId || p }),
  "browser:close": (p) =>
    request("profiles:stop", { id: p.id || p.windowId || p.dirId || p }),
};
globalThis.electronAPI = {
  // Original File/clipboard/drop fallback uploads bytes through IPC. Renderer
  // paths never grant filesystem access; native selection grants snapshots.
  getPathForFile: () => "",
  send: async (channel, ...args) => {
    if (!Object.hasOwn(sends, channel)) return unavailable(String(channel));
    return sends[channel](...args);
  },
  invoke: async (channel, ...args) => {
    if (!Object.hasOwn(sends, channel)) return unavailable(String(channel));
    return sends[channel](...args);
  },
  on: (channel, callback) => {
    let set = listeners.get(channel);
    if (!set) listeners.set(channel, (set = new Set()));
    set.add(callback);
    const probe = globalThis.__localSubscriptions
      ? { channel, active: true }
      : null;
    if (probe) globalThis.__localSubscriptions.push(probe);
    const unsubscribe = () => {
      set.delete(callback);
      if (!set.size && listeners.get(channel) === set) listeners.delete(channel);
      if (probe) probe.active = false;
    };
    if (currentScope()) onScopeDispose(unsubscribe);
    return unsubscribe;
  },
};

globalThis.__agentRequest = (method, payload = {}) =>
  request("agent:" + method, payload);
const agentCall = (method, ...args) => {
  if (method === "getFileUrl")
    return "obui://app/agent-files/" + encodeURIComponent(args[0]);
  if (method === "fileToBase64")
    return new Promise((resolve, reject) => {
      if (!(args[0] instanceof Blob) || args[0].size > 10 * 1024 * 1024)
        return reject(Error("单个附件不能超过 10 MiB"));
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error || Error("附件读取失败"));
      reader.readAsDataURL(args[0]);
    });
  if (method === "markConversationRead")
    return globalThis.__agentRequest(method, { id: args[0], runId: args[1] });
  if (method === "scriptSelfDescription")
    return globalThis.__agentRequest(method, { code: args[0], filename: args[1] });
  if (method === "uploadFile")
    return globalThis.__agentRequest(method, {
      data: args[0],
      mimeType: args[1],
      fileName: args[2],
      conversationId: args[3],
    });
  if (method === "conversationDetail")
    return globalThis.__agentRequest(method, { id: args[0], ...args[1], includeCheckpoint: false });
  if (
    [
      "deleteConversation",
      "resume",
      "runTask",
      "stopTaskLog",
      "deleteTaskLog",
    ].includes(method)
  )
    return globalThis.__agentRequest(method, { id: args[0], ...args[1] });
  if (method === "updateConversation")
    return globalThis.__agentRequest(method, { id: args[0], title: args[1] });
  return globalThis.__agentRequest(method, args[0] || {});
};
globalThis.__localAgentApi = new Proxy(
  {},
  {
    get: (_, key) => {
      if (
        ["templates", "userTemplates", "userTasks", "officialScripts"].includes(
          key,
        )
      )
        return new Proxy(
          {},
          {
            get:
              (_, method) =>
              async (...args) => {
                if (method === "uploadUserTemplateScript") {
                  const file = args[0]?.file;
                  if (!(file instanceof File) || file.size > 256 * 1024)
                    throw Error("脚本不能超过 256 KiB");
                  return globalThis.__agentRequest(key + "." + method, { filename: file.name, code: await file.text() });
                }
                if (method === "uploadUserTemplateSkill") {
                  const file = args[0]?.file;
                  if (!(file instanceof Blob) || file.size > 16 * 1024 * 1024)
                    throw Error("Skill 压缩包不能超过 16 MiB");
                  const data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
                    reader.onerror = () => reject(reader.error || Error("Skill 文件读取失败"));
                    reader.readAsDataURL(file);
                  });
                  return globalThis.__agentRequest(key + "." + method, { filename: file.name, data });
                }
                const payload = typeof args[0] === "number" || typeof args[0] === "string"
                  ? { id: args[0], ...args[1] } : /^(list|get)/.test(method) ? args[0] || {} : Object.assign({}, args[0], args[1]);
                const result = await globalThis.__agentRequest(key + "." + method, payload);
                return /^(top|untop)/.test(method) ? result.data : result;
              },
          },
        );
      if (key === "ensureAgentReady")
        return () => globalThis.__agentRequest("info");
      if (key === "initializeAgentBackendAuth")
        return async () => ({ transport: "ipc" });
      return (...args) => agentCall(key, ...args);
    },
  },
);

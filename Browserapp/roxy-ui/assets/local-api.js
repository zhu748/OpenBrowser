import {mt as currentScope,yt as onScopeDispose} from "./runtime-core.esm-bundler-CBj16o9G.js";
const plain = (value, seen = /* @__PURE__ */ new WeakSet()) => {
  if (value === null || typeof value != "object") {
    if (typeof value == "function" || typeof value == "symbol")
      throw Error("IPC \u53C2\u6570\u5305\u542B\u4E0D\u53EF\u5E8F\u5217\u5316\u7684\u503C");
    return value;
  }
  if (seen.has(value)) throw Error("IPC \u53C2\u6570\u4E0D\u80FD\u5305\u542B\u5FAA\u73AF\u5F15\u7528");
  seen.add(value);
  const copy = Array.isArray(value) ? value.map((v) => plain(v, seen)) : Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, plain(v, seen)])
  );
  return seen.delete(value), copy;
};
const request = (method, payload = {}) => {
  if (!globalThis.rebuild) throw Error("\u8BF7\u5728 OpenBrowser \u684C\u9762\u7A0B\u5E8F\u4E2D\u6253\u5F00");
  return globalThis.__localRequests?.push(method), globalThis.rebuild.request(method, plain(payload)).then((result) => {
    if (!result || result.ipcResult !== 1) return result;
    if (result.ok) return result.value;
    const detail = result.error || {}, error = new Error(detail.message || "Operation failed");
    throw detail.code !== void 0 && (error.code = detail.code), Array.isArray(detail.stale) && (error.stale = detail.stale), error;
  });
};
const ok = (data) => ({ code: 0, data, msg: "" });
const readLocalUserConfig = async () => {
  const saved = await request("settings:get");
  return globalThis.__localSettings = saved, globalThis.__applyLocalUserConfig?.(saved), saved;
};
const unavailable = (name) => {
  throw globalThis.__localUiError?.("\u6B64\u529F\u80FD\u5C1A\u672A\u5B8C\u6210\u672C\u5730\u63A5\u7EBF\uFF0C\u64CD\u4F5C\u672A\u6267\u884C\u3002"), Object.assign(Error("\u5C1A\u672A\u63A5\u7EBF: " + name), {
    code: "LOCAL_CHANNEL_UNIMPLEMENTED",
    localUiNotified: typeof globalThis.__localUiError == "function"
  });
};
globalThis.__localRequest = request;
globalThis.__localListenWindow = (type, callback, options) => {
  window.addEventListener(type, callback, options);
  const dispose = () => window.removeEventListener(type, callback, options);
  return currentScope() && onScopeDispose(dispose), dispose;
};
const opts = (values) => values.map((v) => ({ label: String(v), value: String(v) }));
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
  hardwareConcurrent: opts(["2", "4", "8", "12", "16"]),
  deviceMemory: opts(["2", "4", "8"]),
  webGLVendor: opts(["Google Inc. (Intel)"]),
  nettype: opts(["wifi", "ethernet"]),
  effectiveType: opts(["4g", "3g", "2g", "slow-2g"]),
  disableSslList: [
    { label: "TLS_AES_128_GCM_SHA256", value: "0x1301" },
    { label: "TLS_AES_256_GCM_SHA384", value: "0x1302" },
    { label: "TLS_CHACHA20_POLY1305_SHA256", value: "0x1303" }
  ]
};
globalThis.__loadLocalDictionary = async () => {
  const data = await request("host:dictionary"), names = new Intl.DisplayNames(["zh-CN"], { type: "language" });
  dictionary.language = data.languages.map((value) => ({
    label: names.of(value),
    value
  })), dictionary.timeZone = opts(data.timezones);
};
globalThis.__localDict = new Proxy(dictionary, { get: (o, k) => o[k] ?? [] });
const listeners = /* @__PURE__ */ new Map();
const emit = (channel, value) => {
  for (const fn of listeners.get(channel) || []) fn(value);
};
const opened = (v) => ({
  dirId: v.dirId,
  percent: 100,
  message: "\u6253\u5F00\u6210\u529F",
  warningMessages: []
});
globalThis.rebuild?.onEvent?.((event) => {
  (event.type === "profiles" || event.type === "status" && event.action === "profiles-update") && emit("local:profiles-change", event), event.type === "status" && event.id && (event.running ? emit("browser:launch-process-message", {
    code: 0,
    data: opened({ dirId: event.id })
  }) : emit("browser:on-close", [String(event.id)])), event.channel && emit(event.channel, event.payload), event.channel === "local:navigate" && globalThis.__router?.push(event.payload), event.channel === "local:error" && globalThis.__localUiError?.(event.payload);
});
const batch = async (ids, restart = !1) => Promise.all(
  ids.map(async (id) => {
    emit("browser:launch-process-message", {
      code: 0,
      data: { dirId: id, percent: 1, message: "\u542F\u52A8\u4E2D..." }
    });
    try {
      restart && await request("profiles:stop", { id });
      const result = await request("profiles:start", { id }), data = {
        ...opened({ dirId: id }),
        warningMessages: result.warningMessages || []
      };
      return emit("browser:launch-process-message", { code: 0, data }), { id, ok: !0 };
    } catch (error) {
      return emit("browser:launch-process-message", {
        code: 1,
        message: error.message,
        data: { dirId: id, percent: 0, message: error.message }
      }), { id, ok: !1, error: error.message, code: error.code };
    }
  })
);
const proxyRow = (v) => ({
  ...v,
  proxyType: 0,
  ipType: String(v.host || "").includes(":") ? "IPV6" : "IPV4",
  proxyUserName: v.username || "",
  proxyPassword: v.password || "",
  proxyCategory: String(v.protocol || "http").toUpperCase(),
  proxyMethod: "choose",
  moduleId: v.id,
  proxyRemark: v.remark,
  checkStatus: v.lastCheckOk === !0 ? 1 : v.lastCheckOk === !1 ? 2 : 0,
  countryCode: v.lastCountryCode || "",
  country: v.lastCountry || "",
  timeZone: v.lastTimezone || "",
  createTime: v.create_time,
  windowCount: v.bindList?.length || 0
});
const proxyInput = (v) => {
  const fields = plain(v);
  if (Object.hasOwn(v, "host"))
    for (const key of ["raw", "proxy", "proxyUrl", "url"]) delete fields[key];
  return {
    ...fields,
    protocol: String(v.protocol || v.proxyCategory || "http").toLowerCase(),
    username: v.proxyUserName ?? v.username,
    password: v.proxyPassword ?? v.password
  };
};
const proxyList = async (p) => {
  let rows = (await request("proxies:list", p)).map(proxyRow);
  const total = rows.length, size = Number(p?.page_size || 200), index = Number(p?.page_index || 1);
  return { rows: rows.slice((index - 1) * size, index * size), total };
};
globalThis.__localActionTrack = (action) => request("activity:append", { action: String(action || "") });
const methods = {
  userAnalysisWindowInfoCreate: (p) => request("profiles:analyse-import", p),
  userImportWindowInfoV2Create: (p) => request("profiles:import", p),
  userGetWindowInfoListList: async (p = {}) => {
    let rows = (await request(p?.isDelete ? "profiles:trash" : "profiles:list")).map((row) => ({
      ...row,
      projectName: row.projectId ? row.projectName : globalThis.$t("\u9ED8\u8BA4\u9879\u76EE")
    }));
    if (p?.windowName && (rows = rows.filter((r) => r.windowName.includes(p.windowName))), p?.openStatus && (rows = rows.filter((r) => r.openStatus)), p?.isOften && (rows = rows.filter((r) => r.isOften)), p?.projectId || p?.projectIds) {
      const ids = String(p.projectId || p.projectIds).split(",").map((id) => id === "local-default" ? "" : id);
      rows = rows.filter((r) => ids.includes(r.projectId));
    }
    if (p?.queryValue && (!p.queryKey || p.queryKey === "name_remark")) {
      const query2 = String(p.queryValue).toLowerCase();
      rows = rows.filter(
        (r) => (r.windowName + " " + r.windowRemark).toLowerCase().includes(query2)
      );
    }
    const values = (v) => Array.isArray(v) ? v.map(String) : String(v ?? "").split(",").filter(Boolean), query = String(p.queryValue || "").toLowerCase();
    if (query && p.queryKey) {
      const key = {
        name: "windowName",
        remark: "windowRemark",
        note: "windowRemark",
        sortNum: "windowSortNum",
        id: "windowSortNum"
      }[p.queryKey];
      key && (rows = rows.filter(
        (row) => String(row[key]).toLowerCase().includes(query)
      )), p.queryKey === "tag" && (rows = rows.filter(
        (row) => row.labelInfos.some(
          (label) => label.labelName.toLowerCase().includes(query)
        )
      ));
    }
    p.sortNums && (rows = rows.filter(
      (row) => values(p.sortNums).includes(String(row.windowSortNum))
    )), p.osList?.length && (rows = rows.filter((row) => values(p.osList).includes(row.os))), p.coreType?.length && (rows = rows.filter((row) => values(p.coreType).includes(row.coreType))), p.labelIds?.length && (rows = rows.filter(
      (row) => row.labelIds.some((id) => values(p.labelIds).includes(String(id)))
    )), p.windowRemark && (rows = rows.filter((row) => row.windowRemark.includes(p.windowRemark))), p.platformUrls?.length && (rows = rows.filter(
      (row) => row.windowPlatformList.some(
        (account) => values(p.platformUrls).some(
          (value) => String(account.platformUrl).includes(value)
        )
      )
    ));
    const ranges = Array.isArray(p.createTime) ? p.createTime : [p.startTime, p.endTime];
    if (ranges[0] && (rows = rows.filter(
      (row) => Date.parse(row.createdAt) >= Date.parse(ranges[0])
    )), ranges[1] && (rows = rows.filter(
      (row) => Date.parse(row.createdAt) <= Date.parse(ranges[1])
    )), p.orderName) {
      const key = {
        profile: "windowSortNum",
        profileName: "windowSortNum",
        windowSortNum: "windowSortNum",
        windowName: "windowName",
        openTime: "openTime",
        createTime: "createdAt",
        updateTime: "updatedAt"
      }[p.orderName];
      key && rows.sort((a, b) => {
        const left = a[key] ?? "", right = b[key] ?? "", result = typeof left == "number" && typeof right == "number" ? left - right : String(left).localeCompare(String(right));
        return /desc|^-1$/i.test(String(p.orderType)) ? -result : result;
      });
    }
    const total = rows.length, index = Number(p?.page_index ?? p?.pageIndex ?? 1), size = Number(p?.page_size ?? p?.pageSize ?? 10);
    return { rows: rows.slice((index - 1) * size, index * size), total };
  },
  userGetWindowInfoV2List: async (p) => {
    const ids = String(p.windowIds || p.id || p.windowId || "").split(",").filter(Boolean);
    return {
      rows: await Promise.all(
        ids.map((id) => request("profiles:read", { id }))
      ),
      total: ids.length
    };
  },
  userGetWindowInfoList: (p) => request("profiles:read", { id: p.id || p.windowId }),
  userAddWindowInfoV2Create: (p) => request("profiles:create", p),
  userMdfWindowInfoSingleV2Create: (p) => p.rev != null || p.coreType ? request("profiles:update", p) : request("profiles:patch", { ids: [p.id || p.windowId], patch: p }),
  userDelWindowInfoBatchCreate: (p) => request("profiles:delete", p),
  userMdfWindowSyncV2Create: async (p) => {
    const running = (await request("profiles:list")).filter(
      (v) => v.openStatus
    );
    if (p.some((v) => running.some((row) => row.id === v.id)))
      throw Error("\u8BF7\u5148\u5173\u95ED\u7A97\u53E3");
    return !0;
  },
  userMdfWindowDataBatchCreate: (p) => request("profiles:edit-data", p),
  userDelWindowInfoCreate: (p) => request("profiles:purge", p),
  userDelWindowInfoRecycleCreate: (p) => request("profiles:purge", p),
  userGetUaWebglV2List: (p) => request("fingerprint:preview", p),
  userGetDeviceNameV2List: (p) => request("fingerprint:preview", p),
  userGetMacAddrV2List: (p) => request("fingerprint:preview", p),
  userGetBrowserVersionInfoList: async () => (await request("kernels:list")).filter((v) => v.engine === "chromium").map((v) => ({ browserVersion: v.version.split("-")[0] })),
  userGetWindowStatusInfoCreate: async (p) => (await request("profiles:list")).filter((v) => p.ids.includes(v.id)),
  userRestoreWindowInfoCreate: (p) => request("profiles:restore", p),
  userCopyWindowInfoCreate: (p) => request("profiles:clone", p),
  userBatchWindowInfoV2Create: (p) => request("profiles:create-batch", p),
  userGetWindowSortNumList: async () => ({
    windowSortNum: (await request("profiles:list")).length + 1
  }),
  userGetWindowFilterNameListList: () => request("filters:list"),
  userUpdateWindowFilterNameCreate: (p) => request("filters:save", p),
  userAddWindowFilterNameCreate: (p) => request("filters:save", p),
  userDeleteWindowFilterNameCreate: (p) => request("filters:delete", p),
  userUpdateWindowFilterSortCreate: (p) => request("settings:set", { filterSort: p.sort_data }),
  userGetWindowTemplateListList: () => request("templates:list"),
  userAddWindowTemplateInfoCreate: (p) => request("templates:save", p),
  userMdfWindowTemplateInfoCreate: (p) => request("templates:save", p),
  userDeleteWindowTemplateInfoCreate: (p) => request("templates:delete", { ids: [p.id] }),
  userGetUserConfigList: readLocalUserConfig,
  userSetUserConfigCreate: async (p) => (await request("settings:set", p), readLocalUserConfig()),
  userGetUserApiList: () => request("api:get"),
  userSetUserApiCreate: (p) => request("api:set", p),
  userChangeUsernameCreate: (p) => {
    if (typeof p.userName != "string" || !p.userName.trim() || p.userName.length > 100) throw Error("\u672C\u5730\u540D\u79F0\u987B\u4E3A 1\u2013100 \u5B57");
    return request("settings:set", { localUserName: p.userName.trim() });
  },
  userGetProjectInfoByWorkspaceList: async (p = {}) => {
    const rows = await request("groups:list", p);
    return { rows, total: rows.length };
  },
  userGetPluginListList: (p) => request("extensions:list", p),
  userFixedPluginToWindowCreate: (p) => request("extensions:pin", p),
  userUploadChromePluginsV2Create: (p) => request("extensions:store", p),
  userUploadPluginInfoCreate: (p) => request("extensions:finish", p),
  userAddPluginToWindowCreate: (p) => request("extensions:assign", p),
  userGetPluginInfoByIdList: (p) => request("extensions:read", p),
  userCheckAllPluginsVersionList: (p) => request("extensions:reload", { ...p, check: !0 }),
  userUpgradePluginsCreate: (p) => request("extensions:reload", p),
  userBatchDelPluginInfoCreate: (p) => request("extensions:remove", p),
  userGetTopProjectInfoList: async () => {
    const rows = await request("groups:list", { default: 2, pinnedOnly: !0 });
    return { rows, total: rows.length };
  },
  userAddProjectInfoCreate: (p) => request("groups:save", p),
  userMdfProjectInfoCreate: (p) => request("groups:save", p),
  userDelProjectInfoCreate: (p) => request("groups:delete", { ids: [p.projectId] }),
  userMdfProjectSortCreate: (p) => request("groups:sort", p),
  userGetProxyListMergedList: proxyList,
  userGetProxyAllCountriesList: async () => [
    ...new Set(
      (await request("proxies:list")).map((v) => v.lastCountry).filter(Boolean)
    )
  ].map((v) => ({ label: v, value: v })),
  userGetProxyProvidersTypeList: () => ["\u672C\u5730"],
  userGetProxyVendorListList: async () => [
    ...new Set(
      (await request("proxies:list")).map((v) => v.vendor || "\u672C\u5730")
    )
  ].map((v) => ({ id: v, name: v })),
  userGetProxyTableSortOrderList: async () => (await request("settings:get")).proxyTableSort || {},
  userSaveProxyTableSortOrderCreate: (p) => request("settings:set", { proxyTableSort: p }),
  userGetProxyModuleListList: proxyList,
  userGetProxyModuleV2List: proxyList,
  userGetProxyModuleList: proxyList,
  userGetProxyDetailMergedList: async (p) => proxyRow(await request("proxies:read", p)),
  userGetRandomAvailableProxyMergedList: async () => {
    const rows = await request("proxies:list");
    return rows.length ? proxyRow(rows[Math.floor(Math.random() * rows.length)]) : null;
  },
  userBatchCheckProxyImportCreate: (p) => request("proxies:duplicates", p),
  userMdfProxyBindWindowCreate: (p) => request("proxies:bind", p),
  userBatchMdfProxyModuleCheckCreate: (p) => request("proxies:save-results", p),
  userMdfWindowProxyCheckBatchCreate: (p) => request("profiles:proxy-results", p),
  userAddProxyModuleV2Create: (p) => request("proxies:create-many", { items: p.proxyList.map(proxyInput) }),
  userMdfProxyModuleCreate: (p) => p.proxyList ? Promise.all(
    p.proxyList.map(
      (v) => request("proxies:update", {
        ...proxyInput(v),
        id: v.id || v.moduleId
      })
    )
  ) : request("proxies:update", { ...proxyInput(p), id: p.id || p.moduleId }),
  userDelProxyModuleV2Create: (p) => request("proxies:delete", { ids: p.ids || p.proxyIds || [p.id] }),
  userMdfWindowInfoBatchV2Create: (p) => Object.hasOwn(p, "isDelete") ? request(p.isDelete ? "profiles:delete" : "profiles:restore", {
    ids: p.ids
  }) : request("profiles:patch", { ids: p.ids || p.windowIds, patch: p }),
  userGetProjectListList: async () => ({ rows: await request("groups:list") }),
  userGetLabelInfoList: async () => {
    const rows = await request("labels:list");
    return { rows, total: rows.length };
  },
  userAddLabelInfoCreate: (p) => request("labels:save", p),
  userMdfLabelInfoCreate: (p) => request("labels:save", p),
  userDelLabelInfoCreate: (p) => request("labels:delete", p),
  userGetWindowPlatformAccountListList: async () => ({
    rows: [
      ...new Map(
        (await request("profiles:list")).flatMap((row) => row.windowPlatformList).filter((account) => account.platformUrl).map((account) => [
          account.platformUrl,
          { platformUrl: account.platformUrl }
        ])
      ).values()
    ]
  }),
  userGetPlatformInfoList: () => ({
    rows: [
      ["Google", "https://accounts.google.com"],
      ["Facebook", "https://facebook.com"],
      ["TikTok", "https://tiktok.com"],
      ["Amazon", "https://amazon.com"]
    ].map(([platformAbbr, platformUrl]) => ({
      platformAbbr,
      platformUrl,
      platformName: platformAbbr,
      platformIcon: "",
      platformIconDark: ""
    }))
  }),
  userGetPlatformInfoV2List: (p = {}) => request("accounts:list", p),
  userAddPlatformInfoCreate: (p) => request("accounts:create", { values: [p] }),
  userAddPlatformInfoBatchCreate: (p) => request("accounts:create", {
    values: Array.isArray(p) ? p : p.platformList
  }),
  userMdfPlatformInfoCreate: (p) => request("accounts:update", p),
  userMdfPlatformBindWindowCreate: (p) => request("accounts:bind", p),
  userDelPlatformInfoCreate: (p) => request("accounts:delete", p),
  userGetSearchEnginesList: () => [
    {
      code: "Google",
      name: "Google",
      url: "https://www.google.com/search?q={keyword}"
    },
    {
      code: "Bing",
      name: "Bing",
      url: "https://www.bing.com/search?q={keyword}"
    }
  ],
  userGetWindowTableSortOrderList: async () => (await request("settings:get")).tableSort || {},
  userSaveWindowTableSortOrderCreate: (p) => request("settings:set", { tableSort: p }),
  userCheckWindowTotalCountList: () => null,
  userGetQuickCreateTemplateList: async () => (await request("settings:get")).quickTemplate || null,
  userAddQuickCreateTemplateCreate: (p) => request("settings:set", { quickTemplate: { templateInfo: p } }),
  userMdfQuickCreateTemplateCreate: (p) => request("settings:set", { quickTemplate: { id: p.id, templateInfo: p } })
};
globalThis.__localApi = new Proxy(
  {},
  {
    get: (_, ns) => new Proxy(
      {},
      {
        get: (_2, method) => async (...args) => (globalThis.__localApiCalls?.push(
          String(ns) + "." + String(method)
        ), Object.hasOwn(methods, method) ? ok(await methods[method](...args)) : unavailable(String(ns) + "." + String(method)))
      }
    )
  }
);
const attachmentPreviews = /* @__PURE__ */ new Map();
globalThis.__attachmentPreviewPath = (value) => attachmentPreviews.get(value) || "";
const sends = {
  "api:getStatus": () => request("api:status"),
  "util:checkPort": (port) => request("api:check-port", { port }),
  "util:genApiKey": async () => (await globalThis.ops.rotateApiKey()).apiKey,
  "browser:createDesktopShortcut": (p) => request("host:shortcut", p),
  "browser:setAsDefaultBrowser": (p) => request("host:default-browser", p),
  "util:getCommonRequestHeaders": () => ({}),
  "extension:getSelectedExtensionInfo": (kind) => request("extensions:select", { kind }),
  "extension:stageLocal": (p) => request("extensions:stage", p),
  "extension:getExtensionInfo": (id) => request("extensions:exists", { id }),
  "extension:showExtensionDir": (id) => request("extensions:show", { id }),
  "extension:download": (rows) => request("extensions:verify", { ids: rows.map((row) => row.id || row.pluginDir) }),
  // The SDK removal already completed the native deletion; no second mutation.
  "extension:remove": (ids) => request("extensions:verify-removed", { ids }),
  "dialog:selectFileOrDirInfo": async () => {
    const chosen = await request("agent:files:choose");
    return chosen?.type === "file" && attachmentPreviews.set(chosen.path, chosen.files[0].url), chosen;
  },
  "app:downloadLocalFile": (payload) => request("agent:files:export", payload),
  "syncControl:open": async () => (await request("sync:restore", await request("settings:get")), globalThis.__router.push("/synchronizer")),
  "syncControl:close": async () => (await request("sync:shortcuts:clear"), globalThis.__router.push("/browser/list")),
  "syncControl:start": async (ids) => {
    await request("sync:restore", await request("settings:get"));
    const result = await globalThis.ops.startSync(plain(ids.filter(Boolean)));
    return await globalThis.__router.push("/synchronizer/active"), result;
  },
  "syncControl:stop": async () => {
    const result = await globalThis.ops.stopSync();
    return await globalThis.__router.push("/synchronizer"), result;
  },
  "syncControl:pause": async () => (await request("sync:shortcuts:clear"), globalThis.ops.stopSync()),
  "syncControl:resume": async () => (await request("sync:restore", await request("settings:get")), globalThis.ops.startSync(
    (await globalThis.ops.getSyncState()).selected
  )),
  "syncControl:getSyncWindowCount": async () => {
    const ids = (await globalThis.ops.getSyncState()).selected || [];
    return (await request("profiles:list")).filter(
      (row) => ids.includes(row.id) && row.openStatus
    ).length;
  },
  "syncControl:showAll": async () => globalThis.ops.windowAction(
    (await globalThis.ops.getSyncState()).selected,
    "normal",
    {}
  ),
  "syncControl:doLayout": (p) => request("sync:layout", p),
  "syncControl:openPreferencesDialog": (p) => request("ui:dialog:open", { kind: "preferences", ...p }),
  "syncControl:openBatchInputsDialog": (p) => request("ui:dialog:open", { kind: "batch-inputs", ...p }),
  "syncControl:openOpenSitesDialog": () => request("ui:dialog:open", { kind: "open-sites" }),
  "syncControl:openSyncingWindowListDialog": () => request("ui:dialog:open", { kind: "syncing-window-list" }),
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
  "syncControl:checkShortcutKeysIsOccupied": (p) => request("sync:shortcuts:check", p),
  "syncControl:registerShortcut": (p) => request("sync:shortcuts:register", p),
  ...Object.fromEntries(
    Object.entries({
      unifyTabs: "sync",
      closeOtherTabs: "closeOthers",
      closeCurrentTab: "close",
      closeBlankTabs: "closeBlank"
    }).map(([channel, action]) => [
      "syncControl:" + channel,
      async () => globalThis.ops.tabAction(
        (await globalThis.ops.getSyncState()).selected,
        action,
        {}
      )
    ])
  ),
  "syncControl:changeSyncSettings": (p) => request("sync:settings", p),
  "syncControl:getAllSyncingWindows": async () => {
    const ids = (await globalThis.ops.getSyncState()).selected || [];
    return (await request("profiles:list")).filter((row) => ids.includes(row.id)).map((row) => ({
      ...row,
      $pId: row.pid,
      platform: row.os,
      $canUseSyncControl: row.coreType === "Chrome"
    }));
  },
  "app:getMacAddress": () => request("host:mac"),
  "proxy:detect": (p) => request("proxies:detect", p),
  "proxy:detectNetwork": () => request("host:network"),
  "proxy:refreshUrl": (url) => request("proxies:refresh", { url }),
  "proxy:extract": (url) => request("proxies:extract", { url }),
  "proxy:export": (p) => request("proxies:export", Array.isArray(p) ? { ids: p } : p),
  "util:removeProject": () => !0,
  "browser:batchRemove": (ids) => request("profiles:purge", { ids }),
  "browser:clearCache": (p) => request("profiles:clear-cache", p),
  "browser:exportProfiles": (payload) => request("transfer:export", payload),
  "util:genRandomFingerprint": (p, count) => request("fingerprint:preview", { ...p, count }),
  "util:callRandomFingerprintFunc": async (functions) => {
    const f = (await request("fingerprint:preview"))[0]._openbrowser, values = {
      getwebGLNoiseValue: f.webgl.mark,
      getCanvasContextNoiseValue: f.canvas.mark,
      getClientRectsValue: f.clientRects,
      getSpeechSynthesis: f.speech.voices,
      getAllowFontList: f.fonts.list
    }, result = {};
    for (const k of Object.keys(functions)) {
      if (!Object.hasOwn(values, k)) throw Error("\u672A\u6620\u5C04\u6307\u7EB9\u51FD\u6570: " + k);
      result[k] = values[k];
    }
    return result;
  },
  "util:genRandomFonts": async () => (await request("fingerprint:preview"))[0]._openbrowser.fonts.list,
  "app:isMainWindow": () => !new URL(location.href).searchParams.has("dialog"),
  "app:showCurrentWebviewWindow": () => request("ui:dialog:show"),
  "app:resizeWindow": (p) => request("ui:dialog:resize", p),
  "app:getAppVersion": async () => (await globalThis.ops.getInfo()).appVersion,
  "app:getSoftConfig": () => request("settings:get"),
  "app:saveSoftConfig": (p) => request("settings:set", p),
  "app:getCoreList": async () => {
    const rows = (await request("kernels:list")).map((k) => ({
      coreType: k.engine === "firefox" ? "Firefox" : "Chrome",
      coreVersion: String(k.version).split(".")[0]
    }));
    return dictionary.coreVersion = opts([
      ...new Set(
        rows.filter((k) => k.coreType === "Chrome").map((k) => k.coreVersion)
      )
    ]), dictionary.firefoxCoreVersion = opts([
      ...new Set(
        rows.filter((k) => k.coreType === "Firefox").map((k) => k.coreVersion)
      )
    ]), rows;
  },
  "app:setSystemTheme": (p) => request("settings:set", { colorScheme: p }),
  "browser:getOpenedBrowser": async () => (await request("profiles:list")).filter((v) => v.openStatus).map((row) => ({
    ...row,
    platform: row.os,
    $canUseSyncControl: row.coreType === "Chrome"
  })),
  "browser:getOpenedBrowserMessage": async () => (await request("profiles:list")).filter((v) => v.openStatus).map(opened),
  "browser:batchLaunch": (ids) => batch(ids),
  "browser:startCookieRobot": (payload) => request("cookie-robot:start", payload),
  "browser:chunkBrowsersByScreen": async (ids) => {
    const result = await batch(ids), active = result.filter((v) => v.ok).map((v) => v.id);
    return active.length && await globalThis.ops.windowAction(active, "tile", {}), result;
  },
  "browser:openBatchLayout": async (p) => {
    const result = await batch(p.dirIds), active = result.filter((v) => v.ok).map((v) => v.id);
    return active.length && await globalThis.ops.windowAction(
      active,
      p.layout === "minimize" ? "minimized" : p.layout === "cascade" ? "cascade" : "tile",
      {}
    ), result;
  },
  "browser:batchRelaunch": (ids) => batch(ids, !0),
  "browser:batchClose": (ids) => Promise.all(ids.map((id) => request("profiles:stop", { id }))),
  "browser:isProcessExists": async (ids) => {
    const rows = await request("profiles:list");
    return ids.map((id) => !!rows.find((v) => v.id === String(id))?.openStatus);
  },
  "browser:open": (p) => request("profiles:start", { id: p.id || p.windowId || p.dirId || p }),
  "browser:close": (p) => request("profiles:stop", { id: p.id || p.windowId || p.dirId || p })
};
globalThis.electronAPI = {
  // Original File/clipboard/drop fallback uploads bytes through IPC. Renderer
  // paths never grant filesystem access; native selection grants snapshots.
  getPathForFile: () => "",
  send: async (channel, ...args) => Object.hasOwn(sends, channel) ? sends[channel](...args) : unavailable(String(channel)),
  invoke: async (channel, ...args) => Object.hasOwn(sends, channel) ? sends[channel](...args) : unavailable(String(channel)),
  on: (channel, callback) => {
    let set = listeners.get(channel);
    set || listeners.set(channel, set = /* @__PURE__ */ new Set()), set.add(callback);
    const probe = globalThis.__localSubscriptions ? { channel, active: !0 } : null;
    probe && globalThis.__localSubscriptions.push(probe);
    const unsubscribe = () => {
      set.delete(callback), set.size || listeners.delete(channel), probe && (probe.active = !1);
    };
    return currentScope() && onScopeDispose(unsubscribe), unsubscribe;
  }
};
globalThis.__agentRequest = (method, payload = {}) => request("agent:" + method, payload);
const agentCall = (method, ...args) => method === "getFileUrl" ? "obui://app/agent-files/" + encodeURIComponent(args[0]) : method === "fileToBase64" ? new Promise((resolve, reject) => {
  if (!(args[0] instanceof Blob) || args[0].size > 10 * 1024 * 1024)
    return reject(Error("\u5355\u4E2A\u9644\u4EF6\u4E0D\u80FD\u8D85\u8FC7 10 MiB"));
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] || ""), reader.onerror = () => reject(reader.error || Error("\u9644\u4EF6\u8BFB\u53D6\u5931\u8D25")), reader.readAsDataURL(args[0]);
}) : method === "markConversationRead" ? globalThis.__agentRequest(method, { id: args[0], runId: args[1] }) : method === "uploadFile" ? globalThis.__agentRequest(method, {
  data: args[0],
  mimeType: args[1],
  fileName: args[2],
  conversationId: args[3]
}) : [
  "conversationDetail",
  "deleteConversation",
  "resume",
  "runTask",
  "stopTaskLog",
  "deleteTaskLog"
].includes(method) ? globalThis.__agentRequest(method, { id: args[0], ...args[1] }) : method === "updateConversation" ? globalThis.__agentRequest(method, { id: args[0], title: args[1] }) : globalThis.__agentRequest(method, args[0] || {});
globalThis.__localAgentApi = new Proxy(
  {},
  {
    get: (_, key) => ["templates", "userTemplates", "userTasks", "officialScripts"].includes(
      key
    ) ? new Proxy(
      {},
      {
        get: (_2, method) => async (...args) => {
          if (method === "uploadUserTemplateSkill") {
            const file = args[0]?.file;
            if (!(file instanceof Blob) || file.size > 16 * 1024 * 1024)
              throw Error("Skill \u538B\u7F29\u5305\u4E0D\u80FD\u8D85\u8FC7 16 MiB");
            const data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result).split(",")[1] || ""), reader.onerror = () => reject(reader.error || Error("Skill \u6587\u4EF6\u8BFB\u53D6\u5931\u8D25")), reader.readAsDataURL(file);
            });
            return globalThis.__agentRequest(key + "." + method, { filename: file.name, data });
          }
          const payload = typeof args[0] == "number" || typeof args[0] == "string" ? { id: args[0], ...args[1] } : /^(list|get)/.test(method) ? args[0] || {} : Object.assign({}, args[0], args[1]), result = await globalThis.__agentRequest(key + "." + method, payload);
          return /^(top|untop)/.test(method) ? result.data : result;
        }
      }
    ) : key === "ensureAgentReady" ? () => globalThis.__agentRequest("info") : key === "initializeAgentBackendAuth" ? async () => ({ transport: "ipc" }) : (...args) => agentCall(key, ...args)
  }
);
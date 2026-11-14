"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { sanitizeProfile } = require("../engine/profile-sanitizer");
const { nextRecordId, rememberRecordIds } = require("./local-record-ids");
const { profileRelations } = require("./profile-relations");
const uid = () => crypto.randomUUID();
const object = (v) => v && typeof v === "object" && !Array.isArray(v);
const clone = (v) => structuredClone(v);
function fromRoxy(v, base = {}) {
  const first = v.windowPlatformList?.[0];
  const proxy = v.proxyInfoList?.[0] || (v.host || v.moduleId ? v : null);
  const mapped = {
    ...base,
    id: base.id || uid(),
    name: String(v.windowName ?? base.name ?? "未命名窗口"),
    number: Number(v.sortNum ?? base.number ?? 1),
    browser: "Google Chrome",
    engine: v.coreType
      ? v.coreType === "Firefox"
        ? "firefox"
        : v.coreType === "Chrome"
          ? "chromium"
          : (() => {
              throw Error("不支持的浏览器内核类型");
            })()
      : base.engine || "chromium",
    osVersion: v.osVersion ?? base.osVersion,
    engineVersion: v.useLatestCore
      ? "latest"
      : (v.coreVersion ?? base.engineVersion),
    fingerprintVersion: base.fingerprintVersion || 2,
    os: v.os ?? base.os ?? "Windows",
    language: v.displayLanguage ?? v.language ?? base.language ?? "en-US",
    note: v.windowRemark ?? base.note ?? "",
    groupId: String(
      Object.hasOwn(v, "projectId")
        ? (v.projectId === 'local-default' ? '' : (v.projectId ?? ""))
        : (base.groupId ?? ""),
    ),
    group_name:
      Object.hasOwn(v, "projectId") &&
      String(v.projectId ?? "") !== String(base.groupId ?? "")
        ? ""
        : base.group_name,
    cookies: Object.hasOwn(v, "cookie")
      ? typeof v.cookie === "string"
        ? v.cookie
        : JSON.stringify(v.cookie ?? [])
      : (base.cookies ?? ""),
    userAgent: v.userAgent ?? base.userAgent ?? "",
    favorite: v.isOften ?? base.favorite,
    width: v.openWidth ?? base.width,
    height: v.openHeight ?? base.height,
    privacy: { ...base.privacy, webRTC: v.webRTC ?? base.privacy?.webRTC },
    advanced: { ...base.advanced },
  };
  if (Array.isArray(v.windowPlatformList)) {
    if (v.windowPlatformList.length > 20)
      throw Error("每个窗口最多 20 个平台账号");
    mapped.startUrl = first?.platformUrl || "";
    mapped.platform = {
      ...base.platform,
      startUrl: first?.platformUrl || "",
      username: first?.platformUserName || "",
      password: first?.platformPassword || "",
      totpSecret: first?.platformEfa || "",
      accounts: v.windowPlatformList.map((a) => ({
        ...(a.accountId && a.id ? { accountId: String(a.accountId) } : {}),
        url: a.platformUrl,
        username: a.platformUserName,
        password: a.platformPassword,
        totpSecret: a.platformEfa,
      })),
    };
  }
  if (proxy) {
    mapped.networkMode = "proxy";
    mapped.proxyId = String(proxy.moduleId || proxy.id || "");
    mapped.proxy =
      proxy.raw || proxy.proxyUrl || proxy.url || base.proxy || "Direct";
    if (proxy.host) {
      const host = String(proxy.host).includes(":")
        ? "[" + String(proxy.host).replace(/^\[|\]$/g, "") + "]"
        : String(proxy.host);
      const port = Number(proxy.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw Error("Invalid proxy port");
      const url = new URL(
        (proxy.protocol || proxy.proxyCategory || proxy.type || "http") +
          "://" +
          host +
          ":" +
          port,
      );
      url.username = proxy.username || proxy.proxyUserName || "";
      url.password = proxy.password || proxy.proxyPassword || "";
      const auth =
        url.username || url.password
          ? url.username + ":" + url.password + "@"
          : "";
      mapped.proxy = url.protocol + "//" + auth + host + ":" + port;
    }
  }
  if (
    v.proxyCategory === "noproxy" ||
    proxy?.proxyCategory === "noproxy" ||
    proxy?.isDirect === true
  ) {
    mapped.networkMode = "direct";
    mapped.proxy = "Direct";
    mapped.proxyId = "";
  }
  const privacyMap = {
    isDisplayLanguageBaseIp: "langFromIp",
    isTimeZone: "timezoneFromIp",
    isPositionBaseIp: "geoFromIp",
    hardwareConcurrent: "cores",
    deviceMemory: "memory",
    deviceName: "deviceName",
    portScanProtect: "portScanProtect",
    portScanList: "portScanAllow",
    randomFingerprint: "refreshFingerprintOnStart",
    latitude: "latitude",
    longitude: "longitude",
    precisionPos: "accuracy",
  };
  const advancedMap = {
    syncCookie: "syncCookiesOnClose",
    syncIndexedDb: "syncIndexedDB",
    syncLocalStorage: "syncLocalStorage",
    syncSessionStorage: "syncSessionStorage",
    syncPassword: "syncPasswords",
    syncExtensions: "syncExtensionData",
    syncTab: "syncTab",
    syncHistory: "syncHistory",
    clearCacheFile: "clearCacheOnStart",
    clearCookie: "clearCookiesOnStart",
    clearLocalStorage: "clearLocalStorageOnStart",
    stopOpenNet: "stopOpenNet",
    stopOpenIP: "stopOpenIPChange",
    stopOpenPosition: "stopOpenIPCountryChange",
    openBookmarks: "showBookmarkBar",
  };
  for (const [source, target] of Object.entries(privacyMap))
    if (Object.hasOwn(v, source)) mapped.privacy[target] = v[source];
  if (Object.hasOwn(v, "isDisplayLanguageBaseIp"))
    mapped.privacy.languageMode = v.isDisplayLanguageBaseIp ? "ip" : "profile";
  if (Object.hasOwn(v, "language"))
    mapped.privacy.uiLanguage = v.isLanguageBaseIp ? "ip" : v.language;
  if (Object.hasOwn(v, "positionSwitch"))
    mapped.privacy.fullscreen = !v.positionSwitch;
  const positions = {
    "0,0": "tl",
    "0.5,0": "tm",
    "1,0": "tr",
    "0,0.5": "ml",
    "0.5,0.5": "mm",
    "1,0.5": "mr",
    "0,1": "bl",
    "0.5,1": "bm",
    "1,1": "br",
  };
  if (Object.hasOwn(v, "windowRatioPosition")) {
    const pair = String(v.windowRatioPosition)
      .split(",")
      .slice(0, 2)
      .map(Number)
      .join(",");
    if (!positions[pair]) throw Error("无效的窗口位置");
    mapped.privacy.windowPos = positions[pair];
  }
  for (const [source, target] of Object.entries(advancedMap))
    if (Object.hasOwn(v, source)) mapped.advanced[target] = v[source];
  // The legacy field names say 'forbid', but the actual radio labels use true = 开启.
  for (const [source, target] of Object.entries({
    forbidMedia: "blockVideo",
    forbidAudio: "blockSound",
  }))
    if (Object.hasOwn(v, source)) mapped.advanced[target] = !v[source];
  if(Object.hasOwn(v,'forbidImage')||Object.hasOwn(v,'forbiddenPictureSize')){
    const enabled=Object.hasOwn(v,'forbidImage')?v.forbidImage===true:!(base.advanced?.blockImages||base.advanced?.imageMaxBytes);
    const kb=Number(v.forbiddenPictureSize??((base.advanced?.imageMaxBytes||0)/1024));
    if(!Number.isFinite(kb)||kb<0||kb>8192)throw Error('图片大小范围为 0–8192 KB');
    mapped.advanced.blockImages=!enabled&&kb===0;
    mapped.advanced.imageMaxBytes=enabled?0:Math.floor(kb*1024);
  }
  for (const [source, target] of Object.entries({
    canvas: "canvas",
    webGL: "webgl",
    audioContext: "audio",
    clientRects: "clientRects",
    speechVoices: "speech",
  }))
    if (Object.hasOwn(v, source))
      mapped.privacy[target] = v[source] ? "noise" : "real";
  if (Object.hasOwn(v, "webRTC"))
    mapped.privacy.webrtc = { 0: "proxy", 1: "real", 2: "disabled" }[v.webRTC];
  if (Object.hasOwn(v, "webGLInfo"))
    mapped.privacy.webglMeta = { 0: "real", 1: "noise", 2: "custom" }[
      v.webGLInfo
    ];
  if (Object.hasOwn(v, "webGpu"))
    mapped.privacy.webgpu = v.webGpu === "block" ? "blocked" : v.webGpu;
  if (Object.hasOwn(v, "doNotTrack")) mapped.privacy.dnt = v.doNotTrack;
  if (Object.hasOwn(v, "position"))
    mapped.privacy.geoPermission = { 0: "prompt", 1: "allow", 2: "deny" }[
      v.position
    ];
  if (Object.hasOwn(v, "isTimeZone"))
    mapped.privacy.timezoneMode = v.isTimeZone ? "ip" : "custom";
  if (Object.hasOwn(v, "isPositionBaseIp"))
    mapped.privacy.geoMode = v.isPositionBaseIp ? "ip" : "custom";
  if (Object.hasOwn(v, "deviceInfo"))
    mapped.privacy.mediaDevices = v.deviceInfo ? "noise" : "real";
  if (Object.hasOwn(v, "deviceNameSwitch"))
    mapped.privacy.deviceNameMode = v.deviceNameSwitch ? "custom" : "real";
  if (Object.hasOwn(v, "macInfo"))
    mapped.privacy.macMode = v.macInfo ? "custom" : "real";
  if (Object.hasOwn(v, "openBattery")) {
    mapped.privacy.battery = v.openBattery ? "noise" : "real";
    mapped.privacy.batterySnapshot = v.openBattery
      ? {
          charging: !!v.openCharging,
          chargingTime: v.chargingTime,
          dischargingTime: v.dischargingTime,
          level: v.level,
        }
      : null;
  }
  const fp = { ...mapped.privacy.fingerprint };
  if (Object.hasOwn(v, "webGLManufacturer"))
    fp.webglVendor = v.webGLManufacturer;
  if (Object.hasOwn(v, "webGLRender")) fp.webglRenderer = v.webGLRender;
  if (Object.hasOwn(v, "openBluetooth"))
    fp.bluetooth = v.openBluetooth && !v.bluetoothAdapter ? "blocked" : "real";
  if (Object.hasOwn(v, "openNetwork")) {
    fp.networkMode = v.openNetwork ? "noise" : "real";
    if (v.openNetwork)
      fp.network = {
        type: v.networkType,
        effectiveType: v.networkSpeed,
        downlink: v.downloadSpeed,
        downlinkMax: v.maxDownloadSpeed,
        rtt: v.latency,
        saveData: v.saveFlowMode===true,
      };
  }
  if (Object.hasOwn(v, "disableSsl"))
    fp.sslBlacklist =
      v.disableSsl && Array.isArray(v.disableSslList)
        ? v.disableSslList.join(",")
        : "";
  if (Object.hasOwn(v, "font"))
    fp.fonts = String(v.font || "")
      .split(";")
      .map((name) => name.trim())
      .filter(Boolean);
  else if (Object.hasOwn(v, "fontList")) fp.fonts = v.fontList;
  if (Object.keys(fp).length) mapped.privacy.fingerprint = fp;
  for (const [source, target] of Object.entries({
    blockDomainList: "blockUrls",
    allowDomainList: "allowUrls",
    sessionStorages: "sessionStorages",
    syncBookmark: "uploadBookmarks",
  }))
    if (Object.hasOwn(v, source))
      mapped.advanced[target] = Array.isArray(v[source])
        ? v[source].join("\n")
        : v[source];
  if (v.timeZone)
    mapped.privacy.timezone = String(v.timeZone).trim().split(/\s+/).at(-1);
  if (Array.isArray(v.defaultOpenUrl)) {
    mapped.startUrl = v.defaultOpenUrl[0] || "";
    mapped.advanced.startUrls = v.defaultOpenUrl.join("\n");
  }
  for (const key of ["openWorkbench", "ipChangeRemind"])
    if (Object.hasOwn(v, key)) mapped.advanced[key] = String(v[key]);
  if (Object.hasOwn(v, "enableGoogleLogin"))
    mapped.advanced.googleLogin = String(v.enableGoogleLogin);
  if (Object.hasOwn(v, "forbidSavePassword"))
    mapped.advanced.promptSavePassword = !v.forbidSavePassword;
  if (Object.hasOwn(v, "resolutionX"))
    mapped.privacy.fingerprint = {
      ...mapped.privacy.fingerprint,
      screenWidth: Number(v.resolutionX),
    };
  if (Object.hasOwn(v, "resolutionY"))
    mapped.privacy.fingerprint = {
      ...mapped.privacy.fingerprint,
      screenHeight: Number(v.resolutionY),
    };
  if (Object.hasOwn(v, "startupParam")) {
    const tokens = String(v.startupParam)
      .split(/[;\r\n]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (
      tokens.some(
        (x) => !/^--[a-z0-9][a-z0-9._-]*(=[^\s;'"]{0,500})?$/i.test(x),
      )
    )
      throw Error("启动参数须每行一个有效的 --flag 或 --flag=value");
    mapped.privacy.customArgs = tokens.join("\n");
  }
  for (const [source, target] of Object.entries({
    useGpu: "hardwareAcceleration",
    sandboxPermission: "noSandbox",
    macAddr: "mac",
  }))
    if (Object.hasOwn(v, source))
      mapped.privacy[target] =
        source === "useGpu" ? (v[source] ? "on" : "off") : v[source];
  if (Object.hasOwn(v, "fontType"))
    mapped.privacy.fontListMode = v.fontType ? "noise" : "real";
  if (Object.hasOwn(v, "labelIds")) {
    if (
      !Array.isArray(v.labelIds) ||
      v.labelIds.some((id) => !Number.isInteger(Number(id)) || Number(id) < 1)
    )
      throw Error("无效的标签");
    mapped.tag = [...new Set(v.labelIds.map(Number))].join(",");
    if (mapped.tag.length > 40) throw Error("标签数量超过本地配置可保存的长度");
  }
  if (Object.hasOwn(v, "resolutionType"))
    mapped.privacy.resolutionMode = v.resolutionType ? "" : "real";
  if (v.searchEngine)
    mapped.privacy.searchEngine = String(v.searchEngine).toLowerCase();
  return sanitizeProfile(mapped);
}
function toRoxy(p) {
  let proxy = {};
  if (p.networkMode === "proxy" && p.proxy) {
    try {
      const parsed = require("../proxy-forwarder").parseProxy(p.proxy);
      proxy = {
        moduleId: p.proxyId || 0,
        proxyMethod: p.proxyId ? "choose" : "custom",
        proxyCategory: parsed.protocol.toUpperCase(),
        protocol: parsed.protocol.toUpperCase(),
        host: parsed.host,
        port: parsed.port,
        proxyUserName: parsed.username,
        proxyPassword: parsed.password,
        buyProxyType: 0,
        ipType: parsed.host.includes(":") ? "IPV6" : "IPV4",
      };
    } catch (error) {
      proxy = {
        proxyInvalid: true,
        proxyError: error.message,
        moduleId: p.proxyId || 0,
        proxyMethod: "custom",
        proxyCategory: "HTTP",
        protocol: "HTTP",
        host: "",
        port: "",
      };
    }
  }
  return {
    ...p,
    id: p.id,
    windowId: p.id,
    dirId: p.id,
    workspaceId: "local",
    workspaceName: "OpenBrowser",
    windowName: p.name,
    windowSortNum: p.number,
    windowRemark: p.note,
    remark: p.note,
    projectId: p.groupId,
    projectName: p.group_name || "",
    labelIds: /^\d+(,\d+)*$/.test(p.tag || "")
      ? p.tag.split(",").map(Number)
      : [],
    labelInfos: [],
    openStatus: !!p.running,
    openLimitStatus: !p.trashed,
    statusInfo: p.running
      ? [{ openUserId: "local", openUserName: "OpenBrowser" }]
      : [],
    coreType: p.engine === "firefox" ? "Firefox" : "Chrome",
    coreVersion: p.engineVersion || "",
    disableSsl: !!p.privacy?.fingerprint?.sslBlacklist,
    disableSslList: (p.privacy?.fingerprint?.sslBlacklist || "")
      .split(",")
      .filter(Boolean),
    os: p.os,
    cookie: p.cookies,
    windowPlatformList: (
      p.platform?.accounts || (p.platform ? [p.platform] : [])
    ).map((a) => ({
      platformUrl: a.url || a.startUrl || p.platform?.startUrl,
      platformUserName: a.username,
      platformPassword: a.password,
      platformEfa: a.totpSecret,
      ...(a.accountId ? { id: a.accountId, accountId: a.accountId } : {}),
    })),
    lastIp: p.exitCheckedAt ? p.exitIp || "" : p.network?.ip || p.exitIp || "",
    lastCountry: p.network?.countryCode || p.exitCountryCode || "",
    lastCity: p.network?.city || "",
    timezone: p.network?.timezone || p.exitTimezone || "",
    checkTime: p.exitCheckedAt || "",
    checkStatus: p.exitCheckedAt ? (p.exitIp ? 1 : 2) : 0,
    openTime: p.lastOpenedAt,
    createTime: p.createdAt,
    email: "本地",
    updateTime: p.trashedAt?.replace("T", " ").slice(0, 19) || "",
    remaining: "永久保留",
    sortNum: p.number,
    name: p.name,
    isOften: !!p.favorite,
    proxyCategory: p.networkMode === "proxy" ? proxy.proxyCategory : "noproxy",
    proxyInfoList:
      p.networkMode === "proxy"
        ? [{ ...proxy, id: p.proxyId, raw: p.proxy, proxyUrl: p.proxy }]
        : [],
    ...proxy,
    defaultOpenUrl: String(p.advanced?.startUrls || p.startUrl || "")
      .split("\n")
      .filter(Boolean),
    startupParam: p.privacy?.customArgs || "",
    sandboxPermission: !!p.privacy?.noSandbox,
    useGpu: p.privacy?.hardwareAcceleration !== "off",
    isDisplayLanguageBaseIp: !!p.privacy?.langFromIp,
    isLanguageBaseIp: p.privacy?.uiLanguage === "ip",
    language:
      p.privacy?.uiLanguage === "ip"
        ? p.language
        : p.privacy?.uiLanguage || p.language,
    isTimeZone: p.privacy?.timezoneMode === "ip",
    timeZone: p.privacy?.timezone || "UTC",
    isPositionBaseIp: !!p.privacy?.geoFromIp,
    displayLanguage: p.language,
    openWidth: p.width,
    openHeight: p.height,
    positionSwitch: !p.privacy?.fullscreen,
    windowRatioPosition:
      {
        tl: "0,0,tl",
        tm: "0.5,0,tl",
        tr: "1,0,tr",
        ml: "0,0.5,tl",
        mm: "0.5,0.5,tl",
        mr: "1,0.5,tr",
        bl: "0,1,bl",
        bm: "0.5,1,bl",
        br: "1,1,br",
      }[p.privacy?.windowPos] || "0,0,tl",
    fontType: p.privacy?.fontListMode !== "real",
    fontList: p.privacy?.fingerprint?.fonts || [],
    font: (p.privacy?.fingerprint?.fonts || []).join(";"),
    longitude: p.privacy?.longitude,
    latitude: p.privacy?.latitude,
    precisionPos: p.privacy?.accuracy,
    webGLInfo: { real: 0, noise: 1, custom: 2 }[p.privacy?.webglMeta] ?? 1,
    webGLManufacturer: p.privacy?.fingerprint?.webglVendor,
    webGLRender: p.privacy?.fingerprint?.webglRenderer,
    webGpu: p.privacy?.webgpu === "blocked" ? "block" : p.privacy?.webgpu,
    doNotTrack: p.privacy?.dnt,
    deviceInfo: p.privacy?.mediaDevices !== "real",
    deviceNameSwitch: p.privacy?.deviceNameMode !== "real",
    deviceName: p.privacy?.deviceName,
    macInfo: p.privacy?.macMode === "custom",
    macAddr: p.privacy?.mac,
    portScanProtect: p.privacy?.portScanProtect,
    portScanList: p.privacy?.portScanAllow,
    openBattery: p.privacy?.battery !== "real",
    openCharging: p.privacy?.batterySnapshot?.charging,
    chargingTime: p.privacy?.batterySnapshot?.chargingTime,
    dischargingTime: p.privacy?.batterySnapshot?.dischargingTime,
    level: p.privacy?.batterySnapshot?.level,
    openNetwork: p.privacy?.fingerprint?.networkMode === "noise",
    networkType: p.privacy?.fingerprint?.network?.type,
    networkSpeed: p.privacy?.fingerprint?.network?.effectiveType,
    downloadSpeed: p.privacy?.fingerprint?.network?.downlink,
    maxDownloadSpeed: p.privacy?.fingerprint?.network?.downlinkMax,
    latency: p.privacy?.fingerprint?.network?.rtt,
    saveFlowMode: p.privacy?.fingerprint?.network?.saveData===true,
    openBluetooth: p.privacy?.fingerprint?.bluetooth === "blocked",
    bluetoothAdapter: p.privacy?.fingerprint?.bluetooth !== "blocked",
    searchEngine: p.privacy?.searchEngine,
    forbidAudio: !p.advanced?.blockSound,
    forbidMedia: !p.advanced?.blockVideo,
    forbidImage: !(p.advanced?.blockImages||p.advanced?.imageMaxBytes),
    forbiddenPictureSize: p.advanced?.blockImages?0:p.advanced?.imageMaxBytes?p.advanced.imageMaxBytes/1024:Number(p.prefs?.roxy?.forbiddenPictureSize)||0,
    randomFingerprint: p.privacy?.refreshFingerprintOnStart,
    forbidSavePassword: !p.advanced?.promptSavePassword,
    openWorkbench: Number(p.advanced?.openWorkbench),
    ipChangeRemind: Number(p.advanced?.ipChangeRemind),
    enableGoogleLogin: Number(p.advanced?.googleLogin),
    syncBookmark: p.advanced?.uploadBookmarks,
    sessionStorages: p.advanced?.sessionStorages,
    blockDomainList: p.advanced?.blockUrls?.split("\n").filter(Boolean) || [],
    allowDomainList: p.advanced?.allowUrls?.split("\n").filter(Boolean) || [],
    hardwareConcurrent: p.privacy?.cores,
    deviceMemory: p.privacy?.memory,
    webRTC: { proxy: 0, real: 1, disabled: 2 }[p.privacy?.webrtc] ?? 2,
    position: { prompt: 0, allow: 1, deny: 2 }[p.privacy?.geoPermission] ?? 0,
    resolutionType: p.privacy?.resolutionMode !== "real",
    resolutionX: p.privacy?.fingerprint?.screenWidth,
    resolutionY: p.privacy?.fingerprint?.screenHeight,
    ...Object.fromEntries(
      Object.entries({
        canvas: "canvas",
        webGL: "webgl",
        audioContext: "audio",
        clientRects: "clientRects",
        speechVoices: "speech",
      }).map(([k, v]) => [k, p.privacy?.[v] !== "real"]),
    ),
    ...Object.fromEntries(
      Object.entries({
        syncCookie: "syncCookiesOnClose",
        syncIndexedDb: "syncIndexedDB",
        syncLocalStorage: "syncLocalStorage",
        syncSessionStorage: "syncSessionStorage",
        syncPassword: "syncPasswords",
        syncExtensions: "syncExtensionData",
        syncTab: "syncTab",
        syncHistory: "syncHistory",
        clearCacheFile: "clearCacheOnStart",
        clearCookie: "clearCookiesOnStart",
        clearLocalStorage: "clearLocalStorageOnStart",
        stopOpenNet: "stopOpenNet",
        stopOpenIP: "stopOpenIPChange",
        stopOpenPosition: "stopOpenIPCountryChange",
        openBookmarks: "showBookmarkBar",
      }).map(([k, v]) => [k, p.advanced?.[v]]),
    ),
  };
}
class LocalService {
  constructor({
    engine,
    root,
    dialog,
    window,
    proxyStore,
    accountStore,
    automation,
    beforeRemove,
    isSynchronizing,
  }) {
    Object.assign(this, {
      engine,
      root,
      dialog,
      window,
      proxyStore,
      accountStore,
      automation,
      beforeRemove,
    });
    this.queue = Promise.resolve();
    this.extensions = new (require("./extensions").Extensions)(this);
    this.robot = new (require("./cookie-robot").CookieRobot)({
      root,
      engine,
      isSynchronizing,
      notify: (job) =>
        this.request("notifications:append", {
          title: "Cookie Robot",
          message: `${this.engine.profiles.get(job.profileId)?.name || job.profileId}: ${job.status}${job.error ? " — " + job.error : ""}`,
        }),
    });
    this.agent = new (require("./agent-service").AgentService)({
      root,
      engine,
      dialog,
      window,
      localRequest: (method, payload) => this.request(method, payload),
    });
    this.revisions = new Map();
    this.file = path.join(root, "rebuild-local.json");
  }
  resolveInputs(input) {
    const p = clone(input);
    const proxy = p.proxyInfoList?.[0] || p;
    const proxyId =
      proxy.moduleId || (proxy.proxyCategory !== "noproxy" && proxy.id);
    if (proxyId && (p.proxyInfoList?.length || p.moduleId)) {
      const record = this.proxyStore?.().get(String(proxyId));
      if (!record) throw Error("所选代理不存在，请重新选择");
      p.proxyInfoList = [{ ...record, moduleId: record.id }];
    }
    const accountIds = p.platformUrlIds || [];
    if (!Array.isArray(accountIds)) throw Error("平台账号 ID 必须是数组");
    if (accountIds.length) {
      const store = this.accountStore?.();
      if (!store) throw Error("账号库尚未就绪");
      // Resolve only explicitly selected IDs in the main process. List DTOs are redacted.
      p.windowPlatformList = [
        ...(p.windowPlatformList || []).filter(
          (row) => !accountIds.includes(row.accountId || row.id),
        ),
        ...accountIds.map((id) => {
          const account = store.get(String(id));
          return {
            accountId: account.id,
            id: account.id,
            platformUrl: account.url,
            platformUserName: account.username,
            platformPassword: account.password,
            platformEfa: account.totpSecret,
          };
        }),
      ];
    }
    return p;
  }
  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.loadOnce();
    return this.loadPromise;
  }
  async loadOnce() {
    if (this.data) return;
    try {
      this.data = JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      this.data = {
        version: 1,
        groups: [],
        templates: [],
        filters: [],
        settings: {},
        skills: [],
        tasks: [],
      };
    }
    if (this.data.version !== 1) throw Error("Unsupported local store version");
    // The old renderer kept group labels in its own origin's localStorage.
    // Recover groups still referenced by original backend profiles on first load.
    let migrated = false;
    for (const profile of this.engine.status()) {
      if (
        profile.groupId &&
        !this.data.groups.some((group) => group.id === profile.groupId)
      ) {
        this.data.groups.push({
          id: profile.groupId,
          project_id: profile.groupId,
          projectName: profile.group_name || profile.groupId,
        });
        migrated = true;
      }
    }
    if (migrated) await this.save();
  }
  async save() {
    const content = JSON.stringify(this.data, null, 2),
      tmp = this.file + "." + uid() + ".tmp";
    await fs.mkdir(this.root, { recursive: true });
    await fs.writeFile(tmp, content, { mode: 0o600 });
    await fs.rename(tmp, this.file);
  }
  decorate(profile) {
    const row = toRoxy(profile);
    const labelInfo = (this.data.labels || [])
      .filter((label) => row.labelIds.includes(label.id))
      .map((label) => ({
        labelId: String(label.id),
        labelName: label.name,
        labelColor: label.color,
      }));
    return {
      ...row,
      projectName:
        this.data.groups.find((group) => group.id === profile.groupId)
          ?.projectName ||
        profile.group_name ||
        "",
      labelInfo,
      labelInfos: labelInfo,
    };
  }
  request(method, payload = {}) {
    if (method.startsWith("cookie-robot:"))
      return this.load().then(() =>
        this.robot.request(method.slice(13), payload),
      );
    if (method.startsWith("agent:"))
      return this.agent.request(method.slice(6), payload);
    // The original engine owns process/proxy concurrency. Do not hold local JSON
    // writes or status reads behind a long browser launch or network probe.
    if (
      [
        "profiles:start",
        "profiles:stop",
        "profiles:list",
        "profiles:read",
        "profiles:choose-import",
        "profiles:trash",
        "proxies:detect",
        "proxies:extract",
        "proxies:refresh",
        "proxies:list",
        "proxies:read",
        "host:dictionary",
        "host:network",
        "host:mac",
        "kernels:list",
      ].includes(method)
    )
      return this.load().then(() => this.dispatch(method, payload));
    // Serializing local mutations prevents lost updates; failures never poison the queue.
    const run = this.queue.then(async () => {
      await this.load();
      const previous = clone(this.data);
      try {
        return await this.dispatch(method, payload);
      } catch (error) {
        this.data = previous;
        throw error;
      }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  async dispatch(method, p) {
    const e = this.engine;
    if (method.startsWith('api:')) return require('./local-api').request(this,method.slice(4),p);
    if (method === 'host:shortcut') return require('./host-actions').shortcut(this, p);
    if (method === 'host:default-browser') return require('./host-actions').setDefault(this, p);
    if (method.startsWith("extensions:"))
      return this.extensions.request(method.slice(11), p);
    if (method.startsWith("accounts:"))
      return require("./accounts").requestAccounts(this, method.slice(9), p);
    if (method === "profiles:clear-cache")
      return require("./profile-cache").clearLocalCache(e, p);
    if (method === "profiles:choose-import") {
      const choice = await this.dialog.showOpenDialog(this.window(), {
        properties: ["openFile"],
        filters: [{ name: "窗口导入", extensions: ["xlsx", "txt"] }],
      });
      if (choice.canceled || !choice.filePaths?.[0]) return null;
      const file = choice.filePaths[0],
        extension = path.extname(file).toLowerCase();
      if (![".xlsx", ".txt"].includes(extension))
        throw Error("仅支持 .xlsx 或 .txt 文件");
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size > 5 * 1024 * 1024)
        throw Error("导入文件不能超过 5 MiB");
      const bytes = await fs.readFile(file);
      if (bytes.length > 5 * 1024 * 1024) throw Error("导入文件不能超过 5 MiB");
      return {
        name: path.basename(file),
        size: bytes.length,
        bytes: new Uint8Array(bytes),
        type:
          extension === ".txt"
            ? "text/plain"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
    if (method === "profiles:analyse-import" || method === "profiles:import") {
      const rows = require("./import-profiles").importRows(p);
      if (
        p.fingerDetail !== undefined &&
        (!Array.isArray(p.fingerDetail) ||
          p.fingerDetail.length !== rows.length)
      )
        throw Error("指纹条数与导入窗口数不一致");
      const start = Math.max(
        0,
        ...e.status().map((row) => Number(row.number) || 0),
      );
      const profiles = rows.map((row, index) => {
        const {
          excelData: _rows,
          fingerDetail,
          fileName: _name,
          ...defaults
        } = p;
        const profile = fromRoxy({
          ...this.resolveInputs(defaults),
          ...fingerDetail?.[index],
          ...row,
          sortNum: start + index + 1,
        });
        if (row._importRefreshUrl)
          profile.proxyMeta = {
            ...profile.proxyMeta,
            refreshUrl: row._importRefreshUrl,
          };
        return profile;
      });
      if (method === "profiles:analyse-import")
        return { count: profiles.length };
      await e.syncProfiles(profiles);
      return { successCount: profiles.length };
    }
    if (method === "profiles:list")
      return e
        .status()
        .filter((v) => !v.trashed)
        .map((v) => this.decorate(v));
    if (method === "profiles:read") {
      const r = e.profileForEdit(String(p.id));
      this.revisions.set(r.profile.id, r.rev);
      return { ...this.decorate(r.profile), rev: r.rev };
    }
    if (method === "profiles:create") {
      if (!object(p)) throw Error("Invalid create payload");
      const n =
        Math.max(0, ...e.status().map((v) => Number(v.number) || 0)) + 1;
      const profile = fromRoxy({ ...this.resolveInputs(p), sortNum: n });
      await e.syncProfiles([profile]);
      return { windowId: profile.id, ...toRoxy(profile) };
    }
    if (method === "profiles:create-batch") {
      const count = Number(p.createCount);
      if (!Number.isInteger(count) || count < 1 || count > 100)
        throw Error("一次只能创建 1–100 个窗口");
      const proxies = p.proxyInfoList || [],
        fingers = p.fingerDetail || [];
      const accounts = [
        ...(p.windowPlatformList || []),
        ...(p.platformUrlIds || []).map((id) => ({ accountId: id })),
      ];
      if (
        proxies.length > count ||
        (fingers.length && fingers.length !== count)
      )
        throw Error("批量代理或指纹数量与窗口数量不一致");
      if (p.platformBindType !== 2 && accounts.length > count)
        throw Error("账号数量不能大于窗口数量");
      let number = Math.max(0, ...e.status().map((v) => Number(v.number) || 0));
      const profiles = Array.from({ length: count }, (_, i) => {
        const selected =
          p.platformBindType === 2 ? accounts : accounts.slice(i, i + 1);
        const proxy = proxies[i] || { proxyCategory: "noproxy" };
        const profileInput = this.resolveInputs({
          ...p,
          ...fingers[i],
          sortNum: ++number,
          windowName:
            String(p.windowNamePrefix || p.windowName || "窗口") +
            " " +
            (i + 1),
          proxyCategory: proxy.proxyCategory,
          proxyInfoList: [proxy],
          windowPlatformList: selected.filter((a) => !a.accountId),
          platformUrlIds: selected
            .filter((a) => a.accountId)
            .map((a) => a.accountId),
        });
        return fromRoxy(profileInput);
      });
      // Validate every row before the original engine commits the whole batch.
      await e.syncProfiles(profiles);
      return profiles.map(toRoxy);
    }
    if (method === "profiles:update") {
      const id = String(p.id ?? p.windowId ?? p.dirId ?? "");
      const base = e.profileForEdit(id);
      const rev = p.rev ?? this.revisions.get(id);
      if (!Number.isInteger(rev)) throw Error("请重新打开编辑表单以读取版本");
      const profile = fromRoxy(this.resolveInputs(p), base.profile);
      await e.applyProfileCommands(
        [{ kind: "modify", id, baseRev: rev, profile }],
        {
          delta: true,
        },
      );
      this.revisions.delete(id);
      return toRoxy(profile);
    }
    if (method === "profiles:start") {
      const id = String(p.id),
        result = await e.start(e.profileForEdit(id).profile);
      if (result.alreadyRunning) return result;
      try {
        const current = e.profileForEdit(id);
        await e.applyProfileCommands(
          [
            {
              kind: "modify",
              id,
              baseRev: current.rev,
              profile: { ...current.profile, lastOpenedAt: new Date().toISOString() },
            },
          ],
          { delta: true },
        );
      } catch (error) {
        const warning = "窗口已启动，但最后打开时间保存失败：" + error.message;
        e.emit({ type: "profile-metadata-error", id, message: warning });
        return {
          ...result,
          warningMessages: [...(result.warningMessages || []), warning],
        };
      }
      return result;
    }
    if (method === "profiles:clone") {
      const rows = p.ids.map((id) => e.profileForEdit(String(id)).profile);
      let number = Math.max(0, ...e.status().map((v) => Number(v.number) || 0));
      const copies = rows.map((v) =>
        sanitizeProfile({
          ...v,
          id: uid(),
          name: v.name + " 副本",
          number: ++number,
        }),
      );
      await e.syncProfiles(copies);
      return copies.map((v) => ({
        ...toRoxy(v),
        projectName:
          this.data.groups.find((group) => group.id === v.groupId)
            ?.projectName ||
          v.group_name ||
          "",
      }));
    }
    if (method === "profiles:patch") {
      const ids = p.ids.map(String);
      const { fingerDetail, ...patch } = p.patch;
      if (fingerDetail !== undefined &&
          (!Array.isArray(fingerDetail) || fingerDetail.length !== ids.length ||
           fingerDetail.some(row => !object(row) || typeof row.userAgent !== 'string' || !row.userAgent.trim())))
        throw Error("指纹条数或 UA 与更新窗口不一致");
      const commands = ids.map((id, index) => {
        const base = e.profileForEdit(id);
        return {
          kind: "modify",
          id,
          baseRev: base.rev,
          profile: fromRoxy(this.resolveInputs({ ...patch, ...fingerDetail?.[index] }), base.profile),
        };
      });
      if (commands.length)
        await e.applyProfileCommands(commands, { delta: true });
      return true;
    }
    if (method === "profiles:stop") return e.stop(String(p.id));
    if (method === "profiles:edit-data") {
      const ids = p.ids.map(String);
      if (p.proxyList && p.proxyList.length !== ids.length)
        throw Error("代理数量与窗口数量不一致");
      const commands = ids.map((id, index) => {
        const current = e.profileForEdit(id);
        let patch = p.paramList || p.proxyList?.[index] || {};
        if (p.type === "platform_edit")
          patch = { ...patch, platformUrlIds: [] };
        if (p.type === "proxy_delete") patch = { proxyCategory: "noproxy" };
        if (["platform_add", "platform_select"].includes(p.type)) {
          const selected = this.resolveInputs(patch);
          patch = {
            ...selected,
            platformUrlIds: [],
            windowPlatformList: [
              ...toRoxy(current.profile).windowPlatformList,
              ...(selected.windowPlatformList || []),
            ],
          };
          const seen = new Set();
          patch.windowPlatformList = patch.windowPlatformList.filter((row) => {
            if (!row.accountId) return true;
            if (seen.has(row.accountId)) return false;
            seen.add(row.accountId);
            return true;
          });
        }
        return {
          kind: "modify",
          id,
          baseRev: current.rev,
          profile: fromRoxy(this.resolveInputs(patch), current.profile),
        };
      });
      await e.applyProfileCommands(commands, { delta: true });
      return true;
    }
    if (method === "profiles:delete") {
      const ids = p.ids.map(String);
      await this.beforeRemove?.(ids);
      return e.trashProfiles(ids);
    }
    if (method === "profiles:restore")
      return e.restoreProfiles(p.ids.map(String));
    if (method === "profiles:purge") {
      const ids = p.ids.map(String);
      await this.beforeRemove?.(ids);
      return e.purgeProfiles(ids, true);
    }
    if (method === "profiles:trash")
      return e
        .status()
        .filter((v) => v.trashed)
        .map((v) => ({
          ...toRoxy(v),
          projectName:
            this.data.groups.find((group) => group.id === v.groupId)
              ?.projectName ||
            v.group_name ||
            "",
        }));
    if (method === "groups:list") {
      const rows = this.data.groups.map((v) => ({
        ...clone(v),
        projectName: v.projectName,
        project_id: v.id,
        projectId: v.id,
        windowCount: e.status().filter((p) => !p.trashed && p.groupId === v.id)
          .length,
        user_info: [
          {
            userId: "local",
            userName: "OpenBrowser",
            pinStatus: v.pinStatus || 0,
          },
        ],
      }));
      if(p.default===2)rows.unshift({id:'local-default',project_id:'local-default',projectId:'local-default',projectDefault:1,projectName:'默认项目',pinStatus:this.data.settings.defaultProjectPin||0,windowCount:e.status().filter(profile=>!profile.trashed&&!profile.groupId).length,user_info:[{userId:'local',userName:'OpenBrowser',pinStatus:this.data.settings.defaultProjectPin||0}]});
      return p.pinnedOnly ? rows.filter(row=>row.pinStatus===1) : rows;
    }
    if (method === "groups:save") {
      const id = p.project_id || p.id || uid();
      if(Object.hasOwn(p,'pinStatus')&&![0,1].includes(p.pinStatus))throw Error('项目固定状态无效');
      if(id==='local-default'){
        if(!Object.hasOwn(p,'pinStatus')||Object.hasOwn(p,'projectName'))throw Error('默认项目不能重命名');
        this.data.settings.defaultProjectPin=p.pinStatus;await this.save();return true;
      }
      const previous=this.data.groups.find(v=>v.id===id),name=Object.hasOwn(p,'projectName')?String(p.projectName||'').trim():previous?.projectName;
      if(!name)throw Error('请输入项目名称');
      const row = {
        ...previous,
        ...p,
        projectName:name,
        project_id: id,
        projectId: id,
        id,
      };
      this.data.groups = this.data.groups
        .filter((v) => v.project_id !== row.project_id)
        .concat(row);
      await this.save();
      return row;
    }
    if (method === "labels:list")
      return (this.data.labels || []).map((row) => ({
        ...row,
        bindWindowIds: e
          .status()
          .filter(
            (profile) =>
              !profile.trashed && toRoxy(profile).labelIds.includes(row.id),
          )
          .map((profile) => profile.id),
      }));
    if (method === "labels:save") {
      if (!String(p.name || "").trim()) throw Error("请输入标签名称");
      if (!/^#[0-9a-f]{6}$/i.test(p.color || "#12a3fc"))
        throw Error("无效的标签颜色");
      this.data.labels ??= [];
      const id = p.id
        ? Number(p.id)
        : nextRecordId(this.data, "labels", [
            ...this.data.filters.flatMap(row => row.labelIds || []),
            ...e.status().flatMap(profile => toRoxy(profile).labelIds),
          ]);
      if (!Number.isSafeInteger(id) || id <= 0) throw Error("Invalid label ID");
      if (p.id && !this.data.labels.some(row => row.id === id)) throw Error("标签不存在");
      const row = { ...p, id, color: p.color || "#12a3fc" };
      this.data.labels = this.data.labels
        .filter((label) => label.id !== id)
        .concat(row);
      await this.save();
      return row;
    }
    if (method === "labels:delete") {
      rememberRecordIds(this.data, "labels");
      const ids = p.ids.map(Number);
      const changes = [...e.profiles.values()]
        .filter(profile => toRoxy(profile).labelIds.some(id => ids.includes(id)))
        .map(profile => {
          const base = e.profileForEdit(profile.id);
          return { original: base.profile, baseRev: base.rev, patch: {
            tag: toRoxy(base.profile).labelIds.filter(id => !ids.includes(id)).join(","),
          } };
        });
      return profileRelations(e, changes, async () => {
        this.data.labels = (this.data.labels || []).filter(row => !ids.includes(row.id));
        await this.save();
        return true;
      });
    }
    if (method === "groups:delete") {
      const ids = p.ids.map(String);
      if (ids.includes('local-default')) throw Error('默认项目不能删除');
      const changes = [...e.profiles.values()]
        .filter(profile => ids.includes(profile.groupId))
        .map(profile => {
          const base = e.profileForEdit(profile.id);
          return { original: base.profile, baseRev: base.rev,
            patch: { groupId: "", group_name: "" } };
        });
      return profileRelations(e, changes, async () => {
        this.data.groups = this.data.groups.filter(row => !ids.includes(String(row.id)));
        await this.save();
        return true;
      });
    }
    if (method === "groups:sort") {
      const requested = p.projectIds.map(String);
      if (new Set(requested).size !== requested.length) throw Error("项目排序不能重复");
      const order = requested.filter(id => id !== 'local-default');
      const byId = new Map(this.data.groups.map(row => [row.id, row]));
      if (order.some(id => !byId.has(id))) throw Error("排序中的项目不存在");
      const selected = new Set(order);
      let index = 0;
      this.data.groups = this.data.groups.map(row => selected.has(row.id) ? byId.get(order[index++]) : row);
      await this.save();
      return true;
    }
    if (method === "templates:list") return clone(this.data.templates);
    if (method === "templates:save") {
      if (!String(p.templateName || "").trim()) throw Error("请输入模板名称");
      if (
        p.id != null &&
        (!Number.isSafeInteger(Number(p.id)) || Number(p.id) <= 0)
      )
        throw Error("Invalid template ID");
      if (typeof p.content !== "string" || !object(JSON.parse(p.content)))
        throw Error("Invalid template content");
      if (p.id && !this.data.templates.some(row => row.id === Number(p.id))) throw Error("模板不存在");
      const row = { ...p, id: p.id ? Number(p.id) : nextRecordId(this.data, "templates", [this.data.settings.quickTemplate?.id]) };
      this.data.templates = this.data.templates
        .filter((v) => v.id !== row.id)
        .concat(row);
      await this.save();
      return row;
    }
    if (method === "templates:delete") {
      rememberRecordIds(this.data, "templates");
      this.data.templates = this.data.templates.filter(
        (v) => !p.ids.includes(v.id),
      );
      await this.save();
      return true;
    }
    if (method === "activity:append") {
      if (!/^[a-zA-Z][a-zA-Z0-9:_-]{0,80}$/.test(p.action))
        throw Error("Invalid action name");
      this.data.activity ??= [];
      this.data.activity.push({
        action: p.action,
        at: new Date().toISOString(),
      });
      this.data.activity = this.data.activity.slice(-500);
      this.data.notifications ??= [];
      this.data.notifications.push({
        id: uid(),
        title: "本地操作记录",
        message: p.action,
        at: new Date().toISOString(),
        read: false,
      });
      this.data.notifications = this.data.notifications.slice(-100);
      await this.save();
      return true;
    }
    if (method === "settings:get") return clone(this.data.settings);
    if (method === "settings:set") {
      if (!object(p)) throw Error("Invalid settings");
      this.data.settings = { ...this.data.settings, ...p };
      await this.save();
      return true;
    }
    if (method === "filters:list") {
      const order = new Map((this.data.settings.filterSort || []).map(row => [row.name, Number(row.sort)]));
      return clone(this.data.filters).sort((a, b) =>
        (order.get(a.filter_name) ?? Infinity) - (order.get(b.filter_name) ?? Infinity));
    }
    if (method === "filters:save") {
      const row = { ...p, filter_name: p.new_filter_name || p.filter_name };
      if (!String(row.filter_name || "").trim()) throw Error("请输入筛选器名称");
      if (p.old_filter_name && p.old_filter_name !== row.filter_name)
        this.data.settings.filterSort = (this.data.settings.filterSort || []).map(item => item.name === p.old_filter_name ? { ...item, name: row.filter_name } : item);
      this.data.filters = this.data.filters
        .filter((v) => v.filter_name !== (p.old_filter_name || row.filter_name))
        .concat(row);
      await this.save();
      return true;
    }
    if (method === "filters:delete") {
      this.data.filters = this.data.filters.filter(
        (v) => v.filter_name !== p.filter_name,
      );
      await this.save();
      return true;
    }
    if (method === "fingerprint:preview") {
      const count = Number(p.count ?? 1);
      if (!Number.isInteger(count) || count < 1 || count > 100)
        throw Error("Invalid fingerprint count");
      return Array.from({ length: count }, () => {
        const profile = fromRoxy({ ...p, windowName: "Preview" });
        const browser = e.chooseBrowser(profile, profile.engine);
        const f = e.fingerprintFor({
          ...profile,
          kernelVersion: browser.version,
        });
        return {
          userAgent: f.userAgent,
          webGLManufacturer: f.webgl.vendor,
          webGLRender: f.webgl.renderer,
          deviceName: f.deviceName,
          macAddr: f.mac.value,
          ...(p.fontType
            ? { font: f.fonts.list.join(";"), fontList: f.fonts.list }
            : {}),
          _openbrowser: f,
        };
      });
    }
    if (method === "host:dictionary") {
      const {
        COUNTRY_TO_LOCALE,
      } = require("../automation/locale-from-country");
      return {
        languages: [...new Set(Object.values(COUNTRY_TO_LOCALE))].sort(),
        timezones: [...new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])],
      };
    }
    if (method === "notifications:list")
      return clone(this.data.notifications || []).reverse();
    if (method === "notifications:append") {
      if (
        typeof p.title !== "string" ||
        typeof p.message !== "string" ||
        p.title.length > 200 ||
        p.message.length > 2000
      )
        throw Error("通知内容无效");
      this.data.notifications ??= [];
      this.data.notifications.push({
        id: uid(),
        title: p.title,
        message: p.message,
        at: new Date().toISOString(),
        read: false,
      });
      this.data.notifications = this.data.notifications.slice(-100);
      await this.save();
      return true;
    }
    if (method === "notifications:read") {
      if (p.ids !== undefined && (!Array.isArray(p.ids) || p.ids.some(id => typeof id !== 'string'))) throw Error('无效通知 ID');
      const ids = p.ids === undefined ? null : new Set(p.ids);
      for (const notice of this.data.notifications || []) if (!ids || ids.has(notice.id)) notice.read = true;
      await this.save();
      return true;
    }
    if (method === "host:network") {
      if (p.probe) {
        if (!this.hostNetworkProbe)
          this.hostNetworkProbe = require("./host-network")
            .probeHostNetwork()
            .finally(() => {
              this.hostNetworkProbe = null;
            });
        const result = await this.hostNetworkProbe;
        if (!result.ip) throw Error("网络定位未返回 IP");
        this.hostNetwork = {
          ...result,
          country_code: result.countryCode || "",
        };
      }

      const entries = Object.values(require("node:os").networkInterfaces())
        .flat()
        .filter((v) => v && !v.internal);
      return {
        ...this.hostNetwork,
        ip: this.hostNetwork?.ip || "",
        localAddress: entries.find((v) => v.family === "IPv4")?.address || "",
        timezone: this.hostNetwork?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        country_code: this.hostNetwork?.country_code || "",
        city: this.hostNetwork?.city || "",
      };
    }
    if (method === "host:mac") {
      const row = Object.values(require("node:os").networkInterfaces())
        .flat()
        .find((v) => v && !v.internal && v.mac !== "00:00:00:00:00:00");
      if (!row) throw Error("没有可读取的本机 MAC 地址");
      return row.mac;
    }
    if (method === "proxies:detect") {
      if (!p.host && !p.moduleId && !p.id)
        return this.dispatch("host:network", { probe: true });
      const selected =
        p.moduleId || p.id
          ? this.proxyStore().get(String(p.moduleId || p.id))
          : null;
      if ((p.moduleId || p.id) && !selected)
        throw Error("所选代理不存在，请刷新后重试");
      const profile = fromRoxy({
        windowName: "Proxy test",
        proxyInfoList: [selected || p],
      });
      const result = await e.testProxy({
        ...profile,
        proxyMeta: {
          ...profile.proxyMeta,
          ipChannel: p.checkChannel || "ip-api",
        },
      });
      if (selected) await this.proxyStore().markCheck(selected.id, result);
      return { ...result, country_code: result.countryCode || "" };
    }
    if (method === "proxies:refresh")
      return require("../proxy-forwarder").invokeProxyRefresh(p.url);
    if (method === "proxies:extract")
      return require("../network/outbound").fetchUrlText(p.url, {
        timeout: 20000,
      });
    if (method === "kernels:list") {
      const rows = [...e.kernelManager.listInstalledKernels()];
      const primary = e.kernelManager.resolveInstalled();
      if (primary?.path && !rows.some((row) => row.path === primary.path))
        rows.push({
          ...primary,
          id: "primary:" + primary.path,
          engine: primary.engine === "firefox" ? "firefox" : "chromium",
          version: primary.version,
          primary: true,
        });
      return rows;
    }
    if (method === "proxies:list")
      return this.proxyStore()
        .list(p)
        .map((row) => ({
          ...row,
          bindList: e
            .status()
            .filter((v) => !v.trashed && v.proxyId === row.id)
            .map((v) => ({
              id: v.id,
              windowName: v.name,
              windowSortNum: v.number,
            })),
        }));
    if (method === "proxies:read") {
      const row = this.proxyStore().get(String(p.id));
      if (!row) throw Error("代理不存在");
      return row;
    }
    if (method === "proxies:duplicates") {
      if (!Array.isArray(p.items) || p.items.length > 500)
        throw Error("一次只能检查 0–500 条代理");
      const existing = this.proxyStore().list();
      const key = (row) =>
        [
          String(row.host).toLowerCase(),
          Number(row.port),
          String(row.username ?? row.proxyUserName ?? ""),
          String(row.password ?? row.proxyPassword ?? ""),
        ].join("\0");
      const known = new Set(existing.map(key));
      return {
        items: p.items.map((item) => ({
          tempId: String(item.tempId),
          hasImportRecord: known.has(key(item)),
        })),
      };
    }
    if (method === "proxies:create-many")
      return this.proxyStore().createMany(p.items);
    if (method === "proxies:create") return this.proxyStore().create(p);
    if (method === "proxies:update") return this.proxyStore().update(p.id, p);
    if (method === "proxies:bind") {
      if (!Array.isArray(p.windowIds) || p.windowIds.length > 200)
        throw Error("一次只能关联 0–200 个窗口");
      const proxy = this.proxyStore().get(String(p.proxyId));
      if (!proxy) throw Error("代理不存在");
      const selected = new Set(p.windowIds.map(String));
      for (const id of selected) e.profileForEdit(id);
      const commands = e
        .status()
        .filter((row) => selected.has(row.id) || row.proxyId === proxy.id)
        .map((row) => {
          const current = e.profileForEdit(row.id);
          return {
            kind: "modify",
            id: row.id,
            baseRev: current.rev,
            profile: fromRoxy(
              selected.has(row.id)
                ? { proxyInfoList: [proxy] }
                : { proxyCategory: "noproxy" },
              current.profile,
            ),
          };
        });
      if (commands.length)
        await e.applyProfileCommands(commands, { delta: true });
      return true;
    }
    if (method === "proxies:save-results") {
      if (!Array.isArray(p.proxyList) || p.proxyList.length > 500)
        throw Error("无效的代理检测结果");
      for (const row of p.proxyList)
        if (!this.proxyStore().get(String(row.id))) throw Error("代理不存在");
      return Promise.all(
        p.proxyList.map((row) =>
          this.proxyStore().markCheck(String(row.id), {
            ip: row.lastIp || "",
            countryCode: row.lastCountry || "",
            city: row.lastCity || "",
            timezone: row.timezone || "",
          }),
        ),
      );
    }
    if (method === "profiles:proxy-results") {
      if (!Array.isArray(p.proxyList) || p.proxyList.length > 200)
        throw Error("无效的窗口检测结果");
      const commands = p.proxyList.map((row) => {
        const id = String(row.id || row.dirId),
          current = e.profileForEdit(id),
          checked = new Date(row.checkTime || Date.now());
        if (!Number.isFinite(checked.getTime()))
          throw Error("无效的代理检测时间");
        return {
          kind: "modify",
          id,
          baseRev: current.rev,
          profile: sanitizeProfile({
            ...current.profile,
            exitIp: row.lastIp || "",
            exitCountryCode: row.lastCountry || "",
            exitTimezone: row.timezone || "",
            exitCheckedAt: checked.toISOString(),
          }),
        };
      });
      if (commands.length)
        await e.applyProfileCommands(commands, { delta: true });
      return true;
    }
    if (method === "proxies:delete") {
      const ids = new Set(p.ids.map(String));
      const bound = e.status().filter((row) => ids.has(row.proxyId));
      if (bound.length)
        throw Error(
          "代理仍关联 " + bound.length + " 个窗口（含回收站），请先解除关联",
        );
      return this.proxyStore().remove(p.ids);
    }
    if (method === "proxies:export") {
      const rows = p.ids.map((id) => this.proxyStore().get(String(id)));
      if (rows.some((row) => !row)) throw Error("代理不存在，请刷新后重试");
      const picked = await this.dialog.showSaveDialog(this.window(), {
        defaultPath: "openbrowser-proxies.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (picked.canceled) return { canceled: true };
      await fs.writeFile(
        picked.filePath,
        JSON.stringify(
          { format: "openbrowser-proxies", version: 1, proxies: rows },
          null,
          2,
        ),
        { mode: 0o600 },
      );
      return { count: rows.length };
    }
    if (method === "transfer:export") {
      if (!Array.isArray(p.ids) || !p.ids.length || p.ids.length > 200)
        throw Error("一次只能导出 1–200 个窗口");
      const profiles = p.ids.map((id) => {
        const profile = e.profileForEdit(String(id)).profile;
        const selected = profile.proxyId
          ? this.proxyStore?.().get(profile.proxyId)
          : null;
        if (profile.proxyId && !selected)
          throw Error("绑定的代理不存在，无法导出完整配置");
        return sanitizeProfile({
          ...profile,
          proxy: selected?.raw || profile.proxy,
          proxyId: null,
          group_name:
            this.data.groups.find((group) => group.id === profile.groupId)
              ?.projectName ||
            profile.group_name ||
            "",
        });
      });
      const content = JSON.stringify(
        { format: "openbrowser-profiles", version: 1, profiles },
        null,
        2,
      );
      if (Buffer.byteLength(content) > 20 * 1024 * 1024)
        throw Error("导出内容超过 20 MiB，请减少窗口数量");
      const picked = await this.dialog.showSaveDialog(this.window(), {
        defaultPath: "openbrowser-profiles.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (picked.canceled) return { canceled: true };
      await fs.writeFile(picked.filePath, content, { mode: 0o600 });
      return { count: profiles.length };
    }
    if (method === "transfer:import") {
      const picked = await this.dialog.showOpenDialog(this.window(), {
        properties: ["openFile"],
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (picked.canceled) return { canceled: true };
      const file = picked.filePaths[0];
      if ((await fs.stat(file)).size > 20 * 1024 * 1024)
        throw Error("文件不能超过 20 MiB");
      const value = JSON.parse(await fs.readFile(file, "utf8"));
      if (
        value.format !== "openbrowser-profiles" ||
        value.version !== 1 ||
        !Array.isArray(value.profiles) ||
        value.profiles.length > 200
      )
        throw Error("Invalid profile exchange file");
      const additions = [];
      const profiles = value.profiles.map((v) => {
        let groupId = "";
        if (v.group_name) {
          const name = String(v.group_name).slice(0, 40);
          let group = [...this.data.groups, ...additions].find(
            (row) => row.projectName === name,
          );
          if (!group) {
            const id = uid();
            group = { id, project_id: id, projectName: name };
            additions.push(group);
          }
          groupId = group.id;
        }
        return sanitizeProfile({ ...v, id: uid(), proxyId: null, groupId,
          platform: { ...v.platform, accounts: v.platform?.accounts?.map(({accountId: _accountId, ...account}) => account) },
        });
      });
      // Persist group labels before engine mutation; request rollback handles a
      // failed write. Engine failure removes new metadata before surfacing it.
      const originalGroups = this.data.groups;
      if (additions.length) {
        this.data.groups = [...originalGroups, ...additions];
        await this.save();
      }
      try {
        await e.syncProfiles(profiles);
      } catch (error) {
        this.data.groups = originalGroups;
        await this.save();
        throw error;
      }
      return { count: profiles.length };
    }
    throw Object.assign(Error("未实现本地接口: " + method), {
      code: "LOCAL_CHANNEL_UNIMPLEMENTED",
    });
  }
}
module.exports = { LocalService, fromRoxy, toRoxy };

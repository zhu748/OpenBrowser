"use strict";

// Workbench DTO translation belongs here, independently of routing and persistence.
const { randomUUID: uid } = require("node:crypto");
const { sanitizeProfile } = require("../engine/profile-sanitizer");
const { resolveDoNotTrackMode } = require('../shared/profile-values');

const { labelIdsOf, ADVANCED_FIELDS, NOISE_FIELDS, parseWindowPosition, formatWindowPosition } = require('./profile-fields');

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
        ? v.projectId === "local-default"
          ? ""
          : (v.projectId ?? "")
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
  const draft = v._fingerprintDraft;
  if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
    mapped.fingerprintSeed = String(draft.seed || '');
    mapped.fingerprintVersion = draft.version;
  }
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
  for (const [source, target] of Object.entries(privacyMap))
    if (Object.hasOwn(v, source)) mapped.privacy[target] = v[source];
  if (Object.hasOwn(v, "isDisplayLanguageBaseIp"))
    mapped.privacy.languageMode = v.isDisplayLanguageBaseIp ? "ip" : "profile";
  if (v.isLanguageBaseIp === true) mapped.privacy.uiLanguage = "ip";
  else if (Object.hasOwn(v, "language")) mapped.privacy.uiLanguage = v.language;
  if (Object.hasOwn(v, "positionSwitch"))
    mapped.privacy.fullscreen = !v.positionSwitch;
  if (Object.hasOwn(v, "windowRatioPosition"))
    mapped.privacy.windowPos = parseWindowPosition(v.windowRatioPosition);
  for (const [source, target] of Object.entries(ADVANCED_FIELDS))
    if (Object.hasOwn(v, source)) mapped.advanced[target] = v[source];
  // The legacy field names say 'forbid', but the actual radio labels use true = 开启.
  for (const [source, target] of Object.entries({
    forbidMedia: "blockVideo",
    forbidAudio: "blockSound",
  }))
    if (Object.hasOwn(v, source)) mapped.advanced[target] = !v[source];
  if (
    Object.hasOwn(v, "forbidImage") ||
    Object.hasOwn(v, "forbiddenPictureSize")
  ) {
    const enabled = Object.hasOwn(v, "forbidImage")
      ? v.forbidImage === true
      : !(base.advanced?.blockImages || base.advanced?.imageMaxBytes);
    const kb = Number(
      v.forbiddenPictureSize ?? (base.advanced?.imageMaxBytes || 0) / 1024,
    );
    if (!Number.isFinite(kb) || kb < 0 || kb > 8192)
      throw Error("图片大小范围为 0–8192 KB");
    mapped.advanced.blockImages = !enabled && kb === 0;
    mapped.advanced.imageMaxBytes = enabled ? 0 : Math.floor(kb * 1024);
  }
  for (const [source, target] of Object.entries(NOISE_FIELDS))
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
  if (Object.hasOwn(v, "doNotTrack")) {
    const enabled = resolveDoNotTrackMode({ dnt: v.doNotTrack }) === 'on';
    // The Workbench boolean represents both inactive modes as false.
    const keepsDefault = base.privacy && resolveDoNotTrackMode(base.privacy) === 'default';
    mapped.privacy.dnt = enabled;
    mapped.privacy.dntMode = enabled ? 'on' : keepsDefault ? 'default' : 'off';
  }
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
  const previousUa = base.privacy?.fingerprint?.userAgent || base.userAgent || '';
  // The editor exposes one UA. Promote an explicit edit to that canonical
  // field instead of letting an old hidden override win during injection.
  if (Object.hasOwn(v, 'userAgent')) delete fp.userAgent;
  if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
    const generated = draft.generated !== false && mapped.userAgent === draft.userAgent;
    fp.uaGenerated = generated;
    if (generated) {
      fp.uaReduced = draft.uaReduced !== false;
      fp.uaPatchRandomized = draft.uaPatchRandomized === true;
      fp.clientHints = draft.clientHints || {};
    } else if (mapped.userAgent !== previousUa) {
      delete fp.uaReduced;
      delete fp.uaPatchRandomized;
      delete fp.clientHints;
    }
  } else if (Object.hasOwn(v, 'userAgent') && mapped.userAgent !== previousUa) {
    fp.uaGenerated = false;
    delete fp.uaReduced;
    delete fp.uaPatchRandomized;
    delete fp.clientHints;
  }
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
        saveData: v.saveFlowMode === true,
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
    mapped.platform = { ...mapped.platform, startUrl: mapped.startUrl };
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
      const parsed = require("../network/proxy-config").parseProxy(p.proxy);
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
    labelIds: labelIdsOf(p),
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
    userAgent: p.privacy?.fingerprint?.userAgent || p.userAgent || '',
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
    updateTime: p.updatedAt || "",
    trashedAt: p.trashedAt ?? null,
    ...(p.trashed && Number.isSafeInteger(p.rev) && { rev: p.rev }),
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
    windowRatioPosition: formatWindowPosition(p.privacy?.windowPos),
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
    doNotTrack: resolveDoNotTrackMode(p.privacy) === 'on',
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
    saveFlowMode: p.privacy?.fingerprint?.network?.saveData === true,
    openBluetooth: p.privacy?.fingerprint?.bluetooth === "blocked",
    bluetoothAdapter: p.privacy?.fingerprint?.bluetooth !== "blocked",
    searchEngine: p.privacy?.searchEngine,
    forbidAudio: !p.advanced?.blockSound,
    forbidMedia: !p.advanced?.blockVideo,
    forbidImage: !(p.advanced?.blockImages || p.advanced?.imageMaxBytes),
    forbiddenPictureSize: p.advanced?.blockImages
      ? 0
      : p.advanced?.imageMaxBytes
        ? p.advanced.imageMaxBytes / 1024
        : Number(p.prefs?.roxy?.forbiddenPictureSize) || 0,
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
      Object.entries(NOISE_FIELDS).map(([k, v]) => [
        k,
        p.privacy?.[v] !== "real",
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(ADVANCED_FIELDS).map(([k, v]) => [k, p.advanced?.[v]]),
    ),
  };
}

module.exports = { fromRoxy, toRoxy };

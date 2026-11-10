"use strict";

const { assertProfileId } = require("../automation/isolation");
const { normalizeIpLookupChannel } = require("../proxy-forwarder");
const { profileProxyAssociation, normalizedProxyAssociationId } = require("./proxy-helpers");

const MAX_PROFILE_PROXY_LENGTH = 64 * 1024;

function sanitizeProfile(value) {
  if (!value || typeof value !== "object" || typeof value.id !== "string" || typeof value.name !== "string") throw new Error("Invalid profile");
  const id = assertProfileId(value.id);
  const privacyValue = value.privacy && typeof value.privacy === "object" ? value.privacy : {};
  const advancedValue = value.advanced && typeof value.advanced === "object" ? value.advanced : {};
  const proxyMetaValue = value.proxyMeta && typeof value.proxyMeta === "object" ? value.proxyMeta : {};
  const platformValue = value.platform && typeof value.platform === "object" ? value.platform : {};
  const fingerprintValue = value.fingerprint && typeof value.fingerprint === "object"
    ? value.fingerprint
    : (privacyValue.fingerprint && typeof privacyValue.fingerprint === "object" ? privacyValue.fingerprint : null);
  const allowed = (candidate, values, fallback) => values.includes(String(candidate || "")) ? String(candidate) : fallback;
  const finite = (candidate) => candidate !== "" && candidate !== null && candidate !== undefined && Number.isFinite(Number(candidate)) ? Number(candidate) : null;
  const width = Math.min(7680, Math.max(640, Number(value.width) || 1280));
  const height = Math.min(4320, Math.max(480, Number(value.height) || 820));
  const number = Number.parseInt(value.number, 10);
  const parseLimitedOption = (candidate, values) => {
    if (candidate === "" || candidate === null || candidate === undefined) return null;
    const val = Number(candidate);
    return values.includes(val) ? val : null;
  };
  const cpuCandidate = privacyValue.cores === "" || privacyValue.cores === null || privacyValue.cores === undefined
    ? fingerprintValue?.cores
    : privacyValue.cores;
  const memoryCandidate = privacyValue.memory === "" || privacyValue.memory === null || privacyValue.memory === undefined
    ? fingerprintValue?.memory
    : privacyValue.memory;
  const cores = parseLimitedOption(cpuCandidate, [0, 2, 4, 6, 8, 10, 12, 16, 20, 24]);
  // navigator.deviceMemory is spec-quantised (0.25/0.5/1/2/4/8) and capped at 8;
  // 16 was briefly accepted during the RoxyBrowser parity sweep but no real Chrome
  // reports it — a single read identifies the profile as spoofed. Keep the cap at 8.
  const memory = parseLimitedOption(memoryCandidate, [0, 2, 4, 6, 8]);
  // Custom launch args: each token must look like a Chromium switch (--flag or --flag=value).
  // Values may not contain whitespace/semicolons (split first), keeping the surface injectable-free.
  const customArgs = String(privacyValue.customArgs || "")
    .split(/[;\r\n]+/)
    .map((token) => token.trim())
    .filter((token) => /^--[a-z0-9][a-z0-9._-]*(=[^\s;'"]{0,500})?$/i.test(token))
    .join(" ")
    .slice(0, 2000);
  const macRaw = String(privacyValue.mac || "").trim().toUpperCase().replace(/-/g, ":");
  const mac = /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/.test(macRaw) ? macRaw : "";
  const rawProxy = String(value.proxy || "").trim();
  if (rawProxy.length > MAX_PROFILE_PROXY_LENGTH) throw new Error("Proxy URL is too long");
  const networkMode = value.networkMode === "proxy" ? "proxy"
    : value.networkMode === "direct" || !rawProxy || /^(direct|offline|none)$/i.test(rawProxy) ? "direct" : "proxy";
  const effectiveStartUrl = String(value.startUrl || platformValue.startUrl || advancedValue.startUrls || "").trim().slice(0, 2000);
  const proxyAssociation = profileProxyAssociation(value);
  const proxyId = networkMode === "direct" ? null : normalizedProxyAssociationId(proxyAssociation.value);

  return {
    id,
    number: Number.isInteger(number) && number > 0 ? number : null,
    trashed: Boolean(value.trashed),
    trashedAt: value.trashedAt ? String(value.trashedAt).slice(0, 40) : null,
    name: value.name.slice(0, 100),
    title: String(value.title || value.displayName || "").slice(0, 120),
    startUrl: effectiveStartUrl,
    browser: "Google Chrome",
    // Kernel family per profile: 'chromium' (default) or 'firefox'. Falls back
    // inside profileEngine() when unset, so legacy profiles never carry it.
    engine: allowed(value.engine, ["chromium", "firefox"], "chromium"),
    os: String(value.os || value.fingerprint?.os || value.privacy?.fingerprint?.os || "Windows").slice(0, 40),
    // Roxy 对齐：系统版本 / 内核版本（内核 'latest' = 保持最新）
    osVersion: String(value.osVersion || "").slice(0, 40),
    engineVersion: allowed(value.engineVersion, ["latest"], String(value.engineVersion || "").slice(0, 40) === "" ? "" : String(value.engineVersion).slice(0, 40)),
    favorite: Boolean(value.favorite),
    lastOpenedAt: value.lastOpenedAt ? String(value.lastOpenedAt).slice(0, 40) : null,
    location: String(value.location || "Local").slice(0, 80),
    networkMode,
    proxy: networkMode === "direct" ? "Direct" : rawProxy,
    proxyId,
    tag: String(value.tag || "").slice(0, 40),
    groupId: String(value.groupId || "").slice(0, 64),
    group_name: String(value.group_name || value.groupName || "").slice(0, 40),
    language: String(value.language || "en-US").slice(0, 20),
    width,
    height,
    deviceScaleFactor: (() => {
      const n = Number(value.deviceScaleFactor);
      return Number.isFinite(n) && n > 0 ? Math.min(5, Math.max(0.5, Math.round(n * 100) / 100)) : null;
    })(),
    userAgent: String(value.userAgent || "").replace(/[\r\n]/g, " ").slice(0, 1000),
    cookies: String(value.cookies || "").slice(0, 500000),
    note: String(value.note || "").slice(0, 2000),
    exitIp: String(value.exitIp || "").slice(0, 80),
    exitCountryCode: String(value.exitCountryCode || "").slice(0, 4),
    exitTimezone: String(value.exitTimezone || "").slice(0, 100),
    exitLatitude: finite(value.exitLatitude),
    exitLongitude: finite(value.exitLongitude),
    exitCheckedAt: String(value.exitCheckedAt || "").slice(0, 40),
    exitLatencyMs: finite(value.exitLatencyMs),
    exitNetworkType: String(value.exitNetworkType || "").slice(0, 40),
    platform: {
      type: String(platformValue.type || "other").slice(0, 40),
      startUrl: effectiveStartUrl,
      name: String(platformValue.name || "").slice(0, 120),
      username: String(platformValue.username || "").slice(0, 200),
      password: String(platformValue.password || "").slice(0, 500),
      totpSecret: String(platformValue.totpSecret || platformValue.otp || "").slice(0, 200),
      // Roxy 对齐：多账号行（首账号即主账号字段，这里只做上限与字段清洗）
      accounts: Array.isArray(platformValue.accounts)
        ? platformValue.accounts.slice(0, 20).map((acc) => ({
          username: String(acc?.username || "").slice(0, 200),
          password: String(acc?.password || "").slice(0, 500),
          totpSecret: String(acc?.totpSecret || acc?.otp || "").slice(0, 200),
        }))
        : [],
    },
    proxyMeta: {
      proxyId,
      ipChannel: normalizeIpLookupChannel(proxyMetaValue.ipChannel ?? proxyMetaValue.ip_channel),
      refreshUrl: String(proxyMetaValue.refreshUrl ?? proxyMetaValue.refresh_url ?? "").slice(0, 1000),
      checkOnStart: Boolean(proxyMetaValue.checkOnStart),
      refreshOnStart: Boolean(proxyMetaValue.refreshOnStart),
      extractMode: proxyMetaValue.extractMode === "always" ? "always" : "onInvalid",
      systemProxy: allowed(proxyMetaValue.systemProxy, ["global", "use", "off"], "global"),
      directBypass: Boolean(proxyMetaValue.directBypass),
      bypassList: String(proxyMetaValue.bypassList || "").slice(0, 4000),
      apiExtractUrl: String(proxyMetaValue.apiExtractUrl || "").slice(0, 2000),
      backupProxies: Array.isArray(proxyMetaValue.backupProxies)
        ? proxyMetaValue.backupProxies.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8)
        : (typeof proxyMetaValue.backupProxies === "string"
          ? String(proxyMetaValue.backupProxies).split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
          : []),
      fillFingerprint: proxyMetaValue.fillFingerprint !== false,
      requireReady: true,
      notReadyPolicy: "block",
      allowDirectFallback: false,
      tlsProfile: allowed(proxyMetaValue.tlsProfile, ["auto", "chrome", "chrome_legacy", "node", "off"], "auto"),
      tlsChromeMajor: (() => {
        const n = Number(proxyMetaValue.tlsChromeMajor);
        return Number.isFinite(n) && n >= 1 && n <= 999 ? Math.round(n) : null;
      })(),
    },
    privacy: {
      webrtc: allowed(privacyValue.webrtc, ["proxy", "disabled", "real"], "proxy"),
      timezoneMode: allowed(privacyValue.timezoneMode, ["ip", "real", "custom"], "ip"),
      timezone: (() => {
        // IANA shape gate: bounded length alone still let arbitrary junk into
        // Intl timezone emulation; invalid -> "" (persona falls back to the
        // IP-derived zone, same as an empty field today).
        const s = String(privacyValue.timezone || "").trim();
        return /^[A-Za-z0-9_+/-]{1,100}$/.test(s) ? s : "";
      })(),
      geoMode: allowed(privacyValue.geoMode, ["ip", "disabled", "custom", "prompt", "allow"], privacyValue.geoMode === "prompt" ? "prompt" : (privacyValue.geoMode === "allow" ? "ip" : "ip")),
      // Roxy 对齐：地理位置提示（询问/允许/禁止）与来源（基于IP匹配/自定义）分离；
      // 旧 profile 的 geoMode=disabled/prompt 折算进 geoPermission，geoMode 继续供引擎读取。
      geoPermission: (() => {
        const explicit = allowed(privacyValue.geoPermission, ["prompt", "allow", "deny"], "");
        if (explicit) return explicit;
        if (privacyValue.geoMode === "disabled") return "deny";
        if (privacyValue.geoMode === "prompt") return "prompt";
        return "allow";
      })(),
      latitude: finite(privacyValue.latitude),
      longitude: finite(privacyValue.longitude),
      accuracy: Math.min(5000, Math.max(10, Number(privacyValue.accuracy) || 1000)),
      uiLanguage: String(privacyValue.uiLanguage || "profile").slice(0, 20),
      langFromIp: privacyValue.langFromIp !== false,
      languageMode: String(privacyValue.languageMode || (privacyValue.langFromIp !== false ? "ip" : (privacyValue.uiLanguage || "profile"))).slice(0, 20),
      timezoneFromIp: privacyValue.timezoneFromIp !== false,
      geoFromIp: privacyValue.geoFromIp !== false,
      fontMode: allowed(privacyValue.fontMode, ["default", "custom"], "default"),
      fontSize: Math.min(36, Math.max(9, Number(privacyValue.fontSize) || 16)),
      deviceProfile: allowed(privacyValue.deviceProfile, ["default", "persona"], "default"),
      canvas: allowed(privacyValue.canvas, ["real", "noise", "blocked"], privacyValue.canvas === "blocked" ? "blocked" : (privacyValue.canvas === "real" ? "real" : "noise")),
      webgl: allowed(privacyValue.webgl, ["real", "noise", "blocked"], privacyValue.webgl === "blocked" ? "blocked" : (privacyValue.webgl === "real" ? "real" : "noise")),
      webglMeta: allowed(privacyValue.webglMeta, ["noise", "custom", "real", "blocked"], "noise"),
      webgpu: allowed(privacyValue.webgpu, ["real", "blocked", "webgl"], privacyValue.webgpu === "webgl" ? "webgl" : (privacyValue.webgpu === "blocked" ? "blocked" : "real")),
      audio: allowed(privacyValue.audio, ["real", "noise", "muted"], privacyValue.audio === "muted" ? "muted" : (privacyValue.audio === "real" ? "real" : "noise")),
      media: allowed(privacyValue.media, ["real", "blocked", "noise"], privacyValue.media === "blocked" ? "blocked" : (privacyValue.media === "noise" ? "noise" : "real")),
      mediaDevices: allowed(privacyValue.mediaDevices, ["real", "noise", "empty"], privacyValue.mediaDevices === "real" ? "real" : (privacyValue.mediaDevices === "empty" ? "empty" : (privacyValue.media === "noise" ? "noise" : (privacyValue.media === "blocked" ? "empty" : "noise")))),
      mediaLabels: privacyValue.mediaLabels && typeof privacyValue.mediaLabels === "object" ? {
        audioinput: String(privacyValue.mediaLabels.audioinput || privacyValue.mediaLabels.input || "").slice(0, 200),
        videoinput: String(privacyValue.mediaLabels.videoinput || privacyValue.mediaLabels.video || "").slice(0, 200),
        audiooutput: String(privacyValue.mediaLabels.audiooutput || privacyValue.mediaLabels.output || "").slice(0, 200),
      } : null,
      battery: allowed(privacyValue.battery, ["real", "noise", "blocked"], privacyValue.battery === "blocked" ? "blocked" : (privacyValue.battery === "real" ? "real" : "noise")),
      batterySnapshot: privacyValue.batterySnapshot && typeof privacyValue.batterySnapshot === "object" ? {
        charging: privacyValue.batterySnapshot.charging !== false,
        level: Math.min(1, Math.max(0, Number(privacyValue.batterySnapshot.level) || 0.87)),
        chargingTime: Number.isFinite(Number(privacyValue.batterySnapshot.chargingTime)) ? Number(privacyValue.batterySnapshot.chargingTime) : null,
        dischargingTime: Number.isFinite(Number(privacyValue.batterySnapshot.dischargingTime)) ? Number(privacyValue.batterySnapshot.dischargingTime) : null,
      } : null,
      webrtcPolicy: privacyValue.webrtc === "disabled" ? 0 : (privacyValue.webrtc === "real" ? 1 : 3),
      stabilityMode: allowed(privacyValue.stabilityMode, ["off", "auto", "force"], "auto"),
      stabilityHamming: Math.min(64, Math.max(1, Number(privacyValue.stabilityHamming) || 12)),
      stabilityMaxWidth: Math.min(4096, Math.max(64, Number(privacyValue.stabilityMaxWidth) || 600)),
      stabilityMaxHeight: Math.min(4096, Math.max(64, Number(privacyValue.stabilityMaxHeight) || 600)),
      stabilitySquare: Math.min(64, Math.max(2, Number(privacyValue.stabilitySquare) || 8)),
      stabilityHosts: Array.isArray(privacyValue.stabilityHosts)
        ? privacyValue.stabilityHosts.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean).slice(0, 800)
        : (typeof privacyValue.stabilityHosts === "string"
          ? String(privacyValue.stabilityHosts).split(/[\r\n,;\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 800)
          : null),
      stabilitySkipHosts: Array.isArray(privacyValue.stabilitySkipHosts)
        ? privacyValue.stabilitySkipHosts.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean).slice(0, 200)
        : (typeof privacyValue.stabilitySkipHosts === "string"
          ? String(privacyValue.stabilitySkipHosts).split(/[\r\n,;\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 200)
          : null),
      clientRects: allowed(privacyValue.clientRects, ["real", "noise"], privacyValue.clientRects === "real" ? "real" : "noise"),
      speech: allowed(privacyValue.speech, ["real", "blocked", "noise"], privacyValue.speech === "blocked" ? "blocked" : (privacyValue.speech === "noise" ? "noise" : "real")),
      deviceNameMode: allowed(privacyValue.deviceNameMode, ["noise", "custom", "real"], "noise"),
      deviceName: String(privacyValue.deviceName || "").slice(0, 120),
      dnt: privacyValue.dnt === true || privacyValue.dnt === "on" ? true : (privacyValue.dnt === false || privacyValue.dnt === "off" ? false : Boolean(privacyValue.dnt)),
      dntMode: allowed(privacyValue.dntMode, ["default", "on", "off"], privacyValue.dnt === true ? "on" : (privacyValue.dnt === false ? "off" : "default")),
      networkConditions: (() => {
        const raw = privacyValue.networkConditions;
        if (!raw || typeof raw !== "object") return null;
        const out = { offline: Boolean(raw.offline), latency: null, downloadThroughput: null, uploadThroughput: null };
        if (Number.isFinite(Number(raw.latency))) out.latency = Math.min(60000, Math.max(0, Number(raw.latency)));
        if (Number.isFinite(Number(raw.downloadThroughput))) out.downloadThroughput = Math.min(1073741824, Math.max(0, Number(raw.downloadThroughput)));
        if (Number.isFinite(Number(raw.uploadThroughput))) out.uploadThroughput = Math.min(1073741824, Math.max(0, Number(raw.uploadThroughput)));
        return out;
      })(),
      portScanProtect: Boolean(privacyValue.portScanProtect),
      portScanAllow: String(privacyValue.portScanAllow || "").slice(0, 500),
      cfOptimize: privacyValue.cfOptimize !== false,
      refreshFingerprintOnStart: Boolean(privacyValue.refreshFingerprintOnStart),
      // 对齐扩展字段：分辨率跟随系统 / 字体指纹模式 / MAC 地址 / 硬件加速 / 沙盒 / 启动参数
      resolutionMode: privacyValue.resolutionMode === "real" ? "real" : "",
      fontListMode: allowed(privacyValue.fontListMode, ["real", "noise"], ""),
      macMode: allowed(privacyValue.macMode, ["real", "custom"], "real"),
      mac,
      hardwareAcceleration: allowed(privacyValue.hardwareAcceleration, ["on", "off"], "on"),
      noSandbox: Boolean(privacyValue.noSandbox),
      customArgs,
      fullscreen: Boolean(privacyValue.fullscreen),
      windowPos: allowed(privacyValue.windowPos, ["tl", "tm", "tr", "ml", "mm", "mr", "bl", "bm", "br"], ""),
      searchEngine: allowed(privacyValue.searchEngine, ["google", "bing", "yahoo", "yandex", "duckduckgo"], ""),
      // Windows UI scale override for the managed kernel window (browser chrome size).
      // Absent -> null, so chromeArgsForFingerprint falls back to the host display scale.
      forceDeviceScaleFactor: (() => {
        const n = Number(privacyValue.forceDeviceScaleFactor);
        return Number.isFinite(n) && n > 0 ? Math.min(5, Math.max(0.5, Math.round(n * 100) / 100)) : null;
      })(),
      cores,
      memory,
      ...(fingerprintValue ? { fingerprint: sanitizeFingerprintConfig(fingerprintValue, cores, memory) } : {}),
    },
    advanced: {
      saveCookies: advancedValue.saveCookies !== false,
      savePasswords: Boolean(advancedValue.savePasswords),
      saveBookmarks: advancedValue.saveBookmarks !== false,
      saveLocalStorage: advancedValue.saveLocalStorage !== false,
      saveIndexedDB: advancedValue.saveIndexedDB !== false,
      saveHistory: advancedValue.saveHistory !== false,
      allowSignin: Boolean(advancedValue.allowSignin),
      restoreSession: Boolean(advancedValue.restoreSession) || advancedValue.tabMode === "restore",
      blockVideo: Boolean(advancedValue.blockVideo || advancedValue.blockSound),
      blockImages: Boolean(advancedValue.blockImages),
      clearCacheOnStart: Boolean(advancedValue.clearCacheOnStart),
      clearCookiesOnStart: Boolean(advancedValue.clearCookiesOnStart),
      clearLocalStorageOnStart: Boolean(advancedValue.clearLocalStorageOnStart),
      // Roxy 对齐：启动前删除历史记录 / 忽略 HTTPS 证书错误（ignoreHttpsError）
      clearHistoryOnStart: Boolean(advancedValue.clearHistoryOnStart),
      ignoreHttpsError: Boolean(advancedValue.ignoreHttpsError),
      ipChangePolicy: allowed(advancedValue.ipChangePolicy, ["patch", "notify", "stop"], "patch"),
      cloudBackup: Boolean(advancedValue.cloudBackup),
      syncCookiesOnClose: advancedValue.syncCookiesOnClose !== false,
      syncIndexedDB: Boolean(advancedValue.syncIndexedDB),
      syncLocalStorage: Boolean(advancedValue.syncLocalStorage),
      // Roxy 对齐：Session Storage 同步 + 数据
      syncSessionStorage: Boolean(advancedValue.syncSessionStorage),
      sessionStorages: String(advancedValue.sessionStorages || "").slice(0, 200000),
      syncPasswords: Boolean(advancedValue.syncPasswords),
      syncExtensionData: Boolean(advancedValue.syncExtensionData),
      syncTab: advancedValue.syncTab !== false,
      syncHistory: Boolean(advancedValue.syncHistory),
      multiOpen: Boolean(advancedValue.multiOpen),
      tabMode: allowed(advancedValue.tabMode, ["fixed", "restore"], advancedValue.restoreSession ? "restore" : "fixed"),
      startUrls: String(advancedValue.startUrls || effectiveStartUrl || "").slice(0, 8000),
      blockUrls: String(advancedValue.blockUrls || "").slice(0, 8000),
      blockSound: Boolean(advancedValue.blockSound),
      // Roxy 对齐：弹出保存密码提示（blockPasswordPrompt = !promptSavePassword 的历史字段继续保留）
      promptSavePassword: advancedValue.promptSavePassword !== undefined ? Boolean(advancedValue.promptSavePassword) : !Boolean(advancedValue.blockPasswordPrompt),
      stopOpenNet: Boolean(advancedValue.stopOpenNet),
      stopOpenIPChange: Boolean(advancedValue.stopOpenIPChange),
      stopOpenIPCountryChange: Boolean(advancedValue.stopOpenIPCountryChange),
      openWorkbench: allowed(advancedValue.openWorkbench, ["0", "1", "2"], "1"),
      ipChangeRemind: allowed(advancedValue.ipChangeRemind, ["0", "1", "2"], "2"),
      googleLogin: allowed(advancedValue.googleLogin, ["0", "1", "2"], "2"),
      allowUrls: String(advancedValue.allowUrls || "").slice(0, 8000),
      blockPasswordPrompt: Boolean(advancedValue.blockPasswordPrompt),
      blockRestoreDialog: advancedValue.blockRestoreDialog !== false,
      blockNotifications: advancedValue.blockNotifications !== false,
      blockPopups: Boolean(advancedValue.blockPopups),
      // 归一化 JS 堆上限：有限数字且 >0 → 钳位到 [256, 16384] MB 存数值；
      // true（UI checkbox=启用限制）→ 默认 4096；其余（false/null/undefined）→ null。
      // 历史版本存 Boolean 值，start.js 消费端把 true 折算成 256MB，见 start.js 消费处。
      jsHeapMax: (() => {
        if (advancedValue.jsHeapMax === true) return 4096;
        const n = Number(advancedValue.jsHeapMax);
        return Number.isFinite(n) && n > 0 ? Math.min(16384, Math.max(256, Math.round(n))) : null;
      })(),
      showInfoPage: advancedValue.showInfoPage !== false,
      showPasswordOnInfo: Boolean(advancedValue.showPasswordOnInfo),
      loadGlobalBookmarks: Boolean(advancedValue.loadGlobalBookmarks),
      showBookmarkBar: Boolean(advancedValue.showBookmarkBar),
      uploadBookmarks: Boolean(advancedValue.uploadBookmarks),
    },
  };
}

module.exports = {
  MAX_PROFILE_PROXY_LENGTH,
  sanitizeProfile,
};


// Module-scope helper, hoisted so the sanitizeProfile body above can call it.
// Rebuilds privacy.fingerprint through an EXPLICIT key whitelist. The former
// spread passthrough let arbitrary unknown keys from raw API objects and
// legacy/cloud-restored profiles survive into the engine store and from there
// into every export surface (dumpToJson / sqlite dump / cloud backup all
// serialize the store verbatim). The key set and per-key rules follow the
// persona.js consumer inventory: dropping a key persona actually reads would
// silently re-roll users' fingerprint identity, so the list is the FULL
// consumed set (plus legacy-carried keys with no current writer), not a
// minimal one. Unknown keys are dropped by construction — that is the fix.
function sanitizeFingerprintConfig(fp, privacyCores, privacyMemory) {
  const str = (v, cap) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).replace(/[\r\n]/g, " ").trim();
    return s ? s.slice(0, cap) : undefined;
  };
  const bool = (v) => (typeof v === "boolean" ? v : undefined);
  const intInRange = (v, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
  };
  const oneOf = (v, list) => (list.includes(v) ? v : undefined);
  const strList = (v, capEntries, capEach) => {
    const arr = Array.isArray(v) ? v : (typeof v === "string" ? v.split(/[\n,，;；]+/) : null);
    if (!arr) return undefined;
    const out = arr
      .map((s) => String(s).replace(/[\r\n]/g, "").trim()).filter(Boolean)
      .slice(0, capEntries).map((s) => s.slice(0, capEach));
    return out.length ? out : undefined;
  };
  const intSeed = (v, round = true) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return undefined;
    return round ? Math.round(n) : n;
  };
  const snapDeviceMemory = (v) => {
    const steps = [0.25, 0.5, 1, 2, 4, 8];
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    const c = Math.min(8, Math.max(0.25, n));
    return steps.reduce((best, step) => (Math.abs(step - c) < Math.abs(best - c) ? step : best), steps[0]);
  };
  const batteryObject = (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
    if (!Number.isFinite(Number(v.level))) return undefined;
    const out = { charging: v.charging !== false, level: Math.min(1, Math.max(0, Number(v.level))) };
    // The old rule silently stripped these two: the editor writes them
    // (battery form) and the generators consume them, so every save was
    // discarding user input on these fields.
    const ct = Number(v.chargingTime);
    const dt = Number(v.dischargingTime);
    if (Number.isFinite(ct) && ct >= 0) out.chargingTime = Math.round(ct);
    if (Number.isFinite(dt) && dt >= 0) out.dischargingTime = Math.round(dt);
    return out;
  };
  const clientHintsOf = (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
    const out = {};
    const put = (k, val) => { if (val !== undefined) out[k] = val; };
    put("os", str(v.os, 40));
    put("architecture", str(v.architecture, 40));
    put("platform_version", str(v.platform_version, 40));
    put("platformVersion", str(v.platformVersion, 40));
    put("ua_full_version", str(v.ua_full_version, 80));
    put("chromeMajor", intInRange(v.chromeMajor, 1, 999));
    put("model", str(v.model, 120));
    put("mobile", bool(v.mobile));
    put("wow64", bool(v.wow64));
    put("bitness", oneOf(v.bitness, ["32", "64"]));
    return Object.keys(out).length ? out : undefined;
  };
  const webgpuObject = (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
    const out = {};
    const vendor = str(v.vendor, 40);
    const architecture = str(v.architecture, 40);
    if (vendor !== undefined) out.vendor = vendor;
    if (architecture !== undefined) out.architecture = architecture;
    return Object.keys(out).length ? out : undefined;
  };
  const mediaDevicesArray = (v) => {
    if (!Array.isArray(v)) return undefined;
    const out = v.slice(0, 8).map((d) => {
      if (!d || typeof d !== "object") return null;
      const kind = oneOf(d.kind, ["audioinput", "videoinput", "audiooutput"]);
      if (!kind) return null;
      return {
        kind,
        label: String(d.label || "").replace(/[\r\n]/g, " ").slice(0, 200),
        deviceId: String(d.deviceId || "").replace(/[\r\n]/g, "").slice(0, 64),
        groupId: String(d.groupId || "").replace(/[\r\n]/g, "").slice(0, 64),
      };
    }).filter(Boolean);
    return out.length ? out : undefined;
  };
  const mediaLabelsObject = (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
    const out = {};
    for (const k of ["audioinput", "videoinput", "audiooutput"]) {
      const s = str(v[k], 200);
      if (s !== undefined) out[k] = s;
    }
    return Object.keys(out).length ? out : undefined;
  };
  const networkObject = (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
    const out = {};
    const type = oneOf(v.type, ["ethernet", "wifi"]); if (type) out.type = type;
    const et = oneOf(v.effectiveType, ["slow-2g", "2g", "3g", "4g"]); if (et) out.effectiveType = et;
    const dl = Number(v.downlink);
    if (Number.isFinite(dl)) out.downlink = Math.min(10, Math.max(0, dl));
    const rtt = intInRange(v.rtt, 0, 3000); if (rtt !== undefined) out.rtt = rtt;
    return Object.keys(out).length ? out : undefined;
  };

  const out = {};
  const set = (key, value) => { if (value !== undefined) out[key] = value; };

  // --- Identity / OS group (os is load-bearing: persona.js:141 reads it
  // BEFORE the profile's own os field; keep it bounded but unmapped —
  // persona.js normalizeOsKey stays the single alias-mapping authority. ---
  set("os", str(fp.os, 40));
  set("clientHints", clientHintsOf(fp.clientHints));
  set("platform", str(fp.platform, 40));
  set("userAgent", str(fp.userAgent, 1000));
  set("languages", strList(fp.languages, 400, 40));
  set("vendor", str(fp.vendor, 80));
  set("deviceProfile", oneOf(fp.deviceProfile, ["default", "persona"]));

  // --- Hardware / screen group ---
  set("cores", privacyCores === null || privacyCores === undefined
    ? (fp.cores === 0 || fp.cores === "0" ? 0 : (fp.cores ?? null))
    : privacyCores);
  set("memory", privacyMemory === null || privacyMemory === undefined
    ? (fp.memory === 0 || fp.memory === "0" ? 0 : (fp.memory ?? null))
    : privacyMemory);
  set("hardwareConcurrency", intInRange(fp.hardwareConcurrency, 1, 64));
  set("deviceMemory", snapDeviceMemory(fp.deviceMemory));
  set("maxTouchPoints", intInRange(fp.maxTouchPoints, 0, 64));
  set("screenWidth", intInRange(fp.screenWidth, 640, 7680));
  set("screenHeight", intInRange(fp.screenHeight, 480, 4320));
  set("availLeft", intInRange(fp.availLeft, 0, 7680));
  set("availTop", intInRange(fp.availTop, 0, 7680));
  set("availWidth", intInRange(fp.availWidth, 0, 7680));
  set("availHeight", intInRange(fp.availHeight, 0, 7680));
  set("screenX", intInRange(fp.screenX, 0, 7680));
  set("screenY", intInRange(fp.screenY, 0, 7680));
  set("taskbarHeight", intInRange(fp.taskbarHeight, 0, 200));
  set("colorDepth", [24, 30].includes(Number(fp.colorDepth)) ? Number(fp.colorDepth) : undefined);
  set("hdr", bool(fp.hdr));
  set("devicePixelRatio", (() => {
    const n = Number(fp.devicePixelRatio);
    return Number.isFinite(n) && n > 0 ? Math.min(5, Math.max(0.5, Math.round(n * 100) / 100)) : undefined;
  })());

  // --- Noise-mode group (fingerprint-level twins of privacy-level modes;
  // persona mode() reads them FIRST, so they silently override the editor's
  // privacy settings when present — exactly why junk values must not survive) ---
  set("canvas", oneOf(fp.canvas, ["real", "noise", "blocked"]));
  set("webgl", oneOf(fp.webgl, ["real", "noise", "blocked"]));
  set("webglMeta", oneOf(fp.webglMeta, ["noise", "custom", "real", "blocked"]));
  set("audio", oneOf(fp.audio, ["real", "noise", "muted"]));
  set("clientRects", oneOf(fp.clientRects, ["real", "noise"]));
  set("webrtc", oneOf(fp.webrtc, ["real", "proxy", "disabled"]));
  set("speech", oneOf(fp.speech, ["real", "noise", "blocked"]));
  set("bluetooth", oneOf(fp.bluetooth, ["real", "blocked"]));
  set("networkMode", oneOf(fp.networkMode, ["real", "noise"]));
  set("macMode", oneOf(fp.macMode, ["real", "custom"]));
  set("deviceNameMode", oneOf(fp.deviceNameMode, ["noise", "custom", "real"]));

  // --- Dual-form keys: one key, two surfaces (mode string vs data object) ---
  if (typeof fp.battery === "string") set("battery", oneOf(fp.battery, ["real", "noise", "blocked"]));
  else set("battery", batteryObject(fp.battery));
  if (typeof fp.webgpu === "string") set("webgpu", oneOf(fp.webgpu, ["real", "blocked", "webgl"]));
  else set("webgpu", webgpuObject(fp.webgpu));
  if (typeof fp.mediaDevices === "string") set("mediaDevices", oneOf(fp.mediaDevices, ["real", "noise", "empty"]));
  else set("mediaDevices", mediaDevicesArray(fp.mediaDevices));

  // --- Seeds / WebGL identity ---
  set("canvasId", intSeed(fp.canvasId));
  set("clientRectsId", intSeed(fp.clientRectsId));
  set("audioId", intSeed(fp.audioId, false)); // float seed by design
  set("webglId", intSeed(fp.webglId));
  set("webglVendor", String(fp.webglVendor ?? "").replace(/[\r\n]/g, " ").slice(0, 200));
  set("webglRenderer", String(fp.webglRenderer ?? "").replace(/[\r\n]/g, " ").slice(0, 400));
  set("gpuVendor", str(fp.gpuVendor, 40));
  set("gpuArchitecture", str(fp.gpuArchitecture, 40));
  set("reconcileHost", bool(fp.reconcileHost));
  set("webglReconcileHost", bool(fp.webglReconcileHost));
  set("webglCapabilityGating", bool(fp.webglCapabilityGating));
  set("lazyFontPayload", bool(fp.lazyFontPayload));

  // --- UA-CH / strictness group ---
  if (fp.uaStrict) out.uaStrict = Boolean(fp.uaStrict);
  set("chromeMajor", intInRange(fp.chromeMajor, 1, 999));
  set("ua_full_version", str(fp.ua_full_version, 80));
  set("fullVersion", str(fp.fullVersion, 80));
  set("architecture", str(fp.architecture, 40));
  set("platform_version", str(fp.platform_version, 40));
  set("platformVersion", str(fp.platformVersion, 40));
  set("model", str(fp.model, 120));
  set("mobile", bool(fp.mobile));
  set("wow64", bool(fp.wow64));
  set("bitness", oneOf(fp.bitness, ["32", "64"]));

  // --- Peripherals / WebRTC / network persona ---
  set("mediaLabels", mediaLabelsObject(fp.mediaLabels));
  set("deviceName", str(fp.deviceName, 120));
  set("mac", (() => {
    const s = String(fp.mac || "").toUpperCase().replace(/-/g, ":").trim();
    return /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/.test(s) ? s : "";
  })());
  set("webrtcAddress", str(fp.webrtcAddress, 80));
  const wlip = str(fp.webrtcLocalIp, 80);
  if (wlip && /^(\d{1,3}\.){3}\d{1,3}$/.test(wlip)) set("webrtcLocalIp", wlip);
  set("network", networkObject(fp.network));
  set("fonts", strList(fp.fonts, 400, 200)); // string form now splits; entries mirror the old array rule
  set("sslVersionMin", oneOf(String(fp.sslVersionMin || ""), ["tls1.2", "tls1.3"]));
  set("sslBlacklist", String(fp.sslBlacklist ?? "").split(/[\s,;，；]+/)
    .map((s) => s.trim()).filter((s) => /^0x[0-9a-fA-F]{4}$/.test(s)).slice(0, 64).join(",") || undefined);

  // --- Stability group (fingerprint-level twins of the privacy-level editor fields) ---
  set("stabilityMode", oneOf(fp.stabilityMode, ["off", "auto", "force"]));
  set("stabilityHost", str(fp.stabilityHost, 200));
  set("stabilityHosts", (() => {
    const arr = strList(fp.stabilityHosts, 800, 200);
    return arr ? arr.map((s) => s.toLowerCase()) : undefined;
  })());
  set("stabilitySkipHosts", (() => {
    const arr = strList(fp.stabilitySkipHosts, 200, 200);
    return arr ? arr.map((s) => s.toLowerCase()) : undefined;
  })());
  set("stabilityHamming", intInRange(fp.stabilityHamming, 1, 64));
  set("stabilityMaxWidth", intInRange(fp.stabilityMaxWidth, 64, 4096));
  set("stabilityMaxHeight", intInRange(fp.stabilityMaxHeight, 64, 4096));
  set("stabilitySquare", intInRange(fp.stabilitySquare, 2, 64));

  return Object.keys(out).length ? out : undefined;
}

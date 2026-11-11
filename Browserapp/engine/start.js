'use strict';

/**
 * Startup routine mixin for BrowserEngine (prototype-assigned by engine.js):
 * _start is the full spawn-to-settle pipeline — language/timezone resolution,
 * proxy preparation, kernel launch, CDP attach, runtime settings injection and
 * start-page handover. The public entry `start` stays in engine.js and calls
 * this._start through the prototype. The timezone helpers isValidIanaTimezone
 * and extractTimezoneFromArgs are used only here; engine.js imports them back
 * to preserve its module.exports surface.
 */

const { ensureKernelReadyForLaunch } = require('../automation/browser-kernel');
const { buildBaseLaunchArguments, completeLaunchArguments, SECURITY_SWITCH_DENYLIST } = require('./launch-arguments');
const { normalizeEnvNumber, prepareMacDockWrapper, prepareMarkerExtension } = require('../automation/env-icon');
const { buildFingerprint } = require('../automation/fingerprint');
const { fpLog, summarizeFp, logPath: fingerprintLogPath } = require('../automation/fingerprint-debug-log');
const { acquireProfileLock, updateProfileLock, validateProfileRootSecure } = require('../automation/isolation');
const { fingerprintForNativeKernelInject, isOpenBrowser148, writeOpenBrowserKernelInit } = require('../automation/kernel-init-sync');
const { resolveProfileTimezone } = require('../automation/locale-from-country');
const { mergeLoadExtensionArgs } = require('../automation/protocol/app-center-protocol');
const { portConnection, reconcileOnConnection } = require('../extension-pipe');
const { appendDiagnosticOutput, formatBrowserStartupError, isChildExited, removeSingletonFiles, writeBrowserStartupDiagnostic, writeRawAtomically } = require('./index');
const { assertResourceGateForLaunch } = require('./resource-gate');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { readDeferredSessionUrls, preserveLegacySession, openVerifiedStartupTabs } = require('./startup-session');

// Browserapp/ app root (this file lives in Browserapp/engine/). Resource
// bundles such as kernels/ and bundled-extension/ sit next to main.js, one
// level above this module — path.join(__dirname, 'kernels') would resolve to
// the non-existent engine/kernels and silently drop every resource root.
const APP_ROOT = path.join(__dirname, '..');

// proxy-forwarder is optional: the guarded require keeps a broken optional
// dependency from taking the startup path down (same pattern as engine.js).
let proxyForwarderModule;
try {
  proxyForwarderModule = require('../proxy-forwarder');
} catch (pfErr) {
  console.warn('[BrowserEngine/start] Note: proxy-forwarder module load warning:', pfErr.message);
}
const {
  startAuthenticatedProxy = async () => ({ port: 0, close: () => {} }),
  needsProxyBridge = () => false,
  chromeProxyEndpoint = () => '',
} = proxyForwarderModule;

/**
 * Validate whether a string is a recognized, valid IANA time zone identifier.
 */
function isValidIanaTimezone(tz) {
  if (!tz || typeof tz !== "string") return false;
  const trimmed = tz.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Extract an explicit --time-zone-for-testing value from launch args if present.
 */
function extractTimezoneFromArgs(args) {
  if (!Array.isArray(args)) return null;
  for (let i = args.length - 1; i >= 0; i -= 1) {
    const item = String(args[i] || "");
    if (item.startsWith("--time-zone-for-testing=")) {
      const val = item.slice("--time-zone-for-testing=".length).trim();
      return val || null;
    }
  }
  return null;
}

// 默认搜索引擎模板（对齐常见指纹浏览器的搜索引擎选择）。写入 Default/Preferences 的
// default_search_provider_data.template_url_data，内核首次启动即按此渲染 NTP/ omnibox。
const SEARCH_ENGINE_TEMPLATES = {
  google: { short_name: 'Google', keyword: 'google.com', favicon_url: 'https://www.google.com/favicon.ico', url: 'https://www.google.com/search?q={searchTerms}', suggestions_url: 'https://www.google.com/complete/search?client=chrome&q={searchTerms}' },
  bing: { short_name: 'Microsoft Bing', keyword: 'bing.com', favicon_url: 'https://www.bing.com/favicon.ico', url: 'https://www.bing.com/search?q={searchTerms}', suggestions_url: 'https://www.bing.com/osjson.aspx?query={searchTerms}' },
  yahoo: { short_name: 'Yahoo', keyword: 'yahoo.com', favicon_url: 'https://www.yahoo.com/favicon.ico', url: 'https://search.yahoo.com/search?p={searchTerms}', suggestions_url: 'https://search.yahoo.com/sugg/os?command={searchTerms}' },
  yandex: { short_name: 'Yandex', keyword: 'yandex.com', favicon_url: 'https://yandex.com/favicon.ico', url: 'https://yandex.com/search/?text={searchTerms}', suggestions_url: 'https://suggest.yandex.com/suggest-ff.cgi?part={searchTerms}' },
  duckduckgo: { short_name: 'DuckDuckGo', keyword: 'duckduckgo.com', favicon_url: 'https://duckduckgo.com/favicon.ico', url: 'https://duckduckgo.com/?q={searchTerms}', suggestions_url: 'https://duckduckgo.com/ac/?q={searchTerms}&type=list' },
};

/**
 * Merge the chosen default search engine into <root>/Default/Preferences.
 * Existing Preferences keys are preserved; failure to write is non-fatal (the
 * environment still starts with the kernel default search engine).
 */
async function applyDefaultSearchEngine(root, engine) {
  const template = SEARCH_ENGINE_TEMPLATES[String(engine || '')];
  if (!template) return false;
  const prefsPath = path.join(root, 'Default', 'Preferences');
  let prefs = {};
  try { prefs = JSON.parse(await fsp.readFile(prefsPath, 'utf8')); } catch (_) { prefs = {}; }
  prefs.default_search_provider_data = prefs.default_search_provider_data && typeof prefs.default_search_provider_data === 'object'
    ? prefs.default_search_provider_data
    : {};
  prefs.default_search_provider_data.template_url_data = {
    short_name: template.short_name,
    keyword: template.keyword,
    url: template.url,
    suggestions_url: template.suggestions_url,
    favicon_url: template.favicon_url,
    safe_for_autoreplace: false,
    originating_url: '',
    prepopulate_id: 0,
    date_created: '13300000000000000',
    last_modified: '13300000000000000',
    sync_guid: 'openbrowser-' + String(engine),
    alternate_urls: [],
  };
  try {
    await fsp.mkdir(path.dirname(prefsPath), { recursive: true });
    // Atomic write (temp + rename): a partial Preferences file would be read by
    // the kernel as a corrupt profile on the very next launch.
    await writeRawAtomically(prefsPath, JSON.stringify(prefs));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Per-profile launch-time data clearing (对齐「启动浏览器前删除 Cookie / Local Storage」).
 * Cache clearing already exists via advanced.clearCacheOnStart; this covers the
 * cookie and local-storage/session/indexeddb stores. Best-effort deletes.
 * Target lists are engine-specific (Chromium nests stores under Default/,
 * Firefox keeps them in the profile root), so the walker below is shared and
 * parameterized by CHROMIUM_LAUNCH_DATA_TARGETS here and by the Firefox map in
 * engine/start-firefox.js.
 */
const CHROMIUM_LAUNCH_DATA_TARGETS = {
  cookies: ['Default/Network/Cookies', 'Default/Network/Cookies-journal', 'Default/Cookies', 'Default/Cookies-journal'],
  localStorage: ['Default/Local Storage/leveldb', 'Default/Session Storage', 'Default/IndexedDB'],
  history: ['Default/History', 'Default/History-journal', 'Default/History Provider Cache', 'Default/Visited Links'],
};

function clearProfileLaunchData(root, profile) {
  const advanced = profile?.advanced && typeof profile.advanced === 'object' ? profile.advanced : {};
  return clearLaunchDataTargets(root, advanced, CHROMIUM_LAUNCH_DATA_TARGETS);
}

/**
 * Shared best-effort walker behind clearProfileLaunchData (and the Firefox
 * variant in start-firefox.js): deletes every engine-specific target whose
 * launch-clear switch is on, returning the relative paths actually removed
 * (payload of the profile-launch-data-cleared event).
 */
async function clearLaunchDataTargets(root, advanced, targets) {
  const switches = advanced && typeof advanced === 'object' ? advanced : {};
  const rm = async (relative) => {
    try { await fsp.rm(path.join(root, relative), { recursive: true, force: true }); return true; } catch (_) { return false; }
  };
  const removed = [];
  if (switches.clearCookiesOnStart) {
    for (const relative of targets.cookies) {
      if (await rm(relative)) removed.push(relative);
    }
  }
  if (switches.clearLocalStorageOnStart) {
    for (const relative of targets.localStorage) {
      if (await rm(relative)) removed.push(relative);
    }
  }
  if (switches.clearHistoryOnStart) {
    for (const relative of targets.history) {
      if (await rm(relative)) removed.push(relative);
    }
  }
  return removed;
}

/**
 * Host display bounds for privacy.resolutionMode === 'real' (分辨率跟随系统).
 * The main process has the Electron screen module; failure falls back to the
 * profile's stored width/height.
 */
function hostScreenSummary() {
  try {
    const { screen } = require('electron');
    const display = screen.getPrimaryDisplay();
    const width = Number(display?.bounds?.width);
    const height = Number(display?.bounds?.height);
    if (Number.isFinite(width) && Number.isFinite(height) && width >= 640 && height >= 480) {
      return { width, height };
    }
  } catch (_) {}
  return null;
}

// 九宫格窗口位置：相对屏幕工作区的偏移比例（对齐「窗口位置」选择器）。
const WINDOW_POSITION_RATIOS = {
  tl: [0, 0], tm: [0.5, 0], tr: [1, 0],
  ml: [0, 0.5], mm: [0.5, 0.5], mr: [1, 0.5],
  bl: [0, 1], bm: [0.5, 1], br: [1, 1],
};

/**
 * --window-position for the selected grid cell, clamped into the work area so
 * corner cells never push the window titlebar off-screen.
 */
function windowPositionArg(profile) {
  const cell = String(profile.privacy?.windowPos || '');
  const ratios = WINDOW_POSITION_RATIOS[cell];
  if (!ratios) return null;
  try {
    const { screen } = require('electron');
    const workArea = screen.getPrimaryDisplay().workArea;
    const width = Math.min(Number(profile.width) || 1280, workArea.width);
    const height = Math.min(Number(profile.height) || 820, workArea.height);
    const x = Math.round((workArea.width - width) * ratios[0]) + workArea.x;
    const y = Math.round((workArea.height - height) * ratios[1]) + workArea.y;
    return `--window-position=${Math.max(workArea.x, x)},${Math.max(workArea.y, y)}`;
  } catch (_) {
    return null;
  }
}

/**
 * Commit a mid-start profile snapshot without clobbering concurrent edits.
 * A start can take seconds (proxy probes, kernel bootstrap, CDP attach); a
 * save from the editor during that window updates this.profiles directly.
 * Writing the start-time snapshot back wholesale would revert those edits
 * (proxy, fingerprint, advanced …) on the next persist. Instead, re-read the
 * live value and only merge the launch-computed runtime fields this snapshot
 * actually changed (exit details, resolved locale/timezone, effective proxy).
 * If the profile was deleted mid-start, the write-back is skipped entirely.
 */
function mergeLaunchProfileUpdate(engine, snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const live = engine.profiles.get(snapshot.id);
  if (!live || live === snapshot) return live || null;
  const merged = {
    ...live,
    // Exit/network details resolved during launch
    exitIp: snapshot.exitIp,
    exitCountryCode: snapshot.exitCountryCode,
    exitTimezone: snapshot.exitTimezone,
    exitLatitude: snapshot.exitLatitude,
    exitLongitude: snapshot.exitLongitude,
    exitCheckedAt: snapshot.exitCheckedAt,
    exitLatencyMs: snapshot.exitLatencyMs,
    exitNetworkType: snapshot.exitNetworkType,
    // Effective proxy after prepare (backup failover / API extraction)
    proxy: snapshot.proxy,
    proxyId: snapshot.proxyId,
    proxyMeta: snapshot.proxyMeta,
    // Resolved language / timezone-aligned privacy block
    language: snapshot.language,
    privacy: snapshot.privacy,
  };
  return engine.sanitizeProfile(merged);
}

/**
 * One-time identity migration for profiles that predate fingerprint seeds (or were created
 * via the API without one): buildFingerprint derives every axis from the profile id alone,
 * and batch ids are guessable sequences ("env-001") — anyone who knows the naming scheme
 * can replay the derivation and reproduce the fingerprint exactly. Roll a persistent seed
 * once; it lives in the profile record, so the identity stays portable across cloud restore,
 * and privacy.refreshFingerprintOnStart keeps its separate meaning (a fresh LAUNCH seed
 * every start). Best-effort persist: the in-memory copy already carries the seed for this
 * launch even if the disk write is momentarily blocked.
 */
async function ensureLegacyFingerprintSeed(engine, profile) {
  if (!profile || String(profile.fingerprintSeed || '').trim()) return false;
  profile.fingerprintSeed = crypto.randomBytes(16).toString('hex');
  try {
    engine.profiles.set(profile.id, profile);
    await engine.persist();
  } catch (_) {}
  return true;
}

module.exports = {
  async _start(raw, lifecycleGeneration = null) {
    // let: language/timezone resolution reassigns profile via applyResolvedLocale
    // start() already applied redaction recovery exactly once. Repeating it here
    // would undo an explicit proxyAuthAction=clear before launch.
    let profile = this.resolveStoredProxyProfile(this.sanitizeProfile(raw));
    // 记录本次启动前的出口 IP（上次运行持久化的值），供 ipChangePolicy 比对。
    const previousExitIp = String(profile.exitIp || '').trim();
    const previousExitCountryCode = String(profile.exitCountryCode || '').trim();
    this.profiles.set(profile.id, profile);
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.has(profile.id)) {
      return this.publicRunning(profile.id);
    }
    this.assertProxyConcurrencyAvailable(profile);
    // Surface cross-platform risks (Windows MAX_PATH on a deep data root, missing env,
    // Linux sandbox, …) once — turns silent per-platform breakage into an actionable event.
    if (!this._platformPreflightDone) {
      this._platformPreflightDone = true;
      try {
        const preflight = this.platformPreflightReport();
        if (preflight.warnings.length) this.emit({ type: 'platform-preflight', ok: preflight.ok, warnings: preflight.warnings });
      } catch (_) {}
    }
    let currentStage = 'prepare';
    this.emitStartProgress(profile.id, 'prepare', 6, '正在准备环境…');
    // Hoisted so the outer catch can release these if start throws after they are
    // acquired. The profile lock is keyed on the live Electron pid, so a leaked lock
    // does NOT self-heal while the app runs — it blocks this environment (with a
    // misleading "Profile already running") until a full app restart.
    let root = null;
    let profileLock = null;
    let proxyForwarder = null;
    let kernelWindowName = null;
    let liveItem = null;
    // Also referenced from the catch blocks below, which cannot see try-block
    // consts. Keeping them (browser especially) inside the try made every start
    // failure surface as "ReferenceError: browser is not defined" instead of the
    // real error. Declare them here so the catches report the actual failure.
    let browser = null;
    let item = null;
    let restoreSession = false;
    let startUrl = null;
    let injectionFailed = false;
    const startupResources = {
      root: null,
      profileLock: null,
      proxyForwarder: null,
      kernelWindowName: null,
      browser: null,
      launchBinary: null,
      child: null,
      connection: null,
    };
    try {
      profile = await this.prepareProfileProxyForStart(profile);
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    // Merge-only write-back: keep editor edits made while the launch was
    // resolving the effective proxy (see mergeLaunchProfileUpdate).
    const afterProxy = mergeLaunchProfileUpdate(this, profile);
    if (afterProxy) profile = afterProxy;
    // Roxy 客户端设置对齐：内存使用率超上限 / 磁盘可用空间低于下限 → 停止打开窗口。
    currentStage = 'resources'; this.emitStartProgress(profile.id, 'resources', 8, '正在检测内存与磁盘…');
    await assertResourceGateForLaunch({ diskRoot: this.profileRoot(profile.id) });
    currentStage = 'proxy'; this.emitStartProgress(profile.id, 'proxy', 18, '正在检测代理与出口…');
    // 「网络不通停止打开」：守护开启时强制做一次真实出口检测，失败即阻断启动。
    if (profile.advanced?.stopOpenNet) {
      try {
        await this.ensureExitNetworkForLocale(profile, { force: true });
      } catch (error) {
        throw Object.assign(new Error('网络不可用，已按「网络不通停止打开」策略停止启动：' + error.message), { code: 'network-unavailable' });
      }
      if (!String(profile.exitIp || '').trim()) {
        throw Object.assign(new Error('网络不可用，已按「网络不通停止打开」策略停止启动'), { code: 'network-unavailable' });
      }
    } else {
      await this.ensureExitNetworkForLocale(profile).catch(() => {});
    }
    profile = this.applyResolvedLocale(profile);
    // Same merge-only write-back after the locale/geo resolution pass.
    const afterLocale = mergeLaunchProfileUpdate(this, profile);
    if (afterLocale) profile = afterLocale;
    // IP 变化守护（对齐「IP 发生变化停止打开 / 提醒」）：patch = 默认，重对齐指纹继续；
    // stop = 启动阶段直接阻断；notify = 发出提醒事件但不阻断。仅在本次启动真的做了
    // 出口检测时才可能触发（同会话内的缓存命中不会误报）。
    const currentExitIp = String(profile.exitIp || '').trim();
    if (previousExitIp && currentExitIp && previousExitIp !== currentExitIp && profile.advanced?.ipChangePolicy && profile.advanced.ipChangePolicy !== 'patch') {
      const message = `出口 IP 已变化：${previousExitIp} → ${currentExitIp}`;
      if (profile.advanced.ipChangePolicy === 'stop') {
        throw Object.assign(new Error(message + '，已按「IP 变化停止打开」策略阻断启动'), { code: 'ip-changed' });
      }
      this.emit({ type: 'ip-change-notice', id: profile.id, previousExitIp, currentExitIp, message });
    }
    // 「IP 发生变化停止打开 / IP 对应国家发生改变停止打开」：独立于 ipChangePolicy 的硬闸。
    const currentExitCountryCode = String(profile.exitCountryCode || '').trim();
    if (profile.advanced?.stopOpenIPChange && previousExitIp && currentExitIp && previousExitIp !== currentExitIp) {
      throw Object.assign(new Error(`出口 IP 已变化：${previousExitIp} → ${currentExitIp}，已按「IP 发生变化停止打开」策略阻断启动`), { code: 'ip-changed' });
    }
    if (profile.advanced?.stopOpenIPCountryChange && previousExitCountryCode && currentExitCountryCode && previousExitCountryCode !== currentExitCountryCode) {
      throw Object.assign(new Error(`出口国家/地区已变化：${previousExitCountryCode} → ${currentExitCountryCode}，已按「IP 对应国家/地区发生改变停止打开」策略阻断启动`), { code: 'ip-country-changed' });
    }
    // Persist the effective proxy (including credentials returned by a dynamic
    // proxy API) before launching Chromium. A quit immediately after startup
    // must not leave the renderer's redacted copy as the durable state.
    await this.persist();
    const extensions = this.assignedExtensions(profile.id);
    currentStage = 'kernel'; this.emitStartProgress(profile.id, 'kernel', 30, '正在准备浏览器内核…');
    if (!this.kernelStatus().installed && this.preferIndependentKernel) {
      // Resolve integrated seed only — never download a remote kernel at start time.
      await this.ensureKernelBootstrap();
    }
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    // Explicit 'chromium': this profile must not silently fall into a Firefox
    // kernel even when a Firefox pin exists.
    browser = this.chooseBrowser(profile, 'chromium');
    root = this.profileRoot(profile.id);
    startupResources.root = root;
    const rootCheck = await validateProfileRootSecure(this.profileDataRootPath, root, profile.id, { create: true });
    if (!rootCheck.ok) throw new Error('Isolation error: ' + rootCheck.message);
    profileLock = await acquireProfileLock(root, {
      profileId: profile.id,
      browser: browser.path,
      lifecycleGeneration,
    });
    startupResources.profileLock = profileLock;
    startupResources.lifecycleGeneration = lifecycleGeneration;
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    restoreSession = profile.advanced.tabMode === 'restore' || profile.advanced.restoreSession;
    // Parallelized (independent IO overlaps; Preferences writers stay serialized). See method.
    await this.prepareProfileFilesForStart(root, profile, restoreSession);
    // F-7: the post-prep chain used to run four independent async steps
    // strictly in sequence (~4 round trips of fs IO). clearProfileLaunchData
    // (Cookies/LS/IDB removal), applyDefaultSearchEngine (Preferences write)
    // and ensureLegacyFingerprintSeed (one-time seed migration) touch
    // disjoint files, so they overlap; removeSingletonFiles already ran
    // inside prepareProfileFilesForStart and ran again here only as an
    // afterguard, so it joins the same batch. The clearedLaunchData event
    // still fires before spawn, and buildFingerprint below waits on the
    // batch before reading anything these writers own.
    const launchDataCleared = clearProfileLaunchData(root, profile);
    const searchEngineApplied = profile.privacy?.searchEngine
      ? applyDefaultSearchEngine(root, profile.privacy.searchEngine)
      : null;
    const seedEnsured = ensureLegacyFingerprintSeed(this, profile);
    await Promise.all([
      launchDataCleared,
      searchEngineApplied,
      seedEnsured,
      removeSingletonFiles(root, { attempts: 6, delayMs: 40 }),
    ]);
    const clearedLaunchData = await launchDataCleared;
    if (clearedLaunchData.length) {
      this.emit({ type: 'profile-launch-data-cleared', id: profile.id, removed: clearedLaunchData });
    }
    const pageNetwork = this.networkInfo.get(profile.id) || {};
    // Explicit identity refresh is independent of per-site sampling stability.
    const allowSeedRefresh = profile.privacy.refreshFingerprintOnStart;
    const fingerprint = buildFingerprint({
      ...profile,
      fingerprintLaunchSeed: allowSeedRefresh ? crypto.randomBytes(16).toString('hex') : '',
      kernelVersion: browser.version,
      exitTimezone: profile.exitTimezone || pageNetwork.timezone || '',
      exitLatitude: profile.exitLatitude ?? pageNetwork.latitude,
      exitLongitude: profile.exitLongitude ?? pageNetwork.longitude,
      hostScreen: hostScreenSummary(),
    });
    let customStartUrls = this.resolveStartupUrls(profile);
    if (restoreSession) {
      const restoredUrls = await readDeferredSessionUrls(root);
      if (restoredUrls.length) customStartUrls = restoredUrls;
      else await preserveLegacySession(root, 'chromium');
    }
    const infoStartUrl = profile.advanced.showInfoPage !== false
      ? await this.buildStartPageUrl(
        { ...profile, exitIp: pageNetwork.ip || profile.exitIp || '', title: profile.title || profile.name },
        root,
        browser.name,
        extensions.length,
        fingerprint
      )
      : null;
    startUrl = customStartUrls[0] || infoStartUrl;
    const proxyConfig = this.proxyConfig(profile.proxy);
    if (proxyConfig) {
      const meta = profile.proxyMeta || {};
      const major = Number(meta.tlsChromeMajor)
        || Number(fingerprint?.uaProfile?.chromeMajor)
        || Number(String(profile.userAgent || fingerprint?.userAgent || '').match(/Chrome\/(\d+)/)?.[1])
        || 0;
      proxyConfig.tlsProfile = {
        id: meta.tlsProfile || 'auto',
        chromeMajor: major || undefined,
      };
    }
    if (needsProxyBridge(proxyConfig)) {
      proxyForwarder = await startAuthenticatedProxy(proxyConfig, (value) => this.emit({ type: 'proxy-error', id: profile.id, code: value.code, message: value.message }));
      startupResources.proxyForwarder = proxyForwarder;
    }
    this.emitStartProgress(profile.id, 'configure', 48, '正在配置启动参数…');
    let hostScaleFactor = null;
    try {
      hostScaleFactor = this.getHostScaleFactor ? this.getHostScaleFactor() : null;
    } catch (_) {
      hostScaleFactor = null;
    }
    let args = buildBaseLaunchArguments({ root, fingerprint, profile, hostScaleFactor });
    // openbrowser-148: write profile/init.json so Framework native FP matches buildFingerprint
    let runtimeFingerprint = fingerprint;
    kernelWindowName = null;
    if (isOpenBrowser148(browser)) {
      try {
        const written = await writeOpenBrowserKernelInit(root, {
          fingerprint,
          profile,
          browserPath: browser.path,
          resourceRoots: [
            path.join(APP_ROOT, 'kernels'),
            __dirname,
            path.join(this.app.getPath('userData'), 'kernels'),
          ],
        });
        kernelWindowName = written.windowName;
        startupResources.kernelWindowName = kernelWindowName;
        runtimeFingerprint = fingerprintForNativeKernelInject(fingerprint);
        this.emit({
          type: 'kernel-init-synced',
          id: profile.id,
          windowName: written.windowName,
          path: written.path,
        });
      } catch (error) {
        this.emit({
          type: 'sync-error',
          action: 'kernel-init-sync',
          id: profile.id,
          message: '内核 init 指纹同步失败：' + error.message,
        });
        throw error;
      }
    }
    const configuredArgs = completeLaunchArguments(args, { profile, proxyConfig, restoreSession, startUrl,
      customStartUrls, windowPosition: windowPositionArg(profile),
      proxyEndpoint: proxyForwarder ? proxyForwarder.url : chromeProxyEndpoint(profile.proxy) });
    args = configuredArgs.args;
    const { rejectedCustomSwitches } = configuredArgs;
    if (rejectedCustomSwitches.length) {
      this.emit({
        type: 'sync-error',
        action: 'custom-args',
        id: profile.id,
        message: '已拒绝安全相关自定义启动参数（不可覆盖内置安全旗标）：' + rejectedCustomSwitches.join(' '),
      });
    }
    // Per-env marker extension: software logo + environment number (1, 2, …)
    const envNumber = normalizeEnvNumber(profile.number || profile.name || profile.id || '1');
    let markerExtensionPath = null;
    try {
      markerExtensionPath = await prepareMarkerExtension({
        profileId: profile.id,
        envNumber,
        userDataPath: this.app.getPath('userData'),
        templateDir: path.join(APP_ROOT, 'bundled-extension'),
      });
    } catch (error) {
      this.emit({ type: 'sync-error', action: 'env-marker-icon', id: profile.id, message: error.message });
    }

    // --load-extension for assigned unpacked apps + env marker (Win/macOS)
    const loadPaths = extensions.map((entry) => entry.path).filter((p) => p && fs.existsSync(p));
    if (markerExtensionPath && fs.existsSync(markerExtensionPath) && !loadPaths.includes(markerExtensionPath)) {
      loadPaths.push(markerExtensionPath);
    }
    const finalArgs = loadPaths.length ? mergeLoadExtensionArgs(args, loadPaths) : args;
    // Never put --accept-terms-and-conditions on the long-lived browser spawn.
    // Wayfern treats that flag as a one-shot accept-and-exit command; pre-accept via
    // ensureKernelReadyForLaunch() below, then launch without it so CDP can come up.
    for (let i = finalArgs.length - 1; i >= 0; i -= 1) {
      if (String(finalArgs[i]) === '--accept-terms-and-conditions') finalArgs.splice(i, 1);
    }

    // macOS + openbrowser-148 only: Dock wrapper so process shows logo-native+number.
    // Non-148 Chromium has no OpenBrowser.bin layout; do not force a shell (would fail hard).
    let launchBinary = browser.path;
    startupResources.browser = browser;
    startupResources.launchBinary = launchBinary;
    try {
      if (process.platform === 'darwin' && isOpenBrowser148(browser)) {
        const dockBin = await prepareMacDockWrapper({
          profileId: profile.id,
          envNumber,
          userDataPath: this.app.getPath('userData'),
          realBinary: browser.path,
        });
        if (dockBin && fs.existsSync(dockBin)) {
          launchBinary = dockBin;
          startupResources.launchBinary = launchBinary;
        }
      }
    } catch (error) {
      this.emit({ type: 'sync-error', action: 'env-dock-icon', id: profile.id, message: error.message });
    }

    let child;
    let childExitState;
    let connection;
    let port;
    try {
      currentStage = 'spawn'; this.emitStartProgress(profile.id, 'spawn', 62, '正在启动浏览器进程…');
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      await ensureKernelReadyForLaunch(browser);
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      const headless = /^(1|true|new)$/i.test(String(process.env.OPENBROWSER_HEADLESS || '').trim());
      if (headless && !finalArgs.some((arg) => /^--headless(?:=|$)/i.test(String(arg)))) {
        finalArgs.push('--headless=new');
        if (!finalArgs.some((arg) => String(arg).split('=')[0] === '--disable-gpu')) finalArgs.push('--disable-gpu');
      }
      const isRealTimezone = profile.privacy?.timezoneMode === 'real';
      const userExplicitTz = extractTimezoneFromArgs(finalArgs);
      const hasExplicitTzFlag = Boolean(userExplicitTz || finalArgs.some((arg) => /^--time-zone-for-testing(?:=|$)/i.test(String(arg))));

      let effectiveTimezone = '';
      if (hasExplicitTzFlag) {
        // User explicitly specified --time-zone-for-testing; honor explicit flag priority and avoid duplicates.
        if (isValidIanaTimezone(userExplicitTz)) {
          effectiveTimezone = userExplicitTz;
        }
      } else if (!isRealTimezone) {
        const resolvedTz = resolveProfileTimezone(profile, pageNetwork);
        const candidateTz = String(
          resolvedTz
          || profile.exitTimezone
          || pageNetwork?.timezone
          || (profile.privacy?.timezoneMode === 'custom' ? profile.privacy.timezone : '')
          || profile.privacy?.timezone
          || fingerprint?.timezone
          || ''
        ).trim();

        if (isValidIanaTimezone(candidateTz)) {
          effectiveTimezone = candidateTz;
          finalArgs.push(`--time-zone-for-testing=${effectiveTimezone}`);
        }
      }

      // Synchronize process-level timezone for POSIX kernels and C++ ICU subsystems.
      // On Windows, ICU reads the system registry rather than TZ, so passing
      // --time-zone-for-testing on the command line ensures the Chromium C++ core boots in
      // the persona timezone.
      const spawnEnv = { ...process.env };
      if (effectiveTimezone && !isRealTimezone && process.platform !== 'win32') {
        spawnEnv.TZ = effectiveTimezone;
      }
      child = spawn(launchBinary, finalArgs, {
        detached: process.platform !== 'win32',
        windowsHide: headless,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: spawnEnv,
      });
      startupResources.child = child;
      // Register these listeners immediately after spawn. CDP setup can take
      // several seconds, and an early browser exit must not be lost before the
      // running item is assembled below.
      childExitState = { exited: false, code: null, signal: null, error: null };
      child.once('exit', (code, signal) => {
        childExitState.exited = true;
        childExitState.code = code;
        childExitState.signal = signal;
      });
      child.once('error', (error) => {
        childExitState.error = error;
      });
      profileLock = await updateProfileLock(root, profileLock, {
        browserPid: child.pid,
        browserProfileRoot: path.resolve(root),
        browserExecutable: launchBinary,
        browserStartedAt: new Date().toISOString(),
      });
      if (!profileLock) {
        const error = new Error('Profile lock ownership changed while starting browser');
        error.code = 'PROFILE_LOCK_LOST';
        throw error;
      }
      startupResources.profileLock = profileLock;
      const startupDiagnostic = { launchBinary, profileRoot: root, stdout: '', stderr: '' };
      child._startupDiagnostic = startupDiagnostic;
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => { startupDiagnostic.stdout = appendDiagnosticOutput(startupDiagnostic.stdout, chunk); });
      child.stderr?.on('data', (chunk) => { startupDiagnostic.stderr = appendDiagnosticOutput(startupDiagnostic.stderr, chunk); });
      child.on('error', (error) => { startupDiagnostic.spawnError = error.message; });
      this.emitStartProgress(profile.id, 'cdp', 76, '正在等待调试端口…');
      port = await this.waitForPort(root, 30000, child);
      connection = await portConnection(port);
      startupResources.connection = connection;
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    } catch (error) {
      const diagnostic = child?._startupDiagnostic || { launchBinary, profileRoot: root };
      await writeBrowserStartupDiagnostic(this.app.getPath('userData'), {
        type: 'browser-startup-failure',
        profileId: profile.id,
        browser: browser.name,
        source: browser.source || null,
        error: formatBrowserStartupError(error, child, diagnostic),
        executable: launchBinary,
        profileRoot: root,
        exitCode: child?.exitCode ?? null,
        signal: child?.signalCode || null,
        stdout: diagnostic.stdout || '',
        stderr: diagnostic.stderr || '',
        spawnError: diagnostic.spawnError || null,
      });
      await this.cleanupStartupResources(startupResources);
      // Preserve the original error object: rewrapping into a fresh Error dropped
      // .code (PROFILE_LOCK_LOST / BROWSER_START_CANCELLED) and the stack, which
      // the restart/RPA flows match on. Assign the formatted message, rethrow the original.
      if (error && typeof error === 'object') {
        error.message = formatBrowserStartupError(error, child, diagnostic);
        throw error;
      }
      throw new Error(formatBrowserStartupError(error, child, diagnostic));
    }
    if (profile.cookies && profile.advanced.saveCookies) { try { await this.importProfileCookies(connection, profile.cookies); } catch (error) { this.emit({ type: 'sync-error', action: 'import-cookies', id: profile.id, message: 'Cookie 导入失败：' + error.message }); } }
    let reconciled;
    try {
      const managedPaths = [...this.extensions.values()].map((item) => item.path).filter(Boolean);
      reconciled = await reconcileOnConnection(connection, extensions, managedPaths);
      if (reconciled?.skipped) {
        // Expected on openbrowser-148: not an error. Extensions still load via --load-extension.
        this.emit({
          type: 'status',
          action: 'extensions-reconcile-skipped',
          id: profile.id,
          running: true,
          message: '扩展已通过 --load-extension 加载（当前内核不支持 Extensions CDP 热装）',
          reason: reconciled.reason || 'Extensions CDP unavailable',
        });
      }
    } catch (error) {
      // OpenBrowser 148 kernels may lack Extensions.* CDP — do not kill the browser.
      const msg = String(error && error.message || error || '');
      if (/not available|unknown method|was not found|not found|unsupported/i.test(msg)) {
        reconciled = { installed: extensions, extensions: [], skipped: true, reason: msg };
        this.emit({
          type: 'status',
          action: 'extensions-reconcile-skipped',
          id: profile.id,
          running: true,
          message: '扩展已通过 --load-extension 加载（当前内核不支持 Extensions CDP 热装）',
          reason: msg,
        });
      } else {
        await this.cleanupStartupResources(startupResources);
        throw error;
      }
    }
    const markerProcess = this.startNativeProfileMarker(child.pid, envNumber);
    item = {
      child, cdpConnection: connection, proxyForwarder, markerProcess, profileLock,
      pid: child.pid, browser, root, profile, port,
      launchBinary,
      startedAt: new Date().toISOString(),
      extensions: extensions.map((entry) => entry.id),
      loadedExtensions: reconciled.extensions,
      fingerprint,
      kernelWindowName: kernelWindowName || null,
      nativeKernelFingerprint: isOpenBrowser148(browser),
      childExitState: childExitState || { exited: isChildExited(child), code: child.exitCode, signal: child.signalCode, error: null },
      lifecycleGeneration,
      cleanupState: 'active',
      cleanupAttempts: 0,
      cleanedUp: false,
      stopping: false,
      cleanupPromise: null,
      statusEmitted: false,
      profileClosedEmitted: false,
    };
    this.running.set(profile.id, item);
    liveItem = item;
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);

    const handleChildExit = (code, signal) => {
      const expected = item.stopping === true || code === 0;
      const error = expected
        ? null
        : `浏览器异常退出${signal ? ` (${signal})` : ` (code ${code})`}`;
      this.handleBrowserGone(profile.id, item, 'browser-exit', {
        expected,
        error,
        kill: true,
        waitForExit: true,
      }).catch((cleanupError) => {
        this.emit({ type: 'sync-error', action: 'browser-exit-cleanup', id: profile.id, message: cleanupError.message });
      });
    };
    const handleChildError = (error) => {
      this.handleBrowserGone(profile.id, item, 'browser-error', {
        expected: false,
        error: error?.message || String(error),
        kill: true,
        waitForExit: true,
      }).catch(() => {});
    };
    child.once('exit', (code, signal) => {
      item.childExitState = { ...(item.childExitState || {}), exited: true, code, signal };
      handleChildExit(code, signal);
    });
    child.once('error', (error) => {
      item.childExitState = { ...(item.childExitState || {}), error };
      handleChildError(error);
    });
    // The process may have exited during CDP/bootstrap setup, before the item
    // listeners above were installed. Replay that state exactly once.
    if (item.childExitState?.exited) {
      queueMicrotask(() => handleChildExit(item.childExitState.code, item.childExitState.signal));
    } else if (item.childExitState?.error) {
      queueMicrotask(() => handleChildError(item.childExitState.error));
    }
    item.startupExtensionGuard = this.suppressStartupExtensionPages(connection, reconciled.installed).catch((error) => this.emit({ type: 'sync-error', action: 'startup-extension-pages', id: profile.id, message: error.message }));
    try {
      item.startUrl = startUrl;
      item.fpAppliedTargets = new Set();
      // Fingerprint inject BEFORE keepDefaultTab/start-page navigation so the welcome
      // page's collectFingerprint() sees spoofed navigator/WebGL (not the host GPU).
      // openbrowser-148: pixel noise may be native; JS still spoofs WebGL meta strings.
      const injectFp = item.nativeKernelFingerprint
        ? fingerprintForNativeKernelInject(fingerprint)
        : (runtimeFingerprint || fingerprint);
      await fpLog('start.inject-plan', {
        profileId: profile.id,
        port: item.port,
        launchBinary: item.launchBinary || launchBinary || browser.path,
        startUrl: startUrl || null,
        nativeKernel: Boolean(item.nativeKernelFingerprint),
        fullFp: summarizeFp(fingerprint),
        injectFp: summarizeFp(injectFp),
        logFile: fingerprintLogPath(),
      });
      currentStage = 'inject'; this.emitStartProgress(profile.id, 'inject', 88, '正在注入指纹与运行时…');
      let injectSucceeded = false;
      let injectError = null;

      // Fail-closed pre-inject with bounded retries (2 retries, total 3 attempts)
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          item.fingerprint = await this.applyRuntimeSettings(item.port, profile, injectFp, {
            appliedTargetIds: item.fpAppliedTargets,
            appliedFingerprintHash: item.fpAppliedHash,
            trackOn: item,
            phase: 'pre-startpage',
          }) || fingerprint;
          injectSucceeded = true;
          injectError = null;
          break;
        } catch (err) {
          injectError = err;
          await fpLog('start.pre-inject-fail-attempt', {
            profileId: profile.id,
            attempt,
            error: String(err?.message || err),
          });
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 120));
          }
        }
      }

      if (!injectSucceeded) {
        item.fingerprint = fingerprint;
        await fpLog('start.pre-inject-fail', {
          profileId: profile.id,
          error: String(injectError?.message || injectError),
        });
      }

      // Keep reported modes as profile intent (not the stripped inject payload)
      if (item.nativeKernelFingerprint && fingerprint) {
        item.fingerprint = {
          ...(item.fingerprint || fingerprint),
          canvas: fingerprint.canvas,
          webgl: fingerprint.webgl,
          audio: fingerprint.audio,
          clientRects: fingerprint.clientRects,
          userAgent: fingerprint.userAgent,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
        };
      }

      // Worker fingerprint injection with bounded retries
      let workerSucceeded = false;
      let workerError = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await this.startWorkerFingerprintInjection(item, injectFp);
          workerSucceeded = true;
          workerError = null;
          break;
        } catch (err) {
          workerError = err;
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      if (!workerSucceeded) {
        item.workerFingerprintError = workerError?.message || String(workerError);
        await fpLog('worker.inject-fail', { profileId: profile.id, error: String(workerError?.message || workerError) });
        this.emit({ type: 'worker-fingerprint-injection-failed', id: profile.id, message: workerError?.message || String(workerError) });
      }

      injectionFailed = !injectSucceeded || !workerSucceeded;

      if (injectionFailed) {
        item.verificationBlocked = true;
        const failureDetails = [
          !injectSucceeded ? ('Pre-inject 失败: ' + (injectError?.message || injectError || '未知错误')) : '',
          !workerSucceeded ? ('Worker inject 失败: ' + (workerError?.message || workerError || '未知错误')) : '',
        ].filter(Boolean).join('; ');
        item.fingerprintVerificationError = failureDetails;

        this.emit({
          type: 'fingerprint-injection-failed',
          id: profile.id,
          message: failureDetails,
          blocked: true,
        });

        throw Object.assign(new Error(failureDetails), { code: 'FINGERPRINT_INJECTION_FAILED' });
      } else {
        // Fail-Closed: Verify actual delivered fingerprint via CDP probe before target navigation
        currentStage = 'verify'; this.emitStartProgress(profile.id, 'verify', 92, '正在校验指纹交付…');
        let deliveryResult = { ok: false, blocked: true, mismatches: [], warnings: [] };
        try {
          deliveryResult = await this.verifyStartupFingerprintDelivery(item, profile, item.fingerprint || fingerprint);
        } catch (verifyError) {
          deliveryResult.mismatches.push({ field: 'probe', message: verifyError.message || String(verifyError) });
          await fpLog('start.delivery-verify-exception', {
            profileId: profile.id,
            error: String(verifyError?.message || verifyError),
          });
        }

        if (!deliveryResult?.ok) {
          const mismatchMessages = (deliveryResult?.mismatches || []).map((m) => typeof m === 'object' ? (m.message || JSON.stringify(m)) : String(m));
          const failureDetails = mismatchMessages.join('\n');
          item.fingerprintVerificationError = deliveryResult?.message || failureDetails;
          item.verificationBlocked = true;

          this.emit({
            type: 'fingerprint-verification-failed',
            id: profile.id,
            blocked: true,
            mismatches: deliveryResult?.mismatches || [],
            message: deliveryResult?.message || ('指纹交付校验失败: ' + mismatchMessages.join('; ')),
          });

          throw Object.assign(new Error(item.fingerprintVerificationError || '指纹未按配置交付，已停止浏览器'), { code: 'FINGERPRINT_DELIVERY_FAILED' });
        } else if (startUrl) {
          await fpLog('start.navigate-startpage', { profileId: profile.id, startUrl });
          try {
            await openVerifiedStartupTabs(this, item, [startUrl, ...customStartUrls.slice(1)]);
          } catch (navError) {
            await fpLog('start.navigate-fail', { profileId: profile.id, error: String(navError.message || navError) });
            throw navError;
          }
          try {
            await this.ensureStartPageFingerprint(item, profile, injectFp);
          } catch (reInjectError) {
            await fpLog('start.reinject-fail', { profileId: profile.id, error: String(reInjectError.message || reInjectError) });
            this.emit({
              type: 'fingerprint-injection-failed',
              id: profile.id,
              message: 'post-navigation verification: ' + reInjectError.message,
            });
            throw reInjectError;
          }
        }
      }
      // Brand window title as 环境 N (not generic Chrome)
      await this.applyEnvWindowTitle(item.port, profile).catch(() => {});
      await fpLog('start.done', {
        profileId: profile.id,
        port: item.port,
        reported: summarizeFp(item.fingerprint),
      });
    } catch (error) {
      if (item) item.cdpError = error.message;
      await fpLog('start.fail', { profileId: profile.id, error: String(error.message || error) });
      // Never navigate a target after an unverified startup exception.
      if (item) {
        item.verificationBlocked = true;
        item.fingerprintVerificationError = error.message;
      }
      throw error;
    }
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.get(profile.id) !== item || item.cleanedUp || item.stopping) {
      throw new Error(item.cdpError || '浏览器在启动过程中异常退出');
    }
    // Detect user closing browser with X (process may stay alive; CDP/pages are source of truth)
    this.startRunningWatch(item);
    currentStage = 'ready'; this.emitStartProgress(profile.id, 'ready', 100, '启动完成');
    this.emit({ type: 'status', id: profile.id, running: true, blocked: Boolean(item.verificationBlocked), ...this.publicRunning(profile.id) });
    return this.publicRunning(profile.id);
    } catch (error) {
      // Release anything acquired before the env became live. The inner spawn/extension
      // catches already release on their own failure paths (making this a safe no-op via
      // token/close idempotency); this covers the earlier steps — proxy bridge, tab reset,
      // start-page/fingerprint build — whose throws would otherwise strand the lock.
      let cleanupResult = null;
      if (liveItem) {
        // The item is published before runtime injection and start-page setup so
        // exit events can clean it up. If either step fails, run the same guarded
        // cleanup path instead of leaving a live map entry and profile lock behind.
        cleanupResult = await this.handleBrowserGone(profile.id, liveItem, 'start-failed', {
          expected: false,
          error: error?.message || String(error),
          kill: true,
          waitForExit: true,
          emitProfileClosed: false,
        }).catch(() => null);
      } else if (!this.running.has(profile.id)) {
        cleanupResult = await this.cleanupStartupResources(startupResources).catch(() => null);
        if (cleanupResult?.cleanupBlocked) {
          this.retainBlockedStartup(profile, startupResources, error, lifecycleGeneration, cleanupResult);
        }
      }
      const kernelVer = browser?.version || (isOpenBrowser148(browser) ? '148' : 'system');
      if (error && typeof error === 'object') {
        error.profileId = profile.id;
        error.stage = currentStage;
        error.phase = currentStage;
        error.kernelVersion = kernelVer;
        error.operation = 'start';
      }
      this.emit({
        type: 'profile-start-progress',
        id: profile.id,
        phase: 'error',
        stage: currentStage,
        kernelVersion: kernelVer,
        operation: 'start',
        percent: 0,
        message: error?.message || String(error || '启动失败'),
        starting: false,
        running: false,
        error: true,
      });
      throw error;
    }
  },

isValidIanaTimezone,
extractTimezoneFromArgs,
// Exported for engine/start-firefox.js (the Firefox launch pipeline reuses the
// walker with its own root-level target map) and for selftests. Assigned onto
// the prototype with the rest of this module's surface; both are pure
// (root, profile, targets) functions that never touch `this`.
clearProfileLaunchData,
clearLaunchDataTargets,
// Reused by the Firefox pipeline (engine/start-firefox.js) so both engines share
// the same merge-only write-back contract for mid-start profile snapshots.
mergeLaunchProfileUpdate,
// Shared by both launch pipelines: rolls the persistent seed a legacy (unseeded) profile
// is missing before its fingerprint is built (see the function comment above).
ensureLegacyFingerprintSeed,
// Single source of the security switch denylist used to filter
// profile.privacy.customArgs at launch time; exported for reuse and tests.
SECURITY_SWITCH_DENYLIST,
};

'use strict';

const { assertUrlAccessPolicySupported } = require('../automation/url-access-policy');

/**
 * Firefox launch pipeline: native prefs are written before spawn, then a loopback
 * WebDriver BiDi session registers main-world document-start injection, verifies
 * the initial blank page, and only then navigates the requested startup tabs.
 * CDP-specific consumers keep using port:null; the BiDi connection is tracked
 * separately and closed with the browser's profile lock/proxy resources.
 */

const { buildFirefoxUserJs, firefoxStartupArgs, firefoxPlatformDir } = require('../automation/kernel-versions');
const { acquireProfileLock, updateProfileLock, validateProfileRootSecure } = require('../automation/isolation');
const { removeSingletonFiles, writeBrowserStartupDiagnostic, formatBrowserStartupError, isChildExited } = require('./index');
const { assertResourceGateForLaunch } = require('./resource-gate');
// Shared launch-data walker (parameterized target map) from the Chromium
// startup mixin: start.js does not require this file, so there is no cycle.
const { clearLaunchDataTargets, mergeLaunchProfileUpdate, ensureLegacyFingerprintSeed } = require('./start');
const { spawn } = require('child_process');
const path = require('path');
const { readDeferredSessionUrls, preserveLegacySession } = require('./startup-session');
const { BidiConnection, waitForFirefoxEndpoint } = require('../network/bidi-connection');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup } = require('../automation/firefox-fingerprint');


// proxy-forwarder is optional in _start; keep the same guarded require here so
// a missing optional dependency cannot take the Firefox path down either.
let proxyForwarderModule;
try {
  proxyForwarderModule = require('../proxy-forwarder');
} catch (pfErr) {
  console.warn('[BrowserEngine/start-firefox] Note: proxy-forwarder module load warning:', pfErr.message);
}
const {
  startAuthenticatedProxy = async () => ({ port: 0, close: () => {} }),
  needsProxyBridge = () => false,
  chromeProxyEndpoint = () => '',
} = proxyForwarderModule;

/** Resolve the per-profile OS persona for the Firefox UA. */
function firefoxOsName(profile) {
  const os = String(profile?.os || profile?.fingerprint?.os || profile?.privacy?.fingerprint?.os || 'Windows').toLowerCase();
  if (os.startsWith('mac') || os.startsWith('darwin')) return 'mac';
  if (os.startsWith('win')) return 'win';
  return 'linux';
}

function collectAcceptLanguages(fingerprint, profile) {
  // Firefox derives BOTH the Accept-Language header and navigator.languages (including in
  // workers, where the best-effort injection cannot reach) from this one pref, and Firefox
  // 160 exposes the pref verbatim — quality values set here leak into navigator.languages as
  // literal "en;q=0.9" tags. A plain list keeps every surface self-consistent; the q-less
  // header is a real shape too (Firefox sends exactly what the user types in preferences).
  const fromFp = Array.isArray(fingerprint?.languages) && fingerprint.languages.length ? fingerprint.languages : null;
  const fromProfile = Array.isArray(profile?.languages) && profile.languages.length ? profile.languages : null;
  const single = profile?.language ? [profile.language] : null;
  return (fromFp || fromProfile || single || ['en-US']).join(',');
}

/**
 * Firefox-side retention cleanup, run before every launch (parity with the
 * Chromium enforceDataRetention in engine.js). Firefox keeps its data files
 * directly in the profile root, so the Chromium Default/-relative targets do
 * not exist here and never fire. Deletion is best-effort per file, same as the
 * Chromium version: a stuck file must not abort the launch.
 */
const FIREFOX_RETENTION_TARGETS = {
  cookies: ['cookies.sqlite', 'cookies.sqlite-wal', 'cookies.sqlite-shm'],
  passwords: ['logins.json', 'key4.db', 'logins-backup.json'],
  bookmarks: ['bookmarks.json', 'places.sqlite', 'places.sqlite-wal', 'places.sqlite-shm'],
  history: ['places.sqlite', 'places.sqlite-wal', 'places.sqlite-shm', 'history.sqlite'],
  local_storage: ['webappsstore.sqlite', 'webappsstore.sqlite-wal', 'webappsstore.sqlite-shm'],
};

async function enforceDataRetentionFirefox(root, profile) {
  const advanced = profile?.advanced || {};
  const targets = new Set();
  const add = (names) => { for (const name of names) targets.add(name); };
  if (advanced.saveCookies === false) add(FIREFOX_RETENTION_TARGETS.cookies);
  if (advanced.savePasswords === false) add(FIREFOX_RETENTION_TARGETS.passwords);
  // bookmarks and history share places.sqlite in Firefox: dropping either
  // loses both. Keep parity with the UI intent by removing the shared store
  // when either switch is off — partial retention is not expressible.
  if (advanced.saveBookmarks === false || advanced.saveHistory === false) {
    add(FIREFOX_RETENTION_TARGETS.bookmarks);
    add(FIREFOX_RETENTION_TARGETS.history);
  }
  if (advanced.saveLocalStorage === false) add(FIREFOX_RETENTION_TARGETS.local_storage);
  const fsp = require('fs/promises');
  for (const name of targets) {
    await fsp.rm(path.join(root, name), { force: true }).catch(() => {});
  }
}

/**
 * 启动前清理（advanced.clear*OnStart）的 Firefox 目标列表，对应 start.js 的
 * CHROMIUM_LAUNCH_DATA_TARGETS。Firefox 把各存储直接放在 profile 根目录：
 * cookies.sqlite（Cookie）、places.sqlite（历史）、webappsstore.sqlite（站点
 * localStorage）、sessionstore.json（会话恢复状态，对应 Chromium 侧归入
 * clearLocalStorageOnStart 的 Default/Session Storage）。
 * 注意 places.sqlite 同时承载书签与历史（与 enforceDataRetentionFirefox 的
 * 互斥说明一致）：clearHistoryOnStart 会一并丢失书签——Firefox 无部分保留的表达。
 */
const FIREFOX_LAUNCH_DATA_TARGETS = {
  cookies: ['cookies.sqlite', 'cookies.sqlite-wal', 'cookies.sqlite-shm'],
  localStorage: ['webappsstore.sqlite', 'webappsstore.sqlite-wal', 'webappsstore.sqlite-shm', 'sessionstore.json'],
  history: ['places.sqlite', 'places.sqlite-wal', 'places.sqlite-shm', 'history.sqlite'],
};

/** Firefox variant of start.js clearProfileLaunchData: shared walker, root-level targets. */
async function clearFirefoxProfileLaunchData(root, profile) {
  return clearLaunchDataTargets(root, profile?.advanced, FIREFOX_LAUNCH_DATA_TARGETS);
}

/**
 * Map the profile's advanced/privacy toggles onto Firefox prefs we can
 * actually express in user.js. Only toggles with a real Firefox pref are
 * mapped; anything else stays a declared gap (see the capability declaration
 * event) instead of silently pretending to work.
 */
function firefoxExtraUserPrefs(profile, fingerprint = null) {
  const advanced = profile?.advanced || {};
  const privacy = profile?.privacy || {};
  const prefs = [];
  // First navigation is controlled by BiDi, after preload registration and verification.
  prefs.push(['browser.startup.page', 0], ['browser.startup.homepage', 'about:blank'],
    ['browser.sessionstore.resume_from_crash', false], ['browser.sessionstore.resume_session_once', false]);
  if (fingerprint) {
    prefs.push(['general.platform.override', fingerprint.platform]);
    const oscpu = /win/i.test(fingerprint.platform) ? 'Windows NT 10.0; Win64; x64'
      : /mac/i.test(fingerprint.platform) ? 'Intel Mac OS X 10.15' : 'Linux x86_64';
    prefs.push(['general.oscpu.override', oscpu]);
    prefs.push(['media.peerconnection.enabled', privacy.webrtc !== 'disabled' && !(privacy.webrtc === 'proxy' && !fingerprint.webrtcAddress)]);
    if (privacy.geoPermission === 'deny' || (privacy.geoPermission === 'allow' && !fingerprint.dynamicConfig?.geoposition)) {
      prefs.push(['permissions.default.geo', 2]);
    }
  }
  // --- advanced switches that DO have a Firefox pref ---
  if (advanced.blockImages) prefs.push(['permissions.default.image', 2]);
  else prefs.push(['permissions.default.image', 1]);
  // Roxy 对齐：声音关闭 → Firefox 只能落 autoplay 闸（disablePlaySound 是 Roxy 内核能力）。
  if (advanced.blockSound || advanced.blockVideo) prefs.push(['media.block-autoplay-until-user-interaction', true]);
  if (advanced.blockNotifications) prefs.push(['permissions.default.desktop-notification', 2]);
  if (privacy.media === 'blocked') {
    prefs.push(['permissions.default.microphone', 2]);
    prefs.push(['permissions.default.camera', 2]);
  }
  if (privacy.geoMode === 'disabled') prefs.push(['permissions.default.geo', 2]);
  else if (privacy.geoMode === 'prompt') prefs.push(['permissions.default.geo', 0]);
  // Popups: Firefox blocks by default; "完全禁用弹窗拦截" opens them.
  if (advanced.blockPopups) prefs.push(['dom.disable_open_during_load', false]);
  else prefs.push(['dom.disable_open_during_load', true]);
  // Passwords manager mirrors applyProfilePreferences' credentials switch.
  const allowPasswords = Boolean(advanced.savePasswords) && !advanced.blockPasswordPrompt;
  prefs.push(['signon.rememberSignons', allowPasswords]);
  prefs.push(['signon.autofillForms', allowPasswords]);
  // Telemetry off in the base user.js already; tighten the report uploads.
  prefs.push(['toolkit.telemetry.unified', false]);
  prefs.push(['browser.discovery.enabled', false]);
  prefs.push(['browser.newtabpage.activity-stream.feeds.telemetry', false]);
  prefs.push(['browser.newtabpage.activity-stream.telemetry', false]);
  // Custom font size maps onto the minimum font size pref.
  if (privacy.fontMode === 'custom' && Number(privacy.fontSize) > 0) {
    prefs.push(['font.minimum-size.x-western', Math.min(32, Math.round(Number(privacy.fontSize)))]);
  }
  return prefs;
}

module.exports = {
  /**
   * Launch a Firefox kernel for a profile. Mirrors _start's contract:
   * returns publicRunning(profile.id) and emits the same event stream
   * (profile-start-progress phases, status, kernel progress).
   */
  async _startFirefox(raw, lifecycleGeneration = null) {
    let profile = this.resolveStoredProxyProfile(this.sanitizeProfile(raw));
    // 记录本次启动前的出口 IP（上次运行持久化的值），供 ipChangePolicy 比对。
    const previousExitIp = String(profile.exitIp || '').trim();
    const previousExitCountryCode = String(profile.exitCountryCode || '').trim();
    // Initial publication of the sanitized candidate (mirrors start.js's first
    // profiles.set): nothing async has elapsed yet, so a plain set is correct —
    // the merge-only contract applies to the write-backs after async phases.
    this.profiles.set(profile.id, profile);
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.has(profile.id)) {
      return this.publicRunning(profile.id);
    }
    assertUrlAccessPolicySupported(profile, 'firefox');
    this.assertProxyConcurrencyAvailable(profile);
    // Surface cross-platform risks once — same one-shot flag and event as _start,
    // so Chromium and Firefox launches together report exactly one preflight.
    if (!this._platformPreflightDone) {
      this._platformPreflightDone = true;
      try {
        const preflight = this.platformPreflightReport();
        if (preflight.warnings.length) this.emit({ type: 'platform-preflight', ok: preflight.ok, warnings: preflight.warnings });
      } catch (_) {}
    }

    let currentStage = 'prepare';
    this.emitStartProgress(profile.id, 'prepare', 6, '正在准备环境…');
    let root = null;
    let profileLock = null;
    let proxyForwarder = null;
    let liveItem = null;
    let browser = null;
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
      // Merge-only write-back (same contract as the Chromium pipeline's
      // mergeLaunchProfileUpdate): prepareProfileProxyForStart spans async network
      // roundtrips, during which a concurrent editor save can land in this.profiles.
      // A wholesale snapshot write-back here would revert that save on the next
      // persist; if the profile was deleted mid-start, the merge returns null and
      // the write-back is skipped entirely.
      const afterProxy = mergeLaunchProfileUpdate(this, profile);
      if (afterProxy) profile = afterProxy;

      // --- 启动前守卫段（对齐 _start 的顺序与语义，Firefox 管线不再绕过）---

      // 资源闸：内存使用率超上限 / 磁盘可用空间低于下限 → 停止打开窗口。
      // Firefox profile 不应绕过资源闸（纯 Node 自测环境由 resource-gate 自动跳过）。
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
      // Second merge-only write-back after locale/geo resolution, mirroring the
      // Chromium pipeline's afterLocale merge (start.js): never a wholesale
      // snapshot write-back inside the multi-second launch window.
      const afterLocale = mergeLaunchProfileUpdate(this, profile);
      if (afterLocale) profile = afterLocale;

      // IP 变化守护（对齐「IP 发生变化停止打开 / 提醒」）：与 _start 相同的触发
      // 条件、错误消息与事件类型；仅在本次启动真的做了出口检测时才可能触发。
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
      await this.persist();

      currentStage = 'kernel'; this.emitStartProgress(profile.id, 'kernel', 30, '正在准备 Firefox 内核…');
      if (!this.kernelStatus().installed && this.preferIndependentKernel) {
        await this.ensureKernelBootstrap();
      }
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      browser = this.chooseBrowser(profile, 'firefox');
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

      // Firefox keeps its singleton state inside the profile root; remove the
      // Chromium leftovers the shared root may still carry, then create the
      // profile root contents from scratch (Firefox creates its own on start).
      await removeSingletonFiles(root, { attempts: 6, delayMs: 40 });
      await fspMkdir(root, { recursive: true });

      // Retention parity with the Chromium pipeline (engine.js
      // enforceDataRetention): the UI switches must not silently no-op just
      // because this profile runs under a Firefox kernel.
      await enforceDataRetentionFirefox(root, profile);

      // 启动前清理 Cookies / Local Storage / 历史（对齐 _start 的
      // clearProfileLaunchData；Firefox 目标列表见 FIREFOX_LAUNCH_DATA_TARGETS）。
      // 事件类型与负载结构与 start.js 完全一致（profile-launch-data-cleared）。
      const clearedLaunchData = await clearFirefoxProfileLaunchData(root, profile);
      if (clearedLaunchData.length) {
        this.emit({ type: 'profile-launch-data-cleared', id: profile.id, removed: clearedLaunchData });
      }

      const pageNetwork = this.networkInfo.get(profile.id) || {};
      // Same one-time migration as the Chromium pipeline: a Firefox profile whose identity
      // still hangs off its sequence id gets its persistent seed rolled before the build.
      await ensureLegacyFingerprintSeed(this, profile);
      const fingerprint = buildFirefoxFingerprint(profile, browser.version);
      let customStartUrls = this.resolveStartupUrls(profile);
      if (profile.advanced.tabMode === 'restore' || profile.advanced.restoreSession) {
        const restoredUrls = await readDeferredSessionUrls(root);
        if (restoredUrls.length) customStartUrls = restoredUrls;
        else await preserveLegacySession(root, 'firefox');
      }
      const infoStartUrl = profile.advanced.showInfoPage !== false
        ? await this.buildStartPageUrl(
          { ...profile, exitIp: pageNetwork.ip || profile.exitIp || '', title: profile.title || profile.name },
          root,
          browser.name,
          0,
          fingerprint
        )
        : null;
      const startUrl = customStartUrls[0] || infoStartUrl || 'about:blank';
      // Additional URLs are opened through BiDi after the startup barrier.
      const extraStartUrls = customStartUrls.slice(1);

      const proxyConfig = this.proxyConfig(profile.proxy);
      let proxy = null;
      let workerMitm = null;
      if (needsProxyBridge(proxyConfig)) {
        proxyForwarder = await startAuthenticatedProxy(proxyConfig, (value) => this.emit({ type: 'proxy-error', id: profile.id, code: value.code, message: value.message }));
        startupResources.proxyForwarder = proxyForwarder;
        proxy = proxyForwarder.url;
      } else {
        proxy = chromeProxyEndpoint(profile.proxy);
        // Direct path: route the browser through the worker-script MITM forwarder
        // so worker scopes receive the persona JS-only fields (hardwareConcurrency)
        // that no BiDi channel can deliver. Real-proxy profiles keep their bridge
        // (chaining the rewriter behind an authenticated upstream is a follow-up).
        try {
          const { FirefoxWorkerMitmProxy } = require('../automation/firefox-worker-mitm-proxy');
          const { buildWorkerInjectionScript } = require('../automation/fingerprint');
          workerMitm = new FirefoxWorkerMitmProxy({ workerSource: buildWorkerInjectionScript(fingerprint) });
          await workerMitm.start();
          startupResources.workerMitmProxy = workerMitm;
          proxy = workerMitm.url;
        } catch (mitmError) {
          this.emit({ type: 'proxy-error', id: profile.id, code: 'WORKER_MITM_UNAVAILABLE', message: mitmError.message });
        }
      }
      const sysMode = profile.proxyMeta?.systemProxy || 'global';
      if (profile.networkMode === 'proxy' && (!proxy || proxy === 'direct://')) {
        throw Object.assign(new Error('代理模式缺少有效路由，已停止启动'), { code: 'proxy-required' });
      }
      if (!proxy && sysMode === 'off') {
        proxy = 'direct://';
      }
      if (proxyConfig && !proxy && sysMode !== 'off') {
        throw new Error('代理已配置但无法生成可用的浏览器代理端点，已按安全策略阻断启动以避免真实 IP 泄漏。');
      }
      // Firefox cannot express a bypass list from a URL string the way Chrome's
      // --proxy-bypass-list does; loopback is always excluded via prefs below.

      currentStage = 'configure'; this.emitStartProgress(profile.id, 'configure', 48, '正在写入 Firefox 配置…');
      const acceptLanguages = collectAcceptLanguages(fingerprint, profile);
      const locale = String(profile.language || 'en-US');
      const workerMitmActive = Boolean(workerMitm);
      const userJs = buildFirefoxUserJs({
        userAgent: fingerprint.userAgent,
        acceptLanguages,
        locale,
        proxyEndpoint: proxy && proxy !== 'direct://' ? proxy : '',
        // The MITM forwarder must see loopback traffic too; every other proxy
        // keeps loopback direct.
        noProxyHosts: workerMitmActive ? '' : 'localhost, 127.0.0.1',
        extraPrefs: [...firefoxExtraUserPrefs(profile, fingerprint),
          ...(workerMitmActive ? [['network.proxy.allow_hijacking_localhost', true]] : [])],
      });
      // user.js wins over prefs.js at every startup, then Firefox copies it to
      // prefs.js. Writing it fresh each launch keeps the proxy/UA/prefs current.
      await fspWriteFile(path.join(root, 'user.js'), userJs, 'utf8');

      currentStage = 'spawn'; this.emitStartProgress(profile.id, 'spawn', 62, '正在启动 Firefox…');
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      const headless = /^(1|true|new)$/i.test(String(process.env.OPENBROWSER_HEADLESS || '').trim());
      const args = firefoxStartupArgs({ root, startUrl: 'about:blank', headless, remoteDebugging: true });
      const spawnEnv = { ...process.env };
      if (fingerprint.timezone && process.platform !== 'win32') spawnEnv.TZ = fingerprint.timezone;
      const child = spawn(browser.path, args, {
        detached: process.platform !== 'win32',
        windowsHide: headless,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: spawnEnv,
      });
      startupResources.child = child;
      startupResources.browser = browser;
      startupResources.launchBinary = browser.path;

      let childExitState = { exited: false, code: null, signal: null, error: null };
      child.once('exit', (code, signal) => {
        childExitState.exited = true;
        childExitState.code = code;
        childExitState.signal = signal;
      });
      child.once('error', (error) => { childExitState.error = error; });
      profileLock = await updateProfileLock(root, profileLock, {
        browserPid: child.pid,
        browserProfileRoot: path.resolve(root),
        browserExecutable: browser.path,
        browserStartedAt: new Date().toISOString(),
      });
      if (!profileLock) {
        const error = new Error('Profile lock ownership changed while starting browser');
        error.code = 'PROFILE_LOCK_LOST';
        throw error;
      }
      startupResources.profileLock = profileLock;
      const startupDiagnostic = { launchBinary: browser.path, profileRoot: root, stdout: '', stderr: '' };
      child._startupDiagnostic = startupDiagnostic;
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      const appendOutput = (existing, chunk) => (existing + chunk).slice(-16 * 1024);
      child.stdout?.on('data', (chunk) => { startupDiagnostic.stdout = appendOutput(startupDiagnostic.stdout, chunk); });
      child.stderr?.on('data', (chunk) => { startupDiagnostic.stderr = appendOutput(startupDiagnostic.stderr, chunk); });
      child.on('error', (error) => { startupDiagnostic.spawnError = error.message; });

      // Give the process a moment; an immediate exec failure must not be
      // reported as a successful start. There is no port to wait for.
      // Event-driven: resolve as soon as the child reports exit/error; the
      // fixed 400ms remains only as a tail bound for a healthy spawn.
      await new Promise((resolve) => {
        const timer = setTimeout(finish, 400);
        if (timer.unref) timer.unref();
        function finish() {
          clearTimeout(timer);
          child.removeListener('exit', finish);
          child.removeListener('error', finish);
          resolve();
        }
        child.once('exit', finish);
        child.once('error', finish);
      });
      if (childExitState.exited || childExitState.error) {
        throw new Error('Firefox 启动后立即退出'
          + (childExitState.code !== null ? ` (code ${childExitState.code})` : '')
          + (childExitState.error ? `: ${childExitState.error.message}` : '')
          + (startupDiagnostic.stderr ? ` ${startupDiagnostic.stderr.slice(-400)}` : ''));
      }

      const item = {
        child,
        cdpConnection: null,
        proxyForwarder,
        markerProcess: null,
        profileLock,
        pid: child.pid,
        port: null,
        browser,
        root,
        profile,
        launchBinary: browser.path,
        startUrl: startUrl === 'about:blank' ? null : startUrl,
        startedAt: new Date().toISOString(),
        extensions: [],
        loadedExtensions: [],
        fingerprint,
        engine: 'firefox',
        kernelWindowName: null,
        nativeKernelFingerprint: false,
        childExitState,
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
        const error = expected ? null : `浏览器异常退出${signal ? ` (${signal})` : ` (code ${code})`}`;
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
      if (item.childExitState?.exited) {
        queueMicrotask(() => handleChildExit(item.childExitState.code, item.childExitState.signal));
      } else if (item.childExitState?.error) {
        queueMicrotask(() => handleChildError(item.childExitState.error));
      }

      currentStage = 'inject'; this.emitStartProgress(profile.id, 'inject', 82, '正在注入 Firefox 设备指纹…');
      const endpoint = await waitForFirefoxEndpoint(child);
      const connection = new BidiConnection(endpoint, {
        onDisconnect: (error) => {
          if (item.cleanedUp || item.stopping) return;
          this.handleBrowserGone(profile.id, item, 'firefox-bidi-disconnect', {
            expected: false, error: error.message, kill: true, waitForExit: true,
          }).catch((cleanupError) => this.emit({ type: 'sync-error', id: profile.id, message: cleanupError.message }));
        },
      });
      item.bidiConnection = connection;
      await connection.open();
      const delivered = await initializeFirefoxFingerprint(connection, fingerprint, profile, {
        onWorkerError: (error) => {
          item.workerFingerprintError = error.message;
          this.emit({ type: 'worker-fingerprint-injection-failed', id: profile.id, message: error.message });
        },
      });
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      item.capabilities = delivered.capabilities;
      item.bidiContext = delivered.context;
      item.fingerprintWarnings = delivered.warnings;
      currentStage = 'verify'; this.emitStartProgress(profile.id, 'verify', 94, 'Firefox 页面指纹校验完成');
      await navigateFirefoxStartup(connection, delivered.context, [startUrl, ...extraStartUrls]);
      currentStage = 'ready'; this.emitStartProgress(profile.id, 'ready', 100, 'Firefox 启动完成');
      this.startRunningWatch(item);
      // Report verified document delivery and the remaining worker/API limits.
      this.emit({
        type: 'capability-declaration',
        id: profile.id,
        engine: 'firefox',
        running: true,
        capabilities: item.capabilities,
        undeliverable: {
          workerFingerprint: 'Worker 首条脚本身份：UA/语言/时区由 user.js 全局覆盖；hardwareConcurrency 等 JS-only 字段经每 profile 的 worker 脚本 MITM 转发器在代理层前缀注入（直连路径；认证代理链路为后续项）。',
          deviceMemory: '保留 Firefox 原生接口形态，不创建 Chromium 的 deviceMemory 接口。',
          frameFontSurface: '跨 OS persona 下，子帧内 document.fonts 为度量层代理，foreign check 门控与文本栅格可能与主文档存在残差（主文档已验证正确，Chromium 路径无此问题）。',
          intlAppLocale: 'Intl 运行时 locale 跟随内核语言包（en-US 构建即 en-US）——与 persona 语言形成「英文界面 + 母语内容偏好」的真实用户形态；不再用 BiDi locale override（实测会将 Accept-Language 头重写为单条）。',
          linuxWebglRendererFormat: 'Linux 声称的 WebGL renderer 沿用 ANGLE 包装格式；当前 Firefox(Linux) 走原生 GL 报 Mesa 形态，该残差未建模（Windows/macOS 已实测一致）。',
          extensions: '扩展热装/同步依赖 CDP Extensions 域，Firefox 下不可用。',
          zoomReconcile: 'Preferences 缩放重置依赖 Chromium Preferences 结构，Firefox 无此文件。',
        },
      });
      this.emit({ type: 'status', id: profile.id, running: true, engine: 'firefox', ...this.publicRunning(profile.id) });
      return this.publicRunning(profile.id);
    } catch (error) {
      const diagnostic = startupResources.child?._startupDiagnostic || { launchBinary: browser?.path || '', profileRoot: root };
      await writeBrowserStartupDiagnostic(this.app.getPath('userData'), {
        type: 'browser-startup-failure',
        profileId: profile.id,
        browser: browser?.name || 'Firefox',
        source: browser?.source || null,
        engine: 'firefox',
        error: formatBrowserStartupError(error, startupResources.child, diagnostic),
        executable: browser?.path || '',
        profileRoot: root,
        exitCode: startupResources.child?.exitCode ?? null,
        signal: startupResources.child?.signalCode || null,
        stdout: diagnostic.stdout || '',
        stderr: diagnostic.stderr || '',
        spawnError: diagnostic.spawnError || null,
      }).catch(() => {});
      if (liveItem) {
        liveItem.verificationBlocked = true;
        await this.handleBrowserGone(profile.id, liveItem, 'start-failed', {
          expected: false,
          error: error?.message || String(error),
          kill: true,
          waitForExit: true,
          emitProfileClosed: false,
        }).catch(() => null);
      } else {
        const cleanupResult = await this.cleanupStartupResources(startupResources).catch(() => null);
        if (cleanupResult?.cleanupBlocked) {
          this.retainBlockedStartup(profile, startupResources, error, lifecycleGeneration, cleanupResult);
        }
      }
      const kernelVer = browser?.version || 'firefox';
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
};

// Small local helpers bound late to keep the mixin's require surface small.
const fspMkdir = (...args) => require('fs/promises').mkdir(...args);
const fspWriteFile = (...args) => require('fs/promises').writeFile(...args);

// isChildExited is re-exported for tests that assert on the mixin surface.
module.exports.isChildExited = isChildExited;
module.exports.firefoxOsName = firefoxOsName;
module.exports.collectAcceptLanguages = collectAcceptLanguages;
module.exports.firefoxPlatformDir = firefoxPlatformDir;
// Wave-2 audit remediation helpers (retention parity + advanced mapping):
// exported for selftests; the launch path calls them directly above.
module.exports.enforceDataRetentionFirefox = enforceDataRetentionFirefox;
module.exports.firefoxExtraUserPrefs = firefoxExtraUserPrefs;
// Launch-data clearing (guard parity with start.js); exported for selftests.
module.exports.clearFirefoxProfileLaunchData = clearFirefoxProfileLaunchData;
module.exports.FIREFOX_LAUNCH_DATA_TARGETS = FIREFOX_LAUNCH_DATA_TARGETS;

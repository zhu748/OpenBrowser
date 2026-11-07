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
const { LIST_VALUE_FLAGS, appendFlagValue, mergeFlags } = require('../automation/command-line-flags');
const { normalizeEnvNumber, prepareMacDockWrapper, prepareMarkerExtension } = require('../automation/env-icon');
const { buildFingerprint, chromeArgsForFingerprint } = require('../automation/fingerprint');
const { fpLog, summarizeFp, logPath: fingerprintLogPath } = require('../automation/fingerprint-debug-log');
const { acquireProfileLock, updateProfileLock, validateProfileRootSecure } = require('../automation/isolation');
const { fingerprintForNativeKernelInject, isOpenBrowser148, writeOpenBrowserKernelInit } = require('../automation/kernel-init-sync');
const { resolveProfileTimezone } = require('../automation/locale-from-country');
const { mergeLoadExtensionArgs } = require('../automation/protocol/app-center-protocol');
const { backgroundNetworkFlagsForProfile } = require('../automation/request-header-rewriter');
const { portConnection, reconcileOnConnection } = require('../extension-pipe');
const { appendDiagnosticOutput, formatBrowserStartupError, isChildExited, removeSingletonFiles, writeBrowserStartupDiagnostic } = require('./index');
const spawn = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

module.exports = {
  async _start(raw, lifecycleGeneration = null) {
    // let: language/timezone resolution reassigns profile via applyResolvedLocale
    // start() already applied redaction recovery exactly once. Repeating it here
    // would undo an explicit proxyAuthAction=clear before launch.
    let profile = this.resolveStoredProxyProfile(this.sanitizeProfile(raw));
    this.profiles.set(profile.id, profile);
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.has(profile.id)) {
      if (!profile.advanced.multiOpen) return this.publicRunning(profile.id);
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
    this.profiles.set(profile.id, profile);
    currentStage = 'proxy'; this.emitStartProgress(profile.id, 'proxy', 18, '正在检测代理与出口…');
    await this.ensureExitNetworkForLocale(profile).catch(() => {});
    profile = this.applyResolvedLocale(profile);
    this.profiles.set(profile.id, profile);
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
    browser = this.chooseBrowser(profile);
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
    await removeSingletonFiles(root, { attempts: 6, delayMs: 40 });
    const pageNetwork = this.networkInfo.get(profile.id) || {};
    const customStartUrls = this.resolveStartupUrls(profile);
    const infoStartUrl = profile.advanced.showInfoPage !== false
      ? await this.buildStartPageUrl(
        { ...profile, exitIp: pageNetwork.ip || profile.exitIp || '', title: profile.title || profile.name },
        root,
        browser.name,
        extensions.length
      )
      : null;
    startUrl = customStartUrls[0] || infoStartUrl;
    const proxyConfig = this.proxyConfig(profile.proxy);
    // Site-stability keeps static marks; refresh-on-start only when stability is off.
    const allowSeedRefresh = profile.privacy.refreshFingerprintOnStart && profile.privacy.stabilityMode === 'off';
    const fingerprint = buildFingerprint({
      ...profile,
      fingerprintLaunchSeed: allowSeedRefresh ? crypto.randomBytes(16).toString('hex') : '',
      kernelVersion: browser.version,
      exitTimezone: profile.exitTimezone || pageNetwork.timezone || '',
      exitLatitude: profile.exitLatitude ?? pageNetwork.latitude,
      exitLongitude: profile.exitLongitude ?? pageNetwork.longitude,
    });
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
    let args = [
      `--user-data-dir=${root}`,
      `--disk-cache-dir=${path.join(root, 'OpenBrowserCache')}`,
      `--crash-dumps-dir=${path.join(root, 'OpenBrowserCrashReports')}`,
      '--profile-directory=Default',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-crash-restore-bubble',
      '--disable-session-crashed-bubble',
      '--disable-background-mode',
      '--enable-unsafe-extension-debugging',
      '--extensions-on-chrome-urls',
      '--enable-features=AutomaticFullscreenContentSetting,WindowPlacement,WindowManagement',
      '--disable-gesture-requirement-for-presentation',
      '--disable-fullscreen-low-power-mode',
      // Random loopback port only; never bind 0.0.0.0. Restrict CDP WebSocket origins
      // (was * — any local page that learns the port could attach and steal session).
      '--remote-debugging-port=0',
      '--remote-allow-origins=http://127.0.0.1,http://localhost',
    ];
    // Fingerprint chrome flags (UA / webrtc / webgl / lang / window-size)
    let hostScaleFactor = null;
    try {
      hostScaleFactor = this.getHostScaleFactor ? this.getHostScaleFactor() : null;
    } catch (_) {
      hostScaleFactor = null;
    }
    args = mergeFlags(args, chromeArgsForFingerprint(fingerprint, profile, { hostScaleFactor }), {
      listFlags: LIST_VALUE_FLAGS,
    });
    const langList = (Array.isArray(fingerprint?.languages) && fingerprint.languages.length)
      ? fingerprint.languages
      : (Array.isArray(profile?.languages) && profile.languages.length)
        ? profile.languages
        : profile?.language
          ? [profile.language]
          : [];
    if (langList.length && !args.some((a) => a.startsWith('--accept-lang='))) {
      args.push(`--accept-lang=${langList.join(',')}`);
    }
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
            path.join(__dirname, 'kernels'),
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
      }
    }
    if (!profile.advanced.allowSignin) args.push('--disable-sync');
    if (profile.privacy.webgpu === 'blocked') args.push('--disable-features=WebGPU');
    if (profile.advanced.blockImages) args.push('--blink-settings=imagesEnabled=false');
    if (profile.advanced.blockVideo || profile.advanced.blockSound) args.push('--autoplay-policy=user-gesture-required');
    else args.push('--autoplay-policy=no-user-gesture-required');
    if (profile.advanced.jsHeapMax) args.push('--js-flags=--max-old-space-size=8192');
    if (restoreSession) args.push('--restore-last-session');
    const disabledFeatures = [];
    // Authenticated proxies are exposed to Chrome through the local bridge. Everything else takes
    // the canonical endpoint from the parser, never from a pattern match on the raw string:
    // `socks5h://`, a `#remark` suffix or a trailing slash used to miss every branch and emit no
    // `--proxy-server` at all, which let Chromium resolve through the host's system proxy — a
    // real-IP leak behind a UI that still reported the configured proxy.
    let proxy = proxyForwarder ? proxyForwarder.url : chromeProxyEndpoint(profile.proxy);
    // systemProxy: off = 强制本机直连(不走系统代理)；use/global + Direct = 不传 --proxy-server（跟随系统路由）
    const sysMode = profile.proxyMeta?.systemProxy || 'global';
    if (profile.networkMode === 'proxy' && (!proxy || proxy === 'direct://')) {
      throw Object.assign(new Error('代理模式缺少有效路由，已停止启动'), { code: 'proxy-required' });
    }
    if (!proxy && sysMode === 'off') {
      proxy = 'direct://';
    }
    if (proxyConfig && !proxy && sysMode !== 'off') {
      // Fail closed rather than fall back to the host route. A profile that is configured with a
      // proxy must never quietly leave through the machine's own network.
      throw new Error('代理已配置但无法生成可用的浏览器代理端点，已按安全策略阻断启动以避免真实 IP 泄漏。');
    }
    if (proxy) {
      args.push(`--proxy-server=${proxy}`);
      // HTTP/SOCKS proxies are IPv4; disable IPv6 so Chrome cannot skip the proxy.
      if (!args.includes('--disable-ipv6')) args.push('--disable-ipv6');
      args = args.filter((arg) => !arg.startsWith('--force-webrtc-ip-handling-policy='));
      args.push('--force-webrtc-ip-handling-policy=disable_non_proxied_udp');
      // 本机启动页必须直连，不走代理；可叠加用户直连白名单
      let bypass = '<-loopback>;127.0.0.1;localhost';
      if (profile.networkMode !== 'proxy' && profile.proxyMeta?.directBypass && profile.proxyMeta.bypassList) {
        const extra = String(profile.proxyMeta.bypassList).split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
        if (extra.length) bypass += ';' + extra.join(';');
      }
      const existingBypass = args.findIndex((a) => a.startsWith('--proxy-bypass-list='));
      if (existingBypass >= 0) args[existingBypass] = '--proxy-bypass-list=' + bypass;
      else args.push(`--proxy-bypass-list=${bypass}`);
    }
    // Startup URLs: do NOT put the OpenBrowser start page (or first custom URL) on the
    // CLI. The process would paint and run collectFingerprint before CDP inject.
    // Spawn on about:blank, inject via CDP, then keepDefaultTab navigates to startUrl.
    if (!restoreSession) {
      if (startUrl) args.push('about:blank');
      else if (customStartUrls.length) args.push('about:blank');
      for (const extra of customStartUrls.slice(1)) args.push(extra);
    }
    // Cross-platform process overhead reducers (safe for multi-profile fleets).
    // Applied for all envs — not only proxied ones — so Win/mac idle CPU stays low.
    const perfFlags = backgroundNetworkFlagsForProfile(profile);
    for (const flag of perfFlags) {
      if (!args.some((a) => a.split('=')[0] === flag.split('=')[0])) args.push(flag);
    }
    disabledFeatures.push(
      'OptimizationHints',
      'MediaRouter',
      'Translate',
      'AutofillServerCommunication',
      'NetworkPrediction',
      'InterestFeedContentSuggestions',
      'CalculateNativeWinOcclusion',
    );
    if (proxyConfig) {
      // Extra hardening when traffic already goes through a bridge.
      if (!args.includes('--disable-quic')) args.push('--disable-quic');
    }
    // Prefer process reuse when many profiles are open (lower RAM; still one renderer isolation base).
    if (!args.some((a) => a.startsWith('--renderer-process-limit='))) {
      args.push('--renderer-process-limit=4');
    }
    if (disabledFeatures.length) {
      // Appending without de-duplicating would repeat names already present
      // from either the base list or the fingerprint merge above.
      args = appendFlagValue(args, 'disable-features', disabledFeatures.join(','));
    }
    // Per-env marker extension: software logo + environment number (1, 2, …)
    const envNumber = normalizeEnvNumber(profile.number || profile.name || profile.id || '1');
    let markerExtensionPath = null;
    try {
      markerExtensionPath = await prepareMarkerExtension({
        profileId: profile.id,
        envNumber,
        userDataPath: this.app.getPath('userData'),
        templateDir: path.join(__dirname, 'bundled-extension'),
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
        const failureDetails = [
          !injectSucceeded ? ('Pre-inject 失败: ' + (injectError?.message || injectError || '未知错误')) : '',
          !workerSucceeded ? ('Worker inject 失败: ' + (workerError?.message || workerError || '未知错误')) : '',
        ].filter(Boolean).join('; ');

        this.emit({
          type: 'fingerprint-injection-failed',
          id: profile.id,
          message: failureDetails,
          blocked: true,
        });

        // Fail-Closed: DO NOT navigate to target site or startUrl.
        // Navigate to a safe local error page to prevent real fingerprint exposure.
        const safeErrorHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>指纹注入失败 - 启动已阻断</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:40px;background:#18181b;color:#f4f4f5;}h1{color:#ef4444;font-size:22px;margin-top:0;}.card{background:#27272a;border:1px solid #3f3f46;border-radius:8px;padding:24px;max-width:620px;margin:40px auto;box-shadow:0 4px 6px -1px rgba(0,0,0,.3);}.desc{color:#a1a1aa;font-size:14px;line-height:1.6;}.err{background:#09090b;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;color:#f87171;word-break:break-all;white-space:pre-wrap;margin:16px 0;}.hint{font-size:13px;color:#71717a;}</style></head><body><div class="card"><h1>⚠️ 指纹防护注入未就绪</h1><p class="desc">为避免原生环境及真实指纹泄露至目标站点，系统已触发 Fail-Closed 安全屏障，中止访问目标地址。</p><div class="err">` + String(failureDetails).replace(/[<>&"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])) + `</div><p class="hint">请关闭该浏览器窗口，检查内核状态或代理配置后重试。</p></div></body></html>`;
        const safeErrorUrl = `data:text/html;charset=utf-8,${encodeURIComponent(safeErrorHtml)}`;
        await fpLog('start.navigate-barrier-errorpage', { profileId: profile.id, failureDetails });
        try {
          await this.keepDefaultTab(item.port, safeErrorUrl);
        } catch (navError) {
          await fpLog('start.navigate-barrier-fail', { profileId: profile.id, error: String(navError.message || navError) });
        }
      } else {
        // Fail-Closed: Verify actual delivered fingerprint via CDP probe before target navigation
        currentStage = 'verify'; this.emitStartProgress(profile.id, 'verify', 92, '正在校验指纹交付…');
        let deliveryResult = { ok: true, blocked: false, mismatches: [], warnings: [] };
        try {
          deliveryResult = await this.verifyStartupFingerprintDelivery(item, profile, item.fingerprint || fingerprint);
        } catch (verifyError) {
          await fpLog('start.delivery-verify-exception', {
            profileId: profile.id,
            error: String(verifyError?.message || verifyError),
          });
        }

        if (!deliveryResult.ok && deliveryResult.blocked) {
          const mismatchMessages = (deliveryResult.mismatches || []).map((m) => typeof m === 'object' ? (m.message || JSON.stringify(m)) : String(m));
          const failureDetails = mismatchMessages.join('\n');
          item.fingerprintVerificationError = deliveryResult.message || failureDetails;
          item.verificationBlocked = true;

          this.emit({
            type: 'fingerprint-verification-failed',
            id: profile.id,
            blocked: true,
            mismatches: deliveryResult.mismatches,
            message: deliveryResult.message || ('指纹交付校验失败: ' + mismatchMessages.join('; ')),
          });

          // Fail-Closed: DO NOT navigate to target site or startUrl.
          // Navigate to a safe local error page to prevent real fingerprint exposure.
          const safeErrorHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>指纹校验失败 - 启动已阻断</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:40px;background:#18181b;color:#f4f4f5;}h1{color:#ef4444;font-size:22px;margin-top:0;}.card{background:#27272a;border:1px solid #3f3f46;border-radius:8px;padding:24px;max-width:620px;margin:40px auto;box-shadow:0 4px 6px -1px rgba(0,0,0,.3);}.desc{color:#a1a1aa;font-size:14px;line-height:1.6;}.err{background:#09090b;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;color:#f87171;word-break:break-all;white-space:pre-wrap;margin:16px 0;}.hint{font-size:13px;color:#71717a;}</style></head><body><div class="card"><h1>⚠️ 指纹未按配置交付</h1><p class="desc">为避免原生环境及真实指纹泄露至目标站点，系统检测到实际交付指纹与配置存在直接矛盾，已触发 Fail-Closed 安全屏障，阻止访问目标站点。</p><div class="err">` + String(failureDetails).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])) + `</div><p class="hint">指纹未按配置交付，已阻止访问目标站点。请检查内核兼容性或环境指纹配置后重试。</p></div></body></html>`;
          const safeErrorUrl = `data:text/html;charset=utf-8,${encodeURIComponent(safeErrorHtml)}`;
          await fpLog('start.navigate-verification-barrier-errorpage', { profileId: profile.id, failureDetails });
          try {
            await this.keepDefaultTab(item.port, safeErrorUrl);
          } catch (navError) {
            await fpLog('start.navigate-verification-barrier-fail', { profileId: profile.id, error: String(navError.message || navError) });
          }
        } else if (!restoreSession && startUrl) {
          await fpLog('start.navigate-startpage', { profileId: profile.id, startUrl });
          try {
            await this.keepDefaultTab(item.port, startUrl);
          } catch (navError) {
            await fpLog('start.navigate-fail', { profileId: profile.id, error: String(navError.message || navError) });
          }
          try {
            await this.ensureStartPageFingerprint(item, profile, injectFp, startUrl);
          } catch (reInjectError) {
            await fpLog('start.reinject-fail', { profileId: profile.id, error: String(reInjectError.message || reInjectError) });
            this.emit({
              type: 'fingerprint-injection-failed',
              id: profile.id,
              message: 'start-page re-inject: ' + reInjectError.message,
            });
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
      // Last chance: still try to open start page so UI is not stuck on about:blank.
      if (item && !restoreSession && startUrl && item.port && !item.verificationBlocked && !injectionFailed) {
        try {
          await this.keepDefaultTab(item.port, startUrl);
          await fpLog('start.navigate-after-fail', { profileId: profile.id, startUrl });
        } catch (_) {}
      }
    }
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.get(profile.id) !== item || item.cleanedUp || item.stopping) {
      throw new Error(item.cdpError || '浏览器在启动过程中异常退出');
    }
    // Detect user closing browser with X (process may stay alive; CDP/pages are source of truth)
    this.startRunningWatch(item);
    if (item.verificationBlocked) {
      currentStage = 'blocked'; this.emitStartProgress(profile.id, 'blocked', 100, '指纹校验失败，已阻止访问目标站点');
    } else {
      currentStage = 'ready'; this.emitStartProgress(profile.id, 'ready', 100, '启动完成');
    }
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
};

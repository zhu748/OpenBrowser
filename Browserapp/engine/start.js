'use strict';

const { openWorkbench } = require('../automation/profile-defaults');

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
const { buildFingerprint, assertFingerprintConsistency } = require('../automation/fingerprint');
const { assertUrlAccessPolicySupported } = require('../automation/url-access-policy');
const { profileWriteGuard } = require('./profile-write-guard');
const { attachBrowserExitHandlers } = require('./browser-exit');
const { fpLog, summarizeFp, logPath: fingerprintLogPath } = require('../automation/fingerprint-debug-log');
const { acquireProfileLock, updateProfileLock, validateProfileRootSecure } = require('../automation/isolation');
const { fingerprintForNativeKernelInject, isOpenBrowser148, writeOpenBrowserKernelInit } = require('../automation/kernel-init-sync');
const { resolveProfileTimezone } = require('../automation/locale-from-country');
const { mergeLoadExtensionArgs } = require('../automation/protocol/app-center-protocol');
const { portConnection, reconcileOnConnection } = require('./extension-pipe');
const { appendDiagnosticOutput, formatBrowserStartupError, isChildExited, removeSingletonFiles, writeBrowserStartupDiagnostic } = require('./index');
const { prepareLaunchProfile, createStartupResources, reportPlatformPreflight } = require('./launch-preparation');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { readDeferredSessionUrls, preserveLegacySession, openVerifiedStartupTabs } = require('./startup-session');

// Browserapp/ app root (this file lives in Browserapp/engine/). Resource
// bundles such as kernels/ and bundled-extension/ sit next to main.js, one
// level above this module — path.join(__dirname, 'kernels') would resolve to
// the non-existent engine/kernels and silently drop every resource root.
const APP_ROOT = path.join(__dirname, '..');

// Proxy support is a required engine capability; preserve dependency load errors.
const { startAuthenticatedProxy, needsProxyBridge, chromeProxyEndpoint } = require('../proxy-forwarder');

const { mergeLaunchProfileUpdate, ensureLegacyFingerprintSeed } = require('./launch-profile');
const { applyDefaultSearchEngine, clearProfileLaunchData, clearLaunchDataTargets } = require('./launch-preferences');
const { isValidIanaTimezone, extractTimezoneFromArgs, hostScreenSummary, windowPositionArg } = require('./launch-display');

module.exports = {
  async _start(raw, lifecycleGeneration = null, launchOptions = {}) {
    // let: language/timezone resolution reassigns profile via applyResolvedLocale
    // start() already applied redaction recovery exactly once. Repeating it here
    // would undo an explicit proxyAuthAction=clear before launch.
    let profile = this.resolveStoredProxyProfile(this.sanitizeProfile(raw));
    this.profiles.set(profile.id, profile);
    let assertLaunchProfileCurrent = profileWriteGuard(this, profile.id);
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.has(profile.id)) {
      return this.publicRunning(profile.id);
    }
    assertUrlAccessPolicySupported(profile);
    this.assertProxyConcurrencyAvailable(profile);
    reportPlatformPreflight(this);
    let currentStage = 'prepare';
    this.emitStartProgress(profile.id, 'prepare', 6, '正在准备环境…', lifecycleGeneration);
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
    const startupResources = createStartupResources();
    try {
      ({ profile, assertCurrent: assertLaunchProfileCurrent } = await prepareLaunchProfile(this, profile, {
        lifecycleGeneration,
        assertCurrent: assertLaunchProfileCurrent,
        onStage: stage => { currentStage = stage; },
      }));
    const extensions = this.assignedExtensions(profile.id);
    currentStage = 'kernel'; this.emitStartProgress(profile.id, 'kernel', 30, '正在准备浏览器内核…', lifecycleGeneration);
    if (!this.kernelStatus().installed && this.preferIndependentKernel
        && (!profile.engineVersion || profile.engineVersion === 'latest')) {
      // Default profiles retain first-run bootstrap; a fixed selection must
      // fail if missing instead of downloading a different Chrome version.
      await this.ensureKernelBootstrap();
    }
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    let recoverControlColor = false;
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
    recoverControlColor = await require('../automation/sync/master-window-color').needsStartupRecovery(root);
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
    assertLaunchProfileCurrent();
    const seedEnsured = ensureLegacyFingerprintSeed(this, profile);
    assertLaunchProfileCurrent = profileWriteGuard(this, profile.id);
    await Promise.all([
      launchDataCleared,
      searchEngineApplied,
      seedEnsured,
      removeSingletonFiles(root, { attempts: 6, delayMs: 40 }),
    ]);
    assertLaunchProfileCurrent();
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
    assertFingerprintConsistency(fingerprint);
    let customStartUrls = this.resolveStartupUrls(profile);
    if (restoreSession) {
      const restoredUrls = await readDeferredSessionUrls(root);
      if (restoredUrls.length) customStartUrls = restoredUrls;
      else await preserveLegacySession(root, 'chromium');
    }
    const infoStartUrl = openWorkbench(profile)
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
    this.emitStartProgress(profile.id, 'configure', 48, '正在配置启动参数…', lifecycleGeneration);
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
      currentStage = 'spawn'; this.emitStartProgress(profile.id, 'spawn', 62, '正在启动浏览器进程…', lifecycleGeneration);
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      await ensureKernelReadyForLaunch(browser);
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      const headless = launchOptions.headless === true || /^(1|true|new)$/i.test(String(process.env.OPENBROWSER_HEADLESS || '').trim());
      if (launchOptions.blockImages === true && !finalArgs.some((arg) => /imagesEnabled=false/.test(String(arg)))) {
        finalArgs.push('--blink-settings=imagesEnabled=false');
      }
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
      assertLaunchProfileCurrent();
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
      this.emitStartProgress(profile.id, 'cdp', 76, '正在等待调试端口…', lifecycleGeneration);
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
      pid: child.pid, browser, root, profile, port, network: pageNetwork,
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

    attachBrowserExitHandlers(this, profile.id, item, child);
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
      currentStage = 'inject'; this.emitStartProgress(profile.id, 'inject', 88, '正在注入指纹与运行时…', lifecycleGeneration);
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
        currentStage = 'verify'; this.emitStartProgress(profile.id, 'verify', 92, '正在校验指纹交付…', lifecycleGeneration);
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
    // Detect user closing browser with X (process may stay alive; CDP/pages are source of truth)
    // A crash may have left the transient sync marker enabled in this profile.
    // Restore the captured native theme before publishing a new running window.
    await require('../automation/sync/master-window-color').restoreOwnedColor(item, { recoverOnRestart: recoverControlColor });
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.get(profile.id) !== item || item.cleanedUp || item.stopping || item.childExitState?.exited || item.childExitState?.error) {
      throw new Error(item.cdpError || '浏览器在启动过程中异常退出');
    }
    this.startRunningWatch(item);
    currentStage = 'ready'; this.emitStartProgress(profile.id, 'ready', 100, '启动完成', lifecycleGeneration);
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
          expected: error?.code === 'BROWSER_START_CANCELLED',
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
        lifecycleGeneration,
        phase: 'error',
        errorCode: error?.code,
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
// the same revision-checked write-back contract for staged profile snapshots.
mergeLaunchProfileUpdate,
// Shared by both launch pipelines: rolls the persistent seed a legacy (unseeded) profile
// is missing before its fingerprint is built (see the function comment above).
ensureLegacyFingerprintSeed,
// Single source of the security switch denylist used to filter
// profile.privacy.customArgs at launch time; exported for reuse and tests.
SECURITY_SWITCH_DENYLIST,
};

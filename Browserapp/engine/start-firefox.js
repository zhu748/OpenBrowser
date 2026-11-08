'use strict';

/**
 * Firefox launch pipeline mixin for BrowserEngine (prototype-assigned by engine.js).
 *
 * Firefox has no CDP: everything Chromium does through the DevTools protocol
 * must happen before the process starts. This mixin implements the same
 * lifecycle contract as _start (progress events, profile lock, running item,
 * start-page handover, exit watching, startup diagnostics) with Firefox
 * primitives:
 *
 *   - user.js prefs (UA / languages / locale / proxy / telemetry off) written
 *     into the profile root right before spawn;
 *   - the authenticated-proxy bridge (identical local forwarder as Chromium)
 *     with network.proxy.* prefs pointing at it;
 *   - -P-free dedicated profile: `-profile <root>` + --no-remote;
 *   - the start page opened as the launch URL (no about:blank + CDP navigate).
 *
 * The running item carries connection:null + engine:'firefox' so downstream
 * consumers (RPA steps, live sync, local API) can guard on it.
 */

const { buildFirefoxUserJs, firefoxUserAgent, firefoxStartupArgs, firefoxPlatformDir } = require('../automation/kernel-versions');
const { acquireProfileLock, updateProfileLock, validateProfileRootSecure } = require('../automation/isolation');
const { removeSingletonFiles, writeBrowserStartupDiagnostic, formatBrowserStartupError, isChildExited } = require('./index');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
  const fromFp = Array.isArray(fingerprint?.languages) && fingerprint.languages.length ? fingerprint.languages : null;
  const fromProfile = Array.isArray(profile?.languages) && profile.languages.length ? profile.languages : null;
  const single = profile?.language ? [profile.language] : null;
  return (fromFp || fromProfile || single || ['en-US']).join(',');
}

module.exports = {
  /**
   * Launch a Firefox kernel for a profile. Mirrors _start's contract:
   * returns publicRunning(profile.id) and emits the same event stream
   * (profile-start-progress phases, status, kernel progress).
   */
  async _startFirefox(raw, lifecycleGeneration = null) {
    let profile = this.resolveStoredProxyProfile(this.sanitizeProfile(raw));
    this.profiles.set(profile.id, profile);
    this.assertStartGenerationActive(profile.id, lifecycleGeneration);
    if (this.running.has(profile.id)) {
      return this.publicRunning(profile.id);
    }
    this.assertProxyConcurrencyAvailable(profile);

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
      this.profiles.set(profile.id, profile);
      currentStage = 'proxy'; this.emitStartProgress(profile.id, 'proxy', 18, '正在检测代理与出口…');
      await this.ensureExitNetworkForLocale(profile).catch(() => {});
      profile = this.applyResolvedLocale(profile);
      this.profiles.set(profile.id, profile);
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

      const pageNetwork = this.networkInfo.get(profile.id) || {};
      const customStartUrls = this.resolveStartupUrls(profile);
      const infoStartUrl = profile.advanced.showInfoPage !== false
        ? await this.buildStartPageUrl(
          { ...profile, exitIp: pageNetwork.ip || profile.exitIp || '', title: profile.title || profile.name },
          root,
          browser.name,
          0
        )
        : null;
      const startUrl = customStartUrls[0] || infoStartUrl || 'about:blank';

      const proxyConfig = this.proxyConfig(profile.proxy);
      let proxy = null;
      if (needsProxyBridge(proxyConfig)) {
        proxyForwarder = await startAuthenticatedProxy(proxyConfig, (value) => this.emit({ type: 'proxy-error', id: profile.id, code: value.code, message: value.message }));
        startupResources.proxyForwarder = proxyForwarder;
        proxy = proxyForwarder.url;
      } else {
        proxy = chromeProxyEndpoint(profile.proxy);
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
      const osName = firefoxOsName(profile);
      const acceptLanguages = collectAcceptLanguages(null, profile);
      const locale = String(profile.language || 'en-US');
      const userJs = buildFirefoxUserJs({
        userAgent: profile.userAgent || firefoxUserAgent(osName, browser.version),
        acceptLanguages,
        locale,
        proxyEndpoint: proxy && proxy !== 'direct://' ? proxy : '',
        noProxyHosts: 'localhost, 127.0.0.1',
      });
      // user.js wins over prefs.js at every startup, then Firefox copies it to
      // prefs.js. Writing it fresh each launch keeps the proxy/UA/prefs current.
      await fspWriteFile(path.join(root, 'user.js'), userJs, 'utf8');

      currentStage = 'spawn'; this.emitStartProgress(profile.id, 'spawn', 62, '正在启动 Firefox…');
      this.assertStartGenerationActive(profile.id, lifecycleGeneration);
      const headless = /^(1|true|new)$/i.test(String(process.env.OPENBROWSER_HEADLESS || '').trim());
      const args = firefoxStartupArgs({ root, startUrl, headless });
      const spawnEnv = { ...process.env };
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
        fingerprint: null,
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

      currentStage = 'ready'; this.emitStartProgress(profile.id, 'ready', 100, 'Firefox 启动完成');
      this.startRunningWatch(item);
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

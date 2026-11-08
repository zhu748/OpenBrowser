const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const cdp = require('./cdp');
const { addChromeStoreExtension } = require('./store-extension');
let proxyForwarderModule = {};
try {
  proxyForwarderModule = require('./proxy-forwarder');
} catch (pfErr) {
  console.warn('[BrowserEngine] Note: proxy-forwarder module load warning:', pfErr.message);
}
const {
  parseProxy = (v) => ({ protocol: 'direct', host: '', port: 0 }),
} = proxyForwarderModule;
const { applyLanguagePreferences, verifyLanguagePreferences, syncProfileLocalState } = require('./automation/profile-file-consistency');
const { platformPreflight } = require('./automation/platform-preflight');
const { buildWorkerInjectionScript } = require('./automation/fingerprint');
const { ensureStartPageServer } = require('./automation/start-page-server');
const { killProcessTree } = require('./automation/protocol/cross-platform');
const isolation = require('./automation/isolation');
const { lockPath, releaseProfileLock, scanProcessesUsingProfile, isPidAlive, auditIsolation, isSystemBrowserExecutable, isPathInsideOrEqual, validateDataRootIsolationSecure, assertProfileId, assertSafeProfileChild } = isolation;
const { BrowserKernelManager } = require('./automation/browser-kernel');
const {
} = require('./automation/kernel-init-sync');
const userAgentModule = require('./automation/user-agent');
if (!userAgentModule.__navigatorProtoHardened) {
  userAgentModule.__navigatorProtoHardened = true;
  const origBuildUa = userAgentModule.buildUaInjectionScript;
  if (typeof origBuildUa === 'function') {
    userAgentModule.buildUaInjectionScript = function (uaProfile) {
      let script = origBuildUa.call(this, uaProfile);
      script = script.replace(
        'if (typeof Navigator !== "undefined" && (receiver instanceof Navigator || Object.prototype.toString.call(receiver) === "[object Navigator]")) return true;',
        'if (typeof Navigator !== "undefined" && receiver !== Navigator.prototype && (receiver instanceof Navigator || Object.prototype.toString.call(receiver) === "[object Navigator]")) return true;'
      );
      script = script.replace(
        'if (typeof WorkerNavigator !== "undefined" && (receiver instanceof WorkerNavigator || Object.prototype.toString.call(receiver) === "[object WorkerNavigator]")) return true;',
        'if (typeof WorkerNavigator !== "undefined" && receiver !== WorkerNavigator.prototype && (receiver instanceof WorkerNavigator || Object.prototype.toString.call(receiver) === "[object WorkerNavigator]")) return true;'
      );
      script = script.replace(/typeof secret === "string" && secret\.length > 0/g, 'secret === "__UA_BRIDGE_TOKEN__"');
      return script;
    };
  }
}



const STOP_ALL_ITEM_TIMEOUT_MS = process.platform === 'win32' ? 22000 : 12000;

const {
  isChildExited,
  removeSingletonFiles,
  lifecycleTimeout,
  proxyHasCredentials,
  sameProxyEndpoint,
  profileProxyAssociation,
  normalizedProxyAssociationId,
  managedBrowserKillOptions,
  systemBrowserCandidatesForPlatform,
  appendDiagnosticOutput,
  formatBrowserStartupError,
  writeBrowserStartupDiagnostic,
  stopIpcStubForWindow,
  KERNEL_POLICY_VERSION,
  writeRawAtomically,
  writeJsonAtomically,
  assertExtensionTreeSafe,
  sanitizeProfile: sanitizeProfileData,
} = require("./engine/index");
const { sanitizeInjectionScript, installCdpHardening } = require('./engine/cdp-hardening');









installCdpHardening(cdp, { buildWorkerInjectionScript });

/**
 * Chromium 原生线缆层 HTTP 报头标准槽位序列 (Canonical Wire Header Order).
 *
 * 【背景与 JA4H / Akamai 指纹防御】：
 * JA4H (HTTP Client Fingerprinting) 与 Akamai Bot Manager 会依据线缆层请求头的名字序列（以及特定头的哈希）
 * 建立客户端指纹。原生 Chromium 在网络栈 (net::URLRequestHttpJob, ClientHints, NavigationLoader) 中
 * 按照固定的装配阶段构建报头流。若中间层重写器将 Client Hints (sec-ch-ua*) 或 User-Agent / Accept-Language
 * 错误 append 到末尾，会导致明显的顺序倒置特征（如 sec-ch-ua 跑到 user-agent 之后），被 WAF 判定为异常机器人。
 *
 * 【槽位排序原理与位置说明】：
 * 1. host: HTTP/1.1 规范要求的首个虚拟主机头，Chromium 网络栈最优先填充。
 * 2. connection: 传输层连接控制选项 (keep-alive, upgrade)，紧随 Host。
 * 3. cache-control / pragma: 条件请求/刷新时的缓存指令，由缓存层在较早阶段插入。
 * 4. sec-ch-ua 系列 (Client Hints): Chromium ClientHints 委托在请求构建极早期（before User-Agent）下发：
 *    - sec-ch-ua: 基础品牌版本列表 (GREASE + Chromium + Brand)。
 *    - sec-ch-ua-mobile: 是否移动端布尔标记 (?0 或 ?1)。
 *    - sec-ch-ua-platform: 操作系统平台名 (如 "Windows", "Android", "macOS")。
 *    - 高熵 Client Hints (当服务器通过 Accept-CH 明确请求时按标准次序出现):
 *      sec-ch-ua-arch, sec-ch-ua-bitness, sec-ch-ua-model, sec-ch-ua-platform-version,
 *      sec-ch-ua-full-version, sec-ch-ua-full-version-list, sec-ch-ua-form-factors, sec-ch-ua-wow64
 * 5. upgrade-insecure-requests: 页面导航层下发的升级请求标记，位于 User-Agent 之前。
 * 6. user-agent: 浏览器核心 UA 字符串，位于 Accept 之前。
 * 7. accept: 客户端内容协商偏好 (text/html, application/xhtml+xml, ...)。
 * 8. accept-language: 语言与区域偏好（含 RFC 9110 q-factor 权重），紧随 Accept，排在 sec-fetch-* 之前。
 * 9. sec-fetch-* 系列 (W3C Fetch Metadata): 紧随 Accept-Language 之后按规范排布：
 *    - sec-fetch-site: 请求源关系 (same-origin, cross-site, none 等)。
 *    - sec-fetch-mode: 请求模式 (navigate, cors, no-cors 等)。
 *    - sec-fetch-user: 用户手势标记 (?1)。
 *    - sec-fetch-dest: 请求目标资源类型 (document, script, empty 等)。
 *    - sec-fetch-storage-access: 存储访问权限标记。
 * 10. referer: 来源页 URL。
 * 11. origin: CORS 跨域请求的源标识。
 * 12. accept-encoding: 浏览器支持的内容编码 (gzip, deflate, br, zstd)，排在 Cookie 之前。
 * 13. cookie: 携带的持久化/会话 Cookie。
 * 14. priority: HTTP/2 与 HTTP/3 流优先级控制头。
 */
const {
  CHROMIUM_CANONICAL_HEADER_ORDER,
  CHROMIUM_CANONICAL_HEADER_INDEX,
  RequestHeaderRewriter,
  createRequestHeaderRewriter,
  normalizePlatformFamily,
  detectUaPlatform,
  extractChromeMajor,
  extractGpuBrand,
  normalizeTimezone,
  extractPrimaryLanguage,
  backgroundNetworkFlagsForProfile,
  evaluateFingerprintDelivery,
} = require('./automation/request-header-rewriter');

const { isValidIanaTimezone, extractTimezoneFromArgs } = require('./engine/start');

class BrowserEngine {
  constructor(app, options = {}) {
    this.app = app;
    // Host display scale provider (Windows). Defaulting the kernel UI scale to the real
    // display scale keeps browser chrome text/icons matching the rest of the OS on
    // high-DPI (125%/150%/200%) displays. Supplied by main.js; optional so tests and
    // non-Windows hosts keep the previous default of 1.
    this.getHostScaleFactor = typeof options.getHostScaleFactor === 'function' ? options.getHostScaleFactor : null;
    this.profiles = new Map();
    this.running = new Map();
    // Per-profile lifecycle barriers. A browser must finish stopping (including
    // process-tree, proxy bridge, and profile-lock cleanup) before a new start
    // can acquire the same profile.
    this.starting = new Map();
    this.stopping = new Map();
    this.lifecycleGenerations = new Map();
    this.lifecycleStopRequests = new Map();
    this.stopAllPromise = null;
    this.stopAllInProgress = false;
    this._persistQueue = Promise.resolve();
    this.networkInfo = new Map();
    // The proxy library is loaded by the automation layer after engine.init().
    // Keep the reference here so linked profiles always resolve their current
    // credentials at sync/start time instead of relying on renderer storage.
    this.proxyStore = null;
    this.deliveryVerificationFailures = new Map();
    this.deliveryVerificationFailureTimestamps = new Map();
    this.extensions = new Map();
    this.assignments = new Map();
    this.listeners = new Set();
    this.stateFile = path.join(app.getPath('userData'), 'openbrowser-engine.json');
    this.dbFile = options.dbPath || path.join(app.getPath('userData'), 'openbrowser-data.db');
    this.sqliteStore = null;
    this.usingSqlite = false;
    const profileDataRoot = String(options.profileDataRoot || path.join(app.getPath('userData'), 'browser-profiles-v2'));
    const profileDataRootCheck = validateDataRootIsolationSecure(profileDataRoot);
    if (!profileDataRootCheck.ok) throw new Error(profileDataRootCheck.message);
    this.profileDataRootPath = profileDataRootCheck.root;
    // Source-tree + packaged discovery for OpenBrowser 148 kernel.
    // Layout: Browserapp/kernels/macos-x64/chrome_148/openbrowser_148/OpenBrowser.app/...
    // Env override: OPENBROWSER_KERNEL_ROOT = dir that contains openbrowser/ chrome_148 ...
    const resourceRoots = [];
    try {
      if (typeof process !== 'undefined' && process.resourcesPath) resourceRoots.push(process.resourcesPath);
    } catch (_) {}
    try {
      resourceRoots.push(__dirname);
      resourceRoots.push(path.join(__dirname, 'kernels'));
      resourceRoots.push(path.join(__dirname, 'resources'));
      resourceRoots.push(path.join(__dirname, '..', 'resources'));
    } catch (_) {}
    try {
      const envRoot = String(process.env.OPENBROWSER_KERNEL_ROOT || '').trim();
      if (envRoot) resourceRoots.push(envRoot);
    } catch (_) {}
    this.kernelManager = new BrowserKernelManager(app.getPath('userData'), {
      onProgress: (p) => this.emit({ type: 'kernel-progress', ...p }),
      resourceRoots,
    });
    this.preferIndependentKernel = options.preferIndependentKernel !== false;
    // A fingerprint environment must never launch the user's installed browser.
    this.allowSystemBrowserFallback = false;
    this.systemBrowserPath = null;
    this.kernelBootstrapPromise = null;
    this.startPageServer = null;
  }

  async ensureStartPage() {
    if (this.startPageServer?.server) {
      this.startPageServer.setEngine?.(this);
      return this.startPageServer;
    }
    this.startPageServer = await ensureStartPageServer({ engine: this });
    this.startPageServer.setEngine?.(this);
    return this.startPageServer;
  }

  candidates() {
    const list = [];
    // 1) Independent kernels (integrated seed, per-version installs, custom) —
    //    Chromium first, then Firefox, so the default selection keeps favoring
    //    the platform's primary engine.
    const independent = this.kernelManager.resolveInstalled();
    if (independent) {
      list.push({ name: independent.name, path: independent.path, independent: true, version: independent.version, source: independent.source, engine: independent.engine || 'chromium' });
    }
    for (const kernel of this.kernelManager.listInstalledKernels()) {
      if (kernel.path && !list.some((item) => item.path === kernel.path)) {
        list.push({
          name: kernel.name,
          path: kernel.path,
          independent: true,
          version: kernel.version,
          source: kernel.source,
          engine: kernel.engine,
        });
      }
    }

    // 2) System browsers are exposed for explicit manual selection only.
    for (const item of this.systemBrowserCandidates()) list.push({ ...item, independent: false, engine: 'chromium' });
    return list.filter((item, index, all) => fs.existsSync(item.path) && all.findIndex((other) => other.path === item.path) === index);
  }

  systemBrowserCandidates() {
    return systemBrowserCandidatesForPlatform();
  }

  /**
   * Engine preference for one profile: 'firefox' | 'chromium'.
   * The per-profile editor choice wins; without one, the pinned/installed
   * default kernel decides.
   */
  profileEngine(profile) {
    const engine = String(profile?.engine || '').trim().toLowerCase();
    if (engine === 'firefox' || engine === 'chromium') return engine;
    const installed = this.kernelManager.resolveInstalled();
    return installed?.engine === 'firefox' ? 'firefox' : 'chromium';
  }

  resolveStoredProxyProfile(incoming) {
    const profile = incoming && typeof incoming === 'object' ? incoming : null;
    if (!profile) return profile;
    const direct = profile.networkMode === 'direct' || /^(?:direct|offline|none)$/i.test(String(profile.proxy || '').trim());
    const association = profileProxyAssociation(profile);
    const proxyId = direct ? null : normalizedProxyAssociationId(association.value);
    if (!proxyId) {
      return this.sanitizeProfile({
        ...profile,
        proxyId: null,
        proxyMeta: { ...(profile.proxyMeta || {}), proxyId: null },
      });
    }
    if (!this.proxyStore) {
      return this.sanitizeProfile({
        ...profile,
        proxyId,
        proxyMeta: { ...(profile.proxyMeta || {}), proxyId },
      });
    }
    const item = this.proxyStore.get?.(proxyId);
    if (!item?.raw) {
      // A deleted library entry must not leave a ghost association that later
      // overwrites Direct/manual proxy edits. Keep the last raw endpoint as a
      // manual proxy and remove every accepted association alias via sanitize.
      return this.sanitizeProfile({
        ...profile,
        proxyId: null,
        proxyMeta: { ...(profile.proxyMeta || {}), proxyId: null },
      });
    }
    return this.sanitizeProfile({
      ...profile,
      networkMode: 'proxy',
      proxy: item.raw,
      proxyId: item.id,
      proxyMeta: {
        ...(profile.proxyMeta || {}),
        proxyId: item.id,
        ipChannel: item.ipChannel || profile.proxyMeta?.ipChannel || 'ip-api',
        refreshUrl: item.refreshUrl || profile.proxyMeta?.refreshUrl || '',
      },
    });
  }

  async setProxyStore(proxyStore) {
    this.proxyStore = proxyStore || null;
    if (!this.proxyStore) return false;
    let changed = false;
    for (const [id, profile] of this.profiles) {
      const next = this.resolveStoredProxyProfile(profile);
      if (!next || next.proxy === profile.proxy
        && next.proxyId === profile.proxyId
        && next.proxyMeta?.ipChannel === profile.proxyMeta?.ipChannel
        && next.proxyMeta?.refreshUrl === profile.proxyMeta?.refreshUrl) continue;
      this.profiles.set(id, next);
      changed = true;
    }
    if (changed) await this.persist();
    return changed;
  }

  persist() {
    // Coalesce bursts (syncProfiles, batch start/stop, extension assigns)
    // into one queued write: each persist() re-serializes the whole state and
    // (for the SQLite path) re-encrypts every profile.
    if (this._persistDebounceTimer) {
      clearTimeout(this._persistDebounceTimer);
    } else {
      this._persistDebouncePending = new Promise((resolve, reject) => {
        this._persistDebounceResolve = resolve;
        this._persistDebounceReject = reject;
      });
    }
    this._persistDebounceTimer = setTimeout(() => {
      this._persistDebounceTimer = null;
      this._persistNow().then(this._persistDebounceResolve, this._persistDebounceReject);
    }, 50);
    this._persistDebounceTimer.unref?.();
    return this._persistDebouncePending;
  }

  _persistNow() {
    if (this.usingSqlite && this.sqliteStore) {
      const write = async () => {
        this.sqliteStore.setMeta('kernelPolicyVersion', KERNEL_POLICY_VERSION);
        this.sqliteStore.setMeta('preferIndependentKernel', this.preferIndependentKernel);
        this.sqliteStore.setMeta('allowSystemBrowserFallback', this.allowSystemBrowserFallback);
        this.sqliteStore.setMeta('systemBrowserPath', this.systemBrowserPath);

        this.sqliteStore.saveExtensions([...this.extensions.values()]);
        for (const [profileId, assignedSet] of this.assignments.entries()) {
          this.sqliteStore.setAssignments(profileId, assignedSet);
        }
        this.sqliteStore.saveProfiles([...this.profiles.values()]);
      };
      const previous = this._persistQueue || Promise.resolve();
      const queued = previous.then(write, write);
      this._persistQueue = queued.catch(() => {});
      return queued;
    }

    const assignments = Object.fromEntries([...this.assignments].map(([id, values]) => [id, [...values]]));
    const payload = JSON.stringify({
      extensions: [...this.extensions.values()],
      assignments,
      profiles: [...this.profiles.values()],
      kernelPolicyVersion: KERNEL_POLICY_VERSION,
      preferIndependentKernel: this.preferIndependentKernel,
      allowSystemBrowserFallback: this.allowSystemBrowserFallback,
      systemBrowserPath: this.systemBrowserPath,
    }, null, 2);
    const write = () => writeJsonAtomically(this.stateFile, payload);
    const previous = this._persistQueue || Promise.resolve();
    const queued = previous.then(write, write);
    this._persistQueue = queued.catch(() => {});
    return queued;
  }

  flushPersistence() {
    // The quit path must wait for a pending debounced write, not just the
    // already-started one.
    const pending = this._persistDebounceTimer
      ? Promise.resolve().then(() => {
          clearTimeout(this._persistDebounceTimer);
          this._persistDebounceTimer = null;
          return this._persistNow();
        }).then(this._persistDebounceResolve, this._persistDebounceReject)
      : null;
    return pending || this._persistQueue || Promise.resolve();
  }

  dumpToJson(indent = 2) {
    if (this.usingSqlite && this.sqliteStore) {
      return this.sqliteStore.dumpToJson(indent);
    }
    const assignments = Object.fromEntries([...this.assignments].map(([id, values]) => [id, [...values]]));
    return JSON.stringify({
      extensions: [...this.extensions.values()],
      assignments,
      profiles: [...this.profiles.values()],
      kernelPolicyVersion: KERNEL_POLICY_VERSION,
      preferIndependentKernel: this.preferIndependentKernel,
      allowSystemBrowserFallback: this.allowSystemBrowserFallback,
      systemBrowserPath: this.systemBrowserPath,
    }, null, indent);
  }

  exportEngineState() {
    if (this.usingSqlite && this.sqliteStore) {
      return this.sqliteStore.exportEngineState();
    }
    const assignments = Object.fromEntries([...this.assignments].map(([id, values]) => [id, [...values]]));
    return {
      extensions: [...this.extensions.values()],
      assignments,
      profiles: [...this.profiles.values()],
      kernelPolicyVersion: KERNEL_POLICY_VERSION,
      preferIndependentKernel: this.preferIndependentKernel,
      allowSystemBrowserFallback: this.allowSystemBrowserFallback,
      systemBrowserPath: this.systemBrowserPath,
    };
  }

  kernelStatus() {
    return this.kernelManager.status();
  }

  /**
   * Compare the installed kernel tree against the record written at install
   * time. Runs in the background on purpose: a missing or truncated file is
   * worth reporting, but never worth delaying startup for.
   */
  kernelIntegrityCheck() {
    if (typeof this.kernelManager.checkInstalledKernelIntegrity !== 'function') {
      return Promise.resolve({ status: 'unsupported' });
    }
    return this.kernelManager.checkInstalledKernelIntegrity();
  }

  async ensureKernelBootstrap() {
    if (this.kernelStatus().installed) return this.kernelStatus().kernel;
    if (!this.kernelBootstrapPromise) {
      this.emit({ type: 'kernel-progress', phase: 'bootstrap', message: '首次启动：正在定位内置独立浏览器内核…' });
      this.kernelBootstrapPromise = this.ensureIndependentKernel(false)
        .catch((error) => {
          this.emit({ type: 'kernel-error', message: '内置独立内核不可用：' + error.message });
          throw error;
        })
        .finally(() => { this.kernelBootstrapPromise = null; });
    }
    return this.kernelBootstrapPromise;
  }

  /**
   * Resolve the integrated independent kernel only.
   * Runtime auto-download of Wayfern / Chrome for Testing is permanently disabled.
   */
  async ensureIndependentKernel(force = false) {
    const kernel = await this.kernelManager.ensureIntegrated(force);
    this.emit({ type: 'kernel-ready', kernel });
    return kernel;
  }

  async checkKernelUpdate() {
    return this.kernelManager.checkUpdate();
  }

  async setCustomKernel(binaryPath) {
    const kernel = await this.kernelManager.setCustomBinary(binaryPath);
    this.emit({ type: 'kernel-ready', kernel });
    return kernel;
  }

  async setKernelPolicy({ preferIndependentKernel, allowSystemBrowserFallback, systemBrowserPath } = {}) {
    if (typeof preferIndependentKernel === 'boolean') this.preferIndependentKernel = preferIndependentKernel;
    if (typeof allowSystemBrowserFallback === 'boolean') this.allowSystemBrowserFallback = allowSystemBrowserFallback;
    if (systemBrowserPath !== undefined) {
      const candidate = String(systemBrowserPath || '').trim();
      if (candidate && !this.systemBrowserCandidates().some((item) => item.path === candidate)) {
        throw new Error('所选本机浏览器不存在或不是支持的浏览器');
      }
      this.systemBrowserPath = candidate || null;
    }
    await this.persist();
    return {
      preferIndependentKernel: this.preferIndependentKernel,
      allowSystemBrowserFallback: this.allowSystemBrowserFallback,
      systemBrowserPath: this.systemBrowserPath,
      status: this.kernelStatus(),
    };
  }

  sanitizeProfile(value) {
    return sanitizeProfileData(value);
  }

  getProfileDataRoot() { return this.profileDataRootPath; }

  /**
   * Cross-platform preflight against the current data root + real profile ids.
   * Pure/cheap: surfaces Windows MAX_PATH risk, missing env, Linux sandbox, etc.
   */
  platformPreflightReport() {
    const ids = [...this.profiles.keys()];
    const maxProfileIdLen = ids.reduce((m, id) => Math.max(m, String(id).length), 0) || undefined;
    // The integrated anti-detect kernel (openbrowser-148) is x64-only by design — see
    // isOpenBrowser148SupportedHost / the macos-x64 bundle layout. Pass that fact through so
    // the arm64 advisories (mac-arm-rosetta / win-arm-kernel) can fire on Apple Silicon and
    // Windows-on-ARM; without it those branches were unreachable. The arch === 'arm64' guard
    // inside platformPreflight keeps x64 hosts silent.
    return platformPreflight({
      profileDataRoot: this.profileDataRootPath,
      maxProfileIdLen,
      kernelRequiresX64: true,
    });
  }

  setProfileDataRoot(value) {
    const raw = String(value || '').trim();
    if (!raw) throw new Error('Environment data directory is required');
    if (this.running.size || this.starting.size || this.stopping.size) {
      throw new Error('Stop all browser environments before changing the data directory');
    }
    const check = validateDataRootIsolationSecure(raw);
    if (!check.ok) throw new Error(check.message);
    this.profileDataRootPath = check.root;
    return this.profileDataRootPath;
  }

  profileRoot(id) { return path.join(this.profileDataRootPath, assertProfileId(id)); }

  browserSelection(preferredEngine = null) {
    const list = this.candidates();
    const wantEngine = preferredEngine === 'firefox' || preferredEngine === 'chromium' ? preferredEngine : null;
    const scoped = wantEngine ? list.filter((item) => (item.engine || 'chromium') === wantEngine) : list;
    const independent = scoped.find((item) => item.independent);
    if (this.allowSystemBrowserFallback && this.systemBrowserPath) {
      const manual = scoped.find((item) => !item.independent && item.path === this.systemBrowserPath);
      if (manual) return { mode: 'system-manual', browser: manual };
    }
    if (this.preferIndependentKernel) {
      if (independent) return { mode: 'independent', browser: independent };
      return {
        mode: 'blocked',
        browser: null,
        message: wantEngine === 'firefox'
          ? '未找到可用的 Firefox 内核。请在「本地设置」下载 Firefox。'
          : '未找到内置独立浏览器内核。请确认安装包包含 kernels/，或在「本地设置」选择自定义内核。',
      };
    }
    const browser = independent || scoped[0];
    if (!browser) return { mode: 'blocked', browser: null, message: '未找到可用浏览器内核' };
    if (!browser.independent && (!this.allowSystemBrowserFallback || browser.path !== this.systemBrowserPath)) {
      return { mode: 'blocked', browser: null, message: '未找到内置独立浏览器内核。请确认安装包包含 kernels/，或在「本地设置」选择自定义内核。' };
    }
    return { mode: browser.independent ? 'independent' : 'system-manual', browser };
  }

  chooseBrowser(profile = null, preferredEngine = null) {
    const engine = preferredEngine === 'firefox' || preferredEngine === 'chromium'
      ? preferredEngine
      : (profile ? this.profileEngine(profile) : null);
    const selection = this.browserSelection(engine);
    if (selection.browser) {
      if (isSystemBrowserExecutable(selection.browser.path) && !this.allowSystemBrowserFallback) {
        throw new Error('已阻止使用本机浏览器。请安装或选择独立 Chromium 内核。');
      }
      if (selection.mode === 'system-manual') {
        this.emit({ type: 'kernel-fallback', message: '用户已手动选择本机浏览器回退。', browser: selection.browser.path });
      }
      return selection.browser;
    }
    throw new Error(selection.message);
  }

  proxyConfig(value) { return parseProxy(value); }

  /**
   * Live window usage for the proxy-library record a profile is bound to (issue #25).
   *
   * A commercial SOCKS5 endpoint usually admits a fixed number of concurrent tunnels, so the same
   * node can serve the first handful of windows and then reject every later one. Counting the
   * running windows per proxy is also what the proxy library panel shows, so both the display and
   * the cap read the same source.
   *
   * Windows that are still coming up count too. A start inserts itself into `this.starting` long
   * before the child process exists, so a check that only looked at `this.running` would let a
   * batch start every window of a capped proxy: each call would observe the cap as unused because
   * none of the siblings had finished booting yet. Counting in-flight starts is what makes the
   * cap hold for the "select N environments -> start" flow, which is exactly when the upstream
   * tunnel budget is spent fastest.
   */
  proxyConcurrencyUsage(profile) {
    const association = profileProxyAssociation(profile);
    const proxyId = normalizedProxyAssociationId(association.value);
    if (!proxyId || !this.proxyStore) return null;
    let item = null;
    try { item = this.proxyStore.get?.(proxyId) || null; } catch (_) { return null; }
    if (!item) return null;
    const raw = String(item.raw || '').trim();
    const running = [];
    const seen = new Set([String(profile.id)]);
    const consider = (candidate, fallbackId) => {
      if (!candidate) return;
      const candidateId = String(candidate.id || fallbackId || '');
      if (!candidateId || seen.has(candidateId)) return;
      const candidateAssociation = profileProxyAssociation(candidate);
      const sameProxy = normalizedProxyAssociationId(candidateAssociation.value) === proxyId
        || (raw && String(candidate.proxy || '').trim() === raw);
      if (!sameProxy) return;
      seen.add(candidateId);
      running.push({ id: candidate.id || fallbackId, label: candidate.name || candidate.title || fallbackId });
    };
    for (const [runningId, runningItem] of this.running) {
      if (runningItem?.cleanedUp || runningItem?.stopping) continue;
      consider(runningItem?.profile, runningId);
    }
    for (const startingId of this.starting.keys()) {
      consider(this.profiles.get(startingId), startingId);
    }
    return {
      item,
      limit: Number.isInteger(item.maxConcurrency) ? item.maxConcurrency : 0,
      running,
    };
  }

  /**
   * Per-proxy window cap (issue #25). Enforced before any data directory, profile lock, proxy
   * bridge or child process exists, so a blocked start leaves nothing behind to clean up.
   */
  assertProxyConcurrencyAvailable(profile) {
    const usage = this.proxyConcurrencyUsage(profile);
    if (!usage || !usage.limit) return;
    if (usage.running.length < usage.limit) return;
    const name = usage.item.name || `${usage.item.host}:${usage.item.port}`;
    const holders = usage.running.slice(0, 3).map((entry) => entry.label).join('、');
    const error = new Error(`代理「${name}」已达并发窗口上限（${usage.running.length}/${usage.limit}）。占用窗口：${holders}${usage.running.length > 3 ? ' 等' : ''}。请先关闭其中一个窗口，或调高该代理的并发上限。`);
    error.code = 'ERR_PROXY_MAX_CONCURRENCY';
    this.emit({ type: 'proxy-error', id: profile.id, code: 'proxy-max-concurrency', message: error.message, policy: 'block' });
    throw error;
  }

  async resetZoom(root) {
    const file = path.join(root, 'Default', 'Preferences');
    try { const prefs = JSON.parse(await fsp.readFile(file, 'utf8')); if (prefs.partition) prefs.partition.per_host_zoom_levels = {}; if (prefs.browser && 'default_zoom_level' in prefs.browser) prefs.browser.default_zoom_level = 0; await fsp.writeFile(file, JSON.stringify(prefs), 'utf8'); } catch (_) {}
  }

  async resetTabs(root) {
    const profile = path.join(root, 'Default');
    for (const name of ['Sessions', 'Current Session', 'Current Tabs', 'Last Session', 'Last Tabs']) {
      const target = await assertSafeProfileChild(root, path.join(profile, name));
      await fsp.rm(target, { recursive: true, force: true }).catch(() => {});
    }
  }

  async enforceDataRetention(root, profile) {
    const base = path.join(root, 'Default'); const targets = [];
    const add = (...names) => targets.push(...names.map((name) => path.join(base, name)));
    if (!profile.advanced.saveCookies) add(path.join('Network', 'Cookies'), path.join('Network', 'Cookies-journal'), 'Cookies', 'Cookies-journal');
    if (!profile.advanced.savePasswords) add('Login Data', 'Login Data-journal', 'Login Data For Account', 'Login Data For Account-journal');
    if (!profile.advanced.saveBookmarks) add('Bookmarks', 'Bookmarks.bak');
    if (!profile.advanced.saveLocalStorage) add('Local Storage');
    if (!profile.advanced.saveIndexedDB) add('IndexedDB');
    if (!profile.advanced.saveHistory) add('History', 'History-journal', 'Visited Links', 'Top Sites', 'Top Sites-journal');
    for (const target of targets) await fsp.rm(target, { recursive: true, force: true }).catch(() => {});
  }

  async applyProfilePreferences(root, profile) {
    const defaultRoot = path.join(root, 'Default'); const file = path.join(defaultRoot, 'Preferences'); await fsp.mkdir(defaultRoot, { recursive: true });
    let prefs = {}; try { prefs = JSON.parse(await fsp.readFile(file, 'utf8')); } catch (_) {}
    prefs.profile ||= {}; prefs.profile.default_content_setting_values ||= {};
    prefs.profile.exit_type = 'Normal'; prefs.profile.exited_cleanly = true;
    prefs.devtools ||= {};
    prefs.devtools.preferences ||= {};
    prefs.policy ||= {};
    prefs.policy.developer_tools_availability = 1;
    prefs.DeveloperToolsAvailability = 1;
    const content = prefs.profile.default_content_setting_values;
    content.fullscreen = 1;
    content.automatic_fullscreen = 1;
    content.window_placement = 1;
    content.window_management = 1;
    prefs.fullscreen ||= {};
    prefs.fullscreen.allowed = true;
    prefs.profile.content_settings ||= {};
    prefs.profile.content_settings.exceptions ||= {};
    const exceptions = prefs.profile.content_settings.exceptions;
    for (const key of ['fullscreen', 'automatic_fullscreen', 'window_placement', 'window_management']) {
      exceptions[key] ||= {};
      exceptions[key]['*,*'] = { setting: 1 };
      exceptions[key]['[*.]*,*'] = { setting: 1 };
    }
    if (profile.advanced.blockImages) content.images = 2; else delete content.images;
    if (profile.advanced.blockSound) content.sound = 2; else delete content.sound;
    if (profile.advanced.blockNotifications) content.notifications = 2; else delete content.notifications;
    // 「完全禁用弹窗拦截」= 允许弹窗 (ALLOW=1)，不是屏蔽弹窗 (BLOCK=2)
    if (profile.advanced.blockPopups) content.popups = 1; else delete content.popups;
    if (profile.privacy.media === 'blocked') { content.media_stream_mic = 2; content.media_stream_camera = 2; } else { delete content.media_stream_mic; delete content.media_stream_camera; }
    if (profile.privacy.geoMode === 'disabled') content.geolocation = 2;
    else if (profile.privacy.geoMode === 'prompt') content.geolocation = 3;
    else delete content.geolocation;
    const allowPasswords = Boolean(profile.advanced.savePasswords) && !profile.advanced.blockPasswordPrompt;
    prefs.credentials_enable_service = allowPasswords;
    prefs.profile.password_manager_enabled = allowPasswords;
    prefs.signin ||= {}; prefs.signin.allowed = Boolean(profile.advanced.allowSignin);
    applyLanguagePreferences(prefs, profile);
    prefs.webkit ||= {}; prefs.webkit.webprefs ||= {};
    if (profile.privacy.fontMode === 'custom') prefs.webkit.webprefs.default_font_size = profile.privacy.fontSize;
    else delete prefs.webkit.webprefs.default_font_size;
    prefs.bookmark_bar ||= {};
    prefs.bookmark_bar.show_on_all_tabs = Boolean(profile.advanced.showBookmarkBar);
    if (profile.advanced.blockRestoreDialog) {
      prefs.session ||= {};
      prefs.session.restore_on_startup = profile.advanced.tabMode === 'restore' || profile.advanced.restoreSession ? 1 : 5;
    }
    await writeRawAtomically(file, JSON.stringify(prefs), 0o600);
    try {
      const persisted = JSON.parse(await fsp.readFile(file, 'utf8'));
      const issues = verifyLanguagePreferences(persisted, profile);
      if (issues.length && typeof this.emit === 'function') {
        this.emit({ type: 'profile-file-sync-error', id: profile.id, key: 'language', issues });
      }
      return { issues };
    } catch (error) {
      if (typeof this.emit === 'function') {
        this.emit({ type: 'profile-file-sync-error', id: profile.id, key: 'language', message: error.message });
      }
      return { issues: [{ key: 'profile.preferences', expected: 'readable', actual: error.message }] };
    }
  }

  /**
   * Pre-spawn profile file prep, parallelized. resetZoom + applyProfilePreferences both
   * read-modify-write Default/Preferences, so they MUST stay serialized relative to each
   * other (else the later write clobbers the earlier one — lost update). Everything else
   * only rm's disjoint paths (Sessions / cache dirs / retained data files) and can overlap,
   * shortening the launch critical path (scales with disk latency and profile size).
   */
  async prepareProfileFilesForStart(root, profile, restoreSession) {
    await removeSingletonFiles(root, { attempts: 6, delayMs: 40 });
    const lockF = path.join(root, '.openbrowser-instance.lock');
    if (fs.existsSync(lockF)) {
      try {
        const content = JSON.parse(await fsp.readFile(lockF, 'utf8'));
        const stat = await fsp.stat(lockF).catch(() => null);
        const uptimeMs = os.uptime() * 1000;
        const systemBootTimeMs = Date.now() - uptimeMs;
        const lockTimeMs = Date.parse(content?.createdAt || '') || stat?.mtimeMs || 0;
        const isFromPriorBoot = lockTimeMs > 0 && lockTimeMs < (systemBootTimeMs - 5000);
        if (isFromPriorBoot || !content?.pid || !isPidAlive(content.pid)) {
          await fsp.rm(lockF, { force: true }).catch(() => {});
        }
      } catch (_) {
        await fsp.rm(lockF, { force: true }).catch(() => {});
      }
    }
    const jobs = [
      // Shared-file chain: resetZoom then applyProfilePreferences, ordered.
      (async () => { await this.resetZoom(root); await this.applyProfilePreferences(root, profile); })(),
      this.enforceDataRetention(root, profile),
      (async () => {
        try {
          await syncProfileLocalState(root, profile);
        } catch (err) {
          if (typeof this.emit === 'function') {
            this.emit({
              type: 'profile-file-sync-error',
              id: profile.id,
              key: 'local_state',
              code: err.code || 'PROFILE_LOCAL_STATE_MISMATCH',
              message: err.message,
              issues: err.issues,
            });
          }
          throw err;
        }
      })(),
    ];
    if (!restoreSession) jobs.push(this.resetTabs(root));
    if (profile.advanced.clearCacheOnStart) jobs.push(this.clearProfileCache(root));
    await Promise.all(jobs);
  }

  resolveStartupUrls(profile) {
    const urls = [];
    // blank page: no platform URL
    if (String(profile.platform?.type || '') !== 'blank') {
      const rootStartUrl = String(profile.startUrl || '').trim();
      if (rootStartUrl) urls.push(rootStartUrl);
      const platformUrl = String(profile.platform?.startUrl || '').trim();
      if (platformUrl && !urls.includes(platformUrl)) urls.push(platformUrl);
    }
    const lines = String(profile.advanced?.startUrls || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    for (const line of lines) if (!urls.includes(line)) urls.push(line);
    if (String(profile.platform?.type || '') === 'blank' && !urls.length) urls.push('about:blank');
    return urls.slice(0, 20);
  }

  isolationAudit() {
    const running = [...this.running.entries()].map(([id, item]) => ({
      id,
      root: item.root,
      port: item.port,
      pid: item.pid,
    }));
    return auditIsolation(running);
  }

  async markProfileCleanExit(root) {
    const file = path.join(root, 'Default', 'Preferences');
    try {
      const prefs = JSON.parse(await fsp.readFile(file, 'utf8')); prefs.profile ||= {};
      prefs.profile.exit_type = 'Normal'; prefs.profile.exited_cleanly = true;
      await fsp.writeFile(file, JSON.stringify(prefs), 'utf8');
    } catch (_) {}
  }

  startNativeProfileMarker(pid, profileId) {
    if (process.platform !== 'win32' || !Number.isInteger(pid) || pid <= 0) return null;
    const executable = path.join(__dirname, 'native-profile-marker.exe'); if (!fs.existsSync(executable)) return null;
    try { return spawn(executable, [String(pid), String(profileId)], { windowsHide: true, stdio: 'ignore' }); } catch (_) { return null; }
  }

  /**
   * Clean resources acquired before a running item is published. Startup can
   * fail after Chromium has spawned but before the item has enough state for
   * cleanupRunningItem(); keep this path idempotent and use the same bounded
   * close/kill/wait ordering on every failure branch.
   */
  cleanupStartupResources(resources = {}) {
    if (resources.cleanupPromise) return resources.cleanupPromise;
    const cleanup = async () => {
      const child = resources.child;
      const connection = resources.connection;
      let exited = isChildExited(child);

      if (connection && !exited) {
        try {
          await Promise.race([
            (async () => {
              try {
                await connection.command?.('Browser.close', {}, { timeout: 5000 });
              } catch (_) {}
            })(),
            new Promise((resolve) => {
              const timer = setTimeout(resolve, 1800);
              timer.unref?.();
            }),
          ]);
        } catch (_) {}
      }

      if (child) {
        exited = exited || await this.waitForChildExit(child, 2500);
        if (!exited && !isChildExited(child) && child.pid) {
          await killProcessTree(child.pid, managedBrowserKillOptions(
            resources.browser,
            resources.root,
            resources.launchBinary,
          )).catch(() => {});
          exited = await this.waitForChildExit(child, 2500);
        }
      }

      try { connection?.close?.(); } catch (_) {}
      if (resources.markerProcess && !resources.markerProcess.killed) {
        try { resources.markerProcess.kill(); } catch (_) {}
      }
      await resources.proxyForwarder?.close().catch(() => {});
      stopIpcStubForWindow(resources.kernelWindowName);
      if (child && !exited) {
        // Startup owns the same profile lock safety rule as running cleanup: a
        // process that may still be alive must keep the lock as a tombstone.
        return { exited: false, lockReleased: false, cleanupBlocked: true };
      }
      if (resources.root) {
        await removeSingletonFiles(resources.root, { attempts: 6, delayMs: 40 });
        const helperDrain = await this.drainProfileHelpers(resources.root);
        if (!helperDrain.known || helperDrain.pids.length) {
          return {
            exited: false,
            lockReleased: false,
            cleanupBlocked: true,
            helperPids: helperDrain.pids,
          };
        }
      }
      if (resources.profileLock && resources.root) {
        const released = await releaseProfileLock(resources.root, resources.profileLock).catch(() => false);
        const lockStillPresent = fs.existsSync(lockPath(resources.root));
        if (!released && lockStillPresent) {
          return { exited: false, lockReleased: false, cleanupBlocked: true };
        }
        return { exited, lockReleased: !lockStillPresent };
      }
      return { exited, lockReleased: true };
    };
    resources.cleanupPromise = cleanup();
    return resources.cleanupPromise;
  }

  async waitForPort(root, timeout = 30000, child = null) {
    const file = path.join(root, 'DevToolsActivePort');
    const started = Date.now();
    // Do not delete DevToolsActivePort here — cleared before spawn; post-spawn delete races Chromium.
    const assertChildAlive = () => {
      if (child?._startupDiagnostic?.spawnError) {
        throw new Error(`Browser process could not start: ${child._startupDiagnostic.spawnError}`);
      }
      if (child && isChildExited(child)) {
        throw new Error(formatBrowserStartupError(
          `Browser exited before CDP was ready (code ${child.exitCode}${child.signalCode ? ', signal ' + child.signalCode : ''})`,
          child,
          child._startupDiagnostic,
        ));
      }
    };
    const tryReadPort = async () => {
      try {
        const content = await fsp.readFile(file, 'utf8');
        const port = Number(content.split(/\r?\n/)[0]);
        if (Number.isInteger(port) && port > 0) {
          try {
            await cdp.json(`http://127.0.0.1:${port}/json/version`);
            return port;
          } catch (_) {
            // File is written slightly before the DevTools endpoint answers. Measured on a
            // real launch that gap is ~600ms of Chromium coming up, not idle polling — a
            // tighter retry loop here was tried and bought nothing, so keep it simple.
          }
        }
      } catch (_) {}
      return 0;
    };
    // Event-driven fast path: watch the profile dir so we react ~1 tick after Chromium
    // writes DevToolsActivePort, instead of waiting out a fixed 200ms poll. Polling stays
    // as the fallback — fs.watch is unreliable on some network/virtual filesystems and
    // platforms, so a watcher failure just degrades to the (slightly tighter) poll.
    let watcher = null;
    let wake = null;
    try { watcher = fs.watch(root, () => { const w = wake; if (w) w(); }); } catch (_) { watcher = null; }
    try {
      assertChildAlive();
      let port = await tryReadPort();
      if (port) return port;
      while (Date.now() - started < timeout) {
        assertChildAlive();
        await new Promise((resolve) => {
          let done = false;
          const finish = () => { if (done) return; done = true; wake = null; clearTimeout(timer); resolve(); };
          wake = finish;
          // Backstop timeout: short when watching (event does the real work), tighter than
          // the old 200ms when we have no watcher to lean on.
          const timer = setTimeout(finish, watcher ? 250 : 120);
          if (timer.unref) timer.unref();
        });
        port = await tryReadPort();
        if (port) return port;
      }
    } finally {
      wake = null;
      try { watcher?.close(); } catch (_) {}
    }
    let hint = '';
    try {
      if (child && child.exitCode !== null) hint = ` childExit=${child.exitCode}`;
      else if (child && child.pid) hint = ` childPid=${child.pid} still running`;
    } catch (_) {}
    throw new Error(formatBrowserStartupError(
      'Browser started but CDP port was not ready' + hint,
      child,
      child?._startupDiagnostic,
    ));
  }

  emitStartProgress(profileId, phase, percent, message = '') {
    this.emit({
      type: 'profile-start-progress',
      id: profileId,
      phase,
      percent: Math.max(0, Math.min(100, Math.round(Number(percent) || 0))),
      message: message || '',
      starting: true,
      running: false,
    });
  }

  restoreStoredProxyCredentials(incoming, source = null) {
    if (!incoming || incoming.networkMode === 'direct' || incoming.proxyId) return incoming;
    if (String(source?.proxyAuthAction ?? source?.proxy_auth_action ?? '').trim().toLowerCase() === 'clear') {
      return incoming;
    }
    const previous = this.profiles.get(incoming.id);
    if (!previous) return incoming;
    const nextProxy = String(incoming.proxy || '');
    const prevProxy = String(previous.proxy || '');
    const nextHasAuth = proxyHasCredentials(nextProxy);
    const prevHasAuth = proxyHasCredentials(prevProxy);
    if (!prevHasAuth || nextHasAuth) return incoming;
    if (sameProxyEndpoint(prevProxy, nextProxy)) {
      return this.sanitizeProfile({ ...incoming, networkMode: 'proxy', proxy: prevProxy });
    }
    return incoming;
  }

  retainBlockedStartup(profile, resources, cause, generation, cleanupResult = {}) {
    const current = this.running.get(profile.id);
    if (current) return current;
    const error = new Error(`Browser startup cleanup is incomplete for profile ${profile.id}`);
    error.code = cleanupResult.helperPids?.length
      ? 'BROWSER_HELPERS_EXIT_UNCONFIRMED'
      : 'BROWSER_EXIT_UNCONFIRMED';
    error.cause = cause;
    error.pids = cleanupResult.helperPids || [];
    const item = {
      child: resources.child || null,
      cdpConnection: resources.connection || null,
      proxyForwarder: resources.proxyForwarder || null,
      markerProcess: resources.markerProcess || null,
      profileLock: resources.profileLock || null,
      pid: resources.child?.pid || null,
      browser: resources.browser || null,
      root: resources.root || null,
      profile,
      port: null,
      launchBinary: resources.launchBinary || null,
      kernelWindowName: resources.kernelWindowName || null,
      childExitState: {
        exited: isChildExited(resources.child),
        code: resources.child?.exitCode ?? null,
        signal: resources.child?.signalCode || null,
        error: null,
      },
      lifecycleGeneration: generation,
      cleanupState: 'blocked',
      cleanupAttempts: 1,
      cleanedUp: false,
      cleanupFailed: true,
      cleanupError: error,
      stopping: true,
      cleanupPromise: null,
      statusEmitted: false,
      profileClosedEmitted: false,
      extensions: [],
      loadedExtensions: [],
    };
    this.running.set(profile.id, item);
    return item;
  }

  async start(raw) {
    const candidate = this.restoreStoredProxyCredentials(
      this.resolveStoredProxyProfile(this.sanitizeProfile(raw)),
      raw,
    );
    const id = candidate.id;
    const pendingStart = this.starting.get(id);
    if (pendingStart) return pendingStart;
    if (this.stopAllInProgress) {
      const error = new Error('Browser engine is stopping all environments');
      error.code = 'ENGINE_STOPPING';
      throw error;
    }

    // Firefox kernels have no CDP; they take the dedicated launch pipeline.
    // The decision lives here so every caller (UI, local API, RPA) gets it.
    if (this.profilePrefersFirefox(candidate)) {
      return this.startManaged(id, candidate, (generation) => this._startFirefox(candidate, generation));
    }
    return this.startManaged(id, candidate, (generation) => this._start(candidate, generation));
  }

  /**
   * Shared start bookkeeping (starting map + generation barrier). start() used
   * to inline this; the Chromium and Firefox pipelines both go through it now.
   */
  async startManaged(id, candidate, run) {
    const generation = this.nextLifecycleGeneration(id);
    const task = (async () => {
      const pendingStop = this.stopping.get(id);
      if (pendingStop) await pendingStop.catch(() => {});
      this.assertStartGenerationActive(id, generation);

      let afterStop = this.running.get(id);
      if (afterStop && (afterStop.cleanupFailed || afterStop.cleanedUp || afterStop.stopping)) {
        if (!afterStop.cleanupFailed) {
          await this.stopRunningItem(id, afterStop).catch(() => {});
          afterStop = this.running.get(id);
        }
      }
      if (afterStop && (afterStop.cleanupFailed || afterStop.cleanedUp || afterStop.stopping)) {
        let numericPid = Number(afterStop.pid);
        let childDead = afterStop.child
          ? isChildExited(afterStop.child)
          : (numericPid > 0 ? !isPidAlive(numericPid) : true);
        let helpers = scanProcessesUsingProfile(afterStop.root || '').pids;
        if (!childDead || helpers.length) {
          if (!childDead && numericPid > 0) {
            await killProcessTree(numericPid, managedBrowserKillOptions(afterStop, afterStop.root)).catch(() => {});
          }
          for (const helperPid of helpers) {
            if (helperPid && helperPid !== process.pid) {
              await killProcessTree(helperPid, { force: true }).catch(() => {});
            }
          }
          childDead = afterStop.child
            ? isChildExited(afterStop.child)
            : (numericPid > 0 ? !isPidAlive(numericPid) : true);
          helpers = scanProcessesUsingProfile(afterStop.root || '').pids;
          if (!childDead || helpers.length) {
            if (numericPid > 0 && isPidAlive(numericPid)) {
              try { process.kill(numericPid, 'SIGKILL'); } catch (_) {}
            }
            for (const helperPid of helpers) {
              try { if (helperPid !== process.pid) process.kill(helperPid, 'SIGKILL'); } catch (_) {}
            }
          }
        }
        childDead = afterStop.child
          ? isChildExited(afterStop.child)
          : (numericPid > 0 ? !isPidAlive(numericPid) : true);
        helpers = scanProcessesUsingProfile(afterStop.root || '').pids;
        if (!childDead) {
          throw afterStop.cleanupError || Object.assign(
            new Error(`Browser environment ${id} is still stopping; child exit has not been confirmed`),
            { code: 'BROWSER_EXIT_UNCONFIRMED' },
          );
        }
        if (afterStop.root) {
          await removeSingletonFiles(afterStop.root, { attempts: 8, delayMs: 40 });
        }
        try { afterStop.cdpConnection?.close?.(); } catch (_) {}
        if (afterStop.proxyForwarder) {
          try { await afterStop.proxyForwarder.close?.(); } catch (_) {}
        }
        if (afterStop.profileLock && afterStop.root) {
          await releaseProfileLock(afterStop.root, afterStop.profileLock).catch(() => {});
        }
        this.running.delete(id);
        afterStop = null;
      }
      if (afterStop) return this.publicRunning(id);
      this.assertStartGenerationActive(id, generation);
      return run(generation);
    })();
    task.lifecycleGeneration = generation;
    this.starting.set(id, task);
    try {
      return await task;
    } finally {
      if (this.starting.get(id) === task) this.starting.delete(id);
    }
  }

  /**
   * True when a profile asks for the Firefox engine: the per-profile editor
   * setting, or a Firefox default pin with no per-profile override.
   */
  profilePrefersFirefox(profile) {
    const engine = String(profile?.engine || '').trim().toLowerCase();
    if (engine === 'firefox') return true;
    if (engine === 'chromium') return false;
    // No per-profile choice: fall back to the pinned/installed default kernel.
    const installed = this.kernelManager.resolveInstalled();
    return installed?.engine === 'firefox';
  }

  publicRunning(id) {
    const starting = this.starting.has(id);
    const pendingStop = this.stopping.has(id);
    const item = this.running.get(id);
    if (!item) return { id, running: false, starting, stopping: pendingStop };
    if (item.cleanedUp || item.stopping) {
      return {
        id,
        running: false,
        stopping: true,
        pid: item.pid,
        port: item.port,
        browser: item.browser?.name,
        executable: item.browser?.path,
        profileDirectory: item.root,
      };
    }
    return {
      id, running: true, starting: false, stopping: false, pid: item.pid, port: item.port,
      engine: item.engine || 'chromium',
      browser: item.browser.name, executable: item.browser.path,
      profileDirectory: item.root,
      extensionCount: item.extensions.length,
      loadedExtensions: item.loadedExtensions || [],
      cdpError: item.cdpError || null,
      verificationBlocked: Boolean(item.verificationBlocked),
      fingerprintVerificationError: item.fingerprintVerificationError || null,
      fingerprint: item.fingerprint ? {
        platform: item.fingerprint.platform,
        hardwareConcurrency: item.fingerprint.hardwareConcurrency,
        deviceMemory: item.fingerprint.deviceMemory,
        canvas: item.fingerprint.canvas?.mode,
        webgl: item.fingerprint.webgl?.mode,
        webrtc: item.fingerprint.webrtc,
      } : null,
    };
  }

  stopRunningItem(safe, item) {
    if (!item) return Promise.resolve({ id: safe, running: false, alreadyStopped: true });
    const pending = this.stopping.get(safe);
    if (pending?.lifecycleSettled && this.stopping.get(safe) === pending) this.stopping.delete(safe);
    const activePending = this.stopping.get(safe);
    if (activePending && (!activePending.lifecycleItem || activePending.lifecycleItem === item)) return activePending;
    if (activePending) {
      return activePending.catch(() => {}).then(() => {
        if (this.running.get(safe) !== item) return { id: safe, running: false, alreadyStopped: true };
        return this.stopRunningItem(safe, item);
      });
    }
    if (item.cleanupPromise?.lifecycleSettled) item.cleanupPromise = null;
    if (item.cleanupPromise) {
      const cleanupPromise = item.cleanupPromise;
      cleanupPromise.lifecycleItem = item;
      cleanupPromise.lifecycleGeneration = item.lifecycleGeneration;
      this.stopping.set(safe, cleanupPromise);
      cleanupPromise.finally(() => {
        if (this.stopping.get(safe) === cleanupPromise) this.stopping.delete(safe);
      }).catch(() => {});
      return cleanupPromise;
    }

    const task = this._stop(safe, item);
    task.lifecycleItem = item;
    task.lifecycleGeneration = item.lifecycleGeneration;
    task.lifecycleSettled = false;
    task.then(
      () => { task.lifecycleSettled = true; },
      () => { task.lifecycleSettled = true; },
    );
    this.stopping.set(safe, task);
    task.finally(() => {
      if (this.stopping.get(safe) === task) this.stopping.delete(safe);
    }).catch(() => {});
    return task;
  }

  async stop(id) {
    const safe = assertProfileId(id);
    this.resetFingerprintVerificationFailures(safe);
    const pendingStop = this.stopping.get(safe);
    if (pendingStop?.lifecycleSettled && this.stopping.get(safe) === pendingStop) this.stopping.delete(safe);
    if (this.stopping.has(safe)) return this.stopping.get(safe);

    const pendingStart = this.starting.get(safe);
    const requestedGeneration = pendingStart?.lifecycleGeneration;
    if (pendingStart) {
      this.requestLifecycleStop(safe, requestedGeneration);
      await pendingStart.catch(() => {});
    }

    const afterStartStop = this.stopping.get(safe);
    if (afterStartStop) {
      try {
        return await afterStartStop;
      } finally {
        this.clearLifecycleStopRequest(safe, requestedGeneration);
      }
    }
    const item = this.running.get(safe);
    if (!item) {
      this.clearLifecycleStopRequest(safe, requestedGeneration);
      return { id: safe, running: false, alreadyStopped: true };
    }

    try {
      return await this.stopRunningItem(safe, item);
    } finally {
      this.clearLifecycleStopRequest(safe, requestedGeneration);
    }
  }

  async _stop(safe, item) {
    item.stopping = true;
    this.clearRunningWatch(item);
    item.workerFingerprintConnection?.close();
    item.workerFingerprintConnection = null;
    const profile = this.profiles.get(safe) || item.profile || {};
    // Snapshot cookies before close when this env opts into cloud backup (close-time Cookie sync)
    let cookieExport = '';
    const wantCookieSnap = profile.advanced?.cloudBackup && profile.advanced?.syncCookiesOnClose !== false;
    if (wantCookieSnap && item.cdpConnection) {
      cookieExport = await this.exportProfileCookies(item.cdpConnection).catch(() => '');
      if (cookieExport) {
        profile.cookies = cookieExport;
        profile.updatedAt = new Date().toISOString();
        this.profiles.set(safe, profile);
        await this.persist().catch(() => {});
      }
    }
    let graceful = !item.child || isChildExited(item.child);
    if (!graceful && item.child) {
      // Prefer Browser.close so window-X / empty-window auto-stop fully quits Chromium helpers
      try {
        await Promise.race([
          (async () => {
            try {
              await item.cdpConnection?.command?.('Browser.close', {}, { timeout: 5000 });
            } catch (_) {
              const ws = await cdp.browserSocket(item.port).catch(() => null);
              if (ws) await cdp.call(ws, 'Browser.close', {}, 4000).catch(() => {});
            }
          })(),
          new Promise((resolve) => setTimeout(resolve, 1800)),
        ]);
      } catch (_) {}
      graceful = await this.waitForChildExit(item.child, 6500);
    }
    const cleanupResult = await this.cleanupRunningItem(safe, item, {
      reason: 'stop',
      expected: true,
      kill: !graceful,
      waitForExit: true,
      exitTimeout: 6500,
      emitProfileClosed: false,
    });
    await this.enforceDataRetention(item.root, this.profiles.get(safe) || item.profile).catch(() => {});
    if (profile.advanced?.cloudBackup) {
      item.profileClosedEmitted = true;
      this.emit({
        type: 'profile-closed',
        id: safe,
        cloudBackup: true,
        cookieExported: Boolean(cookieExport),
        profile: this.profiles.get(safe) || profile,
        reason: 'stop',
      });
    }
    return { ...cleanupResult, id: safe, running: false, graceful, cookieExported: Boolean(cookieExport) };
  }

  async stopAll() {
    if (this.stopAllPromise) return this.stopAllPromise;
    this.stopAllInProgress = true;
    const task = this._stopAll();
    this.stopAllPromise = task;
    try {
      return await task;
    } finally {
      if (this.stopAllPromise === task) this.stopAllPromise = null;
      this.stopAllInProgress = false;
    }
  }

  async _stopAll() {
    // Drain until the lifecycle maps reach a fixed point. A one-shot snapshot can
    // miss a restart that was queued while another environment was stopping.
    // Each environment also has its own deadline, so a stuck startup or WMI/CDP
    // operation cannot prevent unrelated environments and the start-page server
    // from being closed during application shutdown.
    const failed = [];
    const itemTimeout = Math.max(50, Number(this.stopAllItemTimeoutMs) || STOP_ALL_ITEM_TIMEOUT_MS);
    for (let pass = 0; pass < 8; pass += 1) {
      const ids = [...new Set([...this.running.keys(), ...this.starting.keys(), ...this.stopping.keys()])];
      if (!ids.length) break;
      const results = await Promise.allSettled(ids.map((id) => lifecycleTimeout(
        this.stop(id),
        itemTimeout,
        `Timed out stopping browser environment ${id}`,
      )));
      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        if (result.status === 'rejected') failed.push(`${ids[index]}: ${String(result.reason?.message || result.reason)}`);
      }
      const remaining = [...new Set([...this.running.keys(), ...this.starting.keys(), ...this.stopping.keys()])];
      if (!remaining.length) break;
    }
    const remaining = [...new Set([...this.running.keys(), ...this.starting.keys(), ...this.stopping.keys()])];
    if (remaining.length) failed.push(`lifecycle resources remain: ${remaining.join(', ')}`);
    if (this.startPageServer?.server) {
      try {
        await lifecycleTimeout(this.startPageServer.stop(), 4000, 'Timed out stopping start page server');
      } catch (error) {
        failed.push(`start page server: ${error.message || error}`);
      }
    }
    if (failed.length) this.emit({ type: 'sync-error', action: 'stop-all', message: `部分环境停止失败：${[...new Set(failed)].join('; ')}` });
    return { stopped: remaining.length === 0, remaining, errors: [...new Set(failed)] };
  }

  // Public status view. Cookie jars (up to 500 KB per profile) and platform
  // account secrets do not belong in a poll payload that the renderer requests
  // every ~120 ms: the editor reads them from local state, and the cloud-backup
  // flow receives the full profile through the 'profile-closed' event instead.
  // Proxy strings keep their credentials — the renderer merges them back into
  // local state (mergeEngineExitState) and localStorage already strips them.
  status() {
    return [...this.profiles.values()].map((profile) => {
      const view = { ...profile, ...this.publicRunning(profile.id), network: this.networkInfo.get(profile.id) || null, assignedExtensions: [...(this.assignments.get(profile.id) || [])] };
      if ('cookies' in view) view.cookies = '';
      if (view.platform && typeof view.platform === 'object') {
        view.platform = { ...view.platform };
        if ('password' in view.platform) view.platform.password = '';
        if ('totpSecret' in view.platform) view.platform.totpSecret = '';
      }
      return view;
    });
  }

  async readExtension(directory, builtIn = false) {
    const extensionPath = await assertExtensionTreeSafe(directory);
    const manifestPath = path.join(extensionPath, 'manifest.json'); const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
    if (![2, 3].includes(manifest.manifest_version) || typeof manifest.name !== 'string' || typeof manifest.version !== 'string') throw new Error('The selected folder does not contain a valid Chrome extension manifest');
    let messages = {}; const locale = String(manifest.default_locale || 'en').replace(/[^a-zA-Z0-9_-]/g, '');
    for (const candidate of [locale, 'en', 'en_US', 'zh_CN']) { try { messages = JSON.parse(await fsp.readFile(path.join(extensionPath, '_locales', candidate, 'messages.json'), 'utf8')); if (Object.keys(messages).length) break; } catch (_) {} }
    const localized = (text) => { const match = String(text || '').match(/^__MSG_([^_].*?)__$/i); return match && messages[match[1]]?.message ? String(messages[match[1]].message) : String(text || ''); };
    const iconSource = this.extensionIconSource(manifest);
    let iconUrl = null;
    if (iconSource) {
      const iconPath = path.resolve(extensionPath, iconSource.replace(/^[/\\]+/, ''));
      if (isPathInsideOrEqual(iconPath, extensionPath)) {
        try {
          const iconRealPath = await fsp.realpath(iconPath);
          const iconStat = await fsp.lstat(iconPath);
          if (!iconStat.isSymbolicLink() && iconStat.isFile() && isPathInsideOrEqual(iconRealPath, extensionPath)) iconUrl = pathToFileURL(iconRealPath).toString();
        } catch (_) {}
      }
    }
    const id = crypto.createHash('sha256').update(extensionPath.toLowerCase()).digest('hex').slice(0, 20);
    return { id, name: localized(manifest.name), version: manifest.version, description: localized(manifest.description), manifestVersion: manifest.manifest_version, path: extensionPath, iconUrl, builtIn, addedAt: new Date().toISOString() };
  }

  extensionIconSource(manifest) {
    const iconSets = [manifest.icons, manifest.action?.default_icon, manifest.browser_action?.default_icon, manifest.page_action?.default_icon];
    for (const iconSet of iconSets) {
      if (typeof iconSet === 'string') return iconSet;
      if (!iconSet || typeof iconSet !== 'object') continue;
      const candidates = Object.entries(iconSet)
        .filter(([, value]) => typeof value === 'string')
        .sort(([left], [right]) => Number(right) - Number(left));
      if (candidates[0]) return candidates[0][1];
    }
    return null;
  }

  async addExtension(directory) { const value = await this.readExtension(directory, false); this.extensions.set(value.id, value); await this.persist(); this.emit({ type: 'extensions' }); return value; }
  async addStoreExtension(url, fetchPackage) { const value = await addChromeStoreExtension(url, this.app.getPath('userData'), (directory, builtIn) => this.readExtension(directory, builtIn), fetchPackage); this.extensions.set(value.id, value); await this.persist(); this.emit({ type: 'extensions' }); return value; }
  listExtensions() {
    const profileIds = [...this.profiles.keys()];
    return [...this.extensions.values()].map((item) => {
      const assignedProfileIds = profileIds.filter((id) => (this.assignments.get(id) || new Set()).has(item.id));
      return { ...item, assignedProfiles: assignedProfileIds.length, assignedProfileIds, enabledAll: profileIds.length > 0 && assignedProfileIds.length === profileIds.length };
    });
  }
  async assignExtension(extensionId, profileIds, enabled) {
    if (!this.extensions.has(extensionId)) throw new Error('Unknown extension');
    if (!Array.isArray(profileIds) || profileIds.length > 1000) throw new Error('Invalid profile list');
    for (const profileId of profileIds) { const safe = assertProfileId(profileId); const set = this.assignments.get(safe) || new Set(); if (enabled) set.add(extensionId); else set.delete(extensionId); this.assignments.set(safe, set); }
    await this.persist(); this.emit({ type: 'extensions' }); return { success: true, restartRequired: profileIds.filter((id) => this.running.has(id)) };
  }
  async reloadExtension(id) {
    const existing = this.extensions.get(id);
    if (!existing) throw new Error('Unknown extension');
    if (!fs.existsSync(existing.path)) throw new Error('Extension path does not exist');
    const updated = await this.readExtension(existing.path, Boolean(existing.builtIn));
    updated.addedAt = existing.addedAt || updated.addedAt;
    this.extensions.set(id, updated);
    await this.persist();
    this.emit({ type: 'extensions' });
    return updated;
  }
  async reloadAllExtensions() {
    const results = [];
    for (const [id, ext] of this.extensions.entries()) {
      if (fs.existsSync(ext.path)) {
        try {
          const updated = await this.readExtension(ext.path, Boolean(ext.builtIn));
          updated.addedAt = ext.addedAt || updated.addedAt;
          this.extensions.set(id, updated);
          results.push(updated);
        } catch (e) {
          console.warn('[extensions] Failed to reload extension ' + id + ':', e.message);
        }
      }
    }
    await this.persist();
    this.emit({ type: 'extensions' });
    return results;
  }
  async removeExtension(id) {
    const value = this.extensions.get(id);
    if (!value || value.builtIn) throw new Error('Built-in extension cannot be removed');
    this.extensions.delete(id);
    for (const set of this.assignments.values()) set.delete(id);
    if (this.usingSqlite && this.sqliteStore) {
      this.sqliteStore.deleteExtension(id);
    }
    await this.persist();
    return { success: true };
  }
  on(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(value) { for (const listener of this.listeners) listener(value); }
  runningWithCdp(ids) {
    return ids.map((id) => ({ id, item: this.running.get(id) }))
      .filter((entry) => entry.item?.port && !entry.item.cleanedUp && !entry.item.stopping);
  }
  async sessions() { const result = []; for (const { id, item } of this.runningWithCdp([...this.running.keys()])) { try { result.push({ id, profile: this.profiles.get(id), port: item.port, browser: item.browser.name, tabs: await cdp.tabs(item.port) }); } catch (error) { result.push({ id, profile: this.profiles.get(id), port: item.port, browser: item.browser.name, tabs: [], error: error.message }); } } return result; }
}

// Runtime settings application, the startup-page/locale environment cluster
// and the constructor-time init routine are prototype mixins:
Object.assign(BrowserEngine.prototype, require('./engine/runtime-settings'));
Object.assign(BrowserEngine.prototype, require('./engine/start-page'));
Object.assign(BrowserEngine.prototype, require('./engine/init'));

// The profile-proxy runtime group (resolve/apply/test/check/refresh/prepare)
// is a prototype mixin in engine/profile-proxy.js; engine/start.js calls
// this.prepareProfileProxyForStart through the prototype.
Object.assign(BrowserEngine.prototype, require('./engine/profile-proxy'));

// The startup routine (_start) is a prototype mixin in engine/start.js;
// the public start() entry stays here and calls it through the prototype.
Object.assign(BrowserEngine.prototype, require('./engine/start'));
// Firefox launch pipeline (no CDP); prototype-assigned like engine/start.
Object.assign(BrowserEngine.prototype, require('./engine/start-firefox'));

// Fingerprint injection (worker realms, session attach, delivery
// verification, start-page refresh) is a prototype mixin in
// engine/fingerprint-injection.js.
Object.assign(BrowserEngine.prototype, require('./engine/fingerprint-injection'));

// Lifecycle cleanup and the profile store API are prototype mixins kept in
// engine/lifecycle-cleanup.js and engine/profile-store-api.js: same `this`
// binding, same engine.<method>() surface, bodies verbatim.
Object.assign(BrowserEngine.prototype, require('./engine/lifecycle-cleanup'));
Object.assign(BrowserEngine.prototype, require('./engine/profile-store-api'));

module.exports = {
  BrowserEngine,
  sanitizeInjectionScript,
  appendDiagnosticOutput,
  formatBrowserStartupError,
  writeBrowserStartupDiagnostic,
  systemBrowserCandidatesForPlatform,
  isValidIanaTimezone,
  extractTimezoneFromArgs,
  RequestHeaderRewriter,
  createRequestHeaderRewriter,
  CHROMIUM_CANONICAL_HEADER_ORDER,
  CHROMIUM_CANONICAL_HEADER_INDEX,
  evaluateFingerprintDelivery,
  normalizePlatformFamily,
  detectUaPlatform,
  extractChromeMajor,
  extractGpuBrand,
  normalizeTimezone,
  extractPrimaryLanguage,
  backgroundNetworkFlagsForProfile,
};

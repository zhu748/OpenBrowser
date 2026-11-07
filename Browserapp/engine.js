const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { ProfileStoreSqlite } = require('./automation/profile-store-sqlite');
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
  displayProxy = (v) => String(v || ''),
  lookupProxyCountry = async () => ({ ip: '', country: '', countryCode: '' }),
  lookupDirectCountry = async () => ({ ip: '', country: '', countryCode: '' }),
  extractProxyFromApi = async () => '',
  invokeProxyRefresh = async () => '',
  classifyProxyError = () => 'proxy-unknown',
} = proxyForwarderModule;
const { resolveProfileLanguage, resolveProfileTimezone, localeFromCountryCode } = require('./automation/locale-from-country');
const { applyLanguagePreferences, verifyLanguagePreferences, syncProfileLocalState } = require('./automation/profile-file-consistency');
const { toFileUrl, killProcessTree } = require('./automation/protocol/cross-platform');
const { platformPreflight } = require('./automation/platform-preflight');
const { buildFingerprint, buildWorkerInjectionScript, applyFingerprintToTab } = require('./automation/fingerprint');
const isolation = require('./automation/isolation');
const { lockPath, releaseProfileLock, scanProcessesUsingProfile, isPidAlive, auditIsolation, isSystemBrowserExecutable, isPathInsideOrEqual, validateDataRootIsolationSecure, assertProfileId, assertSafeProfileChild } = isolation;
const { BrowserKernelManager } = require('./automation/browser-kernel');
const { ensureStartPageServer, getStartPageServer } = require('./automation/start-page-server');
const {
} = require('./automation/kernel-init-sync');
const { fpLog, summarizeFp, LIVE_PROBE_EXPRESSION, logPath: fingerprintLogPath } = require('./automation/fingerprint-debug-log');
const { buildPortScanProtectionScript } = require('./automation/port-scan-protection');
const { buildWorkerFontPresenceSource } = require('./automation/worker-font-presence-fallback');
const { createCssFontResponseRewriter } = require('./automation/css-font-response-rewrite');
const { deriveFontPlaceholder } = require('./automation/font-placeholder');
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
const { buildUaProfile, cdpUserAgentOverride, buildAcceptLanguageHeader } = require('./automation/user-agent');
const { sanitizeUrlForLog } = require('./automation/log-sanitizer');
const { getPlatformFontPayload } = require('./automation/query-local-font-blob-gate');


const { fingerprintConfigHash, isEphemeralDocumentUrl } = require('./engine/fingerprint-injection');

const KERNEL_POLICY_VERSION = 4;
const STOP_ALL_ITEM_TIMEOUT_MS = process.platform === 'win32' ? 22000 : 12000;

const {
  isChildExited,
  removeSingletonFiles,
  lifecycleTimeout,
  parsedProxy,
  proxyHasCredentials,
  hasExplicitScheme,
  sameProxyEndpoint,
  sameProxyIdentity,
  ownAliasValue,
  profileProxyAssociation,
  normalizedProxyAssociationId,
  managedBrowserKillOptions,
  systemBrowserCandidatesForPlatform,
  appendDiagnosticOutput,
  formatBrowserStartupError,
  writeBrowserStartupDiagnostic,
  stopIpcStubForWindow,
  writeRawAtomically,
  writeJsonAtomically,
  readEngineStateCandidate,
  engineStateRecoveryCandidates,
  preserveCorruptEngineState,
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
    // 1) Independent kernel (integrated / custom) — first priority
    const independent = this.kernelManager.resolveInstalled();
    if (independent) list.push({ name: independent.name, path: independent.path, independent: true, version: independent.version, source: independent.source });

    // 2) System browsers are exposed for explicit manual selection only.
    for (const item of this.systemBrowserCandidates()) list.push({ ...item, independent: false });
    return list.filter((item, index, all) => fs.existsSync(item.path) && all.findIndex((other) => other.path === item.path) === index);
  }

  systemBrowserCandidates() {
    return systemBrowserCandidatesForPlatform();
  }

  async init(bundledExtensionPath) {
    await this.kernelManager.loadMeta();
    let migrateKernelPolicy = false;
    let recoveredState = false;

    if (ProfileStoreSqlite.isSupported()) {
      try {
        const sqlite = new ProfileStoreSqlite({
          dbPath: this.dbFile,
          legacyJsonPath: this.stateFile,
          wal: true,
          backupOldJson: true,
        });
        const initRes = await sqlite.init();
        this.sqliteStore = sqlite;
        this.usingSqlite = true;
        if (initRes.migrated) {
          this.emit({ type: 'storage-migrated', engine: 'sqlite' });
        }
      } catch (err) {
        console.warn(`[BrowserEngine] SQLite initialization failed, falling back to legacy JSON: ${err.message}`);
        this.sqliteStore = null;
        this.usingSqlite = false;
      }
    }

    if (this.usingSqlite && this.sqliteStore) {
      const extensions = this.sqliteStore.listExtensions();
      for (const extension of extensions) {
        if (fs.existsSync(extension.path)) {
          try {
            const refreshed = await this.readExtension(extension.path, Boolean(extension.builtIn));
            refreshed.addedAt = extension.addedAt || refreshed.addedAt;
            this.extensions.set(refreshed.id, refreshed);
          } catch (_) {
            this.extensions.set(extension.id, extension);
          }
        }
      }
      const assignments = this.sqliteStore.getAssignments();
      for (const [profileId, ids] of assignments.entries()) {
        this.assignments.set(profileId, ids);
      }
      const loadedProfiles = this.sqliteStore.getAllProfiles();
      for (const raw of loadedProfiles.slice(0, 1000)) {
        try {
          const profile = this.sanitizeProfile(raw);
          this.profiles.set(profile.id, profile);
        } catch (_) {}
      }
      const meta = this.sqliteStore.getAllMeta();
      if (typeof meta.preferIndependentKernel === 'boolean') {
        this.preferIndependentKernel = meta.preferIndependentKernel;
      }
      if (meta.kernelPolicyVersion !== KERNEL_POLICY_VERSION) {
        this.allowSystemBrowserFallback = false;
        this.systemBrowserPath = null;
        migrateKernelPolicy = true;
      } else if (typeof meta.allowSystemBrowserFallback === 'boolean') {
        this.allowSystemBrowserFallback = meta.allowSystemBrowserFallback;
        if (typeof meta.systemBrowserPath === 'string') {
          this.systemBrowserPath = meta.systemBrowserPath;
        }
      }
    } else {
      let state = null;
      let primaryStateError = null;
      try {
        state = await readEngineStateCandidate(this.stateFile);
      } catch (error) {
        primaryStateError = error;
      }
      if (!state) {
        const recovery = await engineStateRecoveryCandidates(this.stateFile);
        if (recovery.length) {
          state = recovery[0];
          recoveredState = true;
          if (primaryStateError && primaryStateError.code !== 'ENOENT') {
            await preserveCorruptEngineState(this.stateFile);
          }
        }
      }
      if (!state && primaryStateError && primaryStateError.code !== 'ENOENT') {
        throw new Error(`引擎状态文件损坏且没有可用备份: ${primaryStateError.message || primaryStateError}`);
      }
      if (state) {
        const saved = state.saved;
        for (const extension of saved.extensions || []) {
          if (fs.existsSync(extension.path)) {
            try {
              const refreshed = await this.readExtension(extension.path, Boolean(extension.builtIn));
              refreshed.addedAt = extension.addedAt || refreshed.addedAt;
              this.extensions.set(refreshed.id, refreshed);
            } catch (_) {
              this.extensions.set(extension.id, extension);
            }
          }
        }
        for (const [profileId, ids] of Object.entries(saved.assignments || {})) this.assignments.set(profileId, new Set(ids));
        // Profiles (incl. cookies / proxy auth / platform secrets) live in main-process state,
        // not renderer localStorage, so XSS cannot dump them from the UI store.
        if (Array.isArray(saved.profiles)) {
          for (const raw of saved.profiles.slice(0, 1000)) {
            try {
              const profile = this.sanitizeProfile(raw);
              this.profiles.set(profile.id, profile);
            } catch (_) {}
          }
        }
        if (typeof saved.preferIndependentKernel === 'boolean') this.preferIndependentKernel = saved.preferIndependentKernel;
        if (saved.kernelPolicyVersion !== KERNEL_POLICY_VERSION) {
          // Prior releases could select a system browser implicitly. Migrate to
          // the explicit-selection policy and keep fallback disabled by default.
          this.allowSystemBrowserFallback = false;
          this.systemBrowserPath = null;
          migrateKernelPolicy = true;
        } else if (typeof saved.allowSystemBrowserFallback === 'boolean') {
          this.allowSystemBrowserFallback = saved.allowSystemBrowserFallback;
          if (typeof saved.systemBrowserPath === 'string') this.systemBrowserPath = saved.systemBrowserPath;
        }
      }
    }
    if (bundledExtensionPath && fs.existsSync(path.join(bundledExtensionPath, 'manifest.json'))) {
      const builtIn = await this.readExtension(bundledExtensionPath, true);
      const obsoleteBuiltInIds = [...this.extensions.values()]
        .filter((extension) => extension.builtIn && path.basename(extension.path) === 'bundled-extension' && extension.id !== builtIn.id)
        .map((extension) => extension.id);

      if (obsoleteBuiltInIds.length) {
        for (const assigned of this.assignments.values()) {
          const hadOldMarker = obsoleteBuiltInIds.some((id) => assigned.has(id));
          for (const id of obsoleteBuiltInIds) assigned.delete(id);
          if (hadOldMarker) assigned.add(builtIn.id);
        }
        for (const id of obsoleteBuiltInIds) this.extensions.delete(id);
      }
      this.extensions.set(builtIn.id, builtIn);
      await this.persist();
    }
    if (migrateKernelPolicy || recoveredState) await this.persist();
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
    return this._persistQueue || Promise.resolve();
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

  browserSelection() {
    const list = this.candidates();
    const independent = list.find((item) => item.independent);
    if (this.allowSystemBrowserFallback && this.systemBrowserPath) {
      const manual = list.find((item) => !item.independent && item.path === this.systemBrowserPath);
      if (manual) return { mode: 'system-manual', browser: manual };
    }
    if (this.preferIndependentKernel) {
      if (independent) return { mode: 'independent', browser: independent };
      return { mode: 'blocked', browser: null, message: '未找到内置独立浏览器内核。请确认安装包包含 kernels/，或在「本地设置」选择自定义内核。' };
    }
    const browser = independent || list[0];
    if (!browser) return { mode: 'blocked', browser: null, message: '未找到可用浏览器内核' };
    if (!browser.independent && (!this.allowSystemBrowserFallback || browser.path !== this.systemBrowserPath)) {
      return { mode: 'blocked', browser: null, message: '未找到内置独立浏览器内核。请确认安装包包含 kernels/，或在「本地设置」选择自定义内核。' };
    }
    return { mode: browser.independent ? 'independent' : 'system-manual', browser };
  }

  chooseBrowser() {
    const selection = this.browserSelection();
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

  async applyRuntimeSettings(port, profile, fingerprint = null, options = {}) {
    const phase = String(options.phase || 'applyRuntimeSettings');
    const tabs = await cdp.tabs(port);
    const network = this.networkInfo.get(profile.id) || {};
    // merge IP-detected geo/tz into profile for fingerprint apply
    const enriched = {
      ...profile,
      exitTimezone: profile.exitTimezone || network.timezone || '',
      exitLatitude: profile.exitLatitude ?? network.latitude,
      exitLongitude: profile.exitLongitude ?? network.longitude,
    };
    const fp = fingerprint || buildFingerprint(enriched);
    const fpHash = fingerprintConfigHash(fp);
    // Track which CDP page targets already received inject (new tabs must not skip FP)
    const applied = options.appliedTargetIds instanceof Set ? options.appliedTargetIds : new Set();
    // Only a recorded hash may invalidate the cache: callers that never tracked one keep the
    // previous behaviour, while a real config change forces every live tab to be re-applied.
    const configChanged = Boolean(options.appliedFingerprintHash)
      && options.appliedFingerprintHash !== fpHash;
    if (configChanged) applied.clear();
    const blocked = [];
    if (profile.advanced.blockVideo) blocked.push('*.mp4', '*.webm', '*.m3u8', '*.mov', '*.avi');
    const customBlock = String(profile.advanced.blockUrls || '')
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 200);
    for (const u of customBlock) if (!blocked.includes(u)) blocked.push(u);
    // Port scan protection: block common localhost probe ports unless allow-listed
    // Speech voices: fingerprint injection (speech.mode blocked/noise/real)
    let portScanScript = null;
    if (profile.privacy.portScanProtect) {
      portScanScript = buildPortScanProtectionScript(profile.privacy.portScanAllow);
    }

    // Re-injecting a document that already carries this exact config stacks a second layer of
    // noise on the readers, which moves canvas / clientRects while the profile is already in use,
    // so a pass only covers tabs that are unmarked or that carry a different config. Recovery of
    // a single suspect tab goes through applyFingerprintToTab directly instead.
    const force = configChanged;
    // Steady state: the watch loop calls this every ~2.4s per running profile. When every
    // live tab already carries the inject there is nothing to do, and logging begin/skip/end
    // each time would burn disk and append tab URLs to the diagnostic log forever.
    // Prune closed targets, keep the tracked state fresh, and return quietly.
    if (!force && tabs.every((tab) => applied.has(tab.id))) {
      const liveIds = new Set(tabs.map((tab) => tab.id));
      for (const id of [...applied]) {
        if (!liveIds.has(id)) applied.delete(id);
      }
      if (options.trackOn) {
        options.trackOn.fpAppliedTargets = applied;
        options.trackOn.fpAppliedHash = fpHash;
        options.trackOn.fingerprint = fp;
      }
      return fp;
    }

    await fpLog('inject.begin', {
      phase,
      profileId: profile.id,
      port,
      tabCount: tabs.length,
      tabUrls: tabs.map((t) => ({ id: t.id, url: String(t.url || '').slice(0, 200) })),
      intended: summarizeFp(fp),
      logFile: fingerprintLogPath(),
    });

    for (const tab of tabs) {
      if (!force && applied.has(tab.id)) {
        await fpLog('inject.skip-tab', { phase, profileId: profile.id, tabId: tab.id, url: tab.url, reason: 'already-applied' });
        continue;
      }
      try {
        const fontBlobBridge = fp?.fontBlobBridge || options?.trackOn?.fontBlobBridge || options?.trackOn?.fingerprint?.fontBlobBridge;
        if (fontBlobBridge?.channelName && tab.webSocketDebuggerUrl) {
          if (options?.trackOn) { options.trackOn.fontBlobBridge = fontBlobBridge; options.trackOn.fingerprint = fp; }
          try {
            await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.enable', {}).catch(() => {});
            await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.addBinding', { name: fontBlobBridge.channelName }).catch((err) => {
              const msg = String(err?.message || err);
              if (!/already exists/i.test(msg)) {}
            });
          } catch (_) {}
        }
        await applyFingerprintToTab(cdp.call, tab.webSocketDebuggerUrl, fp, enriched, {
          livePatchDocument: isEphemeralDocumentUrl(tab.url),
        });
        let live = null;
        try {
          const probe = await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: LIVE_PROBE_EXPRESSION,
            returnByValue: true,
          }, 8000);
          live = probe?.result?.value || probe?.value || null;
        } catch (probeError) {
          live = { probeError: String(probeError.message || probeError) };
        }
        const mismatch = live && !live.probeError ? {
          ua: Boolean(fp.userAgent && live.userAgent && fp.userAgent !== live.userAgent),
          platform: Boolean(fp.platform && live.platform && fp.platform !== live.platform),
          cores: fp.hardwareConcurrency != null && live.hardwareConcurrency != null
            && Number(fp.hardwareConcurrency) !== Number(live.hardwareConcurrency),
          memory: fp.deviceMemory != null && live.deviceMemory != null
            && Number(fp.deviceMemory) !== Number(live.deviceMemory),
          webglRenderer: Boolean(fp.webgl?.renderer && live.webglRenderer
            && String(live.webglRenderer) !== String(fp.webgl.renderer)
            && !String(live.webglRenderer).includes(String(fp.webgl.renderer).slice(0, 24))),
        } : null;
        await fpLog('inject.tab-ok', {
          phase,
          profileId: profile.id,
          tabId: tab.id,
          url: sanitizeUrlForLog(tab.url).slice(0, 240),
          intended: summarizeFp(fp),
          live,
          mismatch,
        });
        // If probe still shows host hardware, re-evaluate inject once more immediately.
        if (mismatch && (mismatch.cores || mismatch.webglRenderer || mismatch.memory)) {
          await fpLog('inject.tab-ineffective', {
            phase,
            profileId: profile.id,
            tabId: tab.id,
            mismatch,
          });
          try {
            await applyFingerprintToTab(cdp.call, tab.webSocketDebuggerUrl, fp, enriched, {
              force: true,
              livePatchDocument: isEphemeralDocumentUrl(tab.url),
            });
            const probe2 = await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
              expression: LIVE_PROBE_EXPRESSION,
              returnByValue: true,
            }, 8000);
            const live2 = probe2?.result?.value || probe2?.value || null;
            await fpLog('inject.tab-retry', {
              phase,
              profileId: profile.id,
              tabId: tab.id,
              live: live2,
            });
            const coresOk = !(fp.hardwareConcurrency != null && live2?.hardwareConcurrency != null
              && Number(fp.hardwareConcurrency) !== Number(live2.hardwareConcurrency));
            const webglOk = !(fp.webgl?.renderer && live2?.webglRenderer
              && String(live2.webglRenderer) !== String(fp.webgl.renderer)
              && /Radeon|GeForce|W6800|GTX |RTX /i.test(String(live2.webglRenderer)));
            if (coresOk && webglOk) applied.add(tab.id);
            // else leave unmarked so force/post-startpage can try again
          } catch (retryError) {
            await fpLog('inject.tab-retry-fail', {
              phase,
              profileId: profile.id,
              tabId: tab.id,
              error: String(retryError.message || retryError),
            });
          }
        } else {
          applied.add(tab.id);
        }
      } catch (error) {
        await fpLog('inject.tab-fail', {
          phase,
          profileId: profile.id,
          tabId: tab.id,
          url: sanitizeUrlForLog(tab.url).slice(0, 240),
          error: String(error.message || error),
        });
        // Soft-fail per tab: keep trying other tabs / later phases instead of aborting start.
        const msg = String(error.message || error || '');
        if (!/Uncaught|already in effect|cannot be overridden|softInject/i.test(msg)) {
          throw error;
        }
      }
      if (blocked.length) {
        await cdp.call(tab.webSocketDebuggerUrl, 'Network.enable');
        await cdp.call(tab.webSocketDebuggerUrl, 'Network.setBlockedURLs', { urls: blocked });
      }
      if (portScanScript) {
        await cdp.call(tab.webSocketDebuggerUrl, 'Page.addScriptToEvaluateOnNewDocument', { source: portScanScript });
        await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: portScanScript });
      }
      // applied.add only when probe matched (see above)
    }
    // Drop closed targets so Set does not grow forever
    const liveIds = new Set(tabs.map((t) => t.id));
    for (const id of [...applied]) {
      if (!liveIds.has(id)) applied.delete(id);
    }
    if (options.trackOn) {
      options.trackOn.fpAppliedTargets = applied;
      options.trackOn.fpAppliedHash = fpHash;
      options.trackOn.fingerprint = fp;
    }
    await fpLog('inject.end', { phase, profileId: profile.id, applied: applied.size, port });
    return fp;
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

  async suppressStartupExtensionPages(connection, installed, durationMs = 7000) {
    const popupPaths = new Map();
    for (const extension of installed || []) {
      const chromeId = String(extension.chromeExtensionId || '').toLowerCase();
      if (!chromeId) continue;
      let popup = '';
      try {
        const manifest = JSON.parse(await fsp.readFile(path.join(extension.path, 'manifest.json'), 'utf8'));
        popup = String(manifest.action?.default_popup || manifest.browser_action?.default_popup || '').replace(/^\/+/, '').toLowerCase();
      } catch (_) {}
      popupPaths.set(chromeId, popup);
    }
    if (!popupPaths.size) return { closed: 0 };

    const blockedOpeners = new Set(); const closedTargets = new Set(); const started = Date.now();
    while (Date.now() - started < durationMs) {
      let values;
      try { values = (await connection.command('Target.getTargets', {}, 3000)).targetInfos || []; }
      catch (_) { break; }

      for (const target of values) {
        if (target.type !== 'page' || closedTargets.has(target.targetId)) continue;
        let shouldClose = blockedOpeners.has(String(target.openerId || ''));
        if (!shouldClose) {
          try {
            const url = new URL(String(target.url || ''));
            if (url.protocol === 'chrome-extension:' || url.protocol === 'edge-extension:') {
              const popup = popupPaths.get(url.hostname.toLowerCase());
              if (popup !== undefined) {
                const currentPath = decodeURIComponent(url.pathname).replace(/^\/+/, '').toLowerCase();
                const isToolbarPopup = Boolean(popup) && currentPath === popup;
                shouldClose = !isToolbarPopup;
              }
            }
          } catch (_) {}
        }
        if (!shouldClose) continue;
        blockedOpeners.add(target.targetId); closedTargets.add(target.targetId);
        await connection.command('Target.closeTarget', { targetId: target.targetId }, 3000).catch(() => {});
      }
      await new Promise((resolve) => { const timer = setTimeout(resolve, 120); timer.unref?.(); });
    }
    if (closedTargets.size) this.emit({ type: 'startup-extension-pages-suppressed', count: closedTargets.size });
    return { closed: closedTargets.size };
  }
  isStartPageUrl(url) {
    if (this.startPageServer?.isStartPageUrl?.(url)) return true;
    const s = String(url || '').toLowerCase();
    // 仅识别 OpenBrowser 原生启动页端口 / 本地文件回退，不绑定其它软件端口
    return s.includes('openbrowser-start.html')
      || s.includes('openbrowser-start')
      || s.includes('openbrowser-native')
      || /https?:\/\/127\.0\.0\.1:5032[6-9]\/?/.test(s);
  }

  envWindowTitle(profile) {
    const number = profile.number || profile.name || profile.id || '';
    const title = profile.title && String(profile.title).trim() && String(profile.title) !== String(number)
      ? String(profile.title).trim()
      : '';
    return title ? `环境 ${number} · ${title}` : `环境 ${number}`;
  }

  needsExitNetworkForLocale(profile) {
    const privacy = profile.privacy || {};
    const langMode = privacy.languageMode || (privacy.langFromIp !== false ? 'ip' : '');
    const tzMode = privacy.timezoneMode || 'ip';
    const geoMode = privacy.geoMode || 'ip';
    return langMode === 'ip' || tzMode === 'ip' || geoMode === 'ip' || geoMode === 'allow';
  }

  async ensureExitNetworkForLocale(profile) {
    if (!this.needsExitNetworkForLocale(profile)) return null;
    let network = this.networkInfo.get(profile.id);
    if (network?.countryCode || network?.ip) return network;
    const proxyRaw = String(profile.proxy || '');
    const isDirect = profile.networkMode === 'direct' || !proxyRaw || /^(direct|offline|none)$/i.test(proxyRaw);
    try {
      if (!isDirect) {
        network = await this.checkProxy(profile, { allowExtract: false });
      } else {
        // Local direct exit: geo lookup is best-effort for language/timezone only.
        network = await lookupDirectCountry();
        this.networkInfo.set(profile.id, network);
        this.emit({ type: 'status', id: profile.id, running: this.running.has(profile.id), network });
      }
      if (network) {
        profile.exitIp = network.ip || profile.exitIp;
        profile.exitCountryCode = network.countryCode || profile.exitCountryCode;
        profile.exitTimezone = network.timezone || profile.exitTimezone;
        profile.exitLatitude = network.latitude ?? profile.exitLatitude;
        profile.exitLongitude = network.longitude ?? profile.exitLongitude;
        profile.exitCheckedAt = network.checkedAt || profile.exitCheckedAt;
        profile.exitLatencyMs = network.latencyMs ?? profile.exitLatencyMs;
        profile.exitNetworkType = network.networkType || profile.exitNetworkType;
        this.profiles.set(profile.id, this.sanitizeProfile(profile));
        await this.persist();
      }
      return network;
    } catch (error) {
      // Direct start succeeded without proxy; geo API failure must not surface as proxy error.
      if (!isDirect) {
        this.emit({ type: 'proxy-error', id: profile.id, message: '出口信息检测失败（语言/时区可能回退）：' + error.message });
      }
      return this.networkInfo.get(profile.id) || null;
    }
  }

  applyResolvedLocale(profile) {
    const network = this.networkInfo.get(profile.id) || {
      countryCode: profile.exitCountryCode,
      timezone: profile.exitTimezone,
      latitude: profile.exitLatitude,
      longitude: profile.exitLongitude,
      ip: profile.exitIp,
    };
    const privacy = { ...(profile.privacy || {}) };
    const language = resolveProfileLanguage(profile, network);
    const resolvedTimezone = resolveProfileTimezone(profile, network);
    const tzMode = String(privacy.timezoneMode || 'ip').trim().toLowerCase();
    const next = {
      ...profile,
      language,
      privacy: {
        ...privacy,
        languageMode: privacy.languageMode || (privacy.langFromIp !== false ? 'ip' : (privacy.uiLanguage || 'profile')),
        langFromIp: (privacy.languageMode || 'ip') === 'ip' || privacy.langFromIp !== false,
      },
      exitIp: network.ip || profile.exitIp || '',
      exitCountryCode: network.countryCode || profile.exitCountryCode || '',
      exitTimezone: tzMode === 'real' ? '' : (resolvedTimezone || network.timezone || profile.exitTimezone || ''),
      exitLatitude: network.latitude ?? profile.exitLatitude,
      exitLongitude: network.longitude ?? profile.exitLongitude,
    };
    if ((tzMode === 'ip' || tzMode === 'custom') && resolvedTimezone) {
      next.privacy = { ...next.privacy, timezone: resolvedTimezone };
    }
    if ((privacy.geoMode === 'ip' || privacy.geoMode === 'allow' || !privacy.geoMode)
      && Number.isFinite(Number(network.latitude))
      && Number.isFinite(Number(network.longitude))) {
      next.exitLatitude = Number(network.latitude);
      next.exitLongitude = Number(network.longitude);
    }
    return next;
  }

  async applyEnvWindowTitle(port, profile) {
    if (!port) return;
    const title = this.envWindowTitle(profile);
    const tabs = await cdp.tabs(port).catch(() => []);
    for (const tab of tabs) {
      if (!tab.webSocketDebuggerUrl) continue;
      const url = String(tab.url || '');
      // Only apply to our own internal start page; never overwrite user pages or about:blank document.title
      if (!this.isStartPageUrl(url)) continue;
      await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
        expression: `(() => { try { document.title = ${JSON.stringify(title)}; } catch (_) {} })()`,
      }).catch(() => {});
    }
  }

  async keepDefaultTab(port, startUrl) {
    const values = await cdp.tabs(port); if (!values.length) return;
    const expected = String(startUrl || '').trim();
    let keep = values.find((tab) => this.isStartPageUrl(tab.url)) || values[0];
    const preferredId = keep?.id;
    // Always force-navigate to OpenBrowser start page when provided (148 kernel may open NTP/about:blank).
    if (expected && keep?.webSocketDebuggerUrl) {
      try {
        await cdp.call(keep.webSocketDebuggerUrl, 'Page.enable', {}).catch(() => {});
        const href = String(keep.url || '');
        // about:blank launch or wrong page → navigate; already on start page → reload so
        // document-start fingerprint scripts registered after first paint still run.
        if (this.isStartPageUrl(href) && href.includes(expected.split('?')[0])) {
          await cdp.call(keep.webSocketDebuggerUrl, 'Page.reload', { ignoreCache: true }).catch(async () => {
            await cdp.call(keep.webSocketDebuggerUrl, 'Page.navigate', { url: expected });
          });
        } else {
          await cdp.call(keep.webSocketDebuggerUrl, 'Page.navigate', { url: expected });
        }
        await new Promise((resolve) => { const t = setTimeout(resolve, 400); t.unref?.(); });
      } catch (_) {
        try { await cdp.call(keep.webSocketDebuggerUrl, 'Page.navigate', { url: expected }); } catch (__) {}
      }
    }
    const after = await cdp.tabs(port).catch(() => values);
    // Prefer: current start-page URL → same target we navigated → first tab.
    keep = after.find((tab) => this.isStartPageUrl(tab.url))
      || after.find((tab) => preferredId && tab.id === preferredId)
      || after[0]
      || keep;
    for (const tab of after) if (tab.id !== keep.id) await cdp.closeTab(port, tab.id).catch(() => {});
    await cdp.activateTab(port, keep.id).catch(() => {});
  }

  /**
   * OpenBrowser 原生启动页 URL：http://127.0.0.1:50326/?pid=...&id=...&name=...
   * 会话与网络信息由本引擎写入启动页服务，不依赖其它指纹浏览器。
   */
  async buildStartPageUrl(profile, root, browserName, extensionCount) {
    let pageNetwork = this.networkInfo.get(profile.id) || null;
    // 启动前尽量补全出口信息，启动页打开即可显示 IP（直连/代理同理）
    const hasProxy = profile.proxy && !/^(direct|offline|none)$/i.test(String(profile.proxy));
    if (!pageNetwork?.ip) {
      try {
        if (hasProxy) {
          pageNetwork = await this.checkProxy(profile);
        } else {
          pageNetwork = await lookupDirectCountry();
          if (pageNetwork) {
            pageNetwork = { ...pageNetwork, protocol: 'direct' };
            this.networkInfo.set(profile.id, pageNetwork);
          }
        }
      } catch (_) {
        pageNetwork = this.networkInfo.get(profile.id) || null;
      }
    }
    const timezone = profile.exitTimezone
      || pageNetwork?.timezone
      || (profile.privacy?.timezoneMode === 'custom' ? profile.privacy.timezone : '')
      || '';
    const fpForStart = (() => {
      try {
        return buildFingerprint({
          ...profile,
          kernelVersion: this.kernelStatus()?.kernel?.version || profile.kernelVersion,
          exitTimezone: timezone,
          exitLatitude: pageNetwork?.latitude ?? profile.exitLatitude,
          exitLongitude: pageNetwork?.longitude ?? profile.exitLongitude,
        });
      } catch (_) {
        return null;
      }
    })();
    const uaFromFp = fpForStart?.userAgent || profile.userAgent || '';
    try {
      const server = await this.ensureStartPage();
      const url = server.registerSession({
        ...profile,
        exitTimezone: timezone,
        exitIp: pageNetwork?.ip || profile.exitIp || '',
        exitCountryCode: pageNetwork?.countryCode || profile.exitCountryCode || '',
        userAgent: profile.userAgent || uaFromFp,
        group_name: profile.group_name || profile.groupName || '',
        privacy: {
          ...(profile.privacy || {}),
          // Prefer resolved fingerprint surfaces for welcome-page expected checks
          fingerprint: {
            ...(profile.privacy?.fingerprint || {}),
            hardwareConcurrency: fpForStart?.hardwareConcurrency ?? profile.privacy?.fingerprint?.hardwareConcurrency,
            deviceMemory: fpForStart?.deviceMemory ?? profile.privacy?.fingerprint?.deviceMemory,
          },
        },
      }, {
        timezone,
        network: pageNetwork,
        userAgent: profile.userAgent || uaFromFp,
        group_name: profile.group_name || profile.groupName || '',
        browserName,
        extensionCount,
        time: Math.floor(Date.now() / 1000),
        expectedFingerprint: fpForStart ? {
          language: (fpForStart.languages && fpForStart.languages[0]) || profile.language || '',
          userAgent: fpForStart.userAgent || uaFromFp,
          platform: fpForStart.platform || '',
          timezone,
          screenWidth: fpForStart.screen?.width || Number(profile.width) || null,
          screenHeight: fpForStart.screen?.height || Number(profile.height) || null,
          webrtc: String(profile.privacy?.webrtc || ''),
          canvas: String(fpForStart.canvas?.mode || profile.privacy?.canvas || ''),
          webgl: String(fpForStart.webgl?.mode || profile.privacy?.webgl || ''),
          webglVendor: fpForStart.webgl?.vendor || '',
          webglRenderer: fpForStart.webgl?.renderer || '',
          audio: String(fpForStart.audio?.mode || profile.privacy?.audio || ''),
          hardwareConcurrency: fpForStart.hardwareConcurrency,
          deviceMemory: fpForStart.deviceMemory,
        } : undefined,
      });
      await fsp.writeFile(
        path.join(root, 'openbrowser-start.url.txt'),
        url + '\n# OpenBrowser 原生启动页（非其它软件）\n',
        'utf8'
      ).catch(() => {});
      return url;
    } catch (error) {
      // 最后回退：写本地 HTML，仍标 OpenBrowser 原生
      const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
      const number = escape(profile.number || profile.name || profile.id);
      const name = escape(profile.name || number);
      const ip = escape(pageNetwork?.ip || profile.exitIp || '未检测');
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="openbrowser-native" content="1"><title>环境 ${number}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#12141a;color:#e8eaf0;display:grid;place-items:center;min-height:100vh}
.card{width:min(720px,94vw);background:#1c1f28;border-radius:14px;overflow:hidden;border:1px solid #2a3040;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.brand{display:flex;align-items:center;gap:14px;padding:22px 22px 8px}
.badge{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-size:22px;font-weight:800;color:#fff;background:linear-gradient(145deg,#2563eb,#1d4ed8)}
.head{background:linear-gradient(90deg,#1e3a5f,#243b55);color:#fff;text-align:center;padding:28px 16px;font-size:28px;font-weight:600;letter-spacing:.02em}
.body{padding:18px 22px 24px;line-height:1.8}.k{color:#8b93a7;display:inline-block;width:88px;text-align:right;margin-right:12px}</style></head>
<body><div class="card">
<div class="brand"><div class="badge">${number}</div><div><div style="font-size:18px;font-weight:700">环境 ${number}</div><div style="color:#8b93a7;font-size:12px">OpenBrowser · 本地环境标识</div></div></div>
<div class="head">${ip}</div><div class="body">
<div><span class="k">环境</span>环境 ${number}</div>
<div><span class="k">窗口名称</span>${name}</div>
<div><span class="k">说明</span>启动页服务异常：${escape(error.message)}（仍为 OpenBrowser 本地页）</div>
</div></div></body></html>`;
      const file = path.join(root, 'openbrowser-start.html');
      await fsp.writeFile(file, html, 'utf8');
      return toFileUrl(file);
    }
  }

  assignedExtensions(profileId) {
    const ids = this.assignments.get(profileId) || new Set();
    return [...ids].map((id) => this.extensions.get(id)).filter((item) => item && fs.existsSync(item.path));
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
      return this._start(candidate, generation);
    })();
    task.lifecycleGeneration = generation;
    this.starting.set(id, task);
    try {
      return await task;
    } finally {
      if (this.starting.get(id) === task) this.starting.delete(id);
    }
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

  async resolveProfileProxyConfig(profile, { allowExtract = true } = {}) {
    const working = this.resolveStoredProxyProfile(this.sanitizeProfile(profile));
    let lastError = null;
    const candidates = [];
    const pushCandidate = (value, source) => {
      const raw = String(value || '').trim();
      if (!raw || /^(direct|offline|none)$/i.test(raw)) return;
      if (candidates.some((item) => item.raw === raw)) return;
      candidates.push({ raw, source });
    };
    pushCandidate(working.proxy, 'primary');
    for (const item of working.proxyMeta?.backupProxies || []) pushCandidate(item, 'backup');
    if (allowExtract) {
      const extractUrl = String(working.proxyMeta?.apiExtractUrl || '').trim();
      if (extractUrl) {
        try {
          const extracted = await extractProxyFromApi(extractUrl);
          const raw = extracted.raw || (
            extracted.protocol + '://'
            + (extracted.username ? (encodeURIComponent(extracted.username) + ':' + encodeURIComponent(extracted.password) + '@') : '')
            + extracted.host + ':' + extracted.port
          );
          pushCandidate(raw, 'api');
        } catch (error) {
          lastError = error;
        }
      }
    }
    if (!candidates.length) {
      if (lastError) throw lastError;
      throw new Error('Direct environments do not have a proxy exit to inspect');
    }
    const errors = [];
    for (const candidate of candidates) {
      try {
        const config = parseProxy(candidate.raw);
        if (!config) continue;
        return { profile: working, config, raw: candidate.raw, source: candidate.source };
      } catch (error) {
        errors.push(String(error.message || error));
      }
    }
    throw new Error(errors[0] || '代理配置无效');
  }

  applyNetworkToProfile(profile, network, { persist = false } = {}) {
    const patch = this.fingerprintPatchFromNetwork(network, profile);
    const next = this.sanitizeProfile({
      ...profile,
      ...patch,
      privacy: {
        ...(profile.privacy || {}),
        ...(patch.privacy || {}),
      },
    });
    this.profiles.set(next.id, next);
    this.networkInfo.set(next.id, network);
    if (persist) this.persist().catch(() => {});
    this.emit({ type: 'status', id: next.id, running: this.running.has(next.id), network, profile: next });
    return { profile: next, network, patch };
  }

  async testProxy(raw, options = {}) {
    this._proxyTests ||= new Map();
    const profile = this.sanitizeProfile(raw);
    const key = JSON.stringify([profile.id, profile.proxy, profile.proxyMeta, options]);
    if (this._proxyTests.has(key)) return this._proxyTests.get(key);
    const task = this._testProxy(raw, options);
    this._proxyTests.set(key, task);
    try { return await task; }
    finally { if (this._proxyTests.get(key) === task) this._proxyTests.delete(key); }
  }

  async _testProxy(raw, options = {}) {
    const profile = this.sanitizeProfile(raw);
    const forcedRaw = String(options.proxy || options.forcedProxy || '').trim();
    let resolved;
    if (forcedRaw && !/^(direct|offline|none)$/i.test(forcedRaw)) {
      const config = parseProxy(forcedRaw);
      if (!config) throw new Error('代理配置无效');
      resolved = { profile, config, raw: forcedRaw, source: options.proxySource || 'forced' };
    } else {
      resolved = await this.resolveProfileProxyConfig(profile, { allowExtract: options.allowExtract !== false });
    }
    try {
      const result = await lookupProxyCountry(resolved.config, {
        force: true,
        totalTimeoutMs: options.totalTimeoutMs || 6500,
        attemptTimeoutMs: options.attemptTimeoutMs || 2200,
        includeRisk: options.includeRisk === true,
        ipChannel: profile.proxyMeta?.ipChannel,
        // Cold cache + a rate-limited probe service: the profile's last known exit is a valid
        // degradation source, otherwise a 429 would look like a dead proxy.
        profile,
        exitIp: profile.exitIp,
        exitCountryCode: profile.exitCountryCode,
        exitTimezone: profile.exitTimezone,
      });
      return {
        ...result,
        protocol: resolved.config.protocol,
        endpoint: resolved.config.host + ':' + resolved.config.port,
        proxySource: resolved.source,
        proxyRaw: resolved.raw,
        errorClass: null,
      };
    } catch (error) {
      const err = new Error(error.message || String(error));
      err.code = error.code;
      err.probeUnavailable = error.probeUnavailable === true;
      err.errorClass = error.errorClass || classifyProxyError(error);
      err.latencyMs = error.latencyMs;
      throw err;
    }
  }

  async checkProxy(raw, options = {}) {
    const profile = this.restoreStoredProxyCredentials(
      this.resolveStoredProxyProfile(this.sanitizeProfile(raw)),
      raw,
    );
    const network = await this.testProxy(profile, options);
    const applied = this.applyNetworkToProfile(profile, network, { persist: false });
    // A successful manual check may be followed immediately by app shutdown. Do not
    // acknowledge it until the durable engine state contains the new exit details.
    if (options.persist) await this.persist();
    return {
      ...network,
      appliedFingerprint: applied.patch,
      profile: applied.profile,
    };
  }

  async refreshProfileProxy(raw) {
    const profile = this.restoreStoredProxyCredentials(
      this.resolveStoredProxyProfile(this.sanitizeProfile(raw)),
      raw,
    );
    const refreshUrl = String(profile.proxyMeta?.refreshUrl || '').trim();
    const extractUrl = String(profile.proxyMeta?.apiExtractUrl || '').trim();
    // refreshUrl and apiExtractUrl stay separate: refresh rotates; extract re-reads endpoint.
    if (!refreshUrl && !extractUrl) throw new Error('未配置刷新 URL 或提取 URL');
    const refresh = refreshUrl
      ? await invokeProxyRefresh(refreshUrl)
      : { ok: true, skipped: true, reason: 'no-refresh-url' };
    let nextProfile = profile;
    let extractError = null;
    if (extractUrl) {
      try {
        const extracted = await extractProxyFromApi(extractUrl);
        const rawProxy = extracted.raw || (
          extracted.protocol + '://'
          + (extracted.username ? (encodeURIComponent(extracted.username) + ':' + encodeURIComponent(extracted.password) + '@') : '')
          + extracted.host + ':' + extracted.port
        );
        nextProfile = this.sanitizeProfile({ ...profile, networkMode: 'proxy', proxy: rawProxy });
        this.profiles.set(nextProfile.id, nextProfile);
      } catch (error) {
        extractError = error;
        if (!profile.proxy || /^(direct|offline|none)$/i.test(String(profile.proxy))) {
          throw new Error('动态代理提取失败：' + (error.message || error));
        }
      }
    }
    const network = await this.checkProxy(nextProfile, { allowExtract: false, persist: true });
    return {
      refresh,
      network,
      profile: this.profiles.get(nextProfile.id),
      extractError: extractError ? String(extractError.message || extractError) : null,
    };
  }

  async prepareProfileProxyForStart(profile) {
    let working = this.resolveStoredProxyProfile(this.sanitizeProfile(profile));
    const meta = working.proxyMeta || {};
    if (working.networkMode === 'direct') return working;
    if (!working.proxy || /^(direct|offline|none)$/i.test(String(working.proxy))) {
      const backup = (meta.backupProxies || []).find((value) => value && !/^(direct|offline|none)$/i.test(String(value)));
      if (backup) working = this.sanitizeProfile({ ...working, proxy: backup, networkMode: 'proxy' });
    }
    if ((!working.proxy || /^(direct|offline|none)$/i.test(String(working.proxy))) && !meta.apiExtractUrl) {
      throw Object.assign(new Error('代理模式缺少有效节点，请配置代理或明确选择本地直连'), { code: 'proxy-required' });
    }
    const hasProxy = working.proxy && !/^(direct|offline|none)$/i.test(String(working.proxy));
    const extractUrl = String(meta.apiExtractUrl || '').trim();
    // Align with refreshProfileProxy: refresh first (rotate IP), then extract current endpoint.
    if (meta.refreshOnStart && String(meta.refreshUrl || '').trim()) {
      try {
        await invokeProxyRefresh(meta.refreshUrl);
      } catch (error) {
        this.emit({ type: 'proxy-error', id: working.id, message: '启动前刷新代理失败：' + (error.message || error) });
        throw new Error('启动前刷新代理失败：' + (error.message || error));
      }
    }
    if (extractUrl) {
      try {
        const extracted = await extractProxyFromApi(extractUrl);
        const rawProxy = extracted.raw || (
          extracted.protocol + '://'
          + (extracted.username ? (encodeURIComponent(extracted.username) + ':' + encodeURIComponent(extracted.password) + '@') : '')
          + extracted.host + ':' + extracted.port
        );
        working = this.sanitizeProfile({ ...working, networkMode: 'proxy', proxy: rawProxy });
      } catch (error) {
        if (!hasProxy) throw new Error('动态代理提取失败：' + (error.message || error));
        this.emit({
          type: 'proxy-warn',
          id: working.id,
          code: 'extract-error',
          message: '动态代理提取失败，继续使用静态代理：' + (error.message || error),
          extractError: String(error.message || error),
        });
      }
    }
    const shouldCheck = working.networkMode === 'proxy';
    if (shouldCheck && working.proxy && !/^(direct|offline|none)$/i.test(String(working.proxy))) {
      const candidates = [];
      const push = (value) => {
        const raw = String(value || '').trim();
        if (!raw || /^(direct|offline|none)$/i.test(raw)) return;
        if (!candidates.includes(raw)) candidates.push(raw);
      };
      push(working.proxy);
      for (const item of meta.backupProxies || []) push(item);
      let lastError = null;
      let ok = false;
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        try {
          const network = await this.testProxy(working, {
            allowExtract: false,
            proxy: candidate,
            proxySource: index === 0 ? 'primary' : 'backup',
          });
          working = this.sanitizeProfile({ ...working, networkMode: 'proxy', proxy: network.proxyRaw || candidate });
          this.applyNetworkToProfile(working, network, { persist: false });
          ok = true;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!ok && lastError) {
        // A rate-limited or unreachable exit-probe service is NOT a dead proxy. Treating a 429 as
        // "proxy not ready" would block startup on a healthy tunnel. But we may only continue when
        // the exit geography is still knowable: without it the timezone/language cannot be aligned
        // to the real exit, and starting anyway would leak the host timezone.
        const probeUnavailable = lastError.code === 'probe-unavailable'
          || lastError.errorClass === 'probe-unavailable'
          || lastError.probeUnavailable === true;
        if (probeUnavailable) {
          const hasExitGeo = Boolean(
            working.exitIp
            || working.exitCountryCode
            || working.exitTimezone
            || working.privacy?.timezone
            || this.networkInfo.get(working.id)?.ip
          );
          if (hasExitGeo && lastError.transportVerified === true) {
            this.emit({
              type: 'proxy-warn',
              id: working.id,
              code: 'probe-unavailable',
              message: '出口探测服务受限（限频或超时），代理链路未见异常，已复用环境既有出口信息继续启动',
            });
            return working;
          }
          const probeMsg = '出口探测服务暂时不可用（限频或超时），且该环境尚无可用出口信息。为避免时区/语言与真实出口不一致而暴露指纹，已停止启动。请稍后重试，或点击「测试」强制刷新出口探测。';
          this.emit({
            type: 'proxy-error',
            id: working.id,
            code: 'probe-unavailable',
            message: probeMsg,
            policy: 'block',
          });
          throw Object.assign(new Error(probeMsg), { code: 'probe-unavailable' });
        }
        const message = '代理连接失败，已停止启动：' + (lastError.message || lastError);
        this.emit({ type: 'proxy-error', id: working.id, code: 'proxy-not-ready', message, policy: 'block' });
        throw Object.assign(new Error(message), { code: 'proxy-not-ready', errorClass: lastError.errorClass });
      }
    }
    return working;
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

// The startup routine (_start) is a prototype mixin in engine/start.js;
// the public start() entry stays here and calls it through the prototype.
Object.assign(BrowserEngine.prototype, require('./engine/start'));

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

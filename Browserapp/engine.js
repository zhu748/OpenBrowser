const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const cdp = require('./cdp');
const { TaskScheduler } = require('./automation/task-scheduler');
const { recordProfileLifecycle, profileLifecycle, recordProfileLaunchWarning, profileLaunchStatus,
  beginProfileStop, observeProfileStop } = require('./engine/profile-lifecycle');
const { profileWriteGuard } = require('./engine/profile-write-guard');
const { allowGoogleLogin } = require('./automation/profile-defaults');
const { compareKernelVersions } = require('./automation/kernel-versions');
const { parseProxy, normalizeIpLookupChannel } = require('./network/proxy-config');
const { isNoCredentialProxy } = require('./shared/proxy-redact');
// Mirrors sanitizeProfile's guard (profile-sanitizer.js) so the direct field
// rewrite in resolveStoredProxyProfile cannot smuggle a longer raw through.
const MAX_PROFILE_PROXY_LENGTH = 64 * 1024;

/** Field-level resubstitution for sanitizeProfile outputs: clones the profile
 * once and applies the given top-level and proxyMeta patches. Never used on
 * unsanitized input — callers pass only engine-stored or sanitize outputs. */
function withAssociation(profile, proxyId, patch = {}) {
  const { proxyMeta: patchMeta, ...rest } = patch;
  return {
    ...profile,
    ...rest,
    proxyId,
    proxyMeta: { ...(profile.proxyMeta || {}), ...(patchMeta || {}), proxyId },
  };
}
const { applyLanguagePreferences, applyDoNotTrackPreference, verifyLanguagePreferences, syncProfileLocalState } = require('./automation/profile-file-consistency');
const { chromiumPreferencesPath, readChromiumLaunchPreferences, reportPreferencesReadError } = require('./engine/launch-preferences');
function loadPreferencesForUpdate(engine, root, id) {
  return readChromiumLaunchPreferences(root).catch((error) => {
    reportPreferencesReadError(engine, id, error);
    throw error;
  });
}
const { preserveLegacySession } = require('./engine/startup-session');
const { platformPreflight } = require('./automation/platform-preflight');
const { ensureStartPageServer } = require('./automation/start-page-server');
const { killProcessTree } = require('./automation/protocol/cross-platform');
const isolation = require('./automation/isolation');
const { lockPath, isProfileLockOwner, releaseProfileLock, isPidAlive, auditIsolation, isSystemBrowserExecutable, validateDataRootIsolationSecure, assertProfileId, assertSafeProfileChild } = isolation;
const { BrowserKernelManager } = require('./automation/browser-kernel');
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
  writeRawAtomically,
  sanitizeProfile: sanitizeProfileData,
} = require("./engine/index");
const { sanitizeInjectionScript, installCdpHardening } = require('./engine/cdp-hardening');









installCdpHardening(cdp);

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
  RequestHeaderRewriter,
  backgroundNetworkFlagsForProfile,
  evaluateFingerprintDelivery,
} = require('./automation/request-header-rewriter');

const { isValidIanaTimezone, extractTimezoneFromArgs } = require('./engine/launch-display');
const { TrackedProfileMap } = require('./engine/profile-revisions');
const { assertProfileDataRootSettled, assertProfileNotMaintained } = require('./engine/profile-maintenance');
const { assertProfileRestoreReady } = require('./automation/cloud/file-restore');

const BROWSER_START_CONCURRENCY = 4;

class BrowserEngine {
  constructor(app, options = {}) {
    this.app = app;
    // Host display scale provider (Windows). Defaulting the kernel UI scale to the real
    // display scale keeps browser chrome text/icons matching the rest of the OS on
    // high-DPI (125%/150%/200%) displays. Supplied by main.js; optional so tests and
    // non-Windows hosts keep the previous default of 1.
    this.getHostScaleFactor = typeof options.getHostScaleFactor === 'function' ? options.getHostScaleFactor : null;
    this.requestSystemNetwork = options.requestSystemNetwork;
    this.profiles = new TrackedProfileMap();
    this.running = new Map();
    // Per-profile lifecycle barriers. A browser must finish stopping (including
    // process-tree, proxy bridge, and profile-lock cleanup) before a new start
    // can acquire the same profile.
    this.starting = new Map();
    this.stopping = new Map();
    this.deletingProfiles = new Set();
    this.profileMaintenance = new Map();
    this.lifecycleGenerations = new Map(); // Active ownership, not queued start requests.
    this.lifecycleStopRequests = new Map();
    this.stopAllPromise = null;
    this.stopAllInProgress = false;
    this.shuttingDown = false;
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
    this.startPagePromise = null;
  }

  async ensureStartPage() {
    if (this.startPageServer?.server) {
      this.startPageServer.setEngine?.(this);
      return this.startPageServer;
    }
    // Share the in-flight start across concurrent callers (the module-level
    // singleton guard alone still leaves a window while `await start()` runs:
    // `server` is only assigned after the port is bound).
    if (!this.startPagePromise) {
      this.startPagePromise = ensureStartPageServer({ engine: this })
        .catch((error) => {
          this.startPagePromise = null;
          throw error;
        });
    }
    this.startPageServer = await this.startPagePromise;
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
    if (independent?.engine === 'firefox') {
      const chromium = this.kernelManager.resolveInstalled({ includeFirefoxPin: false });
      if (chromium && chromium.engine !== 'firefox') list.push(chromium);
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
    // All inputs to this method are sanitizeProfile outputs (or engine-stored
    // profiles which were sanitized on entry), so the association, length and
    // enum shape guarantees still hold. Resubstitution therefore rewrites the
    // affected fields directly instead of re-sanitizing the whole profile:
    // the sync path called this per profile, and the extra full sanitize was
    // the dominant cost of large-fleet syncs.
    const profile = incoming && typeof incoming === 'object' ? incoming : null;
    if (!profile) return profile;
    const direct = profile.networkMode === 'direct' || isNoCredentialProxy(profile.proxy);
    const association = profileProxyAssociation(profile);
    const proxyId = direct ? null : normalizedProxyAssociationId(association.value);
    if (!proxyId) {
      return withAssociation(profile, null);
    }
    if (!this.proxyStore) {
      return withAssociation(profile, proxyId);
    }
    const item = this.proxyStore.get?.(proxyId);
    if (!item?.raw) {
      // A deleted library entry must not leave a ghost association that later
      // overwrites Direct/manual proxy edits. Keep the last raw endpoint as a
      // manual proxy and remove every accepted association alias via sanitize.
      return withAssociation(profile, null);
    }
    // Store-sourced fields keep a minimal guard: raw is trimmed and length-
    // capped exactly like sanitizeProfile would (MAX_PROFILE_PROXY_LENGTH),
    // ipChannel is normalized through the same entry gate the store uses,
    // refreshUrl keeps the same 1000-char cap. The golden equivalence runs
    // (benchmark-profile-sync.js --compare) pin these outputs.
    const raw = String(item.raw).trim();
    if (raw.length > MAX_PROFILE_PROXY_LENGTH) {
      throw new Error('Proxy URL is too long');
    }
    return withAssociation(profile, item.id, {
      networkMode: 'proxy',
      proxy: raw,
      proxyMeta: {
        ...(profile.proxyMeta || {}),
        proxyId: item.id,
        ipChannel: normalizeIpLookupChannel(item.ipChannel || profile.proxyMeta?.ipChannel || 'ip-api'),
        refreshUrl: String(item.refreshUrl || profile.proxyMeta?.refreshUrl || '').slice(0, 1000),
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
      this.invalidateStatusCache?.();
      changed = true;
    }
    if (changed) await this.persist();
    return changed;
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

  async ensureKernelBootstrap({ forChromium = false } = {}) {
    const preferred = this.kernelStatus().kernel;
    const installed = (!forChromium && preferred) || this.candidates()
      .find(item => item.independent && (!forChromium || item.engine !== 'firefox'));
    // Per-version downloads are usable before they are made the global
    // default. Do not download Chrome again when either family is installed.
    if (installed) return installed;
    if (!this.kernelBootstrapPromise) {
      this.emit({ type: 'kernel-progress', phase: 'bootstrap', message: '正在检查独立浏览器内核，未安装时将下载 Chrome Stable…' });
      const download = forChromium && preferred?.engine === 'firefox'
        ? this.downloadChromeStable(false) : this.ensureIndependentKernel(false);
      this.kernelBootstrapPromise = download
        .catch((error) => {
          this.emit({ type: 'kernel-error', message: '独立内核准备失败：' + error.message });
          throw error;
        })
        .finally(() => { this.kernelBootstrapPromise = null; });
    }
    return this.kernelBootstrapPromise;
  }

  /**
   * Use an installed independent kernel, or download official Chrome Stable.
   * Legacy kernels remain discoverable for existing installations.
   */
  async ensureIndependentKernel(force = false) {
    const kernel = await this.kernelManager.ensureIntegrated(force);
    this.emit({ type: 'kernel-ready', kernel });
    return kernel;
  }

  async downloadChromeStable(force = false) {
    await this.kernelManager.loadMeta();
    const kernel = await this.kernelManager.downloadChromeStable(force);
    this.emit({ type: 'kernel-ready', kernel });
    return kernel;
  }

  async checkKernelUpdate() {
    return this.kernelManager.checkUpdate();
  }

  async kernelDelete(engineFamily, version) {
    const result = await this.kernelManager.deleteKernel({ engine: engineFamily, version });
    this.emit({ type: 'kernel-progress', phase: 'done', message: `已删除 ${result.name}` });
    return result;
  }

  async kernelCheck(engineFamily, version) {
    return this.kernelManager.checkKernel({ engine: engineFamily, version });
  }

  async kernelCancelDownload() {
    return this.kernelManager.cancelKernelDownload();
  }

  async setCustomKernel(binaryPath) {
    const kernel = await this.kernelManager.setCustomBinary(binaryPath);
    this.emit({ type: 'kernel-ready', kernel });
    return kernel;
  }

  async setKernelPolicy({ preferIndependentKernel, allowSystemBrowserFallback, systemBrowserPath, autoUpdateKernel } = {}) {
    if (typeof preferIndependentKernel === 'boolean') this.preferIndependentKernel = preferIndependentKernel;
    if (typeof allowSystemBrowserFallback === 'boolean') this.allowSystemBrowserFallback = allowSystemBrowserFallback;
    if (typeof autoUpdateKernel === 'boolean') await this.kernelManager.setAutoUpdateKernel(autoUpdateKernel);
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
      autoUpdateKernel: this.kernelManager.meta.autoUpdateKernel !== false,
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
    const lease = this.reserveProfileDataRootChange(value);
    try { return lease.publish(); }
    finally { lease.release(); }
  }

  reserveProfileDataRootChange(value) {
    assertProfileDataRootSettled(this);
    if (this.shuttingDown || this.stopAllInProgress) {
      throw Object.assign(new Error('Browser engine is stopping'), { code: 'ENGINE_SHUTTING_DOWN' });
    }
    const raw = String(value || '').trim();
    if (!raw) throw new Error('Environment data directory is required');
    if (this.running.size || this.starting.size || this.stopping.size || this.profileMaintenance?.size || this.deletingProfiles.size) {
      throw new Error('Stop all browser environments before changing the data directory');
    }
    const check = validateDataRootIsolationSecure(raw);
    if (!check.ok) throw new Error(check.message);
    const root = check.root;
    const token = Symbol('profile-data-root-change');
    this.profileDataRootChange = token;
    return {
      root,
      assertUsable: () => {
        const current = validateDataRootIsolationSecure(root);
        if (!current.ok) throw new Error(current.message);
        try {
          if (!fs.lstatSync(root).isDirectory()) throw new Error('Not a directory');
        } catch (cause) {
          throw Object.assign(new Error('环境数据目录不可用，设置未更改', { cause }), { code: cause.code || 'PROFILE_DATA_ROOT_UNAVAILABLE' });
        }
      },
      // The caller holds this lease through the file commit. Publishing
      // must be synchronous and infallible after the rename.
      publish: () => { this.profileDataRootPath = root; return root; },
      release: () => {
        if (this.profileDataRootChange === token) this.profileDataRootChange = null;
      },
    };
  }

  profileRoot(id) { return path.join(this.profileDataRootPath, assertProfileId(id)); }

  browserSelection(preferredEngine = null, preferredVersion = null) {
    const list = this.candidates();
    const wantEngine = preferredEngine === 'firefox' || preferredEngine === 'chromium' ? preferredEngine : null;
    const scoped = wantEngine ? list.filter((item) => (item.engine || 'chromium') === wantEngine) : list;
    const wantedVersion = String(preferredVersion || '').trim();
    if (wantedVersion && wantedVersion !== 'latest') {
      // A saved full version is exact. Older editor profiles stored a major
      // only; keep those working by choosing the newest installed patch in
      // that major, never a different major or a system-browser fallback.
      const matches = scoped.filter((item) => item.independent && (
        String(item.version) === wantedVersion
        || (/^\d+$/.test(wantedVersion) && String(item.version).split('.')[0] === wantedVersion)
      ));
      matches.sort((a, b) => compareKernelVersions(b.version, a.version));
      if (matches[0]) return { mode: 'independent', browser: matches[0] };
      return {
        mode: 'blocked', browser: null, code: 'KERNEL_VERSION_NOT_INSTALLED',
        message: `未安装所选的 ${wantEngine === 'firefox' ? 'Firefox' : 'Chrome'} ${wantedVersion} 内核。请在「内核管理」下载该版本，或在环境设置中选择已安装的版本。`,
      };
    }
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
          ? '未找到可用的 Firefox 内核。请在「内核管理」下载 Firefox。'
          : '未找到可用的 Chrome 内核。请在「内核管理」下载 Chrome 或选择自定义内核。',
      };
    }
    const browser = independent || scoped[0];
    if (!browser) return { mode: 'blocked', browser: null, message: '未找到可用浏览器内核' };
    if (!browser.independent && (!this.allowSystemBrowserFallback || browser.path !== this.systemBrowserPath)) {
      return { mode: 'blocked', browser: null, message: '未找到内置独立浏览器内核。请确认安装包包含 kernels/，或在「本地设置」选择自定义内核。' };
    }
    return { mode: browser.independent ? 'independent' : 'system-manual', browser };
  }

  chooseBrowser(profile = null, preferredEngine = null, lifecycleGeneration = null) {
    const engine = preferredEngine === 'firefox' || preferredEngine === 'chromium'
      ? preferredEngine
      : (profile ? this.profileEngine(profile) : null);
    const selection = this.browserSelection(engine, profile?.engineVersion);
    if (selection.browser) {
      if (isSystemBrowserExecutable(selection.browser.path) && !this.allowSystemBrowserFallback) {
        throw new Error('已阻止使用本机浏览器。请安装或选择独立 Chromium 内核。');
      }
      if (selection.mode === 'system-manual') {
        this.emit({ type: 'kernel-fallback', message: '用户已手动选择本机浏览器回退。', browser: selection.browser.path,
          ...(lifecycleGeneration != null ? { id: profile?.id, lifecycleGeneration } : {}) });
      }
      return selection.browser;
    }
    throw Object.assign(new Error(selection.message), selection.code ? { code: selection.code } : {});
  }

  proxyConfig(value) { return parseProxy(value); }

  /** Include running windows and starts that have acquired a launch slot. */
  proxyConcurrencyUsage(profile, { cappedOnly = false } = {}) {
    const association = profileProxyAssociation(profile);
    const proxyId = normalizedProxyAssociationId(association.value);
    if (!proxyId || !this.proxyStore) return null;
    let item = null;
    try { item = this.proxyStore.get?.(proxyId) || null; } catch (_) { return null; }
    const limit = Number.isInteger(item?.maxConcurrency) ? item.maxConcurrency : 0;
    if (!item || (cappedOnly && !limit)) return null;
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
    for (const [id, { proxyReservation }] of this.starting) consider(proxyReservation, id);
    return { item, limit, running };
  }

  /**
   * Per-proxy window cap (issue #25). Enforced before any data directory, profile lock, proxy
   * bridge or child process exists, so a blocked start leaves nothing behind to clean up.
   */
  assertProxyConcurrencyAvailable(profile) {
    const usage = this.proxyConcurrencyUsage(profile, { cappedOnly: true });
    if (!usage || !usage.limit) return;
    if (usage.running.length < usage.limit) return;
    const name = usage.item.name || `${usage.item.host}:${usage.item.port}`;
    const holders = usage.running.slice(0, 3).map((entry) => entry.label).join('、');
    const error = new Error(`代理「${name}」已达并发窗口上限（${usage.running.length}/${usage.limit}）。占用窗口：${holders}${usage.running.length > 3 ? ' 等' : ''}。请先关闭其中一个窗口，或调高该代理的并发上限。`);
    error.code = 'ERR_PROXY_MAX_CONCURRENCY';
    this.emit({ type: 'proxy-error', id: profile.id, code: 'proxy-max-concurrency', message: error.message, policy: 'block' });
    throw error;
  }

  async resetTabs(root) {
    const profile = path.join(root, 'Default');
    for (const name of ['Sessions', 'Current Session', 'Current Tabs', 'Last Session', 'Last Tabs']) {
      const target = await assertSafeProfileChild(root, path.join(profile, name));
      await fsp.rm(target, { recursive: true, force: true });
    }
  }

  async enforceDataRetention(root, profile, engine = 'chromium') {
    const { enforceDataRetentionFirefox, removeBrowserFiles } = require('./automation/browser-data');
    if (engine === 'firefox') return enforceDataRetentionFirefox(root, profile);
    const a = profile?.advanced || {};
    const targets = [];
    if (a.saveCookies === false) targets.push('Network/Cookies', 'Network/Cookies-journal', 'Cookies', 'Cookies-journal');
    if (a.savePasswords === false) targets.push('Login Data', 'Login Data-journal', 'Login Data For Account', 'Login Data For Account-journal');
    if (a.saveBookmarks === false) targets.push('Bookmarks', 'Bookmarks.bak');
    if (a.saveLocalStorage === false) targets.push('Local Storage');
    if (a.saveIndexedDB === false) targets.push('IndexedDB');
    if (a.saveHistory === false) targets.push('History', 'History-journal', 'History-wal', 'History-shm', 'Visited Links', 'Top Sites', 'Top Sites-journal');
    await removeBrowserFiles(root, targets.map((name) => path.join('Default', name)));
  }

  async applyProfilePreferences(root, profile, existing) {
    const prefs = existing ?? await loadPreferencesForUpdate(this, root, profile.id);
    // Reset zoom in this same read/modify/write. An earlier independent
    // reset could already have replaced the file when the main read fails.
    if (prefs.partition && typeof prefs.partition === 'object') prefs.partition.per_host_zoom_levels = {};
    if (prefs.browser && typeof prefs.browser === 'object' && 'default_zoom_level' in prefs.browser) prefs.browser.default_zoom_level = 0;
    // Native extension identity follows Chromium's manifest key/path rules.
    // Save pins before process launch so Chrome does not overwrite live prefs.
    prefs.extensions ||= {};
    let pinned = new Set(Array.isArray(prefs.extensions.pinned_extensions) ? prefs.extensions.pinned_extensions : []);
    for (const id of this.assignments.get(profile.id) || []) {
      const extension = this.extensions.get(id);
      if (!extension || !['pin', 'unpin'].includes(extension.fixedPlugin)) continue;
      // Pinning is best-effort: an extension directory that was deleted or
      // corrupted outside the app (antivirus quarantine, half-finished store
      // update) must not abort the whole profile launch — it used to bubble a
      // bare ENOENT out of prepareProfileFilesForStart with no hint which
      // extension was at fault. Skip it and surface a warning instead,
      // matching the per-extension isolation used by reloadAllExtensions.
      try {
        const manifest = JSON.parse(await fsp.readFile(path.join(extension.path, 'manifest.json'), 'utf8'));
        const runtimeId = manifest.key
          ? require('./automation/crx-reader').extensionIdFromPublicKey(Buffer.from(manifest.key, 'base64'))
          : require('./automation/extension-identity').extensionIdFromPath(extension.path);
        if (extension.fixedPlugin === 'pin') pinned.add(runtimeId); else pinned.delete(runtimeId);
      } catch (error) {
        this.emit({ type: 'extension-error', id, code: 'manifest-unreadable', message: `扩展 ${extension.name || id} 无法读取，已跳过置顶设置：${error.message}` });
      }
    }
    prefs.extensions.pinned_extensions = [...pinned];
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
    prefs.signin ||= {}; prefs.signin.allowed = allowGoogleLogin(profile);
    applyLanguagePreferences(prefs, profile);
    const expectedDnt = applyDoNotTrackPreference(prefs, profile);
    prefs.webkit ||= {}; prefs.webkit.webprefs ||= {};
    if (profile.privacy.fontMode === 'custom') prefs.webkit.webprefs.default_font_size = profile.privacy.fontSize;
    else delete prefs.webkit.webprefs.default_font_size;
    prefs.bookmark_bar ||= {};
    prefs.bookmark_bar.show_on_all_tabs = Boolean(profile.advanced.showBookmarkBar);
    // Native auto-restore can execute pages before the injection barrier.
    prefs.session ||= {};
    prefs.session.restore_on_startup = 5;
    await writeRawAtomically(await chromiumPreferencesPath(root), JSON.stringify(prefs), 0o600);
    try {
      const persisted = await readChromiumLaunchPreferences(root, { allowMissing: false });
      const issues = verifyLanguagePreferences(persisted, profile);
      const dntMismatch = persisted.enable_do_not_track !== expectedDnt;
      if (dntMismatch) issues.push({ key: 'enable_do_not_track', expected: expectedDnt ?? null, actual: persisted.enable_do_not_track ?? null });
      if (issues.length && typeof this.emit === 'function') {
        this.emit({ type: 'profile-file-sync-error', id: profile.id, key: dntMismatch ? 'preferences' : 'language', issues });
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
   * Pre-spawn profile file prep, parallelized. Zoom and managed settings share
   * one read-modify-write of Default/Preferences. Everything else
   * only rm's disjoint paths (Sessions / cache dirs / retained data files) and can overlap,
   * shortening the launch critical path (scales with disk latency and profile size).
   */
  async prepareProfileFilesForStart(root, profile, restoreSession) {
    // Under the launch lock, validate the primary before clearing tabs, cache
    // or other retained data. An unreadable profile must be safe to retry.
    const prefs = await loadPreferencesForUpdate(this, root, profile.id);
    await removeSingletonFiles(root, { attempts: 6, delayMs: 40 });
    // The startup pipeline owns the application lock. Stale-lock recovery is
    // exclusively an acquisition concern, not part of profile-file preparation.
    const jobs = [
      this.applyProfilePreferences(root, profile, prefs),
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
    jobs.push((async () => {
      // Chromium may restore saved tabs even when launched with about:blank.
      // Preserve the original files before removing them from the native path.
      if (restoreSession) await preserveLegacySession(root, 'chromium');
      await this.resetTabs(root);
    })());
    if (profile.advanced.clearCacheOnStart) jobs.push(this.clearProfileCache(root));
    // Keep the startup lock until every file writer has settled, including
    // when archiving or one of the independent preparation steps fails.
    const results = await Promise.allSettled(jobs);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
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
    // Startup-URL 防注入（见 P2 系列）：这些行会原样进入两个内核的 CLI 位置参数
    // （start.js:582 / start-firefox.js extraStartUrls），与 customArgs 同属
    // 命令行注入面 —— 但 customArgs 在 profile-sanitizer 有白名单正则，
    // 这里此前完全没有校验。导入/云端恢复的 profile 会在无人交互时重放该字段。
    const lines = String(profile.advanced?.startUrls || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((line) => {
        // 硬拒绝 '-'/'--' 开头：浏览器把它们当开关解析（flag 注入第二通道）。
        if (line.startsWith('-')) {
          console.warn(`[BrowserEngine] 拒绝可疑启动参数（'-' 前缀，不作为 URL 传递）: ${line.slice(0, 120)}`);
          return false;
        }
        // 带 scheme 的行只允许安全导航目标；注意 chrome:// 等内核 scheme
        // 仍需显式列入才可用（默认排除，最小攻击面）。
        const schemeMatch = line.match(/^([a-z][a-z0-9+.-]*):/i);
        if (schemeMatch) {
          const scheme = schemeMatch[1].toLowerCase();
          const allowed = ['http', 'https', 'file', 'about'];
          if (!allowed.includes(scheme)) {
            console.warn(`[BrowserEngine] 拒绝非白名单 scheme 的启动 URL（仅 ${allowed.join('/')}）: ${line.slice(0, 120)}`);
            return false;
          }
        }
        // 无 scheme 的行（example.com）保持放行：浏览器按搜索查询处理，保留 UX。
        return true;
      });
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
    // Write failures stay swallowed (existing semantics): a Preferences write
    // that cannot complete must not abort the surrounding cleanup commit.
    try {
      const prefs = JSON.parse(await fsp.readFile(file, 'utf8')); prefs.profile ||= {};
      prefs.profile.exit_type = 'Normal'; prefs.profile.exited_cleanly = true;
      await writeRawAtomically(file, JSON.stringify(prefs), 0o600);
    } catch {
      return;
    }
    // 写后回读校验单独执行：rename 原子性只保证"旧或新"，写设备异常时也可能整档丢失；
    // 校验失败必须上报（不吞），让调用方/lifecycle-cleanup 记录到 sync-error，而非留下
    // 可能被 Chromium 视为崩溃现场的 Preferences。所有既有调用方均已 .catch(() => {})
    // 兜底，这里上抛不会打断清理流程，只会把异常传递给记录侧。
    try {
      const persisted = JSON.parse(await fsp.readFile(file, 'utf8'));
      if (persisted?.profile?.exit_type !== 'Normal' || persisted?.profile?.exited_cleanly !== true) {
        throw new Error('clean-exit 标记写入后回读不一致');
      }
    } catch (verifyError) {
      console.error('[BrowserEngine] clean-exit 标记回读校验失败:', verifyError?.message || verifyError);
      throw verifyError instanceof Error ? verifyError : new Error(String(verifyError));
    }
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
    const ownsSharedResources = () => isProfileLockOwner(resources.root, resources.profileLock);
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
      await resources.firefoxImageFilter?.close();
      if (ownsSharedResources()) await stopIpcStubForWindow(resources.kernelWindowName).catch(() => {});
      if (child && !exited) {
        // Startup owns the same profile lock safety rule as running cleanup: a
        // process that may still be alive must keep the lock as a tombstone.
        return { exited: false, lockReleased: false, cleanupBlocked: true };
      }
      // root is recorded before acquireProfileLock(). A rejected acquisition
      // must not drain the browser that already owns that directory.
      if (resources.root && ownsSharedResources()) {
        const helperDrain = await this.drainProfileHelpers(resources.root);
        if (!helperDrain.known || helperDrain.pids.length) {
          return {
            exited: false,
            lockReleased: false,
            cleanupBlocked: true,
            helperPids: helperDrain.pids,
          };
        }
        if (ownsSharedResources()) await removeSingletonFiles(resources.root, { attempts: 6, delayMs: 40 });
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

  async waitForPort(root, timeout = 30000, child = null, signal) {
    const file = path.join(root, 'DevToolsActivePort');
    const deadline = performance.now() + timeout;
    const controller = new AbortController();
    const cancel = () => controller.abort(signal.reason);
    const childDone = () => controller.abort();
    const timer = setTimeout(() => controller.abort(), timeout);
    let watcher;
    let wake;
    const onAbort = () => wake?.();
    controller.signal.addEventListener('abort', onAbort, { once: true });
    signal?.addEventListener('abort', cancel, { once: true });
    child?.once?.('exit', childDone);
    child?.once?.('error', childDone);

    const assertChildAlive = () => {
      if (child?._startupDiagnostic?.spawnError) {
        throw new Error(`Browser process could not start: ${child._startupDiagnostic.spawnError}`);
      }
      if (child && isChildExited(child)) {
        throw new Error(formatBrowserStartupError(
          `Browser exited before CDP was ready (code ${child.exitCode}${child.signalCode ? ', signal ' + child.signalCode : ''})`,
          child, child._startupDiagnostic,
        ));
      }
    };
    try {
      signal?.throwIfAborted();
      try {
        watcher = fs.watch(root, (_event, name) => {
          if (!name || name === 'DevToolsActivePort') wake?.();
        });
        watcher.on('error', () => {
          watcher?.close();
          watcher = null;
          wake?.();
        });
      } catch (_) { watcher = null; }

      const active = () => !controller.signal.aborted && performance.now() < deadline;
      while (active()) {
        assertChildAlive();
        try {
          const content = await fsp.readFile(file, { encoding: 'utf8', signal: controller.signal });
          const port = Number(content.split(/\r?\n/)[0]);
          if (Number.isInteger(port) && port > 0 && port <= 65535 && active()) {
            await cdp.json(`http://127.0.0.1:${port}/json/version`, 'GET', {
              timeoutMs: Math.max(1, Math.min(5000, deadline - performance.now())), signal: controller.signal,
            });
            if (active()) {
              assertChildAlive();
              return port;
            }
          }
        } catch (_) { /* The browser may publish the port before it can serve requests. */ }
        if (!active()) break;
        assertChildAlive();
        await new Promise(resolve => {
          const retry = setTimeout(() => wake?.(), Math.min(watcher ? 250 : 120, deadline - performance.now()));
          wake = () => { clearTimeout(retry); wake = null; resolve(); };
        });
      }
      signal?.throwIfAborted();
      assertChildAlive();
    } finally {
      clearTimeout(timer);
      watcher?.close();
      signal?.removeEventListener('abort', cancel);
      child?.removeListener?.('exit', childDone);
      child?.removeListener?.('error', childDone);
    }
    throw new Error(formatBrowserStartupError(
      'Browser started but CDP port was not ready', child, child?._startupDiagnostic,
    ));
  }

  emitStartProgress(profileId, phase, percent, message = '', lifecycleGeneration = null) {
    this.emit({
      type: 'profile-start-progress',
      id: profileId,
      phase,
      percent: Math.max(0, Math.min(100, Math.round(Number(percent) || 0))),
      message: message || '',
      lifecycleGeneration,
      starting: phase !== 'ready' && phase !== 'error',
      running: phase === 'ready',
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
      firefoxImageFilter: resources.firefoxImageFilter || null,
      markerProcess: resources.markerProcess || null,
      profileLock: resources.profileLock || null,
      pid: resources.child?.pid || null,
      browser: resources.browser || null,
      root: resources.root || null,
      profile,
      engine: resources.browser?.engine || profile.engine || 'chromium',
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
      exitCleanupReason: 'start-failed',
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

  async start(raw, launchOptions = {}) {
    if (this.shuttingDown) {
      throw Object.assign(new Error('Browser engine is shutting down'), { code: 'ENGINE_SHUTTING_DOWN' });
    }
    launchOptions = { headless: launchOptions?.headless === true, blockImages: launchOptions?.blockImages === true };
    const candidate = this.restoreStoredProxyCredentials(
      this.resolveStoredProxyProfile(this.sanitizeProfile(raw)),
      raw,
    );
    const id = candidate.id;
    const existing = this.profiles.get(id);
    candidate.createdAt = existing?.createdAt || candidate.createdAt || new Date().toISOString();
    candidate.updatedAt = existing?.updatedAt || candidate.updatedAt || candidate.createdAt;
    assertProfileNotMaintained(this, id);
    if (this.deletingProfiles?.has(id)) {
      throw Object.assign(new Error(`Profile ${id} is being deleted`), { code: 'PROFILE_DELETING' });
    }
    const pendingStart = this.starting.get(id);
    if ((launchOptions.headless || launchOptions.blockImages) && (pendingStart || (this.running.has(id) && !this.stopping.has(id)))) {
      throw Object.assign(new Error('请先停止环境，再应用临时启动选项'), { code: 'PROFILE_BUSY', profileId: id });
    }
    if (pendingStart) return pendingStart;
    if (this.stopAllInProgress) {
      const error = new Error('Browser engine is stopping all environments');
      error.code = 'ENGINE_STOPPING';
      throw error;
    }

    // Firefox kernels have no CDP; they take the dedicated launch pipeline.
    // The decision lives here so every caller (UI, local API, RPA) gets it.
    if (this.profilePrefersFirefox(candidate)) {
      return this.startManaged(id, candidate, (generation) => this._startFirefox(candidate, generation, launchOptions));
    }
    return this.startManaged(id, candidate, (generation) => this._start(candidate, generation, launchOptions));
  }

  /**
   * Shared start bookkeeping (starting map + generation barrier). start() used
   * to inline this; the Chromium and Firefox pipelines both go through it now.
   */
  async startManaged(id, candidate, run) {
    assertProfileNotMaintained(this, id);
    const current = this.running.get(id);
    // A no-op relaunch must retain the running item's generation: its exit
    // handlers and profile-lock ownership still belong to that same instance.
    if (current && !this.stopping.has(id) && !current.cleanupFailed && !current.cleanedUp && !current.stopping) {
      return { ...this.publicRunning(id), alreadyRunning: true };
    }
    const assertProfileCurrent = profileWriteGuard(this, id);
    const generation = this.reserveLifecycleGeneration(id);
    let active = false;
    const cancellation = new AbortController();
    const queuedCancellation = new AbortController();
    const cancelQueued = () => queuedCancellation.abort(cancellation.signal.reason);
    cancellation.signal.addEventListener('abort', cancelQueued, { once: true });
    this.startScheduler ||= new TaskScheduler({ name: 'browser-start', concurrency: BROWSER_START_CONCURRENCY });
    // Publish the queue entry before cleanup or synchronous progress listeners
    // can reenter start() or stop(). A reservation is not yet a new owner.
    const task = Promise.resolve().then(async () => {
      const pendingStop = this.stopping.get(id);
      if (pendingStop) await pendingStop.catch(() => {});
      this.assertStartGenerationActive(id, generation);

      let afterStop = this.running.get(id);
      if (afterStop && (afterStop.cleanupFailed || afterStop.cleanedUp || afterStop.stopping)) {
        const childExited = afterStop.child ? isChildExited(afterStop.child) : !isPidAlive(afterStop.pid);
        if (afterStop.cleanupFailed && !childExited) {
          // A replacement request must not run a second kill path for a still
          // live browser. The owner remains visible for an explicit stop retry.
          throw afterStop.cleanupError || Object.assign(
            new Error(`Browser environment ${id} is still stopping; child exit has not been confirmed`),
            { code: 'BROWSER_EXIT_UNCONFIRMED' },
          );
        }
        // Use normal cleanup for a stopped child whose prior cleanup did not
        // finish. Never drop the lock or running item around failed retention.
        await this.stopRunningItem(id, afterStop);
        afterStop = this.running.get(id);
        if (afterStop && (afterStop.cleanupFailed || afterStop.cleanedUp || afterStop.stopping)) {
          throw afterStop.cleanupError || Object.assign(new Error(`Browser cleanup is incomplete for profile ${id}`), {
            code: 'PROFILE_CLEANUP_INCOMPLETE',
          });
        }
      }
      if (afterStop) {
        // Healthy instance already running: mark it so callers can tell a
        // fresh start from a no-op relaunch (previously indistinguishable).
        return { ...this.publicRunning(id), alreadyRunning: true };
      }
      this.assertStartGenerationActive(id, generation);
      this.lifecycleGenerations.set(id, generation);
      active = true;
      this.emitStartProgress?.(id, 'prepare', 1, '启动中…', generation);
      this.assertStartGenerationActive(id, generation);
      return this.startScheduler.schedule(async () => {
        cancellation.signal.removeEventListener('abort', cancelQueued);
        this.assertStartGenerationActive(id, generation);
        assertProfileCurrent();
        const profile = this.resolveStoredProxyProfile(candidate);
        this.assertProxyConcurrencyAvailable(profile);
        task.proxyReservation = profile;
        try {
          await assertProfileRestoreReady(this.profileRoot(id));
          this.assertStartGenerationActive(id, generation);
          assertProfileCurrent();
          return await run(generation);
        } finally {
          task.proxyReservation = null;
        }
      }, undefined, { signal: queuedCancellation.signal });
    });
    task.lifecycleGeneration = generation;
    task.abortController = cancellation;
    this.starting.set(id, task);
    this.invalidateStatusCache?.(id);
    try {
      return await task;
    } catch (error) {
      const lifecycle = profileLifecycle(this, id);
      if (active && lifecycle?.operation === 'start' && lifecycle.pending) {
        this.emit({ type: 'profile-start-progress', id, phase: 'error', percent: 0,
          message: error.message || String(error), error: true, errorCode: error?.code, lifecycleGeneration: generation });
      }
      throw error;
    } finally {
      cancellation.signal.removeEventListener('abort', cancelQueued);
      if (this.starting.get(id) === task) this.starting.delete(id);
      this.invalidateStatusCache?.(id);
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
    // Guarded: unit harnesses build engines via Object.create(prototype)
    // without a kernel manager; the default kernel choice is Chromium there.
    const installed = this.kernelManager?.resolveInstalled?.();
    return installed?.engine === 'firefox';
  }

  publicRunning(id) {
    const lifecycle = profileLifecycle(this, id);
    const starting = lifecycle?.operation === 'start' ? lifecycle.pending : this.starting.has(id);
    const pendingStop = this.stopping.has(id);
    const item = this.running.get(id);
    if (!item) return { id, running: false, starting, stopping: pendingStop, ...(lifecycle ? { lifecycle } : {}) };
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
        ...(lifecycle ? { lifecycle } : {}),
      };
    }
    const capabilities = item.engine === 'firefox'
      ? {
        engine: 'firefox',
        cdp: false,
        // Defaults stay false until the BiDi initialization verifies delivery.
        fingerprintDelivery: false,
        fingerprintVerification: false,
        runtimeInjection: false,
        extensionHotLoad: false,
        zoomReconcile: false,
        ...(item.capabilities || {}),
      }
      : null;
    return {
      id, running: !starting, starting, stopping: false, ...(lifecycle ? { lifecycle } : {}), pid: item.pid, port: item.port,
      ...(!starting ? { launchStatus: profileLaunchStatus(this, id, item) } : {}),
      engine: item.engine || 'chromium',
      browser: item.browser.name, executable: item.browser.path,
      profileDirectory: item.root,
      extensionCount: item.extensions.length,
      loadedExtensions: item.loadedExtensions || [],
      cdpError: item.cdpError || null,
      verificationBlocked: Boolean(item.verificationBlocked),
      fingerprintVerificationError: item.fingerprintVerificationError || null,
      ...(item.fingerprintWarnings?.length ? { fingerprintWarnings: [...item.fingerprintWarnings] } : {}),
      ...(capabilities ? { capabilities } : {}),
      fingerprint: item.fingerprint ? {
        platform: item.fingerprint.platform,
        hardwareConcurrency: item.fingerprint.hardwareConcurrency,
        deviceMemory: item.fingerprint.deviceMemory,
        canvas: item.fingerprint.canvas?.mode,
        webgl: item.fingerprint.webgl?.mode,
        webrtc: item.fingerprint.webrtc,
        delivery: (item.engine === 'firefox' ? item.capabilities?.fingerprintDelivery : item.fingerprintVerified)
          ? 'verified-document' : 'intent-only',
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
      beginProfileStop(this, safe, item);
      observeProfileStop(this, safe, cleanupPromise, item);
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
    beginProfileStop(this, safe, item);
    observeProfileStop(this, safe, task, item);
    return task;
  }

  async stop(id) {
    const safe = assertProfileId(id);
    this.resetFingerprintVerificationFailures(safe);
    const pendingStop = this.stopping.get(safe);
    if (pendingStop?.lifecycleSettled && this.stopping.get(safe) === pendingStop) this.stopping.delete(safe);
    const pendingStart = this.starting.get(safe);
    if (!pendingStart && this.stopping.has(safe)) return this.stopping.get(safe);
    // A second stop can cancel a replacement already queued behind the first.
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
    item.expectedExit = true;
    item.stopping = true;
    this.clearRunningWatch(item);
    item.workerFingerprintConnection?.close();
    item.workerFingerprintConnection = null;
    const profile = this.profiles.get(safe) || item.profile || {};
    const cookieExported = await this.saveClosingCookies(safe, item);
    let graceful = !item.child || isChildExited(item.child);
    let closeTimer = null;
    if (!graceful && item.child) {
      // Prefer Browser.close so window-X / empty-window auto-stop fully quits Chromium helpers
      try {
        await Promise.race([
          (async () => {
            if (item.engine === 'firefox' && item.bidiConnection) {
              await item.bidiConnection.command('browser.close', {}, 5000);
              return;
            }
            try {
              await item.cdpConnection?.command?.('Browser.close', {}, { timeout: 5000 });
            } catch (_) {
              const ws = await cdp.browserSocket(item.port).catch(() => null);
              if (ws) await cdp.call(ws, 'Browser.close', {}, 4000).catch(() => {});
            }
          })(),
          new Promise((resolve) => { closeTimer = setTimeout(resolve, 1800); if (closeTimer.unref) closeTimer.unref(); }),
        ]).finally(() => clearTimeout(closeTimer));
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
    if (profile.advanced?.cloudBackup) {
      item.profileClosedEmitted = true;
      this.emit({
        type: 'profile-closed',
        id: safe,
        cloudBackup: true,
        cookieExported,
        profile: this.profiles.get(safe) || profile,
        lifecycleGeneration: item.lifecycleGeneration,
        reason: 'stop',
      });
    }
    return { ...cleanupResult, id: safe, running: false, graceful, cookieExported };
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
    // Whole-operation budget: 8 passes × the per-item timeout could otherwise
    // block shutdown for minutes. Once the budget is spent (or a full pass made
    // no progress), the loop breaks and the remaining ids are reported — the
    // OS/user-initiated force kill path takes over from there.
    const STOP_ALL_BUDGET_MS = 30_000;
    const startedAt = Date.now();
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
      if (Date.now() - startedAt > STOP_ALL_BUDGET_MS) break;
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

  on(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  // 'status' events are emitted exactly at the points where the public view
  // (running/port/network/...) can change, so they double as the invalidation
  // signal for the status() snapshot cache. This one hook covers start/stop,
  // proxy checks, fingerprint-verification outcomes — anything that reports
  // itself as a status change.
  emit(value) {
    if (!recordProfileLifecycle(this, value)) return;
    const launchWarning = recordProfileLaunchWarning(this, value);
    if (launchWarning === false) return;
    const ready = value?.type === 'profile-start-progress' && value.phase === 'ready';
    if (launchWarning || value?.type === 'status' || /^(profile-start|profile-stop|profile-sync)-progress$/.test(value?.type || '')) {
      this.invalidateStatusCache(value.id);
      if (value.id) value = { ...value, lifecycle: profileLifecycle(this, value.id) };
    }
    if ((ready || launchWarning) && value.id && this.running.has(value.id)) {
      const runtime = this.publicRunning(value.id);
      if (runtime.running && runtime.launchStatus) value = { ...value, running: true, launchStatus: runtime.launchStatus };
    }
    // Listener isolation: a destroyed-window listener (or any single faulty
    // consumer) must not break the fan-out — the remaining listeners still
    // need the event, and cleanup paths depend on emit completing.
    for (const listener of this.listeners) {
      try {
        listener(value);
      } catch (error) {
        console.error('[BrowserEngine] listener dispatch failed:', error?.message || error);
      }
    }
  }
  runningWithCdp(ids) {
    return ids.map((id) => ({ id, item: this.running.get(id) }))
      .filter((entry) => entry.item?.port && !entry.item.cleanedUp && !entry.item.stopping);
  }

}

// Contributions retain the public engine API, but duplicates can no longer
// silently replace another domain's methods. Ownership is available for diagnostics.
const { installEngineModules } = require('./engine/compose');
Object.defineProperty(BrowserEngine, 'methodOwners', {
  value: installEngineModules(BrowserEngine.prototype, [
    ['runtime-settings', require('./engine/runtime-settings')],
    ['start-page', require('./engine/start-page')],
    ['init', require('./engine/init')],
    ['profile-proxy', require('./engine/profile-proxy')],
    ['start', require('./engine/start')],
    ['start-firefox', require('./engine/start-firefox')],
    ['fingerprint-injection', require('./engine/fingerprint-injection')],
    ['lifecycle-cleanup', require('./engine/lifecycle-cleanup')],
    ['profile-store-api', require('./engine/profile-store-api')],
    ['extensions-api', require('./engine/extensions-api')],
    ['persistence', require('./engine/persistence')],
    ['session-api', require('./engine/session-api')],
    ['status-api', require('./engine/status-api')],
  ]),
});

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
  evaluateFingerprintDelivery,
  backgroundNetworkFlagsForProfile,
};

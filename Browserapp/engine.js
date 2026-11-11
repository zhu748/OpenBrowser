const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const cdp = require('./cdp');
let proxyForwarderModule = {};
try {
  proxyForwarderModule = require('./proxy-forwarder');
} catch (pfErr) {
  console.warn('[BrowserEngine] Note: proxy-forwarder module load warning:', pfErr.message);
}
const {
  parseProxy = () => ({ protocol: 'direct', host: '', port: 0 }),
  // Only used by resolveStoredProxyProfile's live-library branch; the fallback
  // mirrors normalizeIpLookupChannel's accepted set so engine.js still loads
  // when proxy-forwarder is unavailable.
  normalizeIpLookupChannel = (v) => {
    const raw = String(v || '').trim().toLowerCase();
    if (raw === 'ifconfig' || raw === 'ifconfig.me' || raw === 'ifconfig-me') return 'ifconfig-me';
    return ['ip-api', 'ip2location', 'ifconfig-me'].includes(raw) ? raw : 'ip-api';
  },
} = proxyForwarderModule;
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
const { applyLanguagePreferences, verifyLanguagePreferences, syncProfileLocalState } = require('./automation/profile-file-consistency');
const { platformPreflight } = require('./automation/platform-preflight');
const { buildWorkerInjectionScript } = require('./automation/fingerprint');
const { ensureStartPageServer } = require('./automation/start-page-server');
const { killProcessTree } = require('./automation/protocol/cross-platform');
const isolation = require('./automation/isolation');
const { lockPath, releaseProfileLock, scanProcessesUsingProfileAsync, isPidAlive, auditIsolation, isSystemBrowserExecutable, validateDataRootIsolationSecure, assertProfileId, assertSafeProfileChild } = isolation;
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
const { TrackedProfileMap } = require('./engine/profile-revisions');
const { assertProfileNotMaintained } = require('./engine/profile-maintenance');
const { assertProfileRestoreReady } = require('./automation/cloud/file-restore');

class BrowserEngine {
  constructor(app, options = {}) {
    this.app = app;
    // Host display scale provider (Windows). Defaulting the kernel UI scale to the real
    // display scale keeps browser chrome text/icons matching the rest of the OS on
    // high-DPI (125%/150%/200%) displays. Supplied by main.js; optional so tests and
    // non-Windows hosts keep the previous default of 1.
    this.getHostScaleFactor = typeof options.getHostScaleFactor === 'function' ? options.getHostScaleFactor : null;
    this.profiles = new TrackedProfileMap();
    this.running = new Map();
    // Per-profile lifecycle barriers. A browser must finish stopping (including
    // process-tree, proxy bridge, and profile-lock cleanup) before a new start
    // can acquire the same profile.
    this.starting = new Map();
    this.stopping = new Map();
    this.deletingProfiles = new Set();
    this.profileMaintenance = new Map();
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
    // All inputs to this method are sanitizeProfile outputs (or engine-stored
    // profiles which were sanitized on entry), so the association, length and
    // enum shape guarantees still hold. Resubstitution therefore rewrites the
    // affected fields directly instead of re-sanitizing the whole profile:
    // the sync path called this per profile, and the extra full sanitize was
    // the dominant cost of large-fleet syncs.
    const profile = incoming && typeof incoming === 'object' ? incoming : null;
    if (!profile) return profile;
    const direct = profile.networkMode === 'direct' || /^(?:direct|offline|none)$/i.test(String(profile.proxy || '').trim());
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
    const raw = String(value || '').trim();
    if (!raw) throw new Error('Environment data directory is required');
    if (this.running.size || this.starting.size || this.stopping.size || this.profileMaintenance?.size) {
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
    try { const prefs = JSON.parse(await fsp.readFile(file, 'utf8')); if (prefs.partition) prefs.partition.per_host_zoom_levels = {}; if (prefs.browser && 'default_zoom_level' in prefs.browser) prefs.browser.default_zoom_level = 0; await writeRawAtomically(file, JSON.stringify(prefs), 0o600); } catch (_) {}
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
      stopIpcStubForWindow(resources.kernelWindowName).catch(() => {});
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
    assertProfileNotMaintained(this, id);
    if (this.deletingProfiles?.has(id)) {
      throw Object.assign(new Error(`Profile ${id} is being deleted`), { code: 'PROFILE_DELETING' });
    }
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
    assertProfileNotMaintained(this, id);
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
        // Async scan: the sync variant shells out to PowerShell/ps on the main
        // thread (up to 8s each) and this recovery path used to run it three
        // times in a row, freezing every window and IPC handler.
        let helpers = (await scanProcessesUsingProfileAsync(afterStop.root || '')).pids;
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
          helpers = (await scanProcessesUsingProfileAsync(afterStop.root || '')).pids;
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
        const finalScan = await scanProcessesUsingProfileAsync(afterStop.root || '');
        helpers = finalScan.pids;
        if (!childDead) {
          throw afterStop.cleanupError || Object.assign(
            new Error(`Browser environment ${id} is still stopping; child exit has not been confirmed`),
            { code: 'BROWSER_EXIT_UNCONFIRMED' },
          );
        }
        if (!finalScan.known || helpers.length) {
          throw Object.assign(new Error(`Browser helper exit is unconfirmed for profile ${id}`), {
            code: 'BROWSER_HELPERS_EXIT_UNCONFIRMED', pids: helpers,
          });
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
      if (afterStop) {
        // Healthy instance already running: mark it so callers can tell a
        // fresh start from a no-op relaunch (previously indistinguishable).
        return { ...this.publicRunning(id), alreadyRunning: true };
      }
      this.assertStartGenerationActive(id, generation);
      await assertProfileRestoreReady(this.profileRoot(id));
      // stop/delete can invalidate this start while the filesystem check waits.
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
    // Guarded: unit harnesses build engines via Object.create(prototype)
    // without a kernel manager; the default kernel choice is Chromium there.
    const installed = this.kernelManager?.resolveInstalled?.();
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
    const capabilities = item.engine === 'firefox'
      ? {
        engine: 'firefox',
        cdp: false,
        // Firefox has no CDP: a fingerprint expectation cannot be injected or
        // verified. Downstream (RPA planning, start-page expected checks, local
        // API) must treat fingerprint values as intent, never as a delivery
        // promise — declared here instead of relying on every consumer
        // checking the engine string.
        fingerprintDelivery: false,
        fingerprintVerification: false,
        runtimeInjection: false,
        extensionHotLoad: false,
        zoomReconcile: false,
        ...(item.capabilities || {}),
      }
      : null;
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
      ...(capabilities ? { capabilities } : {}),
      fingerprint: item.fingerprint ? {
        platform: item.fingerprint.platform,
        hardwareConcurrency: item.fingerprint.hardwareConcurrency,
        deviceMemory: item.fingerprint.deviceMemory,
        canvas: item.fingerprint.canvas?.mode,
        webgl: item.fingerprint.webgl?.mode,
        webrtc: item.fingerprint.webrtc,
        ...(item.engine === 'firefox' ? { delivery: 'intent-only' } : {}),
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
        profile.cookies = cookieExport.slice(0, 500000);
        profile.updatedAt = new Date().toISOString();
        this.profiles.set(safe, profile);
        this.invalidateStatusCache?.();
        await this.persist().catch(() => {});
      }
    }
    let graceful = !item.child || isChildExited(item.child);
    let closeTimer = null;
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
      // No-progress escape: when a full pass removed nothing, another identical
      // pass will not either — break instead of burning the remaining rounds.
      if (remaining.length >= ids.length && Date.now() - startedAt > STOP_ALL_BUDGET_MS) {
        break;
      }
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
    if (value?.type === 'status') this._statusCache = null;
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

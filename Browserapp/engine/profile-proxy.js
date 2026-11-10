'use strict';

/**
 * Profile-proxy runtime mixin for BrowserEngine (prototype-assigned by engine.js):
 * resolving per-profile proxy configuration (networkMode vs forced proxy),
 * applying network settings, probe/test/check lifecycle, refresh (refreshUrl /
 * apiExtractUrl) and the fail-closed prepareProfileProxyForStart gate that the
 * startup routine in engine/start.js calls before any resource is created.
 * Pure proxy parsing helpers live in engine/proxy-helpers.js (shared via
 * engine/index.js); this module owns the stateful profile-bound operations.
 */



// proxy-forwarder is optional: the guarded require keeps a broken optional
// dependency from taking the proxy paths down (same pattern as engine.js).
let proxyForwarderModule;
try {
  proxyForwarderModule = require('../proxy-forwarder');
} catch (pfErr) {
  console.warn('[BrowserEngine/profile-proxy] Note: proxy-forwarder module load warning:', pfErr.message);
}
const {
  parseProxy = (_v) => ({ protocol: 'direct', host: '', port: 0 }),
  lookupProxyCountry = async () => ({ ip: '', country: '', countryCode: '' }),
  extractProxyFromApi = async () => '',
  invokeProxyRefresh = async () => '',
  classifyProxyError = () => 'proxy-unknown',
} = proxyForwarderModule;

module.exports = {
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
  },
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
    // The status emit below also invalidates via the engine emit hook; kept
    // explicit here so the ordering is obvious even if emit changes.
    this.invalidateStatusCache?.();
    this.emit({ type: 'status', id: next.id, running: this.running.has(next.id), network, profile: next });
    return { profile: next, network, patch };
  },
  async testProxy(raw, options = {}) {
    this._proxyTests ||= new Map();
    const profile = this.sanitizeProfile(raw);
    // Stable dedup key: the previous key serialized the whole proxyMeta object
    // graph plus the options object, so two callers passing structurally equal
    // but differently-ordered options (or a renderer-rewritten proxyMeta)
    // missed each other's in-flight probe and doubled the upstream load.
    // Keyed on the fields that actually change the probe outcome: profile id,
    // effective endpoint, lookup channel and the semantic option values
    // (absent options normalize to their defaults).
    const forcedRaw = String(options.proxy || options.forcedProxy || '').trim();
    const key = JSON.stringify([
      profile.id,
      forcedRaw || String(profile.proxy || ''),
      String(profile.proxyMeta?.ipChannel || ''),
      options.allowExtract !== false,
      options.includeRisk === true,
      options.totalTimeoutMs != null ? Number(options.totalTimeoutMs) : 0,
      options.attemptTimeoutMs != null ? Number(options.attemptTimeoutMs) : 0,
    ]);
    if (this._proxyTests.has(key)) return this._proxyTests.get(key);
    const task = this._testProxy(raw, options);
    this._proxyTests.set(key, task);
    try { return await task; }
    finally { if (this._proxyTests.get(key) === task) this._proxyTests.delete(key); }
  },
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
        // Last applied network (kept by applyNetworkToProfile). Used only to
        // carry legacy verification evidence through degraded results/errors;
        // it never manufactures a verification.
        previousResult: this.networkInfo?.get?.(profile.id) || undefined,
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
      // Keep verification evidence across the rebuild: the startup gate's
      // "previously verified, probe failing now" branch reads this field, so
      // dropping it here made that branch unreachable.
      if (error.transportVerified !== undefined) err.transportVerified = error.transportVerified === true;
      if (error.transportVerifiedAt !== undefined) err.transportVerifiedAt = error.transportVerifiedAt || null;
      err.latencyMs = error.latencyMs;
      throw err;
    }
  },
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
  },
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
        // If the subsequent probe fails, no 'status' emit happens on this
        // path; the local API reads status() directly and would keep serving
        // the pre-extraction proxy forever.
        this.invalidateStatusCache?.();
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
  },
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
  },
};

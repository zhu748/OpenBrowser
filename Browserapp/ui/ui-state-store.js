(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../shared/proxy-redact'));
  else root.OpenBrowserUiState = factory(root.OpenBrowserProxyRedact);
})(globalThis, (proxyRedact) => {
  'use strict';
  const { redactProxyCredentials } = proxyRedact;

  /** Preserve display fields while keeping credentials in the host's store. */
  function redactProfileForStorage(profile, normalize = (value) => value) {
    const value = normalize(profile);
    const platform = value.platform || {};
    const backups = Array.isArray(value.proxyMeta?.backupProxies) ? value.proxyMeta.backupProxies
      : String(value.proxyMeta?.backupProxies || '').split(/[\r\n,;]+/).map((proxy) => proxy.trim()).filter(Boolean);
    return {
      ...value, cookies: '', password: '', totpSecret: '', otp: '',
      proxy: redactProxyCredentials(value.proxy),
      proxyMeta: { ...(value.proxyMeta || {}),
        backupProxies: backups.map(redactProxyCredentials),
      },
      platform: { ...platform, password: '', totpSecret: '', otp: '',
        accounts: Array.isArray(platform.accounts)
          ? platform.accounts.map((account) => ({ ...account, password: '', totpSecret: '', otp: '' })) : [],
      },
    };
  }

  function trimRedactedProfile(value) {
    const keys = ['id', 'number', 'name', 'groupId', 'tag', 'tags', 'trashed', 'trashedAt', 'note', 'notes',
      'networkMode', 'proxy', 'proxyId', 'createdAt', 'updatedAt'];
    return Object.fromEntries(keys.map((key) => [key, value[key]]));
  }

  /**
   * One persistence lane for immediate edits and coalesced log/status events.
   * Storage and state access are callbacks so unavailable localStorage can be
   * handled, and the state is read when writing, never at timer creation.
   */
  function createUiStateStore({ read, write, getState, normalizeProfile, fallback,
    onQuota = () => {}, onFailure = () => {}, delayMs = 500,
    maxWaitMs = Math.max(delayMs, 2000), now = () => globalThis.performance?.now?.() ?? Date.now(),
    setTimer = setTimeout, clearTimer = clearTimeout }) {
    let timer = null;
    let requestedAt = null;
    let disposed = false;
    const notify = (observer, error) => { try { observer(error); } catch (_) { /* observer */ } };
    const cancel = () => { if (timer !== null) { clearTimer(timer); timer = null; } requestedAt = null; };
    function load() {
      try {
        const value = JSON.parse(read());
        if (value && Array.isArray(value.profiles)) {
          // Quota-incident guard: a trimmed snapshot only preserves display
          // fields. Merging it over the engine's authoritative state would
          // strip fingerprints and proxy settings on the next sync, so keep
          // only the non-profile parts (window geometry etc.).
          if (value.degraded) {
            const base = fallback();
            const { profiles: _profiles, logs: _logs, ...metadata } = value;
            return { ...base, ...metadata, profiles: base.profiles, logs: [], degraded: true };
          }
          return { ...value, logs: Array.isArray(value.logs) ? value.logs : [] };
        }
      } catch (_) { /* Missing, corrupt or blocked storage starts with defaults. */ }
      return fallback();
    }
    function save() {
      cancel();
      if (disposed) return { ok: false, disposed: true };
      let safe;
      try {
        const state = getState();
        safe = { ...state, profiles: (state.profiles || []).map((profile) => redactProfileForStorage(profile, normalizeProfile)) };
        write(JSON.stringify(safe));
        return { ok: true, trimmed: false };
      } catch (error) {
        notify(onQuota, error);
        if (safe) {
          try {
            // Degraded-restore sentinel: trimmed profiles keep only ~20 basic
            // fields. If a later session loaded them wholesale, initialize()
            // would push the crippled objects back into the engine and
            // overwrite fingerprints/proxy/platform settings (data loss).
            // The marker lets load() reject the trimmed copy so the engine
            // state stays authoritative after a quota incident.
            write(JSON.stringify({ ...safe, logs: [], degraded: true, profiles: safe.profiles.map(trimRedactedProfile) }));
            return { ok: true, trimmed: true };
          } catch (fallbackError) { notify(onFailure, fallbackError); }
        } else { notify(onFailure, error); }
        return { ok: false, trimmed: true };
      }
    }
    function request() {
      if (disposed) return;
      const timestamp = now();
      if (requestedAt === null) requestedAt = timestamp;
      if (timer !== null) clearTimer(timer);
      // Preserve the first deadline during a continuous log/status stream.
      const ceiling = Number.isFinite(maxWaitMs) ? Math.max(delayMs, maxWaitMs) : Math.max(delayMs, 2000);
      const delay = Math.max(0, Math.min(delayMs, requestedAt + ceiling - timestamp));
      timer = setTimer(() => { timer = null; save(); }, delay);
    }
    function flush() { return timer !== null ? save() : { ok: true, skipped: true }; }
    function dispose() { const result = flush(); disposed = true; cancel(); return result; }
    return Object.freeze({ load, save, request, flush, dispose });
  }

  return Object.freeze({ createUiStateStore, redactProfileForStorage, trimRedactedProfile });
});

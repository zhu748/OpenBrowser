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
    setTimer = setTimeout, clearTimer = clearTimeout }) {
    let timer = null;
    let disposed = false;
    const notify = (observer, error) => { try { observer(error); } catch (_) { /* observer */ } };
    const cancel = () => { if (timer !== null) { clearTimer(timer); timer = null; } };
    function load() {
      try {
        const value = JSON.parse(read());
        if (value && Array.isArray(value.profiles)) return { ...value, logs: Array.isArray(value.logs) ? value.logs : [] };
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
            write(JSON.stringify({ ...safe, logs: [], profiles: safe.profiles.map(trimRedactedProfile) }));
            return { ok: true, trimmed: true };
          } catch (fallbackError) { notify(onFailure, fallbackError); }
        } else { notify(onFailure, error); }
        return { ok: false, trimmed: true };
      }
    }
    function request() {
      if (disposed) return;
      cancel();
      timer = setTimer(() => { timer = null; save(); }, delayMs);
    }
    function flush() { return timer !== null ? save() : { ok: true, skipped: true }; }
    function dispose() { const result = flush(); disposed = true; cancel(); return result; }
    return Object.freeze({ load, save, request, flush, dispose });
  }

  return Object.freeze({ createUiStateStore, redactProfileForStorage, trimRedactedProfile });
});

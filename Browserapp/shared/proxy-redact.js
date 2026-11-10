(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBrowserProxyRedact = factory();
})(globalThis, () => {
  'use strict';

  const PROXY_NO_CREDENTIAL_RE = /^(direct|offline|none)$/i;

  function redactProxyCredentials(proxy) {
    const raw = String(proxy ?? '').trim();
    if (!raw) return 'Direct';
    if (PROXY_NO_CREDENTIAL_RE.test(raw)) return raw;
    try {
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
        const parsed = new URL(raw);
        parsed.username = '';
        parsed.password = '';
        return parsed.toString();
      }
    } catch (_) { /* fall through to colon-splitting */ }
    const parts = raw.split(':');
    // host:port:user:pass → host:port only
    if (parts.length >= 4) return `${parts[0]}:${parts[1]}`;
    return raw;
  }

  return Object.freeze({ redactProxyCredentials });
});

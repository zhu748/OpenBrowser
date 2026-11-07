'use strict';

/**
 * Shared proxy-string credential redaction.
 *
 * Three call sites used to carry private copies of this logic (renderer
 * localStorage, local-API responses, selftests); a fix applied to one copy
 * silently missed the others. Canonical semantics:
 *
 *   - 'direct' / 'offline' / 'none' (any case) and empty pass through;
 *     empty normalizes to 'Direct'.
 *   - scheme://user:pass@host:port... → credentials stripped, URL re-serialized
 *     (query/fragment preserved — the remark fragment is not a credential).
 *   - host:port:user:pass (4+ colon parts) → host:port only.
 *   - anything else (host:port, bare host, remarks) passes through unchanged.
 */

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

module.exports = { redactProxyCredentials };

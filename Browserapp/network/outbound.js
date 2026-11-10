'use strict';

const { requestBuffer } = require('./http-request');

const { isCloudMetadataHostname, isPrivateOrLocalHostname, createPolicyLookup } = require('./address-policy');

/** Always-blocked hosts (cloud metadata). Private/loopback controlled separately. */
function isBlockedOutboundHostname(hostname) {
  return isCloudMetadataHostname(hostname);
}

function resolveAllowPrivateOutbound(options = {}) {
  if (options.allowPrivate === true) return true;
  if (options.allowPrivate === false) return false;
  const env = String(process.env.OPENBROWSER_ALLOW_PRIVATE_OUTBOUND || '').trim();
  if (env === '0' || /^false$/i.test(env)) return false;
  if (env === '1' || /^true$/i.test(env)) return true;
  // Desktop default: local proxy dashboards often live on 127.0.0.1 / LAN.
  // Cloud metadata remains blocked regardless.
  return true;
}

function assertSafeOutboundUrl(url, options = {}) {
  const target = String(url || '').trim();
  if (!/^https?:\/\//i.test(target)) throw new Error('URL 必须以 http:// 或 https:// 开头');
  let parsed;
  try { parsed = new URL(target); } catch (_) { throw new Error('URL 无效'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('仅允许 http/https URL');
  if (parsed.username || parsed.password) throw new Error('出站 URL 不允许内嵌账号密码');
  if (isCloudMetadataHostname(parsed.hostname)) {
    throw new Error('出站 URL 禁止访问云 metadata 地址（防 SSRF）');
  }
  if (!resolveAllowPrivateOutbound(options) && isPrivateOrLocalHostname(parsed.hostname)) {
    throw new Error('出站 URL 禁止访问本机/内网地址（OPENBROWSER_ALLOW_PRIVATE_OUTBOUND=0）');
  }
  return parsed;
}

async function fetchUrlText(url, { timeout = 15000, method = 'GET', allowPrivate, maxRedirects = 3 } = {}) {
  const options = { allowPrivate };
  const parsed = assertSafeOutboundUrl(url, options);
  const { status, buffer, headers } = await requestBuffer(parsed.toString(), {
    method, timeoutMs: timeout, maxBytes: 2 * 1024 * 1024,
    headers: { Accept: 'text/plain, application/json, */*', 'User-Agent': 'OpenBrowser/2.0' },
    lookup: createPolicyLookup({ allowPrivate: resolveAllowPrivateOutbound(options) }),
    validateUrl: (target) => assertSafeOutboundUrl(target, options),
    followRedirects: true, maxRedirects,
    timeoutMessage: '请求超时', tooLargeMessage: '响应体过大', redirectMessage: '重定向次数过多',
  });
  const body = buffer.toString('utf8');
  if (status >= 400) throw new Error('HTTP ' + status + ': ' + body.slice(0, 160));
  return { status, body, headers };
}

module.exports = { isBlockedOutboundHostname, resolveAllowPrivateOutbound, assertSafeOutboundUrl, fetchUrlText };

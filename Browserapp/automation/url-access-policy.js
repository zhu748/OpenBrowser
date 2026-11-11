'use strict';

const { isIP } = require('node:net');

// The editor exposes website lists: URL paths and schemes select the host,
// while an explicit port restricts the rule to that port. A bare domain also
// covers its subdomains; IP literals only match the exact address.
function parseWebsiteRule(value) {
  const raw = String(value).trim();
  const source = raw.replace(/^https?:\/\//i, '');
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) throw new Error('仅支持 HTTP(S) 网站');
  let authority = source.split(/[/?#]/, 1)[0];
  const wildcard = authority.startsWith('*.');
  if (wildcard) authority = authority.slice(2);
  if (!authority || authority.endsWith(':') || /[\s@*\\]/.test(authority)) throw new Error('网站域名无效');
  const parsed = new URL('http://' + authority);
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const address = hostname.replace(/^\[|\]$/g, '');
  const ip = Boolean(isIP(address));
  if (!hostname || wildcard && ip || !ip && !/^(?:[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?\.)*[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/.test(hostname)) {
    throw new Error('网站域名无效');
  }
  const portMatch = authority.match(hostname.startsWith('[') ? /\]:(\d+)$/ : /:(\d+)$/);
  const port = portMatch ? Number(portMatch[1]) : null;
  if (port !== null && (!Number.isInteger(port) || port < 1 || port > 65535)) throw new Error('网站端口无效');
  return Object.freeze({ hostname, port, ip });
}

function parseWebsiteList(raw, label) {
  const values = String(raw || '').split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
  if (values.length > 200) throw new Error(`${label}最多支持 200 条网站规则`);
  const unique = new Map();
  for (const value of values) {
    let rule;
    try { rule = parseWebsiteRule(value); }
    catch (_) { throw new Error(`${label}包含无效网站规则，请检查域名或端口`); }
    unique.set(JSON.stringify(rule), rule);
  }
  return Object.freeze([...unique.values()]);
}

function matchesWebsite(url, rules) {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
  return rules.some((rule) => (rule.port === null || rule.port === port)
    && (hostname === rule.hostname || !rule.ip && hostname.endsWith('.' + rule.hostname)));
}

function compileUrlAccessPolicy(profile = {}) {
  const allow = parseWebsiteList(profile.advanced?.allowUrls, '网址白名单');
  const block = parseWebsiteList(profile.advanced?.blockUrls, '网址黑名单');
  return Object.freeze({
    active: Boolean(allow.length || block.length),
    blocks(value) {
      const raw = String(value || '');
      if (!/^https?:/i.test(raw)) return false;
      let url;
      try { url = new URL(raw); } catch (_) { return true; }
      return matchesWebsite(url, block) || Boolean(allow.length && !matchesWebsite(url, allow));
    },
  });
}

function assertUrlAccessPolicySupported(profile, engine = 'chromium') {
  const policy = compileUrlAccessPolicy(profile);
  if (engine === 'firefox' && policy.active) {
    const error = new Error('Firefox 当前不支持网址白名单/黑名单拦截，请清空网站规则或选择 Chromium 内核');
    error.code = 'URL_POLICY_UNSUPPORTED';
    throw error;
  }
  return policy;
}

function blockedPageHtml(value) {
  let display = '';
  try {
    const url = new URL(value);
    display = url.origin + url.pathname;
  } catch (_) {}
  const safe = display.slice(0, 300).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>无法访问该网页</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f0f0f0;font:14px sans-serif;color:#111213}main{max-width:384px;padding:24px;text-align:center}p{color:#666;overflow-wrap:anywhere}</style></head><body><main><h1>无法访问该网页</h1><p>该网址已被管理员禁止访问。</p><p>${safe}</p></main></body></html>`;
}

module.exports = { compileUrlAccessPolicy, assertUrlAccessPolicySupported, blockedPageHtml };

import { h as api } from './utils-BIWenCnY.js';
import { o as proxyStatus } from './proxy-D7e36h-l.js';
import { r as getNextWindowName } from './utils-CnUy4XUk.js';

const secondarySuffix = new Set(['ac', 'co', 'com', 'edu', 'go', 'gov', 'ne', 'net', 'or', 'org']);
export function toUrlOptions(rows) {
  return (rows ?? []).map(row => ({
    image: row.platformIcon, darkImage: row.platformIconDark, label: row.platformUrl ?? '', value: row.platformUrl ?? '',
  }));
}
export function optionsWithIcons(options) { return (options ?? []).filter(option => option.image || option.darkImage); }
function hostname(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  try {
    const url = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : 'https://' + text;
    return new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return '';
  }
}
function domain(value) {
  const host = hostname(value);
  if (host.includes(':') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return '';
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return '';
  const count = parts.length >= 3 && parts.at(-1).length === 2 && secondarySuffix.has(parts.at(-2)) ? 3 : 2;
  return parts.slice(-count).join('.');
}
export function matchPlatform(value, options) {
  if (typeof value !== 'string' || !value.trim() || !options?.length) return;
  const exact = options.find(option => option.value === value);
  if (exact) return exact;
  const host = hostname(value);
  const sameHost = host && options.find(option => option.value && hostname(option.value) === host);
  if (sameHost) return sameHost;
  const root = domain(value);
  if (root) return options.find(option => option.value && domain(option.value) === root);
}
function abbreviation(account, options) {
  return String(account?.platformAbbr ?? '').trim() || matchPlatform(account?.platformUrl, options)?.platformAbbr?.trim() || '';
}
export function accountLabels(account, options) {
  const platform = abbreviation(account, options);
  return platform ? {
    account: $t('{platform} 登录账号', { platform }), password: $t('{platform} 登录密码', { platform }),
  } : { account: $t('平台登录账号'), password: $t('平台登录密码') };
}
export function platformAbbreviations(rows) {
  return (rows ?? []).flatMap(row => {
    const url = row.platformUrl ?? '';
    const platformAbbr = String(row.platformAbbr ?? '').trim();
    return url && platformAbbr ? [{ label: url, value: url, platformAbbr }] : [];
  });
}
export async function loadPlatformAbbreviations() {
  try {
    const { code, data } = await api.platform.userGetPlatformInfoList({});
    return code === 0 ? platformAbbreviations(data?.rows) : [];
  } catch (error) {
    console.error('[fetchPlatformAbbrCatalog] failed to load platform catalog', error);
    return [];
  }
}
function proxyCountry(proxy) {
  if (!proxy || proxy.checkStatus === proxyStatus.failure) return '';
  const method = String(proxy.proxyMethod ?? '').toLowerCase();
  const protocol = String(proxy.proxyCategory || proxy.protocol || '').toLowerCase();
  if (method === 'noproxy' || protocol === 'noproxy') return '';
  if (!['custom', 'choose', 'api'].includes(method) && !proxy.host && !proxy.id) return '';
  const valid = proxy.checkStatus === proxyStatus.success || Boolean(String(proxy.lastIp ?? '').trim());
  return valid ? String(proxy.lastCountry ?? '').trim().toUpperCase() : '';
}
export function nameForProfile(base, { accounts, proxyList }, options) {
  const platform = (accounts ?? []).map(account => abbreviation(account, options)).find(Boolean);
  const country = Array.isArray(proxyList) && proxyList.map(proxyCountry).find(Boolean);
  return [platform, country, base].filter(Boolean).join('-');
}
export async function generateProfileName(input) {
  const [base, options] = await Promise.all([getNextWindowName(), loadPlatformAbbreviations()]);
  if (base) return nameForProfile(base, input, options);
}
export function suggestedName(profile) { return String(profile?.suggestedWindowName ?? '').trim(); }

import { o as CheckStatus } from './proxy-D7e36h-l.js';
import { n as api } from './api-BToUsmQq.js';
import { i as apiSucceeded } from './apiError-BDM3pKoT.js';

const batchSize = 500;
const supportedTypes = new Set(['socks5', 'http', 'https']);
const text = value => typeof value === 'string' ? value.trim() : '';

function timestamp(value) {
  const raw = String(value ?? '');
  if (/^\d{10,13}$/.test(raw)) return Number(raw) * (raw.length <= 10 ? 1000 : 1);
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}
function normalizeCheck(phoneId, check) {
  const lastIp = text(check.lastIp);
  const lastCountry = text(check.lastCountry);
  const isSuccess = check.checkStatus === true || check.checkStatus === CheckStatus.success;
  const isFailure = check.checkStatus === false || check.checkStatus === CheckStatus.failure;
  if (!isSuccess && !isFailure && !lastIp) return;
  const country = [text(check.countryCode), lastCountry].find(value => /^[a-z]{2}$/i.test(value));
  const proxyType = text(check.proxyType).toLowerCase();
  const proxyPort = Number(check.proxyPort);
  const result = { phoneId, lastIp, lastCountry, checkStatus: !isFailure, checkAt: timestamp(check.checkTime) };
  if (supportedTypes.has(proxyType)) result.proxyType = proxyType;
  if (Number.isFinite(proxyPort) && proxyPort > 0) result.proxyPort = proxyPort;
  if (country) result.countryCode = country.toUpperCase();
  for (const key of ['proxyServer', 'lastCity', 'timezone', 'isp']) {
    const value = text(check[key]);
    if (value) result[key] = value;
  }
  return result;
}

async function persistChecksForBoundPhones(checks) {
  const normalized = new Map();
  for (const check of checks) {
    for (const value of check.phoneIds) {
      const phoneId = text(value);
      const result = phoneId && normalizeCheck(phoneId, check);
      if (result) normalized.set(phoneId, result);
    }
  }
  const results = [...normalized.values()];
  try {
    for (let offset = 0; offset < results.length; offset += batchSize) {
      const status = await api.phone.v1CloudphonesPhoneBatchProxyCheckCreate({ proxyList: results.slice(offset, offset + batchSize) });
      if (!apiSucceeded(status)) throw Error(status?.msg || 'Could not save proxy check results');
    }
    return true;
  } catch (error) {
    console.error('[CloudPhone] batch proxy check failed', error);
    return false;
  }
}

export { persistChecksForBoundPhones, persistChecksForBoundPhones as t };

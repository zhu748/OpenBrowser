import { Tr as parseRules, xr as isEmpty } from './utils-BIWenCnY.js';
import { r as IpType } from './proxy-D7e36h-l.js';

const failure = message => ({ ok: false, message });
function responseError(text) {
  if (!text.startsWith('{')) return;
  try {
    const value = JSON.parse(text);
    if (value && typeof value === 'object' && ['code', 'message', 'msg'].some(key => Object.hasOwn(value, key))) {
      return value.message || value.msg || $t('提取失败');
    }
  } catch { /* A bracketed IPv6 address is also an accepted response. */ }
}
async function extractAddress(url, protocol = 'SOCKS5') {
  const extraUrl = String(url ?? '').trim();
  if (!extraUrl) return failure($t('请输入提取链接'));
  try {
    const { status, body } = await globalThis.electronAPI.send('proxy:extract', extraUrl);
    const text = String(body ?? '').trim();
    if (!text) return failure($t('提取失败'));
    const message = responseError(text);
    if (message || status >= 400) return failure(message || text);
    const { host, port, proxyUserName, proxyPassword } = parseRules(text);
    if (!host || !port) return failure($t('提取结果格式错误'));
    return { ok: true, connection: { host: host.replace(/[\[\]]/g, ''), port: String(port), proxyUserName: proxyUserName ?? '', proxyPassword: proxyPassword ?? '',
      ipType: host.startsWith('[') ? IpType.IPV6 : IpType.IPV4, protocol, proxyCategory: protocol, extraUrl } };
  } catch (error) {
    return failure((error instanceof Error ? error.message : String(error ?? '')) || $t('提取失败'));
  }
}
async function extractAndCheck({ extraUrl, proxyCategory, checkChannel, isDirect, testProxy }) {
  const result = await extractAddress(extraUrl, proxyCategory || 'SOCKS5');
  if (!result.ok) return result;
  const { connection } = result;
  return { ...result, checkResult: await testProxy({ ...connection, checkChannel, isDirect, apiCheck: false }) };
}
async function prepareProxy(profile, { checkChannel, isDirect, testProxy }) {
  if (profile.proxyMethod !== 'api' || !String(profile.extraUrl ?? '').trim() || !isEmpty(profile.host) || !globalThis.isElectron) return profile;
  const result = await extractAndCheck({ extraUrl: profile.extraUrl, proxyCategory: String(profile.proxyCategory || profile.protocol || 'SOCKS5'), checkChannel, isDirect, testProxy });
  if (!result.ok) return profile;
  const { lastIp, lastCity, lastCountry, timezone, checkStatus, checkTime } = result.checkResult;
  return { ...profile, ...result.connection, proxyMethod: 'api', moduleId: 0, lastIp: lastIp ?? '', lastCity: lastCity ?? '',
    lastCountry: lastCountry ?? '', timezone, checkStatus, checkTime };
}
export { extractAndCheck as n, prepareProxy as t };

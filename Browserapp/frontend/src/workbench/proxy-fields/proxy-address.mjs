import { r as IpType } from './proxy-D7e36h-l.js';

const schemePattern = /^(https?|socks5|ssh):\/\//i;
function validPort(port) {
  return /^\d{1,5}$/.test(port) && Number(port) >= 1 && Number(port) <= 65535;
}
function splitHost(address) {
  if (address.startsWith('[')) {
    const end = address.indexOf(']:');
    if (end <= 1) return null;
    return { host: address.slice(1, end), ipv6: true, rest: address.slice(end + 2) };
  }
  const colon = address.indexOf(':');
  const host = address.slice(0, colon);
  if (colon <= 0 || !host || host.includes('/')) return null;
  return { host, ipv6: false, rest: address.slice(colon + 1) };
}
function takeSuffix(address, opener, closer) {
  const start = address.endsWith(closer) ? address.lastIndexOf(opener) : -1;
  return start > 0 ? [address.slice(0, start), address.slice(start + 1, -1)] : [address];
}
function parseProxyAddress(input) {
  let address = input.trim().split(/\r?\n/, 1)[0].replace(/^['"]+|['"]+$/g, '').replace(/\s/g, '').replace(/：/g, ':');
  if (!address.includes(':')) return null;
  const scheme = address.match(schemePattern);
  if (scheme) address = address.slice(scheme[0].length);
  let remark, refreshUrl;
  [address, remark] = takeSuffix(address, '{', '}');
  [address, refreshUrl] = takeSuffix(address, '[', ']');
  const at = address.lastIndexOf('@');
  const endpoint = splitHost(address.slice(at > 0 ? at + 1 : 0));
  if (!endpoint) return null;
  const [port, login, ...passwordParts] = endpoint.rest.split(':');
  if (!validPort(port) || (at > 0 && login !== undefined)) return null;
  let username = login;
  let password = passwordParts.length ? passwordParts.join(':') : undefined;
  if (at > 0) {
    const credentials = address.slice(0, at);
    const colon = credentials.indexOf(':');
    username = colon < 0 ? credentials : credentials.slice(0, colon);
    password = colon < 0 ? '' : credentials.slice(colon + 1);
  }
  return {
    ipType: endpoint.ipv6 ? IpType.IPV6 : IpType.IPV4, host: endpoint.host, port,
    ...(username !== undefined && { proxyUserName: username }),
    ...(password !== undefined && { proxyPassword: password }),
    ...(scheme && { proxyCategory: scheme[1].toUpperCase() }),
    ...(refreshUrl !== undefined && { refreshUrl }), ...(remark !== undefined && { remark }),
  };
}
function proxyAddressFields({ ipType, host, port, proxyUserName, proxyPassword, proxyCategory, refreshUrl }, options) {
  return { ipType, host, port,
    ...(proxyUserName !== undefined && { proxyUserName }), ...(proxyPassword !== undefined && { proxyPassword }),
    ...(proxyCategory && { proxyCategory }), ...(options?.includeRefreshUrl !== false && refreshUrl !== undefined && { refreshUrl }),
  };
}

export { parseProxyAddress, proxyAddressFields };

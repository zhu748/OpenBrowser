'use strict';

const { isIP } = require('node:net');
const dns = require('node:dns');

/** Canonicalize URL/DNS host spelling before applying either caller's policy. */
function normalizeHostname(value) {
  let host = String(value || '').trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (isIP(host) !== 6) return host;
  // WHATWG canonicalization handles expanded and dotted IPv6 spellings alike.
  host = new URL(`http://[${host}]/`).hostname.slice(1, -1);
  const mapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!mapped) return host;
  const high = Number.parseInt(mapped[1], 16);
  const low = Number.parseInt(mapped[2], 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

function isCloudMetadataHostname(value) {
  const host = normalizeHostname(value);
  return !host || host === 'metadata' || host === 'metadata.google.internal'
    || host.endsWith('.metadata.google.internal')
    || host === '169.254.169.254' || host === '169.254.170.2';
}

function isPrivateOrLocalHostname(value) {
  const host = normalizeHostname(value);
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '::' || host === '::1') return true;
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (match) {
    const parts = match.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return true;
    const [a, b] = parts;
    return a === 0 || a === 10 || a === 127
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
      || (a === 198 && (b === 18 || b === 19));
  }
  if (isIP(host) === 6) {
    const first = Number.parseInt(host.split(':')[0] || '0', 16);
    return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80;
  }
  return false;
}

/** Validate the very DNS answers the socket will use, avoiding a second lookup. */
function createPolicyLookup({ allowPrivate = false, lookup = dns.lookup } = {}) {
  return (hostname, options, callback) => {
    if (typeof options === 'function') { callback = options; options = {}; }
    const settings = typeof options === 'number' ? { family: options } : (options || {});
    lookup(hostname, { ...settings, all: true }, (error, addresses) => {
      if (error) { callback(error); return; }
      if (!Array.isArray(addresses) || !addresses.length || addresses.some((entry) => !isIP(entry?.address || ''))) {
        callback(Object.assign(new Error('DNS returned no valid addresses'), { code: 'ENOTFOUND' }));
        return;
      }
      for (const { address } of addresses) {
        const metadata = isCloudMetadataHostname(address);
        if (metadata || (!allowPrivate && isPrivateOrLocalHostname(address))) {
          callback(Object.assign(new Error(metadata ? '出站 DNS 解析指向云 metadata（防 SSRF）' : '出站 DNS 解析指向本机/内网地址（防 SSRF）'), { code: 'OUTBOUND_ADDRESS_BLOCKED' }));
          return;
        }
      }
      if (settings.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

module.exports = { normalizeHostname, isCloudMetadataHostname, isPrivateOrLocalHostname, createPolicyLookup };

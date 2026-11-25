'use strict';

/**
 * Multi-version browser kernel catalogs and Firefox launch plan builders.
 *
 * Everything in this module is pure: no fs, no network, no child processes.
 * The manager (browser-kernel.js) owns IO; selftests feed fixtures in here.
 *
 * Version sources:
 *   Chromium — Chrome for Testing "known-good-versions-with-downloads.json"
 *     (per-version archive URLs on storage.googleapis.com).
 *   Firefox — product-details.mozilla.org firefox.json (release history with
 *     categories) + firefox_versions.json (current ESR), and per-release
 *     SHA256SUMS on download-installer.cdn.mozilla.net, which doubles as the
 *     authoritative artifact list AND the digest for every download.
 */

const { compareVersions } = require('./version-compare');

const kernelVersionBase = value => value.endsWith('esr')
  ? value.replace(/^(\d+(?:\.\d+)*)esr$/, '$1') : value;

/**
 * ESR is a release channel, not an extra numeric segment. Compare Mozilla's
 * glued ESR versions by their base before using the original labels to break
 * ties (same-version ESR still sorts ahead of the plain release).
 */
function compareKernelVersions(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a === b) return 0;
  return compareVersions(kernelVersionBase(a), kernelVersionBase(b)) || (a > b ? 1 : -1);
}

/** CfT feed with per-version download URLs (~5.3 MiB as of 2026-11). */
const CHROMIUM_CATALOG_URL = 'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json';
/** The feed is much larger than the 2 MiB meta cap in browser-kernel.js. */
const CHROMIUM_CATALOG_MAX_BYTES = 12 * 1024 * 1024;
const CHROMIUM_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
/**
 * Majors kept in the UI list, newest major first. The CfT feed carries dozens
 * of point builds per major; mainstream fingerprint browsers offer one kernel
 * per major (Chrome 146/147/148/149/150…), so the catalog keeps the newest
 * known-good build of each major instead of a flat stream of builds.
 */
const CHROMIUM_CATALOG_MAJOR_LIMIT = 15;

/** Mozilla release history (flat, ~650 KiB) and current-channel versions. */
const FIREFOX_RELEASES_URL = 'https://product-details.mozilla.org/1.0/firefox.json';
const FIREFOX_VERSIONS_URL = 'https://product-details.mozilla.org/1.0/firefox_versions.json';
const FIREFOX_CDN_BASE = 'https://download-installer.cdn.mozilla.net/pub/firefox/releases/';
const FIREFOX_LOCALE = 'en-US';
/** Majors offered in the UI, aligned with the Chromium list. */
const FIREFOX_CATALOG_MAJOR_LIMIT = 15;
const FIREFOX_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

const SHA256_HEX = /^[0-9a-f]{64}$/;

/** CfT platform key matching browser-kernel.js cftPlatformKey(). */
function chromiumCatalogPlatform(platform = process.platform, arch = process.arch) {
  if (platform === 'darwin') return arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  if (platform === 'win32') return arch === 'arm64' ? 'win64' : 'win64'; // no arm64 CfT build; x64 emulation
  if (platform === 'linux') return arch === 'arm64' ? 'linux-arm64' : 'linux64';
  return '';
}

function chromiumUrlForVersion(version, platform) {
  const key = String(platform || chromiumCatalogPlatform());
  return `https://storage.googleapis.com/chrome-for-testing-public/${version}/${key}/chrome-${key}.zip`;
}

/**
 * CfT feed → exactly one entry per major version, newest major first: for
 * every major (146/147/148/149/150…) the newest known-good build that has a
 * chrome download for this platform. Point builds within a major collapse
 * into that single row; majors without a platform build are dropped.
 */
function filterChromiumCatalog(feed, platform, limit = CHROMIUM_CATALOG_MAJOR_LIMIT) {
  const key = String(platform || chromiumCatalogPlatform());
  const versions = Array.isArray(feed?.versions) ? feed.versions : [];
  const byMajor = new Map();
  for (const entry of versions) {
    const version = String(entry?.version || '').trim();
    if (!/^\d+(?:\.\d+){0,3}$/.test(version)) continue;
    const chrome = Array.isArray(entry?.downloads?.chrome) ? entry.downloads.chrome : [];
    const hit = chrome.find((item) => item && item.platform === key && /^https:\/\//.test(String(item.url || '')));
    if (!hit) continue;
    const major = Number(version.split('.')[0]);
    if (!Number.isInteger(major) || major <= 0) continue;
    const candidate = { version, url: String(hit.url), major };
    const incumbent = byMajor.get(major);
    if (!incumbent || compareKernelVersions(version, incumbent.version) > 0) byMajor.set(major, candidate);
  }
  const out = [...byMajor.values()].sort((a, b) => b.major - a.major);
  return out.slice(0, Math.max(1, Number(limit) || CHROMIUM_CATALOG_MAJOR_LIMIT));
}

/** Mozilla platform directory used in release paths and SHA256SUMS. */
function firefoxPlatformDir(platform = process.platform, arch = process.arch) {
  if (platform === 'linux') return arch === 'arm64' ? 'linux-aarch64' : 'linux-x86_64';
  if (platform === 'darwin') return 'mac'; // universal dmg covers x64 + arm64
  if (platform === 'win32') return arch === 'arm64' ? 'win64-aarch64' : 'win64';
  return '';
}

/**
 * Candidate artifact paths for a platform, most preferred first.
 * Windows prefers the MSI (admin-extractable without running an installer);
 * the plain .exe is the silent-install fallback (and the only win64-aarch64 form).
 */
function firefoxArtifactCandidates(platformDir, version, locale = FIREFOX_LOCALE) {
  const dir = String(platformDir || '');
  const v = String(version || '');
  switch (dir) {
    case 'linux-x86_64':
      return [{ relPath: `linux-x86_64/${locale}/firefox-${v}.tar.xz`, kind: 'tar.xz' }];
    case 'linux-aarch64':
      return [{ relPath: `linux-aarch64/${locale}/firefox-${v}.tar.xz`, kind: 'tar.xz' }];
    case 'mac':
      return [{ relPath: `mac/${locale}/Firefox ${v}.dmg`, kind: 'dmg' }];
    case 'win64':
      return [
        { relPath: `win64/${locale}/Firefox Setup ${v}.msi`, kind: 'msi' },
        { relPath: `win64/${locale}/Firefox Setup ${v}.exe`, kind: 'exe' },
      ];
    case 'win64-aarch64':
      return [
        { relPath: `win64-aarch64/${locale}/Firefox Setup ${v}.msi`, kind: 'msi' },
        { relPath: `win64-aarch64/${locale}/Firefox Setup ${v}.exe`, kind: 'exe' },
      ];
    default:
      return [];
  }
}

/** SHA256SUMS text → Map(relPath → sha256). Malformed lines are skipped. */
function parseSha256Sums(text) {
  const map = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.match(/^([0-9a-fA-F]{64})\s{2}(.+)$/);
    if (!match) continue;
    const relPath = match[2].replace(/\\/g, '/').trim();
    if (!relPath || relPath.startsWith('/')) continue;
    map.set(relPath, match[1].toLowerCase());
  }
  return map;
}

/** Pick the best available artifact for this platform from a parsed SHA256SUMS. */
function firefoxArtifactFor(platformDir, version, sums, locale = FIREFOX_LOCALE) {
  const map = sums instanceof Map ? sums : parseSha256Sums(sums);
  for (const candidate of firefoxArtifactCandidates(platformDir, version, locale)) {
    const sha256 = map.get(candidate.relPath);
    if (SHA256_HEX.test(String(sha256 || ''))) {
      return { ...candidate, sha256 };
    }
  }
  return null;
}

/** Encode each path segment, keeping slashes: "mac/en-US/Firefox 141.0.dmg" → %20. */
function firefoxCdnUrl(versionFolder, relPath) {
  const folder = encodeURIComponent(String(versionFolder || ''));
  const encoded = String(relPath || '').split('/').map(encodeURIComponent).join('/');
  return `${FIREFOX_CDN_BASE}${folder}/${encoded}`;
}

/** Where SHA256SUMS lives for a release (ESR keeps its "esr" suffix in the folder). */
function firefoxSumsUrl(versionFolder) {
  return `${FIREFOX_CDN_BASE}${encodeURIComponent(String(versionFolder || ''))}/SHA256SUMS`;
}

/**
 * firefox.json + firefox_versions.json → [{version, channel}] newest first.
 * For every major release the newest point release is offered; the current
 * ESR is appended as its own channel entry (it keeps the "esr" suffix).
 */
function filterFirefoxCatalog(releases, currentVersions, limit = FIREFOX_CATALOG_MAJOR_LIMIT) {
  const entries = releases && typeof releases === 'object' ? Object.values(releases.releases || releases) : [];
  const byMajor = new Map();
  for (const entry of entries) {
    const version = String(entry?.version || '').trim();
    if (!/^\d+(?:\.\d+){0,3}$/.test(version)) continue;
    const category = String(entry?.category || '');
    if (category !== 'major' && category !== 'stability') continue;
    const major = Number(version.split('.')[0]);
    if (!Number.isInteger(major) || major <= 0) continue;
    const previous = byMajor.get(major);
    if (!previous || compareKernelVersions(version, previous) > 0) byMajor.set(major, version);
  }
  const out = [...byMajor.keys()].sort((a, b) => b - a)
    .slice(0, Math.max(1, Number(limit) || FIREFOX_CATALOG_MAJOR_LIMIT))
    .map((major) => ({ version: byMajor.get(major), channel: 'release' }));
  const esr = String(currentVersions?.FIREFOX_ESR || '').trim();
  if (/^\d+(?:\.\d+){0,3}esr$/.test(esr)) {
    out.push({ version: esr, channel: 'esr' });
    out.sort((a, b) => compareKernelVersions(b.version, a.version));
  }
  return out;
}

/** Static binary location inside an extracted tree, by platform. */
function firefoxBinaryRelative(platformDir) {
  switch (String(platformDir || '')) {
    case 'linux-x86_64':
    case 'linux-aarch64':
      return 'firefox/firefox';
    case 'mac':
      return 'Firefox.app/Contents/MacOS/firefox';
    case 'win64':
    case 'win64-aarch64':
      return 'firefox.exe';
    default:
      return 'firefox/firefox';
  }
}

/** Strip the esr/beta suffix for UA rendering: "153.6.0esr" → "153.6.0". */
function firefoxUaVersion(version) {
  return String(version || '').replace(/(?:esr|b\d+)$/i, '');
}

/** Firefox major-segment UA (frozen at major since Gecko 129): 159.0.1 → 159.0. */
function firefoxUserAgent(osName, version, { shortVersion = false, productVersion } = {}) {
  const major = Number(firefoxUaVersion(version).split('.')[0]) || 0;
  const rv = major > 0 ? `${major}.0` : String(firefoxUaVersion(version));
  if (productVersion !== undefined && (!/^\d+\.\d+\.\d+$/.test(productVersion) || Number(productVersion.split('.')[0]) !== major))
    throw Error('Firefox UA product version must match the selected major');
  productVersion ??= shortVersion && major > 0 ? String(major) : rv;
  const os = String(osName || '').toLowerCase();
  if (os.startsWith('win')) {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${rv}) Gecko/20100101 Firefox/${productVersion}`;
  }
  if (os.startsWith('mac')) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${rv}) Gecko/20100101 Firefox/${productVersion}`;
  }
  return `Mozilla/5.0 (X11; Linux x86_64; rv:${rv}) Gecko/20100101 Firefox/${productVersion}`;
}

/** "socks5://127.0.0.1:8080" | "http://h:80" → {scheme, host, port} or null. */
function parseProxyEndpoint(endpoint) {
  const text = String(endpoint || '').trim();
  if (!text || /^direct:\/\//i.test(text)) return null;
  const match = text.match(/^(?:(https?|socks5h?|socks4):\/\/)?([^:@\s/]+):(\d{2,5})$/i);
  if (!match) return null;
  const port = Number(match[3]);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
  const scheme = String(match[1] || 'http').toLowerCase().replace('socks5h', 'socks5');
  return { scheme, host: match[2], port };
}

function userPref(key, value) {
  return `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
}

/**
 * Build the user.js body applied before every launch.
 * Direct uses manual mode with empty endpoints so an older launch's persisted
 * proxy settings cannot be inherited.
 *
 * extraPrefs: optional ordered [key, value] pairs appended by the launch
 * pipeline. Defined values override the base preferences. Undefined values
 * are handled by the profile-file writer when restoring native defaults.
 */
function buildFirefoxUserJs({ userAgent, acceptLanguages, locale, proxyEndpoint, noProxyHosts, extraPrefs }) {
  const lines = [];
  if (userAgent) lines.push(userPref('general.useragent.override', userAgent));
  // intl.locale.requested is neutral for the Accept-Language surfaces (verified live on 160:
  // accept "de-DE,de" ships header "de-DE,de;q=0.9" with clean navigator.languages, requested
  // locale set or not); it keeps the chrome UI coherent with the claimed locale.
  if (acceptLanguages) lines.push(userPref('intl.accept_languages', acceptLanguages));
  if (locale) lines.push(userPref('intl.locale.requested', locale));
  const proxy = parseProxyEndpoint(proxyEndpoint);
  lines.push(userPref('network.proxy.type', 1));
  const socks = proxy && (proxy.scheme === 'socks5' || proxy.scheme === 'socks4');
  for (const key of ['http', 'ssl', 'socks']) {
    const endpoint = (key === 'socks' ? socks : !socks) ? proxy : null;
    lines.push(userPref(`network.proxy.${key}`, endpoint?.host || ''));
    lines.push(userPref(`network.proxy.${key}_port`, endpoint?.port || 0));
  }
  lines.push(userPref('network.proxy.socks_version', proxy?.scheme === 'socks4' ? 4 : 5));
  lines.push(userPref('network.proxy.socks_remote_dns', Boolean(socks)));
  lines.push(userPref('network.proxy.no_proxies_for', proxy && noProxyHosts ? noProxyHosts : ''));
  // The kernel is managed by OpenBrowser: no self-updates, no telemetry,
  // no first-run dialogs, no default-browser prompts.
  lines.push(userPref('app.update.enabled', false));
  lines.push(userPref('app.update.auto', false));
  lines.push(userPref('extensions.update.enabled', false));
  lines.push(userPref('browser.shell.checkDefaultBrowser', false));
  lines.push(userPref('browser.aboutConfig.showWarning', false));
  lines.push(userPref('datareporting.healthreport.uploadEnabled', false));
  lines.push(userPref('datareporting.policy.dataSubmissionPolicyBypassNotification', false));
  lines.push(userPref('datareporting.policy.dataSubmissionEnabled', false));
  lines.push(userPref('toolkit.telemetry.enabled', false));
  for (const [key, value] of Array.isArray(extraPrefs) ? extraPrefs : []) {
    if (!key || value === undefined) continue;
    lines.push(userPref(key, value));
  }
  return lines.join('\n') + '\n';
}

/** Firefox CLI for a launch: -profile <root>, --no-remote, optional -headless, URL(s). */
function firefoxStartupArgs({ root, startUrl, extraUrls, headless, remoteDebugging = false }) {
  const args = ['-profile', String(root)];
  args.push('--no-remote');
  if (remoteDebugging) args.push('--remote-debugging-port=0');
  if (headless) args.push('-headless');
  const first = String(startUrl || 'about:blank');
  const rest = (Array.isArray(extraUrls) ? extraUrls : [])
    .map((url) => String(url || '').trim())
    .filter(Boolean);
  args.push(first);
  for (const url of rest) args.push(url);
  return args;
}

module.exports = {
  CHROMIUM_CATALOG_URL,
  CHROMIUM_CATALOG_MAX_BYTES,
  CHROMIUM_CATALOG_TTL_MS,
  CHROMIUM_CATALOG_MAJOR_LIMIT,
  FIREFOX_RELEASES_URL,
  FIREFOX_VERSIONS_URL,
  FIREFOX_LOCALE,
  FIREFOX_CATALOG_TTL_MS,
  chromiumCatalogPlatform,
  chromiumUrlForVersion,
  filterChromiumCatalog,
  firefoxPlatformDir,
  parseSha256Sums,
  firefoxArtifactFor,
  firefoxCdnUrl,
  firefoxSumsUrl,
  filterFirefoxCatalog,
  firefoxBinaryRelative,
  firefoxUserAgent,
  parseProxyEndpoint,
  buildFirefoxUserJs,
  firefoxStartupArgs,
  compareKernelVersions,
};

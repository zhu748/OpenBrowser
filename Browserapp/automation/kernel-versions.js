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

/**
 * compareVersions knows semver prereleases ("-esr") but not Mozilla's glued
 * "esr" suffix ("153.6.0esr" fails its numeric-part regex and compares as 0).
 * Ordering inside this module always goes through here so catalog sorting
 * stays correct for both forms.
 */
function compareKernelVersions(left, right) {
  const l = compareVersions(String(left || ''), String(right || ''));
  if (l !== 0) return l;
  // Same numbers; fall back to a plain string compare so a glued esr/beta
  // suffix still orders deterministically instead of collapsing to a tie.
  const a = String(left || '');
  const b = String(right || '');
  return a === b ? 0 : (a > b ? 1 : -1);
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

/** Release archive kind per platform (tar.xz / dmg / msi / exe). */
function firefoxArchiveKindForPlatform(platformDir) {
  const dir = String(platformDir || '');
  if (dir === 'mac') return 'dmg';
  if (dir === 'win64' || dir === 'win64-aarch64') return 'msi';
  return 'tar.xz';
}

/**
 * firefox.json + firefox_versions.json → [{version, channel}] newest first.
 * For every major release the newest point release is offered; the current
 * ESR is appended as its own channel entry (it keeps the "esr" suffix).
 */
function filterFirefoxCatalog(releases, currentVersions, limit = FIREFOX_CATALOG_MAJOR_LIMIT) {
  const entries = releases && typeof releases === 'object' ? Object.values(releases.releases || releases) : [];
  const pool = [];
  for (const entry of entries) {
    const version = String(entry?.version || '').trim();
    if (!/^\d+(?:\.\d+){0,3}$/.test(version)) continue;
    const category = String(entry?.category || '');
    if (category !== 'major' && category !== 'stability') continue;
    if (pool.some((item) => item === version)) continue;
    pool.push(version);
  }
  const majors = [];
  for (const version of pool) {
    const major = Number(version.split('.')[0]);
    if (!Number.isInteger(major) || major <= 0) continue;
    if (!majors.some((item) => item.major === major)) majors.push({ major, version });
  }
  majors.sort((a, b) => b.major - a.major);
  const recentMajors = majors.slice(0, Math.max(1, Number(limit) || FIREFOX_CATALOG_MAJOR_LIMIT));
  const out = [];
  for (const item of recentMajors) {
    // newest point release for this major (159.0 → 159.0.1)
    const best = pool
      .filter((version) => Number(version.split('.')[0]) === item.major)
      .sort((a, b) => compareKernelVersions(b, a))[0];
    if (best && !out.some((entry) => entry.version === best)) out.push({ version: best, channel: 'release' });
  }
  const esr = String(currentVersions?.FIREFOX_ESR || '').trim();
  if (/^\d+(?:\.\d+){0,3}esr$/.test(esr) && !out.some((entry) => entry.version === esr)) {
    out.push({ version: esr, channel: 'esr' });
  }
  out.sort((a, b) => compareKernelVersions(b.version, a.version));
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
function firefoxUserAgent(osName, version) {
  const major = Number(firefoxUaVersion(version).split('.')[0]) || 0;
  const rv = major > 0 ? `${major}.0` : String(firefoxUaVersion(version));
  const os = String(osName || '').toLowerCase();
  if (os.startsWith('win')) {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${rv}) Gecko/20100101 Firefox/${rv}`;
  }
  if (os.startsWith('mac')) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${rv}) Gecko/20100101 Firefox/${rv}`;
  }
  return `Mozilla/5.0 (X11; Linux x86_64; rv:${rv}) Gecko/20100101 Firefox/${rv}`;
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
 * Manual-empty proxy (type 1, no hosts) is used for Direct so Firefox can
 * never fall back to the host's system proxy (type 0 would).
 */
function buildFirefoxUserJs({ userAgent, acceptLanguages, locale, proxyEndpoint, noProxyHosts }) {
  const lines = [];
  if (userAgent) lines.push(userPref('general.useragent.override', userAgent));
  if (acceptLanguages) lines.push(userPref('intl.accept_languages', acceptLanguages));
  if (locale) lines.push(userPref('intl.locale.requested', locale));
  const proxy = parseProxyEndpoint(proxyEndpoint);
  lines.push(userPref('network.proxy.type', 1));
  if (proxy) {
    if (proxy.scheme === 'socks5' || proxy.scheme === 'socks4') {
      lines.push(userPref('network.proxy.socks', proxy.host));
      lines.push(userPref('network.proxy.socks_port', proxy.port));
      lines.push(userPref('network.proxy.socks_version', proxy.scheme === 'socks4' ? 4 : 5));
      lines.push(userPref('network.proxy.socks_remote_dns', true));
    } else {
      for (const key of ['http', 'ssl', 'share']) {
        lines.push(userPref(`network.proxy.${key}`, proxy.host));
        lines.push(userPref(`network.proxy.${key}_port`, proxy.port));
      }
    }
    if (noProxyHosts) lines.push(userPref('network.proxy.no_proxies_for', noProxyHosts));
  }
  // The kernel is managed by OpenBrowser: no self-updates, no telemetry,
  // no first-run dialogs, no default-browser prompts.
  lines.push(userPref('app.update.enabled', false));
  lines.push(userPref('app.update.auto', false));
  lines.push(userPref('extensions.update.enabled', false));
  lines.push(userPref('browser.shell.checkDefaultBrowser', false));
  lines.push(userPref('browser.aboutConfig.showWarning', false));
  lines.push(userPref('datareporting.healthreport.uploadEnabled', false));
  lines.push(userPref('datareporting.policy.dataSubmissionEnabled', false));
  lines.push(userPref('toolkit.telemetry.enabled', false));
  return lines.join('\n') + '\n';
}

/** Firefox CLI for a launch: -profile <root>, --no-remote, optional -headless, URL. */
function firefoxStartupArgs({ root, startUrl, headless }) {
  const args = ['-profile', String(root)];
  args.push('--no-remote');
  if (headless) args.push('-headless');
  args.push(String(startUrl || 'about:blank'));
  return args;
}

module.exports = {
  CHROMIUM_CATALOG_URL,
  CHROMIUM_CATALOG_MAX_BYTES,
  CHROMIUM_CATALOG_TTL_MS,
  CHROMIUM_CATALOG_MAJOR_LIMIT,
  FIREFOX_RELEASES_URL,
  FIREFOX_VERSIONS_URL,
  FIREFOX_CDN_BASE,
  FIREFOX_LOCALE,
  FIREFOX_CATALOG_MAJOR_LIMIT,
  FIREFOX_CATALOG_TTL_MS,
  chromiumCatalogPlatform,
  chromiumUrlForVersion,
  filterChromiumCatalog,
  firefoxPlatformDir,
  firefoxArtifactCandidates,
  parseSha256Sums,
  firefoxArtifactFor,
  firefoxCdnUrl,
  firefoxSumsUrl,
  firefoxArchiveKindForPlatform,
  filterFirefoxCatalog,
  firefoxBinaryRelative,
  firefoxUaVersion,
  firefoxUserAgent,
  parseProxyEndpoint,
  buildFirefoxUserJs,
  firefoxStartupArgs,
  compareKernelVersions,
};

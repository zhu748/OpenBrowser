#!/usr/bin/env node
'use strict';

/**
 * Selftest for multi-version kernel catalogs and Firefox launch planning.
 *
 * Pure functions only: fixtures mirror the real shapes of
 *   - Chrome for Testing known-good-versions-with-downloads.json
 *   - product-details.mozilla.org firefox.json / firefox_versions.json
 *   - download-installer.cdn.mozilla.net SHA256SUMS
 * so a shape change upstream fails loudly here first.
 */

const assert = require('assert');
const kv = require('../../automation/kernel-versions');
const { compareVersions } = require('../../automation/version-compare');

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}: ${error.message}`);
  }
}

// ---------- Chromium catalog ----------
const cftFeed = {
  versions: [
    { version: '159.0.8149.0', downloads: { chrome: [{ platform: 'linux64', url: 'https://storage.googleapis.com/chrome-for-testing-public/159.0.8149.0/linux64/chrome-linux64.zip' }] } },
    { version: '158.0.7104.0', downloads: { chrome: [] } }, // no linux64 → dropped
    { version: '157.0.6533.5', downloads: { chrome: [{ platform: 'linux64', url: 'https://storage.googleapis.com/chrome-for-testing-public/157.0.6533.5/linux64/chrome-linux64.zip' }] } },
    { version: 'not-a-version', downloads: { chrome: [{ platform: 'linux64', url: 'https://x/' }] } },
  ],
};

check('filterChromiumCatalog sorts newest first and drops platform misses', () => {
  const list = kv.filterChromiumCatalog(cftFeed, 'linux64');
  assert.deepStrictEqual(list.map((item) => item.version), ['159.0.8149.0', '157.0.6533.5']);
});

check('chromiumUrlForVersion embeds version and platform', () => {
  const url = kv.chromiumUrlForVersion('155.0.1.2', 'mac-arm64');
  assert.strictEqual(url, 'https://storage.googleapis.com/chrome-for-testing-public/155.0.1.2/mac-arm64/chrome-mac-arm64.zip');
});

check('chromiumCatalogPlatform maps win32 arm64 to win64 (CfT has no arm build)', () => {
  assert.strictEqual(kv.chromiumCatalogPlatform('win32', 'arm64'), 'win64');
  assert.strictEqual(kv.chromiumCatalogPlatform('darwin', 'arm64'), 'mac-arm64');
  assert.strictEqual(kv.chromiumCatalogPlatform('linux', 'x64'), 'linux64');
});

// ---------- Firefox catalog / artifacts ----------
const firefoxReleases = {
  releases: {
    'firefox-159.0': { category: 'major', version: '159.0', date: '2026-10-01' },
    'firefox-159.0.1': { category: 'stability', version: '159.0.1', date: '2026-10-10' },
    'firefox-158.0': { category: 'major', version: '158.0' },
    'firefox-148.0': { category: 'major', version: '148.0' },
    'firefox-159.0b3': { category: 'dev', version: '159.0b3' }, // dev → excluded
    'firefox-153.6.0esr': { category: 'esr', version: '153.6.0esr' }, // esr channel handled via FIREFOX_ESR
  },
};
const currentVersions = { FIREFOX_ESR: '153.6.0esr', LATEST_FIREFOX_VERSION: '159.0.1' };

check('filterFirefoxCatalog: newest point release per major + ESR entry', () => {
  const list = kv.filterFirefoxCatalog(firefoxReleases, currentVersions);
  assert.deepStrictEqual(list, [
    { version: '159.0.1', channel: 'release' },
    { version: '158.0', channel: 'release' },
    { version: '153.6.0esr', channel: 'esr' },
    { version: '148.0', channel: 'release' },
  ]);
});

const sumsText = [
  '7a6bbb01b346c6cd60e9647e85590752d918b961190cb3a9ba075d5a71d1ab9c  linux-aarch64/ach/firefox-141.0.tar.xz',
  '3186b125016ab2ca008df77a4bf29e55edadb55b0a1b8c9de6c9ed48bf0afec6  win64/en-US/Firefox Setup 141.0.msi',
  '435a07e04f1fcae53b992cdcc31ccdf541d9f2433fce744f432b4be4620b5c8c  win64/en-US/Firefox Setup 141.0.exe',
  '37b716b18a7852d3253e9444dbd0eb275204e54b589cc7ad38209c7fceb7ccf3  mac/en-US/Firefox 141.0.dmg',
  '94e72abd752b2a430b0b73f4f3e30c082d66cfc03675252f9415ea15358e8159  linux-x86_64/en-US/firefox-141.0.tar.xz',
  'malformed line without digest',
].join('\n');

check('parseSha256Sums maps relPath → digest and skips malformed lines', () => {
  const map = kv.parseSha256Sums(sumsText);
  assert.strictEqual(map.size, 5);
  assert.strictEqual(map.get('mac/en-US/Firefox 141.0.dmg'), '37b716b18a7852d3253e9444dbd0eb275204e54b589cc7ad38209c7fceb7ccf3');
});

check('firefoxArtifactFor prefers MSI over exe on win64', () => {
  const artifact = kv.firefoxArtifactFor('win64', '141.0', kv.parseSha256Sums(sumsText));
  assert.strictEqual(artifact.kind, 'msi');
  assert.strictEqual(artifact.relPath, 'win64/en-US/Firefox Setup 141.0.msi');
  assert.strictEqual(artifact.sha256, '3186b125016ab2ca008df77a4bf29e55edadb55b0a1b8c9de6c9ed48bf0afec6');
});

check('firefoxCdnUrl percent-encodes spaces per segment, keeps slashes', () => {
  const url = kv.firefoxCdnUrl('141.0', 'mac/en-US/Firefox 141.0.dmg');
  assert.strictEqual(url, 'https://download-installer.cdn.mozilla.net/pub/firefox/releases/141.0/mac/en-US/Firefox%20141.0.dmg');
});

check('firefoxSumsUrl points at the release folder', () => {
  assert.strictEqual(kv.firefoxSumsUrl('153.6.0esr'), 'https://download-installer.cdn.mozilla.net/pub/firefox/releases/153.6.0esr/SHA256SUMS');
});

check('firefoxPlatformDir + firefoxBinaryRelative per platform', () => {
  assert.strictEqual(kv.firefoxPlatformDir('linux', 'arm64'), 'linux-aarch64');
  assert.strictEqual(kv.firefoxBinaryRelative('linux-aarch64'), 'firefox/firefox');
  assert.strictEqual(kv.firefoxBinaryRelative('mac'), 'Firefox.app/Contents/MacOS/firefox');
  assert.strictEqual(kv.firefoxBinaryRelative('win64'), 'firefox.exe');
});

// ---------- UA / prefs / args ----------
check('firefoxUserAgent freezes at major segment per OS', () => {
  assert.strictEqual(
    kv.firefoxUserAgent('Windows', '159.0.1'),
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:159.0) Gecko/20100101 Firefox/159.0'
  );
  assert.strictEqual(
    kv.firefoxUserAgent('macOS', '153.6.0esr'),
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:153.0) Gecko/20100101 Firefox/153.0'
  );
});

check('parseProxyEndpoint handles schemes and rejects garbage', () => {
  assert.deepStrictEqual(kv.parseProxyEndpoint('socks5://127.0.0.1:1080'), { scheme: 'socks5', host: '127.0.0.1', port: 1080 });
  assert.deepStrictEqual(kv.parseProxyEndpoint('http://proxy.example.com:8080'), { scheme: 'http', host: 'proxy.example.com', port: 8080 });
  assert.strictEqual(kv.parseProxyEndpoint('direct://'), null);
  assert.strictEqual(kv.parseProxyEndpoint('not a proxy'), null);
  assert.strictEqual(kv.parseProxyEndpoint('http://host:99999'), null);
});

check('buildFirefoxUserJs: proxy bridge http endpoint', () => {
  const js = kv.buildFirefoxUserJs({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:159.0) Gecko/20100101 Firefox/159.0',
    acceptLanguages: 'en-US,en',
    locale: 'en-US',
    proxyEndpoint: 'http://127.0.0.1:51837',
    noProxyHosts: 'localhost, 127.0.0.1',
  });
  assert.ok(js.includes('user_pref("network.proxy.type", 1);'));
  assert.ok(js.includes('user_pref("network.proxy.http", "127.0.0.1");'));
  assert.ok(js.includes('user_pref("network.proxy.http_port", 51837);'));
  assert.ok(js.includes('user_pref("network.proxy.share", "127.0.0.1");'));
  assert.ok(js.includes('user_pref("network.proxy.no_proxies_for", "localhost, 127.0.0.1");'));
  assert.ok(js.includes('user_pref("general.useragent.override",'));
  assert.ok(js.includes('user_pref("app.update.enabled", false);'));
  assert.ok(js.includes('user_pref("toolkit.telemetry.enabled", false);'));
});

check('buildFirefoxUserJs: socks5 sets socks prefs + remote dns', () => {
  const js = kv.buildFirefoxUserJs({ proxyEndpoint: 'socks5h://127.0.0.1:1080' });
  assert.ok(js.includes('user_pref("network.proxy.socks", "127.0.0.1");'));
  assert.ok(js.includes('user_pref("network.proxy.socks_port", 1080);'));
  assert.ok(js.includes('user_pref("network.proxy.socks_version", 5);'));
  assert.ok(js.includes('user_pref("network.proxy.socks_remote_dns", true);'));
  assert.ok(!js.includes('network.proxy.http"'));
});

check('buildFirefoxUserJs: direct mode = manual proxy with no hosts', () => {
  const js = kv.buildFirefoxUserJs({ proxyEndpoint: '' });
  assert.ok(js.includes('user_pref("network.proxy.type", 1);'));
  assert.ok(!js.includes('network.proxy.http"'));
});

check('firefoxStartupArgs shape', () => {
  assert.deepStrictEqual(kv.firefoxStartupArgs({ root: '/tmp/p1', startUrl: 'http://x/', headless: true }), ['-profile', '/tmp/p1', '--no-remote', '-headless', 'http://x/']);
  assert.deepStrictEqual(kv.firefoxStartupArgs({ root: '/tmp/p2' }), ['-profile', '/tmp/p2', '--no-remote', 'about:blank']);
});

check('compareKernelVersions orders Firefox versions incl. glued esr suffixes', () => {
  assert.ok(kv.compareKernelVersions('159.0.1', '159.0') > 0);
  // compareVersions alone collapses "153.6.0esr" to 0 (glued suffix fails its
  // numeric regex); compareKernelVersions must not.
  assert.ok(kv.compareKernelVersions('153.6.0esr', '148.0') > 0);
  assert.ok(kv.compareKernelVersions('153.6.0esr', '153.6.0') > 0);
  assert.strictEqual(kv.compareKernelVersions('141.0', '141.0'), 0);
});

console.log(`\nkernel-versions-selftest: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

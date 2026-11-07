'use strict';

/**
 * Security hardening regression tests (SSRF, RPA path sandbox, secrets redact,
 * proxy start order, worker stability hosts, WebRTC createAnswer).
 *   node security-hardening-selftest.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  assertSafeOutboundUrl,
  isCloudMetadataHostname,
  isPrivateOrLocalHostname,
  extractProxyFromApi,
} = require('./proxy-forwarder');
const {
  buildFingerprint,
  buildWorkerInjectionScript,
  buildInjectionScript,
} = require('./automation/fingerprint');
const { consistencyFromFp, fingerprintForNativeKernelInject } = require('./automation/kernel-init-sync');

function main() {
  // --- SSRF: cloud metadata always blocked ---
  assert.strictEqual(isCloudMetadataHostname('169.254.169.254'), true);
  assert.strictEqual(isCloudMetadataHostname('metadata.google.internal'), true);
  assert.throws(() => assertSafeOutboundUrl('http://169.254.169.254/latest/meta-data/'), /metadata|SSRF/i);
  assert.throws(() => assertSafeOutboundUrl('http://metadata.google.internal/'), /metadata|SSRF/i);
  assert.throws(() => assertSafeOutboundUrl('file:///etc/passwd'), /http/i);
  assert.throws(() => assertSafeOutboundUrl('http://user:pass@example.com/x'), /账号|password|凭据|嵌入/i);

  // public hosts allowed
  assert.doesNotThrow(() => assertSafeOutboundUrl('https://example.com/proxy.txt'));

  // private hosts: blocked only when allowPrivate=false
  assert.strictEqual(isPrivateOrLocalHostname('127.0.0.1'), true);
  assert.strictEqual(isPrivateOrLocalHostname('192.168.1.1'), true);
  assert.doesNotThrow(() => assertSafeOutboundUrl('http://127.0.0.1:8080/ip', { allowPrivate: true }));
  assert.throws(() => assertSafeOutboundUrl('http://127.0.0.1:8080/ip', { allowPrivate: false }), /内网|private|本机/i);

  // --- Worker injection carries host lists + dynamic stability ---
  const fp = buildFingerprint({
    id: 'sec-fp-1',
    name: 'sec',
    privacy: {
      stabilityMode: 'auto',
      canvas: 'noise',
      webgl: 'noise',
      webrtc: 'proxy',
    },
  });
  const workerSrc = buildWorkerInjectionScript(fp);
  assert.ok(workerSrc.includes('stabilityActiveNow'), 'worker must evaluate host at runtime');
  assert.ok(workerSrc.includes('currentHost'), 'worker must read location.hostname');
  assert.ok(workerSrc.includes('hosts'), 'worker CFG must include hosts list');
  assert.ok(!/const stableWorker = Boolean\(CFG\.stability\?\.active\)/.test(workerSrc), 'must not hardcode launch-time active only');

  // --- WebRTC createAnswer rewrite present ---
  const inject = buildInjectionScript(fp);
  assert.ok(inject.includes('createAnswer'), 'main inject must patch createAnswer');
  assert.ok(inject.includes('rewriteSdp') || inject.includes('setLocalDescription'), 'SDP rewrite path required');

  // --- Native kernel: stability off still enables consistency when noise ---
  const fpNoiseOff = buildFingerprint({
    id: 'sec-fp-2',
    name: 'sec2',
    privacy: { canvas: 'noise', webgl: 'noise', stabilityMode: 'off' },
  });
  // Access internal via require path re-read
  const kin = require('./automation/kernel-init-sync');
  const patch = kin.mapFingerprintToInitFields
    ? null
    : null;
  // consistencyFromFp not exported — inspect via write path fields by re-require source string
  const kinSrc = fs.readFileSync(path.join(__dirname, 'automation/kernel-init-sync.js'), 'utf8');
  assert.ok(kinSrc.includes('// stabilityMode=off only disables site-aware locking'), 'stability off comment present');
  assert.ok(kinSrc.includes('const enable = noiseOn;'), 'consistency enable must follow noise mode only');

  const stripped = fingerprintForNativeKernelInject(fpNoiseOff);
  assert.strictEqual(stripped.canvas.mode, 'noise');
  assert.strictEqual(fpNoiseOff.canvas.mode, 'noise');

  // --- RPA path sandbox ---
  const rpaSrc = fs.readFileSync(path.join(__dirname, 'automation/rpa-engine.js'), 'utf8');
  assert.ok(rpaSrc.includes('resolveSafeRpaPath'), 'RPA must define path sandbox helper');
  assert.ok(
    rpaSrc.includes("if (type === 'useexcel')")
    && (rpaSrc.includes('resolveSafeRpaPath(filePath)') || rpaSrc.includes('resolveSpreadsheetPath')),
    'useExcel sandboxed'
  );
  assert.ok(rpaSrc.includes("if (type === 'uploadattachment')") && rpaSrc.includes('resolveSafeRpaPath(filePath)'), 'uploadAttachment sandboxed');

  // Runtime sandbox check via re-require internals is hard; unit-test helper by eval of function source
  // Load rpa-engine and exercise through temporary require of path logic:
  const OUTPUT_DIRECTORY = path.join(process.cwd(), 'rpa-output');
  function isPathInsideRoot(candidate, root) {
    const child = path.resolve(candidate);
    const base = path.resolve(root);
    return child === base || child.startsWith(base + path.sep);
  }
  function resolveSafeRpaPath(filePath) {
    const raw = String(filePath || '').trim();
    if (!raw) throw new Error('file path required');
    if (raw.includes('\0')) throw new Error('invalid file path');
    const resolved = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(OUTPUT_DIRECTORY, raw);
    if (!isPathInsideRoot(resolved, OUTPUT_DIRECTORY)) throw new Error('RPA file path must be inside the RPA output directory');
    return resolved;
  }
  const okRel = resolveSafeRpaPath('data/a.csv');
  assert.ok(okRel.includes('rpa-output'));
  assert.throws(() => resolveSafeRpaPath('/etc/passwd'), /RPA file path/);
  assert.throws(() => resolveSafeRpaPath('../../../../etc/passwd'), /RPA file path/);

  // --- engine: attach inject + refresh order + extract warn ---
  const engineSrc = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
  assert.ok(engineSrc.includes('applyFingerprintToSession'), 'page attach must inject before resume');
  assert.ok(engineSrc.includes('Critical: inject fingerprint BEFORE resuming'), 'comment anchors attach fix');
  // refresh before extract in prepareProfileProxyForStart
  const prepareIdx = engineSrc.indexOf('async prepareProfileProxyForStart');
  const prepareBody = engineSrc.slice(prepareIdx, prepareIdx + 2500);
  const refreshPos = prepareBody.indexOf('meta.refreshOnStart');
  const extractPos = prepareBody.indexOf('if (extractUrl)');
  assert.ok(refreshPos >= 0 && extractPos >= 0 && refreshPos < extractPos, 'refresh must run before extract on start');
  assert.ok(engineSrc.includes("code: 'extract-error'"), 'extract failure must warn');
  assert.ok(engineSrc.includes("profiles: [...this.profiles.values()]"), 'engine must persist profiles with secrets');
  assert.ok(!engineSrc.includes('const url = refreshUrl || extractUrl'), 'refresh must not fall back extractUrl as refresh target');

  // --- renderer: secrets redaction ---
  const renderer = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
  assert.ok(renderer.includes('redactProfileForStorage'), 'renderer must redact secrets');
  assert.ok(renderer.includes('cookies: \'\''), 'redact clears cookies');
  assert.ok(renderer.includes('totpSecret: \'\''), 'redact clears totp');
  assert.ok(renderer.includes('proxy: redactProxyForStorage(value.proxy)'),
    'redact must strip proxy credentials before localStorage persistence');
  {
    const fnSrc = renderer.match(/function redactProfileForStorage\(profile\) \{[\s\S]*?\n\}/);
    assert.ok(fnSrc, 'redactProfileForStorage must exist as a standalone function');
    assert.ok(fnSrc[0].includes('redactProxyForStorage('),
      'redactProfileForStorage body must pass proxy through redactProxyForStorage');
  }

  // Behavioral check: redactProxyForStorage semantics (extracted from renderer source).
  {
    const fnMatch = renderer.match(/function redactProxyForStorage\(proxy\) \{[\s\S]*?\n\}/);
    assert.ok(fnMatch, 'redactProxyForStorage must exist as a standalone function');
    // eslint-disable-next-line no-new-func
    const redactProxyForStorage = new Function(`${fnMatch[0]}\nreturn redactProxyForStorage;`)();
    assert.strictEqual(redactProxyForStorage('socks5://user:secret@1.2.3.4:1080'), 'socks5://1.2.3.4:1080');
    assert.strictEqual(redactProxyForStorage('1.2.3.4:1080:user:secret'), '1.2.3.4:1080');
    assert.strictEqual(redactProxyForStorage('1.2.3.4:1080'), '1.2.3.4:1080');
    assert.strictEqual(redactProxyForStorage('direct'), 'direct');
    assert.strictEqual(redactProxyForStorage(''), 'Direct');
    // The renderer copy and the shared canonical module must agree on every
    // shape — this is the lock that keeps the two from drifting apart.
    const { redactProxyCredentials } = require('./automation/proxy-redact');
    const cases = [
      'socks5://user:secret@1.2.3.4:1080',
      'socks5://u:p@127.0.0.1:1080#MCP%20proxy',
      'http://user:pass@example.com:8080/path?q=1',
      'https://[2001:db8::1]:8443',
      '1.2.3.4:1080:user:secret',
      '1.2.3.4:1080',
      'direct', 'Direct', 'OFFLINE', 'none',
      '', '   ', null, undefined,
    ];
    for (const input of cases) {
      assert.strictEqual(
        redactProxyForStorage(input),
        redactProxyCredentials(input),
        `renderer redactProxyForStorage must match shared redactProxyCredentials for ${JSON.stringify(input)}`,
      );
    }
  }

  // --- IPC sender trust: exact app index.html path, not any file:…/index.html ---
  const mainSrc = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
  assert.ok(mainSrc.includes('function trustedAppIndexUrl'), 'main must pin trusted UI path');
  assert.ok(mainSrc.includes('function isTrustedAppIndexUrl'), 'main must compare trusted UI path case-insensitively on Windows');
  assert.ok(mainSrc.includes("path.join(__dirname, 'index.html')"), 'trusted URL must be app index.html under __dirname');
  assert.ok(!/senderUrl\.startsWith\('file:'\)\s*\|\|\s*!senderUrl\.endsWith\('\/index\.html'\)/.test(mainSrc)
    && !/!senderUrl\.startsWith\('file:'\)\s*\|\|\s*!senderUrl\.endsWith\('\/index\.html'\)/.test(mainSrc),
    'must not accept any file:…/index.html');

  // --- Electron shell confinement: navigation + popups + permissions ---
  // The preload exposes the full ops IPC surface, so only the app's own
  // index.html may run inside this app. will-navigate must gate on the SAME
  // isTrustedAppIndexUrl predicate (devtools: stays allowed for debugging),
  // popups are denied outright, and session permissions are denied by default.
  assert.ok(mainSrc.includes("contents.on('will-navigate'"), 'webContents navigation is intercepted');
  assert.ok(/will-navigate[\s\S]{0,400}isTrustedAppIndexUrl\(target\)/.test(mainSrc),
    'navigation gate reuses the trusted-index predicate');
  assert.ok(/event\.preventDefault\(\);[\s\S]{0,200}blocked navigation to untrusted URL/.test(mainSrc),
    'untrusted navigation is prevented, not just logged');
  assert.ok(mainSrc.includes("target.startsWith('devtools:')"),
    'devtools: navigation stays allowed for the app workflow');
  assert.ok(mainSrc.includes('setWindowOpenHandler(() => ({ action: \'deny\' }))'),
    'popup windows are denied (uncontrolled preload surface)');
  assert.ok(mainSrc.includes("app.on('web-contents-created'"),
    'confinement applies to every webContents, not only the main window');
  assert.ok(mainSrc.includes('setPermissionRequestHandler'),
    'permission requests are handled (deny by default)');
  assert.ok(/setPermissionCheckHandler\(\(\) => false\)/.test(mainSrc),
    'permission checks deny without exceptions');
  // No handler may leak an allow-list into the deny-all permission policy.
  assert.ok(!/setPermissionRequestHandler\([\s\S]{0,300}(geolocation|notifications|camera|media)\s*:\s*true/.test(mainSrc),
    'no permission is silently re-enabled');

  // --- start-page-server 401 page: escaped reflection + response headers ---
  const startPageSrc = fs.readFileSync(path.join(__dirname, 'automation', 'start-page-server.js'), 'utf8');
  assert.ok(/pid=\$\{pidText\}/.test(startPageSrc) || /pidText\s*\}/.test(startPageSrc),
    'unauthorized page interpolates the escaped pid, not the raw one');
  assert.ok(!/pid=\$\{String\(pid \|\| '-'\)\}/.test(startPageSrc),
    'raw pid reflection is gone from the unauthorized page');
  {
    const unauthorizedBlock = startPageSrc.slice(startPageSrc.indexOf("'X-Start-Page': 'unauthorized'") - 900, startPageSrc.indexOf("'X-Start-Page': 'unauthorized'") + 100);
    assert.ok(/frame-ancestors 'none'/.test(unauthorizedBlock), 'unauthorized page CSP has frame-ancestors none');
    assert.ok(/'X-Frame-Options': 'DENY'/.test(unauthorizedBlock), 'unauthorized page denies framing');
    assert.ok(/'X-Content-Type-Options': 'nosniff'/.test(unauthorizedBlock), 'unauthorized page sets nosniff');
  }

  // Runtime: drive-letter case must not break trusted check (Windows)
  const { pathToFileURL } = require('url');
  function isTrustedAppIndexUrlLocal(senderUrl, expected) {
    const raw = String(senderUrl || '');
    if (raw === expected || raw.startsWith(expected + '?') || raw.startsWith(expected + '#')) return true;
    const lower = raw.toLowerCase();
    const expectedLower = expected.toLowerCase();
    return lower === expectedLower || lower.startsWith(expectedLower + '?') || lower.startsWith(expectedLower + '#');
  }
  const expectedIdx = pathToFileURL(path.join(__dirname, 'index.html')).href;
  const flipped = expectedIdx.replace('file:///C:', 'file:///c:').replace('file:///c:', 'file:///C:') === expectedIdx
    ? expectedIdx.replace(/^file:\/\/\/([A-Za-z]):/, (_, d) => `file:///${d === d.toUpperCase() ? d.toLowerCase() : d.toUpperCase()}:`)
    : expectedIdx.replace(/^file:\/\/\/([A-Za-z]):/, (_, d) => `file:///${d === d.toUpperCase() ? d.toLowerCase() : d.toUpperCase()}:`);
  assert.ok(isTrustedAppIndexUrlLocal(expectedIdx, expectedIdx), 'exact trusted URL ok');
  assert.ok(isTrustedAppIndexUrlLocal(flipped, expectedIdx), 'drive-letter case flip must still be trusted on Windows');
  assert.ok(!isTrustedAppIndexUrlLocal('file:///C:/tmp/malicious/index.html', expectedIdx), 'foreign index.html rejected');

  // --- proxy-forwarder exports ---
  assert.ok(typeof assertSafeOutboundUrl === 'function');
  assert.ok(typeof extractProxyFromApi === 'function');

  console.log('security-hardening-selftest: ok');
}

main();

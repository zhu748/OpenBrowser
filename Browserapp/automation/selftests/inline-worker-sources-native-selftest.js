'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const h = require('./native-gate-harness');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint, buildInjectionScript } = require('../fingerprint');
const { buildFirefoxFingerprint } = require('../firefox-fingerprint');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');
const { buildFirefoxUserJs, firefoxStartupArgs, firefoxUserAgent } = require('../kernel-versions');
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../../network/bidi-connection');
const { probeInlineWorkerSources, verifyInlineWorkerSources } = require('./inline-worker-source-probes');

async function firefoxSession(browser, profile, fp, url) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-inline-native-'));
  let child, connection, stderr = '';
  const close = async () => {
    await connection?.command('browser.close', {}, 5000).catch(() => {});connection?.close();
    if (child?.exitCode === null && child?.signalCode === null) await new Promise((resolve, reject) => {
      const kill = setTimeout(() => child.kill('SIGKILL'), 5000);
      const deadline = setTimeout(() => { clearTimeout(kill);reject(Error('Firefox did not exit')); }, 10000);
      child.once('close', () => { clearTimeout(kill);clearTimeout(deadline);resolve(); });
    });
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  };
  try {
    await fs.writeFile(path.join(root, 'user.js'), buildFirefoxUserJs({
      userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
      proxyEndpoint: 'http://127.0.0.1:9', noProxyHosts: '127.0.0.1, localhost',
      extraPrefs: firefoxExtraUserPrefs(profile, fp),
    }));
    child = spawn(browser.binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: fp.timezone },
    });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-12000); });
    connection = await new BidiConnection(await waitForFirefoxEndpoint(child)).open();
    await connection.command('session.new', { capabilities: { alwaysMatch: {} } });
    const { contexts } = await connection.command('browsingContext.getTree', {}), context = contexts[0].context;
    await connection.command('browsingContext.navigate', { context, url, wait: 'complete' });
    return { close, evaluate: expression => evaluateBidi({
      command: (method, params) => connection.command(method, params, 180000),
    }, { context }, expression) };
  } catch (error) { error.message += '\nFirefox startup stderr:\n' + stderr;await close();throw error; }
}

async function main() {
  const firefox = process.argv.includes('--firefox'), engine = firefox ? 'firefox' : 'chromium';
  let browser;
  if (firefox) {
    const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
    if (!binary) throw new h.Unavailable('Set OPENBROWSER_FIREFOX_BINARY for the Firefox inline worker gate');
    const version = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 }).match(/Firefox\s+(\d+(?:\.\d+)+)/)?.[1];
    assert.ok(version, 'native Firefox version');browser = { binary, version };
  } else browser = h.chooseChromiumBinary();
  const profile = sanitizeProfile({ id: 'inline-native-' + engine, name: 'Inline native parity', engine, os: 'Windows',
    fingerprintSeed: 'inline-native-stable', privacy: { cores: 2, fontListMode: 'real' } });
  // A custom product patch must preserve the installed major and native behavior.
  if (firefox) profile.userAgent = firefoxUserAgent('win', browser.version, {
    productVersion: browser.version.split('.').slice(0, 2).concat('77').join('.'),
  });
  const build = () => firefox ? buildFirefoxFingerprint(profile, browser.version)
    : buildFingerprint({ ...profile, kernelVersion: browser.version });
  let fingerprint = build();
  const server = http.createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');response.end('<!doctype html><body>Inline worker native parity</body>');
  });
  let session, page;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + server.address().port + '/';
    if (firefox) session = await firefoxSession(browser, profile, fingerprint, url);
    else {
      session = await h.launchPersonaBrowser(browser, { profile, fingerprint }, { injectFingerprint: false });
      page = await h.openPage(session.port, url);
      session.evaluate = expression => h.evaluate(page, expression, 180000);
    }
    const expression = '(' + probeInlineWorkerSources.toString() + ')()';
    const native = await session.evaluate(expression);
    if (native.results.data.cores === fingerprint.hardwareConcurrency) { profile.privacy.cores = 4;fingerprint = build(); }
    assert.notEqual(native.results.data.cores, fingerprint.hardwareConcurrency, 'native and configured cores must differ');
    // Exercise the document installer alone. A later protocol realm callback
    // must not hide constructor-path first-instruction leaks in this gate.
    await session.evaluate(buildInjectionScript(fingerprint) + ';true');
    const actual = await session.evaluate(expression);
    if (process.env.OPENBROWSER_EVIDENCE_DIR) {
      const evidence = path.resolve(__dirname, '../../..', process.env.OPENBROWSER_EVIDENCE_DIR);
      await fs.mkdir(evidence, { recursive: true });
      await fs.writeFile(path.join(evidence, 'inline-workers-' + engine + '.json'), JSON.stringify({ browser, expectedCores: fingerprint.hardwareConcurrency, native, actual }, null, 2));
    }
    verifyInlineWorkerSources(actual, native, fingerprint, engine);
    console.log(`INLINE_WORKER_NATIVE OK ${engine} ${browser.version} (${Object.keys(actual.results).length} loading/first-read cases, private intrinsic capture)`);
  } finally { page?.close();await session?.close();await new Promise(resolve => server.close(resolve)); }
}

main().catch(error => {
  console.error((error instanceof h.Unavailable ? 'SKIP ' : 'FAIL ') + error.stack);
  process.exitCode = error instanceof h.Unavailable ? 2 : 1;
});

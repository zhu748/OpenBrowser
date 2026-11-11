'use strict';

/**
 * Shared harness for the native-browser fingerprint gates.
 *
 * Everything a P0/P1 matrix test needs to stand up a production-shaped browser
 * session: binary discovery, profile/fingerprint construction from a flexible
 * persona spec, launch with the production argument builder, engine wiring with
 * captured events, and a second loopback origin for cross-site scenarios.
 *
 * Exit-code contract shared by all gates: 2 = native prerequisite missing
 * (reported as a skip by the suite runner), 1 = assertion failure.
 */

const assert = require('node:assert/strict');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const cdp = require('../../cdp');
const { buildFingerprint } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildBaseLaunchArguments } = require('../../engine/launch-arguments');
const injection = require('../../engine/fingerprint-injection');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class Unavailable extends Error {}

const CHROMIUM_CANDIDATES = ['chromium', 'google-chrome', 'chrome', 'chrome.exe'];

function chooseChromiumBinary() {
  const explicit = process.env.OPENBROWSER_CHROMIUM_BINARY;
  // PATH fallback exists for developer machines. CI hosts (GitHub runners ship
  // a google-chrome that cannot launch under the job user) and the aggregate
  // suite's availability probe must treat an unset explicit binary as
  // unavailable instead of half-running a broken browser.
  if (!explicit && process.env.OPENBROWSER_REQUIRE_EXPLICIT_BINARY === '1') {
    throw new Unavailable('Set OPENBROWSER_CHROMIUM_BINARY to an installed Chromium/Chrome executable.');
  }
  for (const binary of explicit ? [explicit] : CHROMIUM_CANDIDATES) {
    const result = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    const version = String(result.stdout || '').match(/\b(\d+\.\d+\.\d+\.\d+)\b/)?.[1];
    if (result.status === 0 && version) return { binary, version };
  }
  throw new Unavailable('Set OPENBROWSER_CHROMIUM_BINARY to an installed Chromium/Chrome executable.');
}

/**
 * The identity probe every entry point records as its first script action.
 * Kept in sync with the gates: any field added here must be asserted somewhere.
 */
function entrySnapshot() {
  return {
    ua: navigator.userAgent,
    platform: navigator.platform,
    cores: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory,
    languages: navigator.languages,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    vendor: navigator.vendor,
    connection: navigator.connection ? {
      rtt: navigator.connection.rtt,
      downlink: navigator.connection.downlink,
      effectiveType: navigator.connection.effectiveType,
      saveData: navigator.connection.saveData,
    } : null,
  };
}
const entrySnapshotSource = '(' + entrySnapshot.toString() + ')()';

/** Build a profile + fingerprint from a compact persona spec. */
function buildPersona(id, spec = {}) {
  const profile = sanitizeProfile({
    id, name: id,
    os: spec.os || 'Windows',
    fingerprintSeed: spec.seed || id,
    privacy: {
      deviceProfile: 'persona',
      fontListMode: 'real',
      webrtc: spec.webrtc || 'disabled',
      stabilityMode: 'force',
      fingerprint: { devicePixelRatio: spec.dpr || 1 },
      ...(spec.timezone ? { timezoneMode: 'custom', timezone: spec.timezone } : {}),
    },
    // persona.js reads the pinned network persona from the profile's fingerprint
    // sub-object (profile-sanitizer set("network", ...)); privacy.network is not
    // a recognized field there.
    // The WebRTC rewrite arms only with a concrete webrtcAddress (document-webrtc
    // reads CFG.webrtcAddress); without one, 'proxy' mode leaves gathering alone.
    fingerprint: {
      network: spec.network || { rtt: 250, downlink: 2.3, effectiveType: '3g' },
      ...(spec.webrtcAddress ? { webrtcAddress: spec.webrtcAddress } : {}),
    },
    ...(spec.width ? { width: spec.width, height: spec.height || 900 } : {}),
  });
  return { profile, fingerprint: buildFingerprint({ ...profile, kernelVersion: spec.kernelVersion }) };
}

/**
 * Spawn a browser with production launch arguments and wire the injection engine.
 * Resolves with { child, port, item, engine, events, close }.
 */
async function launchPersonaBrowser(browser, persona, options = {}) {
  const { profile, fingerprint } = persona;
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'openbrowser-native-gate-'));
  const args = buildBaseLaunchArguments({ root, fingerprint, profile, hostScaleFactor: options.hostDpr || 1 });
  // Route non-test destinations to a closed proxy; tests only need loopback.
  // Popup blocking stays off so window.open entries behave like a real user profile.
  args.push('--headless=new', '--disable-dev-shm-usage', '--disable-background-networking',
    '--disable-popup-blocking',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost');
  if (!args.some((arg) => arg.startsWith('--force-device-scale-factor='))) args.push('--force-device-scale-factor=' + (options.hostDpr || 1));
  if (process.env.OPENBROWSER_NATIVE_NO_SANDBOX === '1') args.push('--no-sandbox');
  args.push('about:blank');
  const child = spawn(browser.binary, args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '', spawnError;
  child.stderr?.on('data', (data) => { stderr = (stderr + data).slice(-12000); });
  child.on('error', (error) => { spawnError = error; });
  let port;
  for (let i = 0; i < 150; i += 1) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Chromium exited before CDP readiness: ' + stderr);
    try { port = Number((await fsp.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch (_) {}
    if (port) break;
    await delay(100);
  }
  assert.ok(port, 'Chromium did not publish a CDP port: ' + stderr);
  const events = [];
  const engine = { ...injection, profiles: new Map([[profile.id, profile]]), networkInfo: new Map(),
    emit: (event) => events.push(event),
    handleBrowserGone: async () => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); } };
  const item = { port, profile, fingerprint, kernelVersion: browser.version };
  await engine.startWorkerFingerprintInjection(item, fingerprint);
  const close = async () => {
    try { item.workerFingerprintConnection?.close(); } catch (_) {}
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => { const timer = setTimeout(resolve, 5000); child.once('exit', () => { clearTimeout(timer); resolve(); }); child.kill('SIGKILL'); });
    }
    await fsp.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  };
  return { child, port, item, engine, events, close };
}

/** Open a CDP connection to the first tab and navigate it. */
async function openPage(port, url) {
  const tab = (await cdp.tabs(port))[0];
  assert.ok(tab, 'initial page target');
  const connection = await cdp.connect(tab.webSocketDebuggerUrl);
  if (url) await connection.command('Page.navigate', { url });
  return connection;
}

/** Evaluate an expression, assert no exception, return the value. */
async function evaluate(connection, expression, timeout = 30000) {
  const result = await connection.command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, { timeout });
  assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

/** Two loopback origins so cross-site (cross-process) iframes are testable. */
async function startDualOriginServers(handler) {
  const make = () => new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
  const a = await make();
  let b;
  try { b = await make(); } catch (error) { a.close(); throw error; }
  return { a, b, close: async () => { await Promise.all([a, b].map((s) => new Promise((r) => s.close(r)))); } };
}

/** Standard identity assertions against a fingerprint. */
function verifyIdentity(actual, fp, label = 'identity') {
  assert.equal(actual.ua, fp.userAgent, label + ' ua');
  assert.equal(actual.platform, fp.platform, label + ' platform');
  assert.equal(actual.cores, fp.hardwareConcurrency, label + ' cores');
  assert.equal(actual.memory, fp.deviceMemory, label + ' memory');
  if (fp.timezone) assert.equal(actual.timezone, fp.timezone, label + ' timezone');
  for (const key of ['rtt', 'downlink', 'effectiveType', 'saveData']) {
    assert.equal(actual.connection?.[key], fp.connection[key], label + ' connection.' + key);
  }
}

module.exports = {
  delay, Unavailable, entrySnapshotSource,
  chooseChromiumBinary, buildPersona, launchPersonaBrowser, openPage, evaluate,
  startDualOriginServers, verifyIdentity,
};

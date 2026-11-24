'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');
const { writeFirefoxLaunchPreferences } = require('../../engine/launch-preferences');
const { firefoxStartupArgs } = require('../kernel-versions');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup } = require('../firefox-fingerprint');
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../../network/bidi-connection');

const permissionRead = `(async()=>{let reads=0;const p=await navigator.permissions.query({get name(){reads++;return 'geolocation'}});return {reads,state:p.state}})()`;
const first = `(async()=>{const geo='geolocation'in navigator;const permission=await ${permissionRead};
  const estimate=await navigator.storage.estimate();return {geo,permission,storage:{quota:estimate.quota,keys:Object.keys(estimate).sort(),realm:Object.getPrototypeOf(estimate)===Object.prototype}}})()`;
const nativePreferences = `(async()=>({notification:Notification.permission, cores:navigator.hardwareConcurrency,
  microphone:(await navigator.permissions.query({name:'microphone'})).state,
  camera:(await navigator.permissions.query({name:'camera'})).state,
  width:document.querySelector('span').getBoundingClientRect().width}))()`;
async function main() {
  const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
  if (!binary) { console.error('SKIP set OPENBROWSER_FIREFOX_BINARY');process.exitCode = 2;return; }
  const version = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 }).match(/Firefox\s+(\d+(?:\.\d+)+)/)?.[1];
  assert.ok(version, 'native Firefox version');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-firefox-native-geo-'));
  const makeServer = async () => {
    const server = http.createServer((_request, response) => {
      response.setHeader('Content-Type', 'text/html');response.end('<!doctype html><html lang="en"><body><span style="font:5px monospace">0123456789</span><script>globalThis.first=' + first + '</script></body>');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));return server;
  };
  const a = await makeServer(), b = await makeServer();
  const origin = 'http://127.0.0.1:' + a.address().port, otherOrigin = 'http://127.0.0.1:' + b.address().port;
  let minimumFontWidth;
  try {
    for (const mode of ['deny', 'allow']) {
      const blocked = mode === 'deny';
      const profile = sanitizeProfile({ id: 'firefox-native-geo', name: 'Geolocation', os: 'Windows', engine: 'firefox',
        privacy: { geoMode: 'custom', geoPermission: mode, latitude: 0, longitude: 0, accuracy: 275,
          fontListMode: 'real', webrtc: 'disabled', cores: blocked ? 2 : 0,
          media: blocked ? 'blocked' : 'real', fontMode: blocked ? 'custom' : 'default', fontSize: 30 },
        advanced: { blockNotifications: blocked, blockVideo: blocked } });
      const fingerprint = buildFirefoxFingerprint(profile, version);
      if (mode === 'deny') assert.equal(fingerprint.dynamicConfig.geoposition, null);
      await writeFirefoxLaunchPreferences(root, { userAgent: fingerprint.userAgent,
        acceptLanguages: fingerprint.languages.join(','), locale: fingerprint.languages[0], proxyEndpoint: 'http://127.0.0.1:9',
        noProxyHosts: '127.0.0.1, localhost', extraPrefs: firefoxExtraUserPrefs(profile, fingerprint) });
      let child, connection;
      try {
        child = spawn(binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), { stdio: ['ignore', 'pipe', 'pipe'] });
        child._startupDiagnostic = { stderr: '' };
        child.stderr.on('data', chunk => { child._startupDiagnostic.stderr = (child._startupDiagnostic.stderr + chunk).slice(-16000); });
        connection = await new BidiConnection(await waitForFirefoxEndpoint(child)).open();
        const initialized = await initializeFirefoxFingerprint(connection, fingerprint, profile);
        // Existing site grants must not bypass this profile's native denial.
        await connection.command('permissions.setPermission', { descriptor: { name: 'geolocation' }, state: mode === 'deny' ? 'granted' : 'denied', origin });
        await navigateFirefoxStartup(connection, initialized.context, [origin]);
        const { width, cores, ...permissions } = await evaluateBidi(connection, { context: initialized.context, sandbox: 'native-preference-reference' }, nativePreferences);
        assert.deepEqual(permissions, blocked ? { notification: 'denied', microphone: 'denied', camera: 'denied' }
          : { notification: 'default', microphone: 'prompt', camera: 'prompt' }, 'reused profile applies its current permission defaults');
        if (blocked) {
          assert.ok(cores > 0 && cores <= 2, 'active CPU preference caps native core count');
          minimumFontWidth = width;
        }
        else assert.ok(width > 0 && width < minimumFontWidth, 'reused profile restores the native minimum font size');
        const actual = await evaluateBidi(connection, { context: initialized.context }, 'globalThis.first');
        const native = await evaluateBidi(connection, { context: initialized.context, sandbox: 'native-api-reference' }, first);
        assert.equal(actual.permission.reads, native.permission.reads, 'preserve Gecko dictionary conversion count');
        assert.equal(actual.permission.state, mode === 'deny' ? 'denied' : 'granted', 'native policy is ready for the first script');
        assert.equal(actual.geo, mode === 'allow');assert.equal(actual.geo, native.geo);
        assert.ok(actual.storage.quota <= native.storage.quota);
        assert.deepEqual(actual.storage.keys, native.storage.keys);assert.equal(actual.storage.realm, true);
        const borrowed = await evaluateBidi(connection, { context: initialized.context }, `(async()=>{const f=document.createElement('iframe');document.body.append(f);
          try{const v=await StorageManager.prototype.estimate.call(f.contentWindow.navigator.storage);return {quota:v.quota,keys:Object.keys(v).sort()}}finally{f.remove()}})()`);
        assert.ok(borrowed.quota <= native.storage.quota);assert.deepEqual(borrowed.keys, native.storage.keys);
        if (mode === 'deny') {
          await connection.command('permissions.setPermission', { descriptor: { name: 'geolocation' }, state: 'granted', origin: otherOrigin });
          // An unprepared navigation simulates a previously authorized origin
          // outside managed startup URLs. The native feature gate still applies.
          await connection.command('browsingContext.navigate', { context: initialized.context, url: otherOrigin, wait: 'complete' });
          const unknown = await evaluateBidi(connection, { context: initialized.context }, 'globalThis.first');
          assert.equal(unknown.geo, false);assert.equal(unknown.permission.state, 'granted', 'retain genuine permission-store semantics while the feature is off');
        } else {
          const position = await evaluateBidi(connection, { context: initialized.context }, `new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
            p=>resolve([p.coords.latitude,p.coords.longitude,p.coords.accuracy]),e=>reject(new Error('native position failure '+e.code)),{timeout:5000}))`);
          assert.deepEqual(position, [0, 0, 275], 'the same profile restores geolocation with the configured coordinates and accuracy');
        }
        console.log('PASS Firefox ' + version + ' ' + mode + ': native permissions, stored-grant protection/restoration, profile preferences and storage APIs');
      } finally {
        if (connection) await connection.command('browser.close', {}).catch(() => {});
        connection?.close();
        if (child?.exitCode === null && child?.signalCode === null) {
          await new Promise(resolve => {
            const timer = setTimeout(() => child.kill('SIGKILL'), 4000);
            child.once('exit', () => { clearTimeout(timer);resolve(); });
          });
        }
      }
    }
  } finally {
    a.closeAllConnections();b.closeAllConnections();await Promise.all([new Promise(resolve => a.close(resolve)), new Promise(resolve => b.close(resolve))]);
    await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
main().catch(error => { console.error(error.stack);process.exitCode = 1; });

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { BrowserEngine } = require('../../engine');
const { RpaEngine } = require('../rpa-engine');
const { RpaStore } = require('../rpa-store');
const { startCookieWarmup } = require('../cookie-warmup');
const credentialCrypto = require('../../credential-crypto');
const { chooseChromiumBinary, Unavailable } = require('./native-gate-harness');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (process.platform !== 'linux') { console.log('SKIP warmup engine fixture requires Linux'); process.exitCode = 2; return; }
  let browser;
  try { browser = chooseChromiumBinary(); }
  catch (error) { if (error instanceof Unavailable) { console.log('SKIP ' + error.message); process.exitCode = 2; return; } throw error; }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-cookie-warmup-'));
  const keyFile = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  credentialCrypto.resetLocalMasterKeyCache();
  const wrapper = path.join(root, 'chromium-fixture');
  const quotedBinary = "'" + browser.binary.replace(/'/g, "'\\''") + "'";
  // The custom-kernel compatibility probe also needs headless in CI. These
  // flags belong only to a temporary test fixture, never to production policy.
  await fs.writeFile(wrapper, '#!/bin/sh\nexec ' + quotedBinary + ' --no-sandbox --headless=new "$@"\n', { mode: 0o700 });
  let visited = 0, images = 0, videos = 0, launchFlags = [];
  const server = http.createServer((req, res) => {
    if (req.url === '/warm') {
      visited++;
      res.setHeader('Set-Cookie', 'warmup_test=accepted; Path=/; Max-Age=86400');
      res.setHeader('Content-Type', 'text/html');
      res.end('<html><body style="height:5000px">Warmup<img src="/blocked.png"><video autoplay preload="auto" src="/blocked.mp4"></video></body></html>');
    } else { if (req.url === '/blocked.png') images++; if (req.url === '/blocked.mp4') videos++; res.end('asset'); }
  });
  const engine = new BrowserEngine({ getPath: () => root });
  const store = new RpaStore(path.join(root, 'rpa.json'));
  const rpa = new RpaEngine({ engine, store, userDataPath: root });
  engine.on((event) => {
    if (event.type === 'status' && event.running) launchFlags = engine.running.get(event.id)?.child?.spawnargs || [];
  });
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    await engine.init();
    await engine.kernelManager.setCustomBinary(wrapper);
    await store.load();
    await engine.syncProfiles([{ id: 'warmup-native', name: 'Warmup test', engine: 'chromium', proxy: 'Direct', networkMode: 'direct', advanced: { startUrls: 'about:blank' } }]);
    const result = await startCookieWarmup({ engine, rpaStore: store, rpaEngine: rpa }, {
      profileId: 'warmup-native', urls: ['http://127.0.0.1:' + server.address().port + '/warm'],
      headless: true, blockImages: true, blockVideo: true, autoClose: true,
      stayMin: 500, stayMax: 500, scrollMin: 100, scrollMax: 100,
    });
    let task;
    for (let i = 0; i < 400; i++) {
      task = store.getTask(result.taskId);
      if (['success', 'failed', 'cancelled'].includes(task.status)) break;
      await delay(100);
    }
    assert.equal(task.status, 'success', JSON.stringify(task.process_result));
    assert.equal(visited, 1);
    assert.equal(images, 0);
    assert.equal(videos, 0);
    assert.equal(engine.running.size, 0);
    assert.ok(launchFlags.includes('--headless=new'), 'task options reach the production spawn arguments');
    assert.ok(launchFlags.includes('--blink-settings=imagesEnabled=false'));
    const profile = engine.profiles.get('warmup-native');
    assert.equal(profile.advanced.blockImages, false, 'temporary task policy cannot overwrite saved profile settings');
    assert.equal(profile.advanced.headless, undefined);
    // Cookie snapshots in the config are opt-in for cloud backup. The
    // browser's own persistent cookie store must survive without that opt-in.
    await engine.start(profile, { headless: true });
    const { cookies } = await engine.running.get(profile.id).cdpConnection.command('Storage.getCookies', {}, { timeout: 5000 });
    assert.ok(cookies.some((cookie) => cookie.name === 'warmup_test' && cookie.value === 'accepted'));
    await engine.stop(profile.id);
    console.log('COOKIE_WARMUP_NATIVE_SELFTEST OK (real engine, persisted task, local visit, cookies, headless spawn, image/video blocking, auto-close, unchanged saved policy)');
  } finally {
    await rpa.stop();
    await engine.stopAll();
    await engine.flushPersistence();
    engine.sqliteStore?.close();
    await store.flush();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (keyFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = keyFile;
    credentialCrypto.resetLocalMasterKeyCache();
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

'use strict';

const assert = require('assert');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { BrowserEngine } = require('../../engine');
const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log('  PASS  ' + name);
  } catch (error) {
    results.push({ name, ok: false, error: error.message || String(error) });
    console.error('  FAIL  ' + name + ': ' + (error.message || String(error)));
  }
}

(async () => {
  console.log('Starting Startup Consistency & Barrier Selftest...\n');

  // -------------------------------------------------------------------------
  // A. Timezone: resolveProfileTimezone integration in engine.js
  // -------------------------------------------------------------------------
  await check('A.1: applyResolvedLocale resolves timezone from network country when timezone field is missing', async () => {
    const engine = Object.create(BrowserEngine.prototype);
    engine.networkInfo = new Map();
    engine.networkInfo.set('prof_tz_1', {
      countryCode: 'JP',
      ip: '1.2.3.4',
    });

    const profile = {
      id: 'prof_tz_1',
      exitCountryCode: '',
      exitTimezone: '',
      privacy: { timezoneMode: 'ip' },
    };

    const next = engine.applyResolvedLocale(profile);
    assert.strictEqual(next.exitTimezone, 'Asia/Tokyo');
    assert.strictEqual(next.privacy.timezone, 'Asia/Tokyo');
  });

  await check('A.2: applyResolvedLocale suppresses synthetic timezone in real timezone mode', async () => {
    const engine = Object.create(BrowserEngine.prototype);
    engine.networkInfo = new Map();
    engine.networkInfo.set('prof_tz_real', {
      countryCode: 'DE',
      timezone: 'Europe/Berlin',
      ip: '5.6.7.8',
    });

    const profile = {
      id: 'prof_tz_real',
      privacy: { timezoneMode: 'real', timezone: '' },
    };

    const next = engine.applyResolvedLocale(profile);
    assert.strictEqual(next.exitTimezone, '');
    assert.strictEqual(next.privacy.timezone, '');
  });

  await check('A.3: fingerprintPatchFromNetwork aligns exitTimezone using resolveProfileTimezone', async () => {
    const engine = Object.create(BrowserEngine.prototype);
    const network = { countryCode: 'FR', ip: '9.9.9.9' };
    const profile = { privacy: { timezoneMode: 'ip' } };

    const patch = engine.fingerprintPatchFromNetwork(network, profile);
    assert.strictEqual(patch.exitTimezone, 'Europe/Paris');
    assert.strictEqual(patch.privacy.timezone, 'Europe/Paris');
  });

  // -------------------------------------------------------------------------
  // B. Proxy Fail-Closed startup gate (current contract; the full policy
  //    matrix — old notReadyPolicy values can no longer authorize a direct
  //    fallback — lives in automation/selftests/proxy-fail-closed-selftest.js)
  // -------------------------------------------------------------------------
  const makeGateEngine = () => {
    const engine = Object.create(BrowserEngine.prototype);
    engine.profiles = new Map();
    engine.networkInfo = new Map();
    engine.running = new Set();
    engine.events = [];
    engine.emit = (e) => engine.events.push(e);
    engine.sanitizeProfile = BrowserEngine.prototype.sanitizeProfile.bind(engine);
    engine.resolveStoredProxyProfile = (p) => p;
    return engine;
  };

  await check('B.1: dead proxy blocks launch fail-closed and never falls back to direct', async () => {
    const engine = makeGateEngine();
    engine.testProxy = async () => {
      throw Object.assign(new Error('proxy unreachable'), { errorClass: 'unreachable' });
    };

    let threw = null;
    try {
      await engine.prepareProfileProxyForStart({
        id: 'prof_fail_closed',
        name: 'fail-closed',
        networkMode: 'proxy',
        proxy: 'socks5://127.0.0.1:9999',
        proxyMeta: { checkOnStart: true },
        privacy: {},
      });
    } catch (err) {
      threw = err;
    }
    assert.ok(threw, 'dead proxy must block launch');
    assert.ok(threw.message.includes('代理连接失败'), 'must stop startup with the fail-closed message');
    assert.strictEqual(threw.code, 'proxy-not-ready');
    const blocked = engine.events.find((e) => e.type === 'proxy-error' && e.code === 'proxy-not-ready');
    assert.ok(blocked, 'must emit proxy-error proxy-not-ready');
    assert.strictEqual(blocked.policy, 'block');
    assert.ok(!engine.events.some((e) => e.type === 'proxy-fallback'), 'no silent direct fallback may exist');
  });

  await check('B.2: backup proxy candidate is force-tested and promoted when the primary is dead', async () => {
    const engine = makeGateEngine();
    const probed = [];
    engine.testProxy = async (_profile, options) => {
      probed.push(options.proxy);
      if (options.proxySource === 'primary') {
        throw Object.assign(new Error('primary dead'), { errorClass: 'unreachable' });
      }
      return { proxyRaw: options.proxy, ip: '2.2.2.2', country: 'DE', countryCode: 'DE' };
    };

    const working = await engine.prepareProfileProxyForStart({
      id: 'prof_backup_promote',
      name: 'backup-promote',
      networkMode: 'proxy',
      proxy: 'socks5://primary:1080',
      proxyMeta: { checkOnStart: true, backupProxies: ['socks5://backup:1080'] },
      privacy: {},
    });
    assert.deepStrictEqual(probed, ['socks5://primary:1080', 'socks5://backup:1080'], 'both candidates must be force-tested in order');
    assert.ok(String(working.proxy).includes('backup:1080'), 'working profile must carry the promoted backup');
  });

  await check('B.3: direct networkMode bypasses the proxy gate entirely', async () => {
    const engine = makeGateEngine();
    let probes = 0;
    engine.testProxy = async () => {
      probes += 1;
      throw new Error('must not be called');
    };

    const working = await engine.prepareProfileProxyForStart({
      id: 'prof_direct_bypass',
      name: 'direct-bypass',
      networkMode: 'direct',
      proxy: '',
      proxyMeta: {},
      privacy: {},
    });
    assert.strictEqual(probes, 0, 'direct mode must not probe any proxy');
    assert.strictEqual(working.id, 'prof_direct_bypass');
  });

  // -------------------------------------------------------------------------
  // C. Launch Injection Barrier Fail-Closed & Retries
  // -------------------------------------------------------------------------
  await check('C.1: engine/start.js source integrity confirms bounded retries and fail-closed barrier', async () => {
    const fs = require('fs');
    // the _start routine moved from engine.js to the engine/start.js mixin
    const engineCode = fs.readFileSync(path.join(__dirname, '../../engine/start.js'), 'utf8');
    assert.ok(engineCode.includes('start.pre-inject-fail-attempt'), 'Must log retry attempts');
    assert.ok(engineCode.includes('injectionFailed'), 'Must define injection barrier failure check');
    assert.ok(engineCode.includes('start.navigate-barrier-errorpage'), 'Must log navigation to local error page on barrier failure');
    assert.ok(engineCode.includes('data:text/html;charset=utf-8'), 'Must navigate to safe local error page on barrier failure');
    assert.ok(engineCode.includes('blocked: true'), 'Must mark event blocked on barrier failure');
  });

  // -------------------------------------------------------------------------
  // D. Local State Pre-Spawn Sync
  // -------------------------------------------------------------------------
  await check('D.1: prepareProfileFilesForStart atomically writes Local State before spawn', async () => {
    const proto = BrowserEngine.prototype;
    const eng = {
      resetZoom: proto.resetZoom,
      applyProfilePreferences: proto.applyProfilePreferences,
      enforceDataRetention: proto.enforceDataRetention,
      resetTabs: proto.resetTabs,
      clearProfileCache: proto.clearProfileCache,
      prepareProfileFilesForStart: proto.prepareProfileFilesForStart,
      emit: () => {},
    };

    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'local-state-test-'));
    try {
      await fsp.mkdir(path.join(root, 'Default'), { recursive: true });
      await fsp.writeFile(path.join(root, 'Default', 'Preferences'), JSON.stringify({
        browser: { default_zoom_level: 0 },
        partition: { per_host_zoom_levels: {} },
        profile: { exit_type: 'Normal', exited_cleanly: true },
      }));

      const testProfile = {
        id: 'test_prof_ls',
        language: 'ko-KR,ko',
        advanced: { clearCacheOnStart: false, saveCookies: true, savePasswords: true, saveBookmarks: true,
          saveLocalStorage: true, saveIndexedDB: true, saveHistory: true, allowSignin: true, showBookmarkBar: true },
        privacy: { media: 'allow', geoMode: 'allow', fontMode: 'default' },
      };

      await eng.prepareProfileFilesForStart(root, testProfile, false);

      const localStateFile = path.join(root, 'Local State');
      assert.ok(await fsp.stat(localStateFile), 'Local State file must exist');

      const localState = JSON.parse(await fsp.readFile(localStateFile, 'utf8'));
      assert.strictEqual(localState.intl?.app_locale, 'ko-KR');

      // Verify Preferences is also populated (dual write)
      const prefs = JSON.parse(await fsp.readFile(path.join(root, 'Default', 'Preferences'), 'utf8'));
      assert.strictEqual(prefs.intl?.accept_languages, 'ko-KR,ko');
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  const failed = results.filter((item) => !item.ok);
  if (failed.length) {
    console.error('startup-consistency-and-barrier-selftest: FAIL ' + (results.length - failed.length) + '/' + results.length);
    process.exitCode = 1;
  } else {
    console.log('startup-consistency-and-barrier-selftest: OK ' + results.length + '/' + results.length);
  }
})();

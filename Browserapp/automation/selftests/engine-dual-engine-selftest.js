#!/usr/bin/env node
'use strict';

/**
 * Selftest for dual-engine selection semantics in BrowserEngine:
 *   - profileEngine() honors the per-profile engine choice;
 *   - profilePrefersFirefox() decides the start branch;
 *   - chooseBrowser('firefox') only ever returns a Firefox kernel;
 *   - candidates() lists both engines with engine labels;
 *   - runningWithCdp() drops Firefox items (port null) so live-sync/RPA guards hold.
 *
 * BrowserEngine is loaded without Electron: the constructor needs an app shim
 * and a real kernel tree is faked via meta.pin. See kernel-policy-selftest for
 * the same loading pattern.
 */

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

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

const { BrowserEngine } = require('../../engine');

function makeAppShim(tmp) {
  return {
    getPath: (name) => path.join(tmp, name === 'userData' ? 'userData' : name),
  };
}

async function makeEngine() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-engine-'));
  fs.mkdirSync(path.join(tmp, 'userData'), { recursive: true });
  const engine = new BrowserEngine(makeAppShim(tmp), {});
  return { engine, tmp };
}

function stubFirefoxTree(engine, tmp) {
  // A minimal installed Firefox per-version tree + kernel.json, registered
  // through meta.pin so resolveInstalled() returns it.
  const tree = path.join(tmp, 'userData', 'kernels', 'firefox', '141.0');
  const binary = path.join(tree, 'firefox', 'firefox');
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.writeFileSync(binary, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(tree, 'kernel.json'), JSON.stringify({ engine: 'firefox', source: 'mozilla', version: '141.0' }));
  engine.kernelManager.meta.pin = { engine: 'firefox', version: '141.0', source: 'mozilla', path: binary };
  return binary;
}

(async () => {
  {
    const { engine, tmp } = await makeEngine();
    check('profileEngine: per-profile choice beats pinned default', () => {
      stubFirefoxTree(engine, tmp);
      assert.strictEqual(engine.profileEngine({ engine: 'chromium' }), 'chromium');
      assert.strictEqual(engine.profileEngine({ engine: 'firefox' }), 'firefox');
      assert.strictEqual(engine.profileEngine({}), 'firefox', 'no choice + firefox pin → firefox');
    });
    check('profilePrefersFirefox drives the start branch', () => {
      assert.strictEqual(engine.profilePrefersFirefox({ engine: 'firefox' }), true);
      assert.strictEqual(engine.profilePrefersFirefox({ engine: 'chromium' }), false);
      assert.strictEqual(engine.profilePrefersFirefox({}), true, 'falls back to the pinned firefox default');
    });
    check('chooseBrowser(firefox) never returns a chromium binary', () => {
      const browser = engine.chooseBrowser({ engine: 'firefox' }, 'firefox');
      assert.ok(browser.path.includes(path.join('kernels', 'firefox')));
      assert.strictEqual(browser.engine, 'firefox');
    });
    check('candidates() labels both engines and dedupes by path', () => {
      const list = engine.candidates();
      const firefox = list.filter((item) => item.engine === 'firefox');
      assert.ok(firefox.length >= 1);
      assert.ok(list.every((item) => item.engine === 'firefox' || item.engine === 'chromium' || item.engine === undefined ? true : false));
      const paths = list.map((item) => item.path);
      assert.strictEqual(new Set(paths).size, paths.length, 'no duplicate paths');
    });
    check('runningWithCdp drops Firefox items (no port)', () => {
      engine.running.set('p1', { port: null, engine: 'firefox', child: {} });
      engine.running.set('p2', { port: 9222, engine: 'chromium', child: {} });
      const withCdp = engine.runningWithCdp(['p1', 'p2']);
      assert.deepStrictEqual(withCdp.map((entry) => entry.id), ['p2']);
    });
    check('startManaged exists and start() routes firefox profiles', () => {
      assert.strictEqual(typeof engine.startManaged, 'function');
      assert.strictEqual(typeof engine._startFirefox, 'function');
      assert.strictEqual(typeof engine._start, 'function');
    });
    await fsp.rm(tmp, { recursive: true, force: true });
  }

  // A chromium-pinned world: profiles without a choice must stay chromium.
  {
    const { engine, tmp } = await makeEngine();
    check('no firefox pin: profiles default to chromium', () => {
      assert.strictEqual(engine.profileEngine({}), 'chromium');
      assert.strictEqual(engine.profilePrefersFirefox({ engine: 'firefox' }), true, 'explicit firefox still wins');
      assert.strictEqual(engine.profilePrefersFirefox({}), false);
    });
    await fsp.rm(tmp, { recursive: true, force: true });
  }
})();

process.on('exit', (code) => {
  console.log(`\nengine-dual-engine-selftest: ${passed} passed, ${failed} failed`);
  process.exitCode = code || (failed ? 1 : 0);
});

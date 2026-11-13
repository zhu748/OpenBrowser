'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { BrowserEngine } = require('../../engine');
const { buildEditorUa } = require('../editor-ua');
const { cftPlatformKey } = require('../browser-kernel');
const { chromeForTestingBinaryRelative } = require('../kernel/discovery');
const { firefoxBinaryRelative, firefoxPlatformDir } = require('../kernel-versions');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-profile-kernel-'));
  const engine = new BrowserEngine({ getPath: () => root });
  engine.kernelManager.resourceRoots = [];
  const install = async (family, version) => {
    const tree = path.join(root, 'kernels', family === 'firefox' ? 'firefox' : 'chromium-versions', version);
    const relative = family === 'firefox' ? firefoxBinaryRelative(firefoxPlatformDir()) : chromeForTestingBinaryRelative(cftPlatformKey());
    const binary = path.join(tree, relative);
    await fs.mkdir(path.dirname(binary), { recursive: true });
    await fs.writeFile(binary, '', { mode: 0o700 });
    await fs.writeFile(path.join(tree, 'kernel.json'), JSON.stringify({ version, engine: family }));
    return binary;
  };
  try {
    const chromeOld = await install('chromium', '156.0.8078.79');
    const chromeNew = await install('chromium', '156.0.8078.80');
    const firefox = await install('firefox', '160.0');
    const esr = await install('firefox', '153.6.0esr');
    // A fresh per-version download is selectable before pinning any default.
    assert.equal(engine.kernelStatus().installed, false);
    engine.ensureIndependentKernel = async () => { throw new Error('must not download another kernel'); };
    assert.ok((await engine.ensureKernelBootstrap()).path);
    assert.equal(engine.chooseBrowser({ engine: 'chromium', engineVersion: '156.0.8078.79' }).path, chromeOld);
    assert.equal(engine.chooseBrowser({ engine: 'chromium', engineVersion: '156' }).path, chromeNew);
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: '160.0' }).path, firefox);
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: '153.6.0esr' }).path, esr);
    engine.kernelManager.meta.pin = { engine: 'chromium', version: '156.0.8078.79', path: chromeOld };
    assert.equal(engine.chooseBrowser({ engine: 'chromium', engineVersion: 'latest' }).path, chromeOld);
    assert.equal(engine.chooseBrowser({ engine: 'chromium', engineVersion: '156.0.8078.80' }).path, chromeNew);
    engine.kernelManager.meta.pin = { engine: 'firefox', version: '153.6.0esr', path: esr };
    assert.equal(engine.chooseBrowser({ engine: 'chromium', engineVersion: '156.0.8078.80' }).path, chromeNew);
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: 'latest' }).path, esr);
    assert.match(buildEditorUa(engine, { engine: 'firefox', engineVersion: '160.0' }).userAgent, /Firefox\/160\.0/);
    assert.equal(buildEditorUa(engine, { engine: 'chromium', engineVersion: '156.0.8078.80' }).kernelVersion, '156.0.8078.80');
    for (const family of ['chromium', 'firefox']) {
      const profile = { engine: family, engineVersion: '999.0' };
      assert.throws(() => engine.chooseBrowser(profile), { code: 'KERNEL_VERSION_NOT_INSTALLED' });
      assert.throws(() => buildEditorUa(engine, profile), { code: 'KERNEL_VERSION_NOT_INSTALLED' });
    }
    // Removing a downloaded tree must not silently switch an exact selection.
    await fs.rm(path.join(root, 'kernels', 'chromium-versions', '156.0.8078.80'), { recursive: true });
    assert.throws(() => engine.chooseBrowser({ engine: 'chromium', engineVersion: '156.0.8078.80' }), { code: 'KERNEL_VERSION_NOT_INSTALLED' });
    assert.equal(engine.chooseBrowser({ engine: 'chromium', engineVersion: '156' }).path, chromeOld);
    engine.kernelManager.meta.pin = null;
    await fs.rm(path.join(root, 'kernels', 'chromium-versions'), { recursive: true });
    assert.equal(engine.kernelStatus().installed, false);
    assert.equal((await engine.ensureKernelBootstrap()).engine, 'firefox', 'a Firefox-only download must not trigger Chrome bootstrap');
    console.log('KERNEL_PROFILE_SELECTION_SELFTEST OK (un-pinned downloads, exact versions, legacy major, ESR, default pin, UA binding, missing/deleted kernels, no extra download)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

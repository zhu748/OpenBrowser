'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { runInNewContext } = require('node:vm');
const { BrowserEngine } = require('../../engine');
const { buildEditorUa } = require('../editor-ua');
const { BrowserKernelManager, cftPlatformKey } = require('../browser-kernel');
const { chromeForTestingBinaryRelative } = require('../kernel/discovery');
const { firefoxBinaryRelative, firefoxCdnUrl, firefoxPlatformDir, firefoxSumsUrl } = require('../kernel-versions');

async function checkFirefoxArchiveIdentity(root) {
  const platform = firefoxPlatformDir();
  if (!platform) return;
  const data = path.join(root, 'firefox-identity');
  const plain = '128.10.0', esr = plain + 'esr';
  const expectedBinary = version => path.join(data, 'kernels', 'firefox', version, firefoxBinaryRelative(platform));
  const artifact = `${platform}/en-US/${platform.startsWith('win') ? `Firefox Setup ${esr}.msi`
    : platform === 'mac' ? `Firefox ${esr}.dmg` : `firefox-${esr}.tar.xz`}`;
  const archive = Buffer.from('offline synthetic kernel archive');
  const sha256 = createHash('sha256').update(archive).digest('hex');
  const filename = require.resolve('../browser-kernel');
  const realRequire = createRequire(filename), isolated = { exports: {} };
  const mockExtract = async (source, dest) => {
    assert.deepEqual(await fs.readFile(source), archive);
    const binary = path.join(dest, firefoxBinaryRelative(platform));
    await fs.mkdir(path.dirname(binary), { recursive: true });
    await fs.writeFile(binary, '', { mode: 0o700 });
    await fs.writeFile(path.join(path.dirname(binary), 'application.ini'), `[App]\nName=Firefox\nVersion=${plain}\n`);
  };
  class OfflineDownload {
    constructor(url, options) {
      assert.equal(url, firefoxCdnUrl(esr, artifact));
      assert.equal(options.expectedSha256, sha256);
      this.dest = options.destPath;
    }
    on() {}
    async start() {
      await fs.writeFile(this.dest, archive);
      return { path: this.dest, bytes: archive.length, sha256 };
    }
  }
  runInNewContext(await fs.readFile(filename, 'utf8'), {
    module: isolated, process, Buffer, URL,
    require(name) {
      if (name === './kernel/metadata') return { createKernelMetadataClient: () => ({
        fetchJson: () => assert.fail('unexpected catalog fetch'),
        fetchText: async url => { assert.equal(url, firefoxSumsUrl(esr)); return `${sha256}  ${artifact}\n`; },
      }) };
      if (name === './downloader') return { Downloader: OfflineDownload };
      if (name === './kernel/archive') return { ...realRequire(name), extractTarXz: mockExtract,
        extractDmg: mockExtract, extractMsi: mockExtract };
      if (name === 'child_process') return {
        execFile: (binary, args, _options, done) => {
          assert.equal(binary, expectedBinary(esr));
          assert.deepEqual([...args], ['--version']);
          done(null, { stdout: '', stderr: '' }); // Only application.ini reports the version.
        },
        spawn: () => assert.fail('must not run a browser or installer'),
      };
      if (name === 'http') return { get: () => assert.fail('must not use the network') };
      return realRequire(name);
    },
  }, { filename });
  const MockedManager = isolated.exports.BrowserKernelManager;
  const manager = new MockedManager(data);
  manager.baselineTree = async () => {};
  const result = await manager.installFirefoxVersion(esr);
  assert.equal(result.version, esr);
  assert.equal(result.reportedVersion, plain);
  const esrTree = path.join(data, 'kernels', 'firefox', esr);
  const manifest = path.join(esrTree, 'kernel.json');
  const recorded = JSON.parse(await fs.readFile(manifest, 'utf8'));
  assert.equal(recorded.version, esr);
  assert.equal(recorded.reportedVersion, plain);
  const checked = await manager.checkKernel({ engine: 'firefox', version: esr });
  assert.equal(checked.version, esr);
  assert.equal(checked.reportedVersion, plain);

  // A workspace from the old installer can have a plain version both in its
  // ESR manifest and in a persisted pin. The normal release may also exist.
  const plainTree = path.join(data, 'kernels', 'firefox', plain);
  await fs.mkdir(path.dirname(expectedBinary(plain)), { recursive: true });
  await fs.writeFile(expectedBinary(plain), '');
  await fs.writeFile(path.join(plainTree, 'kernel.json'), JSON.stringify({ engine: 'firefox', version: plain }));
  await fs.writeFile(manifest, JSON.stringify({ engine: 'firefox', source: 'mozilla', version: plain }));
  manager.meta.pin = { engine: 'firefox', source: 'mozilla', version: plain, path: expectedBinary(esr) };
  await manager.saveMeta();
  const engine = new BrowserEngine({ getPath: () => data });
  engine.kernelManager = new BrowserKernelManager(data);
  await engine.kernelManager.loadMeta();
  assert.equal(engine.kernelManager.resolveInstalled().version, esr, 'legacy pin is recovered using its path');
  assert.equal(engine.kernelManager.resolveInstalled().reportedVersion, plain);
  assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: 'latest' }).path, expectedBinary(esr));
  assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: esr }).path, expectedBinary(esr));
  assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: plain }).path, expectedBinary(plain));
  const detachedTree = path.join(data, 'detached-esr');
  await fs.rename(esrTree, detachedTree);
  try {
    assert.equal(engine.kernelManager.resolveInstalled(), null, 'a missing legacy ESR pin does not pick a regular release');
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: plain }).path, expectedBinary(plain));
  } finally { await fs.rename(detachedTree, esrTree); }
  assert.equal((await engine.kernelManager.pinKernel({ engine: 'firefox', version: esr })).version, esr);
  assert.equal((await engine.kernelManager.pinKernel({ engine: 'firefox', version: plain })).path, expectedBinary(plain));
  assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: esr }).path, expectedBinary(esr));
  await fs.rm(plainTree, { recursive: true });
  assert.throws(() => engine.chooseBrowser({ engine: 'firefox', engineVersion: plain }), { code: 'KERNEL_VERSION_NOT_INSTALLED' });
}

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
    const esrOld = await install('firefox', '128.9.0esr');
    const esrNew = await install('firefox', '128.10.0esr');
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: 'latest' }).path, esrNew);
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: '128' }).path, esrNew);
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: '128.9.0esr' }).path, esrOld);
    engine.kernelManager.meta.pin = { engine: 'firefox', version: '128.9.0esr', path: esrOld };
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: 'latest' }).path, esrOld);
    assert.equal(engine.chooseBrowser({ engine: 'firefox', engineVersion: '128' }).path, esrNew);
    engine.kernelManager.meta.pin = null;
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
    await checkFirefoxArchiveIdentity(root);
    console.log('KERNEL_PROFILE_SELECTION_SELFTEST OK (exact versions, legacy major, ESR archive identity, profile selection and pins)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

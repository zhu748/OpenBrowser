'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { hasRuntime, ensureLockedElectronRuntime } = require('./ensure-host-runtime');
const { resolveHostDist, findHostWindowsExe, inspectLockedElectronRuntime } = require('./resolve-host-dist');
const { verifyStagedDesktop } = require('./verify-online-package');
const { workbenchDigest } = require('./package-digests');

function write(file, bytes, executable = false) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes, { mode: executable ? 0o755 : 0o644 });
  return file;
}

// Inert headers only: test the file contract without installing, starting, or
// trusting a downloaded executable. Unix modes are tested on Unix runners.
function image(platform, arch = 'x64', { shared = false } = {}) {
  const binary = Buffer.alloc(256);
  if (platform === 'linux') {
    binary.set([127, 69, 76, 70, 2, 1, 1]);
    binary.writeUInt16LE(3, 16); // ET_DYN (PIE or shared library)
    binary.writeUInt16LE(arch === 'x64' ? 0x3e : 0xb7, 18);
    binary.writeBigUInt64LE(0x100n, 24);
    binary.writeBigUInt64LE(64n, 32);
    binary.writeUInt16LE(64, 52);
    binary.writeUInt16LE(56, 54);
    binary.writeUInt16LE(shared ? 1 : 2, 56);
    binary.writeUInt32LE(1, 64); // executable PT_LOAD
    binary.writeUInt32LE(1, 68);
    binary.writeBigUInt64LE(0x200n, 96);
    if (!shared) binary.writeUInt32LE(3, 120); // PT_INTERP
  } else if (platform === 'win32') {
    binary.writeUInt16LE(0x5a4d, 0);
    binary.writeUInt32LE(64, 60);
    binary.writeUInt32LE(0x4550, 64);
    binary.writeUInt16LE(arch === 'x64' ? 0x8664 : 0xaa64, 68);
    binary.writeUInt16LE(1, 70);
    binary.writeUInt16LE(112, 84);
    binary.writeUInt16LE(shared ? 0x2002 : 2, 86);
    binary.writeUInt16LE(0x20b, 88);
    binary.writeUInt32LE(128, 104);
  } else {
    binary.writeUInt32LE(0xfeedfacf, 0);
    binary.writeUInt32LE(arch === 'x64' ? 0x01000007 : 0x0100000c, 4);
    binary.writeUInt32LE(shared ? 6 : 2, 12);
    binary.writeUInt32LE(1, 16);
    binary.writeUInt32LE(24, 20);
  }
  return binary;
}

function temp(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-host-packaging-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

const version = '43.8.8';
function electronPackage(root) {
  const electron = path.join(root, 'node_modules', 'electron');
  write(path.join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/electron': { version } } }));
  write(path.join(electron, 'package.json'), JSON.stringify({ name: 'electron', version }));
  return electron;
}

function host(dist, platform, arch, branded = false) {
  if (platform === 'darwin') {
    const product = branded ? 'OpenBrowser' : 'Electron';
    const contents = path.join(dist, product + '.app', 'Contents');
    write(path.join(contents, 'Info.plist'), `<key>CFBundleExecutable</key>\n<string>${product}</string>`);
    const framework = path.join(contents, 'Frameworks', 'Electron Framework.framework');
    write(path.join(framework, 'Versions', 'A', 'Electron Framework'), 'inert framework fixture');
    fs.symlinkSync('Versions/A/Electron Framework', path.join(framework, 'Electron Framework'));
    return write(path.join(contents, 'MacOS', product), image(platform, arch), true);
  }
  for (const resource of ['icudtl.dat', 'resources.pak']) write(path.join(dist, resource), 'inert Chromium resource');
  const entry = (branded ? 'OpenBrowser' : 'electron') + (platform === 'win32' ? '.exe' : '');
  return write(path.join(dist, entry), image(platform, arch), true);
}

test('Linux never treats a partial directory or its ELF shared libraries as a desktop entry', {
  skip: process.platform === 'win32',
}, t => {
  const root = temp(t);
  const electron = electronPackage(root);
  const dist = path.join(electron, 'dist');
  write(path.join(dist, 'LICENSE'), 'fixture');
  write(path.join(dist, 'libEGL.so'), image('linux', 'x64', { shared: true }), true);
  assert.equal(hasRuntime(electron, 'linux', 'x64'), false);
  assert.throws(() => resolveHostDist(root, 'linux', 'x64'), /Missing ordinary executable/);
  const shouldNotDownload = { platform: 'linux', invoke: () => assert.fail('would merge into partial dist') };
  assert.throws(() => ensureLockedElectronRuntime(root, 'x64', shouldNotDownload), /Missing ordinary executable/);
  const entry = write(path.join(dist, 'electron'), image('linux', 'x64', { shared: true }), true);
  assert.throws(() => ensureLockedElectronRuntime(root, 'x64', shouldNotDownload), /Not a linux\/x64 desktop executable/);
  host(dist, 'linux', 'x64');
  write(path.join(dist, 'version'), 'v' + version + '\n');
  assert.deepEqual(ensureLockedElectronRuntime(root, 'x86_64', shouldNotDownload), { dist, entry });
  fs.unlinkSync(path.join(dist, 'resources.pak'));
  assert.equal(hasRuntime(electron, 'linux', 'x64'), false);
  assert.throws(() => ensureLockedElectronRuntime(root, 'x64', shouldNotDownload), /resources\.pak/);
});

test('Windows finds the locked Electron entry, not a helper or stale branded runtime', t => {
  const root = temp(t);
  const electron = electronPackage(root);
  const dist = path.join(electron, 'dist');
  const helper = write(path.join(dist, 'diagnostics.exe'), image('win32'));
  write(path.join(dist, 'version'), version);
  const entry = host(dist, 'win32', 'x64');
  assert.equal(findHostWindowsExe(dist), entry);
  assert.deepEqual(inspectLockedElectronRuntime(root, 'win32', 'x64'), { dist, entry });
  write(path.join(dist, 'version'), '42.0.0');
  assert.throws(() => inspectLockedElectronRuntime(root, 'win32', 'x64'), /dist version does not match/);
  write(path.join(dist, 'version'), version);
  assert.throws(() => inspectLockedElectronRuntime(root, 'win32', 'arm64'), /Not a win32\/arm64/);
  write(entry, image('win32', 'x64', { shared: true }));
  assert.throws(() => inspectLockedElectronRuntime(root, 'win32', 'x64'), /Not a win32\/x64/);
  write(entry, image('win32'));
  const branded = host(dist, 'win32', 'x64', true);
  assert.throws(() => findHostWindowsExe(dist), /Mixed stock and branded/);
  assert.throws(() => inspectLockedElectronRuntime(root, 'win32', 'x64'), /mixed or branded/);
  fs.unlinkSync(entry);
  assert.equal(findHostWindowsExe(dist), branded, 'dev still recognizes an unambiguous branded layout');
  fs.unlinkSync(branded);
  assert.equal(fs.existsSync(helper), true);
  assert.throws(() => findHostWindowsExe(dist), /Missing ordinary file/);
});

test('only an absent dist can use the existing installer; the resulting dist is checked again', t => {
  const root = temp(t);
  const electron = electronPackage(root);
  const installer = write(path.join(electron, 'install.js'), 'inert installer fixture');
  const dist = path.join(electron, 'dist');
  let calls = 0;
  const invoke = (command, args, cwd) => {
    assert.equal(command, process.execPath);
    assert.deepEqual(args, [installer]);
    assert.equal(cwd, root);
    ++calls;
    host(dist, 'win32', 'arm64'); // accidental wrong-architecture output
    write(path.join(dist, 'version'), version);
  };
  const options = { platform: 'win32', invoke };
  assert.throws(() => ensureLockedElectronRuntime(root, 'x64', options), /Not a win32\/x64/);
  assert.throws(() => ensureLockedElectronRuntime(root, 'x64', options), /Not a win32\/x64/);
  assert.equal(calls, 1);
  write(path.join(electron, 'package.json'), JSON.stringify({ name: 'electron', version: '42.0.0' }));
  assert.throws(() => ensureLockedElectronRuntime(root, 'x64', options), /npm package does not match/);
});

for (const [platform, arch] of [['win32', 'x64'], ['linux', 'x64'], ['darwin', 'x64'], ['darwin', 'arm64']]) {
  test(`staged ${platform}/${arch} checks the real entry path and verified workbench bytes without launching`, {
    skip: process.platform === 'win32' && platform !== 'win32',
  }, t => {
    const root = temp(t);
    const electron = electronPackage(root);
    const dist = path.join(electron, 'dist');
    const hostEntry = host(dist, platform, arch);
    write(path.join(dist, 'version'), version + '\n');
    assert.deepEqual(inspectLockedElectronRuntime(root, platform, arch), { dist, entry: hostEntry });
    const stage = path.join(root, 'stage');
    const brandedDist = platform === 'darwin' ? stage : path.join(stage, 'runtime');
    const entry = host(brandedDist, platform, arch, true);
    const resources = path.join(brandedDist, ...(platform === 'darwin' ? ['OpenBrowser.app', 'Contents', 'Resources'] : ['resources']));
    const workbench = path.join(resources, 'app', 'roxy-ui');
    const index = write(path.join(workbench, 'index.html'), 'inert main index');
    write(path.join(workbench, 'source-frontend', 'index.html'), 'inert source index');
    const digest = workbenchDigest(workbench);
    assert.equal(verifyStagedDesktop(stage, platform, arch, digest), path.join(resources, 'app'));
    write(index, 'inert MAIN index'); // same size, different bytes
    assert.throws(() => verifyStagedDesktop(stage, platform, arch, digest), /does not match the verified build/);
    write(index, 'inert main index');
    if (platform === 'darwin') {
      const plist = path.join(brandedDist, 'OpenBrowser.app', 'Contents', 'Info.plist');
      write(plist, '<key>CFBundleExecutable</key><string>Electron</string>');
      assert.throws(() => verifyStagedDesktop(stage, platform, arch, digest), /CFBundleExecutable/);
      write(plist, '<key>CFBundleExecutable</key><string>OpenBrowser</string>');
    }
    write(entry, image(platform, arch === 'x64' ? 'arm64' : 'x64'));
    assert.throws(() => verifyStagedDesktop(stage, platform, arch, digest), /desktop executable/);
  });
}

test('workbench digest CLI hashes exactly the tree; release verifier needs the CI digest', t => {
  const root = temp(t);
  write(path.join(root, 'index.html'), 'main');
  const alternate = write(path.join(root, 'source-frontend', 'index.html'), 'alternate');
  const cli = script => path.join(__dirname, script);
  const execute = (script, ...args) => spawnSync(process.execPath, [cli(script), ...args], { encoding: 'utf8' });
  assert.equal(execute('package-digests.js', root).stdout.trim(), workbenchDigest(root));
  assert.match(execute('verify-online-package.js', '--github-output', path.join(root, 'out')).stderr,
    /CI must supply the digest/);
  assert.equal(fs.existsSync(path.join(root, 'out')), false);
  fs.unlinkSync(alternate);
  assert.match(execute('package-digests.js', root).stderr, /Missing workbench entry: source-frontend\/index\.html/);
});

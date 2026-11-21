'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const { packageArtifactStem, shouldShipOpenBrowser148Kernel, pruneForeignKernelSeeds } = require('../../scripts/package-portable');
const { isRuntimeResource } = require('../../scripts/runtime-manifest');
const previous = process.env.OPENBROWSER_PACKAGE_VARIANT;
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'openbrowser-online-policy-'));
try {
  process.env.OPENBROWSER_PACKAGE_VARIANT = 'without-kernel';
  for (const [platform, arch, name] of [
    ['win32', 'x86_64', 'Windows-x86_64'], ['linux', 'x86_64', 'Linux-x86_64'],
    ['darwin', 'x86_64', 'macOS-x86_64'], ['darwin', 'arm64', 'macOS-arm64'],
  ]) {
    assert.equal(packageArtifactStem(platform, arch), `OpenBrowser-${name}-without-kernel`);
    assert.equal(shouldShipOpenBrowser148Kernel(platform, arch), false, 'Intel macOS also supports downloading after installation');
    const kernels = path.join(fixture, 'kernels', 'meta');
    fs.mkdirSync(kernels, { recursive: true });
    fs.writeFileSync(path.join(kernels, 'wayfern.json'), 'version https://git-lfs.github.com/spec/v1');
    pruneForeignKernelSeeds(fixture, platform, arch);
    assert.equal(fs.existsSync(path.join(fixture, 'kernels')), false, 'no LFS pointers survive an online build');
  }
  process.env.OPENBROWSER_PACKAGE_VARIANT = 'with-kernel';
  assert.throws(() => shouldShipOpenBrowser148Kernel('darwin', 'x86_64'), /no longer supported/);
  delete process.env.OPENBROWSER_PACKAGE_VARIANT;
  assert.equal(shouldShipOpenBrowser148Kernel('darwin', 'x86_64'), false);
  assert.equal(packageArtifactStem('darwin', 'x86_64'), 'OpenBrowser-macOS-x86_64-without-kernel', 'the default build also downloads its kernel later');
  assert.equal(isRuntimeResource('assets/fonts/_preview/index.html'), false);
  assert.equal(isRuntimeResource('assets/fonts/_preview/fonts/cubic11.ttf'), false);
  assert.equal(isRuntimeResource('assets/font-subsets/index.json'), true);
  const names = ['OpenBrowser-Windows-x86_64-without-kernel-setup.exe', 'OpenBrowser-Linux-x86_64-without-kernel.tar.gz'];
  const source = 'a'.repeat(40), oldSource = 'b'.repeat(40);
  const run = (command, sha, ...assets) => spawnSync(process.execPath, [
    path.join(__dirname, '../../scripts/release-artifact-manifest.js'), command, fixture, 'v1.0.0', sha, ...assets,
  ], { encoding: 'utf8' });
  for (const name of names) fs.writeFileSync(path.join(fixture, name), `fixture for ${name}`);
  assert.equal(run('create', source, names[0]).status, 0);
  assert.equal(run('create', oldSource, names[1]).status, 0);
  assert.match(run('verify', source, ...names).stderr, /does not match/);
  assert.equal(fs.existsSync(path.join(fixture, 'SHA256SUMS.txt')), false);
  assert.equal(run('create', source, names[1]).status, 0);
  fs.appendFileSync(path.join(fixture, names[1]), 'changed bytes');
  assert.match(run('verify', source, ...names).stderr, /does not match/);
  assert.equal(run('create', source, names[1]).status, 0);
  assert.equal(run('verify', source, ...names).status, 0);
  const expected = names.map(name => `${crypto.hash('sha256', fs.readFileSync(path.join(fixture, name)))} *${name}\n`).join('');
  assert.equal(fs.readFileSync(path.join(fixture, 'SHA256SUMS.txt'), 'utf8'), expected);
  console.log('ONLINE_PACKAGE_POLICY_SELFTEST OK (four online variants, default without kernel, no LFS resources, legacy bundled build rejected)');
} finally {
  if (previous === undefined) delete process.env.OPENBROWSER_PACKAGE_VARIANT;
  else process.env.OPENBROWSER_PACKAGE_VARIANT = previous;
  fs.rmSync(fixture, { recursive: true, force: true });
}

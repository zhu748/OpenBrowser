'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { packageArtifactStem, shouldShipOpenBrowser148Kernel, pruneForeignKernelSeeds } = require('../../scripts/package-portable');
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
  assert.equal(shouldShipOpenBrowser148Kernel('darwin', 'x86_64'), true);
  assert.equal(packageArtifactStem('darwin', 'x86_64'), 'OpenBrowser-macOS-x86_64', 'retain existing bundled Intel release name');
  console.log('ONLINE_PACKAGE_POLICY_SELFTEST OK (four online variants, kernel/LFS pruning, existing bundled Intel contract)');
} finally {
  if (previous === undefined) delete process.env.OPENBROWSER_PACKAGE_VARIANT;
  else process.env.OPENBROWSER_PACKAGE_VARIANT = previous;
  fs.rmSync(fixture, { recursive: true, force: true });
}

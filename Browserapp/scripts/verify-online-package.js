'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { packageArtifactStem, packageArch } = require('./package-portable');
const { workbenchDigest } = require('./package-digests');
const { verifyPackagedHost } = require('./resolve-host-dist');
const { verifyFinalArtifact } = require('./verify-final-artifact');

function verifyStagedDesktop(packageRoot, platform, arch, expectedWorkbench) {
  assert.match(expectedWorkbench || '', /^[a-f0-9]{64}$/u, 'Build and record the verified workbench digest first');
  verifyPackagedHost(packageRoot, platform, arch);
  const resources = platform === 'darwin'
    ? path.join(packageRoot, 'OpenBrowser.app', 'Contents', 'Resources')
    : path.join(packageRoot, 'runtime', 'resources');
  const appRoot = path.join(resources, 'app');
  assert.equal(workbenchDigest(path.join(appRoot, 'roxy-ui')), expectedWorkbench,
    'Staged workbench does not match the verified build');
  return appRoot;
}

function main() {
  const { values } = parseArgs({ options: {
    'github-output': { type: 'string' },
    'workbench-sha': { type: 'string' },
  } });
  if (values['github-output']) assert.ok(values['workbench-sha'], 'CI must supply the digest of the verified workbench');
  const root = path.resolve(__dirname, '..');
  const stem = packageArtifactStem();
  assert.ok(stem.endsWith('-without-kernel'));
  const platform = process.platform;
  const packageRoot = path.join(root, 'dist', stem);
  const appRoot = verifyStagedDesktop(packageRoot, platform, packageArch,
    values['workbench-sha'] ?? workbenchDigest(path.join(root, 'roxy-ui')));
  const sourceVersion = require('../package.json').version;
  assert.equal(JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8')).version, sourceVersion);
  assert.equal(fs.existsSync(path.join(appRoot, 'kernels')), false, 'online installer must not contain kernel files or LFS pointers');
  const core = path.join(path.dirname(appRoot), 'rust-core', platform === 'win32' ? 'openbrowser-core.exe' : 'openbrowser-core');
  const version = JSON.parse(execFileSync(core, ['version'], { encoding: 'utf8', timeout: 5000 }));
  assert.equal(version.version, sourceVersion);
  assert.equal(version.control_protocol, 1);
  const suffix = platform === 'win32' ? '-setup.exe' : platform === 'darwin' ? '.dmg' : '.tar.gz';
  const artifact = 'dist/' + stem + suffix;
  const packagedUpdater = require(path.join(appRoot, 'automation', 'app-update.js'));
  assert.equal(packagedUpdater.updateAssetName(), path.basename(artifact), 'packaged updater must request this platform installer');
  const packagedTrust = require(path.join(appRoot, 'automation', 'update-trust.js'));
  assert.deepEqual(packagedTrust.trustedPublicKeys(), require('../automation/update-trust').trustedPublicKeys());
  const proof = require('../automation/selftests/data/update-trust-current-proof.json');
  assert.equal(packagedTrust.verifyManifestSignature(Buffer.from(proof.manifest), Buffer.from(proof.signatureBase64, 'base64')).ok,
    true, 'packaged app must trust the current release signer');
  assert.ok(fs.statSync(path.join(root, artifact)).size > 4096, 'installer must contain a real payload');
  const verification = verifyFinalArtifact(platform, packageRoot, path.join(root, artifact));
  if (values['github-output']) fs.appendFileSync(values['github-output'], `artifact=${artifact}\n`);
  console.log(`Staged payload: desktop entry ${platform}/${packageArch}, verified workbench, app/core ${sourceVersion}, no bundled kernel, matching updater asset and signing key`);
  console.log(`Final artifact ${artifact}: ${verification}`);
}

if (require.main === module) main();
module.exports = { verifyStagedDesktop };

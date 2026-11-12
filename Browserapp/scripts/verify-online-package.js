'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { packageArtifactStem } = require('./package-portable');

const root = path.resolve(__dirname, '..');
const stem = packageArtifactStem();
assert.ok(stem.endsWith('-without-kernel'));
const packageRoot = path.join(root, 'dist', stem);
const resources = process.platform === 'darwin'
  ? path.join(packageRoot, 'OpenBrowser.app', 'Contents', 'Resources')
  : path.join(packageRoot, 'runtime', 'resources');
const appRoot = path.join(resources, 'app');
const sourceVersion = require('../package.json').version;
assert.equal(JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8')).version, sourceVersion);
assert.equal(fs.existsSync(path.join(appRoot, 'kernels')), false, 'online installer must not contain kernel files or LFS pointers');
const core = path.join(resources, 'rust-core', process.platform === 'win32' ? 'openbrowser-core.exe' : 'openbrowser-core');
const version = JSON.parse(execFileSync(core, ['version'], { encoding: 'utf8', timeout: 5000 }));
assert.equal(version.version, sourceVersion);
assert.equal(version.control_protocol, 1);
if (process.platform === 'darwin') execFileSync('codesign', ['--verify', '--deep', '--strict', path.join(packageRoot, 'OpenBrowser.app')]);
const suffix = process.platform === 'win32' ? '-setup.exe' : process.platform === 'darwin' ? '.dmg' : '.tar.gz';
const artifact = 'dist/' + stem + suffix;
const packagedUpdater = require(path.join(appRoot, 'automation', 'app-update.js'));
assert.equal(packagedUpdater.updateAssetName(), path.basename(artifact), 'packaged updater must request this platform installer');
const packagedTrust = require(path.join(appRoot, 'automation', 'update-trust.js'));
assert.deepEqual(packagedTrust.trustedPublicKeys(), require('../automation/update-trust').trustedPublicKeys());
const proof = require('../automation/selftests/data/update-trust-current-proof.json');
assert.equal(packagedTrust.verifyManifestSignature(Buffer.from(proof.manifest), Buffer.from(proof.signatureBase64, 'base64')).ok,
  true, 'packaged app must trust the current release signer');
assert.ok(fs.statSync(path.join(root, artifact)).size > 4096, 'installer must contain a real payload');
const outputIndex = process.argv.indexOf('--github-output');
if (outputIndex >= 0) fs.appendFileSync(process.argv[outputIndex + 1], `artifact=${artifact}\n`);
console.log(`Verified online installer ${artifact}: app/core ${sourceVersion}, no bundled kernel, matching updater asset and current signing key`);

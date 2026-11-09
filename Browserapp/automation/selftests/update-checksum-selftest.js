'use strict';

/**
 * Update-package integrity gate regression tests.
 *
 * The updater hands downloaded installers to the OS, so every release MUST be
 * verified against the release's SHA256SUMS.txt manifest before
 * shell.openPath(). The updater lives in automation/app-update.js; the two
 * pure verification helpers are required directly here (the module loads in
 * plain Node — Electron is resolved lazily), and the surrounding fail-closed
 * gates are pinned by source assertions over the module.
 *
 *   node automation/selftests/update-checksum-selftest.js
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

const appUpdate = require('../app-update');
const updateTrust = require('../update-trust');
const APPUPDATE_SRC = fs.readFileSync(path.join(__dirname, '..', 'app-update.js'), 'utf8');
const TRUST_PROOF = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'update-trust-proof.json'), 'utf8'));

async function main() {
  // --- parseChecksumManifest: real function, real input shapes ---
  const parseManifest = appUpdate.parseChecksumManifest;
  assert.strictEqual(typeof parseManifest, 'function', 'app-update exports parseChecksumManifest');
  const goodUpper = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789';
  const goodLower = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const manifestText = [
    `${goodUpper}  OpenBrowser-Windows-x86_64-with-kernel.exe`,
    `${goodLower} *OpenBrowser-macOS-arm64-with-kernel.dmg`,
    'not-a-hash junk.txt',
    `${goodLower.slice(0, 63)} OpenBrowser-Linux-x86_64-with-kernel.tar.gz`,
    '',
  ].join('\r\n');
  const map = parseManifest(manifestText);
  assert.strictEqual(map.size, 2, 'only well-formed 64-hex lines parse');
  assert.strictEqual(map.get('OpenBrowser-Windows-x86_64-with-kernel.exe'), goodUpper.toLowerCase(), 'hashes are lowercased');
  assert.strictEqual(map.get('OpenBrowser-macOS-arm64-with-kernel.dmg'), goodLower, 'sha256sum binary marker (*) is stripped');
  assert.strictEqual(parseManifest('').size, 0);
  assert.strictEqual(parseManifest(null).size, 0);
  assert.strictEqual(parseManifest('garbage').size, 0);
  console.log('  PASS  SHA256SUMS manifest parser (CRLF, binary marker, malformed lines)');

  // --- verifyFileSha256: streaming hash + timing-safe compare ---
  assert.ok(APPUPDATE_SRC.includes('timingSafeEqual'), 'comparison must be timing-safe');
  assert.ok(APPUPDATE_SRC.includes('createReadStream'), 'hash must stream the file');
  const verifyFileSha256 = appUpdate.verifyFileSha256;
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'openbrowser-update-'));
  try {
    const payload = Buffer.from('OpenBrowser update package fixture\n'.repeat(64));
    const target = path.join(tmp, 'installer.exe');
    await fsp.writeFile(target, payload);
    const good = crypto.createHash('sha256').update(payload).digest('hex');
    assert.strictEqual(await verifyFileSha256(target, good), true, 'correct digest verifies');
    assert.strictEqual(await verifyFileSha256(target, good.toUpperCase()), true, 'hex case-insensitive');
    assert.strictEqual(await verifyFileSha256(target, '0'.repeat(64)), false, 'wrong digest rejected');
    assert.strictEqual(await verifyFileSha256(target, 'deadbeef'), false, 'short digest rejected');
    assert.strictEqual(await verifyFileSha256(target, ''), false, 'empty digest rejected');
    assert.strictEqual(await verifyFileSha256(target, null), false, 'missing digest rejected');
    await assert.rejects(() => verifyFileSha256(path.join(tmp, 'missing.exe'), good), /ENOENT/, 'unreadable file fails closed');
    console.log('  PASS  streaming SHA-256 verify (timing-safe, malformed digests fail closed)');
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }

  // --- fail-closed gates pinned in the real download flow ---
  assert.ok(APPUPDATE_SRC.includes("const UPDATE_CHECKSUM_ASSET = 'SHA256SUMS.txt';"), 'release manifest asset is fixed');
  assert.ok(APPUPDATE_SRC.includes('Callers must treat a null map as\n * "cannot verify", never as "valid"'), 'manifest absence is never validity');
  assert.ok(APPUPDATE_SRC.includes('return null;'), 'unavailable manifest resolves to null');
  assert.ok(APPUPDATE_SRC.includes('manifestBuffer.length <= 65536'), 'manifest body is size-capped');
  assert.ok(APPUPDATE_SRC.includes('throw new Error(\'Update package failed SHA-256 integrity verification'), 'mismatch aborts before openPath');
  assert.ok(APPUPDATE_SRC.includes('verified: Boolean(expectedHex)'), 'result reports whether the digest was verified');
  assert.ok(APPUPDATE_SRC.includes('received < contentLength'), 'truncated transfer is detected');
  assert.ok(APPUPDATE_SRC.includes('Update download was truncated'), 'truncated transfer is rejected');
  assert.ok(APPUPDATE_SRC.includes('proceeding without integrity verification'), 'manifest-less release logs a loud warning when explicitly overridden');
  assert.ok(APPUPDATE_SRC.includes('OPENBROWSER_ALLOW_UNSIGNED_UPDATE'), 'manifest-less release requires an explicit env override');
  assert.ok(APPUPDATE_SRC.includes('refusing to run an unverifiable installer'), 'manifest-less release fails closed by default');
  assert.ok(APPUPDATE_SRC.includes('updateUrlIsAllowed(downloadUrl'), 'download URL passes the host allow-list');
  assert.ok(APPUPDATE_SRC.includes('new Set([\'github.com\', \'objects.githubusercontent.com\', \'release-assets.githubusercontent.com\'])'), 'update hosts are allow-listed');
  assert.ok(APPUPDATE_SRC.includes('Update package is too large'), 'download size ceiling enforced');
  assert.ok(APPUPDATE_SRC.includes('fsp.rm(temporaryPath, { force: true })'), 'failed downloads do not leave the installer on disk');
  console.log('  PASS  update flow integrity gates (fail-closed, truncation, allow-list, cleanup)');

  // --- Ed25519 trust root: published signatures are binding, no env downgrade ---
  assert.ok(APPUPDATE_SRC.includes('verifyManifestSignature(checksums.manifestBuffer, checksums.signature)'),
    'download gate verifies a published manifest signature');
  assert.ok(APPUPDATE_SRC.includes('manifest signature is not trusted'),
    'untrusted signature aborts before openPath');
  assert.ok(APPUPDATE_SRC.includes('signed: Boolean(checksums?.signature)'),
    'result reports whether the manifest was signed');
  assert.ok(APPUPDATE_SRC.includes('fetchReleaseSignature'),
    'release signature asset is fetched alongside the manifest');
  // The signature gate must sit BEFORE the OPENBROWSER_ALLOW_UNSIGNED_UPDATE
  // branch: an env var may relax the digest requirement, never the trust root.
  const sigGatePos = APPUPDATE_SRC.indexOf('manifest signature is not trusted');
  const unsignedBranchPos = APPUPDATE_SRC.indexOf('OPENBROWSER_ALLOW_UNSIGNED_UPDATE === \'1\'');
  assert.ok(sigGatePos > 0 && unsignedBranchPos > sigGatePos,
    'signature gate precedes the unsigned-release escape hatch');

  // Behavioral: update-trust module primitives against the deployed root.
  {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const pubBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    const manifest = Buffer.from(`${goodLower}  OpenBrowser-Windows-x86_64.exe\n`, 'utf8');
    const goodSig = crypto.sign(null, manifest, privateKey);
    const tampered = Buffer.from(manifest.toString('utf8').replace('x86_64', 'arm64'), 'utf8');

    // Deployed trust root: at least one real, parseable key — never a placeholder.
    const keys = updateTrust.trustedPublicKeys();
    assert.ok(keys.length >= 1, 'a real trust-root key is embedded');
    assert.ok(keys.every((k) => !k.includes('PLACEHOLDER')), 'no placeholder keys are trusted');
    assert.ok(keys.every((k) => updateTrust.parsePemOrBase64(k) !== null), 'every embedded key parses');

    // A signature from a key that is NOT embedded is rejected through the
    // shipped verification path (honest mismatch, never a false pass).
    const rejection = updateTrust.verifyManifestSignature(manifest, goodSig);
    assert.strictEqual(rejection.ok, false, 'non-embedded signing key never verifies');
    assert.strictEqual(rejection.reason, 'signature-mismatch', 'rejection names the cause');

    // Deployment proof: the committed signature can only have been produced
    // with the private half of the embedded trust root — the app and the
    // offline signer provably share the same key pair.
    const proofOk = updateTrust.verifyManifestSignature(
      Buffer.from(TRUST_PROOF.manifest, 'utf8'),
      Buffer.from(TRUST_PROOF.signatureBase64, 'base64'),
    );
    assert.ok(proofOk.ok, `trust-root deployment proof verifies (${proofOk.reason})`);
    const proofTampered = updateTrust.verifyManifestSignature(
      Buffer.from(TRUST_PROOF.manifest + 'x', 'utf8'),
      Buffer.from(TRUST_PROOF.signatureBase64, 'base64'),
    );
    assert.strictEqual(proofTampered.ok, false, 'proof signature does not verify over tampered bytes');

    // Malformed inputs are rejected, not thrown.
    assert.strictEqual(updateTrust.verifyManifestSignature(null, goodSig).ok, false);
    assert.strictEqual(updateTrust.verifyManifestSignature(manifest, null).ok, false);
    assert.strictEqual(updateTrust.verifyManifestSignature(Buffer.alloc(0), goodSig).ok, false);

    // parsePemOrBase64 rejects garbage instead of returning a key.
    assert.strictEqual(updateTrust.parsePemOrBase64('not a key'), null);
    assert.strictEqual(updateTrust.parsePemOrBase64(''), null);
    // Well-formed base64 SPKI parses to a usable key object.
    const parsedKey = updateTrust.parsePemOrBase64(pubBase64);
    assert.ok(parsedKey && crypto.verify(null, manifest, parsedKey, goodSig),
      'parsed base64 SPKI key verifies the signature');
    assert.strictEqual(crypto.verify(null, tampered, parsedKey, goodSig), false,
      'tampered manifest fails signature verification');
  }
  console.log('  PASS  Ed25519 trust root (deployed key, binding signature, deployment proof)');

  // --- upToDate must fail closed when versions cannot be compared ---
  // compareVersions() returns 0 when either side is unparseable, which used
  // to make "unknown" claim up-to-date. checkAppUpdate now gates on
  // isComparable() and reports updateStatus: 'unknown' instead.
  assert.ok(APPUPDATE_SRC.includes('isComparable(remoteVersion, currentVersion)'),
    'checkAppUpdate gates the comparison on isComparable');
  assert.ok(APPUPDATE_SRC.includes("updateStatus = comparable ? (upToDate ? 'latest' : 'available') : 'unknown'"),
    'checkAppUpdate reports unknown when versions are not comparable');
  const lightFor = appUpdate.appUpdateLightFromResult;
  assert.strictEqual(typeof lightFor, 'function', 'app-update exports appUpdateLightFromResult');
  assert.strictEqual(lightFor(null), 'unknown');
  assert.strictEqual(lightFor({ remoteVersion: '1.2.3', currentVersion: '1.2.3', upToDate: true }), 'green');
  assert.strictEqual(lightFor({ remoteVersion: '1.3.0', currentVersion: '1.2.3', upToDate: false }), 'red');
  assert.strictEqual(lightFor({ remoteVersion: 'release-2026', currentVersion: '1.2.3', upToDate: false, updateStatus: 'unknown' }),
    'unknown', 'an unparseable pair never paints green nor offers a red download');
  assert.strictEqual(lightFor({ remoteVersion: 'release-2026', currentVersion: '1.2.3', upToDate: true, updateStatus: 'unknown' }),
    'unknown', 'unknown overrides a stale upToDate=true');
  console.log('  PASS  version traffic light fails closed on unparseable versions');

  console.log('UPDATE_CHECKSUM_SELFTEST OK');
}

main().catch((error) => {
  console.error('UPDATE_CHECKSUM_SELFTEST FAILED');
  console.error(error);
  process.exitCode = 1;
});

'use strict';

/**
 * Update-package integrity gate regression tests.
 *
 * The updater hands downloaded installers to the OS, so every release MUST be
 * verified against the release's SHA256SUMS.txt manifest before
 * shell.openPath(). main.js cannot be required outside Electron, so the two
 * pure verification helpers are extracted from its real source and evaluated
 * here, and the surrounding fail-closed gates are pinned by source assertions.
 *
 *   node automation/selftests/update-checksum-selftest.js
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

const MAIN_SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'main.js'), 'utf8');

/** Extract a top-level function's text from source by brace counting. */
function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `main.js must define ${name}`);
  // include a preceding `async ` modifier so extracted bodies keep their await
  const declStart = src.slice(Math.max(0, start - 6), start).trim() === 'async' ? start - 6 : start;
  const openBrace = src.indexOf('{', start);
  assert.ok(openBrace > start, `${name} has a body`);
  let depth = 0;
  for (let i = openBrace; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(declStart, i + 1);
    }
  }
  return assert.fail(`unbalanced braces while extracting ${name}`);
}

async function main() {
  // --- parseChecksumManifest: real function, real input shapes ---
  const parseManifest = new Function(`return (${extractFunction(MAIN_SRC, 'parseChecksumManifest')});`)();
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
  const fnText = extractFunction(MAIN_SRC, 'verifyFileSha256');
  assert.ok(fnText.includes('timingSafeEqual'), 'comparison must be timing-safe');
  assert.ok(fnText.includes('createReadStream'), 'hash must stream the file');
  const verifyFileSha256 = new Function('createHash', 'fs', 'timingSafeEqual', `return (${fnText});`)(
    crypto.createHash, fs, crypto.timingSafeEqual
  );
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
  assert.ok(MAIN_SRC.includes("const UPDATE_CHECKSUM_ASSET = 'SHA256SUMS.txt';"), 'release manifest asset is fixed');
  assert.ok(MAIN_SRC.includes('callers must treat null as "cannot verify", never as "valid"'), 'manifest absence is never validity');
  assert.ok(MAIN_SRC.includes("return null;"), 'unavailable manifest resolves to null');
  assert.ok(MAIN_SRC.includes('text.length <= 65536'), 'manifest body is size-capped');
  assert.ok(MAIN_SRC.includes('throw new Error(\'Update package failed SHA-256 integrity verification'), 'mismatch aborts before openPath');
  assert.ok(MAIN_SRC.includes('verified: Boolean(expectedHex)'), 'result reports whether the digest was verified');
  assert.ok(MAIN_SRC.includes('received < contentLength'), 'truncated transfer is detected');
  assert.ok(MAIN_SRC.includes('Update download was truncated'), 'truncated transfer is rejected');
  assert.ok(MAIN_SRC.includes('proceeding without integrity verification'), 'manifest-less release logs a loud warning');
  assert.ok(MAIN_SRC.includes('updateUrlIsAllowed(downloadUrl'), 'download URL passes the host allow-list');
  assert.ok(MAIN_SRC.includes('new Set([\'github.com\', \'objects.githubusercontent.com\', \'release-assets.githubusercontent.com\'])'), 'update hosts are allow-listed');
  assert.ok(MAIN_SRC.includes('Update package is too large'), 'download size ceiling enforced');
  assert.ok(MAIN_SRC.includes('fsp.rm(temporaryPath, { force: true })'), 'failed downloads do not leave the installer on disk');
  console.log('  PASS  update flow integrity gates (fail-closed, truncation, allow-list, cleanup)');

  console.log('UPDATE_CHECKSUM_SELFTEST OK');
}

main().catch((error) => {
  console.error('UPDATE_CHECKSUM_SELFTEST FAILED');
  console.error(error);
  process.exitCode = 1;
});

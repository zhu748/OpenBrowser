#!/usr/bin/env node
'use strict';

/**
 * Release-signing tool for the Ed25519 updater trust root (CI or local signer).
 *
 *   node update-trust-tool.js genkey
 *       Generate an Ed25519 keypair. The private key is written ONLY if
 *       OPENBROWSER_UPDATE_SIGNING_KEY is unset; never commit it.
 *
 *   node update-trust-tool.js sign SHA256SUMS.txt
 *       Write SHA256SUMS.txt.sig (detached Ed25519 over the exact file bytes).
 *       Reads the private key from OPENBROWSER_UPDATE_SIGNING_KEY (PEM or
 *       base64 raw seed accepted) or --key <file>.
 *
 *   node update-trust-tool.js verify SHA256SUMS.txt [SHA256SUMS.txt.sig]
 *       Check a manifest signature against the keys embedded in update-trust.js.
 *
 *   node update-trust-tool.js selftest
 *       Round-trip: sign a sample manifest with an ephemeral keypair and
 *       check the shipped verification path rejects it, plus deployment
 *       sanity of the embedded trust root.
 */

const crypto = require('crypto');
const fs = require('fs');

const { trustedPublicKeys, verifyManifestSignature, parsePemOrBase64 } = require('./update-trust');

function loadPrivateKey(source) {
  const raw = String(source || '').trim();
  if (!raw) return null;
  if (raw.startsWith('-----BEGIN')) return raw;
  try {
    return crypto.createPrivateKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'pkcs8' });
  } catch (_) {
    try {
      // Raw 32-byte Ed25519 seed: wrap it in an RFC 8410 PKCS8 DER prefix.
      // (format:'jwk' requires a JWK object, so passing a Buffer always threw
      // here and the documented raw-seed path never worked.)
      const seed = Buffer.from(raw, 'base64');
      if (seed.length !== 32) return null;
      const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
      return crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
    } catch (_) {
      return null;
    }
  }
}

function cmdGenkey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pubBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
  const privPem = privateKey.export({ format: 'pem', type: 'pkcs8' });
  console.log('Public key (base64 SPKI — paste into update-trust.js TRUSTED_KEYS):');
  console.log(pubBase64);
  const envHasKey = Boolean(process.env.OPENBROWSER_UPDATE_SIGNING_KEY);
  if (envHasKey) {
    console.log('\nOPENBROWSER_UPDATE_SIGNING_KEY is set; private key not printed.');
  } else {
    console.log('\nPrivate key (PKCS8 PEM — store in your signer secret storage, never commit):');
    console.log(privPem);
  }
}

function cmdSign(manifestPath, keyFile) {
  const manifest = fs.readFileSync(manifestPath);
  const keySrc = keyFile ? fs.readFileSync(keyFile, 'utf8') : process.env.OPENBROWSER_UPDATE_SIGNING_KEY;
  const key = loadPrivateKey(keySrc);
  if (!key) {
    console.error('No usable private key: set OPENBROWSER_UPDATE_SIGNING_KEY or pass --key <file>');
    process.exit(1);
  }
  const sig = crypto.sign(null, manifest, key);
  const outPath = manifestPath + '.sig';
  fs.writeFileSync(outPath, sig);
  console.log(`wrote ${outPath} (${sig.length} bytes) over ${manifest.length} manifest bytes`);
}

function cmdVerify(manifestPath, sigPath) {
  const manifest = fs.readFileSync(manifestPath);
  const sig = fs.readFileSync(sigPath || manifestPath + '.sig');
  const verdict = verifyManifestSignature(manifest, sig);
  console.log(JSON.stringify(verdict));
  process.exit(verdict.ok ? 0 : 1);
}

function cmdSelftest() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pubBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
  const manifest = Buffer.from(
    'a'.repeat(64) + '  OpenBrowser-1.2.3-win-x64.exe\n'
    + 'b'.repeat(64) + '  OpenBrowser-1.2.3-mac-arm64.dmg\n',
    'utf8',
  );
  const goodSig = crypto.sign(null, manifest, privateKey);
  const tampered = Buffer.from(manifest.toString('utf8').replace('1.2.3', '9.9.9'), 'utf8');

  // Inject the ephemeral key through the module's own injection seam by
  // re-verifying with an explicit key: the updater path (verifyManifestSignature)
  // only consumes embedded keys, so we exercise the primitive here.
  const keyObj = parsePemOrBase64(pubBase64);
  const okGood = crypto.verify(null, manifest, keyObj, goodSig);
  const okTampered = crypto.verify(null, tampered, keyObj, goodSig);
  const okWrongKey = crypto.verify(null, manifest, crypto.generateKeyPairSync('ed25519').publicKey, goodSig);

  // And the shipped module must exercise the real trust root: the deployed
  // key rejects a signature made with any other key (honest mismatch, not a
  // false pass), and at least one parseable key is actually embedded.
  const rejection = verifyManifestSignature(manifest, goodSig);
  const embeddedKeys = trustedPublicKeys();

  const checks = [
    ['valid signature verifies', okGood === true],
    ['tampered manifest rejected', okTampered === false],
    ['wrong public key rejected', okWrongKey === false],
    ['non-embedded signing key rejected by shipped path',
      rejection.ok === false && rejection.reason === 'signature-mismatch'],
    ['trust root is deployed (real key embedded)',
      embeddedKeys.length >= 1 && embeddedKeys.every((k) => parsePemOrBase64(k) !== null && !k.includes('PLACEHOLDER'))],
  ];
  let failed = 0;
  for (const [name, pass] of checks) {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
    if (!pass) failed += 1;
  }
  process.exit(failed ? 1 : 0);
}

const [,, command, ...rest] = process.argv;
const keyFileIdx = rest.indexOf('--key');
const keyFile = keyFileIdx >= 0 ? rest[keyFileIdx + 1] : null;
// Drop the --key pair only when it is actually present: with keyFileIdx -1 the
// old filter also dropped index 0, silently discarding the manifest path.
const positional = keyFileIdx >= 0
  ? rest.filter((_, i) => i !== keyFileIdx && i !== keyFileIdx + 1)
  : rest;

switch (command) {
  case 'genkey': cmdGenkey(); break;
  case 'sign': cmdSign(positional[0], keyFile); break;
  case 'verify': cmdVerify(positional[0], positional[1]); break;
  case 'selftest': cmdSelftest(); break;
  default:
    console.log('usage: node update-trust-tool.js <genkey|sign|verify|selftest> [manifest] [--key file]');
    process.exit(command ? 1 : 0);
}

'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { encryptPayloadAsync, decryptPayloadAsync, decryptPayload } = require('../cloud/package-crypto');
const { buildBackupPackage, parseBackupPackage } = require('../cloud-sync');

async function main() {
  const plain = Buffer.from('cloud format interoperability');
  let ticks = 0;
  const timer = setInterval(() => { ticks += 1; }, 5);
  let encrypted;
  try {
    const results = await Promise.all([encryptPayloadAsync(plain, 'cold-async-key'), encryptPayloadAsync(plain, 'cold-async-key')]);
    encrypted = results[0].data;
    assert.notDeepEqual(results[0].data, results[1].data, 'concurrent encryption retains IV uniqueness');
    assert.ok(ticks > 0, 'uncached KDF yields the event loop');
  } finally { clearInterval(timer); }
  assert.deepEqual(await decryptPayloadAsync(encrypted, 'cold-async-key'), plain);
  assert.deepEqual(decryptPayload(encrypted, 'cold-async-key'), plain, 'synchronous public API remains compatible');
  await assert.rejects(decryptPayloadAsync(encrypted, 'wrong-key'));
  const tampered = Buffer.from(encrypted);
  tampered[tampered.length - 1] ^= 1;
  await assert.rejects(decryptPayloadAsync(tampered, 'cold-async-key'));
  await assert.rejects(decryptPayloadAsync(Buffer.from('OBE1bad'), 'key'), /不完整/);
  assert.deepEqual(await decryptPayloadAsync(plain), plain);

  // Independent legacy fixture: legacy-cost OBE1 + compressed backup JSON.
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync('legacy-key', salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = { version: 1, profiles: [{ id: 'legacy-env' }] };
  const enc = Buffer.concat([cipher.update(zlib.gzipSync(JSON.stringify(body))), cipher.final()]);
  const legacy = Buffer.concat([Buffer.from('OBE1'), salt, iv, cipher.getAuthTag(), enc]);
  assert.deepEqual(await parseBackupPackage(legacy, 'legacy-key'), body);
  const pack = await buildBackupPackage({ profiles: [{ id: 'new-env', cookies: 'private' }], profileIds: ['new-env'], passphrase: 'package-key' });
  assert.equal(pack.meta.encrypted, true);
  assert.equal((await parseBackupPackage(pack.buffer, 'package-key')).profiles[0].cookies, 'private');
  console.log('CLOUD_CRYPTO_SELFTEST OK (async responsiveness, IVs, authentication, legacy and new packages)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

'use strict';

/**
 * Synthetic .crx builders shared by the reader's self-test and the host wiring
 * test. Everything is produced byte-by-byte here, so no fixture files and no
 * network access are involved.
 */

const crypto = require('crypto');

// ---------- builders ----------

const {crc32,buildZip}=require('./zip-writer');

function writeVarint(value) {
  const out = [];
  let v = value;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
  return Buffer.from(out);
}

function pbLengthDelimited(field, payload) {
  return Buffer.concat([writeVarint((field << 3) | 2), writeVarint(payload.length), payload]);
}

function pbMessage(field, obj) {
  return pbLengthDelimited(field, obj);
}

function buildCrx2(publicKey, signature, zipBuffer) {
  const header = Buffer.alloc(16);
  header.write('Cr24', 0, 'utf8');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(publicKey.length, 8);
  header.writeUInt32LE(signature.length, 12);
  return Buffer.concat([header, publicKey, signature, zipBuffer]);
}

function buildCrx3(publicKey, signature, zipBuffer, crxIdBytes, useEcdsa = false) {
  const proof = Buffer.concat([
    pbLengthDelimited(1, publicKey),
    pbLengthDelimited(2, signature),
  ]);
  const signedData = pbLengthDelimited(1, crxIdBytes);
  const header = Buffer.concat([
    pbMessage(useEcdsa ? 3 : 2, proof),
    pbMessage(10000, signedData),
  ]);
  const out = Buffer.alloc(12);
  out.write('Cr24', 0, 'utf8');
  out.writeUInt32LE(3, 4);
  out.writeUInt32LE(header.length, 8);
  return Buffer.concat([out, header, zipBuffer]);
}

/** Independent re-implementation of the id rule, used to cross-check. */
function expectedExtensionId(publicKey) {
  const digest = crypto.createHash('sha256').update(publicKey).digest();
  let id = '';
  for (let i = 0; i < 16; i += 1) {
    id += String.fromCharCode(97 + (digest[i] >> 4));
    id += String.fromCharCode(97 + (digest[i] & 0x0f));
  }
  return id;
}

module.exports = {
  crc32,
  buildZip,
  writeVarint,
  pbLengthDelimited,
  pbMessage,
  buildCrx2,
  buildCrx3,
  expectedExtensionId,
};

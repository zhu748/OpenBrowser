'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { addChromeStoreExtension } = require('./store-extension');

// Build the fixture zip with Node itself: tar.exe is Windows-only and GNU tar
// cannot write zips, so the pack step must not depend on either.

function dosDateTime(date) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff;
  const day = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { time, day };
}

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const chunks = [];
  const central = [];
  const { time, day } = dosDateTime(new Date());
  let offset = 0;
  for (const [name, raw] of Object.entries(files)) {
    const data = zlib.deflateRawSync(raw);
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, data);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt16LE(time, 12);
    dir.writeUInt16LE(day, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(raw.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    dir.writeUInt16LE(0, 30);
    dir.writeUInt16LE(0, 32);
    dir.writeUInt16LE(0, 34);
    dir.writeUInt16LE(0, 36);
    dir.writeUInt32LE(0, 38);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, nameBuf);
    offset += local.length + nameBuf.length + data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

function varint(n) {
  const out = [];
  while (n > 0x7f) { out.push((n & 0x7f) | 0x80); n >>>= 7; }
  out.push(n);
  return Buffer.from(out);
}

function field(n, value) {
  return Buffer.concat([varint((n << 3) | 2), varint(value.length), value]);
}

// A CRX proof key cannot be engineered to a chosen id (SHA-256 preimage), so
// derive the store id FROM a generated key, exactly like real store packs:
// signed_header (field 10000) wraps the 16-byte crx id (field 1); a proof key
// entry (field 2 -> SignedData field 1) carries the key whose a-p id matches.
function crx3(zip, proofKey, storeId) {
  const idBytes = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    idBytes[i] = ((storeId.charCodeAt(i << 1) - 97) << 4) | (storeId.charCodeAt((i << 1) + 1) - 97);
  }
  const signedHeader = field(1, idBytes);
  const proofSignedData = field(1, proofKey);
  const header = Buffer.concat([field(10000, signedHeader), field(2, proofSignedData)]);
  const out = Buffer.alloc(12 + header.length + zip.length);
  out.write('Cr24', 0, 'ascii');
  out.writeUInt32LE(3, 4);
  out.writeUInt32LE(header.length, 8);
  header.copy(out, 12);
  zip.copy(out, 12 + header.length);
  return out;
}

async function main() {
  const root = path.join(__dirname, '..', 'store-offline-selftest-data');
  await fs.rm(root, { recursive: true, force: true });
  try {
    const manifest = JSON.stringify({ manifest_version: 3, name: 'Store Fixture', version: '1.2.3' });
    const worker = 'console.log("fixture")';
    const zip = zipStore({
      'manifest.json': Buffer.from(manifest, 'utf8'),
      'worker.js': Buffer.from(worker, 'utf8'),
    });
    const proofKey = crypto.randomBytes(294);
    let keyId = '';
    for (const byte of crypto.createHash('sha256').update(proofKey).digest().subarray(0, 16)) {
      keyId += String.fromCharCode(97 + (byte >>> 4), 97 + (byte & 15));
    }
    const crx = crx3(zip, proofKey, keyId);
    const result = await addChromeStoreExtension(
      `https://chromewebstore.google.com/detail/fixture/${keyId}`,
      path.join(root, 'user-data'),
      async (directory) => {
        const parsed = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
        return { id: 'temp', name: parsed.name, version: parsed.version, path: directory, manifestVersion: parsed.manifest_version };
      },
      async () => crx
    );
    process.stdout.write(JSON.stringify({ success: true, id: result.storeId, name: result.name, version: result.version, source: result.source }, null, 2));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { process.stderr.write(error.stack || error.message); process.exitCode = 1; });

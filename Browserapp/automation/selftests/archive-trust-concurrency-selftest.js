'use strict';

const assert = require('node:assert/strict');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pinArchiveSha256, pinnedArchiveSha256, writeFileAtomic } = require('../kernel/archive-trust');

async function main() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-pin-concurrency-'));
  try {
    const entries = Array.from({ length: 16 }, (_, index) => ({ url: `https://public.example/${index}.zip`, hash: index.toString(16).padStart(64, '0') }));
    const writes = entries.map(({ url, hash }) => pinArchiveSha256(root, url, hash));
    assert.equal(await pinnedArchiveSha256(root, entries.at(-1).url), entries.at(-1).hash, 'reads wait for already queued pins');
    assert.equal((await Promise.all(writes)).every(Boolean), true);
    for (const { url, hash } of entries) assert.equal(await pinnedArchiveSha256(root, url), hash, 'parallel pins cannot overwrite sibling entries');
    assert.equal((await fsp.readdir(root)).some((name) => name.includes('.tmp-')), false);

    const open = fsp.open; let closed = 0;
    try {
      fsp.open = async (target, flags, ...rest) => target === root && flags === 'r'
        ? { sync: async () => { throw new Error('directory fsync unsupported'); }, close: async () => { closed += 1; } }
        : open.call(fsp, target, flags, ...rest);
      await writeFileAtomic(path.join(root, 'bookkeeping.json'), '{}');
      assert.equal(closed, 1, 'directory handles close even when fsync fails');
      assert.equal(await fsp.readFile(path.join(root, 'bookkeeping.json'), 'utf8'), '{}');
    } finally { fsp.open = open; }
    console.log('ARCHIVE_TRUST_CONCURRENCY_SELFTEST OK (parallel pins, ordered reads, temp cleanup, directory handles)');
  } finally { await fsp.rm(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

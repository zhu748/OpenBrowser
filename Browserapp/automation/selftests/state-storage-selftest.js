'use strict';

/** Self-test for atomic state writes and transient filesystem retries. */

const assert = require('assert');
const fsp = require('fs/promises');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  writeJsonAtomically,
  writeRawAtomically,
  readEngineStateCandidate,
} = require('../../engine/state-storage');

const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, err: error.message || String(error) }); }
}

async function withPatchedOpen(failures, fn) {
  const original = fsp.open;
  let remaining = failures;
  fsp.open = async (...args) => {
    const target = String(args[0] || '');
    if (remaining > 0 && target.includes('.tmp-')) {
      remaining -= 1;
      const error = new Error('simulated transient open failure');
      error.code = 'ENOENT';
      throw error;
    }
    return original.apply(fsp, args);
  };
  try { return await fn(); } finally { fsp.open = original; }
}

async function withPatchedRename(failures, fn) {
  const original = fsp.rename;
  let remaining = failures;
  fsp.rename = async (...args) => {
    if (remaining > 0) {
      remaining -= 1;
      const error = new Error('simulated transient rename failure');
      error.code = 'EINVAL';
      throw error;
    }
    return original.apply(fsp, args);
  };
  try { return await fn(); } finally { fsp.rename = original; }
}

(async () => {
  await check('legacy engine-state migration encrypts the recovery backup', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-backup-'));
    const file = path.join(root, 'state.json');
    const crypto = require('../../credential-crypto');
    try {
      await fsp.writeFile(file, JSON.stringify({ password: 'legacy-test-secret', version: 1 }));
      await writeJsonAtomically(file, { version: 2 });
      const backup = await fsp.readFile(file + '.bak');
      assert.ok(crypto.isEncrypted(backup), 'backup cannot retain plaintext credentials');
      assert.ok(!backup.includes(Buffer.from('legacy-test-secret')));
      assert.equal((await readEngineStateCandidate(file + '.bak')).saved.password, 'legacy-test-secret');
    } finally { await fsp.rm(root, { recursive: true, force: true }); }
  });

  await check('directory handles close even when directory fsync is unsupported', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const original = fsp.open;
    let closed = 0;
    fsp.open = async (...args) => {
      if (args[0] === root && args[1] === 'r') return {
        sync: async () => { throw Object.assign(new Error('directory fsync unsupported'), { code: 'EINVAL' }); },
        close: async () => { closed += 1; },
      };
      return original.apply(fsp, args);
    };
    try {
      const file = path.join(root, 'state.json');
      await writeRawAtomically(file, 'durable');
      assert.strictEqual(await fsp.readFile(file, 'utf8'), 'durable');
      assert.strictEqual(closed, 1, 'failed fsync must not leak its directory descriptor');
    } finally { fsp.open = original; await fsp.rm(root, { recursive: true, force: true }); }
  });

  await check('writeRawAtomically retries a transient open error', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      await withPatchedOpen(1, () => writeRawAtomically(file, '{"ok":true}', 0o600));
      assert.strictEqual(await fsp.readFile(file, 'utf8'), '{"ok":true}');
      const leftovers = (await fsp.readdir(root)).filter((name) => name.startsWith('state.json.tmp-'));
      assert.deepStrictEqual(leftovers, []);
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  await check('writeRawAtomically retries a transient rename error', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      await withPatchedRename(1, () => writeRawAtomically(file, '{"renamed":true}', 0o600));
      assert.strictEqual(await fsp.readFile(file, 'utf8'), '{"renamed":true}');
      const leftovers = (await fsp.readdir(root)).filter((name) => name.startsWith('state.json.tmp-'));
      assert.deepStrictEqual(leftovers, []);
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  await check('writeRawAtomically gives up after four transient failures', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      await assert.rejects(() => withPatchedOpen(4, () => writeRawAtomically(file, 'x', 0o600)), /transient open failure/);
      assert.strictEqual(fs.existsSync(file), false);
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  await check('writeJsonAtomically encrypts at rest, backs up raw previous bytes and round-trips', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      // .bak refresh is throttled (BAK_REFRESH_INTERVAL_MS = 5min) and only a
      // real .bak write records the timestamp. This case pins that contract:
      // 1st write has no previous file → no .bak; the immediate 2nd write
      // produces one from the 1st write's raw bytes; a 3rd write inside the
      // window must NOT refresh it again.
      await writeJsonAtomically(file, '{"version":1}');
      assert.strictEqual(fs.existsSync(file + '.bak'), false, 'no .bak while no previous file exists');
      await writeJsonAtomically(file, '{"version":2}');
      const atRest = await fsp.readFile(file, 'utf8');
      assert.ok(atRest.startsWith('OBE1') || atRest.startsWith('OBS1'), 'state file must carry an encryption header');
      assert.ok(!atRest.includes('"version"'), 'plaintext must not be readable at rest');
      assert.strictEqual((await readEngineStateCandidate(file)).saved.version, 2);
      const bak = await fsp.readFile(file + '.bak');
      assert.ok(bak.length > 0, '.bak must preserve previous raw bytes');
      assert.strictEqual((await readEngineStateCandidate(file + '.bak')).saved.version, 1);
      await writeJsonAtomically(file, '{"version":3}');
      assert.strictEqual((await readEngineStateCandidate(file)).saved.version, 3);
      assert.strictEqual(
        (await readEngineStateCandidate(file + '.bak')).saved.version, 1,
        '.bak refresh must be throttled within the interval (still the first write\'s bytes)',
      );
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  const failed = results.filter((item) => !item.ok);
  for (const item of results) {
    if (item.ok) console.log('  PASS  ' + item.name);
    else console.error('  FAIL  ' + item.name + ': ' + item.err);
  }
  if (failed.length) {
    console.error(`state-storage-selftest: FAIL ${results.length - failed.length}/${results.length}`);
    process.exitCode = 1;
  } else {
    console.log(`state-storage-selftest: OK ${results.length}/${results.length}`);
  }
})();

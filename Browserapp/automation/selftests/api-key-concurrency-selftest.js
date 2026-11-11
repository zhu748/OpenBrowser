'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ApiKeyStore } = require('../api-key-store');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-api-key-concurrency-'));
  const failures = [];
  async function check(name, run) {
    try { await run(); console.log('ok  ' + name); }
    catch (error) { failures.push(error); console.error('FAIL ' + name + ': ' + error.message); }
  }
  const fixture = async (name) => {
    const store = new ApiKeyStore(path.join(root, name), { encrypted: false });
    await store.resolve();
    return store;
  };
  try {
    await check('concurrent rotations each return their committed key in request order', async () => {
      const store = await fixture('rotate');
      const keys = await Promise.all(Array.from({ length: 6 }, () => store.rotate()));
      assert.equal(new Set(keys).size, keys.length, 'each rotation must have its own key');
      assert.equal(store.apiKey, keys.at(-1));
      assert.equal(JSON.parse(await fs.readFile(store.filePath, 'utf8')).apiKey, keys.at(-1));
      assert.equal((await fs.readFile(store.txtPath, 'utf8')).trim(), keys.at(-1));
    });
    await check('a failed rotation cannot roll back a later successful rotation', async () => {
      const store = await fixture('rollback');
      const rename = fs.rename;
      let failOnce = true;
      fs.rename = async (...args) => {
        if (args[1] === store.filePath && failOnce) { failOnce = false; throw new Error('first rotation failed'); }
        return rename(...args);
      };
      try {
        const results = await Promise.allSettled([store.rotate(), store.rotate()]);
        assert.equal(results[0].status, 'rejected');
        assert.equal(results[1].status, 'fulfilled');
        const saved = JSON.parse(await fs.readFile(store.filePath, 'utf8')).apiKey;
        assert.equal(store.apiKey, saved, 'in-memory and persisted keys must agree');
        assert.equal(results[1].value, saved);
        assert.deepEqual((await fs.readdir(store.userDataPath)).filter((name) => name.includes('.tmp-')), []);
      } finally { fs.rename = rename; }
    });
    await check('an explicit key arriving during a stored read stays active without changing disk', async () => {
      const seeded = await fixture('explicit');
      const originalBytes = await fs.readFile(seeded.filePath, 'utf8');
      const store = new ApiKeyStore(seeded.userDataPath, { encrypted: false });
      const read = fs.readFile;
      let release, entered;
      const gate = new Promise((resolve) => { release = resolve; });
      const started = new Promise((resolve) => { entered = resolve; });
      fs.readFile = async (...args) => {
        const raw = await read(...args);
        if (args[0] === store.filePath) { entered(); await gate; }
        return raw;
      };
      try {
        const stored = store.resolve();
        await started;
        const explicit = store.resolve('explicit_session_key_for_concurrency_test');
        release();
        await stored;
        assert.equal(await explicit, 'explicit_session_key_for_concurrency_test');
        assert.equal(store.apiKey, 'explicit_session_key_for_concurrency_test');
        assert.equal(await fs.readFile(store.filePath, 'utf8'), originalBytes);
      } finally { release(); fs.readFile = read; }
    });
    await check('overlapping stored resolutions still share one read', async () => {
      const seeded = await fixture('shared');
      const store = new ApiKeyStore(seeded.userDataPath, { encrypted: false });
      const read = fs.readFile;
      let reads = 0;
      fs.readFile = async (...args) => { if (args[0] === store.filePath) reads += 1; return read(...args); };
      try {
        const keys = await Promise.all(Array.from({ length: 20 }, () => store.resolve()));
        assert.equal(new Set(keys).size, 1);
        assert.equal(reads, 1);
      } finally { fs.readFile = read; }
    });
  } finally { await fs.rm(root, { recursive: true, force: true }); }
  assert.equal(failures.length, 0, `${failures.length} API key concurrency checks failed`);
  console.log('API_KEY_CONCURRENCY_SELFTEST OK');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

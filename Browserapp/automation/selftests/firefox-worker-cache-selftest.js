'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { prepareFirefoxWorkerCache } = require('../firefox-worker-cache');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-firefox-cache-'));
  const registry = path.join(root, 'serviceworker.txt');
  const marker = path.join(root, 'openbrowser-worker-cache.json');
  try {
    await fs.mkdir(path.join(root, 'storage/default/site/cache'), { recursive: true });
    await fs.writeFile(path.join(root, 'cookies.sqlite'), 'cookies');
    await fs.writeFile(path.join(root, 'storage/default/site/cache/retained'), 'cache data');
    await fs.writeFile(registry, 'legacy worker registrations');
    assert.deepEqual(await prepareFirefoxWorkerCache(root, 'source A'), { reset: true });
    await assert.rejects(fs.stat(registry), { code: 'ENOENT' });
    await fs.writeFile(registry, 'current worker registrations');
    assert.deepEqual(await prepareFirefoxWorkerCache(root, 'source A'), { reset: false });
    assert.equal(await fs.readFile(registry, 'utf8'), 'current worker registrations');
    assert.deepEqual(await prepareFirefoxWorkerCache(root, 'source A', { localDelivery: true }), { reset: true });
    await assert.rejects(fs.stat(registry), { code: 'ENOENT' });
    await fs.writeFile(registry, 'registrations from the local filter and forwarder');
    assert.deepEqual(await prepareFirefoxWorkerCache(root, 'source A', { localDelivery: true }), { reset: false });
    assert.deepEqual(await prepareFirefoxWorkerCache(root, 'source B'), { reset: true });
    await assert.rejects(fs.stat(registry), { code: 'ENOENT' });
    assert.equal(await fs.readFile(path.join(root, 'cookies.sqlite'), 'utf8'), 'cookies');
    assert.equal(await fs.readFile(path.join(root, 'storage/default/site/cache/retained'), 'utf8'), 'cache data');
    await fs.writeFile(marker, '{broken');
    await fs.writeFile(registry, 'unverifiable cached programs');
    assert.deepEqual(await prepareFirefoxWorkerCache(root, 'source B'), { reset: true });
    const previous = await fs.readFile(marker, 'utf8');
    await fs.mkdir(registry);
    await assert.rejects(prepareFirefoxWorkerCache(root, 'source C'), /directory|EISDIR|EPERM/);
    assert.equal(await fs.readFile(marker, 'utf8'), previous, 'failed invalidation must not mark old programs current');
    await assert.rejects(prepareFirefoxWorkerCache(root, ''), /required/);
    console.log('FIREFOX_WORKER_CACHE_SELFTEST OK (legacy upgrade, unchanged source, identity/runtime changes, data retention and fail closed)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error);process.exitCode = 1; });

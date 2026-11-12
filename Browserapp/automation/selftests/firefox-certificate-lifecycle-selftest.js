'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawnSync } = require('node:child_process');
const { WorkerCertificates, createCA } = require('../firefox-worker-certificates');

async function main() {
  if (spawnSync('openssl', ['version'], { timeout: 5000 }).status !== 0) {
    console.log('SKIP certificate lifecycle gate requires OpenSSL'); process.exitCode = 2; return;
  }
  const ca = await createCA();
  assert.throws(() => new WorkerCertificates(ca, { cacheLimit: -1 }), RangeError);
  const store = new WorkerCertificates(ca, { cacheLimit: 2, concurrency: 2, queueLimit: 8 });
  let ticks = 0;
  const timer = setInterval(() => ticks++, 5);
  const started = performance.now();
  try {
    const same = await Promise.all(Array.from({ length: 20 }, () => store.get('shared.invalid')));
    assert.ok(same.every((leaf) => leaf === same[0]), 'concurrent same-host handshakes share one certificate');
    await Promise.all(['a.invalid', 'b.invalid', 'c.invalid'].map((host) => store.get(host)));
    assert.equal(store.cache.size, 2, 'certificate cache is bounded');
    assert.ok(ticks > 0, 'real OpenSSL jobs must leave the event loop responsive');
    assert.deepEqual((await fs.readdir(ca.dir)).sort(), ['ca.crt', 'ca.key'], 'leaf keys and CSRs removed after signing');
    console.log(JSON.stringify({ certificateMilliseconds: performance.now() - started, eventLoopTicks: ticks, cachedLeaves: store.cache.size }));
    const pending = ['one.invalid', 'two.invalid', 'three.invalid'].map((host) => store.get(host));
    const outcomes = Promise.allSettled(pending);
    await store.close();
    assert.ok((await outcomes).every((result) => result.status === 'rejected'), 'close cancels active and queued signing');
    await assert.rejects(fs.access(ca.dir));
    await assert.rejects(store.get('late.invalid'), /closed/);
    assert.equal(store.pending.size, 0);
    console.log('PASS async certificate responsiveness, deduplication, bounded LRU, artifact removal and close cancellation');
  } finally { clearInterval(timer); await store.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

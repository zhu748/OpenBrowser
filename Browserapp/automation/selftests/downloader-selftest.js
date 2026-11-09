'use strict';

/**
 * Self-test for the streaming downloader.
 * Uses a throwaway loopback HTTP server, so no external network is involved.
 */

const assert = require('assert');
const http = require('http');
const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const crypto = require('crypto');

const { Downloader, STATUS } = require('../downloader');

const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}
async function checkAsync(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}

const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

async function makeTempDir() {
  return await fsp.mkdtemp(path.join(os.tmpdir(), 'dl-selftest-'));
}

/** Spin up a server with per-test routes; returns {url, close, hits}. */
function startServer(handler) {
  return new Promise((resolve) => {
    const hits = [];
    const server = http.createServer((req, res) => {
      hits.push({ url: req.url, range: req.headers.range || null });
      handler(req, res, hits.length);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: (p) => `http://127.0.0.1:${port}${p}`,
        close: () => new Promise((r) => server.close(r)),
        hits,
      });
    });
  });
}

(async () => {
  // ---- helpers ----
  check('fileNameFromUrl derives a name from the path', () => {
    const { fileNameFromUrl } = require('../downloader');
    assert.strictEqual(fileNameFromUrl('https://x.test/files/kernel.zip'), 'kernel.zip');
    assert.strictEqual(fileNameFromUrl('https://x.test/a/b.tar.gz?token=1'), 'b.tar.gz');
    assert.strictEqual(fileNameFromUrl('https://x.test/dir/'), 'dir');
  });

  await checkAsync('digestOf and digestFile agree for the same bytes', async () => {
    const payload = Buffer.from('digest-consistency-check');
    const dir = await makeTempDir();
    const file = path.join(dir, 'd.bin');
    await fsp.writeFile(file, payload);
    assert.strictEqual(Downloader.digestOf(payload), md5(payload));
    assert.strictEqual(await Downloader.digestFile(file), md5(payload));
    assert.strictEqual(Downloader.digestOf(payload), await Downloader.digestFile(file));
  });

  // ---- successful download ----
  await checkAsync('downloads a file and verifies its digest', async () => {
    const payload = Buffer.from('kernel-payload-'.repeat(500));
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/kernel.zip'), {
        destPath: path.join(dir, 'kernel.zip'),
        expectedMd5: md5(payload),
      });
      const events = [];
      dl.on('status', (s) => events.push(s.status));
      const result = await dl.start();

      assert.strictEqual(result.skipped, false);
      assert.strictEqual(result.md5, md5(payload));
      assert.strictEqual(result.attempts, 1);
      assert.deepStrictEqual(await fsp.readFile(result.path), payload);
      assert.ok(events.includes(STATUS.DOWNLOADING), 'emitted downloading');
      assert.ok(events.includes(STATUS.VERIFYING), 'emitted verifying');
      assert.strictEqual(events[events.length - 1], STATUS.COMPLETED);
      assert.strictEqual(dl.progress, 1);
    } finally {
      await server.close();
    }
  });

  await checkAsync('reports byte-level progress', async () => {
    const payload = Buffer.alloc(256 * 1024, 7);
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/big.bin'), { destPath: path.join(dir, 'big.bin') });
      let lastReceived = 0;
      let sawFinal = false;
      dl.on('progress', ({ received, total }) => {
        assert.ok(received >= lastReceived, 'bytes must not go backwards');
        lastReceived = received;
        if (total && received === total) sawFinal = true;
      });
      const result = await dl.start();
      assert.strictEqual(result.bytes, payload.length);
      assert.ok(sawFinal, 'final progress event observed');
    } finally {
      await server.close();
    }
  });

  await checkAsync('derives the filename from the url when not specified', async () => {
    const payload = Buffer.from('abc');
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/assets/tool.bin'), { dir });
      const result = await dl.start();
      assert.strictEqual(path.basename(result.path), 'tool.bin');
      assert.deepStrictEqual(await fsp.readFile(result.path), payload);
    } finally {
      await server.close();
    }
  });

  // ---- reuse & verification ----
  await checkAsync('reuses an existing file with a matching digest', async () => {
    const payload = Buffer.from('already-here');
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'cached.bin');
    await fsp.writeFile(destPath, payload);

    const server = await startServer((req, res) => {
      res.writeHead(200);
      res.end('should-not-be-fetched');
    });
    try {
      const dl = new Downloader(server.url('/cached.bin'), { destPath, expectedMd5: md5(payload) });
      const result = await dl.start();
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(server.hits.length, 0, 'no request issued');
      assert.deepStrictEqual(await fsp.readFile(destPath), payload);
    } finally {
      await server.close();
    }
  });

  await checkAsync('re-downloads when the existing file has the wrong digest', async () => {
    const payload = Buffer.from('fresh-content');
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'stale.bin');
    await fsp.writeFile(destPath, 'stale-content');

    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    try {
      const dl = new Downloader(server.url('/stale.bin'), { destPath, expectedMd5: md5(payload) });
      const result = await dl.start();
      assert.strictEqual(result.skipped, false);
      assert.deepStrictEqual(await fsp.readFile(destPath), payload);
      assert.strictEqual(server.hits.length, 1);
    } finally {
      await server.close();
    }
  });

  await checkAsync('rejects a body whose digest does not match', async () => {
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': 5 });
      res.end('wrong');
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/bad.bin'), {
        destPath: path.join(dir, 'bad.bin'),
        expectedMd5: md5(Buffer.from('right')),
      });
      await assert.rejects(() => dl.start(), /md5 mismatch/);
      assert.strictEqual(dl.status, STATUS.FAILED);
      assert.strictEqual(await Downloader.fileExists(path.join(dir, 'bad.bin')), false, 'nothing promoted');
    } finally {
      await server.close();
    }
  });

  await checkAsync('verifies a sha256 digest and reports the transfer digest', async () => {
    const payload = Buffer.from('sha256-verified-payload'.repeat(64));
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/s.zip'), {
        destPath: path.join(dir, 's.zip'),
        expectedSha256: sha256(payload),
      });
      const result = await dl.start();
      assert.strictEqual(result.sha256, sha256(payload));
      // MD5 is no longer computed when only a sha256 was expected: hashing a
      // large transfer for a digest nobody verifies is pure waste.
      assert.strictEqual(result.md5, null, 'md5 skipped when not expected');
    } finally {
      await server.close();
    }
  });

  await checkAsync('rejects a sha256 mismatch before promotion', async () => {
    const payload = Buffer.from('evil!');
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/evil.zip'), {
        destPath: path.join(dir, 'evil.zip'),
        expectedSha256: sha256(Buffer.from('good!')),
      });
      await assert.rejects(() => dl.start(), /sha256 mismatch/);
      assert.strictEqual(await Downloader.fileExists(path.join(dir, 'evil.zip')), false);
    } finally {
      await server.close();
    }
  });

  check('a malformed expected digest is refused at construction', () => {
    assert.throws(() => new Downloader('https://x.test/w.bin', { expectedSha256: 'not-hex-at-all' }), /64-character hex/);
    assert.throws(() => new Downloader('https://x.test/w.bin', { expectedSha256: 'deadbeef' }), /64-character hex/);
    assert.throws(() => new Downloader('https://x.test/w.bin', { expectedMd5: 'deadbeef' }), /32-character hex/);
    // Empty stays "no check wanted" so optional digests keep working.
    assert.doesNotThrow(() => new Downloader('https://x.test/w.bin', { expectedSha256: '' }));
  });

  await checkAsync('computeSha256 reports the digest without enforcing one', async () => {
    const payload = Buffer.from('pin-me-for-later'.repeat(40));
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/pin.bin'), {
        destPath: path.join(dir, 'pin.bin'),
        computeSha256: true,
      });
      const result = await dl.start();
      assert.strictEqual(result.sha256, sha256(payload));
      assert.ok(result.bytes > 0);
    } finally {
      await server.close();
    }
  });

  await checkAsync('a truncated response is rejected even without a digest', async () => {
    const server = await startServer((req, res) => {
      // Announce more bytes than the socket will deliver. Node's HTTP parser
      // flags the premature close as 'aborted'; the downloader's own
      // short-body gate is the second line of defence for the cases the
      // parser lets through.
      res.writeHead(200, { 'content-length': 4096 });
      res.end(Buffer.alloc(1024));
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/cut.bin'), {
        destPath: path.join(dir, 'cut.bin'),
        retries: 0,
      });
      await assert.rejects(() => dl.start(), /truncated response|aborted/);
      assert.strictEqual(await Downloader.fileExists(path.join(dir, 'cut.bin')), false, 'nothing promoted');
    } finally {
      await server.close();
    }
  });

  await checkAsync('a resumed transfer covers the sha256 of the whole payload', async () => {
    const payload = Buffer.from('0123456789abcdef'.repeat(128));
    const splitAt = 512;
    const server = await startServer((req, res) => {
      const range = req.headers.range;
      if (range) {
        const start = Number(/bytes=(\d+)-/.exec(range)[1]);
        const slice = payload.slice(start);
        res.writeHead(206, {
          'content-range': `bytes ${start}-${payload.length - 1}/${payload.length}`,
          'content-length': slice.length,
        });
        res.end(slice);
        return;
      }
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'resume-pin.bin');
    try {
      await fsp.writeFile(`${destPath}.partial`, payload.slice(0, splitAt));
      const dl = new Downloader(server.url('/rp.bin'), {
        destPath,
        expectedSha256: sha256(payload),
      });
      const result = await dl.start();
      assert.strictEqual(result.sha256, sha256(payload), 'sha256 covers prior bytes plus new ones');
      assert.deepStrictEqual(await fsp.readFile(destPath), payload);
    } finally {
      await server.close();
    }
  });

  // ---- retry & errors ----
  await checkAsync('retries a failing request then succeeds', async () => {
    const payload = Buffer.from('eventual-success');
    const server = await startServer((req, res, hit) => {
      if (hit < 3) {
        res.writeHead(500);
        res.end('boom');
        return;
      }
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/flaky.bin'), {
        destPath: path.join(dir, 'flaky.bin'),
        retries: 3,
      });
      const attempts = [];
      dl.on('retry', ({ attempt }) => attempts.push(attempt));
      const result = await dl.start();
      assert.strictEqual(attempts.length, 2, 'two failures recorded');
      assert.strictEqual(result.attempts, 3);
      assert.deepStrictEqual(await fsp.readFile(result.path), payload);
    } finally {
      await server.close();
    }
  });

  await checkAsync('gives up after the configured retries', async () => {
    const server = await startServer((req, res) => {
      res.writeHead(404);
      res.end('missing');
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/nope.bin'), {
        destPath: path.join(dir, 'nope.bin'),
        retries: 2,
      });
      await assert.rejects(() => dl.start(), /http 404/);
      assert.strictEqual(server.hits.length, 3, 'initial attempt plus two retries');
    } finally {
      await server.close();
    }
  });

  await checkAsync('follows redirects to the final location', async () => {
    const payload = Buffer.from('redirected-body');
    const server = await startServer((req, res) => {
      if (req.url === '/start') {
        res.writeHead(302, { location: '/final' });
        res.end();
        return;
      }
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/start'), { destPath: path.join(dir, 'r.bin') });
      const result = await dl.start();
      assert.deepStrictEqual(await fsp.readFile(result.path), payload);
      assert.strictEqual(server.hits.length, 2);
    } finally {
      await server.close();
    }
  });

  await checkAsync('a redirect target is offered to the url validator', async () => {
    const payload = Buffer.from('body-after-redirect');
    const server = await startServer((req, res) => {
      if (req.url === '/start') {
        res.writeHead(302, { location: '/elsewhere' });
        res.end();
        return;
      }
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    const seen = [];
    try {
      const dl = new Downloader(server.url('/start'), {
        destPath: path.join(dir, 'r.bin'),
        validateUrl: (target) => { seen.push(target); },
      });
      await dl.start();
      assert.strictEqual(seen.length, 2, 'both the original and the redirect are vetted');
      assert.ok(seen[0].endsWith('/start'));
      assert.ok(seen[1].endsWith('/elsewhere'));
    } finally {
      await server.close();
    }
  });

  await checkAsync('a rejected redirect target stops the transfer', async () => {
    const server = await startServer((req, res) => {
      if (req.url === '/start') {
        res.writeHead(302, { location: '/offsite' });
        res.end();
        return;
      }
      res.writeHead(200, { 'content-length': 4 });
      res.end('nope');
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/start'), {
        destPath: path.join(dir, 'r.bin'),
        retries: 0,
        validateUrl: (target) => {
          if (target.includes('/offsite')) throw new Error('redirect target is not allowed');
        },
      });
      await assert.rejects(() => dl.start(), /not allowed/);
      await assert.rejects(() => fsp.stat(dl.destPath), 'nothing is written to the destination');
    } finally {
      await server.close();
    }
  });

  await checkAsync('a redirect that leaves https is refused by a scheme check', async () => {
    const server = await startServer((req, res) => {
      res.writeHead(302, { location: 'http://example.invalid/plain' });
      res.end();
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/start'), {
        destPath: path.join(dir, 'r.bin'),
        retries: 0,
        validateUrl: (target) => {
          const parsed = new URL(target);
          if (parsed.protocol !== 'https:') throw new Error('untrusted redirect protocol');
        },
      });
      await assert.rejects(() => dl.start(), /untrusted redirect protocol/);
    } finally {
      await server.close();
    }
  });

  await checkAsync('an announced size above the ceiling is refused before writing', async () => {
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': 4096 });
      res.end(Buffer.alloc(4096));
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/big'), {
        destPath: path.join(dir, 'big.bin'),
        retries: 0,
        maxBytes: 1024,
      });
      await assert.rejects(() => dl.start(), /exceeds the 1024 byte limit/);
    } finally {
      await server.close();
    }
  });

  await checkAsync('an unknown size still hits the ceiling mid-stream', async () => {
    const server = await startServer((req, res) => {
      // No Content-Length at all, so the size is only discovered while the
      // body streams in; the ceiling has to be enforced during the transfer.
      res.writeHead(200, { 'transfer-encoding': 'chunked' });
      res.write(Buffer.alloc(4096));
      res.end(Buffer.alloc(4096));
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/liar'), {
        destPath: path.join(dir, 'liar.bin'),
        retries: 0,
        maxBytes: 2048,
      });
      await assert.rejects(() => dl.start(), /exceeds the 2048 byte limit/);
    } finally {
      await server.close();
    }
  });

  await checkAsync('a transfer inside the ceiling completes normally', async () => {
    const payload = Buffer.from('small enough');
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/ok'), {
        destPath: path.join(dir, 'ok.bin'),
        maxBytes: 1024,
        validateUrl: (target) => {
          if (!String(target).startsWith('http://127.0.0.1')) throw new Error('host not allowed');
        },
      });
      const result = await dl.start();
      assert.deepStrictEqual(await fsp.readFile(result.path), payload);
    } finally {
      await server.close();
    }
  });

  await checkAsync('reports an invalid url without crashing', async () => {
    const dir = await makeTempDir();
    const dl = new Downloader('not-a-url', { destPath: path.join(dir, 'x.bin') });
    await assert.rejects(() => dl.start(), /invalid url|unsupported protocol/);
    assert.strictEqual(dl.status, STATUS.FAILED);
  });

  // ---- resume ----
  await checkAsync('resumes a partial file with a range request', async () => {
    const payload = Buffer.from('0123456789'.repeat(400));
    const splitAt = 1200;
    const server = await startServer((req, res) => {
      const range = req.headers.range;
      if (range) {
        const start = Number(/bytes=(\d+)-/.exec(range)[1]);
        const slice = payload.slice(start);
        res.writeHead(206, {
          'content-range': `bytes ${start}-${payload.length - 1}/${payload.length}`,
          'content-length': slice.length,
        });
        res.end(slice);
        return;
      }
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });

    const dir = await makeTempDir();
    const destPath = path.join(dir, 'resume.bin');
    try {
      // Pre-seed a partial download so the next run can pick up where it left off.
      await fsp.writeFile(`${destPath}.partial`, payload.slice(0, splitAt));

      const dl = new Downloader(server.url('/resume.bin'), {
        destPath,
        expectedMd5: md5(payload),
      });
      const result = await dl.start();

      assert.strictEqual(server.hits[0].range, `bytes=${splitAt}-`, 'range header sent');
      assert.strictEqual(result.md5, md5(payload), 'digest covers prior bytes plus new ones');
      assert.deepStrictEqual(await fsp.readFile(destPath), payload);
    } finally {
      await server.close();
    }
  });

  await checkAsync('restarts from scratch when the server ignores the range', async () => {
    const payload = Buffer.from('restart-payload'.repeat(100));
    const server = await startServer((req, res) => {
      // Ignore Range and return the whole body with 200.
      res.writeHead(200, { 'content-length': payload.length });
      res.end(payload);
    });
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'restart.bin');
    try {
      await fsp.writeFile(`${destPath}.partial`, 'garbage-from-a-previous-run');
      const dl = new Downloader(server.url('/restart.bin'), { destPath, expectedMd5: md5(payload) });
      const result = await dl.start();
      assert.deepStrictEqual(await fsp.readFile(destPath), payload);
      assert.strictEqual(result.md5, md5(payload));
    } finally {
      await server.close();
    }
  });

  await checkAsync('cleanup removes the partial file', async () => {
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'c.bin');
    const tmp = `${destPath}.partial`;
    await fsp.writeFile(tmp, 'leftover');
    const dl = new Downloader('http://127.0.0.1:1/x', { destPath });
    await dl.cleanup();
    assert.strictEqual(await Downloader.fileExists(tmp), false);
  });

  check('constructor rejects a missing url', () => {
    assert.throws(() => new Downloader(''), /url is required/);
  });

  await checkAsync('cancel before start never downloads or promotes a file', async () => {
    const server = await startServer((_req, res) => res.end('body'));
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/cancel'), { destPath: path.join(dir, 'x') });
      dl.cancel();
      await assert.rejects(dl.start(), /download canceled/);
      assert.strictEqual(dl.status, STATUS.CANCELED);
      assert.strictEqual(server.hits.length, 0);
    } finally { await server.close(); }
  });

  await checkAsync('cancel aborts a request still waiting for response headers', async () => {
    let dl;
    const server = await startServer(() => dl.cancel());
    const dir = await makeTempDir();
    try {
      dl = new Downloader(server.url('/hang'), { destPath: path.join(dir, 'x'), timeoutMs: 250, retries: 2 });
      await assert.rejects(dl.start(), /download canceled/);
      assert.strictEqual(dl.status, STATUS.CANCELED);
      assert.strictEqual(server.hits.length, 1, 'cancellation must skip retries');
    } finally { await server.close(); }
  });

  await checkAsync('destPath creates its own missing parent directory', async () => {
    const server = await startServer((_req, res) => res.end('body'));
    const dir = await makeTempDir();
    try {
      const destPath = path.join(dir, 'nested', 'x');
      const dl = new Downloader(server.url('/file'), { destPath });
      await dl.start();
      assert.strictEqual(await fsp.readFile(destPath, 'utf8'), 'body');
    } finally { await server.close(); }
  });

  await checkAsync('failed final rename preserves the existing destination', async () => {
    const server = await startServer((_req, res) => res.end('new'));
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'x');
    const rename = fsp.rename;
    try {
      await fsp.writeFile(destPath, 'old');
      fsp.rename = async (from, to) => {
        if (to === destPath) throw new Error('simulated replacement failure');
        return rename(from, to);
      };
      const dl = new Downloader(server.url('/file'), { destPath });
      await assert.rejects(dl.start(), /replacement failure/);
      assert.strictEqual(await fsp.readFile(destPath, 'utf8'), 'old');
    } finally { fsp.rename = rename; await server.close(); }
  });

  for (const range of [undefined, 'bytes 0-2/3', 'bytes 3-5/9']) {
    await checkAsync(`invalid or incomplete resume range is never promoted (${range})`, async () => {
      const server = await startServer((_req, res) => {
        const headers = { 'content-length': 3 };
        if (range) headers['content-range'] = range;
        res.writeHead(206, headers);
        res.end('def');
      });
      const dir = await makeTempDir();
      const destPath = path.join(dir, 'x');
      try {
        await fsp.writeFile(destPath + '.partial', 'abc');
        const dl = new Downloader(server.url('/file'), { destPath });
        await assert.rejects(dl.start(), /range|truncated/i);
        assert.strictEqual(await Downloader.fileExists(destPath), false);
      } finally { await server.close(); }
    });
  }

  await checkAsync('a malformed redirect rejects without an uncaught exception', async () => {
    const server = await startServer((_req, res) => {
      res.writeHead(302, { location: 'http://[' });
      res.end();
    });
    const dir = await makeTempDir();
    try {
      const dl = new Downloader(server.url('/file'), { destPath: path.join(dir, 'x') });
      await assert.rejects(dl.start(), /invalid url/i);
    } finally { await server.close(); }
  });

  await checkAsync('cancel during retry backoff preserves canceled status and skips the next attempt', async () => {
    const server = await startServer((_req, res) => { res.writeHead(503); res.end(); });
    const dir = await makeTempDir();
    let timer;
    try {
      const dl = new Downloader(server.url('/retry'), { destPath: path.join(dir, 'x'), retries: 2 });
      dl.on('retry', () => { timer = setTimeout(() => dl.cancel(), 10); });
      await assert.rejects(dl.start(), /download canceled/);
      assert.strictEqual(dl.status, STATUS.CANCELED);
      assert.strictEqual(server.hits.length, 1);
      assert.strictEqual(dl.attempt, 1);
    } finally { clearTimeout(timer); await server.close(); }
  });

  await checkAsync('cancel during streaming closes the pipeline without promotion', async () => {
    const server = await startServer((_req, res) => {
      res.writeHead(200, { 'content-length': 1024 * 1024 });
      res.flushHeaders();
      // Let the progress notification's 100ms throttle elapse after headers.
      const timer = setTimeout(() => res.write(Buffer.alloc(64 * 1024)), 120);
      res.on('close', () => clearTimeout(timer));
    });
    const dir = await makeTempDir();
    const destPath = path.join(dir, 'x');
    try {
      const dl = new Downloader(server.url('/stream'), { destPath, timeoutMs: 1000 });
      dl.on('progress', ({ received }) => { if (received > 0) dl.cancel(); });
      await assert.rejects(dl.start(), /download canceled/);
      assert.strictEqual(dl.status, STATUS.CANCELED);
      assert.strictEqual(await Downloader.fileExists(destPath), false);
      assert.strictEqual(dl._activeRes, null);
    } finally { await server.close(); }
  });

  // ---- report ----
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.err}`}`);
  }
  console.log(`\nDOWNLOADER_SELFTEST ${failed.length ? 'FAILED' : 'OK'} ${passed}/${results.length}`);
  if (failed.length) process.exitCode = 1;
})();

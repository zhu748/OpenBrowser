#!/usr/bin/env node
'use strict';

// Compare the reviewed revision with the worktree using a real loopback HTTP
// range response. This measures the downloader only, not Internet throughput.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const revision = process.argv[2] || 'f082bef';
const root = path.resolve(__dirname, '../..');
const file = 'Browserapp/automation/downloader.js';
const before = execFileSync('git', ['show', revision + ':' + file], { cwd: root, encoding: 'utf8' });
const after = fs.readFileSync(path.join(root, file), 'utf8');
function load(source) {
  const scope = { require, module: { exports: {} }, Buffer, process, AbortController, setTimeout, clearTimeout };
  vm.runInNewContext(source, scope, { filename: file });
  return scope.module.exports.Downloader;
}

async function main() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-resume-benchmark-'));
  const prior = Buffer.alloc(32 * 1024 * 1024, 65);
  const tail = Buffer.alloc(4096, 66);
  const total = prior.length + tail.length;
  const server = http.createServer((_req, res) => {
    res.writeHead(206, { 'content-range': `bytes ${prior.length}-${total - 1}/${total}`, 'content-length': tail.length });
    res.end(tail);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/file';
  const original = fs.createReadStream;
  let rereadBytes = 0;
  fs.createReadStream = (...args) => {
    const stream = original(...args);
    stream.on('data', (chunk) => { rereadBytes += chunk.length; });
    return stream;
  };
  try {
    const results = [];
    for (const [name, Downloader] of [['before', load(before)], ['after', load(after)]]) {
      const times = [];
      const bytes = [];
      for (let i = 0; i < 6; i += 1) {
        const destPath = path.join(dir, name + '-' + i);
        await fsp.writeFile(destPath + '.partial', prior);
        rereadBytes = 0;
        const start = performance.now();
        const result = await new Downloader(url, { destPath }).start();
        const elapsed = performance.now() - start;
        assert.equal(result.bytes, total);
        assert.equal((await fsp.stat(destPath)).size, total);
        const content = await fsp.readFile(destPath);
        assert.ok(content.subarray(0, prior.length).equals(prior));
        assert.ok(content.subarray(prior.length).equals(tail));
        if (i) { times.push(elapsed); bytes.push(rereadBytes); }
        await fsp.rm(destPath);
      }
      assert.ok(bytes.every((value) => value === bytes[0]));
      results.push({ name, medianMs: +times.sort((a, b) => a - b)[2].toFixed(3), rereadBytes: bytes[0] });
    }
    assert.equal(results[1].rereadBytes, 0);
    console.log(JSON.stringify({ baseline: revision, node: process.version, partialBytes: prior.length,
      fetchedBytes: tail.length, samples: '5 measured runs after 1 warmup per version', results }, null, 2));
  } finally {
    fs.createReadStream = original;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

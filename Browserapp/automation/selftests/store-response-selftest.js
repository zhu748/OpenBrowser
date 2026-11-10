'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { readResponseBuffer } = require('../response-body');

async function fixture(root, fetch) {
  const filename = path.resolve(__dirname, '../../chrome-store-metadata.js');
  const localRequire = createRequire(filename);
  const timers = new Map();
  const loaded = { exports: {} };
  const storeSession = { fetch: (url, options) => fetch(url, options, timers), setProxy: async () => {} };
  const bridge = { app: { getPath: () => root }, session: { fromPartition: () => storeSession } };
  const run = new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', await fs.readFile(filename, 'utf8'));
  run((name) => name === './host-bridge' ? bridge : localRequire(name), loaded, loaded.exports,
    (fn) => { const id = Symbol(); timers.set(id, fn); return id; }, (id) => timers.delete(id));
  return { api: loaded.exports, timers };
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-store-response-'));
  const id = 'a'.repeat(32);
  const imageUrl = 'https://lh3.googleusercontent.com/icon.png';
  const html = `<meta property="og:image" content="${imageUrl}">`;
  try {
    assert.deepEqual(await readResponseBuffer(new Response('abcd'), 4), Buffer.from('abcd'), 'the byte limit is inclusive');
    await assert.rejects(readResponseBuffer(new Response('中中'), 5), { code: 'ERESPONSETOOLARGE' }, 'limits count UTF-8 bytes');
    let declaredCancelled = false;
    await assert.rejects(readResponseBuffer({
      headers: new Headers({ 'content-length': '100' }),
      body: { cancel: async () => { declaredCancelled = true; } },
      arrayBuffer: () => { throw new Error('must not read a declared oversized body'); },
    }, 4), { code: 'ERESPONSETOOLARGE' });
    assert.equal(declaredCancelled, true);
    assert.deepEqual(await readResponseBuffer({ arrayBuffer: async () => Buffer.from('ok') }, 2), Buffer.from('ok'), 'non-streaming adapter compatibility');
    await assert.rejects(readResponseBuffer({ arrayBuffer: async () => Buffer.from('large') }, 2), { code: 'ERESPONSETOOLARGE' });

    const observedTimers = [];
    const good = await fixture(path.join(root, 'good'), async (url, _options, timers) => {
      const response = new Response(url === imageUrl ? Buffer.from([0x89, 0x50, 1, 2]) : html,
        { headers: { 'content-type': url === imageUrl ? 'image/png' : 'text/html' } });
      for (const method of ['text', 'arrayBuffer']) {
        const original = response[method].bind(response);
        response[method] = () => { observedTimers.push(timers.size); return original(); };
      }
      const read = response.body.getReader.bind(response.body);
      response.body.getReader = () => { observedTimers.push(timers.size); return read(); };
      return response;
    });
    assert.match(await good.api.fetchChromeStoreIcon(id), /^data:image\/png;base64,/);
    assert.ok(observedTimers.length >= 2);
    assert.ok(observedTimers.every((size) => size > 0), 'page and image timeouts must remain active through body reading');
    assert.equal(good.timers.size, 0, 'successful reads clear all timeout handles');

    for (const target of ['page', 'image']) {
      let ready;
      const reading = new Promise((resolve) => { ready = resolve; });
      let requests = 0;
      const stalled = await fixture(path.join(root, `stalled-${target}`), async (url, options) => {
        requests++;
        if (target === 'image' && url !== imageUrl) return new Response(html);
        const stream = new ReadableStream({ start(controller) {
          options.signal.addEventListener('abort', () => controller.error(new DOMException('aborted', 'AbortError')), { once: true });
        } });
        const response = new Response(stream, { headers: { 'content-type': 'image/png' } });
        const reader = response.body.getReader.bind(response.body);
        response.body.getReader = () => { ready(); return reader(); };
        return response;
      });
      const pending = stalled.api.fetchChromeStoreIcon(id);
      await reading;
      assert.equal(stalled.timers.size, 1);
      [...stalled.timers.values()][0]();
      assert.equal(await pending, null, 'a stalled response is aborted and omitted');
      assert.equal(stalled.timers.size, 0);
      const again = stalled.api.fetchChromeStoreIcon(id);
      // The page may remain cached, but the failed body request must be retried.
      const deadline = Date.now() + 1000;
      while (!stalled.timers.size) {
        assert.ok(Date.now() < deadline, 'retry must reach the fetch instead of hanging');
        await new Promise((resolve) => setImmediate(resolve));
      }
      [...stalled.timers.values()][0]();
      assert.equal(await again, null);
      assert.equal(requests, target === 'image' ? 3 : 2, 'failed requests release their in-flight dedup entries');
    }

    let cancelled = 0;
    let reads = 0;
    const oversized = await fixture(path.join(root, 'oversized'), async (url) => {
      if (url !== imageUrl) return new Response(html);
      return {
        ok: true, url, headers: new Headers({ 'content-type': 'image/png' }),
        body: { getReader: () => ({
          read: async () => { reads++; return { done: false, value: Buffer.alloc(1024 * 1024) }; },
          cancel: async () => { cancelled++; }, releaseLock() {},
        }) },
      };
    });
    assert.equal(await oversized.api.fetchChromeStoreIcon(id), null);
    assert.equal(reads, 3, 'oversized image reading stops as soon as its 2MiB cap is exceeded');
    assert.equal(cancelled, 1, 'oversized transfers release the reader');

    let pageReads = 0;
    let pageCancelled = 0;
    const hugePage = await fixture(path.join(root, 'huge-page'), async () => ({
      ok: true, headers: new Headers(), body: { getReader: () => ({
        read: async () => { pageReads++; return { done: false, value: Buffer.alloc(1024 * 1024) }; },
        cancel: async () => { pageCancelled++; }, releaseLock() {},
      }) },
    }));
    assert.equal(await hugePage.api.fetchChromeStoreIcon(id), null);
    assert.equal(pageReads, 5, 'HTML is capped at 4MiB during streaming');
    assert.equal(pageCancelled, 1);
    console.log('STORE_RESPONSE_SELFTEST OK (page/image body deadlines, retry cleanup, streaming image cap)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

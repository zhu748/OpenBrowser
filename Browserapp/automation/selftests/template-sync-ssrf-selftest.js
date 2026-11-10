'use strict';

/**
 * SSRF guard regression tests for remote template sync.
 *
 * Every outbound request the template store makes funnels through
 * requestRaw(), which validates the URL before using the shared transport. These
 * checks pin that contract: scheme allow-list, no embedded credentials,
 * cloud-metadata always blocked, private/loopback rejected unless
 * OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC=1, and a 20MB response cap.
 *
 *   node automation/selftests/template-sync-ssrf-selftest.js
 */

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');
const { assertSafeTemplateSyncUrl, fetchProcessPack } = require('../template-sync');

const ENV_PRIVATE = 'OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC';

async function withPrivateSyncAllowed(value, fn) {
  const prev = process.env[ENV_PRIVATE];
  if (value === undefined) delete process.env[ENV_PRIVATE];
  else process.env[ENV_PRIVATE] = value;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env[ENV_PRIVATE];
    else process.env[ENV_PRIVATE] = prev;
  }
}

async function main() {
  // --- public marketplace endpoints pass and return a parsed URL ---
  const parsed = assertSafeTemplateSyncUrl('https://market.example.com/rpav2/template/template-list?lang=zh');
  assert.strictEqual(parsed.hostname, 'market.example.com');
  assert.ok(assertSafeTemplateSyncUrl('http://cdn.example.org/pack.json.gz') instanceof URL);
  console.log('  PASS  public https/http endpoints accepted');

  // --- scheme allow-list ---
  assert.throws(() => assertSafeTemplateSyncUrl('file:///etc/passwd'), /必须以 http/i);
  assert.throws(() => assertSafeTemplateSyncUrl('ftp://example.com/pack.json'), /必须以 http/i);
  assert.throws(() => assertSafeTemplateSyncUrl('not-a-url'), /必须以 http/i);
  assert.throws(() => assertSafeTemplateSyncUrl(''), /必须以 http/i);
  assert.throws(() => assertSafeTemplateSyncUrl(null), /必须以 http/i);
  console.log('  PASS  non-http(s) schemes rejected');

  // --- embedded credentials rejected (requests carry user cookies/tokens) ---
  assert.throws(() => assertSafeTemplateSyncUrl('http://user:pass@example.com/x'), /内嵌账号密码/);
  assert.throws(() => assertSafeTemplateSyncUrl('https://tok@example.com/x'), /内嵌账号密码/);
  console.log('  PASS  embedded credentials rejected');

  // --- cloud metadata always blocked, env override must not weaken it ---
  for (const meta of ['http://169.254.169.254/latest/meta-data/', 'http://169.254.170.2/v2/credentials', 'http://metadata.google.internal/', 'http://metadata/']) {
    assert.throws(() => assertSafeTemplateSyncUrl(meta), /metadata|SSRF/);
    await withPrivateSyncAllowed('1', () => {
      assert.throws(() => assertSafeTemplateSyncUrl(meta), /metadata|SSRF/);
    });
  }
  console.log('  PASS  cloud metadata endpoints always blocked');

  // --- private / loopback / link-local rejected without the dev override ---
  const privateTargets = [
    'http://127.0.0.1:8080/api',
    'http://localhost:3000/rpav2/',
    'http://10.1.2.3/api',
    'http://192.168.0.1/api',
    'http://172.20.1.1/api',
    'http://100.64.1.1/api',
    'http://198.18.0.5/api',
    'http://[::1]/api',
    'http://[fd12::1]/api',
    'http://[fe80::1]/api',
    'http://store.local/api',
  ];
  await withPrivateSyncAllowed(undefined, () => {
    for (const target of privateTargets) {
      assert.throws(() => assertSafeTemplateSyncUrl(target), /本机\/内网|SSRF/);
    }
  });
  // only the exact value '1' enables the dev override
  for (const weak of ['0', 'true', 'yes', '']) {
    await withPrivateSyncAllowed(weak, () => {
      assert.throws(() => assertSafeTemplateSyncUrl('http://127.0.0.1:8080/api'), /本机\/内网|SSRF/);
    });
  }
  await withPrivateSyncAllowed('1', () => {
    assert.ok(assertSafeTemplateSyncUrl('http://127.0.0.1:8080/api') instanceof URL);
  });
  console.log('  PASS  private targets blocked unless OPENBROWSER_ALLOW_PRIVATE_TEMPLATE_SYNC=1');

  // --- one guarded entry into the shared network transport ---
  const src = fs.readFileSync(path.join(__dirname, '..', 'template-sync.js'), 'utf8');
  assert.ok(src.includes('const parsed = assertSafeTemplateSyncUrl(url);'), 'requestRaw must guard before any I/O');
  const libRequests = src.match(/requestBuffer\(/g) || [];
  assert.strictEqual(libRequests.length, 1, 'exactly one shared transport entry (inside requestRaw)');
  for (const forbidden of [/https\.request\(/, /http\.request\(/, /fetch\(/, /net\.connect\(/, /tls\.connect\(/]) {
    assert.ok(!forbidden.test(src), `no direct egress path: ${forbidden}`);
  }
  console.log('  PASS  all template-sync egress funnels through the guarded requestRaw');

  // --- e2e through the real request path (loopback allowed for the test) ---
  await withPrivateSyncAllowed('1', async () => {
    const packPath = '/packs/tpl-1.json';
    const packBody = JSON.stringify({ steps: [{ type: 'openbrowser', url: 'https://example.com' }] });
    const server = http.createServer((req, res) => {
      if (req.url === packPath) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(zlib.gzipSync(Buffer.from(packBody)));
        return;
      }
      if (req.url === '/packs/oversize.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const megabyte = Buffer.alloc(1024 * 1024, 0x61);
        for (let i = 0; i < 21; i += 1) res.write(megabyte);
        res.end();
        return;
      }
      res.writeHead(404);
      res.end('not found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      // guard still runs inside the real fetch path
      const pack = await fetchProcessPack(`${base}${packPath}`);
      assert.strictEqual(Array.isArray(pack.steps), true);
      assert.strictEqual(pack.steps[0].type, 'openbrowser');
      console.log('  PASS  guarded egress fetches and parses a process pack');

      await assert.rejects(() => fetchProcessPack(`${base}/packs/oversize.json`), /响应体过大/);
      console.log('  PASS  response body capped at 20MB');
    } finally {
      server.close();
    }
  });

  console.log('TEMPLATE_SYNC_SSRF_SELFTEST OK');
}

main().catch((error) => {
  console.error('TEMPLATE_SYNC_SSRF_SELFTEST FAILED');
  console.error(error);
  process.exitCode = 1;
});

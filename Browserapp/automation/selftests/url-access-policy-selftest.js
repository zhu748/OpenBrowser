'use strict';

const assert = require('node:assert/strict');
const cdp = require('../../cdp');
const { compileUrlAccessPolicy } = require('../url-access-policy');
const { RequestHeaderRewriter } = require('../request-header-rewriter');
const { applyRuntimeSettings } = require('../../engine/runtime-settings');
const { buildFingerprint } = require('../fingerprint');
const { _startFirefox } = require('../../engine/start-firefox');
const { startRunningWatch } = require('../../engine/lifecycle-cleanup');

const profile = (allowUrls = '', blockUrls = '') => ({ id: 'url-policy', os: 'Windows', privacy: { fontListMode: 'real' }, advanced: { allowUrls, blockUrls } });
const paused = (url, resourceType = 'Fetch', sessionId = 's1') => ({ method: 'Fetch.requestPaused', sessionId,
  params: { requestId: 'request', resourceType, request: { url, method: 'GET', headers: { 'User-Agent': 'host' } } },
});
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
let count = 0;
async function test(name, run) { await run(); count += 1; console.log('PASS ' + name); }

async function main() {
  await test('website rules normalize IDNs, case, trailing dots and subdomains without suffix lookalikes', () => {
    const policy = compileUrlAccessPolicy(profile('EXAMPLE.com.\nhttps://bücher.example/path?next=https://other.test\n*.allowed.test'));
    for (const url of ['https://EXAMPLE.COM./path', 'http://sub.example.com/', 'https://xn--bcher-kva.example/', 'https://allowed.test/', 'https://sub.allowed.test/']) assert.equal(policy.blocks(url), false, url);
    for (const url of ['https://evil-example.com/', 'https://example.com.evil.test/', 'https://allowed.test.evil/', 'https://other.test/']) assert.equal(policy.blocks(url), true, url);
  });
  await test('explicit default and nondefault ports work, and IPv4/IPv6 rules match exact addresses', () => {
    const policy = compileUrlAccessPolicy(profile('https://example.test:443/path,example.test:80,[::1]:8080,127.0.0.1:9000'));
    for (const url of ['https://example.test/', 'http://sub.example.test/', 'http://[::1]:8080/', 'http://127.0.0.1:9000/']) assert.equal(policy.blocks(url), false, url);
    for (const url of ['https://example.test:444/', 'http://[::1]:8081/', 'http://127.0.0.1:9001/', 'http://fake.127.0.0.1:9000/']) assert.equal(policy.blocks(url), true, url);
  });
  await test('blacklists take priority and URL entries keep the editor website-level semantics', () => {
    const policy = compileUrlAccessPolicy(profile('example.test', 'https://private.example.test/path'));
    assert.equal(policy.blocks('https://example.test/'), false);
    assert.equal(policy.blocks('http://private.example.test/different-path'), true);
    assert.equal(policy.blocks('https://sub.private.example.test/'), true);
    assert.equal(policy.blocks('http://localhost:50326/'), true, 'no blanket loopback exemption');
    assert.equal(policy.blocks('about:blank'), false);
    assert.equal(policy.blocks('chrome-extension://id/'), false);
  });
  await test('invalid or overlong rule lists fail instead of silently discarding restrictions', () => {
    for (const rule of ['*', 'https://user:pass@example.test/', 'https://', 'ftp://example.test', 'example.test:', 'example.test:65536', '*.127.0.0.1', 'bad host', 'a..test']) {
      assert.throws(() => compileUrlAccessPolicy(profile(rule)), /无效网站规则/, rule);
      assert.throws(() => compileUrlAccessPolicy(profile('valid.test,' + rule)), /无效网站规则/, rule);
    }
    assert.throws(() => compileUrlAccessPolicy(profile(Array.from({ length: 201 }, (_, index) => `${index}.test`).join('\n'))), /200/);
  });
  await test('blocked documents receive a safe no-store 403 page and resources never continue', async () => {
    const rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test') });
    const calls = [], conn = { command: async (method, params, options) => { calls.push({ method, params, options }); return {}; } };
    rewriter._rewriteHeaders = () => { throw new Error('blocked requests cannot reach header rewriting'); };
    await rewriter.handleEvent(paused('https://user:secret@blocked.test/%3Cscript%3E?token=secret#fragment', 'Document'), conn);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'Fetch.fulfillRequest');
    assert.equal(calls[0].params.responseCode, 403);
    assert.ok(calls[0].params.responseHeaders.some((header) => header.name === 'Cache-Control' && header.value === 'no-store'));
    const html = Buffer.from(calls[0].params.body, 'base64').toString();
    assert.ok(!/secret|token=|fragment|<script>/.test(html));
    await rewriter.handleEvent(paused('https://blocked.test/resource'), conn);
    assert.equal(calls[1].method, 'Fetch.failRequest');
    assert.equal(calls.some((call) => call.method === 'Fetch.continueRequest'), false);
  });
  await test('allowed requests use persona headers, while disabling header rewriting keeps access policy active', async () => {
    const calls = [], conn = { command: async (method, params) => { calls.push({ method, params }); return {}; } };
    const rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test') });
    await rewriter.handleEvent(paused('https://allowed.test/'), conn);
    assert.equal(calls[0].method, 'Fetch.continueRequest');
    assert.equal(calls[0].params.headers.find((header) => header.name.toLowerCase() === 'user-agent').value, rewriter.persona.userAgent);
    rewriter.enabled = false;
    await rewriter.handleEvent(paused('https://blocked.test/'), conn);
    assert.equal(calls[1].method, 'Fetch.failRequest');
  });
  await test('redirect hops recheck their own destination and response pauses stay with the response handler', async () => {
    const rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test') });
    const calls = [], conn = { command: async (method, params) => { calls.push({ method, params }); return {}; } };
    await rewriter.handleEvent(paused('https://allowed.test/redirect?to=https://blocked.test'), conn);
    const redirected = paused('https://blocked.test/', 'Document');
    redirected.params.requestId = 'redirected';
    redirected.params.redirectedRequestId = 'request';
    await rewriter.handleEvent(redirected, conn);
    assert.deepEqual(calls.map((call) => call.method), ['Fetch.continueRequest', 'Fetch.fulfillRequest']);
    const response = paused('https://blocked.test/'); response.params.responseStatusCode = 302;
    assert.equal(rewriter.handleEvent(response, conn), undefined);
    assert.equal(calls.length, 2);
  });
  await test('saved edits, invalid edits, recovery and removal are observed on the next request without a reconnect', async () => {
    let saved = profile('first.test');
    const rewriter = new RequestHeaderRewriter({ profile: saved, getPolicyProfile: () => saved });
    const persona = rewriter.persona, original = rewriter.urlPolicy;
    assert.equal(rewriter.refreshUrlPolicy(), original, 'unchanged rules reuse the compiled policy');
    const calls = [], conn = { command: async (method) => { calls.push(method); return {}; } };
    await rewriter.handleEvent(paused('https://first.test/'), conn);
    saved = profile('second.test');
    await rewriter.handleEvent(paused('https://first.test/'), conn);
    await rewriter.handleEvent(paused('https://second.test/'), conn);
    saved = profile('*');
    await rewriter.handleEvent(paused('https://second.test/'), conn);
    saved = profile();
    await rewriter.handleEvent(paused('https://unlisted.test/'), conn);
    assert.deepEqual(calls, ['Fetch.continueRequest', 'Fetch.failRequest', 'Fetch.continueRequest', 'Fetch.failRequest', 'Fetch.continueRequest']);
    assert.equal(rewriter.persona, persona);
  });
  await test('duplicate pauses share one policy operation and equal request IDs stay session scoped', async () => {
    const gate = deferred(), calls = [];
    const rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test') });
    const conn = { command: async (method, params, options) => { calls.push({ method, params, options }); return gate.promise; } };
    const first = rewriter.handleEvent(paused('https://blocked.test/', 'Document'), conn);
    assert.equal(rewriter.handleEvent(paused('https://blocked.test/', 'Document'), conn), first);
    const other = rewriter.handleEvent(paused('https://blocked.test/', 'Document', 's2'), conn);
    assert.equal(calls.length, 2);
    gate.resolve({});
    await Promise.all([first, other]);
    assert.equal(rewriter.inFlight.size, 0);
  });
  await test('fulfillment rejection or timeout falls back to blocking, and failed blocking escalates', async () => {
    for (const hung of [false, true]) {
      const calls = [], rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test'), commandTimeout: 20 });
      await rewriter.handleEvent(paused('https://blocked.test/', 'Document'), { command: async (method) => {
        calls.push(method);
        if (method === 'Fetch.fulfillRequest') { if (hung) return new Promise(() => {}); throw new Error('fulfill rejected'); }
        return {};
      } });
      assert.deepEqual(calls, ['Fetch.fulfillRequest', 'Fetch.failRequest']);
    }
    let fatal;
    const rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test'), onFatalError: (error) => { fatal = error; } });
    await rewriter.handleEvent(paused('https://blocked.test/'), { command: async () => { throw new Error('blocking failed'); } });
    assert.match(fatal.message, /blocking failed/);
  });
  await test('detach cancels pending access operations and trusted internal origins are explicit', async () => {
    const gate = deferred(), calls = [];
    const rewriter = new RequestHeaderRewriter({ profile: profile('allowed.test'), isInternalRequest: (value) => new URL(value).origin === 'http://127.0.0.1:50326' });
    const conn = { command: async (method) => { calls.push(method); return gate.promise; } };
    const pending = rewriter.handleEvent(paused('https://blocked.test/', 'Document'), conn);
    rewriter.cleanupSession('s1');
    await pending;
    gate.resolve({});
    assert.deepEqual(calls, ['Fetch.fulfillRequest']);
    const immediate = { command: async (method) => { calls.push(method); return {}; } };
    await rewriter.handleEvent(paused('http://127.0.0.1:50326/api/session'), immediate);
    await rewriter.handleEvent(paused('http://127.0.0.1:50327/'), immediate);
    await rewriter.handleEvent(paused('https://evil.test/openbrowser-start.html'), immediate);
    assert.deepEqual(calls.slice(1), ['Fetch.continueRequest', 'Fetch.failRequest', 'Fetch.failRequest']);
  });
  await test('cached runtime sweeps require the shared interceptor and validate rules on initial blank tabs', async () => {
    const savedTabs = cdp.tabs;
    const launched = profile('allowed.test'), fp = buildFingerprint(launched);
    const item = { requestHeaderRewriter: new RequestHeaderRewriter({ profile: launched }) };
    let tab = { id: 'page', url: 'https://allowed.test/' };
    cdp.tabs = async () => [tab];
    const engine = { networkInfo: new Map(), profiles: new Map([[launched.id, launched]]) };
    const run = (trackOn, phase) => applyRuntimeSettings.call(engine, 1, launched, fp, { trackOn, phase, appliedTargetIds: new Set(['page']) });
    try {
      await run(item);
      engine.profiles.set(launched.id, profile('next.test'));
      await run(item);
      assert.equal(item.requestHeaderRewriter.urlPolicy.blocks('https://allowed.test/'), true);
      item.requestHeaderRewriter.destroy();
      await assert.rejects(run(item), /拦截尚未就绪/);
      tab = { ...tab, url: 'about:blank' };
      await run({}, 'pre-startpage');
      tab = { ...tab, url: 'https://allowed.test/' };
      await assert.rejects(run({}, 'pre-startpage'), /拦截尚未就绪/);
      tab = { ...tab, url: 'about:blank' };
      engine.profiles.set(launched.id, profile('*'));
      await assert.rejects(run({}, 'pre-startpage'), /无效网站规则/);
    } finally { cdp.tabs = savedTabs; }
  });
  await test('Firefox rejects unsupported access restrictions before acquiring launch resources', async () => {
    let prepared = false;
    const engine = { profiles: new Map(), running: new Map(), sanitizeProfile: (value) => value,
      resolveStoredProxyProfile: (value) => value, assertStartGenerationActive() {},
      assertProxyConcurrencyAvailable() { prepared = true; throw new Error('past validation'); },
    };
    await assert.rejects(_startFirefox.call(engine, profile('allowed.test')), (error) => error.code === 'URL_POLICY_UNSUPPORTED');
    assert.equal(prepared, false);
    assert.equal(engine.running.size, 0);
  });
  await test('Firefox watcher surfaces unsupported saved restrictions and stops the managed browser', async () => {
    const savedTimeout = global.setTimeout;
    let tick, stopped = false;
    const launched = profile(), events = [];
    const item = { profile: launched, engine: 'firefox', bidiConnection: { command: async () => ({ contexts: [{ url: 'about:blank' }] }) } };
    const engine = { running: new Map([[launched.id, item]]), profiles: new Map([[launched.id, profile('allowed.test')]]),
      emit: (event) => events.push(event),
      async handleBrowserGone(id, target, reason, options) {
        assert.equal(id, launched.id); assert.equal(target, item); assert.equal(reason, 'url-access-policy-unsupported');
        assert.equal(options.kill, true); assert.equal(options.waitForExit, true); item.stopping = true; stopped = true;
      },
    };
    global.setTimeout = (callback) => { tick = callback; return 1; };
    try {
      startRunningWatch.call(engine, item);
      await tick();
      assert.equal(stopped, true);
      assert.ok(events.some((event) => event.action === 'url-access-policy' && /Firefox/.test(event.message)));
      assert.equal(item.watchTimer, null);
    } finally { global.setTimeout = savedTimeout; }
  });
  console.log(`url-access-policy-selftest: OK ${count}/${count}`);
}

const watchdog = setTimeout(() => { console.error('URL policy regression timed out'); process.exit(1); }, 15000);
main().then(() => clearTimeout(watchdog)).catch((error) => { clearTimeout(watchdog); console.error(error); process.exitCode = 1; });

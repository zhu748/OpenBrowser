#!/usr/bin/env node
'use strict';

/**
 * ch7 wave3 remediation selftest（RPA / 窗口同步 / 本地 API·MCP / 启动页服务）
 *
 * 验证第三波审计修复，均为本地无头断言（不依赖 Electron 窗口/真实浏览器）：
 *   A. start-page-server 会话 TTL + 同 profile 轮换吊销 + getSession 过期
 *   B. start-page-server isStartPageUrl 裸子串收紧（精确文件名）
 *   C. local-api-server /status 未认证仅返回名称版本
 *   D. live-sync-v5 isEnvironmentStartUrl / syncZoom isStartPage 源级收紧
 *   E. live-sync-v4 inputMirror 失败后清除（构造假 slave 直接驱动 forward）
 *   F. rpa-store 敏感步骤统计（installTemplate/listTemplates 响应标注）
 *   G. rpa-engine findNetworkResource 页内过滤（源级 + 表达式形态）
 */

const assert = require('assert');
const path = require('path');
const http = require('http');
const { RpaStore } = require('../rpa-store');
const { RpaEngine } = require('../rpa-engine');

const appRoot = path.join(__dirname, '..', '..');
const read = (rel) => require('fs').readFileSync(path.join(appRoot, rel), 'utf8');

const results = [];
function record(name, ok) {
  results.push({ name, ok: Boolean(ok) });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) process.exitCode = 1;
}

async function httpJson(port, method, reqPath, body, headers) {
  const payload = body == null ? null : JSON.stringify(body);
  const options = { host: '127.0.0.1', port, path: reqPath, method, headers: { ...(headers || {}) } };
  if (payload) { options.headers['content-type'] = 'application/json'; options.headers['content-length'] = Buffer.byteLength(payload); }
  return await new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let json = null; try { json = JSON.parse(raw); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  // ---------- A. start-page-server TTL / rotation / expiry ----------
  const { StartPageServer } = require('../start-page-server');
  {
    const server = new StartPageServer({ port: 0 });
    await server.start();
    try {
      const first = server.registerSession({ id: 'ttl-profile', name: 'TTL', number: 9 });
      const firstToken = server.getSession('ttl-profile').token;
      assert.ok(first.includes('token='));
      // Rotation: re-register must revoke the previous token for the profile.
      const second = server.registerSession({ id: 'ttl-profile', name: 'TTL', number: 9 });
      const secondToken = server.getSession('ttl-profile').token;
      assert.notStrictEqual(firstToken, secondToken, 're-register must rotate the token');
      const tokenProbe = await httpJson(server.port, 'GET', `/?pid=ttl-profile&token=${encodeURIComponent(firstToken)}`, null, { accept: 'text/html' });
      record('A1 old token is revoked after re-register (401 or redirected to fresh)', tokenProbe.status === 401 || (tokenProbe.status === 302 && tokenProbe.headers.location && tokenProbe.headers.location.includes(secondToken)));
      const freshProbe = await httpJson(server.port, 'GET', `/?pid=ttl-profile&token=${encodeURIComponent(secondToken)}`, null, { accept: 'application/json' });
      record('A2 fresh token still authorizes the API path', freshProbe.status === 200);
      const staleIndex = server.getSession('ttl-profile');
      assert.ok(staleIndex, 'fresh session reachable');
      // TTL expiry: age the session beyond the 24h bound; lookup must reject.
      staleIndex.at = Date.now() - 25 * 60 * 60 * 1000;
      record('A3 expired session returns null from getSession', server.getSession('ttl-profile') === null);
      // And is no longer authorized over HTTP.
      const expiredProbe = await httpJson(server.port, 'GET', `/?pid=ttl-profile&token=${encodeURIComponent(secondToken)}`, null, { accept: 'application/json' });
      record('A4 expired session is unauthorized over HTTP (401)', expiredProbe.status === 401);
      // Sessions map must not carry the expired row after the lookup.
      record('A5 expired rows are purged from the session index', ![...server.sessions.values()].some((s) => s.token === secondToken));
    } finally {
      await server.stop();
    }
  }

  // ---------- B. isStartPageUrl tightened to exact filenames ----------
  {
    const server = new StartPageServer({ port: 0 });
    await server.start();
    try {
      const port = server.port;
      const judge = (u) => server.isStartPageUrl(u);
      record('B1 third-party URL containing openbrowser-start-page is rejected',
        !judge('https://evil.test/openbrowser-start-page-scam'));
      record('B2 third-party URL containing openbrowser-native is rejected',
        !judge('https://evil.test/p/openbrowser-native'));
      record('B3 exact filename still matches', judge('https://evil.test/openbrowser-start.html') === true
        && judge('https://evil.test/openbrowser-start-page.html') === true);
      record('B4 own origin matches', judge(`http://127.0.0.1:${port}/`) === true
        && judge(`http://localhost:${port}/?pid=x`) === true);
      record('B5 loopback port range fallback still matches (no bound port)',
        (() => { const s2 = new StartPageServer(); try { return s2.isStartPageUrl('http://127.0.0.1:50328'); } finally { /* not started */ } })());
      record('B6 other localhost ports rejected', !judge('http://127.0.0.1:50330/')
        && !judge('http://127.0.0.1:9555/'));
    } finally {
      await server.stop();
    }
  }

  // ---------- C. /status unauthenticated shape ----------
  const { LocalApiServer } = require('../local-api-server');
  {
    const api = new LocalApiServer({
      port: 0,
      apiKey: 'ch7-wave3-key',
      getVersion: () => '9.9.9-test',
      engine: null,
    });
    await api.start();
    try {
      const anon = await httpJson(api.port, 'GET', '/status');
      const body = anon.body && anon.body.data;
      record('C1 unauthenticated /status returns 200 with name+version only',
        anon.status === 200 && body && body.name === 'openbrowser-local-api' && body.version === '9.9.9-test');
      record('C2 unauthenticated /status hides portFallback / apiKeyRequired / port / running counts',
        body && body.portFallback === undefined && body.apiKeyRequired === undefined
        && body.port === undefined && body.requestedPort === undefined
        && body.runningProfiles === undefined && body.sync === undefined && body.rpa === undefined);
      const authed = await httpJson(api.port, 'GET', '/status', null, { 'api-key': 'ch7-wave3-key' });
      const authedBody = authed.body && authed.body.data;
      record('C3 key holder still receives the full /status body',
        authed.status === 200 && authedBody && authedBody.port === api.port
        && authedBody.apiKeyRequired === true && authedBody.runningProfiles === 0);
      const root = await httpJson(api.port, 'GET', '/');
      const rootBody = root.body && root.body.data;
      record('C4 unauthenticated / mirrors the same minimal shape',
        root.status === 200 && rootBody && rootBody.name === 'openbrowser-local-api'
        && rootBody.port === undefined);
      const other = await httpJson(api.port, 'GET', '/api/getVersion');
      record('C5 other routes still require the key (401 without)', other.status === 401);
    } finally {
      await api.stop();
    }
  }

  // ---------- D. live-sync v5 source-level tightening ----------
  {
    const v5Src = read('live-sync-v5.js');
    record('D1 isEnvironmentStartUrl no longer carries the bare alternation',
      !/openbrowser-start\|openbrowser-native/.test(v5Src));
    record('D2 v5 keeps exact openbrowser-start-page.html match',
      /openbrowser-start-page\\\.html/i.test(v5Src) || /openbrowser-start-page\.html/i.test(v5Src));
    const v4Src = read('live-sync-v4.js');
    record('D3 live-sync v4 has no bare openbrowser-start/native substring judge',
      !/includes\('openbrowser-start'\)/.test(v4Src) && !/includes\('openbrowser-native'\)/.test(v4Src));
    // Behavioral spot check through the real module-scoped predicate: v5 keeps
    // it module-private, so re-evaluate the source in a sandbox that captures
    // it. Third-party URLs carrying only the bare marker words must NOT be
    // classified as start pages, while every generated form still is.
    const v5Source = read('live-sync-v5.js');
    const captured = {};
    const captureModule = { exports: captured };
    // The v5 source resolves its own deps relative to Browserapp/ (its real
    // location), so hand the sandbox a require rooted there.
    const v5RealDir = path.join(appRoot);
    const captureRequire = (request) => require(request.startsWith('.') ? path.join(v5RealDir, request) : request);
    const evaluateSource = new Function('exports', 'require', 'module', '__filename', '__dirname',
      v5Source + '\nmodule.exports.__capture = { isEnvironmentStartUrl: isEnvironmentStartUrl };');
    evaluateSource(captured, captureRequire, captureModule, path.join(v5RealDir, 'live-sync-v5.js'), v5RealDir);
    const probe = captureModule.exports.__capture.isEnvironmentStartUrl;
    record('D4 third-party bare openbrowser-native URL is not a start page',
      probe('https://evil.test/openbrowser-native') === false);
    record('D4b third-party bare openbrowser-start-page URL is not a start page',
      probe('https://evil.test/openbrowser-start-page-scam') === false);
    record('D4c bare openbrowser-start query word is not a start page',
      probe('https://news.test/article/openbrowser-start?x=1') === false);
    record('D4d loopback start server origin still is',
      probe('http://127.0.0.1:50328') === true);
    record('D4e exact generated filenames still are',
      probe('https://x.test/openbrowser-start.html') === true
      && probe('https://x.test/openbrowser-start-page.html') === true);
  }

  // ---------- E. inputMirror cleared on failed resync (v4 forward) ----------
  {
    const { LiveSyncController } = require('../../live-sync-v4');
    const events = [];
    const controller = new LiveSyncController(null, (event) => events.push(event));
    controller.master = { id: 'm', item: { port: 1 } };
    controller.slaves = [{ id: 'slave-1', port: 1 }];
    controller.masterTabs = [{ id: 'tab-1', url: 'http://127.0.0.1/x' }];
    controller.masterTabsById = new Map([['tab-1', controller.masterTabs[0]]]);
    controller.slaveTabLists.set('slave-1', { tabs: [{ id: 'st1', url: 'http://127.0.0.1/x', webSocketDebuggerUrl: 'ws://stub' }], at: Date.now() });
    // Drive applyTrustedInput through the real module; a stateful call stub
    // decides per phase whether the native chain succeeds.
    // mode: 'ok' -> probe/focus/blur expressions succeed, insertText succeeds.
    // mode: 'fail' -> every probe returns not-found, so every path fails.
    let mode = 'ok';
    const realCdp = require('../../cdp');
    const origCall = realCdp.call;
    realCdp.call = async function (url, method, params) {
      if (method === 'Runtime.evaluate') {
        const expression = String((params || {}).expression || '');
        // fail mode: every probe reports element-not-found, so every
        // trusted-input path (fast, full, coordinate-click retry) fails.
        if (mode === 'fail') return { result: {} };
        // Distinguish the trusted-input expressions structurally: all of them
        // open with the shared locatorSource, so match on their unique bodies.
        if (/element\.focus/.test(expression)) return { result: { value: { ok: true, found: true, mode: 'select' } } };
        if (/element\.blur/.test(expression)) return { result: { value: { ok: true, found: true } } };
        if (/valueHead/.test(expression)) {
          // Editable probe (fast path and full path): a live editable element
          // holding the mirrored value 'hello'.
          return { result: { value: { found: true, editable: true, contenteditable: false, valueLength: 5, valueHead: 'hello', x: 1, y: 2 } } };
        }
        return { result: { value: true } };
      }
      // Input.* commands succeed at the CDP layer in both modes: a failed
      // resync is expressed through the probe results above, not through
      // transport errors (the real controller would swallow a thrown CDP
      // error into the queue's sync-error path instead).
      return { result: {} };
    };
    try {
      const payload = {
        type: 'input', selector: '#q', tag: 'input', name: 'q', placeholder: '',
        value: 'hello', x: 1, y: 2, inputType: 'insertText',
        rx: 0.5, ry: 0.5, elementType: 'text', role: '', ariaLabel: '', text: '',
      };
      mode = 'ok';
      await controller.forward('tab-1', payload);
      const mirrorKey = 'slave-1:st1';
      record('E1 successful input forward installs an inputMirror entry',
        controller.inputMirror.has(mirrorKey) && controller.inputMirror.get(mirrorKey).value === 'hello');
      // Second forward on the same element: with the mirror holding 'hello',
      // the fast path probes with expectedHead 'hello' and inserts ' world'.
      // Switch to fail AFTER the fast-path probe would have passed, so the
      // fallback full resync also fails -> the !result.ok branch must run.
      mode = 'fail';
      const payload2 = { ...payload, value: 'hello world' };
      await controller.forward('tab-1', payload2);
      record('E2 failed resync drops the inputMirror entry', !controller.inputMirror.has(mirrorKey));
      record('E3 sync-input-skipped event is still emitted for the UI',
        events.some((event) => event.type === 'sync-input-skipped'));
    } finally {
      realCdp.call = origCall;
    }
  }

  // ---------- F. rpa-store sensitive step census ----------
  {
    const tmp = path.join(__dirname, 'ch7-wave3-tmp-store');
    require('fs').rmSync(tmp, { recursive: true, force: true });
    const store = new RpaStore(tmp);
    await store.ready;
    const upsert = await store.upsertTemplate({
      id: 'tpl-sensitive', name: '敏感模板', cat: '测试',
      // Deliberately flat: 'nested' container types are not executable, and
      // installTemplate must reject those, so the census is asserted on a
      // runnable plan shape (the recursion walk is covered by countSensitiveSteps
      // itself being depth-aware).
      steps: [
        { type: 'gotoUrl', url: 'https://example.test/' },
        { type: 'evaluate', expression: '1+1' },
        { type: 'javascript', expression: '2' },
        { type: 'getopenai', apiKeyVariable: 'k', prompt: 'p' },
        { type: 'downloadfile', url: 'https://example.test/a.pdf' },
      ],
    });
    assert.strictEqual(upsert.id, 'tpl-sensitive');
    const listed = store.listTemplates({ q: '敏感' });
    const tpl = listed.find((item) => item.id === 'tpl-sensitive');
    record('F1 listTemplates exposes sensitive_steps census',
      tpl && tpl.sensitive_steps && tpl.sensitive_steps.evaluate === 2 && tpl.sensitive_steps.openai === 1 && tpl.sensitive_steps.download === 1);
    record('F2 listTemplates exposes a human-readable sensitive_summary',
      tpl && tpl.sensitive_summary === 'evaluate×2、getOpenAI×1、downloadFile×1');
    const installed = await store.installTemplate('tpl-sensitive');
    record('F3 installTemplate response carries the census',
      installed.sensitive_steps && installed.sensitive_steps.evaluate === 2 && installed.sensitive_steps.openai === 1 && installed.sensitive_steps.download === 1);
    record('F4 installTemplate response carries the summary', installed.sensitive_summary === 'evaluate×2、getOpenAI×1、downloadFile×1');
    await store.upsertTemplate({ id: 'tpl-benign', name: '良性模板', cat: '测试', steps: [{ type: 'gotoUrl', url: 'https://example.test/' }] });
    const installedBenign = await store.installTemplate('tpl-benign');
    record('F5 benign template reports zero counts and empty summary',
      installedBenign.sensitive_steps && installedBenign.sensitive_steps.evaluate === 0 && installedBenign.sensitive_summary === '');
    // Recursion check on the helper itself: containers are not runnable in
    // installTemplate, but countSensitiveSteps must still walk them (listings
    // see stored templates whose process_content trees carry children/nodes).
    const deep = RpaStore.countSensitiveSteps([
      { type: 'outer', children: [{ type: 'evaluate', expression: '1' }, { type: 'inner', nodes: [{ type: 'getopenai', prompt: 'p' }] }] },
    ]);
    record('F6 countSensitiveSteps walks nested children/nodes trees',
      deep.evaluate === 1 && deep.openai === 1);
    await store.close?.();
    require('fs').rmSync(tmp, { recursive: true, force: true });
  }

  // ---------- G. findNetworkResource in-page filtering ----------
  {
    const engineSrc = read('automation/rpa-engine.js');
    record('G1 findNetworkResource no longer serializes the full entry list',
      !/getEntriesByType\("resource"\)\.map/.test(engineSrc));
    record('G2 findNetworkResource filters in-page with the embedded matcher',
      /all\.length - 1/.test(engineSrc) && engineSrc.includes('entry.name).includes(matcher)'));
    const rpa = new RpaEngine({ engine: { profiles: new Map(), running: new Map() }, store: null, emit: () => {} });
    let seenExpression = '';
    rpa.withPage = async (port, fn) => fn('ws-stub');
    const cdp = require('../../cdp');
    const origCall = cdp.call;
    cdp.call = async (url, method, params) => {
      if (method === 'Runtime.evaluate') {
        seenExpression = params.expression;
        if (seenExpression.includes('hit.test')) {
          return { result: { value: { name: 'https://hit.test/api?v=1', initiatorType: 'fetch' } } };
        }
        return { result: { value: null } };
      }
      return { result: {} };
    };
    try {
      const hit = await rpa.findNetworkResource(1, 'hit.test', 0);
      record('G3 matcher crosses the boundary inside the expression',
        seenExpression.includes('"hit.test"'));
      record('G4 hit is returned as-is', hit && hit.name === 'https://hit.test/api?v=1');
      const threw = await rpa.findNetworkResource(1, 'no-such', 0).then(() => null, (e) => e);
      record('G5 not-found still throws the original error text',
        threw && /network resource not found: no-such/.test(String(threw.message || threw)));
    } finally {
      cdp.call = origCall;
    }
  }

  const failed = results.filter((item) => !item.ok);
  console.log(failed.length
    ? `ch7-wave3-remediation-selftest: ${failed.length} FAILED / ${results.length}`
    : `ch7-wave3-remediation-selftest: ok (${results.length} checks)`);
}

main().catch((error) => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});

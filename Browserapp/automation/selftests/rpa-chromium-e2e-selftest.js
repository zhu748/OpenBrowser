'use strict';

// Real Chromium integration. Set OPENBROWSER_TEST_CHROMIUM_PATH to an installed
// Chromium executable; the aggregate kernel-free suite deliberately excludes it.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const cdp = require('../../cdp');
const { RpaEngine } = require('../rpa-engine');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function until(probe) {
  const deadline = Date.now() + 15000;
  let last;
  while (Date.now() < deadline) {
    try { const result = await probe(); if (result) return result; } catch (error) { last = error; }
    await sleep(50);
  }
  throw new Error('Chromium integration deadline exceeded', { cause: last });
}

async function main() {
  const binary = process.env.OPENBROWSER_TEST_CHROMIUM_PATH;
  assert.ok(binary, 'Set OPENBROWSER_TEST_CHROMIUM_PATH to a real Chromium executable');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-rpa-chromium-'));
  const hits = new Map();
  const server = http.createServer((req, res) => {
    hits.set(req.url, (hits.get(req.url) || 0) + 1);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><input id="text"><script>window.trusted=[];document.querySelector("input").addEventListener("input",e=>trusted.push(e.isTrusted));</script>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + dir, origin + '/original'];
  if (process.env.OPENBROWSER_TEST_NO_SANDBOX === '1') args.unshift('--no-sandbox');
  const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let diagnostic = '';
  child.stderr.on('data', (chunk) => { diagnostic = (diagnostic + chunk).slice(-4000); });
  child.on('error', (error) => { diagnostic += error.message; });
  let port;
  try {
    port = await until(async () => {
      const raw = await fs.readFile(path.join(dir, 'DevToolsActivePort'), 'utf8');
      return Number(raw.split('\n')[0]);
    });
    await until(async () => (await cdp.tabs(port)).length);
    await cdp.newTab(port, origin + '/second');
    const tabs = await cdp.tabs(port);
    assert.equal(tabs.length, 2);
    // Choose the non-first tab explicitly so a firstTab implementation cannot
    // pass accidentally through Chromium's new-tab ordering.
    const untouched = tabs[0];
    const selected = tabs[1];
    const rpa = new RpaEngine({ engine: {}, store: null, emit() {} });
    const ctx = { variables: {}, port, activeTabId: selected.id };
    const value = async (expression, tab = selected) => (await cdp.call(tab.webSocketDebuggerUrl,
      'Runtime.evaluate', { expression, returnByValue: true })).result?.value;
    await rpa.executeStep(port, { type: 'goto', url: origin + '/selected' }, ctx);
    await until(async () => (await value('location.href')) === origin + '/selected' && await value('document.readyState === "complete"'));
    assert.equal(await value('location.href', untouched), untouched.url, 'goto leaves the other tab untouched');
    const loads = hits.get('/selected');
    await rpa.executeStep(port, { type: 'reload' }, ctx);
    await until(() => hits.get('/selected') > loads);
    await until(() => value('document.readyState === "complete"'));
    await value('history.pushState({}, "", "/history-a"); history.pushState({}, "", "/history-b"); true');
    await rpa.executeStep(port, { type: 'goback', timeout: 1 }, ctx);
    await until(async () => (await value('location.pathname')) === '/history-a');
    assert.equal(await value('location.href', untouched), untouched.url, 'reload/back preserve the other tab');
    await rpa.executeStep(port, { type: 'typeText', selector: '#text', text: 'Hello 123', clear: true }, ctx);
    assert.equal(await value('document.querySelector("#text").value'), 'Hello 123');
    assert.equal(await value('trusted.length > 0 && trusted.every(Boolean)'), true, 'typing uses real trusted input');
    await rpa.executeStep(port, { type: 'evaluate', expression: 'document.querySelector("#text").value', variable: 'typed' }, ctx);
    assert.equal(ctx.variables.typed, 'Hello 123');
    console.log('RPA_CHROMIUM_E2E_SELFTEST OK (selected-tab navigation/reload/back, trusted typing, evaluation)');
  } catch (error) {
    console.error(diagnostic);
    throw error;
  } finally {
    if (port) {
      try { await cdp.call(await cdp.browserSocket(port), 'Browser.close', {}, 1500); } catch (_) {}
    }
    cdp.closeAllPooledSockets();
    if (child.exitCode === null) {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGTERM');
      await Promise.race([exited, sleep(1500)]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

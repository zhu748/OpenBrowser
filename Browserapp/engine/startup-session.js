'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const cdp = require('../cdp');
const { writeRawAtomically } = require('./state-storage');
const SESSION_FILE = 'OpenBrowserSession.json';

function startupNavigationUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('-') || /[\u0000-\u001f]/.test(raw)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    if (!/^(https?|file|about):/i.test(raw)) return null;
    try { return new URL(raw).href; } catch (_) { return null; }
  }
  if (!/\s/.test(raw) && /^(localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?(?:[/?#]|$)/i.test(raw)) {
    try { return new URL((/^localhost[:/?#]/i.test(raw) ? 'http://' : 'https://') + raw).href; } catch (_) { return null; }
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(raw);
}

function sessionUrls(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((url) => typeof url === 'string'
    && url.length <= 8192 && /^(https?:\/\/|file:\/\/|about:blank$)/i.test(url)))].slice(0, 100);
}

async function readDeferredSessionUrls(root) {
  try {
    const file = path.join(root, SESSION_FILE);
    if ((await fs.stat(file)).size > 1024 * 1024) return [];
    return sessionUrls(JSON.parse(await fs.readFile(file, 'utf8')).urls);
  } catch (_) { return []; }
}

async function preserveLegacySession(root, engine = 'chromium') {
  const candidates = engine === 'firefox'
    ? ['sessionstore.jsonlz4', 'sessionstore.json', 'sessionstore-backups']
    : ['Default/Sessions', 'Default/Current Session', 'Default/Current Tabs', 'Default/Last Session', 'Default/Last Tabs'];
  const available = [];
  for (const name of candidates) {
    try { const stat = await fs.lstat(path.join(root, name)); if (!stat.isSymbolicLink()) available.push(name); } catch (_) {}
  }
  if (!available.length) return null;
  const parent = path.join(root, 'OpenBrowserLegacySessions');
  const backup = path.join(parent, engine);
  try { await fs.access(path.join(backup, 'manifest.json')); return null; } catch (_) {}
  await fs.mkdir(parent, { recursive: true, mode: 0o700 });
  const temporary = await fs.mkdtemp(path.join(parent, `.${engine}-`));
  try {
    for (const name of available) {
      const destination = path.join(temporary, name);
      await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
      await fs.cp(path.join(root, name), destination, { recursive: true, dereference: false });
    }
    await fs.writeFile(path.join(temporary, 'manifest.json'), JSON.stringify({ version: 1, engine, files: available }), { mode: 0o600 });
    await fs.rename(temporary, backup);
    return backup;
  } finally { await fs.rm(temporary, { recursive: true, force: true }); }
}

async function saveDeferredSession(item, isInternalUrl = () => false) {
  if (!item?.root || !item.fingerprint || item.verificationBlocked) return;
  let urls = item.sessionUrls;
  try {
    if (item.engine === 'firefox' && item.bidiConnection && !item.bidiConnection.closed) {
      urls = (await item.bidiConnection.command('browsingContext.getTree', { maxDepth: 0 }, 2000)).contexts.map((context) => context.url);
    } else if (item.port) urls = (await cdp.tabs(item.port)).map((tab) => tab.url);
  } catch (_) {}
  if (!Array.isArray(urls)) return;
  await writeRawAtomically(path.join(item.root, SESSION_FILE), JSON.stringify({ version: 1, urls: sessionUrls(urls).filter((url) => !isInternalUrl(url)) }), 0o600);
}

async function openVerifiedStartupTabs(engine, item, urls) {
  const targets = [...new Set(urls.map(startupNavigationUrl).filter(Boolean))];
  if (!targets.length) return;
  await engine.keepDefaultTab(item.port, targets[0], { strict: true });
  for (const url of targets.slice(1)) {
    const target = await item.workerFingerprintConnection.command('Target.createTarget', { url: 'about:blank' });
    const deadline = Date.now() + 10000;
    while (!item.fpAppliedTargets?.has(target.targetId)) {
      if (item.cleanedUp || item.stopping || Date.now() >= deadline) throw new Error('新标签页指纹未就绪，已停止打开启动网址');
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const tab = (await cdp.tabs(item.port)).find((value) => value.id === target.targetId);
    if (!tab?.webSocketDebuggerUrl) throw new Error('新启动标签页已关闭');
    const navigation = await cdp.call(tab.webSocketDebuggerUrl, 'Page.navigate', { url });
    if (navigation?.errorText) throw new Error(navigation.errorText);
  }
}

module.exports = { SESSION_FILE, sessionUrls, startupNavigationUrl, readDeferredSessionUrls, preserveLegacySession, saveDeferredSession, openVerifiedStartupTabs };

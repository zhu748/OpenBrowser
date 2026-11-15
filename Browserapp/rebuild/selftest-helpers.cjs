"use strict";
const { setTimeout: delay } = require("node:timers/promises");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

// Each script can run from a fresh checkout without an earlier build creating
// work/rebuild. User data stays isolated from the developer's desktop profile.
async function createTestDirectory(prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openbrowser-" + prefix));
  const binary = process.env.OPENBROWSER_TEST_KERNEL_BINARY;
  if (binary) {
    // Explicit fixture only: UI tests must not race a first-run kernel download.
    // Use production validation; a system browser or an invalid binary fails.
    try {
      const { BrowserKernelManager } = require("../automation/browser-kernel");
      const manager = new BrowserKernelManager(root);
      manager.meta.autoUpdateKernel = false;
      await manager.setCustomBinary(binary);
    } catch (error) {
      await fs.rm(root, { recursive: true, force: true });
      throw error;
    }
  }
  return root;
}
async function waitUntil(
  predicate,
  { timeout = 30000, message = "状态未在期限内达到预期" } = {},
) {
  const deadline = Date.now() + timeout;
  do {
    const value = await predicate();
    if (value) return value;
    await delay(100);
  } while (Date.now() < deadline);
  throw Error(message);
}
async function toggleTheme(page) {
  const current=await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button',{name:'本地工作区菜单',exact:true}).click();
  await page.getByText('主题模式',{exact:true}).click();
  await page.getByText(current==='dark'?'浅色模式':'深色模式',{exact:true}).click();
  await page.keyboard.press('Escape');
}
async function openWorkspacePage(app, route) {
  const main = await app.firstWindow(), key = route.split('?')[0];
  let page = app.windows().find(candidate => new URL(candidate.url() || 'about:blank').searchParams.get('workspace') === key);
  const created = page ? null : app.waitForEvent('window');
  await main.evaluate(value => globalThis.__localRequest('ui:workspace:open', { route: value }), route);
  if (!page) page = await created;
  for (const event of ['pageerror', 'console', 'request'])
    for (const listener of main.listeners(event)) if (!page.listeners(event).includes(listener)) page.on(event, listener);
  const viewport = main.viewportSize();
  if (viewport) await page.setViewportSize(viewport);
  await page.waitForFunction(() => !!globalThis.__router && !!globalThis.__localRequest);
  return page;
}
module.exports = { waitUntil, toggleTheme, createTestDirectory, openWorkspacePage };

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { once } = require("node:events");
const { _electron: electron } = require("playwright");
const { createTestDirectory } = require("./selftest-helpers.cjs");

async function main() {
  const root = await createTestDirectory("maintenance-ui-");
  let app;
  let child;
  try {
    const env = { ...process.env, OPENBROWSER_USER_DATA: root,
      OPENBROWSER_API_PORT: "0", OPENBROWSER_MASTER_KEY_FILE: path.join(root, "master.key") };
    delete env.OPENBROWSER_ROXY_UI;
    app = await electron.launch({ executablePath: require("electron"),
      args: [...(process.platform === "linux" ? ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu"] : []), path.resolve(__dirname, "..")],
      env, timeout: 30000 });
    child = app.process();
    const page = await app.firstWindow();
    await page.waitForFunction(() => !!globalThis.__router && !!globalThis.__localRequest);
    const notifications = page.getByRole("button", { name: "通知", exact: true });
    const unreadBadge = notifications.locator("..").locator(".p-badge");
    await notifications.click();
    await page.getByText("暂无消息", { exact: true }).waitFor();
    assert.equal(await unreadBadge.isVisible(), false, "a fresh workspace has no unread badge");
    await page.keyboard.press("Escape");
    await page.evaluate(() => globalThis.__localActionTrack("ui_action"));
    await notifications.click();
    await page.getByText("暂无消息", { exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => globalThis.__localRequest("notifications:list")), []);
    await page.keyboard.press("Escape");

    const markup = '<img src="x" onerror="globalThis.__notificationInjected=true">';
    await page.evaluate(async message => {
      await globalThis.__localRequest("notifications:append", { title: "Maintenance notice", message });
    }, markup);
    await notifications.click();
    await page.getByText("Maintenance notice").waitFor();
    assert.ok((await page.locator("body").innerText()).includes(markup));
    assert.equal(await page.evaluate(() => globalThis.__notificationInjected), undefined);
    await page.getByRole("button", { name: "全部已读", exact: true }).click();
    await page.waitForFunction(async () => (await globalThis.__localRequest("notifications:list")).every(row => row.read));

    // Observe the real main-process failure boundary, including its final exit
    // status. Register before emitting: cleanup may finish before evaluate replies.
    const closed = once(child, "close", { signal: AbortSignal.timeout(25000) });
    await app.evaluate(() => { process.emit("uncaughtException", Error("maintenance fatal fixture")); })
      .catch(error => { assert.match(error.message, /closed|destroyed|disconnected/i); });
    const [code] = await closed;
    assert.equal(code, 1, "unexpected host failures exit with a failure status");
    console.log("MAINTENANCE_UI_SELFTEST OK (empty notification popover, local activity, escaped markup, read command, fatal shutdown exit 1)");
  } finally {
    if (child?.exitCode === null) await app.close();
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

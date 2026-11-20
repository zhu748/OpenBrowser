"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require("../network/bidi-connection");
const { runScriptWindow } = require("./agent-script-runner");

async function main() {
  const binary = process.env.OPENBROWSER_TEST_FIREFOX_BINARY;
  assert.ok(binary, "set OPENBROWSER_TEST_FIREFOX_BINARY to a Firefox executable");
  const data = await fs.mkdtemp(path.join(os.tmpdir(), "openbrowser-agent-firefox-test-"));
  const server = http.createServer((request, response) => {
    if (request.url === "/value") {
      response.setHeader("Content-Type", "application/json");
      response.end('{"value":"Firefox 浏览器"}');
    } else {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end('<title>Firefox local script</title><input aria-label="输入"><button>应用</button><output></output>' +
        '<script>document.querySelector("button").onclick=()=>document.querySelector("output").textContent=document.querySelector("input").value</script>');
    }
  });
  server.listen(0, "127.0.0.1");
  let child, ended, connection;
  try {
    await once(server, "listening");
    child = spawn(binary, ["--headless", "--no-remote", "--profile", data, "--remote-debugging-port", "0", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe"] });
    ended = once(child, "exit").catch(() => {});
    child.stdout.resume();
    connection = new BidiConnection(await waitForFirefoxEndpoint(child));
    await connection.open();
    await connection.command("session.new", { capabilities: { alwaysMatch: {} } });
    const { contexts: [tab] } = await connection.command("browsingContext.getTree");
    const engine = { running: new Map([["firefox-window", { engine: "firefox", bidiConnection: connection }]]) };
    const signal = new AbortController().signal;
    const base = "http://127.0.0.1:" + server.address().port;
    const result = await runScriptWindow(engine, {
      filename: "mozilla.ts", schema: {}, params: JSON.stringify({ base }), source: `
        import { firefox } from "playwright";
        import { browser as local } from "@openbrowser/sandbox";
        export async function main({ base }) {
          if (process.env.BROWSER_TYPE !== "firefox") throw Error("浏览器类型错误");
          const browser = await firefox.connect(process.env.BROWSER_URL);
          const page = browser.contexts()[0].pages()[0];
          await page.goto(base);
          const responseEvent = page.waitForResponse(response => response.url().endsWith("/value"));
          await page.evaluate(() => fetch("/value"));
          const { value } = await (await responseEvent).json();
          await page.getByLabel("输入").fill(value);
          await page.getByRole("button", { name: "应用" }).click();
          const result = await page.locator("output").textContent();
          if (!(await local.listTabs()).some(tab => tab.title === "Firefox local script")) throw Error("窗口标题错误");
          await browser.close();
          return result;
        }
      `,
    }, "firefox-window", signal, () => {}, 25000);
    assert.equal(JSON.parse(result), "Firefox 浏览器");
    assert.equal(await evaluateBidi(connection, { context: tab.context }, 'document.querySelector("output").textContent'),
      "Firefox 浏览器", "closing the script client must preserve the selected Firefox browser");
    assert.equal((await connection.command("browsingContext.getTree")).contexts.length, 1);
    const cancel = new AbortController();
    await assert.rejects(runScriptWindow(engine, {
      filename: "cancel.ts", schema: {}, params: "{}", source: `
        import { firefox } from "playwright";
        export async function main() {
          const browser = await firefox.connect(process.env.BROWSER_URL);
          console.log("armed");
          await browser.contexts()[0].pages()[0].getByRole("button", { name: "延迟" }).click();
        }
      `,
    }, "firefox-window", cancel.signal, line => {
      if (line === "armed") setTimeout(() => cancel.abort(Error("测试停止")), 100);
    }, 15000), /测试停止/);
    await evaluateBidi(connection, { context: tab.context }, `(() => {
      window.scriptClick = false;
      const button = document.createElement("button");
      button.textContent = "延迟";
      button.onclick = () => { window.scriptClick = true; };
      document.body.append(button);
    })()`);
    await delay(250);
    assert.equal(await evaluateBidi(connection, { context: tab.context }, "window.scriptClick"), false);
    console.log("SCRIPT FIREFOX OK (native BiDi, Playwright selectors and responses, short API, and cancel without closing or clicking)");
  } finally {
    connection?.close();
    if (child?.pid) child.kill();
    await ended;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

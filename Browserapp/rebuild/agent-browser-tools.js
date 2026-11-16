"use strict";

const BROWSER_TOOLS = Object.freeze(["list_tabs", "navigate", "read_page", "click", "fill"]);

function browserCapabilities(engine) {
  const supported = engine !== "firefox";
  return { browserTools: supported ? [...BROWSER_TOOLS] : [],
    reason: supported ? "" : "Agent 页面操作需要 Chromium CDP 会话" };
}

async function operate(browser, name, p, signal) {
  signal?.throwIfAborted();
  const pages = browser.contexts().flatMap(context => context.pages());
  if (name === "list_tabs")
    return Promise.all(pages.map(async page => ({ url: page.url(), title: await page.title() })));
  const page = pages[0];
  if (!page) throw Error("浏览器中没有标签页");
  if (name === "navigate") {
    const url = new URL(p.url);
    if (!["http:", "https:", "about:"].includes(url.protocol)) throw Error("不支持的页面协议");
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    return { url: page.url() };
  }
  if (name === "read_page") return {
    url: page.url(), title: await page.title(), text: (await page.locator("body").innerText()).slice(0, 16000),
  };
  if (name === "click") await page.locator(p.selector).click({ timeout: 10000 });
  if (name === "fill") await page.locator(p.selector).fill(String(p.value), { timeout: 10000 });
  return { ok: true, url: page.url() };
}

async function browserTool(engine, name, p, run) {
  const signal = run?.abort?.signal;
  signal?.throwIfAborted();
  const running = engine.running.get(String(p.id));
  if (!running?.port || !browserCapabilities(running.engine).browserTools.includes(name))
    throw Object.assign(Error("此工具需要已启动的 Chrome CDP 会话"), { code: "AGENT_BROWSER_UNSUPPORTED" });
  const { chromium } = require("playwright");
  let browser, closing;
  const disconnect = () => {
    // Closing this CDP client cancels its Playwright auto-waits without
    // closing the user's browser or page. Merely racing a promise would
    // leave a delayed click/fill alive after the task had reported cancelled.
    if (browser && !closing) closing = browser.close();
    closing?.catch(() => {});
  };
  signal?.addEventListener("abort", disconnect, { once: true });
  try {
    browser = await chromium.connectOverCDP("http://127.0.0.1:" + running.port, { timeout: 5000 });
    signal?.throwIfAborted();
    const result = await operate(browser, name, p, signal);
    signal?.throwIfAborted();
    return result;
  } catch (error) {
    signal?.throwIfAborted();
    throw error;
  } finally {
    signal?.removeEventListener("abort", disconnect);
    disconnect();
    await closing;
  }
}

module.exports = { BROWSER_TOOLS, browserCapabilities, browserTool };

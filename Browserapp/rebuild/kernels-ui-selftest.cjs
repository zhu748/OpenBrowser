"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data =
      process.env.OPENBROWSER_KERNEL_TEST_DATA ||
      (await createTestDirectory('kernel-ui-')),
    evidence = evidenceDirectory(),
    result = {
      passed: false,
      errors: [],
      externalRequests: [],
      checks: [],
      data,
    };
  let app, page;
  try {
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        path.join(repo, "Browserapp"),
      ],
      env: {
        ...process.env,
        OPENBROWSER_USER_DATA: data,
        OPENBROWSER_HEADLESS: "1",
      },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (e) => result.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push(m.text());
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push(r.url());
    });
    await page.getByText("窗口管理", { exact: true }).first().waitFor();
    await page.evaluate(() => globalThis.__router.push("/kernels"));
    await page.getByText("内核管理", { exact: true }).last().waitFor();
    const find = page.getByRole("button", { name: "获取可下载版本", exact: true });
    const versionSelect = page.getByLabel("内核版本", { exact: true });
    const showHistorical = page.getByRole("button", { name: /^显示历史版本/ });
    const install = page.getByRole("button", { name: "安装所选版本", exact: true });
    await find.click();
    await showHistorical.waitFor({ timeout: 60000 });
    const recent = await versionSelect.locator("option").evaluateAll(options => options.map(option => option.value));
    assert.equal(recent.length, 15);
    await showHistorical.click();
    const olderOptions = versionSelect.locator('optgroup[label="历史版本"] option');
    const historical = await olderOptions.evaluateAll(options => options.map(option => option.value));
    assert.ok(historical.length > 0);
    assert.equal(new Set([...recent, ...historical].map(version => version.split(".")[0])).size,
      recent.length + historical.length);
    assert.ok(Number(historical[0].split(".")[0]) < Number(recent.at(-1).split(".")[0]));
    result.chromiumVersion = historical[0];
    await versionSelect.selectOption(result.chromiumVersion);
    await page.getByRole("button", { name: "收起历史版本", exact: true }).click();
    assert.equal(await versionSelect.inputValue(), recent[0]);
    assert.equal(await olderOptions.count(), 0);
    await showHistorical.click();
    await versionSelect.selectOption(result.chromiumVersion);
    await install.click();
    await waitUntil(
      () => page.evaluate(async (version) => {
        const rows = await globalThis.__localRequest("kernels:list");
        return rows.some(row => row.engine === "chromium" && row.version === version);
      }, result.chromiumVersion),
      { timeout: 300000 },
    );
    const checked = await page.evaluate(version => globalThis.ops.kernelCheck("chromium", version), result.chromiumVersion);
    assert.equal(checked.version, result.chromiumVersion);
    result.checks.push("展开 Chrome 历史版本并从官方目录下载、安装和检测旧内核");

    const chromiumProfile = await page.evaluate(async (version) => {
      const request = globalThis.__localRequest;
      const options = {
        coreType: "Chrome", coreVersion: version, os: "Linux",
        startupParam: "--headless", sandboxPermission: true, defaultOpenUrl: ["about:blank"],
        isDisplayLanguageBaseIp: false, isTimeZone: false, isPositionBaseIp: false,
      };
      const [draft] = await request("fingerprint:preview", {
        ...options, randomizeUaVersion: true, previousUserAgent: `Chrome/${version}`,
      });
      return request("profiles:create", {
        ...options, windowName: "Chrome 历史版本启动", userAgent: draft.userAgent, _fingerprintDraft: draft._fingerprintDraft,
      });
    }, result.chromiumVersion);
    const major = result.chromiumVersion.split(".")[0];
    assert.match(chromiumProfile.userAgent, new RegExp(`Chrome/${major}\\.`));
    const published = require("../automation/data/chrome-release-versions.json").versions.linux[major];
    if (published?.length > 1) {
      assert.ok(published.some(version => chromiumProfile.userAgent.includes(`Chrome/${version} `)));
      assert.ok(!chromiumProfile.userAgent.includes(`Chrome/${result.chromiumVersion} `));
    }
    try {
      await page.evaluate(id => globalThis.__localRequest("profiles:start", { id }), chromiumProfile.id);
      const running = await waitUntil(() => page.evaluate(id => globalThis.ops.profileStatus()
        .then(rows => rows.find(row => row.id === id && row.running)), chromiumProfile.id));
      assert.equal(running.executable, checked.path);
      assert.equal(running.userAgent, chromiumProfile.userAgent);
    } finally {
      await page.evaluate(id => globalThis.__localRequest("profiles:stop", { id }), chromiumProfile.id);
    }
    result.checks.push("用已安装的 Chrome 历史版本启动窗口并复用随机 UA");

    await page.getByLabel("内核类型", { exact: true }).selectOption("firefox");
    assert.equal(await showHistorical.count(), 0);
    assert.equal(await olderOptions.count(), 0);
    await find.click();
    await waitUntil(
      async () =>
        (await page
          .getByLabel("内核版本", { exact: true })
          .locator("option")
          .count()) > 0,
      { timeout: 60000 },
    );
    result.version = await page
      .getByLabel("内核版本", { exact: true })
      .inputValue();
    assert.match(result.version, /^\d/);
    console.log("Firefox catalog:", result.version);
    result.checks.push("真实原后端读取 Mozilla 可安装版本目录");
    await install.click();
    await waitUntil(
      async () => {
        const rows = await page.evaluate(() =>
          globalThis.__localRequest("kernels:list"),
        );
        return rows.some(
          (k) => k.engine === "firefox" && k.version === result.version,
        );
      },
      { timeout: 300000 },
    );
    result.checks.push("通过新内核页下载并由原后端校验、安装 Firefox");
    await page.screenshot({
      path: path.join(evidence, "kernels-firefox-installed.png"),
    });
    const row = await page.evaluate(
      (version) =>
        globalThis.__localRequest("profiles:create", {
          windowName: "Firefox 真实启动",
          coreType: "Firefox",
          coreVersion: version,
          os: "Linux",
          startupParam: "--headless",
          defaultOpenUrl: ["about:blank"],
          isDisplayLanguageBaseIp: false,
          isTimeZone: false,
          isPositionBaseIp: false,
        }),
      result.version,
    );
    result.profileId = row.id;
    console.log("Starting Firefox profile:", row.id);
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:start", { id }),
      row.id,
    );
    await waitUntil(
      () =>
        page.evaluate(
          (id) =>
            globalThis
              .__localRequest("profiles:list")
              .then((rows) =>
                rows.some((row) => row.id === id && row.openStatus),
              ),
          row.id,
        ),
      { timeout: 60000 },
    );
    const status = await page.evaluate(() => globalThis.ops.profileStatus());
    result.running = status.find((v) => v.id === row.id);
    assert.ok(result.running?.running);
    assert.ok(result.running.pid > 0);
    result.checks.push(
      "新 UI IPC 到原 BrowserEngine，真实 Firefox 子进程已启动",
    );
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:stop", { id }),
      row.id,
    );
    await waitUntil(() =>
      page.evaluate(
        (id) =>
          globalThis
            .__localRequest("profiles:list")
            .then((rows) =>
              rows.every((row) => row.id !== id || !row.openStatus),
            ),
        row.id,
      ),
    );
    result.checks.push("真实 Firefox 子进程停止");
    assert.deepEqual(result.externalRequests, []);
    assert.deepEqual(result.errors, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      result.hitTest = await page.evaluate(() =>
        [...document.querySelectorAll("button")].map((el) => {
          const r = el.getBoundingClientRect(),
            style = getComputedStyle(el);
          return {
            text: el.innerText,
            rect: r.toJSON(),
            pointer: style.pointerEvents,
            hit: document
              .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
              ?.outerHTML.slice(0, 500),
          };
        }),
      );
      await page.screenshot({
        path: path.join(evidence, "kernels-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "kernels-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

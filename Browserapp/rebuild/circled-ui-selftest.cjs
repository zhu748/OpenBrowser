"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil, toggleTheme } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/circled-ui-")),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = { passed: false, errors: [], externalRequests: [], checks: [] };
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
      env: { ...process.env, OPENBROWSER_USER_DATA: data },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1536, height: 960 });
    page.on("pageerror", (e) => result.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push(m.text());
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push(r.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const windowMenu = page.locator(".menu_browser .menu-item");
    assert.ok(
      await windowMenu.evaluate((el) => el.classList.contains("active")),
    );
    await page.locator("#NEW_PROFILE").click();
    await waitUntil(() =>
      page.evaluate(
        () => globalThis.__router.currentRoute.value.name === "browser-create",
      ),
    );
    assert.ok(
      await windowMenu.evaluate((el) => el.classList.contains("active")),
    );
    await windowMenu.click();
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    result.checks.push(
      "窗口列表及创建页保留原侧栏 active 状态，真实点击返回列表",
    );
    await page.evaluate(() =>
      globalThis.__localRequest("profiles:create-batch", {
        windowNamePrefix: "截图验收",
        createCount: 21,
        coreType: "Chrome",
        os: "Windows",
      }),
    );
    await page.getByText("截图验收 1", { exact: true }).waitFor();
    await page.getByText("默认项目", { exact: true }).first().waitFor();
    await waitUntil(() =>
      page
        .getByTestId("local-usage")
        .innerText()
        .then((t) => t.includes("21 / ∞")),
    );
    for (const label of [
      "全部窗口",
      "收藏",
      "已打开",
      "转移中",
      "回收站",
      "AI & 自动化",
      "窗口同步",
      "AI Agent",
      "模板商城",
      "任务管理",
      "我的模板",
    ])
      assert.ok(
        (await page.getByText(label, { exact: true }).count()) > 0,
        label,
      );
    for (const label of ["刷新网络定位", "更新", "通知", "刷新界面"])
      await page.getByRole("button", { name: label, exact: true }).waitFor();
    result.checks.push(
      "截图圈出的 5 个标签、AI 分组与 5 个入口、顶部定位/更新/通知/刷新、底部不限量卡片均存在",
    );
    await page.getByRole("button", { name: "更新", exact: true }).click();
    await page.getByText("客户端升级", { exact: true }).waitFor();
    await page.getByText("内核升级", { exact: true }).first().waitFor();
    await page.screenshot({ path: path.join(evidence, "circled-updates.png") });
    await page.keyboard.press("Escape");
    await page.evaluate(() =>
      globalThis.__localRequest("activity:append", {
        action: "circled_ui_verification",
      }),
    );
    await page.getByRole("button", { name: "通知", exact: true }).click();
    await page.getByText("circled_ui_verification", { exact: true }).waitFor();
    await page.getByRole("button", { name: "全部已读", exact: true }).click();
    assert.ok(
      (
        await page.evaluate(() =>
          globalThis.__localRequest("notifications:list"),
        )
      ).every((row) => row.read),
    );
    await page.screenshot({
      path: path.join(evidence, "circled-notifications.png"),
    });
    await page.keyboard.press("Escape");
    result.checks.push(
      "更新弹层显示真实已安装内核；本地通知弹层与全部已读真实持久化",
    );
    await page
      .getByRole("button", { name: "AI & 自动化", exact: true })
      .click();
    await waitUntil(() =>
      page
        .locator(".sub-menu-wrap.collapsible.folded > .sub-menu-clip")
        .evaluateAll((elements) =>
          elements.some(
            (el) =>
              getComputedStyle(el).opacity === "0" &&
              el.getBoundingClientRect().height < 1,
          ),
        ),
    );

    await page
      .getByRole("button", { name: "AI & 自动化", exact: true })
      .click();
    await page.getByText("窗口同步", { exact: true }).waitFor();
    const paginator = page.locator(".p-paginator");
    await paginator.locator(".p-paginator-next").click();
    await page.getByText("截图验收 11", { exact: true }).waitFor();
    await paginator.locator("input").fill("3");
    await paginator.locator("input").press("Enter");
    await page.getByText("截图验收 21", { exact: true }).waitFor();
    assert.equal(await page.locator(".p-datatable-tbody > tr").count(), 1);
    await paginator
      .locator(".p-paginator-first")
      .count()
      .then(async (count) => {
        if (count) await paginator.locator(".p-paginator-first").click();
        else {
          await paginator.locator("input").fill("1");
          await paginator.locator("input").press("Enter");
        }
      });
    await page.getByText("截图验收 1", { exact: true }).waitFor();
    result.checks.push(
      "真实 21 条窗口：下一页到 11、跳转第三页仅剩 21、返回第一页；不是静态分页",
    );
    const search = page.getByPlaceholder("搜索 Ctrl + F");
    await search.fill("截图验收 21");
    await search.press("Enter");
    await waitUntil(() =>
      page
        .locator("body")
        .innerText()
        .then((text) => text.includes("总计 1 个")),
    );
    await page.getByText("截图验收 21", { exact: true }).waitFor();
    await search.fill("");
    await search.press("Enter");
    await waitUntil(() =>
      page
        .locator("body")
        .innerText()
        .then((text) => text.includes("总计 21 个")),
    );
    result.checks.push("列表搜索改变真实后端查询结果，清空恢复 21 条");
    await page.waitForTimeout(450);
    result.rowState = await page
      .locator(".p-datatable-tbody > tr")
      .first()
      .evaluate((el) => ({
        opacity: getComputedStyle(el).opacity,
        buttons: [...el.querySelectorAll("button")].map((button) => ({
          label: button.innerText,
          disabled: button.disabled,
        })),
      }));
    assert.equal(
      result.rowState.opacity,
      "1",
      "同步专用 CSS 不能让普通窗口行变淡",
    );
    await page.screenshot({
      path: path.join(evidence, "circled-workbench-light.png"),
    });
    await toggleTheme(page);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(evidence, "circled-workbench-dark.png"),
    });
    await toggleTheme(page);
    result.body = await page.locator("body").innerText();
    result.buttons = await page.getByRole("button").evaluateAll((els) =>
      els.map((e) => ({
        text: e.innerText,
        label: e.getAttribute("aria-label"),
        title: e.title,
      })),
    );
    result.checks.push("原分组折叠/展开、浅色/深色切换与真实截图");
    for (const [label, route] of [
      ["窗口同步", "/synchronizer"],
      ["模板商城", "/agent-console/template-store"],
      ["任务管理", "/agent-console/task-manager"],
      ["我的模板", "/agent-console/templates"],
    ]) {
      await page.locator(".rx-side").getByText(label, { exact: true }).click();
      await waitUntil(() =>
        page.evaluate(
          (route) => globalThis.__router.currentRoute.value.path === route,
          route,
        ),
      );
      await page.waitForTimeout(400);
      assert.ok((await page.locator("body").innerText()).trim().length > 10);
      await page.screenshot({
        path: path.join(
          evidence,
          "circled-route-" + route.replaceAll("/", "-") + ".png",
        ),
      });
      await page.evaluate(() => globalThis.__router.push("/browser/list"));
      await page.getByText("全部窗口", { exact: true }).waitFor();
    }
    result.checks.push(
      "侧栏窗口同步、模板商城、任务管理、我的模板均由真实点击进入对应原组件路由",
    );
    await page
      .getByTestId("local-usage")
      .getByRole("button", { name: "内核升级", exact: true })
      .click();
    await page.getByLabel("内核类型", { exact: true }).waitFor();
    result.checks.push("不限量卡片按钮进入真实本地内核管理");
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "circled-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "circled-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

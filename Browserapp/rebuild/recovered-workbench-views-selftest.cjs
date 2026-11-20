"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { createTestDirectory, openWorkspacePage, waitUntil } = require("./selftest-helpers.cjs");
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");
const { launchVisualApp, captureStableScreenshot } = require("./source-visual-selftest-helpers.cjs");
const { installReference, readReferenceRequests, readSourceRequests, switchReferenceMode, disableReferenceCache } = require("./workbench-reference-selftest-helpers.cjs");

const appRoot = path.resolve(__dirname, "..");
const comparator = path.join(__dirname, "visual-pixel-diff.py");
const families = {
  sync: {
    assets: [
      "synchronizer-mUJbzl7S.js", "window-list-C-MAmr_C.js", "action-bar-50RAQCsf.js",
      "preferences--734d_2_.js", "custom-layout-C32t9VHy.js", "batch-inputs-B_HNTlr8.js",
      "open-sites-BUgaXFNX.js", "syncing-window-list-g5VmUz_T.js",
    ],
    capture: captureSync,
    requiredReference: ["synchronizer-mUJbzl7S.js", "action-bar-50RAQCsf.js"],
  },
  projects: {
    assets: ["projects-CN6_vL2j.js", "project-item-Dd4vT7Wq.js", "renewal-reminder-drawer-C9_4HaAB.js",
      "rx-form-A3sc3aGh.js", "ry-table-do6kugym.js", "useAsyncGate-D7VA7DLY.js"],
    capture: captureProjects,
    requiredReference: ["ry-table-do6kugym.js"],
  },
  api: {
    assets: ["api-keys-qLZdcspG.js"],
    capture: captureApi,
    requiredReference: ["api-keys-qLZdcspG.js"],
  },
  account: {
    assets: ["list-CkXy4JN3.js", "create-QG0MnZuH.js", "parse-textarea-Dia3ayaD.js", "table-BJcS2I0Z.js"],
    capture: captureAccount,
    requiredReference: ["table-BJcS2I0Z.js"],
  },
  profile: {
    assets: ["edit-IaDdchpD.js", "list-ByevuXQD.js", "create-HSjma60V.js", "renewal-reminder-drawer-C9_4HaAB.js",
      "useAsyncGate-D7VA7DLY.js", "createDefaultAccordions-CO1KkbkO.js", "mate-group-CBm6kY0g.js",
      "form-inputs-CnnG6T0O.js", "useWindowCreateCore-01alf0RN.js", "usePopupMenu-BRw1zJ0m.js", "profile-info-ExiJC1su.js",
      "choose-panel-CC3iR_nA.js", "operationHandlers-Db52Gyo7.js", "useProxyFormDrawer-r-7UykRS.js",
      "single-proxies-C7CAMkyq.js", "ry-table-do6kugym.js"],
    capture: captureProfile,
    requiredReference: ["ry-table-do6kugym.js"],
  },
  proxy: {
    assets: ["agent-CYnwl_KT.js", "shop-v2DtsxR2.js", "single-proxies-C7CAMkyq.js", "batch-proxies-wPSH-NmI.js",
      "utils-BIWenCnY.js", "hook-CnJE4hRq.js"],
    capture: captureProxy,
    requiredReference: ["shop-v2DtsxR2.js", "single-proxies-C7CAMkyq.js"],
  },
  mcp: {
    assets: ["AgentSettingsRoute-BB9ba93X.js"],
    capture: captureMcp,
    requiredReference: ["AgentSettingsRoute-BB9ba93X.js"],
  },
  agent: {
    assets: ["MyTemplatesRoute-Eq3HlS6M.js", "TemplateStoreRoute-vzcUC0bD.js", "TaskManagerRoute-iC4ANt4w.js", "CreateTemplateDialog-Bpq9OLTG.js",
      "ScriptSchemaForm-z_48GvPJ.js", "useTemplateTaskExecution-yGKXS9Rw.js", "workbench-code-editor.js"],
    capture: captureAgent,
    requiredReference: ["TaskManagerRoute-iC4ANt4w.js", "useTemplateTaskExecution-yGKXS9Rw.js"],
  },
  chat: {
    assets: ["hook-CnJE4hRq.js", "CreateTemplateDialog-Bpq9OLTG.js", "AgentConsolePageLayout-CwKh-Fcw.js",
      "ScriptSchemaForm-z_48GvPJ.js"],
    capture: captureChat,
  },
  chrome: {
    assets: ["identity-verification-entry-B8EzLOCj.js", "major-client-purchase-success-D9bdaQmg.js"],
    requiredReference: ["identity-verification-entry-B8EzLOCj.js"],
    capture: captureChrome,
  },
};

async function themePage(page, theme) {
  await page.evaluate(async theme => {
    const { n: useTheme } = await import("/assets/theme-mq6SsndU.js");
    useTheme().setTheme(theme);
    await document.fonts.ready;
  }, theme);
  await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
}

async function enter(page, route, theme, mode) {
  await page.goto("obui://app/index.html?visual=" + mode + "-" + theme + "#/browser/list");
  await page.waitForFunction(() => globalThis.__router?.currentRoute.value.path === "/browser/list");
  if (route !== "/browser/list") await page.evaluate(route => globalThis.__router.push(route), route);
  await page.waitForFunction(route => globalThis.__router?.currentRoute.value.fullPath === route, route).catch(async error => {
    const state = await page.evaluate(() => ({ href: location.href, route: globalThis.__router?.currentRoute.value.fullPath }));
    throw Error("Cannot enter " + route + " " + JSON.stringify(state), { cause: error });
  });
  await themePage(page, theme);
}

async function captureChrome(_app, page, theme, mode, shot) {
  await enter(page, "/browser/list", theme, mode);
  const group = page.getByRole("button", { name: "AI & 自动化", exact: true });
  const links = page.locator(".sub-menu-wrap.level-0").first();
  await links.waitFor();
  await shot(page, "sidebar", links);
  await group.click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".sub-menu-wrap.folded > .sub-menu-clip"))
    .some(clip => clip.getBoundingClientRect().height < 1));
  await page.mouse.move(1, 1);
  await shot(page, "sidebar-folded", links);
  await group.click();

  const update = page.getByRole("button", { name: "更新", exact: true });
  await update.click();
  const updateTabs = page.locator("._content_15zc5_1");
  const kernelTab = updateTabs.getByRole("tab", { name: "内核升级", exact: true });
  await kernelTab.waitFor();
  await page.waitForFunction(() => {
    const panel = document.querySelector("._content_15zc5_1");
    const bar = panel?.querySelector('[data-pc-section="activebar"]');
    if (!bar?.style.width || !bar.style.left) return false;
    const actual = getComputedStyle(bar);
    return Math.abs(parseFloat(actual.width) - parseFloat(bar.style.width)) < 0.05 &&
      Math.abs(parseFloat(actual.left) - parseFloat(bar.style.left)) < 0.05;
  }, undefined, { timeout: 5000 });
  await page.mouse.move(1, 1);
  await shot(page, "kernel-updates", updateTabs);
  await updateTabs.getByRole("tab", { name: "客户端升级", exact: true }).click();
  await page.mouse.move(1, 1);
  await shot(page, "client-updates", updateTabs);
  await page.keyboard.press("Escape");
  await updateTabs.waitFor({ state: "hidden" });

  await page.getByRole("button", { name: "通知", exact: true }).click();
  const notices = page.locator(".p-popover").filter({ hasText: "本地验收通知" });
  await notices.waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "notifications", notices);
  await page.keyboard.press("Escape");
  await notices.waitFor({ state: "hidden" });
}

function localRequest(page, method, payload) {
  return page.evaluate(({ method, payload }) => globalThis.__localRequest(method, payload), { method, payload });
}

async function nativeDialog(app, page, kind, tab, theme) {
  const [dialog] = await Promise.all([
    app.waitForEvent("window"),
    localRequest(page, "ui:dialog:open", { kind, tab }),
  ]);
  await dialog.locator(".p-dialog").waitFor();
  if (tab) await dialog.locator('.p-tab[aria-selected="true"]').waitFor();
  const window = await app.browserWindow(dialog);
  await dialog.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));
  const bounds = await window.evaluate(native => native.getContentBounds());
  await window.dispose();
  await dialog.setViewportSize({ width: bounds.width, height: bounds.height });
  await themePage(dialog, theme);
  await dialog.mouse.move(1, 1);
  return dialog;
}

async function captureSync(app, page, theme, mode, shot) {
  await enter(page, "/synchronizer", theme, mode);
  await shot(page, "choose-windows", page.locator(".synchronizer"));
  await enter(page, "/synchronizer/active", theme, mode);
  const actionBar = page.locator(".action-bar");
  await actionBar.hover();
  await page.getByText("停止同步", { exact: true }).waitFor();
  for (const [time, label, dots] of [[0, "action-bar", '"."'], [1100, "action-bar-animation", '"..."']]) {
    const content = await actionBar.evaluate(async (bar, position) => {
      const animation = bar.getAnimations({ subtree: true }).find(item => item.animationName?.startsWith("loadingDots-"));
      animation.pause();
      animation.currentTime = position;
      await animation.ready;
      return getComputedStyle(bar.querySelector(".dots"), "::after").content;
    }, time);
    assert.equal(content, dots);
    await shot(page, label, actionBar);
  }
  await enter(page, "/browser/list", theme, mode);
  const sections = [
    ["preferences", "base", ".base-settings"],
    ["preferences", "customLayout", ".custom-layout input"],
    ["preferences", "simulate", ".simulate-settings"],
    ["preferences", "shortcutKey", ".keyboard-shortcut input"],
    ["batch-inputs", "same", "textarea"],
    ["batch-inputs", "diff", ".footer"],
    ["batch-inputs", "random", "input"],
    ["open-sites", undefined, "textarea"],
    ["syncing-window-list", undefined, ".p-dialog-header"],
  ];
  for (const [kind, tab, selector] of sections) {
    const dialog = await nativeDialog(app, page, kind, tab, theme);
    await dialog.locator(selector + ":visible").first().waitFor();
    if (tab === "simulate") await dialog.getByRole("switch").first().check();
    if (tab === "shortcutKey") await dialog.evaluate(() => new Promise(resolve => setTimeout(resolve, 250)));
    await shot(dialog, tab ? kind + "-" + tab : kind, dialog.locator(".p-dialog"));
    await Promise.all([dialog.waitForEvent("close"), dialog.locator(".p-dialog-close-button").click()]);
  }
}

async function captureProjects(_app, page, theme, mode, shot) {
  await enter(page, "/projects/list", theme, mode);
  await page.getByText("源码对照项目", { exact: true }).first().waitFor();
  await shot(page, "project-list", page.locator(".rx-main-content"));
  await page.getByRole("button", { name: "创建项目", exact: true }).click();
  const modal = page.locator(".p-dialog").last();
  await modal.waitFor();
  await shot(page, "new-project", modal);
  await modal.locator(".cursor-pointer").first().click();
  await modal.waitFor({ state: "hidden" });
  await page.getByRole("row").filter({ hasText: "源码对照项目" })
    .getByRole("button", { name: "查看详情" }).click();
  await page.locator(".subproject").getByText("源码对照项目", { exact: true }).waitFor();
  await page.getByText("暂无窗口", { exact: true }).waitFor();
  await shot(page, "project-windows", page.locator(".rx-main-content"));
  const fixture = page.locator("#visual-shared-schema-form");
  await page.evaluate(async () => {
    const { r: createApp } = await import("/assets/runtime-dom.esm-bundler-_WxS4Zar.js");
    const { h } = await import("/assets/workbench-vue.js");
    const { n: SchemaForm } = await import("/assets/rx-form-A3sc3aGh.js");
    const host = document.createElement("div");
    host.id = "visual-shared-schema-form";
    host.style.cssText = "position:fixed; top:70px; right:32px; z-index:10; width:440px; padding:18px; background:var(--colors-background-bg-mode)";
    document.querySelector(".rx-main-content").append(host);
    const schemas = [
      { field: "name", label: "项目名称", defaultValue: "验收项目", component: "InputText",
        rule: { validator: zod => zod.string().min(2, "项目名称至少两个字") } },
      { field: "note", label: "备注", component: "Textarea", componentProps: { rows: 3, placeholder: "请输入备注" } },
    ];
    const app = createApp({
      render: () => h(SchemaForm, { schemas, onSubmit: data => { host.dataset.saved = data.name; } }),
    });
    const active = document.querySelector("#app").__vue_app__;
    for (const key of ["config", "provides", "components", "directives"]) app._context[key] = active._context[key];
    app.mount(host);
  });
  await fixture.getByRole("button", { name: "Submit", exact: true }).waitFor().catch(async error => {
    throw Error("Schema form fixture " + mode + ": " + await fixture.evaluate(element => element.innerText), { cause: error });
  });
  await page.mouse.move(1, 1);
  await shot(page, "shared-schema-form", fixture);
  if (mode === "source") {
    const name = fixture.getByLabel("项目名称", { exact: false });
    await name.fill("A");
    await fixture.getByRole("button", { name: "Submit", exact: true }).click();
    await fixture.getByText("项目名称至少两个字", { exact: true }).waitFor();
    assert.equal(await fixture.getAttribute("data-saved"), null);
    await name.fill("复审项目");
    await fixture.getByRole("button", { name: "Submit", exact: true }).click();
    assert.equal(await fixture.getAttribute("data-saved"), "复审项目");
  }
}

async function captureApi(app, _main, theme, mode, shot) {
  const page = await openWorkspacePage(app, "/api-keys");
  await disableReferenceCache(page);
  const url = new URL(page.url());
  url.searchParams.set("visual", mode + "-" + theme);
  await page.goto(url.href);
  await page.locator(".api-content-key-value").waitFor();
  await themePage(page, theme);
  await page.locator(".cm-content").filter({ hasText: "mcpServers" }).first().waitFor();
  await shot(page, "settings", page.locator(".rx-main-content"));
  await page.getByRole("button", { name: "API 文档", exact: true }).click();
  const modal = page.locator(".p-dialog").last();
  await modal.locator("pre").waitFor();
  await shot(page, "local-reference", modal);
  await page.keyboard.press("Escape");
  await modal.waitFor({ state: "hidden" });
  const body = page.locator(".api-body");
  await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await page.getByRole("tab", { name: "OpenCode" }).click();
  await page.getByText("更新您的 ~/.config/opencode/opencode.json", { exact: true }).waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "opencode", page.locator(".rx-main-content"));
}

async function captureAccount(_app, page, theme, mode, shot) {
  await enter(page, "/account/list", theme, mode);
  await page.getByRole("row").filter({ hasText: "source-check@example.test" }).waitFor();
  await shot(page, "account-list", page.locator(".rx-main-content"));
  await page.getByRole("row").filter({ hasText: "source-check@example.test" }).getByRole("checkbox").check();
  await page.getByRole("button", { name: "导出数据", exact: true }).click();
  const exportDialog = page.locator(".export-accounts");
  await exportDialog.waitFor();
  await shot(page, "account-export", page.locator(".p-dialog").last());
  await exportDialog.getByRole("button", { name: "取消", exact: true }).click();
  await exportDialog.waitFor({ state: "hidden" });
  await enter(page, "/account/create", theme, mode);
  for (const [tab, name, visible] of [
    ["单个添加", "add-single", "input:visible"],
    ["批量添加", "add-batch", "textarea:visible"],
    ["模板导入", "add-file", ".upload-card:visible"],
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const view = page.locator(".rx-main-content");
    await view.locator(visible).first().waitFor();
    await page.mouse.move(1, 1);
    await shot(page, name, view);
    if (name === "add-batch") {
      await view.locator(".textarea-content").fill("https://sample.example.test/\nhttps://another.example.test/");
      assert.equal(await view.locator(".textarea-line").inputValue(), "01\n02\n");
      await view.locator(".textarea-content").blur();
      await shot(page, "add-batch-numbered", view);
    }
  }
}

async function showProfileProxyMenu(page, profile) {
  const row = page.getByRole("row").filter({ hasText: profile.windowName });
  await row.locator(".state").first().hover();
  await row.locator(".state-icons").nth(1).click();
  const menu = page.locator("._root_7j351_1:visible");
  await menu.getByText("添加代理 IP", { exact: true }).waitFor();
  return menu;
}

async function showProfileAction(page, profile, label) {
  await page.getByText(profile.windowName, { exact: true }).first().click({ button: "right" });
  if (label === "导出窗口") await page.getByText("窗口操作", { exact: true }).last().hover();
  await page.getByText(label, { exact: true }).last().click();
}

async function captureProfile(_app, page, theme, mode, shot, profile) {
  await enter(page, "/browser/list", theme, mode);
  await page.getByText(profile.windowName, { exact: true }).first().waitFor();
  await shot(page, "profile-list", page.locator(".rx-main-content"));
  const search = page.getByPlaceholder("搜索 Ctrl + F", { exact: true }).first();
  await search.fill("name::源码");
  const suggestions = page.locator(".dropdown[data-v-3ea763a6]");
  await suggestions.getByText("高级搜索", { exact: true }).waitFor();
  await shot(page, "profile-advanced-search", suggestions);
  await search.press("Escape");
  await search.fill("");
  await search.blur();
  const proxyMenu = await showProfileProxyMenu(page, profile);
  await page.mouse.move(1, 1);
  await shot(page, "profile-proxy-menu", proxyMenu, "移除付费代理入口留下的末尾分隔线");
  await proxyMenu.getByRole("menuitem").first().press("Escape");
  await proxyMenu.waitFor({ state: "hidden" });
  await page.locator("#__prevent-mask-overlay__").waitFor({ state: "hidden" });
  // At rounded corners the dialog raster includes a few pixels behind the mask.
  // Hold that backdrop constant so an unrelated row hover cannot affect the dialog comparison.
  const backdrop = await page.addStyleTag({ content: ".p-dialog-mask { background: #646464 !important; }" });
  for (const [action, name, ready] of [
    ["清除缓存", "profile-clear-cache", ".cache-title"],
    ["导出窗口", "profile-export", ".popup-block__description"],
    ["Cookie 机器人", "profile-cookie-robot", "textarea"],
  ]) {
    await showProfileAction(page, profile, action);
    const dialog = page.locator(".p-dialog:visible").last();
    await dialog.locator(ready).first().waitFor();
    await page.mouse.move(1, 1);
    await shot(page, name, dialog);
    if (action === "Cookie 机器人") {
      await dialog.getByText("更多设置", { exact: true }).click();
      await dialog.getByRole("switch").last().waitFor();
      await page.mouse.move(1, 1);
      await shot(page, "profile-cookie-robot-options", dialog);
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
  await backdrop.evaluate(element => element.remove());
  const chooseMenu = await showProfileProxyMenu(page, profile);
  await chooseMenu.getByText("选择已有代理 IP", { exact: true }).click();
  const picker = page.locator(".p-drawer:visible");
  await picker.getByRole("button", { name: "测试全部", exact: true }).waitFor();
  await picker.locator(".p-datatable-tbody tr").first().waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "profile-proxy-picker", picker, "移除我购买的代理筛选标签");
  await picker.locator("._header_12u5y_1 button").click();
  await picker.waitFor({ state: "hidden" });
  await page.locator(".suffix-tab").getByText("回收站", { exact: true }).click();
  const empty = page.getByText("回收站暂无数据", { exact: true });
  if (mode === "source") await empty.waitFor();
  else await page.getByText("总计 0 个", { exact: true }).waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "profile-recycle", page.locator(".rx-main-content"), "恢复回收站的空列表提示");
  await enter(page, "/browser/edit?id=" + profile.id, theme, mode);
  await page.waitForFunction(name => Array.from(document.querySelectorAll("input")).some(input => input.value === name), profile.windowName);
  await page.getByText("当前环境使用本机网络：", { exact: true }).waitFor();
  await shot(page, "edit-profile", page.locator(".rx-main-content"));
  for (const [title, className] of [["基础设置", "edit-basic"], ["高级指纹设置", "edit-fingerprint"], ["偏好设置", "edit-preferences"]]) {
    const header = page.getByText(title, { exact: true }).first();
    await header.click();
    const panel = header.locator('xpath=ancestor::*[contains(@class,"p-accordionpanel")][1]');
    await panel.locator('form:visible').first().waitFor();
    await page.mouse.move(1, 1);
    await shot(page, className, panel);
    await header.click();
  }
  await enter(page, "/browser/create", theme, mode);
  for (const [tab, name] of [["单个创建", "new-profile"], ["批量创建", "batch-profiles"], ["窗口导入", "import-profile"]]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.locator(".create-page .guide2:enabled").waitFor();
    await page.mouse.move(1, 1);
    await shot(page, name, page.locator(".rx-main-content"), name === "batch-profiles" ? "代理按钮仅保留添加操作" : undefined);
  }
}

async function verifyProfileProxy(page, profile) {
  await enter(page, "/browser/list", "light", "source");
  const menu = await showProfileProxyMenu(page, profile);
  await menu.getByText("添加代理 IP", { exact: true }).click();
  const drawer = page.locator(".p-drawer:visible");
  await drawer.locator('input[name="host"]').fill("profile-proxy.example.test").catch(async error => {
    throw Error("Proxy editor fields: " + JSON.stringify(await page.locator(".p-drawer:visible, .p-dialog:visible")
      .evaluateAll(elements => elements.map(element => ({
        text: element.textContent, inputs: [...element.querySelectorAll("input")].map(input => input.name),
      })))), { cause: error });
  });
  await drawer.locator('input[name="port"]').fill("65536");
  await drawer.getByRole("button", { name: "保存", exact: true }).click();
  await drawer.getByText("端口范围 1~65535", { exact: true }).waitFor();
  await drawer.locator('input[name="port"]').fill("3128");
  await drawer.getByRole("button", { name: "保存", exact: true }).click();
  await drawer.waitFor({ state: "hidden" });
  const stored = (await localRequest(page, "profiles:list")).find(row => row.id === profile.id);
  assert.equal(stored.host ?? stored.proxy?.host, "profile-proxy.example.test");
  assert.equal(Number(stored.port ?? stored.proxy?.port), 3128);
}

async function verifyProfileLocalOperations(page, profile) {
  await showProfileAction(page, profile, "编辑 Cookies");
  const cookieDrawer = page.locator(".p-drawer:visible");
  const editor = cookieDrawer.locator("textarea");
  await editor.fill("{malformed");
  await cookieDrawer.getByRole("button", { name: "保存", exact: true }).click();
  await cookieDrawer.getByText("Cookie 格式错误,请检查格式", { exact: true }).waitFor();
  await editor.fill('[{"domain":"example.test","name":"migration","value":"saved","path":"/"}]');
  await cookieDrawer.getByRole("button", { name: "保存", exact: true }).click();
  await cookieDrawer.waitFor({ state: "hidden" });
  const stored = await localRequest(page, "profiles:read", { id: profile.id });
  assert.match(JSON.stringify(stored.cookie), /migration/);

  const bindProfile = await localRequest(page, "profiles:create", { windowName: "代理选择验收窗口", coreType: "Chrome", os: "Linux" });
  await enter(page, "/browser/list", "light", "source");
  const menu = await showProfileProxyMenu(page, bindProfile);
  await menu.getByText("选择已有代理 IP", { exact: true }).click();
  const picker = page.locator(".p-drawer:visible");
  await picker.locator(".p-datatable-tbody tr").first().click();
  await picker.getByRole("button", { name: "确认", exact: true }).click();
  await picker.waitFor({ state: "hidden" });
  const bound = await localRequest(page, "profiles:read", { id: bindProfile.id });
  assert.equal(bound.proxyMethod, "choose");
  assert.equal(bound.host ?? bound.proxy?.host, "profile-choice.example.test");
}

async function captureProxy(_app, page, theme, mode, shot) {
  await enter(page, "/agent", theme, mode);
  await page.getByRole("row").filter({ hasText: "proxy.example.test" }).waitFor();
  const area = page.locator(".rx-main-content");
  await shot(page, "proxy-list", area);
  await page.getByRole("row").filter({ hasText: "proxy.example.test" }).click({ button: "right" });
  await page.getByText("编辑", { exact: true }).last().click();
  const drawer = page.locator(".p-drawer");
  await drawer.waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "proxy-edit", drawer);
  await enter(page, "/agent/create", theme, mode);
  await page.getByRole("tab", { name: "批量添加", exact: true }).click();
  const batch = page.locator(".proxies-content:visible");
  const text = batch.locator(".textarea-content");
  await text.fill("127.0.0.1:8080\n127.0.0.1:65536");
  await text.blur();
  await page.mouse.move(1, 1);
  await shot(page, "proxy-batch-input", batch);
  if (mode === "source") {
    const before = await localRequest(page, "proxies:list", {});
    await text.fill("127.0.0.1:65536");
    await batch.getByRole("button", { name: "解析并测试", exact: true }).click();
    await batch.getByText(/第 \[1\] 条代理 IP 缺少信息|端口范围 1~65535/).first().waitFor().catch(async error => {
      throw Error("Batch proxy validation: " + await batch.innerText(), { cause: error });
    });
    await batch.getByRole("button", { name: "删除失败", exact: true }).click();
    await page.getByRole("button", { name: "确认", exact: true }).last().click();
    assert.equal(await batch.getByRole("button", { name: "保存", exact: true }).isDisabled(), true);
    assert.deepEqual(await localRequest(page, "proxies:list", {}), before);
    if (theme === "light") {
      await enter(page, "/agent", theme, mode);
      const toggle = area.getByRole("columnheader").filter({ hasText: "备注" }).locator(".cursor-pointer").first();
      const expanded = async () => Boolean((await localRequest(page, "settings:get")).remarkDisplayStatus);
      const original = await expanded();
      await toggle.click();
      await toggle.click();
      await page.waitForTimeout(650);
      assert.equal(await expanded(), original, "快速展开再收起后，保留最后一次选择");
      await toggle.click();
      await waitUntil(async () => (await expanded()) === !original);
      await toggle.click();
      await waitUntil(async () => (await expanded()) === original);
    }
  }
}

async function captureMcp(app, _main, theme, mode, shot) {
  const page = await openWorkspacePage(app, "/agent-console/settings");
  await disableReferenceCache(page);
  const url = new URL(page.url());
  url.searchParams.set("visual", mode + "-" + theme);
  await page.goto(url.href);
  await page.getByRole("button", { name: "MCP 服务", exact: true }).click();
  await page.getByText("暂无 MCP", { exact: true }).waitFor();
  await themePage(page, theme);
  const area = page.locator(".agent-settings");
  await shot(page, "mcp-list", area);
  await page.getByRole("button", { name: "新建", exact: true }).click();
  for (const [tab, name] of [["通过命令行创建 MCP", "mcp-stdio"], ["HTTP 请求", "mcp-http"], ["JSON", "mcp-json"]]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.mouse.move(1, 1);
    await shot(page, name, area);
  }
}

async function agentPage(app, route, theme, mode, ready) {
  const page = await openWorkspacePage(app, route);
  await disableReferenceCache(page);
  const url = new URL(page.url());
  url.searchParams.set("visual", mode + "-" + theme);
  await page.goto(url.href);
  await page.getByText(ready, { exact: true }).last().waitFor();
  await themePage(page, theme);
  return page;
}

async function captureAgent(app, _main, theme, mode, shot) {
  const templates = await agentPage(app, "/agent-console/templates", theme, mode, "源码对照模板");
  await shot(templates, "my-templates", templates.locator(".my-templates-content"));
  await templates.getByRole("button", { name: "更多操作", exact: true }).last().click();
  const menu = templates.locator(".my-template-card-action-popover");
  await menu.waitFor();
  await shot(templates, "template-actions", menu);
  await templates.keyboard.press("Escape");
  await templates.getByRole("button", { name: "创建模板", exact: true }).last().click();
  const editor = templates.locator(".create-template-dialog");
  await editor.getByRole("button", { name: "上传脚本", exact: true }).waitFor();
  await templates.mouse.move(1, 1);
  await shot(templates, "template-script", editor);
  await editor.getByRole("button", { name: "上传脚本", exact: true }).click();
  const upload = templates.locator(".agent-console-upload-script-dialog");
  await upload.locator('input[value="file"]').check();
  const script = [
    "import { defineMetadata, defineParams } from '@openbrowser/sandbox';",
    "defineMetadata({ name: '截图验收脚本', description: '脚本描述预览' });",
    "defineParams({ type: 'object', properties: {",
    "count: { type: 'number', title: '执行次数', default: 2 },",
    "direction: { type: 'string', title: '执行方向', enum: ['左侧', '右侧'], default: '左侧' },",
    "}});",
    "export async function main(options: { count: number, direction: string }) { return options; }",
  ].join("\n");
  await upload.locator('input[type="file"]').setInputFiles({
    name: "visual-test.ts", mimeType: "application/typescript", buffer: Buffer.from(script),
  });
  await upload.getByText("脚本描述预览", { exact: true }).waitFor();
  await upload.getByRole("button", { name: "上传脚本", exact: true }).click();
  await upload.waitFor({ state: "hidden" });
  const parameters = editor.locator(".create-template-dialog__script-parameters");
  const iterations = parameters.locator('input[type="number"]');
  assert.equal(await iterations.inputValue(), "2");
  await iterations.fill("3");
  await iterations.press("Tab");
  const direction = parameters.getByRole("combobox");
  await direction.click();
  await templates.getByRole("option", { name: "右侧", exact: true }).click();
  await direction.blur();
  await templates.mouse.move(1, 1);
  await shot(templates, "template-script-parameters", editor);
  await editor.getByRole("button", { name: "取消", exact: true }).click();
  await editor.waitFor({ state: "hidden" });

  await templates.getByRole("button", { name: "创建模板", exact: true }).last().click();
  await editor.getByRole("button", { name: "提示词", exact: true }).click();
  await editor.locator('[contenteditable="true"]').waitFor();
  await templates.mouse.move(1, 1);
  await shot(templates, "template-prompt", editor);
  await editor.getByRole("button", { name: "取消", exact: true }).click();
  await editor.waitFor({ state: "hidden" });

  const store = await agentPage(app, "/agent-console/template-store", theme, mode, "模板商城");
  await store.locator(".template-store-card").first().waitFor();
  await shot(store, "template-store", store.locator(".template-store-panel"));

  const tasks = await agentPage(app, "/agent-console/task-manager", theme, mode, "源码对照任务");
  await shot(tasks, "task-list", tasks.locator(".task-manager-content"));
  await tasks.clock.setFixedTime(new Date("2032-06-12T14:20:00Z"));
  await tasks.getByRole("button", { name: "添加计划", exact: true }).click();
  const schedule = tasks.locator(".task-schedule-dialog");
  await schedule.waitFor();
  await shot(tasks, "task-schedule", schedule);
  await schedule.getByRole("button", { name: "取消", exact: true }).click();
  await schedule.waitFor({ state: "hidden" });
  await tasks.getByRole("tab", { name: "执行日志", exact: true }).click();
  await tasks.getByText("暂无执行日志", { exact: true }).waitFor();
  await tasks.mouse.move(1, 1);
  await shot(tasks, "task-logs", tasks.locator(".task-manager-content"));
}

async function captureChat(app, _main, theme, mode, shot, conversation) {
  const page = await agentPage(app, "/agent-console", theme, mode, "有什么我能帮你的吗？");
  await page.locator(".template-card").first().waitFor();
  const shell = page.locator(".agent-console");
  await shot(page, "chat-home", shell);
  const input = page.locator('[contenteditable="true"]').last();
  await input.fill("源码界面验收草稿");
  await page.mouse.move(1, 1);
  await shot(page, "chat-draft", shell);
  await page.getByRole("button", { name: "Select window", exact: true }).click();
  const windows = page.locator(".window-picker-popover");
  await windows.getByText("Agent 源码对照窗口").waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "chat-window-picker", windows);
  await windows.locator(".window-picker-item").first().click();
  await windows.getByRole("button", { name: "完成 (1)", exact: true }).click();
  await page.locator('.composer [data-agent-token="profile"]').first().waitFor();
  await page.getByRole("button", { name: "Call skills", exact: true }).click();
  const templates = page.locator(".slash-command-popover");
  await templates.locator(".slash-command-item").first().waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "chat-template-picker", templates);
  if (mode === "source") {
    await templates.getByRole("button", { name: "置顶", exact: true }).first().click();
    const pinned = templates.getByRole("button", { name: "取消置顶", exact: true });
    await pinned.waitFor();
    await page.waitForFunction(async () => (await globalThis.__localAgentApi.templates.listOfficialTemplates({})).data.some(item => item.isTopped));
    await pinned.click();
    await page.waitForFunction(async () => (await globalThis.__localAgentApi.templates.listOfficialTemplates({})).data.every(item => !item.isTopped));
  }
  await templates.locator(".slash-command-select").first().click();
  await page.locator('.composer [data-agent-token="skill"]').first().waitFor();
  await page.evaluate(conversationId => globalThis.__router.push({ name: "agent-console-conversation", params: { conversationId } }), conversation.id);
  const messages = page.locator(".message-list");
  await messages.getByText("这是用于源码验收的本地回复。", { exact: true }).waitFor();
  await shot(page, "chat-messages", messages);
  const item = page.locator(".conversation-item.active");
  async function openActions() {
    await item.hover();
    await item.locator(".conversation-delete").click();
    return page.locator(".conversation-action-menu");
  }
  let actions = await openActions();
  await actions.getByRole("button", { name: "重命名对话", exact: true }).click();
  const rename = page.locator(".rename-conversation-dialog");
  await rename.waitFor();
  await rename.getByRole("textbox", { name: "重命名对话" }).focus();
  await shot(page, "chat-rename", rename);
  await rename.getByRole("button", { name: "取消", exact: true }).click();
  await rename.waitFor({ state: "hidden" });
  actions = await openActions();
  await actions.getByRole("button", { name: "删除", exact: true }).click();
  const confirmation = page.locator(".agent-console-delete-confirm-dialog");
  await confirmation.waitFor();
  await shot(page, "chat-delete", confirmation);
  await confirmation.getByRole("button", { name: "取消", exact: true }).click();
  await confirmation.waitFor({ state: "hidden" });

  const fixture = page.locator("#visual-agent-process");
  await page.evaluate(async () => {
    const { r: createApp } = await import("/assets/runtime-dom.esm-bundler-_WxS4Zar.js");
    const { x: h } = await import("/assets/runtime-core.esm-bundler-CBj16o9G.js");
    const { visualReferenceTimeline } = await import("/assets/hook-CnJE4hRq.js");
    const Timeline = visualReferenceTimeline ?? (await import("/assets/workbench-agent-process-timeline.js")).default;
    const host = document.createElement("div");
    host.id = "visual-agent-process";
    host.style.cssText = "position:fixed; inset:30px auto auto 350px; z-index:10; width:660px; padding:16px; background:var(--colors-background-bg-mode)";
    document.querySelector(".agent-console").append(host);
    const process = { revision: 1, collapsed: false, completed: true, durationLabel: "任务耗时 4s", events: [
      { id: "analysis", type: "thinking", title: "正在分析测试数据", content: "本地回归夹具", status: "done" },
      { id: "log-a", type: "script_log", toolId: "example", scriptName: "fixture.ts", status: "done", lines: [{ message: "第一条日志" }] },
      { id: "log-b", type: "script_log", toolId: "example", scriptName: "fixture.ts", status: "done", lines: [{ message: "第二条日志" }] },
      { id: "approval", type: "hitl", title: "确认运行参数", expanded: true, requestKind: "clarification", clarificationAnswers: [
        { id: "question", question: "检查哪一组？", answer: "本地测试夹具", recommended: true },
      ] },
      { id: "subagent", type: "agent_lifecycle", agentPath: "fixture", renderRevision: 1, agentName: "数据检查",
        lifecycleStatus: "completed", expanded: true, events: [], children: [], report: "本地检查已结束" },
      { id: "report", type: "task_report", sourceReportId: "fixture-report", report: { taskName: "源码执行报告", params: [{ key: "sample", name: "验收范围", value: "本地" }],
        windows: [{ dirId: "unused-window", success: false, status: "unused" }, { dirId: "failed-window", success: false, failureReason: "测试用失败原因" }],
      } },
    ] };
    const app = createApp({ render: () => h(Timeline, { conversationId: "visual-fixture", process, messageStatus: "done" }) });
    const active = document.querySelector("#app").__vue_app__;
    for (const key of ["config", "provides", "components", "directives"]) app._context[key] = active._context[key];
    app.mount(host);
  });
  await fixture.getByRole("button", { name: "任务耗时 4s" }).click();
  await fixture.getByRole("button", { name: "运行脚本 fixture.ts" }).click();
  await fixture.getByRole("button", { name: "查看失败原因" }).click();
  await fixture.getByText("第一条日志", { exact: true }).waitFor();
  await fixture.getByText("测试用失败原因", { exact: true }).waitFor();
  await page.mouse.move(1, 1);
  await shot(page, "chat-process-report", fixture);

  await page.evaluate(async () => {
    const { r: createApp } = await import("/assets/runtime-dom.esm-bundler-_WxS4Zar.js");
    const { h, ref } = await import("/assets/workbench-vue.js");
    const { i: provideMonitor, n: Toggle } = await import("/assets/AgentConsolePageLayout-CwKh-Fcw.js");
    const { visualReferenceMonitor } = await import("/assets/hook-CnJE4hRq.js");
    const Monitor = visualReferenceMonitor ?? (await import("/assets/workbench-agent-monitor.js")).default;
    document.querySelector("#visual-agent-process").style.display = "none";
    const host = document.createElement("div");
    host.id = "visual-agent-monitor";
    host.style.cssText = "position:fixed; top:60px; right:42px; z-index:10; width:360px; height:480px";
    document.querySelector(".agent-console").append(host);
    const app = createApp({
      setup() {
        const open = ref(false);
        const width = ref(330);
        provideMonitor(open, ref(true), ref(0));
        return () => open.value
          ? h(Monitor, {
              groups: [], maxWidth: 640, minWidth: 260, monitorWidth: width.value, runningCount: 0,
              onClose: () => { open.value = false; },
              onResizeStep: step => { width.value += step; },
            })
          : h(Toggle, { variant: "icon" });
      },
    });
    const active = document.querySelector("#app").__vue_app__;
    for (const key of ["config", "provides", "components", "directives"]) app._context[key] = active._context[key];
    app.mount(host);
  });
  const monitor = page.locator("#visual-agent-monitor");
  const toggle = monitor.getByRole("button", { name: "窗口监控", exact: true });
  await toggle.hover();
  const tooltip = page.locator(".agent-tooltip__content").filter({ hasText: "窗口监控" });
  await tooltip.waitFor();
  await shot(page, "chat-monitor-tooltip", tooltip);
  await toggle.click();
  await monitor.getByText("没有已打开的浏览器", { exact: true }).waitFor();
  const resizeHandle = monitor.getByRole("separator");
  await resizeHandle.press("ArrowLeft");
  assert.equal(Number(await resizeHandle.getAttribute("aria-valuenow")), 346);
  await resizeHandle.press("ArrowRight");
  assert.equal(Number(await resizeHandle.getAttribute("aria-valuenow")), 330);
  await resizeHandle.blur();
  await page.mouse.move(1, 1);
  await shot(page, "chat-window-monitor", monitor);
  await monitor.getByRole("button", { name: "关闭窗口监控", exact: true }).click();
  await toggle.waitFor();
}

async function main() {
  const [family, baseline] = process.argv.slice(2);
  assert.ok(Object.hasOwn(families, family) && baseline, "Pass a family and pre-migration asset directory");
  const spec = families[family];
  const assets = Object.fromEntries(await Promise.all(spec.assets.map(async name => [name, await fs.readFile(path.join(baseline, name), "utf8")])));
  const output = evidenceDirectory(family + "-comparison");
  const data = await createTestDirectory("workbench-" + family + "-visual-");
  const report = { passed: false, references: {}, viewport: [1448, 960], cases: [], errors: [], external: [] };
  for (const [name, code] of Object.entries(assets)) report.references[name] = createHash("sha256").update(code).digest("hex");
  if (family === "chat") assets["hook-CnJE4hRq.js"] += "\nexport { fw as visualReferenceTimeline, sy as visualReferenceMonitor };\n";
  let app, server;
  try {
    app = await launchVisualApp(appRoot, data, "");
    function observe(page) {
      page.setDefaultTimeout(10000);
      page.on("pageerror", error => report.errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") report.errors.push(message.text()); });
      page.on("request", request => { if (/^https?:|^wss?:/.test(request.url())) report.external.push(request.url()); });
    }
    app.on("window", observe);
    const page = await app.firstWindow();
    await disableReferenceCache(page);
    observe(page);
    await page.setViewportSize({ width: report.viewport[0], height: report.viewport[1] });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    if (family === "projects") await localRequest(page, "groups:save", { projectName: "源码对照项目" });
    if (family === "proxy") await localRequest(page, "proxies:create", { protocol: "http", host: "proxy.example.test", port: 3128, remark: "源码对照代理" });
    if (family === "profile") await localRequest(page, "proxies:create", { protocol: "http", host: "profile-choice.example.test", port: 3128, remark: "窗口代理夹具" });
    if (family === "chrome") {
      await localRequest(page, "notifications:append", { title: "本地验收通知", message: "同一条消息用于对照。" });
      await app.evaluate((_electron, file) => {
        const { LocalService } = process.mainModule.require(file);
        const request = LocalService.prototype.request;
        LocalService.prototype.request = function (method, ...args) {
          if (method === "kernels:list") return Promise.resolve([
            { engine: "chromium", version: "158.0.8127.36", primary: true },
            { engine: "firefox", version: "145.0", primary: true },
          ]);
          return request.call(this, method, ...args);
        };
      }, path.join(__dirname, "local-service.js"));
    }
    if (family === "account") await localRequest(page, "accounts:create", { values: [{
      platformUrl: "https://accounts.example.test/", platformUserName: "source-check@example.test", platformPassword: "fixture-password",
    }] });
    if (family === "agent") {
      const created = await localRequest(page, "agent:userTemplates.createUserTemplate", {
        name: "源码对照模板", template_type: "prompt", metadata: { prompt: "比较本地模板和任务界面" },
      });
      assert.ok(created.data?.id, "Template fixture was not saved");
      await localRequest(page, "agent:userTasks.createUserTask", { name: "源码对照任务", user_template_id: created.data.id });
    }
    let conversation;
    if (family === "chat") {
      await localRequest(page, "profiles:create", { windowName: "Agent 源码对照窗口", coreType: "Chrome", os: "Linux" });
      server = http.createServer((request, response) => {
        request.resume();
        const body = JSON.stringify({ choices: [{ delta: { content: "这是用于源码验收的本地回复。" } }] });
        response.writeHead(200, { "content-type": "text/event-stream" });
        response.end("data: " + body + "\n\ndata: [DONE]\n\n");
      });
      await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
      await localRequest(page, "agent:config:set", {
        provider: "openai", model: "frontend-visual-fixture", baseUrl: "http://127.0.0.1:" + server.address().port,
      });
      conversation = await page.evaluate(() => globalThis.__localAgentApi.createConversation());
      await localRequest(page, "agent:channel:send", {
        type: "conversation.run.start", data: { conversationId: conversation.id, message: "对话模板的本地截图验收", fullAccess: true },
        requestId: "frontend-visual-fixture",
      });
      await waitUntil(() => page.evaluate(async id => {
        const { conversation } = await globalThis.__localAgentApi.conversationDetail(id);
        return conversation.latestRunStatus === "completed";
      }, conversation.id));
      await page.evaluate(async id => {
        const api = globalThis.__localAgentApi;
        const { conversation } = await api.conversationDetail(id);
        await api.markConversationRead(id, conversation.latestRunId);
      }, conversation.id);
    }
    const profile = family === "profile" ? await localRequest(page, "profiles:create", { windowName: "源码对照窗口", coreType: "Chrome", os: "Linux" }) : undefined;
    if (family === "profile") {
      await app.evaluate((_electron, file) => {
        const { LocalService } = process.mainModule.require(file);
        const request = LocalService.prototype.request;
        const samples = new Map();
        LocalService.prototype.request = function (method, payload, ...rest) {
          if (!["fingerprint:preview", "fingerprint:sample-fields"].includes(method)) return request.call(this, method, payload, ...rest);
          const { previousUserAgent: _previousUserAgent, ...input } = payload;
          const key = method + JSON.stringify(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)));
          if (!samples.has(key)) samples.set(key, request.call(this, method, payload, ...rest));
          return samples.get(key);
        };
      }, path.join(__dirname, "local-service.js"));
    }
    await installReference(app, assets);

    for (const mode of ["reference", "source"]) {
      await switchReferenceMode(app, mode === "reference");
      for (const theme of ["light", "dark"]) {
        await spec.capture(app, page, theme, mode, async (target, name, element, expectedChange) => {
          const id = theme + "-" + name;
          const file = type => path.join(output, id + "-" + type + ".png");
          await captureStableScreenshot(target, file(mode), element);
          if (mode === "source") {
            const pixels = JSON.parse(execFileSync("python3", [comparator, file("reference"), file(mode), file("diff")], { encoding: "utf8" }));
            report.cases.push({ id, ...pixels, ...(!pixels.equal && expectedChange ? { expectedChange } : {}) });
          }
        }, profile ?? conversation);
      }
    }
    report.referenceRequests = await readReferenceRequests(app);
    report.sourceRequests = await readSourceRequests(app);
    for (const asset of spec.requiredReference ?? []) {
      assert.ok(report.referenceRequests.includes(asset), "reference " + asset);
      assert.ok(report.sourceRequests.includes(asset), "source " + asset);
    }
    if (family === "profile") {
      await verifyProfileProxy(page, profile);
      report.proxyEdit = "passed";
      await verifyProfileLocalOperations(page, profile);
      report.localCookieAndProxyBinding = "passed";
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.external, []);
    assert.deepEqual(report.cases.filter(item => !item.equal && !item.expectedChange).map(item => item.id), []);
    report.passed = true;
  } catch (error) {
    report.failure = error.stack;
    throw error;
  } finally {
    await app?.close();
    if (server) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
    await fs.writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  }
  console.log(family, report.cases.filter(item => item.equal).length, "pixel-exact comparisons",
    report.cases.filter(item => item.expectedChange).length, "documented changes");
}

main().catch(error => { console.error(error); process.exitCode = 1; });

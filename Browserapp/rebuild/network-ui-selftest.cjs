"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const { _electron: electron, chromium } = require("playwright"),
  fs = require("node:fs/promises"),
  http = require("node:http"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  net = require("node:net");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await createTestDirectory('network-ui-'),
    evidence = evidenceDirectory(),
    result = { passed: false, errors: [], externalRequests: [], checks: [] };
  let app, page, systemProxy, browser;
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
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (e) => result.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push(m.text());
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push(r.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "刷新网络定位", exact: true })
      .click();
    await waitUntil(
      () =>
        page.evaluate(() =>
          globalThis.__localRequest("host:network").then((row) => !!row.ip),
        ),
      { timeout: 60000 },
    );
    result.host = await page.evaluate(() =>
      globalThis.__localRequest("host:network"),
    );
    assert.ok(net.isIP(result.host.ip));
    await page
      .getByTestId("workbench-header")
      .getByText("(" + result.host.ip + ")", { exact: true })
      .waitFor();
    result.checks.push(
      "真实点击定位按钮：原后端完成公网探测，显示实际返回地址，未使用固定截图数据",
    );
    let systemIp = '198.51.100.24';
    let systemRequests = 0;
    systemProxy = http.createServer((request, response) => {
      if (!systemIp || !request.url.startsWith('http://ip-api.com/json/')) return response.writeHead(502).end();
      systemRequests++;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ status: 'success', query: systemIp, countryCode: 'JP' }));
    });
    systemProxy.on('connect', (_request, socket) => socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n'));
    await new Promise(resolve => systemProxy.listen(0, '127.0.0.1', resolve));
    await app.evaluate(({ session }, port) => {
      const probeSession = session.fromPartition('openbrowser-system-network');
      const setProxy = probeSession.setProxy.bind(probeSession);
      probeSession.setProxy = config => {
        if (config.mode !== 'system') throw Error('expected an isolated system proxy session');
        // Stand in for OS proxy settings while keeping the actual Electron fetch and IPC paths.
        return setProxy({ mode: 'fixed_servers', proxyRules: `127.0.0.1:${port}` });
      };
    }, systemProxy.address().port);
    const detectSystem = () => page.evaluate(() => globalThis.electronAPI.send('proxy:detectNetwork', 'system'));
    const detected = await detectSystem();
    assert.equal(detected.ip, systemIp);
    assert.equal(detected.route, 'system');
    systemIp = '198.51.100.25';
    assert.equal((await detectSystem()).ip, systemIp);
    assert.ok(systemRequests >= 2);
    assert.equal((await page.evaluate(() => globalThis.__localRequest('host:network'))).ip, result.host.ip);
    result.checks.push('系统代理检测通过独立 Electron 会话发出请求，重复检测读取新出口，工具栏缓存未被覆盖');
    if (process.env.OPENBROWSER_TEST_KERNEL_BINARY) {
      const runtime = await page.evaluate(async () => {
        const row = await globalThis.__localRequest('profiles:create', {
          windowName: '系统出口显示验证', os: 'Linux', coreType: 'Chrome', openWorkbench: 1,
          startupParam: '--headless=new', sandboxPermission: true,
        });
        await globalThis.__localRequest('profiles:start', { id: row.id });
        return (await globalThis.ops.profileStatus()).find(profile => profile.id === row.id);
      });
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${runtime.port}`);
      const startPage = browser.contexts()[0].pages().find(tab => tab.url().includes(`pid=${runtime.id}`));
      assert.ok(startPage, 'native browser must load the local start page');
      const ipText = startPage.locator('#ip-ip');
      await waitUntil(async () => (await ipText.textContent()) === systemIp);
      assert.equal(await startPage.locator('#network-mode').textContent(), '跟随系统代理设置');
      systemIp = '198.51.100.26';
      const refresh = startPage.getByRole('button', { name: '重新检测' });
      await refresh.click();
      await waitUntil(async () => (await ipText.textContent()) === systemIp);
      systemIp = '';
      await refresh.click();
      await startPage.locator('#ip-error.show').waitFor();
      assert.match(await startPage.locator('#checked-at').textContent(), /本次检测失败.*上次结果/);
      assert.equal(await ipText.textContent(), '198.51.100.26');
      result.checks.push('真实 Chrome 启动页显示跟随系统设置，点击检测更新出口 IP，失败时标注上次结果');
      await browser.close();
      browser = null;
      systemIp = '198.51.100.26';
    }
    const proxy = new URL(
      process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "",
    );
    const proxyInfo = {
      host: proxy.hostname,
      port: Number(proxy.port || 80),
      protocol: proxy.protocol.slice(0, -1),
      proxyUserName: decodeURIComponent(proxy.username),
      proxyPassword: decodeURIComponent(proxy.password),
    };
    await page.evaluate(() => (globalThis.__localRequests = []));
    const row = await page.evaluate(
      (proxyInfo) =>
        globalThis.__localRequest("profiles:create", {
          windowName: "代理检测真实接线",
          coreType: "Chrome",
          os: "Linux",
          proxyInfoList: [proxyInfo],
        }),
      proxyInfo,
    );
    await page.getByText("代理检测真实接线", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "测试全部代理 IP", exact: true })
      .click();
    await waitUntil(
      () =>
        page.evaluate(
          (id) =>
            globalThis
              .__localRequest("profiles:read", { id })
              .then((row) => !!row.checkTime && !!row.lastIp),
          row.id,
        ),
      { timeout: 60000 },
    );
    result.profile = await page.evaluate(
      (id) =>
        globalThis
          .__localRequest("profiles:read", { id })
          .then((row) => ({
            id: row.id,
            lastIp: row.lastIp,
            checkTime: row.checkTime,
            checkStatus: row.checkStatus,
          })),
      row.id,
    );
    assert.ok(net.isIP(result.profile.lastIp));
    assert.equal(result.profile.checkStatus, 1);
    result.checks.push(
      "原列表“测试全部代理 IP”走实际探测及结果写回，刷新后检查时间、IP 与成功状态仍在",
    );
    await page.screenshot({ path: path.join(evidence, "network-live.png") });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      result.requests = await page.evaluate(() => globalThis.__localRequests);
      await page.screenshot({
        path: path.join(evidence, "network-live-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await app?.close();
    systemProxy?.closeAllConnections();
    if (systemProxy) await new Promise(resolve => systemProxy.close(resolve));
    await fs.writeFile(
      path.join(evidence, "network-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

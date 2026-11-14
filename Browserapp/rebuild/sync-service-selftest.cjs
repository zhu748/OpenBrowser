"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { SyncService } = require("./sync-service");
const { LiveSyncController } = require("../live-sync-v5");
const cdp = require("../cdp");
(async () => {
  const rows = [
      { id: "a", item: { pid: 101, port: 9101 } },
      { id: "b", item: { pid: 102, port: 9102 } },
    ],
    writes = [],
    activeKeys = new Map();
  let keyboard = true,
    shouldFail = false;
  const service = new SyncService({
    engine: {
      runningWithCdp: (ids) => rows.filter((row) => ids.includes(row.id)),
      status: () => rows.map((row) => ({ id: row.id, pid: row.item.pid })),
    },
    controller: {
      getSettings: () => ({ keyboard }),
      updateSettings: (p) => {
        if (p.keyboard !== undefined) keyboard = p.keyboard;
      },
    },
    state: () => ({ selected: ["a", "b"], master: "a" }),
    textAssignments: async (request) => {
      assert.equal(keyboard, false);
      writes.push({
        ids: request.ids,
        clear: request.clearAction,
        texts: request.ids.map(request.resolveText),
      });
      return shouldFail
        ? { success: false, failures: [{ id: "b", message: "closed" }] }
        : { success: true, profiles: request.ids.map((id) => ({ id })) };
    },
    shortcuts: {
      isRegistered: (key) => activeKeys.has(key),
      register: (key, fn) => {
        if (activeKeys.has(key)) return false;
        activeKeys.set(key, fn);
        return true;
      },
      unregister: (key) => activeKeys.delete(key),
    },
    shortcutAction: () => {},
  });
  await service.request("sync:batch-text", {
    mode: "same",
    data: "中文 batch",
    append: false,
  });
  assert.deepEqual(writes[0], {
    ids: ["a", "b"],
    clear: "clear",
    texts: ["", ""],
  });
  assert.deepEqual(writes[1].texts, ["中文 batch", "中文 batch"]);
  assert.equal(keyboard, true);
  await service.request("sync:batch-text", {
    mode: "diff",
    data: { 102: "only b" },
    append: true,
  });
  assert.deepEqual(writes.at(-1).ids, ["b"]);
  assert.equal(writes.at(-1).texts[0], "only b");
  const before = writes.length;
  await assert.rejects(
    service.request("sync:batch-text", {
      mode: "diff",
      data: { 999: "wrong process" },
      append: true,
    }),
    /未选择/,
  );
  assert.equal(writes.length, before);
  await assert.rejects(
    service.request("sync:batch-text", {
      mode: "random",
      data: { min: "Infinity", max: 10, data_type: "int" },
      append: true,
    }),
    /范围/,
  );
  await service.request("sync:batch-text", {
    mode: "random",
    data: { min: -3, max: 3, data_type: "float", decimal_place_count: 4 },
    append: true,
  });
  assert.ok(
    writes
      .at(-1)
      .texts.every(
        (value) =>
          /^-?\d+\.\d{4}$/.test(value) &&
          Number(value) >= -3 &&
          Number(value) <= 3,
      ),
  );
  shouldFail = true;
  await assert.rejects(
    service.request("sync:batch-text", {
      mode: "same",
      data: "failure",
      append: true,
    }),
    /b: closed/,
  );
  assert.equal(keyboard, true);
  shouldFail = false;
  await assert.rejects(
    service.request("sync:open-sites", {
      urls: ["https://example.com", "file:///etc/passwd"],
      replaceCurrentTab: false,
    }),
    /仅支持/,
  );
  const platform = process.platform === "win32" ? "windows" : "mac";
  activeKeys.set("Ctrl+Alt+X", () => {});
  const conflict = await service.request("sync:shortcuts:check", {
    [platform]: { unifiedTabs: "Ctrl + Alt + X" },
  });
  assert.equal(conflict.unifiedTabs.status, false);
  assert.equal(activeKeys.size, 1);
  activeKeys.clear();
  await service.request("sync:shortcuts:register", {
    [platform]: { stopSync: "Ctrl + Alt + D" },
  });
  assert.ok(activeKeys.has("Ctrl+Alt+D"));
  await assert.rejects(
    service.request("sync:shortcuts:register", {
      [platform]: { stopSync: "Ctrl + A", openSites: "Ctrl + A" },
    }),
    /冲突/,
  );
  assert.ok(activeKeys.has("Ctrl+Alt+D"));
  service.clearShortcuts();
  assert.equal(activeKeys.size, 0);
  await service.request("sync:shortcuts:register", {
    [platform]: { stopSync: "Ctrl + Alt + D" },
  });
  await service.shutdown();
  assert.equal(activeKeys.size, 0);
  await assert.rejects(
    service.request("sync:shortcuts:register", {}),
    /正在退出/,
  );
  const controller = new LiveSyncController({}, () => {});
  controller.slaves = [{ id: "first" }, { id: "second" }];
  controller.master = { id: "master" };
  controller.masterTabById = () => ({ url: "http://local.test" });
  controller.slaveTab = async (slave) => ({ webSocketDebuggerUrl: slave.id });
  controller.mappedMousePoint = async () => ({ x: 0, y: 0 });
  controller.planProtocolFanout = () => ({ skip: false, delayMs: 0 });
  controller.startNativeInputMirror = () => {};
  const nativeCall = cdp.call,
    times = [];
  cdp.call = async (socket, method, params) => {
    if (params.type === "mousePressed")
      times.push({ socket, at: performance.now() });
    return {};
  };
  try {
    controller.updateSettings({
      delayClick: true,
      clickMinMs: 100,
      clickMaxMs: 100,
      delayMode: 1,
    });
    await controller.forward("tab", { type: "click" });
    assert.equal(times.length, 2);
    assert.ok(times[1].at - times[0].at < 80);
    times.length = 0;
    controller.updateSettings({ delayMode: 0 });
    await controller.forward("tab", { type: "click" });
    assert.equal(times.length, 2);
    assert.ok(times[1].at - times[0].at >= 85);
    times.length = 0;
    const pending = controller.forward("tab", { type: "click" });
    const timer = setTimeout(() => controller.syncGeneration++, 140);
    await pending;
    clearTimeout(timer);
    assert.equal(times.length, 1);
    times.length = 0;
    controller.updateSettings({ delayMode: 1 });
    const blocked = controller.forward("tab", { type: "click" });
    const disable = setTimeout(
      () => controller.updateSettings({ click: false }),
      20,
    );
    await blocked;
    clearTimeout(disable);
    assert.equal(
      times.length,
      0,
      "queued events must recheck current input gates after a delay",
    );
    assert.throws(
      () => controller.updateSettings({ delayMode: 2 }),
      /delay mode/,
    );
  } finally {
    cdp.call = nativeCall;
  }
  const result = {
    status: "PASS",
    checks: [
      "same/different/random text validation and native runner assignment",
      "failed native input restores keyboard mirroring; invalid input has no side effects",
      "all URLs validated before navigation",
      "global shortcut collision leaves prior registrations intact; only owned keys released",
      "real controller fan-out: parallel versus per-destination serial delays; stale generation cancels remaining destinations",
    ],
  };
  fs.writeFileSync(
    path.resolve(
      __dirname,
      "../../docs/rebuild/evidence/sync-service-selftest.json",
    ),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

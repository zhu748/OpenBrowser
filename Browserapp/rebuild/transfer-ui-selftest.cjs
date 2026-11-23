"use strict";

const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { setImmediate: nextTurn } = require("node:timers/promises");
const { test } = require("node:test");
const vm = require("node:vm");
const vue = require("vue");
const { parse } = require("acorn");
const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
const { encryptCredentialJson } = require("../credential-crypto");
const { writeRawAtomically, loadEngineStartupState } = require("../engine/state-storage");
const { TrackedProfileMap } = require("../engine/profile-revisions");
const profileStore = require("../engine/profile-store-api");
const status = require("../engine/status-api");
const { captureIpcResult } = require("../shared/ipc-result");
const { createLocalRouteRegistry, resolveLocalRoute } = require("./local-route-registry");

const app = path.resolve(__dirname, "..");
const read = file => fs.readFile(path.join(app, file), "utf8");
const noop = () => {};
const clone = structuredClone;
const signal = () => Promise.withResolvers();

function collect(node, match, found = []) {
  if (node && typeof node === "object") {
    if (match(node)) found.push(node);
    if (Array.isArray(node.children)) node.children.forEach(child => collect(child, match, found));
  }
  return found;
}

async function load(file, overrides) {
  const filename = path.join(app, file), req = createRequire(filename), mod = { exports: {} };
  const code = await read(file);
  vm.runInNewContext(`(function(require,module){${code}\n})`, { Buffer, structuredClone }, { filename })(
    id => Object.hasOwn(overrides, id) ? overrides[id] : req(id), mod,
  );
  return mod.exports;
}

async function fixture(t, { sqlite, count = 2 }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-transfer-ui-"));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString("hex");
  const db = sqlite && new ProfileStoreSqlite({ dbPath: path.join(root, "state.db") });
  t.after(async () => {
    db?.close?.();
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    await fs.rm(root, { recursive: true, force: true });
  });
  if (db) await db.init();
  const stateFile = path.join(root, "state.json"), chosen = path.join(root, "chosen.json");
  const resultFile = path.join(root, "result.json");
  const safeMetadata = row => Object.fromEntries(
    ["id", "number", "name", "title", "note", "groupId", "group_name", "favorite", "trashed", "trashedAt"]
      .filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]),
  );
  const transferRoutes = createLocalRouteRegistry([
    await load("rebuild/routes/transfer.js", { "../../engine/profile-sanitizer": { sanitizeProfile: safeMetadata } }),
  ]);
  const { LocalService } = await load("rebuild/local-service.js", {
    "./local-route-registry": { resolveLocalRoute: method => {
      assert.ok(["profiles:list", "profiles:read", "profiles:update", "transfer:import", "transfer:export"].includes(method), method);
      return method.startsWith("transfer:") ? transferRoutes.resolve(method) : resolveLocalRoute(method);
    } },
  });
  const listeners = new Set();
  const engine = {
    ...status, ...profileStore,
    profiles: new TrackedProfileMap(), extensions: new Map(), assignments: new Map(), networkInfo: new Map(),
    listExtensions: () => [], sanitizeProfile: safeMetadata, resolveStoredProxyProfile: row => row,
    publicRunning: () => ({ running: false }),
    emit: value => listeners.forEach(fn => fn({}, clone(value))),
    async persist() {
      const profiles = Array.from(engine.profiles.values());
      if (db) db.saveEngineState({ profiles, extensions: [], assignments: {}, kernelPolicyVersion: 1,
        preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null });
      else await writeRawAtomically(stateFile, encryptCredentialJson({ profiles }));
    },
  };
  await engine.commitProfiles(Array.from({ length: count }, (_, i) => ({ id: `profile-${i + 1}`, name: `Local row ${i + 1}`, number: i + 1 })));
  const persisted = async () => {
    if (!db) return (await loadEngineStartupState(stateFile)).saved.profiles;
    const reopened = new ProfileStoreSqlite({ dbPath: path.join(root, "state.db") });
    await reopened.init();
    try { return reopened.getAllProfiles(); }
    finally { reopened.close(); }
  };
  const input = profiles => fs.writeFile(chosen, JSON.stringify({ format: "openbrowser-profiles", version: 1, profiles }));
  let opening = async () => ({ canceled: false, filePaths: [chosen] });
  let saving = async () => ({ canceled: false, filePath: resultFile });
  const calls = { open: 0, save: 0 };
  const service = Object.assign(Object.create(LocalService.prototype), {
    file: path.join(root, "rebuild-local.json"), engine, queue: Promise.resolve(), window: () => undefined,
    dialog: {
      showOpenDialog: () => { calls.open++; return opening(); },
      showSaveDialog: () => { calls.save++; return saving(); },
    },
  });
  await service.load();
  const main = await read("main.js");
  const start = main.indexOf("registerTrustedIpc('rebuild:request'");
  const end = main.indexOf("\n  }\n  registerTrustedIpc('system:info'", start);
  assert.ok(start > 0 && end > start);
  const handlers = new Map();
  vm.runInNewContext(main.slice(start, end), { registerTrustedIpc: (method, fn) => handlers.set(method, fn),
    captureIpcResult, startupReady: Promise.resolve(), localUiService: service });
  const bridgeSource = (await read("rebuild/renderer-bridge.js")).replace(/^import\s+[\s\S]*?;$/gm, "");
  const pageSource = await read("rebuild/local-pages.js");
  const pageNames = ["ipc", "btn", "shell", "table", "Transfers"];
  const declarations = parse(pageSource, { ecmaVersion: "latest", sourceType: "module" }).body.map(n => n.declaration ?? n);
  const pageCode = pageNames.map(name => {
    const declaration = declarations.find(n => n.declarations?.[0]?.id.name === name);
    assert.ok(declaration, name);
    return pageSource.slice(declaration.start, declaration.end);
  }).join("\n");
  const preload = await read("preload.js");
  const packs = Object.fromEntries(await Promise.all(["en", "ru", "zh-CN"].map(async key =>
    [key, (await import(`../frontend/src/workbench/locales/${key}.mjs`)).default])));
  const client = (locale = "en") => {
    const recorded = [], subscriptions = [], bridge = {};
    let started, stopped, gate;
    const holdRead = () => {
      assert.equal(gate, undefined);
      return gate = { arrived: signal(), release: signal() };
    };
    vm.runInNewContext(preload, { require(id) {
      assert.equal(id, "electron");
      return { contextBridge: { exposeInMainWorld: (key, value) => bridge[key] = value }, ipcRenderer: {
        async invoke(key, method, payload) {
          assert.equal(key, "rebuild:request");
          recorded.push([method, clone(payload)]);
          const current = method === "profiles:list" ? gate : null;
          if (current) gate = undefined;
          const reply = clone(await handlers.get(key)({}, method, clone(payload)));
          if (current) { current.arrived.resolve(reply); return await current.release.promise ?? reply; }
          return reply;
        },
        on(key, fn) { assert.equal(key, "engine:event"); listeners.add(fn); },
        removeListener(key, fn) { assert.equal(key, "engine:event"); listeners.delete(fn); },
      } };
    } });
    const tr = (key, values = {}) => (packs[locale][key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name]);
    const context = vm.createContext({ rebuild: bridge.rebuild, createProfileLifecycleBridge: () => ({ handle: noop }),
      $t: tr, currentScope: () => null, invalidateProfileTableCache: noop, __localSubscriptions: subscriptions });
    vm.runInContext(bridgeSource, context);
    const Button = { name: "Button" }, Alert = { name: "Alert" };
    const definition = Function("globalThis", "ref", "onMounted", "onBeforeUnmount", "h", "Button", "Alert",
      `${pageCode}\nreturn Transfers`)(context, vue.ref, fn => { started = fn; }, fn => { stopped = fn; }, vue.h, Button, Alert);
    const render = definition.setup();
    const button = key => collect(render(), el => el.type === Button && el.props.label === tr(key))[0];
    const box = name => collect(render(), el => el.type === "input" && el.props["aria-label"] === tr("选择窗口：{name}", { name }))[0];
    const part = value => collect(render(), el => el.children === value || el.props?.content === value)[0];
    return {
      mount: () => started(), unmount: () => stopped(), render, button, box, part, locale: value => { locale = value; }, tr,
      click: key => button(key).props.onClick(), has: (key, values) => Boolean(part(tr(key, values))),
      checks: () => collect(render(), el => el.type === "input"), notices: () => collect(render(), el => el.type === Alert),
      requests: (method = "profiles:list") => recorded.filter(([key]) => key === method),
      subscriptions, holdRead,
      rename: async (id, name) => {
        const api = context.__localApi.window;
        const { data } = await api.userGetWindowInfoList({ id });
        return api.userMdfWindowInfoSingleV2Create({ id, rev: data.rev, windowName: name });
      },
    };
  };
  return { root, chosen, resultFile, input, calls, engine, persisted, client,
    open: fn => { opening = fn; }, save: fn => { saving = fn; },
    ping: () => engine.emit({ type: "status", action: "profiles-update" }) };
}

const safeFailure = path => ({ ipcResult: 1, ok: false, error: { code: "EIO", message: `synthetic EIO at ${path}` } });
const IMPORT = "导入窗口文件", EXPORT = "导出所选窗口", REFRESH = "刷新窗口列表", RETRY = "重试";
const SELECTED = "已选择 {count} / {limit} 个窗口";
const LIST_FAILED = "未能加载窗口列表，请重试。";
const STALE_LIST = "未能刷新窗口列表，仍显示上次加载的结果。";
const IMPORTED = "已导入 {count} 个窗口。";
const EXPORT_FAILED = "未能确认导出，请检查目标位置后重试。";
const choose = (box, checked = true) => box.props.onChange({ target: { checked } });
const settle = async () => { await nextTurn(); await nextTurn(); };

for (const sqlite of [true, false]) {
  const label = sqlite ? "SQLite" : "encrypted JSON";
  const options = { skip: sqlite && !ProfileStoreSqlite.isSupported(), timeout: 9000 };
  test(`${label}: confirmed receipt and roster refresh stay separate; safe Retry, cancel and single-flight`, options, async t => {
    const f = await fixture(t, { sqlite });
    const view = f.client("en"), initial = view.holdRead();
    const mounting = view.mount();
    await initial.arrived.promise;
    try {
      assert.equal(view.requests().length, 1);
      assert.equal(view.has("加载中"), true);
      assert.equal(view.has("暂无窗口"), false);
    } finally { initial.release.resolve(safeFailure(f.chosen)); await mounting; }
    assert.equal(view.has(LIST_FAILED), true);
    assert.equal(view.notices().some(n => n.props.content.includes(f.root)), false);
    const second = view.holdRead(), retrying = view.click(RETRY);
    await second.arrived.promise;
    try {
      assert.equal(view.button(RETRY).props.disabled, true);
      await view.click(RETRY);
      assert.equal(view.requests().length, 2);
    } finally { second.release.resolve(); await retrying; }
    assert.ok(view.box("Local row 1"));
    assert.equal(view.has(LIST_FAILED), false);
    assert.equal(view.has(SELECTED, { count: 0, limit: 200 }), true);

    const picker = signal(), pickerAnswer = signal();
    f.open(() => { picker.resolve(); return pickerAnswer.promise; });
    await f.input([{ name: "Imported locally", note: "Inert note" }]);
    const hold = view.holdRead(), running = view.click(IMPORT);
    await picker.promise;
    try {
      assert.equal(view.button(IMPORT).props.disabled, true);
      assert.equal(view.button(EXPORT).props.disabled, true);
      assert.equal(view.button(REFRESH).props.disabled, true);
      await view.click(IMPORT);
      await view.click(REFRESH);
      assert.equal(f.calls.open, 1);
      assert.equal(view.requests().length, 2, "no premature read while the import chooser waits");
    } finally { pickerAnswer.resolve({ canceled: false, filePaths: [f.chosen] }); }
    await hold.arrived.promise;
    try {
      assert.equal(view.has(IMPORTED, { count: 1 }), true);
      assert.equal((await f.persisted()).find(row => row.name === "Imported locally").note, "Inert note");
      assert.ok(view.box("Local row 1"));
      assert.equal(view.box("Imported locally"), undefined);
    } finally { hold.release.resolve(safeFailure(f.chosen)); await running; }
    assert.equal(view.has(IMPORTED, { count: 1 }), true);
    assert.equal(view.has(STALE_LIST), true);
    assert.equal(view.notices().some(n => n.props.content.includes(f.root)), false);
    assert.equal(view.requests().length, 3, "the import's profile event is folded into its own refresh");
    await view.click(RETRY);
    assert.ok(view.box("Imported locally"));
    assert.equal(view.has(STALE_LIST), false);
    assert.equal(view.has(IMPORTED, { count: 1 }), true);
    view.locale("ru");
    assert.equal(view.render().children[0].children, "Импорт и экспорт профилей");
    assert.equal(view.has(IMPORTED, { count: 1 }), true);
    view.locale("zh-CN");
    assert.equal(view.render().children[0].children, "窗口文件交换");
    view.locale("en");

    const reads = view.requests().length, before = (await f.persisted()).length;
    f.open(async () => ({ canceled: true, filePaths: [] }));
    await view.click(IMPORT);
    assert.equal(view.requests().length, reads);
    assert.equal(view.has(IMPORTED, { count: 1 }), false);
    choose(view.box("Local row 1"));
    f.save(async () => ({ canceled: true }));
    await view.click(EXPORT);
    assert.equal(view.requests().length, reads);
    assert.equal(view.box("Local row 1").props.checked, true);
    assert.equal((await f.persisted()).length, before);

    await f.input([]);
    f.open(async () => ({ canceled: false, filePaths: [f.chosen] }));
    await view.click(IMPORT);
    assert.equal(view.has(IMPORTED, { count: 0 }), true);
    assert.equal((await f.persisted()).length, before);
    assert.equal(view.requests().length, reads);
    f.save(async () => ({ canceled: false, filePath: path.join(f.chosen, "missing") }));
    await view.click(EXPORT);
    assert.equal(view.has(EXPORT_FAILED), true);
    assert.equal(view.requests().length, reads);
    assert.equal(view.notices().some(n => n.props.content.includes(f.root)), false);
    view.unmount();
  });

  test(`${label}: independent event subscriptions, honest refresh ordering and active selection`, options, async t => {
    const f = await fixture(t, { sqlite });
    const a = f.client(), b = f.client();
    await Promise.all([a.mount(), b.mount()]);
    assert.equal(a.subscriptions.filter(s => s.active && s.channel === "local:profiles-change").length, 1);
    assert.equal(b.subscriptions.filter(s => s.active && s.channel === "local:profiles-change").length, 1);
    choose(b.box("Local row 1"));
    choose(b.box("Local row 2"));

    const delayed = b.holdRead();
    f.ping();
    await delayed.arrived.promise;
    try {
      await a.rename("profile-1", "Newest ordinary name");
      await settle();
      assert.equal(b.box("Newest ordinary name").props.checked, true);
      assert.equal(b.box("Local row 1"), undefined);
    } finally { delayed.release.resolve(); await settle(); }
    assert.equal(b.box("Newest ordinary name").props.checked, true);

    const failed = b.holdRead();
    f.ping();
    await failed.arrived.promise;
    try {
      await a.rename("profile-1", "Another ordinary name");
      await settle();
      assert.equal(b.box("Another ordinary name").props.checked, true);
    } finally { failed.release.resolve(safeFailure(f.chosen)); await settle(); }
    assert.equal(b.has(STALE_LIST), false);
    const old = b.holdRead();
    f.ping();
    await old.arrived.promise;
    const current = b.holdRead();
    f.ping();
    await current.arrived.promise;
    old.release.resolve(); await settle();
    try {
      assert.equal(b.has("加载中"), true, "an old response cannot clear newer loading");
      assert.equal(b.box("Another ordinary name").props.checked, true);
    } finally { current.release.resolve(); await settle(); }
    await f.engine.commitProfiles([{ ...f.engine.profiles.get("profile-1"), trashed: true }]);
    await settle();
    assert.equal(b.box("Another ordinary name"), undefined);
    assert.equal(b.has(SELECTED, { count: 1, limit: 200 }), true);
    const reads = b.requests().length;
    await b.click(EXPORT);
    assert.deepEqual(b.requests("transfer:export").at(-1)[1], { ids: ["profile-2"] });
    assert.deepEqual(JSON.parse(await fs.readFile(f.resultFile, "utf8")).profiles.map(row => row.id), ["profile-2"]);
    assert.equal(b.requests().length, reads, "export cannot change the roster");

    const disposed = b.holdRead();
    f.ping();
    await disposed.arrived.promise;
    a.unmount(); b.unmount();
    assert.equal(a.subscriptions.some(s => s.active), false);
    assert.equal(b.subscriptions.some(s => s.active), false);
    const count = [a.requests().length, b.requests().length];
    try {
      await f.engine.commitProfiles([{ id: "not-in-dead-component", name: "New after unmount", number: 3 }]);
      await settle();
      assert.deepEqual([a.requests().length, b.requests().length], count);
    } finally { disposed.release.resolve(safeFailure(f.chosen)); await settle(); }
    assert.equal(b.has(STALE_LIST), false);

    const fresh = f.client();
    await fresh.mount();
    assert.ok(fresh.box("New after unmount"));
    assert.equal(fresh.requests().length, 1);
    fresh.unmount();
  });
}

test("visible 0/200/201 selection counts gate the exact host route; empty versus refresh failure", { timeout: 9000 }, async t => {
  const f = await fixture(t, { sqlite: false, count: 201 });
  const view = f.client();
  await view.mount();
  assert.equal(view.checks().length, 201);
  assert.equal(view.has(SELECTED, { count: 0, limit: 200 }), true);
  assert.equal(view.button(EXPORT).props.disabled, true);
  await view.click(EXPORT);
  assert.equal(view.requests("transfer:export").length, 0);
  view.checks().slice(0, 200).forEach(box => choose(box));
  assert.equal(view.has(SELECTED, { count: 200, limit: 200 }), true);
  assert.equal(view.button(EXPORT).props.disabled, false);
  f.save(async () => ({ canceled: true }));
  await view.click(EXPORT);
  assert.equal(f.calls.save, 1);
  choose(view.checks()[200]);
  assert.equal(view.has(SELECTED, { count: 201, limit: 200 }), true);
  assert.equal(view.button(EXPORT).props.disabled, true);
  await view.click(EXPORT);
  assert.equal(view.requests("transfer:export").length, 1);
  assert.equal(f.calls.save, 1);
  assert.equal(view.has("一次最多导出 {limit} 个窗口，请取消部分选择。", { limit: 200 }), true);
  const refresh = view.holdRead(), checking = view.click(REFRESH);
  await refresh.arrived.promise;
  try {
    assert.equal(view.checks().length, 201, "keep last good results during a manual refresh");
    await f.engine.commitProfiles(Array.from(f.engine.profiles.values(), row => ({ ...row, trashed: true })));
    await settle();
    assert.equal((await f.persisted()).filter(row => !row.trashed).length, 0);
    assert.equal(view.has("暂无窗口"), true, "a current, genuinely empty roster is different from failure");
  } finally { refresh.release.resolve(); await checking; }
  assert.equal(view.has("暂无窗口"), true);
  assert.equal(view.checks().length, 0);
  assert.equal(view.has(SELECTED, { count: 0, limit: 200 }), true);
  view.unmount();
});

"use strict";
const crypto = require("node:crypto");
const cdp = require("../cdp");
const DEFAULT_SHORTCUTS = Object.freeze({
  stopSync: "Ctrl + Alt + D",
  showAllWindows: "Ctrl + Alt + A",
  gridLayout: "Ctrl + Alt + F3",
  stackLayout: "Ctrl + Alt + F4",
  openBatchInputDialog: "Ctrl + Alt + F5",
  unifiedTabs: "Ctrl + Alt + X",
  closeOtherTabs: "Ctrl + Alt + B",
  closeCurrentTab: "Ctrl + Alt + C",
  closeBlankTabs: "Ctrl + Alt + N",
  openSites: "Ctrl + Alt + O",
  openSyncWindowList: "Ctrl + Alt + L",
  openPreferenceSettings: "Ctrl + Alt + P",
});
const ACTIONS = new Set([...Object.keys(DEFAULT_SHORTCUTS), "startSync"]);
function normalizeKeys(payload) {
  const values =
    payload?.[process.platform === "win32" ? "windows" : "mac"] || {};
  if (!values || typeof values !== "object" || Array.isArray(values))
    throw Error("无效快捷键设置");
  const entries = Object.entries(values).map(([action, value]) => {
    if (!ACTIONS.has(action) || typeof value !== "string" || value.length > 100)
      throw Error("无效快捷键");
    return [action, value.trim().replace(/\s*\+\s*/g, "+")];
  });
  return entries;
}
function syncSettings(p = {}) {
  return {
    keyboard: p.enableSyncKeybord,
    click: p.enableSyncMouseClick,
    scroll: p.enableSyncMouseScroll,
    track: p.enableSyncMouseMove,
    delayClick: p.enableClickDelay,
    delayInput: p.enableInputDelay,
    inputMinMs: p.inputIntervalMinMs,
    inputMaxMs: p.inputIntervalMaxMs,
    clickMinMs: p.clickIntervalMinMs,
    clickMaxMs: p.clickIntervalMaxMs,
    delayMode: p.clickDelayMode,
  };
}
class SyncService {
  constructor({
    engine,
    controller,
    state,
    workArea,
    textAssignments,
    windowAction,
    tabAction,
    shortcuts,
    shortcutAction,
  }) {
    Object.assign(this, {
      engine,
      controller,
      state,
      workArea,
      textAssignments,
      windowAction,
      tabAction,
      shortcuts,
      shortcutAction,
    });
    this.queue = Promise.resolve();
    this.registered = new Map();
    this.mainControlColor = "#FCFF12A3";
  }
  selection() {
    const ids = this.state().selected || [];
    if (!ids.length || ids.length > 200) throw Error("请选择 1–200 个同步窗口");
    const running = new Map(
      this.engine.runningWithCdp(ids).map((entry) => [entry.id, entry]),
    );
    if (ids.some((id) => !running.has(id)))
      throw Error("部分同步窗口已关闭或不支持 CDP");
    return ids.map((id) => running.get(id));
  }
  request(method, payload = {}) {
    if (this.closing)
      return Promise.reject(Error("应用正在退出，同步操作已停止接收"));
    const run = this.queue.then(() => this.dispatch(method, payload));
    this.queue = run.catch(() => undefined);
    return run;
  }
  async dispatch(method, p) {
    if (method === "sync:settings") {
      if (
        p.mainControlWindowColor !== undefined &&
        p.mainControlWindowColor !== this.mainControlColor
      ) {
        require('../automation/sync/master-window-color').parseColor(p.mainControlWindowColor);
        if(this.state().active){const entries=this.selection(),main=entries.find(entry=>entry.id===this.state().master)||entries[0];await require('../automation/sync/master-window-color').setWindowColor(main.item,p.mainControlWindowColor);this.coloredMaster=main;}
        this.mainControlColor = p.mainControlWindowColor;
      }
      return this.controller.updateSettings(syncSettings(p));
    }
    if(method==='sync:apply-color'){
      const entries=this.selection(),main=entries.find(entry=>entry.id===this.state().master)||entries[0];
      const result=await require('../automation/sync/master-window-color').setWindowColor(main.item,this.mainControlColor);this.coloredMaster=main;return result;
    }
    if(method==='sync:reset-color'){
      const main=this.coloredMaster;if(!main)return true;
      if(!main.item.cleanedUp&&!main.item.stopping)await require('../automation/sync/master-window-color').setWindowColor(main.item,'#C7CDD1');
      this.coloredMaster=null;return true;
    }
    if (method === "sync:restore") {
      const preferences = p.preferenceSettings || {};
      this.mainControlColor=preferences.base?.mainControlWindowColor||this.mainControlColor;
      this.controller.updateSettings(
        syncSettings({ ...preferences.base, ...preferences.simulate }),
      );
      const keys = preferences.shortcutKey || {
        windows: DEFAULT_SHORTCUTS,
        mac: { ...DEFAULT_SHORTCUTS, startSync: "Ctrl + Alt + S" },
      };
      const checked = await this.dispatch("sync:shortcuts:check", keys);
      // A desktop may reject global shortcuts (including headless sessions).
      // Preserve those real statuses without preventing basic synchronization.
      if (Object.values(checked).every((row) => row.status))
        return this.dispatch("sync:shortcuts:register", keys);
      return checked;
    }
    if (method === "sync:shortcuts:clear") {
      this.clearShortcuts();
      return true;
    }
    if (method === "sync:master-bounds") {
      if (!this.state().selected?.length) return null;
      const entries = this.selection();
      const main =
        entries.find((entry) => entry.id === this.state().master) || entries[0];
      return (await cdp.windowForPort(main.item.port)).bounds;
    }
    if (method === "sync:layout") {
      const entries = this.selection(),
        ids = entries.map((entry) => entry.id);
      if (p.type === "grid" || p.type === "stack")
        return this.windowAction({
          ids,
          action: p.type === "grid" ? "tile" : "cascade",
        });
      if (p.type !== "custom") throw Error("未知布局类型");
      const integer = (value, min, max, name) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < min || n > max)
          throw Error("无效布局参数: " + name);
        return n;
      };
      const width = integer(p.w, 320, 16384, "width"),
        height = integer(p.h, 240, 16384, "height"),
        horizontal = integer(p.gap_horizontal ?? 0, 0, 4096, "horizontal gap"),
        vertical = integer(p.gap_vertical ?? 0, 0, 4096, "vertical gap"),
        columns = integer(p.count_per_row, 1, 1000, "columns"),
        area = this.workArea();
      this.controller.pauseGeometrySync(3500, "local-custom-layout");
      const outcomes = await Promise.allSettled(
        entries.map(({ item }, index) =>
          cdp.setWindowBounds(item.port, {
            left: area.x + (index % columns) * (width + horizontal),
            top: area.y + Math.floor(index / columns) * (height + vertical),
            width,
            height,
          }),
        ),
      );
      const failures = outcomes.flatMap((row, index) =>
        row.status === "rejected"
          ? [{ id: ids[index], message: row.reason.message }]
          : [],
      );
      if (failures.length)
        throw Object.assign(
          Error(
            "部分窗口布局失败: " +
              failures.map((row) => row.message).join("; "),
          ),
          { failures },
        );
      return { success: true, count: entries.length };
    }
    if (method === "sync:batch-text") {
      let entries = this.selection();
      const texts = new Map();
      const text = (value) => {
        if (typeof value !== "string" || value.length > 100000)
          throw Error("文本必须少于 100000 字符");
        return value;
      };
      if (p.mode === "same") {
        const value = text(p.data);
        if (!value.trim()) throw Error("请输入文本");
        for (const entry of entries) texts.set(entry.id, value);
      } else if (p.mode === "diff") {
        if (!p.data || typeof p.data !== "object" || Array.isArray(p.data))
          throw Error("无效差异文本");
        const byPid = new Map(
          entries.map((entry) => [
            String(
              entry.item.process?.pid ||
                entry.item.pid ||
                this.engine.status().find((row) => row.id === entry.id)?.pid,
            ),
            entry.id,
          ]),
        );
        for (const [pid, value] of Object.entries(p.data)) {
          if (!byPid.has(pid)) throw Error("差异文本引用了未选择的进程");
          texts.set(byPid.get(pid), text(value));
        }
        entries = entries.filter((entry) => texts.has(entry.id));
        if (!entries.length) throw Error("请输入差异文本");
      } else if (p.mode === "random") {
        const min = Number(p.data?.min),
          max = Number(p.data?.max),
          decimals = Number(p.data?.decimal_place_count ?? 1),
          type = p.data?.data_type;
        if (
          ![min, max].every(Number.isFinite) ||
          min >= max ||
          min < -1e9 ||
          max > 1e9 ||
          !["int", "float"].includes(type) ||
          !Number.isInteger(decimals) ||
          decimals < 1 ||
          decimals > 10 ||
          (type === "int" && (!Number.isInteger(min) || !Number.isInteger(max)))
        )
          throw Error("无效随机数范围或精度");
        for (const entry of entries)
          texts.set(
            entry.id,
            type === "int"
              ? String(crypto.randomInt(min, max + 1))
              : (
                  min +
                  (crypto.randomBytes(6).readUIntBE(0, 6) / 2 ** 48) *
                    (max - min)
                ).toFixed(decimals),
          );
      } else throw Error("未知批量输入模式");
      if (typeof p.append !== "boolean") throw Error("无效追加选项");
      const ids = entries.map((entry) => entry.id),
        previous = this.controller.getSettings();
      // Native text input itself generates master input events. Gate mirroring
      // until the native runner has filled every destination exactly once.
      this.controller.updateSettings({ keyboard: false, click: false });
      try {
        const deadline = Date.now() + 12000;
        while (this.controller.forwardQueueRunning) {
          if (Date.now() > deadline)
            throw Error("同步事件队列未能完成，请重试批量输入");
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        const verify = (result) => {
          if (!result.success)
            throw Error(
              "批量输入失败: " +
                result.failures
                  .map((row) => row.id + ": " + row.message)
                  .join("; "),
            );
          return result;
        };
        if (!p.append)
          verify(
            await this.textAssignments({
              ids,
              allowClear: true,
              clearAction: "clear",
              resolveText: () => "",
            }),
          );
        const result = verify(
          await this.textAssignments({
            ids,
            resolveText: (id) => texts.get(id),
          }),
        );
        // Drain bindings on the controller's own CDP streams before restoring
        // input gates, including the native clear operation's change event.
        await Promise.all(
          [...(this.controller.connections?.values() || [])].map((value) =>
            value.connection.command("Runtime.evaluate", {
              expression: "void 0",
            }),
          ),
        );
        return result;
      } finally {
        this.controller.updateSettings({
          keyboard: previous.keyboard,
          click: previous.click,
        });
      }
    }
    if (method === "sync:open-sites") {
      const entries = this.selection();
      if (
        !Array.isArray(p.urls) ||
        !p.urls.length ||
        p.urls.length > 50 ||
        typeof p.replaceCurrentTab !== "boolean"
      )
        throw Error("请输入 1–50 个网址");
      const urls = p.urls.map((value) => {
        if (typeof value !== "string" || value.length > 8192)
          throw Error("无效网址");
        const url = new URL(value);
        if (
          !["http:", "https:", "about:"].includes(url.protocol) ||
          (url.protocol === "about:" && url.href !== "about:blank")
        )
          throw Error("仅支持 HTTP(S) 网址或 about:blank");
        return url.href;
      });
      // The active controller already mirrors master tab creation. Issuing the
      // same command to every slave creates duplicate tabs during reconciliation.
      const state = this.state();
      const ids =
        state.active && state.master
          ? [entries.find((entry) => entry.id === state.master)?.id].filter(
              Boolean,
            )
          : entries.map((entry) => entry.id);
      if (!ids.length) throw Error("同步主控窗口已关闭");
      for (const [index, url] of urls.entries()) {
        const result = await this.tabAction({
          ids,
          action: index === 0 && p.replaceCurrentTab ? "navigate" : "new",
          payload: { url },
        });
        if (!result.success || result.count !== ids.length)
          throw Error("部分窗口打开网址失败");
      }
      return {
        success: true,
        count: ids.length,
        urls: urls.length,
        mirroredByController: !!state.active,
      };
    }
    if (
      method === "sync:shortcuts:check" ||
      method === "sync:shortcuts:register"
    ) {
      const entries = normalizeKeys(p),
        counts = new Map();
      for (const [, key] of entries)
        if (key)
          counts.set(
            key.toLowerCase(),
            (counts.get(key.toLowerCase()) || 0) + 1,
          );
      const owned = new Set(
        [...this.registered.values()].map((row) => row.accelerator),
      );
      const results = {};
      for (const [action, accelerator] of entries) {
        let status = !accelerator;
        if (accelerator && counts.get(accelerator.toLowerCase()) === 1) {
          if (owned.has(accelerator)) status = true;
          else if (!this.shortcuts.isRegistered(accelerator)) {
            try {
              status = this.shortcuts.register(accelerator, () => {});
            } catch {
              status = false;
            }
            if (status) this.shortcuts.unregister(accelerator);
          }
        }
        results[action] = { accelerator, status };
      }
      if (method.endsWith(":check")) return results;
      if (Object.values(results).some((row) => !row.status))
        throw Error("快捷键与系统冲突或当前桌面无法注册");
      const previous = new Map(this.registered);
      this.clearShortcuts();
      try {
        for (const [action, accelerator] of entries)
          if (accelerator) {
            if (
              !this.shortcuts.register(accelerator, () =>
                this.shortcutAction(action),
              )
            )
              throw Error("快捷键注册失败: " + accelerator);
            this.registered.set(action, { accelerator });
          }
      } catch (error) {
        this.clearShortcuts();
        for (const [action, row] of previous) {
          if (
            this.shortcuts.register(row.accelerator, () =>
              this.shortcutAction(action),
            )
          )
            this.registered.set(action, row);
        }
        throw error;
      }
      return results;
    }
    throw Error("未实现的同步本地方法: " + method);
  }
  clearShortcuts() {
    for (const { accelerator } of this.registered.values())
      this.shortcuts.unregister(accelerator);
    this.registered.clear();
  }
  async shutdown() {
    this.closing = true;
    await this.queue;
    await this.dispatch('sync:reset-color',{});
    this.clearShortcuts();
  }
}
module.exports = { SyncService, DEFAULT_SHORTCUTS, syncSettings };

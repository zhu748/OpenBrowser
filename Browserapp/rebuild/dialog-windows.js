"use strict";
const path = require("node:path");
const { DOCUMENT, isUiDocument } = require("./protocol");
const {
  attachShellNavigationGuard,
  createShellNavigationPolicy,
} = require("../automation/shell-guard");
// Sizes and frameless-window flags come from the original dialog modules.
const SPECS = Object.freeze({
  preferences: {
    width: 500,
    height: 500,
    tabs: ["base", "customLayout", "simulate", "shortcutKey"],
  },
  "batch-inputs": { width: 450, height: 374, tabs: ["same", "diff", "random"] },
  "open-sites": { width: 450, height: 350 },
  "syncing-window-list": { width: 480, height: 350 },
});
class DialogWindows {
  constructor({ BrowserWindow, parent, windows }) {
    this.BrowserWindow = BrowserWindow;
    this.parent = parent;
    this.windows = windows;
    this.entries = new Map();
  }
  owns(contents) {
    return [...this.entries.values()].some(
      ({ window }) => !window.isDestroyed() && window.webContents === contents,
    );
  }
  async request(method, payload = {}, sender) {
    const kind = payload.kind,
      spec =
        typeof kind === "string" && Object.hasOwn(SPECS, kind)
          ? SPECS[kind]
          : null;
    if (method === "ui:dialog:open") {
      if (!spec) throw Error("未知本地弹窗");
      const existing = this.entries.get(kind);
      if (existing) {
        await existing.ready;
        if (!existing.window.isDestroyed()) {
          existing.window.show();
          existing.window.focus();
        }
        return { kind };
      }
      if (payload.tab !== undefined && !spec.tabs?.includes(payload.tab))
        throw Error("无效弹窗标签");
      const window = new this.BrowserWindow({
        width: spec.width,
        height: spec.height,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        show: false,
        skipTaskbar: true,
        hasShadow: true,
        parent: this.parent(),
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.resolve(__dirname, "../preload.js"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          spellcheck: false,
        },
      });
      // Some Electron compositors create hidden, fixed-size child windows at
      // 1×1. Apply the original content dimensions before locking the window.
      window.setResizable(true);
      window.setContentSize(spec.width, spec.height);
      window.setResizable(false);
      const entry = { window, ready: null };
      this.entries.set(kind, entry);
      this.windows.add(window);
      window.on("closed", () => {
        this.entries.delete(kind);
        this.windows.delete(window);
      });
      attachShellNavigationGuard(window.webContents, {
        policy: createShellNavigationPolicy({ localUi: true }),
      });
      const url = new URL(DOCUMENT);
      url.searchParams.set("dialog", kind);
      if (payload.tab) url.searchParams.set("tab", payload.tab);
      entry.ready = window
        .loadURL(url.href)
        .then(() => {
          if (!window.isDestroyed()) window.show();
        })
        .catch((error) => {
          if (!window.isDestroyed()) window.destroy();
          throw error;
        });
      await entry.ready;
      return { kind };
    }
    const entry = [...this.entries.values()].find(
      ({ window }) => !window.isDestroyed() && window.webContents === sender,
    );
    if (!entry || !isUiDocument(sender.getURL()))
      throw Error("弹窗操作来源无效");
    if (method === "ui:dialog:show") {
      entry.window.show();
      return true;
    }
    if (method === "ui:dialog:close") {
      // Let the invoke response reach the renderer before destroying its context.
      setImmediate(() => {
        if (!entry.window.isDestroyed()) entry.window.close();
      });
      return true;
    }
    if (method === "ui:dialog:resize") {
      const { width, height } = payload;
      if (
        ![width, height].every(
          (value) => Number.isFinite(value) && value >= 200 && value <= 2048,
        )
      )
        throw Error("无效弹窗尺寸");
      entry.window.setResizable(true);
      try {
        entry.window.setSize(Math.ceil(width), Math.ceil(height));
      } finally {
        entry.window.setResizable(false);
      }
      return true;
    }
    throw Error("未知弹窗操作");
  }
  closeAll() {
    for (const { window } of this.entries.values())
      if (!window.isDestroyed()) window.destroy();
  }
}
module.exports = { DialogWindows, SPECS };

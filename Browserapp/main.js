const { app, BrowserWindow, Menu, clipboard, dialog, globalShortcut, ipcMain, nativeImage, screen, session, shell, Tray } = require('./host-bridge');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const cdp = require('./cdp');
const { BrowserEngine } = require('./engine');
const { registerExtensionIpc } = require('./main/extensions-ipc');
const { registerKernelIpc } = require('./main/kernel-ipc');
const { registerProfileIpc } = require('./main/profile-ipc');
const { registerAutomationControlIpc } = require('./main/automation-ipc');
const { collectStorageDiagnostics } = require('./automation/storage-diagnostics');
const { LiveSyncController } = require('./live-sync-v5');

// Host process performance (Win / macOS / Linux): cut background timers and idle GPU work.
try {
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  if (process.env.OPENBROWSER_LOW_POWER === '1') {
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-software-rasterizer');
  }
} catch (_) {}

const { planGridFor, minHeightFor } = require('./automation/window-arrangement');
const { attachShellNavigationGuard } = require('./automation/shell-guard');
const { fetchStoreEntries } = require('./automation/store-fetch');
const { fetchStorePackage, fetchChromeStoreIcon, fetchChromeStoreMetadata, validChromeStoreId } = require('./chrome-store-metadata');
const { startAutomation } = require('./automation');
const cloudSync = require('./automation/cloud-sync');

const { ensureDataRootIsolationSecure, terminateProcessesUsingProfile, sanitizeIds } = require('./automation/isolation');
const { createCrashHandler, buildHelperProcessGoneReport } = require('./automation/crash-report');
const { writeBrowserStartupDiagnostic } = require('./engine/diagnostics');
const appUpdate = require('./automation/app-update');
const settingsStore = require('./automation/local-settings');
const cloudOps = require('./automation/cloud-ops');
const { lifecycleTimeout } = require('./engine/browser-candidates');

const appDataRoot = app.getPath('appData');
const userDataRoot = process.env.OPENBROWSER_USER_DATA
  ? path.resolve(process.env.OPENBROWSER_USER_DATA) : path.join(appDataRoot, 'openbrowser');
app.setName('OpenBrowser');
try { process.title = 'OpenBrowser'; } catch (_) { /* ignore */ }
// Guard: root/sudo would isolate configs under /var/root and break CPU/memory UI sync.
try {
  const uid = typeof process.getuid === 'function' ? process.getuid() : null;
  const euid = typeof process.geteuid === 'function' ? process.geteuid() : null;
  if (uid === 0 || euid === 0) {
    console.error('[OpenBrowser] refuse to run as root/sudo — userData would split from normal user profiles.');
    app.exit(2);
  }
} catch (_) { /* ignore */ }
app.setPath('userData', userDataRoot);

// Single instance: a second launch (e.g. while the app sits in the tray) focuses the
// running window instead of spawning a copy. This only limits the app shell — browser
// environments are kernel processes spawned per profile and are not affected.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => showMainWindow());
}

const defaultProfileDataRoot = path.join(app.getPath('userData'), 'browser-profiles-v2');
const localSettingsFile = path.join(app.getPath('userData'), 'openbrowser-local-settings.json');

// Global async-failure safety net: without these handlers a rejected promise
// that escapes its call chain crashes the main process (Node treats unhandled
// rejections as fatal) and an uncaught exception ends the session with no
// diagnostics on disk. Log both to the console and to a file under userData,
// then keep serving — the desktop shell should not die from a background task.
function logGlobalFailure(kind, error) {
  try {
    const line = error && error.stack ? error.stack : String(error);
    console.error(`[OpenBrowser] ${kind}: ${line}`);
    try {
      const logsDir = path.join(app.getPath('userData'), 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.appendFileSync(path.join(logsDir, 'main-exceptions.log'),
        `${new Date().toISOString()} ${kind} ${line}\n`);
    } catch (_) {}
  } catch (_) {}
}
process.on('unhandledRejection', (reason) => logGlobalFailure('unhandledRejection', reason));
process.on('uncaughtException', (error) => logGlobalFailure('uncaughtException', error));

// --- Updater, settings, and cloud operations live in automation/ ---
// app-update.js: release checks, fail-closed signed downloads, status watcher.
// local-settings.js: encrypted settings cache + coalesced disk writer.
// cloud-ops.js: backup / restore / per-profile push-pull pipelines.
settingsStore.initLocalSettings({ file: localSettingsFile, defaultProfileDataRoot });
appUpdate.configureAppUpdateBroadcast(emit);
cloudOps.initCloudOps({
  getEngine: () => engine,
  getAutomation: () => automation,
  emit,
  getSettings: settingsStore.getLocalSettings,
  saveSettings: settingsStore.saveLocalSettings,
});

async function updateProfileDataRoot(value) {
  if (!engine) throw new Error('Browser engine is not ready');
  if (engine.running.size) throw new Error('\u8bf7\u5148\u505c\u6b62\u6240\u6709\u73af\u5883\uff0c\u518d\u4fee\u6539\u6570\u636e\u4fdd\u5b58\u4f4d\u7f6e');
  const profileDataRoot = settingsStore.normalizeProfileDataRoot(value);
  const secureCheck = await ensureDataRootIsolationSecure(profileDataRoot);
  if (!secureCheck.ok) throw new Error(secureCheck.message);
  engine.setProfileDataRoot(profileDataRoot);
  await settingsStore.saveLocalSettings({ ...settingsStore.getLocalSettings(), profileDataRoot });
  emit({ type: 'storage-settings', profileRoot: profileDataRoot });
  return { success: true, profileRoot: profileDataRoot, defaultProfileRoot: defaultProfileDataRoot };
}
let engine;
let liveSync;
let automation = null;
let resolveStartupReady;
let rejectStartupReady;
const startupReady = new Promise((resolve, reject) => { resolveStartupReady = resolve; rejectStartupReady = reject; });
startupReady.catch(() => {});
let quitting = false;
let quitCleanupPromise = null;
let quitCleanupSettled = false;
let syncSelection = [];
let syncState = { active: false, master: null, selected: [] };
const windows = new Set();
let mainWindow = null;

function trustedAppIndexUrl() {
  // Canonical UI document: only this exact file:// path may call registerTrustedIpc.
  // Reject other file:///…/index.html (e.g. /tmp/malicious/index.html) even if loaded in mainWindow.
  return pathToFileURL(path.join(__dirname, 'index.html')).href;
}

/** Windows file: URLs may differ only by drive-letter case (C: vs c:). Compare paths case-insensitively. */
function isTrustedAppIndexUrl(senderUrl) {
  const expected = trustedAppIndexUrl();
  const raw = String(senderUrl || '');
  if (raw === expected || raw.startsWith(expected + '?') || raw.startsWith(expected + '#')) return true;
  if (process.platform !== 'win32') return false;
  const lower = raw.toLowerCase();
  const expectedLower = expected.toLowerCase();
  return lower === expectedLower || lower.startsWith(expectedLower + '?') || lower.startsWith(expectedLower + '#');
}

function assertTrustedIpcSender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event?.sender !== mainWindow.webContents) {
    throw new Error('untrusted IPC sender');
  }
  const senderUrl = String(event.sender.getURL?.() || '');
  if (!isTrustedAppIndexUrl(senderUrl)) {
    throw new Error('untrusted IPC document');
  }
}

function registerTrustedIpc(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedIpcSender(event);
    return handler(event, ...args);
  });
}

/**
 * Navigation confinement for every Electron webContents.
 *
 * The window's preload exposes the full `ops` IPC surface, so nothing but the
 * app's own index.html may ever run inside this app. Two layers already exist
 * (the webRequest URL filter blocks remote http(s), assertTrustedIpcSender
 * rejects IPC from any other document), but the webRequest filter lets every
 * file: and data: URL through, and popup windows were entirely unguarded: a
 * window.open would create a child window with the preload attached and no
 * origin restrictions of its own. Closing both: navigation is only allowed to
 * the trusted app index (devtools: URLs keep working), and popups are denied
 * outright — the renderer has no window.open usage, so deny-all breaks
 * nothing while removing an uncontrolled window surface.
 */
function confineWebContents(contents) {
  try {
    contents.on('will-navigate', (event, url) => {
      const target = String(url || '');
      if (target.startsWith('devtools:')) return;
      if (!isTrustedAppIndexUrl(target)) {
        event.preventDefault();
        console.warn('[OpenBrowser] blocked navigation to untrusted URL:', target);
      }
    });
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  } catch (error) {
    console.warn('OpenBrowser webContents confinement setup failed:', error.message);
  }
}
app.on('web-contents-created', (_event, contents) => confineWebContents(contents));
let shortcutBridge = null;
let shortcutFallbackRegistered = false;
// Accelerators registered by the fallback bridge and by the text shortcuts,
// so stopShortcutBridge can unregister exactly its own keys instead of
// unregisterAll() (which would silently drop the text shortcuts if this ever
// runs outside the quit path).
let registeredShortcutAccelerators = [];

function trackRegisteredShortcuts(shortcuts, registered) {
  const successfullyRegistered = new Set(registeredShortcutAccelerators);
  for (let index = 0; index < registered.length; index += 1) {
    if (registered[index]?.registered) successfullyRegistered.add(registered[index].accelerator);
  }
  registeredShortcutAccelerators = [...successfullyRegistered];
  void shortcuts;
}

function unregisterTrackedShortcuts() {
  for (const accelerator of registeredShortcutAccelerators) {
    try { globalShortcut.unregister(accelerator); } catch (_) {}
  }
  registeredShortcutAccelerators = [];
}
let shortcutActionInFlight = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function emit(value) {
  // Per-window isolation: webContents.send on a window destroyed between the
  // isDestroyed() check and the send throws and would break the fan-out to the
  // remaining windows — and with it every engine cleanup path that emits.
  for (const win of windows) {
    try {
      if (!win.isDestroyed()) win.webContents.send('engine:event', value);
    } catch (error) {
      console.error('[OpenBrowser] engine event dispatch failed:', error?.message || error);
    }
  }
}

function pickWorkArea() {
  try {
    const point = screen.getCursorScreenPoint?.();
    if (point) return screen.getDisplayNearestPoint(point).workArea;
  } catch (_) {}
  return screen.getPrimaryDisplay().workArea;
}

// Real display scale of the screen the user is on. The managed browser kernel used to be
// launched with a hardcoded --force-device-scale-factor=1, which renders its chrome (tabs,
// toolbar, icons, text) at 100% on a 125%/150%/200% Windows display so everything looked
// too small. Return the display's actual scale factor so the kernel matches the OS; return
// null when it cannot be determined (or off Windows) so callers fall back to the old default.
function pickDisplayScaleFactor() {
  if (process.platform !== 'win32') return null;
  try {
    let display = null;
    const point = screen.getCursorScreenPoint?.();
    if (point) display = screen.getDisplayNearestPoint(point);
    if (!display) display = screen.getPrimaryDisplay();
    const factor = Number(display?.scaleFactor);
    if (!Number.isFinite(factor) || factor <= 0) return null;
    return Math.round(factor * 100) / 100;
  } catch (_) {
    return null;
  }
}

let tray = null;
const forceCloseWindowIds = new Set();

function closeActionStrings() {
  const zh = /^zh/i.test(String(app.getLocale?.() || ''));
  if (zh) {
    return {
      message: '最小化到托盘，还是退出程序？',
      minimize: '最小化到托盘',
      quit: '退出程序',
      remember: '记住我的选择',
      trayShow: '显示主窗口',
      trayQuit: '退出 OpenBrowser',
      trayTooltip: 'OpenBrowser 正在后台运行，点击恢复主窗口',
    };
  }
  return {
    message: 'Minimize to tray, or quit?',
    minimize: 'Minimize to tray',
    quit: 'Quit',
    remember: 'Remember my choice',
    trayShow: 'Show OpenBrowser',
    trayQuit: 'Quit OpenBrowser',
    trayTooltip: 'OpenBrowser is running in the background — click to restore',
  };
}

function trayIconImage() {
  const pixelPng = path.join(__dirname, 'assets', 'logo-pixel.png');
  const png = path.join(__dirname, 'assets', 'logo.png');
  const ico = path.join(__dirname, 'assets', 'logo.ico');
  const source = fs.existsSync(pixelPng) ? pixelPng : (fs.existsSync(png) ? png : ico);
  let image = nativeImage.createFromPath(source);
  if (process.platform === 'win32' && !image.isEmpty()) image = image.resize({ width: 16, height: 16 });
  return image;
}

function ensureTray() {
  if (tray || process.platform === 'darwin') return;
  const strings = closeActionStrings();
  tray = new Tray(trayIconImage());
  tray.setToolTip(strings.trayTooltip);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: strings.trayShow, click: () => showMainWindow() },
    { type: 'separator' },
    { label: strings.trayQuit, click: () => app.quit() },
  ]));
  // Windows: left click restores the window, right click opens the menu.
  tray.on('click', () => showMainWindow());
}

function destroyTray() {
  try { tray?.destroy(); } catch (_) {}
  tray = null;
}

function hideMainWindowToTray(win) {
  ensureTray();
  win.hide();
}

function showMainWindow() {
  const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  if (!win) {
    createWindow().catch((error) => console.error('[OpenBrowser] window restore failed:', error?.message || error));
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

async function askCloseAction(win) {
  const strings = closeActionStrings();
  const { response, checkboxChecked } = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: [strings.minimize, strings.quit],
    defaultId: 0,
    cancelId: 1,
    message: strings.message,
    checkboxLabel: strings.remember,
    checkboxChecked: false,
    noLink: true,
  });
  return { mode: response === 0 ? 'tray' : 'exit', remember: Boolean(checkboxChecked) };
}

function clampBoundsToWorkArea(bounds, work) {
  const norm = normalizeBounds(bounds);
  const width = Math.max(320, Math.min(norm.width, work.width));
  const height = Math.max(240, Math.min(norm.height, work.height));
  const maxX = work.x + Math.max(0, work.width - width);
  const maxY = work.y + Math.max(0, work.height - height);
  const left = Math.max(work.x, Math.min(maxX, norm.left));
  const top = Math.max(work.y, Math.min(maxY, norm.top));
  return { left, top, width, height };
}

function normalizeBounds(bounds) {
  return {
    left: Math.round(Number(bounds.left) || 0),
    top: Math.round(Number(bounds.top) || 0),
    width: Math.max(320, Math.round(Number(bounds.width) || 800)),
    height: Math.max(240, Math.round(Number(bounds.height) || 600)),
  };
}

async function tile(ids, cascade = false, matrix = null) {
  const entries = engine.runningWithCdp(sanitizeIds(ids));
  if (!entries.length) throw new Error('No selected browser has a CDP session');
  const work = pickWorkArea();
  // Pause geometry mirroring while we rearrange so live-sync does not fight tile layout.
  let cols = 1;
  let rows = 1;
  let overcrowded = false;
  liveSync?.pauseGeometrySync?.(3500, cascade ? 'manual-cascade' : 'manual-tile');
  if (liveSync) liveSync.lastWindowSync = Date.now();
  if (matrix) {
    const { planMatrix } = require('./automation/window-arrangement');
    const bounds = planMatrix({ totalWindows: entries.length, workArea: work,
      rows: matrix.rows, cols: matrix.cols, gap: matrix.gap,
      minWidth: 320, minHeight: Math.max(240, minHeightFor(process.platform)) });
    await Promise.all(entries.map(({ item }, index) => cdp.setWindowBounds(item.port, bounds[index])));
  } else if (cascade) {
    // Cascade layout: left + vs * index
    const { computeCascadeBounds } = require('./automation/protocol/window-sync-protocol');
    const width = Math.max(760, work.width - 220);
    const height = Math.max(560, work.height - 180);
    const layout = computeCascadeBounds(entries.map((e) => e.id), {
      left: work.x, top: work.y, width, height, vs: 38,
      workWidth: work.width, workHeight: work.height,
    });
    await Promise.all(entries.map(({ item }, index) => {
      const raw = layout[index]?.bounds || {
        left: work.x + ((index * 38) % Math.max(1, work.width - width)),
        top: work.y + ((index * 34) % Math.max(1, work.height - height)),
        width,
        height,
      };
      return cdp.setWindowBounds(item.port, clampBoundsToWorkArea(raw, work));
    }));
  } else {
    // Choose the grid by fitting the work area, not by taking the square root
    // of the count. A near-square grid can come out shorter than a window is
    // allowed to be; the minimum size is then enforced anyway and the rows
    // collapse into each other. The planner searches every column count and
    // keeps the roomiest one that still satisfies both minimums, and reports
    // when nothing does instead of silently building an overlapping layout.
    const count = entries.length;
    const grid = planGridFor({
      totalWindows: count,
      workArea: work,
      // Match the floor the bounds clamp actually enforces, raised to the
      // taller platform minimum where one exists.
      minWidth: 320,
      minHeight: Math.max(240, minHeightFor(process.platform)),
    });
    cols = grid.cols;
    rows = grid.rows;
    overcrowded = grid.overcrowded;
    const baseWidth = Math.floor(work.width / cols);
    const baseHeight = Math.floor(work.height / rows);
    await Promise.all(entries.map(({ item }, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const isLastCol = col === cols - 1;
      const isLastRow = row === rows - 1;
      const width = isLastCol ? Math.max(320, work.width - col * baseWidth) : baseWidth;
      const height = isLastRow ? Math.max(240, work.height - row * baseHeight) : baseHeight;
      return cdp.setWindowBounds(item.port, clampBoundsToWorkArea({
        left: work.x + col * baseWidth,
        top: work.y + row * baseHeight,
        width,
        height,
      }, work));
    }));
  }
  liveSync?.pauseGeometrySync?.(5000, cascade ? 'manual-cascade-settle' : 'manual-tile-settle');
  return {
    success: true,
    count: entries.length,
    mode: matrix ? 'matrix' : cascade ? 'cascade' : 'tile',
    platform: process.platform,
    workArea: work,
    // True when the selected layout cannot give every window its minimum
    // size, so callers can warn instead of presenting an unusable result.
    overcrowded: cascade ? undefined : overcrowded,
  };
}

function isEnvironmentStartUrl(value) {
  const s = String(value || '');
  // Session-exact judgement first: the start-page server matches its own port
  // and its registered sessions (mixin fallback covers the boot window).
  // The previous loose `openbrowser-start|openbrowser-native` substring rule
  // let any third-party URL containing those words be treated as an internal
  // start page (reload/mirror-sync hazard); the substring match now only
  // recognises the exact file name we generate for the file:// fallback.
  if (Boolean(engine?.isStartPageUrl?.(s))) return true;
  return /^file:\/\/\//i.test(s) && /openbrowser-start\.html$/i.test(s);
}

function environmentStartUrl(entry) {
  // Prefer live start URL from running session (http://127.0.0.1:PORT/?id=...)
  if (entry?.item?.startUrl) return entry.item.startUrl;
  if (entry?.id && engine?.running?.get?.(entry.id)?.startUrl) {
    return engine.running.get(entry.id).startUrl;
  }
  try {
    const profile = entry?.item?.profile || engine?.profiles?.get?.(entry?.id);
    if (profile && engine?.startPageServer) {
      return engine.startPageServer.buildUrl(profile);
    }
  } catch (_) {}
  const root = entry?.item?.root || entry?.root;
  if (!root) return null;
  // pathToFileURL percent-encodes spaces / CJK so Windows profiles under "C:\Users\Foo Bar\..." work.
  return pathToFileURL(path.join(root, 'openbrowser-start.html')).href;
}

// --- Internal Browser Page Synchronization Rules (Issue #19) ---
// Internal WebUI pages (chrome://, edge://) can be mirrored initially across browsers
// via CDP navigation, but cannot participate in DOM live-sync due to Chromium security sandbox.
const MAX_SYNC_TABS = 20;

const {
  BLOCKED_INTERNAL_SCHEMES,
  BLOCKED_INTERNAL_HOSTS,
  ALLOWED_INTERNAL_HOSTS,
  ALLOWED_INTERNAL_PAGES,
  isNavigableInternalUrl,
  isDangerousOrBlockedInternalUrl,
  createTabUrlPolicy,
} = require('./automation/protocol/internal-pages');

const { canMirrorTabUrl, canDomLiveSyncTabUrl } = createTabUrlPolicy({ isEnvironmentStartUrl });

async function syncTabsFromMaster(ids) {
  const entries = engine.runningWithCdp(sanitizeIds(ids));
  if (entries.length < 2) throw new Error('Select at least two running browser environments');
  const masterEntry = entries[0];
  const slaveEntries = entries.slice(1);

  // Filter master tabs: mirror normal web pages and navigable internal pages,
  // excluding dangerous or malformed URLs. Cap at MAX_SYNC_TABS.
  const masterTabs = (await cdp.tabs(masterEntry.item.port)).filter((tab) => canMirrorTabUrl(tab?.url));
  const urls = masterTabs.map((tab) => tab.url).filter(Boolean).slice(0, MAX_SYNC_TABS);

  // Slaves are independent of each other: mirror them in parallel and keep
  // each slave's tab order sequential inside its own loop (the existing[index]
  // mapping needs that order). The serial version cost one CDP round trip per
  // slave × tab — 10 slaves × 20 tabs was ~200 serial waits (10-30s) on the
  // begin-sync path the user watches.
  const slaveSummaries = await Promise.all(slaveEntries.map(async (slave) => {
    const summary = { id: slave.id, mirrored: 0, failed: 0, errors: [] };
    try {
      const existing = (await cdp.tabs(slave.item.port)).filter((tab) => canMirrorTabUrl(tab?.url));
      for (let index = 0; index < urls.length; index += 1) {
        const sourceUrl = urls[index];
        const targetUrl = isEnvironmentStartUrl(sourceUrl) ? (environmentStartUrl(slave) || sourceUrl) : sourceUrl;
        try {
          if (existing[index]) {
            await cdp.call(existing[index].webSocketDebuggerUrl, 'Page.navigate', { url: targetUrl })
              .catch(() => cdp.navigate(slave.item.port, targetUrl));
          } else {
            await cdp.newTab(slave.item.port, targetUrl);
          }
          summary.mirrored += 1;
        } catch (tabError) {
          // Failure isolation: failure on an internal or invalid tab navigation
          // must not block synchronization for subsequent normal pages.
          summary.failed += 1;
          summary.errors.push({ url: targetUrl, error: String(tabError?.message || tabError) });
        }
      }
    } catch (slaveError) {
      summary.errors.push({ url: null, error: String(slaveError?.message || slaveError) });
    }
    return summary;
  }));

  const liveSyncEligibleUrls = urls.filter(canDomLiveSyncTabUrl);
  const internalMirrorOnlyUrls = urls.filter(isNavigableInternalUrl);

  return {
    success: true,
    master: masterEntry.id,
    slaves: slaveEntries.length,
    tabCount: urls.length,
    mirroredUrls: urls,
    liveSyncEligibleCount: liveSyncEligibleUrls.length,
    internalMirrorCount: internalMirrorOnlyUrls.length,
    mirrorOnlyCount: internalMirrorOnlyUrls.length,
    slaveSummaries,
  };
}

function syncSnapshot() { return { ...syncState, selected: [...syncState.selected] }; }

function handleLiveSyncEvent(value) {
  emit(value);
  if ((value.type === 'sync-disconnected' || (value.type === 'live-sync' && value.active === false)) && syncState.active) {
    syncState = { active: false, master: null, selected: [...syncSelection] };
    emit({ type: 'sync-state', ...syncSnapshot(), reason: value.type });
  }
}

async function beginSync(ids = syncSelection) {
  let selected = sanitizeIds(ids);
  let expanded = false;
  if (selected.length < 2) {
    selected = engine.runningWithCdp([...engine.running.keys()]).map((entry) => entry.id);
    expanded = selected.length >= 2;
  }
  if (selected.length < 2) throw new Error('\u8bf7\u81f3\u5c11\u9009\u62e9\u4e24\u4e2a\u8fd0\u884c\u4e2d\u7684\u6d4f\u89c8\u5668\u73af\u5883');
  if (expanded) emit({ type: 'sync-notice', message: '\u672a\u9009\u62e9\u73af\u5883\uff0c\u5df2\u81ea\u52a8\u7eb3\u5165\u5168\u90e8\u8fd0\u884c\u4e2d\u7684\u73af\u5883\u8fdb\u884c\u540c\u6b65' });
  syncSelection = selected;
  await tile(selected, false);
  const tabs = await syncTabsFromMaster(selected);
  await liveSync.start(selected);
  syncState = { active: true, master: selected[0], selected };
  emit({ type: 'sync-state', ...syncSnapshot() });
  return { success: true, ...tabs, state: syncSnapshot() };
}

function endSync() {
  liveSync?.stop();
  syncState = { active: false, master: null, selected: [...syncSelection] };
  emit({ type: 'sync-state', ...syncSnapshot() });
  return { success: true, state: syncSnapshot() };
}

async function restartSync() {
  endSync();
  return beginSync(syncSelection);
}

async function runShortcut(action) {
  if (shortcutActionInFlight) return;
  shortcutActionInFlight = true;
  emit({ type: 'shortcut-triggered', action });
  try {
    if (action === 'start') await beginSync(syncSelection);
    else if (action === 'stop') endSync();
    else await restartSync();
  } catch (error) {
    emit({ type: 'sync-error', action, message: error.message });
  } finally { shortcutActionInFlight = false; }
}

function registerShortcutFallback() {
  if (shortcutFallbackRegistered) return;
  shortcutFallbackRegistered = true;
  const mod = process.platform === 'darwin' ? 'Command' : 'Control';
  const shortcuts = [
    [`${mod}+Alt+A`, 'start'],
    [`${mod}+Alt+S`, 'start'],
    [`${mod}+Alt+D`, 'stop'],
    [`${mod}+Alt+R`, 'restart'],
  ];
  // Keep Windows-style Control+Alt bindings available on macOS too.
  if (process.platform === 'darwin') {
    shortcuts.push(
      ['Control+Alt+A', 'start'],
      ['Control+Alt+S', 'start'],
      ['Control+Alt+D', 'stop'],
      ['Control+Alt+R', 'restart'],
    );
  }
  const registered = shortcuts.map(([accelerator, action]) => ({
    accelerator,
    registered: globalShortcut.register(accelerator, () => runShortcut(action)),
  }));
  trackRegisteredShortcuts(shortcuts, registered);
  emit({ type: 'shortcut-status', mode: process.platform === 'darwin' ? 'macos-global' : 'host-fallback', registered });
}

function registerTextShortcuts() {
  const mod = process.platform === 'darwin' ? 'Command' : 'Control';
  const shortcuts = [
    [`${mod}+Alt+F`, 'random-number'],
    [process.platform === 'darwin' ? 'Command+Option+Q' : 'Control+Q', 'same-text'],
    ['Shift+F1', 'specified-text'],
  ];
  if (process.platform === 'darwin') {
    shortcuts.push(
      ['Control+Alt+F', 'random-number'],
      ['Control+Q', 'same-text'],
    );
  }
  // Gate the text-shortcut handlers on a visible main window: the same-text /
  // specified-text / random-number paste actions are meaningless with no UI to
  // aim them at, and System+Q-class bindings otherwise hijack the keys from
  // every other app while OpenBrowser sits minimized to the tray.
  const gateTextShortcut = (action) => () => {
    const visible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && !mainWindow.isMinimized();
    if (!visible) return;
    emit({ type: 'text-shortcut', action });
  };
  const registered = shortcuts.map(([accelerator, action]) => ({ accelerator, registered: globalShortcut.register(accelerator, gateTextShortcut(action)) }));
  trackRegisteredShortcuts(shortcuts, registered);
  emit({ type: 'text-shortcut-status', registered });
}

function startShortcutBridge() {
  const executable = path.join(__dirname, 'native-sync-hotkeys.exe');
  if (process.platform !== 'win32' || !fs.existsSync(executable)) {
    registerShortcutFallback();
    return;
  }
  const child = spawn(executable, [], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  shortcutBridge = child;
  let output = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    output += chunk;
    const lines = output.split(/\r?\n/);
    // Partial (newline-less) line remainder, capped like the stderr handler
    // below: a native binary streaming one unterminated line grows this buffer
    // for the process lifetime — stdout has no backpressure-driven bound.
    output = (lines.pop() || '').slice(-1000);
    for (const line of lines.map((value) => value.trim()).filter(Boolean)) {
      if (line === 'READY') emit({ type: 'shortcut-status', mode: 'windows-hook', active: true, accelerators: ['Ctrl+Alt+A', 'Ctrl+Alt+S', 'Ctrl+Alt+D', 'Ctrl+Alt+R'] });
      else if (line === 'start' || line === 'stop' || line === 'restart') runShortcut(line);
    }
  });
  let errorOutput = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { errorOutput = (errorOutput + chunk).slice(-1000); });
  child.once('error', (error) => {
    if (shortcutBridge !== child) return;
    shortcutBridge = null;
    emit({ type: 'sync-error', action: 'shortcut-bridge', message: error.message });
    if (!quitting) registerShortcutFallback();
  });
  child.once('exit', (code) => {
    if (shortcutBridge !== child) return;
    shortcutBridge = null;
    if (!quitting) {
      emit({ type: 'sync-error', action: 'shortcut-bridge', message: errorOutput.trim() || ('Windows shortcut bridge exited: ' + code) });
      registerShortcutFallback();
    }
  });
}

function stopShortcutBridge() {
  const child = shortcutBridge;
  shortcutBridge = null;
  if (child && !child.killed) { try { child.kill(); } catch (_) {} }
  // Unregister only what this module registered; unregisterAll() would also
  // drop the text shortcuts (see registeredShortcutAccelerators).
  unregisterTrackedShortcuts();
  shortcutFallbackRegistered = false;
}

/** Theme chrome colors for fused title bar (shipping-app look). */
const THEME_CHROME = {
  'modern': { bg: '#ffffff', overlay: '#f5fbff', symbol: '#111213' },
  default: { bg: '#ffffff', overlay: '#f5fbff', symbol: '#111213' },
};

function chromeForTheme(themeId, _colorMode) {
  return THEME_CHROME[themeId] || THEME_CHROME.default;
}

function applyWindowChrome(win, themeId, colorMode) {
  if (!win || win.isDestroyed()) return;
  const chrome = chromeForTheme(themeId, colorMode);
  // The default UI is opaque; no vibrancy / Mica backdrop.
  const macVibrant = false;
  const winMica = false;
  try { win.setBackgroundColor((macVibrant || winMica) ? '#00000000' : chrome.bg); } catch (_) {}
  if (process.platform === 'darwin' && typeof win.setVibrancy === 'function') {
    try { win.setVibrancy(macVibrant ? 'sidebar' : null); } catch (_) {}
  }
  if (process.platform === 'win32' && typeof win.setBackgroundMaterial === 'function') {
    try { win.setBackgroundMaterial(winMica ? 'mica' : 'none'); } catch (_) {}
  }
  // Keep Windows caption overlay in sync with theme (light/dark native skin too)
  if (process.platform === 'win32' && typeof win.setTitleBarOverlay === 'function') {
    try {
      win.setTitleBarOverlay({
        color: chrome.overlay,
        symbolColor: chrome.symbol,
        height: 40,
      });
    } catch (_) {}
  }
}

async function createWindow() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';
  const chrome = chromeForTheme('modern');

  /** @type {Record<string, any>} */
  const options = {
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: 'OpenBrowser',
    icon: (() => {
      // Window / taskbar: software pixel logo
      const pixelPng = path.join(__dirname, 'assets', 'logo-pixel.png');
      const icns = path.join(__dirname, 'assets', 'logo.icns');
      const png = path.join(__dirname, 'assets', 'logo.png');
      const ico = path.join(__dirname, 'assets', 'logo.ico');
      if (isMac && fs.existsSync(icns)) return icns;
      if (fs.existsSync(pixelPng)) return pixelPng;
      if (fs.existsSync(png)) return png;
      return ico;
    })(),
    backgroundColor: chrome.bg,
    show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: true, spellcheck: false },
  };

  // Fuse system title bar with in-app chrome (shipping-app style)
  if (isMac) {
    options.titleBarStyle = 'hiddenInset';
    // Sit in the empty strip above brand (brand is pushed down in CSS)
    options.trafficLightPosition = { x: 12, y: 14 };
    options.transparent = false;
  } else if (isWin) {
    // Same shipping-app fusion as macOS: custom chrome + native caption buttons
    options.titleBarStyle = 'hidden';
    options.frame = true;
    options.titleBarOverlay = {
      color: chrome.overlay,
      symbolColor: chrome.symbol,
      height: 40,
    };
  }

  const win = new BrowserWindow(options);
  mainWindow = win;
  windows.add(win);
  win.on('closed', () => { windows.delete(win); if (mainWindow === win) mainWindow = null; });
  win.on('close', (event) => {
    // macOS keeps the standard close-to-Dock convention; quitting paths bypass this.
    if (quitting || process.platform === 'darwin') return;
    if (forceCloseWindowIds.has(win.id)) { forceCloseWindowIds.delete(win.id); return; }
    const pref = settingsStore.normalizeCloseAction(settingsStore.getLocalSettings().closeAction);
    if (pref === 'exit') return;
    event.preventDefault();
    if (pref === 'tray') {
      hideMainWindowToTray(win);
      return;
    }
    askCloseAction(win)
      .then(({ mode, remember }) => {
        if (remember) {
          settingsStore.getLocalSettings().closeAction = mode;
          settingsStore.saveLocalSettings(settingsStore.getLocalSettings()).catch(() => {});
        }
        if (win.isDestroyed()) return;
        if (mode === 'tray') hideMainWindowToTray(win);
        else { forceCloseWindowIds.add(win.id); win.close(); }
      })
      .catch(() => { try { if (!win.isDestroyed()) hideMainWindowToTray(win); } catch (_) {} });
  });
  win.once('ready-to-show', () => {
    if (win.isDestroyed()) return;
    win.show();
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  win.setMenu(null);
  // The shell renders local files only: block navigation away from them and
  // keep child windows denied (a child would inherit this window's preload).
  attachShellNavigationGuard(win.webContents, {
    onBlocked: ({ url, reason }) => console.warn('[shell] blocked navigation:', url, reason),
  });
  await win.loadFile('index.html');
  if (!win.isVisible()) win.show();
  if (win.isMinimized()) win.restore();
  win.focus();
}

app.whenReady().then(async () => {
  try { app.setName('OpenBrowser'); } catch (_) { /* ignore */ }
  try { process.title = 'OpenBrowser'; } catch (_) { /* ignore */ }
  if (process.platform === 'darwin' && app.dock) {
    // Software Dock / shortcut icon = logo-pixel (not browser logo-native)
    try {
      const { rebuildAppShortcutIcons } = require('./automation/env-icon');
      rebuildAppShortcutIcons();
    } catch (error) {
      console.warn('OpenBrowser app icons rebuild skipped:', error.message);
    }
    const dockCandidates = [
      path.join(__dirname, 'assets', 'logo-pixel.png'),
      path.join(__dirname, 'assets', 'logo.png'),
      path.join(__dirname, 'assets', 'logo.icns'),
    ];
    for (const dockIcon of dockCandidates) {
      try {
        if (fs.existsSync(dockIcon)) {
          app.dock.setIcon(dockIcon);
          break;
        }
      } catch (error) {
        console.warn('OpenBrowser Dock icon could not be applied:', error.message);
      }
    }
  }
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = String(details.url || '');
    const allowed = url.startsWith('file:') || url.startsWith('data:') || url.startsWith('devtools:')
      || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(url);
    callback({ cancel: !allowed });
  });
  // The app UI is a local document that needs no web permissions at all;
  // everything (geolocation, camera, mic, notifications, MIDI, clipboard
  // reads) is denied by default. Clipboard copy/paste in the UI goes through
  // the system:read-clipboard IPC, not navigator.clipboard, so nothing the
  // app actually uses is affected.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    console.warn('[OpenBrowser] denied permission request:', permission);
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => false);
  // Window creation only needs Electron readiness, not engine state: overlap it
  // with settings loading so the first frame is not behind disk I/O. The
  // renderer's initialize() invokes system:info as soon as index.html loads,
  // so that handler (and only it) must be registered BEFORE createWindow();
  // awaiting it earlier in the chain left a window where the first invoke
  // rejected with "No handler registered" and the profile list never rendered.
  registerTrustedIpc('system:info', async () => {
    // The first frame may paint while storage and automation initialize, but
    // renderer initialization must wait until its whole IPC surface exists.
    await startupReady;
    return {
    appVersion: app.getVersion(),
    chrome: process.versions.chrome,
    browsers: engine?.candidates?.() ?? [],
    profileRoot: engine?.getProfileDataRoot?.() ?? '',
    defaultProfileRoot: defaultProfileDataRoot,
    localApi: automation?.info || null,
    startPage: engine?.startPageServer?.info?.() || null,
    kernel: engine?.kernelStatus?.() ?? { installed: false },
    kernelSelection: engine?.browserSelection?.() ?? [],
    systemBrowsers: engine?.systemBrowserCandidates?.().filter((item) => fs.existsSync(item.path)) ?? [],
    preferIndependentKernel: engine?.preferIndependentKernel ?? true,
    allowSystemBrowserFallback: engine?.allowSystemBrowserFallback ?? false,
    systemBrowserPath: engine?.systemBrowserPath ?? '',
    titleBarIntegrated: process.platform === 'darwin' || process.platform === 'win32',
    platform: process.platform,
    closeAction: settingsStore.normalizeCloseAction(settingsStore.getLocalSettings().closeAction),
    };
  });
  // The renderer's initialize() also invokes sync:state right after getInfo —
  // same early-registration requirement, or the bare await in initialize()
  // rejects and the profile list never renders (verified in round 2).
  registerTrustedIpc('sync:state', () => syncSnapshot());
  const localSettingsPromise = settingsStore.loadLocalSettings();
  const windowPromise = createWindow().catch((error) => {
    console.error('OpenBrowser window creation failed:', error.message);
    throw error;
  });
  // Attach a no-op handler immediately: a creation failure that happens before
  // the `await windowPromise` below would otherwise sit unhandled across the
  // intermediate awaits and be logged a second time by the global
  // unhandledRejection handler.
  windowPromise.catch(() => {});
  const localSettings = await localSettingsPromise;
  const initialRootCheck = await ensureDataRootIsolationSecure(localSettings.profileDataRoot);
  if (!initialRootCheck.ok) throw new Error(initialRootCheck.message);
  engine = new BrowserEngine(app, {
    profileDataRoot: localSettings.profileDataRoot,
    getHostScaleFactor: pickDisplayScaleFactor,
  });
  liveSync = new LiveSyncController(engine, handleLiveSyncEvent);
  await engine.init(path.join(__dirname, 'bundled-extension'));
  try {
    const startPage = await engine.ensureStartPage();
    startPage.setEngine?.(engine);
    console.log('OpenBrowser start page:', startPage.info?.() || startPage.port);
  } catch (error) {
    console.error('OpenBrowser start page server failed:', error.message);
  }
  engine.on((value) => {
    emit(value);
    // Hub/ix style: when an opted-in profile closes, auto-push that env to cloud
    if (value?.type === 'profile-closed' && value.cloudBackup && value.profile?.id) {
      const cloud = settingsStore.getLocalSettings()?.cloud || {};
      if (cloud.enabled) {
        cloudOps.runCloudProfilePush({
          profileIds: [value.profile.id],
          profiles: [value.profile],
          groups: settingsStore.getLocalSettings().uiGroups || [],
          cloud,
        }).catch((error) => {
          console.warn('OpenBrowser auto cloud push failed:', error.message);
          emit({ type: 'cloud-sync', action: 'profile-push-error', id: value.profile.id, message: error.message });
        });
      }
    }
  });
  engine.ensureKernelBootstrap().catch((error) => console.error('OpenBrowser kernel bootstrap failed:', error.message));
  // Background: a kernel tree that no longer matches its install record is
  // reported through kernel-progress instead of failing later without a cause.
  engine.kernelIntegrityCheck?.().then((summary) => {
    if (summary && summary.status === 'mismatch') console.warn('[kernel] integrity mismatch', summary);
  }).catch((error) => console.warn('[kernel] integrity check skipped:', error.message));
  startShortcutBridge();
  registerTextShortcuts();

  try {
    automation = await startAutomation({
      beforeApiStart: (proxyStore) => cloudOps.recoverPendingRestore({ proxyStore }),
      app,
      engine,
      liveSync,
      beginSync,
      endSync,
      restartSync,
      getSyncState: syncSnapshot,
      setSelection: (ids) => {
        syncSelection = sanitizeIds(ids);
        syncState.selected = [...syncSelection];
        emit({ type: 'sync-state', ...syncSnapshot() });
      },
      tile,
      emit,
      port: Number(process.env.OPENBROWSER_API_PORT || 50325),
      apiKey: process.env.OPENBROWSER_API_KEY || undefined,
    });
  } catch (error) {
    emit({ type: 'local-api-error', message: error.message });
    console.error('Local API failed to start:', error.message);
  }

  registerTrustedIpc('system:read-clipboard', () => {
    try { return clipboard.readText(); } catch (_) { return ''; }
  });
  registerTrustedIpc('system:set-close-action', async (_event, mode) => {
    const value = settingsStore.normalizeCloseAction(mode);
    settingsStore.getLocalSettings().closeAction = value;
    await settingsStore.saveLocalSettings(settingsStore.getLocalSettings());
    // A remembered "exit" means the user no longer wants background running.
    if (value === 'exit') destroyTray();
    return { success: true, closeAction: value };
  });
  // 启动保护（Roxy 客户端设置对齐）：内存使用率上限 / 磁盘可用空间下限。
  registerTrustedIpc('system:get-client-settings', () => settingsStore.getLocalSettings());
  // 设置字段白名单 + 类型/范围校验：renderer 的 patch 不再整个浅合并进设置。
  // 旧实现把任意键一并并入并持久化（cloud/uiGroups/profileDataRoot 可被一次
  // IPC 覆盖，或注入任意未知键）；此处镜像 system:set-close-action 的做法——
  // 归一化一律走 settingsStore 自身的 clamp（clampMemoryLimit 1-100、
  // clampDiskLimit 0-1024、closeAction 枚举），非法值丢弃并只记一次日志，
  // 绝不静默回退默认值（garbage patch 不得改写已存设置）。renderer 的
  // input.value 是数字字符串，故先 Number() 再判有限。
  let warnedClientSettingsDrops = false;
  registerTrustedIpc('system:save-client-settings', async (_event, payload) => {
    const patch = payload && typeof payload === 'object' ? payload : {};
    const known = new Set(['memoryLimit', 'diskLimit', 'closeAction', 'defaultPreferences']);
    const dropped = [];
    const next = {};
    if (patch.memoryLimit !== undefined) {
      const num = Number(patch.memoryLimit);
      if (!Number.isFinite(num)) dropped.push(`memoryLimit:${JSON.stringify(patch.memoryLimit)}`);
      else next.memoryLimit = settingsStore.clampMemoryLimit(num);
    }
    if (patch.diskLimit !== undefined) {
      const num = Number(patch.diskLimit);
      if (!Number.isFinite(num)) dropped.push(`diskLimit:${JSON.stringify(patch.diskLimit)}`);
      else next.diskLimit = settingsStore.clampDiskLimit(num);
    }
    if (patch.closeAction !== undefined) {
      // 枚举精确匹配：normalizeCloseAction 会把非法值静默改成 'ask'，
      // 一次垃圾提交就能覆盖用户已选的 'tray'/'exit'。
      if (patch.closeAction === 'ask' || patch.closeAction === 'tray' || patch.closeAction === 'exit') next.closeAction = patch.closeAction;
      else dropped.push(`closeAction:${JSON.stringify(patch.closeAction)}`);
    }
    if (patch.defaultPreferences && typeof patch.defaultPreferences === 'object') {
      const { DEFAULT_PREFERENCES, normalizeDefaultPreferences } = require('./automation/profile-defaults');
      const valid = Object.fromEntries(Object.entries(patch.defaultPreferences)
        .filter(([key, value]) => Object.hasOwn(DEFAULT_PREFERENCES, key) && typeof value === 'boolean'));
      next.defaultPreferences = normalizeDefaultPreferences(valid, settingsStore.getLocalSettings().defaultPreferences);
    }
    for (const key of Object.keys(patch)) if (!known.has(key)) dropped.push(`unknown:${key}`);
    if (dropped.length && !warnedClientSettingsDrops) {
      warnedClientSettingsDrops = true;
      console.warn('[client-settings] dropped untrusted keys/values:', dropped.join(', '), '(further drops are silent for this process)');
    }
    const saved = await settingsStore.saveLocalSettings({ ...settingsStore.getLocalSettings(), ...next });
    if (saved.closeAction === 'exit') destroyTray();
    return saved;
  });
  registerTrustedIpc('app:update-check', async () => {
    const payload = await appUpdate.pushAppUpdateStatus({ check: true });
    if (payload?.error && !payload?.remoteVersion) throw new Error(payload.error);
    // Return check fields (without event envelope noise for renderer helpers)
    const {  light, checkedAt, error, ...rest } = payload || {};
    if (error && !rest.supported) throw new Error(error);
    return rest.currentVersion != null ? { ...rest, light, checkedAt } : await appUpdate.checkAppUpdate();
  });
  registerTrustedIpc('app:update-download', () => appUpdate.downloadAppUpdate());
  registerTrustedIpc('app:open-github', async () => {
    const url = `https://github.com/${appUpdate.UPDATE_REPOSITORY}`;
    await shell.openExternal(url);
    return { success: true, url };
  });
  registerTrustedIpc('system:set-ui-chrome', (_event, payload) => {
    const win = BrowserWindow.fromWebContents(_event.sender) || mainWindow;
    const themeId = typeof payload === 'string' ? payload : String(payload?.themeId || '');
    const colorMode = typeof payload === 'object' && payload ? String(payload.colorMode || 'light') : 'light';
    applyWindowChrome(win, themeId, colorMode);
    return { success: true, theme: themeId, colorMode };
  });
  registerKernelIpc({ registerTrustedIpc, engine, dialog });
  registerTrustedIpc('system:get-storage', () => ({ profileRoot: engine.getProfileDataRoot(), defaultProfileRoot: defaultProfileDataRoot,
    running: engine.running.size, ...collectStorageDiagnostics({ engine, automation }) }));
  registerTrustedIpc('system:choose-storage', async () => {
    if (engine.running.size) throw new Error('\u8bf7\u5148\u505c\u6b62\u6240\u6709\u73af\u5883\uff0c\u518d\u4fee\u6539\u6570\u636e\u4fdd\u5b58\u4f4d\u7f6e');
    const options = { title: '\u9009\u62e9\u73af\u5883\u6570\u636e\u4fdd\u5b58\u76ee\u5f55', defaultPath: engine.getProfileDataRoot(), properties: ['openDirectory', 'createDirectory', 'promptToCreate'] };
    const result = mainWindow && !mainWindow.isDestroyed() ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths[0]) return { canceled: true, profileRoot: engine.getProfileDataRoot(), defaultProfileRoot: defaultProfileDataRoot };
    return { canceled: false, ...(await updateProfileDataRoot(result.filePaths[0])) };
  });
  registerTrustedIpc('system:reset-storage', () => updateProfileDataRoot(defaultProfileDataRoot));
  registerTrustedIpc('system:open-storage', async () => {
    const profileRoot = engine.getProfileDataRoot(); await fsp.mkdir(profileRoot, { recursive: true });
    const message = await shell.openPath(profileRoot); if (message) throw new Error(message);
    return { success: true, profileRoot };
  });
  registerTrustedIpc('cloud:get-config', async () => {
    return settingsStore.getLocalSettings().cloud || cloudSync.defaultCloudConfig();
  });
  registerTrustedIpc('cloud:set-config', async (_event, cloud) => {
    const next = { ...cloudSync.defaultCloudConfig(), ...(settingsStore.getLocalSettings().cloud || {}), ...(cloud || {}) };
    await settingsStore.saveLocalSettings({ ...settingsStore.getLocalSettings(), cloud: next });
    return next;
  });
  registerTrustedIpc('cloud:choose-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择云备份本地目录',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    return { canceled: false, dir: result.filePaths[0] };
  });
  registerTrustedIpc('cloud:backup', async (_event, payload) => cloudOps.runCloudBackup(payload || {}));
  registerTrustedIpc('cloud:restore', async (_event, payload) => cloudOps.runCloudRestore(payload || {}));
  registerTrustedIpc('cloud:profile-push', async (_event, payload) => cloudOps.runCloudProfilePush(payload || {}));
  registerTrustedIpc('cloud:profile-pull', async (_event, payload) => cloudOps.runCloudProfilePull(payload || {}));
  registerTrustedIpc('cloud:export-file', async (_event, payload) => {
    const { buffer, meta } = await cloudOps.createBackupPackage(payload || {});
    const result = await dialog.showSaveDialog({
      title: '导出 OpenBrowser 备份',
      defaultPath: `openbrowser-backup-${Date.now()}.obpack`,
      filters: [{ name: 'OpenBrowser Backup', extensions: ['obpack'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await fsp.writeFile(result.filePath, buffer);
    return { success: true, path: result.filePath, meta };
  });
  registerTrustedIpc('cloud:import-file', async (_event, payload) => {
    const result = await dialog.showOpenDialog({
      title: '导入 OpenBrowser 备份',
      properties: ['openFile'],
      filters: [{ name: 'OpenBrowser Backup', extensions: ['obpack', 'json', 'gz'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const buffer = await fsp.readFile(result.filePaths[0]);
    const body = await cloudSync.parseBackupPackage(buffer, payload?.passphrase || settingsStore.getLocalSettings().cloud?.passphrase || '');
    const mode = String(payload?.mode || settingsStore.getLocalSettings().cloud?.restoreMode || 'merge');
    const applied = await cloudOps.applyBackupBody(body, {
      mode,
      localProfiles: payload?.localProfiles,
      localGroups: payload?.localGroups,
    });
    return { success: true, mode, ...applied };
  });
  registerProfileIpc({
    registerTrustedIpc, engine, sanitizeIds,
    beforeRemove(ids) {
      const removed = new Set(ids);
      if (syncState.active && syncState.selected.some((id) => removed.has(id))) endSync();
      syncSelection = syncSelection.filter((id) => !removed.has(id));
      syncState = { ...syncState, selected: syncState.selected.filter((id) => !removed.has(id)) };
      emit({ type: 'sync-state', ...syncSnapshot() });
    },
  });

  registerExtensionIpc({ registerTrustedIpc, engine, dialog, sanitizeIds, fetchStorePackage });

  registerTrustedIpc('sync:sessions', () => engine.sessions());
  registerTrustedIpc('sync:selection', (_event, ids) => { syncSelection = sanitizeIds(ids); syncState.selected = [...syncSelection]; emit({ type: 'sync-state', ...syncSnapshot() }); return syncSnapshot(); });
  registerTrustedIpc('sync:settings:get', () => liveSync.getSettings());
  registerTrustedIpc('sync:settings:set', (_event, value) => liveSync.updateSettings(value));
  registerTrustedIpc('sync:start', (_event, ids) => beginSync(ids));
  registerTrustedIpc('sync:stop', () => endSync());
  registerTrustedIpc('sync:restart', () => restartSync());
  registerTrustedIpc('sync:window', async (_event, payload) => {
    const ids = sanitizeIds(payload.ids); const entries = engine.runningWithCdp(ids); const action = String(payload.action);
    if (action === 'matrix') return tile(ids, false, payload.options || {});
    if (action === 'tile') return tile(ids, false);
    if (action === 'cascade') return tile(ids, true);
    if (!['minimized', 'normal', 'maximized', 'fullscreen'].includes(action)) throw new Error('Unknown window action');
    const transitions = await Promise.all(entries.map(({ item }) => cdp.setWindowState(item.port, action, action === 'fullscreen'
      ? { verify: true, fallbackState: 'maximized' }
      : {})));
    return { success: true, count: entries.length, degraded: transitions.filter((value) => value?.degraded).length };
  });
  // Shared text-assignment runner for sync:text and sync:text-batch: the two
  // used to carry near-identical copies of the delay clamp, concurrency and
  // failure-aggregation logic, so any fix had to be applied twice.
  async function runTextAssignments({ ids, resolveText, allowClear = false, clearAction = '', delayMin, delayMax }) {
    const entries = new Map(engine.runningWithCdp(ids).map((entry) => [entry.id, entry]));
    const min = Math.max(0, Math.min(5, Number(delayMin) || 0));
    const max = Math.max(min, Math.min(5, Number(delayMax) || min));
    const profiles = []; const failures = [];
    // Environments are independent: run them concurrently so the per-entry
    // random delays overlap instead of stacking (10 envs at delayMax=5 used to
    // add ~25s of pure serial waiting before the last environment typed).
    const outcomes = await Promise.all(ids.map(async (id) => {
      const entry = entries.get(id);
      if (!entry) return { id, failure: 'Environment is not running or has no CDP session' };
      try {
        let result;
        if (allowClear && clearAction === 'clear') {
          result = await cdp.clearFocused(entry.item.port);
        } else {
          const text = resolveText(id);
          const delay = min + Math.random() * (max - min); if (delay) await sleep(delay * 1000);
          result = await cdp.insertText(entry.item.port, text);
        }
        const textLength = allowClear && clearAction === 'clear' ? 0 : resolveText(id).length;
        return { id, profile: { id, targetId: result.targetId, textLength } };
      } catch (error) { return { id, failure: error.message }; }
    }));
    for (const outcome of outcomes) {
      if (outcome.profile) profiles.push(outcome.profile);
      else failures.push({ id: outcome.id, message: outcome.failure });
    }
    return { success: failures.length === 0 && profiles.length === ids.length, profiles, failures };
  }
  registerTrustedIpc('sync:text', async (_event, payload) => {
    const ids = sanitizeIds(payload.ids); const action = String(payload.action); const text = String(payload.text || '').slice(0, 100000);
    return runTextAssignments({ ids, resolveText: () => text, allowClear: true, clearAction: action, delayMin: payload.delayMin, delayMax: payload.delayMax });
  });
  registerTrustedIpc('sync:text-batch', async (_event, payload) => {
    const ids = sanitizeIds(payload.ids);
    const texts = Array.isArray(payload.texts) ? payload.texts.map((value) => String(value || '').slice(0, 100000)) : [];
    if (!ids.length || texts.length !== ids.length) throw new Error('Text assignments must match the selected environments');
    const assignments = new Map(ids.map((id, index) => [id, texts[index]]));
    return runTextAssignments({ ids, resolveText: (id) => assignments.get(id) || '', delayMin: payload.delayMin, delayMax: payload.delayMax });
  });
  registerTrustedIpc('sync:tabs', async (_event, payload) => {
    const ids = sanitizeIds(payload.ids); const entries = engine.runningWithCdp(ids); const action = String(payload.action); const value = payload.payload || {};
    if (action === 'sync') return syncTabsFromMaster(ids);
    if (action === 'list') return engine.sessions();
    // Roxy 统一标签页语义：closeOthers = 关闭除当前页外的全部标签页；closeBlank = 关闭空白标签页。
    const isBlankTab = (url) => /^(about:blank|chrome:\/\/(newtab|new-tab-page)\/?)/i.test(String(url || ''));
    for (const { item } of entries) {
      if (action === 'new') await cdp.newTab(item.port, String(value.url || 'about:blank'));
      else if (action === 'navigate') await cdp.navigate(item.port, String(value.url || 'about:blank'));
      else if (action === 'reload') await cdp.reload(item.port);
      else if (action === 'close') { const tab = await cdp.activeTab(item.port); if (tab) await cdp.closeTab(item.port, tab.id); }
      else if (action === 'closeOthers') {
        const current = await cdp.activeTab(item.port);
        for (const tab of await cdp.tabs(item.port)) {
          if (current && tab.id === current.id) continue;
          await cdp.closeTab(item.port, tab.id);
        }
      }
      else if (action === 'closeBlank') {
        for (const tab of await cdp.tabs(item.port)) {
          if (!isBlankTab(tab.url)) continue;
          await cdp.closeTab(item.port, tab.id);
        }
      }
      else throw new Error('Unknown tab action');
    }
    return { success: true, count: entries.length };
  });

  registerTrustedIpc('automation:local-api', () => automation?.info || null);
  registerTrustedIpc('automation:local-api-version', async () => {
    if (!automation?.localApi) throw new Error('Local API is not ready');
    return automation.localApi.route('GET', '/api/getVersion', {});
  });
  registerTrustedIpc('automation:fingerprint', (_event, id) => engine.fingerprintFor(String(id || '')));
  registerTrustedIpc('automation:isolation-audit', () => engine.isolationAudit());
  registerTrustedIpc('automation:build-ua', (_event, payload = {}) => require('./automation/editor-ua').buildEditorUa(engine, payload));

  const proxyStore = () => {
    if (!automation?.proxyStore) throw new Error('代理库未就绪');
    return automation.proxyStore;
  };
  registerTrustedIpc('proxy:list', (_event, filter) => proxyStore().list(filter || {}));
  registerTrustedIpc('proxy:get', (_event, id) => proxyStore().get(String(id || '')));
  registerTrustedIpc('proxy:create', (_event, payload) => proxyStore().create(payload || {}));
  registerTrustedIpc('proxy:update', (_event, payload) => {
    const id = String(payload?.id || payload?.proxy_id || '');
    if (!id) throw new Error('id required');
    return proxyStore().update(id, payload || {});
  });
  registerTrustedIpc('proxy:delete', (_event, ids) => proxyStore().remove(sanitizeIds(Array.isArray(ids) ? ids : [ids])));
  registerTrustedIpc('proxy:check', async (_event, payload) => {
    const store = proxyStore();
    const id = String(payload?.id || payload?.proxy_id || '');
    const item = id ? store.get(id) : null;
    const raw = item?.raw || payload?.proxy || payload?.raw;
    if (!raw) throw new Error('proxy required');
    try {
      const result = await engine.testProxy({
        id: 'proxy-check',
        name: 'proxy-check',
        proxy: raw,
        proxyMeta: {
          ipChannel: item?.ipChannel || payload?.ipChannel || 'ip-api',
          apiExtractUrl: item?.refreshUrl || payload?.apiExtractUrl || '',
          refreshUrl: item?.refreshUrl || payload?.refreshUrl || '',
        },
      });
      if (item) await store.markCheck(item.id, result);
      return { ...result, proxy: item ? store.get(item.id) : null };
    } catch (error) {
      if (item) {
        await store.markCheckError(item.id, {
          errorClass: error.errorClass || 'unknown',
          latencyMs: error.latencyMs,
        });
      }
      throw error;
    }
  });
  registerTrustedIpc('proxy:check-many', async (_event, payload) => {
    const store = proxyStore();
    const ids = Array.isArray(payload?.ids) ? payload.ids.map(String) : [];
    if (!ids.length) throw new Error('ids required');
    if (ids.length > 100) throw new Error('ids cannot exceed 100 per check; split the selection into batches');
    // Serial execution made "check all" run minutes inside one invoke (100 ×
    // 6.5s budget worst case). engine.testProxy already dedups identical
    // in-flight probes, so a bounded pool is safe; same shape as
    // the extension domain restart helper.
    const queue = ids.slice(0, 100);
    const results = [];
    const resultsById = new Map();
    await Promise.all(Array.from({ length: Math.min(8, queue.length) }, async () => {
      while (queue.length) {
        const id = queue.shift();
        const item = store.get(id);
        if (!item) {
          resultsById.set(id, { id, ok: false, error: 'not found' });
          continue;
        }
        try {
          const result = await engine.testProxy({
            id: 'proxy-check',
            name: item.name || 'proxy-check',
            proxy: item.raw,
            proxyMeta: { ipChannel: item.ipChannel || 'ip-api', refreshUrl: item.refreshUrl || '', apiExtractUrl: item.refreshUrl || '' },
          });
          await store.markCheck(item.id, result);
          resultsById.set(id, { id, ok: true, ...result, proxy: store.get(item.id) });
        } catch (error) {
          await store.markCheckError(item.id, {
            errorClass: error.errorClass || 'unknown',
            latencyMs: error.latencyMs,
          });
          resultsById.set(id, {
            id,
            ok: false,
            error: error.message || String(error),
            errorClass: error.errorClass || 'unknown',
            latencyMs: error.latencyMs || null,
            proxy: store.get(item.id),
          });
        }
      }
    }));
    // Preserve the caller's id order; the pool completes them out of order.
    for (const id of ids.slice(0, 100)) {
      const entry = resultsById.get(id);
      if (entry) results.push(entry);
    }
    return { results, ok: results.filter((r) => r.ok).length, fail: results.filter((r) => !r.ok).length };
  });
  registerTrustedIpc('profiles:refresh-proxy', (_event, profile) => engine.refreshProfileProxy(profile));
  registerTrustedIpc('profiles:apply-proxy-fingerprint', async (_event, profile) => {
    const network = await engine.checkProxy(profile, { persist: true });
    return network;
  });
  registerAutomationControlIpc({ registerTrustedIpc, getAutomation: () => automation,
    getMainWindow: () => mainWindow, app, dialog });
  registerTrustedIpc('automation:app-center', (_event, filter) => {
    if (!automation?.appCenter) return { list: { builtin: [], recommended: [], local: [] }, counts: { builtin: 0, recommended: 0, local: 0, installed: 0 } };
    return automation.appCenter.list(filter || {});
  });
  registerTrustedIpc('automation:app-center-icons', async (_event, storeIds) => {
    const ids = [...new Set((Array.isArray(storeIds) ? storeIds : []).map(validChromeStoreId).filter(Boolean))];
    // Bounded fan-out: the panel may ask for dozens of entries at once.
    return fetchStoreEntries(ids, (id, { signal }) => fetchChromeStoreIcon(id, { signal }));
  });
  registerTrustedIpc('automation:app-center-metadata', async (_event, storeIds) => {
    const ids = [...new Set((Array.isArray(storeIds) ? storeIds : []).map(validChromeStoreId).filter(Boolean))];
    return fetchStoreEntries(ids, (id, { signal }) => fetchChromeStoreMetadata(id, { signal }));
  });










  // The window was created in parallel with settings loading above; by this point
  // createWindow() has either resolved or thrown, and awaiting it again is free.
  await windowPromise;
  resolveStartupReady();
  appUpdate.startAppUpdateWatcher();
})
  .catch((error) => {
    rejectStartupReady(error);
    // A failed init (data-root isolation, engine/SQLite construction) used to
    // be swallowed by the global rejection logger: the window stayed up while
    // every engine-backed IPC handler threw. Fail loudly instead.
    console.error('OpenBrowser startup failed:', error?.message || error);
    try { dialog.showErrorBox('OpenBrowser', `启动失败：${error?.message || error}\n\n程序即将退出。`); } catch (_) {}
    app.exit(1);
  });

async function stopAllForQuit() {
  if (!engine) return { stopped: true, remaining: [], errors: [] };
  const lifecycleIds = () => [...new Set([
    ...(engine.running?.keys?.() || []),
    ...(engine.starting?.keys?.() || []),
    ...(engine.stopping?.keys?.() || []),
  ])];
  let result = null;
  const errors = [];
  try { result = await engine.stopAll(); } catch (error) {
    errors.push(String(error?.message || error));
  }
  let remaining = Array.isArray(result?.remaining) ? result.remaining : [];
  if (!result) remaining = lifecycleIds();
  if (Array.isArray(result?.errors)) errors.push(...result.errors);
  for (let attempt = 0; attempt < 2 && remaining.length; attempt += 1) {
    await Promise.allSettled(remaining.map((id) => engine.stop(id)));
    await sleep(150 * (attempt + 1));
    try { result = await engine.stopAll(); } catch (error) {
      errors.push(String(error?.message || error));
      result = null;
    }
    remaining = Array.isArray(result?.remaining) ? result.remaining : lifecycleIds();
    if (Array.isArray(result?.errors)) errors.push(...result.errors);
  }
  if (remaining.length) {
    console.warn('OpenBrowser quit left browser environments running, force-terminating:', remaining.join(', '));
    for (const id of remaining) {
      const item = engine.running?.get(id) || engine.starting?.get(id) || engine.stopping?.get(id);
      if (item?.pid) {
        try {
          if (process.platform === 'win32') {
            require('child_process').execFileSync('taskkill.exe', ['/PID', String(item.pid), '/T', '/F'], { windowsHide: true, timeout: 3000 });
          } else {
            process.kill(item.pid, 'SIGKILL');
          }
        } catch (_) {}
      }
      if (item?.root) {
        // terminateProcessesUsingProfile is synchronous and returns a scan
        // report (not a promise) — never chain .catch on it.
        try { terminateProcessesUsingProfile(item.root); } catch (_) {}
      }
    }
  }
  return { ...(result || {}), stopped: remaining.length === 0, remaining, errors: [...new Set(errors)] };
}

function beginQuitCleanup() {
  if (quitCleanupPromise) return quitCleanupPromise;
  quitting = true;
  destroyTray();
  const cloud = settingsStore.getLocalSettings()?.cloud || {};
  let stopResult = { stopped: true, remaining: [], errors: [] };
  let persistenceFailed = false;
  quitCleanupPromise = Promise.resolve()
    .then(async () => { stopResult = await stopAllForQuit(); })
    .then(() => engine?.flushPersistence?.())
    .catch((error) => {
      persistenceFailed = true;
      console.warn('OpenBrowser quit engine flush failed:', error?.message || error);
    })
    // A settings change made moments before quitting may still be inside the
    // quiet period; write it out before the process goes away.
    .then(() => settingsStore.flushSettingsWriter())
    .catch((error) => {
      persistenceFailed = true;
      console.warn('OpenBrowser quit settings flush failed:', error?.message || error);
    })
    // RPA task/template updates coalesce into one quiet-period write; flush it
    // before the process goes away so the final task status reaches the disk.
    .then(() => automation?.rpaStore?.flush?.())
    .catch((error) => {
      persistenceFailed = true;
      console.warn('OpenBrowser quit rpa-store flush failed:', error?.message || error);
    })
    .then(() => {
      try { liveSync?.stop?.(); } catch (error) {
        console.warn('OpenBrowser quit live-sync cleanup failed:', error?.message || error);
      }
    })
    .then(async () => {
      try { await automation?.stop?.(); } catch (error) {
        console.warn('OpenBrowser quit automation cleanup failed:', error?.message || error);
      }
    })
    .then(async () => {
      // Stop browsers and flush close-time state before packaging browser data.
      // Otherwise the backup can capture stale cookies or locked SQLite/LevelDB files.
      if (stopResult.remaining.length) return;
      if (persistenceFailed) return;
      if (!cloud.enabled || !cloud.autoSyncOnQuit) return;
      try {
        // The quit chain is the only path that actually exits the app, so a
        // hung backup (network mount, huge browser-data archive) must not
        // keep the windowless process alive indefinitely.
        await lifecycleTimeout(
          cloudOps.runCloudBackup({
            profiles: [...(engine?.profiles?.values?.() || [])],
            groups: settingsStore.getLocalSettings().uiGroups || [],
            cloud,
          }),
          90_000,
          'Quit auto-backup timed out after 90s; exiting anyway'
        );
      } catch (error) {
        console.warn('OpenBrowser quit auto-backup failed:', error.message);
        try {
          const failedSettings = settingsStore.getLocalSettings();
          failedSettings.cloud = { ...cloud, lastError: error.message };
          await settingsStore.saveLocalSettings(failedSettings);
        } catch (_) {}
      }
    })
    .finally(() => {
      // app.quit() here re-enters before-quit; Electron resets is_quitting_
      // when the handler calls preventDefault, and the quitting guard would
      // swallow that second quit forever (deadlock: no window, no tray, no
      // exit). Exit directly and finish the will-quit work ourselves.
      quitCleanupSettled = true;
      try { stopShortcutBridge(); } catch (_) {}
      app.exit(0);
    });
  return quitCleanupPromise;
}

// A renderer or helper process that dies takes its page down with it, and the
// report is the only durable record of which page and which reason. It lands in
// the same diagnosis log as startup failures so one file tells the whole story.
// Neither handler may throw: they run while the runtime is already handling a
// failure, and a diagnosis path that itself fails would hide the original fault.
function recordCrash(record) {
  try {
    writeBrowserStartupDiagnostic(app.getPath('userData'), record).catch(() => {});
  } catch (_) {
    /* diagnosis must never break the runtime */
  }
}

app.on('render-process-gone', createCrashHandler({
  log: (line, report) => recordCrash({ type: 'renderer-crash', line, report }),
}));

app.on('child-process-gone', (event, details) => {
  try {
    const report = buildHelperProcessGoneReport({
      details,
      processInfo: process,
      appInfo: { version: app.getVersion() },
    });
    recordCrash({ type: 'helper-crash', line: 'helper-process-gone ' + JSON.stringify(report), report });
  } catch (_) {
    /* diagnosis must never break the runtime */
  }
});

app.on('before-quit', (event) => {
  // A second quit request during cleanup must not bypass the awaited shutdown
  // chain (stopAll, persistence flush, quit backup): that orphans the external
  // browser kernels and drops pending state changes.
  if (quitCleanupSettled) return;
  event.preventDefault();
  if (!quitCleanupPromise) beginQuitCleanup();
});
app.on('will-quit', () => {
  stopShortcutBridge();
  // before-quit owns the awaited shutdown chain. Do not invoke automation.stop()
  // a second time while local API/RPA/proxy resources are already being closed.
  if (!quitCleanupPromise) automation?.stop?.().catch(() => {});
});
app.on('window-all-closed', () => {
  // OpenBrowser owns external browser processes. Closing its last control
  // window must run the same awaited shutdown path on every platform so proxy
  // exits cannot remain active behind a hidden macOS application.
  if (!quitting) app.quit();
});

// Consumed by automation/selftests/issue-closure-audit-selftest.js, which
// pins the internal-URL sync policy that live-sync-v5 enforces.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isNavigableInternalUrl,
    isDangerousOrBlockedInternalUrl,
    canMirrorTabUrl,
    canDomLiveSyncTabUrl,
    BLOCKED_INTERNAL_SCHEMES,
    BLOCKED_INTERNAL_HOSTS,
    ALLOWED_INTERNAL_HOSTS,
    ALLOWED_INTERNAL_PAGES,
    MAX_SYNC_TABS,
    syncTabsFromMaster,
  };
}

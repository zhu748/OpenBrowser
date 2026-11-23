const { app, BrowserWindow, Menu, clipboard, dialog, globalShortcut, ipcMain, nativeImage, screen, session, shell, Tray } = require('./host-bridge');
const path = require('path');
const sourceRenderer = process.env.OPENBROWSER_RENDERER === 'source';
const roxyPreview = sourceRenderer || process.env.OPENBROWSER_ROXY_UI !== '0';
const rebuildProtocol = require('./rebuild/protocol');
if (roxyPreview) rebuildProtocol.registerUiScheme(require('./host-bridge').protocol);
const fs = require('fs');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const cdp = require('./cdp');
const { BrowserEngine } = require('./engine');
const { registerExtensionIpc } = require('./main/extensions-ipc');
const { registerKernelIpc } = require('./main/kernel-ipc');
const { registerProfileIpc } = require('./main/profile-ipc');
const { registerAutomationControlIpc } = require('./main/automation-ipc');
const { registerSystemIpc } = require('./main/system-ipc');
const { createProfileRootRecoveryProbe } = require('./main/profile-root-recovery');
const { registerProxyIpc } = require('./main/proxy-ipc');
const { applyDockIcon, applyWindowChrome, trayIconImage, windowBackground, windowIconPath } = require('./main/desktop-chrome');
const { createWindowCloseHandler } = require('./main/window-close');
const { LiveSyncController } = require('./live-sync-v5');

function workbenchRoot() {
  if (!sourceRenderer) {
    const workbench = path.join(__dirname, 'roxy-ui');
    if (!fs.existsSync(path.join(workbench, 'index.html'))) {
      throw Error('找不到工作台，请先运行 npm run rebuild:ui');
    }
    return workbench;
  }
  const standalone = path.join(__dirname, 'frontend', 'dist');
  if (fs.existsSync(path.join(standalone, 'index.html'))) return standalone;
  const packaged = path.join(__dirname, 'roxy-ui', 'source-frontend');
  if (fs.existsSync(path.join(packaged, 'index.html'))) return packaged;
  throw Error('找不到源码工作台，请先运行 npm run build:renderer');
}

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
const { attachShellNavigationGuard, createShellNavigationPolicy } = require('./automation/shell-guard');
const { fetchStoreEntries } = require('./automation/store-fetch');
const { fetchStorePackage, fetchChromeStoreIcon, fetchChromeStoreMetadata, validChromeStoreId } = require('./main/chrome-store-metadata');
const { startAutomation } = require('./automation');

const { ensureDataRootIsolationSecure, terminateProcessesUsingProfile, sanitizeIds } = require('./automation/isolation');
const { createCrashHandler, buildHelperProcessGoneReport } = require('./automation/crash-report');
const { writeBrowserStartupDiagnostic } = require('./engine/diagnostics');
const appUpdate = require('./automation/app-update');
const settingsStore = require('./automation/local-settings');
const cloudOps = require('./automation/cloud-ops');
const { lifecycleTimeout } = require('./engine/browser-candidates');

const appDataRoot = app.getPath('appData');
const cliDataRoot = process.argv.find(arg => arg.startsWith('--openbrowser-user-data='))?.slice(24);
const userDataRoot = cliDataRoot ? path.resolve(cliDataRoot) : process.env.OPENBROWSER_USER_DATA
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
  app.on('second-instance', (_event, argv) => { showMainWindow(); handleProfileLaunch(argv); });
}
app.on('open-url', (event, url) => { event.preventDefault(); handleProfileLaunch([url]); });

const defaultProfileDataRoot = path.join(app.getPath('userData'), 'browser-profiles-v2');
const localSettingsFile = path.join(app.getPath('userData'), 'openbrowser-local-settings.json');

// Unexpected global failures stop new IPC work and enter a bounded shutdown.
// Recoverable operation failures belong at their domain boundaries.
let fatalFailure = false;
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
const handleFatalError = require('./main/fatal-error').createFatalErrorHandler({
  log: logGlobalFailure,
  shutdown: () => {
    fatalFailure = true;
    engine?.beginShutdown?.();
    // A stalled Agent/store shutdown must not keep external browsers alive
    // until the fatal deadline terminates their controlling host.
    drainBrowsersForQuit().catch(error => logGlobalFailure('fatal-browser-drain', error));
    return beginQuitCleanup();
  },
  exit: code => app.exit(code),
});
process.on('unhandledRejection', reason => { fatalFailure = true; handleFatalError('unhandledRejection', reason); });
process.on('uncaughtException', error => { fatalFailure = true; handleFatalError('uncaughtException', error); });

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
  const assertWritable = () => {
    if (quitting || engine.shuttingDown) {
      throw Object.assign(new Error('应用正在退出，无法更改环境数据目录'), { code: 'APP_SHUTTING_DOWN' });
    }
  };
  assertWritable();
  const lease = engine.reserveProfileDataRootChange(settingsStore.normalizeProfileDataRoot(value));
  const profileRoot = lease.root;
  try {
    const result = { success: true, profileRoot, defaultProfileRoot: defaultProfileDataRoot };
    const current = engine.getProfileDataRoot();
    if (profileRoot === current) return { ...result, changed: false };
    const verifyRecoveryClear = createProfileRootRecoveryProbe({ userData: app.getPath('userData'), current, candidate: profileRoot });
    await verifyRecoveryClear({ allowMissingCandidate: true });
    assertWritable();
    const secureCheck = await ensureDataRootIsolationSecure(profileRoot);
    if (!secureCheck.ok) throw new Error(secureCheck.message);
    assertWritable();
    await settingsStore.commitProfileDataRoot(profileRoot, {
      verifyBeforeReplace: verifyRecoveryClear,
      beforeReplace() { assertWritable(); lease.assertUsable(); },
      publish: lease.publish,
    });
    emit({ type: 'storage-settings', profileRoot });
    return { ...result, changed: true };
  } finally {
    lease.release();
  }
}
let engine;
let engineInitComplete = false;
let liveSync;
let automation = null;
// Lazy accessor shared by the rebuild:request LocalService wiring below and
// (via getters) the proxy IPC domain in main/proxy-ipc.js.
const proxyStoreAccessor = () => {
  if (!automation?.proxyStore) throw new Error('代理库未就绪');
  return automation.proxyStore;
};
let resolveStartupReady;
let rejectStartupReady;
const startupReady = new Promise((resolve, reject) => { resolveStartupReady = resolve; rejectStartupReady = reject; });
startupReady.catch(() => {});
let startupFailed = false;
let quitting = false;
let quitCleanupPromise = null;
let quitBrowserDrain = null;
let localUiService;
let localUiDialogs;
let localUiWorkspaces;
let localUiSync;
let quitCleanupSettled = false;
let syncSelection = [];
let syncState = { active: false, master: null, selected: [] };
const windows = new Set();
let mainWindow = null;
async function handleProfileLaunch(argv) {
  try {
    const request = require('./rebuild/host-actions').parseLaunch(argv);
    if (!request.id && !request.urls.length) return;
    await startupReady;
    if (quitting) throw Error('应用正在退出');
    let defaultId;
    if (!request.id) {
      if (localUiService) defaultId = (await localUiService.request('settings:get')).defaultProfileId;
      else {
        const { data: saved } = await require('./rebuild/local-store').readLocalStore(path.join(app.getPath('userData'), 'rebuild-local.json'));
        if (saved.version !== 1) throw Error('不支持的本地设置版本');
        defaultId = saved.settings?.defaultProfileId;
      }
    }
    await require('./rebuild/host-actions').openLaunch(engine, request, defaultId);
  } catch (error) {
    console.error('[OpenBrowser] profile launcher:', error.message);
    try { dialog.showErrorBox('OpenBrowser', error.message); } catch (_) {}
  }
}

function trustedAppIndexUrl() {
  // Canonical UI document: only this exact file:// path may call registerTrustedIpc.
  // Reject other file:///…/index.html (e.g. /tmp/malicious/index.html) even if loaded in mainWindow.
  return pathToFileURL(path.join(__dirname, 'index.html')).href;
}

/** Windows file: URLs may differ only by drive-letter case (C: vs c:). Compare paths case-insensitively. */
function isTrustedAppIndexUrl(senderUrl) {
  if (roxyPreview) return rebuildProtocol.isUiDocument(senderUrl);
  const expected = trustedAppIndexUrl();
  const raw = String(senderUrl || '');
  if (raw === expected || raw.startsWith(expected + '?') || raw.startsWith(expected + '#')) return true;
  if (process.platform !== 'win32') return false;
  const lower = raw.toLowerCase();
  const expectedLower = expected.toLowerCase();
  return lower === expectedLower || lower.startsWith(expectedLower + '?') || lower.startsWith(expectedLower + '#');
}

function assertTrustedIpcSender(event) {
  if (fatalFailure) throw Object.assign(new Error('应用发生异常，正在关闭，请重新启动。'), { code: 'APP_SHUTTING_DOWN' });
  const isMain = mainWindow && !mainWindow.isDestroyed() && event?.sender === mainWindow.webContents;
  if (!isMain && !localUiDialogs?.owns(event?.sender) && !localUiWorkspaces?.owns(event?.sender)) {
    throw new Error('untrusted IPC sender');
  }
  const senderUrl = String(event.sender.getURL?.() || '');
  if (!isTrustedAppIndexUrl(senderUrl)) {
    throw new Error('untrusted IPC document');
  }
}

async function beforeProfileRemoval(ids) {
  const removed = new Set(ids);
  if (syncState.active && syncState.selected.some((id) => removed.has(id))) await endSync();
  syncSelection = syncSelection.filter((id) => !removed.has(id));
  syncState = { ...syncState, selected: syncState.selected.filter((id) => !removed.has(id)) };
  emit({ type: 'sync-state', ...syncSnapshot() });
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
let syncActionInFlight = false;

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

function ensureTray() {
  if (tray || process.platform === 'darwin') return;
  const strings = closeActionStrings();
  const candidate = new Tray(trayIconImage(nativeImage));
  try {
    candidate.setToolTip(strings.trayTooltip);
    candidate.setContextMenu(Menu.buildFromTemplate([
      { label: strings.trayShow, click: () => showMainWindow() },
      { type: 'separator' },
      { label: strings.trayQuit, click: () => app.quit() },
    ]));
    // Windows: left click restores the window, right click opens the menu.
    candidate.on('click', () => showMainWindow());
    tray = candidate;
  } catch (error) {
    try { candidate.destroy(); } catch (_) {}
    throw error;
  }
}

function destroyTray() {
  try { tray?.destroy(); } catch (_) {}
  tray = null;
}

function hideMainWindowToTray(win) {
  try { ensureTray(); }
  catch (error) {
    console.warn('[OpenBrowser] tray setup failed; minimizing the window:', error?.message || error);
    win.minimize();
    return;
  }
  win.hide();
}

function showMainWindow() {
  if (quitting) return;
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
  // Re-entrancy guard: the shortcut path has always been serialized via
  // shortcutActionInFlight, but the renderer's ops.startSync and the Local API
  // can both reach this directly — two overlapping runs used to tile + sync
  // tabs twice (a CDP fan-out storm) and raced each other's stop()/start()
  // into misleading "窗口已关闭" errors.
  if (syncActionInFlight) throw new Error('同步操作正在执行，请稍候');
  syncActionInFlight = true;
  try {
    return await beginSyncInner(ids);
  } finally {
    syncActionInFlight = false;
  }
}

async function beginSyncInner(ids = syncSelection) {
  let selected = sanitizeIds(ids);
  let expanded = false;
  if (selected.length < 2) {
    selected = engine.runningWithCdp([...engine.running.keys()]).map((entry) => entry.id);
    expanded = selected.length >= 2;
  }
  if (selected.length < 2) throw new Error('\u8bf7\u81f3\u5c11\u9009\u62e9\u4e24\u4e2a\u8fd0\u884c\u4e2d\u7684\u6d4f\u89c8\u5668\u73af\u5883');
  if (expanded) emit({ type: 'sync-notice', message: '\u672a\u9009\u62e9\u73af\u5883\uff0c\u5df2\u81ea\u52a8\u7eb3\u5165\u5168\u90e8\u8fd0\u884c\u4e2d\u7684\u73af\u5883\u8fdb\u884c\u540c\u6b65' });
  const assertRunning = () => {
    if (engine.runningWithCdp(selected).length !== selected.length) {
      throw new Error('选中的窗口已关闭或无法同步，请重新选择');
    }
  };
  assertRunning();
  await tile(selected, false);
  assertRunning();
  const tabs = await syncTabsFromMaster(selected);
  assertRunning();
  await liveSync.start(selected);
  syncSelection = selected;
  syncState = { active: true, master: selected[0], selected };
  try{await localUiSync?.request('sync:apply-color');}catch(error){await endSync();throw error;}
  emit({ type: 'sync-state', ...syncSnapshot() });
  return { success: true, ...tabs, state: syncSnapshot() };
}

async function endSync() {
  liveSync?.stop();
  // The color reset is cosmetic: a renderer that is already gone (window
  // closed) used to throw here and leave syncState.active = true forever —
  // the UI kept showing "同步中" while the sync engine was already down.
  try { await localUiSync?.request('sync:reset-color'); }
  catch (error) { console.warn('[sync] reset-color failed:', error?.message || error); }
  syncState = { active: false, master: null, selected: [...syncSelection] };
  emit({ type: 'sync-state', ...syncSnapshot() });
  return { success: true, state: syncSnapshot() };
}

async function restartSync() {
  await endSync();
  return beginSync(syncSelection);
}

async function runShortcut(action) {
  if (shortcutActionInFlight) return;
  shortcutActionInFlight = true;
  emit({ type: 'shortcut-triggered', action });
  try {
    if (action === 'start') await beginSync(syncSelection);
    else if (action === 'stop') await endSync();
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

let initialSettingsLoad;
function loadSettingsForStartup() {
  initialSettingsLoad ||= settingsStore.loadLocalSettings();
  return initialSettingsLoad;
}

async function createWindow() {
  /** @type {Record<string, any>} */
  const options = {
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: 'OpenBrowser',
    icon: windowIconPath(),
    backgroundColor: windowBackground(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: true, spellcheck: false },
  };

  // Keep a native drag/resize frame above the workbench on every platform.
  // Caption buttons must not cover the application header or profile menu.
  options.title = `OpenBrowser v${app.getVersion()}`;
  options.frame = true;

  const win = new BrowserWindow(options);
  mainWindow = win;
  windows.add(win);
  win.on('closed', () => { windows.delete(win); if (mainWindow === win) { localUiDialogs?.closeAll(); localUiWorkspaces?.closeAll(); mainWindow = null; } });
  win.on('close', createWindowCloseHandler(win, {
    isQuitting: () => quitting,
    settingsReady: loadSettingsForStartup(),
    readPreference: () => settingsStore.normalizeCloseAction(settingsStore.getLocalSettings().closeAction),
    getPreferenceGeneration: () => settingsStore.getCloseActionGeneration(),
    ask: askCloseAction,
    hide: hideMainWindowToTray,
    remember(mode, expectedGeneration) {
      return settingsStore.commitCloseSettings({ closeAction: mode }, {
        expectedGeneration, isQuitting: () => quitting,
        isOwner: () => mainWindow === win && !win.isDestroyed(),
        onExit() { destroyTray(); },
      });
    },
  }));
  let presented = false;
  const present = () => {
    if (presented || quitting || win.isDestroyed()) return;
    presented = true;
    if (!win.isVisible()) win.show();
    if (win.isMinimized()) win.restore();
    win.focus();
  };
  win.once('ready-to-show', present);
  win.setMenu(null);
  // The shell renders local files only: block navigation away from them and
  // keep child windows denied (a child would inherit this window's preload).
  attachShellNavigationGuard(win.webContents, {
    policy: createShellNavigationPolicy({ localUi: roxyPreview }),
    onBlocked: ({ url, reason }) => console.warn('[shell] blocked navigation:', url, reason),
  });
  if (roxyPreview) await win.loadURL(rebuildProtocol.DOCUMENT);
  else await win.loadFile('index.html');
  // A paint event and a successful load are alternatives, not two restores.
  present();
}

function reportStartupFailure(error) {
  if (startupFailed || quitting) return;
  startupFailed = true;
  rejectStartupReady(error);
  const message = error?.message || String(error);
  console.error('OpenBrowser startup failed:', message);
  try { dialog.showErrorBox('OpenBrowser', `启动失败：${message}\n\n程序即将退出。`); } catch (_) {}
  app.exit(1);
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
    applyDockIcon(app.dock);
  }
  if (roxyPreview) {
    const host = require('./host-bridge');
    rebuildProtocol.installUiProtocol(host.protocol, host.net, workbenchRoot(), {
      agentFile: (id) => { if (!localUiService?.agent) throw Error('附件服务尚未就绪'); return localUiService.agent.files.get(id); },
    });
    const { DialogWindows } = require('./rebuild/dialog-windows');
    localUiDialogs = new DialogWindows({ BrowserWindow, parent: () => mainWindow, windows });
    const { WorkspaceWindows } = require('./rebuild/workspace-windows');
    localUiWorkspaces = new WorkspaceWindows({ BrowserWindow, parent: () => mainWindow, windows });
  }
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = String(details.url || '');
    if (roxyPreview) {
      const local = rebuildProtocol.isUiRequest(url);
      callback({ cancel: !local });
      return;
    }
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
  if (roxyPreview) {
    const { captureIpcResult } = require('./shared/ipc-result');
    registerTrustedIpc('rebuild:request', (_event, method, payload) => captureIpcResult(async () => {
      await startupReady;
      if (typeof method === 'string' && method.startsWith('ui:dialog:'))
        return localUiDialogs.request(method, payload, _event.sender);
      if (typeof method === 'string' && method.startsWith('ui:workspace:'))
        return localUiWorkspaces.request(method, payload, _event.sender);
      if (typeof method === 'string' && method.startsWith('sync:'))
        return localUiSync.request(method, payload);
      if (!localUiService) {
        const { LocalService } = require('./rebuild/local-service');
        localUiService = new LocalService({ engine, root: app.getPath('userData'), dialog, window: () => BrowserWindow.getFocusedWindow() || mainWindow, proxyStore: proxyStoreAccessor, accountStore: () => automation?.accountStore, automation: () => automation, beforeRemove: beforeProfileRemoval,
          isSynchronizing: (id) => syncState.active && syncState.selected.includes(id) });
      }
      return localUiService.request(method, payload);
    }));
  }
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
    titleBarIntegrated: false,
    platform: process.platform,
    closeAction: settingsStore.normalizeCloseAction(settingsStore.getLocalSettings().closeAction),
    };
  });
  // The renderer's initialize() also invokes sync:state right after getInfo —
  // same early-registration requirement, or the bare await in initialize()
  // rejects and the profile list never renders (verified in round 2).
  registerTrustedIpc('sync:state', () => syncSnapshot());
  const localSettingsPromise = loadSettingsForStartup();
  const windowPromise = createWindow().catch((error) => {
    // An aborted navigation can be superseded by a healthy load. Keep the
    // window's ready-to-show listener and allow the engine to become ready.
    if (error?.code === 'ERR_ABORTED' || error?.errno === -3) return;
    // A hard document failure cannot be recovered by the unrelated storage
    // startup path. Surface it without waiting for disk or engine readiness.
    reportStartupFailure(error);
  });
  const localSettings = await localSettingsPromise;
  if (startupFailed || quitting) return;
  const initialRootCheck = await ensureDataRootIsolationSecure(localSettings.profileDataRoot);
  if (startupFailed || quitting) return;
  if (!initialRootCheck.ok) throw new Error(initialRootCheck.message);
  engine = new BrowserEngine(app, {
    profileDataRoot: localSettings.profileDataRoot,
    getHostScaleFactor: pickDisplayScaleFactor,
    requestSystemNetwork: require('./main/system-network').createSystemNetworkRequester(session),
  });
  liveSync = new LiveSyncController(engine, handleLiveSyncEvent);
  await engine.init(path.join(__dirname, 'bundled-extension'));
  engineInitComplete = true;
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
      require('./automation/close-profile-sync').syncClosedProfile(engine, value, {
        cloud, groups: settingsStore.getLocalSettings().uiGroups || [],
        push: payload => cloudOps.runCloudProfilePush(payload),
        onError: error => {
          console.warn('OpenBrowser auto cloud push failed:', error.message);
          emit({ type: 'cloud-sync', action: 'profile-push-error', id: value.profile.id, message: error.message });
        },
      });
    }
  });
  engine.ensureKernelBootstrap().catch((error) => console.error('OpenBrowser kernel bootstrap failed:', error.message));
  // Background: a kernel tree that no longer matches its install record is
  // reported through kernel-progress instead of failing later without a cause.
  engine.kernelIntegrityCheck?.().then((summary) => {
    if (summary && summary.status === 'mismatch') console.warn('[kernel] integrity mismatch', summary);
  }).catch((error) => console.warn('[kernel] integrity check skipped:', error.message));
  if (!roxyPreview) {
    startShortcutBridge();
    registerTextShortcuts();
  } else {
    const { SyncService } = require('./rebuild/sync-service');
    localUiSync = new SyncService({ engine, controller: liveSync, state: syncSnapshot, workArea: pickWorkArea,
      textAssignments: runTextAssignments, windowAction: runSyncWindowAction, tabAction: runSyncTabAction,
      shortcuts: globalShortcut, shortcutAction: runLocalSyncShortcut });
  }

  try {
    const apiConfig = await require('./rebuild/local-api').startupConfig(app.getPath('userData'));
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
      port: Number(process.env.OPENBROWSER_API_PORT || apiConfig.port || 50325),
      apiHost: apiConfig.apiAllowLan ? '0.0.0.0' : '127.0.0.1',
      apiEnabled: apiConfig.open !== false,
      apiKey: process.env.OPENBROWSER_API_KEY || undefined,
    });
  } catch (error) {
    emit({ type: 'local-api-error', message: error.message });
    console.error('Local API failed to start:', error.message);
  }

  registerSystemIpc({ registerTrustedIpc, shell, dialog, clipboard, BrowserWindow,
    getEngine: () => engine, getAutomation: () => automation, getMainWindow: () => mainWindow,
    defaultProfileDataRoot, isQuitting: () => quitting, destroyTray, applyWindowChrome, updateProfileDataRoot });
  registerKernelIpc({ registerTrustedIpc, engine, dialog });
  registerProfileIpc({
    registerTrustedIpc, engine, sanitizeIds,
    beforeRemove: beforeProfileRemoval,
  });

  registerExtensionIpc({ registerTrustedIpc, engine, dialog, sanitizeIds, fetchStorePackage });

  registerTrustedIpc('sync:sessions', () => engine.sessions());
  registerTrustedIpc('sync:selection', (_event, ids) => { syncSelection = sanitizeIds(ids); syncState.selected = [...syncSelection]; emit({ type: 'sync-state', ...syncSnapshot() }); return syncSnapshot(); });
  registerTrustedIpc('sync:settings:get', () => liveSync.getSettings());
  registerTrustedIpc('sync:settings:set', (_event, value) => liveSync.updateSettings(value));
  registerTrustedIpc('sync:start', (_event, ids) => beginSync(ids));
  registerTrustedIpc('sync:stop', () => endSync());
  registerTrustedIpc('sync:restart', () => restartSync());
  async function runSyncWindowAction(payload) {
    const ids = sanitizeIds(payload.ids); const entries = engine.runningWithCdp(ids); const action = String(payload.action);
    if (action === 'matrix') return tile(ids, false, payload.options || {});
    if (action === 'tile') return tile(ids, false);
    if (action === 'cascade') return tile(ids, true);
    if (!['minimized', 'normal', 'maximized', 'fullscreen'].includes(action)) throw new Error('Unknown window action');
    const transitions = await Promise.all(entries.map(({ item }) => cdp.setWindowState(item.port, action, action === 'fullscreen'
      ? { verify: true, fallbackState: 'maximized' }
      : {})));
    return { success: true, count: entries.length, degraded: transitions.filter((value) => value?.degraded).length };
  }
  registerTrustedIpc('sync:window', (_event, payload) => runSyncWindowAction(payload));
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
  async function runSyncTabAction(payload) {
    const ids = sanitizeIds(payload.ids); const entries = engine.runningWithCdp(ids); const action = String(payload.action); const value = payload.payload || {};
    if (action === 'sync') return syncTabsFromMaster(ids);
    if (action === 'list') return engine.sessions();
    // Roxy 统一标签页语义：closeOthers = 关闭除当前页外的全部标签页；closeBlank = 关闭空白标签页。
    const isBlankTab = (url) => /^(about:blank|chrome:\/\/(newtab|new-tab-page)\/?)/i.test(String(url || ''));
    // Environments are independent (same rationale as syncTabsFromMaster and
    // runTextAssignments): the old serial loop chained every CDP hop across
    // all environments, so 10 environments x closeOthers was 60+ sequential
    // round trips — seconds of visible UI stall.
    const failures = [];
    await Promise.all(entries.map(async ({ item }) => {
      try {
        if (action === 'new') await cdp.newTab(item.port, String(value.url || 'about:blank'));
        else if (action === 'navigate') {
          const current = await cdp.activeTab(item.port);
          if (current) await cdp.call(current.webSocketDebuggerUrl, 'Page.navigate', { url: String(value.url || 'about:blank') });
          else await cdp.newTab(item.port, String(value.url || 'about:blank'));
        }
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
      } catch (error) {
        failures.push({ id: item.id, message: String(error?.message || error) });
      }
    }));
    if (failures.length) {
      const error = new Error(`部分环境标签页操作失败（${failures.length}/${entries.length}）：${failures.map((failure) => failure.message).join('; ')}`);
      error.failures = failures;
      throw error;
    }
    return { success: true, count: entries.length };
  }
  registerTrustedIpc('sync:tabs', (_event, payload) => runSyncTabAction(payload));

  async function runLocalSyncShortcut(action) {
    if (quitting) return;
    try {
      const ids = syncSnapshot().selected;
      const openDialog = (kind) => localUiDialogs.request('ui:dialog:open', { kind });
      if (action === 'startSync') { await beginSync(ids); emit({ channel: 'local:navigate', payload: '/synchronizer/active' }); }
      else if (action === 'stopSync') { await endSync(); emit({ channel: 'local:navigate', payload: '/synchronizer' }); }
      else if (action === 'showAllWindows') await runSyncWindowAction({ ids, action: 'normal' });
      else if (action === 'gridLayout' || action === 'stackLayout') await runSyncWindowAction({ ids, action: action === 'gridLayout' ? 'tile' : 'cascade' });
      else if (action === 'openBatchInputDialog') await openDialog('batch-inputs');
      else if (action === 'openSites') await openDialog('open-sites');
      else if (action === 'openSyncWindowList') await openDialog('syncing-window-list');
      else if (action === 'openPreferenceSettings') await openDialog('preferences');
      else await runSyncTabAction({ ids, action: ({ unifiedTabs: 'sync', closeOtherTabs: 'closeOthers', closeCurrentTab: 'close', closeBlankTabs: 'closeBlank' })[action] });
    } catch (error) { emit({ channel: 'local:error', payload: error.message }); }
  }

  registerTrustedIpc('automation:local-api', () => automation?.info || null);
  registerTrustedIpc('automation:local-api-version', async () => {
    if (!automation?.localApi) throw new Error('Local API is not ready');
    return automation.localApi.route('GET', '/api/getVersion', {});
  });
  registerTrustedIpc('automation:fingerprint', (_event, id) => engine.fingerprintFor(String(id || '')));
  registerTrustedIpc('automation:isolation-audit', () => engine.isolationAudit());
  registerTrustedIpc('automation:build-ua', (_event, payload = {}) => require('./automation/editor-ua').buildEditorUa(engine, payload));

  registerProxyIpc({ registerTrustedIpc, getEngine: () => engine, getProxyStore: proxyStoreAccessor, sanitizeIds });
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










  // Window creation and engine initialization run in parallel, but ordinary
  // renderer IPC opens only when both startup branches are done.
  await windowPromise;
  if (startupFailed || quitting) return;
  resolveStartupReady();
  handleProfileLaunch(process.argv);
  appUpdate.startAppUpdateWatcher();
}).catch(reportStartupFailure);

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
    await Promise.allSettled(remaining.map((id) => lifecycleTimeout(
      Promise.resolve().then(() => engine.stop(id)), 5_000, `Quit browser retry timed out for ${id}`
    )));
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

function drainBrowsersForQuit() {
  quitBrowserDrain ||= Promise.resolve().then(() => stopAllForQuit());
  return quitBrowserDrain;
}

function beginQuitCleanup() {
  if (quitCleanupPromise) return quitCleanupPromise;
  quitting = true;
  engine?.beginShutdown?.();
  destroyTray();
  const cloud = settingsStore.getLocalSettings()?.cloud || {};
  let stopResult = { stopped: false, remaining: [], errors: [] };
  let persistenceFailed = false;
  const stageTimeoutMs = 15_000;
  const runStage = (name, action, timeout = stageTimeoutMs) => lifecycleTimeout(
    Promise.resolve().then(action), timeout, `Quit ${name} timed out after ${timeout / 1000}s`
  );
  const runFlush = async (name, action) => {
    try { await runStage(name, action); }
    catch (error) {
      persistenceFailed = true;
      console.warn(`OpenBrowser quit ${name} failed:`, error?.message || error);
    }
  };
  quitCleanupPromise = Promise.resolve()
    .then(async () => {
      const services = [
        ['local-sync', () => localUiSync?.shutdown()],
        ['local-agent', () => localUiService?.agent?.shutdown()],
        ['cookie-robot', () => localUiService?.robot?.shutdown()],
        ['local-extensions', async () => { await localUiService?.queue; await localUiService?.extensions?.shutdown(); }],
      ];
      await Promise.all(services.map(async ([service, shutdown]) => {
        try { await runStage(service, shutdown); }
        catch (error) {
          persistenceFailed = true;
          const message = error?.message || String(error);
          console.warn('OpenBrowser quit local service failed:', service, message);
          try {
            await runStage('diagnostic', () => writeBrowserStartupDiagnostic(app.getPath('userData'), {
              type: 'local-service-shutdown-error', service, message,
            }), 2_000);
          } catch (error) { console.warn('OpenBrowser quit diagnostic failed:', error.message); }
        }
      }));
    })
    .then(async () => {
      try { stopResult = await drainBrowsersForQuit(); }
      catch (error) {
        persistenceFailed = true;
        console.warn('OpenBrowser quit browser drain failed:', error?.message || error);
      }
    })
    .then(() => runFlush('engine flush', () => engine?.flushPersistence?.()))
    // A settings change made moments before quitting may still be inside the
    // quiet period; write it out before the process goes away.
    .then(() => runFlush('settings flush', () => settingsStore.flushSettingsWriter()))
    // RPA task/template updates coalesce into one quiet-period write; flush it
    // before the process goes away so the final task status reaches the disk.
    .then(() => runFlush('rpa-store flush', () => automation?.rpaStore?.flush?.()))
    .then(() => {
      try { liveSync?.stop?.(); } catch (error) {
        console.warn('OpenBrowser quit live-sync cleanup failed:', error?.message || error);
      }
    })
    .then(() => runFlush('automation cleanup', () => automation?.stop?.()))
    .then(async () => {
      // Stop browsers and flush close-time state before packaging browser data.
      // Otherwise the backup can capture stale cookies or locked SQLite/LevelDB files.
      if (!stopResult.stopped) return;
      if (stopResult.remaining.length) return;
      if (persistenceFailed) return;
      if (fatalFailure || !cloud.enabled || !cloud.autoSyncOnQuit || !engineInitComplete) return;
      try {
        // The quit chain is the only path that actually exits the app, so a
        // hung backup (network mount, huge browser-data archive) must not
        // keep the windowless process alive indefinitely.
        await lifecycleTimeout(
          cloudOps.runQuitCloudBackup({
            profiles: [...(engine?.profiles?.values?.() || [])],
            groups: settingsStore.getLocalSettings().uiGroups || [],
            cloud,
          }),
          90_000,
          'Quit auto-backup timed out after 90s; exiting anyway'
        );
      } catch (error) {
        if (error.code === 'CLOUD_QUIT_BACKUP_BLOCKED') {
          console.warn('OpenBrowser quit auto-backup skipped:', error.message);
          return; // A safety veto must not rewrite settings during recovery.
        }
        console.warn('OpenBrowser quit auto-backup failed:', error.message);
        try {
          const failedSettings = settingsStore.getLocalSettings();
          failedSettings.cloud = { ...cloud, lastError: error.message };
          await runStage('backup diagnostic', () => settingsStore.saveLocalSettings(failedSettings), 2_000);
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
      app.exit(fatalFailure ? 1 : 0);
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

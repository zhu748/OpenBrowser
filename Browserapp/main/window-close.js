'use strict';

const INITIAL_SETTINGS_TIMEOUT_MS = 2_000;

async function settingsLoadedInTime(load) {
  let timer;
  try {
    return await Promise.race([
      load.then(() => true, () => false),
      new Promise(resolve => { timer = setTimeout(resolve, INITIAL_SETTINGS_TIMEOUT_MS, false); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function createWindowCloseHandler(win, {
  isQuitting, readPreference, ask, hide, remember, settingsReady, platform = process.platform,
}) {
  let pending = null;
  let allowNextClose = false;
  let loadingSettings = settingsReady;
  settingsReady?.then(() => { loadingSettings = null; }, () => {});
  const windowIsActive = () => !isQuitting() && !win.isDestroyed();
  const closeAgain = () => {
    allowNextClose = true;
    try { win.close(); } catch (error) { allowNextClose = false; throw error; }
  };

  return function handleClose(event) {
    // macOS owns the close-to-Dock convention. App quit never needs a dialog.
    if (isQuitting() || platform === 'darwin') return;
    if (allowNextClose) { allowNextClose = false; return; }
    if (pending) { event.preventDefault(); return pending; }
    const settingsLoad = loadingSettings;
    const preference = settingsLoad ? null : readPreference();
    if (preference === 'exit') return;
    event.preventDefault();
    if (preference === 'tray') { hide(win); return; }

    pending = Promise.resolve()
      .then(async () => {
        if (!windowIsActive()) return;
        if (settingsLoad) {
          const loaded = await settingsLoadedInTime(settingsLoad);
          if (!windowIsActive()) return;
          // Never offer to remember a choice against factory defaults if the
          // saved settings are unreadable or still taking too long to load.
          const savedPreference = loaded ? readPreference() : 'exit';
          if (savedPreference === 'exit') { closeAgain(); return; }
          if (savedPreference === 'tray') { hide(win); return; }
        }
        const decision = await ask(win);
        if (!windowIsActive()) return;
        if (decision.remember) remember(decision.mode);
        if (decision.mode === 'tray') {
          hide(win);
          return;
        }
        closeAgain();
      })
      .catch(() => { try { if (windowIsActive()) hide(win); } catch (_) {} })
      .finally(() => { pending = null; });
    return pending;
  };
}

module.exports = { createWindowCloseHandler };

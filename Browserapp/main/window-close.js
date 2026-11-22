'use strict';

function createWindowCloseHandler(win, {
  isQuitting, readPreference, ask, hide, remember, platform = process.platform,
}) {
  let pending = null;
  let allowNextClose = false;
  const windowIsActive = () => !isQuitting() && !win.isDestroyed();

  return function handleClose(event) {
    // macOS owns the close-to-Dock convention. App quit never needs a dialog.
    if (isQuitting() || platform === 'darwin') return;
    if (allowNextClose) { allowNextClose = false; return; }
    if (pending) { event.preventDefault(); return pending; }
    const preference = readPreference();
    if (preference === 'exit') return;
    event.preventDefault();
    if (preference === 'tray') { hide(win); return; }

    pending = Promise.resolve()
      .then(async () => {
        if (!windowIsActive()) return;
        const decision = await ask(win);
        if (!windowIsActive()) return;
        if (decision.remember) remember(decision.mode);
        if (decision.mode === 'tray') {
          hide(win);
          return;
        }
        allowNextClose = true;
        try { win.close(); } catch (error) { allowNextClose = false; throw error; }
      })
      .catch(() => { try { if (windowIsActive()) hide(win); } catch (_) {} })
      .finally(() => { pending = null; });
    return pending;
  };
}

module.exports = { createWindowCloseHandler };

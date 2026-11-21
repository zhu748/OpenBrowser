"use strict";

const { writeBrowserStartupDiagnostic } = require("./diagnostics");

/** Attach cleanup after the running item is published; replay early process exit. */
function attachBrowserExitHandlers(engine, profileId, item, child) {
  const handleChildExit = (code, signal) => {
    const expected = item.expectedExit === true || code === 0;
    const error = expected
      ? null
      : `浏览器异常退出${signal ? ` (${signal})` : ` (code ${code})`}`;
    if (!expected) {
      try {
        const userData = engine.app?.getPath?.("userData");
        if (userData) void writeBrowserStartupDiagnostic(userData, {
          type: "browser-process-exit", profileId, browser: item.browser?.name,
          pid: child.pid, exitCode: code, signal, lifecycleGeneration: item.lifecycleGeneration,
          cleanupReason: item.exitCleanupReason,
        });
      } catch (_) { /* Diagnostic collection must not interrupt cleanup. */ }
    }
    engine
      .handleBrowserGone(profileId, item, "browser-exit", {
        expected,
        error,
        kill: true,
        waitForExit: true,
      })
      .catch((cleanupError) => {
        engine.emit({
          type: "sync-error",
          action: "browser-exit-cleanup",
          id: profileId,
          message: cleanupError.message,
        });
      });
  };
  const handleChildError = (error) => {
    engine
      .handleBrowserGone(profileId, item, "browser-error", {
        expected: false,
        error: error?.message || String(error),
        kill: true,
        waitForExit: true,
      })
      .catch(() => {});
  };
  child.once("exit", (code, signal) => {
    item.childExitState = {
      ...(item.childExitState || {}),
      exited: true,
      code,
      signal,
    };
    handleChildExit(code, signal);
  });
  child.once("error", (error) => {
    item.childExitState = { ...(item.childExitState || {}), error };
    handleChildError(error);
  });
  // The process may have exited during CDP/bootstrap setup, before the item
  // listeners above were installed. Replay that state exactly once.
  if (item.childExitState?.exited) {
    queueMicrotask(() =>
      handleChildExit(item.childExitState.code, item.childExitState.signal),
    );
  } else if (item.childExitState?.error) {
    queueMicrotask(() => handleChildError(item.childExitState.error));
  }
}

module.exports = { attachBrowserExitHandlers };

(() => {
  'use strict';

  /** Coalesce event bursts, serialize refreshes, and retain one trailing refresh. */
  function createRefreshScheduler({
    refresh, delay = 120, isPaused = () => false, onError = () => {},
    setTimer = setTimeout, clearTimer = clearTimeout,
  }) {
    let timer = null;
    let running = false;
    let pending = false;
    let disposed = false;

    function schedule() {
      if (disposed || !pending || running || timer !== null || isPaused()) return;
      timer = setTimer(run, delay);
    }

    async function run() {
      timer = null;
      if (disposed || !pending || isPaused()) return;
      pending = false;
      running = true;
      try {
        await refresh();
      } catch (error) {
        try { onError(error); } catch { /* observers cannot break scheduling */ }
      } finally {
        running = false;
        schedule();
      }
    }

    return {
      request() { if (!disposed) { pending = true; schedule(); } },
      resume: schedule,
      dispose() {
        disposed = true;
        pending = false;
        if (timer !== null) clearTimer(timer);
        timer = null;
      },
    };
  }

  const api = { createRefreshScheduler };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserRefreshScheduler = api;
})();

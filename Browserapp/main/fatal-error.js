'use strict';

/** Stop accepting work after an uncaught failure. Cleanup is single-flight and
 * bounded: a failed shutdown must never leave a damaged host serving requests.
 * Dependencies are injected so this policy can be checked without Electron. */
function createFatalErrorHandler({ log, shutdown, exit, timeoutMs = 15000,
  setTimer = setTimeout, clearTimer = clearTimeout }) {
  let stopping;
  let timer;
  let finished = false;
  const record = (kind, error) => {
    try { log(kind, error); } catch (_) { /* logging cannot re-enter failure handling */ }
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimer(timer);
    exit(1);
  };
  return (kind, error) => {
    record(kind, error);
    if (!stopping) {
      timer = setTimer(finish, timeoutMs);
      stopping = Promise.resolve().then(shutdown)
        .catch(failure => record('fatal-shutdown', failure)).finally(finish);
    }
    return stopping;
  };
}

module.exports = { createFatalErrorHandler };

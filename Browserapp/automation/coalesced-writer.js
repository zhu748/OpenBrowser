'use strict';

/**
 * Whole-value persistence with coalesced writes.
 *
 * Callers hand in a writer that persists the current state. A burst of requests
 * runs that writer once after a quiet period, and every caller still learns
 * whether the state it asked for reached the disk — awaiting the request means
 * the write has finished, not merely that it was queued.
 *
 * This also makes the writer single-flight: concurrent callers used to race on
 * the same temporary file, so one of them could rename a path another had just
 * removed.
 */

const { DeferredQueue } = require('./deferred-queue');

const DEFAULT_DELAY_MS = 40;

/**
 * @param {object} options
 * @param {() => (void|Promise<void>)} options.write persists the current state
 * @param {number} [options.delayMs] quiet period before a run
 * @param {() => boolean} [options.shouldWrite] skip the write when the current
 *   state already matches what was persisted. A predicate that throws is
 *   treated as "write", because persisting is the safe outcome.
 * @param {(err:Error) => void} [options.onError] observer for write failures
 * @param {boolean} [options.keepAlive=false] keep a CLI alive while requests
 *   await persistence; background retries alone do not hold the process open
 */
function createCoalescedWriter(options = {}) {
  const write = options.write;
  if (typeof write !== 'function') throw new TypeError('write must be a function');
  const delayMs = Number.isFinite(options.delayMs) && options.delayMs >= 0
    ? Number(options.delayMs)
    : DEFAULT_DELAY_MS;

  const shouldWrite = typeof options.shouldWrite === 'function' ? options.shouldWrite : () => true;
  // Retry backoff for a persistently failing write (full disk, EACCES…):
  // retrying at the base delay forever turned a disk outage into an IO storm.
  const maxRetryDelayMs = Number.isFinite(options.maxRetryDelayMs) && options.maxRetryDelayMs >= delayMs
    ? Math.max(1, Number(options.maxRetryDelayMs))
    : Math.max(delayMs, 5000);
  let consecutiveFailures = 0;
  let waiters = [];
  let lastError = null;
  let skipped = 0;
  let pendingRequests = 0;
  let keepAliveTimer = null;
  const retryDelay = () => consecutiveFailures > 0
    ? Math.min(maxRetryDelayMs, Math.max(1, delayMs) * (2 ** Math.min(10, consecutiveFailures - 1)))
    : delayMs;

  function releaseRequest() {
    pendingRequests -= 1;
    if (pendingRequests === 0 && keepAliveTimer !== null) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }

  const queue = new DeferredQueue({
    delayMs,
    retryDelayMs: retryDelay,
    handler: async () => {
      const batch = waiters;
      waiters = [];
      lastError = null;
      try {
        // Nothing changed since the last successful write, so the disk already
        // holds this state. A predicate that throws cannot prove that, so the
        // write proceeds.
        let needWrite = true;
        try {
          needWrite = shouldWrite() !== false;
        } catch (_) {
          needWrite = true;
        }

        if (!needWrite) {
          consecutiveFailures = 0;
          skipped += 1;
          for (const waiter of batch) waiter.resolve();
          return;
        }

        try {
          await write();
        } catch (error) {
          lastError = error;
          if (typeof options.onError === 'function') {
            try { options.onError(error); } catch (_) { /* observer */ }
          }
          for (const waiter of batch) waiter.reject(error);
          consecutiveFailures += 1;
          throw error; // the queue keeps the item so a later request retries
        }

        consecutiveFailures = 0;
        for (const waiter of batch) waiter.resolve();
      } finally {
        // A request that arrived while this run was in flight needs another
        // run after the current write's completion barrier is released.
        // Failed runs back off exponentially (capped) so a persistent disk
        // error does not hammer the filesystem at the base delay forever.
        if (queue.size) {
          queue.start(retryDelay());
        }
      }
    },  });

  return {
    /** Ask for the current state to be persisted; resolves once it is on disk. */
    request() {
      const pending = new Promise((resolve, reject) => {
        waiters.push({ resolve, reject });
        // The writer persists the whole value; only one dirty marker is needed.
        if (!queue.size) queue.add(1);
        queue.start(retryDelay());
      });
      if (options.keepAlive) {
        pendingRequests += 1;
        if (keepAliveTimer === null) keepAliveTimer = setInterval(() => {}, 60_000);
        pending.then(releaseRequest, releaseRequest);
      }
      return pending;
    },
    /** Persist immediately, ignoring the quiet period. */
    flushNow() {
      // The failure belongs to this flush, not the mutable diagnostic field:
      // an overlapping retry may clear lastError before this caller resumes.
      return queue.flush({ throwOnError: true });
    },
    /** Wait until no write is in flight. */
    idle() {
      return queue.idle({ throwOnError: true });
    },
    stats() {
      return {
        ...queue.stats(),
        waiters: waiters.length,
        skipped,
        lastError: lastError ? String(lastError.message || lastError) : null,
      };
    },
  };
}

module.exports = { createCoalescedWriter, DEFAULT_DELAY_MS };

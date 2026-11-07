'use strict';

/**
 * Deferred batch queue.
 *
 * Collects low-priority work and runs it after a quiet period, so a burst of
 * arrivals is handled once instead of repeatedly. Typical use: unpacking
 * downloaded packages, which should never compete with startup.
 *
 * The queue is drain-only: a scheduled run takes everything pending, and items
 * added while it runs are picked up by the next one.
 */

const DEFAULT_DELAY_MS = 10_000;

class DeferredQueue {
  /**
   * @param {object} [options]
   * @param {number} [options.delayMs] Quiet period before a run.
   * @param {(items:Array<*>) => (void|Promise<void>)} [options.handler]
   * @param {(err:Error, items:Array<*>) => void} [options.onError]
   */
  constructor(options = {}) {
    this.delayMs = Number.isFinite(options.delayMs) && options.delayMs >= 0
      ? Number(options.delayMs)
      : DEFAULT_DELAY_MS;
    this.handler = typeof options.handler === 'function' ? options.handler : null;
    this.onError = typeof options.onError === 'function' ? options.onError : null;

    this.items = [];
    this.timer = null;
    this.running = false;
    this.runCount = 0;
    this.processedCount = 0;
  }

  get size() {
    return this.items.length;
  }

  get scheduled() {
    return this.timer !== null;
  }

  /** Append one item. */
  add(item) {
    this.items.push(item);
    return this;
  }

  /** Append several items. */
  addAll(items) {
    if (Array.isArray(items)) this.items.push(...items);
    return this;
  }

  /**
   * Arm the timer. Calling this again restarts the quiet period, so a steady
   * stream of arrivals does not trigger a run until it settles.
   *
   * @param {number} [delayMs] Override this run's delay.
   * @returns {boolean} whether a run was scheduled.
   */
  start(delayMs) {
    this.clearTimer();
    if (!this.items.length || typeof (this.handler || this.defaultHandler) !== 'function') return false;

    const delay = Number.isFinite(delayMs) && delayMs >= 0 ? Number(delayMs) : this.delayMs;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delay);
    // Do not hold the event loop open purely for deferred work.
    if (this.timer && typeof this.timer.unref === 'function') this.timer.unref();
    return true;
  }

  /** Cancel the pending run, keeping the queue contents. */
  pause() {
    const hadTimer = this.timer !== null;
    this.clearTimer();
    return hadTimer;
  }

  /** Cancel the pending run and discard everything queued. */
  cancel() {
    this.clearTimer();
    const dropped = this.items.length;
    this.items = [];
    return dropped;
  }

  clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Default behaviour when no handler was supplied: report and drop items. */
  defaultHandler() {
    return undefined;
  }

  /**
   * Run the handler against everything currently queued.
   * Safe to call directly; also used by the timer.
   *
   * @returns {Promise<number>} how many items were processed.
   */
  async flush() {
    // A flush that overlaps a running one must wait for it to finish and then
    // run once more: returning 0 here used to make exit-path flushNow() a
    // no-op exactly when a write was in flight, silently dropping state.
    while (this.running) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    const batch = this.items;
    if (!batch.length) return 0;

    const handler = this.handler || this.defaultHandler;
    this.items = [];
    this.running = true;
    this.runCount += 1;

    try {
      await handler(batch);
      this.processedCount += batch.length;
      return batch.length;
    } catch (err) {
      // Requeue so a transient failure does not silently drop work, and re-arm
      // the timer: without a new start() the requeued batch stayed parked
      // forever when the failure came from the timer's own flush().
      this.items = batch.concat(this.items);
      this.start(this.delayMs);
      if (this.onError) {
        try { this.onError(err, batch); } catch (_) { /* observer */ }
      }
      return 0;
    } finally {
      this.running = false;
    }
  }

  /** Wait until no run is in flight and nothing is left queued. */
  async idle() {
    let stalls = 0;
    while (this.running || this.items.length) {
      if (this.running) {
        stalls = 0;
        await new Promise((resolve) => setTimeout(resolve, 5));
      } else {
        const processed = await this.flush();
        if (processed === 0 && this.items.length) {
          // A persistently failing handler must not turn idle() into an
          // infinite retry loop on the quit path.
          stalls += 1;
          if (stalls >= 3) break;
        } else {
          stalls = 0;
        }
      }
    }
  }

  stats() {
    return {
      pending: this.items.length,
      scheduled: this.scheduled,
      running: this.running,
      runs: this.runCount,
      processed: this.processedCount,
      delayMs: this.delayMs,
    };
  }
}

module.exports = {
  DeferredQueue,
  DEFAULT_DELAY_MS,
};

'use strict';

/**
 * Bounded-concurrency task scheduler.
 *
 * Runs async jobs with a cap on simultaneous execution. With a concurrency of
 * one the scheduler behaves as a serial queue, optionally leaving a gap
 * between jobs so a burst of work does not hammer a downstream service.
 *
 * Two properties matter for correctness here:
 *
 *   1. A rejected job must release its slot. Otherwise one failure stops the
 *      queue from ever draining.
 *   2. Timeout/cancellation rejects the caller and aborts cooperative work.
 *      The slot remains occupied until that work actually settles.
 *
 * Schedulers are named so callers can share one instance per concern.
 */

const DEFAULT_CONCURRENCY = 1;
const DEFAULT_MAX_PENDING = 10000;

/** FIFO with O(1) removal, including cancellation from the middle. */
class JobQueue {
  constructor() { this.nodes = new Map(); this.head = null; this.tail = null; }
  get size() { return this.nodes.size; }
  first() { return this.head?.job; }
  add(job) {
    if (this.nodes.has(job)) return;
    const node = { job, previous: this.tail, next: null };
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this.nodes.set(job, node);
  }
  delete(job) {
    const node = this.nodes.get(job);
    if (!node) return false;
    if (node.previous) node.previous.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.previous = node.previous;
    else this.tail = node.previous;
    return this.nodes.delete(job);
  }
  clear() { this.nodes.clear(); this.head = null; this.tail = null; }
}

/** Reject after `ms`, and clear the timer whichever way the race resolves. */
function withTimeout(promise, ms) {
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  let timer = null;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(Object.assign(new Error(`task timed out after ${ms}ms`), { code: 'ETIMEDOUT' }));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class TaskScheduler {
  /**
   * @param {object} [options]
   * @param {string} [options.name] Label used in diagnostics.
   * @param {number} [options.concurrency] Maximum simultaneous jobs.
   * @param {number} [options.serialInterval] Delay between jobs when serial.
   * @param {number} [options.defaultTimeout] Timeout applied when a job omits one.
   * @param {(ms:number)=>Promise<void>} [options.sleep] Pause implementation, so the
   *   spacing policy can be observed without waiting on the wall clock.
   */
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.concurrency = normalizeConcurrency(options.concurrency);
    this.serialInterval = Number.isFinite(options.serialInterval) && options.serialInterval > 0
      ? Number(options.serialInterval)
      : 0;
    this.defaultTimeout = Number.isFinite(options.defaultTimeout) && options.defaultTimeout > 0
      ? Number(options.defaultTimeout)
      : 0;
    this.sleep = typeof options.sleep === 'function' ? options.sleep : sleep;
    this.maxPending = Number.isSafeInteger(options.maxPending) && options.maxPending >= 0
      ? options.maxPending : DEFAULT_MAX_PENDING;

    // The queues preserve admission order and allow constant-time cancellation.
    // Only the head of each key's queue is eligible, so blocked keys never
    // consume a global slot or require rescanning a long queue.
    this.pending = new Set();
    this.ready = new JobQueue();
    this.keys = new Map();
    this.running = 0;
    this.destroyed = false;
    this.completedCount = 0;
    this.failedCount = 0;
    this.timedOutCount = 0;
    this.onError = typeof options.onError === 'function' ? options.onError : null;
    this.idlePromise = null;
    this.resolveIdle = null;
  }

  get size() {
    return this.pending.size;
  }

  get busy() {
    return this.running > 0 || this.size > 0;
  }

  stats() {
    return {
      name: this.name,
      concurrency: this.concurrency,
      running: this.running,
      pending: this.size,
      maxPending: this.maxPending,
      completed: this.completedCount,
      failed: this.failedCount,
      timedOut: this.timedOutCount,
      destroyed: this.destroyed,
    };
  }

  /**
   * Queue a job.
   *
   * @param {(payload:*, context:{signal:AbortSignal}) => Promise<*>} handle
   * @param {*} [payload]
   * @param {{stepName?:string, timeout?:number, key?:string, signal?:AbortSignal}} [options]
   * @returns {Promise<*>} Resolves or rejects with the job outcome.
   */
  schedule(handle, payload, options = {}) {
    if (typeof handle !== 'function') {
      return Promise.reject(new TypeError('task handler must be a function'));
    }
    if (this.destroyed) {
      return Promise.reject(new Error(`scheduler "${this.name}" has been destroyed`));
    }
    if (options.signal != null && (typeof options.signal.addEventListener !== 'function'
      || typeof options.signal.removeEventListener !== 'function')) {
      return Promise.reject(new TypeError('signal must be an AbortSignal'));
    }
    if (options.signal?.aborted) return Promise.reject(options.signal.reason || new Error('task cancelled'));
    if (options.key != null && typeof options.key !== 'string') {
      return Promise.reject(new TypeError('task key must be a string'));
    }
    const key = options.key ?? null;
    const group = key === null ? null : this.keys.get(key);
    const canStart = this.running < this.concurrency && (!group || (!group.running && !group.pending.size));
    if (!canStart && this.size >= this.maxPending) {
      return Promise.reject(Object.assign(new Error(`scheduler "${this.name}" queue is full`), { code: 'QUEUE_FULL' }));
    }

    return new Promise((resolve, reject) => {
      const job = {
        handle,
        payload,
        stepName: options.stepName || '',
        timeout: Number.isFinite(options.timeout) && options.timeout > 0
          ? Number(options.timeout)
          : this.defaultTimeout,
        resolve,
        reject,
        signal: options.signal,
        key,
        group: null,
      };
      job.onQueuedAbort = () => {
        if (!this.pending.delete(job)) return;
        this.ready.delete(job);
        if (job.group) {
          job.group.pending.delete(job);
          this.releaseKey(job);
        }
        job.signal.removeEventListener('abort', job.onQueuedAbort);
        reject(job.signal.reason || new Error('task cancelled'));
        this.pump();
        this.notifyIdle();
      };
      job.signal?.addEventListener('abort', job.onQueuedAbort, { once: true });
      this.pending.add(job);
      if (key !== null) {
        job.group = group || { running: false, pending: new JobQueue() };
        this.keys.set(key, job.group);
        job.group.pending.add(job);
        if (!job.group.running && job.group.pending.size === 1) this.ready.add(job);
      } else this.ready.add(job);
      this.pump();
    });
  }

  /** Start as many queued jobs as the concurrency limit allows. */
  pump() {
    while (!this.destroyed && this.running < this.concurrency && this.ready.size > 0) {
      const job = this.ready.first();
      this.ready.delete(job);
      this.pending.delete(job);
      job.signal?.removeEventListener('abort', job.onQueuedAbort);
      if (job.group) {
        job.group.pending.delete(job);
        job.group.running = true;
      }
      this.running += 1;
      // Release capacity only after the underlying work has settled.
      this.runJob(job).finally(() => {
        this.running -= 1;
        if (job.group) {
          job.group.running = false;
          this.releaseKey(job);
        }
        if (!this.destroyed) this.pump();
        this.notifyIdle();
      });
    }
  }

  releaseKey(job) {
    const group = job.group;
    if (group.running) return;
    const next = group.pending.first();
    // A released key joins the end of the ready queue, giving other keys a
    // turn while retaining FIFO ordering within each key.
    if (next && !this.destroyed) this.ready.add(next);
    else if (!next) this.keys.delete(job.key);
  }

  async runJob(job) {
    const controller = new AbortController();
    let timer;
    let wasInterrupted = false;
    let interrupt;
    const interrupted = new Promise((_resolve, reject) => { interrupt = reject; });
    const abort = (error) => { wasInterrupted = true; controller.abort(error); interrupt(error); };
    const onAbort = () => abort(job.signal.reason || Object.assign(new Error('task cancelled'), { code: 'ABORT_ERR' }));
    job.signal?.addEventListener('abort', onAbort, { once: true });
    if (job.signal?.aborted) onAbort();
    const work = Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return job.handle(job.payload, { signal: controller.signal });
    });
    if (job.timeout > 0) timer = setTimeout(() => abort(Object.assign(
      new Error(`task timed out after ${job.timeout}ms`), { code: 'ETIMEDOUT' }
    )), job.timeout);
    try {
      const result = await Promise.race([work, interrupted]);
      this.completedCount += 1;
      job.resolve(result);
    } catch (err) {
      if (err && err.code === 'ETIMEDOUT') this.timedOutCount += 1;
      else this.failedCount += 1;
      this.reportError(err, job);
      job.reject(err);
    } finally {
      clearTimeout(timer);
      job.signal?.removeEventListener('abort', onAbort);
      // A handler may ignore AbortSignal. Do not admit replacement work while
      // its sockets/CPU are still active, even though its caller has timed out.
      if (wasInterrupted) await work.catch(() => {});
      if (this.concurrency === 1 && this.serialInterval > 0 && !this.destroyed) {
        try { await this.sleep(this.serialInterval); }
        catch (error) { this.reportError(error, job); }
      }
    }
  }

  reportError(error, job) {
    if (this.onError) {
      try { this.onError(error, { name: this.name, stepName: job.stepName }); } catch (_) { /* observer */ }
    }
  }

  /** Resolve once nothing is running or queued. */
  drain() {
    if (!this.busy) return Promise.resolve();
    if (!this.idlePromise) {
      this.idlePromise = new Promise((resolve) => { this.resolveIdle = resolve; });
    }
    return this.idlePromise;
  }

  notifyIdle() {
    if (this.busy || !this.resolveIdle) return;
    const resolve = this.resolveIdle;
    this.resolveIdle = null;
    this.idlePromise = null;
    resolve();
  }

  /**
   * Reject everything still queued and stop accepting work.
   * Jobs already running are left to finish on their own.
   * @returns {number} how many queued jobs were rejected
   */
  destroy(reason) {
    this.destroyed = true;
    const dropped = this.size;
    const error = reason instanceof Error ? reason : new Error(`scheduler "${this.name}" was destroyed`);
    for (const job of this.pending) {
      job.signal?.removeEventListener('abort', job.onQueuedAbort);
      job.reject(error);
    }
    this.pending.clear();
    this.ready.clear();
    for (const [key, group] of this.keys) {
      group.pending.clear();
      if (!group.running) this.keys.delete(key);
    }
    this.notifyIdle();
    return dropped;
  }

  /** Adjust the concurrency limit and start any jobs that now fit. */
  setConcurrency(next) {
    this.concurrency = normalizeConcurrency(next);
    this.pump();
    return this.concurrency;
  }
}

function normalizeConcurrency(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_CONCURRENCY;
  return n;
}

/** Registry of named schedulers, so callers share one queue per concern. */
class SchedulerRegistry {
  constructor() {
    this.schedulers = new Map();
  }

  /**
   * Get or create a scheduler.
   * @param {string} name
   * @param {object} [options]
   */
  get(name, options = {}) {
    const key = String(name || 'default');
    let scheduler = this.schedulers.get(key);
    if (!scheduler || scheduler.destroyed) {
      scheduler = new TaskScheduler(Object.assign({ name: key }, options));
      this.schedulers.set(key, scheduler);
    }
    return scheduler;
  }

  /** Queue a job on a named scheduler. */
  run(name, handle, payload, options) {
    return this.get(name, options).schedule(handle, payload, options);
  }

  /** Destroy one scheduler and drop it from the registry. */
  destroy(name, reason) {
    const key = String(name || 'default');
    const scheduler = this.schedulers.get(key);
    if (!scheduler) return 0;
    const dropped = scheduler.destroy(reason);
    this.schedulers.delete(key);
    return dropped;
  }

  destroyAll(reason) {
    let dropped = 0;
    for (const scheduler of this.schedulers.values()) dropped += scheduler.destroy(reason);
    this.schedulers.clear();
    return dropped;
  }

  names() {
    return [...this.schedulers.keys()];
  }
}

module.exports = {
  TaskScheduler,
  SchedulerRegistry,
  withTimeout,
  normalizeConcurrency,
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_PENDING,
};

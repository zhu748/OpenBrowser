'use strict';

const path = require('node:path');
const { Worker } = require('node:worker_threads');
const MAX_PATTERN_CHARS = 8192;
const MAX_TEXT_CHARS = 1024 * 1024;

/** User expressions execute outside the host event loop and can be terminated. */
function runRegex(pattern, flags, text, { signal, timeoutMs = 1000 } = {}) {
  if (pattern.length > MAX_PATTERN_CHARS || text.length > MAX_TEXT_CHARS) {
    return Promise.reject(Object.assign(new Error('Regular expression input exceeds the size limit'), { code: 'RPA_REGEX_LIMIT' }));
  }
  if (signal?.aborted) return Promise.reject(signal.reason || new Error('cancelled'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'regex-worker.js'), {
      workerData: { pattern, flags, text }, resourceLimits: { maxOldGenerationSizeMb: 32 },
    });
    let settled = false;
    let timer;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      // Do not release the caller's execution slot before the worker exits.
      worker.terminate().then(() => error ? reject(error) : resolve(value), reject);
    };
    const abort = () => finish(signal.reason || Object.assign(new Error('cancelled'), { code: 'ABORT_ERR' }));
    worker.once('message', (message) => finish(message.error ? new Error(message.error) : null, message.match));
    worker.once('error', (error) => finish(error));
    worker.once('exit', (code) => { if (!settled) finish(new Error(`Regular expression worker exited (${code})`)); });
    timer = setTimeout(() => finish(Object.assign(new Error('Regular expression execution timed out'), { code: 'RPA_REGEX_TIMEOUT' })),
      Math.max(1, Math.min(1000, Number(timeoutMs) || 1000)));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

module.exports = { runRegex, MAX_PATTERN_CHARS, MAX_TEXT_CHARS };

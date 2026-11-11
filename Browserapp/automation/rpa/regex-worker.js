'use strict';

const { parentPort, workerData } = require('node:worker_threads');
try {
  const match = new RegExp(workerData.pattern, workerData.flags).exec(workerData.text);
  parentPort.postMessage({ match: match ? Array.from(match) : null });
} catch (error) {
  parentPort.postMessage({ error: error.message });
}

'use strict';

const { monitorEventLoopDelay } = require('node:perf_hooks');

class LoopMonitor {
  constructor({ histogram = monitorEventLoopDelay({ resolution: 1 }) } = {}) {
    this.monitor = histogram;
  }
  start() { this.monitor.reset(); this.monitor.enable(); return this; }
  stop() {
    this.monitor.disable();
    const count = Number(this.monitor.count);
    return {
      p50Ms: count ? this.monitor.percentile(50) / 1e6 : 0,
      p95Ms: count ? this.monitor.percentile(95) / 1e6 : 0,
      p99Ms: count ? this.monitor.percentile(99) / 1e6 : 0,
      maxMs: count ? this.monitor.max / 1e6 : 0,
      rawCount: count,
    };
  }
}

module.exports = { LoopMonitor };

'use strict';

// Cancel a setup operation as soon as its session loses ownership. Commands
// already sent cannot be recalled, but their late results cannot continue setup.
class FingerprintSession {
  constructor({ sessionId, targetId, item, connection }) {
    Object.assign(this, { sessionId, targetId, item, connection });
    this.ready = false;
    this.reason = null;
    this.cancelled = new Promise((_resolve, reject) => { this.rejectCancellation = reject; });
    this.cancelled.catch(() => {});
  }

  cancel(reason, message = 'Fingerprint target session ' + reason) {
    if (this.reason) return;
    this.reason = reason;
    this.error = Object.assign(new Error(message), { code: 'FINGERPRINT_SESSION_CANCELLED', reason });
    this.rejectCancellation(this.error);
  }

  assertActive() {
    if (!this.reason && (this.item.stopping || this.item.cleanedUp || this.connection.closed)) this.cancel('closed');
    if (this.reason) throw this.error;
  }

  async run(operation) {
    this.assertActive();
    const pending = Promise.resolve().then(() => { this.assertActive();return operation(); });
    const result = await Promise.race([pending, this.cancelled]);
    this.assertActive();
    return result;
  }

  command(method, params = {}, options = {}) {
    return this.run(() => this.connection.command(method, params, { ...options, sessionId: this.sessionId }));
  }
}

module.exports = { FingerprintSession };

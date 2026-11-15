'use strict';

/** Preserve shutdown ordering, but one failure must not skip closing the API
 * or flushing unrelated stores. Concurrent callers share the same attempt. */
function createAutomationStop({ rpaEngine, localApi, proxyStore, accountStore, transferStore, rpaStore }) {
  let pending;
  const steps = [
    ['rpa', () => rpaEngine.stop()],
    ['local-api', () => localApi.stop()],
    ['proxy-store', () => proxyStore.flush?.()],
    ['account-store', () => accountStore.flush()],
    ['transfer-store', () => transferStore.flush()],
    ['rpa-store', () => rpaStore.flush?.()],
  ];
  const drain = async () => {
    const errors = [];
    for (const [service, stop] of steps) {
      try { await stop(); }
      catch (cause) {
        errors.push(Object.assign(new Error(`${service}: ${cause?.message || String(cause)}`, { cause }), { service }));
      }
    }
    if (errors.length) throw new AggregateError(errors,
      'Automation shutdown failed: ' + errors.map(error => error.message).join('; '));
  };
  return () => {
    pending ||= Promise.resolve().then(drain).finally(() => { pending = null; });
    return pending;
  };
}

module.exports = { createAutomationStop };

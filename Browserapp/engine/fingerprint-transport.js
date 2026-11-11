'use strict';

const cdp = require('../cdp');
const { forgetFingerprintOwner } = require('../automation/fingerprint');
const { forgetTargetRuntimePolicy } = require('./runtime-policy');

function pageFingerprintRegistration(item, tab) {
  const entries = item.fingerprintPageConnections ||= new Map();
  let entry = entries.get(tab.id);
  if (!entry) { entry = { closed: false, connection: null, opening: null };entries.set(tab.id, entry); }
  return entry;
}

function closePageFingerprintConnection(item, targetId) {
  const entries = item?.fingerprintPageConnections;
  const entry = entries?.get(targetId);
  if (!entry) return;
  entries.delete(targetId);
  entry.closed = true;
  forgetTargetRuntimePolicy(item, targetId, entry);
  if (entry.connection) {
    forgetFingerprintOwner(entry.connection);
    entry.connection.close();
  }
}

function closePageFingerprintConnections(item, liveIds = new Set()) {
  for (const id of item?.fingerprintPageConnections?.keys() || []) {
    if (!liveIds.has(id)) closePageFingerprintConnection(item, id);
  }
}

async function pageFingerprintConnection(engine, item, tab) {
  if (item.stopping || item.cleanedUp) throw new Error('Browser is stopping');
  const entries = item.fingerprintPageConnections ||= new Map();
  const entry = pageFingerprintRegistration(item, tab);
  if (!entry.opening) {
    entry.opening = cdp.connect(tab.webSocketDebuggerUrl, {
      async onDisconnect(error, connection) {
        forgetFingerprintOwner(connection);
        forgetTargetRuntimePolicy(item, tab.id, entry);
        if (entries.get(tab.id) === entry) entries.delete(tab.id);
        item.fpAppliedTargets?.delete(tab.id);
        if (entry.closed || item.stopping || item.cleanedUp) return;
        let timer;
        try {
          const tabs = await Promise.race([
            cdp.tabs(item.port).catch(() => null),
            new Promise((resolve) => { timer = setTimeout(() => resolve(null), 1500); }),
          ]);
          // Closing a tab normally also closes its page socket. A fresh target
          // snapshot distinguishes it from losing injection on a live page.
          if (tabs && !tabs.some((current) => current.id === tab.id)) return;
        } finally { clearTimeout(timer); }
        if (entry.closed || item.stopping || item.cleanedUp) return;
        // Losing the owner also loses future-document injection. Stop the
        // browser rather than leave a navigation window before the next sweep.
        Promise.resolve(engine.handleBrowserGone?.(item.profile?.id, item, 'fingerprint-page-disconnect', {
          expected: false, error: error?.message || String(error), kill: true, waitForExit: true,
        })).catch((cleanupError) => engine.emit?.({ type: 'sync-error', message: cleanupError.message }));
      },
    }).then((connection) => {
      entry.connection = connection;
      if (entry.closed || item.stopping || item.cleanedUp) {
        connection.close();
        throw new Error('Browser stopped while opening fingerprint connection');
      }
      return connection;
    }).catch((error) => {
      forgetTargetRuntimePolicy(item, tab.id, entry);
      if (entries.get(tab.id) === entry) entries.delete(tab.id);
      throw error;
    });
  }
  return entry.opening;
}

module.exports = { pageFingerprintConnection, pageFingerprintRegistration, closePageFingerprintConnection, closePageFingerprintConnections };

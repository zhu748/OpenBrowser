'use strict';

/** Proxy library IPC domain: CRUD, bounded batch checks, and the two
 *  profile-proxy actions the editor calls. Registered through the host sender
 *  guard; extracted from main.js' whenReady block. */

function registerProxyIpc({ registerTrustedIpc, getEngine, getProxyStore, sanitizeIds }) {
  const proxyStore = getProxyStore;
  registerTrustedIpc('proxy:list', (_event, filter) => proxyStore().list(filter || {}));
  registerTrustedIpc('proxy:get', (_event, id) => proxyStore().get(String(id || '')));
  registerTrustedIpc('proxy:create', (_event, payload) => proxyStore().create(payload || {}));
  registerTrustedIpc('proxy:update', (_event, payload) => {
    const id = String(payload?.id || payload?.proxy_id || '');
    if (!id) throw new Error('id required');
    return proxyStore().update(id, payload || {});
  });
  registerTrustedIpc('proxy:delete', (_event, ids) => proxyStore().remove(sanitizeIds(Array.isArray(ids) ? ids : [ids])));
  registerTrustedIpc('proxy:check', async (_event, payload) => {
    const engine = getEngine();
    const store = proxyStore();
    const id = String(payload?.id || payload?.proxy_id || '');
    const item = id ? store.get(id) : null;
    const raw = item?.raw || payload?.proxy || payload?.raw;
    if (!raw) throw new Error('proxy required');
    const probe = () => engine.testProxy({
      id: 'proxy-check',
      name: 'proxy-check',
      proxy: raw,
      proxyMeta: {
        ipChannel: item?.ipChannel || payload?.ipChannel || 'ip-api',
        apiExtractUrl: item?.refreshUrl || payload?.apiExtractUrl || '',
        refreshUrl: item?.refreshUrl || payload?.refreshUrl || '',
      },
    });
    if (!item) return { ...await probe(), proxy: null };
    const { record, result } = await store.checkAndRecord(item, probe);
    return { ...result, proxy: record };
  });
  registerTrustedIpc('proxy:check-many', async (_event, payload) => {
    const engine = getEngine();
    const store = proxyStore();
    // Dedup first: duplicate ids used to run checkAndRecord twice per id —
    // two upstream probes and a same-record write race, for zero benefit.
    const ids = [...new Set(Array.isArray(payload?.ids) ? payload.ids.map(String) : [])];
    if (!ids.length) throw new Error('ids required');
    if (ids.length > 100) throw new Error('ids cannot exceed 100 per check; split the selection into batches');
    // Serial execution made "check all" run minutes inside one invoke (100 ×
    // 6.5s budget worst case). engine.testProxy already dedups identical
    // in-flight probes, so a bounded pool is safe; same shape as
    // the extension domain restart helper.
    const queue = ids.slice(0, 100);
    const results = [];
    const resultsById = new Map();
    await Promise.all(Array.from({ length: Math.min(8, queue.length) }, async () => {
      while (queue.length) {
        const id = queue.shift();
        const item = store.get(id);
        if (!item) {
          resultsById.set(id, { id, ok: false, error: 'not found' });
          continue;
        }
        try {
          const { result, record } = await store.checkAndRecord(item, () => engine.testProxy({
            id: 'proxy-check',
            name: item.name || 'proxy-check',
            proxy: item.raw,
            proxyMeta: { ipChannel: item.ipChannel || 'ip-api', refreshUrl: item.refreshUrl || '', apiExtractUrl: item.refreshUrl || '' },
          }));
          resultsById.set(id, { id, ok: true, ...result, proxy: record });
        } catch (error) {
          resultsById.set(id, {
            id,
            ok: false,
            error: error.message || String(error),
            errorClass: error.errorClass || error.code || 'unknown',
            latencyMs: error.latencyMs || null,
            proxy: store.get(item.id),
          });
        }
      }
    }));
    // Preserve the caller's id order; the pool completes them out of order.
    for (const id of ids.slice(0, 100)) {
      const entry = resultsById.get(id);
      if (entry) results.push(entry);
    }
    return { results, ok: results.filter((r) => r.ok).length, fail: results.filter((r) => !r.ok).length };
  });
  registerTrustedIpc('profiles:refresh-proxy', (_event, profile) => getEngine().refreshProfileProxy(profile));
  registerTrustedIpc('profiles:apply-proxy-fingerprint', async (_event, profile) => {
    const engine = getEngine();
    const network = await engine.checkProxy(profile, { persist: true });
    return network;
  });
}

module.exports = { registerProxyIpc };

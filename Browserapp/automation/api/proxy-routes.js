'use strict';

const { firstDefined, firstArray, firstString, normalizeProxyInput } = require('./input');
const { ok, fail, redactProxyRecord } = require('./responses');

/** HTTP-independent handlers with explicit domain dependencies. */
class ProxyRoutes {
  constructor({ proxyStore, engine } = {}) {
    this.proxyStore = proxyStore;
    this.engine = engine;
  }

  async routeProxyList({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    const list = this.proxyStore.list(input).map(redactProxyRecord);
    return ok({ list, page: 1, page_size: list.length });
  }

  async routeProxyCreate({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    if (Array.isArray(input) || Array.isArray(input.data)) {
      const body = Array.isArray(input) ? input : input.data;
      return ok({ list: await this.proxyStore.createMany(body.map(normalizeProxyInput)) });
    }
    return ok(await this.proxyStore.create(normalizeProxyInput(input)));
  }

  async routeProxyUpdate({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    const id = String(input.proxy_id || input.proxy_library_id || input.proxyId || input.proxyLibraryId || input.id || '');
    if (!id) return fail('id required', 400);
    return ok(await this.proxyStore.update(id, normalizeProxyInput(input)));
  }

  async routeProxyDelete({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    const ids = firstArray(input, ['proxy_ids', 'proxyIds', 'proxy_library_ids', 'proxyLibraryIds', 'proxy_id', 'proxyId', 'ids'])
      || [firstDefined(input, ['id', 'proxy_id', 'proxyId', 'proxy_library_id', 'proxyLibraryId'])];
    return ok(await this.proxyStore.remove(ids.filter(Boolean)));
  }

  async routeProxyCheck({ input }) {
    if (!this.proxyStore || !this.engine) return fail('proxy check unavailable', 503);
    const id = String(input.proxy_id || input.proxy_library_id || input.proxyId || input.proxyLibraryId || input.id || '');
    const item = id ? this.proxyStore.get(id) : null;
    const raw = item?.raw || input.proxy || input.raw;
    if (!raw) return fail('proxy required', 400);
    const ipChannel = firstString(input, ['ip_channel', 'ipChannel'], 'ip-api');
    try {
      const result = await this.engine.testProxy({ id: 'proxy-check', name: 'proxy-check', proxy: raw, proxyMeta: { ipChannel: item?.ipChannel || ipChannel } });
      if (item) await this.proxyStore.markCheck(item.id, result);
      return ok(result);
    } catch (err) {
      return fail('proxy check failed: ' + (err?.message || err), 400);
    }
  }

  async routeProxyCheckProfile({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const profile = this.engine.profiles.get(id);
    if (!profile) return fail('profile not found', 404);
    try {
      const result = await this.engine.checkProxy(profile, { allowExtract: false, persist: true });
      return ok(result);
    } catch (err) {
      return fail('check-profile failed: ' + (err?.message || err), 400);
    }
  }
}

module.exports = { ProxyRoutes };

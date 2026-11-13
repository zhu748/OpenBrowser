'use strict';

const crypto = require('node:crypto');
const { navigateFirefox, screenshotFirefox } = require('../browser-control');
const { CURRENT_FINGERPRINT_VERSION } = require('../fingerprint/generation');
const { resolveWebSocketDebuggerUrl } = require('./devtools');
const { booleanValue, firstDefined, firstArray, firstString, normalizeProfileInput, readProxyAssociation } = require('./input');
const { ok, fail, redactProfileForApi, proxySummary } = require('./responses');

/** HTTP-independent handlers with explicit domain dependencies. */
class ProfileRoutes {
  constructor({ engine, resolveProfileEndpoint, proxyStore } = {}) {
    this.engine = engine;
    this.resolveProfileEndpoint = resolveProfileEndpoint;
    this.proxyStore = proxyStore;
  }

  async routeProfileList({ input = {} } = {}) {
    const all = this.engine.status();
    const page = Number(input.page ?? 1);
    const size = Number(input.page_size ?? input.pageSize ?? all.length);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(size) || size < ((all.length || input.page_size !== undefined || input.pageSize !== undefined) ? 1 : 0)
      || size > 1000 && (input.page_size !== undefined || input.pageSize !== undefined)) return fail('invalid pagination (page_size: 1-1000)', 400);
    const withEndpoints = booleanValue(input.include_debug_endpoints ?? input.includeDebugEndpoints, true);
    const selected = all.slice((page - 1) * size, page * size);
    const list = await Promise.all(selected.map(async (item) => ({
      id: item.id,
      user_id: item.id,
      profile_id: item.id,
      name: item.name,
      title: item.title || item.name,
      number: item.number,
      status: item.running ? 'Active' : 'Inactive',
      ws: withEndpoints && item.port ? { puppeteer: await this.resolveProfileEndpoint(item), selenium: `127.0.0.1:${item.port}` } : null,
      debug_port: item.port || null,
      ...proxySummary(item, this.proxyStore),
    })));
    return ok({ list, page, page_size: size, total: all.length });
  }

  async routeProfileCreate({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    let body = normalizeProfileInput(input && typeof input.profile === 'object' ? { ...input, ...input.profile } : input);
    const association = this.resolveProxyAssociation(input, body);
    const hasManualProxyConfiguration = !association.present && [
      'proxy', 'user_proxy_config', 'network_mode', 'networkMode',
    ].some((key) => Object.prototype.hasOwnProperty.call(body || {}, key));
    if (association.present) body = { ...body, ...association.patch };
    const existingIds = new Set(this.engine.profiles ? [...this.engine.profiles.keys()] : []);
    let id = firstString(body, ['user_id', 'userId', 'profile_id', 'profileId', 'id']).trim();
    if (!id) {
      do { id = 'ob-' + Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex'); } while (existingIds.has(id));
    }
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return fail('invalid profile id', 400);
    if (existingIds.has(id)) return fail('profile already exists', 409);
    const numbers = this.engine.profiles ? [...this.engine.profiles.values()].map((item) => Number(item.number)).filter((n) => Number.isInteger(n) && n > 0) : [];
    const number = Number.isInteger(Number(body.number)) && Number(body.number) > 0 ? Number(body.number) : ((numbers.reduce((maximum, value) => Math.max(maximum, value), 0) || 0) + 1);
    const rawProxy = String(body.proxy || '').trim();
    const userProxy = body.user_proxy_config && typeof body.user_proxy_config === 'object' ? body.user_proxy_config : {};
    const proxyType = String(userProxy.proxy_type || 'http').toLowerCase();
    const proxyHost = String(userProxy.proxy_host || '').trim();
    const proxyPort = String(userProxy.proxy_port || '').trim();
    const proxyUser = String(userProxy.proxy_user || '');
    const proxyPassword = String(userProxy.proxy_password || '');
    const proxy = rawProxy || (proxyHost && proxyPort ? (proxyType === 'socks' ? 'socks5' : proxyType) + '://' + (proxyUser ? encodeURIComponent(proxyUser) + ':' + encodeURIComponent(proxyPassword) + '@' : '') + proxyHost + ':' + proxyPort : 'Direct');
    const profile = {
      ...body,
      id, number,
      fingerprintVersion: body.fingerprintVersion ?? CURRENT_FINGERPRINT_VERSION,
      name: String(body.name || body.title || ('Environment ' + number)),
      title: String(body.title || body.name || ('Environment ' + number)),
      language: String(body.language || 'en-US'),
      networkMode: body.networkMode || (/^(direct|offline|none)$/i.test(proxy) ? 'direct' : 'proxy'),
      proxy,
      privacy: {
        ...(body.privacy && typeof body.privacy === 'object' ? body.privacy : {}),
      },
    };
    // The engine's sanitizer may still reject structurally odd profiles (e.g. a
    // non-string name slipped past String() coercion). Surface that as a 400
    // request error rather than an internal 500 from syncProfiles' throw.
    let created;
    try {
      created = this.engine.sanitizeProfile(profile);
      created = this.normalizeProxyAssociationState(created, association.present
        ? association
        : (hasManualProxyConfiguration ? { present: true, value: '' } : association));
      // existingIds was snapshotted before the awaits above, so two concurrent
      // creates carrying the same client id could both pass the 409 check and
      // the later syncProfiles write would win silently. Re-check membership
      // synchronously here (single-threaded between the check and the write).
      if (this.engine.profiles?.has(id)) return fail('profile already exists', 409);
      await this.engine.syncProfiles([created]);
    } catch (error) {
      return fail(`invalid profile: ${error.message}`, 400);
    }
    created = this.engine.profiles.get(id) || created;
    return ok({ user_id: id, profile_id: id, id, ...proxySummary(created, this.proxyStore), profile: redactProfileForApi(created) });
  }

  async routeProfileUpdate({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const current = this.engine.profiles.get(id);
    if (!current) return fail('profile not found', 404);
    const clearFingerprint = Boolean(input.__clearFingerprint) || input.fingerprint === null || input.privacy?.fingerprint === null;
    let body = normalizeProfileInput(input);
    const association = this.resolveProxyAssociation(input, current);
    const hasManualProxyPatch = !association.present && (
      Object.prototype.hasOwnProperty.call(input || {}, 'proxy')
      || Object.prototype.hasOwnProperty.call(input || {}, 'user_proxy_config')
      || Object.prototype.hasOwnProperty.call(input || {}, 'userProxyConfig')
      || Object.prototype.hasOwnProperty.call(input || {}, 'network_mode')
      || Object.prototype.hasOwnProperty.call(input || {}, 'networkMode')
    );
    if (association.present) body = { ...body, ...association.patch };
    else if (hasManualProxyPatch) {
      const rawProxy = String(input?.proxy || '').trim();
      const directRequested = String(input?.network_mode ?? input?.networkMode ?? '').toLowerCase() === 'direct'
        || /^(direct|offline|none)$/i.test(rawProxy);
      body = {
        ...body,
        ...(directRequested && !rawProxy ? { proxy: 'Direct' } : {}),
        networkMode: directRequested ? 'direct' : 'proxy',
        proxyId: null,
        proxyMeta: this.proxyMetaWithAssociation(current.proxyMeta, null),
      };
    }
    const allowed = new Set([
      'name', 'title', 'number', 'language', 'proxy', 'networkMode', 'startUrl', 'os', 'platform',
      'browser', 'userAgent', 'resolution', 'windowSize', 'timezone', 'locale', 'languageCode',
      'geolocation', 'webglVendor', 'webglRenderer', 'hardwareConcurrency', 'deviceMemory', 'doNotTrack',
      'privacy', 'fingerprint', 'user_proxy_config', 'note', 'width', 'height', 'advanced',
      'proxyMeta', 'tag', 'groupId', 'group_name',
      'proxyId',
    ]);
    const patch = {};
    for (const [key, value] of Object.entries(body)) {
      if (!allowed.has(key)) continue;
      if (key === 'startUrl' && value !== undefined) patch.startUrl = value;
      else if (key === 'userAgent' && value !== undefined) patch.userAgent = value;
      else if (key === 'windowSize' && value !== undefined) patch.windowSize = value;
      else if (key === 'networkMode' && value !== undefined) patch.networkMode = value;
      else if (key === 'languageCode' && value !== undefined) patch.languageCode = value;
      else if (key === 'privacy' && value !== undefined) {
        const next = { ...(current.privacy || {}), ...(value && typeof value === 'object' ? value : {}) };
        if (clearFingerprint) delete next.fingerprint;
        patch.privacy = next;
      }
      else if (key === 'platform' && value && typeof value === 'object') patch.platform = { ...(current.platform || {}), ...value };
      else if (key === 'advanced' && value && typeof value === 'object') patch.advanced = { ...(current.advanced || {}), ...value };
      else if (key === 'proxyMeta' && value && typeof value === 'object') patch.proxyMeta = { ...(current.proxyMeta || {}), ...value };
      else if (key === 'user_proxy_config' && value && typeof value === 'object') {
        const { proxy_type, proxy_host, proxy_port, proxy_user, proxy_password } = value;
        if (proxy_host && proxy_port) {
          const type = String(proxy_type || 'http').toLowerCase();
          patch.proxy = (type === 'socks' ? 'socks5' : type) + '://' +
            (proxy_user ? encodeURIComponent(proxy_user) + ':' + encodeURIComponent(proxy_password || '') + '@' : '') +
            proxy_host + ':' + proxy_port;
          patch.networkMode = 'proxy';
        }
      }
      else if (key === 'fingerprint' && value && typeof value === 'object') patch.fingerprint = { ...value };
      else if (key !== 'profile_id' && key !== 'user_id' && key !== 'id') patch[key] = value;
    }
    if (clearFingerprint) {
      delete patch.fingerprint;
      if (!Object.prototype.hasOwnProperty.call(patch, 'privacy')) {
        const nextPrivacy = { ...(current.privacy || {}) };
        delete nextPrivacy.fingerprint;
        patch.privacy = nextPrivacy;
      }
    }
    const mergedProfile = { ...current, ...patch, id };
    if (clearFingerprint) {
      // Older callers/tests may still carry a duplicated top-level
      // fingerprint alongside privacy.fingerprint. Remove both copies so a
      // reset cannot be undone by the merge before sanitization.
      delete mergedProfile.fingerprint;
      if (mergedProfile.privacy && typeof mergedProfile.privacy === 'object') {
        delete mergedProfile.privacy.fingerprint;
      }
    }
    const next = this.engine.sanitizeProfile(mergedProfile);
    this.normalizeProxyAssociationState(next, association.present
      ? association
      : (hasManualProxyPatch ? { present: true, value: '' } : association));
    try {
      // API patches were built from authoritative fields above. Publication
      // must still share the engine's maintenance/deletion and proxy rules.
      await this.engine.syncProfiles([{ ...next, credentialsAction: 'replace', proxyAuthAction: 'clear' }]);
    } catch (error) {
      if (['PROFILE_MAINTENANCE', 'PROFILE_DELETING', 'PROFILE_STALE_REV'].includes(error.code)) return fail(error.message, 409);
      throw error;
    }
    const profile = this.engine.profiles.get(id);
    return ok({
      profile_id: id,
      ...proxySummary(profile, this.proxyStore, association.present ? association.value : undefined),
      profile: redactProfileForApi(profile),
    });
  }

  async routeProfileDuplicate({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const duplicateInput = normalizeProfileInput(input);
    const sourceId = firstString(duplicateInput, ['source_profile_id', 'sourceProfileId', 'profile_id', 'profileId', 'user_id', 'userId', 'id']).trim();
    if (!sourceId) return fail('source profile id required', 400);
    const source = this.engine.profiles.get(sourceId);
    if (!source) return fail('source profile not found', 404);
    const numbers = [...this.engine.profiles.values()].map((item) => Number(item.number)).filter((n) => Number.isInteger(n) && n > 0);
    const number = (numbers.reduce((maximum, value) => Math.max(maximum, value), 0) || 0) + 1;
    const id = 'ob-' + Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex');
    const base = this.engine.sanitizeProfile(source);
    const requestedStartUrl = duplicateInput.startUrl !== undefined
      ? String(duplicateInput.startUrl || '').trim()
      : null;
    const next = this.engine.sanitizeProfile({
      ...base,
      id,
      number,
      name: String(duplicateInput.name || (base.name ? base.name + ' Copy' : 'Environment ' + number)),
      title: String(duplicateInput.name || base.title || base.name || ('Environment ' + number)),
      startUrl: requestedStartUrl === null ? base.startUrl : requestedStartUrl,
      profileId: id,
      cookies: '',
      username: '',
      password: '',
      totpSecret: '',
      otp: '',
      exitCheckedAt: undefined,
      exitNetwork: undefined,
      platform: {
        ...(base.platform || {}),
        ...(requestedStartUrl === null ? {} : { startUrl: requestedStartUrl }),
        username: '',
        password: '',
        totpSecret: '',
        otp: '',
        accounts: [],
      },
      advanced: {
        ...(base.advanced || {}),
        ...(requestedStartUrl === null ? {} : { startUrls: requestedStartUrl }),
      },
      privacy: {
        ...(base.privacy || {}),
        fingerprint: undefined,
        batterySnapshot: undefined,
        mediaLabels: undefined,
      },
    });
    await this.engine.syncProfiles([next]);
    return ok({ profile_id: id, profile: redactProfileForApi(this.engine.profiles.get(id) || next) });
  }

  async routeProfileDelete({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const rawIds = firstArray(input, ['user_ids', 'userIds', 'profile_ids', 'profileIds', 'ids'])
      || [firstDefined(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id'])];
    const ids = rawIds.map((value) => String(value || '').trim()).filter(Boolean);
    if (!ids.length) return fail('profile id required', 400);
    let result;
    try {
      const deleteData = input.delete_data !== undefined
        ? booleanValue(input.delete_data, true)
        : booleanValue(input.deleteData, true);
      result = await this.engine.deleteProfiles(ids, deleteData);
    } catch (error) {
      // e.g. isolation root validation rejection while removing profile data —
      // surface as a request error, not an internal 500.
      return fail(`delete failed: ${error.message}`, 400);
    }
    return ok(result);
  }

  async routeBrowserStart({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id']);
    const profile = this.engine.profiles.get(id);
    if (!profile) return fail('profile not found', 404);
    const started = await this.engine.start(profile);
    const port = started?.port || this.engine.running?.get(id)?.port || null;
    const puppeteerWs = port ? await resolveWebSocketDebuggerUrl(port, id) : null;
    return ok({
      user_id: id,
      profile_id: id,
      debug_port: port,
      ws: {
        puppeteer: puppeteerWs,
      },
    });
  }

  async routeBrowserStop({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id']).trim();
    if (!id) return fail('profile id required', 400);
    if (!this.engine.profiles?.has(id)) return fail('profile not found', 404);
    await this.engine.stop(id);
    return ok({ user_id: id, profile_id: id });
  }

  async routeBrowserStopAll() {
    await this.engine.stopAll();
    return ok({ stopped: true });
  }

  async routeBrowserActive() {
    const active = this.engine.status().filter((item) => item.running).map((item) => ({
      user_id: item.id,
      debug_port: item.port,
      profile_directory: item.profileDirectory || null,
    }));
    return ok({ list: active });
  }

  async routeProfileDetail({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const profile = this.engine.profiles?.get(id);
    if (!profile) return fail('profile not found', 404);
    const running = this.engine.running?.get(id);
    return ok({
      profile_id: id,
      user_id: id,
      name: profile.name,
      title: profile.title,
      status: running ? 'Active' : 'Inactive',
      debug_port: running?.port || null,
      ws: running?.port ? { puppeteer: await resolveWebSocketDebuggerUrl(running.port, id), selenium: '127.0.0.1:' + running.port } : null,
      profile: redactProfileForApi(profile),
      ...proxySummary(profile, this.proxyStore),
    });
  }

  async routeBrowserOpenUrl({ input }) {
    if (!this.engine) return fail('browser engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    const rawUrl = firstString(input, ['url', 'target_url', 'targetUrl', 'start_url', 'startUrl']);
    if (!id) return fail('profile id required', 400);
    if (!rawUrl) return fail('url required', 400);
    let targetUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl) && !/^about:/i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    const runningItem = this.engine.running?.get(id);
    const cdp = require('../../cdp');
    if (runningItem?.engine === 'firefox') {
      try {
        await navigateFirefox(runningItem, targetUrl);
        return ok({ profile_id: id, url: targetUrl, navigated: true });
      } catch (error) { return fail('navigate failed: ' + error.message, 500); }
    }
    if (runningItem?.port) {
      try {
        await cdp.navigate(runningItem.port, targetUrl);
        return ok({ profile_id: id, url: targetUrl, navigated: true });
      } catch (error) {
        return fail('navigate failed: ' + error.message, 500);
      }
    }
    const profile = this.engine.profiles?.get(id);
    if (!profile) return fail('profile not found', 404);
    const started = await this.engine.start({ ...profile, startUrl: targetUrl });
    const port = started?.port || null;
    const puppeteerWs = port ? await resolveWebSocketDebuggerUrl(port, id) : null;
    return ok({
      profile_id: id,
      url: targetUrl,
      started: true,
      debug_port: port,
      ws: port ? { puppeteer: puppeteerWs } : null,
    });
  }

  async routeBrowserScreenshot({ input }) {
    if (!this.engine) return fail('browser engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const runningItem = this.engine.running?.get(id);
    if (!runningItem) return fail('profile is not running', 400);
    if (runningItem.engine === 'firefox') {
      const format = String(input.format || 'png').toLowerCase() === 'jpeg' ? 'jpeg' : 'png';
      try { return ok({ profile_id: id, format, data: await screenshotFirefox(runningItem, format) }); }
      catch (error) { return fail('screenshot failed: ' + error.message, 500); }
    }
    if (!runningItem.port) return fail('browser control unavailable', 503);
    const cdp = require('../../cdp');
    try {
      const tab = await cdp.firstTab(runningItem.port);
      if (!tab) return fail('no active tab in profile', 404);
      const format = String(input.format || 'png').toLowerCase();
      const shot = await cdp.call(tab.webSocketDebuggerUrl, 'Page.captureScreenshot', { format: format === 'jpeg' ? 'jpeg' : 'png' }, 15000);
      if (!shot?.data) return fail('failed to capture screenshot', 500);
      return ok({
        profile_id: id,
        format: format === 'jpeg' ? 'jpeg' : 'png',
        data: shot.data,
      });
    } catch (error) {
      return fail('screenshot failed: ' + error.message, 500);
    }
  }

  async routeFingerprint({ input }) {
    const id = firstString(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id']);
    if (!id) return fail('profile_id required', 400);
    try {
      return ok(this.engine.fingerprintFor(id));
    } catch (error) {
      return fail(error.message, 400);
    }
  }

  async routeIsolationAudit() {
    return ok(this.engine.isolationAudit());
  }

  resolveProxyAssociation(input = {}, base = {}) {
    const association = readProxyAssociation(input);
    if (!association.present) return { present: false, patch: {} };
    if (!association.value) {
      return {
        present: true,
        value: '',
        patch: {
          proxyId: null,
          proxyMeta: this.proxyMetaWithAssociation(base.proxyMeta, null),
        },
      };
    }
    if (!this.proxyStore) {
      const error = new Error('proxy store unavailable');
      error.statusCode = 503;
      throw error;
    }
    const item = this.proxyStore.get(association.value);
    if (!item) {
      const error = new Error('proxy library entry not found: ' + association.value);
      error.statusCode = 404;
      throw error;
    }
    return {
      present: true,
      value: item.id,
      item,
      patch: {
        proxyId: item.id,
        proxy: item.raw,
        networkMode: 'proxy',
        proxyMeta: this.proxyMetaWithAssociation({
          ...(base.proxyMeta || {}),
          ipChannel: item.ipChannel || base.proxyMeta?.ipChannel || 'ip-api',
          refreshUrl: item.refreshUrl || base.proxyMeta?.refreshUrl || '',
        }, item.id),
      },
    };
  }

  proxyMetaWithAssociation(value, proxyId) {
    const proxyMeta = value && typeof value === 'object' ? { ...value } : {};
    for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId', 'proxyIdAlias']) delete proxyMeta[key];
    proxyMeta.proxyId = proxyId == null || String(proxyId).trim() === '' ? null : String(proxyId).trim();
    return proxyMeta;
  }

  normalizeProxyAssociationState(profile, association) {
    if (!profile || !association?.present) return profile;
    for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId', 'proxyIdAlias']) delete profile[key];
    const proxyId = association.value || null;
    profile.proxyId = proxyId;
    profile.proxyMeta = this.proxyMetaWithAssociation(profile.proxyMeta, proxyId);
    return profile;
  }
}

module.exports = { ProfileRoutes };

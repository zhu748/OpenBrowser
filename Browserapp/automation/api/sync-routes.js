'use strict';

const { parseProfileIds } = require('./profile-ids');
const { booleanValue } = require('./input');
const { ok, fail } = require('./responses');

/** HTTP-independent handlers with explicit domain dependencies. */
class SyncRoutes {
  constructor({ syncBridge } = {}) {
    this.syncBridge = syncBridge;
  }

  async routeSyncStatus() {
    return ok(this.syncBridge.status());
  }

  async routeSyncStart({ input }) {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    if (Object.prototype.hasOwnProperty.call(input || {}, 'settings')) {
      return fail('sync settings must be updated through /api/sync/settings', 400);
    }
    let ids;
    try {
      ids = parseProfileIds(input);
    } catch (err) {
      return fail('invalid profile ids: ' + (err?.message || err), 400);
    }
    if (input.operate) this.syncBridge.updateOperateList(input.operate);
    try {
      const result = await this.syncBridge.start(ids, {
        tile: booleanValue(input.tile, true),
        cascade: booleanValue(input.cascade, false),
      });
      return ok(result);
    } catch (err) {
      return fail('sync start failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncStop() {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    try {
      return ok(this.syncBridge.stop());
    } catch (err) {
      return fail('sync stop failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncRestart() {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    try {
      return ok(await this.syncBridge.restart());
    } catch (err) {
      return fail('sync restart failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncArrange({ input }) {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    let ids;
    try {
      ids = parseProfileIds(input);
    } catch (err) {
      return fail('invalid profile ids: ' + (err?.message || err), 400);
    }
    try {
      return ok(await this.syncBridge.arrange(ids, input.mode || 'tile'));
    } catch (err) {
      return fail('sync arrange failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncSettingsGet() {
    return ok(this.syncBridge.getSettings?.() || {});
  }

  async routeSyncSettingsPost({ input }) {
    return ok(this.syncBridge.updateSettings?.(input) || {});
  }
}

module.exports = { SyncRoutes };

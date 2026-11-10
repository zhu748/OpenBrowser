'use strict';

const { parseProfileIds } = require('./profile-ids');
const { booleanValue, firstString } = require('./input');
const { ok, fail } = require('./responses');

/** HTTP-independent handlers with explicit domain dependencies. */
class CatalogRoutes {
  constructor({ appCenter, engine } = {}) {
    this.appCenter = appCenter;
    this.engine = engine;
  }

  async routeAppList({ input }) {
    if (!this.appCenter) return fail('app center unavailable', 503);
    return ok(this.appCenter.list(input));
  }

  async routeAppRecommended() {
    if (!this.appCenter) return fail('app center unavailable', 503);
    return ok({ list: this.appCenter.recommended() });
  }

  async routeExtensionList() {
    return ok({ list: this.engine.listExtensions() });
  }

  async routeExtensionAssign({ input }) {
    const extensionId = firstString(input, ['extension_id', 'extensionId', 'id']);
    const ids = parseProfileIds(input);
    const enabled = booleanValue(input.enabled, true);
    if (!extensionId || !ids.length) return fail('extension_id and profile_ids required', 400);
    await this.engine.assignExtension(extensionId, ids, enabled);
    return ok({ extension_id: extensionId, profile_ids: ids, enabled });
  }

  async routeExtensionStatus() {
    return ok({ list: this.engine.listExtensions() });
  }
}

module.exports = { CatalogRoutes };

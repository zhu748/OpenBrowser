'use strict';

const { ProfileRoutes } = require('./profile-routes');
const { ProxyRoutes } = require('./proxy-routes');
const { SyncRoutes } = require('./sync-routes');
const { RpaRoutes } = require('./rpa-routes');
const { CatalogRoutes } = require('./catalog-routes');

/** Bind each handler to its own controller, never to the HTTP server. */
function createApiHandlers(context) {
  const handlers = Object.create(null);
  const controllers = [new ProfileRoutes(context), new ProxyRoutes(context), new SyncRoutes(context), new RpaRoutes(context), new CatalogRoutes(context)];
  for (const controller of controllers) {
    for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(controller))) {
      if (!name.startsWith('route')) continue;
      if (handlers[name]) throw new Error('Duplicate API handler: ' + name);
      handlers[name] = controller[name].bind(controller);
    }
  }
  return Object.freeze(handlers);
}

module.exports = { createApiHandlers };

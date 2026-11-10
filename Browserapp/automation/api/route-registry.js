'use strict';

// Each alias declares its verbs and handlers once. Both dispatch and the
// HTTP 405 gate derive from this registry, so their accepted paths cannot drift.
const GROUPS = [
  [{ GET: 'routeStatus' }, ['/', '/status']],
  [{ GET: 'routeVersion' }, ['/api/getVersion', '/api/v1/version']],
  [{ GET: 'routeProfileList' }, ['/api/v1/user/list', '/api/v2/browser-profile/list', '/api/profiles']],
  [{ POST: 'routeProfileCreate' }, ['/api/v1/user/create', '/api/v2/browser-profile/create', '/api/profiles/create']],
  [{ POST: 'routeProfileUpdate' }, ['/api/v2/browser-profile/update', '/api/profiles/update']],
  [{ POST: 'routeProfileDuplicate' }, ['/api/v2/browser-profile/duplicate', '/api/profiles/duplicate']],
  [{ POST: 'routeProfileDelete' }, ['/api/v1/user/delete', '/api/v2/browser-profile/delete', '/api/profiles/delete']],
  [{ POST: 'routeBrowserStart' }, ['/api/v1/browser/start', '/api/v2/browser-profile/start', '/api/browser/start']],
  [{ POST: 'routeBrowserStop' }, ['/api/v1/browser/stop', '/api/v2/browser-profile/stop', '/api/browser/stop']],
  [{ POST: 'routeBrowserStopAll' }, ['/api/v1/browser/stop-all', '/api/v2/browser-profile/stop-all', '/api/browser/stop-all']],
  [{ GET: 'routeBrowserActive' }, ['/api/v1/browser/active', '/api/v2/browser-profile/active', '/api/browser/active']],
  [{ GET: 'routeProfileDetail' }, ['/api/v1/user/detail', '/api/v2/browser-profile/detail', '/api/profiles/get', '/api/profile']],
  [{ POST: 'routeBrowserOpenUrl' }, ['/api/v1/browser/open-url', '/api/browser/open-url']],
  [{ POST: 'routeBrowserScreenshot' }, ['/api/v1/browser/screenshot', '/api/browser/screenshot']],
  [{ GET: 'routeProxyList' }, ['/api/v2/proxy-list/list', '/api/proxy/list']],
  [{ POST: 'routeProxyCreate' }, ['/api/v2/proxy-list/create', '/api/proxy/create']],
  [{ POST: 'routeProxyUpdate' }, ['/api/v2/proxy-list/update', '/api/proxy/update']],
  [{ POST: 'routeProxyDelete' }, ['/api/v2/proxy-list/delete', '/api/proxy/delete']],
  [{ POST: 'routeProxyCheck' }, ['/api/proxy/check', '/api/checkProxy']],
  [{ POST: 'routeProxyCheckProfile' }, ['/api/proxy/check-profile']],
  [{ GET: 'routeFingerprint' }, ['/api/fingerprint', '/api/v1/fingerprint']],
  [{ GET: 'routeIsolationAudit' }, ['/api/isolation/audit', '/api/v1/isolation/audit']],
  [{ GET: 'routeAppList' }, ['/api/v1/application/list', '/api/application/list', '/api/apps']],
  [{ GET: 'routeAppRecommended' }, ['/api/application/recommended', '/api/apps/recommended']],
  [{ GET: 'routeExtensionList' }, ['/api/extension/list', '/api/extensions']],
  [{ POST: 'routeExtensionAssign' }, ['/api/extension/assign', '/api/extensions/assign']],
  [{ GET: 'routeExtensionStatus' }, ['/api/extension/update', '/api/getExtensionStatus']],
  [{ GET: 'routeSyncStatus' }, ['/api/sync/status', '/api/window-sync/status']],
  [{ POST: 'routeSyncStart' }, ['/api/sync/start', '/api/window-sync/start']],
  [{ POST: 'routeSyncStop' }, ['/api/sync/stop', '/api/window-sync/stop']],
  [{ POST: 'routeSyncRestart' }, ['/api/sync/restart', '/api/window-sync/restart']],
  [{ POST: 'routeSyncArrange' }, ['/api/sync/arrange', '/api/window-sync/arrange']],
  [{ POST: 'routeRpaRun' }, ['/api/rpa/run', '/api/rpa', '/api/rpav2']],
  [{ GET: 'routeRpaStatus' }, ['/api/getRpaStatus', '/api/rpa/status']],
  [{ POST: 'routeRpaStop' }, ['/api/stopRpa', '/api/rpa/stop']],
  [{ GET: 'routeSyncSettingsGet', POST: 'routeSyncSettingsPost' }, ['/api/sync/settings']],
  [{ GET: 'routeRpaPlansList', POST: 'routeRpaPlanUpsert' }, ['/api/rpa/plans']],
  [{ GET: 'routeRpaTasksList', DELETE: 'routeRpaTasksDelete' }, ['/api/rpa/tasks']],
  [{ POST: 'routeRpaTasksDelete' }, ['/api/rpa/tasks/delete']],
  [{ GET: 'routeRpaTemplatesList', POST: 'routeRpaTemplatesAction' }, ['/api/rpa/templates']],
];

const exactRoutes = new Map();
for (const [handlers, paths] of GROUPS) {
  const entry = Object.freeze({ handlers: Object.freeze(handlers), methods: Object.freeze(Object.keys(handlers)) });
  for (const pathname of paths) {
    if (exactRoutes.has(pathname)) throw new Error('Duplicate local API route: ' + pathname);
    exactRoutes.set(pathname, entry);
  }
}
const prefixRoutes = [
  {
    prefix: '/api/rpa/plans/',
    DELETE: 'routeRpaPlanDelete'
  },
  {
    prefix: '/api/rpa/tasks/',
    GET: 'routeRpaTaskGet',
    DELETE: 'routeRpaTaskDelete'
  },
  {
    prefix: '/api/rpa/templates/',
    suffix: '/install',
    POST: 'routeRpaTemplateInstall'
  },
  {
    prefix: '/api/rpa/templates/',
    GET: 'routeRpaTemplateGet',
    DELETE: 'routeRpaTemplateDelete'
  }
].map((route) => Object.freeze({
  ...route, methods: Object.freeze(Object.keys(route).filter((key) => key !== 'prefix' && key !== 'suffix')),
}));

function matchingPrefix(pathname) {
  return prefixRoutes.find((route) => pathname.startsWith(route.prefix) && (!route.suffix || pathname.endsWith(route.suffix)));
}

function allowedMethodsForPath(pathname) {
  return exactRoutes.get(pathname)?.methods || matchingPrefix(pathname)?.methods || null;
}

function resolveApiRoute(method, pathname) {
  const exact = exactRoutes.get(pathname);
  if (exact && Object.prototype.hasOwnProperty.call(exact.handlers, method)) return exact.handlers[method];
  // Keep the established prefix precedence for direct route() callers too.
  for (const route of prefixRoutes) {
    if (!pathname.startsWith(route.prefix) || (route.suffix && !pathname.endsWith(route.suffix))) continue;
    if (route.methods.includes(method)) return route[method];
  }
  return null;
}

function validateApiRoutes(prototype) {
  for (const [pathname, entry] of exactRoutes) {
    for (const name of Object.values(entry.handlers)) {
      if (typeof prototype[name] !== 'function') throw new Error('Local API handler missing: ' + pathname + ' -> ' + name);
    }
  }
  for (const route of prefixRoutes) {
    for (const method of route.methods) {
      if (typeof prototype[route[method]] !== 'function') throw new Error('Local API prefix handler missing: ' + route.prefix + ' -> ' + route[method]);
    }
  }
}

module.exports = { allowedMethodsForPath, resolveApiRoute, validateApiRoutes };

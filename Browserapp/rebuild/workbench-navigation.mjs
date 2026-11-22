const standalone = path => path === '/agent-console' || path.startsWith('/agent-console/') || ['/api-keys', '/skills'].includes(path);

export async function installWorkspaceNavigation(router, { url, dialogKind, request, events }) {
  const current = new URL(url), workspace = current.searchParams.has('workspace');
  const activate = async () => {
    active = true;
    if (latestRoute) await navigate(latestRoute);
  };
  if (dialogKind) return { initialPath: current.hash.slice(1) || '/browser/list', activate: async () => {} };
  let latestRoute;
  let active = false;
  const navigate = route => router.push(route).catch(error => globalThis.__localUiError?.(error.message));
  if (workspace) {
    const dispose = events?.(event => {
      if (event.channel === 'workspace:navigate') {
        latestRoute = event.payload;
        if (active) void navigate(latestRoute);
      }
    });
    if (dispose && typeof window !== 'undefined') window.addEventListener('pagehide', dispose, { once: true });
  }
  router.beforeEach(to => {
    if (to.meta?.syncDialog) {
      request('ui:dialog:open', { kind: to.meta.syncDialog, tab: to.query.tab ?? undefined })
        .catch(error => globalThis.__localUiError?.(error.message));
      return false;
    }
    if (!workspace && standalone(to.path)) {
      request('ui:workspace:open', { route: to.fullPath }).catch(error => globalThis.__localUiError?.(error.message));
      return false;
    }
    if (workspace && to.path === '/browser/list') {
      request('ui:workspace:focus-main').catch(error => globalThis.__localUiError?.(error.message));
      return false;
    }
    return true;
  });
  if (workspace) {
    const ready = await request('ui:workspace:ready');
    const initialPath = latestRoute || ready.route;
    latestRoute = undefined;
    return { initialPath, activate };
  }
  const initial = current.hash.slice(1) || '/browser/list';
  // Old builds could persist an Agent route as the main window's startup page.
  // Match only the route path: a stored hash-router route can have its own fragment.
  return { initialPath: standalone(initial.split(/[?#]/, 1)[0]) ? '/browser/list' : initial, activate };
}

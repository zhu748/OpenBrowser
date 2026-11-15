const standalone = path => path === '/agent-console' || path.startsWith('/agent-console/') || ['/api-keys', '/skills'].includes(path);

export async function installWorkspaceNavigation(router, { url, dialogKind, request, events }) {
  const current = new URL(url), workspace = current.searchParams.has('workspace');
  if (dialogKind) return current.hash.slice(1) || '/browser/list';
  let latestRoute;
  if (workspace) {
    const dispose = events?.(event => {
      if (event.channel === 'workspace:navigate') {
        latestRoute = event.payload;
        router.push(latestRoute).catch(error => globalThis.__localUiError?.(error.message));
      }
    });
    if (dispose && typeof window !== 'undefined') window.addEventListener('pagehide', dispose, { once: true });
  }
  router.beforeEach(to => {
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
    return latestRoute || ready.route;
  }
  const initial = current.hash.slice(1) || '/browser/list';
  // Old builds could persist an Agent route as the main window's startup page.
  return standalone(initial.split('?')[0]) ? '/browser/list' : initial;
}

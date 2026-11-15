const standalone = (path) => path === "/agent-console" || path.startsWith("/agent-console/") || ["/api-keys", "/skills"].includes(path);
async function installWorkspaceNavigation(router, { url, dialogKind, request, events }) {
  const current = new URL(url), workspace = current.searchParams.has("workspace");
  if (dialogKind) return current.hash.slice(1) || "/browser/list";
  let latestRoute;
  if (workspace) {
    const dispose = events?.((event) => {
      event.channel === "workspace:navigate" && (latestRoute = event.payload, router.push(latestRoute).catch((error) => globalThis.__localUiError?.(error.message)));
    });
    dispose && typeof window < "u" && window.addEventListener("pagehide", dispose, { once: !0 });
  }
  if (router.beforeEach((to) => !workspace && standalone(to.path) ? (request("ui:workspace:open", { route: to.fullPath }).catch((error) => globalThis.__localUiError?.(error.message)), !1) : workspace && to.path === "/browser/list" ? (request("ui:workspace:focus-main").catch((error) => globalThis.__localUiError?.(error.message)), !1) : !0), workspace) {
    const ready = await request("ui:workspace:ready");
    return latestRoute || ready.route;
  }
  const initial = current.hash.slice(1) || "/browser/list";
  return standalone(initial.split("?")[0]) ? "/browser/list" : initial;
}
export {installWorkspaceNavigation as installWorkspaceNavigation};
import { ref } from './workbench-vue.js';
import { i as defineStore } from './agent-BmSFI9WH.js';
import { useWorkspace } from './workbench-local-workspace.js';
import { listCacheVersion } from './workbench-table.js';

const keys = Object.freeze({ BROWSER_LIST: 'browser-list', ACCOUNT_LIST: 'account-list', PROJECT_LIST: 'project-list', ECOMMERCE_ACCOUNT_LIST: 'ecommerce-account-list' });
const buildScopeKey = query => JSON.stringify(Object.fromEntries(Object.keys(query).sort().map(key => [key, query[key]])));
const isProjectDetailScope = ({ projectId }) => projectId != null && String(projectId) !== '';
const tracksProjects = (list, query) => (list === keys.BROWSER_LIST || list === keys.ECOMMERCE_ACCOUNT_LIST) && isProjectDetailScope(query);
const workspaceKey = (list, workspace) => `${list}:${workspace}`;
const cacheKey = (list, workspace, query) => `${workspaceKey(list, workspace)}:${buildScopeKey(query)}`;
const useListCache = defineStore('listCache', () => {
  const rows = ref(new Map());
  const recentProjects = ref(new Map());
  const scroll = ref(new Map());
  function get(list, workspace, query) {
    if (!workspace) return null;
    const entry = rows.value.get(cacheKey(list, workspace, query));
    return entry?.version === listCacheVersion(list) ? entry ?? null : null;
  }
  function remember(list, workspace, key) {
    const bucket = workspaceKey(list, workspace);
    const order = (recentProjects.value.get(bucket) ?? []).filter(value => value !== key);
    order.push(key);
    while (order.length > 5) {
      const evicted = order.shift();
      rows.value.delete(evicted);
      scroll.value.delete(evicted);
    }
    recentProjects.value.set(bucket, order);
  }
  function touch(list, workspace, query) {
    const key = cacheKey(list, workspace, query);
    const entry = rows.value.get(key);
    if (!entry) return;
    entry.lastAccessedAt = Date.now();
    if (tracksProjects(list, query)) remember(list, workspace, key);
  }
  function set(list, workspace, query, data) {
    if (!workspace) return;
    const key = cacheKey(list, workspace, query);
    rows.value.set(key, { ...data, lastAccessedAt: Date.now(), version: listCacheVersion(list) });
    if (tracksProjects(list, query)) remember(list, workspace, key);
  }
  function invalidate(list, workspace, query) {
    if (!workspace) return;
    const bucket = workspaceKey(list, workspace);
    if (query) {
      const key = cacheKey(list, workspace, query);
      rows.value.delete(key);
      if (tracksProjects(list, query)) recentProjects.value.set(bucket, (recentProjects.value.get(bucket) ?? []).filter(value => value !== key));
    } else {
      for (const key of rows.value.keys()) if (key.startsWith(bucket + ':')) rows.value.delete(key);
      recentProjects.value.delete(bucket);
    }
  }
  function clearAll() { rows.value.clear(); recentProjects.value.clear(); scroll.value.clear(); }
  function setScrollOffset(list, workspace, query, value) { if (workspace) scroll.value.set(cacheKey(list, workspace, query), value); }
  function peekScrollOffset(list, workspace, query) {
    if (!workspace) return null;
    const key = cacheKey(list, workspace, query);
    return scroll.value.has(key) ? scroll.value.get(key) ?? 0 : null;
  }
  function clearScrollOffset(list, workspace, query) {
    if (!workspace) return;
    if (query) scroll.value.delete(cacheKey(list, workspace, query));
    else for (const key of scroll.value.keys()) if (key.startsWith(workspaceKey(list, workspace) + ':')) scroll.value.delete(key);
  }
  return { get, set, touch, hasValid: (...args) => get(...args) !== null, invalidate, clearAll,
    setScrollOffset, peekScrollOffset, clearScrollOffset, buildScopeKey, isProjectDetailScope };
});
function useListInvalidation() {
  const cache = useListCache();
  const workspace = useWorkspace();
  return { invalidateCache(list, query) {
    const id = workspace.currentWorkspace?.id;
    if (id) cache.invalidate(list, String(id), query);
  } };
}
export { keys as vt, useListCache as bt, useListInvalidation as yt };

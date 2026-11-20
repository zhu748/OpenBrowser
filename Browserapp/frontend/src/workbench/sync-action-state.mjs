import { t as translate } from './locales-BfKu2SD4.js';
import {
  St as ref, V as onMounted, R as onBeforeUnmount, at as useTemplateRef,
  d as computed, st as watch,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { ci as finishLoading, pi as isWindows, v as useConfig } from './utils-BIWenCnY.js';
import { t as merge } from './merge-B7DGYZqS.js';
import { n as useNotifications } from './usetoast-DphSlejX.js';
import { r as defaultPreferences } from './main-types-DreniZN2.js';
import { t as savePreferences } from './util-C5rl6Moc.js';

const hideToolsDelay = 1900;

export function useSyncActionState(makeMenu) {
  const api = globalThis.electronAPI;
  const { getUserConfig } = useConfig();
  const platform = isWindows ? 'windows' : 'mac';
  const bar = useTemplateRef('actionBar');
  const tools = useTemplateRef('bottomBar');
  const preferences = ref(structuredClone(defaultPreferences));
  const menu = ref(makeMenu(preferences));
  const active = ref(true);
  const busy = ref(false);
  const count = ref(0);
  const mixedCoreVersions = ref(false);
  const toast = useNotifications();
  let applyPreferences = false;
  let disposed = false;
  let hideTimer;
  let pointerTimer;
  let snapshotSequence = 0;
  let preferencesSequence = 0;

  const toggleIcon = computed(() => busy.value ? 'base/rx_ic_renew'
    : active.value ? 'base/rx_ic_pause2' : 'base/rx_ic_play');
  const shortcutTooltip = (label, name) => computed(() => {
    const shortcut = preferences.value.shortcutKey[platform][name];
    return translate(label) + (shortcut ? ` (${shortcut})` : '');
  });
  const listTooltip = shortcutTooltip('同步窗口列表', 'openSyncWindowList');
  const settingsTooltip = shortcutTooltip('设置', 'openPreferenceSettings');

  function notify(error) {
    if (!disposed) toast.add({ severity: 'error', summary: error?.message || translate('操作失败'), life: 3000 });
  }

  async function refreshSession() {
    const ticket = ++snapshotSequence;
    try {
      const [state, rows, running] = await Promise.all([
        globalThis.ops.getSyncState(),
        api.send('syncControl:getAllSyncingWindows'),
        api.send('syncControl:getSyncWindowCount'),
      ]);
      if (disposed || ticket !== snapshotSequence) return;
      active.value = state.active;
      mixedCoreVersions.value = rows.some(row => row.coreVersion !== rows[0].coreVersion);
      count.value = running;
    } catch (error) {
      if (ticket === snapshotSequence) notify(error);
    }
  }

  async function refreshPreferences() {
    const ticket = ++preferencesSequence;
    try {
      const { preferenceSettings: saved } = await getUserConfig(true) || {};
      if (!saved || disposed || ticket !== preferencesSequence) return;
      applyPreferences = true;
      try {
        for (const [key, value] of Object.entries(preferences.value)) {
          if (Object.hasOwn(saved, key)) merge(value, saved[key]);
        }
        menu.value = makeMenu(preferences);
      } finally { applyPreferences = false; }
    } catch (error) {
      if (ticket === preferencesSequence) notify(error);
    }
  }

  function enter() {
    clearTimeout(hideTimer);
    void refreshPreferences();
  }

  function leave() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bar.value?.classList.remove('hover'), hideToolsDelay);
    tools.value?.click();
  }

  function showTools() {
    if (active.value) bar.value?.classList.add('hover');
  }

  async function toggle() {
    if (busy.value) return;
    busy.value = true;
    const wasActive = active.value;
    try {
      const result = await api.send(wasActive ? 'syncControl:pause' : 'syncControl:resume');
      if (disposed) return;
      active.value = result?.state?.active ?? !wasActive;
      if (wasActive) {
        bar.value?.classList.remove('hover');
        tools.value?.click();
      }
    } catch (error) {
      notify(error);
      void refreshSession();
    } finally {
      if (!disposed) busy.value = false;
    }
  }

  const send = channel => () => api.send(channel).catch(notify);
  api.on('browser:on-close', refreshSession);
  api.on('syncControl:toggleClickDelay', () => {
    preferences.value.simulate.enableClickDelay = !preferences.value.simulate.enableClickDelay;
  });
  api.on('syncControl:toggleInputDelay', () => {
    preferences.value.simulate.enableInputDelay = !preferences.value.simulate.enableInputDelay;
  });
  api.on('syncControl:syncWindowCountChange', running => { count.value = running; });
  globalThis.__localListenWindow('blur', leave);
  const unsubscribe = globalThis.ops.onEvent(event => {
    if (event.type === 'sync-state') void refreshSession();
  });
  watch(preferences, value => {
    if (!applyPreferences) void savePreferences(value).catch(notify);
  }, { deep: true, flush: 'sync' });

  finishLoading();
  onMounted(() => {
    pointerTimer = setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 60);
    void refreshSession();
    void refreshPreferences();
  });
  onBeforeUnmount(() => {
    disposed = true;
    unsubscribe();
    clearTimeout(pointerTimer);
    clearTimeout(hideTimer);
  });

  return {
    active, count, toggleIcon, menu, mixedCoreVersions, listTooltip, settingsTooltip,
    enter, leave, showTools, toggle,
    showAll: send('syncControl:showAll'), stop: send('syncControl:stop'),
    openSettings: send('syncControl:openPreferencesDialog'), openList: send('syncControl:openSyncingWindowListDialog'),
  };
}

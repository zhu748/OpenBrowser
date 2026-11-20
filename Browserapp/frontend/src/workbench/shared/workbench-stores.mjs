import { computed, reactive, ref } from './workbench-vue.js';
import { createPinia, defineStore, storeToRefs } from './workbench-pinia.js';
import { n as useNotifications } from './usetoast-DphSlejX.js';

function useFeedback() {
  const notifications = useNotifications();
  const titles = { success: $t('操作成功'), error: $t('操作失败') };
  function show(code, detail, options) {
    const severity = code === 0 ? 'success' : 'error';
    notifications.add({ severity, summary: titles[severity], detail, life: 3000, ...options });
  }
  function errorOnly(code, detail, options) {
    if (code === 0) return;
    notifications.add({ severity: 'error', summary: titles.error, detail, life: 5000, ...options });
  }
  return [show, errorOnly];
}
const useAgentAvailability = defineStore('agent', () => {
  const ready = ref(false);
  const health = reactive({ isOk: true, status: 'ready', loading: false });
  async function initialize() {
    const info = await globalThis.__agentRequest('info');
    ready.value = info.ready;
  }
  return {
    serverUrl: computed(() => ready.value ? 'obui://app' : ''), isReady: ready, initialized: ready, health,
    initMcp: initialize, ensureServer: initialize, waitUntilReady: initialize,
    markAgentChannelConnecting() {}, markAgentChannelFailure(message) { console.error(message); },
    markAgentChannelReady() { ready.value = true; }, markAgentChannelStopped() { ready.value = false; },
  };
});

export { storeToRefs as a, defineStore as i, useFeedback as n, createPinia as r, useAgentAvailability as t };

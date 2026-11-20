import { computed } from './workbench-vue.js';
import { i as defineStore } from './agent-BmSFI9WH.js';

const useLocalAgentStatus = defineStore('local-agent-settings-status', () => ({
  isEnabled: computed(() => false),
}));

export { useLocalAgentStatus as n };

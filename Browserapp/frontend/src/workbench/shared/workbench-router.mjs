import { ref } from './workbench-vue.js';
import { createWorkbenchRouter } from './routes.js';
import AgentEntry from './workbench-agent-entry.js';
import AgentChatRoute from './workbench-agent-chat-route.js';

export const router = createWorkbenchRouter({ agentShell: AgentEntry, agentChat: AgentChatRoute });
const agentHome = '/agent-console';

export function installRouter(app) {
  app.use(router);
}

export function useBusinessCode() {
  return { async handleBusinessCode(code, fallback) {
    if (fallback) return fallback();
    throw Object.assign(Error(`本地操作失败: ${code}`), { code });
  } };
}

export function useAgentNavigation() {
  return { opening: ref(false), openRoxyAIAgent: async (route = agentHome) => router.push(route) };
}

export const menuCommands = {
  'roxy-agent': () => router.push(agentHome),
  'roxy-agent-task-manager': () => router.push(`${agentHome}/task-manager`),
  'roxy-agent-my-templates': () => router.push(`${agentHome}/templates`),
  'roxy-agent-template-store': () => router.push(`${agentHome}/template-store`),
  'sync-control': () => globalThis.electronAPI.send('syncControl:open'),
};

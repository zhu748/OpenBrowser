export { default as t } from './workbench-task-status-badge.js';

export function i({ taskLogs, taskExecutionDetails }) {
  return [...new Set([...taskLogs, ...Object.values(taskExecutionDetails)].map(item => item.conversationId).filter(Boolean))];
}
function localAgentChannel() { return globalThis.__localAgentChannel(); }
export { localAgentChannel as n, localAgentChannel as r };

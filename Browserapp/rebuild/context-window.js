"use strict";
const size = (messages) => JSON.stringify(messages).length;
// Remove complete turns/tool exchanges. Never leave orphan tool messages or alter the latest request.
function compactContext(messages, limit) {
  let removed = 0;
  const notes = [];
  while (size(messages) > limit) {
    const users = messages.flatMap((m, i) => (m.role === "user" ? [i] : []));
    if (users.length > 1) {
      const first = users[0],
        next = users[1];
      messages.splice(first, next - first);
      removed += next - first;
      continue;
    }
    const exchanges = messages.flatMap((m, i) =>
      m.role === "assistant" && m.tool_calls?.length ? [i] : [],
    );
    if (exchanges.length > 1) {
      const first = exchanges[0],
        end = exchanges[1],
        batch = messages.slice(first, end);
      const summary = batch
        .filter((m) => m.role === "tool")
        .map(
          (m) => `工具 ${m.tool_call_id}: ${String(m.content).slice(0, 180)}`,
        )
        .join("\n");
      messages.splice(first, end - first);
      notes.push(summary);
      removed += end - first;
      continue;
    }
    break;
  }
  if (notes.length) {
    const system = messages.find((m) => m.role === "system");
    if (system)
      system.content +=
        "\n已执行步骤的简要记录（完整结果保存在本地日志）：\n" +
        notes.join("\n").slice(-2000);
  }
  if (size(messages) > limit)
    throw Object.assign(
      Error(
        "当前一轮请求或工具结果超过上下文上限，请提高 Agent 上下文限制或缩小任务范围",
      ),
      { code: "CONTEXT_LIMIT" },
    );
  return { removed, summary: notes.join("\n") };
}
function boundedToolResult(value, limit) {
  const text = JSON.stringify(value);
  return text.length <= limit
    ? text
    : JSON.stringify({
        truncated: true,
        preview: text.slice(0, Math.max(100, limit - 200)),
        fullResult: "完整工具结果保存在本地任务日志中",
      });
}
module.exports = { compactContext, boundedToolResult };

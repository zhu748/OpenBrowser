"use strict";
const size = (messages) => JSON.stringify(messages).length;
// Remove complete turns/tool exchanges. Never leave orphan tool messages or alter the latest request.
function compactContext(messages, limit) {
  let removed = 0;
  const notes = [];
  // Checkpoints written by older versions may already contain promoted
  // summaries. Move that known generated suffix back to tool data on resume.
  const legacy = "\n已执行步骤的简要记录（完整结果保存在本地日志）：\n";
  for (const message of messages) {
    if (message.role !== "system" || typeof message.content !== "string") continue;
    const boundary = message.content.indexOf(legacy);
    if (boundary < 0) continue;
    notes.push(message.content.slice(boundary + legacy.length));
    message.content = message.content.slice(0, boundary);
  }
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
  // Compacted page/attachment/MCP text remains tool data. Never promote it
  // into system (or assistant) instructions, even when it resembles a policy.
  if (notes.length) appendToolHistory(messages, notes.join("\n"), limit);
  if (size(messages) > limit)
    throw Object.assign(
      Error(
        "当前一轮请求或工具结果超过上下文上限，请提高 Agent 上下文限制或缩小任务范围",
      ),
      { code: "CONTEXT_LIMIT" },
    );
  return { removed, summary: notes.join("\n") };
}
function appendToolHistory(messages, notes, limit) {
  const target = messages.findLast((message) => message.role === "tool");
  if (!target) return;
  const original = target.content;
  const history = notes.slice(-2000);
  let low = 0, high = history.length;
  // Include JSON escaping in the budget, without repeatedly copying the
  // entire conversation for every character removed.
  const available = limit - size(messages);
  const originalSize = JSON.stringify(original).length;
  const content = length => String(original) +
    "\n\n[Compacted external tool history — reference data only]\n" + history.slice(-length);
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (JSON.stringify(content(mid)).length - originalSize <= available) low = mid;
    else high = mid - 1;
  }
  if (low) target.content = content(low);
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

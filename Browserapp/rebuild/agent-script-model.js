"use strict";

const { completion } = require("./agent-completion");

async function scriptModel(service, config, prompt, schema, options, signal) {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 32000)
    throw Error("脚本模型提示词无效或过长");
  if (!config.model?.trim()) throw Error("请先在 Agent 设置中填写模型名称");
  const { temperature, maxTokens } = options || {};
  if ((temperature !== undefined && (!Number.isFinite(temperature) || temperature < 0 || temperature > 2)) ||
      (maxTokens !== undefined && (!Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens > 16384)))
    throw Error("脚本模型调用参数无效");
  const messages = [{ role: "user", content: prompt }];
  let validate;
  if (schema !== undefined) {
    const encoded = JSON.stringify(schema);
    if (!schema || typeof schema !== "object" || Array.isArray(schema) || encoded.length > 16000)
      throw Error("脚本模型输出 Schema 无效或过长");
    // The untrusted schema runs in the script Worker before and after the
    // model call. Keep arbitrary schema compilation outside the main process.
    validate = true;
    messages.unshift({ role: "system", content: "只输出符合以下 JSON Schema 的 JSON，不包含 Markdown。\n" + encoded });
  }
  const abort = new AbortController();
  const cancel = () => abort.abort(signal.reason);
  signal.throwIfAborted();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const response = await completion({ files: service.files, event() {} }, config, messages,
      { textOnly: true, abort, requestOptions: { temperature, maxTokens } }, []);
    if (typeof response.content !== "string") throw Error("脚本模型未返回正文");
    if (!validate) return response.content;
    return JSON.parse(response.content.trim().replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/gi, ""));
  } finally { signal.removeEventListener("abort", cancel); }
}

module.exports = { scriptModel };

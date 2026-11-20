"use strict";

const providerFields = Object.freeze({
  telegram: ["botToken", "allowedChatIds"],
  lark: ["appId", "appSecret", "environment"],
  slack: ["botToken"],
  discord: ["botToken"],
});
const names = { telegram: "Telegram", lark: "飞书 / Lark", slack: "Slack", discord: "Discord" };

function providerFor(input) {
  const provider = input.provider;
  if (!Object.hasOwn(providerFields, provider)) throw Error("未知消息平台");
  return provider;
}

function fields(service, provider) {
  return {
    ...provider === "lark" && { environment: "feishu", appId: "" },
    ...service.data.integrationSettings?.[provider],
  };
}

function publicSettings(provider, values) {
  return {
    provider,
    hasCredential: Boolean(provider === "lark" ? values.appSecret : values.botToken),
    ...provider === "telegram" && { allowedChatIds: values.allowedChatIds || "" },
    ...provider === "lark" && { environment: values.environment, appId: values.appId },
  };
}

function getSettings(service, input) {
  const provider = providerFor(input);
  return publicSettings(provider, fields(service, provider));
}

function updatedFields(service, provider, input) {
  const next = fields(service, provider);
  if (input.clearCredential === true) delete next[provider === "lark" ? "appSecret" : "botToken"];
  const updates = input.values || {};
  for (const key of providerFields[provider]) {
    if (!Object.hasOwn(updates, key)) continue;
    const value = updates[key];
    if (typeof value !== "string" || value.length > 512 || /[\x00-\x1f\x7f]/.test(value))
      throw Error("消息平台配置格式无效");
    if (!["appSecret", "botToken"].includes(key) || value.trim()) next[key] = value.trim();
  }
  if (provider === "telegram") next.allowedChatIds = parseChatIds(next.allowedChatIds).join(", ");
  if (provider === "lark" && !["feishu", "lark"].includes(next.environment))
    throw Error("请选择飞书或 Lark");
  return next;
}

function parseChatIds(input) {
  const ids = [...new Set((input || "").split(/[\s,]+/).filter(Boolean))];
  if (ids.length > 32 || ids.some(id => !/^-?[1-9]\d{0,15}$/.test(id)))
    throw Error("请输入有效的 Telegram 聊天 ID，最多 32 个");
  return ids;
}

async function saveSettings(service, input) {
  const provider = providerFor(input);
  if (provider === "telegram" && service.telegram.current)
    throw Error("请先停止 Telegram，再修改配置");
  let next, integrationSettings;
  await service.save({
    scope: { conversations: [], logs: [] },
    snapshot: () => {
      next = updatedFields(service, provider, input);
      integrationSettings = { ...service.data.integrationSettings, [provider]: next };
      return { ...service.data, integrationSettings };
    },
    commit: () => { service.data.integrationSettings = integrationSettings; },
  });
  return publicSettings(provider, next);
}

function verificationRequest(provider, values) {
  const token = values.botToken || "";
  if (provider === "telegram") {
    if (!/^\d+:[A-Za-z0-9_-]{8,128}$/.test(token)) throw Error("请输入有效的 Telegram Bot Token");
    return [`https://api.telegram.org/bot${token}/getMe`, {}, data => data.ok === true && data.result?.is_bot === true];
  }
  if (provider === "lark") {
    if (!values.appId || !values.appSecret) throw Error("请填写 App ID 和 App Secret");
    const host = values.environment === "lark" ? "open.larksuite.com" : "open.feishu.cn";
    return [`https://${host}/open-apis/auth/v3/tenant_access_token/internal`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: values.appId, app_secret: values.appSecret }),
    }, data => data.code === 0 && Boolean(data.tenant_access_token)];
  }
  if (!/^[A-Za-z0-9._-]{10,256}$/.test(token)) throw Error(`请输入有效的 ${names[provider]} Bot Token`);
  if (provider === "slack") {
    return ["https://slack.com/api/auth.test", {
      method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/x-www-form-urlencoded" },
    }, data => data.ok === true];
  }
  return ["https://discord.com/api/v10/users/@me", {
    headers: { Authorization: "Bot " + token },
  }, data => data.bot === true && typeof data.id === "string"];
}

async function testSettings(service, input) {
  const provider = providerFor(input);
  const [url, options, verifies] = verificationRequest(provider, updatedFields(service, provider, input));
  let response, body;
  try {
    response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(12000) });
    body = await response.json();
  } catch {
    throw Error(`连接 ${names[provider]} 服务失败`);
  }
  if (!response.ok || !body || !verifies(body))
    throw Error(`${names[provider]} 凭证验证失败`);
  return { provider, verified: true };
}

module.exports = { getSettings, parseChatIds, saveSettings, testSettings };

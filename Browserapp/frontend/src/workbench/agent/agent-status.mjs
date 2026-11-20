const unknownError = () => $t('未知错误，请联系技术支持。');
const unavailable = () => $t('服务暂时不可用，请稍后重试。');
const statusMessages = {
  model_not_configured: () => $t('模型不支持。'),
  model_not_supported: () => $t('模型不支持，请尝试将 APP 更到最新版本，或者重启 Roxy AI Agent 窗口'),
  upstream_invalid_request: () => $t('请求参数有误，请调整后重试。'),
  upstream_content_policy_violation: () => $t('内容涉及敏感信息，请修改描述后重试。'),
  insufficient_points: unavailable,
  forward_rate_limited: unavailable,
  upstream_rate_limited: () => $t('服务暂时不可用，请联系技术支持'),
  provider_auth_failed: () => $t('服务暂时不可用，请稍后重试或联系技术支持。'),
  provider_quota_exceeded: () => $t('服务额度暂时不可用，请稍后重试或联系技术支持。'),
  provider_not_found: () => $t('服务配置异常，请联系技术支持。'),
  provider_unavailable: unavailable,
  provider_timeout: () => $t('服务响应超时，请稍后重试。'),
  network_interrupted: () => $t('网络异常，请稍后重试。'),
  agent_internal_error: unknownError,
};
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
const firstText = (...values) => values.find(value => typeof value === 'string' && value.trim());

function normalizeCode(code, message) {
  if (typeof code === 'string' && code.trim()) {
    if (!/^\d+$/.test(code.trim())) return code;
    code = Number(code);
  }
  if (code === 402 || /insufficient points|points balance is insufficient|积分不足/i.test(message ?? '')) return 'insufficient_points';
  if (code === 429) return 'upstream_rate_limited';
}

function readStatus(error) {
  if (!object(error)) return {};
  const response = object(error.response);
  const data = object(response?.data);
  const cause = object(error.error);
  const details = data ?? cause ?? error;
  const message = firstText(details.message, error.message, response?.message, data?.message, cause?.message);
  const code = normalizeCode(details.code ?? error.code ?? response?.status ?? data?.status ?? cause?.code, message);
  const requestId = firstText(details.requestId, details.request_id, error.requestId, error.request_id, error.requestID,
    response?.requestID, response?.requestId, data?.requestId, data?.request_id, cause?.requestID, cause?.requestId, cause?.request_id);
  const retryable = [details.retryable, data?.retryable, error.retryable].find(value => typeof value === 'boolean');
  return { code, message, requestId, retryable };
}

export function parseAgentStatus(error) {
  if (typeof error === 'string') return { message: error || unknownError(), retryable: false };
  const { code, message, requestId, retryable } = readStatus(error);
  const localized = Object.hasOwn(statusMessages, code) ? statusMessages[code]() : undefined;
  return { message: localized || message || unknownError(), code, retryable: retryable === true, requestId };
}

export function isAgentCancellation(error) {
  return readStatus(error).code === 'agent_cancelled' || error?.message === 'User cancelled';
}

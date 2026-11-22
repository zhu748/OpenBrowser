'use strict';

const { normalizeNetworkConditions } = require('../shared/profile-values');

function networkConditionParams(raw) {
  const value = normalizeNetworkConditions(raw);
  return {
    offline: value?.offline === true,
    latency: value?.latency ?? 0,
    downloadThroughput: value?.downloadThroughput ?? -1,
    uploadThroughput: value?.uploadThroughput ?? -1,
  };
}

function networkConditionsError(cause) {
  return Object.assign(new Error('网络模拟设置失败，已停止页面初始化：' + cause.message, { cause }), {
    code: 'NETWORK_CONDITIONS_APPLY_FAILED',
  });
}

async function applyNetworkConditions(sessionCall, raw) {
  try {
    await sessionCall('Network.enable', {});
    await sessionCall('Network.emulateNetworkConditions', networkConditionParams(raw), 5000);
  } catch (cause) {
    throw networkConditionsError(cause);
  }
}

async function applyNavigationNetworkConditions(sessionCall, raw) {
  // This handler lives in Chromium's browser process. Network.enable and
  // emulateNetworkConditions also wait for renderer agents to respond.
  const { offline, ...conditions } = networkConditionParams(raw);
  try {
    const result = await sessionCall('Network.emulateNetworkConditionsByRule', {
      offline, matchedNetworkConditions: [{ urlPattern: '', ...conditions }],
    });
    if (result.ruleIds?.length !== 1) throw new Error('未确认首个请求的网络模拟规则');
    return conditions.latency;
  } catch (cause) {
    throw networkConditionsError(cause);
  }
}

module.exports = { applyNetworkConditions, applyNavigationNetworkConditions };

'use strict';

const { normalizeNetworkConditions } = require('../shared/profile-values');

async function applyNetworkConditions(sessionCall, raw) {
  const value = normalizeNetworkConditions(raw);
  const params = {
    offline: value?.offline === true,
    latency: value?.latency ?? 0,
    downloadThroughput: value?.downloadThroughput ?? -1,
    uploadThroughput: value?.uploadThroughput ?? -1,
  };
  try {
    await sessionCall('Network.enable', {});
    await sessionCall('Network.emulateNetworkConditions', params, 5000);
  } catch (cause) {
    throw Object.assign(new Error('网络模拟设置失败，已停止页面初始化：' + cause.message, { cause }), {
      code: 'NETWORK_CONDITIONS_APPLY_FAILED',
    });
  }
}

module.exports = { applyNetworkConditions };

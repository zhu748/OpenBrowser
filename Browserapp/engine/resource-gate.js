'use strict';

/**
 * 启动资源闸（Roxy 客户端设置对齐）。
 *
 * RoxyBrowser 4.1.0 客户端默认值（asar dist/main.mjs 设置对象）：
 *   memoryLimit: 95 —— 系统内存使用率超过该百分比，停止打开窗口；
 *   diskLimit:   8  —— 浏览器数据所在磁盘可用空间低于该 GB 数，停止打开窗口。
 * 官方对应文案：「启动失败，内存使用率超出 {memoryLimit}%」「ERR101: 启动失败，磁盘空间不足，请清理磁盘空间」。
 * 阈值存于 automation/local-settings（memoryLimit / diskLimit）；diskLimit 设 0 即关闭磁盘闸。
 *
 * 生效范围：仅 Electron 主进程（process.type === 'browser'）；纯 Node 进程
 * （引擎自测）默认跳过，或用 OPENBROWSER_RESOURCE_GATE=off 显式关闭
 * （真机冒烟脚本在低磁盘环境使用）。
 */

const os = require('os');
const fsp = require('fs/promises');
const {
  clampMemoryLimit,
  clampDiskLimit,
  getLocalSettings,
} = require('../automation/local-settings');

const DISK_BYTES_PER_GB = 1024 ** 3;

function memoryUsagePercent() {
  const total = os.totalmem();
  const free = os.freemem();
  if (!total) return 0;
  return ((total - free) / total) * 100;
}

/** 纯判定：内存使用率超限 / 磁盘可用空间不足（availableGb 传 null 跳过磁盘项）。 */
function evaluateResourceGate({ usedPercent, availableGb, memoryLimit, diskLimit }) {
  if (usedPercent > memoryLimit) {
    return {
      ok: false,
      code: 'memory-limit',
      message: `启动失败，内存使用率超出 ${memoryLimit}%（当前 ${usedPercent.toFixed(1)}%），请关闭部分程序或窗口后重试`,
    };
  }
  if (availableGb !== null && availableGb < diskLimit) {
    return {
      ok: false,
      code: 'disk-limit',
      message: `ERR101: 启动失败，磁盘空间不足，请清理磁盘空间（当前可用 ${availableGb.toFixed(1)}GB，限制 ${diskLimit}GB）`,
    };
  }
  return { ok: true };
}

function gateDisabledByEnvironment() {
  if (process.type !== 'browser') return true;
  const override = String(process.env.OPENBROWSER_RESOURCE_GATE || '').trim().toLowerCase();
  return override === 'off' || override === '0' || override === 'false';
}

/**
 * 启动前资源闸：内存使用率 / 磁盘可用空间任一超限即抛错阻断。
 * statfs 不可用（受限环境）时跳过磁盘项——与 Roxy 检测失败跳过一致。
 */
async function assertResourceGateForLaunch({ diskRoot } = {}) {
  const settings = (() => {
    try { return getLocalSettings() || {}; } catch (_) { return {}; }
  })();
  const memoryLimit = clampMemoryLimit(settings.memoryLimit);
  const diskLimit = clampDiskLimit(settings.diskLimit);
  const usedPercent = memoryUsagePercent();
  if (gateDisabledByEnvironment()) {
    return { skipped: true, usedPercent: Number(usedPercent.toFixed(1)), memoryLimit, diskLimit };
  }
  let availableGb = null;
  const target = String(diskRoot || '').trim() || os.tmpdir();
  try {
    const stats = await fsp.statfs(target);
    availableGb = (stats.bsize * stats.bavail) / DISK_BYTES_PER_GB;
  } catch (_) { /* statfs 不可用：跳过磁盘项 */ }
  const verdict = evaluateResourceGate({
    usedPercent,
    availableGb,
    memoryLimit,
    diskLimit,
  });
  if (!verdict.ok) {
    throw Object.assign(new Error(verdict.message), { code: verdict.code });
  }
  return {
    skipped: false,
    usedPercent: Number(usedPercent.toFixed(1)),
    availableGb: availableGb === null ? null : Number(availableGb.toFixed(1)),
    memoryLimit,
    diskLimit,
  };
}

module.exports = {
  evaluateResourceGate,
  assertResourceGateForLaunch,
  memoryUsagePercent,
};

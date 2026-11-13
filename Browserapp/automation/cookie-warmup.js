'use strict';

const crypto = require('node:crypto');
const { assertProfileId } = require('./isolation');

function range(min, max, fallback, ceiling, label) {
  const a = min == null ? fallback[0] : Number(min);
  const b = max == null ? fallback[1] : Number(max);
  if (![a, b].every(Number.isSafeInteger) || a < 0 || b < a || b > ceiling) throw new Error(label + '范围无效');
  return [a, b];
}

async function startCookieWarmup({ engine, rpaStore, rpaEngine }, payload = {}) {
  const id = assertProfileId(payload.profileId);
  const profile = engine?.profiles?.get(id);
  if (!profile || profile.trashed) throw new Error('请先保存并选择一个有效环境');
  if (engine.profileEngine?.(profile) === 'firefox' || profile.engine === 'firefox') throw new Error('Cookie 机器人需要 Chromium 内核');
  if (!Array.isArray(payload.urls) || payload.urls.length < 1 || payload.urls.length > 100) throw new Error('请填写 1–100 个目标网址');
  const urls = payload.urls.map((raw) => {
    if (typeof raw !== 'string' || raw.length > 4096) throw new Error('目标网址无效');
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('目标网址仅支持 HTTP/HTTPS');
    return url.href;
  });
  const [stayMin, stayMax] = range(payload.stayMin, payload.stayMax, [500, 1500], 120000, '停留时间');
  const [scrollMin, scrollMax] = range(payload.scrollMin, payload.scrollMax, [100, 500], 3000, '滚动距离');
  const options = Object.fromEntries(['headless', 'blockImages', 'blockVideo', 'autoClose'].map((key) => [key, payload[key] === true]));
  if ((options.headless || options.blockImages) && (engine.running?.has(id) || engine.starting?.has(id))) throw new Error('请先停止环境，再启用无头模式或不加载图片');
  const steps = urls.flatMap((url) => [
    { type: 'goto', params: { url } },
    { type: 'wait', params: { timeoutType: 'randomInterval', timeoutMin: stayMin, timeoutMax: stayMax } },
    { type: 'scroll', params: { distance: crypto.randomInt(scrollMin, scrollMax + 1) } },
  ]);
  const task = await rpaStore.createTask({ profile_id: id, process_name: 'Cookie 机器人', steps });
  // This is a real persisted RPA task; normal task status/cancellation applies.
  void rpaEngine.runTask(task.id, { warmup: options, timeout_ms: urls.length * (stayMax + 25000) + 120000 })
    .catch(async (error) => {
      await rpaStore.updateTask(task.id, { status: 'failed', complete_time: new Date().toISOString(),
        process_result: { ok: false, error: error.message } });
    }).catch((error) => console.error('[cookie-warmup] task result persistence failed:', error.message));
  return { success: true, taskId: task.id, profileId: id, status: 'pending' };
}

module.exports = { startCookieWarmup };

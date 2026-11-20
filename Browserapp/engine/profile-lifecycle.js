'use strict';

const kinds = { 'profile-start-progress': 'start', 'profile-stop-progress': 'stop', 'profile-sync-progress': 'sync' };

function recordProfileLifecycle(engine, event) {
  const operation = Object.hasOwn(kinds, event?.type) ? kinds[event.type] : null;
  if (!operation || !event.id) return true;
  const id = String(event.id);
  const generation = Number(event.lifecycleGeneration ?? engine.lifecycleGenerations?.get(id)) || 0;
  if (generation < (Number(engine.lifecycleGenerations?.get(id)) || 0)) return false;
  engine.profileLifecycles ||= new Map();
  let state = engine.profileLifecycles.get(id);
  if (state && generation < state.generation) return false;
  if (!state || generation > state.generation) state = { generation };
  // Late startup events cannot reopen a window already being closed.
  if (operation === 'start' && state.stop && generation > 0
    && (event.phase !== 'error' || event.errorCode === 'BROWSER_START_CANCELLED')) return false;
  const now = Date.now(), previous = state[operation];
  const phase = String(event.phase || 'prepare');
  const error = phase === 'error' || event.error === true;
  const pending = !error && phase !== 'ready' && phase !== 'done';
  if (operation === 'stop' && pending) state.start = null;
  const value = Object.freeze({ operation, generation, phase, pending, error,
    percent: Math.max(0, Math.min(100, Math.round(Number(event.percent) || 0))),
    message: String(event.message || '').slice(0, 2000),
    startedAt: previous?.pending ? previous.startedAt : now, updatedAt: now });
  state[operation] = value;
  state.last = value;
  engine.profileLifecycles.set(id, state);
  return true;
}

function profileLifecycle(engine, id) {
  const state = engine.profileLifecycles?.get(String(id));
  if (!state) return null;
  // Backup can outlive local cleanup, or finish before it. Both must settle.
  for (const kind of ['sync', 'stop', 'start']) if (state[kind]?.pending) return state[kind];
  if (state.last?.error) return state.last;
  for (const kind of ['sync', 'stop', 'start']) if (state[kind]?.error) return state[kind];
  return state.last;
}

function beginProfileStop(engine, id, item) {
  engine.emit({ type: 'profile-stop-progress', id, phase: 'sync', percent: 0,
    message: '正在关闭窗口并同步本地数据…', lifecycleGeneration: item?.lifecycleGeneration });
}

function observeProfileStop(engine, id, task, item) {
  const settled = error => {
    if (engine.stopping.get(id) !== task) return;
    engine.stopping.delete(id);
    engine.emit({ type: 'profile-stop-progress', id, phase: error ? 'error' : 'done',
    percent: error ? 0 : 100, error: Boolean(error), running: Boolean(engine.running?.has(id)),
      message: error ? error.message || String(error) : '窗口关闭与本地数据同步完成',
      lifecycleGeneration: item?.lifecycleGeneration });
  };
  task.then(result => settled(result?.cleanupBlocked || result?.running ?
    Error('窗口关闭尚未确认，请稍后重试') : null), settled).catch(() => {});
}

module.exports = { recordProfileLifecycle, profileLifecycle, beginProfileStop, observeProfileStop };

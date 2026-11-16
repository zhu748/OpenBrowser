'use strict';

// This is only automatic backup of an actually closed, opted-in profile.
// The event remains separate from local cleanup so either can finish first.
function syncClosedProfile(engine, event, { cloud, groups, push, onError }) {
  if (!event.cloudBackup || !event.profile?.id || !cloud?.enabled) return null;
  const id = event.profile.id, lifecycleGeneration = event.lifecycleGeneration;
  const progress = (phase, error) => engine.emit({ type: 'profile-sync-progress', id, phase,
    lifecycleGeneration, percent: phase === 'done' ? 100 : 0, error: Boolean(error),
    message: error ? error.message || String(error) : phase === 'done' ? '关闭数据同步完成' : '正在同步关闭数据…' });
  progress('sync');
  return Promise.resolve().then(() => push({ profileIds: [id], profiles: [event.profile], groups, cloud }))
    .then(result => { progress('done');return { ok: true, result }; }, error => {
      progress('error', error);onError?.(error);return { ok: false, error };
    });
}

module.exports = { syncClosedProfile };

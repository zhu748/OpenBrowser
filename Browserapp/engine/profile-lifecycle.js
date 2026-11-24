'use strict';

const { profileDataHash } = require('./profile-revisions');

const kinds = { 'profile-start-progress': 'start', 'profile-stop-progress': 'stop', 'profile-sync-progress': 'sync' };
const launchWarnings = new Set(['kernel-fallback', 'profile-start-page-warning', 'profile-metadata-error']);
const comparedSnapshots = new WeakMap();

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
    ...(error && ['string', 'number'].includes(typeof event.errorCode) ? { errorCode: event.errorCode } : {}),
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

function recordProfileLaunchWarning(engine, event) {
  const { id, lifecycleGeneration: generation } = event || {};
  if (!launchWarnings.has(event?.type) || !id || !Number.isSafeInteger(generation) || generation < 1) return null;
  const state = engine.profileLifecycles?.get(String(id));
  if (state?.generation !== generation || !state.start || state.start.error || state.stop) return false;
  const message = typeof event.message === 'string' ? event.message.trim().slice(0, 800) : '';
  const warnings = state.launchWarnings || [];
  if (!message || warnings.includes(message) || warnings.length >= 12) return false;
  state.launchWarnings = Object.freeze([...warnings, message]);
  return true;
}

function knownRevision(engine, id) {
  const rev = engine.profiles?.revisionOf?.(id);
  return Number.isSafeInteger(rev) && rev > 0 ? rev : null;
}

function snapshotDigest(profile) {
  // lastOpenedAt is written after launch and is not an edit to the settings.
  return profile ? profileDataHash({ ...profile, lastOpenedAt: null }) : null;
}

// Called immediately after the existing pre-spawn revision guard. This is a
// receipt for the saved input, not proof that its settings were applied.
function captureProfileLaunchRevision(engine, profile) {
  const id = profile.id;
  const revision = knownRevision(engine, id);
  if (!revision) return null;
  try {
    const saved = engine.profiles.get(id);
    if (!saved || (saved !== profile && profileDataHash(saved) !== profileDataHash(profile))) return null;
    const digest = snapshotDigest(saved);
    return digest ? Object.freeze({ revision, digest }) : null;
  } catch (_) { return null; }
}

function profileLaunchStatus(engine, id, item) {
  const snapshot = item.launchProfileSnapshot;
  const savedRevision = knownRevision(engine, id);
  let savedRelation = 'unknown';
  if (snapshot && savedRevision) {
    if (snapshot.revision === savedRevision) savedRelation = 'matches';
    else {
      const saved = engine.profiles.get(id);
      let compared = comparedSnapshots.get(item);
      if (compared?.revision !== savedRevision || compared.saved !== saved) {
        let digest = null;
        try { digest = snapshotDigest(saved); } catch (_) { /* comparison is not evidence */ }
        compared = { revision: savedRevision, saved, digest };
        comparedSnapshots.set(item, compared);
      }
      if (compared.digest) savedRelation = compared.digest === snapshot.digest ? 'matches' : 'differs';
    }
  }
  const state = engine.profileLifecycles?.get(String(id));
  return {
    configurationState: item.verificationBlocked ? 'blocked' : 'unverified',
    capturedRevision: snapshot?.revision ?? null,
    savedRevision,
    savedRelation,
    warningMessages: state && state.generation === item.lifecycleGeneration ? (state.launchWarnings || []) : [],
  };
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

module.exports = { recordProfileLifecycle, profileLifecycle, recordProfileLaunchWarning,
  captureProfileLaunchRevision, profileLaunchStatus, beginProfileStop, observeProfileStop };

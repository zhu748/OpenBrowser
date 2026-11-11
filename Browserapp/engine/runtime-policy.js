'use strict';

const { buildPortScanProtectionScript, normalizePortAllowList } = require('../automation/port-scan-protection');

const ownerStates = new WeakMap();
const registrationIds = new WeakMap();
let nextRegistrationId = 0;
function registrationId(owner) {
  let id = registrationIds.get(owner);
  if (!id) { id = ++nextRegistrationId; registrationIds.set(owner, id); }
  return id;
}

// Runtime policy edits must not rebuild a launch identity or change its launch seed.
function runtimePolicyProfile(launched, saved) {
  if (!saved) return launched;
  return {
    ...launched,
    advanced: { ...launched.advanced,
      blockVideo: saved.advanced?.blockVideo ?? launched.advanced?.blockVideo,
      blockUrls: saved.advanced?.blockUrls ?? launched.advanced?.blockUrls,
      allowUrls: saved.advanced?.allowUrls ?? launched.advanced?.allowUrls,
    },
    privacy: { ...launched.privacy,
      portScanProtect: saved.privacy?.portScanProtect ?? launched.privacy?.portScanProtect,
      portScanAllow: saved.privacy?.portScanAllow ?? launched.privacy?.portScanAllow,
    },
  };
}

function blockedUrls(profile) {
  // Website lists have one parser/owner in the request-stage Fetch handler.
  // Sending the same text as CDP URL globs gave paths and ports two meanings.
  return profile.advanced?.blockVideo ? ['*.mp4', '*.webm', '*.m3u8', '*.mov', '*.avi'] : [];
}

function statesFor(owner) {
  let states = ownerStates.get(owner);
  if (!states) { states = new Map(); ownerStates.set(owner, states); }
  return states;
}

async function applyTargetRuntimePolicy({ owner, targetId, invoke, profile, targetType = 'page', waiting = false,
  registrationOwner = owner, registrationScope = '' }) {
  const states = statesFor(owner);
  const ownerId = registrationId(registrationOwner);
  const key = JSON.stringify([targetId, ownerId, registrationScope]);
  let state = states.get(key);
  if (!state) {
    state = { targetId, targetType, ownerId, registrationScope, identifier: null, evaluated: false, closed: false };
    states.set(key, state);
  }
  const command = async (method, params) => {
    if (state.closed) throw new Error('Runtime policy session was closed');
    return invoke(method, params);
  };
  const previous = state.pending || Promise.resolve();
  const task = previous.catch(() => {}).then(async () => {
    if (state.closed) throw new Error('Runtime policy session was closed');
    const urls = blockedUrls(profile);
    const blockKey = JSON.stringify(urls);
    if (state.blockKey !== blockKey) {
      if (urls.length || state.blockKey && state.blockKey !== '[]') {
        await command('Network.enable', {});
        await command('Network.setBlockedURLs', { urls });
      }
      state.blockKey = blockKey;
    }
    const enabled = profile.privacy?.portScanProtect === true;
    const allow = enabled ? normalizePortAllowList(profile.privacy?.portScanAllow) : [];
    const portKey = JSON.stringify([enabled, allow]);
    const changed = state.portKey !== portKey;
    const worker = /worker$/.test(targetType);
    if (changed && !worker) {
      // Once removal starts, the old configuration is no longer a verified
      // registration. A failed replacement must not make an old-config retry
      // skip reinstallation.
      state.portKey = undefined;
      if (state.identifier) {
        try { await command('Page.removeScriptToEvaluateOnNewDocument', { identifier: state.identifier }); }
        catch (error) { if (!/script not found/i.test(String(error?.message || error))) throw error; }
        state.identifier = null;
      }
      if (enabled) {
        await command('Page.enable', {});
        const added = await command('Page.addScriptToEvaluateOnNewDocument', { source: buildPortScanProtectionScript(allow) });
        state.identifier = added?.identifier || added?.result?.identifier;
        if (!state.identifier) throw new Error('Port protection registration returned no identifier');
      }
    }
    if (!waiting && (changed || !state.evaluated) && (enabled || state.enabled)) {
      const result = await command('Runtime.evaluate', { expression: buildPortScanProtectionScript(allow, { enabled }) });
      const exception = result?.exceptionDetails || result?.result?.exceptionDetails;
      if (exception) throw new Error(exception.exception?.description || exception.text || 'Port protection execution failed');
    }
    if (state.closed) throw new Error('Runtime policy session was closed');
    state.portKey = portKey;
    state.enabled = enabled;
    state.evaluated = !waiting;
  });
  state.pending = task;
  try { await task; }
  finally { if (state.pending === task) state.pending = null; }
}

function forgetTargetRuntimePolicy(owner, targetId, registrationOwner, registrationScope) {
  const states = ownerStates.get(owner);
  if (!states) return;
  for (const [key, state] of states) {
    if (state.targetId !== targetId || (registrationOwner && state.ownerId !== registrationId(registrationOwner))
      || (registrationScope !== undefined && state.registrationScope !== registrationScope)) continue;
    state.closed = true;
    states.delete(key);
  }
}

function pruneRuntimePolicyPages(owner, ids) {
  const states = ownerStates.get(owner);
  if (states) for (const [id, state] of states) {
    if (state.targetType === 'page' && !ids.has(state.targetId)) { state.closed = true; states.delete(id); }
  }
}

module.exports = { runtimePolicyProfile, applyTargetRuntimePolicy, forgetTargetRuntimePolicy, pruneRuntimePolicyPages };

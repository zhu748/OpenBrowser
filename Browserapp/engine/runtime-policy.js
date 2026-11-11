'use strict';

const { buildPortScanProtectionScript, normalizePortAllowList } = require('../automation/port-scan-protection');

const ownerStates = new WeakMap();

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

async function applyTargetRuntimePolicy({ owner, targetId, invoke, profile, targetType = 'page', waiting = false }) {
  const states = statesFor(owner);
  let state = states.get(targetId);
  if (!state) {
    state = { targetType, identifier: null, evaluated: false };
    states.set(targetId, state);
  }
  // Flat sessions and page sockets can reach the same target at once.
  const previous = state.pending || Promise.resolve();
  const task = previous.catch(() => {}).then(async () => {
    const urls = blockedUrls(profile);
    const blockKey = JSON.stringify(urls);
    if (state.blockKey !== blockKey) {
      if (urls.length || state.blockKey && state.blockKey !== '[]') {
        await invoke('Network.enable', {});
        await invoke('Network.setBlockedURLs', { urls });
      }
      state.blockKey = blockKey;
    }
    const enabled = profile.privacy?.portScanProtect === true;
    const allow = enabled ? normalizePortAllowList(profile.privacy?.portScanAllow) : [];
    const portKey = JSON.stringify([enabled, allow]);
    const changed = state.portKey !== portKey;
    const worker = /worker$/.test(targetType);
    if (changed && !worker) {
      if (state.identifier) {
        await invoke('Page.removeScriptToEvaluateOnNewDocument', { identifier: state.identifier });
        state.identifier = null;
      }
      if (enabled) {
        await invoke('Page.enable', {});
        const added = await invoke('Page.addScriptToEvaluateOnNewDocument', { source: buildPortScanProtectionScript(allow) });
        state.identifier = added?.identifier || added?.result?.identifier;
        if (!state.identifier) throw new Error('Port protection registration returned no identifier');
      }
    }
    if (!waiting && (changed || !state.evaluated) && (enabled || state.enabled)) {
      const result = await invoke('Runtime.evaluate', { expression: buildPortScanProtectionScript(allow, { enabled }) });
      const exception = result?.exceptionDetails || result?.result?.exceptionDetails;
      if (exception) throw new Error(exception.exception?.description || exception.text || 'Port protection execution failed');
    }
    state.portKey = portKey;
    state.enabled = enabled;
    state.evaluated = !waiting;
  });
  state.pending = task;
  try { await task; }
  finally { if (state.pending === task) state.pending = null; }
}

function forgetTargetRuntimePolicy(owner, targetId) {
  ownerStates.get(owner)?.delete(targetId);
}

function pruneRuntimePolicyPages(owner, ids) {
  const states = ownerStates.get(owner);
  if (states) for (const [id, state] of states) {
    if (state.targetType === 'page' && !ids.has(id)) states.delete(id);
  }
}

module.exports = { runtimePolicyProfile, applyTargetRuntimePolicy, forgetTargetRuntimePolicy, pruneRuntimePolicyPages };

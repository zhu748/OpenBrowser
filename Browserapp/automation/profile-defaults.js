'use strict';

const DEFAULT_PREFERENCES = Object.freeze({ openWorkbench: true, ipChangeRemind: true, googleLogin: false });

function normalizeDefaultPreferences(value = {}, previous = DEFAULT_PREFERENCES) {
  return Object.fromEntries(Object.keys(DEFAULT_PREFERENCES).map((key) => [key,
    typeof value?.[key] === 'boolean' ? value[key] : previous?.[key] ?? DEFAULT_PREFERENCES[key]]));
}

function preference(profile, key, defaults) {
  const value = String(profile.advanced?.[key] ?? '2');
  if (value === '0' || value === '1') return value === '1';
  const global = defaults || require('./local-settings').getLocalSettings().defaultPreferences || DEFAULT_PREFERENCES;
  return global[key] ?? DEFAULT_PREFERENCES[key];
}

function openWorkbench(profile) { return profile.advanced?.showInfoPage !== false && preference(profile, 'openWorkbench'); }
function allowGoogleLogin(profile) {
  if (profile.advanced?.googleLogin == null && profile.advanced?.allowSignin != null) return profile.advanced.allowSignin === true;
  return preference(profile, 'googleLogin');
}
function ipChangePolicy(profile) {
  const policy = profile.advanced?.ipChangePolicy || 'patch';
  return policy === 'patch' && preference(profile, 'ipChangeRemind') ? 'notify' : policy;
}

module.exports = { DEFAULT_PREFERENCES, normalizeDefaultPreferences, preference, openWorkbench, allowGoogleLogin, ipChangePolicy };

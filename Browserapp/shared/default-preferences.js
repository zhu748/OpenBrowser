'use strict';

// Pure preference schema; storage must not depend on profile runtime policy.
const DEFAULT_PREFERENCES = Object.freeze({ openWorkbench: true, ipChangeRemind: true, googleLogin: false });

function normalizeDefaultPreferences(value = {}, previous = DEFAULT_PREFERENCES) {
  return Object.fromEntries(Object.keys(DEFAULT_PREFERENCES).map((key) => [key,
    typeof value?.[key] === 'boolean' ? value[key] : previous?.[key] ?? DEFAULT_PREFERENCES[key]]));
}

module.exports = { DEFAULT_PREFERENCES, normalizeDefaultPreferences };

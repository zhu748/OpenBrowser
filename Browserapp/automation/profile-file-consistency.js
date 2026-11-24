'use strict';

/**
 * Keep managed native preferences aligned across the file layer.
 *
 * The browser owns several preference groups and rewrites them asynchronously
 * (for example spellcheck dictionaries). Write only the app's explicit
 * settings so unrelated browser preferences survive profile preparation.
 */

const fsp = require('fs/promises');
const path = require('path');
const { writeRawAtomically } = require('../engine/state-storage');
const { resolvePersonaLanguages } = require('./fingerprint/persona-locale');
const { resolveDoNotTrackMode } = require('../shared/profile-values');

const MANAGED_PREFERENCE_KEYS = Object.freeze([
  'intl.accept_languages',
  'intl.selected_languages',
]);

const MANAGED_LOCAL_STATE_KEYS = Object.freeze([
  'intl.app_locale',
]);

// These groups are intentionally left to the browser. Writing guessed values for
// them creates a difference between the file and the native preference layer.
const NATIVE_MANAGED_PREFERENCE_KEYS = Object.freeze([
  'spellcheck.dictionaries',
  'safebrowsing.enabled',
  'safebrowsing.enhanced',
  'safebrowsing.scout_reporting_enabled',
  'safebrowsing.metrics_reporting_enabled',
  'autofill.profile_enabled',
  'autofill.credit_card_enabled',
  'autofill.address_autofill_enabled',
  'translate.enabled',
  'download.default_directory',
]);

function languagePreferenceChain(language) {
  return resolvePersonaLanguages({ language }).join(',');
}

function primaryProfileLocale(language) {
  return resolvePersonaLanguages({ language })[0];
}

function expectedLanguagePreferences(profile = {}) {
  const acceptLanguages = resolvePersonaLanguages(profile).join(',');
  return {
    intl: {
      accept_languages: acceptLanguages,
      selected_languages: acceptLanguages,
    },
  };
}

function expectedLocalState(profile = {}) {
  const [appLocale] = resolvePersonaLanguages(profile);
  return {
    intl: {
      app_locale: appLocale,
    },
  };
}

function applyLanguagePreferences(prefs, profile = {}) {
  const expected = expectedLanguagePreferences(profile);
  prefs.intl ||= {};
  prefs.intl.accept_languages = expected.intl.accept_languages;
  prefs.intl.selected_languages = expected.intl.selected_languages;
  return expected;
}

function applyDoNotTrackPreference(prefs, profile = {}) {
  const mode = resolveDoNotTrackMode(profile.privacy);
  if (mode === 'default') {
    delete prefs.enable_do_not_track;
    return undefined;
  }
  const enabled = mode === 'on';
  prefs.enable_do_not_track = enabled;
  return enabled;
}

function applyLocalStateLanguage(state, profile = {}) {
  const expected = expectedLocalState(profile);
  state.intl ||= {};
  state.intl.app_locale = expected.intl.app_locale;
  return expected;
}

function verifyLanguagePreferences(prefs, profile = {}) {
  const expected = expectedLanguagePreferences(profile);
  const issues = [];
  for (const key of MANAGED_PREFERENCE_KEYS) {
    const [, leaf] = key.split('.');
    const actual = prefs?.intl?.[leaf];
    const wanted = expected.intl[leaf];
    if (actual !== wanted) issues.push({ key, expected: wanted, actual: actual ?? null });
  }
  return issues;
}

function verifyLocalStateLanguage(state, profile = {}) {
  const expected = expectedLocalState(profile);
  const issues = [];
  for (const key of MANAGED_LOCAL_STATE_KEYS) {
    const [, leaf] = key.split('.');
    const actual = state?.intl?.[leaf];
    const wanted = expected.intl[leaf];
    if (actual !== wanted) issues.push({ key, expected: wanted, actual: actual ?? null });
  }
  return issues;
}

async function readPreferences(file) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    if (error instanceof SyntaxError || error?.name === 'SyntaxError') {
      try {
        const backup = file + '.corrupted.' + Date.now();
        await fsp.rename(file, backup);
      } catch (_) {}
      return {};
    }
    throw error;
  }
}

async function syncProfileLanguagePreferences(root, profile = {}) {
  const file = path.join(root, 'Default', 'Preferences');
  const prefs = await readPreferences(file);
  const expected = applyLanguagePreferences(prefs, profile);
  await writeRawAtomically(file, JSON.stringify(prefs), 0o600);
  const persisted = await readPreferences(file);
  const issues = verifyLanguagePreferences(persisted, profile);
  if (issues.length) {
    const error = new Error('Profile language preference readback mismatch');
    error.code = 'PROFILE_LANGUAGE_MISMATCH';
    error.issues = issues;
    throw error;
  }
  return { file, expected, issues };
}

async function syncProfileLocalState(root, profile = {}) {
  const file = path.join(root, 'Local State');
  const state = await readPreferences(file);
  const expected = applyLocalStateLanguage(state, profile);
  await writeRawAtomically(file, JSON.stringify(state), 0o600);
  const persisted = await readPreferences(file);
  const issues = verifyLocalStateLanguage(persisted, profile);
  if (issues.length) {
    const error = new Error('Profile local state readback mismatch');
    error.code = 'PROFILE_LOCAL_STATE_MISMATCH';
    error.issues = issues;
    throw error;
  }
  return { file, expected, issues };
}

module.exports = {
  NATIVE_MANAGED_PREFERENCE_KEYS,
  languagePreferenceChain,
  primaryProfileLocale,
  expectedLocalState,
  applyLanguagePreferences,
  applyDoNotTrackPreference,
  verifyLanguagePreferences,
  verifyLocalStateLanguage,
  syncProfileLanguagePreferences,
  syncProfileLocalState,
  readPreferences,
};

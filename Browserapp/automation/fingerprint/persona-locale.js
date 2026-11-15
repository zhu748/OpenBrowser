'use strict';

// Resolve one language chain for navigator, locale emulation and request headers.
function resolvePersonaLanguages(profile, privacy, fpIn) {
  // Prefer already-resolved profile.language (engine sets JP→ja-JP when languageMode=ip)
  let languagePrimary = String(profile.language || 'en-US').trim() || 'en-US';
  try {
    const { resolveProfileLanguage } = require('../locale-from-country');
    languagePrimary = resolveProfileLanguage(profile, {
      countryCode: profile.exitCountryCode,
    }) || languagePrimary;
  } catch (_) { /* Keep the declared language when country resolution is unavailable. */ }
  // Single languages chain: privacy.languages first, then privacy.fingerprint.languages, then
  // profile.languages, then the locale-derived default. navigator.languages, Emulation locale and
  // Accept-Language all read this one resolution, so the three surfaces cannot disagree. (The UI
  // has a single language intent: editor-language-mode + editor-language fallback; neither
  // privacy.languages nor privacy.fingerprint.languages has a UI entry.)
  const candidateLangs = (Array.isArray(privacy.languages) && privacy.languages.length)
    ? privacy.languages
    : (Array.isArray(fpIn.languages) && fpIn.languages.length)
      ? fpIn.languages
      : (Array.isArray(profile.languages) && profile.languages.length)
        ? profile.languages
        : null;
  let languages = candidateLangs
    ? candidateLangs.map((s) => String(s || '').trim()).filter(Boolean)
    : String(languagePrimary).split(',').map((s) => s.trim()).filter(Boolean);
  if (!languages.length) languages.push('en-US');
  if (languages.length === 1 && languages[0].includes('-')) {
    const base = languages[0].split('-')[0];
    if (!languages.includes(base)) languages.push(base);
  } else if (languages.length === 1 && languages[0].toLowerCase() === 'en') {
    if (!languages.includes('en-US')) languages.push('en-US');
  }

  return languages;
}

module.exports = { resolvePersonaLanguages };

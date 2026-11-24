'use strict';

const { normalizeLanguageTags, resolveProfileLanguage } = require('../locale-from-country');

// Resolve one language chain for navigator, locale emulation and request headers.
function resolvePersonaLanguages(profile) {
  const privacy = profile.privacy || {};
  const fpIn = privacy.fingerprint && typeof privacy.fingerprint === 'object' ? privacy.fingerprint : profile.fingerprint;
  let languages;
  for (const candidate of [privacy.languages, fpIn?.languages, profile.languages, resolveProfileLanguage(profile)]) {
    languages = normalizeLanguageTags(candidate);
    if (languages.length) break;
  }
  if (!languages.length) return ['en-US', 'en'];

  if (languages.length === 1) {
    const [primary] = languages;
    const [base] = primary.split('-');
    if (base !== primary) languages.push(base);
    else if (primary === 'en') languages.push('en-US');
  }
  return languages;
}

module.exports = { resolvePersonaLanguages };

'use strict';

// Retire only the app's old generated patch-number format. Explicit user UA
// values and overrides remain user-owned; seeds and fingerprint versions stay.
function normalizeGeneratedFirefoxUa(profile) {
  const fp = profile.privacy?.fingerprint;
  if (profile.engine !== 'firefox' || fp?.uaGenerated !== true || fp.userAgent
    || !fp.uaPatchRandomized && !fp.uaReduced) return profile;
  const ua = profile.userAgent || '';
  const major = ua.match(/Firefox\/(\d+)(?:\.\d+){0,2}(?![\d.])/i)?.[1];
  if (!major || /Chrome\//i.test(ua)) return profile;
  return { ...profile,
    userAgent: ua.replace(/Firefox\/\d+(?:\.\d+){0,2}/i, 'Firefox/' + major + '.0')
      .replace(/\brv:\d+(?:\.\d+)*/i, 'rv:' + major + '.0'),
    privacy: { ...profile.privacy, fingerprint: { ...fp, uaReduced: false, uaPatchRandomized: false } },
  };
}

module.exports = { normalizeGeneratedFirefoxUa };

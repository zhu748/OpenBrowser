(() => {
  'use strict';

  function removeProfilesById(profiles, ids) {
    const selected = ids instanceof Set ? ids : new Set(ids);
    return profiles.filter((profile) => !selected.has(profile.id));
  }

  /** Apply flags in one pass, keeping profile references used by open editors. */
  function setProfilesTrashed(profiles, ids, trashed, at = new Date().toISOString()) {
    const selected = ids instanceof Set ? ids : new Set(ids);
    for (const profile of profiles) {
      if (!selected.has(profile.id)) continue;
      if (trashed) { profile.trashed = true; profile.trashedAt = at; }
      else { delete profile.trashed; delete profile.trashedAt; }
    }
    return profiles;
  }

  const api = { removeProfilesById, setProfilesTrashed };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserProfileBatch = api;
})();

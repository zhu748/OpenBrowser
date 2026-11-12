'use strict';

const { assertProfileNotMaintained } = require('./profile-maintenance');
const { profileDataHash } = require('./profile-revisions');

// Capture before asynchronous work. Never publish a result over an edit,
// deletion, restore or delete/recreate, even when the row was mutated in place.
function profileWriteGuard(engine, id) {
  assertProfileNotMaintained(engine, id);
  const previous = engine.profiles.get(id);
  const hash = profileDataHash(previous);
  const revision = engine.profiles.revisionOf?.(id);
  return () => {
    assertProfileNotMaintained(engine, id);
    const current = engine.profiles.get(id);
    const unchanged = revision === undefined ? current === previous : engine.profiles.revisionOf(id) === revision;
    if (!unchanged || profileDataHash(current) !== hash) {
      throw Object.assign(new Error(`环境配置在操作期间已改变，请按最新配置重试：${id}`), {
        code: 'PROFILE_STALE_REV', profileId: id,
      });
    }
  };
}

module.exports = { profileWriteGuard };

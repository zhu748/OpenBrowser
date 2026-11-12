'use strict';

const { assertProfileId } = require('../automation/isolation');

function assertProfileNotMaintained(engine, id, token) {
  const owner = engine.profileMaintenance?.get(id);
  if (owner && owner !== token) throw Object.assign(new Error(`环境 ${id} 正在恢复或维护，请稍后重试`), {
    code: 'PROFILE_MAINTENANCE', profileId: id,
  });
}

// Check and reserve the entire set synchronously, before any filesystem await.
// start/delete/cache clear share this guard; releasing an older lease cannot
// remove a later owner's reservation.
function acquireProfileMaintenance(engine, ids) {
  const selected = [...new Set(ids.map(assertProfileId))];
  if (!engine) return { token: undefined, release() {} };
  for (const id of selected) {
    assertProfileNotMaintained(engine, id);
    if (engine.running?.has(id) || engine.starting?.has(id) || engine.stopping?.has(id) || engine.deletingProfiles?.has(id)) {
      throw Object.assign(new Error('请先停止环境，再备份、恢复或维护浏览器数据：' + id), { code: 'PROFILE_BUSY', profileId: id });
    }
  }
  const token = Symbol('profile-maintenance');
  engine.profileMaintenance ||= new Map();
  for (const id of selected) engine.profileMaintenance.set(id, token);
  return { token, release() {
    for (const id of selected) if (engine.profileMaintenance.get(id) === token) engine.profileMaintenance.delete(id);
  } };
}

module.exports = { assertProfileNotMaintained, acquireProfileMaintenance };

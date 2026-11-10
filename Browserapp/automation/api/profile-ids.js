'use strict';

const { firstArray, firstDefined } = require('./input');

function parseProfileIds(input) {
  const { assertProfileId } = require('../isolation');
  let ids = firstArray(input, ['profile_ids', 'profileIds', 'ids', 'user_ids', 'userIds']);
  if (!ids && input.handles) ids = String(input.handles).split(',').map((s) => s.trim()).filter(Boolean);
  else if (!ids) {
    const id = firstDefined(input, ['user_id', 'userId', 'profile_id', 'profileId']);
    ids = id !== undefined && id !== null && id !== '' ? [id] : [];
  }
  if (ids.length > 200) throw new Error('Invalid profile selection');
  return [...new Set(ids.map((id) => assertProfileId(String(id))))];
}

module.exports = { parseProfileIds };

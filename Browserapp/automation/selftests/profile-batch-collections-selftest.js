'use strict';

const assert = require('node:assert/strict');
const { removeProfilesById, setProfilesTrashed } = require('../../ui/ui-profile-batch');

const rows = [{ id: 'a' }, { id: 'b', note: 'keep' }, { id: 'c' }];
const original = rows.slice();
assert.deepEqual(removeProfilesById(rows, ['b', 'b', 'missing']), [rows[0], rows[2]]);
assert.deepEqual(rows, original, 'removal does not mutate the source array');
assert.equal(setProfilesTrashed(rows, ['b', 'c'], true, 'now'), rows);
assert.equal(rows[1], original[1], 'flag updates preserve record identity');
assert.equal(rows[0].trashed, undefined);
assert.equal(rows[1].trashedAt, 'now');
assert.equal(rows[2].trashedAt, 'now');
setProfilesTrashed(rows, new Set(['b', 'missing']), false);
assert.equal(Object.hasOwn(rows[1], 'trashed'), false);
assert.equal(Object.hasOwn(rows[1], 'trashedAt'), false);
assert.equal(rows[1].note, 'keep');
assert.equal(rows[2].trashed, true);

let reads = 0;
const fleet = Array.from({ length: 10000 }, (_, index) => ({ get id() { reads += 1; return index; } }));
const ids = Array.from({ length: 5000 }, (_, index) => index * 2);
assert.equal(removeProfilesById(fleet, ids).length, 5000);
assert.equal(reads, fleet.length, 'batch removal visits each profile once');
reads = 0;
setProfilesTrashed(fleet, ids, true, 'time');
assert.equal(reads, fleet.length, 'batch flag update visits each profile once');
assert.ok(fleet.every((profile, index) => Boolean(profile.trashed) === (index % 2 === 0)));
console.log('PROFILE_BATCH_COLLECTIONS_SELFTEST OK (membership, order, identity, trash/restore, linear scans)');

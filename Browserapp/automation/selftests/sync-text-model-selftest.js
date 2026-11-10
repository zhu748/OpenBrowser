'use strict';

const assert = require('node:assert/strict');
const { specifiedTextItems, distributeSpecifiedTexts, orderedSessionIds } = require('../../ui/ui-sync-text');

assert.deepEqual(specifiedTextItems(' a \r\n\n b\n '), ['a', 'b']);
assert.deepEqual(distributeSpecifiedTexts(['a', 'b', 'c'], 5, 'sequence', 2), {
  texts: ['c', 'a', 'b', 'c', 'a'], nextCursor: 1,
});
assert.deepEqual(distributeSpecifiedTexts(['a', 'b'], 2, 'sequence', -1).texts, ['b', 'a']);
assert.deepEqual(distributeSpecifiedTexts([], 3, 'sequence', 7), { texts: [], nextCursor: 7 });
assert.deepEqual(distributeSpecifiedTexts(['a', 'b'], 3, 'random', 4, () => 1), { texts: ['b', 'b', 'b'], nextCursor: 4 });
const sessions = [{ id: 'b', profile: { number: 10 } }, { id: 'a', profile: { number: 2 } }, { id: 'c', profile: { number: 2 } }];
const ids = ['b', 'c', 'a', 'missing'];
const display = (profile) => profile.number ?? profile.id;
assert.deepEqual(orderedSessionIds(ids, sessions, display), ['a', 'c', 'b', 'missing']);
assert.deepEqual(ids, ['b', 'c', 'a', 'missing'], 'selection order is not mutated');
assert.deepEqual(orderedSessionIds([], sessions, display), []);

let reads = 0, labels = 0;
const fleet = Array.from({ length: 1000 }, (_, number) => ({ get id() { reads += 1; return String(number); }, profile: { number } }));
const selected = Array.from({ length: 1000 }, (_, index) => String(999 - index));
const sorted = orderedSessionIds(selected, fleet, (profile) => { labels += 1; return profile.number; });
assert.deepEqual(sorted, selected.slice().reverse());
assert.equal(labels, selected.length, 'labels are resolved once per selected session');
assert.equal(reads, fleet.length, 'session lookup uses a single index build');
console.log('SYNC_TEXT_MODEL_SELFTEST OK (distribution, cursors, random, numeric order, tie breaks, linear lookup)');

'use strict';

// Structural allocation comparison; no browser, user data or wall-clock score.
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { mergeExitState } = require('../ui/ui-profile-state');

function benchmark({ baseline = '9ae738a', count = 10000 } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 100000) throw new Error('Profile count must be 1..100000');
  const source = execFileSync('git', ['show', `${baseline}:Browserapp/renderer.js`], {
    cwd: path.join(__dirname, '..', '..'), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
  });
  const start = source.indexOf('function mergeEngineExitState(');
  const end = source.indexOf('\nfunction loadUi(', start);
  if (start < 0 || end <= start) throw new Error('Baseline does not contain the legacy polling function');
  const profiles = Array.from({ length: count }, (_, id) => ({ id: String(id), proxy: 'Direct',
    exitIp: '192.0.2.1', exitLatitude: 30, exitLongitude: 120 }));
  const initial = profiles.slice();
  const previous = { ui: { profiles: initial }, proxyHasCredentials: () => false,
    proxyLibraryItem: () => null, scheduleEngineExitStateSave: () => {} };
  vm.runInNewContext(source.slice(start, end), previous);
  previous.mergeEngineExitState(profiles);
  const current = mergeExitState({ profiles, engineProfiles: profiles, hasCredentials: () => false });
  const oldReplacements = previous.ui.profiles.filter((profile, i) => profile !== profiles[i]).length;
  const newReplacements = current.profiles.filter((profile, i) => profile !== profiles[i]).length;
  assert.equal(oldReplacements, count);
  assert.equal(newReplacements, 0);
  assert.strictEqual(current.profiles, profiles);
  return { baseline, profiles: count, oldReplacements, newReplacements,
    oldArrayRetained: previous.ui.profiles === initial, newArrayRetained: current.profiles === profiles };
}

if (require.main === module) {
  process.stdout.write(JSON.stringify(benchmark({ baseline: process.argv[2] || '9ae738a', count: Number(process.argv[3] || 10000) }), null, 2) + '\n');
}
module.exports = { benchmark };

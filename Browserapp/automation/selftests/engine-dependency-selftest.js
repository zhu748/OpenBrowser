'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// An isolated process prevents require caches from hiding a dependency failure.
for (const name of ['start', 'start-firefox', 'start-page', 'profile-proxy']) {
  const file = path.resolve(__dirname, '../../engine', name + '.js');
  const child = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const Module = require('node:module');
    const load = Module._load;
    const file = process.argv[1];
    const failure = Object.assign(Error('dependency fixture'), { code: 'DEPENDENCY_FIXTURE' });
    Module._load = function (request, parent, ...args) {
      if (parent?.filename === file && request === '../proxy-forwarder') throw failure;
      return load.call(this, request, parent, ...args);
    };
    assert.throws(() => require(file), error => error === failure);
  `, file], { encoding: 'utf8', timeout: 10000 });
  assert.equal(child.status, 0, child.stderr);
}
console.log('PASS engine dependencies: preserve original load errors in four startup modules');

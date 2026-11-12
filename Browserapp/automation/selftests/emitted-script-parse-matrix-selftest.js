#!/usr/bin/env node
'use strict';

// Exercise actual input fields, then verify their resolved values before parsing
// both emitted realms. A parse count alone can hide ignored test arguments.
const assert = require('node:assert/strict');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript } = require('../fingerprint');

const oses = ['windows', 'macos', 'macos_arm', 'linux', 'android', 'ios'];
const seeds = new Set();
const configs = new Set();
let count = 0;
for (const version of [1, 2]) {
  for (const os of oses) {
    for (const webrtc of ['real', 'proxy', 'disabled']) {
      for (const fontListMode of ['real', 'noise']) {
        for (const deviceProfile of ['default', 'persona']) {
          const id = `parse-v${version}-${os}-${webrtc}-${fontListMode}-${deviceProfile}`;
          const fp = buildFingerprint({
            id, name: id, os, fingerprintSeed: `seed-${id}`, fingerprintVersion: version,
            privacy: { webrtc, fontListMode, deviceProfile, fingerprint: { webrtcAddress: '203.0.113.7' } },
          });
          assert.equal(fp.webrtc, webrtc, id);
          assert.equal(Boolean(fp.fonts), fontListMode === 'noise', id);
          assert.equal(fp.mobile, os === 'android' || os === 'ios', id);
          assert.ok(fp.consistency.ok, id);
          seeds.add(fp.seed);
          configs.add(JSON.stringify(fp.staticConfig));
          new Function(buildInjectionScript(fp, { bridgeToken: `bt-${id}` }));
          new Function(buildWorkerInjectionScript(fp));
          count++;
        }
      }
    }
  }
}
assert.equal(seeds.size, count, 'each case must exercise its own seeded identity');
assert.equal(configs.size, count, 'matrix inputs must produce distinct static configurations');
// Modes with different fragment behavior, independent of WebRTC's valid modes.
for (const mode of ['real', 'noise', 'blocked']) {
  const fp = buildFingerprint({ id: `parse-graphics-${mode}`, fingerprintVersion: 2,
    privacy: { canvas: mode, webgl: mode, audio: mode === 'blocked' ? 'muted' : mode } });
  assert.equal(fp.canvas.mode, mode);
  assert.equal(fp.webgl.mode, mode);
  new Function(buildInjectionScript(fp));
  new Function(buildWorkerInjectionScript(fp));
  count++;
}
console.log(`emitted-script-parse-matrix: OK (document=${count} worker=${count}, 144 distinct identities)`);

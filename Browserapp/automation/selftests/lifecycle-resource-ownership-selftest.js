'use strict';

// Exercise the real cleanup mixin with OS mutations replaced by recording
// doubles. A late callback must never discover/kill a replacement's helpers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const path = require('node:path');
const os = require('node:os');
const { BrowserEngine } = require('../../engine');
const { acquireProfileLock, releaseProfileLock, lockPath, isProfileLockOwner } = require('../isolation');

function fixture() {
  const filename = require.resolve('../../engine/lifecycle-cleanup');
  const realRequire = createRequire(filename), isolated = { exports: {} }, calls = [];
  const lock = { pid: process.pid, token: 'owner', profileRoot: '/profile' };
  const isolation = {
    isPidAlive: () => false, lockPath: () => '/profile/lock',
    isProfileLockOwner: (_root, owner) => owner?.token === lock.token,
    releaseProfileLock: async (_root, owner) => { calls.push('release'); return owner?.token === lock.token; },
    scanProcessesUsingProfile: () => { calls.push('scan'); return { known: false, pids: [] }; },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module: isolated, process, console, setTimeout, clearTimeout,
    require: (name) => {
      if (name === '../automation/isolation') return isolation;
      if (name === './index') return {
        isChildExited: (child) => !child || child.exitCode != null,
        managedBrowserKillOptions: () => ({}),
        removeSingletonFiles: async () => { calls.push('singleton'); },
        stopIpcStubForWindow: async () => { calls.push('ipc'); },
      };
      if (name === './startup-session') return { saveDeferredSession: async () => { calls.push('session'); } };
      if (name === './fingerprint-transport') return { closePageFingerprintConnections: () => {} };
      if (name === 'fs') return { existsSync: () => true };
      return realRequire(name);
    },
  }, { filename });
  const engine = Object.assign({}, isolated.exports, {
    profiles: new Map(), running: new Map(), starting: new Map(), stopping: new Map(), lifecycleGenerations: new Map(),
    clearRunningWatch() {}, resetFingerprintVerificationFailures() { calls.push('reset-verification'); }, emit() {},
    markProfileCleanExit: async () => { calls.push('clean'); },
    drainProfileHelpers: async () => { calls.push('drain'); return { known: true, pids: [] }; },
  });
  const item = { root: '/profile', profileLock: { ...lock }, lifecycleGeneration: 1,
    child: { exitCode: 0 }, proxyForwarder: { close: async () => { calls.push('proxy'); } } };
  engine.running.set('env', item);
  return { engine, item, lock, calls };
}

(async () => {
  let checks = 0;
  {
    const { engine, item, calls } = fixture();
    await engine.cleanupRunningItem('env', item);
    const previous = [...calls];
    await engine.handleBrowserGone('env', item, 'late-exit');
    assert.deepEqual(calls, previous, 'a cleaned item must never acquire or clean resources again');
    checks++;
  }
  for (const replacement of ['running', 'starting', 'during-wait', 'foreign-lock']) {
    const { engine, item, lock, calls } = fixture();
    const replace = () => {
      lock.token = 'replacement';
      if (replacement !== 'foreign-lock') engine.lifecycleGenerations.set('env', 2);
      if (replacement === 'starting') engine.starting.set('env', { lifecycleGeneration: 2 });
      if (replacement === 'running' || replacement === 'during-wait') engine.running.set('env', { lifecycleGeneration: 2, root: item.root });
    };
    if (replacement === 'during-wait') engine.waitForChildExit = async () => { replace(); return true; };
    else replace();
    if (replacement === 'running' || replacement === 'starting') {
      await engine.handleBrowserGone('env', item, 'late-exit', { waitForExit: true });
    } else {
      await engine.cleanupRunningItem('env', item, { waitForExit: true, ignoreForeignLock: true, markCleanExit: false });
    }
    assert.equal(calls.includes('proxy'), true, 'old private proxy still closes');
    for (const operation of ['drain', 'scan', 'singleton', 'ipc', 'release', 'clean', ...(replacement === 'foreign-lock' || replacement === 'during-wait' ? [] : ['reset-verification'])]) {
      assert.equal(calls.includes(operation), false, `${replacement}: old callback must not ${operation} shared resources`);
    }
    checks++;
  }
  {
    const { engine, item, calls } = fixture();
    engine.drainProfileHelpers = async () => { calls.push('drain'); return { known: false, pids: [] }; };
    await assert.rejects(engine.cleanupRunningItem('env', item), { code: 'BROWSER_HELPERS_EXIT_UNCONFIRMED' });
    assert.equal(engine.running.get('env'), item);
    for (const operation of ['singleton', 'release', 'clean']) assert.equal(calls.includes(operation), false);
    assert.equal(item.cleanedUp, false);
    engine.drainProfileHelpers = async () => ({ known: true, pids: [] });
    await engine.cleanupRunningItem('env', item);
    assert.equal(item.cleanedUp, true, 'confirmed helper exit permits an explicit retry');
    checks++;
  }
  {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openbrowser-start-ownership-'));
    const owner = await acquireProfileLock(root, { profileId: 'owned-profile' });
    const singleton = path.join(root, 'SingletonLock');
    fs.writeFileSync(singleton, 'existing-browser');
    const engine = Object.create(BrowserEngine.prototype);
    let drains = 0;
    engine.drainProfileHelpers = async () => { drains++; return { known: false, pids: [] }; };
    try {
      assert.equal(isProfileLockOwner(root, owner), true);
      assert.equal(isProfileLockOwner(root, { ...owner, token: 'foreign' }), false);
      await engine.cleanupStartupResources({ root });
      await engine.cleanupStartupResources({ root, profileLock: { ...owner, token: 'foreign' } });
      assert.equal(drains, 0, 'failed lock acquisition cannot scan or kill the current owner');
      assert.equal(JSON.parse(fs.readFileSync(lockPath(root), 'utf8')).token, owner.token);
      const blocked = await engine.cleanupStartupResources({ root, profileLock: owner });
      assert.equal(blocked.cleanupBlocked, true);
      assert.equal(fs.readFileSync(singleton, 'utf8'), 'existing-browser', 'unknown scan retains browser singleton too');
      checks++;
    } finally { await releaseProfileLock(root, owner);fs.rmSync(root, { recursive: true, force: true }); }
  }
  console.log(`LIFECYCLE_RESOURCE_OWNERSHIP_SELFTEST OK ${checks}/${checks}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });

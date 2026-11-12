'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { ServiceWorkerScriptGate, cachedWorkerIdentities } = require('../service-worker-script-gate');
const { FingerprintSession } = require('../../engine/fingerprint-session');
const { buildFingerprint, buildWorkerInjectionScript } = require('../fingerprint');

const make = cores => buildFingerprint({ id: 'cached', fingerprintVersion: 2, fingerprintSeed: 'cores-' + cores,
  os: 'Windows', privacy: { cores, fontListMode: 'real' } });
const old = make(2), current = make(4), cachedSource = buildWorkerInjectionScript(old);
assert.equal(cachedWorkerIdentities(cachedSource).length, 1);
assert.deepEqual(cachedWorkerIdentities('const first = navigator.hardwareConcurrency;'), []);
assert.deepEqual(cachedWorkerIdentities('(function installWorkerIdentity(originalWorkerUrl, constructorInstaller) { return 1; })();'), []);
assert.equal(cachedWorkerIdentities(cachedSource + '\nconst BRIDGE_TOKEN="' + 'a'.repeat(32) + '";').length, 1, 'ignore similar application identifiers');
assert.equal(cachedWorkerIdentities(cachedSource + '\n;' + cachedSource).length, 2, 'retire consecutive historical prefixes');
assert.throws(() => cachedWorkerIdentities(cachedSource.replace("'workerInstalled') === 3) return;", "'workerInstalled') === 3) missing();")), /Unrecognized/);

const scope = vm.createContext({ URL, DOMException });
vm.runInContext(`class WorkerNavigator {get hardwareConcurrency(){return 8}}
  globalThis.WorkerNavigator=WorkerNavigator;globalThis.navigator=new WorkerNavigator();globalThis.self=globalThis;`, scope);
vm.runInContext(buildWorkerInjectionScript(current, { retiredWorkerIdentities: cachedWorkerIdentities(cachedSource) }), scope);
vm.runInContext(cachedSource + ';globalThis.first=navigator.hardwareConcurrency;', scope);
assert.equal(scope.first, 4, 'a cached prior persona must not overwrite the newly installed one');

async function scenario({ fail = false, cancel = false } = {}) {
  const calls = [];let releaseEnable, releaseArm, gate;
  const connection = { async command(method, _params) {
    calls.push(method);
    if (method === 'Debugger.enable') return new Promise(resolve => { releaseEnable = resolve; });
    if (method === 'Debugger.setInstrumentationBreakpoint') return new Promise(resolve => { releaseArm = resolve; });
    if (method === 'Runtime.runIfWaitingForDebugger') {
      releaseEnable({});releaseArm({ breakpointId: 'entry' });
      queueMicrotask(() => gate.handlePaused({ reason: 'instrumentation', callFrames: [{ location: { scriptId: 'script' } }] }));
    }
    if (method === 'Debugger.getScriptSource') {
      if (cancel) state.cancel('detached');
      return { scriptSource: cachedSource };
    }
    if (method === 'Runtime.evaluate') return fail ? { exceptionDetails: { text: 'injection rejected' } } : { result: { value: true } };
    return {};
  } };
  const state = new FingerprintSession({ sessionId: 's', targetId: 't', item: {}, connection });
  gate = new ServiceWorkerScriptGate(state, current);
  if (fail || cancel) {
    await assert.rejects(gate.resume(), fail ? /injection rejected/ : /detached/);
    assert.equal(calls.includes('Debugger.resume'), false, 'a failed or detached target never resumes application code');
    assert.equal(gate.verified, false);
  } else {
    await gate.resume();assert.equal(gate.verified, true);
    assert.ok(calls.indexOf('Runtime.runIfWaitingForDebugger') < calls.indexOf('Runtime.evaluate'));
    assert.ok(calls.indexOf('Runtime.evaluate') < calls.indexOf('Debugger.resume'));
    assert.equal(calls.at(-1), 'Debugger.disable', 'delivery does not leave a debugger attached to business code');
  }
}
(async () => {
  await scenario();await scenario({ fail: true });await scenario({ cancel: true });
  console.log('PASS cached-prefix retirement, ordered startup debugger commands, pre-script delivery, failure/detach non-resume and debugger cleanup');
})().catch(error => { console.error(error);process.exitCode = 1; });

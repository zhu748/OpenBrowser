'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { ServiceWorkerScriptGate, cachedWorkerIdentities } = require('../service-worker-script-gate');
const { FingerprintSession } = require('../../engine/fingerprint-session');
const { buildFingerprint, buildWorkerInjectionScript } = require('../fingerprint');
const { canonicalBridgeToken } = require('../fingerprint/shared');
const { deriveBridgeToken } = require('../font-placeholder');
const { WORKER_RUNTIME_REVISION } = require('../fingerprint/runtime-revision');

const make = cores => buildFingerprint({ id: 'cached', fingerprintVersion: 2, fingerprintSeed: 'cores-' + cores,
  os: 'Windows', privacy: { cores, fontListMode: 'real' } });
const old = make(2), current = make(4), cachedSource = buildWorkerInjectionScript(old);
assert.equal(cachedWorkerIdentities(cachedSource).length, 1);
assert.deepEqual(cachedWorkerIdentities('const first = navigator.hardwareConcurrency;'), []);
assert.deepEqual(cachedWorkerIdentities('(function installWorkerIdentity(originalWorkerUrl, constructorInstaller) { return 1; })();'), []);
assert.equal(cachedWorkerIdentities(cachedSource + '\nconst BRIDGE_TOKEN="' + 'a'.repeat(32) + '";').length, 1, 'ignore similar application identifiers');
assert.equal(cachedWorkerIdentities(cachedSource + '\n;' + cachedSource).length, 2, 'retire consecutive historical prefixes');
assert.throws(() => cachedWorkerIdentities(cachedSource.replace(`'workerInstalled') === ${WORKER_RUNTIME_REVISION}) return;`, `'workerInstalled') === ${WORKER_RUNTIME_REVISION}) missing();`)), /Unrecognized/);

const scope = vm.createContext({ URL, DOMException });
vm.runInContext(`class WorkerNavigator {get hardwareConcurrency(){return 8}}
  globalThis.WorkerNavigator=WorkerNavigator;globalThis.navigator=new WorkerNavigator();globalThis.self=globalThis;`, scope);
vm.runInContext(buildWorkerInjectionScript(current, { retiredWorkerIdentities: cachedWorkerIdentities(cachedSource) }), scope);
vm.runInContext(cachedSource + ';globalThis.first=navigator.hardwareConcurrency;', scope);
assert.equal(scope.first, 4, 'a cached prior persona must not overwrite the newly installed one');

// Same persisted persona, older installed runtime: identity values stay stable
// while the private delivery channel rotates, allowing exact-prefix retirement.
const { fontBlobBridge: _bridge, consistency: _consistency, ...declared } = current;
const legacyToken = deriveBridgeToken(declared);
assert.notEqual(legacyToken, canonicalBridgeToken(current));
const currentSource = buildWorkerInjectionScript(current);
const legacySource = currentSource.replaceAll(canonicalBridgeToken(current), legacyToken)
  .replaceAll(`'workerInstalled') === ${WORKER_RUNTIME_REVISION}`, "'workerInstalled') === 3")
  .replaceAll(`'workerInstalled') return ${WORKER_RUNTIME_REVISION}`, "'workerInstalled') return 3");
const upgraded = vm.createContext({ URL, DOMException });
vm.runInContext('class WorkerNavigator {get hardwareConcurrency(){return 8}};globalThis.WorkerNavigator=WorkerNavigator;globalThis.navigator=new WorkerNavigator();globalThis.self=globalThis;', upgraded);
vm.runInContext(buildWorkerInjectionScript(current, { retiredWorkerIdentities: cachedWorkerIdentities(legacySource) }), upgraded);
vm.runInContext(legacySource, upgraded);
assert.equal(vm.runInContext(`Function.prototype.toString.call(Function.prototype.toString, ${JSON.stringify(canonicalBridgeToken(current))}, 'workerInstalled')`, upgraded), WORKER_RUNTIME_REVISION);
assert.equal(vm.runInContext('navigator.hardwareConcurrency', upgraded), current.hardwareConcurrency);

async function scenario({ fail = false, cancel = false, drift = '' } = {}) {
  const expected = buildFingerprint({ id: 'gate-probe', privacy: { timezoneMode: 'custom', timezone: 'Etc/UTC',
    fingerprint: { languages: ['fr-CA', 'en-US'], deviceMemory: 4 } } });
  const worker = vm.createContext({ URL, DOMException });
  vm.runInContext(`class WorkerNavigator {
    get userAgent(){return 'host UA'} get platform(){return 'host platform'}
    get hardwareConcurrency(){return 48} get deviceMemory(){return 8}
    get language(){return 'ja'} get languages(){return ['ja']}
  }
  globalThis.WorkerNavigator=WorkerNavigator;globalThis.navigator=new WorkerNavigator();globalThis.self=globalThis;`, worker);
  const calls = [];let releaseEnable, releaseArm, gate;
  const connection = { async command(method, params) {
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
    if (method === 'Runtime.evaluate') {
      if (fail) return { exceptionDetails: { text: 'injection rejected' } };
      const value = vm.runInContext(params.expression, worker);
      if (!params.returnByValue && drift) {
        if (drift === 'timezone') {
          vm.runInContext("Intl.DateTimeFormat = () => ({ resolvedOptions: () => ({timeZone:'Asia/Tokyo'}) });", worker);
        } else {
          const value = drift === 'deviceMemory' ? 2 : ['ja'];
          Object.defineProperty(worker.navigator, drift, { value });
        }
      }
      return { result: { value } };
    }
    return {};
  } };
  const state = new FingerprintSession({ sessionId: 's', targetId: 't', item: {}, connection });
  gate = new ServiceWorkerScriptGate(state, expected);
  if (fail || cancel || drift) {
    await assert.rejects(gate.resume(), fail ? /injection rejected/ : (cancel ? /detached/ : /installation was not confirmed/));
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
  for (const drift of ['languages', 'deviceMemory', 'timezone']) await scenario({ drift });
  console.log('PASS cached-prefix retirement, ordered debugger startup, equivalent timezones, worker field verification and debugger cleanup');
})().catch(error => { console.error(error);process.exitCode = 1; });

'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript } = require('../fingerprint');
const { buildUaProfile } = require('../user-agent');

let count = 0;
async function test(name, run) { await run(); count += 1; console.log('PASS ' + name); }
const profile = (privacy = {}) => ({ id: 'realm-contract', os: 'Windows', privacy: { fontListMode: 'real', ...privacy } });

function realm({ worker = false, secure = true } = {}) {
  const scope = vm.createContext({ URL, DOMException, setTimeout, clearTimeout });
  vm.runInContext(`
    const window=globalThis, self=globalThis;
    const document={createElement(type){return type==='iframe'?new HTMLIFrameElement():{getContext(){return null}}},querySelectorAll(){return []}};
    const location={hostname:'example.test',href:'https://example.test/'};
    const valid=new WeakSet();
    class NavigatorUAData {
      get brands(){if(!valid.has(this))throw new TypeError('Illegal invocation');return [{brand:'Native',version:'1'}]}
      get mobile(){if(!valid.has(this))throw new TypeError('Illegal invocation');return false}
      get platform(){if(!valid.has(this))throw new TypeError('Illegal invocation');return 'Native'}
      async getHighEntropyValues(){if(!valid.has(this))throw new TypeError('Illegal invocation');return {formFactors:['Desktop']}}
      toJSON(){if(!valid.has(this))throw new TypeError('Illegal invocation');return {brands:this.brands,mobile:false,platform:this.platform}}
    }
    const genuineUa=new NavigatorUAData();valid.add(genuineUa);
    class ${worker ? 'WorkerNavigator' : 'Navigator'} {}
    globalThis.${worker ? 'WorkerNavigator' : 'Navigator'}=${worker ? 'WorkerNavigator' : 'Navigator'};
    globalThis.NavigatorUAData=NavigatorUAData;
    const navProto=${worker ? 'WorkerNavigator' : 'Navigator'}.prototype;
    for (const [key,value] of Object.entries({userAgent:'native',platform:'Win32',appVersion:'native',vendor:'',hardwareConcurrency:2,languages:['en-US'],language:'en-US',maxTouchPoints:0,webdriver:false})) {
      Object.defineProperty(navProto,key,{configurable:true,enumerable:true,get(){if(this!==navigator)throw new TypeError('Illegal invocation');return value}});
    }
    const navigator=new ${worker ? 'WorkerNavigator' : 'Navigator'}();
    globalThis.navigator=navigator;globalThis.window=window;globalThis.self=self;
    ${secure ? "Object.defineProperty(navProto,'deviceMemory',{configurable:true,get(){return 4}});Object.defineProperty(navProto,'userAgentData',{configurable:true,get(){if(this!==navigator)throw new TypeError('Illegal invocation');return genuineUa}});" : ''}
    class Screen {} const screen=new Screen();
    globalThis.Screen=Screen;globalThis.screen=screen;globalThis.document=document;globalThis.location=location;
    class HTMLIFrameElement {get contentWindow(){return globalThis.childFrame||null}}
    globalThis.HTMLIFrameElement=HTMLIFrameElement;
    const isSecureContext=${secure};
  `, scope);
  return scope;
}

(async () => {
  await test('document and worker Client Hints accept iterables, validate arguments and reject forged receivers', async () => {
    const fp = buildFingerprint(profile());
    for (const worker of [false, true]) {
      const scope = realm({ worker });
      vm.runInContext(worker ? buildWorkerInjectionScript(fp) : buildInjectionScript(fp), scope);
      const values = await vm.runInContext("navigator.userAgentData.getHighEntropyValues(new Set(['architecture','uaFullVersion']))", scope);
      assert.equal(values.architecture, fp.userAgentMetadata.architecture);
      assert.equal(values.uaFullVersion, fp.userAgentMetadata.uaFullVersion);
      const reads = await vm.runInContext(`(async()=>{let reads=0;const hints={get [Symbol.iterator](){reads++;return function*(){yield 'model'}}};await navigator.userAgentData.getHighEntropyValues(hints);return reads})()`, scope);
      assert.equal(reads, 1, 'the iterator getter is read once');
      for (const expression of [
        'navigator.userAgentData.getHighEntropyValues()',
        'navigator.userAgentData.getHighEntropyValues(null)',
        'navigator.userAgentData.getHighEntropyValues("model")',
        'navigator.userAgentData.getHighEntropyValues({})',
        'navigator.userAgentData.getHighEntropyValues([Symbol()])',
        'NavigatorUAData.prototype.getHighEntropyValues.call({}, [])',
      ]) {
        let result;
        assert.doesNotThrow(() => { result = vm.runInContext(expression, scope); });
        await assert.rejects(result, (error) => error.name === 'TypeError');
      }
      assert.throws(() => vm.runInContext(`Object.getOwnPropertyDescriptor(${worker ? 'WorkerNavigator' : 'Navigator'}.prototype,'userAgentData').get.call({})`, scope), (error) => error.name === 'TypeError');
    }
  });
  await test('Client Hints dictionaries are independent snapshots and cannot expose inherited fields', async () => {
    const fp = buildFingerprint(profile());
    for (const worker of [false, true]) {
      const scope = realm({ worker });
      vm.runInContext(worker ? buildWorkerInjectionScript(fp) : buildInjectionScript(fp), scope);
      const original = fp.userAgentMetadata.fullVersionList[0].version;
      const result = await vm.runInContext(`(async()=>{
        const first=await navigator.userAgentData.getHighEntropyValues(['fullVersionList','constructor','toString','__proto__','fullVersion']);
        first.fullVersionList[0].version='changed';first.brands.push({brand:'changed'});
        const json=navigator.userAgentData.toJSON();json.brands[0].version='changed';
        const second=await navigator.userAgentData.getHighEntropyValues(['fullVersionList']);
        return {version:second.fullVersionList[0].version,brandCount:second.brands.length,own:Object.keys(first)};
      })()`, scope);
      assert.equal(result.version, original);
      assert.equal(result.brandCount, fp.userAgentMetadata.brands.length);
      for (const key of ['constructor', 'toString', '__proto__', 'fullVersion']) assert.equal(result.own.includes(key), false);
    }
  });
  await test('insecure workers and same-origin child realms retain their native absent APIs', () => {
    const fp = buildFingerprint(profile());
    const worker = realm({ worker: true, secure: false });
    vm.runInContext(buildWorkerInjectionScript(fp), worker);
    assert.equal(vm.runInContext("'userAgentData' in navigator", worker), false);
    assert.equal(vm.runInContext("'deviceMemory' in navigator", worker), false);
    const child = realm({ secure: false }), parent = realm();
    parent.childFrame = vm.runInContext('globalThis', child);
    vm.runInContext(buildInjectionScript(fp), parent);
    vm.runInContext('new HTMLIFrameElement().contentWindow', parent);
    assert.equal(vm.runInContext("'userAgentData' in navigator", child), false);
    assert.equal(vm.runInContext("'deviceMemory' in navigator", child), false);
    assert.equal(vm.runInContext('navigator.userAgent', child), fp.userAgent);
  });
  await test('real media-device mode cannot prune independent speech, battery, Bluetooth or connection policies', async () => {
    const fp = buildFingerprint(profile({ mediaDevices: 'real', speech: 'blocked', battery: 'blocked', bluetooth: 'blocked' }));
    const scope = realm();
    vm.runInContext(`
      class SpeechSynthesis {getVoices(){return ['host voice']}}
      const speechSynthesis=new SpeechSynthesis();
      globalThis.SpeechSynthesis=SpeechSynthesis;globalThis.speechSynthesis=speechSynthesis;
      class Bluetooth {getAvailability(){return Promise.resolve(true)} requestDevice(){return Promise.resolve({name:'host'})}}
      const bluetooth=new Bluetooth();
      class NetworkInformation {get downlink(){if(this!==connection)throw new TypeError('Illegal invocation');return 999}get rtt(){return 999}get effectiveType(){return 'host'}get saveData(){return true}}
      const connection=new NetworkInformation();
      Object.defineProperty(navProto,'bluetooth',{configurable:true,get(){return bluetooth}});
      Object.defineProperty(navProto,'connection',{configurable:true,get(){return connection}});
      navProto.getBattery=function getBattery(){return Promise.resolve({level:0.99})};
    `, scope);
    vm.runInContext(buildInjectionScript(fp), scope);
    assert.equal(vm.runInContext('speechSynthesis.getVoices().length', scope), 0);
    await assert.rejects(vm.runInContext('navigator.getBattery()', scope), (error) => error.name === 'NotAllowedError');
    assert.equal(await vm.runInContext('navigator.bluetooth.getAvailability()', scope), false);
    assert.equal(vm.runInContext('navigator.connection.downlink', scope), fp.connection.downlink);
    assert.throws(() => vm.runInContext("Object.getOwnPropertyDescriptor(NetworkInformation.prototype,'downlink').get.call({})", scope), (error) => error.name === 'TypeError');
  });
  await test('media enumeration follows native per-kind exposure, revocation and native failures', async () => {
    const fp = buildFingerprint(profile());
    const scope = realm();
    vm.runInContext(`
      const deviceState=new WeakMap();
      class MediaDeviceInfo {}
      for(const key of ['deviceId','groupId','kind','label'])Object.defineProperty(MediaDeviceInfo.prototype,key,{configurable:true,enumerable:true,get(){if(!deviceState.has(this))throw new TypeError('Illegal invocation');return deviceState.get(this)[key]}});
      MediaDeviceInfo.prototype.toJSON=function(){if(!deviceState.has(this))throw new TypeError('Illegal invocation');return deviceState.get(this)};
      class MediaDevices {async enumerateDevices(){if(this!==mediaDevices)throw new TypeError('Illegal invocation');if(globalThis.nativeError)throw new DOMException('hidden','InvalidStateError');return globalThis.nativeDevices}async getUserMedia(){if(this!==mediaDevices)throw new TypeError('Illegal invocation');return {host:true}}}
      const mediaDevices=new MediaDevices();
      Object.defineProperty(navProto,'mediaDevices',{configurable:true,get(){return mediaDevices}});
    `, scope);
    scope.nativeDevices = [
      { kind: 'audioinput', label: '' }, { kind: 'audiooutput', label: '' }, { kind: 'videoinput', label: 'host camera' },
    ];
    vm.runInContext(buildInjectionScript(fp), scope);
    let result = await vm.runInContext('navigator.mediaDevices.enumerateDevices()', scope);
    assert.ok(result.filter((d) => d.kind === 'videoinput').every((d) => d.label && d.label !== 'host camera'));
    assert.ok(result.filter((d) => d.kind !== 'videoinput').every((d) => !d.label && !d.deviceId && !d.groupId));
    scope.nativeDevices = [{ kind: 'videoinput', label: '' }];
    result = await vm.runInContext('navigator.mediaDevices.enumerateDevices()', scope);
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, 'videoinput');
    assert.equal(result[0].label, '');
    scope.nativeError = true;
    await assert.rejects(vm.runInContext('navigator.mediaDevices.enumerateDevices()', scope), (error) => error.name === 'InvalidStateError');
    await assert.rejects(vm.runInContext('MediaDevices.prototype.enumerateDevices.call({})', scope), (error) => error.name === 'TypeError');
  });
  await test('empty device lists stay empty and explicit capture blocking still works with real enumeration', async () => {
    for (const privacy of [{ mediaDevices: 'empty' }, { media: 'blocked', mediaDevices: 'real' }]) {
      const fp = buildFingerprint(profile(privacy));
      const scope = realm();
      vm.runInContext(`
        class MediaDevices {async enumerateDevices(){return [{kind:'audioinput',label:'host microphone'}]}async getUserMedia(){if(this!==mediaDevices)throw new TypeError('Illegal invocation');return {host:true}}}
        const mediaDevices=new MediaDevices();
        Object.defineProperty(navProto,'mediaDevices',{configurable:true,get(){return mediaDevices}});
      `, scope);
      vm.runInContext(buildInjectionScript(fp), scope);
      const actual = await vm.runInContext('navigator.mediaDevices.enumerateDevices()', scope);
      assert.equal(actual.length, privacy.mediaDevices === 'empty' ? 0 : 1);
      await assert.rejects(vm.runInContext('navigator.mediaDevices.getUserMedia({audio:true})', scope), (error) => error.name === (privacy.media === 'blocked' ? 'NotAllowedError' : 'NotFoundError'));
      await assert.rejects(vm.runInContext('MediaDevices.prototype.getUserMedia.call({})', scope), (error) => error.name === 'TypeError');
    }
  });
  await test('worker configuration falls back to the same UA metadata as the document builder', async () => {
    const fp = buildFingerprint(profile());
    delete fp.userAgentMetadata;
    fp.uaProfile = buildUaProfile({ os: 'windows', chromeMajor: 149, chromeFull: '149.0.7827.114' });
    const scope = realm({ worker: true });
    vm.runInContext(buildWorkerInjectionScript(fp), scope);
    const value = await vm.runInContext("navigator.userAgentData.getHighEntropyValues(['uaFullVersion'])", scope);
    assert.equal(value.uaFullVersion, '149.0.7827.114');
  });
  console.log(`fingerprint-realms-selftest: OK ${count}/${count}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });

'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { buildFingerprint } = require('../fingerprint');
const { buildUaProfile } = require('../user-agent');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { CURRENT_FINGERPRINT_VERSION } = require('../fingerprint/generation');
const { buildEditorUa } = require('../editor-ua');

async function snapshot() {
  const hints = await navigator.userAgentData.getHighEntropyValues(new Set([
    'architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList', 'uaFullVersion', 'formFactors', 'wow64',
  ]));
  return { ua: navigator.userAgent, appVersion: navigator.appVersion, platform: navigator.platform,
    cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory,
    hints, headers: await (await fetch('/headers')).json() };
}

async function navigate(page, url) {
  await page.command('Page.navigate', { url });
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if (await h.evaluate(page, `location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`)) return;
    } catch (error) {
      if (!/context.*destroyed|cannot find context/i.test(error.message)) throw error;
    }
    await h.delay(20);
  }
  throw Error('UA test document did not load');
}

function verify(actual, fp, reference, label) {
  assert.equal(actual.error, undefined, label);
  assert.equal(actual.ua, fp.userAgent, label + ' JS UA');
  assert.equal(actual.appVersion, fp.uaProfile.appVersion, label + ' appVersion');
  assert.equal(actual.platform, fp.platform, label + ' Navigator platform');
  assert.equal(actual.cores, fp.hardwareConcurrency, label + ' logical processors');
  assert.equal(actual.memory, fp.deviceMemory, label + ' device memory');
  for (const field of ['architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList', 'uaFullVersion', 'platform', 'mobile', 'brands', 'wow64'])
    assert.deepEqual(actual.hints[field], fp.userAgentMetadata[field], label + ' Client Hint ' + field);
  if (actual.borrowedHints) {
    assert.deepEqual(actual.borrowedHints, actual.hints, label + ' cross-realm method receiver');
    assert.equal(actual.borrowedPlatform, actual.hints.platform, label + ' cross-realm getter receiver');
    assert.deepEqual(actual.borrowedJson, { brands: actual.hints.brands, mobile: actual.hints.mobile, platform: actual.hints.platform }, label + ' cross-realm toJSON receiver');
  }
  const supportsFormFactors = Object.hasOwn(reference.hints, 'formFactors');
  assert.equal(Object.hasOwn(actual.hints, 'formFactors'), supportsFormFactors, label + ' optional hint support');
  if (supportsFormFactors)
    assert.deepEqual(actual.hints.formFactors, fp.mobile ? ['Mobile'] : ['Desktop'], label + ' form factors');
  assert.equal(actual.headers['user-agent'], fp.userAgent, label + ' HTTP UA');
  const meta = fp.userAgentMetadata;
  const brandHeader = items => items.map(item => JSON.stringify(item.brand) + ';v=' + JSON.stringify(item.version)).join(', ');
  const headers = {
    'sec-ch-ua': brandHeader(meta.brands),
    'sec-ch-ua-platform': JSON.stringify(meta.platform),
    'sec-ch-ua-mobile': meta.mobile ? '?1' : '?0',
    'sec-ch-ua-arch': JSON.stringify(meta.architecture),
    'sec-ch-ua-bitness': JSON.stringify(meta.bitness),
    'sec-ch-ua-platform-version': JSON.stringify(meta.platformVersion),
    'sec-ch-ua-model': JSON.stringify(meta.model),
    'sec-ch-ua-full-version': JSON.stringify(meta.fullVersion),
    'sec-ch-ua-full-version-list': brandHeader(meta.fullVersionList),
    'sec-ch-ua-form-factors': JSON.stringify(meta.mobile ? 'Mobile' : 'Desktop'),
    'sec-ch-ua-wow64': meta.wow64 ? '?1' : '?0',
  };
  // Chromium does not send Client Hints on every kind of worker request.
  // Compare native presence per realm as well as the configured values.
  for (const [header, expected] of Object.entries(headers))
    assert.equal(actual.headers[header], reference.headers[header] === undefined ? undefined : expected, label + ' HTTP ' + header);
}

async function main() {
  const browser = h.chooseChromiumBinary();
  const probe = '(' + snapshot.toString() + ')()';
  const server = http.createServer((request, response) => {
    response.setHeader('Accept-CH', 'Sec-CH-UA-Full-Version-List, Sec-CH-UA-Full-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Platform-Version, Sec-CH-UA-Model, Sec-CH-UA-Form-Factors, Sec-CH-UA-WoW64');
    response.setHeader('Content-Type', request.url.endsWith('.js') ? 'text/javascript' : 'text/html');
    if (request.url === '/headers') {
      response.setHeader('Content-Type', 'application/json');response.end(JSON.stringify(request.headers));
    } else if (request.url === '/dedicated.js') response.end(probe + '.then(postMessage).catch(e=>postMessage({error:e.message}));');
    else if (request.url === '/shared.js') response.end(`onconnect=e=>{const p=e.ports[0];${probe}.then(v=>{p.postMessage(v);p.close()}).catch(e=>p.postMessage({error:e.message}))};`);
    else if (request.url === '/sw.js') response.end(`addEventListener('install',e=>e.waitUntil(skipWaiting()));
      addEventListener('activate',e=>e.waitUntil(clients.claim()));addEventListener('message',e=>e.waitUntil(${probe}.then(v=>{e.ports[0].postMessage(v);e.ports[0].close()})));`);
    else response.end('<!doctype html><body>UA realm contracts');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let reference;
  try {
    for (const os of [null, 'Windows', 'macos_arm', 'Linux', 'Android', 'Windows full UA', 'Windows generated UA', 'Windows fallback UA']) {
      const persona = h.buildPersona('ua-contract-' + (os || 'baseline').replaceAll(' ', '-'), {
        os: os?.startsWith('Windows') ? 'Windows' : os || 'Windows', kernelVersion: browser.version, fingerprintVersion: CURRENT_FINGERPRINT_VERSION,
        seed: os === 'Windows' ? 'catalog-v4-96' : undefined,
      });
      assert.equal(persona.fingerprint.generationVersion, CURRENT_FINGERPRINT_VERSION);
      if (os === 'Linux') assert.equal(persona.fingerprint.userAgentMetadata.platformVersion, '');
      if (os === 'Windows') assert.match(persona.fingerprint.webgl.renderer, /Radeon 8060S/);
      if (os === 'Android') {
        persona.profile.privacy.fingerprint.clientHints = { deviceModel: 'SM-F956U' };
        persona.fingerprint = buildFingerprint({ ...persona.profile, kernelVersion: browser.version });
        assert.equal(persona.fingerprint.clientHints.deviceModel, 'SM-F956U');
        assert.match(persona.fingerprint.webgl.renderer, /Adreno.*750/);
      }
      if (os === 'Windows full UA') {
        persona.profile.userAgent = buildUaProfile({ os: 'Windows', chromeMajor: Number(browser.version.split('.')[0]), chromeFull: browser.version, reduced: false }).userAgent;
        Object.assign(persona.profile.privacy.fingerprint, { uaGenerated: true, uaReduced: false });
        persona.fingerprint = buildFingerprint({ ...persona.profile, kernelVersion: browser.version });
        assert.ok(persona.fingerprint.userAgent.includes('Chrome/' + browser.version));
      }
      if (os === 'Windows generated UA' || os === 'Windows fallback UA') {
        const catalog = require('../data/chrome-release-versions.json').versions.windows;
        const major = browser.version.split('.')[0];
        const published = catalog[major];
        const fallback = os === 'Windows fallback UA';
        const versions = fallback ? [] : published || [];
        const previous = versions.includes(browser.version) ? browser.version : versions[0] || browser.version;
        if (fallback) delete catalog[major];
        let generated;
        try {
          generated = await buildEditorUa({ profiles: new Map(), chooseBrowser: () => browser },
            { os: 'Windows', random: true, previousUserAgent: `Chrome/${previous}` });
        } finally {
          if (fallback && published) catalog[major] = published;
        }
        persona.profile.userAgent = generated.userAgent;
        Object.assign(persona.profile.privacy.fingerprint, { uaGenerated: generated.kernelBound, uaReduced: generated.uaReduced,
          uaVersionRandomized: generated.uaVersionRandomized, clientHints: generated.clientHints });
        Object.assign(persona.profile.privacy, { cores: 32, memory: 0.5 });
        persona.profile = sanitizeProfile(persona.profile);
        persona.fingerprint = buildFingerprint({ ...persona.profile, kernelVersion: browser.version });
        assert.equal(persona.fingerprint.userAgent, generated.userAgent);
        assert.equal(persona.fingerprint.userAgentMetadata.fullVersion, generated.chromeFull);
        assert.deepEqual([persona.fingerprint.hardwareConcurrency, persona.fingerprint.deviceMemory], [32, 0.5]);
        if (versions.length) assert.ok(versions.includes(generated.chromeFull));
        else {
          const actual = browser.version.split('.'), selected = generated.chromeFull.split('.');
          assert.deepEqual(selected.slice(0, 3), actual.slice(0, 3));
          assert.ok(Math.abs(Number(selected[3]) - Number(actual[3])) <= 8);
        }
        if (versions.length !== 1) assert.notEqual(generated.chromeFull, previous);
      }
      const run = await h.launchPersonaBrowser(browser, persona, { injectFingerprint: os !== null });
      let page;
      try {
        page = await h.openPage(run.port);
        await navigate(page, origin + '/page');
        const snapshots = [['document', await h.evaluate(page, probe)]];
        const frame = await h.evaluate(page, `(async()=>{
          const f=document.createElement('iframe');f.src='/iframe';await new Promise(r=>{f.onload=r;document.body.append(f)});
          try {
            const value=await f.contentWindow.eval(${JSON.stringify(probe)}), data=f.contentWindow.navigator.userAgentData;
            value.borrowedHints=await NavigatorUAData.prototype.getHighEntropyValues.call(data,['architecture','bitness','model','platformVersion','fullVersionList','uaFullVersion','formFactors','wow64']);
            value.borrowedPlatform=Object.getOwnPropertyDescriptor(NavigatorUAData.prototype,'platform').get.call(data);
            value.borrowedJson=NavigatorUAData.prototype.toJSON.call(data);
            return value;
          } finally {f.remove()}
        })()`);
        snapshots.push(['iframe', frame]);
        for (const kind of ['dedicated', 'shared', 'service']) {
          const result = await h.evaluate(page, kind === 'dedicated'
            ? `new Promise((r,j)=>{const w=new Worker('/dedicated.js');w.onmessage=e=>{w.terminate();r(e.data)};w.onerror=e=>j(Error(e.message))})`
            : kind === 'shared' ? `new Promise((r,j)=>{const w=new SharedWorker('/shared.js');w.port.onmessage=e=>{w.port.close();r(e.data)};w.onerror=e=>j(Error(e.message));w.port.start()})`
              : `(async()=>{await navigator.serviceWorker.register('/sw.js');const s=await navigator.serviceWorker.ready;return new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=e=>{c.port1.close();r(e.data)};s.active.postMessage('read',[c.port2])})})()`);
          snapshots.push([kind, result]);
        }
        if (!os) { reference = new Map(snapshots);continue; }
        for (const [kind, value] of snapshots) verify(value, persona.fingerprint, reference.get(kind), os + ' ' + kind);
        console.log('PASS ' + os + ' document/iframe/dedicated/shared/service UA, Client Hints, form factors and HTTP headers');
      } finally { page?.close();await run.close(); }
    }
  } finally {
    server.closeAllConnections();await new Promise(resolve => server.close(resolve));
  }
  console.log('UA_REALMS_NATIVE_SELFTEST OK');
}
main().catch(error => {
  if (error instanceof h.Unavailable) { console.log('SKIP ' + error.message);process.exitCode = 2; }
  else { console.error(error);process.exitCode = 1; }
});

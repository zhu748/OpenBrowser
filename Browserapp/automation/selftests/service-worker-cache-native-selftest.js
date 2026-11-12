'use strict';

const assert = require('node:assert/strict');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const h = require('./native-gate-harness');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');

const snapshot = '({cores:navigator.hardwareConcurrency,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,downlink:navigator.connection.downlink})';
const read = scope => `navigator.serviceWorker.getRegistration(${JSON.stringify(scope)}).then(r=>new Promise((resolve,reject)=>{
  const ch=new MessageChannel();const timer=setTimeout(()=>reject(new Error('SW reply timeout')),5000);
  ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data)};r.active.postMessage('read',[ch.port2]);
}))`;
async function main() {
  const browser = h.chooseChromiumBinary();
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'openbrowser-sw-cache-'));
  let revision = 1, requests = 0;
  const responses = [];
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url.endsWith('/dependency.mjs')) {
      res.setHeader('Content-Type', 'text/javascript');res.end('export const dependency=' + snapshot + ';');
    } else if (req.url.endsWith('/sw.js') || req.url.endsWith('/sw.mjs')) {
      requests += 1;
      responses.push({ url: req.url, revision });
      res.setHeader('Content-Type', 'text/javascript');
      const module = req.url.endsWith('.mjs');
      res.end((module ? 'import {dependency} from "./dependency.mjs";\n' : '') +
        `const first=${snapshot};const revision=${revision};
        self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
        self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
        self.addEventListener('message',e=>{const port=e.ports[0];port.postMessage({revision,first,${module ? 'dependency,' : ''}now:${snapshot}});port.close()});`);
    } else { res.setHeader('Content-Type', 'text/html');res.end('<!doctype html><body>SW cache verification</body>'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const results = [];
  try {
    for (const cores of [2, 4]) {
      const timezone = cores === 2 ? 'Asia/Tokyo' : 'Europe/Paris';
      const profile = sanitizeProfile({ id: 'sw-cache-restart', name: 'SW cache', os: 'Windows', fingerprintVersion: 2,
        fingerprintSeed: 'cache-seed-' + cores, privacy: { cores, fontListMode: 'real', webrtc: 'disabled', timezoneMode: 'custom', timezone,
          batterySnapshot: { charging: false, level: 0, chargingTime: null, dischargingTime: null } } });
      const fingerprint = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint }, { profileRoot: root, gracefulClose: true });
      let page;
      try {
        page = await h.openPage(session.port, `http://127.0.0.1:${server.address().port}/`);
        await h.evaluate(page, 'new Promise(r=>document.readyState==="complete"?r():addEventListener("load",r,{once:true}))');
        for (const type of ['classic', 'module']) {
          const scope = '/' + type + '/';
          if (cores === 2) {
            await h.evaluate(page, `(async()=>{
              const r=await navigator.serviceWorker.register('${scope}sw.${type === 'module' ? 'mjs' : 'js'}',{scope:'${scope}',type:'${type}'});
              if(r.active?.state==='activated')return;
              await new Promise((resolve,reject)=>{const w=r.installing||r.waiting||r.active;
                const timer=setTimeout(()=>reject(new Error('SW activation timeout')),8000);
                w.addEventListener('statechange',()=>{if(w.state==='activated'){clearTimeout(timer);resolve()}});
              });
            })()`);
          }
          const expected = { cores, timezone, downlink: fingerprint.connection.downlink };
          const first = await h.evaluate(page, read(scope));
          if (cores === 4) assert.equal(responses.filter(item => item.url.startsWith(scope)).length, 1,
            'restart first reads must use the persisted script, without a fresh entry request');
          assert.deepEqual(first.first, expected, `${type} first instruction, cores=${cores}`);
          assert.deepEqual(first.now, expected);
          if (type === 'module') assert.deepEqual(first.dependency, expected, 'static module dependency executes with the current persona');
          results.push({ cores, type, stage: cores === 2 ? 'network' : 'cached-restart', first });
          if (cores === 4) {
            await h.delay(1500);
            const later = await h.evaluate(page, read(scope));
            assert.deepEqual(later.first, expected, 'late recovery must not hide an early read');
            // Exercise actual new worker bytes without a response prefix. The
            // execution gate must also cover background updates on its own.
            session.item.workerScriptPrefixer.setSource('');
            revision += 1;
            await h.evaluate(page, `(async()=>{const r=await navigator.serviceWorker.getRegistration('${scope}');await r.update();
              const w=r.installing||r.waiting;if(!w||w.state==='activated')return;
              await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('SW update activation timeout')),15000);
                w.addEventListener('statechange',()=>{if(w.state==='activated'){clearTimeout(timer);resolve()}
                  else if(w.state==='redundant'){clearTimeout(timer);reject(new Error('SW update became redundant'))}});
              });
            })()`);
            const updated = await h.evaluate(page, read(scope));
            const registrationState = await h.evaluate(page, `navigator.serviceWorker.getRegistration('${scope}').then(r=>({active:r.active?.state,waiting:r.waiting?.state,installing:r.installing?.state}))`);
            assert.equal(updated.revision, revision, 'the updated unprefixed script activates: ' + JSON.stringify({ registrationState, responses, events: session.events }));
            assert.deepEqual(updated.first, expected, 'unprefixed update first instruction');
            assert.deepEqual(updated.now, expected);
            if (type === 'module') assert.deepEqual(updated.dependency, expected);
            results.push({ cores, type, stage: 'unprefixed-update', first: updated });
          }
        }
        const battery = await h.evaluate(page, 'navigator.getBattery().then(b=>({charging:b.charging,level:b.level,chargingTime:String(b.chargingTime),dischargingTime:String(b.dischargingTime)}))');
        assert.deepEqual(battery, { charging: false, level: 0, chargingTime: 'Infinity', dischargingTime: 'Infinity' });
        const downlink = await h.evaluate(page, 'navigator.connection.downlink');
        assert.ok(downlink >= 0 && downlink <= 10);
        assert.equal(session.events.some(e => /injection-failed|harness-browser-stop/.test(e.type || '')), false, JSON.stringify(session.events));
        const owners = session.events.filter(e => e.type === 'service-worker-first-script-injected').map(e => e.targetId);
        assert.equal(owners.length, new Set(owners).size, 'each worker has a single debugger delivery owner');
      } catch (error) {
        console.error('SW_CACHE_DIAGNOSTICS ' + JSON.stringify({ responses, events: session.events }));
        throw error;
      } finally { page?.close();await session.close(); }
    }
    console.log('SW_CACHE_RESULTS ' + JSON.stringify({ browser: browser.version, requests, results }));
    console.log('PASS classic/module SW network, cached restart with changed persona, static dependencies, unprefixed update first reads and native battery zero/Infinity');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fsp.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
main().catch(error => {
  console.error((error instanceof h.Unavailable ? 'SKIP ' : 'FAIL ') + error.stack);
  process.exitCode = error instanceof h.Unavailable ? 2 : 1;
});

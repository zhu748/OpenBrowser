'use strict';

function matrixSources(snapshot) {
  const body = '"use strict";postMessage(JSON.stringify(' + snapshot + '));';
  return {
    '/matrix/classic.js': body,
    '/matrix/shared.js': '"use strict";const first=' + snapshot + ';onconnect=e=>e.ports[0].onmessage=()=>e.ports[0].postMessage(JSON.stringify(first));',
    '/matrix/service.js': '"use strict";const first=' + snapshot + ';oninstall=()=>skipWaiting();onactivate=e=>e.waitUntil(clients.claim());onmessage=e=>e.ports[0].postMessage(JSON.stringify(first));',
    '/matrix/dependency.js': 'export const first=' + snapshot + ';',
    '/matrix/module.js': 'import {first} from "./dependency.js";postMessage(JSON.stringify({...(' + snapshot + '),dependency:first,url:import.meta.url}));',
    '/matrix/nested.js': 'new Worker(URL.createObjectURL(new Blob([' + JSON.stringify(body) + '],{type:"application/javascript"}))).onmessage=e=>postMessage(e.data);',
  };
}

// Serialized into the real page. Capture the first instruction's values in
// every worker; later asynchronous realm injection must not satisfy the test.
async function probeFirefoxWorkerMatrix(snapshot) {
  const results = {};
  const run = (factory, shared = false) => new Promise(resolve => {
    let worker, port, timer;
    const finish = value => {
      clearTimeout(timer);port?.close?.();worker?.terminate?.();resolve(value);
    };
    try {
      worker = factory();port = shared ? worker.port : worker;
      worker.onerror = error => finish({ error: error.message || 'worker error' });
      port.onmessage = event => {
        try { finish(JSON.parse(event.data)); } catch (error) { finish({ error: error.message }); }
      };
      if (shared) { port.start();port.postMessage('probe'); }
      timer = setTimeout(() => finish({ error: 'timeout' }), 10000);
    } catch (error) { finish({ error: error.name + ': ' + error.message }); }
  });
  const body = '"use strict";postMessage(JSON.stringify(' + snapshot + '));';
  const blob = text => URL.createObjectURL(new Blob([text], { type: 'application/javascript' }));
  for (const [name, factory] of [
    ['network', () => new Worker('/matrix/classic.js')],
    ['module', () => new Worker('/matrix/module.js', { type: 'module' })],
    ['nested', () => new Worker('/matrix/nested.js')],
    ['blob', () => { const url = blob(body);try { return new Worker(url); } finally { URL.revokeObjectURL(url); } }],
    ['data', () => new Worker('data:application/javascript,' + encodeURIComponent(body))],
    ['blobModule', () => {
      const text = 'import {first} from ' + JSON.stringify(location.origin + '/matrix/dependency.js')
        + ';postMessage(JSON.stringify({...(' + snapshot + '),dependency:first,url:import.meta.url}));';
      const url = blob(text);try { return new Worker(url, { type: 'module' }); } finally { URL.revokeObjectURL(url); }
    }],
    ['shared', () => new SharedWorker('/matrix/shared.js')],
    ['sharedBlob', () => {
      const text = '"use strict";const first=' + snapshot + ';onconnect=e=>e.ports[0].onmessage=()=>e.ports[0].postMessage(JSON.stringify(first));';
      const url = blob(text);try { return new SharedWorker(url); } finally { URL.revokeObjectURL(url); }
    }],
  ]) results[name] = await run(factory, name.startsWith('shared'));
  const registration = await navigator.serviceWorker.register('/matrix/service.js', { scope: '/' });
  const worker = registration.installing || registration.waiting || registration.active;
  if (worker.state !== 'activated') await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Service worker activation timed out')), 10000);
    worker.addEventListener('statechange', () => { if (worker.state === 'activated') { clearTimeout(timer);resolve(); } });
  });
  results.service = await new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close();resolve({ error: 'timeout' }); }, 10000);
    channel.port1.onmessage = event => { clearTimeout(timer);channel.port1.close();resolve(JSON.parse(event.data)); };
    worker.postMessage('probe', [channel.port2]);
  });
  return results;
}

async function probeCachedFirefoxServiceWorker() {
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active) return { missing: true };
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close();resolve({ error: 'timeout' }); }, 10000);
    channel.port1.onmessage = event => { clearTimeout(timer);channel.port1.close();resolve(JSON.parse(event.data)); };
    registration.active.postMessage('probe', [channel.port2]);
  });
}

module.exports = { matrixSources, probeFirefoxWorkerMatrix, probeCachedFirefoxServiceWorker };

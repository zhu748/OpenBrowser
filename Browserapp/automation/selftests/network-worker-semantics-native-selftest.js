'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');

async function main() {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/worker')) {
      res.setHeader('Content-Type', req.url.includes('legacy') ? 'text/javascript1.5' : 'text/javascript');
      res.setHeader('Content-Security-Policy', "connect-src 'none'");
      if (req.url.includes('created')) res.statusCode = 201;
      const prefix = req.url.includes('hashbang') ? '#!native-worker\n"use strict";' : req.url.includes('strict') ? '"use strict";' : '';
      res.end(prefix + `const strict=(function(){return this})()===undefined;
        fetch('/should-be-blocked').then(()=>postMessage({failed:true})).catch(()=>postMessage({strict,cores:navigator.hardwareConcurrency,
          markers:Object.getOwnPropertyNames(globalThis).filter(k=>k.startsWith('__ob')),blocked:true}));`);
    } else if (req.url === '/page.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end('globalThis.pageMarkers=Object.getOwnPropertyNames(globalThis).filter(k=>k.startsWith("__ob"));');
    } else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><script src="/page.js"></script><body>network semantics</body>'); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let session, page;
  try {
    const browser = h.chooseChromiumBinary();
    const persona = h.buildPersona('network-worker-semantics', { os: 'Windows' });
    session = await h.launchPersonaBrowser(browser, persona);
    page = await h.openPage(session.port, `http://127.0.0.1:${server.address().port}/`);
    await h.evaluate(page, 'new Promise(r=>document.readyState==="complete"?r():addEventListener("load",r,{once:true}))');
    assert.deepEqual(await h.evaluate(page, 'pageMarkers'), [], 'ordinary page scripts receive no worker source hooks');
    for (const [url, strict] of [['/worker-sloppy.js', false], ['/worker-strict.js', true], ['/worker-hashbang.js', true], ['/worker-legacy.js', false], ['/worker-created.js', false]]) {
      const actual = await h.evaluate(page, `new Promise((resolve,reject)=>{
        const w=new Worker(${JSON.stringify(url)});w.onmessage=e=>{w.terminate();resolve(e.data)};w.onerror=e=>{w.terminate();reject(new Error(e.message))};
      })`);
      assert.deepEqual(actual, { strict, cores: persona.fingerprint.hardwareConcurrency, markers: [], blocked: true });
    }
    console.log('PASS native network worker first reads, strict/sloppy/hashbang semantics, CSP retention and no public markers');
  } finally { page?.close(); await session?.close(); await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => {
  console.error((error instanceof h.Unavailable ? 'SKIP ' : 'FAIL ') + error.stack);
  process.exitCode = error instanceof h.Unavailable ? 2 : 1;
});

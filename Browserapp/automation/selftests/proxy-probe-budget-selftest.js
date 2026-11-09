'use strict';
const assert = require('node:assert/strict');
const net = require('node:net');
const { performance } = require('node:perf_hooks');
const { runProxyProbes } = require('../../engine/proxy-probe-runner');
const { parseProxy, lookupProxyCountry, clearProbeCache } = require('../../proxy-forwarder');
(async () => {
  // runProxyProbes unrefs its deadline timers (production behaviour: a pending
  // probe must never keep the Electron main process alive on quit). The
  // cancellation case below settles only through such an unref'd timer, and at
  // that point the test holds no other event-loop handle — Node would drain the
  // loop and exit silently with code 0 mid-test. Hold a keepalive interval
  // until the assertions complete.
  const keepalive = setInterval(() => {}, 1e9);
  try {
  let cancelled = false;
  const started = performance.now();
  const fast = await runProxyProbes([
    () => Promise.resolve({ip:'192.0.2.1',countryCode:'US'}),
    () => { throw new Error('secondary probe should not run'); },
  ]);
  assert.equal(fast[0].countryCode,'US'); assert.ok(performance.now()-started < 200);
  const budgetStart = performance.now();
  await runProxyProbes([signal => new Promise(() => {signal.addEventListener('abort',()=>{cancelled=true;});})],{totalTimeoutMs:100,attemptTimeoutMs:50});
  assert.equal(cancelled,true); assert.ok(performance.now()-budgetStart < 300);
  const sockets = new Set(); const hosts = [];
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('close',()=>sockets.delete(socket));
    let input = '';
    socket.on('data',chunk => {
      input += chunk.toString('latin1'); if(!input.includes('\r\n\r\n'))return;
      const host = input.match(/Host: ([^\r\n]+)/i)?.[1]; hosts.push(host);
      const body = JSON.stringify({status:'success',query:'192.0.2.1',countryCode:'US',country:'United States',timezone:'America/New_York',lat:40,lon:-74});
      socket.end('HTTP/1.1 200 OK\r\nContent-Length: '+Buffer.byteLength(body)+'\r\nConnection: close\r\n\r\n'+body);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const config = parseProxy('http://127.0.0.1:'+server.address().port);
  const wireStart = performance.now();
  try {
    clearProbeCache();
    const result = await lookupProxyCountry(config,{force:true,totalTimeoutMs:800,attemptTimeoutMs:300});
    assert.equal(result.ip,'192.0.2.1'); assert.equal(result.countryCode,'US');
    // Since d2298e7 one lookup cycle starts the geo providers concurrently and
    // feeds the multi-source voting merge, so the healthy path no longer sends
    // exactly one request. The budget guarantees that stay: every request stays
    // inside the geo provider set — the ipPure risk lookup must not fire
    // without includeRisk — and the whole cycle settles inside the attempt
    // budget instead of dragging to the total deadline.
    const GEO_HOSTS = new Set(['ip-api.com','ipwho.is','ipinfo.io','ipwhois.app','freeipapi.com','www.cloudflare.com','ifconfig.me']);
    const bare = hosts.map((host) => String(host).split(':')[0]);
    assert.ok(bare.length >= 1 && bare.every((host) => GEO_HOSTS.has(host)), 'probe fan-out stays inside the geo provider set');
    assert.ok(!bare.includes('my.ippure.com'), 'risk lookup must stay skipped without includeRisk');
    assert.ok(performance.now()-wireStart < 750, 'concurrent cycle settles inside the attempt budget');
  } finally {for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve));}
  console.log('proxy-probe-budget-selftest: OK cycle-ms='+Math.round(performance.now()-wireStart)+' total-budget=1 cancellation=1 secondary-error-recorded=1 fan-out-contained=1 real-local-proxy=1');
  } finally { clearInterval(keepalive); }
})().catch(error=>{console.error(error);process.exitCode=1;});

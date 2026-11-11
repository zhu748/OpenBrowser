'use strict';
// End-to-end check of the MITM proxy WITHOUT Firefox first: plain HTTP + HTTPS
// CONNECT against a local origin, asserting the worker script response carries
// the prefix and a non-worker response is byte-identical.
const http = require('http');
const tls = require('tls');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { FirefoxWorkerMitmProxy } = require('../firefox-worker-mitm-proxy');

const WORKER_SRC = 'postMessage("cores:" + navigator.hardwareConcurrency);';
let blindRaw = null;
let blindFirstData = null;
let blindResolve = null;
const PAGE_SRC = 'console.log("page");';

async function makeHttpsOrigin() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-e2e-https-'));
  const key = path.join(dir, 's.key');
  const cert = path.join(dir, 's.crt');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', key, '-out', cert,
    '-days', '2', '-nodes', '-subj', '/CN=127.0.0.1',
    '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: ['ignore', 'ignore', 'ignore'] });
  return httpsModule(dir);

  function httpsModule(_d) {
    const https = require('https');
    const srv = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, (req, res) => {
      const isWorker = String(req.headers['sec-fetch-dest'] || '') === 'worker';
      if (req.url.startsWith('/echo')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.headers));
      } else {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(isWorker ? WORKER_SRC : PAGE_SRC);
      }
    });
    return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port, certPem: fs.readFileSync(cert), certPath: cert, dir })));
  }
}

function tlsFetchOverTunnel(tun, request) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ socket: tun.socket, rejectUnauthorized: false }, () => {
      if (tun.remainder.length) socket.unshift(tun.remainder);
      socket.write(request);
    });
    let data = Buffer.alloc(0);
    socket.on('data', (chunk) => { data = Buffer.concat([data, chunk]); });
    socket.on('end', () => resolve(data.toString('latin1')));
    socket.on('error', reject);
    setTimeout(() => reject(new Error('tls fetch timeout')), 8000);
  });
}

function connectTunnel(port, target) {
  return new Promise((resolve, reject) => {
    const socket = require('net').connect({ host: '127.0.0.1', port }, () => {
      socket.write(`CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`);
    });
    let head = Buffer.alloc(0);
    const onData = (chunk) => {
      head = Buffer.concat([head, chunk]);
      const marker = head.indexOf('\r\n\r\n');
      if (marker < 0) return;
      socket.removeListener('data', onData);
      socket.pause();
      resolve({ socket, reply: head.subarray(0, marker + 4).toString('latin1'), remainder: head.subarray(marker + 4) });
    };
    socket.on('data', onData);
    socket.on('error', reject);
  });
}

process.on('uncaughtException', (e) => { console.error('UNCAUGHT', e.stack); process.exit(1); });
(async () => {
  const origin = await makeHttpsOrigin();
  const proxy = new FirefoxWorkerMitmProxy({
    workerSource: 'globalThis.__wk = "prefix";',
    terminatingHosts: ['127.0.0.1'],
    trustedUpstreamCert: origin.certPem, // our test origin's self-signed leaf
  });
  await proxy.start();
  let failures = 0;
  try {
    const host = '127.0.0.1';

    // --- 1. HTTP plain: worker request gets the prefix ---
    const httpOrigin = http.createServer((req, res) => {
      const isWorker = String(req.headers['sec-fetch-dest'] || '') === 'worker';
      if (req.url.startsWith('/echo')) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(req.headers)); return; }
      res.setHeader('Content-Type', 'application/javascript');
      res.end(isWorker ? WORKER_SRC : PAGE_SRC);
    });
    await new Promise((r) => httpOrigin.listen(0, '127.0.0.1', r));
    const httpPort = httpOrigin.address().port;

    const plainReply = await new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: proxy.port, method: 'GET', path: `http://127.0.0.1:${httpPort}/worker.js`, headers: { 'sec-fetch-dest': 'worker', host: `127.0.0.1:${httpPort}` } }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.end();
    });
    if (!plainReply.includes('globalThis.__wk = "prefix"') || !plainReply.includes(WORKER_SRC)) {
      console.error('FAIL plain worker prefix missing:\n' + plainReply.slice(0, 200)); failures += 1;
    } else console.log('PASS plain-HTTP worker script is prefixed');

    const plainPage = await new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: proxy.port, method: 'GET', path: `http://127.0.0.1:${httpPort}/page.js`, headers: { 'sec-fetch-dest': 'script', host: `127.0.0.1:${httpPort}` } }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.end();
    });
    if (plainPage !== PAGE_SRC) { console.error('FAIL plain pass-through changed body'); failures += 1; }
    else console.log('PASS plain-HTTP non-worker passes through byte-identical');

    // --- 2. HTTPS CONNECT: terminated, worker prefixed ---
    const tun = await connectTunnel(proxy.port, host + ':' + origin.port);
    if (!/200/.test(tun.reply)) { console.error('FAIL CONNECT reply: ' + tun.reply.split('\r\n')[0]); failures += 1; }
    else {
      const reqText = `GET /worker.js HTTP/1.1\r\nHost: ${host}\r\nsec-fetch-dest: worker\r\naccept: */*\r\nconnection: close\r\n\r\n`;
      const reply = await tlsFetchOverTunnel(tun, reqText);
      if (!reply.includes('globalThis.__wk = "prefix"') || !reply.includes(WORKER_SRC)) {
        console.error('FAIL https worker prefix missing:\n' + reply.slice(0, 300)); failures += 1;
      } else console.log('PASS HTTPS worker script is prefixed through terminated CONNECT');
      // content-length must match the prefixed body
      const clMatch = reply.match(/content-length:\s*(\d+)/i);
      const bodyStart = reply.indexOf('\r\n\r\n') + 4;
      if (clMatch && Number(clMatch[1]) !== reply.length - bodyStart) {
        console.error('FAIL content-length mismatch'); failures += 1;
      } else console.log('PASS content-length matches rewritten body');
    }

    // --- 3. non-terminating host tunnels blindly ---
    blindFirstData = new Promise((resolve) => { blindResolve = resolve; });
    blindRaw = require('net').createServer((s) => {
      s.once('data', (d) => { if (blindResolve) { const r = blindResolve; blindResolve = null; r(d.slice(0, 4).toString('latin1')); } s.end(); });
    });
    await new Promise((resolve) => blindRaw.listen(0, '127.0.0.1', resolve));
    const blindPort = blindRaw.address().port;
    const tun2 = await connectTunnel(proxy.port, 'localhost:' + blindPort);
    if (!/200/.test(tun2.reply)) { console.error('FAIL blind tunnel CONNECT reply'); failures += 1; }
    else {
      tun2.socket.write(Buffer.from('16030100', 'hex'));
      const seen = await Promise.race([blindFirstData, new Promise((r) => setTimeout(() => r('TIMEOUT'), 5000))]);
      if (seen === 'TIMEOUT') { console.error('FAIL blind tunnel data not forwarded'); failures += 1; }
      else console.log('PASS non-listed host gets a blind tunnel (data forwarded untouched)');
    }
    tun2.socket.destroy();
    blindRaw.close();

    await new Promise((r) => httpOrigin.close(r));
  } finally {
    await proxy.close();
    origin.srv.close();
    fs.rmSync(origin.dir, { recursive: true, force: true });
  }
  if (failures) { console.error('mitm-proxy-selftest: ' + failures + ' failure(s)'); process.exit(1); }
  console.log('firefox-worker-mitm-proxy-selftest: OK');
})().catch((error) => { console.error('FAIL ' + error.message); process.exit(1); });

'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { buildFingerprint, buildInjectionScript } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

async function probe() {
  const result = { methods: {}, recorder: {} };
  for (const [name, method] of [['MediaRecorder', 'isTypeSupported'], ['RTCRtpSender', 'getCapabilities'],
    ['VideoDecoder', 'isConfigSupported'], ['AudioDecoder', 'isConfigSupported']]) {
    const fn = globalThis[name]?.[method];
    result.methods[name] = fn ? { source: Function.prototype.toString.call(fn), name: fn.name, length: fn.length,
      keys: Object.getOwnPropertyNames(fn), descriptor: { ...Object.getOwnPropertyDescriptor(globalThis[name], method), value: undefined } } : null;
  }
  for (const type of ['video/webm', 'video/webm;codecs="definitely-invalid"', 'video/mp4;codecs="definitely-invalid"', 'not-a-mime', '']) {
    result.recorder[type] = typeof MediaRecorder === 'undefined' ? null : MediaRecorder.isTypeSupported(type);
  }
  result.conversions = 0;
  result.rtp = RTCRtpSender.getCapabilities({ toString() { result.conversions++; return 'video'; } });
  const peer = new RTCPeerConnection();
  try {
    peer.addTransceiver('video');
    result.sdpH264 = /a=rtpmap:\d+ H264\//i.test((await peer.createOffer()).sdp);
  } finally { peer.close(); }
  try { RTCRtpSender.getCapabilities(Symbol()); } catch (error) { result.symbolError = error.name; }
  result.webcodecs = {};
  for (const key of ['VideoDecoder', 'AudioDecoder']) {
    if (!globalThis[key]) continue;
    let reads = 0;
    try { await globalThis[key].isConfigSupported({ get codec() { reads++; return ''; }, contentType: 'video/mp4' }); }
    catch (error) { result.webcodecs[key] = { reads, error: error.name }; }
  }
  return result;
}

async function main() {
  const browser = h.chooseChromiumBinary();
  const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><body>codec contract</body>'); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let baseline;
  try {
    for (const spec of [{ os: 'Windows', injected: false }, { os: 'Windows', injected: true }, { os: 'Linux', injected: true }]) {
      const profile = sanitizeProfile({ id: 'codec-' + spec.os, name: 'codec-' + spec.os, os: spec.os, fingerprintVersion: 2,
        privacy: { fontListMode: 'real', webrtc: 'real' } });
      const fingerprint = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint }, { injectFingerprint: spec.injected });
      let page;
      try {
        page = await h.openPage(session.port, `http://127.0.0.1:${server.address().port}/`);
        await h.evaluate(page, 'new Promise(r=>document.readyState === "complete" ? r() : addEventListener("load",r,{once:true}))');
        const actual = await h.evaluate(page, '(' + probe.toString() + ')()');
        if (!spec.injected) baseline = actual;
        assert.deepEqual(actual.methods, baseline.methods, 'native function sources/descriptors');
        assert.deepEqual(actual.recorder, baseline.recorder, 'no fabricated recorder support');
        assert.deepEqual(actual.webcodecs, baseline.webcodecs, 'WebCodecs validation and config getters remain native');
        assert.equal(actual.conversions, 1);
        assert.equal(actual.symbolError, baseline.symbolError);
        assert.deepEqual(actual.rtp.headerExtensions, baseline.rtp.headerExtensions, 'RTP extension dictionary retained');
        assert.equal(actual.rtp.codecs.some((codec) => codec.mimeType.toLowerCase() === 'video/h264'), actual.sdpH264,
          'reported RTP codec capability must agree with actual SDP negotiation');
        assert.deepEqual(actual.rtp.codecs, baseline.rtp.codecs, 'RTP capabilities stay native and agree with negotiation');
        if (spec.injected) {
          await h.evaluate(page, 'globalThis.beforeCodecReplay = RTCRtpSender.getCapabilities; true');
          await h.evaluate(page, buildInjectionScript(fingerprint));
          assert.equal(await h.evaluate(page, 'beforeCodecReplay === RTCRtpSender.getCapabilities'), true, 'replay does not stack wrappers');
          const worker = await h.evaluate(page, `new Promise((resolve,reject)=>{
            const url=URL.createObjectURL(new Blob(['postMessage(typeof VideoDecoder === "undefined" ? null : Function.prototype.toString.call(VideoDecoder.isConfigSupported))'],{type:'text/javascript'}));
            const w=new Worker(url);w.onmessage=e=>{w.terminate();URL.revokeObjectURL(url);resolve(e.data)};w.onerror=reject;
          })`);
          assert.ok(worker === null || worker.includes('[native code]'), 'worker codec API remains native');
        }
        console.log('PASS ' + spec.os + ' injected=' + spec.injected + ' native codec contracts');
      } finally { page?.close(); await session.close(); }
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => {
  console.error((error instanceof h.Unavailable ? 'SKIP ' : 'FAIL ') + error.stack);
  process.exitCode = error instanceof h.Unavailable ? 2 : 1;
});

'use strict';

/**
 * P0 gate: concurrent identity isolation.
 *
 * Two browser sessions with different personas run side by side. Neither may
 * observe the other's identity through any shared surface: JS identity, request
 * headers, and Canvas noise. Also verifies the same profile restarted keeps its
 * identity (stability across relaunch), and that a randomized re-roll changes
 * the expected fields while the UA string itself is NOT required to be unique.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const {
  Unavailable, delay, entrySnapshotSource, chooseChromiumBinary, buildPersona,
  launchPersonaBrowser, openPage, evaluate, verifyIdentity,
} = require('./native-gate-harness');

const PAGE = `<!doctype html><script>globalThis.first=${entrySnapshotSource};</script>`;
const CANVAS_PROBE = `(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgb(90,90,90)';
  ctx.fillRect(0, 0, 64, 48);
  return Array.from(ctx.getImageData(0, 0, 64, 48).data).filter((_, i) => i % 4 === 0).join(',');
})()`;

(async () => {
  const browser = chooseChromiumBinary();
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({ url: request.url, ua: request.headers['user-agent'], session: request.headers['x-test-session'] });
    if (request.url.startsWith('/echo')) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(request.headers));
    } else { response.setHeader('Content-Type', 'text/html'); response.end(PAGE); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;

  const personaA = buildPersona('native-iso-a', { os: 'Windows', network: { rtt: 111, downlink: 1.1, effectiveType: '3g' }, timezone: 'America/New_York' });
  const personaB = buildPersona('native-iso-b', { os: 'macOS', network: { rtt: 222, downlink: 2.2, effectiveType: '4g' }, timezone: 'Europe/Berlin' });
  const fpA = personaA.fingerprint, fpB = personaB.fingerprint;

  // ---- Both sessions live at the same time ----
  const sessionA = await launchPersonaBrowser(browser, personaA);
  let sessionB;
  try {
    sessionB = await launchPersonaBrowser(browser, personaB);

    const readIdentity = async (session, tag) => {
      const page = await openPage(session.port, origin + '/?session=' + tag);
      let snap = null;
      for (let i = 0; i < 60; i += 1) {
        snap = await evaluate(page, 'globalThis.first || null', 5000).catch(() => null);
        if (snap) break;
        await delay(150);
      }
      assert.ok(snap, tag + ' produced no first read');
      const canvas = await evaluate(page, CANVAS_PROBE, 15000);
      const echo = await evaluate(page, `fetch('/echo?s=' + ${JSON.stringify(tag)}, { headers: { 'x-test-session': ${JSON.stringify(tag)} } }).then(r => r.json())`, 15000);
      return { snap, canvas, echo };
    };

    const a = await readIdentity(sessionA, 'A');
    const b = await readIdentity(sessionB, 'B');

    verifyIdentity(a.snap, fpA, 'concurrent-A');
    verifyIdentity(b.snap, fpB, 'concurrent-B');
    console.log('PASS isolation concurrent JS identity A/B');

    assert.equal(a.echo['user-agent'], fpA.userAgent, 'A request UA');
    assert.equal(b.echo['user-agent'], fpB.userAgent, 'B request UA');
    assert.notEqual(a.echo['user-agent'], b.echo['user-agent'], 'concurrent sessions must not share a UA');
    console.log('PASS isolation concurrent request headers A/B');

    assert.notEqual(a.canvas, b.canvas, 'concurrent Canvas noise must differ between personas');
    console.log('PASS isolation concurrent Canvas noise A/B');

    // Cross-check: A's snap must not match B's fingerprint fields.
    assert.notEqual(a.snap.platform, fpB.platform, 'A leaked B platform');
    assert.notEqual(a.snap.connection.rtt, fpB.connection.rtt, 'A leaked B network rtt');
    assert.notEqual(a.snap.timezone, fpB.timezone, 'A leaked B timezone');

    // Re-read A after B was active: A's identity must be unchanged (no drift).
    const a2 = await readIdentity(sessionA, 'A2');
    verifyIdentity(a2.snap, fpA, 'concurrent-A-recheck');
    assert.equal(a2.canvas, a.canvas, 'A Canvas noise must stay stable while B runs');
    console.log('PASS isolation A unchanged after B activity');
  } finally {
    await sessionA.close().catch(() => {});
    await sessionB?.close().catch(() => {});
  }

  // ---- Same profile restarted: identity stable ----
  {
    const again = buildPersona('native-iso-a', { os: 'Windows', network: { rtt: 111, downlink: 1.1, effectiveType: '3g' }, timezone: 'America/New_York' });
    assert.equal(again.fingerprint.userAgent, fpA.userAgent, 'same seed must rebuild the same UA');
    assert.equal(again.fingerprint.connection.rtt, fpA.connection.rtt, 'same seed must rebuild the same network persona');
    const session = await launchPersonaBrowser(browser, again);
    try {
      const page = await openPage(session.port, origin + '/restart');
      let snap = null;
      for (let i = 0; i < 60; i += 1) {
        snap = await evaluate(page, 'globalThis.first || null', 5000).catch(() => null);
        if (snap) break;
        await delay(150);
      }
      verifyIdentity(snap, fpA, 'restart');
      console.log('PASS isolation restart keeps saved identity');
    } finally {
      await session.close().catch(() => {});
    }
  }

  // ---- Randomized re-roll: expected fields change, UA may repeat ----
  {
    const rolled = buildPersona('native-iso-a' + '-reroll-seed', { os: 'Windows', network: { rtt: 333, downlink: 3.3, effectiveType: '2g' } });
    const changed = rolled.fingerprint.connection.rtt !== fpA.connection.rtt
      && rolled.fingerprint.connection.downlink !== fpA.connection.downlink;
    assert.ok(changed, 'a different seed/network pin must change the randomized fields');
    // The UA string itself is explicitly NOT required to be unique per roll.
    console.log('PASS isolation re-roll changes randomized fields (UA uniqueness not required)');
  }

  console.log('fingerprint-concurrent-isolation-selftest: OK');
  await new Promise((resolve) => server.close(resolve));
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});

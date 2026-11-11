'use strict';

/**
 * P0 gate: session failure and recovery semantics.
 *
 * Scenarios:
 *  1. CDP connection dropped mid-session -> the old session's in-flight work must
 *     not corrupt a NEW session on the same profile (restart injection, verify
 *     first-read identity again).
 *  2. Target destroyed during injection (close the tab while the engine works) ->
 *     the engine must not treat it as a fatal browser-wide failure; other tabs
 *     keep their persona.
 *  3. Command timeout during navigation (slow server) -> the page either loads
 *     with persona or the engine reports an injection failure event; it must never
 *     silently serve the host identity.
 *  4. Old-task/new-session isolation: after a full stop + relaunch with the SAME
 *     profile id but a DIFFERENT persona, the new persona wins everywhere.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const cdp = require('../../cdp');
const {
  Unavailable, delay, entrySnapshotSource, chooseChromiumBinary, buildPersona,
  launchPersonaBrowser, openPage, evaluate, verifyIdentity,
} = require('./native-gate-harness');

const PAGE = `<!doctype html><script>globalThis.first=${entrySnapshotSource};</script>`;
const SNAP = 'globalThis.first';

(async () => {
  const browser = chooseChromiumBinary();

  // Slow server: /slow takes 6s so injection windows overlap navigation.
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push(request.url);
    if (request.url.startsWith('/slow')) {
      setTimeout(() => { response.setHeader('Content-Type', 'text/html'); response.end(PAGE); }, 6000);
    } else { response.setHeader('Content-Type', 'text/html'); response.end(PAGE); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;

  // ---- 1. Drop the worker CDP connection mid-session, then relaunch injection ----
  {
    const persona = buildPersona('native-fault-a', { os: 'Windows' });
    const fp = persona.fingerprint;
    const session = await launchPersonaBrowser(browser, persona);
    try {
      const page = await openPage(session.port, origin + '/one');
      await delay(700);
      const before = await evaluate(page, SNAP, 10000);
      verifyIdentity(before, fp, 'pre-drop');

      // Hard-drop the engine's browser connection (simulates socket death).
      session.item.workerFingerprintConnection?.close();

      // The browser survives; re-run injection on the SAME item (recovery path).
      await session.engine.startWorkerFingerprintInjection(session.item, fp);
      const page2 = await openPage(session.port, origin + '/two');
      let after = null;
      for (let i = 0; i < 60; i += 1) {
        after = await evaluate(page2, `${SNAP} || null`, 5000).catch(() => null);
        if (after) break;
        await delay(150);
      }
      assert.ok(after, 'post-recovery page produced no first read');
      verifyIdentity(after, fp, 'post-recovery');
      console.log('PASS fault cdp-drop recovery keeps persona on relaunch');
    } finally {
      await session.close().catch(() => {});
    }
  }

  // ---- 2. Target destroyed while other tabs live ----
  {
    const persona = buildPersona('native-fault-b', { os: 'Windows' });
    const fp = persona.fingerprint;
    const session = await launchPersonaBrowser(browser, persona);
    try {
      const doomed = await cdp.newTab(session.port, origin + '/doomed');
      const keeper = await cdp.newTab(session.port, origin + '/keeper');
      await delay(500);
      // Kill the doomed tab out from under the engine.
      await cdp.closeTab(session.port, doomed.id).catch(() => {});
      await delay(800);
      // The keeper must still answer with the persona.
      let kept = null;
      for (let i = 0; i < 60; i += 1) {
        kept = await cdp.call(keeper.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: SNAP, returnByValue: true }).then((r) => r.result?.value || null).catch(() => null);
        if (kept) break;
        await delay(150);
      }
      assert.ok(kept, 'keeper tab lost its first read after sibling destruction');
      verifyIdentity(kept, fp, 'keeper');
      // And no fatal browser-wide event was emitted.
      const fatal = session.events.filter((event) => /fingerprint-injection-failed/.test(event.type) && /keeper/.test(String(event.targetType || '')));
      assert.deepEqual(fatal, [], 'keeper must not report injection failure');
      console.log('PASS fault target-destroy isolates to the destroyed target');
      await cdp.closeTab(session.port, keeper.id).catch(() => {});
    } finally {
      await session.close().catch(() => {});
    }
  }

  // ---- 3. Slow navigation: never serve host identity silently ----
  {
    const persona = buildPersona('native-fault-c', { os: 'Windows' });
    const fp = persona.fingerprint;
    const session = await launchPersonaBrowser(browser, persona);
    try {
      const page = await openPage(session.port, origin + '/before-slow');
      await delay(400);
      await evaluate(page, `location.href = '/slow'; true`, 10000).catch(() => {});
      await delay(2500); // mid-navigation through the slow response
      let live = null;
      for (let i = 0; i < 80; i += 1) {
        live = await evaluate(page, `${SNAP} || null`, 5000).catch(() => null);
        if (live) break;
        await delay(200);
      }
      assert.ok(live, 'slow page never produced a first read');
      // Either the persona arrived, or the engine flagged a failure — never raw.
      const rawHost = String(live.ua || '').includes('Linux x86_64') || String(live.platform || '') === 'Linux x86_64';
      if (rawHost) {
        const failures = session.events.filter((event) => /injection-failed/.test(event.type));
        assert.ok(failures.length > 0, 'host identity served on slow navigation WITHOUT any injection-failure event — silent leak');
        console.log('PASS fault slow-nav raw identity was flagged by engine events');
      } else {
        verifyIdentity(live, fp, 'slow-nav');
        console.log('PASS fault slow-nav first read is persona');
      }
    } finally {
      await session.close().catch(() => {});
    }
  }

  // ---- 4. Old session must not overwrite a new persona ----
  {
    // Distinct OS personas already force distinct UA/platform; the network axis
    // is pinned via privacy.network which persona.js honors field-by-field.
    const personaA = buildPersona('native-fault-d', { os: 'Windows', network: { rtt: 111, downlink: 1.1, effectiveType: '3g' } });
    const sessionA = await launchPersonaBrowser(browser, personaA);
    const pageA = await openPage(sessionA.port, origin + '/old');
    await delay(600);
    const firstA = await evaluate(pageA, SNAP, 10000).catch(() => null);
    // Stop A (old task teardown).
    await sessionA.close();

    const personaB = buildPersona('native-fault-d', { os: 'macOS', network: { rtt: 222, downlink: 2.2, effectiveType: '4g' } });
    const fpB = personaB.fingerprint;
    const sessionB = await launchPersonaBrowser(browser, personaB);
    try {
      const pageB = await openPage(sessionB.port, origin + '/new');
      let firstB = null;
      for (let i = 0; i < 60; i += 1) {
        firstB = await evaluate(pageB, `${SNAP} || null`, 5000).catch(() => null);
        if (firstB) break;
        await delay(150);
      }
      assert.ok(firstB, 'new session produced no first read');
      verifyIdentity(firstB, fpB, 'new-session');
      if (firstA) {
        assert.notEqual(firstA.connection.rtt, firstB.connection.rtt, 'old session network persona leaked into the new session');
      }
      console.log('PASS fault old-session identity does not overwrite new session');
    } finally {
      await sessionB.close().catch(() => {});
    }
  }

  console.log('fingerprint-session-faults-selftest: OK');
  await new Promise((resolve) => server.close(resolve));
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});

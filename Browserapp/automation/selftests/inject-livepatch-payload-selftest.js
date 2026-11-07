#!/usr/bin/env node
'use strict';

/**
 * Self-test for the livePatch injection variant.
 *
 * applyFingerprintToTab used to transmit the identical ~3.4 MB source twice
 * per tab: once for Page.addScriptToEvaluateOnNewDocument (future documents)
 * and once for Runtime.evaluate (the already-open document). For ephemeral
 * documents (about:blank before the first real navigation) the evaluated copy
 * now drops the font payload, because the registered document-start script
 * delivers the full bytes on every later navigation.
 *
 * This suite pins:
 *   - the livePatch source is a fraction of the full source and carries no
 *     base64 font payload;
 *   - applyFingerprintToTab sends the full source to document-start and the
 *     stripped source to Runtime.evaluate, only when the caller opts in;
 *   - the fp.fontBlobBridge side effect still follows the FULL script's
 *     laziness policy (no stray bridge binding for non-lazy personas);
 *   - the script cache keeps the two variants separate.
 */

const assert = require('assert');
const path = require('path');
const { buildFingerprint, buildInjectionScript, applyFingerprintToTab, loadFontSubsetPayload } = require('../fingerprint');

const results = [];
function ok(name, cond, detail) {
  results.push({ name, ok: Boolean(cond), detail });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  -> ${detail || ''}`}`);
  if (!cond) process.exitCode = 1;
}

(async () => {
  console.log('Running livePatch injection variant self-tests...\n');

  const fp = buildFingerprint({ id: 'livepatch-test', os: 'windows', timezone: 'America/New_York' });
  const windowsPayload = loadFontSubsetPayload('windows');
  const payloadPresent = Array.isArray(windowsPayload) && windowsPayload.length > 0;
  ok('test persona carries a font list so the payload path is active',
    Boolean(fp.fonts && fp.fonts.list && fp.fonts.list.length), `fonts=${fp.fonts && fp.fonts.list ? fp.fonts.list.length : null}`);

  // ---- variant construction ----
  const full = buildInjectionScript(fp);
  const live = buildInjectionScript(fp, { livePatch: true });

  ok('full source embeds the shared font payload binding',
    full.includes('__obPlatformFontPayload'), `length=${full.length}`);
  ok('livePatch source drops the font payload binding entirely',
    !live.includes('__obPlatformFontPayload'), `length=${live.length}`);
  if (payloadPresent) {
    ok('livePatch source is a small fraction of the full source',
      live.length < full.length * 0.5,
      `live=${live.length} full=${full.length}`);
    ok('full source is multi-megabyte when the platform payload exists',
      full.length > 2 * 1024 * 1024, `full=${full.length}`);
  } else {
    console.log('  note: no font subset assets on this host; size ratio check skipped');
  }
  ok('livePatch source compiles as a function body', (() => {
    try { new Function(live); return true; } catch (_) { return false; }
  })(), 'SyntaxError');

  // ---- cache isolation ----
  const fullAgain = buildInjectionScript(fp);
  const liveAgain = buildInjectionScript(fp, { livePatch: true });
  ok('script cache keeps the full and live variants separate',
    fullAgain === full && liveAgain === live, 'variant sources drifted between builds');

  // ---- applyFingerprintToTab dual-source behaviour ----
  let pageSeq = 0;
  const runApply = async (opts) => {
    const calls = [];
    const pageId = `PAGE${(pageSeq += 1)}`;
    const cdpCall = async (wsUrl, method, params = {}) => {
      calls.push({ method, wsUrl, params });
      if (method === 'Page.addScriptToEvaluateOnNewDocument') return { identifier: `id-${pageId}` };
      return {};
    };
    await applyFingerprintToTab(cdpCall, `ws://127.0.0.1:1/devtools/page/${pageId}`, fp, { privacy: {} }, opts);
    return calls;
  };

  const withLive = await runApply({ livePatchDocument: true });
  const added = withLive.find((c) => c.method === 'Page.addScriptToEvaluateOnNewDocument');
  const evaluated = withLive.find((c) => c.method === 'Runtime.evaluate' && typeof c.params.expression === 'string');
  ok('document-start registration carries the full payload source',
    Boolean(added && added.params.source.includes('__obPlatformFontPayload')), 'payload binding missing');
  ok('live evaluate carries the stripped source',
    Boolean(evaluated && !evaluated.params.expression.includes('__obPlatformFontPayload')
      && evaluated.params.expression.length < added.params.source.length * 0.5),
    evaluated ? `evaluated=${evaluated.params.expression.length} added=${added.params.source.length}` : 'no evaluate call captured');

  const withoutLive = await runApply({ livePatchDocument: false });
  const addedPlain = withoutLive.find((c) => c.method === 'Page.addScriptToEvaluateOnNewDocument');
  const evaluatedPlain = withoutLive.find((c) => c.method === 'Runtime.evaluate' && typeof c.params.expression === 'string');
  ok('without the opt-in, evaluate reuses the full source',
    Boolean(addedPlain && evaluatedPlain
      && evaluatedPlain.params.expression === addedPlain.params.source),
    'sources should be identical for non-ephemeral documents');

  // ---- bridge policy follows the FULL script ----
  // Same token as fp: the full build is a cache hit, so the only writer of
  // fontBlobBridge would have been the livePatch build — it must stay silent.
  const nonLazyFp = { ...fp, lazyPayload: false, lazyFontPayload: false, fontBlobBridge: undefined };
  await runApplyForFp(nonLazyFp, { livePatchDocument: true });
  ok('non-lazy persona keeps fontBlobBridge unset (warm cache, full build wins)',
    nonLazyFp.fontBlobBridge == null, `fontBlobBridge=${JSON.stringify(nonLazyFp.fontBlobBridge)}`);

  // Cold cache: a distinct persona id gives a distinct bridge token, so the full
  // build actually executes and must write the non-lazy policy (null).
  const nonLazyCold = {
    ...buildFingerprint({ id: 'livepatch-nonlazy-cold', os: 'windows', timezone: 'Europe/Berlin' }),
    lazyPayload: false,
    lazyFontPayload: false,
  };
  await runApplyForFp(nonLazyCold, { livePatchDocument: true });
  ok('non-lazy persona keeps fontBlobBridge unset (cold cache, full build writes null)',
    nonLazyCold.fontBlobBridge == null, `fontBlobBridge=${JSON.stringify(nonLazyCold.fontBlobBridge)}`);

  const lazyFp = { ...fp, lazyPayload: true, fontBlobBridge: undefined };
  await runApplyForFp(lazyFp, { livePatchDocument: true });
  ok('lazy persona still advertises the font blob bridge',
    Boolean(lazyFp.fontBlobBridge && lazyFp.fontBlobBridge.channelName && lazyFp.fontBlobBridge.token),
    'bridge object missing');

  async function runApplyForFp(targetFp, opts) {
    const pageId = `PAGE${(pageSeq += 1)}`;
    const cdpCall = async () => ({});
    await applyFingerprintToTab(cdpCall, `ws://127.0.0.1:1/devtools/page/${pageId}`, targetFp, { privacy: {} }, opts);
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nINJECT_LIVEPATCH_SELFTEST ${failed ? 'FAILED' : 'OK'} ${results.length - failed}/${results.length}`);
  if (failed) process.exitCode = 1;
})().catch((err) => {
  console.error('INJECT_LIVEPATCH_SELFTEST crashed:', err);
  process.exit(1);
});

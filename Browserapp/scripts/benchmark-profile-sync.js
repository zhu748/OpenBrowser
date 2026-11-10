#!/usr/bin/env node
'use strict';

/**
 * Reproducible, offline measurement of the profile-sync staging path
 * (engine/profile-sync.js prepareProfileSync) at fleet scale.
 *
 * Modes:
 *   node scripts/benchmark-profile-sync.js                    timings only
 *   node scripts/benchmark-profile-sync.js --save /tmp/g.json  dump golden staging
 *   node scripts/benchmark-profile-sync.js --compare /tmp/g.json  verify refactor
 *     equivalence: every staged round must deep-equal the saved golden
 *     (sorted-key stable serialization, so property order changes are not
 *     reported as behavioral drift).
 *
 * Golden coverage: every prepareProfileSync branch — direct, manual,
 * linked live / deleted / no-store resolution, the linked-auth-edited break,
 * redacted-auth merge, redacted-secrets merge, exit-IP merge, duplicate-id
 * last-write, plus a steady-state no-change round.
 */
const { performance } = require('node:perf_hooks');
const os = require('node:os');
const path = require('node:path');
const { BrowserEngine } = require('../engine');
const { prepareProfileSync } = require('../engine/profile-sync');

const SIZES = (process.env.SYNC_BENCH_SIZES || '1000,5000').split(',').map(Number);
const REPEATS = Number(process.env.SYNC_BENCH_REPEATS || 5);
const COOKIE_KB = 2 * 1024;

function argValue(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }
const SAVE = argValue('--save');
const COMPARE = argValue('--compare');

function buildEngine(withStore = true) {
  const engine = new BrowserEngine({ getPath: () => path.join(os.tmpdir(), 'ob-sync-bench') });
  // 12 extensions, 2 built-in: mirrors a mid-size install; enabledAll emerges
  // from full assignment (listExtensions), exactly like production.
  for (let i = 0; i < 12; i += 1) {
    engine.extensions.set(`ext-${i}`, { id: `ext-${i}`, name: `Ext ${i}`, builtIn: i < 2 });
  }
  if (withStore) {
    engine.proxyStore = {
      get: (id) => ({
        'lib-1': { id: 'lib-1', raw: 'http://lib-user:lib-pass@198.51.100.10:1080', ipChannel: 'ip-api', refreshUrl: '' },
        // Pins the store-sourced field guards in resolve: leading/trailing
        // whitespace raw, unnormalized uppercase ipChannel, >1000-char refreshUrl.
        'lib-2': { id: 'lib-2', raw: '  http://trim-user:trim-pass@203.0.113.88:9999  ', ipChannel: 'IFCONFIG.ME', refreshUrl: 'r'.repeat(1500) },
      })[id],
    };
  }
  return engine;
}

function fleetProfile(i, mode) {
  const host = `203.0.113.${(i % 250) + 1}`;
  const auth = mode === 'redacted' ? '' : `user${i}:pass${i}@`;
  const base = {
    id: `p-${i}`,
    name: `Profile ${i}`,
    number: i + 1,
    os: 'Windows',
    language: 'en-US',
    width: 1280,
    height: 820,
    startUrl: 'https://example.test/start',
    networkMode: 'proxy',
    proxy: `http://${auth}${host}:8080`,
    privacy: { cores: 8, memory: 8, fingerprint: { os: 'Windows' }, customArgs: '' },
    platform: mode === 'redacted'
      ? { type: 'social', name: 'Example', username: `user${i}` }
      : {
        type: 'social', name: 'Example', username: `user${i}`, password: `pw-${i}`, totpSecret: `totp-${i}`,
        accounts: [
          { username: `a${i}`, password: `ap-${i}`, totpSecret: `at-${i}` },
          { username: `b${i}`, password: `bp-${i}`, totpSecret: `bt-${i}` },
        ],
      },
    cookies: mode === 'redacted' ? '' : `c${i % 10}=`.repeat(64).slice(0, COOKIE_KB),
    exitIp: mode === 'redacted' ? undefined : '198.51.100.7',
    exitCountryCode: mode === 'redacted' ? undefined : 'US',
    exitTimezone: mode === 'redacted' ? undefined : 'America/New_York',
    exitCheckedAt: mode === 'redacted' ? undefined : '2026-11-10T00:00:00.000Z',
    exitLatencyMs: mode === 'redacted' ? undefined : 42,
  };
  if (mode === 'redacted') { delete base.exitIp; delete base.exitCountryCode; delete base.exitTimezone; delete base.exitCheckedAt; delete base.exitLatencyMs; }
  return base;
}

function goldenScenario() {
  const full = (id, extra = {}) => ({
    id, name: `G ${id}`, number: 1, os: 'Windows', language: 'en-US', width: 1280, height: 820,
    networkMode: 'proxy', privacy: { cores: 8, memory: 8 }, startUrl: 'https://example.test/start',
    cookies: 'cookie-data', platform: { type: 'social', name: 'Example', username: 'u', password: 'pw', totpSecret: 't', accounts: [{ username: 'a', password: 'ap', totpSecret: 'at' }] },
    exitIp: '198.51.100.7', exitCountryCode: 'US', exitTimezone: 'America/New_York', exitCheckedAt: '2026-11-10T00:00:00.000Z', exitLatencyMs: 42,
    ...extra,
  });
  const roundA = [
    { ...full('g-direct'), networkMode: 'direct', proxy: 'Direct' },
    full('g-manual', { proxy: 'http://mu:mp@203.0.113.10:8080' }),
    full('g-lib-live', { proxyId: 'lib-1', proxy: 'http://198.51.100.10:1080' }),
    full('g-lib-deleted', { proxyId: 'lib-9', proxy: 'http://mu:mp@203.0.113.99:8080' }),
    full('g-lib-live2', { proxyId: 'lib-1', proxy: 'http://198.51.100.10:1080' }),
    // Live resolution with unnormalized store fields: output must carry the
    // trimmed raw, normalized channel and the 1000-char-capped refreshUrl.
    full('g-lib-2', { proxyId: 'lib-2', proxy: 'http://203.0.113.88:9999' }),
    full('g-full', { proxy: 'http://fu:fp@203.0.113.11:8080' }),
    full('g-dupe', { proxy: 'http://du:dp@203.0.113.12:8080' }),
    full('g-dupe', { proxy: 'http://du2:dp2@203.0.113.13:8080' }),
  ];
  const redacted = (id, extra = {}) => ({
    id, name: `G ${id}`, number: 1, os: 'Windows', language: 'en-US', width: 1280, height: 820,
    networkMode: 'proxy', privacy: { cores: 8, memory: 8 }, startUrl: 'https://example.test/start',
    cookies: '', platform: { type: 'social', name: 'Example', username: 'u' }, ...extra,
  });
  const roundB = [
    // redacted auth (same endpoint, no creds) + fully redacted secrets + no exit IP:
    // fires the prevHasAuth merge, the uiLooksRedacted merge and the exit-IP merge.
    redacted('g-manual', { proxy: 'http://203.0.113.10:8080' }),
    redacted('g-full', { proxy: 'http://203.0.113.11:8080' }),
    // linked + redacted incoming: matchesStored keeps the association, resolve
    // re-substitutes the library raw, then the redacted-auth merge restores it.
    redacted('g-lib-live', { proxyId: 'lib-1', proxy: 'http://198.51.100.10:1080' }),
    // Linked + endpoint edited away from both previous and the library: breaks
    // to a manual proxy with the association stripped. g-lib-live2 exists from
    // round A, so this round has the previous state the break branch needs.
    redacted('g-lib-live2', { proxyId: 'lib-1', proxy: 'http://eu:ep@203.0.113.77:8080' }),
    { ...full('g-direct'), networkMode: 'direct', proxy: 'Direct' },
    full('g-dupe', { proxy: 'http://du3:dp3@203.0.113.14:8080' }),
    full('g-dupe', { proxy: 'http://du4:dp4@203.0.113.15:8080' }),
  ];
  return { A: roundA, B: roundB, C: roundB };
}

function runGolden() {
  const engine = buildEngine(true);
  const scenario = goldenScenario();
  const rounds = {};
  for (const key of ['A', 'B', 'C']) {
    const staged = prepareProfileSync(engine, scenario[key]);
    for (const [id, profile] of staged.profiles) engine.profiles.set(id, profile);
    for (const [id, assigned] of staged.assignments) engine.assignments.set(id, assigned);
    rounds[key] = staged;
  }
  // No-store resolution on a store-less engine (proxyId survives, raw kept).
  const engineNoStore = buildEngine(false);
  rounds.D = prepareProfileSync(engineNoStore, [
    { ...goldenScenario().A[2], id: 'g-nostore' },
  ]);
  return rounds;
}

function stable(value) {
  if (value instanceof Map) return ['Map', [...value].map(([k, v]) => [stable(k), stable(v)])];
  if (value instanceof Set) return ['Set', [...value].map(stable)];
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}

function median(values) { const s = [...values].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }

function instrumentSanitize(engine) {
  let calls = 0;
  const original = engine.sanitizeProfile.bind(engine);
  engine.sanitizeProfile = (...args) => { calls += 1; return original(...args); };
  return { count: () => calls };
}

function measureRound(engine, incoming, kind) {
  const meter = instrumentSanitize(engine);
  const times = [];
  for (let r = 0; r < REPEATS; r += 1) {
    if (typeof globalThis.gc === 'function') globalThis.gc();
    const start = performance.now();
    const staged = prepareProfileSync(engine, incoming);
    times.push(performance.now() - start);
    if (kind === 'cold') { // publish so the next round sees a previous
      for (const [id, profile] of staged.profiles) engine.profiles.set(id, profile);
      for (const [id, assigned] of staged.assignments) engine.assignments.set(id, assigned);
    }
  }
  return { medianMs: median(times), minMs: Math.min(...times), sanitizeCalls: Math.round(meter.count() / REPEATS) };
}

function main() {
  if (SAVE || COMPARE) {
    const rounds = runGolden();
    const serialized = JSON.stringify(stable(rounds), null, 1);
    if (SAVE) {
      require('node:fs').writeFileSync(SAVE, serialized);
      console.log(`[golden] saved ${Object.keys(rounds).length} rounds to ${SAVE}`);
      return 0;
    }
    const expected = require('node:fs').readFileSync(COMPARE, 'utf8');
    if (JSON.stringify(JSON.parse(expected)) === JSON.stringify(JSON.parse(serialized))) {
      console.log('[golden] EQUIVALENT: staged output identical to the saved baseline');
    } else {
      console.error('[golden] DRIFT: staged output differs from the saved baseline');
      process.exitCode = 1;
    }
    return process.exitCode || 0;
  }

  console.log(`prepareProfileSync fleet benchmark — Node ${process.version}, repeats=${REPEATS} (median), cookies=${COOKIE_KB}B/profile`);
  for (const size of SIZES) {
    const coldIncoming = Array.from({ length: size }, (_, i) => fleetProfile(i, 'full'));
    const redactedIncoming = Array.from({ length: size }, (_, i) => fleetProfile(i, 'redacted'));
    const cold = measureRound(buildEngine(), coldIncoming, 'cold');
    const warmEngine = buildEngine();
    measureRound(warmEngine, coldIncoming, 'cold'); // establish previous
    const warm = measureRound(warmEngine, redactedIncoming, 'warm');
    const steady = measureRound(warmEngine, redactedIncoming, 'steady');
    for (const [kind, r] of [['cold (first sync)', cold], ['warm (redacted merge)', warm], ['steady (no change)', steady]]) {
      console.log(`N=${String(size).padStart(4)} ${kind.padEnd(21)} median ${r.medianMs.toFixed(1).padStart(7)} ms  min ${r.minMs.toFixed(1).padStart(7)} ms  sanitize/profile ${(r.sanitizeCalls / size).toFixed(2)}`);
    }
  }
  return 0;
}

process.exit(main());

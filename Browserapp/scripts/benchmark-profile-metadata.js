#!/usr/bin/env node
'use strict';

// Compare the previous whole-fleet UI write with revision-checked metadata
// commands using the same real engine, encryption and SQLite persistence.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { BrowserEngine } = require('../engine');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');
const cc = require('../credential-crypto');

async function measure(root, size, lane) {
  const engine = new BrowserEngine({ getPath: () => root });
  engine.sqliteStore = new ProfileStoreSqlite({ dbPath: engine.dbFile });
  engine.usingSqlite = true;
  await engine.sqliteStore.init();
  let sanitizations = 0;
  const sanitize = engine.sanitizeProfile;
  engine.sanitizeProfile = function (...args) { sanitizations++; return sanitize.apply(this, args); };
  try {
    await engine.syncProfiles(Array.from({ length: size }, (_, n) => ({ id: 'p-' + n, name: 'Profile ' + n, number: n + 1, proxy: 'Direct' })));
    const selected = new Set(Array.from({ length: Math.min(10, size) }, (_, n) => 'p-' + n));
    const samples = [];
    let requestBytes = 0, responseBytes = 0, normalized = 0;
    for (let iteration = 0; iteration < 6; iteration++) {
      const note = 'note-' + iteration;
      const payload = lane === 'full'
        ? [...engine.profiles.values()].map((profile) => ({ ...structuredClone(profile), ...(selected.has(profile.id) ? { note } : {}) }))
        : [...selected].map((id) => ({ kind: 'patch', id, baseRev: engine.profiles.revisionOf(id), patch: { note } }));
      const before = sanitizations;
      const start = performance.now();
      const request = JSON.stringify(payload);
      const rows = lane === 'full' ? await engine.syncProfiles(JSON.parse(request))
        : await engine.applyProfileCommands(JSON.parse(request), { delta: true });
      const response = JSON.stringify(rows);
      const elapsed = performance.now() - start;
      if (iteration) {
        samples.push(elapsed);
        requestBytes = Buffer.byteLength(request);
        responseBytes = Buffer.byteLength(response);
        normalized = sanitizations - before;
      }
      if (engine.sqliteStore.getProfile('p-0').note !== note) throw new Error('benchmark did not persist the edit');
    }
    samples.sort((a, b) => a - b);
    return { medianMs: +samples[2].toFixed(2), requestBytes, responseBytes, sanitizedProfiles: normalized };
  } finally { await engine.flushPersistence(); engine.sqliteStore.close(); }
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-metadata-benchmark-'));
  const originalFile = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  cc.setSafeStorageMock({ isEncryptionAvailable: () => false });
  try {
    const reports = [];
    for (const size of [10, 100, 1000]) {
      reports.push({ size, selected: Math.min(10, size),
        full: await measure(path.join(root, size + '-full'), size, 'full'),
        patch: await measure(path.join(root, size + '-patch'), size, 'patch'),
      });
    }
    console.log(JSON.stringify({ node: process.version, samples: 5, warmups: 1,
      note: 'Synthetic profiles; real SQLite and encryption; elapsed includes 50ms persistence coalescing. No desktop rendering is measured.', reports }, null, 2));
  } finally {
    cc.setSafeStorageMock(null);
    cc.resetLocalMasterKeyCache();
    if (originalFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = originalFile;
    await fs.rm(root, { recursive: true, force: true });
  }
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });

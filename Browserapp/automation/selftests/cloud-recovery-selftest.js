'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { BrowserEngine } = require('../../engine');
const { prepareFileRestore, inspectFileRestores, assertProfileRestoreReady } = require('../cloud/file-restore');
const b64 = (value) => Buffer.from(value).toString('base64');

const interruptedRestore = `
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const { prepareFileRestore } = require(process.argv[1]);
  const root = process.argv[2], phase = process.argv[3];
  (async () => {
    const tx = await prepareFileRestore([{ root, files: { 'Network/Cookies': Buffer.from('remote').toString('base64') } }]);
    if (phase === 'prepared') process.exit(71);
    if (phase === 'moved') {
      const rename = fs.rename;
      fs.rename = async (from, to) => {
        await rename(from, to);
        if (from === path.join(root, 'Default/Network/Cookies')) process.exit(71);
      };
    }
    await tx.commit();
    process.exit(71);
  })().catch((error) => { console.error(error); process.exit(1); });
`;

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-cloud-recovery-'));
  const app = { getPath: () => root };
  const engine = new BrowserEngine(app);
  engine.persist = async () => {};
  const profile = (id) => engine.sanitizeProfile({ id, name: id });
  async function populate(id) {
    engine.profiles.set(id, profile(id));
    const profileRoot = engine.profileRoot(id);
    const target = path.join(profileRoot, 'Default/Network/Cookies');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, 'original');
    return { profileRoot, target };
  }
  try {
    const healthy = await populate('healthy');
    const open = fs.open;
    fs.open = async (file, ...args) => {
      const handle = await open(file, ...args);
      if (String(file).endsWith('.new')) handle.sync = async () => { throw new Error('injected staging fsync failure'); };
      return handle;
    };
    try {
      await assert.rejects(prepareFileRestore([{ root: healthy.profileRoot, files: { 'Network/Cookies': b64('remote') } }]), /staging fsync failure/);
    } finally { fs.open = open; }
    assert.equal(await fs.readFile(healthy.target, 'utf8'), 'original', 'failed durable staging never changes live data');
    assert.deepEqual((await inspectFileRestores(healthy.profileRoot)).pending, []);
    for (const phase of ['prepared', 'moved', 'committed']) {
      const id = 'interrupted-' + phase;
      const { profileRoot, target } = await populate(id);
      const child = spawnSync(process.execPath, ['-e', interruptedRestore,
        path.resolve(__dirname, '../cloud/file-restore.js'), profileRoot, phase], { encoding: 'utf8', timeout: 5000 });
      assert.equal(child.status, 71, child.stderr || child.error?.message);
      const report = await inspectFileRestores(profileRoot);
      assert.equal(report.pending.length, 1);
      const manifest = JSON.parse(await fs.readFile(path.join(report.pending[0], 'manifest.json'), 'utf8'));
      assert.equal(manifest[0].target.replace(/\\/g, '/'), 'Default/Network/Cookies');
      if (phase !== 'prepared') assert.equal(await fs.readFile(path.join(report.pending[0], manifest[0].backup), 'utf8'), 'original');
      // A fresh engine has no old in-memory maintenance reservations.
      const restarted = new BrowserEngine(app);
      restarted.profiles.set(id, profile(id));
      restarted._start = restarted._startFirefox = async () => { throw new Error('must not reach a launch pipeline'); };
      for (const family of ['chromium', 'firefox']) {
        await assert.rejects(restarted.start({ ...profile(id), engine: family }), (error) => {
          assert.equal(error.code, 'PROFILE_RECOVERY_REQUIRED');
          assert.deepEqual(error.recoveryDirectories, report.pending);
          return true;
        });
        assert.equal(restarted.starting.size, 0, 'rejected recovery checks release the start barrier');
      }
      await assert.rejects(engine.deleteProfiles(['healthy', id]), { code: 'PROFILE_RECOVERY_REQUIRED' });
      assert.equal(await fs.readFile(healthy.target, 'utf8'), 'original', 'bulk delete validates every profile before deleting any');
      await assert.rejects(engine.clearProfileCacheAndCookies(id), { code: 'PROFILE_RECOVERY_REQUIRED' });
      assert.equal(engine.profileMaintenance.size, 0);
      await assert.rejects(prepareFileRestore([{ root: profileRoot, files: { 'Network/Cookies': b64('again') } }]), { code: 'PROFILE_RECOVERY_REQUIRED' });
      assert.deepEqual((await inspectFileRestores(profileRoot)).pending, report.pending, 'a second restore preserves the original recovery directory');
      if (phase === 'prepared') assert.equal(await fs.readFile(target, 'utf8'), 'original');
      if (phase === 'committed') assert.equal(await fs.readFile(target, 'utf8'), 'remote');
      if (phase === 'moved') await assert.rejects(fs.stat(target), { code: 'ENOENT' });
    }

    for (const outcome of ['commit', 'rollback']) {
      const id = 'cleanup-' + outcome;
      const { profileRoot, target } = await populate(id);
      const tx = await prepareFileRestore([{ root: profileRoot, files: { 'Network/Cookies': b64('remote') } }]);
      await tx.commit();
      const remove = fs.rm;
      fs.rm = async (file, options) => {
        if (path.dirname(file) === profileRoot && path.basename(file).startsWith('.openbrowser-restore-')) {
          throw Object.assign(new Error('injected cleanup failure'), { code: 'EBUSY' });
        }
        return remove(file, options);
      };
      try {
        const warnings = outcome === 'commit' ? await tx.finish() : await tx.rollback();
        assert.equal(warnings.length, 1);
        assert.deepEqual((await inspectFileRestores(profileRoot)).pending, [], 'settled work is safe even when cleanup failed');
      } finally { fs.rm = remove; }
      let launches = 0;
      engine._start = async () => { launches++; return { port: 1 }; };
      await engine.start(profile(id));
      assert.equal(launches, 1);
      assert.equal(await fs.readFile(target, 'utf8'), outcome === 'commit' ? 'remote' : 'original');
      assert.ok((await fs.readdir(profileRoot)).every((name) => !name.startsWith('.openbrowser-restore-')));
    }

    const outside = path.join(root, 'outside');
    await fs.mkdir(outside);
    await fs.writeFile(path.join(outside, 'settled.json'), '{"version":1,"outcome":"committed"}');
    const alias = path.join(healthy.profileRoot, '.openbrowser-restore-alias');
    await fs.symlink(outside, alias, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(assertProfileRestoreReady(healthy.profileRoot), { code: 'PROFILE_RECOVERY_REQUIRED' });
    assert.equal(await fs.readFile(path.join(outside, 'settled.json'), 'utf8'), '{"version":1,"outcome":"committed"}');
    await fs.rm(alias);
    const readdir = fs.readdir;
    let releaseRead;
    let enteredRead;
    const reading = new Promise((resolve) => { enteredRead = resolve; });
    const readGate = new Promise((resolve) => { releaseRead = resolve; });
    fs.readdir = async (directory, options) => {
      if (directory === healthy.profileRoot) { enteredRead(); await readGate; }
      return readdir(directory, options);
    };
    engine._start = async () => { throw new Error('cancelled start reached launch'); };
    try {
      const starting = engine.start(profile('healthy'));
      await reading;
      const stopping = engine.stop('healthy');
      releaseRead();
      await assert.rejects(starting, { code: 'BROWSER_START_CANCELLED' });
      await stopping;
      assert.equal(engine.starting.size, 0, 'cancellation during recovery I/O releases the start barrier');
    } finally { releaseRead(); fs.readdir = readdir; }
    const invalid = path.join(healthy.profileRoot, '.openbrowser-restore-invalid');
    await fs.mkdir(invalid);
    await fs.writeFile(path.join(invalid, 'settled.json'), '{"version":999,"outcome":"committed"}');
    await assert.rejects(assertProfileRestoreReady(healthy.profileRoot), { code: 'PROFILE_RECOVERY_REQUIRED' });
    console.log('CLOUD_RECOVERY_SELFTEST OK (process interruption, both launch families, delete/clear guards, settled cleanup, symlinks)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

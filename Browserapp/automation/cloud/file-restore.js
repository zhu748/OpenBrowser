'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { assertSafeProfileChild, validateProfileRootSecure } = require('../isolation');
const { MAX_BROWSER_DATA_BYTES, MAX_BROWSER_FILE_BYTES, MAX_BROWSER_DATA_FILES } = require('./limits');
const RESTORE_PREFIX = '.openbrowser-restore-';
const SETTLED_MARKER = 'settled.json';
const SETTLED_CONTENTS = new Set(['{"version":1,"outcome":"committed"}', '{"version":1,"outcome":"rolled-back"}']);

async function syncDirectory(directory) {
  // Directory fsync is unsupported on some platforms. File fsync below is
  // strict; directory durability is best effort on those filesystems.
  let handle;
  try { handle = await fs.open(directory, 'r'); await handle.sync(); }
  catch (_) {}
  finally { if (handle) await handle.close().catch(() => {}); }
}

async function writeDurably(file, value) {
  const handle = await fs.open(file, 'wx', 0o600);
  try { await handle.writeFile(value); await handle.sync(); }
  finally { await handle.close(); }
}

/** Old manifests and partial staging are deliberately treated as pending.
 * A settled marker is written only after successful commit or full rollback;
 * those directories contain cleanup leftovers and can be removed safely. */
async function inspectFileRestores(root, { cleanupCompleted = false } = {}) {
  const check = await validateProfileRootSecure(path.dirname(root), root, path.basename(root));
  if (!check.ok) throw new Error('Isolation error: ' + check.message);
  let entries;
  try { entries = await fs.readdir(root, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return { pending: [], cleanupWarnings: [] }; throw error; }
  const pending = [];
  const cleanupWarnings = [];
  for (const entry of entries) {
    if (!entry.name.startsWith(RESTORE_PREFIX)) continue;
    const directory = path.join(root, entry.name);
    let complete = false;
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      try {
        const marker = path.join(directory, SETTLED_MARKER);
        await assertSafeProfileChild(root, marker);
        const stat = await fs.lstat(marker);
        complete = stat.isFile() && stat.size <= 64 && SETTLED_CONTENTS.has(await fs.readFile(marker, 'utf8'));
      } catch (_) { /* missing/unreadable/invalid proof must block startup */ }
    }
    if (!complete) pending.push(directory);
    else if (cleanupCompleted) {
      try { await fs.rm(directory, { recursive: true, force: true }); }
      catch (error) { cleanupWarnings.push({ directory, message: error.message }); }
    }
  }
  return { pending, cleanupWarnings };
}

async function assertProfileRestoreReady(root) {
  const result = await inspectFileRestores(root, { cleanupCompleted: true });
  if (result.pending.length) throw Object.assign(
    new Error('检测到未完成的浏览器数据恢复，请先保留并检查恢复目录：' + result.pending.join(', ')),
    { code: 'PROFILE_RECOVERY_REQUIRED', recoveryDirectories: result.pending },
  );
  return result;
}

function destination(profileRoot, relative) {
  if (typeof relative !== 'string' || relative.includes('\0') || /^[a-z]:/i.test(relative)) throw new Error('备份文件路径无效');
  const parts = relative.replace(/\\/g, '/').split('/');
  if (parts.some((part) => !part || part === '.' || part === '..' || part.includes(':'))) throw new Error('备份文件路径无效');
  return path.join(profileRoot, 'Default', ...parts);
}

/** Stage a whole batch before changing live files. The caller holds the engine
 * maintenance lease until commit, metadata saves and rollback have completed.
 * Backups remain on disk when rollback fails; this is process-local recovery,
 * not a crash-atomic transaction across files and application databases. */
async function prepareFileRestore(selections) {
  const records = [];
  const directories = [];
  let committed = false;
  let settled = false;

  async function cleanup() {
    const warnings = [];
    for (const dir of directories) {
      try { await fs.rm(dir, { recursive: true, force: true }); }
      catch (error) { warnings.push({ directory: dir, message: error.message }); }
    }
    return warnings;
  }

  async function settleAndCleanup(outcome) {
    settled = true;
    const warnings = [];
    for (const parent of new Set(records.map((item) => path.dirname(item.target)))) await syncDirectory(parent);
    for (const directory of directories) {
      try {
        await writeDurably(path.join(directory, SETTLED_MARKER), JSON.stringify({ version: 1, outcome }));
        await syncDirectory(directory);
      } catch (error) { warnings.push({ directory, message: error.message }); }
    }
    return [...warnings, ...await cleanup()];
  }

  async function rollback() {
    if (settled) return;
    const errors = [];
    for (const item of [...records].reverse()) {
      try {
        await assertSafeProfileChild(item.root, item.target);
        if (item.installed) { await fs.rm(item.target, { force: true }); item.installed = false; }
        if (item.moved) { await fs.rename(item.backup, item.target); item.moved = false; }
      } catch (error) { errors.push(error); }
    }
    if (errors.length) {
      throw Object.assign(new AggregateError(errors, '恢复失败且部分原文件未能回滚，请保留恢复目录'), { recoveryDirectories: [...directories] });
    }
    return settleAndCleanup('rolled-back');
  }

  try {
    const seen = new Set();
    for (const { root, files } of selections) {
      if (!files || typeof files !== 'object' || Array.isArray(files)) throw new Error('备份文件列表无效');
      const entries = Object.entries(files);
      if (entries.length > MAX_BROWSER_DATA_FILES) throw new Error('备份文件数量超过安全限制');
      let total = 0;
      // All destinations are validated before even staging the first file.
      for (const [relative, encoded] of entries) {
        const target = destination(root, relative);
        const key = process.platform === 'win32' ? target.toLowerCase() : target;
        if (seen.has(key)) throw new Error('备份包含重复文件路径');
        seen.add(key);
        if (typeof encoded !== 'string') throw new Error('备份文件内容无效');
        const size = Buffer.byteLength(encoded, 'base64');
        if (size > MAX_BROWSER_FILE_BYTES) throw new Error('备份单文件超过安全限制');
        total += size;
        if (total > MAX_BROWSER_DATA_BYTES) throw new Error('备份文件总大小超过安全限制');
        await assertSafeProfileChild(root, target);
        try {
          const stat = await fs.lstat(target);
          if (!stat.isFile()) throw new Error('备份文件目标不是普通文件');
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
        records.push({ root, target, encoded, installed: false, moved: false });
      }
    }
    // Refuse a file that is also another file's parent (including normalized aliases).
    for (const key of seen) {
      let parent = path.dirname(key);
      while (parent !== path.dirname(parent)) {
        if (seen.has(parent)) throw new Error('备份文件路径存在父子冲突');
        parent = path.dirname(parent);
      }
    }
    const stages = new Map();
    const manifests = new Map();
    for (const [index, item] of records.entries()) {
      if (!stages.has(item.root)) {
        await assertProfileRestoreReady(item.root);
        await fs.mkdir(item.root, { recursive: true });
        const dir = await fs.mkdtemp(path.join(item.root, RESTORE_PREFIX));
        directories.push(dir);
        // Make the pending directory durable before any live-file rename.
        await syncDirectory(item.root);
        stages.set(item.root, dir);
        manifests.set(item.root, []);
      }
      const dir = stages.get(item.root);
      item.staged = path.join(dir, `${index}.new`);
      item.backup = path.join(dir, `${index}.previous`);
      await writeDurably(item.staged, Buffer.from(item.encoded, 'base64'));
      delete item.encoded;
      manifests.get(item.root).push({ target: path.relative(item.root, item.target),
        staged: path.basename(item.staged), backup: path.basename(item.backup) });
    }
    // Keep a path manifest beside backups so an interrupted/failed rollback
    // can be recovered without guessing which numeric file belongs where.
    for (const [root, dir] of stages) {
      await writeDurably(path.join(dir, 'manifest.json'), JSON.stringify(manifests.get(root)));
      await syncDirectory(dir);
    }
  } catch (error) {
    const cleanupWarnings = await cleanup();
    if (cleanupWarnings.length) error.cleanupWarnings = cleanupWarnings;
    throw error;
  }

  return {
    count: records.length,
    async commit() {
      if (committed || settled) throw new Error('Restore transaction is no longer pending');
      committed = true;
      for (const item of records) {
        await assertSafeProfileChild(item.root, item.target);
        await fs.mkdir(path.dirname(item.target), { recursive: true });
        await assertSafeProfileChild(item.root, item.target);
        try { await fs.rename(item.target, item.backup); item.moved = true; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        await fs.rename(item.staged, item.target);
        item.installed = true;
      }
    },
    rollback,
    async finish() {
      if (!committed || settled || records.some((item) => !item.installed)) throw new Error('Restore transaction is not committed');
      return settleAndCleanup('committed');
    },
  };
}

module.exports = { prepareFileRestore, inspectFileRestores, assertProfileRestoreReady };

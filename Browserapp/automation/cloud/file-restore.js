'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { assertSafeProfileChild } = require('../isolation');
const { MAX_BROWSER_DATA_BYTES, MAX_BROWSER_FILE_BYTES, MAX_BROWSER_DATA_FILES } = require('./limits');

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
    settled = true;
    return cleanup();
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
        await fs.mkdir(item.root, { recursive: true });
        const dir = await fs.mkdtemp(path.join(item.root, '.openbrowser-restore-'));
        stages.set(item.root, dir);
        manifests.set(item.root, []);
        directories.push(dir);
      }
      const dir = stages.get(item.root);
      item.staged = path.join(dir, `${index}.new`);
      item.backup = path.join(dir, `${index}.previous`);
      await fs.writeFile(item.staged, Buffer.from(item.encoded, 'base64'), { mode: 0o600, flag: 'wx' });
      delete item.encoded;
      manifests.get(item.root).push({ target: path.relative(item.root, item.target),
        staged: path.basename(item.staged), backup: path.basename(item.backup) });
    }
    // Keep a path manifest beside backups so an interrupted/failed rollback
    // can be recovered without guessing which numeric file belongs where.
    for (const [root, dir] of stages) {
      await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifests.get(root)), { mode: 0o600, flag: 'wx' });
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
      if (!committed || settled) throw new Error('Restore transaction is not committed');
      settled = true;
      return cleanup();
    },
  };
}

module.exports = { prepareFileRestore };

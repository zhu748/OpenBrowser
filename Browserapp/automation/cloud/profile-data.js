'use strict';

const fsp = require('node:fs/promises');
const path = require('node:path');
const { assertSafeProfileChild } = require('../isolation');
const { browserBackupCandidates } = require('../browser-data');
const { MAX_BROWSER_DATA_BYTES, MAX_BROWSER_FILE_BYTES, MAX_BROWSER_DATA_FILES } = require('./limits');

async function collectProfileDataFiles(profileRoot, profile, limits = {}) {
  const advanced = profile.advanced || {};
  const files = {};
  if (!profileRoot) return files;
  // Only pack browser data when this environment opts into cloud backup
  if (!advanced.cloudBackup) return files;
  const candidates = await browserBackupCandidates(profileRoot, profile);
  const maxFile = limits.maxFileBytes ?? MAX_BROWSER_FILE_BYTES;
  const maxTotal = limits.maxTotalBytes ?? MAX_BROWSER_DATA_BYTES;
  // Match the restore limit so every newly produced package is restorable.
  const maxFiles = limits.maxFiles ?? MAX_BROWSER_DATA_FILES;
  if (maxFile <= 0 || maxTotal <= 0 || maxFiles <= 0) { limits.onSkipped?.({ path: '.', reason: 'capacity' }); return files; }
  let total = 0;
  let count = 0;
  const skip = (relative, reason) => limits.onSkipped?.({ path: relative.replace(/\\/g, '/'), reason });

  async function walk(rel, abs) {
    if (total >= maxTotal || count >= maxFiles) { skip(rel, 'capacity'); return; }
    let st;
    try { st = await fsp.lstat(abs); } catch (error) { if (error.code !== 'ENOENT') skip(rel, error.code || 'unreadable'); return; }
    if (st.isSymbolicLink()) { skip(rel, 'symbolic-link'); return; }
    if (st.isFile()) {
      if (st.size > maxFile || total + st.size > maxTotal) { skip(rel, 'size-limit'); return; }
      if (['Network/Cookies', 'Login Data'].includes(rel.replace(/\\/g, '/')) || /\.sqlite$|\.db$/.test(rel)) {
        // Copying the main DB alone silently loses uncheckpointed rows.
        // Host-backed builds hold a stopped-profile lease; orphan WALs after
        // a crash still require a clean browser shutdown before a raw backup.
        try {
          if ((await fsp.stat(abs + '-wal')).size > 0) throw Object.assign(new Error('请先启动并正常关闭环境，再备份尚有 WAL 数据的数据库：' + rel), { code: 'PROFILE_BACKUP_BUSY' });
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      await assertSafeProfileChild(profileRoot, abs);
      const limit = Math.min(maxFile, maxTotal - total);
      const handle = await fsp.open(abs, 'r');
      let buf;
      try {
        const chunks = [];
        let size = 0;
        // A live browser can grow a file after lstat. Bound the actual read,
        // rather than trusting an earlier size or buffering the whole file.
        for await (const chunk of handle.createReadStream({ end: limit, autoClose: false })) {
          size += chunk.length;
          if (size > limit) { skip(rel, 'file-grew'); return; }
          chunks.push(chunk);
        }
        buf = Buffer.concat(chunks, size);
      } finally { await handle.close(); }
      files[rel.replace(/\\/g, '/')] = buf.toString('base64');
      total += buf.length;
      count += 1;
      return;
    }
    if (!st.isDirectory()) return;
    const entries = await fsp.readdir(abs).catch((error) => { skip(rel, error.code || 'unreadable'); return []; });
    for (const name of entries) {
      if (total >= maxTotal || count >= maxFiles) { skip(rel, 'capacity'); break; }
      if (name === '.' || name === '..') continue;
      await walk(path.join(rel, name), path.join(abs, name));
    }
  }

  for (const [rel, abs] of candidates) {
    await walk(rel, abs);
  }
  return files;
}

async function restoreProfileDataFiles(profileRoot, files) {
  const { prepareFileRestore } = require('./file-restore');
  const transaction = await prepareFileRestore([{ root: profileRoot, files: files || {} }]);
  try { await transaction.commit(); }
  catch (error) {
    try { await transaction.rollback(); }
    catch (rollbackError) { throw new AggregateError([error, rollbackError], '浏览器文件恢复及回滚失败'); }
    throw error;
  }
  const warnings = await transaction.finish();
  if (warnings.length) console.warn('[cloud] restore staging cleanup failed:', warnings);
  return transaction.count;
}

module.exports = { collectProfileDataFiles, restoreProfileDataFiles };

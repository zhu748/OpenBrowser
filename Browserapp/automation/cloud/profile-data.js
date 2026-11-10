'use strict';

const fsp = require('node:fs/promises');
const path = require('node:path');
const { assertSafeProfileChild } = require('../isolation');
const { MAX_BROWSER_DATA_BYTES, MAX_BROWSER_FILE_BYTES, MAX_BROWSER_DATA_FILES } = require('./limits');

async function collectProfileDataFiles(profileRoot, profile, limits = {}) {
  const advanced = profile.advanced || {};
  const files = {};
  if (!profileRoot) return files;
  // Only pack browser data when this environment opts into cloud backup
  if (!advanced.cloudBackup) return files;
  const defaultDir = path.join(profileRoot, 'Default');
  const candidates = [];
  // Cookies always included when cloud backup is on (close-time Cookie sync)
  if (advanced.syncCookiesOnClose !== false || advanced.saveCookies !== false) {
    candidates.push(['Network/Cookies', path.join(defaultDir, 'Network', 'Cookies')]);
    candidates.push(['Network/Cookies-journal', path.join(defaultDir, 'Network', 'Cookies-journal')]);
  }
  if (advanced.syncLocalStorage) {
    candidates.push(['Local Storage', path.join(defaultDir, 'Local Storage')]);
  }
  if (advanced.syncIndexedDB) {
    candidates.push(['IndexedDB', path.join(defaultDir, 'IndexedDB')]);
  }
  if (advanced.syncPasswords) {
    candidates.push(['Login Data', path.join(defaultDir, 'Login Data')]);
    candidates.push(['Login Data-journal', path.join(defaultDir, 'Login Data-journal')]);
  }
  if (advanced.syncExtensionData) {
    candidates.push(['Local Extension Settings', path.join(defaultDir, 'Local Extension Settings')]);
    candidates.push(['Extension State', path.join(defaultDir, 'Extension State')]);
  }
  const maxFile = limits.maxFileBytes ?? MAX_BROWSER_FILE_BYTES;
  const maxTotal = limits.maxTotalBytes ?? MAX_BROWSER_DATA_BYTES;
  // Match the restore limit so every newly produced package is restorable.
  const maxFiles = limits.maxFiles ?? MAX_BROWSER_DATA_FILES;
  if (maxFile <= 0 || maxTotal <= 0 || maxFiles <= 0) return files;
  let total = 0;
  let count = 0;

  async function walk(rel, abs) {
    if (total >= maxTotal || count >= maxFiles) return;
    let st;
    try { st = await fsp.lstat(abs); } catch (_) { return; }
    if (st.isSymbolicLink()) return;
    if (st.isFile()) {
      if (st.size > maxFile || total + st.size > maxTotal) return;
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
          if (size > limit) return;
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
    const entries = await fsp.readdir(abs).catch(() => []);
    for (const name of entries) {
      if (total >= maxTotal || count >= maxFiles) break;
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

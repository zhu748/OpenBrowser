'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SQLITE_HEADER = Buffer.from('SQLite format 3\0', 'ascii');

function invalidHistoryBackup(cause) {
  return Object.assign(new Error('历史记录备份不是完整的 SQLite 数据库，未替换原数据', { cause }), {
    code: 'INVALID_HISTORY_BACKUP',
  });
}

function checkSnapshot(file) {
  const { DatabaseSync } = require('node:sqlite');
  let db;
  try {
    // A checkpointed WAL database still declares WAL mode in its header.
    // Read the isolated snapshot alone, without creating WAL/SHM files or
    // using any recovery data from the live profile.
    const uri = pathToFileURL(file);
    uri.searchParams.set('immutable', '1');
    // SQLite does not accept arbitrary URI authorities on all builds. An
    // isolated restore stage on a Windows network share can use its native path.
    db = new DatabaseSync(uri.host ? file : uri.href, { readOnly: true, allowExtension: false });
    db.exec('PRAGMA trusted_schema=OFF');
    if (db.prepare('PRAGMA quick_check(1)').get()?.quick_check !== 'ok') throw new Error('SQLite quick_check failed');
  } catch (cause) {
    throw invalidHistoryBackup(cause);
  } finally { db?.close(); }
}

// Validate the same bytes in both directions. The restore transaction already
// has an isolated stage; export checks a private copy, never the live file.
async function assertChromiumHistorySnapshot(data, stagedFile) {
  if (data.length < 100 || !data.subarray(0, SQLITE_HEADER.length).equals(SQLITE_HEADER)) throw invalidHistoryBackup();
  if (stagedFile) return checkSnapshot(stagedFile);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'openbrowser-history-check-'));
  try {
    const file = path.join(dir, 'History');
    await fs.writeFile(file, data, { flag: 'wx', mode: 0o600 });
    checkSnapshot(file);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
}

module.exports = { assertChromiumHistorySnapshot, invalidHistoryBackup };

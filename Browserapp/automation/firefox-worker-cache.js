'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { writeRawAtomically } = require('../engine/state-storage');

// Firefox persists prefixed Service Worker programs separately from the HTTP
// cache. no-store and a new proxy source cannot update a program it never
// fetches again. Run only while the profile lock is held and Firefox is stopped.
async function prepareFirefoxWorkerCache(root, source) {
  if (typeof source !== 'string' || !source) throw Error('Firefox worker source is required');
  const file = path.join(root, 'openbrowser-worker-cache.json');
  const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
  let previous;
  try {
    const stat = await fs.lstat(file);
    if (stat.isFile() && stat.size <= 1024) {
      try { previous = JSON.parse(await fs.readFile(file, 'utf8')); }
      catch (error) { if (!(error instanceof SyntaxError)) throw error; }
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous?.version === 1 && previous.sourceHash === sourceHash) return { reset: false };
  // Drop registration metadata, not origin storage. Websites register again
  // through the current forwarder; their cookies/IDB/CacheStorage stay intact.
  await fs.rm(path.join(root, 'serviceworker.txt'), { force: true });
  await writeRawAtomically(file, JSON.stringify({ version: 1, sourceHash }) + '\n');
  return { reset: true };
}

module.exports = { prepareFirefoxWorkerCache };

'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

// These are the restore-state and state-storage atomic writer filenames.
// The probe is intentionally presence-only; journal payloads are not paths.
const CLOUD_RECOVERY_NAME = /^cloud-restore-pending\.obstate(?:\.bak)?(?:\.tmp-\d+-[0-9a-f]{16})?$/i;
const DELETION_PREFIX = '.openbrowser-delete-';

const directoryKey = directory => process.platform === 'win32' ? directory.toLowerCase() : directory;

async function directoryIdentity(directory, allowMissing = false) {
  let stat;
  try { stat = await fs.lstat(directory, { bigint: true }); }
  catch (error) {
    if (allowMissing && error.code === 'ENOENT') return null;
    throw error;
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()
    || directoryKey(await fs.realpath(directory)) !== directoryKey(directory)) {
    throw new Error('Invalid or redirected recovery directory');
  }
  return { dev: stat.dev, ino: stat.ino };
}

function assertSameIdentity(before, after) {
  if (before.dev !== after.dev || before.ino !== after.ino) {
    throw new Error('Recovery directory changed during inspection');
  }
}

/** Called only with host-owned userData and a reserved active/candidate root. */
function createProfileRootRecoveryProbe({ userData, current, candidate }) {
  const directories = new Map();
  for (const [value, role] of [[userData, 'cloud'], [current, 'current'], [candidate, 'candidate']]) {
    const directory = path.resolve(value);
    const key = directoryKey(directory);
    if (!directories.has(key)) directories.set(key, { directory });
    directories.get(key)[role] = true;
  }
  const observed = new Map();
  let candidateAncestor;

  return async function probe({ allowMissingCandidate = false } = {}) {
    try {
      for (const item of directories.values()) {
        const { directory, cloud, current, candidate } = item;
        const missingAllowed = allowMissingCandidate && candidate && !cloud && !current;
        const identity = await directoryIdentity(directory, missingAllowed);
        if (!identity) {
          // A new directory may be created, but not through an existing
          // redirected ancestor. Inspect metadata only, not ancestor contents.
          let ancestor = path.dirname(directory);
          while (true) {
            const parent = await directoryIdentity(ancestor, path.dirname(ancestor) !== ancestor);
            if (parent) { candidateAncestor = { directory: ancestor, identity: parent }; break; }
            ancestor = path.dirname(ancestor);
          }
          continue;
        }
        if (observed.has(directory)) assertSameIdentity(observed.get(directory), identity);
        const names = await fs.readdir(directory);
        assertSameIdentity(identity, await directoryIdentity(directory));
        observed.set(directory, identity);
        if (names.some(name => (cloud && CLOUD_RECOVERY_NAME.test(name))
          || ((current || candidate) && directoryKey(name).startsWith(DELETION_PREFIX)))) {
          throw Object.assign(new Error('检测到未处理的恢复记录，未更改环境数据目录。请先完成恢复，再重试。'),
            { code: 'PROFILE_ROOT_RECOVERY_PENDING' });
        }
      }
      if (candidateAncestor) {
        assertSameIdentity(candidateAncestor.identity, await directoryIdentity(candidateAncestor.directory));
      }
    } catch (cause) {
      if (cause.code === 'PROFILE_ROOT_RECOVERY_PENDING') throw cause;
      throw Object.assign(new Error('无法确认环境数据恢复状态，未更改数据目录。请确认目录可访问后重试。', { cause }),
        { code: 'PROFILE_ROOT_RECOVERY_UNAVAILABLE' });
    }
  };
}

module.exports = { createProfileRootRecoveryProbe };

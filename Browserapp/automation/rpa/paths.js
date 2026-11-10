'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const OUTPUT_DIRECTORY = path.join(process.cwd(), 'rpa-output');

function isPathInsideRoot(candidate, root) {
  const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
  const child = normalize(path.resolve(candidate)); const base = normalize(path.resolve(root));
  return child === base || child.startsWith(base + path.sep);
}

/** Resolve existing ancestors too, so new files cannot escape via a linked parent. */
function physicalPath(candidate) {
  let current = path.resolve(candidate);
  const missing = [];
  for (;;) {
    try { return path.join(fs.realpathSync.native(current), ...missing.reverse()); }
    catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
      try {
        if (fs.lstatSync(current).isSymbolicLink()) throw new Error('RPA file path contains an unresolved symbolic link');
      } catch (statError) {
        if (!['ENOENT', 'ENOTDIR'].includes(statError.code)) throw statError;
      }
      const parent = path.dirname(current);
      if (parent === current) throw error;
      missing.push(path.basename(current));
      current = parent;
    }
  }
}

function resolveSafeRpaPath(filePath, { extraRoots = [] } = {}) {
  const raw = String(filePath || '').trim();
  if (!raw) throw new Error('file path required');
  if (raw.includes('\0')) throw new Error('invalid file path');
  const roots = [OUTPUT_DIRECTORY, ...extraRoots].map((root) => path.resolve(root));
  const resolved = path.resolve(OUTPUT_DIRECTORY, raw);
  const allowed = roots.filter((root) => isPathInsideRoot(resolved, root));
  if (!allowed.length) throw new Error('RPA file path must be inside the RPA output directory');
  const actual = physicalPath(resolved);
  if (!allowed.some((root) => isPathInsideRoot(actual, physicalPath(root)))) {
    throw new Error('RPA file path escapes the output directory through a symbolic link');
  }
  return resolved;
}

async function resolveSpreadsheetPath(filePath) {
  const raw = String(filePath || '').trim();
  if (!raw) throw new Error('useExcel requires a CSV or JSON file path');
  if (raw.includes('\0')) throw new Error('invalid file path');

  const home = os.homedir();
  const userProfile = process.env.USERPROFILE || home;
  const folderNames = ['Desktop', 'Documents', 'Downloads'];
  // Only the named subfolders are allowed roots. The bare base directory is
  // intentionally excluded (see doc comment above).
  const expandFolderRoots = (base) => {
    const roots = [];
    for (const name of folderNames) {
      roots.push(path.join(base, name));
      // OneDrive Known Folder Move: Desktop may live under OneDrive\Desktop
      roots.push(path.join(base, 'OneDrive', name));
      roots.push(path.join(base, 'OneDrive - Personal', name));
    }
    return roots;
  };

  const candidates = [];
  if (path.isAbsolute(raw)) {
    candidates.push(path.resolve(raw));
  } else {
    candidates.push(path.resolve(OUTPUT_DIRECTORY, raw));
    candidates.push(path.resolve(home, raw));
    for (const name of folderNames) {
      candidates.push(path.resolve(home, name, raw));
    }
    if (process.platform === 'win32') {
      candidates.push(path.resolve(userProfile, raw));
      for (const name of folderNames) {
        candidates.push(path.resolve(userProfile, name, raw));
        candidates.push(path.resolve(userProfile, 'OneDrive', name, raw));
        candidates.push(path.resolve(userProfile, 'OneDrive - Personal', name, raw));
      }
    }
  }

  const allowedRoots = [
    OUTPUT_DIRECTORY,
    ...expandFolderRoots(home),
  ];
  if (process.platform === 'win32') {
    for (const root of expandFolderRoots(userProfile)) {
      if (!allowedRoots.includes(root)) allowedRoots.push(root);
    }
  }
  let lastError = null;
  for (const candidate of candidates) {
    try { resolveSafeRpaPath(candidate, { extraRoots: allowedRoots }); }
    catch (_) {
      lastError = new Error('useExcel path is outside allowed folders (Desktop/Documents/Downloads/rpa-output)');
      continue;
    }
    try {
      await fsp.access(candidate);
      return candidate;
    } catch (_error) {
      lastError = new Error('useExcel file not found: ' + candidate);
    }
  }
  throw lastError || new Error('useExcel requires a CSV or JSON file path');
}

module.exports = { OUTPUT_DIRECTORY, isPathInsideRoot, resolveSafeRpaPath, resolveSpreadsheetPath };

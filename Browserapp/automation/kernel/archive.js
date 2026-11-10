'use strict';

// Archive validation and extraction are independent of kernel selection/lifecycle.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);
const MAX_ARCHIVE_ENTRIES = 100000;

function validateArchiveMemberName(value) {
  const name = String(value || '').replace(/\\/g, '/');
  if (!name || name.includes('\0') || name.startsWith('/') || /^[A-Za-z]:\//.test(name)) {
    throw new Error('Kernel archive contains an absolute or invalid path');
  }
  const parts = name.split('/').filter(Boolean);
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
  if (parts.some((part) => part === '..' || part.includes(':') || /[. ]$/.test(part) || reserved.test(part))) {
    throw new Error('Kernel archive contains an unsafe path segment');
  }
  return name;
}

async function preflightArchiveMembers(archivePath, kind) {
  if (kind === 'dmg') return;
  let stdout;
  if (kind === 'zip') {
    if (process.platform === 'win32') {
      const escaped = archivePath.replace(/'/g, "''");
      const script = [
        'Add-Type -AssemblyName System.IO.Compression.FileSystem',
        `$z=[System.IO.Compression.ZipFile]::OpenRead('${escaped}')`,
        "try { $z.Entries | ForEach-Object { $mode=($_.ExternalAttributes -shr 16) -band 0xF000; \"$($_.FullName)`t$mode\" } } finally { $z.Dispose() }",
      ].join('; ');
      ({ stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', script], {
        windowsHide: true,
        maxBuffer: 32 * 1024 * 1024,
      }));
      const rows = String(stdout || '').split(/\r?\n/).filter(Boolean);
      if (!rows.length || rows.length > MAX_ARCHIVE_ENTRIES) throw new Error('Kernel archive entry count is invalid');
      for (const row of rows) {
        const split = row.lastIndexOf('\t');
        const name = split >= 0 ? row.slice(0, split) : row;
        const mode = split >= 0 ? Number(row.slice(split + 1)) : 0;
        validateArchiveMemberName(name);
        if (mode === 0xA000) throw new Error('Kernel ZIP contains a symbolic link');
      }
      return;
    } else {
      ({ stdout } = await execFileAsync('unzip', ['-Z1', archivePath], { maxBuffer: 32 * 1024 * 1024 }));
      const names = String(stdout || '').split(/\r?\n/).filter(Boolean);
      if (!names.length || names.length > MAX_ARCHIVE_ENTRIES) throw new Error('Kernel archive entry count is invalid');
      for (const name of names) validateArchiveMemberName(name);
      const listing = await execFileAsync('unzip', ['-Z', '-l', archivePath], { maxBuffer: 32 * 1024 * 1024 });
      if (String(listing.stdout || '').split(/\r?\n/).some((line) => /^l[rwx-]{9}\s/.test(line))) {
        throw new Error('Kernel ZIP contains a symbolic link');
      }
      return;
    }
  } else {
    ({ stdout } = await execFileAsync('tar', ['-tf', archivePath], { maxBuffer: 32 * 1024 * 1024 }));
    const names = String(stdout || '').split(/\r?\n/).filter(Boolean);
    if (!names.length || names.length > MAX_ARCHIVE_ENTRIES) throw new Error('Kernel archive entry count is invalid');
    for (const name of names) validateArchiveMemberName(name);
    const listing = await execFileAsync('tar', ['-tvf', archivePath], { maxBuffer: 32 * 1024 * 1024 });
    if (String(listing.stdout || '').split(/\r?\n/).some((line) => line[0] === 'l' || line[0] === 'h')) {
      throw new Error('Kernel TAR contains a link');
    }
    return;
  }
}

async function assertSafeExtractedTree(root) {
  const base = await fsp.realpath(root);
  const stack = [base];
  let count = 0;
  while (stack.length) {
    const dir = stack.pop();
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      count += 1;
      if (count > MAX_ARCHIVE_ENTRIES) throw new Error('Extracted kernel contains too many files');
      const full = path.join(dir, entry.name);
      const stat = await fsp.lstat(full);
      if (stat.isSymbolicLink()) {
        const target = await fsp.realpath(full).catch(() => null);
        if (!target || !isPathInsideRoot(target, base)) throw new Error('Extracted kernel contains an unsafe link');
        continue;
      }
      if (stat.isDirectory()) stack.push(full);
      else if (!stat.isFile()) throw new Error('Extracted kernel contains a special file');
    }
  }
}

function isPathInsideRoot(candidate, root) {
  const child = path.resolve(candidate);
  const base = path.resolve(root);
  const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
  return normalize(child) === normalize(base) || normalize(child).startsWith(normalize(base) + path.sep);
}

function safeInstalledBinary(candidate, root) {
  if (!candidate || !root) return null;
  const lexical = path.resolve(candidate);
  const base = path.resolve(root);
  if (!isPathInsideRoot(lexical, base)) return null;
  try {
    const linkStat = fs.lstatSync(lexical);
    if (linkStat.isSymbolicLink() || !linkStat.isFile()) return null;
    const real = fs.realpathSync.native(lexical);
    const realBase = fs.realpathSync.native(base);
    return isPathInsideRoot(real, realBase) ? lexical : null;
  } catch (_) {
    return null;
  }
}

async function extractZip(zipPath, destDir) {
  await preflightArchiveMembers(zipPath, 'zip');
  await new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      const ps = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`;
      execFile('powershell.exe', ['-NoProfile', '-Command', ps], { windowsHide: true }, (err) => (err ? reject(err) : resolve()));
      return;
    }
    execFile('unzip', ['-o', '-q', zipPath, '-d', destDir], (err) => {
      if (err) {
        if (process.platform === 'darwin') {
          execFile('ditto', ['-x', '-k', zipPath, destDir], (e2) => (e2 ? reject(err) : resolve()));
          return;
        }
        return reject(err);
      }
      resolve();
    });
  });
  await assertSafeExtractedTree(destDir);
}

async function extractDeb(debPath, destDir) {
  if (process.platform !== 'linux') throw new Error('DEB 仅支持 Linux');
  await execFileAsync('dpkg-deb', ['-x', debPath, destDir]);
  // Keep only /opt/google/chrome. The Debian package also contains system-wide
  // launchers/cron hooks with absolute symlinks that are irrelevant here.
  for (const systemPath of ['usr', 'etc']) {
    await fsp.rm(path.join(destDir, systemPath), { recursive: true, force: true });
  }
  await assertSafeExtractedTree(destDir);
}

async function extractMsi(msiPath, destDir) {
  if (process.platform !== 'win32') throw new Error('MSI 仅支持 Windows');
  await execFileAsync('msiexec.exe', ['/a', msiPath, `/qn`, '/norestart', `TARGETDIR=${destDir}`], {
    windowsHide: true,
    timeout: 120000,
  });
  await assertSafeExtractedTree(destDir);
}

async function extractTarXz(archivePath, destDir) {
  await preflightArchiveMembers(archivePath, 'tar.xz');
  await execFileAsync('tar', ['-xJf', archivePath, '-C', destDir]);
  await assertSafeExtractedTree(destDir);
}

async function extractTarGz(archivePath, destDir) {
  await preflightArchiveMembers(archivePath, 'tar.gz');
  await execFileAsync('tar', ['-xzf', archivePath, '-C', destDir]);
  await assertSafeExtractedTree(destDir);
}

/**
 * macOS: mount DMG, copy first .app into destDir, detach.
 * High-level DMG extract helper for macOS kernel archives.
 */
async function extractDmg(dmgPath, destDir) {
  if (process.platform !== 'darwin') throw new Error('DMG 仅支持 macOS');
  const mountRoot = path.join(destDir, '_dmg_mount');
  await fsp.mkdir(mountRoot, { recursive: true });
  let mountPoint = null;
  try {
    const { stdout } = await execFileAsync('hdiutil', [
      'attach', dmgPath, '-nobrowse', '-readonly', '-mountroot', mountRoot,
    ], { maxBuffer: 4 * 1024 * 1024 });
    // Prefer scanning mountRoot for .app; fallback parse plist-ish output for /Volumes/
    const entries = await fsp.readdir(mountRoot, { withFileTypes: true }).catch(() => []);
    const vol = entries.find((e) => e.isDirectory());
    if (vol) mountPoint = path.join(mountRoot, vol.name);
    if (!mountPoint) {
      const m = String(stdout || '').match(/\/Volumes\/[^\n\t]+/);
      if (m) mountPoint = m[0].trim();
    }
    if (!mountPoint || !fs.existsSync(mountPoint)) throw new Error('无法挂载 DMG');

    const apps = (await fsp.readdir(mountPoint, { withFileTypes: true }))
      .filter((e) => e.isDirectory() && e.name.endsWith('.app'))
      .map((e) => path.join(mountPoint, e.name));
    if (!apps.length) throw new Error('DMG 内未找到 .app');

    const appName = path.basename(apps[0]);
    const targetApp = path.join(destDir, appName);
    await fsp.rm(targetApp, { recursive: true, force: true }).catch(() => {});
    // ditto preserves resource forks / codesign better than cp -R
    await execFileAsync('ditto', [apps[0], targetApp]);
    await assertSafeExtractedTree(targetApp);
  } finally {
    // detach everything under mountRoot
    try {
      const kids = await fsp.readdir(mountRoot).catch(() => []);
      for (const name of kids) {
        await execFileAsync('hdiutil', ['detach', path.join(mountRoot, name), '-quiet']).catch(() => {});
      }
      await execFileAsync('hdiutil', ['detach', mountRoot, '-quiet']).catch(() => {});
    } catch (_) {}
    await fsp.rm(mountRoot, { recursive: true, force: true }).catch(() => {});
  }
}

function archiveKindFromUrl(url) {
  const u = String(url || '').toLowerCase();
  if (u.endsWith('.deb')) return 'deb';
  if (u.endsWith('.msi')) return 'msi';
  if (u.endsWith('.dmg')) return 'dmg';
  if (u.endsWith('.tar.xz') || u.endsWith('.txz')) return 'tar.xz';
  if (u.endsWith('.tar.gz') || u.endsWith('.tgz')) return 'tar.gz';
  if (u.endsWith('.zip')) return 'zip';
  if (u.includes('.dmg')) return 'dmg';
  if (u.includes('.tar.xz')) return 'tar.xz';
  if (u.includes('.zip')) return 'zip';
  return 'zip';
}

module.exports = {
  validateArchiveMemberName,
  preflightArchiveMembers,
  assertSafeExtractedTree,
  isPathInsideRoot,
  safeInstalledBinary,
  extractZip,
  extractDeb,
  extractMsi,
  extractTarXz,
  extractTarGz,
  extractDmg,
  archiveKindFromUrl
};

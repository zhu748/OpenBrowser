#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function info(file) {
  return fs.lstatSync(file, { throwIfNoEntry: false });
}

function hostEntry(platform, branded) {
  const name = branded ? 'OpenBrowser' : 'Electron';
  if (platform === 'darwin') return [name + '.app', 'Contents', 'MacOS', name];
  const binary = branded ? name : 'electron';
  if (platform === 'win32') return [binary + '.exe'];
  if (platform === 'linux') return [binary];
  throw new Error('Unsupported desktop host platform: ' + platform);
}

function ordinaryDirectory(directory) {
  if (!info(directory)?.isDirectory()) throw new Error('Missing ordinary desktop runtime directory: ' + directory);
}

function ordinaryFile(file, executable = false) {
  const stat = info(file);
  if (!stat?.isFile() || !stat.size || (executable && !(stat.mode & 0o111))) {
    throw new Error('Missing ordinary ' + (executable ? 'executable' : 'file') + ' in desktop runtime: ' + file);
  }
  return stat;
}

function exactEntry(root, parts, platform) {
  let file = root;
  ordinaryDirectory(file);
  for (const part of parts.slice(0, -1)) {
    file = path.join(file, part);
    ordinaryDirectory(file);
  }
  file = path.join(file, parts.at(-1));
  ordinaryFile(file, platform !== 'win32');
  return file;
}

// These are bounded structural checks, not proof that the application boots.
// In particular, Linux PIE executables use ET_DYN like shared libraries;
// demand a real nonzero entry point and the program interpreter for PIE.
function assertHostImage(file, platform, arch = process.arch) {
  const target = /^(?:x64|x86_64|amd64)$/iu.test(arch) ? 'x64'
    : /^(?:arm64|aarch64)$/iu.test(arch) ? 'arm64' : null;
  if (!target) throw new Error('Unsupported desktop host architecture: ' + arch);
  const stat = ordinaryFile(file, platform !== 'win32');
  const fd = fs.openSync(file, 'r');
  const read = (offset, length) => {
    if (offset < 0 || offset + length > stat.size) return null;
    const buffer = Buffer.alloc(length);
    return fs.readSync(fd, buffer, 0, length, offset) === length ? buffer : null;
  };
  let valid = false;
  try {
    const header = read(0, 64);
    if (header && platform === 'linux' && header.subarray(0, 4).equals(Buffer.from([127, 69, 76, 70]))) {
      const type = header.readUInt16LE(16);
      const position = header.readBigUInt64LE(32);
      const count = header.readUInt16LE(56);
      const size = 56;
      if (header[4] === 2 && header[5] === 1 && header[6] === 1
          && (type === 2 || type === 3) && header.readUInt16LE(18) === (target === 'x64' ? 0x3e : 0xb7)
          && header.readBigUInt64LE(24) !== 0n && header.readUInt16LE(52) === 64 && header.readUInt16LE(54) === size
          && count > 0 && count <= 256 && position >= 64n && position + BigInt(size * count) <= BigInt(stat.size)) {
        const headers = read(Number(position), size * count);
        let entryInExecutableSegment = false, interpreter = false;
        const entry = header.readBigUInt64LE(24);
        for (let p = 0; headers && p < headers.length; p += size) {
          const kind = headers.readUInt32LE(p);
          if (kind === 3) interpreter = true;
          if (kind !== 1 || !(headers.readUInt32LE(p + 4) & 1)) continue;
          const address = headers.readBigUInt64LE(p + 16);
          if (entry >= address && entry - address < headers.readBigUInt64LE(p + 32)) entryInExecutableSegment = true;
        }
        valid = entryInExecutableSegment && (type === 2 || interpreter);
      }
    }
    if (header && platform === 'win32' && header.readUInt16LE(0) === 0x5a4d) {
      const offset = header.readUInt32LE(60);
      const pe = offset >= 64 && read(offset, 44); // signature, COFF and optional-header prefix
      if (pe && pe.readUInt32LE(0) === 0x4550) {
        const sections = pe.readUInt16LE(6), optional = pe.readUInt16LE(20), flags = pe.readUInt16LE(22);
        valid = pe.readUInt16LE(4) === (target === 'x64' ? 0x8664 : 0xaa64)
          && sections > 0 && optional >= 112 && offset + 24 + optional + sections * 40 <= stat.size
          && (flags & 2) !== 0 && (flags & 0x2000) === 0
          && pe.readUInt16LE(24) === 0x20b && pe.readUInt32LE(40) !== 0;
      }
    }
    if (header && platform === 'darwin' && header.readUInt32LE(0) === 0xfeedfacf) {
      const commands = header.readUInt32LE(16), size = header.readUInt32LE(20);
      valid = header.readUInt32LE(4) === (target === 'x64' ? 0x01000007 : 0x0100000c)
        && header.readUInt32LE(12) === 2 && commands > 0 && size >= commands * 8 && 32 + size <= stat.size;
    }
  } finally {
    fs.closeSync(fd);
  }
  if (!valid) throw new Error(`Not a ${platform}/${target} desktop executable: ${file}`);
  return file;
}

function findKnownEntry(root, platform, getParts = hostEntry) {
  ordinaryDirectory(root);
  const stock = getParts(platform, false), branded = getParts(platform, true);
  const hasStock = info(path.join(root, stock[0]));
  const hasBranded = info(path.join(root, branded[0]));
  if (hasStock && hasBranded) throw new Error('Mixed stock and branded desktop runtime: ' + root);
  return exactEntry(root, hasBranded ? branded : stock, platform);
}

function findHostAppBundle(dist) {
  const binary = findKnownEntry(dist, 'darwin');
  return path.dirname(path.dirname(path.dirname(binary)));
}

function findHostWindowsExe(dist) {
  return findKnownEntry(dist, 'win32');
}

function findHostLinuxBinary(dist) {
  return findKnownEntry(dist, 'linux');
}

function findMacBinary(macosDir) {
  return findKnownEntry(macosDir, 'darwin', (platform, branded) => [hostEntry(platform, branded).at(-1)]);
}

function installedHostEntry(root, platform = process.platform, arch = process.arch) {
  const dist = path.join(root, 'dist');
  const entry = assertHostImage(findKnownEntry(dist, platform), platform, arch);
  assertHostResources(dist, platform, path.basename(entry) === hostEntry(platform, true).at(-1));
  return entry;
}

function resolveHostDist(appRoot, platform = process.platform, arch = process.arch) {
  let failure;
  for (const name of ['desktop-shell', 'electron']) {
    const root = path.join(appRoot, 'node_modules', name);
    try {
      installedHostEntry(root, platform, arch);
      return path.join(root, 'dist');
    } catch (error) {
      failure ||= error;
      if (info(path.join(root, 'dist'))) failure = error;
    }
  }
  throw new Error('No usable desktop runtime. Install the locked dependencies first. ' + failure.message);
}

function lockedElectronPackage(appRoot) {
  const locked = JSON.parse(fs.readFileSync(path.join(appRoot, 'package-lock.json'), 'utf8')).packages?.['node_modules/electron'];
  const root = path.join(appRoot, 'node_modules', 'electron');
  ordinaryDirectory(root);
  const manifest = path.join(root, 'package.json');
  ordinaryFile(manifest);
  const installed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  if (!locked?.version || installed.name !== 'electron' || installed.version !== locked.version) {
    throw new Error('Installed Electron npm package does not match package-lock.json');
  }
  return { root, version: locked.version, dist: path.join(root, 'dist') };
}

function assertHostResources(dist, platform, branded = false) {
  if (platform === 'darwin') {
    const contents = path.join(dist, ...hostEntry(platform, branded).slice(0, 2));
    ordinaryFile(path.join(contents, 'Info.plist'));
    const frameworks = path.join(contents, 'Frameworks');
    ordinaryDirectory(frameworks);
    const framework = path.join(frameworks, 'Electron Framework.framework');
    ordinaryDirectory(framework);
    // This is normally a relative link inside the framework bundle.
    const library = fs.realpathSync(path.join(framework, 'Electron Framework'));
    if (!library.startsWith(fs.realpathSync(framework) + path.sep)) {
      throw new Error('Electron framework is not contained in the desktop runtime: ' + framework);
    }
    ordinaryFile(library);
  } else {
    for (const name of ['icudtl.dat', 'resources.pak']) ordinaryFile(path.join(dist, name));
  }
}

function inspectLockedElectronRuntime(appRoot, platform = process.platform, arch = process.arch) {
  const { dist, version } = lockedElectronPackage(appRoot);
  if (info(path.join(dist, hostEntry(platform, true)[0]))) {
    throw new Error('Release staging needs a stock Electron distribution, not a mixed or branded runtime: ' + dist);
  }
  const entry = assertHostImage(exactEntry(dist, hostEntry(platform, false), platform), platform, arch);
  const versionFile = path.join(dist, 'version');
  ordinaryFile(versionFile);
  if (fs.readFileSync(versionFile, 'utf8').trim().replace(/^v/u, '') !== version) {
    throw new Error('Electron dist version does not match package-lock.json: ' + dist);
  }
  assertHostResources(dist, platform);
  return { dist, entry };
}

function verifyPackagedHost(packageRoot, platform = process.platform, arch = process.arch) {
  const dist = platform === 'darwin' ? packageRoot : path.join(packageRoot, 'runtime');
  if (info(path.join(dist, hostEntry(platform, false)[0]))) {
    throw new Error('Staged runtime still contains the stock Electron launcher: ' + dist);
  }
  const entry = assertHostImage(exactEntry(dist, hostEntry(platform, true), platform), platform, arch);
  assertHostResources(dist, platform, true);
  if (platform === 'darwin') {
    const plist = path.join(dist, 'OpenBrowser.app', 'Contents', 'Info.plist');
    if (!/<key>CFBundleExecutable<\/key>\s*<string>OpenBrowser<\/string>/u.test(fs.readFileSync(plist, 'utf8'))) {
      throw new Error('Staged macOS application does not declare OpenBrowser as CFBundleExecutable');
    }
  }
  return entry;
}

module.exports = {
  resolveHostDist,
  findHostAppBundle,
  findHostWindowsExe,
  findHostLinuxBinary,
  findMacBinary,
  installedHostEntry,
  lockedElectronPackage,
  inspectLockedElectronRuntime,
  verifyPackagedHost,
};

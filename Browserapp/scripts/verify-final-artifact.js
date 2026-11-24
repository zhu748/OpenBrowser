'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { sha256File } = require('./package-digests');

const compare = path.join(__dirname, 'verify-payload-files.py');

function verifyFinalArtifact(platform, stage, artifact, run = execFileSync) {
  if (platform === 'linux') {
    run('python3', [compare, 'tar', stage, artifact], { stdio: 'inherit' });
    return 'Linux: tar members, modes, links and file bytes match staging';
  }
  if (platform === 'darwin') {
    run('hdiutil', ['verify', artifact], { stdio: 'inherit' });
    const mount = fs.mkdtempSync(path.join(os.tmpdir(), 'openbrowser-verify-dmg-'));
    let attached = false;
    try {
      run('hdiutil', ['attach', '-readonly', '-nobrowse', '-noautoopen', '-mountpoint', mount, artifact], { stdio: 'inherit' });
      attached = true;
      const bundle = path.join(mount, 'OpenBrowser.app');
      run('python3', [compare, 'bundle', path.join(stage, 'OpenBrowser.app'), bundle], { stdio: 'inherit' });
      run('codesign', ['--verify', '--deep', '--strict', bundle], { stdio: 'inherit' });
    } finally {
      // Only detach our own read-only mount. Never recursively remove a
      // mountpoint, including when attach/detach failed.
      if (attached) run('hdiutil', ['detach', mount], { stdio: 'inherit' });
      if (fs.existsSync(mount)) fs.rmdirSync(mount);
    }
    return 'macOS: verified DMG and signed app bundle contents on a read-only mount';
  }
  if (platform === 'win32') {
    // The builder has 7-Zip. Inspect NSIS data, not the live registry, user
    // shortcuts or install directory. Do not run setup or its uninstaller.
    run('7z', ['t', '-tNSIS', artifact], { stdio: 'inherit' });
    // Do not load the large Electron host into memory. 7-Zip reads one exact
    // member to our already-open file; archive paths are never extracted.
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'openbrowser-verify-nsis-'));
    const entry = path.join(temp, 'member');
    try {
      for (const file of [
        'runtime/OpenBrowser.exe', 'runtime/resources/app/package.json', 'runtime/resources/app/automation/app-update.js',
        'runtime/resources/app/automation/update-trust.js', 'runtime/resources/rust-core/openbrowser-core.exe',
      ]) {
        const expected = path.join(stage, file);
        const size = fs.statSync(expected).size;
        const fd = fs.openSync(entry, 'w');
        try {
          run('7z', ['x', '-so', '-tNSIS', artifact, file.split('/').join(path.sep)], { stdio: ['ignore', fd, 'pipe'] });
        } finally {
          fs.closeSync(fd);
        }
        if (!size || fs.statSync(entry).size !== size || sha256File(entry) !== sha256File(expected)) {
          throw new Error('NSIS entry missing or changed: ' + file);
        }
      }
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
    return 'Windows: tested final NSIS archive and compared desktop host, core, version and updater/trust bytes; no installation or uninstallation';
  }
  throw new Error('Unsupported installer platform: ' + platform);
}

module.exports = { verifyFinalArtifact };

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { renderWindowsInstaller, assertComponent } = require('./windows-installer');
const { verifyFinalArtifact } = require('./verify-final-artifact');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-installer-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const stage = path.join(dir, 'payload');
  const files = [
    'runtime/resources/app/package.json', 'runtime/resources/app/automation/app-update.js',
    'runtime/resources/app/automation/update-trust.js', 'runtime/resources/rust-core/openbrowser-core.exe',
    'runtime/OpenBrowser.exe', '运行说明.txt', 'a space/.notice',
  ];
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(stage, file)), { recursive: true });
    fs.writeFileSync(path.join(stage, file), 'inert fixture: ' + file);
  }
  fs.mkdirSync(path.join(stage, 'empty'));
  const exe = path.join(dir, 'setup.exe');
  const render = () => renderWindowsInstaller(stage, exe, '1.0.0');
  return { dir, stage, files, exe, render };
}

test('one exact manifest drives NSIS copy and deletion; unowned siblings survive', t => {
  const { files, render, stage } = fixture(t);
  const script = render();
  const target = file => '$INSTDIR\\' + file.replaceAll('/', '\\');
  const uninstall = script.split('Section "Uninstall"')[1];
  const removed = [...uninstall.matchAll(/^  Delete "(\$INSTDIR\\[^"]+)"\r?$/gm)].map(m => m[1]);
  assert.deepEqual(removed.sort(), [...files.map(target), target('Uninstall.exe')].sort());
  assert.doesNotMatch(script, /^\s*(?:RMDir|File)\s+\/r\b|^\s*Exec(?:Wait|Shell)?\s+/gim);
  const installed = [...script.matchAll(/^  !insertmacro InstallFile "([^"]+)" "([^"]+)"\r?$/gm)];
  assert.deepEqual(installed.map(m => [m[1], m[2]]).sort(),
    files.map(f => [path.join(stage, f), target(f)]).sort());
  const roots = [...uninstall.matchAll(/^  RMDir "(\$INSTDIR[^"]*)"\r?$/gm)].map(m => m[1]);
  const allDirs = new Set(['$INSTDIR', target('empty')]);
  for (const name of files) {
    const parts = name.split('/');
    for (let i = 1; i < parts.length; ++i) allDirs.add(target(parts.slice(0, i).join('/')));
  }
  assert.deepEqual(new Set(roots), allDirs);
  for (const [i, dir] of roots.entries()) {
    assert(!roots.slice(i + 1).some(later => later.startsWith(dir + '\\')), 'parent removed before child');
  }
  assert(script.includes('Call un.CheckPaths'));
  const installing = script.split('Section "OpenBrowser" SEC_MAIN')[1].split('SectionEnd')[0];
  assert(installing.indexOf('WriteUninstaller "$8"') < installing.indexOf('!insertmacro InstallFile'));
  assert(installing.includes('MoveFileExW') && installing.includes('ManifestInstaller'));

  assert(uninstall.indexOf('Call un.CheckPaths') < uninstall.indexOf('  Delete "'));
  assert(script.includes('0x410') && script.includes('PathIsDirectoryEmptyW') && script.includes('InstallDirRegKey'));
  for (const entry of [...allDirs].filter(entry => entry !== '$INSTDIR')) {
    assert(script.includes('"' + entry + '" 16'), 'directory not checked: ' + entry);
  }
  for (const file of removed) assert(script.includes('"' + file + '" 0'), 'file not checked: ' + file);
  // Model only the emitted plan against in-memory fixture contents, never the host.
  const userFiles = ['notes.txt', 'runtime/my profile.dat', 'runtime/resources/app/user.json'].map(target);
  const disk = new Set([...allDirs, ...removed, ...userFiles]);
  for (const file of removed) disk.delete(file);
  for (const dir of roots) if (![...disk].some(f => f.startsWith(dir + '\\'))) disk.delete(dir);
  for (const file of userFiles) assert(disk.has(file));
  assert(disk.has('$INSTDIR'));
  assert(!disk.has(target('empty')));
});

test('reject ambiguous names, interpreter syntax, collisions and reparse entries before emitting code', t => {
  const { dir, stage, exe, render } = fixture(t);
  for (const name of ['.', '..', '../outside', 'a\\b', 'a/b', 'C:evil', 'notes:*', '*.txt', 'a?.js',
    'x"\nSectionEnd', '$INSTDIR', '${VERSION}', 'aux', 'CON.txt', 'CON   .txt', 'COM¹.log', 'note.', 'note ', 'PREVIO~1.DLL']) {
    assert.throws(() => assertComponent(name), /Unsafe/);
  }
  assert.throws(() => renderWindowsInstaller(stage, exe + '$TEMP', '1.0.0'), /Unsafe/);
  assert.throws(() => renderWindowsInstaller(stage, exe, '1.0.0"\nSectionEnd'), /version/);
  fs.writeFileSync(path.join(stage, 'UNINSTALL.EXE'), 'reserved');
  assert.throws(render, /Conflicting/);
  fs.unlinkSync(path.join(stage, 'UNINSTALL.EXE'));
  const link = path.join(stage, 'junction');
  const outside = path.join(dir, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, link, 'junction');
  assert.throws(render, /ordinary/);
});

test('Linux final tar gate reads actual bytes and rejects missing, extra or damaged members', {
  skip: process.platform !== 'linux',
}, t => {
  const { dir, stage, files } = fixture(t);
  const archive = path.join(dir, 'result.tar.gz');
  const file = path.join(stage, files[0]);
  fs.symlinkSync('运行说明.txt', path.join(stage, 'notice-link'));
  const tar = () => execFileSync('tar', ['-czf', archive, '-C', dir, path.basename(stage)]);
  const verify = () => verifyFinalArtifact('linux', stage, archive,
    (cmd, args) => execFileSync(cmd, args, { stdio: 'pipe' }));
  tar(); assert.match(verify(), /tar/);
  const good = fs.readFileSync(archive);
  const original = fs.readFileSync(file);
  fs.writeFileSync(file, Buffer.alloc(original.length, 42));
  tar(); fs.writeFileSync(file, original);
  assert.throws(verify, /bytes differ/);
  fs.unlinkSync(file); tar(); fs.writeFileSync(file, original);
  assert.throws(verify, /missing archive member/);
  const extra = path.join(stage, 'extra');
  fs.writeFileSync(extra, 'stray'); tar(); fs.unlinkSync(extra);
  assert.throws(verify, /unexpected archive member/);
  fs.writeFileSync(archive, good.subarray(0, -6));
  assert.throws(verify);
});

test('Windows final gate fails closed on packed byte mismatch, never launching the installer', t => {
  const { stage, exe } = fixture(t);
  let reads = 0;
  function inspect(cmd, args, options) {
    assert.equal(cmd, '7z');
    assert(args.includes('-tNSIS') && args.includes(exe));
    if (args[0] === 't') return;
    assert.equal(args[0], 'x'); assert(args.includes('-so'));
    ++reads;
    fs.writeFileSync(options.stdio[1], fs.readFileSync(path.join(stage, args.at(-1))));
  }
  assert.match(verifyFinalArtifact('win32', stage, exe, inspect), /no installation or uninstallation/);
  assert.equal(reads, 5);
  for (const target of ['OpenBrowser.exe', 'openbrowser-core.exe']) {
    assert.throws(() => verifyFinalArtifact('win32', stage, exe, (cmd, args, options) => {
      if (!args.at(-1).endsWith(target)) return inspect(cmd, args, options);
      fs.writeFileSync(options.stdio[1], Buffer.alloc(fs.statSync(path.join(stage, args.at(-1))).size));
    }), new RegExp('NSIS entry missing or changed: .*' + target));
  }
});

test('bundle comparison permits a temp-root alias but still compares internal links and bytes', {
  skip: process.platform === 'win32',
}, t => {
  const { dir } = fixture(t);
  const root = path.join(dir, 'stage', 'OpenBrowser.app');
  const mounted = path.join(dir, 'private', 'mount', 'OpenBrowser.app');
  const alias = path.join(dir, 'mount');
  fs.symlinkSync(path.dirname(mounted), alias);
  for (const bundle of [root, mounted]) {
    fs.mkdirSync(path.join(bundle, 'Versions', 'A'), { recursive: true });
    fs.writeFileSync(path.join(bundle, 'Versions', 'A', 'app'), 'good');
    fs.symlinkSync('A', path.join(bundle, 'Versions', 'Current'));
  }
  const compare = () => execFileSync('python3', [path.join(__dirname, 'verify-payload-files.py'),
    'bundle', root, path.join(alias, 'OpenBrowser.app')], { stdio: 'pipe' });
  compare();
  fs.writeFileSync(path.join(mounted, 'Versions', 'A', 'app'), 'bad!');
  assert.throws(compare, /bytes differ/);
});

test('macOS gate detaches only its private read-only mount even when payload verification fails', t => {
  const { stage } = fixture(t);
  let mount, detached;
  assert.throws(() => verifyFinalArtifact('darwin', stage, 'example.dmg', (cmd, args) => {
    if (cmd === 'hdiutil' && args[0] === 'attach') {
      assert(args.includes('-readonly') && args.includes('-nobrowse'));
      mount = args[args.indexOf('-mountpoint') + 1];
      assert.notEqual(mount, stage);
    }
    if (cmd === 'python3') { assert.equal(args.at(-1), path.join(mount, 'OpenBrowser.app')); throw new Error('bad payload'); }
    if (args[0] === 'detach') detached = args[1];
  }), /bad payload/);
  assert.equal(mount, detached);
  assert(!fs.existsSync(mount));
});

test('compile and inspect the inert NSIS fixture without running its executable', {
  skip: process.env.OPENBROWSER_TEST_MAKENSIS !== '1',
}, t => {
  const { dir, stage, exe, render } = fixture(t);
  const script = path.join(dir, 'fixture.nsi');
  fs.writeFileSync(script, render());
  execFileSync('makensis', ['-V2', script], { stdio: 'inherit' });
  assert.match(verifyFinalArtifact('win32', stage, exe), /NSIS/);
});

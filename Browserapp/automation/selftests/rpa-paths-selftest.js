'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { resolveSafeRpaPath, resolveSpreadsheetPath } = require('../rpa/paths');

async function main() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-rpa-paths-'));
  const root = path.join(temp, 'sandbox'); const outside = path.join(temp, 'outside');
  try {
    await fs.mkdir(root); await fs.mkdir(outside);
    const options = { extraRoots: [root] };
    assert.equal(resolveSafeRpaPath(path.join(root, 'new', 'data.csv'), options), path.join(root, 'new', 'data.csv'));
    assert.throws(() => resolveSafeRpaPath(path.join(outside, 'data.csv'), options), /RPA file path/);
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    await fs.symlink(outside, path.join(root, 'escape'), type);
    assert.throws(() => resolveSafeRpaPath(path.join(root, 'escape', 'new', 'data.csv'), options), /symbolic link/);
    const safe = path.join(root, 'safe'); await fs.mkdir(safe);
    await fs.symlink(safe, path.join(root, 'inside'), type);
    assert.equal(resolveSafeRpaPath(path.join(root, 'inside', 'new.csv'), options), path.join(root, 'inside', 'new.csv'));
    if (process.platform !== 'win32') {
      await fs.writeFile(path.join(outside, 'secret.csv'), 'secret');
      await fs.symlink(path.join(outside, 'secret.csv'), path.join(root, 'input.csv'));
      assert.throws(() => resolveSafeRpaPath(path.join(root, 'input.csv'), options), /symbolic link/);
      await fs.symlink(path.join(outside, 'missing'), path.join(root, 'dangling'));
      assert.throws(() => resolveSafeRpaPath(path.join(root, 'dangling', 'new.csv'), options), /symbolic link/);
    }
    const homedir = os.homedir;
    try {
      const home = path.join(temp, 'home'); const desktop = path.join(home, 'Desktop');
      await fs.mkdir(desktop, { recursive: true });
      os.homedir = () => home;
      await fs.writeFile(path.join(desktop, 'safe.csv'), 'a,b');
      await fs.writeFile(path.join(outside, 'private.csv'), 'private');
      await fs.symlink(outside, path.join(desktop, 'escape'), type);
      assert.equal(await resolveSpreadsheetPath(path.join(desktop, 'safe.csv')), path.join(desktop, 'safe.csv'));
      await assert.rejects(resolveSpreadsheetPath(path.join(desktop, 'escape', 'private.csv')), /outside allowed folders/);
      await fs.symlink(outside, path.join(home, 'Downloads'), type);
      assert.equal(await resolveSpreadsheetPath(path.join(home, 'Downloads', 'private.csv')), path.join(home, 'Downloads', 'private.csv'), 'a redirected trusted root still works');
    } finally { os.homedir = homedir; }
    console.log('RPA_PATHS_SELFTEST OK (existing ancestors, new files, escaping links, internal links, platform junctions)');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

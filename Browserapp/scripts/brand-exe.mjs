import { rcedit } from 'rcedit';
import { readFileSync } from 'node:fs';

// Version metadata is DERIVED, not hand-duplicated: these rcedit stamps were
// the one version surface package-portable never validated (the Rust core
// and the NSIS DisplayVersion are both checked against package.json).
const pkgVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const fileVersion = `${pkgVersion}.0`;

const [exePath, iconPath] = process.argv.slice(2);
if (!exePath || !iconPath) {
  throw new Error('Usage: node brand-exe.mjs <exePath> <iconPath>');
}

await rcedit(exePath, {
  'version-string': {
    ProductName: 'OpenBrowser',
    FileDescription: 'OpenBrowser',
    CompanyName: 'OpenBrowser 开源项目',
    LegalCopyright: 'AGPL-3.0-or-later',
    OriginalFilename: 'OpenBrowser.exe'
  },
  'file-version': fileVersion,
  'product-version': fileVersion,
  icon: iconPath,
  'requested-execution-level': 'asInvoker'
});

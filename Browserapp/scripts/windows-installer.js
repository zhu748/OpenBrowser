'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Do not interpolate package-controlled NSIS variables, wildcard masks or
// ambiguous Win32 names. Failing a build is safer than broadening a Delete.
function assertComponent(name) {
  const stem = name.split('.')[0].trimEnd();
  if (!name || /[\x00-\x1f<>:"/\\|?*$]/u.test(name) || /[. ]$/u.test(name)
      || /^(?:CON|PRN|AUX|NUL|(?:COM|LPT)[0-9¹²³])$/iu.test(stem)
      || /~\d+(?:[.]|$)/u.test(name)) {
    throw new Error('Unsafe Windows payload name: ' + JSON.stringify(name));
  }
}

function compilerPath(file) {
  const absolute = path.resolve(file);
  if (/[\x00-\x1f"$*?]/u.test(absolute)) {
    throw new Error('Unsafe NSIS build path: ' + JSON.stringify(absolute));
  }
  return absolute;
}

function readPayload(root) {
  const directories = [];
  const walk = (relative) => {
    const dir = path.join(root, ...relative);
    if (!fs.lstatSync(dir).isDirectory()) throw new Error('Expected an ordinary payload directory: ' + dir);
    const files = [], children = [], seen = new Set();
    directories.push({ relative: relative.join('\\'), files });
    for (const name of fs.readdirSync(dir).sort()) {
      assertComponent(name);
      const key = name.toUpperCase();
      if (seen.has(key) || (!relative.length && key === 'UNINSTALL.EXE')) {
        throw new Error('Conflicting Windows payload name: ' + path.join(dir, name));
      }
      seen.add(key);
      const file = path.join(dir, name);
      const stat = fs.lstatSync(file); // Never descend into links/junctions.
      if (stat.isFile()) files.push({ name, source: compilerPath(file) });
      else if (stat.isDirectory()) children.push(name);
      else throw new Error('Expected an ordinary file or directory: ' + file);
    }
    for (const name of children) walk([...relative, name]);
  };
  walk([]);
  return directories;
}

function renderWindowsInstaller(root, output, version) {
  if (!/^[0-9]+(?:\.[0-9]+){2}(?:[-+][A-Za-z0-9.+-]+)?$/u.test(version)) throw new Error('Invalid package version');
  const dirs = readPayload(compilerPath(root));
  const checks = [], install = [], removeFiles = [], removeDirs = [];
  let longest = 'Uninstall.exe'.length;
  function check(target, flags) {
    checks.push(`  !insertmacro CheckPath "\${PREFIX}" "${target}" ${flags}`);
    longest = Math.max(longest, target.length - '$INSTDIR\\'.length);
  }
  for (const { relative, files } of dirs) {
    const target = relative ? '$INSTDIR\\' + relative : '$INSTDIR';
    if (relative) {
      check(target, 16);
      removeDirs.push(`  RMDir "${target}"`);
    }
    install.push(`  SetOutPath "${target}"`, '  IfErrors install_failed');
    for (const { name, source } of files) {
      const file = target + '\\' + name;
      check(file, 0);
      install.push(`  !insertmacro InstallFile "${source}" "${file}"`);
      removeFiles.push(`  Delete "${file}"`);
    }
  }
  const fields = {
    OUTPUT: compilerPath(output), VERSION: version,
    // Stay inside classic Win32 file and CreateDirectory path limits.
    MAX_ROOT: String(247 - 1 - longest),
    CHECK_PATHS: checks.join('\n'), INSTALL: install.join('\n'),
    DELETE_FILES: removeFiles.join('\n'), REMOVE_DIRS: removeDirs.reverse().join('\n'),
  };
  if (Number(fields.MAX_ROOT) < 4) throw new Error('Windows payload paths are too long');
  const template = fs.readFileSync(path.join(__dirname, 'windows-installer.nsi.in'), 'utf8');
  return '\uFEFF' + template.replace(/@([A-Z_]+)@/gu, (_, key) => {
    if (!Object.hasOwn(fields, key)) throw new Error('Unknown installer template field: ' + key);
    return fields[key];
  }).replace(/\r?\n/gu, '\r\n');
}

module.exports = { renderWindowsInstaller, assertComponent };

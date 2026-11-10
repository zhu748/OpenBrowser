'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { isRuntimeResource, assertRuntimeResourceTree, RUNTIME_ROOT_FILES } = require('../../scripts/runtime-manifest');
const { copyRecursive } = require('../../scripts/package-portable');
const root = path.resolve(__dirname, '../..');

for (const name of RUNTIME_ROOT_FILES) {
  if (!name.endsWith('.exe')) assert.equal(fs.existsSync(path.join(root, name)), true, `declared runtime file exists: ${name}`);
}
for (const name of ['main.js', 'environment-audit.js', 'native-input-mirror.exe', 'automation/mcp-server.js', 'automation/kernel/archive.js', 'shared/ipc-result.js']) {
  assert.equal(isRuntimeResource(name), true, name);
}
for (const name of ['surprise.js', 'eslint.config.js', 'zoom-inspect.js', 'package-lock.json', 'scripts/publish-release.sh', 'automation/selftests/fake.js', 'automation/adversarial-detection-audit-round2.js', 'automation/final-release-regression-runner.js', 'profile-list-selftest.js', '../main.js']) {
  assert.equal(isRuntimeResource(name), false, name);
}
assert.equal(isRuntimeResource('kernels/vendor/scripts/resource.js'), true, 'vendor bundles retain their original tree');

// Verify the actual copy operation, not only the manifest predicate.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-runtime-manifest-'));
try {
  const source = path.join(temp, 'source'); const dest = path.join(temp, 'destination');
  for (const file of ['main.js', 'automation/service.js', 'automation/selftests/hidden.js', 'automation/sample-audit.js', 'scripts/publish-release.sh', 'native-input-mirror.exe']) {
    fs.mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
    fs.writeFileSync(path.join(source, file), file);
  }
  fs.mkdirSync(dest);
  for (const file of fs.readdirSync(source)) {
    copyRecursive(path.join(source, file), path.join(dest, file), (candidate) => isRuntimeResource(path.relative(source, candidate)));
  }
  assert.equal(fs.readFileSync(path.join(dest, 'automation/service.js'), 'utf8'), 'automation/service.js');
  assert.equal(fs.existsSync(path.join(dest, 'native-input-mirror.exe')), true);
  assert.equal(fs.existsSync(path.join(dest, 'automation/selftests')), false);
  assert.equal(fs.existsSync(path.join(dest, 'automation/sample-audit.js')), false);
  assert.equal(fs.existsSync(path.join(dest, 'scripts')), false);
  assert.doesNotThrow(() => assertRuntimeResourceTree(dest));
  fs.writeFileSync(path.join(dest, 'stale-selftest.js'), 'old installer residue');
  assert.throws(() => assertRuntimeResourceTree(dest), /Non-runtime resource/, 'a locked leftover from an old build blocks packaging');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

// Every literal local dependency of a shipped JS module must also be shipped.
// This includes lazy platform-specific requires, even on the Linux CI runner.
function checkDirectory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name); const relative = path.relative(root, full);
    if (!isRuntimeResource(relative) || ['kernels', 'assets', 'bundled-extension'].includes(relative.split(path.sep)[0])) continue;
    if (entry.isDirectory()) checkDirectory(full);
    else if (entry.isFile() && full.endsWith('.js')) {
      const text = fs.readFileSync(full, 'utf8');
      // Consume comments/strings before matching require calls, so examples in
      // comments and emitted browser script strings are not dependencies.
      const tokens = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\brequire\s*\(\s*(['"])(\.[^'"]+)\1\s*\)/g;
      for (const match of text.matchAll(tokens)) {
        const specifier = match[2];
        if (!specifier) continue;
        const resolved = require.resolve(path.resolve(path.dirname(full), specifier));
        assert.equal(isRuntimeResource(path.relative(root, resolved)), true, `${relative} needs ${specifier}`);
      }
    }
  }
}
checkDirectory(root);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const [, file] of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)) {
  if (/^(?:https?:|#|data:)/.test(file)) continue;
  assert.equal(isRuntimeResource(file), true, `HTML resource is shipped: ${file}`);
  assert.equal(fs.existsSync(path.join(root, file)), true, `HTML resource exists: ${file}`);
}
console.log('RUNTIME_MANIFEST_SELFTEST OK (actual copy, native helpers, vendor trees, JS dependency closure, HTML resources)');

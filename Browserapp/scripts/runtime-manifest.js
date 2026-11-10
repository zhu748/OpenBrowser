'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Desktop entry points and resource domains. New top-level runtime resources
// must be declared here; developer tools cannot enter installers by accident.
const RUNTIME_DIRECTORIES = new Set([
  'assets', 'automation', 'bundled-extension', 'engine', 'kernels', 'main', 'network', 'shared', 'ui',
]);
const RUNTIME_ROOT_FILES = new Set([
  'package.json', 'index.html', 'main.js', 'preload.js', 'host-bridge.js',
  'cdp.js', 'engine.js', 'proxy-forwarder.js', 'live-sync-v4.js', 'live-sync-v5.js',
  'chrome-store-metadata.js', 'credential-crypto.js', 'environment-audit.js',
  'extension-pipe.js', 'i18n.js', 'store-extension.js', 'renderer.js',
  'renderer-platform-install.js', 'renderer-select.js', 'renderer-theme.js',
  'environment-audit.css', 'modern.css', 'styles.css', 'themes.css', 'ui-shell.css',
  'native-extension-popup-driver.cs', 'native-input-mirror.cs', 'native-omnibox-driver.cs',
  'native-profile-marker.cs', 'native-sync-hotkeys.cs', 'native-tab-shortcut-driver.cs',
  'native-upper-ui-jitter-driver.cs', 'LICENSE.chrome-power.txt', 'THIRD-PARTY-NOTICES.md',
]);
// Windows builds generate these alongside their checked-in sources.
for (const name of [...RUNTIME_ROOT_FILES]) {
  if (name.endsWith('.cs')) RUNTIME_ROOT_FILES.add(name.slice(0, -3) + '.exe');
}

function isRuntimeResource(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return false;
  // Preserve vendor trees as supplied, including signed browser bundles.
  if (['kernels', 'assets', 'bundled-extension'].includes(parts[0])) return true;
  if (parts.some((part) => ['selftests', 'scripts', 'node_modules', 'reports', '__pycache__'].includes(part.toLowerCase()))) return false;
  const name = parts.at(-1).toLowerCase();
  if (name.includes('selftest') || name.endsWith('.log') || name.startsWith('.env')) return false;
  if (parts[0] === 'automation' && (name.includes('-audit') || name === 'final-release-regression-runner.js')) return false;
  return RUNTIME_DIRECTORIES.has(parts[0]) || (parts.length === 1 && RUNTIME_ROOT_FILES.has(parts[0]));
}

function assertRuntimeResourceTree(root) {
  const pending = [root];
  while (pending.length) {
    const dir = pending.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(root, full);
      if (!isRuntimeResource(relative)) throw new Error('[package] Non-runtime resource in app: ' + relative);
      if (entry.isDirectory()) pending.push(full);
    }
  }
}

module.exports = { isRuntimeResource, assertRuntimeResourceTree, RUNTIME_DIRECTORIES, RUNTIME_ROOT_FILES };

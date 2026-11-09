'use strict';

/**
 * README screenshot capture (docs/screenshots/*.png).
 *
 * Boots the real index.html with the test-only IPC bridge
 * (automation/ui-audit-bridge.js — no production accounts, kernels or
 * network requests), seeds demo profiles through the same normalize/render
 * path the app uses, and captures the four views referenced by
 * README.md / README_CN.md under the current modern theme.
 *
 * Usage: node automation/readme-screenshot-capture.js
 * Requires: agent-browser on PATH.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, '..', 'docs', 'screenshots');
const session = 'ob-readme-shots-' + process.pid;
const viewport = [1600, 900];

// The stock audit bridge reports no installed kernel (red "no browser" badge) and a
// pinned appVersion. For the README face shots, derive a bridge that presents one
// ready kernel and the real package version; every other stub passes through.
const bridgeSource = fs.readFileSync(path.join(__dirname, 'ui-audit-bridge.js'), 'utf8')
  + `\n(() => {
  const baseOps = window.ops;
  window.ops = new Proxy({}, {
    get(target, key) {
      if (key === 'getInfo') {
        return async () => ({
          platform: 'darwin',
          appVersion: '1.0.27',
          browsers: [{ name: 'Chrome 148', path: 'UI-AUDIT-FIXTURE/kernels/148' }],
          profileRoot: 'UI-AUDIT-FIXTURE',
        });
      }
      if (key === 'kernelListVersions') return async () => ({ versions: ['148'], latest: '148' });
      if (key === 'kernelListInstalled') return async () => [{ name: 'Chrome 148', version: '148', path: 'UI-AUDIT-FIXTURE/kernels/148' }];
      return (...args) => baseOps[key](...args);
    },
  });
})();`;
const bridgePath = path.join(__dirname, 'ui-audit-artifacts', `readme-bridge-${process.pid}.js`);
fs.mkdirSync(path.dirname(bridgePath), { recursive: true });
fs.writeFileSync(bridgePath, bridgeSource);

function cli(...args) {
  const raw = execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 30000 });
  const response = JSON.parse(raw.trim());
  if (!response.success) throw new Error(response.error || raw);
  return response.data;
}
const evaluate = (code) => cli('eval', code).result;
const run = (fn) => evaluate('(' + fn.toString() + ')()');
const shoot = (file) => {
  const target = path.join(docsDir, file);
  cli('screenshot', target);
  const size = fs.statSync(target).size;
  if (size < 20000) throw new Error(`screenshot ${file} suspiciously small: ${size} bytes`);
  console.log(`  captured ${file} (${(size / 1024).toFixed(0)} KB)`);
};

fs.mkdirSync(docsDir, { recursive: true });
try { cli('close'); } catch (_) {}

cli('--allow-file-access', '--init-script', bridgePath, 'open', pathToFileURL(path.join(root, 'index.html')).href);
cli('wait', '#profile-table');
cli('set', 'viewport', String(viewport[0]), String(viewport[1]));

// Current skin: modern theme, light color mode — the default a fresh install shows.
run(() => {
  document.documentElement.dataset.uiTheme = 'modern';
  applyColorMode('light', false);
  OpenBrowserI18n.setPreference('en', { persist: false });
  const base = { os: 'Windows', language: 'en-US', kernelVersion: '148', width: 1280, height: 820 };
  const notes = ['Master', 'Team A', 'Team B', 'Proxy'];
  ui.profiles = notes.map((note, i) => normalizeProfileSettings({
    id: `demo-profile-${i + 1}`,
    number: i + 1,
    name: `Profile ${i + 1}`,
    note,
    networkMode: 'direct',
    proxy: 'Direct',
    ...base,
  }));
  ui.logs = [
    { time: '12:34:56', module: 'Kernel', message: 'Browser ready · independent kernel 148' },
    { time: '12:34:58', module: 'Profile', message: 'Started Profile 1 · direct connection' },
  ];
  proxyLibrary = [{
    id: 'demo-proxy-1', name: 'Residential US-01', host: '192.0.2.10', port: 8000,
    protocol: 'socks5', remark: 'demo entry', lastIp: '203.0.113.7',
  }];
  extensions = [
    { id: 'demo-ext-1', name: 'Cookie Editor', description: 'Demo extension entry', version: '1.0', manifestVersion: 3, enabledAll: true, assignedProfiles: 2, assignedProfileIds: ['demo-profile-1', 'demo-profile-2'], builtIn: false },
    { id: 'demo-ext-2', name: 'JSON Viewer', description: 'Demo extension entry', version: '1.0', manifestVersion: 3, enabledAll: false, assignedProfiles: 0, assignedProfileIds: [], builtIn: false },
  ];
  renderProfiles();
});

// 1. Overview — English profiles view.
shoot('openbrowser-overview.png');

// 2. Environment management — same view, Chinese locale.
evaluate('OpenBrowserI18n.setPreference("zh-CN", { persist: false }); renderProfiles();');
shoot('environment-management.png');

// 3. Profile editor — fingerprint/privacy tab of the editor.
run(() => {
  openProfileEditor('demo-profile-1');
  setEditorTab('privacy');
});
shoot('profile-fingerprint-editor.png');

// 4. Local settings (system view) — click the real sidebar entry so the
// page header tracks the navigation like a user drive.
run(() => { document.querySelector('.nav[data-view="system"]').click(); });
shoot('automation-and-system.png');

cli('close');
console.log('README screenshots updated.');

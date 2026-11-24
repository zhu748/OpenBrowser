'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isRuntimeResource, DEVELOPMENT_MODULES } = require('./runtime-manifest');
const workbenchEntries = require('../frontend/workbench-entries.json');
const rendererSources = new Set(Object.values(workbenchEntries).map(entry =>
  typeof entry === 'string' ? entry : entry.source));
const repo = path.resolve(__dirname, '../..');

function classify(file) {
  if (file.startsWith('docs/rebuild/evidence/') || file.startsWith('docs/archive/')) return ['documentation-evidence', 'reference'];
  if (file.startsWith('docs/') || (!file.includes('/') && file.endsWith('.md'))) return ['documentation', 'reference'];
  const relative = file.replace(/^Browserapp\//, '');
  if (/^(?:roxy-ui|frontend\/dist)\//.test(relative)) return ['generated-ui', 'generated'];
  // This tree is copied into the generated workbench, not maintained as source.
  if (relative.startsWith('frontend/workbench/')) return ['frontend-build-inputs', 'locked-input'];
  if (file.includes('/vendor/')) return ['third-party', 'locked-input'];
  if (/\/(?:selftests|tests?|test-fixtures|audits)\/|selftest|adversarial|benchmark|regression-runner|\.test\.[^/]+$/.test(file)
    || /^rebuild\/(?:acceptance-(?:manifest\.json|runner\.cjs)|verify-evidence\.cjs|visual-pixel-diff\.py)$/.test(relative)) {
    return ['tests-tools', 'development'];
  }
  if (/^(?:assets\/|frontend\/src\/workbench\/icons\/.*\.svg$)/.test(relative)
    || /\/(?:assets|data)\//.test(relative)) return ['resources-data', 'supported'];
  if (/^frontend\/(?:build(?:-workbench)?\.[cm]js|compile-workbench-component\.cjs|tsconfig\.json|workbench-(?:entries|vendor-modules)\.json)$/.test(relative)) {
    return ['build-tools', 'development'];
  }
  if (relative.startsWith('bundled-extension/')) return ['bundled-extension', 'supported'];
  if (relative.startsWith('rebuild/skills/')) return ['skill-packages', 'supported'];
  if (relative === 'automation/README.md' || relative === 'THIRD-PARTY-NOTICES.md') return ['documentation', 'reference'];
  if (relative.startsWith('frontend/')) return ['workbench', 'supported'];
  if (DEVELOPMENT_MODULES.has(relative)) return ['experimental', 'development'];
  if (file.startsWith('crates/')) return ['rust-core', 'gated'];
  if (/^Browserapp\/(?:rebuild\/compiler\/|scripts\/)/.test(file)) return ['build-tools', 'development'];
  if (/^Browserapp\/(?:ui\/|renderer[^/]*\.js$|index\.html$|(?:modern|styles|themes|ui-shell)\.css$|i18n\.js$|environment-audit\.(?:js|css)$)/.test(file)) return ['legacy-ui', 'compatibility'];
  if (/^Browserapp\/(?:main\/|main\.js|preload\.js|host-bridge\.js)/.test(file)) return ['desktop-host', 'supported'];
  if (/^Browserapp\/engine(?:\/|\.js)/.test(file)) return ['browser-engine', 'supported'];
  if (/^Browserapp\/rebuild\/sync(?:-service|-batch-text)\.js$/.test(file)) return ['window-sync', 'supported'];
  if (rendererSources.has(relative) || relative === 'rebuild/workbench-chrome.css') return ['workbench', 'supported'];
  if (file.startsWith('Browserapp/rebuild/')) return ['workbench-services', 'supported'];
  if (/^Browserapp\/(?:network\/|proxy-forwarder\.js|cdp\.js)/.test(file)) return ['network-protocol', 'supported'];
  if (/^Browserapp\/live-sync-/.test(file) || file.startsWith('Browserapp/automation/sync/')) return ['window-sync', 'supported'];
  if (/^Browserapp\/automation\/(?:kernel[/.-]|browser-kernel\.js$)/.test(file)) return ['browser-kernels', 'supported'];
  if (/^Browserapp\/automation\/(?:api\/|local-api-server\.js$|mcp-server\.js$|api-key-store\.js$)/.test(file)) return ['local-api', 'supported'];
  if (/^Browserapp\/automation\/(?:fingerprint|persona|device-persona|mobile-persona|user-agent|font|webgl|webgpu|worker|css-font|query-local-font|webrtc)/.test(file)) return ['fingerprint', 'supported'];
  if (/^Browserapp\/automation\/rpa/.test(file)) return ['rpa', 'supported'];
  if (/^Browserapp\/automation\/cloud/.test(file)) return ['cloud-backup', 'supported'];
  if (/^Browserapp\/automation\/(?:[\w-]+-store(?:-sqlite)?\.js$|local-settings\.js$|coalesced-writer\.js$|storage-diagnostics\.js$)/.test(file)) return ['storage', 'supported'];
  if (/^Browserapp\/(?:native-[^/]+\.cs$|automation\/native-[^/]+\.js$)/.test(file)) return ['native-integration', 'supported'];
  if (relative === 'credential-crypto.js') return ['storage', 'supported'];
  if (relative.startsWith('automation/protocol/')) return ['protocol-contracts', 'supported'];
  if (relative.startsWith('automation/')) return ['automation-runtime', 'supported'];
  if (file.startsWith('Browserapp/shared/')) return ['shared-contracts', 'supported'];
  return ['infrastructure-config', 'supported'];
}

function sourceLines(file) {
  const text = fs.readFileSync(file, 'utf8');
  let lines = 1;
  for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) lines++;
  return lines;
}

function inventory() {
  // Include new authored files, while respecting ignore rules for local work,
  // downloaded browsers, dependencies and generated temporary artifacts.
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean);
  const rows = [];
  for (const file of new Set(files)) {
    const absolute = path.join(repo, file);
    const stat = fs.statSync(absolute, { throwIfNoEntry: false });
    if (!stat) continue;
    const [category, maintenance] = classify(file);
    const bytes = stat.size;
    const source = /\.(?:js|mjs|cjs|vue|ts|tsx|rs|cs|css|html)$/.test(file);
    rows.push({ file, category, maintenance, bytes,
      lines: source ? sourceLines(absolute) : null,
      shipped: file.startsWith('Browserapp/') ? isRuntimeResource(file.slice(11)) : false });
  }
  const totals = {};
  for (const row of rows) {
    const total = totals[row.category] ||= { files: 0, bytes: 0, sourceLines: 0 };
    total.files++; total.bytes += row.bytes; total.sourceLines += row.lines || 0;
  }
  return {
    scope: 'Path-based maintenance inventory; sourceLines counts text lines by category. Shipped denotes the app resource manifest, not dependency reachability or derived build output.',
    totals,
    files: rows,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--output'))
    throw Error('Usage: module-inventory.js [--output file]');
  const output = path.resolve(repo, args[1] || 'work/module-inventory.json');
  const result = inventory();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ output, totals: result.totals }, null, 2));
}

module.exports = { classify, inventory };

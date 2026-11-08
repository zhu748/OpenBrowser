#!/usr/bin/env node
/**
 * Verify the refactored default UI ("modern") wiring and CSS completeness.
 * The UI refactor ships a single light theme; old skins must stay removed.
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); else console.log('ok  ' + msg); };

const renderer = read('renderer.js');
const main = read('main.js');
const index = read('index.html');
const i18n = read('i18n.js');
const css = read('modern.css');

// 1. Old skins are gone
for (const stale of ['oceanic-fingerprint.css', 'pixel-workstation.css', 'nes-light.css', 'element-admin.css', 'xai-console.css', 'retro-desktop.css',
  'theme-oceanic-fingerprint-selftest.js', 'theme-nes-light-selftest.js', 'theme-retro-desktop-selftest.js']) {
  ok(!fs.existsSync(path.join(root, stale)), `legacy ${stale} removed`);
}
ok(!index.includes('theme-picker') && !index.includes('theme-trigger') && !index.includes('theme-popover'), 'theme picker removed from header');
ok(!/data-ui-theme-option/.test(index) && !/data-ui-theme-option/.test(renderer), 'no theme option buttons left');
ok(/const UI_THEMES = Object\.freeze\(\{\s*'modern':/.test(renderer) && !/['"](?:oceanic-fingerprint|merge-gateway|retro-desktop|pixel-workstation|nes-light|element-admin|roxy-modern)['"]\s*:/.test(renderer.match(/const UI_THEMES = Object\.freeze\(\{[\s\S]*?\}\);/)?.[0] || ''), 'UI_THEMES registers only modern');
ok(main.includes("'modern': { bg: '#ffffff', overlay: '#f5fbff', symbol: '#111213' }"), 'main THEME_CHROME has modern chrome');
for (const legacy of ['oceanic-fingerprint', 'pixel-workstation', 'nes-light', 'element-admin', 'merge-gateway', 'retro-desktop', 'roxy-modern']) {
  ok(!main.includes(`'${legacy}'`), `main.js has no ${legacy} chrome entry`);
}

// 2. HTML & i18n wiring
ok(index.includes('modern.css'), 'index loads modern.css');
ok(!index.includes('roxy-modern.css'), 'index no longer references legacy css name');
ok(index.includes('data-ui-theme="modern"'), 'html root carries data-ui-theme="modern"');
ok(i18n.includes("'theme.modern.name'") && i18n.includes("'theme.modern.desc'"), 'i18n has theme.modern keys');
ok(i18n.includes("'theme.modern.name': '默认界面'") && i18n.includes("'theme.modern.name': 'Default UI'"), 'i18n zh+en labels present');
ok(!i18n.includes("'theme.roxy'") && !i18n.includes("'theme.oceanic'") && !i18n.includes("'theme.pixel'"), 'legacy theme i18n keys removed');

// 3. CSS scope & design tokens
ok(css.includes('html[data-ui-theme="modern"]'), 'modern.css scopes to data-ui-theme');
ok(css.includes('--modern-blue-500') && css.includes('--modern-neutral-0') && css.includes('--modern-neutral-950'), 'core palette variables defined');
ok(css.includes('#11a3fd') && css.includes('#f5fbff') && css.includes('#111213'), 'brand blue, app tint, and neutral ink present');
ok(!/[Rr]oxyBrowser/.test(css) && !css.includes('--roxy-') && !/[Rr]oxyBrowser/.test(index), 'no legacy naming left in stylesheet');

// 4. Critical UI component coverage
ok(css.includes('.sidebar') && css.includes('.brand') && css.includes('.new-browser'), 'sidebar, brand, new-browser styled');
ok(css.includes('.nav') && css.includes('.nav.active') && css.includes('.nav-child'), 'nav items, active state, sub-menus styled');
ok(css.includes('.table-card') && css.includes('thead th') && css.includes('tbody td'), 'table cards and row cells styled');
ok(css.includes('.primary') && css.includes('.outline') && css.includes('.danger'), 'primary, outline, danger buttons covered');
ok(css.includes('input') && css.includes('select') && css.includes('textarea'), 'form controls fully covered');
ok(css.includes('.segmented label') && css.includes('.segmented label:has(input:checked)'), 'segmented pills styled with checked state');
ok(css.includes('dialog') && css.includes('.dialog-head') && css.includes('.toast'), 'dialogs, headers, and toast alerts covered');
ok(css.includes('.select-menu'), 'custom dropdown component covered');
ok(css.includes('#view-profile-editor') && css.includes('.editor-tabs'), 'profile editor view covered');
ok(css.includes('.editor-section-card') && css.includes('.editor-card-title'), 'editor section cards styled');
ok(css.includes('.profile-summary') && css.includes('.summary-head'), 'profile summary sidebar styled');
ok(css.includes('.editor-actions'), 'editor action bar styled');
ok(css.includes('.group-chip') && css.includes('.profile-selection-bar'), 'group chips and selection bar styled');
ok(css.includes('.extension-card') && css.includes('#view-sync') && css.includes('.log-card'), 'extensions, sync, logs covered');
ok(css.includes('.engine-badge'), 'engine badge styled');

// 5. Contrast & safety smoke
ok(!/background:\s*#ffffff;\s*color:\s*#ffffff/.test(css), 'no white-on-white collisions');
ok(!/background:\s*#000000;\s*color:\s*#000000/.test(css), 'no black-on-black collisions');
ok(!css.includes('video-tutorial') && !css.includes('invite') && !css.includes('推广'), 'no promo/ad styling present');

if (fails.length) {
  console.error('\nFAIL ' + fails.length);
  for (const f of fails) console.error(' - ' + f);
  process.exit(1);
}
console.log('\nPASS theme-modern-selftest (' + (css.match(/html\[data-ui-theme="modern"\]/g) || []).length + ' scoped selectors verified)');

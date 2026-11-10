#!/usr/bin/env node
/**
 * Verify the 内核管理 (kernel manager) alignment end to end:
 * backend delete/check/cancel/auto-update wiring, downloader cancel + speed,
 * renderer page structure, UI event handling, i18n coverage and CSS.
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); else console.log('ok  ' + msg); };

// 1. Downloader: cancel support + speed in progress events
const { Downloader, STATUS } = require('./automation/downloader.js');
ok(typeof Downloader.prototype.cancel === 'function', 'Downloader.cancel() exists');
ok(STATUS.CANCELED === 'canceled', 'STATUS.CANCELED defined');
ok(!fs.existsSync(path.join(root, 'automation/downloader.js')) === false, 'downloader present');
const dlSource = read('automation/downloader.js');
ok(dlSource.includes('_speedSamples') && dlSource.includes("emit('progress', { received, total, progress: this.progress, speed })"), 'downloader emits speed in progress');
ok(dlSource.includes('if (this.canceled)') , 'downloader skips retries after cancel');
const dl = new Downloader('http://127.0.0.1:9/x.bin', { dir: root });
dl.setProgress(100, 1000);
const gotSpeed = (() => { let s = 0; dl.on('progress', (p) => { s = p.speed; }); dl.setProgress(600, 1000); return s >= 0; })();
ok(gotSpeed, 'progress events carry speed');

// 2. Kernel manager: delete / check / cancel / auto-update
const managerSource = read('automation/browser-kernel.js');
ok(managerSource.includes('async deleteKernel('), 'manager deleteKernel()');
ok(managerSource.includes('当前内核正在使用中，无法删除'), 'manager blocks deleting in-use kernel');
ok(managerSource.includes('async checkKernel('), 'manager checkKernel()');
ok(managerSource.includes('cancelKernelDownload()'), 'manager cancelKernelDownload()');
ok(managerSource.includes('async setAutoUpdateKernel('), 'manager setAutoUpdateKernel()');
ok(managerSource.includes('autoUpdateKernel: true'), 'auto-update defaults on');
ok(managerSource.includes('this.activeDownload = { engine:'), 'installs register the active download');
ok(managerSource.includes('register: (d) =>'), 'downloadFile exposes the Downloader instance');
ok(managerSource.includes('downloading: this.activeDownload'), 'status() reports the in-flight download');

// 2b. Wayfern feed version bookkeeping. Observed upstream defect: the feed's
// top-level version ran one patch ahead of the builds its URLs served
// (156.0.8078.81 announced vs 156.0.8078.80 assets), so the build parsed
// from the download URL must be the version of record.
const { buildVersionFromUrl } = require('./automation/browser-kernel.js');
ok(typeof buildVersionFromUrl === 'function', 'buildVersionFromUrl() exported');
ok(buildVersionFromUrl('https://download.wayfern.com/wayfern-156.0.8078.80-linux-x64-portable.tar.xz') === '156.0.8078.80', 'tar.xz URL build version parsed');
ok(buildVersionFromUrl('https://download.wayfern.com/wayfern_156.0.8078.80-2.2_macos.dmg') === '156.0.8078.80', 'dmg URL build version parsed (package revision ignored)');
ok(buildVersionFromUrl('https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.80/linux64/chrome-linux64.zip') === '156.0.8078.80', 'path-segment build version parsed');
ok(buildVersionFromUrl('https://download.wayfern.com/wayfern-latest.zip') === '', 'unversioned URL falls back to empty');
ok(buildVersionFromUrl('https://192.168.1.100/wayfern-latest.zip') === '', 'IPv4 host is not mistaken for a build version');
ok(buildVersionFromUrl('https://127.0.0.1/download/wayfern-156.0.8078.80.tar.xz') === '156.0.8078.80', 'version in path wins over an IPv4 host');
ok(buildVersionFromUrl('https://download.wayfern.com/wayfern-1.2.3.4.5.dmg') === '', 'truncated 5-segment version is rejected');
ok(managerSource.includes('version: buildVersion || feedVersion'), 'fetchOfficialRelease records the URL build as the version');
ok(managerSource.includes('feedVersion,'), 'fetchOfficialRelease keeps the announced feed version for diagnostics');
ok(managerSource.includes('与实际构建'), 'feed/build divergence is surfaced through onProgress');

// 3. Engine + IPC + preload plumbing
const engine = read('engine.js');
ok(engine.includes('async kernelDelete(') && engine.includes('async kernelCheck(') && engine.includes('async kernelCancelDownload('), 'engine exposes delete/check/cancel');
ok(engine.includes('autoUpdateKernel') , 'engine policy accepts autoUpdateKernel');
const main = read('main.js');
ok(main.includes('registerKernelIpc({ registerTrustedIpc, engine, dialog })'), 'host registers the kernel IPC domain through its trusted sender guard');
const kernelIpc = read('main/kernel-ipc.js');
for (const ch of ["'kernel:delete'", "'kernel:check'", "'kernel:cancel-download'"]) ok(kernelIpc.includes(ch), `IPC ${ch} registered`);
const preload = read('preload.js');
ok(preload.includes('kernelDelete:') && preload.includes('kernelCheck:') && preload.includes('kernelCancelDownload:'), 'preload ops expose delete/check/cancel');

// 4. Kernel manager page structure
const index = read('index.html');
ok(index.includes('data-view="kernels"'), 'sidebar has 内核管理 nav item');
ok(index.includes('id="view-kernels"'), 'view-kernels section exists');
ok(!/<article class="storage-settings-card" id="kernel-settings-card"[>\s]/.test(index.slice(index.indexOf('id="view-system"'))), 'old kernel card removed from view-system');
const kernelsSection = index.slice(index.indexOf('id="view-kernels"'), index.indexOf('id="view-system"'));
for (const id of ['kernel-installed-list', 'kernel-progress-wrap', 'kernel-progress-fill', 'kernel-progress-percent', 'kernel-progress-speed', 'kernel-auto-update', 'kernel-cancel-download', 'kernel-sync-banner', 'kernel-status-badge']) {
  ok(kernelsSection.includes(`id="${id}"`), `kernel page has #${id}`);
}
ok(kernelsSection.includes('data-i18n="system.kernel.installedTitle"') && kernelsSection.includes('data-i18n="system.kernel.availableTitle"'), 'kernel page uses i18n section titles');

// 5. UI wiring
const uiKernel = read('ui/ui-kernel.js');
ok(uiKernel.includes("value.type !== 'kernel-progress'"), 'UI subscribes to kernel-progress events');
ok(uiKernel.includes('kernelCancelDownload'), 'UI cancel button calls the cancel op');
ok(uiKernel.includes('confirmAction'), 'delete goes through the confirm dialog');
ok(uiKernel.includes('kernelDelete(kernel.engine, kernel.version)'), 'delete calls the delete op');
ok(uiKernel.includes('kernelCheck(kernel.engine, kernel.version)'), 'check calls the check op');
ok(uiKernel.includes('autoUpdateKernel: e.target.checked'), 'auto-update toggle persists');
ok(uiKernel.includes("tone: 'error'") && uiKernel.includes("tone: 'success'"), 'toasts use semantic tones');
ok(!/tx\(`[^`]*[\u3400-\u9fff]/.test(uiKernel), 'no raw Chinese template literals left in ui-kernel.js');

// 6. Renderer view registration
const renderer = read('renderer.js');
ok(renderer.includes("kernels: ['view.kernels', 'view.kernels.sub']"), 'viewMetaFor knows the kernels view');
ok(renderer.includes("view === 'kernels'"), 'switchView refreshes the kernel page');

// 7. i18n: every locale has nav.kernels; en has the full kernel set
const I = require('./i18n.js');
for (const loc of ['zh-CN', 'en', 'ja', 'vi', 'fr', 'de', 'th', 'id']) {
  I.setPreference(loc, { persist: false, silent: true });
  if (I.t('nav.kernels') === 'nav.kernels') fails.push(`i18n ${loc} missing nav.kernels`);
}
console.log('ok  nav.kernels present in all 8 locales');
I.setPreference('en', { persist: false, silent: true });
const enKeys = ['system.kernel.title', 'system.kernel.desc', 'system.kernel.syncNote', 'system.kernel.syncNoteVersion', 'system.kernel.autoUpdate', 'system.kernel.autoUpdateHint',
  'system.kernel.installedTitle', 'system.kernel.availableTitle', 'system.kernel.detailTitle', 'system.kernel.badgeInUse', 'system.kernel.badgeDefault', 'system.kernel.badgeIdle',
  'system.kernel.check', 'system.kernel.checkOk', 'system.kernel.deleteMsg', 'system.kernel.deleteDetails', 'system.kernel.deletedToast', 'system.kernel.inUseBlock',
  'system.kernel.cancel', 'system.kernel.cancelToast', 'system.kernel.stageDownload', 'system.kernel.stageExtract', 'system.kernel.stageValidate', 'system.kernel.stageDone',
  'system.kernel.speed', 'system.kernel.modeIndependent', 'system.kernel.modeSystem', 'system.kernel.blocked', 'system.kernel.installedLoading'];
for (const key of enKeys) {
  const value = I.t(key);
  if (value === key) fails.push(`en catalog missing ${key}`);
}
console.log('ok  en catalog carries the kernel manager keys');

// 8. CSS coverage
const css = read('modern.css');
for (const cls of ['.kernel-badge-pill', '.kernel-badge-default', '.kernel-badge-use', '.kernel-badge-idle', '.kernel-installed-item', '.kernel-installed-actions',
  '.kernel-progress-track', '.kernel-progress-fill', '.kernel-sync-banner', '.kernel-section-title', '.toast-success', '.toast-error', '.toast-warning',
  'dialog.confirm-danger', '.field-hint', 'button.primary:disabled', 'tr.selected-row', '.trash-chip']) {
  ok(css.includes(cls), `modern.css styles ${cls}`);
}

if (fails.length) {
  console.error('\nFAIL kernel-management-selftest:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('\nPASS kernel-management-selftest');

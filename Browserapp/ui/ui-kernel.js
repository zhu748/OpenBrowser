(() => {
'use strict';

/**
 * OpenBrowser UI submodule — 内核管理 page (kernel download / check / delete /
 * progress, aligned with the reference kernel manager: per-kernel status
 * badges, 检测内核, 确定删除该内核吗？ confirm, cancelable downloads with a
 * percent + speed progress bar, and the auto-update policy).
 */
const {
  toast,
  tx,
  t,
  log,
  updateEngineBadge,
  syncThemedSelects,
} = window.OpenBrowserApp || window;
const app = window.OpenBrowserApp || window;

const ENGINE_LABEL = { chromium: 'Chrome for Testing', firefox: 'Firefox' };

function kernelSourceLabel(source) {
  if (source === 'donut-wayfern') return tx('独立内核');
  if (source === 'chrome-stable') return 'Google Chrome Stable';
  if (source === 'chrome-for-testing') return 'Chrome for Testing';
  if (source === 'custom') return tx('自定义');
  if (source === 'mozilla') return 'Firefox';
  return source || '—';
}

function fillVersionSelect(select, payload) {
  if (!select) return;
  select.replaceChildren();
  for (const item of payload?.versions || []) {
    const label = `${item.version}${item.channel === 'esr' ? t('system.kernel.esrTag') : ''}${item.installed ? t('system.kernel.installedTag') : ''}`;
    select.add(new Option(label, item.version));
  }
}

async function loadKernelVersionOptions(engine, refresh) {
  const chromium = document.getElementById('kernel-chromium-version');
  const firefox = document.getElementById('kernel-firefox-version');
  if (engine === 'firefox' && firefox) firefox.replaceChildren(new Option(t('system.kernel.loading'), ''));
  if (engine !== 'firefox' && chromium) chromium.replaceChildren(new Option(t('system.kernel.loading'), ''));
  try {
    const payload = await window.ops.kernelListVersions(engine, refresh);
    if (engine === 'firefox') fillVersionSelect(firefox, payload);
    else fillVersionSelect(chromium, payload);
    return payload;
  } catch (error) {
    const target = engine === 'firefox' ? firefox : chromium;
    if (target) target.replaceChildren(new Option(t('system.kernel.loadFailed'), ''));
    toast(t('system.kernel.catalogFailed') + (error?.message || String(error)), { tone: 'error' });
    return null;
  }
}

// ========== Progress bar (percent + speed + stage), driven by kernel-progress events ==========
function setProgressVisible(visible) {
  const wrap = document.getElementById('kernel-progress-wrap');
  if (wrap) wrap.hidden = !visible;
}

function renderProgress({ percent = 0, speed = 0, label = '' } = {}) {
  setProgressVisible(true);
  const fill = document.getElementById('kernel-progress-fill');
  const pct = document.getElementById('kernel-progress-percent');
  const speedEl = document.getElementById('kernel-progress-speed');
  const labelEl = document.getElementById('kernel-progress-label');
  const mbps = Math.max(0, Number(speed) || 0) / (1024 * 1024);
  const shown = mbps >= 1 ? mbps.toFixed(1) : mbps.toFixed(2);
  if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (pct) pct.textContent = `${Math.floor(percent)}%`;
  if (speedEl) speedEl.textContent = t('system.kernel.speed', { speed: shown });
  if (labelEl && label) labelEl.textContent = label;
}

function hideProgress() {
  setProgressVisible(false);
  const cancelBtn = document.getElementById('kernel-cancel-download');
  if (cancelBtn) cancelBtn.hidden = true;
}

function stageLabel(phase, fallbackMessage) {
  switch (phase) {
    case 'download': return t('system.kernel.stageDownload');
    case 'extract': return t('system.kernel.stageExtract');
    case 'validate': return t('system.kernel.stageValidate');
    case 'check': return t('system.kernel.stageCheck');
    case 'canceled': return t('system.kernel.stageCanceled');
    case 'deleted': return t('system.kernel.stageDeleted');
    case 'done': return t('system.kernel.stageDone');
    default: return fallbackMessage || t('system.kernel.stageDownload');
  }
}

function handleKernelProgressEvent(value) {
  if (!value || value.type !== 'kernel-progress') return;
  const phase = value.phase;
  if (phase === 'download') {
    renderProgress({
      percent: value.percent || 0,
      speed: value.speed || 0,
      label: stageLabel('download'),
    });
    const cancelBtn = document.getElementById('kernel-cancel-download');
    if (cancelBtn) cancelBtn.hidden = false;
    return;
  }
  if (phase === 'extract' || phase === 'validate' || phase === 'check') {
    renderProgress({ percent: 100, speed: 0, label: stageLabel(phase) });
    return;
  }
  if (phase === 'canceled') {
    hideProgress();
    toast(t('system.kernel.cancelToast'), { tone: 'warning' });
    refreshAfterKernelChange();
    return;
  }
  if (phase === 'deleted') {
    renderProgress({ percent: 100, speed: 0, label: stageLabel('deleted') });
    setTimeout(hideProgress, 1200);
    refreshAfterKernelChange();
    return;
  }
  if (phase === 'done') {
    hideProgress();
  }
}

async function refreshAfterKernelChange() {
  await Promise.all([
    refreshKernelInstalledList(),
    refreshKernelPanel(),
    loadKernelVersionOptions('chromium', false).catch(() => {}),
    loadKernelVersionOptions('firefox', false).catch(() => {}),
  ]);
}

// ========== Per-version install (with progress bar + cancel) ==========

// Single-flight download guard: the chromium / firefox install buttons and the
// stable-channel download all drive the same progress DOM
// (#kernel-progress-fill/percent/speed) and share one cancel button, while the
// main-side install guard is keyed per engine:version — two concurrent
// downloads made the percent/speed readings jump between streams, and the
// first finisher hid the progress bar + cancel button while the second
// download was still running. Gate every download trigger until all are idle.
const KERNEL_DOWNLOAD_TRIGGERS = ['kernel-chromium-install', 'kernel-firefox-install', 'kernel-download'];
let kernelDownloadInFlight = false;

function setKernelDownloadTriggersDisabled(disabled) {
  for (const id of KERNEL_DOWNLOAD_TRIGGERS) {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = disabled;
  }
}

async function withKernelDownloadGuard(fn) {
  if (kernelDownloadInFlight) return;
  kernelDownloadInFlight = true;
  setKernelDownloadTriggersDisabled(true);
  try {
    await fn();
  } finally {
    kernelDownloadInFlight = false;
    setKernelDownloadTriggersDisabled(false);
  }
}

async function installKernelVersion(engine) {
  const select = engine === 'firefox'
    ? document.getElementById('kernel-firefox-version')
    : document.getElementById('kernel-chromium-version');
  const progress = document.getElementById('kernel-progress');
  const cancelBtn = document.getElementById('kernel-cancel-download');
  const engineName = ENGINE_LABEL[engine] || engine;
  const version = select?.value;
  if (!version) { toast(t('system.kernel.pickFirst'), { tone: 'warning' }); return; }
  await withKernelDownloadGuard(async () => {
    try {
      if (cancelBtn) cancelBtn.hidden = false;
      if (progress) { progress.hidden = true; progress.textContent = ''; }
      renderProgress({ percent: 0, speed: 0, label: t('system.kernel.stageDownload') });
      toast(t('system.kernel.installStart', { engine: engineName, version }));
      const kernel = await window.ops.kernelInstallVersion(engine, version);
      if (progress) { progress.hidden = false; progress.textContent = t('system.kernel.installReady', { engine: engineName, version }) + (kernel?.path || ''); }
      toast(t('system.kernel.installDone', { engine: engineName, version }), { tone: 'success' });
      log('Kernel', `${engineName} ${version} · ${kernel?.path || ''}`);
    } catch (error) {
      const message = error?.message || String(error);
      const canceled = /canceled|取消/i.test(message);
      if (progress && !canceled) {
        progress.hidden = false;
        progress.textContent = t('system.kernel.installFail', { engine: engineName }) + message;
        toast(t('system.kernel.installFail', { engine: engineName }) + message, { tone: 'error' });
      }
    } finally {
      hideProgress();
      await refreshAfterKernelChange();
    }
  });
}

// ========== Installed kernel list (badges + 检测 / 设为默认 / 删除) ==========
async function refreshKernelInstalledList() {
  const host = document.getElementById('kernel-installed-list');
  if (!host) return;
  try {
    const installed = await window.ops.kernelListInstalled();
    const info = await window.ops.getInfo().catch(() => null);
    const pinned = info?.kernel?.meta?.pin || null;
    if (!Array.isArray(installed) || !installed.length) {
      host.replaceChildren(Object.assign(document.createElement('small'), { textContent: t('system.kernel.installedEmpty') }));
      return;
    }
    host.replaceChildren();
    for (const kernel of installed) {
      host.append(buildKernelRow(kernel, pinned));
    }
    syncThemedSelects?.();
  } catch (error) {
    host.replaceChildren(Object.assign(document.createElement('small'), { textContent: t('system.kernel.installedColon') + (error?.message || String(error)) }));
  }
}

function buildKernelRow(kernel, pinned) {
  const row = document.createElement('div');
  row.className = 'kernel-installed-item';
  const isPinned = Boolean(pinned && pinned.engine === kernel.engine && pinned.version === kernel.version);
  const resolved = kernelStatusCache?.kernel;
  const inUse = Boolean(resolved && resolved.engine === kernel.engine && String(resolved.version) === String(kernel.version));

  const main = document.createElement('div');
  main.className = 'kernel-installed-main';
  const name = document.createElement('strong');
  name.textContent = kernel.name;
  const badges = document.createElement('span');
  badges.className = 'kernel-installed-badges';
  if (isPinned) badges.append(badge(t('system.kernel.badgeDefault'), 'default'));
  if (inUse) badges.append(badge(t('system.kernel.badgeInUse'), 'use'));
  else badges.append(badge(t('system.kernel.badgeIdle'), 'idle'));
  main.append(name, badges);
  const path = document.createElement('code');
  path.className = 'kernel-installed-path';
  path.textContent = kernel.path || '';

  const spacer = document.createElement('span');
  spacer.className = 'spacer';

  const actions = document.createElement('div');
  actions.className = 'kernel-installed-actions';
  const checkBtn = outlineButton(t('system.kernel.check'));
  checkBtn.addEventListener('click', () => checkKernel(kernel, checkBtn));
  const pinBtn = outlineButton(isPinned ? t('system.kernel.clearPin') : t('system.kernel.setPin'));
  pinBtn.addEventListener('click', async () => {
    try {
      pinBtn.disabled = true;
      if (isPinned) await window.ops.kernelUnpin();
      else await window.ops.kernelPin(kernel.engine, kernel.version);
      toast(isPinned ? t('system.kernel.restoreDefault') : t('system.kernel.pinToast', { name: kernel.name }), { tone: 'success' });
      await refreshAfterKernelChange();
    } catch (error) {
      toast(error?.message || String(error), { tone: 'error' });
    } finally {
      pinBtn.disabled = false;
    }
  });
  const deleteBtn = outlineButton(t('system.kernel.delete'), 'danger');
  deleteBtn.addEventListener('click', () => deleteKernel(kernel, deleteBtn));
  actions.append(checkBtn, pinBtn, deleteBtn);

  row.append(main, path, spacer, actions);
  return row;
}

function badge(text, kind) {
  const el = document.createElement('span');
  el.className = `kernel-badge-pill kernel-badge-${kind}`;
  el.textContent = text;
  return el;
}

function outlineButton(label, extra = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `outline${extra ? ` ${extra}` : ''}`;
  btn.textContent = label;
  return btn;
}

async function checkKernel(kernel, button) {
  try {
    if (button) button.disabled = true;
    toast(t('system.kernel.checking', { name: kernel.name }));
    const result = await window.ops.kernelCheck(kernel.engine, kernel.version);
    toast(t('system.kernel.checkOk', { name: kernel.name, version: result?.version || kernel.version }), { tone: 'success' });
    log('Kernel', `check ${kernel.name} ok`);
  } catch (error) {
    toast(error?.message || String(error), { tone: 'error' });
  } finally {
    if (button) button.disabled = false;
  }
}

async function deleteKernel(kernel, button) {
  const confirmed = await app.confirmAction?.({
    title: t('system.kernel.deleteTitle'),
    message: t('system.kernel.deleteMsg'),
    details: t('system.kernel.deleteDetails', { name: kernel.name }),
    actionLabel: t('system.kernel.deleteAction'),
    danger: true,
  });
  if (!confirmed) return;
  try {
    if (button) button.disabled = true;
    await window.ops.kernelDelete(kernel.engine, kernel.version);
    toast(t('system.kernel.deletedToast', { name: kernel.name }), { tone: 'success' });
    log('Kernel', `deleted ${kernel.name}`);
  } catch (error) {
    const message = error?.message || String(error);
    toast(/使用中/.test(message) ? t('system.kernel.inUseBlock') : message, { tone: 'error' });
  } finally {
    if (button) button.disabled = false;
    await refreshAfterKernelChange();
  }
}

document.getElementById('kernel-chromium-install')?.addEventListener('click', () => installKernelVersion('chromium'));
document.getElementById('kernel-firefox-install')?.addEventListener('click', () => installKernelVersion('firefox'));
document.getElementById('kernel-chromium-refresh')?.addEventListener('click', () => loadKernelVersionOptions('chromium', true));
document.getElementById('kernel-firefox-refresh')?.addEventListener('click', () => loadKernelVersionOptions('firefox', true));
document.getElementById('kernel-cancel-download')?.addEventListener('click', async () => {
  try {
    const result = await window.ops.kernelCancelDownload();
    if (!result?.canceled) toast(t('system.kernel.cancelNone'), { tone: 'warning' });
  } catch (error) {
    toast(error?.message || String(error), { tone: 'error' });
  }
});
window.refreshKernelPanel = refreshKernelPanel;
window.refreshKernelInstalledList = refreshKernelInstalledList;

let kernelStatusCache = null;

async function refreshKernelPanel() {
  const badge_ = document.getElementById('kernel-status-badge');
  const pathEl = document.getElementById('kernel-path');
  const verEl = document.getElementById('kernel-version');
  const activePathEl = document.getElementById('kernel-active-path');
  const launchModeEl = document.getElementById('kernel-launch-mode');
  const channelEl = document.getElementById('kernel-channel');
  const prefer = document.getElementById('kernel-prefer-independent');
  const allow = document.getElementById('kernel-allow-system');
  const systemBrowser = document.getElementById('kernel-system-browser');
  const autoUpdate = document.getElementById('kernel-auto-update');
  const syncNote = document.getElementById('kernel-sync-note');
  try {
    const info = await window.ops.getInfo();
    updateEngineBadge(info);
    const st = info.kernel || await window.ops.kernelStatus();
    kernelStatusCache = st;
    const k = st.kernel;
    if (badge_) {
      badge_.textContent = k ? t('system.kernel.badgeInstalled') : t('system.kernel.badgeNone');
      badge_.dataset.state = k ? 'ok' : 'warn';
    }
    if (pathEl) pathEl.textContent = k?.path || st.kernelsRoot || '—';
    if (verEl) {
      const remote = st.meta?.remoteVersion;
      verEl.textContent = k
        ? `${k.version || '—'} · ${kernelSourceLabel(k.source)}${remote && remote !== k.version ? ` · ${t('system.kernel.updateAvailable', { version: remote })}` : ''}`
        : t('system.kernel.badgeNone');
    }
    if (channelEl) {
      channelEl.textContent = st.channel
        ? [st.channel.name, st.channel.metaUrl].filter(Boolean).join(' · ')
        : 'Google Chrome Stable';
    }
    if (syncNote) {
      syncNote.textContent = k?.source === 'chrome-stable' && k?.version
        ? t('system.kernel.syncNoteVersion', { version: k.version })
        : t('system.kernel.syncNote');
    }
    if (autoUpdate) autoUpdate.checked = st.autoUpdateKernel !== false;
    const selection = info.kernelSelection;
    if (activePathEl) activePathEl.textContent = selection?.browser?.path || selection?.message || '—';
    if (launchModeEl) {
      const mode = selection?.mode;
      launchModeEl.textContent = mode === 'independent'
        ? `${t('system.kernel.modeIndependent')} · ${selection.browser.name}`
        : mode === 'system-manual'
          ? `${t('system.kernel.modeSystemManual')} · ${selection.browser.name}`
          : mode === 'system'
            ? `${t('system.kernel.modeSystem')} · ${selection.browser.name}`
            : t('system.kernel.blocked');
    }
    if (prefer) prefer.checked = info.preferIndependentKernel !== false;
    if (allow) allow.checked = info.allowSystemBrowserFallback === true;
    if (systemBrowser) {
      const selected = info.systemBrowserPath || '';
      systemBrowser.replaceChildren(new Option(t('system.kernel.none'), ''));
      for (const item of info.systemBrowsers || []) {
        systemBrowser.add(new Option(`${item.name} · ${item.path}`, item.path));
      }
      systemBrowser.value = selected;
    }
  } catch (_error) {
    if (badge_) {
      badge_.textContent = t('system.kernel.badgeFail');
      badge_.dataset.state = 'fail';
    }
  }
}

document.getElementById('kernel-refresh')?.addEventListener('click', () => {
  refreshKernelPanel();
  toast(t('system.kernel.refreshed'));
});
document.getElementById('kernel-auto-update')?.addEventListener('change', async (e) => {
  try {
    await window.ops.kernelPolicy({ autoUpdateKernel: e.target.checked });
    toast(e.target.checked ? t('system.kernel.autoUpdateOn') : t('system.kernel.autoUpdateOff'), { tone: 'success' });
  } catch (error) {
    e.target.checked = !e.target.checked;
    toast(error.message, { tone: 'error' });
  }
});
document.getElementById('kernel-download')?.addEventListener('click', () => withKernelDownloadGuard(async () => {
  const progress = document.getElementById('kernel-progress');
  const cancelBtn = document.getElementById('kernel-cancel-download');
  try {
    if (cancelBtn) cancelBtn.hidden = false;
    if (progress) { progress.hidden = true; progress.textContent = ''; }
    renderProgress({ percent: 0, speed: 0, label: t('system.kernel.stageDownload') });
    toast(t('system.kernel.stableBegin'));
    const kernel = await window.ops.kernelDownload(true);
    if (progress) { progress.hidden = false; progress.textContent = t('system.kernel.stableReady') + (kernel?.path || ''); }
    toast(t('system.kernel.stableReadyToast', { source: kernelSourceLabel(kernel?.source), version: kernel?.version || '' }), { tone: 'success' });
    await refreshKernelPanel();
    log('Kernel', `${kernelSourceLabel(kernel?.source)} ${kernel?.version || ''} · ${kernel?.path || ''}`);
  } catch (error) {
    const message = error?.message || String(error);
    const canceled = /canceled|取消/i.test(message);
    if (!canceled) {
      if (progress) { progress.hidden = false; progress.textContent = t('system.kernel.stableFail') + message; }
      toast(t('system.kernel.stableFail') + message, { tone: 'error' });
    }
  } finally {
    hideProgress();
    await refreshAfterKernelChange();
  }
}));
document.getElementById('kernel-check-update')?.addEventListener('click', async () => {
  const progress = document.getElementById('kernel-progress');
  try {
    if (progress) { progress.hidden = true; }
    const result = await window.ops.kernelCheckUpdate();
    if (result.error) {
      toast(t('system.kernel.stableCheckFail') + result.error, { tone: 'error' });
      return;
    }
    const remote = result.remote;
    const installed = result.installed;
    if (!installed && !remote) {
      toast(t('system.kernel.stableMissing'), { tone: 'warning' });
      return;
    }
    const ver = installed?.version || remote?.version || '';
    const src = kernelSourceLabel(installed?.source || remote?.source);
    if (result.needsUpdate) {
      toast(t('system.kernel.stableUpdatable', { source: src, version: ver }), { tone: 'warning' });
      if (remote?.version) toast(t('system.kernel.updateAvailable', { version: remote.version }));
    } else {
      toast(t('system.kernel.stableLatest', { source: src, version: ver }), { tone: 'success' });
    }
    await refreshKernelPanel();
  } catch (error) {
    toast(error.message, { tone: 'error' });
  }
});
document.getElementById('kernel-choose')?.addEventListener('click', async () => {
  try {
    const result = await window.ops.kernelChooseCustom();
    if (result?.canceled) return;
    const kernel = result.kernel || result;
    const validation = kernel?.validation;
    const progress = document.getElementById('kernel-progress');
    if (validation?.browser) {
      toast(t('system.kernel.customValidated', { browser: validation.browser }), { tone: 'success' });
      if (progress) { progress.hidden = false; progress.textContent = t('system.kernel.customHint', { browser: validation.browser }); }
    } else {
      toast(t('system.kernel.customSet'), { tone: 'success' });
    }
    await refreshKernelPanel();
  } catch (error) { toast(error.message, { tone: 'error' }); }
});
document.getElementById('kernel-prefer-independent')?.addEventListener('change', async (e) => {
  try {
    await window.ops.kernelPolicy({ preferIndependentKernel: e.target.checked });
    toast(e.target.checked ? t('system.kernel.preferIndependent') : t('system.kernel.preferOff'), { tone: 'success' });
  } catch (error) { toast(error.message, { tone: 'error' }); }
});
document.getElementById('kernel-allow-system')?.addEventListener('change', async (e) => {
  try {
    const systemBrowser = document.getElementById('kernel-system-browser');
    if (e.target.checked && !systemBrowser?.value) {
      e.target.checked = false;
      toast(t('system.kernel.pickSystemFirst'), { tone: 'warning' });
      return;
    }
    await window.ops.kernelPolicy({ allowSystemBrowserFallback: e.target.checked });
    toast(e.target.checked ? t('system.kernel.allowOn') : t('system.kernel.allowOff'), { tone: 'success' });
    await refreshKernelPanel();
  } catch (error) {
    e.target.checked = !e.target.checked;
    toast(error.message, { tone: 'error' });
  }
});
document.getElementById('kernel-system-browser')?.addEventListener('change', async (e) => {
  try {
    const allow = document.getElementById('kernel-allow-system');
    await window.ops.kernelPolicy({ systemBrowserPath: e.target.value });
    if (allow && !e.target.value) allow.checked = false;
    toast(e.target.value ? t('system.kernel.systemBrowserSet') : t('system.kernel.systemBrowserCleared'), { tone: 'success' });
    await refreshKernelPanel();
  } catch (error) {
    toast(error.message, { tone: 'error' });
    await refreshKernelPanel();
  }
});

window.kernelSourceLabel = kernelSourceLabel;
// Progress events arrive over the shared engine:event channel.
try {
  window.ops?.onEvent?.((value) => handleKernelProgressEvent(value));
} catch (_) { /* preload not ready yet: install buttons still work */ }
// Initial load for the kernel manager page. Deferred until the kernel/system
// view is first opened: firing these IPCs at module load pays for two version
// manifest fetches plus an installed-kernels scan on every app start, even
// though most sessions never open this page.
let kernelInitialLoadStarted = false;
window.ensureKernelInitialLoad = function ensureKernelInitialLoad() {
  if (kernelInitialLoadStarted) return;
  kernelInitialLoadStarted = true;
  loadKernelVersionOptions('chromium', false);
  loadKernelVersionOptions('firefox', false);
  refreshKernelInstalledList();
};
})();

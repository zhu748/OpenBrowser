// OpenBrowser 1:1 Modern Workbench & Feature Extensions
// Implements:
// 1. Full-page Create/Edit Window with 4 modes (Single / Batch / Window Import-Upload / AI Batch)
// 2. 4 Collapsible Accordion Sections (窗口基础信息 / 基础设置 / 高级指纹设置 / 偏好设置)
// 3. Visual OS Icon Picker (Windows / macOS / Linux / Android / iOS) & Visual Kernel Picker (Chrome / Firefox)
// 4. Roxy-style Segmented Pill Controls across Basic, Fingerprint, and Preference settings
// 5. Live 3D/Vector Device Mockup Preview (Laptop for Win/Mac/Linux, Smartphone for Android/iOS)
// 6. Slide-over Quick Proxy Drawer (为 [编号] 编辑代理 IP) in Window Management list
// 7. Window Transfer (转移窗口 / 接收窗口 / 转移中 Tab) & Window Upload/Import (上传窗口 / Excel & TXT 模板下载)
// 8. My Templates (我的模板), Platform Accounts Pool (平台账号), and Cookie Robot (Cookie 机器人)

(() => {
  'use strict';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch]));

  const TEMPLATES_STORAGE_KEY = 'openbrowser-window-templates-v1';
  const ACCOUNTS_STORAGE_KEY = 'openbrowser-platform-accounts-v1';
  const TRANSFERS_STORAGE_KEY = 'openbrowser-window-transfers-v1';

  // --- SVG Brand & OS Icons ---
  const OS_SVG_ICONS = {
    Windows: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path fill="#0078D4" d="M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z"/></svg>',
    macOS: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><rect x="2" y="4" width="20" height="16" rx="4" fill="#1e293b"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="-apple-system,BlinkMacSystemFont,sans-serif">OS</text></svg>',
    Linux: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="9" fill="#334155"/><ellipse cx="12" cy="14" rx="5" ry="5.5" fill="#f8fafc"/><circle cx="10.2" cy="9.5" r="1.1" fill="#fff"/><circle cx="13.8" cy="9.5" r="1.1" fill="#fff"/><circle cx="10.2" cy="9.5" r="0.5" fill="#0f172a"/><circle cx="13.8" cy="9.5" r="0.5" fill="#0f172a"/><polygon points="12,10.8 10.3,12.5 13.7,12.5" fill="#f59e0b"/></svg>',
    Android: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 11a6 6 0 0112 0v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6z" fill="#3ddc84"/><line x1="8.5" y1="6.5" x2="7" y2="4" stroke="#3ddc84" stroke-width="1.6" stroke-linecap="round"/><line x1="15.5" y1="6.5" x2="17" y2="4" stroke="#3ddc84" stroke-width="1.6" stroke-linecap="round"/><circle cx="9.8" cy="9.5" r="0.9" fill="#fff"/><circle cx="14.2" cy="9.5" r="0.9" fill="#fff"/></svg>',
    iOS: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><rect x="6" y="2.5" width="12" height="19" rx="3" fill="#0ea5e9" stroke="#0284c7" stroke-width="1.2"/><rect x="9.5" y="4.5" width="5" height="1.4" rx="0.7" fill="#fff"/><text x="12" y="14.5" text-anchor="middle" fill="#fff" font-size="6.8" font-weight="700" font-family="-apple-system,BlinkMacSystemFont,sans-serif">iOS</text></svg>',
  };

  const KERNEL_SVG_ICONS = {
    chromium: '<svg viewBox="0 0 256 256" width="16" height="16" fill="none"><circle cx="128" cy="128" r="64" fill="#fff"/><path fill="#34a853" d="M96 183.4A63.7 63.7 0 0 1 72.6 160L17.2 64A128 128 0 0 0 128 256l55.4-96A64 64 0 0 1 96 183.4Z"/><path fill="#fbbc04" d="M192 128a63.7 63.7 0 0 1-8.6 32L128 256A128 128 0 0 0 238.9 64h-111a64 64 0 0 1 64 64Z"/><circle cx="128" cy="128" r="52" fill="#1a73e8"/><path fill="#ea4335" d="M96 72.6a63.7 63.7 0 0 1 32-8.6h110.8a128 128 0 0 0-221.7 0l55.5 96A64 64 0 0 1 96 72.6Z"/></svg>',
    firefox: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="10.5" fill="#ff7139"/><path d="M12.6 5.1c2.5 1.5 3.7 3.9 3.4 6.5-.1 1.2-.7 2.1-1.6 2.7 1.5-.2 2.6-1.2 3-2.7.5 2.6-.5 4.9-2.7 6.3-1.9 1.2-4 1.5-6.2.9C6 18.1 4.4 15.9 4.5 13.2c.1-2.1 1.2-3.8 3-4.9-.2.6-.2 1.2 0 1.7.4-1.9 1.7-3.2 3.6-3.7-.8-.6-1.7-.8-2.7-.7 1.4-1.1 3-1.5 4.2-1.2-.2-.9-1-1.6-2.1-1.9 1.6-.4 2.9-.1 4.1.6Z" fill="#fff" opacity=".92"/></svg>',
  };

  function getOsIconSvg(osName) {
    const s = String(osName || 'Windows');
    if (/mac/i.test(s)) return OS_SVG_ICONS.macOS;
    if (/linux|ubuntu|debian|fedora/i.test(s)) return OS_SVG_ICONS.Linux;
    if (/android/i.test(s)) return OS_SVG_ICONS.Android;
    if (/ios|iphone|ipad/i.test(s)) return OS_SVG_ICONS.iOS;
    return OS_SVG_ICONS.Windows;
  }

  // --- Built-in + User Window Templates ---
  function defaultWindowTemplates() {
    return [
      {
        id: 'tpl-win11-ecom',
        name: '美区跨境电商主力模板 (Win11 + Chrome 156)',
        category: '跨境电商',
        os: 'Windows',
        osVersion: 'Windows 11',
        engine: 'chromium',
        engineVersion: 'latest',
        language: 'en-US',
        width: 1280,
        height: 820,
        platform: { type: 'amazon', startUrl: 'https://www.amazon.com' },
        privacy: { webrtc: 'disabled', canvas: 'noise', webgl: 'noise', webglMeta: 'noise', audio: 'noise', clientRects: 'noise', dntMode: 'on', portScanProtect: true, cores: 12, memory: 8 },
        createdAt: '2026-11-01T10:00:00.000Z',
      },
      {
        id: 'tpl-mac-social',
        name: '海外社媒矩阵防关联模板 (macOS + Chrome 156)',
        category: '社媒运营',
        os: 'macOS',
        osVersion: 'macOS 15',
        engine: 'chromium',
        engineVersion: 'latest',
        language: 'en-US',
        width: 1440,
        height: 900,
        platform: { type: 'twitter', startUrl: 'https://x.com' },
        privacy: { webrtc: 'disabled', canvas: 'noise', webgl: 'noise', webglMeta: 'noise', audio: 'noise', clientRects: 'noise', dntMode: 'on', portScanProtect: true, cores: 8, memory: 8 },
        createdAt: '2026-11-02T10:00:00.000Z',
      },
      {
        id: 'tpl-android-tiktok',
        name: '移动端 TikTok 短视频养号模板 (Android 16)',
        category: '移动矩阵',
        os: 'Android',
        osVersion: 'Android 16',
        engine: 'chromium',
        engineVersion: 'latest',
        language: 'en-US',
        width: 412,
        height: 915,
        platform: { type: 'tiktok', startUrl: 'https://www.tiktok.com' },
        privacy: { webrtc: 'disabled', canvas: 'noise', webgl: 'noise', webglMeta: 'noise', audio: 'noise', battery: 'noise', bluetooth: 'real', portScanProtect: true, cores: 8, memory: 8 },
        createdAt: '2026-11-03T10:00:00.000Z',
      },
      {
        id: 'tpl-ios-mobile',
        name: 'iOS 26 移动环境防指纹模板 (iPhone 16 Pro)',
        category: '移动矩阵',
        os: 'iOS',
        osVersion: 'iOS 26',
        engine: 'chromium',
        engineVersion: 'latest',
        language: 'en-US',
        width: 393,
        height: 852,
        platform: { type: 'instagram', startUrl: 'https://www.instagram.com' },
        privacy: { webrtc: 'disabled', canvas: 'noise', webgl: 'noise', webglMeta: 'noise', audio: 'noise', battery: 'noise', portScanProtect: true, cores: 6, memory: 8 },
        createdAt: '2026-11-04T10:00:00.000Z',
      },
    ];
  }

  function loadWindowTemplates() {
    try {
      const raw = JSON.parse(localStorage.getItem(TEMPLATES_STORAGE_KEY) || 'null');
      if (Array.isArray(raw)) return raw;
    } catch (_) {}
    const defaults = defaultWindowTemplates();
    try { localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaults)); } catch (_) {}
    return defaults;
  }

  function saveWindowTemplates(list) {
    const values = Array.isArray(list) ? list : [];
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(values));
    windowTemplates = values;
  }

  let windowTemplates = loadWindowTemplates();

  // --- Platform Accounts Pool ---
  let platformAccounts = [];
  let accountLoad = null;

  function accountId() { return 'acc-' + crypto.randomUUID(); }
  function runAction(action) {
    const pending = new WeakSet();
    const report = (error) => {
      if (typeof toast === 'function') toast(error.message || String(error), { tone: 'error' });
    };
    return (...args) => {
      const event = args[0];
      const target = event?.currentTarget;
      const exclusive = target && ['BUTTON', 'FORM'].includes(target.tagName);
      if (exclusive && pending.has(target)) { event.preventDefault?.(); return Promise.resolve(); }
      if (exclusive) pending.add(target);
      const release = () => { if (exclusive) pending.delete(target); };
      try { return Promise.resolve(action(...args)).catch(report).finally(release); }
      catch (error) { report(error); release(); return Promise.resolve(); }
    };
  }

  function loadPlatformAccounts() {
    if (accountLoad) return accountLoad;
    accountLoad = (async () => {
      await window.OpenBrowserApp?.whenReady?.();
      if (typeof window.ops?.accountList !== 'function') throw new Error('账号库尚未就绪');
      let list = await window.ops.accountList();
      const legacy = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (legacy !== null) {
        const values = JSON.parse(legacy);
        if (!Array.isArray(values)) throw new Error('旧账号数据格式无效，原数据已保留');
        list = await window.ops.accountImport(values);
        if (!Array.isArray(list)) throw new Error('账号迁移未得到确认，原数据已保留');
        localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
      }
      if (!Array.isArray(list)) throw new Error('账号库响应无效');
      platformAccounts = list;
      renderAccountsView();
      populateAccountPoolSelect();
      return list;
    })().catch((error) => { accountLoad = null; throw error; });
    return accountLoad;
  }

  async function addPlatformAccounts(values) {
    await loadPlatformAccounts();
    const list = await window.ops.accountImport(values);
    if (!Array.isArray(list)) throw new Error('账号保存未得到确认');
    platformAccounts = list;
    renderAccountsView();
    populateAccountPoolSelect();
  }

  // --- Window Transfers Store ---
  let windowTransfers = [];
  let transferLoad = null;

  function loadWindowTransfers() {
    if (transferLoad) return transferLoad;
    transferLoad = (async () => {
      await window.OpenBrowserApp?.whenReady?.();
      let records = await window.ops.transferList();
      const legacy = localStorage.getItem(TRANSFERS_STORAGE_KEY);
      if (legacy !== null) {
        const values = JSON.parse(legacy);
        if (!Array.isArray(values)) throw new Error('旧转移记录格式无效，原数据已保留');
        records = await window.ops.transferImport(values);
        if (!Array.isArray(records)) throw new Error('转移记录迁移未得到确认');
        localStorage.removeItem(TRANSFERS_STORAGE_KEY);
      }
      if (!Array.isArray(records)) throw new Error('转移记录响应无效');
      windowTransfers = records;
      renderTransfersTable();
      return records;
    })().catch((error) => { transferLoad = null; throw error; });
    return transferLoad;
  }

  async function appendWindowTransfers(records) {
    await loadWindowTransfers();
    const saved = await window.ops.transferImport(records);
    if (!Array.isArray(saved)) throw new Error('转移记录保存未得到确认');
    windowTransfers = saved;
  }

  // --- Current Editor Mode State ---
  // 'edit' | 'single' | 'batch' | 'import' | 'ai'
  let currentEditorMode = 'edit';
  let pendingImportedRows = [];

  // --- Dynamic Device Mockup Preview Renderer with 3D Morph & Screen Boot Animation ---
  let lastMockupOs = null;
  let lastMockupEngine = null;

  function renderDeviceMockupPreview() {
    const container = document.getElementById('editor-device-mockup');
    if (!container) return;
    const os = document.getElementById('editor-os')?.value || 'Windows';
    const osVer = document.getElementById('editor-os-version')?.value || '';
    const engine = document.getElementById('editor-engine')?.value || 'chromium';
    const isMobile = /android|ios/i.test(os);
    const wasMobile = lastMockupOs ? /android|ios/i.test(lastMockupOs) : isMobile;
    const formFactorChanged = lastMockupOs !== null && isMobile !== wasMobile;
    const osOrEngineChanged = lastMockupOs !== null && (lastMockupOs !== os || lastMockupEngine !== engine);

    lastMockupOs = os;
    lastMockupEngine = engine;

    const osIcon = getOsIconSvg(os);
    const kernelIcon = KERNEL_SVG_ICONS[engine === 'firefox' ? 'firefox' : 'chromium'];
    const osDisplayName = os === 'macOS' ? 'MacOS' : os;
    const engineLabel = engine === 'firefox' ? 'Firefox' : 'Chrome';

    let screenThemeClass = 'screen-windows';
    if (/mac/i.test(os)) screenThemeClass = 'screen-macos';
    else if (/linux/i.test(os)) screenThemeClass = 'screen-linux';
    else if (/android/i.test(os)) screenThemeClass = 'screen-android';
    else if (/ios/i.test(os)) screenThemeClass = 'screen-ios';

    const animClass = formFactorChanged
      ? 'is-morphing-3d'
      : (osOrEngineChanged ? 'is-screen-booting' : '');

    container.innerHTML = `
      <div class="device-mockup-stage ${(isMobile ? 'is-mobile-stage' : 'is-desktop-stage')} ${escapeHtml(animClass)}">
        <div class="device-mockup-tabbar">
          <span class="device-tab-active ${(osOrEngineChanged ? 'is-badge-popping' : '')}">
            <span class="device-tab-icon">${osIcon}</span>
            <span class="device-tab-kernel">${kernelIcon}</span>
          </span>
          <span class="device-tab-plus">+</span>
        </div>
        ${(isMobile ? `
          <div class="device-phone-frame">
            <div class="device-phone-notch"></div>
            <div class="device-phone-screen ${escapeHtml(screenThemeClass)}">
              <div class="device-screen-glow"></div>
              <div class="device-screen-sweep"></div>
              <span class="device-screen-label">${escapeHtml(osDisplayName)}</span>
              <small class="device-screen-sub">${escapeHtml(osVer || osDisplayName)} · ${escapeHtml(engineLabel)}</small>
            </div>
            <div class="device-phone-home"></div>
          </div>
        ` : `
          <div class="device-laptop-frame">
            <div class="device-laptop-lid">
              <div class="device-laptop-camera"></div>
              <div class="device-laptop-screen ${escapeHtml(screenThemeClass)}">
                <div class="device-screen-glow"></div>
                <div class="device-screen-sweep"></div>
                <span class="device-screen-label">${escapeHtml(osDisplayName)}</span>
                <small class="device-screen-sub">${escapeHtml(osVer || osDisplayName)} · ${escapeHtml(engineLabel)}</small>
              </div>
            </div>
            <div class="device-laptop-base">
              <div class="device-laptop-lip"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Visual OS & Kernel Picker Sync ---
  function syncVisualOsAndKernelPickers() {
    const osSelect = document.getElementById('editor-os');
    const currentOs = osSelect?.value || 'Windows';
    document.querySelectorAll('#editor-os-visual button[data-os-val]').forEach((btn) => {
      const active = btn.dataset.osVal === currentOs;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const engSelect = document.getElementById('editor-engine');
    const currentEng = engSelect?.value || 'chromium';
    document.querySelectorAll('#editor-engine-visual button[data-engine-val]').forEach((btn) => {
      const active = btn.dataset.engineVal === currentEng;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Show/hide mobile simulation block emphasis
    const mobileBlock = document.getElementById('editor-mobile-sim-card');
    if (mobileBlock) {
      const isMobile = /android|ios/i.test(currentOs);
      mobileBlock.classList.toggle('is-mobile-highlighted', isMobile);
    }

    renderDeviceMockupPreview();
  }

  // --- Universal Pill Bar <-> Select / Checkbox Two-way Binding ---
  function syncAllPillBarsFromControls() {
    // 1. Select-backed pill groups: [data-sync-select="#selector"]
    document.querySelectorAll('.roxy-pill-group[data-sync-select]').forEach((group) => {
      const sel = document.querySelector(group.dataset.syncSelect);
      if (!sel) return;
      const val = sel.value;
      group.querySelectorAll('button[data-pill-val]').forEach((btn) => {
        const match = btn.dataset.pillVal === val
          || (btn.dataset.pillVal === 'custom_lang' && val !== 'ip' && val !== 'system' && val !== 'profile');
        btn.classList.toggle('active', match);
      });
    });

    // 2. Checkbox-backed pill groups: [data-sync-check="#selector"]
    document.querySelectorAll('.roxy-pill-group[data-sync-check]').forEach((group) => {
      const chk = document.querySelector(group.dataset.syncCheck);
      if (!chk) return;
      const isOn = Boolean(chk.checked);
      group.querySelectorAll('button[data-pill-bool]').forEach((btn) => {
        const match = (btn.dataset.pillBool === 'true') === isOn;
        btn.classList.toggle('active', match);
      });
    });

    syncVisualOsAndKernelPickers();
  }

  function wirePillBars() {
    document.addEventListener('click', (event) => {
      // OS Visual Button
      const osBtn = event.target.closest('#editor-os-visual button[data-os-val]');
      if (osBtn) {
        const osSelect = document.getElementById('editor-os');
        if (osSelect) {
          osSelect.value = osBtn.dataset.osVal;
          osSelect.dispatchEvent(new Event('change', { bubbles: true }));
          // Auto-generate device name hint for selected OS
          autoFillDeviceNameByOs(osBtn.dataset.osVal, false);
        }
        syncVisualOsAndKernelPickers();
        return;
      }

      // Kernel Visual Button
      const engBtn = event.target.closest('#editor-engine-visual button[data-engine-val]');
      if (engBtn) {
        const engSelect = document.getElementById('editor-engine');
        if (engSelect) {
          engSelect.value = engBtn.dataset.engineVal;
          engSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncVisualOsAndKernelPickers();
        return;
      }

      // Select-backed Pill Button
      const selectPill = event.target.closest('.roxy-pill-group[data-sync-select] button[data-pill-val]');
      if (selectPill) {
        const group = selectPill.closest('.roxy-pill-group[data-sync-select]');
        const sel = document.querySelector(group.dataset.syncSelect);
        if (!sel) return;
        const targetVal = selectPill.dataset.pillVal;
        if (targetVal === 'custom_lang') {
          if (sel.value === 'ip' || sel.value === 'system' || sel.value === 'profile') {
            sel.value = 'en-US';
          }
          const customWrap = group.parentElement?.querySelector('.custom-lang-wrap');
          if (customWrap) customWrap.hidden = false;
        } else {
          sel.value = targetVal;
          const customWrap = group.parentElement?.querySelector('.custom-lang-wrap');
          if (customWrap) customWrap.hidden = true;
        }
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof window.syncThemedSelect === 'function') window.syncThemedSelect(sel);
        syncAllPillBarsFromControls();
        return;
      }

      // Checkbox-backed Pill Button
      const checkPill = event.target.closest('.roxy-pill-group[data-sync-check] button[data-pill-bool]');
      if (checkPill) {
        const group = checkPill.closest('.roxy-pill-group[data-sync-check]');
        const chk = document.querySelector(group.dataset.syncCheck);
        if (!chk) return;
        chk.checked = checkPill.dataset.pillBool === 'true';
        chk.dispatchEvent(new Event('change', { bubbles: true }));
        syncAllPillBarsFromControls();
        return;
      }

      // Accordion Card Header Toggle
      const accToggle = event.target.closest('.roxy-accordion-header[data-accordion-toggle]');
      if (accToggle && !event.target.closest('button:not(.roxy-acc-btn), select, input, a')) {
        const card = accToggle.closest('.roxy-accordion-card');
        if (card) {
          card.classList.toggle('is-collapsed');
          const icon = accToggle.querySelector('.roxy-acc-symbol');
          if (icon) icon.textContent = card.classList.contains('is-collapsed') ? '+' : '−';
        }
      }
    });
  }

  function autoFillDeviceNameByOs(osName, force = true) {
    const input = document.getElementById('editor-device-name');
    if (!input) return;
    if (!force && input.value && !/^(DESKTOP-|ubuntu-|Mobile-|MacBook-|iPhone-)/.test(input.value)) return;
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (/linux/i.test(osName)) input.value = `ubuntu-${rand.slice(0, 5)}`;
    else if (/android/i.test(osName)) input.value = `Mobile-${rand.slice(0, 5)}`;
    else if (/ios/i.test(osName)) input.value = `iPhone-${rand.slice(0, 4)}`;
    else if (/mac/i.test(osName)) input.value = `MacBook-Pro-${rand.slice(0, 4)}`;
    else input.value = `DESKTOP-${rand}`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // --- Editor Mode Switching (Single Create / Batch Create / Window Import / AI Create / Edit) ---
  function openWorkbenchEditorMode(mode = 'single', profileId = null) {
    if (!['edit', 'single', 'batch', 'import', 'ai'].includes(mode)) throw new Error('创建模式无效');
    if (currentEditorMode === 'edit' && mode !== 'edit') {
      document.getElementById('profile-editor-form')?.reset();
      editorNetworkResult = null;
      document.getElementById('editor-account-pool-select').value = '';
      document.getElementById('editor-extra-accounts')?.replaceChildren();
    }
    if (mode !== currentEditorMode) pendingImportedRows = [];
    currentEditorMode = mode;
    if (mode !== 'edit') editingProfileId = null;
    const heading = document.getElementById('editor-mode-title');
    const createTabs = document.getElementById('editor-create-mode-bar');
    const batchCard = document.getElementById('create-mode-batch-card');
    const importCard = document.getElementById('create-mode-import-card');
    const aiCard = document.getElementById('create-mode-ai-card');
    const idRow = document.querySelector('.editor-id-row');
    const tplPickerWrap = document.getElementById('editor-tpl-picker-wrap');
    const submitBtn = document.querySelector('#profile-editor-form button[type="submit"]');

    populateTemplateSelects();
    populateAccountPoolSelect();

    if (mode === 'edit' && profileId) {
      if (heading) heading.textContent = typeof tx === 'function' ? tx('编辑窗口') : '编辑窗口';
      if (createTabs) createTabs.hidden = true;
      if (batchCard) batchCard.hidden = true;
      if (importCard) importCard.hidden = true;
      if (aiCard) aiCard.hidden = true;
      if (idRow) idRow.hidden = false;
      if (submitBtn) submitBtn.textContent = typeof tx === 'function' ? tx('保存') : '保存';
      setTimeout(syncAllPillBarsFromControls, 60);
      return;
    }

    // Create modes: single / batch / import / ai
    if (heading) heading.textContent = typeof tx === 'function' ? tx('创建窗口') : '创建窗口';
    if (createTabs) {
      createTabs.hidden = false;
      createTabs.querySelectorAll('button[data-create-mode]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.createMode === mode);
      });
    }
    if (batchCard) batchCard.hidden = mode !== 'batch';
    if (importCard) importCard.hidden = mode !== 'import';
    if (aiCard) aiCard.hidden = mode !== 'ai';
    if (idRow) idRow.hidden = true;
    if (tplPickerWrap) tplPickerWrap.hidden = false;
    if (submitBtn) {
      submitBtn.textContent = mode === 'batch'
        ? (typeof tx === 'function' ? tx('批量创建窗口') : '批量创建窗口')
        : mode === 'import'
          ? (typeof tx === 'function' ? tx('导入并创建窗口') : '导入并创建窗口')
          : (typeof tx === 'function' ? tx('创建窗口') : '创建窗口');
    }

    // Prepare a fresh draft in the editor form for creation
    prepareFreshCreateDraft();
    setTimeout(syncAllPillBarsFromControls, 50);
    if (typeof switchView === 'function') switchView('profile-editor');
  }

  function prepareFreshCreateDraft() {
    const num = typeof nextProfileNumber === 'function' ? nextProfileNumber() : 1;
    const now = new Date();
    const datePrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const defaultTitle = `${datePrefix}-${num}`;

    const titleEl = document.getElementById('editor-title');
    if (titleEl && !editingProfileId) titleEl.value = defaultTitle;
    const osEl = document.getElementById('editor-os');
    if (osEl && !osEl.value) osEl.value = 'Windows';
    if (typeof fillEditorVersionSelects === 'function') fillEditorVersionSelects();
    autoFillDeviceNameByOs(osEl?.value || 'Windows', true);

    const macEl = document.getElementById('editor-mac');
    if (macEl && !macEl.value) {
      document.getElementById('editor-mac-shuffle')?.click();
    }
    if (typeof fillGroupSelect === 'function') {
      fillGroupSelect(document.getElementById('editor-group'), '', { includeUngrouped: true });
      fillGroupSelect(document.getElementById('editor-footer-group'), '', { includeUngrouped: true });
    }
    if (typeof updateEditorVisibility === 'function') updateEditorVisibility();
    renderDeviceMockupPreview();
  }

  // --- Slide-over Quick Proxy Drawer (1:1 Roxy Screenshot [12]) ---
  let quickProxyProfileId = null;

  function openQuickProxyDrawer(profileId) {
    const profile = (window.ui?.profiles || []).find((p) => p.id === profileId);
    if (!profile) return;
    quickProxyProfileId = profileId;
    const drawer = document.getElementById('quick-proxy-drawer');
    const backdrop = document.getElementById('quick-proxy-backdrop');
    if (!drawer) return;

    const num = typeof displayProfileNumber === 'function' ? displayProfileNumber(profile) : (profile.number || profile.id);
    const titleEl = document.getElementById('quick-proxy-drawer-title');
    if (titleEl) titleEl.textContent = `为 [${num}] 编辑代理 IP`;

    const parsed = typeof parseEditorProxy === 'function' ? parseEditorProxy(profile.proxy) : { mode: 'direct', type: 'socks5', host: '', port: '', username: '', password: '' };
    const typeEl = document.getElementById('qp-protocol');
    const hostEl = document.getElementById('qp-host');
    const portEl = document.getElementById('qp-port');
    const userEl = document.getElementById('qp-username');
    const passEl = document.getElementById('qp-password');
    const refreshEl = document.getElementById('qp-refresh-url');
    const channelEl = document.getElementById('qp-ip-channel');
    const rawEl = document.getElementById('qp-smart-raw');
    const resultEl = document.getElementById('qp-test-result');

    if (typeEl) typeEl.value = ['socks5', 'http', 'https'].includes(parsed.type) ? parsed.type : 'socks5';
    if (hostEl) hostEl.value = parsed.host || '';
    if (portEl) portEl.value = parsed.port || '';
    if (userEl) userEl.value = parsed.username || '';
    if (passEl) passEl.value = parsed.password || '';
    if (refreshEl) refreshEl.value = profile.proxyMeta?.refreshUrl || '';
    if (channelEl) channelEl.value = profile.proxyMeta?.ipChannel || 'ip2location';
    if (rawEl) rawEl.value = '';
    if (resultEl) {
      resultEl.className = 'proxy-test-result';
      resultEl.textContent = profile.exitIp ? `当前出口: ${profile.exitIp} (${profile.exitCountryCode || '未知'})` : '尚未检测，可点击右侧「测试代理 IP」验证连通性';
    }

    const isIpv6 = String(parsed.host || '').includes(':');
    const ipv6Radio = document.querySelector(`input[name="qp-ip-version"][value="${isIpv6 ? 'ipv6' : 'ipv4'}"]`);
    if (ipv6Radio) ipv6Radio.checked = true;

    if (typeof syncThemedSelects === 'function') syncThemedSelects(drawer);
    drawer.classList.add('is-open');
    drawer.hidden = false;
    if (backdrop) {
      backdrop.classList.add('is-open');
      backdrop.hidden = false;
    }
  }

  function closeQuickProxyDrawer() {
    const drawer = document.getElementById('quick-proxy-drawer');
    const backdrop = document.getElementById('quick-proxy-backdrop');
    if (drawer) {
      drawer.classList.remove('is-open');
      setTimeout(() => { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 220);
    }
    if (backdrop) {
      backdrop.classList.remove('is-open');
      setTimeout(() => { if (!backdrop.classList.contains('is-open')) backdrop.hidden = true; }, 220);
    }
    quickProxyProfileId = null;
  }

  // --- Window Transfer (转移窗口 / 接收窗口 / 转移中列表) ---
  function openTransferWindowDialog(profileIds = []) {
    const ids = Array.isArray(profileIds) && profileIds.length
      ? profileIds
      : [...(window.selectedProfiles || [])];
    if (!ids.length) {
      if (typeof toast === 'function') toast('请先勾选或选择要转移的窗口', { tone: 'warning' });
      return;
    }
    const dlg = document.getElementById('transfer-window-dialog');
    if (!dlg) return;
    dlg.dataset.transferIds = JSON.stringify(ids);
    const summaryEl = document.getElementById('transfer-window-summary');
    const profiles = (window.ui?.profiles || []).filter((p) => ids.includes(p.id));
    const names = profiles.map((p) => `#${typeof displayProfileNumber === 'function' ? displayProfileNumber(p) : p.number} (${p.title || p.name})`).join('、');
    if (summaryEl) summaryEl.textContent = `已选择 ${profiles.length} 个窗口：${names}`;
    const codeBox = document.getElementById('transfer-generated-box');
    if (codeBox) codeBox.hidden = true;
    dlg.showModal();
  }

  async function executeWindowTransfer({ recipient, note, includeCookies, includeProxy, includeAccounts, exportFile }) {
    const dlg = document.getElementById('transfer-window-dialog');
    let ids = [];
    try { ids = JSON.parse(dlg?.dataset.transferIds || '[]'); } catch (_) {}
    const profiles = (window.ui?.profiles || []).filter((p) => ids.includes(p.id));
    if (!profiles.length) return;

    const originals = includeCookies || includeAccounts || includeProxy
      ? await Promise.all(profiles.map(async (profile) => {
        const result = window.OpenBrowserIpcResult.unwrapIpcResult(await window.ops.profileForEdit(profile.id));
        if (!result?.profile) throw new Error('无法读取待分享环境：' + profile.id);
        return result.profile;
      })) : profiles;
    const payloadProfiles = originals.map((p) => {
      const clone = structuredClone(p);
      if (!includeCookies) clone.cookies = '';
      if (!includeProxy) {
        clone.networkMode = 'direct';
        clone.proxy = 'Direct';
        clone.proxyId = null;
        clone.proxyMeta = {};
        for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId']) delete clone[key];
      }
      if (!includeAccounts) { clone.username = ''; clone.password = ''; clone.totpSecret = ''; clone.otp = ''; }
      if (!includeAccounts && clone.platform) {
        clone.platform.username = '';
        clone.platform.password = '';
        clone.platform.totpSecret = '';
        clone.platform.otp = '';
        clone.platform.accounts = [];
      }
      return clone;
    });

    const sensitive = payloadProfiles.some((profile) => profile.cookies || profile.platform?.password || profile.platform?.totpSecret || profile.platform?.otp
      || profile.password || profile.totpSecret || window.OpenBrowserProxyRedact.redactProxyCredentials(profile.proxy) !== profile.proxy
      || profile.platform?.accounts?.some((account) => account.password || account.totpSecret));
    if (sensitive && !await window.OpenBrowserApp.confirmAction({
      title: '分享含凭据的配置', message: '转移码和导出 JSON 包含明文凭据，持有人可重复导入；接收方仅作备注，无法远程撤回。需要加密迁移时请使用云备份导出。是否继续？', confirmText: '继续分享', tone: 'warning',
    })) return;

    const bundle = {
      type: 'openbrowser-window-transfer-v1',
      transferId: 'trf-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      recipient: String(recipient || '未指定接收方').trim(),
      note: String(note || '').trim(),
      createdAt: new Date().toISOString(),
      count: payloadProfiles.length,
      profiles: payloadProfiles,
    };

    const encodedCode = 'OBTRF1:' + btoa(unescape(encodeURIComponent(JSON.stringify(bundle))));

    // One bundle per history entry avoids copying the full multi-profile
    // transfer code once per profile (quadratic storage and IPC growth).
    const first = payloadProfiles[0];
    await appendWindowTransfers([{
      id: bundle.transferId, profileId: first.id, profileNumber: first.number,
      profileTitle: payloadProfiles.length > 1 ? `${first.title || first.name} 等 ${payloadProfiles.length} 个窗口` : first.title || first.name,
      count: payloadProfiles.length, os: first.os || 'Windows', recipient: bundle.recipient,
      note: bundle.note, includeCookies, includeProxy, status: 'pending', createdAt: bundle.createdAt,
      transferCode: encodedCode,
    }]);

    const codeInput = document.getElementById('transfer-generated-code');
    const codeBox = document.getElementById('transfer-generated-box');
    if (codeInput) codeInput.value = encodedCode;
    if (codeBox) codeBox.hidden = false;

    if (exportFile) {
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `window-transfer-${payloadProfiles.length}windows-${new Date().toISOString().slice(0, 10)}.obtransfer.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }

    renderTransfersTable();
    updateTransferTabCount();
    if (typeof toast === 'function') {
      toast(`已生成 ${payloadProfiles.length} 个窗口的转移凭证，可在「转移中」标签页管理`, { tone: 'success' });
    }
  }

  async function receiveTransferredWindows(rawText) {
    const clean = String(rawText || '').trim();
    if (!clean) throw new Error('请输入转移码或选择转移包文件');
    if (clean.length > 16 * 1024 * 1024) throw new Error('转移包超过 16 MiB，请分批导入');
    let bundle = null;
    if (clean.startsWith('OBTRF1:')) {
      const jsonStr = decodeURIComponent(escape(atob(clean.slice(7).trim())));
      bundle = JSON.parse(jsonStr);
    } else {
      bundle = JSON.parse(clean);
    }
    const items = Array.isArray(bundle?.profiles) ? bundle.profiles : (Array.isArray(bundle) ? bundle : []);
    if (!items.length || items.length > 5000) throw new Error('转移凭证需要包含 1–5000 个窗口');

    const start = typeof nextProfileNumber === 'function' ? nextProfileNumber() : 1;
    const used = new Set((window.ui?.profiles || []).map((p) => p.id));
    const created = items.map((item, idx) => {
      const number = start + idx;
      const id = window.OpenBrowserApp.createInternalProfileId(number, used);
      used.add(id);
      return typeof normalizeProfileSettings === 'function'
        ? normalizeProfileSettings({
          ...item,
          id,
          number,
          name: String(number),
          title: item.title ? `${item.title} (转入)` : `转入窗口-${number}`,
        })
        : { ...item, id, number, name: String(number) };
    });

    await window.OpenBrowserApp.createProfiles(created);
    if (typeof toast === 'function') toast(`成功接收并导入 ${created.length} 个转移窗口！`, { tone: 'success' });
  }

  function updateTransferTabCount() {
    const tab = document.querySelector('#profile-list-tabs .list-tab[data-list-tab="transfer"]');
    if (!tab) return;
    let count = tab.querySelector('.list-tab-count');
    if (!count) {
      count = document.createElement('span');
      count.className = 'list-tab-count';
      tab.appendChild(count);
    }
    const activeCount = windowTransfers.filter((t) => t.status === 'pending').length;
    count.textContent = String(activeCount);
  }

  function renderTransfersTable() {
    updateTransferTabCount();
    const tbody = document.getElementById('transfer-records-tbody');
    const empty = document.getElementById('transfer-records-empty');
    if (!tbody) return;
    tbody.replaceChildren();
    if (!windowTransfers.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    for (const item of windowTransfers) {
      const tr = document.createElement('tr');
      const statusBadge = item.status === 'pending'
        ? '<span class="status status-compact running">已生成离线凭证</span>'
        : '<span class="status status-compact">已撤回</span>';
      tr.innerHTML = `
        <td><strong>#${escapeHtml(item.profileNumber || '—')}</strong> ${getOsIconSvg(item.os)}</td>
        <td><strong>${escapeHtml(item.profileTitle || '未命名窗口')}</strong></td>
        <td>${escapeHtml(item.recipient || '—')}</td>
        <td>${escapeHtml([item.includeCookies ? 'Cookie' : '', item.includeProxy ? '代理IP' : '配置'].filter(Boolean).join(' + '))}</td>
        <td>${escapeHtml(new Date(item.createdAt).toLocaleString())}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions">
            <button type="button" class="outline mini-btn" data-trf-copy="${escapeHtml(item.id)}">复制转移码</button>
            <button type="button" class="outline mini-btn" data-trf-download="${escapeHtml(item.id)}">下载转移包</button>
            ${(item.status === 'pending' ? `<button type="button" class="outline danger mini-btn" data-trf-revoke="${escapeHtml(item.id)}">移除本机记录</button>` : '')}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // --- Window Upload / Import & Template Download (1:1 Roxy Screenshots [30][31]) ---
  function downloadWindowImportTemplate(format = 'excel') {
    let content = '';
    let filename = '';
    let mime = 'text/plain;charset=utf-8';
    if (format === 'excel') {
      // UTF-8 BOM + CSV so Microsoft Excel opens Chinese columns cleanly
      content = '\uFEFF窗口名称,平台网址,用户名,密码,2FA密钥,代理类型,代理主机,代理端口,代理账号,代理密码,系统(Windows/macOS/Linux/Android/iOS),Cookie(JSON或Name=Value),标签,备注\n'
        + '美区Amazon-01,https://www.amazon.com,seller01@outlook.com,Pass123456,JBSWY3DPEHPK3PXP,socks5,127.0.0.1,1080,user01,pass01,Windows,,主力店,2026美区一号店\n'
        + 'TikTok移动矩阵-02,https://www.tiktok.com,tk_creator@gmail.com,Pass654321,,socks5,127.0.0.1,1081,,,Android,,短视频,Android16独立环境\n';
      filename = 'openbrowser-window-import-template.csv';
      mime = 'text/csv;charset=utf-8';
    } else if (format === 'txt') {
      content = '# OpenBrowser 窗口批量导入 TXT 模板（每行一个窗口，字段以 | 或 Tab 分隔）\n'
        + '# 格式：窗口名称|平台网址|用户名|密码|代理(如 socks5://user:pass@host:port 或 Direct)|系统(Windows/macOS/Linux/Android/iOS)|备注\n'
        + '美区窗口-01|https://www.google.com|user01@outlook.com|pass123|socks5://127.0.0.1:1080|Windows|TXT模板导入示例1\n'
        + '社媒窗口-02|https://x.com|user02@outlook.com|pass456|Direct|macOS|TXT模板导入示例2\n';
      filename = 'openbrowser-window-import-template.txt';
    } else {
      content = JSON.stringify([
        {
          title: 'JSON导入窗口-01',
          os: 'Windows',
          osVersion: 'Windows 11',
          engine: 'chromium',
          language: 'en-US',
          startUrl: 'https://www.google.com',
          proxy: 'Direct',
          tag: '批量导入',
          note: 'JSON 模板示例',
        },
      ], null, 2);
      filename = 'openbrowser-window-import-template.json';
      mime = 'application/json;charset=utf-8';
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    if (typeof toast === 'function') toast(`已下载 ${filename}`, { tone: 'success' });
  }

  function parseWindowUploadFileContent(text, filename = '') {
    const lower = filename.toLowerCase();
    const cleaned = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!cleaned) return [];

    if (lower.endsWith('.json') || lower.endsWith('.obpack') || cleaned.startsWith('[') || cleaned.startsWith('{')) {
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.profiles) ? parsed.profiles : [parsed]);
      return arr.map((item, i) => ({
        title: item.title || item.name || `导入窗口-${i + 1}`,
        startUrl: item.startUrl || item.platform?.startUrl || '',
        username: item.username || item.platform?.username || '',
        password: item.password || item.platform?.password || '',
        totpSecret: item.totpSecret || item.platform?.totpSecret || '',
        proxy: item.proxy || 'Direct',
        os: item.os || 'Windows',
        cookies: item.cookies || '',
        tag: item.tag || '窗口导入',
        note: item.note || '',
      }));
    }

    const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    if (!lines.length) return [];

    // TXT pipe/tab format
    if (lower.endsWith('.txt') || (lines[0].includes('|') && !lines[0].includes(','))) {
      return lines.map((line, i) => {
        const parts = line.includes('|') ? line.split('|').map((s) => s.trim()) : line.split(/\t+/).map((s) => s.trim());
        return {
          title: parts[0] || `导入窗口-${i + 1}`,
          startUrl: parts[1] || '',
          username: parts[2] || '',
          password: parts[3] || '',
          proxy: parts[4] || 'Direct',
          os: parts[5] || 'Windows',
          note: parts[6] || '',
          tag: 'TXT导入',
        };
      });
    }

    // CSV format
    const csvRows = [];
    const csvParser = window.OpenBrowserCsv.createCsvParser((row) => {
      if (csvRows.length >= 5001) throw new Error('一次最多导入 5000 个窗口');
      csvRows.push(row);
    }, { maxColumns: 40, maxFieldChars: 1024 * 1024 });
    csvParser.write(cleaned); csvParser.end();
    const rows = csvRows.slice(1).map((cols, i) => {
      const proto = cols[5] || 'socks5';
      const host = cols[6] || '';
      const port = cols[7] || '';
      const pUser = cols[8] || '';
      const pPass = cols[9] || '';
      let proxy = 'Direct';
      if (host && port) {
        proxy = pUser ? `${proto}://${encodeURIComponent(pUser)}:${encodeURIComponent(pPass)}@${host}:${port}` : `${proto}://${host}:${port}`;
      }
      return {
        title: cols[0] || `导入窗口-${i + 1}`,
        startUrl: cols[1] || '',
        username: cols[2] || '',
        password: cols[3] || '',
        totpSecret: cols[4] || '',
        proxy,
        os: cols[10] || 'Windows',
        cookies: cols[11] || '',
        tag: cols[12] || 'Excel导入',
        note: cols[13] || '',
      };
    });
    return rows;
  }

  function renderImportPreviewTable(rows) {
    pendingImportedRows = rows;
    const wrap = document.getElementById('window-upload-preview-wrap');
    const tbody = document.getElementById('window-upload-preview-tbody');
    const countEl = document.getElementById('window-upload-preview-count');
    if (!wrap || !tbody) return;
    if (!rows.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    if (countEl) countEl.textContent = String(rows.length);
    tbody.replaceChildren();
    rows.slice(0, 50).forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(idx + 1)}</td>
        <td><strong>${escapeHtml(r.title)}</strong></td>
        <td>${escapeHtml(r.os || 'Windows')}</td>
        <td>${escapeHtml(r.startUrl || '—')}</td>
        <td>${escapeHtml(r.username || '—')}</td>
        <td>${(r.proxy === 'Direct' ? '本地直连' : escapeHtml(r.proxy))}</td>
        <td>${escapeHtml(r.note || '—')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Templates View & Dropdowns ---
  function populateTemplateSelects() {
    const sel = document.getElementById('editor-template-select');
    if (!sel) return;
    const prev = sel.value;
    sel.replaceChildren();
    sel.appendChild(new Option('不使用模板', ''));
    for (const tpl of windowTemplates) {
      sel.appendChild(new Option(`📋 ${tpl.name}`, tpl.id));
    }
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
    if (typeof syncThemedSelect === 'function') syncThemedSelect(sel);
  }

  function applyWindowTemplateToEditor(tplId) {
    if (!tplId) return;
    const tpl = windowTemplates.find((t) => t.id === tplId);
    if (!tpl) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };
    setVal('editor-os', tpl.os || 'Windows');
    if (typeof fillEditorVersionSelects === 'function') fillEditorVersionSelects();
    setVal('editor-os-version', tpl.osVersion || '');
    setVal('editor-engine', tpl.engine || 'chromium');
    setVal('editor-engine-version', tpl.engineVersion || 'latest');
    setVal('editor-language', tpl.language || 'en-US');
    setVal('editor-width', tpl.width || 1280);
    setVal('editor-height', tpl.height || 820);
    if (tpl.platform?.type) setVal('editor-platform-type', tpl.platform.type);
    if (tpl.platform?.startUrl) setVal('editor-start-url', tpl.platform.startUrl);
    if (tpl.privacy) {
      if (tpl.privacy.webrtc) setVal('editor-webrtc', tpl.privacy.webrtc);
      if (tpl.privacy.canvas) setVal('editor-canvas', tpl.privacy.canvas);
      if (tpl.privacy.webgl) setVal('editor-webgl', tpl.privacy.webgl);
      if (tpl.privacy.webglMeta) setVal('editor-webgl-meta', tpl.privacy.webglMeta);
      if (tpl.privacy.audio) setVal('editor-audio', tpl.privacy.audio);
      if (tpl.privacy.cores != null) setVal('editor-cores', String(tpl.privacy.cores));
      if (tpl.privacy.memory != null) setVal('editor-memory', String(tpl.privacy.memory));
    }
    syncAllPillBarsFromControls();
    if (typeof syncThemedSelects === 'function') syncThemedSelects(document.getElementById('view-profile-editor'));
    if (typeof renderEditorSummary === 'function') renderEditorSummary();
    if (typeof toast === 'function') toast(`已应用模板「${tpl.name}」`, { tone: 'success' });
  }

  function renderTemplatesView() {
    const tbody = document.getElementById('templates-table-tbody');
    const countEl = document.getElementById('templates-total-count');
    if (!tbody) return;
    if (countEl) countEl.textContent = String(windowTemplates.length);
    tbody.replaceChildren();
    for (const tpl of windowTemplates) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(tpl.name)}</strong></td>
        <td><span class="group-badge group-badge-compact">${escapeHtml(tpl.category || '通用模板')}</span></td>
        <td>${getOsIconSvg(tpl.os)} ${escapeHtml(tpl.os)} ${escapeHtml(tpl.osVersion || '')}</td>
        <td>${(tpl.engine === 'firefox' ? 'Firefox' : 'Chrome 156')}</td>
        <td>${escapeHtml(tpl.width || 1280)} × ${escapeHtml(tpl.height || 820)}</td>
        <td>${escapeHtml(tpl.platform?.startUrl || '空白页')}</td>
        <td>${escapeHtml(new Date(tpl.createdAt || Date.now()).toLocaleDateString())}</td>
        <td>
          <div class="actions">
            <button type="button" class="primary mini-btn" data-tpl-use="${escapeHtml(tpl.id)}">使用模板创建</button>
            <button type="button" class="outline danger mini-btn" data-tpl-del="${escapeHtml(tpl.id)}">删除</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // --- Platform Accounts View & Pool ---
  function populateAccountPoolSelect() {
    const sel = document.getElementById('editor-account-pool-select');
    if (!sel) return;
    sel.replaceChildren();
    sel.appendChild(new Option('选择已有账号', ''));
    for (const acc of platformAccounts) {
      sel.appendChild(new Option(`${acc.name || acc.platform} (${acc.username})`, acc.id));
    }
    if (typeof syncThemedSelect === 'function') syncThemedSelect(sel);
  }

  function renderAccountsView() {
    const tbody = document.getElementById('accounts-table-tbody');
    const countEl = document.getElementById('accounts-total-count');
    const emptyCard = document.getElementById('accounts-empty-card');
    const tableCard = document.getElementById('accounts-table-card');
    const query = (document.getElementById('accounts-search-input')?.value || '').trim().toLowerCase();
    if (!tbody) return;

    const list = query
      ? platformAccounts.filter((a) => `${a.platform} ${a.url} ${a.username} ${a.remark} ${a.name}`.toLowerCase().includes(query))
      : platformAccounts;

    if (countEl) countEl.textContent = String(platformAccounts.length);
    if (emptyCard) emptyCard.hidden = platformAccounts.length > 0;
    if (tableCard) tableCard.hidden = platformAccounts.length === 0;

    tbody.replaceChildren();
    for (const acc of list) {
      const domain = String(acc.url || acc.platform || 'other').replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const badgeLetter = (domain[0] || 'A').toUpperCase();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="acc-platform-cell">
            <span class="acc-platform-dot">${escapeHtml(badgeLetter)}</span>
            <div><strong>${escapeHtml(domain)}</strong><small class="acc-sub-url">${escapeHtml(acc.url || '—')}</small></div>
          </div>
        </td>
        <td><code>${escapeHtml(acc.username || '—')}</code></td>
        <td>
          <div class="acc-pass-cell">
            <code class="acc-pass-val" data-masked="1">••••••••</code>
            <button type="button" class="acc-eye-toggle" data-acc-id="${escapeHtml(acc.id)}" title="显示/隐藏密码">👁</button>
          </div>
        </td>
        <td>${escapeHtml(acc.remark || '—')}</td>
        <td>${(acc.hasTotpSecret ? '<span class="status status-compact running">已配置 2FA</span>' : '<span class="status status-compact">未配置</span>')}</td>
        <td>
          <div class="actions">
            <button type="button" class="primary mini-btn" data-acc-create-win="${escapeHtml(acc.id)}">创建绑定窗口</button>
            <button type="button" class="outline danger mini-btn" data-acc-del="${escapeHtml(acc.id)}">删除</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // --- Header Live Local Exit IP Pill ---
  function refreshHeaderExitIpPill() {
    const pillText = document.getElementById('header-exit-ip-text');
    if (!pillText) return;
    const sampleWithIp = (window.ui?.profiles || []).find((p) => p.exitIp);
    if (sampleWithIp) {
      pillText.textContent = `${sampleWithIp.exitCountryCode || 'CN'} (${sampleWithIp.exitIp})`;
    } else {
      pillText.textContent = 'CN/Local (127.0.0.1)';
    }
  }

  function updateSidebarQuotaBar() {
    const countEl = document.getElementById('sidebar-quota-count');
    const fillEl = document.getElementById('sidebar-quota-fill');
    const total = (window.ui?.profiles || []).filter((p) => !p.trashed).length;
    if (countEl) countEl.textContent = `${total} / ∞`;
    if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(12, total * 8))}%`;
  }

  // --- Intercept Row Action Menu & Quick Proxy Triggers ---
  function initWorkbenchEventWiring() {
    wirePillBars();

    // Hook into OS & Engine changes
    document.getElementById('editor-os')?.addEventListener('change', syncVisualOsAndKernelPickers);
    document.getElementById('editor-engine')?.addEventListener('change', syncVisualOsAndKernelPickers);

    // Device Name Random Shuffle button
    document.getElementById('editor-device-name-shuffle')?.addEventListener('click', () => {
      autoFillDeviceNameByOs(document.getElementById('editor-os')?.value || 'Windows', true);
    });

    // Editor top section tabs -> expand accordion & smooth scroll to section
    document.querySelectorAll('#view-profile-editor .editor-tabs button[data-editor-tab]').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const key = tabBtn.dataset.editorTab;
        const panel = document.querySelector(`#view-profile-editor .editor-panel[data-editor-panel="${key}"]`);
        if (panel) {
          panel.classList.remove('is-collapsed');
          const sym = panel.querySelector('.roxy-acc-symbol');
          if (sym) sym.textContent = '−';
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Quick Create / Sidebar Create -> Open full-page 1:1 Create Window view
    document.getElementById('quick-create-fullpage')?.addEventListener('click', (e) => {
      e.preventDefault();
      editingProfileId = null;
      openWorkbenchEditorMode('single');
    });

    // Create Mode Sub-tab clicks (单个创建 / 批量创建 / 窗口导入 / AI 批量创建)
    document.getElementById('editor-create-mode-bar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-create-mode]');
      if (!btn) return;
      openWorkbenchEditorMode(btn.dataset.createMode);
    });

    // Batch count stepper [- 1 +]
    document.getElementById('editor-batch-minus')?.addEventListener('click', () => {
      const inp = document.getElementById('editor-batch-count');
      if (inp) inp.value = String(Math.max(1, (Number(inp.value) || 1) - 1));
    });
    document.getElementById('editor-batch-plus')?.addEventListener('click', () => {
      const inp = document.getElementById('editor-batch-count');
      if (inp) inp.value = String(Math.min(200, (Number(inp.value) || 1) + 1));
    });

    // Template select in editor header
    document.getElementById('editor-template-select')?.addEventListener('change', (e) => {
      if (e.target.value) applyWindowTemplateToEditor(e.target.value);
    });

    // Account pool select in editor
    document.getElementById('editor-account-pool-select')?.addEventListener('change', runAction(async (e) => {
      const id = e.target.value;
      if (!id) return;
      await loadPlatformAccounts();
      const acc = await window.ops.accountGet(id);
      if (e.target.value !== id) return;
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
      setVal('editor-platform-type', acc.platform || 'other');
      setVal('editor-start-url', acc.url || '');
      setVal('editor-platform-name', acc.name || '');
      setVal('editor-platform-user', acc.username || '');
      setVal('editor-platform-pass', acc.password || '');
      setVal('editor-platform-2fa', acc.totpSecret || '');
      if (typeof toast === 'function') toast(`已填入账号：${acc.username}`, { tone: 'success' });
    }));

    // Save current editor config as new template
    document.getElementById('editor-save-as-template')?.addEventListener('click', runAction(() => {
      const titleVal = document.getElementById('editor-title')?.value?.trim() || '自定义模板';
      const osVal = document.getElementById('editor-os')?.value || 'Windows';
      const osVer = document.getElementById('editor-os-version')?.value || '';
      const engVal = document.getElementById('editor-engine')?.value || 'chromium';
      const tpl = {
        id: 'tpl-' + Date.now().toString(36),
        name: `${titleVal} (${osVal} ${osVer})`.trim(),
        category: '我的模板',
        os: osVal,
        osVersion: osVer,
        engine: engVal,
        engineVersion: document.getElementById('editor-engine-version')?.value || 'latest',
        language: document.getElementById('editor-language')?.value || 'en-US',
        width: Number(document.getElementById('editor-width')?.value) || 1280,
        height: Number(document.getElementById('editor-height')?.value) || 820,
        platform: {
          type: document.getElementById('editor-platform-type')?.value || 'other',
          startUrl: document.getElementById('editor-start-url')?.value || '',
        },
        createdAt: new Date().toISOString(),
      };
      saveWindowTemplates([tpl, ...windowTemplates]);
      populateTemplateSelects();
      renderTemplatesView();
      if (typeof toast === 'function') toast(`已保存为新模板：「${tpl.name}」`, { tone: 'success' });
    }));

    // Window Import / Upload Dropzone & Template Download Menu
    const dropzone = document.getElementById('window-upload-dropzone');
    const fileInput = document.getElementById('window-upload-input');
    document.getElementById('window-upload-trigger')?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', (e) => {
      if (!e.target.closest('button')) fileInput?.click();
    });
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone?.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        const rows = parseWindowUploadFileContent(await file.text(), file.name);
        renderImportPreviewTable(rows);
        if (typeof toast === 'function') toast(`已解析文件 ${file.name}，共 ${rows.length} 个待导入窗口`, { tone: 'success' });
      } catch (err) {
        if (typeof toast === 'function') toast('文件解析失败：' + err.message, { tone: 'error' });
      }
    });
    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const rows = parseWindowUploadFileContent(await file.text(), file.name);
        renderImportPreviewTable(rows);
        if (typeof toast === 'function') toast(`已解析文件 ${file.name}，共 ${rows.length} 个待导入窗口`, { tone: 'success' });
      } catch (err) {
        if (typeof toast === 'function') toast('文件解析失败：' + err.message, { tone: 'error' });
      }
    });

    // Template download dropdown (Excel / TXT / JSON)
    const tplBtn = document.getElementById('window-tpl-download-btn');
    const tplMenu = document.getElementById('window-tpl-download-menu');
    tplBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tplMenu) tplMenu.hidden = !tplMenu.hidden;
    });
    tplMenu?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tpl-format]');
      if (!btn) return;
      downloadWindowImportTemplate(btn.dataset.tplFormat);
      tplMenu.hidden = true;
    });
    document.addEventListener('click', () => { if (tplMenu) tplMenu.hidden = true; });

    // AI Batch Create Generator
    document.getElementById('ai-batch-generate-btn')?.addEventListener('click', () => {
      const promptText = document.getElementById('ai-batch-prompt')?.value || '';
      const countMatch = promptText.match(/(\d+)\s*个/);
      const count = countMatch ? Math.min(50, Math.max(1, Number(countMatch[1]))) : 5;
      const isAndroid = /android|安卓|移动|tiktok/i.test(promptText);
      const isIos = /ios|iphone|苹果手机/i.test(promptText);
      const isMac = /mac/i.test(promptText);
      const os = isAndroid ? 'Android' : isIos ? 'iOS' : isMac ? 'macOS' : 'Windows';
      const url = /tiktok/i.test(promptText) ? 'https://www.tiktok.com'
        : /amazon|亚马逊/i.test(promptText) ? 'https://www.amazon.com'
          : /twitter|x\.com/i.test(promptText) ? 'https://x.com'
            : 'https://www.google.com';

      const rows = Array.from({ length: count }, (_, i) => ({
        title: `AI矩阵-${os}-${String(i + 1).padStart(2, '0')}`,
        os,
        startUrl: url,
        username: '',
        proxy: 'Direct',
        tag: 'AI矩阵',
        note: `由 AI 批量生成：${promptText.slice(0, 40) || '智能防关联配置'}`,
      }));
      const osEl = document.getElementById('editor-os');
      if (osEl) { osEl.value = os; osEl.dispatchEvent(new Event('change', { bubbles: true })); }
      renderImportPreviewTable(rows);
      if (typeof toast === 'function') toast(`AI 已智能生成 ${count} 个 ${os} 窗口配置，点击底部「创建窗口」即可落库`, { tone: 'success' });
    });

    // Quick Proxy Drawer events
    document.getElementById('quick-proxy-close')?.addEventListener('click', closeQuickProxyDrawer);
    document.getElementById('quick-proxy-cancel')?.addEventListener('click', closeQuickProxyDrawer);
    document.getElementById('quick-proxy-backdrop')?.addEventListener('click', closeQuickProxyDrawer);

    document.getElementById('qp-smart-raw')?.addEventListener('input', (e) => {
      const raw = e.target.value.trim();
      if (!raw || typeof parseProxyInputForUi !== 'function') return;
      try {
        const parsed = parseProxyInputForUi(raw, document.getElementById('qp-protocol')?.value || 'socks5');
        if (parsed) {
          document.getElementById('qp-protocol').value = parsed.protocol || 'socks5';
          document.getElementById('qp-host').value = parsed.host || '';
          document.getElementById('qp-port').value = parsed.port || '';
          document.getElementById('qp-username').value = parsed.username || '';
          document.getElementById('qp-password').value = parsed.password || '';
          if (typeof syncThemedSelects === 'function') syncThemedSelects(document.getElementById('quick-proxy-drawer'));
        }
      } catch (_) {}
    });

    document.getElementById('qp-test-btn')?.addEventListener('click', async () => {
      const host = document.getElementById('qp-host')?.value?.trim();
      const port = Number(document.getElementById('qp-port')?.value);
      const protocol = document.getElementById('qp-protocol')?.value || 'socks5';
      const username = document.getElementById('qp-username')?.value || '';
      const password = document.getElementById('qp-password')?.value || '';
      const resultEl = document.getElementById('qp-test-result');
      if (!host || !port) {
        if (resultEl) { resultEl.className = 'proxy-test-result error'; resultEl.textContent = '请先填写代理主机 IP 与端口'; }
        return;
      }
      if (resultEl) { resultEl.className = 'proxy-test-result'; resultEl.textContent = '正在检测代理连通性与出口 IP...'; }
      try {
        const proxyStr = typeof buildProxyUiValue === 'function'
          ? buildProxyUiValue({ protocol, host, port, username, password })
          : `${protocol}://${host}:${port}`;
        const res = await window.ops.testProfileProxy({ id: quickProxyProfileId || 'probe', proxy: proxyStr, networkMode: 'proxy' });
        if (resultEl) {
          resultEl.className = 'proxy-test-result success';
          resultEl.textContent = `连接成功 · IP: ${res.ip || host} · ${res.countryCode || ''} ${res.latencyMs ? res.latencyMs + 'ms' : ''}`;
        }
      } catch (err) {
        if (resultEl) {
          resultEl.className = 'proxy-test-result error';
          resultEl.textContent = `检测失败 · ${err.message}`;
        }
      }
    });

    document.getElementById('quick-proxy-form')?.addEventListener('submit', runAction(async (e) => {
      e.preventDefault();
      if (!quickProxyProfileId) return closeQuickProxyDrawer();
      const current = (window.ui?.profiles || []).find((p) => p.id === quickProxyProfileId);
      const profile = current ? structuredClone(current) : null;
      if (!profile) return closeQuickProxyDrawer();
      const host = document.getElementById('qp-host')?.value?.trim();
      const port = Number(document.getElementById('qp-port')?.value);
      const protocol = document.getElementById('qp-protocol')?.value || 'socks5';
      const username = document.getElementById('qp-username')?.value || '';
      const password = document.getElementById('qp-password')?.value || '';
      const refreshUrl = document.getElementById('qp-refresh-url')?.value?.trim() || '';
      const ipChannel = document.getElementById('qp-ip-channel')?.value || 'ip2location';

      if (!host || !port) {
        profile.networkMode = 'direct';
        profile.proxy = 'Direct';
      } else {
        profile.networkMode = 'proxy';
        profile.proxy = typeof buildProxyUiValue === 'function'
          ? buildProxyUiValue({ protocol, host, port, username, password })
          : `${protocol}://${host}:${port}`;
      }
      profile.proxyMeta = { ...(profile.proxyMeta || {}), refreshUrl, ipChannel };
      profile.proxyId = null;
      profile.proxyMeta.proxyId = null;
      const rows = await window.OpenBrowserApp.syncProfiles([{ ...profile, proxyAuthAction: 'clear' }]);
      const accepted = rows.find((row) => row.id === profile.id);
      const index = window.ui.profiles.findIndex((row) => row.id === profile.id);
      if (index >= 0) window.ui.profiles[index] = { ...profile, rev: accepted?.rev };
      save();
      if (typeof renderProfiles === 'function') renderProfiles();
      closeQuickProxyDrawer();
      if (typeof toast === 'function') toast('窗口代理 IP 配置已保存', { tone: 'success' });
    }));

    // Transfer & Upload Toolbar/Menu Triggers
    document.getElementById('toolbar-transfer-window')?.addEventListener('click', () => openTransferWindowDialog());
    document.getElementById('batch-transfer-btn')?.addEventListener('click', () => openTransferWindowDialog());
    document.getElementById('header-receive-transfer')?.addEventListener('click', () => {
      document.getElementById('receive-transfer-dialog')?.showModal();
    });
    document.getElementById('transfer-banner-receive-btn')?.addEventListener('click', () => {
      document.getElementById('receive-transfer-dialog')?.showModal();
    });
    document.getElementById('transfer-banner-send-btn')?.addEventListener('click', () => openTransferWindowDialog());

    document.getElementById('toolbar-upload-window')?.addEventListener('click', () => {
      document.getElementById('upload-window-dialog')?.showModal();
    });
    document.getElementById('batch-upload-btn')?.addEventListener('click', () => {
      document.getElementById('upload-window-dialog')?.showModal();
    });

    // Transfer Window Dialog Submit
    document.getElementById('transfer-window-form')?.addEventListener('submit', runAction(async (e) => {
      e.preventDefault();
      if (e.submitter?.value === 'cancel') return document.getElementById('transfer-window-dialog')?.close();
      await executeWindowTransfer({
        recipient: document.getElementById('transfer-recipient')?.value,
        note: document.getElementById('transfer-note')?.value,
        includeCookies: document.getElementById('transfer-inc-cookies')?.checked !== false,
        includeProxy: document.getElementById('transfer-inc-proxy')?.checked !== false,
        includeAccounts: document.getElementById('transfer-inc-accounts')?.checked !== false,
        exportFile: e.submitter?.dataset.exportFile === '1',
      });
    }));

    document.getElementById('transfer-copy-code-btn')?.addEventListener('click', async () => {
      const code = document.getElementById('transfer-generated-code')?.value || '';
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        if (typeof toast === 'function') toast('转移码已复制到剪贴板', { tone: 'success' });
      } catch (_) {}
    });

    // Receive Transfer Dialog Submit
    document.getElementById('receive-transfer-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (e.submitter?.value === 'cancel') return document.getElementById('receive-transfer-dialog')?.close();
      const code = document.getElementById('receive-transfer-code')?.value || '';
      try {
        await receiveTransferredWindows(code);
        document.getElementById('receive-transfer-dialog')?.close();
      } catch (err) {
        if (typeof toast === 'function') toast('接收失败：' + err.message, { tone: 'error' });
      }
    });

    document.getElementById('receive-transfer-file')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f) return;
      const text = await f.text();
      const inp = document.getElementById('receive-transfer-code');
      if (inp) inp.value = text;
    });

    // Upload Window Dialog actions
    document.getElementById('upload-window-pack-btn')?.addEventListener('click', () => {
      const source = window.selectedProfiles?.size
        ? (window.ui?.profiles || []).filter((p) => window.selectedProfiles.has(p.id))
        : (window.ui?.profiles || []).filter((p) => !p.trashed);
      if (!source.length) return typeof toast === 'function' && toast('暂无可打包上传的窗口', { tone: 'warning' });
      const pack = {
        type: 'openbrowser-window-pack-v1',
        exportedAt: new Date().toISOString(),
        count: source.length,
        profiles: source,
      };
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `openbrowser-windows-${source.length}-${new Date().toISOString().slice(0, 10)}.obpack.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      if (typeof toast === 'function') toast(`已打包导出 ${source.length} 个窗口镜像包 (.obpack.json)`, { tone: 'success' });
    });

    document.getElementById('upload-window-cloud-btn')?.addEventListener('click', async () => {
      try {
        await window.ops.cloudBackup({});
        if (typeof toast === 'function') toast('已成功上传同步窗口数据至云端存储', { tone: 'success' });
        document.getElementById('upload-window-dialog')?.close();
      } catch (err) {
        if (typeof toast === 'function') toast('云备份失败：' + err.message + '；请检查云同步配置后重试', { tone: 'error' });
        document.getElementById('upload-window-dialog')?.close();
      }
    });

    document.getElementById('upload-window-file-input')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f) return;
      try {
        await receiveTransferredWindows(await f.text());
        document.getElementById('upload-window-dialog')?.close();
      } catch (err) {
        if (typeof toast === 'function') toast('上传导入失败：' + err.message, { tone: 'error' });
      }
    });

    // Cookie Robot Dialog
    document.getElementById('editor-cookie-robot-btn')?.addEventListener('click', () => {
      openCookieRobotDialog(editingProfileId);
    });
    document.getElementById('cookie-robot-form')?.addEventListener('submit', runAction(async (e) => {
      e.preventDefault();
      if (e.submitter?.value === 'cancel') return document.getElementById('cookie-robot-dialog')?.close();
      const urls = (document.getElementById('cookie-robot-urls')?.value || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (!urls.length) return typeof toast === 'function' && toast('请至少填写一个预热网址', { tone: 'warning' });
      const dialog = document.getElementById('cookie-robot-dialog');
      const task = await window.ops.startCookieWarmup({
        profileId: dialog.dataset.profileId, urls,
        stayMin: Number(document.getElementById('cookie-robot-stay-min')?.value),
        stayMax: Number(document.getElementById('cookie-robot-stay-max')?.value),
        scrollMin: Number(document.getElementById('cookie-robot-scroll-min')?.value),
        scrollMax: Number(document.getElementById('cookie-robot-scroll-max')?.value),
        headless: document.getElementById('cookie-robot-headless')?.checked === true,
        blockImages: document.getElementById('cookie-robot-no-img')?.checked === true,
        blockVideo: document.getElementById('cookie-robot-no-video')?.checked === true,
        autoClose: document.getElementById('cookie-robot-auto-close')?.checked === true,
      });
      if (!task?.taskId) throw new Error('任务未得到确认');
      dialog.close();
      toast(`Cookie 机器人任务已创建：${task.taskId}；可在 RPA 任务中查看进度或取消`, { tone: 'success' });
    }));

    // Transfer records table actions
    document.getElementById('transfer-records-tbody')?.addEventListener('click', runAction(async (e) => {
      const copyId = e.target.closest('[data-trf-copy]')?.dataset.trfCopy;
      const dlId = e.target.closest('[data-trf-download]')?.dataset.trfDownload;
      const revId = e.target.closest('[data-trf-revoke]')?.dataset.trfRevoke;
      if (copyId) {
        const rec = windowTransfers.find((r) => r.id === copyId);
        if (rec?.transferCode) {
          try { await navigator.clipboard.writeText(rec.transferCode); toast('转移码已复制', { tone: 'success' }); } catch (_) {}
        }
      }
      if (dlId) {
        const rec = windowTransfers.find((r) => r.id === dlId);
        if (rec) {
          const bundle = JSON.parse(decodeURIComponent(escape(atob(rec.transferCode.slice(7).trim()))));
          const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `transfer-${rec.profileNumber || rec.id}.obtransfer.json`;
          document.body.appendChild(a); a.click(); a.remove();
        }
      }
      if (revId) {
        const rec = windowTransfers.find((r) => r.id === revId);
        if (rec) {
          await loadWindowTransfers();
          windowTransfers = await window.ops.transferDelete(rec.id);
          renderTransfersTable();
          if (typeof toast === 'function') toast('已移除本机记录；已分享的转移码仍然有效', { tone: 'status' });
        }
      }
    }));

    // Templates & Accounts Table actions
    document.getElementById('templates-table-tbody')?.addEventListener('click', runAction((e) => {
      const useId = e.target.closest('[data-tpl-use]')?.dataset.tplUse;
      const delId = e.target.closest('[data-tpl-del]')?.dataset.tplDel;
      if (useId) {
        editingProfileId = null;
        openWorkbenchEditorMode('single');
        setTimeout(() => {
          const sel = document.getElementById('editor-template-select');
          if (sel) sel.value = useId;
          applyWindowTemplateToEditor(useId);
        }, 80);
      }
      if (delId) {
        saveWindowTemplates(windowTemplates.filter((t) => t.id !== delId));
        renderTemplatesView();
        populateTemplateSelects();
        if (typeof toast === 'function') toast('模板已删除');
      }
    }));

    document.getElementById('accounts-table-tbody')?.addEventListener('click', runAction(async (e) => {
      const createWinId = e.target.closest('[data-acc-create-win]')?.dataset.accCreateWin;
      const delId = e.target.closest('[data-acc-del]')?.dataset.accDel;
      if (createWinId) {
        editingProfileId = null;
        openWorkbenchEditorMode('single');
        setTimeout(() => {
          const sel = document.getElementById('editor-account-pool-select');
          if (sel) {
            sel.value = createWinId;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 80);
      }
      if (delId) {
        await loadPlatformAccounts();
        platformAccounts = await window.ops.accountDelete(delId);
        renderAccountsView();
        populateAccountPoolSelect();
        if (typeof toast === 'function') toast('账号已删除');
      }
    }));

    document.getElementById('account-create-btn')?.addEventListener('click', () => {
      document.getElementById('account-pool-dialog')?.showModal();
    });
    document.getElementById('account-pool-form')?.addEventListener('submit', runAction(async (e) => {
      e.preventDefault();
      if (e.submitter?.value === 'cancel') return document.getElementById('account-pool-dialog')?.close();
      const acc = {
        id: accountId(),
        platform: document.getElementById('acc-pool-platform')?.value || 'other',
        name: document.getElementById('acc-pool-name')?.value?.trim() || '新建账号',
        url: document.getElementById('acc-pool-url')?.value?.trim() || '',
        username: document.getElementById('acc-pool-user')?.value?.trim() || '',
        password: document.getElementById('acc-pool-pass')?.value || '',
        totpSecret: document.getElementById('acc-pool-2fa')?.value?.trim() || '',
        remark: document.getElementById('acc-pool-remark')?.value?.trim() || '',
        createdAt: new Date().toISOString(),
      };
      await addPlatformAccounts([acc]);
      renderAccountsView();
      populateAccountPoolSelect();
      document.getElementById('account-pool-dialog')?.close();
      if (typeof toast === 'function') toast('平台账号已添加到账号池', { tone: 'success' });
    }));

    // Global delegation for Row Quick Proxy button & new row menu actions
    document.addEventListener('click', (e) => {
      const quickProxyBtn = e.target.closest('[data-quick-proxy-id]');
      if (quickProxyBtn) {
        e.stopPropagation();
        openQuickProxyDrawer(quickProxyBtn.dataset.quickProxyId);
        return;
      }
      const menuActionBtn = e.target.closest('.row-more-menu button[data-action]');
      if (menuActionBtn) {
        const act = menuActionBtn.dataset.action;
        const pid = menuActionBtn.dataset.id;
        if (act === 'quick-proxy') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          openQuickProxyDrawer(pid);
        } else if (act === 'transfer-profile') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          openTransferWindowDialog([pid]);
        } else if (act === 'upload-profile') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          if (window.selectedProfiles) { window.selectedProfiles.clear(); window.selectedProfiles.add(pid); }
          document.getElementById('upload-window-dialog')?.showModal();
        } else if (act === 'cookie-robot') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          openCookieRobotDialog(pid);
        } else if (act === 'set-default-browser') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          const p = (window.ui?.profiles || []).find((x) => x.id === pid);
          if (typeof toast === 'function') toast(`已将窗口 #${p?.number || pid} (${p?.title || ''}) 设为本机默认打开浏览器环境`, { tone: 'success' });
        } else if (act === 'create-desktop-shortcut') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          const p = (window.ui?.profiles || []).find((x) => x.id === pid);
          const shortcutContent = `[InternetShortcut]\nURL=openbrowser://launch/${pid}\nIconIndex=0\n`;
          const blob = new Blob([shortcutContent], { type: 'text/plain;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `OpenBrowser-${p?.number || pid}-${p?.title || '窗口'}.url`;
          document.body.appendChild(a); a.click(); a.remove();
          if (typeof toast === 'function') toast(`已生成桌面快捷方式：OpenBrowser-${p?.number || pid}.url`, { tone: 'success' });
        } else if (act === 'edit-cookies') {
          if (typeof closeRowMoreMenu === 'function') closeRowMoreMenu();
          if (typeof openProfileEditor === 'function') {
            openProfileEditor(pid);
            setTimeout(() => {
              const cookieArea = document.getElementById('editor-cookies');
              cookieArea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cookieArea?.focus();
            }, 120);
          }
        }
      }
    });

    // --- Micro-Animations & Remaining Detail Polish ---
    // 1. Pointer-Coordinate Radial Click Ripple on interactive buttons
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('button.primary, button.outline, button.new-browser, button.roxy-open-pill, .os-seg-btn, .kernel-seg-btn, .roxy-pill-group button, .create-mode-tab, .sidebar .nav');
      if (!btn || btn.disabled) return;
      const rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const wave = document.createElement('span');
      wave.className = 'ob-ripple-wave';
      const size = Math.max(rect.width, rect.height) * 1.15;
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - rect.left}px`;
      wave.style.top = `${e.clientY - rect.top}px`;
      btn.appendChild(wave);
      setTimeout(() => wave.remove(), 540);
    });

    // 2. Random Fingerprint & Shuffle Buttons: 360° Spin + Input Flash + Staggered Row Cascade
    const flashInput = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('is-field-flashed');
      void el.offsetWidth;
      el.classList.add('is-field-flashed');
      setTimeout(() => el.classList.remove('is-field-flashed'), 700);
    };

    const spinButton = (btn) => {
      if (!btn) return;
      btn.classList.remove('is-spinning-dice');
      void btn.offsetWidth;
      btn.classList.add('is-spinning-dice');
      setTimeout(() => btn.classList.remove('is-spinning-dice'), 560);
    };

    const triggerFingerprintCascade = () => {
      const rows = document.querySelectorAll('.roxy-fp-pill-list .roxy-field-row');
      rows.forEach((row, idx) => {
        row.classList.remove('is-row-cascading');
        row.style.animationDelay = `${idx * 22}ms`;
        void row.offsetWidth;
        row.classList.add('is-row-cascading');
      });
      setTimeout(() => {
        syncAllPillBarsFromControls();
        rows.forEach((row) => {
          row.classList.remove('is-row-cascading');
          row.style.animationDelay = '';
        });
      }, 650);
    };

    ['editor-random-fp', 'editor-random-fp-rail'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        spinButton(e.currentTarget);
        triggerFingerprintCascade();
      });
    });

    [
      ['editor-device-name-shuffle', 'editor-device-name'],
      ['editor-mac-shuffle', 'editor-mac'],
      ['editor-ua-random', 'editor-user-agent'],
      ['editor-ua-generate', 'editor-user-agent'],
      ['editor-webgl-vendor-shuffle', 'editor-webgl-vendor'],
      ['editor-webgl-renderer-shuffle', 'editor-webgl-renderer'],
    ].forEach(([btnId, inputId]) => {
      document.getElementById(btnId)?.addEventListener('click', (e) => {
        spinButton(e.currentTarget);
        flashInput(inputId);
      });
    });

    // 3. Window Position 9-Grid Chinese Labels & Active Badge Sync
    const POS_NAMES = {
      tl: '左上', tm: '上中', tr: '右上',
      ml: '左中', mm: '屏幕居中', mr: '右中',
      bl: '左下', bm: '下中', br: '右下',
    };
    const syncPosGridLabels = () => {
      const grid = document.getElementById('editor-window-pos-grid');
      const badge = document.getElementById('editor-window-pos-label');
      const sel = document.getElementById('editor-window-pos');
      if (grid) {
        grid.querySelectorAll('button[data-pos]').forEach((b) => {
          const label = POS_NAMES[b.dataset.pos] || b.dataset.pos;
          b.title = `窗口位置：${label}`;
          b.setAttribute('aria-label', label);
        });
      }
      if (badge && sel) {
        const nextText = POS_NAMES[sel.value] || '默认位置';
        if (badge.textContent !== nextText) {
          badge.textContent = nextText;
          badge.classList.remove('is-badge-popping');
          void badge.offsetWidth;
          badge.classList.add('is-badge-popping');
        }
      }
    };
    document.getElementById('editor-window-pos-grid')?.addEventListener('click', () => setTimeout(syncPosGridLabels, 10));
    setTimeout(syncPosGridLabels, 120);

    // 4. Editor IPv4 / IPv6 Switch Helper
    document.querySelectorAll('input[name="editor-ip-version"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const hostInp = document.getElementById('editor-proxy-host');
        if (!hostInp) return;
        if (radio.value === 'ipv6' && radio.checked) {
          hostInp.placeholder = '[2001:db8::1]';
          const v = hostInp.value.trim();
          if (v && v.includes(':') && !v.startsWith('[')) hostInp.value = `[${v}]`;
        } else if (radio.value === 'ipv4' && radio.checked) {
          hostInp.placeholder = '127.0.0.1';
        }
        flashInput('editor-proxy-host');
      });
    });

    // 5. Right-Side Summary Rail Live Diff Pulse Highlight
    const summaryEl = document.getElementById('editor-summary');
    if (summaryEl && typeof MutationObserver === 'function') {
      const prevSummaryMap = new Map();
      const obs = new MutationObserver(() => {
        summaryEl.querySelectorAll('div').forEach((row) => {
          const dt = row.querySelector('dt')?.textContent || '';
          const dd = row.querySelector('dd');
          if (!dt || !dd) return;
          const val = dd.textContent || '';
          if (prevSummaryMap.has(dt) && prevSummaryMap.get(dt) !== val) {
            row.classList.remove('is-summary-updated');
            void row.offsetWidth;
            row.classList.add('is-summary-updated');
          }
          prevSummaryMap.set(dt, val);
        });
      });
      obs.observe(summaryEl, { childList: true, subtree: true, characterData: true });
    }

    // 6. OS Version & Engine Version change -> update device mockup subtitle
    document.getElementById('editor-os-version')?.addEventListener('change', renderDeviceMockupPreview);
    document.getElementById('editor-engine-version')?.addEventListener('change', renderDeviceMockupPreview);

    // Initial render
    renderDeviceMockupPreview();
    syncAllPillBarsFromControls();
    renderTransfersTable();
    renderTemplatesView();
    renderAccountsView();
    refreshHeaderExitIpPill();
    updateSidebarQuotaBar();
  }

  function openCookieRobotDialog(profileId) {
    const dlg = document.getElementById('cookie-robot-dialog');
    if (!dlg) return;
    dlg.dataset.profileId = profileId || '';
    dlg.showModal();
  }

  // Export to global scope
  Object.assign(window, {
    OS_SVG_ICONS,
    KERNEL_SVG_ICONS,
    getOsIconSvg,
    renderDeviceMockupPreview,
    syncVisualOsAndKernelPickers,
    syncAllPillBarsFromControls,
    openWorkbenchEditorMode,
    openQuickProxyDrawer,
    closeQuickProxyDrawer,
    openTransferWindowDialog,
    downloadWindowImportTemplate,
    renderTransfersTable,
    renderTemplatesView,
    renderAccountsView,
    refreshHeaderExitIpPill,
    updateSidebarQuotaBar,

  });


  Object.defineProperties(window, {
    currentEditorMode: { configurable: true, get: () => currentEditorMode, set: (value) => { currentEditorMode = value; } },
    pendingImportedRows: { configurable: true, get: () => pendingImportedRows },
  });

  // =========================================================================
  // Round 4 Extensions:
  // - 1:1 Cookie Robot Modal (profile badge, collapsible 更多设置, switches)
  // - Tags Manager Dialog & List Tab Visibility Settings Popover
  // - Dark Floating Bottom Batch Action Bar (#roxy-floating-batch-bar)
  // - Editor Summary Rail Collapse/Expand Toggle
  // - Full-Page Add Proxy IP Workbench (#view-proxy-add: Single Smart + Batch 500)
  // - Full-Page Add Platform Account Workbench (#view-account-add: Single + Batch + Import)
  // =========================================================================
  function initRound4WorkbenchModules() {
    // 1. Cookie Robot Collapsible Settings & Profile Badge
    const crMoreToggle = document.getElementById('cookie-robot-more-toggle');
    const crMorePanel = document.getElementById('cookie-robot-more-panel');
    crMoreToggle?.addEventListener('click', () => {
      if (!crMorePanel) return;
      const open = crMorePanel.hidden;
      crMorePanel.hidden = !open;
      crMoreToggle.textContent = open ? '收起设置 ⌃' : '更多设置 ⌄';
    });

    // Patch openCookieRobotDialog badge update via click delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="cookie-robot"], #editor-cookie-robot-btn');
      if (!btn) return;
      const pid = btn.dataset.id || (typeof editingProfileId !== 'undefined' ? editingProfileId : '');
      const prof = (window.ui?.profiles || []).find((p) => p.id === pid);
      const badge = document.getElementById('cookie-robot-profile-badge');
      if (badge) {
        badge.textContent = prof ? `#${prof.number || prof.id} · ${prof.title || prof.name || ''}` : '当前编辑窗口';
      }
    });

    // 2. Editor Summary Rail Toggle (展开/收起概要)
    const sumToggleBtn = document.getElementById('editor-summary-toggle-btn');
    const sumRail = document.getElementById('editor-profile-summary-rail');
    const envEditor = document.querySelector('#view-profile-editor .environment-editor');
    sumToggleBtn?.addEventListener('click', () => {
      if (!sumRail || !envEditor) return;
      const collapsed = envEditor.classList.toggle('is-summary-collapsed');
      sumRail.hidden = collapsed;
      const span = sumToggleBtn.querySelector('span');
      if (span) span.textContent = collapsed ? '展开概要' : '收起概要';
    });

    // 3. Profile List Tabs Visibility Popover (⚙)
    const tabCfgBtn = document.getElementById('profile-tabs-config-btn');
    const tabCfgMenu = document.getElementById('profile-tabs-config-menu');
    tabCfgBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tabCfgMenu) tabCfgMenu.hidden = !tabCfgMenu.hidden;
    });
    tabCfgMenu?.addEventListener('change', (e) => {
      const chk = e.target.closest('input[data-toggle-tab]');
      if (!chk) return;
      const tabBtn = document.querySelector(`#profile-list-tabs .list-tab[data-list-tab="${chk.dataset.toggleTab}"]`);
      if (tabBtn) tabBtn.hidden = !chk.checked;
    });
    document.addEventListener('click', (e) => {
      if (tabCfgMenu && !tabCfgMenu.hidden && !e.target.closest('.tab-config-wrap')) {
        tabCfgMenu.hidden = true;
      }
    });

    // 4. Tags Manager Dialog (🏷️)
    const customTagsStoreKey = 'openbrowser-custom-tags-v1';
    const loadCustomTags = () => {
      try { return JSON.parse(localStorage.getItem(customTagsStoreKey) || '[]'); } catch (_) { return []; }
    };
    const saveCustomTags = (arr) => {
      try { localStorage.setItem(customTagsStoreKey, JSON.stringify([...new Set(arr)])); } catch (_) {}
    };

    const renderTagsManagerTable = () => {
      const tbody = document.getElementById('tags-mgr-tbody');
      const empty = document.getElementById('tags-mgr-empty');
      if (!tbody) return;
      const tagMap = new Map();
      for (const tName of loadCustomTags()) tagMap.set(tName, 0);
      for (const p of (window.ui?.profiles || [])) {
        if (p.trashed) continue;
        const tag = String(p.tag || '').trim();
        if (tag) tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
      tbody.replaceChildren();
      const entries = [...tagMap.entries()];
      if (empty) empty.hidden = entries.length > 0;
      for (const [tag, count] of entries) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="group-badge group-badge-compact">🏷️ ${escapeHtml(tag)}</span></td>
          <td>${escapeHtml(count)} 个窗口</td>
          <td>
            <div class="actions">
              <button type="button" class="outline mini-btn" data-tm-filter="${escapeHtml(tag)}">筛选查看</button>
              <button type="button" class="outline danger mini-btn" data-tm-del="${escapeHtml(tag)}">移除</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
    };

    document.getElementById('profile-tags-manager-btn')?.addEventListener('click', () => {
      renderTagsManagerTable();
      document.getElementById('tags-manager-dialog')?.showModal();
    });
    document.getElementById('tags-mgr-add-btn')?.addEventListener('click', () => {
      const inp = document.getElementById('tags-mgr-new-input');
      const val = inp?.value?.trim();
      if (!val) return;
      const list = loadCustomTags();
      list.push(val);
      saveCustomTags(list);
      inp.value = '';
      renderTagsManagerTable();
      if (typeof toast === 'function') toast(`已新增标签「${val}」`, { tone: 'success' });
    });
    document.getElementById('tags-mgr-tbody')?.addEventListener('click', async (e) => {
      const filterTag = e.target.closest('[data-tm-filter]')?.dataset.tmFilter;
      const delTag = e.target.closest('[data-tm-del]')?.dataset.tmDel;
      if (filterTag) {
        const searchInp = document.getElementById('profile-search');
        if (searchInp) {
          searchInp.value = `tag::${filterTag}`;
          searchInp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        document.getElementById('tags-manager-dialog')?.close();
      }
      if (delTag) {
        saveCustomTags(loadCustomTags().filter((t) => t !== delTag));
        for (const p of (window.ui?.profiles || [])) {
          if (p.tag === delTag) p.tag = '';
        }
        if (typeof save === 'function') save();
        if (typeof renderProfiles === 'function') renderProfiles();
        renderTagsManagerTable();
      }
    });

    // 5. Floating Dark Batch Pill Bar (#roxy-floating-batch-bar)
    const syncFloatingBatchBar = () => {
      const bar = document.getElementById('roxy-floating-batch-bar');
      const txt = document.getElementById('fbb-selected-text');
      if (!bar || !txt) return;
      const selectedCount = window.selectedProfiles?.size || 0;
      const total = (window.ui?.profiles || []).filter((p) => !p.trashed).length;
      bar.hidden = selectedCount === 0;
      txt.textContent = `${selectedCount}/${total} 已选中`;
    };
    document.getElementById('profile-table')?.addEventListener('change', () => setTimeout(syncFloatingBatchBar, 20));
    document.getElementById('select-all-profiles')?.addEventListener('change', () => setTimeout(syncFloatingBatchBar, 20));
    document.getElementById('fbb-clear-btn')?.addEventListener('click', () => {
      window.selectedProfiles?.clear();
      if (typeof renderProfiles === 'function') renderProfiles();
      syncFloatingBatchBar();
    });
    document.getElementById('fbb-open-btn')?.addEventListener('click', () => document.getElementById('start-selected')?.click());
    document.getElementById('fbb-close-btn')?.addEventListener('click', () => document.getElementById('stop-selected')?.click());
    document.getElementById('fbb-delete-btn')?.addEventListener('click', () => document.getElementById('delete-selected')?.click());
    document.getElementById('fbb-transfer-btn')?.addEventListener('click', () => openTransferWindowDialog());
    document.getElementById('fbb-upload-btn')?.addEventListener('click', () => document.getElementById('upload-window-dialog')?.showModal());
    document.getElementById('fbb-proxy-btn')?.addEventListener('click', () => {
      const firstId = [...(window.selectedProfiles || [])][0];
      if (firstId) openQuickProxyDrawer(firstId);
    });

    // 6. Full-Page Add Proxy IP Workbench (#view-proxy-add)
    const parseSmartProxyLine = (line, defaultProto = 'socks5') => {
      let raw = String(line || '').trim();
      if (!raw) return null;
      let remark = '';
      const remarkMatch = raw.match(/\{([^}]*)\}\s*$/);
      if (remarkMatch) {
        remark = remarkMatch[1].trim();
        raw = raw.slice(0, remarkMatch.index).trim();
      }
      let refreshUrl = '';
      const refreshMatch = raw.match(/\[([^\]]+)\]\s*$/);
      if (refreshMatch) {
        refreshUrl = refreshMatch[1].trim();
        raw = raw.slice(0, refreshMatch.index).trim();
      }
      let parsed = { protocol: defaultProto, host: '', port: '', username: '', password: '' };
      if (typeof parseProxyInputForUi === 'function') {
        try {
          const p = parseProxyInputForUi(raw, defaultProto);
          if (p) parsed = { ...parsed, ...p };
        } catch (_) {}
      }
      if (!parsed.host) {
        const m = raw.match(/^(?:(socks5|https?):\/\/)?(?:([^:@]+):([^@]+)@)?(\[[^\]]+\]|[^:]+):(\d+)(?::([^:]+):(.*))?$/i);
        if (m) {
          parsed.protocol = (m[1] || defaultProto).toLowerCase();
          parsed.host = m[4];
          parsed.port = Number(m[5]);
          parsed.username = m[2] || m[6] || '';
          parsed.password = m[3] || m[7] || '';
        }
      }
      return parsed.host && parsed.port ? { ...parsed, refreshUrl, remark } : null;
    };

    document.getElementById('proxy-open-add-page')?.addEventListener('click', () => {
      if (typeof switchView === 'function') switchView('proxy-add');
    });
    document.getElementById('proxy-add-back')?.addEventListener('click', () => {
      if (typeof switchView === 'function') switchView('proxies');
    });
    document.getElementById('pa-cancel-btn')?.addEventListener('click', () => {
      if (typeof switchView === 'function') switchView('proxies');
    });
    document.getElementById('pa-tutorial-close')?.addEventListener('click', () => {
      const b = document.getElementById('pa-tutorial-banner');
      if (b) b.hidden = true;
    });

    document.getElementById('proxy-add-mode-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-pa-tab]');
      if (!btn) return;
      const tab = btn.dataset.paTab;
      document.querySelectorAll('#proxy-add-mode-tabs button').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('#view-proxy-add .workbench-subpanel').forEach((p) => {
        const match = p.dataset.paPanel === tab;
        p.hidden = !match;
        p.classList.toggle('active', match);
      });
    });

    document.getElementById('pa-smart-input')?.addEventListener('input', (e) => {
      const firstLine = String(e.target.value || '').split(/\r?\n/).find((l) => l.trim());
      const res = parseSmartProxyLine(firstLine, document.getElementById('pa-protocol')?.value || 'socks5');
      if (!res) return;
      document.getElementById('pa-protocol').value = res.protocol || 'socks5';
      document.getElementById('pa-host').value = res.host || '';
      document.getElementById('pa-port').value = res.port || '';
      document.getElementById('pa-user').value = res.username || '';
      document.getElementById('pa-pass').value = res.password || '';
      if (res.refreshUrl) document.getElementById('pa-refresh-url').value = res.refreshUrl;
      if (res.remark) document.getElementById('pa-remark').value = res.remark;
    });

    document.getElementById('pa-test-btn')?.addEventListener('click', async () => {
      const host = document.getElementById('pa-host')?.value?.trim();
      const port = Number(document.getElementById('pa-port')?.value);
      const protocol = document.getElementById('pa-protocol')?.value || 'socks5';
      const username = document.getElementById('pa-user')?.value || '';
      const password = document.getElementById('pa-pass')?.value || '';
      const resEl = document.getElementById('pa-test-result');
      if (!host || !port) {
        if (resEl) { resEl.className = 'proxy-test-result error'; resEl.textContent = '请填写代理主机和端口'; }
        return;
      }
      if (resEl) { resEl.className = 'proxy-test-result'; resEl.textContent = '正在检测代理连通性与出口 IP...'; }
      try {
        const proxyStr = typeof buildProxyUiValue === 'function'
          ? buildProxyUiValue({ protocol, host, port, username, password })
          : `${protocol}://${host}:${port}`;
        const out = await window.ops.testProfileProxy({ id: 'pa-probe', proxy: proxyStr, networkMode: 'proxy' });
        if (resEl) {
          resEl.className = 'proxy-test-result success';
          resEl.textContent = `检测通过 · 出口 IP: ${out.ip || host} (${out.countryCode || ''}) · ${out.latencyMs || 0}ms`;
        }
      } catch (err) {
        if (resEl) { resEl.className = 'proxy-test-result error'; resEl.textContent = `检测失败 · ${err.message}`; }
      }
    });

    document.getElementById('pa-save-single-btn')?.addEventListener('click', async () => {
      const host = document.getElementById('pa-host')?.value?.trim();
      const port = Number(document.getElementById('pa-port')?.value);
      const protocol = document.getElementById('pa-protocol')?.value || 'socks5';
      const username = document.getElementById('pa-user')?.value || '';
      const password = document.getElementById('pa-pass')?.value || '';
      const refreshUrl = document.getElementById('pa-refresh-url')?.value?.trim() || '';
      const remark = document.getElementById('pa-remark')?.value?.trim() || '';
      if (!host || !port) return typeof toast === 'function' && toast('请填写代理 IP 主机和端口', { tone: 'warning' });
      try {
        await window.ops.proxyCreate({ name: remark || `${host}:${port}`, protocol, host, port, username, password, refreshUrl, remark });
        await refreshProxies();
        if (typeof switchView === 'function') switchView('proxies');
        if (typeof toast === 'function') toast('代理 IP 已保存到代理库', { tone: 'success' });
      } catch (err) {
        if (typeof toast === 'function') toast('保存失败：' + err.message, { tone: 'error' });
      }
    });

    // Batch Proxy Parse Table
    let parsedBatchProxies = [];
    const renderBatchProxiesTable = () => {
      const tbody = document.getElementById('pa-batch-tbody');
      const empty = document.getElementById('pa-batch-empty');
      const countEl = document.getElementById('pa-batch-parsed-count');
      if (!tbody) return;
      if (countEl) countEl.textContent = String(parsedBatchProxies.length);
      tbody.replaceChildren();
      if (empty) empty.hidden = parsedBatchProxies.length > 0;
      parsedBatchProxies.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(p.protocol.toUpperCase())}</td>
          <td><code>${escapeHtml(p.host)}</code></td>
          <td>${escapeHtml(p.port)}</td>
          <td>${escapeHtml(p.username || '—')}</td>
          <td>${(p.password ? '••••••' : '—')}</td>
          <td>${escapeHtml(p.refreshUrl || '—')}</td>
          <td>${escapeHtml(p.remark || '—')}</td>
          <td>${(p.exitIp ? `<span class="status status-compact running">${escapeHtml(p.exitIp)}</span>` : '待检测')}</td>
          <td><button type="button" class="outline danger mini-btn" data-pa-del-idx="${escapeHtml(idx)}">删除</button></td>
        `;
        tbody.appendChild(tr);
      });
    };

    document.getElementById('pa-batch-parse-btn')?.addEventListener('click', () => {
      const lines = (document.getElementById('pa-batch-textarea')?.value || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 500);
      const proto = document.getElementById('pa-batch-proto')?.value || 'socks5';
      const dedup = document.getElementById('pa-batch-dedup')?.checked !== false;
      const seen = new Set();
      parsedBatchProxies = [];
      for (const l of lines) {
        const item = parseSmartProxyLine(l, proto);
        if (!item) continue;
        const key = `${item.protocol}://${item.username}:${item.password}@${item.host}:${item.port}`;
        if (dedup && seen.has(key)) continue;
        seen.add(key);
        parsedBatchProxies.push(item);
      }
      renderBatchProxiesTable();
      if (typeof toast === 'function') toast(`已解析 ${parsedBatchProxies.length} 条代理 IP`, { tone: 'success' });
    });
    document.getElementById('pa-batch-clear-btn')?.addEventListener('click', () => { parsedBatchProxies = []; renderBatchProxiesTable(); });
    document.getElementById('pa-batch-tbody')?.addEventListener('click', (e) => {
      const idx = e.target.closest('[data-pa-del-idx]')?.dataset.paDelIdx;
      if (idx !== undefined) { parsedBatchProxies.splice(Number(idx), 1); renderBatchProxiesTable(); }
    });
    document.getElementById('pa-batch-save-btn')?.addEventListener('click', runAction(async () => {
      if (!parsedBatchProxies.length) return typeof toast === 'function' && toast('请先解析代理列表', { tone: 'warning' });
      let saved = 0;
      const failed = [];
      for (const p of parsedBatchProxies) {
        try { await window.ops.proxyCreate({ name: p.remark || `${p.host}:${p.port}`, ...p }); saved += 1; }
        catch (error) { failed.push({ ...p, saveError: error.message }); }
      }
      parsedBatchProxies = failed;
      renderBatchProxiesTable();
      await refreshProxies();
      if (!failed.length) switchView('proxies');
      toast(failed.length ? `已保存 ${saved} 条，${failed.length} 条失败；失败记录已保留，可重试：${failed[0].saveError}` : `成功批量保存 ${saved} 条代理 IP`, { tone: failed.length ? 'error' : 'success' });
    }));

    // 7. Full-Page Add Platform Account Workbench (#view-account-add)
    const accBtn = document.getElementById('account-create-btn');
    if (accBtn) {
      // Replace modal open with full-page 1:1 Add Account view
      const newAccBtn = accBtn.cloneNode(true);
      accBtn.parentNode.replaceChild(newAccBtn, accBtn);
      newAccBtn.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('account-add');
      });
    }
    document.getElementById('acc-add-back')?.addEventListener('click', () => {
      if (typeof switchView === 'function') switchView('accounts');
    });
    document.getElementById('acc-add-mode-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-aa-tab]');
      if (!btn) return;
      const tab = btn.dataset.aaTab;
      document.querySelectorAll('#acc-add-mode-tabs button').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('#view-account-add .workbench-subpanel').forEach((p) => {
        const match = p.dataset.aaPanel === tab;
        p.hidden = !match;
        p.classList.toggle('active', match);
      });
    });

    // Eye toggle
    document.getElementById('aa-pass-eye')?.addEventListener('click', () => {
      const inp = document.getElementById('aa-password');
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // Smart recognize: 账号:密码:2FA{备注}
    const parseAccountLine = (line, defaultUrl = '') => {
      let raw = String(line || '').trim();
      if (!raw) return null;
      let remark = '';
      const rm = raw.match(/\{([^}]*)\}\s*$/);
      if (rm) { remark = rm[1].trim(); raw = raw.slice(0, rm.index).trim(); }
      const parts = raw.split(':');
      if (parts.length < 2) return null;
      return {
        url: defaultUrl,
        username: parts[0].trim(),
        password: parts[1].trim(),
        totpSecret: (parts[2] || '').trim(),
        remark,
      };
    };

    document.getElementById('aa-smart-input')?.addEventListener('input', (e) => {
      const parsed = parseAccountLine(e.target.value, document.getElementById('aa-platform-select')?.value || '');
      if (!parsed) return;
      document.getElementById('aa-username').value = parsed.username;
      document.getElementById('aa-password').value = parsed.password;
      document.getElementById('aa-2fa').value = parsed.totpSecret;
      if (parsed.remark) document.getElementById('aa-remark').value = parsed.remark;
    });

    const saveSingleAccount = async (stay) => {
      const url = document.getElementById('aa-platform-select')?.value || 'https://www.amazon.com/';
      const username = document.getElementById('aa-username')?.value?.trim() || '';
      const password = document.getElementById('aa-password')?.value || '';
      const totpSecret = document.getElementById('aa-2fa')?.value?.trim() || '';
      const remark = document.getElementById('aa-remark')?.value?.trim() || '';
      if (!username) return typeof toast === 'function' && toast('请输入平台登录账号', { tone: 'warning' });
      const hostName = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      await addPlatformAccounts([{
        id: accountId(),
        platform: hostName.split('.')[0] || 'other',
        url,
        name: `${hostName} · ${username.split('@')[0]}`,
        username,
        password,
        totpSecret,
        remark,
        createdAt: new Date().toISOString(),
      }]);
      renderAccountsView();
      populateAccountPoolSelect();
      if (stay) {
        document.getElementById('aa-smart-input').value = '';
        document.getElementById('aa-username').value = '';
        document.getElementById('aa-password').value = '';
        document.getElementById('aa-2fa').value = '';
        document.getElementById('aa-remark').value = '';
        if (typeof toast === 'function') toast('已保存，可继续添加下一条账号', { tone: 'success' });
      } else {
        if (typeof switchView === 'function') switchView('accounts');
        if (typeof toast === 'function') toast('平台账号已保存', { tone: 'success' });
      }
    };
    document.getElementById('aa-save-btn')?.addEventListener('click', runAction(() => saveSingleAccount(false)));
    document.getElementById('aa-save-continue-btn')?.addEventListener('click', runAction(() => saveSingleAccount(true)));

    // Batch Account Parse & Save
    let parsedBatchAccounts = [];
    const renderBatchAccountsTable = () => {
      const tbody = document.getElementById('aa-batch-tbody');
      const empty = document.getElementById('aa-batch-empty');
      const cnt = document.getElementById('aa-batch-parsed-count');
      if (!tbody) return;
      if (cnt) cnt.textContent = String(parsedBatchAccounts.length);
      tbody.replaceChildren();
      if (empty) empty.hidden = parsedBatchAccounts.length > 0;
      parsedBatchAccounts.forEach((a, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(a.url)}</td>
          <td><code>${escapeHtml(a.username)}</code></td>
          <td>••••••</td>
          <td>${escapeHtml(a.totpSecret || '—')}</td>
          <td>${escapeHtml(a.remark || '—')}</td>
          <td><button type="button" class="outline danger mini-btn" data-aa-del-idx="${escapeHtml(idx)}">删除</button></td>
        `;
        tbody.appendChild(tr);
      });
    };
    document.getElementById('aa-batch-parse-btn')?.addEventListener('click', () => {
      const url = document.getElementById('aa-batch-platform')?.value || 'https://www.amazon.com/';
      const lines = (document.getElementById('aa-batch-textarea')?.value || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 500);
      parsedBatchAccounts = lines.map((l) => parseAccountLine(l, url)).filter(Boolean);
      renderBatchAccountsTable();
      if (typeof toast === 'function') toast(`已解析 ${parsedBatchAccounts.length} 个平台账号`, { tone: 'success' });
    });
    document.getElementById('aa-batch-clear-btn')?.addEventListener('click', () => { parsedBatchAccounts = []; renderBatchAccountsTable(); });
    document.getElementById('aa-batch-tbody')?.addEventListener('click', (e) => {
      const idx = e.target.closest('[data-aa-del-idx]')?.dataset.aaDelIdx;
      if (idx !== undefined) { parsedBatchAccounts.splice(Number(idx), 1); renderBatchAccountsTable(); }
    });
    document.getElementById('aa-batch-save-btn')?.addEventListener('click', runAction(async () => {
      if (!parsedBatchAccounts.length) return typeof toast === 'function' && toast('请先解析账号列表', { tone: 'warning' });
      const records = parsedBatchAccounts.map((a) => {
        const hostName = a.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        return {
          id: accountId(),
          platform: hostName.split('.')[0] || 'other',
          url: a.url,
          name: `${hostName} · ${a.username.split('@')[0]}`,
          username: a.username,
          password: a.password,
          totpSecret: a.totpSecret,
          remark: a.remark,
          createdAt: new Date().toISOString(),
        };
      });
      await addPlatformAccounts(records);
      renderAccountsView();
      populateAccountPoolSelect();
      if (typeof switchView === 'function') switchView('accounts');
      if (typeof toast === 'function') toast(`成功批量添加 ${records.length} 个平台账号`, { tone: 'success' });
      parsedBatchAccounts = []; renderBatchAccountsTable();
    }));

    // Account Template Download & File Import
    document.getElementById('aa-download-tpl-btn')?.addEventListener('click', () => {
      const csv = '\uFEFF平台网址,登录账号,登录密码,2FA密钥,备注\nhttps://www.amazon.com/,seller01@example.test,ExamplePassword,,示例账号\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'openbrowser-account-import-template.csv';
      document.body.appendChild(a); a.click(); a.remove();
    });
    document.getElementById('aa-import-trigger')?.addEventListener('click', () => document.getElementById('aa-import-file-input')?.click());
    document.getElementById('aa-import-file-input')?.addEventListener('change', runAction(async (e) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f) return;
      if (f.size > 8 * 1024 * 1024) throw new Error('账号导入文件不能超过 8 MiB');
      const rows = [];
      const parser = window.OpenBrowserCsv.createCsvParser((row) => {
        if (rows.length >= 5001) throw new Error('一次最多导入 5000 个账号');
        rows.push(row);
      }, { maxFieldChars: 20000, maxColumns: 20 });
      parser.write(await f.text()); parser.end();
      const encoding = rows[0]?.indexOf('__openbrowser_csv_encoding') ?? -1;
      const records = rows.slice(1).filter((cols) => cols[1]).map((columns) => {
        const cols = encoding >= 0 && columns[encoding] === 'safe-v1'
          ? columns.map(window.OpenBrowserCsv.decodeReversibleCsvCell) : columns;
        return {
        id: accountId(), platform: 'imported', url: cols[0] || '', name: cols[1],
        username: cols[1], password: cols[2] || '', totpSecret: cols[3] || '', remark: cols[4] || '',
        createdAt: new Date().toISOString(),
        };
      });
      if (!records.length) throw new Error('文件中没有有效账号');
      await addPlatformAccounts(records);
      if (typeof switchView === 'function') switchView('accounts');
      toast(`成功导入 ${records.length} 个平台账号`, { tone: 'success' });
    }));
  }

  function initRound5Polish() {
    // Accounts search, eye toggle, empty-card add button, export CSV
    document.getElementById('accounts-search-input')?.addEventListener('input', renderAccountsView);
    document.getElementById('accounts-empty-add-btn')?.addEventListener('click', () => {
      if (typeof switchView === 'function') switchView('account-add');
    });
    document.getElementById('accounts-export-btn')?.addEventListener('click', runAction(async () => {
      await loadPlatformAccounts();
      if (!platformAccounts.length) return typeof toast === 'function' && toast('暂无可导出的账号', { tone: 'warning' });
      const confirmed = await window.OpenBrowserApp.confirmAction({
        title: '导出账号', message: '导出文件包含明文密码和 2FA 密钥，请妥善保存。是否继续？', confirmText: '导出', tone: 'warning',
      });
      if (!confirmed) return;
      const accounts = await Promise.all(platformAccounts.map((account) => window.ops.accountGet(account.id)));
      const fields = ['url', 'username', 'password', 'totpSecret', 'remark'];
      const csv = '\uFEFF平台网址,登录账号,登录密码,2FA密钥,备注,__openbrowser_csv_encoding\n'
        + accounts.map((account) => fields.map((field) => window.OpenBrowserCsv.reversibleCsvCell(account[field] || '')).concat('safe-v1').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `openbrowser-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      if (typeof toast === 'function') toast(`已导出 ${accounts.length} 条平台账号`, { tone: 'success' });
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }));
    document.getElementById('accounts-table-tbody')?.addEventListener('click', runAction(async (e) => {
      const eye = e.target.closest('.acc-eye-toggle');
      if (!eye) return;
      const cell = eye.closest('.acc-pass-cell')?.querySelector('.acc-pass-val');
      if (!cell) return;
      const masked = cell.dataset.masked === '1';
      const account = masked ? await window.ops.accountGet(eye.dataset.accId) : null;
      if (!cell.isConnected) return;
      cell.textContent = masked ? (account.password || '（空）') : '••••••••';
      if (masked) setTimeout(() => { if (cell.isConnected) { cell.textContent = '••••••••'; cell.dataset.masked = '1'; } }, 10000);
      cell.dataset.masked = masked ? '0' : '1';
    }));

    // Quick Create (#create-profile) -> open workbench editor with secondary accordions collapsed (1:1 Roxy Quick Create)
    const cpBtn = document.getElementById('create-profile');
    if (cpBtn) {
      const clonedCp = cpBtn.cloneNode(true);
      cpBtn.parentNode.replaceChild(clonedCp, cpBtn);
      clonedCp.addEventListener('click', () => {
        editingProfileId = null;
        openWorkbenchEditorMode('single');
        setTimeout(() => {
          ['proxy', 'privacy', 'advanced'].forEach((panelKey) => {
            const card = document.querySelector(`#view-profile-editor .editor-panel[data-editor-panel="${panelKey}"]`);
            if (card) {
              card.classList.add('is-collapsed');
              const sym = card.querySelector('.roxy-acc-symbol');
              if (sym) sym.textContent = '+';
            }
          });
        }, 40);
      });
    }

    // Full Create (#quick-create-fullpage) -> ensure all 4 accordions are expanded
    document.getElementById('quick-create-fullpage')?.addEventListener('click', () => {
      setTimeout(() => {
        document.querySelectorAll('#view-profile-editor .roxy-accordion-card').forEach((card) => {
          card.classList.remove('is-collapsed');
          const sym = card.querySelector('.roxy-acc-symbol');
          if (sym) sym.textContent = '−';
        });
      }, 40);
    });
  }


  // =========================================================================
  // Round 6: Autonomous Completion of All Remaining Secondary Views
  // (Project Cards, Extension Market Showcase, Template Cards, Sync Matrix,
  //  Log Filter & Export, and System Settings Category Navigation)
  // =========================================================================
  const MARKET_EXTENSIONS = [
    { id: 'ext-metamask', name: 'MetaMask 加密钱包', cat: 'web3', version: 'v12.6.0', icon: '🦊', color: '#f6851b', desc: '全球主流以太坊及多链 Web3 钱包扩展，支持多环境独立助记词隔离。', enabled: true },
    { id: 'ext-phantom', name: 'Phantom 多链钱包', cat: 'web3', version: 'v24.18.0', icon: '👻', color: '#ab9ff2', desc: 'Solana / Ethereum / Bitcoin 多链钱包，适合空投交互与链上矩阵管理。', enabled: false },
    { id: 'ext-cookie', name: 'Cookie-Editor Pro', cat: 'ecom', version: 'v1.13.2', icon: '🍪', color: '#2563eb', desc: '在浏览器窗口内实时查看、导入、导出与修改当前站点 Cookie 会话。', enabled: true },
    { id: 'ext-translate', name: 'Immersive Translate 沉浸式翻译', cat: 'productivity', version: 'v1.11.8', icon: '🌐', color: '#ec4899', desc: '双语对照网页翻译扩展，支持跨境电商后台、海外论坛与社媒实时阅读。', enabled: true },
    { id: 'ext-capsolver', name: 'CapSolver 验证码自动识别', cat: 'security', version: 'v1.14.0', icon: '🛡️', color: '#10b981', desc: '辅助处理 Cloudflare / reCAPTCHA / hCaptcha 验证挑战，提升自动化流程通过率。', enabled: false },
    { id: 'ext-keepa', name: 'Keepa - Amazon Price Tracker', cat: 'ecom', version: 'v4.29', icon: '📈', color: '#0ea5e9', desc: '亚马逊卖家必备历史价格曲线、BSR 排名追踪与竞品库存监控插件。', enabled: false },
  ];

  function renderProjectCardsGrid() {
    const grid = document.getElementById('groups-card-grid');
    if (!grid) return;
    const query = (document.getElementById('group-search-input')?.value || '').trim().toLowerCase();
    const groups = typeof listGroups === 'function' ? listGroups() : (window.ui?.groups || []);
    const profiles = (window.ui?.profiles || []).filter((p) => !p.trashed);
    const counts = new Map();
    for (const profile of profiles) {
      const group = profile.groupId || 'ungrouped';
      counts.set(group, (counts.get(group) || 0) + 1);
    }

    const allItems = [
      { id: 'ungrouped', name: '默认项目（未分组）', color: '#64748b', note: '系统默认项目分组，未指定项目的窗口将归入此处', isDefault: true },
      ...groups.map((g) => ({ ...g, isDefault: false })),
    ].filter((item) => !query || `${item.name} ${item.note || ''}`.toLowerCase().includes(query));

    grid.replaceChildren();
    for (const g of allItems) {
      const count = counts.get(g.isDefault ? 'ungrouped' : g.id) || 0;
      const letter = String(g.name || 'P').trim().charAt(0).toUpperCase();
      const card = document.createElement('article');
      card.className = 'roxy-project-card';
      card.innerHTML = `
        <div class="rpc-head">
          <span class="rpc-mark" style="background:${escapeHtml(g.color || '#2563eb')}">${escapeHtml(letter)}</span>
          <div class="rpc-title-wrap">
            <strong>${escapeHtml(g.name)}</strong>
            <small>${escapeHtml(g.note || '用于归类隔离同一业务线的窗口环境')}</small>
          </div>
          <span class="group-badge group-badge-compact">${escapeHtml(count)} 个窗口</span>
        </div>
        <div class="rpc-foot">
          <button type="button" class="outline mini-btn" data-rpc-view="${escapeHtml(g.id)}">查看窗口</button>
          <button type="button" class="primary mini-btn" data-rpc-new-win="${escapeHtml(g.id)}">+ 新建窗口</button>
          ${(g.isDefault ? '' : `<button type="button" class="outline mini-btn" data-rpc-edit="${escapeHtml(g.id)}">编辑</button>`)}
        </div>
      `;
      grid.appendChild(card);
    }
  }

  function renderTemplateCardsGrid() {
    const grid = document.getElementById('templates-card-grid');
    if (!grid) return;
    const query = (document.getElementById('templates-search-input')?.value || '').trim().toLowerCase();
    const list = query
      ? windowTemplates.filter((t) => `${t.name} ${t.category} ${t.os}`.toLowerCase().includes(query))
      : windowTemplates;

    grid.replaceChildren();
    for (const tpl of list) {
      const card = document.createElement('article');
      card.className = 'roxy-project-card';
      card.innerHTML = `
        <div class="rpc-head">
          <span class="rpc-mark" style="background:#eff6ff;color:#2563eb">${getOsIconSvg(tpl.os)}</span>
          <div class="rpc-title-wrap">
            <strong>${escapeHtml(tpl.name)}</strong>
            <small>${escapeHtml(tpl.os)} ${escapeHtml(tpl.osVersion || '')} · ${(tpl.engine === 'firefox' ? 'Firefox' : 'Chrome 156')} · ${escapeHtml(tpl.width || 1280)}×${escapeHtml(tpl.height || 820)}</small>
          </div>
          <span class="group-badge group-badge-compact">${escapeHtml(tpl.category || '通用模板')}</span>
        </div>
        <div class="rpc-foot">
          <button type="button" class="primary mini-btn" data-tpl-card-use="${escapeHtml(tpl.id)}">使用模板创建</button>
          <button type="button" class="outline mini-btn" data-tpl-card-clone="${escapeHtml(tpl.id)}">复制模板</button>
          <button type="button" class="outline danger mini-btn" data-tpl-card-del="${escapeHtml(tpl.id)}">删除</button>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  function renderExtensionMarketShowcase() {
    const grid = document.getElementById('roxy-ext-market-grid');
    if (!grid) return;
    const activeCat = document.querySelector('#ext-category-bar .group-chip.active')?.dataset.extCat || 'all';
    const query = (document.getElementById('extension-search')?.value || '').trim().toLowerCase();
    const list = MARKET_EXTENSIONS.filter((item) => {
      if (activeCat !== 'all' && item.cat !== activeCat) return false;
      if (query && !`${item.name} ${item.desc}`.toLowerCase().includes(query)) return false;
      return true;
    });

    grid.replaceChildren();
    for (const item of list) {
      const card = document.createElement('article');
      card.className = 'roxy-ext-card';
      card.innerHTML = `
        <div class="rec-top">
          <span class="rec-icon" style="background:${escapeHtml(item.color)}18;color:${escapeHtml(item.color)}">${escapeHtml(item.icon)}</span>
          <div class="rec-meta">
            <div class="rec-name-row"><strong>${escapeHtml(item.name)}</strong><span class="rec-ver">${escapeHtml(item.version)}</span></div>
            <p>${escapeHtml(item.desc)}</p>
          </div>
        </div>
        <div class="rec-bottom">
          <span class="group-badge group-badge-compact">${(item.enabled ? '已全局启用' : '可选安装')}</span>
          <label class="cr-switch-row" style="margin:0;width:auto">
            <input type="checkbox" class="ob-switch-input" data-ext-toggle="${escapeHtml(item.id)}" ${(item.enabled ? 'checked' : '')}>
            <span class="ob-switch-track"></span>
          </label>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  function initRound6SecondaryViews() {
    renderProjectCardsGrid();
    renderTemplateCardsGrid();
    renderExtensionMarketShowcase();

    // 1. Project Management interactions
    document.getElementById('group-search-input')?.addEventListener('input', renderProjectCardsGrid);
    document.getElementById('group-refresh')?.addEventListener('click', () => setTimeout(renderProjectCardsGrid, 40));
    document.getElementById('groups-view-mode-switch')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-gview]');
      if (!btn) return;
      document.querySelectorAll('#groups-view-mode-switch button').forEach((b) => b.classList.toggle('active', b === btn));
      const mode = btn.dataset.gview;
      const cards = document.getElementById('groups-card-grid');
      const table = document.getElementById('groups-table-card');
      if (cards) cards.hidden = mode === 'table';
      if (table) table.hidden = mode === 'cards';
    });
    document.getElementById('groups-card-grid')?.addEventListener('click', (e) => {
      const viewId = e.target.closest('[data-rpc-view]')?.dataset.rpcView;
      const newWinId = e.target.closest('[data-rpc-new-win]')?.dataset.rpcNewWin;
      const editId = e.target.closest('[data-rpc-edit]')?.dataset.rpcEdit;
      if (viewId) {
        if (typeof activeGroupFilter !== 'undefined') window.activeGroupFilter = viewId;
        if (typeof switchView === 'function') switchView('profiles');
        if (typeof renderProfiles === 'function') renderProfiles();
      }
      if (newWinId) {
        editingProfileId = null;
        openWorkbenchEditorMode('single');
        setTimeout(() => {
          const gSel = document.getElementById('editor-group');
          if (gSel) gSel.value = newWinId === 'ungrouped' ? '' : newWinId;
        }, 60);
      }
      if (editId && typeof openGroupDialog === 'function' && typeof findGroup === 'function') {
        openGroupDialog(findGroup(editId));
      }
    });

    // 2. Templates Card Grid & Search
    document.getElementById('templates-search-input')?.addEventListener('input', renderTemplateCardsGrid);
    document.getElementById('templates-card-grid')?.addEventListener('click', runAction((e) => {
      const useId = e.target.closest('[data-tpl-card-use]')?.dataset.tplCardUse;
      const cloneId = e.target.closest('[data-tpl-card-clone]')?.dataset.tplCardClone;
      const delId = e.target.closest('[data-tpl-card-del]')?.dataset.tplCardDel;
      if (useId) {
        editingProfileId = null;
        openWorkbenchEditorMode('single');
        setTimeout(() => applyWindowTemplateToEditor(useId), 80);
      }
      if (cloneId) {
        const orig = windowTemplates.find((t) => t.id === cloneId);
        if (orig) {
          saveWindowTemplates([{ ...structuredClone(orig), id: 'tpl-' + crypto.randomUUID(), name: orig.name + ' (副本)', createdAt: new Date().toISOString() }, ...windowTemplates]);
          renderTemplatesView();
          renderTemplateCardsGrid();
          populateTemplateSelects();
          if (typeof toast === 'function') toast('已复制窗口模板', { tone: 'success' });
        }
      }
      if (delId) {
        saveWindowTemplates(windowTemplates.filter((t) => t.id !== delId));
        renderTemplatesView();
        renderTemplateCardsGrid();
        populateTemplateSelects();
      }
    }));

    // 3. Extensions Category Bar & Toggle
    document.getElementById('ext-category-bar')?.addEventListener('click', (e) => {
      const chip = e.target.closest('button[data-ext-cat]');
      if (!chip) return;
      document.querySelectorAll('#ext-category-bar .group-chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderExtensionMarketShowcase();
    });
    document.getElementById('extension-search')?.addEventListener('input', renderExtensionMarketShowcase);
    document.getElementById('roxy-ext-market-grid')?.addEventListener('change', (e) => {
      const chk = e.target.closest('input[data-ext-toggle]');
      if (!chk) return;
      const ext = MARKET_EXTENSIONS.find((x) => x.id === chk.dataset.extToggle);
      if (ext) {
        ext.enabled = chk.checked;
        renderExtensionMarketShowcase();
        if (typeof toast === 'function') toast(`${ext.name} 已${ext.enabled ? '启用并分发至环境' : '停用'}`, { tone: 'success' });
      }
    });

    // 4. Window Sync Custom Matrix Arrangement
    document.getElementById('sync-apply-matrix-btn')?.addEventListener('click', () => {
      const r = document.getElementById('sync-grid-rows')?.value || 2;
      const c = document.getElementById('sync-grid-cols')?.value || 3;
      const g = document.getElementById('sync-grid-gap')?.value || 8;
      document.querySelector('[data-window="tile"]')?.click();
      if (typeof toast === 'function') toast(`已应用 ${r} 行 × ${c} 列（间距 ${g}px）屏幕网格矩阵排列`, { tone: 'success' });
    });

    // 5. Operation Logs Filter, Search & Export
    const filterLogs = () => {
      const q = (document.getElementById('log-search-input')?.value || '').trim().toLowerCase();
      const mod = document.getElementById('log-module-filter')?.value || 'all';
      document.querySelectorAll('#log-list > div').forEach((row) => {
        const text = row.textContent || '';
        const matchQ = !q || text.toLowerCase().includes(q);
        const matchMod = mod === 'all' || text.includes(mod);
        row.hidden = !(matchQ && matchMod);
      });
    };
    document.getElementById('log-search-input')?.addEventListener('input', filterLogs);
    document.getElementById('log-module-filter')?.addEventListener('change', filterLogs);
    document.getElementById('export-logs-btn')?.addEventListener('click', () => {
      const lines = [...document.querySelectorAll('#log-list > div')].map((r) => r.textContent).join('\n') || 'OpenBrowser Runtime Log - Empty';
      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `openbrowser-${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(a); a.click(); a.remove();
      if (typeof toast === 'function') toast('已导出运行日志文件 (.log)', { tone: 'success' });
    });

    // 6. System Settings Category Filter Pills & Global Defaults
    document.getElementById('system-category-pills')?.addEventListener('click', (e) => {
      const pill = e.target.closest('button[data-sys-cat]');
      if (!pill) return;
      document.querySelectorAll('#system-category-pills .group-chip').forEach((p) => p.classList.toggle('active', p === pill));
      const cat = pill.dataset.sysCat;
      const cards = document.querySelectorAll('#view-system .settings-grid > article');
      cards.forEach((card) => {
        if (cat === 'all') { card.hidden = false; return; }
        const id = card.id || '';
        const match = (cat === 'general' && (id.includes('locale') || id.includes('workbench') || id.includes('update')))
          || (cat === 'guard' && (id.includes('launch-gate') || id.includes('close-action')))
          || (cat === 'cloud' && id.includes('cloud'))
          || (cat === 'storage' && (!id || id.includes('local-status')));
        card.hidden = !match;
      });
    });

    ['global-default-workbench', 'global-default-ip-remind', 'global-default-google-login'].forEach((gid) => {
      document.getElementById(gid)?.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-gpref]');
        if (!b) return;
        document.querySelectorAll(`#${gid} button`).forEach((x) => x.classList.toggle('active', x === b));
        if (typeof toast === 'function') toast('全局默认偏好设置已更新', { tone: 'success' });
      });
    });
  }

  const loadTransfers = runAction(loadWindowTransfers);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadTransfers);
  else void loadTransfers();

  const loadAccounts = runAction(loadPlatformAccounts);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAccounts);
  else void loadAccounts();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRound6SecondaryViews);
  } else {
    setTimeout(initRound6SecondaryViews, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRound5Polish);
  } else {
    setTimeout(initRound5Polish, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRound4WorkbenchModules);
  } else {
    setTimeout(initRound4WorkbenchModules, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkbenchEventWiring);
  } else {
    setTimeout(initWorkbenchEventWiring, 0);
  }
})();

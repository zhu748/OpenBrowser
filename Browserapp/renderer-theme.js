/**
 * UI theme + color-mode system — second renderer.js split.
 *
 * Extracted verbatim from renderer.js (zero behaviour change): the theme
 * registry (UI_THEMES), light/dark/auto preference resolution,
 * applyUiTheme / applyColorMode / syncAppearanceControls, the OS-appearance
 * listener and the savedUiTheme bootstrap. renderer.js keeps the
 * applyUiTheme(savedUiTheme, false) boot call at its original top-level
 * position (it needs renderer.js's $ helper, which only initialises later in
 * that script). Classic script loaded BEFORE renderer.js; names stay
 * top-level script globals.
 */
const UI_THEME_KEY = 'openbrowser-ui-skin-v1';
const UI_COLOR_MODE_KEY = 'openbrowser-ui-color-mode-v1';
const UI_THEMES = Object.freeze({
  'modern': { nameKey: 'theme.modern.name', colorScheme: 'light', supportsColorMode: true },
});

function themeDisplayName(theme) {
  const def = UI_THEMES[theme];
  return def?.nameKey ? t(def.nameKey) : theme;
}

function systemPrefersDark() {
  try { return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches); } catch (_) { return false; }
}

// Preference is 'light' | 'dark' | 'auto'; 'auto' follows the OS appearance.
// Returns the effective mode 'light' | 'dark'. prefersDark is injectable for testing.
function resolveColorMode(pref, prefersDark) {
  if (pref === 'auto') return (prefersDark === undefined ? systemPrefersDark() : prefersDark) ? 'dark' : 'light';
  return pref === 'dark' ? 'dark' : 'light';
}

function readSavedColorPreference() {
  try {
    const saved = localStorage.getItem(UI_COLOR_MODE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved;
  } catch (_) {}
  return 'auto'; // default: follow the operating system
}

let uiColorPreference = readSavedColorPreference();
let uiColorMode = resolveColorMode(uiColorPreference);

// While the preference is 'auto', track the OS appearance and re-apply on change.
try {
  const uiAppearanceQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (uiAppearanceQuery) {
    const onSystemAppearanceChange = () => { if (uiColorPreference === 'auto') applyColorMode('auto', false); };
    if (typeof uiAppearanceQuery.addEventListener === 'function') uiAppearanceQuery.addEventListener('change', onSystemAppearanceChange);
    else if (typeof uiAppearanceQuery.addListener === 'function') uiAppearanceQuery.addListener(onSystemAppearanceChange);
  }
} catch (_) {}

function syncAppearanceControls(theme) {
  const definition = UI_THEMES[theme];
  const show = Boolean(definition?.supportsColorMode);
  const tr = (key) => (typeof t === 'function' ? t(key) : key);
  const modeLabel = uiColorPreference === 'auto'
    ? tr('theme.auto')
    : (uiColorMode === 'dark' ? tr('theme.dark') : tr('theme.light'));

  const panel = document.getElementById('theme-appearance');
  if (panel) {
    panel.hidden = !show;
    panel.classList.toggle('is-visible', show);
    panel.querySelectorAll('[data-color-mode]').forEach((button) => {
      // Highlight by the user's preference (light/dark/auto), not the resolved mode.
      const active = button.dataset.colorMode === uiColorPreference;
      button.classList.toggle('active', active);
      button.classList.toggle('on', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  const cycleBtn = document.getElementById('color-mode-cycle-btn');
  if (cycleBtn) {
    cycleBtn.hidden = !show;
    cycleBtn.dataset.colorPref = uiColorPreference;
    cycleBtn.dataset.colorMode = uiColorMode;
    cycleBtn.setAttribute('aria-label', modeLabel);
    cycleBtn.setAttribute('title', modeLabel);
    const labelEl = cycleBtn.querySelector('.color-mode-label');
    if (labelEl) labelEl.textContent = modeLabel;
    cycleBtn.querySelectorAll('[data-mode-icon]').forEach((iconEl) => {
      iconEl.hidden = iconEl.dataset.modeIcon !== uiColorPreference;
    });
  }
}

function cycleColorModePreference() {
  const order = systemPrefersDark() ? ['auto', 'light', 'dark'] : ['auto', 'dark', 'light'];
  const idx = order.indexOf(uiColorPreference);
  const next = order[(idx + 1) % order.length];
  applyColorMode(next, true);
}

function syncDocumentColorScheme(effectiveScheme) {
  const rootEl = typeof document !== 'undefined' ? document.documentElement : null;
  if (rootEl) {
    if (rootEl.style) rootEl.style.colorScheme = effectiveScheme;
    if (rootEl.dataset) rootEl.dataset.colorMode = effectiveScheme;
  }
  const meta = typeof document !== 'undefined' && typeof document.querySelector === 'function'
    ? document.querySelector('meta[name="color-scheme"]')
    : null;
  if (meta) meta.setAttribute('content', effectiveScheme === 'dark' ? 'dark light' : 'light dark');
}

function applyColorMode(pref, persist = true) {
  uiColorPreference = (pref === 'dark' || pref === 'light' || pref === 'auto') ? pref : 'auto';
  uiColorMode = resolveColorMode(uiColorPreference);
  if (persist) {
    try { localStorage.setItem(UI_COLOR_MODE_KEY, uiColorPreference); } catch (_) {}
  }
  const theme = document.documentElement?.dataset?.uiTheme || 'modern';
  const definition = UI_THEMES[theme];
  const effectiveScheme = definition?.supportsColorMode ? uiColorMode : (definition?.colorScheme || 'dark');
  syncDocumentColorScheme(effectiveScheme);

  const current = document.getElementById('theme-current');
  const tr = (key) => (typeof t === 'function' ? t(key) : key);
  if (current) {
    current.textContent = definition?.supportsColorMode
      ? `${themeDisplayName(theme)} · ${uiColorPreference === 'auto' ? tr('theme.auto') : (uiColorMode === 'dark' ? tr('theme.dark') : tr('theme.light'))}`
      : themeDisplayName(theme);
  }

  syncAppearanceControls(theme);
  try {
    window.ops?.setUiChrome?.({
      themeId: theme,
      colorMode: effectiveScheme
    });
  } catch (_) {}
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      if (typeof refreshIcons === 'function') refreshIcons();
      if (typeof renderProfiles === 'function') renderProfiles();
      if (typeof renderSessions === 'function') renderSessions();
    });
  }
}

function applyUiTheme(value, persist = true) {
  if (typeof closeSelectMenu === 'function') closeSelectMenu();
  // The refactored default UI is the only skin; stale saved selections fall back to it.
  const theme = Object.hasOwn(UI_THEMES, value) ? value : 'modern';
  const definition = UI_THEMES[theme];
  if (document.documentElement?.dataset) document.documentElement.dataset.uiTheme = theme;
  const effectiveScheme = definition?.supportsColorMode ? uiColorMode : definition.colorScheme;
  syncDocumentColorScheme(effectiveScheme);
  if (persist) { try { localStorage.setItem(UI_THEME_KEY, theme); } catch (_) {} }
  const current = document.getElementById('theme-current');
  const tr = (key) => (typeof t === 'function' ? t(key) : key);
  if (current) {
    current.textContent = definition?.supportsColorMode
      ? `${themeDisplayName(theme)} · ${uiColorPreference === 'auto' ? tr('theme.auto') : (uiColorMode === 'dark' ? tr('theme.dark') : tr('theme.light'))}`
      : themeDisplayName(theme);
  }
  syncAppearanceControls(theme);
  // Match native window chrome (title bar) to current skin + appearance
  try {
    window.ops?.setUiChrome?.({
      themeId: theme,
      colorMode: effectiveScheme,
    });
  } catch (_) {}
  // Re-apply Lucide after theme CSS (stroke / currentColor) is in effect
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      if (typeof refreshIcons === 'function') refreshIcons();
      if (typeof renderProfiles === 'function') renderProfiles();
      if (typeof renderSessions === 'function') renderSessions();
    });
  }
}

function initAppearanceEventWiring() {
  if (typeof document === 'undefined') return;
  if (typeof document.addEventListener === 'function') {
    document.addEventListener('click', (event) => {
      const cycleBtn = event.target?.closest?.('#color-mode-cycle-btn');
      if (cycleBtn) {
        cycleColorModePreference();
        return;
      }
      const modeBtn = event.target?.closest?.('#theme-appearance [data-color-mode]');
      if (modeBtn) {
        applyColorMode(modeBtn.dataset.colorMode, true);
      }
    });
  }
  syncAppearanceControls(document.documentElement?.dataset?.uiTheme || 'modern');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppearanceEventWiring, { once: true });
  } else {
    initAppearanceEventWiring();
  }
}

let savedUiTheme = 'modern';
try {
  const stored = localStorage.getItem(UI_THEME_KEY);
  savedUiTheme = Object.hasOwn(UI_THEMES, stored) ? stored : 'modern';
  if (stored !== savedUiTheme) localStorage.setItem(UI_THEME_KEY, savedUiTheme);
  // Respect a saved color-mode preference (dark/light/auto); only seed when
  // the user never picked one. The seed must match readSavedColorPreference's
  // 'auto' default: seeding 'light' made a dark-OS user's first launch follow
  // the OS (dark) and then silently locked them into light from the second
  // launch on (this write outlived the one-shot migration guard removed in
  // 995973e).
  if (!localStorage.getItem(UI_COLOR_MODE_KEY)) localStorage.setItem(UI_COLOR_MODE_KEY, 'auto');
} catch (_) {}

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
  'modern': { nameKey: 'theme.modern.name', colorScheme: 'light' },
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
  const panel = $('#theme-appearance');
  if (!panel) return;
  const definition = UI_THEMES[theme];
  const show = Boolean(definition?.supportsColorMode);
  panel.hidden = !show;
  panel.classList.toggle('is-visible', show);
  panel.querySelectorAll('[data-color-mode]').forEach((button) => {
    // Highlight by the user's preference (light/dark/auto), not the resolved mode.
    const active = button.dataset.colorMode === uiColorPreference;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function applyColorMode(pref, persist = true) {
  uiColorPreference = (pref === 'dark' || pref === 'light' || pref === 'auto') ? pref : 'auto';
  uiColorMode = resolveColorMode(uiColorPreference);
  document.documentElement.dataset.colorMode = uiColorMode;
  if (persist) {
    try { localStorage.setItem(UI_COLOR_MODE_KEY, uiColorPreference); } catch (_) {}
  }
  const theme = document.documentElement.dataset.uiTheme || 'modern';
  const definition = UI_THEMES[theme];
  const effectiveScheme = definition?.supportsColorMode ? uiColorMode : (definition?.colorScheme || 'dark');
  document.documentElement.style.colorScheme = effectiveScheme;
  document.documentElement.dataset.colorMode = effectiveScheme;

  const current = $('#theme-current');
  if (current) {
    current.textContent = definition?.supportsColorMode
      ? `${themeDisplayName(theme)} · ${uiColorPreference === 'auto' ? t('theme.auto') : (uiColorMode === 'dark' ? t('theme.dark') : t('theme.light'))}`
      : themeDisplayName(theme);
  }

  syncAppearanceControls(theme);
  try {
    window.ops?.setUiChrome?.({
      themeId: theme,
      colorMode: effectiveScheme
    });
  } catch (_) {}
  requestAnimationFrame(() => {
    refreshIcons();
    if (typeof renderProfiles === 'function') renderProfiles();
    if (typeof renderSessions === 'function') renderSessions();
  });
}

function applyUiTheme(value, persist = true) {
  closeSelectMenu();
  // The refactored default UI is the only skin; stale saved selections fall back to it.
  const theme = Object.hasOwn(UI_THEMES, value) ? value : 'modern';
  const definition = UI_THEMES[theme];
  document.documentElement.dataset.uiTheme = theme;
  const effectiveScheme = definition?.supportsColorMode ? uiColorMode : definition.colorScheme;
  document.documentElement.style.colorScheme = effectiveScheme;
  document.documentElement.dataset.colorMode = effectiveScheme;
  if (persist) { try { localStorage.setItem(UI_THEME_KEY, theme); } catch (_) {} }
  const current = $('#theme-current');
  if (current) {
    current.textContent = definition?.supportsColorMode
      ? `${themeDisplayName(theme)} · ${uiColorPreference === 'auto' ? t('theme.auto') : (uiColorMode === 'dark' ? t('theme.dark') : t('theme.light'))}`
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
  requestAnimationFrame(() => {
    refreshIcons();
    if (typeof renderProfiles === 'function') renderProfiles();
    if (typeof renderSessions === 'function') renderSessions();
  });
}

let savedUiTheme = 'modern';
try {
  const stored = localStorage.getItem(UI_THEME_KEY);
  savedUiTheme = Object.hasOwn(UI_THEMES, stored) ? stored : 'modern';
  if (stored !== savedUiTheme) localStorage.setItem(UI_THEME_KEY, savedUiTheme);
  // Respect a saved color-mode preference (dark/light/auto); only seed the
  // default 'light' when the user never picked one. The unconditional write
  // here used to reset dark-mode users back to light on every launch (it was
  // left behind when the one-shot migration guard was removed in 995973e).
  if (!localStorage.getItem(UI_COLOR_MODE_KEY)) localStorage.setItem(UI_COLOR_MODE_KEY, 'light');
} catch (_) {}

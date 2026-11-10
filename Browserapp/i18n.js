/**
 * OpenBrowser UI i18n
 * - Default: follow system language (navigator)
 * - Supported: en, zh-CN, ja, vi, fr, de, th, id
 * - Browser profile language is separate (defaults to exit-IP country)
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'openbrowser-ui-locale-v1';
  const SUPPORTED = Object.freeze([
    { code: 'system', label: 'System / 系统语言' },
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '中文（简体）' },
    { code: 'ja', label: '日本語' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'th', label: 'ไทย' },
    { code: 'id', label: 'Bahasa Indonesia' },
  ]);

  const BROWSER_LOCALES = Object.freeze([
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'zh-CN', label: '中文（简体）' },
    { value: 'zh-TW', label: '中文（繁體）' },
    { value: 'ja-JP', label: '日本語' },
    { value: 'vi-VN', label: 'Tiếng Việt' },
    { value: 'fr-FR', label: 'Français' },
    { value: 'de-DE', label: 'Deutsch' },
    { value: 'th-TH', label: 'ไทย' },
    { value: 'id-ID', label: 'Bahasa Indonesia' },
    { value: 'ko-KR', label: '한국어' },
    { value: 'es-ES', label: 'Español' },
    { value: 'pt-BR', label: 'Português (BR)' },
    { value: 'ru-RU', label: 'Русский' },
    { value: 'ar-SA', label: 'العربية' },
  ]);

  // ---------------------------------------------------------------------------
  // Locale data — externalised to automation/data/locale/*.json (single source
  // of truth). Two load paths deliver the same bytes:
  //   * Browser: index.html loads automation/data/locale/i18n-data.js BEFORE
  //     this file; that generated script assigns global.__OB_I18N_LOCALE_DATA__
  //     (regenerate with: node scripts/build-i18n-data.js). The renderer is
  //     sandboxed (no require/fs), so the catalogs must arrive as a script.
  //   * Node (selftests / tooling): require() the JSON catalogs directly.
  // Data is read once at module init, exactly like the former inline literals,
  // so every downstream semantic is unchanged: the missing-key fallback chain
  // in t(), {param} interpolation, frozen catalogs, the zh→key reverse index
  // and the translateChineseUiText memo all consume these objects as before.
  // ---------------------------------------------------------------------------
  function loadLocaleData() {
    const injected = global.__OB_I18N_LOCALE_DATA__;
    if (injected && typeof injected === 'object') return injected;
    if (typeof require === 'function') {
      return {
        catalogs: {
          'zh-CN': require('./automation/data/locale/zh-CN.json'),
          en: require('./automation/data/locale/en.json'),
          ja: require('./automation/data/locale/ja.json'),
          vi: require('./automation/data/locale/vi.json'),
          fr: require('./automation/data/locale/fr.json'),
          de: require('./automation/data/locale/de.json'),
          th: require('./automation/data/locale/th.json'),
          id: require('./automation/data/locale/id.json'),
        },
        uiZhEn: require('./automation/data/locale/ui-zh-en.json'),
        runtimeZhEn: require('./automation/data/locale/runtime-zh-en.json'),
      };
    }
    return { catalogs: {}, uiZhEn: {}, runtimeZhEn: {} };
  }

  const LOCALE_DATA = loadLocaleData();
  // Base catalog is Chinese (current shipping UI). Other locales override; the
  // non-en catalogs were materialised from `{ ...en, <overrides> }` at
  // extraction time, so every JSON file carries a complete catalog and t()'s
  // en fallback chain resolves exactly the same values as before.
  const zhCN = LOCALE_DATA.catalogs['zh-CN'];
  const en = LOCALE_DATA.catalogs.en;
  const ja = LOCALE_DATA.catalogs.ja;
  const vi = LOCALE_DATA.catalogs.vi;
  const fr = LOCALE_DATA.catalogs.fr;
  const de = LOCALE_DATA.catalogs.de;
  const th = LOCALE_DATA.catalogs.th;
  const id = LOCALE_DATA.catalogs.id;

  const CATALOGS = Object.freeze({
    'zh-CN': zhCN,
    en,
    ja,
    vi,
    fr,
    de,
    th,
    id,
  });

  // Dynamic UI code historically passed Chinese literals through `tx(...)` rather
  // than a catalog key. Reuse an exact zh-CN catalog value when one exists so
  // Japanese/French/etc. get their own translation before falling back to English.
  const ZH_TEXT_TO_KEY = new Map();
  for (const [key, value] of Object.entries(zhCN)) {
    if (typeof value === 'string' && value && !ZH_TEXT_TO_KEY.has(value)) {
      ZH_TEXT_TO_KEY.set(value, key);
    }
  }

  const listeners = new Set();
  let preference = 'system'; // stored preference
  let resolved = 'zh-CN';
  // Auto-translate pass bookkeeping: applyDom is on the hot refresh path
  // (afterUiRender after every table render), and its body-wide `body *`
  // scan re-walks elements whose text was already snapshot+translated.
  // Marks are scoped to the current locale: switching the catalog bumps
  // the epoch, so every WeakSet from the previous locale stops matching
  // and the full pass runs again (fresh snapshots, fresh translations).
  let autoPassEpoch = 0;
  const autoPassedByEpoch = new Map(); // epoch -> WeakSet<Element>
  function markAutoPassed(el) {
    let set = autoPassedByEpoch.get(autoPassEpoch);
    if (!set) { set = new WeakSet(); autoPassedByEpoch.set(autoPassEpoch, set); }
    set.add(el);
  }
  function wasAutoPassed(el) {
    const set = autoPassedByEpoch.get(autoPassEpoch);
    return set ? set.has(el) : false;
  }

  function normalizeTag(tag) {
    const raw = String(tag || '').trim().replace(/_/g, '-');
    if (!raw) return 'en';
    const lower = raw.toLowerCase();
    if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) return 'zh-CN';
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-hant')) return 'zh-CN';
    const primary = lower.split('-')[0];
    if (primary === 'en') return 'en';
    if (primary === 'ja') return 'ja';
    if (primary === 'vi') return 'vi';
    if (primary === 'fr') return 'fr';
    if (primary === 'de') return 'de';
    if (primary === 'th') return 'th';
    if (primary === 'id') return 'id';
    return 'en';
  }

  function detectSystemLocale() {
    try {
      const list = navigator.languages?.length ? [...navigator.languages] : [navigator.language];
      for (const item of list) {
        const code = normalizeTag(item);
        if (CATALOGS[code]) return code;
      }
    } catch (_) {}
    return 'en';
  }

  function readPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved || saved === 'system') return 'system';
      if (CATALOGS[saved] || saved === 'zh-CN') return saved;
      const norm = normalizeTag(saved);
      if (CATALOGS[norm]) return norm;
    } catch (_) {}
    return 'system';
  }

  function resolve(pref) {
    if (!pref || pref === 'system') return detectSystemLocale();
    return CATALOGS[pref] ? pref : detectSystemLocale();
  }

  function format(template, params) {
    if (!params) return template;
    return String(template).replace(/\{(\w+)\}/g, (_, key) => (
      params[key] == null ? `{${key}}` : String(params[key])
    ));
  }

  function t(key, params) {
    const catalog = CATALOGS[resolved] || en;
    const text = catalog[key] ?? en[key] ?? (resolved === 'zh-CN' ? zhCN[key] : undefined) ?? key;
    return format(text, params);
  }

  // Chinese UI chrome → English when locale is not zh-CN (full-page pass).
  const UI_ZH_EN = Object.freeze(LOCALE_DATA.uiZhEn);
  // Runtime feedback, confirmations, logs, and audit cards predate data-i18n.
  // Keep their fallback table separate from static page chrome so audits can cover
  // every user-visible literal without obscuring the primary declarative catalog.
  const RUNTIME_ZH_EN = Object.freeze(LOCALE_DATA.runtimeZhEn);
  const UI_ZH_FALLBACKS = Object.freeze({ ...UI_ZH_EN, ...RUNTIME_ZH_EN });
  const UI_ZH_KEYS = Object.keys(UI_ZH_FALLBACKS).sort((a, b) => b.length - a.length);

  const zhTranslateMemo = new Map();
  function translateChineseUiText(input) {
    let s = String(input ?? '');
    if (!s || resolved === 'zh-CN') return s;
    // normalize whitespace for HTML text nodes
    const compact = s.replace(/\s+/g, ' ').trim();
    const key = ZH_TEXT_TO_KEY.get(s) || (compact !== s ? ZH_TEXT_TO_KEY.get(compact) : null);
    if (key) {
      const localized = (CATALOGS[resolved] || en)[key] ?? en[key];
      if (localized != null) return format(localized);
    }
    if (Object.prototype.hasOwnProperty.call(UI_ZH_FALLBACKS, s)) return UI_ZH_FALLBACKS[s];
    if (compact !== s && Object.prototype.hasOwnProperty.call(UI_ZH_FALLBACKS, compact)) return UI_ZH_FALLBACKS[compact];
    // Fast exit for text without CJK characters: the 1240-key scan below is
    // O(keys × length) and runs for every text node on every table re-render
    // in non-Chinese locales.
    if (!/[\u4e00-\u9fff]/.test(s)) return s;
    // Memo keyed by locale + input: unknown Chinese strings (group names,
    // notes) pay the ~1240-key scan once per distinct value instead of once
    // per rendered row.
    const memoKey = (typeof resolved === 'string' ? resolved : '') + '\u0000' + s;
    const memoHit = zhTranslateMemo.get(memoKey);
    if (memoHit !== undefined) return memoHit;
    let out = s;
    for (const zh of UI_ZH_KEYS) {
      if (out.indexOf(zh) === -1) continue;
      out = out.split(zh).join(UI_ZH_FALLBACKS[zh]);
    }
    out = out.replace(/(\d+)\s*条\s*\/\s*页/g, '$1/page');
    out = out.replace(/总数[：:]\s*/g, 'Total: ');
    out = out.replace(/共\s*(\d+)\s*个/g, '$1 items');
    out = out.replace(/(\d+)\s*步/g, '$1 steps');
    out = out.replace(/环境\s*(\d+)/g, 'Profile $1');
    if (zhTranslateMemo.size < 512) zhTranslateMemo.set(memoKey, out);
    return out;
  }

  function applyNode(el) {
    if (!(el instanceof Element)) return;
    const key = el.getAttribute('data-i18n');
    if (key) {
      const mode = el.getAttribute('data-i18n-mode') || 'text';
      const value = t(key);
      if (mode === 'html') el.innerHTML = value;
      else el.textContent = value;
    }
    const ph = el.getAttribute('data-i18n-placeholder');
    if (ph) el.setAttribute('placeholder', t(ph));
    const title = el.getAttribute('data-i18n-title');
    if (title) el.setAttribute('title', t(title));
    const aria = el.getAttribute('data-i18n-aria');
    if (aria) el.setAttribute('aria-label', t(aria));
  }

  function shouldSkipAuto(el) {
    if (!(el instanceof Element)) return true;
    if (el.closest('script, style, code, pre, [contenteditable="true"]')) return true;
    // Dynamically managed text (switchView writes the page title every navigation):
    // neither the catalog pass nor the auto-translate snapshot may own it.
    if (el.closest('[data-i18n-dynamic]')) return true;
    // Keep third-party/template free text (titles/descriptions) intact
    if (el.closest('.rpa-store-card h4, .rpa-store-card p, #rpa-store-grid h4, #rpa-store-grid p')) return true;
    if (el.id === 'profile-storage-path' || el.id === 'kernel-path' || el.id === 'kernel-version' || el.id === 'kernel-active-path' || el.id === 'kernel-channel' || el.id === 'kernel-launch-mode') return true;
    if (el.tagName === 'CODE' || el.tagName === 'PRE') return true;
    return false;
  }

  function sourceForCurrentText(current, previous) {
    const raw = String(current || '');
    const old = String(previous || '');
    if (old) {
      // Partial translations keep CJK characters, so the CJK fast path below would
      // re-record the translated text as the "source" and poison the snapshot that
      // restoreChineseElement relies on. Only genuinely new content may replace it.
      if (raw === translateChineseUiText(old)) return old;
      if (/[\u4e00-\u9fff]/.test(raw)) return raw;
      return old;
    }
    return /[\u4e00-\u9fff]/.test(raw) ? raw : '';
  }

  function autoTranslateElement(el) {
    if (shouldSkipAuto(el) || resolved === 'zh-CN') return;
    for (const attr of ['placeholder', 'title', 'aria-label']) {
      if (!el.hasAttribute(attr)) continue;
      // Catalog-keyed attributes are fully governed by applyNode; snapshotting them here
      // would poison data-i18n-src-* with a translated value and restore that wrong
      // locale string on the next switch back to Chinese.
      if (el.getAttribute('data-i18n-' + (attr === 'aria-label' ? 'aria' : attr))) continue;
      const rawKey = 'data-i18n-src-' + attr;
      const current = el.getAttribute(attr) || '';
      const src = sourceForCurrentText(current, el.getAttribute(rawKey) || '');
      if (src) {
        el.setAttribute(rawKey, src);
        el.setAttribute(attr, translateChineseUiText(src));
      }
    }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      for (const attr of ['placeholder', 'title', 'aria-label']) {
        if (!el.hasAttribute(attr)) continue;
        const rawKey = 'data-i18n-src-' + attr;
        if (!el.hasAttribute(rawKey)) el.setAttribute(rawKey, el.getAttribute(attr) || '');
        const src = el.getAttribute(rawKey) || '';
        if (src) el.setAttribute(attr, translateChineseUiText(src));
      }
      return;
    }
    if (el.tagName === 'OPTION') {
      const src = sourceForCurrentText(el.textContent || '', el.dataset.i18nSrcText || '');
      if (src) el.dataset.i18nSrcText = src;
      el.textContent = translateChineseUiText(el.dataset.i18nSrcText || el.textContent || '');
      return;
    }
    if (el.childElementCount === 0) {
      const raw = el.textContent;
      if (!raw) return;
      const src = sourceForCurrentText(raw, el.dataset.i18nSrcText || '');
      if (!src || !/[\u4e00-\u9fff]/.test(src)) return;
      el.dataset.i18nSrcText = src;
      el.textContent = translateChineseUiText(src);
      return;
    }
    for (const node of [...el.childNodes]) {
      if (node.nodeType !== 3) continue;
      const raw = node.nodeValue;
      if (!raw) continue;
      const src = sourceForCurrentText(raw, node._i18nSrc || '');
      if (!src || !/[\u4e00-\u9fff]/.test(src)) continue;
      node._i18nSrc = src;
      node.nodeValue = translateChineseUiText(src);
    }
  }

  function restoreChineseElement(el) {
    if (!(el instanceof Element)) return;
    for (const attr of ['placeholder', 'title', 'aria-label']) {
      // Keyed attributes follow the catalog (applyNode); restoring from the auto-translate
      // snapshot would overwrite the catalog answer with a stale locale string.
      if (el.getAttribute('data-i18n-' + (attr === 'aria-label' ? 'aria' : attr))) continue;
      const rawKey = 'data-i18n-src-' + attr;
      if (el.hasAttribute(rawKey)) el.setAttribute(attr, el.getAttribute(rawKey));
    }
    if (el.dataset.i18nSrcText != null) el.textContent = el.dataset.i18nSrcText;
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 3 && node._i18nSrc != null) node.nodeValue = node._i18nSrc;
    }
  }

  function applyDom(root) {
    const doc = typeof document !== 'undefined' ? document : null;
    const scope = root || doc;
    if (!scope?.querySelectorAll) return;
    scope.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria]').forEach(applyNode);
    if (scope === doc) {
      // Full-document pass (locale switch, refreshLocaleChrome): re-marked from
      // scratch, so a stale element must not stay skipped.
      scope.querySelectorAll('body *').forEach((el) => {
        if (resolved === 'zh-CN') restoreChineseElement(el);
        else autoTranslateElement(el);
        markAutoPassed(el);
      });
    } else {
      // Scoped render pass: skip elements already processed for this locale.
      // Dynamically added/rebuilt elements carry no mark and are handled as before.
      scope.querySelectorAll('body *').forEach((el) => {
        if (wasAutoPassed(el)) return;
        if (resolved === 'zh-CN') restoreChineseElement(el);
        else autoTranslateElement(el);
        markAutoPassed(el);
      });
    }
    if (doc?.documentElement) {
      doc.documentElement.lang = resolved === 'zh-CN' ? 'zh-CN' : resolved;
    }
  }

  function setPreference(pref, { persist = true, silent = false } = {}) {
    const next = !pref || pref === 'system' ? 'system' : (CATALOGS[pref] ? pref : normalizeTag(pref));
    preference = next === 'system' || CATALOGS[next] ? next : 'system';
    const previousResolved = resolved;
    resolved = resolve(preference);
    // Locale change invalidates every auto-pass mark (snapshots must be
    // re-taken and text re-translated for the new catalog).
    if (resolved !== previousResolved) {
      autoPassEpoch += 1;
      if (autoPassedByEpoch.size > 3) autoPassedByEpoch.delete(autoPassEpoch - 3);
    }
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, preference); } catch (_) {}
    }
    applyDom();
    if (!silent) listeners.forEach((fn) => { try { fn(resolved, preference); } catch (_) {} });
    return resolved;
  }

  function onChange(fn) {
    if (typeof fn === 'function') listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function fillLocaleSelect(select) {
    if (!(select instanceof HTMLSelectElement)) return;
    const current = preference;
    select.replaceChildren();
    for (const item of SUPPORTED) {
      const opt = document.createElement('option');
      opt.value = item.code;
      opt.textContent = item.code === 'system' ? t('system.locale.system') : item.label;
      select.append(opt);
    }
    select.value = current;
  }

  function fillBrowserLanguageSelect(select, { includeModes = false } = {}) {
    if (!(select instanceof HTMLSelectElement)) return;
    const prev = select.value;
    select.replaceChildren();
    if (includeModes) {
      const ip = document.createElement('option');
      ip.value = 'ip';
      ip.textContent = t('editor.lang.ip');
      const sys = document.createElement('option');
      sys.value = 'system';
      sys.textContent = t('editor.lang.system');
      select.append(ip, sys);
    }
    for (const item of BROWSER_LOCALES) {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      select.append(opt);
    }
    if ([...select.options].some((o) => o.value === prev)) select.value = prev;
    else if (includeModes) select.value = 'ip';
  }

  // boot
  preference = readPreference();
  resolved = resolve(preference);

  const api = {
    STORAGE_KEY,
    SUPPORTED,
    BROWSER_LOCALES,
    t,
    detectSystemLocale,
    getPreference: () => preference,
    getLocale: () => resolved,
    setPreference,
    setLocale: setPreference,
    applyDom,
    onChange,
    fillLocaleSelect,
    fillBrowserLanguageSelect,
    normalizeTag,
    translateChineseUiText,
  };

  global.OpenBrowserI18n = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

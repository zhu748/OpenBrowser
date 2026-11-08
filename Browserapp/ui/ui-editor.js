// Profile-editor domain module (classic script, no build step).
// Loaded before renderer.js, after ui/ui-proxy.js; declares the editor-domain
// functions renderer.js and its event wiring call as shared script globals.
// Keep this file declarations-only apart from the export block at the very
// end (same load-order contract as ui/ui-proxy.js).
//
// Functions (verbatim from renderer.js):
//   normalizeProfileSettings — profile schema defaults/sanitizing for the editor
//   editorDraft / renderEditorSummary — draft collection and summary rendering
//   openProfileEditor / refreshUaMetaPreview — editor dialog + UA meta preview
//   openCreateProfileDialog / setupPlatformPresets — create flow + platform presets
function normalizeProfileSettings(profile) {
  const value = profile && typeof profile === 'object' ? profile : {};
  const privacy = value.privacy && typeof value.privacy === 'object' ? value.privacy : {};
  const advanced = value.advanced && typeof value.advanced === 'object' ? value.advanced : {};
  const proxyMeta = value.proxyMeta && typeof value.proxyMeta === 'object' ? value.proxyMeta : {};
  const platform = value.platform && typeof value.platform === 'object' ? value.platform : {};
  const number = positiveProfileNumber(value.number);
  const rawProxy = String(value.proxy || '').trim();
  const legacyDemoProxy = value.networkMode == null && value.id === 'env-004' && rawProxy === '127.0.0.1:7890';
  const networkMode = value.networkMode === 'proxy' ? 'proxy'
    : value.networkMode === 'direct' || legacyDemoProxy || !rawProxy || /^(direct|offline|none)$/i.test(rawProxy) ? 'direct' : 'proxy';
  const profileAssociationKeys = ['proxyId', 'proxy_id', 'proxyLibraryId', 'proxy_library_id'];
  const metaAssociationKeys = ['proxyId', 'proxy_id', 'proxyLibraryId', 'proxy_library_id'];
  const profileAssociation = profileAssociationKeys.find((key) => Object.prototype.hasOwnProperty.call(value, key));
  const metaAssociation = metaAssociationKeys.find((key) => Object.prototype.hasOwnProperty.call(proxyMeta, key));
  const proxyIdValue = networkMode === 'direct'
    ? null
    : (profileAssociation ? value[profileAssociation] : (metaAssociation ? proxyMeta[metaAssociation] : undefined));
  const proxyId = proxyIdValue == null || String(proxyIdValue).trim() === '' ? null : String(proxyIdValue).trim();
  return {
    ...value,
    number,
    name: number ? String(number) : String(value.name || ''),
    title: String(value.title || value.displayName || ''),
    browser: 'Google Chrome',
    os: String(value.os || 'Windows'),
    language: String(value.language || 'en-US'),
    networkMode,
    proxy: networkMode === 'direct' ? 'Direct' : rawProxy,
    proxyId,
    userAgent: String(value.userAgent || ''),
    cookies: String(value.cookies || ''),
    note: String(value.note || ''),
    tag: String(value.tag || ''),
    groupId: value.groupId == null || value.groupId === undefined ? UNGROUPED_ID : String(value.groupId || ''),
    width: Number(value.width) >= 640 ? Number(value.width) : 1280,
    height: Number(value.height) >= 480 ? Number(value.height) : 820,
    platform: {
      type: String(platform.type || 'other'),
      startUrl: String(platform.startUrl || value.startUrl || ''),
      username: String(platform.username || ''),
      password: String(platform.password || ''),
      totpSecret: String(platform.totpSecret || platform.otp || ''),
    },
    proxyMeta: {
      proxyId,
      ipChannel: String(proxyMeta.ipChannel ?? proxyMeta.ip_channel ?? 'ip-api'),
      refreshUrl: String(proxyMeta.refreshUrl ?? proxyMeta.refresh_url ?? ''),
      checkOnStart: Boolean(proxyMeta.checkOnStart),
      refreshOnStart: Boolean(proxyMeta.refreshOnStart),
      systemProxy: String(proxyMeta.systemProxy || 'global'),
      directBypass: Boolean(proxyMeta.directBypass),
      bypassList: String(proxyMeta.bypassList || ''),
      apiExtractUrl: String(proxyMeta.apiExtractUrl || ''),
      backupProxies: Array.isArray(proxyMeta.backupProxies)
        ? proxyMeta.backupProxies.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
        : String(proxyMeta.backupProxies || '').split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
      fillFingerprint: proxyMeta.fillFingerprint !== false,
      requireReady: proxyMeta.requireReady !== false,
      notReadyPolicy: 'block',
      allowDirectFallback: false,
      tlsProfile: ['auto', 'chrome', 'chrome_legacy', 'node', 'off'].includes(String(proxyMeta.tlsProfile || ''))
        ? String(proxyMeta.tlsProfile)
        : 'auto',
      tlsChromeMajor: (() => {
        const n = Number(proxyMeta.tlsChromeMajor);
        return Number.isFinite(n) && n >= 80 && n <= 200 ? Math.floor(n) : null;
      })(),
    },
    privacy: {
      webrtc: String(privacy.webrtc || 'proxy'),
      timezoneMode: String(privacy.timezoneMode || 'ip'),
      timezone: String(privacy.timezone || ''),
      geoMode: String(privacy.geoMode || 'ip'),
      latitude: privacy.latitude ?? '',
      longitude: privacy.longitude ?? '',
      accuracy: Number(privacy.accuracy) || 100,
      uiLanguage: String(privacy.uiLanguage || 'profile'),
      languageMode: String(privacy.languageMode || (privacy.langFromIp !== false ? 'ip' : (privacy.uiLanguage && privacy.uiLanguage !== 'profile' ? privacy.uiLanguage : 'ip'))),
      langFromIp: privacy.langFromIp !== false,
      timezoneFromIp: privacy.timezoneFromIp !== false,
      geoFromIp: privacy.geoFromIp !== false,
      fontMode: String(privacy.fontMode || 'default'),
      fontSize: Number(privacy.fontSize) || 16,
      // Absent means off: an existing profile must never have its hardware identity
      // re-rolled underneath it. New profiles opt in at creation time instead.
      deviceProfile: String(privacy.deviceProfile || 'default'),
      canvas: String(privacy.canvas || 'noise'),
      webgl: String(privacy.webgl || 'noise'),
      webglMeta: String(privacy.webglMeta || 'noise'),
      webgpu: String(privacy.webgpu || 'webgl'),
      audio: String(privacy.audio || 'noise'),
      media: String(privacy.media || 'noise'),
      mediaDevices: String(privacy.mediaDevices || ''),
      mediaLabels: privacy.mediaLabels && typeof privacy.mediaLabels === 'object' ? {
        audioinput: String(privacy.mediaLabels.audioinput || privacy.mediaLabels.input || '').slice(0, 200),
        videoinput: String(privacy.mediaLabels.videoinput || privacy.mediaLabels.video || '').slice(0, 200),
        audiooutput: String(privacy.mediaLabels.audiooutput || privacy.mediaLabels.output || '').slice(0, 200),
      } : { audioinput: '', videoinput: '', audiooutput: '' },
      battery: String(privacy.battery || 'noise'),
      bluetooth: ['real', 'blocked'].includes(String(privacy.bluetooth || '')) ? String(privacy.bluetooth) : 'real',
      clientRects: String(privacy.clientRects || 'noise'),
      speech: String(privacy.speech || 'noise'),
      deviceNameMode: String(privacy.deviceNameMode || 'noise'),
      deviceName: String(privacy.deviceName || ''),
      dnt: Boolean(privacy.dnt),
      dntMode: String(privacy.dntMode || (privacy.dnt ? 'on' : 'default')),
      portScanProtect: Boolean(privacy.portScanProtect),
      portScanAllow: String(privacy.portScanAllow || ''),
      cfOptimize: privacy.cfOptimize !== false,
      refreshFingerprintOnStart: Boolean(privacy.refreshFingerprintOnStart),
      stabilityMode: ['off', 'auto', 'force'].includes(String(privacy.stabilityMode || ''))
        ? String(privacy.stabilityMode)
        : 'auto',
      stabilityHamming: Math.min(64, Math.max(1, Number(privacy.stabilityHamming) || 12)),
      stabilityMaxWidth: Math.min(4096, Math.max(64, Number(privacy.stabilityMaxWidth) || 600)),
      stabilityMaxHeight: Math.min(4096, Math.max(64, Number(privacy.stabilityMaxHeight) || 600)),
      stabilitySquare: Math.min(64, Math.max(2, Number(privacy.stabilitySquare) || 8)),
      stabilityHosts: Array.isArray(privacy.stabilityHosts)
        ? privacy.stabilityHosts.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 800)
        : String(privacy.stabilityHosts || '').split(/[\r\n,;\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 800),
      stabilitySkipHosts: Array.isArray(privacy.stabilitySkipHosts)
        ? privacy.stabilitySkipHosts.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 200)
        : String(privacy.stabilitySkipHosts || '').split(/[\r\n,;\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 200),
      // Preserve 0 (= 真实). Empty = 自动. Never use `||` which turns 0 into 自动.
      cores: (() => {
        const raw = privacy.cores ?? privacy.fingerprint?.cores;
        if (raw === '' || raw === null || raw === undefined) return '';
        const n = Number(raw);
        return Number.isFinite(n) ? n : '';
      })(),
      memory: (() => {
        const raw = privacy.memory ?? privacy.fingerprint?.memory;
        if (raw === '' || raw === null || raw === undefined) return '';
        const n = Number(raw);
        return Number.isFinite(n) ? n : '';
      })(),
      fingerprint: privacy.fingerprint && typeof privacy.fingerprint === 'object' ? {
        ...privacy.fingerprint,
        cores: (() => {
          const raw = privacy.cores ?? privacy.fingerprint?.cores;
          if (raw === '' || raw === null || raw === undefined) return privacy.fingerprint.cores ?? null;
          const n = Number(raw);
          return Number.isFinite(n) ? n : (privacy.fingerprint.cores ?? null);
        })(),
        memory: (() => {
          const raw = privacy.memory ?? privacy.fingerprint?.memory;
          if (raw === '' || raw === null || raw === undefined) return privacy.fingerprint.memory ?? null;
          const n = Number(raw);
          return Number.isFinite(n) ? n : (privacy.fingerprint.memory ?? null);
        })(),
      } : {},
    },
    advanced: {
      saveCookies: advanced.saveCookies !== false,
      savePasswords: Boolean(advanced.savePasswords),
      saveBookmarks: advanced.saveBookmarks !== false,
      saveLocalStorage: advanced.saveLocalStorage !== false,
      saveIndexedDB: advanced.saveIndexedDB !== false,
      saveHistory: advanced.saveHistory !== false,
      allowSignin: Boolean(advanced.allowSignin),
      restoreSession: Boolean(advanced.restoreSession) || advanced.tabMode === 'restore',
      blockVideo: Boolean(advanced.blockVideo),
      blockImages: Boolean(advanced.blockImages),
      clearCacheOnStart: Boolean(advanced.clearCacheOnStart),
      cloudBackup: Boolean(advanced.cloudBackup),
      syncCookiesOnClose: advanced.syncCookiesOnClose !== false,
      syncIndexedDB: Boolean(advanced.syncIndexedDB),
      syncLocalStorage: Boolean(advanced.syncLocalStorage),
      syncPasswords: Boolean(advanced.syncPasswords),
      syncExtensionData: Boolean(advanced.syncExtensionData),
      multiOpen: Boolean(advanced.multiOpen),
      tabMode: String(advanced.tabMode || (advanced.restoreSession ? 'restore' : 'fixed')),
      startUrls: String(advanced.startUrls || ''),
      blockUrls: String(advanced.blockUrls || ''),
      blockSound: Boolean(advanced.blockSound),
      blockPasswordPrompt: Boolean(advanced.blockPasswordPrompt),
      blockRestoreDialog: advanced.blockRestoreDialog !== false,
      blockNotifications: advanced.blockNotifications !== false,
      blockPopups: Boolean(advanced.blockPopups),
      jsHeapMax: Boolean(advanced.jsHeapMax),
      showInfoPage: advanced.showInfoPage !== false,
      showPasswordOnInfo: Boolean(advanced.showPasswordOnInfo),
      loadGlobalBookmarks: Boolean(advanced.loadGlobalBookmarks),
      showBookmarkBar: Boolean(advanced.showBookmarkBar),
      uploadBookmarks: Boolean(advanced.uploadBookmarks),
    },
  };
}

function editorDraft(strict = true) {
  const current = ui.profiles.find((item) => item.id === editingProfileId) || {};
  let resolution = { width: Number($('#editor-width')?.value) || current.width || 1280, height: Number($('#editor-height')?.value) || current.height || 820 };
  if (strict) resolution = editorResolution();
  else if ($('#editor-resolution')?.value && $('#editor-resolution').value !== 'custom') {
    const values = $('#editor-resolution').value.split('x').map(Number);
    resolution = { width: values[0], height: values[1] };
  }
  const tabMode = document.querySelector('input[name="editor-tab-mode"]:checked')?.value || 'fixed';
  const dntMode = $('#editor-dnt-mode')?.value || 'default';
  const privacy = {
    webrtc: $('#editor-webrtc')?.value || 'proxy',
    timezoneMode: $('#editor-timezone-mode')?.value || 'ip',
    timezone: ($('#editor-timezone')?.value || '').trim(),
    geoMode: $('#editor-geo-mode')?.value || 'ip',
    latitude: $('#editor-latitude')?.value,
    longitude: $('#editor-longitude')?.value,
    accuracy: Number($('#editor-accuracy')?.value) || 100,
    languageMode: $('#editor-language-mode')?.value || 'ip',
    uiLanguage: (() => {
      const mode = $('#editor-language-mode')?.value || 'ip';
      if (mode === 'ip' || mode === 'system') return 'profile';
      return mode;
    })(),
    langFromIp: ($('#editor-language-mode')?.value || 'ip') === 'ip',
    timezoneFromIp: true,
    geoFromIp: $('#editor-geo-from-ip')?.checked !== false,
    fontMode: $('#editor-font-mode')?.value || 'default',
    fontSize: Number($('#editor-font-size')?.value) || 16,
    deviceProfile: $('#editor-device-profile')?.value || 'default',
    canvas: $('#editor-canvas')?.value || 'noise',
    webgl: $('#editor-webgl')?.value || 'noise',
    webglMeta: $('#editor-webgl-meta')?.value || 'noise',
    webgpu: $('#editor-webgpu')?.value || 'webgl',
    audio: $('#editor-audio')?.value || 'noise',
    media: $('#editor-media')?.value || 'noise',
    mediaDevices: ($('#editor-media-devices')?.value || '').trim(),
    mediaLabels: {
      audioinput: ($('#editor-media-label-audio')?.value || '').trim().slice(0, 200),
      videoinput: ($('#editor-media-label-video')?.value || '').trim().slice(0, 200),
      audiooutput: ($('#editor-media-label-output')?.value || '').trim().slice(0, 200),
    },
    battery: $('#editor-battery')?.value || 'noise',
    bluetooth: $('#editor-bluetooth')?.value || 'real',
    clientRects: $('#editor-client-rects')?.value || 'noise',
    speech: $('#editor-speech')?.value || 'noise',
    deviceNameMode: $('#editor-device-name-mode')?.value || 'noise',
    deviceName: ($('#editor-device-name')?.value || '').trim(),
    dnt: dntMode === 'on' || ($('#editor-dnt')?.checked === true),
    dntMode,
    portScanProtect: Boolean($('#editor-port-scan')?.checked),
    portScanAllow: ($('#editor-port-scan-allow')?.value || '').trim(),
    cfOptimize: $('#editor-cf-optimize')?.checked !== false,
    refreshFingerprintOnStart: Boolean($('#editor-refresh-fingerprint')?.checked),
    stabilityMode: $('#editor-stability-mode')?.value || 'auto',
    stabilityHamming: Number($('#editor-stability-hamming')?.value) || 12,
    stabilityMaxWidth: Number($('#editor-stability-max-width')?.value) || 600,
    stabilityMaxHeight: Number($('#editor-stability-max-height')?.value) || 600,
    stabilitySquare: Number($('#editor-stability-square')?.value) || 8,
    stabilityHosts: ($('#editor-stability-hosts')?.value || '').split(/[\r\n,;\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 800),
    stabilitySkipHosts: ($('#editor-stability-skip-hosts')?.value || '').split(/[\r\n,;\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 200),
    cores: (() => {
      const v = $('#editor-cores')?.value;
      if (v === '' || v == null) return '';
      const n = Number(v);
      return Number.isFinite(n) ? n : '';
    })(),
    memory: (() => {
      const v = $('#editor-memory')?.value;
      if (v === '' || v == null) return '';
      const n = Number(v);
      return Number.isFinite(n) ? n : '';
    })(),
    fingerprint: {
      ...(current.privacy?.fingerprint || {}),
      cores: (() => {
        const v = $('#editor-cores')?.value;
        if (v === '' || v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      })(),
      memory: (() => {
        const v = $('#editor-memory')?.value;
        if (v === '' || v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      })(),
    },
  };
  if (strict && privacy.timezoneMode === 'custom' && privacy.timezone) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: privacy.timezone }).format(); }
    catch (_) { throw new Error(tx('自定义时区无效，请使用 Asia/Shanghai 这类 IANA 时区名称')); }
  }
  if (strict && privacy.geoMode === 'custom') {
    const latitude = Number(privacy.latitude); const longitude = Number(privacy.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(tx('自定义地理位置经纬度无效'));
    }
    privacy.latitude = latitude; privacy.longitude = longitude;
  }
  const selectedNetwork = editorSelectedNetwork();
  const selectedProxyValue = String($('#editor-proxy-library')?.value || '').trim();
  const selectedProxyId = selectedNetwork === 'direct' ? null : (proxyLibraryItem(selectedProxyValue)?.id || null);
  let proxy = serializeEditorProxy(strict);
  if (selectedNetwork !== 'direct' && isDirectProxy(proxy)) {
    if (strict && !String($('#editor-api-extract-url')?.value || '').trim()) {
      throw new Error(tx('请填写代理地址，或明确选择本地直连'));
    }
    proxy = '';
  }
  // Plain HTTP proxies carry Basic credentials on the wire in cleartext — that is
  // the protocol, not a bug we can fix client-side, but the user deserves to know
  // before their residential proxy password rides an unencrypted hop.
  if (typeof toast === 'function' && /^http:\/\//i.test(String(proxy)) && /:[^:@/]+@/.test(String(proxy))) {
    try { toast(tx('注意：HTTP 代理的账号密码将以明文经由代理链路传输，建议改用 HTTPS 或 SOCKS5 代理'), { tone: 'warning' }); } catch (_) {}
  }
  const currentProxyParsed = parseEditorProxy(current.proxy);
  const nextProxyParsed = parseEditorProxy(proxy);
  const sameEndpoint = currentProxyParsed.mode === 'custom'
    && nextProxyParsed.mode === 'custom'
    && currentProxyParsed.type === nextProxyParsed.type
    && currentProxyParsed.host === nextProxyParsed.host
    && String(currentProxyParsed.port || '') === String(nextProxyParsed.port || '');
  if (!window.__editorProxyAuthTouched && !nextProxyParsed.username && !nextProxyParsed.password) {
    if (sameEndpoint && (currentProxyParsed.username || currentProxyParsed.password)) {
      proxy = current.proxy;
    } else {
      const eng = engineProfiles.find((item) => item.id === editingProfileId);
      if (eng?.proxy) {
        const engParsed = parseEditorProxy(eng.proxy);
        if (engParsed.mode === 'custom' && engParsed.host === nextProxyParsed.host && String(engParsed.port) === String(nextProxyParsed.port) && (engParsed.username || engParsed.password)) {
          proxy = buildProxyUiValue({
            protocol: nextProxyParsed.type || engParsed.type,
            host: nextProxyParsed.host,
            port: nextProxyParsed.port,
            username: engParsed.username,
            password: engParsed.password,
          });
        }
      }
      if (!proxyHasCredentials(proxy) && selectedProxyId) {
        const libItem = proxyLibraryItem(selectedProxyId);
        if (libItem?.username || libItem?.password) {
          proxy = buildProxyUiValue({
            protocol: nextProxyParsed.type || libItem.protocol || 'socks5',
            host: nextProxyParsed.host || libItem.host,
            port: nextProxyParsed.port || libItem.port,
            username: libItem.username || '',
            password: libItem.password || '',
          });
        }
      }
    }
  }
  if (!proxyHasCredentials(proxy) && selectedProxyId) {
    const libItem = proxyLibraryItem(selectedProxyId);
    if (libItem && (libItem.username || libItem.password)) {
      const curParsed = parseEditorProxy(proxy);
      proxy = buildProxyUiValue({
        protocol: curParsed.type || libItem.protocol || 'socks5',
        host: curParsed.host || libItem.host,
        port: curParsed.port || libItem.port,
        username: libItem.username || '',
        password: libItem.password || '',
      });
    }
  }
  const proxyAuthAction = proxyAuthActionForUpdate(current.proxy, proxy, selectedNetwork);
  const draftBase = normalizeProxyAssociationForUi(current, selectedProxyId);
  return normalizeProfileSettings({
    ...draftBase,
    ...(editorNetworkResult ? {
      exitIp: editorNetworkResult.ip,
      exitCountryCode: editorNetworkResult.countryCode,
      exitTimezone: editorNetworkResult.timezone || '',
      exitLatitude: editorNetworkResult.latitude,
      exitLongitude: editorNetworkResult.longitude,
      exitCheckedAt: editorNetworkResult.checkedAt,
    } : {}),
    id: editingProfileId,
    number: current.number,
    name: displayProfileNumber(current),
    title: ($('#editor-title')?.value || '').trim(),
    browser: 'Google Chrome',
    os: $('#editor-os')?.value || current.os || 'Windows',
    engine: $('#editor-engine')?.value === 'firefox' ? 'firefox' : 'chromium',
    userAgent: ($('#editor-user-agent')?.value || '').trim(),
    cookies: strict ? editorCookies() : ($('#editor-cookies')?.value || '').trim(),
    language: window.OpenBrowserLocale.resolveProfileLanguage({
      language: $('#editor-language')?.value || current.language || 'en-US',
      exitCountryCode: current.exitCountryCode,
      privacy: { languageMode: $('#editor-language-mode')?.value || 'ip' },
    }, editorNetworkResult || {}),
    tag: ($('#editor-tag')?.value || '').trim(),
    groupId: $('#editor-group')?.value || UNGROUPED_ID,
    note: ($('#editor-note')?.value || '').trim(),
    networkMode: selectedNetwork === 'direct' ? 'direct' : 'proxy',
    proxy,
    proxyId: selectedProxyId,
    ...(proxyAuthAction ? { proxyAuthAction } : {}),
    width: resolution.width,
    height: resolution.height,
    platform: {
      type: $('#editor-platform-type')?.value || 'other',
      startUrl: ($('#editor-start-url')?.value || '').trim(),
      username: ($('#editor-platform-user')?.value || '').trim(),
      password: $('#editor-platform-pass')?.value || '',
      totpSecret: ($('#editor-platform-2fa')?.value || '').trim(),
    },
    proxyMeta: {
      proxyId: selectedProxyId,
      ipChannel: $('#editor-ip-channel')?.value || 'ip-api',
      refreshUrl: ($('#editor-refresh-url')?.value || '').trim(),
      checkOnStart: Boolean($('#editor-proxy-check-start')?.checked),
      refreshOnStart: Boolean($('#editor-proxy-refresh-start')?.checked),
      systemProxy: $('#editor-system-proxy')?.value || 'global',
      directBypass: Boolean($('#editor-direct-bypass')?.checked),
      bypassList: ($('#editor-bypass-list')?.value || '').trim(),
      apiExtractUrl: ($('#editor-api-extract-url')?.value || '').trim(),
      backupProxies: ($('#editor-backup-proxies')?.value || '').split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
      fillFingerprint: $('#editor-proxy-fill-fingerprint')?.checked !== false,
      requireReady: true,
      notReadyPolicy: 'block',
      allowDirectFallback: false,
      tlsProfile: $('#editor-proxy-tls-profile')?.value || 'auto',
      tlsChromeMajor: (() => {
        const raw = ($('#editor-proxy-tls-chrome-major')?.value || '').trim();
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 80 && n <= 200 ? Math.floor(n) : null;
      })(),
    },
    privacy,
    advanced: {
      saveCookies: $('#editor-save-cookies')?.checked !== false,
      savePasswords: Boolean($('#editor-save-passwords')?.checked),
      saveBookmarks: $('#editor-save-bookmarks')?.checked !== false,
      saveLocalStorage: $('#editor-save-local-storage')?.checked !== false,
      saveIndexedDB: $('#editor-save-indexeddb')?.checked !== false,
      saveHistory: $('#editor-save-history')?.checked !== false,
      allowSignin: Boolean($('#editor-allow-signin')?.checked),
      restoreSession: tabMode === 'restore' || Boolean($('#editor-restore-session')?.checked),
      blockVideo: Boolean($('#editor-block-video')?.checked),
      blockImages: Boolean($('#editor-block-images')?.checked),
      clearCacheOnStart: Boolean($('#editor-clear-cache')?.checked),
      cloudBackup: Boolean($('#editor-cloud-backup')?.checked),
      syncCookiesOnClose: $('#editor-sync-cookies-close')?.checked !== false,
      syncIndexedDB: Boolean($('#editor-sync-idb')?.checked),
      syncLocalStorage: Boolean($('#editor-sync-ls')?.checked),
      syncPasswords: Boolean($('#editor-sync-passwords')?.checked),
      syncExtensionData: Boolean($('#editor-sync-ext')?.checked),
      multiOpen: Boolean($('#editor-multi-open')?.checked),
      tabMode,
      startUrls: ($('#editor-start-urls')?.value || '').trim(),
      blockUrls: ($('#editor-block-urls')?.value || '').trim(),
      blockSound: Boolean($('#editor-block-sound')?.checked),
      blockPasswordPrompt: Boolean($('#editor-block-password-prompt')?.checked),
      blockRestoreDialog: $('#editor-block-restore-dialog')?.checked !== false,
      blockNotifications: $('#editor-block-notifications')?.checked !== false,
      blockPopups: Boolean($('#editor-block-popups')?.checked),
      jsHeapMax: Boolean($('#editor-js-heap-max')?.checked),
      showInfoPage: $('#editor-show-info-page')?.checked !== false,
      showPasswordOnInfo: Boolean($('#editor-show-password-info')?.checked),
      loadGlobalBookmarks: Boolean($('#editor-load-global-bookmarks')?.checked),
      showBookmarkBar: Boolean($('#editor-show-bookmark-bar')?.checked),
      uploadBookmarks: Boolean($('#editor-upload-bookmarks')?.checked),
    },
  });
}

function renderEditorSummary() {
  if (!editingProfileId) return;
  const draft = editorDraft(false); const privacy = draft.privacy; const summary = $('#editor-summary'); summary.replaceChildren();
  // Summary values go through t() keys (editor.summary.*) plus existing
  // editor.* keys; bare zh literals here used to rely on the runtime phrase
  // table and leaked Chinese on locales it did not cover.
  const labels = {
    webrtc: { proxy: t('editor.summary.webrtcProxy'), disabled: t('editor.summary.webrtcBlockUdp'), real: t('editor.summary.realNetwork') }, timezoneMode: { ip: t('editor.basedOnIp'), real: t('editor.systemReal'), custom: privacy.timezone || t('editor.custom') },
    geoMode: { ip: t('editor.basedOnIp'), disabled: t('editor.summary.geoBlocked'), custom: t('editor.summary.customGeo') }, canvas: { real: t('editor.summary.real'), blocked: t('editor.summary.blockedRead') }, webgl: { real: t('editor.summary.real'), blocked: t('editor.summary.disabled') },
    audio: { real: t('editor.summary.real'), muted: t('editor.summary.muted') }, media: { real: t('editor.summary.askSite'), blocked: t('editor.summary.geoBlocked') }, speech: { real: t('editor.summary.real'), blocked: t('editor.summary.disabled') }, bluetooth: { real: t('editor.summary.real'), blocked: t('editor.summary.off') }
  };
  const values = [
    [tx('浏览器'), 'Google Chrome'], [tx('分组'), groupNameOf(draft)], ['User-Agent', draft.userAgent || t('editor.summary.defaultUA')], [tx('网络'), maskProxy(draft.proxy)], ['WebRTC', labels.webrtc[privacy.webrtc]],
    [tx('时区'), labels.timezoneMode[privacy.timezoneMode]], [tx('地理位置'), labels.geoMode[privacy.geoMode]], [tx('语言'), draft.language], [tx('界面语言'), privacy.uiLanguage === 'profile' ? t('editor.summary.followLanguage') : privacy.uiLanguage],
    [tx('分辨率'), draft.width + ' × ' + draft.height], [tx('字体'), privacy.fontMode === 'custom' ? privacy.fontSize + 'px' : t('editor.summary.default')], ['Canvas', labels.canvas[privacy.canvas]],
    ['WebGL', labels.webgl[privacy.webgl]], ['WebGPU', privacy.webgpu === 'blocked' ? t('editor.summary.disabled') : (privacy.webgpu === 'webgl' ? t('editor.summary.basedOnWebgl') : t('editor.summary.real'))], ['AudioContext', labels.audio[privacy.audio]], [tx('媒体设备'), labels.media[privacy.media]],
    [tx('电池'), privacy.battery === 'blocked' ? t('editor.summary.off') : (privacy.battery === 'real' ? t('editor.summary.real') : t('editor.summary.random'))],
    [tx('蓝牙'), labels.bluetooth[privacy.bluetooth || 'real']],
    [tx('站点稳定性'), privacy.stabilityMode === 'force' ? t('editor.summary.force') : (privacy.stabilityMode === 'off' ? t('editor.summary.off') : t('editor.summary.auto'))],
    [tx('代理未就绪'), draft.proxyMeta?.notReadyPolicy === 'direct' ? t('editor.summary.fallbackDirect') : (draft.proxyMeta?.notReadyPolicy === 'continue' ? t('editor.summary.continue') : t('editor.summary.notReadyBlock'))],
    [tx('TLS 配置'), draft.proxyMeta?.tlsProfile || 'auto'],
    ['ClientRects', privacy.clientRects === 'real' ? t('editor.summary.real') : t('editor.summary.random')],
    ['SpeechVoices', labels.speech[privacy.speech]],
    // Must read the profile editor value — never the host Electron navigator.
    ['CPU', (() => {
      const raw = privacy.cores ?? privacy.fingerprint?.cores;
      const n = Number(raw);
      if (raw === '' || raw === null || raw === undefined || !Number.isFinite(n)) return t('editor.summary.auto');
      if (n === 0) return t('editor.summary.real');
      return t('editor.summary.cores', { n });
    })()],
    ['RAM', (() => {
      const raw = privacy.memory ?? privacy.fingerprint?.memory;
      const n = Number(raw);
      if (raw === '' || raw === null || raw === undefined || !Number.isFinite(n)) return t('editor.summary.auto');
      if (n === 0) return t('editor.summary.real');
      return t('editor.summary.gb', { n });
    })()],
    ['Do Not Track', privacy.dnt ? t('editor.summary.enabled') : t('editor.summary.default')],
    [tx('每次打开刷新指纹'), privacy.refreshFingerprintOnStart ? t('editor.summary.on') : t('editor.summary.off')]
  ];
  for (const [name, value] of values) { const row = document.createElement('div'); row.append(element('dt', '', name), element('dd', '', value || '默认')); summary.append(row); }
  const auditTarget = $('#editor-audit');
  if (auditTarget && window.EnvironmentAudit) {
    const report = window.EnvironmentAudit.build(draft, { systemTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    auditTarget.replaceChildren();
    const head = element('div', 'audit-head');
    head.append(element('strong', '', tx('环境一致性检查')), element('span', report.status, report.warnings ? `${report.warnings} 项需确认` : '配置一致'));
    auditTarget.append(head);
    for (const check of report.checks) {
      const row = element('div', `audit-row ${check.state}`);
      const body = element('div'); body.append(element('strong', '', check.label), element('small', '', check.detail));
      row.append(element('i', '', ''), body); auditTarget.append(row);
    }
  }
}

function openProfileEditor(id) {
  const profile = normalizeProfileSettings(ui.profiles.find((item) => item.id === id)); if (!profile?.id) return;
  editorNetworkResult = profile.exitIp ? { ip: profile.exitIp, countryCode: profile.exitCountryCode, timezone: profile.exitTimezone, latitude: profile.exitLatitude, longitude: profile.exitLongitude, checkedAt: profile.exitCheckedAt } : null;
  editingProfileId = profile.id;
  editorSet('#editor-id', profile.id);
  $('#editor-profile-id').textContent = displayProfileNumber(profile);
  editorSet('#editor-name', displayProfileNumber(profile));
  editorSet('#editor-title', profile.title || '');
  editorSet('#editor-browser', 'Google Chrome');
  editorSet('#editor-os', profile.os);
  editorSet('#editor-engine', profile.engine === 'firefox' ? 'firefox' : 'chromium');
  editorSet('#editor-user-agent', profile.userAgent);
  editorSet('#editor-cookies', (() => {
    if (!profile.cookies) return '';
    try { return JSON.stringify(JSON.parse(profile.cookies), null, 2); } catch (_) { return profile.cookies; }
  })());
  editorSet('#editor-language', profile.language);
  editorSet('#editor-tag', profile.tag);
  editorSet('#editor-note', profile.note);
  editorSet('#editor-platform-type', profile.platform?.type || 'other');
  editorSet('#editor-start-url', profile.platform?.startUrl || '');
  // if type is blank, keep URL empty
  if ((profile.platform?.type || '') === 'blank') editorSet('#editor-start-url', '');
  editorSet('#editor-platform-user', profile.platform?.username || '');
  editorSet('#editor-platform-pass', profile.platform?.password || '');
  editorSet('#editor-platform-2fa', profile.platform?.totpSecret || '');
  fillGroupSelect($('#editor-group'), profile.groupId || UNGROUPED_ID, { includeUngrouped: true });
  const linkedProxyId = profileProxyId(profile);
  renderProxyLibrarySelect($('#editor-proxy-library'), linkedProxyId);
  const linkedProxy = proxyLibraryItem(linkedProxyId);
  const proxyLibraryStatus = $('#editor-proxy-library-status');
  if (proxyLibraryStatus) proxyLibraryStatus.textContent = linkedProxy
    ? `已关联代理库：${proxyLibraryLabel(linkedProxy)}`
    : (linkedProxyId ? `代理节点已失效：${linkedProxyId}` : '未关联代理库节点');
  let proxy = parseEditorProxy(profile.proxy);
  if (linkedProxy) {
    if (proxy.mode !== 'custom' || !proxy.host) {
      const libParsed = parseEditorProxy(linkedProxy.raw || buildProxyUiValue(linkedProxy));
      proxy.mode = 'custom';
      proxy.type = libParsed.type || linkedProxy.protocol || 'socks5';
      proxy.host = libParsed.host || linkedProxy.host || '';
      proxy.port = libParsed.port || linkedProxy.port || '';
      proxy.username = libParsed.username || linkedProxy.username || '';
      proxy.password = libParsed.password || linkedProxy.password || '';
    } else if (!proxy.username || !proxy.password) {
      const libParsed = parseEditorProxy(linkedProxy.raw || buildProxyUiValue(linkedProxy));
      if (libParsed && (!proxy.host || (libParsed.host === proxy.host && String(libParsed.port) === String(proxy.port)))) {
        if (!proxy.username && libParsed.username) proxy.username = libParsed.username;
        if (!proxy.password && libParsed.password) proxy.password = libParsed.password;
        if (!proxy.type && libParsed.type) proxy.type = libParsed.type;
      }
    }
  }
  if (proxy.mode === 'custom') {
    if (!proxy.username || !proxy.password) {
      const eng = engineProfiles.find((item) => item.id === profile.id);
      if (eng?.proxy) {
        const engParsed = parseEditorProxy(eng.proxy);
        if (engParsed && engParsed.host === proxy.host && String(engParsed.port) === String(proxy.port)) {
          if (!proxy.username && engParsed.username) proxy.username = engParsed.username;
          if (!proxy.password && engParsed.password) proxy.password = engParsed.password;
        }
      }
    }
  }
  const mode = document.querySelector('input[name="editor-network"][value="' + proxy.mode + '"]');
  if (mode) mode.checked = true;
  editorSet('#editor-proxy-type', ['http', 'https', 'socks5'].includes(proxy.type) ? proxy.type : 'socks5');
  editorSet('#editor-proxy-host', proxy.host);
  editorSet('#editor-proxy-port', proxy.port);
  editorSet('#editor-proxy-user', proxy.username);
  editorSet('#editor-proxy-password', proxy.password);
  const editorRawInput = $('#editor-proxy-raw');
  if (editorRawInput) {
    editorRawInput.value = proxy.mode === 'custom' && proxy.host
      ? buildProxyUiValue({ protocol: proxy.type, host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password })
      : '';
  }
  window.__editorProxyAuthTouched = false;
  editorSet('#editor-ip-channel', profile.proxyMeta.ipChannel);
  editorSet('#editor-refresh-url', profile.proxyMeta.refreshUrl);
  editorSet('#editor-api-extract-url', profile.proxyMeta.apiExtractUrl || '');
  editorSet('#editor-backup-proxies', Array.isArray(profile.proxyMeta.backupProxies) ? profile.proxyMeta.backupProxies.join('\n') : '');
  editorCheck('#editor-proxy-check-start', profile.proxyMeta.checkOnStart);
  editorCheck('#editor-proxy-refresh-start', profile.proxyMeta.refreshOnStart);
  editorCheck('#editor-proxy-fill-fingerprint', profile.proxyMeta.fillFingerprint !== false);
  editorCheck('#editor-proxy-require-ready', profile.proxyMeta.requireReady !== false);
  editorSet('#editor-proxy-not-ready-policy', profile.proxyMeta.notReadyPolicy || (profile.proxyMeta.requireReady === false ? 'continue' : 'block'));
  editorSet('#editor-proxy-tls-profile', profile.proxyMeta.tlsProfile || 'auto');
  editorSet('#editor-proxy-tls-chrome-major', profile.proxyMeta.tlsChromeMajor == null ? '' : profile.proxyMeta.tlsChromeMajor);
  editorSet('#editor-system-proxy', profile.proxyMeta.systemProxy || 'global');
  editorCheck('#editor-direct-bypass', profile.proxyMeta.directBypass);
  editorSet('#editor-bypass-list', profile.proxyMeta.bypassList || '');
  if ($('#editor-proxy-result')) {
    $('#editor-proxy-result').className = 'proxy-test-result';
    $('#editor-proxy-result').textContent = profile.exitIp ? tx('上次出口：') + profile.exitIp + ' · ' + countryName(profile.exitCountryCode) : tx('尚未检测');
  }
  const privacy = profile.privacy;
  editorSet('#editor-webrtc', privacy.webrtc);
  editorSet('#editor-timezone-mode', privacy.timezoneMode);
  editorSet('#editor-timezone', privacy.timezone);
  editorSet('#editor-geo-mode', privacy.geoMode);
  editorSet('#editor-latitude', privacy.latitude);
  editorSet('#editor-longitude', privacy.longitude);
  editorSet('#editor-accuracy', privacy.accuracy);
  {
    const mode = privacy.languageMode
      || (privacy.langFromIp !== false && (!privacy.uiLanguage || privacy.uiLanguage === 'profile') ? 'ip' : null)
      || (privacy.uiLanguage && privacy.uiLanguage !== 'profile' ? privacy.uiLanguage : null)
      || 'ip';
    editorSet('#editor-language-mode', mode);
    editorSet('#editor-ui-language', mode === 'ip' || mode === 'system' ? 'profile' : mode);
    editorCheck('#editor-lang-from-ip', mode === 'ip');
  }
  editorCheck('#editor-geo-from-ip', privacy.geoFromIp !== false);
  const resolutionKey = profile.width + 'x' + profile.height;
  const resolution = ['1280x820', '1366x768', '1440x900', '1920x1080'].includes(resolutionKey) ? resolutionKey : 'custom';
  editorSet('#editor-resolution', resolution);
  editorSet('#editor-width', profile.width);
  editorSet('#editor-height', profile.height);
  editorSet('#editor-font-mode', privacy.fontMode);
  editorSet('#editor-font-size', privacy.fontSize);
  editorSet('#editor-device-profile', privacy.deviceProfile || 'default');
  editorSet('#editor-canvas', privacy.canvas);
  editorSet('#editor-webgl', privacy.webgl);
  editorSet('#editor-webgl-meta', privacy.webglMeta || 'noise');
  editorSet('#editor-webgpu', privacy.webgpu);
  editorSet('#editor-audio', privacy.audio);
  editorSet('#editor-media', privacy.media);
  editorSet('#editor-media-devices', privacy.mediaDevices || '');
  editorSet('#editor-battery', privacy.battery || 'noise');
  editorSet('#editor-bluetooth', privacy.bluetooth || 'real');
  editorSet('#editor-media-label-audio', privacy.mediaLabels?.audioinput || privacy.mediaLabels?.input || '');
  editorSet('#editor-media-label-video', privacy.mediaLabels?.videoinput || privacy.mediaLabels?.video || '');
  editorSet('#editor-media-label-output', privacy.mediaLabels?.audiooutput || privacy.mediaLabels?.output || '');
  editorSet('#editor-client-rects', privacy.clientRects || 'noise');
  editorSet('#editor-speech', privacy.speech);
  // Select values are strings; 0 must stay "0" (真实), never fall through to "" (自动).
  editorSet('#editor-cores', (() => {
    const raw = privacy.cores ?? privacy.fingerprint?.cores;
    if (raw === '' || raw === null || raw === undefined) return '';
    return String(raw);
  })());
  editorSet('#editor-memory', (() => {
    const raw = privacy.memory ?? privacy.fingerprint?.memory;
    if (raw === '' || raw === null || raw === undefined) return '';
    return String(raw);
  })());
  editorSet('#editor-device-name-mode', privacy.deviceNameMode || 'noise');
  editorSet('#editor-device-name', privacy.deviceName || '');
  editorSet('#editor-dnt-mode', privacy.dntMode || (privacy.dnt ? 'on' : 'default'));
  editorCheck('#editor-dnt', privacy.dnt);
  editorCheck('#editor-port-scan', privacy.portScanProtect);
  editorSet('#editor-port-scan-allow', privacy.portScanAllow || '');
  editorCheck('#editor-cf-optimize', privacy.cfOptimize !== false);
  editorCheck('#editor-refresh-fingerprint', privacy.refreshFingerprintOnStart);
  editorSet('#editor-stability-mode', privacy.stabilityMode || 'auto');
  editorSet('#editor-stability-hamming', privacy.stabilityHamming || 12);
  editorSet('#editor-stability-max-width', privacy.stabilityMaxWidth || 600);
  editorSet('#editor-stability-max-height', privacy.stabilityMaxHeight || 600);
  editorSet('#editor-stability-square', privacy.stabilitySquare || 8);
  editorSet('#editor-stability-hosts', Array.isArray(privacy.stabilityHosts) ? privacy.stabilityHosts.join('\n') : (privacy.stabilityHosts || ''));
  editorSet('#editor-stability-skip-hosts', Array.isArray(privacy.stabilitySkipHosts) ? privacy.stabilitySkipHosts.join('\n') : (privacy.stabilitySkipHosts || ''));
  const advanced = profile.advanced;
  for (const [sel, value] of [
    ['#editor-save-cookies', advanced.saveCookies],
    ['#editor-save-passwords', advanced.savePasswords],
    ['#editor-save-bookmarks', advanced.saveBookmarks],
    ['#editor-save-local-storage', advanced.saveLocalStorage],
    ['#editor-save-indexeddb', advanced.saveIndexedDB],
    ['#editor-save-history', advanced.saveHistory],
    ['#editor-allow-signin', advanced.allowSignin],
    ['#editor-restore-session', advanced.restoreSession],
    ['#editor-block-video', advanced.blockVideo],
    ['#editor-block-images', advanced.blockImages],
    ['#editor-clear-cache', advanced.clearCacheOnStart],
    ['#editor-cloud-backup', advanced.cloudBackup],
    ['#editor-sync-cookies-close', advanced.syncCookiesOnClose !== false],
    ['#editor-sync-idb', advanced.syncIndexedDB],
    ['#editor-sync-ls', advanced.syncLocalStorage],
    ['#editor-sync-passwords', advanced.syncPasswords],
    ['#editor-sync-ext', advanced.syncExtensionData],
    ['#editor-multi-open', advanced.multiOpen],
    ['#editor-block-sound', advanced.blockSound],
    ['#editor-block-password-prompt', advanced.blockPasswordPrompt],
    ['#editor-block-restore-dialog', advanced.blockRestoreDialog],
    ['#editor-block-notifications', advanced.blockNotifications],
    ['#editor-block-popups', advanced.blockPopups],
    ['#editor-js-heap-max', advanced.jsHeapMax],
    ['#editor-show-info-page', advanced.showInfoPage],
    ['#editor-show-password-info', advanced.showPasswordOnInfo],
    ['#editor-load-global-bookmarks', advanced.loadGlobalBookmarks],
    ['#editor-show-bookmark-bar', advanced.showBookmarkBar],
    ['#editor-upload-bookmarks', advanced.uploadBookmarks],
  ]) editorCheck(sel, value);
  const tabMode = advanced.tabMode === 'restore' ? 'restore' : 'fixed';
  const tabRadio = document.querySelector('input[name="editor-tab-mode"][value="' + tabMode + '"]');
  if (tabRadio) tabRadio.checked = true;
  editorSet('#editor-start-urls', advanced.startUrls || '');
  editorSet('#editor-block-urls', advanced.blockUrls || '');
  setEditorTab('basic');
  updateEditorVisibility();
  if (typeof syncThemedSelects === 'function') syncThemedSelects($('#view-profile-editor'));
  renderEditorSummary();
  switchView('profile-editor');
}

async function refreshUaMetaPreview() {
  const raw = document.getElementById('editor-user-agent')?.value?.trim() || '';
  if (!raw) {
    const el = document.getElementById('editor-ua-meta');
    if (el) {
      el.hidden = false;
      el.textContent = tx('留空：启动时按环境 ID 自动生成 UA + Client Hints（各环境互不相同）');
    }
    return;
  }
  try {
    const ua = await window.ops.buildUa({
      userAgent: raw,
      os: editorOsToUaKey($('#editor-os')?.value),
      chromeMajor: Number($('#editor-ua-chrome-major')?.value) || undefined,
    });
    await showUaMetaPreview(ua);
  } catch (_) {}
}

function openCreateProfileDialog() {
  fillGroupSelect($('#profile-create-group'), listGroups()[0]?.id || UNGROUPED_ID);
  const directRadio = document.querySelector('input[name="create-network"][value="direct"]');
  if (directRadio) directRadio.checked = true;
  const proxyInput = $('#create-proxy-input');
  if (proxyInput) proxyInput.value = '';
  renderProxyLibrarySelect($('#create-proxy-library'), '');
  renderProxyLibrarySelect($('#batch-add-proxy-library'), '');
  const fields = $('#create-proxy-fields');
  if (fields) fields.hidden = true;
  const number = nextProfileNumber();
  const form = $('#profile-form');
  if (form?.elements?.name) {
    form.elements.name.value = String(number);
    form.elements.name.readOnly = true;
  }
  if (form?.elements?.startUrl) form.elements.startUrl.value = '';
  const templateSelect = $('#profile-create-template');
  if (templateSelect) {
    templateSelect.replaceChildren();
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = tx('使用新环境默认偏好');
    templateSelect.appendChild(defaultOpt);
    for (const p of ui.profiles) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${displayProfileNumber(p)} - ${p.name || '环境'}${p.startUrl ? ' (' + p.startUrl + ')' : ''}`;
      templateSelect.appendChild(opt);
    }
  }
  const createProxyRaw = $('#create-proxy-raw');
  if (createProxyRaw) createProxyRaw.value = '';
  const createPlatform = $('#profile-create-platform');
  if (createPlatform) createPlatform.value = 'other';
  document.querySelectorAll('#profile-create-platform-chips .mini-chip').forEach((c) => c.classList.remove('active'));
  const createSaveToLib = $('#create-proxy-save-to-library');
  if (createSaveToLib) createSaveToLib.checked = false;
  syncThemedSelects($('#profile-dialog'));
  $('#profile-dialog')?.showModal();
}

function setupPlatformPresets(selectId, chipsId, inputId) {
  const select = document.getElementById(selectId);
  const chips = document.getElementById(chipsId);
  const input = document.getElementById(inputId);
  if (!select || !input) return;

  const updateActiveChip = (platform) => {
    if (!chips) return;
    chips.querySelectorAll('.mini-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.platform === platform);
    });
  };

  select.addEventListener('change', () => {
    const opt = select.selectedOptions?.[0];
    const url = opt?.getAttribute('data-url') ?? '';
    const platform = select.value;
    if (platform === 'blank') {
      input.value = '';
      input.placeholder = tx('空白页 (about:blank)');
    } else if (url) {
      input.value = url;
    }
    updateActiveChip(platform);
  });

  chips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.mini-chip');
    if (!chip) return;
    const url = chip.dataset.url ?? '';
    const platform = chip.dataset.platform || 'other';
    select.value = platform;
    if (platform === 'blank') {
      input.value = '';
      input.placeholder = tx('空白页 (about:blank)');
    } else if (url) {
      input.value = url;
    }
    updateActiveChip(platform);
  });
}

// Entry points that only renderer.js's event wiring calls (no intra-file use):
// assign them to window explicitly — the classic-script export convention used
// by ui-dialogs.js — so the cross-file contract is visible and eslint counts
// them as used. Function declarations are already script globals; this only
// makes that intent explicit.
Object.assign(window, {
  openProfileEditor,
  refreshUaMetaPreview,
  openCreateProfileDialog,
  setupPlatformPresets,
});

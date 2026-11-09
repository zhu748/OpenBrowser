'use strict';

/**
 * ESLint flat config — first static-analysis layer for a previously unlinted
 * ~160k-line CommonJS codebase. Deliberately conservative: only rules that
 * catch real defects (typos, dead assignments, duplicate keys, unsafe
 * comparisons) are errors. Style and unused-variable churn stay off so the
 * gate can be enforced from day one; tighten incrementally after that.
 */

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'kernels/**',
      'rust-core/**',
      'assets/**',
      'bundled-extension/**',
      'automation/data/**',
    ],
  },
  {
    // The desktop UI is a multi-<script> page: index.html loads renderer.js,
    // environment-audit.js and ui/*.js as sibling classic scripts that share
    // one global scope. ESLint analyses each file in isolation, so references
    // across those files must be declared here. Adding a NEW cross-file global
    // means extending this list — that friction is intentional: the shared
    // namespace should not grow silently.
    //
    // Since the ui-proxy.js / ui-editor.js extractions the boundary is:
    // ui/ui-proxy.js owns the proxy-domain functions (parse/format/merge, the
    // proxies view, the proxy dialog, batch check/apply, live re-parse
    // handlers, batch network-mode apply); ui/ui-editor.js owns the
    // profile-editor domain (normalize/editorDraft/summary/openProfileEditor/
    // UA preview/create dialog/platform presets); renderer.js keeps the
    // generic UI helpers (t/tx/element/toast/$, editor glue, view cache) and
    // the load-time event wiring. The names below are exactly that two-way
    // surface.
    files: ['renderer.js', 'environment-audit.js', 'i18n.js', 'ui/*.js'],
    languageOptions: {
      globals: {
        $: 'writable',
        $$: 'writable',
        ui: 'writable',
        editorSet: 'writable',
        editorDraft: 'writable',
        editorNetworkResult: 'writable',
        openProfileEditor: 'writable',
        switchView: 'writable',
        setEditorTab: 'writable',
        testEditorProxy: 'writable',
        normalizeProfileSettings: 'writable',
        selectedProfiles: 'writable',
        activeGroupFilter: 'writable',
        engineProfiles: 'writable',
        profilePage: 'writable',
        profilePageSize: 'writable',
        currentRpaTab: 'writable',
        appCenterTab: 'writable',
        appCenterData: 'writable',
        proxyLibrary: 'writable',
        visibleProxies: 'writable',
        updateProxySelectedChip: 'writable',
        normalizeProxyImportLines: 'writable',
        buildProxyExportText: 'writable',
        renderDirectBanner: 'writable',
        randomizeFingerprintDraft: 'writable',
        wireEditorAlignmentControls: 'writable',
        countryFlag: 'writable',
        toggleRowMoreMenu: 'writable',
        closeRowMoreMenu: 'writable',
        toggleProfileFavorite: 'writable',
        exportProfile: 'writable',
        makeEditorReadonly: 'writable',
        restartProfile: 'writable',
        openBatchQuickDialog: 'writable',
        clearProfileCache: 'writable',
        trashProfile: 'writable',
        renderProfiles: 'writable',
        renderProxies: 'writable',
        refreshProxies: 'writable',
        renderLogs: 'writable',
        renderExtensions: 'writable',
        renderRpaStore: 'writable',
        refreshStatus: 'writable',
        refreshIcons: 'writable',
        refreshKernelPanel: 'writable',
        refreshCloudPanel: 'writable',
        refreshRpaPage: 'writable',
        refreshApiMcpPage: 'writable',
        setLocalApiStatus: 'writable',
        showRpaPanel: 'writable',
        // proxy-domain functions owned by ui/ui-proxy.js, called from renderer.js
        parseProxyInputForUi: 'writable',
        applyProxyLibrarySelection: 'writable',
        proxyHasCredentials: 'writable',
        mergeRemoteProxy: 'writable',
        proxyAuthActionForUpdate: 'writable',
        openProxyDialog: 'writable',
        readProxyForm: 'writable',
        runProxyBatchCheck: 'writable',
        openProxyApplyDialog: 'writable',
        handleProxyRawChange: 'writable',
        handleProxyHostChange: 'writable',
        applySelectedNetworkMode: 'writable',
        // editor-domain functions owned by ui/ui-editor.js, called from renderer.js
        renderEditorSummary: 'writable',
        refreshUaMetaPreview: 'writable',
        openCreateProfileDialog: 'writable',
        setupPlatformPresets: 'writable',
        // generic renderer helpers used inside ui/ui-editor.js
        UNGROUPED_ID: 'writable',
        countryName: 'writable',
        editingProfileId: 'writable',
        editorCheck: 'writable',
        editorCookies: 'writable',
        editorOsToUaKey: 'writable',
        editorResolution: 'writable',
        editorSelectedNetwork: 'writable',
        fillGroupSelect: 'writable',
        groupNameOf: 'writable',
        isDirectProxy: 'writable',
        listGroups: 'writable',
        maskProxy: 'writable',
        nextProfileNumber: 'writable',
        normalizeProxyAssociationForUi: 'writable',
        positiveProfileNumber: 'writable',
        renderProxyLibrarySelect: 'writable',
        serializeEditorProxy: 'writable',
        showUaMetaPreview: 'writable',
        updateEditorVisibility: 'writable',
        // renderer-owned names used by ui/ui-proxy-wiring.js (loaded after renderer.js)
        applyColorMode: 'writable',
        applyEditorProxyFingerprint: 'writable',
        applyUiTheme: 'writable',
        checkProfileProxy: 'writable',
        cloneProfile: 'writable',
        closeSelectMenu: 'writable',
        confirmAction: 'writable',
        handleQuickPasteToInput: 'writable',
        installProxyTypeControl: 'writable',
        openAssign: 'writable',
        openSelectMenu: 'writable',
        preferredMasterId: 'writable',
        purgeProfile: 'writable',
        pushSyncSelection: 'writable',
        refreshEditorProxy: 'writable',
        refreshExtensions: 'writable',
        renderSessions: 'writable',
        restoreProfile: 'writable',
        runSyncAction: 'writable',
        scheduleProxySearchRender: 'writable',
        selectedSessionIds: 'writable',
        selectedSessions: 'writable',
        setThemePopoverOpen: 'writable',
        startProfile: 'writable',
        stopProfile: 'writable',
        syncState: 'writable',
        updateProfileSelectionUi: 'writable',
        // generic renderer helpers used inside ui/ui-proxy.js
        t: 'writable',
        tx: 'writable',
        log: 'writable',
        save: 'writable',
        toast: 'writable',
        element: 'writable',
        buildSquareMark: 'writable',
        UI_MARK_SIZE: 'writable',
        displayProfileNumber: 'writable',
        afterUiRender: 'writable',
        syncThemedSelect: 'writable',
        syncThemedSelects: 'writable',
        loadedViews: 'writable',
        invalidateViewCache: 'writable',
        editingProxyRecord: 'writable',
        selectedProxies: 'writable',
        parseEditorProxy: 'writable',
        decodeProxyPartForUi: 'writable',
        proxyHostForUi: 'writable',
        normalizeProxyProtocolForUi: 'writable',
        buildProxyUiValue: 'writable',
        splitProxyRemarkForUi: 'writable',
        proxyLibraryLabel: 'writable',
        proxyLibraryItem: 'writable',
        renderProxyLibrarySelectors: 'writable',
        verifyProxyAssignments: 'writable',
        iconActionButton: 'writable',
        runPool: 'writable',
        refreshSessions: 'writable',
        profileEngine: 'writable',
        profileProxyId: 'writable',
      },
    },
  },
  {
    // Screenshot capture drives the real page the same way the runtime
    // selftest does: run() callbacks execute in the renderer's global
    // scope, so page globals are legitimate here.
    files: ['automation/readme-screenshot-capture.js'],
    languageOptions: {
      globals: {
        applyColorMode: 'writable',
        OpenBrowserI18n: 'readonly',
        ui: 'writable',
        extensions: 'writable',
        proxyLibrary: 'writable',
        normalizeProfileSettings: 'writable',
        renderProfiles: 'writable',
        openProfileEditor: 'writable',
        setEditorTab: 'writable',
      },
    },
  },
  {
    // Selftest that drives the live page: run()/cli() callbacks execute in the
    // renderer's global scope, so page globals are legitimate here.
    files: ['automation/selftests/secondary-ui-runtime-selftest.js'],
    languageOptions: {
      globals: {
        $: 'writable',
        ui: 'writable',
        extensions: 'writable',
        appCenterTab: 'writable',
        appCenterData: 'writable',
        proxyLibrary: 'writable',
        renderLogs: 'writable',
        renderProxies: 'writable',
        renderExtensions: 'writable',
        normalizeProfileSettings: 'writable',
        renderProfiles: 'writable',
        refreshProxies: 'writable',
        switchView: 'writable',
        openProfileEditor: 'writable',
        setEditorTab: 'writable',
        editorSet: 'writable',
        editorNetworkResult: 'writable',
        editorDraft: 'writable',
        testEditorProxy: 'writable',
        engineProfiles: 'writable',
        selectedProfiles: 'writable',
        activeGroupFilter: 'writable',
        profilePage: 'writable',
        profilePageSize: 'writable',
      },
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Correctness: undefined names, duplicate declarations
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-shadow-restricted-names': 'error',
      // Correctness: broken control flow / assignments
      'no-const-assign': 'error',
      'no-self-assign': 'error',
      'no-unreachable': 'error',
      'no-fallthrough': 'error',
      'no-async-promise-executor': 'error',
      'no-compare-neg-zero': 'error',
      'no-self-compare': 'error',
      'no-delete-var': 'error',
      // Numeric hazards
      'use-isnan': 'error',
      'valid-typeof': 'error',
      // Non-blocking hygiene (visible, does not fail the gate yet)
      'no-unused-vars': 'warn',
      'no-empty': 'off', // ~300 intentional empty catches; needs a sweep first
    },
  },
];

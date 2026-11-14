'use strict';

/**
 * ESLint flat config — first static-analysis layer for a previously unlinted
 * ~160k-line CommonJS codebase. Deliberately conservative: only rules that
 * catch real defects (typos, dead assignments, duplicate keys, unsafe
 * comparisons) are errors. Style and unused-variable churn stay off so the
 * gate can be enforced from day one; tighten incrementally after that.
 */


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
      'automation/vendor/**',
      // Generated Vue modules have independent syntax and import/export audits.
      'roxy-ui/**',
      // Immutable build inputs use checksums and the compiler's own AST audits.
      'rebuild/compiler/vendor/**',
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
    //
    // Second renderer.js split: renderer-select.js (themed select widget),
    // renderer-theme.js (theme registry + color-mode system) and
    // renderer-platform-install.js (app center / store install view) are
    // sibling classic scripts loaded before renderer.js; they declare their
    // moved names as top-level script globals and reach renderer-owned state
    // (extensions / appCenterTab / ...) through the same shared scope.
    files: [
      'renderer.js',
      'renderer-select.js',
      'renderer-theme.js',
      'renderer-platform-install.js',
      'environment-audit.js',
      'i18n.js',
      'ui/*.js',
    ],
    languageOptions: {
      globals: {
        $: 'writable',
        $$: 'writable',
        ui: 'writable',
        editorSet: 'writable',
        editorRequests: 'readonly',
        editorUaRequestInputs: 'readonly',
        editorNetworkRequestInputs: 'readonly',
        setEditorNetworkBusy: 'readonly',
        resetEditorAsyncRequests: 'readonly',
        editorDraft: 'writable',
        editorNetworkResult: 'writable',
        editingProfileBaseRev: 'writable',
        appCenterData: 'writable',
        appCenterTab: 'writable',
        applyAssignment: 'writable',
        applyProxyLibrarySelection: 'writable',
        applySelectedNetworkMode: 'writable',
        applyUiTheme: 'writable',
        buildProxyExportText: 'writable',
        buildSquareMark: 'writable',
        clearProfileCache: 'writable',
        currentExtension: 'writable',
        currentTheme: 'writable',
        displayProfileNumber: 'writable',
        editingProxyRecord: 'writable',
        element: 'writable',
        elements: 'writable',
        enhanceSelects: 'writable',
        error: 'writable',
        exportProfile: 'writable',
        extensions: 'writable',
        handleProxyHostChange: 'writable',
        handleProxyRawChange: 'writable',
        initials: 'writable',
        localRenderRoots: 'writable',
        log: 'writable',
        makeEditorReadonly: 'writable',
        mergeRemoteProxy: 'writable',
        name: 'writable',
        networkModeBadge: 'writable',
        normalizeProxyImportLines: 'writable',
        openAssign: 'writable',
        openProxyApplyDialog: 'writable',
        openProxyDialog: 'writable',
        proxyAuthActionForUpdate: 'writable',
        readProxyForm: 'writable',
        restartProfile: 'writable',
        rpaGrid: 'writable',
        rpaLogList: 'writable',
        rpaPlanTable: 'writable',
        rpaRunTable: 'writable',
        rpaTaskTable: 'writable',
        rpaView: 'writable',
        runProxyBatchCheck: 'writable',
        save: 'writable',
        selectedProxies: 'writable',
        syncThemedSelects: 'writable',
        t: 'writable',
        toggleProfileFavorite: 'writable',
        toggleRowMoreMenu: 'writable',
        trashProfile: 'writable',
        updateEngineBadge: 'writable',
        winBg2: 'writable',
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
        proxyLibrary: 'writable',
        visibleProxies: 'writable',
        updateProxySelectedChip: 'writable',
        renderDirectBanner: 'writable',
        randomizeFingerprintDraft: 'writable',
        wireEditorAlignmentControls: 'writable',
        countryFlag: 'writable',
        closeRowMoreMenu: 'writable',
        openBatchQuickDialog: 'writable',
        renderProfiles: 'writable',
        // Group domain functions moved from renderer.js to ui/ui-groups.js.
        renderGroupsPage: 'writable',
        openGroupDialog: 'writable',
        saveGroupFromDialog: 'writable',
        deleteGroup: 'writable',
        assignSelectedToGroup: 'writable',
        GROUP_COLORS: 'readonly',
        createGroupId: 'writable',
        normalizeGroup: 'writable',
        findGroup: 'writable',
        rebuildGroupCounts: 'writable',
        countProfilesInGroup: 'writable',
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
        proxyHasCredentials: 'writable',
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
        fillEditorVersionSelects: 'readonly',
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
        checkProfileProxy: 'writable',
        cloneProfile: 'writable',
        closeSelectMenu: 'writable',
        confirmAction: 'writable',
        commitProfilePatches: 'writable',
        handleQuickPasteToInput: 'writable',
        installProxyTypeControl: 'writable',
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
        // second-split modules: names owned by renderer-select.js /
        // renderer-theme.js / renderer-platform-install.js and reached from
        // renderer.js's wiring, plus renderer-owned state they reach back.
        positionSelectMenu: 'writable',
        savedUiTheme: 'writable',
        UI_THEMES: 'writable',
        uiColorMode: 'writable',
        uiColorPreference: 'writable',
        syncAppearanceControls: 'writable',
        themeDisplayName: 'writable',
        // generic renderer helpers used inside ui/ui-proxy.js
        tx: 'writable',
        toast: 'writable',
        UI_MARK_SIZE: 'writable',
        afterUiRender: 'writable',
        syncThemedSelect: 'writable',
        loadedViews: 'writable',
        invalidateViewCache: 'writable',
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
    files: ['**/*.js', '**/*.cjs'],
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
      // The `_` prefix marks intentional-unused (positional params, promise
      // executors, swallowed catches): the codebase has 1200+ such sites,
      // so without these patterns the gate drowned in false positives and
      // GitHub capped the annotations at 11, hiding real findings.
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-empty': 'off', // ~300 intentional empty catches; needs a sweep first
    },
  },
  {
    files: ['rebuild/agent-channel.js', 'rebuild/local-pages.js', 'rebuild/renderer-bridge.js', 'rebuild/workbench-chrome.js'],
    languageOptions: { sourceType: 'module' },
  },
  {
    // index.html loads this as a classic script. Its existing public function
    // declarations are shared with renderer.js, as declared by /* exported */.
    files: ['ui/ui-groups.js'],
    languageOptions: {
      sourceType: 'script',
      // The owner declares these names; only consumers need ambient globals.
      globals: {
        renderGroupsPage: 'off',
        openGroupDialog: 'off',
        saveGroupFromDialog: 'off',
        deleteGroup: 'off',
        assignSelectedToGroup: 'off',
      },
    },
  },
  {
    files: ['engine/**/*.js', 'main/**/*.js', 'network/**/*.js', 'automation/kernel/**/*.js', 'automation/api/**/*.js'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage', 'sessionStorage'],
    },
  },
  {
    files: ['renderer*.js', 'ui/*.js', 'environment-audit.js', 'i18n.js', 'shared/*.js'],
    ignores: ['**/*selftest*.js'],
    rules: {
      // UMD modules may declare require/module for Node selftests, but the
      // renderer cannot rely on host process globals in its isolated sandbox.
      'no-restricted-globals': ['error', 'process', 'Buffer', '__dirname', '__filename', 'global', 'setImmediate'],
    },
  },
  {
    // Classic-script shared scope: single-file unused analysis is structurally
    // wrong for these files. They load as classic <script> siblings sharing
    // one global scope — applyProxyLibrarySelection is defined in
    // ui/ui-proxy.js and consumed by ui/ui-proxy-wiring.js; the profile
    // actions (restartProfile / trashProfile / clearProfileCache / ...) are
    // defined in renderer.js and consumed by the ui/ modules; renderer.js's
    // extensions / appCenterTab / ... state is read across scripts. ESLint's
    // no-unused-vars cannot see cross-file usage (globals entries only cover
    // no-undef — `mergeRemoteProxy: 'writable'` never silenced its warning),
    // so it reports every cross-script API as unused. Dead code in these
    // files is caught by the selftest suite (proxyformat / profileui /
    // secondary-ui-runtime / layout guards); the IIFE ui modules
    // (api-mcp / cloud / kernel / rpa) keep the rule ON and are held clean.
    files: [
      'renderer.js',
      'renderer-platform-install.js',
      'renderer-select.js',
      'renderer-theme.js',
      'environment-audit.js',
      'i18n.js',
      'ui/ui-proxy.js',
    ],
    rules: {
      'no-unused-vars': 'off',
    },
  },
];

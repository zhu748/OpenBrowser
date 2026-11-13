'use strict';

// Browser `<script>` tags share a global lexical environment. This test loads the
// extracted UI modules after representative renderer bindings, so a future top-level
// `const`/`let` collision fails here instead of leaving a white Electron window.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expectedModules = [
  'ui/ui-proxy-wiring.js',
  'ui/ui-dialogs.js',
  'ui/ui-rpa.js',
  'ui/ui-api-mcp.js',
  'ui/ui-kernel.js',
  'ui/ui-cloud.js',
];
const scripts = [...index.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split('?')[0]);
for (const script of scripts) {
  new vm.Script(fs.readFileSync(path.join(root, script), 'utf8'), { filename: script });
}
const preloadMethods = new Set([...fs.readFileSync(path.join(root, 'preload.js'), 'utf8').matchAll(/^  (\w+):/gm)].map((match) => match[1]));
for (const match of fs.readFileSync(path.join(root, 'ui/ui-workbench.js'), 'utf8').matchAll(/window\.ops\??\.(\w+)/g)) {
  assert.ok(preloadMethods.has(match[1]), 'workbench calls missing preload method: ' + match[1]);
}
const rendererIndex = scripts.indexOf('renderer.js');

assert.ok(rendererIndex >= 0, 'index.html loads renderer.js');
assert.ok(scripts.indexOf('ui/ui-groups.js') >= 0 && scripts.indexOf('ui/ui-groups.js') < rendererIndex,
  'group domain functions load before renderer wiring');
const modelModules = ['ui/ui-profile-list.js', 'ui/ui-profile-rows.js', 'ui/ui-profile-batch.js', 'ui/ui-sync-text.js', 'shared/proxy-redact.js', 'ui/ui-profile-state.js', 'shared/ipc-result.js', 'shared/profile-values.js', 'ui/ui-state-store.js', 'ui/ui-profile-commands.js', 'ui/ui-refresh-scheduler.js', 'ui/ui-status-controller.js', 'ui/ui-session-controller.js'];
for (const script of modelModules) {
  assert.ok(scripts.indexOf(script) >= 0 && scripts.indexOf(script) < rendererIndex,
    `${script} loads before the renderer consumes its API`);
}
assert.deepStrictEqual(scripts.slice(rendererIndex - 2, rendererIndex), ['ui/ui-proxy.js', 'ui/ui-editor.js'],
  'the proxy and editor domain modules load immediately before renderer.js');
assert.deepStrictEqual(scripts.slice(rendererIndex + 1, rendererIndex + 1 + expectedModules.length), expectedModules,
  'UI modules load immediately after renderer.js in dependency order');

// Second renderer.js split: the select widget, theme system and platform
// install modules are classic scripts loaded before renderer.js — renderer.js
// itself calls enhanceSelects()/applyUiTheme() during its top-level wiring.
const splitModules = ['renderer-select.js', 'renderer-theme.js', 'renderer-platform-install.js'];
for (const split of splitModules) {
  const splitIndex = scripts.indexOf(split);
  assert.ok(splitIndex >= 0, `index.html loads ${split}`);
  assert.ok(splitIndex < scripts.indexOf('ui/ui-proxy.js'), `${split} loads before the ui/ domain modules and renderer.js`);
}

const noop = () => {};
function nodeStub() {
  const value = {
    hidden: false,
    style: {},
    dataset: {},
    checked: false,
    value: '',
    textContent: '',
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop,
    append: noop,
    appendChild: noop,
    replaceChildren: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute: noop,
    getAttribute: () => null,
    showModal: noop,
    close: noop,
  };
  return new Proxy(value, {
    get(target, key) { return key in target ? target[key] : noop; },
    set(target, key, next) { target[key] = next; return true; },
  });
}

const document = {
  addEventListener: noop,
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: nodeStub,
};

const context = vm.createContext({
  console,
  document,
  navigator: { clipboard: { writeText: async () => {} } },
  setTimeout: () => 0,
  clearTimeout: noop,
  confirm: () => false,
  structuredClone: (value) => JSON.parse(JSON.stringify(value)),
  Option: function Option() {},
  Blob: function Blob() {},
  URL,
  FileReader: function FileReader() {},
  engineProfiles: [],
  selectedProfiles: new Set(),
  editingProfileId: null,
  switchView: noop,
});
context.window = context;
for (const script of modelModules) {
  new vm.Script(fs.readFileSync(path.join(root, script), 'utf8'), { filename: script }).runInContext(context);
}
assert.strictEqual(typeof context.OpenBrowserProfileList.filterProfiles, 'function');
assert.strictEqual(typeof context.OpenBrowserProfileList.summarizeProfiles, 'function');
assert.strictEqual(typeof context.OpenBrowserProfileRows.reconcileProfileRows, 'function');
assert.strictEqual(typeof context.OpenBrowserProfileBatch.removeProfilesById, 'function');
assert.strictEqual(typeof context.OpenBrowserSyncText.orderedSessionIds, 'function');
assert.strictEqual(typeof context.OpenBrowserProfileState.reconcileProfiles, 'function');
assert.strictEqual(typeof context.OpenBrowserIpcResult.unwrapIpcResult, 'function');
assert.strictEqual(typeof context.OpenBrowserProfileCommands.commitProfileEdit, 'function');
assert.strictEqual(typeof context.OpenBrowserRefreshScheduler.createRefreshScheduler, 'function');
assert.strictEqual(typeof context.OpenBrowserSessionController.createSessionController, 'function');
context.ops = new Proxy({ onEvent: noop }, {
  get(target, key) { return key in target ? target[key] : async () => ({}); },
});

// Real page order: the second-split modules load before the ui/ domain
// modules and renderer.js; run them first here too, so a top-level
// redeclaration of a renderer-owned name (or a load-time crash in the split
// modules) fails in this test instead of leaving a white Electron window.
for (const script of splitModules) {
  const splitSource = fs.readFileSync(path.join(root, script), 'utf8');
  new vm.Script(splitSource, { filename: script }).runInContext(context);
}

// The proxy UI domain module loads before renderer.js in the real page; run it
// first here too, so a top-level redeclaration of a renderer-owned name fails
// in this test instead of leaving a white Electron window.
const proxyUiSource = fs.readFileSync(path.join(root, 'ui/ui-proxy.js'), 'utf8');
new vm.Script(fs.readFileSync(path.join(root, 'ui/ui-groups.js'), 'utf8'),
  { filename: 'ui/ui-groups.js' }).runInContext(context);
new vm.Script(proxyUiSource, { filename: 'ui/ui-proxy.js' }).runInContext(context);
const editorSource = fs.readFileSync(path.join(root, 'ui/ui-editor.js'), 'utf8');
new vm.Script(editorSource, { filename: 'ui/ui-editor.js' }).runInContext(context);

// These bindings mirror the names owned by renderer.js. The extracted files must
// not redeclare any of them in the shared top-level script scope.
new vm.Script(`
  const $ = () => null;
  const $$ = () => [];
  let ui = { profiles: [], groups: [] };
  function save() {}
  function toast() {}
  function tx(value) { return value; }
  function t(value) { return value; }
  function log() {}
  function element() { return null; }
  function buildSquareMark() { return null; }
  function displayProfileNumber(profile) { return profile?.name || ''; }
  function updateEngineBadge() {}
  function afterUiRender() {}
  function syncThemedSelects() {}
  function editorDraft() { return {}; }
  function openProfileEditor() {}
  function renderProfiles() {}
  // called at evaluation time by ui/ui-proxy-wiring.js top-level statements
  function installProxyTypeControl() {}
  window.OpenBrowserApp = {
    get ui() { return ui; },
    get engineProfiles() { return engineProfiles; },
    get editingProfileId() { return editingProfileId; },
    save, toast, tx, t, log, $, $$, element, buildSquareMark, displayProfileNumber,
    updateEngineBadge, afterUiRender, syncThemedSelects, editorDraft, openProfileEditor, renderProfiles,
  };
`, { filename: 'renderer-bindings.js' }).runInContext(context);

for (const script of expectedModules) {
  const source = fs.readFileSync(path.join(root, script), 'utf8');
  new vm.Script(source, { filename: script }).runInContext(context);
}

for (const name of [
  'renderGroupsPage', 'openGroupDialog', 'saveGroupFromDialog', 'deleteGroup', 'assignSelectedToGroup',
  'confirmAction', 'confirmDialog', 'showRpaPanel', 'refreshRpaPage', 'appendRpaLog', 'refreshApiMcpPage',
  'setLocalApiStatus', 'refreshKernelPanel', 'refreshCloudPanel',
]) {
  assert.strictEqual(typeof context[name], 'function', name + ' is exported after module load');
}

new vm.Script(`
  if (typeof confirmAction !== 'function') throw new Error('renderer modules cannot resolve confirmation export');
  if (typeof showRpaPanel !== 'function') throw new Error('renderer cannot resolve RPA export');
  if (typeof refreshApiMcpPage !== 'function') throw new Error('renderer cannot resolve API/MCP export');
  if (typeof refreshKernelPanel !== 'function') throw new Error('renderer cannot resolve kernel export');
  if (typeof refreshCloudPanel !== 'function') throw new Error('renderer cannot resolve cloud export');
`, { filename: 'renderer-module-consumer.js' }).runInContext(context);

console.log('ui-module-load-selftest: all extracted browser scripts load in one global context.');

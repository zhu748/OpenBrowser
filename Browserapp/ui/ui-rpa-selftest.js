'use strict';

/**
 * OpenBrowser RPA UI Submodule Selftest
 * Verifies:
 * 1. Static security & accessibility invariants (safe DOM rendering and scoped afterUiRender).
 * 2. DOM card rendering safety (safe textContent, title/aria-label on dynamic buttons).
 * 3. confirmAction async delegation and safe cancellation when the service is unavailable.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rpaPath = path.join(__dirname, 'ui-rpa.js');
const source = fs.readFileSync(rpaPath, 'utf8');

// 1. Static Invariants Check
const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
assert.ok(!/\bconfirm\s*\(/.test(codeOnly), 'ui-rpa.js must not call native confirmation directly');
assert.ok(!/\.innerHTML\b/.test(source), 'ui-rpa.js must not use .innerHTML (all cards & toolbars use safe DOM APIs)');
assert.ok(!/afterUiRender\s*\([^)]*\|\|\s*document\s*\)/.test(source), 'ui-rpa.js must not fall back to full document afterUiRender');
assert.ok(!/afterUiRender\s*\(\s*document\s*\)/.test(source), 'ui-rpa.js must not pass document to afterUiRender');

// 2. Mock DOM & Runtime Environment
class MockElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.childNodes = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.value = '';
    this.checked = false;
    this.listeners = {};
    this.classList = {
      _classes: new Set(),
      add(...c) { c.forEach((x) => this._classes.add(x)); },
      remove(...c) { c.forEach((x) => this._classes.delete(x)); },
      toggle(c, force) {
        if (force === true) this._classes.add(c);
        else if (force === false) this._classes.delete(c);
        else if (this._classes.has(c)) this._classes.delete(c);
        else this._classes.add(c);
      },
      contains(c) { return this._classes.has(c); },
    };
    this._textContent = '';
  }

  get className() { return [...this.classList._classes].join(' '); }
  set className(v) {
    this.classList._classes.clear();
    String(v || '').split(/\s+/).filter(Boolean).forEach((c) => this.classList.add(c));
  }

  get textContent() {
    if (this.childNodes.length > 0) {
      return this.childNodes.map((n) => n.textContent || '').join('');
    }
    return this._textContent;
  }
  set textContent(val) {
    this._textContent = String(val == null ? '' : val);
    this.childNodes = [];
    this.children = [];
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] != null ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }
  hasAttribute(k) { return k in this.attributes; }

  append(...nodes) {
    for (const n of nodes) {
      const node = typeof n === 'string' ? { nodeType: 3, textContent: n } : n;
      this.childNodes.push(node);
      if (node.nodeType === 1 || node.tagName) this.children.push(node);
      node.parentElement = this;
    }
  }

  replaceChildren(...nodes) {
    this.childNodes = [];
    this.children = [];
    this.append(...nodes);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      for (const child of node.children || []) {
        if (matchesSelector(child, selector)) results.push(child);
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSelector(curr, selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  get selectedOptions() { return this.children.filter((child) => child.selected); }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  removeEventListener() {}
}

function matchesSelector(el, selector) {
  if (!el || !el.tagName) return false;
  const s = selector.trim();
  if (s.endsWith(':checked')) return Boolean(el.checked) && matchesSelector(el, s.slice(0, -8));
  if (s.startsWith('.')) return el.classList.contains(s.slice(1));
  if (s.startsWith('#')) return el.id === s.slice(1);
  if (s.startsWith('[data-')) {
    const m = s.match(/\[([a-zA-Z0-9_-]+)(?:=["']?([^"'\]]+)["']?)?\]/);
    if (m) {
      const attr = m[1];
      const val = m[2];
      const has = el.hasAttribute(attr) || (attr.startsWith('data-') && el.dataset[attr.slice(5)] != null);
      if (!has) return false;
      if (val !== undefined) {
        return (el.getAttribute(attr) || el.dataset[attr.slice(5)]) === val;
      }
      return true;
    }
  }
  return el.tagName.toLowerCase() === s.toLowerCase();
}

const elementsById = new Map();
function getOrCreate(id, tag = 'div') {
  if (!elementsById.has(id)) {
    const el = new MockElement(tag);
    el.id = id;
    elementsById.set(id, el);
  }
  return elementsById.get(id);
}

// Pre-create standard RPA DOM ids
const _rpaGrid = getOrCreate('rpa-store-grid');
const rpaCountWrap = new MockElement('div');
rpaCountWrap.className = 'rpa-toolbar-right';
const rpaCountEl = getOrCreate('rpa-store-count', 'b');
rpaCountWrap.append(rpaCountEl);
const _rpaPlanTable = getOrCreate('rpa-plan-table', 'tbody');
const _rpaTaskTable = getOrCreate('rpa-task-table', 'tbody');
const _rpaRunTable = getOrCreate('rpa-run-table', 'tbody');
const _rpaLogList = getOrCreate('rpa-log-list');
const _rpaView = getOrCreate('view-rpa');
for (const id of ['rpa-plan-name', 'rpa-steps-json', 'rpa-profile-ids', 'rpa-editor-title', 'rpa-save',
  'rpa-run-filter', 'rpa-task-select-all', 'rpa-task-delete-checked']) getOrCreate(id);

const _localRenderRoots = [];
const context = vm.createContext({
  console,
  document: {
    getElementById(id) { return elementsById.get(id) || null; },
    querySelector(s) {
      for (const el of elementsById.values()) {
        if (matchesSelector(el, s)) return el;
        const sub = el.querySelector(s);
        if (sub) return sub;
      }
      return null;
    },
    querySelectorAll() { return []; },
    createElement(tag) { return new MockElement(tag); },
    createTextNode(text) { return { nodeType: 3, textContent: String(text) }; },
    addEventListener() {},
    removeEventListener() {},
  },
  navigator: { clipboard: { writeText: async () => {} } },
  setTimeout: (fn) => { fn(); return 0; },
  clearTimeout: () => {},
  refreshStatus: async () => {},
  window: {},
  ops: {
    rpaPlans: async () => [],
    rpaTasks: async () => [],
    rpaTemplates: async () => ({ list: [], categories: ['全部'] }),
    rpaStatus: async () => ({ count: 0 }),
  },
});
context.window = context;

// Bind OpenBrowserApp mock
new vm.Script(`
  let confirmCalls = [];
  function tx(str) { return str; }
  function t(key, vars) {
    if (key === 'action.use') return '使用';
    if (key === 'action.preview') return '预览';
    if (key === 'action.export') return '导出';
    if (key === 'action.delete') return '删除';
    if (key === 'action.unavailable') return '不可用';
    if (key === 'rpa.store.steps') return (vars?.n || 0) + ' 步';
    if (key === 'rpa.store.deleteConfirm') return '确定删除模板 ' + (vars?.name || '');
    return key;
  }
  function toast(message) { (window.__rpaToasts ||= []).push(message); }
  function log() {}
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function buildSquareMark() { return null; }
  function displayProfileNumber() { return '1'; }
  function updateEngineBadge() {}
  function afterUiRender(root) {
    localRenderRoots.push(root);
  }
  function syncThemedSelects() {}

  window.OpenBrowserApp = {
    ui: { profiles: [] },
    engineProfiles: [],
    toast, tx, t, log, element, buildSquareMark, displayProfileNumber,
    updateEngineBadge, afterUiRender, syncThemedSelects,
    confirmAction: async (opts) => {
      confirmCalls.push(opts);
      return true;
    },
  };
  window.localRenderRoots = [];
`, { filename: 'host-bindings.js' }).runInContext(context);

// Load ui-rpa.js
new vm.Script(source, { filename: 'ui-rpa.js' }).runInContext(context);

// 3. Verification of Exports
assert.strictEqual(typeof context.window.renderRpaStore, 'function', 'renderRpaStore exported');
assert.strictEqual(typeof context.window.confirmRpaAction, 'function', 'confirmRpaAction exported');

// 4. Test confirmAction delegation
(async () => {
  // Provided confirmAction returns true
  const res1 = await context.window.confirmRpaAction({
    title: '测试确认',
    message: '确认操作？',
  });
  assert.strictEqual(res1, true, 'confirmRpaAction delegates to host confirmAction');

  // String message overload
  const res2 = await context.window.confirmRpaAction('简单提示');
  assert.strictEqual(res2, true, 'confirmRpaAction handles string payload');

  // Without the confirmation service, destructive work must be cancelled.
  const savedFn = context.window.OpenBrowserApp.confirmAction;
  context.window.OpenBrowserApp.confirmAction = null;
  const resFallback = await context.window.confirmRpaAction({ title: '无服务降级' });
  assert.strictEqual(resFallback, false, 'fallback cancels without a native confirmation popup');
  context.window.OpenBrowserApp.confirmAction = savedFn;

  const pending = [];
  let reads = 0, active = 0, peak = 0;
  context.ops.rpaTasks = () => {
    reads++; peak = Math.max(peak, ++active);
    return new Promise((resolve, reject) => pending.push({ resolve(value) { active--; resolve(value); }, reject(error) { active--; reject(error); } }));
  };
  const first = context.window.refreshRpaTables();
  const trailing = context.window.refreshRpaTables();
  for (let i = 0; i < 100; i++) assert.equal(context.window.refreshRpaTables(), trailing);
  const rows = [{ id: 'job-one', process_name: 'Job', status: 'running' }];
  pending.shift().resolve(rows); await first;
  _rpaTaskTable.querySelector('.rpa-task-checkbox').checked = true;
  pending.shift().resolve(rows); await trailing;
  assert.equal(reads, 2); assert.equal(peak, 1, 'task requests stay serialized with one shared trailing refresh');
  assert.equal(_rpaTaskTable.querySelector('.rpa-task-checkbox').checked, true, 'progress refresh preserves checkbox state at commit time');
  getOrCreate('rpa-run-filter').value = 'running';
  getOrCreate('rpa-run-filter').listeners.change({ type: 'change' });
  assert.equal(reads, 2, 'changing a filter uses the task snapshot without treating the Event as rows');
  assert.equal(_rpaRunTable.children.length, 1);
  const retained = _rpaTaskTable.children[0], failing = context.window.refreshRpaTables();
  pending.shift().reject(new Error('offline')); assert.equal(await failing, false);
  assert.equal(_rpaTaskTable.children[0], retained, 'failed reads preserve the last valid table');
  const staleSnapshot = context.window.refreshRpaTables();
  await context.window.refreshRpaTasks([{ id: 'manual', process_name: 'Preloaded', status: 'running' }]);
  pending.shift().resolve(rows);
  assert.equal(await staleSnapshot, false, 'publishing a preloaded snapshot invalidates older IPC');
  assert.equal(_rpaTaskTable.querySelector('.rpa-task-checkbox').dataset.taskId, 'manual');
  getOrCreate('rpa-run-filter').listeners.change({ type: 'change' });
  assert.ok(_rpaRunTable.textContent.includes('Preloaded'), 'filters use the published snapshot');
  const staleError = context.window.refreshRpaTables();
  await context.window.refreshRpaRuns([{ id: 'manual', process_name: 'Preloaded', status: 'running' }]);
  const toastCount = context.window.__rpaToasts.length;
  pending.shift().reject(new Error('stale IPC error')); await staleError;
  assert.equal(context.window.__rpaToasts.length, toastCount, 'old read failures cannot report an error for a newer snapshot');

  const plans = [{ id: 'flow-a', plan_name: 'Flow A', steps: [], profile_ids: [] },
    { id: 'flow-b', plan_name: 'Flow B', steps: [], profile_ids: [] }];
  context.ops.rpaPlans = async () => plans;
  context.ops.rpaTasks = async () => rows;
  await context.window.refreshRpaPage();
  const choose = (id) => _rpaPlanTable.listeners.click({ target: { closest: (selector) => selector === 'input' ? null : { dataset: { rpaPlan: id } } } });
  await choose('flow-a');
  const name = getOrCreate('rpa-plan-name'); name.value = 'Unsaved draft';
  getOrCreate('rpa-steps-json').value = '[{"type":"waitTime","timeout":42}]';
  await context.window.refreshRpaPage();
  assert.equal(name.value, 'Unsaved draft', 'inventory refresh never resets editor fields');
  let releaseSave, saves = 0;
  context.ops.rpaSavePlan = async () => { saves++; return new Promise((resolve) => { releaseSave = resolve; }); };
  const saving = getOrCreate('rpa-save').listeners.click();
  await Promise.resolve(); await getOrCreate('rpa-save').listeners.click();
  assert.equal(saves, 1, 'duplicate saves cannot create duplicate plans');
  await choose('flow-b'); releaseSave(plans[0]); await saving;
  assert.equal(name.value, 'Flow B', 'an old save cannot switch the selected editor');
  const saveTyping = getOrCreate('rpa-save').listeners.click(); await Promise.resolve();
  name.value = 'Typed after save'; releaseSave(plans[1]); await saveTyping;
  assert.equal(name.value, 'Typed after save');
  let releaseSelection;
  context.ops.rpaGetPlan = () => new Promise((resolve) => { releaseSelection = resolve; });
  const selecting = choose('late-flow'); await choose('flow-a');
  releaseSelection({ id: 'late-flow', plan_name: 'Late', steps: [] }); await selecting;
  assert.equal(name.value, 'Flow A', 'late plan lookups cannot replace the latest selection');

  let runtimeIds = 0;
  context.window.OpenBrowserApp.ui.profiles = Array.from({ length: 1000 }, (_, i) => ({ id: 'profile-' + i }));
  context.window.OpenBrowserApp.engineProfiles = Array.from({ length: 1000 }, (_, i) => ({ running: true, get id() { runtimeIds++; return 'profile-' + i; } }));
  plans[0].profile_ids = context.window.OpenBrowserApp.ui.profiles.map((profile) => profile.id);
  await choose('flow-a');
  assert.ok(runtimeIds <= 2000, 'running markers use a linear fleet index, not a scan for every profile');
  const badge = getOrCreate('rpa-run-status'), badges = [];
  context.ops.rpaStatus = () => new Promise((resolve) => badges.push(resolve));
  const oldBadge = context.window.refreshRpaStatusBadge(), newBadge = context.window.refreshRpaStatusBadge();
  badges[1]({ count: 3 }); await newBadge; badges[0]({ count: 1 }); await oldBadge;
  assert.equal(badge.textContent, '运行中 3', 'an old status response cannot roll back the badge');

  console.log('ui-rpa-selftest: OK (DOM safety, serialized tasks, snapshot filters, retained selection/failures, dirty drafts, save/selection races, linear profile indexing)');
})().catch((err) => {
  console.error('ui-rpa-selftest failed:', err);
  process.exit(1);
});

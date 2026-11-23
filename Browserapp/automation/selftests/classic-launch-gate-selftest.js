'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const fs = require('node:fs/promises');
const { createRequire } = require('node:module');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const app = path.resolve(__dirname, '../..');
const read = name => readFileSync(path.join(app, name), 'utf8');
const requireApp = name => require(path.join(app, name));
const noop = () => {};
const settingsRead = 'system:get-client-settings';
const settingsSave = 'system:save-client-settings';
const info = 'system:info';
const key = suffix => 'system.launchgate.' + suffix;
const files = {
  renderer: read('renderer.js'), main: read('main.js'), preload: read('preload.js'),
  catalog: read('automation/data/locale/i18n-data.js'), i18n: read('i18n.js'), html: read('index.html'),
};

function exact(file, replacements) {
  const filename = path.join(app, file), localRequire = createRequire(filename), module = { exports: {} };
  vm.runInNewContext(`(function(require,module){${read(file)}\n})`,
    { structuredClone, console: { ...console, warn: noop } }, { filename })(
    id => Object.hasOwn(replacements, id) ? replacements[id] : localRequire(id), module,
  );
  return module.exports;
}

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ob-classic-launch-gate-'));
  const file = path.join(root, 'settings.json'), profileRoot = path.join(root, 'profiles');
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const crypto = requireApp('credential-crypto');
  const fixtureKey = { mode: 'fallback', passphrase: 'Synthetic classic launch gate settings key' };
  const storeFs = Object.create(fs);
  const store = exact('automation/local-settings.js', {
    'fs/promises': storeFs, '../credential-crypto': {
      ...crypto, decryptCredential: value => crypto.decryptCredential(value, fixtureKey),
      encryptCredential: value => crypto.encryptCredential(value, fixtureKey),
    },
  });
  store.initLocalSettings({ file, defaultProfileDataRoot: profileRoot });
  await store.loadLocalSettings();
  await store.saveLocalSettings({ memoryLimit: 61, diskLimit: 37 });
  const handlers = new Map(), recorded = [], receipts = [], ready = Promise.withResolvers();
  const registerTrustedIpc = (name, fn) => handlers.set(name, fn);
  const mainStart = files.main.indexOf("  registerTrustedIpc('system:info'");
  const mainEnd = files.main.indexOf('  // The renderer', mainStart);
  assert.ok(mainStart !== -1 && mainEnd > mainStart);
  vm.runInNewContext(files.main.slice(mainStart, mainEnd), {
    registerTrustedIpc, startupReady: ready.promise, app: { getVersion: () => '0.0.0-fixture' },
    store, settingsStore: store, defaultProfileDataRoot: profileRoot, process: { versions: {}, platform: 'linux' },
    engine: undefined, automation: undefined,
  });
  const prepare = () => exact('main/system-ipc.js', { '../automation/local-settings': store }).registerSystemIpc({
    registerTrustedIpc, isQuitting: () => false,
  });
  const held = new Map();
  const hold = method => {
    const gate = { entered: Promise.withResolvers(), release: Promise.withResolvers() };
    assert.equal(held.has(method), false);
    held.set(method, gate);
    return gate;
  };
  const api = () => {
    const exposed = {};
    vm.runInNewContext(files.preload, { require(id) {
      assert.equal(id, 'electron');
      return { contextBridge: { exposeInMainWorld: (name, value) => { exposed[name] = value; } },
        ipcRenderer: { async invoke(method, ...args) {
          assert.ok([info, settingsRead, settingsSave].includes(method), method);
          recorded.push([method, ...structuredClone(args)]);
          const gate = held.get(method); held.delete(method);
          let receipt, error;
          try {
            if (!handlers.has(method)) throw Error('No handler registered for ' + method);
            receipt = structuredClone(await handlers.get(method)({}, ...structuredClone(args)));
          } catch (cause) { error = cause; }
          receipts.push({ method, receipt, error });
          if (gate) {
            gate.entered.resolve({ receipt, error });
            const override = await gate.release.promise;
            if (override instanceof Error) throw override;
            if (override !== undefined) return override;
          }
          if (error) throw error;
          return receipt;
        } } };
    } });
    return exposed.ops;
  };
  const disk = () => fs.readFile(file).then(raw => JSON.parse(crypto.decryptCredential(raw, fixtureKey)));
  return { root, file, api, recorded, receipts, hold, prepare, ready, disk, store,
    failReplacement(value) {
      storeFs.rename = value ? async (src, dest) => {
        if (dest === file) throw Object.assign(Error('ENOSPC at ' + file), { code: 'ENOSPC' });
        return fs.rename(src, dest);
      } : fs.rename;
    },
    saveRequests: () => recorded.filter(([name]) => name === settingsSave).map(([, patch]) => patch),
  };
}

function buildView(f, language = 'zh-CN') {
  const elements = new Map();
  class Element {
    constructor(id) {
      this.id = id;
      const tag = files.html.match(new RegExp('<[^>]+\\bid="' + id + '"[^>]*>'))?.[0];
      this.disabled = /\sdisabled(?:[\s>]|$)/.test(tag ?? '');
      this.hidden = /\shidden(?:[\s>]|$)/.test(tag ?? '');
      this.attrs = Object.fromEntries([...String(tag).matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
      this.dataset = { get i18n() { return this.owner.getAttribute('data-i18n'); }, set i18n(value) {
        this.owner.setAttribute('data-i18n', value);
      }, owner: this };
      this.events = new Map();
      this.textContent = id === 'launch-gate-status' ? '尚未保存。' : '';
      this.value = '';
    }
    get valueAsNumber() {
      return this.value !== '' ? Number(this.value) : NaN;
    }
    getAttribute(name) { return this.attrs[name] ?? null; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    removeAttribute(name) { delete this.attrs[name]; }
    addEventListener(name, fn) { this.events.set(name, fn); }
    reportValidity() { return true; }
    focus() { this.focused = true; }
    fire(name) { return this.events.get(name)?.({ target: this }); }
  }
  for (const id of ['launch-memory-limit', 'launch-disk-limit', 'launch-gate-status', 'launch-gate-badge',
    'launch-gate-save', 'launch-gate-retry', 'launch-gate-card'])
    elements.set(id, new Element(id));
  const get = id => elements.get(id) ?? null;
  const { catalogs: CATALOGS } = vm.runInNewContext(files.catalog + '\nwindow.__OB_I18N_LOCALE_DATA__', { window: {} });
  const translate = token => CATALOGS[language]?.[token] ?? CATALOGS.en[token] ?? token;
  const document = { getElementById: get, documentElement: {}, querySelectorAll: selector =>
    selector.startsWith('[data-i18n]') ? [...elements.values()].filter(el => el.getAttribute('data-i18n')) : [] };
  const extract = (s, name) => {
    const start = s.indexOf('function ' + name + '('), indent = s.slice(s.lastIndexOf('\n', start) + 1, start);
    const end = s.indexOf('\n' + indent + '}', start) + indent.length + 2;
    assert.ok(start >= 0 && end > start);
    return s.slice(start, end);
  };
  let locale;
  const makeLocale = () => vm.runInNewContext(
    extract(files.i18n, 'applyNode') + '\n' + extract(files.i18n, 'applyDom') + '\n({applyDom})',
    { document, Element, resolved: language, t: translate },
  );
  locale = makeLocale();
  const ctx = vm.createContext({ document, window: { ops: f.api(), OpenBrowserI18n: locale },
    t: translate, tx: x => x, renderAppUpdateState: noop, console });
  vm.runInContext(extract(files.renderer, 'refreshLocaleChrome'), ctx);
  const setup = files.renderer.indexOf('async function initialize() {');
  const setupEnd = files.renderer.indexOf("  const appVersion = document.getElementById('app-version');", setup);
  const original = files.renderer.indexOf('// 启动保护（');
  // Baseline attached the numeric handler outside the shell's startup barrier.
  if (original >= 0 && original < setup) vm.runInContext(files.renderer.slice(original, files.renderer.indexOf('// seed group selects', original)), ctx);
  const boot = vm.runInContext(files.renderer.slice(setup, setupEnd) + '\n} initialize()', ctx);
  const fields = { memoryLimit: get('launch-memory-limit'), diskLimit: get('launch-disk-limit') };
  const state = get('launch-gate-status'), save = get('launch-gate-save'), retry = get('launch-gate-retry');
  return { fields, state, save, retry, boot,
    edit(field, value) { fields[field].value = value; fields[field].fire('input'); },
    values() { return Object.values(fields).map(el => String(el.value)); },
    locale(value) { language = value; locale = makeLocale(); ctx.window.OpenBrowserI18n = locale; vm.runInContext('refreshLocaleChrome()', ctx); },
  };
}

const opts = { timeout: 10000 };
const tick = async () => { await nextTurn(); await nextTurn(); };
const boot = async f => {
  f.prepare(); f.ready.resolve();
  const view = buildView(f);
  await view.boot; await tick();
  assert.deepEqual(view.values(), ['61', '37']);
  return view;
};
const status = (view, expected) => assert.equal(view.state.getAttribute('data-i18n'), key(expected), view.state.textContent);

test('numeric card waits for actual shell readiness; safe single-flight retry preserves later field intent', opts, async t => {
  const f = await fixture(t), view = buildView(f);
  await tick();
  assert.deepEqual(f.recorded, [[info]]);
  assert.equal(view.fields.memoryLimit.disabled, true);
  assert.equal(view.save.disabled, true);
  f.prepare(); await tick();
  assert.deepEqual(f.recorded, [[info]]);
  const initial = f.hold(settingsRead);
  f.ready.resolve(); await view.boot;
  await initial.entered.promise;
  initial.release.resolve(Error('fixture path ' + f.file));
  await tick();
  status(view, 'loadFailed');
  assert.equal(view.state.textContent.includes(f.file), false);
  assert.equal(view.retry.hidden, false);
  assert.equal(view.save.disabled, true);
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests(), []);

  const retry = f.hold(settingsRead);
  const first = view.retry.fire('click');
  await retry.entered.promise;
  try {
    assert.equal(view.retry.disabled, true);
    await view.retry.fire('click');
    assert.equal(f.recorded.filter(([name]) => name === settingsRead).length, 2);
    // The native inputs are disabled while reading. Dispatch a synthetic input
    // to verify a later model edit could not be overwritten by this reply.
    view.edit('memoryLimit', '73');
  } finally { retry.release.resolve(); await first; }
  assert.deepEqual(view.values(), ['73', '37']);
  assert.equal(view.save.disabled, false);
  assert.equal(view.fields.diskLimit.disabled, false);
  assert.equal(view.retry.hidden, true);
  status(view, 'dirty');
});

test('no-edit click and return to baseline do not write; save touches only edited numeric fields including zero', opts, async t => {
  const f = await fixture(t), view = await boot(f), other = f.api();
  await other.saveClientSettings({ memoryLimit: 89, diskLimit: 48 });
  assert.equal(view.save.disabled, true);
  await view.save.fire('click');
  view.edit('memoryLimit', '66'); view.edit('memoryLimit', '61');
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests(), [{ memoryLimit: 89, diskLimit: 48 }]);
  assert.deepEqual([(await f.disk()).memoryLimit, (await f.disk()).diskLimit], [89, 48]);

  view.edit('memoryLimit', '75');
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests().at(-1), { memoryLimit: 75 });
  assert.deepEqual([(await f.disk()).memoryLimit, (await f.disk()).diskLimit], [75, 48]);
  assert.deepEqual(view.values(), ['75', '48'], 'an untouched field may show the independently confirmed snapshot');
  status(view, 'saved');
  view.edit('diskLimit', '');
  await view.save.fire('click');
  assert.equal(f.saveRequests().length, 2);
  status(view, 'invalid');
  view.edit('diskLimit', '0');
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests().at(-1), { diskLimit: 0 });
  assert.equal((await f.disk()).diskLimit, 0);
  status(view, 'saved');
});

test('late success and failure cannot overwrite newer independent field drafts or their status', opts, async t => {
  const f = await fixture(t), view = await boot(f);
  view.edit('memoryLimit', '70');
  const old = f.hold(settingsSave), first = view.save.fire('click');
  await old.entered.promise;
  try {
    assert.equal(view.save.disabled, true);
    assert.equal(view.fields.diskLimit.disabled, false);
    view.edit('memoryLimit', '61'); // edited back while 70 was in flight
    view.edit('diskLimit', '26');
    await view.save.fire('click');
    assert.deepEqual(f.saveRequests(), [{ memoryLimit: 70 }]);
  } finally { old.release.resolve(); await first; }
  assert.deepEqual(view.values(), ['61', '26']);
  status(view, 'dirty');
  assert.equal(view.save.disabled, false);
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests().at(-1), { memoryLimit: 61, diskLimit: 26 });
  status(view, 'saved');

  view.edit('memoryLimit', '74'); f.failReplacement(true);
  const failed = f.hold(settingsSave), rejected = view.save.fire('click');
  try {
    assert.equal((await failed.entered.promise).error.code, 'ENOSPC');
    view.edit('memoryLimit', '82');
    status(view, 'dirty');
  } finally { failed.release.resolve(); await rejected; f.failReplacement(false); }
  assert.deepEqual(view.values(), ['82', '26']);
  status(view, 'dirty');
  assert.equal(view.save.disabled, false);
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests().at(-1), { memoryLimit: 82 });
  assert.equal((await f.disk()).memoryLimit, 82);
  status(view, 'saved');
});

test('real coalesced different durable values and ENOSPC are not successful saves in any locale', opts, async t => {
  const f = await fixture(t), view = await boot(f), other = f.api();
  view.edit('memoryLimit', '78');
  const request = view.save.fire('click');
  assert.equal(f.store.getLocalSettings().memoryLimit, 78);
  const contender = other.saveClientSettings({ memoryLimit: 92 });
  assert.equal(f.store.getLocalSettings().memoryLimit, 92);
  await Promise.all([request, contender]);
  assert.equal((await f.disk()).memoryLimit, 92);
  assert.deepEqual(f.receipts.filter(row => row.method === settingsSave).map(row => row.receipt.memoryLimit), [92, 92]);
  assert.deepEqual(view.values(), ['78', '37']);
  status(view, 'superseded');
  const chinese = view.state.textContent;
  view.locale('en');
  status(view, 'superseded');
  assert.notEqual(view.state.textContent, chinese);
  assert.match(view.state.textContent, /saved values differ/i);
  assert.equal(view.save.disabled, false);
  const english = view.state.textContent;
  view.locale('fr');
  status(view, 'superseded');
  assert.equal(view.state.textContent, english, 'untouched catalogs use the existing English fallback');
  view.locale('en');

  f.failReplacement(true);
  try {
    await view.save.fire('click');
    status(view, 'unconfirmed');
    assert.match(view.state.textContent, /not confirmed|could not confirm/i);
    assert.equal(view.state.textContent.includes(f.file), false);
    assert.equal((await other.getClientSettings()).memoryLimit, 78);
    assert.equal((await f.disk()).memoryLimit, 92);
    assert.deepEqual(view.values(), ['78', '37']);
    view.locale('zh-CN');
    status(view, 'unconfirmed');
    assert.match(view.state.textContent, /未.*确认/);
  } finally { f.failReplacement(false); }
  await view.save.fire('click');
  assert.equal((await f.disk()).memoryLimit, 78);
  status(view, 'saved');

  // A failed physical write can make an old confirmed number differ from
  // the live desired one. Returning to it is then a deliberate new intent.
  view.edit('memoryLimit', '81');
  f.failReplacement(true);
  try {
    await view.save.fire('click');
    status(view, 'unconfirmed');
    assert.equal((await other.getClientSettings()).memoryLimit, 81);
    assert.equal((await f.disk()).memoryLimit, 78);
    view.edit('memoryLimit', '78');
    status(view, 'dirty');
    assert.equal(view.save.disabled, false);
  } finally { f.failReplacement(false); }
  await view.save.fire('click');
  assert.deepEqual(f.saveRequests().at(-1), { memoryLimit: 78 });
  assert.equal((await other.getClientSettings()).memoryLimit, 78);
  assert.equal((await f.disk()).memoryLimit, 78);
  status(view, 'saved');
});

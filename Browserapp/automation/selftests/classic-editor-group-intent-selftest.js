'use strict';

const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { parse } = require('acorn');
const { BrowserEngine } = require('../../engine');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { registerProfileIpc } = require('../../main/profile-ipc');
const { LocalService } = require('../../rebuild/local-service');
const commands = require('../../ui/ui-profile-commands');
const { createUiStateStore } = require('../../ui/ui-state-store');

const app = path.resolve(__dirname, '../..');
const read = name => fs.readFile(path.join(app, name), 'utf8');
const noop = () => {};
const forbidden = () => { throw Error('Unexpected out-of-scope fixture operation'); };
const profileId = 'ordinary';
const recovered = { groupId: 'project-from-host', group_name: 'Historical project' };
const local = { id: 'saved-group', name: 'Local group', color: '#123456' };
const lookalike = { id: 'different-id', name: recovered.group_name, color: '#123456' };

function section(source, first, next) {
  const begin = source.indexOf(first);
  const end = source.indexOf(next, begin + 1);
  assert.ok(begin >= 0 && end > begin, first);
  return source.slice(begin, end);
}

function editorSlices(source) {
  const tree = parse(source, { ecmaVersion: 'latest', sourceType: 'script' }).body;
  const named = name => tree.find(item => item.id?.name === name);
  const open = named('showProfileEditor').body.body.filter(item => {
    const expr = item.expression;
    return expr?.left?.name === 'editingProfileId' || expr?.left?.name === 'editingProfileBaseRev' ||
      ['fillGroupSelect', 'beginEditorGroupEdit'].includes(expr?.callee?.name);
  });
  assert.equal(open.length, 3, 'run the actual classic editor snapshot/group initialization wiring');
  const lastReturn = named('editorDraft').body.body.findLast(item => item.type === 'ReturnStatement');
  const fields = lastReturn.argument.arguments[0].properties.filter(item =>
    ['groupId', 'note'].includes(item.key?.name) || item.argument?.callee?.name === 'readEditorGroupFields');
  assert.equal(fields.length, 2, 'run actual classic group and Note draft projection without unrelated browser-editor controls');
  return [
    source.includes('let editorGroupEdit =') ? section(source, 'let editorGroupEdit =', '\nfunction editorDraft') : '',
    'function openGroupFields(profile, revision) {' + open.map(item => source.slice(item.start, item.end)).join('\n') + '}',
    'function readDraft() { const strict = true; return { ...openingProfile, ' +
      fields.map(item => source.slice(item.start, item.end)).join(',') + '}; }',
  ].join('\n');
}

function select() {
  let selected = '';
  const handlers = new Set();
  return {
    options: [],
    get value() { return selected; },
    set value(value) { selected = this.options.some(option => option.value === value) ? value : ''; },
    get selectedIndex() { return this.options.findIndex(option => option.value === selected); },
    replaceChildren() { this.options = []; selected = ''; },
    append(option) { this.options.push(option); if (this.options.length === 1) selected = option.value; },
    addEventListener(event, handler) { assert.equal(event, 'change'); handlers.add(handler); },
    dispatchEvent() { for (const handler of handlers) handler({ target: this, currentTarget: this }); },
    choose(value) { assert.ok(this.options.some(option => option.value === value), 'real choice must exist in the select'); this.value = value; this.dispatchEvent(); },
  };
}

async function fixture(t, { sqlite = false, writable = true, stored = recovered } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-classic-group-intent-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY, supports = ProfileStoreSqlite.isSupported;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
  let engine;
  t.after(async () => {
    engine?.sqliteStore?.close();
    ProfileStoreSqlite.isSupported = supports;
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(root, { recursive: true, force: true });
  });
  async function openEngine() {
    const value = new BrowserEngine({ getPath: () => root });
    value.kernelManager = { loadMeta: async () => {} };
    value.sanitizeProfile = structuredClone; // metadata-only fixture: no production identity normalization
    value.start = forbidden;
    value.stop = forbidden;
    await value.init(null);
    assert.equal(value.usingSqlite, sqlite);
    return value;
  }
  engine = await openEngine();
  await engine.commitProfiles([{ id: profileId, name: 'Ordinary', number: 1, note: 'Before', ...stored }]);
  const channels = new Map();
  registerProfileIpc({ engine, registerTrustedIpc: (name, fn) => channels.set(name, fn), sanitizeIds: forbidden, beforeRemove: forbidden });
  const permitted = new Set(['profiles:editor-state', 'profiles:apply-commands', 'profiles:status']);
  const trace = [];
  const bridge = {};
  vm.runInNewContext(await read('preload.js'), { require(name) {
    assert.equal(name, 'electron');
    return {
      contextBridge: { exposeInMainWorld: (key, value) => { bridge[key] = value; } },
      ipcRenderer: { invoke: async (name, ...args) => {
        assert.ok(permitted.has(name), 'only ordinary editor IPC may dispatch');
        trace.push(name);
        return structuredClone(await channels.get(name)({}, ...structuredClone(args)));
      } },
    };
  } });
  const renderer = await read('renderer.js'), editor = await read('ui/ui-editor.js');
  const initialRaw = JSON.stringify({ groups: [local, lookalike], profiles: [{ id: 'unconfirmed-history' }], logs: [] }, null, 2);
  let raw = initialRaw;
  const notices = [], errors = [], conflicts = [];
  const main = select(), footer = select(), note = { value: '' }, form = { dataset: {} };
  const nodes = new Map([
    ['#editor-group', main], ['#editor-footer-group', footer], ['#editor-note', note], ['#profile-editor-form', form],
    ['#group-edit-id', { value: local.id }], ['#group-name', { value: local.name }],
    ['#group-color', { value: local.color }], ['#group-note', { value: '' }],
  ]);
  const ctx = vm.createContext({
    window: { ops: bridge.ops }, ui: { profiles: [], groups: structuredClone([local, lookalike]) },
    $: key => nodes.get(key), document: { createElement: () => ({}), getElementById: key => nodes.get('#' + key) },
    Event: class {},
    GROUP_COLORS: ['#123456'], profileListCache: { invalidate: noop }, syncThemedSelect: noop,
    t: key => key, tx: key => key, toast: value => notices.push(value), localizeSystemLabel: value => value,
    createGroupId: forbidden, invalidateViewCache: noop, renderGroupsPage: noop, renderProfiles: noop,
    editingProfileId: null, editingProfileBaseRev: 0, profileCacheWritable: writable, UNGROUPED_ID: '',
  });
  ctx.uiStateStore = createUiStateStore({
    read: () => raw, write: value => { raw = value; }, getState: () => ctx.ui,
    canWrite: () => ctx.profileCacheWritable, fallback: () => ({ profiles: [], groups: [], logs: [] }),
  });
  vm.runInContext([
    section(renderer, 'function normalizeGroup(', '\nfunction migrateGroups'),
    section(renderer, 'let __groupListCache =', '\nfunction localizeSystemLabel'),
    section(renderer, 'function fillGroupSelect(', '\nfunction displayProfileNumber'),
    section(renderer, 'function save() {', '\n// Profile cache writes stay gated'),
    section(await read('ui/ui-groups.js'), 'function saveLocalGroups(', '\nasync function deleteGroup'),
    editorSlices(editor),
    section(await read('ui/ui-workbench.js'), "document.getElementById('editor-footer-group')?.addEventListener", "\n    document.getElementById('templates-new-btn')"),
  ].join('\n'), ctx);
  const editorApi = vm.runInContext('({ openGroupFields, readDraft, saveGroupFromDialog })', ctx);
  const openEditor = commands.createProfileEditorOpener({ readSnapshot: bridge.ops.profileForEdit,
    show({ profile, rev }) {
      ctx.openingProfile = structuredClone(profile);
      ctx.ui.profiles = [structuredClone(profile)];
      note.value = profile.note;
      editorApi.openGroupFields(profile, rev);
    } });
  const submit = commands.createProfileEditorSubmit({
    getSession: () => ({ id: ctx.editingProfileId, baseRev: ctx.editingProfileBaseRev }),
    getProfiles: () => ctx.ui.profiles, readDraft: () => editorApi.readDraft(), ops: bridge.ops,
    publish(row) { ctx.ui.profiles = [row]; vm.runInContext('save()', ctx); },
    setRows: noop, normalize: structuredClone, onSaved: noop, onWarning: forbidden,
    onError: error => errors.push(error.message), onConflict: error => conflicts.push(error.code),
  });
  return {
    main, footer, note, trace, conflicts, errors,
    originalRaw: initialRaw, raw: () => raw,
    live: () => engine.profileForEdit(profileId).profile,
    async open() { assert.equal(await openEditor.open(profileId), true); },
    submit: () => submit({ preventDefault: noop, currentTarget: form }),
    refill(name) { nodes.get('#group-name').value = name; editorApi.saveGroupFromDialog(); },
    removeVisibleGroup(id) { ctx.ui.groups = ctx.ui.groups.filter(group => group.id !== id); },
    replaceVisibleProfile(fields) { Object.assign(ctx.ui.profiles[0], fields); },
    changeHost: fields => engine.commitProfiles([{ ...engine.profileForEdit(profileId).profile, ...fields }]),
    async reopen() {
      engine.sqliteStore?.close();
      engine = await openEngine();
      return engine.profileForEdit(profileId).profile;
    },
    async roundtrip() {
      const filename = path.join(app, 'rebuild/routes/transfer.js'), imports = createRequire(filename);
      const routes = { exports: [] };
      vm.runInNewContext('(function(require,module){' + await read('rebuild/routes/transfer.js') + '\n})', { Buffer })(
        key => key === '../../engine/profile-sanitizer' ? { sanitizeProfile: structuredClone } : imports(key), routes);
      const handlers = new Map(routes.exports.map(([name, fn]) => [name, fn]));
      const output = path.join(root, 'roundtrip.json');
      const service = Object.assign(Object.create(LocalService.prototype), {
        engine, queue: Promise.resolve(), file: path.join(root, 'local.json'), window: () => null,
        dialog: { showSaveDialog: async () => ({ canceled: false, filePath: output }),
          showOpenDialog: async () => ({ canceled: false, filePaths: [output] }) },
      });
      await service.load();
      assert.equal((await handlers.get('transfer:export')(service, { ids: [profileId] })).count, 1);
      const [packet] = JSON.parse(await fs.readFile(output, 'utf8')).profiles;
      assert.equal((await handlers.get('transfer:import')(service)).count, 1);
      const created = [...engine.profiles.values()].find(row => row.id !== profileId);
      return { packet, created, groups: service.data.groups };
    },
  };
}

const assertPair = (row, pair, message) => assert.deepEqual([row.groupId, row.group_name], [pair.groupId, pair.group_name], message);

test('Note-only edit retains the unknown revision-bound group pair and protected classic bytes',
  { skip: !ProfileStoreSqlite.isSupported() }, async t => {
    const f = await fixture(t, { sqlite: true, writable: false });
    await f.open();
    f.replaceVisibleProfile({ groupId: lookalike.id, group_name: 'Mutable display row is not the edit snapshot' });
    f.note.value = 'Changed only note';
    assert.equal(await f.submit(), true);
    const reopened = await f.reopen();
    assert.equal(reopened.note, 'Changed only note');
    assertPair(reopened, recovered, 'do not infer an ungroup or match another group by label');
    assert.equal(f.raw(), f.originalRaw);
    assert.equal(f.main.value, recovered.groupId);
    assert.equal(f.footer.value, recovered.groupId);
  });

test('Group dialog refill during editing preserves missing and newly chosen selections', async t => {
  const f = await fixture(t);
  await f.open();
  f.refill('Rename unrelated group');
  assert.equal(f.main.value, recovered.groupId, 'group save must not drop the selected unknown entry');
  assert.equal(f.footer.value, recovered.groupId);
  f.footer.choose(local.id);
  assert.equal(f.main.value, local.id);
  assert.equal(f.footer.value, local.id);
  f.refill('Authoritative renamed local group');
  f.note.value = 'Explicit move';
  assert.equal(await f.submit(), true);
  assertPair(await f.reopen(), { groupId: local.id, group_name: 'Authoritative renamed local group' });
});

test('An explicitly chosen group that leaves the catalog is not saved as ungrouped', async t => {
  const f = await fixture(t);
  await f.open();
  f.main.choose(lookalike.id);
  f.removeVisibleGroup(lookalike.id);
  f.refill('Refresh without the selected target');
  assert.equal(f.main.value, lookalike.id);
  assert.ok(f.main.options.find(option => option.value === lookalike.id)?.disabled);
  assert.equal(await f.submit(), false);
  assert.equal(f.trace.includes('profiles:apply-commands'), false);
  assert.equal(f.errors.length, 1);
  assertPair(f.live(), recovered);
  f.main.choose(recovered.groupId);
  f.note.value = 'Keep the original after all';
  assert.equal(await f.submit(), true);
  assertPair(await f.reopen(), recovered);
});

test('Explicitly ungrouping a known row clears the old label; file exchange does not restore it', async t => {
  const f = await fixture(t, { stored: { groupId: local.id, group_name: local.name } });
  await f.open();
  assert.equal(f.main.value, local.id);
  f.main.choose('');
  f.note.value = 'Explicit ungroup';
  assert.equal(await f.submit(), true);
  const pair = { groupId: '', group_name: '' };
  assertPair(await f.reopen(), pair, 'explicit ungroup clears both assignment fields');
  const { packet, created, groups } = await f.roundtrip();
  assertPair(packet, pair);
  assertPair(created, pair);
  assert.deepEqual(groups, []);
});

test('Known untouched association remains unchanged and a genuine stale revision still rejects', async t => {
  const stored = { groupId: local.id, group_name: 'Stored label may differ from current catalog' };
  const f = await fixture(t, { stored });
  await f.open();
  f.note.value = 'Retain known pair';
  assert.equal(await f.submit(), true);
  assertPair(f.live(), stored);
  await f.open();
  await f.changeHost({ note: 'Changed in another view', ...recovered });
  f.note.value = 'Old editor note';
  assert.equal(await f.submit(), false);
  assert.deepEqual(f.conflicts, ['PROFILE_STALE_REV']);
  assert.equal(f.live().note, 'Changed in another view');
  assertPair(f.live(), recovered);
});

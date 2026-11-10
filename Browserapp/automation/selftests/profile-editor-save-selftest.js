'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ipc = require('../../shared/ipc-result');
const commands = require('../../ui/ui-profile-commands');
const { sanitizeInjectionScript } = require('../../engine/cdp-hardening');

// Execute the real renderer event binding with injected desktop capabilities.
const renderer = fs.readFileSync(path.join(__dirname, '../../renderer.js'), 'utf8');
const start = renderer.indexOf("$('#profile-editor-form').addEventListener('submit'");
const end = renderer.indexOf("\n$('#batch-add').", start);
assert.ok(start >= 0 && end > start);
function harness({ apply, linkProxy = false, latest = { id: 'a', name: 'A', note: 'Engine update' } } = {}) {
  const initial = { id: 'a', name: 'A', proxy: 'Direct', note: 'Original' };
  const state = { saves: 0, calls: [], toasts: [], switched: 0 };
  let submit;
  const form = { dataset: {}, addEventListener(_event, handler) { submit = handler; } };
  const context = {
    ui: { profiles: [initial] }, editingProfileId: 'a', editingProfileBaseRev: 1,
    engineProfiles: [{ id: 'a', rev: 1 }], editorNetworkResult: null,
    $: (selector) => selector === '#profile-editor-form' ? form : { checked: linkProxy },
    editorDraft: () => ({ ...initial, note: 'Draft', proxy: linkProxy ? 'http://203.0.113.1:80' : 'Direct' }),
    save() { state.saves += 1; }, invalidateViewCache() {}, renderProfiles() {},
    normalizeProfileSettings: (value) => value, displayProfileNumber: () => 1,
    isDirectProxy: (proxy) => proxy === 'Direct', parseProxyInputForUi: () => ({ host: '203.0.113.1', port: 80 }),
    refreshProxies: async () => {}, profileEngine: () => ({}),
    switchView() { state.switched += 1; }, tx: (value) => value, toast: (value) => state.toasts.push(value), log() {},
    console: { warn() {} },
    window: { OpenBrowserProfileCommands: commands, OpenBrowserIpcResult: ipc, ops: {
      async applyProfileCommands(batch) { state.calls.push(batch); return apply ? apply(batch) : ipc.captureIpcResult(() => [{ id: 'a', rev: state.calls.length + 1 }]); },
      profileForEdit: async () => ipc.captureIpcResult(() => ({ profile: latest, rev: 2 })),
      profileStatus: async () => [{ id: 'a', rev: 2 }],
      proxyCreate: async () => ({ id: 'library' }),
      syncProfiles() { throw new Error('editor must not resubmit the fleet'); },
    } },
  };
  vm.runInNewContext(renderer.slice(start, end), context);
  return { state, context, form, submit: () => submit({ currentTarget: form, preventDefault() {} }) };
}

async function main() {
  const failed = harness({ apply: () => ipc.captureIpcResult(() => { throw new Error('disk failed'); }) });
  await failed.submit();
  assert.equal(failed.state.saves, 0);
  assert.equal(failed.context.ui.profiles[0].note, 'Original');
  assert.match(failed.state.toasts[0], /disk failed/);
  assert.equal(failed.form.dataset.saving, undefined);

  const conflicted = harness({ apply: () => ipc.captureIpcResult(() => { throw Object.assign(new Error('stale'), { code: 'PROFILE_STALE_REV' }); }) });
  await conflicted.submit();
  assert.equal(conflicted.state.calls.length, 1, 'no stale draft retry');
  assert.equal(conflicted.context.ui.profiles[0].note, 'Engine update', 'reopening uses authoritative fields');
  assert.equal(conflicted.context.editingProfileBaseRev, 1, 'a still-open old draft is not granted a fresh revision');

  let complete;
  const pending = harness({ apply: () => new Promise((resolve) => { complete = resolve; }) });
  const saving = pending.submit();
  await pending.submit();
  assert.equal(pending.state.calls.length, 1, 'double submission shares the in-flight guard');
  assert.equal(pending.state.saves, 0);
  pending.context.ui.profiles.unshift({ id: 'b', name: 'B' });
  pending.context.editingProfileId = 'b';
  complete(await ipc.captureIpcResult(() => [{ id: 'a', rev: 2 }]));
  await saving;
  assert.equal(pending.context.ui.profiles.find((profile) => profile.id === 'a').note, 'Draft', 'commit resolves the current index by ID');
  assert.equal(pending.context.ui.profiles[0].id, 'b');
  assert.equal(pending.context.editingProfileId, 'b', 'completion cannot close a different editor');
  assert.equal(pending.state.switched, 0);

  const linked = harness({ linkProxy: true });
  await linked.submit();
  assert.equal(linked.state.calls.length, 2);
  assert.equal(linked.state.calls[1][0].baseRev, 2);
  assert.equal(linked.context.ui.profiles[0].proxyId, 'library');
  assert.equal(linked.state.calls[1][0].profile.id, 'a');

  const repaired = sanitizeInjectionScript('const matches = /^Mozilla//.test("Mozilla/5.0");');
  assert.doesNotThrow(() => new vm.Script(repaired), 'legacy UA regex repair emits a literal escaped slash');
  assert.equal(sanitizeInjectionScript(repaired), repaired, 'script repair is idempotent');
  console.log('PROFILE_EDITOR_SAVE_SELFTEST OK (real submit handler, failures, conflict refresh, duplicate saves, reordered rows, proxy linking, script syntax)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

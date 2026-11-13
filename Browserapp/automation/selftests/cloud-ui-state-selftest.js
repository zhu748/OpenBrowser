'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject, called: false };
}

async function main() {
  const elements = new Map();
  for (const id of ['enabled', 'auto-quit', 'include-data', 'provider', 'restore-mode', 'passphrase', 'local-dir',
    'webdav-url', 'webdav-user', 'webdav-pass', 'webdav-dir', 'gh-owner', 'sync-badge', 'sync-status',
    'save-cfg', 'backup-now', 'restore-now']) {
    elements.set('cloud-' + id, { value: '', textContent: '', checked: true, disabled: false, listeners: {},
      addEventListener(type, handler) { this.listeners[type] = handler; } });
  }
  const element = (id) => elements.get('cloud-' + id);
  const document = { getElementById: (id) => elements.get(id) || null,
    querySelector: (selector) => elements.get(selector.slice(1)) || null, querySelectorAll: () => [] };
  const ui = { profiles: [{ id: 'one', advanced: { cloudBackup: true } }], groups: [] };
  const toasts = [], queues = new Map();
  let server = { enabled: true, provider: 'local', local: { dir: 'initial' } };
  const plan = (method) => { const next = deferred(); const queue = queues.get(method) || []; queue.push(next); queues.set(method, queue); return next; };
  const ops = {};
  for (const method of ['cloudGetConfig', 'cloudSetConfig', 'cloudBackup', 'cloudRestore', 'cloudProfilePush', 'cloudProfilePull']) {
    ops[method] = async (value) => {
      const next = queues.get(method)?.shift();
      if (next) { next.called = true; return next.promise; }
      return structuredClone(method === 'cloudSetConfig' ? value : server);
    };
  }
  const window = { ops, $: document.querySelector, OpenBrowserApp: { ui, toast: (message) => toasts.push(message),
    tx: (value) => value, log() {}, afterUiRender() {}, renderProfiles() {}, confirmAction: async () => true } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../../ui/ui-cloud'), 'utf8'), {
    window, document, save() {}, normalizeProfileSettings: (value) => value, refreshProxies: async () => {},
  });
  const click = (id) => element(id).listeners.click({ currentTarget: element(id) });
  const drain = () => new Promise((resolve) => setImmediate(resolve));
  await window.refreshCloudPanel();
  assert.equal(element('local-dir').textContent, 'initial');

  const old = plan('cloudGetConfig'), latest = plan('cloudGetConfig');
  const oldRead = window.refreshCloudPanel(), latestRead = window.refreshCloudPanel();
  latest.resolve({ ...server, local: { dir: 'latest' } }); await latestRead;
  old.resolve({ ...server, local: { dir: 'old' } }); assert.equal(await oldRead, false);
  assert.equal(element('local-dir').textContent, 'latest', 'out-of-order reads cannot roll back the form');

  const dirty = plan('cloudGetConfig'), dirtyRead = window.refreshCloudPanel();
  element('provider').value = 'webdav'; element('webdav-url').value = 'https://new.example.test/dav';
  dirty.resolve({ ...server, lastSyncAt: 'read-completed' }); await dirtyRead;
  assert.equal(element('provider').value, 'webdav');
  assert.equal(element('webdav-url').value, 'https://new.example.test/dav', 'typing while loading wins over the read');

  const staleError = plan('cloudGetConfig'), staleRead = window.refreshCloudPanel();
  await window.refreshCloudPanel();
  const status = element('sync-status').textContent;
  staleError.reject(new Error('STALE_READ_ERROR')); assert.equal(await staleRead, false);
  assert.equal(element('sync-status').textContent, status);
  const invalid = plan('cloudGetConfig'), invalidRead = window.refreshCloudPanel();
  invalid.resolve(null); assert.equal(await invalidRead, false);
  assert.equal(element('local-dir').textContent, 'initial', 'invalid replies preserve the last good form');

  element('passphrase').value = 'saved value';
  const saved = plan('cloudSetConfig'), save = click('save-cfg');
  element('passphrase').value = 'unsaved typing'; saved.resolve(server); await save;
  assert.equal(element('passphrase').value, 'unsaved typing', 'save acknowledgements cannot erase subsequent typing');
  assert.equal(element('save-cfg').disabled, false);

  const backup = plan('cloudBackup'), backingUp = click('backup-now'); await drain();
  assert.equal(backup.called, true);
  element('provider').value = 'github'; element('gh-owner').value = 'new-owner';
  backup.resolve({ cloud: { ...server, lastSyncAt: 'backup-completed' }, meta: { profileCount: 1, bytes: 512 } }); await backingUp;
  assert.equal(element('provider').value, 'github'); assert.equal(element('gh-owner').value, 'new-owner');
  assert.match(element('sync-status').textContent, /backup-completed/, 'completion status still updates during edits');
  assert.equal(element('sync-badge').textContent, '已同步');

  const restore = plan('cloudRestore'), restoring = click('restore-now'); await drain();
  assert.equal(restore.called, true);
  element('webdav-user').value = 'typed-during-restore';
  server = { ...server, lastSyncAt: 'restore-completed', webdav: { username: 'old-user' } };
  restore.resolve({ profiles: [{ id: 'one', title: 'restored', advanced: { cloudBackup: true } }], groups: [] }); await restoring;
  assert.equal(element('webdav-user').value, 'typed-during-restore', 'the post-restore read retains the original operation snapshot');
  assert.equal(ui.profiles[0].title, 'restored');
  assert.match(element('sync-status').textContent, /restore-completed/);

  const push = plan('cloudProfilePush'), pushing = window.pushProfilesToCloud(['one']); await drain();
  assert.equal(push.called, true);
  element('passphrase').value = 'typed-during-push';
  push.resolve({ cloud: { ...server, passphrase: 'old-passphrase', lastSyncAt: 'push-completed' }, results: [] }); await pushing;
  assert.equal(element('passphrase').value, 'typed-during-push');
  assert.match(element('sync-status').textContent, /push-completed/);
  assert.ok(toasts.length > 0);
  console.log('CLOUD_UI_STATE_SELFTEST OK (latest reads, dirty forms, invalid replies, save/backup/restore/push races, live completion status)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

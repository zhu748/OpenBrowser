'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const credentials = require('../../credential-crypto');
const { AgentStateStore } = require('../../rebuild/agent-state-store');

async function crashBeforeCommit(root, legacy) {
  await fs.mkdir(root);
  const original = credentials.encryptCredentialJson(legacy);
  await fs.writeFile(path.join(root, 'state.enc'), original);
  const script = `
    const fs=require('node:fs/promises'),path=require('node:path');
    const {AgentStateStore}=require(${JSON.stringify(require.resolve('../../rebuild/agent-state-store'))});
    const root=process.argv[1],rename=fs.rename;
    fs.rename=async(from,to)=>{if(to===path.join(root,'state.enc')){
      await fs.writeFile(path.join(root,'at-commit'),'ready');
      setInterval(()=>{},1000);await new Promise(()=>{});
    }return rename(from,to);};
    (async()=>{const store=new AgentStateStore(root),data=await store.load();
      data.config.model='uncommitted child';await store.save(data);})().catch(e=>{console.error(e);process.exitCode=1});
  `;
  const child = spawn(process.execPath, ['-e', script, root], { env: process.env, stdio: ['ignore', 'ignore', 'pipe'] });
  const closed = new Promise(resolve => child.once('close', resolve));
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  try {
    const deadline = Date.now() + 15000;
    while (!await fs.stat(path.join(root, 'at-commit')).then(() => true, () => false)) {
      if (child.exitCode !== null || Date.now() > deadline) throw Error('child did not reach commit: ' + stderr);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    child.kill('SIGKILL'); await closed;
    assert.deepEqual(await fs.readFile(path.join(root, 'state.enc')), original, 'a killed writer must not publish a partial migration');
    const recovered = new AgentStateStore(root), data = await recovered.load();
    assert.deepEqual(data, legacy);
    await recovered.save(data);
    assert.equal((await fs.readdir(path.join(root, 'records'))).length, legacy.conversations.length + legacy.logs.length,
      'successful migration removes orphan bodies from the interrupted attempt');
  } finally { if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await closed; } }
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-records-'));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  const legacy = { version: 1, eventProtocolVersion: 2, config: { apiKey: 'PRIVATE_API_KEY' },
    conversations: Array.from({ length: 40 }, (_, i) => ({ id: 'c' + i, title: 'Conversation ' + i,
      messages: [{ id: 'm' + i, content: 'PRIVATE_MESSAGE'.repeat(1000) }], checkpoint: { fullAccess: false, allowedProfileIds: ['allowed'] } })),
    logs: [{ id: 'run', status: 'success', events: [{ sequence: 1 }], messages: [{ content: 'PRIVATE_LOG' }] }],
    templates: [], tasks: [], skills: [] };
  const original = credentials.encryptCredentialJson(legacy);
  await fs.writeFile(path.join(root, 'state.enc'), original);
  const store = new AgentStateStore(root);
  try {
    const data = await store.load();
    assert.deepEqual(data, legacy);
    await store.save(data);
    assert.deepEqual(await fs.readFile(path.join(root, 'state.legacy.enc')), original, 'migration preserves original encrypted bytes');
    const manifest = credentials.decryptCredentialJson(await fs.readFile(path.join(root, 'state.enc')));
    assert.equal(manifest.version, 2);
    assert.equal(manifest.conversations.length, 40);
    assert.ok(!JSON.stringify(manifest).includes('PRIVATE_MESSAGE'));
    for (const entry of await fs.readdir(path.join(root, 'records'))) {
      const raw = await fs.readFile(path.join(root, 'records', entry));
      assert.ok(credentials.isEncrypted(raw));
      assert.ok(!raw.includes(Buffer.from('PRIVATE_')));
    }
    const reopened = new AgentStateStore(root), loaded = await reopened.load();
    assert.equal(reopened.stats.bodyReads, 0, 'listing metadata does not decrypt historical bodies');
    loaded.conversations.map(row => row.title);
    loaded.config.model = 'metadata-only';
    await reopened.save(loaded, { conversations: [], logs: [] });
    assert.equal(reopened.stats.lastWrite.records, 0);
    assert.equal(reopened.stats.bodyReads, 0);
    assert.equal(loaded.conversations[0].messages[0].content, legacy.conversations[0].messages[0].content);
    loaded.conversations[0].messages.push({ id: 'new', content: 'NEW_PRIVATE_TEXT' });
    await reopened.save(loaded, { conversations: ['c0'], logs: [] });
    assert.equal(reopened.stats.lastWrite.records, 1, 'one conversation update writes one body');
    assert.equal(reopened.stats.bodyReads, 1);
    const committed = await fs.readFile(path.join(root, 'state.enc'));
    const rename = fs.rename;
    loaded.conversations[0].messages.push({ id: 'unsaved', content: 'must not commit' });
    fs.rename = async (from, to) => {
      if (to === path.join(root, 'state.enc')) throw Object.assign(Error('injected commit failure'), { code: 'EIO' });
      return rename(from, to);
    };
    try { await assert.rejects(reopened.save(loaded), /commit failure/); }
    finally { fs.rename = rename; }
    assert.deepEqual(await fs.readFile(path.join(root, 'state.enc')), committed);
    const afterFailure = await new AgentStateStore(root).load();
    assert.equal(afterFailure.conversations[0].messages.length, 2);
    loaded.conversations[0].messages.pop();
    await reopened.save(loaded);
    assert.equal(reopened.stats.lastWrite.records, 0, 'failed writes do not poison the body fingerprint cache');
    assert.deepEqual(loaded.conversations[0].checkpoint, legacy.conversations[0].checkpoint);

    // Freeze a body and its metadata before asynchronous record writes.
    loaded.conversations[0].messages.push({ id: 'snapshot', content: 'before write' });
    const writing = reopened.save(loaded, { conversations: ['c0'], logs: [] });
    loaded.conversations[0].messages.at(-1).content = 'later live event';
    loaded.config.model = 'later config';
    await writing;
    const frozen = await new AgentStateStore(root).load();
    assert.equal(frozen.conversations[0].messages.at(-1).content, 'before write');
    assert.equal(frozen.config.model, 'metadata-only');
    for (let i = 0; i < 34; i++) {
      loaded.conversations[0].messages.at(-1).content = 'revision ' + i;
      await reopened.save(loaded, { conversations: ['c0'], logs: [] });
    }
    await reopened.collect();
    const files = await fs.readdir(path.join(root, 'records'));
    assert.ok(files.length <= 42, 'GC retains current and previous records, not every historical rewrite');
    const previousRaw = await fs.readFile(path.join(root, 'state.previous.enc'));
    const previousRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-previous-'));
    try {
      await fs.cp(path.join(root, 'records'), path.join(previousRoot, 'records'), { recursive: true });
      await fs.writeFile(path.join(previousRoot, 'state.enc'), previousRaw);
      assert.equal((await new AgentStateStore(previousRoot).load()).conversations[0].messages.at(-1).content, 'revision 32');
    } finally { await fs.rm(previousRoot, { recursive: true, force: true }); }

    const currentIndex = credentials.decryptCredentialJson(await fs.readFile(path.join(root, 'state.enc')));
    const bodyFile = path.join(root, 'records', currentIndex.conversations[0].body.key + '.enc');
    const raw = await fs.readFile(bodyFile);
    const other = await fs.readFile(path.join(root, 'records', currentIndex.conversations[1].body.key + '.enc'));
    await fs.writeFile(bodyFile, other);
    const swapped = await new AgentStateStore(root).load();
    assert.throws(() => swapped.conversations[0].messages, /identity/, 'ciphertexts cannot be swapped between conversations');
    await fs.writeFile(bodyFile, Buffer.from('damaged'));
    const damaged = await new AgentStateStore(root).load();
    assert.throws(() => damaged.conversations[0].messages, /JSON|Unexpected|record|OBE1|格式/);
    await fs.writeFile(bodyFile, raw);
    await fs.rm(bodyFile);
    await assert.rejects(new AgentStateStore(root).load(), /missing/);
    await fs.writeFile(bodyFile, raw);
    await fs.rm(path.join(root, 'state.enc'));
    await assert.rejects(new AgentStateStore(root).load(), /index is missing/);

    const emptyRoot = path.join(root, 'empty-store');
    await fs.mkdir(emptyRoot);
    const empty = new AgentStateStore(emptyRoot);
    await empty.load();
    await empty.save({ version: 1, config: {}, conversations: [], logs: [] });
    await fs.rm(path.join(emptyRoot, 'state.enc'));
    await assert.rejects(new AgentStateStore(emptyRoot).load(), /index is missing/, 'even an empty established store must not reset after index loss');

    const concurrencyRoot = path.join(root, 'concurrency');
    await fs.mkdir(concurrencyRoot);
    const owner = new AgentStateStore(concurrencyRoot);
    await owner.load();
    await owner.save({ version: 1, config: { model: 'initial' }, conversations: [], logs: [] });
    const stale = new AgentStateStore(concurrencyRoot), staleData = await stale.load();
    await owner.save({ version: 1, config: { model: 'newer session' }, conversations: [], logs: [] });
    staleData.config.model = 'stale overwrite';
    await assert.rejects(stale.save(staleData), { code: 'AGENT_STORE_CHANGED' });
    assert.equal((await new AgentStateStore(concurrencyRoot).load()).config.model, 'newer session');
    await crashBeforeCommit(path.join(root, 'interrupted-migration'), legacy);
    console.log('AGENT_STATE_STORE OK (encrypted migration, lazy history, bounded writes, snapshot isolation, rollback/retry, GC, recovery and fail-closed reads)');
  } finally {
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

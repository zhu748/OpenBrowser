'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { BrowserEngine } = require('../../engine');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { ProxyStore } = require('../proxy-store');
const ops = require('../cloud-ops');
const stateStore = require('../cloud/restore-state');

const interrupted = `
const fs=require('node:fs/promises'),path=require('node:path');
const appRoot=process.argv[1],root=process.argv[2],phase=process.argv[3];
const {BrowserEngine}=require(appRoot+'/engine');
const {ProfileStoreSqlite}=require(appRoot+'/automation/profile-store-sqlite');
const {ProxyStore}=require(appRoot+'/automation/proxy-store');
const {prepareFileRestore}=require(appRoot+'/automation/cloud/file-restore');
const journal=require(appRoot+'/automation/cloud/restore-state');
(async()=>{
 const engine=new BrowserEngine({getPath:()=>root});
 engine.usingSqlite=true;engine.sqliteStore=new ProfileStoreSqlite({dbPath:engine.dbFile});await engine.sqliteStore.init();
 for(const p of engine.sqliteStore.getAllProfiles())engine.profiles.set(p.id,p);
 const proxies=new ProxyStore(path.join(root,'proxies.json'));await proxies.load();
 const settings=JSON.parse(await fs.readFile(path.join(root,'settings.json'),'utf8'));
 const state=journal.captureRestoreState(engine,['p','new'],proxies,settings,true);
 await journal.saveRestoreState(engine,state);
 const tx=await prepareFileRestore([{root:engine.profileRoot('p'),files:{'Network/Cookies':Buffer.from('remote-file').toString('base64')}}]);
 if(phase==='prepare')process.exit(71);
 state.records=tx.recoveryRecords;state.phase='pending';await journal.saveRestoreState(engine,state);await tx.commit();
 await proxies.replaceAll([{id:'remote-proxy',raw:'http://127.0.0.1:8081'}]);
 await fs.writeFile(path.join(root,'settings.json'),JSON.stringify({uiGroups:[{id:'remote-group'}]}));
 await engine.syncProfiles([{id:'p',name:'Remote'},{id:'new',name:'New'}]);
 if(phase==='committed'){state.phase='committed';await journal.saveRestoreState(engine,state);}
 process.exit(71);
})().catch(e=>{console.error(e);process.exit(1)});`;

async function scenario(phase, root) {
  const engine = new BrowserEngine({ getPath: () => root });
  engine.usingSqlite = true;
  engine.sqliteStore = new ProfileStoreSqlite({ dbPath: engine.dbFile });
  await engine.sqliteStore.init();
  await engine.syncProfiles([{ id: 'p', name: 'Local' }]); engine.sqliteStore.close();
  const proxies = new ProxyStore(path.join(root, 'proxies.json'));
  await proxies.replaceAll([{ id: 'local-proxy', raw: 'http://127.0.0.1:8080' }]);
  const settingsFile = path.join(root, 'settings.json');
  await fs.writeFile(settingsFile, JSON.stringify({ uiGroups: [{ id: 'local-group' }] }));
  const target = path.join(engine.profileRoot('p'), 'Default/Network/Cookies');
  await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, 'local-file');
  const child = spawnSync(process.execPath, ['-e', interrupted, path.resolve(__dirname, '../..'), root, phase], { env: process.env, encoding: 'utf8', timeout: 10000 });
  assert.equal(child.status, 71, child.stderr);
  const restarted = new BrowserEngine({ getPath: () => root });
  restarted.usingSqlite = true;
  restarted.sqliteStore = new ProfileStoreSqlite({ dbPath: restarted.dbFile }); await restarted.sqliteStore.init();
  for (const profile of restarted.sqliteStore.getAllProfiles()) restarted.profiles.set(profile.id, profile);
  await proxies.load();
  let settings = JSON.parse(await fs.readFile(settingsFile, 'utf8'));
  ops.initCloudOps({ getEngine: () => restarted, getAutomation: () => ({ proxyStore: proxies }),
    getSettings: () => settings, saveSettings: async (value) => { settings = value; await fs.writeFile(settingsFile, JSON.stringify(value)); } });
  try {
    assert.equal(await ops.recoverPendingRestore({ proxyStore: proxies }), true);
    assert.equal(restarted.profiles.get('p').name, phase === 'committed' ? 'Remote' : 'Local');
    assert.equal(restarted.profiles.has('new'), phase === 'committed');
    assert.equal(await fs.readFile(target, 'utf8'), phase === 'committed' ? 'remote-file' : 'local-file');
    assert.equal(proxies.list()[0].id, phase === 'committed' ? 'remote-proxy' : 'local-proxy');
    assert.equal(settings.uiGroups[0].id, phase === 'committed' ? 'remote-group' : 'local-group');
    assert.equal(await stateStore.readRestoreState(restarted), null);
    assert.equal(await ops.recoverPendingRestore({ proxyStore: proxies }), false, 'recovery is idempotent');
  } finally { restarted.sqliteStore.close(); }
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-journal-'));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'key');
  try {
    for (const phase of ['prepare', 'pending', 'committed']) {
      const directory = path.join(root, phase); await fs.mkdir(directory);
      await scenario(phase, directory);
    }
    console.log('RESTORE_JOURNAL_SELFTEST OK (process exit, SQLite, files, proxies, settings, rollback/commit recovery, idempotence)');
  } finally {
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE; else process.env.OPENBROWSER_MASTER_KEY_FILE = oldKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

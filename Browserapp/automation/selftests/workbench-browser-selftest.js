'use strict';
/* global selectedSessions, refreshExtensions, openAssign, applyAssignment, extensions */

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const cdp = require('../../cdp');
const { chooseChromiumBinary, Unavailable } = require('./native-gate-harness');
const appRoot = path.resolve(__dirname, '../..');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let browser;
  try { browser = chooseChromiumBinary(); }
  catch (error) { if (error instanceof Unavailable) { console.log('SKIP ' + error.message); process.exitCode = 2; return; } throw error; }
  const preload = await fs.readFile(path.join(appRoot, 'preload.js'), 'utf8');
  const workbench = await fs.readFile(path.join(appRoot, 'ui/ui-workbench.js'), 'utf8');
  const methods = new Set([...preload.matchAll(/^  (\w+):/gm)].map((match) => match[1]));
  for (const match of workbench.matchAll(/window\.ops\??\.(\w+)/g)) assert.ok(methods.has(match[1]), 'workbench calls missing preload method: ' + match[1]);
  const fixture = await fs.readFile(path.join(appRoot, 'automation/ui-audit-bridge.js'), 'utf8');
  const script = fixture + `
    window.__reviewToasts=[];window.__accounts=new Map();window.__proxies=[];
    window.__kernels=[
      {engine:'chromium',version:'156.0.8078.80',name:'Chrome for Testing 156.0.8078.80',path:'/fixture/chrome',binaryExists:true},
      {engine:'firefox',version:'160.0',name:'Firefox 160.0',path:'/fixture/firefox',binaryExists:true}
    ];
    bridge.kernelListInstalled=async()=>structuredClone(window.__kernels);
    localStorage.setItem('openbrowser-platform-accounts-v1',JSON.stringify([{id:'legacy',username:'legacy@example.test',password:'LEGACY_PASSWORD',totpSecret:'LEGACY_TOTP'}]));
    const metadata=a=>{const {password,totpSecret,...rest}=a;return {...rest,hasPassword:!!password,hasTotpSecret:!!totpSecret};};
    bridge.accountList=async()=>[...window.__accounts.values()].map(metadata);
    bridge.accountGet=async id=>{if(!window.__accounts.has(id))throw Error('missing account');return structuredClone(window.__accounts.get(id));};
    bridge.accountImport=async values=>{if(window.__failAccounts)throw Error('ACCOUNT_WRITE_FAILED');for(const a of values)window.__accounts.set(a.id,structuredClone(a));return bridge.accountList();};
    bridge.accountDelete=async id=>{window.__accounts.delete(id);return bridge.accountList();};
    window.__transfers=new Map();
    localStorage.setItem('openbrowser-window-transfers-v1',JSON.stringify([{id:'legacy-transfer',transferCode:'OBTRF1:LEGACY_CODE',snapshot:{cookies:'LEGACY_COOKIE'}}]));
    bridge.transferList=async()=>[...window.__transfers.values()];
    bridge.transferImport=async values=>{for(const value of values)window.__transfers.set(value.id,structuredClone(value));return bridge.transferList();};
    bridge.transferDelete=async id=>{window.__transfers.delete(id);return bridge.transferList();};
    bridge.proxyCreate=async value=>{if(value.host==='failure.example.test')throw Error('PROXY_WRITE_FAILED');window.__proxies.push(value);return value;};
    bridge.proxyList=async()=>window.__proxies;
    bridge.startCookieWarmup=async value=>{window.__warmup=value;return {taskId:'cookie-task'};};
    bridge.cloudBackup=async()=>{throw Error('REMOTE_UPLOAD_FAILED');};
    bridge.syncProfiles=async profiles=>{if(window.__failProfiles)throw Error('PROFILE_WRITE_FAILED');window.__uiAuditSavedProfiles=profiles.map(p=>({...p,rev:1}));return window.__uiAuditSavedProfiles;};
    bridge.startProfile=async p=>{window.__startCalls=(window.__startCalls||0)+1;return p;};
    bridge.stopProfile=async()=>{window.__stopCalls=(window.__stopCalls||0)+1;return {};};
    window.__marketInstalled=[];window.__settings={defaultPreferences:{openWorkbench:true,ipChangeRemind:true,googleLogin:false}};
    bridge.extensionList=async()=>structuredClone(window.__marketInstalled);
    bridge.appCenterList=async()=>({list:{builtin:[],local:[],recommended:[{id:'rec-phantom',name:'Phantom',category:'web3',store_url:'https://chromewebstore.google.com/detail/bfnaelmomeimhlpmgjnjophhpkkoljpa',extension_id:window.__marketInstalled[0]?.id,status:window.__marketInstalled[0]?.enabledAll?'enabled':'available'}]}});
    bridge.addExtensionStore=async()=>{if(window.__failExtension)throw Error('EXTENSION_INSTALL_FAILED');window.__marketInstalled=[{id:'installed-wallet',name:'Phantom'}];return {extension:window.__marketInstalled[0]};};
    bridge.toggleExtensionAll=async(id,enabled)=>{window.__marketInstalled.find(e=>e.id===id).enabledAll=enabled;return {success:true};};
    bridge.getClientSettings=async()=>structuredClone(window.__settings);
    bridge.saveClientSettings=async patch=>{if(window.__failSettings)throw Error('SETTINGS_WRITE_FAILED');window.__settings={...window.__settings,defaultPreferences:{...window.__settings.defaultPreferences,...patch.defaultPreferences}};return structuredClone(window.__settings);};
    bridge.windowAction=async(ids,action,options)=>{window.__matrixRequest={ids,action,options};return {success:true,count:ids.length};};
    const saveSettings=bridge.saveClientSettings;
    bridge.saveClientSettings=async patch=>{const value=await saveSettings(patch);if(window.__blockPreference&&'openWorkbench' in patch.defaultPreferences){window.__blockPreference=false;await new Promise(r=>window.__releasePreference=r);}return value;};
    const listExtensions=bridge.extensionList;
    bridge.extensionList=async()=>{window.__extensionReads=(window.__extensionReads||0)+1;window.__maxExtensionReads=Math.max(window.__maxExtensionReads||0,window.__extensionReads);try{const value=await listExtensions();if(window.__blockExtensionRead){window.__blockExtensionRead=false;await new Promise(r=>window.__releaseExtensionRead=r);}return value;}finally{window.__extensionReads--;}};
    bridge.assignExtension=async()=>{if(window.__blockAssignment){window.__blockAssignment=false;await new Promise(r=>window.__releaseAssignment=r);}return {restartRequired:[]};};
    const readEditor=bridge.profileForEdit;
    bridge.profileForEdit=async id=>{const value=await readEditor(id);if(window.__blockEditor){window.__blockEditor=false;await new Promise(r=>window.__releaseEditor=r);}return value;};
    const apply=bridge.applyProfileCommands;
    bridge.applyProfileCommands=async(...args)=>{const value=await apply(...args);if(window.__blockSave){window.__blockSave=false;await new Promise(r=>window.__releaseSave=r);}return value;};
    const readAccount=bridge.accountGet;
    bridge.accountGet=async id=>{const value=await readAccount(id);if(window.__blockAccount){window.__blockAccount=false;await new Promise(r=>window.__releaseAccount=r);}return value;};
    // Unknown methods stay undefined, matching the frozen production preload.
    window.ops=Object.freeze({...bridge});
  `;
  const mime = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
  const server = http.createServer(async (req, res) => {
    const file = path.resolve(appRoot, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(appRoot + path.sep)) { res.writeHead(403); res.end(); return; }
    try { res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file)); }
    catch (_) { res.writeHead(404); res.end(); }
  });
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-workbench-ui-'));
  let connection, child;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    child = spawn(browser.binary, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + root, 'about:blank'], { stdio: 'ignore' });
    let port, tab;
    for (let i = 0; i < 100; i++) {
      try {
        port = Number((await fs.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
        tab = (await cdp.tabs(port)).find((value) => value.type === 'page');
        if (tab) break;
      } catch (_) { /* browser starting */ }
      await delay(50);
    }
    assert.ok(tab, 'Chromium did not expose a page');
    connection = await cdp.connect(tab.webSocketDebuggerUrl);
    await connection.command('Page.enable', {});
    await connection.command('Page.addScriptToEvaluateOnNewDocument', { source: script });
    await connection.command('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/' });
    const evaluate = async (fn) => {
      const result = await connection.command('Runtime.evaluate', { expression: '(' + fn.toString() + ')()', awaitPromise: true, returnByValue: true }, { timeout: 15000 });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result?.value;
    };
    await delay(250);
    const ready = await evaluate(async () => {
      for (let i = 0; i < 150 && !window.OpenBrowserApp?.whenReady; i++) await new Promise((r) => setTimeout(r, 20));
      await window.OpenBrowserApp.whenReady();
      for (let i = 0; i < 150 && !document.querySelector('[data-acc-id="legacy"]'); i++) await new Promise((r) => setTimeout(r, 20));
      const old = window.toast; window.toast = (...args) => { window.__reviewToasts.push(args[0]); return old(...args); };
      return { errors: window.__uiAuditErrors, migrated: localStorage.getItem('openbrowser-platform-accounts-v1') === null,
        migratedTransfers: localStorage.getItem('openbrowser-window-transfers-v1') === null, passwordAttribute: !!document.querySelector('[data-acc-pass]') };
    });
    assert.deepEqual(ready.errors, []);
    assert.equal(ready.migrated, true);
    assert.equal(ready.migratedTransfers, true);
    assert.equal(ready.passwordAttribute, false);
    const kernels = await evaluate(async () => {
      const sleep = () => new Promise((resolve) => setTimeout(resolve, 80));
      window.openWorkbenchEditorMode('single');
      document.querySelector('#editor-engine-visual button[data-engine-val="firefox"]').click();
      await window.refreshEditorKernelVersions();
      const select = document.getElementById('editor-engine-version');
      const firefoxOptions = [...select.options].map((option) => option.value);
      select.value = '160.0';
      // An OS change must not reset the independently selected kernel version.
      const os = document.getElementById('editor-os');
      os.value = 'Linux'; os.dispatchEvent(new Event('change', { bubbles: true }));
      const afterOsChange = select.value;
      document.getElementById('editor-title').value = 'Selected Firefox kernel';
      document.getElementById('profile-editor-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      await sleep();
      const profile = window.ui.profiles.find((item) => item.title === 'Selected Firefox kernel');
      // Reopen Firefox while the form currently contains Chrome options.
      document.querySelector('#editor-engine-visual button[data-engine-val="chromium"]').click();
      await window.openProfileEditor(profile.id);
      await window.refreshEditorKernelVersions();
      const reopened = { engine: document.getElementById('editor-engine').value, version: select.value };
      window.__kernels.push({ engine: 'firefox', version: '161.0', name: 'Firefox 161.0', path: '/fixture/new-firefox', binaryExists: true });
      await window.refreshEditorKernelVersions();
      const installedAppeared = [...select.options].some((option) => option.value === '161.0');
      select.value = '160.0';
      window.__kernels = window.__kernels.filter((item) => item.version !== '160.0');
      await window.refreshEditorKernelVersions();
      return { firefoxOptions, afterOsChange, saved: profile.engineVersion, reopened, installedAppeared,
        deleted: { value: select.value, label: select.selectedOptions[0].textContent } };
    });
    assert.deepEqual(kernels.firefoxOptions, ['latest', '160.0']);
    assert.equal(kernels.afterOsChange, '160.0');
    assert.equal(kernels.saved, '160.0');
    assert.deepEqual(kernels.reopened, { engine: 'firefox', version: '160.0' });
    assert.equal(kernels.installedAppeared, true);
    assert.equal(kernels.deleted.value, '160.0');
    assert.match(kernels.deleted.label, /未安装|Not installed/i);
    const batch = await evaluate(async () => {
      const before = window.ui.profiles.length;window.openWorkbenchEditorMode('batch');document.getElementById('editor-batch-count').value='3';
      document.getElementById('profile-editor-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await new Promise(r=>setTimeout(r,80));
      return {mode:window.currentEditorMode,created:window.ui.profiles.length-before};
    });
    assert.deepEqual(batch, { mode: 'batch', created: 3 });
    assert.equal(await evaluate(() => document.querySelectorAll('#editor-device-mockup svg').length), 2, 'fixed icon SVG must remain markup while user content remains text');
    const proxy = await evaluate(async () => {
      document.getElementById('pa-host').value='127.0.0.1';document.getElementById('pa-port').value='1080';document.getElementById('pa-save-single-btn').click();await new Promise(r=>setTimeout(r,80));
      return {count:window.__proxies.length,toast:window.__reviewToasts.at(-1)};
    });
    assert.equal(proxy.count, 1);
    assert.match(proxy.toast, /已保存/);
    const failed = await evaluate(async () => {
      window.openWorkbenchEditorMode('single');const before=window.ui.profiles.length;window.__failProfiles=true;
      document.getElementById('profile-editor-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await new Promise(r=>setTimeout(r,80));window.__failProfiles=false;
      return {rows:window.ui.profiles.length-before,toast:window.__reviewToasts.at(-1)};
    });
    assert.equal(failed.rows, 0); assert.match(failed.toast, /PROFILE_WRITE_FAILED/);
    const accounts = await evaluate(async () => {
      document.getElementById('aa-username').value='secure@example.test';document.getElementById('aa-password').value='NEW_SECRET';document.getElementById('aa-2fa').value='NEW_TOTP';document.getElementById('aa-remark').value='<b id="injected-account">test</b>';
      document.getElementById('aa-save-btn').click();await new Promise(r=>setTimeout(r,80));
      return {stored:window.__accounts.size,plaintext:JSON.stringify({...localStorage}).includes('NEW_SECRET'),injected:!!document.getElementById('injected-account'),domSecret:document.body.innerHTML.includes('NEW_SECRET')};
    });
    assert.equal(accounts.stored, 2);assert.equal(accounts.plaintext,false);assert.equal(accounts.injected,false);assert.equal(accounts.domSecret,false);
    const exported = await evaluate(async () => {
      window.selectedProfiles.clear();window.selectedProfiles.add(window.ui.profiles[0].id);let blob;const old=URL.createObjectURL,oldClick=HTMLAnchorElement.prototype.click;
      URL.createObjectURL=(value)=>{blob=value;return old(value);};HTMLAnchorElement.prototype.click=()=>{};
      try {document.getElementById('upload-window-pack-btn').click();return JSON.parse(await blob.text()).count;}
      finally {URL.createObjectURL=old;HTMLAnchorElement.prototype.click=oldClick;}
    });
    assert.equal(exported,1);
    const transfer = await evaluate(async () => {
      const profile=window.ui.profiles[0];profile.platform={...profile.platform,password:'TRANSFER_PASSWORD'};profile.cookies='TRANSFER_COOKIE';
      const dialog=document.getElementById('transfer-window-dialog');dialog.dataset.transferIds=JSON.stringify([profile.id]);
      document.getElementById('transfer-inc-cookies').checked=false;document.getElementById('transfer-inc-accounts').checked=false;document.getElementById('transfer-inc-proxy').checked=false;
      document.getElementById('transfer-window-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await new Promise(r=>setTimeout(r,80));
      const code=document.getElementById('transfer-generated-code').value;
      const bundle=JSON.parse(decodeURIComponent(escape(atob(code.slice(7)))));
      return {records:window.__transfers.size,profiles:bundle.profiles.length,cookies:bundle.profiles[0].cookies,password:bundle.profiles[0].platform.password,
        plaintext:JSON.stringify({...localStorage}).includes('TRANSFER_PASSWORD'),badge:!!document.querySelector('#transfer-records-tbody .status')};
    });
    assert.deepEqual(transfer,{records:2,profiles:1,cookies:'',password:'',plaintext:false,badge:true});
    const imported = await evaluate(async () => {
      const file=new File(['平台网址,登录账号,登录密码,2FA密钥,备注\nhttps://example.test/,csv@example.test,"pass,withcomma",TOTP,"multi\nline"\n'],'accounts.csv',{type:'text/csv'});
      const data=new DataTransfer();data.items.add(file);const input=document.getElementById('aa-import-file-input');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));
      const account=[...window.__accounts.values()].find(a=>a.username==='csv@example.test');return {password:account.password,totp:account.totpSecret,remark:account.remark};
    });
    assert.deepEqual(imported,{password:'pass,withcomma',totp:'TOTP',remark:'multi\nline'});
    const warmup = await evaluate(async () => {
      document.getElementById('cookie-robot-dialog').dataset.profileId=window.ui.profiles[0].id;document.getElementById('cookie-robot-urls').value='https://example.test/';
      document.getElementById('cookie-robot-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await new Promise(r=>setTimeout(r,80));
      return {urls:window.__warmup.urls,toast:window.__reviewToasts.at(-1)};
    });
    assert.deepEqual(warmup.urls,['https://example.test/']);assert.match(warmup.toast,/cookie-task/);
    const cloud = await evaluate(async () => {document.getElementById('upload-window-cloud-btn').click();await new Promise(r=>setTimeout(r,80));return window.__reviewToasts.at(-1);});
    assert.match(cloud,/REMOTE_UPLOAD_FAILED/);assert.ok(!cloud.includes('已将'));
    const importPolicy = await evaluate(async () => {
      window.openWorkbenchEditorMode('import');
      const radio=document.querySelector('input[name="editor-network"][value="custom"]');radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('editor-proxy-host').value='proxy.test';document.getElementById('editor-proxy-port').value='1080';
      document.getElementById('editor-platform-pass').value='DO_NOT_INHERIT';
      window.pendingImportedRows.push({title:'explicit-direct',proxy:'Direct',password:'',cookies:'',totpSecret:'',tag:'remove-test'});
      document.getElementById('profile-editor-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await new Promise(r=>setTimeout(r,100));
      const profile=window.ui.profiles.find(p=>p.title==='explicit-direct');
      return {proxy:profile.proxy,mode:profile.networkMode,password:profile.platform.password,totp:profile.platform.totpSecret,cookies:profile.cookies};
    });
    assert.deepEqual(importPolicy,{proxy:'Direct',mode:'direct',password:'',totp:'',cookies:''});
    const tags = await evaluate(async () => {
      document.getElementById('profile-tags-manager-btn').click();document.querySelector('[data-tm-del="remove-test"]').click();await new Promise(r=>setTimeout(r,100));
      document.getElementById('tags-manager-dialog').close();
      return {local:window.ui.profiles.find(p=>p.title==='explicit-direct').tag,stored:window.__uiAuditSavedProfiles.find(p=>p.title==='explicit-direct').tag};
    });
    assert.deepEqual(tags,{local:'',stored:''});
    const market = await evaluate(async () => {
      await refreshExtensions();window.__failExtension=true;const input=document.querySelector('[data-ext-toggle="rec-phantom"]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,100));
      const failed={checked:document.querySelector('[data-ext-toggle="rec-phantom"]').checked,toast:document.getElementById('toast').textContent};
      window.__failExtension=false;const next=document.querySelector('[data-ext-toggle="rec-phantom"]');next.checked=true;next.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,100));
      return {failed,enabled:window.__marketInstalled[0]?.enabledAll,checked:document.querySelector('[data-ext-toggle="rec-phantom"]').checked};
    });
    assert.equal(market.failed.checked,false);assert.match(market.failed.toast,/EXTENSION_INSTALL_FAILED/);assert.equal(market.enabled,true);assert.equal(market.checked,true);
    const defaults = await evaluate(async () => {
      document.querySelector('#global-default-workbench [data-gpref="close"]').click();await new Promise(r=>setTimeout(r,100));
      window.__failSettings=true;document.querySelector('#global-default-workbench [data-gpref="open"]').click();await new Promise(r=>setTimeout(r,100));window.__failSettings=false;
      return {stored:window.__settings.defaultPreferences.openWorkbench,selected:document.querySelector('#global-default-workbench .active').dataset.gpref,toast:document.getElementById('toast').textContent};
    });
    assert.equal(defaults.stored,false);assert.equal(defaults.selected,'close');assert.match(defaults.toast,/SETTINGS_WRITE_FAILED/);
    const matrix = await evaluate(async () => {
      selectedSessions.add('matrix-fixture');
      document.getElementById('sync-grid-rows').value='1';document.getElementById('sync-grid-cols').value='2';document.getElementById('sync-grid-gap').value='17';
      document.getElementById('sync-apply-matrix-btn').click();await new Promise(r=>setTimeout(r,100));return window.__matrixRequest;
    });
    assert.equal(matrix.action,'matrix');assert.deepEqual(matrix.options,{rows:1,cols:2,gap:17});
    const fresh = await evaluate(() => {
      const form=document.getElementById('profile-editor-form');form.dataset.fingerprintSeed='previous-identity';
      document.getElementById('editor-platform-pass').value='PREVIOUS_ACCOUNT';
      window.openWorkbenchEditorMode('single');
      return {password:document.getElementById('editor-platform-pass').value,seed:form.dataset.fingerprintSeed||'',version:form.dataset.fingerprintVersion};
    });
    assert.deepEqual(fresh,{password:'',seed:'',version:'2'});
    const extensionRefresh = await evaluate(async () => {
      window.__maxExtensionReads=0;window.__blockExtensionRead=true;const first=refreshExtensions();
      for(let i=0;i<100&&!window.__releaseExtensionRead;i++)await new Promise(r=>setTimeout(r,10));
      window.__marketInstalled[0].version='latest-visible';const second=refreshExtensions();
      window.__releaseExtensionRead();await Promise.all([first,second]);
      return {concurrency:window.__maxExtensionReads,version:extensions[0].version};
    });
    assert.deepEqual(extensionRefresh,{concurrency:1,version:'latest-visible'});
    const assignmentRace = await evaluate(async () => {
      openAssign('installed-wallet');document.querySelector('#assign-profile-list input').checked=true;
      window.__blockAssignment=true;const pending=applyAssignment(true);
      for(let i=0;i<100&&!window.__releaseAssignment;i++)await new Promise(r=>setTimeout(r,10));
      document.getElementById('assign-dialog').close();openAssign('installed-wallet');
      window.__releaseAssignment();await pending;
      const open=document.getElementById('assign-dialog').open;document.getElementById('assign-dialog').close();return open;
    });
    assert.equal(assignmentRace,true,'an old assignment reply must not close a reopened dialog');
    const preferenceRace = await evaluate(async () => {
      window.__blockPreference=true;document.querySelector('#global-default-workbench [data-gpref="open"]').click();
      for(let i=0;i<100&&!window.__releasePreference;i++)await new Promise(r=>setTimeout(r,10));
      document.querySelector('#global-default-ip-remind [data-gpref="close"]').click();await new Promise(r=>setTimeout(r,80));
      window.__releasePreference();await new Promise(r=>setTimeout(r,80));
      return {workbench:document.querySelector('#global-default-workbench .active').dataset.gpref,ip:document.querySelector('#global-default-ip-remind .active').dataset.gpref};
    });
    assert.deepEqual(preferenceRace,{workbench:'open',ip:'close'});
    const lateEditor = await evaluate(async () => {
      const id=window.ui.profiles.find(p=>p.title==='explicit-direct').id;
      window.__blockEditor=true;const pending=window.openProfileEditor(id);
      for(let i=0;i<100&&!window.__releaseEditor;i++)await new Promise(r=>setTimeout(r,10));
      window.openWorkbenchEditorMode('single');window.__releaseEditor();await pending;
      return {mode:window.currentEditorMode,title:document.getElementById('editor-mode-title').textContent};
    });
    assert.equal(lateEditor.mode,'single');
    const lateSave = await evaluate(async () => {
      const id=window.ui.profiles.find(p=>p.title==='explicit-direct').id;
      await window.openProfileEditor(id);window.__blockSave=true;
      document.getElementById('profile-editor-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
      for(let i=0;i<100&&!window.__releaseSave;i++)await new Promise(r=>setTimeout(r,10));
      await window.openProfileEditor(id);document.getElementById('editor-title').value='Unsaved new session';
      window.__releaseSave();await new Promise(r=>setTimeout(r,100));
      return {view:document.querySelector('.view.active').id,title:document.getElementById('editor-title').value};
    });
    assert.deepEqual(lateSave,{view:'view-profile-editor',title:'Unsaved new session'});
    const accountRace = await evaluate(async () => {
      window.openWorkbenchEditorMode('single');const selector=document.getElementById('editor-account-pool-select');
      window.__blockAccount=true;selector.value='legacy';selector.dispatchEvent(new Event('change',{bubbles:true}));
      for(let i=0;i<100&&!window.__releaseAccount;i++)await new Promise(r=>setTimeout(r,10));
      window.openWorkbenchEditorMode('single');window.__accounts.get('legacy').password='NEW_ACCOUNT_VALUE';
      selector.value='legacy';selector.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));
      window.__releaseAccount();await new Promise(r=>setTimeout(r,80));
      return document.getElementById('editor-platform-pass').value;
    });
    assert.equal(accountRace,'NEW_ACCOUNT_VALUE');
    const uploadRace = await evaluate(async () => {
      window.openWorkbenchEditorMode('import');const api=window.OpenBrowserProfileCommands,read=api.readImportFile;
      let release;api.readImportFile=async file=>file.name==='slow.json'?new Promise(r=>release=r):read(file);
      const input=document.getElementById('window-upload-input');const data=new DataTransfer();data.items.add(new File(['[]'],'slow.json'));input.files=data.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));window.openWorkbenchEditorMode('single');
      release('[{"title":"Late upload"}]');await new Promise(r=>setTimeout(r,80));api.readImportFile=read;
      return window.pendingImportedRows.length;
    });
    assert.equal(uploadRace,0);
    const limits = await evaluate(async () => {
      window.openWorkbenchEditorMode('import');const input=document.getElementById('window-upload-input');
      const upload=async(content,name)=>{const data=new DataTransfer();data.items.add(new File([content],name));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));return {rows:window.pendingImportedRows.length,toast:document.getElementById('toast').textContent};};
      return [await upload(JSON.stringify(Array.from({length:5001},()=>({title:'oversized'}))),'oversized.json'),await upload(Array(5001).fill('title|https://example.test/').join('\n'),'oversized.txt')];
    });
    for(const limit of limits){assert.equal(limit.rows,0);assert.match(limit.toast,/5000/);}
    assert.deepEqual(await evaluate(()=>window.__uiAuditErrors),[]);
    console.log('WORKBENCH_BROWSER_SELFTEST OK (installed kernel selection/reopen/refresh, strict preload, migration, batch, proxy persistence, failure rollback, text escaping, selected export, CSV, real task submission, honest cloud errors)');
  } finally {
    connection?.close();
    if (child && child.exitCode === null) { child.kill('SIGKILL'); await new Promise((resolve) => child.once('close', resolve)); }
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

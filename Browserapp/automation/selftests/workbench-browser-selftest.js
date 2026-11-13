'use strict';

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
    assert.deepEqual(await evaluate(()=>window.__uiAuditErrors),[]);
    console.log('WORKBENCH_BROWSER_SELFTEST OK (strict preload, migration, batch, proxy persistence, failure rollback, text escaping, selected export, CSV, real task submission, honest cloud errors)');
  } finally {
    connection?.close();
    if (child && child.exitCode === null) { child.kill('SIGKILL'); await new Promise((resolve) => child.once('close', resolve)); }
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

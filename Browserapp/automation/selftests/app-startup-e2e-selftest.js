'use strict';

// Linux real-main startup gate. Runs in an isolated userData directory and
// exercises the actual startup barrier, preload and version-checked IPC.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const cdp = require('../../cdp');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const headless = process.env.OPENBROWSER_TEST_ELECTRON_HEADLESS === '1';
  if (process.platform !== 'linux' || (!process.env.DISPLAY && !headless)) {
    console.log('SKIP real-main startup gate requires Linux and DISPLAY or OPENBROWSER_TEST_ELECTRON_HEADLESS=1'); process.exitCode = 2; return;
  }
  const electron = require('electron');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-app-startup-'));
  const child = spawn(electron, ['--no-sandbox', ...(headless ? ['--ozone-platform=headless'] : []), '--remote-debugging-port=0', '.'], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0',
      XDG_CONFIG_HOME: path.join(root, 'config'), XDG_DATA_HOME: path.join(root, 'data'), XDG_CACHE_HOME: path.join(root, 'cache'),
      OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'master.key'), OPENBROWSER_FP_LOG: path.join(root, 'fp.log') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '', connection, browser;
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { output = (output + chunk).slice(-16000); });
  const exited = new Promise((resolve) => child.once('close', resolve));
  try {
    let port, tab;
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null || child.signalCode !== null) throw new Error('App exited before readiness: ' + output);
      try {
        port = Number((await fs.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
        tab = (await cdp.tabs(port)).find((entry) => /index\.html/.test(entry.url));
        if (tab) break;
      } catch (_) { /* app is still starting */ }
      await delay(100);
    }
    assert.ok(tab, 'real app did not expose its UI: ' + output);
    connection = await cdp.connect(tab.webSocketDebuggerUrl);
    const evaluated = await connection.command('Runtime.evaluate', {
      expression: `(async () => {
        while (!window.OpenBrowserApp?.whenReady) await new Promise(r=>setTimeout(r,20));
        const ready = await window.OpenBrowserApp.whenReady();
        if (!ready) return {ready,logs:window.OpenBrowserApp.ui.logs};
        for(let i=0;i<100&&typeof window.openWorkbenchEditorMode!=='function';i++)await new Promise(r=>setTimeout(r,20));
        const before=window.OpenBrowserApp.ui.profiles.length;
        window.openWorkbenchEditorMode('batch');document.getElementById('editor-batch-count').value='2';
        document.getElementById('profile-editor-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
        for(let i=0;i<150&&window.OpenBrowserApp.ui.profiles.length<before+2;i++)await new Promise(r=>setTimeout(r,20));
        const uiIds=window.OpenBrowserApp.ui.profiles.map(p=>p.id);
        const durableIds=new Set((await window.ops.profileStatus()).map(p=>p.id));
        const uiBatchCreated=uiIds.length-before;
        const uiBatchPersisted=uiIds.every(id=>durableIds.has(id));
        const created = await window.ops.syncProfiles([{id:'startup-test',name:'Startup test',number:999}],{delta:true});
        const row=created[0];
        await window.ops.syncProfiles([{...row,title:'Saved after boot'}],{delta:true});
        let staleRejected=false;
        try { await window.ops.syncProfiles([row],{delta:true}); } catch (_) { staleRejected=true; }
        const first=await window.ops.profileStatusDelta(null);
        const idle=await window.ops.profileStatusDelta(first.cursor);
        await window.refreshApiMcpPage();
        const apiInfo=await window.ops.localApiInfo(),mcp=JSON.parse(document.getElementById('mcp-config-json').textContent);
        const apiConfigConsistent=Number(mcp.mcpServers['openbrowser-local-api'].env.OPENBROWSER_API_PORT)===apiInfo.port
          && apiInfo.port>0&&!document.getElementById('mcp-copy-config').disabled;
        const accounts=await window.ops.accountImport([{id:'startup-account',username:'startup@example.test',password:'STARTUP_PASSWORD_SENTINEL',totpSecret:'STARTUP_TOTP_SENTINEL'}]);
        const revealed=await window.ops.accountGet('startup-account');
        const transfers=await window.ops.transferImport([{id:'startup-transfer',transferCode:'OBTRF1:STARTUP_TRANSFER_SENTINEL',status:'pending',createdAt:new Date().toISOString()}]);
        for(let i=0;i<50&&!window.OpenBrowserApp.ui.profiles.some(p=>p.id==='startup-test'&&p.title==='Saved after boot');i++)await new Promise(r=>setTimeout(r,20));
        return {ready,created:created.length,staleRejected,cursor:typeof first.cursor,idleRows:idle.rows.length,apiConfigConsistent,
          uiBatchCreated,uiBatchPersisted,uiUnique:new Set(uiIds).size===uiIds.length,
          accountRoundTrip:accounts.length===1&&!('password' in accounts[0])&&accounts[0].hasPassword&&revealed.password==='STARTUP_PASSWORD_SENTINEL',
          transferRoundTrip:transfers.length===1&&transfers[0].id==='startup-transfer',
          visible:window.OpenBrowserApp.ui.profiles.some(p=>p.id==='startup-test'&&p.title==='Saved after boot')};
      })()`, awaitPromise: true, returnByValue: true,
    }, { timeout: 30000 });
    assert.equal(evaluated.exceptionDetails, undefined, JSON.stringify(evaluated.exceptionDetails));
    assert.deepEqual(evaluated.result.value, { ready: true, created: 1, staleRejected: true, cursor: 'string', idleRows: 0, apiConfigConsistent: true,
      uiBatchCreated: 2, uiBatchPersisted: true, uiUnique: true,
      accountRoundTrip: true, transferRoundTrip: true, visible: true });
    await delay(300);
    await connection.command('Runtime.evaluate', { expression: `uiStateStore.flush();localStorage.setItem('openbrowser-ui-state',JSON.stringify({
      degraded:true,profiles:[{id:'startup-test',title:'UNSAFE_TRIMMED'}],logs:[],
      groups:[{id:'quota-custom',name:'Quota preserved group',color:'#123456'}],pane:'wide'
    }));`, returnByValue: true });
    await connection.command('Page.reload'); await delay(300);
    const restored = await connection.command('Runtime.evaluate', { expression: `(async()=>{
      while(!window.OpenBrowserApp?.whenReady)await new Promise(r=>setTimeout(r,20));
      await window.OpenBrowserApp.whenReady();
      const state=window.OpenBrowserApp.ui;
      return {group:state.groups.some(g=>g.id==='quota-custom'&&g.name==='Quota preserved group'),
        title:state.profiles.find(p=>p.id==='startup-test')?.title,pane:state.pane};
    })()`, awaitPromise: true, returnByValue: true }, { timeout: 20000 });
    assert.equal(restored.exceptionDetails, undefined, JSON.stringify(restored.exceptionDetails));
    assert.deepEqual(restored.result.value, { group: true, title: 'Saved after boot', pane: 'wide' },
      'a quota snapshot preserves UI metadata while rehydrating profiles from the real engine');
    const credentialCrypto = require('../../credential-crypto');
    for (const file of ['platform-accounts.enc', 'window-transfers.enc']) {
      const bytes = await fs.readFile(path.join(root, file));
      assert.equal(credentialCrypto.isEncrypted(bytes), true, 'trusted IPC writes encrypted ' + file);
      assert.equal(bytes.includes(Buffer.from('STARTUP_PASSWORD_SENTINEL')), false);
    }
    browser = await cdp.connect(await cdp.browserSocket(port));
    await browser.command('Browser.close', {}, { timeout: 3000 }).catch(() => {});
    for (let i = 0; i < 100 && child.exitCode === null && child.signalCode === null; i++) await delay(100);
    assert.equal(child.exitCode, 0, 'real app did not finish its shutdown: ' + output);
    console.log('APP_STARTUP_E2E_SELFTEST OK (real main, isolated state, readiness barrier, preload, encrypted account/transfer IPC, stale rejection, cursor, row visibility, clean quit)');
  } finally {
    connection?.close(); browser?.close();
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

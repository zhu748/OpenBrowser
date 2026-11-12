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
  if (process.platform !== 'linux' || !process.env.DISPLAY) {
    console.log('SKIP real-main startup gate requires Linux and DISPLAY'); process.exitCode = 2; return;
  }
  const electron = require('electron');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-app-startup-'));
  const child = spawn(electron, ['--no-sandbox', '--remote-debugging-port=0', '.'], {
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
        const created = await window.ops.syncProfiles([{id:'startup-test',name:'Startup test',number:999}],{delta:true});
        const row=created[0];
        await window.ops.syncProfiles([{...row,title:'Saved after boot'}],{delta:true});
        let staleRejected=false;
        try { await window.ops.syncProfiles([row],{delta:true}); } catch (_) { staleRejected=true; }
        const first=await window.ops.profileStatusDelta(null);
        const idle=await window.ops.profileStatusDelta(first.cursor);
        for(let i=0;i<50&&!window.OpenBrowserApp.ui.profiles.some(p=>p.id==='startup-test'&&p.title==='Saved after boot');i++)await new Promise(r=>setTimeout(r,20));
        return {ready,created:created.length,staleRejected,cursor:typeof first.cursor,idleRows:idle.rows.length,
          visible:window.OpenBrowserApp.ui.profiles.some(p=>p.id==='startup-test'&&p.title==='Saved after boot')};
      })()`, awaitPromise: true, returnByValue: true,
    }, { timeout: 30000 });
    assert.equal(evaluated.exceptionDetails, undefined, JSON.stringify(evaluated.exceptionDetails));
    assert.deepEqual(evaluated.result.value, { ready: true, created: 1, staleRejected: true, cursor: 'string', idleRows: 0, visible: true });
    browser = await cdp.connect(await cdp.browserSocket(port));
    await browser.command('Browser.close', {}, { timeout: 3000 }).catch(() => {});
    for (let i = 0; i < 100 && child.exitCode === null && child.signalCode === null; i++) await delay(100);
    assert.equal(child.exitCode, 0, 'real app did not finish its shutdown: ' + output);
    console.log('APP_STARTUP_E2E_SELFTEST OK (real main, isolated state, readiness barrier, preload, stale rejection, cursor, API-created row visibility, clean quit)');
  } finally {
    connection?.close(); browser?.close();
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

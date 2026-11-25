'use strict';
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const { BrowserKernelManager } = require("../automation/browser-kernel");
const {_electron:electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{waitUntil,toggleTheme}=require('./selftest-helpers.cjs');
const repo=path.resolve(__dirname,'../..');
(async()=>{
 const evidence=evidenceDirectory(),data=await createTestDirectory('kernel-upgrade-'),result={passed:false,checks:[],errors:[],externalRequests:[],data};let app,page;
 try{
  const firefoxBinary=process.env.OPENBROWSER_FIREFOX_BINARY;
  if(firefoxBinary){
   const manager=new BrowserKernelManager(data),verified=await manager.probeFirefoxBinary(firefoxBinary);
   const versionPath=path.join(manager.kernelsRoot,'firefox',verified.version);
   await fs.mkdir(versionPath,{recursive:true});
   await fs.cp(path.dirname(firefoxBinary),path.join(versionPath,'firefox'),{recursive:true});
   await fs.writeFile(path.join(versionPath,'kernel.json'),JSON.stringify({engine:'firefox',source:'mozilla',version:verified.version}));
  }else{
   const prior=JSON.parse(await fs.readFile(path.join(evidence,'kernels-ui-selftest.json')));
   assert.equal(prior.passed,true);
   await fs.mkdir(path.join(data,'kernels'),{recursive:true});
   await fs.cp(path.join(prior.data,'kernels/firefox'),path.join(data,'kernels/firefox'),{recursive:true});
  }
  app=await electron.launch({executablePath:require('electron'),args:['--no-sandbox','--ozone-platform=headless','--disable-gpu',path.join(repo,'Browserapp')],env:{...process.env,OPENBROWSER_USER_DATA:data,OPENBROWSER_API_PORT:'0',OPENBROWSER_HEADLESS:'1'}});page=await app.firstWindow();page.setDefaultTimeout(15000);await page.setViewportSize({width:1536,height:960});page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());});page.on('request',request=>{if(/^https?:|^wss?:/.test(request.url()))result.externalRequests.push(request.url());});await page.getByText('暂无窗口',{exact:true}).waitFor();
  const fixture = await page.evaluate(async () => {
    const call = globalThis.__localRequest;
    const kernels = await call('kernels:list');
    const profiles = [];
    for (const [coreType, engine] of [['Chrome', 'chromium'], ['Firefox', 'firefox']]) {
      const kernel = kernels.find(row => row.engine === engine);
      if (!kernel) throw Error('真实双内核缺失');
      const previousMajor = parseInt(kernel.version, 10) - 1;
      const [preview] = await call('fingerprint:preview', { coreType, coreVersion: kernel.version, os: 'Linux' });
      const userAgent = preview.userAgent.replace(/(Chrome\/|Firefox\/|rv:)\d+/g, (_, prefix) => prefix + previousMajor);
      profiles.push(await call('profiles:create', {
        ...preview, coreType, coreVersion: String(previousMajor), os: 'Linux', windowName: coreType + ' 待升级',
        userAgent, webGLInfo: 2, webGLRender: preview.webGLRender + ' (local test override)', hardwareConcurrent: '6',
        _fingerprintDraft: { ...preview._fingerprintDraft, userAgent },
      }));
    }
    return { profiles, kernels };
  });
  const target=Object.fromEntries([['Chrome','chromium'],['Firefox','firefox']].map(([family,engine])=>[
   family,String(Math.max(...fixture.kernels.filter(row=>row.engine===engine).map(row=>parseInt(row.version,10)))),
  ]));
  await page.reload();await page.getByText('Chrome 待升级',{exact:true}).first().waitFor();await page.getByRole('checkbox').first().check();const more=page.locator('.multiple').getByRole('button').last();await more.focus();await more.press('Enter');await page.getByText('窗口操作',{exact:true}).last().hover();await page.getByText('升级内核',{exact:true}).last().click();await page.getByRole('button',{name:'确认',exact:true}).waitFor();const dialogText=await page.locator('body').innerText();assert.ok(dialogText.includes('Chrome '+target.Chrome));assert.ok(dialogText.includes('Firefox '+target.Firefox));await page.screenshot({path:path.join(evidence,'kernel-upgrade-groups-light.png')});await page.getByRole('button',{name:'取消',exact:true}).last().click();await toggleTheme(page);await more.focus();await more.press('Enter');await page.getByText('窗口操作',{exact:true}).last().hover();await page.getByText('升级内核',{exact:true}).last().click();await page.getByRole('button',{name:'确认',exact:true}).last().waitFor();await page.screenshot({path:path.join(evidence,'kernel-upgrade-groups-dark.png')});await page.getByRole('button',{name:'确认',exact:true}).click();
  await waitUntil(()=>page.evaluate(async versions=>{const rows=await globalThis.__localRequest('profiles:list');return rows.length===2&&rows.every(row=>String(row.coreVersion)===versions[row.coreType]);},target));
  const rows = await page.evaluate(async () => Promise.all((await globalThis.__localRequest('profiles:list'))
    .map(row => globalThis.__localRequest('profiles:read', { id: row.id }))));
  assert.deepEqual(rows.map(row => row.id).sort(), fixture.profiles.map(row => row.id).sort());
  for (const row of rows) {
    const original = fixture.profiles.find(profile => profile.id === row.id);
    assert.equal(row.coreVersion, target[row.coreType]);
    assert.ok(row.userAgent.includes(`${row.coreType}/${target[row.coreType]}`));
    assert.equal(row.fingerprintSeed, original.fingerprintSeed);
    assert.equal(row.privacy.cores, 6);
    assert.equal(row.webGLRender, original.webGLRender);
  }
  result.checks.push('Chrome 和 Firefox 内核批量升级后，生成的 UA 跟随新内核，指纹种子与手动硬件参数保留');assert.deepEqual(result.errors,[]);assert.deepEqual(result.externalRequests,[]);result.passed=true;
 }catch(error){result.failure=error.stack;if(page){result.body=await page.locator('body').innerText();await page.screenshot({path:path.join(evidence,'kernel-upgrade-failure.png')});}process.exitCode=1;}finally{await app?.close();await fs.writeFile(path.join(evidence,'kernel-upgrade-ui-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

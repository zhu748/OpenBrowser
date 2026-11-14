"use strict";
const {_electron:electron,chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {waitUntil,toggleTheme}=require('./selftest-helpers.cjs');const repo=path.resolve(__dirname,'../..');
(async()=>{
 const data=await fs.mkdtemp(path.join(repo,'work/rebuild/extensions-ui-')),source=path.join(data,'fixture'),evidence=path.join(repo,'docs/rebuild/evidence'),result={passed:false,checks:[],errors:[],externalRequests:[],data};let app,page,browser;
 try{
  await fs.mkdir(source);await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local Extension Fixture',version:'1.0',action:{default_title:'Native fixture'},background:{service_worker:'worker.js'}}));await fs.writeFile(path.join(source,'worker.js'),'globalThis.extensionFixture=true;');
  app=await electron.launch({executablePath:require('electron'),args:['--no-sandbox','--ozone-platform=headless','--disable-gpu',path.join(repo,'Browserapp')],env:{...process.env,OPENBROWSER_USER_DATA:data,OPENBROWSER_HEADLESS:'1'}});page=await app.firstWindow();page.setDefaultTimeout(15000);await page.setViewportSize({width:1448,height:960});
  page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());});page.on('request',request=>{if(/^https?:|^wss?:/.test(request.url()))result.externalRequests.push(request.url());});
  await page.getByText('暂无窗口',{exact:true}).waitFor();await page.evaluate(()=>{const config=document.querySelector('#app').__vue_app__.config,previous=config.errorHandler;config.errorHandler=(error,vm,info)=>{globalThis.__extensionErrorTrace={component:vm?.$options?.name||vm?.$options?.__name,info};previous(error,vm,info);};});const profile=await page.evaluate(()=>globalThis.__localRequest('profiles:create',{windowName:'扩展验收',os:'Linux'}));
  await app.evaluate(({dialog},selected)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[selected]});},source);
  await page.getByText('扩展中心',{exact:true}).first().click();await page.getByRole('button',{name:'本地上传',exact:true}).first().waitFor();
  await page.screenshot({path:path.join(evidence,'extensions-empty.png')});await page.getByRole('button',{name:'本地上传',exact:true}).first().click();
  await page.getByRole('button',{name:'选择文件夹',exact:true}).click();await page.locator('input.extension-input').waitFor();await page.locator('input.extension-input').fill('本地扩展验收');
  await page.screenshot({path:path.join(evidence,'extensions-upload.png')});await page.getByRole('button',{name:'上传',exact:true}).click();
  await page.getByText('安装到项目:',{exact:true}).waitFor();await page.getByText('默认项目',{exact:true}).last().click();
  await page.screenshot({path:path.join(evidence,'extensions-assign.png')});await page.getByRole('button',{name:'保存',exact:true}).last().click();
  await page.getByText('本地扩展验收',{exact:true}).first().waitFor();
  const native=await page.evaluate(()=>globalThis.ops.extensionList()),installed=native.find(row=>row.name==='本地扩展验收');assert.ok(installed);assert.ok(installed.assignedProfileIds.includes(profile.id));assert.ok(installed.path.startsWith(path.join(data,'local-extensions')+path.sep));
  result.checks.push('原侧栏、原扩展列表、原本地上传和原项目分配弹窗真实导入并关联原生扩展');
  await waitUntil(()=>page.locator('.p-dialog-mask').count().then(count=>count===0));
  await page.screenshot({path:path.join(evidence,'extensions-list-light.png')});
  await page.getByRole('row').filter({hasText:'本地扩展验收'}).locator('button').first().click();
  await page.getByText('始终固定到工具栏',{exact:true}).click();await page.keyboard.press('Escape');
  await waitUntil(()=>page.evaluate(id=>globalThis.ops.extensionList().then(rows=>rows.find(row=>row.id===id).fixedPlugin==='pin'),installed.id));
  await page.evaluate(chrome=>globalThis.ops.kernelSetCustom(chrome),path.join(repo,'Browserapp/kernels/chrome-stable/opt/google/chrome/chrome'));
  await page.evaluate(id=>globalThis.__localRequest('profiles:start',{id}),profile.id);
  const status=(await page.evaluate(()=>globalThis.ops.profileStatus())).find(row=>row.id===profile.id);assert.ok(status.running);browser=await chromium.connectOverCDP('http://127.0.0.1:'+status.port);
  const runtimeId=require('../automation/extension-identity').extensionIdFromPath(installed.path);
  await waitUntil(()=>Promise.resolve(browser.contexts().some(context=>context.serviceWorkers().some(worker=>worker.url().startsWith('chrome-extension://'+runtimeId+'/')))),{timeout:20000});
  const worker=browser.contexts().flatMap(context=>context.serviceWorkers()).find(worker=>worker.url().startsWith('chrome-extension://'+runtimeId+'/'));
  assert.equal(await worker.evaluate(()=>globalThis.extensionFixture),true);result.chromePin=await worker.evaluate(()=>globalThis.chrome.action.getUserSettings());assert.equal(result.chromePin.isOnToolbar,true);
  result.checks.push('真实 Chrome 157 启动已分配扩展的 service worker，原生 chrome.action.getUserSettings 确认工具栏已固定');
  await browser.close();browser=null;await page.evaluate(id=>globalThis.__localRequest('profiles:stop',{id}),profile.id);
  await page.reload();await page.getByText('本地扩展验收',{exact:true}).first().waitFor();await toggleTheme(page);await waitUntil(()=>page.locator('html').getAttribute('data-theme').then(value=>value==='dark'));await page.screenshot({path:path.join(evidence,'extensions-list-dark.png')});
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.externalRequests,[]);result.passed=true;
 }catch(error){result.failure=error.stack;if(page){result.trace=await page.evaluate(()=>globalThis.__extensionErrorTrace);result.body=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:path.join(evidence,'extensions-ui-failure.png')}).catch(()=>{});}}
 finally{await browser?.close();await app?.close();await fs.writeFile(path.join(evidence,'extensions-ui-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});

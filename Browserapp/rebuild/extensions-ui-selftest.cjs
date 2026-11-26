"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const {_electron:electron,chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {waitUntil,toggleTheme}=require('./selftest-helpers.cjs');const repo=path.resolve(__dirname,'../..');
const sourcePage=process.argv.includes('--source-page'),prefix=sourcePage?'source-':'';
(async()=>{
 const data=await createTestDirectory('extensions-ui-'),source=path.join(data,'fixture'),evidence=evidenceDirectory(),result={passed:false,renderer:sourcePage?'source':'workbench',checks:[],errors:[],externalRequests:[]};let app,page,browser;
 const screenshot=name=>page.screenshot({path:path.join(evidence,prefix+name)});
 const button=name=>page.getByRole('button',{name,exact:true});
 try{
  await fs.mkdir(source);await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local Extension Fixture',version:'1.0',action:{default_title:'Native fixture'},background:{service_worker:'worker.js'}}));await fs.writeFile(path.join(source,'worker.js'),'globalThis.extensionFixture=true;');
  app=await electron.launch({executablePath:require('electron'),args:['--no-sandbox','--ozone-platform=headless','--disable-gpu',path.join(repo,'Browserapp')],env:{...process.env,OPENBROWSER_USER_DATA:data,OPENBROWSER_HEADLESS:'1'}});page=await app.firstWindow();page.setDefaultTimeout(15000);await page.setViewportSize({width:1448,height:960});
  page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());});page.on('request',request=>{if(/^https?:|^wss?:/.test(request.url()))result.externalRequests.push(request.url());});
  await page.getByText('暂无窗口',{exact:true}).waitFor();await page.evaluate(()=>{const config=document.querySelector('#app').__vue_app__.config,previous=config.errorHandler;config.errorHandler=(error,vm,info)=>{globalThis.__extensionErrorTrace={component:vm?.$options?.name||vm?.$options?.__name,info};previous(error,vm,info);};});const profile=await page.evaluate(()=>globalThis.__localRequest('profiles:create',{windowName:'扩展验收',os:'Linux'}));
  await app.evaluate(({dialog},selected)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[selected]});},source);
  await page.getByText('扩展中心',{exact:true}).first().click();
  if(sourcePage)await page.evaluate(()=>globalThis.__router.replace({path:'/extensions',query:{renderer:'source'}}));
  await button('本地上传').first().waitFor();
  if (!sourcePage) {
    const paginator = page.locator('.extensions .p-paginator');
    await paginator.waitFor();
    for (const height of [660, 960]) {
      await page.setViewportSize({ width: 1448, height });
      const gap = await paginator.evaluate(element =>
        element.closest('.extensions').getBoundingClientRect().bottom - element.getBoundingClientRect().bottom);
      assert.ok(Math.abs(gap) <= 1, `扩展分页栏应贴近面板底部（差 ${gap}px）`);
    }
    result.checks.push('扩展分页栏在调整视口高度后仍贴近面板底部');
  }
  await screenshot('extensions-empty.png');await button('本地上传').first().click();
  await button('选择文件夹').click();
  const nameInput=sourcePage?page.getByLabel('扩展名称'):page.locator('input.extension-input');
  await nameInput.fill('本地扩展验收');
  await screenshot('extensions-upload.png');await button('上传').click();
  if(sourcePage)await page.getByRole('dialog',{name:'安装到项目'}).getByRole('checkbox',{name:'默认项目',exact:true}).check();
  else {
    await page.getByText('安装到项目:',{exact:true}).waitFor();
    await page.getByText('默认项目',{exact:true}).last().click();
  }
  await screenshot('extensions-assign.png');await button(sourcePage?'保存分配':'保存').last().click();
  if(sourcePage)await page.getByRole('dialog',{name:'安装到项目'}).waitFor({state:'hidden'});
  await page.getByText('本地扩展验收',{exact:true}).first().waitFor();
  const native=await page.evaluate(()=>globalThis.ops.extensionList()),installed=native.find(row=>row.name==='本地扩展验收');assert.ok(installed);assert.ok(installed.assignedProfileIds.includes(profile.id));assert.ok(installed.path.startsWith(path.join(data,'local-extensions')+path.sep));
  result.checks.push('从侧栏打开扩展中心，使用上传与项目分配弹窗导入并关联原生扩展');
  if(sourcePage){
    await button('刷新').click();
    await waitUntil(()=>button('刷新').isEnabled());
  }else await waitUntil(()=>page.locator('.p-dialog-mask').count().then(count=>count===0));
  await screenshot('extensions-list-light.png');
  if(sourcePage)await page.getByLabel('工具栏固定方式 · 本地扩展验收').click();
  else await page.getByRole('row').filter({hasText:'本地扩展验收'}).locator('button').first().click();
  await page.getByText('始终固定到工具栏',{exact:true}).click();await page.keyboard.press('Escape');
  await waitUntil(()=>page.evaluate(id=>globalThis.ops.extensionList().then(rows=>rows.find(row=>row.id===id).fixedPlugin==='pin'),installed.id));
  if(process.env.OPENBROWSER_TEST_KERNEL_BINARY)await page.evaluate(()=>globalThis.ops.saveClientSettings({diskLimit:0}));
  await page.evaluate(chrome=>globalThis.ops.kernelSetCustom(chrome),process.env.OPENBROWSER_TEST_KERNEL_BINARY||path.join(repo,'Browserapp/kernels/chrome-stable/opt/google/chrome/chrome'));
  await page.evaluate(id=>globalThis.__localRequest('profiles:start',{id}),profile.id);
  const status=(await page.evaluate(()=>globalThis.ops.profileStatus())).find(row=>row.id===profile.id);assert.ok(status.running);browser=await chromium.connectOverCDP('http://127.0.0.1:'+status.port);
  const runtimeId=require('../automation/extension-identity').extensionIdFromPath(installed.path);
  await waitUntil(()=>Promise.resolve(browser.contexts().some(context=>context.serviceWorkers().some(worker=>worker.url().startsWith('chrome-extension://'+runtimeId+'/')))),{timeout:20000});
  const worker=browser.contexts().flatMap(context=>context.serviceWorkers()).find(worker=>worker.url().startsWith('chrome-extension://'+runtimeId+'/'));
  assert.equal(await worker.evaluate(()=>globalThis.extensionFixture),true);result.chromePin=await worker.evaluate(()=>globalThis.chrome.action.getUserSettings());assert.equal(result.chromePin.isOnToolbar,true);
  result.checks.push('真实 Chrome 启动已分配扩展的 service worker，原生 chrome.action.getUserSettings 确认工具栏已固定');
  await browser.close();browser=null;await page.evaluate(id=>globalThis.__localRequest('profiles:stop',{id}),profile.id);
  await page.reload();await page.getByText('本地扩展验收',{exact:true}).first().waitFor();await toggleTheme(page);await waitUntil(()=>page.locator('html').getAttribute('data-theme').then(value=>value==='dark'));await screenshot('extensions-list-dark.png');
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.externalRequests,[]);result.passed=true;
 }catch(error){result.failure=error.stack;if(page){result.trace=await page.evaluate(()=>globalThis.__extensionErrorTrace);result.body=await page.locator('body').innerText().catch(()=>null);await screenshot('extensions-ui-failure.png').catch(()=>{});}}
 finally{await browser?.close();await app?.close();await fs.rm(data,{recursive:true,force:true,maxRetries:3});await fs.writeFile(path.join(evidence,prefix+'extensions-ui-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});

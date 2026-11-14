"use strict";
const {_electron:electron,chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const {waitUntil}=require('./selftest-helpers.cjs'),repo=path.resolve(__dirname,'../..');
(async()=>{
 const data=await fs.mkdtemp(path.join(repo,'work/rebuild/host-ui-')),evidence=path.join(repo,'docs/rebuild/evidence'),desktop=path.join(data,'Desktop'),result={passed:false,checks:[],errors:[],externalRequests:[],data};let app,page,browser;
 const server=http.createServer((_req,res)=>res.end('<title>Native launcher fixture</title><h1>Profile launcher</h1>'));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const env={...process.env,OPENBROWSER_USER_DATA:data,OPENBROWSER_HEADLESS:'1',XDG_CONFIG_HOME:path.join(data,'xdg-config'),XDG_DATA_HOME:path.join(data,'xdg-data')};
 try{
  app=await electron.launch({executablePath:require('electron'),args:['--no-sandbox','--ozone-platform=headless','--disable-gpu',path.join(repo,'Browserapp')],env});page=await app.firstWindow();page.setDefaultTimeout(15000);await page.setViewportSize({width:1448,height:960});
  page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());});page.on('request',request=>{if(/^https?:|^wss?:/.test(request.url()))result.externalRequests.push(request.url());});
  await page.getByText('暂无窗口',{exact:true}).waitFor();await app.evaluate(({app},desktop)=>{const get=app.getPath.bind(app);app.getPath=kind=>kind==='desktop'?desktop:get(kind);},desktop);
  const profile=await page.evaluate(()=>globalThis.__localRequest('profiles:create',{windowName:'快捷方式验收',os:'Linux'}));await page.getByText('快捷方式验收',{exact:true}).click({button:'right'});await page.getByText('创建桌面快捷方式',{exact:true}).last().click();await page.getByText('创建桌面快捷方式成功',{exact:true}).waitFor();
  const file=path.join(desktop,'openbrowser-'+profile.id+'.desktop');await fs.stat(file);await promisify(execFile)('desktop-file-validate',[file]);await page.screenshot({path:path.join(evidence,'host-shortcut-created.png')});result.checks.push('原窗口右键菜单创建真实桌面快捷方式，系统文件格式验证通过');
  await page.getByText('快捷方式验收',{exact:true}).click({button:'right'});await page.getByText('设为默认浏览器',{exact:true}).last().click();await page.getByText('已设为默认浏览器',{exact:true}).waitFor();
  for(const protocol of ['http','https']){const {stdout}=await promisify(execFile)('xdg-mime',['query','default','x-scheme-handler/'+protocol],{env,timeout:5000});assert.equal(stdout.trim(),'openbrowser-default.desktop');}await page.screenshot({path:path.join(evidence,'host-default-browser.png')});result.checks.push('原设为默认浏览器菜单，真实独立 XDG 配置注册及查询两个 URL scheme');
  await page.evaluate(file=>globalThis.ops.kernelSetCustom(file),path.join(repo,'Browserapp/kernels/chrome-stable/opt/google/chrome/chrome'));
  const url='http://127.0.0.1:'+server.address().port+'/launch';
  await promisify(execFile)(require('electron'),['--no-sandbox','--ozone-platform=headless','--disable-gpu',path.join(repo,'Browserapp'),'--openbrowser-user-data='+data,'--openbrowser-profile='+profile.id,url],{env,timeout:30000,maxBuffer:1024*1024});
  let status;await waitUntil(async()=>{status=(await page.evaluate(()=>globalThis.ops.profileStatus())).find(row=>row.id===profile.id);return status?.running;},{timeout:60000});
  browser=await chromium.connectOverCDP('http://127.0.0.1:'+status.port);await waitUntil(()=>Promise.resolve(browser.contexts().some(context=>context.pages().some(tab=>tab.url()===url))),{timeout:15000});assert.equal(await browser.contexts().flatMap(context=>context.pages()).find(tab=>tab.url()===url).title(),'Native launcher fixture');result.checks.push('真实第二个 Electron 进程经单实例通道启动指定原生 Chrome 窗口并打开 CLI URL');
  await browser.close();browser=null;await page.evaluate(id=>globalThis.__localRequest('profiles:stop',{id}),profile.id);
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.externalRequests,[]);result.passed=true;
 }catch(error){result.failure=error.stack;if(page){result.body=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:path.join(evidence,'host-actions-ui-failure.png')}).catch(()=>{});}}
 finally{await browser?.close();await app?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.join(evidence,'host-actions-ui-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});

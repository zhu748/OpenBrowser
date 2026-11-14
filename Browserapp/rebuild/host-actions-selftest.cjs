"use strict";
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const {BrowserEngine}=require('../engine'),{LocalService}=require('./local-service'),host=require('./host-actions');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob host % quoted-')),engine=new BrowserEngine({getPath:()=>root}),result={passed:false,checks:[]};let service;
 try{
  assert.deepEqual(host.parseLaunch(['app','--openbrowser-profile=abc-123','https://example.test/']),{id:'abc-123',urls:['https://example.test/']});assert.throws(()=>host.parseLaunch(['--openbrowser-profile=../escape']),/ID/);assert.throws(()=>host.parseLaunch(['https://user:secret@example.test/']),/网址/);
  await engine.init(null);service=new LocalService({engine,root});const profile=await service.request('profiles:create',{windowName:'Profile\nInjected=entry',os:'Linux'});
  const app={isPackaged:false,getAppPath:()=>path.resolve(__dirname,'..'),getPath:kind=>kind==='desktop'?path.join(root,'Desktop'):root};
  const {file}=await host.shortcut(service,{id:profile.id},{app});const content=await fs.readFile(file,'utf8');assert.ok(content.includes('--openbrowser-profile='+profile.id));assert.ok(content.includes('--openbrowser-user-data='));assert.ok(content.includes('%%'));assert.ok(!content.includes('\nInjected='));assert.equal((await fs.stat(file)).mode&0o777,0o700);
  await promisify(execFile)('desktop-file-validate',[file],{timeout:5000});result.checks.push('真实桌面文件通过 desktop-file-validate，执行位、换行、空格和百分号转义以及窗口/数据目录参数正确');
  process.env.XDG_DATA_HOME=path.join(root,'xdg-data');process.env.XDG_CONFIG_HOME=path.join(root,'xdg-config');
  const applied=await host.setDefault(service,{id:profile.id},{app});assert.equal(applied.applied,true,applied.message);
  for(const protocol of ['http','https']){const {stdout}=await promisify(execFile)('xdg-mime',['query','default','x-scheme-handler/'+protocol],{timeout:5000});assert.equal(stdout.trim(),'openbrowser-default.desktop');}
  assert.equal(JSON.parse(await fs.readFile(service.file)).settings.defaultProfileId,profile.id);result.checks.push('真实 xdg-mime 在独立 XDG 目录注册并查询 HTTP/HTTPS 默认应用，目标窗口落盘先于 OS 变更');
  await assert.rejects(host.openLaunch(engine,{id:'missing',urls:[]}),/不存在/);await assert.rejects(host.openLaunch(engine,{urls:['https://example.test/']}),/尚未选择/);
  result.passed=true;
 }catch(error){result.failure=error.stack;process.exitCode=1;}finally{await engine.stopAll?.();await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/host-actions-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

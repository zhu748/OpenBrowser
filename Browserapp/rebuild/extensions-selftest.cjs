"use strict";
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {BrowserEngine}=require('../engine'),{LocalService}=require('./local-service');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob-extensions-')),source=path.join(root,'fixture'),result={passed:false,checks:[]};
 const engine=new BrowserEngine({getPath:()=>root});let service,selection=source;
 try{
  await fs.mkdir(source);await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,name:'Native fixture',version:'1.0',action:{},background:{service_worker:'worker.js'}}));await fs.writeFile(path.join(source,'worker.js'),'globalThis.extensionFixture=true;');
  await engine.init(null);service=new LocalService({engine,root,dialog:{showOpenDialog:async()=>({canceled:false,filePaths:[selection]})},window:()=>null});
  const one=await service.request('profiles:create',{windowName:'Default',os:'Linux'}),group=await service.request('groups:save',{projectName:'Fixture'}),two=await service.request('profiles:create',{windowName:'Other',os:'Linux',projectId:group.id});
  const picked=await service.request('extensions:select',{kind:'dir'}),stage=await service.request('extensions:stage',picked.data);
  const {plugin_id:id}=await service.request('extensions:finish',{...picked.data,...stage,pluginName:'本地扩展',pluginDesc:'fixture'});
  const saved=engine.extensions.get(id);assert.ok(saved.path.startsWith(path.join(root,'local-extensions')+path.sep));assert.equal(saved.name,'本地扩展');assert.notEqual(saved.path,source);
  assert.equal((await service.request('extensions:read',{pluginId:id})).rows[0].pluginVersion,'1.0');
  await service.request('extensions:assign',{pluginId:id,projectId:['local-default',group.id],installStatus:[1,0]});
  assert.ok(engine.assignments.get(one.id).has(id));assert.ok(!engine.assignments.get(two.id).has(id));
  const future=await service.request('profiles:create',{windowName:'Future',os:'Linux'});assert.ok(engine.assignments.get(future.id).has(id));
  await service.request('profiles:update',{id:future.id,rev:engine.profiles.revisionOf(future.id),projectId:group.id});assert.ok(!engine.assignments.get(future.id).has(id));
  await assert.rejects(service.request('extensions:assign',{pluginId:id,projectId:['unknown'],installStatus:[1]}),/项目/);
  await assert.rejects(service.request('extensions:assign',{pluginId:id,projectId:['local-default'],installStatus:[2]}),/状态/);
  result.checks.push('原生扩展库管理独立副本；项目分配、新窗口继承、跨项目移动和无效状态拒绝');
  const persist=engine.persist.bind(engine);engine.persist=async()=>{throw Error('injected extension disk failure');};
  await assert.rejects(service.request('extensions:assign',{pluginId:id,projectId:['local-default',group.id],installStatus:[0,1]}),/disk failure/);
  assert.ok(engine.assignments.get(one.id).has(id));assert.ok(!engine.assignments.get(two.id).has(id));engine.persist=persist;
  await service.request('extensions:pin',{id,fixedPlugin:'pin'});const prefRoot=path.join(root,'preferences');await engine.applyProfilePreferences(prefRoot,engine.profiles.get(one.id));
  const runtimeId=require('../automation/extension-identity').extensionIdFromPath(saved.path);
  assert.ok(JSON.parse(await fs.readFile(path.join(prefRoot,'Default/Preferences'))).extensions.pinned_extensions.includes(runtimeId));
  await service.request('extensions:pin',{id,fixedPlugin:'unpin'});await engine.applyProfilePreferences(prefRoot,engine.profiles.get(one.id));assert.ok(!JSON.parse(await fs.readFile(path.join(prefRoot,'Default/Preferences'))).extensions.pinned_extensions.includes(runtimeId));
  result.checks.push('分配写盘失败时原子回滚；固定与取消固定应用到原生 Preferences');
  await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,name:'Upgrade fixture',version:'2.0'}));
  const update=await service.request('extensions:select',{kind:'dir'}),updateStage=await service.request('extensions:stage',update.data);
  engine.persist=async()=>{throw Error('injected upgrade disk failure');};
  await assert.rejects(service.request('extensions:finish',{...update.data,...updateStage,pluginDir:id,pluginName:'Updated'}),/disk failure/);
  engine.persist=persist;assert.equal(JSON.parse(await fs.readFile(path.join(saved.path,'manifest.json'))).version,'1.0');assert.equal(engine.extensions.get(id).version,'1.0');
  await service.request('extensions:finish',{...update.data,...updateStage,pluginDir:id,pluginName:'Updated'});assert.equal(engine.extensions.get(id).version,'2.0');assert.ok(engine.assignments.get(one.id).has(id));
  result.checks.push('更新沿用原 ID/关联，写盘失败恢复旧目录和元数据，重试真实升级');
  await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,name:'Committed fixture',version:'3.0'}));
  const third=await service.request('extensions:select',{kind:'dir'}),thirdStage=await service.request('extensions:stage',third.data),remove=fs.rm;
  fs.rm=async(file,options)=>{if(String(file).includes('.backup-'))throw Error('injected backup cleanup failure');return remove(file,options);};
  try{await assert.rejects(service.request('extensions:finish',{...third.data,...thirdStage,pluginDir:id,pluginName:'Committed'}),error=>error.code==='EXTENSION_CLEANUP_FAILED'&&error.committed===true);}finally{fs.rm=remove;}
  assert.equal(engine.extensions.get(id).version,'3.0');assert.equal(JSON.parse(await fs.readFile(path.join(saved.path,'manifest.json'))).version,'3.0');assert.ok(engine.assignments.get(one.id).has(id));
  assert.equal(service.extensions.cleanup.size,1);await service.extensions.shutdown();assert.equal(service.extensions.cleanup.size,0);
  result.checks.push('提交后备份清理失败明确报错，保留新文件与元数据，退出时重试清理；不回滚已提交更新');
  await fs.symlink('/etc/passwd',path.join(source,'unsafe'));await assert.rejects(service.request('extensions:select',{kind:'dir'}),/符号链接/);await fs.unlink(path.join(source,'unsafe'));
  const builtIn=[...engine.extensions.values()].find(row=>row.builtIn);if(builtIn)await assert.rejects(service.request('extensions:remove',{ids:[builtIn.id]}),/内置/);
  const {zip}=require('./selftest-zip.cjs');selection=path.join(root,'extension.zip');
  await fs.writeFile(selection,zip([{name:'package/manifest.json',content:JSON.stringify({manifest_version:3,name:'ZIP fixture',version:'1.0'})},{name:'package/content.js',content:'globalThis.zipFixture=true;'}]));
  const zipped=await service.request('extensions:select',{kind:'file'}),zipStage=await service.request('extensions:stage',zipped.data),zipAdded=await service.request('extensions:finish',{...zipped.data,...zipStage,pluginName:'ZIP fixture'});
  assert.equal(await fs.readFile(path.join(engine.extensions.get(zipAdded.plugin_id).path,'content.js'),'utf8'),'globalThis.zipFixture=true;');await service.request('extensions:remove',{ids:[zipAdded.plugin_id]});
  for(const item of [{name:'../manifest.json',content:'{}'},{name:'link',content:'/etc/passwd',mode:0xa1ff}]){
    await fs.writeFile(selection,zip([{name:'manifest.json',content:JSON.stringify({manifest_version:3,name:'Unsafe fixture',version:'1.0'})},item]));
    await assert.rejects(service.request('extensions:select',{kind:'file'}),/路径|符号链接/);
  }
  const large=await fs.open(selection,'w');await large.truncate(50*1024*1024+1);await large.close();await assert.rejects(service.request('extensions:select',{kind:'file'}),/50 MiB/);
  result.checks.push('真实 ZIP 解包并安装，包装目录支持；越界、归档符号链接和超过原界面 50 MiB 上限明确拒绝');
  await service.request('extensions:remove',{ids:[id]});assert.ok(!engine.extensions.has(id));assert.ok(!engine.assignments.get(one.id).has(id));await assert.rejects(fs.stat(saved.path),{code:'ENOENT'});
  result.checks.push('符号链接拒绝，内置扩展不可删，删除移除真实文件与窗口关联');result.passed=true;
 }catch(error){result.failure=error.stack;process.exitCode=1;}finally{await service?.extensions.shutdown();await engine.stopAll?.();await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/extensions-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

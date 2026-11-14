'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {BrowserEngine}=require('../engine'),{LocalService}=require('./local-service'),{AgentService}=require('./agent-service');
const result={passed:false,cases:[]};
async function check(name,operation){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob-review-')),engine=new BrowserEngine({getPath:()=>root});let local,agent;try{await engine.init(null);local=new LocalService({root,engine});agent=local.agent;await operation({root,engine,local,agent});result.cases.push({name,status:'PASS'});}catch(error){result.cases.push({name,status:'FAIL',error:error.stack});}finally{await agent?.shutdown();await engine.stopAll();}}
(async()=>{
 await check('Agent 模板 ID 删除/重启后不复用',async({root,agent})=>{const old=(await agent.request('userTemplates.createUserTemplate',{name:'旧模板',metadata:{prompt:'old'}})).data;await agent.request('userTemplates.deleteUserTemplate',{id:old.id});await agent.shutdown();const reload=new AgentService({root,engine:{emit(){},status:()=>[]}});try{const next=(await reload.request('userTemplates.createUserTemplate',{name:'新模板',metadata:{prompt:'new'}})).data;assert.ok(next.id>old.id,'旧 ID 不得被新模板占用');}finally{await reload.shutdown();}});
 await check('新任务不得继承已删除任务的历史 ID',async({agent})=>{const template=(await agent.request('userTemplates.createUserTemplate',{name:'模板',metadata:{prompt:'test'}})).data;const old=(await agent.request('userTasks.createUserTask',{name:'旧任务',userTemplateId:template.id})).data;agent.data.logs.push({id:'history',taskId:old.id,status:'success'});await agent.save();await agent.request('userTasks.deleteUserTask',{id:old.id});const next=(await agent.request('userTasks.createUserTask',{name:'新任务',userTemplateId:template.id})).data;assert.ok(next.id>old.id,'新任务不得混入旧任务日志');});
 await check('窗口模板删除后不复用旧 ID',async({local})=>{const old=await local.request('templates:save',{templateName:'旧',content:'{}'});await local.request('templates:delete',{ids:[old.id]});const next=await local.request('templates:save',{templateName:'新',content:'{}'});assert.ok(next.id>old.id);});
 await check('标签删除后不复用已保存筛选器中的 ID',async({local})=>{const old=await local.request('labels:save',{name:'旧'});await local.request('filters:save',{filter_name:'旧筛选',labelIds:[old.id]});await local.request('labels:delete',{ids:[old.id]});const next=await local.request('labels:save',{name:'新'});assert.ok(next.id>old.id);});
 for(const kind of ['groups','labels'])await check(kind+' 元数据保存失败恢复窗口关联且保留并发备注',async({engine,local})=>{const item=await local.request(kind+':save',kind==='groups'?{projectName:'保留项目'}:{name:'保留标签'}),profile=await local.request('profiles:create',{windowName:'关联窗口',...(kind==='groups'?{projectId:item.id}:{labelIds:[item.id]})});const save=local.save.bind(local);local.save=async()=>{const current=engine.profileForEdit(profile.id);await engine.applyProfileCommands([{kind:'patch',id:profile.id,baseRev:current.rev,patch:{note:'并发备注保留'}}],{delta:true});throw Error('injected metadata save failure');};try{await assert.rejects(local.request(kind+':delete',{ids:[item.id]}),/metadata save failure/);}finally{local.save=save;}const stored=engine.profileForEdit(profile.id).profile;assert.equal(stored.note,'并发备注保留');assert.equal(kind==='groups'?stored.groupId:stored.tag,String(item.id),'操作失败必须恢复实际后端关联');assert.ok(local.data[kind].some(row=>row.id===item.id));});
 await check('项目分页重排只替换所选位置',async({local})=>{const rows=[];for(const name of ['a','b','c','d'])rows.push(await local.request('groups:save',{projectName:name}));await local.request('groups:sort',{projectIds:[rows[2].id,rows[1].id],page_index:2,page_size:2});assert.deepEqual((await local.request('groups:list')).map(row=>row.id),[rows[0].id,rows[2].id,rows[1].id,rows[3].id]);});
 await check('筛选器读取应用已保存的排序',async({local})=>{for(const name of ['a','b','c'])await local.request('filters:save',{filter_name:name});await local.request('settings:set',{filterSort:[{name:'c',sort:0},{name:'a',sort:1},{name:'b',sort:2}]});assert.deepEqual((await local.request('filters:list')).map(row=>row.filter_name),['c','a','b']);});

 await check('旧数据引用迁移、未知操作与失败计数回滚',async({agent,local})=>{
   await agent.load();agent.data.logs.push({id:'old-history',taskId:42,templateId:51});
   const template=(await agent.request('userTemplates.createUserTemplate',{name:'迁移模板',metadata:{prompt:'test'}})).data;assert.ok(template.id>51);
   const task=(await agent.request('userTasks.createUserTask',{name:'迁移任务',userTemplateId:template.id})).data;assert.ok(task.id>42);
   const before=structuredClone(agent.data);await assert.rejects(agent.request('userTasks.updateAnything',{id:task.id,name:'误改'}),/不支持/);assert.deepEqual(agent.data,before);
   await assert.rejects(agent.request('officialScripts.createAnything',{name:'ghost'}),/不支持/);assert.equal(agent.data.scripts,undefined);
   const save=agent.save.bind(agent);agent.save=async()=>{throw Error('injected counter save');};
   await assert.rejects(agent.request('userTemplates.createUserTemplate',{name:'不应保存'}),/counter save/);agent.save=save;assert.deepEqual(agent.data,before);
   await local.load();local.data.labels=[];local.data.filters=[{filter_name:'历史',labelIds:[91]}];const label=await local.request('labels:save',{name:'迁移标签'});assert.ok(label.id>91);
 });
 for(const failChunk of [false,true])await check('201 个窗口关联分批删除'+(failChunk?'中途失败完整回滚':'成功'),async({local,engine})=>{
   const group=await local.request('groups:save',{projectName:'批量项目'});
   const {fromRoxy}=require('./local-service');const profiles=Array.from({length:201},(_,index)=>fromRoxy({windowName:'批量'+index,projectId:group.id}));
   await engine.syncProfiles(profiles,{delta:true});
   const original=engine.applyProfileCommands.bind(engine);let calls=0;
   if(failChunk)engine.applyProfileCommands=async(...args)=>{if(++calls===2)throw Error('injected second chunk');return original(...args);};
   try{if(failChunk)await assert.rejects(local.request('groups:delete',{ids:[group.id]}),/second chunk/);else await local.request('groups:delete',{ids:[group.id]});}finally{engine.applyProfileCommands=original;}
   assert.equal([...engine.profiles.values()].filter(row=>row.groupId===group.id).length,failChunk?201:0);
 });
 await check('关联回滚冲突明确报错并保留用户新关联',async({local,engine})=>{
   const a=await local.request('groups:save',{projectName:'原项目'}),b=await local.request('groups:save',{projectName:'并发项目'}),p=await local.request('profiles:create',{windowName:'冲突',projectId:a.id});
   const save=local.save.bind(local);local.save=async()=>{const current=engine.profileForEdit(p.id);await engine.applyProfileCommands([{kind:'modify',id:p.id,baseRev:current.rev,profile:{...current.profile,groupId:b.id}}],{delta:true});throw Error('injected conflicting save');};
   try{await assert.rejects(local.request('groups:delete',{ids:[a.id]}),error=>error instanceof AggregateError&&/回滚不完整/.test(error.message));}finally{local.save=save;}
   assert.equal(engine.profileForEdit(p.id).profile.groupId,b.id);
 });
 await check('Skill 包和元数据提交失败共同恢复',async({agent})=>{
   const {zip}=require('./selftest-zip.cjs');const upload=content=>agent.request('userTemplates.uploadUserTemplateSkill',{filename:'local.zip',data:zip([{name:'demo/SKILL.md',content:'---\nname: review-rollback\ndescription: '+content+'\n---\n'+content}]).toString('base64')});
   await upload('old');const old=(await agent.request('skills:list')).find(row=>row.slug==='review-rollback');
   const save=agent.save.bind(agent);agent.save=async()=>{throw Error('injected skill metadata save');};
   try{await assert.rejects(upload('new'),/skill metadata save/);}finally{agent.save=save;}
   assert.equal((await agent.request('skills:list')).find(row=>row.slug==='review-rollback').content,old.content);assert.equal(await fs.readFile(path.join(old.root,'SKILL.md'),'utf8'),old.content);
   assert.deepEqual((await fs.readdir(path.dirname(old.root))).filter(name=>/backup|install/.test(name)),[]);
   agent.save=async()=>{throw Error('injected skill delete save');};
   try{await assert.rejects(agent.request('skills:delete',{slug:old.slug}),/skill delete save/);}finally{agent.save=save;}
   assert.equal(await fs.readFile(path.join(old.root,'SKILL.md'),'utf8'),old.content);assert.ok((await agent.request('skills:list')).some(row=>row.slug===old.slug));
   await agent.request('skills:delete',{slug:old.slug});await assert.rejects(fs.stat(old.root),{code:'ENOENT'});

 });
 result.passed=result.cases.every(row=>row.status==='PASS');if(!result.passed)process.exitCode=1;
})().catch(error=>{result.failure=error.stack;process.exitCode=1;}).finally(async()=>{await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/review-2/consistency.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));});

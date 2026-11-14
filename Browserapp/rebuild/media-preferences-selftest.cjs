'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{BrowserEngine}=require('../engine'),{LocalService}=require('./local-service');
(async()=>{
 process.env.OPENBROWSER_HEADLESS='1';const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob-media-')),engine=new BrowserEngine({getPath:()=>root}),result={passed:false,checks:[]},requests=[];let service,browser;
 const server=http.createServer((req,res)=>{requests.push(req.url);res.setHeader('Content-Type',req.url==='/'?'text/html':'application/octet-stream');res.end(req.url==='/'?'<!doctype html><title>Media preference fixture</title>':'media fixture');});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  await engine.init(null);service=new LocalService({root,engine});
  for(const scenario of [{name:'仅静音',forbidAudio:false,forbidMedia:true,muted:true,blocked:false},{name:'仅关闭视频',forbidAudio:true,forbidMedia:false,muted:false,blocked:true}]){
   const profile=await service.request('profiles:create',{windowName:scenario.name,os:'Linux',forbidAudio:scenario.forbidAudio,forbidMedia:scenario.forbidMedia}),read=await service.request('profiles:read',{id:profile.id});assert.equal(read.forbidAudio,scenario.forbidAudio);assert.equal(read.forbidMedia,scenario.forbidMedia);await service.request('profiles:start',{id:profile.id});const item=engine.running.get(profile.id),args=item.child.spawnargs;
   assert.equal(args.includes('--mute-audio'),scenario.muted);assert.ok(args.includes('--autoplay-policy='+(scenario.blocked?'user-gesture-required':'no-user-gesture-required')));
   browser=await chromium.connectOverCDP('http://127.0.0.1:'+item.port);const page=browser.contexts()[0].pages()[0];await page.goto('http://127.0.0.1:'+server.address().port+'/');const before=requests.length,outcome=await page.evaluate(()=>fetch('/asset/clip.webm',{cache:'no-store'}).then(response=>response.text()).catch(error=>({error:error.name})));
   if(scenario.blocked){assert.equal(typeof outcome,'object');assert.equal(requests.slice(before).includes('/asset/clip.webm'),false);}else{assert.equal(outcome,'media fixture');assert.equal(requests.slice(before).includes('/asset/clip.webm'),true);}
   await browser.close();browser=null;await service.request('profiles:stop',{id:profile.id});
  }
  const {firefoxExtraUserPrefs}=require('../engine/start-firefox'),prefs=firefoxExtraUserPrefs({advanced:{blockSound:true,blockVideo:false},privacy:{}},{});assert.ok(prefs.some(([key,value])=>key==='media.volume_scale'&&value==='0.0'));assert.ok(!prefs.some(([key,value])=>key==='media.block-autoplay-until-user-interaction'&&value===true));
  result.checks.push('原声音/视频字段独立保存回读；真实 Chrome 静音参数不再拦截视频网址，而关闭视频真实阻止 .webm 请求；Firefox 生成全局音量 0 且不附带视频 autoplay 禁止');result.limitations=['本测试不测量实际扬声器输出；Firefox 音量配置生成已验证，真实物理声音未验收。'];result.passed=true;
 }catch(error){result.failure=error.stack;process.exitCode=1;}finally{await browser?.close();await service?.agent.shutdown();await engine.stopAll();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/media-preferences-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

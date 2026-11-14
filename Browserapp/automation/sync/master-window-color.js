'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),cdp=require('../../cdp');
const {extensionIdFromPath}=require('../extension-identity');
const PANEL='chrome://customize-chrome-side-panel.top-chrome/';
const PICKER='chrome://resources/cr_components/theme_color_picker/theme_color_picker.mojom-webui.js';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function parseColor(value){const hex=String(value).replace(/^#/,'');if(!/^(?:[a-f\d]{6}|[a-f\d]{8})$/i.test(hex))throw Error('无效主控颜色');return {hex:hex.toUpperCase(),rgb:[0,2,4].map(start=>parseInt(hex.slice(start,start+2),16)),alpha:hex.length===8?parseInt(hex.slice(6),16)/255:1,reset:hex.toUpperCase()==='C7CDD1'};}
async function atomic(file,value){const temporary=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temporary,JSON.stringify(value),{mode:0o600});await fs.rename(temporary,file);}catch(error){await fs.rm(temporary,{force:true});throw error;}}
function paths(item){const directory=path.join(item.root,'OpenBrowserControlTheme');return {directory,state:path.join(directory,'state.json'),manifest:path.join(directory,'manifest.json'),id:extensionIdFromPath(directory)};}
async function readState(item){const p=paths(item);let data;try{data=JSON.parse(await fs.readFile(p.state,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}if(data.original?.thirdPartyPath&&(!path.isAbsolute(data.original.thirdPartyPath)||data.original.thirdPartyPath.includes('\0')))throw Error('本地主控主题目录无效');if(data.version!==1||data.id!==p.id||!data.original?.theme||!Number.isInteger(data.original.theme.seedColor?.value)||!/^$|^[a-p]{32}$/.test(data.original.thirdPartyId||''))throw Error('本地主控配色恢复记录无效');return data;}
async function needsStartupRecovery(root){const record=await readState({root});if(!record)return false;let preferences;try{preferences=JSON.parse(await fs.readFile(path.join(root,'Default/Preferences'),'utf8'));}catch(error){if(error.code==='ENOENT')return false;throw error;}return preferences.extensions?.theme?.id===record.id;}
async function withControlPage(item,operation){const connection=new cdp.PersistentConnection(await cdp.browserSocket(item.port));let targetId,sessionId,failure,previousTarget,activateVisible;try{await connection.open();const target=await connection.command('Target.createTarget',{url:PANEL,background:true});targetId=target.targetId;sessionId=(await connection.command('Target.attachToTarget',{targetId,flatten:true})).sessionId;
 const evaluate=async(expression)=>{const response=await connection.command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true},{sessionId,timeout:7000});if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description||response.exceptionDetails.text||'浏览器主题接口执行失败');return response.result?.value;};
 activateVisible=async(id,knownSession)=>{
  await connection.command('Target.activateTarget',{targetId:id});
  const attached=knownSession||((await connection.command('Target.attachToTarget',{targetId:id,flatten:true})).sessionId);
  try{
   const deadline=Date.now()+4000;let stable=0;
   while(Date.now()<deadline){
    const answer=await connection.command('Runtime.evaluate',{expression:'document.visibilityState',returnByValue:true},{sessionId:attached,timeout:2000});
    if(answer.exceptionDetails)throw Error('无法确认浏览器标签可见状态');
    stable=answer.result?.value==='visible'?stable+1:0;
    if(stable===2)return;
    await sleep(30);
   }
   throw Error('浏览器标签激活未完成');
  }finally{if(!knownSession)await connection.command('Target.detachFromTarget',{sessionId:attached});}
 };
 const navigate=async(url)=>{await connection.command('Page.navigate',{url},{sessionId});const deadline=Date.now()+6000;while(Date.now()<deadline){if(await evaluate('location.href.startsWith('+JSON.stringify(url.split('?')[0])+') && document.readyState!=="loading"'))return;await sleep(30);}throw Error('浏览器主题接口未能加载');};
 await navigate(PANEL);
 const theme=()=>evaluate(`(async()=>{if(location.origin!=='chrome://customize-chrome-side-panel.top-chrome')throw Error('Invalid theme origin');const {browserProxyFactory}=await import(${JSON.stringify(PICKER)});const p=browserProxyFactory.getInstance();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{p.callbackRouter.removeListener(id);reject(Error('Theme callback timed out'))},3000);const id=p.callbackRouter.setTheme.addListener(value=>{clearTimeout(timer);p.callbackRouter.removeListener(id);resolve(value)});p.handler.updateTheme();});})()`);
 const management=async(action,id)=>{await navigate('chrome://extensions/?openbrowser-native-control='+crypto.randomUUID());try{return await evaluate(`new Promise((resolve,reject)=>{if(location.origin!=='chrome://extensions')throw Error('Invalid extension origin');const done=value=>chrome.runtime.lastError?reject(Error(chrome.runtime.lastError.message)):resolve(value);${action==='list'?"chrome.management.getAll(value=>done(value.filter(row=>row.type==='theme'&&row.enabled).map(row=>row.id)))":"chrome.management.setEnabled("+JSON.stringify(id)+",true,()=>done(true))"}})`);}finally{await navigate(PANEL);}};
 const activate=async()=>{
  if(previousTarget)return;
  const ownWindow=(await connection.command('Browser.getWindowForTarget',{targetId})).windowId;
  const targets=(await connection.command('Target.getTargets')).targetInfos.filter(row=>row.type==='page'&&row.targetId!==targetId),sessions=[];
  try{
   for(const row of targets){
    const window=(await connection.command('Browser.getWindowForTarget',{targetId:row.targetId})).windowId;
    if(window===ownWindow)sessions.push({targetId:row.targetId,sessionId:(await connection.command('Target.attachToTarget',{targetId:row.targetId,flatten:true})).sessionId});
   }
   const deadline=Date.now()+4000;let candidate,stable=0;
   while(Date.now()<deadline){
    let visible;
    for(const row of sessions){
     const answer=await connection.command('Runtime.evaluate',{expression:'document.visibilityState',returnByValue:true},{sessionId:row.sessionId,timeout:2000});
     if(answer.exceptionDetails)throw Error('无法读取浏览器标签可见状态');
     if(answer.result?.value==='visible'){visible=row.targetId;break;}
    }
    stable=visible&&visible===candidate?stable+1:visible?1:0;candidate=visible;
    if(stable===2){previousTarget=candidate;break;}
    await sleep(30);
   }
  }finally{for(const row of sessions)await connection.command('Target.detachFromTarget',{sessionId:row.sessionId});}
  if(!previousTarget)throw Error('无法确定当前浏览器标签，未改变主题');
  await activateVisible(targetId,sessionId);
 };
 return await operation({connection,evaluate,theme,management,activate});
 }catch(error){failure=error;throw error;}finally{try{if(targetId){const closed=await connection.command('Target.closeTarget',{targetId},{timeout:3000});if(!closed.success)throw Error('浏览器主题控制页未关闭');const deadline=Date.now()+3000;while((await connection.command('Target.getTargets')).targetInfos.some(row=>row.targetId===targetId)){if(Date.now()>=deadline)throw Error('浏览器主题控制页关闭尚未完成');await sleep(20);}if(previousTarget)await activateVisible(previousTarget);}}catch(error){if(failure)throw new AggregateError([failure,error],'主题更新失败，控制页清理也失败');throw error;}finally{connection.close();}}
}
async function backupTheme(source,destination){
 let bytes=0,count=0;async function inspect(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name),stat=await fs.lstat(file);if(stat.isSymbolicLink()||(!stat.isDirectory()&&!stat.isFile()))throw Error('原主题包含不支持的文件');if(stat.isDirectory())await inspect(file);else{bytes+=stat.size;if(++count>2000||bytes>64*1024*1024)throw Error('原主题超出本地恢复快照上限');}}}
 await inspect(source);const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));if(!manifest.theme||manifest.background||manifest.content_scripts)throw Error('原主题不是纯主题扩展');if(path.resolve(source)===path.resolve(destination))return;await fs.rm(destination,{recursive:true,force:true});await fs.cp(source,destination,{recursive:true,dereference:false});bytes=0;count=0;await inspect(destination);
}
async function restoreWith(control,original,item){
 if(original.thirdPartyId){try{await control.management('enable',original.thirdPartyId);}catch(error){if(!/Failed to find extension/.test(error.message)||!original.thirdPartyPath)throw error;let source=original.thirdPartyPath;try{await fs.access(path.join(source,'manifest.json'));}catch(missing){if(missing.code!=='ENOENT')throw missing;source=path.join(paths(item).directory,'original-theme');}const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));if(!manifest.theme||manifest.background||manifest.content_scripts)throw Error('原主题恢复包无效');await control.activate();const loaded=await control.connection.command('Extensions.loadUnpacked',{path:source});if(loaded.id!==original.thirdPartyId)throw Error('原主题恢复身份不匹配，恢复记录已保留');}}else{
  await control.evaluate(`(async()=>{const {browserProxyFactory}=await import(${JSON.stringify(PICKER)});const p=browserProxyFactory.getInstance();const original=${JSON.stringify(original.theme)};if(original.isGreyBaseline)p.handler.setGreyDefaultColor();else if(original.seedColor.value)p.handler.setSeedColor(original.seedColor,original.browserColorVariant);else p.handler.setDefaultColor();const {CustomizeChromeApiProxy}=await import('./customize_chrome_api_proxy.js');CustomizeChromeApiProxy.getInstance().handler.setFollowDeviceTheme(original.followDeviceTheme);return true;})()`);
 }
 const restored=await control.theme();const expected=original.theme;
 if(restored.hasThirdPartyTheme!==expected.hasThirdPartyTheme||restored.seedColor.value!==expected.seedColor.value||restored.isGreyBaseline!==expected.isGreyBaseline||restored.followDeviceTheme!==expected.followDeviceTheme||restored.hasBackgroundImage!==expected.hasBackgroundImage)throw Error('原浏览器主题未完整恢复，恢复记录已保留');
 if(original.thirdPartyId){const enabled=await control.management('list');if(!enabled.includes(original.thirdPartyId))throw Error('原第三方主题未启用');}
}
async function restoreOwnedColor(item,{recoverOnRestart=false}={}){const record=await readState(item);if(!record)return false;return withControlPage(item,async control=>{const installed=await control.connection.command('Extensions.getExtensions');const owned=installed.extensions?.find(row=>row.id===record.id&&row.enabled);if((owned||recoverOnRestart)&&record.original.thirdPartyId)await restoreWith(control,record.original,item);if(owned){const current=await control.connection.command('Extensions.getExtensions');if(current.extensions?.some(row=>row.id===record.id))await control.connection.command('Extensions.uninstall',{id:record.id});}if((owned||recoverOnRestart)&&!record.original.thirdPartyId)await restoreWith(control,record.original,item);await fs.rm(paths(item).state,{force:true});return true;});}
async function setWindowColor(item,value){const color=parseColor(value);const socket=await cdp.browserSocket(item.port);
 try{await cdp.call(socket,'Browser.setColor',{rgb:color.reset?'':((color.hex.length===8?color.hex.slice(6):'FF')+color.hex.slice(0,6))});return {backend:'native-command',color:value};}catch(error){if(!/wasn't found|not found|-32601/i.test(error.message))throw error;}
 if(color.reset){await restoreOwnedColor(item);return {backend:'local-theme',color:value,reset:true};}
 const p=paths(item);await fs.mkdir(p.directory,{recursive:true});const prior=await readState(item);let oldManifest;try{oldManifest=JSON.parse(await fs.readFile(p.manifest,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 return withControlPage(item,async control=>{const current=await control.theme();if(current.colorsManagedByPolicy)throw Error('浏览器主题由系统策略控制，未改变原主题');const installed=await control.connection.command('Extensions.getExtensions'),ours=installed.extensions?.some(row=>row.id===p.id&&row.enabled);let original=ours&&prior?prior.original:null;if(!original){const ids=current.hasThirdPartyTheme?await control.management('list'):[];original={theme:current,thirdPartyId:ids.find(id=>id!==p.id)||''};if(current.hasThirdPartyTheme&&!original.thirdPartyId)throw Error('无法读取原第三方主题，已取消配色');if(original.thirdPartyId){const extension=installed.extensions?.find(row=>row.id===original.thirdPartyId);if(!extension?.path)throw Error('无法读取原第三方主题目录，已取消配色');original.thirdPartyPath=extension.path;await backupTheme(extension.path,path.join(p.directory,'original-theme'));}}
 const luminance=color.rgb.reduce((sum,c,index)=>sum+[0.2126,0.7152,0.0722][index]*(c/255<=0.04045?c/255/12.92:((c/255+0.055)/1.055)**2.4),0),text=luminance>0.179?[0,0,0]:[255,255,255],rgba=[...color.rgb,color.alpha];
 const manifest={manifest_version:3,name:'OpenBrowser master control color',version:'1.0',theme:{colors:{frame:rgba,frame_inactive:rgba,toolbar:rgba,tab_background_text:text,tab_text:text,bookmark_text:text}}};
 const record={version:1,id:p.id,original,color:value};await atomic(p.state,record);
 try{await atomic(p.manifest,manifest);await control.activate();const loaded=await control.connection.command('Extensions.loadUnpacked',{path:p.directory});if(loaded.id!==p.id)throw Error('主控主题身份不匹配');const ready=await control.theme();if(!ready.hasThirdPartyTheme)throw Error('主控主题未实际应用');return {backend:'local-theme',color:value,id:p.id};}
 catch(error){try{if(ours&&oldManifest){await atomic(p.manifest,oldManifest);await control.connection.command('Extensions.loadUnpacked',{path:p.directory});await atomic(p.state,prior);}else{const after=await control.connection.command('Extensions.getExtensions');if(after.extensions?.some(row=>row.id===p.id))await control.connection.command('Extensions.uninstall',{id:p.id});await restoreWith(control,original,item);await fs.rm(p.state,{force:true});}}catch(rollback){throw new AggregateError([error,rollback],'主控配色失败，原主题恢复也失败');}throw error;}
 });
}
module.exports={setWindowColor,restoreOwnedColor,parseColor,withControlPage,needsStartupRecovery};

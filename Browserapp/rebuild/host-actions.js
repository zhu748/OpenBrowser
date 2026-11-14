"use strict";
const fs=require('node:fs/promises'),path=require('node:path'),{promisify}=require('node:util'),{execFile}=require('node:child_process');
const {writeRawAtomically}=require('../engine/state-storage'),{buildExecLine,resolveLaunchBinary}=require('../automation/linux-autostart');
function parseLaunch(args){
 const id=args.find(arg=>arg.startsWith('--openbrowser-profile='))?.slice(22),urls=args.filter(arg=>/^https?:\/\//i.test(arg));
 if(id&&!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw Error('无效启动窗口 ID');
 for(const raw of urls){const url=new URL(raw);if(url.username||url.password||raw.length>8192)throw Error('无效启动网址');}
 if(urls.length>20)throw Error('启动网址最多 20 个');return {id,urls};
}
function launchSpec(app){
 const binary=resolveLaunchBinary(),args=[];
 // Development Electron needs the application entry, installed builds do not.
 for(const flag of ['--no-sandbox','--ozone-platform=headless','--disable-gpu'])if(process.argv.includes(flag))args.push(flag);
 if(!app.isPackaged)args.push(app.getAppPath());
 args.push('--openbrowser-user-data='+app.getPath('userData'));return {binary,args};
}
async function shortcut(service,p,{app,shell} = require('electron')){
 const id=String(p.dirId||p.id||p.windowId||''),profile=service.engine.profiles.get(id);if(!profile||profile.trashed)throw Error('窗口不存在');
 const spec=launchSpec(app),args=[...spec.args,'--openbrowser-profile='+id],name=('OpenBrowser '+(p.__orderName||profile.name||id)).replace(/[<>:"/\\|?*\x00-\x1f\r\n]/g,' ').slice(0,120),desktop=app.getPath('desktop');
 await fs.mkdir(desktop,{recursive:true});
 const icon=path.join(app.getAppPath(),'assets/logo-pixel.png');
 if(process.platform==='linux'){
  const file=path.join(desktop,'openbrowser-'+id+'.desktop'),entry='[Desktop Entry]\nType=Application\nVersion=1.0\nName='+name.replace(/\\/g,'\\\\')+'\nExec='+buildExecLine(spec.binary,args).replace(/%/g,'%%')+'\nIcon='+icon.replace(/\\/g,'\\\\')+'\nTerminal=false\nCategories=Network;WebBrowser;\n';
  await writeRawAtomically(file,entry,0o700);return {file};
 }
 if(process.platform==='win32'){
  const quote=arg=>'"'+String(arg).replace(/(\\*)"/g,'$1$1\\"').replace(/(\\+)$/,'$1$1')+'"',file=path.join(desktop,name+'.lnk');
  if(!shell.writeShortcutLink(file,'create',{target:spec.binary,args:args.map(quote).join(' '),description:'OpenBrowser '+profile.name,icon:path.join(app.getAppPath(),'assets/logo.ico')}))throw Error('Windows 快捷方式创建失败');return {file};
 }
 if(process.platform==='darwin'){
  const directory=path.join(desktop,name+'.app'),contents=path.join(directory,'Contents');await fs.mkdir(path.join(contents,'MacOS'),{recursive:true});
  await fs.mkdir(path.join(contents,'Resources'),{recursive:true});await fs.copyFile(path.join(app.getAppPath(),'assets/logo.icns'),path.join(contents,'Resources/logo.icns'));
  const quote=value=>"'"+String(value).replace(/'/g,"'\\''")+"'",xml=value=>String(value).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
  await writeRawAtomically(path.join(contents,'MacOS/launcher'),'#!/bin/sh\nexec '+[spec.binary,...args].map(quote).join(' ')+' "$@"\n',0o700);
  await writeRawAtomically(path.join(contents,'Info.plist'),'<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>local.openbrowser.profile.'+xml(id)+'</string><key>CFBundleExecutable</key><string>launcher</string><key>CFBundleIconFile</key><string>logo.icns</string><key>CFBundleName</key><string>'+xml(name)+'</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>',0o600);return {file:directory};
 }
 throw Error('当前系统不支持桌面快捷方式');
}
async function setDefault(service,p,{app,shell}=require('electron')){
 const id=String(p.dirId||p.id||p.windowId||'');if(!service.engine.profiles.has(id)||service.engine.profiles.get(id).trashed)throw Error('窗口不存在');
 const spec=launchSpec(app),protocols=['http','https'];
 // Record the chosen target before changing OS handlers. An immediately
 // dispatched OS URL must already know which isolated profile to launch.
 service.data.settings.defaultProfileId=id;await service.save();
 try {
 if(process.platform==='linux'){
  await fs.mkdir(process.env.XDG_CONFIG_HOME||path.join(app.getPath('home'),'.config'),{recursive:true,mode:0o700});
  const base=process.env.XDG_DATA_HOME||path.join(app.getPath('home'),'.local/share'),file=path.join(base,'applications/openbrowser-default.desktop');await fs.mkdir(path.dirname(file),{recursive:true});
  await writeRawAtomically(file,'[Desktop Entry]\nType=Application\nName=OpenBrowser\nExec='+buildExecLine(spec.binary,spec.args).replace(/%/g,'%%')+' %u\nTerminal=false\nMimeType=x-scheme-handler/http;x-scheme-handler/https;\n',0o600);
  for(const protocol of protocols){await promisify(execFile)('xdg-mime',['default','openbrowser-default.desktop','x-scheme-handler/'+protocol],{timeout:10000,maxBuffer:65536});const {stdout}=await promisify(execFile)('xdg-mime',['query','default','x-scheme-handler/'+protocol],{timeout:10000,maxBuffer:65536});if(stdout.trim()!=='openbrowser-default.desktop')throw Error('系统未接受默认浏览器设置');}
 }else{
  for(const protocol of protocols)app.setAsDefaultProtocolClient(protocol,spec.binary,spec.args);
  if(protocols.some(protocol=>!app.isDefaultProtocolClient(protocol,spec.binary,spec.args))){
   await shell.openExternal(process.platform==='win32'?'ms-settings:defaultapps':'x-apple.systempreferences:com.apple.preference.general');return {applied:false,message:'请在系统默认应用设置中选择 OpenBrowser，确认后重新检查'};
  }
 }
 return {applied:true,message:'已设为默认浏览器'};
 } catch(error) { return {applied:false,message:'系统默认浏览器设置失败：'+error.message}; }
}
async function openLaunch(engine,request,defaultId){
 const id=request.id||defaultId;if(!id&&!request.urls.length)return false;
 if(!id)throw Error('尚未选择默认浏览器窗口');const profile=engine.profiles.get(id);if(!profile||profile.trashed)throw Error('启动窗口不存在或已在回收站');
 await engine.start(engine.profileForEdit(id).profile);
 const item=engine.running.get(id);
 for(const url of request.urls){
  if(item.engine==='firefox'){const {context}=await item.bidiConnection.command('browsingContext.create',{type:'tab'});await item.bidiConnection.command('browsingContext.navigate',{context,url,wait:'complete'});}
  else await require('../cdp').newTab(item.port,url);
 }
 return true;
}
module.exports={shortcut,setDefault,launchSpec,parseLaunch,openLaunch};

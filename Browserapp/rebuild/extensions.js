"use strict";
const fs = require("node:fs/promises"), path = require("node:path"), crypto = require("node:crypto"),
  {fileURLToPath}=require("node:url"),{crxZip}=require("../store-extension"),zipReader=require("../automation/zip-reader"),
  {persistExtensionChanges,serializeExtensionMutation}=require("../engine/map-publication");
const DEFAULT="local-default", MAX=256*1024*1024;
class Extensions {
  constructor(service){this.service=service;this.engine=service.engine;this.root=path.join(service.root,"local-extensions");this.pending=new Map();this.cleanup=new Set();}
  async icon(extension){
    if(extension.iconUrl?.startsWith("file:")){
      const file=fileURLToPath(extension.iconUrl),real=await fs.realpath(file),base=await fs.realpath(extension.path),stat=await fs.lstat(file);
      if(!stat.isSymbolicLink()&&stat.isFile()&&stat.size<=2*1024*1024&&real.startsWith(base+path.sep)){
        const bytes=await fs.readFile(real);let mime;
        if(bytes.subarray(0,4).equals(Buffer.from([0,0,1,0])))mime='image/x-icon';
        else if(/^(?:\s*<\?xml[^>]*>\s*)?<svg\b/i.test(bytes.toString('utf8')))mime='image/svg+xml';
        else {try{mime=require("./agent-files").mime(bytes);}catch{return '/images/openbrowser.png';}}
        if(mime.startsWith("image/"))return "data:"+mime+";base64,"+bytes.toString("base64");
      }
    }
    return "/images/openbrowser.png";
  }
  async dto(extension){
    const profiles=(extension.assignedProfileIds||[]).map(id=>this.engine.profiles.get(id)).filter(Boolean),
      groups=[...new Set(profiles.map(profile=>profile.groupId||DEFAULT))];
    return {id:extension.id,pluginDir:extension.id,localKey:extension.id,pluginName:extension.name,
      pluginVersion:extension.version,pluginDescription:extension.description||"",pluginIcon:await this.icon(extension),
      pluginSwitchType:2,source:extension.builtIn?"sys":extension.storeId?"store":"local",canDelete:!extension.builtIn,
      fixedPlugin:extension.fixedPlugin||"customize",pluginUpdateState:2,bindPluginId:groups,
      projectIds:groups,installType:extension.enabledAll?1:2,
      projectNames:groups.map(id=>id===DEFAULT?"默认项目":this.service.data.groups.find(group=>group.id===id)?.projectName||id),
      bindPlugin:groups.map(id=>id===DEFAULT?'默认项目':this.service.data.groups.find(group=>group.id===id)?.projectName||id),
    };
  }
  existing(id){const extension=this.engine.listExtensions().find(row=>row.id===String(id));if(!extension)throw Error("扩展不存在");return extension;}
  async boundedTree(root){
    let count=0,size=0;
    const visit=async(directory,depth)=>{
      if(depth>20)throw Error("扩展目录层级过深");
      for(const name of await fs.readdir(directory)){
        const file=path.join(directory,name),stat=await fs.lstat(file);
        if(stat.isSymbolicLink())throw Error("扩展目录不能包含符号链接");
        if(stat.isDirectory())await visit(file,depth+1);
        else if(!stat.isFile()||++count>5000||(size+=stat.size)>MAX||stat.size>64*1024*1024)throw Error("扩展最多 5000 文件、合计 256 MiB、单个 64 MiB");
      }
    };await visit(root,0);
  }
  async select(kind){
    if(!["dir","file"].includes(kind))throw Error("无效扩展选择类型");
    const picked=await this.service.dialog.showOpenDialog(this.service.window(),{properties:[kind==="dir"?"openDirectory":"openFile"],...(kind==="file"?{filters:[{name:"Extension",extensions:["zip","crx"]}]}:{})});
    if(picked.canceled||!picked.filePaths?.[0])return {type:"cancel"};
    const selected=picked.filePaths[0];let directory=selected,temporary=false;
    await fs.mkdir(this.root,{recursive:true,mode:0o700});
    try{
      if(kind==="file"){
        const stat=await fs.lstat(selected);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>50*1024*1024)throw Error("扩展压缩包不能超过 50 MiB");
        const bytes=await fs.readFile(selected);if(bytes.length>50*1024*1024)throw Error("扩展压缩包不能超过 50 MiB");
        const archive=zipReader.open(path.extname(selected).toLowerCase()===".crx"?crxZip(bytes):bytes);
        if(archive.entries.length>5000||archive.entries.reduce((sum,entry)=>sum+entry.size,0)>MAX)throw Error("扩展压缩包展开后过大");
        const seen=new Set();
        for(const entry of archive.entries){
          const name=entry.name;
          const type=(entry.unixMode>>>12)&15;
          if(type&&type!==8&&type!==4)throw Error('扩展包不能包含符号链接或特殊文件');
          if(!name||name.includes("\\")||name.startsWith("/")||name.includes(":")||name.split("/").some(part=>part===".."||part===".")||/[\x00-\x1f]/.test(name)||seen.has(process.platform==="win32"?name.toLowerCase():name))throw Error("扩展包路径无效或重复");
          seen.add(process.platform==="win32"?name.toLowerCase():name);
        }
        const manifests=archive.entries.filter(entry=>/(?:^|\/)manifest\.json$/.test(entry.name));
        const base=archive.has("manifest.json")?"":manifests.length===1?manifests[0].name.slice(0,-13):null;
        if(base===null||archive.entries.some(entry=>base&&!entry.name.startsWith(base)))throw Error("扩展包必须包含唯一的根 manifest.json");
        directory=await fs.mkdtemp(path.join(this.root,".archive-"));temporary=true;
        for(const entry of archive.entries){
          const relative=entry.name.slice(base.length);if(!relative)continue;
          const target=path.join(directory,relative);
          if(entry.name.endsWith("/")){await fs.mkdir(target,{recursive:true});continue;}
          await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,archive.read(entry.name),{flag:"wx",mode:0o600});
        }
      }
      await this.boundedTree(directory);const extension=await this.engine.readExtension(directory,false),token=crypto.randomUUID();
      if(this.pending.size>=16){const [old,grant]=this.pending.entries().next().value;if(grant.temporary)await fs.rm(grant.directory,{recursive:true,force:true});this.pending.delete(old);}
      this.pending.set(token,{directory,temporary,extension});
      return {type:"success",data:{pluginPath:token,pluginDir:token,pluginName:extension.name,pluginVersion:extension.version,pluginDesc:extension.description,pluginIconPath:await this.icon(extension),pluginIcon:await this.icon(extension)}};
    }catch(error){if(temporary)await fs.rm(directory,{recursive:true,force:true});throw error;}
  }
  stage(payload){
    if(!this.pending.has(payload.pluginPath))throw Error("请重新选择本地扩展");
    return {localToken:payload.pluginPath};
  }
  async metadata(id,fields){
    return serializeExtensionMutation(this.engine,async()=>{
      const existing=this.existing(id),next={...existing,...fields};
      // assignedProfileIds/enabledAll are computed list fields, not persistence.
      for(const key of ["assignedProfileIds","assignedProfiles","enabledAll"])delete next[key];
      await persistExtensionChanges(this.engine,[[next.id,next]]);return next;
    });
  }
  async finish(payload){
    const grant=this.pending.get(payload.localToken);if(!grant)throw Error("本地扩展选择已失效，请重新选择");
    if(typeof payload.pluginName!=="string"||!payload.pluginName.trim()||payload.pluginName.length>50||String(payload.pluginDesc||"").length>500)throw Error("扩展名称或说明无效");
    const old=payload.pluginDir&&this.engine.extensions.get(payload.pluginDir);
    if(old?.builtIn)throw Error("内置扩展不能替换");
    if(old&&this.engine.listExtensions().find(row=>row.id===old.id)?.assignedProfileIds.some(id=>this.engine.running.has(id)||this.engine.starting.has(id)))throw Error("请先停止使用此扩展的窗口，再更新");
    const temporary=await fs.mkdtemp(path.join(this.root,".prepare-"));let destination,backup,extension,committed=false;
    try{
      await this.boundedTree(grant.directory);await fs.cp(grant.directory,temporary,{recursive:true,dereference:false});await this.boundedTree(temporary);await this.engine.readExtension(temporary,false);
      if(old){
        const base=await fs.realpath(this.root),real=await fs.realpath(old.path);
        if(!real.startsWith(base+path.sep))throw Error("旧目录扩展请在原目录编辑后重新加载，或移除后重新导入");
        destination=old.path;backup=old.path+".backup-"+crypto.randomUUID();await fs.rename(old.path,backup);await fs.rename(temporary,destination);
      }else{destination=path.join(this.root,crypto.randomUUID());await fs.rename(temporary,destination);}
      const read=await this.engine.readExtension(destination,false);
      extension={...old,...read,name:payload.pluginName.trim(),description:String(payload.pluginDesc||'')};
      await serializeExtensionMutation(this.engine,()=>persistExtensionChanges(this.engine,[[extension.id,extension]]));
      committed=true;
      if(backup)await fs.rm(backup,{recursive:true,force:true});
      if(grant.temporary)await fs.rm(grant.directory,{recursive:true,force:true});this.pending.delete(payload.localToken);
      return {plugin_id:extension.id};
    }catch(error){
      // Publication is the commit point. A cleanup error must never restore
      // old files beneath already committed new metadata. Tell the caller
      // the update succeeded but cleanup needs retry, retaining backup files.
      if(committed){if(backup)this.cleanup.add(backup);if(grant.temporary)this.cleanup.add(grant.directory);this.pending.delete(payload.localToken);throw Object.assign(new Error('扩展已更新，但临时文件清理失败：'+error.message),{code:'EXTENSION_CLEANUP_FAILED',committed:true,extensionId:extension.id,cause:error});}
      if(backup){await fs.rm(destination,{recursive:true,force:true});await fs.rename(backup,destination);}
      else if(destination)await fs.rm(destination,{recursive:true,force:true});
      throw error;
    }finally{await fs.rm(temporary,{recursive:true,force:true});}
  }
  async request(method,p={}){
    if(method==='exists'){const extension=this.existing(p.id);await this.engine.readExtension(extension.path,extension.builtIn);return true;}
    if(method==='show'){const extension=this.existing(p.id);await this.engine.readExtension(extension.path,extension.builtIn);require('electron').shell.showItemInFolder(path.join(extension.path,'manifest.json'));return true;}
    if(method==='verify'){
      if(!Array.isArray(p.ids)||p.ids.length>200)throw Error('无效扩展列表');
      return Promise.all(p.ids.map(async id=>{const extension=this.existing(id);await this.engine.readExtension(extension.path,extension.builtIn);return {status:'fulfilled',value:extension.id};}));
    }
    if(method==='verify-removed'){
      if(!Array.isArray(p.ids)||p.ids.some(id=>this.engine.extensions.has(id)))throw Error('扩展尚未移除');return true;
    }
    if(method==="list"){
      let rows=await Promise.all(this.engine.listExtensions().map(extension=>this.dto(extension)));
      if(p.queryValue){const query=String(p.queryValue).toLowerCase();rows=rows.filter(row=>(row.pluginName+" "+row.pluginDescription).toLowerCase().includes(query));}
      const size=Math.max(1,Math.min(200,Number(p.page_size)||200)),page=Math.max(1,Number(p.page_index)||1);return {rows:rows.slice((page-1)*size,page*size),total:rows.length};
    }
    if(method==="read")return {rows:[await this.dto(this.existing(p.pluginId||p.pluginDir))]};
    if(method==="select")return this.select(p.kind);
    if(method==="stage")return this.stage(p);
    if(method==="finish")return this.finish(p);
    if(method==="store"){
      const extension=await this.engine.addStoreExtension(p.url);return {plugin_id:extension.id};
    }
    if(method==="assign"){
      const extension=this.existing(p.pluginId),projects=p.projectId;
      if(!Array.isArray(projects)||!Array.isArray(p.installStatus)||projects.length!==p.installStatus.length)throw Error("扩展项目分配参数无效");
      const known=new Set([DEFAULT,...this.service.data.groups.map(group=>group.id)]);
      if(projects.length>1000||new Set(projects).size!==projects.length||projects.some(id=>!known.has(id))||p.installStatus.some(value=>value!==0&&value!==1))throw Error('扩展项目或安装状态无效');
      const chosen=new Set(projects.filter((_id,index)=>p.installStatus[index]===1).map(String));
      const all=[...this.engine.profiles.values()].filter(profile=>!profile.trashed),selected=all.filter(profile=>chosen.has(profile.groupId||DEFAULT)).map(profile=>profile.id),enabled=new Set(selected);
      return serializeExtensionMutation(this.engine,async()=>{
        const changes=[];
        for(const profile of all){
          require('../engine/profile-maintenance').assertProfileNotMaintained(this.engine,profile.id);
          if(this.engine.deletingProfiles?.has(profile.id))throw Error('窗口正在删除');
          const before=this.engine.assignments.get(profile.id)||new Set(),next=new Set(before);
          if(enabled.has(profile.id))next.add(extension.id);else next.delete(extension.id);
          if(before.has(extension.id)!==next.has(extension.id))changes.push([profile.id,next]);
        }
        const next={...this.engine.extensions.get(extension.id),enabledByDefault:chosen.size===known.size,assignedGroupIds:[...chosen]};
        await persistExtensionChanges(this.engine,[[extension.id,next]],changes);
        return {assigned:selected.length,restartRequired:changes.map(([id])=>id).filter(id=>this.engine.running.has(id))};
      });
    }
    if(method==="pin"){
      if(!["customize","pin","unpin"].includes(p.fixedPlugin))throw Error("固定方式无效");
      await this.metadata(p.id,{fixedPlugin:p.fixedPlugin});return {saved:true,message:'固定方式已保存，窗口下次启动生效'};
    }
    if(method==="reload"){
      const extension=this.existing(p.pluginID||p.pluginId),updated=await this.engine.readExtension(extension.path,extension.builtIn);
      if(p.check)return {pluginUpdateStates:[{pluginUpdateState:updated.version===extension.version?2:1,pluginNewVersion:updated.version,pluginVersion:extension.version}]};
      await this.engine.reloadExtension(extension.id);return {updated:true};
    }
    if(method==="remove"){
      if(!Array.isArray(p.ids)||p.ids.length>200||!p.ids.length)throw Error("请选择 1–200 个扩展");
      for(const id of p.ids)if(this.existing(id).builtIn)throw Error("不能删除内置扩展");
      for(const id of p.ids){const extension=this.existing(id);await this.engine.removeExtension(id);if(extension.path.startsWith(this.root+path.sep))await fs.rm(extension.path,{recursive:true,force:true});}return {removed:p.ids};
    }
    throw Error("未知本地扩展操作");
  }
  async shutdown(){for(const grant of this.pending.values())if(grant.temporary)await fs.rm(grant.directory,{recursive:true,force:true});this.pending.clear();for(const directory of this.cleanup){await fs.rm(directory,{recursive:true,force:true});this.cleanup.delete(directory);}}
}
module.exports={Extensions,DEFAULT};

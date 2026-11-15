'use strict';
const { replaceExactly, patchComponentSetups } = require("./patch-source.cjs");
// Preserve archive header/popover render functions. Only lifecycle/data access
// changes: local notifications, explicit network probes and Native kernels.
const fs = require('node:fs');
const path = require('node:path');
const dir = 'work/rebuild/stage/assets';

function setups(file, replacements) {
  const target = path.join(dir, file);
  const source = fs.readFileSync(target, 'utf8');
  const result = patchComponentSetups(source, replacements, file);
  fs.writeFileSync(target, result);
}

setups('layout-C916OUcf.js',{
 _l:`const a=k({city:'本地网络',ip:'--'}),r=k(false);const assign=value=>{a.value={city:value.ip?[value.country_code,value.city].filter(Boolean).join('/'):'本地网络',ip:value.ip||value.localAddress||'--'};};async function o(){r.value=true;try{assign(await globalThis.__localRequest('host:network',{probe:true}));}finally{r.value=false;}}Ye(async()=>assign(await globalThis.__localRequest('host:network')))`
});
setups('identity-verification-entry-B8EzLOCj.js',{
 en:`const {popover:m,groups:h,selectedGroup:g,selectedItems:f,unreadCount:_,toggle:b,markRead:S,markAllRead:C,preventDefault:H,showDetails:te}=createNotifications({templateRef:k,ref:T,computed:j,onMounted:ee,translate:$t})`,
 ar:`const i=k('popover'),o=T(),s=T(false),c=T([]),p=T([]),g=T('kernel'),h=T([{title:$t('客户端升级'),list:c,value:'client',badge:0,component:se(Tn)},{title:$t('内核升级'),list:p,value:'kernel',badge:0,component:se(tr)}]),S=T(false),ee=T(),v=j(()=>p.value.flatMap(group=>group.list).filter(row=>row.status==='update').length),y=T(false);async function load(){const rows=await globalThis.__localRequest('kernels:list');p.value=[{title:$t('内核列表'),list:rows.map(row=>({coreType:row.engine==='firefox'?'Firefox':'Chrome',coreVersion:String(row.version).split('.')[0],status:'downloaded',_light:false,_desc:row.version,_engine:row.engine,_version:row.version,primary:row.primary}))}];}async function re(event){const target=event.currentTarget;await load();i.value.instance.toggle(event,target);}function le(){return load();}E(load)`,
 tr:`const f=T('All'),p=j(()=>{const all=e.upgradeList.flatMap(group=>group.list),available=e.upgradeList.map(group=>({...group,list:group.list.filter(row=>f.value==='All'||row.coreType===f.value)})).filter(group=>group.list.length);return {available,updateList:all.filter(row=>row.status==='update')};}),m=j(()=>['All','Chrome','Firefox'].map(value=>({value,name:value==='All'?$t('全部'):value,disabled:value==='Firefox'&&!e.upgradeList.flatMap(group=>group.list).some(row=>row.coreType==='Firefox')}))),u=T('');function b(row){row._light=false;}function h(row){return row.status==='downloaded'?$t('下载完成'):$t('下载');}function g(row){return row.status==='downloaded'?'base/rx_ic_check':'base/rx_ic_download';}async function v(event,row){await globalThis.ops.kernelInstallVersion(row._engine,row._version);r('onDownloadClick',row);}async function _(){for(const row of p.value.updateList)await v(null,row);}const confirm=Oe(),r=n;function y(event,row){confirm.require({target:event.currentTarget,message:$t('确定删除该内核吗？'),group:'popup',rejectProps:{label:$t('取消'),severity:'secondary',outlined:true},acceptProps:{label:$t('确定'),severity:'danger'},accept:async()=>{await globalThis.ops.kernelDelete(row._engine,row._version);row.status='uninstalled';}});}`,
 Tn:`const n=m(),s=T([]),[open]=Ue(),a=()=>'#';function p(){open({header:$t('更新日志'),slots:{default:()=>v('div',{class:'pa-4 tt-secondary'},['OpenBrowser v'+n.appVersion,' — '+$t('客户端随本地安装包更新')])}});}function l(row){return $t('管理与升级内核');}function d(){globalThis.__router.push('/kernels');}`,
});
// The archived render retains its original bindings; local behavior is imported.
const notificationFile=dir+'/identity-verification-entry-B8EzLOCj.js';
let code="import {createNotifications} from './workbench-notifications.js';\n"+fs.readFileSync(notificationFile,'utf8');
fs.copyFileSync('Browserapp/rebuild/workbench-notifications.mjs',dir+'/workbench-notifications.js');
const external='href:L(a)(`/changelog`),target:`_blank`,rel:`noopener noreferrer`';if(!code.includes(external))throw Error('Original changelog link changed');code=replaceExactly(code,external,'href:`#`,onClick:G(p,[`prevent`])','workbench changelog');fs.writeFileSync(dir+'/identity-verification-entry-B8EzLOCj.js',code);

for(const [file,replacements]of Object.entries({
 'layout-C916OUcf.js':[["icon:z(a).ip?", "'aria-label':'刷新网络定位',icon:z(a).ip?"],["Fg={class:`rx-layout-header`}","Fg={class:`rx-layout-header`,'data-testid':'workbench-header'}"]],
 'identity-verification-entry-B8EzLOCj.js':[["ref:`btn`,severity:","ref:`btn`,'aria-label':'更新',severity:"],["icon:`base/rx_ic_mail`,outlined:","icon:`base/rx_ic_mail`,'aria-label':'通知',outlined:"],["icon:`base/rx_ic_refresh`,size:`xs`","icon:`base/rx_ic_refresh`,'aria-label':'刷新界面',size:`xs`"]]
})){let text=fs.readFileSync(dir+'/'+file,'utf8');for(const [from,to]of replacements){if(!text.includes(from))throw Error('Original header accessibility boundary changed: '+from);text=replaceExactly(text,from,to,file+' accessibility');}fs.writeFileSync(dir+'/'+file,text);}

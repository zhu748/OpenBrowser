"use strict";
const fs=require('node:fs'),acorn=require('acorn'),walk=require('acorn-walk');
const root='work/rebuild/stage/assets',file=root+'/extensions-BlF5aO92.js';
let code=fs.readFileSync(file,'utf8');
const parse=text=>acorn.parse(text,{sourceType:'module',ecmaVersion:'latest'});
function component(name,transform){
  let target;
  walk.simple(parse(code),{VariableDeclarator(node){if(node.id.name===name)target=node.init;}});
  if(!target)throw Error('Missing extension component '+name);
  const original=code.slice(target.start,target.end),changed=transform(original);
  if(changed===original)throw Error('Extension patch did not change '+name);
  code=code.slice(0,target.start)+changed+code.slice(target.end);
}
function edit(text,visitor){
  const offset=/^\s*import\b/.test(text)?0:16,source=(offset?'const component=':'')+text,edits=[];
  visitor(parse(source),source,(node,value)=>edits.push([node.start,node.end,value]));
  let edge=Infinity;
  for(const [start,end,value]of edits.sort((a,b)=>b[0]-a[0])){
    if(end>edge)throw Error('Overlapping extension edits');
    edge=start;text=text.slice(0,start-offset)+value+text.slice(end-offset);
  }
  return text;
}
// Remove the entire cloud recommendation component, including its requests.
component('at',()=> 'void 0');
component('kn',text=>edit(text,(ast,source,replace)=>{
 walk.simple(ast,{
  FunctionDeclaration(node){if(node.id.name==='l')replace(node.body,"{r=false;if(e==='installed'&&s.value){a.value?.refresh();s.value=false;}}");if(node.id.name==='u'||node.id.name==='d')replace(node.body,'{r=false;}');},
  Property(node){if(node.key.name==='hub')replace(node,'...{}');},
  ArrayExpression(node){for(const item of node.elements)if(item?.type==='ObjectExpression'&&item.properties.some(p=>p.key?.name==='value'&&source.slice(p.value.start,p.value.end)==='`hub`'))replace(item,'...[]');},
 });
}));
component('Q',()=> '({personal:2})');
component('We',text=>edit(text,(ast,source,replace)=>{
  walk.simple(ast,{
    VariableDeclarator(node){if(node.id.name==='c')replace(node.init,"'2'");},
    ArrayExpression(node){
      const remove=node.elements.filter(item=>item?.type==='CallExpression'&&item.callee.name==='S'&&source.slice(item.start,item.end).includes('installForAllMembers')&&source.slice(item.start,item.end).includes('changeInList')&&!source.slice(item.start,item.end).includes('installToProjectTitle'));
      for(const item of remove)replace(item,"A('',true)");
    },
  });
}));
component('Ot',text=>edit(text,(ast,source,replace)=>{
  walk.simple(ast,{
    FunctionDeclaration(node){if(node.id.name==='l')replace(node.body,`{try{const selected=await globalThis.electronAPI.send('extension:getSelectedExtensionInfo',e);if(selected.type==='cancel')return;if(selected.type!=='success')throw Error(selected.message||'扩展读取失败');s.value={type:'success',isSuccess:true,...selected.data};}catch(error){n.add({severity:'error',summary:error.message,life:5000});}}`);},
    TemplateLiteral(node){if(node.quasis[0]?.value.cooked==='extension:uploadExtensionToOSS')replace(node,"'extension:stageLocal'");},
    ArrayExpression(node){for(const item of node.elements)if(item?.type==='CallExpression'&&item.callee.name==='S'&&item.arguments[0]?.quasis?.[0]?.value.cooked==='div'&&source.slice(item.start,item.end).includes('formatDailyLimit')&&!source.slice(item.start,item.end).includes('uploadFormat'))replace(item,"A('',true)");},
  });
}));
component('Cn',text=>edit(text,(ast,source,replace)=>{
  walk.simple(ast,{
    VariableDeclarator(node){if(node.id.name==='G')replace(node.init,"y({value:void 0,options:[],onChange(){I.value?.refresh();M.value=true},resetFilters(){G.value=void 0;G.onChange()}})");},
    CatchClause(node){if(source.slice(node.body.start,node.body.end).includes('v(-1,'))replace(node.body,source.slice(node.body.start,node.body.end-1)+';throw '+node.param.name+';}');},
    FunctionDeclaration(node){if(node.id.name==='Y')replace(node,'');},
    AwaitExpression(node){if(source.slice(node.start,node.end)==='await Y()')replace(node,'void 0');},
    Property(node){
      const key=node.key.name||node.key.value;
      if(key==='pluginSwitchType'&&node.value.type==='CallExpression')replace(node,"...{}");
      if(key==='content'&&source.slice(node.value.start,node.value.end).includes('formatDailyLimit'))replace(node,"...{}");
    },
    ArrayExpression(node){
      for(const item of node.elements){
        if(item?.type==='ObjectExpression'&&item.properties.some(p=>p.key?.name==='field'&&source.slice(p.value.start,p.value.end)==='`pluginSwitchType`'))replace(item,'...[]');
        if(item?.type==='CallExpression'&&item.callee.name==='P'&&source.slice(item.start,item.end).includes('modelValue:E(G).value'))replace(item,"A('',true)");
        if(item?.type==='CallExpression'&&item.callee.name==='P'&&item.arguments[0]?.name==='fe')replace(item,"A('',true)");
      }
    },
    CallExpression(node){if(node.callee.type==='MemberExpression'&&node.callee.property.name==='$emit'&&source.slice(node.start,node.end).includes('`search`'))replace(node,'ge()');},
  });
}));
// Labels used only by deleted cloud/team/quota branches have no runtime body.
code=edit(code,(ast,source,replace)=>{
  walk.simple(ast,{Property(node){if(['formatDailyLimit','installForAllMembers','ownershipColumn','recommendTab'].includes(node.key.name))replace(node,'...{}');},FunctionDeclaration(node){if(node.id.name==='we')replace(node.body,"{return {sys:$t('内置扩展'),local:$t('本地上传'),store:'Chrome Web Store'}[e];}");}});
});
if(/userRecordPluginUpload|userGetSystemPlugin|userGetPluginCategory|userAddSystemPlugin|uploadExtensionToOSS|Q\.team|formatDailyLimit|installForAllMembers/.test(code))throw Error('Cloud extension branch survived');
fs.writeFileSync(file,code);
if(process.env.REBUILD_REFERENCE_ONLY==='1')process.exit(0);
const routes=root+'/hook-CnJE4hRq.js';let routing=fs.readFileSync(routes,'utf8');
if(!routing.includes("children:[{path:'account'"))throw Error('Extension route boundary changed');
routing=routing.replace("children:[{path:'account'","children:[{path:'extensions',name:'local-extensions',component:()=>import('./extensions-DkcE60nw.js'),meta:{title:'扩展中心'}},{path:'account'");
fs.writeFileSync(routes,routing);
const layout=root+'/layout-C916OUcf.js';let sidebar=fs.readFileSync(layout,'utf8');
if(!sidebar.includes("{path:'templates',name:'local-templates'"))throw Error('Extension sidebar boundary changed');
sidebar=sidebar.replace("{path:'templates',name:'local-templates',meta:{title:'窗口模板',icon:'base/rx_ic_stack'}}","{path:'extensions',name:'local-extensions',meta:{title:$t('扩展中心'),icon:'base/rx_ic_extension_store'}}");fs.writeFileSync(layout,sidebar);

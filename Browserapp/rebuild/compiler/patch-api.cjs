"use strict";
const fs=require('node:fs'),acorn=require('acorn'),walk=require('acorn-walk'),root='work/rebuild/stage/assets',file=root+'/api-keys-qLZdcspG.js';let code=fs.readFileSync(file,'utf8');
const parse=text=>acorn.parse(text,{sourceType:'module',ecmaVersion:'latest'});let component;
walk.simple(parse(code),{VariableDeclarator(node){if(node.id.name==='zg')component=node.init;}});
if(!component)throw Error('API component changed');
const prefix=code.slice(0,component.start),suffix=code.slice(component.end),source=code.slice(component.start,component.end),wrapped='const component='+source,edits=[];
const replace=(node,value)=>edits.push([node.start-16,node.end-16,value]);let setup;
walk.simple(parse(wrapped),{
 Property(node){if(node.key.name==='setup'&&node.value.type==='FunctionExpression')setup=node.value.body;},
 VariableDeclarator(node){
  if(node.id.name==='Ne')replace(node.init,`ge(async()=>{try{const result=await r.base.userSetUserApiCreate(O.value);ee(result.code,result.msg);if(result.code===0){Ee.value={...result.data};O.value={...result.data};c(Pe.value,'port',result.data.port);await loadLocalMcpConfig();}}catch(error){ee(-1,error.message);await ze();}},300)`);
  if(node.id.name==='Ae')replace(node.init,'globalThis.isElectron');
  if(node.id.name==='Ie')replace(node.init,"x(()=>({standard:JSON.stringify(localMcpConfig.value,null,2),openCode:JSON.stringify({mcp:{openbrowser:{type:'local',command:[localMcpConfig.value.mcpServers?.openbrowser?.command,...(localMcpConfig.value.mcpServers?.openbrowser?.args||[])],environment:localMcpConfig.value.mcpServers?.openbrowser?.env,enabled:true}}},null,2)}))");
  if(node.id.name==='Le')replace(node.init,`x(()=>[{title:$t('API 文档'),content:()=>E('div',{class:'grid grid-cols-2 gap-2.5'},[E(Se,{class:'flex-1 !h-11',severity:'secondary',outlined:true,size:'lg',onClick:openLocalApiReference},{default:()=>[E('div',{class:'w-full flex items-center justify-start gap-1.5'},[E(ye,{name:'base/rx_ic_doc_api',color:'var(--colors-icon-icon-brand)'}),E('div',{class:'flex-1 text-left '+D.text},$t('API 文档')),E(ye,{name:'base/rx_ic_arrow_top_right',color:'var(--colors-icon-icon-brand)'})])]})])},{title:$t('集成代码示例'),content:()=>E('div',{class:'grid grid-cols-2 gap-2.5'},[E(Se,{class:'flex-1 !h-11',severity:'secondary',outlined:true,size:'lg',label:'OpenBrowser Local API',onClick:openLocalApiReference})])}])`);
  if(node.id.name==='Re')replace(node.init,`x(()=>[{title:$t('环境依赖'),content:()=>E('div',{class:'flex flex-col gap-1.5'},'OpenBrowser 内置运行时；无需安装远程 npm 包。')},{title:$t('安装'),content:()=>E('div',{class:'flex flex-col gap-1.5'},[E('div',null,[$t('标准配置适用于大多数工具')]),E('div',{class:'relative w-full '+D.copy},[E(Se,{class:D['copy-btn'],text:true,size:'xxs',icon:'base/rx_ic_copy',label:$t('复制'),onClick:()=>He(Ie.value.standard,'mcp_config_copy')}),E(sg,{class:'min-h-75',modelValue:Ie.value.standard,editable:false})])])},{title:$t('特定的客户端配置'),content:()=>E(De,{tabs:[{icon:'websites/rx_site_cursor',title:'Cursor / Claude / Codex',value:'1',render:()=>E('div',{class:'w-full flex flex-col'},[E('div',{class:'pa-3 '+D.platform},'将上方标准配置添加到客户端 MCP 配置。'),E('div',{class:'relative w-full '+D.copy},[E(Se,{class:D['copy-btn'],text:true,size:'xxs',icon:'base/rx_ic_copy',label:$t('复制'),onClick:()=>Ue(Ie.value.standard)}),E(sg,{class:'min-h-75',modelValue:Ie.value.standard,editable:false})])])},{icon:'websites/rx_site_opencode',title:'OpenCode',value:'5',render:()=>E('div',{class:'w-full flex flex-col'},[E('div',{class:'pa-3'},$t('更新您的 ~/.config/opencode/opencode.json')),E('div',{class:'relative w-full '+D.copy},[E(Se,{class:D['copy-btn'],text:true,size:'xxs',icon:'base/rx_ic_copy',label:$t('复制'),onClick:()=>Ue(Ie.value.openCode)}),E(sg,{class:'min-h-75',modelValue:Ie.value.openCode,editable:false})])])}],value:'1'})}])`);
 },
 FunctionDeclaration(node){if(node.id.name==='k'&&wrapped.slice(node.start,node.end).includes('userGetLlmInfoList'))replace(node.body,'{return loadLocalMcpConfig();}');},
 ObjectExpression(node){const href=node.properties.find(p=>p.key?.name==='href'&&wrapped.slice(p.value.start,p.value.end).includes('modelcontextprotocol.io'));if(href)replace(node,'{class:te([`cursor-pointer`,e.text.link]),role:"button",onClick:openLocalApiReference}');},
});
if(!setup)throw Error('API setup boundary changed');
edits.push([setup.start-15,setup.start-15,`let [showLocalDocs]=localDocDialog();let localMcpConfig=h({mcpServers:{}});async function loadLocalMcpConfig(){localMcpConfig.value=await globalThis.__localRequest('api:mcp-config');}async function openLocalApiReference(){const content=await globalThis.__localRequest('api:reference');showLocalDocs({header:'OpenBrowser API & MCP',class:'w-900px',slots:{default:()=>E('pre',{class:'whitespace-pre-wrap overflow-auto max-h-120 text-3'},content),footer:undefined}});}`]);
let result=source,edge=Infinity;for(const[start,end,value]of edits.sort((a,b)=>b[0]-a[0])){if(end>edge)throw Error('Overlapping API edits');edge=start;result=result.slice(0,start)+value+result.slice(end);}
if(/@roxybrowser|ROXY_API|subscribe-plan|upgrade-plan|userGetLlmInfoList|userPayInfo/.test(result)){
 // Subscription state in a destructuring declaration is removed by the main
 // commerce pass; no subscription logic/render/call may remain in this page.
 if(/@roxybrowser|ROXY_API|subscribe-plan|upgrade-plan|userGetLlmInfoList/.test(result))throw Error('Remote API configuration survived');
}
// EditorView owns mutable identity-sensitive state and must not be proxied.
let editorResult=prefix+result+suffix,editorInstance;
walk.simple(parse(editorResult),{AssignmentExpression(node){if(node.right.type==='NewExpression'&&node.right.callee.name==='q'&&editorResult.slice(node.left.start,node.left.end)==='r.value')editorInstance=node.right;}});
if(!editorInstance)throw Error('JSON EditorView ownership boundary changed');
editorResult=editorResult.slice(0,editorInstance.start)+'localMarkRaw('+editorResult.slice(editorInstance.start,editorInstance.end)+')'+editorResult.slice(editorInstance.end);
fs.writeFileSync(file,"import{t as localDocDialog}from'./useDialog-BC-nc8J-.js';import{vt as localMarkRaw}from'./runtime-core.esm-bundler-CBj16o9G.js';\n"+editorResult);
const routes=root+'/hook-CnJE4hRq.js',routeCode=fs.readFileSync(routes,'utf8');if(!routeCode.includes("children:[{path:'extensions'"))throw Error('API route boundary changed');
fs.writeFileSync(routes,routeCode.replace("children:[{path:'extensions'","children:[{path:'api-keys',name:'api-keys',component:()=>import('./api-keys-qLZdcspG.js'),meta:{title:'API & AI MCP'}},{path:'extensions'"));
const layout=root+'/layout-C916OUcf.js',sidebar=fs.readFileSync(layout,'utf8'),needle="{path:'skills',name:'agent-console-settings',meta:{title:'Skill 管理',icon:'base/rx_ic_doc_code'}}";if(!sidebar.includes(needle))throw Error('API sidebar boundary changed');fs.writeFileSync(layout,sidebar.replace(needle,"{path:'api-keys',name:'api-keys',meta:{title:'API & AI MCP',icon:'base/rx_ic_doc_code'}},"+needle));

"use strict";
const fs=require('node:fs'),acorn=require('acorn'),walk=require('acorn-walk'),root='work/rebuild/stage/assets',file=root+'/AgentSettingsRoute-BB9ba93X.js';
let code=fs.readFileSync(file,'utf8');const ast=acorn.parse(code,{sourceType:'module',ecmaVersion:'latest'}),edits=[];
walk.simple(ast,{
 FunctionDeclaration(node){if(node.id.name==='ae')edits.push([node.body.start,node.body.end,`{const call=(method,p={})=>globalThis.__agentRequest('mcp:'+method,p);return {listMcpServers:()=>call('list'),upsertMcpServer:(name,config,oldName)=>call('upsert',{name,config,oldName}),importMcpServers:mcpServers=>call('import',{mcpServers}),deleteMcpServer:name=>call('delete',{name}),enableMcpServer:name=>call('enable',{name}),disableMcpServer:name=>call('disable',{name}),testMcpServer:(name,config)=>call('test',{name,config})};}`]);
  if(node.id.name==='ze'){const row=node.params[0].name;walk.simple(node.body,{AssignmentExpression(assignment){if(code.slice(assignment.left.start,assignment.left.end)==='R.command'&&assignment.right.type==='ConditionalExpression')edits.push([assignment.right.start,assignment.right.end,"["+row+".config.command,...("+row+".config.args??[])].map(value=>JSON.stringify(value)).join(' ')"]);}});}
 },
});
for(const[start,end,value]of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+value+code.slice(end);
if(!edits.some(row=>row[2].includes('listMcpServers')))throw Error('MCP client transport boundary changed');
fs.writeFileSync(file,code);
const routes=root+'/hook-CnJE4hRq.js';let route=fs.readFileSync(routes,'utf8');const needle="children:[{path:'',name:'agent-console-chat'",skills="path:'skills',name:'agent-console-settings',component:()=>import('./local-pages.js').then(m=>m.Skills)";
if(!route.includes(needle)||!route.includes(skills))throw Error('MCP client route boundary changed');
route=route.replace(skills,"path:'skills',name:'local-agent-skills',component:()=>import('./local-pages.js').then(m=>m.Skills)");
fs.writeFileSync(routes,route.replace(needle,"children:[{path:'mcp',name:'agent-console-settings',component:()=>import('./AgentSettingsRoute-BB9ba93X.js')},{path:'',name:'agent-console-chat'"));
const layout=root+'/layout-C916OUcf.js',sidebar=fs.readFileSync(layout,'utf8');if(!sidebar.includes("path:'skills',name:'agent-console-settings'"))throw Error('Skill sidebar route boundary changed');fs.writeFileSync(layout,sidebar.replace("path:'skills',name:'agent-console-settings'","path:'skills',name:'local-agent-skills'"));

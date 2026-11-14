"use strict";
const fs=require('node:fs'),acorn=require('acorn'),walk=require('acorn-walk'),root='work/rebuild/stage/assets';
function edit(name,visit){const file=root+'/'+name+'.js',code=fs.readFileSync(file,'utf8'),edits=[];visit(acorn.parse(code,{sourceType:'module',ecmaVersion:'latest'}),code,(node,value)=>edits.push([node.start,node.end,value]));let result=code;const outer=[];for(const entry of edits.sort((a,b)=>a[0]-b[0]||b[1]-a[1])){const previous=outer.at(-1);if(previous&&entry[0]<previous[1]){if(entry[1]<=previous[1])continue;throw Error('Partially overlapping project edits '+name);}outer.push(entry);}for(const[start,end,value]of outer.reverse())result=result.slice(0,start)+value+result.slice(end);fs.writeFileSync(file,result);}
edit('projects-CN6_vL2j',(ast,code,replace)=>walk.simple(ast,{
 SwitchCase(node){const key=node.test?.quasis?.[0]?.value.cooked;if(key==='create')replace(node,'case `create`:me();break;');if(key==='invite')replace(node,'');},
 FunctionDeclaration(node){if(node.id.name==='ye'&&code.slice(node.start,node.end).includes('await fe()'))replace(node,'');},
 VariableDeclaration(node){if(node.declarations.some(d=>d.id.type==='ObjectPattern'&&d.id.properties.some(p=>['getTeamMembers','userPayInfo'].includes(p.key?.name)))){const keep=node.declarations.filter(d=>!(d.id.type==='ObjectPattern'&&d.id.properties.some(p=>p.key?.name==='getTeamMembers')));replace(node,node.kind+' '+keep.map(d=>d.id.type==='ObjectPattern'&&d.id.properties.some(p=>p.key?.name==='userPayInfo')?'{userInfo:q}='+code.slice(d.init.start,d.init.end):code.slice(d.start,d.end)).join(',')+';');}},
 CallExpression(node){if(code.slice(node.start,node.end)==='J([`Projects_edit`,`Team_Member_invite`],`any`)')replace(node,'J(`Projects_edit`)');},
}));
// Keep the original project-name form/footer, dropping only member state and
// submission metadata. No empty team-provider replacement remains in runtime.
edit('gen-project-BYIY-yxb',(ast,code,replace)=>walk.simple(ast,{
 VariableDeclaration(node){if(node.declarations.some(d=>d.id.name==='se')){const keep=node.declarations.filter(d=>['U','se'].includes(d.id.name)||d.id.type==='ArrayPattern'&&d.id.elements.some(e=>e?.name==='H'));replace(node,node.kind+' '+keep.map(d=>code.slice(d.start,d.end)).join(',')+';');}},
 CallExpression(node){const text=code.slice(node.start,node.end);if(node.callee.name==='s'&&text.includes('le()'))replace(node,'void 0');if(node.arguments[1]?.name==='F'&&text.includes('添加成员')||node.callee.name==='y'&&node.arguments[0]?.name==='a'&&text.includes('line-only')||node.callee.name==='y'&&node.arguments[1]?.type==='ObjectExpression'&&node.arguments[1].properties.some(property=>property.key?.name==='modelValue'&&code.slice(property.value.start,property.value.end)==='h(G)'))replace(node,"_('',true)");},
 FunctionDeclaration(node){if(node.id.name==='le')replace(node,'');if(node.id.name==='$')replace(node.body,"{Q.value=true;try{const result=await n.limit.userAddProjectInfoCreate({...e});H(result.code,result.msg);if(result.code===0)await i.onSuccess?.();}finally{Q.value=false;}}");},
 ObjectExpression(node){if(node.properties.some(p=>p.key?.name==='relatedUserIds'))replace(node,'{...e}');},
 ConditionalExpression(node){if(code.slice(node.consequent.start,node.consequent.end).includes('name:`members`'))replace(node,"_('',true)");},
}));
edit('project-item-Dd4vT7Wq',(ast,code,replace)=>walk.simple(ast,{
 VariableDeclaration(node){if(node.declarations.some(d=>d.id.type==='ObjectPattern'&&d.id.properties.some(p=>p.key?.name==='getTeamMembers'))){const keep=node.declarations.filter(d=>!(d.id.type==='ObjectPattern'&&d.id.properties.some(p=>p.key?.name==='getTeamMembers')));replace(node,node.kind+' '+keep.map(d=>code.slice(d.start,d.end)).join(',')+';');}},
 FunctionDeclaration(node){if(node.id.name==='Q')replace(node.body,"{const id=q.value,rows=await globalThis.__localRequest('groups:list',{default:2});if(q.value!==id)return;const group=rows.find(row=>row.id===id);if(!group)throw Error('项目不存在');J.value=group.projectName;}");if(node.id.name==='$')replace(node,'');},
 CallExpression(node){if(node.callee.name==='Q')replace(node,"Q().catch(error=>globalThis.__localUiError(error.message))");},
 ConditionalExpression(node){const test=code.slice(node.test.start,node.test.end);if(test.includes('Team_Member_'))replace(node,"h('',true)");else if(test.includes('Projects_edit'))replace(node.test,"("+test+")&&p(q)!=='local-default'");},
}));
if(process.env.REBUILD_REFERENCE_ONLY==='1')process.exit(0);
const file=root+'/hook-CnJE4hRq.js',code=fs.readFileSync(file,'utf8');let target;
walk.simple(acorn.parse(code,{sourceType:'module',ecmaVersion:'latest'}),{ObjectExpression(node){if(node.properties.some(p=>p.key?.name==='name'&&p.value.value==='project-item')){const component=node.properties.find(p=>p.key?.name==='component');if(component)target=component.value;}}});
if(!target)throw Error('Project detail route boundary changed');fs.writeFileSync(file,code.slice(0,target.start)+"()=>import('./project-item-Dd4vT7Wq.js')"+code.slice(target.end));

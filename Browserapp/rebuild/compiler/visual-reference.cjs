"use strict";
// Independent visual baseline: original compiled render functions, with the
// same local data/lifecycle adapters as the app. Never ship this test harness.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),acorn=require('acorn'),walk=require('acorn-walk'),scope=require('eslint-scope');
const repo=path.resolve(__dirname,'../../..'),raw=require('./source.cjs').resolveBuildSource(),root=path.join(repo,'work/rebuild/reference-baseline'),original=path.join(root,'work/rebuild/stage/assets'),runtime=path.join(repo,'Browserapp/roxy-ui/assets'),out=path.join(root,'grafted');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex'),parse=text=>acorn.parse(text,{sourceType:'module',ecmaVersion:'latest',ranges:true});
fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(original,{recursive:true});fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(raw,'web/assets'),original,{recursive:true});
for(const script of ['patch-extensions.cjs','patch-projects.cjs','commerce.cjs']){
 const filtered=spawnSync(process.execPath,[path.join(__dirname,script)],{cwd:root,encoding:'utf8',env:{...process.env,REBUILD_REFERENCE_ONLY:'1'}});if(filtered.status!==0)throw Error(filtered.stderr||filtered.stdout||'Reference commerce removal failed');
}
function analyze(text){
 const ast=parse(text),manager=scope.analyze(ast,{ecmaVersion:2024,sourceType:'module',optimistic:true,ignoreEval:true}),renderers=new Map(),functions=new Map();
 for(const statement of ast.body)if(statement.type==='FunctionDeclaration')functions.set(statement.id.name,statement);
 for(const statement of ast.body){
  if(statement.type==='VariableDeclaration')for(const declaration of statement.declarations){
   if(declaration.id.type!=='Identifier'||!declaration.init)continue;
   walk.simple(declaration.init,{Property(property){
    if(property.key?.name!=='setup'||!['FunctionExpression','ArrowFunctionExpression'].includes(property.value.type)||property.value.body.type!=='BlockStatement')return;
    const returned=property.value.body.body.findLast(node=>node.type==='ReturnStatement');let fn=returned?.argument;if(fn?.type==='SequenceExpression')fn=fn.expressions.at(-1);
    if(fn&&['ArrowFunctionExpression','FunctionExpression'].includes(fn.type))renderers.set(declaration.id.name+':setup',fn);
   }});
   // The local global-provider wrapper intentionally drops cloud providers.
   // Its visible delete-confirm container still has an independent raw slot.
   walk.simple(declaration.init,{CallExpression(node){
    const props=node.arguments[1],slots=node.arguments[2];if(props?.type!=='ObjectExpression'||slots?.type!=='ObjectExpression')return;
    const group=props.properties.find(property=>property.key?.name==='group')?.value;
    if((group?.value||group?.quasis?.[0]?.value.cooked)!=='deleteConfirmDialog')return;
    const value=slots.properties.find(property=>property.key?.name==='container')?.value;
    const fn=value?.type==='CallExpression'?value.arguments.find(node=>['ArrowFunctionExpression','FunctionExpression'].includes(node.type)):value;
    if(fn&&['ArrowFunctionExpression','FunctionExpression'].includes(fn.type))renderers.set(declaration.id.name+':slot:deleteConfirmDialog:container',fn);
   }});
  }
  if(statement.type==='ExpressionStatement')walk.simple(statement.expression,{AssignmentExpression(node){
   if(node.left.type==='MemberExpression'&&node.left.object.type==='Identifier'&&node.left.property.name==='render'&&node.right.type==='Identifier'&&functions.has(node.right.name))renderers.set(node.left.object.name+':render',functions.get(node.right.name));
  }});
 }
 return {ast,manager,renderers};
}
function freeVariables(info,fn){
 const descendants=info.manager.scopes.filter(s=>s.block.start>=fn.start&&s.block.end<=fn.end),locals=new Set(descendants.flatMap(s=>s.variables)),free=new Set();
 for(const s of descendants)for(const ref of s.references)if(!ref.resolved||!locals.has(ref.resolved))free.add(ref.resolved?.name||ref.identifier.name);
 return free;
}
function lookup(info,fn,name){let current=info.manager.acquire(fn);while(current){const value=current.set.get(name);if(value)return value;current=current.upper;}return null;}
function visibleVariables(info,fn){const values=[];let current=info.manager.acquire(fn);while(current){values.push(...current.variables);current=current.upper;}return values;}
function destructuredBinding(variable,text){
 const declaration=variable?.defs?.[0]?.node;if(declaration?.type!=='VariableDeclarator'||declaration.id.type!=='ObjectPattern'||!declaration.init)return null;
 const property=declaration.id.properties.find(property=>property.type==='Property'&&property.value.type==='Identifier'&&property.value.name===variable.name);
 if(!property)return null;return JSON.stringify([property.key.name||property.key.value,text.slice(declaration.init.start,declaration.init.end)]);
}
function parameterBinding(variable,info,fn){
 const definition=variable?.defs?.find(definition=>definition.type==='Parameter');if(!definition)return null;
 const parameters=definition.node.params,index=parameters.findIndex(parameter=>parameter.type==='Identifier'&&parameter.name===variable.name);if(index<0)return null;
 let current=info.manager.acquire(fn),depth=0;while(current){if(current===variable.scope)return JSON.stringify(['parameter',depth,index,parameters.length]);current=current.upper;depth++;}return null;
}
const globals=new Set([...Object.keys(require('globals').browser),...Object.keys(require('globals').es2025),...'undefined NaN Infinity globalThis window document navigator console Object Array Number String Boolean Symbol BigInt Map Set WeakMap WeakSet Promise Date Math JSON Intl RegExp Error TypeError RangeError URIError URL URLSearchParams Blob File FileReader AbortController AbortSignal DOMParser Node HTMLElement Element Event MouseEvent KeyboardEvent Uint8Array ArrayBuffer TextEncoder TextDecoder CSS crypto performance atob btoa setTimeout clearTimeout setInterval clearInterval queueMicrotask requestAnimationFrame cancelAnimationFrame ResizeObserver MutationObserver IntersectionObserver Image getComputedStyle fetch WebSocket $t $appVersion isElectron'.split(' ')]);
const records=[],files=[];
for(const name of fs.readdirSync(runtime).filter(file=>file.endsWith('.js'))){
 const production=fs.readFileSync(path.join(runtime,name),'utf8');if(!fs.existsSync(path.join(original,name)))continue;
 const baseline=fs.readFileSync(path.join(original,name),'utf8'),sourceInfo=analyze(baseline),nativeInfo=analyze(production),edits=[],seen=new Set();
 for(const[key,fn]of nativeInfo.renderers){
  const sourceFn=sourceInfo.renderers.get(key);if(!sourceFn){records.push({file:name,key,status:'no-original-renderer'});continue;}
  const aliases=[],missing=[...freeVariables(sourceInfo,sourceFn)].filter(variable=>{
   if(globals.has(variable)||lookup(nativeInfo,fn,variable))return false;
   const original=lookup(sourceInfo,sourceFn,variable),objectIdentity=destructuredBinding(original,baseline),parameterIdentity=key.includes(':slot:')?parameterBinding(original,sourceInfo,sourceFn):null,identity=objectIdentity||parameterIdentity;
   const candidates=identity?visibleVariables(nativeInfo,fn).filter(binding=>objectIdentity?destructuredBinding(binding,production)===identity:parameterBinding(binding,nativeInfo,fn)===identity):[];
   if(candidates.length!==1)return true;
   aliases.push({from:variable,to:candidates[0].name,identity,references:original.references.map(ref=>ref.identifier).filter(node=>node.start>=sourceFn.start&&node.end<=sourceFn.end)});return false;
  });
  if(missing.length){records.push({file:name,key,status:'adapter-changed-bindings',missing});continue;}
  const sourceCode=baseline.slice(sourceFn.start,sourceFn.end),nativeCode=production.slice(fn.start,fn.end),record={file:name,key,status:'original-renderer',sourceRenderSha256:hash(sourceCode),productionRenderSha256:hash(nativeCode),changed:sourceCode!==nativeCode,alphaRenames:aliases.map(({references:_references,...alias})=>alias)};
  let aligned=sourceCode;for(const edit of aliases.flatMap(alias=>alias.references.map(node=>({start:node.start-sourceFn.start,end:node.end-sourceFn.start,value:alias.to}))).sort((a,b)=>b.start-a.start))aligned=aligned.slice(0,edit.start)+edit.value+aligned.slice(edit.end);
  record.alignedRenderSha256=hash(aligned);
  // Switch independent archive/current renderers in the same Vue instance.
  // This preserves data, DOM node/raster identities and viewport between the
  // captures; full reloads introduced one-level paint rounding differences
  // even when capturing the current renderer twice. Separate VNode caches
  // prevent a production cached subtree from becoming the reference.
  records.push(record);if(!seen.has(fn.start)){
   const wrapper=`((production,reference)=>{const referenceCache=[];return function(...args){const original=(globalThis.__visualReferenceFlag||=__visualRef(false)).value;if(original&&Array.isArray(args[1]))args[1]=referenceCache;return Reflect.apply(original?reference:production,this,args);}})(${nativeCode},${aligned})`;
   edits.push([fn.start,fn.end,fn.type==='FunctionDeclaration'?'const '+fn.id.name+'='+wrapper+';':wrapper]);seen.add(fn.start);
  }
 }
 if(!edits.length)continue;let result=production,boundary=Infinity;
 for(const[start,end,value]of edits.sort((a,b)=>b[0]-a[0])){if(end>boundary)throw Error('Overlapping reference render functions: '+name);boundary=start;result=result.slice(0,start)+value+result.slice(end);}
 result="import{St as __visualRef}from'./runtime-core.esm-bundler-CBj16o9G.js';\n"+result;
 parse(result);fs.writeFileSync(path.join(out,name),result);files.push({file:name,originalArchiveSha256:hash(fs.readFileSync(path.join(raw,'web/assets',name))),authorizedCommerceSha256:hash(baseline),graftedSha256:hash(result)});
}
const result={status:'READY',scope:'原归档 render 函数 + 同一套本地数据/生命周期；商业删除及扩展/项目云端本地化作为共同前处理，函数逻辑不进入 render 基线。未提供独立原 render 的组件明确列出；本文件不是像素通过证明。',preprocessors:['commerce.cjs','patch-extensions.cjs','patch-projects.cjs'].map(file=>({file,sha256:hash(fs.readFileSync(path.join(__dirname,file)))})),root:out,originalRendererCount:records.filter(row=>row.status==='original-renderer').length,changedRendererCount:records.filter(row=>row.changed).length,records,files};
fs.writeFileSync(path.join(repo,'docs/rebuild/evidence/visual-reference-provenance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,files:files.length,originalRendererCount:result.originalRendererCount,changedRendererCount:result.changedRendererCount,excluded:records.filter(row=>row.status!=='original-renderer').length}));

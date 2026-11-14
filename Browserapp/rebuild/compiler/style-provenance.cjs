"use strict";
const fs=require('node:fs'),path=require('node:path'),postcss=require('postcss'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../../..'),raw=path.join(require('./source.cjs').resolveBuildSource(),'web/assets'),runtime=path.join(repo,'Browserapp/roxy-ui/assets'),failures=[],files=[];
function declarations(text){
 const rows=[];postcss.parse(text).walkDecls(node=>{let parent=node.parent,selector=parent.type==='rule'?parent.selector:'',conditions=[];for(let current=parent;current;current=current.parent)if(current.type==='atrule')conditions.unshift('@'+current.name+' '+current.params);
  for(const part of selector?postcss.list.comma(selector):[''])rows.push({selector:part,context:conditions.join('/'),property:node.prop,value:node.value,important:Boolean(node.important)});
 });return rows;
}
function selectors(selector){
 const match=selector.match(/^html\[data-ob-(?:synchronizer|local-dialog|sync-screen)\](.*)$/);if(!match)return [selector];const rest=match[1];return rest.startsWith(' ')?[rest.trimStart(),':root'+rest,'html'+rest]:[':root'+rest,'html'+rest];
}
const key=row=>JSON.stringify([row.context,row.selector,row.property,row.value,row.important]);let checked=0;
for(const file of fs.readdirSync(runtime).filter(name=>name.endsWith('.css'))){
 const original=path.join(raw,file),current=path.join(runtime,file);if(!fs.existsSync(original)){files.push({file,status:'local-extension',reason:'本地新增内容样式，无原始 CSS 对应；不计入原样式通过数'});continue;}
 const source=fs.readFileSync(original,'utf8'),text=fs.readFileSync(current,'utf8'),available=new Set(declarations(source).map(key)),rows=declarations(text),mismatches=[];
 for(const row of rows){if(selectors(row.selector).some(selector=>available.has(key({...row,selector}))))checked++;else mismatches.push(row);}
 files.push({file,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),declarations:rows.length,sourceMatches:rows.length-mismatches.length,mismatches});
 if(mismatches.length)failures.push({file,mismatches});
}
const result={status:failures.length?'FAIL':'PASS',scope:'逐项核对每个保留声明的原文件、选择器、条件、属性、值与 important；仅归一化已记录的同步 CSS 路由隔离前缀。商业删除允许为原声明子集，本地新增样式单列，不是全页面像素验收。',checked,files,failures};
fs.writeFileSync(path.join(repo,'docs/rebuild/evidence/style-provenance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,checked,failures:failures.map(row=>({file:row.file,count:row.mismatches.length}))}));if(failures.length)process.exitCode=1;

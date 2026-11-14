"use strict";
const fs=require('node:fs'),acorn=require('acorn'),walk=require('acorn-walk');
const file='work/rebuild/stage/assets/renewal-reminder-drawer-C9_4HaAB.js',code=fs.readFileSync(file,'utf8');let target;
walk.simple(acorn.parse(code,{sourceType:'module',ecmaVersion:'latest'}),{FunctionDeclaration(node){if(node.id.name==='Lr')target=node.body;}});
if(!target)throw Error('Default browser handler boundary changed');
const before=code.slice(target.start,target.end),after=before.replace('await globalThis.electronAPI.send','const result=await globalThis.electronAPI.send').replace(/,G\(0,\$t\(`设为默认浏览器成功`\)\)/,';G(result.applied?0:-1,result.message)');
if(before===after||!after.includes('result.applied'))throw Error('Default browser confirmation boundary changed');
fs.writeFileSync(file,code.slice(0,target.start)+after+code.slice(target.end));

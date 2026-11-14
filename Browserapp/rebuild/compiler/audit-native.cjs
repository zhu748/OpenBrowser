'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const app=path.resolve(__dirname,'../..'),{isRuntimeResource}=require('../../scripts/runtime-manifest');
function list(dir,relative=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const name=relative?relative+'/'+entry.name:entry.name;if(['assets','kernels','roxy-ui','node_modules'].includes(name)||!isRuntimeResource(name))return [];if(entry.isSymbolicLink())throw Error('Native resource symlink: '+name);return entry.isDirectory()?list(path.join(dir,entry.name),name):/\.(?:js|cjs|mjs|json|cs)$/.test(name)?[name]:[];});}
const files=list(app).sort().map(name=>({file:'Browserapp/'+name,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(app,name))).digest('hex')}));
fs.writeFileSync(path.resolve(app,'../docs/rebuild/evidence/native-runtime-hashes.json'),JSON.stringify({status:'PASS',scope:'当前运行树中 Native/legacy 开发入口代码、JSON 与 C# 源码；排除内核二进制、生产依赖、assets 和已有独立哈希的 roxy-ui。不是安装包签名或跨平台运行证明。',files},null,2));console.log(JSON.stringify({status:'PASS',files:files.length}));

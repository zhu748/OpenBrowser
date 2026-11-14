'use strict';
const crypto=require('node:crypto');
const {saveFields}=require('./agent-store');
async function localCatalog(service){
 const skills=await service.request('skills:list');
 const rows=skills.filter(skill=>skill.enabled).map(skill=>{
  const name=skill.content.match(/^#\s+(.+)$/m)?.[1]||skill.slug;
  const description=skill.content.match(/^description:\s*(.+)$/m)?.[1]||'本地 Skill 模板';
  return {id:crypto.createHash('sha256').update('local-skill:'+skill.slug).digest().readUInt32BE(0),slug:skill.slug,templateType:'skill',name,description,labels:[],iconInfo:null,sortOrder:0,labelIds:[],createdAt:null,updatedAt:null,isHot:false,isTopped:!!service.data.catalogTopped?.[skill.slug],toppedAt:service.data.catalogTopped?.[skill.slug]||null,metadata:{version:'1',skillSlug:skill.slug,slug:skill.slug,usageExample:'使用此 Skill 完成用户指定的本地任务。'}};
 });
 if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('本地模板 ID 冲突');
 return rows;
}
async function catalogRequest(service,action,input){
 if(['listTemplateLabelCategories','listTemplateLabels'].includes(action))return {code:0,data:[]};
 const rows=await localCatalog(service);
 if(action==='listOfficialTemplates')return {code:0,data:rows.filter(row=>(!input.templateType||row.templateType===input.templateType)&&!(input.labelIds?.length)&&(!input.search||[row.name,row.description,row.slug].join(' ').toLowerCase().includes(String(input.search).toLowerCase())))};
 if(['topOfficialTemplate','untopOfficialTemplate'].includes(action)){
  const row=rows.find(row=>row.id===Number(input.id||input.templateId||input.templateIdOrSlug)||row.slug===input.templateIdOrSlug);if(!row)throw Error('本地模板不存在或 Skill 已停用');
  const catalogTopped={...service.data.catalogTopped};const toppedAt=action==='topOfficialTemplate'?new Date().toISOString():null;
  if(toppedAt)catalogTopped[row.slug]=toppedAt;else delete catalogTopped[row.slug];
  await saveFields(service,{catalogTopped});return {code:0,data:{id:row.id,isTopped:!!toppedAt,toppedAt}};
 }
 if(action==='getOfficialTemplate'){const row=rows.find(row=>row.id===Number(input.id||input.templateId||input.templateIdOrSlug)||row.slug===input.templateIdOrSlug);if(!row)throw Error('本地模板不存在或 Skill 已停用');return {code:0,data:row};}
 throw Error('本地模板目录不支持操作: '+action);
}
module.exports={localCatalog,catalogRequest};

"use strict";
const crypto=require('node:crypto');
const readOnly=new Set(['list_profiles','list_tabs','read_page','read_skill','read_skill_file','read_attachment']);
async function authorize(service,run,name,args){
 if(run.fullAccess||readOnly.has(name))return;
 if(run.pendingApproval)throw Error('当前已有待处理的授权请求');
 const approvalId=crypto.randomUUID(),actionRequests=[{name,args}];
 let timer,abort,decision,settle;
 const pending=new Promise((resolve,reject)=>{settle={resolve,reject};});
 // Abort may arrive while the encrypted snapshot is still being written.
 // Observe the rejection immediately; the awaited promise still propagates it.
 pending.catch(()=>{});
 run.pendingApproval={id:approvalId,settle};
 try{
  abort=()=>settle.reject(run.abort.signal.reason||Error('任务已取消'));
  run.abort.signal.addEventListener('abort',abort,{once:true});run.abort.signal.throwIfAborted();
  timer=setTimeout(()=>settle.reject(Object.assign(Error('等待授权超时，任务已停止'),{code:'APPROVAL_TIMEOUT'})),service.approvalTimeoutMs||30*60*1000);timer.unref?.();
  service.event(run,'approval_requested',{approvalId,actionRequests,prompt:'请确认此操作后继续。'});
  await service.save();
  decision=await pending;
  run.abort.signal.throwIfAborted();
  if(decision.type==='reject')throw Object.assign(Error('用户拒绝了此操作，未执行'),{code:'APPROVAL_REJECTED'});
  if(decision.fullAccess)run.fullAccess=true;
 }finally{
  clearTimeout(timer);run.abort.signal.removeEventListener('abort',abort);run.pendingApproval=null;
  service.event(run,'approval_resolved',{approvalId,decisions:decision?[decision]:[{type:'reject'}],status:decision?'resolved':'cancelled'});
 }
}
function submit(service,p){
 const run=service.active.get(p.conversationId),pending=run?.pendingApproval;
 if(!pending||pending.id!==p.approvalId)throw Error('授权请求已结束或不属于当前任务');
 if(!Array.isArray(p.decisions)||p.decisions.length!==1)throw Error('授权需要且只能提交一个操作决定');
 const decision=p.decisions[0];if(!decision||!['approve','reject'].includes(decision.type)||decision.fullAccess!==undefined&&typeof decision.fullAccess!=='boolean'||p.fullAccess!==undefined&&typeof p.fullAccess!=='boolean')throw Error('授权决定无效');
 const fullAccess=Boolean(decision.fullAccess||p.fullAccess);if(fullAccess&&decision.type!=='approve')throw Error('拒绝操作不能授予完全访问');
 if(pending.submitted)throw Error('授权决定已提交');pending.submitted=true;pending.settle.resolve({type:decision.type,fullAccess});return {accepted:true};
}
module.exports={authorize,submit,readOnly};

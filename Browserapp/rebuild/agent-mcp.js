"use strict";
// Native MCP client. Renderer calls local IPC only; endpoints and processes are
// supplied explicitly in the original MCP form and persisted encrypted.
const crypto=require('node:crypto');
const {Connection}=require('./agent-mcp-connection');
const {ConnectionPool,cancellable}=require('./agent-mcp-pool');
const {saveFields}=require('./agent-store');
function commandLine(text){
 if(typeof text!=='string'||!text.trim()||text.length>16384||/[\0\r\n]/.test(text))throw Error('MCP command is required or invalid');
 const out=[];let value='',quote='',started=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='\\'&&quote!=="'"&&i+1<text.length&&('\\"'.includes(text[i+1])||!quote&&/\s|'/.test(text[i+1]))){value+=text[++i];started=true;continue;}
  if(quote){if(char===quote)quote='';else value+=char;started=true;continue;}
  if(char==='"'||char==="'"){quote=char;started=true;continue;}
  if(/\s/.test(char)){if(started){out.push(value);value='';started=false;}}else{value+=char;started=true;}
 }
 if(quote)throw Error('MCP command contains an unterminated quote');if(started)out.push(value);if(!out[0])throw Error('MCP command is required');return out;
}
function stringMap(value,label){
 if(value===undefined)return {};if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>100)throw Error('Invalid MCP '+label);
 for(const[key,text]of Object.entries(value))if(!key||key.length>200||typeof text!=='string'||text.length>16384||/[\0\r\n]/.test(key+text))throw Error('Invalid MCP '+label);
 return {...value};
}
function validate(name,input){
 if(typeof name!=='string'||!name.trim()||name.length>100||/[\0\r\n]/.test(name))throw Error('Invalid MCP name');
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid MCP config');
 const type=input.type|| (input.url?'http':'stdio');
 if(type==='http'){
  let url;try{url=new URL(input.url);}catch{throw Error('Invalid URL');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.hash)throw Error('Invalid URL');
  const headers=stringMap(input.headers,'headers');
  if(Object.keys(headers).some(key=>/^(host|content-length|connection|transfer-encoding|mcp-session-id|mcp-protocol-version)$/i.test(key)))throw Error('Reserved MCP HTTP header');
  return {type,url:url.href,headers};
 }
 if(type!=='stdio')throw Error('Unsupported transport');
 const parsed=input.args===undefined?commandLine(input.command):[input.command],command=parsed[0],args=input.args===undefined?parsed.slice(1):input.args;
 if(typeof command!=='string'||!command||command.length>16384||/[\0\r\n]/.test(command))throw Error('Invalid MCP command');
 if(!Array.isArray(args)||args.length>1000||args.some(arg=>typeof arg!=='string'||arg.length>16384||arg.includes('\0')))throw Error('Invalid MCP arguments');
 return {type,command,args,env:stringMap(input.env,'environment')};
}
class AgentMcp{
 constructor(service,options){this.service=service;this.queue=Promise.resolve();this.pool=new ConnectionPool(name=>this.rows().find(row=>row.name===name),options);this.connections=this.pool.connections;}
 rows(){return this.service.data.mcpServers||[];}
 connect(row,signal,options){return this.pool.connect(row,signal,options);}
 close(name){return this.pool.close(name);}
 request(method,p={}){
  const run=this.queue.then(()=>{if(this.closing)throw Error('MCP 正在关闭');return this.dispatch(method,p);});this.queue=run.catch(()=>{});return run;
 }
 async dispatch(method,p){
  if(method==='list')return {code:0,data:this.rows().map(row=>({...structuredClone(row),status:{success:!!this.connections.get(row.name)&&!this.connections.get(row.name).connection.closed}}))};
  if(method==='test'){
   const row=this.rows().find(row=>row.name===p.name),config=validate(p.name,p.config||row?.config);
   const tools=await this.pool.test(config);return {code:0,data:{success:true,toolCount:tools.length}};
  }
  const old=structuredClone(this.rows());let next=structuredClone(old),close=[];
  if(method==='upsert'){
   const config=validate(p.name,p.config),name=p.name.trim();if(p.oldName&&p.oldName!==name&&!old.some(row=>row.name===p.oldName))throw Error('MCP server not found');if(p.oldName&&p.oldName!==name&&old.some(row=>row.name===name))throw Error('MCP name already exists');
   const previous=old.find(row=>row.name===(p.oldName||name));next=next.filter(row=>row.name!==(p.oldName||name));next.push({name,config,enabled:previous?.enabled||false});close=[p.oldName||name];
  }else if(method==='import'){
   if(!p.mcpServers||Array.isArray(p.mcpServers)||typeof p.mcpServers!=='object')throw Error('Invalid MCP import');for(const[name,input]of Object.entries(p.mcpServers)){const config=validate(name,input);next=next.filter(row=>row.name!==name);next.push({name,config,enabled:false});close.push(name);}
  }else{
   const row=next.find(row=>row.name===p.name);if(!row)throw Error('MCP server not found');
   if(method==='delete'){next=old.filter(row=>row.name!==p.name);close=[p.name];}
   else if(method==='disable'){row.enabled=false;close=[p.name];}
   else if(method==='enable'){const record=await this.connect(row,undefined,{allowDisabled:true});row.enabled=true;try{await saveFields(this.service,{mcpServers:next});}catch(error){try{await this.close(row.name);}catch(cleanup){throw new AggregateError([error,cleanup],'MCP 保存失败且连接关闭失败');}throw error;}return {code:0,data:{success:true,toolCount:record.tools.length}};}
   else throw Error('Unknown MCP operation');
  }
  if(next.length>32)throw Error('最多配置 32 个 MCP 服务');
  await saveFields(this.service,{mcpServers:next});
  for(const name of close)await this.close(name);return {code:0,data:{success:true}};
 }
 async definitions(run){
  const stop=new AbortController(),signal=AbortSignal.any([this.pool.signal,stop.signal,...(run.abort?[run.abort.signal]:[])]);
  signal.throwIfAborted();const snapshot=new Map();run.mcpTools=snapshot;
  if(run.allowedProfileIds){run.mcpTools=snapshot;return [];}
  await cancellable(this.queue,signal);signal.throwIfAborted();
  const rows=this.rows().filter(row=>row.enabled);let count=0;
  const pending=rows.map(async row=>{const record=await this.connect(row,signal);count+=record.tools.length;if(count>200)throw Error('启用的 MCP 工具合计不能超过 200 个');return record;});
  let records;
  try{records=await Promise.all(pending);}catch(error){stop.abort(error);await Promise.allSettled(pending);throw error;}
  signal.throwIfAborted();
  for(let index=0;index<rows.length;index++){
   const row=rows[index],record=records[index];
   if(!this.pool.isCurrent(row,false)||this.connections.get(row.name)!==record)throw Error('MCP 服务已修改或停用，请重新发起任务');
   for(const tool of record.tools){const name='mcp_'+crypto.createHash('sha256').update(row.name+'\0'+tool.name).digest('hex').slice(0,12)+'_'+tool.name.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40);snapshot.set(name,{server:row.name,tool:tool.name,key:record.key,definition:{type:'function',function:{name,description:('MCP '+row.name+': '+(tool.description||tool.name)).slice(0,4000),parameters:tool.inputSchema}}});}
  }
  run.mcpTools=snapshot;return [...snapshot.values()].map(tool=>tool.definition);
 }
 async call(name,args,run){
  if(run.allowedProfileIds)throw Error('限定窗口范围的任务不能调用外部 MCP 工具；外部服务不能保证该范围');
  const tool=run.mcpTools?.get(name);
  const current=()=>this.rows().find(row=>row.name===tool?.server&&row.enabled&&JSON.stringify(row.config)===tool.key);
  const row=current();
  if(!row)throw Error('MCP 服务已修改或停用，请重新发起任务');
  const record=await this.connect(row,run.abort.signal);
  run.abort.signal.throwIfAborted();
  if(!current()||this.connections.get(row.name)!==record)throw Error('MCP 服务已修改或停用，请重新发起任务');
  const result=await record.connection.request('tools/call',{name:tool.tool,arguments:args},this.pool.signalFor(row.name,run.abort.signal));
  if(result.isError)throw Error(JSON.stringify(result.content||result));return result;
 }
 shutdown(){
  if(!this.shutdownPromise){this.closing=true;this.shutdownPromise=this.pool.shutdown(this.queue).catch(error=>{this.shutdownPromise=undefined;throw error;});}
  return this.shutdownPromise;
 }
}
module.exports={AgentMcp,Connection,commandLine,validate};

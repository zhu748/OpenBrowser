"use strict";
// Native MCP client. Renderer calls local IPC only; endpoints and processes are
// supplied explicitly in the original MCP form and persisted encrypted.
const {spawn}=require('node:child_process'),crypto=require('node:crypto');
const {saveFields}=require('./agent-store');
const LIMIT=2*1024*1024,VERSION='2024-11-05';
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
class Connection{
 constructor(config){this.config=config;this.nextId=0;this.pending=new Map();this.controller=new AbortController();this.closed=false;}
 async open(){
  if(this.config.type==='stdio'){
   const environment={};for(const key of ['PATH','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','SystemRoot','WINDIR','TEMP','TMP','LANG'])if(process.env[key]!==undefined)environment[key]=process.env[key];
   const child=this.child=spawn(this.config.command,this.config.args,{env:{...environment,...this.config.env},shell:false,stdio:['pipe','pipe','pipe'],windowsHide:true});
   this.exited=new Promise(resolve=>child.once('close',resolve));let buffer='';child.stdout.setEncoding('utf8');
   child.stdout.on('data',text=>{buffer+=text;if(Buffer.byteLength(buffer)>LIMIT){this.fail(Error('MCP response exceeds 2 MiB'));return;}let end;while((end=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);if(!line)continue;try{this.receive(JSON.parse(line));}catch{this.fail(Error('Invalid MCP JSON response'));return;}}});
   child.stderr.resume();child.stdin.on('error',error=>this.fail(error));child.on('error',error=>this.fail(error));child.on('exit',code=>this.fail(Error('MCP process exited ('+code+')')));
  }
  const initialized=await this.request('initialize',{protocolVersion:VERSION,capabilities:{},clientInfo:{name:'OpenBrowser',version:'1.0'}});
  if(!initialized||typeof initialized.protocolVersion!=='string'||!initialized.capabilities)throw Error('Invalid MCP initialize response');
  this.version=initialized.protocolVersion;await this.notify('notifications/initialized',{});return this;
 }
 receive(message){
  if(message?.jsonrpc!=='2.0')throw Error('Invalid MCP protocol response');
  if(message.method){
   if(message.id!==undefined){const response=message.method==='ping'?{result:{}}:{error:{code:-32601,message:'Client capability not supported'}};this.write({jsonrpc:'2.0',id:message.id,...response}).catch(error=>this.fail(error));}return;
  }
  const pending=this.pending.get(message.id);if(!pending)return;
  if(message.error)pending.reject(Object.assign(Error(String(message.error.message||'MCP error')),{code:message.error.code}));else if(Object.hasOwn(message,'result'))pending.resolve(message.result);else pending.reject(Error('Invalid MCP result'));
 }
 async write(message,signal){
  if(this.closed)throw Error('MCP connection closed');const text=JSON.stringify(message);if(Buffer.byteLength(text)>LIMIT)throw Error('MCP request exceeds 2 MiB');
  if(this.config.type==='stdio')return new Promise((resolve,reject)=>this.child.stdin.write(text+'\n',error=>error?reject(error):resolve()));
  const headers={...this.config.headers,'Content-Type':'application/json',Accept:'application/json, text/event-stream',...(this.session?{'Mcp-Session-Id':this.session}:{}),...(this.version?{'MCP-Protocol-Version':this.version}:{})};
  const response=await fetch(this.config.url,{method:'POST',headers,body:text,redirect:'error',signal:AbortSignal.any([this.controller.signal,signal||new AbortController().signal,AbortSignal.timeout(20000)])});
  if(!response.ok)throw Error('MCP HTTP '+response.status);
  const session=response.headers.get('mcp-session-id');if(session){if(this.session&&this.session!==session)throw Error('MCP session changed unexpectedly');this.session=session;}
  if(response.status===202||response.status===204){await response.body?.cancel();if(message.id!==undefined)throw Error('Invalid MCP empty response');return;}
  const type=response.headers.get('content-type')||'';if(!/application\/json|text\/event-stream/.test(type)){await response.body?.cancel();throw Error('Unsupported MCP content-type');}
  let total=0,buffer='';const decoder=new TextDecoder();
  for await(const chunk of response.body){total+=chunk.byteLength;if(total>LIMIT)throw Error('MCP response exceeds 2 MiB');buffer+=decoder.decode(chunk,{stream:true});
   if(type.includes('text/event-stream')){buffer=buffer.replace(/\r\n/g,'\n');let end;while((end=buffer.indexOf('\n\n'))!==-1){const event=buffer.slice(0,end);buffer=buffer.slice(end+2);const data=event.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');if(!data)continue;const result=JSON.parse(data);this.receive(result);if(result.id===message.id&&!result.method)return;}}
  }
  buffer+=decoder.decode();if(type.includes('application/json')){if(!buffer.trim()&&message.id===undefined)return;this.receive(JSON.parse(buffer));}
 }
 async request(method,params,signal){
  if(this.closed)throw Error('MCP connection closed');if(this.pending.size>=128)throw Error('Too many pending MCP requests');
  const id=++this.nextId,controller=new AbortController(),combined=AbortSignal.any([this.controller.signal,controller.signal,...(signal?[signal]:[])]);let timer,abort;
  try{return await new Promise((resolve,reject)=>{
   this.pending.set(id,{resolve,reject});abort=()=>reject(combined.reason||Error('MCP request cancelled'));combined.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>controller.abort(Error('MCP request timed out')),20000);timer.unref?.();if(combined.aborted){abort();return;}
   this.write({jsonrpc:'2.0',id,method,params},combined).catch(reject);
  });}finally{
   clearTimeout(timer);combined.removeEventListener('abort',abort);this.pending.delete(id);
   if(combined.aborted&&!this.closed)try{await this.write({jsonrpc:'2.0',method:'notifications/cancelled',params:{requestId:id,reason:'OpenBrowser request cancelled'}},AbortSignal.timeout(2000));}catch(error){throw new AggregateError([combined.reason,error],'MCP 已取消，但远端取消通知失败');}
  }
 }
 notify(method,params){return this.write({jsonrpc:'2.0',method,params});}
 fail(error){if(this.closed)return;this.closed=true;this.controller.abort(error);for(const item of this.pending.values())item.reject(error);this.pending.clear();if(this.child&&!this.child.killed)this.child.kill();}
 async close(){
  const session=this.session;this.fail(Error('MCP connection closed'));
  if(this.child){const force=setTimeout(()=>this.child.kill('SIGKILL'),1500);try{await this.exited;}finally{clearTimeout(force);}}
  else if(session){const response=await fetch(this.config.url,{method:'DELETE',headers:{...this.config.headers,'Mcp-Session-Id':session,'MCP-Protocol-Version':this.version},redirect:'error',signal:AbortSignal.timeout(2000)});await response.body?.cancel();if(!response.ok&&response.status!==404&&response.status!==405)throw Error('MCP session cleanup HTTP '+response.status);}
 }
 async tools(){const list=[],cursors=new Set(),names=new Set();let cursor;do{const page=await this.request('tools/list',cursor?{cursor}:{});if(!Array.isArray(page.tools))throw Error('Invalid MCP tools response');list.push(...page.tools);if(list.length>200)throw Error('MCP server exceeds 200 tools');cursor=page.nextCursor;if(cursor&&(typeof cursor!=='string'||cursors.has(cursor)||cursors.size>=20))throw Error('MCP pagination did not advance or exceeds 20 pages');if(cursor)cursors.add(cursor);}while(cursor);for(const tool of list){if(typeof tool.name!=='string'||!tool.name||tool.name.length>200||!tool.inputSchema||tool.inputSchema.type!=='object'||names.has(tool.name))throw Error('Invalid or duplicate MCP tool definition');names.add(tool.name);}return list;}
}
class AgentMcp{
 constructor(service){this.service=service;this.connections=new Map();this.queue=Promise.resolve();this.connectionQueue=Promise.resolve();}
 rows(){return this.service.data.mcpServers||[];}
 connect(row){const run=this.connectionQueue.then(()=>{if(this.closing)throw Error('MCP 正在关闭');return this.connectNow(row);});this.connectionQueue=run.catch(()=>{});return run;}
 async connectNow(row){
  const key=JSON.stringify(row.config),existing=this.connections.get(row.name);if(existing?.key===key&&!existing.connection.closed)return existing;
  if(existing){await existing.connection.close();this.connections.delete(row.name);}const connection=new Connection(row.config);
  try{await connection.open();const tools=await connection.tools(),record={key,connection,tools};this.connections.set(row.name,record);return record;}catch(error){await connection.close();throw error;}
 }
 close(name){const run=this.connectionQueue.then(async()=>{const record=this.connections.get(name);if(record){this.connections.delete(name);await record.connection.close();}});this.connectionQueue=run.catch(()=>{});return run;}
 request(method,p={}){
  const run=this.queue.then(()=>{if(this.closing)throw Error('MCP 正在关闭');return this.dispatch(method,p);});this.queue=run.catch(()=>{});return run;
 }
 async dispatch(method,p){
  if(method==='list')return {code:0,data:this.rows().map(row=>({...structuredClone(row),status:{success:!!this.connections.get(row.name)&&!this.connections.get(row.name).connection.closed}}))};
  if(method==='test'){
   const row=this.rows().find(row=>row.name===p.name),config=validate(p.name,p.config||row?.config),connection=new Connection(config);
   try{await connection.open();const tools=await connection.tools();return {code:0,data:{success:true,toolCount:tools.length}};}finally{await connection.close();}
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
   else if(method==='enable'){const record=await this.connect(row);row.enabled=true;try{await saveFields(this.service,{mcpServers:next});}catch(error){try{await this.close(row.name);}catch(cleanup){throw new AggregateError([error,cleanup],'MCP 保存失败且连接关闭失败');}throw error;}return {code:0,data:{success:true,toolCount:record.tools.length}};}
   else throw Error('Unknown MCP operation');
  }
  if(next.length>32)throw Error('最多配置 32 个 MCP 服务');
  await saveFields(this.service,{mcpServers:next});
  for(const name of close)await this.close(name);return {code:0,data:{success:true}};
 }
 async definitions(run){
  await this.queue;const snapshot=new Map();if(run.allowedProfileIds){run.mcpTools=snapshot;return [];}
  for(const row of this.rows().filter(row=>row.enabled)){
   const record=await this.connect(row);for(const tool of record.tools){const name='mcp_'+crypto.createHash('sha256').update(row.name+'\0'+tool.name).digest('hex').slice(0,12)+'_'+tool.name.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40);snapshot.set(name,{server:row.name,tool:tool.name,key:record.key,definition:{type:'function',function:{name,description:('MCP '+row.name+': '+(tool.description||tool.name)).slice(0,4000),parameters:tool.inputSchema}}});}
  }
  if(snapshot.size>200)throw Error('启用的 MCP 工具合计不能超过 200 个');run.mcpTools=snapshot;return [...snapshot.values()].map(tool=>tool.definition);
 }
 async call(name,args,run){
  if(run.allowedProfileIds)throw Error('限定窗口范围的任务不能调用外部 MCP 工具；外部服务不能保证该范围');
  const tool=run.mcpTools?.get(name),row=tool&&this.rows().find(row=>row.name===tool.server&&row.enabled);if(!tool||!row||JSON.stringify(row.config)!==tool.key)throw Error('MCP 服务已修改或停用，请重新发起任务');
  const record=await this.connect(row);run.abort.signal.throwIfAborted();const result=await record.connection.request('tools/call',{name:tool.tool,arguments:args},run.abort.signal);if(result.isError)throw Error(JSON.stringify(result.content||result));return result;
 }
 async shutdown(){this.closing=true;await this.queue;await this.connectionQueue;const results=await Promise.allSettled([...this.connections.keys()].map(name=>this.close(name)));const errors=results.filter(row=>row.status==='rejected').map(row=>row.reason);if(errors.length)throw new AggregateError(errors,'MCP 连接清理失败');}
}
module.exports={AgentMcp,Connection,commandLine,validate};

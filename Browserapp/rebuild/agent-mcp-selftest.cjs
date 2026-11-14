"use strict";
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict');
const {AgentService}=require('./agent-service'),{Connection,commandLine,validate}=require('./agent-mcp'),{waitUntil}=require('./selftest-helpers.cjs');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob-mcp-client-')),result={passed:false,checks:[],root},events=[],httpRequests=[],modelRequests=[];let agent,restored;
 const tool={name:'fixture_echo',description:'Echo an actual fixture value',inputSchema:{type:'object',properties:{value:{type:'string'}},required:['value']}},engine={emit:event=>events.push(event),status:()=>[]};
 let calls=0,deletes=0,cancellations=0;
 const server=http.createServer(async(req,res)=>{
  if(req.method==='DELETE'){deletes++;res.writeHead(204);res.end();return;}
  let raw='';for await(const chunk of req)raw+=chunk;const p=JSON.parse(raw);httpRequests.push({p,headers:req.headers});
  if(req.url.startsWith('/model')){
   modelRequests.push(p);const remote=p.tools.find(tool=>tool.function.name.startsWith('mcp_'));
   res.writeHead(200,{'Content-Type':'text/event-stream'});const delta=p.messages.some(message=>message.role==='tool')?{content:'真实 MCP 工具已完成'}:{tool_calls:[{index:0,id:'external-fixture',type:'function',function:{name:remote.function.name,arguments:JSON.stringify({value:'from-model'})}}]};res.end('data: '+JSON.stringify({choices:[{delta}]})+'\n\ndata: [DONE]\n\n');return;
  }
  if(req.headers.authorization!=='Bearer mcp-secret'){res.writeHead(401);res.end();return;}
  let value;if(p.method==='initialize')value={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'fixture',version:'1'}};
  else{assert.equal(req.headers['mcp-session-id'],'fixture-session');if(p.method==='notifications/initialized'){res.writeHead(202);res.end();return;}if(p.method==='notifications/cancelled'){cancellations++;res.writeHead(202);res.end();return;}if(p.method==='tools/list'){
   if(req.url==='/cycle')value={tools:[],nextCursor:p.params.cursor==='a'?'b':'a'};
   else if(req.url==='/duplicate')value={tools:[tool,tool]};
   else if(req.url==='/oversized')value={tools:[{...tool,description:'x'.repeat(3*1024*1024)}]};
   else value={tools:[tool]};
  }else if(p.method==='tools/call'){if(req.url==='/slow')return;calls++;value={content:[{type:'text',text:p.params.arguments.value}]};}else throw Error('Unknown fixture method');}
  res.writeHead(200,{'Content-Type':'text/event-stream','Mcp-Session-Id':'fixture-session'});res.end('event: message\r\ndata: '+JSON.stringify({jsonrpc:'2.0',id:p.id,result:value})+'\r\n\r\n');
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const url='http://127.0.0.1:'+server.address().port+'/mcp',config={type:'http',url,headers:{Authorization:'Bearer mcp-secret'}};
  agent=new AgentService({root,engine});await agent.request('info');
  assert.deepEqual(commandLine('node "C:\\space path\\server.js" --value "a b"'),['node','C:\\space path\\server.js','--value','a b']);assert.deepEqual(commandLine("node 'a b' ''"),['node','a b','']);assert.throws(()=>commandLine('node "unterminated'),/quote/);
  assert.equal(validate('path with spaces',{type:'stdio',command:'/a b/node',args:['fixture']}).command,'/a b/node');assert.throws(()=>validate('bad',{type:'http',url:'file:///etc/passwd'}),/URL/);assert.throws(()=>validate('bad',{...config,headers:{'Content-Length':'3'}}),/Reserved/);
  await agent.request('mcp:upsert',{name:'HTTP 工具',config});assert.equal(calls,0);assert.equal((await agent.request('mcp:list')).data[0].enabled,false);
  await agent.request('mcp:test',{name:'HTTP 工具'});assert.equal(deletes,1);await agent.request('mcp:enable',{name:'HTTP 工具'});
  const run={abort:new AbortController()},definitions=await agent.mcp.definitions(run);assert.equal(definitions.length,1);assert.match(definitions[0].function.name,/^[a-zA-Z0-9_-]{1,64}$/);const native=await agent.tool(definitions[0].function.name,{value:'real-http'},run);assert.equal(native.content[0].text,'real-http');assert.equal(calls,1);
  const scoped={allowedProfileIds:['only'],abort:new AbortController()};assert.equal((await agent.mcp.definitions(scoped)).length,0);await assert.rejects(agent.mcp.call(definitions[0].function.name,{value:'forbidden'},scoped),/限定窗口/);assert.equal(calls,1);
  result.checks.push('真实 Streamable HTTP/SSE 握手、session、认证头、tools/list 与 tools/call；保存不自动连接，测试连接真实释放；限定窗口任务不暴露外部工具');
  await assert.rejects(agent.request('mcp:test',{name:'unauthorized',config:{...config,headers:{Authorization:'invalid'}}}),/401/);
  for(const [endpoint,error]of [['cycle',/pagination/],['duplicate',/duplicate/],['oversized',/2 MiB/]])await assert.rejects(agent.request('mcp:test',{name:endpoint,config:{...config,url:url.replace('/mcp','/'+endpoint)}}),error);
  const slow=await new Connection({...config,url:url.replace('/mcp','/slow')}).open(),abort=new AbortController(),waiting=slow.request('tools/call',{name:'fixture_echo',arguments:{value:'cancel'}},abort.signal);
  await waitUntil(()=>httpRequests.some(row=>row.p.method==='tools/call'&&row.p.params.arguments.value==='cancel'));abort.abort(Error('fixture cancellation'));await assert.rejects(waiting,/fixture cancellation/);assert.equal(cancellations,1);assert.equal(slow.pending.size,0);await slow.close();
  result.checks.push('真实 HTTP 401、循环分页、重名工具、超过 2 MiB 响应明确拒绝；中止请求发送 MCP notifications/cancelled 并清空等待项');
  const save=agent.save.bind(agent);agent.save=async()=>{throw Error('injected MCP disk failure');};await assert.rejects(agent.request('mcp:upsert',{name:'HTTP 工具',config:{...config,url:url+'changed'}}),/disk failure/);agent.save=save;assert.equal(agent.mcp.rows()[0].config.url,url);
  const file=path.join(root,'stdio fixture.cjs'),pidFile=path.join(root,'child.pid');
  await fs.writeFile(file,`const fs=require('fs'),readline=require('readline');fs.writeFileSync(process.env.FIXTURE_PID,String(process.pid));readline.createInterface({input:process.stdin}).on('line',line=>{const p=JSON.parse(line);if(p.id===undefined)return;let result;if(p.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'stdio-fixture',version:'1'}};else if(p.method==='tools/list')result={tools:[${JSON.stringify(tool)}]};else if(p.method==='tools/call')result={content:[{type:'text',text:p.params.arguments.value+':'+process.env.FIXTURE_VALUE}]};process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:p.id,result})+'\\n');});`);
  const stdio={type:'stdio',command:[process.execPath,file].map(value=>JSON.stringify(value)).join(' '),env:{FIXTURE_PID:pidFile,FIXTURE_VALUE:'environment-secret'}};
  await agent.request('mcp:upsert',{name:'进程工具',config:stdio});await Promise.all([agent.request('mcp:enable',{name:'进程工具'}),agent.request('mcp:test',{name:'进程工具'})]);
  const [one,two]=await Promise.all([agent.mcp.definitions({}),agent.mcp.definitions({})]);assert.equal(one.length,2);assert.equal(two.length,2);assert.equal(agent.mcp.connections.size,2);
  const stdioRun={abort:new AbortController()};await agent.mcp.definitions(stdioRun);const entry=[...stdioRun.mcpTools].find(([,tool])=>tool.server==='进程工具');const stdout=await agent.tool(entry[0],{value:'real-stdio'},stdioRun);assert.equal(stdout.content[0].text,'real-stdio:environment-secret');
  const child=agent.mcp.connections.get('进程工具').connection.child,pid=child.pid;assert.ok(pid);await agent.request('mcp:disable',{name:'进程工具'});assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});await assert.rejects(agent.tool(entry[0],{value:'stale'},stdioRun),/停用/);
  result.checks.push('真实子进程 stdio、带空格路径/引号/环境变量、并发发现复用连接、关闭后 PID 消失，旧工具快照不能调用已停用服务；写盘失败保留旧配置');
  await agent.request('config:set',{provider:'openai',baseUrl:'http://127.0.0.1:'+server.address().port+'/model',model:'mcp-fixture'});const c=await agent.request('createConversation');
  await agent.request('channel:send',{type:'conversation.run.start',data:{conversationId:c.id,message:'call remote fixture',fullAccess:false}});await waitUntil(()=>agent.active.get(c.id)?.pendingApproval);assert.equal(calls,1);const pending=agent.active.get(c.id).pendingApproval;
  await agent.request('channel:send',{type:'conversation.approval.submit',data:{conversationId:c.id,approvalId:pending.id,decisions:[{type:'approve'}]}});await waitUntil(()=>!agent.active.has(c.id));assert.equal(calls,2);assert.ok(modelRequests.at(-1).messages.some(message=>message.role==='tool'&&message.content.includes('from-model')));assert.equal(agent.conversation(c.id).latestRunStatus,'completed');
  result.checks.push('真实模型发现命名空间工具；待授权时外部调用次数不变，原批准决定后才执行，结果真实回传模型并完成任务');
  await agent.request('mcp:enable',{name:'进程工具'});const shutdownPid=agent.mcp.connections.get('进程工具').connection.child.pid;
  const encrypted=await fs.readFile(path.join(root,'local-agent/state.enc'));assert.ok(!encrypted.includes(Buffer.from('mcp-secret')));assert.ok(!encrypted.includes(Buffer.from('environment-secret')));
  agent.save=async()=>{throw Error('injected shutdown persistence failure');};await assert.rejects(agent.shutdown(),/injected shutdown persistence failure/);assert.equal(agent.mcp.connections.size,0);assert.throws(()=>process.kill(shutdownPid,0),{code:'ESRCH'});agent=null;
  result.checks.push('Agent 退出保存失败仍关闭实际 stdio 子进程和 HTTP session；PID 已消失，保存异常保留并抛出');
  restored=new AgentService({root,engine});const persisted=await restored.request('mcp:list');assert.equal(persisted.data.length,2);assert.equal(persisted.data.find(row=>row.name==='HTTP 工具').enabled,true);assert.equal(restored.mcp.connections.size,0);await restored.request('mcp:delete',{name:'进程工具'});assert.equal((await restored.request('mcp:list')).data.length,1);
  await assert.rejects(restored.request('mcp:import',{mcpServers:{valid:config,bad:{type:'http',url:'invalid'}}}),/URL/);assert.equal((await restored.request('mcp:list')).data.length,1);
  result.checks.push('认证信息加密落盘、重启恢复配置与启用状态且无启动自动出网；删除与整批导入的验证原子性');result.passed=true;
 }catch(error){result.failure=error.stack;process.exitCode=1;}finally{await agent?.shutdown();await restored?.shutdown();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/agent-mcp-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

"use strict";
const { openWorkspacePage } = require("./selftest-helpers.cjs");
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const {_electron:electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {waitUntil}=require('./selftest-helpers.cjs'),repo=path.resolve(__dirname,'../..');
(async()=>{
 const data=await createTestDirectory('approval-ui-'),evidence=evidenceDirectory(),result={passed:false,checks:[],errors:[],externalRequests:[],data},requests=[];let app,page;
 const server=http.createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;const p=JSON.parse(raw);requests.push(p);const count=p.messages.filter(message=>message.role==='tool').length,double=p.messages.some(message=>String(message.content).includes('DOUBLE'));
  res.writeHead(200,{'content-type':'text/event-stream'});const delta=count<(double?2:1)?{tool_calls:[{index:0,id:'call-'+count,type:'function',function:{name:'create_profile',arguments:JSON.stringify({name:'授权窗口 '+count,os:'Linux'})}}]}:{content:'授权操作测试完成'};res.end('data: '+JSON.stringify({choices:[{delta}]})+'\n\ndata: [DONE]\n\n');});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  app=await electron.launch({executablePath:require('electron'),args:[...(process.platform==='linux'?['--no-sandbox','--ozone-platform=headless','--disable-gpu']:[]),path.join(repo,'Browserapp')],env:{...process.env,OPENBROWSER_USER_DATA:data,OPENBROWSER_API_PORT:'0'}});page=await app.firstWindow();page.setDefaultTimeout(15000);await page.setViewportSize({width:1448,height:1050});page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());});page.on('request',request=>{if(/^https?:|^wss?:/.test(request.url()))result.externalRequests.push(request.url());});await page.getByText('暂无窗口',{exact:true}).waitFor();
  await page.evaluate(baseUrl=>globalThis.__agentRequest('config:set',{provider:'openai',baseUrl,model:'fixture'}),'http://127.0.0.1:'+server.address().port);
  page=await openWorkspacePage(app,'/agent-console');
  const names = await page.evaluate(async () => {
    const { approvalActionTitles } = await import('/assets/workbench-approval-resource-names.js');
    const actions = ['legacy-catalog-slug', '/local/scripts/fixture.ts', 'user:1']
      .map(scriptPath => ({ name: 'roxy_script_run', args: { scriptPath } }));
    let remoteLookups = 0;
    const titles = await approvalActionTitles(actions, {
      workspaceName: 'OpenBrowser', locale: 'zh-CN',
      userTemplates: { getUserTemplate: async () => ({ data: { name: '本地脚本模板' } }) },
      officialScripts: { getOfficialScript: async () => { remoteLookups++; throw Error('Remote catalog is disabled'); } },
    });
    return { titles, remoteLookups };
  });
  assert.deepEqual(names, { titles: ['运行脚本 legacy-catalog-slug', '运行脚本 fixture.ts', '运行脚本 本地脚本模板'], remoteLookups: 0 });
  result.checks.push('脚本授权卡显示历史标识、文件名和本地模板名，历史标识不请求官方目录');
  const start=async message=>{const c=await page.evaluate(()=>globalThis.__agentRequest('createConversation'));await page.evaluate(id=>globalThis.__router.push('/agent-console/c/'+id),c.id);const editor=page.locator('[contenteditable="true"]').first();await editor.waitFor();const full=page.getByRole('button',{name:'完全访问权限',exact:true});if(await full.count()){await full.first().click();await page.locator('.approval-option:visible').filter({hasText:'请求批准'}).click();}await editor.fill(message);await editor.press('Enter');await page.locator('.hitl-card').waitFor();return c;};
  let c=await start('ONE');assert.equal((await page.evaluate(()=>globalThis.__localRequest('profiles:list'))).length,0);assert.equal(requests.length,1);await page.screenshot({path:path.join(evidence,'agent-approval-pending.png')});
  await page.reload();await page.locator('.conversation-item').filter({hasText:'ONE'}).click();await page.locator('.hitl-card').waitFor();assert.equal(requests.length,1);assert.equal((await page.evaluate(()=>globalThis.__localRequest('profiles:list'))).length,0);
  await page.screenshot({path:path.join(evidence,'agent-approval-restored.png')});result.checks.push('待授权刷新后原卡恢复，模型请求数仍为 1、窗口仍为 0，没有重放执行');
  await page.locator('.hitl-card').getByRole('button',{name:'允许',exact:true}).click();await page.locator('.hitl-card').waitFor({state:'hidden'});await page.getByText('授权操作测试完成',{exact:true}).first().waitFor();await waitUntil(()=>page.evaluate(()=>globalThis.__localRequest('profiles:list').then(rows=>rows.length===1)));await page.screenshot({path:path.join(evidence,'agent-approval-allowed.png')});result.checks.push('原聊天输入与原授权卡：确认前 0 写入，点击原“允许”后才由真实模型工具创建原生窗口');
  c=await start('DENY');await page.locator('.hitl-card').getByRole('button',{name:'拒绝',exact:true}).click();await page.locator('.hitl-card').waitFor({state:'hidden'});await page.getByText('授权操作测试完成',{exact:true}).first().waitFor();assert.equal((await page.evaluate(()=>globalThis.__localRequest('profiles:list'))).length,1);assert.ok(requests.at(-1).messages.some(message=>message.role==='tool'&&message.content.includes('用户拒绝')));result.checks.push('原拒绝按钮不执行操作，模型实际收到拒绝结果');
  c=await start('DOUBLE');await page.locator('.hitl-card').getByRole('button',{name:'完全访问权限',exact:true}).click();await page.locator('.hitl-card').waitFor({state:'hidden'});await page.getByText('授权操作测试完成',{exact:true}).first().waitFor();await waitUntil(()=>page.evaluate(()=>globalThis.__localRequest('profiles:list').then(rows=>rows.length===3)));const detail=await page.evaluate(id=>globalThis.__agentRequest('conversationDetail',{id}),c.id);assert.equal(detail.conversation.checkpoint.fullAccess,true);
  await page.screenshot({path:path.join(evidence,'agent-approval-full-access.png')});result.checks.push('原完全访问按钮生成真实 fullAccess 决定，后续工具继续完成，3 个原生窗口及授权检查点读回');assert.deepEqual(result.errors,[]);assert.deepEqual(result.externalRequests,[]);result.passed=true;
 }catch(error){result.failure=error.stack;if(page){result.body=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:path.join(evidence,'agent-approval-ui-failure.png')}).catch(()=>{});}}
 finally{await app?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.join(evidence,'agent-approval-ui-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});

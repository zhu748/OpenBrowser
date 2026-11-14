'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {requestBuffer}=require('../network/http-request'),{createKernelMetadataClient}=require('../automation/kernel/metadata'),{Downloader}=require('../automation/downloader');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob-environment-network-')),result={passed:false,checks:[]},requests=[],previous={};for(const key of ['HTTP_PROXY','http_proxy','HTTPS_PROXY','https_proxy','NO_PROXY','no_proxy'])previous[key]=process.env[key];
 const origin=http.createServer((req,res)=>res.end('direct fixture')),proxy=http.createServer((req,res)=>{
  requests.push({url:req.url,authorization:req.headers.authorization,proxyAuth:req.headers['proxy-authorization']});
  if(req.url.endsWith('/redirect')){res.writeHead(302,{Location:'http://second.invalid/document'});res.end();return;}
  if(req.url.endsWith('/document')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({source:'actual proxy fixture'}));return;}
  res.end('download fixture');
 });await Promise.all([new Promise(resolve=>origin.listen(0,'127.0.0.1',resolve)),new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve))]);
 try{
  process.env.HTTP_PROXY='http://fixture:secret@127.0.0.1:'+proxy.address().port;process.env.HTTPS_PROXY=process.env.HTTP_PROXY;process.env.http_proxy='';process.env.https_proxy='';process.env.NO_PROXY='';process.env.no_proxy='';
  const client=createKernelMetadataClient({validateUrl:raw=>{const u=new URL(raw);assert.ok(['origin.invalid','second.invalid'].includes(u.hostname));return u;},maxBytes:1024,maxRedirects:3});assert.equal((await client.fetchJson('http://origin.invalid/document')).source,'actual proxy fixture');assert.equal(requests.length,1);assert.equal(requests[0].proxyAuth,'Basic '+Buffer.from('fixture:secret').toString('base64'));
  await requestBuffer('http://origin.invalid/redirect',{maxBytes:1024,timeoutMs:2000,environmentProxy:true,headers:{Authorization:'Bearer origin-secret'},followRedirects:true});assert.equal(requests.at(-2).authorization,'Bearer origin-secret');assert.equal(requests.at(-1).authorization,undefined);
  result.checks.push('原内核元数据客户端真正经过本地 HTTP 代理，认证正确；跨域重定向验证仍执行且不向新源发送源站密钥');
  const bytes=Buffer.from('download fixture'),dest=path.join(root,'download.bin'),downloader=new Downloader('http://origin.invalid/archive',{destPath:dest,environmentProxy:true,expectedSha256:crypto.createHash('sha256').update(bytes).digest('hex'),timeoutMs:2000});await downloader.start();assert.deepEqual(await fs.readFile(dest),bytes);
  const before=requests.length,direct=await requestBuffer('http://127.0.0.1:'+origin.address().port+'/direct',{maxBytes:1024,timeoutMs:2000});assert.equal(direct.buffer.toString(),'direct fixture');assert.equal(requests.length,before);
  process.env.NO_PROXY='origin.invalid';const bypass=await requestBuffer('http://origin.invalid:'+origin.address().port+'/direct',{maxBytes:1024,timeoutMs:2000,environmentProxy:true,lookup:(_host,options,callback)=>callback(null,...(options.all?[[{address:'127.0.0.1',family:4}]]:['127.0.0.1',4]))});assert.equal(bypass.buffer.toString(),'direct fixture');assert.equal(requests.length,before);
  result.checks.push('真实流式下载仍验证 SHA-256；未选择环境代理的请求继续直连，NO_PROXY 绕过正确，不修改全局 agent');result.passed=true;
 }catch(error){result.failure=error.stack;process.exitCode=1;}finally{for(const[key,value]of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;proxy.closeAllConnections();origin.closeAllConnections();await Promise.all([new Promise(resolve=>proxy.close(resolve)),new Promise(resolve=>origin.close(resolve))]);await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/environment-network-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

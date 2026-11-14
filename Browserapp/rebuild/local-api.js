"use strict";
const fs=require('node:fs/promises'),path=require('node:path');
function savedConfig(settings){
 const value=settings?.localApi;if(value===undefined)return {};
 if(!value||typeof value.open!=='boolean'||typeof value.apiAllowLan!=='boolean'||!Number.isInteger(value.port)||value.port<1||value.port>65535)throw Error('本地 API 配置损坏');
 return value;
}
async function startupConfig(root){
 try{const value=JSON.parse(await fs.readFile(path.join(root,'rebuild-local.json'),'utf8'));if(value.version!==1)throw Error('本地配置版本不支持');return savedConfig(value.settings);}
 catch(error){if(error.code==='ENOENT')return {};throw error;}
}
function stack(service){const value=service.automation?.();if(!value?.localApi)throw Error('本地 API 服务尚未就绪');return value;}
function dto(value,service){const server=value.localApi;return {apiKey:value.apiKey,port:server.port||service.data.settings.localApi?.port||50325,open:Boolean(server.server?.listening),apiAllowLan:server.host==='0.0.0.0'};}
async function request(service,method,p){
 const value=stack(service),server=value.localApi;
 if(method==='get')return dto(value,service);
 if(method==='mcp-config'){
  const config={command:process.execPath,args:[path.resolve(__dirname,'../automation/mcp-server.js')],env:{ELECTRON_RUN_AS_NODE:'1',OPENBROWSER_API_HOST:'127.0.0.1',OPENBROWSER_API_PORT:String(dto(value,service).port),OPENBROWSER_API_KEY:value.apiKey,OPENBROWSER_USER_DATA:service.root,OPENBROWSER_MCP_MODE:'manage'}};
  return {mcpServers:{openbrowser:config}};
 }
 if(method==='reference')return fs.readFile(path.resolve(__dirname,'../automation/README.md'),'utf8');
 if(method==='status')return {success:true,...server.info(),open:Boolean(server.server?.listening)};
 if(method==='check-port'){
  const port=Number(p.port);if(!Number.isInteger(port)||port<1||port>65535)throw Error('端口范围 1–65535');
  if(server.server?.listening&&port===server.port)return port;
  const net=require('node:net');return new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',error=>error.code==='EADDRINUSE'||error.code==='EACCES'?resolve(0):reject(error));probe.listen(port,'0.0.0.0',()=>probe.close(error=>error?reject(error):resolve(port)));});
 }
 if(method==='set'){
  const config=savedConfig({localApi:p});if(p.apiKey!==undefined&&p.apiKey!==value.apiKey)throw Error('密钥请使用原重置按钮生成');
  const previous={host:server.host,port:server.port,requestedPort:server.requestedPort,allowPortFallback:server.allowPortFallback},wasOpen=Boolean(server.server?.listening);
  try{
   await server.stop();server.host=config.apiAllowLan?'0.0.0.0':'127.0.0.1';server.requestedPort=config.port;server.port=config.port;server.allowPortFallback=false;
   if(config.open)await server.start();value.info={...server.info(),enabled:config.open};
   service.data.settings.localApi={open:config.open,port:server.port,apiAllowLan:config.apiAllowLan};await service.save();return dto(value,service);
  }catch(error){
   try{await server.stop();Object.assign(server,previous);if(wasOpen)await server.start();value.info={...server.info(),enabled:wasOpen};}
   catch(rollback){throw new AggregateError([error,rollback],'API 配置失败且旧服务恢复失败：'+error.message+'；'+rollback.message);}
   throw error;
  }
 }
 throw Error('未知本地 API 操作');
}
module.exports={request,startupConfig,savedConfig};

'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {buildZip}=require('./zip-writer');
const EXTENSION_ID='image-policy@openbrowser.local',MAX_IMAGE_BYTES=8*1024*1024;
function backgroundSource({limit,reportUrl}){
 return `'use strict';
const limit=${limit},reportUrl=${JSON.stringify(reportUrl)},maximumBuffered=64*1024*1024,maximumActive=512;
const operations=new Map();let buffered=0,allowed=0,blocked=0,failures=0,reportTimer;
const snapshot=()=>({active:operations.size,buffered,allowed,blocked,failures,limit});
async function report(type,reason){try{const response=await fetch(reportUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,reason,...snapshot()}),signal:AbortSignal.timeout(3000)});if(!response.ok)throw Error('Native image policy report rejected');}catch(error){console.error('OpenBrowser image policy report failed',error);if(type==='ready')throw error;}}
function publish(){if(!reportTimer)reportTimer=setTimeout(()=>{reportTimer=null;void report('stats');},25);}
function failed(reason){failures++;console.error('OpenBrowser image policy: '+reason);void report('error',reason);}
function clear(state){clearTimeout(state.timer);buffered-=state.bytes;state.chunks=[];state.bytes=0;operations.delete(state.id);publish();}
function end(state,pass,reason){if(state.closed)return;state.closed=true;try{if(pass){for(const chunk of state.chunks)state.filter.write(chunk);allowed++;}else blocked++;state.filter.close();}catch(error){failed('response-filter-close');}finally{clear(state);}if(reason)failed(reason);}
browser.webRequest.onHeadersReceived.addListener(details=>{
 if(details.statusCode<200||details.statusCode>=300||[204,205].includes(details.statusCode))return;
 if(operations.size>=maximumActive){blocked++;failed('active-image-limit');return {cancel:true};}
 let filter;try{filter=browser.webRequest.filterResponseData(details.requestId);}catch(error){blocked++;failed('response-filter-create');return {cancel:true};}
 const state={id:details.requestId,filter,chunks:[],bytes:0,closed:false};operations.set(state.id,state);publish();
 state.timer=setTimeout(()=>end(state,false,'image-read-timeout'),30000);
 filter.ondata=event=>{if(state.closed)return;const bytes=event.data.byteLength;if(state.bytes+bytes>limit){end(state,false);return;}if(buffered+bytes>maximumBuffered){end(state,false,'buffered-image-limit');return;}state.chunks.push(event.data);state.bytes+=bytes;buffered+=bytes;};
 filter.onstop=()=>end(state,true);
 filter.onerror=()=>{if(state.closed)return;state.closed=true;clear(state);const error=String(filter.error||'');if(!/aborted|cancel|redirect|NS_BINDING_ABORTED/i.test(error))failed('response-filter-network-error');};
},{urls:['http://*/*','https://*/*'],types:['image']},['blocking']);
// The native host accepts this only after the listener is installed.
void report('ready');`;
}
class FirefoxImageFilter{
 constructor({limit,onError}={}){if(!Number.isSafeInteger(limit)||limit<=0||limit>MAX_IMAGE_BYTES)throw RangeError('Firefox image threshold must be 1–8 MiB');this.limit=limit;this.onError=onError;this.nonce=crypto.randomBytes(32).toString('hex');this.stats={active:0,buffered:0,allowed:0,blocked:0,failures:0};this.sockets=new Set();this.closed=false;this.ready=new Promise((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject;});this.ready.catch(()=>{});}
 async install(connection,root){
  this.server=http.createServer({maxHeaderSize:8192},(req,res)=>{this.handle(req,res).catch(error=>{this.onError?.(error);if(!res.headersSent)res.writeHead(500);res.end();});});this.server.requestTimeout=4000;this.server.headersTimeout=4000;
  this.server.on('connection',socket=>{this.sockets.add(socket);socket.once('close',()=>this.sockets.delete(socket));socket.setTimeout(4000,()=>socket.destroy());});
  await new Promise((resolve,reject)=>{this.server.once('error',reject);this.server.listen(0,'127.0.0.1',resolve);});
  this.port=this.server.address().port;const reportUrl='http://127.0.0.1:'+this.port+'/report/'+this.nonce;
  const manifest={manifest_version:2,name:'OpenBrowser image size policy',version:'1.0',browser_specific_settings:{gecko:{id:EXTENSION_ID}},permissions:['webRequest','webRequestBlocking','http://*/*','https://*/*'],background:{scripts:['background.js']},content_security_policy:"script-src 'self'; object-src 'none'; connect-src http://127.0.0.1:"+this.port};
  const file=path.join(root,'OpenBrowserImagePolicy.xpi'),temporary=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temporary,buildZip([{name:'manifest.json',data:JSON.stringify(manifest)},{name:'background.js',data:backgroundSource({limit:this.limit,reportUrl})}]),{mode:0o600});await fs.rename(temporary,file);}catch(error){await fs.rm(temporary,{force:true});throw error;}
  const timer=setTimeout(()=>this.rejectReady(Error('Firefox 图片过滤器未就绪')),10000);
  try{await connection.command('network.setCacheBehavior',{cacheBehavior:'bypass'});const result=await connection.command('webExtension.install',{extensionData:{type:'path',path:file}});if(result.extension!==EXTENSION_ID)throw Error('Firefox 图片过滤器身份不匹配');await this.ready;this.installed=true;return this;}finally{clearTimeout(timer);}
 }
 async handle(req,res){
  if(this.closed||req.method!=='POST'||req.url!=='/report/'+this.nonce||req.headers.host!=='127.0.0.1:'+this.port){res.writeHead(404);res.end();return;}
  if(!String(req.headers['content-type']||'').startsWith('application/json')){res.writeHead(415);res.end();return;}
  const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1024){res.writeHead(413);res.end();req.destroy();return;}chunks.push(chunk);}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{res.writeHead(400);res.end();return;}
  const keys=['active','buffered','allowed','blocked','failures'];if(!['ready','stats','error'].includes(value.type)||value.limit!==this.limit||keys.some(key=>!Number.isSafeInteger(value[key])||value[key]<0)||value.active>512||value.buffered>64*1024*1024){res.writeHead(400);res.end();return;}
  this.stats=Object.fromEntries(keys.map(key=>[key,value[key]]));res.writeHead(204);res.end();if(value.type==='ready')this.resolveReady();if(value.type==='error')this.onError?.(Object.assign(Error('Firefox 图片过滤失败：'+String(value.reason||'unknown').slice(0,80)),{code:'IMAGE_SIZE_FILTER_ERROR',fatal:value.reason==='response-filter-close'}));
 }
 close(){if(this.closing)return this.closing;this.closed=true;this.stats={...this.stats,active:0,buffered:0};this.rejectReady(Error('Firefox 图片过滤器已停止'));this.closing=(async()=>{for(const socket of this.sockets)socket.destroy();this.sockets.clear();this.server?.closeAllConnections();if(this.server?.listening)await new Promise((resolve,reject)=>this.server.close(error=>error?reject(error):resolve()));})();return this.closing;}
}
module.exports={FirefoxImageFilter,backgroundSource,EXTENSION_ID,MAX_IMAGE_BYTES};

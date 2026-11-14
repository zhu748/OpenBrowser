'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{BrowserEngine}=require('../engine'),{LocalService}=require('./local-service'),{ImageSizeFilter}=require('../automation/image-size-filter');
const {waitUntil}=require('./selftest-helpers.cjs');
(async()=>{
 process.env.OPENBROWSER_HEADLESS='1';const root=await fs.mkdtemp(path.join(os.tmpdir(),'ob-image-size-')),engine=new BrowserEngine({getPath:()=>root}),result={passed:false,checks:[],events:[]};let service,browser;
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZioAAAAASUVORK5CYII=','base64'),large=Buffer.concat([png,Buffer.alloc(12000)]),svg=extra=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><!--'+extra+'--><rect width="12" height="12" fill="red"/></svg>');
 const server=http.createServer((req,res)=>{
  if(req.url==='/slow.png'){res.writeHead(200,{'Content-Type':'image/png'});res.write(png.subarray(0,10));setTimeout(()=>res.end(png.subarray(10)),45000).unref();return;}
  if(req.url.startsWith('/gzip')){const body=zlib.gzipSync(svg(req.url.includes('large')?'x'.repeat(20000):'tiny'));res.writeHead(200,{'Content-Type':'image/svg+xml','Content-Encoding':'gzip','Content-Length':body.length});res.end(body);return;}
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Image size fixture</title><body>Network image threshold</body>');return;}
  const bytes=req.url.includes('large')?large:png;res.setHeader('Content-Type','image/png');if(!req.url.includes('chunked'))res.setHeader('Content-Length',bytes.length);else res.write(bytes.subarray(0,10));res.end(req.url.includes('chunked')?bytes.subarray(10):bytes);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  assert.throws(()=>new ImageSizeFilter({limit:-1}),/threshold/);assert.throws(()=>new ImageSizeFilter({limit:9*1024*1024}),/threshold/);
  await engine.init(null);engine.on(event=>{if(event.type==='image-size-filter-error')result.events.push(event.message);});service=new LocalService({root,engine});
  const row=await service.request('profiles:create',{windowName:'图片体积真实验收',os:'Linux',forbidImage:false,forbiddenPictureSize:1});const stored=engine.profiles.get(row.id);assert.equal(stored.advanced.blockImages,false);assert.equal(stored.advanced.imageMaxBytes,1024);assert.equal((await service.request('profiles:read',{id:row.id})).forbiddenPictureSize,1);
  await assert.rejects(service.request('profiles:create',{windowName:'非法阈值',forbidImage:false,forbiddenPictureSize:8193}),/8192/);
  const firefox=await service.request('profiles:create',{windowName:'Firefox 图片阈值边界',os:'Linux',coreType:'Firefox',forbidImage:false,forbiddenPictureSize:1});assert.equal(engine.profiles.get(firefox.id).advanced.imageMaxBytes,1024);assert.equal((await service.request('profiles:read',{id:firefox.id})).forbiddenPictureSize,1);
  await service.request('profiles:start',{id:row.id});const item=engine.running.get(row.id);browser=await chromium.connectOverCDP('http://127.0.0.1:'+item.port);const page=browser.contexts()[0].pages()[0];await page.goto('http://127.0.0.1:'+server.address().port+'/');
  const image=async name=>page.evaluate(name=>new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve({timeout:true}),10000);img.onload=()=>{clearTimeout(timer);resolve({loaded:true,width:img.naturalWidth});};img.onerror=()=>{clearTimeout(timer);resolve({loaded:false});};img.src='/'+name;document.body.append(img);}),name);
  result.images={};for(const[name,allowed]of [['small.png',true],['large.png',false],['small-chunked.png',true],['large-chunked.png',false],['gzip-small.svg',true],['gzip-large.svg',false]]){const outcome=await image(name);result.images[name]=outcome;assert.equal(outcome.timeout,undefined,name+' must settle');assert.equal(outcome.loaded,allowed,name);}
  assert.deepEqual(result.events,[]);assert.equal(item.imageSizeFilter.operations.size,0);
  const pending=page.evaluate(()=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve('loaded');img.onerror=()=>resolve('blocked');img.src='/slow.png';document.body.append(img);})).catch(error=>({closed:error.message}));
  await waitUntil(()=>item.imageSizeFilter.operations.size>0);await service.request('profiles:stop',{id:row.id});await pending;assert.equal(item.imageSizeFilter.destroyed,true);assert.equal(item.imageSizeFilter.operations.size,0);assert.deepEqual(result.events,[]);
  result.checks.push('原 KB 表单映射为字节，正阈值不再误开全部图片屏蔽；真实 Chrome 小图放行/大图阻止，chunked 未知长度与 gzip 解码后大小均检查，退出无遗留操作；Firefox 正阈值保存往返，真实 Firefox 过滤由独立回归验收');result.limitations=['本测试验收 Chromium 网络 Image 响应；Firefox 有独立真实浏览器回归，data/blob、本地资源不计入网络图片阈值验收。'];result.passed=true;
 }catch(error){result.failure=error.stack;process.exitCode=1;}finally{await browser?.close();await service?.agent.shutdown();await engine.stopAll();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.resolve(__dirname,'../../docs/rebuild/evidence/image-size-selftest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
const MAX_IMAGE_BYTES=8*1024*1024;
class ImageSizeFilter{
 constructor({limit=0,onError}={}){if(!Number.isSafeInteger(limit)||limit<0||limit>MAX_IMAGE_BYTES)throw RangeError('Image threshold must be 0–8 MiB');this.limit=limit;this.enabled=limit>0;this.onError=onError;this.operations=new Map();this.tail=Promise.resolve();this.destroyed=false;}
 matches(event){return this.enabled&&event?.method==='Fetch.requestPaused'&&event.params?.resourceType==='Image'&&event.params.responseStatusCode!==undefined;}
 handlePaused(event,connection){
  const {requestId}=event.params,sessionId=event.sessionId,key=JSON.stringify([sessionId||'',requestId]);if(this.operations.has(key))return this.operations.get(key).promise;
  const state={closed:false};this.operations.set(key,state);
  const run=async()=>{
   if(state.closed||this.destroyed)return;let stream,settled=false;
   const command=async(method,p)=>{if(state.closed||this.destroyed)throw Error('Image policy session closed');return connection.command(method,p,{sessionId,timeout:6000});};
   const continueResponse=async()=>{await command('Fetch.continueRequest',{requestId});settled=true;};
   const block=async()=>{await command('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});settled=true;};
   try{
    const {responseStatusCode:status,responseHeaders:headers=[]}=event.params;
    if(status<200||status>=300||[204,205].includes(status)){await continueResponse();return;}
    const length=headers.find(header=>header.name.toLowerCase()==='content-length')?.value;
    if(length&&/^\d+$/.test(length)&&Number(length)>this.limit){await block();return;}
    const opened=await command('Fetch.takeResponseBodyAsStream',{requestId});stream=(opened.result||opened).stream;if(!stream)throw Error('Image response stream missing');
    let size=0,empty=0;const chunks=[],deadline=Date.now()+30000;
    for(;;){
     if(Date.now()>deadline)throw Error('Image response exceeds 30 second read budget');
     const response=await command('IO.read',{handle:stream,size:Math.min(65536,this.limit-size+1)}),data=response.result||response;
     const chunk=Buffer.from(data.data||'',data.base64Encoded?'base64':'utf8');size+=chunk.length;
     if(size>this.limit){await block();return;}
     if(chunk.length){chunks.push(chunk);empty=0;}else if(!data.eof&&++empty>=3)throw Error('Image response stream did not advance');
     if(data.eof)break;
    }
    const responseHeaders=headers.filter(header=>!['content-encoding','content-length','transfer-encoding'].includes(header.name.toLowerCase()));responseHeaders.push({name:'Content-Length',value:String(size)});
    await command('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders,body:Buffer.concat(chunks,size).toString('base64')});settled=true;
   }catch(error){
    if(state.closed||this.destroyed)return;
    if(!settled)try{await block();error.released=true;}catch(release){throw new AggregateError([error,release],'Image filter failed and could not release request');}
    throw error;
   }finally{
    if(stream&&!state.closed&&!this.destroyed)try{await command('IO.close',{handle:stream});}catch(error){this.onError?.(error);}
   }
  };
  state.promise=this.operations.size>512?Promise.reject(Error('Image policy queue exceeds 512 requests')):this.tail.then(run);
  this.tail=state.promise.catch(()=>{});state.promise=state.promise.finally(()=>this.operations.delete(key));return state.promise;
 }
 cleanupSession(sessionId){for(const[key,state]of this.operations)if(JSON.parse(key)[0]===sessionId){state.closed=true;this.operations.delete(key);}}
 destroy(){this.destroyed=true;for(const state of this.operations.values())state.closed=true;this.operations.clear();}
}
module.exports={ImageSizeFilter,MAX_IMAGE_BYTES};

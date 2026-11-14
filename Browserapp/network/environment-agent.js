'use strict';
const http=require('node:http'),https=require('node:https');
let cached;
// Opt-in for application maintenance requests only. Browser-profile traffic
// must retain its explicit direct/proxy choice and never inherit this agent.
function environmentAgent(url,environment=process.env){
 const target=new URL(url),env={};for(const key of ['HTTP_PROXY','http_proxy','HTTPS_PROXY','https_proxy','NO_PROXY','no_proxy'])if(environment[key]!==undefined)env[key]=environment[key];
 if(!env.HTTP_PROXY&&!env.http_proxy&&!env.HTTPS_PROXY&&!env.https_proxy)return undefined;
 const key=JSON.stringify(env);if(cached?.key!==key){let next;try{next={key,http:new http.Agent({keepAlive:false,proxyEnv:env}),https:new https.Agent({keepAlive:false,proxyEnv:env})};}catch{throw Error('环境代理配置无效');}cached?.http.destroy();cached?.https.destroy();cached=next;}
 return target.protocol==='https:'?cached.https:cached.http;
}
module.exports={environmentAgent};

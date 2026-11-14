'use strict';
async function probeHostNetwork(environment=process.env){
 const native=require('../proxy-forwarder'),configured=environment.HTTPS_PROXY||environment.https_proxy||environment.HTTP_PROXY||environment.http_proxy;
 if(!configured||(environment.NO_PROXY||environment.no_proxy||'').trim()==='*')return {...await native.lookupDirectCountry({force:true}),route:'direct',routeLabel:'当前网络定位（直连）'};
 let config;try{config=native.parseProxy(configured);}catch{throw Error('环境代理配置无效，请检查 HTTPS_PROXY / HTTP_PROXY');}
 const result=await native.lookupProxyCountry(config,{force:true});return {...result,route:'environment-proxy',routeLabel:'当前网络定位（环境代理出口）'};
}
module.exports={probeHostNetwork};

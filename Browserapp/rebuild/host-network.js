'use strict';

const { lookupDirectCountry, lookupProxyCountry, parseProxy } = require('../proxy-forwarder');

async function probeHostNetwork({ mode, lookupSystemNetwork, environment = process.env } = {}) {
  const configured = environment.HTTPS_PROXY || environment.https_proxy || environment.HTTP_PROXY || environment.http_proxy;
  const bypass = (environment.NO_PROXY || environment.no_proxy || '').trim() === '*';
  if (mode === 'system' || (mode !== 'local' && !bypass && !configured && lookupSystemNetwork)) {
    if (typeof lookupSystemNetwork !== 'function') throw Error('当前环境无法读取系统代理设置');
    return { ...await lookupSystemNetwork(), route: 'system', routeLabel: '公网出口（跟随系统代理设置）' };
  }
  if (mode !== 'local' && !bypass && configured) {
    let config;
    try { config = parseProxy(configured); }
    catch (_) { throw Error('环境代理配置无效，请检查 HTTPS_PROXY / HTTP_PROXY'); }
    if (!config) throw Error('环境代理配置无效，请检查 HTTPS_PROXY / HTTP_PROXY');
    return { ...await lookupProxyCountry(config, { force: true }), route: 'environment-proxy', routeLabel: '公网出口（环境变量代理）' };
  }
  return { ...await lookupDirectCountry({ force: true }), route: 'direct', routeLabel: '公网出口（直连检测）' };
}

module.exports = { probeHostNetwork };

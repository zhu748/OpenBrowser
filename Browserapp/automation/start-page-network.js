'use strict';

const { calculateIpHealthScore } = require('./ip-health-score');

const NETWORK_FIELDS = [
  'ip', 'query', 'country', 'countryCode', 'region', 'regionName', 'city', 'zip', 'timezone',
  'latitude', 'longitude', 'isp', 'organization', 'org', 'asn', 'asName', 'mobile', 'proxy', 'hosting',
  'networkType', 'type', 'protocol', 'route', 'countryUsage', 'countryRegistered', 'countryNote',
  'geoConflict', 'checkedAt', 'latencyMs', 'soft', 'fraudScore', 'ippureFraudScore',
  'isResidential', 'isBroadcast',
];
const PROBE_ERROR = '未能完成本次出口检测';

function copyScalars(source, fields) {
  return Object.fromEntries(fields.flatMap(key => {
    const value = source[key];
    return value === null || ['string', 'number', 'boolean'].includes(typeof value) ? [[key, value]] : [];
  }));
}

function startPageNetwork(network) {
  if (!network || typeof network !== 'object') return null;
  const result = copyScalars(network, NETWORK_FIELDS);
  // Providers use `proxy` as a boolean. A profile uses the same name for a URL.
  if (typeof result.proxy !== 'boolean') delete result.proxy;
  if (Array.isArray(network.countries)) {
    result.countries = network.countries.filter(code => typeof code === 'string' && /^[A-Z]{2}$/i.test(code));
  }
  const risk = network.riskIntel || network.ipPure || network.ippure;
  if (risk && typeof risk === 'object') {
    result.riskIntel = copyScalars(risk, ['fraudScore', 'riskScore', 'isResidential', 'isBroadcast']);
  }
  if (network.probeError) result.probeError = PROBE_ERROR;
  result.healthScore = calculateIpHealthScore(result);
  return result;
}

module.exports = { startPageNetwork, PROBE_ERROR };

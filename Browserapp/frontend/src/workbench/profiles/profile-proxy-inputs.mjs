const proxyKeys = [
  'moduleId', 'proxyMethod', 'proxyCategory', 'protocol', 'ipType', 'host', 'port',
  'proxyUserName', 'proxyPassword', 'refreshUrl', 'checkChannel', 'extraChannel',
  'isExtraNewIp', 'isRepectCheck', 'extraUrl', 'lastIp', 'lastCountry', 'lastCity',
  'isEncryptProxy', 'proxyEncryptInfo',
];
const noProxyFields = {
  moduleId: 0, proxyMethod: 'noproxy', proxyCategory: 'noproxy', protocol: 'noproxy',
  host: '', port: '', proxyUserName: '', proxyPassword: '', refreshUrl: '',
  lastCity: '', lastCountry: '', lastIp: '',
};
const proxyDetectionKeys = new Set(['lastIp', 'lastCountry', 'lastCity']);

function readOwnValue(record, key) {
  if (record && Object.hasOwn(record, key)) return record[key] ?? '';
}

function firstPresent(...values) {
  return values.find(value => value != null && value !== '');
}

function proxyCategory(proxy) {
  return String(proxy?.proxyCategory || proxy?.protocol || '');
}

function isDirectProxy(proxy) {
  return !proxy || proxyCategory(proxy).toLowerCase() === 'noproxy' || proxy.proxyMethod === 'noproxy';
}

function expandProxyRows(rows, mode) {
  return rows.flatMap(({ _proxyCount: count, ...row }) => {
    const length = Math.max(1, Number(count) || 1);
    const method = mode === 'api' ? 'api' : row.id ? 'choose' : 'custom';
    return Array.from({ length }, () => ({ ...row, proxyMethod: method }));
  });
}

function readProxyProperties(profile = {}) {
  const row = Array.isArray(profile.proxyInfoList) ? profile.proxyInfoList[0] : null;
  const category = firstPresent(profile.proxyCategory, profile.protocol, row?.proxyCategory, row?.protocol);
  const protocol = firstPresent(profile.protocol, row?.protocol, category);
  const oldId = firstPresent(profile.moduleId, row?.id);
  const id = oldId === undefined || oldId === 0 || oldId === '0' ? 0 : String(oldId);
  const defaultMethod = id ? 'choose' : category && String(category).toLowerCase() !== 'noproxy' ? 'custom' : 'noproxy';
  const method = String(firstPresent(profile.proxyMethod, row?.proxyMethod) || defaultMethod);
  const defaultCategory = id && method === 'choose' ? '' : 'noproxy';
  const properties = {
    moduleId: ['custom', 'api', 'noproxy'].includes(method) ? 0 : id,
    proxyMethod: method,
    proxyCategory: category || defaultCategory,
    protocol: protocol || category || defaultCategory,
  };

  for (const key of proxyKeys) {
    if (key in properties) continue;
    // An explicitly cleared detection result must override an earlier value.
    const value = proxyDetectionKeys.has(key)
      ? readOwnValue(row, key) ?? readOwnValue(profile, key)
      : firstPresent(row?.[key], profile[key]);
    if (value !== undefined) properties[key] = value;
  }
  return properties;
}

function toProxyFields(profile = {}) {
  const properties = readProxyProperties(profile);
  const category = String(properties.proxyCategory || '').toLowerCase();
  const selected = properties.proxyMethod === 'choose' && !!properties.moduleId;
  if (category === 'noproxy' || properties.proxyMethod === 'noproxy' || (!category && !selected)) return [];
  return [{
    ...properties,
    id: selected ? properties.moduleId : undefined,
    proxyMethod: selected ? 'choose' : properties.proxyMethod === 'api' ? 'api' : 'custom',
    protocol: properties.protocol || properties.proxyCategory,
  }];
}

function serializeProfileInput(profile) {
  const result = { ...profile, ...readProxyProperties(profile) };
  delete result.proxyInfoList;
  return result;
}

function proxyDetection(proxy) {
  return {
    lastCity: proxy.lastCity ?? '',
    lastCountry: proxy.lastCountry ?? '',
    lastIp: proxy.lastIp ?? '',
  };
}

function serializeProxyRows(field, payload) {
  const rows = Array.isArray(field.value) ? field.value : [];
  const proxy = rows[0];
  if (isDirectProxy(proxy)) {
    Object.assign(payload, noProxyFields);
    return rows.length ? rows : [{ id: 0, ...noProxyFields }];
  }
  const category = proxyCategory(proxy);
  const detected = proxyDetection(proxy);
  if (proxy.id) {
    Object.assign(payload, {
      moduleId: proxy.id, proxyMethod: 'choose', proxyCategory: category,
      protocol: proxy.protocol || proxy.proxyCategory || category,
      ...detected, host: '', port: '', proxyUserName: '', proxyPassword: '',
      refreshUrl: '', extraUrl: '', extraChannel: '',
    });
    return expandProxyRows(rows.map(row => ({ ...row, ...proxyDetection(row) })), 'choose');
  }

  const endpoint = {
    moduleId: 0,
    host: proxy.host ?? '',
    port: proxy.port ?? '',
    proxyUserName: proxy.proxyUserName ?? '',
    proxyPassword: proxy.proxyPassword ?? '',
    ipType: proxy.ipType,
    ...detected,
  };
  if (proxy.proxyMethod === 'api') {
    Object.assign(payload, {
      ...endpoint, proxyMethod: 'api', proxyCategory: category || 'SOCKS5',
      protocol: proxy.protocol || proxy.proxyCategory || 'SOCKS5',
      extraUrl: proxy.extraUrl ?? '', extraChannel: proxy.extraChannel,
      isExtraNewIp: proxy.isExtraNewIp, isRepectCheck: proxy.isRepectCheck, refreshUrl: '',
    });
    return expandProxyRows(rows, 'api');
  }

  Object.assign(payload, {
    ...endpoint, proxyMethod: 'custom', proxyCategory: category,
    protocol: proxy.protocol || proxy.proxyCategory || category,
    refreshUrl: proxy.refreshUrl ?? '', checkChannel: proxy.checkChannel,
    isEncryptProxy: proxy.isEncryptProxy, proxyEncryptInfo: proxy.proxyEncryptInfo,
    extraUrl: '', extraChannel: '',
  });
  return expandProxyRows(rows, 'custom');
}

export { readProxyProperties, serializeProxyRows, toProxyFields, serializeProfileInput };

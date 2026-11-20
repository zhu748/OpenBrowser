import { n as api } from './api-BToUsmQq.js';
import { t as normalizeId } from './id-Bjy_bMW8.js';
import { i as apiSucceeded } from './apiError-BDM3pKoT.js';
import { _ as phoneName } from './phoneDisplay-DDMDXeMy.js';

function readPage(result) {
  if (!apiSucceeded(result)) throw Error(result?.msg || $t('加载云手机列表失败'));
  const data = result.data ?? {};
  const rows = data.items ?? data.list ?? data.value;
  const items = Array.isArray(rows) ? rows : [];
  return { items, total: Number(data.total ?? items.length) || 0 };
}

async function listPhones({ page, pageSize, serialName, proxyIds, ids, serialNos }) {
  const result = await api.phone.v1CloudphonesPhoneListCreate({ page, pageSize,
    ...(serialName && { serialName }), ...(proxyIds?.length && { proxyIds }),
    ...(ids?.length && { ids }), ...(serialNos?.length && { serialNos }) });
  return readPage(result);
}

async function listBoundPhones(proxyId) {
  const phones = [];
  const pageSize = 100;
  for (let page = 1; page <= 50; page++) {
    const { items, total } = readPage(await api.phone.v1CloudphonesProxyPhonesCreate({ fbProxyId: proxyId, page, pageSize }));
    for (const { id, name, serialNo, status, proxy, egressProxy } of items) phones.push({ id, name, serialNo, status, proxy, egressProxy });
    if (phones.length >= total || items.length < pageSize) break;
  }
  return phones;
}

async function loadBoundPhones(proxyIds) {
  const pending = [...new Set(proxyIds.map(normalizeId).filter(Boolean))];
  const results = new Map();
  await Promise.all(Array.from({ length: Math.min(6, pending.length) }, async () => {
    while (pending.length) {
      const id = pending.shift();
      try { results.set(id, await listBoundPhones(id)); }
      catch (error) {
        console.error('[CloudPhone] list phones bound to proxy failed', error);
        results.set(id, []);
      }
    }
  }));
  return results;
}

function indexPhones(phones) {
  return new Map(phones.map(phone => [String(phone.id || '').trim(), phone]).filter(([id]) => id));
}

async function syncBindings({ proxyId, selected, previouslyBound = [] }) {
  const fbProxyId = normalizeId(proxyId);
  if (!fbProxyId) return { ok: false, errors: [$t('未找到代理 IP')] };
  const legal = indexPhones(selected);
  const bound = indexPhones(previouslyBound);
  const errors = [];
  async function update(current, comparison, request) {
    for (const [phoneId, phone] of current) {
      if (comparison.has(phoneId)) continue;
      const result = await request({ phoneId, fbProxyId });
      if (!apiSucceeded(result)) errors.push(result?.msg || phoneName(phone));
    }
  }
  await update(legal, bound, params => api.phone.v1CloudphonesPhoneBindProxyCreate(params));
  await update(bound, legal, params => api.phone.v1CloudphonesPhoneUnbindProxyCreate(params));
  return { ok: errors.length === 0, errors };
}

export { syncBindings as i, listPhones as n, loadBoundPhones as r, listBoundPhones as t };

import {n as e} from "./api-BToUsmQq.js";
import {t} from "./id-Bjy_bMW8.js";
import {i as n} from "./apiError-BDM3pKoT.js";
import {_ as r} from "./phoneDisplay-DDMDXeMy.js";
function i(e2) {
  if (!e2 || typeof e2 != "object") return { items: [], total: 0 };
  let t2 = e2, n2 = t2.items ?? t2.list ?? t2.value, r2 = Array.isArray(n2) ? n2 : [];
  return { items: r2, total: Number(t2.total ?? r2.length) || 0 };
}
async function a(t2) {
  let r2 = await e.phone.v1CloudphonesPhoneListCreate({ page: t2.page, pageSize: t2.pageSize, ...t2.serialName ? { serialName: t2.serialName } : {}, ...t2.proxyIds?.length ? { proxyIds: t2.proxyIds } : {}, ...t2.ids?.length ? { ids: t2.ids } : {}, ...t2.serialNos?.length ? { serialNos: t2.serialNos } : {} });
  if (!n(r2)) throw Error(r2.msg || $t("\u52A0\u8F7D\u4E91\u624B\u673A\u5217\u8868\u5931\u8D25"));
  return i(r2.data);
}
async function o(t2) {
  let r2 = [];
  for (let i2 = 1; i2 <= 50; i2 += 1) {
    let a2 = await e.phone.v1CloudphonesProxyPhonesCreate({ fbProxyId: t2, page: i2, pageSize: 100 });
    if (!n(a2)) throw Error(a2.msg || $t("\u52A0\u8F7D\u4E91\u624B\u673A\u5217\u8868\u5931\u8D25"));
    let o2 = a2.data?.items ?? [];
    for (let e2 of o2) r2.push({ id: e2.id, name: e2.name, serialNo: e2.serialNo, status: e2.status, proxy: e2.proxy, egressProxy: e2.egressProxy });
    let s2 = Number(a2.data?.total ?? r2.length) || r2.length;
    if (!o2.length || r2.length >= s2 || o2.length < 100) break;
  }
  return r2;
}
async function s(e2) {
  let n2 = [...new Set(e2.map((e3) => t(e3)).filter((e3) => !!e3))], r2 = /* @__PURE__ */ new Map(), i2 = [...n2], a2 = Math.min(6, i2.length);
  return await Promise.all(Array.from({ length: a2 }, async () => {
    for (; i2.length; ) {
      let e3 = i2.shift();
      if (!e3) return;
      try {
        r2.set(e3, await o(e3));
      } catch (t2) {
        console.error("[CloudPhone] list phones bound to proxy failed", t2), r2.set(e3, []);
      }
    }
  })), r2;
}
function c(e2) {
  return String(e2.id || "").trim();
}
async function l(i2) {
  let a2 = t(i2.proxyId);
  if (!a2) return { ok: !1, errors: [$t("\u672A\u627E\u5230\u4EE3\u7406 IP")] };
  let o2 = new Set(i2.selected.map(c).filter(Boolean)), s2 = new Set((i2.previouslyBound ?? []).map(c).filter(Boolean)), l2 = [];
  for (let t2 of i2.selected) {
    let i3 = c(t2);
    if (!i3 || s2.has(i3)) continue;
    let o3 = await e.phone.v1CloudphonesPhoneBindProxyCreate({ phoneId: i3, fbProxyId: a2 });
    n(o3) || l2.push(o3.msg || r(t2));
  }
  for (let t2 of i2.previouslyBound ?? []) {
    let i3 = c(t2);
    if (!i3 || o2.has(i3)) continue;
    let s3 = await e.phone.v1CloudphonesPhoneUnbindProxyCreate({ phoneId: i3, fbProxyId: a2 });
    n(s3) || l2.push(s3.msg || r(t2));
  }
  return { ok: l2.length === 0, errors: l2 };
}
export {l as i,a as n,s as r,o as t};
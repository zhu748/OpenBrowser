import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {ar as e,h as t} from "./utils-BIWenCnY.js";
import {C as n,Et as r,N as i,P as a,St as o,W as s,_t as c,at as l,bt as u,d,f,h as p,i as ee,jt as m,lt as h,p as te,q as g,rt as _,x as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as y} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as ne} from "./agent-BmSFI9WH.js";
import {i as b} from "./permission-DOhNJfB3.js";
import {m as x,n as S,t as C} from "./proxy-D7e36h-l.js";
import {b as re} from "./rich-html-link-VdBpR3Cm.js";
import {o as ie,r as ae,s as w,t as oe} from "./ry-table-do6kugym.js";
import {t as T} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as se} from "./rx-button-DyzuUt-V.js";
import {t as ce} from "./rx-alert-A_y5uvgP.js";
import {t as le} from "./custom-empty-CChX4pJt.js";
import {a as ue,m as de,n as fe,o as E,t as pe} from "./hooks-Jw3GridD.js";
import {a as me,i as he} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as ge} from "./rx-select-button-DQtmZ0kT.js";
import {a as _e,i as ve,o as D,s as O,t as k} from "./operation-zwm3okqF.js";
import {t as A} from "./rx-input-number-EcSY6ALQ.js";
import {t as j} from "./remark-cell-DMyo1A0X.js";
function M() {
  return !!globalThis.isCloudPhoneApp;
}
function N() {
  let e2 = M();
  return { isCloudPhone: e2, relatedColumn: e2 ? $t("\u5DF2\u5173\u8054\u4E91\u624B\u673A") : $t("\u5DF2\u5173\u8054\u7A97\u53E3"), selectTitle: e2 ? $t("\u9009\u62E9\u4E91\u624B\u673A") : $t("\u9009\u62E9\u7A97\u53E3"), selectTooltip: e2 ? $t("\u9009\u62E9\u4E91\u624B\u673A") : void 0, emptyBindDesc: e2 ? $t("\u5728\u6B64\u8D2D\u4E70\u4EE3\u7406 IP\uFF0C\u5E76\u66F4\u65B9\u4FBF\u5730\u4E0E\u4E91\u624B\u673A\u8FDB\u884C\u7ED1\u5B9A\u3002") : $t("\u5728\u6B64\u8D2D\u4E70\u4EE3\u7406 IP\uFF0C\u5E76\u66F4\u65B9\u4FBF\u5730\u4E0E\u7A97\u53E3\u8FDB\u884C\u7ED1\u5B9A\u3002"), refreshConfirm: (t2) => e2 ? $t("\u6B64\u4EE3\u7406 IP \u5DF2\u5173\u8054 {count} \u4E2A\u4E91\u624B\u673A\uFF0C\u60A8\u786E\u8BA4\u8981\u5237\u65B0\u4EE3\u7406 IP \u5417\uFF1F", { count: t2 }) : $t("\u6B64\u4EE3\u7406 IP \u5DF2\u5173\u8054 {count} \u4E2A\u7A97\u53E3\uFF0C\u60A8\u786E\u8BA4\u8981\u5237\u65B0\u4EE3\u7406 IP \u5417\uFF1F", { count: t2 }), tableCacheKey: e2 ? "cloud-phone-agent-shop" : "agent-shop", columnStorageKey: e2 ? "cloud_phone_proxy_display_v1" : "proxy_display_v1" };
}
function P(e2) {
  return Array.isArray(e2) ? e2.filter((e3) => !!e3 && typeof e3 == "object") : [];
}
function F(e2) {
  if (e2?.phoneBindCount == null) return null;
  let t2 = Number(e2.phoneBindCount);
  return Number.isFinite(t2) ? Math.max(0, Math.trunc(t2)) : null;
}
function I(e2) {
  return P(e2?.phoneBindList).map((e3) => String(e3.name || e3.serialNo || e3.phone || "").trim()).filter(Boolean);
}
function L(e2) {
  return P(e2?.phoneBindList).map((e3) => String(e3.id ?? "").trim()).filter(Boolean);
}
function R(e2) {
  if (L(e2).length || I(e2).length) return !1;
  let t2 = F(e2);
  return t2 == null || t2 > 0;
}
var ye = { class: "flex flex-col h-full w-full px-4 pt-4 pb-0 proxy-content" };
var be = { class: "flex flex-wrap gap-1.5 items-center justify-between proxy-header" };
var xe = { class: "flex items-center gap-1.5 flex-wrap" };
var Se = { class: "flex items-center gap-1.5 flex-wrap" };
var Ce = { class: "flex-ovh-1" };
var we = { class: "w-full flex justify-end gap-3 button-group" };
var z = T(n({ __name: "simple", props: i({ data: {}, isBatch: { type: Boolean, default: !1 }, syncCheckToModule: { type: Boolean, default: !0 }, onConfirm: { type: Function } }, { total: {}, totalModifiers: {} }), emits: ["update:total"], setup(n2) {
  let i2 = _(n2, "total"), T2 = re(), { buyProxy: M2 } = fe(), { testProxy: P2, batchTestShowToast: L2 } = pe(), [R2, z2] = ne(), Te = k(), B = l("agent"), V = u({ list: [{ name: "proxyType", value: void 0, options: [{ name: $t("\u5168\u90E8"), value: void 0 }, { name: $t("\u5BFC\u5165"), value: x.resource.toString() }, { name: $t("\u6211\u8D2D\u4E70\u7684"), value: x.buy.toString() }] }], getValues() {
    return Object.fromEntries(V.list.filter((e2) => e2.value).map((e2) => [e2.name, e2.value]));
  }, onChange() {
    X();
  } }), H = o(), U = o({}), W = o(!1), G = o(Ee(n2.data, n2.isBatch)), K = o({}), q = o(!1);
  function Ee(e2, t2) {
    let n3 = r(e2);
    if (t2 || n3?.id != null && n3.id !== 0) return n3;
  }
  let J = N(), { columns: Y } = O({ inserts: n2.isBatch ? [[5, { title: $t("\u5173\u8054\u7A97\u53E3\u6570\u91CF"), slot: "bounded" }]] : [], filters: ["proxy", "ipChecker", "proxyProviderPrice", "autoRenew"], storageKey: J.isCloudPhone ? "cloud_phone_proxy_quick_display_v1" : "proxy_quick_display_v1", relatedColumnTitle: J.relatedColumn });
  function De(e2) {
    if (!J.isCloudPhone) return D(e2);
    let t2 = I(e2);
    if (t2.length) return t2;
    let n3 = F(e2);
    return n3 ? [$t("{count} \u4E2A", { count: n3 })] : [];
  }
  let Oe = { showDisplay: !1, showGridlines: !1, contextMenu: !1, multipleOperation: !1, ...n2.isBatch ? { onRowSelect({ data: e2 }) {
    Reflect.set(e2, "_disabled", !1);
  }, onRowUnselect({ data: e2 }) {
    Reflect.set(e2, "_disabled", !0);
  }, onRowSelectAll() {
    H.value.forEach((e2) => {
      Reflect.set(e2, "_disabled", !1);
    });
  }, onRowUnselectAll() {
    H.value.forEach((e2) => {
      Reflect.set(e2, "_disabled", !0);
    });
  } } : {} }, ke = d(() => $t("\u5DF2\u9009\u62E9 {count} \u6761\u4EE3\u7406 IP", { count: G.value?.length }));
  function X(e2 = {}, t2 = !1) {
    U.value = e2, B.value?.refresh(e2, t2);
  }
  async function Z() {
    if (!W.value) {
      W.value = !0;
      try {
        await B.value?.refresh(U.value, !1);
      } finally {
        W.value = !1;
      }
    }
  }
  async function Ae(e2) {
    let t2 = await _e({ ...V.getValues(), ...e2, type: S.UseDeploy });
    if (t2.code === 0) {
      let e3 = t2.data.rows.map((e4) => {
        if (!n2.isBatch) return e4;
        let t3 = G.value?.find((t4) => e4.id === t4.id);
        return { ...e4, _proxyCount: t3?._proxyCount ?? 1, _disabled: !t3 };
      });
      if (H.value = e3, i2.value = t2.data.total, Reflect.set(t2.data, "rows", e3), !n2.isBatch && G.value?.id != null) {
        let t3 = e3.find((e4) => Number(e4.id) === Number(G.value.id));
        t3 && (G.value = t3);
      }
    }
    return t2;
  }
  function je(e2) {
    return ve(e2).filter((e3) => e3.name === "test");
  }
  function Me(e2, t2) {
    let n3 = [].concat(t2);
    e2.name === "test" && $(n3, { key: e2.name });
  }
  function Q(e2) {
    let { key: t2, value: n3 } = e2 || {};
    X({ queryKey: n3 && (t2 || "fuzzy"), queryValue: n3 }, !0);
  }
  async function Ne() {
    H.value?.length ? await $(H.value, { key: "test" }) : z2(-1, $t("\u6682\u65E0\u4EE3\u7406 IP"));
  }
  async function $(i3, a2) {
    let { key: o2, apiCheck: s2 = !0, enableReCheck: c2 = !0 } = a2, l2 = i3.map((e2) => (w(e2, o2, !0), async () => {
      let t2 = await P2({ ...r(e2), apiCheck: s2 && e2.proxyType === x.buy });
      return w(e2, o2, !1), Object.assign(e2, { ...t2, _checkRes: r(t2) }), K.value[e2.id] = t2.checkStatus, { ...t2, id: e2.id, proxyType: e2.proxyType };
    })), u2 = await e(l2, 5);
    L2(u2, { reCheck: c2 ? () => $(i3, a2) : void 0 });
    let d2 = u2.filter((e2) => e2.proxyType === x.resource);
    return n2.syncCheckToModule && d2.length && t.proxy.userMdfProxyModuleCreate({ proxyList: u2, requestType: b.SpeedTest }), u2;
  }
  async function Pe() {
    try {
      let e2 = await M2({ entryType: C.Immediate });
      if (!e2?.immediate) {
        T2.push({ name: "agent-list", query: { name: "shop", orderNo: e2?.orderNo } });
        return;
      }
      let { code: i3, data: a2 } = await t.proxy.userGetProxyModuleListList({ orderNo: e2?.orderNo, type: S.UseDeploy });
      if (i3 !== 0 || !a2.rows?.[0]) return;
      let o2 = a2.rows.map((e3) => ({ ...r(e3), _proxyCount: 1 }));
      await n2.onConfirm(n2.isBatch ? o2 : o2[0]);
    } catch {
    }
  }
  async function Fe(e2) {
    if (!e2.id) return !1;
    try {
      let { code: n3, data: r2 } = await t.proxy.userGetProxyDetailMergedList({ id: String(e2.id) });
      if (n3 !== 0 || !r2) return !1;
      let { loadingOperationMap: i3 } = e2;
      return Object.assign(e2, r2, { id: e2.id, loadingOperationMap: i3 }), !E(e2.orderStatus) && ue(e2);
    } catch (e3) {
      return console.error("[Proxy:shop-simple] refresh deploying proxy failed", e3), !1;
    }
  }
  async function Ie() {
    let e2 = [].concat(G.value);
    q.value = !0;
    let t2 = [], i3 = !1;
    for (let n3 of e2) E(n3.orderStatus) ? await Fe(n3) ? t2.push(n3) : i3 = !0 : t2.push(n3);
    i3 && R2(0, $t("\u5F53\u524D\u4EE3\u7406 IP \u8FD8\u5728\u90E8\u7F72\u4E2D\uFF0C\u6682\u65F6\u65E0\u6CD5\u4F7F\u7528\u3002\u5EFA\u8BAE\u66F4\u6362\u5176\u5B83\u53EF\u7528\u7684\u4EE3\u7406 IP \u6216\u7A0D\u540E\u91CD\u65B0\u6D4B\u8BD5\u5F53\u524D\u4EE3\u7406 IP\u3002")), t2.length && await $(t2, { key: "test", apiCheck: !1, enableReCheck: !1 }), q.value = !1;
    let a2 = e2.map(({ loadingOperationMap: e3, _disabled: t3, ...n3 }) => r(n3));
    await n2.onConfirm(n2.isBatch ? a2 : a2[0]);
  }
  return (e2, t2) => {
    let r2 = se, i3 = ge, o2 = le, l2 = ie, u2 = oe;
    return s(), p("div", ye, [f("div", be, [f("div", xe, [localCommercialComment("", !0), v(me, { options: m(Te), search: Q, clear: Q }, null, 8, ["options"]), (s(!0), p(ee, null, g(m(V).list, (e3) => (s(), te(i3, { key: e3.name, modelValue: e3.value, "onUpdate:modelValue": (t3) => e3.value = t3, options: e3.options, size: "sm", "option-label": "name", "option-value": "value", "data-key": "value", onChange: m(V).onChange }, null, 8, ["modelValue", "onUpdate:modelValue", "options", "onChange"]))), 128))]), f("div", Se, [v(r2, { outlined: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_speed_test", label: e2.$t("\u6D4B\u8BD5\u5168\u90E8"), onClick: y(Ne, ["stop"]) }, null, 8, ["label"]), v(ae, { loading: m(W), onClick: Z }, null, 8, ["loading"])])]), v(m(ce), { visible: n2.isBatch, class: "w-full proxy-alert", type: "info", title: m(ke), closable: !1 }, null, 8, ["visible", "title"]), f("div", Ce, [v(u2, a({ ref: "agent", selection: m(G), "onUpdate:selection": t2[2] ||= (e3) => c(G) ? G.value = e3 : null, columns: m(Y), "onUpdate:columns": t2[3] ||= (e3) => c(Y) ? Y.value = e3 : null, "cache-key": "proxy-quick-list", "table-request": Ae, "selection-mode": n2.isBatch ? "multiple" : "single", "clear-selection-on-request": !1 }, Oe, { "virtual-scroller-options": { itemSize: 60 }, "show-table-header": !1 }), { "table-empty": h(() => [v(o2, { icon: "rx_illustration_star.svg", title: e2.$t("\u6682\u65E0\u4EE3\u7406 IP") }, null, 8, ["title"])]), outbound: h(({ data: e3 }) => [v(de, { class: "select-none", country: e3.lastCountry, city: e3.lastCity, "last-ip": e3.lastIp, time: e3.checkTime, status: m(K)[e3.id], "badge-desc": e3.badgeTypeDesc, "is-loading": e3.loadingOperationMap?.test, "expire-status": e3.proxyExpireStatus }, null, 8, ["country", "city", "last-ip", "time", "status", "badge-desc", "is-loading", "expire-status"])]), remark: h(({ data: e3, column: { _cache: t3 } }) => [v(j, { remark: e3.remark, extend: t3.extend }, null, 8, ["remark", "extend"])]), bounded: h(({ data: e3 }) => [f("div", { class: "bounded", onClick: t2[1] ||= y(() => {
    }, ["stop"]) }, [v(m(A), { modelValue: e3._proxyCount, "onUpdate:modelValue": (t3) => e3._proxyCount = t3, disabled: e3._disabled, min: 1, step: 1 }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled"])])]), bindList: h(({ data: e3 }) => [v(he, { list: De(e3) }, null, 8, ["list"])]), actions: h(({ data: e3 }) => [v(l2, { operation: je(e3), "loading-operation-map": e3.loadingOperationMap, "show-menu": !1, onQuickClick: (t3) => Me(t3, e3) }, null, 8, ["operation", "loading-operation-map", "onQuickClick"])]), _: 1 }, 16, ["selection", "columns", "selection-mode"])]), f("div", we, [v(r2, { label: m(q) ? e2.$t("\u68C0\u6D4B\u4E2D...") : e2.$t("\u4FDD\u5B58"), disabled: !m(G), onClick: y(Ie, ["stop"]) }, null, 8, ["label", "disabled"])])]);
  };
} }), [["__scopeId", "data-v-4ac02c90"]]);
export {I as a,L as i,R as n,N as o,F as r,M as s,z as t};
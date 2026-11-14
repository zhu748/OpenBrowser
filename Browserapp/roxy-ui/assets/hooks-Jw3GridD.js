import {Ar as n,Tt as s,ar as f,cr as m,fr as g,sn as w,tr as ne} from "./utils-BIWenCnY.js";
import {C as T,D as E,Ot as ce,R as le,St as j,Tt as M,W as N,b as me,bt as he,d as F,en as I,f as L,h as R,i as z,in as B,jt as V,m as W,p as G,rn as ve,s as be,st as xe,w as we,x as q} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {r as ke} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as Me} from "./locales-BfKu2SD4.js";
import {i as Le,n as J} from "./agent-BmSFI9WH.js";
import {l as Be,m as Ve,o as Y,s as He,t as Ue} from "./proxy-D7e36h-l.js";
import {g as Ge} from "./dist-ufdnm93_.js";
import {b as qe,r as Je,y as Ye} from "./rich-html-link-VdBpR3Cm.js";
import {Z as X} from "./basecomponent-ClhuVxJN.js";
import {t as Z} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as Q} from "./rx-button-DyzuUt-V.js";
import {t as wt} from "./format-_cvrr_iF.js";
import {t as Mt} from "./divider-BXJIHZjP.js";
import {n as Ft,t as It} from "./proxy-shop-labels-nJaBS4W_.js";
function tr() {
  return { isProviderJump: () => !1, jumpToProvider: async () => {
    throw Error("\u4EE3\u7406\u5546\u670D\u52A1\u5DF2\u79FB\u9664");
  } };
}
var Nr = Le("network", () => {
  let e2 = j();
  async function t2(t3) {
    e2.value = t3;
  }
  return { info: F(() => e2.value), setNetworkInfo: t2 };
});
var Gi = "--";
function Ki(e2) {
  return !e2 || e2 === Gi;
}
function qi(e2, t2) {
  if (!Ki(e2)) return e2;
  if (!Ki(t2)) return t2;
}
function Yi(e2) {
  if (!e2.isDirect) return !1;
  let { isEncryptProxy: t2, proxyEncryptInfo: n2 } = e2;
  return !t2 || !n2;
}
function Xi(e2) {
  return !Ki(e2.proxyUserName) && !Ki(e2.proxyPassword);
}
function Zi(e2) {
  return e2.proxyType === Ve.buy;
}
function oa(e2 = 0) {
  return !0;
}
function la(e2) {
  if (Xi(e2)) return !0;
  let { isEncryptProxy: t2, proxyEncryptInfo: n2 } = e2;
  return !!(t2 && n2 || Zi(e2) && e2.proxyUserName === Gi && e2.proxyPassword === Gi);
}
function ua() {
  return !0;
}
function da(e2) {
  return Yi(e2) || !la(e2) ? !1 : !Zi(e2) || ua();
}
function fa(e2, t2) {
  return e2 === "zh-CN" ? t2 ? "owner" : "member" : "support";
}
function ma(e2) {
  let t2 = It(s());
  return e2 === "member" ? t2.exportRequiresKycDescMember : e2 === "owner" ? t2.exportRequiresKycDesc : $t("\u5F53\u524D\u65E0\u6CD5\u76F4\u63A5\u4E0B\u8F7D\uFF0C\u8BF7\u8054\u7CFB Roxy AI \u6280\u672F\u652F\u6301\u4EBA\u5DE5\u5BA1\u6838\u5E76\u5F00\u901A\u6743\u9650");
}
function ha(e2, t2) {
  return ma(fa(e2, t2));
}
function ga() {
  Je.emit("openIdentityVerification", { showRegulatoryNotice: !0 });
}
async function _a(e2) {
  let t2 = { host: e2.host, port: e2.port, username: e2.proxyUserName, password: e2.proxyPassword }, { isEncryptProxy: n2, proxyEncryptInfo: r2 } = e2;
  if (!n2 || !r2) return { host: qi(void 0, t2.host), port: qi(void 0, t2.port), username: qi(void 0, t2.username), password: qi(void 0, t2.password) };
  let i2 = await ne(r2);
  return { host: qi(i2.host, t2.host), port: qi(i2.port, t2.port), username: qi(i2.proxyUserName ?? i2.username, t2.username), password: qi(i2.proxyPassword ?? i2.password, t2.password) };
}
var Ta = { class: "flex gap-2 items-center min-w-50 leading-4" };
var Ea = { class: "flex flex-col flex-1 gap-1" };
var Da = { class: "text-3 font-500" };
var Oa = { key: 0, class: "long-renew-offer" };
var ka = { key: 1, class: "py-0.5 px-2 rounded-full direct" };
var Aa = { class: "flex items-center gap-1.5 tt-tertiary text-3" };
var ja = T({ __name: "outbound-ip", props: { country: { default: "" }, city: { default: "" }, lastIp: { default: "" }, time: { default: "" }, status: { default: Y.none }, isLoading: { type: Boolean, default: !1 }, badgeDesc: {}, offerLabel: {}, expireStatus: {} }, setup(e2) {
  let t2 = e2, { status: r2, isLoading: i2 } = ce(t2), a2 = F(() => t2.expireStatus === He.expired && !i2.value && r2.value !== Y.failure), o2 = F(() => {
    let e3 = `${t2.country || "--"}${n("/", t2.city)}`;
    return i2.value ? { svg: "base/rx_ic_earth", title: $t("\u6D4B\u8BD5\u4E2D..."), color: "var(--colors-text-text-primary)", svgColor: "var(--colors-icon-icon-tertiary)" } : r2.value === Y.success ? { svg: `country-code/${t2.country}`, title: e3, color: "var(--colors-text-text-success)", svgColor: "var(--colors-icon-icon-tertiary)" } : r2.value === Y.failure ? { svg: "base/rx_ic_earth", title: $t("\u6D4B\u8BD5\u5931\u8D25"), color: "var(--colors-text-text-error)", svgColor: "var(--colors-icon-icon-error)" } : { svg: `country-code/${t2.country}`, title: e3, color: "var(--colors-text-text-primary)", svgColor: "var(--colors-icon-icon-note)" };
  });
  return (t3, n2) => {
    let r3 = X, i3 = Mt;
    return N(), R("div", Ta, [L("div", { class: I(["icon", { grayscale: V(a2) }]) }, [q(r3, { class: "block", name: V(o2).svg, fallback: "base/rx_ic_earth", color: V(o2).svgColor, size: "24" }, null, 8, ["name", "color"])], 2), L("div", Ea, [L("div", { class: "flex items-center gap-1.5", style: ve({ color: V(o2).color }) }, [L("span", Da, B(V(o2).title), 1), e2.offerLabel ? (N(), R("span", Oa, B(e2.offerLabel), 1)) : W("", !0), e2.badgeDesc ? (N(), R("span", ka, B(e2.badgeDesc), 1)) : W("", !0)], 4), L("div", Aa, [L("span", null, B(e2.lastIp || "--"), 1), q(i3, { class: "!ma-0", layout: "vertical" }), L("span", null, B(V(g)(e2.time)), 1)])])]);
  };
} });
var Ma = Z(ja, [["__scopeId", "data-v-575fcab2"]]);
var as = { class: "concurrent-task-top-bar", role: "status", "aria-live": "polite" };
var os = { class: "flex flex-col gap-2 max-w-90 pa-3 rounded-1 pointer-events-auto concurrent-task-top-bar__inner" };
var ss = { class: "flex items-center gap-2 text-white" };
var cs = { class: "flex items-center gap-1 text-3 font-500 leading-normal" };
var ls = { class: "pl-6 text-white opacity-80 text-3 leading-normal" };
var us = Z(T({ __name: "concurrent-task-top-bar", props: { completed: {}, total: {} }, setup(e2) {
  let t2 = Ft();
  return (n2, r2) => {
    let i2 = X;
    return N(), G(be, { to: "body" }, [L("div", as, [L("div", os, [L("div", ss, [q(i2, { class: "loading-circle", name: "base/rx_ic_spin", size: "18" }), L("div", cs, [L("span", null, B(e2.completed) + " / " + B(e2.total), 1), L("span", null, B(V(t2).concurrentTestingLabel), 1)])]), L("div", ls, B(V(Me)("\u5F53\u524D\u64CD\u4F5C\u53EF\u80FD\u9700\u8981\u51E0\u5206\u949F\u65F6\u95F4\uFF0C\u8BF7\u52FF\u79BB\u5F00\u6B64\u9875\u9762\u3002")), 1)])])]);
  };
} }), [["__scopeId", "data-v-0f4b1dcf"]]);
function ds() {
  let e2 = we()?.appContext, t2 = M(null), n2 = M(null), r2 = M(0), i2 = he({ completed: 0, total: 0 });
  function a2(e3) {
    i2.completed = e3.completed, i2.total = e3.total, o2();
  }
  function o2() {
    r2.value++;
  }
  function s2(a3) {
    if (n2.value) return;
    i2.completed = 0, i2.total = a3.total;
    let o3 = document.createElement("div");
    t2.value = o3, document.body.appendChild(o3);
    let s3 = ke({ setup() {
      return () => (r2.value, E(us, { completed: i2.completed, total: i2.total }));
    } });
    e2 && (s3._context = e2), s3.mount(o3), n2.value = s3;
  }
  function c2() {
    n2.value && t2.value && (n2.value.unmount(), t2.value.remove(), n2.value = null, t2.value = null);
  }
  Ge(c2);
  function l2() {
    return !!n2.value;
  }
  return { show: s2, close: c2, updateProgress: a2, isOpen: l2 };
}
var fs = "openRoxyIpBuy";
function ps(e2) {
  return e2 === Ve.buy;
}
function ms(e2) {
  return e2.checkStatus === Y.failure && !e2.systemError;
}
function hs(e2) {
  return typeof e2 == "string" ? e2 : e2 && typeof e2 == "object" && "message" in e2 ? String(e2.message ?? "") : String(e2 ?? "");
}
function gs(e2) {
  let t2 = hs(e2);
  return t2.startsWith("[IPC]") || t2.includes("Unknown message");
}
function _s(e2) {
  let t2 = (Array.isArray(e2) ? e2 : [e2]).filter(Boolean).filter(ms);
  return t2.length ? t2.some((e3) => !ps(e3.proxyType)) ? "ad" : "support" : null;
}
function vs(e2) {
  return e2.preDetectLastCountry?.trim() || e2.lastCountry?.trim() || "";
}
function ys(e2) {
  let t2 = (Array.isArray(e2) ? e2 : [e2]).filter(Boolean).find((e3) => !!vs(e3) && ms(e3) && !ps(e3.proxyType));
  return (t2 ? vs(t2) : "") || void 0;
}
function bs(e2) {
  return e2 === $t("\u7F51\u7EDC\u4E0D\u901A\u505C\u6B62\u6253\u5F00");
}
function xs(e2) {
  return [$t("\u4EE3\u7406 IP \u68C0\u6D4B\u5931\u8D25"), $t("\u8BBE\u5907\u68C0\u6D4B\u5931\u8D25"), $t("\u65E0\u6CD5\u8FDE\u63A5\u81F3\u4EE3\u7406 IP\uFF0C\u8BF7\u68C0\u67E5\u60A8\u5F53\u524D\u7684\u7F51\u7EDC\u73AF\u5883\u5E76\u91CD\u8BD5\u3002"), $t("\u65E0\u6CD5\u8FDE\u63A5\u81F3\u8BBE\u5907\uFF0C\u8BF7\u68C0\u67E5\u60A8\u5F53\u524D\u7684\u7F51\u7EDC\u73AF\u5883\u5E76\u91CD\u8BD5\u3002")].includes(e2);
}
function Ss(e2) {
  return e2.proxyOrderStatus ?? e2.orderStatus;
}
function Cs(e2) {
  return e2 === Be.pending || e2 === "0";
}
function ws(e2) {
  if (e2.isEncryptProxy && e2.proxyEncryptInfo) return !0;
  let t2 = String(e2.host ?? "").trim(), n2 = String(e2.port ?? "").trim();
  return !!(t2 && n2 && t2 !== "--" && n2 !== "--");
}
function Ts(e2) {
  let t2 = Ss(e2);
  return Cs(t2) || t2 === Be.refunded || t2 === "4" ? !1 : e2.proxyExpireStatus !== He.expired || (e2.proxyType ?? e2.buyProxyType) === Ve.resource;
}
function Ns(e2) {
  let t2 = Ye(), n2 = qe();
  function r2() {
    if (t2.query.openRoxyIpBuy !== "1") return;
    let { [fs]: r3, ...i2 } = t2.query;
    n2.replace({ name: t2.name, query: i2 }), e2();
  }
  xe(() => t2.query[fs], r2, { immediate: !0 });
}
var Rs = { render: () => null };
function zs() {
  let e2 = qe(), [t2] = J(), { buyProxy: r2 } = Bs(), i2 = w(), a2 = ds(), o2 = j(!1), c2 = M(null), l2 = j(!1);
  le(() => {
    o2.value = !0, c2.value?.abort();
  });
  async function u2(e3) {
    const result = await globalThis.__localRequest("proxies:detect", { id: e3 });
    return { loading: !1, lastIp: result.ip || "", lastCountry: result.country_code || "", lastCity: result.city || "", timezone: result.timezone || "", checkStatus: result.ip ? 1 : 2 };
  }
  async function d2({ isEncryptProxy: e3, proxyEncryptInfo: t3, apiCheck: n2, id: r3, ...i3 }) {
    if (n2 && r3) return u2(r3);
    let a3 = { loading: !0, checkStatus: Y.failure }, o3 = m(i3), s2 = typeof i3.lastCountry == "string" ? i3.lastCountry.trim() : "", c3 = typeof i3.beforeProxyInfo?.beforeCountry == "string" ? i3.beforeProxyInfo.beforeCountry.trim() : "", l3 = s2 || c3, d3 = i3.proxyType ?? i3.buyProxyType;
    if (e3 && t3) {
      let e4 = await ne(t3);
      Object.assign(o3, e4);
    }
    let f2 = String(o3.proxyCategory || o3.protocol || "").trim();
    if (f2 && f2.toLowerCase() !== "noproxy" && !ws({ host: o3.host, port: o3.port })) return { loading: !1, checkStatus: Y.failure, error: Me("\u4EE3\u7406 IP \u68C0\u6D4B\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u76F8\u5173\u914D\u7F6E\u3002"), lastIp: "", lastCity: "", lastCountry: "", timezone: "", checkTime: wt(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH:mm:ss") };
    o3.dirId ||= Math.random().toString(36).slice(2);
    try {
      let e4 = await globalThis.electronAPI.send("proxy:detect", o3);
      a3.checkStatus = e4.ip ? Y.success : Y.failure, a3.lastIp = e4.ip ?? "", a3.lastCity = e4.city ?? "", a3.lastCountry = e4.country_code ?? "", a3.timezone = e4.timezone ?? "";
    } catch (e4) {
      a3.error = e4, a3.checkStatus = Y.failure, a3.systemError = gs(e4), a3.lastIp = "", a3.lastCity = "", a3.lastCountry = "", a3.timezone = "";
    } finally {
      a3.checkTime = wt(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH:mm:ss"), a3.loading = !1, o3.dirId;
    }
    return l3 && a3.checkStatus === Y.failure && !a3.systemError && !ps(d3) && (a3.preDetectLastCountry = l3), { ...a3 };
  }
  function p2(e3, r3) {
    let i3 = (Array.isArray(e3) ? e3 : [e3]).filter(Boolean), a3 = _s(i3), o3 = ys(i3), c3 = a3 ? { life: 8e3 } : void 0;
    if (i3.length === 1) {
      let e4 = i3[0], l3 = It(s()), u3 = e4.proxyType === Ve.buy ? e4.error : l3.testFailedCheckConfig, [d3, f2] = e4.checkStatus === Y.failure ? [-1, h2(u3, { ...r3, guide: a3, preferredCountry: o3 })] : [0, Me(`\u4F4D\u7F6E: {location}
IP: {ip}
\u65F6\u533A: {timezone}`, { location: `${e4.lastCountry}${n("/", e4.lastCity)}`, ip: e4.lastIp, timezone: e4.timezone })];
      t2(d3, f2, c3);
    } else {
      let e4 = i3.filter((e5) => e5.checkStatus === Y.success), n2 = i3.filter((e5) => e5.checkStatus === Y.failure), s2 = Me("{success} \u6761\u6210\u529F\uFF0C{error} \u6761\u5931\u8D25", { success: e4.length, error: n2.length });
      t2(e4.length === 0 ? -1 : 0, h2(s2, { ...r3, guide: a3, preferredCountry: o3 }), c3);
    }
  }
  function h2(e3, t3) {
    let { reCheck: n2, onBuy: r3, guide: a3, preferredCountry: o3 } = t3 ?? {}, s2 = a3 === "ad", c3 = a3 === "support", l3 = a3 === "support" ? e3.replace(/[。.!！?？]+$/u, "") : e3;
    return q("div", { class: "w-full flex flex-col gap-3" }, [q("div", { class: `flex ${c3 ? "flex-col gap-2" : "items-center"} ${s2 && i2.isZh ? "whitespace-nowrap" : ""}` }, [q("div", { class: `${s2 ? "inline-flex" : ""}` }, [q("span", null, [l3]), c3 && q(z, null, [q("span", null, [me("\uFF0C")]), q("span", { class: "cursor-pointer text-[#11A3FD] underline [text-decoration-skip-ink:none] [text-underline-position:from-font]", onClick: (e4) => {
      e4.stopPropagation(), globalThis.showLiveChat?.();
    } }, [Me("\u8054\u7CFB\u6280\u672F\u652F\u6301")])])]), n2 && q(Q, { class: s2 ? "ml-1" : "ml-auto", text: !0, size: "xxs", label: Me("\u91CD\u65B0\u68C0\u6D4B"), onClick: n2 }, null)]), s2 && q(Rs, { onBuy: () => {
      r3 ? r3() : g2(o3);
    } }, null)]);
  }
  async function g2(n2) {
    try {
      let i3 = await r2({ entryType: Ue.Immediate, ...n2 ? { preferredCountry: n2 } : {} }), a3 = s();
      a3 && t2(0, Me("\u8BBE\u5907\u5DF2\u8D2D\u4E70\u6210\u529F\uFF0C\u6B63\u5728\u4E3A\u60A8\u914D\u7F6E\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u3002\u82E5\u957F\u65F6\u95F4\u672A\u52A0\u8F7D\u8BBE\u5907\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u6216\u8054\u7CFB\u6280\u672F\u652F\u6301\u3002")), Je.emit("updateShopList", i3?.orderNo);
      let o3 = a3 ? "ecommerce-device-list" : "agent-list";
      await e2.replace({ name: o3, query: o3 === "agent-list" ? { name: "shop", orderNo: i3?.orderNo } : { orderNo: i3?.orderNo } });
    } catch {
    }
  }
  async function _2(e3) {
    if (!a2) return;
    let { tasks: t3, tasksCompleted: n2, showConcurrentTaskTopBar: r3 = !1 } = e3;
    if (l2.value) throw Error("\u6D4B\u901F\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u5019");
    let i3 = new AbortController();
    c2.value = i3;
    try {
      r3 && (a2.show({ total: t3.length }), l2.value = !0);
      let e4 = await f(t3, 5, { signal: i3.signal, onProgress: ({ completed: e5, total: t4 }) => {
        !o2.value && r3 && a2.updateProgress({ completed: e5, total: t4 });
      } });
      await n2?.(e4, o2.value);
    } finally {
      r3 && a2.close(), l2.value = !1, c2.value === i3 && (c2.value = null);
    }
  }
  return { testProxy: d2, batchTestShowToast: p2, concurrentProxyTest: _2 };
}
function Bs() {
  return { downloadProxy: async (options) => {
    await globalThis.electronAPI.send("proxy:export", { ids: options.items.map((item) => item.id) }), options.confirm?.();
  } };
}
export {_a as C,Nr as E,tr as O,ha as _,ws as a,Yi as b,Ss as c,oa as g,da as h,bs as l,Ma as m,Bs as n,Cs as o,Ns as r,Ts as s,zs as t,xs as u,fa as v,ga as x,Zi as y};
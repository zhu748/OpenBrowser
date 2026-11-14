import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {o as e} from "./rolldown-runtime-BCiCTKAo.js";
import {Fr as t,h as r,mr as i,nn as a,o,r as s,sn as ee,v as c,xr as l} from "./utils-BIWenCnY.js";
import {C as u,D as d,Et as f,L as te,R as m,St as h,V as g,W as _,_t as v,at as ne,bt as y,en as re,f as x,h as S,in as w,jt as T,lt as E,m as D,p as O,st as ie,ut as ae,x as A} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as j} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as se} from "./preload-helper-BLdHbfdN.js";
import {a as le,n as ue} from "./agent-BmSFI9WH.js";
import {i as de} from "./permission-DOhNJfB3.js";
import {i as M,l as fe,m as N,n as P,o as pe,s as F} from "./proxy-D7e36h-l.js";
import {b as me,i as he,y as ge} from "./rich-html-link-VdBpR3Cm.js";
import {c as _e,s as I,t as ve} from "./ry-table-do6kugym.js";
import {Z as ye} from "./basecomponent-ClhuVxJN.js";
import {t as L} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as be} from "./useconfirm-CV4GTWBW.js";
import {t as xe} from "./tooltip-BYYKWrvu.js";
import {t as Ce} from "./rx-button-DyzuUt-V.js";
import {A as we} from "./hook-CnJE4hRq.js";
import {t as De} from "./useDialog-BC-nc8J-.js";
import {t as Oe} from "./divider-BXJIHZjP.js";
import {t as ke} from "./rx-toggle-switch-BI8eb18U.js";
import {t as Ae} from "./custom-empty-CChX4pJt.js";
import {t as je} from "./id-Bjy_bMW8.js";
import {O as Me,g as Ne,h as Pe,m as Fe,n as Ie,r as Le,s as Re,t as ze,y as Be} from "./hooks-Jw3GridD.js";
import {t as Ve} from "./simplePopup-D6H7ykCr.js";
import {a as He,i as Ue,o as We,t as Ge} from "./useProxyFormDrawer-r-7UykRS.js";
import {a as Ke} from "./quick-CZrtqSCy.js";
import {a as qe,i as Ye,n as Ze,o as Qe,r as $e,s as et,t as tt} from "./operation-zwm3okqF.js";
import {t as nt} from "./custom-new-empty-CLCRgYs2.js";
import {t as rt} from "./useProxyModuleCreate-DnWsQ0mq.js";
import {t as it} from "./remark-cell-DMyo1A0X.js";
import {a as at,i as ot,n as st,o as ct,r as lt,s as R} from "./simple-zBOi42-i.js";
import {t as dt} from "./proxy-filter-Ct5F0LvB.js";
import {t as ft} from "./profile-select-Cn2Zq-u9.js";
import {r as pt} from "./relatedPhones-BgFrJS53.js";
import {n as mt,t as ht} from "./useProxyFilter-A8Qveof-.js";
var jt = { render: () => null };
var Mt = e(t(), 1);
var Nt = { class: "flex flex-col w-full h-full" };
var Pt = { class: "flex flex-1 overflow-hidden" };
var Ft = { class: "w-full flex gap-1.5 items-start justify-between" };
var It = { class: "flex items-center gap-2" };
var Lt = { class: "relative" };
var Rt = { class: "flex items-center gap-2" };
var zt = { class: "flex gap-3" };
var Bt = { class: "flex items-center gap-2.5" };
var Vt = { key: 0, class: "flex items-center gap-1.5" };
var Ht = { key: 0 };
var Ut = { class: "days" };
var Wt = { key: 1 };
var Gt = { key: 1 };
var Kt = { key: 0, class: "flex items-center gap-2" };
var qt = { class: "tag" };
var Jt = { key: 1 };
var Yt = L(u({ __name: "index", setup(e2) {
  let t2 = ge(), n2 = me(), u2 = be(), p2 = We(), { showProxyFormDrawer: b2 } = Ge(p2), { updateProxyModules: C2 } = rt(), [k2] = De(), { confirmEnableAutoRenew: oe2 } = we(), [ce2, L2] = ue(), { userConfig: Se2 } = le(c()), { mixpanelTrack: Te2 } = c(), { getOfficialWebsite: Ee2 } = ee(), z = ct(), { columns: B } = et({ storageKey: z.columnStorageKey, relatedColumnTitle: z.relatedColumn }), { testProxy: gt, batchTestShowToast: _t, concurrentProxyTest: V } = ze(), { showSimpleDialog: vt } = Ve(), { buyProxy: H, downloadProxy: yt, renewProxy: bt, upgradeProxy: xt, showProxyDownloadKycBlockModal: St } = Ie(), { isProviderJump: Ct, jumpToProvider: wt } = Me();
  Le(() => {
    H();
  });
  let { check: U } = a(), Tt = tt(), W = ne("shoptable"), G = h(), Et = h(!1), K = h(), q = h(), Dt = h(), J = h(!1), Y = h({}), Ot = y({ value: P.List, trueValue: P.Available, falseValue: P.List }), X = mt({ multiple: !0, onApply: () => $(), initialValues: t2.query.expireStatus ? { proxyExpireStatus: Number(t2.query.expireStatus) } : void 0, filterGroups: z.isCloudPhone ? ht().map((e3) => e3.key === "proxyBindStatus" ? { ...e3, label: z.relatedColumn } : e3) : void 0 }), kt = i({ intervalMs: 3e5, checkOnce: async () => !Se2.value.autoDetectProxy || (await un(!0), !1) });
  ie(() => t2.query._t, () => {
    if (t2.query._t) {
      if (t2.query.expireStatus) {
        let e3 = Number(t2.query.expireStatus);
        if (X.applied.value.proxyExpireStatus !== e3) {
          X.setApplied({ proxyExpireStatus: e3 }), $();
          return;
        }
      }
      $();
    }
  }), te(async () => {
    kt.check(), G.value = await Ze(), ln(t2.query.orderNo);
  }), g(() => {
    Ne();
  }), he("updateShopList", (e3) => {
    $(), ln(e3);
  }), m(() => {
    kt.stop(), clearTimeout(Dt.value);
  });
  let Z = h({}), At = 0;
  function Q(e3) {
    let t3 = je(e3);
    return t3 ? Z.value[t3] ?? [] : [];
  }
  function Yt2(e3) {
    if (!R()) return Qe(e3);
    let t3 = at(e3);
    if (t3.length) return t3;
    let n3 = Q(e3.id).map((e4) => e4.name?.trim() || e4.serialNo?.trim() || "").filter(Boolean);
    if (n3.length) return n3;
    let r2 = lt(e3);
    return r2 ? [$t("{count} \u4E2A", { count: r2 })] : [];
  }
  function Xt(e3) {
    return lt(e3) ?? Q(e3.id).length;
  }
  function Zt(e3) {
    let t3 = ot(e3);
    return t3.length ? t3 : Q(e3.id).map((e4) => String(e4.id || "").trim()).filter(Boolean);
  }
  async function Qt(e3) {
    let t3 = e3.filter(st), n3 = ++At;
    if (!t3.length) {
      Z.value = {};
      return;
    }
    let r2 = await pt(t3.map((e4) => e4.id));
    if (n3 !== At) return;
    let i2 = {};
    for (let [e4, t4] of r2) i2[e4] = t4;
    Z.value = i2;
  }
  async function en(e3) {
    let t3 = await qe({ ...X.getApiParams(), type: Ot.value, ...e3 }), n3 = t3.data?.rows || [];
    return K.value = n3.filter((e4) => Re(e4)), R() && await Qt(n3), t3;
  }
  async function tn(e3, t3) {
    let n3 = [].concat(t3);
    switch (e3.name) {
      case "edit":
        rn(t3);
        break;
      case "refresh":
        on(t3);
        break;
      case "delete":
        await an(n3);
        break;
      case "test":
        V(pn(n3, { operateName: e3.name }));
        break;
      case "download":
        await gn(n3);
        break;
      case "qrcode":
        if (Pe(t3) || !Be(t3)) break;
        await Ne() || St();
        break;
      case "renew":
        mn(n3);
        break;
      case "upgrade":
        hn(n3);
        break;
      case "remark":
        vn(t3);
    }
  }
  function nn() {
    Te2("proxy_create_click"), n2.push({ name: "agent-create" });
  }
  function rn(e3) {
    b2({ title: $t("\u7F16\u8F91\u4EE3\u7406 IP"), data: e3, showRemark: !0, mode: "proxy", onConfirm: async (e4) => {
      if (!await C2({ proxyList: [e4] })) return !1;
      $();
    } });
  }
  async function an(e3) {
    return new Promise((t3) => {
      u2.require({ header: $t("\u5220\u9664\u4EE3\u7406 IP"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u6240\u9009\u4EE3\u7406 IP \u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
        let { code: n3, msg: i2 } = await r.proxy.userDelProxyModuleV2Create({ ids: e3.map((e4) => e4.id) });
        L2(n3, i2), n3 === 0 && ($(), t3(!0));
      }, reject: () => t3(!1), onHide: () => t3(!1) });
    });
  }
  async function on(e3) {
    let t3 = f(e3), n3 = R() ? Xt(t3) : (t3.bindList ?? []).length;
    if (n3) u2.require({ header: $t("\u5237\u65B0\u4EE3\u7406 IP"), message: z.refreshConfirm(n3), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: async () => {
      let e4 = await _e(t3, "refresh", () => globalThis.electronAPI.send("proxy:refreshUrl", t3.refreshUrl));
      ce2(e4 ? 0 : -1, t3.refreshUrl);
    } });
    else {
      let e4 = await _e(t3, "refresh", () => globalThis.electronAPI.send("proxy:refreshUrl", t3.refreshUrl));
      ce2(e4 ? 0 : -1, t3.refreshUrl);
    }
  }
  function sn(e3) {
    let { key: t3, value: n3 } = e3 || {};
    $({ queryKey: n3 && (t3 || "fuzzy"), queryValue: n3 }, !0);
  }
  function cn(e3) {
    e3 && Ct(e3) ? wt(e3) : H({ ...e3 ? f(e3) : {}, ...R() ? { cancelRedirect: !1 } : {} }).then(async (e4) => {
      if ($(), ln(e4?.orderNo), R()) {
        let { useProxyStore: e5 } = await se(async () => {
          let { useProxyStore: e6 } = await import("./proxy-BZs_g4bS.js");
          return { useProxyStore: e6 };
        }, []);
        await e5().fetchPickerList();
      }
    });
  }
  function ln(e3) {
    e3 && (q.value = e3, Dt.value = setTimeout(() => {
      q.value = "";
      let { orderNo: e4, ...r2 } = t2.query;
      n2.replace({ name: "agent-list", query: r2 });
    }, 3e3));
  }
  async function un(e3 = !1) {
    if (U("Proxy_List_speed_test")) {
      if (!K.value?.length) !e3 && L2(-1, $t("\u6682\u65E0\u4EE3\u7406 IP"));
      else if (!J.value) {
        J.value = !0;
        try {
          await V(pn(K.value, { operateName: "test", silent: e3 })), dn();
        } finally {
          J.value = !1;
        }
      }
    }
  }
  function dn() {
    let e3 = W.value?.getDataList(), t3 = e3?.length ? e3 : K.value;
    if (!t3?.length) return;
    let n3 = (e4) => Re(e4) && (Y.value[e4.id] ?? e4.checkStatus) === pe.failure, r2 = [], i2 = [];
    for (let e4 of t3) n3(e4) ? r2.push(e4) : i2.push(e4);
    if (!r2.length) return;
    let a2 = [...r2, ...i2];
    if (W.value?.updateDataList(a2), K.value?.length) {
      let e4 = new Map(a2.map((e5, t4) => [e5.id, t4]));
      K.value = [...K.value].sort((t4, n4) => (e4.get(t4.id) ?? 0) - (e4.get(n4.id) ?? 0));
    }
  }
  async function fn(e3, t3) {
    let n3 = new Map(e3.map((e4) => [e4.id, e4])), r2 = t3.flatMap((e4) => {
      let t4 = e4.id == null ? void 0 : n3.get(e4.id), r3 = t4 ? Zt(t4) : [];
      return r3.length ? [{ phoneIds: r3, proxyType: t4?.protocol, proxyServer: t4?.host, proxyPort: t4?.port, lastIp: e4.lastIp, lastCountry: e4.lastCountry, lastCity: e4.lastCity, checkStatus: e4.checkStatus, checkTime: e4.checkTime, timezone: e4.timezone }] : [];
    });
    if (!r2.length) return !0;
    let { persistChecksForBoundPhones: i2 } = await se(async () => {
      let { persistChecksForBoundPhones: e4 } = await import("./persistProxyCheck-GOErCdJb.js");
      return { persistChecksForBoundPhones: e4 };
    }, []);
    return i2(r2);
  }
  function pn(e3, { operateName: t3, silent: n3 }) {
    let i2 = e3.map((e4) => (I(e4, t3, !0), async () => {
      try {
        let t4 = await gt({ ...f(e4), apiCheck: e4.proxyType === N.buy, id: e4.id });
        return Object.assign(e4, t4), Y.value[e4.id] = t4.checkStatus, { ...t4, id: e4.id, proxyType: e4.proxyType };
      } finally {
        I(e4, t3, !1);
      }
    }));
    async function a2(i3, a3) {
      i3.forEach((n4, r2) => {
        n4 === void 0 && I(e3[r2], t3, !1);
      });
      let o2 = i3.filter(Boolean);
      !a3 && !n3 && _t(o2, { reCheck: () => V(pn(e3, { operateName: t3, silent: n3 })) }), R() && !await fn(e3, o2) && !n3 && L2(-1, $t("\u4FDD\u5B58\u4EE3\u7406 IP \u68C0\u6D4B\u7ED3\u679C\u5931\u8D25"));
      let s2 = o2.filter((e4) => e4?.proxyType === N.resource);
      s2.length && (n3 ? r.proxy.userBatchMdfProxyModuleCheckCreate({ proxyList: s2 }) : C2({ proxyList: s2, requestType: de.SpeedTest }));
    }
    return { tasks: i2, tasksCompleted: a2 };
  }
  function mn(e3) {
    bt(e3, () => {
      $();
    });
  }
  function hn(e3) {
    xt(e3, () => {
      $();
    });
  }
  function gn(e3) {
    let { promise: t3, resolve: n3, reject: r2 } = Promise.withResolvers();
    return yt({ items: e3, cancel: r2, confirm: n3 }), t3;
  }
  async function _n(e3) {
    throw Error("\u4ED8\u8D39\u4EE3\u7406\u6D41\u7A0B\u5DF2\u79FB\u9664");
  }
  function vn(e3) {
    U("Proxy_List_notes") && vt({ title: $t("\u4E3A\u6240\u9009\u4EE3\u7406 IP \u6DFB\u52A0\u5907\u6CE8"), inputs: [{ type: "textarea", name: "remark", value: e3.remark, props: { placeholder: $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), rows: 6 } }], onConfirm: async ({ remark: t3 }) => {
      let { code: n3, msg: i2 } = await r.proxy.userMdfProxyModuleCreate({ id: e3.id, proxyRemark: t3 });
      L2(n3, i2), n3 === 0 && $();
    } });
  }
  function yn() {
    Y.value = {};
  }
  function $(e3 = {}, t3 = !1) {
    let n3 = { ...e3, ...X.getApiParams(), ...s(o(G.value)) };
    Et.value = !l(n3), W.value?.refresh(n3, t3);
  }
  async function bn(e3) {
    let t3 = new Date(e3.expireDate).getTime();
    return t3 > Date.now() && t3 - Date.now() < 36e5 && e3.autoRenew === M.Enabled ? (L2(-1, $t("\u5230\u671F\u524D {hour} \u5C0F\u65F6\u65E0\u6CD5\u4FEE\u6539\u81EA\u52A8\u7EED\u8D39\u5F00\u5173\u3002", { hour: 1 }), { severity: "warn", summary: $t("\u64CD\u4F5C\u5931\u8D25"), life: 5e3 }), !1) : e3.autoRenew !== M.Enabled && !await oe2() ? !1 : xn(e3);
  }
  async function xn(e3) {
    throw Error("\u4ED8\u8D39\u4EE3\u7406\u6D41\u7A0B\u5DF2\u79FB\u9664");
  }
  function Sn(e3) {
    return { "row-success": e3.orderNo === q.value };
  }
  function Cn(e3) {
    return !!e3.lastIp && e3.proxyExpireStatus !== F.expired;
  }
  function wn(e3) {
    Cn(e3) && window.open(Ee2(`/whoer?ip=${e3.lastIp}`), "_blank");
  }
  async function Tn(e3) {
    if (!e3.id) return;
    let t3 = (await se(async () => {
      let { default: e4 } = await import("./phone-select-DbsQ1A1T.js");
      return { default: e4 };
    }, [])).default;
    p2.showDrawer({ title: z.selectTitle, slots: { container: () => d(t3, { proxyId: e3.id, onClose: () => p2.hideDrawer(), onConfirm: () => {
      p2.hideDrawer(), $();
    } }) } });
  }
  function En(e3) {
    R() ? Tn(e3) : p2.showDrawer({ title: z.selectTitle, slots: { container: () => d(ft, { linkedWindowSortNums: Ke(e3.bindList), cacheKey: "agent-profile-select", onClose: () => p2.hideDrawer(), onConfirm: async (t3) => {
      if (!e3.id) return;
      let { code: n3, msg: i2 } = await r.proxy.userMdfProxyBindWindowCreate({ proxyId: e3.id, windowIds: t3.map((e4) => e4.id) });
      L2(n3, i2), n3 === 0 && $();
    } }) } });
  }
  return (e3, t3) => {
    let n3 = Ce, r2 = Oe, i2 = Ae, a2 = nt, o2 = ye, s2 = ke, ee2 = ve, c2 = xe;
    return _(), S("div", Nt, [A(jt, { "on-buy-proxy": cn }), x("div", Pt, [A(ee2, { ref: "shoptable", columns: T(B), "onUpdate:columns": t3[4] ||= (e4) => v(B) ? B.value = e4 : null, lazy: "", "cache-key": T(z).tableCacheKey, "selection-mode": "multiple", class: "agent-shop-table", "table-request": en, "table-operation": T(Ye), "removable-sort": "", "table-sort": T($e), "row-class": Sn, "operation-handler": tn, "before-refresh": yn, "virtual-scroller-options": { itemSize: 60 } }, { "filter-after": E(() => [x("div", Ft, [x("div", It, [x("div", Lt, [localCommercialComment("", !0), t3[5] ||= x("div", { class: "new-dot" }, null, -1)]), T(U)("Proxy_List_add") ? (_(), O(n3, { key: 0, size: "xxs", icon: "base/rx_ic_plus", variant: "outlined", label: e3.$t("\u6DFB\u52A0"), onClick: j(nn, ["stop"]) }, null, 8, ["label"])) : D("", !0), A(r2, { layout: "vertical", class: "!ml-0 !mr-0 h-4" }), A(dt, { filter: T(X) }, null, 8, ["filter"])]), x("div", Rt, [A(He, { options: T(Tt), search: sn, clear: sn }, null, 8, ["options"]), A(r2, { layout: "vertical", class: "!ml-0 !mr-0 h-4" }), T(U)("Proxy_List_speed_test") ? (_(), O(n3, { key: 0, size: "xxs", variant: "outlined", severity: "secondary", icon: "base/rx_ic_speed_test", label: e3.$t("\u6D4B\u8BD5\u5168\u90E8\u4EE3\u7406 IP"), loading: T(J), onClick: t3[1] ||= j((e4) => un(), ["stop"]) }, null, 8, ["label", "loading"])) : D("", !0), A(r2, { layout: "vertical", class: "!ml-0 !mr-0 h-4" })])])]), "table-empty": E(() => [T(Et) ? (_(), O(i2, { key: 0, icon: "rx_illustration_filter.svg", title: e3.$t("\u6682\u65E0\u67E5\u8BE2\u7ED3\u679C"), desc: e3.$t("\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u7ED3\u679C\uFF0C\u8BF7\u5C1D\u8BD5\u66F4\u6362\u5176\u4ED6\u7B5B\u9009\u6761\u4EF6\u3002") }, null, 8, ["title", "desc"])) : (_(), O(a2, { key: 1, icon: "base/rx_ic_internet", img: "empty-proxies.png", title: e3.$t("\u6682\u65E0\u4EE3\u7406 IP"), desc: T(z).emptyBindDesc }, { extra: E(() => [x("div", zt, [localCommercialComment("", !0), T(U)("Proxy_List_add") ? (_(), O(n3, { key: 0, outlined: "", severity: "secondary", size: "xs", icon: "base/rx_ic_plus", label: e3.$t("\u6DFB\u52A0"), onClick: j(nn, ["stop"]) }, null, 8, ["label"])) : D("", !0)])]), _: 1 }, 8, ["title", "desc"]))]), outbound: E(({ data: t4 }) => [x("div", Bt, [ae(A(Fe, { class: re(Cn(t4) ? "cursor-pointer" : "cursor-default"), country: t4.lastCountry, city: t4.lastCity, "last-ip": t4.lastIp, time: t4.checkTime, status: T(Y)[t4.id], "badge-desc": t4.badgeTypeDesc, "is-loading": t4.loadingOperationMap?.test, "expire-status": t4.proxyExpireStatus, onClick: j((e4) => wn(t4), ["stop"]) }, null, 8, ["class", "country", "city", "last-ip", "time", "status", "badge-desc", "is-loading", "expire-status", "onClick"]), [[c2, { value: Cn(t4) ? e3.$t("\u70B9\u51FB\u67E5\u770B IP \u5730\u5740\u8BE6\u60C5") : "" }, void 0, { top: !0 }]]), t4.proxyType === T(N).buy && t4.checkStatus === T(pe).failure && t4.orderStatus === T(fe).done && t4.proxyExpireStatus !== T(F).expired ? (_(), S("div", Vt, [A(o2, { name: "base/rx_ic_info", color: "var(--colors-icon-icon-error)" }), A(n3, { outlined: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_fix", label: e3.$t("\u5E2E\u52A9"), onClick: j((e4) => _n(t4), ["stop"]) }, null, 8, ["label", "onClick"])])) : D("", !0)])]), price: E(({ data: t4 }) => [t4.proxyType === T(N).buy && t4.canRenew ? (_(), S("div", Ht, [x("span", null, w(T(Mt.default)(t4.proxyProviderDiscountPrice).format()), 1), x("span", Ut, " / " + w(e3.$t("{day} \u5929", { day: 30 })), 1)])) : (_(), S("div", Wt, " -- "))]), renew: E(({ data: e4 }) => [e4.proxyType === T(N).buy && e4.canRenew ? (_(), S("div", { key: 0, class: "scale-80", onClick: t3[3] ||= j(() => {
    }, ["stop"]) }, [A(s2, { modelValue: e4.autoRenew, "onUpdate:modelValue": (t4) => e4.autoRenew = t4, disabled: e4.orderStatus !== T(fe).done || e4.proxyExpireStatus === T(F).expired, "true-value": 1, "false-value": 0, "before-change": () => bn(e4) }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled", "before-change"])])) : (_(), S("div", Gt, " -- "))]), remark: E(({ data: e4, column: { _cache: t4 } }) => [A(it, { remark: e4.remark, extend: t4.extend, onClick: j((t5) => tn({ name: "remark" }, e4), ["stop"]) }, null, 8, ["remark", "extend", "onClick"])]), providerType: E(({ data: e4 }) => [e4.proxyType === T(N).buy ? (_(), S("div", Kt, [x("div", qt, w(e4.providerType), 1)])) : (_(), S("div", Jt, " -- "))]), bindList: E(({ data: e4 }) => [A(Ue, { list: Yt2(e4), "show-add": T(U)("Profiles_select_proxy"), "add-tooltip": T(z).selectTooltip, onAdd: (t4) => En(e4) }, null, 8, ["list", "show-add", "add-tooltip", "onAdd"])]), _: 1 }, 8, ["columns", "cache-key", "table-operation", "table-sort"])])]);
  };
} }), [["__scopeId", "data-v-74570167"]]);
export {Yt as t};
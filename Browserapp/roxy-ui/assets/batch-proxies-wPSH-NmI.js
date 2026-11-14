import {Tr as e,ar as t,h as n,kr as r,m as i,v as a} from "./utils-BIWenCnY.js";
import {C as o,Et as s,L as c,P as l,St as u,W as d,_t as f,b as p,bt as ee,d as m,f as h,h as g,i as _,in as v,jt as y,lt as b,m as x,p as S,q as C,rn as te,st as ne,ut as re,x as w} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as T} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as ie,n as ae} from "./agent-BmSFI9WH.js";
import {m as oe,o as E,r as D} from "./proxy-D7e36h-l.js";
import {n as O} from "./proxy-create-mode-BCcLAAf5.js";
import {c as se,s as k} from "./ry-table-do6kugym.js";
import {Z as ce} from "./basecomponent-ClhuVxJN.js";
import {t as A} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as le} from "./useconfirm-CV4GTWBW.js";
import {t as ue} from "./tooltip-BYYKWrvu.js";
import {t as de} from "./rx-button-DyzuUt-V.js";
import {t as fe} from "./rx-checkbox-BrC0MzoD.js";
import {t as j} from "./m-input-select-C8pih1gY.js";
import {t as pe} from "./rx-alert-A_y5uvgP.js";
import {t as me} from "./custom-empty-CChX4pJt.js";
import {m as he,t as ge} from "./hooks-Jw3GridD.js";
import {n as _e,t as ve} from "./check-channel-BUSbubqx.js";
import {n as ye} from "./single-proxies-C7CAMkyq.js";
import {t as be} from "./table-BJcS2I0Z.js";
import {n as xe} from "./useProxyModuleCreate-DnWsQ0mq.js";
import {n as Se,t as Ce} from "./parse-textarea-Dia3ayaD.js";
var M = ["innerHTML"];
var N = { class: "help" };
var P = { key: 0 };
var F = { key: 0, class: "help" };
var I = "fe80::1:9dc0:f1ab:90a3";
var we = o({ __name: "example", props: { ipType: {} }, setup(e2) {
  let t2 = e2, n2 = O(), r2 = m(() => n2.value.mode === "device");
  function i2(e3) {
    let t3 = r2.value ? $t("\u7528\u6237\u540D:\u5BC6\u7801") : $t("\u4EE3\u7406 IP \u7528\u6237\u540D:\u4EE3\u7406 IP \u5BC6\u7801");
    return e3.replace("{username}:{password}", t3);
  }
  function a2(e3) {
    return (r2.value ? e3.replace("[RefreshURL]", "") : e3.replace("[RefreshURL]", `<span class="text-green whitespace-nowrap">[${$t("\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL")}]</span>`)).replace("{Notes}", `<span class="text-blue whitespace-nowrap">{${$t("\u5907\u6CE8")}}</span>`);
  }
  function o2(e3) {
    return i2(e3.replace("[ipv6]", `<span class="text-orange">[${I}]</span>`));
  }
  let s2 = m(() => {
    let e3 = r2.value ? "" : "[RefreshURL]", t3 = `192.168.0.1:8000:{username}:{password}${e3}{Notes}`, n3 = `[ipv6]:8000:{username}:{password}${e3}{Notes}`, s3 = `{username}:{password}@192.168.0.1:8000${e3}{Notes}`, c3 = `{username}:{password}@[ipv6]:8000${e3}{Notes}`, l2 = r2.value ? "{Notes}" : "[RefreshURL]{Notes}";
    return [{ type: D.IPV4, content: a2("192.168.0.1:8000{Notes}") }, { type: D.IPV4, content: i2(t3).replace(l2, "") }, { type: D.IPV4, content: a2(i2(t3)) }, { type: D.IPV6, content: a2(o2(n3)) }, { type: D.IPV4, content: i2(s3).replace(l2, "") }, { type: D.IPV4, content: a2(i2(s3)) }, { type: D.IPV6, content: a2(o2(c3)) }];
  }), c2 = m(() => t2.ipType === D.IPV4 ? s2.value.filter((e3) => e3.type === D.IPV4) : s2.value);
  return (t3, i3) => (d(), g("div", l(t3.$attrs, { class: "break-keep-all example" }), [h("div", null, v(y(r2) ? t3.$t("\u793A\u4F8B\uFF08\u5907\u6CE8\u4E3A\u9009\u586B\uFF09") : t3.$t("\u793A\u4F8B\uFF08\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL \u4E0E\u5907\u6CE8\u4E3A\u9009\u586B\uFF09")) + ": ", 1), (d(!0), g(_, null, C(y(c2), (e3, t4) => (d(), g("div", { key: t4, innerHTML: e3.content }, null, 8, M))), 128)), i3[0] ||= h("br", null, null, -1), h("div", N, [e2.ipType === y(D).IPV6 ? (d(), g("span", P, "1. ")) : x("", !0), p(v(y(n2).batchHelpLine), 1)]), e2.ipType === y(D).IPV6 ? (d(), g("div", F, v(y(r2) ? t3.$t("2. IPV6 \u7684\u4E3B\u673A\u9700\u586B\u5199\u5728 [ ] \u5185\uFF1B") : t3.$t("2. IPV6 \u7684\u4EE3\u7406 IP \u4E3B\u673A\u9700\u586B\u5199\u5728 [ ] \u5185\uFF1B")), 1)) : x("", !0)], 16));
} });
var Te = { class: "flex-1 overflow-auto flex-col proxies-content" };
var Ee = { class: "parse-input w-full" };
var De = { class: "flex flex-col gap-1.5 xl:w-60%" };
var Oe = { class: "panel-title flex justify-between items-start xl:items-center flex-col xl:flex-row gap-1" };
var ke = { class: "flex gap-1.5" };
var Ae = { class: "information min-w-423px" };
var je = { class: "flex justify-between information-actions" };
var Me = { class: "flex items-center gap-2.5" };
var Ne = { class: "flex items-center gap-1.5" };
var Pe = { for: "wrap", class: "text-3 select-none cursor-pointer text-[var(--colors-text-text-secondary)]" };
var Fe = { class: "flex flex-col gap-1.5 w-40%" };
var Ie = { class: "panel-title h-30px flex items-center" };
var Le = { class: "rules flex-1 min-w-335px" };
var Re = { class: "flex flex-col flex-1" };
var ze = { class: "flex items-center justify-between pt-6 pb-3 table-toolbar" };
var Be = { class: "panel-title" };
var Ve = { class: "flex gap-2" };
var He = { class: "parse-result-message" };
var Ue = { key: 0, class: "h-[10px] w-full bg-[var(--colors-background-bg-page)]" };
var We = { key: 2, class: "h-[10px] w-full bg-[var(--colors-background-bg-page)]" };
var Ge = { class: "flex-1 overflow-x-auto" };
var Ke = { key: 0, class: "text-3 font-500 leading-4 tt-secondary" };
var qe = { key: 2, class: "text-3 font-500 leading-4 tt-warning" };
var Je = { key: 3, class: "text-3 font-500 leading-4 tt-success" };
var Ye = { class: "flex justify-end footer" };
var L = A(o({ __name: "batch-proxies", props: { onConfirm: { type: Function }, showAdvertise: { type: Boolean, default: !1 } }, emits: ["buy"], setup(o2, { emit: C2 }) {
  let A2 = C2, M2 = O(), N2 = m(() => M2.value.mode === "device"), P2 = le(), { getUserConfig: F2 } = a(), { userConfig: I2 } = ie(a()), { testProxy: Xe, batchTestShowToast: Ze } = ge(), [Qe, R] = ae(), z = u(""), B = u([]), V = u(!0), H = u(!1), U = u(!1), W = u(0), G = u({}), K = u(!1), q = /* @__PURE__ */ new Map(), J = !1, Y = u(), X = u(), $e = u(), Z = u(), et = m(() => xe(M2.value)), Q = ee({ value: void 0, props: { name: "checkChannel", options: void 0, filter: !1, size: "xxs", icon: "base/rx_ic_network", iconColor: "var(--colors-icon-icon-secondary)" }, onChange() {
    B.value.forEach((e2) => {
      e2.checkChannel = Q.value?.value, e2.checkChannelValue = Q.value?.label;
    });
  } }), tt = m(() => !(B.value.length && B.value.some((e2) => e2.checkStatus === E.failure))), nt = m(() => K.value || B.value.some((e2) => e2.loadingOperationMap?.test || e2.historyChecking)), rt = m(() => !B.value?.length || nt.value), $ = m(() => B.value.filter((e2) => e2.hasImportRecord).length), it = m(() => $t("\u6709 {count} \u6761\u8BBE\u5907\u547D\u4E2D\u5E73\u53F0\u534A\u5E74\u5185\u5386\u53F2\u5E93\uFF0C\u7EE7\u7EED\u5BFC\u5165\u53EF\u80FD\u9020\u6210\u8D26\u53F7\u5173\u8054\u98CE\u9669\u3002", { count: $.value })), at = m(() => {
    let e2 = 0;
    return H.value && (e2 += 52), U.value && (e2 += 52), H.value && U.value && (e2 += 10), `${e2}px`;
  }), ot = m(() => {
    let e2 = B.value.map((e3) => ({ ...e3, checkStatus: e3.checkStatus ?? E.failure }));
    if (!e2.some((e3) => e3._missIndex)) return "";
    let { miss: t2 } = e2.reduce((e3, t3) => (t3._missIndex ? e3.miss.push(t3) : e3.success.push(t3), e3), { success: [], miss: [] });
    return M2.value.formatMissSaveMessage(t2.map((e3) => e3._missIndex).join(", "));
  });
  ne(Z, async (e2) => {
    let t2 = await i(), n2 = e2 === D.IPV6 ? "ipv6-query-channels" : "checkChannel", r2 = ve(t2[n2]);
    Q.props.options = r2, Q.value = r2.find((e3) => e3.value === I2.value.ipChecker) || r2[0];
  }), c(async () => {
    let [e2, t2] = await Promise.all([i(), F2()]), n2 = ve(e2.checkChannel);
    Q.value = n2.find((e3) => e3.value === t2.ipChecker) || n2[0], Q.props.options = n2, Y.value = e2.protocol, X.value = e2.protocol[0].value, $e.value = e2.ipType, Z.value = e2.ipType[0].value;
  });
  async function st() {
    let t2 = z.value.split(`
`).map((e2) => e2.replace(/\s/g, "").replace(/：/g, ":")).filter(Boolean);
    if (!t2.length) R(-1, M2.value.inputRequired);
    else if (B.value = (V.value ? [...new Set(t2)] : t2).map((t3, n2) => {
      let { protocol: r2, host: i2, port: a2, proxyUserName: o3, proxyPassword: s2, refreshUrl: c2, remark: l2 } = e(t3), u2 = r2 || X.value, d2 = [["protocol", u2], ["host", i2], ["port", a2]].filter((e2) => !e2[1]), f2 = i2?.startsWith("[") ? D.IPV6 : Z.value;
      return { checkChannel: Q.value?.value, checkChannelValue: Q.value?.label, ipType: f2, protocol: u2?.toLocaleUpperCase(), host: i2?.replace(/\[|\]/g, ""), port: a2, proxyUserName: o3, proxyPassword: s2, ...N2.value ? {} : { refreshUrl: c2 }, remark: l2, _missField: d2, _missIndex: d2.length ? n2 + 1 : 0, _id: n2 };
    }), W.value = t2.length - B.value.length, H.value = !0, U.value = !1, G.value = {}, q.clear(), J = !1, B.value.forEach((e2) => {
      e2.hasImportRecord = void 0, e2.historyChecking = !1;
    }), !K.value) {
      K.value = !0;
      try {
        await Promise.all([yt(), N2.value ? vt(B.value) : Promise.resolve()]);
      } finally {
        K.value = !1;
      }
    }
  }
  function ct() {
    r(300).then(() => {
      H.value = !1;
    });
  }
  function lt() {
    r(300).then(() => {
      U.value = !1;
    });
  }
  let ut = { header: !1, paginator: !1, actions: "quick" };
  function dt(e2) {
    return !!e2.loadingOperationMap?.test || !!e2.historyChecking;
  }
  function ft(e2) {
    let t2 = e2.row;
    if (!t2) return [];
    let n2 = dt(t2);
    return [...N2.value ? [] : [{ key: "refresh", label: M2.value.refreshAction, icon: "base/rx_ic_refresh", quick: !0, disabled: !t2.refreshUrl, disabledTooltip: $t("\u672A\u914D\u7F6E\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL"), command: () => pt(t2, "refresh") }], { key: "test", label: M2.value.testAction, icon: "base/rx_ic_speed_test", quick: !0, command: () => globalThis.isElectron ? mt(t2, "test") : globalThis.electronAPI.send("proxy:detect", {}) }, { key: "delete", label: $t("\u5220\u9664"), icon: "base/rx_ic_bin_1", quick: !0, disabled: n2, disabledTooltip: n2 ? $t("\u68C0\u6D4B\u4E2D") : void 0, command: () => bt(t2) }];
  }
  async function pt(e2, t2) {
    let n2 = await se(e2, t2, () => globalThis.electronAPI.send("proxy:refreshUrl", e2.refreshUrl));
    Qe(n2 ? 0 : -1, e2.refreshUrl);
  }
  async function mt(e2, n2) {
    let r2 = /* @__PURE__ */ new Map(), i2 = [].concat(e2).map((e3, t2) => {
      k(e3, n2, !0);
      let i3 = async () => {
        let a3 = await Xe({ ...s(e3), protocol: e3.protocol || "HTTP", isDirect: !1 });
        return a3.checkStatus === E.failure && !e3._secondCheck ? (Reflect.set(e3, "_secondCheck", !0), r2.set(t2, i3)) : (Reflect.deleteProperty(e3, "_secondCheck"), Object.assign(e3, a3), G.value[e3._id] = a3.checkStatus, _t(e3), k(e3, n2, !1)), a3;
      };
      return i3;
    }), a2 = await t(i2, 5);
    if (r2.size > 0) {
      let e3 = await t([...r2.values()], 5);
      r2.keys().forEach((t2, n3) => a2[t2] = e3[n3]), r2.clear();
    }
    Ze(a2.filter(Boolean).map((e3) => ({ ...e3, proxyType: e3.proxyType ?? oe.resource })));
  }
  function ht() {
    P2.require({ header: M2.value.clearHeader, message: M2.value.clearMessage, rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: () => {
      B.value = [], H.value = !1, U.value = !1;
    } });
  }
  function gt() {
    U.value = N2.value && $.value > 0;
  }
  function _t(e2) {
    N2.value && !e2._missIndex && e2.host && e2.port && e2.checkStatus !== void 0 && (J ? e2.historyChecking = !0 : (e2.hasImportRecord = q.get(String(e2._id)) ?? !0, e2.historyChecking = !1, gt()));
  }
  async function vt(e2) {
    let t2 = e2.filter((e3) => !e3._missIndex && e3.host && e3.port);
    if (t2.length) {
      q.clear(), J = !0;
      try {
        let { code: e3, data: r2 } = await n.proxy.userBatchCheckProxyImportCreate({ items: t2.map((e4) => ({ tempId: String(e4._id), host: e4.host, port: e4.port, proxyUserName: e4.proxyUserName, proxyPassword: e4.proxyPassword })) });
        e3 !== 0 || !r2.items ? t2.forEach((e4) => q.set(String(e4._id), !0)) : r2.items.forEach((e4) => {
          q.set(e4.tempId, !!e4.hasImportRecord);
        });
      } finally {
        J = !1, t2.forEach((e3) => _t(e3));
      }
    }
  }
  async function yt() {
    if (!B.value?.length) R(-1, M2.value.emptyList);
    else {
      if (!globalThis.isElectron) return globalThis.electronAPI.send("proxy:detect", {});
      await mt(B.value, "test");
    }
  }
  function bt(e2) {
    dt(e2) || (B.value = B.value.filter((t2) => t2._id !== e2._id), delete G.value[e2._id], B.value.length ? $.value === 0 && (U.value = !1) : (H.value = !1, U.value = !1));
  }
  async function xt() {
    if (!K.value) {
      K.value = !0;
      try {
        await yt();
      } finally {
        K.value = !1;
      }
    }
  }
  function St() {
    let e2 = B.value.filter((e3) => e3.checkStatus !== E.failure);
    P2.require({ header: M2.value.deleteFailHeader, message: M2.value.formatDeleteFailMessage(B.value.length - e2.length), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: () => {
      B.value = e2, $.value === 0 && (U.value = !1);
    } });
  }
  async function Ct() {
    if (rt.value) return;
    let e2 = B.value.map((e3) => ({ ...e3, checkStatus: e3.checkStatus ?? E.failure }));
    if (!e2.some((e3) => e3._missIndex)) {
      await o2.onConfirm(e2);
      return;
    }
    let { promise: t2, resolve: n2 } = Promise.withResolvers(), { success: r2, miss: i2 } = e2.reduce((e3, t3) => (t3._missIndex ? e3.miss.push(t3) : e3.success.push(t3), e3), { success: [], miss: [] });
    return P2.require({ header: $t("\u8B66\u544A"), message: M2.value.formatMissConfirmMessage(i2.map((e3) => e3._missIndex).join(", ")), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "info" }, accept: async () => {
      await o2.onConfirm(r2), n2();
    }, reject: n2, onHide: n2 }), t2;
  }
  return (e2, t2) => {
    let n2 = fe, r2 = de, i2 = me, a2 = ue;
    return d(), g("div", Te, [o2.showAdvertise ? (d(), S(ye, { key: 0, class: "mb-4 [&>*:first-child]:flex-[0_0_fit-content]", onBuy: t2[0] ||= (e3) => A2("buy") })) : x("", !0), h("div", Ee, [h("div", De, [h("div", Oe, [h("div", null, v(y(M2).entityInfo), 1), h("div", ke, [w(j, { modelValue: y(Z), "onUpdate:modelValue": t2[1] ||= (e3) => f(Z) ? Z.value = e3 : null, class: "flex-1", options: y($e), "option-value": "value", size: "xs" }, null, 8, ["modelValue", "options"]), w(j, { modelValue: y(X), "onUpdate:modelValue": t2[2] ||= (e3) => f(X) ? X.value = e3 : null, class: "!w-30", options: y(Y), "option-value": "value", size: "xs" }, null, 8, ["modelValue", "options"])])]), h("div", Ae, [w(Ce, { modelValue: y(z), "onUpdate:modelValue": t2[3] ||= (e3) => f(z) ? z.value = e3 : null, placeholder: y(M2).inputPlaceholder }, null, 8, ["modelValue", "placeholder"]), h("div", je, [h("div", Me, [h("div", null, [w(j, l({ modelValue: y(Q).value, "onUpdate:modelValue": t2[4] ||= (e3) => y(Q).value = e3, class: "!w-32", "overlay-auto-width": "" }, y(Q).props, { onChange: y(Q).onChange }), { "option-extra": b(({ option: e3 }) => [w(_e, { option: e3 }, null, 8, ["option"])]), _: 1 }, 16, ["modelValue", "onChange"])]), h("div", Ne, [w(n2, { modelValue: y(V), "onUpdate:modelValue": t2[5] ||= (e3) => f(V) ? V.value = e3 : null, pt: { root: "items-center", box: "!w-4 !h-4" }, "input-id": "wrap", binary: "" }, null, 8, ["modelValue"]), h("label", Pe, v(e2.$t("\u81EA\u52A8\u53BB\u91CD")), 1), re(w(y(ce), { name: "base/rx_ic_info", color: "var(--colors-icon-icon-note)", size: 12 }, null, 512), [[a2, { value: y(M2).duplicateTip, showDelay: 500, hideDelay: 300 }]])])]), w(r2, { outlined: "", severity: "secondary", size: "xxs", label: e2.$t("\u89E3\u6790\u5E76\u6D4B\u8BD5"), icon: "base/rx_ic_play", disabled: y(K), onClick: T(st, ["stop"]) }, null, 8, ["label", "disabled"])])])]), h("div", Fe, [h("div", Ie, v(y(M2).importRules), 1), h("div", Le, [w(we, { "ip-type": y(Z), class: "relative z-10" }, null, 8, ["ip-type"]), w(Se, { class: "z-9" })])])]), h("div", Re, [h("div", ze, [h("div", Be, v(y(M2).parsedTitle), 1), h("div", Ve, [w(r2, { text: "", severity: "secondary", size: "xxs", label: y(M2).clearAction, icon: "base/rx_ic_bin_1", disabled: !y(B)?.length, onClick: T(ht, ["stop"]) }, null, 8, ["label", "disabled"]), w(r2, { text: "", severity: "secondary", size: "xxs", label: e2.$t("\u5220\u9664\u5931\u8D25"), icon: "base/rx_ic_internet_error", disabled: y(tt), onClick: T(St, ["stop"]) }, null, 8, ["label", "disabled"]), w(r2, { outlined: "", severity: "secondary", size: "xxs", label: e2.$t("\u6D4B\u8BD5\u5168\u90E8"), icon: "base/rx_ic_speed_test", disabled: !y(B)?.length || y(K), onClick: T(xt, ["stop"]) }, null, 8, ["label", "disabled"])])]), h("div", He, [w(y(pe), { visible: y(H), "onUpdate:visible": t2[6] ||= (e3) => f(H) ? H.value = e3 : null, type: "success", class: "w-full", content: y(M2).formatParseSuccess(y(B).length, y(W)) + y(ot), closable: "", onClose: ct }, null, 8, ["visible", "content"]), y(H) ? (d(), g("div", Ue)) : x("", !0), y(N2) ? (d(), S(y(pe), { key: 1, visible: y(U), "onUpdate:visible": t2[7] ||= (e3) => f(U) ? U.value = e3 : null, type: "warn", class: "w-full", content: y(it), closable: "", onClose: lt }, null, 8, ["visible", "content"])) : x("", !0), y(U) ? (d(), g("div", We)) : x("", !0)]), h("div", Ge, [w(be, { class: "h-full", "data-key": "_id", style: te({ "--message-h": y(at) }), columns: y(et), "data-list": y(B), model: ft, regions: ut }, { empty: b(() => [w(i2, { icon: "rx_illustration_star.svg", title: y(M2).emptyTable, class: "min-h-258px" }, null, 8, ["title"])]), outbound: b(({ data: e3 }) => [w(he, { country: e3.lastCountry, city: e3.lastCity, "last-ip": e3.lastIp, time: e3.checkTime, status: y(G)[e3._id], "is-loading": e3.loadingOperationMap?.test }, null, 8, ["country", "city", "last-ip", "time", "status", "is-loading"])]), riskRating: b(({ data: t3 }) => [t3.historyChecking ? (d(), g("div", Ke, v(e2.$t("\u68C0\u6D4B\u4E2D")), 1)) : t3.hasImportRecord === void 0 ? (d(), g(_, { key: 1 }, [p(" -- ")], 64)) : t3.hasImportRecord ? (d(), g("div", qe, v(e2.$t("\u5173\u8054\u98CE\u9669")), 1)) : (d(), g("div", Je, v(e2.$t("\u5B89\u5168")), 1))]), _: 1 }, 8, ["style", "columns", "data-list"])])]), h("div", Ye, [w(r2, { label: e2.$t("\u4FDD\u5B58"), disabled: y(rt), onClick: T(Ct, ["stop"]) }, null, 8, ["label", "disabled"])])]);
  };
} }), [["__scopeId", "data-v-9c732010"]]);
export {L as t};
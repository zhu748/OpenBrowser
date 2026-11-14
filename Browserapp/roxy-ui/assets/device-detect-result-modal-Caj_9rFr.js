import {Ar as e,h as t} from "./utils-BIWenCnY.js";
import {C as n,St as r,V as i,W as a,d as o,f as s,h as c,i as l,in as u,jt as d,m as f,p,x as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as h,o as g} from "./proxy-D7e36h-l.js";
import {Z as _} from "./basecomponent-ClhuVxJN.js";
import {t as v} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as ee} from "./rx-button-DyzuUt-V.js";
import {n as y} from "./m-input-select-C8pih1gY.js";
import {t as b} from "./hooks-Jw3GridD.js";
async function ue(e2) {
  let n2 = Date.now().toString(32), { code: r2, data: i2 } = await t.proxy.userBatchCheckProxyImportCreate({ items: [{ tempId: n2, host: e2.host, port: e2.port, proxyUserName: e2.proxyUserName, proxyPassword: e2.proxyPassword }] });
  return r2 !== 0 || !i2.items || !!(i2.items.find((e3) => e3.tempId === n2) ?? i2.items[0]).hasImportRecord;
}
function pe(t2) {
  return !t2?.lastCountry && !t2?.lastCity && !t2?.lastIp ? "--" : `${`${t2.lastCountry ?? ""}${e("/", t2.lastCity)}`} \xB7 ${t2.lastIp ?? "--"}`;
}
function me(e2) {
  return e2 === "success" ? { icon: "status/rx_ic_check_fill", iconColor: "var(--colors-icon-icon-success)", title: $t("\u68C0\u6D4B\u901A\u8FC7"), desc: $t("\u8BBE\u5907\u8FDE\u901A\u6B63\u5E38\uFF0C\u4E14\u672A\u5339\u914D\u5230\u5E73\u53F0\u534A\u5E74\u5185\u7684\u5386\u53F2\u5E93\uFF0C\u53EF\u653E\u5FC3\u7ED1\u5B9A\u8D26\u53F7\u3002") } : e2 === "connectivity-failed" ? { icon: "base/rx_ic_delete_fill", iconColor: "var(--colors-icon-icon-error)", title: $t("\u8BBE\u5907\u8FDE\u901A\u5931\u8D25"), desc: $t("\u65E0\u6CD5\u8FDE\u901A\u8BE5\u8BBE\u5907\uFF0C\u8BF7\u68C0\u67E5\u4E3B\u673A / \u7AEF\u53E3 / \u8D26\u53F7\u5BC6\u7801\u540E\u91CD\u8BD5") } : { icon: "base/rx_ic_warn_fill", iconColor: "var(--colors-icon-icon-warning)", title: $t("\u68C0\u6D4B\u5230\u5173\u8054\u98CE\u9669"), desc: $t("\u8BE5\u8BBE\u5907\u5728\u8FC7\u53BB 6 \u4E2A\u6708\u5185\u66FE\u88AB\u5BFC\u5165\u4F7F\u7528\uFF0C\u7EE7\u7EED\u7ED1\u5B9A\u53EF\u80FD\u9020\u6210\u8D26\u53F7\u5173\u8054\u98CE\u9669\uFF0C\u5EFA\u8BAE\u66F4\u6362\u8BBE\u5907\u3002") };
}
function Z() {
  let { testProxy: e2 } = b();
  async function t2(t3, n2 = {}) {
    let { isDirect: r2, enableHistoryCheck: i2 = !0 } = n2, a2 = t3.id != null && t3.id !== "" && t3.id !== 0 && String(t3.id) !== "0" ? t3.id : void 0, o2 = await e2({ ...t3, id: a2, isDirect: r2 ?? t3.isDirect, apiCheck: t3.proxyType === h.buy && !!a2 });
    if (o2.error || o2.checkStatus !== g.success) return { phase: "connectivity-failed", checkResult: o2, historyMatched: !1 };
    if (!i2) return { phase: "success", checkResult: o2, historyMatched: !1 };
    let s2 = await ue({ host: String(t3.host ?? ""), port: String(t3.port ?? ""), proxyUserName: t3.proxyUserName, proxyPassword: t3.proxyPassword });
    return { phase: s2 ? "history-risk" : "success", checkResult: o2, historyMatched: s2 };
  }
  return { runDeviceDetection: t2 };
}
function _e() {
  let { runDeviceDetection: e2 } = Z(), t2 = r("checking"), n2 = r(null), i2 = r(!1);
  async function a2(r2, a3 = {}) {
    t2.value = "checking", n2.value = null, i2.value = !1;
    let o2 = await e2(r2, a3);
    return n2.value = o2.checkResult, i2.value = o2.historyMatched, t2.value = o2.phase, o2;
  }
  return { phase: t2, checkResult: n2, historyMatched: i2, run: a2 };
}
var ve = { key: 0, class: "flex flex-col items-center gap-4 py-8" };
var ye = { class: "relative size-10 shrink-0" };
var be = { class: "tt-secondary text-3.25" };
var xe = { class: "flex flex-col items-center gap-3 text-center" };
var Se = { class: "tt-primary text-4.5 font-600 leading-normal" };
var Ce = { class: "tt-secondary text-3.25 leading-5 m-0" };
var we = { class: "detect-status-panel flex flex-col gap-3 pa-4 rounded-3" };
var Te = { class: "flex items-center gap-2" };
var Ee = { class: "tt-primary text-3.25 leading-4.5" };
var De = { key: 0, class: "flex items-center gap-2" };
var Oe = { class: "tt-primary text-3.25 leading-4.5" };
var Q = { key: 0, class: "detect-exit-panel flex items-center justify-between gap-3 pa-3 rounded-2" };
var ke = { class: "tt-secondary text-3 shrink-0" };
var Ae = { class: "flex items-center gap-2 min-w-0" };
var je = { class: "tt-primary text-3.25 leading-4.5 truncate" };
var $ = v(n({ __name: "device-detect-feedback", props: { phase: {}, checkResult: { default: null }, historyMatched: { type: Boolean, default: !1 }, showHistoryCheck: { type: Boolean, default: !0 }, checkingText: { default: () => $t("\u6B63\u5728\u68C0\u6D4B\u8BBE\u5907...") } }, setup(e2) {
  let t2 = o(() => e2.phase === "checking" ? null : me(e2.phase)), n2 = o(() => pe(e2.checkResult)), r2 = o(() => e2.phase !== "connectivity-failed");
  return (i2, o2) => {
    let h2 = _;
    return e2.phase === "checking" ? (a(), c("div", ve, [s("div", ye, [m(y, { "model-value": !0, size: 40, opacity: 1 })]), s("span", be, u(e2.checkingText), 1)])) : d(t2) ? (a(), c(l, { key: 1 }, [s("div", xe, [m(h2, { name: d(t2).icon, size: "48", color: d(t2).iconColor }, null, 8, ["name", "color"]), s("div", Se, u(d(t2).title), 1), s("p", Ce, u(d(t2).desc), 1)]), s("div", we, [s("div", Te, [m(h2, { name: d(r2) ? "base/rx_ic_check" : "base/rx_ic_delete_fill", size: "16", color: d(r2) ? "var(--colors-icon-icon-success)" : "var(--colors-icon-icon-error)" }, null, 8, ["name", "color"]), s("span", Ee, u(i2.$t("\u8BBE\u5907\u8FDE\u901A\u6027\u68C0\u6D4B")) + " \xB7 " + u(d(r2) ? i2.$t("\u6B63\u5E38") : i2.$t("\u5931\u8D25")), 1)]), e2.showHistoryCheck && d(r2) ? (a(), c("div", De, [m(h2, { name: e2.historyMatched ? "base/rx_ic_warn_fill" : "base/rx_ic_check", size: "16", color: e2.historyMatched ? "var(--colors-icon-icon-warning)" : "var(--colors-icon-icon-success)" }, null, 8, ["name", "color"]), s("span", Oe, u(i2.$t("\u5E73\u53F0\u534A\u5E74\u5185\u5386\u53F2\u5E93\u5339\u914D")) + " \xB7 " + u(e2.historyMatched ? i2.$t("\u547D\u4E2D") : i2.$t("\u672A\u547D\u4E2D")), 1)])) : f("", !0)]), d(r2) ? (a(), c("div", Q, [s("span", ke, u(i2.$t("\u8BBE\u5907\u51FA\u53E3")), 1), s("div", Ae, [e2.checkResult?.lastCountry ? (a(), p(h2, { key: 0, name: `country-code/${e2.checkResult.lastCountry}`, fallback: "base/rx_ic_earth", size: "16", class: "shrink-0" }, null, 8, ["name"])) : f("", !0), s("span", je, u(d(n2)), 1)])])) : f("", !0)], 64)) : f("", !0);
  };
} }), [["__scopeId", "data-v-65afcca9"]]);
var Me = { class: "device-detect-modal w-120 flex flex-col gap-6 pa-6 pt-4 rounded-2" };
var Ne = { class: "h-9 flex items-center justify-between" };
var Pe = { class: "tt-primary text-4 font-600 leading-normal" };
var Fe = { key: 0, class: "flex gap-2.5 justify-end" };
var Ie = n({ __name: "device-detect-result-modal", props: { formData: {}, isDirect: { type: Boolean }, onConfirm: { type: Function } }, emits: ["close"], setup(e2, { emit: t2 }) {
  let n2 = t2, { phase: r2, checkResult: o2, historyMatched: h2, run: g2 } = _e();
  i(() => {
    g2(e2.formData, { isDirect: e2.isDirect });
  });
  async function v2() {
    o2.value && await e2.onConfirm(o2.value);
  }
  return (t3, i2) => {
    let y2 = _, b2 = ee;
    return a(), c("div", Me, [s("div", Ne, [s("div", Pe, u(t3.$t("\u68C0\u6D4B\u7ED3\u679C")), 1), m(y2, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", color: "var(--colors-icon-icon-secondary)", onClick: i2[0] ||= (e3) => n2("close") })]), m($, { phase: d(r2), "check-result": d(o2), "history-matched": d(h2) }, null, 8, ["phase", "check-result", "history-matched"]), d(r2) === "checking" ? f("", !0) : (a(), c("div", Fe, [d(r2) === "success" ? (a(), p(b2, { key: 0, size: "md", class: "w-full", label: t3.$t("\u5B8C\u6210\u5BFC\u5165"), onClick: v2 }, null, 8, ["label"])) : d(r2) === "connectivity-failed" ? (a(), c(l, { key: 1 }, [m(b2, { size: "md", severity: "secondary", outlined: "", label: t3.$t("\u53D6\u6D88"), onClick: i2[1] ||= (e3) => n2("close") }, null, 8, ["label"]), m(b2, { size: "md", label: t3.$t("\u91CD\u65B0\u68C0\u6D4B"), onClick: i2[2] ||= (t4) => d(g2)(e2.formData, { isDirect: e2.isDirect }) }, null, 8, ["label"])], 64)) : (a(), c(l, { key: 2 }, [m(b2, { size: "md", severity: "secondary", outlined: "", label: t3.$t("\u53D6\u6D88"), onClick: i2[3] ||= (e3) => n2("close") }, null, 8, ["label"]), m(b2, { size: "md", label: t3.$t("\u4ECD\u8981\u5BFC\u5165"), onClick: v2 }, null, 8, ["label"])], 64))]))]);
  };
} });
export {Ie as t};
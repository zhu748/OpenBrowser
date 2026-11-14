import {C as e,G as t,W as n,d as r,en as i,f as a,h as o,in as s,jt as c,k as l,kt as u,lt as d,m as f,p,ut as m,x as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as g} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {r as _} from "./proxy-D7e36h-l.js";
import {Z as v} from "./basecomponent-ClhuVxJN.js";
import {t as y} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as b} from "./tooltip-BYYKWrvu.js";
import {t as x} from "./rx-button-DyzuUt-V.js";
import {n as S} from "./useRouteContext-Cfh7KChG.js";
import {t as C} from "./simplePopup-D6H7ykCr.js";
var w = /^(https?|socks5|ssh):\/\//i;
var T = /^\d{1,5}$/;
function E(e2) {
  return (e2.trim().split(/\r?\n/, 1)[0]?.trim() ?? "").replace(/^['"]+|['"]+$/g, "").replace(/\s/g, "").replace(/：/g, ":");
}
function D(e2) {
  if (e2.startsWith("[")) {
    let t3 = e2.indexOf("]:");
    if (t3 < 1) return null;
    let n3 = e2.slice(1, t3);
    return n3 ? { host: n3, ipv6: !0, rest: e2.slice(t3 + 2) } : null;
  }
  let t2 = e2.indexOf(":");
  if (t2 <= 0) return null;
  let n2 = e2.slice(0, t2);
  return !n2 || n2.includes("/") ? null : { host: n2, ipv6: !1, rest: e2.slice(t2 + 1) };
}
function O(e2) {
  let t2 = e2.split(":"), n2 = t2[0] ?? "";
  if (!T.test(n2)) return null;
  let r2 = Number(n2);
  return r2 < 1 || r2 > 65535 ? null : { port: n2, username: t2.length >= 2 ? t2[1] : void 0, password: t2.length >= 3 ? t2.slice(2).join(":") : void 0 };
}
function k(e2) {
  let t2 = E(e2);
  if (!t2.includes(":")) return null;
  let n2, r2 = t2, i2 = t2.match(w);
  i2 && (n2 = i2[1].toLowerCase(), r2 = t2.slice(i2[0].length));
  let a2, o2 = r2.lastIndexOf("}");
  if (r2.endsWith("}") && o2 > 0) {
    let e3 = r2.lastIndexOf("{");
    e3 > 0 && e3 < o2 && (a2 = r2.slice(e3 + 1, o2), r2 = r2.slice(0, e3));
  }
  let s2;
  if (r2.endsWith("]")) {
    let e3 = r2.lastIndexOf("[");
    e3 > 0 && (s2 = r2.slice(e3 + 1, -1), r2 = r2.slice(0, e3));
  }
  let c2 = "", l2 = !1, u2 = "", d2, f2, p2 = r2.lastIndexOf("@");
  if (p2 > 0) {
    let e3 = r2.slice(0, p2), t3 = D(r2.slice(p2 + 1)), n3 = e3.indexOf(":"), i3 = t3 ? t3.rest.split(":") : [];
    if (!t3 || i3.length !== 1 || !T.test(i3[0] ?? "")) return null;
    let a3 = Number(i3[0]);
    if (a3 < 1 || a3 > 65535) return null;
    c2 = t3.host, l2 = t3.ipv6, u2 = i3[0], d2 = n3 >= 0 ? e3.slice(0, n3) : e3, f2 = n3 >= 0 ? e3.slice(n3 + 1) : "";
  } else {
    let e3 = D(r2);
    if (!e3) return null;
    let t3 = O(e3.rest);
    if (!t3) return null;
    c2 = e3.host, l2 = e3.ipv6, u2 = t3.port, d2 = t3.username, f2 = t3.password;
  }
  return { ipType: l2 ? _.IPV6 : _.IPV4, host: c2, port: u2, ...d2 === void 0 ? {} : { proxyUserName: d2 }, ...f2 === void 0 ? {} : { proxyPassword: f2 }, ...n2 ? { proxyCategory: n2.toLocaleUpperCase() } : {}, ...s2 === void 0 ? {} : { refreshUrl: s2 }, ...a2 === void 0 ? {} : { remark: a2 } };
}
function A(e2, t2) {
  return { ipType: e2.ipType, host: e2.host, port: e2.port, ...e2.proxyUserName === void 0 ? {} : { proxyUserName: e2.proxyUserName }, ...e2.proxyPassword === void 0 ? {} : { proxyPassword: e2.proxyPassword }, ...e2.proxyCategory ? { proxyCategory: e2.proxyCategory } : {}, ...t2?.includeRefreshUrl !== !1 && e2.refreshUrl !== void 0 ? { refreshUrl: e2.refreshUrl } : {} };
}
var j = { key: 0, class: "ml-2 text-[12px] ellipsis-1" };
var M = y(e({ __name: "index", props: { value: {}, title: {}, content: {}, placeholder: {}, label: {}, hideLabel: { type: Boolean }, mode: {}, disabled: { type: Boolean }, onConfirm: { type: Function }, onCancel: { type: Function } }, setup(e2) {
  let t2 = e2, { showSimpleDialog: l2 } = C(), u2 = r(() => t2.value), _2 = r(() => t2.value?.trim() || t2.label || "");
  function y2() {
    t2.disabled || l2({ title: t2.title, content: t2.content, inputs: [{ type: "textarea", name: "remark", value: t2.value, props: { placeholder: t2.placeholder || $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), rows: 6 } }], onConfirm: async (e3) => {
      await t2.onConfirm?.(e3.remark);
    }, onCancel: t2.onCancel });
  }
  return (t3, r2) => {
    let l3 = x, S2 = b;
    return e2.mode === "button" ? m((n(), p(l3, { key: 0, class: "!gap-0 !text-0 !min-w-auto", disabled: e2.disabled, outlined: "", severity: "secondary", onClick: g(y2, ["stop"]) }, { default: d(() => [h(c(v), { name: c(u2) ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add", class: i({ disabled: e2.disabled, light: c(u2) }) }, null, 8, ["name", "class"]), e2.label && !e2.hideLabel ? (n(), o("span", j, s(e2.label), 1)) : f("", !0), r2[0] ||= a("span", { class: "p-button-label", "data-pc-section": "label" }, "\xA0", -1)]), _: 1 }, 8, ["disabled"])), [[S2, c(_2), void 0, { top: !0 }]]) : m((n(), p(c(v), { key: 1, name: c(u2) ? "base/rx_ic_doc_fill" : "base/rx_ic_doc_add", class: i({ disabled: e2.disabled, light: c(u2) }), onClick: g(y2, ["stop"]) }, null, 8, ["name", "class"])), [[S2, e2.value, void 0, { top: !0 }]]);
  };
} }), [["__scopeId", "data-v-79c5e4a8"]]);
var N = { entity: $t("\u4EE3\u7406 IP"), pageTitle: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), entityType: $t("\u4EE3\u7406 IP \u7C7B\u578B"), entityInfo: $t("\u4EE3\u7406 IP \u4FE1\u606F"), smartRecognize: $t("\u667A\u80FD\u8BC6\u522B\uFF08\u652F\u6301\u52A8\u6001/\u9759\u6001\u4EE3\u7406 IP\uFF09"), testAction: $t("\u6D4B\u8BD5\u4EE3\u7406 IP"), refreshAction: $t("\u5237\u65B0\u4EE3\u7406 IP"), duplicateTitleAll: $t("\u4EE3\u7406 IP \u5DF2\u5B58\u5728"), duplicateTitlePartial: $t("\u90E8\u5206\u4EE3\u7406 IP \u5DF2\u5B58\u5728"), duplicateDesc: $t("\u4EE5\u4E0B\u4EE3\u7406 IP \u5DF2\u5B58\u5728\u4E8E\u5F53\u524D\u4EE3\u7406 IP \u5B58\u50A8\u5E93\u4E2D\uFF0C\u56E0\u6B64\u4E0D\u4F1A\u88AB\u6DFB\u52A0\u3002"), tutorialTitle: $t("\u4EE3\u7406 IP \u6559\u7A0B"), tutorialDesc: $t("\u4E86\u89E3\u5982\u4F55\u5BFC\u5165\u548C\u914D\u7F6E\u4EE3\u7406 IP"), remarkTitle: $t("\u8BF7\u4E3A\u4EE3\u7406 IP \u6DFB\u52A0\u5907\u6CE8"), inputRequired: $t("\u8BF7\u5148\u8F93\u5165\u4EE3\u7406 IP \u4FE1\u606F"), inputPlaceholder: $t("\u8BF7\u5728\u6B64\u5904\u8F93\u5165\u4EE3\u7406 IP \u4FE1\u606F"), duplicateTip: $t("\u5F53\u8F93\u5165\u91CD\u590D\u4EE3\u7406 IP \u4FE1\u606F\u65F6\u4E0D\u505A\u6DFB\u52A0"), importRules: $t("\u5BFC\u5165\u89C4\u5219\uFF08\u652F\u6301\u52A8\u6001/\u9759\u6001\u4EE3\u7406 IP\uFF09"), parsedTitle: $t("\u5DF2\u89E3\u6790\u4EE3\u7406 IP"), clearAction: $t("\u6E05\u7A7A\u4EE3\u7406 IP"), clearHeader: $t("\u6E05\u7A7A\u4EE3\u7406 IP"), clearMessage: $t("\u60A8\u786E\u8BA4\u6E05\u7A7A\u6240\u6709\u4EE3\u7406 IP \u5417?"), emptyList: $t("\u6682\u65E0\u4EE3\u7406 IP"), deleteFailHeader: $t("\u5220\u9664\u5931\u8D25\u4EE3\u7406 IP"), protocolColumnTitle: $t("\u4EE3\u7406 IP \u7C7B\u578B"), host: $t("\u4EE3\u7406 IP \u4E3B\u673A"), port: $t("\u4EE3\u7406 IP \u7AEF\u53E3"), username: $t("\u4EE3\u7406 IP \u7528\u6237\u540D"), password: $t("\u4EE3\u7406 IP \u5BC6\u7801"), usernamePlaceholder: $t("\u8BF7\u8F93\u5165\u4EE3\u7406 IP \u8D26\u53F7"), passwordPlaceholder: $t("\u8BF7\u8F93\u5165\u4EE3\u7406 IP \u5BC6\u7801"), refreshUrl: $t("\u5237\u65B0 URL"), refreshUrlPlaceholder: $t("\u52A8\u6001\u4EE3\u7406 IP \u4E13\u7528\uFF0C\u9759\u6001\u4EE3\u7406 IP \u65E0\u9700\u586B\u5199"), refreshUrlTooltip: $t("\u5982\u4EE3\u7406 IP \u670D\u52A1\u5546\u672A\u63D0\u4F9B\u5237\u65B0 URL\uFF0C\u5219\u65E0\u9700\u914D\u7F6E\u3002\u586B\u5199\u540E\u53EF\u70B9\u51FB\u53F3\u4FA7\u5237\u65B0\u6309\u94AE\u8BF7\u6C42\u66F4\u6362\u5F53\u524D\u51FA\u53E3 IP\u3002"), ipDetect: $t("\u4EE3\u7406 IP \u68C0\u6D4B"), successRouteName: "agent-list", emptyTable: $t("\u6682\u672A\u6DFB\u52A0\u4EE3\u7406 IP"), batchHelpLine: $t("\u4E00\u884C\u4E00\u4E2A\u4EE3\u7406 IP\uFF0C\u4E00\u6B21\u6700\u591A\u6DFB\u52A0 500 \u4E2A\uFF1B") };
var P = { entity: $t("\u8BBE\u5907"), pageTitle: $t("\u6DFB\u52A0\u8BBE\u5907"), entityType: $t("\u8BBE\u5907\u7C7B\u578B"), entityInfo: $t("\u8BBE\u5907\u4FE1\u606F"), smartRecognize: $t("\u667A\u80FD\u8BC6\u522B\uFF08\u652F\u6301\u52A8\u6001/\u9759\u6001\u8BBE\u5907\uFF09"), testAction: $t("\u6D4B\u8BD5\u8BBE\u5907"), refreshAction: $t("\u5237\u65B0\u8BBE\u5907"), duplicateTitleAll: $t("\u8BBE\u5907\u5DF2\u5B58\u5728"), duplicateTitlePartial: $t("\u90E8\u5206\u8BBE\u5907\u5DF2\u5B58\u5728"), duplicateDesc: $t("\u4EE5\u4E0B\u8BBE\u5907\u5DF2\u5B58\u5728\u4E8E\u5F53\u524D\u8BBE\u5907\u5E93\u4E2D\uFF0C\u56E0\u6B64\u4E0D\u4F1A\u88AB\u6DFB\u52A0\u3002"), tutorialTitle: $t("\u8BBE\u5907\u6559\u7A0B"), tutorialDesc: $t("\u4E86\u89E3\u5982\u4F55\u5BFC\u5165\u548C\u914D\u7F6E\u8BBE\u5907"), remarkTitle: $t("\u8BF7\u4E3A\u8BBE\u5907\u6DFB\u52A0\u5907\u6CE8"), inputRequired: $t("\u8BF7\u5148\u8F93\u5165\u8BBE\u5907\u4FE1\u606F"), inputPlaceholder: $t("\u8BF7\u5728\u6B64\u5904\u8F93\u5165\u8BBE\u5907\u4FE1\u606F"), duplicateTip: $t("\u5F53\u8F93\u5165\u91CD\u590D\u8BBE\u5907\u4FE1\u606F\u65F6\u4E0D\u505A\u6DFB\u52A0"), importRules: $t("\u5BFC\u5165\u89C4\u5219\uFF08\u652F\u6301\u52A8\u6001/\u9759\u6001\u8BBE\u5907\uFF09"), parsedTitle: $t("\u5DF2\u89E3\u6790\u8BBE\u5907"), clearAction: $t("\u6E05\u7A7A\u8BBE\u5907"), clearHeader: $t("\u6E05\u7A7A\u8BBE\u5907"), clearMessage: $t("\u60A8\u786E\u8BA4\u6E05\u7A7A\u6240\u6709\u8BBE\u5907\u5417?"), emptyList: $t("\u6682\u65E0\u8BBE\u5907"), deleteFailHeader: $t("\u5220\u9664\u5931\u8D25\u8BBE\u5907"), protocolColumnTitle: $t("\u8BBE\u5907\u7C7B\u578B"), host: $t("\u4E3B\u673A"), port: $t("\u7AEF\u53E3"), username: $t("\u7528\u6237\u540D"), password: $t("\u5BC6\u7801"), usernamePlaceholder: $t("\u8BF7\u8F93\u5165\u7528\u6237\u540D"), passwordPlaceholder: $t("\u8BF7\u8F93\u5165\u5BC6\u7801"), refreshUrl: $t("\u5237\u65B0 URL"), refreshUrlPlaceholder: $t("\u8BF7\u8F93\u5165\u5237\u65B0 URL"), refreshUrlTooltip: $t("\u8BF7\u5728\u586B\u5199\u540E\u70B9\u51FB\u56FE\u6807\u8FDB\u884C\u6D4B\u8BD5\u3002"), ipDetect: $t("IP \u68C0\u6D4B"), successRouteName: "ecommerce-device-list", emptyTable: $t("\u6682\u672A\u6DFB\u52A0\u8BBE\u5907"), batchHelpLine: $t("\u4E00\u884C\u4E00\u4E2A\u8BBE\u5907\uFF0C\u4E00\u6B21\u6700\u591A\u6DFB\u52A0 500 \u4E2A\uFF1B") };
function F(e2) {
  let t2 = e2 === "device";
  return { mode: e2, ...t2 ? P : N, formatMissSaveMessage: (e3) => t2 ? $t("\u7B2C [{miss}] \u6761\u8BBE\u5907\u7F3A\u5C11\u4FE1\u606F\uFF0C\u5C06\u4E0D\u4F1A\u88AB\u4FDD\u5B58\u3002", { miss: e3 }) : $t("\u7B2C [{miss}] \u6761\u4EE3\u7406 IP \u7F3A\u5C11\u4FE1\u606F\uFF0C\u5C06\u4E0D\u4F1A\u88AB\u4FDD\u5B58\u3002", { miss: e3 }), formatMissConfirmMessage: (e3) => t2 ? $t("\u7B2C [{miss}] \u6761\u8BBE\u5907\u7F3A\u5C11\u4FE1\u606F\uFF0C\u5C06\u4E0D\u4F1A\u88AB\u4FDD\u5B58\uFF0C\u8BF7\u786E\u8BA4\u662F\u5426\u7EE7\u7EED", { miss: e3 }) : $t("\u7B2C [{miss}] \u6761\u4EE3\u7406 IP \u7F3A\u5C11\u4FE1\u606F\uFF0C\u5C06\u4E0D\u4F1A\u88AB\u4FDD\u5B58\uFF0C\u8BF7\u786E\u8BA4\u662F\u5426\u7EE7\u7EED", { miss: e3 }), formatDeleteFailMessage: (e3) => t2 ? $t("\u60A8\u786E\u8BA4\u5220\u9664\u6240\u6709\u6D4B\u901F\u5931\u8D25\u7684\u8BBE\u5907\u5417?\u5171 {count} \u4E2A", { count: e3 }) : $t("\u60A8\u786E\u8BA4\u5220\u9664\u6240\u6709\u6D4B\u901F\u5931\u8D25\u7684\u4EE3\u7406 IP \u5417?\u5171 {count} \u4E2A", { count: e3 }), formatParseSuccess: (e3, n2) => t2 ? $t("\u5DF2\u6210\u529F\u89E3\u6790 {count} \u8BBE\u5907\u3002{filterCount} \u91CD\u590D\u8BBE\u5907\u5DF2\u8FC7\u6EE4\u3002", { count: e3, filterCount: n2 }) : $t("\u5DF2\u6210\u529F\u89E3\u6790 {count} \u4EE3\u7406 IP\u3002{filterCount} \u91CD\u590D\u4EE3\u7406 IP \u5DF2\u8FC7\u6EE4\u3002", { count: e3, filterCount: n2 }) };
}
var I = /* @__PURE__ */ Symbol("proxyCreateLabels");
function L(e2) {
  if (e2 !== void 0) {
    let n3 = r(() => F(u(e2)));
    return t(I, n3), n3;
  }
  let { isEcommerce: n2 } = S();
  return l(I, () => r(() => F(n2.value ? "device" : "proxy")), !0);
}
export {k as a,A as i,L as n,M as r,F as t};
import {cr as e,h as t,xr as n} from "./utils-BIWenCnY.js";
import {C as r,G as i,L as a,St as o,W as s,at as c,d as l,f as u,h as d,jt as f,lt as p,m,p as h,st as g,x as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as v} from "./agent-BmSFI9WH.js";
import {o as y} from "./proxy-D7e36h-l.js";
import {Z as b} from "./basecomponent-ClhuVxJN.js";
import {t as x} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as S} from "./theme-mq6SsndU.js";
import {t as C} from "./rx-button-DyzuUt-V.js";
import {t as w} from "./m-input-select-C8pih1gY.js";
import {r as T,t as E} from "./form-BQBA_XzO.js";
import {r as D,u as O} from "./utils-CnUy4XUk.js";
var k = /* @__PURE__ */ new Set(["ac", "co", "com", "edu", "go", "gov", "ne", "net", "or", "org"]);
function A(e2) {
  return (e2 ?? []).map((e3) => ({ image: e3.platformIcon, darkImage: e3.platformIconDark, label: e3.platformUrl ?? "", value: e3.platformUrl ?? "" }));
}
function j(e2) {
  return (e2 ?? []).filter((e3) => e3.image || e3.darkImage);
}
function M(e2) {
  let t2 = e2.trim();
  if (!t2) return "";
  let n2 = /^[a-z][a-z\d+.-]*:\/\//i.test(t2) ? t2 : `https://${t2}`;
  try {
    return new URL(n2).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return "";
  }
}
function N(e2) {
  let t2 = M(e2);
  if (!t2 || t2.includes(":") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(t2)) return "";
  let n2 = t2.split(".").filter(Boolean);
  if (n2.length < 2) return "";
  let r2 = n2[n2.length - 1], i2 = n2[n2.length - 2];
  return n2.length >= 3 && r2.length === 2 && k.has(i2) ? n2.slice(-3).join(".") : n2.slice(-2).join(".");
}
function P(e2, t2) {
  if (typeof e2 != "string" || !e2.trim() || !t2?.length) return;
  let n2 = t2.find((t3) => t3.value === e2);
  if (n2) return n2;
  let r2 = M(e2);
  if (r2) {
    let e3 = t2.find((e4) => e4.value && M(e4.value) === r2);
    if (e3) return e3;
  }
  let i2 = N(e2);
  if (i2) return t2.find((e3) => e3.value && N(e3.value) === i2);
}
function F(e2, t2, n2) {
  if (e2 || t2) return j(n2).find((n3) => e2 && n3.image === e2 || t2 && n3.darkImage === t2);
}
function I(e2, t2) {
  let n2 = P(e2, t2);
  return !n2?.value || !(n2.image || n2.darkImage) ? "" : n2.value;
}
function L(e2, t2, n2, r2) {
  return F(t2, n2, r2)?.value || I(e2, r2);
}
function R(e2, t2, n2) {
  let r2 = (t2 ?? []).find((t3) => t3.value === e2);
  return { platformIcon: r2?.image || "", platformIconDark: r2?.darkImage || "", fromUser: n2 };
}
var z = { class: "platform-url-select" };
var B = { class: "inline-flex w-full items-center justify-center" };
var V = { class: "inline-flex w-full items-center justify-center" };
var H = ["src"];
var U = { class: "inline-flex w-full items-center justify-center" };
var W = ["src"];
var G = x(r({ __name: "platform-url-select", props: { url: { default: "" }, icon: { default: "" }, iconDark: { default: "" }, options: { default: () => [] }, darkMode: { type: Boolean, default: !1 }, placeholder: { default: "" }, syncKey: { default: "" } }, emits: ["update:url", "icons"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2;
  i("$pcFormField", null);
  let a2 = o(""), c2 = o(!1), v2 = o(!1), y2 = l(() => j(n2.options)), x2 = l(() => y2.value.find((e3) => e3.value === a2.value));
  function S2(e3) {
    return e3 ? n2.darkMode ? e3.darkImage || e3.image || "" : e3.image || "" : "";
  }
  let C2 = l(() => S2(x2.value)), T2 = l(() => v2.value ? n2.darkMode ? n2.iconDark || n2.icon || "" : n2.icon || n2.iconDark || "" : C2.value);
  function E2(e3) {
    v2.value = !1;
    let t3 = I(e3, n2.options);
    a2.value = t3, r2("icons", R(t3, n2.options, !0));
  }
  function D2() {
    if (!n2.options.length) return;
    if (c2.value) {
      c2.value = !1, E2(n2.url);
      return;
    }
    if ((n2.icon || n2.iconDark) && !F(n2.icon, n2.iconDark, n2.options)) {
      v2.value = !0, a2.value = "";
      return;
    }
    v2.value = !1;
    let e3 = L(n2.url, n2.icon, n2.iconDark, n2.options);
    a2.value = e3;
    let t3 = R(e3, n2.options, !1);
    (t3.platformIcon !== (n2.icon || "") || t3.platformIconDark !== (n2.iconDark || "")) && r2("icons", t3);
  }
  g(() => n2.options, () => {
    D2();
  }, { immediate: !0 }), g(() => n2.syncKey, () => {
    D2();
  });
  function O2(e3) {
    let t3 = typeof e3 == "string" ? e3 : "";
    r2("update:url", t3), n2.options.length ? E2(t3) : c2.value = !0;
  }
  function k2(e3) {
    v2.value = !1;
    let t3 = typeof e3 == "string" ? e3 : "";
    a2.value = t3, r2("icons", R(t3, n2.options, !0));
  }
  return (t3, n3) => {
    let r3 = b;
    return s(), d("div", z, [_(w, { class: "platform-url-select__icon", "model-value": f(a2), options: f(y2), "option-value": "value", "show-dropdown-icon": !1, "dark-mode": e2.darkMode, "onUpdate:modelValue": k2 }, { placeholder: p(() => [u("span", B, [_(r3, { name: "base/rx_ic_user_key", color: "var(--colors-icon-icon-tertiary)" })])]), value: p(() => [u("span", V, [f(T2) ? (s(), d("img", { key: 0, class: "selectitem__image", src: f(T2), alt: "" }, null, 8, H)) : (s(), h(r3, { key: 1, name: "base/rx_ic_user_key", color: "var(--colors-icon-icon-tertiary)" }))])]), option: p(({ option: e3 }) => [u("span", U, [S2(e3) ? (s(), d("img", { key: 0, class: "selectitem__image", src: S2(e3), alt: "" }, null, 8, W)) : m("", !0)])]), _: 1 }, 8, ["model-value", "options", "dark-mode"]), _(w, { class: "platform-url-select__url", "model-value": e2.url, options: e2.options, "option-value": "value", editable: "", "dark-mode": e2.darkMode, placeholder: e2.placeholder, "onUpdate:modelValue": O2 }, null, 8, ["model-value", "options", "dark-mode", "placeholder"])]);
  };
} }), [["__scopeId", "data-v-faf0d5e2"]]);
var K = r({ __name: "platform-url-form-field", props: { name: { default: "platformUrl" }, options: { default: () => [] }, darkMode: { type: Boolean, default: !1 }, placeholder: { default: "" }, icon: { default: "" }, iconDark: { default: "" }, syncKey: { default: "" }, onIcons: {}, onUrlChange: {} }, emits: ["update"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, { getFieldState: i2 } = T(), a2 = l(() => String(i2(n2.name)?.value ?? ""));
  return g(a2, (e3) => {
    n2.onUrlChange?.(e3);
  }), (t3, n3) => (s(), h(G, { url: f(a2), icon: e2.icon, "icon-dark": e2.iconDark, options: e2.options, "dark-mode": e2.darkMode, placeholder: e2.placeholder, "sync-key": e2.syncKey, "onUpdate:url": n3[0] ||= (e3) => r2("update", e3), onIcons: n3[1] ||= (t4) => e2.onIcons?.(t4) }, null, 8, ["url", "icon", "icon-dark", "options", "dark-mode", "placeholder", "sync-key"]));
} });
function q(e2, t2) {
  return String(e2?.platformAbbr ?? "").trim() || (P(e2?.platformUrl, t2)?.platformAbbr?.trim() ?? "");
}
function J(e2, t2) {
  let n2 = q(e2, t2);
  return n2 ? { account: $t("{platform} \u767B\u5F55\u8D26\u53F7", { platform: n2 }), password: $t("{platform} \u767B\u5F55\u5BC6\u7801", { platform: n2 }) } : { account: $t("\u5E73\u53F0\u767B\u5F55\u8D26\u53F7"), password: $t("\u5E73\u53F0\u767B\u5F55\u5BC6\u7801") };
}
function Y(e2) {
  return (e2 ?? []).flatMap((e3) => {
    let t2 = e3.platformUrl ?? "", n2 = String(e3.platformAbbr ?? "").trim();
    return !t2 || !n2 ? [] : [{ label: t2, value: t2, platformAbbr: n2 }];
  });
}
async function X() {
  try {
    let { code: e2, data: n2 } = await t.platform.userGetPlatformInfoList({});
    return e2 === 0 ? Y(n2?.rows ?? []) : [];
  } catch (e2) {
    return console.error("[fetchPlatformAbbrCatalog] failed to load platform catalog", e2), [];
  }
}
function Z(e2) {
  if (!e2) return !1;
  let t2 = String(e2.proxyMethod || "").toLowerCase(), n2 = String(e2.proxyCategory || e2.protocol || "").toLowerCase();
  return t2 === "noproxy" || n2 === "noproxy" ? !1 : t2 === "custom" || t2 === "choose" || t2 === "api" || !!e2.host || !!e2.id;
}
function Q(e2, t2) {
  for (let n2 of e2 ?? []) {
    let e3 = String(n2?.platformAbbr ?? "").trim();
    if (e3) return e3;
    let r2 = P(n2?.platformUrl, t2)?.platformAbbr?.trim();
    if (r2) return r2;
  }
  return "";
}
function ee(e2) {
  if (!Z(e2) || !e2 || e2.checkStatus === y.failure) return "";
  let t2 = String(e2.lastCountry ?? "").trim(), n2 = String(e2.lastIp ?? "").trim(), r2 = e2.checkStatus === y.success || !!n2;
  return !t2 || !r2 ? "" : t2.toUpperCase();
}
function te(e2) {
  if (!Array.isArray(e2)) return "";
  for (let t2 of e2) {
    let e3 = ee(t2);
    if (e3) return e3;
  }
  return "";
}
function ne(e2, t2, n2) {
  let r2 = [t2?.trim(), n2?.trim().toUpperCase()].filter(Boolean);
  return r2.length ? `${r2.join("-")}-${e2}` : e2;
}
function $(e2, t2, n2) {
  return ne(e2, Q(t2.accounts, n2), te(t2.proxyList));
}
async function re(e2) {
  let [t2, n2] = await Promise.all([D(), X()]);
  if (t2) return $(t2, e2, n2);
}
function ie(e2) {
  return String(e2?.suggestedWindowName ?? "").trim();
}
var ae = { class: "flex flex-col h-full min-w-96 px-4 pt-4" };
var oe = { class: "flex-1 overflow-y-auto scrollbar" };
var se = { class: "flex flex-row-reverse justify-between gap-3 pt-4 pb-5" };
var ce = x(r({ __name: "quick", props: { data: { default: () => ({}) }, showRemark: { type: Boolean, default: !0 }, showCreateMore: { type: Boolean, default: !0 }, onConfirm: { type: Function } }, emits: ["close"], setup(r2, { emit: i2 }) {
  let l2 = i2, { realTheme: p2 } = v(S()), y2 = c("tsform"), b2 = o([]), x2 = o(!1), w2 = o(!1), T2 = o(), D2 = o(0), k2 = o({ platformIcon: r2.data.platformIcon || "", platformIconDark: r2.data.platformIconDark || "", fromUser: !1 }), j2 = `${$t("\u8D26\u53F7")}:${$t("\u5BC6\u7801")}:2FA${r2.showRemark ? `{${$t("\u5907\u6CE8")}}` : ""}`;
  function M2(e2) {
    k2.value = e2;
  }
  function N2(e2) {
    let t2 = e2 ?? String(y2.value?.getFieldState("platformUrl")?.value ?? r2.data.platformUrl ?? ""), n2 = J({ platformUrl: t2, platformAbbr: t2 === String(r2.data.platformUrl ?? "") ? r2.data.platformAbbr : void 0 }, b2.value);
    y2.value?.setInputsProps({ platformUserName: { label: n2.account }, platformPassword: { label: n2.password } });
  }
  let P2 = [{ type: "textarea", label: $t("\u667A\u80FD\u8BC6\u522B"), name: "intelligent", props: { placeholder: j2, rows: 2, onBlur: (e2) => {
    let t2 = O(e2.target.value);
    if (n(Object.values(t2).filter(Boolean))) return;
    let { username: r3, password: i3, twoFactor: a2, remark: o2 } = t2;
    y2.value?.setValues({ platformUserName: r3 ?? "", platformPassword: i3 ?? "", platformEfa: a2 ?? "", platformRemarks: o2 ?? "", intelligent: "" });
  } }, resolver: (e2) => e2.string().refine((e3) => n(e3) ? !0 : !n(Object.values(O(e3)).filter(Boolean)), { message: $t("\u89E3\u6790\u9519\u8BEF,\u8BF7\u68C0\u67E5\u683C\u5F0F\uFF1A{text}", { text: j2 }) }) }, { separator: !0 }, { label: $t("\u5E73\u53F0"), name: "platformUrl", value: r2.data.platformUrl, render: K, props: { placeholder: $t("\u8BF7\u8F93\u5165\u6216\u9009\u62E9\u5E73\u53F0\u7F51\u5740"), darkMode: p2.value === "dark", icon: r2.data.platformIcon || "", iconDark: r2.data.platformIconDark || "", syncKey: D2.value, options: [], onIcons: M2, onUrlChange: N2 }, resolver: (e2) => e2.string().url($t("\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u5E73\u53F0\u7F51\u5740")) }, { type: "text", label: $t("\u5E73\u53F0\u767B\u5F55\u8D26\u53F7"), name: "platformUserName", value: r2.data.platformUserName, props: { placeholder: $t("\u8BF7\u8F93\u5165\u8D26\u53F7") } }, { type: "password", label: $t("\u5E73\u53F0\u767B\u5F55\u5BC6\u7801"), name: "platformPassword", value: r2.data.platformPassword, props: { placeholder: $t("\u8BF7\u8F93\u5165\u5BC6\u7801") } }, { type: "text", label: $t("2FA \u5BC6\u94A5"), tooltip: $t("\u4EC5\u5F53\u5E73\u53F0\u8D26\u53F7\u5DF2\u5F00\u542F\u53CC\u91CD\u9A8C\u8BC1\u65F6\u586B\u5199\uFF0C\u586B\u5199\u540E\u53EF\u7528\u4E8E\u81EA\u52A8\u751F\u6210\u9A8C\u8BC1\u7801\u3002"), name: "platformEfa", value: r2.data.platformEfa, props: { placeholder: $t("\u8BF7\u8F93\u5165 2FA \u5BC6\u94A5") } }, { type: "textarea", label: $t("\u5907\u6CE8"), name: "platformRemarks", value: r2.data.platformRemarks, visible: r2.showRemark, props: { placeholder: $t("\u8BF7\u8F93\u5165\u5907\u6CE8"), rows: 3 } }].filter((e2) => e2.visible !== !1);
  g(() => p2.value, () => {
    y2.value?.setInputsProps({ platformUrl: { darkMode: p2.value === "dark" } });
  }), a(() => {
    F2();
  });
  async function F2() {
    let { data: { rows: n2 } } = await t.platform.userGetPlatformInfoList({});
    b2.value = Y(n2), T2.value = e(r2.data), y2.value?.setInputsProps({ platformUrl: { options: A(n2) } }), N2();
  }
  function I2(e2) {
    x2.value = e2, y2.value?.submit();
  }
  async function L2({ intelligent: e2, platformUserName: t2, platformPassword: n2, ...i3 }) {
    let a2 = { ...T2.value, platformUserName: t2?.trim(), platformPassword: n2?.trim(), ...i3, platformIcon: k2.value.platformIcon, platformIconDark: k2.value.platformIconDark };
    w2.value = !0, await r2.onConfirm?.(a2), w2.value = !1, y2.value?.reset(), k2.value = { platformIcon: r2.data.platformIcon || "", platformIconDark: r2.data.platformIconDark || "", fromUser: !1 }, D2.value += 1, y2.value?.setInputsProps({ platformUrl: { icon: k2.value.platformIcon, iconDark: k2.value.platformIconDark, syncKey: D2.value } }), N2(String(r2.data.platformUrl ?? "")), x2.value || l2("close");
  }
  return (e2, t2) => {
    let n2 = C;
    return s(), d("div", ae, [u("div", oe, [_(E, { id: "account", ref: "tsform", "validate-on-value-update": !1, "validate-on-blur": "", inputs: f(P2), onSubmit: L2 }, null, 8, ["inputs"])]), u("div", se, [_(n2, { label: e2.$t("\u4FDD\u5B58"), loading: f(w2), onClick: t2[0] ||= (e3) => I2(!1) }, null, 8, ["label", "loading"]), !r2.data.id && !r2.data._tempId && r2.showCreateMore ? (s(), h(n2, { key: 0, label: e2.$t("\u4FDD\u5B58 & \u7EE7\u7EED\u6DFB\u52A0"), severity: "secondary", outlined: "", loading: f(w2), onClick: t2[1] ||= (e3) => I2(!0) }, null, 8, ["label", "loading"])) : m("", !0)])]);
  };
} }), [["__scopeId", "data-v-b78b58b2"]]);
export {re as a,K as c,ie as i,G as l,$ as n,Y as o,X as r,J as s,ce as t,A as u};
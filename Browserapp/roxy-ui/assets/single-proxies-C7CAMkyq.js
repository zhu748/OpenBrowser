import {Ar as e,Tr as t,cr as n,m as i,v as a,xr as o} from "./utils-BIWenCnY.js";
import {C as s,D as c,F as l,J as u,L as d,St as f,W as p,Y as m,_t as h,at as g,b as _,d as v,f as b,h as x,in as C,jt as w,lt as T,m as E,p as D,x as O} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as k,o as ee} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as te,n as ne} from "./agent-BmSFI9WH.js";
import {m as j,r as M} from "./proxy-D7e36h-l.js";
import {a as re,i as ie,n as N,r as ae} from "./proxy-create-mode-BCcLAAf5.js";
import {Z as oe} from "./basecomponent-ClhuVxJN.js";
import {t as P} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as F} from "./rx-button-DyzuUt-V.js";
import {t as se} from "./m-input-select-C8pih1gY.js";
import {t as ce} from "./rx-alert-A_y5uvgP.js";
import {t as le} from "./useDialog-BC-nc8J-.js";
import {t as ue} from "./hooks-BozaoB_u.js";
import {t as de} from "./hooks-Jw3GridD.js";
import {t as fe} from "./form-BQBA_XzO.js";
import {t as pe} from "./device-detect-result-modal-Caj_9rFr.js";
import {t as me} from "./tutorial-video-Cb-jkf_V.js";
import {n as he,t as L} from "./check-channel-BUSbubqx.js";
var W = { render: () => null };
var ge = { class: "flex flex-col gap-4 min-w-96 h-full min-h-0 overflow-hidden pa-4 pb-5" };
var _e = ["onClick"];
var ve = { class: "flex items-center pa-2 rounded-md video-icon" };
var ye = { class: "flex-1 cursor-pointer" };
var be = { class: "flex justify-between items-center" };
var xe = { class: "video-title" };
var Se = { class: "video-desc" };
var Ce = { class: "flex-1 min-h-0 flex flex-col gap-4 pb-2 overflow-y-auto scrollbar" };
var we = { class: "shrink-0" };
var Te = { class: "inline-flex flex-row-reverse justify-between w-full" };
var G = P(s({ __name: "single-proxies", props: { data: { default: () => ({}) }, showRemark: { type: Boolean, default: !1 }, showAdvertise: { type: Boolean, default: !1 }, mode: {}, onConfirm: { type: Function } }, emits: ["buy"], setup(r2, { expose: s2, emit: y2 }) {
  let S2 = y2, A2 = r2.mode === void 0 ? N() : N(() => r2.mode), [P2] = ne(), { getUserConfig: I2 } = a(), { userConfig: R } = te(a()), [B] = le(), { testProxy: V, batchTestShowToast: H } = de(), U = f(null), G2 = v(() => A2.value.mode === "device"), { onboardingTaskStatus: Ee, closeGuideTipsAndUpdateTaskStatus: De } = ue(), K = g("form"), Oe = g("alert"), ke = g("advertiseFail"), q = ee(), J = f(!1), Y = f(!1), X = f(n(r2.data));
  function Z(e2) {
    let t2 = re(e2);
    return t2 ? (K.value?.setValues(ie(t2, { includeRefreshUrl: !G2.value })), t2.remark !== void 0 && (X.value.remark = t2.remark), !0) : !1;
  }
  function Ae(e2) {
    Z(e2.clipboardData?.getData("text") ?? "") && e2.preventDefault();
  }
  function je(e2) {
    Z(e2.target.value);
  }
  let Me = v(() => [{ type: "textarea", label: A2.value.smartRecognize, name: "proxyRules", props: { placeholder: G2.value ? $t(`\u793A\u4F8B\uFF08\u5907\u6CE8\u4E3A\u9009\u586B\uFF09:
192.168.0.1:8000:\u7528\u6237\u540D:\u5BC6\u7801{notes}
\u7528\u6237\u540D:\u5BC6\u7801{at}192.168.0.1:8000{notes}`, { at: "@", notes: `{${$t("\u5907\u6CE8")}}` }) : $t(`\u793A\u4F8B\uFF08\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL \u4E0E\u5907\u6CE8\u4E3A\u9009\u586B\uFF09:
192.168.0.1:8000:\u4EE3\u7406 IP \u7528\u6237\u540D:\u4EE3\u7406 IP \u5BC6\u7801[\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL]{notes}
\u4EE3\u7406 IP \u7528\u6237\u540D:\u4EE3\u7406 IP \u5BC6\u7801{at}192.168.0.1:8000[\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL]{notes}`, { at: "@", notes: `{${$t("\u5907\u6CE8")}}` }), rows: 3, size: "md", onBlur: (e2) => {
    let n2 = t(e2.target.value);
    if (o(Object.values(n2).filter(Boolean))) return;
    let { protocol: r3, host: i2, port: a2, proxyUserName: s3, proxyPassword: c2, refreshUrl: l2, remark: u2 } = n2, d2 = i2?.startsWith("[") ? M.IPV6 : M.IPV4;
    K.value?.setValues({ ipType: d2, host: i2?.replace(/\[|\]/g, ""), port: a2, proxyUserName: s3, proxyPassword: c2, ...r3 ? { proxyCategory: r3.toLocaleUpperCase() } : {}, ...G2.value ? {} : { refreshUrl: l2 }, proxyRules: "" }), X.value.remark = u2;
  } }, resolver: (e2) => e2.string().refine((e3) => o(e3) ? !0 : !o(Object.values(t(e3)).filter(Boolean)), { message: $t("\u89E3\u6790\u9519\u8BEF,\u8BF7\u68C0\u67E5\u683C\u5F0F") }) }, { separator: !0 }, { type: "radio", label: A2.value.entityType, name: "ipType", props: { name: "ipType", size: "md", onValueChange: async (e2) => {
    let t2 = await i(), n2 = e2 === M.IPV6 ? "ipv6-query-channels" : "checkChannel", a2 = L(t2[n2]), o2 = a2.find((e3) => e3.value === r2.data.checkChannel), s3 = o2 ? r2.data.checkChannel : a2[0]?.value;
    e2 === M.IPV6 ? K.value?.setInputsProps({ checkChannel: { value: s3, options: a2 } }) : K.value?.setInputsProps({ checkChannel: { value: o2 ? s3 : R.value.ipChecker || s3, options: a2 } });
  } } }, { type: "group", label: A2.value.entityInfo, items: [{ type: "select", name: "proxyCategory", itemClass: "flex-1.75/5", props: { optionValue: "value", size: "md" } }, { type: "text", name: "host", itemClass: `flex-1.75/5 ${q.host}`, value: r2.data.host ?? null, required: !0, props: { placeholder: A2.value.host, size: "md", onPaste: Ae, onBlur: je } }, { itemClass: `justify-center ${q.dot_eparator}`, render: () => O("span", null, [_(":")]) }, { type: "text", name: "port", itemClass: "flex-1.5/5", value: r2.data.port?.split?.("/")?.[0] ?? null, props: { placeholder: A2.value.port, size: "md", useGrouping: !1 }, resolver: (e2) => e2.string().refine((e3) => o(e3) ? !1 : Number(e3) >= 1 || Number(e3) <= 65535, { message: $t("\u7AEF\u53E3\u8303\u56F4 1~65535") }) }] }, { type: "text", name: "proxyUserName", label: A2.value.username, value: r2.data.proxyUserName ?? "", props: { placeholder: A2.value.usernamePlaceholder, size: "md" } }, { type: "text", name: "proxyPassword", label: A2.value.password, value: r2.data.proxyPassword ?? "", props: { placeholder: A2.value.passwordPlaceholder, size: "md" } }, ...G2.value ? [] : [{ type: "text", name: "refreshUrl", label: A2.value.refreshUrl, tooltip: A2.value.refreshUrlTooltip, value: r2.data.refreshUrl ?? "", props: { placeholder: A2.value.refreshUrlPlaceholder, icon: "base/rx_ic_refresh", size: "md", onIconClick: async () => {
    let e2 = K.value?.getFieldState("refreshUrl")?.value;
    if (e2) {
      let t2 = await globalThis.electronAPI.send("proxy:refreshUrl", e2);
      P2(t2 ? 0 : -1, e2);
    }
  } } }], { separator: !0 }, { label: A2.value.ipDetect, name: "checkChannel", tooltip: $t("\u82E5 IP \u68C0\u6D4B\u7ED3\u679C\u6709\u8BEF\uFF0C\u8BF7\u5C1D\u8BD5\u5207\u6362\u4E0B\u65B9\u67E5\u8BE2\u6E20\u9053\u5E76\u91CD\u8BD5\u3002"), props: { size: "md", fluid: !0, optionValue: "value" }, render: (e2) => O("div", { class: "w-full flex justify-between items-center gap-1.5 overflow-hidden" }, [O(se, e2, { "option-extra": ({ option: e3 }) => O(he, { option: e3 }, null) }), O(F, { class: "flex-shrink-0", size: "md", severity: "secondary", variant: "outlined", icon: "base/rx_ic_speed_test", disabled: J.value, label: A2.value.testAction, onClick: Fe }, null)]) }]);
  d(() => {
    Ne();
  });
  async function Ne() {
    let [e2, t2] = await Promise.all([I2(), i()]), n2 = r2.data.ipType === M.IPV6, a2 = n2 ? "ipv6-query-channels" : "checkChannel", o2 = t2[a2]?.find((e3) => e3.value === r2.data.checkChannel) ? r2.data.checkChannel : t2[a2]?.[0]?.value;
    o2 = n2 ? o2 : r2.data.checkChannel || e2?.ipChecker || o2;
    let s3 = (r2.data.proxyCategory || r2.data.protocol)?.split("/")[0], c2 = L(t2[a2]);
    K.value?.setInputsProps({ ipType: { value: r2.data.ipType || t2.ipType[0]?.value, options: t2.ipType }, proxyCategory: { value: !s3 || s3 === "noproxy" ? t2.protocol[0]?.value : s3?.toLocaleUpperCase(), options: t2.protocol }, checkChannel: { value: o2, options: c2 } });
  }
  function Pe() {
    let { host: e2, port: t2, proxyUserName: n2, proxyPassword: r3, ...i2 } = K.value?.getValues() ?? {};
    return { host: e2?.trim(), port: t2?.trim(), proxyUserName: n2?.trim(), proxyPassword: r3?.trim(), ...i2 };
  }
  async function Fe() {
    if (!globalThis.isElectron) return globalThis.electronAPI.send("proxy:detect", {});
    if (await K.value?.instance.validate(), !K.value?.instance.valid) return;
    let e2 = Pe();
    Y.value = !1, U.value = null, J.value = !0;
    let t2 = typeof X.value.lastCountry == "string" ? X.value.lastCountry.trim() : "", n2 = await V({ ...e2, isDirect: !1, proxyType: r2.data.proxyType ?? r2.data.buyProxyType ?? j.resource, ...t2 ? { lastCountry: t2 } : {} });
    J.value = !1, U.value = n2, X.value = { ...X.value, ...n2 }, H([{ ...n2, proxyType: j.resource }]), n2.error ? r2.showAdvertise && l(() => {
      (ke.value.$el ?? ke.value)?.scrollIntoView?.({ behavior: "smooth" });
    }) : (Y.value = !0, l(() => {
      Oe.value?.$el.scrollIntoView({ behavior: "smooth" });
    }));
  }
  function Ie(e2) {
    X.value.remark = e2;
  }
  function Le() {
    S2("buy", U.value?.preDetectLastCountry);
  }
  function Q(e2, t2) {
    return { ...X.value, ...e2, ...t2 ?? {}, protocol: e2.proxyCategory };
  }
  function Re(e2) {
    B({ showHeader: !1, modal: !0, blockScroll: !0, slots: { container: ({ hideModal: t2 }) => c(pe, { formData: e2, isDirect: !1, onClose: t2, onConfirm: async (n2) => {
      await r2.onConfirm?.(Q(e2, n2)), t2();
    } }) } });
  }
  async function $() {
    if (await K.value?.instance.validate(), !K.value?.instance.valid) return;
    let e2 = Pe();
    G2.value ? Re(e2) : (Y.value || await Fe(), K.value?.instance.valid && await r2.onConfirm?.(Q(e2)));
  }
  return s2({ submit: $ }), (t2, n2) => {
    let i2 = oe, a2 = m("i18n-t");
    return p(), x("div", ge, [r2.showAdvertise ? (p(), D(W, { key: 0, onBuy: Le })) : E("", !0), !w(G2) && !w(Ee)?.createProxyVideoEntryStatus ? (p(), D(me, { key: 1, class: "shrink-0", "video-type": "proxy_management", autoplay: !1 }, { default: T(({ onPlay: e2 }) => [b("div", { class: "flex items-center justify-start pa-3 gap-2.5 rounded-xl video", onClick: e2 }, [b("div", ve, [O(i2, { name: "base/rx_ic_play", color: "var(--pattern-tutorial-video-bg-icon)" })]), b("div", ye, [b("div", be, [b("span", xe, C(w(A2).tutorialTitle), 1), O(i2, { class: "cursor-pointer", name: "base/rx_ic_delete", color: "var(--colors-icon-icon-tertiary)", onClick: n2[0] ||= k((e3) => w(De)("createProxyVideoEntryStatus"), ["stop"]) })]), b("div", Se, C(w(A2).tutorialDesc), 1)])], 8, _e)]), _: 1 })) : E("", !0), b("div", Ce, [w(Me) ? (p(), D(fe, { key: 0, ref: "form", inputs: w(Me) }, null, 8, ["inputs"])) : E("", !0), O(w(ce), { ref: "alert", visible: w(Y), "onUpdate:visible": n2[1] ||= (e2) => h(Y) ? Y.value = e2 : null, class: "shrink-0 !w-full", type: "success", title: t2.$t("\u6D4B\u8BD5\u6210\u529F") }, { content: T(() => [O(a2, { class: "whitespace-pre-wrap", tag: "div", scope: "global", keypath: t2.$t(`\u4F4D\u7F6E: {location}
IP: {ip}
\u65F6\u533A: {timezone}`, { location: `${w(U)?.lastCountry ?? ""}${w(e)("/", w(U)?.lastCity)}`, ip: w(U)?.lastIp, timezone: w(U)?.timezone }) }, null, 8, ["keypath"])]), _: 1 }, 8, ["visible", "title"]), r2.showAdvertise && w(U)?.error ? (p(), D(W, { key: 1, ref: "advertiseFail", variant: "fail", onBuy: Le }, null, 512)) : E("", !0)]), b("div", we, [u(t2.$slots, "footer", { submit: $ }, () => [b("div", Te, [O(w(F), { size: "sm", label: t2.$t("\u4FDD\u5B58"), onClick: $ }, null, 8, ["label"]), r2.showRemark ? (p(), D(w(ae), { key: 0, title: w(A2).remarkTitle, label: t2.$t("\u5907\u6CE8"), mode: "button", value: w(X).remark, "on-confirm": Ie }, null, 8, ["title", "label", "value"])) : E("", !0)])], !0)])]);
  };
} }), [["__cssModules", { $style: { host: "_host_bgufg_1", dot_eparator: "_dot_eparator_bgufg_5" } }], ["__scopeId", "data-v-62671e31"]]);
export {W as n,G as t};
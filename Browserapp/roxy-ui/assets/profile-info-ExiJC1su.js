import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {Ar as e,Cr as t,ar as n,cr as r,fr as i,h as a,mn as o,nn as s,o as c,qt as l,r as u,vt as d,yt as f} from "./utils-BIWenCnY.js";
import {C as p,D as m,Dt as h,Et as g,J as _,L as v,P as y,R as b,St as x,V as S,W as C,_t as w,at as T,bt as E,d as D,en as O,f as k,h as A,i as j,in as M,jt as N,k as P,lt as F,m as I,p as L,q as R,rn as z,st as B,ut as V,v as H,x as U} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as ee,o as W} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {n as te} from "./agent-BmSFI9WH.js";
import {i as ne,n as G} from "./permission-DOhNJfB3.js";
import {a as K,d as q,f as re,i as ie,s as J,t as oe,u as Y} from "./useProfileProxy-Cbqapbxb.js";
import {m as X,n as se,o as ce,t as le} from "./proxy-D7e36h-l.js";
import {b as ue} from "./rich-html-link-VdBpR3Cm.js";
import {r as de,s as fe,t as pe} from "./ry-table-do6kugym.js";
import {Z} from "./basecomponent-ClhuVxJN.js";
import {t as me} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as he} from "./useconfirm-CV4GTWBW.js";
import {t as ge} from "./tooltip-BYYKWrvu.js";
import {n as _e} from "./theme-mq6SsndU.js";
import {t as ve} from "./rx-button-DyzuUt-V.js";
import {t as ye} from "./rx-divider-Ci3C58Q3.js";
import {t as be} from "./rx-alert-A_y5uvgP.js";
import {t as xe} from "./rx-tooltip-BnCRxqlH.js";
import {t as Se} from "./usePopupMenu-BRw1zJ0m.js";
import {t as Ce} from "./custom-empty-CChX4pJt.js";
import {a as we,m as Te,n as Ee,o as De,t as Oe} from "./hooks-Jw3GridD.js";
import {t as ke} from "./form-BQBA_XzO.js";
import {t as Q} from "./platform-icon-Cvcj894X.js";
import {n as Ae,t as je} from "./earth-DQKkazIm.js";
import {a as Me,i as Ne,o as Pe,t as Fe} from "./useProxyFormDrawer-r-7UykRS.js";
import {t as Ie} from "./useOperationTrack-BXe8Vwhz.js";
import {c as Le,o as Re,s as ze,t as Be,u as Ve} from "./quick-kroUOSn_.js";
import {t as He} from "./quick-CZrtqSCy.js";
import {t as Ue} from "./rx-select-button-DQtmZ0kT.js";
import {a as We,c as Ge,l as Ke,n as qe,o as Je,t as Ye} from "./operation-zwm3okqF.js";
import {t as Xe} from "./custom-filters-D_902RzL.js";
var Ze = { class: "flex flex-col gap-2 max-w-100" };
var Qe = { class: "flex flex-col gap-1" };
var $e = { key: 0, class: "primary" };
var et = { class: "primary" };
var tt = { key: 0, class: "secondary" };
var nt = me(p({ __name: "account-tooltip", props: { platformList: { type: Array, required: !0 } }, setup(e2) {
  return (t2, n2) => {
    let r2 = Z;
    return C(), A("div", Ze, [(C(!0), A(j, null, R(e2.platformList, (t3) => (C(), A("div", { key: t3.platformUrl, class: "flex gap-1.5" }, [t3.platformIcon ? (C(), L(Q, { key: 0, class: "w-4 h-4", "platform-icon": t3.platformIconDark, "platform-icon-dark": t3.platformIconDark }, null, 8, ["platform-icon", "platform-icon-dark"])) : (C(), L(r2, { key: 1, name: "base/rx_ic_user_key", color: "var(--component-tooltip-text-primary)" })), k("div", Qe, [e2.platformList.length === 1 ? (C(), A(j, { key: 1 }, [k("div", et, M(t3.platformUrl), 1), t3.platformUserName ? (C(), A("div", tt, M(t3.platformUserName), 1)) : I("", !0)], 64)) : (C(), A("div", $e, M(t3.platformUserName || "--"), 1))])]))), 128))]);
  };
} }), [["__scopeId", "data-v-233bbaf5"]]);
var at = 1 / 3;
var $ = 1 / 6;
var ot = (e2) => Math.floor(e2) | 0;
var st = new Float64Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
function ct(e2 = Math.random) {
  let t2 = lt(e2), n2 = new Float64Array(t2).map((e3) => st[e3 % 12 * 3]), r2 = new Float64Array(t2).map((e3) => st[e3 % 12 * 3 + 1]), i2 = new Float64Array(t2).map((e3) => st[e3 % 12 * 3 + 2]);
  return function(e3, a2, o2) {
    let s2, c2, l2, u2, d2 = (e3 + a2 + o2) * at, f2 = ot(e3 + d2), p2 = ot(a2 + d2), m2 = ot(o2 + d2), h2 = (f2 + p2 + m2) * $, g2 = f2 - h2, _2 = p2 - h2, v2 = m2 - h2, y2 = e3 - g2, b2 = a2 - _2, x2 = o2 - v2, S2, C2, w2, T2, E2, D2;
    y2 >= b2 ? b2 >= x2 ? (S2 = 1, C2 = 0, w2 = 0, T2 = 1, E2 = 1, D2 = 0) : y2 >= x2 ? (S2 = 1, C2 = 0, w2 = 0, T2 = 1, E2 = 0, D2 = 1) : (S2 = 0, C2 = 0, w2 = 1, T2 = 1, E2 = 0, D2 = 1) : b2 < x2 ? (S2 = 0, C2 = 0, w2 = 1, T2 = 0, E2 = 1, D2 = 1) : y2 < x2 ? (S2 = 0, C2 = 1, w2 = 0, T2 = 0, E2 = 1, D2 = 1) : (S2 = 0, C2 = 1, w2 = 0, T2 = 1, E2 = 1, D2 = 0);
    let O2 = y2 - S2 + $, k2 = b2 - C2 + $, A2 = x2 - w2 + $, j2 = y2 - T2 + 2 * $, M2 = b2 - E2 + 2 * $, N2 = x2 - D2 + 2 * $, P2 = y2 - 1 + 3 * $, F2 = b2 - 1 + 3 * $, I2 = x2 - 1 + 3 * $, L2 = f2 & 255, R2 = p2 & 255, z2 = m2 & 255, B2 = 0.6 - y2 * y2 - b2 * b2 - x2 * x2;
    if (B2 < 0) s2 = 0;
    else {
      let e4 = L2 + t2[R2 + t2[z2]];
      B2 *= B2, s2 = B2 * B2 * (n2[e4] * y2 + r2[e4] * b2 + i2[e4] * x2);
    }
    let V2 = 0.6 - O2 * O2 - k2 * k2 - A2 * A2;
    if (V2 < 0) c2 = 0;
    else {
      let e4 = L2 + S2 + t2[R2 + C2 + t2[z2 + w2]];
      V2 *= V2, c2 = V2 * V2 * (n2[e4] * O2 + r2[e4] * k2 + i2[e4] * A2);
    }
    let H2 = 0.6 - j2 * j2 - M2 * M2 - N2 * N2;
    if (H2 < 0) l2 = 0;
    else {
      let e4 = L2 + T2 + t2[R2 + E2 + t2[z2 + D2]];
      H2 *= H2, l2 = H2 * H2 * (n2[e4] * j2 + r2[e4] * M2 + i2[e4] * N2);
    }
    let U2 = 0.6 - P2 * P2 - F2 * F2 - I2 * I2;
    if (U2 < 0) u2 = 0;
    else {
      let e4 = L2 + 1 + t2[R2 + 1 + t2[z2 + 1]];
      U2 *= U2, u2 = U2 * U2 * (n2[e4] * P2 + r2[e4] * F2 + i2[e4] * I2);
    }
    return 32 * (s2 + c2 + l2 + u2);
  };
}
function lt(e2) {
  let t2 = new Uint8Array(512);
  for (let e3 = 0; e3 < 256; e3++) t2[e3] = e3;
  for (let n2 = 0; n2 < 255; n2++) {
    let r2 = n2 + ~~(e2() * (256 - n2)), i2 = t2[n2];
    t2[n2] = t2[r2], t2[r2] = i2;
  }
  for (let e3 = 256; e3 < 512; e3++) t2[e3] = t2[e3 - 256];
  return t2;
}
var ut = p({ __name: "canvas-line", props: { customClass: { default: "" }, containerClass: { default: "" }, colors: { default: () => ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"] }, waveWidth: { default: 50 }, backgroundFill: { default: "transparent" }, blur: { default: 10 }, speed: { default: "fast" }, waveOpacity: { default: 1 }, animate: { type: Boolean, default: !0 } }, setup(e2) {
  let t2 = e2, n2 = x(null), r2 = x(null), i2 = x(0), a2 = x(0), o2 = x(0), s2 = x(null), c2 = x(!1), l2 = ct(), u2 = () => t2.speed === "slow" ? 8e-3 : 9e-3, d2 = () => {
    let e3 = n2.value;
    !e3 || (r2.value = e3.getContext("2d"), !r2.value) || (e3.style.width = "100px", e3.style.height = "24px", i2.value = r2.value.canvas.width = 200, a2.value = r2.value.canvas.height = 48, r2.value.scale(2, 2), r2.value.filter = `blur(${t2.blur}px)`, p2());
  }, f2 = (e3) => {
    if (r2.value) {
      t2.animate && (o2.value += u2());
      for (let n3 = 0; n3 < e3; n3++) {
        r2.value.beginPath(), r2.value.lineWidth = t2.waveWidth, r2.value.strokeStyle = t2.colors[n3 % t2.colors.length];
        for (let e4 = 0; e4 < i2.value; e4 += 5) {
          let t3 = l2(e4 / 80, 0.4 * n3, o2.value) * 4;
          r2.value.lineTo(e4, t3 + a2.value * 0.25);
        }
        r2.value.stroke(), r2.value.closePath();
      }
    }
  }, p2 = () => {
    r2.value && (r2.value.clearRect(0, 0, i2.value, a2.value), t2.backgroundFill !== "transparent" && (r2.value.fillStyle = t2.backgroundFill, r2.value.globalAlpha = t2.waveOpacity, r2.value.fillRect(0, 0, i2.value, a2.value)), r2.value.globalAlpha = t2.waveOpacity, f2(5), t2.animate && (s2.value = requestAnimationFrame(p2)));
  };
  return S(() => {
    c2.value = typeof window < "u" && navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome"), d2();
  }), b(() => {
    s2.value && cancelAnimationFrame(s2.value);
  }), B(() => t2.animate, (e3) => {
    e3 && !s2.value ? p2() : !e3 && s2.value && (cancelAnimationFrame(s2.value), s2.value = null);
  }), (t3, r3) => (C(), A("div", { class: O(["flex flex-col items-center justify-center", e2.containerClass]) }, [k("canvas", { id: "canvas", ref_key: "canvasRef", ref: n2, class: "absolute z-0", style: z({ filter: N(c2) ? `blur(${e2.blur}px)` : void 0 }) }, null, 4), k("div", { class: O(["relative z-10", e2.customClass]) }, [_(t3.$slots, "default")], 2)], 2));
} });
var dt = { class: "flex flex-col h-full content" };
var ft = { class: "flex flex-1 overflow-y-auto" };
var pt = { class: "flex flex-col select-none sidebar" };
var mt = ["onClick"];
var ht = { class: "flex-1 flex justify-center sidebar-item" };
var gt = { key: 0, class: "flex flex-col flex-1 py-4 px-6 gap-6" };
var _t = { class: "flex items-center justify-between" };
var vt = { class: "subtitle" };
var yt = { class: "flex items-end" };
var bt = { class: "w-full flex justify-end gap-3 button-group" };
var xt = me(p({ __name: "batch-edit", props: { datas: { default: () => [] } }, emits: ["confirm"], setup(e2, { emit: t2 }) {
  let n2 = t2, i2 = he(), s2 = x(e2.datas.map((e3, t3) => ({ ...e3, tid: (Date.now() + t3 ** 2).toString(32), invalid: !1 }))), c2 = Object.fromEntries(s2.value.filter((e3) => !!e3.id).map((e3) => [e3.id, r(e3)])), l2 = x(s2.value[0]), u2 = x([]), d2 = T("account"), f2 = _e(), p2 = x([]);
  function m2(e3) {
    if (!l2.value) return;
    l2.value.platformIcon = e3.platformIcon, l2.value.platformIconDark = e3.platformIconDark;
    let t3 = l2.value.id ? c2[l2.value.id] : void 0;
    !e3.fromUser && t3 && (t3.platformIcon = e3.platformIcon, t3.platformIconDark = e3.platformIconDark);
  }
  function h2(e3) {
    let t3 = l2.value, n3 = e3 ?? String(d2.value?.getFieldState("platformUrl")?.value ?? t3?.platformUrl ?? ""), r2 = String(t3?.platformUrl ?? ""), i3 = ze({ platformUrl: n3, platformAbbr: n3 === r2 ? t3?.platformAbbr : void 0 }, p2.value);
    d2.value?.setInputsProps({ platformUserName: { label: i3.account }, platformPassword: { label: i3.password } });
  }
  let g2 = [{ label: $t("\u5E73\u53F0"), name: "platformUrl", render: Le, props: { placeholder: $t("\u8BF7\u8F93\u5165\u6216\u9009\u62E9\u5E73\u53F0\u7F51\u5740"), darkMode: f2.realTheme === "dark", icon: l2.value?.platformIcon || "", iconDark: l2.value?.platformIconDark || "", syncKey: l2.value?.tid || "", options: [], onIcons: m2, onUrlChange: h2 }, resolver: (e3) => e3.string().url($t("\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u5E73\u53F0\u7F51\u5740")) }, { type: "text", label: $t("\u5E73\u53F0\u767B\u5F55\u8D26\u53F7"), name: "platformUserName", props: { placeholder: $t("\u8BF7\u8F93\u5165\u8D26\u53F7") } }, { type: "password", label: $t("\u5E73\u53F0\u767B\u5F55\u5BC6\u7801"), name: "platformPassword", props: { placeholder: $t("\u8BF7\u8F93\u5165\u5BC6\u7801") } }, { type: "text", label: $t("2FA \u5BC6\u94A5"), tooltip: $t("\u4EC5\u5F53\u5E73\u53F0\u8D26\u53F7\u5DF2\u5F00\u542F\u53CC\u91CD\u9A8C\u8BC1\u65F6\u586B\u5199\uFF0C\u586B\u5199\u540E\u53EF\u7528\u4E8E\u81EA\u52A8\u751F\u6210\u9A8C\u8BC1\u7801\u3002"), name: "platformEfa", props: { placeholder: $t("\u8BF7\u8F93\u5165 2FA \u5BC6\u94A5") } }];
  B(() => f2.realTheme, () => {
    d2.value?.setInputsProps({ platformUrl: { darkMode: f2.realTheme === "dark" } });
  }), S(async () => {
    _2(l2.value);
    let { data: { rows: e3 } } = await a.platform.userGetPlatformInfoList({});
    p2.value = Re(e3), d2.value?.setInputsProps({ platformUrl: { options: Ve(e3) } }), h2();
  });
  function _2(e3 = {}) {
    let t3 = Object.fromEntries(g2.map((t4) => [t4.name, e3[t4.name]]));
    d2.value?.setValues(t3), d2.value?.setInputsProps({ platformUrl: { icon: e3.platformIcon || "", iconDark: e3.platformIconDark || "", syncKey: e3.tid || "" } }), h2(String(e3.platformUrl ?? ""));
  }
  function v2() {
    if (!d2.value?.instance.states) return;
    let e3 = Object.entries(d2.value?.instance.states).map(([e4, t3]) => [e4, t3.value]);
    e3.some(([e4, t3]) => !!t3) && e3.forEach(([e4, t3]) => {
      e4 === "platformUrl" && Reflect.set(l2.value, "invalid", !t3), Reflect.set(l2.value, e4, t3);
    });
  }
  function y2(e3) {
    v2(), l2.value = e3, _2(e3);
  }
  function b2() {
    return `${Date.now().toString(32)}${Math.random().toString(16).slice(2, 8)}`;
  }
  function w2() {
    v2();
    let e3 = { ...Object.fromEntries(g2.map((e4) => [e4.name, ""])), tid: b2(), invalid: !1 };
    s2.value.push(e3), l2.value = s2.value[s2.value.length - 1], d2.value?.reset(), _2(l2.value);
  }
  function E2() {
    i2.require({ header: $t("\u5220\u9664\u8D26\u53F7"), message: $t("\u60A8\u786E\u8BA4\u8981\u5220\u9664\u8BE5\u8D26\u53F7\u5417\uFF1F"), rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u8BA4"), severity: "danger" }, accept: () => {
      if (!s2.value.length) return;
      l2.value.id && u2.value.push(l2.value.id);
      let e3 = s2.value.findIndex((e4) => e4.tid === l2.value.tid);
      s2.value.splice(e3, 1), l2.value = s2.value[Math.max(e3 - 1, 0)] || {}, _2(l2.value);
    } });
  }
  function D2() {
    v2();
    let e3 = s2.value.find((e4) => e4.invalid);
    if (e3) {
      y2(e3), d2.value?.submit();
      return;
    }
    let t3 = s2.value.reduce((e4, t4) => {
      let { tid: n3, invalid: r2, platformUrl: i3, ...a2 } = t4;
      if (r2 || !i3) return e4;
      if (a2.id && !o(c2[a2.id], t4)) {
        let { id: t5, ...r3 } = a2;
        e4.push({ _tempId: n3, platformUrl: i3, ...r3 }), u2.value.push(t5);
      } else e4.push({ platformUrl: i3, ...a2 });
      return e4;
    }, []);
    n2("confirm", { windowPlatformList: t3, platformUrlIds: u2.value });
  }
  return (e3, t3) => {
    let n3 = Z, r2 = ve, i3 = ge;
    return C(), A("div", dt, [k("div", ft, [k("div", pt, [(C(!0), A(j, null, R(N(s2), (e4) => (C(), A("div", { key: e4.tid, class: O(["relative flex items-center justify-center sidebar-item", { active: N(l2).tid === e4.tid }]), onClick: (t4) => y2(e4) }, [e4.platformIcon ? (C(), L(Q, { key: 0, "platform-icon-dark": e4.platformIconDark, "platform-icon": e4.platformIcon, class: "sidebar-item-icon" }, null, 8, ["platform-icon-dark", "platform-icon"])) : (C(), L(n3, { key: 1, name: "base/rx_ic_user_key", size: "24" })), e4.invalid ? (C(), L(n3, { key: 2, class: "absolute top-2 right-4", name: "base/rx_ic_warn_fill", color: "var(--colors-icon-icon-error, #F53838)" })) : I("", !0)], 10, mt))), 128)), k("div", ht, [V((C(), A("div", { class: "flex justify-center items-center sidebar-add", onClick: w2 }, [U(n3, { name: "base/rx_ic_plus" })])), [[i3, e3.$t("\u6DFB\u52A0\u65B0\u8D26\u53F7")]])])]), N(s2).length > 0 ? (C(), A("div", gt, [k("div", _t, [k("div", vt, M(e3.$t("\u7F16\u8F91\u8D26\u53F7")), 1), k("div", { class: "flex items-center justify-end gap-1 select-none cursor-pointer remove", onClick: E2 }, [U(n3, { name: "base/rx_ic_bin_1" }), k("span", null, M(e3.$t("\u79FB\u9664")), 1)])]), U(ke, { ref: "account", inputs: g2 }, null, 512)])) : I("", !0)]), k("div", yt, [k("div", bt, [U(r2, { size: "sm", label: e3.$t("\u4FDD\u5B58"), onClick: D2 }, null, 8, ["label"])])])]);
  };
} }), [["__scopeId", "data-v-2c17b2b3"]]);
function St(e2) {
  let { data: t2, workspaceName: n2, drawerInstance: r2, onlyErrorToast: i2, check: o2, updateProfile: s2, saveLocalTrack: c2 } = e2, { invalidateCache: l2 } = f();
  function u2() {
    l2(d.ACCOUNT_LIST);
  }
  function p2() {
    let e3 = N(t2), l3 = N(n2);
    return [{ name: "editPlatformAccount", label: $t("\u7F16\u8F91\u8D26\u53F7"), icon: "base/rx_ic_edit", visible: o2("Profiles_edit_platform_outside") && e3.windowPlatformList.length > 0, command: async () => {
      e3.windowPlatformList = (await globalThis.__localRequest("profiles:read", { id: e3.id })).windowPlatformList, await r2.showDrawer({ title: $t("\u4E3A[{workspaceName}-{uid}]\u7F16\u8F91\u5E73\u53F0\u8D26\u53F7", { workspaceName: l3, uid: e3.windowSortNum }), dismissable: !1, slots: { container: () => m(xt, { datas: e3.windowPlatformList, onConfirm: async ({ platformUrlIds: t3, windowPlatformList: n3 }) => {
        let { code: o3, msg: s3 } = await a.window.userMdfWindowDataBatchCreate({ type: re.PlatformEdit, requestType: G.EditPlatform, ids: [e3.id], paramList: { platformUrlIds: t3, windowPlatformList: n3 } });
        r2.hideDrawer(), i2(o3, s3), o3 === 0 && (Y(e3, n3), u2());
      } }) } });
    } }, { separator: !0, visible: o2("Profiles_add_platform_outside") && e3.windowPlatformList.length > 0 }, { name: "addPlatformAccount", label: $t("\u6DFB\u52A0\u8D26\u53F7"), icon: "base/rx_ic_plus", visible: o2("Profiles_add_platform_outside"), command: async () => {
      await r2.showDrawer({ title: $t("\u4E3A[{workspaceName}-{uid}]\u6DFB\u52A0\u5E73\u53F0\u8D26\u53F7", { workspaceName: l3, uid: e3.windowSortNum }), dismissable: !1, slots: { container: () => m(Be, { showRemark: !1, showCreateMore: !1, onClose: () => {
        r2.hideDrawer();
      }, onConfirm: async (t3) => {
        let { id: n3, dirId: r3, windowPlatformList: i3 } = e3, a2 = i3.concat({ ...t3, _tempId: Date.now().toString(32) });
        await s2({ id: n3, dirId: r3, windowPlatformList: a2, requestType: G.AddPlatform }, { success: () => {
          Y(e3, a2), u2();
        } });
      } }) } });
    } }, { name: "choosePlatformAccount", label: $t("\u9009\u62E9\u8D26\u53F7"), icon: "base/rx_ic_exchange", visible: o2("Profiles_select_platform"), command: async () => {
      await r2.showDrawer({ title: $t("\u4E3A[{workspaceName}-{uid}]\u9009\u62E9\u5E73\u53F0\u8D26\u53F7", { workspaceName: l3, uid: e3.windowSortNum }), slots: { container: () => m(He, { data: e3, onConfirm: async (t3) => {
        r2.hideDrawer();
        let { id: n3, dirId: i3, windowPlatformList: a2 } = e3, o3 = t3.filter((e4) => e4.id).map((e4) => e4.id);
        await s2({ id: n3, dirId: i3, platformUrlIds: o3, requestType: G.SelectPlatform }, { success: () => {
          let n4 = a2.filter((e4) => !e4.id).concat(t3);
          Y(e3, n4), u2();
        } });
      } }) } });
    } }].map((e4) => {
      if (typeof e4.command == "function") {
        let t3 = e4.command;
        e4.command = async () => (c2(e4.name), await t3());
      }
      return e4;
    });
  }
  return { getAccountModel: p2 };
}
var Ct = { windows: "platforms/rx_os_windows", linux: "platforms/rx_os_linux", macos: "platforms/rx_os_macOS", ios: "platforms/rx_os_iOS", android: "platforms/rx_os_android" };
var wt = { [ce.success]: "var(--colors-text-text-success)", [ce.failure]: "var(--colors-text-text-error)" };
function Tt(t2, n2, r2) {
  let a2 = D(() => N(t2).proxyCategory !== "noproxy"), o2 = D(() => {
    let e2 = N(t2);
    return N(n2)?.[e2.dirId]?.data?.percent === 100;
  });
  function s2(e2, t3) {
    return e2.toLocaleLowerCase() === "macos" || e2.toLocaleLowerCase() === "ios" ? t3.split(".")[0] : t3;
  }
  function c2(e2) {
    return typeof e2 == "string" ? e2.trim() : "";
  }
  function u2(t3) {
    let n3 = t3.beforeProxyInfo, r3 = c2(t3.lastIp), o3 = c2(t3.lastCountry), s3 = c2(n3?.beforeCountry), l2 = c2(n3?.beforeIp), u3 = a2.value && !r3 && !o3 && (!!s3 || !!l2), d2 = u3 ? s3 || "--" : t3.lastCountry || "--", f2 = u3 ? n3?.beforeCity : t3.lastCity, p2 = (u3 ? n3?.beforeIp : t3.lastIp) || "--", m2 = u3 ? n3?.beforeTime : t3.checkTime;
    return { tooltip: { hasProxy: a2.value, lastCountry: d2, lastCity: e("/", f2) || "", lastIp: p2, checkTime: m2 ? i(m2) : "--", beforeCountry: u3 ? "--" : n3?.beforeCountry || "--", beforeCity: u3 ? "" : e("/", n3?.beforeCity) || "", beforeIp: u3 ? "--" : n3?.beforeIp || "--", beforeTime: !u3 && n3?.beforeTime ? i(n3.beforeTime) : "--" }, showTooltip: a2.value ? p2 !== "--" || !!d2 && d2 !== "--" : !!r3 };
  }
  return { hasProxy: a2, isOpenBrowser: o2, list: D(() => {
    let e2 = N(t2), n3 = N(r2), i2 = a2.value ? "" : e2.lastIp ? "direct-info" : "direct", o3 = e2.windowPlatformList || [], c3 = u2(e2);
    return [{ key: "os", svg: Ct[e2.os.toLocaleLowerCase()], tooltip: $t(`\u7CFB\u7EDF: {os} {osVersion}
\u5185\u6838: {coreType} {coreVersion}`, { os: e2.os === "IOS" ? "iOS" : e2.os, osVersion: s2(e2.os, e2.osVersion), coreVersion: e2.coreVersion, coreType: e2.coreType || l.Chrome }) }, { key: "proxy", classes: i2, svg: a2.value ? `country-code/${e2.lastCountry}` : e2.lastIp ? "base/rx_ic_route2" : "base/rx_ic_plus", svgColor: "var(--colors-icon-icon-tertiary)", data: c3.tooltip, showTooltip: c3.showTooltip, checkedColor: e2._checkRes && wt[e2._checkRes.checkStatus] }, { key: "account", svg: o3[0] ? "base/rx_ic_user_key" : "base/rx_ic_plus", svgColor: o3[0] ? "var(--colors-icon-icon-tertiary)" : "var(--colors-icon-icon-secondary)", showSub: o3.length > 1, platformAccount: o3[0], subPlatformAccount: o3.length > 2 ? void 0 : o3[1], data: o3 }].filter((e3) => n3.includes(e3.key));
  }) };
}
var Et = { class: "flex flex-col h-full px-4 py-4 gap-3 min-h-0" };
var Dt = { class: "flex flex-1 gap-4 min-h-0" };
var Ot = { class: "flex flex-col gap-2 shrink-0" };
var kt = { key: 0, class: "flex items-center gap-2" };
var At = { class: "text-3.5 font-600 leading-4.5" };
var jt = { class: "flex flex-wrap gap-1.5 items-center justify-between" };
var Mt = { class: "flex items-center gap-1.5 flex-wrap" };
var Nt = { class: "flex items-center gap-1.5 flex-wrap" };
var Pt = { class: "flex-ovh-1" };
var Ft = { key: 0, class: "flex flex-col w-120 shrink-0 min-w-0 min-h-0 gap-2" };
var It = { class: "flex flex-col gap-2 shrink-0" };
var Lt = { class: "flex items-center gap-2" };
var Rt = { class: "text-3.5 font-600 leading-4.5" };
var zt = { class: "flex flex-wrap gap-1.5 items-center" };
var Bt = { class: "flex-ovh-1" };
var Vt = { class: "flex h-full flex-col justify-center min-w-0" };
var Ht = { class: "text-3 font-600 leading-4 truncate" };
var Ut = { class: "text-3 tt-tertiary leading-4 truncate" };
var Wt = { class: "flex h-full items-center gap-1.5 min-w-0" };
var Gt = { key: 0, class: "inline-flex items-center gap-1 min-w-0" };
var Kt = { class: "size-4 shrink-0 overflow-hidden rounded-full border-0.5 border-[var(--colors-border-border-subtle)]" };
var qt = { class: "truncate text-3 font-500" };
var Jt = { key: 1, class: "inline-flex items-center gap-1 min-w-0" };
var Yt = { key: 2, class: "tt-tertiary text-3" };
var Xt = { key: 0, class: "inline-flex items-center gap-1 min-w-0" };
var Zt = { class: "size-4 shrink-0 overflow-hidden rounded-full border-0.5 border-[var(--colors-border-border-subtle)]" };
var Qt = { class: "truncate text-3 font-500" };
var en = { key: 1, class: "inline-flex items-center gap-1 min-w-0" };
var tn = { class: "flex items-center justify-between gap-3 shrink-0 border-t border-[var(--colors-border-divider)]" };
var nn = { key: 0, class: "text-3 tt-secondary" };
var rn = { key: 1 };
var an = p({ __name: "proxy-pick-drawer", props: { windows: {}, workspaceName: {}, data: {}, onConfirm: { type: Function } }, setup(e2) {
  let t2 = D(() => e2.windows.length > 1), r2 = ue(), { buyProxy: i2 } = Ee(), { testProxy: o2, batchTestShowToast: s2 } = Oe(), [l2, d2] = te(), f2 = Ye(), p2 = T("agent"), m2 = E({ list: [{ name: "proxyType", value: void 0, options: [{ name: $t("\u5168\u90E8"), value: void 0 }, { name: $t("\u5BFC\u5165"), value: X.resource.toString() }, { name: $t("\u6211\u8D2D\u4E70\u7684"), value: X.buy.toString() }] }], getValues() {
    return Object.fromEntries(m2.list.filter((e3) => e3.value).map((e3) => [e3.name, e3.value]));
  }, onChange() {
    ie2();
  } }), h2 = x(), _2 = x(), y2 = x({}), b2 = x(!1), S2 = x(re2(e2.data, t2.value)), P2 = x({}), z2 = x({}), B2 = x(!1), V2 = x("all"), H2 = [{ name: $t("\u5168\u90E8"), value: "all" }, { name: $t("\u5DF2\u7ED1\u5B9A"), value: "bound" }, { name: $t("\u672A\u7ED1\u5B9A"), value: "unbound" }], W2 = x([{ title: $t("\u51FA\u53E3 IP"), key: "lastCountry", slot: "outbound" }, { title: $t("\u5230\u671F\u65F6\u95F4"), key: "expireDate", slot: "expireDate" }, { title: $t("\u5E26\u5BBD"), key: "bandwidth", slot: "bandwidth" }, { title: $t("\u5DF2\u5173\u8054\u7A97\u53E3"), key: "bindList", slot: "bindList" }]), G2 = [{ title: $t("\u7A97\u53E3\u540D\u79F0"), key: "code", slot: "windowName", style: "width: 120px" }, { title: $t("\u4EE3\u7406 IP"), key: "location", slot: "proxyIp", bodyStyle: "vertical-align: middle" }], K2 = D(() => Object.keys(z2.value).length), q2 = D(() => B2.value ? !0 : t2.value ? K2.value === 0 : !S2.value);
  function re2(e3, t3) {
    if (t3) return;
    let n2 = g(e3);
    if (n2?.id != null && n2.id !== 0) return n2;
  }
  v(async () => {
    try {
      h2.value = await qe();
    } catch (e3) {
      console.error("[Profile:proxy-pick] load proxy filters failed", e3);
    }
  });
  function ie2(e3 = {}, t3 = !1) {
    let n2 = { ...e3, ...u(c(h2.value)) };
    y2.value = n2, p2.value?.refresh(n2, t3);
  }
  async function ae2() {
    if (!b2.value) {
      b2.value = !0;
      try {
        await p2.value?.refresh(y2.value, !1);
      } finally {
        b2.value = !1;
      }
    }
  }
  async function J2(e3) {
    let n2 = await We({ ...m2.getValues(), ...e3, type: se.UseDeploy });
    if (n2.code === 0 && (_2.value = n2.data.rows, !t2.value && S2.value?.id != null)) {
      let e4 = n2.data.rows.find((e5) => Number(e5.id) === Number(S2.value?.id));
      e4 && (S2.value = e4);
    }
    return n2;
  }
  function oe2(e3) {
    let { key: t3, value: n2 } = e3 || {};
    ie2({ queryKey: n2 && (t3 || "fuzzy"), queryValue: n2 }, !0);
  }
  async function Y2() {
    _2.value?.length ? await ce2(_2.value) : d2(-1, $t("\u6682\u65E0\u4EE3\u7406 IP"));
  }
  async function ce2(e3) {
    let t3 = e3.map((e4) => (fe(e4, "test", !0), async () => {
      let t4 = await o2({ ...g(e4), apiCheck: e4.proxyType === X.buy });
      return fe(e4, "test", !1), Object.assign(e4, { ...t4, _checkRes: g(t4) }), P2.value[e4.id] = t4.checkStatus, { ...t4, id: e4.id, proxyType: e4.proxyType };
    })), r3 = await n(t3, 5);
    return s2(r3, { reCheck: () => ce2(e3) }), r3.filter((e4) => e4.proxyType === X.resource).length && a.proxy.userMdfProxyModuleCreate({ proxyList: r3, requestType: ne.SpeedTest }), r3;
  }
  async function me2() {
    let e3;
    try {
      e3 = await i2({ entryType: le.Immediate });
    } catch {
      return;
    }
    e3?.immediate ? await ae2() : r2.push({ name: "agent-list", query: { name: "shop", orderNo: e3?.orderNo } });
  }
  async function he2(e3) {
    if (!e3.id) return !1;
    try {
      let { code: t3, data: n2 } = await a.proxy.userGetProxyDetailMergedList({ id: String(e3.id) });
      return t3 !== 0 || !n2 ? !1 : (Object.assign(e3, n2, { id: e3.id }), !De(e3.orderStatus) && we(e3));
    } catch (e4) {
      return console.error("[Profile:proxy-pick] refresh deploying proxy failed", e4), !1;
    }
  }
  function ge2(e3) {
    S2.value && e3.id != null && !Se2(e3) && (z2.value = { ...z2.value, [e3.id]: { ...g(S2.value) } });
  }
  function _e2(e3) {
    if (e3.id == null || z2.value[e3.id] == null) return;
    let t3 = { ...z2.value };
    delete t3[e3.id], z2.value = t3;
  }
  function ye2(e3) {
    return e3.id != null && z2.value[e3.id] != null;
  }
  function xe2(e3) {
    return !!e3 && e3.proxyCategory !== "noproxy";
  }
  function Se2(e3) {
    let t3 = S2.value?.id;
    if (t3 == null || Number(t3) === 0) return !1;
    let n2 = e3.moduleId;
    return n2 == null || Number(n2) === 0 ? !1 : Number(n2) === Number(t3);
  }
  function ke2(t3) {
    let n2 = t3.windowSortNum == null ? "" : String(t3.windowSortNum), r3 = String(t3.maxWindowSort || 0).length, i3 = r3 > n2.length ? n2.padStart(r3, "0") : n2;
    return e2.workspaceName ? `${e2.workspaceName}-${i3}` : i3;
  }
  function Q2(e3) {
    return (typeof e3.windowName == "string" ? e3.windowName.trim() : "") || $t("\u672A\u547D\u540D\u7A97\u53E3");
  }
  function Ae2(e3) {
    if (!e3 || e3.proxyCategory === "noproxy") return null;
    let t3 = typeof e3.lastCountry == "string" ? e3.lastCountry.trim() : "";
    return { country: t3, label: [t3, typeof e3.lastCity == "string" ? e3.lastCity.trim() : ""].filter(Boolean).join("/") };
  }
  let je2 = D(() => e2.windows.flatMap((e3) => {
    let t3 = xe2(e3);
    if (V2.value === "bound" && !t3 || V2.value === "unbound" && t3) return [];
    let n2 = ye2(e3);
    return [{ id: e3.id, row: e3, bound: n2, bindDisabled: Se2(e3), current: Ae2(e3), next: n2 ? Ae2(z2.value[e3.id]) : null, code: ke2(e3), name: Q2(e3) }];
  }));
  async function Pe2(e3) {
    return De(e3.orderStatus) ? await he2(e3) ? e3 : void 0 : e3;
  }
  async function Fe2() {
    if (!(B2.value || q2.value)) {
      B2.value = !0;
      try {
        if (t2.value) {
          let t3 = [], n3 = !1;
          for (let r4 of e2.windows) {
            let e3 = r4.id == null ? void 0 : z2.value[r4.id];
            if (!e3) continue;
            let i4 = await Pe2(e3);
            i4 ? t3.push({ window: r4, proxy: i4 }) : n3 = !0;
          }
          if (n3 && l2(0, $t("\u5F53\u524D\u4EE3\u7406 IP \u8FD8\u5728\u90E8\u7F72\u4E2D\uFF0C\u6682\u65F6\u65E0\u6CD5\u4F7F\u7528\u3002\u5EFA\u8BAE\u66F4\u6362\u5176\u5B83\u53EF\u7528\u7684\u4EE3\u7406 IP \u6216\u7A0D\u540E\u91CD\u65B0\u6D4B\u8BD5\u5F53\u524D\u4EE3\u7406 IP\u3002")), !t3.length) return;
          await e2.onConfirm(t3);
          return;
        }
        let n2 = S2.value;
        if (!n2) return;
        let r3 = await Pe2(n2);
        if (!r3) {
          l2(0, $t("\u5F53\u524D\u4EE3\u7406 IP \u8FD8\u5728\u90E8\u7F72\u4E2D\uFF0C\u6682\u65F6\u65E0\u6CD5\u4F7F\u7528\u3002\u5EFA\u8BAE\u66F4\u6362\u5176\u5B83\u53EF\u7528\u7684\u4EE3\u7406 IP \u6216\u7A0D\u540E\u91CD\u65B0\u6D4B\u8BD5\u5F53\u524D\u4EE3\u7406 IP\u3002"));
          return;
        }
        let { loadingOperationMap: i3, _disabled: a2, ...o3 } = g(r3);
        await e2.onConfirm(o3);
      } finally {
        B2.value = !1;
      }
    }
  }
  return (n2, r3) => {
    let i3 = ve, a2 = Ue, o3 = Ce, s3 = pe, c2 = Z;
    return C(), A("div", Et, [N(t2) ? (C(), L(N(be), { key: 0, class: "!w-full shrink-0", type: "info", closable: !1, title: n2.$t("\u4E00\u4E2A\u7A97\u53E3\u53EA\u80FD\u7ED1\u5B9A\u4E00\u4E2A\u4EE3\u7406 IP\uFF0C\u4E00\u4E2A\u4EE3\u7406 IP \u53EF\u4EE5\u7ED1\u5B9A\u591A\u4E2A\u7A97\u53E3\u3002\u8BF7\u5148\u5728\u5DE6\u4FA7\u9009\u62E9\u4EE3\u7406 IP\uFF0C\u518D\u70B9\u51FB\u7A97\u53E3\u65C1\u7684\u7ED1\u5B9A\uFF0C\u6700\u540E\u786E\u8BA4\u3002") }, null, 8, ["title"])) : I("", !0), k("div", Dt, [k("section", { class: O(["flex flex-col flex-1 min-w-0 min-h-0 gap-2", { "border-r border-[var(--colors-border-divider)]": N(t2) }]) }, [k("div", Ot, [N(t2) ? (C(), A("div", kt, [r3[3] ||= k("span", { class: "flex items-center justify-center size-5 rounded-full bg-[var(--colors-background-bg-brand)] text-white text-3 font-600" }, "1", -1), k("span", At, M(n2.$t("\u9009\u62E9\u4EE3\u7406 IP")), 1)])) : I("", !0), k("div", jt, [k("div", Mt, [localCommercialComment("", !0), U(Me, { options: N(f2), search: oe2, clear: oe2 }, null, 8, ["options"]), (C(!0), A(j, null, R(N(m2).list, (e3) => (C(), L(a2, { key: e3.name, modelValue: e3.value, "onUpdate:modelValue": (t3) => e3.value = t3, options: e3.options, size: "sm", "option-label": "name", "option-value": "value", "data-key": "value", onChange: N(m2).onChange }, null, 8, ["modelValue", "onUpdate:modelValue", "options", "onChange"]))), 128)), U(Xe, { "enabled-filter-save": !1, "filters-menu": N(h2), onFilterChange: ie2 }, null, 8, ["filters-menu"])]), k("div", Nt, [U(i3, { outlined: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_speed_test", label: n2.$t("\u6D4B\u8BD5\u5168\u90E8"), onClick: ee(Y2, ["stop"]) }, null, 8, ["label"]), U(de, { loading: N(b2), onClick: ae2 }, null, 8, ["loading"])])])]), k("div", Pt, [U(s3, { ref: "agent", selection: N(S2), "onUpdate:selection": r3[0] ||= (e3) => w(S2) ? S2.value = e3 : null, columns: N(W2), "onUpdate:columns": r3[1] ||= (e3) => w(W2) ? W2.value = e3 : null, "cache-key": "proxy-pick-drawer", "table-request": J2, "selection-mode": "single", "clear-selection-on-request": !1, "show-display": !1, "show-gridlines": !1, "context-menu": !1, "multiple-operation": !1, "show-actions": !1, "show-table-header": !1, "virtual-scroller-options": { itemSize: 60 } }, { "table-empty": F(() => [U(o3, { icon: "rx_illustration_star.svg", title: n2.$t("\u6682\u65E0\u4EE3\u7406 IP") }, null, 8, ["title"])]), outbound: F(({ data: e3 }) => [U(Te, { class: "select-none", country: e3.lastCountry, city: e3.lastCity, "last-ip": e3.lastIp, time: e3.checkTime, status: N(P2)[e3.id], "badge-desc": e3.badgeTypeDesc, "is-loading": e3.loadingOperationMap?.test, "expire-status": e3.proxyExpireStatus }, null, 8, ["country", "city", "last-ip", "time", "status", "badge-desc", "is-loading", "expire-status"])]), expireDate: F(({ data: e3 }) => [U(Ke, { data: e3 }, null, 8, ["data"])]), bandwidth: F(({ data: e3 }) => [U(Ge, { data: e3 }, null, 8, ["data"])]), bindList: F(({ data: e3 }) => [U(Ne, { list: N(Je)(e3) }, null, 8, ["list"])]), _: 1 }, 8, ["selection", "columns"])])], 2), N(t2) ? (C(), A("section", Ft, [k("div", It, [k("div", Lt, [r3[4] ||= k("span", { class: "flex items-center justify-center size-5 rounded-full bg-[var(--colors-background-bg-brand)] text-white text-3 font-600" }, "2", -1), k("span", Rt, M(n2.$t("\u7ED1\u5B9A\u5230\u7A97\u53E3")), 1)]), k("div", zt, [U(a2, { modelValue: N(V2), "onUpdate:modelValue": r3[2] ||= (e3) => w(V2) ? V2.value = e3 : null, options: H2, size: "sm", "option-label": "name", "option-value": "value", "data-key": "value" }, null, 8, ["modelValue"])])]), k("div", Bt, [U(s3, { columns: G2, "data-list": N(je2), immediate: !1, paginator: !1, "show-table-header": !1, "show-display": !1, "show-actions-menu": !1, "context-menu": !1, "multiple-operation": !1 }, { windowName: F(({ data: e3 }) => [k("div", Vt, [k("div", Ht, M(e3.code), 1), k("div", Ut, M(e3.name), 1)])]), proxyIp: F(({ data: e3 }) => [k("div", Wt, [e3.current?.country ? (C(), A("div", Gt, [k("div", Kt, [U(c2, { class: "block", size: "16", fallback: "base/rx_ic_earth", name: `country-code/${e3.current.country}` }, null, 8, ["name"])]), k("span", qt, M(e3.current.label), 1)])) : e3.current ? (C(), A("div", Jt, [U(c2, { class: "shrink-0", name: "base/rx_ic_earth", size: "16", color: "var(--colors-icon-icon-tertiary)" }), k("span", { class: O(["truncate text-3", e3.current.label ? "font-500" : "tt-tertiary"]) }, M(e3.current.label || "--"), 3)])) : (C(), A("span", Yt, "--")), e3.bound ? (C(), A(j, { key: 3 }, [U(c2, { class: "shrink-0", name: "base/rx_ic_play", size: "10", color: "var(--colors-icon-icon-brand)" }), e3.next?.country ? (C(), A("div", Xt, [k("div", Zt, [U(c2, { class: "block", size: "16", fallback: "base/rx_ic_earth", name: `country-code/${e3.next.country}` }, null, 8, ["name"])]), k("span", Qt, M(e3.next.label), 1)])) : (C(), A("div", en, [U(c2, { class: "shrink-0", name: "base/rx_ic_earth", size: "16", color: "var(--colors-icon-icon-tertiary)" }), k("span", { class: O(["truncate text-3", e3.next?.label ? "font-500" : "tt-tertiary"]) }, M(e3.next?.label || "--"), 3)]))], 64)) : I("", !0)])]), actions: F(({ data: e3 }) => [e3.bound ? (C(), L(i3, { key: 0, outlined: "", severity: "secondary", size: "xxs", label: n2.$t("\u89E3\u7ED1"), onClick: (t3) => _e2(e3.row) }, null, 8, ["label", "onClick"])) : (C(), L(i3, { key: 1, outlined: "", size: "xxs", label: n2.$t("\u7ED1\u5B9A"), disabled: !N(S2) || e3.bindDisabled, onClick: (t3) => ge2(e3.row) }, null, 8, ["label", "disabled", "onClick"]))]), _: 1 }, 8, ["data-list"])])])) : I("", !0)]), k("div", tn, [N(t2) ? (C(), A("div", nn, M(n2.$t("\u5DF2\u914D\u7F6E {configured}/{total} \u4E2A\u7A97\u53E3\uFF1B\u672A\u914D\u7F6E\u7684\u7A97\u53E3\u5C06\u4FDD\u7559\u539F\u4EE3\u7406 IP\u3002", { configured: N(K2), total: e2.windows.length })), 1)) : (C(), A("div", rn)), U(i3, { label: n2.$t("\u786E\u8BA4"), disabled: N(q2), loading: N(B2), onClick: Fe2 }, null, 8, ["label", "disabled", "loading"])])]);
  };
} });
function on(e2) {
  let { data: n2, workspaceName: r2, drawerInstance: i2, emit: o2, onlyErrorToast: s2 } = e2, { showProxyFormDrawer: c2 } = Fe(i2);
  async function l2(e3, n3) {
    let { isRefresh: r3, fallback: i3, success: c3 } = { isRefresh: !1, success: () => {
    }, fallback: () => {
    }, ...n3 }, { code: l3, msg: u3 } = await a.window.userMdfWindowInfoSingleV2Create(e3);
    return s2(l3, u3), l3 === 0 ? (t(c3) && c3(), r3 && o2("refresh"), !0) : (t(i3) && i3(), !1);
  }
  function u2(e3) {
    let { id: t2, proxyCategory: r3, protocol: i3, proxyType: a2, isDirect: o3, _checkRes: s3, ...c3 } = e3, u3 = N(n2), { id: d3, dirId: f3 } = u3;
    return l2({ id: d3, dirId: f3, moduleId: t2, proxyMethod: "choose", requestType: G.SelectProxy }, { success: () => {
      Reflect.deleteProperty(u3, "_checkRes"), s3 && Reflect.set(u3, "_checkRes", g(s3)), q(u3, { ...c3, moduleId: t2, isDirect: o3, protocol: i3, proxyCategory: r3 || i3, proxyMethod: "choose", buyProxyType: a2 ?? X.resource });
    } });
  }
  function d2(e3) {
    let t2 = N(n2), { id: r3, dirId: i3 } = t2, a2 = { ...e3, id: r3, dirId: i3, moduleId: 0, proxyMethod: "custom", requestType: G.AddProxy };
    l2(a2, { success: () => {
      Reflect.deleteProperty(t2, "_checkRes"), q(t2, a2);
    } });
  }
  async function f2(e3) {
    let t2 = N(n2), i3 = N(r2);
    await c2({ title: $t("\u4E3A[{workspaceName}-{uid}]\u7F16\u8F91\u4EE3\u7406 IP", { workspaceName: i3, uid: t2.windowSortNum }), data: e3, mode: "proxy", onConfirm: async (e4) => {
      let { id: n3, dirId: r3 } = t2, i4 = { ...e4, id: n3, dirId: r3, moduleId: 0, proxyMethod: "custom", requestType: G.EditProxy };
      if (!await l2(i4, { success: () => {
        Reflect.deleteProperty(t2, "_checkRes"), q(t2, i4);
      } })) return !1;
    } });
  }
  async function p2(e3) {
    let t2 = N(n2), a2 = N(r2);
    await i2.showDrawer({ title: $t("\u4E3A[{workspaceName}-{uid}]\u9009\u62E9\u4EE3\u7406 IP", { workspaceName: a2, uid: t2.windowSortNum }), closeOnEscape: !1, pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(860px, calc(100vw - 24px))" } } }, slots: { container: () => m(an, { windows: [t2], workspaceName: a2, data: e3, onConfirm: async (e4) => {
      await u2(e4) && i2.hideDrawer();
    } }) } });
  }
  return { updateProfile: l2, setChooseProxy: u2, addCustomProxy: d2, editProxy: f2, openProxyDrawer: p2 };
}
function sn(e2) {
  let { data: t2, hasProxy: n2, buildProxyData: r2, confirmDeleteProxy: i2, check: a2, showToast: o2, openAddProxy: s2, editProxy: c2, openProxyDrawer: l2, setChooseProxy: u2, saveLocalTrack: d2, proxyCss: f2 } = e2, { purchaseImmediateOfficialProxy: p2 } = J(), { runProxySpeedTestForRows: m2 } = K();
  function h2() {
    let e3 = N(t2), h3 = r2(e3);
    return [{ name: "addProxy", label: $t("\u6DFB\u52A0\u4EE3\u7406 IP"), icon: "base/rx_ic_plus", visible: !n2.value && a2("Profiles_add_proxy_outside"), command: async () => {
      await s2();
    } }, { name: "chooseProxy", label: $t("\u9009\u62E9\u5DF2\u6709\u4EE3\u7406 IP"), icon: "base/rx_ic_exchange", visible: !n2.value && a2("Profiles_select_proxy"), command: async () => {
      await l2(h3);
    } }, { name: "checkProxy", label: $t("\u6D4B\u8BD5\u4EE3\u7406 IP"), icon: "base/rx_ic_speed_test", visible: n2.value && a2("Profiles_speed_test_proxy"), command: async () => {
      await m2([e3]);
    } }, { name: "refreshProxy", label: $t("\u5237\u65B0\u4EE3\u7406 IP"), icon: "base/rx_ic_refresh", visible: n2.value && a2("Profiles_refresh_url"), disabled: !e3.refreshUrl, command: async () => {
      let t3 = await globalThis.electronAPI.send("proxy:refreshUrl", e3.refreshUrl);
      o2(t3 ? 0 : -1, e3.refreshUrl);
    } }, { visible: n2.value && a2("Profiles_edit_proxy_outside"), separator: !0 }, { name: "editProxy", label: $t("\u7F16\u8F91\u4EE3\u7406 IP"), icon: "base/rx_ic_edit", visible: e3.buyProxyType === X.resource && n2.value && a2("Profiles_edit_proxy_outside"), command: async () => {
      e3.isEncryptProxy ? o2(-1, $t("\u8BE5\u4EE3\u7406 IP \u5DF2\u52A0\u5BC6\u65E0\u6CD5\u7F16\u8F91\uFF0C\u5982\u9700\u66F4\u6362\uFF0C\u8BF7\u5148\u5220\u9664\u6B64\u4EE3\u7406 IP \u6216\u9009\u62E9\u5176\u4ED6\u4EE3\u7406 IP")) : await c2(h3);
    } }, { name: "chooseProxy", label: $t("\u9009\u62E9\u5DF2\u6709\u4EE3\u7406 IP"), icon: "base/rx_ic_exchange", visible: n2.value && a2("Profiles_select_proxy"), command: async () => {
      await l2(h3);
    } }, { visible: a2("Cost_Center_all"), separator: !0 }, { visible: n2.value && a2("Profiles_delete_proxy_outside"), separator: !0 }, { name: "deleteProxy", label: $t("\u5220\u9664\u4EE3\u7406 IP"), icon: "base/rx_ic_bin_1", visible: n2.value && a2("Profiles_delete_proxy_outside"), command: () => {
      i2(e3);
    } }].map((e4) => {
      if (typeof e4.command == "function") {
        let t3 = e4.command;
        e4.command = async () => (d2(e4.name), await t3());
      }
      return e4;
    });
  }
  return { getProxyModel: h2 };
}
var cn = { key: 0, class: "font-[JetBrains_Mono] text-3 font-500 leading-4" };
var ln = { class: "tt-tertiary" };
var un = { class: "tt-primary" };
var dn = ["onClick"];
var fn = ["onClick"];
var pn = ["onClick"];
var mn = { key: 0, class: "state-line" };
var hn = me(p({ __name: "index", props: { workspaceName: {}, data: {}, openMessage: {}, showSort: { type: Boolean, default: !0 }, disabled: { type: Boolean, default: !1 }, readonly: { type: Boolean, default: !1 }, filterKeys: { default: () => ["os", "proxy", "account"] } }, emits: ["refresh"], setup(e2, { emit: t2 }) {
  let n2 = e2, r2 = t2, { workspaceName: i2, data: a2, showSort: o2, disabled: c2, readonly: l2 } = n2, u2 = Pe(), { showMenu: d2 } = Se(), [f2, p2] = te(), { buildProxyData: m2, confirmDeleteProxy: g2 } = ie(), { saveLocalTrack: _2 } = Ie(), { check: v2 } = s(), b2 = P(oe, null), x2 = W("proxy"), { hasProxy: S2, isOpenBrowser: w2, list: T2 } = Tt(h(n2, "data"), h(n2, "openMessage"), h(n2, "filterKeys")), { updateProfile: E2, setChooseProxy: B2, addCustomProxy: ne2, editProxy: G2, openProxyDrawer: K2 } = on({ data: h(n2, "data"), workspaceName: h(n2, "workspaceName"), drawerInstance: u2, emit: r2, onlyErrorToast: p2 });
  async function q2() {
    await b2?.openProxyBuyAddDrawer({ onBuySuccess: (e3) => B2(e3), onAddConfirm: (e3) => ne2(e3) });
  }
  let { getProxyModel: re2 } = sn({ data: h(n2, "data"), hasProxy: S2, buildProxyData: m2, confirmDeleteProxy: g2, check: v2, showToast: f2, openAddProxy: q2, editProxy: G2, openProxyDrawer: K2, setChooseProxy: B2, saveLocalTrack: _2, proxyCss: x2 }), { getAccountModel: ae2 } = St({ data: h(n2, "data"), workspaceName: h(n2, "workspaceName"), drawerInstance: u2, onlyErrorToast: p2, check: v2, updateProfile: E2, saveLocalTrack: _2 }), J2 = D(() => a2.loadingOperationMap?.checkProxy);
  function Y2(e3, t3) {
    if (!(c2 || l2)) switch (t3) {
      case "proxy": {
        let t4 = re2();
        if (t4.every((e4) => !e4.visible) || J2.value) return;
        d2(e3, { model: t4 });
        break;
      }
      case "account": {
        let t4 = ae2();
        if (t4.every((e4) => !e4.visible)) return;
        d2(e3, { model: t4 });
        break;
      }
    }
  }
  return (e3, t3) => {
    let n3 = Z, r3 = xe, s2 = ye, l3 = ge;
    return C(), A("div", { class: O(["position-relative flex h-full items-center gap-3", { grayscale: N(c2) }]) }, [N(o2) ? (C(), A("div", cn, [k("span", ln, M(N(i2)) + "-", 1), k("span", un, M(`${N(a2).windowSortNum}`.padStart(`${N(a2).maxWindowSort || 0}`.length, "0")), 1)])) : I("", !0), k("div", { class: O(["position-relative flex justify-between state", { "w-34": N(T2).length > 1 }]) }, [(C(!0), A(j, null, R(N(T2), (e4) => (C(), A("div", { key: e4.key, class: "relative", onClick: ee((t4) => Y2(t4, e4.key), ["stop"]) }, [e4.key === "os" ? V((C(), A("div", { key: 0, class: O(["relative flex-cc cursor-pointer pa-1 state-icons", e4.classes]) }, [U(n3, { class: "w-4 h-4 pointer-events-none", fallback: "base/rx_ic_earth", name: e4.svg, color: e4.svgColor }, null, 8, ["name", "color"])], 2)), [[l3, { value: e4.tooltip, showDelay: 500 }, void 0, { top: !0 }]]) : e4.key === "proxy" ? (C(), L(r3, { key: 1 }, H({ default: F(({ hide: t4 }) => [k("div", { class: O(["relative flex-cc cursor-pointer pa-1 state-icons", [e4.classes, { checking: N(J2) }]]), onClick: t4 }, [N(J2) ? (C(), L(je, { key: 0, size: 16, color: "var(--colors-icon-icon-inactive)" })) : (C(), L(n3, { key: 1, class: "w-4 h-4 pointer-events-none", fallback: "base/rx_ic_earth", name: e4.svg, color: e4.checkedColor || e4.svgColor }, null, 8, ["name", "color"])), e4.checkedColor ? (C(), A("div", { key: 2, class: "absolute -top-1 -right-1 w-2 h-2 rounded-full", style: z({ background: e4.checkedColor }) }, null, 4)) : I("", !0)], 10, fn)]), _: 2 }, [e4.showTooltip ? { name: "content", fn: F(() => [U(Ae, y({ ref_for: !0 }, e4.data), null, 16)]), key: "0" } : void 0]), 1024)) : e4.key === "account" ? (C(), L(r3, { key: 2 }, H({ default: F(({ hide: t4 }) => [k("div", { onClick: t4 }, [k("div", { class: O(["relative flex-cc cursor-pointer pa-1 state-icons", e4.classes]) }, [e4.platformAccount?.platformIcon ? (C(), L(Q, { key: 0, "platform-icon": e4.platformAccount.platformIcon, "platform-icon-dark": e4.platformAccount.platformIconDark, class: "block w-4 h-4 pointer-events-none" }, null, 8, ["platform-icon", "platform-icon-dark"])) : (C(), L(n3, { key: 1, class: "w-4 h-4 pointer-events-none", fallback: "base/rx_ic_earth", name: e4.svg, color: e4.svgColor }, null, 8, ["name", "color"]))], 2), e4.showSub ? (C(), A("div", { key: 0, class: O(["absolute top-0.5 right-0 -translate-y-1/2 translate-1/2 flex-cc cursor-pointer pa-0.5 state-icons", e4.classes]) }, [e4.subPlatformAccount?.platformIcon ? (C(), L(Q, { key: 0, "platform-icon": e4.subPlatformAccount.platformIcon, "platform-icon-dark": e4.subPlatformAccount.platformIconDark, class: "block w-3 h-3 pointer-events-none" }, null, 8, ["platform-icon", "platform-icon-dark"])) : (C(), L(n3, { key: 1, class: "w-3 h-3 pointer-events-none", fallback: "base/rx_ic_earth", name: "base/rx_ic_more-h", color: e4.svgColor }, null, 8, ["color"]))], 2)) : I("", !0)], 8, pn)]), _: 2 }, [e4.data?.length > 0 ? { name: "content", fn: F(() => [U(nt, { "platform-list": e4.data }, null, 8, ["platform-list"])]), key: "0" } : void 0]), 1024)) : I("", !0)], 8, dn))), 128)), N(T2).length > 1 ? (C(), A("div", mn, [N(w2) ? (C(), L(ut, { key: 0, "wave-width": 1.2, blur: 0, speed: "fast", "wave-opacity": 1 })) : (C(), L(s2, { key: 1, class: "!w-25", "line-only": "", "line-style": "dashed", "line-color": "var(--colors-border-divider-dashed)" }))])) : I("", !0)], 2)], 2);
  };
} }), [["__cssModules", { proxy: { dot: "_dot_1g6w7_2" } }], ["__scopeId", "data-v-f8d88522"]]);
export {on as n,an as r,hn as t};
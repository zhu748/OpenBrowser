import {Cr as e,a as t,cr as n,d as r,kr as i,l as a,v as o,xr as s} from "./utils-BIWenCnY.js";
import {C as c,Et as l,F as u,P as ee,St as d,Tt as te,W as f,_t as p,at as m,d as h,en as g,f as _,h as v,i as y,in as b,jt as x,lt as ne,m as S,p as C,q as re,st as w,ut as T,x as E} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {f as ie,m as D} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as ae} from "./agent-BmSFI9WH.js";
import {v as oe} from "./dist-ufdnm93_.js";
import {Z as se} from "./basecomponent-ClhuVxJN.js";
import {t as O} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as ce} from "./ripple-DKjDc6yC.js";
import {t as le} from "./rx-button-DyzuUt-V.js";
import {t as ue} from "./rx-checkbox-BrC0MzoD.js";
import {o as de,s as fe} from "./hook-CnJE4hRq.js";
import {t as pe} from "./format-_cvrr_iF.js";
import {t as me} from "./m-input-text-JVbCgVJP.js";
import {t as he} from "./useDialog-BC-nc8J-.js";
import {t as ge} from "./usePreventMask-Cud6gNnu.js";
import {n as _e,t as ve} from "./hooks-BozaoB_u.js";
import {t as ye} from "./rx-avatar-h90aIpxl.js";
import {o as be} from "./form-BQBA_XzO.js";
import {t as xe} from "./simplePopup-D6H7ykCr.js";
var Se = { class: "flex flex-1 justify-between" };
var Ce = { class: "flex flex-1 items-center flex-wrap mr-2 gap-2" };
var k = { class: "select-none" };
var A = { key: 0, class: "cursor-pointer" };
var we = { class: "flex items-start" };
var Te = { class: "labels-actions" };
var Ee = ["for"];
var De = { key: 0, class: "flex items-center gap-2" };
var Oe = { class: "text-3.25" };
var ke = ["title"];
var Ae = ["onClick"];
var je = { class: "text-3.25" };
var j = O(c({ __name: "custom-filters", props: { currentFilter: {}, filtersMenu: { default: () => [] }, enabledFilterSave: { type: Boolean }, videoUrl: {}, saveFilters: { type: Function } }, emits: ["filterChange"], setup(c2, { emit: O2 }) {
  let j2 = O2, [Me] = he(), { showSimpleDialog: M } = xe(), { updateOnboardingTaskStatus: Ne } = ve(), { userInfo: Pe } = ae(o()), { showPreventMask: Fe, hidePreventMask: Ie } = ge(), N = m("tmenu"), Le = m("checkboxSearch"), P = d(""), F = d(""), I = d(!0), L = d(!1), R = d(!1), z = d(!1), B = d([]), V = d(""), H = te(null), U = d([]), Re = [{ label: $t("\u4FDD\u5B58\u4E3A\u65B0\u7B5B\u9009\u5668"), command: () => {
    $();
  } }], W = 0, G = null, K = "", q = /* @__PURE__ */ new Map(), ze = h(() => c2.filtersMenu.flatMap((e2) => e2.type === "switchGroup" && Array.isArray(e2.options) && e2.options.length > 0 ? e2.options.map((t2) => ({ ...t2, parentName: e2.name, type: e2.type })) : [e2])), Be = h(() => {
    let e2 = F.value.trim();
    return !e2 || !G ? B.value : G.search(e2).map((e3) => e3.item);
  }), Ve = h(() => {
    if (!R.value) return ze.value;
    let e2 = [];
    H.value && e2.push(H.value);
    let t2 = Be.value;
    return t2.length ? (e2.push(...t2), e2) : (e2.push({ rowType: "empty", text: B.value.length ? $t("\u6682\u65E0\u6570\u636E") : `${$t("\u6682\u65E0")} ${V.value}` }), e2);
  }), J = h(() => c2.filtersMenu.flatMap((e2) => {
    if (s(e2.value)) return [];
    let t2 = Array.isArray(e2.value) ? e2.type === "date" ? e2.value.map((e3) => pe(new Date(e3), "yyyy-MM-dd")).join(" ~ ") : e2.value.map((e3) => e3.label).join(", ") : e2.value;
    return [{ ...l(e2), value: t2, _text: e2._text }];
  })), Y = 0, He = oe((e2, t2) => {
    t2 === Y && (F.value = e2.trim());
  }, 200);
  w(P, (e2) => {
    He(e2, Y);
  }), w(() => c2.currentFilter?.id, (e2) => {
    L.value = !1, I.value = e2 === "rx_1000";
  });
  function Ue(e2) {
    c2.videoUrl && Pe.value.onboardingTaskStatus?.saveFilterGuideStatus === !1 ? tt() : N.value?.show(e2);
  }
  function We(e2) {
    switch (e2.type) {
      case "text":
      case "number":
      case "textarea":
      case "date":
        Ge(e2);
        break;
      case "switch":
        qe(e2);
        break;
      case "switchGroup":
        Z(e2);
        break;
      case "Checkbox":
        Je(e2);
    }
  }
  function Ge(e2) {
    N.value?.hide();
    let { type: t2, name: i2, label: a2, value: o2, icon: s2, ...l2 } = n(e2);
    M({ inputs: [{ type: t2, name: i2, label: a2, value: o2, props: l2 }], onConfirm: (e3) => {
      r(c2.filtersMenu, e3), Q();
    } });
  }
  function X() {
    Y += 1, P.value = "", F.value = "";
  }
  function Ke(e2) {
    q.clear(), Array.isArray(e2) && e2.forEach((e3) => {
      e3?.value != null && q.set(e3.value, e3);
    });
  }
  function Z(e2) {
    let n2 = t(c2.filtersMenu, e2.parentName);
    n2 && (n2.value = e2.value, n2._text = e2.text), N.value?.hide(), Q();
  }
  function qe(e2, t2 = !0) {
    e2.value = t2, N.value?.hide(), Q();
  }
  async function Je(t2) {
    if (!e(t2.getOptions)) {
      N.value?.hide();
      return;
    }
    let n2 = ++W, [r2] = await Promise.all([Promise.resolve(t2.getOptions()).catch((e2) => (console.error("[Module:custom-filters] Failed to load checkbox options", e2), [])), i(20)]);
    if (n2 !== W) return;
    let a2 = Array.isArray(r2) ? r2 : [];
    K = t2.name || "", V.value = t2.label || "", B.value = a2, Ke(t2.value), U.value = Array.isArray(t2.value) ? t2.value.map((e2) => e2.value).filter((e2) => e2 != null) : [], X(), G = null, H.value = null, R.value = !0, a2.length && t2.search && (H.value = { rowType: "search", placeholder: t2.searchPlaceholder || $t("\u641C\u7D22") }, G = new be(a2, { threshold: 0.3, ignoreLocation: !0, keys: t2.searchKeys?.length ? t2.searchKeys : ["label"] }), await u(), Le.value?.focus());
  }
  function Ye() {
    let e2 = t(c2.filtersMenu, K);
    if (!e2) return;
    let n2 = new Set(U.value), r2 = B.value.filter((e3) => e3.value != null && n2.has(e3.value)), i2 = new Set(r2.map((e3) => e3.value)), a2 = [];
    q.forEach((e3, t2) => {
      n2.has(t2) && !i2.has(t2) && a2.push(e3);
    });
    let o2 = [...r2, ...a2].map((e3) => l(e3));
    e2.value = o2.length ? o2 : null, z.value = !0;
  }
  function Xe() {
    u(Ye);
  }
  function Ze(e2) {
    e2.key !== "Escape" && e2.stopPropagation();
  }
  function Qe() {
    let e2 = ++W;
    R.value && z.value && (Q(), z.value = !1), R.value && (U.value = [], i(20).then(() => {
      W === e2 && (R.value = !1, H.value = null, G = null, B.value = [], X());
    })), Ie();
  }
  function $e(e2) {
    a(c2.filtersMenu, e2.name, "value", null), Q();
  }
  function et() {
    let e2 = c2.currentFilter?.filter_condition || {}, t2 = { ...e2, createTime: Array.isArray(e2.createTime) ? [new Date(e2.createTime[0]), new Date(e2.createTime[1])] : void 0, modfiyTime: Array.isArray(e2.modfiyTime) ? [new Date(e2.modfiyTime[0]), new Date(e2.modfiyTime[1])] : void 0 };
    c2.filtersMenu.forEach((e3) => {
      e3.value = t2[e3.name], Array.isArray(e3.items) && e3.items.forEach((n2) => {
        n2.value = t2[e3.name];
      });
    }), L.value = !1, j2("filterChange");
  }
  function Q() {
    I.value ? L.value = J.value.length > 0 : L.value = !0, j2("filterChange");
  }
  function tt() {
    Me({ showHeader: !1, modal: !0, blockScroll: !0, handleCancel: () => Ne({ saveFilterGuideStatus: !0 }), slots: { container: ({ handleCancel: e2 }) => E(_e, { title: $t("\u9AD8\u7EA7\u7B5B\u9009"), desc: ({ class: e3 }) => E("div", { class: e3 }, [$t('\u5E0C\u671B\u5FEB\u901F\u901A\u8FC7\u6761\u4EF6\u5B9A\u4F4D\u76F8\u5E94\u7A97\u53E3\uFF1F\u8BD5\u8BD5"\u9AD8\u7EA7\u7B5B\u9009"\u529F\u80FD\uFF0C\u5176\u4EA6\u53EF\u88AB\u4FDD\u5B58\u4E3A\u5E38\u9A7B"\u5206\u7EC4"\uFF01'), " "]), video: c2.videoUrl, onClose: e2, onConfirm: e2 }, null) } });
  }
  function $() {
    M({ title: $t("\u4FDD\u5B58\u7B5B\u9009\u5668"), inputs: [{ type: "text", name: "filter_name", props: { placeholder: $t("\u8BF7\u8F93\u5165\u7B5B\u9009\u5668\u540D\u79F0") }, resolver: (e2) => e2.string({ invalid_type_error: $t("\u8BF7\u8F93\u5165\u7B5B\u9009\u5668\u540D\u79F0") }).min(1, $t("\u8BF7\u8F93\u5165\u7B5B\u9009\u5668\u540D\u79F0")) }], onConfirm: (e2) => {
      c2.saveFilters?.(e2);
    } });
  }
  async function nt() {
    await c2.saveFilters?.(c2.currentFilter), L.value = !1;
  }
  return (e2, t2) => {
    let n2 = se, r2 = le, i2 = de, a2 = ue, o2 = fe, s2 = ce;
    return f(), v(y, null, [_("div", Se, [_("div", Ce, [(f(!0), v(y, null, re(x(J), (e3, t3) => (f(), v("div", { key: t3, class: "labels-item" }, [E(n2, { class: "mr-1 cursor-pointer", size: 14, name: "base/rx_ic_delete", onClick: D((t4) => $e(e3), ["stop"]) }, null, 8, ["onClick"]), _("span", k, b(e3.label), 1), e3.type === "switch" ? S("", !0) : (f(), v("span", A, ": " + b(e3._text || e3.value), 1))]))), 128)), E(r2, { severity: "secondary", size: "xxs", text: "", icon: "base/rx_ic_filter", label: x(J).length ? "" : e2.$t("\u7B5B\u9009"), disabled: c2.currentFilter?.disabledFilter, onClick: Ue }, null, 8, ["label", "disabled"])]), T(_("div", we, [_("div", Te, [E(r2, { text: "", severity: "secondary", size: "xxs", label: e2.$t("\u91CD\u7F6E"), onClick: et }, null, 8, ["label"]), x(J).length ? (f(), v(y, { key: 0 }, [x(I) ? (f(), C(r2, { key: 0, size: "xxs", label: e2.$t("\u4FDD\u5B58"), onClick: $ }, null, 8, ["label"])) : (f(), C(i2, { key: 1, label: e2.$t("\u4FDD\u5B58"), model: Re, onClick: nt }, null, 8, ["label"]))], 64)) : S("", !0), t2[5] ||= _("div", null, "|", -1)])], 512), [[ie, c2.enabledFilterSave && x(L)]])]), E(o2, { ref: "tmenu", popup: "", model: x(Ve), pt: { root: e2.classes.content, separator: e2.classes.separator, menu: { transition: e2.classes.list } }, onHide: Qe, onShow: x(Fe) }, { item: ne(({ item: r3, props: i3 }) => [r3.rowType === "empty" ? (f(), v("div", { key: 0, class: g(["max-w-60 cursor-default text-3.25 text-[var(--colors-text-text-secondary)]", e2.classes.item]) }, b(r3.text), 3)) : r3.rowType === "search" ? (f(), v("div", { key: 1, class: "w-60 px-1.5 py-1", onClick: t2[1] ||= D(() => {
    }, ["stop"]), onMousedown: t2[2] ||= D(() => {
    }, ["stop"]), onKeydown: Ze }, [E(me, { ref: "checkboxSearch", modelValue: x(P), "onUpdate:modelValue": t2[0] ||= (e3) => p(P) ? P.value = e3 : null, class: "w-full", size: "xxs", "pre-icon": "base/rx_ic_magnify", autocomplete: "off", placeholder: r3.placeholder }, null, 8, ["modelValue", "placeholder"])], 32)) : T((f(), v("a", ee({ key: 2, class: "max-w-60 cursor-pointer !p-0" }, i3.action), [x(R) ? (f(), v("label", { key: 0, class: g(["cursor-pointer", e2.classes.item]), for: r3.value, onClick: t2[4] ||= D(() => {
    }, ["stop"]) }, [E(a2, { modelValue: x(U), "onUpdate:modelValue": t2[3] ||= (e3) => p(U) ? U.value = e3 : null, name: r3.parentName, "input-id": r3.value, value: r3.value, onChange: Xe }, null, 8, ["modelValue", "name", "input-id", "value"]), typeof r3.value == "string" && r3.value.startsWith("u_") ? (f(), v("div", De, [E(x(ye), { avatar: r3.avatar, name: r3.label?.slice(0, 2), color: r3.avatarColor, size: 24, "font-size": 12 }, null, 8, ["avatar", "name", "color"]), _("span", Oe, b(r3.label), 1)])) : (f(), v("span", { key: 1, class: "ellipsis-1 text-3.25", title: r3.label }, b(r3.label), 9, ke))], 10, Ee)) : (f(), v("div", { key: 1, class: g(e2.classes.item), onClick: D((e3) => We(r3), ["stop"]) }, [r3.icon ? (f(), C(n2, { key: 0, name: r3.icon }, null, 8, ["name"])) : S("", !0), _("span", je, b(r3.label), 1)], 10, Ae))], 16)), [[s2]])]), _: 1 }, 8, ["model", "pt", "onShow"])], 64);
  };
} }), [["__cssModules", { classes: { content: "_content_1n5qc_1", list: "_list_1n5qc_7", separator: "_separator_1n5qc_11", item: "_item_1n5qc_15" } }], ["__scopeId", "data-v-48da47f4"]]);
export {j as t};
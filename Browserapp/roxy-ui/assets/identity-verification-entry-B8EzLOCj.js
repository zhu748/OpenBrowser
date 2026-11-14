import {gi as o,gr as s,qt as d,sn as f,ui as p,v as m} from "./utils-BIWenCnY.js";
import {C as _,D as v,H as S,L as ee,N as C,P as te,St as T,V as E,W as D,Y as O,Z as ne,_t as re,at as k,b as ie,ct as A,d as j,en as M,f as N,h as P,i as F,in as I,jt as L,lt as R,m as z,p as B,q as V,rt as H,st as oe,ut as U,vt as se,x as W} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as G,s as le} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {o as he} from "./dist-NctnpPRe.js";
import {a as _e} from "./agent-BmSFI9WH.js";
import {r as q,y as we} from "./rich-html-link-VdBpR3Cm.js";
import {Z as J} from "./basecomponent-ClhuVxJN.js";
import {t as Y} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {n as Oe} from "./useconfirm-CV4GTWBW.js";
import {t as ke} from "./ripple-DKjDc6yC.js";
import {t as X} from "./tooltip-BYYKWrvu.js";
import {n as Ae} from "./button-BKeo7L17.js";
import {n as je} from "./theme-mq6SsndU.js";
import {t as Z} from "./rx-button-DyzuUt-V.js";
import {m as Ne} from "./hook-CnJE4hRq.js";
import {t as Ie} from "./overlaybadge-B-go4u-h.js";
import {r as Le} from "./major-client-purchase-success-D9bdaQmg.js";
import {t as ze} from "./rx-alert-A_y5uvgP.js";
import {n as Be} from "./motion-BwnyBP9B.js";
import {t as Ve} from "./rx-tooltip-CNCSEJGC.js";
import {r as He} from "./contextmenu-BBjizTDn.js";
import {t as Ue} from "./useDialog-BC-nc8J-.js";
import {n as We} from "./roxy-claw-1j3mqM_d.js";
import {t as Ge} from "./rx-avatar-h90aIpxl.js";
import {a as Ke,i as qe,n as Je,r as Ye,t as Xe} from "./tab-6bJNMvq4.js";
import {n as Qe} from "./hooks-Jw3GridD.js";
import {t as et} from "./rx-select-button-DQtmZ0kT.js";
var st = ["href", "onClick"];
var ct = { class: "flex items-center justify-between w-full menu-title" };
var lt = ["title"];
var ut = { class: "roxy-agent-title ellipsis-1" };
var dt = { key: 0, class: "text-3", xmlns: "http://www.w3.org/2000/svg", width: "1em", height: "1em", viewBox: "0 0 20 20", fill: "none" };
var ft = { class: "flex items-center gap-2 menu-title" };
var pt = { class: "roxy-agent-title ellipsis-1" };
var mt = { key: 0, class: "new-badge" };
var ht = ["title"];
var gt = { class: "min-w-0 ellipsis-1" };
var _t = { key: 1, class: "inline-flex items-center gap-0.5" };
var yt = { key: 3, class: "flex items-center py-1 px-1.5 gap-2 rounded-1 sent" };
var bt = { class: "sent-text" };
var xt = Y(_({ __name: "menu-item-content", props: C({ item: {}, collapsed: { type: Boolean } }, { open: { type: Boolean, default: !1 }, openModifiers: {}, badgeMap: { default: () => ({}) }, badgeMapModifiers: {} }), emits: ["update:open", "update:badgeMap"], setup(e2) {
  let t2 = e2, n2 = we(), r2 = We(), { buyProxy: i2 } = Qe(), { isZh: a2 } = _e(f()), o2 = H(e2, "open"), s2 = H(e2, "badgeMap"), c2 = j(() => t2.item.children?.some((e3) => !e3.meta?.hideInMenu));
  c2.value && (o2.value = !0, A(() => {
    n2.matched.some((e3) => e3.name === t2.item.name) && (o2.value = !1), t2.collapsed && (o2.value = !0);
  }));
  function l2() {
    o2.value = !o2.value;
  }
  function u2(e3, n3) {
    if (t2.item.meta?.type === "button") {
      let n4 = t2.item.meta?.menuAction;
      n4 && Ne[n4] ? Ne[n4](e3) : t2.item.meta?.onClick?.(e3);
    } else (!c2.value || t2.item.redirect) && n3();
    s2.value[t2.item.name] && (Reflect.set(s2.value, t2.item.name, !1), localStorage.setItem("badgeMapCache", JSON.stringify(s2.value)));
  }
  let d2 = j(() => !t2.item.meta?.activeWithChildren || t2.item.name == null ? !1 : n2.matched.some((e3) => e3.name === t2.item.name));
  function p2() {
    i2().then((e3) => {
      q.emit("updateShopList", e3?.orderNo);
    });
  }
  return (t3, n3) => {
    let i3 = J, f2 = Z, m2 = O("RouterLink"), h2 = X, g2 = ke;
    return D(), P("div", { class: M(["menu-item-content", { collapsed: e2.collapsed }]) }, [W(m2, { to: { name: e2.item.name, params: e2.item.meta?.params, query: { title: e2.item.meta?.title } }, custom: "" }, { default: R(({ navigate: m3, href: _2, isActive: v2 }) => [U((D(), P("a", { class: M(["menu-item", { active: v2 || L(d2), "roxy-agent": e2.item.meta?.isRoxyAgent, "roxy-claw": e2.item.meta?.isRoxyClaw }]), href: L(c2) || e2.item.meta?.type === "button" ? void 0 : _2, onClick: G((e3) => u2(e3, m3), ["prevent"]) }, [e2.item.meta?.isRoxyClaw ? (D(), P(F, { key: 0 }, [e2.item.meta?.icon ? (D(), B(i3, { key: 0, name: e2.item.meta?.icon, class: "menu-icon", size: 18 }, null, 8, ["name"])) : z("", !0), N("div", ct, [N("div", { class: "min-w-0", title: e2.item.meta?.title }, [N("span", ut, I(e2.item.meta?.title), 1)], 8, lt), L(r2).isEnabled ? U((D(), P("svg", dt, [...n3[0] ||= [N("circle", { cx: "10", cy: "10", r: "6", fill: "var(--colors-icon-icon-success)" }, null, -1), N("circle", { cx: "10", cy: "10", r: "8", stroke: "rgba(28, 201, 77, 0.40)", "stroke-opacity": "0.4", "stroke-width": "4" }, null, -1)]])), [[h2, { value: t3.$t("RoxyClaw \u5DF2\u542F\u52A8") }]]) : z("", !0)])], 64)) : e2.item.meta?.isRoxyAgent ? (D(), P(F, { key: 1 }, [e2.item.meta?.icon ? (D(), B(i3, { key: 0, name: e2.item.meta?.icon, class: "menu-icon", size: 18 }, null, 8, ["name"])) : z("", !0), N("div", ft, [N("span", pt, I(e2.item.meta?.title), 1), e2.item.meta?.showNewBadge ? (D(), P("span", mt, I(t3.$t("\u81EA\u52A8\u5316")), 1)) : z("", !0)])], 64)) : (D(), P(F, { key: 2 }, [e2.item.meta?.icon ? (D(), B(i3, { key: 0, name: e2.item.meta?.icon, class: "menu-icon rounded-0.75", size: 18 }, null, 8, ["name"])) : z("", !0), N("div", { class: "relative flex items-center gap-1.5 overflow-hidden menu-title", title: e2.item.meta?.title }, [N("span", gt, I(e2.item.meta?.title), 1), e2.item.meta?.showNewBadge ? (D(), B(L(J), { key: 0, class: "new-badge-icon", name: "base/new_badge" })) : z("", !0), e2.item.meta?.slotName === "proxy" || e2.item.meta?.showFireBadge ? (D(), P("span", _t, [W(i3, { name: "base/fire" }), z("", !0)])) : z("", !0)], 8, ht), z("", !0), e2.item.meta?.external && !e2.collapsed ? (D(), B(i3, { key: 2, name: "base/rx_ic_arrow_top_right", class: "menu-icon external", size: 12 })) : z("", !0)], 64)), s2.value[e2.item.name] ? (D(), P("div", yt, [W(i3, { size: "12", name: "base/rx_ic_gift_2", color: "#ffffff" }), N("span", bt, I(t3.$t("\u5DF2\u53D1\u653E")), 1)])) : z("", !0), L(c2) ? (D(), B(i3, { key: 4, name: o2.value ? "base/rx_ic_plus" : "base/rx_ic_minus", class: "menu-icon plus", onClick: G(l2, ["stop"]) }, null, 8, ["name"])) : z("", !0)], 10, st)), [[g2], [h2, { value: e2.item.meta?.title, disabled: !e2.collapsed }]])]), _: 1 }, 8, ["to"])], 2);
  };
} }), [["__scopeId", "data-v-10078f4d"]]);
var St = { class: "sub-menu-clip" };
var Ct = { class: "sub-menu" };
var wt = ["onClick"];
var Tt = { class: "group-title-text" };
var Et = { key: 1, class: "line" };
var Dt = Y(_({ name: "SubMenuItem", inheritAttrs: !1, __name: "sub-menu-item", props: C({ items: {}, collapsed: { type: Boolean }, collapsedChildren: { type: Boolean }, level: { default: 0 } }, { badgeMap: {}, badgeMapModifiers: {} }), emits: ["update:badgeMap"], setup(e2) {
  le((e3) => ({ v44afe9a0: e3.level }));
  let t2 = we(), n2 = T({}), r2 = H(e2, "badgeMap"), i2 = (e3) => e3.meta?.type === "group", a2 = (e3) => e3.meta?.type === "flat", s2 = j(() => e2.collapsedChildren != null);
  function c2(t3) {
    return i2(t3) || a2(t3) ? e2.level : e2.level + 1;
  }
  function l2(t3) {
    return a2(t3) || i2(t3) && e2.collapsed ? !1 : t3.name !== void 0 && !!n2.value[t3.name];
  }
  function u2(e3) {
    e3.name !== void 0 && (n2.value[e3.name] = !n2.value[e3.name]);
  }
  return oe(() => t2.matched, (t3) => {
    for (let r3 of e2.items) i2(r3) && r3.name && (t3.some((e3) => e3.name === r3.name) || r3.children?.some((e3) => t3.some((t4) => t4.name === e3.name))) && (n2.value[r3.name] = !1);
  }, { immediate: !0 }), (t3, d2) => {
    let f2 = J, p2 = O("SubMenuItem", !0);
    return e2.items.length ? (D(), P("div", te({ key: 0 }, t3.$attrs, { class: ["sub-menu-wrap", [`level-${e2.level}`, { collapsed: e2.collapsed, collapsible: L(s2), folded: !!e2.collapsedChildren }]], style: { "--child-count": e2.items.length } }), [N("div", St, [N("div", Ct, [(D(!0), P(F, null, V(e2.items, (s3) => (D(), P(F, { key: s3.name }, [i2(s3) ? (D(), P(F, { key: 0 }, [e2.collapsed ? (D(), P("div", Et)) : (D(), P("button", { key: 0, type: "button", class: "group-title", onClick: (e3) => u2(s3) }, [N("span", Tt, I(s3.meta?.title), 1), W(f2, { name: "base/rx_ic_chevron_up", class: M(["group-chevron", { collapsed: L(n2)[s3.name] }]), size: 16 }, null, 8, ["class"])], 8, wt))], 64)) : a2(s3) ? z("", !0) : (D(), P(F, { key: 1 }, [!s3.meta?.version || L(o)(t3.$appVersion, ...s3.meta.version) ? (D(), B(xt, { key: 0, open: L(n2)[s3.name], "onUpdate:open": (e3) => L(n2)[s3.name] = e3, "badge-map": r2.value, "onUpdate:badgeMap": d2[0] ||= (e3) => r2.value = e3, class: M(`menu_${s3.name?.toString()}`), item: s3, collapsed: e2.collapsed }, null, 8, ["open", "onUpdate:open", "badge-map", "class", "item", "collapsed"])) : z("", !0)], 64)), s3.children?.length ? (D(), B(p2, { key: 2, "badge-map": r2.value, "onUpdate:badgeMap": d2[1] ||= (e3) => r2.value = e3, items: s3.children, level: c2(s3), collapsed: e2.collapsed, "collapsed-children": l2(s3) }, null, 8, ["badge-map", "items", "level", "collapsed", "collapsed-children"])) : z("", !0)], 64))), 128))])])], 16)) : z("", !0);
  };
} }), [["__scopeId", "data-v-e4514f78"]]);
var Ot = _({ __name: "download-app-button", setup(e2) {
  let { getOfficialWebsite: t2 } = f();
  function n2() {
    let e3 = t2("/download");
    window.open(e3, "_blank");
  }
  return (e3, t3) => {
    let r2 = Z, i2 = X;
    return U((D(), B(r2, { class: "shrink-0", icon: "base/rx_ic_download", size: "xs", label: e3.$t("\u4E0B\u8F7D\u5BA2\u6237\u7AEF"), onClick: n2 }, null, 8, ["label"])), [[i2, { value: e3.$t(`\u4E0B\u8F7D Roxy AI \u6D4F\u89C8\u5668\u5BA2\u6237\u7AEF
\u89E3\u9501\u66F4\u591A\u8DE8\u5883\u51FA\u6D77\u5DE5\u5177\u4E0E Roxy AI \u80FD\u529B`), pt: { root: "!max-w-60" } }, void 0, { bottom: !0 }]]);
  };
} });
var Wt = { class: "flex justify-center" };
var Gt = { class: "w-95" };
var Kt = { class: "flex py-1 px-4 justify-between items-center gap-3.5" };
var qt = ["onClick"];
var Jt = { class: "flex-1 flex flex-col gap-1.5" };
var Yt = ["innerHTML"];
var Xt = { class: "flex justify-between items-center" };
var Zt = ["onClick"];
var Qt = { key: 1, class: "flex justify-center items-center min-h-[150px] max-h-[280px] text-4" };
var en = Y(_({ __name: "notification", setup(t2) {
  const m2 = k("pop"), h2 = T([{ value: "sys", title: $t("\u7CFB\u7EDF\u901A\u77E5"), list: [], noRead: 0 }]), g2 = T("sys"), f2 = T(/* @__PURE__ */ new Set()), _2 = j(() => h2.value[0].noRead), escape = (value) => String(value).replace(/[&<>"']/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c2]);
  async function load() {
    const rows = await globalThis.__localRequest("notifications:list");
    h2.value[0].list = rows.map((row) => ({ id: row.id, status: row.read ? 1 : 0, messageModule: "sys", _icon: "status/speaker", notify: escape(row.title) + "<br><span>" + escape(row.message) + "</span>", createTime: new Date(row.at).toLocaleString() })), h2.value[0].noRead = rows.filter((row) => !row.read).length;
  }
  async function b2(event) {
    const target = event.currentTarget;
    await load(), m2.value.instance.toggle(event, target);
  }
  async function S2(row) {
    row.status || (await globalThis.__localRequest("notifications:read", { ids: [row.id] }), await load());
  }
  async function C2() {
    await globalThis.__localRequest("notifications:read"), await load();
  }
  function H2(event) {
    event.preventDefault();
  }
  function te2() {
    throw Error("\u672C\u5730\u901A\u77E5\u6CA1\u6709\u4E91\u7AEF\u8BE6\u60C5");
  }
  return ee(load), (e2, t3) => {
    let n2 = Z, r2 = Ie, i2 = Ae, a2 = Xe, o2 = Je, s2 = J, c2 = Ge, l2 = Ye, u2 = qe, d2 = Ke, p2 = He, m3 = X;
    return U((D(), P("div", Wt, [W(r2, { value: L(_2), severity: "danger", size: "small", class: M(L(_2) ? "" : e2.message.empty) }, { default: R(() => [W(n2, { severity: "secondary", icon: "base/rx_ic_mail", "aria-label": "\u901A\u77E5", outlined: "", size: "xs", onClick: b2 })]), _: 1 }, 8, ["value", "class"]), W(p2, { ref: "pop" }, { default: R(() => [N("div", Gt, [N("div", Kt, [N("div", { class: M(e2.message.title) }, I(e2.$t("\u901A\u77E5")), 3), W(n2, { severity: "secondary", size: "sm", text: "", icon: "base/rx_ic_done", label: e2.$t("\u5168\u90E8\u5DF2\u8BFB"), onClick: C2 }, null, 8, ["label"])]), W(d2, { value: L(g2), "onUpdate:value": t3[0] ||= (e3) => re(g2) ? g2.value = e3 : null }, { default: R(() => [W(o2, { pt: { tablist: "px-4 gap-4 h-[40px] !border-[var(--colors-border-border-subtle)]", activeBar: "!h-[2px]" } }, { default: R(() => [(D(!0), P(F, null, V(L(h2), (e3) => (D(), B(a2, { key: e3.title, value: e3.value, class: "flex flex-1 justify-center items-center gap-1.5" }, { default: R(() => [N("span", null, I(e3.title), 1), e3.noRead ? (D(), B(i2, { key: 0, value: e3.noRead, severity: "danger", size: "small" }, null, 8, ["value"])) : z("", !0)]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 }), W(u2, { class: "!pa-0 min-h-[100px] max-h-[280px] overflow-auto" }, { default: R(() => [(D(!0), P(F, null, V(L(h2), (t4) => (D(), B(l2, { key: t4.title, value: t4.value }, { default: R(() => [t4.list?.length ? (D(!0), P(F, { key: 0 }, V(t4.list, (n3) => (D(), P("div", { key: n3.id, class: M(["flex gap-2.5 py-3 px-4 items-start", [e2.message.item, !n3.status && e2.message.noRead]]), onClick: (e3) => S2(n3) }, [n3._icon ? (D(), B(s2, { key: 0, class: "w-5 h-5", name: n3._icon }, null, 8, ["name"])) : (D(), B(c2, { key: 1, class: M(["relative cursor-pointer aspect-square", { [e2.message.badge]: !n3.status }]), avatar: n3.avatar || (n3.messageModule === "sys" && n3.sysType === 1 ? "/images/system-notice-avatar.png" : ""), name: n3.userName?.slice(0, 2), color: n3.avatarColor, size: 24, "font-size": 12 }, null, 8, ["class", "avatar", "name", "color"])), N("div", Jt, [N("div", { class: M([t4.value, e2.message.text]), onClick: H2, innerHTML: n3.notify }, null, 10, Yt), N("div", Xt, [N("div", { class: M(e2.message.time) }, I(n3.createTime), 3), n3.paramData || L(f2).has(n3.type) || n3.windowTransferNo ? (D(), P("div", { key: 0, class: M(["flex items-center gap-1 select-none cursor-pointer", e2.message.detail]), onClick: (e3) => te2(n3) }, [N("span", null, I(e2.$t("\u67E5\u770B\u8BE6\u60C5")), 1), W(s2, { name: "base/rx_ic_chevron_right" })], 10, Zt)) : z("", !0)])])], 10, qt))), 128)) : (D(), P("div", Qt, I(e2.$t("\u6682\u65E0\u6D88\u606F")), 1))]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 })]), _: 1 }, 8, ["value"])])]), _: 1 }, 512)])), [[m3, { value: e2.$t("\u901A\u77E5"), showDelay: 600 }, void 0, { left: !0 }]]);
  };
} }), [["__cssModules", { message: { title: "_title_12ftq_1", item: "_item_12ftq_6", empty: "_empty_12ftq_14", badge: "_badge_12ftq_18", noRead: "_noRead_12ftq_29", text: "_text_12ftq_33", time: "_time_12ftq_49", detail: "_detail_12ftq_55" } }]]);
var tn = _({ __name: "reload", setup(e2) {
  function t2() {
    window.location.reload();
  }
  let n2 = p ? "\u2318 + R" : "Ctrl + R";
  return he(window, "keydown", (e3) => {
    e3.repeat || e3.altKey || e3.shiftKey || (e3.key.toLowerCase() === "r" || e3.code === "KeyR") && (e3.ctrlKey || e3.metaKey) && (e3.preventDefault(), t2());
  }), (e3, r2) => {
    let i2 = Z, a2 = X;
    return U((D(), B(i2, { class: "shrink-0", severity: "secondary", variant: "outlined", icon: "base/rx_ic_refresh", "aria-label": "\u5237\u65B0\u754C\u9762", size: "xs", onClick: t2 }, null, 512)), [[a2, { value: e3.$t("\u5237\u65B0\u754C\u9762\u3002\u82E5\u4E00\u76F4\u767D\u5C4F\uFF0C\u8BF7\u6309 {shortcut} \u518D\u5237\u65B0\u4E00\u6B21\u3002", { shortcut: L(n2) }), pt: { root: "!max-w-96" } }, void 0, { left: !0 }]]);
  };
} });
var nn = { class: "w-16 flex flex-col gap-1" };
var rn = ["src"];
var an = _({ __name: "motion-arrow", setup(e2) {
  let t2 = je(), n2 = T(), r2 = T([{ icon: s("update/update_top.svg"), darkIcon: s("update/update_top-dark.svg"), initial: { y: 6, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3, duration: 0.3 } }, { icon: s("update/update_middle.svg"), darkIcon: s("update/update_middle-dark.svg"), initial: { y: 6, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.1, duration: 0.3 } }, { icon: s("update/update_bottom.svg"), darkIcon: s("update/update_bottom-dark.svg"), initial: { y: 6, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0, duration: 0.3 } }]);
  E(() => {
    i2();
  }), S(() => {
    clearTimeout(n2.value);
  });
  function i2() {
    r2.value.forEach((e3, t3) => {
      e3.animate = { y: 0, opacity: 1 }, e3.transition = { delay: (2 - t3) * 0.1, duration: 0.3 };
    }), n2.value = setTimeout(() => {
      r2.value.forEach((e3) => {
        e3.animate = { y: 6, opacity: 0 }, e3.transition = { delay: 0, duration: 0.3 };
      }), n2.value = setTimeout(() => {
        i2();
      }, 300);
    }, 2700);
  }
  return (e3, n3) => (D(), P("div", nn, [(D(!0), P(F, null, V(L(r2), (e4) => (D(), B(L(Be).div, { key: e4.icon, class: "w-full", initial: e4.initial, animate: e4.animate, transition: e4.transition }, { default: R(() => [N("img", { class: "block w-full", src: L(t2).realTheme === "light" ? e4.icon : e4.darkIcon }, null, 8, rn)]), _: 2 }, 1032, ["initial", "animate", "transition"]))), 128))]));
} });
var sn = { class: "flex flex-col items-start self-stretch gap-3 min-h-65" };
var cn = { key: 0, class: "w-full flex flex-col items-center gap-5 pa-6 app" };
var ln = { class: "flex flex-col gap-2" };
var un = { class: "tt-primary font-[JetBrains_Mono] font-700 text-center text-4 leading-5" };
var dn = { class: "flex flex-col gap-3 w-full" };
var fn = { class: "tt-primary text-3.5 leading-5.5 font-600" };
var pn = { class: "flex flex-col gap-1.5 ma-0 pa-0 pl-6" };
var mn = { key: 1, class: "w-full flex items-start gap-2.5 px-4 py-3 patch" };
var hn = { class: "flex-1 flex flex-col gap-1" };
var gn = { class: "patch-title" };
var _n = { class: "patch-version" };
var vn = { key: 1, class: "client-no-data" };
var yn = { class: "box" };
var bn = { class: "flex flex-col items-center gap-1 self-stretch" };
var xn = { class: "version" };
var Sn = { class: "text-center tips" };
var Cn = { class: "flex items-center gap-3" };
var wn = ["href"];
var Tn = Y(_({ __name: "app-updater", props: { upgradeList: {} }, setup(e2) {
  const n2 = m(), s2 = T([]), [open] = Ue(), a2 = () => "#";
  function p2() {
    open({ header: $t("\u66F4\u65B0\u65E5\u5FD7"), slots: { default: () => v("div", { class: "pa-4 tt-secondary" }, ["OpenBrowser v" + n2.appVersion, " \u2014 " + $t("\u5BA2\u6237\u7AEF\u968F\u672C\u5730\u5B89\u88C5\u5305\u66F4\u65B0")]) } });
  }
  function l2(row) {
    return $t("\u7BA1\u7406\u4E0E\u5347\u7EA7\u5185\u6838");
  }
  function d2() {
    globalThis.__router.push("/kernels");
  }
  return (t2, r2) => {
    let i2 = Le, o2 = Z;
    return D(), P("div", sn, [e2.upgradeList.length ? (D(!0), P(F, { key: 0 }, V(e2.upgradeList, (e3) => (D(), P(F, { key: e3.releaseTime }, [e3.type === "app" ? (D(), P("div", cn, [N("div", ln, [W(an, { class: "mx-auto" }), N("div", un, " v" + I(L(n2).appVersion) + " -> v" + I(e3.version), 1)]), N("div", dn, [N("div", fn, I(t2.$t("Roxy\u6D4F\u89C8\u5668 v{version} \u73B0\u5DF2\u53D1\u5E03", { version: e3.version })), 1), L(s2)?.length ? (D(), B(i2, { key: 0, class: "max-h-30" }, { default: R(() => [N("ul", pn, [(D(!0), P(F, null, V(L(s2), (e4) => (D(), P("li", { key: e4, class: "break-all tt-secondary text-3.25 leading-4.5" }, I(e4), 1))), 128))])]), _: 1 })) : z("", !0)]), e3.status === "downloaded" ? (D(), B(o2, { key: 0, class: "w-full", size: "md", icon: "base/rx_ic_renew", label: l2(e3), onClick: (t3) => d2(e3) }, null, 8, ["label", "onClick"])) : (D(), B(o2, { key: 1, class: "w-full", size: "md", outlined: "", severity: "secondary", icon: "base/rx_ic_download", label: l2(e3), loading: e3.status === "downloading", onClick: (t3) => d2(e3) }, null, 8, ["label", "loading", "onClick"]))])) : z("", !0), e3.type === "web" ? (D(), P("div", mn, [W(L(J), { class: "flex-shrink-0", name: "base/rx_ic_patch", color: "var(--colors-icon-icon-brand)" }), N("div", hn, [N("div", gn, I(t2.$t("v{version} \u8865\u4E01", { version: e3.version })), 1), N("div", _n, I(t2.$t("\u70B9\u51FB\u5B89\u88C5\u4EE5\u5E94\u7528\u66F4\u65B0\u8865\u4E01")), 1)]), W(o2, { size: "xxs", outlined: "", severity: "secondary", icon: "base/rx_ic_refresh", label: l2(e3), loading: e3.status === "downloading", onClick: (t3) => d2(e3) }, null, 8, ["label", "loading", "onClick"])])) : z("", !0)], 64))), 128)) : (D(), P("div", vn, [N("div", yn, [W(L(J), { name: "base/logo", class: "w-12 h-12" }), N("div", bn, [N("div", xn, " v" + I(L(n2).appVersion), 1), N("div", Sn, I(t2.$t("\u60A8\u7684\u5BA2\u6237\u7AEF\u5DF2\u662F\u6700\u65B0\u7248\u672C")), 1)]), N("div", Cn, [N("a", { class: "log", href: "#", onClick: G(p2, ["prevent"]) }, I(t2.$t("\u4E0A\u6B21\u66F4\u65B0")), 1), r2[0] ||= N("span", { class: "color-[var(--component-dropdown-divider)]" }, "|", -1), N("a", { class: "log", href: "#", onClick: G(p2, ["prevent"]) }, I(t2.$t("\u66F4\u65B0\u65E5\u5FD7")), 9, wn)])])]))]);
  };
} }), [["__scopeId", "data-v-b4f2eae3"]]);
function Q(e2) {
  return e2 === d.Firefox ? d.Firefox : d.Chrome;
}
function $(e2) {
  return `${Q(e2.coreType)}:${e2.coreVersion ?? ""}`;
}
function jn(e2, t2) {
  return `${Q(e2) === d.Firefox ? "RoxyFirefox" : "RoxyChrome"} ${t2 ?? ""}`;
}
var Bn = "data:image/png;base64,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";
var Vn = "data:image/png;base64,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";
var Hn = { class: "flex flex-col items-start gap-3" };
var Un = { class: "-mb-3 flex items-center justify-between pa-3 w-full" };
var Wn = { key: 0, class: "py-2 px-4 title" };
var Gn = ["id"];
var Kn = { class: "w-full flex justify-between items-center self-stretch" };
var qn = ["onClick"];
var Jn = { class: "relative" };
var Yn = ["src"];
var Xn = { key: 0, class: "absolute top-0 right-0 w-2 h-2 bg-red rounded-full" };
var Zn = { class: "version" };
var Qn = { key: 0, class: "mt-0.5 desc" };
var $n = { class: "shrink-0 flex items-center gap-2 pr-4" };
var er = { class: "text-3 font-600 text-white w-fit" };
var tr = Y(_({ __name: "kernel-updater", props: { upgradeList: {} }, emits: ["onDownloadClick"], setup(e2, { expose: t2, emit: n2 }) {
  const f2 = T("All"), p2 = j(() => {
    const all = e2.upgradeList.flatMap((group) => group.list);
    return { available: e2.upgradeList.map((group) => ({ ...group, list: group.list.filter((row) => f2.value === "All" || row.coreType === f2.value) })).filter((group) => group.list.length), updateList: all.filter((row) => row.status === "update") };
  }), m2 = j(() => ["All", "Chrome", "Firefox"].map((value) => ({ value, name: value === "All" ? $t("\u5168\u90E8") : value, disabled: value === "Firefox" && !e2.upgradeList.flatMap((group) => group.list).some((row) => row.coreType === "Firefox") }))), u2 = T("");
  function b2(row) {
    row._light = !1;
  }
  function h2(row) {
    return row.status === "downloaded" ? $t("\u4E0B\u8F7D\u5B8C\u6210") : $t("\u4E0B\u8F7D");
  }
  function g2(row) {
    return row.status === "downloaded" ? "base/rx_ic_check" : "base/rx_ic_download";
  }
  async function v2(event, row) {
    await globalThis.ops.kernelInstallVersion(row._engine, row._version), r2("onDownloadClick", row);
  }
  async function _2() {
    for (const row of p2.value.updateList) await v2(null, row);
  }
  const confirm = Oe(), r2 = n2;
  function y2(event, row) {
    confirm.require({ target: event.currentTarget, message: $t("\u786E\u5B9A\u5220\u9664\u8BE5\u5185\u6838\u5417\uFF1F"), group: "popup", rejectProps: { label: $t("\u53D6\u6D88"), severity: "secondary", outlined: !0 }, acceptProps: { label: $t("\u786E\u5B9A"), severity: "danger" }, accept: async () => {
      await globalThis.ops.kernelDelete(row._engine, row._version), row.status = "uninstalled";
    } });
  }
  return (e3, t3) => {
    let n3 = et, r3 = Z, i2 = J, a2 = He;
    return D(), P(F, null, [N("div", Hn, [N("div", Un, [W(n3, { modelValue: L(f2), "onUpdate:modelValue": t3[0] ||= (e4) => re(f2) ? f2.value = e4 : null, options: L(m2), "option-disabled": "disabled", "option-label": "name", "option-value": "value", "data-key": "value", pt: { root: e3.select.bg, pcToggleButton: { root: e3.select.btn } } }, null, 8, ["modelValue", "options", "pt"]), L(p2).updateList.length ? (D(), B(r3, { key: 0, severity: "secondary", variant: "text", size: "xxs", icon: "base/rx_ic_renew", label: e3.$t("\u66F4\u65B0\u5168\u90E8({count})", { count: L(p2).updateList.length }), onClick: _2 }, null, 8, ["label"])) : z("", !0)]), (D(!0), P(F, null, V(L(p2).available, (t4) => (D(), P("div", { key: t4.title, class: "w-full" }, [L(p2).available.length > 1 ? (D(), P("div", Wn, I(t4.title), 1)) : z("", !0), (D(!0), P(F, null, V(t4.list, (t5) => (D(), P("div", { id: `kernel_${L($)(t5)}`, key: L($)(t5), class: M(["w-full flex flex-col items-start item", { "cursor-pointer light": t5._light }]) }, [N("div", Kn, [N("div", { class: "flex-1 flex items-center gap-1.5 py-3 pl-4", onClick: (e4) => b2(t5) }, [N("div", Jn, [N("img", { class: "block w-8 h-8", src: t5.coreType === L(d).Firefox ? L(Vn) : L(Bn) }, null, 8, Yn), t5._light ? (D(), P("div", Xn)) : z("", !0)]), N("div", null, [N("div", Zn, I(L(jn)(t5.coreType, t5.coreVersion)), 1), t5._desc ? (D(), P("div", Qn, I(t5._desc), 1)) : z("", !0)])], 8, qn), N("div", $n, [(D(), B(ne(t5.status === "downloading" ? L(Ve) : "div"), { "tooltip-content-class": "py-1 px-2" }, { default: R(() => [W(r3, { class: M({ group: t5.status === "downloading" }), severity: "secondary", variant: "outlined", size: "xxs", disabled: t5.status === "downloaded", onClick: (e4) => v2(e4, t5) }, { default: R(() => [W(i2, { class: M(["group-hover:hidden", { "loading-circle": t5.status === "downloading" }]), name: g2(t5), color: "var(--colors-icon-icon-secondary)" }, null, 8, ["class", "name"]), W(i2, { class: "hidden group-hover:block", name: "base/rx_ic_pause", color: "var(--colors-icon-icon-secondary)" }), N("span", null, I(h2(t5)), 1)]), _: 2 }, 1032, ["class", "disabled", "onClick"])]), content: R(() => [N("div", er, I(e3.$t("\u53D6\u6D88")), 1)]), _: 2 }, 1024)), W(r3, { text: "", severity: "secondary", size: "xxs", icon: "base/rx_ic_bin_1", disabled: !["downloaded", "update"].includes(t5.status), onClick: (e4) => y2(e4, t5) }, null, 8, ["disabled", "onClick"])])])], 10, Gn))), 128))]))), 128))]), W(a2, { ref: "popover" }, { default: R(() => [W(L(ze), { type: "warn", title: L(u2) }, null, 8, ["title"])]), _: 1 }, 512)], 64);
  };
} }), [["__cssModules", { select: { bg: "_bg_12mtn_1", btn: "_btn_12mtn_5" } }], ["__scopeId", "data-v-34fd05f6"]]);
var nr = ["data-force-upgrade", "data-update-info"];
var rr = { class: "header" };
var ir = { class: "title" };
var ar = Y(_({ __name: "index", props: { clientOnly: { type: Boolean, default: !1 } }, setup(e2) {
  const i2 = k("popover"), o2 = T(), s2 = T(!1), c2 = T([]), p2 = T([]), g2 = T("kernel"), h2 = T([{ title: $t("\u5BA2\u6237\u7AEF\u5347\u7EA7"), list: c2, value: "client", badge: 0, component: se(Tn) }, { title: $t("\u5185\u6838\u5347\u7EA7"), list: p2, value: "kernel", badge: 0, component: se(tr) }]), S2 = T(!1), ee2 = T(), v2 = j(() => p2.value.flatMap((group) => group.list).filter((row) => row.status === "update").length), y2 = T(!1);
  async function load() {
    const rows = await globalThis.__localRequest("kernels:list");
    p2.value = [{ title: $t("\u5185\u6838\u5217\u8868"), list: rows.map((row) => ({ coreType: row.engine === "firefox" ? "Firefox" : "Chrome", coreVersion: String(row.version).split(".")[0], status: "downloaded", _light: !1, _desc: row.version, _engine: row.engine, _version: row.version, primary: row.primary })) }];
  }
  async function re2(event) {
    const target = event.currentTarget;
    await load(), i2.value.instance.toggle(event, target);
  }
  function le2() {
    return load();
  }
  return E(load), (t2, n2) => {
    let r2 = J, i3 = Z, a2 = Ie, c3 = Ae, l2 = Xe, u2 = Je, d2 = Ye, f2 = qe, p3 = Ke, m2 = He, _2 = X;
    return U((D(), P("div", { class: "flex justify-center", "data-force-upgrade": L(S2), "data-update-info": L(ee2) }, [W(a2, { value: L(v2), severity: "danger", size: "small", class: M({ "no-message": !L(v2) }) }, { default: R(() => [W(i3, { ref: "btn", "aria-label": "\u66F4\u65B0", severity: "secondary", outlined: "", size: "xs", onClick: re2 }, { icon: R(() => [W(r2, { name: (L(y2), "base/rx_ic_upgrade"), size: "17", color: "var(--colors-icon-icon-secondary)" }, null, 8, ["name"])]), _: 1 }, 512)]), _: 1 }, 8, ["value", "class"]), W(m2, { ref: "popover", class: M(t2.popup.content), onShow: n2[1] ||= (e3) => s2.value = !0, onHide: n2[2] ||= (e3) => s2.value = !1 }, { default: R(() => [N("div", rr, [N("div", ir, I(t2.$t("\u66F4\u65B0")), 1)]), W(p3, { value: g2.value, "onUpdate:value": n2[0] ||= (e3) => g2.value = e3 }, { default: R(() => [e2.clientOnly ? z("", !0) : (D(), B(u2, { key: 0, pt: { tablist: "px-4 gap-4 h-[40px] !border-[var(--colors-border-border-subtle)]", activeBar: "!h-[2px]" } }, { default: R(() => [(D(!0), P(F, null, V(h2.value, (e3) => (D(), B(l2, { key: e3.title, value: e3.value, class: "flex flex-1 justify-center items-center gap-1.5" }, { default: R(() => [ie(I(e3.title) + " ", 1), e3.badge ? (D(), B(c3, { key: 0, value: e3.badge, severity: "danger", size: "small" }, null, 8, ["value"])) : z("", !0)]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 })), W(f2, { class: "!pa-0 min-h-25 max-h-90 overflow-auto" }, { default: R(() => [(D(!0), P(F, null, V(h2.value, (e3) => (D(), B(d2, { key: e3.value, value: e3.value, class: "overflow-hidden" }, { default: R(() => [(D(), B(ne(e3.component), { ref_for: !0, ref_key: "tabComponentRef", ref: o2, "upgrade-list": e3.list, onOnDownloadClick: le2 }, null, 40, ["upgrade-list"]))]), _: 2 }, 1032, ["value"]))), 128))]), _: 1 })]), _: 1 }, 8, ["value"])]), _: 1 }, 8, ["class"])], 8, nr)), [[_2, { value: t2.$t("\u66F4\u65B0"), showDelay: 600 }, void 0, { left: !0 }]]);
  };
} }), [["__cssModules", { popup: { content: "_content_15zc5_1" } }], ["__scopeId", "data-v-433cf647"]]);
export {Ot as a,en as i,ar as n,Dt as o,tn as r};
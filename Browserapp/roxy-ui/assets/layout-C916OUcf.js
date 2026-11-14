import {SidebarFooter as LocalSidebarFooter} from "./workbench-chrome.js";
import {Dr as o,at as ue,h as T,mt as ye,nn as Se,pr as Ee,sn as ke,tn as je,v as E,xi as Ie} from "./utils-BIWenCnY.js";
import {C as D,E as Be,F as He,P as O,St as k,V as Ye,W as A,Y as Ze,_t as j,at as $e,ct as tt,d as N,en as P,f as F,h as I,i as L,in as R,jt as z,lt as B,m as V,nn as it,p as H,st as lt,ut,x as W} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as ht} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {a as K,n as jt} from "./agent-BmSFI9WH.js";
import {n as Mt,t as Nt} from "./project-zUGx3yhI.js";
import {b as Ht,r as Wt,y as Kt} from "./rich-html-link-VdBpR3Cm.js";
import {t as Xt} from "./workspace-CNvgSgaH.js";
import {Z as q} from "./basecomponent-ClhuVxJN.js";
import {t as J} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as un} from "./ripple-DKjDc6yC.js";
import {t as dn} from "./tooltip-BYYKWrvu.js";
import {n as mn,t as hn} from "./theme-mq6SsndU.js";
import {t as Y} from "./rx-button-DyzuUt-V.js";
import {s as Nn,w as Pn} from "./hook-CnJE4hRq.js";
import {i as Ln,t as Rn} from "./useDomSpotlight-CA279FOk.js";
import {t as zn} from "./rx-divider-Ci3C58Q3.js";
import {n as Un} from "./useRouteContext-Cfh7KChG.js";
import {n as Wn} from "./m-input-select-C8pih1gY.js";
import {t as dr} from "./skeleton-CcmFVUhV.js";
import {t as fr} from "./divider-BXJIHZjP.js";
import {t as Tr} from "./rx-avatar-h90aIpxl.js";
import {t as Er} from "./iso-639-CUMONuwI.js";
import {a as jr,i as Mr,n as Nr,o as Pr,r as Fr} from "./identity-verification-entry-B8EzLOCj.js";
import {t as Kr} from "./useTutorialEntityLabels-BJzywsZZ.js";
var xi = { render: () => null };
var Pi = { render: () => null };
function Vi(e3) {
  return [
    { path: "browser", name: "browser", meta: { title: $t("\u7A97\u53E3\u7BA1\u7406"), icon: "base/rx_ic_browser" } },
    { path: "projects", name: "projects", meta: { title: $t("\u9879\u76EE\u7BA1\u7406"), icon: "base/rx_ic_stack" }, children: e3.projectChildren },
    { path: "proxy", name: "agent-list", meta: { title: $t("\u4EE3\u7406 IP"), icon: "base/rx_ic_internet" } },
    { path: "account", name: "local-account-root", meta: { title: $t("\u5E73\u53F0\u8D26\u53F7"), icon: "base/rx_ic_keys" } },
    { path: "extensions", name: "local-extensions", meta: { title: $t("\u6269\u5C55\u4E2D\u5FC3"), icon: "base/rx_ic_extension_store" } },
    { path: "automation", name: "local-automation-group", meta: { title: $t("AI & \u81EA\u52A8\u5316"), type: "group" }, children: [
      { path: "sync-control", name: "local-synchronizer", meta: { title: $t("\u7A97\u53E3\u540C\u6B65"), icon: "base/rx_ic_frame_stack" } },
      { path: "roxy-agent", name: "agent-console-chat", meta: { title: "AI Agent", icon: "roxy-agent/rx-ic-logo", isRoxyAgent: !0, showNewBadge: !0 } },
      { path: "template-store", name: "agent-console-template-store", meta: { title: $t("\u6A21\u677F\u5546\u57CE"), icon: "roxy-agent/rx-ic-templates-store" } },
      { path: "task-manager", name: "agent-console-task-manager", meta: { title: $t("\u4EFB\u52A1\u7BA1\u7406"), icon: "roxy-agent/rx-ic-task-manager" } },
      { path: "my-templates", name: "agent-console-my-templates", meta: { title: $t("\u6211\u7684\u6A21\u677F"), icon: "roxy-agent/rx-ic-templates" } },
      { path: "api-keys", name: "api-keys", meta: { title: "API & AI MCP", icon: "base/rx_ic_doc_code" } },
      { path: "skills", name: "local-agent-skills", meta: { title: "Skill \u7BA1\u7406", icon: "base/rx_ic_doc_code" } }
    ] }
  ];
}
var Hi = { key: 0, class: "flex items-center gap-1.5" };
var Ui = { class: "relative flex-1 min-h-0 overflow-hidden" };
var Wi = { class: "h-full flex flex-col items-start self-stretch gap-3 overflow-y-auto menu" };
var Gi = J(D({ __name: "index", props: { collapsed: { type: Boolean, default: !1 } }, setup(e3) {
  let t2 = Kt(), n2 = Ht(), r2 = ue(), i2 = Nt(), { currentWorkspace: a2 } = K(ye()), { ctx: s2 } = Un(), c2 = Kr(), { siteLocale: l2 } = K(ke()), { check: u2 } = Se(), { handleBusinessCode: d2 } = Pn(), [, f2] = jt(), p2 = k(o(localStorage.getItem("badgeMapCache") || {})), m2 = k(), h2 = N(() => i2.projects.filter((e4) => e4.pinStatus === Mt.pinned).slice(0, 5).map((e4) => ({ path: ":id", name: "project-item", meta: { title: e4.projectName, params: { id: e4.project_id } } }))), g2 = N(() => i2.projects.filter((e4) => e4.pinStatus === Mt.pinned).slice(0, 5).map((e4) => ({ path: ":id", name: "ecommerce-group-item", meta: { title: e4.projectName, params: { id: e4.project_id } } }))), _2 = N(() => Vi({ ctx: s2.value, siteLocale: l2.value, projectChildren: s2.value.isNormal ? h2.value : void 0, ecommerceGroupChildren: s2.value.isEcommerce ? g2.value : void 0, checkPermission: u2 }));
  lt(a2, (e4, t3) => {
    e4?.id && e4.id !== t3?.id && (r2.isOwner || e4.workspaceType !== je.Public) && setTimeout(() => {
      i2.getProjects();
    });
  }, { immediate: !0 }), Wt.on("badgeMap", (e4) => {
    Reflect.has(p2.value, e4) || Reflect.set(p2.value, e4, !0);
  }), Wt.on("asideMenuGuide", v2);
  function v2() {
    s2.value.isEcommerce || (m2.value = Ee({ showProgress: !1, disableActiveInteraction: !1, allowClose: !0, overlayClickBehavior: "close", showButtons: ["close"], stagePadding: 0, popoverOffset: 20, steps: [{ element: "#NEW_PROFILE", popover: { description: c2.value.createEntityGuideDesc, side: "right", align: "center" }, onHighlightStarted: () => {
      He(() => {
        requestAnimationFrame(() => {
          Ln("#NEW_PROFILE");
        });
      });
    } }], onDestroyed: () => {
      Rn();
    } }), m2.value.drive());
  }
  async function y2() {
    let { code: e4, msg: t3 } = await T.window.userCheckWindowTotalCountList();
    return e4 === 0 || (d2(e4, () => f2(e4, t3)), !1);
  }
  async function b2() {
    if (!await y2()) return;
    let e4 = t2.name === "project-item" ? { projectId: t2.params.id } : {};
    m2.value && (m2.value.destroy(), m2.value = void 0, Reflect.set(e4, "driver", 1)), n2.push({ name: "browser-create", query: e4 });
  }
  function x2() {
    let e4 = t2.name === "ecommerce-group-item" ? { projectId: String(t2.params.id) } : {};
    n2.push({ name: "ecommerce-account-create", query: e4 });
  }
  return (t3, n3) => {
    let r3 = Y;
    return A(), I("aside", { class: P(["relative -mt-6.5 pt-5.25 -mb-3 pb-3 -ml-0.5 pl-0.5 -mr-0.75 pr-0.75 flex-1 flex flex-col self-stretch gap-3 aside", { collapsed: e3.collapsed }]) }, [z(u2)("Profiles_add") && (z(s2).isNormal || z(s2).isEcommerce) ? (A(), I("div", Hi, [z(s2).isNormal ? (A(), H(r3, { key: 0, id: "NEW_PROFILE", class: "!h-9 new-profile-btn", size: "md", icon: "base/rx_ic_browser_add", label: e3.collapsed ? void 0 : t3.$t("\u521B\u5EFA\u7A97\u53E3"), onClick: b2 }, null, 8, ["label"])) : V("", !0), z(s2).isEcommerce ? (A(), H(r3, { key: 1, id: "NEW_ACCOUNT", class: "!h-9 new-profile-btn", size: "md", icon: "base/rx_ic_browser_add", label: e3.collapsed ? void 0 : t3.$t("\u521B\u5EFA\u8D26\u53F7"), onClick: x2 }, null, 8, ["label"])) : V("", !0)])) : V("", !0), F("div", Ui, [F("nav", Wi, [W(Pr, { "badge-map": z(p2), "onUpdate:badgeMap": n3[0] ||= (e4) => j(p2) ? p2.value = e4 : null, class: "relative z-1", items: z(_2), collapsed: e3.collapsed }, null, 8, ["badge-map", "items", "collapsed"])])])], 2);
  };
} }), [["__scopeId", "data-v-fa7a9b2a"]]);
var fl = LocalSidebarFooter;
var pl = { class: "flex items-center gap-1" };
var ml = { key: 1, class: "flex items-center gap-1" };
var hl = { class: "city" };
var gl = { class: "ip" };
var _l = J(D({ __name: "network", setup(e3) {
  const a2 = k({ city: "\u672C\u5730\u7F51\u7EDC", ip: "--" }), r2 = k(!1), assign = (value) => {
    a2.value = { city: value.ip ? [value.country_code, value.city].filter(Boolean).join("/") : "\u672C\u5730\u7F51\u7EDC", ip: value.ip || value.localAddress || "--" };
  };
  async function o2() {
    r2.value = !0;
    try {
      assign(await globalThis.__localRequest("host:network", { probe: !0 }));
    } finally {
      r2.value = !1;
    }
  }
  return Ye(async () => assign(await globalThis.__localRequest("host:network"))), (e4, t2) => {
    let n2 = Y, i2 = dr, s2 = dn;
    return A(), I("div", pl, [ut(W(n2, { class: "shrink-0", "aria-label": "\u5237\u65B0\u7F51\u7EDC\u5B9A\u4F4D", icon: z(a2).ip ? "base/rx_ic_location" : "base/rx_ic_location_error", severity: "secondary", outlined: "", size: "xs", onClick: o2 }, null, 8, ["icon"]), [[s2, { value: e4.$t("\u70B9\u51FB\u5237\u65B0"), showDelay: 300 }, void 0, { left: !0 }]]), z(r2) ? (A(), I(L, { key: 0 }, [W(i2, { width: "4rem", height: "12px" }), W(i2, { width: "3rem", height: "10px" })], 64)) : z(a2).ip ? ut((A(), I("div", ml, [F("div", hl, R(z(a2).city), 1), F("div", gl, " (" + R(z(a2).ip) + ") ", 1)])), [[s2, { value: e4.$t("\u5F53\u524D\u7F51\u7EDC\u5B9A\u4F4D"), showDelay: 300 }, void 0, { bottom: !0 }]]) : V("", !0)]);
  };
} }), [["__scopeId", "data-v-1794327e"]]);
var Tg = { class: "tt-primary text-3.25 font-600 leading-4" };
var Eg = { class: "flex flex-col gap-1 pa-1" };
var Dg = { class: "tt-primary text-3.25 leading-4" };
var Og = J(D({ __name: "local-profile-menu", setup() {
  const router = Ht(), user = E(), locale = ke(), appearance = mn(), menu = $e("menu"), avatar = N(() => Xt({ workspaceName: user.userInfo.userName || "OpenBrowser", size: 26, emojiFontSize: 18, textFontSize: 14 })), items = N(() => [{ label: $t("\u8BBE\u7F6E"), icon: "base/rx_ic_settings", command: () => router.push("/agent-console/settings") }, { label: "API & AI MCP", icon: "base/rx_ic_doc_code", command: () => router.push("/api-keys") }, { separator: !0 }, { label: $t("\u8BED\u8A00"), icon: "base/rx_ic_language", items: Er.map((option) => ({ ...option, isCheck: () => locale.currentLocale === option.locale, command: () => locale.setSimpleLocale(option.locale) })) }, { label: $t("\u4E3B\u9898\u6A21\u5F0F"), icon: "base/rx_ic_contrast", items: hn().map((option) => ({ ...option, isCheck: () => appearance.theme === option.value, command: () => appearance.setTheme(option.value) })) }]);
  function toggle(event) {
    return menu.value?.toggle(event), globalThis.__localRequest("settings:get").then((saved) => {
      user.userInfo.userName = saved.localUserName || "OpenBrowser";
    });
  }
  return () => {
    const divider = zn, tiered = Nn, ripple = un;
    return A(), I(L, null, [F("button", { type: "button", class: "flex items-center pr-1.5 pl-1 py-0.5 gap-1.5 select-none cursor-pointer rounded-1 settings", "aria-label": "\u672C\u5730\u5DE5\u4F5C\u533A\u83DC\u5355", onClick: toggle }, [W(z(Tr), it(Be(z(avatar))), null, 16), F("div", Tg, R(user.userInfo.userName || "OpenBrowser"), 1), W(z(q), { class: "cursor-pointer pointer-events-none", name: "base/rx_ic_chevron_down", size: 12 })]), W(tiered, { ref: "menu", model: z(items), popup: "", pt: { root: "!border-0.5 !min-w-60 max-w-80" } }, { start: B(() => [F("div", Eg, [F("div", { class: "pa-3 text-3.5 font-medium" }, $t("\u672C\u5730\u5DE5\u4F5C\u533A")), W(divider, { "line-only": "", "line-color": "var(--tieredmenu-separator-border-color)" })])]), item: B(({ item, props, hasSubmenu }) => [ut((A(), I("a", O({ class: "flex items-center" }, props.action), [W(z(q), { name: item.icon, color: "var(--colors-icon-icon-secondary)" }, null, 8, ["name"]), F("span", Dg, R(item.label), 1), hasSubmenu ? (A(), H(z(q), { key: 0, class: "ml-auto", name: "base/rx_ic_chevron_right" })) : V("", !0), item.isCheck?.() ? (A(), H(z(q), { key: 1, class: "ml-auto", name: "base/rx_ic_check" })) : V("", !0)], 16)), [[ripple]])]), _: 1 }, 8, ["model"])], 64);
  };
} }), [["__scopeId", "data-v-47962e3a"]]);
var Pg = { render: () => null };
var Fg = { class: "rx-layout-header", "data-testid": "workbench-header" };
var Ig = { class: "top-bar-items" };
var Lg = J(D({ __name: "index", setup(e3) {
  let t2 = globalThis.isElectron;
  return (e4, n2) => {
    let r2 = fr;
    return A(), I("div", Fg, [F("div", Ig, [W(Pg), W(_l), W(r2, { class: "!ma-0", layout: "vertical" }), z(t2) ? (A(), H(Nr, { key: 0 })) : (A(), H(jr, { key: 1 })), W(Mr), W(Fr), W(r2, { class: "!ma-0", layout: "vertical" }), W(z(Og))])]);
  };
} }), [["__scopeId", "data-v-c3fba65e"]]);
var x_ = { class: "rx-layout" };
var S_ = ["title"];
var C_ = { key: 0, class: "logo" };
var w_ = ["src"];
var T_ = { key: 1, class: "logo" };
var E_ = ["src"];
var D_ = { class: "flex-1 flex flex-col overflow-hidden" };
var O_ = { class: "flex-1 mr-4 mb-4 rounded overflow-hidden relative flex min-h-0 flex-col rx-main-content" };
var k_ = J(D({ __name: "index", setup(e3) {
  ht((e4) => ({ v55c73ff8: z(l2) }));
  let { isEcommerce: t2 } = Un(), { realTheme: n2 } = K(mn()), { currentWorkspace: i2 } = K(ye()), { currentLocale: a2, isZh: o2 } = K(ke()), s2 = N(() => !1), c2 = k(!!~~localStorage.getItem(Ie)), l2 = N(() => n2.value === "dark" ? "#FFFFFF33" : "rgba(0, 0, 0, 0.1)");
  tt(() => {
    localStorage.setItem(Ie, c2.value ? "1" : "0");
  });
  let u2 = N(() => {
    let e4 = ["zh-CN", "en"].includes(a2.value) ? a2.value : "en";
    return "/images/openbrowser-wordmark-" + (n2.value === "dark" ? "dark" : "light") + ".svg";
  }), d2 = N(() => {
    let e4 = n2.value === "dark" ? "dark" : "light";
    return o2.value ? `/images/roxybrowser1_text_${e4}_zh-CN.svg` : "/images/openbrowser-wordmark-" + (n2.value === "dark" ? "dark" : "light") + ".svg";
  });
  return (e4, n3) => {
    let r2 = q, a3 = Ze("RouterView");
    return A(), I("div", x_, [F("div", { class: P(["rx-side", { collapsed: z(c2) }]) }, [F("div", { class: "indicator", title: z(c2) ? e4.$t("\u5C55\u5F00") : e4.$t("\u6536\u8D77"), onClick: n3[0] ||= (e5) => c2.value = !z(c2) }, [W(r2, { name: "indicator/indicator_default", class: "default" }), W(r2, { name: "indicator/indicator_expand", class: "expand" }), W(r2, { name: "indicator/indicator_fold", class: "fold" })], 8, S_), z(t2) ? (A(), I("div", C_, [F("img", { src: "/images/openbrowser.png", width: 36, height: 36, alt: "OpenBrowser" }), z(c2) ? V("", !0) : (A(), I("img", { key: 0, draggable: "false", class: "block h-5", src: z(d2) }, null, 8, w_))])) : (A(), I("div", T_, [F("img", { src: "/images/openbrowser.png", width: 36, height: 36, alt: "OpenBrowser" }), z(c2) ? V("", !0) : (A(), I("img", { key: 0, draggable: "false", class: "block h-5", src: z(u2) }, null, 8, E_))])), W(Gi, { collapsed: z(c2) }, null, 8, ["collapsed"]), W(fl, { collapsed: z(c2), "onUpdate:collapsed": n3[1] ||= (e5) => j(c2) ? c2.value = e5 : null }, null, 8, ["collapsed"])], 2), F("main", D_, [W(Lg), W(xi), W(Pi), F("div", O_, [z(i2)?.id ? (A(), H(a3, { key: z(i2)?.id })) : V("", !0), W(Wn, { "model-value": z(s2), opacity: 0.9 }, null, 8, ["model-value"])])])]);
  };
} }), [["__scopeId", "data-v-15ca8d5a"]]);
export {Og as LocalProfile,k_ as default};
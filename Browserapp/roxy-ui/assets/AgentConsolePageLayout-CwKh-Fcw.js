import {C as e,F as t,G as n,J as r,R as i,St as a,V as o,W as s,at as c,d as l,en as u,f as d,h as f,i as p,in as m,jt as h,k as g,lt as _,m as v,nt as y,p as b,rn as x,s as S,st as C,x as w,y as T} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as E,t as D} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {Z as O} from "./basecomponent-ClhuVxJN.js";
import {t as k} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as A} from "./dist-web-BSWtPfDO.js";
import {n as j} from "./motion-BwnyBP9B.js";
import {t as M} from "./AnimatePresence-d-29l3Fb.js";
var N = /* @__PURE__ */ Symbol("ProfileMonitorContext");
function P(e2, t2, r2) {
  n(N, { open: e2, available: t2, runningTaskCount: r2, toggle: () => {
    t2.value && (e2.value = !e2.value);
  } });
}
function F() {
  let e2 = g(N);
  if (!e2) throw Error("ProfileMonitorToggle must be used inside agent-console");
  return e2;
}
var I = k(e({ __name: "AgentTooltip", props: { content: {}, trigger: { default: "hover" }, placement: { default: "top" }, offset: { default: 8 }, showArrow: { type: Boolean, default: !0 }, disabled: { type: Boolean }, contentClass: {}, triggerClass: {}, zIndex: { default: 70 }, showDelay: { default: 200 }, hideDelay: { default: 120 } }, emits: ["openChange"], setup(e2, { expose: n2, emit: g2 }) {
  let y2 = e2, T2 = g2, D2 = c("triggerRef"), O2 = c("popupRef"), k2 = a(!1), N2 = a(!1), P2 = a("50%"), F2 = null, I2 = null, L2 = null, R2 = l(() => y2.placement === "top-start" ? { points: ["bl", "tl"], offset: [0, -y2.offset], initial: { opacity: 0, y: 8, scale: 0.98 }, transformOrigin: "left bottom" } : y2.placement === "bottom" ? { points: ["tc", "bc"], offset: [0, y2.offset], initial: { opacity: 0, y: -8, scale: 0.98 }, transformOrigin: "center top" } : y2.placement === "bottom-start" ? { points: ["tl", "bl"], offset: [0, y2.offset], initial: { opacity: 0, y: -8, scale: 0.98 }, transformOrigin: "left top" } : { points: ["bc", "tc"], offset: [0, -y2.offset], initial: { opacity: 0, y: 8, scale: 0.98 }, transformOrigin: "center bottom" }), z2 = l(() => y2.placement.startsWith("top"));
  function B2() {
    O2.value && D2.value && (A(O2.value, D2.value, { points: R2.value.points, offset: R2.value.offset, targetOffset: [0, 0], overflow: { adjustX: !0, adjustY: !1 }, useCssTransform: !0, ignoreShake: !0 }), V2());
  }
  function V2() {
    if (!y2.showArrow || !O2.value || !D2.value) return;
    let e3 = O2.value.querySelector(".agent-tooltip__content");
    if (!e3) return;
    let t2 = D2.value.getBoundingClientRect(), n3 = O2.value.getBoundingClientRect(), r2 = t2.left + t2.width / 2 - n3.left, i2 = Math.max(10, e3.offsetWidth - 10);
    P2.value = `${Math.min(Math.max(r2, 10), i2)}px`;
  }
  function H2() {
    k2.value && N2.value && requestAnimationFrame(B2);
  }
  function U2() {
    I2 &&= (window.clearTimeout(I2), null);
  }
  function W2() {
    F2 &&= (window.clearTimeout(F2), null);
  }
  function G() {
    W2(), U2(), !(y2.disabled || N2.value) && (k2.value = !0, N2.value = !0, T2("openChange", !0), t(() => {
      requestAnimationFrame(B2);
    }));
  }
  function K() {
    W2(), U2(), k2.value && (N2.value = !1, T2("openChange", !1), I2 = setTimeout(() => {
      k2.value = !1, I2 = null;
    }, 160));
  }
  function q() {
    U2(), !(y2.disabled || N2.value) && (y2.showDelay <= 0 ? G() : (W2(), F2 = setTimeout(() => {
      F2 = null, G();
    }, y2.showDelay)));
  }
  function J() {
    W2(), y2.hideDelay <= 0 ? K() : (U2(), I2 = setTimeout(() => {
      K();
    }, y2.hideDelay));
  }
  function Y() {
    N2.value ? K() : G();
  }
  function ee(e3) {
    y2.trigger === "click" && (e3.stopPropagation(), Y());
  }
  function X() {
    y2.trigger === "hover" && q();
  }
  function Z() {
    y2.trigger === "hover" && J();
  }
  function Q(e3) {
    let t2 = e3.composedPath();
    D2.value && t2.includes(D2.value) || O2.value && t2.includes(O2.value) || K();
  }
  function te() {
    document.addEventListener("pointerdown", Q, !0);
  }
  function $() {
    document.removeEventListener("pointerdown", Q, !0);
  }
  return C(N2, (e3) => {
    y2.trigger === "click" && (L2 &&= (clearTimeout(L2), null), e3 ? L2 = setTimeout(() => {
      te(), L2 = null;
    }) : $());
  }), C(() => y2.content, () => {
    H2();
  }, { flush: "post" }), o(() => {
    window.addEventListener("resize", H2), window.addEventListener("scroll", H2, !0);
  }), i(() => {
    window.removeEventListener("resize", H2), window.removeEventListener("scroll", H2, !0), $(), L2 && window.clearTimeout(L2), W2(), U2();
  }), n2({ open: G, close: K, align: B2 }), (t2, n3) => (s(), f(p, null, [d("span", { ref_key: "triggerRef", ref: D2, class: u(["agent-tooltip__trigger", e2.triggerClass]), onClick: ee, onMouseenter: X, onMouseleave: Z }, [r(t2.$slots, "default", { open: G, close: K })], 34), (s(), b(S, { to: "body" }, [h(k2) ? (s(), f("div", { key: 0, ref_key: "popupRef", ref: O2, class: "agent-tooltip__popup", style: x({ zIndex: e2.zIndex }), onClick: n3[0] ||= E(() => {
  }, ["stop"]), onMouseenter: X, onMouseleave: Z }, [w(h(M), { mode: "wait" }, { default: _(() => [h(N2) ? (s(), b(h(j).div, { key: 0, class: u(["agent-tooltip__content", e2.contentClass]), style: x({ transformOrigin: h(R2).transformOrigin, "--agent-tooltip-arrow-x": h(P2) }), initial: h(R2).initial, animate: { opacity: 1, y: 0, scale: 1 }, exit: h(R2).initial, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } }, { default: _(() => [r(t2.$slots, "content", { close: K }, () => [d("span", null, m(e2.content), 1)]), e2.showArrow ? (s(), f("span", { key: 0, class: u(["agent-tooltip__arrow", { "agent-tooltip__arrow--top": h(z2), "agent-tooltip__arrow--bottom": !h(z2) }]) }, null, 2)) : v("", !0)]), _: 3 }, 8, ["class", "style", "initial", "exit"])) : v("", !0)]), _: 3 })], 36)) : v("", !0)]))], 64));
} }), [["__scopeId", "data-v-793874f8"]]);
var L = ["aria-label"];
var R = { key: 0, class: "task-monitor-toggle__activity", "aria-hidden": "true" };
var z = ["aria-label"];
var B = { key: 0, class: "task-monitor-toggle__activity", "aria-hidden": "true" };
var V = k(e({ __name: "ProfileMonitorToggle", props: { variant: { default: "pill" } }, setup(e2) {
  let { open: t2, available: n2, runningTaskCount: r2, toggle: i2 } = F(), a2 = l(() => n2.value && !t2.value), o2 = `task-monitor-activity-${y().replace(/[^\w-]/g, "")}`, c2 = `url(#${o2})`;
  return (n3, l2) => {
    let p2 = O;
    return h(a2) ? (s(), f("div", { key: 0, class: u(["task-monitor-toggle", [`task-monitor-toggle--${e2.variant}`, { "is-running": h(r2) > 0 }]]) }, [e2.variant === "icon" ? (s(), b(I, { key: 0, content: n3.$t("\u7A97\u53E3\u76D1\u63A7"), placement: "bottom", offset: 8 }, { default: _(() => [d("button", { class: u(["task-monitor-toggle__button", { active: h(t2) }]), type: "button", "aria-label": n3.$t("\u7A97\u53E3\u76D1\u63A7"), onClick: l2[0] ||= E((...e3) => h(i2) && h(i2)(...e3), ["stop"]) }, [w(p2, { name: "roxy-agent/rx-ic-task-monitor", color: "var(--color-fg-primary, var(--color-text-primary))" }), h(r2) > 0 ? (s(), f("svg", R, [d("defs", null, [d("linearGradient", { id: o2, gradientUnits: "objectBoundingBox", x1: "0", y1: "0", x2: "1", y2: "1" }, [...l2[2] ||= [d("stop", { offset: "0%", "stop-color": "#1570ef" }, null, -1), d("stop", { offset: "18%", "stop-color": "#84caff" }, null, -1), d("stop", { offset: "38%", "stop-color": "#7a5af8" }, null, -1), d("stop", { offset: "60%", "stop-color": "#ee46bc" }, null, -1), d("stop", { offset: "78%", "stop-color": "#fcceee" }, null, -1), d("stop", { offset: "100%", "stop-color": "#1570ef" }, null, -1), d("animateTransform", { attributeName: "gradientTransform", type: "rotate", from: "0 .5 .5", to: "360 .5 .5", dur: "2.4s", repeatCount: "indefinite" }, null, -1)]])]), d("rect", { stroke: c2, class: "task-monitor-toggle__activity-path", pathLength: "100" })])) : v("", !0)], 10, L)]), _: 1 }, 8, ["content"])) : (s(), f("button", { key: 1, class: u(["task-monitor-toggle__button", { active: h(t2) }]), type: "button", "aria-label": n3.$t("\u7A97\u53E3\u76D1\u63A7"), onClick: l2[1] ||= E((...e3) => h(i2) && h(i2)(...e3), ["stop"]) }, [w(p2, { name: "roxy-agent/rx-ic-task-monitor", color: "var(--color-fg-primary, var(--color-text-primary))" }), d("span", null, m(n3.$t("\u7A97\u53E3\u76D1\u63A7")), 1), h(r2) > 0 ? (s(), f("svg", B, [d("defs", null, [d("linearGradient", { id: o2, gradientUnits: "objectBoundingBox", x1: "0", y1: "0", x2: "1", y2: "1" }, [...l2[3] ||= [T('<stop offset="0%" stop-color="#1570ef" data-v-ad326f0a></stop><stop offset="18%" stop-color="#84caff" data-v-ad326f0a></stop><stop offset="38%" stop-color="#7a5af8" data-v-ad326f0a></stop><stop offset="60%" stop-color="#ee46bc" data-v-ad326f0a></stop><stop offset="78%" stop-color="#fcceee" data-v-ad326f0a></stop><stop offset="100%" stop-color="#1570ef" data-v-ad326f0a></stop><animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="2.4s" repeatCount="indefinite" data-v-ad326f0a></animateTransform>', 7)]])]), d("rect", { stroke: c2, class: "task-monitor-toggle__activity-path", pathLength: "100" })])) : v("", !0)], 10, z))], 2)) : v("", !0);
  };
} }), [["__scopeId", "data-v-ad326f0a"]]);
var H = { key: 0, class: "agent-console-page-layout__header" };
var U = 100;
var W = k(e({ __name: "AgentConsolePageLayout", props: { contentDisplay: { default: "block" }, contentDirection: { default: "column" }, alignItems: { default: "initial" }, justifyContent: { default: "initial" }, overflow: { default: "hidden" }, padding: { default: "66px 23px 40px" }, mobilePadding: {}, title: {}, showProfileMonitorToggle: { type: Boolean, default: !0 }, profileMonitorToggleLabel: {}, profileMonitorToggleVariant: { default: "pill" } }, emits: ["scroll"], setup(e2, { emit: t2 }) {
  let n2 = e2, i2 = t2, o2 = l(() => ({ "--agent-console-page-padding": n2.padding, "--agent-console-page-mobile-padding": n2.mobilePadding ?? n2.padding, "--agent-console-page-display": n2.contentDisplay, "--agent-console-page-direction": n2.contentDirection, "--agent-console-page-align": n2.alignItems, "--agent-console-page-justify": n2.justifyContent })), c2 = a(!1);
  function p2(e3) {
    if (!n2.title) return;
    let t3 = e3.target;
    if (!(t3 instanceof HTMLElement) || !t3.matches("[data-agent-page-scroll]")) return;
    i2("scroll", e3);
    let r2 = t3.scrollHeight > t3.clientHeight + 1;
    c2.value = r2 && t3.scrollTop > U;
  }
  return (t3, n3) => (s(), f("main", { class: u(["agent-console-page-layout", [`agent-console-page-layout--${e2.overflow}`, { "agent-console-page-layout--with-header": e2.title }]]), onScrollCapturePassive: p2 }, [w(D, { name: "agent-console-page-layout__header" }, { default: _(() => [e2.title && h(c2) ? (s(), f("header", H, [d("h1", null, m(e2.title), 1), e2.showProfileMonitorToggle ? (s(), b(V, { key: 0, class: "agent-console-page-layout__monitor", variant: e2.profileMonitorToggleVariant }, null, 8, ["variant"])) : v("", !0)])) : v("", !0)]), _: 1 }), d("section", { class: "agent-console-page-layout__panel", "data-agent-page-scroll": "", style: x(h(o2)) }, [e2.showProfileMonitorToggle ? (s(), b(V, { key: 0, class: u(["agent-console-page-layout__floating-monitor", { "is-hidden": h(c2) }]), variant: e2.profileMonitorToggleVariant }, null, 8, ["class", "variant"])) : v("", !0), r(t3.$slots, "default", {}, void 0, !0)], 4), r(t3.$slots, "overlay", {}, void 0, !0)], 34));
} }), [["__scopeId", "data-v-61bd18fd"]]);
export {P as i,V as n,I as r,W as t};
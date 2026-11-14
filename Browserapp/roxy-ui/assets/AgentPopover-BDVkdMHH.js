import {C as e,F as t,J as n,N as r,P as i,R as a,W as o,at as s,d as c,en as l,f as u,h as d,i as f,m as p,p as m,rn as h,rt as g,s as _,st as v} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as y} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as b} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as x} from "./dist-web-BSWtPfDO.js";
var S = b(e({ inheritAttrs: !1, __name: "AgentPopover", props: r({ placement: { default: "bottom-end" }, offset: { default: 8 }, triggerClass: {}, contentClass: {}, zIndex: { default: 1200 }, disabled: { type: Boolean } }, { open: { type: Boolean, default: !1 }, openModifiers: {} }), emits: r(["openChange"], ["update:open"]), setup(e2, { expose: r2, emit: b2 }) {
  let S2 = e2, C = b2, w = g(e2, "open"), T = s("triggerRef"), E = s("popupRef"), D, O = !1, k = c(() => {
    let e3 = S2.offset;
    switch (S2.placement) {
      case "top":
        return { points: ["bc", "tc"], offset: [0, -e3] };
      case "top-start":
        return { points: ["bl", "tl"], offset: [0, -e3] };
      case "top-end":
        return { points: ["br", "tr"], offset: [0, -e3] };
      case "bottom":
        return { points: ["tc", "bc"], offset: [0, e3] };
      case "bottom-start":
        return { points: ["tl", "bl"], offset: [0, e3] };
      case "left":
        return { points: ["cr", "cl"], offset: [-e3, 0] };
      case "left-start":
        return { points: ["tr", "tl"], offset: [-e3, 0] };
      case "left-end":
        return { points: ["br", "bl"], offset: [-e3, 0] };
      case "right":
        return { points: ["cl", "cr"], offset: [e3, 0] };
      case "right-start":
        return { points: ["tl", "tr"], offset: [e3, 0] };
      case "right-end":
        return { points: ["bl", "br"], offset: [e3, 0] };
      default:
        return { points: ["tr", "br"], offset: [0, e3] };
    }
  });
  function A() {
    w.value && E.value && T.value && requestAnimationFrame(() => {
      w.value && E.value && T.value && x(E.value, T.value, { points: k.value.points, offset: k.value.offset, targetOffset: [0, 0], overflow: { adjustX: !0, adjustY: !0 }, useCssTransform: !0, ignoreShake: !0 });
    });
  }
  function j() {
    S2.disabled || w.value || (w.value = !0);
  }
  function M() {
    w.value &&= !1;
  }
  function N() {
    w.value ? M() : j();
  }
  function P(e3) {
    e3.preventDefault(), e3.stopPropagation(), N();
  }
  function F(e3) {
    (e3.key === "Enter" || e3.key === " ") && (e3.preventDefault(), e3.stopPropagation(), N());
  }
  function I(e3) {
    if (!w.value) return;
    let t2 = e3.composedPath();
    T.value && t2.includes(T.value) || E.value && t2.includes(E.value) || M();
  }
  function L(e3) {
    e3.key === "Escape" && M();
  }
  function R() {
    E.value && typeof ResizeObserver < "u" && (D = new ResizeObserver(A), D.observe(E.value));
  }
  function z() {
    D?.disconnect(), D = void 0;
  }
  function B() {
    O || (O = !0, document.addEventListener("pointerdown", I, !0), document.addEventListener("keydown", L), window.addEventListener("resize", A), window.addEventListener("scroll", A, !0));
  }
  function V() {
    O && (O = !1, document.removeEventListener("pointerdown", I, !0), document.removeEventListener("keydown", L), window.removeEventListener("resize", A), window.removeEventListener("scroll", A, !0));
  }
  return v(w, (e3) => {
    C("openChange", e3), e3 ? (B(), t(() => {
      A(), R();
    })) : (z(), V());
  }, { flush: "post" }), v(() => [S2.placement, S2.offset], () => {
    A();
  }), a(() => {
    V(), z();
  }), r2({ open: j, close: M, toggle: N, align: A }), (t2, r3) => (o(), d(f, null, [u("span", i({ ref_key: "triggerRef", ref: T }, t2.$attrs, { class: ["agent-popover__trigger", e2.triggerClass], onClick: P, onKeydown: F }), [n(t2.$slots, "default", { open: j, close: M, toggle: N, isOpen: w.value }, void 0, !0)], 16), (o(), m(_, { to: "body" }, [w.value ? (o(), d("div", { key: 0, ref_key: "popupRef", ref: E, class: l(["agent-popover__content", e2.contentClass]), style: h({ zIndex: e2.zIndex }), onClick: r3[0] ||= y(() => {
  }, ["stop"]) }, [n(t2.$slots, "content", { close: M }, void 0, !0)], 6)) : p("", !0)]))], 64));
} }), [["__scopeId", "data-v-611867ea"]]);
export {S as t};
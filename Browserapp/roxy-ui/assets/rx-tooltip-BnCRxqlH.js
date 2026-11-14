import {C as e,F as t,H as n,J as r,P as i,St as a,V as o,W as s,at as c,d as l,en as u,f as d,h as f,i as p,it as m,jt as h,lt as g,m as _,p as v,s as y,x as b} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as x} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as S} from "./dist-web-BSWtPfDO.js";
import {n as C} from "./motion-BwnyBP9B.js";
import {t as w} from "./AnimatePresence-d-29l3Fb.js";
var T = x(e({ __name: "index", props: { trigger: { type: String, default: "hover" }, placement: { type: String, default: "top" }, offset: { type: Number, default: 4 }, delay: { type: Number, default: 200 }, tooltipContentClass: { type: String } }, setup(e2, { expose: x2 }) {
  let T2 = e2, E = c("source"), D = c("target"), O = m(), k = a(!1), A = a(!1), j = l(() => {
    let e3 = {};
    return T2.placement === "top" ? (e3.points = ["bc", "tc"], e3.offset = [0, -T2.offset], e3.y = 8) : T2.placement === "bottom" ? (e3.points = ["tc", "bc"], e3.offset = [0, T2.offset], e3.y = -8) : T2.placement === "left" ? (e3.points = ["cr", "cl"], e3.offset = [-T2.offset, 0], e3.x = 8) : T2.placement === "right" && (e3.points = ["cl", "cr"], e3.offset = [T2.offset, 0], e3.x = -8), e3;
  });
  function M() {
    t(() => {
      E.value && D.value && S(E.value, D.value, { points: j.value.points, offset: j.value.offset, overflow: { adjustX: !0, adjustY: !0 }, useCssTransform: !0 });
    });
  }
  let N = null;
  function P() {
    O.content && (k.value = !0, N = setTimeout(() => {
      A.value = !0, M();
    }, T2.delay));
  }
  function F() {
    O.content && (k.value = !k.value, M());
  }
  let I = null;
  function L() {
    N && clearTimeout(N), I && clearTimeout(I), I = setTimeout(() => {
      A.value = !1, t(() => k.value = !1);
    }, 200);
  }
  function R() {
    N && clearTimeout(N), I && clearTimeout(I), A.value = !1, k.value = !1;
  }
  function z() {
    I && clearTimeout(I);
  }
  return o(() => {
    let e3 = T2.trigger;
    e3 === "click" ? D.value?.addEventListener("click", F) : e3 === "hover" ? (D.value?.addEventListener("mouseenter", P), D.value?.addEventListener("mouseleave", L)) : e3 === "focus" && (D.value?.addEventListener("focus", P), D.value?.addEventListener("blur", L)), n(() => {
      e3 === "click" ? D.value?.removeEventListener("click", F) : e3 === "hover" ? (D.value?.removeEventListener("mouseenter", P), D.value?.removeEventListener("mouseleave", L)) : e3 === "focus" && (D.value?.removeEventListener("focus", P), D.value?.removeEventListener("blur", L));
    });
  }), x2({ align: M, hide: L, hideImmediate: R }), (t2, n2) => (s(), f(p, null, [d("div", i({ ref: "target", class: "inline-block" }, t2.$attrs), [r(t2.$slots, "default", { hide: L }, void 0, !0)], 16), h(k) ? (s(), v(y, { key: 0, to: "body" }, [d("div", { ref: "source", class: "absolute inline-block z-4000", onMouseenter: z, onMouseleave: L }, [b(h(w), null, { default: g(() => [h(A) ? (s(), v(h(C).div, { key: 0, class: u(["rx-tooltip-content", e2.tooltipContentClass]), initial: { opacity: 0, y: h(j).y, x: h(j).x }, animate: { opacity: 1, y: 0, x: 0 }, exit: { opacity: 0, y: h(j).y, x: h(j).x }, transition: { duration: 0.15 } }, { default: g(() => [r(t2.$slots, "content", { hide: R }, void 0, !0)]), _: 3 }, 8, ["class", "initial", "exit"])) : _("", !0)]), _: 3 })], 544)])) : _("", !0)], 64));
} }), [["__scopeId", "data-v-5c94df36"]]);
export {T as t};
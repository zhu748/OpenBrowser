import {St as e,bt as t} from "./runtime-core.esm-bundler-CBj16o9G.js";
var r = e(!1);
var i = t({ top: 0, left: 0, width: 0, height: 0, borderRadius: "0px" });
var a;
function c(e2) {
  return typeof e2 == "function" ? e2() : document.querySelector(e2);
}
function l(e2) {
  let t2 = e2.getBoundingClientRect();
  i.top = t2.top, i.left = t2.left, i.width = t2.width, i.height = t2.height, i.borderRadius = getComputedStyle(e2).borderRadius || "0px";
}
function u(e2) {
  let t2 = [], n2 = e2.parentElement;
  for (; n2; ) {
    let { overflow: e3, overflowX: r2, overflowY: i2 } = getComputedStyle(n2);
    [e3, r2, i2].some((e4) => /auto|scroll|overlay/.test(e4)) && t2.push(n2), n2 = n2.parentElement;
  }
  return t2;
}
function d(e2) {
  f();
  let t2 = c(e2);
  if (!t2) return;
  r.value = !0;
  let n2 = () => {
    let t3 = c(e2);
    t3 && l(t3);
  };
  n2(), window.addEventListener("scroll", n2, !0), window.addEventListener("resize", n2);
  let i2 = new ResizeObserver(n2);
  i2.observe(t2);
  let o2 = u(t2);
  o2.forEach((e3) => e3.addEventListener("scroll", n2, { passive: !0 })), a = () => {
    window.removeEventListener("scroll", n2, !0), window.removeEventListener("resize", n2), i2.disconnect(), o2.forEach((e3) => e3.removeEventListener("scroll", n2));
  };
}
function f() {
  r.value = !1, a?.(), a = void 0;
}
export {d as i,f as t};
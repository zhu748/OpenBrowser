import {C as e,W as t,Z as n,b as r,en as i,f as a,h as o,i as s,in as c,jt as l,lt as u,m as d,p as f,x as p} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as h} from "./isString-DgRFdIis.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as _} from "./toast-CjMybmc4.js";
import {t as v} from "./overlaybadge-B-go4u-h.js";
import {n as y} from "./rx_ic_check_fill-DhZ0qHY_.js";
import {n as b} from "./rx_ic_delete-CnrObAWC.js";
import {n as x} from "./rx_ic_info_fill-BKETVyN3.js";
import {n as S} from "./rx_ic_warn_fill-D1nvFIgs.js";
var C = ["data-life", "role", "tabindex", "onClick", "onKeydown", "onMouseenter", "onMouseleave"];
var w = { class: "alert-icon" };
var T = { class: "alert-content" };
var E = { class: "alert-header" };
var D = { key: 0, class: "alert-message" };
var O = { class: "alert-close" };
var k = g(e({ __name: "rx-toast-headless", setup(e2) {
  let g2 = { success: y, warn: x, error: x, info: S }, k2 = {};
  function A(e3) {
    return `${String(e3.id)}_${e3.severity ?? ""}`;
  }
  function j(e3, t2 = 0) {
    if (t2 > 6 || e3 == null || typeof e3 == "function" || typeof e3 == "boolean") return "";
    if (typeof e3 == "string" || typeof e3 == "number") return String(e3);
    if (Array.isArray(e3)) return e3.map((e4) => j(e4, t2 + 1)).filter(Boolean).join(`
`);
    if (typeof e3 != "object") return "";
    let n2 = e3, r2 = [], i2 = n2.type;
    if (typeof i2 == "string") r2.push(i2);
    else if (typeof i2 == "object" || typeof i2 == "function") {
      let e4 = i2, t3 = e4.name || e4.__name;
      t3 && r2.push(t3);
    }
    let a2 = n2.props;
    if (a2) for (let e4 of ["label", "title", "content", "message"]) {
      let t3 = a2[e4];
      (typeof t3 == "string" || typeof t3 == "number") && r2.push(String(t3));
    }
    return "children" in n2 && r2.push(j(n2.children, t2 + 1)), r2.filter(Boolean).join("|");
  }
  function M(e3) {
    let t2 = k2[e3];
    t2 && (clearTimeout(t2.closeTimeout), Reflect.deleteProperty(k2, e3));
  }
  function N(e3) {
    let { message: t2, closeCallback: n2 } = e3;
    M(A(t2)), n2();
  }
  function P(e3) {
    let { message: t2 } = e3;
    typeof t2.onClick == "function" && (N(e3), t2.onClick());
  }
  function F(e3, t2) {
    (e3.key === "Enter" || e3.key === " ") && (e3.preventDefault(), P(t2));
  }
  function I(e3) {
    let { message: t2 } = e3, n2 = A(t2);
    k2[n2] && clearTimeout(k2[n2].closeTimeout);
  }
  function L(e3) {
    let { message: t2, closeCallback: n2 } = e3, r2 = A(t2);
    k2[r2] && (k2[r2].closeTimeout = setTimeout(() => {
      N({ message: t2, closeCallback: n2 });
    }, Math.max(1e3, t2.originLife - (Date.now() - t2.startTimestamp))));
  }
  function R(e3) {
    let { message: t2, closeCallback: n2 } = e3, r2 = A(t2);
    k2[r2] || (Reflect.has(t2, "life") && t2.life !== 0 || (t2.life = 2500), t2.hide &&= !1);
    let i2 = Object.values(k2).find((e4) => {
      let { message: { id: n3, groupId: r3, summary: i3, detail: a2, severity: o2 } } = e4, s2 = r3 != null && r3 === t2.groupId, c2 = j(i3) === j(t2.summary) && j(a2) === j(t2.detail);
      return n3 !== t2.id && o2 === t2.severity && (s2 || c2);
    });
    if (i2 && (i2.message.hide = !0, t2.hide = !1, t2.count = (i2.message.count || 1) + 1, t2.life = i2.message.originLife || t2.life || 2500, clearTimeout(i2.closeTimeout), Reflect.deleteProperty(k2, A(i2.message)), setTimeout(i2.closeCallback)), !k2[r2] && t2.life) {
      t2.originLife = t2.life, t2.startTimestamp = Date.now(), t2.life = 0;
      let e4 = setTimeout(() => {
        N({ message: t2, closeCallback: n2 });
      }, t2.originLife);
      k2[r2] = { message: t2, closeCallback: n2, closeTimeout: e4 };
    }
  }
  return (e3, y2) => {
    let x2 = v, S2 = _;
    return t(), f(S2, { position: "top-center", unstyled: "", pt: { root: "rx-toast-headless translate-x-[-50%] z-10" } }, { container: u(({ message: e4, closeCallback: _2 }) => [e4.hide ? d("", !0) : (t(), f(x2, { key: 0, value: e4.count, class: i(["badge", [e4.severity]]), size: "small" }, { default: u(() => [a("section", { class: i(["alert", { "alert--clickable": typeof e4.onClick == "function", "alert--with-footer": !!e4.footer }]), "data-life": R({ message: e4, closeCallback: _2 }), role: typeof e4.onClick == "function" ? "button" : void 0, tabindex: typeof e4.onClick == "function" ? 0 : void 0, onClick: (t2) => P({ message: e4, closeCallback: _2 }), onKeydown: (t2) => F(t2, { message: e4, closeCallback: _2 }), onMouseenter: (t2) => I({ message: e4, closeCallback: _2 }), onMouseleave: (t2) => L({ message: e4, closeCallback: _2 }) }, [a("div", w, [(t(), f(n(g2[e4.severity]), { class: "text-4 shrink-0" }))]), a("div", T, [a("div", E, [l(h)(e4.summary) ? (t(), o(s, { key: 0 }, [r(c(e4.summary), 1)], 64)) : (t(), f(n(e4.summary), { key: 1 }))]), e4.detail ? (t(), o("div", D, [l(h)(e4.detail) ? (t(), o(s, { key: 0 }, [r(c(e4.detail), 1)], 64)) : (t(), f(n(e4.detail), { key: 1 }))])) : d("", !0)]), a("div", O, [p(l(b), { class: "text-4 shrink-0 cursor-pointer", onClick: m((t2) => N({ message: e4, closeCallback: _2 }), ["stop"]) }, null, 8, ["onClick"])]), e4.footer ? (t(), o("div", { key: 0, class: "alert-footer", onClick: y2[0] ||= m(() => {
    }, ["stop"]) }, [(t(), f(n(e4.footer)))])) : d("", !0)], 42, C)]), _: 2 }, 1032, ["value", "class"]))]), _: 1 });
  };
} }), [["__scopeId", "data-v-56ad81a9"]]);
export {k as t};
import {$ as e,$t as t,Bt as n,C as r,D as i,Et as a,F as o,Ft as s,Gt as c,H as l,Ht as u,It as d,Jt as f,K as p,Kt as m,Lt as h,Mt as g,Nt as ee,Pt as _,Q as v,Qt as y,Rt as b,T as te,U as ne,Ut as re,V as ie,Vt as x,Wt as S,Xt as C,Yt as w,Zt as T,_ as ae,i as oe,jt as se,l as ce,n as le,o as ue,on as E,ot as de,qt as D,st as fe,t as pe,tn as me,w as O,x as he,z as ge,zt as _e} from "./runtime-core.esm-bundler-CBj16o9G.js";
var k = void 0;
var ve = typeof window < "u" && window.trustedTypes;
if (ve) try {
  k = ve.createPolicy("vue", { createHTML: (e3) => e3 });
} catch {
}
var ye = k ? (e3) => k.createHTML(e3) : (e3) => e3;
var be = "http://www.w3.org/2000/svg";
var xe = "http://www.w3.org/1998/Math/MathML";
var A = typeof document < "u" ? document : null;
var Se = A && A.createElement("template");
var Ce = { insert: (e3, t2, n2) => {
  t2.insertBefore(e3, n2 || null);
}, remove: (e3) => {
  let t2 = e3.parentNode;
  t2 && t2.removeChild(e3);
}, createElement: (e3, t2, n2, r2) => {
  let i2 = t2 === "svg" ? A.createElementNS(be, e3) : t2 === "mathml" ? A.createElementNS(xe, e3) : n2 ? A.createElement(e3, { is: n2 }) : A.createElement(e3);
  return e3 === "select" && r2 && r2.multiple != null && i2.setAttribute("multiple", r2.multiple), i2;
}, createText: (e3) => A.createTextNode(e3), createComment: (e3) => A.createComment(e3), setText: (e3, t2) => {
  e3.nodeValue = t2;
}, setElementText: (e3, t2) => {
  e3.textContent = t2;
}, parentNode: (e3) => e3.parentNode, nextSibling: (e3) => e3.nextSibling, querySelector: (e3) => A.querySelector(e3), setScopeId(e3, t2) {
  e3.setAttribute(t2, "");
}, insertStaticContent(e3, t2, n2, r2, i2, a2) {
  let o2 = n2 ? n2.previousSibling : t2.lastChild;
  if (i2 && (i2 === a2 || i2.nextSibling)) for (; t2.insertBefore(i2.cloneNode(!0), n2), i2 !== a2 && (i2 = i2.nextSibling); ) ;
  else {
    Se.innerHTML = ye(r2 === "svg" ? `<svg>${e3}</svg>` : r2 === "mathml" ? `<math>${e3}</math>` : e3);
    let i3 = Se.content;
    if (r2 === "svg" || r2 === "mathml") {
      let e4 = i3.firstChild;
      for (; e4.firstChild; ) i3.appendChild(e4.firstChild);
      i3.removeChild(e4);
    }
    t2.insertBefore(i3, n2);
  }
  return [o2 ? o2.nextSibling : t2.firstChild, n2 ? n2.previousSibling : t2.lastChild];
} };
var j = "transition";
var M = "animation";
var N = /* @__PURE__ */ Symbol("_vtc");
var we = { name: String, type: String, css: { type: Boolean, default: !0 }, duration: [String, Number, Object], enterFromClass: String, enterActiveClass: String, enterToClass: String, appearFromClass: String, appearActiveClass: String, appearToClass: String, leaveFromClass: String, leaveActiveClass: String, leaveToClass: String };
var Te = d({}, le, we);
var Ee = ((e3) => (e3.displayName = "Transition", e3.props = Te, e3))((e3, { slots: t2 }) => i(pe, Oe(e3), t2));
var P = (e3, t2 = []) => {
  x(e3) ? e3.forEach((e4) => e4(...t2)) : e3 && e3(...t2);
};
var De = (e3) => e3 ? x(e3) ? e3.some((e4) => e4.length > 1) : e3.length > 1 : !1;
function Oe(e3) {
  let t2 = {};
  for (let n3 in e3) n3 in we || (t2[n3] = e3[n3]);
  if (e3.css === !1) return t2;
  let { name: n2 = "v", type: r2, duration: i2, enterFromClass: a2 = `${n2}-enter-from`, enterActiveClass: o2 = `${n2}-enter-active`, enterToClass: s2 = `${n2}-enter-to`, appearFromClass: c2 = a2, appearActiveClass: l2 = o2, appearToClass: u2 = s2, leaveFromClass: f2 = `${n2}-leave-from`, leaveActiveClass: p2 = `${n2}-leave-active`, leaveToClass: m2 = `${n2}-leave-to` } = e3, h2 = ke(i2), g2 = h2 && h2[0], ee2 = h2 && h2[1], { onBeforeEnter: _2, onEnter: v2, onEnterCancelled: y2, onLeave: b2, onLeaveCancelled: te2, onBeforeAppear: ne2 = _2, onAppear: re2 = v2, onAppearCancelled: ie2 = y2 } = t2, x2 = (e4, t3, n3, r3) => {
    e4._enterCancelled = r3, L(e4, t3 ? u2 : s2), L(e4, t3 ? l2 : o2), n3 && n3();
  }, S2 = (e4, t3) => {
    e4._isLeaving = !1, L(e4, f2), L(e4, m2), L(e4, p2), t3 && t3();
  }, C2 = (e4) => (t3, n3) => {
    let i3 = e4 ? re2 : v2, o3 = () => x2(t3, e4, n3);
    P(i3, [t3, o3]), Ae(() => {
      L(t3, e4 ? c2 : a2), I(t3, e4 ? u2 : s2), De(i3) || Me(t3, r2, g2, o3);
    });
  };
  return d(t2, { onBeforeEnter(e4) {
    P(_2, [e4]), I(e4, a2), I(e4, o2);
  }, onBeforeAppear(e4) {
    P(ne2, [e4]), I(e4, c2), I(e4, l2);
  }, onEnter: C2(!1), onAppear: C2(!0), onLeave(e4, t3) {
    e4._isLeaving = !0;
    let n3 = () => S2(e4, t3);
    I(e4, f2), e4._enterCancelled ? (I(e4, p2), R(e4)) : (R(e4), I(e4, p2)), Ae(() => {
      e4._isLeaving && (L(e4, f2), I(e4, m2), De(b2) || Me(e4, r2, ee2, n3));
    }), P(b2, [e4, n3]);
  }, onEnterCancelled(e4) {
    x2(e4, !1, void 0, !0), P(y2, [e4]);
  }, onAppearCancelled(e4) {
    x2(e4, !0, void 0, !0), P(ie2, [e4]);
  }, onLeaveCancelled(e4) {
    S2(e4), P(te2, [e4]);
  } });
}
function ke(e3) {
  if (e3 == null) return null;
  if (S(e3)) return [F(e3.enter), F(e3.leave)];
  {
    let t2 = F(e3);
    return [t2, t2];
  }
}
function F(e3) {
  return E(e3);
}
function I(e3, t2) {
  t2.split(/\s+/).forEach((t3) => t3 && e3.classList.add(t3)), (e3[N] || (e3[N] = /* @__PURE__ */ new Set())).add(t2);
}
function L(e3, t2) {
  t2.split(/\s+/).forEach((t3) => t3 && e3.classList.remove(t3));
  let n2 = e3[N];
  n2 && (n2.delete(t2), n2.size || (e3[N] = void 0));
}
function Ae(e3) {
  requestAnimationFrame(() => {
    requestAnimationFrame(e3);
  });
}
var je = 0;
function Me(e3, t2, n2, r2) {
  let i2 = e3._endId = ++je, a2 = () => {
    i2 === e3._endId && r2();
  };
  if (n2 != null) return setTimeout(a2, n2);
  let { type: o2, timeout: s2, propCount: c2 } = Ne(e3, t2);
  if (!o2) return r2();
  let l2 = o2 + "end", u2 = 0, d2 = () => {
    e3.removeEventListener(l2, f2), a2();
  }, f2 = (t3) => {
    t3.target === e3 && ++u2 >= c2 && d2();
  };
  setTimeout(() => {
    u2 < c2 && d2();
  }, s2 + 1), e3.addEventListener(l2, f2);
}
function Ne(e3, t2) {
  let n2 = window.getComputedStyle(e3), r2 = (e4) => (n2[e4] || "").split(", "), i2 = r2(`${j}Delay`), a2 = r2(`${j}Duration`), o2 = Pe(i2, a2), s2 = r2(`${M}Delay`), c2 = r2(`${M}Duration`), l2 = Pe(s2, c2), u2 = null, d2 = 0, f2 = 0;
  t2 === j ? o2 > 0 && (u2 = j, d2 = o2, f2 = a2.length) : t2 === M ? l2 > 0 && (u2 = M, d2 = l2, f2 = c2.length) : (d2 = Math.max(o2, l2), u2 = d2 > 0 ? o2 > l2 ? j : M : null, f2 = u2 ? u2 === j ? a2.length : c2.length : 0);
  let p2 = u2 === j && /\b(?:transform|all)(?:,|$)/.test(r2(`${j}Property`).toString());
  return { type: u2, timeout: d2, propCount: f2, hasTransform: p2 };
}
function Pe(e3, t2) {
  for (; e3.length < t2.length; ) e3 = e3.concat(e3);
  return Math.max(...t2.map((t3, n2) => Fe(t3) + Fe(e3[n2])));
}
function Fe(e3) {
  return e3 === "auto" ? 0 : Number(e3.slice(0, -1).replace(",", ".")) * 1e3;
}
function R(e3) {
  return (e3 ? e3.ownerDocument : document).body.offsetHeight;
}
function Ie(e3, t2, n2) {
  let r2 = e3[N];
  r2 && (t2 = (t2 ? [t2, ...r2] : [...r2]).join(" ")), t2 == null ? e3.removeAttribute("class") : n2 ? e3.setAttribute("class", t2) : e3.className = t2;
}
var z = /* @__PURE__ */ Symbol("_vod");
var B = /* @__PURE__ */ Symbol("_vsh");
var Le = { name: "show", beforeMount(e3, { value: t2 }, { transition: n2 }) {
  e3[z] = e3.style.display === "none" ? "" : e3.style.display, n2 && t2 ? n2.beforeEnter(e3) : V(e3, t2);
}, mounted(e3, { value: t2 }, { transition: n2 }) {
  n2 && t2 && n2.enter(e3);
}, updated(e3, { value: t2, oldValue: n2 }, { transition: r2 }) {
  !t2 != !n2 && (r2 ? t2 ? (r2.beforeEnter(e3), V(e3, !0), r2.enter(e3)) : r2.leave(e3, () => {
    V(e3, !1);
  }) : V(e3, t2));
}, beforeUnmount(e3, { value: t2 }) {
  V(e3, t2);
} };
function V(e3, t2) {
  e3.style.display = t2 ? e3[z] : "none", e3[B] = !t2;
}
var Re = /* @__PURE__ */ Symbol("");
function ze(e3) {
  let t2 = O();
  if (!t2) return;
  let n2 = t2.ut = (n3 = e3(t2.proxy)) => {
    Array.from(document.querySelectorAll(`[data-v-owner="${t2.uid}"]`)).forEach((e4) => U(e4, n3));
  }, r2 = () => {
    let r3 = e3(t2.proxy);
    t2.ce ? U(t2.ce, r3) : H(t2.subTree, r3), n2(r3);
  };
  ge(() => {
    p(r2);
  }), ie(() => {
    fe(r2, ee, { flush: "post" });
    let e4 = new MutationObserver(r2);
    e4.observe(t2.subTree.el.parentNode, { childList: !0 }), l(() => e4.disconnect());
  });
}
function H(e3, t2) {
  if (e3.shapeFlag & 128) {
    let n2 = e3.suspense;
    e3 = n2.activeBranch, n2.pendingBranch && !n2.isHydrating && n2.effects.push(() => {
      H(n2.activeBranch, t2);
    });
  }
  for (; e3.component; ) e3 = e3.component.subTree;
  if (e3.shapeFlag & 1 && e3.el) U(e3.el, t2);
  else if (e3.type === oe) e3.children.forEach((e4) => H(e4, t2));
  else if (e3.type === ue) {
    let { el: n2, anchor: r2 } = e3;
    for (; n2 && (U(n2, t2), n2 !== r2); ) n2 = n2.nextSibling;
  }
}
function U(e3, t2) {
  if (e3.nodeType === 1) {
    let n2 = e3.style, r2 = "";
    for (let e4 in t2) {
      let i2 = me(t2[e4]);
      n2.setProperty(`--${e4}`, i2), r2 += `--${e4}: ${i2};`;
    }
    n2[Re] = r2;
  }
}
var Be = /(?:^|;)\s*display\s*:/;
function Ve(e3, t2, n2) {
  let r2 = e3.style, i2 = w(n2), a2 = !1;
  if (n2 && !i2) {
    if (t2)
      if (w(t2)) for (let e4 of t2.split(";")) {
        let t3 = e4.slice(0, e4.indexOf(":")).trim();
        n2[t3] ?? G(r2, t3, "");
      }
      else for (let e4 in t2) n2[e4] ?? G(r2, e4, "");
    for (let i3 in n2) {
      i3 === "display" && (a2 = !0);
      let o2 = n2[i3];
      o2 == null ? G(r2, i3, "") : We(e3, i3, !w(t2) && t2 ? t2[i3] : void 0, o2) || G(r2, i3, o2);
    }
  } else if (i2) {
    if (t2 !== n2) {
      let e4 = r2[Re];
      e4 && (n2 += ";" + e4), r2.cssText = n2, a2 = Be.test(n2);
    }
  } else t2 && e3.removeAttribute("style");
  z in e3 && (e3[z] = a2 ? r2.display : "", e3[B] && (r2.display = "none"));
}
var W = /\s*!important$/;
function G(e3, t2, n2) {
  if (x(n2)) n2.forEach((n3) => G(e3, t2, n3));
  else if (n2 ??= "", t2.startsWith("--")) W.test(n2) ? e3.setProperty(t2, n2.replace(W, ""), "important") : e3.setProperty(t2, n2);
  else {
    let r2 = Ue(e3, t2);
    W.test(n2) ? e3.setProperty(b(r2), n2.replace(W, ""), "important") : e3[r2] = n2;
  }
}
var He = ["Webkit", "Moz", "ms"];
var K = {};
function Ue(e3, t2) {
  let n2 = K[t2];
  if (n2) return n2;
  let r2 = _(t2);
  if (r2 !== "filter" && r2 in e3) return K[t2] = r2;
  r2 = s(r2);
  for (let n3 = 0; n3 < He.length; n3++) {
    let i2 = He[n3] + r2;
    if (i2 in e3) return K[t2] = i2;
  }
  return t2;
}
function We(e3, t2, n2, r2) {
  return e3.tagName === "TEXTAREA" && (t2 === "width" || t2 === "height") && w(r2) && n2 === r2;
}
var Ge = "http://www.w3.org/1999/xlink";
function Ke(e3, t2, n2, r2, i2, a2 = f(t2)) {
  r2 && t2.startsWith("xlink:") ? n2 == null ? e3.removeAttributeNS(Ge, t2.slice(6, t2.length)) : e3.setAttributeNS(Ge, t2, n2) : n2 == null || a2 && !_e(n2) ? e3.removeAttribute(t2) : e3.setAttribute(t2, a2 ? "" : C(n2) ? String(n2) : n2);
}
function qe(e3, t2, n2, r2, i2) {
  if (t2 === "innerHTML" || t2 === "textContent") {
    n2 != null && (e3[t2] = t2 === "innerHTML" ? ye(n2) : n2);
    return;
  }
  let a2 = e3.tagName;
  if (t2 === "value" && a2 !== "PROGRESS" && !a2.includes("-")) {
    let r3 = a2 === "OPTION" ? e3.getAttribute("value") || "" : e3.value, i3 = n2 == null ? e3.type === "checkbox" ? "on" : "" : String(n2);
    r3 === i3 && "_value" in e3 || (e3.value = i3), n2 ?? e3.removeAttribute(t2), e3._value = n2;
    return;
  }
  let o2 = !1;
  if (n2 === "" || n2 == null) {
    let r3 = typeof e3[t2];
    r3 === "boolean" ? n2 = _e(n2) : n2 == null && r3 === "string" ? (n2 = "", o2 = !0) : r3 === "number" && (n2 = 0, o2 = !0);
  }
  try {
    e3[t2] = n2;
  } catch {
  }
  o2 && e3.removeAttribute(i2 || t2);
}
function q(e3, t2, n2, r2) {
  e3.addEventListener(t2, n2, r2);
}
function Je(e3, t2, n2, r2) {
  e3.removeEventListener(t2, n2, r2);
}
var Ye = /* @__PURE__ */ Symbol("_vei");
function Xe(e3, t2, n2, r2, i2 = null) {
  let a2 = e3[Ye] || (e3[Ye] = {}), o2 = a2[t2];
  if (r2 && o2) o2.value = r2;
  else {
    let [n3, s2] = $e(t2);
    r2 ? q(e3, n3, a2[t2] = rt(r2, i2), s2) : o2 && (Je(e3, n3, o2, s2), a2[t2] = void 0);
  }
}
var Ze = /(Once|Passive|Capture)$/;
var Qe = /^on:?(?:Once|Passive|Capture)$/;
function $e(e3) {
  let t2, n2;
  for (; (n2 = e3.match(Ze)) && !Qe.test(e3); ) t2 ||= {}, e3 = e3.slice(0, e3.length - n2[1].length), t2[n2[1].toLowerCase()] = !0;
  return [e3[2] === ":" ? e3.slice(3) : b(e3.slice(2)), t2];
}
var et = 0;
var tt = Promise.resolve();
var nt = () => et ||= (tt.then(() => et = 0), Date.now());
function rt(e3, t2) {
  let n2 = (e4) => {
    if (!e4._vts) e4._vts = Date.now();
    else if (e4._vts <= n2.attached) return;
    let r2 = n2.value;
    if (x(r2)) {
      let n3 = e4.stopImmediatePropagation;
      e4.stopImmediatePropagation = () => {
        n3.call(e4), e4._stopped = !0;
      };
      let i2 = r2.slice(), a2 = [e4];
      for (let n4 = 0; n4 < i2.length && !e4._stopped; n4++) {
        let e5 = i2[n4];
        e5 && ce(e5, t2, 5, a2);
      }
    } else ce(r2, t2, 5, [e4]);
  };
  return n2.value = e3, n2.attached = nt(), n2;
}
var it = (e3) => e3.charCodeAt(0) === 111 && e3.charCodeAt(1) === 110 && e3.charCodeAt(2) > 96 && e3.charCodeAt(2) < 123;
var at = (e3, t2, n2, r2, i2, a2) => {
  let o2 = i2 === "svg";
  t2 === "class" ? Ie(e3, r2, o2) : t2 === "style" ? Ve(e3, n2, r2) : c(t2) ? re(t2) || Xe(e3, t2, n2, r2, a2) : (t2[0] === "." ? (t2 = t2.slice(1), 1) : t2[0] === "^" ? (t2 = t2.slice(1), 0) : ot(e3, t2, r2, o2)) ? (qe(e3, t2, r2), e3.tagName.includes("-") || t2 !== "value" && t2 !== "checked" && t2 !== "selected" || Ke(e3, t2, r2, o2, a2, t2 !== "value")) : e3._isVueCE && (st(e3, t2) || e3._def.__asyncLoader && (/[A-Z]/.test(t2) || !w(r2))) ? qe(e3, _(t2), r2, a2, t2) : (t2 === "true-value" ? e3._trueValue = r2 : t2 === "false-value" && (e3._falseValue = r2), Ke(e3, t2, r2, o2));
};
function ot(e3, t2, n2, r2) {
  if (r2) return !!(t2 === "innerHTML" || t2 === "textContent" || t2 in e3 && it(t2) && u(n2));
  if (t2 === "spellcheck" || t2 === "draggable" || t2 === "translate" || t2 === "autocorrect" || t2 === "sandbox" && e3.tagName === "IFRAME" || t2 === "form" || t2 === "list" && e3.tagName === "INPUT" || t2 === "type" && e3.tagName === "TEXTAREA") return !1;
  if (t2 === "width" || t2 === "height") {
    let t3 = e3.tagName;
    if (t3 === "IMG" || t3 === "VIDEO" || t3 === "CANVAS" || t3 === "SOURCE") return !1;
  }
  return it(t2) && w(n2) ? !1 : t2 in e3;
}
function st(e3, t2) {
  let n2 = e3._def.props;
  if (!n2) return !1;
  let r2 = _(t2);
  return Array.isArray(n2) ? n2.some((e4) => _(e4) === r2) : Object.keys(n2).some((e4) => _(e4) === r2);
}
var ct = {};
function lt(e3, t2, n2) {
  let i2 = r(e3, t2);
  m(i2) && (i2 = d({}, i2, t2));
  class a2 extends dt {
    constructor(e4) {
      super(i2, e4, n2);
    }
  }
  return a2.def = i2, a2;
}
var ut = typeof HTMLElement < "u" ? HTMLElement : class {
};
var dt = class e2 extends ut {
  constructor(e3, t2 = {}, n2 = Vt) {
    super(), this._def = e3, this._props = t2, this._createApp = n2, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n2 !== Vt ? this._root = this.shadowRoot : e3.shadowRoot === !1 ? this._root = this : (this.attachShadow(d({}, e3.shadowRootOptions, { mode: "open" })), this._root = this.shadowRoot);
  }
  connectedCallback() {
    if (!this.isConnected) return;
    !this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
    let t2 = this;
    for (; t2 &&= t2.assignedSlot || t2.parentNode || t2.host; ) if (t2 instanceof e2) {
      this._parent = t2;
      break;
    }
    this._instance || (this._resolved ? this._mount(this._def) : t2 && t2._pendingResolve ? this._pendingResolve = t2._pendingResolve.then(() => {
      if (this._pendingResolve = void 0, this.isConnected) return this._resolveDef();
    }) : this._resolveDef());
  }
  _setParent(e3 = this._parent) {
    e3 && (this._instance.parent = e3._instance, this._inheritParentContext(e3));
  }
  _inheritParentContext(e3 = this._parent) {
    e3 && this._app && Object.setPrototypeOf(this._app._context.provides, e3._instance.provides);
  }
  disconnectedCallback() {
    this._connected = !1, o(() => {
      this._connected || (this._ob &&= (this._ob.disconnect(), null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets &&= (this._teleportTargets.clear(), void 0));
    });
  }
  _processMutations(e3) {
    for (let t2 of e3) this._setAttr(t2.attributeName);
  }
  _resolveDef() {
    if (this._pendingResolve) return this._pendingResolve;
    for (let e4 = 0; e4 < this.attributes.length; e4++) this._setAttr(this.attributes[e4].name);
    this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
    let e3 = (e4, t3 = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      let { props: n2, styles: r2 } = e4, i2;
      if (n2 && !x(n2)) for (let e5 in n2) {
        let t4 = n2[e5];
        (t4 === Number || t4 && t4.type === Number) && (e5 in this._props && (this._props[e5] = E(this._props[e5])), (i2 ||= /* @__PURE__ */ Object.create(null))[_(e5)] = !0);
      }
      this._numberProps = i2, this._resolveProps(e4), this.shadowRoot && this._applyStyles(r2), this._mount(e4);
    }, t2 = this._def.__asyncLoader;
    if (t2) return this._pendingResolve = t2().then((t3) => {
      t3.configureApp = this._def.configureApp, e3(this._def = t3, !0);
    }), this._pendingResolve;
    e3(this._def);
  }
  _mount(e3) {
    this._app = this._createApp(e3), this._inheritParentContext(), e3.configureApp && e3.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    let t2 = this._instance && this._instance.exposed;
    if (t2) for (let e4 in t2) h(this, e4) || Object.defineProperty(this, e4, { get: () => se(t2[e4]) });
  }
  _resolveProps(e3) {
    let { props: t2 } = e3, n2 = x(t2) ? t2 : Object.keys(t2 || {});
    for (let e4 of Object.keys(this)) e4[0] !== "_" && n2.includes(e4) && this._setProp(e4, this[e4]);
    for (let e4 of n2.map(_)) Object.defineProperty(this, e4, { get() {
      return this._getProp(e4);
    }, set(t3) {
      this._setProp(e4, t3, !0, !this._patching);
    } });
  }
  _setAttr(e3) {
    if (e3.startsWith("data-v-")) return;
    let t2 = this.hasAttribute(e3), n2 = t2 ? this.getAttribute(e3) : ct, r2 = _(e3);
    t2 && this._numberProps && this._numberProps[r2] && (n2 = E(n2)), this._setProp(r2, n2, !1, !0);
  }
  _getProp(e3) {
    return this._props[e3];
  }
  _setProp(e3, t2, n2 = !0, r2 = !1) {
    if (t2 !== this._props[e3] && (this._dirty = !0, t2 === ct ? delete this._props[e3] : (this._props[e3] = t2, e3 === "key" && this._app && (this._app._ceVNode.key = t2)), r2 && this._instance && this._update(), n2)) {
      let n3 = this._ob;
      n3 && (this._processMutations(n3.takeRecords()), n3.disconnect()), t2 === !0 ? this.setAttribute(b(e3), "") : typeof t2 == "string" || typeof t2 == "number" ? this.setAttribute(b(e3), t2 + "") : t2 || this.removeAttribute(b(e3)), n3 && n3.observe(this, { attributes: !0 });
    }
  }
  _update() {
    let e3 = this._createVNode();
    this._app && (e3.appContext = this._app._context), Bt(e3, this._root);
  }
  _createVNode() {
    let e3 = {};
    this.shadowRoot || (e3.onVnodeMounted = e3.onVnodeUpdated = this._renderSlots.bind(this));
    let t2 = he(this._def, d(e3, this._props));
    return this._instance || (t2.ce = (e4) => {
      this._instance = e4, e4.ce = this, e4.isCE = !0;
      let t3 = (e5, t4) => {
        this.dispatchEvent(new CustomEvent(e5, m(t4[0]) ? d({ detail: t4 }, t4[0]) : { detail: t4 }));
      };
      e4.emit = (e5, ...n2) => {
        t3(e5, n2), b(e5) !== e5 && t3(b(e5), n2);
      }, this._setParent();
    }), t2;
  }
  _applyStyles(e3, t2, n2) {
    if (!e3) return;
    if (t2) {
      if (t2 === this._def || this._styleChildren.has(t2)) return;
      this._styleChildren.add(t2);
    }
    let r2 = this._nonce, i2 = this.shadowRoot, a2 = n2 ? this._getStyleAnchor(n2) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i2), o2 = null;
    for (let s2 = e3.length - 1; s2 >= 0; s2--) {
      let c2 = document.createElement("style");
      r2 && c2.setAttribute("nonce", r2), c2.textContent = e3[s2], i2.insertBefore(c2, o2 || a2), o2 = c2, s2 === 0 && (n2 || this._styleAnchors.set(this._def, c2), t2 && this._styleAnchors.set(t2, c2));
    }
  }
  _getStyleAnchor(e3) {
    if (!e3) return null;
    let t2 = this._styleAnchors.get(e3);
    return t2 && t2.parentNode === this.shadowRoot ? t2 : (t2 && this._styleAnchors.delete(e3), null);
  }
  _getRootStyleInsertionAnchor(e3) {
    for (let t2 = 0; t2 < e3.childNodes.length; t2++) {
      let n2 = e3.childNodes[t2];
      if (!(n2 instanceof HTMLStyleElement)) return n2;
    }
    return null;
  }
  _parseSlots() {
    let e3 = this._slots = {}, t2;
    for (; t2 = this.firstChild; ) {
      let n2 = t2.nodeType === 1 && t2.getAttribute("slot") || "default";
      (e3[n2] || (e3[n2] = [])).push(t2), this.removeChild(t2);
    }
  }
  _renderSlots() {
    let e3 = this._getSlots(), t2 = this._instance.type.__scopeId;
    for (let n2 = 0; n2 < e3.length; n2++) {
      let r2 = e3[n2], i2 = r2.getAttribute("name") || "default", a2 = this._slots[i2], o2 = r2.parentNode;
      if (a2) for (let e4 of a2) {
        if (t2 && e4.nodeType === 1) {
          let n3 = t2 + "-s", r3 = document.createTreeWalker(e4, 1);
          e4.setAttribute(n3, "");
          let i3;
          for (; i3 = r3.nextNode(); ) i3.setAttribute(n3, "");
        }
        o2.insertBefore(e4, r2);
      }
      else for (; r2.firstChild; ) o2.insertBefore(r2.firstChild, r2);
      o2.removeChild(r2);
    }
  }
  _getSlots() {
    let e3 = [this];
    this._teleportTargets && e3.push(...this._teleportTargets);
    let t2 = /* @__PURE__ */ new Set();
    for (let n2 of e3) {
      let e4 = n2.querySelectorAll("slot");
      for (let n3 = 0; n3 < e4.length; n3++) t2.add(e4[n3]);
    }
    return Array.from(t2);
  }
  _injectChildStyle(e3, t2) {
    this._applyStyles(e3.styles, e3, t2);
  }
  _beginPatch() {
    this._patching = !0, this._dirty = !1;
  }
  _endPatch() {
    this._patching = !1, this._dirty && this._instance && this._update();
  }
  _hasShadowRoot() {
    return this._def.shadowRoot !== !1;
  }
  _removeChildStyle(e3) {
  }
};
function ft(e3 = "$style") {
  {
    let t2 = O();
    if (!t2) return g;
    let n2 = t2.type.__cssModules;
    return n2 && n2[e3] || g;
  }
}
var pt = /* @__PURE__ */ new WeakMap();
var mt = /* @__PURE__ */ new WeakMap();
var J = /* @__PURE__ */ Symbol("_moveCb");
var ht = /* @__PURE__ */ Symbol("_enterCb");
var gt = ((e3) => (delete e3.props.mode, e3))({ name: "TransitionGroup", props: d({}, Te, { tag: String, moveClass: String }), setup(t2, { slots: n2 }) {
  let r2 = O(), i2 = de(), o2, s2;
  return ne(() => {
    if (!o2.length) return;
    let e3 = t2.moveClass || `${t2.name || "v"}-move`;
    if (!xt(o2[0].el, r2.vnode.el, e3)) {
      o2 = [];
      return;
    }
    o2.forEach(_t), o2.forEach(vt);
    let n3 = o2.filter(yt);
    R(r2.vnode.el), n3.forEach((t3) => {
      let n4 = t3.el, r3 = n4.style;
      I(n4, e3), r3.transform = r3.webkitTransform = r3.transitionDuration = "";
      let i3 = n4[J] = (t4) => {
        t4 && t4.target !== n4 || (!t4 || t4.propertyName.endsWith("transform")) && (n4.removeEventListener("transitionend", i3), n4[J] = null, L(n4, e3));
      };
      n4.addEventListener("transitionend", i3);
    }), o2 = [];
  }), () => {
    let c2 = a(t2), l2 = Oe(c2), u2 = c2.tag || oe;
    if (o2 = [], s2) for (let t3 = 0; t3 < s2.length; t3++) {
      let n3 = s2[t3];
      n3.el && n3.el instanceof Element && !n3.el[B] && (o2.push(n3), e(n3, v(n3, l2, i2, r2)), pt.set(n3, bt(n3.el)));
    }
    s2 = n2.default ? te(n2.default()) : [];
    for (let t3 = 0; t3 < s2.length; t3++) {
      let n3 = s2[t3];
      n3.key != null && e(n3, v(n3, l2, i2, r2));
    }
    return he(u2, null, s2);
  };
} });
function _t(e3) {
  let t2 = e3.el;
  t2[J] && t2[J](), t2[ht] && t2[ht]();
}
function vt(e3) {
  mt.set(e3, bt(e3.el));
}
function yt(e3) {
  let t2 = pt.get(e3), n2 = mt.get(e3), r2 = t2.left - n2.left, i2 = t2.top - n2.top;
  if (r2 || i2) {
    let t3 = e3.el, n3 = t3.style, a2 = t3.getBoundingClientRect(), o2 = 1, s2 = 1;
    return t3.offsetWidth && (o2 = a2.width / t3.offsetWidth), t3.offsetHeight && (s2 = a2.height / t3.offsetHeight), Number.isFinite(o2) && o2 !== 0 || (o2 = 1), Number.isFinite(s2) && s2 !== 0 || (s2 = 1), Math.abs(o2 - 1) < 0.01 && (o2 = 1), Math.abs(s2 - 1) < 0.01 && (s2 = 1), n3.transform = n3.webkitTransform = `translate(${r2 / o2}px,${i2 / s2}px)`, n3.transitionDuration = "0s", e3;
  }
}
function bt(e3) {
  let t2 = e3.getBoundingClientRect();
  return { left: t2.left, top: t2.top };
}
function xt(e3, t2, n2) {
  let r2 = e3.cloneNode(), i2 = e3[N];
  i2 && i2.forEach((e4) => {
    e4.split(/\s+/).forEach((e5) => e5 && r2.classList.remove(e5));
  }), n2.split(/\s+/).forEach((e4) => e4 && r2.classList.add(e4)), r2.style.display = "none";
  let a2 = t2.nodeType === 1 ? t2 : t2.parentNode;
  a2.appendChild(r2);
  let { hasTransform: o2 } = Ne(r2);
  return a2.removeChild(r2), o2;
}
var Y = (e3) => {
  let t2 = e3.props["onUpdate:modelValue"] || !1;
  return x(t2) ? (e4) => n(t2, e4) : t2;
};
function St(e3) {
  e3.target.composing = !0;
}
function Ct(e3) {
  let t2 = e3.target;
  t2.composing && (t2.composing = !1, t2.dispatchEvent(new Event("input")));
}
var X = /* @__PURE__ */ Symbol("_assign");
var Z = /* @__PURE__ */ Symbol("_initialValue");
function Q(e3, n2, r2) {
  return n2 && (e3 = e3.trim()), r2 && (e3 = t(e3)), e3;
}
var wt = { created(e3, { modifiers: { lazy: t2, trim: n2, number: r2 } }, i2) {
  e3.parentNode && (e3.type === "text" ? e3[Z] = e3.defaultValue.replace(/[\r\n]/g, "") : e3.type === "textarea" && (e3[Z] = e3.defaultValue.replace(/\r\n?/g, `
`))), e3[X] = Y(i2);
  let a2 = r2 || i2.props && i2.props.type === "number";
  q(e3, t2 ? "change" : "input", (t3) => {
    t3.target.composing || e3[X](Q(e3.value, n2, a2));
  }), (n2 || a2) && q(e3, "change", () => {
    e3.value = Q(e3.value, n2, a2);
  }), t2 || (q(e3, "compositionstart", St), q(e3, "compositionend", Ct), q(e3, "change", Ct));
}, mounted(e3, { value: t2, modifiers: { trim: n2, number: r2 } }) {
  let i2 = t2 ?? "", a2 = e3[Z];
  delete e3[Z], a2 !== void 0 && (e3.type === "text" || e3.type === "textarea") && e3.value !== a2 ? e3[X](Q(e3.value, n2, r2)) : e3.value = i2;
}, beforeUpdate(e3, { value: n2, oldValue: r2, modifiers: { lazy: i2, trim: a2, number: o2 } }, s2) {
  if (e3[X] = Y(s2), e3.composing) return;
  let c2 = (o2 || e3.type === "number") && !/^0\d/.test(e3.value) ? t(e3.value) : e3.value, l2 = n2 ?? "";
  if (c2 === l2) return;
  let u2 = e3.getRootNode();
  (u2 instanceof Document || u2 instanceof ShadowRoot) && u2.activeElement === e3 && e3.type !== "range" && (i2 && n2 === r2 || a2 && e3.value.trim() === l2) || (e3.value = l2);
} };
var Tt = { deep: !0, created(e3, t2, n2) {
  e3[X] = Y(n2), q(e3, "change", () => {
    let t3 = e3._modelValue, n3 = $(e3), r2 = e3.checked, i2 = e3[X];
    if (x(t3)) {
      let e4 = y(t3, n3), a2 = e4 !== -1;
      if (r2 && !a2) i2(t3.concat(n3));
      else if (!r2 && a2) {
        let n4 = [...t3];
        n4.splice(e4, 1), i2(n4);
      }
    } else if (D(t3)) {
      let e4 = new Set(t3);
      r2 ? e4.add(n3) : e4.delete(n3), i2(e4);
    } else i2(jt(e3, r2));
  });
}, mounted: Et, beforeUpdate(e3, t2, n2) {
  e3[X] = Y(n2), Et(e3, t2, n2);
} };
function Et(e3, { value: t2, oldValue: n2 }, r2) {
  e3._modelValue = t2;
  let i2;
  if (x(t2)) i2 = y(t2, r2.props.value) > -1;
  else if (D(t2)) i2 = t2.has(r2.props.value);
  else {
    if (t2 === n2) return;
    i2 = T(t2, jt(e3, !0));
  }
  e3.checked !== i2 && (e3.checked = i2);
}
var Dt = { created(e3, { value: t2 }, n2) {
  e3.checked = T(t2, n2.props.value), e3[X] = Y(n2), q(e3, "change", () => {
    e3[X]($(e3));
  });
}, beforeUpdate(e3, { value: t2, oldValue: n2 }, r2) {
  e3[X] = Y(r2), t2 !== n2 && (e3.checked = T(t2, r2.props.value));
} };
var Ot = { deep: !0, created(e3, { value: n2, modifiers: { number: r2 } }, i2) {
  e3._modelValue = n2, q(e3, "change", () => {
    let n3 = Array.prototype.filter.call(e3.options, (e4) => e4.selected).map((e4) => r2 ? t($(e4)) : $(e4)), i3 = e3.multiple, a2 = i3 ? D(e3._modelValue) ? new Set(n3) : n3 : n3[0], s2 = e3._pendingValue = [i3, i3 ? x(a2) ? n3.slice() : n3 : a2];
    try {
      e3[X](a2);
    } finally {
      o(() => {
        e3._pendingValue === s2 && (e3._pendingValue = void 0);
      });
    }
  }), e3[X] = Y(i2);
}, mounted(e3, { value: t2 }) {
  At(e3, t2);
}, beforeUpdate(e3, { value: t2 }, n2) {
  e3._modelValue = t2, e3[X] = Y(n2);
}, updated(e3, { value: t2 }) {
  let n2 = e3._pendingValue;
  e3._pendingValue = void 0, n2 && n2[0] === e3.multiple && kt(t2, n2[1], n2[0]) || At(e3, t2);
} };
function kt(e3, t2, n2) {
  if (!n2 || x(e3)) return T(e3, t2);
  if (D(e3)) {
    if (e3.size !== t2.length) return !1;
    for (let n3 of t2) if (!e3.has(n3)) return !1;
    return !0;
  }
  return !1;
}
function At(e3, t2) {
  let n2 = e3.multiple, r2 = x(t2);
  if (!n2 || r2 || D(t2)) {
    for (let i2 = 0, a2 = e3.options.length; i2 < a2; i2++) {
      let a3 = e3.options[i2], o2 = $(a3);
      if (n2)
        if (r2) {
          let e4 = typeof o2;
          a3.selected = e4 === "string" || e4 === "number" ? t2.some((e5) => String(e5) === String(o2)) : y(t2, o2) > -1;
        } else a3.selected = t2.has(o2);
      else if (T($(a3), t2)) {
        e3.selectedIndex !== i2 && (e3.selectedIndex = i2);
        return;
      }
    }
    !n2 && e3.selectedIndex !== -1 && (e3.selectedIndex = -1);
  }
}
function $(e3) {
  return "_value" in e3 ? e3._value : e3.value;
}
function jt(e3, t2) {
  let n2 = t2 ? "_trueValue" : "_falseValue";
  return n2 in e3 ? e3[n2] : t2;
}
var Mt = ["ctrl", "shift", "alt", "meta"];
var Nt = { stop: (e3) => e3.stopPropagation(), prevent: (e3) => e3.preventDefault(), self: (e3) => e3.target !== e3.currentTarget, ctrl: (e3) => !e3.ctrlKey, shift: (e3) => !e3.shiftKey, alt: (e3) => !e3.altKey, meta: (e3) => !e3.metaKey, left: (e3) => "button" in e3 && e3.button !== 0, middle: (e3) => "button" in e3 && e3.button !== 1, right: (e3) => "button" in e3 && e3.button !== 2, exact: (e3, t2) => Mt.some((n2) => e3[`${n2}Key`] && !t2.includes(n2)) };
var Pt = (e3, t2) => {
  if (!e3) return e3;
  let n2 = e3._withMods ||= {}, r2 = t2.join(".");
  return n2[r2] || (n2[r2] = ((n3, ...r3) => {
    for (let e4 = 0; e4 < t2.length; e4++) {
      let r4 = Nt[t2[e4]];
      if (r4 && r4(n3, t2)) return;
    }
    return e3(n3, ...r3);
  }));
};
var Ft = { esc: "escape", space: " ", up: "arrow-up", left: "arrow-left", right: "arrow-right", down: "arrow-down", delete: "backspace" };
var It = (e3, t2) => {
  let n2 = e3._withKeys ||= {}, r2 = t2.join(".");
  return n2[r2] || (n2[r2] = ((n3) => {
    if (!("key" in n3)) return;
    let r3 = b(n3.key);
    if (t2.some((e4) => e4 === r3 || Ft[e4] === r3)) return e3(n3);
  }));
};
var Lt = d({ patchProp: at }, Ce);
var Rt;
function zt() {
  return Rt ||= ae(Lt);
}
var Bt = ((...e3) => {
  zt().render(...e3);
});
var Vt = ((...e3) => {
  let t2 = zt().createApp(...e3), { mount: n2 } = t2;
  return t2.mount = (e4) => {
    let r2 = Ut(e4);
    if (!r2) return;
    let i2 = t2._component;
    u(i2) || i2.render || i2.template || (i2.template = r2.innerHTML), r2.nodeType === 1 && (r2.textContent = "");
    let a2 = n2(r2, !1, Ht(r2));
    return r2 instanceof Element && (r2.removeAttribute("v-cloak"), r2.setAttribute("data-v-app", "")), a2;
  }, t2;
});
function Ht(e3) {
  if (e3 instanceof SVGElement) return "svg";
  if (typeof MathMLElement == "function" && e3 instanceof MathMLElement) return "mathml";
}
function Ut(e3) {
  return w(e3) ? document.querySelector(e3) : e3;
}
export {Bt as a,wt as d,Le as f,lt as i,Dt as l,Pt as m,gt as n,ft as o,It as p,Vt as r,ze as s,Ee as t};
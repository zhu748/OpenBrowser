import {C as e,F as t,St as r,Tt as i,V as a,d as s,jt as c,kt as l,st as u,w as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {S as m,a as h,c as g,g as v,h as y,l as x,m as S,o as w,p as T,s as D,t as O,u as k,x as A} from "./dist-ufdnm93_.js";
var M = typeof globalThis == "object" && globalThis || typeof window == "object" && window || typeof self == "object" && self || typeof global == "object" && global || /* @__PURE__ */ (function() {
  return this;
})();
function N(e2) {
  return M.Buffer !== void 0 && M.Buffer.isBuffer(e2);
}
function P(e2) {
  return Object.getOwnPropertySymbols(e2).filter((t2) => Object.prototype.propertyIsEnumerable.call(e2, t2));
}
function ee(e2) {
  return e2 == null ? e2 === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(e2);
}
var te = "[object RegExp]";
var ne = "[object String]";
var re = "[object Number]";
var ie = "[object Boolean]";
var ae = "[object Arguments]";
var oe = "[object Symbol]";
var se = "[object Date]";
var ce = "[object Map]";
var le = "[object Set]";
var ue = "[object Array]";
var de = "[object Function]";
var fe = "[object ArrayBuffer]";
var pe = "[object Object]";
var me = "[object Error]";
var he = "[object DataView]";
var ge = "[object Uint8Array]";
var F = "[object Uint8ClampedArray]";
var I = "[object Uint16Array]";
var L = "[object Uint32Array]";
var _e = "[object BigUint64Array]";
var ve = "[object Int8Array]";
var ye = "[object Int16Array]";
var be = "[object Int32Array]";
var xe = "[object BigInt64Array]";
var Se = "[object Float32Array]";
var Ce = "[object Float64Array]";
function we(e2) {
  if (!e2 || typeof e2 != "object") return !1;
  let t2 = Object.getPrototypeOf(e2);
  return t2 !== null && t2 !== Object.prototype && Object.getPrototypeOf(t2) !== null ? !1 : Object.prototype.toString.call(e2) === "[object Object]";
}
function Te(t2 = {}) {
  let { inheritAttrs: n2 = !0, name: r2 = "ReusableTemplate" } = t2, a2 = i(), o2 = e({ name: `${r2}.define`, setup(e2, { slots: t3 }) {
    return () => {
      a2.value = t3.default;
    };
  } }), s2 = e({ inheritAttrs: n2, name: `${r2}.reuse`, props: t2.props, setup(e2, { attrs: r3, slots: i2 }) {
    return () => {
      if (!a2.value) throw Error("[VueUse] Failed to find the definition of reusable template");
      let o3 = a2.value?.call(a2, { ...t2.props == null ? Ee(r3) : e2, $slots: i2 });
      return n2 && o3?.length === 1 ? o3[0] : o3;
    };
  } });
  return x({ define: o2, reuse: s2 }, [o2, s2]);
}
function Ee(e2) {
  let t2 = {};
  for (let n2 in e2) t2[O(n2)] = e2[n2];
  return t2;
}
var R = h ? window : void 0;
function B(e2) {
  let t2 = l(e2);
  return t2?.$el ?? t2;
}
function V(...e2) {
  let t2 = (e3, t3, n3, r2) => (e3.addEventListener(t3, n3, r2), () => e3.removeEventListener(t3, n3, r2)), n2 = s(() => {
    let t3 = T(l(e2[0])).filter((e3) => e3 != null);
    return t3.every((e3) => typeof e3 != "string") ? t3 : void 0;
  });
  return A(() => [n2.value?.map((e3) => B(e3)) ?? [R].filter((e3) => e3 != null), T(l(n2.value ? e2[1] : e2[0])), T(c(n2.value ? e2[2] : e2[1])), l(n2.value ? e2[3] : e2[2])], ([e3, n3, r2, i2], a2, o2) => {
    if (!e3?.length || !n3?.length || !r2?.length) return;
    let s2 = g(i2) ? { ...i2 } : i2, c2 = e3.flatMap((e4) => n3.flatMap((n4) => r2.map((r3) => t2(e4, n4, r3, s2))));
    o2(() => {
      c2.forEach((e4) => e4());
    });
  }, { flush: "post" });
}
function De() {
  let e2 = i(!1), t2 = d();
  return t2 && a(() => {
    e2.value = !0;
  }, t2), e2;
}
function H(e2) {
  let t2 = De();
  return s(() => (t2.value, !!e2()));
}
function U(e2, t2, n2 = {}) {
  let { window: r2 = R, ...i2 } = n2, a2, o2 = H(() => r2 && "MutationObserver" in r2), c2 = () => {
    a2 &&= (a2.disconnect(), void 0);
  }, d2 = u(s(() => {
    let t3 = T(l(e2)).map(B).filter(k);
    return new Set(t3);
  }), (e3) => {
    c2(), o2.value && e3.size && (a2 = new MutationObserver(t2), e3.forEach((e4) => a2.observe(e4, i2)));
  }, { immediate: !0, flush: "post" }), f2 = () => a2?.takeRecords(), p2 = () => {
    d2(), c2();
  };
  return v(p2), { isSupported: o2, stop: p2, takeRecords: f2 };
}
function Ae(e2) {
  return JSON.parse(JSON.stringify(e2));
}
var K = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
var q = "__vueuse_ssr_handlers__";
var je = Me();
function Me() {
  return q in K || (K[q] = K[q] || {}), K[q];
}
function Ne(e2, t2) {
  return je[e2] || t2;
}
function Pe(e2) {
  return e2 == null ? "any" : e2 instanceof Set ? "set" : e2 instanceof Map ? "map" : e2 instanceof Date ? "date" : typeof e2 == "boolean" ? "boolean" : typeof e2 == "string" ? "string" : typeof e2 == "object" ? "object" : Number.isNaN(e2) ? "any" : "number";
}
var Fe = { boolean: { read: (e2) => e2 === "true", write: (e2) => String(e2) }, object: { read: (e2) => JSON.parse(e2), write: (e2) => JSON.stringify(e2) }, number: { read: (e2) => Number.parseFloat(e2), write: (e2) => String(e2) }, any: { read: (e2) => e2, write: (e2) => String(e2) }, string: { read: (e2) => e2, write: (e2) => String(e2) }, map: { read: (e2) => new Map(JSON.parse(e2)), write: (e2) => JSON.stringify(Array.from(e2.entries())) }, set: { read: (e2) => new Set(JSON.parse(e2)), write: (e2) => JSON.stringify(Array.from(e2)) }, date: { read: (e2) => new Date(e2), write: (e2) => e2.toISOString() } };
var J = "vueuse-storage";
function Ie(e2, n2, a2, o2 = {}) {
  let { flush: c2 = "pre", deep: d2 = !0, listenToStorageChanges: f2 = !0, writeDefaults: p2 = !0, mergeDefaults: h2 = !1, shallow: g2, window: _2 = R, eventFilter: v2, onError: b2 = (e3) => {
    console.error(e3);
  }, initOnMounted: x2 } = o2, S2 = (g2 ? i : r)(typeof n2 == "function" ? n2() : n2), C2 = s(() => l(e2));
  if (!a2) try {
    a2 = Ne("getDefaultStorage", () => R?.localStorage)();
  } catch (e3) {
    b2(e3);
  }
  if (!a2) return S2;
  let w2 = l(n2), T2 = Pe(w2), E2 = o2.serializer ?? Fe[T2], { pause: D2, resume: O2 } = m(S2, (e3) => j2(e3), { flush: c2, deep: d2, eventFilter: v2 });
  u(C2, () => N2(), { flush: c2 });
  let k2 = !1;
  _2 && f2 && (a2 instanceof Storage ? V(_2, "storage", (e3) => {
    (!x2 || k2) && N2(e3);
  }, { passive: !0 }) : V(_2, J, (e3) => {
    (!x2 || k2) && P2(e3);
  })), x2 ? y(() => {
    k2 = !0, N2();
  }) : N2();
  function A2(e3, t2) {
    if (_2) {
      let n3 = { key: C2.value, oldValue: e3, newValue: t2, storageArea: a2 };
      _2.dispatchEvent(a2 instanceof Storage ? new StorageEvent("storage", n3) : new CustomEvent(J, { detail: n3 }));
    }
  }
  function j2(e3) {
    try {
      let t2 = a2.getItem(C2.value);
      if (e3 == null) A2(t2, null), a2.removeItem(C2.value);
      else {
        let n3 = E2.write(e3);
        t2 !== n3 && (a2.setItem(C2.value, n3), A2(t2, n3));
      }
    } catch (e4) {
      b2(e4);
    }
  }
  function M2(e3) {
    let t2 = e3 ? e3.newValue : a2.getItem(C2.value);
    if (t2 == null) return p2 && w2 != null && a2.setItem(C2.value, E2.write(w2)), w2;
    if (!e3 && h2) {
      let e4 = E2.read(t2);
      return typeof h2 == "function" ? h2(e4, w2) : T2 === "object" && !Array.isArray(e4) ? { ...w2, ...e4 } : e4;
    }
    return typeof t2 == "string" ? E2.read(t2) : t2;
  }
  function N2(e3) {
    if (!(e3 && e3.storageArea !== a2)) {
      if (e3 && e3.key == null) S2.value = w2;
      else if (!(e3 && e3.key !== C2.value)) {
        D2();
        try {
          let t2 = E2.write(S2.value);
          (e3 === void 0 || e3?.newValue !== t2) && (S2.value = M2(e3));
        } catch (e4) {
          b2(e4);
        } finally {
          e3 ? t(O2) : O2();
        }
      }
    }
  }
  function P2(e3) {
    N2(e3.detail);
  }
  return S2;
}
function Y(e2, t2, n2 = {}) {
  let { window: r2 = R, ...i2 } = n2, a2, o2 = H(() => r2 && "ResizeObserver" in r2), c2 = () => {
    a2 &&= (a2.disconnect(), void 0);
  }, d2 = u(s(() => {
    let t3 = l(e2);
    return Array.isArray(t3) ? t3.map((e3) => B(e3)) : [B(t3)];
  }), (e3) => {
    if (c2(), o2.value && r2) {
      a2 = new ResizeObserver(t2);
      for (let t3 of e3) t3 && a2.observe(t3, i2);
    }
  }, { immediate: !0, flush: "post" }), f2 = () => {
    c2(), d2();
  };
  return v(f2), { isSupported: o2, stop: f2 };
}
function Be(e2, t2 = { width: 0, height: 0 }, n2 = {}) {
  let { window: r2 = R, box: a2 = "content-box" } = n2, o2 = s(() => {
    var t3;
    return (t3 = B(e2)) == null || (t3 = t3.namespaceURI) == null ? void 0 : t3.includes("svg");
  }), c2 = i(t2.width), l2 = i(t2.height), { stop: d2 } = Y(e2, ([t3]) => {
    let n3 = a2 === "border-box" ? t3.borderBoxSize : a2 === "content-box" ? t3.contentBoxSize : t3.devicePixelContentBoxSize;
    if (r2 && o2.value) {
      let t4 = B(e2);
      if (t4) {
        let e3 = t4.getBoundingClientRect();
        c2.value = e3.width, l2.value = e3.height;
      }
    } else if (n3) {
      let e3 = T(n3);
      c2.value = e3.reduce((e4, { inlineSize: t4 }) => e4 + t4, 0), l2.value = e3.reduce((e4, { blockSize: t4 }) => e4 + t4, 0);
    } else c2.value = t3.contentRect.width, l2.value = t3.contentRect.height;
  }, n2);
  y(() => {
    let n3 = B(e2);
    n3 && (c2.value = "offsetWidth" in n3 ? n3.offsetWidth : t2.width, l2.value = "offsetHeight" in n3 ? n3.offsetHeight : t2.height);
  });
  let f2 = u(() => B(e2), (e3) => {
    c2.value = e3 ? t2.width : 0, l2.value = e3 ? t2.height : 0;
  });
  function p2() {
    d2(), f2();
  }
  return { width: c2, height: l2, stop: p2 };
}
function X(e2) {
  return typeof Window < "u" && e2 instanceof Window ? e2.document.documentElement : typeof Document < "u" && e2 instanceof Document ? e2.documentElement : e2;
}
function Z(e2, t2, n2 = {}) {
  let { window: r2 = R } = n2;
  return Ie(e2, t2, r2?.localStorage, n2);
}
function Q(e2) {
  let t2 = window.getComputedStyle(e2);
  if (t2.overflowX === "scroll" || t2.overflowY === "scroll" || t2.overflowX === "auto" && e2.clientWidth < e2.scrollWidth || t2.overflowY === "auto" && e2.clientHeight < e2.scrollHeight) return !0;
  {
    let t3 = e2.parentNode;
    return !t3 || t3.tagName === "BODY" ? !1 : Q(t3);
  }
}
function qe(e2) {
  let t2 = e2 || window.event, n2 = t2.target;
  return Q(n2) ? !1 : t2.touches.length > 1 || (t2.preventDefault && t2.preventDefault(), !1);
}
var $ = /* @__PURE__ */ new WeakMap();
function Je(e2, t2 = !1) {
  let n2 = i(t2), r2 = null, a2 = "";
  u(S(e2), (e3) => {
    let t3 = X(l(e3));
    if (t3) {
      let e4 = t3;
      if ($.get(e4) || $.set(e4, e4.style.overflow), e4.style.overflow !== "hidden" && (a2 = e4.style.overflow), e4.style.overflow === "hidden") return n2.value = !0;
      if (n2.value) return e4.style.overflow = "hidden";
    }
  }, { immediate: !0 });
  let o2 = () => {
    let t3 = X(l(e2));
    t3 && !n2.value && (D && (r2 = V(t3, "touchmove", (e3) => {
      qe(e3);
    }, { passive: !1 })), t3.style.overflow = "hidden", n2.value = !0);
  }, c2 = () => {
    let t3 = X(l(e2));
    t3 && n2.value && (D && r2?.(), t3.style.overflow = a2, $.delete(t3), n2.value = !1);
  };
  return v(c2), s({ get() {
    return n2.value;
  }, set(e3) {
    e3 ? o2() : c2();
  } });
}
function Ye(e2, n2, i2, a2 = {}) {
  var o2, c2;
  let { clone: l2 = !1, passive: f2 = !1, eventName: p2, deep: m2 = !1, defaultValue: h2, shouldEmit: g2 } = a2, _2 = d(), v2 = i2 || _2?.emit || (_2 == null || (o2 = _2.$emit) == null ? void 0 : o2.bind(_2)) || (_2 == null || (c2 = _2.proxy) == null || (c2 = c2.$emit) == null ? void 0 : c2.bind(_2?.proxy)), y2 = p2;
  n2 ||= "modelValue", y2 ||= `update:${n2.toString()}`;
  let b2 = (e3) => l2 ? typeof l2 == "function" ? l2(e3) : Ae(e3) : e3, x2 = () => w(e2[n2]) ? b2(e2[n2]) : h2, S2 = (e3) => {
    g2 ? g2(e3) && v2(y2, e3) : v2(y2, e3);
  };
  if (f2) {
    let i3 = r(x2()), a3 = !1;
    return u(() => e2[n2], (e3) => {
      a3 || (a3 = !0, i3.value = b2(e3), t(() => a3 = !1));
    }), u(i3, (t2) => {
      !a3 && (t2 !== e2[n2] || m2) && S2(t2);
    }, { deep: m2 }), i3;
  }
  return s({ get() {
    return x2();
  }, set(e3) {
    S2(e3);
  } });
}
export {ye as A,I as B,ie as C,Se as D,me as E,pe as F,P as G,ge as H,te as I,N as K,le as L,ve as M,ce as N,Ce as O,re as P,ne as R,_e as S,se as T,F as U,L as V,ee as W,we as _,Be as a,ue as b,Z as c,Ye as h,be as j,de as k,Je as m,V as o,Y as p,Te as t,U as u,ae as v,he as w,xe as x,fe as y,oe as z};
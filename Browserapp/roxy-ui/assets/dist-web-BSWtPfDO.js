function e(t2) {
  "@babel/helpers - typeof";
  return e = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e2) {
    return typeof e2;
  } : function(e2) {
    return e2 && typeof Symbol == "function" && e2.constructor === Symbol && e2 !== Symbol.prototype ? "symbol" : typeof e2;
  }, e(t2);
}
var t;
var n = { Webkit: "-webkit-", Moz: "-moz-", ms: "-ms-", O: "-o-" };
function r() {
  if (t !== void 0) return t;
  t = "";
  var e2 = document.createElement("p").style, r2 = "Transform";
  for (var i2 in n) i2 + r2 in e2 && (t = i2);
  return t;
}
function i() {
  return r() ? `${r()}TransitionProperty` : "transitionProperty";
}
function a() {
  return r() ? `${r()}Transform` : "transform";
}
function o(e2, t2) {
  var n2 = i();
  n2 && (e2.style[n2] = t2, n2 !== "transitionProperty" && (e2.style.transitionProperty = t2));
}
function s(e2, t2) {
  var n2 = a();
  n2 && (e2.style[n2] = t2, n2 !== "transform" && (e2.style.transform = t2));
}
function c(e2) {
  return e2.style.transitionProperty || e2.style[i()];
}
function l(e2) {
  var t2 = window.getComputedStyle(e2, null), n2 = t2.getPropertyValue("transform") || t2.getPropertyValue(a());
  if (n2 && n2 !== "none") {
    var r2 = n2.replace(/[^0-9\-.,]/g, "").split(",");
    return { x: parseFloat(r2[12] || r2[4], 0), y: parseFloat(r2[13] || r2[5], 0) };
  }
  return { x: 0, y: 0 };
}
var u = /matrix\((.*)\)/;
var d = /matrix3d\((.*)\)/;
function f(e2, t2) {
  var n2 = window.getComputedStyle(e2, null), r2 = n2.getPropertyValue("transform") || n2.getPropertyValue(a());
  if (r2 && r2 !== "none") {
    var i2, o2 = r2.match(u);
    o2 ? (o2 = o2[1], i2 = o2.split(",").map(function(e3) {
      return parseFloat(e3, 10);
    }), i2[4] = t2.x, i2[5] = t2.y, s(e2, `matrix(${i2.join(",")})`)) : (i2 = r2.match(d)[1].split(",").map(function(e3) {
      return parseFloat(e3, 10);
    }), i2[12] = t2.x, i2[13] = t2.y, s(e2, `matrix3d(${i2.join(",")})`));
  } else s(e2, `translateX(${t2.x}px) translateY(${t2.y}px) translateZ(0)`);
}
var p = "[\\-+]?(?:\\d*\\.|)\\d+(?:[eE][\\-+]?\\d+|)";
var m;
function h(e2) {
  var t2 = e2.style.display;
  e2.style.display = "none", e2.offsetHeight, e2.style.display = t2;
}
function g(t2, n2, r2) {
  var i2 = r2;
  if (e(n2) === "object") for (var a2 in n2) n2.hasOwnProperty(a2) && g(t2, a2, n2[a2]);
  else if (i2 !== void 0) typeof i2 == "number" && (i2 = `${i2}px`), t2.style[n2] = i2;
  else return m(t2, n2);
}
function _(e2) {
  var t2, n2, r2, i2 = e2.ownerDocument, a2 = i2.body, o2 = i2 && i2.documentElement;
  return t2 = e2.getBoundingClientRect(), n2 = Math.floor(t2.left), r2 = Math.floor(t2.top), n2 -= o2.clientLeft || a2.clientLeft || 0, r2 -= o2.clientTop || a2.clientTop || 0, { left: n2, top: r2 };
}
function v(e2, t2) {
  var n2 = e2[`page${t2 ? "Y" : "X"}Offset`], r2 = `scroll${t2 ? "Top" : "Left"}`;
  if (typeof n2 != "number") {
    var i2 = e2.document;
    n2 = i2.documentElement[r2], typeof n2 != "number" && (n2 = i2.body[r2]);
  }
  return n2;
}
function y(e2) {
  return v(e2);
}
function b(e2) {
  return v(e2, !0);
}
function x(e2) {
  var t2 = _(e2), n2 = e2.ownerDocument, r2 = n2.defaultView || n2.parentWindow;
  return t2.left += y(r2), t2.top += b(r2), t2;
}
function S(e2) {
  return e2 != null && e2 == e2.window;
}
function C(e2) {
  return S(e2) ? e2.document : e2.nodeType === 9 ? e2 : e2.ownerDocument;
}
function w(e2, t2, n2) {
  var r2 = n2, i2 = "", a2 = C(e2);
  return r2 ||= a2.defaultView.getComputedStyle(e2, null), r2 && (i2 = r2.getPropertyValue(t2) || r2[t2]), i2;
}
var T = RegExp(`^(${p})(?!px)[a-z%]+$`, "i");
var ee = /^(top|right|bottom|left)$/;
var E = "currentStyle";
var D = "runtimeStyle";
var O = "left";
var te = "px";
function ne(e2, t2) {
  var n2 = e2[E] && e2[E][t2];
  if (T.test(n2) && !ee.test(t2)) {
    var r2 = e2.style, i2 = r2[O], a2 = e2[D][O];
    e2[D][O] = e2[E][O], r2[O] = t2 === "fontSize" ? "1em" : n2 || 0, n2 = r2.pixelLeft + te, r2[O] = i2, e2[D][O] = a2;
  }
  return n2 === "" ? "auto" : n2;
}
typeof window < "u" && (m = window.getComputedStyle ? w : ne);
function k(e2, t2) {
  return e2 === "left" ? t2.useCssRight ? "right" : e2 : t2.useCssBottom ? "bottom" : e2;
}
function re(e2) {
  if (e2 === "left") return "right";
  if (e2 === "right") return "left";
  if (e2 === "top") return "bottom";
  if (e2 === "bottom") return "top";
}
function A(e2, t2, n2) {
  g(e2, "position") === "static" && (e2.style.position = "relative");
  var r2 = -999, i2 = -999, a2 = k("left", n2), s2 = k("top", n2), l2 = re(a2), u2 = re(s2);
  a2 !== "left" && (r2 = 999), s2 !== "top" && (i2 = 999);
  var d2 = "", f2 = x(e2);
  ("left" in t2 || "top" in t2) && (d2 = c(e2) || "", o(e2, "none")), "left" in t2 && (e2.style[l2] = "", e2.style[a2] = `${r2}px`), "top" in t2 && (e2.style[u2] = "", e2.style[s2] = `${i2}px`), h(e2);
  var p2 = x(e2), m2 = {};
  for (var _2 in t2) if (t2.hasOwnProperty(_2)) {
    var v2 = k(_2, n2), y2 = _2 === "left" ? r2 : i2, b2 = f2[_2] - p2[_2];
    m2[v2] = v2 === _2 ? y2 + b2 : y2 - b2;
  }
  g(e2, m2), h(e2), ("left" in t2 || "top" in t2) && o(e2, d2);
  var S2 = {};
  for (var C2 in t2) if (t2.hasOwnProperty(C2)) {
    var w2 = k(C2, n2), T2 = t2[C2] - f2[C2];
    S2[w2] = C2 === w2 ? m2[w2] + T2 : m2[w2] - T2;
  }
  g(e2, S2);
}
function ie(e2, t2) {
  var n2 = x(e2), r2 = l(e2), i2 = { x: r2.x, y: r2.y };
  "left" in t2 && (i2.x = r2.x + t2.left - n2.left), "top" in t2 && (i2.y = r2.y + t2.top - n2.top), f(e2, i2);
}
function ae(e2, t2, n2) {
  if (n2.ignoreShake) {
    var r2 = x(e2), i2 = r2.left.toFixed(0), o2 = r2.top.toFixed(0), s2 = t2.left.toFixed(0), c2 = t2.top.toFixed(0);
    if (i2 === s2 && o2 === c2) return;
  }
  n2.useCssRight || n2.useCssBottom ? A(e2, t2, n2) : n2.useCssTransform && a() in document.body.style ? ie(e2, t2) : A(e2, t2, n2);
}
function j(e2, t2) {
  for (var n2 = 0; n2 < e2.length; n2++) t2(e2[n2]);
}
function M(e2) {
  return m(e2, "boxSizing") === "border-box";
}
var oe = ["margin", "border", "padding"];
var N = -1;
var se = 2;
var P = 1;
var ce = 0;
function le(e2, t2, n2) {
  var r2 = {}, i2 = e2.style, a2;
  for (a2 in t2) t2.hasOwnProperty(a2) && (r2[a2] = i2[a2], i2[a2] = t2[a2]);
  for (a2 in n2.call(e2), t2) t2.hasOwnProperty(a2) && (i2[a2] = r2[a2]);
}
function F(e2, t2, n2) {
  for (var r2 = 0, i2, a2 = 0, o2; a2 < t2.length; a2++) if (i2 = t2[a2], i2) for (o2 = 0; o2 < n2.length; o2++) {
    var s2 = void 0;
    s2 = i2 === "border" ? `${i2}${n2[o2]}Width` : i2 + n2[o2], r2 += parseFloat(m(e2, s2)) || 0;
  }
  return r2;
}
var I = { getParent: function(e2) {
  var t2 = e2;
  do
    t2 = t2.nodeType === 11 && t2.host ? t2.host : t2.parentNode;
  while (t2 && t2.nodeType !== 1 && t2.nodeType !== 9);
  return t2;
} };
j(["Width", "Height"], function(e2) {
  I[`doc${e2}`] = function(t2) {
    var n2 = t2.document;
    return Math.max(n2.documentElement[`scroll${e2}`], n2.body[`scroll${e2}`], I[`viewport${e2}`](n2));
  }, I[`viewport${e2}`] = function(t2) {
    var n2 = `client${e2}`, r2 = t2.document, i2 = r2.body, a2 = r2.documentElement[n2];
    return r2.compatMode === "CSS1Compat" && a2 || i2 && i2[n2] || a2;
  };
});
function L(e2, t2, n2) {
  var r2 = n2;
  if (S(e2)) return t2 === "width" ? I.viewportWidth(e2) : I.viewportHeight(e2);
  if (e2.nodeType === 9) return t2 === "width" ? I.docWidth(e2) : I.docHeight(e2);
  var i2 = t2 === "width" ? ["Left", "Right"] : ["Top", "Bottom"], a2 = Math.floor(t2 === "width" ? e2.getBoundingClientRect().width : e2.getBoundingClientRect().height), o2 = M(e2), s2 = 0;
  (a2 == null || a2 <= 0) && (a2 = void 0, s2 = m(e2, t2), (s2 == null || Number(s2) < 0) && (s2 = e2.style[t2] || 0), s2 = Math.floor(parseFloat(s2)) || 0), r2 === void 0 && (r2 = o2 ? P : N);
  var c2 = a2 !== void 0 || o2, l2 = a2 || s2;
  return r2 === N ? c2 ? l2 - F(e2, ["border", "padding"], i2) : s2 : c2 ? r2 === P ? l2 : l2 + (r2 === se ? -F(e2, ["border"], i2) : F(e2, ["margin"], i2)) : s2 + F(e2, oe.slice(r2), i2);
}
var ue = { position: "absolute", visibility: "hidden", display: "block" };
function R() {
  var e2 = [...arguments], t2, n2 = e2[0];
  return n2.offsetWidth === 0 ? le(n2, ue, function() {
    t2 = L.apply(void 0, e2);
  }) : t2 = L.apply(void 0, e2), t2;
}
j(["width", "height"], function(e2) {
  var t2 = e2.charAt(0).toUpperCase() + e2.slice(1);
  I[`outer${t2}`] = function(t3, n3) {
    return t3 && R(t3, e2, n3 ? ce : P);
  };
  var n2 = e2 === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
  I[e2] = function(t3, r2) {
    var i2 = r2;
    return i2 === void 0 ? t3 && R(t3, e2, N) : t3 ? (M(t3) && (i2 += F(t3, ["padding", "border"], n2)), g(t3, e2, i2)) : void 0;
  };
});
function z(e2, t2) {
  for (var n2 in t2) t2.hasOwnProperty(n2) && (e2[n2] = t2[n2]);
  return e2;
}
var B = { getWindow: function(e2) {
  if (e2 && e2.document && e2.setTimeout) return e2;
  var t2 = e2.ownerDocument || e2;
  return t2.defaultView || t2.parentWindow;
}, getDocument: C, offset: function(e2, t2, n2) {
  if (t2 !== void 0) ae(e2, t2, n2 || {});
  else return x(e2);
}, isWindow: S, each: j, css: g, clone: function(e2) {
  var t2, n2 = {};
  for (t2 in e2) e2.hasOwnProperty(t2) && (n2[t2] = e2[t2]);
  if (e2.overflow) for (t2 in e2) e2.hasOwnProperty(t2) && (n2.overflow[t2] = e2.overflow[t2]);
  return n2;
}, mix: z, getWindowScrollLeft: function(e2) {
  return y(e2);
}, getWindowScrollTop: function(e2) {
  return b(e2);
}, merge: function() {
  for (var e2 = {}, t2 = 0; t2 < arguments.length; t2++) B.mix(e2, t2 < 0 || arguments.length <= t2 ? void 0 : arguments[t2]);
  return e2;
}, viewportWidth: 0, viewportHeight: 0 };
z(B, I);
var V = B.getParent;
function H(e2) {
  if (B.isWindow(e2) || e2.nodeType === 9) return null;
  var t2 = B.getDocument(e2).body, n2, r2 = B.css(e2, "position");
  if (r2 !== "fixed" && r2 !== "absolute") return e2.nodeName.toLowerCase() === "html" ? null : V(e2);
  for (n2 = V(e2); n2 && n2 !== t2 && n2.nodeType !== 9; n2 = V(n2)) if (r2 = B.css(n2, "position"), r2 !== "static") return n2;
  return null;
}
var U = B.getParent;
function de(e2) {
  if (B.isWindow(e2) || e2.nodeType === 9) return !1;
  var t2 = B.getDocument(e2), n2 = t2.body, r2 = null;
  for (r2 = U(e2); r2 && r2 !== n2 && r2 !== t2; r2 = U(r2)) if (B.css(r2, "position") === "fixed") return !0;
  return !1;
}
function W(e2, t2) {
  for (var n2 = { left: 0, right: 1 / 0, top: 0, bottom: 1 / 0 }, r2 = H(e2), i2 = B.getDocument(e2), a2 = i2.defaultView || i2.parentWindow, o2 = i2.body, s2 = i2.documentElement; r2; ) {
    if ((navigator.userAgent.indexOf("MSIE") === -1 || r2.clientWidth !== 0) && r2 !== o2 && r2 !== s2 && B.css(r2, "overflow") !== "visible") {
      var c2 = B.offset(r2);
      c2.left += r2.clientLeft, c2.top += r2.clientTop, n2.top = Math.max(n2.top, c2.top), n2.right = Math.min(n2.right, c2.left + r2.clientWidth), n2.bottom = Math.min(n2.bottom, c2.top + r2.clientHeight), n2.left = Math.max(n2.left, c2.left);
    } else if (r2 === o2 || r2 === s2) break;
    r2 = H(r2);
  }
  var l2 = null;
  !B.isWindow(e2) && e2.nodeType !== 9 && (l2 = e2.style.position, B.css(e2, "position") === "absolute" && (e2.style.position = "fixed"));
  var u2 = B.getWindowScrollLeft(a2), d2 = B.getWindowScrollTop(a2), f2 = B.viewportWidth(a2), p2 = B.viewportHeight(a2), m2 = s2.scrollWidth, h2 = s2.scrollHeight, g2 = window.getComputedStyle(o2);
  if (g2.overflowX === "hidden" && (m2 = a2.innerWidth), g2.overflowY === "hidden" && (h2 = a2.innerHeight), e2.style && (e2.style.position = l2), t2 || de(e2)) n2.left = Math.max(n2.left, u2), n2.top = Math.max(n2.top, d2), n2.right = Math.min(n2.right, u2 + f2), n2.bottom = Math.min(n2.bottom, d2 + p2);
  else {
    var _2 = Math.max(m2, u2 + f2);
    n2.right = Math.min(n2.right, _2);
    var v2 = Math.max(h2, d2 + p2);
    n2.bottom = Math.min(n2.bottom, v2);
  }
  return n2.top >= 0 && n2.left >= 0 && n2.bottom > n2.top && n2.right > n2.left ? n2 : null;
}
function fe(e2, t2, n2, r2) {
  var i2 = B.clone(e2), a2 = { width: t2.width, height: t2.height };
  return r2.adjustX && i2.left < n2.left && (i2.left = n2.left), r2.resizeWidth && i2.left >= n2.left && i2.left + a2.width > n2.right && (a2.width -= i2.left + a2.width - n2.right), r2.adjustX && i2.left + a2.width > n2.right && (i2.left = Math.max(n2.right - a2.width, n2.left)), r2.adjustY && i2.top < n2.top && (i2.top = n2.top), r2.resizeHeight && i2.top >= n2.top && i2.top + a2.height > n2.bottom && (a2.height -= i2.top + a2.height - n2.bottom), r2.adjustY && i2.top + a2.height > n2.bottom && (i2.top = Math.max(n2.bottom - a2.height, n2.top)), B.mix(i2, a2);
}
function G(e2) {
  var t2, n2, r2;
  if (!B.isWindow(e2) && e2.nodeType !== 9) t2 = B.offset(e2), n2 = B.outerWidth(e2), r2 = B.outerHeight(e2);
  else {
    var i2 = B.getWindow(e2);
    t2 = { left: B.getWindowScrollLeft(i2), top: B.getWindowScrollTop(i2) }, n2 = B.viewportWidth(i2), r2 = B.viewportHeight(i2);
  }
  return t2.width = n2, t2.height = r2, t2;
}
function K(e2, t2) {
  var n2 = t2.charAt(0), r2 = t2.charAt(1), i2 = e2.width, a2 = e2.height, o2 = e2.left, s2 = e2.top;
  return n2 === "c" ? s2 += a2 / 2 : n2 === "b" && (s2 += a2), r2 === "c" ? o2 += i2 / 2 : r2 === "r" && (o2 += i2), { left: o2, top: s2 };
}
function q(e2, t2, n2, r2, i2) {
  var a2 = K(t2, n2[1]), o2 = K(e2, n2[0]), s2 = [o2.left - a2.left, o2.top - a2.top];
  return { left: Math.round(e2.left - s2[0] + r2[0] - i2[0]), top: Math.round(e2.top - s2[1] + r2[1] - i2[1]) };
}
function J(e2, t2, n2) {
  return e2.left < n2.left || e2.left + t2.width > n2.right;
}
function Y(e2, t2, n2) {
  return e2.top < n2.top || e2.top + t2.height > n2.bottom;
}
function pe(e2, t2, n2) {
  return e2.left > n2.right || e2.left + t2.width < n2.left;
}
function me(e2, t2, n2) {
  return e2.top > n2.bottom || e2.top + t2.height < n2.top;
}
function X(e2, t2, n2) {
  var r2 = [];
  return B.each(e2, function(e3) {
    r2.push(e3.replace(t2, function(e4) {
      return n2[e4];
    }));
  }), r2;
}
function Z(e2, t2) {
  return e2[t2] = -e2[t2], e2;
}
function Q(e2, t2) {
  return (/%$/.test(e2) ? parseInt(e2.substring(0, e2.length - 1), 10) / 100 * t2 : parseInt(e2, 10)) || 0;
}
function he(e2, t2) {
  e2[0] = Q(e2[0], t2.width), e2[1] = Q(e2[1], t2.height);
}
function ge(e2, t2, n2, r2) {
  var i2 = n2.points, a2 = n2.offset || [0, 0], o2 = n2.targetOffset || [0, 0], s2 = n2.overflow, c2 = n2.source || e2;
  a2 = [].concat(a2), o2 = [].concat(o2), s2 ||= {};
  var l2 = {}, u2 = 0, d2 = W(c2, !!(s2 && s2.alwaysByViewport)), f2 = G(c2);
  he(a2, f2), he(o2, t2);
  var p2 = q(f2, t2, i2, a2, o2), m2 = B.merge(f2, p2);
  if (d2 && (s2.adjustX || s2.adjustY) && r2) {
    if (s2.adjustX && J(p2, f2, d2)) {
      var h2 = X(i2, /[lr]/gi, { l: "r", r: "l" }), g2 = Z(a2, 0), _2 = Z(o2, 0);
      pe(q(f2, t2, h2, g2, _2), f2, d2) || (u2 = 1, i2 = h2, a2 = g2, o2 = _2);
    }
    if (s2.adjustY && Y(p2, f2, d2)) {
      var v2 = X(i2, /[tb]/gi, { t: "b", b: "t" }), y2 = Z(a2, 1), b2 = Z(o2, 1);
      me(q(f2, t2, v2, y2, b2), f2, d2) || (u2 = 1, i2 = v2, a2 = y2, o2 = b2);
    }
    u2 && (p2 = q(f2, t2, i2, a2, o2), B.mix(m2, p2));
    var x2 = J(p2, f2, d2), S2 = Y(p2, f2, d2);
    if (x2 || S2) {
      var C2 = i2;
      x2 && (C2 = X(i2, /[lr]/gi, { l: "r", r: "l" })), S2 && (C2 = X(i2, /[tb]/gi, { t: "b", b: "t" })), i2 = C2, a2 = n2.offset || [0, 0], o2 = n2.targetOffset || [0, 0];
    }
    l2.adjustX = s2.adjustX && x2, l2.adjustY = s2.adjustY && S2, (l2.adjustX || l2.adjustY) && (m2 = fe(p2, f2, d2, l2));
  }
  return m2.width !== f2.width && B.css(c2, "width", B.width(c2) + m2.width - f2.width), m2.height !== f2.height && B.css(c2, "height", B.height(c2) + m2.height - f2.height), B.offset(c2, { left: m2.left, top: m2.top }, { useCssRight: n2.useCssRight, useCssBottom: n2.useCssBottom, useCssTransform: n2.useCssTransform, ignoreShake: n2.ignoreShake }), { points: i2, offset: a2, targetOffset: o2, overflow: l2 };
}
function _e(e2, t2) {
  var n2 = W(e2, t2), r2 = G(e2);
  return !n2 || r2.left + r2.width <= n2.left || r2.top + r2.height <= n2.top || r2.left >= n2.right || r2.top >= n2.bottom;
}
function $(e2, t2, n2) {
  var r2 = n2.target || t2;
  return ge(e2, G(r2), n2, !_e(r2, n2.overflow && n2.overflow.alwaysByViewport));
}
($.__getOffsetParent = H);
($.__getVisibleRectForElement = W);
export {$ as t};
import {P as e} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as t,r as n,t as r} from "./basecomponent-ClhuVxJN.js";
import {C as i,D as a,O as o,T as s,b as c,c as l,d as u,k as d,n as f,r as p,u as m,x as h} from "./dist-DPswMdzV.js";
var g = {};
function _(e2 = "pui_id_") {
  return Object.hasOwn(g, e2) || (g[e2] = 0), g[e2]++, `${e2}${g[e2]}`;
}
var v = l();
function y(e2) {
  "@babel/helpers - typeof";
  return y = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, y(e2);
}
function b(e2, t2) {
  return T(e2) || w(e2, t2) || S(e2, t2) || x();
}
function x() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function S(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return C(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? C(e2, t2) : void 0;
  }
}
function C(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function w(e2, t2) {
  var n2 = e2 == null ? null : typeof Symbol < "u" && e2[Symbol.iterator] || e2["@@iterator"];
  if (n2 != null) {
    var r2, i2, a2, o2, s2 = [], c2 = !0, l2 = !1;
    try {
      if (a2 = (n2 = n2.call(e2)).next, t2 !== 0) for (; !(c2 = (r2 = a2.call(n2)).done) && (s2.push(r2.value), s2.length !== t2); c2 = !0) ;
    } catch (e3) {
      l2 = !0, i2 = e3;
    } finally {
      try {
        if (!c2 && n2.return != null && (o2 = n2.return(), Object(o2) !== o2)) return;
      } finally {
        if (l2) throw i2;
      }
    }
    return s2;
  }
}
function T(e2) {
  if (Array.isArray(e2)) return e2;
}
function E(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function D(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? E(Object(n2), !0).forEach(function(t3) {
      O(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : E(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function O(e2, t2, n2) {
  return (t2 = k(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function k(e2) {
  var t2 = A(e2, "string");
  return y(t2) == "symbol" ? t2 : t2 + "";
}
function A(e2, t2) {
  if (y(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (y(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var j = { _getMeta: function() {
  return [s(arguments.length <= 0 ? void 0 : arguments[0]) || arguments.length <= 0 ? void 0 : arguments[0], o(s(arguments.length <= 0 ? void 0 : arguments[0]) ? arguments.length <= 0 ? void 0 : arguments[0] : arguments.length <= 1 ? void 0 : arguments[1])];
}, _getConfig: function(e2, t2) {
  var n2, r2;
  return ((e2 == null || (n2 = e2.instance) == null ? void 0 : n2.$primevue) || (t2 == null || (r2 = t2.ctx) == null || (r2 = r2.appContext) == null || (r2 = r2.config) == null || (r2 = r2.globalProperties) == null ? void 0 : r2.$primevue))?.config;
}, _getOptionValue: u, _getPTValue: function() {
  var e2, t2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "", i2 = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}, a2 = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !0, o2 = function() {
    var e3 = j._getOptionValue.apply(j, arguments);
    return c(e3) || m(e3) ? { class: e3 } : e3;
  }, s2 = ((e2 = t2.binding) == null || (e2 = e2.value) == null ? void 0 : e2.ptOptions) || t2.$primevueConfig?.ptOptions || {}, l2 = s2.mergeSections, u2 = l2 === void 0 || l2, d2 = s2.mergeProps, f2 = d2 !== void 0 && d2, p2 = a2 ? j._useDefaultPT(t2, t2.defaultPT(), o2, r2, i2) : void 0, h2 = j._usePT(t2, j._getPT(n2, t2.$name), o2, r2, D(D({}, i2), {}, { global: p2 || {} })), g2 = j._getPTDatasets(t2, r2);
  return u2 || !u2 && h2 ? f2 ? j._mergeProps(t2, f2, p2, h2, g2) : D(D(D({}, p2), h2), g2) : D(D({}, h2), g2);
}, _getPTDatasets: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n2 = "data-pc-";
  return D(D({}, t2 === "root" && O({}, `${n2}name`, i(e2.$name))), {}, O({}, `${n2}section`, i(t2)));
}, _getPT: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n2 = arguments.length > 2 ? arguments[2] : void 0, r2 = function(e3) {
    var r3 = n2 ? n2(e3) : e3, a2 = i(t2);
    return r3?.[a2] ?? r3;
  };
  return e2 && Object.hasOwn(e2, "_usept") ? { _usept: e2._usept, originalValue: r2(e2.originalValue), value: r2(e2.value) } : r2(e2);
}, _usePT: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = arguments.length > 1 ? arguments[1] : void 0, n2 = arguments.length > 2 ? arguments[2] : void 0, r2 = arguments.length > 3 ? arguments[3] : void 0, i2 = arguments.length > 4 ? arguments[4] : void 0, a2 = function(e3) {
    return n2(e3, r2, i2);
  };
  if (t2 && Object.hasOwn(t2, "_usept")) {
    var o2 = t2._usept || e2.$primevueConfig?.ptOptions || {}, s2 = o2.mergeSections, l2 = s2 === void 0 || s2, u2 = o2.mergeProps, d2 = u2 !== void 0 && u2, f2 = a2(t2.originalValue), p2 = a2(t2.value);
    return f2 === void 0 && p2 === void 0 ? void 0 : c(p2) ? p2 : c(f2) ? f2 : l2 || !l2 && p2 ? d2 ? j._mergeProps(e2, d2, f2, p2) : D(D({}, f2), p2) : p2;
  }
  return a2(t2);
}, _useDefaultPT: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n2 = arguments.length > 2 ? arguments[2] : void 0, r2 = arguments.length > 3 ? arguments[3] : void 0, i2 = arguments.length > 4 ? arguments[4] : void 0;
  return j._usePT(e2, t2, n2, r2, i2);
}, _loadStyles: function() {
  var e2, t2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n2 = arguments.length > 1 ? arguments[1] : void 0, r2 = arguments.length > 2 ? arguments[2] : void 0, i2 = j._getConfig(n2, r2), a2 = { nonce: i2 == null || (e2 = i2.csp) == null ? void 0 : e2.nonce };
  j._loadCoreStyles(t2, a2), j._loadThemeStyles(t2, a2), j._loadScopedThemeStyles(t2, a2), j._removeThemeListeners(t2), t2.$loadStyles = function() {
    return j._loadThemeStyles(t2, a2);
  }, j._themeChangeListener(t2.$loadStyles);
}, _loadCoreStyles: function() {
  var e2, r2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, i2 = arguments.length > 1 ? arguments[1] : void 0;
  if (!t.isStyleNameLoaded(r2.$style?.name) && (e2 = r2.$style) != null && e2.name) {
    var a2;
    n.loadCSS(i2), (a2 = r2.$style) == null || a2.loadCSS(i2), t.setLoadedStyleName(r2.$style.name);
  }
}, _loadThemeStyles: function() {
  var e2, t2, r2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, i2 = arguments.length > 1 ? arguments[1] : void 0;
  if (!(r2 != null && r2.isUnstyled() || (r2 == null || (e2 = r2.theme) == null ? void 0 : e2.call(r2)) === "none")) {
    if (!p.isStyleNameLoaded("common")) {
      var a2, o2, s2 = ((a2 = r2.$style) == null || (o2 = a2.getCommonTheme) == null ? void 0 : o2.call(a2)) || {}, c2 = s2.primitive, l2 = s2.semantic, u2 = s2.global, d2 = s2.style;
      n.load(c2?.css, D({ name: "primitive-variables" }, i2)), n.load(l2?.css, D({ name: "semantic-variables" }, i2)), n.load(u2?.css, D({ name: "global-variables" }, i2)), n.loadStyle(D({ name: "global-style" }, i2), d2), p.setLoadedStyleName("common");
    }
    if (!p.isStyleNameLoaded(r2.$style?.name) && (t2 = r2.$style) != null && t2.name) {
      var f2, m2, h2, g2, _2 = ((f2 = r2.$style) == null || (m2 = f2.getDirectiveTheme) == null ? void 0 : m2.call(f2)) || {}, v2 = _2.css, y2 = _2.style;
      (h2 = r2.$style) == null || h2.load(v2, D({ name: `${r2.$style.name}-variables` }, i2)), (g2 = r2.$style) == null || g2.loadStyle(D({ name: `${r2.$style.name}-style` }, i2), y2), p.setLoadedStyleName(r2.$style.name);
    }
    if (!p.isStyleNameLoaded("layer-order")) {
      var b2, x2, S2 = (b2 = r2.$style) == null || (x2 = b2.getLayerOrderThemeCSS) == null ? void 0 : x2.call(b2);
      n.load(S2, D({ name: "layer-order", first: !0 }, i2)), p.setLoadedStyleName("layer-order");
    }
  }
}, _loadScopedThemeStyles: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = arguments.length > 1 ? arguments[1] : void 0, n2 = e2.preset();
  if (n2 && e2.$attrSelector) {
    var r2, i2, a2 = (((r2 = e2.$style) == null || (i2 = r2.getPresetTheme) == null ? void 0 : i2.call(r2, n2, `[${e2.$attrSelector}]`)) || {}).css;
    e2.scopedStyleEl = (e2.$style?.load(a2, D({ name: `${e2.$attrSelector}-${e2.$style.name}` }, t2))).el;
  }
}, _themeChangeListener: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function() {
  };
  t.clearLoadedStyleNames(), f.on("theme:change", e2);
}, _removeThemeListeners: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  f.off("theme:change", e2.$loadStyles), e2.$loadStyles = void 0;
}, _hook: function(e2, t2, n2, r2, i2, a2) {
  var o2, s2, c2 = `on${d(t2)}`, l2 = j._getConfig(r2, i2), u2 = n2?.$instance, f2 = j._usePT(u2, j._getPT(r2 == null || (o2 = r2.value) == null ? void 0 : o2.pt, e2), j._getOptionValue, `hooks.${c2}`), p2 = j._useDefaultPT(u2, l2 == null || (s2 = l2.pt) == null || (s2 = s2.directives) == null ? void 0 : s2[e2], j._getOptionValue, `hooks.${c2}`), m2 = { el: n2, binding: r2, vnode: i2, prevVnode: a2 };
  f2?.(u2, m2), p2?.(u2, m2);
}, _mergeProps: function() {
  var t2 = arguments.length > 1 ? arguments[1] : void 0, n2 = [...arguments].slice(2);
  return h(t2) ? t2.apply(void 0, n2) : e.apply(void 0, n2);
}, _extend: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n2 = function(n3, r3, i3, o2, s2) {
    var c2, l2, u2;
    r3._$instances = r3._$instances || {};
    var d2 = j._getConfig(i3, o2), f2 = r3._$instances[e2] || {}, p2 = a(f2) ? D(D({}, t2), t2?.methods) : {};
    r3._$instances[e2] = D(D({}, f2), {}, { $name: e2, $host: r3, $binding: i3, $modifiers: i3?.modifiers, $value: i3?.value, $el: f2.$el || r3 || void 0, $style: D({ classes: void 0, inlineStyles: void 0, load: function() {
    }, loadCSS: function() {
    }, loadStyle: function() {
    } }, t2?.style), $primevueConfig: d2, $attrSelector: (c2 = r3.$pd) == null || (c2 = c2[e2]) == null ? void 0 : c2.attrSelector, defaultPT: function() {
      return j._getPT(d2?.pt, void 0, function(t3) {
        var n4;
        return t3 == null || (n4 = t3.directives) == null ? void 0 : n4[e2];
      });
    }, isUnstyled: function() {
      var t3, n4;
      return ((t3 = r3._$instances[e2]) == null || (t3 = t3.$binding) == null || (t3 = t3.value) == null ? void 0 : t3.unstyled) === void 0 ? d2?.unstyled : (n4 = r3._$instances[e2]) == null || (n4 = n4.$binding) == null || (n4 = n4.value) == null ? void 0 : n4.unstyled;
    }, theme: function() {
      var t3;
      return (t3 = r3._$instances[e2]) == null || (t3 = t3.$primevueConfig) == null ? void 0 : t3.theme;
    }, preset: function() {
      var t3;
      return (t3 = r3._$instances[e2]) == null || (t3 = t3.$binding) == null || (t3 = t3.value) == null ? void 0 : t3.dt;
    }, ptm: function() {
      var t3, n4 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", i4 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return j._getPTValue(r3._$instances[e2], (t3 = r3._$instances[e2]) == null || (t3 = t3.$binding) == null || (t3 = t3.value) == null ? void 0 : t3.pt, n4, D({}, i4));
    }, ptmo: function() {
      var t3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n4 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", i4 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      return j._getPTValue(r3._$instances[e2], t3, n4, i4, !1);
    }, cx: function() {
      var t3, n4, i4 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", a2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return (t3 = r3._$instances[e2]) != null && t3.isUnstyled() ? void 0 : j._getOptionValue((n4 = r3._$instances[e2]) == null || (n4 = n4.$style) == null ? void 0 : n4.classes, i4, D({}, a2));
    }, sx: function() {
      var t3, n4 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", i4 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, a2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      return i4 ? j._getOptionValue((t3 = r3._$instances[e2]) == null || (t3 = t3.$style) == null ? void 0 : t3.inlineStyles, n4, D({}, a2)) : void 0;
    } }, p2), r3.$instance = r3._$instances[e2], (l2 = (u2 = r3.$instance)[n3]) == null || l2.call(u2, r3, i3, o2, s2), r3[`$${e2}`] = r3.$instance, j._hook(e2, n3, r3, i3, o2, s2), r3.$pd ||= {}, r3.$pd[e2] = D(D({}, r3.$pd?.[e2]), {}, { name: e2, instance: r3._$instances[e2] });
  }, r2 = function(t3) {
    var n3, r3, i3, a2 = t3._$instances[e2], o2 = a2?.watch, s2 = function(e3) {
      var t4, n4 = e3.newValue, r4 = e3.oldValue;
      return o2 == null || (t4 = o2.config) == null ? void 0 : t4.call(a2, n4, r4);
    }, c2 = function(e3) {
      var t4, n4 = e3.newValue, r4 = e3.oldValue;
      return o2 == null || (t4 = o2["config.ripple"]) == null ? void 0 : t4.call(a2, n4, r4);
    };
    a2.$watchersCallback = { config: s2, "config.ripple": c2 }, o2 == null || (n3 = o2.config) == null || n3.call(a2, a2?.$primevueConfig), v.on("config:change", s2), o2 == null || (r3 = o2["config.ripple"]) == null || r3.call(a2, a2 == null || (i3 = a2.$primevueConfig) == null ? void 0 : i3.ripple), v.on("config:ripple:change", c2);
  }, i2 = function(t3) {
    var n3 = t3._$instances[e2].$watchersCallback;
    n3 && (v.off("config:change", n3.config), v.off("config:ripple:change", n3["config.ripple"]), t3._$instances[e2].$watchersCallback = void 0);
  };
  return { created: function(t3, r3, i3, a2) {
    t3.$pd ||= {}, t3.$pd[e2] = { name: e2, attrSelector: _("pd") }, n2("created", t3, r3, i3, a2);
  }, beforeMount: function(t3, i3, a2, o2) {
    j._loadStyles(t3.$pd[e2]?.instance, i3, a2), n2("beforeMount", t3, i3, a2, o2), r2(t3);
  }, mounted: function(t3, r3, i3, a2) {
    j._loadStyles(t3.$pd[e2]?.instance, r3, i3), n2("mounted", t3, r3, i3, a2);
  }, beforeUpdate: function(e3, t3, r3, i3) {
    n2("beforeUpdate", e3, t3, r3, i3);
  }, updated: function(t3, r3, i3, a2) {
    j._loadStyles(t3.$pd[e2]?.instance, r3, i3), n2("updated", t3, r3, i3, a2);
  }, beforeUnmount: function(t3, r3, a2, o2) {
    i2(t3), j._removeThemeListeners(t3.$pd[e2]?.instance), n2("beforeUnmount", t3, r3, a2, o2);
  }, unmounted: function(t3, r3, i3, a2) {
    var o2;
    (o2 = t3.$pd[e2]) == null || (o2 = o2.instance) == null || (o2 = o2.scopedStyleEl) == null || (o2 = o2.value) == null || o2.remove(), n2("unmounted", t3, r3, i3, a2);
  } };
}, extend: function() {
  var e2 = b(j._getMeta.apply(j, arguments), 2), t2 = e2[0], n2 = e2[1];
  return D({ extend: function() {
    var e3 = b(j._getMeta.apply(j, arguments), 2), t3 = e3[0], r2 = e3[1];
    return j.extend(t3, D(D(D({}, n2), n2?.methods), r2));
  } }, j._extend(t2, n2));
} };
var M = n.extend({ name: "baseicon", css: `
.p-icon {
    display: inline-block;
    vertical-align: baseline;
    flex-shrink: 0;
}

.p-icon-spin {
    -webkit-animation: p-icon-spin 2s infinite linear;
    animation: p-icon-spin 2s infinite linear;
}

@-webkit-keyframes p-icon-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}

@keyframes p-icon-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}
` });
function N(e2) {
  "@babel/helpers - typeof";
  return N = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, N(e2);
}
function P(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function F(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? P(Object(n2), !0).forEach(function(t3) {
      I(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : P(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function I(e2, t2, n2) {
  return (t2 = L(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function L(e2) {
  var t2 = R(e2, "string");
  return N(t2) == "symbol" ? t2 : t2 + "";
}
function R(e2, t2) {
  if (N(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (N(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var z = { name: "BaseIcon", extends: r, props: { label: { type: String, default: void 0 }, spin: { type: Boolean, default: !1 } }, style: M, provide: function() {
  return { $pcIcon: this, $parentInstance: this };
}, methods: { pti: function() {
  var e2 = a(this.label);
  return F(F({}, !this.isUnstyled && { class: ["p-icon", { "p-icon-spin": this.spin }] }), {}, { role: e2 ? void 0 : "img", "aria-label": e2 ? void 0 : this.label, "aria-hidden": e2 });
} } };
export {_ as i,j as n,v as r,z as t};
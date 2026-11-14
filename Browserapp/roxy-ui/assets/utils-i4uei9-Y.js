import {o as e} from "./basecomponent-ClhuVxJN.js";
import {M as t} from "./dist-DPswMdzV.js";
function n(e2) {
  "@babel/helpers - typeof";
  return n = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, n(e2);
}
function r(e2, t2) {
  if (!(e2 instanceof t2)) throw TypeError("Cannot call a class as a function");
}
function i(e2, t2) {
  for (var n2 = 0; n2 < t2.length; n2++) {
    var r2 = t2[n2];
    r2.enumerable = r2.enumerable || !1, r2.configurable = !0, "value" in r2 && (r2.writable = !0), Object.defineProperty(e2, o(r2.key), r2);
  }
}
function a(e2, t2, n2) {
  return t2 && i(e2.prototype, t2), Object.defineProperty(e2, "prototype", { writable: !1 }), e2;
}
function o(e2) {
  var t2 = s(e2, "string");
  return n(t2) == "symbol" ? t2 : t2 + "";
}
function s(e2, t2) {
  if (n(e2) != "object" || !e2) return e2;
  var r2 = e2[Symbol.toPrimitive];
  if (r2 !== void 0) {
    var i2 = r2.call(e2, t2);
    if (n(i2) != "object") return i2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(e2);
}
var c = (function() {
  function t2(e2) {
    var n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : function() {
    };
    r(this, t2), this.element = e2, this.listener = n2;
  }
  return a(t2, [{ key: "bindScrollListener", value: function() {
    this.scrollableParents = e(this.element);
    for (var t3 = 0; t3 < this.scrollableParents.length; t3++) this.scrollableParents[t3].addEventListener("scroll", this.listener);
  } }, { key: "unbindScrollListener", value: function() {
    if (this.scrollableParents) for (var e2 = 0; e2 < this.scrollableParents.length; e2++) this.scrollableParents[e2].removeEventListener("scroll", this.listener);
  } }, { key: "destroy", value: function() {
    this.unbindScrollListener(), this.element = null, this.listener = null, this.scrollableParents = null;
  } }]);
})();
function l(e2) {
  "@babel/helpers - typeof";
  return l = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, l(e2);
}
function u(e2) {
  return m(e2) || p(e2) || f(e2) || d();
}
function d() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function f(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return h(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? h(e2, t2) : void 0;
  }
}
function p(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function m(e2) {
  if (Array.isArray(e2)) return h(e2);
}
function h(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function g(e2, t2) {
  if (!(e2 instanceof t2)) throw TypeError("Cannot call a class as a function");
}
function _(e2, t2) {
  for (var n2 = 0; n2 < t2.length; n2++) {
    var r2 = t2[n2];
    r2.enumerable = r2.enumerable || !1, r2.configurable = !0, "value" in r2 && (r2.writable = !0), Object.defineProperty(e2, b(r2.key), r2);
  }
}
function v(e2, t2, n2) {
  return t2 && _(e2.prototype, t2), Object.defineProperty(e2, "prototype", { writable: !1 }), e2;
}
function y(e2, t2, n2) {
  return (t2 = b(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function b(e2) {
  var t2 = x(e2, "string");
  return l(t2) == "symbol" ? t2 : t2 + "";
}
function x(e2, t2) {
  if (l(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (l(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(e2);
}
var S = (function() {
  function e2(t2) {
    var n2 = t2.init, r2 = t2.type;
    g(this, e2), y(this, "helpers", void 0), y(this, "type", void 0), this.helpers = new Set(n2), this.type = r2;
  }
  return v(e2, [{ key: "add", value: function(e3) {
    this.helpers.add(e3);
  } }, { key: "update", value: function() {
  } }, { key: "delete", value: function(e3) {
    this.helpers.delete(e3);
  } }, { key: "clear", value: function() {
    this.helpers.clear();
  } }, { key: "get", value: function(e3, n2) {
    var r2 = this._get(e3, n2), i2 = r2 ? this._recursive(u(this.helpers), r2) : null;
    return t(i2) ? i2 : null;
  } }, { key: "_isMatched", value: function(e3, t2) {
    var n2, r2 = e3?.parent;
    return (r2 == null || (n2 = r2.vnode) == null ? void 0 : n2.key) === t2 || r2 && this._isMatched(r2, t2) || !1;
  } }, { key: "_get", value: function(e3, t2) {
    var n2, r2;
    return ((n2 = t2 || e3?.$slots) == null || (r2 = n2.default) == null ? void 0 : r2.call(n2)) || null;
  } }, { key: "_recursive", value: function() {
    var e3 = this, n2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [], r2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [], i2 = [];
    return r2.forEach(function(r3) {
      r3.children instanceof Array ? i2 = i2.concat(e3._recursive(n2, r3.children)) : r3.type.name === e3.type ? i2.push(r3) : t(r3.key) && (i2 = i2.concat(n2.filter(function(t2) {
        return e3._isMatched(t2, r3.key);
      }).map(function(e4) {
        return e4.vnode;
      })));
    }), i2;
  } }]);
})();
function C(e2, t2) {
  if (e2) {
    var n2 = e2.props;
    if (n2) {
      var r2 = t2.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(), i2 = Object.prototype.hasOwnProperty.call(n2, r2) ? r2 : t2;
      return e2.type.extends.props[t2].type === Boolean && n2[i2] === "" || n2[i2];
    }
  }
  return null;
}
export {S as n,C as r,c as t};
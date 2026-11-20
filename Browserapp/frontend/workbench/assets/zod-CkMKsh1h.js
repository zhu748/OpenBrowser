import {F as e,J as t,P as n,St as r,V as i,W as a,Z as o,bt as s,d as c,h as l,kt as u,lt as d,p as f,st as p,w as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {m as h} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {r as g,t as _} from "./basecomponent-ClhuVxJN.js";
import {D as ee,M as v,O as y,T as b,f as x,g as S,u as C} from "./dist-DPswMdzV.js";
function w(e2) {
  "@babel/helpers - typeof";
  return w = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, w(e2);
}
function T(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function E(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? T(Object(n2), !0).forEach(function(t3) {
      D(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : T(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function D(e2, t2, n2) {
  return (t2 = O(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function O(e2) {
  var t2 = k(e2, "string");
  return w(t2) == "symbol" ? t2 : t2 + "";
}
function k(e2, t2) {
  if (w(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (w(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function A() {
  var e2, t2, n2 = typeof Symbol == "function" ? Symbol : {}, r2 = n2.iterator || "@@iterator", i2 = n2.toStringTag || "@@toStringTag";
  function a2(n3, r3, i3, a3) {
    var c3 = r3 && r3.prototype instanceof s2 ? r3 : s2, l3 = Object.create(c3.prototype);
    return j(l3, "_invoke", (function(n4, r4, i4) {
      var a4, s3, c4, l4 = 0, u3 = i4 || [], d3 = !1, f3 = { p: 0, n: 0, v: e2, a: p2, f: p2.bind(e2, 4), d: function(t3, n5) {
        return a4 = t3, s3 = 0, c4 = e2, f3.n = n5, o2;
      } };
      function p2(n5, r5) {
        for (s3 = n5, c4 = r5, t2 = 0; !d3 && l4 && !i5 && t2 < u3.length; t2++) {
          var i5, a5 = u3[t2], p3 = f3.p, m2 = a5[2];
          n5 > 3 ? (i5 = m2 === r5) && (c4 = a5[(s3 = a5[4]) ? 5 : (s3 = 3, 3)], a5[4] = a5[5] = e2) : a5[0] <= p3 && ((i5 = n5 < 2 && p3 < a5[1]) ? (s3 = 0, f3.v = r5, f3.n = a5[1]) : p3 < m2 && (i5 = n5 < 3 || a5[0] > r5 || r5 > m2) && (a5[4] = n5, a5[5] = r5, f3.n = m2, s3 = 0));
        }
        if (i5 || n5 > 1) return o2;
        throw d3 = !0, r5;
      }
      return function(i5, u4, m2) {
        if (l4 > 1) throw TypeError("Generator is already running");
        for (d3 && u4 === 1 && p2(u4, m2), s3 = u4, c4 = m2; (t2 = s3 < 2 ? e2 : c4) || !d3; ) {
          a4 || (s3 ? s3 < 3 ? (s3 > 1 && (f3.n = -1), p2(s3, c4)) : f3.n = c4 : f3.v = c4);
          try {
            if (l4 = 2, a4) {
              if (s3 || (i5 = "next"), t2 = a4[i5]) {
                if (!(t2 = t2.call(a4, c4))) throw TypeError("iterator result is not an object");
                if (!t2.done) return t2;
                c4 = t2.value, s3 < 2 && (s3 = 0);
              } else s3 === 1 && (t2 = a4.return) && t2.call(a4), s3 < 2 && (c4 = TypeError("The iterator does not provide a '" + i5 + "' method"), s3 = 1);
              a4 = e2;
            } else if ((t2 = (d3 = f3.n < 0) ? c4 : n4.call(r4, f3)) !== o2) break;
          } catch (t3) {
            a4 = e2, s3 = 1, c4 = t3;
          } finally {
            l4 = 1;
          }
        }
        return { value: t2, done: d3 };
      };
    })(n3, i3, a3), !0), l3;
  }
  var o2 = {};
  function s2() {
  }
  function c2() {
  }
  function l2() {
  }
  t2 = Object.getPrototypeOf;
  var u2 = [][r2] ? t2(t2([][r2]())) : (j(t2 = {}, r2, function() {
    return this;
  }), t2), d2 = l2.prototype = s2.prototype = Object.create(u2);
  function f2(e3) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(e3, l2) : (e3.__proto__ = l2, j(e3, i2, "GeneratorFunction")), e3.prototype = Object.create(d2), e3;
  }
  return c2.prototype = l2, j(d2, "constructor", l2), j(l2, "constructor", c2), c2.displayName = "GeneratorFunction", j(l2, i2, "GeneratorFunction"), j(d2), j(d2, i2, "Generator"), j(d2, r2, function() {
    return this;
  }), j(d2, "toString", function() {
    return "[object Generator]";
  }), (A = function() {
    return { w: a2, m: f2 };
  })();
}
function j(e2, t2, n2, r2) {
  var i2 = Object.defineProperty;
  try {
    i2({}, "", {});
  } catch {
    i2 = 0;
  }
  j = function(e3, t3, n3, r3) {
    function a2(t4, n4) {
      j(e3, t4, function(e4) {
        return this._invoke(t4, n4, e4);
      });
    }
    t3 ? i2 ? i2(e3, t3, { value: n3, enumerable: !r3, configurable: !r3, writable: !r3 }) : e3[t3] = n3 : (a2("next", 0), a2("throw", 1), a2("return", 2));
  }, j(e2, t2, n2, r2);
}
function M(e2, t2, n2, r2, i2, a2, o2) {
  try {
    var s2 = e2[a2](o2), c2 = s2.value;
  } catch (e3) {
    n2(e3);
    return;
  }
  s2.done ? t2(c2) : Promise.resolve(c2).then(r2, i2);
}
function N(e2) {
  return function() {
    var t2 = this, n2 = arguments;
    return new Promise(function(r2, i2) {
      var a2 = e2.apply(t2, n2);
      function o2(e3) {
        M(a2, r2, i2, o2, s2, "next", e3);
      }
      function s2(e3) {
        M(a2, r2, i2, o2, s2, "throw", e3);
      }
      o2(void 0);
    });
  };
}
function P(e2, t2) {
  return re(e2) || ne(e2, t2) || F(e2, t2) || te();
}
function te() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function F(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return I(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? I(e2, t2) : void 0;
  }
}
function I(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function ne(e2, t2) {
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
function re(e2) {
  if (Array.isArray(e2)) return e2;
}
function ie(t2) {
  var n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  m() ? i(t2) : n2 ? t2() : e(t2);
}
function ae(e2, t2, n2) {
  var i2 = r(!0);
  return { stop: p(e2, function(e3, n3) {
    i2.value && t2(e3, n3);
  }, n2), pause: function() {
    i2.value = !1;
  }, resume: function() {
    i2.value = !0;
  } };
}
function L(e2) {
  return Object.entries(e2).reduce(function(e3, t2) {
    var n2 = P(t2, 2), r2 = n2[0], i2 = n2[1];
    return r2.split(/[\.\[\]]+/).filter(Boolean).reduce(function(e4, t3, n3, r3) {
      return e4[t3] ?? (e4[t3] = isNaN(r3[n3 + 1]) ? n3 === r3.length - 1 ? i2 : {} : []);
    }, e3), e3;
  }, {});
}
function R(e2, t2) {
  if (!e2 || !t2) return null;
  try {
    var n2 = e2[t2];
    if (v(n2)) return n2;
  } catch {
  }
  return t2.split(/[\.\[\]]+/).filter(Boolean).reduce(function(e3, t3) {
    return e3 && e3[t3] !== void 0 ? e3[t3] : void 0;
  }, e2);
}
var oe = function() {
  var t2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, r2 = s({}), i2 = s({}), a2 = c(function() {
    return Object.values(r2).every(function(e2) {
      return !e2.invalid;
    });
  }), o2 = c(function() {
    return L(r2);
  }), l2 = function(e2, n2) {
    return { value: n2 ?? R(t2.initialValues, e2), touched: !1, dirty: !1, pristine: !0, valid: !0, invalid: !1, error: null, errors: [] };
  }, d2 = function(e2, t3) {
    var n2 = y(t3, e2);
    return n2 === !0 || C(n2) && n2.includes(e2);
  }, f2 = (function() {
    var e2 = N(A().m(function e3(n2, r3) {
      var a3, o3, s2, c2;
      return A().w(function(e4) {
        for (; ; ) switch (e4.n) {
          case 0:
            if (a3 = {}, !C(t2[n2])) {
              e4.n = 2;
              break;
            }
            return e4.n = 1, _2(t2[n2]);
          case 1:
            a3 = e4.v, e4.n = 4;
            break;
          case 2:
            if (s2 = t2[n2] ?? r3, !s2) {
              e4.n = 4;
              break;
            }
            return e4.n = 3, _2();
          case 3:
            a3 = e4.v;
          case 4:
            if (o3 = Object.keys(i2).filter(function(e5) {
              var t3;
              return (t3 = i2[e5]) == null || (t3 = t3.options) == null ? void 0 : t3[n2];
            }) || [], c2 = v(o3), !c2) {
              e4.n = 6;
              break;
            }
            return e4.n = 5, _2(o3);
          case 5:
            a3 = e4.v;
          case 6:
            return e4.a(2, a3);
        }
      }, e3);
    }));
    return function(t3, n2) {
      return e2.apply(this, arguments);
    };
  })(), p2 = function(e2, n2, r3, i3) {
    (n2?.[r3] ?? d2(e2, t2[r3] ?? i3)) && _2(e2);
  }, m2 = function(e2, t3) {
    var a3;
    if (!e2) return [];
    (a3 = i2[e2]) == null || a3._watcher.stop(), r2[e2] || (r2[e2] = l2(e2, t3?.initialValue));
    var o3 = n(y(t3, r2[e2])?.props, y(t3?.props, r2[e2]), { name: e2, onBlur: function() {
      r2[e2].touched = !0, p2(e2, t3, "validateOnBlur");
    }, onInput: function(t4) {
      r2[e2].value = t4 && Object.hasOwn(t4, "value") ? t4.value : t4.target.value;
    }, onChange: function(t4) {
      r2[e2].value = t4 && Object.hasOwn(t4, "value") ? t4.value : t4.target.type === "checkbox" || t4.target.type === "radio" ? t4.target.checked : t4.target.value;
    }, onInvalid: function(t4) {
      r2[e2].invalid = !0, r2[e2].errors = t4, r2[e2].error = t4?.[0] ?? null;
    } }), s2 = ae(function() {
      return r2[e2].value;
    }, function(n2, i3) {
      r2[e2].pristine && (r2[e2].pristine = !1), n2 !== i3 && (r2[e2].dirty = !0), p2(e2, t3, "validateOnValueUpdate", !0);
    });
    return i2[e2] = { props: o3, states: r2[e2], options: t3, _watcher: s2 }, [r2[e2], o3];
  }, h2 = function(e2) {
    return (function() {
      var t3 = N(A().m(function t4(n2) {
        var r3;
        return A().w(function(t5) {
          for (; ; ) switch (t5.n) {
            case 0:
              return t5.n = 1, f2("validateOnSubmit", !0);
            case 1:
              return r3 = t5.v, t5.a(2, e2(E({ originalEvent: n2, valid: u(a2), states: u(o2), reset: b2 }, r3)));
          }
        }, t4);
      }));
      return function(e3) {
        return t3.apply(this, arguments);
      };
    })();
  }, g2 = function(e2) {
    return (function() {
      var t3 = N(A().m(function t4(n2) {
        return A().w(function(t5) {
          for (; ; ) if (t5.n === 0)
            return b2(), t5.a(2, e2({ originalEvent: n2 }));
        }, t4);
      }));
      return function(e3) {
        return t3.apply(this, arguments);
      };
    })();
  }, _2 = (function() {
    var e2 = N(A().m(function e3(n2) {
      var a3, o3, s2, c2, l3, u2, d3, f3, p3, m3, h3, g3, _3, v2, y2, b3, S3, w2, T2, O2, k2, j2, M2, N2;
      return A().w(function(e4) {
        for (; ; ) switch (e4.n) {
          case 0:
            return s2 = Object.entries(r2).reduce(function(e5, t3) {
              var n3 = P(t3, 2), r3 = n3[0], i3 = n3[1];
              return e5.names.push(r3), e5.values[r3] = i3.value, e5;
            }, { names: [], values: {} }), c2 = [s2.names, L(s2.values)], l3 = c2[0], u2 = c2[1], e4.n = 1, t2.resolver?.call(t2, { names: l3, values: u2 });
          case 1:
            if (O2 = a3 = e4.v, T2 = O2 !== null, !T2) {
              e4.n = 2;
              break;
            }
            T2 = a3 !== void 0;
          case 2:
            if (!T2) {
              e4.n = 3;
              break;
            }
            k2 = a3, e4.n = 4;
            break;
          case 3:
            k2 = { values: u2 };
          case 4:
            d3 = k2, (o3 = d3).errors ?? (o3.errors = {}), f3 = [n2].flat(), p3 = 0, m3 = Object.entries(i2);
          case 5:
            if (!(p3 < m3.length)) {
              e4.n = 12;
              break;
            }
            if (h3 = P(m3[p3], 2), g3 = h3[0], _3 = h3[1], !(f3.includes(g3) || !n2 || ee(d3.errors))) {
              e4.n = 11;
              break;
            }
            if (v2 = _3.options?.resolver, !v2) {
              e4.n = 10;
              break;
            }
            return b3 = _3.states.value, e4.n = 6, v2({ values: b3, value: b3, name: g3 });
          case 6:
            if (M2 = y2 = e4.v, j2 = M2 !== null, !j2) {
              e4.n = 7;
              break;
            }
            j2 = y2 !== void 0;
          case 7:
            if (!j2) {
              e4.n = 8;
              break;
            }
            N2 = y2, e4.n = 9;
            break;
          case 8:
            N2 = { values: b3 };
          case 9:
            S3 = N2, C(S3.errors) && (S3.errors = D({}, g3, S3.errors)), d3 = x(d3, S3);
          case 10:
            w2 = R(d3.errors, g3) ?? [], r2[g3].invalid = w2.length > 0, r2[g3].valid = !r2[g3].invalid, r2[g3].errors = w2, r2[g3].error = w2?.[0] ?? null;
          case 11:
            p3++, e4.n = 5;
            break;
          case 12:
            return e4.a(2, E(E({}, d3), {}, { errors: L(d3.errors) }));
        }
      }, e3);
    }));
    return function(t3) {
      return e2.apply(this, arguments);
    };
  })(), b2 = function() {
    Object.keys(r2).forEach((function() {
      var t3 = N(A().m(function t4(n2) {
        var a3, o3;
        return A().w(function(t5) {
          for (; ; ) switch (t5.n) {
            case 0:
              return o3 = i2[n2]._watcher, o3.pause(), i2[n2].states = r2[n2] = l2(n2, (a3 = i2[n2]) == null || (a3 = a3.options) == null ? void 0 : a3.initialValue), t5.n = 1, e();
            case 1:
              o3.resume();
            case 2:
              return t5.a(2);
          }
        }, t4);
      }));
      return function(e2) {
        return t3.apply(this, arguments);
      };
    })());
  }, S2 = function(e2, t3) {
    r2[e2] !== void 0 && (r2[e2].value = t3);
  };
  return ie(function() {
    f2("validateOnMount");
  }), { defineField: m2, setFieldValue: S2, getFieldState: function(e2) {
    return i2[e2]?.states;
  }, handleSubmit: h2, handleReset: g2, validate: _2, setValues: function(e2) {
    Object.keys(e2).forEach(function(t3) {
      return S2(t3, e2[t3]);
    });
  }, reset: b2, valid: a2, states: o2, fields: i2 };
};
var se = g.extend({ name: "form", classes: { root: "p-form p-component" } });
var z = { name: "BaseForm", extends: _, style: se, props: { resolver: { type: Function, default: null }, initialValues: { type: Object, default: null }, validateOnValueUpdate: { type: [Boolean, Array], default: !0 }, validateOnBlur: { type: [Boolean, Array], default: !1 }, validateOnMount: { type: [Boolean, Array], default: !1 }, validateOnSubmit: { type: [Boolean, Array], default: !0 } }, provide: function() {
  return { $pcForm: this, $parentInstance: this };
} };
function B(e2) {
  "@babel/helpers - typeof";
  return B = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, B(e2);
}
function V(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function H(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? V(Object(n2), !0).forEach(function(t3) {
      U(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : V(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function U(e2, t2, n2) {
  return (t2 = W(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function W(e2) {
  var t2 = G(e2, "string");
  return B(t2) == "symbol" ? t2 : t2 + "";
}
function G(e2, t2) {
  if (B(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (B(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function ce(e2, t2) {
  return fe(e2) || de(e2, t2) || ue(e2, t2) || le();
}
function le() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ue(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return K(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? K(e2, t2) : void 0;
  }
}
function K(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function de(e2, t2) {
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
function fe(e2) {
  if (Array.isArray(e2)) return e2;
}
var q = { name: "Form", extends: z, inheritAttrs: !1, emits: ["submit", "reset"], setup: function(e2, t2) {
  var n2 = t2.emit, i2 = r(null), a2 = oe(e2);
  return H({ formRef: i2, submit: function() {
    var e3;
    (e3 = i2.value) == null || e3.requestSubmit();
  }, register: function(e3, t3) {
    return t3 != null && t3.novalidate ? {} : ce(a2.defineField(e3, t3), 2)[1];
  }, onSubmit: a2.handleSubmit(function(e3) {
    n2("submit", e3);
  }), onReset: a2.handleReset(function(e3) {
    n2("reset", e3);
  }) }, S(a2, ["handleSubmit", "handleReset"]));
} };
function pe(e2, r2, i2, o2, s2, c2) {
  return a(), l("form", n({ ref: "formRef", onSubmit: r2[0] ||= h(function() {
    return o2.onSubmit && o2.onSubmit.apply(o2, arguments);
  }, ["prevent"]), onReset: r2[1] ||= h(function() {
    return o2.onReset && o2.onReset.apply(o2, arguments);
  }, ["prevent"]), class: e2.cx("root") }, e2.ptmi("root")), [t(e2.$slots, "default", n({ register: o2.register, valid: e2.valid, reset: e2.reset }, e2.states))], 16);
}
q.render = pe;
var me = g.extend({ name: "formfield", classes: { root: "p-formfield p-component" } });
var he = { name: "BaseFormField", extends: _, style: me, props: { name: { type: String, default: void 0 }, resolver: { type: Function, default: void 0 }, initialValue: { type: null, default: void 0 }, validateOnValueUpdate: { type: Boolean, default: void 0 }, validateOnBlur: { type: Boolean, default: void 0 }, validateOnMount: { type: Boolean, default: void 0 }, validateOnSubmit: { type: Boolean, default: void 0 }, as: { type: [String, Object], default: "DIV" }, asChild: { type: Boolean, default: !1 } }, provide: function() {
  return { $pcFormField: this, $parentInstance: this };
} };
function J(e2) {
  "@babel/helpers - typeof";
  return J = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, J(e2);
}
function Y(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function X(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Y(Object(n2), !0).forEach(function(t3) {
      Z(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Y(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function Z(e2, t2, n2) {
  return (t2 = ge(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function ge(e2) {
  var t2 = _e(e2, "string");
  return J(t2) == "symbol" ? t2 : t2 + "";
}
function _e(e2, t2) {
  if (J(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (J(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var Q = { name: "FormField", extends: he, inheritAttrs: !1, inject: { $pcForm: { default: void 0 } }, watch: { formControl: { immediate: !0, handler: function(e2) {
  var t2, n2;
  (t2 = this.$pcForm) == null || (n2 = t2.register) == null || n2.call(t2, this.name, e2);
} } }, computed: { formControl: function() {
  return { name: this.name, resolver: this.resolver, initialValue: this.initialValue, validateOnValueUpdate: this.validateOnValueUpdate, validateOnBlur: this.validateOnBlur, validateOnMount: this.validateOnMount, validateOnSubmit: this.validateOnSubmit };
}, field: function() {
  var e2;
  return ((e2 = this.$pcForm) == null || (e2 = e2.fields) == null ? void 0 : e2[this.name]) || {};
}, fieldAttrs: function() {
  return X(X({}, this.field.props), this.field.states);
} } };
function ve(e2, r2, i2, s2, c2, l2) {
  return e2.asChild ? t(e2.$slots, "default", n({ key: 1, class: e2.cx("root"), props: l2.field.props }, l2.fieldAttrs)) : (a(), f(o(e2.as), n({ key: 0, class: e2.cx("root") }, e2.ptmi("root")), { default: d(function() {
    return [t(e2.$slots, "default", n({ props: l2.field.props }, l2.fieldAttrs))];
  }), _: 3 }, 16, ["class"]));
}
Q.render = ve;
var $ = (e2, t2) => t2 ? b(e2) && Object.hasOwn(e2, t2) ? e2 : { [t2]: e2 } : e2;
var ye = (e2, t2, n2) => async ({ values: r2, name: i2 }) => {
  let { sync: a2 = !1, raw: o2 = !1 } = n2 || {};
  try {
    let n3 = await e2[a2 ? "parse" : "parseAsync"](r2, t2);
    return { values: $(o2 ? r2 : n3, i2), errors: {} };
  } catch (e3) {
    if (Array.isArray(e3?.issues || e3?.errors)) return { values: $(o2 ? r2 : void 0, i2), errors: (e3.issues || e3.errors).reduce((e4, t3) => {
      let n3 = v(t3.path) ? t3.path.join(".") : i2;
      return n3 && (e4[n3] ||= [], e4[n3].push(t3)), e4;
    }, {}) };
    throw e3;
  }
};
export {Q as n,q as r,ye as t};
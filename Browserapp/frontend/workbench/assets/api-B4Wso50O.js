import {A as e,E as t,v as n} from "./dist-DPswMdzV.js";
var r = { STARTS_WITH: "startsWith", CONTAINS: "contains", NOT_CONTAINS: "notContains", ENDS_WITH: "endsWith", EQUALS: "equals", NOT_EQUALS: "notEquals", IN: "in", LESS_THAN: "lt", LESS_THAN_OR_EQUAL_TO: "lte", GREATER_THAN: "gt", GREATER_THAN_OR_EQUAL_TO: "gte", BETWEEN: "between", DATE_IS: "dateIs", DATE_IS_NOT: "dateIsNot", DATE_BEFORE: "dateBefore", DATE_AFTER: "dateAfter" };
var i = { AND: "and", OR: "or" };
function a(e2, t2) {
  var n2 = typeof Symbol < "u" && e2[Symbol.iterator] || e2["@@iterator"];
  if (!n2) {
    if (Array.isArray(e2) || (n2 = o(e2)) || t2) {
      n2 && (e2 = n2);
      var r2 = 0, i2 = function() {
      };
      return { s: i2, n: function() {
        return r2 >= e2.length ? { done: !0 } : { done: !1, value: e2[r2++] };
      }, e: function(e3) {
        throw e3;
      }, f: i2 };
    }
    throw TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
  }
  var a2, s2 = !0, c2 = !1;
  return { s: function() {
    n2 = n2.call(e2);
  }, n: function() {
    var e3 = n2.next();
    return s2 = e3.done, e3;
  }, e: function(e3) {
    c2 = !0, a2 = e3;
  }, f: function() {
    try {
      s2 || n2.return == null || n2.return();
    } finally {
      if (c2) throw a2;
    }
  } };
}
function o(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return s(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? s(e2, t2) : void 0;
  }
}
function s(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
var c = { filter: function(t2, n2, r2, i2, o2) {
  var s2 = [];
  if (!t2) return s2;
  var c2 = a(t2), l;
  try {
    for (c2.s(); !(l = c2.n()).done; ) {
      var u = l.value;
      if (typeof u == "string") {
        if (this.filters[i2](u, r2, o2)) {
          s2.push(u);
          continue;
        }
      } else {
        var d = a(n2), f;
        try {
          for (d.s(); !(f = d.n()).done; ) {
            var p = f.value, m = e(u, p);
            if (this.filters[i2](m, r2, o2)) {
              s2.push(u);
              break;
            }
          }
        } catch (e2) {
          d.e(e2);
        } finally {
          d.f();
        }
      }
    }
  } catch (e2) {
    c2.e(e2);
  } finally {
    c2.f();
  }
  return s2;
}, filters: { startsWith: function(e2, t2, r2) {
  if (t2 == null || t2 === "") return !0;
  if (e2 == null) return !1;
  var i2 = n(t2.toString()).toLocaleLowerCase(r2);
  return n(e2.toString()).toLocaleLowerCase(r2).slice(0, i2.length) === i2;
}, contains: function(e2, t2, r2) {
  if (t2 == null || t2 === "") return !0;
  if (e2 == null) return !1;
  var i2 = n(t2.toString()).toLocaleLowerCase(r2);
  return n(e2.toString()).toLocaleLowerCase(r2).indexOf(i2) !== -1;
}, notContains: function(e2, t2, r2) {
  if (t2 == null || t2 === "") return !0;
  if (e2 == null) return !1;
  var i2 = n(t2.toString()).toLocaleLowerCase(r2);
  return n(e2.toString()).toLocaleLowerCase(r2).indexOf(i2) === -1;
}, endsWith: function(e2, t2, r2) {
  if (t2 == null || t2 === "") return !0;
  if (e2 == null) return !1;
  var i2 = n(t2.toString()).toLocaleLowerCase(r2), a2 = n(e2.toString()).toLocaleLowerCase(r2);
  return a2.indexOf(i2, a2.length - i2.length) !== -1;
}, equals: function(e2, t2, r2) {
  return t2 == null || t2 === "" ? !0 : e2 == null ? !1 : e2.getTime && t2.getTime ? e2.getTime() === t2.getTime() : n(e2.toString()).toLocaleLowerCase(r2) == n(t2.toString()).toLocaleLowerCase(r2);
}, notEquals: function(e2, t2, r2) {
  return t2 == null || t2 === "" ? !1 : e2 == null ? !0 : e2.getTime && t2.getTime ? e2.getTime() !== t2.getTime() : n(e2.toString()).toLocaleLowerCase(r2) != n(t2.toString()).toLocaleLowerCase(r2);
}, in: function(e2, n2) {
  if (n2 == null || n2.length === 0) return !0;
  for (var r2 = 0; r2 < n2.length; r2++) if (t(e2, n2[r2])) return !0;
  return !1;
}, between: function(e2, t2) {
  return t2 == null || t2[0] == null || t2[1] == null ? !0 : e2 == null ? !1 : e2.getTime ? t2[0].getTime() <= e2.getTime() && e2.getTime() <= t2[1].getTime() : t2[0] <= e2 && e2 <= t2[1];
}, lt: function(e2, t2) {
  return t2 == null ? !0 : e2 == null ? !1 : e2.getTime && t2.getTime ? e2.getTime() < t2.getTime() : e2 < t2;
}, lte: function(e2, t2) {
  return t2 == null ? !0 : e2 == null ? !1 : e2.getTime && t2.getTime ? e2.getTime() <= t2.getTime() : e2 <= t2;
}, gt: function(e2, t2) {
  return t2 == null ? !0 : e2 == null ? !1 : e2.getTime && t2.getTime ? e2.getTime() > t2.getTime() : e2 > t2;
}, gte: function(e2, t2) {
  return t2 == null ? !0 : e2 == null ? !1 : e2.getTime && t2.getTime ? e2.getTime() >= t2.getTime() : e2 >= t2;
}, dateIs: function(e2, t2) {
  return t2 == null || e2 != null && (typeof e2 == "string" && (e2 = new Date(e2)), typeof t2 == "string" && (t2 = new Date(t2)), e2.toDateString() === t2.toDateString());
}, dateIsNot: function(e2, t2) {
  return t2 == null || e2 != null && (typeof e2 == "string" && (e2 = new Date(e2)), typeof t2 == "string" && (t2 = new Date(t2)), e2.toDateString() !== t2.toDateString());
}, dateBefore: function(e2, t2) {
  return t2 == null || e2 != null && (typeof e2 == "string" && (e2 = new Date(e2)), typeof t2 == "string" && (t2 = new Date(t2)), e2.getTime() < t2.getTime());
}, dateAfter: function(e2, t2) {
  return t2 == null || e2 != null && (typeof e2 == "string" && (e2 = new Date(e2)), typeof t2 == "string" && (t2 = new Date(t2)), e2.getTime() > t2.getTime());
} }, register: function(e2, t2) {
  this.filters[e2] = t2;
} };
export {i as n,c as r,r as t};
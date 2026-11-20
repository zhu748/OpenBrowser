import {C as e,D as t,F as n,R as r,St as i,Tt as a,V as o,ct as s,ft as c,jt as l,vt as u,w as d} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as f,t as p} from "./w3c-keyname-BOAvb0qz.js";
function m(e49) {
  this.content = e49;
}
(m.prototype = { constructor: m, find: function(e49) {
  for (var t2 = 0; t2 < this.content.length; t2 += 2) if (this.content[t2] === e49) return t2;
  return -1;
}, get: function(e49) {
  var t2 = this.find(e49);
  return t2 == -1 ? void 0 : this.content[t2 + 1];
}, update: function(e49, t2, n2) {
  var r2 = n2 && n2 != e49 ? this.remove(n2) : this, i2 = r2.find(e49), a2 = r2.content.slice();
  return i2 == -1 ? a2.push(n2 || e49, t2) : (a2[i2 + 1] = t2, n2 && (a2[i2] = n2)), new m(a2);
}, remove: function(e49) {
  var t2 = this.find(e49);
  if (t2 == -1) return this;
  var n2 = this.content.slice();
  return n2.splice(t2, 2), new m(n2);
}, addToStart: function(e49, t2) {
  return new m([e49, t2].concat(this.remove(e49).content));
}, addToEnd: function(e49, t2) {
  var n2 = this.remove(e49).content.slice();
  return n2.push(e49, t2), new m(n2);
}, addBefore: function(e49, t2, n2) {
  var r2 = this.remove(t2), i2 = r2.content.slice(), a2 = r2.find(e49);
  return i2.splice(a2 == -1 ? i2.length : a2, 0, t2, n2), new m(i2);
}, forEach: function(e49) {
  for (var t2 = 0; t2 < this.content.length; t2 += 2) e49(this.content[t2], this.content[t2 + 1]);
}, prepend: function(e49) {
  return e49 = m.from(e49), e49.size ? new m(e49.content.concat(this.subtract(e49).content)) : this;
}, append: function(e49) {
  return e49 = m.from(e49), e49.size ? new m(this.subtract(e49).content.concat(e49.content)) : this;
}, subtract: function(e49) {
  var t2 = this;
  e49 = m.from(e49);
  for (var n2 = 0; n2 < e49.content.length; n2 += 2) t2 = t2.remove(e49.content[n2]);
  return t2;
}, toObject: function() {
  var e49 = {};
  return this.forEach(function(t2, n2) {
    e49[t2] = n2;
  }), e49;
}, get size() {
  return this.content.length >> 1;
} });
(m.from = function(e49) {
  if (e49 instanceof m) return e49;
  var t2 = [];
  if (e49) for (var n2 in e49) t2.push(n2, e49[n2]);
  return new m(t2);
});
function h(e49, t2, n2) {
  for (let r2 = 0; ; r2++) {
    if (r2 == e49.childCount || r2 == t2.childCount) return e49.childCount == t2.childCount ? null : n2;
    let i2 = e49.child(r2), a2 = t2.child(r2);
    if (i2 == a2) n2 += i2.nodeSize;
    else {
      if (!i2.sameMarkup(a2)) return n2;
      if (i2.isText && i2.text != a2.text) {
        let e50 = i2.text, t3 = a2.text, r3 = 0;
        for (; e50[r3] == t3[r3]; r3++) n2++;
        return r3 && r3 < e50.length && r3 < t3.length && v(e50.charCodeAt(r3 - 1)) && _(e50.charCodeAt(r3)) && n2--, n2;
      }
      if (i2.content.size || a2.content.size) {
        let e50 = h(i2.content, a2.content, n2 + 1);
        if (e50 != null) return e50;
      }
      n2 += i2.nodeSize;
    }
  }
}
function g(e49, t2, n2, r2) {
  for (let i2 = e49.childCount, a2 = t2.childCount; ; ) {
    if (i2 == 0 || a2 == 0) return i2 == a2 ? null : { a: n2, b: r2 };
    let o2 = e49.child(--i2), s2 = t2.child(--a2), c2 = o2.nodeSize;
    if (o2 == s2) n2 -= c2, r2 -= c2;
    else {
      if (!o2.sameMarkup(s2)) return { a: n2, b: r2 };
      if (o2.isText && o2.text != s2.text) {
        let e50 = o2.text, t3 = s2.text, i3 = e50.length, a3 = t3.length;
        for (; i3 > 0 && a3 > 0 && e50[i3 - 1] == t3[a3 - 1]; ) i3--, a3--, n2--, r2--;
        return i3 && a3 && i3 < e50.length && v(e50.charCodeAt(i3 - 1)) && _(e50.charCodeAt(i3)) && (n2++, r2++), { a: n2, b: r2 };
      }
      if (o2.content.size || s2.content.size) {
        let e50 = g(o2.content, s2.content, n2 - 1, r2 - 1);
        if (e50) return e50;
      }
      n2 -= c2, r2 -= c2;
    }
  }
}
function _(e49) {
  return e49 >= 56320 && e49 < 57344;
}
function v(e49) {
  return e49 >= 55296 && e49 < 56320;
}
var y = class e2 {
  constructor(e49, t2) {
    if (this.content = e49, this.size = t2 || 0, t2 == null) for (let t3 = 0; t3 < e49.length; t3++) this.size += e49[t3].nodeSize;
  }
  nodesBetween(e49, t2, n2, r2 = 0, i2) {
    for (let a2 = 0, o2 = 0; o2 < t2; a2++) {
      let s2 = this.content[a2], c2 = o2 + s2.nodeSize;
      if (c2 > e49 && n2(s2, r2 + o2, i2 || null, a2) !== !1 && s2.content.size) {
        let i3 = o2 + 1;
        s2.nodesBetween(Math.max(0, e49 - i3), Math.min(s2.content.size, t2 - i3), n2, r2 + i3);
      }
      o2 = c2;
    }
  }
  descendants(e49) {
    this.nodesBetween(0, this.size, e49);
  }
  textBetween(e49, t2, n2, r2) {
    let i2 = "", a2 = !0;
    return this.nodesBetween(e49, t2, (o2, s2) => {
      let c2 = o2.isText ? o2.text.slice(Math.max(e49, s2) - s2, t2 - s2) : o2.isLeaf ? r2 ? typeof r2 == "function" ? r2(o2) : r2 : o2.type.spec.leafText ? o2.type.spec.leafText(o2) : "" : "";
      o2.isBlock && (o2.isLeaf && c2 || o2.isTextblock) && n2 && (a2 ? a2 = !1 : i2 += n2), i2 += c2;
    }, 0), i2;
  }
  append(t2) {
    if (!t2.size) return this;
    if (!this.size) return t2;
    let n2 = this.lastChild, r2 = t2.firstChild, i2 = this.content.slice(), a2 = 0;
    for (n2.isText && n2.sameMarkup(r2) && (i2[i2.length - 1] = n2.withText(n2.text + r2.text), a2 = 1); a2 < t2.content.length; a2++) i2.push(t2.content[a2]);
    return new e2(i2, this.size + t2.size);
  }
  cut(t2, n2 = this.size) {
    if (t2 == 0 && n2 == this.size) return this;
    let r2 = [], i2 = 0;
    if (n2 > t2) for (let e49 = 0, a2 = 0; a2 < n2; e49++) {
      let o2 = this.content[e49], s2 = a2 + o2.nodeSize;
      s2 > t2 && ((a2 < t2 || s2 > n2) && (o2 = o2.isText ? o2.cut(Math.max(0, t2 - a2), Math.min(o2.text.length, n2 - a2)) : o2.cut(Math.max(0, t2 - a2 - 1), Math.min(o2.content.size, n2 - a2 - 1))), r2.push(o2), i2 += o2.nodeSize), a2 = s2;
    }
    return new e2(r2, i2);
  }
  cutByIndex(t2, n2) {
    return t2 == n2 ? e2.empty : t2 == 0 && n2 == this.content.length ? this : new e2(this.content.slice(t2, n2));
  }
  replaceChild(t2, n2) {
    let r2 = this.content[t2];
    if (r2 == n2) return this;
    let i2 = this.content.slice(), a2 = this.size + n2.nodeSize - r2.nodeSize;
    return i2[t2] = n2, new e2(i2, a2);
  }
  addToStart(t2) {
    return new e2([t2].concat(this.content), this.size + t2.nodeSize);
  }
  addToEnd(t2) {
    return new e2(this.content.concat(t2), this.size + t2.nodeSize);
  }
  eq(e49) {
    if (this.content.length != e49.content.length) return !1;
    for (let t2 = 0; t2 < this.content.length; t2++) if (!this.content[t2].eq(e49.content[t2])) return !1;
    return !0;
  }
  get firstChild() {
    return this.content.length ? this.content[0] : null;
  }
  get lastChild() {
    return this.content.length ? this.content[this.content.length - 1] : null;
  }
  get childCount() {
    return this.content.length;
  }
  child(e49) {
    let t2 = this.content[e49];
    if (!t2) throw RangeError("Index " + e49 + " out of range for " + this);
    return t2;
  }
  maybeChild(e49) {
    return this.content[e49] || null;
  }
  forEach(e49) {
    for (let t2 = 0, n2 = 0; t2 < this.content.length; t2++) {
      let r2 = this.content[t2];
      e49(r2, n2, t2), n2 += r2.nodeSize;
    }
  }
  findDiffStart(e49, t2 = 0) {
    return h(this, e49, t2);
  }
  findDiffEnd(e49, t2 = this.size, n2 = e49.size) {
    return g(this, e49, t2, n2);
  }
  findIndex(e49) {
    if (e49 == 0) return x(0, e49);
    if (e49 == this.size) return x(this.content.length, e49);
    if (e49 > this.size || e49 < 0) throw RangeError(`Position ${e49} outside of fragment (${this})`);
    for (let t2 = 0, n2 = 0; ; t2++) {
      let r2 = this.child(t2), i2 = n2 + r2.nodeSize;
      if (i2 >= e49) return i2 == e49 ? x(t2 + 1, i2) : x(t2, n2);
      n2 = i2;
    }
  }
  toString() {
    return "<" + this.toStringInner() + ">";
  }
  toStringInner() {
    return this.content.join(", ");
  }
  toJSON() {
    return this.content.length ? this.content.map((e49) => e49.toJSON()) : null;
  }
  static fromJSON(t2, n2) {
    if (!n2) return e2.empty;
    if (!Array.isArray(n2)) throw RangeError("Invalid input for Fragment.fromJSON");
    return e2.fromArray(n2.map(t2.nodeFromJSON));
  }
  static fromArray(t2) {
    if (!t2.length) return e2.empty;
    let n2, r2 = 0;
    for (let e49 = 0; e49 < t2.length; e49++) {
      let i2 = t2[e49];
      r2 += i2.nodeSize, e49 && i2.isText && t2[e49 - 1].sameMarkup(i2) ? (n2 ||= t2.slice(0, e49), n2[n2.length - 1] = i2.withText(n2[n2.length - 1].text + i2.text)) : n2 && n2.push(i2);
    }
    return new e2(n2 || t2, r2);
  }
  static from(t2) {
    if (!t2) return e2.empty;
    if (t2 instanceof e2) return t2;
    if (Array.isArray(t2)) return this.fromArray(t2);
    if (t2.attrs) return new e2([t2], t2.nodeSize);
    throw RangeError("Can not convert " + t2 + " to a Fragment" + (t2.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
  }
};
y.empty = new y([], 0);
var b = { index: 0, offset: 0 };
function x(e49, t2) {
  return b.index = e49, b.offset = t2, b;
}
function S(e49, t2) {
  if (e49 === t2) return !0;
  if (!(e49 && typeof e49 == "object") || !(t2 && typeof t2 == "object")) return !1;
  let n2 = Array.isArray(e49);
  if (Array.isArray(t2) != n2) return !1;
  if (n2) {
    if (e49.length != t2.length) return !1;
    for (let n3 = 0; n3 < e49.length; n3++) if (!S(e49[n3], t2[n3])) return !1;
  } else {
    for (let n3 in e49) if (!(n3 in t2) || !S(e49[n3], t2[n3])) return !1;
    for (let n3 in t2) if (!(n3 in e49)) return !1;
  }
  return !0;
}
var C = class e3 {
  constructor(e49, t2) {
    this.type = e49, this.attrs = t2;
  }
  addToSet(e49) {
    let t2, n2 = !1;
    for (let r2 = 0; r2 < e49.length; r2++) {
      let i2 = e49[r2];
      if (this.eq(i2)) return e49;
      if (this.type.excludes(i2.type)) t2 ||= e49.slice(0, r2);
      else {
        if (i2.type.excludes(this.type)) return e49;
        !n2 && i2.type.rank > this.type.rank && (t2 ||= e49.slice(0, r2), t2.push(this), n2 = !0), t2 && t2.push(i2);
      }
    }
    return t2 ||= e49.slice(), n2 || t2.push(this), t2;
  }
  removeFromSet(e49) {
    for (let t2 = 0; t2 < e49.length; t2++) if (this.eq(e49[t2])) return e49.slice(0, t2).concat(e49.slice(t2 + 1));
    return e49;
  }
  isInSet(e49) {
    for (let t2 = 0; t2 < e49.length; t2++) if (this.eq(e49[t2])) return !0;
    return !1;
  }
  eq(e49) {
    return this == e49 || this.type == e49.type && S(this.attrs, e49.attrs);
  }
  toJSON() {
    let e49 = { type: this.type.name };
    for (let t2 in this.attrs) {
      e49.attrs = this.attrs;
      break;
    }
    return e49;
  }
  static fromJSON(e49, t2) {
    if (!t2) throw RangeError("Invalid input for Mark.fromJSON");
    let n2 = e49.marks[t2.type];
    if (!n2) throw RangeError(`There is no mark type ${t2.type} in this schema`);
    let r2 = n2.create(t2.attrs);
    return n2.checkAttrs(r2.attrs), r2;
  }
  static sameSet(e49, t2) {
    if (e49 == t2) return !0;
    if (e49.length != t2.length) return !1;
    for (let n2 = 0; n2 < e49.length; n2++) if (!e49[n2].eq(t2[n2])) return !1;
    return !0;
  }
  static setFrom(t2) {
    if (!t2 || Array.isArray(t2) && t2.length == 0) return e3.none;
    if (t2 instanceof e3) return [t2];
    let n2 = t2.slice();
    return n2.sort((e49, t3) => e49.type.rank - t3.type.rank), n2;
  }
};
C.none = [];
var w = class extends Error {
};
var T = class e4 {
  constructor(e49, t2, n2) {
    this.content = e49, this.openStart = t2, this.openEnd = n2;
  }
  get size() {
    return this.content.size - this.openStart - this.openEnd;
  }
  insertAt(t2, n2) {
    let r2 = te(this.content, t2 + this.openStart, n2, this.openStart + 1, this.openEnd + 1);
    return r2 && new e4(r2, this.openStart, this.openEnd);
  }
  removeBetween(t2, n2) {
    return new e4(ee(this.content, t2 + this.openStart, n2 + this.openStart), this.openStart, this.openEnd);
  }
  eq(e49) {
    return this.content.eq(e49.content) && this.openStart == e49.openStart && this.openEnd == e49.openEnd;
  }
  toString() {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")";
  }
  toJSON() {
    if (!this.content.size) return null;
    let e49 = { content: this.content.toJSON() };
    return this.openStart > 0 && (e49.openStart = this.openStart), this.openEnd > 0 && (e49.openEnd = this.openEnd), e49;
  }
  static fromJSON(t2, n2) {
    if (!n2) return e4.empty;
    let r2 = n2.openStart || 0, i2 = n2.openEnd || 0;
    if (typeof r2 != "number" || typeof i2 != "number") throw RangeError("Invalid input for Slice.fromJSON");
    return new e4(y.fromJSON(t2, n2.content), r2, i2);
  }
  static maxOpen(t2, n2 = !0) {
    let r2 = 0, i2 = 0;
    for (let e49 = t2.firstChild; e49 && !e49.isLeaf && (n2 || !e49.type.spec.isolating); e49 = e49.firstChild) r2++;
    for (let e49 = t2.lastChild; e49 && !e49.isLeaf && (n2 || !e49.type.spec.isolating); e49 = e49.lastChild) i2++;
    return new e4(t2, r2, i2);
  }
};
T.empty = new T(y.empty, 0, 0);
function ee(e49, t2, n2) {
  let { index: r2, offset: i2 } = e49.findIndex(t2), a2 = e49.maybeChild(r2), { index: o2, offset: s2 } = e49.findIndex(n2);
  if (i2 == t2 || a2.isText) {
    if (s2 != n2 && !e49.child(o2).isText) throw RangeError("Removing non-flat range");
    return e49.cut(0, t2).append(e49.cut(n2));
  }
  if (r2 != o2) throw RangeError("Removing non-flat range");
  return e49.replaceChild(r2, a2.copy(ee(a2.content, t2 - i2 - 1, n2 - i2 - 1)));
}
function te(e49, t2, n2, r2, i2, a2) {
  let { index: o2, offset: s2 } = e49.findIndex(t2), c2 = e49.maybeChild(o2);
  if (s2 == t2 || c2.isText) return a2 && r2 <= 0 && i2 <= 0 && !a2.canReplace(o2, o2, n2) ? null : e49.cut(0, t2).append(n2).append(e49.cut(t2));
  let l2 = te(c2.content, t2 - s2 - 1, n2, o2 == 0 ? r2 - 1 : 0, o2 == e49.childCount - 1 ? i2 - 1 : 0, c2);
  return l2 && e49.replaceChild(o2, c2.copy(l2));
}
function ne(e49, t2, n2) {
  if (n2.openStart > e49.depth) throw new w("Inserted content deeper than insertion position");
  if (e49.depth - n2.openStart != t2.depth - n2.openEnd) throw new w("Inconsistent open depths");
  return re(e49, t2, n2, 0);
}
function re(e49, t2, n2, r2) {
  let i2 = e49.index(r2), a2 = e49.node(r2);
  if (i2 == t2.index(r2) && r2 < e49.depth - n2.openStart) {
    let o2 = re(e49, t2, n2, r2 + 1);
    return a2.copy(a2.content.replaceChild(i2, o2));
  }
  if (!n2.content.size) return ce(a2, ue(e49, t2, r2));
  if (!n2.openStart && !n2.openEnd && e49.depth == r2 && t2.depth == r2) {
    let r3 = e49.parent, i3 = r3.content;
    return ce(r3, i3.cut(0, e49.parentOffset).append(n2.content).append(i3.cut(t2.parentOffset)));
  }
  {
    let { start: i3, end: o2 } = de(n2, e49);
    return ce(a2, le(e49, i3, o2, t2, r2));
  }
}
function ie(e49, t2) {
  if (!t2.type.compatibleContent(e49.type)) throw new w("Cannot join " + t2.type.name + " onto " + e49.type.name);
}
function ae(e49, t2, n2) {
  let r2 = e49.node(n2);
  return ie(r2, t2.node(n2)), r2;
}
function oe(e49, t2) {
  let n2 = t2.length - 1;
  n2 >= 0 && e49.isText && e49.sameMarkup(t2[n2]) ? t2[n2] = e49.withText(t2[n2].text + e49.text) : t2.push(e49);
}
function se(e49, t2, n2, r2) {
  let i2 = (t2 || e49).node(n2), a2 = 0, o2 = t2 ? t2.index(n2) : i2.childCount;
  e49 && (a2 = e49.index(n2), e49.depth > n2 ? a2++ : e49.textOffset && (oe(e49.nodeAfter, r2), a2++));
  for (let e50 = a2; e50 < o2; e50++) oe(i2.child(e50), r2);
  t2 && t2.depth == n2 && t2.textOffset && oe(t2.nodeBefore, r2);
}
function ce(e49, t2) {
  if (!e49.type.validContent(t2)) throw new w("Invalid content for node " + e49.type.name);
  return e49.copy(t2);
}
function le(e49, t2, n2, r2, i2) {
  let a2 = e49.depth > i2 && ae(e49, t2, i2 + 1), o2 = r2.depth > i2 && ae(n2, r2, i2 + 1), s2 = [];
  return se(null, e49, i2, s2), a2 && o2 && t2.index(i2) == n2.index(i2) ? (ie(a2, o2), oe(ce(a2, le(e49, t2, n2, r2, i2 + 1)), s2)) : (a2 && oe(ce(a2, ue(e49, t2, i2 + 1)), s2), se(t2, n2, i2, s2), o2 && oe(ce(o2, ue(n2, r2, i2 + 1)), s2)), se(r2, null, i2, s2), new y(s2);
}
function ue(e49, t2, n2) {
  let r2 = [];
  return se(null, e49, n2, r2), e49.depth > n2 && oe(ce(ae(e49, t2, n2 + 1), ue(e49, t2, n2 + 1)), r2), se(t2, null, n2, r2), new y(r2);
}
function de(e49, t2) {
  let n2 = t2.depth - e49.openStart, r2 = t2.node(n2).copy(e49.content);
  for (let e50 = n2 - 1; e50 >= 0; e50--) r2 = t2.node(e50).copy(y.from(r2));
  return { start: r2.resolveNoCache(e49.openStart + n2), end: r2.resolveNoCache(r2.content.size - e49.openEnd - n2) };
}
var fe = class e5 {
  constructor(e49, t2, n2) {
    this.pos = e49, this.path = t2, this.parentOffset = n2, this.depth = t2.length / 3 - 1;
  }
  resolveDepth(e49) {
    return e49 == null ? this.depth : e49 < 0 ? this.depth + e49 : e49;
  }
  get parent() {
    return this.node(this.depth);
  }
  get doc() {
    return this.node(0);
  }
  node(e49) {
    return this.path[this.resolveDepth(e49) * 3];
  }
  index(e49) {
    return this.path[this.resolveDepth(e49) * 3 + 1];
  }
  indexAfter(e49) {
    return e49 = this.resolveDepth(e49), this.index(e49) + (e49 == this.depth && !this.textOffset ? 0 : 1);
  }
  start(e49) {
    return e49 = this.resolveDepth(e49), e49 == 0 ? 0 : this.path[e49 * 3 - 1] + 1;
  }
  end(e49) {
    return e49 = this.resolveDepth(e49), this.start(e49) + this.node(e49).content.size;
  }
  before(e49) {
    if (e49 = this.resolveDepth(e49), !e49) throw RangeError("There is no position before the top-level node");
    return e49 == this.depth + 1 ? this.pos : this.path[e49 * 3 - 1];
  }
  after(e49) {
    if (e49 = this.resolveDepth(e49), !e49) throw RangeError("There is no position after the top-level node");
    return e49 == this.depth + 1 ? this.pos : this.path[e49 * 3 - 1] + this.path[e49 * 3].nodeSize;
  }
  get textOffset() {
    return this.pos - this.path[this.path.length - 1];
  }
  get nodeAfter() {
    let e49 = this.parent, t2 = this.index(this.depth);
    if (t2 == e49.childCount) return null;
    let n2 = this.pos - this.path[this.path.length - 1], r2 = e49.child(t2);
    return n2 ? e49.child(t2).cut(n2) : r2;
  }
  get nodeBefore() {
    let e49 = this.index(this.depth), t2 = this.pos - this.path[this.path.length - 1];
    return t2 ? this.parent.child(e49).cut(0, t2) : e49 == 0 ? null : this.parent.child(e49 - 1);
  }
  posAtIndex(e49, t2) {
    t2 = this.resolveDepth(t2);
    let n2 = this.path[t2 * 3], r2 = t2 == 0 ? 0 : this.path[t2 * 3 - 1] + 1;
    for (let t3 = 0; t3 < e49; t3++) r2 += n2.child(t3).nodeSize;
    return r2;
  }
  marks() {
    let e49 = this.parent, t2 = this.index();
    if (e49.content.size == 0) return C.none;
    if (this.textOffset) return e49.child(t2).marks;
    let n2 = e49.maybeChild(t2 - 1), r2 = e49.maybeChild(t2);
    if (!n2) {
      let e50 = n2;
      n2 = r2, r2 = e50;
    }
    let i2 = n2.marks;
    for (var a2 = 0; a2 < i2.length; a2++) i2[a2].type.spec.inclusive !== !1 || r2 && i2[a2].isInSet(r2.marks) || (i2 = i2[a2--].removeFromSet(i2));
    return i2;
  }
  marksAcross(e49) {
    let t2 = this.parent.maybeChild(this.index());
    if (!t2 || !t2.isInline) return null;
    let n2 = t2.marks, r2 = e49.parent.maybeChild(e49.index());
    for (var i2 = 0; i2 < n2.length; i2++) n2[i2].type.spec.inclusive !== !1 || r2 && n2[i2].isInSet(r2.marks) || (n2 = n2[i2--].removeFromSet(n2));
    return n2;
  }
  sharedDepth(e49) {
    for (let t2 = this.depth; t2 > 0; t2--) if (this.start(t2) <= e49 && this.end(t2) >= e49) return t2;
    return 0;
  }
  blockRange(e49 = this, t2) {
    if (e49.pos < this.pos) return e49.blockRange(this);
    for (let n2 = this.depth - (this.parent.inlineContent || this.pos == e49.pos ? 1 : 0); n2 >= 0; n2--) if (e49.pos <= this.end(n2) && (!t2 || t2(this.node(n2)))) return new ge(this, e49, n2);
    return null;
  }
  sameParent(e49) {
    return this.pos - this.parentOffset == e49.pos - e49.parentOffset;
  }
  max(e49) {
    return e49.pos > this.pos ? e49 : this;
  }
  min(e49) {
    return e49.pos < this.pos ? e49 : this;
  }
  toString() {
    let e49 = "";
    for (let t2 = 1; t2 <= this.depth; t2++) e49 += (e49 ? "/" : "") + this.node(t2).type.name + "_" + this.index(t2 - 1);
    return e49 + ":" + this.parentOffset;
  }
  static resolve(t2, n2) {
    if (!(n2 >= 0 && n2 <= t2.content.size)) throw RangeError("Position " + n2 + " out of range");
    let r2 = [], i2 = 0, a2 = n2;
    for (let e49 = t2; ; ) {
      let { index: t3, offset: n3 } = e49.content.findIndex(a2), o2 = a2 - n3;
      if (r2.push(e49, t3, i2 + n3), !o2 || (e49 = e49.child(t3), e49.isText)) break;
      a2 = o2 - 1, i2 += n3 + 1;
    }
    return new e5(n2, r2, a2);
  }
  static resolveCached(t2, n2) {
    let r2 = he.get(t2);
    if (r2) for (let e49 = 0; e49 < r2.elts.length; e49++) {
      let t3 = r2.elts[e49];
      if (t3.pos == n2) return t3;
    }
    else he.set(t2, r2 = new pe());
    let i2 = r2.elts[r2.i] = e5.resolve(t2, n2);
    return r2.i = (r2.i + 1) % me, i2;
  }
};
var pe = class {
  constructor() {
    this.elts = [], this.i = 0;
  }
};
var me = 12;
var he = /* @__PURE__ */ new WeakMap();
var ge = class {
  constructor(e49, t2, n2) {
    this.$from = e49, this.$to = t2, this.depth = n2;
  }
  get start() {
    return this.$from.before(this.depth + 1);
  }
  get end() {
    return this.$to.after(this.depth + 1);
  }
  get parent() {
    return this.$from.node(this.depth);
  }
  get startIndex() {
    return this.$from.index(this.depth);
  }
  get endIndex() {
    return this.$to.indexAfter(this.depth);
  }
};
var _e = /* @__PURE__ */ Object.create(null);
var ve = class e6 {
  constructor(e49, t2, n2, r2 = C.none) {
    this.type = e49, this.attrs = t2, this.marks = r2, this.content = n2 || y.empty;
  }
  get children() {
    return this.content.content;
  }
  get nodeSize() {
    return this.isLeaf ? 1 : 2 + this.content.size;
  }
  get childCount() {
    return this.content.childCount;
  }
  child(e49) {
    return this.content.child(e49);
  }
  maybeChild(e49) {
    return this.content.maybeChild(e49);
  }
  forEach(e49) {
    this.content.forEach(e49);
  }
  nodesBetween(e49, t2, n2, r2 = 0) {
    this.content.nodesBetween(e49, t2, n2, r2, this);
  }
  descendants(e49) {
    this.nodesBetween(0, this.content.size, e49);
  }
  get textContent() {
    return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
  }
  textBetween(e49, t2, n2, r2) {
    return this.content.textBetween(e49, t2, n2, r2);
  }
  get firstChild() {
    return this.content.firstChild;
  }
  get lastChild() {
    return this.content.lastChild;
  }
  eq(e49) {
    return this == e49 || this.sameMarkup(e49) && this.content.eq(e49.content);
  }
  sameMarkup(e49) {
    return this.hasMarkup(e49.type, e49.attrs, e49.marks);
  }
  hasMarkup(e49, t2, n2) {
    return this.type == e49 && S(this.attrs, t2 || e49.defaultAttrs || _e) && C.sameSet(this.marks, n2 || C.none);
  }
  copy(t2 = null) {
    return t2 == this.content ? this : new e6(this.type, this.attrs, t2, this.marks);
  }
  mark(t2) {
    return t2 == this.marks ? this : new e6(this.type, this.attrs, this.content, t2);
  }
  cut(e49, t2 = this.content.size) {
    return e49 == 0 && t2 == this.content.size ? this : this.copy(this.content.cut(e49, t2));
  }
  slice(e49, t2 = this.content.size, n2 = !1) {
    if (e49 == t2) return T.empty;
    let r2 = this.resolve(e49), i2 = this.resolve(t2), a2 = n2 ? 0 : r2.sharedDepth(t2), o2 = r2.start(a2);
    return new T(r2.node(a2).content.cut(r2.pos - o2, i2.pos - o2), r2.depth - a2, i2.depth - a2);
  }
  replace(e49, t2, n2) {
    return ne(this.resolve(e49), this.resolve(t2), n2);
  }
  nodeAt(e49) {
    for (let t2 = this; ; ) {
      let { index: n2, offset: r2 } = t2.content.findIndex(e49);
      if (t2 = t2.maybeChild(n2), !t2) return null;
      if (r2 == e49 || t2.isText) return t2;
      e49 -= r2 + 1;
    }
  }
  childAfter(e49) {
    let { index: t2, offset: n2 } = this.content.findIndex(e49);
    return { node: this.content.maybeChild(t2), index: t2, offset: n2 };
  }
  childBefore(e49) {
    if (e49 == 0) return { node: null, index: 0, offset: 0 };
    let { index: t2, offset: n2 } = this.content.findIndex(e49);
    if (n2 < e49) return { node: this.content.child(t2), index: t2, offset: n2 };
    let r2 = this.content.child(t2 - 1);
    return { node: r2, index: t2 - 1, offset: n2 - r2.nodeSize };
  }
  resolve(e49) {
    return fe.resolveCached(this, e49);
  }
  resolveNoCache(e49) {
    return fe.resolve(this, e49);
  }
  rangeHasMark(e49, t2, n2) {
    let r2 = !1;
    return t2 > e49 && this.nodesBetween(e49, t2, (e50) => (n2.isInSet(e50.marks) && (r2 = !0), !r2)), r2;
  }
  get isBlock() {
    return this.type.isBlock;
  }
  get isTextblock() {
    return this.type.isTextblock;
  }
  get inlineContent() {
    return this.type.inlineContent;
  }
  get isInline() {
    return this.type.isInline;
  }
  get isText() {
    return this.type.isText;
  }
  get isLeaf() {
    return this.type.isLeaf;
  }
  get isAtom() {
    return this.type.isAtom;
  }
  toString() {
    if (this.type.spec.toDebugString) return this.type.spec.toDebugString(this);
    let e49 = this.type.name;
    return this.content.size && (e49 += "(" + this.content.toStringInner() + ")"), be(this.marks, e49);
  }
  contentMatchAt(e49) {
    let t2 = this.type.contentMatch.matchFragment(this.content, 0, e49);
    if (!t2) throw Error("Called contentMatchAt on a node with invalid content");
    return t2;
  }
  canReplace(e49, t2, n2 = y.empty, r2 = 0, i2 = n2.childCount) {
    let a2 = this.contentMatchAt(e49).matchFragment(n2, r2, i2), o2 = a2 && a2.matchFragment(this.content, t2);
    if (!o2 || !o2.validEnd) return !1;
    for (let e50 = r2; e50 < i2; e50++) if (!this.type.allowsMarks(n2.child(e50).marks)) return !1;
    return !0;
  }
  canReplaceWith(e49, t2, n2, r2) {
    if (r2 && !this.type.allowsMarks(r2)) return !1;
    let i2 = this.contentMatchAt(e49).matchType(n2), a2 = i2 && i2.matchFragment(this.content, t2);
    return a2 ? a2.validEnd : !1;
  }
  canAppend(e49) {
    return e49.content.size ? this.canReplace(this.childCount, this.childCount, e49.content) : this.type.compatibleContent(e49.type);
  }
  check() {
    this.type.checkContent(this.content), this.type.checkAttrs(this.attrs);
    let e49 = C.none;
    for (let t2 = 0; t2 < this.marks.length; t2++) {
      let n2 = this.marks[t2];
      n2.type.checkAttrs(n2.attrs), e49 = n2.addToSet(e49);
    }
    if (!C.sameSet(e49, this.marks)) throw RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((e50) => e50.type.name)}`);
    this.content.forEach((e50) => e50.check());
  }
  toJSON() {
    let e49 = { type: this.type.name };
    for (let t2 in this.attrs) {
      e49.attrs = this.attrs;
      break;
    }
    return this.content.size && (e49.content = this.content.toJSON()), this.marks.length && (e49.marks = this.marks.map((e50) => e50.toJSON())), e49;
  }
  static fromJSON(e49, t2) {
    if (!t2) throw RangeError("Invalid input for Node.fromJSON");
    let n2;
    if (t2.marks) {
      if (!Array.isArray(t2.marks)) throw RangeError("Invalid mark data for Node.fromJSON");
      n2 = t2.marks.map(e49.markFromJSON);
    }
    if (t2.type == "text") {
      if (typeof t2.text != "string") throw RangeError("Invalid text node in JSON");
      return e49.text(t2.text, n2);
    }
    let r2 = y.fromJSON(e49, t2.content), i2 = e49.nodeType(t2.type).create(t2.attrs, r2, n2);
    return i2.type.checkAttrs(i2.attrs), i2;
  }
};
ve.prototype.text = void 0;
var ye = class e7 extends ve {
  constructor(e49, t2, n2, r2) {
    if (super(e49, t2, null, r2), !n2) throw RangeError("Empty text nodes are not allowed");
    this.text = n2;
  }
  toString() {
    return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : be(this.marks, JSON.stringify(this.text));
  }
  get textContent() {
    return this.text;
  }
  textBetween(e49, t2) {
    return this.text.slice(e49, t2);
  }
  get nodeSize() {
    return this.text.length;
  }
  mark(t2) {
    return t2 == this.marks ? this : new e7(this.type, this.attrs, this.text, t2);
  }
  withText(t2) {
    return t2 == this.text ? this : new e7(this.type, this.attrs, t2, this.marks);
  }
  cut(e49 = 0, t2 = this.text.length) {
    return e49 == 0 && t2 == this.text.length ? this : this.withText(this.text.slice(e49, t2));
  }
  eq(e49) {
    return this.sameMarkup(e49) && this.text == e49.text;
  }
  toJSON() {
    let e49 = super.toJSON();
    return e49.text = this.text, e49;
  }
};
function be(e49, t2) {
  for (let n2 = e49.length - 1; n2 >= 0; n2--) t2 = e49[n2].type.name + "(" + t2 + ")";
  return t2;
}
var xe = class e8 {
  constructor(e49) {
    this.validEnd = e49, this.next = [], this.wrapCache = [];
  }
  static parse(t2, n2) {
    let r2 = new Se(t2, n2);
    if (r2.next == null) return e8.empty;
    let i2 = Ce(r2);
    r2.next && r2.err("Unexpected trailing text");
    let a2 = Ne(Ae(i2));
    return Pe(a2, r2), a2;
  }
  matchType(e49) {
    for (let t2 = 0; t2 < this.next.length; t2++) if (this.next[t2].type == e49) return this.next[t2].next;
    return null;
  }
  matchFragment(e49, t2 = 0, n2 = e49.childCount) {
    let r2 = this;
    for (let i2 = t2; r2 && i2 < n2; i2++) r2 = r2.matchType(e49.child(i2).type);
    return r2;
  }
  get inlineContent() {
    return this.next.length != 0 && this.next[0].type.isInline;
  }
  get defaultType() {
    for (let e49 = 0; e49 < this.next.length; e49++) {
      let { type: t2 } = this.next[e49];
      if (!(t2.isText || t2.hasRequiredAttrs())) return t2;
    }
    return null;
  }
  compatible(e49) {
    for (let t2 = 0; t2 < this.next.length; t2++) for (let n2 = 0; n2 < e49.next.length; n2++) if (this.next[t2].type == e49.next[n2].type) return !0;
    return !1;
  }
  fillBefore(e49, t2 = !1, n2 = 0) {
    let r2 = [this];
    function i2(a2, o2) {
      let s2 = a2.matchFragment(e49, n2);
      if (s2 && (!t2 || s2.validEnd)) return y.from(o2.map((e50) => e50.createAndFill()));
      for (let e50 = 0; e50 < a2.next.length; e50++) {
        let { type: t3, next: n3 } = a2.next[e50];
        if (!(t3.isText || t3.hasRequiredAttrs()) && r2.indexOf(n3) == -1) {
          r2.push(n3);
          let e51 = i2(n3, o2.concat(t3));
          if (e51) return e51;
        }
      }
      return null;
    }
    return i2(this, []);
  }
  findWrapping(e49) {
    for (let t3 = 0; t3 < this.wrapCache.length; t3 += 2) if (this.wrapCache[t3] == e49) return this.wrapCache[t3 + 1];
    let t2 = this.computeWrapping(e49);
    return this.wrapCache.push(e49, t2), t2;
  }
  computeWrapping(e49) {
    let t2 = /* @__PURE__ */ Object.create(null), n2 = [{ match: this, type: null, via: null }];
    for (; n2.length; ) {
      let r2 = n2.shift(), i2 = r2.match;
      if (i2.matchType(e49)) {
        let e50 = [];
        for (let t3 = r2; t3.type; t3 = t3.via) e50.push(t3.type);
        return e50.reverse();
      }
      for (let e50 = 0; e50 < i2.next.length; e50++) {
        let { type: a2, next: o2 } = i2.next[e50];
        a2.isLeaf || a2.hasRequiredAttrs() || a2.name in t2 || r2.type && !o2.validEnd || (n2.push({ match: a2.contentMatch, type: a2, via: r2 }), t2[a2.name] = !0);
      }
    }
    return null;
  }
  get edgeCount() {
    return this.next.length;
  }
  edge(e49) {
    if (e49 >= this.next.length) throw RangeError(`There's no ${e49}th edge in this content match`);
    return this.next[e49];
  }
  toString() {
    let e49 = [];
    function t2(n2) {
      e49.push(n2);
      for (let r2 = 0; r2 < n2.next.length; r2++) e49.indexOf(n2.next[r2].next) == -1 && t2(n2.next[r2].next);
    }
    return t2(this), e49.map((t3, n2) => {
      let r2 = n2 + (t3.validEnd ? "*" : " ") + " ";
      for (let n3 = 0; n3 < t3.next.length; n3++) r2 += (n3 ? ", " : "") + t3.next[n3].type.name + "->" + e49.indexOf(t3.next[n3].next);
      return r2;
    }).join(`
`);
  }
};
xe.empty = new xe(!0);
var Se = class {
  constructor(e49, t2) {
    this.string = e49, this.nodeTypes = t2, this.inline = null, this.pos = 0, this.tokens = e49.split(/\s*(?=\b|\W|$)/), this.tokens[this.tokens.length - 1] == "" && this.tokens.pop(), this.tokens[0] == "" && this.tokens.shift();
  }
  get next() {
    return this.tokens[this.pos];
  }
  eat(e49) {
    return this.next == e49 && (this.pos++ || !0);
  }
  err(e49) {
    throw SyntaxError(e49 + " (in content expression '" + this.string + "')");
  }
};
function Ce(e49) {
  let t2 = [];
  do
    t2.push(we(e49));
  while (e49.eat("|"));
  return t2.length == 1 ? t2[0] : { type: "choice", exprs: t2 };
}
function we(e49) {
  let t2 = [];
  do
    t2.push(Te(e49));
  while (e49.next && e49.next != ")" && e49.next != "|");
  return t2.length == 1 ? t2[0] : { type: "seq", exprs: t2 };
}
function Te(e49) {
  let t2 = ke(e49);
  for (; ; ) if (e49.eat("+")) t2 = { type: "plus", expr: t2 };
  else if (e49.eat("*")) t2 = { type: "star", expr: t2 };
  else if (e49.eat("?")) t2 = { type: "opt", expr: t2 };
  else if (e49.eat("{")) t2 = De(e49, t2);
  else break;
  return t2;
}
function Ee(e49) {
  /\D/.test(e49.next) && e49.err("Expected number, got '" + e49.next + "'");
  let t2 = Number(e49.next);
  return e49.pos++, t2;
}
function De(e49, t2) {
  let n2 = Ee(e49), r2 = n2;
  return e49.eat(",") && (r2 = e49.next == "}" ? -1 : Ee(e49)), e49.eat("}") || e49.err("Unclosed braced range"), { type: "range", min: n2, max: r2, expr: t2 };
}
function Oe(e49, t2) {
  let n2 = e49.nodeTypes, r2 = n2[t2];
  if (r2) return [r2];
  let i2 = [];
  for (let e50 in n2) {
    let r3 = n2[e50];
    r3.isInGroup(t2) && i2.push(r3);
  }
  return i2.length == 0 && e49.err("No node type or group '" + t2 + "' found"), i2;
}
function ke(e49) {
  if (e49.eat("(")) {
    let t2 = Ce(e49);
    return e49.eat(")") || e49.err("Missing closing paren"), t2;
  }
  if (/\W/.test(e49.next)) e49.err("Unexpected token '" + e49.next + "'");
  else {
    let t2 = Oe(e49, e49.next).map((t3) => (e49.inline == null ? e49.inline = t3.isInline : e49.inline != t3.isInline && e49.err("Mixing inline and block content"), { type: "name", value: t3 }));
    return e49.pos++, t2.length == 1 ? t2[0] : { type: "choice", exprs: t2 };
  }
}
function Ae(e49) {
  let t2 = [[]];
  return i2(a2(e49, 0), n2()), t2;
  function n2() {
    return t2.push([]) - 1;
  }
  function r2(e50, n3, r3) {
    let i3 = { term: r3, to: n3 };
    return t2[e50].push(i3), i3;
  }
  function i2(e50, t3) {
    e50.forEach((e51) => e51.to = t3);
  }
  function a2(e50, t3) {
    if (e50.type == "choice") return e50.exprs.reduce((e51, n3) => e51.concat(a2(n3, t3)), []);
    if (e50.type == "seq") for (let r3 = 0; ; r3++) {
      let o2 = a2(e50.exprs[r3], t3);
      if (r3 == e50.exprs.length - 1) return o2;
      i2(o2, t3 = n2());
    }
    else if (e50.type == "star") {
      let o2 = n2();
      return r2(t3, o2), i2(a2(e50.expr, o2), o2), [r2(o2)];
    } else if (e50.type == "plus") {
      let o2 = n2();
      return i2(a2(e50.expr, t3), o2), i2(a2(e50.expr, o2), o2), [r2(o2)];
    } else {
      if (e50.type == "opt") return [r2(t3)].concat(a2(e50.expr, t3));
      if (e50.type == "range") {
        let o2 = t3;
        for (let t4 = 0; t4 < e50.min; t4++) {
          let t5 = n2();
          i2(a2(e50.expr, o2), t5), o2 = t5;
        }
        if (e50.max == -1) i2(a2(e50.expr, o2), o2);
        else for (let t4 = e50.min; t4 < e50.max; t4++) {
          let t5 = n2();
          r2(o2, t5), i2(a2(e50.expr, o2), t5), o2 = t5;
        }
        return [r2(o2)];
      } else {
        if (e50.type == "name") return [r2(t3, void 0, e50.value)];
        throw Error("Unknown expr type");
      }
    }
  }
}
function je(e49, t2) {
  return t2 - e49;
}
function Me(e49, t2) {
  let n2 = [];
  return r2(t2), n2.sort(je);
  function r2(t3) {
    let i2 = e49[t3];
    if (i2.length == 1 && !i2[0].term) return r2(i2[0].to);
    n2.push(t3);
    for (let e50 = 0; e50 < i2.length; e50++) {
      let { term: t4, to: a2 } = i2[e50];
      !t4 && n2.indexOf(a2) == -1 && r2(a2);
    }
  }
}
function Ne(e49) {
  let t2 = /* @__PURE__ */ Object.create(null);
  return n2(Me(e49, 0));
  function n2(r2) {
    let i2 = [];
    r2.forEach((t3) => {
      e49[t3].forEach(({ term: t4, to: n3 }) => {
        if (!t4) return;
        let r3;
        for (let e50 = 0; e50 < i2.length; e50++) i2[e50][0] == t4 && (r3 = i2[e50][1]);
        Me(e49, n3).forEach((e50) => {
          r3 || i2.push([t4, r3 = []]), r3.indexOf(e50) == -1 && r3.push(e50);
        });
      });
    });
    let a2 = t2[r2.join(",")] = new xe(r2.indexOf(e49.length - 1) > -1);
    for (let e50 = 0; e50 < i2.length; e50++) {
      let r3 = i2[e50][1].sort(je);
      a2.next.push({ type: i2[e50][0], next: t2[r3.join(",")] || n2(r3) });
    }
    return a2;
  }
}
function Pe(e49, t2) {
  for (let n2 = 0, r2 = [e49]; n2 < r2.length; n2++) {
    let e50 = r2[n2], i2 = !e50.validEnd, a2 = [];
    for (let t3 = 0; t3 < e50.next.length; t3++) {
      let { type: n3, next: o2 } = e50.next[t3];
      a2.push(n3.name), i2 && !(n3.isText || n3.hasRequiredAttrs()) && (i2 = !1), r2.indexOf(o2) == -1 && r2.push(o2);
    }
    i2 && t2.err("Only non-generatable nodes (" + a2.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}
function Fe(e49) {
  let t2 = /* @__PURE__ */ Object.create(null);
  for (let n2 in e49) {
    let r2 = e49[n2];
    if (!r2.hasDefault) return null;
    t2[n2] = r2.default;
  }
  return t2;
}
function Ie(e49, t2) {
  let n2 = /* @__PURE__ */ Object.create(null);
  for (let r2 in e49) {
    let i2 = t2 && t2[r2];
    if (i2 === void 0) {
      let t3 = e49[r2];
      if (t3.hasDefault) i2 = t3.default;
      else throw RangeError("No value supplied for attribute " + r2);
    }
    n2[r2] = i2;
  }
  return n2;
}
function Le(e49, t2, n2, r2) {
  for (let i2 in t2) if (!(i2 in e49)) throw RangeError(`Unsupported attribute ${i2} for ${n2} of type ${r2}`);
  for (let n3 in e49) e49[n3].validate && e49[n3].validate(t2[n3]);
}
function Re(e49, t2) {
  let n2 = /* @__PURE__ */ Object.create(null);
  if (t2) for (let r2 in t2) n2[r2] = new Ve(e49, r2, t2[r2]);
  return n2;
}
var ze = class e9 {
  constructor(e49, t2, n2) {
    this.name = e49, this.schema = t2, this.spec = n2, this.markSet = null, this.groups = n2.group ? n2.group.split(" ") : [], this.attrs = Re(e49, n2.attrs), this.defaultAttrs = Fe(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(n2.inline || e49 == "text"), this.isText = e49 == "text";
  }
  get isInline() {
    return !this.isBlock;
  }
  get isTextblock() {
    return this.isBlock && this.inlineContent;
  }
  get isLeaf() {
    return this.contentMatch == xe.empty;
  }
  get isAtom() {
    return this.isLeaf || !!this.spec.atom;
  }
  isInGroup(e49) {
    return this.groups.indexOf(e49) > -1;
  }
  get whitespace() {
    return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
  }
  hasRequiredAttrs() {
    for (let e49 in this.attrs) if (this.attrs[e49].isRequired) return !0;
    return !1;
  }
  compatibleContent(e49) {
    return this == e49 || this.contentMatch.compatible(e49.contentMatch);
  }
  computeAttrs(e49) {
    return !e49 && this.defaultAttrs ? this.defaultAttrs : Ie(this.attrs, e49);
  }
  create(e49 = null, t2, n2) {
    if (this.isText) throw Error("NodeType.create can't construct text nodes");
    return new ve(this, this.computeAttrs(e49), y.from(t2), C.setFrom(n2));
  }
  createChecked(e49 = null, t2, n2) {
    return t2 = y.from(t2), this.checkContent(t2), new ve(this, this.computeAttrs(e49), t2, C.setFrom(n2));
  }
  createAndFill(e49 = null, t2, n2) {
    if (e49 = this.computeAttrs(e49), t2 = y.from(t2), t2.size) {
      let e50 = this.contentMatch.fillBefore(t2);
      if (!e50) return null;
      t2 = e50.append(t2);
    }
    let r2 = this.contentMatch.matchFragment(t2), i2 = r2 && r2.fillBefore(y.empty, !0);
    return i2 ? new ve(this, e49, t2.append(i2), C.setFrom(n2)) : null;
  }
  validContent(e49) {
    let t2 = this.contentMatch.matchFragment(e49);
    if (!t2 || !t2.validEnd) return !1;
    for (let t3 = 0; t3 < e49.childCount; t3++) if (!this.allowsMarks(e49.child(t3).marks)) return !1;
    return !0;
  }
  checkContent(e49) {
    if (!this.validContent(e49)) throw RangeError(`Invalid content for node ${this.name}: ${e49.toString().slice(0, 50)}`);
  }
  checkAttrs(e49) {
    Le(this.attrs, e49, "node", this.name);
  }
  allowsMarkType(e49) {
    return this.markSet == null || this.markSet.indexOf(e49) > -1;
  }
  allowsMarks(e49) {
    if (this.markSet == null) return !0;
    for (let t2 = 0; t2 < e49.length; t2++) if (!this.allowsMarkType(e49[t2].type)) return !1;
    return !0;
  }
  allowedMarks(e49) {
    if (this.markSet == null) return e49;
    let t2;
    for (let n2 = 0; n2 < e49.length; n2++) this.allowsMarkType(e49[n2].type) ? t2 && t2.push(e49[n2]) : t2 ||= e49.slice(0, n2);
    return t2 ? t2.length ? t2 : C.none : e49;
  }
  static compile(t2, n2) {
    let r2 = /* @__PURE__ */ Object.create(null);
    t2.forEach((t3, i3) => r2[t3] = new e9(t3, n2, i3));
    let i2 = n2.spec.topNode || "doc";
    if (!r2[i2]) throw RangeError("Schema is missing its top node type ('" + i2 + "')");
    if (!r2.text) throw RangeError("Every schema needs a 'text' type");
    for (let e49 in r2.text.attrs) throw RangeError("The text node type should not have attributes");
    return r2;
  }
};
function Be(e49, t2, n2) {
  let r2 = n2.split("|");
  return (n3) => {
    let i2 = n3 === null ? "null" : typeof n3;
    if (r2.indexOf(i2) < 0) throw RangeError(`Expected value of type ${r2} for attribute ${t2} on type ${e49}, got ${i2}`);
  };
}
var Ve = class {
  constructor(e49, t2, n2) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(n2, "default"), this.default = n2.default, this.validate = typeof n2.validate == "string" ? Be(e49, t2, n2.validate) : n2.validate;
  }
  get isRequired() {
    return !this.hasDefault;
  }
};
var He = class e10 {
  constructor(e49, t2, n2, r2) {
    this.name = e49, this.rank = t2, this.schema = n2, this.spec = r2, this.attrs = Re(e49, r2.attrs), this.excluded = null;
    let i2 = Fe(this.attrs);
    this.instance = i2 ? new C(this, i2) : null;
  }
  create(e49 = null) {
    return !e49 && this.instance ? this.instance : new C(this, Ie(this.attrs, e49));
  }
  static compile(t2, n2) {
    let r2 = /* @__PURE__ */ Object.create(null), i2 = 0;
    return t2.forEach((t3, a2) => r2[t3] = new e10(t3, i2++, n2, a2)), r2;
  }
  removeFromSet(e49) {
    for (var t2 = 0; t2 < e49.length; t2++) e49[t2].type == this && (e49 = e49.slice(0, t2).concat(e49.slice(t2 + 1)), t2--);
    return e49;
  }
  isInSet(e49) {
    for (let t2 = 0; t2 < e49.length; t2++) if (e49[t2].type == this) return e49[t2];
  }
  checkAttrs(e49) {
    Le(this.attrs, e49, "mark", this.name);
  }
  excludes(e49) {
    return this.excluded.indexOf(e49) > -1;
  }
};
var Ue = class {
  constructor(e49) {
    this.linebreakReplacement = null, this.cached = /* @__PURE__ */ Object.create(null);
    let t2 = this.spec = {};
    for (let n3 in e49) t2[n3] = e49[n3];
    t2.nodes = m.from(e49.nodes), t2.marks = m.from(e49.marks || {}), this.nodes = ze.compile(this.spec.nodes, this), this.marks = He.compile(this.spec.marks, this);
    let n2 = /* @__PURE__ */ Object.create(null);
    for (let e50 in this.nodes) {
      if (e50 in this.marks) throw RangeError(e50 + " can not be both a node and a mark");
      let t3 = this.nodes[e50], r2 = t3.spec.content || "", i2 = t3.spec.marks;
      if (t3.contentMatch = n2[r2] || (n2[r2] = xe.parse(r2, this.nodes)), t3.inlineContent = t3.contentMatch.inlineContent, t3.spec.linebreakReplacement) {
        if (this.linebreakReplacement) throw RangeError("Multiple linebreak nodes defined");
        if (!t3.isInline || !t3.isLeaf) throw RangeError("Linebreak replacement nodes must be inline leaf nodes");
        this.linebreakReplacement = t3;
      }
      t3.markSet = i2 == "_" ? null : i2 ? We(this, i2.split(" ")) : i2 == "" || !t3.inlineContent ? [] : null;
    }
    for (let e50 in this.marks) {
      let t3 = this.marks[e50], n3 = t3.spec.excludes;
      t3.excluded = n3 == null ? [t3] : n3 == "" ? [] : We(this, n3.split(" "));
    }
    this.nodeFromJSON = (e50) => ve.fromJSON(this, e50), this.markFromJSON = (e50) => C.fromJSON(this, e50), this.topNodeType = this.nodes[this.spec.topNode || "doc"], this.cached.wrappings = /* @__PURE__ */ Object.create(null);
  }
  node(e49, t2 = null, n2, r2) {
    if (typeof e49 == "string") e49 = this.nodeType(e49);
    else if (e49 instanceof ze) {
      if (e49.schema != this) throw RangeError("Node type from different schema used (" + e49.name + ")");
    } else throw RangeError("Invalid node type: " + e49);
    return e49.createChecked(t2, n2, r2);
  }
  text(e49, t2) {
    let n2 = this.nodes.text;
    return new ye(n2, n2.defaultAttrs, e49, C.setFrom(t2));
  }
  mark(e49, t2) {
    return typeof e49 == "string" && (e49 = this.marks[e49]), e49.create(t2);
  }
  nodeType(e49) {
    let t2 = this.nodes[e49];
    if (!t2) throw RangeError("Unknown node type: " + e49);
    return t2;
  }
};
function We(e49, t2) {
  let n2 = [];
  for (let r2 = 0; r2 < t2.length; r2++) {
    let i2 = t2[r2], a2 = e49.marks[i2], o2 = a2;
    if (a2) n2.push(a2);
    else for (let t3 in e49.marks) {
      let r3 = e49.marks[t3];
      (i2 == "_" || r3.spec.group && r3.spec.group.split(" ").indexOf(i2) > -1) && n2.push(o2 = r3);
    }
    if (!o2) throw SyntaxError("Unknown mark type: '" + t2[r2] + "'");
  }
  return n2;
}
function Ge(e49) {
  return e49.tag != null;
}
function Ke(e49) {
  return e49.style != null;
}
var qe = class e11 {
  constructor(e49, t2) {
    this.schema = e49, this.rules = t2, this.tags = [], this.styles = [];
    let n2 = this.matchedStyles = [];
    t2.forEach((e50) => {
      if (Ge(e50)) this.tags.push(e50);
      else if (Ke(e50)) {
        let t3 = /[^=]*/.exec(e50.style)[0];
        n2.indexOf(t3) < 0 && n2.push(t3), this.styles.push(e50);
      }
    }), this.normalizeLists = !this.tags.some((t3) => {
      if (!/^(ul|ol)\b/.test(t3.tag) || !t3.node) return !1;
      let n3 = e49.nodes[t3.node];
      return n3.contentMatch.matchType(n3);
    });
  }
  parse(e49, t2 = {}) {
    let n2 = new nt(this, t2, !1);
    return n2.addAll(e49, C.none, t2.from, t2.to), n2.finish();
  }
  parseSlice(e49, t2 = {}) {
    let n2 = new nt(this, t2, !0);
    return n2.addAll(e49, C.none, t2.from, t2.to), T.maxOpen(n2.finish());
  }
  matchTag(e49, t2, n2) {
    for (let r2 = n2 ? this.tags.indexOf(n2) + 1 : 0; r2 < this.tags.length; r2++) {
      let n3 = this.tags[r2];
      if (it(e49, n3.tag) && (n3.namespace === void 0 || e49.namespaceURI == n3.namespace) && (!n3.context || t2.matchesContext(n3.context))) {
        if (n3.getAttrs) {
          let t3 = n3.getAttrs(e49);
          if (t3 === !1) continue;
          n3.attrs = t3 || void 0;
        }
        return n3;
      }
    }
  }
  matchStyle(e49, t2, n2, r2) {
    for (let i2 = r2 ? this.styles.indexOf(r2) + 1 : 0; i2 < this.styles.length; i2++) {
      let r3 = this.styles[i2], a2 = r3.style;
      if (!(a2.indexOf(e49) != 0 || r3.context && !n2.matchesContext(r3.context) || a2.length > e49.length && (a2.charCodeAt(e49.length) != 61 || a2.slice(e49.length + 1) != t2))) {
        if (r3.getAttrs) {
          let e50 = r3.getAttrs(t2);
          if (e50 === !1) continue;
          r3.attrs = e50 || void 0;
        }
        return r3;
      }
    }
  }
  static schemaRules(e49) {
    let t2 = [];
    function n2(e50) {
      let n3 = e50.priority == null ? 50 : e50.priority, r2 = 0;
      for (; r2 < t2.length; r2++) {
        let e51 = t2[r2];
        if ((e51.priority == null ? 50 : e51.priority) < n3) break;
      }
      t2.splice(r2, 0, e50);
    }
    for (let t3 in e49.marks) {
      let r2 = e49.marks[t3].spec.parseDOM;
      r2 && r2.forEach((e50) => {
        n2(e50 = at(e50)), e50.mark || e50.ignore || e50.clearMark || (e50.mark = t3);
      });
    }
    for (let t3 in e49.nodes) {
      let r2 = e49.nodes[t3].spec.parseDOM;
      r2 && r2.forEach((e50) => {
        n2(e50 = at(e50)), e50.node || e50.ignore || e50.mark || (e50.node = t3);
      });
    }
    return t2;
  }
  static fromSchema(t2) {
    return t2.cached.domParser || (t2.cached.domParser = new e11(t2, e11.schemaRules(t2)));
  }
};
var Je = { address: !0, article: !0, aside: !0, blockquote: !0, body: !0, canvas: !0, dd: !0, div: !0, dl: !0, fieldset: !0, figcaption: !0, figure: !0, footer: !0, form: !0, h1: !0, h2: !0, h3: !0, h4: !0, h5: !0, h6: !0, header: !0, hgroup: !0, hr: !0, li: !0, noscript: !0, ol: !0, output: !0, p: !0, pre: !0, section: !0, table: !0, tfoot: !0, ul: !0 };
var Ye = { head: !0, noscript: !0, object: !0, script: !0, style: !0, title: !0 };
var Xe = { ol: !0, ul: !0 };
var Ze = 1;
var Qe = 2;
var $e = 4;
function et(e49, t2, n2) {
  return t2 == null ? e49 && e49.whitespace == "pre" ? 3 : n2 & -5 : (t2 ? Ze : 0) | (t2 === "full" ? Qe : 0);
}
var tt = class {
  constructor(e49, t2, n2, r2, i2, a2) {
    this.type = e49, this.attrs = t2, this.marks = n2, this.solid = r2, this.options = a2, this.content = [], this.activeMarks = C.none, this.match = i2 || (a2 & $e ? null : e49.contentMatch);
  }
  findWrapping(e49) {
    if (!this.match) {
      if (!this.type) return [];
      let t2 = this.type.contentMatch.fillBefore(y.from(e49));
      if (t2) this.match = this.type.contentMatch.matchFragment(t2);
      else {
        let t3 = this.type.contentMatch, n2;
        return (n2 = t3.findWrapping(e49.type)) ? (this.match = t3, n2) : null;
      }
    }
    return this.match.findWrapping(e49.type);
  }
  finish(e49) {
    if (!(this.options & Ze)) {
      let e50 = this.content[this.content.length - 1], t3;
      if (e50 && e50.isText && (t3 = /[ \t\r\n\u000c]+$/.exec(e50.text))) {
        let n2 = e50;
        e50.text.length == t3[0].length ? this.content.pop() : this.content[this.content.length - 1] = n2.withText(n2.text.slice(0, n2.text.length - t3[0].length));
      }
    }
    let t2 = y.from(this.content);
    return !e49 && this.match && (t2 = t2.append(this.match.fillBefore(y.empty, !0))), this.type ? this.type.create(this.attrs, t2, this.marks) : t2;
  }
  inlineContext(e49) {
    return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e49.parentNode && !Je.hasOwnProperty(e49.parentNode.nodeName.toLowerCase());
  }
};
var nt = class {
  constructor(e49, t2, n2) {
    this.parser = e49, this.options = t2, this.isOpen = n2, this.open = 0, this.localPreserveWS = !1;
    let r2 = t2.topNode, i2, a2 = et(null, t2.preserveWhitespace, 0) | (n2 ? $e : 0);
    i2 = r2 ? new tt(r2.type, r2.attrs, C.none, !0, t2.topMatch || r2.type.contentMatch, a2) : n2 ? new tt(null, null, C.none, !0, null, a2) : new tt(e49.schema.topNodeType, null, C.none, !0, null, a2), this.nodes = [i2], this.find = t2.findPositions, this.needsBlock = !1;
  }
  get top() {
    return this.nodes[this.open];
  }
  addDOM(e49, t2) {
    e49.nodeType == 3 ? this.addTextNode(e49, t2) : e49.nodeType == 1 && this.addElement(e49, t2);
  }
  addTextNode(e49, t2) {
    let n2 = e49.nodeValue, r2 = this.top, i2 = r2.options & Qe ? "full" : this.localPreserveWS || (r2.options & Ze) > 0, { schema: a2 } = this.parser;
    if (i2 === "full" || r2.inlineContext(e49) || /[^ \t\r\n\u000c]/.test(n2)) {
      if (i2)
        if (i2 === "full") n2 = n2.replace(/\r\n?/g, `
`);
        else if (a2.linebreakReplacement && /[\r\n]/.test(n2) && this.top.findWrapping(a2.linebreakReplacement.create())) {
          let e50 = n2.split(/\r?\n|\r/);
          for (let n3 = 0; n3 < e50.length; n3++) n3 && this.insertNode(a2.linebreakReplacement.create(), t2, !0), e50[n3] && this.insertNode(a2.text(e50[n3]), t2, !/\S/.test(e50[n3]));
          n2 = "";
        } else n2 = n2.replace(/\r?\n|\r/g, " ");
      else if (n2 = n2.replace(/[ \t\r\n\u000c]+/g, " "), /^[ \t\r\n\u000c]/.test(n2) && this.open == this.nodes.length - 1) {
        let t3 = r2.content[r2.content.length - 1], i3 = e49.previousSibling;
        (!t3 || i3 && i3.nodeName == "BR" || t3.isText && /[ \t\r\n\u000c]$/.test(t3.text)) && (n2 = n2.slice(1));
      }
      n2 && this.insertNode(a2.text(n2), t2, !/\S/.test(n2)), this.findInText(e49);
    } else this.findInside(e49);
  }
  addElement(e49, t2, n2) {
    let r2 = this.localPreserveWS, i2 = this.top;
    (e49.tagName == "PRE" || /pre/.test(e49.style && e49.style.whiteSpace)) && (this.localPreserveWS = !0);
    let a2 = e49.nodeName.toLowerCase(), o2;
    Xe.hasOwnProperty(a2) && this.parser.normalizeLists && rt(e49);
    let s2 = this.options.ruleFromNode && this.options.ruleFromNode(e49) || (o2 = this.parser.matchTag(e49, this, n2));
    out: if (s2 ? s2.ignore : Ye.hasOwnProperty(a2)) this.findInside(e49), this.ignoreFallback(e49, t2);
    else if (!s2 || s2.skip || s2.closeParent) {
      s2 && s2.closeParent ? this.open = Math.max(0, this.open - 1) : s2 && s2.skip.nodeType && (e49 = s2.skip);
      let n3, r3 = this.needsBlock;
      if (Je.hasOwnProperty(a2)) i2.content.length && i2.content[0].isInline && this.open && (this.open--, i2 = this.top), n3 = !0, i2.type || (this.needsBlock = !0);
      else if (!e49.firstChild) {
        this.leafFallback(e49, t2);
        break out;
      }
      let o3 = s2 && s2.skip ? t2 : this.readStyles(e49, t2);
      o3 && this.addAll(e49, o3), n3 && this.sync(i2), this.needsBlock = r3;
    } else {
      let n3 = this.readStyles(e49, t2);
      n3 && this.addElementByRule(e49, s2, n3, s2.consuming === !1 ? o2 : void 0);
    }
    this.localPreserveWS = r2;
  }
  leafFallback(e49, t2) {
    e49.nodeName == "BR" && this.top.type && this.top.type.inlineContent && this.addTextNode(e49.ownerDocument.createTextNode(`
`), t2);
  }
  ignoreFallback(e49, t2) {
    e49.nodeName != "BR" || this.top.type && this.top.type.inlineContent || this.findPlace(this.parser.schema.text("-"), t2, !0);
  }
  readStyles(e49, t2) {
    let n2 = e49.style;
    if (n2 && n2.length) for (let e50 = 0; e50 < this.parser.matchedStyles.length; e50++) {
      let r2 = this.parser.matchedStyles[e50], i2 = n2.getPropertyValue(r2);
      if (i2) for (let e51; ; ) {
        let n3 = this.parser.matchStyle(r2, i2, this, e51);
        if (!n3) break;
        if (n3.ignore) return null;
        if (t2 = n3.clearMark ? t2.filter((e52) => !n3.clearMark(e52)) : t2.concat(this.parser.schema.marks[n3.mark].create(n3.attrs)), n3.consuming === !1) e51 = n3;
        else break;
      }
    }
    return t2;
  }
  addElementByRule(e49, t2, n2, r2) {
    let i2, a2;
    if (t2.node)
      if (a2 = this.parser.schema.nodes[t2.node], a2.isLeaf) this.insertNode(a2.create(t2.attrs), n2, e49.nodeName == "BR") || this.leafFallback(e49, n2);
      else {
        let e50 = this.enter(a2, t2.attrs || null, n2, t2.preserveWhitespace);
        e50 && (i2 = !0, n2 = e50);
      }
    else {
      let e50 = this.parser.schema.marks[t2.mark];
      n2 = n2.concat(e50.create(t2.attrs));
    }
    let o2 = this.top;
    if (a2 && a2.isLeaf) this.findInside(e49);
    else if (r2) this.addElement(e49, n2, r2);
    else if (t2.getContent) this.findInside(e49), t2.getContent(e49, this.parser.schema).forEach((e50) => this.insertNode(e50, n2, !1));
    else {
      let r3 = e49;
      typeof t2.contentElement == "string" ? r3 = e49.querySelector(t2.contentElement) : typeof t2.contentElement == "function" ? r3 = t2.contentElement(e49) : t2.contentElement && (r3 = t2.contentElement), this.findAround(e49, r3, !0), this.addAll(r3, n2), this.findAround(e49, r3, !1);
    }
    i2 && this.sync(o2) && this.open--;
  }
  addAll(e49, t2, n2, r2) {
    let i2 = n2 || 0;
    for (let a2 = n2 ? e49.childNodes[n2] : e49.firstChild, o2 = r2 == null ? null : e49.childNodes[r2]; a2 != o2; a2 = a2.nextSibling, ++i2) this.findAtPoint(e49, i2), this.addDOM(a2, t2);
    this.findAtPoint(e49, i2);
  }
  findPlace(e49, t2, n2) {
    let r2, i2;
    for (let t3 = this.open, a2 = 0; t3 >= 0; t3--) {
      let o2 = this.nodes[t3], s2 = o2.findWrapping(e49);
      if (s2 && (!r2 || r2.length > s2.length + a2) && (r2 = s2, i2 = o2, !s2.length)) break;
      if (o2.solid) {
        if (n2) break;
        a2 += 2;
      }
    }
    if (!r2) return null;
    this.sync(i2);
    for (let e50 = 0; e50 < r2.length; e50++) t2 = this.enterInner(r2[e50], null, t2, !1);
    return t2;
  }
  insertNode(e49, t2, n2) {
    if (e49.isInline && this.needsBlock && !this.top.type) {
      let e50 = this.textblockFromContext();
      e50 && (t2 = this.enterInner(e50, null, t2));
    }
    let r2 = this.findPlace(e49, t2, n2);
    if (r2) {
      this.closeExtra();
      let t3 = this.top;
      t3.match &&= t3.match.matchType(e49.type);
      let n3 = C.none;
      for (let i2 of r2.concat(e49.marks)) (t3.type ? t3.type.allowsMarkType(i2.type) : ot(i2.type, e49.type)) && (n3 = i2.addToSet(n3));
      return t3.content.push(e49.mark(n3)), !0;
    }
    return !1;
  }
  enter(e49, t2, n2, r2) {
    let i2 = this.findPlace(e49.create(t2), n2, !1);
    return i2 &&= this.enterInner(e49, t2, n2, !0, r2), i2;
  }
  enterInner(e49, t2, n2, r2 = !1, i2) {
    this.closeExtra();
    let a2 = this.top;
    a2.match = a2.match && a2.match.matchType(e49);
    let o2 = et(e49, i2, a2.options);
    a2.options & $e && a2.content.length == 0 && (o2 |= $e);
    let s2 = C.none;
    return n2 = n2.filter((t3) => !(a2.type ? a2.type.allowsMarkType(t3.type) : ot(t3.type, e49)) || (s2 = t3.addToSet(s2), !1)), this.nodes.push(new tt(e49, t2, s2, r2, null, o2)), this.open++, n2;
  }
  closeExtra(e49 = !1) {
    let t2 = this.nodes.length - 1;
    if (t2 > this.open) {
      for (; t2 > this.open; t2--) this.nodes[t2 - 1].content.push(this.nodes[t2].finish(e49));
      this.nodes.length = this.open + 1;
    }
  }
  finish() {
    return this.open = 0, this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
  }
  sync(e49) {
    for (let t2 = this.open; t2 >= 0; t2--) {
      if (this.nodes[t2] == e49) return this.open = t2, !0;
      this.localPreserveWS && (this.nodes[t2].options |= Ze);
    }
    return !1;
  }
  get currentPos() {
    this.closeExtra();
    let e49 = 0;
    for (let t2 = this.open; t2 >= 0; t2--) {
      let n2 = this.nodes[t2].content;
      for (let t3 = n2.length - 1; t3 >= 0; t3--) e49 += n2[t3].nodeSize;
      t2 && e49++;
    }
    return e49;
  }
  findAtPoint(e49, t2) {
    if (this.find) for (let n2 = 0; n2 < this.find.length; n2++) this.find[n2].node == e49 && this.find[n2].offset == t2 && (this.find[n2].pos = this.currentPos);
  }
  findInside(e49) {
    if (this.find) for (let t2 = 0; t2 < this.find.length; t2++) this.find[t2].pos == null && e49.nodeType == 1 && e49.contains(this.find[t2].node) && (this.find[t2].pos = this.currentPos);
  }
  findAround(e49, t2, n2) {
    if (e49 != t2 && this.find) for (let r2 = 0; r2 < this.find.length; r2++) this.find[r2].pos == null && e49.nodeType == 1 && e49.contains(this.find[r2].node) && t2.compareDocumentPosition(this.find[r2].node) & (n2 ? 2 : 4) && (this.find[r2].pos = this.currentPos);
  }
  findInText(e49) {
    if (this.find) for (let t2 = 0; t2 < this.find.length; t2++) this.find[t2].node == e49 && (this.find[t2].pos = this.currentPos - (e49.nodeValue.length - this.find[t2].offset));
  }
  matchesContext(e49) {
    if (e49.indexOf("|") > -1) return e49.split(/\s*\|\s*/).some(this.matchesContext, this);
    let t2 = e49.split("/"), n2 = this.options.context, r2 = !this.isOpen && (!n2 || n2.parent.type == this.nodes[0].type), i2 = -(n2 ? n2.depth + 1 : 0) + +!r2, a2 = (e50, o2) => {
      for (; e50 >= 0; e50--) {
        let s2 = t2[e50];
        if (s2 == "") {
          if (e50 == t2.length - 1 || e50 == 0) continue;
          for (; o2 >= i2; o2--) if (a2(e50 - 1, o2)) return !0;
          return !1;
        }
        {
          let e51 = o2 > 0 || o2 == 0 && r2 ? this.nodes[o2].type : n2 && o2 >= i2 ? n2.node(o2 - i2).type : null;
          if (!e51 || e51.name != s2 && !e51.isInGroup(s2)) return !1;
          o2--;
        }
      }
      return !0;
    };
    return a2(t2.length - 1, this.open);
  }
  textblockFromContext() {
    let e49 = this.options.context;
    if (e49) for (let t2 = e49.depth; t2 >= 0; t2--) {
      let n2 = e49.node(t2).contentMatchAt(e49.indexAfter(t2)).defaultType;
      if (n2 && n2.isTextblock && n2.defaultAttrs) return n2;
    }
    for (let e50 in this.parser.schema.nodes) {
      let t2 = this.parser.schema.nodes[e50];
      if (t2.isTextblock && t2.defaultAttrs) return t2;
    }
  }
};
function rt(e49) {
  for (let t2 = e49.firstChild, n2 = null; t2; t2 = t2.nextSibling) {
    let e50 = t2.nodeType == 1 ? t2.nodeName.toLowerCase() : null;
    e50 && Xe.hasOwnProperty(e50) && n2 ? (n2.appendChild(t2), t2 = n2) : e50 == "li" ? n2 = t2 : e50 && (n2 = null);
  }
}
function it(e49, t2) {
  return (e49.matches || e49.msMatchesSelector || e49.webkitMatchesSelector || e49.mozMatchesSelector).call(e49, t2);
}
function at(e49) {
  let t2 = {};
  for (let n2 in e49) t2[n2] = e49[n2];
  return t2;
}
function ot(e49, t2) {
  let n2 = t2.schema.nodes;
  for (let r2 in n2) {
    let i2 = n2[r2];
    if (!i2.allowsMarkType(e49)) continue;
    let a2 = [], o2 = (e50) => {
      a2.push(e50);
      for (let n3 = 0; n3 < e50.edgeCount; n3++) {
        let { type: r3, next: i3 } = e50.edge(n3);
        if (r3 == t2 || a2.indexOf(i3) < 0 && o2(i3)) return !0;
      }
    };
    if (o2(i2.contentMatch)) return !0;
  }
}
var st = class e12 {
  constructor(e49, t2) {
    this.nodes = e49, this.marks = t2;
  }
  serializeFragment(e49, t2 = {}, n2) {
    n2 ||= lt(t2).createDocumentFragment();
    let r2 = n2, i2 = [];
    return e49.forEach((e50) => {
      if (i2.length || e50.marks.length) {
        let n3 = 0, a2 = 0;
        for (; n3 < i2.length && a2 < e50.marks.length; ) {
          let t3 = e50.marks[a2];
          if (!this.marks[t3.type.name]) a2++;
          else {
            if (!t3.eq(i2[n3][0]) || t3.type.spec.spanning === !1) break;
            n3++, a2++;
          }
        }
        for (; n3 < i2.length; ) r2 = i2.pop()[1];
        for (; a2 < e50.marks.length; ) {
          let n4 = e50.marks[a2++], o2 = this.serializeMark(n4, e50.isInline, t2);
          o2 && (i2.push([n4, r2]), r2.appendChild(o2.dom), r2 = o2.contentDOM || o2.dom);
        }
      }
      r2.appendChild(this.serializeNodeInner(e50, t2));
    }), n2;
  }
  serializeNodeInner(e49, t2) {
    if (e49.isText) return lt(t2).createTextNode(e49.text);
    let { dom: n2, contentDOM: r2 } = pt(lt(t2), this.nodes[e49.type.name](e49), null, e49.attrs);
    if (r2) {
      if (e49.isLeaf) throw RangeError("Content hole not allowed in a leaf node spec");
      this.serializeFragment(e49.content, t2, r2);
    }
    return n2;
  }
  serializeNode(e49, t2 = {}) {
    let n2 = this.serializeNodeInner(e49, t2);
    for (let r2 = e49.marks.length - 1; r2 >= 0; r2--) {
      let i2 = this.serializeMark(e49.marks[r2], e49.isInline, t2);
      i2 && ((i2.contentDOM || i2.dom).appendChild(n2), n2 = i2.dom);
    }
    return n2;
  }
  serializeMark(e49, t2, n2 = {}) {
    let r2 = this.marks[e49.type.name];
    return r2 && pt(lt(n2), r2(e49, t2), null, e49.attrs);
  }
  static renderSpec(e49, t2, n2 = null, r2) {
    return typeof t2 == "string" ? { dom: e49.createTextNode(t2) } : pt(e49, t2, n2, r2);
  }
  static fromSchema(t2) {
    return t2.cached.domSerializer || (t2.cached.domSerializer = new e12(this.nodesFromSchema(t2), this.marksFromSchema(t2)));
  }
  static nodesFromSchema(e49) {
    let t2 = ct(e49.nodes);
    return t2.text ||= (e50) => e50.text, t2;
  }
  static marksFromSchema(e49) {
    return ct(e49.marks);
  }
};
function ct(e49) {
  let t2 = {};
  for (let n2 in e49) {
    let r2 = e49[n2].spec.toDOM;
    r2 && (t2[n2] = r2);
  }
  return t2;
}
function lt(e49) {
  return e49.document || window.document;
}
var ut = /* @__PURE__ */ new WeakMap();
function dt(e49) {
  let t2 = ut.get(e49);
  return t2 === void 0 && ut.set(e49, t2 = ft(e49)), t2;
}
function ft(e49) {
  let t2 = null;
  function n2(e50) {
    if (e50 && typeof e50 == "object")
      if (Array.isArray(e50))
        if (typeof e50[0] == "string") t2 ||= [], t2.push(e50);
        else for (let t3 = 0; t3 < e50.length; t3++) n2(e50[t3]);
      else for (let t3 in e50) n2(e50[t3]);
  }
  return n2(e49), t2;
}
function pt(e49, t2, n2, r2) {
  if (t2.nodeType == 1) return { dom: t2 };
  if (t2.dom && t2.dom.nodeType == 1) return t2;
  let i2 = t2[0], a2;
  if (typeof i2 != "string") throw RangeError("Invalid array passed to renderSpec");
  if (r2 && (a2 = dt(r2)) && a2.indexOf(t2) > -1) throw RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
  let o2 = i2.indexOf(" ");
  o2 > 0 && (n2 = i2.slice(0, o2), i2 = i2.slice(o2 + 1));
  let s2, c2 = n2 ? e49.createElementNS(n2, i2) : e49.createElement(i2), l2 = t2[1], u2 = 1;
  if (l2 && typeof l2 == "object" && l2.nodeType == null && !Array.isArray(l2)) {
    u2 = 2;
    for (let e50 in l2) if (l2[e50] != null) {
      let t3 = e50.indexOf(" ");
      t3 > 0 ? c2.setAttributeNS(e50.slice(0, t3), e50.slice(t3 + 1), l2[e50]) : e50 == "style" && c2.style ? c2.style.cssText = l2[e50] : c2.setAttribute(e50, l2[e50]);
    }
  }
  for (let i3 = u2; i3 < t2.length; i3++) {
    let a3 = t2[i3];
    if (a3 === 0) {
      if (i3 < t2.length - 1 || i3 > u2) throw RangeError("Content hole must be the only child of its parent node");
      return { dom: c2, contentDOM: c2 };
    }
    if (typeof a3 == "string") c2.appendChild(e49.createTextNode(a3));
    else {
      let { dom: t3, contentDOM: i4 } = pt(e49, a3, n2, r2);
      if (c2.appendChild(t3), i4) {
        if (s2) throw RangeError("Multiple content holes");
        s2 = i4;
      }
    }
  }
  return { dom: c2, contentDOM: s2 };
}
var mt = 65535;
var ht = 2 ** 16;
function gt(e49, t2) {
  return e49 + t2 * ht;
}
function _t(e49) {
  return e49 & mt;
}
function vt(e49) {
  return (e49 - (e49 & mt)) / ht;
}
var yt = 1;
var bt = 2;
var xt = 4;
var St = 8;
var Ct = class {
  constructor(e49, t2, n2) {
    this.pos = e49, this.delInfo = t2, this.recover = n2;
  }
  get deleted() {
    return (this.delInfo & St) > 0;
  }
  get deletedBefore() {
    return (this.delInfo & 5) > 0;
  }
  get deletedAfter() {
    return (this.delInfo & 6) > 0;
  }
  get deletedAcross() {
    return (this.delInfo & xt) > 0;
  }
};
var wt = class e13 {
  constructor(t2, n2 = !1) {
    if (this.ranges = t2, this.inverted = n2, !t2.length && e13.empty) return e13.empty;
  }
  recover(e49) {
    let t2 = 0, n2 = _t(e49);
    if (!this.inverted) for (let e50 = 0; e50 < n2; e50++) t2 += this.ranges[e50 * 3 + 2] - this.ranges[e50 * 3 + 1];
    return this.ranges[n2 * 3] + t2 + vt(e49);
  }
  mapResult(e49, t2 = 1) {
    return this._map(e49, t2, !1);
  }
  map(e49, t2 = 1) {
    return this._map(e49, t2, !0);
  }
  _map(e49, t2, n2) {
    let r2 = 0, i2 = this.inverted ? 2 : 1, a2 = this.inverted ? 1 : 2;
    for (let o2 = 0; o2 < this.ranges.length; o2 += 3) {
      let s2 = this.ranges[o2] - (this.inverted ? r2 : 0);
      if (s2 > e49) break;
      let c2 = this.ranges[o2 + i2], l2 = this.ranges[o2 + a2], u2 = s2 + c2;
      if (e49 <= u2) {
        let i3 = c2 ? e49 == s2 ? -1 : e49 == u2 ? 1 : t2 : t2, a3 = s2 + r2 + (i3 < 0 ? 0 : l2);
        if (n2) return a3;
        let d2 = e49 == (t2 < 0 ? s2 : u2) ? null : gt(o2 / 3, e49 - s2), f2 = e49 == s2 ? bt : e49 == u2 ? yt : xt;
        return (t2 < 0 ? e49 != s2 : e49 != u2) && (f2 |= St), new Ct(a3, f2, d2);
      }
      r2 += l2 - c2;
    }
    return n2 ? e49 + r2 : new Ct(e49 + r2, 0, null);
  }
  touches(e49, t2) {
    let n2 = 0, r2 = _t(t2), i2 = this.inverted ? 2 : 1, a2 = this.inverted ? 1 : 2;
    for (let t3 = 0; t3 < this.ranges.length; t3 += 3) {
      let o2 = this.ranges[t3] - (this.inverted ? n2 : 0);
      if (o2 > e49) break;
      let s2 = this.ranges[t3 + i2];
      if (e49 <= o2 + s2 && t3 == r2 * 3) return !0;
      n2 += this.ranges[t3 + a2] - s2;
    }
    return !1;
  }
  forEach(e49) {
    let t2 = this.inverted ? 2 : 1, n2 = this.inverted ? 1 : 2;
    for (let r2 = 0, i2 = 0; r2 < this.ranges.length; r2 += 3) {
      let a2 = this.ranges[r2], o2 = a2 - (this.inverted ? i2 : 0), s2 = a2 + (this.inverted ? 0 : i2), c2 = this.ranges[r2 + t2], l2 = this.ranges[r2 + n2];
      e49(o2, o2 + c2, s2, s2 + l2), i2 += l2 - c2;
    }
  }
  invert() {
    return new e13(this.ranges, !this.inverted);
  }
  toString() {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
  }
  static offset(t2) {
    return t2 == 0 ? e13.empty : new e13(t2 < 0 ? [0, -t2, 0] : [0, 0, t2]);
  }
};
wt.empty = new wt([]);
var Tt = class e14 {
  constructor(e49, t2, n2 = 0, r2 = e49 ? e49.length : 0) {
    this.mirror = t2, this.from = n2, this.to = r2, this._maps = e49 || [], this.ownData = !(e49 || t2);
  }
  get maps() {
    return this._maps;
  }
  slice(t2 = 0, n2 = this.maps.length) {
    return new e14(this._maps, this.mirror, t2, n2);
  }
  appendMap(e49, t2) {
    this.ownData ||= (this._maps = this._maps.slice(), this.mirror = this.mirror && this.mirror.slice(), !0), this.to = this._maps.push(e49), t2 != null && this.setMirror(this._maps.length - 1, t2);
  }
  appendMapping(e49) {
    for (let t2 = 0, n2 = this._maps.length; t2 < e49._maps.length; t2++) {
      let r2 = e49.getMirror(t2);
      this.appendMap(e49._maps[t2], r2 != null && r2 < t2 ? n2 + r2 : void 0);
    }
  }
  getMirror(e49) {
    if (this.mirror) {
      for (let t2 = 0; t2 < this.mirror.length; t2++) if (this.mirror[t2] == e49) return this.mirror[t2 + (t2 % 2 ? -1 : 1)];
    }
  }
  setMirror(e49, t2) {
    this.mirror ||= [], this.mirror.push(e49, t2);
  }
  appendMappingInverted(e49) {
    for (let t2 = e49.maps.length - 1, n2 = this._maps.length + e49._maps.length; t2 >= 0; t2--) {
      let r2 = e49.getMirror(t2);
      this.appendMap(e49._maps[t2].invert(), r2 != null && r2 > t2 ? n2 - r2 - 1 : void 0);
    }
  }
  invert() {
    let t2 = new e14();
    return t2.appendMappingInverted(this), t2;
  }
  map(e49, t2 = 1) {
    if (this.mirror) return this._map(e49, t2, !0);
    for (let n2 = this.from; n2 < this.to; n2++) e49 = this._maps[n2].map(e49, t2);
    return e49;
  }
  mapResult(e49, t2 = 1) {
    return this._map(e49, t2, !1);
  }
  _map(e49, t2, n2) {
    let r2 = 0;
    for (let n3 = this.from; n3 < this.to; n3++) {
      let i2 = this._maps[n3].mapResult(e49, t2);
      if (i2.recover != null) {
        let t3 = this.getMirror(n3);
        if (t3 != null && t3 > n3 && t3 < this.to) {
          n3 = t3, e49 = this._maps[t3].recover(i2.recover);
          continue;
        }
      }
      r2 |= i2.delInfo, e49 = i2.pos;
    }
    return n2 ? e49 : new Ct(e49, r2, null);
  }
};
var Et = /* @__PURE__ */ Object.create(null);
var E = class {
  getMap() {
    return wt.empty;
  }
  merge(e49) {
    return null;
  }
  static fromJSON(e49, t2) {
    if (!t2 || !t2.stepType) throw RangeError("Invalid input for Step.fromJSON");
    let n2 = Et[t2.stepType];
    if (!n2) throw RangeError(`No step type ${t2.stepType} defined`);
    return n2.fromJSON(e49, t2);
  }
  static jsonID(e49, t2) {
    if (e49 in Et) throw RangeError("Duplicate use of step JSON ID " + e49);
    return Et[e49] = t2, t2.prototype.jsonID = e49, t2;
  }
};
var D = class e15 {
  constructor(e49, t2) {
    this.doc = e49, this.failed = t2;
  }
  static ok(t2) {
    return new e15(t2, null);
  }
  static fail(t2) {
    return new e15(null, t2);
  }
  static fromReplace(t2, n2, r2, i2) {
    try {
      return e15.ok(t2.replace(n2, r2, i2));
    } catch (t3) {
      if (t3 instanceof w) return e15.fail(t3.message);
      throw t3;
    }
  }
};
function Dt(e49, t2, n2) {
  let r2 = [];
  for (let i2 = 0; i2 < e49.childCount; i2++) {
    let a2 = e49.child(i2);
    a2.content.size && (a2 = a2.copy(Dt(a2.content, t2, a2))), a2.isInline && (a2 = t2(a2, n2, i2)), r2.push(a2);
  }
  return y.fromArray(r2);
}
var Ot = class e16 extends E {
  constructor(e49, t2, n2) {
    super(), this.from = e49, this.to = t2, this.mark = n2;
  }
  apply(e49) {
    let t2 = e49.slice(this.from, this.to), n2 = e49.resolve(this.from), r2 = n2.node(n2.sharedDepth(this.to)), i2 = new T(Dt(t2.content, (e50, t3) => !e50.isAtom || !t3.type.allowsMarkType(this.mark.type) ? e50 : e50.mark(this.mark.addToSet(e50.marks)), r2), t2.openStart, t2.openEnd);
    return D.fromReplace(e49, this.from, this.to, i2);
  }
  invert() {
    return new kt(this.from, this.to, this.mark);
  }
  map(t2) {
    let n2 = t2.mapResult(this.from, 1), r2 = t2.mapResult(this.to, -1);
    return n2.deleted && r2.deleted || n2.pos >= r2.pos ? null : new e16(n2.pos, r2.pos, this.mark);
  }
  merge(t2) {
    return t2 instanceof e16 && t2.mark.eq(this.mark) && this.from <= t2.to && this.to >= t2.from ? new e16(Math.min(this.from, t2.from), Math.max(this.to, t2.to), this.mark) : null;
  }
  toJSON() {
    return { stepType: "addMark", mark: this.mark.toJSON(), from: this.from, to: this.to };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.from != "number" || typeof n2.to != "number") throw RangeError("Invalid input for AddMarkStep.fromJSON");
    return new e16(n2.from, n2.to, t2.markFromJSON(n2.mark));
  }
};
E.jsonID("addMark", Ot);
var kt = class e17 extends E {
  constructor(e49, t2, n2) {
    super(), this.from = e49, this.to = t2, this.mark = n2;
  }
  apply(e49) {
    let t2 = e49.slice(this.from, this.to), n2 = new T(Dt(t2.content, (e50) => e50.mark(this.mark.removeFromSet(e50.marks)), e49), t2.openStart, t2.openEnd);
    return D.fromReplace(e49, this.from, this.to, n2);
  }
  invert() {
    return new Ot(this.from, this.to, this.mark);
  }
  map(t2) {
    let n2 = t2.mapResult(this.from, 1), r2 = t2.mapResult(this.to, -1);
    return n2.deleted && r2.deleted || n2.pos >= r2.pos ? null : new e17(n2.pos, r2.pos, this.mark);
  }
  merge(t2) {
    return t2 instanceof e17 && t2.mark.eq(this.mark) && this.from <= t2.to && this.to >= t2.from ? new e17(Math.min(this.from, t2.from), Math.max(this.to, t2.to), this.mark) : null;
  }
  toJSON() {
    return { stepType: "removeMark", mark: this.mark.toJSON(), from: this.from, to: this.to };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.from != "number" || typeof n2.to != "number") throw RangeError("Invalid input for RemoveMarkStep.fromJSON");
    return new e17(n2.from, n2.to, t2.markFromJSON(n2.mark));
  }
};
E.jsonID("removeMark", kt);
var At = class e18 extends E {
  constructor(e49, t2) {
    super(), this.pos = e49, this.mark = t2;
  }
  apply(e49) {
    let t2 = e49.nodeAt(this.pos);
    if (!t2) return D.fail("No node at mark step's position");
    let n2 = t2.type.create(t2.attrs, null, this.mark.addToSet(t2.marks));
    return D.fromReplace(e49, this.pos, this.pos + 1, new T(y.from(n2), 0, +!t2.isLeaf));
  }
  invert(t2) {
    let n2 = t2.nodeAt(this.pos);
    if (n2) {
      let t3 = this.mark.addToSet(n2.marks);
      if (t3.length == n2.marks.length) {
        for (let r2 = 0; r2 < n2.marks.length; r2++) if (!n2.marks[r2].isInSet(t3)) return new e18(this.pos, n2.marks[r2]);
        return new e18(this.pos, this.mark);
      }
    }
    return new jt(this.pos, this.mark);
  }
  map(t2) {
    let n2 = t2.mapResult(this.pos, 1);
    return n2.deletedAfter ? null : new e18(n2.pos, this.mark);
  }
  toJSON() {
    return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.pos != "number") throw RangeError("Invalid input for AddNodeMarkStep.fromJSON");
    return new e18(n2.pos, t2.markFromJSON(n2.mark));
  }
};
E.jsonID("addNodeMark", At);
var jt = class e19 extends E {
  constructor(e49, t2) {
    super(), this.pos = e49, this.mark = t2;
  }
  apply(e49) {
    let t2 = e49.nodeAt(this.pos);
    if (!t2) return D.fail("No node at mark step's position");
    let n2 = t2.type.create(t2.attrs, null, this.mark.removeFromSet(t2.marks));
    return D.fromReplace(e49, this.pos, this.pos + 1, new T(y.from(n2), 0, +!t2.isLeaf));
  }
  invert(e49) {
    let t2 = e49.nodeAt(this.pos);
    return !t2 || !this.mark.isInSet(t2.marks) ? this : new At(this.pos, this.mark);
  }
  map(t2) {
    let n2 = t2.mapResult(this.pos, 1);
    return n2.deletedAfter ? null : new e19(n2.pos, this.mark);
  }
  toJSON() {
    return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.pos != "number") throw RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
    return new e19(n2.pos, t2.markFromJSON(n2.mark));
  }
};
E.jsonID("removeNodeMark", jt);
var Mt = class e20 extends E {
  constructor(e49, t2, n2, r2 = !1) {
    super(), this.from = e49, this.to = t2, this.slice = n2, this.structure = r2;
  }
  apply(e49) {
    return this.structure && Nt(e49, this.from, this.to) ? D.fail("Structure replace would overwrite content") : D.fromReplace(e49, this.from, this.to, this.slice);
  }
  getMap() {
    return new wt([this.from, this.to - this.from, this.slice.size]);
  }
  invert(t2) {
    return new e20(this.from, this.from + this.slice.size, t2.slice(this.from, this.to));
  }
  map(t2) {
    let n2 = t2.mapResult(this.to, -1), r2 = this.from == this.to && e20.MAP_BIAS < 0 ? n2 : t2.mapResult(this.from, 1);
    return r2.deletedAcross && n2.deletedAcross ? null : new e20(r2.pos, Math.max(r2.pos, n2.pos), this.slice, this.structure);
  }
  merge(t2) {
    if (!(t2 instanceof e20) || t2.structure || this.structure) return null;
    if (this.from + this.slice.size == t2.from && !this.slice.openEnd && !t2.slice.openStart) {
      let n2 = this.slice.size + t2.slice.size == 0 ? T.empty : new T(this.slice.content.append(t2.slice.content), this.slice.openStart, t2.slice.openEnd);
      return new e20(this.from, this.to + (t2.to - t2.from), n2, this.structure);
    }
    if (t2.to == this.from && !this.slice.openStart && !t2.slice.openEnd) {
      let n2 = this.slice.size + t2.slice.size == 0 ? T.empty : new T(t2.slice.content.append(this.slice.content), t2.slice.openStart, this.slice.openEnd);
      return new e20(t2.from, this.to, n2, this.structure);
    }
    return null;
  }
  toJSON() {
    let e49 = { stepType: "replace", from: this.from, to: this.to };
    return this.slice.size && (e49.slice = this.slice.toJSON()), this.structure && (e49.structure = !0), e49;
  }
  static fromJSON(t2, n2) {
    if (typeof n2.from != "number" || typeof n2.to != "number") throw RangeError("Invalid input for ReplaceStep.fromJSON");
    return new e20(n2.from, n2.to, T.fromJSON(t2, n2.slice), !!n2.structure);
  }
};
(Mt.MAP_BIAS = 1);
(E.jsonID("replace", Mt));
var O = class e21 extends E {
  constructor(e49, t2, n2, r2, i2, a2, o2 = !1) {
    super(), this.from = e49, this.to = t2, this.gapFrom = n2, this.gapTo = r2, this.slice = i2, this.insert = a2, this.structure = o2;
  }
  apply(e49) {
    if (this.structure && (Nt(e49, this.from, this.gapFrom) || Nt(e49, this.gapTo, this.to))) return D.fail("Structure gap-replace would overwrite content");
    let t2 = e49.slice(this.gapFrom, this.gapTo);
    if (t2.openStart || t2.openEnd) return D.fail("Gap is not a flat range");
    let n2 = this.slice.insertAt(this.insert, t2.content);
    return n2 ? D.fromReplace(e49, this.from, this.to, n2) : D.fail("Content does not fit in gap");
  }
  getMap() {
    return new wt([this.from, this.gapFrom - this.from, this.insert, this.gapTo, this.to - this.gapTo, this.slice.size - this.insert]);
  }
  invert(t2) {
    let n2 = this.gapTo - this.gapFrom;
    return new e21(this.from, this.from + this.slice.size + n2, this.from + this.insert, this.from + this.insert + n2, t2.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
  }
  map(t2) {
    let n2 = t2.mapResult(this.from, 1), r2 = t2.mapResult(this.to, -1), i2 = this.from == this.gapFrom ? n2.pos : t2.map(this.gapFrom, -1), a2 = this.to == this.gapTo ? r2.pos : t2.map(this.gapTo, 1);
    return n2.deletedAcross && r2.deletedAcross || i2 < n2.pos || a2 > r2.pos ? null : new e21(n2.pos, r2.pos, i2, a2, this.slice, this.insert, this.structure);
  }
  toJSON() {
    let e49 = { stepType: "replaceAround", from: this.from, to: this.to, gapFrom: this.gapFrom, gapTo: this.gapTo, insert: this.insert };
    return this.slice.size && (e49.slice = this.slice.toJSON()), this.structure && (e49.structure = !0), e49;
  }
  static fromJSON(t2, n2) {
    if (typeof n2.from != "number" || typeof n2.to != "number" || typeof n2.gapFrom != "number" || typeof n2.gapTo != "number" || typeof n2.insert != "number") throw RangeError("Invalid input for ReplaceAroundStep.fromJSON");
    return new e21(n2.from, n2.to, n2.gapFrom, n2.gapTo, T.fromJSON(t2, n2.slice), n2.insert, !!n2.structure);
  }
};
E.jsonID("replaceAround", O);
function Nt(e49, t2, n2) {
  let r2 = e49.resolve(t2), i2 = n2 - t2, a2 = r2.depth;
  for (; i2 > 0 && a2 > 0 && r2.indexAfter(a2) == r2.node(a2).childCount; ) a2--, i2--;
  if (i2 > 0) {
    let e50 = r2.node(a2).maybeChild(r2.indexAfter(a2));
    for (; i2 > 0; ) {
      if (!e50 || e50.isLeaf) return !0;
      e50 = e50.firstChild, i2--;
    }
  }
  return !1;
}
function Pt(e49, t2, n2, r2) {
  let i2 = [], a2 = [], o2, s2;
  e49.doc.nodesBetween(t2, n2, (e50, c2, l2) => {
    if (!e50.isInline) return;
    let u2 = e50.marks;
    if (!r2.isInSet(u2) && l2.type.allowsMarkType(r2.type)) {
      let l3 = Math.max(c2, t2), d2 = Math.min(c2 + e50.nodeSize, n2), f2 = r2.addToSet(u2);
      for (let e51 = 0; e51 < u2.length; e51++) u2[e51].isInSet(f2) || (o2 && o2.to == l3 && o2.mark.eq(u2[e51]) ? o2.to = d2 : i2.push(o2 = new kt(l3, d2, u2[e51])));
      s2 && s2.to == l3 ? s2.to = d2 : a2.push(s2 = new Ot(l3, d2, r2));
    }
  }), i2.forEach((t3) => e49.step(t3)), a2.forEach((t3) => e49.step(t3));
}
function Ft(e49, t2, n2, r2) {
  let i2 = [], a2 = 0;
  e49.doc.nodesBetween(t2, n2, (e50, o2) => {
    if (!e50.isInline) return;
    a2++;
    let s2 = null;
    if (r2 instanceof He) {
      let t3 = e50.marks, n3;
      for (; n3 = r2.isInSet(t3); ) (s2 ||= []).push(n3), t3 = n3.removeFromSet(t3);
    } else r2 ? r2.isInSet(e50.marks) && (s2 = [r2]) : s2 = e50.marks;
    if (s2 && s2.length) {
      let r3 = Math.min(o2 + e50.nodeSize, n2);
      for (let e51 = 0; e51 < s2.length; e51++) {
        let n3 = s2[e51], c2;
        for (let e52 = 0; e52 < i2.length; e52++) {
          let t3 = i2[e52];
          t3.step == a2 - 1 && n3.eq(i2[e52].style) && (c2 = t3);
        }
        c2 ? (c2.to = r3, c2.step = a2) : i2.push({ style: n3, from: Math.max(o2, t2), to: r3, step: a2 });
      }
    }
  }), i2.forEach((t3) => e49.step(new kt(t3.from, t3.to, t3.style)));
}
function It(e49, t2, n2, r2 = n2.contentMatch, i2 = !0) {
  let a2 = e49.doc.nodeAt(t2), o2 = [], s2 = t2 + 1;
  for (let t3 = 0; t3 < a2.childCount; t3++) {
    let c2 = a2.child(t3), l2 = s2 + c2.nodeSize, u2 = r2.matchType(c2.type);
    if (!u2) o2.push(new Mt(s2, l2, T.empty));
    else {
      r2 = u2;
      for (let t4 = 0; t4 < c2.marks.length; t4++) n2.allowsMarkType(c2.marks[t4].type) || e49.step(new kt(s2, l2, c2.marks[t4]));
      if (i2 && c2.isText && n2.whitespace != "pre") {
        let e50, t4 = /\r?\n|\r/g, r3;
        for (; e50 = t4.exec(c2.text); ) r3 ||= new T(y.from(n2.schema.text(" ", n2.allowedMarks(c2.marks))), 0, 0), o2.push(new Mt(s2 + e50.index, s2 + e50.index + e50[0].length, r3));
      }
    }
    s2 = l2;
  }
  if (!r2.validEnd) {
    let t3 = r2.fillBefore(y.empty, !0);
    e49.replace(s2, s2, new T(t3, 0, 0));
  }
  for (let t3 = o2.length - 1; t3 >= 0; t3--) e49.step(o2[t3]);
}
function Lt(e49, t2, n2) {
  return (t2 == 0 || e49.canReplace(t2, e49.childCount)) && (n2 == e49.childCount || e49.canReplace(0, n2));
}
function Rt(e49) {
  let t2 = e49.parent.content.cutByIndex(e49.startIndex, e49.endIndex);
  for (let n2 = e49.depth, r2 = 0, i2 = 0; ; --n2) {
    let a2 = e49.$from.node(n2), o2 = e49.$from.index(n2) + r2, s2 = e49.$to.indexAfter(n2) - i2;
    if (n2 < e49.depth && a2.canReplace(o2, s2, t2)) return n2;
    if (n2 == 0 || a2.type.spec.isolating || !Lt(a2, o2, s2)) break;
    o2 && (r2 = 1), s2 < a2.childCount && (i2 = 1);
  }
  return null;
}
function zt(e49, t2, n2) {
  let { $from: r2, $to: i2, depth: a2 } = t2, o2 = r2.before(a2 + 1), s2 = i2.after(a2 + 1), c2 = o2, l2 = s2, u2 = y.empty, d2 = 0;
  for (let e50 = a2, t3 = !1; e50 > n2; e50--) t3 || r2.index(e50) > 0 ? (t3 = !0, u2 = y.from(r2.node(e50).copy(u2)), d2++) : c2--;
  let f2 = y.empty, p2 = 0;
  for (let e50 = a2, t3 = !1; e50 > n2; e50--) t3 || i2.after(e50 + 1) < i2.end(e50) ? (t3 = !0, f2 = y.from(i2.node(e50).copy(f2)), p2++) : l2++;
  e49.step(new O(c2, l2, o2, s2, new T(u2.append(f2), d2, p2), u2.size - d2, !0));
}
function Bt(e49, t2, n2 = null, r2 = e49) {
  let i2 = Ht(e49, t2), a2 = i2 && Ut(r2, t2);
  return a2 ? i2.map(Vt).concat({ type: t2, attrs: n2 }).concat(a2.map(Vt)) : null;
}
function Vt(e49) {
  return { type: e49, attrs: null };
}
function Ht(e49, t2) {
  let { parent: n2, startIndex: r2, endIndex: i2 } = e49, a2 = n2.contentMatchAt(r2).findWrapping(t2);
  if (!a2) return null;
  let o2 = a2.length ? a2[0] : t2;
  return n2.canReplaceWith(r2, i2, o2) ? a2 : null;
}
function Ut(e49, t2) {
  let { parent: n2, startIndex: r2, endIndex: i2 } = e49, a2 = n2.child(r2), o2 = t2.contentMatch.findWrapping(a2.type);
  if (!o2) return null;
  let s2 = (o2.length ? o2[o2.length - 1] : t2).contentMatch;
  for (let e50 = r2; s2 && e50 < i2; e50++) s2 = s2.matchType(n2.child(e50).type);
  return !s2 || !s2.validEnd ? null : o2;
}
function Wt(e49, t2, n2) {
  let r2 = y.empty;
  for (let e50 = n2.length - 1; e50 >= 0; e50--) {
    if (r2.size) {
      let t3 = n2[e50].type.contentMatch.matchFragment(r2);
      if (!t3 || !t3.validEnd) throw RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
    }
    r2 = y.from(n2[e50].type.create(n2[e50].attrs, r2));
  }
  let i2 = t2.start, a2 = t2.end;
  e49.step(new O(i2, a2, i2, a2, new T(r2, 0, 0), n2.length, !0));
}
function Gt(e49, t2, n2, r2, i2) {
  if (!r2.isTextblock) throw RangeError("Type given to setBlockType should be a textblock");
  let a2 = e49.steps.length;
  e49.doc.nodesBetween(t2, n2, (t3, n3) => {
    let o2 = typeof i2 == "function" ? i2(t3) : i2;
    if (t3.isTextblock && !t3.hasMarkup(r2, o2) && Jt(e49.doc, e49.mapping.slice(a2).map(n3), r2)) {
      let i3 = null;
      if (r2.schema.linebreakReplacement) {
        let e50 = r2.whitespace == "pre", t4 = !!r2.contentMatch.matchType(r2.schema.linebreakReplacement);
        e50 && !t4 ? i3 = !1 : !e50 && t4 && (i3 = !0);
      }
      i3 === !1 && qt(e49, t3, n3, a2), It(e49, e49.mapping.slice(a2).map(n3, 1), r2, void 0, i3 === null);
      let s2 = e49.mapping.slice(a2), c2 = s2.map(n3, 1), l2 = s2.map(n3 + t3.nodeSize, 1);
      return e49.step(new O(c2, l2, c2 + 1, l2 - 1, new T(y.from(r2.create(o2, null, t3.marks)), 0, 0), 1, !0)), i3 === !0 && Kt(e49, t3, n3, a2), !1;
    }
  });
}
function Kt(e49, t2, n2, r2) {
  t2.forEach((i2, a2) => {
    if (i2.isText) {
      let o2, s2 = /\r?\n|\r/g;
      for (; o2 = s2.exec(i2.text); ) {
        let i3 = e49.mapping.slice(r2).map(n2 + 1 + a2 + o2.index);
        e49.replaceWith(i3, i3 + 1, t2.type.schema.linebreakReplacement.create());
      }
    }
  });
}
function qt(e49, t2, n2, r2) {
  t2.forEach((i2, a2) => {
    if (i2.type == i2.type.schema.linebreakReplacement) {
      let i3 = e49.mapping.slice(r2).map(n2 + 1 + a2);
      e49.replaceWith(i3, i3 + 1, t2.type.schema.text(`
`));
    }
  });
}
function Jt(e49, t2, n2) {
  let r2 = e49.resolve(t2), i2 = r2.index();
  return r2.parent.canReplaceWith(i2, i2 + 1, n2);
}
function Yt(e49, t2, n2, r2, i2) {
  let a2 = e49.doc.nodeAt(t2);
  if (!a2) throw RangeError("No node at given position");
  n2 ||= a2.type;
  let o2 = n2.create(r2, null, i2 || a2.marks);
  if (a2.isLeaf) return e49.replaceWith(t2, t2 + a2.nodeSize, o2);
  if (!n2.validContent(a2.content)) throw RangeError("Invalid content for node type " + n2.name);
  e49.step(new O(t2, t2 + a2.nodeSize, t2 + 1, t2 + a2.nodeSize - 1, new T(y.from(o2), 0, 0), 1, !0));
}
function Xt(e49, t2, n2 = 1, r2) {
  let i2 = e49.resolve(t2), a2 = i2.depth - n2, o2 = r2 && r2[r2.length - 1] || i2.parent;
  if (a2 < 0 || i2.parent.type.spec.isolating || !i2.parent.canReplace(i2.index(), i2.parent.childCount) || !o2.type.validContent(i2.parent.content.cutByIndex(i2.index(), i2.parent.childCount))) return !1;
  for (let e50 = i2.depth - 1, t3 = n2 - 2; e50 > a2; e50--, t3--) {
    let n3 = i2.node(e50), a3 = i2.index(e50);
    if (n3.type.spec.isolating) return !1;
    let o3 = n3.content.cutByIndex(a3, n3.childCount), s3 = r2 && r2[t3 + 1];
    s3 && (o3 = o3.replaceChild(0, s3.type.create(s3.attrs)));
    let c3 = r2 && r2[t3] || n3;
    if (!n3.canReplace(a3 + 1, n3.childCount) || !c3.type.validContent(o3)) return !1;
  }
  let s2 = i2.indexAfter(a2), c2 = r2 && r2[0];
  return i2.node(a2).canReplaceWith(s2, s2, c2 ? c2.type : i2.node(a2 + 1).type);
}
function Zt(e49, t2, n2 = 1, r2) {
  let i2 = e49.doc.resolve(t2), a2 = y.empty, o2 = y.empty;
  for (let e50 = i2.depth, t3 = i2.depth - n2, s2 = n2 - 1; e50 > t3; e50--, s2--) {
    a2 = y.from(i2.node(e50).copy(a2));
    let t4 = r2 && r2[s2];
    o2 = y.from(t4 ? t4.type.create(t4.attrs, o2) : i2.node(e50).copy(o2));
  }
  e49.step(new Mt(t2, t2, new T(a2.append(o2), n2, n2), !0));
}
function Qt(e49, t2) {
  let n2 = e49.resolve(t2), r2 = n2.index();
  return en(n2.nodeBefore, n2.nodeAfter) && n2.parent.canReplace(r2, r2 + 1);
}
function $t(e49, t2) {
  t2.content.size || e49.type.compatibleContent(t2.type);
  let n2 = e49.contentMatchAt(e49.childCount), { linebreakReplacement: r2 } = e49.type.schema;
  for (let i2 = 0; i2 < t2.childCount; i2++) {
    let a2 = t2.child(i2), o2 = a2.type == r2 ? e49.type.schema.nodes.text : a2.type;
    if (n2 = n2.matchType(o2), !n2 || !e49.type.allowsMarks(a2.marks)) return !1;
  }
  return n2.validEnd;
}
function en(e49, t2) {
  return !!(e49 && t2 && !e49.isLeaf && $t(e49, t2));
}
function tn(e49, t2, n2 = -1) {
  let r2 = e49.resolve(t2);
  for (let e50 = r2.depth; ; e50--) {
    let i2, a2, o2 = r2.index(e50);
    if (e50 == r2.depth ? (i2 = r2.nodeBefore, a2 = r2.nodeAfter) : n2 > 0 ? (i2 = r2.node(e50 + 1), o2++, a2 = r2.node(e50).maybeChild(o2)) : (i2 = r2.node(e50).maybeChild(o2 - 1), a2 = r2.node(e50 + 1)), i2 && !i2.isTextblock && en(i2, a2) && r2.node(e50).canReplace(o2, o2 + 1)) return t2;
    if (e50 == 0) break;
    t2 = n2 < 0 ? r2.before(e50) : r2.after(e50);
  }
}
function nn(e49, t2, n2) {
  let r2 = null, { linebreakReplacement: i2 } = e49.doc.type.schema, a2 = e49.doc.resolve(t2 - n2), o2 = a2.node().type;
  if (i2 && o2.inlineContent) {
    let e50 = o2.whitespace == "pre", t3 = !!o2.contentMatch.matchType(i2);
    e50 && !t3 ? r2 = !1 : !e50 && t3 && (r2 = !0);
  }
  let s2 = e49.steps.length;
  if (r2 === !1) {
    let r3 = e49.doc.resolve(t2 + n2);
    qt(e49, r3.node(), r3.before(), s2);
  }
  o2.inlineContent && It(e49, t2 + n2 - 1, o2, a2.node().contentMatchAt(a2.index()), r2 == null);
  let c2 = e49.mapping.slice(s2), l2 = c2.map(t2 - n2);
  if (e49.step(new Mt(l2, c2.map(t2 + n2, -1), T.empty, !0)), r2 === !0) {
    let t3 = e49.doc.resolve(l2);
    Kt(e49, t3.node(), t3.before(), e49.steps.length);
  }
  return e49;
}
function rn(e49, t2, n2) {
  let r2 = e49.resolve(t2);
  if (r2.parent.canReplaceWith(r2.index(), r2.index(), n2)) return t2;
  if (r2.parentOffset == 0) for (let e50 = r2.depth - 1; e50 >= 0; e50--) {
    let t3 = r2.index(e50);
    if (r2.node(e50).canReplaceWith(t3, t3, n2)) return r2.before(e50 + 1);
    if (t3 > 0) return null;
  }
  if (r2.parentOffset == r2.parent.content.size) for (let e50 = r2.depth - 1; e50 >= 0; e50--) {
    let t3 = r2.indexAfter(e50);
    if (r2.node(e50).canReplaceWith(t3, t3, n2)) return r2.after(e50 + 1);
    if (t3 < r2.node(e50).childCount) return null;
  }
  return null;
}
function an(e49, t2, n2) {
  let r2 = e49.resolve(t2);
  if (!n2.content.size) return t2;
  let i2 = n2.content;
  for (let e50 = 0; e50 < n2.openStart; e50++) i2 = i2.firstChild.content;
  for (let e50 = 1; e50 <= (n2.openStart == 0 && n2.size ? 2 : 1); e50++) for (let t3 = r2.depth; t3 >= 0; t3--) {
    let n3 = t3 == r2.depth ? 0 : r2.pos <= (r2.start(t3 + 1) + r2.end(t3 + 1)) / 2 ? -1 : 1, a2 = r2.index(t3) + +(n3 > 0), o2 = r2.node(t3), s2 = !1;
    if (e50 == 1) s2 = o2.canReplace(a2, a2, i2);
    else {
      let e51 = o2.contentMatchAt(a2).findWrapping(i2.firstChild.type);
      s2 = e51 && o2.canReplaceWith(a2, a2, e51[0]);
    }
    if (s2) return n3 == 0 ? r2.pos : n3 < 0 ? r2.before(t3 + 1) : r2.after(t3 + 1);
  }
  return null;
}
function on(e49, t2, n2 = t2, r2 = T.empty) {
  if (t2 == n2 && !r2.size) return null;
  let i2 = e49.resolve(t2), a2 = e49.resolve(n2);
  return sn(i2, a2, r2) ? new Mt(t2, n2, r2) : new cn(i2, a2, r2).fit();
}
function sn(e49, t2, n2) {
  return !n2.openStart && !n2.openEnd && e49.start() == t2.start() && e49.parent.canReplace(e49.index(), t2.index(), n2.content);
}
var cn = class {
  constructor(e49, t2, n2) {
    this.$from = e49, this.$to = t2, this.unplaced = n2, this.frontier = [], this.placed = y.empty;
    for (let t3 = 0; t3 <= e49.depth; t3++) {
      let n3 = e49.node(t3);
      this.frontier.push({ type: n3.type, match: n3.contentMatchAt(e49.indexAfter(t3)) });
    }
    for (let t3 = e49.depth; t3 > 0; t3--) this.placed = y.from(e49.node(t3).copy(this.placed));
  }
  get depth() {
    return this.frontier.length - 1;
  }
  fit() {
    for (; this.unplaced.size; ) {
      let e50 = this.findFittable();
      e50 ? this.placeNodes(e50) : this.openMore() || this.dropNode();
    }
    let e49 = this.mustMoveInline(), t2 = this.placed.size - this.depth - this.$from.depth, n2 = this.$from, r2 = this.close(e49 < 0 ? this.$to : n2.doc.resolve(e49));
    if (!r2) return null;
    let i2 = this.placed, a2 = n2.depth, o2 = r2.depth;
    for (; a2 && o2 && i2.childCount == 1; ) i2 = i2.firstChild.content, a2--, o2--;
    let s2 = new T(i2, a2, o2);
    return e49 > -1 ? new O(n2.pos, e49, this.$to.pos, this.$to.end(), s2, t2) : s2.size || n2.pos != this.$to.pos ? new Mt(n2.pos, r2.pos, s2) : null;
  }
  findFittable() {
    let e49 = this.unplaced.openStart;
    for (let t2 = this.unplaced.content, n2 = 0, r2 = this.unplaced.openEnd; n2 < e49; n2++) {
      let i2 = t2.firstChild;
      if (t2.childCount > 1 && (r2 = 0), i2.type.spec.isolating && r2 <= n2) {
        e49 = n2;
        break;
      }
      t2 = i2.content;
    }
    for (let t2 = 1; t2 <= 2; t2++) for (let n2 = t2 == 1 ? e49 : this.unplaced.openStart; n2 >= 0; n2--) {
      let e50, r2 = null;
      n2 ? (r2 = dn(this.unplaced.content, n2 - 1).firstChild, e50 = r2.content) : e50 = this.unplaced.content;
      let i2 = e50.firstChild;
      for (let e51 = this.depth; e51 >= 0; e51--) {
        let { type: a2, match: o2 } = this.frontier[e51], s2, c2 = null;
        if (t2 == 1 && (i2 ? o2.matchType(i2.type) || (c2 = o2.fillBefore(y.from(i2), !1)) : r2 && a2.compatibleContent(r2.type))) return { sliceDepth: n2, frontierDepth: e51, parent: r2, inject: c2 };
        if (t2 == 2 && i2 && (s2 = o2.findWrapping(i2.type))) return { sliceDepth: n2, frontierDepth: e51, parent: r2, wrap: s2 };
        if (r2 && o2.matchType(r2.type)) break;
      }
    }
  }
  openMore() {
    let { content: e49, openStart: t2, openEnd: n2 } = this.unplaced, r2 = dn(e49, t2);
    return !r2.childCount || r2.firstChild.isLeaf ? !1 : (this.unplaced = new T(e49, t2 + 1, Math.max(n2, r2.size + t2 >= e49.size - n2 ? t2 + 1 : 0)), !0);
  }
  dropNode() {
    let { content: e49, openStart: t2, openEnd: n2 } = this.unplaced, r2 = dn(e49, t2);
    if (r2.childCount <= 1 && t2 > 0) {
      let i2 = e49.size - t2 <= t2 + r2.size;
      this.unplaced = new T(ln(e49, t2 - 1, 1), t2 - 1, i2 ? t2 - 1 : n2);
    } else this.unplaced = new T(ln(e49, t2, 1), t2, n2);
  }
  placeNodes({ sliceDepth: e49, frontierDepth: t2, parent: n2, inject: r2, wrap: i2 }) {
    for (; this.depth > t2; ) this.closeFrontierNode();
    if (i2) for (let e50 = 0; e50 < i2.length; e50++) this.openFrontierNode(i2[e50]);
    let a2 = this.unplaced, o2 = n2 ? n2.content : a2.content, s2 = a2.openStart - e49, c2 = 0, l2 = [], { match: u2, type: d2 } = this.frontier[t2];
    if (r2) {
      for (let e50 = 0; e50 < r2.childCount; e50++) l2.push(r2.child(e50));
      u2 = u2.matchFragment(r2);
    }
    let f2 = o2.size + e49 - (a2.content.size - a2.openEnd);
    for (; c2 < o2.childCount; ) {
      let e50 = o2.child(c2), t3 = u2.matchType(e50.type);
      if (!t3) break;
      c2++, (c2 > 1 || s2 == 0 || e50.content.size) && (u2 = t3, l2.push(fn(e50.mark(d2.allowedMarks(e50.marks)), c2 == 1 ? s2 : 0, c2 == o2.childCount ? f2 : -1)));
    }
    let p2 = c2 == o2.childCount;
    p2 || (f2 = -1), this.placed = un(this.placed, t2, y.from(l2)), this.frontier[t2].match = u2, p2 && f2 < 0 && n2 && n2.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
    for (let e50 = 0, t3 = o2; e50 < f2; e50++) {
      let e51 = t3.lastChild;
      this.frontier.push({ type: e51.type, match: e51.contentMatchAt(e51.childCount) }), t3 = e51.content;
    }
    this.unplaced = p2 ? e49 == 0 ? T.empty : new T(ln(a2.content, e49 - 1, 1), e49 - 1, f2 < 0 ? a2.openEnd : e49 - 1) : new T(ln(a2.content, e49, c2), a2.openStart, a2.openEnd);
  }
  mustMoveInline() {
    if (!this.$to.parent.isTextblock) return -1;
    let e49 = this.frontier[this.depth], t2;
    if (!e49.type.isTextblock || !pn(this.$to, this.$to.depth, e49.type, e49.match, !1) || this.$to.depth == this.depth && (t2 = this.findCloseLevel(this.$to)) && t2.depth == this.depth) return -1;
    let { depth: n2 } = this.$to, r2 = this.$to.after(n2);
    for (; n2 > 1 && r2 == this.$to.end(--n2); ) ++r2;
    return r2;
  }
  findCloseLevel(e49) {
    scan: for (let t2 = Math.min(this.depth, e49.depth); t2 >= 0; t2--) {
      let { match: n2, type: r2 } = this.frontier[t2], i2 = t2 < e49.depth && e49.end(t2 + 1) == e49.pos + (e49.depth - (t2 + 1)), a2 = pn(e49, t2, r2, n2, i2);
      if (a2) {
        for (let n3 = t2 - 1; n3 >= 0; n3--) {
          let { match: t3, type: r3 } = this.frontier[n3], i3 = pn(e49, n3, r3, t3, !0);
          if (!i3 || i3.childCount) continue scan;
        }
        return { depth: t2, fit: a2, move: i2 ? e49.doc.resolve(e49.after(t2 + 1)) : e49 };
      }
    }
  }
  close(e49) {
    let t2 = this.findCloseLevel(e49);
    if (!t2) return null;
    for (; this.depth > t2.depth; ) this.closeFrontierNode();
    t2.fit.childCount && (this.placed = un(this.placed, t2.depth, t2.fit)), e49 = t2.move;
    for (let n2 = t2.depth + 1; n2 <= e49.depth; n2++) {
      let t3 = e49.node(n2), r2 = t3.type.contentMatch.fillBefore(t3.content, !0, e49.index(n2));
      this.openFrontierNode(t3.type, t3.attrs, r2);
    }
    return e49;
  }
  openFrontierNode(e49, t2 = null, n2) {
    let r2 = this.frontier[this.depth];
    r2.match = r2.match.matchType(e49), this.placed = un(this.placed, this.depth, y.from(e49.create(t2, n2))), this.frontier.push({ type: e49, match: e49.contentMatch });
  }
  closeFrontierNode() {
    let e49 = this.frontier.pop().match.fillBefore(y.empty, !0);
    e49.childCount && (this.placed = un(this.placed, this.frontier.length, e49));
  }
};
function ln(e49, t2, n2) {
  return t2 == 0 ? e49.cutByIndex(n2, e49.childCount) : e49.replaceChild(0, e49.firstChild.copy(ln(e49.firstChild.content, t2 - 1, n2)));
}
function un(e49, t2, n2) {
  return t2 == 0 ? e49.append(n2) : e49.replaceChild(e49.childCount - 1, e49.lastChild.copy(un(e49.lastChild.content, t2 - 1, n2)));
}
function dn(e49, t2) {
  for (let n2 = 0; n2 < t2; n2++) e49 = e49.firstChild.content;
  return e49;
}
function fn(e49, t2, n2) {
  if (t2 <= 0) return e49;
  let r2 = e49.content;
  return t2 > 1 && (r2 = r2.replaceChild(0, fn(r2.firstChild, t2 - 1, r2.childCount == 1 ? n2 - 1 : 0))), t2 > 0 && (r2 = e49.type.contentMatch.fillBefore(r2).append(r2), n2 <= 0 && (r2 = r2.append(e49.type.contentMatch.matchFragment(r2).fillBefore(y.empty, !0)))), e49.copy(r2);
}
function pn(e49, t2, n2, r2, i2) {
  let a2 = e49.node(t2), o2 = i2 ? e49.indexAfter(t2) : e49.index(t2);
  if (o2 == a2.childCount && !n2.compatibleContent(a2.type)) return null;
  let s2 = r2.fillBefore(a2.content, !0, o2);
  return s2 && !mn(n2, a2.content, o2) ? s2 : null;
}
function mn(e49, t2, n2) {
  for (let r2 = n2; r2 < t2.childCount; r2++) if (!e49.allowsMarks(t2.child(r2).marks)) return !0;
  return !1;
}
function hn(e49) {
  return e49.spec.defining || e49.spec.definingForContent;
}
function gn(e49, t2, n2, r2) {
  if (!r2.size) return e49.deleteRange(t2, n2);
  let i2 = e49.doc.resolve(t2), a2 = e49.doc.resolve(n2);
  if (sn(i2, a2, r2)) return e49.step(new Mt(t2, n2, r2));
  let o2 = bn(i2, a2);
  o2[o2.length - 1] == 0 && o2.pop();
  let s2 = -(i2.depth + 1);
  o2.unshift(s2);
  for (let e50 = i2.depth, t3 = i2.pos - 1; e50 > 0; e50--, t3--) {
    let n3 = i2.node(e50).type.spec;
    if (n3.defining || n3.definingAsContext || n3.isolating) break;
    o2.indexOf(e50) > -1 ? s2 = e50 : i2.before(e50) == t3 && o2.splice(1, 0, -e50);
  }
  let c2 = o2.indexOf(s2), l2 = [], u2 = r2.openStart;
  for (let e50 = r2.content, t3 = 0; ; t3++) {
    let n3 = e50.firstChild;
    if (l2.push(n3), t3 == r2.openStart) break;
    e50 = n3.content;
  }
  for (let e50 = u2 - 1; e50 >= 0; e50--) {
    let t3 = l2[e50], n3 = hn(t3.type);
    if (n3 && !t3.sameMarkup(i2.node(Math.abs(s2) - 1))) u2 = e50;
    else if (n3 || !t3.type.isTextblock) break;
  }
  for (let t3 = r2.openStart; t3 >= 0; t3--) {
    let s3 = (t3 + u2 + 1) % (r2.openStart + 1), d3 = l2[s3];
    if (d3) for (let t4 = 0; t4 < o2.length; t4++) {
      let l3 = o2[(t4 + c2) % o2.length], u3 = !0;
      l3 < 0 && (u3 = !1, l3 = -l3);
      let f2 = i2.node(l3 - 1), p2 = i2.index(l3 - 1);
      if (f2.canReplaceWith(p2, p2, d3.type, d3.marks)) return e49.replace(i2.before(l3), u3 ? a2.after(l3) : n2, new T(_n(r2.content, 0, r2.openStart, s3), s3, r2.openEnd));
    }
  }
  let d2 = e49.steps.length;
  for (let s3 = o2.length - 1; s3 >= 0 && (e49.replace(t2, n2, r2), !(e49.steps.length > d2)); s3--) {
    let e50 = o2[s3];
    e50 < 0 || (t2 = i2.before(e50), n2 = a2.after(e50));
  }
}
function _n(e49, t2, n2, r2, i2) {
  if (t2 < n2) {
    let i3 = e49.firstChild;
    e49 = e49.replaceChild(0, i3.copy(_n(i3.content, t2 + 1, n2, r2, i3)));
  }
  if (t2 > r2) {
    let t3 = i2.contentMatchAt(0), n3 = t3.fillBefore(e49).append(e49);
    e49 = n3.append(t3.matchFragment(n3).fillBefore(y.empty, !0));
  }
  return e49;
}
function vn(e49, t2, n2, r2) {
  if (!r2.isInline && t2 == n2 && e49.doc.resolve(t2).parent.content.size) {
    let i2 = rn(e49.doc, t2, r2.type);
    i2 != null && (t2 = n2 = i2);
  }
  e49.replaceRange(t2, n2, new T(y.from(r2), 0, 0));
}
function yn(e49, t2, n2) {
  let r2 = e49.doc.resolve(t2), i2 = e49.doc.resolve(n2);
  if (r2.parent.isTextblock && i2.parent.isTextblock && r2.start() != i2.start() && r2.parentOffset == 0 && i2.parentOffset == 0) {
    let a3 = r2.sharedDepth(n2), o2 = !1;
    for (let e50 = r2.depth; e50 > a3; e50--) r2.node(e50).type.spec.isolating && (o2 = !0);
    for (let e50 = i2.depth; e50 > a3; e50--) i2.node(e50).type.spec.isolating && (o2 = !0);
    if (!o2) {
      for (let e50 = r2.depth; e50 > 0 && t2 == r2.start(e50); e50--) t2 = r2.before(e50);
      for (let e50 = i2.depth; e50 > 0 && n2 == i2.start(e50); e50--) n2 = i2.before(e50);
      r2 = e49.doc.resolve(t2), i2 = e49.doc.resolve(n2);
    }
  }
  let a2 = bn(r2, i2);
  for (let t3 = 0; t3 < a2.length; t3++) {
    let n3 = a2[t3], o2 = t3 == a2.length - 1;
    if (o2 && n3 == 0 || r2.node(n3).type.contentMatch.validEnd) return e49.delete(r2.start(n3), i2.end(n3));
    if (n3 > 0 && (o2 || r2.node(n3 - 1).canReplace(r2.index(n3 - 1), i2.indexAfter(n3 - 1)))) return e49.delete(r2.before(n3), i2.after(n3));
  }
  for (let a3 = 1; a3 <= r2.depth && a3 <= i2.depth; a3++) if (t2 - r2.start(a3) == r2.depth - a3 && n2 > r2.end(a3) && i2.end(a3) - n2 != i2.depth - a3 && r2.start(a3 - 1) == i2.start(a3 - 1) && r2.node(a3 - 1).canReplace(r2.index(a3 - 1), i2.index(a3 - 1))) return e49.delete(r2.before(a3), n2);
  e49.delete(t2, n2);
}
function bn(e49, t2) {
  let n2 = [], r2 = Math.min(e49.depth, t2.depth);
  for (let i2 = r2; i2 >= 0; i2--) {
    let r3 = e49.start(i2);
    if (r3 < e49.pos - (e49.depth - i2) || t2.end(i2) > t2.pos + (t2.depth - i2) || e49.node(i2).type.spec.isolating || t2.node(i2).type.spec.isolating) break;
    (r3 == t2.start(i2) || i2 == e49.depth && i2 == t2.depth && e49.parent.inlineContent && t2.parent.inlineContent && i2 && t2.start(i2 - 1) == r3 - 1) && n2.push(i2);
  }
  return n2;
}
var xn = class e22 extends E {
  constructor(e49, t2, n2) {
    super(), this.pos = e49, this.attr = t2, this.value = n2;
  }
  apply(e49) {
    let t2 = e49.nodeAt(this.pos);
    if (!t2) return D.fail("No node at attribute step's position");
    let n2 = /* @__PURE__ */ Object.create(null);
    for (let e50 in t2.attrs) n2[e50] = t2.attrs[e50];
    n2[this.attr] = this.value;
    let r2 = t2.type.create(n2, null, t2.marks);
    return D.fromReplace(e49, this.pos, this.pos + 1, new T(y.from(r2), 0, +!t2.isLeaf));
  }
  getMap() {
    return wt.empty;
  }
  invert(t2) {
    return new e22(this.pos, this.attr, t2.nodeAt(this.pos).attrs[this.attr]);
  }
  map(t2) {
    let n2 = t2.mapResult(this.pos, 1);
    return n2.deletedAfter ? null : new e22(n2.pos, this.attr, this.value);
  }
  toJSON() {
    return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.pos != "number" || typeof n2.attr != "string") throw RangeError("Invalid input for AttrStep.fromJSON");
    return new e22(n2.pos, n2.attr, n2.value);
  }
};
E.jsonID("attr", xn);
var Sn = class e23 extends E {
  constructor(e49, t2) {
    super(), this.attr = e49, this.value = t2;
  }
  apply(e49) {
    let t2 = /* @__PURE__ */ Object.create(null);
    for (let n3 in e49.attrs) t2[n3] = e49.attrs[n3];
    t2[this.attr] = this.value;
    let n2 = e49.type.create(t2, e49.content, e49.marks);
    return D.ok(n2);
  }
  getMap() {
    return wt.empty;
  }
  invert(t2) {
    return new e23(this.attr, t2.attrs[this.attr]);
  }
  map(e49) {
    return this;
  }
  toJSON() {
    return { stepType: "docAttr", attr: this.attr, value: this.value };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.attr != "string") throw RangeError("Invalid input for DocAttrStep.fromJSON");
    return new e23(n2.attr, n2.value);
  }
};
E.jsonID("docAttr", Sn);
var Cn = class extends Error {
};
(Cn = function e24(t2) {
  let n2 = Error.call(this, t2);
  return n2.__proto__ = e24.prototype, n2;
});
(Cn.prototype = Object.create(Error.prototype));
(Cn.prototype.constructor = Cn);
(Cn.prototype.name = "TransformError");
var wn = class {
  constructor(e49) {
    this.doc = e49, this.steps = [], this.docs = [], this.mapping = new Tt();
  }
  get before() {
    return this.docs.length ? this.docs[0] : this.doc;
  }
  step(e49) {
    let t2 = this.maybeStep(e49);
    if (t2.failed) throw new Cn(t2.failed);
    return this;
  }
  maybeStep(e49) {
    let t2 = e49.apply(this.doc);
    return t2.failed || this.addStep(e49, t2.doc), t2;
  }
  get docChanged() {
    return this.steps.length > 0;
  }
  changedRange() {
    let e49 = 1e9, t2 = -1e9;
    for (let n2 = 0; n2 < this.mapping.maps.length; n2++) {
      let r2 = this.mapping.maps[n2];
      n2 && (e49 = r2.map(e49, 1), t2 = r2.map(t2, -1)), r2.forEach((n3, r3, i2, a2) => {
        e49 = Math.min(e49, i2), t2 = Math.max(t2, a2);
      });
    }
    return e49 == 1e9 ? null : { from: e49, to: t2 };
  }
  addStep(e49, t2) {
    this.docs.push(this.doc), this.steps.push(e49), this.mapping.appendMap(e49.getMap()), this.doc = t2;
  }
  replace(e49, t2 = e49, n2 = T.empty) {
    let r2 = on(this.doc, e49, t2, n2);
    return r2 && this.step(r2), this;
  }
  replaceWith(e49, t2, n2) {
    return this.replace(e49, t2, new T(y.from(n2), 0, 0));
  }
  delete(e49, t2) {
    return this.replace(e49, t2, T.empty);
  }
  insert(e49, t2) {
    return this.replaceWith(e49, e49, t2);
  }
  replaceRange(e49, t2, n2) {
    return gn(this, e49, t2, n2), this;
  }
  replaceRangeWith(e49, t2, n2) {
    return vn(this, e49, t2, n2), this;
  }
  deleteRange(e49, t2) {
    return yn(this, e49, t2), this;
  }
  lift(e49, t2) {
    return zt(this, e49, t2), this;
  }
  join(e49, t2 = 1) {
    return nn(this, e49, t2), this;
  }
  wrap(e49, t2) {
    return Wt(this, e49, t2), this;
  }
  setBlockType(e49, t2 = e49, n2, r2 = null) {
    return Gt(this, e49, t2, n2, r2), this;
  }
  setNodeMarkup(e49, t2, n2 = null, r2) {
    return Yt(this, e49, t2, n2, r2), this;
  }
  setNodeAttribute(e49, t2, n2) {
    return this.step(new xn(e49, t2, n2)), this;
  }
  setDocAttribute(e49, t2) {
    return this.step(new Sn(e49, t2)), this;
  }
  addNodeMark(e49, t2) {
    return this.step(new At(e49, t2)), this;
  }
  removeNodeMark(e49, t2) {
    let n2 = this.doc.nodeAt(e49);
    if (!n2) throw RangeError("No node at position " + e49);
    if (t2 instanceof C) t2.isInSet(n2.marks) && this.step(new jt(e49, t2));
    else {
      let r2 = n2.marks, i2, a2 = [];
      for (; i2 = t2.isInSet(r2); ) a2.push(new jt(e49, i2)), r2 = i2.removeFromSet(r2);
      for (let e50 = a2.length - 1; e50 >= 0; e50--) this.step(a2[e50]);
    }
    return this;
  }
  split(e49, t2 = 1, n2) {
    return Zt(this, e49, t2, n2), this;
  }
  addMark(e49, t2, n2) {
    return Pt(this, e49, t2, n2), this;
  }
  removeMark(e49, t2, n2) {
    return Ft(this, e49, t2, n2), this;
  }
  clearIncompatible(e49, t2, n2) {
    return It(this, e49, t2, n2), this;
  }
};
var Tn = /* @__PURE__ */ Object.create(null);
var k = class {
  constructor(e49, t2, n2) {
    this.$anchor = e49, this.$head = t2, this.ranges = n2 || [new En(e49.min(t2), e49.max(t2))];
  }
  get anchor() {
    return this.$anchor.pos;
  }
  get head() {
    return this.$head.pos;
  }
  get from() {
    return this.$from.pos;
  }
  get to() {
    return this.$to.pos;
  }
  get $from() {
    return this.ranges[0].$from;
  }
  get $to() {
    return this.ranges[0].$to;
  }
  get empty() {
    let e49 = this.ranges;
    for (let t2 = 0; t2 < e49.length; t2++) if (e49[t2].$from.pos != e49[t2].$to.pos) return !1;
    return !0;
  }
  content() {
    return this.$from.doc.slice(this.from, this.to, !0);
  }
  replace(e49, t2 = T.empty) {
    let n2 = t2.content.lastChild, r2 = null;
    for (let e50 = 0; e50 < t2.openEnd; e50++) r2 = n2, n2 = n2.lastChild;
    let i2 = e49.steps.length, a2 = this.ranges;
    for (let o2 = 0; o2 < a2.length; o2++) {
      let { $from: s2, $to: c2 } = a2[o2], l2 = e49.mapping.slice(i2);
      e49.replaceRange(l2.map(s2.pos), l2.map(c2.pos), o2 ? T.empty : t2), o2 == 0 && Pn(e49, i2, (n2 ? n2.isInline : r2 && r2.isTextblock) ? -1 : 1);
    }
  }
  replaceWith(e49, t2) {
    let n2 = e49.steps.length, r2 = this.ranges;
    for (let i2 = 0; i2 < r2.length; i2++) {
      let { $from: a2, $to: o2 } = r2[i2], s2 = e49.mapping.slice(n2), c2 = s2.map(a2.pos), l2 = s2.map(o2.pos);
      i2 ? e49.deleteRange(c2, l2) : (e49.replaceRangeWith(c2, l2, t2), Pn(e49, n2, t2.isInline ? -1 : 1));
    }
  }
  static findFrom(e49, t2, n2 = !1) {
    let r2 = e49.parent.inlineContent ? new A(e49) : Nn(e49.node(0), e49.parent, e49.pos, e49.index(), t2, n2);
    if (r2) return r2;
    for (let r3 = e49.depth - 1; r3 >= 0; r3--) {
      let i2 = t2 < 0 ? Nn(e49.node(0), e49.node(r3), e49.before(r3 + 1), e49.index(r3), t2, n2) : Nn(e49.node(0), e49.node(r3), e49.after(r3 + 1), e49.index(r3) + 1, t2, n2);
      if (i2) return i2;
    }
    return null;
  }
  static near(e49, t2 = 1) {
    return this.findFrom(e49, t2) || this.findFrom(e49, -t2) || new jn(e49.node(0));
  }
  static atStart(e49) {
    return Nn(e49, e49, 0, 0, 1) || new jn(e49);
  }
  static atEnd(e49) {
    return Nn(e49, e49, e49.content.size, e49.childCount, -1) || new jn(e49);
  }
  static fromJSON(e49, t2) {
    if (!t2 || !t2.type) throw RangeError("Invalid input for Selection.fromJSON");
    let n2 = Tn[t2.type];
    if (!n2) throw RangeError(`No selection type ${t2.type} defined`);
    return n2.fromJSON(e49, t2);
  }
  static jsonID(e49, t2) {
    if (e49 in Tn) throw RangeError("Duplicate use of selection JSON ID " + e49);
    return Tn[e49] = t2, t2.prototype.jsonID = e49, t2;
  }
  getBookmark() {
    return A.between(this.$anchor, this.$head).getBookmark();
  }
};
k.prototype.visible = !0;
var En = class {
  constructor(e49, t2) {
    this.$from = e49, this.$to = t2;
  }
};
var Dn = !1;
function On(e49) {
  !Dn && !e49.parent.inlineContent && (Dn = !0, console.warn("TextSelection endpoint not pointing into a node with inline content (" + e49.parent.type.name + ")"));
}
var A = class e25 extends k {
  constructor(e49, t2 = e49) {
    On(e49), On(t2), super(e49, t2);
  }
  get $cursor() {
    return this.$anchor.pos == this.$head.pos ? this.$head : null;
  }
  map(t2, n2) {
    let r2 = t2.resolve(n2.map(this.head));
    if (!r2.parent.inlineContent) return k.near(r2);
    let i2 = t2.resolve(n2.map(this.anchor));
    return new e25(i2.parent.inlineContent ? i2 : r2, r2);
  }
  replace(e49, t2 = T.empty) {
    if (super.replace(e49, t2), t2 == T.empty) {
      let t3 = this.$from.marksAcross(this.$to);
      t3 && e49.ensureMarks(t3);
    }
  }
  eq(t2) {
    return t2 instanceof e25 && t2.anchor == this.anchor && t2.head == this.head;
  }
  getBookmark() {
    return new kn(this.anchor, this.head);
  }
  toJSON() {
    return { type: "text", anchor: this.anchor, head: this.head };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.anchor != "number" || typeof n2.head != "number") throw RangeError("Invalid input for TextSelection.fromJSON");
    return new e25(t2.resolve(n2.anchor), t2.resolve(n2.head));
  }
  static create(e49, t2, n2 = t2) {
    let r2 = e49.resolve(t2);
    return new this(r2, n2 == t2 ? r2 : e49.resolve(n2));
  }
  static between(t2, n2, r2) {
    let i2 = t2.pos - n2.pos;
    if ((!r2 || i2) && (r2 = i2 >= 0 ? 1 : -1), !n2.parent.inlineContent) {
      let e49 = k.findFrom(n2, r2, !0) || k.findFrom(n2, -r2, !0);
      if (e49) n2 = e49.$head;
      else return k.near(n2, r2);
    }
    return t2.parent.inlineContent || (i2 == 0 ? t2 = n2 : (t2 = (k.findFrom(t2, -r2, !0) || k.findFrom(t2, r2, !0)).$anchor, t2.pos < n2.pos != i2 < 0 && (t2 = n2))), new e25(t2, n2);
  }
};
k.jsonID("text", A);
var kn = class e26 {
  constructor(e49, t2) {
    this.anchor = e49, this.head = t2;
  }
  map(t2) {
    return new e26(t2.map(this.anchor), t2.map(this.head));
  }
  resolve(e49) {
    return A.between(e49.resolve(this.anchor), e49.resolve(this.head));
  }
};
var j = class e27 extends k {
  constructor(e49) {
    let t2 = e49.nodeAfter, n2 = e49.node(0).resolve(e49.pos + t2.nodeSize);
    super(e49, n2), this.node = t2;
  }
  map(t2, n2) {
    let { deleted: r2, pos: i2 } = n2.mapResult(this.anchor), a2 = t2.resolve(i2);
    return r2 ? k.near(a2) : new e27(a2);
  }
  content() {
    return new T(y.from(this.node), 0, 0);
  }
  eq(t2) {
    return t2 instanceof e27 && t2.anchor == this.anchor;
  }
  toJSON() {
    return { type: "node", anchor: this.anchor };
  }
  getBookmark() {
    return new An(this.anchor);
  }
  static fromJSON(t2, n2) {
    if (typeof n2.anchor != "number") throw RangeError("Invalid input for NodeSelection.fromJSON");
    return new e27(t2.resolve(n2.anchor));
  }
  static create(t2, n2) {
    return new e27(t2.resolve(n2));
  }
  static isSelectable(e49) {
    return !e49.isText && e49.type.spec.selectable !== !1;
  }
};
(j.prototype.visible = !1);
(k.jsonID("node", j));
var An = class e28 {
  constructor(e49) {
    this.anchor = e49;
  }
  map(t2) {
    let { deleted: n2, pos: r2 } = t2.mapResult(this.anchor);
    return n2 ? new kn(r2, r2) : new e28(r2);
  }
  resolve(e49) {
    let t2 = e49.resolve(this.anchor), n2 = t2.nodeAfter;
    return n2 && j.isSelectable(n2) ? new j(t2) : k.near(t2);
  }
};
var jn = class e29 extends k {
  constructor(e49) {
    super(e49.resolve(0), e49.resolve(e49.content.size));
  }
  replace(e49, t2 = T.empty) {
    if (t2 == T.empty) {
      e49.delete(0, e49.doc.content.size);
      let t3 = k.atStart(e49.doc);
      t3.eq(e49.selection) || e49.setSelection(t3);
    } else super.replace(e49, t2);
  }
  toJSON() {
    return { type: "all" };
  }
  static fromJSON(t2) {
    return new e29(t2);
  }
  map(t2) {
    return new e29(t2);
  }
  eq(t2) {
    return t2 instanceof e29;
  }
  getBookmark() {
    return Mn;
  }
};
k.jsonID("all", jn);
var Mn = { map() {
  return this;
}, resolve(e49) {
  return new jn(e49);
} };
function Nn(e49, t2, n2, r2, i2, a2 = !1) {
  if (t2.inlineContent) return A.create(e49, n2);
  for (let o2 = r2 - (i2 > 0 ? 0 : 1); i2 > 0 ? o2 < t2.childCount : o2 >= 0; o2 += i2) {
    let r3 = t2.child(o2);
    if (r3.isAtom) {
      if (!a2 && j.isSelectable(r3)) return j.create(e49, n2 - (i2 < 0 ? r3.nodeSize : 0));
    } else {
      let t3 = Nn(e49, r3, n2 + i2, i2 < 0 ? r3.childCount : 0, i2, a2);
      if (t3) return t3;
    }
    n2 += r3.nodeSize * i2;
  }
  return null;
}
function Pn(e49, t2, n2) {
  let r2 = e49.steps.length - 1;
  if (r2 < t2) return;
  let i2 = e49.steps[r2];
  if (!(i2 instanceof Mt || i2 instanceof O)) return;
  let a2 = e49.mapping.maps[r2], o2;
  a2.forEach((e50, t3, n3, r3) => {
    o2 ??= r3;
  }), e49.setSelection(k.near(e49.doc.resolve(o2), n2));
}
var Fn = 1;
var In = 2;
var Ln = 4;
var Rn = class extends wn {
  constructor(e49) {
    super(e49.doc), this.curSelectionFor = 0, this.updated = 0, this.meta = /* @__PURE__ */ Object.create(null), this.time = Date.now(), this.curSelection = e49.selection, this.storedMarks = e49.storedMarks;
  }
  get selection() {
    return this.curSelectionFor < this.steps.length && (this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor)), this.curSelectionFor = this.steps.length), this.curSelection;
  }
  setSelection(e49) {
    if (e49.$from.doc != this.doc) throw RangeError("Selection passed to setSelection must point at the current document");
    return this.curSelection = e49, this.curSelectionFor = this.steps.length, this.updated = (this.updated | Fn) & -3, this.storedMarks = null, this;
  }
  get selectionSet() {
    return (this.updated & Fn) > 0;
  }
  setStoredMarks(e49) {
    return this.storedMarks = e49, this.updated |= In, this;
  }
  ensureMarks(e49) {
    return C.sameSet(this.storedMarks || this.selection.$from.marks(), e49) || this.setStoredMarks(e49), this;
  }
  addStoredMark(e49) {
    return this.ensureMarks(e49.addToSet(this.storedMarks || this.selection.$head.marks()));
  }
  removeStoredMark(e49) {
    return this.ensureMarks(e49.removeFromSet(this.storedMarks || this.selection.$head.marks()));
  }
  get storedMarksSet() {
    return (this.updated & In) > 0;
  }
  addStep(e49, t2) {
    super.addStep(e49, t2), this.updated &= -3, this.storedMarks = null;
  }
  setTime(e49) {
    return this.time = e49, this;
  }
  replaceSelection(e49) {
    return this.selection.replace(this, e49), this;
  }
  replaceSelectionWith(e49, t2 = !0) {
    let n2 = this.selection;
    return t2 && (e49 = e49.mark(this.storedMarks || (n2.empty ? n2.$from.marks() : n2.$from.marksAcross(n2.$to) || C.none))), n2.replaceWith(this, e49), this;
  }
  deleteSelection() {
    return this.selection.replace(this), this;
  }
  insertText(e49, t2, n2) {
    let r2 = this.doc.type.schema;
    if (t2 == null) return e49 ? this.replaceSelectionWith(r2.text(e49), !0) : this.deleteSelection();
    {
      if (n2 ??= t2, !e49) return this.deleteRange(t2, n2);
      let i2 = this.storedMarks;
      if (!i2) {
        let e50 = this.doc.resolve(t2);
        i2 = n2 == t2 ? e50.marks() : e50.marksAcross(this.doc.resolve(n2));
      }
      return this.replaceRangeWith(t2, n2, r2.text(e49, i2)), !this.selection.empty && this.selection.to == t2 + e49.length && this.setSelection(k.near(this.selection.$to)), this;
    }
  }
  setMeta(e49, t2) {
    return this.meta[typeof e49 == "string" ? e49 : e49.key] = t2, this;
  }
  getMeta(e49) {
    return this.meta[typeof e49 == "string" ? e49 : e49.key];
  }
  get isGeneric() {
    for (let e49 in this.meta) return !1;
    return !0;
  }
  scrollIntoView() {
    return this.updated |= Ln, this;
  }
  get scrolledIntoView() {
    return (this.updated & Ln) > 0;
  }
};
function zn(e49, t2) {
  return !t2 || !e49 ? e49 : e49.bind(t2);
}
var Bn = class {
  constructor(e49, t2, n2) {
    this.name = e49, this.init = zn(t2.init, n2), this.apply = zn(t2.apply, n2);
  }
};
var Vn = [new Bn("doc", { init(e49) {
  return e49.doc || e49.schema.topNodeType.createAndFill();
}, apply(e49) {
  return e49.doc;
} }), new Bn("selection", { init(e49, t2) {
  return e49.selection || k.atStart(t2.doc);
}, apply(e49) {
  return e49.selection;
} }), new Bn("storedMarks", { init(e49) {
  return e49.storedMarks || null;
}, apply(e49, t2, n2, r2) {
  return r2.selection.$cursor ? e49.storedMarks : null;
} }), new Bn("scrollToSelection", { init() {
  return 0;
}, apply(e49, t2) {
  return e49.scrolledIntoView ? t2 + 1 : t2;
} })];
var Hn = class {
  constructor(e49, t2) {
    this.schema = e49, this.plugins = [], this.pluginsByKey = /* @__PURE__ */ Object.create(null), this.fields = Vn.slice(), t2 && t2.forEach((e50) => {
      if (this.pluginsByKey[e50.key]) throw RangeError("Adding different instances of a keyed plugin (" + e50.key + ")");
      this.plugins.push(e50), this.pluginsByKey[e50.key] = e50, e50.spec.state && this.fields.push(new Bn(e50.key, e50.spec.state, e50));
    });
  }
};
var Un = class e30 {
  constructor(e49) {
    this.config = e49;
  }
  get schema() {
    return this.config.schema;
  }
  get plugins() {
    return this.config.plugins;
  }
  apply(e49) {
    return this.applyTransaction(e49).state;
  }
  filterTransaction(e49, t2 = -1) {
    for (let n2 = 0; n2 < this.config.plugins.length; n2++) if (n2 != t2) {
      let t3 = this.config.plugins[n2];
      if (t3.spec.filterTransaction && !t3.spec.filterTransaction.call(t3, e49, this)) return !1;
    }
    return !0;
  }
  applyTransaction(e49) {
    if (!this.filterTransaction(e49)) return { state: this, transactions: [] };
    let t2 = [e49], n2 = this.applyInner(e49), r2 = null;
    for (; ; ) {
      let i2 = !1;
      for (let a2 = 0; a2 < this.config.plugins.length; a2++) {
        let o2 = this.config.plugins[a2];
        if (o2.spec.appendTransaction) {
          let s2 = r2 ? r2[a2].n : 0, c2 = r2 ? r2[a2].state : this, l2 = s2 < t2.length && o2.spec.appendTransaction.call(o2, s2 ? t2.slice(s2) : t2, c2, n2);
          if (l2 && n2.filterTransaction(l2, a2)) {
            if (l2.setMeta("appendedTransaction", e49), !r2) {
              r2 = [];
              for (let e50 = 0; e50 < this.config.plugins.length; e50++) r2.push(e50 < a2 ? { state: n2, n: t2.length } : { state: this, n: 0 });
            }
            t2.push(l2), n2 = n2.applyInner(l2), i2 = !0;
          }
          r2 && (r2[a2] = { state: n2, n: t2.length });
        }
      }
      if (!i2) return { state: n2, transactions: t2 };
    }
  }
  applyInner(t2) {
    if (!t2.before.eq(this.doc)) throw RangeError("Applying a mismatched transaction");
    let n2 = new e30(this.config), r2 = this.config.fields;
    for (let e49 = 0; e49 < r2.length; e49++) {
      let i2 = r2[e49];
      n2[i2.name] = i2.apply(t2, this[i2.name], this, n2);
    }
    return n2;
  }
  get tr() {
    return new Rn(this);
  }
  static create(t2) {
    let n2 = new Hn(t2.doc ? t2.doc.type.schema : t2.schema, t2.plugins), r2 = new e30(n2);
    for (let e49 = 0; e49 < n2.fields.length; e49++) r2[n2.fields[e49].name] = n2.fields[e49].init(t2, r2);
    return r2;
  }
  reconfigure(t2) {
    let n2 = new Hn(this.schema, t2.plugins), r2 = n2.fields, i2 = new e30(n2);
    for (let e49 = 0; e49 < r2.length; e49++) {
      let n3 = r2[e49].name;
      i2[n3] = this.hasOwnProperty(n3) ? this[n3] : r2[e49].init(t2, i2);
    }
    return i2;
  }
  toJSON(e49) {
    let t2 = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
    if (this.storedMarks && (t2.storedMarks = this.storedMarks.map((e50) => e50.toJSON())), e49 && typeof e49 == "object") for (let n2 in e49) {
      if (n2 == "doc" || n2 == "selection") throw RangeError("The JSON fields `doc` and `selection` are reserved");
      let r2 = e49[n2], i2 = r2.spec.state;
      i2 && i2.toJSON && (t2[n2] = i2.toJSON.call(r2, this[r2.key]));
    }
    return t2;
  }
  static fromJSON(t2, n2, r2) {
    if (!n2) throw RangeError("Invalid input for EditorState.fromJSON");
    if (!t2.schema) throw RangeError("Required config field 'schema' missing");
    let i2 = new Hn(t2.schema, t2.plugins), a2 = new e30(i2);
    return i2.fields.forEach((e49) => {
      if (e49.name == "doc") a2.doc = ve.fromJSON(t2.schema, n2.doc);
      else if (e49.name == "selection") a2.selection = k.fromJSON(a2.doc, n2.selection);
      else if (e49.name == "storedMarks") n2.storedMarks && (a2.storedMarks = n2.storedMarks.map(t2.schema.markFromJSON));
      else {
        if (r2) for (let i3 in r2) {
          let o2 = r2[i3], s2 = o2.spec.state;
          if (o2.key == e49.name && s2 && s2.fromJSON && Object.prototype.hasOwnProperty.call(n2, i3)) {
            a2[e49.name] = s2.fromJSON.call(o2, t2, n2[i3], a2);
            return;
          }
        }
        a2[e49.name] = e49.init(t2, a2);
      }
    }), a2;
  }
};
function Wn(e49, t2, n2) {
  for (let r2 in e49) {
    let i2 = e49[r2];
    i2 instanceof Function ? i2 = i2.bind(t2) : r2 == "handleDOMEvents" && (i2 = Wn(i2, t2, {})), n2[r2] = i2;
  }
  return n2;
}
var M = class {
  constructor(e49) {
    this.spec = e49, this.props = {}, e49.props && Wn(e49.props, this, this.props), this.key = e49.key ? e49.key.key : Kn("plugin");
  }
  getState(e49) {
    return e49[this.key];
  }
};
var Gn = /* @__PURE__ */ Object.create(null);
function Kn(e49) {
  return e49 in Gn ? e49 + "$" + ++Gn[e49] : (Gn[e49] = 0, e49 + "$");
}
var N = class {
  constructor(e49 = "key") {
    this.key = Kn(e49);
  }
  get(e49) {
    return e49.config.pluginsByKey[this.key];
  }
  getState(e49) {
    return e49[this.key];
  }
};
function Jn(e49, t2) {
  let { $cursor: n2 } = e49.selection;
  return !n2 || (t2 ? !t2.endOfTextblock("backward", e49) : n2.parentOffset > 0) ? null : n2;
}
var Yn = (e49, t2, n2) => {
  let r2 = Jn(e49, n2);
  if (!r2) return !1;
  let i2 = tr(r2);
  if (!i2) {
    let n3 = r2.blockRange(), i3 = n3 && Rt(n3);
    return i3 != null && (t2 && t2(e49.tr.lift(n3, i3).scrollIntoView()), !0);
  }
  let a2 = i2.nodeBefore;
  if (yr(e49, i2, t2, -1)) return !0;
  if (r2.parent.content.size == 0 && ($n(a2, "end") || j.isSelectable(a2))) for (let n3 = r2.depth; ; n3--) {
    let o2 = on(e49.doc, r2.before(n3), r2.after(n3), T.empty);
    if (o2 && o2.slice.size < o2.to - o2.from) {
      if (t2) {
        let n4 = e49.tr.step(o2);
        n4.setSelection($n(a2, "end") ? k.findFrom(n4.doc.resolve(n4.mapping.map(i2.pos, -1)), -1) : j.create(n4.doc, i2.pos - a2.nodeSize)), t2(n4.scrollIntoView());
      }
      return !0;
    }
    if (n3 == 1 || r2.node(n3 - 1).childCount > 1) break;
  }
  return a2.isAtom && i2.depth == r2.depth - 1 ? (t2 && t2(e49.tr.delete(i2.pos - a2.nodeSize, i2.pos).scrollIntoView()), !0) : !1;
};
var Xn = (e49, t2, n2) => {
  let r2 = Jn(e49, n2);
  if (!r2) return !1;
  let i2 = tr(r2);
  return i2 ? Qn(e49, i2, t2) : !1;
};
var Zn = (e49, t2, n2) => {
  let r2 = nr(e49, n2);
  if (!r2) return !1;
  let i2 = ar(r2);
  return i2 ? Qn(e49, i2, t2) : !1;
};
function Qn(e49, t2, n2) {
  let r2 = t2.nodeBefore, i2 = t2.pos - 1;
  for (; !r2.isTextblock; i2--) {
    if (r2.type.spec.isolating) return !1;
    let e50 = r2.lastChild;
    if (!e50) return !1;
    r2 = e50;
  }
  let a2 = t2.nodeAfter, o2 = t2.pos + 1;
  for (; !a2.isTextblock; o2++) {
    if (a2.type.spec.isolating) return !1;
    let e50 = a2.firstChild;
    if (!e50) return !1;
    a2 = e50;
  }
  let s2 = on(e49.doc, i2, o2, T.empty);
  if (!s2 || s2.from != i2 || s2 instanceof Mt && s2.slice.size >= o2 - i2) return !1;
  if (n2) {
    let t3 = e49.tr.step(s2);
    t3.setSelection(A.create(t3.doc, i2)), n2(t3.scrollIntoView());
  }
  return !0;
}
function $n(e49, t2, n2 = !1) {
  for (let r2 = e49; r2; r2 = t2 == "start" ? r2.firstChild : r2.lastChild) {
    if (r2.isTextblock) return !0;
    if (n2 && r2.childCount != 1) return !1;
  }
  return !1;
}
var er = (e49, t2, n2) => {
  let { $head: r2, empty: i2 } = e49.selection, a2 = r2;
  if (!i2) return !1;
  if (r2.parent.isTextblock) {
    if (n2 ? !n2.endOfTextblock("backward", e49) : r2.parentOffset > 0) return !1;
    a2 = tr(r2);
  }
  let o2 = a2 && a2.nodeBefore;
  return !o2 || !j.isSelectable(o2) ? !1 : (t2 && t2(e49.tr.setSelection(j.create(e49.doc, a2.pos - o2.nodeSize)).scrollIntoView()), !0);
};
function tr(e49) {
  if (!e49.parent.type.spec.isolating) for (let t2 = e49.depth - 1; t2 >= 0; t2--) {
    if (e49.index(t2) > 0) return e49.doc.resolve(e49.before(t2 + 1));
    if (e49.node(t2).type.spec.isolating) break;
  }
  return null;
}
function nr(e49, t2) {
  let { $cursor: n2 } = e49.selection;
  return !n2 || (t2 ? !t2.endOfTextblock("forward", e49) : n2.parentOffset < n2.parent.content.size) ? null : n2;
}
var rr = (e49, t2, n2) => {
  let r2 = nr(e49, n2);
  if (!r2) return !1;
  let i2 = ar(r2);
  if (!i2) return !1;
  let a2 = i2.nodeAfter;
  if (yr(e49, i2, t2, 1)) return !0;
  if (r2.parent.content.size == 0 && ($n(a2, "start") || j.isSelectable(a2))) {
    let n3 = on(e49.doc, r2.before(), r2.after(), T.empty);
    if (n3 && n3.slice.size < n3.to - n3.from) {
      if (t2) {
        let r3 = e49.tr.step(n3);
        r3.setSelection($n(a2, "start") ? k.findFrom(r3.doc.resolve(r3.mapping.map(i2.pos)), 1) : j.create(r3.doc, r3.mapping.map(i2.pos))), t2(r3.scrollIntoView());
      }
      return !0;
    }
  }
  return a2.isAtom && i2.depth == r2.depth - 1 ? (t2 && t2(e49.tr.delete(i2.pos, i2.pos + a2.nodeSize).scrollIntoView()), !0) : !1;
};
var ir = (e49, t2, n2) => {
  let { $head: r2, empty: i2 } = e49.selection, a2 = r2;
  if (!i2) return !1;
  if (r2.parent.isTextblock) {
    if (n2 ? !n2.endOfTextblock("forward", e49) : r2.parentOffset < r2.parent.content.size) return !1;
    a2 = ar(r2);
  }
  let o2 = a2 && a2.nodeAfter;
  return !o2 || !j.isSelectable(o2) ? !1 : (t2 && t2(e49.tr.setSelection(j.create(e49.doc, a2.pos)).scrollIntoView()), !0);
};
function ar(e49) {
  if (!e49.parent.type.spec.isolating) for (let t2 = e49.depth - 1; t2 >= 0; t2--) {
    let n2 = e49.node(t2);
    if (e49.index(t2) + 1 < n2.childCount) return e49.doc.resolve(e49.after(t2 + 1));
    if (n2.type.spec.isolating) break;
  }
  return null;
}
var or = (e49, t2) => {
  let n2 = e49.selection, r2 = n2 instanceof j, i2;
  if (r2) {
    if (n2.node.isTextblock || !Qt(e49.doc, n2.from)) return !1;
    i2 = n2.from;
  } else if (i2 = tn(e49.doc, n2.from, -1), i2 == null) return !1;
  if (t2) {
    let n3 = e49.tr.join(i2);
    r2 && n3.setSelection(j.create(n3.doc, i2 - e49.doc.resolve(i2).nodeBefore.nodeSize)), t2(n3.scrollIntoView());
  }
  return !0;
};
var sr = (e49, t2) => {
  let n2 = e49.selection, r2;
  if (n2 instanceof j) {
    if (n2.node.isTextblock || !Qt(e49.doc, n2.to)) return !1;
    r2 = n2.to;
  } else if (r2 = tn(e49.doc, n2.to, 1), r2 == null) return !1;
  return t2 && t2(e49.tr.join(r2).scrollIntoView()), !0;
};
var cr = (e49, t2) => {
  let { $from: n2, $to: r2 } = e49.selection, i2 = n2.blockRange(r2), a2 = i2 && Rt(i2);
  return a2 != null && (t2 && t2(e49.tr.lift(i2, a2).scrollIntoView()), !0);
};
var lr = (e49, t2) => {
  let { $head: n2, $anchor: r2 } = e49.selection;
  return !n2.parent.type.spec.code || !n2.sameParent(r2) ? !1 : (t2 && t2(e49.tr.insertText(`
`).scrollIntoView()), !0);
};
function ur(e49) {
  for (let t2 = 0; t2 < e49.edgeCount; t2++) {
    let { type: n2 } = e49.edge(t2);
    if (n2.isTextblock && !n2.hasRequiredAttrs()) return n2;
  }
  return null;
}
var dr = (e49, t2) => {
  let { $head: n2, $anchor: r2 } = e49.selection;
  if (!n2.parent.type.spec.code || !n2.sameParent(r2)) return !1;
  let i2 = n2.node(-1), a2 = n2.indexAfter(-1), o2 = ur(i2.contentMatchAt(a2));
  if (!o2 || !i2.canReplaceWith(a2, a2, o2)) return !1;
  if (t2) {
    let r3 = n2.after(), i3 = e49.tr.replaceWith(r3, r3, o2.createAndFill());
    i3.setSelection(k.near(i3.doc.resolve(r3), 1)), t2(i3.scrollIntoView());
  }
  return !0;
};
var fr = (e49, t2) => {
  let n2 = e49.selection, { $from: r2, $to: i2 } = n2;
  if (n2 instanceof jn || r2.parent.inlineContent || i2.parent.inlineContent) return !1;
  let a2 = ur(i2.parent.contentMatchAt(i2.indexAfter()));
  if (!a2 || !a2.isTextblock) return !1;
  if (t2) {
    let n3 = (!r2.parentOffset && i2.index() < i2.parent.childCount ? r2 : i2).pos, o2 = e49.tr.insert(n3, a2.createAndFill());
    o2.setSelection(A.create(o2.doc, n3 + 1)), t2(o2.scrollIntoView());
  }
  return !0;
};
var pr = (e49, t2) => {
  let { $cursor: n2 } = e49.selection;
  if (!n2 || n2.parent.content.size) return !1;
  if (n2.depth > 1 && n2.after() != n2.end(-1)) {
    let r3 = n2.before();
    if (Xt(e49.doc, r3)) return t2 && t2(e49.tr.split(r3).scrollIntoView()), !0;
  }
  let r2 = n2.blockRange(), i2 = r2 && Rt(r2);
  return i2 != null && (t2 && t2(e49.tr.lift(r2, i2).scrollIntoView()), !0);
};
var gr = (e49, t2) => {
  let { $from: n2, to: r2 } = e49.selection, i2, a2 = n2.sharedDepth(r2);
  return a2 != 0 && (i2 = n2.before(a2), t2 && t2(e49.tr.setSelection(j.create(e49.doc, i2))), !0);
};
function vr(e49, t2, n2) {
  let r2 = t2.nodeBefore, i2 = t2.nodeAfter, a2 = t2.index();
  return !r2 || !i2 || !r2.type.compatibleContent(i2.type) ? !1 : !r2.content.size && t2.parent.canReplace(a2 - 1, a2) ? (n2 && n2(e49.tr.delete(t2.pos - r2.nodeSize, t2.pos).scrollIntoView()), !0) : !t2.parent.canReplace(a2, a2 + 1) || !(i2.isTextblock || Qt(e49.doc, t2.pos)) ? !1 : (n2 && n2(e49.tr.join(t2.pos).scrollIntoView()), !0);
}
function yr(e49, t2, n2, r2) {
  let i2 = t2.nodeBefore, a2 = t2.nodeAfter, o2, s2, c2 = i2.type.spec.isolating || a2.type.spec.isolating;
  if (!c2 && vr(e49, t2, n2)) return !0;
  let l2 = !c2 && t2.parent.canReplace(t2.index(), t2.index() + 1);
  if (l2 && (o2 = (s2 = i2.contentMatchAt(i2.childCount)).findWrapping(a2.type)) && s2.matchType(o2[0] || a2.type).validEnd) {
    if (n2) {
      let r3 = t2.pos + a2.nodeSize, s3 = y.empty;
      for (let e50 = o2.length - 1; e50 >= 0; e50--) s3 = y.from(o2[e50].create(null, s3));
      s3 = y.from(i2.copy(s3));
      let c3 = e49.tr.step(new O(t2.pos - 1, r3, t2.pos, r3, new T(s3, 1, 0), o2.length, !0)), l3 = c3.doc.resolve(r3 + 2 * o2.length);
      l3.nodeAfter && l3.nodeAfter.type == i2.type && Qt(c3.doc, l3.pos) && c3.join(l3.pos), n2(c3.scrollIntoView());
    }
    return !0;
  }
  let u2 = a2.type.spec.isolating || r2 > 0 && c2 ? null : k.findFrom(t2, 1), d2 = u2 && u2.$from.blockRange(u2.$to), f2 = d2 && Rt(d2);
  if (f2 != null && f2 >= t2.depth) return n2 && n2(e49.tr.lift(d2, f2).scrollIntoView()), !0;
  if (l2 && $n(a2, "start", !0) && $n(i2, "end")) {
    let r3 = i2, o3 = [];
    for (; o3.push(r3), !r3.isTextblock; ) r3 = r3.lastChild;
    let s3 = a2, c3 = 1;
    for (; !s3.isTextblock; s3 = s3.firstChild) c3++;
    if (r3.canReplace(r3.childCount, r3.childCount, s3.content)) {
      if (n2) {
        let r4 = y.empty;
        for (let e50 = o3.length - 1; e50 >= 0; e50--) r4 = y.from(o3[e50].copy(r4));
        n2(e49.tr.step(new O(t2.pos - o3.length, t2.pos + a2.nodeSize, t2.pos + c3, t2.pos + a2.nodeSize - c3, new T(r4, o3.length, 0), 0, !0)).scrollIntoView());
      }
      return !0;
    }
  }
  return !1;
}
function br(e49) {
  return function(t2, n2) {
    let r2 = t2.selection, i2 = e49 < 0 ? r2.$from : r2.$to, a2 = i2.depth;
    for (; i2.node(a2).isInline; ) {
      if (!a2) return !1;
      a2--;
    }
    return i2.node(a2).isTextblock ? (n2 && n2(t2.tr.setSelection(A.create(t2.doc, e49 < 0 ? i2.start(a2) : i2.end(a2)))), !0) : !1;
  };
}
var xr = br(-1);
var Sr = br(1);
function Cr(e49, t2 = null) {
  return function(n2, r2) {
    let { $from: i2, $to: a2 } = n2.selection, o2 = i2.blockRange(a2), s2 = o2 && Bt(o2, e49, t2);
    return s2 ? (r2 && r2(n2.tr.wrap(o2, s2).scrollIntoView()), !0) : !1;
  };
}
function wr(e49, t2 = null) {
  return function(n2, r2) {
    let i2 = !1;
    for (let r3 = 0; r3 < n2.selection.ranges.length && !i2; r3++) {
      let { $from: { pos: a2 }, $to: { pos: o2 } } = n2.selection.ranges[r3];
      n2.doc.nodesBetween(a2, o2, (r4, a3) => {
        if (i2) return !1;
        if (r4.isTextblock && !r4.hasMarkup(e49, t2))
          if (r4.type == e49) i2 = !0;
          else {
            let t3 = n2.doc.resolve(a3), r5 = t3.index();
            i2 = t3.parent.canReplaceWith(r5, r5 + 1, e49);
          }
      });
    }
    if (!i2) return !1;
    if (r2) {
      let i3 = n2.tr;
      for (let r3 = 0; r3 < n2.selection.ranges.length; r3++) {
        let { $from: { pos: a2 }, $to: { pos: o2 } } = n2.selection.ranges[r3];
        i3.setBlockType(a2, o2, e49, t2);
      }
      r2(i3.scrollIntoView());
    }
    return !0;
  };
}
function Ar(e49, t2 = null) {
  return function(n2, r2) {
    let { $from: i2, $to: a2 } = n2.selection, o2 = i2.blockRange(a2);
    if (!o2) return !1;
    let s2 = r2 ? n2.tr : null;
    return jr(s2, o2, e49, t2) ? (r2 && r2(s2.scrollIntoView()), !0) : !1;
  };
}
function jr(e49, t2, n2, r2 = null) {
  let i2 = !1, a2 = t2, o2 = t2.$from.doc;
  if (t2.depth >= 2 && t2.$from.node(t2.depth - 1).type.compatibleContent(n2) && t2.startIndex == 0) {
    if (t2.$from.index(t2.depth - 1) == 0) return !1;
    let e50 = o2.resolve(t2.start - 2);
    a2 = new ge(e50, e50, t2.depth), t2.endIndex < t2.parent.childCount && (t2 = new ge(t2.$from, o2.resolve(t2.$to.end(t2.depth)), t2.depth)), i2 = !0;
  }
  let s2 = Bt(a2, n2, r2, t2);
  return s2 ? (e49 && Mr(e49, t2, s2, i2, n2), !0) : !1;
}
function Mr(e49, t2, n2, r2, i2) {
  let a2 = y.empty;
  for (let e50 = n2.length - 1; e50 >= 0; e50--) a2 = y.from(n2[e50].type.create(n2[e50].attrs, a2));
  e49.step(new O(t2.start - (r2 ? 2 : 0), t2.end, t2.start, t2.end, new T(a2, 0, 0), n2.length, !0));
  let o2 = 0;
  for (let e50 = 0; e50 < n2.length; e50++) n2[e50].type == i2 && (o2 = e50 + 1);
  let s2 = n2.length - o2, c2 = t2.start + n2.length - (r2 ? 2 : 0), l2 = t2.parent;
  for (let n3 = t2.startIndex, r3 = t2.endIndex, i3 = !0; n3 < r3; n3++, i3 = !1) !i3 && Xt(e49.doc, c2, s2) && (e49.split(c2, s2), c2 += 2 * s2), c2 += l2.child(n3).nodeSize;
  return e49;
}
function Nr(e49) {
  return function(t2, n2) {
    let { $from: r2, $to: i2 } = t2.selection, a2 = r2.blockRange(i2, (t3) => t3.childCount > 0 && t3.firstChild.type == e49);
    return a2 ? n2 ? r2.node(a2.depth - 1).type == e49 ? Pr(t2, n2, e49, a2) : Fr(t2, n2, a2) : !0 : !1;
  };
}
function Pr(e49, t2, n2, r2) {
  let i2 = e49.tr, a2 = r2.end, o2 = r2.$to.end(r2.depth);
  a2 < o2 && (i2.step(new O(a2 - 1, o2, a2, o2, new T(y.from(n2.create(null, r2.parent.copy())), 1, 0), 1, !0)), r2 = new ge(i2.doc.resolve(r2.$from.pos), i2.doc.resolve(o2), r2.depth));
  let s2 = Rt(r2);
  if (s2 == null) return !1;
  i2.lift(r2, s2);
  let c2 = i2.doc.resolve(i2.mapping.map(a2, -1) - 1);
  return Qt(i2.doc, c2.pos) && c2.nodeBefore.type == c2.nodeAfter.type && i2.join(c2.pos), t2(i2.scrollIntoView()), !0;
}
function Fr(e49, t2, n2) {
  let r2 = e49.tr, i2 = n2.parent;
  for (let e50 = n2.end, t3 = n2.endIndex - 1, a3 = n2.startIndex; t3 > a3; t3--) e50 -= i2.child(t3).nodeSize, r2.delete(e50 - 1, e50 + 1);
  let a2 = r2.doc.resolve(n2.start), o2 = a2.nodeAfter;
  if (r2.mapping.map(n2.end) != n2.start + a2.nodeAfter.nodeSize) return !1;
  let s2 = n2.startIndex == 0, c2 = n2.endIndex == i2.childCount, l2 = a2.node(-1), u2 = a2.index(-1);
  if (!l2.canReplace(u2 + +!s2, u2 + 1, o2.content.append(c2 ? y.empty : y.from(i2)))) return !1;
  let d2 = a2.pos, f2 = d2 + o2.nodeSize;
  return r2.step(new O(d2 - +!!s2, f2 + +!!c2, d2 + 1, f2 - 1, new T((s2 ? y.empty : y.from(i2.copy(y.empty))).append(c2 ? y.empty : y.from(i2.copy(y.empty))), +!s2, +!c2), +!s2)), t2(r2.scrollIntoView()), !0;
}
function Ir(e49) {
  return function(t2, n2) {
    let { $from: r2, $to: i2 } = t2.selection, a2 = r2.blockRange(i2, (t3) => t3.childCount > 0 && t3.firstChild.type == e49);
    if (!a2) return !1;
    let o2 = a2.startIndex;
    if (o2 == 0) return !1;
    let s2 = a2.parent, c2 = s2.child(o2 - 1);
    if (c2.type != e49) return !1;
    if (n2) {
      let r3 = c2.lastChild && c2.lastChild.type == s2.type, i3 = y.from(r3 ? e49.create() : null), o3 = new T(y.from(e49.create(null, y.from(s2.type.create(null, i3)))), r3 ? 3 : 1, 0), l2 = a2.start, u2 = a2.end;
      n2(t2.tr.step(new O(l2 - (r3 ? 3 : 1), u2, l2, u2, o3, 1, !0)).scrollIntoView());
    }
    return !0;
  };
}
var P = function(e49) {
  for (var t2 = 0; ; t2++) if (e49 = e49.previousSibling, !e49) return t2;
};
var Lr = function(e49) {
  let t2 = e49.assignedSlot || e49.parentNode;
  return t2 && t2.nodeType == 11 ? t2.host : t2;
};
var Rr = null;
var zr = function(e49, t2, n2) {
  let r2 = Rr ||= document.createRange();
  return r2.setEnd(e49, n2 ?? e49.nodeValue.length), r2.setStart(e49, t2 || 0), r2;
};
var Br = function() {
  Rr = null;
};
var Vr = function(e49, t2, n2, r2) {
  return n2 && (Ur(e49, t2, n2, r2, -1) || Ur(e49, t2, n2, r2, 1));
};
var Hr = /^(img|br|input|textarea|hr)$/i;
function Ur(e49, t2, n2, r2, i2) {
  for (; ; ) {
    if (e49 == n2 && t2 == r2) return !0;
    if (t2 == (i2 < 0 ? 0 : Wr(e49))) {
      let n3 = e49.parentNode;
      if (!n3 || n3.nodeType != 1 || Jr(e49) || Hr.test(e49.nodeName) || e49.contentEditable == "false") return !1;
      t2 = P(e49) + (i2 < 0 ? 0 : 1), e49 = n3;
    } else if (e49.nodeType == 1) {
      let n3 = e49.childNodes[t2 + (i2 < 0 ? -1 : 0)];
      if (n3.nodeType == 1 && n3.contentEditable == "false")
        if (n3.pmViewDesc?.ignoreForSelection) t2 += i2;
        else return !1;
      else e49 = n3, t2 = i2 < 0 ? Wr(e49) : 0;
    } else return !1;
  }
}
function Wr(e49) {
  return e49.nodeType == 3 ? e49.nodeValue.length : e49.childNodes.length;
}
function Gr(e49, t2) {
  for (; ; ) {
    if (e49.nodeType == 3 && t2) return e49;
    if (e49.nodeType == 1 && t2 > 0) {
      if (e49.contentEditable == "false") return null;
      e49 = e49.childNodes[t2 - 1], t2 = Wr(e49);
    } else if (e49.parentNode && !Jr(e49)) t2 = P(e49), e49 = e49.parentNode;
    else return null;
  }
}
function Kr(e49, t2) {
  for (; ; ) {
    if (e49.nodeType == 3 && t2 < e49.nodeValue.length) return e49;
    if (e49.nodeType == 1 && t2 < e49.childNodes.length) {
      if (e49.contentEditable == "false") return null;
      e49 = e49.childNodes[t2], t2 = 0;
    } else if (e49.parentNode && !Jr(e49)) t2 = P(e49) + 1, e49 = e49.parentNode;
    else return null;
  }
}
function qr(e49, t2, n2) {
  for (let r2 = t2 == 0, i2 = t2 == Wr(e49); r2 || i2; ) {
    if (e49 == n2) return !0;
    let t3 = P(e49);
    if (e49 = e49.parentNode, !e49) return !1;
    r2 &&= t3 == 0, i2 &&= t3 == Wr(e49);
  }
}
function Jr(e49) {
  let t2;
  for (let n2 = e49; n2 && !(t2 = n2.pmViewDesc); n2 = n2.parentNode) ;
  return t2 && t2.node && t2.node.isBlock && (t2.dom == e49 || t2.contentDOM == e49);
}
var Yr = function(e49) {
  return e49.focusNode && Vr(e49.focusNode, e49.focusOffset, e49.anchorNode, e49.anchorOffset);
};
function Xr(e49, t2) {
  let n2 = document.createEvent("Event");
  return n2.initEvent("keydown", !0, !0), n2.keyCode = e49, n2.key = n2.code = t2, n2;
}
function Zr(e49) {
  let t2 = e49.activeElement;
  for (; t2 && t2.shadowRoot; ) t2 = t2.shadowRoot.activeElement;
  return t2;
}
function Qr(e49, t2, n2) {
  if (e49.caretPositionFromPoint) try {
    let r2 = e49.caretPositionFromPoint(t2, n2);
    if (r2) return { node: r2.offsetNode, offset: Math.min(Wr(r2.offsetNode), r2.offset) };
  } catch {
  }
  if (e49.caretRangeFromPoint) {
    let r2 = e49.caretRangeFromPoint(t2, n2);
    if (r2) return { node: r2.startContainer, offset: Math.min(Wr(r2.startContainer), r2.startOffset) };
  }
}
var $r = typeof navigator < "u" ? navigator : null;
var ei = typeof document < "u" ? document : null;
var ti = $r && $r.userAgent || "";
var ni = /Edge\/(\d+)/.exec(ti);
var ri = /MSIE \d/.exec(ti);
var ii = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(ti);
var F = !!(ri || ii || ni);
var ai = ri ? document.documentMode : ii ? +ii[1] : ni ? +ni[1] : 0;
var oi = !F && /gecko\/(\d+)/i.test(ti);
oi && +(/Firefox\/(\d+)/.exec(ti) || [0, 0])[1];
var si = !F && /Chrome\/(\d+)/.exec(ti);
var I = !!si;
var ci = si ? +si[1] : 0;
var L = !F && !!$r && /Apple Computer/.test($r.vendor);
var li = L && (/Mobile\/\w+/.test(ti) || !!$r && $r.maxTouchPoints > 2);
var ui = li || ($r ? /Mac/.test($r.platform) : !1);
var di = $r ? /Win/.test($r.platform) : !1;
var fi = /Android \d/.test(ti);
var pi = !!ei && "webkitFontSmoothing" in ei.documentElement.style;
var mi = pi ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function hi(e49) {
  let t2 = e49.defaultView && e49.defaultView.visualViewport;
  return t2 ? { left: 0, right: t2.width, top: 0, bottom: t2.height } : { left: 0, right: e49.documentElement.clientWidth, top: 0, bottom: e49.documentElement.clientHeight };
}
function gi(e49, t2) {
  return typeof e49 == "number" ? e49 : e49[t2];
}
function _i(e49) {
  let t2 = e49.getBoundingClientRect(), n2 = t2.width / e49.offsetWidth || 1, r2 = t2.height / e49.offsetHeight || 1;
  return { left: t2.left, right: t2.left + e49.clientWidth * n2, top: t2.top, bottom: t2.top + e49.clientHeight * r2 };
}
function vi(e49, t2, n2) {
  if (!Ni(t2) && t2.left == 0) return;
  let r2 = e49.someProp("scrollThreshold") || 0, i2 = e49.someProp("scrollMargin") || 5, a2 = e49.dom.ownerDocument;
  for (let o2 = n2 || e49.dom; o2; ) {
    if (o2.nodeType != 1) {
      o2 = Lr(o2);
      continue;
    }
    let e50 = o2, n3 = e50 == a2.body, s2 = n3 ? hi(a2) : _i(e50), c2 = 0, l2 = 0;
    if (t2.top < s2.top + gi(r2, "top") ? l2 = -(s2.top - t2.top + gi(i2, "top")) : t2.bottom > s2.bottom - gi(r2, "bottom") && (l2 = t2.bottom - t2.top > s2.bottom - s2.top ? t2.top + gi(i2, "top") - s2.top : t2.bottom - s2.bottom + gi(i2, "bottom")), t2.left < s2.left + gi(r2, "left") ? c2 = -(s2.left - t2.left + gi(i2, "left")) : t2.right > s2.right - gi(r2, "right") && (c2 = t2.right - s2.right + gi(i2, "right")), c2 || l2)
      if (n3) a2.defaultView.scrollBy(c2, l2);
      else {
        let n4 = e50.scrollLeft, r3 = e50.scrollTop;
        l2 && (e50.scrollTop += l2), c2 && (e50.scrollLeft += c2);
        let i3 = e50.scrollLeft - n4, a3 = e50.scrollTop - r3;
        t2 = { left: t2.left - i3, top: t2.top - a3, right: t2.right - i3, bottom: t2.bottom - a3 };
      }
    let u2 = n3 ? "fixed" : getComputedStyle(o2).position;
    if (/^(fixed|sticky)$/.test(u2)) break;
    o2 = u2 == "absolute" ? o2.offsetParent : Lr(o2);
  }
}
function yi(e49) {
  let t2 = e49.dom.getBoundingClientRect(), n2 = Math.max(0, t2.top), r2, i2;
  for (let a2 = (t2.left + t2.right) / 2, o2 = n2 + 1; o2 < Math.min(innerHeight, t2.bottom); o2 += 5) {
    let t3 = e49.root.elementFromPoint(a2, o2);
    if (!t3 || t3 == e49.dom || !e49.dom.contains(t3)) continue;
    let s2 = t3.getBoundingClientRect();
    if (s2.top >= n2 - 20) {
      r2 = t3, i2 = s2.top;
      break;
    }
  }
  return { refDOM: r2, refTop: i2, stack: bi(e49.dom) };
}
function bi(e49) {
  let t2 = [], n2 = e49.ownerDocument;
  for (let r2 = e49; r2 && (t2.push({ dom: r2, top: r2.scrollTop, left: r2.scrollLeft }), e49 != n2); r2 = Lr(r2)) ;
  return t2;
}
function xi({ refDOM: e49, refTop: t2, stack: n2 }) {
  let r2 = e49 ? e49.getBoundingClientRect().top : 0;
  Si(n2, r2 == 0 ? 0 : r2 - t2);
}
function Si(e49, t2) {
  for (let n2 = 0; n2 < e49.length; n2++) {
    let { dom: r2, top: i2, left: a2 } = e49[n2];
    r2.scrollTop != i2 + t2 && (r2.scrollTop = i2 + t2), r2.scrollLeft != a2 && (r2.scrollLeft = a2);
  }
}
var Ci = null;
function wi(e49) {
  if (e49.setActive) return e49.setActive();
  if (Ci) return e49.focus(Ci);
  let t2 = bi(e49);
  e49.focus(Ci == null ? { get preventScroll() {
    return Ci = { preventScroll: !0 }, !0;
  } } : void 0), Ci || (Ci = !1, Si(t2, 0));
}
function Ti(e49, t2) {
  let n2, r2 = 2e8, i2, a2 = 0, o2 = t2.top, s2 = t2.top, c2, l2;
  for (let u2 = e49.firstChild, d2 = 0; u2; u2 = u2.nextSibling, d2++) {
    let e50;
    if (u2.nodeType == 1) e50 = u2.getClientRects();
    else if (u2.nodeType == 3) e50 = zr(u2).getClientRects();
    else continue;
    for (let f2 = 0; f2 < e50.length; f2++) {
      let p2 = e50[f2];
      if (p2.top <= o2 && p2.bottom >= s2) {
        o2 = Math.max(p2.bottom, o2), s2 = Math.min(p2.top, s2);
        let e51 = p2.left > t2.left ? p2.left - t2.left : p2.right < t2.left ? t2.left - p2.right : 0;
        if (e51 < r2) {
          n2 = u2, r2 = e51, i2 = e51 && n2.nodeType == 3 ? { left: p2.right < t2.left ? p2.right : p2.left, top: t2.top } : t2, u2.nodeType == 1 && e51 && (a2 = d2 + +(t2.left >= (p2.left + p2.right) / 2));
          continue;
        }
      } else p2.top > t2.top && !c2 && p2.left <= t2.left && p2.right >= t2.left && (c2 = u2, l2 = { left: Math.max(p2.left, Math.min(p2.right, t2.left)), top: p2.top });
      !n2 && (t2.left >= p2.right && t2.top >= p2.top || t2.left >= p2.left && t2.top >= p2.bottom) && (a2 = d2 + 1);
    }
  }
  return !n2 && c2 && (n2 = c2, i2 = l2, r2 = 0), n2 && n2.nodeType == 3 ? Ei(n2, i2) : !n2 || r2 && n2.nodeType == 1 ? { node: e49, offset: a2 } : Ti(n2, i2);
}
function Ei(e49, t2) {
  let n2 = e49.nodeValue.length, r2 = document.createRange(), i2;
  for (let a2 = 0; a2 < n2; a2++) {
    r2.setEnd(e49, a2 + 1), r2.setStart(e49, a2);
    let n3 = Pi(r2, 1);
    if (n3.top != n3.bottom && Di(t2, n3)) {
      i2 = { node: e49, offset: a2 + +(t2.left >= (n3.left + n3.right) / 2) };
      break;
    }
  }
  return r2.detach(), i2 || { node: e49, offset: 0 };
}
function Di(e49, t2) {
  return e49.left >= t2.left - 1 && e49.left <= t2.right + 1 && e49.top >= t2.top - 1 && e49.top <= t2.bottom + 1;
}
function Oi(e49, t2) {
  let n2 = e49.parentNode;
  return n2 && /^li$/i.test(n2.nodeName) && t2.left < e49.getBoundingClientRect().left ? n2 : e49;
}
function ki(e49, t2, n2) {
  let { node: r2, offset: i2 } = Ti(t2, n2), a2 = -1;
  if (r2.nodeType == 1 && !r2.firstChild) {
    let e50 = r2.getBoundingClientRect();
    a2 = e50.left != e50.right && n2.left > (e50.left + e50.right) / 2 ? 1 : -1;
  }
  return e49.docView.posFromDOM(r2, i2, a2);
}
function Ai(e49, t2, n2, r2) {
  let i2 = -1;
  for (let n3 = t2, a2 = !1; n3 != e49.dom; ) {
    let t3 = e49.docView.nearestDesc(n3, !0), o2;
    if (!t3) return null;
    if (t3.dom.nodeType == 1 && (t3.node.isBlock && t3.parent || !t3.contentDOM) && ((o2 = t3.dom.getBoundingClientRect()).width || o2.height) && (t3.node.isBlock && t3.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(t3.dom.nodeName) && (!a2 && o2.left > r2.left || o2.top > r2.top ? i2 = t3.posBefore : (!a2 && o2.right < r2.left || o2.bottom < r2.top) && (i2 = t3.posAfter), a2 = !0), !t3.contentDOM && i2 < 0 && !t3.node.isText)) return (t3.node.isBlock ? r2.top < (o2.top + o2.bottom) / 2 : r2.left < (o2.left + o2.right) / 2) ? t3.posBefore : t3.posAfter;
    n3 = t3.dom.parentNode;
  }
  return i2 > -1 ? i2 : e49.docView.posFromDOM(t2, n2, -1);
}
function ji(e49, t2, n2) {
  let r2 = e49.childNodes.length;
  if (r2 && n2.top < n2.bottom) for (let i2 = Math.max(0, Math.min(r2 - 1, Math.floor(r2 * (t2.top - n2.top) / (n2.bottom - n2.top)) - 2)), a2 = i2; ; ) {
    let n3 = e49.childNodes[a2];
    if (n3.nodeType == 1) {
      let e50 = n3.getClientRects();
      for (let r3 = 0; r3 < e50.length; r3++) {
        let i3 = e50[r3];
        if (Di(t2, i3)) return ji(n3, t2, i3);
      }
    }
    if ((a2 = (a2 + 1) % r2) == i2) break;
  }
  return e49;
}
function Mi(e49, t2) {
  let n2 = e49.dom.ownerDocument, r2, i2 = 0, a2 = Qr(n2, t2.left, t2.top);
  a2 && ({ node: r2, offset: i2 } = a2);
  let o2 = (e49.root.elementFromPoint ? e49.root : n2).elementFromPoint(t2.left, t2.top), s2;
  if (!o2 || !e49.dom.contains(o2.nodeType == 1 ? o2 : o2.parentNode)) {
    let n3 = e49.dom.getBoundingClientRect();
    if (!Di(t2, n3) || (o2 = ji(e49.dom, t2, n3), !o2)) return null;
  }
  if (L) for (let e50 = o2; r2 && e50; e50 = Lr(e50)) e50.draggable && (r2 = void 0);
  if (o2 = Oi(o2, t2), r2) {
    if (oi && r2.nodeType == 1 && (i2 = Math.min(i2, r2.childNodes.length), i2 < r2.childNodes.length)) {
      let e50 = r2.childNodes[i2], n4;
      e50.nodeName == "IMG" && (n4 = e50.getBoundingClientRect()).right <= t2.left && n4.bottom > t2.top && i2++;
    }
    let n3;
    pi && i2 && r2.nodeType == 1 && (n3 = r2.childNodes[i2 - 1]).nodeType == 1 && n3.contentEditable == "false" && n3.getBoundingClientRect().top >= t2.top && i2--, r2 == e49.dom && i2 == r2.childNodes.length - 1 && r2.lastChild.nodeType == 1 && t2.top > r2.lastChild.getBoundingClientRect().bottom ? s2 = e49.state.doc.content.size : (i2 == 0 || r2.nodeType != 1 || r2.childNodes[i2 - 1].nodeName != "BR") && (s2 = Ai(e49, r2, i2, t2));
  }
  s2 ??= ki(e49, o2, t2);
  let c2 = e49.docView.nearestDesc(o2, !0);
  return { pos: s2, inside: c2 ? c2.posAtStart - c2.border : -1 };
}
function Ni(e49) {
  return e49.top < e49.bottom || e49.left < e49.right;
}
function Pi(e49, t2) {
  let n2 = e49.getClientRects();
  if (n2.length) {
    let e50 = n2[t2 < 0 ? 0 : n2.length - 1];
    if (Ni(e50)) return e50;
  }
  return Array.prototype.find.call(n2, Ni) || e49.getBoundingClientRect();
}
var Fi = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function Ii(e49, t2, n2) {
  let { node: r2, offset: i2, atom: a2 } = e49.docView.domFromPos(t2, n2 < 0 ? -1 : 1), o2 = pi || oi;
  if (r2.nodeType == 3) {
    if (o2 && (Fi.test(r2.nodeValue) || (n2 < 0 ? !i2 : i2 == r2.nodeValue.length))) {
      let e50 = Pi(zr(r2, i2, i2), n2);
      if (oi && i2 && /\s/.test(r2.nodeValue[i2 - 1]) && i2 < r2.nodeValue.length) {
        let t3 = Pi(zr(r2, i2 - 1, i2 - 1), -1);
        if (t3.top == e50.top) {
          let n3 = Pi(zr(r2, i2, i2 + 1), -1);
          if (n3.top != e50.top) return Li(n3, n3.left < t3.left);
        }
      }
      return e50;
    }
    {
      let e50 = i2, t3 = i2, a3 = n2 < 0 ? 1 : -1;
      return n2 < 0 && !i2 ? (t3++, a3 = -1) : n2 >= 0 && i2 == r2.nodeValue.length ? (e50--, a3 = 1) : n2 < 0 ? e50-- : t3++, Li(Pi(zr(r2, e50, t3), a3), a3 < 0);
    }
  }
  if (!e49.state.doc.resolve(t2 - (a2 || 0)).parent.inlineContent) {
    if (a2 == null && i2 && (n2 < 0 || i2 == Wr(r2))) {
      let e50 = r2.childNodes[i2 - 1];
      if (e50.nodeType == 1) return Ri(e50.getBoundingClientRect(), !1);
    }
    if (a2 == null && i2 < Wr(r2)) {
      let e50 = r2.childNodes[i2];
      if (e50.nodeType == 1) return Ri(e50.getBoundingClientRect(), !0);
    }
    return Ri(r2.getBoundingClientRect(), n2 >= 0);
  }
  if (a2 == null && i2 && (n2 < 0 || i2 == Wr(r2))) {
    let e50 = r2.childNodes[i2 - 1], t3 = e50.nodeType == 3 ? zr(e50, Wr(e50) - +!o2) : e50.nodeType == 1 && (e50.nodeName != "BR" || !e50.nextSibling) ? e50 : null;
    if (t3) return Li(Pi(t3, 1), !1);
  }
  if (a2 == null && i2 < Wr(r2)) {
    let e50 = r2.childNodes[i2];
    for (; e50.pmViewDesc && e50.pmViewDesc.ignoreForCoords; ) e50 = e50.nextSibling;
    let t3 = e50 ? e50.nodeType == 3 ? zr(e50, 0, +!o2) : e50.nodeType == 1 ? e50 : null : null;
    if (t3) return Li(Pi(t3, -1), !0);
  }
  return Li(Pi(r2.nodeType == 3 ? zr(r2) : r2, -n2), n2 >= 0);
}
function Li(e49, t2) {
  if (e49.width == 0) return e49;
  let n2 = t2 ? e49.left : e49.right;
  return { top: e49.top, bottom: e49.bottom, left: n2, right: n2 };
}
function Ri(e49, t2) {
  if (e49.height == 0) return e49;
  let n2 = t2 ? e49.top : e49.bottom;
  return { top: n2, bottom: n2, left: e49.left, right: e49.right };
}
function zi(e49, t2, n2) {
  let r2 = e49.state, i2 = e49.root.activeElement;
  r2 != t2 && e49.updateState(t2), i2 != e49.dom && e49.focus();
  try {
    return n2();
  } finally {
    r2 != t2 && e49.updateState(r2), i2 != e49.dom && i2 && i2.focus();
  }
}
function Bi(e49, t2, n2) {
  let r2 = t2.selection, i2 = n2 == "up" ? r2.$from : r2.$to;
  return zi(e49, t2, () => {
    let { node: t3 } = e49.docView.domFromPos(i2.pos, n2 == "up" ? -1 : 1);
    for (; ; ) {
      let n3 = e49.docView.nearestDesc(t3, !0);
      if (!n3) break;
      if (n3.node.isBlock) {
        t3 = n3.contentDOM || n3.dom;
        break;
      }
      t3 = n3.dom.parentNode;
    }
    let r3 = Ii(e49, i2.pos, 1);
    for (let e50 = t3.firstChild; e50; e50 = e50.nextSibling) {
      let t4;
      if (e50.nodeType == 1) t4 = e50.getClientRects();
      else if (e50.nodeType == 3) t4 = zr(e50, 0, e50.nodeValue.length).getClientRects();
      else continue;
      for (let e51 = 0; e51 < t4.length; e51++) {
        let i3 = t4[e51];
        if (i3.bottom > i3.top + 1 && (n2 == "up" ? r3.top - i3.top > (i3.bottom - r3.top) * 2 : i3.bottom - r3.bottom > (r3.bottom - i3.top) * 2)) return !1;
      }
    }
    return !0;
  });
}
var Vi = /[\u0590-\u08ac]/;
function Hi(e49, t2, n2) {
  let { $head: r2 } = t2.selection;
  if (!r2.parent.isTextblock) return !1;
  let i2 = r2.parentOffset, a2 = !i2, o2 = i2 == r2.parent.content.size, s2 = e49.domSelection();
  return s2 ? !Vi.test(r2.parent.textContent) || !s2.modify ? n2 == "left" || n2 == "backward" ? a2 : o2 : zi(e49, t2, () => {
    let { focusNode: t3, focusOffset: i3, anchorNode: a3, anchorOffset: o3 } = e49.domSelectionRange(), c2 = s2.caretBidiLevel;
    s2.modify("move", n2, "character");
    let l2 = r2.depth ? e49.docView.domAfterPos(r2.before()) : e49.dom, { focusNode: u2, focusOffset: d2 } = e49.domSelectionRange(), f2 = u2 && !l2.contains(u2.nodeType == 1 ? u2 : u2.parentNode) || t3 == u2 && i3 == d2;
    try {
      s2.collapse(a3, o3), t3 && (t3 != a3 || i3 != o3) && s2.extend && s2.extend(t3, i3);
    } catch {
    }
    return c2 != null && (s2.caretBidiLevel = c2), f2;
  }) : r2.pos == r2.start() || r2.pos == r2.end();
}
var Ui = null;
var Wi = null;
var Gi = !1;
function Ki(e49, t2, n2) {
  return Ui == t2 && Wi == n2 ? Gi : (Ui = t2, Wi = n2, Gi = n2 == "up" || n2 == "down" ? Bi(e49, t2, n2) : Hi(e49, t2, n2));
}
var qi = 0;
var Ji = 1;
var Yi = 2;
var Xi = 3;
var Zi = class {
  constructor(e49, t2, n2, r2) {
    this.parent = e49, this.children = t2, this.dom = n2, this.contentDOM = r2, this.dirty = qi, n2.pmViewDesc = this;
  }
  matchesWidget(e49) {
    return !1;
  }
  matchesMark(e49) {
    return !1;
  }
  matchesNode(e49, t2, n2) {
    return !1;
  }
  matchesHack(e49) {
    return !1;
  }
  parseRule() {
    return null;
  }
  stopEvent(e49) {
    return !1;
  }
  get size() {
    let e49 = 0;
    for (let t2 = 0; t2 < this.children.length; t2++) e49 += this.children[t2].size;
    return e49;
  }
  get border() {
    return 0;
  }
  destroy() {
    this.parent = void 0, this.dom.pmViewDesc == this && (this.dom.pmViewDesc = void 0);
    for (let e49 = 0; e49 < this.children.length; e49++) this.children[e49].destroy();
  }
  posBeforeChild(e49) {
    for (let t2 = 0, n2 = this.posAtStart; ; t2++) {
      let r2 = this.children[t2];
      if (r2 == e49) return n2;
      n2 += r2.size;
    }
  }
  get posBefore() {
    return this.parent.posBeforeChild(this);
  }
  get posAtStart() {
    return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
  }
  get posAfter() {
    return this.posBefore + this.size;
  }
  get posAtEnd() {
    return this.posAtStart + this.size - 2 * this.border;
  }
  localPosFromDOM(e49, t2, n2) {
    if (this.contentDOM && this.contentDOM.contains(e49.nodeType == 1 ? e49 : e49.parentNode)) {
      if (n2 < 0) {
        let n3, r3;
        if (e49 == this.contentDOM) n3 = e49.childNodes[t2 - 1];
        else {
          for (; e49.parentNode != this.contentDOM; ) e49 = e49.parentNode;
          n3 = e49.previousSibling;
        }
        for (; n3 && !((r3 = n3.pmViewDesc) && r3.parent == this); ) n3 = n3.previousSibling;
        return n3 ? this.posBeforeChild(r3) + r3.size : this.posAtStart;
      }
      {
        let n3, r3;
        if (e49 == this.contentDOM) n3 = e49.childNodes[t2];
        else {
          for (; e49.parentNode != this.contentDOM; ) e49 = e49.parentNode;
          n3 = e49.nextSibling;
        }
        for (; n3 && !((r3 = n3.pmViewDesc) && r3.parent == this); ) n3 = n3.nextSibling;
        return n3 ? this.posBeforeChild(r3) : this.posAtEnd;
      }
    }
    let r2;
    if (e49 == this.dom && this.contentDOM) r2 = t2 > P(this.contentDOM);
    else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) r2 = e49.compareDocumentPosition(this.contentDOM) & 2;
    else if (this.dom.firstChild) {
      if (t2 == 0) for (let t3 = e49; ; t3 = t3.parentNode) {
        if (t3 == this.dom) {
          r2 = !1;
          break;
        }
        if (t3.previousSibling) break;
      }
      if (r2 == null && t2 == e49.childNodes.length) for (let t3 = e49; ; t3 = t3.parentNode) {
        if (t3 == this.dom) {
          r2 = !0;
          break;
        }
        if (t3.nextSibling) break;
      }
    }
    return r2 ?? n2 > 0 ? this.posAtEnd : this.posAtStart;
  }
  nearestDesc(e49, t2 = !1) {
    for (let n2 = !0, r2 = e49; r2; r2 = r2.parentNode) {
      let i2 = this.getDesc(r2), a2;
      if (i2 && (!t2 || i2.node))
        if (n2 && (a2 = i2.nodeDOM) && !(a2.nodeType == 1 ? a2.contains(e49.nodeType == 1 ? e49 : e49.parentNode) : a2 == e49)) n2 = !1;
        else return i2;
    }
  }
  getDesc(e49) {
    let t2 = e49.pmViewDesc;
    for (let e50 = t2; e50; e50 = e50.parent) if (e50 == this) return t2;
  }
  posFromDOM(e49, t2, n2) {
    for (let r2 = e49; r2; r2 = r2.parentNode) {
      let i2 = this.getDesc(r2);
      if (i2) return i2.localPosFromDOM(e49, t2, n2);
    }
    return -1;
  }
  descAt(e49) {
    for (let t2 = 0, n2 = 0; t2 < this.children.length; t2++) {
      let r2 = this.children[t2], i2 = n2 + r2.size;
      if (n2 == e49 && i2 != n2) {
        for (; !r2.border && r2.children.length; ) for (let e50 = 0; e50 < r2.children.length; e50++) {
          let t3 = r2.children[e50];
          if (t3.size) {
            r2 = t3;
            break;
          }
        }
        return r2;
      }
      if (e49 < i2) return r2.descAt(e49 - n2 - r2.border);
      n2 = i2;
    }
  }
  domFromPos(e49, t2) {
    if (!this.contentDOM) return { node: this.dom, offset: 0, atom: e49 + 1 };
    let n2 = 0, r2 = 0;
    for (let t3 = 0; n2 < this.children.length; n2++) {
      let i2 = this.children[n2], a2 = t3 + i2.size;
      if (a2 > e49 || i2 instanceof ia) {
        r2 = e49 - t3;
        break;
      }
      t3 = a2;
    }
    if (r2) return this.children[n2].domFromPos(r2 - this.children[n2].border, t2);
    for (let e50; n2 && !(e50 = this.children[n2 - 1]).size && e50 instanceof Qi && e50.side >= 0; n2--) ;
    if (t2 <= 0) {
      let e50, r3 = !0;
      for (; e50 = n2 ? this.children[n2 - 1] : null, e50 && e50.dom.parentNode != this.contentDOM; n2--, r3 = !1) ;
      return e50 && t2 && r3 && !e50.border && !e50.domAtom ? e50.domFromPos(e50.size, t2) : { node: this.contentDOM, offset: e50 ? P(e50.dom) + 1 : 0 };
    }
    {
      let e50, r3 = !0;
      for (; e50 = n2 < this.children.length ? this.children[n2] : null, e50 && e50.dom.parentNode != this.contentDOM; n2++, r3 = !1) ;
      return e50 && r3 && !e50.border && !e50.domAtom ? e50.domFromPos(0, t2) : { node: this.contentDOM, offset: e50 ? P(e50.dom) : this.contentDOM.childNodes.length };
    }
  }
  parseRange(e49, t2, n2 = 0) {
    if (this.children.length == 0) return { node: this.contentDOM, from: e49, to: t2, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
    let r2 = -1, i2 = -1;
    for (let a2 = n2, o2 = 0; ; o2++) {
      let n3 = this.children[o2], s2 = a2 + n3.size;
      if (r2 == -1 && e49 <= s2) {
        let i3 = a2 + n3.border;
        if (e49 >= i3 && t2 <= s2 - n3.border && n3.node && n3.contentDOM && this.contentDOM.contains(n3.contentDOM)) return n3.parseRange(e49, t2, i3);
        e49 = a2;
        for (let t3 = o2; t3 > 0; t3--) {
          let n4 = this.children[t3 - 1];
          if (n4.size && n4.dom.parentNode == this.contentDOM && !n4.emptyChildAt(1)) {
            r2 = P(n4.dom) + 1;
            break;
          }
          e49 -= n4.size;
        }
        r2 == -1 && (r2 = 0);
      }
      if (r2 > -1 && (s2 > t2 || o2 == this.children.length - 1)) {
        t2 = s2;
        for (let e50 = o2 + 1; e50 < this.children.length; e50++) {
          let n4 = this.children[e50];
          if (n4.size && n4.dom.parentNode == this.contentDOM && !n4.emptyChildAt(-1)) {
            i2 = P(n4.dom);
            break;
          }
          t2 += n4.size;
        }
        i2 == -1 && (i2 = this.contentDOM.childNodes.length);
        break;
      }
      a2 = s2;
    }
    return { node: this.contentDOM, from: e49, to: t2, fromOffset: r2, toOffset: i2 };
  }
  emptyChildAt(e49) {
    if (this.border || !this.contentDOM || !this.children.length) return !1;
    let t2 = this.children[e49 < 0 ? 0 : this.children.length - 1];
    return t2.size == 0 || t2.emptyChildAt(e49);
  }
  domAfterPos(e49) {
    let { node: t2, offset: n2 } = this.domFromPos(e49, 0);
    if (t2.nodeType != 1 || n2 == t2.childNodes.length) throw RangeError("No node after pos " + e49);
    return t2.childNodes[n2];
  }
  setSelection(e49, t2, n2, r2 = !1) {
    let i2 = Math.min(e49, t2), a2 = Math.max(e49, t2);
    for (let o3 = 0, s3 = 0; o3 < this.children.length; o3++) {
      let c3 = this.children[o3], l3 = s3 + c3.size;
      if (i2 > s3 && a2 < l3) return c3.setSelection(e49 - s3 - c3.border, t2 - s3 - c3.border, n2, r2);
      s3 = l3;
    }
    let o2 = this.domFromPos(e49, e49 ? -1 : 1), s2 = t2 == e49 ? o2 : this.domFromPos(t2, t2 ? -1 : 1), c2 = n2.root.getSelection(), l2 = n2.domSelectionRange(), u2 = !1;
    if ((oi || L) && e49 == t2) {
      let { node: e50, offset: t3 } = o2;
      if (e50.nodeType == 3) {
        if (u2 = !!(t3 && e50.nodeValue[t3 - 1] == `
`), u2 && t3 == e50.nodeValue.length) for (let t4 = e50, n3; t4; t4 = t4.parentNode) {
          if (n3 = t4.nextSibling) {
            n3.nodeName == "BR" && (o2 = s2 = { node: n3.parentNode, offset: P(n3) + 1 });
            break;
          }
          let e51 = t4.pmViewDesc;
          if (e51 && e51.node && e51.node.isBlock) break;
        }
      } else {
        let n3 = e50.childNodes[t3 - 1];
        u2 = n3 && (n3.nodeName == "BR" || n3.contentEditable == "false");
      }
    }
    if (oi && l2.focusNode && l2.focusNode != s2.node && l2.focusNode.nodeType == 1) {
      let e50 = l2.focusNode.childNodes[l2.focusOffset];
      e50 && e50.contentEditable == "false" && (r2 = !0);
    }
    if (!(r2 || u2 && L) && Vr(o2.node, o2.offset, l2.anchorNode, l2.anchorOffset) && Vr(s2.node, s2.offset, l2.focusNode, l2.focusOffset)) return;
    let d2 = !1;
    if ((c2.extend || e49 == t2) && !(u2 && oi)) {
      c2.collapse(o2.node, o2.offset);
      try {
        e49 != t2 && c2.extend(s2.node, s2.offset), d2 = !0;
      } catch {
      }
    }
    if (!d2) {
      if (e49 > t2) {
        let e50 = o2;
        o2 = s2, s2 = e50;
      }
      let n3 = document.createRange();
      n3.setEnd(s2.node, s2.offset), n3.setStart(o2.node, o2.offset), c2.removeAllRanges(), c2.addRange(n3);
    }
  }
  ignoreMutation(e49) {
    return !this.contentDOM && e49.type != "selection";
  }
  get contentLost() {
    return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
  }
  markDirty(e49, t2) {
    for (let n2 = 0, r2 = 0; r2 < this.children.length; r2++) {
      let i2 = this.children[r2], a2 = n2 + i2.size;
      if (n2 == a2 ? e49 <= a2 && t2 >= n2 : e49 < a2 && t2 > n2) {
        let r3 = n2 + i2.border, o2 = a2 - i2.border;
        if (e49 >= r3 && t2 <= o2) {
          this.dirty = e49 == n2 || t2 == a2 ? Yi : Ji, e49 == r3 && t2 == o2 && (i2.contentLost || i2.dom.parentNode != this.contentDOM) ? i2.dirty = Xi : i2.markDirty(e49 - r3, t2 - r3);
          return;
        }
        i2.dirty = i2.dom == i2.contentDOM && i2.dom.parentNode == this.contentDOM && !i2.children.length ? Yi : Xi;
      }
      n2 = a2;
    }
    this.dirty = Yi;
  }
  markParentsDirty() {
    let e49 = 1;
    for (let t2 = this.parent; t2; t2 = t2.parent, e49++) {
      let n2 = e49 == 1 ? Yi : Ji;
      t2.dirty < n2 && (t2.dirty = n2);
    }
  }
  get domAtom() {
    return !1;
  }
  get ignoreForCoords() {
    return !1;
  }
  get ignoreForSelection() {
    return !1;
  }
  isText(e49) {
    return !1;
  }
};
var Qi = class extends Zi {
  constructor(e49, t2, n2, r2) {
    let i2, a2 = t2.type.toDOM;
    if (typeof a2 == "function" && (a2 = a2(n2, () => {
      if (!i2) return r2;
      if (i2.parent) return i2.parent.posBeforeChild(i2);
    })), !t2.type.spec.raw) {
      if (a2.nodeType != 1) {
        let e50 = document.createElement("span");
        e50.appendChild(a2), a2 = e50;
      }
      a2.contentEditable = "false", a2.classList.add("ProseMirror-widget");
    }
    super(e49, [], a2, null), this.widget = t2, this.widget = t2, i2 = this;
  }
  matchesWidget(e49) {
    return this.dirty == qi && e49.type.eq(this.widget.type);
  }
  parseRule() {
    return { ignore: !0 };
  }
  stopEvent(e49) {
    let t2 = this.widget.spec.stopEvent;
    return t2 ? t2(e49) : !1;
  }
  ignoreMutation(e49) {
    return e49.type != "selection" || this.widget.spec.ignoreSelection;
  }
  destroy() {
    this.widget.type.destroy(this.dom), super.destroy();
  }
  get domAtom() {
    return !0;
  }
  get ignoreForSelection() {
    return !!this.widget.type.spec.relaxedSide;
  }
  get side() {
    return this.widget.type.side;
  }
};
var $i = class extends Zi {
  constructor(e49, t2, n2, r2) {
    super(e49, [], t2, null), this.textDOM = n2, this.text = r2;
  }
  get size() {
    return this.text.length;
  }
  localPosFromDOM(e49, t2) {
    return e49 == this.textDOM ? this.posAtStart + t2 : this.posAtStart + (t2 ? this.size : 0);
  }
  domFromPos(e49) {
    return { node: this.textDOM, offset: e49 };
  }
  ignoreMutation(e49) {
    return e49.type === "characterData" && e49.target.nodeValue == e49.oldValue;
  }
};
var ea = class e31 extends Zi {
  constructor(e49, t2, n2, r2, i2) {
    super(e49, [], n2, r2), this.mark = t2, this.spec = i2;
  }
  static create(t2, n2, r2, i2) {
    let a2 = i2.nodeViews[n2.type.name], o2 = a2 && a2(n2, i2, r2);
    return o2 && o2.dom || (o2 = st.renderSpec(document, n2.type.spec.toDOM(n2, r2), null, n2.attrs)), new e31(t2, n2, o2.dom, o2.contentDOM || o2.dom, o2);
  }
  parseRule() {
    return this.dirty & Xi || this.mark.type.spec.reparseInView ? null : { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM };
  }
  matchesMark(e49) {
    return this.dirty != Xi && this.mark.eq(e49);
  }
  markDirty(e49, t2) {
    if (super.markDirty(e49, t2), this.dirty != qi) {
      let e50 = this.parent;
      for (; !e50.node; ) e50 = e50.parent;
      e50.dirty < this.dirty && (e50.dirty = this.dirty), this.dirty = qi;
    }
  }
  slice(t2, n2, r2) {
    let i2 = e31.create(this.parent, this.mark, !0, r2), a2 = this.children, o2 = this.size;
    n2 < o2 && (a2 = xa(a2, n2, o2, r2)), t2 > 0 && (a2 = xa(a2, 0, t2, r2));
    for (let e49 = 0; e49 < a2.length; e49++) a2[e49].parent = i2;
    return i2.children = a2, i2;
  }
  ignoreMutation(e49) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e49) : super.ignoreMutation(e49);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
};
var ta = class e32 extends Zi {
  constructor(e49, t2, n2, r2, i2, a2, o2) {
    super(e49, [], i2, a2), this.node = t2, this.outerDeco = n2, this.innerDeco = r2, this.nodeDOM = o2;
  }
  static create(t2, n2, r2, i2, a2, o2) {
    let s2 = a2.nodeViews[n2.type.name], c2, l2 = s2 && s2(n2, a2, () => {
      if (!c2) return o2;
      if (c2.parent) return c2.parent.posBeforeChild(c2);
    }, r2, i2), u2 = l2 && l2.dom, d2 = l2 && l2.contentDOM;
    if (n2.isText) {
      if (!u2) u2 = document.createTextNode(n2.text);
      else if (u2.nodeType != 3) throw RangeError("Text must be rendered as a DOM text node");
    } else u2 || ({ dom: u2, contentDOM: d2 } = st.renderSpec(document, n2.type.spec.toDOM(n2), null, n2.attrs));
    !d2 && !n2.isText && u2.nodeName != "BR" && (u2.hasAttribute("contenteditable") || (u2.contentEditable = "false"), n2.type.spec.draggable && (u2.draggable = !0));
    let f2 = u2;
    return u2 = fa(u2, r2, n2), l2 ? c2 = new aa(t2, n2, r2, i2, u2, d2 || null, f2, l2) : n2.isText ? new ra(t2, n2, r2, i2, u2, f2) : new e32(t2, n2, r2, i2, u2, d2 || null, f2);
  }
  parseRule() {
    if (this.node.type.spec.reparseInView) return null;
    let e49 = { node: this.node.type.name, attrs: this.node.attrs };
    if (this.node.type.whitespace == "pre" && (e49.preserveWhitespace = "full"), !this.contentDOM) e49.getContent = () => this.node.content;
    else if (!this.contentLost) e49.contentElement = this.contentDOM;
    else {
      for (let t2 = this.children.length - 1; t2 >= 0; t2--) {
        let n2 = this.children[t2];
        if (this.dom.contains(n2.dom.parentNode)) {
          e49.contentElement = n2.dom.parentNode;
          break;
        }
      }
      e49.contentElement || (e49.getContent = () => y.empty);
    }
    return e49;
  }
  matchesNode(e49, t2, n2) {
    return this.dirty == qi && e49.eq(this.node) && pa(t2, this.outerDeco) && n2.eq(this.innerDeco);
  }
  get size() {
    return this.node.nodeSize;
  }
  get border() {
    return +!this.node.isLeaf;
  }
  updateChildren(e49, t2) {
    let n2 = this.node.inlineContent, r2 = t2, i2 = e49.composing ? this.localCompositionInfo(e49, t2) : null, a2 = i2 && i2.pos > -1 ? i2 : null, o2 = i2 && i2.pos < 0, s2 = new ha(this, a2 && a2.node, e49);
    va(this.node, this.innerDeco, (t3, i3, a3) => {
      t3.spec.marks ? s2.syncToMarks(t3.spec.marks, n2, e49, i3) : t3.type.side >= 0 && !a3 && s2.syncToMarks(i3 == this.node.childCount ? C.none : this.node.child(i3).marks, n2, e49, i3), s2.placeWidget(t3, e49, r2);
    }, (t3, a3, c2, l2) => {
      s2.syncToMarks(t3.marks, n2, e49, l2);
      let u2;
      s2.findNodeMatch(t3, a3, c2, l2) || o2 && e49.state.selection.from > r2 && e49.state.selection.to < r2 + t3.nodeSize && (u2 = s2.findIndexWithChild(i2.node)) > -1 && s2.updateNodeAt(t3, a3, c2, u2, e49) || s2.updateNextNode(t3, a3, c2, e49, l2, r2) || s2.addNode(t3, a3, c2, e49, r2), r2 += t3.nodeSize;
    }), s2.syncToMarks([], n2, e49, 0), this.node.isTextblock && s2.addTextblockHacks(), s2.destroyRest(), (s2.changed || this.dirty == Yi) && (a2 && this.protectLocalComposition(e49, a2), oa(this.contentDOM, this.children, e49), li && ya(this.dom));
  }
  localCompositionInfo(e49, t2) {
    let { from: n2, to: r2 } = e49.state.selection;
    if (!(e49.state.selection instanceof A) || n2 < t2 || r2 > t2 + this.node.content.size) return null;
    let i2 = e49.input.compositionNode;
    if (!i2 || !this.dom.contains(i2.parentNode)) return null;
    if (this.node.inlineContent) {
      let e50 = i2.nodeValue, a2 = ba(this.node.content, e50, n2 - t2, r2 - t2);
      return a2 < 0 ? null : { node: i2, pos: a2, text: e50 };
    }
    return { node: i2, pos: -1, text: "" };
  }
  protectLocalComposition(e49, { node: t2, pos: n2, text: r2 }) {
    if (this.getDesc(t2)) return;
    let i2 = t2;
    for (; i2.parentNode != this.contentDOM; i2 = i2.parentNode) {
      for (; i2.previousSibling; ) i2.parentNode.removeChild(i2.previousSibling);
      for (; i2.nextSibling; ) i2.parentNode.removeChild(i2.nextSibling);
      i2.pmViewDesc && (i2.pmViewDesc = void 0);
    }
    let a2 = new $i(this, i2, t2, r2);
    e49.input.compositionNodes.push(a2), this.children = xa(this.children, n2, n2 + r2.length, e49, a2);
  }
  update(e49, t2, n2, r2) {
    return this.dirty == Xi || !e49.sameMarkup(this.node) ? !1 : (this.updateInner(e49, t2, n2, r2), !0);
  }
  updateInner(e49, t2, n2, r2) {
    this.updateOuterDeco(t2), this.node = e49, this.innerDeco = n2, this.contentDOM && this.updateChildren(r2, this.posAtStart), this.dirty = qi;
  }
  updateOuterDeco(e49) {
    if (pa(e49, this.outerDeco)) return;
    let t2 = this.nodeDOM.nodeType != 1, n2 = this.dom;
    this.dom = ua(this.dom, this.nodeDOM, la(this.outerDeco, this.node, t2), la(e49, this.node, t2)), this.dom != n2 && (n2.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e49;
  }
  selectNode() {
    this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.add("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && (this.nodeDOM.draggable = !0));
  }
  deselectNode() {
    this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.remove("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && this.nodeDOM.removeAttribute("draggable"));
  }
  get domAtom() {
    return this.node.isAtom;
  }
};
function na(e49, t2, n2, r2, i2) {
  fa(r2, t2, e49);
  let a2 = new ta(void 0, e49, t2, n2, r2, r2, r2);
  return a2.contentDOM && a2.updateChildren(i2, 0), a2;
}
var ra = class e33 extends ta {
  constructor(e49, t2, n2, r2, i2, a2) {
    super(e49, t2, n2, r2, i2, null, a2);
  }
  parseRule() {
    let e49 = this.nodeDOM.parentNode;
    for (; e49 && e49 != this.dom && !e49.pmIsDeco; ) e49 = e49.parentNode;
    return { skip: e49 || !0 };
  }
  update(e49, t2, n2, r2) {
    return this.dirty == Xi || this.dirty != qi && !this.inParent() || !e49.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(t2), (this.dirty != qi || e49.text != this.node.text) && e49.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e49.text, r2.trackWrites == this.nodeDOM && (r2.trackWrites = null)), this.node = e49, this.dirty = qi, !0);
  }
  inParent() {
    let e49 = this.parent.contentDOM;
    for (let t2 = this.nodeDOM; t2; t2 = t2.parentNode) if (t2 == e49) return !0;
    return !1;
  }
  domFromPos(e49) {
    return { node: this.nodeDOM, offset: e49 };
  }
  localPosFromDOM(e49, t2, n2) {
    return e49 == this.nodeDOM ? this.posAtStart + Math.min(t2, this.node.text.length) : super.localPosFromDOM(e49, t2, n2);
  }
  ignoreMutation(e49) {
    return e49.type != "characterData" && e49.type != "selection";
  }
  slice(t2, n2, r2) {
    let i2 = this.node.cut(t2, n2), a2 = document.createTextNode(i2.text);
    return new e33(this.parent, i2, this.outerDeco, this.innerDeco, a2, a2);
  }
  markDirty(e49, t2) {
    super.markDirty(e49, t2), this.dom != this.nodeDOM && (e49 == 0 || t2 == this.nodeDOM.nodeValue.length) && (this.dirty = Xi);
  }
  get domAtom() {
    return !1;
  }
  isText(e49) {
    return this.node.text == e49;
  }
};
var ia = class extends Zi {
  parseRule() {
    return { ignore: !0 };
  }
  matchesHack(e49) {
    return this.dirty == qi && this.dom.nodeName == e49;
  }
  get domAtom() {
    return !0;
  }
  get ignoreForCoords() {
    return this.dom.nodeName == "IMG";
  }
};
var aa = class extends ta {
  constructor(e49, t2, n2, r2, i2, a2, o2, s2) {
    super(e49, t2, n2, r2, i2, a2, o2), this.spec = s2;
  }
  update(e49, t2, n2, r2) {
    if (this.dirty == Xi) return !1;
    if (this.spec.update && (this.node.type == e49.type || this.spec.multiType)) {
      let i2 = this.spec.update(e49, t2, n2);
      return i2 && this.updateInner(e49, t2, n2, r2), i2;
    }
    return !this.contentDOM && !e49.isLeaf ? !1 : super.update(e49, t2, n2, r2);
  }
  selectNode() {
    this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
  }
  deselectNode() {
    this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
  }
  setSelection(e49, t2, n2, r2) {
    this.spec.setSelection ? this.spec.setSelection(e49, t2, n2.root) : super.setSelection(e49, t2, n2, r2);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
  stopEvent(e49) {
    return this.spec.stopEvent ? this.spec.stopEvent(e49) : !1;
  }
  ignoreMutation(e49) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e49) : super.ignoreMutation(e49);
  }
};
function oa(e49, t2, n2) {
  let r2 = e49.firstChild, i2 = !1;
  for (let a2 = 0; a2 < t2.length; a2++) {
    let o2 = t2[a2], s2 = o2.dom;
    if (s2.parentNode == e49) {
      for (; s2 != r2; ) r2 = ma(r2), i2 = !0;
      r2 = r2.nextSibling;
    } else i2 = !0, e49.insertBefore(s2, r2);
    if (o2 instanceof ea) {
      let t3 = r2 ? r2.previousSibling : e49.lastChild;
      oa(o2.contentDOM, o2.children, n2), r2 = t3 ? t3.nextSibling : e49.firstChild;
    }
  }
  for (; r2; ) r2 = ma(r2), i2 = !0;
  i2 && n2.trackWrites == e49 && (n2.trackWrites = null);
}
var sa = function(e49) {
  e49 && (this.nodeName = e49);
};
sa.prototype = /* @__PURE__ */ Object.create(null);
var ca = [new sa()];
function la(e49, t2, n2) {
  if (e49.length == 0) return ca;
  let r2 = n2 ? ca[0] : new sa(), i2 = [r2];
  for (let a2 = 0; a2 < e49.length; a2++) {
    let o2 = e49[a2].type.attrs;
    if (o2) {
      o2.nodeName && i2.push(r2 = new sa(o2.nodeName));
      for (let e50 in o2) {
        let a3 = o2[e50];
        a3 != null && (n2 && i2.length == 1 && i2.push(r2 = new sa(t2.isInline ? "span" : "div")), e50 == "class" ? r2.class = (r2.class ? r2.class + " " : "") + a3 : e50 == "style" ? r2.style = (r2.style ? r2.style + ";" : "") + a3 : e50 != "nodeName" && (r2[e50] = a3));
      }
    }
  }
  return i2;
}
function ua(e49, t2, n2, r2) {
  if (n2 == ca && r2 == ca) return t2;
  let i2 = t2;
  for (let t3 = 0; t3 < r2.length; t3++) {
    let a2 = r2[t3], o2 = n2[t3];
    if (t3) {
      let t4;
      o2 && o2.nodeName == a2.nodeName && i2 != e49 && (t4 = i2.parentNode) && t4.nodeName.toLowerCase() == a2.nodeName || (t4 = document.createElement(a2.nodeName), t4.pmIsDeco = !0, t4.appendChild(i2), o2 = ca[0]), i2 = t4;
    }
    da(i2, o2 || ca[0], a2);
  }
  return i2;
}
function da(e49, t2, n2) {
  for (let r2 in t2) r2 != "class" && r2 != "style" && r2 != "nodeName" && !(r2 in n2) && e49.removeAttribute(r2);
  for (let r2 in n2) r2 != "class" && r2 != "style" && r2 != "nodeName" && n2[r2] != t2[r2] && e49.setAttribute(r2, n2[r2]);
  if (t2.class != n2.class) {
    let r2 = t2.class ? t2.class.split(" ").filter(Boolean) : [], i2 = n2.class ? n2.class.split(" ").filter(Boolean) : [];
    for (let t3 = 0; t3 < r2.length; t3++) i2.indexOf(r2[t3]) == -1 && e49.classList.remove(r2[t3]);
    for (let t3 = 0; t3 < i2.length; t3++) r2.indexOf(i2[t3]) == -1 && e49.classList.add(i2[t3]);
    e49.classList.length == 0 && e49.removeAttribute("class");
  }
  if (t2.style != n2.style) {
    if (t2.style) {
      let n3 = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, r2;
      for (; r2 = n3.exec(t2.style); ) e49.style.removeProperty(r2[1]);
    }
    n2.style && (e49.style.cssText += n2.style);
  }
}
function fa(e49, t2, n2) {
  return ua(e49, e49, ca, la(t2, n2, e49.nodeType != 1));
}
function pa(e49, t2) {
  if (e49.length != t2.length) return !1;
  for (let n2 = 0; n2 < e49.length; n2++) if (!e49[n2].type.eq(t2[n2].type)) return !1;
  return !0;
}
function ma(e49) {
  let t2 = e49.nextSibling;
  return e49.parentNode.removeChild(e49), t2;
}
var ha = class {
  constructor(e49, t2, n2) {
    this.lock = t2, this.view = n2, this.index = 0, this.stack = [], this.changed = !1, this.top = e49, this.preMatch = ga(e49.node.content, e49);
  }
  destroyBetween(e49, t2) {
    if (e49 != t2) {
      for (let n2 = e49; n2 < t2; n2++) this.top.children[n2].destroy();
      this.top.children.splice(e49, t2 - e49), this.changed = !0;
    }
  }
  destroyRest() {
    this.destroyBetween(this.index, this.top.children.length);
  }
  syncToMarks(e49, t2, n2, r2) {
    let i2 = 0, a2 = this.stack.length >> 1, o2 = Math.min(a2, e49.length);
    for (; i2 < o2 && (i2 == a2 - 1 ? this.top : this.stack[i2 + 1 << 1]).matchesMark(e49[i2]) && e49[i2].type.spec.spanning !== !1; ) i2++;
    for (; i2 < a2; ) this.destroyRest(), this.top.dirty = qi, this.index = this.stack.pop(), this.top = this.stack.pop(), a2--;
    for (; a2 < e49.length; ) {
      this.stack.push(this.top, this.index + 1);
      let i3 = -1, o3 = this.top.children.length;
      r2 < this.preMatch.index && (o3 = Math.min(this.index + 3, o3));
      for (let t3 = this.index; t3 < o3; t3++) {
        let n3 = this.top.children[t3];
        if (n3.matchesMark(e49[a2]) && !this.isLocked(n3.dom)) {
          i3 = t3;
          break;
        }
      }
      if (i3 < 0 && this.index < this.top.children.length) {
        let t3 = this.top.children[this.index];
        t3 instanceof ea && t3.dirty != Xi && t3.mark.type == e49[a2].type && t3.spec.update && !this.isLocked(t3.dom) && t3.spec.update(e49[a2]) && (t3.mark = e49[a2], i3 = this.index, this.changed = !0);
      }
      if (i3 > -1) i3 > this.index && (this.changed = !0, this.destroyBetween(this.index, i3)), this.top = this.top.children[this.index];
      else {
        let r3 = ea.create(this.top, e49[a2], t2, n2);
        this.top.children.splice(this.index, 0, r3), this.top = r3, this.changed = !0;
      }
      this.index = 0, a2++;
    }
  }
  findNodeMatch(e49, t2, n2, r2) {
    let i2 = -1, a2;
    if (r2 >= this.preMatch.index && (a2 = this.preMatch.matches[r2 - this.preMatch.index]).parent == this.top && a2.matchesNode(e49, t2, n2)) i2 = this.top.children.indexOf(a2, this.index);
    else for (let r3 = this.index, a3 = Math.min(this.top.children.length, r3 + 5); r3 < a3; r3++) {
      let a4 = this.top.children[r3];
      if (a4.matchesNode(e49, t2, n2) && !this.preMatch.matched.has(a4)) {
        i2 = r3;
        break;
      }
    }
    return i2 < 0 ? !1 : (this.destroyBetween(this.index, i2), this.index++, !0);
  }
  updateNodeAt(e49, t2, n2, r2, i2) {
    let a2 = this.top.children[r2];
    return a2.dirty == Xi && a2.dom == a2.contentDOM && (a2.dirty = Yi), a2.update(e49, t2, n2, i2) ? (this.destroyBetween(this.index, r2), this.index++, !0) : !1;
  }
  findIndexWithChild(e49) {
    for (; ; ) {
      let t2 = e49.parentNode;
      if (!t2) return -1;
      if (t2 == this.top.contentDOM) {
        let t3 = e49.pmViewDesc;
        if (t3) {
          for (let e50 = this.index; e50 < this.top.children.length; e50++) if (this.top.children[e50] == t3) return e50;
        }
        return -1;
      }
      e49 = t2;
    }
  }
  updateNextNode(e49, t2, n2, r2, i2, a2) {
    for (let o2 = this.index; o2 < this.top.children.length; o2++) {
      let s2 = this.top.children[o2];
      if (s2 instanceof ta) {
        let c2 = this.preMatch.matched.get(s2);
        if (c2 != null && c2 != i2) return !1;
        let l2 = s2.dom, u2, d2 = this.isLocked(l2) && !(e49.isText && s2.node && s2.node.isText && s2.nodeDOM.nodeValue == e49.text && s2.dirty != Xi && pa(t2, s2.outerDeco));
        if (!d2 && s2.update(e49, t2, n2, r2)) return this.destroyBetween(this.index, o2), s2.dom != l2 && (this.changed = !0), this.index++, !0;
        if (!d2 && (u2 = this.recreateWrapper(s2, e49, t2, n2, r2, a2))) return this.destroyBetween(this.index, o2), this.top.children[this.index] = u2, u2.contentDOM && (u2.dirty = Yi, u2.updateChildren(r2, a2 + 1), u2.dirty = qi), this.changed = !0, this.index++, !0;
        break;
      }
    }
    return !1;
  }
  recreateWrapper(e49, t2, n2, r2, i2, a2) {
    if (e49.dirty || t2.isAtom || !e49.children.length || !e49.node.content.eq(t2.content) || !pa(n2, e49.outerDeco) || !r2.eq(e49.innerDeco)) return null;
    let o2 = ta.create(this.top, t2, n2, r2, i2, a2);
    if (o2.contentDOM) {
      o2.children = e49.children, e49.children = [];
      for (let e50 of o2.children) e50.parent = o2;
    }
    return e49.destroy(), o2;
  }
  addNode(e49, t2, n2, r2, i2) {
    let a2 = ta.create(this.top, e49, t2, n2, r2, i2);
    a2.contentDOM && a2.updateChildren(r2, i2 + 1), this.top.children.splice(this.index++, 0, a2), this.changed = !0;
  }
  placeWidget(e49, t2, n2) {
    let r2 = this.index < this.top.children.length ? this.top.children[this.index] : null;
    if (r2 && r2.matchesWidget(e49) && (e49 == r2.widget || !r2.widget.type.toDOM.parentNode)) this.index++;
    else {
      let r3 = new Qi(this.top, e49, t2, n2);
      this.top.children.splice(this.index++, 0, r3), this.changed = !0;
    }
  }
  addTextblockHacks() {
    let e49 = this.top.children[this.index - 1], t2 = this.top;
    for (; e49 instanceof ea; ) t2 = e49, e49 = t2.children[t2.children.length - 1];
    (!e49 || !(e49 instanceof ra) || /\n$/.test(e49.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e49.node.text)) && ((L || I) && e49 && e49.dom.contentEditable == "false" && this.addHackNode("IMG", t2), this.addHackNode("BR", this.top));
  }
  addHackNode(e49, t2) {
    if (t2 == this.top && this.index < t2.children.length && t2.children[this.index].matchesHack(e49)) this.index++;
    else {
      let n2 = document.createElement(e49);
      e49 == "IMG" && (n2.className = "ProseMirror-separator", n2.alt = ""), e49 == "BR" && (n2.className = "ProseMirror-trailingBreak");
      let r2 = new ia(this.top, [], n2, null);
      t2 == this.top ? t2.children.splice(this.index++, 0, r2) : t2.children.push(r2), this.changed = !0;
    }
  }
  isLocked(e49) {
    return this.lock && (e49 == this.lock || e49.nodeType == 1 && e49.contains(this.lock.parentNode));
  }
};
function ga(e49, t2) {
  let n2 = t2, r2 = n2.children.length, i2 = e49.childCount, a2 = /* @__PURE__ */ new Map(), o2 = [];
  outer: for (; i2 > 0; ) {
    let s2;
    for (; ; ) if (r2) {
      let e50 = n2.children[r2 - 1];
      if (e50 instanceof ea) n2 = e50, r2 = e50.children.length;
      else {
        s2 = e50, r2--;
        break;
      }
    } else {
      if (n2 == t2) break outer;
      r2 = n2.parent.children.indexOf(n2), n2 = n2.parent;
    }
    let c2 = s2.node;
    if (c2) {
      if (c2 != e49.child(i2 - 1)) break;
      --i2, a2.set(s2, i2), o2.push(s2);
    }
  }
  return { index: i2, matched: a2, matches: o2.reverse() };
}
function _a(e49, t2) {
  return e49.type.side - t2.type.side;
}
function va(e49, t2, n2, r2) {
  let i2 = t2.locals(e49), a2 = 0;
  if (i2.length == 0) {
    for (let n3 = 0; n3 < e49.childCount; n3++) {
      let o3 = e49.child(n3);
      r2(o3, i2, t2.forChild(a2, o3), n3), a2 += o3.nodeSize;
    }
    return;
  }
  let o2 = 0, s2 = [], c2 = null;
  for (let l2 = 0; ; ) {
    let u2, d2;
    for (; o2 < i2.length && i2[o2].to == a2; ) {
      let e50 = i2[o2++];
      e50.widget && (u2 ? (d2 ||= [u2]).push(e50) : u2 = e50);
    }
    if (u2)
      if (d2) {
        d2.sort(_a);
        for (let e50 = 0; e50 < d2.length; e50++) n2(d2[e50], l2, !!c2);
      } else n2(u2, l2, !!c2);
    let f2, p2;
    if (c2) p2 = -1, f2 = c2, c2 = null;
    else if (l2 < e49.childCount) p2 = l2, f2 = e49.child(l2++);
    else break;
    for (let e50 = 0; e50 < s2.length; e50++) s2[e50].to <= a2 && s2.splice(e50--, 1);
    for (; o2 < i2.length && i2[o2].from <= a2 && i2[o2].to > a2; ) s2.push(i2[o2++]);
    let m2 = a2 + f2.nodeSize;
    if (f2.isText) {
      let e50 = m2;
      o2 < i2.length && i2[o2].from < e50 && (e50 = i2[o2].from);
      for (let t3 = 0; t3 < s2.length; t3++) s2[t3].to < e50 && (e50 = s2[t3].to);
      e50 < m2 && (c2 = f2.cut(e50 - a2), f2 = f2.cut(0, e50 - a2), m2 = e50, p2 = -1);
    } else for (; o2 < i2.length && i2[o2].to < m2; ) o2++;
    let h2 = f2.isInline && !f2.isLeaf ? s2.filter((e50) => !e50.inline) : s2.slice();
    r2(f2, h2, t2.forChild(a2, f2), p2), a2 = m2;
  }
}
function ya(e49) {
  if (e49.nodeName == "UL" || e49.nodeName == "OL") {
    let t2 = e49.style.cssText;
    e49.style.cssText = t2 + "; list-style: square !important", window.getComputedStyle(e49).listStyle, e49.style.cssText = t2;
  }
}
function ba(e49, t2, n2, r2) {
  for (let i2 = 0, a2 = 0; i2 < e49.childCount && a2 <= r2; ) {
    let o2 = e49.child(i2++), s2 = a2;
    if (a2 += o2.nodeSize, !o2.isText) continue;
    let c2 = o2.text;
    for (; i2 < e49.childCount; ) {
      let t3 = e49.child(i2++);
      if (a2 += t3.nodeSize, !t3.isText) break;
      c2 += t3.text;
    }
    if (a2 >= n2) {
      if (a2 >= r2 && c2.slice(r2 - t2.length - s2, r2 - s2) == t2) return r2 - t2.length;
      let e50 = s2 < r2 ? c2.lastIndexOf(t2, r2 - s2 - 1) : -1;
      if (e50 >= 0 && e50 + t2.length + s2 >= n2) return s2 + e50;
      if (n2 == r2 && c2.length >= r2 + t2.length - s2 && c2.slice(r2 - s2, r2 - s2 + t2.length) == t2) return r2;
    }
  }
  return -1;
}
function xa(e49, t2, n2, r2, i2) {
  let a2 = [];
  for (let o2 = 0, s2 = 0; o2 < e49.length; o2++) {
    let c2 = e49[o2], l2 = s2, u2 = s2 += c2.size;
    l2 >= n2 || u2 <= t2 ? a2.push(c2) : (l2 < t2 && a2.push(c2.slice(0, t2 - l2, r2)), i2 &&= (a2.push(i2), void 0), u2 > n2 && a2.push(c2.slice(n2 - l2, c2.size, r2)));
  }
  return a2;
}
function Sa(e49, t2 = null) {
  let n2 = e49.domSelectionRange(), r2 = e49.state.doc;
  if (!n2.focusNode) return null;
  let i2 = e49.docView.nearestDesc(n2.focusNode), a2 = i2 && i2.size == 0, o2 = e49.docView.posFromDOM(n2.focusNode, n2.focusOffset, 1);
  if (o2 < 0) return null;
  let s2 = r2.resolve(o2), c2, l2;
  if (Yr(n2)) {
    for (c2 = o2; i2 && !i2.node; ) i2 = i2.parent;
    let e50 = i2.node;
    if (i2 && e50.isAtom && j.isSelectable(e50) && i2.parent && !(e50.isInline && qr(n2.focusNode, n2.focusOffset, i2.dom))) {
      let e51 = i2.posBefore;
      l2 = new j(o2 == e51 ? s2 : r2.resolve(e51));
    }
  } else {
    if (n2 instanceof e49.dom.ownerDocument.defaultView.Selection && n2.rangeCount > 1) {
      let t3 = o2, i3 = o2;
      for (let r3 = 0; r3 < n2.rangeCount; r3++) {
        let a3 = n2.getRangeAt(r3);
        t3 = Math.min(t3, e49.docView.posFromDOM(a3.startContainer, a3.startOffset, 1)), i3 = Math.max(i3, e49.docView.posFromDOM(a3.endContainer, a3.endOffset, -1));
      }
      if (t3 < 0) return null;
      [c2, o2] = i3 == e49.state.selection.anchor ? [i3, t3] : [t3, i3], s2 = r2.resolve(o2);
    } else c2 = e49.docView.posFromDOM(n2.anchorNode, n2.anchorOffset, 1);
    if (c2 < 0) return null;
  }
  let u2 = r2.resolve(c2);
  if (!l2) {
    let n3 = t2 == "pointer" || e49.state.selection.head < s2.pos && !a2 ? 1 : -1;
    l2 = Na(e49, u2, s2, n3);
  }
  return l2;
}
function Ca(e49) {
  return e49.editable ? e49.hasFocus() : Fa(e49) && document.activeElement && document.activeElement.contains(e49.dom);
}
function wa(e49, t2 = !1) {
  let n2 = e49.state.selection;
  if (ja(e49, n2), !Ca(e49)) return;
  let r2 = e49.input.mouseDown;
  if (!t2 && I && r2) {
    let t3 = e49.domSelectionRange(), n3 = e49.domObserver.currentSelection;
    if (t3.anchorNode && n3.anchorNode && Vr(t3.anchorNode, t3.anchorOffset, n3.anchorNode, n3.anchorOffset) && r2.delaySelUpdate()) {
      e49.domObserver.setCurSelection();
      return;
    }
  }
  if (e49.domObserver.disconnectSelection(), e49.cursorWrapper) Aa(e49);
  else {
    let { anchor: r3, head: i2 } = n2, a2, o2;
    Ta && !(n2 instanceof A) && (n2.$from.parent.inlineContent || (a2 = Ea(e49, n2.from)), !n2.empty && !n2.$from.parent.inlineContent && (o2 = Ea(e49, n2.to))), e49.docView.setSelection(r3, i2, e49, t2), Ta && (a2 && Oa(a2), o2 && Oa(o2)), n2.visible ? e49.dom.classList.remove("ProseMirror-hideselection") : (e49.dom.classList.add("ProseMirror-hideselection"), "onselectionchange" in document && ka(e49));
  }
  e49.domObserver.setCurSelection(), e49.domObserver.connectSelection();
}
var Ta = L || I && ci < 63;
function Ea(e49, t2) {
  let { node: n2, offset: r2 } = e49.docView.domFromPos(t2, 0), i2 = r2 < n2.childNodes.length ? n2.childNodes[r2] : null, a2 = r2 ? n2.childNodes[r2 - 1] : null;
  if (L && i2 && i2.contentEditable == "false") return Da(i2);
  if ((!i2 || i2.contentEditable == "false") && (!a2 || a2.contentEditable == "false")) {
    if (i2) return Da(i2);
    if (a2) return Da(a2);
  }
}
function Da(e49) {
  return e49.contentEditable = "true", L && e49.draggable && (e49.draggable = !1, e49.wasDraggable = !0), e49;
}
function Oa(e49) {
  e49.contentEditable = "false", e49.wasDraggable &&= (e49.draggable = !0, null);
}
function ka(e49) {
  let t2 = e49.dom.ownerDocument;
  t2.removeEventListener("selectionchange", e49.input.hideSelectionGuard);
  let n2 = e49.domSelectionRange(), r2 = n2.anchorNode, i2 = n2.anchorOffset;
  t2.addEventListener("selectionchange", e49.input.hideSelectionGuard = () => {
    (n2.anchorNode != r2 || n2.anchorOffset != i2) && (t2.removeEventListener("selectionchange", e49.input.hideSelectionGuard), setTimeout(() => {
      (!Ca(e49) || e49.state.selection.visible) && e49.dom.classList.remove("ProseMirror-hideselection");
    }, 20));
  });
}
function Aa(e49) {
  let t2 = e49.domSelection();
  if (!t2) return;
  let n2 = e49.cursorWrapper.dom, r2 = n2.nodeName == "IMG";
  r2 ? t2.collapse(n2.parentNode, P(n2) + 1) : t2.collapse(n2, 0), !r2 && !e49.state.selection.visible && F && ai <= 11 && (n2.disabled = !0, n2.disabled = !1);
}
function ja(e49, t2) {
  if (t2 instanceof j) {
    let n2 = e49.docView.descAt(t2.from);
    n2 != e49.lastSelectedViewDesc && (Ma(e49), n2 && n2.selectNode(), e49.lastSelectedViewDesc = n2);
  } else Ma(e49);
}
function Ma(e49) {
  e49.lastSelectedViewDesc &&= (e49.lastSelectedViewDesc.parent && e49.lastSelectedViewDesc.deselectNode(), void 0);
}
function Na(e49, t2, n2, r2) {
  return e49.someProp("createSelectionBetween", (r3) => r3(e49, t2, n2)) || A.between(t2, n2, r2);
}
function Pa(e49) {
  return e49.editable && !e49.hasFocus() ? !1 : Fa(e49);
}
function Fa(e49) {
  let t2 = e49.domSelectionRange();
  if (!t2.anchorNode) return !1;
  try {
    return e49.dom.contains(t2.anchorNode.nodeType == 3 ? t2.anchorNode.parentNode : t2.anchorNode) && (e49.editable || e49.dom.contains(t2.focusNode.nodeType == 3 ? t2.focusNode.parentNode : t2.focusNode));
  } catch {
    return !1;
  }
}
function Ia(e49) {
  let t2 = e49.docView.domFromPos(e49.state.selection.anchor, 0), n2 = e49.domSelectionRange();
  return Vr(t2.node, t2.offset, n2.anchorNode, n2.anchorOffset);
}
function La(e49, t2) {
  let { $anchor: n2, $head: r2 } = e49.selection, i2 = t2 > 0 ? n2.max(r2) : n2.min(r2), a2 = i2.parent.inlineContent ? i2.depth ? e49.doc.resolve(t2 > 0 ? i2.after() : i2.before()) : null : i2;
  return a2 && k.findFrom(a2, t2);
}
function Ra(e49, t2) {
  return e49.dispatch(e49.state.tr.setSelection(t2).scrollIntoView()), !0;
}
function za(e49, t2, n2) {
  let r2 = e49.state.selection;
  if (r2 instanceof A) {
    if (n2.indexOf("s") > -1) {
      let { $head: n3 } = r2, i2 = n3.textOffset ? null : t2 < 0 ? n3.nodeBefore : n3.nodeAfter;
      if (!i2 || i2.isText || !i2.isLeaf) return !1;
      let a2 = e49.state.doc.resolve(n3.pos + i2.nodeSize * (t2 < 0 ? -1 : 1));
      return Ra(e49, new A(r2.$anchor, a2));
    }
    if (!r2.empty) return !1;
    if (e49.endOfTextblock(t2 > 0 ? "forward" : "backward")) {
      let n3 = La(e49.state, t2);
      return n3 && n3 instanceof j ? Ra(e49, n3) : !1;
    }
    if (!(ui && n2.indexOf("m") > -1)) {
      let n3 = r2.$head, i2 = n3.textOffset ? null : t2 < 0 ? n3.nodeBefore : n3.nodeAfter, a2;
      if (!i2 || i2.isText) return !1;
      let o2 = t2 < 0 ? n3.pos - i2.nodeSize : n3.pos;
      return i2.isAtom || (a2 = e49.docView.descAt(o2)) && !a2.contentDOM ? j.isSelectable(i2) ? Ra(e49, new j(t2 < 0 ? e49.state.doc.resolve(n3.pos - i2.nodeSize) : n3)) : pi ? Ra(e49, new A(e49.state.doc.resolve(t2 < 0 ? o2 : o2 + i2.nodeSize))) : !1 : !1;
    }
  } else {
    if (r2 instanceof j && r2.node.isInline) return Ra(e49, new A(t2 > 0 ? r2.$to : r2.$from));
    {
      let n3 = La(e49.state, t2);
      return n3 ? Ra(e49, n3) : !1;
    }
  }
}
function Ba(e49) {
  return e49.nodeType == 3 ? e49.nodeValue.length : e49.childNodes.length;
}
function Va(e49, t2) {
  let n2 = e49.pmViewDesc;
  return n2 && n2.size == 0 && (t2 < 0 || e49.nextSibling || e49.nodeName != "BR");
}
function Ha(e49, t2) {
  return t2 < 0 ? Ua(e49) : Wa(e49);
}
function Ua(e49) {
  let t2 = e49.domSelectionRange(), n2 = t2.focusNode, r2 = t2.focusOffset;
  if (!n2) return;
  let i2, a2, o2 = !1;
  for (oi && n2.nodeType == 1 && r2 < Ba(n2) && Va(n2.childNodes[r2], -1) && (o2 = !0); ; ) if (r2 > 0) {
    if (n2.nodeType != 1) break;
    {
      let e50 = n2.childNodes[r2 - 1];
      if (Va(e50, -1)) i2 = n2, a2 = --r2;
      else if (e50.nodeType == 3) n2 = e50, r2 = n2.nodeValue.length;
      else break;
    }
  } else {
    if (Ga(n2)) break;
    {
      let t3 = n2.previousSibling;
      for (; t3 && Va(t3, -1); ) i2 = n2.parentNode, a2 = P(t3), t3 = t3.previousSibling;
      if (t3) n2 = t3, r2 = Ba(n2);
      else {
        if (n2 = n2.parentNode, n2 == e49.dom) break;
        r2 = 0;
      }
    }
  }
  o2 ? Ja(e49, n2, r2) : i2 && Ja(e49, i2, a2);
}
function Wa(e49) {
  let t2 = e49.domSelectionRange(), n2 = t2.focusNode, r2 = t2.focusOffset;
  if (!n2) return;
  let i2 = Ba(n2), a2, o2;
  for (; ; ) if (r2 < i2) {
    if (n2.nodeType != 1) break;
    let e50 = n2.childNodes[r2];
    if (Va(e50, 1)) a2 = n2, o2 = ++r2;
    else break;
  } else {
    if (Ga(n2)) break;
    {
      let t3 = n2.nextSibling;
      for (; t3 && Va(t3, 1); ) a2 = t3.parentNode, o2 = P(t3) + 1, t3 = t3.nextSibling;
      if (t3) n2 = t3, r2 = 0, i2 = Ba(n2);
      else {
        if (n2 = n2.parentNode, n2 == e49.dom) break;
        r2 = i2 = 0;
      }
    }
  }
  a2 && Ja(e49, a2, o2);
}
function Ga(e49) {
  let t2 = e49.pmViewDesc;
  return t2 && t2.node && t2.node.isBlock;
}
function Ka(e49, t2) {
  for (; e49 && t2 == e49.childNodes.length && !Jr(e49); ) t2 = P(e49) + 1, e49 = e49.parentNode;
  for (; e49 && t2 < e49.childNodes.length; ) {
    let n2 = e49.childNodes[t2];
    if (n2.nodeType == 3) return n2;
    if (n2.nodeType == 1 && n2.contentEditable == "false") break;
    e49 = n2, t2 = 0;
  }
}
function qa(e49, t2) {
  for (; e49 && !t2 && !Jr(e49); ) t2 = P(e49), e49 = e49.parentNode;
  for (; e49 && t2; ) {
    let n2 = e49.childNodes[t2 - 1];
    if (n2.nodeType == 3) return n2;
    if (n2.nodeType == 1 && n2.contentEditable == "false") break;
    e49 = n2, t2 = e49.childNodes.length;
  }
}
function Ja(e49, t2, n2) {
  if (t2.nodeType != 3) {
    let e50, r3;
    (r3 = Ka(t2, n2)) ? (t2 = r3, n2 = 0) : (e50 = qa(t2, n2)) && (t2 = e50, n2 = e50.nodeValue.length);
  }
  let r2 = e49.domSelection();
  if (!r2) return;
  if (Yr(r2)) {
    let e50 = document.createRange();
    e50.setEnd(t2, n2), e50.setStart(t2, n2), r2.removeAllRanges(), r2.addRange(e50);
  } else r2.extend && r2.extend(t2, n2);
  e49.domObserver.setCurSelection();
  let { state: i2 } = e49;
  setTimeout(() => {
    e49.state == i2 && wa(e49);
  }, 50);
}
function Ya(e49, t2) {
  let n2 = e49.state.doc.resolve(t2);
  if (!(I || di) && n2.parent.inlineContent) {
    let r2 = e49.coordsAtPos(t2);
    if (t2 > n2.start()) {
      let n3 = e49.coordsAtPos(t2 - 1), i2 = (n3.top + n3.bottom) / 2;
      if (i2 > r2.top && i2 < r2.bottom && Math.abs(n3.left - r2.left) > 1) return n3.left < r2.left ? "ltr" : "rtl";
    }
    if (t2 < n2.end()) {
      let n3 = e49.coordsAtPos(t2 + 1), i2 = (n3.top + n3.bottom) / 2;
      if (i2 > r2.top && i2 < r2.bottom && Math.abs(n3.left - r2.left) > 1) return n3.left > r2.left ? "ltr" : "rtl";
    }
  }
  return getComputedStyle(e49.dom).direction == "rtl" ? "rtl" : "ltr";
}
function Xa(e49, t2, n2) {
  let r2 = e49.state.selection;
  if (r2 instanceof A && !r2.empty || n2.indexOf("s") > -1 || ui && n2.indexOf("m") > -1) return !1;
  let { $from: i2, $to: a2 } = r2;
  if (!i2.parent.inlineContent || e49.endOfTextblock(t2 < 0 ? "up" : "down")) {
    let n3 = La(e49.state, t2);
    if (n3 && n3 instanceof j) return Ra(e49, n3);
  }
  if (!i2.parent.inlineContent) {
    let n3 = t2 < 0 ? i2 : a2, o2 = r2 instanceof jn ? k.near(n3, t2) : k.findFrom(n3, t2);
    return o2 ? Ra(e49, o2) : !1;
  }
  return !1;
}
function Za(e49, t2) {
  if (!(e49.state.selection instanceof A)) return !0;
  let { $head: n2, $anchor: r2, empty: i2 } = e49.state.selection;
  if (!n2.sameParent(r2)) return !0;
  if (!i2) return !1;
  if (e49.endOfTextblock(t2 > 0 ? "forward" : "backward")) return !0;
  let a2 = !n2.textOffset && (t2 < 0 ? n2.nodeBefore : n2.nodeAfter);
  if (a2 && !a2.isText) {
    let r3 = e49.state.tr;
    return t2 < 0 ? r3.delete(n2.pos - a2.nodeSize, n2.pos) : r3.delete(n2.pos, n2.pos + a2.nodeSize), e49.dispatch(r3), !0;
  }
  return !1;
}
function Qa(e49, t2, n2) {
  e49.domObserver.stop(), t2.contentEditable = n2, e49.domObserver.start();
}
function $a(e49) {
  if (!L || e49.state.selection.$head.parentOffset > 0) return !1;
  let { focusNode: t2, focusOffset: n2 } = e49.domSelectionRange();
  if (t2 && t2.nodeType == 1 && n2 == 0 && t2.firstChild && t2.firstChild.contentEditable == "false") {
    let n3 = t2.firstChild;
    Qa(e49, n3, "true"), setTimeout(() => Qa(e49, n3, "false"), 20);
  }
  return !1;
}
function eo(e49) {
  let t2 = "";
  return e49.ctrlKey && (t2 += "c"), e49.metaKey && (t2 += "m"), e49.altKey && (t2 += "a"), e49.shiftKey && (t2 += "s"), t2;
}
function to(e49, t2) {
  let n2 = t2.keyCode, r2 = eo(t2);
  if (n2 == 8 || ui && n2 == 72 && r2 == "c") return Za(e49, -1) || Ha(e49, -1);
  if (n2 == 46 && !t2.shiftKey || ui && n2 == 68 && r2 == "c") return Za(e49, 1) || Ha(e49, 1);
  if (n2 == 13 || n2 == 27) return !0;
  if (n2 == 37 || ui && n2 == 66 && r2 == "c") {
    let t3 = n2 == 37 ? Ya(e49, e49.state.selection.from) == "ltr" ? -1 : 1 : -1;
    return za(e49, t3, r2) || Ha(e49, t3);
  }
  if (n2 == 39 || ui && n2 == 70 && r2 == "c") {
    let t3 = n2 == 39 ? Ya(e49, e49.state.selection.from) == "ltr" ? 1 : -1 : 1;
    return za(e49, t3, r2) || Ha(e49, t3);
  }
  return n2 == 38 || ui && n2 == 80 && r2 == "c" ? Xa(e49, -1, r2) || Ha(e49, -1) : n2 == 40 || ui && n2 == 78 && r2 == "c" ? $a(e49) || Xa(e49, 1, r2) || Ha(e49, 1) : !(r2 != (ui ? "m" : "c") || n2 != 66 && n2 != 73 && n2 != 89 && n2 != 90);
}
function no(e49, t2) {
  e49.someProp("transformCopied", (n3) => {
    t2 = n3(t2, e49);
  });
  let n2 = [], { content: r2, openStart: i2, openEnd: a2 } = t2;
  for (; i2 > 1 && a2 > 1 && r2.childCount == 1 && r2.firstChild.childCount == 1; ) {
    i2--, a2--;
    let e50 = r2.firstChild;
    n2.push(e50.type.name, e50.attrs == e50.type.defaultAttrs ? null : e50.attrs), r2 = e50.content;
  }
  let o2 = e49.someProp("clipboardSerializer") || st.fromSchema(e49.state.schema), s2 = po(), c2 = s2.createElement("div");
  c2.appendChild(o2.serializeFragment(r2, { document: s2 }));
  let l2 = c2.firstChild, u2, d2 = 0;
  for (; l2 && l2.nodeType == 1 && (u2 = fo[l2.nodeName.toLowerCase()]); ) {
    for (let e50 = u2.length - 1; e50 >= 0; e50--) {
      let t3 = s2.createElement(u2[e50]);
      for (; c2.firstChild; ) t3.appendChild(c2.firstChild);
      c2.appendChild(t3), d2++;
    }
    l2 = c2.firstChild;
  }
  return l2 && l2.nodeType == 1 && l2.setAttribute("data-pm-slice", `${i2} ${a2}${d2 ? ` -${d2}` : ""} ${JSON.stringify(n2)}`), { dom: c2, text: e49.someProp("clipboardTextSerializer", (n3) => n3(t2, e49)) || t2.content.textBetween(0, t2.content.size, `

`), slice: t2 };
}
function ro(e49, t2, n2, r2, i2) {
  let a2 = i2.parent.type.spec.code, o2, s2;
  if (!n2 && !t2) return null;
  let c2 = !!t2 && (r2 || a2 || !n2);
  if (c2) {
    if (e49.someProp("transformPastedText", (n4) => {
      t2 = n4(t2, a2 || r2, e49);
    }), a2) return s2 = new T(y.from(e49.state.schema.text(t2.replace(/\r\n?/g, `
`))), 0, 0), e49.someProp("transformPasted", (t3) => {
      s2 = t3(s2, e49, !0);
    }), s2;
    let n3 = e49.someProp("clipboardTextParser", (n4) => n4(t2, i2, r2, e49));
    if (n3) s2 = n3;
    else {
      let n4 = i2.marks(), { schema: r3 } = e49.state, a3 = st.fromSchema(r3);
      o2 = document.createElement("div"), t2.split(/(?:\r\n?|\n)+/).forEach((e50) => {
        let t3 = o2.appendChild(document.createElement("p"));
        e50 && t3.appendChild(a3.serializeNode(r3.text(e50, n4)));
      });
    }
  } else e49.someProp("transformPastedHTML", (t3) => {
    n2 = t3(n2, e49);
  }), o2 = go(n2), pi && _o(o2);
  let l2 = o2 && o2.querySelector("[data-pm-slice]"), u2 = l2 && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(l2.getAttribute("data-pm-slice") || "");
  if (u2 && u2[3]) for (let e50 = +u2[3]; e50 > 0; e50--) {
    let e51 = o2.firstChild;
    for (; e51 && e51.nodeType != 1; ) e51 = e51.nextSibling;
    if (!e51) break;
    o2 = e51;
  }
  if (s2 ||= (e49.someProp("clipboardParser") || e49.someProp("domParser") || qe.fromSchema(e49.state.schema)).parseSlice(o2, { preserveWhitespace: !!(c2 || u2), context: i2, ruleFromNode(e50) {
    return e50.nodeName == "BR" && !e50.nextSibling && e50.parentNode && !io.test(e50.parentNode.nodeName) ? { ignore: !0 } : null;
  } }), u2) s2 = vo(uo(s2, +u2[1], +u2[2]), u2[4]);
  else if (s2 = T.maxOpen(ao(s2.content, i2), !0), s2.openStart || s2.openEnd) {
    let e50 = 0, t3 = 0;
    for (let t4 = s2.content.firstChild; e50 < s2.openStart && !t4.type.spec.isolating; e50++, t4 = t4.firstChild) ;
    for (let e51 = s2.content.lastChild; t3 < s2.openEnd && !e51.type.spec.isolating; t3++, e51 = e51.lastChild) ;
    s2 = uo(s2, e50, t3);
  }
  return e49.someProp("transformPasted", (t3) => {
    s2 = t3(s2, e49, c2);
  }), s2;
}
var io = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function ao(e49, t2) {
  if (e49.childCount < 2) return e49;
  for (let n2 = t2.depth; n2 >= 0; n2--) {
    let r2 = t2.node(n2).contentMatchAt(t2.index(n2)), i2, a2 = [];
    if (e49.forEach((e50) => {
      if (!a2) return;
      let t3 = r2.findWrapping(e50.type), n3;
      if (!t3) return a2 = null;
      if (n3 = a2.length && i2.length && so(t3, i2, e50, a2[a2.length - 1], 0)) a2[a2.length - 1] = n3;
      else {
        a2.length && (a2[a2.length - 1] = co(a2[a2.length - 1], i2.length));
        let n4 = oo(e50, t3);
        a2.push(n4), r2 = r2.matchType(n4.type), i2 = t3;
      }
    }), a2) return y.from(a2);
  }
  return e49;
}
function oo(e49, t2, n2 = 0) {
  for (let r2 = t2.length - 1; r2 >= n2; r2--) e49 = t2[r2].create(null, y.from(e49));
  return e49;
}
function so(e49, t2, n2, r2, i2) {
  if (i2 < e49.length && i2 < t2.length && e49[i2] == t2[i2]) {
    let a2 = so(e49, t2, n2, r2.lastChild, i2 + 1);
    if (a2) return r2.copy(r2.content.replaceChild(r2.childCount - 1, a2));
    if (r2.contentMatchAt(r2.childCount).matchType(i2 == e49.length - 1 ? n2.type : e49[i2 + 1])) return r2.copy(r2.content.append(y.from(oo(n2, e49, i2 + 1))));
  }
}
function co(e49, t2) {
  if (t2 == 0) return e49;
  let n2 = e49.content.replaceChild(e49.childCount - 1, co(e49.lastChild, t2 - 1)), r2 = e49.contentMatchAt(e49.childCount).fillBefore(y.empty, !0);
  return e49.copy(n2.append(r2));
}
function lo(e49, t2, n2, r2, i2, a2) {
  let o2 = t2 < 0 ? e49.firstChild : e49.lastChild, s2 = o2.content;
  return e49.childCount > 1 && (a2 = 0), i2 < r2 - 1 && (s2 = lo(s2, t2, n2, r2, i2 + 1, a2)), i2 >= n2 && (s2 = t2 < 0 ? o2.contentMatchAt(0).fillBefore(s2, a2 <= i2).append(s2) : s2.append(o2.contentMatchAt(o2.childCount).fillBefore(y.empty, !0))), e49.replaceChild(t2 < 0 ? 0 : e49.childCount - 1, o2.copy(s2));
}
function uo(e49, t2, n2) {
  return t2 < e49.openStart && (e49 = new T(lo(e49.content, -1, t2, e49.openStart, 0, e49.openEnd), t2, e49.openEnd)), n2 < e49.openEnd && (e49 = new T(lo(e49.content, 1, n2, e49.openEnd, 0, 0), e49.openStart, n2)), e49;
}
var fo = { thead: ["table"], tbody: ["table"], tfoot: ["table"], caption: ["table"], colgroup: ["table"], col: ["table", "colgroup"], tr: ["table", "tbody"], td: ["table", "tbody", "tr"], th: ["table", "tbody", "tr"] };
function po() {
  return document.implementation.createHTMLDocument("title");
}
var mo = null;
function ho(e49) {
  let t2 = window.trustedTypes;
  return t2 ? (mo ||= t2.defaultPolicy || t2.createPolicy("ProseMirrorClipboard", { createHTML: (e50) => e50 }), mo.createHTML(e49)) : e49;
}
function go(e49) {
  let t2 = /^(\s*<meta [^>]*>)*/.exec(e49);
  t2 && (e49 = e49.slice(t2[0].length));
  let n2 = po(), r2 = n2.body, i2 = /<([a-z][^>\s]+)/i.exec(e49), a2;
  if ((a2 = i2 && fo[i2[1].toLowerCase()]) && (e49 = a2.map((e50) => "<" + e50 + ">").join("") + e49 + a2.map((e50) => "</" + e50 + ">").reverse().join("")), r2.innerHTML = ho(e49), a2) for (let e50 = 0; e50 < a2.length; e50++) r2 = r2.querySelector(a2[e50]) || r2;
  for (let e50 = 0; e50 < n2.styleSheets.length; e50++) {
    let t3 = n2.styleSheets[e50];
    for (let e51 = 0; e51 < t3.rules.length; e51++) {
      let n3 = t3.rules[e51];
      if (n3 instanceof CSSStyleRule) {
        let e52 = r2.querySelectorAll(n3.selectorText);
        for (let t4 = 0; t4 < e52.length; t4++) e52[t4].style.cssText += n3.style.cssText;
      }
    }
  }
  return r2;
}
function _o(e49) {
  let t2 = e49.querySelectorAll(I ? "span:not([class]):not([style])" : "span.Apple-converted-space");
  for (let n2 = 0; n2 < t2.length; n2++) {
    let r2 = t2[n2];
    r2.childNodes.length == 1 && r2.textContent == "\xA0" && r2.parentNode && r2.parentNode.replaceChild(e49.ownerDocument.createTextNode(" "), r2);
  }
}
function vo(e49, t2) {
  if (!e49.size) return e49;
  let n2 = e49.content.firstChild.type.schema, r2;
  try {
    r2 = JSON.parse(t2);
  } catch {
    return e49;
  }
  let { content: i2, openStart: a2, openEnd: o2 } = e49;
  for (let e50 = r2.length - 2; e50 >= 0; e50 -= 2) {
    let t3 = n2.nodes[r2[e50]];
    if (!t3 || t3.hasRequiredAttrs()) break;
    i2 = y.from(t3.create(r2[e50 + 1], i2)), a2++, o2++;
  }
  return new T(i2, a2, o2);
}
var R = {};
var z = {};
var yo = { touchstart: !0, touchmove: !0 };
var bo = class {
  constructor() {
    this.shiftKey = !1, this.mouseDown = null, this.lastKeyCode = null, this.lastKeyCodeTime = 0, this.lastClick = { time: 0, x: 0, y: 0, type: "", button: 0 }, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastIOSEnter = 0, this.lastIOSEnterFallbackTimeout = -1, this.lastFocus = 0, this.lastTouch = 0, this.lastChromeDelete = 0, this.composing = !1, this.compositionNode = null, this.composingTimeout = -1, this.compositionNodes = [], this.compositionEndedAt = -2e8, this.compositionID = 1, this.badSafariComposition = !1, this.compositionPendingChanges = 0, this.domChangeCount = 0, this.eventHandlers = /* @__PURE__ */ Object.create(null), this.hideSelectionGuard = null;
  }
};
function xo(e49) {
  for (let t2 in R) {
    let n2 = R[t2];
    e49.dom.addEventListener(t2, e49.input.eventHandlers[t2] = (t3) => {
      Eo(e49, t3) && !To(e49, t3) && (e49.editable || !(t3.type in z)) && n2(e49, t3);
    }, yo[t2] ? { passive: !0 } : void 0);
  }
  L && e49.dom.addEventListener("input", () => null), wo(e49);
}
function So(e49, t2) {
  e49.input.lastSelectionOrigin = t2, e49.input.lastSelectionTime = Date.now();
}
function Co(e49) {
  e49.input.mouseDown && e49.input.mouseDown.done(), e49.domObserver.stop();
  for (let t2 in e49.input.eventHandlers) e49.dom.removeEventListener(t2, e49.input.eventHandlers[t2]);
  clearTimeout(e49.input.composingTimeout), clearTimeout(e49.input.lastIOSEnterFallbackTimeout);
}
function wo(e49) {
  e49.someProp("handleDOMEvents", (t2) => {
    for (let n2 in t2) e49.input.eventHandlers[n2] || e49.dom.addEventListener(n2, e49.input.eventHandlers[n2] = (t3) => To(e49, t3));
  });
}
function To(e49, t2) {
  return e49.someProp("handleDOMEvents", (n2) => {
    let r2 = n2[t2.type];
    return r2 ? r2(e49, t2) || t2.defaultPrevented : !1;
  });
}
function Eo(e49, t2) {
  if (!t2.bubbles) return !0;
  if (t2.defaultPrevented) return !1;
  for (let n2 = t2.target; n2 != e49.dom; n2 = n2.parentNode) if (!n2 || n2.nodeType == 11 || n2.pmViewDesc && n2.pmViewDesc.stopEvent(t2)) return !1;
  return !0;
}
function Do(e49, t2) {
  !To(e49, t2) && R[t2.type] && (e49.editable || !(t2.type in z)) && R[t2.type](e49, t2);
}
(z.keydown = (e49, t2) => {
  let n2 = t2;
  if (e49.input.shiftKey = n2.keyCode == 16 || n2.shiftKey, !Wo(e49) && (e49.input.lastKeyCode = n2.keyCode, e49.input.lastKeyCodeTime = Date.now(), !(fi && I && n2.keyCode == 13)))
    if (n2.keyCode != 229 && e49.domObserver.forceFlush(), li && n2.keyCode == 13 && !n2.ctrlKey && !n2.altKey && !n2.metaKey) {
      let t3 = Date.now();
      e49.input.lastIOSEnter = t3, e49.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        e49.input.lastIOSEnter == t3 && (e49.someProp("handleKeyDown", (t4) => t4(e49, Xr(13, "Enter"))), e49.input.lastIOSEnter = 0);
      }, 200);
    } else e49.someProp("handleKeyDown", (t3) => t3(e49, n2)) || to(e49, n2) ? n2.preventDefault() : So(e49, "key");
});
(z.keyup = (e49, t2) => {
  t2.keyCode == 16 && (e49.input.shiftKey = !1);
});
(z.keypress = (e49, t2) => {
  let n2 = t2;
  if (Wo(e49) || !n2.charCode || n2.ctrlKey && !n2.altKey || ui && n2.metaKey) return;
  if (e49.someProp("handleKeyPress", (t3) => t3(e49, n2))) {
    n2.preventDefault();
    return;
  }
  let r2 = e49.state.selection;
  if (!(r2 instanceof A) || !r2.$from.sameParent(r2.$to)) {
    let t3 = String.fromCharCode(n2.charCode), i2 = () => e49.state.tr.insertText(t3).scrollIntoView();
    !/[\r\n]/.test(t3) && !e49.someProp("handleTextInput", (n3) => n3(e49, r2.$from.pos, r2.$to.pos, t3, i2)) && e49.dispatch(i2()), n2.preventDefault();
  }
});
function Oo(e49) {
  return { left: e49.clientX, top: e49.clientY };
}
function ko(e49, t2) {
  let n2 = t2.x - e49.clientX, r2 = t2.y - e49.clientY;
  return n2 * n2 + r2 * r2 < 100;
}
function Ao(e49, t2, n2, r2, i2) {
  if (r2 == -1) return !1;
  let a2 = e49.state.doc.resolve(r2);
  for (let r3 = a2.depth + 1; r3 > 0; r3--) if (e49.someProp(t2, (t3) => r3 > a2.depth ? t3(e49, n2, a2.nodeAfter, a2.before(r3), i2, !0) : t3(e49, n2, a2.node(r3), a2.before(r3), i2, !1))) return !0;
  return !1;
}
function jo(e49, t2, n2) {
  if (e49.focused || e49.focus(), e49.state.selection.eq(t2)) return;
  let r2 = e49.state.tr.setSelection(t2);
  n2 == "pointer" && r2.setMeta("pointer", !0), e49.dispatch(r2);
}
function Mo(e49, t2) {
  if (t2 == -1) return !1;
  let n2 = e49.state.doc.resolve(t2), r2 = n2.nodeAfter;
  return r2 && r2.isAtom && j.isSelectable(r2) ? (jo(e49, new j(n2), "pointer"), !0) : !1;
}
function No(e49, t2) {
  if (t2 == -1) return !1;
  let n2 = e49.state.selection, r2, i2;
  n2 instanceof j && (r2 = n2.node);
  let a2 = e49.state.doc.resolve(t2);
  for (let e50 = a2.depth + 1; e50 > 0; e50--) {
    let t3 = e50 > a2.depth ? a2.nodeAfter : a2.node(e50);
    if (j.isSelectable(t3)) {
      i2 = r2 && n2.$from.depth > 0 && e50 >= n2.$from.depth && a2.before(n2.$from.depth + 1) == n2.$from.pos ? a2.before(n2.$from.depth) : a2.before(e50);
      break;
    }
  }
  return i2 != null && (jo(e49, j.create(e49.state.doc, i2), "pointer"), !0);
}
function Po(e49, t2, n2, r2, i2) {
  return Ao(e49, "handleClickOn", t2, n2, r2) || e49.someProp("handleClick", (n3) => n3(e49, t2, r2)) || (i2 ? No(e49, n2) : Mo(e49, n2));
}
function Fo(e49, t2, n2, r2) {
  return Ao(e49, "handleDoubleClickOn", t2, n2, r2) || e49.someProp("handleDoubleClick", (n3) => n3(e49, t2, r2));
}
function Io(e49, t2, n2, r2) {
  return Ao(e49, "handleTripleClickOn", t2, n2, r2) || e49.someProp("handleTripleClick", (n3) => n3(e49, t2, r2)) || Lo(e49, n2, r2);
}
function Lo(e49, t2, n2) {
  if (n2.button != 0) return !1;
  let r2 = Ro(e49, t2, !0), i2 = e49.state.doc;
  return r2 ? (jo(e49, r2, "pointer"), r2 instanceof A && i2.eq(e49.state.doc) && (e49.input.mouseDown = new Uo(e49, r2)), !0) : !1;
}
function Ro(e49, t2, n2) {
  let r2 = e49.state.doc;
  if (t2 == -1) return r2.inlineContent ? A.create(r2, 0, r2.content.size) : null;
  let i2 = r2.resolve(t2);
  for (let e50 = i2.depth + 1; e50 > 0; e50--) {
    let t3 = e50 > i2.depth ? i2.nodeAfter : i2.node(e50), a2 = i2.before(e50);
    if (t3.inlineContent) return A.create(r2, a2 + 1, a2 + 1 + t3.content.size);
    if (n2 && j.isSelectable(t3)) return j.create(r2, a2);
  }
  return null;
}
function zo(e49) {
  return Xo(e49);
}
var Bo = ui ? "metaKey" : "ctrlKey";
R.mousedown = (e49, t2) => {
  let n2 = t2;
  e49.input.shiftKey = n2.shiftKey;
  let r2 = zo(e49), i2 = Date.now(), a2 = "singleClick";
  i2 - e49.input.lastClick.time < 500 && ko(n2, e49.input.lastClick) && !n2[Bo] && e49.input.lastClick.button == n2.button && (e49.input.lastClick.type == "singleClick" ? a2 = "doubleClick" : e49.input.lastClick.type == "doubleClick" && (a2 = "tripleClick")), e49.input.lastClick = { time: i2, x: n2.clientX, y: n2.clientY, type: a2, button: n2.button }, e49.input.mouseDown && e49.input.mouseDown.done();
  let o2 = e49.posAtCoords(Oo(n2));
  o2 && (a2 == "singleClick" ? e49.input.mouseDown = new Ho(e49, o2, n2, !!r2) : (a2 == "doubleClick" ? Fo : Io)(e49, o2.pos, o2.inside, n2) ? n2.preventDefault() : So(e49, "pointer"));
};
var Vo = class {
  constructor(e49) {
    this.view = e49, this.mightDrag = null, e49.root.addEventListener("mouseup", this.up = this.up.bind(this)), e49.root.addEventListener("mousemove", this.move = this.move.bind(this));
  }
  up(e49) {
    this.done();
  }
  move(e49) {
    e49.buttons == 0 && this.done();
  }
  done() {
    this.view.root.removeEventListener("mouseup", this.up), this.view.root.removeEventListener("mousemove", this.move), this.view.input.mouseDown == this && (this.view.input.mouseDown = null);
  }
  delaySelUpdate() {
    return !1;
  }
};
var Ho = class extends Vo {
  constructor(e49, t2, n2, r2) {
    super(e49), this.pos = t2, this.event = n2, this.flushed = r2, this.delayedSelectionSync = !1, this.startDoc = e49.state.doc, this.selectNode = !!n2[Bo], this.allowDefault = n2.shiftKey;
    let i2, a2;
    if (t2.inside > -1) i2 = e49.state.doc.nodeAt(t2.inside), a2 = t2.inside;
    else {
      let n3 = e49.state.doc.resolve(t2.pos);
      i2 = n3.parent, a2 = n3.depth ? n3.before() : 0;
    }
    let o2 = r2 ? null : n2.target, s2 = o2 ? e49.docView.nearestDesc(o2, !0) : null;
    this.target = s2 && s2.nodeDOM.nodeType == 1 ? s2.nodeDOM : null;
    let { selection: c2 } = e49.state;
    n2.button == 0 && (i2.type.spec.draggable && i2.type.spec.selectable !== !1 || c2 instanceof j && c2.from <= a2 && c2.to > a2) && (this.mightDrag = { node: i2, pos: a2, addAttr: !(!this.target || this.target.draggable), setUneditable: !!(this.target && oi && !this.target.hasAttribute("contentEditable")) }), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
      this.view.input.mouseDown == this && this.target.setAttribute("contentEditable", "false");
    }, 20), this.view.domObserver.start()), So(e49, "pointer");
  }
  done() {
    super.done(), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute("draggable"), this.mightDrag.setUneditable && this.target.removeAttribute("contentEditable"), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => {
      this.view.isDestroyed || wa(this.view);
    });
  }
  up(e49) {
    if (this.done(), !this.view.dom.contains(e49.target)) return;
    let t2 = this.pos;
    this.view.state.doc != this.startDoc && (t2 = this.view.posAtCoords(Oo(e49))), this.updateAllowDefault(e49), this.allowDefault || !t2 ? So(this.view, "pointer") : Po(this.view, t2.pos, t2.inside, e49, this.selectNode) ? e49.preventDefault() : e49.button == 0 && (this.flushed || L && this.mightDrag && !this.mightDrag.node.isAtom || I && !this.view.state.selection.visible && Math.min(Math.abs(t2.pos - this.view.state.selection.from), Math.abs(t2.pos - this.view.state.selection.to)) <= 2) ? (jo(this.view, k.near(this.view.state.doc.resolve(t2.pos)), "pointer"), e49.preventDefault()) : So(this.view, "pointer");
  }
  move(e49) {
    this.updateAllowDefault(e49), So(this.view, "pointer"), super.move(e49);
  }
  updateAllowDefault(e49) {
    !this.allowDefault && (Math.abs(this.event.x - e49.clientX) > 4 || Math.abs(this.event.y - e49.clientY) > 4) && (this.allowDefault = !0);
  }
  delaySelUpdate() {
    return this.allowDefault ? (this.delayedSelectionSync = !0, !0) : !1;
  }
};
var Uo = class extends Vo {
  constructor(e49, t2) {
    super(e49), this.startSelection = t2, this.startDoc = e49.state.doc;
  }
  move(e49) {
    if (e49.buttons == 0 || this.view.isDestroyed || !this.view.state.doc.eq(this.startDoc)) {
      this.done();
      return;
    }
    e49.preventDefault(), So(this.view, "pointer");
    let t2 = this.view.posAtCoords(Oo(e49)), n2 = t2 && Ro(this.view, t2.inside, !1);
    if (!n2) return;
    let { doc: r2 } = this.view.state, i2 = this.startSelection, [a2, o2] = n2.from < i2.from ? [i2.to, n2.from] : [i2.from, n2.to];
    jo(this.view, A.create(r2, a2, o2), "pointer");
  }
};
(R.touchstart = (e49) => {
  e49.input.lastTouch = Date.now(), zo(e49), So(e49, "pointer");
});
(R.touchmove = (e49) => {
  e49.input.lastTouch = Date.now(), So(e49, "pointer");
});
(R.contextmenu = (e49) => zo(e49));
function Wo(e49, t2) {
  return e49.composing ? !0 : L && Math.abs(Date.now() - e49.input.compositionEndedAt) < 500 ? (e49.input.compositionEndedAt = -2e8, !0) : !1;
}
var Go = fi ? 5e3 : -1;
z.compositionstart = z.compositionupdate = (e49) => {
  if (!e49.composing) {
    e49.domObserver.flush();
    let { state: t2 } = e49, n2 = t2.selection.$to;
    if (t2.selection instanceof A && (t2.storedMarks || !n2.textOffset && n2.parentOffset && n2.nodeBefore.marks.some((e50) => e50.type.spec.inclusive === !1) || I && di && Ko(e49))) e49.markCursor = e49.state.storedMarks || n2.marks(), Xo(e49, !0), e49.markCursor = null;
    else if (Xo(e49, !t2.selection.empty), oi && t2.selection.empty && n2.parentOffset && !n2.textOffset && n2.nodeBefore.marks.length) {
      let t3 = e49.domSelectionRange();
      for (let n3 = t3.focusNode, r2 = t3.focusOffset; n3 && n3.nodeType == 1 && r2 != 0; ) {
        let t4 = r2 < 0 ? n3.lastChild : n3.childNodes[r2 - 1];
        if (!t4) break;
        if (t4.nodeType == 3) {
          let n4 = e49.domSelection();
          n4 && n4.collapse(t4, t4.nodeValue.length);
          break;
        }
        n3 = t4, r2 = -1;
      }
    }
    e49.input.composing = !0;
  }
  qo(e49, Go);
};
function Ko(e49) {
  let { focusNode: t2, focusOffset: n2 } = e49.domSelectionRange();
  if (!t2 || t2.nodeType != 1 || n2 >= t2.childNodes.length) return !1;
  let r2 = t2.childNodes[n2];
  return r2.nodeType == 1 && r2.contentEditable == "false";
}
z.compositionend = (e49, t2) => {
  e49.composing && (e49.input.composing = !1, e49.input.compositionEndedAt = Date.now(), e49.input.compositionPendingChanges = e49.domObserver.pendingRecords().length ? e49.input.compositionID : 0, e49.input.compositionNode = null, e49.input.badSafariComposition ? e49.domObserver.forceFlush() : e49.input.compositionPendingChanges && Promise.resolve().then(() => e49.domObserver.flush()), e49.input.compositionID++, qo(e49, 20));
};
function qo(e49, t2) {
  clearTimeout(e49.input.composingTimeout), t2 > -1 && (e49.input.composingTimeout = setTimeout(() => Xo(e49), t2));
}
function Jo(e49) {
  for (e49.composing && (e49.input.composing = !1, e49.input.compositionEndedAt = Date.now()); e49.input.compositionNodes.length > 0; ) e49.input.compositionNodes.pop().markParentsDirty();
}
function Yo(e49) {
  let t2 = e49.domSelectionRange();
  if (!t2.focusNode) return null;
  let n2 = Gr(t2.focusNode, t2.focusOffset), r2 = Kr(t2.focusNode, t2.focusOffset);
  if (n2 && r2 && n2 != r2) {
    let t3 = r2.pmViewDesc, i2 = e49.domObserver.lastChangedTextNode;
    if (n2 == i2 || r2 == i2) return i2;
    if (!t3 || !t3.isText(r2.nodeValue)) return r2;
    if (e49.input.compositionNode == r2) {
      let e50 = n2.pmViewDesc;
      if (e50 && e50.isText(n2.nodeValue)) return r2;
    }
  }
  return n2 || r2;
}
function Xo(e49, t2 = !1) {
  if (!(fi && e49.domObserver.flushingSoon >= 0)) {
    if (e49.domObserver.forceFlush(), Jo(e49), t2 || e49.docView && e49.docView.dirty) {
      let n2 = Sa(e49), r2 = e49.state.selection;
      return n2 && !n2.eq(r2) ? e49.dispatch(e49.state.tr.setSelection(n2)) : (e49.markCursor || t2) && !r2.$from.node(r2.$from.sharedDepth(r2.to)).inlineContent ? e49.dispatch(e49.state.tr.deleteSelection()) : e49.updateState(e49.state), !0;
    }
    return !1;
  }
}
function Zo(e49, t2) {
  if (!e49.dom.parentNode) return;
  let n2 = e49.dom.parentNode.appendChild(document.createElement("div"));
  n2.appendChild(t2), n2.style.cssText = "position: fixed; left: -10000px; top: 10px";
  let r2 = getSelection(), i2 = document.createRange();
  i2.selectNodeContents(t2), e49.dom.blur(), r2.removeAllRanges(), r2.addRange(i2), setTimeout(() => {
    n2.parentNode && n2.parentNode.removeChild(n2), e49.focus();
  }, 50);
}
var Qo = F && ai < 15 || li && mi < 604;
R.copy = z.cut = (e49, t2) => {
  let n2 = t2, r2 = e49.state.selection, i2 = n2.type == "cut";
  if (r2.empty) return;
  let a2 = Qo ? null : n2.clipboardData, { dom: o2, text: s2 } = no(e49, r2.content());
  a2 ? (n2.preventDefault(), a2.clearData(), a2.setData("text/html", o2.innerHTML), a2.setData("text/plain", s2)) : Zo(e49, o2), i2 && e49.dispatch(e49.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};
function $o(e49) {
  return e49.openStart == 0 && e49.openEnd == 0 && e49.content.childCount == 1 ? e49.content.firstChild : null;
}
function es(e49, t2) {
  if (!e49.dom.parentNode) return;
  let n2 = e49.input.shiftKey || e49.state.selection.$from.parent.type.spec.code, r2 = e49.dom.parentNode.appendChild(document.createElement(n2 ? "textarea" : "div"));
  n2 || (r2.contentEditable = "true"), r2.style.cssText = "position: fixed; left: -10000px; top: 10px", r2.focus();
  let i2 = e49.input.shiftKey && e49.input.lastKeyCode != 45;
  setTimeout(() => {
    e49.focus(), r2.parentNode && r2.parentNode.removeChild(r2), n2 ? ts(e49, r2.value, null, i2, t2) : ts(e49, r2.textContent, r2.innerHTML, i2, t2);
  }, 50);
}
function ts(e49, t2, n2, r2, i2) {
  let a2 = ro(e49, t2, n2, r2, e49.state.selection.$from);
  if (e49.someProp("handlePaste", (t3) => t3(e49, i2, a2 || T.empty))) return !0;
  if (!a2) return !1;
  let o2 = $o(a2), s2 = o2 ? e49.state.tr.replaceSelectionWith(o2, r2) : e49.state.tr.replaceSelection(a2);
  return e49.dispatch(s2.scrollIntoView().setMeta("paste", !0).setMeta("uiEvent", "paste")), !0;
}
function ns(e49) {
  let t2 = e49.getData("text/plain") || e49.getData("Text");
  if (t2) return t2;
  let n2 = e49.getData("text/uri-list");
  return n2 ? n2.replace(/\r?\n/g, " ") : "";
}
z.paste = (e49, t2) => {
  let n2 = t2;
  if (e49.composing && !fi) return;
  let r2 = Qo ? null : n2.clipboardData, i2 = e49.input.shiftKey && e49.input.lastKeyCode != 45;
  r2 && ts(e49, ns(r2), r2.getData("text/html"), i2, n2) ? n2.preventDefault() : es(e49, n2);
};
var rs = class {
  constructor(e49, t2, n2) {
    this.slice = e49, this.move = t2, this.node = n2;
  }
};
var is = ui ? "altKey" : "ctrlKey";
function as(e49, t2) {
  let n2;
  return e49.someProp("dragCopies", (e50) => {
    n2 ||= e50(t2);
  }), n2 == null ? !t2[is] : !n2;
}
(R.dragstart = (e49, t2) => {
  let n2 = t2, r2 = e49.input.mouseDown;
  if (r2 && r2.done(), !n2.dataTransfer) return;
  let i2 = e49.state.selection, a2 = i2.empty ? null : e49.posAtCoords(Oo(n2)), o2;
  if (!(a2 && a2.pos >= i2.from && a2.pos <= (i2 instanceof j ? i2.to - 1 : i2.to))) {
    if (r2 && r2.mightDrag) o2 = j.create(e49.state.doc, r2.mightDrag.pos);
    else if (n2.target && n2.target.nodeType == 1) {
      let t3 = e49.docView.nearestDesc(n2.target, !0);
      t3 && t3.node.type.spec.draggable && t3 != e49.docView && (o2 = j.create(e49.state.doc, t3.posBefore));
    }
  }
  let { dom: s2, text: c2, slice: l2 } = no(e49, (o2 || e49.state.selection).content());
  (!n2.dataTransfer.files.length || !I || ci > 120) && n2.dataTransfer.clearData(), n2.dataTransfer.setData(Qo ? "Text" : "text/html", s2.innerHTML), n2.dataTransfer.effectAllowed = "copyMove", Qo || n2.dataTransfer.setData("text/plain", c2), e49.dragging = new rs(l2, as(e49, n2), o2);
});
(R.dragend = (e49) => {
  let t2 = e49.dragging;
  window.setTimeout(() => {
    e49.dragging == t2 && (e49.dragging = null);
  }, 50);
});
(z.dragover = z.dragenter = (e49, t2) => t2.preventDefault());
(z.drop = (e49, t2) => {
  try {
    ss(e49, t2, e49.dragging);
  } finally {
    e49.dragging = null;
  }
});
function ss(e49, t2, n2) {
  if (!t2.dataTransfer) return;
  let r2 = e49.posAtCoords(Oo(t2));
  if (!r2) return;
  let i2 = e49.state.doc.resolve(r2.pos), a2 = n2 && n2.slice;
  a2 ? e49.someProp("transformPasted", (t3) => {
    a2 = t3(a2, e49, !1);
  }) : a2 = ro(e49, ns(t2.dataTransfer), Qo ? null : t2.dataTransfer.getData("text/html"), !1, i2);
  let o2 = !!(n2 && as(e49, t2));
  if (e49.someProp("handleDrop", (n3) => n3(e49, t2, a2 || T.empty, o2))) {
    t2.preventDefault();
    return;
  }
  if (!a2) return;
  t2.preventDefault();
  let s2 = a2 ? an(e49.state.doc, i2.pos, a2) : i2.pos;
  s2 ??= i2.pos;
  let c2 = e49.state.tr;
  if (o2) {
    let { node: e50 } = n2;
    e50 ? e50.replace(c2) : c2.deleteSelection();
  }
  let l2 = c2.mapping.map(s2), u2 = a2.openStart == 0 && a2.openEnd == 0 && a2.content.childCount == 1, d2 = c2.doc;
  if (u2 ? c2.replaceRangeWith(l2, l2, a2.content.firstChild) : c2.replaceRange(l2, l2, a2), c2.doc.eq(d2)) return;
  let f2 = c2.doc.resolve(l2);
  if (u2 && j.isSelectable(a2.content.firstChild) && f2.nodeAfter && f2.nodeAfter.sameMarkup(a2.content.firstChild)) c2.setSelection(new j(f2));
  else {
    let t3 = c2.mapping.map(s2);
    c2.mapping.maps[c2.mapping.maps.length - 1].forEach((e50, n3, r3, i3) => t3 = i3), c2.setSelection(Na(e49, f2, c2.doc.resolve(t3)));
  }
  e49.focus(), e49.dispatch(c2.setMeta("uiEvent", "drop"));
}
(R.focus = (e49) => {
  e49.input.lastFocus = Date.now(), e49.focused || (e49.domObserver.stop(), e49.dom.classList.add("ProseMirror-focused"), e49.domObserver.start(), e49.focused = !0, setTimeout(() => {
    e49.docView && e49.hasFocus() && !e49.domObserver.currentSelection.eq(e49.domSelectionRange()) && wa(e49);
  }, 20));
});
(R.blur = (e49, t2) => {
  let n2 = t2;
  e49.focused &&= (e49.domObserver.stop(), e49.dom.classList.remove("ProseMirror-focused"), e49.domObserver.start(), n2.relatedTarget && e49.dom.contains(n2.relatedTarget) && e49.domObserver.currentSelection.clear(), !1);
});
(R.beforeinput = (e49, t2) => {
  if (I && fi && t2.inputType == "deleteContentBackward") {
    e49.domObserver.flushSoon();
    let { domChangeCount: t3 } = e49.input;
    setTimeout(() => {
      if (e49.input.domChangeCount != t3 || (e49.dom.blur(), e49.focus(), e49.someProp("handleKeyDown", (t4) => t4(e49, Xr(8, "Backspace"))))) return;
      let { $cursor: n2 } = e49.state.selection;
      n2 && n2.pos > 0 && e49.dispatch(e49.state.tr.delete(n2.pos - 1, n2.pos).scrollIntoView());
    }, 50);
  }
});
for (let e49 in z) R[e49] = z[e49];
function cs(e49, t2) {
  if (e49 == t2) return !0;
  for (let n2 in e49) if (e49[n2] !== t2[n2]) return !1;
  for (let n2 in t2) if (!(n2 in e49)) return !1;
  return !0;
}
var ls = class e34 {
  constructor(e49, t2) {
    this.toDOM = e49, this.spec = t2 || ms, this.side = this.spec.side || 0;
  }
  map(e49, t2, n2, r2) {
    let { pos: i2, deleted: a2 } = e49.mapResult(t2.from + r2, this.side < 0 ? -1 : 1);
    return a2 ? null : new fs(i2 - n2, i2 - n2, this);
  }
  valid() {
    return !0;
  }
  eq(t2) {
    return this == t2 || t2 instanceof e34 && (this.spec.key && this.spec.key == t2.spec.key || this.toDOM == t2.toDOM && cs(this.spec, t2.spec));
  }
  destroy(e49) {
    this.spec.destroy && this.spec.destroy(e49);
  }
};
var us = class e35 {
  constructor(e49, t2) {
    this.attrs = e49, this.spec = t2 || ms;
  }
  map(e49, t2, n2, r2) {
    let i2 = e49.map(t2.from + r2, this.spec.inclusiveStart ? -1 : 1) - n2, a2 = e49.map(t2.to + r2, this.spec.inclusiveEnd ? 1 : -1) - n2;
    return i2 >= a2 ? null : new fs(i2, a2, this);
  }
  valid(e49, t2) {
    return t2.from < t2.to;
  }
  eq(t2) {
    return this == t2 || t2 instanceof e35 && cs(this.attrs, t2.attrs) && cs(this.spec, t2.spec);
  }
  static is(t2) {
    return t2.type instanceof e35;
  }
  destroy() {
  }
};
var ds = class e36 {
  constructor(e49, t2) {
    this.attrs = e49, this.spec = t2 || ms;
  }
  map(e49, t2, n2, r2) {
    let i2 = e49.mapResult(t2.from + r2, 1);
    if (i2.deleted) return null;
    let a2 = e49.mapResult(t2.to + r2, -1);
    return a2.deleted || a2.pos <= i2.pos ? null : new fs(i2.pos - n2, a2.pos - n2, this);
  }
  valid(e49, t2) {
    let { index: n2, offset: r2 } = e49.content.findIndex(t2.from), i2;
    return r2 == t2.from && !(i2 = e49.child(n2)).isText && r2 + i2.nodeSize == t2.to;
  }
  eq(t2) {
    return this == t2 || t2 instanceof e36 && cs(this.attrs, t2.attrs) && cs(this.spec, t2.spec);
  }
  destroy() {
  }
};
var fs = class e37 {
  constructor(e49, t2, n2) {
    this.from = e49, this.to = t2, this.type = n2;
  }
  copy(t2, n2) {
    return new e37(t2, n2, this.type);
  }
  eq(e49, t2 = 0) {
    return this.type.eq(e49.type) && this.from + t2 == e49.from && this.to + t2 == e49.to;
  }
  map(e49, t2, n2) {
    return this.type.map(e49, this, t2, n2);
  }
  static widget(t2, n2, r2) {
    return new e37(t2, t2, new ls(n2, r2));
  }
  static inline(t2, n2, r2, i2) {
    return new e37(t2, n2, new us(r2, i2));
  }
  static node(t2, n2, r2, i2) {
    return new e37(t2, n2, new ds(r2, i2));
  }
  get spec() {
    return this.type.spec;
  }
  get inline() {
    return this.type instanceof us;
  }
  get widget() {
    return this.type instanceof ls;
  }
};
var ps = [];
var ms = {};
var B = class e38 {
  constructor(e49, t2) {
    this.local = e49.length ? e49 : ps, this.children = t2.length ? t2 : ps;
  }
  static create(e49, t2) {
    return t2.length ? xs(t2, e49, 0, ms) : V;
  }
  find(e49, t2, n2) {
    let r2 = [];
    return this.findInner(e49 ?? 0, t2 ?? 1e9, r2, 0, n2), r2;
  }
  findInner(e49, t2, n2, r2, i2) {
    for (let a2 = 0; a2 < this.local.length; a2++) {
      let o2 = this.local[a2];
      o2.from <= t2 && o2.to >= e49 && (!i2 || i2(o2.spec)) && n2.push(o2.copy(o2.from + r2, o2.to + r2));
    }
    for (let a2 = 0; a2 < this.children.length; a2 += 3) if (this.children[a2] < t2 && this.children[a2 + 1] > e49) {
      let o2 = this.children[a2] + 1;
      this.children[a2 + 2].findInner(e49 - o2, t2 - o2, n2, r2 + o2, i2);
    }
  }
  map(e49, t2, n2) {
    return this == V || e49.maps.length == 0 ? this : this.mapInner(e49, t2, 0, 0, n2 || ms);
  }
  mapInner(t2, n2, r2, i2, a2) {
    let o2;
    for (let e49 = 0; e49 < this.local.length; e49++) {
      let s2 = this.local[e49].map(t2, r2, i2);
      s2 && s2.type.valid(n2, s2) ? (o2 ||= []).push(s2) : a2.onRemove && a2.onRemove(this.local[e49].spec);
    }
    return this.children.length ? gs(this.children, o2 || [], t2, n2, r2, i2, a2) : o2 ? new e38(o2.sort(Ss), ps) : V;
  }
  add(t2, n2) {
    return n2.length ? this == V ? e38.create(t2, n2) : this.addInner(t2, n2, 0) : this;
  }
  addInner(t2, n2, r2) {
    let i2, a2 = 0;
    t2.forEach((e49, t3) => {
      let o3 = t3 + r2, s2;
      if (s2 = ys(n2, e49, o3)) {
        for (i2 ||= this.children.slice(); a2 < i2.length && i2[a2] < t3; ) a2 += 3;
        i2[a2] == t3 ? i2[a2 + 2] = i2[a2 + 2].addInner(e49, s2, o3 + 1) : i2.splice(a2, 0, t3, t3 + e49.nodeSize, xs(s2, e49, o3 + 1, ms)), a2 += 3;
      }
    });
    let o2 = _s(a2 ? bs(n2) : n2, -r2);
    for (let e49 = 0; e49 < o2.length; e49++) o2[e49].type.valid(t2, o2[e49]) || o2.splice(e49--, 1);
    return new e38(o2.length ? this.local.concat(o2).sort(Ss) : this.local, i2 || this.children);
  }
  remove(e49) {
    return e49.length == 0 || this == V ? this : this.removeInner(e49, 0);
  }
  removeInner(t2, n2) {
    let r2 = this.children, i2 = this.local;
    for (let e49 = 0; e49 < r2.length; e49 += 3) {
      let i3, a2 = r2[e49] + n2, o2 = r2[e49 + 1] + n2;
      for (let e50 = 0, n3; e50 < t2.length; e50++) (n3 = t2[e50]) && n3.from > a2 && n3.to < o2 && (t2[e50] = null, (i3 ||= []).push(n3));
      if (!i3) continue;
      r2 == this.children && (r2 = this.children.slice());
      let s2 = r2[e49 + 2].removeInner(i3, a2 + 1);
      s2 == V ? (r2.splice(e49, 3), e49 -= 3) : r2[e49 + 2] = s2;
    }
    if (i2.length) {
      for (let e49 = 0, r3; e49 < t2.length; e49++) if (r3 = t2[e49]) for (let e50 = 0; e50 < i2.length; e50++) i2[e50].eq(r3, n2) && (i2 == this.local && (i2 = this.local.slice()), i2.splice(e50--, 1));
    }
    return r2 == this.children && i2 == this.local ? this : i2.length || r2.length ? new e38(i2, r2) : V;
  }
  forChild(t2, n2) {
    if (this == V) return this;
    if (n2.isLeaf) return e38.empty;
    let r2, i2;
    for (let e49 = 0; e49 < this.children.length; e49 += 3) if (this.children[e49] >= t2) {
      this.children[e49] == t2 && (r2 = this.children[e49 + 2]);
      break;
    }
    let a2 = t2 + 1, o2 = a2 + n2.content.size;
    for (let e49 = 0; e49 < this.local.length; e49++) {
      let t3 = this.local[e49];
      if (t3.from < o2 && t3.to > a2 && t3.type instanceof us) {
        let e50 = Math.max(a2, t3.from) - a2, n3 = Math.min(o2, t3.to) - a2;
        e50 < n3 && (i2 ||= []).push(t3.copy(e50, n3));
      }
    }
    if (i2) {
      let t3 = new e38(i2.sort(Ss), ps);
      return r2 ? new hs([t3, r2]) : t3;
    }
    return r2 || V;
  }
  eq(t2) {
    if (this == t2) return !0;
    if (!(t2 instanceof e38) || this.local.length != t2.local.length || this.children.length != t2.children.length) return !1;
    for (let e49 = 0; e49 < this.local.length; e49++) if (!this.local[e49].eq(t2.local[e49])) return !1;
    for (let e49 = 0; e49 < this.children.length; e49 += 3) if (this.children[e49] != t2.children[e49] || this.children[e49 + 1] != t2.children[e49 + 1] || !this.children[e49 + 2].eq(t2.children[e49 + 2])) return !1;
    return !0;
  }
  locals(e49) {
    return Cs(this.localsInner(e49));
  }
  localsInner(e49) {
    if (this == V) return ps;
    if (e49.inlineContent || !this.local.some(us.is)) return this.local;
    let t2 = [];
    for (let e50 = 0; e50 < this.local.length; e50++) this.local[e50].type instanceof us || t2.push(this.local[e50]);
    return t2;
  }
  forEachSet(e49) {
    e49(this);
  }
};
(B.empty = new B([], []));
(B.removeOverlap = Cs);
var V = B.empty;
var hs = class e39 {
  constructor(e49) {
    this.members = e49;
  }
  map(t2, n2) {
    let r2 = this.members.map((e49) => e49.map(t2, n2, ms));
    return e39.from(r2);
  }
  forChild(t2, n2) {
    if (n2.isLeaf) return B.empty;
    let r2 = [];
    for (let i2 = 0; i2 < this.members.length; i2++) {
      let a2 = this.members[i2].forChild(t2, n2);
      a2 != V && (a2 instanceof e39 ? r2 = r2.concat(a2.members) : r2.push(a2));
    }
    return e39.from(r2);
  }
  eq(t2) {
    if (!(t2 instanceof e39) || t2.members.length != this.members.length) return !1;
    for (let e49 = 0; e49 < this.members.length; e49++) if (!this.members[e49].eq(t2.members[e49])) return !1;
    return !0;
  }
  locals(e49) {
    let t2, n2 = !0;
    for (let r2 = 0; r2 < this.members.length; r2++) {
      let i2 = this.members[r2].localsInner(e49);
      if (i2.length)
        if (!t2) t2 = i2;
        else {
          n2 &&= (t2 = t2.slice(), !1);
          for (let e50 = 0; e50 < i2.length; e50++) t2.push(i2[e50]);
        }
    }
    return t2 ? Cs(n2 ? t2 : t2.sort(Ss)) : ps;
  }
  static from(t2) {
    switch (t2.length) {
      case 0:
        return V;
      case 1:
        return t2[0];
      default:
        return new e39(t2.every((e49) => e49 instanceof B) ? t2 : t2.reduce((e49, t3) => e49.concat(t3 instanceof B ? t3 : t3.members), []));
    }
  }
  forEachSet(e49) {
    for (let t2 = 0; t2 < this.members.length; t2++) this.members[t2].forEachSet(e49);
  }
};
function gs(e49, t2, n2, r2, i2, a2, o2) {
  let s2 = e49.slice();
  for (let e50 = 0, t3 = a2; e50 < n2.maps.length; e50++) {
    let r3 = 0;
    n2.maps[e50].forEach((e51, n3, i3, a3) => {
      let o3 = a3 - i3 - (n3 - e51);
      for (let i4 = 0; i4 < s2.length; i4 += 3) {
        let a4 = s2[i4 + 1];
        if (a4 < 0 || e51 > a4 + t3 - r3) continue;
        let c3 = s2[i4] + t3 - r3;
        n3 >= c3 ? s2[i4 + 1] = e51 <= c3 ? -2 : -1 : e51 >= t3 && o3 && (s2[i4] += o3, s2[i4 + 1] += o3);
      }
      r3 += o3;
    }), t3 = n2.maps[e50].map(t3, -1);
  }
  let c2 = !1;
  for (let t3 = 0; t3 < s2.length; t3 += 3) if (s2[t3 + 1] < 0) {
    if (s2[t3 + 1] == -2) {
      c2 = !0, s2[t3 + 1] = -1;
      continue;
    }
    let l2 = n2.map(e49[t3] + a2), u2 = l2 - i2;
    if (u2 < 0 || u2 >= r2.content.size) {
      c2 = !0;
      continue;
    }
    let d2 = n2.map(e49[t3 + 1] + a2, -1) - i2, { index: f2, offset: p2 } = r2.content.findIndex(u2), m2 = r2.maybeChild(f2);
    if (m2 && p2 == u2 && p2 + m2.nodeSize == d2) {
      let r3 = s2[t3 + 2].mapInner(n2, m2, l2 + 1, e49[t3] + a2 + 1, o2);
      r3 == V ? (s2[t3 + 1] = -2, c2 = !0) : (s2[t3] = u2, s2[t3 + 1] = d2, s2[t3 + 2] = r3);
    } else c2 = !0;
  }
  if (c2) {
    let c3 = xs(vs(s2, e49, t2, n2, i2, a2, o2), r2, 0, o2);
    t2 = c3.local;
    for (let e50 = 0; e50 < s2.length; e50 += 3) s2[e50 + 1] < 0 && (s2.splice(e50, 3), e50 -= 3);
    for (let e50 = 0, t3 = 0; e50 < c3.children.length; e50 += 3) {
      let n3 = c3.children[e50];
      for (; t3 < s2.length && s2[t3] < n3; ) t3 += 3;
      s2.splice(t3, 0, c3.children[e50], c3.children[e50 + 1], c3.children[e50 + 2]);
    }
  }
  return new B(t2.sort(Ss), s2);
}
function _s(e49, t2) {
  if (!t2 || !e49.length) return e49;
  let n2 = [];
  for (let r2 = 0; r2 < e49.length; r2++) {
    let i2 = e49[r2];
    n2.push(new fs(i2.from + t2, i2.to + t2, i2.type));
  }
  return n2;
}
function vs(e49, t2, n2, r2, i2, a2, o2) {
  function s2(e50, t3) {
    for (let a3 = 0; a3 < e50.local.length; a3++) {
      let s3 = e50.local[a3].map(r2, i2, t3);
      s3 ? n2.push(s3) : o2.onRemove && o2.onRemove(e50.local[a3].spec);
    }
    for (let n3 = 0; n3 < e50.children.length; n3 += 3) s2(e50.children[n3 + 2], e50.children[n3] + t3 + 1);
  }
  for (let n3 = 0; n3 < e49.length; n3 += 3) e49[n3 + 1] == -1 && s2(e49[n3 + 2], t2[n3] + a2 + 1);
  return n2;
}
function ys(e49, t2, n2) {
  if (t2.isLeaf) return null;
  let r2 = n2 + t2.nodeSize, i2 = null;
  for (let t3 = 0, a2; t3 < e49.length; t3++) (a2 = e49[t3]) && a2.from > n2 && a2.to < r2 && ((i2 ||= []).push(a2), e49[t3] = null);
  return i2;
}
function bs(e49) {
  let t2 = [];
  for (let n2 = 0; n2 < e49.length; n2++) e49[n2] != null && t2.push(e49[n2]);
  return t2;
}
function xs(e49, t2, n2, r2) {
  let i2 = [], a2 = !1;
  t2.forEach((t3, o3) => {
    let s2 = ys(e49, t3, o3 + n2);
    if (s2) {
      a2 = !0;
      let e50 = xs(s2, t3, n2 + o3 + 1, r2);
      e50 != V && i2.push(o3, o3 + t3.nodeSize, e50);
    }
  });
  let o2 = _s(a2 ? bs(e49) : e49, -n2).sort(Ss);
  for (let e50 = 0; e50 < o2.length; e50++) o2[e50].type.valid(t2, o2[e50]) || (r2.onRemove && r2.onRemove(o2[e50].spec), o2.splice(e50--, 1));
  return o2.length || i2.length ? new B(o2, i2) : V;
}
function Ss(e49, t2) {
  return e49.from - t2.from || e49.to - t2.to;
}
function Cs(e49) {
  let t2 = e49;
  for (let n2 = 0; n2 < t2.length - 1; n2++) {
    let r2 = t2[n2];
    if (r2.from != r2.to) for (let i2 = n2 + 1; i2 < t2.length; i2++) {
      let a2 = t2[i2];
      if (a2.from == r2.from) a2.to != r2.to && (t2 == e49 && (t2 = e49.slice()), t2[i2] = a2.copy(a2.from, r2.to), ws(t2, i2 + 1, a2.copy(r2.to, a2.to)));
      else {
        a2.from < r2.to && (t2 == e49 && (t2 = e49.slice()), t2[n2] = r2.copy(r2.from, a2.from), ws(t2, i2, r2.copy(a2.from, r2.to)));
        break;
      }
    }
  }
  return t2;
}
function ws(e49, t2, n2) {
  for (; t2 < e49.length && Ss(n2, e49[t2]) > 0; ) t2++;
  e49.splice(t2, 0, n2);
}
function Ts(e49) {
  let t2 = [];
  return e49.someProp("decorations", (n2) => {
    let r2 = n2(e49.state);
    r2 && r2 != V && t2.push(r2);
  }), e49.cursorWrapper && t2.push(B.create(e49.state.doc, [e49.cursorWrapper.deco])), hs.from(t2);
}
var Es = { childList: !0, characterData: !0, characterDataOldValue: !0, attributes: !0, attributeOldValue: !0, subtree: !0 };
var Ds = F && ai <= 11;
var Os = class {
  constructor() {
    this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0;
  }
  set(e49) {
    this.anchorNode = e49.anchorNode, this.anchorOffset = e49.anchorOffset, this.focusNode = e49.focusNode, this.focusOffset = e49.focusOffset;
  }
  clear() {
    this.anchorNode = this.focusNode = null;
  }
  eq(e49) {
    return e49.anchorNode == this.anchorNode && e49.anchorOffset == this.anchorOffset && e49.focusNode == this.focusNode && e49.focusOffset == this.focusOffset;
  }
};
var ks = class {
  constructor(e49, t2) {
    this.view = e49, this.handleDOMChange = t2, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new Os(), this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver((t3) => {
      for (let e50 = 0; e50 < t3.length; e50++) this.queue.push(t3[e50]);
      F && ai <= 11 && t3.some((e50) => e50.type == "childList" && e50.removedNodes.length || e50.type == "characterData" && e50.oldValue.length > e50.target.nodeValue.length) ? this.flushSoon() : L && e49.composing && t3.some((e50) => e50.type == "childList" && e50.target.nodeName == "TR") ? (e49.input.badSafariComposition = !0, this.flushSoon()) : this.flush();
    }), Ds && (this.onCharData = (e50) => {
      this.queue.push({ target: e50.target, type: "characterData", oldValue: e50.prevValue }), this.flushSoon();
    }), this.onSelectionChange = this.onSelectionChange.bind(this);
  }
  flushSoon() {
    this.flushingSoon < 0 && (this.flushingSoon = window.setTimeout(() => {
      this.flushingSoon = -1, this.flush();
    }, 20));
  }
  forceFlush() {
    this.flushingSoon > -1 && (window.clearTimeout(this.flushingSoon), this.flushingSoon = -1, this.flush());
  }
  start() {
    this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, Es)), this.onCharData && this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.connectSelection();
  }
  stop() {
    if (this.observer) {
      let e49 = this.observer.takeRecords();
      if (e49.length) {
        for (let t2 = 0; t2 < e49.length; t2++) this.queue.push(e49[t2]);
        window.setTimeout(() => this.flush(), 20);
      }
      this.observer.disconnect();
    }
    this.onCharData && this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData), this.disconnectSelection();
  }
  connectSelection() {
    this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
  }
  disconnectSelection() {
    this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
  }
  suppressSelectionUpdates() {
    this.suppressingSelectionUpdates = !0, setTimeout(() => this.suppressingSelectionUpdates = !1, 50);
  }
  onSelectionChange() {
    if (Pa(this.view)) {
      if (this.suppressingSelectionUpdates) return wa(this.view);
      if (F && ai <= 11 && !this.view.state.selection.empty) {
        let e49 = this.view.domSelectionRange();
        if (e49.focusNode && Vr(e49.focusNode, e49.focusOffset, e49.anchorNode, e49.anchorOffset)) return this.flushSoon();
      }
      this.flush();
    }
  }
  setCurSelection() {
    this.currentSelection.set(this.view.domSelectionRange());
  }
  ignoreSelectionChange(e49) {
    if (!e49.focusNode) return !0;
    let t2 = /* @__PURE__ */ new Set(), n2;
    for (let n3 = e49.focusNode; n3; n3 = Lr(n3)) t2.add(n3);
    for (let r3 = e49.anchorNode; r3; r3 = Lr(r3)) if (t2.has(r3)) {
      n2 = r3;
      break;
    }
    let r2 = n2 && this.view.docView.nearestDesc(n2);
    if (r2 && r2.ignoreMutation({ type: "selection", target: n2.nodeType == 3 ? n2.parentNode : n2 })) return this.setCurSelection(), !0;
  }
  pendingRecords() {
    if (this.observer) for (let e49 of this.observer.takeRecords()) this.queue.push(e49);
    return this.queue;
  }
  flush() {
    let { view: e49 } = this;
    if (!e49.docView || this.flushingSoon > -1) return;
    let t2 = this.pendingRecords();
    t2.length && (this.queue = []);
    let n2 = e49.domSelectionRange(), r2 = !this.suppressingSelectionUpdates && !this.currentSelection.eq(n2) && Pa(e49) && !this.ignoreSelectionChange(n2), i2 = -1, a2 = -1, o2 = !1, s2 = [];
    if (e49.editable) for (let e50 = 0; e50 < t2.length; e50++) {
      let n3 = this.registerMutation(t2[e50], s2);
      n3 && (i2 = i2 < 0 ? n3.from : Math.min(n3.from, i2), a2 = a2 < 0 ? n3.to : Math.max(n3.to, a2), n3.typeOver && (o2 = !0));
    }
    if (s2.some((e50) => e50.nodeName == "BR") && (e49.input.lastKeyCode == 8 || e49.input.lastKeyCode == 46 || I && (e49.composing || e49.input.compositionEndedAt > Date.now() - 50) && t2.some((e50) => e50.type == "childList" && e50.removedNodes.length))) {
      for (let e50 of s2) if (e50.nodeName == "BR" && e50.parentNode) {
        let t3 = e50.nextSibling;
        for (; t3 && t3.nodeType == 1; ) {
          if (t3.contentEditable == "false") {
            e50.parentNode.removeChild(e50);
            break;
          }
          t3 = t3.firstChild;
        }
      }
    } else if (oi && s2.length) {
      let t3 = s2.filter((e50) => e50.nodeName == "BR");
      if (t3.length == 2) {
        let [e50, n3] = t3;
        e50.parentNode && e50.parentNode.parentNode == n3.parentNode ? n3.remove() : e50.remove();
      } else {
        let { focusNode: n3 } = this.currentSelection;
        for (let r3 of t3) {
          let t4 = r3.parentNode;
          t4 && t4.nodeName == "LI" && (!n3 || Fs(e49, n3) != t4) && r3.remove();
        }
      }
    }
    let c2 = null;
    i2 < 0 && r2 && e49.input.lastFocus > Date.now() - 200 && Math.max(e49.input.lastTouch, e49.input.lastClick.time) < Date.now() - 300 && Yr(n2) && (c2 = Sa(e49)) && c2.eq(k.near(e49.state.doc.resolve(0), 1)) ? (e49.input.lastFocus = 0, wa(e49), this.currentSelection.set(n2), e49.scrollToSelection()) : (i2 > -1 || r2) && (i2 > -1 && (e49.docView.markDirty(i2, a2), Ms(e49)), e49.input.badSafariComposition && (e49.input.badSafariComposition = !1, Is(e49, s2)), this.handleDOMChange(i2, a2, o2, s2), e49.docView && e49.docView.dirty ? e49.updateState(e49.state) : this.currentSelection.eq(n2) || wa(e49), this.currentSelection.set(n2));
  }
  registerMutation(e49, t2) {
    if (t2.indexOf(e49.target) > -1) return null;
    let n2 = this.view.docView.nearestDesc(e49.target);
    if (e49.type == "attributes" && (n2 == this.view.docView || e49.attributeName == "contenteditable" || e49.attributeName == "style" && !e49.oldValue && !e49.target.getAttribute("style")) || !n2 || n2.ignoreMutation(e49)) return null;
    if (e49.type == "childList") {
      for (let n3 = 0; n3 < e49.addedNodes.length; n3++) {
        let r3 = e49.addedNodes[n3];
        t2.push(r3), r3.nodeType == 3 && (this.lastChangedTextNode = r3);
      }
      if (n2.contentDOM && n2.contentDOM != n2.dom && !n2.contentDOM.contains(e49.target)) return { from: n2.posBefore, to: n2.posAfter };
      let r2 = e49.previousSibling, i2 = e49.nextSibling;
      if (F && ai <= 11 && e49.addedNodes.length) for (let t3 = 0; t3 < e49.addedNodes.length; t3++) {
        let { previousSibling: n3, nextSibling: a3 } = e49.addedNodes[t3];
        (!n3 || Array.prototype.indexOf.call(e49.addedNodes, n3) < 0) && (r2 = n3), (!a3 || Array.prototype.indexOf.call(e49.addedNodes, a3) < 0) && (i2 = a3);
      }
      let a2 = r2 && r2.parentNode == e49.target ? P(r2) + 1 : 0, o2 = n2.localPosFromDOM(e49.target, a2, -1), s2 = i2 && i2.parentNode == e49.target ? P(i2) : e49.target.childNodes.length;
      return { from: o2, to: n2.localPosFromDOM(e49.target, s2, 1) };
    }
    return e49.type == "attributes" ? { from: n2.posAtStart - n2.border, to: n2.posAtEnd + n2.border } : (this.lastChangedTextNode = e49.target, { from: n2.posAtStart, to: n2.posAtEnd, typeOver: e49.target.nodeValue == e49.oldValue });
  }
};
var As = /* @__PURE__ */ new WeakMap();
var js = !1;
function Ms(e49) {
  if (!As.has(e49) && (As.set(e49, null), ["normal", "nowrap", "pre-line"].indexOf(getComputedStyle(e49.dom).whiteSpace) !== -1)) {
    if (e49.requiresGeckoHackNode = oi, js) return;
    console.warn("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."), js = !0;
  }
}
function Ns(e49, t2) {
  let n2 = t2.startContainer, r2 = t2.startOffset, i2 = t2.endContainer, a2 = t2.endOffset, o2 = e49.domAtPos(e49.state.selection.anchor);
  return Vr(o2.node, o2.offset, i2, a2) && ([n2, r2, i2, a2] = [i2, a2, n2, r2]), { anchorNode: n2, anchorOffset: r2, focusNode: i2, focusOffset: a2 };
}
function Ps(e49, t2) {
  if (t2.getComposedRanges) {
    let n3 = t2.getComposedRanges(e49.root)[0];
    if (n3) return Ns(e49, n3);
  }
  let n2;
  function r2(e50) {
    e50.preventDefault(), e50.stopImmediatePropagation(), n2 = e50.getTargetRanges()[0];
  }
  return e49.dom.addEventListener("beforeinput", r2, !0), document.execCommand("indent"), e49.dom.removeEventListener("beforeinput", r2, !0), n2 ? Ns(e49, n2) : null;
}
function Fs(e49, t2) {
  for (let n2 = t2.parentNode; n2 && n2 != e49.dom; n2 = n2.parentNode) {
    let t3 = e49.docView.nearestDesc(n2, !0);
    if (t3 && t3.node.isBlock) return n2;
  }
  return null;
}
function Is(e49, t2) {
  let { focusNode: n2, focusOffset: r2 } = e49.domSelectionRange();
  for (let i2 of t2) if (i2.parentNode?.nodeName == "TR") {
    let t3 = i2.nextSibling;
    for (; t3 && t3.nodeName != "TD" && t3.nodeName != "TH"; ) t3 = t3.nextSibling;
    if (t3) {
      let a2 = t3;
      for (; ; ) {
        let e50 = a2.firstChild;
        if (!e50 || e50.nodeType != 1 || e50.contentEditable == "false" || /^(BR|IMG)$/.test(e50.nodeName)) break;
        a2 = e50;
      }
      a2.insertBefore(i2, a2.firstChild), n2 == i2 && e49.domSelection().collapse(i2, r2);
    } else i2.parentNode.removeChild(i2);
  }
}
function Ls(e49, t2, n2) {
  let { node: r2, fromOffset: i2, toOffset: a2, from: o2, to: s2 } = e49.docView.parseRange(t2, n2), c2 = e49.domSelectionRange(), l2, u2 = c2.anchorNode;
  if (u2 && e49.dom.contains(u2.nodeType == 1 ? u2 : u2.parentNode) && (l2 = [{ node: u2, offset: c2.anchorOffset }], Yr(c2) || l2.push({ node: c2.focusNode, offset: c2.focusOffset })), I && e49.input.lastKeyCode === 8) for (let e50 = a2; e50 > i2; e50--) {
    let t3 = r2.childNodes[e50 - 1], n3 = t3.pmViewDesc;
    if (t3.nodeName == "BR" && !n3) {
      a2 = e50;
      break;
    }
    if (!n3 || n3.size) break;
  }
  let d2 = e49.state.doc, f2 = e49.someProp("domParser") || qe.fromSchema(e49.state.schema), p2 = d2.resolve(o2), m2 = null, h2 = f2.parse(r2, { topNode: p2.parent, topMatch: p2.parent.contentMatchAt(p2.index()), topOpen: !0, from: i2, to: a2, preserveWhitespace: p2.parent.type.whitespace != "pre" || "full", findPositions: l2, ruleFromNode: Rs, context: p2 });
  if (l2 && l2[0].pos != null) {
    let e50 = l2[0].pos, t3 = l2[1] && l2[1].pos;
    t3 ??= e50, m2 = { anchor: e50 + o2, head: t3 + o2 };
  }
  return { doc: h2, sel: m2, from: o2, to: s2 };
}
function Rs(e49) {
  let t2 = e49.pmViewDesc;
  if (t2) return t2.parseRule();
  if (e49.nodeName == "BR" && e49.parentNode) {
    if (L && /^(ul|ol)$/i.test(e49.parentNode.nodeName)) {
      let e50 = document.createElement("div");
      return e50.appendChild(document.createElement("li")), { skip: e50 };
    }
    if (e49.parentNode.lastChild == e49 || L && /^(tr|table)$/i.test(e49.parentNode.nodeName)) return { ignore: !0 };
  } else if (e49.nodeName == "IMG" && e49.getAttribute("mark-placeholder")) return { ignore: !0 };
  return null;
}
var zs = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function Bs(e49, t2, n2, r2, i2) {
  let a2 = e49.input.compositionPendingChanges || (e49.composing ? e49.input.compositionID : 0);
  if (e49.input.compositionPendingChanges = 0, t2 < 0) {
    let t3 = e49.input.lastSelectionTime > Date.now() - 50 ? e49.input.lastSelectionOrigin : null, n3 = Sa(e49, t3);
    if (n3 && !e49.state.selection.eq(n3)) {
      if (I && fi && e49.input.lastKeyCode === 13 && Date.now() - 100 < e49.input.lastKeyCodeTime && e49.someProp("handleKeyDown", (t4) => t4(e49, Xr(13, "Enter")))) return;
      let r3 = e49.state.tr.setSelection(n3);
      t3 == "pointer" ? r3.setMeta("pointer", !0) : t3 == "key" && r3.scrollIntoView(), a2 && r3.setMeta("composition", a2), e49.dispatch(r3);
    }
    return;
  }
  let o2 = e49.state.doc.resolve(t2), s2 = o2.sharedDepth(n2);
  t2 = o2.before(s2 + 1), n2 = e49.state.doc.resolve(n2).after(s2 + 1);
  let c2 = e49.state.selection, l2 = Ls(e49, t2, n2), u2 = e49.state.doc, d2 = u2.slice(l2.from, l2.to), f2, p2;
  e49.input.lastKeyCode === 8 && Date.now() - 100 < e49.input.lastKeyCodeTime ? (f2 = e49.state.selection.to, p2 = "end") : (f2 = e49.state.selection.from, p2 = "start"), e49.input.lastKeyCode = null;
  let m2 = Gs(d2.content, l2.doc.content, l2.from, f2, p2);
  if (m2 && e49.input.domChangeCount++, (li && e49.input.lastIOSEnter > Date.now() - 225 || fi) && i2.some((e50) => e50.nodeType == 1 && !zs.test(e50.nodeName)) && (!m2 || m2.endA >= m2.endB) && e49.someProp("handleKeyDown", (t3) => t3(e49, Xr(13, "Enter")))) {
    e49.input.lastIOSEnter = 0;
    return;
  }
  if (!m2)
    if (r2 && c2 instanceof A && !c2.empty && c2.$head.sameParent(c2.$anchor) && !e49.composing && !(l2.sel && l2.sel.anchor != l2.sel.head)) m2 = { start: c2.from, endA: c2.to, endB: c2.to };
    else {
      if (l2.sel) {
        let t3 = Vs(e49, e49.state.doc, l2.sel);
        if (t3 && !t3.eq(e49.state.selection)) {
          let n3 = e49.state.tr.setSelection(t3);
          a2 && n3.setMeta("composition", a2), e49.dispatch(n3);
        }
      }
      return;
    }
  e49.state.selection.from < e49.state.selection.to && m2.start == m2.endB && e49.state.selection instanceof A && (m2.start > e49.state.selection.from && m2.start <= e49.state.selection.from + 2 && e49.state.selection.from >= l2.from ? m2.start = e49.state.selection.from : m2.endA < e49.state.selection.to && m2.endA >= e49.state.selection.to - 2 && e49.state.selection.to <= l2.to && (m2.endB += e49.state.selection.to - m2.endA, m2.endA = e49.state.selection.to)), F && ai <= 11 && m2.endB == m2.start + 1 && m2.endA == m2.start && m2.start > l2.from && l2.doc.textBetween(m2.start - l2.from - 1, m2.start - l2.from + 1) == " \xA0" && (m2.start--, m2.endA--, m2.endB--);
  let h2 = l2.doc.resolveNoCache(m2.start - l2.from), g2 = l2.doc.resolveNoCache(m2.endB - l2.from), _2 = u2.resolve(m2.start), v2 = h2.sameParent(g2) && h2.parent.inlineContent && _2.end() >= m2.endA;
  if ((li && e49.input.lastIOSEnter > Date.now() - 225 && (!v2 || i2.some((e50) => e50.nodeName == "DIV" || e50.nodeName == "P")) || !v2 && h2.pos < l2.doc.content.size && (!h2.sameParent(g2) || !h2.parent.inlineContent) && h2.pos < g2.pos && !/\S/.test(l2.doc.textBetween(h2.pos, g2.pos, "", ""))) && e49.someProp("handleKeyDown", (t3) => t3(e49, Xr(13, "Enter")))) {
    e49.input.lastIOSEnter = 0;
    return;
  }
  if (e49.state.selection.anchor > m2.start && Us(u2, m2.start, m2.endA, h2, g2) && e49.someProp("handleKeyDown", (t3) => t3(e49, Xr(8, "Backspace")))) {
    fi && I && e49.domObserver.suppressSelectionUpdates();
    return;
  }
  I && m2.endB == m2.start && (e49.input.lastChromeDelete = Date.now()), fi && !v2 && h2.start() != g2.start() && g2.parentOffset == 0 && h2.depth == g2.depth && l2.sel && l2.sel.anchor == l2.sel.head && l2.sel.head == m2.endA && (m2.endB -= 2, g2 = l2.doc.resolveNoCache(m2.endB - l2.from), setTimeout(() => {
    e49.someProp("handleKeyDown", function(t3) {
      return t3(e49, Xr(13, "Enter"));
    });
  }, 20));
  let y2 = m2.start, b2 = m2.endA, x2 = (t3) => {
    let n3 = t3 || e49.state.tr.replace(y2, b2, l2.doc.slice(m2.start - l2.from, m2.endB - l2.from));
    if (l2.sel) {
      let t4 = Vs(e49, n3.doc, l2.sel);
      t4 && !(I && e49.composing && t4.empty && (m2.start != m2.endB || e49.input.lastChromeDelete < Date.now() - 100) && (t4.head == y2 || t4.head == n3.mapping.map(b2) - 1) || F && t4.empty && t4.head == y2) && n3.setSelection(t4);
    }
    return a2 && n3.setMeta("composition", a2), n3.scrollIntoView();
  }, S2;
  if (v2)
    if (h2.pos == g2.pos) {
      F && ai <= 11 && h2.parentOffset == 0 && (e49.domObserver.suppressSelectionUpdates(), setTimeout(() => wa(e49), 20));
      let t3 = x2(e49.state.tr.delete(y2, b2)), n3 = u2.resolve(m2.start).marksAcross(u2.resolve(m2.endA));
      n3 && t3.ensureMarks(n3), e49.dispatch(t3);
    } else if (m2.endA == m2.endB && (S2 = Hs(h2.parent.content.cut(h2.parentOffset, g2.parentOffset), _2.parent.content.cut(_2.parentOffset, m2.endA - _2.start())))) {
      let t3 = x2(e49.state.tr);
      S2.type == "add" ? t3.addMark(y2, b2, S2.mark) : t3.removeMark(y2, b2, S2.mark), e49.dispatch(t3);
    } else if (h2.parent.child(h2.index()).isText && h2.index() == g2.index() - +!g2.textOffset) {
      let t3 = h2.parent.textBetween(h2.parentOffset, g2.parentOffset), n3 = () => x2(e49.state.tr.insertText(t3, y2, b2));
      e49.someProp("handleTextInput", (r3) => r3(e49, y2, b2, t3, n3)) || e49.dispatch(n3());
    } else e49.dispatch(x2());
  else e49.dispatch(x2());
}
function Vs(e49, t2, n2) {
  return Math.max(n2.anchor, n2.head) > t2.content.size ? null : Na(e49, t2.resolve(n2.anchor), t2.resolve(n2.head));
}
function Hs(e49, t2) {
  let n2 = e49.firstChild.marks, r2 = t2.firstChild.marks, i2 = n2, a2 = r2, o2, s2, c2;
  for (let e50 = 0; e50 < r2.length; e50++) i2 = r2[e50].removeFromSet(i2);
  for (let e50 = 0; e50 < n2.length; e50++) a2 = n2[e50].removeFromSet(a2);
  if (i2.length == 1 && a2.length == 0) s2 = i2[0], o2 = "add", c2 = (e50) => e50.mark(s2.addToSet(e50.marks));
  else if (i2.length == 0 && a2.length == 1) s2 = a2[0], o2 = "remove", c2 = (e50) => e50.mark(s2.removeFromSet(e50.marks));
  else return null;
  let l2 = [];
  for (let e50 = 0; e50 < t2.childCount; e50++) l2.push(c2(t2.child(e50)));
  if (y.from(l2).eq(e49)) return { mark: s2, type: o2 };
}
function Us(e49, t2, n2, r2, i2) {
  if (n2 - t2 <= i2.pos - r2.pos || Ws(r2, !0, !1) < i2.pos) return !1;
  let a2 = e49.resolve(t2);
  if (!r2.parent.isTextblock) {
    let e50 = a2.nodeAfter;
    return e50 != null && n2 == t2 + e50.nodeSize;
  }
  if (a2.parentOffset < a2.parent.content.size || !a2.parent.isTextblock) return !1;
  let o2 = e49.resolve(Ws(a2, !0, !0));
  return !o2.parent.isTextblock || o2.pos > n2 || Ws(o2, !0, !1) < n2 ? !1 : r2.parent.content.cut(r2.parentOffset).eq(o2.parent.content);
}
function Ws(e49, t2, n2) {
  let r2 = e49.depth, i2 = t2 ? e49.end() : e49.pos;
  for (; r2 > 0 && (t2 || e49.indexAfter(r2) == e49.node(r2).childCount); ) r2--, i2++, t2 = !1;
  if (n2) {
    let t3 = e49.node(r2).maybeChild(e49.indexAfter(r2));
    for (; t3 && !t3.isLeaf; ) t3 = t3.firstChild, i2++;
  }
  return i2;
}
function Gs(e49, t2, n2, r2, i2) {
  let a2 = e49.findDiffStart(t2, n2), o2 = n2 + e49.size, s2 = n2 + t2.size;
  if (a2 == null) return null;
  let { a: c2, b: l2 } = e49.findDiffEnd(t2, o2, s2);
  if (i2 == "end") {
    let e50 = Math.max(0, a2 - Math.min(c2, l2));
    r2 -= c2 + e50 - a2;
  }
  if (c2 < a2 && o2 < s2) {
    let e50 = r2 <= a2 && r2 >= c2 ? a2 - r2 : 0;
    a2 -= e50, l2 = a2 + (l2 - c2), c2 = a2;
  } else if (l2 < a2) {
    let e50 = r2 <= a2 && r2 >= l2 ? a2 - r2 : 0;
    a2 -= e50, c2 = a2 + (c2 - l2), l2 = a2;
  }
  return { start: a2, endA: c2, endB: l2 };
}
var Ks = class {
  constructor(e49, t2) {
    this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new bo(), this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = t2, this.state = t2.state, this.directPlugins = t2.plugins || [], this.directPlugins.forEach($s), this.dispatch = this.dispatch.bind(this), this.dom = e49 && e49.mount || document.createElement("div"), e49 && (e49.appendChild ? e49.appendChild(this.dom) : typeof e49 == "function" ? e49(this.dom) : e49.mount && (this.mounted = !0)), this.editable = Ys(this), Js(this), this.nodeViews = Zs(this), this.docView = na(this.state.doc, qs(this), Ts(this), this.dom, this), this.domObserver = new ks(this, (e50, t3, n2, r2) => Bs(this, e50, t3, n2, r2)), this.domObserver.start(), xo(this), this.updatePluginViews();
  }
  get composing() {
    return this.input.composing;
  }
  get props() {
    if (this._props.state != this.state) {
      let e49 = this._props;
      this._props = {};
      for (let t2 in e49) this._props[t2] = e49[t2];
      this._props.state = this.state;
    }
    return this._props;
  }
  update(e49) {
    e49.handleDOMEvents != this._props.handleDOMEvents && wo(this);
    let t2 = this._props;
    this._props = e49, e49.plugins && (e49.plugins.forEach($s), this.directPlugins = e49.plugins), this.updateStateInner(e49.state, t2);
  }
  setProps(e49) {
    let t2 = {};
    for (let e50 in this._props) t2[e50] = this._props[e50];
    t2.state = this.state;
    for (let n2 in e49) t2[n2] = e49[n2];
    this.update(t2);
  }
  updateState(e49) {
    this.updateStateInner(e49, this._props);
  }
  updateStateInner(e49, t2) {
    let n2 = this.state, r2 = !1, i2 = !1;
    e49.storedMarks && this.composing && (Jo(this), i2 = !0), this.state = e49;
    let a2 = n2.plugins != e49.plugins || this._props.plugins != t2.plugins;
    if (a2 || this._props.plugins != t2.plugins || this._props.nodeViews != t2.nodeViews) {
      let e50 = Zs(this);
      Qs(e50, this.nodeViews) && (this.nodeViews = e50, r2 = !0);
    }
    (a2 || t2.handleDOMEvents != this._props.handleDOMEvents) && wo(this), this.editable = Ys(this), Js(this);
    let o2 = Ts(this), s2 = qs(this), c2 = n2.plugins != e49.plugins && !n2.doc.eq(e49.doc) ? "reset" : e49.scrollToSelection > n2.scrollToSelection ? "to selection" : "preserve", l2 = r2 || !this.docView.matchesNode(e49.doc, s2, o2);
    (l2 || !e49.selection.eq(n2.selection)) && (i2 = !0);
    let u2 = c2 == "preserve" && i2 && this.dom.style.overflowAnchor == null && yi(this);
    if (i2) {
      this.domObserver.stop();
      let t3 = l2 && (F || I) && !this.composing && !n2.selection.empty && !e49.selection.empty && Xs(n2.selection, e49.selection);
      if (l2) {
        let n3 = I ? this.trackWrites = this.domSelectionRange().focusNode : null;
        this.composing && (this.input.compositionNode = Yo(this)), (r2 || !this.docView.update(e49.doc, s2, o2, this)) && (this.docView.updateOuterDeco(s2), this.docView.destroy(), this.docView = na(e49.doc, s2, o2, this.dom, this)), !n3 || this.trackWrites && this.dom.contains(this.trackWrites) || (t3 = !0);
      }
      let i3 = this.input.mouseDown;
      t3 || !(i3 && this.domObserver.currentSelection.eq(this.domSelectionRange()) && Ia(this) && i3.delaySelUpdate()) ? wa(this, t3) : (ja(this, e49.selection), this.domObserver.setCurSelection()), this.domObserver.start();
    }
    this.updatePluginViews(n2), this.dragging?.node && !n2.doc.eq(e49.doc) && this.updateDraggedNode(this.dragging, n2), c2 == "reset" ? this.dom.scrollTop = 0 : c2 == "to selection" ? this.scrollToSelection() : u2 && xi(u2);
  }
  scrollToSelection() {
    let e49 = this.domSelectionRange().focusNode;
    if (e49 && this.dom.contains(e49.nodeType == 1 ? e49 : e49.parentNode) && !this.someProp("handleScrollToSelection", (e50) => e50(this)))
      if (this.state.selection instanceof j) {
        let t2 = this.docView.domAfterPos(this.state.selection.from);
        t2.nodeType == 1 && vi(this, t2.getBoundingClientRect(), e49);
      } else vi(this, this.coordsAtPos(this.state.selection.head, 1), e49);
  }
  destroyPluginViews() {
    let e49;
    for (; e49 = this.pluginViews.pop(); ) e49.destroy && e49.destroy();
  }
  updatePluginViews(e49) {
    if (!e49 || e49.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
      this.prevDirectPlugins = this.directPlugins, this.destroyPluginViews();
      for (let e50 = 0; e50 < this.directPlugins.length; e50++) {
        let t2 = this.directPlugins[e50];
        t2.spec.view && this.pluginViews.push(t2.spec.view(this));
      }
      for (let e50 = 0; e50 < this.state.plugins.length; e50++) {
        let t2 = this.state.plugins[e50];
        t2.spec.view && this.pluginViews.push(t2.spec.view(this));
      }
    } else for (let t2 = 0; t2 < this.pluginViews.length; t2++) {
      let n2 = this.pluginViews[t2];
      n2.update && n2.update(this, e49);
    }
  }
  updateDraggedNode(e49, t2) {
    let n2 = e49.node, r2 = -1;
    if (n2.from < this.state.doc.content.size && this.state.doc.nodeAt(n2.from) == n2.node) r2 = n2.from;
    else {
      let e50 = n2.from + (this.state.doc.content.size - t2.doc.content.size);
      (e50 > 0 && e50 < this.state.doc.content.size && this.state.doc.nodeAt(e50)) == n2.node && (r2 = e50);
    }
    this.dragging = new rs(e49.slice, e49.move, r2 < 0 ? void 0 : j.create(this.state.doc, r2));
  }
  someProp(e49, t2) {
    let n2 = this._props && this._props[e49], r2;
    if (n2 != null && (r2 = t2 ? t2(n2) : n2)) return r2;
    for (let n3 = 0; n3 < this.directPlugins.length; n3++) {
      let i3 = this.directPlugins[n3].props[e49];
      if (i3 != null && (r2 = t2 ? t2(i3) : i3)) return r2;
    }
    let i2 = this.state.plugins;
    if (i2) for (let n3 = 0; n3 < i2.length; n3++) {
      let a2 = i2[n3].props[e49];
      if (a2 != null && (r2 = t2 ? t2(a2) : a2)) return r2;
    }
  }
  hasFocus() {
    if (F) {
      let e49 = this.root.activeElement;
      if (e49 == this.dom) return !0;
      if (!e49 || !this.dom.contains(e49)) return !1;
      for (; e49 && this.dom != e49 && this.dom.contains(e49); ) {
        if (e49.contentEditable == "false") return !1;
        e49 = e49.parentElement;
      }
      return !0;
    }
    return this.root.activeElement == this.dom;
  }
  focus() {
    this.domObserver.stop(), this.editable && wi(this.dom), wa(this), this.domObserver.start();
  }
  get root() {
    let e49 = this._root;
    if (e49 == null) {
      for (let e50 = this.dom.parentNode; e50; e50 = e50.parentNode) if (e50.nodeType == 9 || e50.nodeType == 11 && e50.host) return e50.getSelection || (Object.getPrototypeOf(e50).getSelection = () => e50.ownerDocument.getSelection()), this._root = e50;
    }
    return e49 || document;
  }
  updateRoot() {
    this._root = null;
  }
  posAtCoords(e49) {
    return Mi(this, e49);
  }
  coordsAtPos(e49, t2 = 1) {
    return Ii(this, e49, t2);
  }
  domAtPos(e49, t2 = 0) {
    return this.docView.domFromPos(e49, t2);
  }
  nodeDOM(e49) {
    let t2 = this.docView.descAt(e49);
    return t2 ? t2.nodeDOM : null;
  }
  posAtDOM(e49, t2, n2 = -1) {
    let r2 = this.docView.posFromDOM(e49, t2, n2);
    if (r2 == null) throw RangeError("DOM position not inside the editor");
    return r2;
  }
  endOfTextblock(e49, t2) {
    return Ki(this, t2 || this.state, e49);
  }
  pasteHTML(e49, t2) {
    return ts(this, "", e49, !1, t2 || new ClipboardEvent("paste"));
  }
  pasteText(e49, t2) {
    return ts(this, e49, null, !0, t2 || new ClipboardEvent("paste"));
  }
  serializeForClipboard(e49) {
    return no(this, e49);
  }
  destroy() {
    this.docView && (Co(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], Ts(this), this), this.dom.textContent = "") : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, Br());
  }
  get isDestroyed() {
    return this.docView == null;
  }
  dispatchEvent(e49) {
    return Do(this, e49);
  }
  domSelectionRange() {
    let e49 = this.domSelection();
    return e49 ? L && this.root.nodeType === 11 && Zr(this.dom.ownerDocument) == this.dom && Ps(this, e49) || e49 : { focusNode: null, focusOffset: 0, anchorNode: null, anchorOffset: 0 };
  }
  domSelection() {
    return this.root.getSelection();
  }
};
Ks.prototype.dispatch = function(e49) {
  let t2 = this._props.dispatchTransaction;
  t2 ? t2.call(this, e49) : this.updateState(this.state.apply(e49));
};
function qs(e49) {
  let t2 = /* @__PURE__ */ Object.create(null);
  return t2.class = "ProseMirror", t2.contenteditable = String(e49.editable), e49.someProp("attributes", (n2) => {
    if (typeof n2 == "function" && (n2 = n2(e49.state)), n2) for (let e50 in n2) e50 == "class" ? t2.class += " " + n2[e50] : e50 == "style" ? t2.style = (t2.style ? t2.style + ";" : "") + n2[e50] : !t2[e50] && e50 != "contenteditable" && e50 != "nodeName" && (t2[e50] = String(n2[e50]));
  }), t2.translate ||= "no", [fs.node(0, e49.state.doc.content.size, t2)];
}
function Js(e49) {
  if (e49.markCursor) {
    let t2 = document.createElement("img");
    t2.className = "ProseMirror-separator", t2.setAttribute("mark-placeholder", "true"), t2.setAttribute("alt", ""), e49.cursorWrapper = { dom: t2, deco: fs.widget(e49.state.selection.from, t2, { raw: !0, marks: e49.markCursor }) };
  } else e49.cursorWrapper = null;
}
function Ys(e49) {
  return !e49.someProp("editable", (t2) => t2(e49.state) === !1);
}
function Xs(e49, t2) {
  let n2 = Math.min(e49.$anchor.sharedDepth(e49.head), t2.$anchor.sharedDepth(t2.head));
  return e49.$anchor.start(n2) != t2.$anchor.start(n2);
}
function Zs(e49) {
  let t2 = /* @__PURE__ */ Object.create(null);
  function n2(e50) {
    for (let n3 in e50) Object.prototype.hasOwnProperty.call(t2, n3) || (t2[n3] = e50[n3]);
  }
  return e49.someProp("nodeViews", n2), e49.someProp("markViews", n2), t2;
}
function Qs(e49, t2) {
  let n2 = 0, r2 = 0;
  for (let r3 in e49) {
    if (e49[r3] != t2[r3]) return !0;
    n2++;
  }
  for (let e50 in t2) r2++;
  return n2 != r2;
}
function $s(e49) {
  if (e49.spec.state || e49.spec.filterTransaction || e49.spec.appendTransaction) throw RangeError("Plugins passed directly to the view must not have a state component");
}
var ec = typeof navigator < "u" && /Mac|iP(hone|[oa]d)/.test(navigator.platform);
var tc = typeof navigator < "u" && /Win/.test(navigator.platform);
function nc(e49) {
  let t2 = e49.split(/-(?!$)/), n2 = t2[t2.length - 1];
  n2 == "Space" && (n2 = " ");
  let r2, i2, a2, o2;
  for (let e50 = 0; e50 < t2.length - 1; e50++) {
    let n3 = t2[e50];
    if (/^(cmd|meta|m)$/i.test(n3)) o2 = !0;
    else if (/^a(lt)?$/i.test(n3)) r2 = !0;
    else if (/^(c|ctrl|control)$/i.test(n3)) i2 = !0;
    else if (/^s(hift)?$/i.test(n3)) a2 = !0;
    else if (/^mod$/i.test(n3)) ec ? o2 = !0 : i2 = !0;
    else throw Error("Unrecognized modifier name: " + n3);
  }
  return r2 && (n2 = "Alt-" + n2), i2 && (n2 = "Ctrl-" + n2), o2 && (n2 = "Meta-" + n2), a2 && (n2 = "Shift-" + n2), n2;
}
function rc(e49) {
  let t2 = /* @__PURE__ */ Object.create(null);
  for (let n2 in e49) t2[nc(n2)] = e49[n2];
  return t2;
}
function ic(e49, t2, n2 = !0) {
  return t2.altKey && (e49 = "Alt-" + e49), t2.ctrlKey && (e49 = "Ctrl-" + e49), t2.metaKey && (e49 = "Meta-" + e49), n2 && t2.shiftKey && (e49 = "Shift-" + e49), e49;
}
function ac(e49) {
  return new M({ props: { handleKeyDown: oc(e49) } });
}
function oc(e49) {
  let t2 = rc(e49);
  return function(e50, n2) {
    let r2 = f(n2), i2, a2 = t2[ic(r2, n2)];
    if (a2 && a2(e50.state, e50.dispatch, e50)) return !0;
    if (r2.length == 1 && r2 != " ") {
      if (n2.shiftKey) {
        let i3 = t2[ic(r2, n2, !1)];
        if (i3 && i3(e50.state, e50.dispatch, e50)) return !0;
      }
      if ((n2.altKey || n2.metaKey || n2.ctrlKey) && !(tc && n2.ctrlKey && n2.altKey) && (i2 = p[n2.keyCode]) && i2 != r2) {
        let r3 = t2[ic(i2, n2)];
        if (r3 && r3(e50.state, e50.dispatch, e50)) return !0;
      }
    }
    return !1;
  };
}
var sc = Object.defineProperty;
var cc = (e49, t2) => {
  for (var n2 in t2) sc(e49, n2, { get: t2[n2], enumerable: !0 });
};
function lc(e49) {
  let { state: t2, transaction: n2 } = e49, { selection: r2 } = n2, { doc: i2 } = n2, { storedMarks: a2 } = n2;
  return { ...t2, apply: t2.apply.bind(t2), applyTransaction: t2.applyTransaction.bind(t2), plugins: t2.plugins, schema: t2.schema, reconfigure: t2.reconfigure.bind(t2), toJSON: t2.toJSON.bind(t2), get storedMarks() {
    return a2;
  }, get selection() {
    return r2;
  }, get doc() {
    return i2;
  }, get tr() {
    return r2 = n2.selection, i2 = n2.doc, a2 = n2.storedMarks, n2;
  } };
}
var uc = class {
  constructor(e49) {
    this.editor = e49.editor, this.rawCommands = this.editor.extensionManager.commands, this.customState = e49.state;
  }
  get hasCustomState() {
    return !!this.customState;
  }
  get state() {
    return this.customState || this.editor.state;
  }
  get commands() {
    let { rawCommands: e49, editor: t2, state: n2 } = this, { view: r2 } = t2, { tr: i2 } = n2, a2 = this.buildProps(i2);
    return Object.fromEntries(Object.entries(e49).map(([e50, t3]) => [e50, (...e51) => {
      let n3 = t3(...e51)(a2);
      return !i2.getMeta("preventDispatch") && !this.hasCustomState && r2.dispatch(i2), n3;
    }]));
  }
  get chain() {
    return () => this.createChain();
  }
  get can() {
    return () => this.createCan();
  }
  createChain(e49, t2 = !0) {
    let { rawCommands: n2, editor: r2, state: i2 } = this, { view: a2 } = r2, o2 = [], s2 = !!e49, c2 = e49 || i2.tr, l2 = () => (!s2 && t2 && !c2.getMeta("preventDispatch") && !this.hasCustomState && a2.dispatch(c2), o2.every((e50) => e50 === !0)), u2 = { ...Object.fromEntries(Object.entries(n2).map(([e50, n3]) => [e50, (...e51) => {
      let r3 = this.buildProps(c2, t2), i3 = n3(...e51)(r3);
      return o2.push(i3), u2;
    }])), run: l2 };
    return u2;
  }
  createCan(e49) {
    let { rawCommands: t2, state: n2 } = this, r2 = e49 || n2.tr, i2 = this.buildProps(r2, !1);
    return { ...Object.fromEntries(Object.entries(t2).map(([e50, t3]) => [e50, (...e51) => t3(...e51)({ ...i2, dispatch: void 0 })])), chain: () => this.createChain(r2, !1) };
  }
  buildProps(e49, t2 = !0) {
    let { rawCommands: n2, editor: r2, state: i2 } = this, { view: a2 } = r2, o2 = { tr: e49, editor: r2, view: a2, state: lc({ state: i2, transaction: e49 }), dispatch: t2 ? () => {
    } : void 0, chain: () => this.createChain(e49, t2), can: () => this.createCan(e49), get commands() {
      return Object.fromEntries(Object.entries(n2).map(([e50, t3]) => [e50, (...e51) => t3(...e51)(o2)]));
    } };
    return o2;
  }
};
var dc = {};
cc(dc, { blur: () => fc, clearContent: () => pc, clearNodes: () => mc, command: () => hc, createParagraphNear: () => gc, cut: () => _c, deleteCurrentNode: () => vc, deleteNode: () => yc, deleteRange: () => bc, deleteSelection: () => wc, enter: () => Tc, exitCode: () => Ec, extendMarkRange: () => Nc, first: () => Pc, focus: () => Vc, forEach: () => Hc, insertContent: () => Uc, insertContentAt: () => Yc, joinBackward: () => Qc, joinDown: () => Zc, joinForward: () => $c, joinItemBackward: () => el, joinItemForward: () => tl, joinTextblockBackward: () => nl, joinTextblockForward: () => rl, joinUp: () => Xc, keyboardShortcut: () => ol, lift: () => cl, liftEmptyBlock: () => ll, liftListItem: () => ul, newlineInCode: () => dl, resetAttributes: () => ml, scrollIntoView: () => hl, selectAll: () => gl, selectNodeBackward: () => _l, selectNodeForward: () => vl, selectParentNode: () => yl, selectTextblockEnd: () => bl, selectTextblockStart: () => xl, setContent: () => Cl, setMark: () => vu, setMeta: () => yu, setNode: () => bu, setNodeSelection: () => xu, setTextDirection: () => Su, setTextSelection: () => Cu, sinkListItem: () => wu, splitBlock: () => Eu, splitListItem: () => Du, toggleList: () => Nu, toggleMark: () => Pu, toggleNode: () => Fu, toggleWrap: () => Iu, undoInputRule: () => Lu, unsetAllMarks: () => Ru, unsetMark: () => zu, unsetTextDirection: () => Bu, updateAttributes: () => Vu, wrapIn: () => Hu, wrapInList: () => Uu });
var fc = () => ({ editor: e49, view: t2 }) => (requestAnimationFrame(() => {
  var n2;
  e49.isDestroyed || (t2.dom.blur(), (n2 = window?.getSelection()) == null || n2.removeAllRanges());
}), !0);
var pc = (e49 = !0) => ({ commands: t2 }) => t2.setContent("", { emitUpdate: e49 });
var mc = () => ({ state: e49, tr: t2, dispatch: n2 }) => {
  let { selection: r2 } = t2, { ranges: i2 } = r2;
  return n2 && i2.forEach(({ $from: n3, $to: r3 }) => {
    e49.doc.nodesBetween(n3.pos, r3.pos, (e50, n4) => {
      if (e50.type.isText) return;
      let { doc: r4, mapping: i3 } = t2, a2 = r4.resolve(i3.map(n4)), o2 = r4.resolve(i3.map(n4 + e50.nodeSize)), s2 = a2.blockRange(o2);
      if (!s2) return;
      let c2 = Rt(s2);
      if (e50.type.isTextblock) {
        let { defaultType: e51 } = a2.parent.contentMatchAt(a2.index());
        t2.setNodeMarkup(s2.start, e51);
      }
      (c2 || c2 === 0) && t2.lift(s2, c2);
    });
  }), !0;
};
var hc = (e49) => (t2) => e49(t2);
var gc = () => ({ state: e49, dispatch: t2 }) => fr(e49, t2);
var _c = (e49, t2) => ({ editor: n2, tr: r2 }) => {
  let { state: i2 } = n2, a2 = i2.doc.slice(e49.from, e49.to);
  r2.deleteRange(e49.from, e49.to);
  let o2 = r2.mapping.map(t2);
  return r2.insert(o2, a2.content), r2.setSelection(new A(r2.doc.resolve(Math.max(o2 - 1, 0)))), !0;
};
var vc = () => ({ tr: e49, dispatch: t2 }) => {
  let { selection: n2 } = e49, r2 = n2.$anchor.node();
  if (r2.content.size > 0) return !1;
  let i2 = e49.selection.$anchor;
  for (let n3 = i2.depth; n3 > 0; --n3) if (i2.node(n3).type === r2.type) {
    if (t2) {
      let t3 = i2.before(n3), r3 = i2.after(n3);
      e49.delete(t3, r3).scrollIntoView();
    }
    return !0;
  }
  return !1;
};
function H(e49, t2) {
  if (typeof e49 == "string") {
    if (!t2.nodes[e49]) throw Error(`There is no node type named '${e49}'. Maybe you forgot to add the extension?`);
    return t2.nodes[e49];
  }
  return e49;
}
var yc = (e49) => ({ tr: t2, state: n2, dispatch: r2 }) => {
  let i2 = H(e49, n2.schema), a2 = t2.selection.$anchor;
  for (let e50 = a2.depth; e50 > 0; --e50) if (a2.node(e50).type === i2) {
    if (r2) {
      let n3 = a2.before(e50), r3 = a2.after(e50);
      t2.delete(n3, r3).scrollIntoView();
    }
    return !0;
  }
  return !1;
};
var bc = (e49) => ({ tr: t2, dispatch: n2 }) => {
  let { from: r2, to: i2 } = e49;
  return n2 && t2.delete(r2, i2), !0;
};
var xc = (e49) => e49.content ? /^text(\*|\+)/.test(e49.content) : !1;
var Sc = (e49, t2, n2) => {
  if (!e49.parent.isInline || n2 === "left" && e49.pos > e49.start() || n2 === "right" && e49.pos < e49.end()) return e49.pos;
  let r2 = t2.nodes[e49.parent.type.name].spec;
  return xc(r2) ? n2 === "left" ? e49.start() - 1 : e49.end() + 1 : e49.pos;
};
var Cc = (e49, t2, n2) => ({ from: Sc(e49, n2, "left"), to: Sc(t2, n2, "right") });
var wc = () => ({ state: e49, dispatch: t2 }) => {
  if (e49.selection.empty) return !1;
  if (t2) {
    let n2 = e49.tr, { ranges: r2 } = e49.selection, i2 = n2.steps.length;
    r2.forEach((t3) => {
      let r3 = n2.mapping.slice(i2), { from: a2, to: o2 } = Cc(n2.doc.resolve(r3.map(t3.$from.pos)), n2.doc.resolve(r3.map(t3.$to.pos)), e49.schema);
      n2.deleteRange(a2, o2);
    }), n2.scrollIntoView(), t2(n2);
  }
  return !0;
};
var Tc = () => ({ commands: e49 }) => e49.keyboardShortcut("Enter");
var Ec = () => ({ state: e49, dispatch: t2 }) => dr(e49, t2);
function Dc(e49) {
  return Object.prototype.toString.call(e49) === "[object RegExp]";
}
function Oc(e49, t2, n2 = { strict: !0 }) {
  let r2 = Object.keys(t2);
  return !r2.length || r2.every((r3) => n2.strict ? t2[r3] === e49[r3] : Dc(t2[r3]) ? t2[r3].test(e49[r3]) : t2[r3] === e49[r3]);
}
function kc(e49, t2, n2 = {}) {
  return e49.find((e50) => e50.type === t2 && Oc(Object.fromEntries(Object.keys(n2).map((t3) => [t3, e50.attrs[t3]])), n2));
}
function Ac(e49, t2, n2 = {}) {
  return !!kc(e49, t2, n2);
}
function jc(e49, t2, n2) {
  if (!e49 || !t2) return;
  let r2 = e49.parent.childAfter(e49.parentOffset);
  if (r2.node && r2.node.marks.some((e50) => e50.type === t2) || (r2 = e49.parent.childBefore(e49.parentOffset)), !r2.node || !r2.node.marks.some((e50) => e50.type === t2)) return;
  if (!n2) {
    let e50 = r2.node.marks.find((e51) => e51.type === t2);
    e50 && (n2 = e50.attrs);
  }
  if (!kc([...r2.node.marks], t2, n2)) return;
  let i2 = r2.index, a2 = e49.start() + r2.offset, o2 = i2 + 1, s2 = a2 + r2.node.nodeSize;
  for (; i2 > 0 && Ac([...e49.parent.child(i2 - 1).marks], t2, n2); ) --i2, a2 -= e49.parent.child(i2).nodeSize;
  for (; o2 < e49.parent.childCount && Ac([...e49.parent.child(o2).marks], t2, n2); ) s2 += e49.parent.child(o2).nodeSize, o2 += 1;
  return { from: a2, to: s2 };
}
function Mc(e49, t2) {
  if (typeof e49 == "string") {
    if (!t2.marks[e49]) throw Error(`There is no mark type named '${e49}'. Maybe you forgot to add the extension?`);
    return t2.marks[e49];
  }
  return e49;
}
var Nc = (e49, t2) => ({ tr: n2, state: r2, dispatch: i2 }) => {
  let a2 = Mc(e49, r2.schema), { doc: o2, selection: s2 } = n2, { $from: c2, from: l2, to: u2 } = s2;
  if (i2) {
    let e50 = jc(c2, a2, t2);
    if (e50 && e50.from <= l2 && e50.to >= u2) {
      let t3 = A.create(o2, e50.from, e50.to);
      n2.setSelection(t3);
    }
  }
  return !0;
};
var Pc = (e49) => (t2) => {
  let n2 = typeof e49 == "function" ? e49(t2) : e49;
  for (let e50 = 0; e50 < n2.length; e50 += 1) if (n2[e50](t2)) return !0;
  return !1;
};
function Fc(e49) {
  return e49 instanceof A;
}
function Ic(e49 = 0, t2 = 0, n2 = 0) {
  return Math.min(Math.max(e49, t2), n2);
}
function Lc(e49, t2 = null) {
  if (!t2) return null;
  let n2 = k.atStart(e49), r2 = k.atEnd(e49);
  if (t2 === "start" || t2 === !0) return n2;
  if (t2 === "end") return r2;
  let i2 = n2.from, a2 = r2.to;
  return t2 === "all" ? A.create(e49, Ic(0, i2, a2), Ic(e49.content.size, i2, a2)) : A.create(e49, Ic(t2, i2, a2), Ic(t2, i2, a2));
}
function Rc() {
  return navigator.platform === "Android" || /android/i.test(navigator.userAgent);
}
function zc() {
  return ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
}
function Bc() {
  return typeof navigator < "u" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
var Vc = (e49 = null, t2 = {}) => ({ editor: n2, view: r2, tr: i2, dispatch: a2 }) => {
  t2 = { scrollIntoView: !0, ...t2 };
  let o2 = () => {
    (zc() || Rc()) && r2.dom.focus(), Bc() && !zc() && !Rc() && r2.dom.focus({ preventScroll: !0 }), requestAnimationFrame(() => {
      n2.isDestroyed || (r2.focus(), t2?.scrollIntoView && n2.commands.scrollIntoView());
    });
  };
  try {
    if (r2.hasFocus() && e49 === null || e49 === !1) return !0;
  } catch {
    return !1;
  }
  if (a2 && e49 === null && !Fc(n2.state.selection)) return o2(), !0;
  let s2 = Lc(i2.doc, e49) || n2.state.selection, c2 = n2.state.selection.eq(s2);
  return a2 && (c2 || i2.setSelection(s2), c2 && i2.storedMarks && i2.setStoredMarks(i2.storedMarks), o2()), !0;
};
var Hc = (e49, t2) => (n2) => e49.every((e50, r2) => t2(e50, { ...n2, index: r2 }));
var Uc = (e49, t2) => ({ tr: n2, commands: r2 }) => r2.insertContentAt({ from: n2.selection.from, to: n2.selection.to }, e49, t2);
var Wc = (e49) => {
  let t2 = e49.childNodes;
  for (let n2 = t2.length - 1; n2 >= 0; --n2) {
    let r2 = t2[n2];
    r2.nodeType === 3 && r2.nodeValue && /^(\n\s\s|\n)$/.test(r2.nodeValue) ? e49.removeChild(r2) : r2.nodeType === 1 && Wc(r2);
  }
  return e49;
};
function Gc(e49) {
  if (typeof window > "u") throw Error("[tiptap error]: there is no window object available, so this function cannot be used");
  let t2 = `<body>${e49}</body>`, n2 = new window.DOMParser().parseFromString(t2, "text/html").body;
  return Wc(n2);
}
function Kc(e49, t2, n2) {
  if (e49 instanceof ve || e49 instanceof y) return e49;
  n2 = { slice: !0, parseOptions: {}, ...n2 };
  let r2 = typeof e49 == "object" && !!e49, i2 = typeof e49 == "string";
  if (r2) try {
    if (Array.isArray(e49) && e49.length > 0) return y.fromArray(e49.map((e50) => t2.nodeFromJSON(e50)));
    let r3 = t2.nodeFromJSON(e49);
    return n2.errorOnInvalidContent && r3.check(), r3;
  } catch (r3) {
    if (n2.errorOnInvalidContent) throw Error("[tiptap error]: Invalid JSON content", { cause: r3 });
    return console.warn("[tiptap warn]: Invalid content.", "Passed value:", e49, "Error:", r3), Kc("", t2, n2);
  }
  if (i2) {
    if (n2.errorOnInvalidContent) {
      let r4 = !1, i3 = "", a2 = new Ue({ topNode: t2.spec.topNode, marks: t2.spec.marks, nodes: t2.spec.nodes.append({ __tiptap__private__unknown__catch__all__node: { content: "inline*", group: "block", parseDOM: [{ tag: "*", getAttrs: (e50) => (r4 = !0, i3 = typeof e50 == "string" ? e50 : e50.outerHTML, null) }] } }) });
      if (n2.slice ? qe.fromSchema(a2).parseSlice(Gc(e49), n2.parseOptions) : qe.fromSchema(a2).parse(Gc(e49), n2.parseOptions), n2.errorOnInvalidContent && r4) throw Error("[tiptap error]: Invalid HTML content", { cause: Error(`Invalid element found: ${i3}`) });
    }
    let r3 = qe.fromSchema(t2);
    return n2.slice ? r3.parseSlice(Gc(e49), n2.parseOptions).content : r3.parse(Gc(e49), n2.parseOptions);
  }
  return Kc("", t2, n2);
}
function qc(e49, t2, n2) {
  let r2 = e49.steps.length - 1;
  if (r2 < t2) return;
  let i2 = e49.steps[r2];
  if (!(i2 instanceof Mt || i2 instanceof O)) return;
  let a2 = e49.mapping.maps[r2], o2 = 0;
  a2.forEach((e50, t3, n3, r3) => {
    o2 === 0 && (o2 = r3);
  }), e49.setSelection(k.near(e49.doc.resolve(o2), n2));
}
var Jc = (e49) => !("type" in e49);
var Yc = (e49, t2, n2) => ({ tr: r2, dispatch: i2, editor: a2 }) => {
  if (i2) {
    n2 = { parseOptions: a2.options.parseOptions, updateSelection: !0, applyInputRules: !1, applyPasteRules: !1, ...n2 };
    let i3, o2 = (e50) => {
      a2.emit("contentError", { editor: a2, error: e50, disableCollaboration: () => {
        "collaboration" in a2.storage && typeof a2.storage.collaboration == "object" && a2.storage.collaboration && (a2.storage.collaboration.isDisabled = !0);
      } });
    }, s2 = { preserveWhitespace: "full", ...n2.parseOptions };
    if (!n2.errorOnInvalidContent && !a2.options.enableContentCheck && a2.options.emitContentError) try {
      Kc(t2, a2.schema, { parseOptions: s2, errorOnInvalidContent: !0 });
    } catch (e50) {
      o2(e50);
    }
    try {
      i3 = Kc(t2, a2.schema, { parseOptions: s2, errorOnInvalidContent: n2.errorOnInvalidContent ?? a2.options.enableContentCheck });
    } catch (e50) {
      return o2(e50), !1;
    }
    let { from: c2, to: l2 } = typeof e49 == "number" ? { from: e49, to: e49 } : { from: e49.from, to: e49.to }, u2 = !0, d2 = !0;
    if ((Jc(i3) ? i3 : [i3]).forEach((e50) => {
      e50.check(), u2 = u2 ? e50.isText && e50.marks.length === 0 : !1, d2 = d2 ? e50.isBlock : !1;
    }), c2 === l2 && d2) {
      let { parent: e50 } = r2.doc.resolve(c2);
      e50.isTextblock && !e50.type.spec.code && !e50.childCount && (--c2, l2 += 1);
    }
    let f2;
    if (u2) {
      if (Array.isArray(t2)) f2 = t2.map((e50) => e50.text || "").join("");
      else if (t2 instanceof y) {
        let e50 = "";
        t2.forEach((t3) => {
          t3.text && (e50 += t3.text);
        }), f2 = e50;
      } else f2 = typeof t2 == "object" && t2 && t2.text ? t2.text : t2;
      r2.insertText(f2, c2, l2);
    } else {
      f2 = i3;
      let e50 = r2.doc.resolve(c2), t3 = e50.node(), n3 = e50.parentOffset === 0, a3 = t3.isText || t3.isTextblock, o3 = t3.content.size > 0;
      n3 && a3 && o3 && d2 && (c2 = Math.max(0, c2 - 1)), r2.replaceWith(c2, l2, f2);
    }
    n2.updateSelection && qc(r2, r2.steps.length - 1, -1), n2.applyInputRules && r2.setMeta("applyInputRules", { from: c2, text: f2 }), n2.applyPasteRules && r2.setMeta("applyPasteRules", { from: c2, text: f2 });
  }
  return !0;
};
var Xc = () => ({ state: e49, dispatch: t2 }) => or(e49, t2);
var Zc = () => ({ state: e49, dispatch: t2 }) => sr(e49, t2);
var Qc = () => ({ state: e49, dispatch: t2 }) => Yn(e49, t2);
var $c = () => ({ state: e49, dispatch: t2 }) => rr(e49, t2);
var el = () => ({ state: e49, dispatch: t2, tr: n2 }) => {
  try {
    let r2 = tn(e49.doc, e49.selection.$from.pos, -1);
    return r2 != null && (n2.join(r2, 2), t2 && t2(n2), !0);
  } catch {
    return !1;
  }
};
var tl = () => ({ state: e49, dispatch: t2, tr: n2 }) => {
  try {
    let r2 = tn(e49.doc, e49.selection.$from.pos, 1);
    return r2 != null && (n2.join(r2, 2), t2 && t2(n2), !0);
  } catch {
    return !1;
  }
};
var nl = () => ({ state: e49, dispatch: t2 }) => Xn(e49, t2);
var rl = () => ({ state: e49, dispatch: t2 }) => Zn(e49, t2);
function il() {
  return typeof navigator < "u" && /Mac/.test(navigator.platform);
}
function al(e49) {
  let t2 = e49.split(/-(?!$)/), n2 = t2[t2.length - 1];
  n2 === "Space" && (n2 = " ");
  let r2, i2, a2, o2;
  for (let e50 = 0; e50 < t2.length - 1; e50 += 1) {
    let n3 = t2[e50];
    if (/^(cmd|meta|m)$/i.test(n3)) o2 = !0;
    else if (/^a(lt)?$/i.test(n3)) r2 = !0;
    else if (/^(c|ctrl|control)$/i.test(n3)) i2 = !0;
    else if (/^s(hift)?$/i.test(n3)) a2 = !0;
    else if (/^mod$/i.test(n3)) zc() || il() ? o2 = !0 : i2 = !0;
    else throw Error(`Unrecognized modifier name: ${n3}`);
  }
  return r2 && (n2 = `Alt-${n2}`), i2 && (n2 = `Ctrl-${n2}`), o2 && (n2 = `Meta-${n2}`), a2 && (n2 = `Shift-${n2}`), n2;
}
var ol = (e49) => ({ editor: t2, view: n2, tr: r2, dispatch: i2 }) => {
  let a2 = al(e49).split(/-(?!$)/), o2 = a2.find((e50) => !["Alt", "Ctrl", "Meta", "Shift"].includes(e50)), s2 = new KeyboardEvent("keydown", { key: o2 === "Space" ? " " : o2, altKey: a2.includes("Alt"), ctrlKey: a2.includes("Ctrl"), metaKey: a2.includes("Meta"), shiftKey: a2.includes("Shift"), bubbles: !0, cancelable: !0 });
  return t2.captureTransaction(() => {
    n2.someProp("handleKeyDown", (e50) => e50(n2, s2));
  })?.steps.forEach((e50) => {
    let t3 = e50.map(r2.mapping);
    t3 && i2 && r2.maybeStep(t3);
  }), !0;
};
function sl(e49, t2, n2 = {}) {
  let { from: r2, to: i2, empty: a2 } = e49.selection, o2 = t2 ? H(t2, e49.schema) : null, s2 = [];
  e49.doc.nodesBetween(r2, i2, (e50, t3) => {
    if (e50.isText) return;
    let n3 = Math.max(r2, t3), a3 = Math.min(i2, t3 + e50.nodeSize);
    s2.push({ node: e50, from: n3, to: a3 });
  });
  let c2 = i2 - r2, l2 = s2.filter((e50) => !o2 || o2.name === e50.node.type.name).filter((e50) => Oc(e50.node.attrs, n2, { strict: !1 }));
  return a2 ? !!l2.length : l2.reduce((e50, t3) => e50 + t3.to - t3.from, 0) >= c2;
}
var cl = (e49, t2 = {}) => ({ state: n2, dispatch: r2 }) => sl(n2, H(e49, n2.schema), t2) ? cr(n2, r2) : !1;
var ll = () => ({ state: e49, dispatch: t2 }) => pr(e49, t2);
var ul = (e49) => ({ state: t2, dispatch: n2 }) => Nr(H(e49, t2.schema))(t2, n2);
var dl = () => ({ state: e49, dispatch: t2 }) => lr(e49, t2);
function fl(e49, t2) {
  return t2.nodes[e49] ? "node" : t2.marks[e49] ? "mark" : null;
}
function pl(e49, t2) {
  let n2 = typeof t2 == "string" ? [t2] : t2;
  return Object.keys(e49).reduce((t3, r2) => (n2.includes(r2) || (t3[r2] = e49[r2]), t3), {});
}
var ml = (e49, t2) => ({ tr: n2, state: r2, dispatch: i2 }) => {
  let a2 = null, o2 = null, s2 = fl(typeof e49 == "string" ? e49 : e49.name, r2.schema);
  if (!s2) return !1;
  s2 === "node" && (a2 = H(e49, r2.schema)), s2 === "mark" && (o2 = Mc(e49, r2.schema));
  let c2 = !1;
  return n2.selection.ranges.forEach((e50) => {
    r2.doc.nodesBetween(e50.$from.pos, e50.$to.pos, (e51, r3) => {
      a2 && a2 === e51.type && (c2 = !0, i2 && n2.setNodeMarkup(r3, void 0, pl(e51.attrs, t2))), o2 && e51.marks.length && e51.marks.forEach((a3) => {
        o2 === a3.type && (c2 = !0, i2 && n2.addMark(r3, r3 + e51.nodeSize, o2.create(pl(a3.attrs, t2))));
      });
    });
  }), c2;
};
var hl = () => ({ tr: e49, dispatch: t2 }) => (t2 && e49.scrollIntoView(), !0);
var gl = () => ({ tr: e49, dispatch: t2 }) => {
  if (t2) {
    let t3 = new jn(e49.doc);
    e49.setSelection(t3);
  }
  return !0;
};
var _l = () => ({ state: e49, dispatch: t2 }) => er(e49, t2);
var vl = () => ({ state: e49, dispatch: t2 }) => ir(e49, t2);
var yl = () => ({ state: e49, dispatch: t2 }) => gr(e49, t2);
var bl = () => ({ state: e49, dispatch: t2 }) => Sr(e49, t2);
var xl = () => ({ state: e49, dispatch: t2 }) => xr(e49, t2);
function Sl(e49, t2, n2 = {}, r2 = {}) {
  return Kc(e49, t2, { slice: !1, parseOptions: n2, errorOnInvalidContent: r2.errorOnInvalidContent });
}
var Cl = (e49, { errorOnInvalidContent: t2, emitUpdate: n2 = !0, parseOptions: r2 = {} } = {}) => ({ editor: i2, tr: a2, dispatch: o2, commands: s2 }) => {
  let { doc: c2 } = a2;
  if (r2.preserveWhitespace !== "full") {
    let s3 = Sl(e49, i2.schema, r2, { errorOnInvalidContent: t2 ?? i2.options.enableContentCheck });
    return o2 && a2.replaceWith(0, c2.content.size, s3).setMeta("preventUpdate", !n2), !0;
  }
  return o2 && a2.setMeta("preventUpdate", !n2), s2.insertContentAt({ from: 0, to: c2.content.size }, e49, { parseOptions: r2, errorOnInvalidContent: t2 ?? i2.options.enableContentCheck });
};
function wl(e49, t2) {
  let n2 = Mc(t2, e49.schema), { from: r2, to: i2, empty: a2 } = e49.selection, o2 = [];
  a2 ? (e49.storedMarks && o2.push(...e49.storedMarks), o2.push(...e49.selection.$head.marks())) : e49.doc.nodesBetween(r2, i2, (e50) => {
    o2.push(...e50.marks);
  });
  let s2 = o2.find((e50) => e50.type.name === n2.name);
  return s2 ? { ...s2.attrs } : {};
}
function Tl(e49, t2) {
  let n2 = new wn(e49);
  return t2.forEach((e50) => {
    e50.steps.forEach((e51) => {
      n2.step(e51);
    });
  }), n2;
}
function El(e49) {
  for (let t2 = 0; t2 < e49.edgeCount; t2 += 1) {
    let { type: n2 } = e49.edge(t2);
    if (n2.isTextblock && !n2.hasRequiredAttrs()) return n2;
  }
  return null;
}
function Dl(e49, t2, n2) {
  let r2 = [];
  return e49.nodesBetween(t2.from, t2.to, (e50, t3) => {
    n2(e50) && r2.push({ node: e50, pos: t3 });
  }), r2;
}
function Ol(e49, t2) {
  for (let n2 = e49.depth; n2 > 0; --n2) {
    let r2 = e49.node(n2);
    if (t2(r2)) return { pos: n2 > 0 ? e49.before(n2) : 0, start: e49.start(n2), depth: n2, node: r2 };
  }
}
function kl(e49) {
  return (t2) => Ol(t2.$from, e49);
}
function U(e49, t2, n2) {
  return e49.config[t2] === void 0 && e49.parent ? U(e49.parent, t2, n2) : typeof e49.config[t2] == "function" ? e49.config[t2].bind({ ...n2, parent: e49.parent ? U(e49.parent, t2, n2) : null }) : e49.config[t2];
}
function Al(e49) {
  return e49.map((e50) => {
    let t2 = U(e50, "addExtensions", { name: e50.name, options: e50.options, storage: e50.storage });
    return t2 ? [e50, ...Al(t2())] : e50;
  }).flat(10);
}
function jl(e49, t2) {
  let n2 = st.fromSchema(t2).serializeFragment(e49), r2 = document.implementation.createHTMLDocument().createElement("div");
  return r2.appendChild(n2), r2.innerHTML;
}
function Ml(e49) {
  return typeof e49 == "function";
}
function W(e49, t2 = void 0, ...n2) {
  return Ml(e49) ? t2 ? e49.bind(t2)(...n2) : e49(...n2) : e49;
}
function Nl(e49 = {}) {
  return Object.keys(e49).length === 0 && e49.constructor === Object;
}
function Pl(e49) {
  return { baseExtensions: e49.filter((e50) => e50.type === "extension"), nodeExtensions: e49.filter((e50) => e50.type === "node"), markExtensions: e49.filter((e50) => e50.type === "mark") };
}
function Fl(e49) {
  let t2 = [], { nodeExtensions: n2, markExtensions: r2 } = Pl(e49), i2 = [...n2, ...r2], a2 = { default: null, validate: void 0, rendered: !0, renderHTML: null, parseHTML: null, keepOnSplit: !0, isRequired: !1 }, o2 = n2.filter((e50) => e50.name !== "text").map((e50) => e50.name), s2 = r2.map((e50) => e50.name), c2 = [...o2, ...s2];
  return e49.forEach((e50) => {
    let n3 = U(e50, "addGlobalAttributes", { name: e50.name, options: e50.options, storage: e50.storage, extensions: i2 });
    n3 && n3().forEach((e51) => {
      let n4;
      n4 = Array.isArray(e51.types) ? e51.types : e51.types === "*" ? c2 : e51.types === "nodes" ? o2 : e51.types === "marks" ? s2 : [], n4.forEach((n5) => {
        Object.entries(e51.attributes).forEach(([e52, r3]) => {
          t2.push({ type: n5, name: e52, attribute: { ...a2, ...r3 } });
        });
      });
    });
  }), i2.forEach((e50) => {
    let n3 = U(e50, "addAttributes", { name: e50.name, options: e50.options, storage: e50.storage });
    if (!n3) return;
    let r3 = n3();
    Object.entries(r3).forEach(([n4, r4]) => {
      let i3 = { ...a2, ...r4 };
      typeof i3?.default == "function" && (i3.default = i3.default()), i3?.isRequired && i3?.default === void 0 && delete i3.default, t2.push({ type: e50.name, name: n4, attribute: i3 });
    });
  }), t2;
}
function Il(e49) {
  let t2 = [], n2 = "", r2 = !1, i2 = !1, a2 = 0, o2 = e49.length;
  for (let s2 = 0; s2 < o2; s2 += 1) {
    let o3 = e49[s2];
    if (o3 === "'" && !i2) r2 = !r2, n2 += o3;
    else if (o3 === '"' && !r2) i2 = !i2, n2 += o3;
    else {
      if (!r2 && !i2) {
        if (o3 === "(") {
          a2 += 1, n2 += o3;
          continue;
        }
        if (o3 === ")" && a2 > 0) {
          --a2, n2 += o3;
          continue;
        }
        if (o3 === ";" && a2 === 0) {
          t2.push(n2), n2 = "";
          continue;
        }
      }
      n2 += o3;
    }
  }
  return n2 && t2.push(n2), t2;
}
function Ll(e49) {
  let t2 = [], n2 = Il(e49 || ""), r2 = n2.length;
  for (let e50 = 0; e50 < r2; e50 += 1) {
    let r3 = n2[e50], i2 = r3.indexOf(":");
    if (i2 === -1) continue;
    let a2 = r3.slice(0, i2).trim(), o2 = r3.slice(i2 + 1).trim();
    a2 && o2 && t2.push([a2, o2]);
  }
  return t2;
}
function G(...e49) {
  return e49.filter((e50) => !!e50).reduce((e50, t2) => {
    let n2 = { ...e50 };
    return Object.entries(t2).forEach(([e51, t3]) => {
      if (!n2[e51]) n2[e51] = t3;
      else if (e51 === "class") {
        let r2 = t3 ? String(t3).split(" ") : [], i2 = n2[e51] ? n2[e51].split(" ") : [], a2 = r2.filter((e52) => !i2.includes(e52));
        n2[e51] = [...i2, ...a2].join(" ");
      } else if (e51 === "style") {
        let r2 = new Map([...Ll(n2[e51]), ...Ll(t3)]);
        n2[e51] = Array.from(r2.entries()).map(([e52, t4]) => `${e52}: ${t4}`).join("; ");
      } else n2[e51] = t3;
    }), n2;
  }, {});
}
function Rl(e49, t2) {
  return t2.filter((t3) => t3.type === e49.type.name).filter((e50) => e50.attribute.rendered).map((t3) => t3.attribute.renderHTML ? t3.attribute.renderHTML(e49.attrs) || {} : { [t3.name]: e49.attrs[t3.name] }).reduce((e50, t3) => G(e50, t3), {});
}
function zl(e49) {
  return typeof e49 == "string" ? e49.match(/^[+-]?(?:\d*\.)?\d+$/) ? Number(e49) : e49 === "true" || e49 !== "false" && e49 : e49;
}
function Bl(e49, t2) {
  return "style" in e49 ? e49 : { ...e49, getAttrs: (n2) => {
    let r2 = e49.getAttrs ? e49.getAttrs(n2) : e49.attrs;
    if (r2 === !1) return !1;
    let i2 = t2.reduce((e50, t3) => {
      let r3 = t3.attribute.parseHTML ? t3.attribute.parseHTML(n2) : zl(n2.getAttribute(t3.name));
      return r3 == null ? e50 : { ...e50, [t3.name]: r3 };
    }, {});
    return { ...r2, ...i2 };
  } };
}
function Vl(e49) {
  return Object.fromEntries(Object.entries(e49).filter(([e50, t2]) => e50 === "attrs" && Nl(t2) ? !1 : t2 != null));
}
function Hl(e49) {
  let t2 = {};
  return !e49?.attribute?.isRequired && "default" in (e49?.attribute || {}) && (t2.default = e49.attribute.default), e49?.attribute?.validate !== void 0 && (t2.validate = e49.attribute.validate), [e49.name, t2];
}
function Ul(e49, t2) {
  let n2 = Fl(e49), { nodeExtensions: r2, markExtensions: i2 } = Pl(e49), a2 = r2.find((e50) => U(e50, "topNode"))?.name;
  return new Ue({ topNode: a2, nodes: Object.fromEntries(r2.map((r3) => {
    let i3 = n2.filter((e50) => e50.type === r3.name), a3 = { name: r3.name, options: r3.options, storage: r3.storage, editor: t2 }, o2 = Vl({ ...e49.reduce((e50, t3) => {
      let n3 = U(t3, "extendNodeSchema", a3);
      return { ...e50, ...n3 ? n3(r3) : {} };
    }, {}), content: W(U(r3, "content", a3)), marks: W(U(r3, "marks", a3)), group: W(U(r3, "group", a3)), inline: W(U(r3, "inline", a3)), atom: W(U(r3, "atom", a3)), selectable: W(U(r3, "selectable", a3)), draggable: W(U(r3, "draggable", a3)), code: W(U(r3, "code", a3)), whitespace: W(U(r3, "whitespace", a3)), linebreakReplacement: W(U(r3, "linebreakReplacement", a3)), defining: W(U(r3, "defining", a3)), isolating: W(U(r3, "isolating", a3)), attrs: Object.fromEntries(i3.map(Hl)) }), s2 = W(U(r3, "parseHTML", a3));
    s2 && (o2.parseDOM = s2.map((e50) => Bl(e50, i3)));
    let c2 = U(r3, "renderHTML", a3);
    c2 && (o2.toDOM = (e50) => c2({ node: e50, HTMLAttributes: Rl(e50, i3) }));
    let l2 = U(r3, "renderText", a3);
    return l2 && (o2.toText = l2), [r3.name, o2];
  })), marks: Object.fromEntries(i2.map((r3) => {
    let i3 = n2.filter((e50) => e50.type === r3.name), a3 = { name: r3.name, options: r3.options, storage: r3.storage, editor: t2 }, o2 = Vl({ ...e49.reduce((e50, t3) => {
      let n3 = U(t3, "extendMarkSchema", a3);
      return { ...e50, ...n3 ? n3(r3) : {} };
    }, {}), inclusive: W(U(r3, "inclusive", a3)), excludes: W(U(r3, "excludes", a3)), group: W(U(r3, "group", a3)), spanning: W(U(r3, "spanning", a3)), code: W(U(r3, "code", a3)), attrs: Object.fromEntries(i3.map(Hl)) }), s2 = W(U(r3, "parseHTML", a3));
    s2 && (o2.parseDOM = s2.map((e50) => Bl(e50, i3)));
    let c2 = U(r3, "renderHTML", a3);
    return c2 && (o2.toDOM = (e50) => c2({ mark: e50, HTMLAttributes: Rl(e50, i3) })), [r3.name, o2];
  })) });
}
function Wl(e49) {
  let t2 = e49.filter((t3, n2) => e49.indexOf(t3) !== n2);
  return Array.from(new Set(t2));
}
function Gl(e49) {
  return e49.sort((e50, t2) => {
    let n2 = U(e50, "priority") || 100, r2 = U(t2, "priority") || 100;
    return n2 > r2 ? -1 : +(n2 < r2);
  });
}
function Kl(e49) {
  let t2 = Gl(Al(e49)), n2 = Wl(t2.map((e50) => e50.name));
  return n2.length && console.warn(`[tiptap warn]: Duplicate extension names found: [${n2.map((e50) => `'${e50}'`).join(", ")}]. This can lead to issues.`), t2;
}
function ql(e49, t2, n2) {
  let { from: r2, to: i2 } = t2, { blockSeparator: a2 = `

`, textSerializers: o2 = {} } = n2 || {}, s2 = "";
  return e49.nodesBetween(r2, i2, (e50, n3, c2, l2) => {
    e50.isBlock && n3 > r2 && (s2 += a2);
    let u2 = o2?.[e50.type.name];
    if (u2) return c2 && (s2 += u2({ node: e50, pos: n3, parent: c2, index: l2, range: t2 })), !1;
    e50.isText && (s2 += e50?.text?.slice(Math.max(r2, n3) - n3, i2 - n3));
  }), s2;
}
function Jl(e49, t2) {
  return ql(e49, { from: 0, to: e49.content.size }, t2);
}
function Yl(e49) {
  return Object.fromEntries(Object.entries(e49.nodes).filter(([, e50]) => e50.spec.toText).map(([e50, t2]) => [e50, t2.spec.toText]));
}
function Xl(e49, t2) {
  let n2 = H(t2, e49.schema), { from: r2, to: i2 } = e49.selection, a2 = [];
  e49.doc.nodesBetween(r2, i2, (e50) => {
    a2.push(e50);
  });
  let o2 = a2.reverse().find((e50) => e50.type.name === n2.name);
  return o2 ? { ...o2.attrs } : {};
}
function Zl(e49, t2) {
  let n2 = fl(typeof t2 == "string" ? t2 : t2.name, e49.schema);
  return n2 === "node" ? Xl(e49, t2) : n2 === "mark" ? wl(e49, t2) : {};
}
function Ql(e49, t2 = JSON.stringify) {
  let n2 = {};
  return e49.filter((e50) => {
    let r2 = t2(e50);
    return Object.prototype.hasOwnProperty.call(n2, r2) ? !1 : n2[r2] = !0;
  });
}
function $l(e49) {
  let t2 = Ql(e49);
  return t2.length === 1 ? t2 : t2.filter((e50, n2) => !t2.filter((e51, t3) => t3 !== n2).some((t3) => e50.oldRange.from >= t3.oldRange.from && e50.oldRange.to <= t3.oldRange.to && e50.newRange.from >= t3.newRange.from && e50.newRange.to <= t3.newRange.to));
}
function eu(e49) {
  let { mapping: t2, steps: n2 } = e49, r2 = [];
  return t2.maps.forEach((e50, i2) => {
    let a2 = [];
    if (e50.ranges.length) e50.forEach((e51, t3) => {
      a2.push({ from: e51, to: t3 });
    });
    else {
      let { from: e51, to: t3 } = n2[i2];
      if (e51 === void 0 || t3 === void 0) return;
      a2.push({ from: e51, to: t3 });
    }
    a2.forEach(({ from: e51, to: n3 }) => {
      let a3 = t2.slice(i2).map(e51, -1), o2 = t2.slice(i2).map(n3), s2 = t2.invert().map(a3, -1), c2 = t2.invert().map(o2);
      r2.push({ oldRange: { from: s2, to: c2 }, newRange: { from: a3, to: o2 } });
    });
  }), $l(r2);
}
function tu(e49, t2, n2) {
  let r2 = [];
  return e49 === t2 ? n2.resolve(e49).marks().forEach((t3) => {
    let i2 = jc(n2.resolve(e49), t3.type);
    i2 && r2.push({ mark: t3, ...i2 });
  }) : n2.nodesBetween(e49, t2, (e50, t3) => {
    e50 && e50?.nodeSize !== void 0 && r2.push(...e50.marks.map((n3) => ({ from: t3, to: t3 + e50.nodeSize, mark: n3 })));
  }), r2;
}
var nu = (e49, t2, n2, r2 = 20) => {
  let i2 = e49.doc.resolve(n2), a2 = r2, o2 = null;
  for (; a2 > 0 && o2 === null; ) {
    let e50 = i2.node(a2);
    e50?.type.name === t2 ? o2 = e50 : --a2;
  }
  return [o2, a2];
};
function ru(e49, t2) {
  return t2.nodes[e49] || t2.marks[e49] || null;
}
function iu(e49, t2, n2) {
  return Object.fromEntries(Object.entries(n2).filter(([n3]) => {
    let r2 = e49.find((e50) => e50.type === t2 && e50.name === n3);
    return r2 ? r2.attribute.keepOnSplit : !1;
  }));
}
var au = (e49, t2 = 500) => {
  let n2 = "", r2 = e49.parentOffset;
  return e49.parent.nodesBetween(Math.max(0, r2 - t2), r2, (e50, t3, i2, a2) => {
    var o2;
    let s2 = (o2 = e50.type.spec).toText?.call(o2, { node: e50, pos: t3, parent: i2, index: a2 }) || e50.textContent || "%leaf%";
    n2 += e50.isAtom && !e50.isText ? s2 : s2.slice(0, Math.max(0, r2 - t3));
  }), n2;
};
function ou(e49, t2, n2 = {}) {
  let { empty: r2, ranges: i2 } = e49.selection, a2 = t2 ? Mc(t2, e49.schema) : null;
  if (r2) return !!(e49.storedMarks || e49.selection.$from.marks()).filter((e50) => !a2 || a2.name === e50.type.name).find((e50) => Oc(e50.attrs, n2, { strict: !1 }));
  let o2 = 0, s2 = [];
  if (i2.forEach(({ $from: t3, $to: n3 }) => {
    let r3 = t3.pos, i3 = n3.pos;
    e49.doc.nodesBetween(r3, i3, (e50, t4) => {
      if (a2 && e50.inlineContent && !e50.type.allowsMarkType(a2)) return !1;
      if (!e50.isText && !e50.marks.length) return;
      let n4 = Math.max(r3, t4), c3 = Math.min(i3, t4 + e50.nodeSize), l3 = c3 - n4;
      o2 += l3, s2.push(...e50.marks.map((e51) => ({ mark: e51, from: n4, to: c3 })));
    });
  }), o2 === 0) return !1;
  let c2 = s2.filter((e50) => !a2 || a2.name === e50.mark.type.name).filter((e50) => Oc(e50.mark.attrs, n2, { strict: !1 })).reduce((e50, t3) => e50 + t3.to - t3.from, 0), l2 = s2.filter((e50) => !a2 || e50.mark.type !== a2 && e50.mark.type.excludes(a2)).reduce((e50, t3) => e50 + t3.to - t3.from, 0);
  return (c2 > 0 ? c2 + l2 : c2) >= o2;
}
function su(e49, t2, n2 = {}) {
  if (!t2) return sl(e49, null, n2) || ou(e49, null, n2);
  let r2 = fl(t2, e49.schema);
  return r2 === "node" ? sl(e49, t2, n2) : r2 === "mark" && ou(e49, t2, n2);
}
var cu = (e49, t2) => {
  let { $from: n2, $to: r2, $anchor: i2 } = e49.selection;
  if (t2) {
    let n3 = kl((e50) => e50.type.name === t2)(e49.selection);
    if (!n3) return !1;
    let r3 = e49.doc.resolve(n3.pos + 1);
    return i2.pos + 1 === r3.end();
  }
  return !(r2.parentOffset < r2.parent.nodeSize - 2 || n2.pos !== r2.pos);
};
var lu = (e49) => {
  let { $from: t2, $to: n2 } = e49.selection;
  return !(t2.parentOffset > 0 || t2.pos !== n2.pos);
};
function uu(e49, t2) {
  return Array.isArray(t2) ? t2.some((t3) => (typeof t3 == "string" ? t3 : t3.name) === e49.name) : t2;
}
function du(e49, t2) {
  let { nodeExtensions: n2 } = Pl(t2), r2 = n2.find((t3) => t3.name === e49);
  if (!r2) return !1;
  let i2 = W(U(r2, "group", { name: r2.name, options: r2.options, storage: r2.storage }));
  return typeof i2 == "string" && i2.split(" ").includes("list");
}
function fu(e49, { checkChildren: t2 = !0, ignoreWhitespace: n2 = !1 } = {}) {
  if (n2) {
    if (e49.type.name === "hardBreak") return !0;
    if (e49.isText) return !/\S/.test(e49.text ?? "");
  }
  if (e49.isText) return !e49.text;
  if (e49.isAtom || e49.isLeaf) return !1;
  if (e49.content.childCount === 0) return !0;
  if (t2) {
    let r2 = !0;
    return e49.content.forEach((e50) => {
      r2 !== !1 && (fu(e50, { ignoreWhitespace: n2, checkChildren: t2 }) || (r2 = !1));
    }), r2;
  }
  return !1;
}
function pu(e49) {
  return e49 instanceof j;
}
var mu = class e40 {
  constructor(e49) {
    this.position = e49;
  }
  static fromJSON(t2) {
    return new e40(t2.position);
  }
  toJSON() {
    return { position: this.position };
  }
};
function hu(e49, t2) {
  let n2 = t2.mapping.mapResult(e49.position);
  return { position: new mu(n2.pos), mapResult: n2 };
}
function gu(e49) {
  return new mu(e49);
}
function _u(e49, t2, n2) {
  let { selection: r2 } = t2, i2 = null;
  if (Fc(r2) && (i2 = r2.$cursor), i2) {
    let t3 = e49.storedMarks ?? i2.marks();
    return i2.parent.type.allowsMarkType(n2) && (!!n2.isInSet(t3) || !t3.some((e50) => e50.type.excludes(n2)));
  }
  let { ranges: a2 } = r2;
  return a2.some(({ $from: t3, $to: r3 }) => {
    let i3 = t3.depth === 0 && e49.doc.inlineContent && e49.doc.type.allowsMarkType(n2);
    return e49.doc.nodesBetween(t3.pos, r3.pos, (e50, t4, r4) => {
      if (i3) return !1;
      if (e50.isInline) {
        let t5 = !r4 || r4.type.allowsMarkType(n2), a3 = !!n2.isInSet(e50.marks) || !e50.marks.some((e51) => e51.type.excludes(n2));
        i3 = t5 && a3;
      }
      return !i3;
    }), i3;
  });
}
var vu = (e49, t2 = {}) => ({ tr: n2, state: r2, dispatch: i2 }) => {
  let { selection: a2 } = n2, { empty: o2, ranges: s2 } = a2, c2 = Mc(e49, r2.schema);
  if (i2)
    if (o2) {
      let e50 = wl(r2, c2);
      n2.addStoredMark(c2.create({ ...e50, ...t2 }));
    } else s2.forEach((e50) => {
      let i3 = e50.$from.pos, a3 = e50.$to.pos;
      r2.doc.nodesBetween(i3, a3, (e51, r3) => {
        let o3 = Math.max(r3, i3), s3 = Math.min(r3 + e51.nodeSize, a3);
        e51.marks.find((e52) => e52.type === c2) ? e51.marks.forEach((e52) => {
          c2 === e52.type && n2.addMark(o3, s3, c2.create({ ...e52.attrs, ...t2 }));
        }) : n2.addMark(o3, s3, c2.create(t2));
      });
    });
  return _u(r2, n2, c2);
};
var yu = (e49, t2) => ({ tr: n2 }) => (n2.setMeta(e49, t2), !0);
var bu = (e49, t2 = {}) => ({ state: n2, dispatch: r2, chain: i2 }) => {
  let a2 = H(e49, n2.schema), o2;
  return n2.selection.$anchor.sameParent(n2.selection.$head) && (o2 = n2.selection.$anchor.parent.attrs), a2.isTextblock ? i2().command(({ commands: e50 }) => wr(a2, { ...o2, ...t2 })(n2) ? !0 : e50.clearNodes()).command(({ state: e50 }) => wr(a2, { ...o2, ...t2 })(e50, r2)).run() : (console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.'), !1);
};
var xu = (e49) => ({ tr: t2, dispatch: n2 }) => {
  if (n2) {
    let { doc: n3 } = t2, r2 = Ic(e49, 0, n3.content.size), i2 = j.create(n3, r2);
    t2.setSelection(i2);
  }
  return !0;
};
var Su = (e49, t2) => ({ tr: n2, state: r2, dispatch: i2 }) => {
  let { selection: a2 } = r2, o2, s2;
  return typeof t2 == "number" ? (o2 = t2, s2 = t2) : t2 && "from" in t2 && "to" in t2 ? (o2 = t2.from, s2 = t2.to) : (o2 = a2.from, s2 = a2.to), i2 && n2.doc.nodesBetween(o2, s2, (t3, r3) => {
    t3.isText || n2.setNodeMarkup(r3, void 0, { ...t3.attrs, dir: e49 });
  }), !0;
};
var Cu = (e49) => ({ tr: t2, dispatch: n2 }) => {
  if (n2) {
    let { doc: n3 } = t2, { from: r2, to: i2 } = typeof e49 == "number" ? { from: e49, to: e49 } : e49, a2 = A.atStart(n3).from, o2 = A.atEnd(n3).to, s2 = Ic(r2, a2, o2), c2 = Ic(i2, a2, o2), l2 = A.create(n3, s2, c2);
    t2.setSelection(l2);
  }
  return !0;
};
var wu = (e49) => ({ state: t2, dispatch: n2 }) => Ir(H(e49, t2.schema))(t2, n2);
function Tu(e49, t2) {
  let n2 = e49.storedMarks || e49.selection.$to.parentOffset && e49.selection.$from.marks();
  if (n2) {
    let r2 = n2.filter((e50) => t2?.includes(e50.type.name));
    e49.tr.ensureMarks(r2);
  }
}
var Eu = ({ keepMarks: e49 = !0 } = {}) => ({ tr: t2, state: n2, dispatch: r2, editor: i2 }) => {
  let { selection: a2, doc: o2 } = t2, { $from: s2, $to: c2 } = a2, l2 = i2.extensionManager.attributes, u2 = iu(l2, s2.node().type.name, s2.node().attrs);
  if (a2 instanceof j && a2.node.isBlock) return !s2.parentOffset || !Xt(o2, s2.pos) ? !1 : (r2 && (e49 && Tu(n2, i2.extensionManager.splittableMarks), t2.split(s2.pos).scrollIntoView()), !0);
  if (!s2.parent.isBlock) return !1;
  let d2 = c2.parentOffset === c2.parent.content.size, f2 = s2.depth === 0 ? void 0 : El(s2.node(-1).contentMatchAt(s2.indexAfter(-1))), p2 = d2 && f2 ? [{ type: f2, attrs: u2 }] : void 0, m2 = Xt(t2.doc, t2.mapping.map(s2.pos), 1, p2);
  if (!p2 && !m2 && Xt(t2.doc, t2.mapping.map(s2.pos), 1, f2 ? [{ type: f2 }] : void 0) && (m2 = !0, p2 = f2 ? [{ type: f2, attrs: u2 }] : void 0), r2) {
    if (m2 && (a2 instanceof A && t2.deleteSelection(), t2.split(t2.mapping.map(s2.pos), 1, p2), f2 && !d2 && !s2.parentOffset && s2.parent.type !== f2)) {
      let e50 = t2.mapping.map(s2.before()), n3 = t2.doc.resolve(e50);
      s2.node(-1).canReplaceWith(n3.index(), n3.index() + 1, f2) && t2.setNodeMarkup(t2.mapping.map(s2.before()), f2);
    }
    e49 && Tu(n2, i2.extensionManager.splittableMarks), t2.scrollIntoView();
  }
  return m2;
};
var Du = (e49, t2 = {}) => ({ tr: n2, state: r2, dispatch: i2, editor: a2 }) => {
  let o2 = H(e49, r2.schema), { $from: s2, $to: c2 } = r2.selection, l2 = r2.selection.node;
  if (l2 && l2.isBlock || s2.depth < 2 || !s2.sameParent(c2)) return !1;
  let u2 = s2.node(-1);
  if (u2.type !== o2) return !1;
  let d2 = a2.extensionManager.attributes;
  if (s2.parent.content.size === 0 && s2.node(-1).childCount === s2.indexAfter(-1)) {
    if (s2.depth === 2 || s2.node(-3).type !== o2 || s2.index(-2) !== s2.node(-2).childCount - 1) return !1;
    if (i2) {
      let e50 = y.empty, r3 = s2.index(-1) ? 1 : s2.index(-2) ? 2 : 3;
      for (let t3 = s2.depth - r3; t3 >= s2.depth - 3; --t3) e50 = y.from(s2.node(t3).copy(e50));
      let i3 = s2.indexAfter(-1) < s2.node(-2).childCount ? 1 : s2.indexAfter(-2) < s2.node(-3).childCount ? 2 : 3, a3 = { ...iu(d2, s2.node().type.name, s2.node().attrs), ...t2 }, c3 = o2.contentMatch.defaultType?.createAndFill(a3) || void 0;
      e50 = e50.append(y.from(o2.createAndFill(null, c3) || void 0));
      let l3 = s2.before(s2.depth - (r3 - 1));
      n2.replace(l3, s2.after(-i3), new T(e50, 4 - r3, 0));
      let u3 = -1;
      n2.doc.nodesBetween(l3, n2.doc.content.size, (e51, t3) => {
        if (u3 > -1) return !1;
        e51.isTextblock && e51.content.size === 0 && (u3 = t3 + 1);
      }), u3 > -1 && n2.setSelection(A.near(n2.doc.resolve(u3))), n2.scrollIntoView();
    }
    return !0;
  }
  let f2 = c2.pos === s2.end() ? u2.contentMatchAt(0).defaultType : null, p2 = { ...iu(d2, u2.type.name, u2.attrs), ...t2 }, m2 = { ...iu(d2, s2.node().type.name, s2.node().attrs), ...t2 };
  n2.delete(s2.pos, c2.pos);
  let h2 = f2 ? [{ type: o2, attrs: p2 }, { type: f2, attrs: m2 }] : [{ type: o2, attrs: p2 }];
  if (!Xt(n2.doc, s2.pos, 2)) return !1;
  if (i2) {
    let { selection: e50, storedMarks: t3 } = r2, { splittableMarks: o3 } = a2.extensionManager, c3 = t3 || e50.$to.parentOffset && e50.$from.marks();
    if (n2.split(s2.pos, 2, h2).scrollIntoView(), !c3 || !i2) return !0;
    let l3 = c3.filter((e51) => o3.includes(e51.type.name));
    n2.ensureMarks(l3);
  }
  return !0;
};
function Ou(e49) {
  return !e49 || e49 === "1" ? null : e49;
}
function ku(e49, t2) {
  return Ou(e49) === Ou(t2);
}
var Au = (e49, t2) => {
  let n2 = kl((e50) => e50.type === t2)(e49.selection);
  if (!n2) return !0;
  let r2 = e49.doc.resolve(Math.max(0, n2.pos - 1)).before(n2.depth);
  if (r2 === void 0) return !0;
  let i2 = e49.doc.nodeAt(r2);
  return !(n2.node.type === i2?.type && Qt(e49.doc, n2.pos)) || !ku(n2.node.attrs.type, i2?.attrs.type) || e49.join(n2.pos), !0;
};
var ju = (e49, t2) => {
  let n2 = kl((e50) => e50.type === t2)(e49.selection);
  if (!n2) return !0;
  let r2 = e49.doc.resolve(n2.start).after(n2.depth);
  if (r2 === void 0) return !0;
  let i2 = e49.doc.nodeAt(r2);
  return !(n2.node.type === i2?.type && Qt(e49.doc, r2)) || !ku(n2.node.attrs.type, i2?.attrs.type) || e49.join(r2), !0;
};
function Mu(e49) {
  let t2 = e49.doc, n2 = t2.firstChild;
  if (!n2) return null;
  let r2 = t2.resolve(1), i2 = t2.resolve(n2.nodeSize - 1);
  return A.between(r2, i2);
}
var Nu = (e49, t2, n2, r2 = {}) => ({ editor: i2, tr: a2, state: o2, dispatch: s2, chain: c2, commands: l2, can: u2 }) => {
  let { extensions: d2, splittableMarks: f2 } = i2.extensionManager, p2 = H(e49, o2.schema), m2 = H(t2, o2.schema), { selection: h2, storedMarks: g2 } = o2, { $from: _2, $to: v2 } = h2, y2 = _2.blockRange(v2), b2 = g2 || h2.$to.parentOffset && h2.$from.marks();
  if (!y2) return !1;
  let x2 = kl((e50) => du(e50.type.name, d2))(h2), S2 = h2.from === 0 && h2.to === o2.doc.content.size, C2 = o2.doc.content.content, w2 = C2.length === 1 ? C2[0] : null, T2 = S2 && w2 && du(w2.type.name, d2) ? { node: w2, pos: 0, depth: 0 } : null, ee2 = x2 ?? T2, te2 = !!x2 && y2.depth >= 1 && y2.depth - x2.depth <= 1, ne2 = !!T2;
  if ((te2 || ne2) && ee2) {
    if (ee2.node.type === p2) return S2 && ne2 ? c2().command(({ tr: e50, dispatch: t3 }) => {
      let n3 = Mu(e50);
      return n3 ? (e50.setSelection(n3), t3 && t3(e50), !0) : !1;
    }).liftListItem(m2).run() : l2.liftListItem(m2);
    if (du(ee2.node.type.name, d2) && p2.validContent(ee2.node.content)) return c2().command(() => (a2.setNodeMarkup(ee2.pos, p2), !0)).command(() => Au(a2, p2)).command(() => ju(a2, p2)).run();
  }
  return !n2 || !b2 || !s2 ? c2().command(() => u2().wrapInList(p2, r2) ? !0 : l2.clearNodes()).wrapInList(p2, r2).command(() => Au(a2, p2)).command(() => ju(a2, p2)).run() : c2().command(() => {
    let e50 = u2().wrapInList(p2, r2), t3 = b2.filter((e51) => f2.includes(e51.type.name));
    return a2.ensureMarks(t3), e50 ? !0 : l2.clearNodes();
  }).wrapInList(p2, r2).command(() => Au(a2, p2)).command(() => ju(a2, p2)).run();
};
var Pu = (e49, t2 = {}, n2 = {}) => ({ state: r2, commands: i2 }) => {
  let { extendEmptyMarkRange: a2 = !1 } = n2, o2 = Mc(e49, r2.schema);
  return ou(r2, o2, t2) ? i2.unsetMark(o2, { extendEmptyMarkRange: a2 }) : i2.setMark(o2, t2);
};
var Fu = (e49, t2, n2 = {}) => ({ state: r2, commands: i2 }) => {
  let a2 = H(e49, r2.schema), o2 = H(t2, r2.schema), s2 = sl(r2, a2, n2), c2;
  return r2.selection.$anchor.sameParent(r2.selection.$head) && (c2 = r2.selection.$anchor.parent.attrs), s2 ? i2.setNode(o2, c2) : i2.setNode(a2, { ...c2, ...n2 });
};
var Iu = (e49, t2 = {}) => ({ state: n2, commands: r2 }) => {
  let i2 = H(e49, n2.schema);
  return sl(n2, i2, t2) ? r2.lift(i2) : r2.wrapIn(i2, t2);
};
var Lu = () => ({ state: e49, dispatch: t2 }) => {
  let n2 = e49.plugins;
  for (let r2 = 0; r2 < n2.length; r2 += 1) {
    let i2 = n2[r2], a2;
    if (i2.spec.isInputRules && (a2 = i2.getState(e49))) {
      if (t2) {
        let t3 = e49.tr, n3 = a2.transform;
        for (let e50 = n3.steps.length - 1; e50 >= 0; --e50) t3.step(n3.steps[e50].invert(n3.docs[e50]));
        if (a2.text) {
          let n4 = t3.doc.resolve(a2.from).marks();
          t3.replaceWith(a2.from, a2.to, e49.schema.text(a2.text, n4));
        } else t3.delete(a2.from, a2.to);
      }
      return !0;
    }
  }
  return !1;
};
var Ru = (e49 = {}) => ({ tr: t2, dispatch: n2, editor: r2 }) => {
  let { ignoreClearable: i2 = !1 } = e49, { selection: a2 } = t2, { empty: o2, ranges: s2 } = a2;
  if (o2) return !0;
  let { nonClearableMarks: c2 } = r2.extensionManager;
  if (n2) {
    let e50 = Object.values(r2.schema.marks).filter((e51) => i2 || !c2.includes(e51.name));
    s2.forEach((n3) => {
      for (let r3 of e50) t2.removeMark(n3.$from.pos, n3.$to.pos, r3);
    });
  }
  return !0;
};
var zu = (e49, t2 = {}) => ({ tr: n2, state: r2, dispatch: i2 }) => {
  let { extendEmptyMarkRange: a2 = !1 } = t2, { selection: o2 } = n2, s2 = Mc(e49, r2.schema), { $from: c2, empty: l2, ranges: u2 } = o2;
  if (!i2) return !0;
  if (l2 && a2) {
    let { from: e50, to: t3 } = o2, r3 = jc(c2, s2, c2.marks().find((e51) => e51.type === s2)?.attrs);
    r3 && (e50 = r3.from, t3 = r3.to), n2.removeMark(e50, t3, s2);
  } else u2.forEach((e50) => {
    n2.removeMark(e50.$from.pos, e50.$to.pos, s2);
  });
  return n2.removeStoredMark(s2), !0;
};
var Bu = (e49) => ({ tr: t2, state: n2, dispatch: r2 }) => {
  let { selection: i2 } = n2, a2, o2;
  return typeof e49 == "number" ? (a2 = e49, o2 = e49) : e49 && "from" in e49 && "to" in e49 ? (a2 = e49.from, o2 = e49.to) : (a2 = i2.from, o2 = i2.to), r2 && t2.doc.nodesBetween(a2, o2, (e50, n3) => {
    if (e50.isText) return;
    let r3 = { ...e50.attrs };
    delete r3.dir, t2.setNodeMarkup(n3, void 0, r3);
  }), !0;
};
var Vu = (e49, t2 = {}) => ({ tr: n2, state: r2, dispatch: i2 }) => {
  let a2 = null, o2 = null, s2 = fl(typeof e49 == "string" ? e49 : e49.name, r2.schema);
  if (!s2) return !1;
  s2 === "node" && (a2 = H(e49, r2.schema)), s2 === "mark" && (o2 = Mc(e49, r2.schema));
  let c2 = !1;
  return n2.selection.ranges.forEach((e50) => {
    let s3 = e50.$from.pos, l2 = e50.$to.pos, u2, d2, f2, p2;
    n2.selection.empty ? r2.doc.nodesBetween(s3, l2, (e51, t3) => {
      a2 && a2 === e51.type && (c2 = !0, f2 = Math.max(t3, s3), p2 = Math.min(t3 + e51.nodeSize, l2), u2 = t3, d2 = e51);
    }) : r2.doc.nodesBetween(s3, l2, (e51, r3) => {
      r3 < s3 && a2 && a2 === e51.type && (c2 = !0, f2 = Math.max(r3, s3), p2 = Math.min(r3 + e51.nodeSize, l2), u2 = r3, d2 = e51), r3 >= s3 && r3 <= l2 && (a2 && a2 === e51.type && (c2 = !0, i2 && n2.setNodeMarkup(r3, void 0, { ...e51.attrs, ...t2 })), o2 && e51.marks.length && e51.marks.forEach((a3) => {
        if (o2 === a3.type && (c2 = !0, i2)) {
          let i3 = Math.max(r3, s3), c3 = Math.min(r3 + e51.nodeSize, l2);
          n2.addMark(i3, c3, o2.create({ ...a3.attrs, ...t2 }));
        }
      }));
    }), d2 && (u2 !== void 0 && i2 && n2.setNodeMarkup(u2, void 0, { ...d2.attrs, ...t2 }), o2 && d2.marks.length && d2.marks.forEach((e51) => {
      o2 === e51.type && i2 && n2.addMark(f2, p2, o2.create({ ...e51.attrs, ...t2 }));
    }));
  }), c2;
};
var Hu = (e49, t2 = {}) => ({ state: n2, dispatch: r2 }) => Cr(H(e49, n2.schema), t2)(n2, r2);
var Uu = (e49, t2 = {}) => ({ state: n2, dispatch: r2 }) => Ar(H(e49, n2.schema), t2)(n2, r2);
var Wu = class {
  constructor() {
    this.callbacks = {};
  }
  on(e49, t2) {
    return this.callbacks[e49] || (this.callbacks[e49] = []), this.callbacks[e49].push(t2), this;
  }
  emit(e49, ...t2) {
    let n2 = this.callbacks[e49];
    return n2 && n2.forEach((e50) => e50.apply(this, t2)), this;
  }
  off(e49, t2) {
    let n2 = this.callbacks[e49];
    return n2 && (t2 ? this.callbacks[e49] = n2.filter((e50) => e50 !== t2) : delete this.callbacks[e49]), this;
  }
  once(e49, t2) {
    let n2 = (...r2) => {
      this.off(e49, n2), t2.apply(this, r2);
    };
    return this.on(e49, n2);
  }
  removeAllListeners() {
    this.callbacks = {};
  }
};
function Gu(e49, t2) {
  let { selection: n2 } = e49, { $from: r2 } = n2;
  if (n2 instanceof j) {
    let e50 = r2.index();
    return r2.parent.canReplaceWith(e50, e50 + 1, t2);
  }
  let i2 = r2.depth;
  for (; i2 >= 0; ) {
    let e50 = r2.index(i2);
    if (r2.node(i2).contentMatchAt(e50).matchType(t2)) return !0;
    --i2;
  }
  return !1;
}
function Ku(e49, t2, n2) {
  let r2 = document.querySelector(`style[data-tiptap-style${n2 ? `-${n2}` : ""}]`);
  if (r2 !== null) return r2;
  let i2 = document.createElement("style");
  return t2 && i2.setAttribute("nonce", t2), i2.setAttribute(`data-tiptap-style${n2 ? `-${n2}` : ""}`, ""), i2.innerHTML = e49, document.getElementsByTagName("head")[0].appendChild(i2), i2;
}
function qu(e49) {
  return e49.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
function Ju(e49) {
  return typeof e49 == "number";
}
function Yu(e49) {
  return Object.prototype.toString.call(e49).slice(8, -1);
}
function Xu(e49) {
  return Yu(e49) === "Object" && e49.constructor === Object && Object.getPrototypeOf(e49) === Object.prototype;
}
cc({}, { createAtomBlockMarkdownSpec: () => $u, createBlockMarkdownSpec: () => ed, createInlineMarkdownSpec: () => rd, parseAttributes: () => Zu, parseIndentedBlocks: () => id, renderNestedMarkdownContent: () => ad, serializeAttributes: () => Qu });
function Zu(e49) {
  if (!e49?.trim()) return {};
  let t2 = {}, n2 = [], r2 = e49.replace(/["']([^"']*)["']/g, (e50) => (n2.push(e50), `__QUOTED_${n2.length - 1}__`)), i2 = r2.match(/(?:^|\s)\.([\w-]+)/g);
  i2 && (t2.class = i2.map((e50) => e50.trim().slice(1)).join(" "));
  let a2 = r2.match(/(?:^|\s)#([\w-]+)/);
  a2 && (t2.id = a2[1]), Array.from(r2.matchAll(/([a-zA-Z][\w-]*)\s*=\s*(__QUOTED_\d+__)/g)).forEach(([, e50, r3]) => {
    let i3 = parseInt(r3.match(/__QUOTED_(\d+)__/)?.[1] || "0", 10), a3 = n2[i3];
    a3 && (t2[e50] = a3.slice(1, -1));
  });
  let o2 = r2.replace(/(?:^|\s)\.([\w-]+)/g, "").replace(/(?:^|\s)#([\w-]+)/g, "").replace(/([a-zA-Z][\w-]*)\s*=\s*__QUOTED_\d+__/g, "").trim();
  return o2 && o2.split(/\s+/).filter(Boolean).forEach((e50) => {
    e50.match(/^[a-zA-Z][\w-]*$/) && (t2[e50] = !0);
  }), t2;
}
function Qu(e49) {
  if (!e49 || Object.keys(e49).length === 0) return "";
  let t2 = [];
  return e49.class && String(e49.class).split(/\s+/).filter(Boolean).forEach((e50) => t2.push(`.${e50}`)), e49.id && t2.push(`#${e49.id}`), Object.entries(e49).forEach(([e50, n2]) => {
    e50 !== "class" && e50 !== "id" && (n2 === !0 ? t2.push(e50) : n2 !== !1 && n2 != null && t2.push(`${e50}="${String(n2)}"`));
  }), t2.join(" ");
}
function $u(e49) {
  let { nodeName: t2, name: n2, parseAttributes: r2 = Zu, serializeAttributes: i2 = Qu, defaultAttributes: a2 = {}, requiredAttributes: o2 = [], allowedAttributes: s2 } = e49, c2 = n2 || t2, l2 = (e50) => {
    if (!s2) return e50;
    let t3 = {};
    return s2.forEach((n3) => {
      n3 in e50 && (t3[n3] = e50[n3]);
    }), t3;
  };
  return { parseMarkdown: (e50, n3) => {
    let r3 = { ...a2, ...e50.attributes };
    return n3.createNode(t2, r3, []);
  }, markdownTokenizer: { name: t2, level: "block", start(e50) {
    let t3 = RegExp(`^:::${c2}(?:\\s|$)`, "m"), n3 = e50.match(t3)?.index;
    return n3 === void 0 ? -1 : n3;
  }, tokenize(e50, n3, i3) {
    let a3 = RegExp(`^:::${c2}(?:\\s+\\{([^}]*)\\})?\\s*:::(?:\\n|$)`), s3 = e50.match(a3);
    if (!s3) return;
    let l3 = s3[1] || "", u2 = r2(l3);
    if (!o2.find((e51) => !(e51 in u2))) return { type: t2, raw: s3[0], attributes: u2 };
  } }, renderMarkdown: (e50) => {
    let t3 = l2(e50.attrs || {}), n3 = i2(t3), r3 = n3 ? ` {${n3}}` : "";
    return `:::${c2}${r3} :::`;
  } };
}
function ed(e49) {
  let { nodeName: t2, name: n2, getContent: r2, parseAttributes: i2 = Zu, serializeAttributes: a2 = Qu, defaultAttributes: o2 = {}, content: s2 = "block", allowedAttributes: c2 } = e49, l2 = n2 || t2, u2 = (e50) => {
    if (!c2) return e50;
    let t3 = {};
    return c2.forEach((n3) => {
      n3 in e50 && (t3[n3] = e50[n3]);
    }), t3;
  };
  return { parseMarkdown: (e50, n3) => {
    let i3;
    if (r2) {
      let t3 = r2(e50);
      i3 = typeof t3 == "string" ? [{ type: "text", text: t3 }] : t3;
    } else i3 = s2 === "block" ? n3.parseChildren(e50.tokens || []) : n3.parseInline(e50.tokens || []);
    let a3 = { ...o2, ...e50.attributes };
    return n3.createNode(t2, a3, i3);
  }, markdownTokenizer: { name: t2, level: "block", start(e50) {
    let t3 = RegExp(`^:::${l2}`, "m"), n3 = e50.match(t3)?.index;
    return n3 === void 0 ? -1 : n3;
  }, tokenize(e50, n3, r3) {
    let a3 = RegExp(`^:::${l2}(?:\\s+\\{([^}]*)\\})?\\s*\\n`), o3 = e50.match(a3);
    if (!o3) return;
    let [c3, u3 = ""] = o3, d2 = i2(u3), f2 = 1, p2 = c3.length, m2 = "", h2 = /^:::([\w-]*)(\s.*)?/gm, g2 = e50.slice(p2);
    for (h2.lastIndex = 0; ; ) {
      let n4 = h2.exec(g2);
      if (n4 === null) break;
      let i3 = n4.index, a4 = n4[1];
      if (!n4[2]?.endsWith(":::")) {
        if (a4) f2 += 1;
        else if (--f2, f2 === 0) {
          let a5 = g2.slice(0, i3);
          m2 = a5.trim();
          let o4 = e50.slice(0, p2 + i3 + n4[0].length), c4 = [];
          if (m2)
            if (s2 === "block") for (c4 = r3.blockTokens(a5), c4.forEach((e51) => {
              e51.text && (!e51.tokens || e51.tokens.length === 0) && (e51.tokens = r3.inlineTokens(e51.text));
            }); c4.length > 0; ) {
              let e51 = c4[c4.length - 1];
              if (e51.type === "paragraph" && (!e51.text || e51.text.trim() === "")) c4.pop();
              else break;
            }
            else c4 = r3.inlineTokens(m2);
          return { type: t2, raw: o4, attributes: d2, content: m2, tokens: c4 };
        }
      }
    }
  } }, renderMarkdown: (e50, t3) => {
    let n3 = u2(e50.attrs || {}), r3 = a2(n3), i3 = r3 ? ` {${r3}}` : "", o3 = t3.renderChildren(e50.content || [], `

`);
    return `:::${l2}${i3}

${o3}

:::`;
  } };
}
function td(e49) {
  if (!e49.trim()) return {};
  let t2 = {}, n2 = /(\w+)=(?:"([^"]*)"|'([^']*)')/g, r2 = n2.exec(e49);
  for (; r2 !== null; ) {
    let [, i2, a2, o2] = r2;
    t2[i2] = a2 || o2, r2 = n2.exec(e49);
  }
  return t2;
}
function nd(e49) {
  return Object.entries(e49).filter(([, e50]) => e50 != null).map(([e50, t2]) => `${e50}="${t2}"`).join(" ");
}
function rd(e49) {
  let { nodeName: t2, name: n2, getContent: r2, parseAttributes: i2 = td, serializeAttributes: a2 = nd, defaultAttributes: o2 = {}, selfClosing: s2 = !1, allowedAttributes: c2 } = e49, l2 = n2 || t2, u2 = (e50) => {
    if (!c2) return e50;
    let t3 = {};
    return c2.forEach((n3) => {
      let r3 = typeof n3 == "string" ? n3 : n3.name, i3 = typeof n3 == "string" ? void 0 : n3.skipIfDefault;
      if (r3 in e50) {
        let n4 = e50[r3];
        if (i3 !== void 0 && n4 === i3) return;
        t3[r3] = n4;
      }
    }), t3;
  }, d2 = l2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { parseMarkdown: (e50, n3) => {
    let i3 = { ...o2, ...e50.attributes };
    if (s2) return n3.createNode(t2, i3);
    let a3 = r2 ? r2(e50) : e50.content || "";
    return a3 ? n3.createNode(t2, i3, [n3.createTextNode(a3)]) : n3.createNode(t2, i3, []);
  }, markdownTokenizer: { name: t2, level: "inline", start(e50) {
    let t3 = RegExp(s2 ? `\\[${d2}\\s*[^\\]]*\\]` : `\\[${d2}\\s*[^\\]]*\\][\\s\\S]*?\\[\\/${d2}\\]`), n3 = e50.match(t3)?.index;
    return n3 === void 0 ? -1 : n3;
  }, tokenize(e50, n3, r3) {
    let a3 = RegExp(s2 ? `^\\[${d2}\\s*([^\\]]*)\\]` : `^\\[${d2}\\s*([^\\]]*)\\]([\\s\\S]*?)\\[\\/${d2}\\]`), o3 = e50.match(a3);
    if (!o3) return;
    let c3 = "", l3 = "";
    if (s2) {
      let [, e51] = o3;
      l3 = e51;
    } else {
      let [, e51, t3] = o3;
      l3 = e51, c3 = t3 || "";
    }
    let u3 = i2(l3.trim());
    return { type: t2, raw: o3[0], content: c3.trim(), attributes: u3 };
  } }, renderMarkdown: (e50) => {
    let t3 = "";
    r2 ? t3 = r2(e50) : e50.content && e50.content.length > 0 && (t3 = e50.content.filter((e51) => e51.type === "text").map((e51) => e51.text).join(""));
    let n3 = u2(e50.attrs || {}), i3 = a2(n3), o3 = i3 ? ` ${i3}` : "";
    return s2 ? `[${l2}${o3}]` : `[${l2}${o3}]${t3}[/${l2}]`;
  } };
}
function id(e49, t2, n2) {
  let r2 = e49.split(`
`), i2 = [], a2 = "", o2 = 0, s2 = t2.baseIndentSize || 2;
  for (; o2 < r2.length; ) {
    let e50 = r2[o2], c2 = e50.match(t2.itemPattern);
    if (!c2) {
      if (i2.length > 0) break;
      if (e50.trim() === "") {
        o2 += 1, a2 = `${a2}${e50}
`;
        continue;
      }
      return;
    }
    let l2 = t2.extractItemData(c2), { indentLevel: u2, mainContent: d2 } = l2;
    a2 = `${a2}${e50}
`;
    let f2 = [d2];
    for (o2 += 1; o2 < r2.length; ) {
      let e51 = r2[o2];
      if (e51.trim() === "") {
        let t3 = r2.slice(o2 + 1).findIndex((e52) => e52.trim() !== "");
        if (t3 === -1) break;
        if ((r2[o2 + 1 + t3].match(/^(\s*)/)?.[1]?.length || 0) > u2) {
          f2.push(e51), a2 = `${a2}${e51}
`, o2 += 1;
          continue;
        }
        break;
      }
      if ((e51.match(/^(\s*)/)?.[1]?.length || 0) > u2) f2.push(e51), a2 = `${a2}${e51}
`, o2 += 1;
      else break;
    }
    let p2, m2 = f2.slice(1);
    if (m2.length > 0) {
      let e51 = m2.map((e52) => e52.slice(u2 + s2)).join(`
`);
      e51.trim() && (p2 = t2.customNestedParser ? t2.customNestedParser(e51) : n2.blockTokens(e51));
    }
    let h2 = t2.createToken(l2, p2);
    i2.push(h2);
  }
  if (i2.length !== 0) return { items: i2, raw: a2 };
}
function ad(e49, t2, n2, r2) {
  if (!e49 || !Array.isArray(e49.content)) return "";
  let i2 = typeof n2 == "function" ? n2(r2) : n2, [a2, ...o2] = e49.content, s2 = `${i2}${t2.renderChildren([a2])}`;
  return o2 && o2.length > 0 && o2.forEach((e50, n3) => {
    let r3 = t2.renderChild?.call(t2, e50, n3 + 1) ?? t2.renderChildren([e50]);
    if (r3 != null) {
      let n4 = r3.split(`
`).map((e51) => e51 ? t2.indent(e51) : t2.indent("")).join(`
`);
      s2 += e50.type === "paragraph" ? `

${n4}` : `
${n4}`;
    }
  }), s2;
}
function od(e49, t2) {
  let n2 = { ...e49 };
  return Xu(e49) && Xu(t2) && Object.keys(t2).forEach((r2) => {
    Xu(t2[r2]) && Xu(e49[r2]) ? n2[r2] = od(e49[r2], t2[r2]) : n2[r2] = t2[r2];
  }), n2;
}
function sd(e49, t2, n2 = {}) {
  let { state: r2 } = t2, { doc: i2, tr: a2 } = r2, o2 = e49;
  i2.descendants((t3, r3) => {
    let i3 = a2.mapping.map(r3), s2 = a2.mapping.map(r3) + t3.nodeSize, c2 = null;
    if (t3.marks.forEach((e50) => {
      if (e50 !== o2) return !1;
      c2 = e50;
    }), !c2) return;
    let l2 = !1;
    if (Object.keys(n2).forEach((e50) => {
      n2[e50] !== c2.attrs[e50] && (l2 = !0);
    }), l2) {
      let t4 = e49.type.create({ ...e49.attrs, ...n2 });
      a2.removeMark(i3, s2, e49.type), a2.addMark(i3, s2, t4);
    }
  }), a2.docChanged && t2.view.dispatch(a2);
}
var cd = class {
  constructor(e49) {
    this.find = e49.find, this.handler = e49.handler, this.undoable = e49.undoable ?? !0;
  }
};
var ld = (e49, t2) => {
  if (Dc(t2)) return t2.exec(e49);
  let n2 = t2(e49);
  if (!n2) return null;
  let r2 = [n2.text];
  return r2.index = n2.index, r2.input = e49, r2.data = n2.data, n2.replaceWith && (n2.text.includes(n2.replaceWith) || console.warn('[tiptap warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".'), r2.push(n2.replaceWith)), r2;
};
function ud(e49) {
  let { editor: t2, from: n2, to: r2, text: i2, rules: a2, plugin: o2 } = e49, { view: s2 } = t2;
  if (s2.composing) return !1;
  let c2 = s2.state.doc.resolve(n2);
  if (c2.parent.type.spec.code || (c2.nodeBefore || c2.nodeAfter)?.marks.find((e50) => e50.type.spec.code)) return !1;
  let l2 = !1, u2 = au(c2) + i2;
  return a2.forEach((e50) => {
    if (l2) return;
    let a3 = ld(u2, e50.find);
    if (!a3) return;
    let c3 = s2.state.tr, d2 = lc({ state: s2.state, transaction: c3 }), f2 = { from: n2 - (a3[0].length - i2.length), to: r2 }, { commands: p2, chain: m2, can: h2 } = new uc({ editor: t2, state: d2 });
    e50.handler({ state: d2, range: f2, match: a3, commands: p2, chain: m2, can: h2 }) !== null && c3.steps.length && (e50.undoable && c3.setMeta(o2, { transform: c3, from: n2, to: r2, text: i2 }), s2.dispatch(c3), l2 = !0);
  }), l2;
}
function dd(e49) {
  let { editor: t2, rules: n2 } = e49, r2 = new M({ state: { init() {
    return null;
  }, apply(e50, i2, a2) {
    let o2 = e50.getMeta(r2);
    if (o2) return o2;
    let s2 = e50.getMeta("applyInputRules");
    return s2 && setTimeout(() => {
      let { text: e51 } = s2;
      e51 = typeof e51 == "string" ? e51 : jl(y.from(e51), a2.schema);
      let { from: i3 } = s2, o3 = i3 + e51.length;
      ud({ editor: t2, from: i3, to: o3, text: e51, rules: n2, plugin: r2 });
    }), e50.selectionSet || e50.docChanged ? null : i2;
  } }, props: { handleTextInput(e50, i2, a2, o2) {
    return ud({ editor: t2, from: i2, to: a2, text: o2, rules: n2, plugin: r2 });
  }, handleDOMEvents: { compositionend: (e50) => (setTimeout(() => {
    let { $cursor: i2 } = e50.state.selection;
    i2 && ud({ editor: t2, from: i2.pos, to: i2.pos, text: "", rules: n2, plugin: r2 });
  }), !1) }, handleKeyDown(e50, i2) {
    if (i2.key !== "Enter") return !1;
    let { $cursor: a2 } = e50.state.selection;
    return a2 ? ud({ editor: t2, from: a2.pos, to: a2.pos, text: `
`, rules: n2, plugin: r2 }) : !1;
  } }, isInputRules: !0 });
  return r2;
}
var fd = class {
  constructor(e49 = {}) {
    this.type = "extendable", this.parent = null, this.child = null, this.name = "", this.config = { name: this.name }, this.config = { ...this.config, ...e49 }, this.name = this.config.name;
  }
  get options() {
    return { ...W(U(this, "addOptions", { name: this.name })) };
  }
  get storage() {
    return { ...W(U(this, "addStorage", { name: this.name, options: this.options })) };
  }
  configure(e49 = {}) {
    let t2 = this.extend({ ...this.config, addOptions: () => od(this.options, e49) });
    return t2.name = this.name, t2.parent = this.parent, this.child = null, t2;
  }
  extend(e49 = {}) {
    let t2 = new this.constructor({ ...this.config, ...e49 });
    return t2.parent = this, this.child = t2, t2.name = "name" in e49 ? e49.name : t2.parent.name, t2;
  }
};
var pd = class e41 extends fd {
  constructor() {
    super(...arguments), this.type = "mark";
  }
  static create(t2 = {}) {
    let n2 = typeof t2 == "function" ? t2() : t2;
    return new e41(n2);
  }
  static handleExit({ editor: e49, mark: t2 }) {
    let { tr: n2 } = e49.state, r2 = e49.state.selection.$from;
    if (r2.pos === r2.end()) {
      let i2 = r2.marks();
      if (!i2.find((e50) => e50?.type.name === t2.name)) return !1;
      let a2 = i2.find((e50) => e50?.type.name === t2.name);
      return a2 && n2.removeStoredMark(a2), n2.insertText(" ", r2.pos), e49.view.dispatch(n2), !0;
    }
    return !1;
  }
  configure(e49) {
    return super.configure(e49);
  }
  extend(e49) {
    let t2 = typeof e49 == "function" ? e49() : e49;
    return super.extend(t2);
  }
};
var md = class {
  constructor(e49) {
    this.find = e49.find, this.handler = e49.handler;
  }
};
var hd = (e49, t2, n2) => {
  if (Dc(t2)) return [...e49.matchAll(t2)];
  let r2 = t2(e49, n2);
  return r2 ? r2.map((t3) => {
    let n3 = [t3.text];
    return n3.index = t3.index, n3.input = e49, n3.data = t3.data, t3.replaceWith && (t3.text.includes(t3.replaceWith) || console.warn('[tiptap warn]: "pasteRuleMatch.replaceWith" must be part of "pasteRuleMatch.text".'), n3.push(t3.replaceWith)), n3;
  }) : [];
};
function gd(e49) {
  let { editor: t2, state: n2, from: r2, to: i2, rule: a2, pasteEvent: o2, dropEvent: s2 } = e49, { commands: c2, chain: l2, can: u2 } = new uc({ editor: t2, state: n2 }), d2 = [];
  return n2.doc.nodesBetween(r2, i2, (e50, t3) => {
    if (e50.type?.spec?.code || !(e50.isText || e50.isTextblock || e50.isInline)) return;
    let f2 = e50.content?.size ?? e50.nodeSize ?? 0, p2 = Math.max(r2, t3), m2 = Math.min(i2, t3 + f2);
    p2 >= m2 || hd(e50.isText ? e50.text || "" : e50.textBetween(p2 - t3, m2 - t3, void 0, "\uFFFC"), a2.find, o2).forEach((e51) => {
      if (e51.index === void 0) return;
      let t4 = p2 + e51.index + 1, r3 = t4 + e51[0].length, i3 = { from: n2.tr.mapping.map(t4), to: n2.tr.mapping.map(r3) }, f3 = a2.handler({ state: n2, range: i3, match: e51, commands: c2, chain: l2, can: u2, pasteEvent: o2, dropEvent: s2 });
      d2.push(f3);
    });
  }), d2.every((e50) => e50 !== null);
}
var _d = null;
var vd = (e49) => {
  var t2;
  let n2 = new ClipboardEvent("paste", { clipboardData: new DataTransfer() });
  return (t2 = n2.clipboardData) == null || t2.setData("text/html", e49), n2;
};
function yd(e49) {
  let { editor: t2, rules: n2 } = e49, r2 = null, i2 = !1, a2 = !1, o2 = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, s2;
  try {
    s2 = typeof DragEvent < "u" ? new DragEvent("drop") : null;
  } catch {
    s2 = null;
  }
  let c2 = ({ state: e50, from: n3, to: r3, rule: i3, pasteEvt: a3 }) => {
    let c3 = e50.tr, l2 = lc({ state: e50, transaction: c3 });
    if (gd({ editor: t2, state: l2, from: Math.max(n3 - 1, 0), to: r3.b - 1, rule: i3, pasteEvent: a3, dropEvent: s2 }) && c3.steps.length) {
      try {
        s2 = typeof DragEvent < "u" ? new DragEvent("drop") : null;
      } catch {
        s2 = null;
      }
      return o2 = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, c3;
    }
  };
  return n2.map((e50) => new M({ view(e51) {
    let n3 = (n4) => {
      r2 = e51.dom.parentElement?.contains(n4.target) ? e51.dom.parentElement : null, r2 && (_d = t2);
    }, i3 = () => {
      _d &&= null;
    };
    return window.addEventListener("dragstart", n3), window.addEventListener("dragend", i3), { destroy() {
      window.removeEventListener("dragstart", n3), window.removeEventListener("dragend", i3);
    } };
  }, props: { handleDOMEvents: { drop: (e51, t3) => {
    if (a2 = r2 === e51.dom.parentElement, s2 = t3, !a2) {
      let e52 = _d;
      e52?.isEditable && setTimeout(() => {
        let t4 = e52.state.selection;
        t4 && e52.commands.deleteRange({ from: t4.from, to: t4.to });
      }, 10);
    }
    return !1;
  }, paste: (e51, t3) => {
    let n3 = t3.clipboardData?.getData("text/html");
    return o2 = t3, i2 = !!n3?.includes("data-pm-slice"), !1;
  } } }, appendTransaction: (t3, n3, r3) => {
    let s3 = t3[0], l2 = s3.getMeta("uiEvent") === "paste" && !i2, u2 = s3.getMeta("uiEvent") === "drop" && !a2, d2 = s3.getMeta("applyPasteRules"), f2 = !!d2;
    if (!l2 && !u2 && !f2) return;
    if (f2) {
      let { text: t4 } = d2;
      t4 = typeof t4 == "string" ? t4 : jl(y.from(t4), r3.schema);
      let { from: n4 } = d2, i3 = n4 + t4.length, a3 = vd(t4);
      return c2({ rule: e50, state: r3, from: n4, to: { b: i3 }, pasteEvt: a3 });
    }
    let p2 = n3.doc.content.findDiffStart(r3.doc.content), m2 = n3.doc.content.findDiffEnd(r3.doc.content);
    if (Ju(p2) && m2 && p2 !== m2.b) return c2({ rule: e50, state: r3, from: p2, to: m2, pasteEvt: o2 });
  } }));
}
var bd = class {
  constructor(e49, t2) {
    this.splittableMarks = [], this.nonClearableMarks = [], this.editor = t2, this.baseExtensions = e49, this.extensions = Kl(e49), this.schema = Ul(this.extensions, t2), this.setupExtensions();
  }
  get commands() {
    return this.extensions.reduce((e49, t2) => {
      let n2 = U(t2, "addCommands", { name: t2.name, options: t2.options, storage: this.editor.extensionStorage[t2.name], editor: this.editor, type: ru(t2.name, this.schema) });
      return n2 ? { ...e49, ...n2() } : e49;
    }, {});
  }
  get plugins() {
    let { editor: e49 } = this;
    return Gl([...this.extensions].reverse()).flatMap((t2) => {
      let n2 = { name: t2.name, options: t2.options, storage: this.editor.extensionStorage[t2.name], editor: e49, type: ru(t2.name, this.schema) }, r2 = [], i2 = U(t2, "addKeyboardShortcuts", n2), a2 = {};
      if (t2.type === "mark" && U(t2, "exitable", n2) && (a2.ArrowRight = () => pd.handleExit({ editor: e49, mark: t2 })), i2) {
        let t3 = Object.fromEntries(Object.entries(i2()).map(([t4, n3]) => [t4, () => n3({ editor: e49 })]));
        a2 = { ...a2, ...t3 };
      }
      let o2 = ac(a2);
      r2.push(o2);
      let s2 = U(t2, "addInputRules", n2);
      if (uu(t2, e49.options.enableInputRules) && s2) {
        let t3 = s2();
        if (t3 && t3.length) {
          let n3 = dd({ editor: e49, rules: t3 }), i3 = Array.isArray(n3) ? n3 : [n3];
          r2.push(...i3);
        }
      }
      let c2 = U(t2, "addPasteRules", n2);
      if (uu(t2, e49.options.enablePasteRules) && c2) {
        let t3 = c2();
        if (t3 && t3.length) {
          let n3 = yd({ editor: e49, rules: t3 });
          r2.push(...n3);
        }
      }
      let l2 = U(t2, "addProseMirrorPlugins", n2);
      if (l2) {
        let e50 = l2();
        r2.push(...e50);
      }
      return r2;
    });
  }
  get attributes() {
    return Fl(this.extensions);
  }
  get nodeViews() {
    let { editor: e49 } = this, { nodeExtensions: t2 } = Pl(this.extensions);
    return Object.fromEntries(t2.filter((e50) => !!U(e50, "addNodeView")).map((t3) => {
      let n2 = this.attributes.filter((e50) => e50.type === t3.name), r2 = U(t3, "addNodeView", { name: t3.name, options: t3.options, storage: this.editor.extensionStorage[t3.name], editor: e49, type: H(t3.name, this.schema) });
      if (!r2) return [];
      let i2 = r2();
      return i2 ? [t3.name, (r3, a2, o2, s2, c2) => {
        let l2 = Rl(r3, n2);
        return i2({ node: r3, view: a2, getPos: o2, decorations: s2, innerDecorations: c2, editor: e49, extension: t3, HTMLAttributes: l2 });
      }] : [];
    }));
  }
  dispatchTransaction(e49) {
    let { editor: t2 } = this;
    return Gl([...this.extensions].reverse()).reduceRight((e50, n2) => {
      let r2 = { name: n2.name, options: n2.options, storage: this.editor.extensionStorage[n2.name], editor: t2, type: ru(n2.name, this.schema) }, i2 = U(n2, "dispatchTransaction", r2);
      return i2 ? (t3) => {
        i2.call(r2, { transaction: t3, next: e50 });
      } : e50;
    }, e49);
  }
  transformPastedHTML(e49) {
    let { editor: t2 } = this;
    return Gl([...this.extensions]).reduce((e50, n2) => {
      let r2 = { name: n2.name, options: n2.options, storage: this.editor.extensionStorage[n2.name], editor: t2, type: ru(n2.name, this.schema) }, i2 = U(n2, "transformPastedHTML", r2);
      return i2 ? (t3, n3) => {
        let a2 = e50(t3, n3);
        return i2.call(r2, a2);
      } : e50;
    }, e49 || ((e50) => e50));
  }
  get markViews() {
    let { editor: e49 } = this, { markExtensions: t2 } = Pl(this.extensions);
    return Object.fromEntries(t2.filter((e50) => !!U(e50, "addMarkView")).map((t3) => {
      let n2 = this.attributes.filter((e50) => e50.type === t3.name), r2 = U(t3, "addMarkView", { name: t3.name, options: t3.options, storage: this.editor.extensionStorage[t3.name], editor: e49, type: Mc(t3.name, this.schema) });
      return r2 ? [t3.name, (i2, a2, o2) => {
        let s2 = Rl(i2, n2);
        return r2()({ mark: i2, view: a2, inline: o2, editor: e49, extension: t3, HTMLAttributes: s2, updateAttributes: (t4) => {
          sd(i2, e49, t4);
        } });
      }] : [];
    }));
  }
  destroy() {
    this.extensions.forEach((e49) => {
      let t2 = e49;
      for (; t2.parent; ) {
        let e50 = t2.parent;
        e50.child === t2 && (e50.child = null), t2 = e50;
      }
    }), this.extensions = [], this.baseExtensions = [], this.schema = null, this.editor = null;
  }
  setupExtensions() {
    let e49 = this.extensions;
    this.editor.extensionStorage = Object.fromEntries(e49.map((e50) => [e50.name, e50.storage])), e49.forEach((e50) => {
      let t2 = { name: e50.name, options: e50.options, storage: this.editor.extensionStorage[e50.name], editor: this.editor, type: ru(e50.name, this.schema) };
      e50.type === "mark" && ((W(U(e50, "keepOnSplit", t2)) ?? !0) && this.splittableMarks.push(e50.name), (W(U(e50, "clearable", t2)) ?? !0) || this.nonClearableMarks.push(e50.name));
      let n2 = U(e50, "onBeforeCreate", t2), r2 = U(e50, "onCreate", t2), i2 = U(e50, "onUpdate", t2), a2 = U(e50, "onSelectionUpdate", t2), o2 = U(e50, "onTransaction", t2), s2 = U(e50, "onFocus", t2), c2 = U(e50, "onBlur", t2), l2 = U(e50, "onDestroy", t2);
      n2 && this.editor.on("beforeCreate", n2), r2 && this.editor.on("create", r2), i2 && this.editor.on("update", i2), a2 && this.editor.on("selectionUpdate", a2), o2 && this.editor.on("transaction", o2), s2 && this.editor.on("focus", s2), c2 && this.editor.on("blur", c2), l2 && this.editor.on("destroy", l2);
    });
  }
};
(bd.resolve = Kl);
(bd.sort = Gl);
(bd.flatten = Al);
(cc({}, { ClipboardTextSerializer: () => xd, Commands: () => Sd, Delete: () => Cd, Drop: () => wd, Editable: () => Td, FocusEvents: () => Dd, Keymap: () => Od, Paste: () => kd, Tabindex: () => Ad, TextDirection: () => jd, focusEventsPluginKey: () => Ed }));
var K = class e42 extends fd {
  constructor() {
    super(...arguments), this.type = "extension";
  }
  static create(t2 = {}) {
    let n2 = typeof t2 == "function" ? t2() : t2;
    return new e42(n2);
  }
  configure(e49) {
    return super.configure(e49);
  }
  extend(e49) {
    let t2 = typeof e49 == "function" ? e49() : e49;
    return super.extend(t2);
  }
};
var xd = K.create({ name: "clipboardTextSerializer", addOptions() {
  return { blockSeparator: void 0 };
}, addProseMirrorPlugins() {
  return [new M({ key: new N("clipboardTextSerializer"), props: { clipboardTextSerializer: () => {
    let { editor: e49 } = this, { state: t2, schema: n2 } = e49, { doc: r2, selection: i2 } = t2, a2 = Yl(n2), { blockSeparator: o2 } = this.options, s2 = { ...o2 === void 0 ? {} : { blockSeparator: o2 }, textSerializers: a2 };
    return [...i2.ranges].sort((e50, t3) => e50.$from.pos - t3.$from.pos).map(({ $from: e50, $to: t3 }) => ql(r2, { from: e50.pos, to: t3.pos }, s2)).join(o2 ?? `

`);
  } } })];
} });
var Sd = K.create({ name: "commands", addCommands() {
  return { ...dc };
} });
var Cd = K.create({ name: "delete", onUpdate({ transaction: e49, appendedTransactions: t2 }) {
  let n2 = () => {
    var n3;
    if ((n3 = this.editor.options.coreExtensionOptions?.delete)?.filterTransaction?.call(n3, e49) ?? e49.getMeta("y-sync$")) return;
    let r2 = Tl(e49.before, [e49, ...t2]);
    eu(r2).forEach((t3) => {
      r2.mapping.mapResult(t3.oldRange.from).deletedAfter && r2.mapping.mapResult(t3.oldRange.to).deletedBefore && r2.before.nodesBetween(t3.oldRange.from, t3.oldRange.to, (n4, i3) => {
        let a2 = i3 + n4.nodeSize - 2, o2 = t3.oldRange.from <= i3 && a2 <= t3.oldRange.to;
        this.editor.emit("delete", { type: "node", node: n4, from: i3, to: a2, newFrom: r2.mapping.map(i3), newTo: r2.mapping.map(a2), deletedRange: t3.oldRange, newRange: t3.newRange, partial: !o2, editor: this.editor, transaction: e49, combinedTransform: r2 });
      });
    });
    let i2 = r2.mapping;
    r2.steps.forEach((t3, n4) => {
      if (t3 instanceof kt) {
        let a2 = i2.slice(n4).map(t3.from, -1), o2 = i2.slice(n4).map(t3.to), s2 = i2.invert().map(a2, -1), c2 = i2.invert().map(o2), l2 = a2 > 0 && r2.doc.nodeAt(a2 - 1)?.marks.some((e50) => e50.eq(t3.mark)), u2 = r2.doc.nodeAt(o2)?.marks.some((e50) => e50.eq(t3.mark));
        this.editor.emit("delete", { type: "mark", mark: t3.mark, from: t3.from, to: t3.to, deletedRange: { from: s2, to: c2 }, newRange: { from: a2, to: o2 }, partial: !!(u2 || l2), editor: this.editor, transaction: e49, combinedTransform: r2 });
      }
    });
  };
  this.editor.options.coreExtensionOptions?.delete?.async ?? !0 ? setTimeout(n2, 0) : n2();
} });
var wd = K.create({ name: "drop", addProseMirrorPlugins() {
  return [new M({ key: new N("tiptapDrop"), props: { handleDrop: (e49, t2, n2, r2) => {
    this.editor.emit("drop", { editor: this.editor, event: t2, slice: n2, moved: r2 });
  } } })];
} });
var Td = K.create({ name: "editable", addProseMirrorPlugins() {
  return [new M({ key: new N("editable"), props: { editable: () => this.editor.options.editable } })];
} });
var Ed = new N("focusEvents");
var Dd = K.create({ name: "focusEvents", addProseMirrorPlugins() {
  let { editor: e49 } = this;
  return [new M({ key: Ed, props: { handleDOMEvents: { focus: (t2, n2) => {
    e49.isFocused = !0;
    let r2 = e49.state.tr.setMeta("focus", { event: n2 }).setMeta("addToHistory", !1);
    return t2.dispatch(r2), !1;
  }, blur: (t2, n2) => {
    e49.isFocused = !1;
    let r2 = e49.state.tr.setMeta("blur", { event: n2 }).setMeta("addToHistory", !1);
    return t2.dispatch(r2), !1;
  } } } })];
} });
var Od = K.create({ name: "keymap", addKeyboardShortcuts() {
  let e49 = () => this.editor.commands.first(({ commands: e50 }) => [() => e50.undoInputRule(), () => e50.command(({ tr: t3 }) => {
    let { selection: n3, doc: r3 } = t3, { empty: i3, $anchor: a2 } = n3, { pos: o2, parent: s2 } = a2, c2 = a2.parent.isTextblock && o2 > 0 ? t3.doc.resolve(o2 - 1) : a2, l2 = c2.parent.type.spec.isolating, u2 = a2.pos - a2.parentOffset, d2 = l2 && c2.parent.childCount === 1 ? u2 === a2.pos : k.atStart(r3).from === o2;
    return !i3 || !s2.type.isTextblock || s2.textContent.length || !d2 || d2 && a2.parent.type.name === "paragraph" ? !1 : e50.clearNodes();
  }), () => e50.deleteSelection(), () => e50.joinBackward(), () => e50.selectNodeBackward()]), t2 = () => this.editor.commands.first(({ commands: e50 }) => [() => e50.deleteSelection(), () => e50.deleteCurrentNode(), () => e50.joinForward(), () => e50.selectNodeForward()]), n2 = { Enter: () => this.editor.commands.first(({ commands: e50 }) => [() => e50.newlineInCode(), () => e50.createParagraphNear(), () => e50.liftEmptyBlock(), () => e50.splitBlock()]), "Mod-Enter": () => this.editor.commands.exitCode(), Backspace: e49, "Mod-Backspace": e49, "Shift-Backspace": e49, Delete: t2, "Mod-Delete": t2, "Mod-a": () => this.editor.commands.selectAll() }, r2 = { ...n2 }, i2 = { ...n2, "Ctrl-h": e49, "Alt-Backspace": e49, "Ctrl-d": t2, "Ctrl-Alt-Backspace": t2, "Alt-Delete": t2, "Alt-d": t2, "Ctrl-a": () => this.editor.commands.selectTextblockStart(), "Ctrl-e": () => this.editor.commands.selectTextblockEnd() };
  return zc() || il() ? i2 : r2;
}, addProseMirrorPlugins() {
  return [new M({ key: new N("clearDocument"), appendTransaction: (e49, t2, n2) => {
    if (e49.some((e50) => e50.getMeta("composition"))) return;
    let r2 = e49.some((e50) => e50.docChanged) && !t2.doc.eq(n2.doc), i2 = e49.some((e50) => e50.getMeta("preventClearDocument"));
    if (!r2 || i2) return;
    let { empty: a2, from: o2, to: s2 } = t2.selection, c2 = k.atStart(t2.doc).from, l2 = k.atEnd(t2.doc).to;
    if (a2 || o2 !== c2 || s2 !== l2 || !fu(n2.doc)) return;
    let u2 = n2.tr, d2 = lc({ state: n2, transaction: u2 }), { commands: f2 } = new uc({ editor: this.editor, state: d2 });
    if (f2.clearNodes(), u2.steps.length) return u2;
  } })];
} });
var kd = K.create({ name: "paste", addProseMirrorPlugins() {
  return [new M({ key: new N("tiptapPaste"), props: { handlePaste: (e49, t2, n2) => {
    this.editor.emit("paste", { editor: this.editor, event: t2, slice: n2 });
  } } })];
} });
var Ad = K.create({ name: "tabindex", addOptions() {
  return { value: void 0 };
}, addProseMirrorPlugins() {
  return [new M({ key: new N("tabindex"), props: { attributes: () => !this.editor.isEditable && this.options.value === void 0 ? {} : { tabindex: this.options.value ?? "0" } } })];
} });
var jd = K.create({ name: "textDirection", addOptions() {
  return { direction: void 0 };
}, addGlobalAttributes() {
  if (!this.options.direction) return [];
  let { nodeExtensions: e49 } = Pl(this.extensions);
  return [{ types: e49.filter((e50) => e50.name !== "text").map((e50) => e50.name), attributes: { dir: { default: this.options.direction, parseHTML: (e50) => {
    let t2 = e50.getAttribute("dir");
    return t2 && (t2 === "ltr" || t2 === "rtl" || t2 === "auto") ? t2 : this.options.direction;
  }, renderHTML: (e50) => e50.dir ? { dir: e50.dir } : {} } } }];
}, addProseMirrorPlugins() {
  return [new M({ key: new N("textDirection"), props: { attributes: () => {
    let e49 = this.options.direction;
    return e49 ? { dir: e49 } : {};
  } } })];
} });
var Md = class e43 {
  constructor(e49, t2, n2 = !1, r2 = null) {
    this.currentNode = null, this.actualDepth = null, this.isBlock = n2, this.resolvedPos = e49, this.editor = t2, this.currentNode = r2;
  }
  get name() {
    return this.node.type.name;
  }
  get node() {
    return this.currentNode || this.resolvedPos.node();
  }
  get element() {
    return this.editor.view.domAtPos(this.pos).node;
  }
  get depth() {
    return this.actualDepth ?? this.resolvedPos.depth;
  }
  get pos() {
    return this.resolvedPos.pos;
  }
  get content() {
    return this.node.content;
  }
  set content(e49) {
    let t2 = this.from, n2 = this.to;
    if (this.isBlock) {
      if (this.content.size === 0) {
        console.error(`You can\u2019t set content on a block node. Tried to set content on ${this.name} at ${this.pos}`);
        return;
      }
      t2 = this.from + 1, n2 = this.to - 1;
    }
    this.editor.commands.insertContentAt({ from: t2, to: n2 }, e49);
  }
  get attributes() {
    return this.node.attrs;
  }
  get textContent() {
    return this.node.textContent;
  }
  get size() {
    return this.node.nodeSize;
  }
  get from() {
    return this.isBlock ? this.pos : this.resolvedPos.start(this.resolvedPos.depth);
  }
  get range() {
    return { from: this.from, to: this.to };
  }
  get to() {
    return this.isBlock ? this.pos + this.size : this.resolvedPos.end(this.resolvedPos.depth) + +!this.node.isText;
  }
  get parent() {
    if (this.depth === 0) return null;
    let t2 = this.resolvedPos.start(this.resolvedPos.depth - 1), n2 = this.resolvedPos.doc.resolve(t2);
    return new e43(n2, this.editor);
  }
  get before() {
    let t2 = this.resolvedPos.doc.resolve(this.from - (this.isBlock ? 1 : 2));
    return t2.depth !== this.depth && (t2 = this.resolvedPos.doc.resolve(this.from - 3)), new e43(t2, this.editor);
  }
  get after() {
    let t2 = this.resolvedPos.doc.resolve(this.to + (this.isBlock ? 2 : 1));
    return t2.depth !== this.depth && (t2 = this.resolvedPos.doc.resolve(this.to + 3)), new e43(t2, this.editor);
  }
  get children() {
    let t2 = [];
    return this.node.content.forEach((n2, r2) => {
      let i2 = n2.isBlock && !n2.isTextblock, a2 = n2.isAtom && !n2.isText, o2 = n2.isInline, s2 = this.pos + r2 + +!a2;
      if (s2 < 0 || s2 > this.resolvedPos.doc.nodeSize - 2) return;
      let c2 = this.resolvedPos.doc.resolve(s2);
      if (!i2 && !o2 && c2.depth <= this.depth) return;
      let l2 = new e43(c2, this.editor, i2, i2 || o2 ? n2 : null);
      i2 && (l2.actualDepth = this.depth + 1), t2.push(l2);
    }), t2;
  }
  get firstChild() {
    return this.children[0] || null;
  }
  get lastChild() {
    let e49 = this.children;
    return e49[e49.length - 1] || null;
  }
  closest(e49, t2 = {}) {
    let n2 = null, r2 = this.parent;
    for (; r2 && !n2; ) {
      if (r2.node.type.name === e49)
        if (Object.keys(t2).length > 0) {
          let e50 = r2.node.attrs, n3 = Object.keys(t2);
          for (let r3 = 0; r3 < n3.length; r3 += 1) {
            let i2 = n3[r3];
            if (e50[i2] !== t2[i2]) break;
          }
        } else n2 = r2;
      r2 = r2.parent;
    }
    return n2;
  }
  querySelector(e49, t2 = {}) {
    return this.querySelectorAll(e49, t2, !0)[0] || null;
  }
  querySelectorAll(e49, t2 = {}, n2 = !1) {
    let r2 = [];
    if (!this.children || this.children.length === 0) return r2;
    let i2 = Object.keys(t2);
    return this.children.forEach((a2) => {
      n2 && r2.length > 0 || (a2.node.type.name === e49 && i2.every((e50) => t2[e50] === a2.node.attrs[e50]) && r2.push(a2), !(n2 && r2.length > 0) && (r2 = r2.concat(a2.querySelectorAll(e49, t2, n2))));
    }), r2;
  }
  setAttribute(e49) {
    let { tr: t2 } = this.editor.state;
    t2.setNodeMarkup(this.from, void 0, { ...this.node.attrs, ...e49 }), this.editor.view.dispatch(t2);
  }
};
var Nd = `.ProseMirror {
  position: relative;
}

.ProseMirror {
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
}

.ProseMirror [contenteditable="false"] {
  white-space: normal;
}

.ProseMirror [contenteditable="false"] [contenteditable="true"] {
  white-space: pre-wrap;
}

.ProseMirror pre {
  white-space: pre-wrap;
}

img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
  width: 0 !important;
  height: 0 !important;
}

.ProseMirror-gapcursor {
  display: none;
  pointer-events: none;
  position: absolute;
  margin: 0;
}

.ProseMirror-gapcursor:after {
  content: "";
  display: block;
  position: absolute;
  top: -2px;
  width: 20px;
  border-top: 1px solid black;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}

.ProseMirror-hideselection *::selection {
  background: transparent;
}

.ProseMirror-hideselection *::-moz-selection {
  background: transparent;
}

.ProseMirror-hideselection * {
  caret-color: transparent;
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}`;
var Pd = class extends Wu {
  constructor(e49 = {}) {
    super(), this.css = null, this.className = "tiptap", this.editorView = null, this.isFocused = !1, this.destroyed = !1, this.isInitialized = !1, this.extensionStorage = {}, this.instanceId = Math.random().toString(36).slice(2, 9), this.options = { element: typeof document < "u" ? document.createElement("div") : null, content: "", injectCSS: !0, injectNonce: void 0, extensions: [], autofocus: !1, editable: !0, textDirection: void 0, editorProps: {}, parseOptions: {}, coreExtensionOptions: {}, enableInputRules: !0, enablePasteRules: !0, enableCoreExtensions: !0, enableContentCheck: !1, emitContentError: !1, onBeforeCreate: () => null, onCreate: () => null, onMount: () => null, onUnmount: () => null, onUpdate: () => null, onSelectionUpdate: () => null, onTransaction: () => null, onFocus: () => null, onBlur: () => null, onDestroy: () => null, onContentError: ({ error: e50 }) => {
      throw e50;
    }, onPaste: () => null, onDrop: () => null, onDelete: () => null, enableExtensionDispatchTransaction: !0 }, this.isCapturingTransaction = !1, this.capturedTransaction = null, this.utils = { getUpdatedPosition: hu, createMappablePosition: gu }, this.setOptions(e49), this.createExtensionManager(), this.createCommandManager(), this.createSchema(), this.on("beforeCreate", this.options.onBeforeCreate), this.emit("beforeCreate", { editor: this }), this.on("mount", this.options.onMount), this.on("unmount", this.options.onUnmount), this.on("contentError", this.options.onContentError), this.on("create", this.options.onCreate), this.on("update", this.options.onUpdate), this.on("selectionUpdate", this.options.onSelectionUpdate), this.on("transaction", this.options.onTransaction), this.on("focus", this.options.onFocus), this.on("blur", this.options.onBlur), this.on("destroy", this.options.onDestroy), this.on("drop", ({ event: e50, slice: t3, moved: n3 }) => this.options.onDrop(e50, t3, n3)), this.on("paste", ({ event: e50, slice: t3 }) => this.options.onPaste(e50, t3)), this.on("delete", this.options.onDelete);
    let t2 = this.createDoc(), n2 = Lc(t2, this.options.autofocus);
    this.editorState = Un.create({ doc: t2, schema: this.schema, selection: n2 || void 0 }), this.options.element && this.mount(this.options.element);
  }
  mount(e49) {
    if (typeof document > "u") throw Error("[tiptap error]: The editor cannot be mounted because there is no 'document' defined in this environment.");
    this.createView(e49), this.emit("mount", { editor: this }), this.css && !document.head.contains(this.css) && document.head.appendChild(this.css), window.setTimeout(() => {
      this.isDestroyed || (this.options.autofocus !== !1 && this.options.autofocus !== null && this.commands.focus(this.options.autofocus), this.emit("create", { editor: this }), this.isInitialized = !0);
    }, 0);
  }
  unmount() {
    if (this.editorView) {
      let e49 = this.editorView.dom;
      e49?.editor && delete e49.editor, this.editorView.destroy();
    }
    if (this.editorView = null, this.isInitialized = !1, this.css && !document.querySelectorAll(`.${this.className}`).length) try {
      typeof this.css.remove == "function" ? this.css.remove() : this.css.parentNode && this.css.parentNode.removeChild(this.css);
    } catch (e49) {
      console.warn("Failed to remove CSS element:", e49);
    }
    this.css = null, this.emit("unmount", { editor: this });
  }
  get storage() {
    return this.extensionStorage;
  }
  get commands() {
    return this.commandManager.commands;
  }
  chain() {
    return this.commandManager.chain();
  }
  can() {
    return this.commandManager.can();
  }
  injectCSS() {
    this.options.injectCSS && typeof document < "u" && (this.css = Ku(Nd, this.options.injectNonce));
  }
  setOptions(e49 = {}) {
    this.options = { ...this.options, ...e49 }, this.editorView && this.state && !this.isDestroyed && (this.options.editorProps && this.view.setProps(this.options.editorProps), this.view.updateState(this.state));
  }
  setEditable(e49, t2 = !0) {
    this.setOptions({ editable: e49 }), t2 && this.emit("update", { editor: this, transaction: this.state.tr, appendedTransactions: [] });
  }
  get isEditable() {
    return this.options.editable && this.view && this.view.editable;
  }
  get view() {
    return this.editorView ? this.editorView : new Proxy({ state: this.editorState, updateState: (e49) => {
      this.editorState = e49;
    }, dispatch: (e49) => {
      this.dispatchTransaction(e49);
    }, composing: !1, dragging: null, editable: !0, isDestroyed: !1 }, { get: (e49, t2) => {
      if (this.editorView) return this.editorView[t2];
      if (t2 === "state") return this.editorState;
      if (t2 in e49) return Reflect.get(e49, t2);
      throw Error(`[tiptap error]: The editor view is not available. Cannot access view['${t2}']. The editor may not be mounted yet.`);
    } });
  }
  get state() {
    return this.editorView && (this.editorState = this.view.state), this.editorState;
  }
  registerPlugin(e49, t2) {
    let n2 = Ml(t2) ? t2(e49, [...this.state.plugins]) : [...this.state.plugins, e49], r2 = this.state.reconfigure({ plugins: n2 });
    return this.view.updateState(r2), r2;
  }
  unregisterPlugin(e49) {
    if (this.isDestroyed) return;
    let t2 = this.state.plugins, n2 = t2;
    if ([].concat(e49).forEach((e50) => {
      let t3 = typeof e50 == "string" ? `${e50}$` : e50.key;
      n2 = n2.filter((e51) => !e51.key.startsWith(t3));
    }), t2.length === n2.length) return;
    let r2 = this.state.reconfigure({ plugins: n2 });
    return this.view.updateState(r2), r2;
  }
  createExtensionManager() {
    let e49 = [...this.options.enableCoreExtensions ? [Td, xd.configure({ blockSeparator: this.options.coreExtensionOptions?.clipboardTextSerializer?.blockSeparator }), Sd, Dd, Od, Ad.configure({ value: this.options.coreExtensionOptions?.tabindex?.value }), wd, kd, Cd, jd.configure({ direction: this.options.textDirection })].filter((e50) => typeof this.options.enableCoreExtensions != "object" || this.options.enableCoreExtensions[e50.name] !== !1) : [], ...this.options.extensions].filter((e50) => ["extension", "node", "mark"].includes(e50?.type));
    this.extensionManager = new bd(e49, this);
  }
  createCommandManager() {
    this.commandManager = new uc({ editor: this });
  }
  createSchema() {
    this.schema = this.extensionManager.schema;
  }
  createDoc() {
    let e49;
    try {
      e49 = Sl(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: this.options.enableContentCheck });
    } catch (t2) {
      if (!(t2 instanceof Error) || !["[tiptap error]: Invalid JSON content", "[tiptap error]: Invalid HTML content"].includes(t2.message)) throw t2;
      this.emit("contentError", { editor: this, error: t2, disableCollaboration: () => {
        "collaboration" in this.storage && typeof this.storage.collaboration == "object" && this.storage.collaboration && (this.storage.collaboration.isDisabled = !0), this.options.extensions = this.options.extensions.filter((e50) => e50.name !== "collaboration"), this.createExtensionManager();
      } }), e49 = Sl(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: !1 });
    }
    return e49;
  }
  createView(e49) {
    let { editorProps: t2, enableExtensionDispatchTransaction: n2 } = this.options, r2 = t2.dispatchTransaction || this.dispatchTransaction.bind(this), i2 = n2 ? this.extensionManager.dispatchTransaction(r2) : r2, a2 = t2.transformPastedHTML, o2 = this.extensionManager.transformPastedHTML(a2);
    this.editorView = new Ks(e49, { ...t2, attributes: { role: "textbox", ...t2?.attributes }, dispatchTransaction: i2, transformPastedHTML: o2, state: this.editorState, markViews: this.extensionManager.markViews, nodeViews: this.extensionManager.nodeViews });
    let s2 = this.state.reconfigure({ plugins: this.extensionManager.plugins });
    this.view.updateState(s2), this.prependClass(), this.injectCSS();
    let c2 = this.view.dom;
    c2.editor = this;
  }
  createNodeViews() {
    this.view.isDestroyed || this.view.setProps({ markViews: this.extensionManager.markViews, nodeViews: this.extensionManager.nodeViews });
  }
  prependClass() {
    this.view.dom.className = `${this.className} ${this.view.dom.className}`;
  }
  captureTransaction(e49) {
    this.isCapturingTransaction = !0, e49(), this.isCapturingTransaction = !1;
    let t2 = this.capturedTransaction;
    return this.capturedTransaction = null, t2;
  }
  dispatchTransaction(e49) {
    if (this.view.isDestroyed) return;
    if (this.isCapturingTransaction) {
      if (!this.capturedTransaction) {
        this.capturedTransaction = e49;
        return;
      }
      e49.steps.forEach((e50) => this.capturedTransaction?.step(e50));
      return;
    }
    let { state: t2, transactions: n2 } = this.state.applyTransaction(e49), r2 = !this.state.selection.eq(t2.selection), i2 = n2.includes(e49), a2 = this.state;
    if (this.emit("beforeTransaction", { editor: this, transaction: e49, nextState: t2 }), !i2) return;
    this.view.updateState(t2), this.emit("transaction", { editor: this, transaction: e49, appendedTransactions: n2.slice(1) }), r2 && this.emit("selectionUpdate", { editor: this, transaction: e49 });
    let o2 = n2.findLast((e50) => e50.getMeta("focus") || e50.getMeta("blur")), s2 = o2?.getMeta("focus"), c2 = o2?.getMeta("blur");
    s2 && this.emit("focus", { editor: this, event: s2.event, transaction: o2 }), c2 && this.emit("blur", { editor: this, event: c2.event, transaction: o2 }), !(e49.getMeta("preventUpdate") || !n2.some((e50) => e50.docChanged) || a2.doc.eq(t2.doc)) && this.emit("update", { editor: this, transaction: e49, appendedTransactions: n2.slice(1) });
  }
  getAttributes(e49) {
    return Zl(this.state, e49);
  }
  isActive(e49, t2) {
    let n2 = typeof e49 == "string" ? e49 : null, r2 = typeof e49 == "string" ? t2 : e49;
    return su(this.state, n2, r2);
  }
  getJSON() {
    return this.state.doc.toJSON();
  }
  getHTML() {
    return jl(this.state.doc.content, this.schema);
  }
  getText(e49) {
    let { blockSeparator: t2 = `

`, textSerializers: n2 = {} } = e49 || {};
    return Jl(this.state.doc, { blockSeparator: t2, textSerializers: { ...Yl(this.schema), ...n2 } });
  }
  get isEmpty() {
    return fu(this.state.doc);
  }
  destroy() {
    this.destroyed || (this.destroyed = !0, this.emit("destroy"), this.unmount(), this.removeAllListeners(), this.extensionManager.destroy(), this.extensionManager = null, this.schema = null, this.commandManager = null, this.extensionStorage = {});
  }
  get isDestroyed() {
    return this.editorView?.isDestroyed ?? !0;
  }
  $node(e49, t2) {
    return this.$doc?.querySelector(e49, t2) || null;
  }
  $nodes(e49, t2) {
    return this.$doc?.querySelectorAll(e49, t2) || null;
  }
  $pos(e49) {
    let t2 = this.state.doc.resolve(e49), n2 = e49 > 0 && t2.nodeAfter && !t2.nodeAfter.isText ? t2.nodeAfter : null;
    return new Md(t2, this, !1, n2);
  }
  get $doc() {
    return this.$pos(0);
  }
};
function Fd(e49) {
  return new cd({ find: e49.find, handler: ({ state: t2, range: n2, match: r2 }) => {
    let i2 = W(e49.getAttributes, void 0, r2);
    if (i2 === !1 || i2 === null) return null;
    let { tr: a2 } = t2, o2 = r2[r2.length - 1], s2 = r2[0];
    if (o2) {
      let r3 = s2.search(/\S/), c2 = n2.from + s2.indexOf(o2), l2 = c2 + o2.length;
      if (tu(n2.from, n2.to, t2.doc).filter((t3) => t3.mark.type.excluded.find((n3) => n3 === e49.type && n3 !== t3.mark.type)).filter((e50) => e50.to > c2).length) return null;
      l2 < n2.to && a2.delete(l2, n2.to), c2 > n2.from && a2.delete(n2.from + r3, c2);
      let u2 = n2.from + r3 + o2.length;
      a2.addMark(n2.from + r3, u2, e49.type.create(i2 || {})), a2.removeStoredMark(e49.type);
    }
  }, undoable: e49.undoable });
}
function Id(e49) {
  return new cd({ find: e49.find, handler: ({ state: t2, range: n2, match: r2 }) => {
    let i2 = W(e49.getAttributes, void 0, r2) || {}, { tr: a2 } = t2, o2 = n2.from, s2 = n2.to, c2 = e49.type.create(i2);
    if (r2[1]) {
      let e50 = o2 + r2[0].lastIndexOf(r2[1]);
      e50 > s2 ? e50 = s2 : s2 = e50 + r2[1].length;
      let t3 = r2[0][r2[0].length - 1];
      a2.insertText(t3, o2 + r2[0].length - 1), a2.replaceWith(e50, s2, c2);
    } else if (r2[0]) {
      let t3 = e49.type.isInline ? o2 : o2 - 1;
      a2.insert(t3, e49.type.create(i2)).delete(a2.mapping.map(o2), a2.mapping.map(s2));
    }
    a2.scrollIntoView();
  }, undoable: e49.undoable });
}
function Ld(e49) {
  return new cd({ find: e49.find, handler: ({ state: t2, range: n2, match: r2 }) => {
    let i2 = t2.doc.resolve(n2.from), a2 = W(e49.getAttributes, void 0, r2) || {};
    if (!i2.node(-1).canReplaceWith(i2.index(-1), i2.indexAfter(-1), e49.type)) return null;
    t2.tr.delete(n2.from, n2.to).setBlockType(n2.from, n2.from, e49.type, a2);
  }, undoable: e49.undoable });
}
function Rd(e49) {
  return new cd({ find: e49.find, handler: ({ state: t2, range: n2, match: r2, chain: i2 }) => {
    let a2 = W(e49.getAttributes, void 0, r2) || {}, o2 = t2.tr.delete(n2.from, n2.to), s2 = o2.doc.resolve(n2.from).blockRange(), c2 = s2 && Bt(s2, e49.type, a2);
    if (!c2) return null;
    if (o2.wrap(s2, c2), e49.keepMarks && e49.editor) {
      let { selection: n3, storedMarks: r3 } = t2, { splittableMarks: i3 } = e49.editor.extensionManager, a3 = r3 || n3.$to.parentOffset && n3.$from.marks();
      if (a3) {
        let e50 = a3.filter((e51) => i3.includes(e51.type.name));
        o2.ensureMarks(e50);
      }
    }
    if (e49.keepAttributes) {
      let t3 = e49.type.name === "bulletList" || e49.type.name === "orderedList" ? "listItem" : "taskList";
      i2().updateAttributes(t3, a2).run();
    }
    let l2 = o2.doc.resolve(n2.from - 1).nodeBefore;
    l2 && l2.type === e49.type && Qt(o2.doc, n2.from - 1) && (!e49.joinPredicate || e49.joinPredicate(r2, l2)) && o2.join(n2.from - 1);
  }, undoable: e49.undoable });
}
var q = class e44 extends fd {
  constructor() {
    super(...arguments), this.type = "node";
  }
  static create(t2 = {}) {
    let n2 = typeof t2 == "function" ? t2() : t2;
    return new e44(n2);
  }
  configure(e49) {
    return super.configure(e49);
  }
  extend(e49) {
    let t2 = typeof e49 == "function" ? e49() : e49;
    return super.extend(t2);
  }
};
function zd(e49) {
  return new md({ find: e49.find, handler: ({ state: t2, range: n2, match: r2, pasteEvent: i2 }) => {
    let a2 = W(e49.getAttributes, void 0, r2, i2);
    if (a2 === !1 || a2 === null) return null;
    let { tr: o2 } = t2, s2 = r2[r2.length - 1], c2 = r2[0], l2 = n2.to;
    if (s2) {
      let i3 = c2.search(/\S/), u2 = n2.from + c2.indexOf(s2), d2 = u2 + s2.length;
      if (tu(n2.from, n2.to, t2.doc).filter((t3) => t3.mark.type.excluded.find((n3) => n3 === e49.type && n3 !== t3.mark.type)).filter((e50) => e50.to > u2).length) return null;
      d2 < n2.to && o2.delete(d2, n2.to), u2 > n2.from && o2.delete(n2.from + i3, u2), l2 = n2.from + i3 + s2.length, o2.addMark(n2.from + i3, l2, e49.type.create(a2 || {})), r2.index !== void 0 && r2.input !== void 0 && r2.index + r2[0].length >= r2.input.length || o2.removeStoredMark(e49.type);
    }
  } });
}
function Bd(e49) {
  return c((t2, n2) => ({ get() {
    return t2(), e49;
  }, set(t3) {
    e49 = t3, requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        n2();
      });
    });
  } }));
}
var Vd = class extends Pd {
  constructor(e49 = {}) {
    return super(e49), this.contentComponent = null, this.appContext = null, this.reactiveState = Bd(this.view.state), this.reactiveExtensionStorage = Bd(this.extensionStorage), this.on("beforeTransaction", ({ nextState: e50 }) => {
      this.reactiveState.value = e50, this.reactiveExtensionStorage.value = this.extensionStorage;
    }), u(this);
  }
  get state() {
    return this.reactiveState ? this.reactiveState.value : this.view.state;
  }
  get storage() {
    return this.reactiveExtensionStorage ? this.reactiveExtensionStorage.value : super.storage;
  }
  registerPlugin(e49, t2) {
    let n2 = super.registerPlugin(e49, t2);
    return this.reactiveState && (this.reactiveState.value = n2), n2;
  }
  unregisterPlugin(e49) {
    let t2 = super.unregisterPlugin(e49);
    return this.reactiveState && t2 && (this.reactiveState.value = t2), t2;
  }
};
var Hd = e({ name: "EditorContent", props: { editor: { default: null, type: Object } }, setup(e49) {
  let t2 = i(), a2 = d();
  return s(() => {
    let r2 = e49.editor;
    r2 && r2.options.element && t2.value && n(() => {
      if (!t2.value || !r2.view.dom?.parentNode) return;
      let e50 = l(t2.value);
      t2.value.append(...r2.view.dom.parentNode.childNodes), r2.contentComponent = a2.ctx._, a2 && (r2.appContext = { ...a2.appContext, provides: a2.provides }), r2.setOptions({ element: e50 }), r2.createNodeViews();
    });
  }), r(() => {
    let t3 = e49.editor;
    t3 && (t3.contentComponent = null, t3.appContext = null);
  }), { rootEl: t2 };
}, render() {
  return t("div", { ref: (e49) => {
    this.rootEl = e49;
  } });
} });
(e({ name: "NodeViewContent", props: { as: { type: String, default: "div" } }, inject: { nodeViewContentRef: { default: void 0 } }, mounted() {
  let e49 = this.nodeViewContentRef;
  e49 && this.$el && e49(this.$el);
}, beforeUnmount() {
  let e49 = this.nodeViewContentRef;
  e49 && e49(null);
}, render() {
  return t(this.as, { style: { whiteSpace: "pre-wrap" }, "data-node-view-content": "" });
} }));
(e({ name: "NodeViewWrapper", props: { as: { type: String, default: "div" } }, inject: ["onDragStart", "decorationClasses"], render() {
  var e49;
  return t(this.as, { class: this.decorationClasses, style: { whiteSpace: "normal" }, "data-node-view-wrapper": "", onDragstart: this.onDragStart }, (e49 = this.$slots).default?.call(e49));
} }));
var Ud = (e49 = {}) => {
  let t2 = a();
  return o(() => {
    t2.value = new Vd(e49);
  }), r(() => {
    var e50;
    (e50 = t2.value) == null || e50.destroy();
  }), t2;
};
e({ name: "MarkViewContent", props: { as: { type: String, default: "span" } }, render() {
  return t(this.as, { style: { whiteSpace: "inherit" }, "data-mark-view-content": "" });
} });
var Wd = Math.min;
var Gd = Math.max;
var Kd = Math.round;
var qd = Math.floor;
var Jd = (e49) => ({ x: e49, y: e49 });
var Yd = { left: "right", right: "left", bottom: "top", top: "bottom" };
function Xd(e49, t2) {
  return typeof e49 == "function" ? e49(t2) : e49;
}
function Zd(e49) {
  return e49.split("-")[0];
}
function Qd(e49) {
  return e49.split("-")[1];
}
function $d(e49) {
  return e49 === "x" ? "y" : "x";
}
function ef(e49) {
  return e49 === "y" ? "height" : "width";
}
function tf(e49) {
  let t2 = e49[0];
  return t2 === "t" || t2 === "b" ? "y" : "x";
}
function nf(e49) {
  return $d(tf(e49));
}
function rf(e49, t2, n2) {
  n2 === void 0 && (n2 = !1);
  let r2 = Qd(e49), i2 = nf(e49), a2 = ef(i2), o2 = i2 === "x" ? r2 === (n2 ? "end" : "start") ? "right" : "left" : r2 === "start" ? "bottom" : "top";
  return t2.reference[a2] > t2.floating[a2] && (o2 = pf(o2)), [o2, pf(o2)];
}
function af(e49) {
  let t2 = pf(e49);
  return [of(e49), t2, of(t2)];
}
function of(e49) {
  return e49.includes("start") ? e49.replace("start", "end") : e49.replace("end", "start");
}
var sf = ["left", "right"];
var cf = ["right", "left"];
var lf = ["top", "bottom"];
var uf = ["bottom", "top"];
function df(e49, t2, n2) {
  switch (e49) {
    case "top":
    case "bottom":
      return n2 ? t2 ? cf : sf : t2 ? sf : cf;
    case "left":
    case "right":
      return t2 ? lf : uf;
    default:
      return [];
  }
}
function ff(e49, t2, n2, r2) {
  let i2 = Qd(e49), a2 = df(Zd(e49), n2 === "start", r2);
  return i2 && (a2 = a2.map((e50) => e50 + "-" + i2), t2 && (a2 = a2.concat(a2.map(of)))), a2;
}
function pf(e49) {
  let t2 = Zd(e49);
  return Yd[t2] + e49.slice(t2.length);
}
function mf(e49) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e49 };
}
function hf(e49) {
  return typeof e49 == "number" ? { top: e49, right: e49, bottom: e49, left: e49 } : mf(e49);
}
function gf(e49) {
  let { x: t2, y: n2, width: r2, height: i2 } = e49;
  return { width: r2, height: i2, top: n2, left: t2, right: t2 + r2, bottom: n2 + i2, x: t2, y: n2 };
}
function _f(e49, t2, n2) {
  let { reference: r2, floating: i2 } = e49, a2 = tf(t2), o2 = nf(t2), s2 = ef(o2), c2 = Zd(t2), l2 = a2 === "y", u2 = r2.x + r2.width / 2 - i2.width / 2, d2 = r2.y + r2.height / 2 - i2.height / 2, f2 = r2[s2] / 2 - i2[s2] / 2, p2;
  switch (c2) {
    case "top":
      p2 = { x: u2, y: r2.y - i2.height };
      break;
    case "bottom":
      p2 = { x: u2, y: r2.y + r2.height };
      break;
    case "right":
      p2 = { x: r2.x + r2.width, y: d2 };
      break;
    case "left":
      p2 = { x: r2.x - i2.width, y: d2 };
      break;
    default:
      p2 = { x: r2.x, y: r2.y };
  }
  switch (Qd(t2)) {
    case "start":
      p2[o2] -= f2 * (n2 && l2 ? -1 : 1);
      break;
    case "end":
      p2[o2] += f2 * (n2 && l2 ? -1 : 1);
  }
  return p2;
}
async function vf(e49, t2) {
  t2 === void 0 && (t2 = {});
  let { x: n2, y: r2, platform: i2, rects: a2, elements: o2, strategy: s2 } = e49, { boundary: c2 = "clippingAncestors", rootBoundary: l2 = "viewport", elementContext: u2 = "floating", altBoundary: d2 = !1, padding: f2 = 0 } = Xd(t2, e49), p2 = hf(f2), m2 = o2[d2 ? u2 === "floating" ? "reference" : "floating" : u2], h2 = gf(await i2.getClippingRect({ element: await (i2.isElement == null ? void 0 : i2.isElement(m2)) ?? !0 ? m2 : m2.contextElement || await (i2.getDocumentElement == null ? void 0 : i2.getDocumentElement(o2.floating)), boundary: c2, rootBoundary: l2, strategy: s2 })), g2 = u2 === "floating" ? { x: n2, y: r2, width: a2.floating.width, height: a2.floating.height } : a2.reference, _2 = await (i2.getOffsetParent == null ? void 0 : i2.getOffsetParent(o2.floating)), v2 = await (i2.isElement == null ? void 0 : i2.isElement(_2)) && await (i2.getScale == null ? void 0 : i2.getScale(_2)) || { x: 1, y: 1 }, y2 = gf(i2.convertOffsetParentRelativeRectToViewportRelativeRect ? await i2.convertOffsetParentRelativeRectToViewportRelativeRect({ elements: o2, rect: g2, offsetParent: _2, strategy: s2 }) : g2);
  return { top: (h2.top - y2.top + p2.top) / v2.y, bottom: (y2.bottom - h2.bottom + p2.bottom) / v2.y, left: (h2.left - y2.left + p2.left) / v2.x, right: (y2.right - h2.right + p2.right) / v2.x };
}
var yf = 50;
var bf = async (e49, t2, n2) => {
  let { placement: r2 = "bottom", strategy: i2 = "absolute", middleware: a2 = [], platform: o2 } = n2, s2 = o2.detectOverflow ? o2 : { ...o2, detectOverflow: vf }, c2 = await (o2.isRTL == null ? void 0 : o2.isRTL(t2)), l2 = await o2.getElementRects({ reference: e49, floating: t2, strategy: i2 }), { x: u2, y: d2 } = _f(l2, r2, c2), f2 = r2, p2 = 0, m2 = {};
  for (let n3 = 0; n3 < a2.length; n3++) {
    let h2 = a2[n3];
    if (!h2) continue;
    let { name: g2, fn: _2 } = h2, { x: v2, y: y2, data: b2, reset: x2 } = await _2({ x: u2, y: d2, initialPlacement: r2, placement: f2, strategy: i2, middlewareData: m2, rects: l2, platform: s2, elements: { reference: e49, floating: t2 } });
    u2 = v2 ?? u2, d2 = y2 ?? d2, m2[g2] = { ...m2[g2], ...b2 }, x2 && p2 < yf && (p2++, typeof x2 == "object" && (x2.placement && (f2 = x2.placement), x2.rects && (l2 = x2.rects === !0 ? await o2.getElementRects({ reference: e49, floating: t2, strategy: i2 }) : x2.rects), { x: u2, y: d2 } = _f(l2, f2, c2)), n3 = -1);
  }
  return { x: u2, y: d2, placement: f2, strategy: i2, middlewareData: m2 };
};
var xf = function(e49) {
  return e49 === void 0 && (e49 = {}), { name: "flip", options: e49, async fn(t2) {
    var n2;
    let { placement: r2, middlewareData: i2, rects: a2, initialPlacement: o2, platform: s2, elements: c2 } = t2, { mainAxis: l2 = !0, crossAxis: u2 = !0, fallbackPlacements: d2, fallbackStrategy: f2 = "bestFit", fallbackAxisSideDirection: p2 = "none", flipAlignment: m2 = !0, ...h2 } = Xd(e49, t2);
    if ((n2 = i2.arrow) != null && n2.alignmentOffset) return {};
    let g2 = Zd(r2), _2 = tf(o2), v2 = Zd(o2) === o2, y2 = await (s2.isRTL == null ? void 0 : s2.isRTL(c2.floating)), b2 = d2 || (v2 || !m2 ? [pf(o2)] : af(o2)), x2 = p2 !== "none";
    !d2 && x2 && b2.push(...ff(o2, m2, p2, y2));
    let S2 = [o2, ...b2], C2 = await s2.detectOverflow(t2, h2), w2 = [], T2 = i2.flip?.overflows || [];
    if (l2 && w2.push(C2[g2]), u2) {
      let e50 = rf(r2, a2, y2);
      w2.push(C2[e50[0]], C2[e50[1]]);
    }
    if (T2 = [...T2, { placement: r2, overflows: w2 }], !w2.every((e50) => e50 <= 0)) {
      let e50 = (i2.flip?.index || 0) + 1, t3 = S2[e50];
      if (t3 && (u2 !== "alignment" || _2 === tf(t3) || T2.every((e51) => tf(e51.placement) !== _2 || e51.overflows[0] > 0))) return { data: { index: e50, overflows: T2 }, reset: { placement: t3 } };
      let n3 = T2.filter((e51) => e51.overflows[0] <= 0).sort((e51, t4) => e51.overflows[1] - t4.overflows[1])[0]?.placement;
      if (!n3) switch (f2) {
        case "bestFit": {
          let e51 = T2.filter((e52) => {
            if (x2) {
              let t4 = tf(e52.placement);
              return t4 === _2 || t4 === "y";
            }
            return !0;
          }).map((e52) => [e52.placement, e52.overflows.filter((e53) => e53 > 0).reduce((e53, t4) => e53 + t4, 0)]).sort((e52, t4) => e52[1] - t4[1])[0]?.[0];
          e51 && (n3 = e51);
          break;
        }
        case "initialPlacement":
          n3 = o2;
      }
      if (r2 !== n3) return { reset: { placement: n3 } };
    }
    return {};
  } };
};
var Sf = /* @__PURE__ */ new Set(["left", "top"]);
async function Cf(e49, t2) {
  let { placement: n2, platform: r2, elements: i2 } = e49, a2 = await (r2.isRTL == null ? void 0 : r2.isRTL(i2.floating)), o2 = Zd(n2), s2 = Qd(n2), c2 = tf(n2) === "y", l2 = Sf.has(o2) ? -1 : 1, u2 = a2 && c2 ? -1 : 1, d2 = Xd(t2, e49), { mainAxis: f2, crossAxis: p2, alignmentAxis: m2 } = typeof d2 == "number" ? { mainAxis: d2, crossAxis: 0, alignmentAxis: null } : { mainAxis: d2.mainAxis || 0, crossAxis: d2.crossAxis || 0, alignmentAxis: d2.alignmentAxis };
  return s2 && typeof m2 == "number" && (p2 = s2 === "end" ? m2 * -1 : m2), c2 ? { x: p2 * u2, y: f2 * l2 } : { x: f2 * l2, y: p2 * u2 };
}
var wf = function(e49) {
  return e49 === void 0 && (e49 = 0), { name: "offset", options: e49, async fn(t2) {
    var n2;
    let { x: r2, y: i2, placement: a2, middlewareData: o2 } = t2, s2 = await Cf(t2, e49);
    return a2 === o2.offset?.placement && (n2 = o2.arrow) != null && n2.alignmentOffset ? {} : { x: r2 + s2.x, y: i2 + s2.y, data: { ...s2, placement: a2 } };
  } };
};
function Tf() {
  return typeof window < "u";
}
function Ef(e49) {
  return kf(e49) ? (e49.nodeName || "").toLowerCase() : "#document";
}
function Df(e49) {
  var t2;
  return (e49 == null || (t2 = e49.ownerDocument) == null ? void 0 : t2.defaultView) || window;
}
function Of(e49) {
  return ((kf(e49) ? e49.ownerDocument : e49.document) || window.document)?.documentElement;
}
function kf(e49) {
  return Tf() ? e49 instanceof Node || e49 instanceof Df(e49).Node : !1;
}
function Af(e49) {
  return Tf() ? e49 instanceof Element || e49 instanceof Df(e49).Element : !1;
}
function jf(e49) {
  return Tf() ? e49 instanceof HTMLElement || e49 instanceof Df(e49).HTMLElement : !1;
}
function Mf(e49) {
  return !Tf() || typeof ShadowRoot > "u" ? !1 : e49 instanceof ShadowRoot || e49 instanceof Df(e49).ShadowRoot;
}
function Nf(e49) {
  let { overflow: t2, overflowX: n2, overflowY: r2, display: i2 } = Wf(e49);
  return /auto|scroll|overlay|hidden|clip/.test(t2 + r2 + n2) && i2 !== "inline" && i2 !== "contents";
}
function Pf(e49) {
  return /^(table|td|th)$/.test(Ef(e49));
}
function Ff(e49) {
  try {
    if (e49.matches(":popover-open")) return !0;
  } catch {
  }
  try {
    return e49.matches(":modal");
  } catch {
    return !1;
  }
}
var If = /transform|translate|scale|rotate|perspective|filter/;
var Lf = /paint|layout|strict|content/;
var Rf = (e49) => !!e49 && e49 !== "none";
var zf;
function Bf(e49) {
  let t2 = Af(e49) ? Wf(e49) : e49;
  return Rf(t2.transform) || Rf(t2.translate) || Rf(t2.scale) || Rf(t2.rotate) || Rf(t2.perspective) || !Hf() && (Rf(t2.backdropFilter) || Rf(t2.filter)) || If.test(t2.willChange || "") || Lf.test(t2.contain || "");
}
function Vf(e49) {
  let t2 = Kf(e49);
  for (; jf(t2) && !Uf(t2); ) {
    if (Bf(t2)) return t2;
    if (Ff(t2)) return null;
    t2 = Kf(t2);
  }
  return null;
}
function Hf() {
  return zf ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), zf;
}
function Uf(e49) {
  return /^(html|body|#document)$/.test(Ef(e49));
}
function Wf(e49) {
  return Df(e49).getComputedStyle(e49);
}
function Gf(e49) {
  return Af(e49) ? { scrollLeft: e49.scrollLeft, scrollTop: e49.scrollTop } : { scrollLeft: e49.scrollX, scrollTop: e49.scrollY };
}
function Kf(e49) {
  if (Ef(e49) === "html") return e49;
  let t2 = e49.assignedSlot || e49.parentNode || Mf(e49) && e49.host || Of(e49);
  return Mf(t2) ? t2.host : t2;
}
function qf(e49) {
  let t2 = Kf(e49);
  return Uf(t2) ? e49.ownerDocument ? e49.ownerDocument.body : e49.body : jf(t2) && Nf(t2) ? t2 : qf(t2);
}
function Jf(e49, t2, n2) {
  t2 === void 0 && (t2 = []), n2 === void 0 && (n2 = !0);
  let r2 = qf(e49), i2 = r2 === e49.ownerDocument?.body, a2 = Df(r2);
  if (i2) {
    let e50 = Yf(a2);
    return t2.concat(a2, a2.visualViewport || [], Nf(r2) ? r2 : [], e50 && n2 ? Jf(e50) : []);
  }
  return t2.concat(r2, Jf(r2, [], n2));
}
function Yf(e49) {
  return e49.parent && Object.getPrototypeOf(e49.parent) ? e49.frameElement : null;
}
function Xf(e49) {
  let t2 = Wf(e49), n2 = parseFloat(t2.width) || 0, r2 = parseFloat(t2.height) || 0, i2 = jf(e49), a2 = i2 ? e49.offsetWidth : n2, o2 = i2 ? e49.offsetHeight : r2, s2 = Kd(n2) !== a2 || Kd(r2) !== o2;
  return s2 && (n2 = a2, r2 = o2), { width: n2, height: r2, $: s2 };
}
function Zf(e49) {
  return Af(e49) ? e49 : e49.contextElement;
}
function Qf(e49) {
  let t2 = Zf(e49);
  if (!jf(t2)) return Jd(1);
  let n2 = t2.getBoundingClientRect(), { width: r2, height: i2, $: a2 } = Xf(t2), o2 = (a2 ? Kd(n2.width) : n2.width) / r2, s2 = (a2 ? Kd(n2.height) : n2.height) / i2;
  return o2 && Number.isFinite(o2) || (o2 = 1), s2 && Number.isFinite(s2) || (s2 = 1), { x: o2, y: s2 };
}
var $f = Jd(0);
function ep(e49) {
  let t2 = Df(e49);
  return !Hf() || !t2.visualViewport ? $f : { x: t2.visualViewport.offsetLeft, y: t2.visualViewport.offsetTop };
}
function tp(e49, t2, n2) {
  return t2 === void 0 && (t2 = !1), !n2 || t2 && n2 !== Df(e49) ? !1 : t2;
}
function np(e49, t2, n2, r2) {
  t2 === void 0 && (t2 = !1), n2 === void 0 && (n2 = !1);
  let i2 = e49.getBoundingClientRect(), a2 = Zf(e49), o2 = Jd(1);
  t2 && (r2 ? Af(r2) && (o2 = Qf(r2)) : o2 = Qf(e49));
  let s2 = tp(a2, n2, r2) ? ep(a2) : Jd(0), c2 = (i2.left + s2.x) / o2.x, l2 = (i2.top + s2.y) / o2.y, u2 = i2.width / o2.x, d2 = i2.height / o2.y;
  if (a2) {
    let e50 = Df(a2), t3 = r2 && Af(r2) ? Df(r2) : r2, n3 = e50, i3 = Yf(n3);
    for (; i3 && r2 && t3 !== n3; ) {
      let e51 = Qf(i3), t4 = i3.getBoundingClientRect(), r3 = Wf(i3), a3 = t4.left + (i3.clientLeft + parseFloat(r3.paddingLeft)) * e51.x, o3 = t4.top + (i3.clientTop + parseFloat(r3.paddingTop)) * e51.y;
      c2 *= e51.x, l2 *= e51.y, u2 *= e51.x, d2 *= e51.y, c2 += a3, l2 += o3, n3 = Df(i3), i3 = Yf(n3);
    }
  }
  return gf({ width: u2, height: d2, x: c2, y: l2 });
}
function rp(e49, t2) {
  let n2 = Gf(e49).scrollLeft;
  return t2 ? t2.left + n2 : np(Of(e49)).left + n2;
}
function ip(e49, t2) {
  let n2 = e49.getBoundingClientRect();
  return { x: n2.left + t2.scrollLeft - rp(e49, n2), y: n2.top + t2.scrollTop };
}
function ap(e49) {
  let { elements: t2, rect: n2, offsetParent: r2, strategy: i2 } = e49, a2 = i2 === "fixed", o2 = Of(r2), s2 = t2 ? Ff(t2.floating) : !1;
  if (r2 === o2 || s2 && a2) return n2;
  let c2 = { scrollLeft: 0, scrollTop: 0 }, l2 = Jd(1), u2 = Jd(0), d2 = jf(r2);
  if ((d2 || !d2 && !a2) && ((Ef(r2) !== "body" || Nf(o2)) && (c2 = Gf(r2)), d2)) {
    let e50 = np(r2);
    l2 = Qf(r2), u2.x = e50.x + r2.clientLeft, u2.y = e50.y + r2.clientTop;
  }
  let f2 = o2 && !d2 && !a2 ? ip(o2, c2) : Jd(0);
  return { width: n2.width * l2.x, height: n2.height * l2.y, x: n2.x * l2.x - c2.scrollLeft * l2.x + u2.x + f2.x, y: n2.y * l2.y - c2.scrollTop * l2.y + u2.y + f2.y };
}
function op(e49) {
  return Array.from(e49.getClientRects());
}
function sp(e49) {
  let t2 = Of(e49), n2 = Gf(e49), r2 = e49.ownerDocument.body, i2 = Gd(t2.scrollWidth, t2.clientWidth, r2.scrollWidth, r2.clientWidth), a2 = Gd(t2.scrollHeight, t2.clientHeight, r2.scrollHeight, r2.clientHeight), o2 = -n2.scrollLeft + rp(e49), s2 = -n2.scrollTop;
  return Wf(r2).direction === "rtl" && (o2 += Gd(t2.clientWidth, r2.clientWidth) - i2), { width: i2, height: a2, x: o2, y: s2 };
}
var cp = 25;
function lp(e49, t2) {
  let n2 = Df(e49), r2 = Of(e49), i2 = n2.visualViewport, a2 = r2.clientWidth, o2 = r2.clientHeight, s2 = 0, c2 = 0;
  if (i2) {
    a2 = i2.width, o2 = i2.height;
    let e50 = Hf();
    (!e50 || e50 && t2 === "fixed") && (s2 = i2.offsetLeft, c2 = i2.offsetTop);
  }
  let l2 = rp(r2);
  if (l2 <= 0) {
    let e50 = r2.ownerDocument, t3 = e50.body, n3 = getComputedStyle(t3), i3 = e50.compatMode === "CSS1Compat" && parseFloat(n3.marginLeft) + parseFloat(n3.marginRight) || 0, o3 = Math.abs(r2.clientWidth - t3.clientWidth - i3);
    o3 <= cp && (a2 -= o3);
  } else l2 <= cp && (a2 += l2);
  return { width: a2, height: o2, x: s2, y: c2 };
}
function up(e49, t2) {
  let n2 = np(e49, !0, t2 === "fixed"), r2 = n2.top + e49.clientTop, i2 = n2.left + e49.clientLeft, a2 = jf(e49) ? Qf(e49) : Jd(1);
  return { width: e49.clientWidth * a2.x, height: e49.clientHeight * a2.y, x: i2 * a2.x, y: r2 * a2.y };
}
function dp(e49, t2, n2) {
  let r2;
  if (t2 === "viewport") r2 = lp(e49, n2);
  else if (t2 === "document") r2 = sp(Of(e49));
  else if (Af(t2)) r2 = up(t2, n2);
  else {
    let n3 = ep(e49);
    r2 = { x: t2.x - n3.x, y: t2.y - n3.y, width: t2.width, height: t2.height };
  }
  return gf(r2);
}
function fp(e49, t2) {
  let n2 = Kf(e49);
  return n2 === t2 || !Af(n2) || Uf(n2) ? !1 : Wf(n2).position === "fixed" || fp(n2, t2);
}
function pp(e49, t2) {
  let n2 = t2.get(e49);
  if (n2) return n2;
  let r2 = Jf(e49, [], !1).filter((e50) => Af(e50) && Ef(e50) !== "body"), i2 = null, a2 = Wf(e49).position === "fixed", o2 = a2 ? Kf(e49) : e49;
  for (; Af(o2) && !Uf(o2); ) {
    let t3 = Wf(o2), n3 = Bf(o2);
    !n3 && t3.position === "fixed" && (i2 = null), (a2 ? !n3 && !i2 : !n3 && t3.position === "static" && i2 && (i2.position === "absolute" || i2.position === "fixed") || Nf(o2) && !n3 && fp(e49, o2)) ? r2 = r2.filter((e50) => e50 !== o2) : i2 = t3, o2 = Kf(o2);
  }
  return t2.set(e49, r2), r2;
}
function mp(e49) {
  let { element: t2, boundary: n2, rootBoundary: r2, strategy: i2 } = e49, a2 = [...n2 === "clippingAncestors" ? Ff(t2) ? [] : pp(t2, this._c) : [].concat(n2), r2], o2 = dp(t2, a2[0], i2), s2 = o2.top, c2 = o2.right, l2 = o2.bottom, u2 = o2.left;
  for (let e50 = 1; e50 < a2.length; e50++) {
    let n3 = dp(t2, a2[e50], i2);
    s2 = Gd(n3.top, s2), c2 = Wd(n3.right, c2), l2 = Wd(n3.bottom, l2), u2 = Gd(n3.left, u2);
  }
  return { width: c2 - u2, height: l2 - s2, x: u2, y: s2 };
}
function hp(e49) {
  let { width: t2, height: n2 } = Xf(e49);
  return { width: t2, height: n2 };
}
function gp(e49, t2, n2) {
  let r2 = jf(t2), i2 = Of(t2), a2 = n2 === "fixed", o2 = np(e49, !0, a2, t2), s2 = { scrollLeft: 0, scrollTop: 0 }, c2 = Jd(0);
  function l2() {
    c2.x = rp(i2);
  }
  if (r2 || !r2 && !a2)
    if ((Ef(t2) !== "body" || Nf(i2)) && (s2 = Gf(t2)), r2) {
      let e50 = np(t2, !0, a2, t2);
      c2.x = e50.x + t2.clientLeft, c2.y = e50.y + t2.clientTop;
    } else i2 && l2();
  a2 && !r2 && i2 && l2();
  let u2 = i2 && !r2 && !a2 ? ip(i2, s2) : Jd(0);
  return { x: o2.left + s2.scrollLeft - c2.x - u2.x, y: o2.top + s2.scrollTop - c2.y - u2.y, width: o2.width, height: o2.height };
}
function _p(e49) {
  return Wf(e49).position === "static";
}
function vp(e49, t2) {
  if (!jf(e49) || Wf(e49).position === "fixed") return null;
  if (t2) return t2(e49);
  let n2 = e49.offsetParent;
  return Of(e49) === n2 && (n2 = n2.ownerDocument.body), n2;
}
function yp(e49, t2) {
  let n2 = Df(e49);
  if (Ff(e49)) return n2;
  if (!jf(e49)) {
    let t3 = Kf(e49);
    for (; t3 && !Uf(t3); ) {
      if (Af(t3) && !_p(t3)) return t3;
      t3 = Kf(t3);
    }
    return n2;
  }
  let r2 = vp(e49, t2);
  for (; r2 && Pf(r2) && _p(r2); ) r2 = vp(r2, t2);
  return r2 && Uf(r2) && _p(r2) && !Bf(r2) ? n2 : r2 || Vf(e49) || n2;
}
var bp = async function(e49) {
  let t2 = this.getOffsetParent || yp, n2 = this.getDimensions, r2 = await n2(e49.floating);
  return { reference: gp(e49.reference, await t2(e49.floating), e49.strategy), floating: { x: 0, y: 0, width: r2.width, height: r2.height } };
};
function xp(e49) {
  return Wf(e49).direction === "rtl";
}
var Sp = { convertOffsetParentRelativeRectToViewportRelativeRect: ap, getDocumentElement: Of, getClippingRect: mp, getOffsetParent: yp, getElementRects: bp, getClientRects: op, getDimensions: hp, getScale: Qf, isElement: Af, isRTL: xp };
function Cp(e49, t2) {
  return e49.x === t2.x && e49.y === t2.y && e49.width === t2.width && e49.height === t2.height;
}
function wp(e49, t2) {
  let n2 = null, r2, i2 = Of(e49);
  function a2() {
    var e50;
    clearTimeout(r2), (e50 = n2) == null || e50.disconnect(), n2 = null;
  }
  function o2(s2, c2) {
    s2 === void 0 && (s2 = !1), c2 === void 0 && (c2 = 1), a2();
    let l2 = e49.getBoundingClientRect(), { left: u2, top: d2, width: f2, height: p2 } = l2;
    if (s2 || t2(), !f2 || !p2) return;
    let m2 = qd(d2), h2 = qd(i2.clientWidth - (u2 + f2)), g2 = qd(i2.clientHeight - (d2 + p2)), _2 = qd(u2), v2 = { rootMargin: -m2 + "px " + -h2 + "px " + -g2 + "px " + -_2 + "px", threshold: Gd(0, Wd(1, c2)) || 1 }, y2 = !0;
    function b2(t3) {
      let n3 = t3[0].intersectionRatio;
      if (n3 !== c2) {
        if (!y2) return o2();
        n3 ? o2(!1, n3) : r2 = setTimeout(() => {
          o2(!1, 1e-7);
        }, 1e3);
      }
      n3 === 1 && !Cp(l2, e49.getBoundingClientRect()) && o2(), y2 = !1;
    }
    try {
      n2 = new IntersectionObserver(b2, { ...v2, root: i2.ownerDocument });
    } catch {
      n2 = new IntersectionObserver(b2, v2);
    }
    n2.observe(e49);
  }
  return o2(!0), a2;
}
function Tp(e49, t2, n2, r2) {
  r2 === void 0 && (r2 = {});
  let { ancestorScroll: i2 = !0, ancestorResize: a2 = !0, elementResize: o2 = typeof ResizeObserver == "function", layoutShift: s2 = typeof IntersectionObserver == "function", animationFrame: c2 = !1 } = r2, l2 = Zf(e49), u2 = i2 || a2 ? [...l2 ? Jf(l2) : [], ...t2 ? Jf(t2) : []] : [];
  u2.forEach((e50) => {
    i2 && e50.addEventListener("scroll", n2, { passive: !0 }), a2 && e50.addEventListener("resize", n2);
  });
  let d2 = l2 && s2 ? wp(l2, n2) : null, f2 = -1, p2 = null;
  o2 && (p2 = new ResizeObserver((e50) => {
    let [r3] = e50;
    r3 && r3.target === l2 && p2 && t2 && (p2.unobserve(t2), cancelAnimationFrame(f2), f2 = requestAnimationFrame(() => {
      var e51;
      (e51 = p2) == null || e51.observe(t2);
    })), n2();
  }), l2 && !c2 && p2.observe(l2), t2 && p2.observe(t2));
  let m2, h2 = c2 ? np(e49) : null;
  c2 && g2();
  function g2() {
    let t3 = np(e49);
    h2 && !Cp(h2, t3) && n2(), h2 = t3, m2 = requestAnimationFrame(g2);
  }
  return n2(), () => {
    var e50;
    u2.forEach((e51) => {
      i2 && e51.removeEventListener("scroll", n2), a2 && e51.removeEventListener("resize", n2);
    }), d2?.(), (e50 = p2) == null || e50.disconnect(), p2 = null, c2 && cancelAnimationFrame(m2);
  };
}
var Ep = wf;
var Dp = xf;
var Op = (e49, t2, n2) => {
  let r2 = /* @__PURE__ */ new Map(), i2 = { platform: Sp, ...n2 }, a2 = { ...i2.platform, _c: r2 };
  return bf(e49, t2, { ...i2, platform: a2 });
};
function kp(e49) {
  let { char: t2, allowSpaces: n2, allowToIncludeChar: r2, allowedPrefixes: i2, startOfLine: a2, $position: o2 } = e49, s2 = n2 && !r2, c2 = qu(t2), l2 = RegExp(`\\s${c2}$`), u2 = a2 ? "^" : "", d2 = r2 ? "" : c2, f2 = RegExp(s2 ? `${u2}${c2}.*?(?=\\s${d2}|$)` : `${u2}(?:^)?${c2}[^\\s${d2}]*`, "gm"), p2 = o2.nodeBefore?.isText && o2.nodeBefore.text;
  if (!p2) return null;
  let m2 = o2.pos - p2.length, h2 = Array.from(p2.matchAll(f2)).pop();
  if (!h2 || h2.input === void 0 || h2.index === void 0) return null;
  let g2 = h2.input.slice(Math.max(0, h2.index - 1), h2.index), _2 = RegExp(`^[${i2?.join("")}\0]?$`).test(g2);
  if (i2 !== null && !_2) return null;
  let v2 = m2 + h2.index, y2 = v2 + h2[0].length;
  return s2 && l2.test(p2.slice(y2 - 1, y2 + 1)) && (h2[0] += " ", y2 += 1), v2 < o2.pos && y2 >= o2.pos ? { range: { from: v2, to: y2 }, query: h2[0].slice(t2.length), text: h2[0] } : null;
}
function Ap(e49) {
  return e49.docChanged ? e49.steps.some((e50) => {
    let t2 = e50.slice;
    if (!t2?.content) return !1;
    let n2 = t2.content.textBetween(0, t2.content.size, `
`);
    return /\s/.test(n2);
  }) : !1;
}
function jp(e49) {
  return () => {
    let t2 = e49.state.selection.$anchor.pos, { top: n2, right: r2, bottom: i2, left: a2 } = e49.view.coordsAtPos(t2);
    try {
      return new DOMRect(a2, n2, r2 - a2, i2 - n2);
    } catch {
      return null;
    }
  };
}
function Mp(e49, t2, n2, r2) {
  return n2 ? () => {
    let n3 = r2.getState(e49.state)?.decorationId;
    return t2.dom.querySelector(`[data-decoration-id="${n3}"]`)?.getBoundingClientRect() || null;
  } : jp(e49);
}
function Np({ match: e49, dismissedRange: t2, state: n2, transaction: r2, editor: i2, shouldResetDismissed: a2, effectiveAllowSpaces: o2 }) {
  return a2?.({ editor: i2, state: n2, range: t2, match: e49, transaction: r2, allowSpaces: o2 }) ? !1 : o2 ? e49.range.from === t2.from : e49.range.from === t2.from && !Ap(r2);
}
function Pp({ view: e49, pluginKeyRef: t2 }) {
  let n2 = e49.state.tr.setMeta(t2, { exit: !0 });
  e49.dispatch(n2);
}
function Fp({ pluginKey: e49, decorationTag: t2, decorationClass: n2, decorationContent: r2, decorationEmptyClass: i2, renderer: a2, dispatchExit: o2 }) {
  return { handleKeyDown(t3, n3) {
    var r3;
    let i3 = e49.getState(t3.state);
    return i3.active ? n3.key === "Escape" || n3.key === "Esc" ? ((r3 = a2?.onKeyDown) == null || r3.call(a2, { view: t3, event: n3, range: i3.range }), o2(t3), !0) : a2?.onKeyDown?.call(a2, { view: t3, event: n3, range: i3.range }) || !1 : !1;
  }, decorations(a3) {
    let { active: o3, range: s2, decorationId: c2, query: l2 } = e49.getState(a3);
    if (!o3) return null;
    let u2 = !l2?.length, d2 = [n2];
    return u2 && d2.push(i2), B.create(a3.doc, [fs.inline(s2.from, s2.to, { nodeName: t2, class: d2.join(" "), "data-decoration-id": c2 || void 0, "data-decoration-content": r2 })]);
  } };
}
function Ip({ editor: e49, char: t2, effectiveAllowSpaces: n2, allowToIncludeChar: r2, allowedPrefixes: i2, startOfLine: a2, findSuggestionMatch: o2, allow: s2, shouldShow: c2, shouldKeepDismissed: l2, pluginKey: u2 }) {
  return { init() {
    return { active: !1, range: { from: 0, to: 0 }, query: null, text: null, composing: !1, dismissedRange: null };
  }, apply(d2, f2, p2, m2) {
    let { isEditable: h2 } = e49, { composing: g2 } = e49.view, { selection: _2 } = d2, { empty: v2, from: y2 } = _2, b2 = { ...f2 }, x2 = d2.getMeta(u2);
    if (x2 && x2.exit) return b2.active = !1, b2.decorationId = null, b2.range = { from: 0, to: 0 }, b2.query = null, b2.text = null, b2.dismissedRange = f2.active ? { ...f2.range } : f2.dismissedRange, b2;
    if (b2.composing = g2, d2.docChanged && b2.dismissedRange !== null && (b2.dismissedRange = { from: d2.mapping.map(b2.dismissedRange.from), to: d2.mapping.map(b2.dismissedRange.to) }), h2 && (v2 || e49.view.composing)) {
      (y2 < f2.range.from || y2 > f2.range.to) && !g2 && !f2.composing && (b2.active = !1);
      let u3 = o2({ char: t2, allowSpaces: n2, allowToIncludeChar: r2, allowedPrefixes: i2, startOfLine: a2, $position: _2.$from }), p3 = `id_${Math.floor(Math.random() * 4294967295)}`;
      u3 && s2({ editor: e49, state: m2, range: u3.range, isActive: f2.active }) && (!c2 || c2({ editor: e49, range: u3.range, query: u3.query, text: u3.text, transaction: d2 })) ? (b2.dismissedRange !== null && !l2({ match: u3, dismissedRange: b2.dismissedRange, state: m2, transaction: d2 }) && (b2.dismissedRange = null), b2.dismissedRange === null ? (b2.active = !0, b2.decorationId = f2.decorationId || p3, b2.range = u3.range, b2.query = u3.query, b2.text = u3.text) : b2.active = !1) : (u3 || (b2.dismissedRange = null), b2.active = !1);
    } else b2.active = !1;
    return b2.active || (b2.decorationId = null, b2.range = { from: 0, to: 0 }, b2.query = null, b2.text = null), b2;
  } };
}
function Lp({ editor: e49, items: t2 }) {
  let n2 = null, r2 = null, i2 = null, a2 = () => {
    r2 !== null && (clearTimeout(r2), r2 = null), i2?.(), i2 = null;
  }, o2 = (e50) => new Promise((t3) => {
    i2 = t3, r2 = setTimeout(() => {
      r2 = null;
      let e51 = i2;
      i2 = null, e51?.();
    }, e50);
  }), s2 = () => {
    n2?.abort(), a2(), n2 = null;
  };
  return { abort: s2, fetch: async (r3, i3) => {
    s2(), n2 = new AbortController();
    let a3 = n2;
    if (i3 > 0 && await o2(i3), n2 !== a3 || a3.signal.aborted) return { status: "aborted" };
    try {
      let i4 = await t2({ editor: e49, query: r3, signal: a3.signal });
      return n2 !== a3 || a3.signal.aborted ? { status: "aborted" } : { status: "resolved", items: i4 };
    } catch {
      return n2 !== a3 || a3.signal.aborted ? { status: "aborted" } : { status: "error" };
    }
  } };
}
function Rp({ placement: e49, offset: t2, flip: n2, floatingUi: r2 }) {
  let i2 = [Ep({ mainAxis: t2.mainAxis ?? 4, crossAxis: t2.crossAxis ?? 0 })];
  return n2 && i2.push(Dp()), r2?.middleware?.length && i2.push(...r2.middleware), { placement: e49, strategy: r2?.strategy ?? "absolute", middleware: i2 };
}
function zp(e49) {
  if (e49 instanceof HTMLElement) return e49;
  if (typeof e49 == "string") try {
    let t2 = document.querySelector(e49);
    if (t2) return t2;
  } catch {
    return document.body;
  }
  return document.body;
}
function Bp({ getReferenceRect: e49, contextElement: t2, config: n2, container: r2, dismissOnOutsideClick: i2, dismiss: a2 }) {
  return (o2, s2 = {}) => {
    let c2 = { getBoundingClientRect: () => e49() ?? new DOMRect(), contextElement: t2 }, l2 = !1, u2 = !o2.isConnected;
    u2 && zp(r2).appendChild(o2), s2.onPosition || (o2.style.visibility = "hidden", o2.style.width = "max-content");
    let d2 = Tp(c2, o2, () => {
      Op(c2, o2, { placement: n2.placement, strategy: n2.strategy, middleware: n2.middleware }).then(({ x: e50, y: t3, placement: n3, strategy: r3 }) => {
        s2.onPosition ? s2.onPosition({ x: e50, y: t3, placement: n3, strategy: r3 }) : (Object.assign(o2.style, { position: r3, left: `${e50}px`, top: `${t3}px` }), l2 || (l2 = !0, o2.style.visibility = ""));
      });
    }, s2.autoUpdate), f2;
    return i2 && (f2 = (e50) => {
      let n3 = e50.target;
      !(n3 instanceof Node) || o2.contains(n3) || t2.contains(n3) || a2();
    }, document.addEventListener("pointerdown", f2, !0)), () => {
      d2(), f2 && document.removeEventListener("pointerdown", f2, !0), u2 && o2.remove();
    };
  };
}
function Vp({ editor: e49, pluginKey: t2, items: n2, renderer: r2, minQueryLength: i2, debounce: a2, initialItems: o2, placement: s2, offset: c2, container: l2, flip: u2, floatingUi: d2, dismissOnOutsideClick: f2, command: p2, clientRectFor: m2, dispatchExit: h2 }) {
  let g2, _2 = Lp({ editor: e49, items: n2 }), v2 = Rp({ placement: s2, offset: c2, flip: u2, floatingUi: d2 });
  function y2(e50, t3) {
    var n3, i3, a3;
    switch (e50) {
      case "started":
        (n3 = r2?.onStart) == null || n3.call(r2, t3);
        break;
      case "updated":
        (i3 = r2?.onUpdate) == null || i3.call(r2, t3);
        break;
      case "stopped":
        (a3 = r2?.onExit) == null || a3.call(r2, t3);
    }
  }
  return { update: async (n3, d3) => {
    var b2, x2;
    let S2 = t2.getState(d3), C2 = t2.getState(n3.state);
    if (!S2 || !C2) return;
    let w2 = null, T2 = S2.query !== C2.query, ee2 = S2.text !== C2.text, te2 = S2.range.from !== C2.range.from || S2.range.to !== C2.range.to, ne2 = T2 || ee2 || te2;
    if (!S2.active && C2.active) w2 = "started";
    else if (S2.active && !C2.active) w2 = "stopped";
    else if (C2.active && ne2) w2 = "updated";
    else return;
    let re2 = w2 === "stopped" ? S2 : C2, ie2 = n3.dom.querySelector(`[data-decoration-id="${re2.decorationId}"]`), ae2 = m2(n3, ie2), oe2 = i2 === 0 || (re2.query ? re2.query.length >= i2 : !1), se2 = (w2 === "started" || w2 === "updated") && oe2;
    if (g2 = { editor: e49, range: re2.range, query: re2.query || "", text: re2.text || "", items: o2 ?? [], command: (t3) => p2({ editor: e49, range: re2.range, props: t3 }), decorationNode: ie2, clientRect: ae2, loading: se2, placement: s2, offset: { mainAxis: c2.mainAxis ?? 4, crossAxis: c2.crossAxis ?? 0 }, container: l2, flip: u2, floatingUi: v2, mount: Bp({ getReferenceRect: ae2, contextElement: n3.dom, config: v2, container: l2, dismissOnOutsideClick: f2, dismiss: () => h2(e49.view) }) }, w2 === "started" && ((b2 = r2?.onBeforeStart) == null || b2.call(r2, g2)), w2 === "updated" && ((x2 = r2?.onBeforeUpdate) == null || x2.call(r2, g2)), w2 === "started" && y2(w2, g2), w2 === "started" || w2 === "updated")
      if (!se2) _2.abort(), g2 = { ...g2, items: o2 ?? [], loading: !1 };
      else {
        g2 = { ...g2, items: o2 ?? [], loading: !0 }, w2 = "updated", y2(w2, g2);
        let e50 = await _2.fetch(re2.query || "", a2);
        if (e50.status === "aborted") return;
        if (!t2.getState(n3.state)?.active) {
          _2.abort();
          return;
        }
        g2 = e50.status === "resolved" ? { ...g2, items: e50.items, loading: !1 } : { ...g2, loading: !1 };
      }
    w2 === "stopped" ? (_2.abort(), y2(w2, g2), g2 = void 0) : w2 === "updated" && y2(w2, g2);
  }, destroy: () => {
    var e50;
    _2.abort(), g2 && ((e50 = r2?.onExit) == null || e50.call(r2, g2));
  } };
}
var Hp = new N("suggestion");
function Up({ pluginKey: e49 = Hp, editor: t2, char: n2 = "@", allowSpaces: r2 = !1, allowToIncludeChar: i2 = !1, allowedPrefixes: a2 = [" "], startOfLine: o2 = !1, decorationTag: s2 = "span", decorationClass: c2 = "suggestion", decorationContent: l2 = "", decorationEmptyClass: u2 = "is-empty", command: d2 = () => null, items: f2 = () => [], minQueryLength: p2 = 0, debounce: m2 = 0, initialItems: h2, placement: g2 = "bottom-start", offset: _2 = {}, container: v2, flip: y2 = !0, floatingUi: b2, dismissOnOutsideClick: x2 = !0, render: S2 = () => ({}), allow: C2 = () => !0, findSuggestionMatch: w2 = kp, shouldShow: T2, shouldResetDismissed: ee2 }) {
  let te2 = S2?.(), ne2 = r2 && !i2, re2 = (n3, r3) => Mp(t2, n3, r3, e49);
  function ie2(e50) {
    return Np({ ...e50, editor: t2, shouldResetDismissed: ee2, effectiveAllowSpaces: ne2 });
  }
  let ae2 = (t3) => Pp({ view: t3, pluginKeyRef: e49 });
  return new M({ key: e49, view: () => Vp({ editor: t2, pluginKey: e49, items: f2, renderer: te2, minQueryLength: p2, debounce: m2, initialItems: h2, placement: g2, offset: _2, container: v2, flip: y2, floatingUi: b2, dismissOnOutsideClick: x2, command: d2, clientRectFor: re2, dispatchExit: ae2 }), state: Ip({ editor: t2, char: n2, effectiveAllowSpaces: ne2, allowToIncludeChar: i2, allowedPrefixes: a2, startOfLine: o2, findSuggestionMatch: w2, allow: C2, shouldShow: T2, shouldKeepDismissed: ie2, pluginKey: e49 }), props: Fp({ pluginKey: e49, decorationTag: s2, decorationClass: c2, decorationContent: l2, decorationEmptyClass: u2, renderer: te2, dispatchExit: ae2 }) });
}
function Wp({ editor: e49, overrideSuggestionOptions: t2, extensionName: n2, char: r2 = "@" }) {
  return { editor: e49, char: r2, pluginKey: new N(), command: ({ editor: e50, range: t3, props: i2 }) => {
    var a2;
    e50.view.state.selection.$to.nodeAfter?.text?.startsWith(" ") && (t3.to += 1), e50.chain().focus().insertContentAt(t3, [{ type: n2, attrs: { ...i2, mentionSuggestionChar: r2 } }, { type: "text", text: " " }]).run(), (a2 = e50.view.dom.ownerDocument.defaultView?.getSelection()) == null || a2.collapseToEnd();
  }, allow: ({ state: e50, range: t3 }) => {
    let r3 = e50.doc.resolve(t3.from), i2 = e50.schema.nodes[n2];
    return !!r3.parent.type.contentMatch.matchType(i2);
  }, ...t2 };
}
function Gp(e49) {
  return (e49.options.suggestions.length ? e49.options.suggestions : [e49.options.suggestion]).map((t2) => Wp({ editor: e49.editor, overrideSuggestionOptions: t2, extensionName: e49.name, char: t2.char }));
}
function Kp(e49, t2) {
  let n2 = Gp(e49);
  return n2.find((e50) => e50.char === t2) || (n2.length ? n2[0] : null);
}
var qp = q.create({ name: "mention", priority: 101, addOptions() {
  return { HTMLAttributes: {}, renderText({ node: e49, suggestion: t2 }) {
    return `${t2?.char ?? "@"}${e49.attrs.label ?? e49.attrs.id}`;
  }, deleteTriggerWithBackspace: !1, renderHTML({ options: e49, node: t2, suggestion: n2 }) {
    return ["span", G(this.HTMLAttributes, e49.HTMLAttributes), `${n2?.char ?? "@"}${t2.attrs.label ?? t2.attrs.id}`];
  }, suggestions: [], suggestion: {} };
}, group: "inline", inline: !0, selectable: !1, atom: !0, addAttributes() {
  return { id: { default: null, parseHTML: (e49) => e49.getAttribute("data-id"), renderHTML: (e49) => e49.id ? { "data-id": e49.id } : {} }, label: { default: null, parseHTML: (e49) => e49.getAttribute("data-label"), renderHTML: (e49) => e49.label ? { "data-label": e49.label } : {} }, mentionSuggestionChar: { default: "@", parseHTML: (e49) => e49.getAttribute("data-mention-suggestion-char"), renderHTML: (e49) => ({ "data-mention-suggestion-char": e49.mentionSuggestionChar }) } };
}, parseHTML() {
  return [{ tag: `span[data-type="${this.name}"]` }];
}, renderHTML({ node: e49, HTMLAttributes: t2 }) {
  let n2 = Kp(this, e49.attrs.mentionSuggestionChar);
  if (this.options.renderLabel !== void 0) return console.warn("renderLabel is deprecated use renderText and renderHTML instead"), ["span", G({ "data-type": this.name }, this.options.HTMLAttributes, t2), this.options.renderLabel({ options: this.options, node: e49, suggestion: n2 })];
  let r2 = { ...this.options };
  r2.HTMLAttributes = G({ "data-type": this.name }, this.options.HTMLAttributes, t2);
  let i2 = this.options.renderHTML({ options: r2, node: e49, suggestion: n2 });
  return typeof i2 == "string" ? ["span", G({ "data-type": this.name }, this.options.HTMLAttributes, t2), i2] : i2;
}, ...rd({ nodeName: "mention", name: "@", selfClosing: !0, allowedAttributes: ["id", "label", { name: "mentionSuggestionChar", skipIfDefault: "@" }], parseAttributes: (e49) => {
  let t2 = {}, n2 = /(\w+)=(?:"([^"]*)"|'([^']*)')/g, r2 = n2.exec(e49);
  for (; r2 !== null; ) {
    let [, i2, a2, o2] = r2;
    t2[i2 === "char" ? "mentionSuggestionChar" : i2] = a2 ?? o2, r2 = n2.exec(e49);
  }
  return t2;
}, serializeAttributes: (e49) => Object.entries(e49).filter(([, e50]) => e50 != null).map(([e50, t2]) => `${e50 === "mentionSuggestionChar" ? "char" : e50}="${t2}"`).join(" ") }), renderText({ node: e49 }) {
  let t2 = { options: this.options, node: e49, suggestion: Kp(this, e49.attrs.mentionSuggestionChar) };
  return this.options.renderLabel === void 0 ? this.options.renderText(t2) : (console.warn("renderLabel is deprecated use renderText and renderHTML instead"), this.options.renderLabel(t2));
}, addKeyboardShortcuts() {
  return { Backspace: () => this.editor.commands.command(({ tr: e49, state: t2 }) => {
    let n2 = !1, { selection: r2 } = t2, { empty: i2, anchor: a2 } = r2;
    if (!i2) return !1;
    let o2 = new ve(), s2 = 0;
    return t2.doc.nodesBetween(a2 - 1, a2, (e50, t3) => {
      if (e50.type.name === this.name) return n2 = !0, o2 = e50, s2 = t3, !1;
    }), n2 && e49.insertText(this.options.deleteTriggerWithBackspace ? "" : o2.attrs.mentionSuggestionChar, s2, s2 + o2.nodeSize), n2;
  }) };
}, addProseMirrorPlugins() {
  return Gp(this).map(Up);
} });
var Jp = (e49, t2) => {
  if (e49 === "slot") return 0;
  if (e49 instanceof Function) return e49(t2);
  let { children: n2, ...r2 } = t2 ?? {};
  if (e49 === "svg") throw Error("SVG elements are not supported in the JSX syntax, use the array syntax instead");
  return [e49, r2, n2];
};
var Yp = (e49, t2) => {
  let { state: n2, view: r2 } = e49, { selection: i2 } = n2;
  if (!i2.empty) return !1;
  let { $from: a2 } = i2;
  if (a2.parentOffset !== 0) return !1;
  let o2 = a2.depth - 1;
  if (o2 < 0) return !1;
  let s2 = a2.node(o2), c2 = a2.index(o2);
  if (c2 === 0) return !1;
  if (s2.type === t2) return e49.commands.lift(t2.name);
  let l2 = s2.child(c2 - 1);
  if (l2.type !== t2 || !l2.lastChild?.isTextblock) return !1;
  let u2 = a2.before(), d2 = u2 - 1 - 1, { tr: f2 } = n2;
  return f2.delete(u2, a2.after()).insert(d2, a2.parent.content), f2.setSelection(A.create(f2.doc, d2)), r2.dispatch(f2.scrollIntoView()), !0;
};
var Xp = /^\s*>\s$/;
var Zp = q.create({ name: "blockquote", addOptions() {
  return { HTMLAttributes: {} };
}, content: "block+", group: "block", defining: !0, parseHTML() {
  return [{ tag: "blockquote" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return Jp("blockquote", { ...G(this.options.HTMLAttributes, e49), children: Jp("slot", {}) });
}, parseMarkdown: (e49, t2) => {
  let n2 = t2.parseBlockChildren ?? t2.parseChildren;
  return t2.createNode("blockquote", void 0, n2(e49.tokens || []));
}, renderMarkdown: (e49, t2) => {
  if (!e49.content) return "";
  let n2 = [];
  return e49.content.forEach((e50, r2) => {
    let i2 = (t2.renderChild?.call(t2, e50, r2) ?? t2.renderChildren([e50])).split(`
`).map((e51) => e51.trim() === "" ? ">" : `> ${e51}`);
    n2.push(i2.join(`
`));
  }), n2.join(`
>
`);
}, addCommands() {
  return { setBlockquote: () => ({ commands: e49 }) => e49.wrapIn(this.name), toggleBlockquote: () => ({ commands: e49 }) => e49.toggleWrap(this.name), unsetBlockquote: () => ({ commands: e49 }) => e49.lift(this.name) };
}, addKeyboardShortcuts() {
  return { "Mod-Shift-b": () => this.editor.commands.toggleBlockquote(), Backspace: () => Yp(this.editor, this.type) };
}, addInputRules() {
  return [Rd({ find: Xp, type: this.type })];
} });
var Qp = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/;
var $p = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g;
var em = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/;
var tm = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g;
var nm = pd.create({ name: "bold", addOptions() {
  return { HTMLAttributes: {} };
}, parseHTML() {
  return [{ tag: "strong" }, { tag: "b", getAttrs: (e49) => e49.style.fontWeight !== "normal" && null }, { style: "font-weight=400", clearMark: (e49) => e49.type.name === this.name }, { style: "font-weight", getAttrs: (e49) => /^(bold(er)?|[5-9]\d{2,})$/.test(e49) && null }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return Jp("strong", { ...G(this.options.HTMLAttributes, e49), children: Jp("slot", {}) });
}, markdownTokenName: "strong", parseMarkdown: (e49, t2) => t2.applyMark("bold", t2.parseInline(e49.tokens || [])), markdownOptions: { htmlReopen: { open: "<strong>", close: "</strong>" } }, renderMarkdown: (e49, t2) => `**${t2.renderChildren(e49)}**`, addCommands() {
  return { setBold: () => ({ commands: e49 }) => e49.setMark(this.name), toggleBold: () => ({ commands: e49 }) => e49.toggleMark(this.name), unsetBold: () => ({ commands: e49 }) => e49.unsetMark(this.name) };
}, addKeyboardShortcuts() {
  return { "Mod-b": () => this.editor.commands.toggleBold(), "Mod-B": () => this.editor.commands.toggleBold() };
}, addInputRules() {
  return [Fd({ find: Qp, type: this.type }), Fd({ find: em, type: this.type })];
}, addPasteRules() {
  return [zd({ find: $p, type: this.type }), zd({ find: tm, type: this.type })];
} });
var rm = (e49) => {
  let t2 = /`([^`]+)`(?!`)$/.exec(e49);
  return !t2 || t2.index > 0 && e49[t2.index - 1] === "`" ? null : { index: t2.index, text: t2[0], replaceWith: t2[1] };
};
var im = (e49) => {
  let t2 = /`([^`]+)`(?!`)/g, n2 = [], r2;
  for (; (r2 = t2.exec(e49)) !== null; ) r2.index > 0 && e49[r2.index - 1] === "`" || n2.push({ index: r2.index, text: r2[0], replaceWith: r2[1] });
  return n2;
};
var am = pd.create({ name: "code", addOptions() {
  return { HTMLAttributes: {} };
}, excludes: "_", code: !0, exitable: !0, parseHTML() {
  return [{ tag: "code" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["code", G(this.options.HTMLAttributes, e49), 0];
}, markdownTokenName: "codespan", parseMarkdown: (e49, t2) => t2.applyMark("code", [{ type: "text", text: e49.text || "" }]), renderMarkdown: (e49, t2) => e49.content ? `\`${t2.renderChildren(e49.content)}\`` : "", addCommands() {
  return { setCode: () => ({ commands: e49 }) => e49.setMark(this.name), toggleCode: () => ({ commands: e49 }) => e49.toggleMark(this.name), unsetCode: () => ({ commands: e49 }) => e49.unsetMark(this.name) };
}, addKeyboardShortcuts() {
  return { "Mod-e": () => this.editor.commands.toggleCode() };
}, addInputRules() {
  return [Fd({ find: rm, type: this.type })];
}, addPasteRules() {
  return [zd({ find: im, type: this.type })];
} });
var om = 4;
var sm = /^```([a-z]+)?[\s\n]$/;
var cm = /^~~~([a-z]+)?[\s\n]$/;
var lm = q.create({ name: "codeBlock", addOptions() {
  return { languageClassPrefix: "language-", exitOnTripleEnter: !0, exitOnArrowDown: !0, defaultLanguage: null, enableTabIndentation: !1, tabSize: om, HTMLAttributes: {} };
}, content: "text*", marks: "", group: "block", code: !0, defining: !0, addAttributes() {
  return { language: { default: this.options.defaultLanguage, parseHTML: (e49) => {
    let { languageClassPrefix: t2 } = this.options;
    return t2 && [...e49.firstElementChild?.classList || []].filter((e50) => e50.startsWith(t2)).map((e50) => e50.replace(t2, ""))[0] || null;
  }, rendered: !1 } };
}, parseHTML() {
  return [{ tag: "pre", preserveWhitespace: "full" }];
}, renderHTML({ node: e49, HTMLAttributes: t2 }) {
  return ["pre", G(this.options.HTMLAttributes, t2), ["code", { class: e49.attrs.language ? this.options.languageClassPrefix + e49.attrs.language : null }, 0]];
}, markdownTokenName: "code", parseMarkdown: (e49, t2) => e49.raw?.startsWith("```") === !1 && e49.raw?.startsWith("~~~") === !1 && e49.codeBlockStyle !== "indented" ? [] : t2.createNode("codeBlock", { language: e49.lang || null }, e49.text ? [t2.createTextNode(e49.text)] : []), renderMarkdown: (e49, t2) => {
  let n2 = "", r2 = e49.attrs?.language || "";
  return n2 = e49.content ? [`\`\`\`${r2}`, t2.renderChildren(e49.content), "```"].join(`
`) : `\`\`\`${r2}

\`\`\``, n2;
}, addCommands() {
  return { setCodeBlock: (e49) => ({ commands: t2 }) => t2.setNode(this.name, e49), toggleCodeBlock: (e49) => ({ commands: t2 }) => t2.toggleNode(this.name, "paragraph", e49) };
}, addKeyboardShortcuts() {
  return { "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(), Backspace: () => {
    let { empty: e49, $anchor: t2 } = this.editor.state.selection, n2 = t2.pos === 1;
    return !e49 || t2.parent.type.name !== this.name ? !1 : n2 || !t2.parent.textContent.length ? this.editor.commands.clearNodes() : !1;
  }, Tab: ({ editor: e49 }) => {
    if (!this.options.enableTabIndentation) return !1;
    let t2 = this.options.tabSize ?? om, { state: n2 } = e49, { selection: r2 } = n2, { $from: i2, empty: a2 } = r2;
    if (i2.parent.type !== this.type) return !1;
    let o2 = " ".repeat(t2);
    return a2 ? e49.commands.insertContent(o2) : e49.commands.command(({ tr: e50 }) => {
      let { from: t3, to: i3 } = r2, a3 = n2.doc.textBetween(t3, i3, `
`, `
`).split(`
`).map((e51) => o2 + e51).join(`
`);
      return e50.replaceWith(t3, i3, n2.schema.text(a3)), !0;
    });
  }, "Shift-Tab": ({ editor: e49 }) => {
    if (!this.options.enableTabIndentation) return !1;
    let t2 = this.options.tabSize ?? om, { state: n2 } = e49, { selection: r2 } = n2, { $from: i2, empty: a2 } = r2;
    return i2.parent.type === this.type ? a2 ? e49.commands.command(({ tr: e50 }) => {
      let { pos: r3 } = i2, a3 = i2.start(), o2 = i2.end(), s2 = n2.doc.textBetween(a3, o2, `
`, `
`).split(`
`), c2 = 0, l2 = 0, u2 = r3 - a3;
      for (let e51 = 0; e51 < s2.length; e51 += 1) {
        if (l2 + s2[e51].length >= u2) {
          c2 = e51;
          break;
        }
        l2 += s2[e51].length + 1;
      }
      let d2 = s2[c2].match(/^ */)?.[0] || "", f2 = Math.min(d2.length, t2);
      if (f2 === 0) return !0;
      let p2 = a3;
      for (let e51 = 0; e51 < c2; e51 += 1) p2 += s2[e51].length + 1;
      return e50.delete(p2, p2 + f2), r3 - p2 <= f2 && e50.setSelection(A.create(e50.doc, p2)), !0;
    }) : e49.commands.command(({ tr: e50 }) => {
      let { from: i3, to: a3 } = r2, o2 = n2.doc.textBetween(i3, a3, `
`, `
`).split(`
`).map((e51) => {
        let n3 = e51.match(/^ */)?.[0] || "", r3 = Math.min(n3.length, t2);
        return e51.slice(r3);
      }).join(`
`);
      return e50.replaceWith(i3, a3, n2.schema.text(o2)), !0;
    }) : !1;
  }, Enter: ({ editor: e49 }) => {
    if (!this.options.exitOnTripleEnter) return !1;
    let { state: t2 } = e49, { selection: n2 } = t2, { $from: r2, empty: i2 } = n2;
    if (!i2 || r2.parent.type !== this.type) return !1;
    let a2 = r2.parentOffset === r2.parent.nodeSize - 2, o2 = r2.parent.textContent.endsWith(`

`);
    return !a2 || !o2 ? !1 : e49.chain().command(({ tr: e50 }) => (e50.delete(r2.pos - 2, r2.pos), !0)).exitCode().run();
  }, ArrowDown: ({ editor: e49 }) => {
    if (!this.options.exitOnArrowDown) return !1;
    let { state: t2 } = e49, { selection: n2, doc: r2 } = t2, { $from: i2, empty: a2 } = n2;
    if (!a2 || i2.parent.type !== this.type || i2.parentOffset !== i2.parent.nodeSize - 2) return !1;
    let o2 = i2.after();
    return o2 === void 0 ? !1 : r2.nodeAt(o2) ? e49.commands.command(({ tr: e50 }) => (e50.setSelection(k.near(r2.resolve(o2))), !0)) : e49.commands.exitCode();
  } };
}, addInputRules() {
  return [Ld({ find: sm, type: this.type, getAttributes: (e49) => ({ language: e49[1] }) }), Ld({ find: cm, type: this.type, getAttributes: (e49) => ({ language: e49[1] }) })];
}, addProseMirrorPlugins() {
  return [new M({ key: new N("codeBlockVSCodeHandler"), props: { handlePaste: (e49, t2) => {
    if (!t2.clipboardData || this.editor.isActive(this.type.name)) return !1;
    let n2 = t2.clipboardData.getData("text/plain"), r2 = t2.clipboardData.getData("vscode-editor-data"), i2 = (r2 ? JSON.parse(r2) : void 0)?.mode;
    if (!n2 || !i2) return !1;
    let { tr: a2, schema: o2 } = e49.state, s2 = o2.text(n2.replace(/\r\n?/g, `
`));
    return a2.replaceSelectionWith(this.type.create({ language: i2 }, s2)), a2.selection.$from.parent.type !== this.type && a2.setSelection(A.near(a2.doc.resolve(Math.max(0, a2.selection.from - 2)))), a2.setMeta("paste", !0), e49.dispatch(a2), !0;
  } } })];
} });
var um = q.create({ name: "doc", topNode: !0, content: "block+", renderMarkdown: (e49, t2) => e49.content ? t2.renderChildren(e49.content, `

`) : "" });
var dm = q.create({ name: "hardBreak", markdownTokenName: "br", addOptions() {
  return { keepMarks: !0, HTMLAttributes: {} };
}, inline: !0, group: "inline", selectable: !1, linebreakReplacement: !0, parseHTML() {
  return [{ tag: "br" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["br", G(this.options.HTMLAttributes, e49)];
}, renderText() {
  return `
`;
}, renderMarkdown: () => `  
`, parseMarkdown: () => ({ type: "hardBreak" }), addCommands() {
  return { setHardBreak: () => ({ commands: e49, chain: t2, state: n2, editor: r2 }) => e49.first([() => e49.exitCode(), () => e49.command(() => {
    let { selection: e50, storedMarks: i2 } = n2;
    if (e50.$from.parent.type.spec.isolating) return !1;
    let { keepMarks: a2 } = this.options, { splittableMarks: o2 } = r2.extensionManager, s2 = i2 || e50.$to.parentOffset && e50.$from.marks();
    return t2().insertContent({ type: this.name }).command(({ tr: e51, dispatch: t3 }) => {
      if (t3 && s2 && a2) {
        let t4 = s2.filter((e52) => o2.includes(e52.type.name));
        e51.ensureMarks(t4);
      }
      return !0;
    }).run();
  })]) };
}, addKeyboardShortcuts() {
  return { "Mod-Enter": () => this.editor.commands.setHardBreak(), "Shift-Enter": () => this.editor.commands.setHardBreak() };
} });
var fm = q.create({ name: "heading", addOptions() {
  return { levels: [1, 2, 3, 4, 5, 6], HTMLAttributes: {} };
}, content: "inline*", group: "block", defining: !0, addAttributes() {
  return { level: { default: 1, rendered: !1 } };
}, parseHTML() {
  return this.options.levels.map((e49) => ({ tag: `h${e49}`, attrs: { level: e49 } }));
}, renderHTML({ node: e49, HTMLAttributes: t2 }) {
  return [`h${this.options.levels.includes(e49.attrs.level) ? e49.attrs.level : this.options.levels[0]}`, G(this.options.HTMLAttributes, t2), 0];
}, parseMarkdown: (e49, t2) => t2.createNode("heading", { level: e49.depth || 1 }, t2.parseInline(e49.tokens || [])), renderMarkdown: (e49, t2) => {
  let n2 = e49.attrs?.level ? parseInt(e49.attrs.level, 10) : 1, r2 = "#".repeat(n2);
  return e49.content ? `${r2} ${t2.renderChildren(e49.content)}` : "";
}, addCommands() {
  return { setHeading: (e49) => ({ commands: t2 }) => this.options.levels.includes(e49.level) ? t2.setNode(this.name, e49) : !1, toggleHeading: (e49) => ({ commands: t2 }) => this.options.levels.includes(e49.level) ? t2.toggleNode(this.name, "paragraph", e49) : !1 };
}, addKeyboardShortcuts() {
  return this.options.levels.reduce((e49, t2) => ({ ...e49, [`Mod-Alt-${t2}`]: () => this.editor.commands.toggleHeading({ level: t2 }) }), {});
}, addInputRules() {
  return this.options.levels.map((e49) => Ld({ find: RegExp(`^(#{${Math.min(...this.options.levels)},${e49}})\\s$`), type: this.type, getAttributes: { level: e49 } }));
} });
var pm = q.create({ name: "horizontalRule", addOptions() {
  return { HTMLAttributes: {}, nextNodeType: "paragraph" };
}, group: "block", parseHTML() {
  return [{ tag: "hr" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["hr", G(this.options.HTMLAttributes, e49)];
}, markdownTokenName: "hr", parseMarkdown: (e49, t2) => t2.createNode("horizontalRule"), renderMarkdown: () => "---", addCommands() {
  return { setHorizontalRule: () => ({ chain: e49, state: t2 }) => {
    if (!Gu(t2, t2.schema.nodes[this.name])) return !1;
    let { selection: n2 } = t2, { $to: r2 } = n2, i2 = e49();
    return pu(n2) ? i2.insertContentAt(r2.pos, { type: this.name }) : i2.insertContent({ type: this.name }), i2.command(({ state: e50, tr: t3, dispatch: n3 }) => {
      if (n3) {
        let { $to: n4 } = t3.selection, r3 = n4.end();
        if (n4.nodeAfter) n4.nodeAfter.isTextblock ? t3.setSelection(A.create(t3.doc, n4.pos + 1)) : n4.nodeAfter.isBlock ? t3.setSelection(j.create(t3.doc, n4.pos)) : t3.setSelection(A.create(t3.doc, n4.pos));
        else {
          let i3 = (e50.schema.nodes[this.options.nextNodeType] || n4.parent.type.contentMatch.defaultType)?.create();
          i3 && (t3.insert(r3, i3), t3.setSelection(A.create(t3.doc, r3 + 1)));
        }
        t3.scrollIntoView();
      }
      return !0;
    }).run();
  } };
}, addInputRules() {
  return [Id({ find: /^(?:---|—-|___\s|\*\*\*\s)$/, type: this.type })];
} });
var mm = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/;
var hm = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g;
var gm = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/;
var _m = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g;
var vm = pd.create({ name: "italic", addOptions() {
  return { HTMLAttributes: {} };
}, parseHTML() {
  return [{ tag: "em" }, { tag: "i", getAttrs: (e49) => e49.style.fontStyle !== "normal" && null }, { style: "font-style=normal", clearMark: (e49) => e49.type.name === this.name }, { style: "font-style=italic" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["em", G(this.options.HTMLAttributes, e49), 0];
}, addCommands() {
  return { setItalic: () => ({ commands: e49 }) => e49.setMark(this.name), toggleItalic: () => ({ commands: e49 }) => e49.toggleMark(this.name), unsetItalic: () => ({ commands: e49 }) => e49.unsetMark(this.name) };
}, markdownTokenName: "em", parseMarkdown: (e49, t2) => t2.applyMark("italic", t2.parseInline(e49.tokens || [])), markdownOptions: { htmlReopen: { open: "<em>", close: "</em>" } }, renderMarkdown: (e49, t2) => `*${t2.renderChildren(e49)}*`, addKeyboardShortcuts() {
  return { "Mod-i": () => this.editor.commands.toggleItalic(), "Mod-I": () => this.editor.commands.toggleItalic() };
}, addInputRules() {
  return [Fd({ find: mm, type: this.type }), Fd({ find: gm, type: this.type })];
}, addPasteRules() {
  return [zd({ find: hm, type: this.type }), zd({ find: _m, type: this.type })];
} });
var ym = "aaa1rp3bb0ott3vie4c1le2ogado5udhabi7c0ademy5centure6ountant0s9o1tor4d0s1ult4e0g1ro2tna4f0l1rica5g0akhan5ency5i0g1rbus3force5tel5kdn3l0ibaba4pay4lfinanz6state5y2sace3tom5m0azon4ericanexpress7family11x2fam3ica3sterdam8nalytics7droid5quan4z2o0l2partments8p0le4q0uarelle8r0ab1mco4chi3my2pa2t0e3s0da2ia2sociates9t0hleta5torney7u0ction5di0ble3o3spost5thor3o0s4w0s2x0a2z0ure5ba0by2idu3namex4d1k2r0celona5laycard4s5efoot5gains6seball5ketball8uhaus5yern5b0c1t1va3cg1n2d1e0ats2uty4er2rlin4st0buy5t2f1g1h0arti5i0ble3d1ke2ng0o3o1z2j1lack0friday9ockbuster8g1omberg7ue3m0s1w2n0pparibas9o0ats3ehringer8fa2m1nd2o0k0ing5sch2tik2on4t1utique6x2r0adesco6idgestone9oadway5ker3ther5ussels7s1t1uild0ers6siness6y1zz3v1w1y1z0h3ca0b1fe2l0l1vinklein9m0era3p2non3petown5ital0one8r0avan4ds2e0er0s4s2sa1e1h1ino4t0ering5holic7ba1n1re3c1d1enter4o1rn3f0a1d2g1h0anel2nel4rity4se2t2eap3intai5ristmas6ome4urch5i0priani6rcle4sco3tadel4i0c2y3k1l0aims4eaning6ick2nic1que6othing5ud3ub0med6m1n1o0ach3des3ffee4llege4ogne5m0mbank4unity6pany2re3uter5sec4ndos3struction8ulting7tact3ractors9oking4l1p2rsica5untry4pon0s4rses6pa2r0edit0card4union9icket5own3s1uise0s6u0isinella9v1w1x1y0mru3ou3z2dad1nce3ta1e1ing3sun4y2clk3ds2e0al0er2s3gree4livery5l1oitte5ta3mocrat6ntal2ist5si0gn4v2hl2iamonds6et2gital5rect0ory7scount3ver5h2y2j1k1m1np2o0cs1tor4g1mains5t1wnload7rive4tv2ubai3pont4rban5vag2r2z2earth3t2c0o2deka3u0cation8e1g1mail3erck5nergy4gineer0ing9terprises10pson4quipment8r0icsson6ni3s0q1tate5t1u0rovision8s2vents5xchange6pert3osed4ress5traspace10fage2il1rwinds6th3mily4n0s2rm0ers5shion4t3edex3edback6rrari3ero6i0delity5o2lm2nal1nce1ial7re0stone6mdale6sh0ing5t0ness6j1k1lickr3ghts4r2orist4wers5y2m1o0o0d1tball6rd1ex2sale4um3undation8x2r0ee1senius7l1ogans4ntier7tr2ujitsu5n0d2rniture7tbol5yi3ga0l0lery3o1up4me0s3p1rden4y2b0iz3d0n2e0a1nt0ing5orge5f1g0ee3h1i0ft0s3ves2ing5l0ass3e1obal2o4m0ail3bh2o1x2n1odaddy5ld0point6f2odyear5g0le4p1t1v2p1q1r0ainger5phics5tis4een3ipe3ocery4up4s1t1u0cci3ge2ide2tars5ru3w1y2hair2mburg5ngout5us3bo2dfc0bank7ealth0care8lp1sinki6re1mes5iphop4samitsu7tachi5v2k0t2m1n1ockey4ldings5iday5medepot5goods5s0ense7nda3rse3spital5t0ing5t0els3mail5use3w2r1sbc3t1u0ghes5yatt3undai7ibm2cbc2e1u2d1e0ee3fm2kano4l1m0amat4db2mo0bilien9n0c1dustries8finiti5o2g1k1stitute6urance4e4t0ernational10uit4vestments10o1piranga7q1r0ish4s0maili5t0anbul7t0au2v3jaguar4va3cb2e0ep2tzt3welry6io2ll2m0p2nj2o0bs1urg4t1y2p0morgan6rs3uegos4niper7kaufen5ddi3e0rryhotels6properties14fh2g1h1i0a1ds2m1ndle4tchen5wi3m1n1oeln3matsu5sher5p0mg2n2r0d1ed3uokgroup8w1y0oto4z2la0caixa5mborghini8er3nd0rover6xess5salle5t0ino3robe5w0yer5b1c1ds2ease3clerc5frak4gal2o2xus4gbt3i0dl2fe0insurance9style7ghting6ke2lly3mited4o2ncoln4k2ve1ing5k1lc1p2oan0s3cker3us3l1ndon4tte1o3ve3pl0financial11r1s1t0d0a3u0ndbeck6xe1ury5v1y2ma0drid4if1son4keup4n0agement7go3p1rket0ing3s4riott5shalls7ttel5ba2c0kinsey7d1e0d0ia3et2lbourne7me1orial6n0u2rck0msd7g1h1iami3crosoft7l1ni1t2t0subishi9k1l0b1s2m0a2n1o0bi0le4da2e1i1m1nash3ey2ster5rmon3tgage6scow4to0rcycles9v0ie4p1q1r1s0d2t0n1r2u0seum3ic4v1w1x1y1z2na0b1goya4me2vy3ba2c1e0c1t0bank4flix4work5ustar5w0s2xt0direct7us4f0l2g0o2hk2i0co2ke1on3nja3ssan1y5l1o0kia3rton4w0ruz3tv4p1r0a1w2tt2u1yc2z2obi1server7ffice5kinawa6layan0group9lo3m0ega4ne1g1l0ine5oo2pen3racle3nge4g0anic5igins6saka4tsuka4t2vh3pa0ge2nasonic7ris2s1tners4s1y3y2ccw3e0t2f0izer5g1h0armacy6d1ilips5one2to0graphy6s4ysio5ics1tet2ures6d1n0g1k2oneer5zza4k1l0ace2y0station9umbing5s3m1n0c2ohl2ker3litie5rn2st3r0axi3ess3ime3o0d0uctions8f1gressive8mo2perties3y5tection8u0dential9s1t1ub2w0c2y2qa1pon3uebec3st5racing4dio4e0ad1lestate6tor2y4cipes5d0umbrella9hab3ise0n3t2liance6n0t0als5pair3ort3ublican8st0aurant8view0s5xroth6ich0ardli6oh3l1o1p2o0cks3deo3gers4om3s0vp3u0gby3hr2n2w0e2yukyu6sa0arland6fe0ty4kura4le1on3msclub4ung5ndvik0coromant12ofi4p1rl2s1ve2xo3b0i1s2c0b1haeffler7midt4olarships8ol3ule3warz5ience5ot3d1e0arch3t2cure1ity6ek2lect4ner3rvices6ven3w1x0y3fr2g1h0angrila6rp3ell3ia1ksha5oes2p0ping5uji3w3i0lk2na1gles5te3j1k0i0n2y0pe4l0ing4m0art3ile4n0cf3o0ccer3ial4ftbank4ware6hu2lar2utions7ng1y2y2pa0ce3ort2t3r0l2s1t0ada2ples4r1tebank4farm7c0group6ockholm6rage3e3ream4udio2y3yle4u0cks3pplies3y2ort5rf1gery5zuki5v1watch4iss4x1y0dney4stems6z2tab1ipei4lk2obao4rget4tamotors6r2too4x0i3c0i2d0k2eam2ch0nology8l1masek5nnis4va3f1g1h0d1eater2re6iaa2ckets5enda4ps2res2ol4j0maxx4x2k0maxx5l1m0all4n1o0day3kyo3ols3p1ray3shiba5tal3urs3wn2yota3s3r0ade1ing4ining5vel0ers0insurance16ust3v2t1ube2i1nes3shu4v0s2w1z2ua1bank3s2g1k1nicom3versity8o2ol2ps2s1y1z2va0cations7na1guard7c1e0gas3ntures6risign5m\xF6gensberater2ung14sicherung10t2g1i0ajes4deo3g1king4llas4n1p1rgin4sa1ion4va1o3laanderen9n1odka3lvo3te1ing3o2yage5u2wales2mart4ter4ng0gou5tch0es6eather0channel12bcam3er2site5d0ding5ibo2r3f1hoswho6ien2ki2lliamhill9n0dows4e1ners6me2oodside6rk0s2ld3w2s1tc1f3xbox3erox4ihuan4n2xx2yz3yachts4hoo3maxun5ndex5e1odobashi7ga2kohama6u0tube6t1un3za0ppos4ra3ero3ip2m1one3uerich6w2";
var bm = "\u03B5\u03BB1\u03C52\u0431\u04331\u0435\u043B3\u0434\u0435\u0442\u04384\u0435\u044E2\u043A\u0430\u0442\u043E\u043B\u0438\u043A6\u043E\u043C3\u043C\u043A\u04342\u043E\u043D1\u0441\u043A\u0432\u04306\u043E\u043D\u043B\u0430\u0439\u043D5\u0440\u04333\u0440\u0443\u04412\u04442\u0441\u0430\u0439\u04423\u0440\u04313\u0443\u043A\u04403\u049B\u0430\u04373\u0570\u0561\u05753\u05D9\u05E9\u05E8\u05D0\u05DC5\u05E7\u05D5\u05DD3\u0627\u0628\u0648\u0638\u0628\u064A5\u0631\u0627\u0645\u0643\u06485\u0644\u0627\u0631\u062F\u06464\u0628\u062D\u0631\u064A\u06465\u062C\u0632\u0627\u0626\u06315\u0633\u0639\u0648\u062F\u064A\u06296\u0639\u0644\u064A\u0627\u06465\u0645\u063A\u0631\u06285\u0645\u0627\u0631\u0627\u062A5\u06CC\u0631\u0627\u06465\u0628\u0627\u0631\u062A2\u0632\u0627\u06314\u064A\u062A\u06433\u06BE\u0627\u0631\u062A5\u062A\u0648\u0646\u06334\u0633\u0648\u062F\u0627\u06463\u0631\u064A\u06295\u0634\u0628\u0643\u06294\u0639\u0631\u0627\u06422\u06282\u0645\u0627\u06464\u0641\u0644\u0633\u0637\u064A\u06466\u0642\u0637\u06313\u0643\u0627\u062B\u0648\u0644\u064A\u06436\u0648\u06453\u0645\u0635\u06312\u0644\u064A\u0633\u064A\u06275\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u06277\u0642\u06394\u0647\u0645\u0631\u0627\u06475\u067E\u0627\u06A9\u0633\u062A\u0627\u06467\u0680\u0627\u0631\u062A4\u0915\u0949\u092E3\u0928\u0947\u091F3\u092D\u093E\u0930\u09240\u092E\u094D3\u094B\u09245\u0938\u0902\u0917\u0920\u09285\u09AC\u09BE\u0982\u09B2\u09BE5\u09AD\u09BE\u09B0\u09A42\u09F0\u09A44\u0A2D\u0A3E\u0A30\u0A244\u0AAD\u0ABE\u0AB0\u0AA44\u0B2D\u0B3E\u0B30\u0B244\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE6\u0BB2\u0B99\u0BCD\u0B95\u0BC86\u0B9A\u0BBF\u0B99\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0BC2\u0BB0\u0BCD11\u0C2D\u0C3E\u0C30\u0C24\u0C4D5\u0CAD\u0CBE\u0CB0\u0CA44\u0D2D\u0D3E\u0D30\u0D24\u0D025\u0DBD\u0D82\u0D9A\u0DCF4\u0E04\u0E2D\u0E213\u0E44\u0E17\u0E223\u0EA5\u0EB2\u0EA73\u10D2\u10D42\u307F\u3093\u306A3\u30A2\u30DE\u30BE\u30F34\u30AF\u30E9\u30A6\u30C94\u30B0\u30FC\u30B0\u30EB4\u30B3\u30E02\u30B9\u30C8\u30A23\u30BB\u30FC\u30EB3\u30D5\u30A1\u30C3\u30B7\u30E7\u30F36\u30DD\u30A4\u30F3\u30C84\u4E16\u754C2\u4E2D\u4FE11\u56FD1\u570B1\u6587\u7F513\u4E9A\u9A6C\u900A3\u4F01\u4E1A2\u4F5B\u5C712\u4FE1\u606F2\u5065\u5EB72\u516B\u53662\u516C\u53F81\u76CA2\u53F0\u6E7E1\u70632\u5546\u57CE1\u5E971\u68072\u5609\u91CC0\u5927\u9152\u5E975\u5728\u7EBF2\u5927\u62FF2\u5929\u4E3B\u65593\u5A31\u4E502\u5BB6\u96FB2\u5E7F\u4E1C2\u5FAE\u535A2\u6148\u55842\u6211\u7231\u4F603\u624B\u673A2\u62DB\u80582\u653F\u52A11\u5E9C2\u65B0\u52A0\u57612\u95FB2\u65F6\u5C1A2\u66F8\u7C4D2\u673A\u67842\u6DE1\u9A6C\u95213\u6E38\u620F2\u6FB3\u95802\u70B9\u770B2\u79FB\u52A82\u7EC4\u7EC7\u673A\u67844\u7F51\u57401\u5E971\u7AD91\u7EDC2\u8054\u901A2\u8C37\u6B4C2\u8D2D\u72692\u901A\u8CA92\u96C6\u56E22\u96FB\u8A0A\u76C8\u79D14\u98DE\u5229\u6D663\u98DF\u54C12\u9910\u53852\u9999\u683C\u91CC\u62C93\u6E2F2\uB2F7\uB1371\uCEF42\uC0BC\uC1312\uD55C\uAD6D2";
var xm = "numeric";
var Sm = "ascii";
var Cm = "alpha";
var wm = "asciinumeric";
var Tm = "alphanumeric";
var Em = "domain";
var Dm = "emoji";
var Om = "scheme";
var km = "slashscheme";
var Am = "whitespace";
function jm(e49, t2) {
  return e49 in t2 || (t2[e49] = []), t2[e49];
}
function Mm(e49, t2, n2) {
  t2[xm] && (t2[wm] = !0, t2[Tm] = !0), t2[Sm] && (t2[wm] = !0, t2[Cm] = !0), t2[wm] && (t2[Tm] = !0), t2[Cm] && (t2[Tm] = !0), t2[Tm] && (t2[Em] = !0), t2[Dm] && (t2[Em] = !0);
  for (let r2 in t2) {
    let t3 = jm(r2, n2);
    t3.indexOf(e49) < 0 && t3.push(e49);
  }
}
function Nm(e49, t2) {
  let n2 = {};
  for (let r2 in t2) t2[r2].indexOf(e49) >= 0 && (n2[r2] = !0);
  return n2;
}
function J(e49 = null) {
  this.j = {}, this.jr = [], this.jd = null, this.t = e49;
}
(J.groups = {});
(J.prototype = { accepts() {
  return !!this.t;
}, go(e49) {
  let t2 = this, n2 = t2.j[e49];
  if (n2) return n2;
  for (let n3 = 0; n3 < t2.jr.length; n3++) {
    let r2 = t2.jr[n3][0], i2 = t2.jr[n3][1];
    if (i2 && r2.test(e49)) return i2;
  }
  return t2.jd;
}, has(e49, t2 = !1) {
  return t2 ? e49 in this.j : !!this.go(e49);
}, ta(e49, t2, n2, r2) {
  for (let i2 = 0; i2 < e49.length; i2++) this.tt(e49[i2], t2, n2, r2);
}, tr(e49, t2, n2, r2) {
  r2 ||= J.groups;
  let i2;
  return t2 && t2.j ? i2 = t2 : (i2 = new J(t2), n2 && r2 && Mm(t2, n2, r2)), this.jr.push([e49, i2]), i2;
}, ts(e49, t2, n2, r2) {
  let i2 = this, a2 = e49.length;
  if (!a2) return i2;
  for (let t3 = 0; t3 < a2 - 1; t3++) i2 = i2.tt(e49[t3]);
  return i2.tt(e49[a2 - 1], t2, n2, r2);
}, tt(e49, t2, n2, r2) {
  r2 ||= J.groups;
  let i2 = this;
  if (t2 && t2.j) return i2.j[e49] = t2, t2;
  let a2 = t2, o2, s2 = i2.go(e49);
  return s2 ? (o2 = new J(), Object.assign(o2.j, s2.j), o2.jr.push.apply(o2.jr, s2.jr), o2.jd = s2.jd, o2.t = s2.t) : o2 = new J(), a2 && (r2 && (o2.t && typeof o2.t == "string" ? Mm(a2, Object.assign(Nm(o2.t, r2), n2), r2) : n2 && Mm(a2, n2, r2)), o2.t = a2), i2.j[e49] = o2, o2;
} });
var Y = (e49, t2, n2, r2, i2) => e49.ta(t2, n2, r2, i2);
var X = (e49, t2, n2, r2, i2) => e49.tr(t2, n2, r2, i2);
var Pm = (e49, t2, n2, r2, i2) => e49.ts(t2, n2, r2, i2);
var Z = (e49, t2, n2, r2, i2) => e49.tt(t2, n2, r2, i2);
var Fm = "WORD";
var Im = "UWORD";
var Lm = "ASCIINUMERICAL";
var Rm = "ALPHANUMERICAL";
var zm = "LOCALHOST";
var Bm = "TLD";
var Vm = "UTLD";
var Hm = "SCHEME";
var Um = "SLASH_SCHEME";
var Wm = "NUM";
var Gm = "WS";
var Km = "NL";
var qm = "OPENBRACE";
var Jm = "CLOSEBRACE";
var Ym = "OPENBRACKET";
var Xm = "CLOSEBRACKET";
var Zm = "OPENPAREN";
var Qm = "CLOSEPAREN";
var $m = "OPENANGLEBRACKET";
var eh = "CLOSEANGLEBRACKET";
var th = "FULLWIDTHLEFTPAREN";
var nh = "FULLWIDTHRIGHTPAREN";
var rh = "LEFTCORNERBRACKET";
var ih = "RIGHTCORNERBRACKET";
var ah = "LEFTWHITECORNERBRACKET";
var oh = "RIGHTWHITECORNERBRACKET";
var sh = "FULLWIDTHLESSTHAN";
var ch = "FULLWIDTHGREATERTHAN";
var lh = "AMPERSAND";
var uh = "APOSTROPHE";
var dh = "ASTERISK";
var fh = "AT";
var ph = "BACKSLASH";
var mh = "BACKTICK";
var hh = "CARET";
var gh = "COLON";
var _h = "COMMA";
var vh = "DOLLAR";
var yh = "DOT";
var bh = "EQUALS";
var xh = "EXCLAMATION";
var Sh = "HYPHEN";
var Ch = "PERCENT";
var wh = "PIPE";
var Th = "PLUS";
var Eh = "POUND";
var Dh = "QUERY";
var Oh = "QUOTE";
var kh = "FULLWIDTHMIDDLEDOT";
var Ah = "SEMI";
var jh = "SLASH";
var Mh = "TILDE";
var Nh = "UNDERSCORE";
var Ph = "EMOJI";
var Fh = "SYM";
var Ih = Object.freeze({ __proto__: null, ALPHANUMERICAL: Rm, AMPERSAND: lh, APOSTROPHE: uh, ASCIINUMERICAL: Lm, ASTERISK: dh, AT: fh, BACKSLASH: ph, BACKTICK: mh, CARET: hh, CLOSEANGLEBRACKET: eh, CLOSEBRACE: Jm, CLOSEBRACKET: Xm, CLOSEPAREN: Qm, COLON: gh, COMMA: _h, DOLLAR: vh, DOT: yh, EMOJI: Ph, EQUALS: bh, EXCLAMATION: xh, FULLWIDTHGREATERTHAN: ch, FULLWIDTHLEFTPAREN: th, FULLWIDTHLESSTHAN: sh, FULLWIDTHMIDDLEDOT: kh, FULLWIDTHRIGHTPAREN: nh, HYPHEN: Sh, LEFTCORNERBRACKET: rh, LEFTWHITECORNERBRACKET: ah, LOCALHOST: zm, NL: Km, NUM: Wm, OPENANGLEBRACKET: $m, OPENBRACE: qm, OPENBRACKET: Ym, OPENPAREN: Zm, PERCENT: Ch, PIPE: wh, PLUS: Th, POUND: Eh, QUERY: Dh, QUOTE: Oh, RIGHTCORNERBRACKET: ih, RIGHTWHITECORNERBRACKET: oh, SCHEME: Hm, SEMI: Ah, SLASH: jh, SLASH_SCHEME: Um, SYM: Fh, TILDE: Mh, TLD: Bm, UNDERSCORE: Nh, UTLD: Vm, UWORD: Im, WORD: Fm, WS: Gm });
var Lh = /[a-z]/;
var Rh = /\p{L}/u;
var zh = /\p{Emoji}/u;
var Bh = /\d/;
var Vh = /\s/;
var Hh = "\r";
var Uh = `
`;
var Wh = "\uFE0F";
var Gh = "\u200D";
var Kh = "\uFFFC";
var qh = null;
var Jh = null;
function Yh(e49 = []) {
  let t2 = {};
  J.groups = t2;
  let n2 = new J();
  qh ??= $h(ym), Jh ??= $h(bm), Z(n2, "'", uh), Z(n2, "{", qm), Z(n2, "}", Jm), Z(n2, "[", Ym), Z(n2, "]", Xm), Z(n2, "(", Zm), Z(n2, ")", Qm), Z(n2, "<", $m), Z(n2, ">", eh), Z(n2, "\uFF08", th), Z(n2, "\uFF09", nh), Z(n2, "\u300C", rh), Z(n2, "\u300D", ih), Z(n2, "\u300E", ah), Z(n2, "\u300F", oh), Z(n2, "\uFF1C", sh), Z(n2, "\uFF1E", ch), Z(n2, "&", lh), Z(n2, "*", dh), Z(n2, "@", fh), Z(n2, "`", mh), Z(n2, "^", hh), Z(n2, ":", gh), Z(n2, ",", _h), Z(n2, "$", vh), Z(n2, ".", yh), Z(n2, "=", bh), Z(n2, "!", xh), Z(n2, "-", Sh), Z(n2, "%", Ch), Z(n2, "|", wh), Z(n2, "+", Th), Z(n2, "#", Eh), Z(n2, "?", Dh), Z(n2, '"', Oh), Z(n2, "/", jh), Z(n2, ";", Ah), Z(n2, "~", Mh), Z(n2, "_", Nh), Z(n2, "\\", ph), Z(n2, "\u30FB", kh);
  let r2 = X(n2, Bh, Wm, { [xm]: !0 });
  X(r2, Bh, r2);
  let i2 = X(r2, Lh, Lm, { [wm]: !0 }), a2 = X(r2, Rh, Rm, { [Tm]: !0 }), o2 = X(n2, Lh, Fm, { [Sm]: !0 });
  X(o2, Bh, i2), X(o2, Lh, o2), X(i2, Bh, i2), X(i2, Lh, i2);
  let s2 = X(n2, Rh, Im, { [Cm]: !0 });
  X(s2, Lh), X(s2, Bh, a2), X(s2, Rh, s2), X(a2, Bh, a2), X(a2, Lh), X(a2, Rh, a2);
  let c2 = Z(n2, Uh, Km, { [Am]: !0 }), l2 = Z(n2, Hh, Gm, { [Am]: !0 }), u2 = X(n2, Vh, Gm, { [Am]: !0 });
  Z(n2, Kh, u2), Z(l2, Uh, c2), Z(l2, Kh, u2), X(l2, Vh, u2), Z(u2, Hh), Z(u2, Uh), X(u2, Vh, u2), Z(u2, Kh, u2);
  let d2 = X(n2, zh, Ph, { [Dm]: !0 });
  Z(d2, "#"), X(d2, zh, d2), Z(d2, Wh, d2);
  let f2 = Z(d2, Gh);
  Z(f2, "#"), X(f2, zh, d2);
  let p2 = [[Lh, o2], [Bh, i2]], m2 = [[Lh, null], [Rh, s2], [Bh, a2]];
  for (let e50 = 0; e50 < qh.length; e50++) Qh(n2, qh[e50], Bm, Fm, p2);
  for (let e50 = 0; e50 < Jh.length; e50++) Qh(n2, Jh[e50], Vm, Im, m2);
  Mm(Bm, { tld: !0, ascii: !0 }, t2), Mm(Vm, { utld: !0, alpha: !0 }, t2), Qh(n2, "file", Hm, Fm, p2), Qh(n2, "mailto", Hm, Fm, p2), Qh(n2, "http", Um, Fm, p2), Qh(n2, "https", Um, Fm, p2), Qh(n2, "ftp", Um, Fm, p2), Qh(n2, "ftps", Um, Fm, p2), Mm(Hm, { scheme: !0, ascii: !0 }, t2), Mm(Um, { slashscheme: !0, ascii: !0 }, t2), e49 = e49.sort((e50, t3) => e50[0] > t3[0] ? 1 : -1);
  for (let t3 = 0; t3 < e49.length; t3++) {
    let r3 = e49[t3][0], i3 = e49[t3][1] ? { [Om]: !0 } : { [km]: !0 };
    r3.indexOf("-") >= 0 ? i3[Em] = !0 : Lh.test(r3) ? Bh.test(r3) ? i3[wm] = !0 : i3[Sm] = !0 : i3[xm] = !0, Pm(n2, r3, r3, i3);
  }
  return Pm(n2, "localhost", zm, { ascii: !0 }), n2.jd = new J(Fh), { start: n2, tokens: Object.assign({ groups: t2 }, Ih) };
}
function Xh(e49, t2) {
  let n2 = Zh(t2.replace(/[A-Z]/g, (e50) => e50.toLowerCase())), r2 = n2.length, i2 = [], a2 = 0, o2 = 0;
  for (; o2 < r2; ) {
    let s2 = e49, c2 = null, l2 = 0, u2 = null, d2 = -1, f2 = -1;
    for (; o2 < r2 && (c2 = s2.go(n2[o2])); ) s2 = c2, s2.accepts() ? (d2 = 0, f2 = 0, u2 = s2) : d2 >= 0 && (d2 += n2[o2].length, f2++), l2 += n2[o2].length, a2 += n2[o2].length, o2++;
    a2 -= d2, o2 -= f2, l2 -= d2, i2.push({ t: u2.t, v: t2.slice(a2 - l2, a2), s: a2 - l2, e: a2 });
  }
  return i2;
}
function Zh(e49) {
  let t2 = [], n2 = e49.length, r2 = 0;
  for (; r2 < n2; ) {
    let i2 = e49.charCodeAt(r2), a2, o2 = i2 < 55296 || i2 > 56319 || r2 + 1 === n2 || (a2 = e49.charCodeAt(r2 + 1)) < 56320 || a2 > 57343 ? e49[r2] : e49.slice(r2, r2 + 2);
    t2.push(o2), r2 += o2.length;
  }
  return t2;
}
function Qh(e49, t2, n2, r2, i2) {
  let a2, o2 = t2.length;
  for (let n3 = 0; n3 < o2 - 1; n3++) {
    let o3 = t2[n3];
    e49.j[o3] ? a2 = e49.j[o3] : (a2 = new J(r2), a2.jr = i2.slice(), e49.j[o3] = a2), e49 = a2;
  }
  return a2 = new J(n2), a2.jr = i2.slice(), e49.j[t2[o2 - 1]] = a2, a2;
}
function $h(e49) {
  let t2 = [], n2 = [], r2 = 0;
  for (; r2 < e49.length; ) {
    let i2 = 0;
    for (; "0123456789".indexOf(e49[r2 + i2]) >= 0; ) i2++;
    if (i2 > 0) {
      t2.push(n2.join(""));
      for (let t3 = parseInt(e49.substring(r2, r2 + i2), 10); t3 > 0; t3--) n2.pop();
      r2 += i2;
    } else n2.push(e49[r2]), r2++;
  }
  return t2;
}
var eg = { defaultProtocol: "http", events: null, format: ng, formatHref: ng, nl2br: !1, tagName: "a", target: null, rel: null, validate: !0, truncate: 1 / 0, className: null, attributes: null, ignoreTags: [], render: null };
function tg(e49, t2 = null) {
  let n2 = Object.assign({}, eg);
  e49 && (n2 = Object.assign(n2, e49 instanceof tg ? e49.o : e49));
  let r2 = n2.ignoreTags, i2 = [];
  for (let e50 = 0; e50 < r2.length; e50++) i2.push(r2[e50].toUpperCase());
  this.o = n2, t2 && (this.defaultRender = t2), this.ignoreTags = i2;
}
tg.prototype = { o: eg, ignoreTags: [], defaultRender(e49) {
  return e49;
}, check(e49) {
  return this.get("validate", e49.toString(), e49);
}, get(e49, t2, n2) {
  let r2 = t2 != null, i2 = this.o[e49];
  return i2 && (typeof i2 == "object" ? (i2 = n2.t in i2 ? i2[n2.t] : eg[e49], typeof i2 == "function" && r2 && (i2 = i2(t2, n2))) : typeof i2 == "function" && r2 && (i2 = i2(t2, n2.t, n2)), i2);
}, getObj(e49, t2, n2) {
  let r2 = this.o[e49];
  return typeof r2 == "function" && t2 != null && (r2 = r2(t2, n2.t, n2)), r2;
}, render(e49) {
  let t2 = e49.render(this);
  return (this.get("render", null, e49) || this.defaultRender)(t2, e49.t, e49);
} };
function ng(e49) {
  return e49;
}
function rg(e49, t2) {
  this.t = "token", this.v = e49, this.tk = t2;
}
rg.prototype = { isLink: !1, toString() {
  return this.v;
}, toHref(e49) {
  return this.toString();
}, toFormattedString(e49) {
  let t2 = this.toString(), n2 = e49.get("truncate", t2, this), r2 = e49.get("format", t2, this);
  return n2 && r2.length > n2 ? r2.substring(0, n2) + "\u2026" : r2;
}, toFormattedHref(e49) {
  return e49.get("formatHref", this.toHref(e49.get("defaultProtocol")), this);
}, startIndex() {
  return this.tk[0].s;
}, endIndex() {
  return this.tk[this.tk.length - 1].e;
}, toObject(e49 = eg.defaultProtocol) {
  return { type: this.t, value: this.toString(), isLink: this.isLink, href: this.toHref(e49), start: this.startIndex(), end: this.endIndex() };
}, toFormattedObject(e49) {
  return { type: this.t, value: this.toFormattedString(e49), isLink: this.isLink, href: this.toFormattedHref(e49), start: this.startIndex(), end: this.endIndex() };
}, validate(e49) {
  return e49.get("validate", this.toString(), this);
}, render(e49) {
  let t2 = this, n2 = this.toHref(e49.get("defaultProtocol")), r2 = e49.get("formatHref", n2, this), i2 = e49.get("tagName", n2, t2), a2 = this.toFormattedString(e49), o2 = {}, s2 = e49.get("className", n2, t2), c2 = e49.get("target", n2, t2), l2 = e49.get("rel", n2, t2), u2 = e49.getObj("attributes", n2, t2), d2 = e49.getObj("events", n2, t2);
  return o2.href = r2, s2 && (o2.class = s2), c2 && (o2.target = c2), l2 && (o2.rel = l2), u2 && Object.assign(o2, u2), { tagName: i2, attributes: o2, content: a2, eventListeners: d2 };
} };
function ig(e49, t2) {
  class n2 extends rg {
    constructor(t3, n3) {
      super(t3, n3), this.t = e49;
    }
  }
  for (let e50 in t2) n2.prototype[e50] = t2[e50];
  return n2.t = e49, n2;
}
var ag = ig("email", { isLink: !0, toHref() {
  return "mailto:" + this.toString();
} });
var og = ig("text");
var sg = ig("nl");
var cg = ig("url", { isLink: !0, toHref(e49 = eg.defaultProtocol) {
  return this.hasProtocol() ? this.v : `${e49}://${this.v}`;
}, hasProtocol() {
  let e49 = this.tk;
  return e49.length >= 2 && e49[0].t !== zm && e49[1].t === gh;
} });
var lg = (e49) => new J(e49);
function ug({ groups: e49 }) {
  let t2 = e49.domain.concat([lh, dh, fh, ph, mh, hh, vh, bh, Sh, Wm, Ch, wh, Th, Eh, jh, Fh, Mh, Nh]), n2 = [uh, gh, _h, yh, xh, Ch, Dh, Oh, Ah, $m, eh, qm, Jm, Xm, Ym, Zm, Qm, th, nh, rh, ih, ah, oh, sh, ch], r2 = [lh, uh, dh, ph, mh, hh, vh, bh, Sh, qm, Jm, Ch, wh, Th, Eh, Dh, jh, Fh, Mh, Nh], i2 = lg(), a2 = Z(i2, Mh);
  Y(a2, r2, a2), Y(a2, e49.domain, a2);
  let o2 = lg(), s2 = lg(), c2 = lg();
  Y(i2, e49.domain, o2), Y(i2, e49.scheme, s2), Y(i2, e49.slashscheme, c2), Y(o2, r2, a2), Y(o2, e49.domain, o2);
  let l2 = Z(o2, fh);
  Z(a2, fh, l2), Z(s2, fh, l2), Z(c2, fh, l2);
  let u2 = Z(a2, yh);
  Y(u2, r2, a2), Y(u2, e49.domain, a2);
  let d2 = lg();
  Y(l2, e49.domain, d2), Y(d2, e49.domain, d2);
  let f2 = Z(d2, yh);
  Y(f2, e49.domain, d2);
  let p2 = lg(ag);
  Y(f2, e49.tld, p2), Y(f2, e49.utld, p2), Z(l2, zm, p2);
  let m2 = Z(d2, Sh);
  Z(m2, Sh, m2), Y(m2, e49.domain, d2), Y(p2, e49.domain, d2), Z(p2, yh, f2), Z(p2, Sh, m2);
  let h2 = Z(o2, Sh), g2 = Z(o2, yh);
  Z(h2, Sh, h2), Y(h2, e49.domain, o2), Y(g2, r2, a2), Y(g2, e49.domain, o2);
  let _2 = lg(cg);
  Y(g2, e49.tld, _2), Y(g2, e49.utld, _2), Y(_2, e49.domain, o2), Y(_2, r2, a2), Z(_2, yh, g2), Z(_2, Sh, h2), Z(_2, fh, l2);
  let v2 = Z(_2, gh), y2 = lg(cg);
  Y(v2, e49.numeric, y2);
  let b2 = lg(cg), x2 = lg();
  Y(b2, t2, b2), Y(b2, n2, x2), Y(x2, t2, b2), Y(x2, n2, x2), Z(_2, jh, b2), Z(y2, jh, b2);
  let S2 = Z(s2, gh), C2 = Z(Z(Z(c2, gh), jh), jh);
  Y(s2, e49.domain, o2), Z(s2, yh, g2), Z(s2, Sh, h2), Y(c2, e49.domain, o2), Z(c2, yh, g2), Z(c2, Sh, h2), Y(S2, e49.domain, b2), Z(S2, jh, b2), Z(S2, Dh, b2), Y(C2, e49.domain, b2), Y(C2, t2, b2), Z(C2, jh, b2);
  let w2 = [[qm, Jm], [Ym, Xm], [Zm, Qm], [$m, eh], [th, nh], [rh, ih], [ah, oh], [sh, ch]];
  for (let e50 = 0; e50 < w2.length; e50++) {
    let [r3, i3] = w2[e50], a3 = Z(b2, r3);
    Z(x2, r3, a3);
    let o3 = lg(cg);
    Y(a3, t2, o3);
    let s3 = lg();
    Y(a3, n2, s3), Z(a3, i3, b2), Y(o3, t2, o3), Y(o3, n2, s3), Y(s3, t2, o3), Y(s3, n2, s3), Z(o3, i3, b2), Z(s3, i3, b2);
  }
  return Z(i2, zm, _2), Z(i2, Km, sg), { start: i2, tokens: Ih };
}
function dg(e49, t2, n2) {
  let r2 = n2.length, i2 = 0, a2 = [], o2 = [];
  for (; i2 < r2; ) {
    let s2 = e49, c2 = null, l2 = null, u2 = 0, d2 = null, f2 = -1;
    for (; i2 < r2 && !(c2 = s2.go(n2[i2].t)); ) o2.push(n2[i2++]);
    for (; i2 < r2 && (l2 = c2 || s2.go(n2[i2].t)); ) c2 = null, s2 = l2, s2.accepts() ? (f2 = 0, d2 = s2) : f2 >= 0 && f2++, i2++, u2++;
    if (f2 < 0) i2 -= u2, i2 < r2 && (o2.push(n2[i2]), i2++);
    else {
      o2.length > 0 && (a2.push(fg(og, t2, o2)), o2 = []), i2 -= f2, u2 -= f2;
      let e50 = d2.t, r3 = n2.slice(i2 - u2, i2);
      a2.push(fg(e50, t2, r3));
    }
  }
  return o2.length > 0 && a2.push(fg(og, t2, o2)), a2;
}
function fg(e49, t2, n2) {
  let r2 = n2[0].s, i2 = n2[n2.length - 1].e;
  return new e49(t2.slice(r2, i2), n2);
}
var pg = typeof console < "u" && console && console.warn || (() => {
});
var mg = "until manual call of linkify.init(). Register all schemes and plugins before invoking linkify the first time.";
var Q = { scanner: null, parser: null, tokenQueue: [], pluginQueue: [], customSchemes: [], initialized: !1 };
function hg() {
  return J.groups = {}, Q.scanner = null, Q.parser = null, Q.tokenQueue = [], Q.pluginQueue = [], Q.customSchemes = [], Q.initialized = !1, Q;
}
function gg(e49, t2 = !1) {
  if (Q.initialized && pg(`linkifyjs: already initialized - will not register custom scheme "${e49}" ${mg}`), !/^[0-9a-z]+(-[0-9a-z]+)*$/.test(e49)) throw Error(`linkifyjs: incorrect scheme format.
1. Must only contain digits, lowercase ASCII letters or "-"
2. Cannot start or end with "-"
3. "-" cannot repeat`);
  Q.customSchemes.push([e49, t2]);
}
function _g() {
  Q.scanner = Yh(Q.customSchemes);
  for (let e49 = 0; e49 < Q.tokenQueue.length; e49++) Q.tokenQueue[e49][1]({ scanner: Q.scanner });
  Q.parser = ug(Q.scanner.tokens);
  for (let e49 = 0; e49 < Q.pluginQueue.length; e49++) Q.pluginQueue[e49][1]({ scanner: Q.scanner, parser: Q.parser });
  return Q.initialized = !0, Q;
}
function vg(e49) {
  return Q.initialized || _g(), dg(Q.parser.start, e49, Xh(Q.scanner.start, e49));
}
vg.scan = Xh;
function yg(e49, t2 = null, n2 = null) {
  if (t2 && typeof t2 == "object") {
    if (n2) throw Error(`linkifyjs: Invalid link type ${t2}; must be a string`);
    n2 = t2, t2 = null;
  }
  let r2 = new tg(n2), i2 = vg(e49), a2 = [];
  for (let e50 = 0; e50 < i2.length; e50++) {
    let n3 = i2[e50];
    n3.isLink && (!t2 || n3.t === t2) && r2.check(n3) && a2.push(n3.toFormattedObject(r2));
  }
  return a2;
}
var bg = "[\0- \xA0\u1680\u180E\u2000-\u2029\u205F\u3000]";
var xg = new RegExp(bg);
var Sg = RegExp(`${bg}$`);
var Cg = new RegExp(bg, "g");
function wg(e49) {
  return e49.length === 1 ? e49[0].isLink : e49.length === 3 && e49[1].isLink ? ["()", "[]"].includes(e49[0].value + e49[2].value) : !1;
}
function Tg(e49) {
  return new M({ key: new N("autolink"), appendTransaction: (t2, n2, r2) => {
    let i2 = t2.some((e50) => e50.docChanged) && !n2.doc.eq(r2.doc), a2 = t2.some((e50) => e50.getMeta("preventAutolink"));
    if (!i2 || a2) return;
    let { tr: o2 } = r2;
    if (eu(Tl(n2.doc, [...t2])).forEach(({ newRange: t3 }) => {
      let n3 = Dl(r2.doc, t3, (e50) => e50.isTextblock), i3, a3;
      if (n3.length > 1) i3 = n3[0], a3 = r2.doc.textBetween(i3.pos, i3.pos + i3.node.nodeSize, void 0, " ");
      else if (n3.length) {
        let e50 = r2.doc.textBetween(t3.from, t3.to, " ", " ");
        if (!Sg.test(e50)) return;
        i3 = n3[0], a3 = r2.doc.textBetween(i3.pos, t3.to, void 0, " ");
      }
      if (i3 && a3) {
        let t4 = a3.split(xg).filter(Boolean);
        if (t4.length <= 0) return !1;
        let n4 = t4[t4.length - 1], s2 = i3.pos + a3.lastIndexOf(n4);
        if (!n4) return !1;
        let c2 = vg(n4).map((t5) => t5.toObject(e49.defaultProtocol));
        if (!wg(c2)) return !1;
        c2.filter((e50) => e50.isLink).map((e50) => ({ ...e50, from: s2 + e50.start + 1, to: s2 + e50.end + 1 })).filter((e50) => !r2.schema.marks.code || !r2.doc.rangeHasMark(e50.from, e50.to, r2.schema.marks.code)).filter((t5) => e49.validate(t5.value)).filter((t5) => e49.shouldAutoLink(t5.value)).forEach((t5) => {
          tu(t5.from, t5.to, r2.doc).some((t6) => t6.mark.type === e49.type) || o2.addMark(t5.from, t5.to, e49.type.create({ href: t5.href }));
        });
      }
    }), o2.steps.length) return o2;
  } });
}
function Eg(e49) {
  return new M({ key: new N("handleClickLink"), props: { handleClick: (t2, n2, r2) => {
    if (r2.button !== 0 || !t2.editable) return !1;
    let i2 = null;
    if (r2.target instanceof HTMLAnchorElement) i2 = r2.target;
    else {
      let t3 = r2.target;
      if (!t3) return !1;
      let n3 = e49.editor.view.dom;
      i2 = t3.closest("a"), i2 && !n3.contains(i2) && (i2 = null);
    }
    if (!i2) return !1;
    let a2 = !1;
    if (e49.enableClickSelection && (a2 = e49.editor.commands.extendMarkRange(e49.type.name)), e49.openOnClick) {
      let n3 = Zl(t2.state, e49.type.name), r3 = i2.href ?? n3.href, o2 = i2.target ?? n3.target;
      r3 && (window.open(r3, o2), a2 = !0);
    }
    return a2;
  } } });
}
function Dg(e49) {
  return new M({ key: new N("handlePasteLink"), props: { handlePaste: (t2, n2, r2) => {
    let { shouldAutoLink: i2 } = e49, { state: a2 } = t2, { selection: o2 } = a2, { empty: s2 } = o2;
    if (s2) return !1;
    let c2 = "";
    r2.content.forEach((e50) => {
      c2 += e50.textContent;
    });
    let l2 = yg(c2, { defaultProtocol: e49.defaultProtocol }).find((e50) => e50.isLink && e50.value === c2);
    return !c2 || !l2 || i2 !== void 0 && !i2(l2.value) ? !1 : e49.editor.commands.setMark(e49.type, { href: l2.href });
  } } });
}
function Og(e49, t2) {
  let n2 = ["http", "https", "ftp", "ftps", "mailto", "tel", "callto", "sms", "cid", "xmpp"];
  return t2 && t2.forEach((e50) => {
    let t3 = typeof e50 == "string" ? e50 : e50.scheme;
    t3 && n2.push(t3);
  }), !e49 || e49.replace(Cg, "").match(RegExp(`^(?:(?:${n2.map((e50) => e50.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`, "i"));
}
var kg = pd.create({ name: "link", priority: 1e3, keepOnSplit: !1, exitable: !0, onCreate() {
  this.options.validate && !this.options.shouldAutoLink && (this.options.shouldAutoLink = this.options.validate, console.warn("The `validate` option is deprecated. Rename to the `shouldAutoLink` option instead.")), this.options.protocols.forEach((e49) => {
    typeof e49 == "string" ? gg(e49) : gg(e49.scheme, e49.optionalSlashes);
  });
}, onDestroy() {
  hg();
}, inclusive() {
  return this.options.autolink;
}, addOptions() {
  return { openOnClick: !0, enableClickSelection: !1, linkOnPaste: !0, autolink: !0, protocols: [], defaultProtocol: "http", HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow", class: null }, isAllowedUri: (e49, t2) => !!Og(e49, t2.protocols), validate: (e49) => !!e49, shouldAutoLink: (e49) => {
    let t2 = /^[a-z][a-z0-9+.-]*:\/\//i.test(e49), n2 = /^[a-z][a-z0-9+.-]*:/i.test(e49);
    if (t2 || n2 && !e49.includes("@")) return !0;
    let r2 = (e49.includes("@") ? e49.split("@").pop() : e49).split(/[/?#:]/)[0];
    return !(/^\d{1,3}(\.\d{1,3}){3}$/.test(r2) || !/\./.test(r2));
  } };
}, addAttributes() {
  return { href: { default: null, parseHTML(e49) {
    return e49.getAttribute("href");
  } }, target: { default: this.options.HTMLAttributes.target ?? null }, rel: { default: this.options.HTMLAttributes.rel ?? null }, class: { default: this.options.HTMLAttributes.class ?? null }, title: { default: null } };
}, parseHTML() {
  return [{ tag: "a[href]", getAttrs: (e49) => {
    let t2 = e49.getAttribute("href");
    return !t2 || !this.options.isAllowedUri(t2, { defaultValidate: (e50) => !!Og(e50, this.options.protocols), protocols: this.options.protocols, defaultProtocol: this.options.defaultProtocol }) ? !1 : null;
  } }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return this.options.isAllowedUri(e49.href, { defaultValidate: (e50) => !!Og(e50, this.options.protocols), protocols: this.options.protocols, defaultProtocol: this.options.defaultProtocol }) ? ["a", G(this.options.HTMLAttributes, e49), 0] : ["a", G(this.options.HTMLAttributes, { ...e49, href: "" }), 0];
}, markdownTokenName: "link", parseMarkdown: (e49, t2) => t2.applyMark("link", t2.parseInline(e49.tokens || []), { href: e49.href, title: e49.title || null }), renderMarkdown: (e49, t2) => {
  let n2 = e49.attrs?.href ?? "", r2 = e49.attrs?.title ?? "", i2 = t2.renderChildren(e49);
  return r2 ? `[${i2}](${n2} "${r2}")` : `[${i2}](${n2})`;
}, addCommands() {
  return { setLink: (e49) => ({ chain: t2 }) => {
    let { href: n2 } = e49;
    return this.options.isAllowedUri(n2, { defaultValidate: (e50) => !!Og(e50, this.options.protocols), protocols: this.options.protocols, defaultProtocol: this.options.defaultProtocol }) ? t2().setMark(this.name, e49).setMeta("preventAutolink", !0).run() : !1;
  }, toggleLink: (e49) => ({ chain: t2 }) => {
    let { href: n2 } = e49 || {};
    return n2 && !this.options.isAllowedUri(n2, { defaultValidate: (e50) => !!Og(e50, this.options.protocols), protocols: this.options.protocols, defaultProtocol: this.options.defaultProtocol }) ? !1 : t2().toggleMark(this.name, e49, { extendEmptyMarkRange: !0 }).setMeta("preventAutolink", !0).run();
  }, unsetLink: () => ({ chain: e49 }) => e49().unsetMark(this.name, { extendEmptyMarkRange: !0 }).setMeta("preventAutolink", !0).run() };
}, addPasteRules() {
  return [zd({ find: (e49) => {
    let t2 = [];
    if (e49) {
      let { protocols: n2, defaultProtocol: r2 } = this.options, i2 = yg(e49).filter((e50) => e50.isLink && this.options.isAllowedUri(e50.value, { defaultValidate: (e51) => !!Og(e51, n2), protocols: n2, defaultProtocol: r2 }));
      i2.length && i2.forEach((e50) => {
        this.options.shouldAutoLink(e50.value) && t2.push({ text: e50.value, data: { href: e50.href }, index: e50.start });
      });
    }
    return t2;
  }, type: this.type, getAttributes: (e49) => ({ href: e49.data?.href }) })];
}, addProseMirrorPlugins() {
  let e49 = [], { protocols: t2, defaultProtocol: n2 } = this.options;
  return this.options.autolink && e49.push(Tg({ type: this.type, defaultProtocol: this.options.defaultProtocol, validate: (e50) => this.options.isAllowedUri(e50, { defaultValidate: (e51) => !!Og(e51, t2), protocols: t2, defaultProtocol: n2 }), shouldAutoLink: this.options.shouldAutoLink })), e49.push(Eg({ type: this.type, editor: this.editor, openOnClick: this.options.openOnClick === "whenNotEditable" || this.options.openOnClick, enableClickSelection: this.options.enableClickSelection })), this.options.linkOnPaste && e49.push(Dg({ editor: this.editor, defaultProtocol: this.options.defaultProtocol, type: this.type, shouldAutoLink: this.options.shouldAutoLink })), e49;
} });
var Ag = kg;
var jg = Object.defineProperty;
var Mg = (e49, t2) => {
  for (var n2 in t2) jg(e49, n2, { get: t2[n2], enumerable: !0 });
};
var Ng = "listItem";
var Pg = "textStyle";
var Fg = /^\s*([-+*])\s$/;
var Ig = q.create({ name: "bulletList", addOptions() {
  return { itemTypeName: "listItem", HTMLAttributes: {}, keepMarks: !1, keepAttributes: !1 };
}, group: "block list", content() {
  return `${this.options.itemTypeName}+`;
}, parseHTML() {
  return [{ tag: "ul" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["ul", G(this.options.HTMLAttributes, e49), 0];
}, markdownTokenName: "list", parseMarkdown: (e49, t2) => e49.type !== "list" || e49.ordered ? [] : { type: "bulletList", content: e49.items ? t2.parseChildren(e49.items) : [] }, renderMarkdown: (e49, t2) => e49.content ? t2.renderChildren(e49.content, `
`) : "", markdownOptions: { indentsContent: !0 }, addCommands() {
  return { toggleBulletList: () => ({ commands: e49, chain: t2 }) => this.options.keepAttributes ? t2().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(Ng, this.editor.getAttributes(Pg)).run() : e49.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
}, addKeyboardShortcuts() {
  return { "Mod-Shift-8": () => this.editor.commands.toggleBulletList() };
}, addInputRules() {
  let e49 = Rd({ find: Fg, type: this.type });
  return (this.options.keepMarks || this.options.keepAttributes) && (e49 = Rd({ find: Fg, type: this.type, keepMarks: this.options.keepMarks, keepAttributes: this.options.keepAttributes, getAttributes: () => this.editor.getAttributes(Pg), editor: this.editor })), [e49];
} });
var Lg = (e49, t2, n2) => {
  let { selection: r2 } = e49;
  if (!r2.empty) return null;
  let { $from: i2 } = r2;
  if (!i2.parent.isTextblock || i2.parentOffset !== i2.parent.content.size) return null;
  let a2 = -1;
  for (let e50 = i2.depth; e50 > 0; --e50) if (i2.node(e50).type.name === t2) {
    a2 = e50;
    break;
  }
  if (a2 < 0) return null;
  let o2 = i2.node(a2), s2 = i2.index(a2);
  if (s2 + 1 >= o2.childCount) return null;
  let c2 = o2.child(s2 + 1);
  if (!n2.includes(c2.type.name)) return null;
  let l2 = e49.schema.nodes[t2], u2 = !1;
  if (c2.forEach((e50) => {
    e50.type === l2 && e50.childCount > 1 && (u2 = !0);
  }), !u2) return null;
  let d2 = e49.doc.resolve(i2.after()).nodeAfter;
  if (!d2 || !n2.includes(d2.type.name)) return null;
  let f2 = [];
  return d2.forEach((e50) => {
    f2.push(e50);
  }), f2.length === 0 ? null : { listItemDepth: a2, nestedList: d2, nestedListPos: i2.after(), insertPos: i2.after(a2), items: f2 };
};
var Rg = (e49, t2, n2, r2) => {
  let i2 = Lg(e49, n2, r2);
  if (!i2) return !1;
  let { selection: a2 } = e49, { nestedList: o2, nestedListPos: s2, insertPos: c2, items: l2 } = i2, u2 = e49.tr;
  u2.delete(s2, s2 + o2.nodeSize);
  let d2 = u2.mapping.map(c2);
  return u2.insert(d2, y.from(l2)), u2.setSelection(a2.map(u2.doc, u2.mapping)), t2 && t2(u2), !0;
};
var zg = (e49, t2, n2) => Rg(e49.state, e49.view.dispatch, t2, n2);
var Bg = (e49, t2) => K.create({ name: `${e49}BranchingDeleteKeymap`, priority: 101, addKeyboardShortcuts() {
  let n2 = () => zg(this.editor, e49, t2);
  return { Delete: n2, "Mod-Delete": n2 };
} });
var Vg = [[1e3, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
var Hg = "abcdefghijklmnopqrstuvwxyz";
var Ug = String.raw`\d+|[ivxlcdmIVXLCDM]+|${"[a-zA-Z]{1,2}"}`;
function Wg(e49) {
  let t2 = e49, n2 = "";
  for (let [e50, r2] of Vg) for (; t2 >= e50; ) n2 += r2, t2 -= e50;
  return n2;
}
function Gg(e49) {
  return Wg(e49).toUpperCase();
}
function Kg(e49) {
  let t2 = e49.toLowerCase(), n2 = 0, r2 = 0;
  for (; n2 < t2.length; ) {
    let e50 = !1;
    for (let [i2, a2] of Vg) if (t2.startsWith(a2, n2)) {
      r2 += i2, n2 += a2.length, e50 = !0;
      break;
    }
    if (!e50) return 0;
  }
  return r2;
}
function qg(e49) {
  if (!/^[ivxlcdmIVXLCDM]+$/.test(e49)) return !1;
  let t2 = Kg(e49);
  return t2 <= 0 ? !1 : (e49 === e49.toLowerCase() ? Wg(t2) : Gg(t2)) === e49;
}
function Jg(e49) {
  let t2 = e49.toLowerCase();
  if (t2.length === 1) return t2.charCodeAt(0) - 97 + 1;
  if (t2.length === 2) {
    let e50 = t2.charCodeAt(0) - 97, n2 = t2.charCodeAt(1) - 97;
    return (e50 + 1) * 26 + n2 + 1;
  }
  return 0;
}
function Yg(e49) {
  if (e49 <= 26) return Hg[e49 - 1];
  let t2 = Math.floor((e49 - 1) / 26) - 1, n2 = (e49 - 1) % 26;
  return t2 < 0 ? Hg[n2] : Hg[t2] + Hg[n2];
}
function Xg(e49) {
  if (e49 && !/^\d+$/.test(e49)) {
    if (qg(e49)) return e49 === e49.toLowerCase() ? "i" : "I";
    if (/^[a-z]{1,2}$/.test(e49)) return "a";
    if (/^[A-Z]{1,2}$/.test(e49)) return "A";
  }
}
function Zg(e49) {
  if (/^\d+$/.test(e49)) return parseInt(e49, 10);
  let t2 = Xg(e49);
  if (t2 === "i" || t2 === "I") return Kg(e49);
  if (t2 === "a" || t2 === "A") {
    let t3 = Jg(e49);
    return t3 > 0 ? t3 : 1;
  }
  let n2 = parseInt(e49, 10);
  return Number.isNaN(n2) ? 1 : n2;
}
function Qg(e49, t2) {
  if (e49 === "numeric") return String(t2);
  switch (e49) {
    case "a":
      return Yg(t2);
    case "A":
      return Yg(t2).toUpperCase();
    case "i":
      return Wg(t2);
    case "I":
      return Gg(t2);
    default:
      return String(t2);
  }
}
function $g(e49) {
  if (e49.length === 0) return !1;
  let t2 = Xg(e49[0]) ?? "numeric", n2 = Zg(e49[0]);
  if (n2 < 1) return !1;
  for (let r2 = 0; r2 < e49.length; r2++) {
    let i2 = Qg(t2, n2 + r2);
    if (e49[r2] !== i2) return !1;
  }
  return !0;
}
function e_(e49) {
  return { type: Xg(e49), start: Zg(e49) };
}
function t_(e49) {
  let { type: t2, start: n2 } = e_(e49), r2 = {};
  return t2 && (r2.type = t2), n2 !== 1 && (r2.start = n2), r2;
}
function n_(e49, t2, n2 = ". ") {
  let r2 = t2 + 1;
  if (!e49 || e49 === "1") return `${r2}${n2}`;
  switch (e49) {
    case "a":
      return `${Yg(r2)}${n2}`;
    case "A":
      return `${Yg(r2).toUpperCase()}${n2}`;
    case "i":
      return `${Wg(r2)}${n2}`;
    case "I":
      return `${Gg(r2)}${n2}`;
    default:
      return `${r2}${n2}`;
  }
}
function r_(e49) {
  let t2 = e49.tokens?.[0];
  return !!(e49.text && e49.tokens?.length === 1 && t2?.type === "list" && t2.ordered && t2.raw === e49.text);
}
function i_(e49, t2) {
  return t2.tokenizeInline ? t2.parseInline(t2.tokenizeInline(e49)) : t2.parseInline([{ type: "text", raw: e49, text: e49 }]);
}
var a_ = q.create({ name: "listItem", addOptions() {
  return { HTMLAttributes: {}, bulletListTypeName: "bulletList", orderedListTypeName: "orderedList" };
}, content: "paragraph block*", defining: !0, parseHTML() {
  return [{ tag: "li" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["li", G(this.options.HTMLAttributes, e49), 0];
}, markdownTokenName: "list_item", parseMarkdown: (e49, t2) => {
  if (e49.type !== "list_item") return [];
  let n2 = t2.parseBlockChildren ?? t2.parseChildren, r2 = [];
  if (e49.tokens && e49.tokens.length > 0) {
    if (r_(e49)) return { type: "listItem", content: [{ type: "paragraph", content: i_(e49.text || "", t2) }] };
    if (e49.tokens.some((e50) => e50.type === "paragraph")) r2 = n2(e49.tokens);
    else {
      let i2 = e49.tokens[0];
      if (i2 && i2.type === "text" && i2.tokens && i2.tokens.length > 0) {
        if (r2 = [{ type: "paragraph", content: t2.parseInline(i2.tokens) }], e49.tokens.length > 1) {
          let t3 = n2(e49.tokens.slice(1));
          r2.push(...t3);
        }
      } else r2 = n2(e49.tokens);
    }
  }
  return r2.length === 0 && (r2 = [{ type: "paragraph", content: [] }]), { type: "listItem", content: r2 };
}, renderMarkdown: (e49, t2, n2) => ad(e49, t2, (e50) => {
  if (e50.parentType === "bulletList") return "- ";
  if (e50.parentType === "orderedList") {
    let t3 = e50.meta?.parentAttrs?.start || 1;
    return n_(e50.meta?.parentAttrs?.type, t3 - 1 + (e50.index || 0), ". ");
  }
  return "- ";
}, n2), addExtensions() {
  return [Bg(this.name, [this.options.bulletListTypeName, this.options.orderedListTypeName])];
}, addKeyboardShortcuts() {
  return { Enter: () => this.editor.commands.splitListItem(this.name), Tab: () => this.editor.commands.sinkListItem(this.name), "Shift-Tab": () => this.editor.commands.liftListItem(this.name) };
} });
Mg({}, { findListItemPos: () => o_, getNextListDepth: () => s_, handleBackspace: () => l_, handleDelete: () => f_, hasListBefore: () => c_, hasListItemAfter: () => p_, hasListItemBefore: () => m_, listItemHasSubList: () => h_, nextListIsDeeper: () => u_, nextListIsHigher: () => d_ });
var o_ = (e49, t2) => {
  let { $from: n2 } = t2.selection, r2 = H(e49, t2.schema), i2 = null, a2 = n2.depth, o2 = n2.pos, s2 = null;
  for (; a2 > 0 && s2 === null; ) i2 = n2.node(a2), i2.type === r2 ? s2 = a2 : (--a2, --o2);
  return s2 === null ? null : { $pos: t2.doc.resolve(o2), depth: s2 };
};
var s_ = (e49, t2) => {
  let n2 = o_(e49, t2);
  if (!n2) return !1;
  let [, r2] = nu(t2, e49, n2.$pos.pos + 4);
  return r2;
};
var c_ = (e49, t2, n2) => {
  let { $anchor: r2 } = e49.selection, i2 = Math.max(0, r2.pos - 2), a2 = e49.doc.resolve(i2).node();
  return !(!a2 || !n2.includes(a2.type.name));
};
var l_ = (e49, t2, n2) => {
  if (e49.commands.undoInputRule()) return !0;
  if (e49.state.selection.from !== e49.state.selection.to) return !1;
  if (!sl(e49.state, t2) && c_(e49.state, t2, n2)) {
    let { $anchor: n3 } = e49.state.selection, r2 = e49.state.doc.resolve(n3.before() - 1), i2 = [];
    r2.node().descendants((e50, n4) => {
      e50.type.name === t2 && i2.push({ node: e50, pos: n4 });
    });
    let a2 = i2.at(-1);
    if (!a2) return !1;
    let o2 = e49.state.doc.resolve(r2.start() + a2.pos + 1);
    return e49.chain().cut({ from: n3.start() - 1, to: n3.end() + 1 }, o2.end()).joinForward().run();
  }
  return !sl(e49.state, t2) || !lu(e49.state) ? !1 : e49.chain().liftListItem(t2).run();
};
var u_ = (e49, t2) => {
  let n2 = s_(e49, t2), r2 = o_(e49, t2);
  return !r2 || !n2 ? !1 : n2 > r2.depth;
};
var d_ = (e49, t2) => {
  let n2 = s_(e49, t2), r2 = o_(e49, t2);
  return !r2 || !n2 ? !1 : n2 < r2.depth;
};
var f_ = (e49, t2) => {
  if (!sl(e49.state, t2) || !cu(e49.state, t2)) return !1;
  let { selection: n2 } = e49.state, { $from: r2, $to: i2 } = n2;
  return !n2.empty && r2.sameParent(i2) ? !1 : u_(t2, e49.state) ? e49.chain().focus(e49.state.selection.from + 4).lift(t2).joinBackward().run() : d_(t2, e49.state) ? e49.chain().joinForward().joinBackward().run() : e49.commands.joinItemForward();
};
var p_ = (e49, t2) => {
  let { $anchor: n2 } = t2.selection, r2 = t2.doc.resolve(n2.pos - n2.parentOffset - 2);
  return r2.index() !== r2.parent.childCount - 1 && r2.nodeAfter?.type.name === e49;
};
var m_ = (e49, t2) => {
  let { $anchor: n2 } = t2.selection, r2 = t2.doc.resolve(n2.pos - 2);
  return r2.index() !== 0 && r2.nodeBefore?.type.name === e49;
};
var h_ = (e49, t2, n2) => {
  if (!n2) return !1;
  let r2 = H(e49, t2.schema), i2 = !1;
  return n2.descendants((e50) => {
    e50.type === r2 && (i2 = !0);
  }), i2;
};
var g_ = K.create({ name: "listKeymap", addOptions() {
  return { listTypes: [{ itemName: "listItem", wrapperNames: ["bulletList", "orderedList"] }, { itemName: "taskItem", wrapperNames: ["taskList"] }] };
}, addKeyboardShortcuts() {
  return { Delete: ({ editor: e49 }) => {
    let t2 = !1;
    return this.options.listTypes.forEach(({ itemName: n2 }) => {
      e49.state.schema.nodes[n2] !== void 0 && f_(e49, n2) && (t2 = !0);
    }), t2;
  }, "Mod-Delete": ({ editor: e49 }) => {
    let t2 = !1;
    return this.options.listTypes.forEach(({ itemName: n2 }) => {
      e49.state.schema.nodes[n2] !== void 0 && f_(e49, n2) && (t2 = !0);
    }), t2;
  }, Backspace: ({ editor: e49 }) => {
    let t2 = !1;
    return this.options.listTypes.forEach(({ itemName: n2, wrapperNames: r2 }) => {
      e49.state.schema.nodes[n2] !== void 0 && l_(e49, n2, r2) && (t2 = !0);
    }), t2;
  }, "Mod-Backspace": ({ editor: e49 }) => {
    let t2 = !1;
    return this.options.listTypes.forEach(({ itemName: n2, wrapperNames: r2 }) => {
      e49.state.schema.nodes[n2] !== void 0 && l_(e49, n2, r2) && (t2 = !0);
    }), t2;
  } };
} });
var __ = RegExp(`^(\\s*)(${Ug})([.)])\\s+(.*)$`);
var v_ = /^\s/;
var y_ = { heading: /^#{1,6}(?:\s|$)/, bulletItem: /^[-+*]\s+/, codeFence: /^(?:```|~~~)/, thematicBreak: /^(?:(?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})$/ };
function b_(e49) {
  return __.test(e49.trimStart());
}
function x_(e49) {
  let t2 = e49.trimStart();
  return y_.bulletItem.test(t2) || b_(t2) || y_.heading.test(t2) || y_.thematicBreak.test(t2) && !t2.startsWith("-") || /^>\s?/.test(t2) || y_.codeFence.test(t2);
}
function S_(e49) {
  return Object.values(y_).some((t2) => t2.test(e49));
}
function C_(e49) {
  let t2 = [], n2 = [], r2 = !1;
  return e49.forEach((e50) => {
    r2 ? n2.push(e50) : e50.trim() === "" || t2.length > 0 && x_(e50) ? (r2 = !0, n2.push(e50)) : t2.push(e50);
  }), { paragraphLines: t2, blockLines: n2 };
}
function w_(e49) {
  let t2 = [], n2 = 0, r2 = 0;
  for (; n2 < e49.length; ) {
    let i2 = e49[n2], a2 = i2.match(__);
    if (!a2) break;
    let [, o2, s2, c2, l2] = a2, u2 = o2.length, d2 = parseInt(s2, 10), f2 = isNaN(d2) ? Xg(s2) : void 0, p2 = isNaN(d2) ? Zg(s2) : d2, m2 = [l2], h2 = n2 + 1, g2 = [i2], _2 = !1;
    for (; h2 < e49.length; ) {
      let t3 = e49[h2];
      if (t3.match(__)) break;
      if (t3.trim() === "") g2.push(t3), m2.push(""), _2 = !0, h2 += 1;
      else if (t3.match(v_)) {
        let e50 = t3.length - t3.trimStart().length, n3 = u2 + s2.length + 1;
        g2.push(t3), m2.push(t3.slice(Math.min(e50, n3))), h2 += 1;
      } else {
        if (_2 || S_(t3)) break;
        g2.push(t3), m2.push(t3), h2 += 1;
      }
    }
    t2.push({ indent: u2, number: p2, type: f2, content: m2.join(`
`).trim(), contentLines: m2, raw: g2.join(`
`) }), r2 = h2, n2 = h2;
  }
  return [t2, r2];
}
var T_ = RegExp(`^(${Ug})([.)])\\s+(.+)$`);
function E_(e49) {
  let t2 = e49.split(`
`).filter((e50) => e50.trim().length > 0);
  if (t2.length === 0) return null;
  let n2 = [];
  for (let e50 of t2) {
    let t3 = e50.trim().match(T_);
    if (!t3) return null;
    n2.push({ marker: t3[1], content: t3[3] });
  }
  return $g(n2.map((e50) => e50.marker)) ? { type: "orderedList", attrs: t_(n2[0].marker), content: n2.map((e50) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: e50.content }] }] })) } : null;
}
function D_(e49, t2, n2) {
  let r2 = [], i2 = 0;
  for (; i2 < e49.length; ) {
    let a2 = e49[i2];
    if (a2.indent === t2) {
      let { paragraphLines: o2, blockLines: s2 } = C_(a2.contentLines), c2 = o2.join(`
`).trim(), l2 = [];
      c2 && l2.push({ type: "paragraph", raw: c2, tokens: n2.inlineTokens(c2) });
      let u2 = s2.join(`
`).trim();
      if (u2) {
        let e50 = n2.blockTokens(u2);
        l2.push(...e50);
      }
      let d2 = i2 + 1, f2 = [];
      for (; d2 < e49.length && e49[d2].indent > t2; ) f2.push(e49[d2]), d2 += 1;
      if (f2.length > 0) {
        let e50 = D_(f2, Math.min(...f2.map((e51) => e51.indent)), n2);
        l2.push({ type: "list", ordered: !0, start: f2[0].number, typeMarker: f2[0].type, items: e50, raw: f2.map((e51) => e51.raw).join(`
`) });
      }
      r2.push({ type: "list_item", raw: a2.raw, tokens: l2 }), i2 = d2;
    } else i2 += 1;
  }
  return r2;
}
function O_(e49, t2) {
  return e49.map((e50) => {
    if (e50.type !== "list_item") return t2.parseChildren([e50])[0];
    let n2 = [];
    return e50.tokens && e50.tokens.length > 0 && e50.tokens.forEach((e51) => {
      if (e51.type === "paragraph" || e51.type === "list" || e51.type === "blockquote" || e51.type === "code") n2.push(...t2.parseChildren([e51]));
      else if (e51.type === "text" && e51.tokens) {
        let r2 = t2.parseChildren([e51]);
        n2.push({ type: "paragraph", content: r2 });
      } else {
        let r2 = t2.parseChildren([e51]);
        r2.length > 0 && n2.push(...r2);
      }
    }), { type: "listItem", content: n2 };
  });
}
var k_ = "listItem";
var A_ = "textStyle";
var j_ = /^(\d+)\.\s$/;
function M_(e49) {
  let t2 = e49.match(/list-style-type\s*:\s*([^;]+)/i);
  if (!t2) return null;
  switch (t2[1].trim().toLowerCase()) {
    case "upper-roman":
      return "I";
    case "lower-roman":
      return "i";
    case "upper-alpha":
    case "upper-latin":
      return "A";
    case "lower-alpha":
    case "lower-latin":
      return "a";
    default:
      return null;
  }
}
var N_ = q.create({ name: "orderedList", addOptions() {
  return { itemTypeName: "listItem", HTMLAttributes: {}, keepMarks: !1, keepAttributes: !1 };
}, group: "block list", content() {
  return `${this.options.itemTypeName}+`;
}, addAttributes() {
  return { start: { default: 1, parseHTML: (e49) => e49.hasAttribute("start") ? parseInt(e49.getAttribute("start") || "", 10) : 1 }, type: { default: null, parseHTML: (e49) => {
    let t2 = e49.getAttribute("type");
    if (t2) return t2;
    let n2 = e49.getAttribute("style");
    if (n2) {
      let e50 = M_(n2);
      if (e50) return e50;
    }
    let r2 = e49.querySelector("li");
    if (r2) {
      let e50 = r2.getAttribute("style");
      if (e50) {
        let t3 = M_(e50);
        if (t3) return t3;
      }
    }
    return null;
  } } };
}, parseHTML() {
  return [{ tag: "ol" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  let { start: t2, type: n2, ...r2 } = e49, i2 = G(this.options.HTMLAttributes, r2);
  return t2 !== 1 && (i2.start = t2), n2 && n2 !== "1" && (i2.type = n2), ["ol", i2, 0];
}, markdownTokenName: "list", parseMarkdown: (e49, t2) => {
  if (e49.type !== "list" || !e49.ordered) return [];
  let n2 = e49.start || 1, r2 = e49.typeMarker, i2 = e49.items ? O_(e49.items, t2) : [], a2 = {};
  return n2 !== 1 && (a2.start = n2), r2 && (a2.type = r2), Object.keys(a2).length > 0 ? { type: "orderedList", attrs: a2, content: i2 } : { type: "orderedList", content: i2 };
}, renderMarkdown: (e49, t2) => e49.content ? t2.renderChildren(e49.content, `
`) : "", markdownTokenizer: { name: "orderedList", level: "block", start: () => -1, tokenize: (e49, t2, n2) => {
  let r2 = e49.split(`
`), [i2, a2] = w_(r2);
  if (i2.length === 0) return;
  let o2 = D_(i2, i2[0].indent, n2);
  if (o2.length !== 0) return { type: "list", ordered: !0, start: i2[0]?.number || 1, typeMarker: i2[0]?.type, items: o2, raw: r2.slice(0, a2).join(`
`) };
} }, markdownOptions: { indentsContent: !0 }, addCommands() {
  return { toggleOrderedList: () => ({ commands: e49, chain: t2 }) => this.options.keepAttributes ? t2().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(k_, this.editor.getAttributes(A_)).run() : e49.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
}, addKeyboardShortcuts() {
  return { "Mod-Shift-7": () => this.editor.commands.toggleOrderedList() };
}, addProseMirrorPlugins() {
  return [new M({ props: { handlePaste: (e49, t2) => {
    if (t2.clipboardData?.getData("text/html")?.trim()) return !1;
    let n2 = t2.clipboardData?.getData("text/plain");
    if (!n2) return !1;
    let r2 = E_(n2);
    if (!r2) return !1;
    try {
      let t3 = e49.state.schema.nodeFromJSON(r2), n3 = e49.state.tr.replaceSelectionWith(t3);
      return e49.dispatch(n3), !0;
    } catch {
      return !1;
    }
  } } })];
}, addInputRules() {
  let e49 = (e50, t3) => (!t3.attrs.type || t3.attrs.type === "1") && t3.childCount + t3.attrs.start === +e50[1], t2 = Rd({ find: j_, type: this.type, getAttributes: (e50) => ({ start: +e50[1] }), joinPredicate: e49 });
  return (this.options.keepMarks || this.options.keepAttributes) && (t2 = Rd({ find: j_, type: this.type, keepMarks: this.options.keepMarks, keepAttributes: this.options.keepAttributes, getAttributes: (e50) => ({ start: +e50[1], ...this.editor.getAttributes(A_) }), joinPredicate: e49, editor: this.editor })), [t2];
} });
var P_ = /^\s*(\[([( |x])?\])\s$/;
var F_ = q.create({ name: "taskItem", addOptions() {
  return { nested: !1, HTMLAttributes: {}, taskListTypeName: "taskList", a11y: void 0 };
}, content() {
  return this.options.nested ? "paragraph block*" : "paragraph+";
}, defining: !0, addAttributes() {
  return { checked: { default: !1, keepOnSplit: !1, parseHTML: (e49) => {
    let t2 = e49.getAttribute("data-checked");
    return t2 === "" || t2 === "true";
  }, renderHTML: (e49) => ({ "data-checked": e49.checked }) } };
}, parseHTML() {
  return [{ tag: `li[data-type="${this.name}"]`, priority: 51 }];
}, renderHTML({ node: e49, HTMLAttributes: t2 }) {
  return ["li", G(this.options.HTMLAttributes, t2, { "data-type": this.name }), ["label", ["input", { type: "checkbox", checked: e49.attrs.checked ? "checked" : null }], ["span"]], ["div", 0]];
}, parseMarkdown: (e49, t2) => {
  let n2 = [];
  if (e49.tokens && e49.tokens.length > 0 ? n2.push(t2.createNode("paragraph", {}, t2.parseInline(e49.tokens))) : e49.text ? n2.push(t2.createNode("paragraph", {}, [t2.createNode("text", { text: e49.text })])) : n2.push(t2.createNode("paragraph", {}, [])), e49.nestedTokens && e49.nestedTokens.length > 0) {
    let r2 = t2.parseChildren(e49.nestedTokens);
    n2.push(...r2);
  }
  return t2.createNode("taskItem", { checked: e49.checked || !1 }, n2);
}, renderMarkdown: (e49, t2) => ad(e49, t2, `- [${e49.attrs?.checked ? "x" : " "}] `), addExtensions() {
  return this.options.nested ? [Bg(this.name, [this.options.taskListTypeName])] : [];
}, addKeyboardShortcuts() {
  let e49 = { Enter: () => this.editor.commands.splitListItem(this.name), "Shift-Tab": () => this.editor.commands.liftListItem(this.name) };
  return this.options.nested ? { ...e49, Tab: () => this.editor.commands.sinkListItem(this.name) } : e49;
}, addNodeView() {
  return ({ node: e49, HTMLAttributes: t2, getPos: n2, editor: r2 }) => {
    let i2 = document.createElement("li"), a2 = document.createElement("label"), o2 = document.createElement("span"), s2 = document.createElement("input"), c2 = document.createElement("div"), l2 = (e50) => {
      var t3;
      s2.ariaLabel = (t3 = this.options.a11y)?.checkboxLabel?.call(t3, e50, s2.checked) || `Task item checkbox for ${e50.textContent || "empty task item"}`;
    };
    l2(e49), a2.contentEditable = "false", s2.type = "checkbox", s2.addEventListener("mousedown", (e50) => e50.preventDefault()), s2.addEventListener("change", (t3) => {
      if (!r2.isEditable && !this.options.onReadOnlyChecked) {
        s2.checked = !s2.checked;
        return;
      }
      let { checked: i3 } = t3.target;
      r2.isEditable && typeof n2 == "function" && r2.chain().focus(void 0, { scrollIntoView: !1 }).command(({ tr: e50 }) => {
        let t4 = n2();
        if (typeof t4 != "number") return !1;
        let r3 = e50.doc.nodeAt(t4);
        return e50.setNodeMarkup(t4, void 0, { ...r3?.attrs, checked: i3 }), !0;
      }).run(), !r2.isEditable && this.options.onReadOnlyChecked && (this.options.onReadOnlyChecked(e49, i3) || (s2.checked = !s2.checked));
    }), Object.entries(this.options.HTMLAttributes).forEach(([e50, t3]) => {
      i2.setAttribute(e50, t3);
    }), i2.dataset.checked = e49.attrs.checked, s2.checked = e49.attrs.checked, a2.append(s2, o2), i2.append(a2, c2), Object.entries(t2).forEach(([e50, t3]) => {
      i2.setAttribute(e50, t3);
    });
    let u2 = new Set(Object.keys(t2));
    return { dom: i2, contentDOM: c2, update: (e50) => {
      if (e50.type !== this.type) return !1;
      i2.dataset.checked = e50.attrs.checked, s2.checked = e50.attrs.checked, l2(e50);
      let t3 = r2.extensionManager.attributes, n3 = Rl(e50, t3), a3 = new Set(Object.keys(n3)), o3 = this.options.HTMLAttributes;
      return u2.forEach((e51) => {
        a3.has(e51) || (e51 in o3 ? i2.setAttribute(e51, o3[e51]) : i2.removeAttribute(e51));
      }), Object.entries(n3).forEach(([e51, t4]) => {
        t4 == null ? e51 in o3 ? i2.setAttribute(e51, o3[e51]) : i2.removeAttribute(e51) : i2.setAttribute(e51, t4);
      }), u2 = a3, !0;
    } };
  };
}, addInputRules() {
  return [Rd({ find: P_, type: this.type, getAttributes: (e49) => ({ checked: e49[e49.length - 1] === "x" }) })];
} });
var I_ = q.create({ name: "taskList", addOptions() {
  return { itemTypeName: "taskItem", HTMLAttributes: {} };
}, group: "block list", content() {
  return `${this.options.itemTypeName}+`;
}, parseHTML() {
  return [{ tag: `ul[data-type="${this.name}"]`, priority: 51 }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["ul", G(this.options.HTMLAttributes, e49, { "data-type": this.name }), 0];
}, parseMarkdown: (e49, t2) => t2.createNode("taskList", {}, t2.parseChildren(e49.items || [])), renderMarkdown: (e49, t2) => e49.content ? t2.renderChildren(e49.content, `
`) : "", markdownTokenizer: { name: "taskList", level: "block", start(e49) {
  let t2 = e49.match(/^\s*[-+*]\s+\[([ xX])\]\s+/)?.index;
  return t2 === void 0 ? -1 : t2;
}, tokenize(e49, t2, n2) {
  let r2 = (e50) => {
    let t3 = id(e50, { itemPattern: /^(\s*)([-+*])\s+\[([ xX])\]\s+(.*)$/, extractItemData: (e51) => ({ indentLevel: e51[1].length, mainContent: e51[4], checked: e51[3].toLowerCase() === "x" }), createToken: (e51, t4) => ({ type: "taskItem", raw: "", mainContent: e51.mainContent, indentLevel: e51.indentLevel, checked: e51.checked, text: e51.mainContent, tokens: n2.inlineTokens(e51.mainContent), nestedTokens: t4 }), customNestedParser: r2 }, n2);
    if (t3) {
      let r3 = { type: "taskList", raw: t3.raw, items: t3.items }, i3 = e50.slice(t3.raw.length);
      return i3.trim() ? [r3, ...n2.blockTokens(i3)] : [r3];
    }
    return n2.blockTokens(e50);
  }, i2 = id(e49, { itemPattern: /^(\s*)([-+*])\s+\[([ xX])\]\s+(.*)$/, extractItemData: (e50) => ({ indentLevel: e50[1].length, mainContent: e50[4], checked: e50[3].toLowerCase() === "x" }), createToken: (e50, t3) => ({ type: "taskItem", raw: "", mainContent: e50.mainContent, indentLevel: e50.indentLevel, checked: e50.checked, text: e50.mainContent, tokens: n2.inlineTokens(e50.mainContent), nestedTokens: t3 }), customNestedParser: r2 }, n2);
  if (i2) return { type: "taskList", raw: i2.raw, items: i2.items };
} }, markdownOptions: { indentsContent: !0 }, addCommands() {
  return { toggleTaskList: () => ({ commands: e49 }) => e49.toggleList(this.name, this.options.itemTypeName) };
}, addKeyboardShortcuts() {
  return { "Mod-Shift-9": () => this.editor.commands.toggleTaskList() };
} });
K.create({ name: "listKit", addExtensions() {
  let e49 = [];
  return this.options.bulletList !== !1 && e49.push(Ig.configure(this.options.bulletList)), this.options.listItem !== !1 && e49.push(a_.configure(this.options.listItem)), this.options.listKeymap !== !1 && e49.push(g_.configure(this.options.listKeymap)), this.options.orderedList !== !1 && e49.push(N_.configure(this.options.orderedList)), this.options.taskItem !== !1 && e49.push(F_.configure(this.options.taskItem)), this.options.taskList !== !1 && e49.push(I_.configure(this.options.taskList)), e49;
} });
var L_ = "&nbsp;";
var R_ = "\xA0";
var z_ = q.create({ name: "paragraph", priority: 1e3, addOptions() {
  return { HTMLAttributes: {} };
}, group: "block", content: "inline*", parseHTML() {
  return [{ tag: "p" }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["p", G(this.options.HTMLAttributes, e49), 0];
}, parseMarkdown: (e49, t2) => {
  let n2 = e49.tokens || [];
  if (n2.length === 1 && n2[0].type === "image") return t2.parseChildren([n2[0]]);
  let r2 = t2.parseInline(n2);
  return n2.length === 1 && n2[0].type === "text" && (n2[0].raw === L_ || n2[0].text === L_ || n2[0].raw === R_ || n2[0].text === R_) && r2.length === 1 && r2[0].type === "text" && (r2[0].text === L_ || r2[0].text === R_) ? t2.createNode("paragraph", void 0, []) : t2.createNode("paragraph", void 0, r2);
}, renderMarkdown: (e49, t2, n2) => {
  if (!e49) return "";
  let r2 = Array.isArray(e49.content) ? e49.content : [];
  if (r2.length === 0) {
    let e50 = Array.isArray(n2?.previousNode?.content) ? n2.previousNode.content : [];
    return n2?.previousNode?.type === "paragraph" && e50.length === 0 ? L_ : "";
  }
  return t2.renderChildren(r2);
}, addCommands() {
  return { setParagraph: () => ({ commands: e49 }) => e49.setNode(this.name) };
}, addKeyboardShortcuts() {
  return { "Mod-Alt-0": () => this.editor.commands.setParagraph() };
} });
var B_ = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))$/;
var V_ = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))/g;
var H_ = pd.create({ name: "strike", addOptions() {
  return { HTMLAttributes: {} };
}, parseHTML() {
  return [{ tag: "s" }, { tag: "del" }, { tag: "strike" }, { style: "text-decoration", consuming: !1, getAttrs: (e49) => e49.includes("line-through") ? {} : !1 }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["s", G(this.options.HTMLAttributes, e49), 0];
}, markdownTokenName: "del", parseMarkdown: (e49, t2) => t2.applyMark("strike", t2.parseInline(e49.tokens || [])), renderMarkdown: (e49, t2) => `~~${t2.renderChildren(e49)}~~`, addCommands() {
  return { setStrike: () => ({ commands: e49 }) => e49.setMark(this.name), toggleStrike: () => ({ commands: e49 }) => e49.toggleMark(this.name), unsetStrike: () => ({ commands: e49 }) => e49.unsetMark(this.name) };
}, addKeyboardShortcuts() {
  return { "Mod-Shift-s": () => this.editor.commands.toggleStrike() };
}, addInputRules() {
  return [Fd({ find: B_, type: this.type })];
}, addPasteRules() {
  return [zd({ find: V_, type: this.type })];
} });
var U_ = q.create({ name: "text", group: "inline", parseMarkdown: (e49) => ({ type: "text", text: e49.text || "" }), renderMarkdown: (e49) => e49.text || "" });
var W_ = pd.create({ name: "underline", addOptions() {
  return { HTMLAttributes: {} };
}, parseHTML() {
  return [{ tag: "u" }, { style: "text-decoration", consuming: !1, getAttrs: (e49) => e49.includes("underline") ? {} : !1 }];
}, renderHTML({ HTMLAttributes: e49 }) {
  return ["u", G(this.options.HTMLAttributes, e49), 0];
}, parseMarkdown(e49, t2) {
  return t2.applyMark(this.name || "underline", t2.parseInline(e49.tokens || []));
}, renderMarkdown(e49, t2) {
  return `++${t2.renderChildren(e49)}++`;
}, markdownTokenizer: { name: "underline", level: "inline", start(e49) {
  return e49.indexOf("++");
}, tokenize(e49, t2, n2) {
  let r2 = /^(\+\+)([\s\S]+?)(\+\+)/.exec(e49);
  if (!r2) return;
  let i2 = r2[2].trim();
  return { type: "underline", raw: r2[0], text: i2, tokens: n2.inlineTokens(i2) };
} }, addCommands() {
  return { setUnderline: () => ({ commands: e49 }) => e49.setMark(this.name), toggleUnderline: () => ({ commands: e49 }) => e49.toggleMark(this.name), unsetUnderline: () => ({ commands: e49 }) => e49.unsetMark(this.name) };
}, addKeyboardShortcuts() {
  return { "Mod-u": () => this.editor.commands.toggleUnderline(), "Mod-U": () => this.editor.commands.toggleUnderline() };
} });
function G_(e49 = {}) {
  return new M({ view(t2) {
    return new K_(t2, e49);
  } });
}
var K_ = class {
  constructor(e49, t2) {
    this.editorView = e49, this.cursorPos = null, this.element = null, this.timeout = -1, this.lastDragEvent = null, this.width = t2.width ?? 1, this.color = t2.color === !1 ? void 0 : t2.color || "black", this.class = t2.class, this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((t3) => {
      let n2 = (e50) => {
        this[t3](e50);
      };
      return e49.dom.addEventListener(t3, n2), { name: t3, handler: n2 };
    });
  }
  destroy() {
    this.handlers.forEach(({ name: e49, handler: t2 }) => this.editorView.dom.removeEventListener(e49, t2));
  }
  update(e49, t2) {
    if (this.cursorPos != null && t2.doc != e49.state.doc)
      if (this.lastDragEvent) {
        let e50 = this.computeTarget(this.lastDragEvent);
        e50 == this.cursorPos ? this.updateOverlay() : this.setCursor(e50);
      } else this.updateOverlay();
  }
  setCursor(e49) {
    e49 != this.cursorPos && (this.cursorPos = e49, e49 == null ? (this.element.parentNode.removeChild(this.element), this.element = null) : this.updateOverlay());
  }
  updateOverlay() {
    let e49 = this.editorView.state.doc.resolve(this.cursorPos), t2 = !e49.parent.inlineContent, n2, r2 = this.editorView.dom, i2 = r2.getBoundingClientRect(), a2 = i2.width / r2.offsetWidth, o2 = i2.height / r2.offsetHeight;
    if (t2) {
      let t3 = e49.nodeBefore, r3 = e49.nodeAfter;
      if (t3 || r3) {
        let e50 = this.editorView.nodeDOM(this.cursorPos - (t3 ? t3.nodeSize : 0));
        if (e50) {
          let i3 = e50.getBoundingClientRect(), a3 = t3 ? i3.bottom : i3.top;
          t3 && r3 && (a3 = (a3 + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2);
          let s3 = this.width / 2 * o2;
          n2 = { left: i3.left, right: i3.right, top: a3 - s3, bottom: a3 + s3 };
        }
      }
    }
    if (!n2) {
      let e50 = this.editorView.coordsAtPos(this.cursorPos), t3 = this.width / 2 * a2;
      n2 = { left: e50.left - t3, right: e50.left + t3, top: e50.top, bottom: e50.bottom };
    }
    let s2 = this.editorView.dom.offsetParent;
    this.element || (this.element = s2.appendChild(document.createElement("div")), this.class && (this.element.className = this.class), this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none;", this.color && (this.element.style.backgroundColor = this.color)), this.element.classList.toggle("prosemirror-dropcursor-block", t2), this.element.classList.toggle("prosemirror-dropcursor-inline", !t2);
    let c2, l2;
    if (!s2 || s2 == document.body && getComputedStyle(s2).position == "static") c2 = -pageXOffset, l2 = -pageYOffset;
    else {
      let e50 = s2.getBoundingClientRect(), t3 = e50.width / s2.offsetWidth, n3 = e50.height / s2.offsetHeight;
      c2 = e50.left - s2.scrollLeft * t3, l2 = e50.top - s2.scrollTop * n3;
    }
    this.element.style.left = (n2.left - c2) / a2 + "px", this.element.style.top = (n2.top - l2) / o2 + "px", this.element.style.width = (n2.right - n2.left) / a2 + "px", this.element.style.height = (n2.bottom - n2.top) / o2 + "px";
  }
  scheduleRemoval(e49) {
    clearTimeout(this.timeout), this.timeout = setTimeout(() => this.setCursor(null), e49);
  }
  computeTarget(e49) {
    let t2 = this.editorView.posAtCoords({ left: e49.clientX, top: e49.clientY }), n2 = t2 && t2.inside >= 0 && this.editorView.state.doc.nodeAt(t2.inside), r2 = n2 && n2.type.spec.disableDropCursor, i2 = typeof r2 == "function" ? r2(this.editorView, t2, e49) : r2;
    if (!t2 || i2) return null;
    let a2 = t2.pos;
    if (this.editorView.dragging && this.editorView.dragging.slice) {
      let e50 = an(this.editorView.state.doc, a2, this.editorView.dragging.slice);
      e50 != null && (a2 = e50);
    }
    return a2;
  }
  dragover(e49) {
    if (!this.editorView.editable) return;
    this.lastDragEvent = e49;
    let t2 = this.computeTarget(e49);
    t2 != null && (this.setCursor(t2), this.scheduleRemoval(5e3));
  }
  dragend() {
    this.scheduleRemoval(20);
  }
  drop() {
    this.scheduleRemoval(20);
  }
  dragleave(e49) {
    this.editorView.dom.contains(e49.relatedTarget) || this.setCursor(null);
  }
};
var q_ = class e45 extends k {
  constructor(e49) {
    super(e49, e49);
  }
  map(t2, n2) {
    let r2 = t2.resolve(n2.map(this.head));
    return e45.valid(r2) ? new e45(r2) : k.near(r2);
  }
  content() {
    return T.empty;
  }
  eq(t2) {
    return t2 instanceof e45 && t2.head == this.head;
  }
  toJSON() {
    return { type: "gapcursor", pos: this.head };
  }
  static fromJSON(t2, n2) {
    if (typeof n2.pos != "number") throw RangeError("Invalid input for GapCursor.fromJSON");
    return new e45(t2.resolve(n2.pos));
  }
  getBookmark() {
    return new J_(this.anchor);
  }
  static valid(e49) {
    let t2 = e49.parent;
    if (t2.inlineContent || !X_(e49) || !Z_(e49)) return !1;
    let n2 = t2.type.spec.allowGapCursor;
    if (n2 != null) return n2;
    let r2 = t2.contentMatchAt(e49.index()).defaultType;
    return r2 && r2.isTextblock;
  }
  static findGapCursorFrom(t2, n2, r2 = !1) {
    search: for (; ; ) {
      if (!r2 && e45.valid(t2)) return t2;
      let i2 = t2.pos, a2 = null;
      for (let r3 = t2.depth; ; r3--) {
        let o2 = t2.node(r3);
        if (n2 > 0 ? t2.indexAfter(r3) < o2.childCount : t2.index(r3) > 0) {
          a2 = o2.child(n2 > 0 ? t2.indexAfter(r3) : t2.index(r3) - 1);
          break;
        }
        if (r3 == 0) return null;
        i2 += n2;
        let s2 = t2.doc.resolve(i2);
        if (e45.valid(s2)) return s2;
      }
      for (; ; ) {
        let o2 = n2 > 0 ? a2.firstChild : a2.lastChild;
        if (!o2) {
          if (a2.isAtom && !a2.isText && !j.isSelectable(a2)) {
            t2 = t2.doc.resolve(i2 + a2.nodeSize * n2), r2 = !1;
            continue search;
          }
          break;
        }
        a2 = o2, i2 += n2;
        let s2 = t2.doc.resolve(i2);
        if (e45.valid(s2)) return s2;
      }
      return null;
    }
  }
};
(q_.prototype.visible = !1);
(q_.findFrom = q_.findGapCursorFrom);
(k.jsonID("gapcursor", q_));
var J_ = class e46 {
  constructor(e49) {
    this.pos = e49;
  }
  map(t2) {
    return new e46(t2.map(this.pos));
  }
  resolve(e49) {
    let t2 = e49.resolve(this.pos);
    return q_.valid(t2) ? new q_(t2) : k.near(t2);
  }
};
function Y_(e49) {
  return e49.isAtom || e49.spec.isolating || e49.spec.createGapCursor;
}
function X_(e49) {
  for (let t2 = e49.depth; t2 >= 0; t2--) {
    let n2 = e49.index(t2), r2 = e49.node(t2);
    if (n2 == 0) {
      if (r2.type.spec.isolating) return !0;
    } else for (let e50 = r2.child(n2 - 1); ; e50 = e50.lastChild) {
      if (e50.childCount == 0 && !e50.inlineContent || Y_(e50.type)) return !0;
      if (e50.inlineContent) return !1;
    }
  }
  return !0;
}
function Z_(e49) {
  for (let t2 = e49.depth; t2 >= 0; t2--) {
    let n2 = e49.indexAfter(t2), r2 = e49.node(t2);
    if (n2 == r2.childCount) {
      if (r2.type.spec.isolating) return !0;
    } else for (let e50 = r2.child(n2); ; e50 = e50.firstChild) {
      if (e50.childCount == 0 && !e50.inlineContent || Y_(e50.type)) return !0;
      if (e50.inlineContent) return !1;
    }
  }
  return !0;
}
function Q_() {
  return new M({ props: { decorations: rv, createSelectionBetween(e49, t2, n2) {
    return t2.pos == n2.pos && q_.valid(n2) ? new q_(n2) : null;
  }, handleClick: tv, handleKeyDown: $_, handleDOMEvents: { beforeinput: nv } } });
}
var $_ = oc({ ArrowLeft: ev("horiz", -1), ArrowRight: ev("horiz", 1), ArrowUp: ev("vert", -1), ArrowDown: ev("vert", 1) });
function ev(e49, t2) {
  let n2 = e49 == "vert" ? t2 > 0 ? "down" : "up" : t2 > 0 ? "right" : "left";
  return function(e50, r2, i2) {
    let a2 = e50.selection, o2 = t2 > 0 ? a2.$to : a2.$from, s2 = a2.empty;
    if (a2 instanceof A) {
      if (!i2.endOfTextblock(n2) || o2.depth == 0) return !1;
      s2 = !1, o2 = e50.doc.resolve(t2 > 0 ? o2.after() : o2.before());
    }
    let c2 = q_.findGapCursorFrom(o2, t2, s2);
    return c2 ? (r2 && r2(e50.tr.setSelection(new q_(c2))), !0) : !1;
  };
}
function tv(e49, t2, n2) {
  if (!e49 || !e49.editable) return !1;
  let r2 = e49.state.doc.resolve(t2);
  if (!q_.valid(r2)) return !1;
  let i2 = e49.posAtCoords({ left: n2.clientX, top: n2.clientY });
  return i2 && i2.inside > -1 && j.isSelectable(e49.state.doc.nodeAt(i2.inside)) ? !1 : (e49.dispatch(e49.state.tr.setSelection(new q_(r2))), !0);
}
function nv(e49, t2) {
  if (t2.inputType != "insertCompositionText" || !(e49.state.selection instanceof q_)) return !1;
  let { $from: n2 } = e49.state.selection, r2 = n2.parent.contentMatchAt(n2.index()).findWrapping(e49.state.schema.nodes.text);
  if (!r2) return !1;
  let i2 = y.empty;
  for (let e50 = r2.length - 1; e50 >= 0; e50--) i2 = y.from(r2[e50].createAndFill(null, i2));
  let a2 = e49.state.tr.replace(n2.pos, n2.pos, new T(i2, 0, 0));
  return a2.setSelection(A.near(a2.doc.resolve(n2.pos + 1))), e49.dispatch(a2), !1;
}
function rv(e49) {
  if (!(e49.selection instanceof q_)) return null;
  let t2 = document.createElement("div");
  return t2.className = "ProseMirror-gapcursor", B.create(e49.doc, [fs.widget(e49.selection.head, t2, { key: "gapcursor" })]);
}
var iv = 200;
var $ = function() {
};
($.prototype.append = function(e49) {
  return e49.length ? (e49 = $.from(e49), !this.length && e49 || e49.length < iv && this.leafAppend(e49) || this.length < iv && e49.leafPrepend(this) || this.appendInner(e49)) : this;
});
($.prototype.prepend = function(e49) {
  return e49.length ? $.from(e49).append(this) : this;
});
($.prototype.appendInner = function(e49) {
  return new ov(this, e49);
});
($.prototype.slice = function(e49, t2) {
  return e49 === void 0 && (e49 = 0), t2 === void 0 && (t2 = this.length), e49 >= t2 ? $.empty : this.sliceInner(Math.max(0, e49), Math.min(this.length, t2));
});
($.prototype.get = function(e49) {
  if (!(e49 < 0 || e49 >= this.length)) return this.getInner(e49);
});
($.prototype.forEach = function(e49, t2, n2) {
  t2 === void 0 && (t2 = 0), n2 === void 0 && (n2 = this.length), t2 <= n2 ? this.forEachInner(e49, t2, n2, 0) : this.forEachInvertedInner(e49, t2, n2, 0);
});
($.prototype.map = function(e49, t2, n2) {
  t2 === void 0 && (t2 = 0), n2 === void 0 && (n2 = this.length);
  var r2 = [];
  return this.forEach(function(t3, n3) {
    return r2.push(e49(t3, n3));
  }, t2, n2), r2;
});
($.from = function(e49) {
  return e49 instanceof $ ? e49 : e49 && e49.length ? new av(e49) : $.empty;
});
var av = (function(e49) {
  function t2(t3) {
    e49.call(this), this.values = t3;
  }
  e49 && (t2.__proto__ = e49), t2.prototype = Object.create(e49 && e49.prototype), t2.prototype.constructor = t2;
  var n2 = { length: { configurable: !0 }, depth: { configurable: !0 } };
  return t2.prototype.flatten = function() {
    return this.values;
  }, t2.prototype.sliceInner = function(e50, n3) {
    return e50 == 0 && n3 == this.length ? this : new t2(this.values.slice(e50, n3));
  }, t2.prototype.getInner = function(e50) {
    return this.values[e50];
  }, t2.prototype.forEachInner = function(e50, t3, n3, r2) {
    for (var i2 = t3; i2 < n3; i2++) if (e50(this.values[i2], r2 + i2) === !1) return !1;
  }, t2.prototype.forEachInvertedInner = function(e50, t3, n3, r2) {
    for (var i2 = t3 - 1; i2 >= n3; i2--) if (e50(this.values[i2], r2 + i2) === !1) return !1;
  }, t2.prototype.leafAppend = function(e50) {
    if (this.length + e50.length <= iv) return new t2(this.values.concat(e50.flatten()));
  }, t2.prototype.leafPrepend = function(e50) {
    if (this.length + e50.length <= iv) return new t2(e50.flatten().concat(this.values));
  }, n2.length.get = function() {
    return this.values.length;
  }, n2.depth.get = function() {
    return 0;
  }, Object.defineProperties(t2.prototype, n2), t2;
})($);
$.empty = new av([]);
var ov = (function(e49) {
  function t2(t3, n2) {
    e49.call(this), this.left = t3, this.right = n2, this.length = t3.length + n2.length, this.depth = Math.max(t3.depth, n2.depth) + 1;
  }
  return e49 && (t2.__proto__ = e49), t2.prototype = Object.create(e49 && e49.prototype), t2.prototype.constructor = t2, t2.prototype.flatten = function() {
    return this.left.flatten().concat(this.right.flatten());
  }, t2.prototype.getInner = function(e50) {
    return e50 < this.left.length ? this.left.get(e50) : this.right.get(e50 - this.left.length);
  }, t2.prototype.forEachInner = function(e50, t3, n2, r2) {
    var i2 = this.left.length;
    if (t3 < i2 && this.left.forEachInner(e50, t3, Math.min(n2, i2), r2) === !1 || n2 > i2 && this.right.forEachInner(e50, Math.max(t3 - i2, 0), Math.min(this.length, n2) - i2, r2 + i2) === !1) return !1;
  }, t2.prototype.forEachInvertedInner = function(e50, t3, n2, r2) {
    var i2 = this.left.length;
    if (t3 > i2 && this.right.forEachInvertedInner(e50, t3 - i2, Math.max(n2, i2) - i2, r2 + i2) === !1 || n2 < i2 && this.left.forEachInvertedInner(e50, Math.min(t3, i2), n2, r2) === !1) return !1;
  }, t2.prototype.sliceInner = function(e50, t3) {
    if (e50 == 0 && t3 == this.length) return this;
    var n2 = this.left.length;
    return t3 <= n2 ? this.left.slice(e50, t3) : e50 >= n2 ? this.right.slice(e50 - n2, t3 - n2) : this.left.slice(e50, n2).append(this.right.slice(0, t3 - n2));
  }, t2.prototype.leafAppend = function(e50) {
    var n2 = this.right.leafAppend(e50);
    if (n2) return new t2(this.left, n2);
  }, t2.prototype.leafPrepend = function(e50) {
    var n2 = this.left.leafPrepend(e50);
    if (n2) return new t2(n2, this.right);
  }, t2.prototype.appendInner = function(e50) {
    return this.left.depth >= Math.max(this.right.depth, e50.depth) + 1 ? new t2(this.left, new t2(this.right, e50)) : new t2(this, e50);
  }, t2;
})($);
var sv = 500;
var cv = class e47 {
  constructor(e49, t2) {
    this.items = e49, this.eventCount = t2;
  }
  popEvent(t2, n2) {
    if (this.eventCount == 0) return null;
    let r2 = this.items.length;
    for (; ; r2--) if (this.items.get(r2 - 1).selection) {
      --r2;
      break;
    }
    let i2, a2;
    n2 && (i2 = this.remapping(r2, this.items.length), a2 = i2.maps.length);
    let o2 = t2.tr, s2, c2, l2 = [], u2 = [];
    return this.items.forEach((t3, n3) => {
      if (!t3.step) i2 || (i2 = this.remapping(r2, n3 + 1), a2 = i2.maps.length), a2--, u2.push(t3);
      else {
        if (i2) {
          u2.push(new uv(t3.map));
          let e49 = t3.step.map(i2.slice(a2)), n4;
          e49 && o2.maybeStep(e49).doc && (n4 = o2.mapping.maps[o2.mapping.maps.length - 1], l2.push(new uv(n4, void 0, void 0, l2.length + u2.length))), a2--, n4 && i2.appendMap(n4, a2);
        } else o2.maybeStep(t3.step);
        if (t3.selection) return s2 = i2 ? t3.selection.map(i2.slice(a2)) : t3.selection, c2 = new e47(this.items.slice(0, r2).append(u2.reverse().concat(l2)), this.eventCount - 1), !1;
      }
    }, this.items.length, 0), { remaining: c2, transform: o2, selection: s2 };
  }
  addTransform(t2, n2, r2, i2) {
    let a2 = [], o2 = this.eventCount, s2 = this.items, c2 = !i2 && s2.length ? s2.get(s2.length - 1) : null;
    for (let e49 = 0; e49 < t2.steps.length; e49++) {
      let r3 = t2.steps[e49].invert(t2.docs[e49]), l3 = new uv(t2.mapping.maps[e49], r3, n2), u2;
      (u2 = c2 && c2.merge(l3)) && (l3 = u2, e49 ? a2.pop() : s2 = s2.slice(0, s2.length - 1)), a2.push(l3), n2 &&= (o2++, void 0), i2 || (c2 = l3);
    }
    let l2 = o2 - r2.depth;
    return l2 > fv && (s2 = lv(s2, l2), o2 -= l2), new e47(s2.append(a2), o2);
  }
  remapping(e49, t2) {
    let n2 = new Tt();
    return this.items.forEach((t3, r2) => {
      let i2 = t3.mirrorOffset != null && r2 - t3.mirrorOffset >= e49 ? n2.maps.length - t3.mirrorOffset : void 0;
      n2.appendMap(t3.map, i2);
    }, e49, t2), n2;
  }
  addMaps(t2) {
    return this.eventCount == 0 ? this : new e47(this.items.append(t2.map((e49) => new uv(e49))), this.eventCount);
  }
  rebased(t2, n2) {
    if (!this.eventCount) return this;
    let r2 = [], i2 = Math.max(0, this.items.length - n2), a2 = t2.mapping, o2 = t2.steps.length, s2 = this.eventCount;
    this.items.forEach((e49) => {
      e49.selection && s2--;
    }, i2);
    let c2 = n2;
    this.items.forEach((e49) => {
      let n3 = a2.getMirror(--c2);
      if (n3 == null) return;
      o2 = Math.min(o2, n3);
      let i3 = a2.maps[n3];
      if (e49.step) {
        let o3 = t2.steps[n3].invert(t2.docs[n3]), l3 = e49.selection && e49.selection.map(a2.slice(c2 + 1, n3));
        l3 && s2++, r2.push(new uv(i3, o3, l3));
      } else r2.push(new uv(i3));
    }, i2);
    let l2 = [];
    for (let e49 = n2; e49 < o2; e49++) l2.push(new uv(a2.maps[e49]));
    let u2 = this.items.slice(0, i2).append(l2).append(r2), d2 = new e47(u2, s2);
    return d2.emptyItemCount() > sv && (d2 = d2.compress(this.items.length - r2.length)), d2;
  }
  emptyItemCount() {
    let e49 = 0;
    return this.items.forEach((t2) => {
      t2.step || e49++;
    }), e49;
  }
  compress(t2 = this.items.length) {
    let n2 = this.remapping(0, t2), r2 = n2.maps.length, i2 = [], a2 = 0;
    return this.items.forEach((e49, o2) => {
      if (o2 >= t2) i2.push(e49), e49.selection && a2++;
      else if (e49.step) {
        let t3 = e49.step.map(n2.slice(r2)), o3 = t3 && t3.getMap();
        if (r2--, o3 && n2.appendMap(o3, r2), t3) {
          let s2 = e49.selection && e49.selection.map(n2.slice(r2));
          s2 && a2++;
          let c2 = new uv(o3.invert(), t3, s2), l2, u2 = i2.length - 1;
          (l2 = i2.length && i2[u2].merge(c2)) ? i2[u2] = l2 : i2.push(c2);
        }
      } else e49.map && r2--;
    }, this.items.length, 0), new e47($.from(i2.reverse()), a2);
  }
};
cv.empty = new cv($.empty, 0);
function lv(e49, t2) {
  let n2;
  return e49.forEach((e50, r2) => {
    if (e50.selection && t2-- == 0) return n2 = r2, !1;
  }), e49.slice(n2);
}
var uv = class e48 {
  constructor(e49, t2, n2, r2) {
    this.map = e49, this.step = t2, this.selection = n2, this.mirrorOffset = r2;
  }
  merge(t2) {
    if (this.step && t2.step && !t2.selection) {
      let n2 = t2.step.merge(this.step);
      if (n2) return new e48(n2.getMap().invert(), n2, this.selection);
    }
  }
};
var dv = class {
  constructor(e49, t2, n2, r2, i2) {
    this.done = e49, this.undone = t2, this.prevRanges = n2, this.prevTime = r2, this.prevComposition = i2;
  }
};
var fv = 20;
function pv(e49, t2, n2, r2) {
  let i2 = n2.getMeta(xv), a2;
  if (i2) return i2.historyState;
  n2.getMeta(Sv) && (e49 = new dv(e49.done, e49.undone, null, 0, -1));
  let o2 = n2.getMeta("appendedTransaction");
  if (n2.steps.length == 0) return e49;
  if (o2 && o2.getMeta(xv)) return o2.getMeta(xv).redo ? new dv(e49.done.addTransform(n2, void 0, r2, bv(t2)), e49.undone, hv(n2.mapping.maps), e49.prevTime, e49.prevComposition) : new dv(e49.done, e49.undone.addTransform(n2, void 0, r2, bv(t2)), null, e49.prevTime, e49.prevComposition);
  if (n2.getMeta("addToHistory") !== !1 && !(o2 && o2.getMeta("addToHistory") === !1)) {
    let i3 = n2.getMeta("composition"), a3 = e49.prevTime == 0 || !o2 && e49.prevComposition != i3 && (e49.prevTime < (n2.time || 0) - r2.newGroupDelay || !mv(n2, e49.prevRanges)), s2 = o2 ? gv(e49.prevRanges, n2.mapping) : hv(n2.mapping.maps);
    return new dv(e49.done.addTransform(n2, a3 ? t2.selection.getBookmark() : void 0, r2, bv(t2)), cv.empty, s2, n2.time, i3 ?? e49.prevComposition);
  }
  return (a2 = n2.getMeta("rebased")) ? new dv(e49.done.rebased(n2, a2), e49.undone.rebased(n2, a2), gv(e49.prevRanges, n2.mapping), e49.prevTime, e49.prevComposition) : new dv(e49.done.addMaps(n2.mapping.maps), e49.undone.addMaps(n2.mapping.maps), gv(e49.prevRanges, n2.mapping), e49.prevTime, e49.prevComposition);
}
function mv(e49, t2) {
  if (!t2) return !1;
  if (!e49.docChanged) return !0;
  let n2 = !1;
  return e49.mapping.maps[0].forEach((e50, r2) => {
    for (let i2 = 0; i2 < t2.length; i2 += 2) e50 <= t2[i2 + 1] && r2 >= t2[i2] && (n2 = !0);
  }), n2;
}
function hv(e49) {
  let t2 = [];
  for (let n2 = e49.length - 1; n2 >= 0 && t2.length == 0; n2--) e49[n2].forEach((e50, n3, r2, i2) => t2.push(r2, i2));
  return t2;
}
function gv(e49, t2) {
  if (!e49) return null;
  let n2 = [];
  for (let r2 = 0; r2 < e49.length; r2 += 2) {
    let i2 = t2.map(e49[r2], 1), a2 = t2.map(e49[r2 + 1], -1);
    i2 <= a2 && n2.push(i2, a2);
  }
  return n2;
}
function _v(e49, t2, n2) {
  let r2 = bv(t2), i2 = xv.get(t2).spec.config, a2 = (n2 ? e49.undone : e49.done).popEvent(t2, r2);
  if (!a2) return null;
  let o2 = a2.selection.resolve(a2.transform.doc), s2 = (n2 ? e49.done : e49.undone).addTransform(a2.transform, t2.selection.getBookmark(), i2, r2), c2 = new dv(n2 ? s2 : a2.remaining, n2 ? a2.remaining : s2, null, 0, -1);
  return a2.transform.setSelection(o2).setMeta(xv, { redo: n2, historyState: c2 });
}
var vv = !1;
var yv = null;
function bv(e49) {
  let t2 = e49.plugins;
  if (yv != t2) {
    vv = !1, yv = t2;
    for (let e50 = 0; e50 < t2.length; e50++) if (t2[e50].spec.historyPreserveItems) {
      vv = !0;
      break;
    }
  }
  return vv;
}
var xv = new N("history");
var Sv = new N("closeHistory");
function Cv(e49 = {}) {
  return e49 = { depth: e49.depth || 100, newGroupDelay: e49.newGroupDelay || 500 }, new M({ key: xv, state: { init() {
    return new dv(cv.empty, cv.empty, null, 0, -1);
  }, apply(t2, n2, r2) {
    return pv(n2, r2, t2, e49);
  } }, config: e49, props: { handleDOMEvents: { beforeinput(e50, t2) {
    let n2 = t2.inputType, r2 = n2 == "historyUndo" ? Tv : n2 == "historyRedo" ? Ev : null;
    return !r2 || !e50.editable ? !1 : (t2.preventDefault(), r2(e50.state, e50.dispatch));
  } } } });
}
function wv(e49, t2) {
  return (n2, r2) => {
    let i2 = xv.getState(n2);
    if (!i2 || (e49 ? i2.undone : i2.done).eventCount == 0) return !1;
    if (r2) {
      let a2 = _v(i2, n2, e49);
      a2 && r2(t2 ? a2.scrollIntoView() : a2);
    }
    return !0;
  };
}
var Tv = wv(!1, !0);
var Ev = wv(!0, !0);
K.create({ name: "characterCount", addOptions() {
  return { limit: null, autoTrim: !0, mode: "textSize", textCounter: (e49) => e49.length, wordCounter: (e49) => e49.split(" ").filter((e50) => e50 !== "").length };
}, addStorage() {
  return { characters: () => 0, words: () => 0 };
}, onBeforeCreate() {
  this.storage.characters = (e49) => {
    let t2 = e49?.node || this.editor.state.doc;
    if ((e49?.mode || this.options.mode) === "textSize") {
      let e50 = t2.textBetween(0, t2.content.size, void 0, " ");
      return this.options.textCounter(e50);
    }
    return t2.nodeSize;
  }, this.storage.words = (e49) => {
    let t2 = e49?.node || this.editor.state.doc, n2 = t2.textBetween(0, t2.content.size, " ", " ");
    return this.options.wordCounter(n2);
  };
}, addProseMirrorPlugins() {
  let e49 = !1;
  return [new M({ key: new N("characterCount"), appendTransaction: (t2, n2, r2) => {
    if (e49) return;
    let i2 = this.options.limit, a2 = this.options.autoTrim;
    if (i2 == null || i2 === 0 || a2 === !1) {
      e49 = !0;
      return;
    }
    let o2 = this.storage.characters({ node: r2.doc });
    if (o2 > i2) {
      let t3 = o2 - i2;
      console.warn(`[CharacterCount] Initial content exceeded limit of ${i2} characters. Content was automatically trimmed.`);
      let n3 = r2.tr.deleteRange(0, t3);
      return e49 = !0, n3;
    }
    e49 = !0;
  }, filterTransaction: (e50, t2) => {
    let n2 = this.options.limit;
    if (!e50.docChanged || n2 === 0 || n2 == null) return !0;
    let r2 = this.storage.characters({ node: t2.doc }), i2 = this.storage.characters({ node: e50.doc });
    if (i2 <= n2 || r2 > n2 && i2 > n2 && i2 <= r2) return !0;
    if (r2 > n2 && i2 > n2 && i2 > r2 || !e50.getMeta("paste")) return !1;
    let a2 = e50.selection.$head.pos, o2 = a2 - (i2 - n2), s2 = a2;
    return e50.deleteRange(o2, s2), !(this.storage.characters({ node: e50.doc }) > n2);
  } })];
} });
var Dv = K.create({ name: "dropCursor", addOptions() {
  return { color: "currentColor", width: 1, class: void 0 };
}, addProseMirrorPlugins() {
  return [G_(this.options)];
} });
K.create({ name: "focus", addOptions() {
  return { className: "has-focus", mode: "all" };
}, addProseMirrorPlugins() {
  return [new M({ key: new N("focus"), props: { decorations: ({ doc: e49, selection: t2 }) => {
    let { isEditable: n2, isFocused: r2 } = this.editor, { anchor: i2 } = t2, a2 = [];
    if (!n2 || !r2) return B.create(e49, []);
    let o2 = 0;
    this.options.mode === "deepest" && e49.descendants((e50, t3) => {
      if (!e50.isText) {
        if (!(i2 >= t3 && i2 <= t3 + e50.nodeSize - 1)) return !1;
        o2 += 1;
      }
    });
    let s2 = 0;
    return e49.descendants((e50, t3) => {
      if (e50.isText || !(i2 >= t3 && i2 <= t3 + e50.nodeSize - 1)) return !1;
      if (s2 += 1, this.options.mode === "deepest" && o2 - s2 > 0 || this.options.mode === "shallowest" && s2 > 1) return this.options.mode === "deepest";
      a2.push(fs.node(t3, t3 + e50.nodeSize, { class: this.options.className }));
    }), B.create(e49, a2);
  } } })];
} });
var Ov = K.create({ name: "gapCursor", addProseMirrorPlugins() {
  return [Q_()];
}, extendNodeSchema(e49) {
  return { allowGapCursor: W(U(e49, "allowGapCursor", { name: e49.name, options: e49.options, storage: e49.storage })) ?? null };
} });
var kv = "placeholder";
var Av = new N("tiptap__placeholder");
function jv(e49) {
  let { editor: t2, placeholder: n2, dataAttribute: r2, pos: i2, node: a2, isEmptyDoc: o2, hasAnchor: s2, classes: { emptyNode: c2, emptyEditor: l2 } } = e49, u2 = [c2];
  return o2 && u2.push(l2), fs.node(i2, i2 + a2.nodeSize, { class: u2.join(" "), [r2]: typeof n2 == "function" ? n2({ editor: t2, node: a2, pos: i2, hasAnchor: s2 }) : n2 });
}
function Mv(e49, t2) {
  return typeof e49 == "function" ? e49(t2) : e49;
}
function Nv({ editor: e49, options: t2, dataAttribute: n2, doc: r2, selection: i2, from: a2, to: o2 }) {
  let { anchor: s2 } = i2, c2 = [], l2 = e49.isEmpty;
  return r2.nodesBetween(a2, o2, (r3, i3) => {
    let a3 = s2 >= i3 && s2 <= i3 + r3.nodeSize, o3 = !r3.isLeaf && fu(r3);
    return r3.type.isTextblock && (a3 || !t2.showOnlyCurrent) && o3 && c2.push(jv({ editor: e49, isEmptyDoc: l2, dataAttribute: n2, hasAnchor: a3, placeholder: t2.placeholder, classes: { emptyEditor: t2.emptyEditorClass, emptyNode: Mv(t2.emptyNodeClass, { editor: e49, node: r3, pos: i3, hasAnchor: a3 }) }, node: r3, pos: i3 })), t2.includeChildren;
  }), c2;
}
function Pv({ editor: e49, options: t2, dataAttribute: n2, doc: r2, selection: i2 }) {
  if (!e49.isEditable && t2.showOnlyWhenEditable) return null;
  let { anchor: a2 } = i2, o2 = [], s2 = e49.isEmpty;
  if (t2.showOnlyCurrent && !t2.includeChildren) {
    let i3 = r2.resolve(a2), c2 = i3.depth > 0 ? i3.node(1) : i3.nodeAfter, l2 = i3.depth > 0 ? i3.before(1) : a2;
    if (c2 && c2.type.isTextblock && fu(c2)) {
      let r3 = a2 >= l2 && a2 <= l2 + c2.nodeSize;
      o2.push(jv({ editor: e49, isEmptyDoc: s2, dataAttribute: n2, hasAnchor: r3, placeholder: t2.placeholder, classes: { emptyEditor: t2.emptyEditorClass, emptyNode: Mv(t2.emptyNodeClass, { editor: e49, node: c2, pos: l2, hasAnchor: r3 }) }, node: c2, pos: l2 }));
    }
  } else o2.push(...Nv({ editor: e49, options: t2, dataAttribute: n2, doc: r2, selection: i2, from: 0, to: r2.content.size }));
  return B.create(r2, o2);
}
function Fv(e49, t2) {
  let n2 = e49.resolve(t2);
  if (n2.depth === 0) {
    let e50 = n2.nodeAfter ?? n2.nodeBefore;
    if (!e50) return { from: t2, to: t2 };
    let r3 = n2.nodeAfter ? t2 : t2 - e50.nodeSize;
    return { from: r3, to: r3 + e50.nodeSize };
  }
  let r2 = n2.before(1);
  return { from: r2, to: r2 + n2.node(1).nodeSize };
}
function Iv(e49, t2) {
  return { from: Math.max(0, t2.from - 1), to: Math.min(e49.content.size, t2.to - 1) };
}
function Lv(e49, t2, n2) {
  let r2 = [];
  return e49.forEach((e50, i2) => {
    let a2 = i2, o2 = a2 + e50.nodeSize, s2 = a2 + 1, c2 = o2 + 1;
    s2 < n2 && c2 > t2 && r2.push({ from: a2, to: o2 });
  }), r2;
}
function Rv(e49) {
  if (e49.length === 0) return [];
  let t2 = [...e49].sort((e50, t3) => e50.from - t3.from), n2 = [{ ...t2[0] }];
  for (let e50 = 1; e50 < t2.length; e50 += 1) {
    let r2 = n2[n2.length - 1], i2 = t2[e50];
    i2.from <= r2.to ? r2.to = Math.max(r2.to, i2.to) : n2.push({ ...i2 });
  }
  return n2;
}
function zv(e49, t2) {
  let n2 = Lv(e49, t2.from, t2.to);
  return n2.push(Iv(e49, Fv(e49, t2.from))), t2.to > t2.from ? n2.push(Iv(e49, Fv(e49, Math.min(t2.to, e49.content.size + 1) - 1))) : t2.from < e49.content.size + 1 && n2.push(Iv(e49, Fv(e49, Math.min(t2.from + 1, e49.content.size)))), n2;
}
function Bv(e49, t2, n2) {
  let r2 = [];
  if (e49.docChanged) {
    let t3 = eu(e49);
    for (let e50 of t3) r2.push(...zv(n2.doc, e50.newRange));
  }
  return e49.selectionSet && (r2.push(Iv(n2.doc, Fv(n2.doc, e49.mapping.map(t2.selection.anchor)))), r2.push(Iv(n2.doc, Fv(n2.doc, n2.selection.anchor)))), Rv(r2);
}
function Vv(e49, t2, n2) {
  let r2 = Math.max(0, Math.min(e49, n2.content.size));
  return { from: r2, to: Math.max(r2, Math.min(t2, n2.content.size)) };
}
function Hv({ decorations: e49, ranges: t2, editor: n2, options: r2, dataAttribute: i2, doc: a2, selection: o2 }) {
  let s2 = e49;
  for (let e50 of t2) {
    let { from: t3, to: c2 } = Vv(e50.from, e50.to, a2), l2 = s2.find(t3, c2).filter((e51) => e51.from >= t3 && e51.to <= c2);
    l2.length && (s2 = s2.remove(l2));
    let u2 = Nv({ editor: n2, options: r2, dataAttribute: i2, doc: a2, selection: o2, from: t3, to: c2 });
    u2.length && (s2 = s2.add(a2, u2));
  }
  return s2;
}
function Uv({ editor: e49, options: t2, dataAttribute: n2 }) {
  return { init(r2, i2) {
    return Pv({ editor: e49, options: t2, dataAttribute: n2, doc: i2.doc, selection: i2.selection }) ?? B.empty;
  }, apply(r2, i2, a2, o2) {
    return !r2.docChanged && !r2.selectionSet ? i2 : Hv({ decorations: i2.map(r2.mapping, r2.doc), ranges: Bv(r2, a2, o2), editor: e49, options: t2, dataAttribute: n2, doc: o2.doc, selection: o2.selection });
  } };
}
function Wv(e49) {
  return e49.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/^[0-9-]+/, "").replace(/^-+/, "").toLowerCase();
}
function Gv({ editor: e49, options: t2 }) {
  let n2 = t2.dataAttribute ? `data-${Wv(t2.dataAttribute)}` : `data-${kv}`, r2 = t2.showOnlyCurrent && !t2.includeChildren;
  return new M({ key: Av, ...r2 ? {} : { state: Uv({ editor: e49, options: t2, dataAttribute: n2 }) }, props: { decorations: r2 ? ({ doc: r3, selection: i2 }) => Pv({ editor: e49, options: t2, dataAttribute: n2, doc: r3, selection: i2 }) : (n3) => t2.showOnlyWhenEditable && !e49.isEditable ? B.empty : Av.getState(n3) ?? B.empty } });
}
K.create({ name: "placeholder", addOptions() {
  return { emptyEditorClass: "is-editor-empty", emptyNodeClass: "is-empty", dataAttribute: kv, placeholder: "Write something \u2026", showOnlyWhenEditable: !0, showOnlyCurrent: !0, includeChildren: !1 };
}, addProseMirrorPlugins() {
  return [Gv({ editor: this.editor, options: this.options })];
} });
function Kv(e49, t2) {
  return !e49.selection.empty && !pu(e49.selection) && t2.isEditable;
}
function qv(e49, t2) {
  return Kv(e49, t2) && !t2.isFocused && !t2.view.dragging;
}
function Jv() {
  var e49;
  (e49 = window.getSelection()) == null || e49.removeAllRanges();
}
function Yv(e49) {
  e49.focus();
}
K.create({ name: "selection", addOptions() {
  return { className: "selection" };
}, addProseMirrorPlugins() {
  let { editor: e49, options: t2 } = this;
  return [new M({ key: new N("selection"), props: { decorations(n2) {
    return qv(n2, e49) ? B.create(n2.doc, [fs.inline(n2.selection.from, n2.selection.to, { class: t2.className })]) : null;
  }, handleDOMEvents: { blur(t3) {
    return Kv(t3.state, e49) && Jv(), !1;
  }, focus(t3) {
    return Kv(t3.state, e49) && requestAnimationFrame(() => {
      !e49.isDestroyed && t3.hasFocus() && Yv(t3);
    }), !1;
  } } } })];
} });
function Xv({ types: e49, node: t2 }) {
  return t2 && Array.isArray(e49) && e49.includes(t2.type) || t2?.type === e49;
}
var Zv = K.create({ name: "trailingNode", addOptions() {
  return { node: void 0, notAfter: [] };
}, addProseMirrorPlugins() {
  let e49 = new N(this.name), t2 = this.options.node || this.editor.schema.topNodeType.contentMatch.defaultType?.name || "paragraph", n2 = Object.entries(this.editor.schema.nodes).map(([, e50]) => e50).filter((e50) => (this.options.notAfter || []).concat(t2).includes(e50.name));
  return [new M({ key: e49, appendTransaction: (n3, r2, i2) => {
    let { doc: a2, tr: o2, schema: s2 } = i2, c2 = e49.getState(i2), l2 = a2.content.size, u2 = s2.nodes[t2];
    if (!n3.some((e50) => e50.getMeta("skipTrailingNode")) && c2) return o2.insert(l2, u2.create());
  }, state: { init: (e50, t3) => {
    let r2 = t3.tr.doc.lastChild;
    return !Xv({ node: r2, types: n2 });
  }, apply: (e50, t3) => {
    if (!e50.docChanged || e50.getMeta("__uniqueIDTransaction")) return t3;
    let r2 = e50.doc.lastChild;
    return !Xv({ node: r2, types: n2 });
  } } })];
} });
var Qv = K.create({ name: "undoRedo", addOptions() {
  return { depth: 100, newGroupDelay: 500 };
}, addCommands() {
  return { undo: () => ({ state: e49, dispatch: t2 }) => Tv(e49, t2), redo: () => ({ state: e49, dispatch: t2 }) => Ev(e49, t2) };
}, addProseMirrorPlugins() {
  return [Cv(this.options)];
}, addKeyboardShortcuts() {
  return { "Mod-z": () => this.editor.commands.undo(), "Shift-Mod-z": () => this.editor.commands.redo(), "Mod-y": () => this.editor.commands.redo(), "Mod-\u044F": () => this.editor.commands.undo(), "Shift-Mod-\u044F": () => this.editor.commands.redo() };
} });
var $v = K.create({ name: "starterKit", addExtensions() {
  let e49 = [];
  return this.options.bold !== !1 && e49.push(nm.configure(this.options.bold)), this.options.blockquote !== !1 && e49.push(Zp.configure(this.options.blockquote)), this.options.bulletList !== !1 && e49.push(Ig.configure(this.options.bulletList)), this.options.code !== !1 && e49.push(am.configure(this.options.code)), this.options.codeBlock !== !1 && e49.push(lm.configure(this.options.codeBlock)), this.options.document !== !1 && e49.push(um.configure(this.options.document)), this.options.dropcursor !== !1 && e49.push(Dv.configure(this.options.dropcursor)), this.options.gapcursor !== !1 && e49.push(Ov.configure(this.options.gapcursor)), this.options.hardBreak !== !1 && e49.push(dm.configure(this.options.hardBreak)), this.options.heading !== !1 && e49.push(fm.configure(this.options.heading)), this.options.undoRedo !== !1 && e49.push(Qv.configure(this.options.undoRedo)), this.options.horizontalRule !== !1 && e49.push(pm.configure(this.options.horizontalRule)), this.options.italic !== !1 && e49.push(vm.configure(this.options.italic)), this.options.listItem !== !1 && e49.push(a_.configure(this.options.listItem)), this.options.listKeymap !== !1 && e49.push(g_.configure(this.options?.listKeymap)), this.options.link !== !1 && e49.push(kg.configure(this.options?.link)), this.options.orderedList !== !1 && e49.push(N_.configure(this.options.orderedList)), this.options.paragraph !== !1 && e49.push(z_.configure(this.options.paragraph)), this.options.strike !== !1 && e49.push(H_.configure(this.options.strike)), this.options.text !== !1 && e49.push(U_.configure(this.options.text)), this.options.underline !== !1 && e49.push(W_.configure(this.options?.underline)), this.options.trailingNode !== !1 && e49.push(Zv.configure(this.options?.trailingNode)), e49;
} });
export {Hd as a,q as c,Up as i,G as l,Ag as n,Ud as o,qp as r,K as s,$v as t};
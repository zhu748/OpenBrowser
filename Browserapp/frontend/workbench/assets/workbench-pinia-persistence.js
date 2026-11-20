// pinia-plugin-persistedstate implementation used by workbench stores.
function ht(e2, t2) {
  if (e2 == null) return;
  let n2 = e2;
  for (let e3 = 0; e3 < t2.length; e3++) {
    if (n2 === void 0 || n2[t2[e3]] === void 0) return;
    if (n2 === null || n2[t2[e3]] === null) return null;
    n2 = n2[t2[e3]];
  }
  return n2;
}
function gt(e2, t2, n2) {
  if (n2.length === 0) return t2;
  let r2 = n2[0];
  return n2.length > 1 && (t2 = gt(typeof e2 != "object" || !e2 || !Object.prototype.hasOwnProperty.call(e2, r2) ? Number.isInteger(Number(n2[1])) ? [] : {} : e2[r2], t2, Array.prototype.slice.call(n2, 1))), Number.isInteger(Number(r2)) && Array.isArray(e2) ? e2.slice()[r2] : Object.assign({}, e2, { [r2]: t2 });
}
function _t(e2, t2) {
  if (e2 == null || t2.length === 0) return e2;
  if (t2.length === 1) {
    if (e2 == null) return e2;
    if (Number.isInteger(t2[0]) && Array.isArray(e2)) return Array.prototype.slice.call(e2, 0).splice(t2[0], 1);
    let n2 = {};
    for (let t3 in e2) n2[t3] = e2[t3];
    return delete n2[t2[0]], n2;
  }
  if (e2[t2[0]] == null) {
    if (Number.isInteger(t2[0]) && Array.isArray(e2)) return Array.prototype.concat.call([], e2);
    let n2 = {};
    for (let t3 in e2) n2[t3] = e2[t3];
    return n2;
  }
  return gt(e2, _t(e2[t2[0]], Array.prototype.slice.call(t2, 1)), [t2[0]]);
}
function vt(e2, t2) {
  return t2.map((e3) => e3.split(".")).map((t3) => [t3, ht(e2, t3)]).filter((e3) => e3[1] !== void 0).reduce((e3, t3) => gt(e3, t3[1], t3[0]), {});
}
function yt(e2, t2) {
  return t2.map((e3) => e3.split(".")).reduce((e3, t3) => _t(e3, t3), e2);
}
function bt(e2, { storage: t2, serializer: n2, key: r2, debug: i2, pick: a2, omit: o2, beforeHydrate: s2, afterHydrate: c2 }, l2, u2 = !0) {
  try {
    u2 && s2?.(l2);
    let i3 = t2.getItem(r2);
    if (i3) {
      let t3 = n2.deserialize(i3), r3 = a2 ? vt(t3, a2) : t3, s3 = o2 ? yt(r3, o2) : r3;
      e2.$patch(s3);
    }
    u2 && c2?.(l2);
  } catch (e3) {
    i2 && console.error("[pinia-plugin-persistedstate]", e3);
  }
}
function xt(e2, { storage: t2, serializer: n2, key: r2, debug: i2, pick: a2, omit: o2 }) {
  try {
    let i3 = a2 ? vt(e2, a2) : e2, s2 = o2 ? yt(i3, o2) : i3, c2 = n2.serialize(s2);
    t2.setItem(r2, c2);
  } catch (e3) {
    i2 && console.error("[pinia-plugin-persistedstate]", e3);
  }
}
function St(e2, t2) {
  return typeof e2 == "function" ? e2(t2) : typeof e2 == "string" ? e2 : t2;
}
function Ct(e2, t2, n2) {
  let { pinia: r2, store: i2, options: { persist: a2 = n2 } } = e2;
  if (!a2) return;
  if (!(i2.$id in r2.state.value)) {
    let e3 = r2._s.get(i2.$id.replace("__hot:", ""));
    e3 && Promise.resolve().then(() => e3.$persist());
    return;
  }
  let o2 = (Array.isArray(a2) ? a2 : a2 === !0 ? [{}] : [a2]).map(t2);
  i2.$hydrate = ({ runHooks: t3 = !0 } = {}) => {
    o2.forEach((n3) => {
      bt(i2, n3, e2, t3);
    });
  }, i2.$persist = () => {
    o2.forEach((e3) => {
      xt(i2.$state, e3);
    });
  }, o2.forEach((t3) => {
    bt(i2, t3, e2), i2.$subscribe((e3, n3) => xt(n3, t3), { detached: !0 });
  });
}
function wt(e2 = {}) {
  return function(t2) {
    Ct(t2, (n2) => {
      let r2 = St(n2.key, t2.store.$id);
      return { key: (e2.key ? e2.key : (e3) => e3)(r2), debug: n2.debug ?? e2.debug ?? !1, serializer: n2.serializer ?? e2.serializer ?? { serialize: (e3) => JSON.stringify(e3), deserialize: (e3) => JSON.parse(e3) }, storage: n2.storage ?? e2.storage ?? window.localStorage, beforeHydrate: n2.beforeHydrate ?? e2.beforeHydrate, afterHydrate: n2.afterHydrate ?? e2.afterHydrate, pick: n2.pick, omit: n2.omit };
    }, e2.auto ?? !1);
  };
}
var Tt = wt();
export default Tt;

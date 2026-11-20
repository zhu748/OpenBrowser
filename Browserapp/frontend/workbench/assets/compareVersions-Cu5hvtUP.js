var e = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
var t = (t2) => {
  if (typeof t2 != "string") throw TypeError("Invalid argument expected string");
  let n2 = t2.match(e);
  if (!n2) throw Error(`Invalid argument not valid semver ('${t2}' received)`);
  return n2.shift(), n2;
};
var n = (e2) => e2 === "*" || e2 === "x" || e2 === "X";
var r = (e2) => {
  let t2 = parseInt(e2, 10);
  return isNaN(t2) ? e2 : t2;
};
var i = (e2, t2) => typeof e2 == typeof t2 ? [e2, t2] : [String(e2), String(t2)];
var a = (e2, t2) => {
  if (n(e2) || n(t2)) return 0;
  let [a2, o2] = i(r(e2), r(t2));
  return a2 > o2 ? 1 : a2 < o2 ? -1 : 0;
};
var o = (e2, t2) => {
  for (let n2 = 0; n2 < Math.max(e2.length, t2.length); n2++) {
    let r2 = a(e2[n2] || "0", t2[n2] || "0");
    if (r2 !== 0) return r2;
  }
  return 0;
};
var s = (e2, n2) => {
  let r2 = t(e2), i2 = t(n2), a2 = r2.pop(), s2 = i2.pop(), c = o(r2, i2);
  return c === 0 ? a2 && s2 ? o(a2.split("."), s2.split(".")) : a2 || s2 ? a2 ? -1 : 1 : 0 : c;
};
export {s as t};
import {_ as e} from "./dist-NctnpPRe.js";
function t(e2) {
  return e2 === "__proto__";
}
function n(i, a) {
  let o = Object.keys(a);
  for (let s = 0; s < o.length; s++) {
    let c = o[s];
    if (t(c)) continue;
    let l = a[c], u = i[c];
    r(l) && r(u) ? i[c] = n(u, l) : Array.isArray(l) ? i[c] = n([], l) : e(l) ? i[c] = n({}, l) : (u === void 0 || l !== void 0) && (i[c] = l);
  }
  return i;
}
function r(t2) {
  return e(t2) || Array.isArray(t2);
}
export {n as t};
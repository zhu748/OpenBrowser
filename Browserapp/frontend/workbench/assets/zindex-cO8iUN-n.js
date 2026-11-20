function e() {
  let e2 = [], t2 = (t3, n2, r2 = 999) => {
    let a2 = i(t3, n2, r2), o = a2.value + (a2.key === t3 ? 0 : r2) + 1;
    return e2.push({ key: t3, value: o }), o;
  }, n = (t3) => {
    e2 = e2.filter((e3) => e3.value !== t3);
  }, r = (e3, t3) => i(e3, t3).value, i = (t3, n2, r2 = 0) => [...e2].reverse().find((e3) => n2 ? !0 : e3.key === t3) || { key: t3, value: r2 }, a = (e3) => e3 && parseInt(e3.style.zIndex, 10) || 0;
  return { get: a, set: (e3, n2, r2) => {
    n2 && (n2.style.zIndex = String(t2(e3, !0, r2)));
  }, clear: (e3) => {
    e3 && (n(a(e3)), e3.style.zIndex = "");
  }, getCurrent: (e3) => r(e3, !0) };
}
var t = e();
export {t as t};
var e = "agent-console:new-template-created";
function t(e2) {
  let t2 = e2?.id ?? e2?.email ?? e2?.phone;
  return t2 == null || t2 === "" ? "" : String(t2);
}
function n(e2) {
  return e2 == null || e2 === "" ? "" : `agent-console:new-template-guide-shown:${encodeURIComponent(String(e2))}`;
}
function r(e2) {
  return e2 == null || e2 === "" ? "" : `agent-console:new-template-guide-pending:${encodeURIComponent(String(e2))}`;
}
function i(e2) {
  if (!e2 || typeof window > "u") return null;
  try {
    return window.localStorage.getItem(e2);
  } catch {
    return null;
  }
}
function a(e2, t2) {
  if (e2 && typeof window < "u") try {
    window.localStorage.setItem(e2, t2);
  } catch {
  }
}
function o(e2) {
  let t2 = n(e2);
  return !!(t2 && i(t2) === "1");
}
function s(e2) {
  a(n(e2), "1");
}
function c(e2) {
  let t2 = r(e2);
  return !!(t2 && i(t2) === "1");
}
function l(e2) {
  a(r(e2), "1");
}
function u(e2) {
  let t2 = r(e2);
  if (t2 && typeof window < "u") try {
    window.localStorage.removeItem(t2);
  } catch {
  }
}
function d() {
  typeof window < "u" && window.dispatchEvent(new Event(e));
}
export {c as a,s as c,t as i,d as n,o as o,u as r,l as s,e as t};
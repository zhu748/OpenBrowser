var e = /^(操作成功|操作失败|成功|失败|success|ok)$/i;
function t(t2, n) {
  let r = String(t2 || "").trim();
  return !r || e.test(r) ? n : r;
}
export {t as t};
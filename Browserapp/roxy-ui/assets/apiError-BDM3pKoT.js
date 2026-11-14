function s(e2) {
  return e2 == null ? !1 : e2.code !== void 0 && e2.code !== null && e2.code !== "" ? Number(e2.code) === 0 : e2.success !== !1;
}
export {s as i};
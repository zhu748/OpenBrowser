function e(e2) {
  if (typeof e2 == "number") return !Number.isSafeInteger(e2) || e2 <= 0 ? null : String(e2);
  if (typeof e2 != "string") return null;
  let t2 = e2.trim();
  return /^[1-9]\d*$/.test(t2) ? t2 : null;
}
export {e as t};
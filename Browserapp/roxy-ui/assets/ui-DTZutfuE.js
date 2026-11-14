import {St as e} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {i as t,n} from "./agent-BmSFI9WH.js";
var r = t("cloud-phone-ui", () => {
  let [t2] = n(), r2 = e(!1), i = e({ title: "" }), a = e(""), o = e({}), s;
  function c(e2, n2, r3) {
    let i2 = typeof r3 == "number" ? { life: r3 } : r3;
    if (typeof n2 == "string" && n2.trim() && i2?.summary == null) {
      let [r4, ...a2] = n2.split(`
`);
      t2(e2, a2.join(`
`).trim(), { ...i2, summary: r4 });
    } else t2(e2, n2, i2);
  }
  function l(e2, t3, n2 = {}, c2) {
    a.value = e2, i.value = t3, o.value = n2, s = c2, r2.value = !0;
  }
  function u() {
    r2.value = !1, a.value = "", s = void 0;
  }
  function d(e2) {
    s = e2;
  }
  async function f() {
    s ? await s() : u();
  }
  return { toast: c, modalOpen: r2, modalOptions: i, modalBodyKey: a, modalPayload: o, openModal: l, closeModal: u, confirmModal: f, bindModalOk: d };
});
export {r as t};
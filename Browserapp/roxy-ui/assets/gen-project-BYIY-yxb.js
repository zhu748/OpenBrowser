import {h as n} from "./utils-BIWenCnY.js";
import {C as i,St as o,W as c,d as u,f as d,h as f,in as m,jt as h,m as _,x as y} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as x} from "./agent-BmSFI9WH.js";
import {Z as C} from "./basecomponent-ClhuVxJN.js";
import {t as te} from "./rx-button-DyzuUt-V.js";
import {t as ne} from "./rx-checkbox-BrC0MzoD.js";
import {t as re} from "./rx-divider-Ci3C58Q3.js";
import {r as ie} from "./major-client-purchase-success-D9bdaQmg.js";
import {n as ae} from "./m-input-select-C8pih1gY.js";
import {t as E} from "./form-BQBA_XzO.js";
import {t as D} from "./rx-tag-BIY_xUFU.js";
import {n as O} from "./useProjectEntityLabels-DdcfADRx.js";
var j = { class: "flex flex-col pa-6 pt-4 gap-6 w-120" };
var M = { class: "h-9 flex justify-between items-center" };
var N = { class: "tt-primary text-4 font-600" };
var P = { class: "flex flex-col gap-5 relative w-full" };
var B = i({ __name: "gen-project", props: { data: {}, onClose: { type: Function }, onSuccess: { type: Function } }, setup(i2) {
  let [oe, H] = x(), U = O(), se = u(() => {
    let e2 = U.value;
    return [{ type: "text", name: "projectName", value: i2.data?.projectName, props: { placeholder: e2.namePlaceholder, size: "lg" }, resolver: (t2) => t2.string().min(1, e2.nameRequired).min(2, e2.nameMinLength).max(30, e2.nameMaxLength) }];
  }), Q = o(!1);
  async function $(e2) {
    Q.value = !0;
    try {
      const result = await n.limit.userAddProjectInfoCreate({ ...e2 });
      H(result.code, result.msg), result.code === 0 && await i2.onSuccess?.();
    } finally {
      Q.value = !1;
    }
  }
  return (t2, n2) => {
    let r2 = C, a2 = re, o2 = ae, s2 = ne, u2 = D, b2 = ie, x2 = te;
    return c(), f("div", j, [d("div", M, [d("div", N, m(h(U).createTitle), 1), y(r2, { class: "cursor-pointer", name: "base/rx_ic_delete", size: "20", onClick: i2.onClose }, null, 8, ["onClick"])]), y(E, { id: "gen_project", class: "-mt-2", inputs: h(se), onSubmit: $ }, null, 8, ["inputs"]), _("", !0), d("div", P, [_("", !0), _("", !0), _("", !0), y(x2, { class: "self-end", size: "md", form: "gen_project", type: "submit", loading: h(Q), label: t2.$t("\u786E\u8BA4") }, null, 8, ["loading", "label"])])]);
  };
} });
export {B as t};
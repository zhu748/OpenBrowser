import {Cr as e,h as t} from "./utils-BIWenCnY.js";
import {n} from "./agent-BmSFI9WH.js";
import {w as r} from "./hook-CnJE4hRq.js";
import {t as i} from "./useFormDialog-ChvKgFzE.js";
import {n as a} from "./useProjectEntityLabels-DdcfADRx.js";
import {t as o} from "./schemas-Y9Ask_a8.js";
var s = { toast: !0 };
function c(c2 = s) {
  let [l] = i(), [u] = n(), { handleBusinessCode: d } = r(), f = a();
  async function p(n2) {
    let { confirmNext: r2, ...i2 } = n2 || {}, a2 = f.value;
    (await l({ header: i2.project_id ? a2.editTitle : a2.createTitle, class: "w-[500px]", schemas: o(a2), formProps: { layout: "vertical" }, handleOk: async (n3) => {
      let a3 = i2.project_id ? await t.limit.userMdfProjectInfoCreate({ id: i2.project_id, ...n3 }) : await t.limit.userAddProjectInfoCreate(n3);
      a3.code === 0 && e(r2) && await r2({ params: n3, res: a3 }), d(a3.code, () => {
        (c2.toast || a3.code !== 0) && u(a3.code, a3.msg);
      });
    } })).formRef.value?.setFieldsValue({ id: i2.project_id, ...i2 });
  }
  return [p];
}
export {c as t};
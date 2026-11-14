import {F as e,P as t,St as n,i as r,x as i} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as a} from "./rx-form-A3sc3aGh.js";
import {t as o} from "./useDialog-BC-nc8J-.js";
function s() {
  let [s2] = o();
  async function c(o2) {
    let c2 = n(), l = n({ ...o2 });
    l.value = { ...l.value, handleCancel: () => {
      u.hideModal(), o2?.handleCancel?.();
    }, handleOk: async () => {
      let e2 = await c2.value?.submit();
      await o2?.handleOk?.(e2), u.hideModal();
    } };
    let u = s2({ ...l.value, slots: { default: () => i(r, null, [l.value.dialogSlots?.beforeForm?.(), i(a, t({ ref: c2 }, l.value.formProps, { schemas: l.value.schemas, footer: !1 }), null)]), ...l.value.dialogSlots } });
    return await e(), { formRef: c2, hideModal: u.hideModal, handleOk: () => l.value.handleOk?.(), handleCancel: () => l.value.handleCancel?.() };
  }
  return [c];
}
export {s as t};
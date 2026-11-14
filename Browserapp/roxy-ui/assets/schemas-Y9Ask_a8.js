import {t as c} from "./rx-form-A3sc3aGh.js";
import {t as d} from "./useProjectEntityLabels-DdcfADRx.js";
function h(e2) {
  return c([{ field: "projectName", component: "InputText", componentProps: { placeholder: e2.namePlaceholder }, rule: { trigger: "blur", validator(t2) {
    return t2.string().min(1, e2.nameRequired).min(2, e2.nameMinLength).max(30, e2.nameMaxLength);
  } } }]);
}
h(d(!1));
export {h as t};
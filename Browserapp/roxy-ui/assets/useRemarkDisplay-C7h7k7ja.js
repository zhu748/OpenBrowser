import {h as e,hn as t,v as n} from "./utils-BIWenCnY.js";
import {a as r,n as i} from "./agent-BmSFI9WH.js";
function a() {
  let { userConfig: a2 } = r(n()), { fetchUserInfo: o, updateUserConfig: s } = n(), [c, l] = i(), u = t(async (t2) => {
    let { code: n2, msg: r2 } = await e.base.userSetUserConfigCreate({ remarkDisplayStatus: t2 });
    l(n2, r2), n2 === 0 && (o(), s());
  }, 500);
  function d(e2) {
    e2.extend = !e2.extend, a2.value.remarkDisplayStatus !== e2.extend && u(e2.extend);
  }
  return { toggleRemarkDisplayStatus: d };
}
export {a as t};
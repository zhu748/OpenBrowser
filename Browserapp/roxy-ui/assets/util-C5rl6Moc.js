import {h as e} from "./utils-BIWenCnY.js";
import {Et as t} from "./runtime-core.esm-bundler-CBj16o9G.js";
async function n(n2) {
  return await globalThis.electronAPI.send("syncControl:changeSyncSettings", t({ ...n2.base, ...n2.simulate })), await e.base.userSetUserConfigCreate({ preferenceSettings: n2 });
}
export {n as t};
import {C as e,St as t,W as n,jt as r,lt as i,m as a,p as o} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as s} from "./base-dialog-Bet1oNF8.js";
import {t as c} from "./window-list-C-MAmr_C.js";
var l = e({ __name: "syncing-window-list", setup(e2) {
  let l2 = t();
  function u() {
    globalThis.electronAPI.send("syncControl:closeSyncingWindowListDialog");
  }
  return globalThis.electronAPI.send("syncControl:getMainControlDirId").then((e3) => {
    l2.value = e3;
  }), (e3, t2) => (n(), o(s, { header: e3.$t("\u540C\u6B65\u7A97\u53E3\u5217\u8868"), onHide: u }, { default: i(() => [r(l2) ? (n(), o(c, { key: 0, showType: "syncing", showTableHeader: !1, mainControlWindowDirId: r(l2) }, null, 8, ["mainControlWindowDirId"])) : a("", !0)]), _: 1 }, 8, ["header"]));
} });
export {l as default};
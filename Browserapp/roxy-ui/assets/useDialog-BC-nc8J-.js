import {P as e,St as t,w as n,x as r} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {a as i} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as a} from "./isFunction-BpPesgCd.js";
import {r as o} from "./rich-html-link-VdBpR3Cm.js";
import {t as s} from "./dialog-CrBr3eoy.js";
import {t as c} from "./rx-button-DyzuUt-V.js";
var l = /* @__PURE__ */ new Map();
var u = null;
function d(e2) {
  return e2.uniqueKey || e2.header || "";
}
function f() {
  u ||= n().appContext;
  function f2(n2) {
    let f3 = d(n2), p = f3 ? l.get(f3) : void 0;
    if (p) return p;
    let m = document.createElement("div"), h = t(!1), g = t({ draggable: !1, ...n2 });
    function _() {
      h.value = !1, f3 && l.delete(f3), o.off("kickedOut", S);
    }
    let v = !1;
    async function y(e2) {
      if (v) return !1;
      v = !0;
      try {
        return await g.value.beforeClose?.() !== !1 && (_(), e2?.(), !0);
      } finally {
        v = !1;
      }
    }
    async function b(e2) {
      e2 ? h.value = !0 : await y(() => n2?.handleCancel?.());
    }
    Object.assign(g.value, { handleCancel: async () => {
      await y(() => n2?.handleCancel?.());
    }, handleOk: async () => {
      try {
        await n2?.handleOk?.();
      } catch (e2) {
        if (e2 instanceof Error && e2.message === "invalid") return;
        throw e2;
      }
      _();
    } });
    function x() {
      m.remove();
    }
    function S() {
      console.log("User kicked out, closing dialog"), setTimeout(y, 500);
    }
    let C = { dialogRef: t(null), hideModal: () => y(), handleOk: () => g.value.handleOk?.(), handleCancel: () => g.value.handleCancel?.() };
    f3 && l.set(f3, C);
    let w = r(() => {
      let { handleCancel: t2, handleOk: n3, okText: i2, cancelText: o2, slots: l2, okProps: u2, beforeClose: d2, noAutoClose: f4, uniqueKey: p2, ...m2 } = g.value, _2 = { footer: () => r("div", { class: "flex justify-end gap-2" }, [o2 === "" ? null : r(c, { type: "button", label: o2 || $t("\u53D6\u6D88"), outlined: !0, severity: "secondary", onClick: t2 }, null), r(c, e({ type: "button", label: i2 || $t("\u4FDD\u5B58") }, u2, { onClick: n3 }), null)]), ...Object.entries(l2 || {}).reduce((e2, [t3, n4]) => (e2[t3] = a(n4) ? new Proxy(n4, { apply: (e3, t4, n5) => Reflect.apply(e3, t4, [C, ...n5]) }) : n4, e2), {}) }, v2 = { ...m2, visible: h.value, modal: !0, "onUpdate:visible": b, "onAfter-hide": x };
      return r(s, e({ ref: C.dialogRef }, v2), _2);
    });
    return w.appContext = u, i(w, m), h.value = !0, C;
  }
  return [f2];
}
export {f as t};
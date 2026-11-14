import {C as e,D as t,J as n,L as r,St as i,W as a,Z as o,f as s,h as c,in as l,jt as u,m as d,p as f,ut as p,x as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as h} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as g} from "./focustrap-DJJkEqE8.js";
import {t as _} from "./rx-button-DyzuUt-V.js";
import {t as v} from "./useDialog-BC-nc8J-.js";
import {t as y} from "./form-BQBA_XzO.js";
var b = { class: "flex flex-col gap-3 pt-4 pb-6 px-6 w-120 popup" };
var x = { key: 0, class: "title" };
var S = { key: 1, class: "content" };
var C = { class: "flex justify-end items-center self-stretch gap-3" };
var w = h(e({ __name: "index", props: { title: {}, content: {}, inputs: {}, cancelText: { default: () => $t("\u53D6\u6D88") }, confirmText: { default: () => $t("\u4FDD\u5B58") }, afterRender: {}, onConfirm: { type: Function }, onCancel: { type: Function } }, emits: ["close"], setup(e2, { emit: t2 }) {
  let h2 = t2, v2 = i(!1);
  r(() => {
    e2.inputs[0] && Reflect.set(e2.inputs[0], "props", { ...e2.inputs[0].props, autofocus: !0 });
  });
  function w2() {
    e2.onCancel?.(), h2("close");
  }
  async function T2(t3) {
    v2.value = !0, await e2.onConfirm?.(t3), v2.value = !1, h2("close");
  }
  return (t3, r2) => {
    let i2 = _, h3 = g;
    return a(), c("div", b, [e2.title ? (a(), c("div", x, l(e2.title), 1)) : d("", !0), e2.content ? (a(), c("div", S, l(e2.content), 1)) : d("", !0), p(m(y, { id: "simpleform", inputs: e2.inputs, onSubmit: T2 }, null, 8, ["inputs"]), [[h3]]), e2.afterRender ? (a(), f(o(e2.afterRender), { key: 2 })) : d("", !0), n(t3.$slots, "footer", { close: w2, loading: u(v2), cancelText: e2.cancelText, confirmText: e2.confirmText, formId: "simpleform" }, () => [s("div", C, [m(i2, { size: "sm", text: "", severity: "secondary", label: e2.cancelText, onClick: w2 }, null, 8, ["label"]), m(i2, { size: "sm", type: "submit", form: "simpleform", label: e2.confirmText, loading: u(v2) }, null, 8, ["label", "loading"])])], !0)]);
  };
} }), [["__scopeId", "data-v-2c669294"]]);
function T() {
  let [e2] = v();
  function n2({ onHide: n3, slots: r2, ...i2 }) {
    e2({ showHeader: !1, modal: !0, blockScroll: !0, slots: { container: ({ handleCancel: e3 }) => t(w, { ...i2, onClose: e3 }, r2) }, handleCancel: n3 });
  }
  return { showSimpleDialog: n2 };
}
export {T as t};
import {C as e,St as t,V as n,W as r,_t as i,d as a,f as o,h as s,in as c,jt as l,k as u,m as d,st as f,x as p} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as m} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as h} from "./rx-button-DyzuUt-V.js";
import {t as g} from "./m-input-text-JVbCgVJP.js";
import {r as _} from "./constants-DLlGaEfk.js";
import {t as v} from "./colors-select-CQM6_O2z.js";
var y = { class: "w-100 flex flex-col gap-6 pt-5 popup" };
var b = { class: "title" };
var x = { class: "flex flex-col gap-1" };
var S = { key: 0, class: "m-0 text-3 leading-4 text-[var(--colors-text-text-error,#F53838)]" };
var C = { class: "flex justify-end items-center self-stretch gap-3" };
var w = m(e({ __name: "edit", props: { name: {}, color: {}, submit: { type: Function } }, emits: ["close"], setup(e2, { emit: m2 }) {
  let w2 = e2, T = m2, E = u("dialogRef", null), D = t(w2.color || _[1]), O = t(w2.name ?? ""), k = t("");
  f(O, () => {
    k.value = "";
  });
  let A = t(w2.name !== void 0), j = t(), M = t(), N = a(() => {
    let e3 = D.value;
    return e3 && !_.some((t2) => t2.toLowerCase() === String(e3).toLowerCase()) ? [e3, ..._] : _;
  });
  function P() {
    E?.value ? (E.value.close(), M.value?.()) : T("close");
  }
  async function F() {
    if (!O.value.trim()) {
      k.value = $t("\u8BF7\u8F93\u5165\u6807\u7B7E\u540D\u79F0");
      return;
    }
    let e3 = { name: O.value, color: D.value };
    j.value ? await j.value(e3) : await w2.submit?.(e3), P();
  }
  return n(() => {
    let e3 = E?.value?.data;
    if (!e3) return;
    let { props: t2, onConfirm: n2, onCancel: r2 } = e3;
    A.value = t2?.name !== void 0, O.value = t2?.name, D.value = t2?.color || _[1], j.value = n2, M.value = r2;
  }), (e3, t2) => {
    let n2 = v, a2 = h;
    return r(), s("div", y, [o("div", b, c(l(A) ? e3.$t("\u7F16\u8F91\u6807\u7B7E") : e3.$t("\u65B0\u589E\u6807\u7B7E")), 1), p(n2, { modelValue: l(D), "onUpdate:modelValue": t2[0] ||= (e4) => i(D) ? D.value = e4 : null, colors: l(N) }, null, 8, ["modelValue", "colors"]), o("div", x, [p(g, { modelValue: l(O), "onUpdate:modelValue": t2[1] ||= (e4) => i(O) ? O.value = e4 : null, size: "md", type: "text", invalid: !!l(k), placeholder: e3.$t("\u8BF7\u8F93\u5165\u6807\u7B7E\u540D") }, null, 8, ["modelValue", "invalid", "placeholder"]), l(k) ? (r(), s("p", S, c(l(k)), 1)) : d("", !0)]), o("div", C, [p(a2, { label: e3.$t("\u53D6\u6D88"), text: "", severity: "secondary", onClick: P }, null, 8, ["label"]), p(a2, { label: e3.$t("\u4FDD\u5B58"), onClick: F }, null, 8, ["label"])])]);
  };
} }), [["__scopeId", "data-v-a24ff283"]]);
export {w as t};
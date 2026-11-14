import {C as e,N as t,P as n,St as r,V as i,W as a,_t as o,at as s,d as c,f as l,h as u,jt as d,rn as f,rt as p,ut as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {d as h} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as g} from "./_plugin-vue_export-helper-BDNMzG2s.js";
var _ = e({ __name: "shadow-dot-grid", setup(e2) {
  let t2 = c(() => {
    let e3 = [];
    for (let t3 = 0; t3 < 100; t3++) for (let n2 = 0; n2 < 100; n2++) e3.push(`${n2 * 24}px ${t3 * 24}px var(--colors-background-bg-mode-reverse)`);
    return { boxShadow: e3.join(", "), opacity: 0.1 };
  });
  return (e3, r2) => (a(), u("div", n({ class: "absolute inset-0 bg-[var(--colors-background-bg-example)] w-full h-full" }, e3.$attrs), [l("div", { class: "size-2px rounded-full translate-x-[-10px] translate-y-[-10px]", style: f(d(t2)) }, null, 4)], 16));
} });
var v = { class: "textarea" };
var y = ["placeholder"];
var b = g(e({ __name: "parse-textarea", props: t({ placeholder: { default: "" } }, { modelValue: { default: "" }, modelModifiers: {} }), emits: ["update:modelValue"], setup(e2) {
  let t2 = p(e2, "modelValue"), n2 = s("line"), c2 = r();
  function f2() {
    let e3 = t2.value.replace(/\r/g, "").split(`
`).length, n3 = "";
    for (let t3 = 1; t3 <= e3; t3++) n3 += `${t3.toString().padStart(2, "0")}
`;
    c2.value = n3;
  }
  function g2(e3) {
    n2.value.scrollTop = e3.target.scrollTop;
  }
  return i(() => {
    f2();
  }), (n3, r2) => (a(), u("div", v, [m(l("textarea", { ref: "line", "onUpdate:modelValue": r2[0] ||= (e3) => o(c2) ? c2.value = e3 : null, class: "textarea-line", wrap: "off", cols: "2", disabled: "" }, null, 512), [[h, d(c2)]]), m(l("textarea", { "onUpdate:modelValue": r2[1] ||= (e3) => t2.value = e3, spellcheck: "false", class: "textarea-content", placeholder: e2.placeholder, onScroll: g2, onInput: f2 }, null, 40, y), [[h, t2.value]])]));
} }), [["__scopeId", "data-v-cadffbdf"]]);
export {_ as n,b as t};
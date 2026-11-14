import {C as e,J as t,N as n,P as r,St as i,Tt as a,V as o,W as s,Z as c,_t as l,an as u,b as d,bt as f,d as p,en as m,f as h,h as g,i as _,in as v,j as y,jt as b,lt as x,m as S,nt as C,p as w,q as T,rt as E,st as D,v as O,x as k} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as A} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {A as j,B as M,C as N,D as P,F,G as I,H as L,I as R,K as z,L as ee,M as te,N as ne,O as re,P as ie,R as ae,T as oe,U as se,V as ce,W as le,_ as B,b as ue,h as de,j as fe,v as V,w as pe,y as me,z as he} from "./dist-NctnpPRe.js";
import {t as ge} from "./isTypedArray-BKgGJHFb.js";
import {t as _e} from "./merge-B7DGYZqS.js";
import {t as H} from "./isFunction-BpPesgCd.js";
import {t as U} from "./isString-DgRFdIis.js";
import {d as ve,i as ye} from "./dist-ufdnm93_.js";
import {t as W} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {t as be} from "./rx-button-DyzuUt-V.js";
import {t as xe} from "./inputtext-Crzvb5jQ.js";
import {t as G} from "./radiobutton-B3i1EP5M.js";
import {t as Se} from "./select-Cc8zLK4m.js";
import {t as Ce} from "./multiselect-DS9bwX-7.js";
import {t as we} from "./message-SBZQdXpt.js";
import {t as Te} from "./password-CRxCSpUp.js";
import {t as Ee} from "./textarea-DvuriTzI.js";
import {V as De,dt as Oe} from "./types-Cxql15JH.js";
import {t as ke} from "./external-CdTk2m9u.js";
function Ae(e2, t2) {
  let n2 = /* @__PURE__ */ new Map();
  for (let r2 = 0; r2 < e2.length; r2++) {
    let i2 = e2[r2], a2 = t2(i2, r2, e2);
    n2.has(a2) || n2.set(a2, i2);
  }
  return Array.from(n2.values());
}
function je(e2) {
  return e2 == null || typeof e2 != "object" && typeof e2 != "function";
}
function K(e2, t2, n2, r2 = /* @__PURE__ */ new Map(), i2 = void 0) {
  let a2 = i2?.(e2, t2, n2, r2);
  if (a2 !== void 0) return a2;
  if (je(e2)) return e2;
  if (r2.has(e2)) return r2.get(e2);
  if (Array.isArray(e2)) {
    let t3 = Array(e2.length);
    r2.set(e2, t3);
    for (let a3 = 0; a3 < e2.length; a3++) t3[a3] = K(e2[a3], a3, n2, r2, i2);
    return Object.hasOwn(e2, "index") && (t3.index = e2.index), Object.hasOwn(e2, "input") && (t3.input = e2.input), t3;
  }
  if (e2 instanceof Date) return new Date(e2.getTime());
  if (e2 instanceof RegExp) {
    let t3 = new RegExp(e2.source, e2.flags);
    return t3.lastIndex = e2.lastIndex, t3;
  }
  if (e2 instanceof Map) {
    let t3 = /* @__PURE__ */ new Map();
    r2.set(e2, t3);
    for (let [a3, o2] of e2) t3.set(a3, K(o2, a3, n2, r2, i2));
    return t3;
  }
  if (e2 instanceof Set) {
    let t3 = /* @__PURE__ */ new Set();
    r2.set(e2, t3);
    for (let a3 of e2) t3.add(K(a3, void 0, n2, r2, i2));
    return t3;
  }
  if (z(e2)) return e2.subarray();
  if (ge(e2)) {
    let t3 = new (Object.getPrototypeOf(e2)).constructor(e2.length);
    r2.set(e2, t3);
    for (let a3 = 0; a3 < e2.length; a3++) t3[a3] = K(e2[a3], a3, n2, r2, i2);
    return t3;
  }
  if (e2 instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && e2 instanceof SharedArrayBuffer) return e2.slice(0);
  if (e2 instanceof DataView) {
    let t3 = new DataView(e2.buffer.slice(0), e2.byteOffset, e2.byteLength);
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  if (typeof File < "u" && e2 instanceof File) {
    let t3 = new File([e2], e2.name, { type: e2.type });
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  if (typeof Blob < "u" && e2 instanceof Blob) {
    let t3 = new Blob([e2], { type: e2.type });
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  if (e2 instanceof Error) {
    let t3 = structuredClone(e2);
    return r2.set(e2, t3), t3.message = e2.message, t3.name = e2.name, t3.stack = e2.stack, t3.cause = e2.cause, t3.constructor = e2.constructor, q(t3, e2, n2, r2, i2), t3;
  }
  if (e2 instanceof Boolean) {
    let t3 = new Boolean(e2.valueOf());
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  if (e2 instanceof Number) {
    let t3 = new Number(e2.valueOf());
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  if (e2 instanceof String) {
    let t3 = new String(e2.valueOf());
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  if (typeof e2 == "object" && Me(e2)) {
    let t3 = Object.create(Object.getPrototypeOf(e2));
    return r2.set(e2, t3), q(t3, e2, n2, r2, i2), t3;
  }
  return e2;
}
function q(e2, t2, n2 = e2, r2, i2) {
  let a2 = [...Object.keys(t2), ...I(t2)];
  for (let o2 = 0; o2 < a2.length; o2++) {
    let s2 = a2[o2], c2 = Object.getOwnPropertyDescriptor(e2, s2);
    (c2 == null || c2.writable) && (e2[s2] = K(t2[s2], s2, n2, r2, i2));
  }
}
function Me(e2) {
  switch (le(e2)) {
    case V:
    case ue:
    case me:
    case pe:
    case N:
    case oe:
    case P:
    case re:
    case te:
    case j:
    case fe:
    case ne:
    case ie:
    case F:
    case R:
    case ee:
    case ae:
    case he:
    case L:
    case se:
    case M:
    case ce:
      return !0;
    default:
      return !1;
  }
}
function J(e2) {
  return K(e2, void 0, e2, /* @__PURE__ */ new Map(), void 0);
}
var Ne = { modelValue: { type: Object }, schemas: { type: Object, required: !0 }, initialValues: { type: Object, default: () => ({}) }, layout: { type: String, default: "horizontal" }, colon: { type: Boolean, default: !0 }, labelWidth: { type: String, default: "110px" }, labelAlign: { type: String, default: "right" }, footer: { type: Boolean, default: !0 } };
var Pe = { "update:modelValue": (e2) => !!e2, reset: () => !0, submit: (e2) => B(e2) };
function Y(e2) {
  return e2.issues ?? e2.errors ?? [];
}
function X(e2) {
  return Y(e2)[0]?.message ?? "";
}
var Fe = { class: "card flex justify-center" };
var Ie = { class: "flex flex-wrap gap-4" };
var Le = ["for"];
var Re = { InputText: xe, Password: Te, RadioButton: G, Select: Se, Textarea: Ee, RxRadioButton: e({ __name: "index", props: { options: { type: Array, default: () => [] } }, setup(e2) {
  let t2 = C(), n2 = i("");
  return (r2, i2) => {
    let a2 = G;
    return s(), g("div", Fe, [h("div", Ie, [(s(!0), g(_, null, T(e2.options, (e3) => (s(), g("div", { key: e3.value, class: "flex items-center" }, [k(a2, { modelValue: b(n2), "onUpdate:modelValue": i2[0] ||= (e4) => l(n2) ? n2.value = e4 : null, "input-id": `${e3.value}-${b(t2)}`, value: e3.value }, null, 8, ["modelValue", "input-id", "value"]), h("label", { for: `${e3.value}-${b(t2)}`, class: "ml-2" }, v(e3.label), 9, Le)]))), 128))])]);
  };
} }), MultiSelect: Ce };
var Z = /* @__PURE__ */ Symbol("schema-form");
async function Q(e2) {
  ve(Z, e2);
}
function $(e2 = {}) {
  return ye(Z, e2);
}
function ze({ emit: e2 }) {
  let { formProps: t2, formState: n2 } = $(), { formModel: r2, validationSchema: i2, errors: a2, innerFormSchemas: o2, originComponentPropsFnMap: s2, defaultFormValues: c2 } = n2;
  async function l2(e3) {
    let t3 = [];
    B(e3) && t3.push(e3), Array.isArray(e3) && (t3 = [...e3]), o2.value = t3;
  }
  async function u2(e3, t3) {
    let n3 = o2.value.findIndex((e4) => e4.field === t3);
    !t3 || n3 === -1 ? o2.value.push(e3) : o2.value.splice(n3 + 1, 0, e3);
  }
  function d2(e3, t3) {
    let n3 = o2.value.findIndex((e4) => e4.field === t3);
    !t3 || n3 === -1 ? o2.value.unshift(e3) : o2.value.splice(n3, 0, e3);
  }
  async function f2(e3) {
    if (!e3) return;
    let t3 = U(e3) ? [e3] : e3;
    for (let e4 of t3) if (U(e4)) {
      let t4 = o2.value.findIndex((t5) => t5.field === e4);
      t4 !== -1 && (Reflect.deleteProperty(r2.value, e4), o2.value.splice(t4, 1));
    }
  }
  function p2(e3) {
    return o2.value.find((t3) => e3 === t3.field);
  }
  let m2 = (e3) => {
    let t3 = [].concat(e3);
    if (!t3.every((e4) => e4.component === "Divider" || Reflect.has(e4, "field") && e4.field)) {
      console.error("All children of the form Schema array that need to be updated must contain the `field` field");
      return;
    }
    let n3 = [], r3 = [];
    o2.value.forEach((e4) => {
      let i3 = t3.find((t4) => e4.field === t4.field);
      if (i3) {
        let t4 = i3.componentProps, a3 = _e(e4, i3);
        if (s2.has(e4.field)) {
          let n4 = s2.get(e4.field);
          a3.componentProps = (e5) => ({ ...n4(e5), ...H(t4) ? t4(e5) : t4 });
        }
        r3.push(a3), n3.push(a3);
      } else n3.push(e4);
    }), o2.value = Ae(n3, (e4) => e4.field);
  };
  function h2(e3) {
    Object.assign(r2.value, e3);
  }
  function g2() {
    Object.keys(r2.value).forEach((e3) => {
      r2.value[e3] = c2.value[e3] ?? "";
    }), setTimeout(() => {
      Object.keys(a2.value).forEach((e3) => {
        a2.value[e3] = "";
      });
    }), e2("reset");
  }
  function _2() {
    Object.keys(a2.value).forEach((e3) => {
      a2.value[e3] = "";
    });
  }
  function v2(t3) {
    t3?.preventDefault();
    let n3 = i2.value.safeParse(r2.value);
    return console.log("result", n3), Object.keys(a2.value).forEach((e3) => {
      a2.value[e3] = "";
    }), n3.success ? (e2("submit", r2.value), Promise.resolve(r2.value)) : (Y(n3.error).forEach((e3) => {
      let t4 = e3.path[0];
      a2.value[t4] = e3.message;
    }), Promise.reject(a2.value));
  }
  return { setFieldsValue: h2, resetFields: g2, handleSubmit: v2, resetSchema: l2, appendSchemaByField: u2, insertBeforeSchemaByField: d2, removeSchemaByField: f2, getSchemaByField: p2, updateSchema: m2, clearValidateMessages: _2 };
}
function Be({ props: e2, emit: t2 }) {
  let n2 = e2.modelValue ? de(e2, "modelValue", t2, { defaultValue: { ...e2.initialValues } }) : i({ ...e2.initialValues }), r2 = a(f(J(e2.schemas))), o2 = /* @__PURE__ */ new Map(), s2 = p(() => {
    let t3 = r2.value.reduce((e3, t4) => (t4.defaultValue && (e3[t4.field] = t4.defaultValue), e3), {});
    return { ...e2.initialValues, ...t3 };
  }), c2 = i({}), l2 = p(() => Oe(e2.schemas.reduce((e3, t3) => (t3.rule && (e3[t3.field] = t3.rule.validator?.(ke, n2) ?? De()), e3), {})));
  return D(r2, (e3) => {
    e3?.forEach((e4) => {
      !o2.has(e4.field) && H(e4.componentProps) && o2.set(e4.field, e4.componentProps), n2.value[e4.field] ??= s2.value[e4.field] ?? "";
    });
  }, { immediate: !0 }), { formModel: n2, defaultFormValues: s2, validationSchema: l2, errors: c2, innerFormSchemas: r2, originComponentPropsFnMap: o2 };
}
var Ve = { class: "field" };
var He = ["for"];
var Ue = { class: "form-item-control" };
var We = W(e({ __name: "rx-form-item", props: n({ schema: { type: Object, required: !0 }, validationSchema: { type: Object, required: !0 } }, { modelValue: {}, modelModifiers: {}, errors: { type: Object, default: {} }, errorsModifiers: {} }), emits: ["update:modelValue", "update:errors"], setup(e2) {
  A((e3) => ({ v6503a4a1: b(F2), v76281784: b(l2).labelWidth }));
  let n2 = e2, i2 = E(e2, "modelValue"), a2 = E(e2, "errors"), { formProps: l2, formState: f2 } = $(), T2 = C(), O2 = p(() => `${n2.schema.field}-${T2}`), j2 = p(() => n2.schema.rule?.trigger || "change");
  D(i2, () => {
    z2();
  });
  let M2 = p(() => {
    let e3 = n2.schema.component;
    return U(e3) ? Re[e3] ?? P2(e3) : P2(e3);
  }), N2 = p(() => {
    let { schema: e3 } = n2, { formModel: t2 } = f2;
    return { field: e3.field, formModel: t2, schema: e3 };
  });
  function P2(e3, t2 = N2.value) {
    if (U(e3)) return k(_, null, [e3]);
    if (y(e3)) return e3;
    if (H(e3)) return P2(e3(t2));
    if (e3 && B(e3)) {
      let t3 = Object.keys(e3);
      return t3.some((e4) => e4.startsWith("_") || ["setup", "render"].includes(e4)) ? e3 : t3.reduce((t4, n3) => (t4[n3] = (...t5) => P2(e3[n3], ...t5), t4), {});
    }
    return e3;
  }
  let F2 = p(() => l2.layout === "horizontal" && l2.labelAlign === "right" ? "flex-end" : ""), I2 = p(() => ({ inputClass: "w-full", invalid: !!a2.value[n2.schema.field], ...n2.schema.componentProps })), L2 = p(() => H(n2.schema.label) ? n2.schema.label : () => n2.schema.label), R2 = p(() => {
    let { placeholder: e3 } = I2.value;
    return H(e3) ? e3() : e3;
  });
  function z2() {
    let e3 = n2.schema.field;
    if (!n2.validationSchema.shape?.[e3]) return;
    let t2 = n2.validationSchema.pick({ [e3]: !0 }).safeParse({ [e3]: i2.value });
    a2.value[e3] = "", t2.success || (a2.value[e3] = X(t2.error));
  }
  return o(async () => {
    n2.schema.componentProps?.request && (n2.schema.componentProps.options = await n2.schema.componentProps.request());
  }), (o2, f3) => {
    let p2 = we;
    return s(), g("div", Ve, [t(o2.$slots, `before-field-${n2.schema.field}`, {}, void 0, !0), h("div", { class: m(["form-item-row", b(l2).layout]) }, [e2.schema.label ? (s(), g("label", { key: 0, for: b(O2), class: m({ colon: b(l2).colon }) }, [(s(), w(c(b(L2))))], 10, He)) : S("", !0), h("div", Ue, [(s(), w(c(b(M2)), r(b(I2), { id: b(O2), modelValue: i2.value, "onUpdate:modelValue": f3[0] ||= (e3) => i2.value = e3, placeholder: b(R2), class: ["w-full", { "p-invalid": a2.value[e2.schema.field] }] }, { [u(b(j2))]: z2 }), null, 16, ["id", "modelValue", "placeholder", "class"])), a2.value[e2.schema.field] || !e2.schema.label ? (s(), w(p2, { key: 0, severity: "error", size: "small", variant: "simple", class: "error-message" }, { default: x(() => [d(v(a2.value[e2.schema.field]), 1)]), _: 1 })) : S("", !0), e2.schema.description ? (s(), w(c(e2.schema.description), { key: 1 })) : S("", !0)])], 2), t(o2.$slots, `after-field-${n2.schema.field}`, {}, void 0, !0)]);
  };
} }), [["__scopeId", "data-v-a310c92e"]]);
var Ge = { key: 0, class: "footer" };
var Ke = { class: "buttons" };
var qe = W(e({ __name: "rx-form", props: Ne, emits: Pe, setup(e2, { expose: n2, emit: r2 }) {
  A((e3) => ({ e03bf8ca: e3.labelWidth }));
  let i2 = e2, a2 = r2, o2 = Be({ props: i2, emit: a2 }), { formModel: c2, validationSchema: u2, errors: d2, innerFormSchemas: f2 } = o2;
  Q({ formState: o2, formProps: i2 });
  let m2 = ze({ emit: a2 }), { resetFields: v2, handleSubmit: y2 } = m2, C2 = p(() => f2.value.filter((e3) => !e3.vIf || e3.vIf({ formModel: c2 })));
  return n2({ ...o2, ...m2, submit: y2 }), (e3, n3) => {
    let r3 = be;
    return s(), g("form", { class: "rx-form", onSubmit: n3[1] ||= (...e4) => b(y2) && b(y2)(...e4) }, [(s(!0), g(_, null, T(b(C2), (r4) => (s(), w(We, { key: r4.field, modelValue: b(c2)[r4.field], "onUpdate:modelValue": (e4) => b(c2)[r4.field] = e4, errors: b(d2), "onUpdate:errors": n3[0] ||= (e4) => l(d2) ? d2.value = e4 : null, schema: r4, "validation-schema": b(u2) }, O({ _: 2 }, [T(e3.$slots, (n4, r5) => ({ name: r5, fn: x(() => [t(e3.$slots, r5, {}, void 0, !0)]) }))]), 1032, ["modelValue", "onUpdate:modelValue", "errors", "schema", "validation-schema"]))), 128)), e3.footer ? (s(), g("div", Ge, [t(e3.$slots, "footer", {}, () => [n3[2] ||= h("div", { class: "label" }, null, -1), h("div", Ke, [k(r3, { label: "Submit", type: "submit" }), k(r3, { label: "Reset", type: "button", class: "p-button-secondary", onClick: b(v2) }, null, 8, ["onClick"])])], !0)])) : S("", !0)], 32);
  };
} }), [["__scopeId", "data-v-96295b02"]]);
function Je(e2) {
  return e2;
}
export {qe as n,Je as t};
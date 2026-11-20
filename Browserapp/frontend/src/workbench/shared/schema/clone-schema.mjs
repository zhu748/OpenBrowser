import {
  A as j,
  B as M,
  C as N,
  D as P,
  F,
  G as listSymbols,
  H as L,
  I as R,
  K as z,
  L as ee,
  M as te,
  N as ne,
  O as re,
  P as ie,
  R as ae,
  T as oe,
  U as se,
  V as ce,
  W as valueTag,
  b as ue,
  j as fe,
  v as V,
  w as pe,
  y as me,
  z as he,
} from './dist-NctnpPRe.js';
import { t as isTypedArray } from './isTypedArray-BKgGJHFb.js';

function je(e2) {
  return e2 == null || (typeof e2 != 'object' && typeof e2 != 'function');
}
function cloneValue(e2, t2, n2, r2 = new Map(), i2 = undefined) {
  let a2 = i2?.(e2, t2, n2, r2);
  if (a2 !== undefined) return a2;
  if (je(e2)) return e2;
  if (r2.has(e2)) return r2.get(e2);
  if (Array.isArray(e2)) {
    let t3 = Array(e2.length);
    r2.set(e2, t3);
    for (let a3 = 0; a3 < e2.length; a3++)
      t3[a3] = cloneValue(e2[a3], a3, n2, r2, i2);
    return (
      Object.hasOwn(e2, 'index') && (t3.index = e2.index),
      Object.hasOwn(e2, 'input') && (t3.input = e2.input),
      t3
    );
  }
  if (e2 instanceof Date) return new Date(e2.getTime());
  if (e2 instanceof RegExp) {
    let t3 = new RegExp(e2.source, e2.flags);
    return ((t3.lastIndex = e2.lastIndex), t3);
  }
  if (e2 instanceof Map) {
    let t3 = new Map();
    r2.set(e2, t3);
    for (let [a3, o2] of e2) t3.set(a3, cloneValue(o2, a3, n2, r2, i2));
    return t3;
  }
  if (e2 instanceof Set) {
    let t3 = new Set();
    r2.set(e2, t3);
    for (let a3 of e2) t3.add(cloneValue(a3, undefined, n2, r2, i2));
    return t3;
  }
  if (z(e2)) return e2.subarray();
  if (isTypedArray(e2)) {
    let t3 = new (Object.getPrototypeOf(e2).constructor)(e2.length);
    r2.set(e2, t3);
    for (let a3 = 0; a3 < e2.length; a3++)
      t3[a3] = cloneValue(e2[a3], a3, n2, r2, i2);
    return t3;
  }
  if (
    e2 instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer < 'u' && e2 instanceof SharedArrayBuffer)
  )
    return e2.slice(0);
  if (e2 instanceof DataView) {
    let t3 = new DataView(e2.buffer.slice(0), e2.byteOffset, e2.byteLength);
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  if (typeof File < 'u' && e2 instanceof File) {
    let t3 = new File([e2], e2.name, { type: e2.type });
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  if (typeof Blob < 'u' && e2 instanceof Blob) {
    let t3 = new Blob([e2], { type: e2.type });
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  if (e2 instanceof Error) {
    let t3 = structuredClone(e2);
    return (
      r2.set(e2, t3),
      (t3.message = e2.message),
      (t3.name = e2.name),
      (t3.stack = e2.stack),
      (t3.cause = e2.cause),
      (t3.constructor = e2.constructor),
      copyProperties(t3, e2, n2, r2, i2),
      t3
    );
  }
  if (e2 instanceof Boolean) {
    let t3 = new Boolean(e2.valueOf());
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  if (e2 instanceof Number) {
    let t3 = new Number(e2.valueOf());
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  if (e2 instanceof String) {
    let t3 = new String(e2.valueOf());
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  if (typeof e2 == 'object' && hasCloneableTag(e2)) {
    let t3 = Object.create(Object.getPrototypeOf(e2));
    return (r2.set(e2, t3), copyProperties(t3, e2, n2, r2, i2), t3);
  }
  return e2;
}
function copyProperties(e2, t2, n2 = e2, r2, i2) {
  let a2 = [...Object.keys(t2), ...listSymbols(t2)];
  for (let o2 = 0; o2 < a2.length; o2++) {
    let s2 = a2[o2],
      c2 = Object.getOwnPropertyDescriptor(e2, s2);
    (c2 == null || c2.writable) &&
      (e2[s2] = cloneValue(t2[s2], s2, n2, r2, i2));
  }
}
function hasCloneableTag(e2) {
  switch (valueTag(e2)) {
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
      return true;
    default:
      return false;
  }
}
function cloneSchema(e2) {
  return cloneValue(e2, undefined, e2, new Map(), undefined);
}
export { cloneSchema };

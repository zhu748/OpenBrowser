import {Dt as e,Et as t,F as n,O as r,Ot as i,St as a,_t as o,bt as s,d as c,gt as l,k as u,mt as d,pt as f,st as p,vt as m,yt as h} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as g} from "./usetoast-DphSlejX.js";
var v;
var y = (e2) => v = e2;
var b = /* @__PURE__ */ Symbol();
function x(e2) {
  return e2 && typeof e2 == "object" && Object.prototype.toString.call(e2) === "[object Object]" && typeof e2.toJSON != "function";
}
function P() {
  let e2 = f(!0), t2 = e2.run(() => a({})), n2 = [], r2 = [], i2 = m({ install(e3) {
    y(i2), i2._a = e3, e3.provide(b, i2), e3.config.globalProperties.$pinia = i2, r2.forEach((e4) => n2.push(e4)), r2 = [];
  }, use(e3) {
    return this._a ? n2.push(e3) : r2.push(e3), this;
  }, _p: n2, _a: null, _e: e2, _s: /* @__PURE__ */ new Map(), state: t2 });
  return i2;
}
var F = () => {
};
function I(e2, t2, n2, r2 = F) {
  e2.add(t2);
  let i2 = () => {
    e2.delete(t2) && r2();
  };
  return !n2 && d() && h(i2), i2;
}
function L(e2, ...t2) {
  e2.forEach((e3) => {
    e3(...t2);
  });
}
var R = (e2) => e2();
var z = /* @__PURE__ */ Symbol();
var B = /* @__PURE__ */ Symbol();
function V(e2, t2) {
  e2 instanceof Map && t2 instanceof Map ? t2.forEach((t3, n2) => e2.set(n2, t3)) : e2 instanceof Set && t2 instanceof Set && t2.forEach(e2.add, e2);
  for (let n2 in t2) {
    if (!Object.hasOwn(t2, n2)) continue;
    let r2 = t2[n2], i2 = e2[n2];
    e2[n2] = x(i2) && x(r2) && Object.hasOwn(e2, n2) && !o(r2) && !l(r2) ? V(i2, r2) : r2;
  }
  return e2;
}
var H = /* @__PURE__ */ Symbol();
function U(e2) {
  return !e2 || typeof e2 != "object" || !Object.hasOwn(e2, H);
}
var { assign: W } = Object;
function G(e2) {
  return !!(o(e2) && e2.effect);
}
function K(e2, t2, n2, r2) {
  let { state: a2, actions: o2, getters: s2 } = t2, l2 = n2.state.value[e2], u2;
  function d2() {
    return l2 || (n2.state.value[e2] = a2 ? a2() : {}), W(i(n2.state.value[e2]), o2, Object.keys(s2 || {}).reduce((t3, r3) => (t3[r3] = m(c(() => {
      y(n2);
      let t4 = n2._s.get(e2);
      return s2[r3].call(t4, t4);
    })), t3), {}));
  }
  return u2 = q(e2, d2, t2, n2, r2, !0), u2;
}
function q(e2, r2, i2 = {}, a2, c2, u2) {
  let d2, m2 = W({ actions: {} }, i2), h2 = { deep: !0 }, g2, _2, v2 = /* @__PURE__ */ new Set(), b2 = /* @__PURE__ */ new Set(), x2, S2 = a2.state.value[e2];
  !u2 && !S2 && (a2.state.value[e2] = {});
  let C2;
  function w2(t2) {
    let r3;
    g2 = _2 = !1, typeof t2 == "function" ? (t2(a2.state.value[e2]), r3 = { type: "patch function", storeId: e2, events: x2 }) : (V(a2.state.value[e2], t2), r3 = { type: "patch object", payload: t2, storeId: e2, events: x2 });
    let i3 = C2 = /* @__PURE__ */ Symbol();
    n().then(() => {
      C2 === i3 && (g2 = !0);
    }), _2 = !0, L(v2, r3, a2.state.value[e2]);
  }
  let T2 = u2 ? function() {
    let { state: e3 } = i2, t2 = e3 ? e3() : {};
    this.$patch((e4) => {
      W(e4, t2);
    });
  } : F;
  function E2() {
    d2.stop(), v2.clear(), b2.clear(), a2._s.delete(e2);
  }
  let D2 = (t2, n2 = "") => {
    if (z in t2) return t2[B] = n2, t2;
    let r3 = function() {
      y(a2);
      let n3 = Array.from(arguments), i3 = /* @__PURE__ */ new Set(), o2 = /* @__PURE__ */ new Set();
      function s2(e3) {
        i3.add(e3);
      }
      function c3(e3) {
        o2.add(e3);
      }
      L(b2, { args: n3, name: r3[B], store: k2, after: s2, onError: c3 });
      let l2;
      try {
        l2 = t2.apply(this && this.$id === e2 ? this : k2, n3);
      } catch (e3) {
        throw L(o2, e3), e3;
      }
      return l2 instanceof Promise ? l2.then((e3) => (L(i3, e3), e3)).catch((e3) => (L(o2, e3), Promise.reject(e3))) : (L(i3, l2), l2);
    };
    return r3[z] = !0, r3[B] = n2, r3;
  }, O2 = { _p: a2, $id: e2, $onAction: I.bind(null, b2), $patch: w2, $reset: T2, $subscribe(t2, n2 = {}) {
    if (v2.has(t2)) return F;
    let r3 = I(v2, t2, n2.detached, () => i3()), i3 = d2.run(() => p(() => a2.state.value[e2], (r4) => {
      (n2.flush === "sync" ? _2 : g2) && t2({ storeId: e2, type: "direct", events: x2 }, r4);
    }, W({}, h2, n2)));
    return r3;
  }, $dispose: E2 }, k2 = s(O2);
  a2._s.set(e2, k2);
  let A2 = (a2._a && a2._a.runWithContext || R)(() => a2._e.run(() => (d2 = f()).run(() => r2({ action: D2 }))));
  for (let t2 in A2) {
    let n2 = A2[t2];
    o(n2) && !G(n2) || l(n2) ? u2 || (S2 && U(n2) && (o(n2) ? n2.value = S2[t2] : ((n2 instanceof Set || n2 instanceof Map) && n2.clear(), V(n2, S2[t2]))), a2.state.value[e2][t2] = n2) : typeof n2 == "function" && (A2[t2] = D2(n2, t2), m2.actions[t2] = n2);
  }
  return W(k2, A2), W(t(k2), A2), Object.defineProperty(k2, "$state", { get: () => a2.state.value[e2], set: (e3) => {
    w2((t2) => {
      W(t2, e3);
    });
  } }), a2._p.forEach((e3) => {
    let t2 = d2.run(() => e3({ store: k2, app: a2._a, pinia: a2, options: m2 }));
    W(k2, t2);
  }), S2 && u2 && i2.hydrate && i2.hydrate(k2.$state, S2), g2 = !0, _2 = !0, k2;
}
function J(e2, t2, n2) {
  let i2, a2 = typeof t2 == "function";
  i2 = a2 ? n2 : t2;
  function o2(n3, o3) {
    let s2 = r();
    return n3 ||= s2 ? u(b, null) : null, n3 && y(n3), n3 = v, n3._s.has(e2) || (a2 ? q(e2, t2, i2, n3) : K(e2, i2, n3)), n3._s.get(e2);
  }
  return o2.$id = e2, o2;
}
function Y(n2) {
  let r2 = t(n2), i2 = {};
  for (let t2 in r2) {
    let a2 = r2[t2];
    a2?.effect ? i2[t2] = c({ get: () => n2[t2], set(e2) {
      n2[t2] = e2;
    } }) : (o(a2) || l(a2)) && (i2[t2] = e(n2, t2));
  }
  return i2;
}
function X() {
  let e2 = g(), t2 = { success: $t("\u64CD\u4F5C\u6210\u529F"), error: $t("\u64CD\u4F5C\u5931\u8D25") };
  function n2(n3, r3, i2) {
    n3 === 0 ? e2.add({ severity: "success", summary: t2.success, detail: r3, ...Object.assign({ life: 3e3 }, i2) }) : e2.add({ severity: "error", summary: t2.error, detail: r3, ...Object.assign({ life: 3e3 }, i2) });
  }
  function r2(n3, r3, i2) {
    n3 !== 0 && e2.add({ severity: "error", summary: t2.error, detail: r3, ...Object.assign({ life: 5e3 }, i2) });
  }
  return [n2, r2];
}
var $ = J("agent", () => {
  let ready = a(!1);
  const init = async () => {
    const info = await globalThis.__agentRequest("info");
    ready.value = info.ready;
  };
  return { serverUrl: c(() => ready.value ? "obui://app" : ""), isReady: ready, initialized: ready, health: s({ isOk: !0, status: "ready", loading: !1 }), initMcp: init, ensureServer: init, waitUntilReady: init, markAgentChannelConnecting() {
  }, markAgentChannelFailure(message) {
    console.error(message);
  }, markAgentChannelReady() {
    ready.value = !0;
  }, markAgentChannelStopped() {
    ready.value = !1;
  } };
});
export {Y as a,J as i,X as n,P as r,$ as t};
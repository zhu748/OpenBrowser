import {C as e,H as t,J as n,P as r,V as i,W as a,Z as o,d as s,jt as c,lt as l,p as u} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {n as d,t as f} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {i as p,o as m,r as h} from "./motion-BwnyBP9B.js";
var g = 0;
function _(e2) {
  let t2 = /* @__PURE__ */ new Map();
  function n2(t3) {
    if (e2.props.mode !== "popLayout") return;
    let n3 = t3.el, r3 = n3.offsetParent, i3 = r3 instanceof HTMLElement && r3.offsetWidth || 0, a3 = { height: n3.offsetHeight || 0, width: n3.offsetWidth || 0, top: n3.offsetTop, left: n3.offsetLeft, right: 0 };
    a3.right = i3 - a3.width - a3.left;
    let o3 = e2.props.anchorX === "left" ? `left: ${a3.left}px` : `right: ${a3.right}px`, s3 = `pop-${g++}`;
    n3.dataset.motionPopId = s3;
    let c2 = document.createElement("style"), l2 = e2.getNonce();
    l2 && (c2.nonce = l2), t3.popStyle = c2, document.head.appendChild(c2), c2.sheet && c2.sheet.insertRule(`
    [data-motion-pop-id="${s3}"] {
      position: absolute !important;
      width: ${a3.width}px !important;
      height: ${a3.height}px !important;
      top: ${a3.top}px !important;
      ${o3} !important;
      }
      `);
  }
  function r2(e3) {
    let t3 = e3.popStyle;
    t3 && (e3.popStyle = void 0, m.render(() => {
      document.head.removeChild(t3);
    }));
  }
  function i2(e3, r3, i3) {
    let a3 = { el: e3, states: r3, done: i3, aborted: !1 };
    t2.set(e3, a3), n2(a3);
    let s3 = r3.map((e4) => e4.getFeature("exit")?.exit() ?? Promise.resolve());
    Promise.all(s3).then(() => {
      a3.aborted || o2(a3);
    });
  }
  function a2(e3) {
    let n3 = t2.get(e3);
    n3 && (n3.aborted = !0, t2.delete(e3), r2(n3));
  }
  function o2(n3) {
    t2.delete(n3.el), r2(n3), n3.states.forEach((e3) => {
      e3.getSnapshot(!1);
    }), n3.done(), n3.el.isConnected || n3.states.forEach((e3) => {
      e3.unmount();
    }), e2.onAllComplete();
  }
  function s2() {
    t2.forEach((e3) => {
      e3.states.forEach((e4) => {
        e4.unmount();
      });
    }), t2.clear();
  }
  return { track: i2, abort: a2, dispose: s2 };
}
function v(e2) {
  let n2 = p(), r2 = _({ props: e2, getNonce: () => n2.value.nonce, onAllComplete: () => e2.onExitComplete?.() }), a2 = /* @__PURE__ */ new Set(), o2 = !1;
  h({ get initial() {
    return o2 ? void 0 : e2.initial;
  }, get custom() {
    return e2.custom;
  }, register: (e3) => a2.add(e3), unregister: (e3) => a2.delete(e3) }), i(() => {
    o2 = !0;
  });
  function s2(e3) {
    let t2 = [];
    for (let n3 of a2) {
      let r3 = n3.element;
      r3 && (r3 === e3 || e3.contains(r3)) && t2.push(n3);
    }
    return t2;
  }
  function c2(e3, t2) {
    r2.abort(e3), s2(e3).forEach((e4) => {
      e4.getFeature("exit")?.reenter();
    }), t2();
  }
  function l2(t2, n3) {
    let i2 = t2, a3 = s2(i2);
    a3.length === 0 ? (n3(), e2.onExitComplete?.()) : r2.track(i2, a3, n3);
  }
  return t(() => {
    r2.dispose();
  }), { enter: c2, exit: l2 };
}
var y = e({ name: "AnimatePresence", inheritAttrs: !0, __name: "AnimatePresence", props: { mode: { default: "sync" }, initial: { type: Boolean, default: !0 }, as: {}, custom: {}, onExitComplete: {}, anchorX: { default: "left" } }, setup(e2) {
  let t2 = e2, { enter: i2, exit: p2 } = v(t2), m2 = s(() => t2.mode === "wait" ? { mode: t2.mode === "wait" ? "out-in" : void 0 } : { tag: t2.as });
  return (e3, t3) => (a(), u(o(e3.mode === "wait" ? f : d), r(m2.value, { appear: "", css: !1, onLeave: c(p2), onEnter: c(i2) }), { default: l(() => [n(e3.$slots, "default")]), _: 3 }, 16, ["onLeave", "onEnter"]));
} });
export {y as t};
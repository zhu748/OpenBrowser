import {C as e,F as t,P as n,S as r,St as i,V as a,W as o,d as s,jt as c,m as l,nt as u,p as d,st as f,w as p,xt as m} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {s as h} from "./runtime-dom.esm-bundler-_WxS4Zar.js";
import {t as g} from "./preload-helper-BLdHbfdN.js";
import {t as _} from "./_plugin-vue_export-helper-BDNMzG2s.js";
import {C as v,M as y,O as b,a as x,b as S,d as C,n as w,r as T,t as E,u as D,x as ee,y as O} from "./dist-DPswMdzV.js";
function j(...e2) {
  if (e2) {
    let t2 = [];
    for (let n2 = 0; n2 < e2.length; n2++) {
      let r2 = e2[n2];
      if (!r2) continue;
      let i2 = typeof r2;
      if (i2 === "string" || i2 === "number") t2.push(r2);
      else if (i2 === "object") {
        let e3 = Array.isArray(r2) ? [j(...r2)] : Object.entries(r2).map(([e4, t3]) => t3 ? e4 : void 0);
        t2 = e3.length ? t2.concat(e3.filter((e4) => !!e4)) : t2;
      }
    }
    return t2.join(" ").trim();
  }
}
function M(e2, t2) {
  return e2 ? e2.classList ? e2.classList.contains(t2) : RegExp("(^| )" + t2 + "( |$)", "gi").test(e2.className) : !1;
}
function N(e2, t2) {
  if (e2 && t2) {
    let n2 = (t3) => {
      M(e2, t3) || (e2.classList ? e2.classList.add(t3) : e2.className += " " + t3);
    };
    [t2].flat().filter(Boolean).forEach((e3) => e3.split(" ").forEach(n2));
  }
}
function te() {
  return window.innerWidth - document.documentElement.offsetWidth;
}
function ne(e2) {
  typeof e2 == "string" ? N(document.body, e2 || "p-overflow-hidden") : (e2 != null && e2.variableName && document.body.style.setProperty(e2.variableName, te() + "px"), N(document.body, e2?.className || "p-overflow-hidden"));
}
function re(e2) {
  if (e2) {
    let t2 = document.createElement("a");
    if (t2.download !== void 0) {
      let { name: n2, src: r2 } = e2;
      return t2.setAttribute("href", r2), t2.setAttribute("download", n2), t2.style.display = "none", document.body.appendChild(t2), t2.click(), document.body.removeChild(t2), !0;
    }
  }
  return !1;
}
function ie(e2, t2) {
  let n2 = new Blob([e2], { type: "application/csv;charset=utf-8;" });
  window.navigator.msSaveOrOpenBlob ? navigator.msSaveOrOpenBlob(n2, t2 + ".csv") : re({ name: t2 + ".csv", src: URL.createObjectURL(n2) }) || (e2 = "data:text/csv;charset=utf-8," + e2, window.open(encodeURI(e2)));
}
function P(e2, t2) {
  if (e2 && t2) {
    let n2 = (t3) => {
      e2.classList ? e2.classList.remove(t3) : e2.className = e2.className.replace(RegExp("(^|\\b)" + t3.split(" ").join("|") + "(\\b|$)", "gi"), " ");
    };
    [t2].flat().filter(Boolean).forEach((e3) => e3.split(" ").forEach(n2));
  }
}
function ae(e2) {
  typeof e2 == "string" ? P(document.body, e2 || "p-overflow-hidden") : (e2 != null && e2.variableName && document.body.style.removeProperty(e2.variableName), P(document.body, e2?.className || "p-overflow-hidden"));
}
function F(e2) {
  for (let t2 of document?.styleSheets) try {
    for (let n2 of t2?.cssRules) for (let t3 of n2?.style) if (e2.test(t3)) return { name: t3, value: n2.style.getPropertyValue(t3).trim() };
  } catch {
  }
  return null;
}
function oe(e2) {
  let t2 = { width: 0, height: 0 };
  if (e2) {
    let [n2, r2] = [e2.style.visibility, e2.style.display], i2 = e2.getBoundingClientRect();
    e2.style.visibility = "hidden", e2.style.display = "block", t2.width = i2.width || e2.offsetWidth, t2.height = i2.height || e2.offsetHeight, e2.style.display = r2, e2.style.visibility = n2;
  }
  return t2;
}
function I() {
  let e2 = window, t2 = document, n2 = t2.documentElement, r2 = t2.getElementsByTagName("body")[0];
  return { width: e2.innerWidth || n2.clientWidth || r2.clientWidth, height: e2.innerHeight || n2.clientHeight || r2.clientHeight };
}
function se(e2) {
  return e2 ? Math.abs(e2.scrollLeft) : 0;
}
function ce() {
  let e2 = document.documentElement;
  return (window.pageXOffset || se(e2)) - (e2.clientLeft || 0);
}
function le() {
  let e2 = document.documentElement;
  return (window.pageYOffset || e2.scrollTop) - (e2.clientTop || 0);
}
function ue(e2) {
  return e2 ? getComputedStyle(e2).direction === "rtl" : !1;
}
function de(e2, t2, n2 = !0) {
  if (e2) {
    let r2 = e2.offsetParent ? { width: e2.offsetWidth, height: e2.offsetHeight } : oe(e2), i2 = r2.height, a2 = r2.width, o2 = t2.offsetHeight, s2 = t2.offsetWidth, c2 = t2.getBoundingClientRect(), l2 = le(), u2 = ce(), d2 = I(), f2, p2, m2 = "top";
    c2.top + o2 + i2 > d2.height ? (f2 = c2.top + l2 - i2, m2 = "bottom", f2 < 0 && (f2 = l2)) : f2 = o2 + c2.top + l2, p2 = c2.left + a2 > d2.width ? Math.max(0, c2.left + u2 + s2 - a2) : c2.left + u2, ue(e2) ? e2.style.insetInlineEnd = p2 + "px" : e2.style.insetInlineStart = p2 + "px", e2.style.top = f2 + "px", e2.style.transformOrigin = m2, n2 && (e2.style.marginTop = m2 === "bottom" ? `calc(${F(/-anchor-gutter$/)?.value ?? "2px"} * -1)` : F(/-anchor-gutter$/)?.value ?? "");
  }
}
function fe(e2, t2) {
  e2 && (typeof t2 == "string" ? e2.style.cssText = t2 : Object.entries(t2 || {}).forEach(([t3, n2]) => e2.style[t3] = n2));
}
function pe(e2, t2) {
  if (e2 instanceof HTMLElement) {
    let n2 = e2.offsetWidth;
    if (t2) {
      let t3 = getComputedStyle(e2);
      n2 += parseFloat(t3.marginLeft) + parseFloat(t3.marginRight);
    }
    return n2;
  }
  return 0;
}
function me(e2, t2, n2 = !0, r2 = void 0) {
  if (e2) {
    let i2 = e2.offsetParent ? { width: e2.offsetWidth, height: e2.offsetHeight } : oe(e2), a2 = t2.offsetHeight, o2 = t2.getBoundingClientRect(), s2 = I(), c2, l2, u2 = r2 ?? "top";
    if (!r2 && o2.top + a2 + i2.height > s2.height ? (c2 = -1 * i2.height, u2 = "bottom", o2.top + c2 < 0 && (c2 = -1 * o2.top)) : c2 = a2, l2 = i2.width > s2.width ? o2.left * -1 : o2.left + i2.width > s2.width ? (o2.left + i2.width - s2.width) * -1 : 0, e2.style.top = c2 + "px", e2.style.insetInlineStart = l2 + "px", e2.style.transformOrigin = u2, n2) {
      let t3 = F(/-anchor-gutter$/)?.value;
      e2.style.marginTop = u2 === "bottom" ? `calc(${t3 ?? "2px"} * -1)` : t3 ?? "";
    }
  }
}
function L(e2) {
  if (e2) {
    let t2 = e2.parentNode;
    return t2 && t2 instanceof ShadowRoot && t2.host && (t2 = t2.host), t2;
  }
  return null;
}
function he(e2) {
  return !!(e2 != null && e2.nodeName && L(e2));
}
function R(e2) {
  return typeof Element < "u" ? e2 instanceof Element : typeof e2 == "object" && !!e2 && e2.nodeType === 1 && typeof e2.nodeName == "string";
}
var z;
function ge(e2) {
  if (e2) {
    let t2 = getComputedStyle(e2);
    return e2.offsetWidth - e2.clientWidth - parseFloat(t2.borderLeftWidth) - parseFloat(t2.borderRightWidth);
  }
  {
    if (z != null) return z;
    let e3 = document.createElement("div");
    fe(e3, { width: "100px", height: "100px", overflow: "scroll", position: "absolute", top: "-9999px" }), document.body.appendChild(e3);
    let t2 = e3.offsetWidth - e3.clientWidth;
    return document.body.removeChild(e3), z = t2, t2;
  }
}
function _e() {
  if (window.getSelection) {
    let e2 = window.getSelection() || {};
    e2.empty ? e2.empty() : e2.removeAllRanges && e2.rangeCount > 0 && e2.getRangeAt(0).getClientRects().length > 0 && e2.removeAllRanges();
  }
}
function B(e2, t2 = {}) {
  if (R(e2)) {
    let n2 = (t3, r2) => {
      var i2;
      let a2 = (i2 = e2?.$attrs) != null && i2[t3] ? [e2?.$attrs?.[t3]] : [];
      return [r2].flat().reduce((e3, r3) => {
        if (r3 != null) {
          let i3 = typeof r3;
          if (i3 === "string" || i3 === "number") e3.push(r3);
          else if (i3 === "object") {
            let i4 = Array.isArray(r3) ? n2(t3, r3) : Object.entries(r3).map(([e4, n3]) => t3 === "style" && (n3 || n3 === 0) ? `${e4.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}:${n3}` : n3 ? e4 : void 0);
            e3 = i4.length ? e3.concat(i4.filter((e4) => !!e4)) : e3;
          }
        }
        return e3;
      }, a2);
    };
    Object.entries(t2).forEach(([t3, r2]) => {
      if (r2 != null) {
        let i2 = t3.match(/^on(.+)/);
        i2 ? e2.addEventListener(i2[1].toLowerCase(), r2) : t3 === "p-bind" || t3 === "pBind" ? B(e2, r2) : (r2 = t3 === "class" ? [...new Set(n2("class", r2))].join(" ").trim() : t3 === "style" ? n2("style", r2).join(";").trim() : r2, (e2.$attrs = e2.$attrs || {}) && (e2.$attrs[t3] = r2), e2.setAttribute(t3, r2));
      }
    });
  }
}
function ve(e2, t2 = {}, ...n2) {
  if (e2) {
    let r2 = document.createElement(e2);
    return B(r2, t2), r2.append(...n2), r2;
  }
}
function ye(e2, t2) {
  if (e2) {
    e2.style.opacity = "0";
    let n2 = +/* @__PURE__ */ new Date(), r2 = "0", i2 = function() {
      r2 = `${+e2.style.opacity + ((/* @__PURE__ */ new Date()).getTime() - n2) / t2}`, e2.style.opacity = r2, n2 = +/* @__PURE__ */ new Date(), +r2 < 1 && ("requestAnimationFrame" in window ? requestAnimationFrame(i2) : setTimeout(i2, 16));
    };
    i2();
  }
}
function be(e2, t2) {
  return R(e2) ? Array.from(e2.querySelectorAll(t2)) : [];
}
function V(e2, t2) {
  return R(e2) ? e2.matches(t2) ? e2 : e2.querySelector(t2) : null;
}
function xe(e2, t2) {
  e2 && document.activeElement !== e2 && e2.focus(t2);
}
function Se(e2, t2) {
  if (R(e2)) {
    let n2 = e2.getAttribute(t2);
    return isNaN(n2) ? n2 === "true" || n2 === "false" ? n2 === "true" : n2 : +n2;
  }
}
function H(e2, t2 = "") {
  let n2 = be(e2, `button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            [href]:not([tabindex = "-1"]):not([style*="display:none"]):not([hidden])${t2},
            input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2}`), r2 = [];
  for (let e3 of n2) getComputedStyle(e3).display != "none" && getComputedStyle(e3).visibility != "hidden" && r2.push(e3);
  return r2;
}
function Ce(e2, t2) {
  let n2 = H(e2, t2);
  return n2.length > 0 ? n2[0] : null;
}
function we(e2) {
  if (e2) {
    let t2 = e2.offsetHeight, n2 = getComputedStyle(e2);
    return t2 -= parseFloat(n2.paddingTop) + parseFloat(n2.paddingBottom) + parseFloat(n2.borderTopWidth) + parseFloat(n2.borderBottomWidth), t2;
  }
  return 0;
}
function Te(e2) {
  if (e2) {
    let [t2, n2] = [e2.style.visibility, e2.style.display];
    e2.style.visibility = "hidden", e2.style.display = "block";
    let r2 = e2.offsetHeight;
    return e2.style.display = n2, e2.style.visibility = t2, r2;
  }
  return 0;
}
function Ee(e2) {
  if (e2) {
    let [t2, n2] = [e2.style.visibility, e2.style.display];
    e2.style.visibility = "hidden", e2.style.display = "block";
    let r2 = e2.offsetWidth;
    return e2.style.display = n2, e2.style.visibility = t2, r2;
  }
  return 0;
}
function De(e2) {
  if (e2) {
    let t2 = L(e2)?.childNodes, n2 = 0;
    if (t2) for (let r2 = 0; r2 < t2.length; r2++) {
      if (t2[r2] === e2) return n2;
      t2[r2].nodeType === 1 && n2++;
    }
  }
  return -1;
}
function Oe(e2, t2) {
  let n2 = H(e2, t2);
  return n2.length > 0 ? n2[n2.length - 1] : null;
}
function ke(e2, t2) {
  let n2 = e2.nextElementSibling;
  for (; n2; ) {
    if (n2.matches(t2)) return n2;
    n2 = n2.nextElementSibling;
  }
  return null;
}
function Ae(e2) {
  if (e2) {
    let t2 = e2.getBoundingClientRect();
    return { top: t2.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0), left: t2.left + (window.pageXOffset || se(document.documentElement) || se(document.body) || 0) };
  }
  return { top: "auto", left: "auto" };
}
function je(e2, t2) {
  if (e2) {
    let n2 = e2.offsetHeight;
    if (t2) {
      let t3 = getComputedStyle(e2);
      n2 += parseFloat(t3.marginTop) + parseFloat(t3.marginBottom);
    }
    return n2;
  }
  return 0;
}
function Me(e2, t2 = []) {
  let n2 = L(e2);
  return n2 === null ? t2 : Me(n2, t2.concat([n2]));
}
function Ne(e2, t2) {
  let n2 = e2.previousElementSibling;
  for (; n2; ) {
    if (n2.matches(t2)) return n2;
    n2 = n2.previousElementSibling;
  }
  return null;
}
function Pe(e2) {
  let t2 = [];
  if (e2) {
    let n2 = Me(e2), r2 = /(auto|scroll)/, i2 = (e3) => {
      try {
        let t3 = window.getComputedStyle(e3, null);
        return r2.test(t3.getPropertyValue("overflow")) || r2.test(t3.getPropertyValue("overflowX")) || r2.test(t3.getPropertyValue("overflowY"));
      } catch {
        return !1;
      }
    };
    for (let e3 of n2) {
      let n3 = e3.nodeType === 1 && e3.dataset.scrollselectors;
      if (n3) {
        let r3 = n3.split(",");
        for (let n4 of r3) {
          let r4 = V(e3, n4);
          r4 && i2(r4) && t2.push(r4);
        }
      }
      e3.nodeType !== 9 && i2(e3) && t2.push(e3);
    }
  }
  return t2;
}
function Fe() {
  if (window.getSelection) return window.getSelection().toString();
  if (document.getSelection) return document.getSelection().toString();
}
function Le(e2) {
  if (e2) {
    let t2 = e2.offsetWidth, n2 = getComputedStyle(e2);
    return t2 -= parseFloat(n2.paddingLeft) + parseFloat(n2.paddingRight) + parseFloat(n2.borderLeftWidth) + parseFloat(n2.borderRightWidth), t2;
  }
  return 0;
}
function Re(e2, t2, n2) {
  let r2 = e2[t2];
  typeof r2 == "function" && r2.apply(e2, n2 ?? []);
}
function ze() {
  return /(android)/i.test(navigator.userAgent);
}
function Be(e2) {
  if (e2) {
    let t2 = e2.nodeName, n2 = e2.parentElement && e2.parentElement.nodeName;
    return t2 === "INPUT" || t2 === "TEXTAREA" || t2 === "BUTTON" || t2 === "A" || n2 === "INPUT" || n2 === "TEXTAREA" || n2 === "BUTTON" || n2 === "A" || !!e2.closest(".p-button, .p-checkbox, .p-radiobutton");
  }
  return !1;
}
function Ve() {
  return !!(typeof window < "u" && window.document && window.document.createElement);
}
function He(e2, t2 = "") {
  return R(e2) ? e2.matches(`button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2},
            [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${t2}`) : !1;
}
function Ue(e2) {
  return !!(e2 && e2.offsetParent != null);
}
function We() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}
function Ge(e2, t2) {
  if (e2) {
    let n2 = e2.parentElement, r2 = Ae(n2), i2 = I(), a2 = e2.offsetParent ? e2.offsetWidth : Ee(e2), o2 = e2.offsetParent ? e2.offsetHeight : Te(e2), s2 = pe(n2?.children?.[0]), c2 = je(n2?.children?.[0]), l2 = "", u2 = "";
    r2.left + s2 + a2 > i2.width - ge() ? r2.left < a2 ? t2 % 2 == 1 ? l2 = r2.left ? "-" + r2.left + "px" : "100%" : t2 % 2 == 0 && (l2 = i2.width - a2 - ge() + "px") : l2 = "-100%" : l2 = "100%", u2 = e2.getBoundingClientRect().top + c2 + o2 > i2.height ? `-${o2 - c2}px` : "0px", e2.style.top = u2, e2.style.insetInlineStart = l2;
  }
}
function Ke(e2, t2 = "", n2) {
  R(e2) && n2 != null && e2.setAttribute(t2, n2);
}
var qe = `
    *,
    ::before,
    ::after {
        box-sizing: border-box;
    }

    .p-collapsible-enter-active {
        animation: p-animate-collapsible-expand 0.2s ease-out;
        overflow: hidden;
    }

    .p-collapsible-leave-active {
        animation: p-animate-collapsible-collapse 0.2s ease-out;
        overflow: hidden;
    }

    @keyframes p-animate-collapsible-expand {
        from {
            grid-template-rows: 0fr;
        }
        to {
            grid-template-rows: 1fr;
        }
    }

    @keyframes p-animate-collapsible-collapse {
        from {
            grid-template-rows: 1fr;
        }
        to {
            grid-template-rows: 0fr;
        }
    }

    .p-disabled,
    .p-disabled * {
        cursor: default;
        pointer-events: none;
        user-select: none;
    }

    .p-disabled,
    .p-component:disabled {
        opacity: dt('disabled.opacity');
    }

    .pi {
        font-size: dt('icon.size');
    }

    .p-icon {
        width: dt('icon.size');
        height: dt('icon.size');
    }

    .p-overlay-mask {
        background: var(--px-mask-background, dt('mask.background'));
        color: dt('mask.color');
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .p-overlay-mask-enter-active {
        animation: p-animate-overlay-mask-enter dt('mask.transition.duration') forwards;
    }

    .p-overlay-mask-leave-active {
        animation: p-animate-overlay-mask-leave dt('mask.transition.duration') forwards;
    }

    @keyframes p-animate-overlay-mask-enter {
        from {
            background: transparent;
        }
        to {
            background: var(--px-mask-background, dt('mask.background'));
        }
    }
    @keyframes p-animate-overlay-mask-leave {
        from {
            background: var(--px-mask-background, dt('mask.background'));
        }
        to {
            background: transparent;
        }
    }

    .p-anchored-overlay-enter-active {
        animation: p-animate-anchored-overlay-enter 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-anchored-overlay-leave-active {
        animation: p-animate-anchored-overlay-leave 300ms cubic-bezier(.19,1,.22,1);
    }

    @keyframes p-animate-anchored-overlay-enter {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-anchored-overlay-leave {
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`;
function U(e2) {
  "@babel/helpers - typeof";
  return U = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, U(e2);
}
function Je(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function Ye(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? Je(Object(n2), !0).forEach(function(t3) {
      Xe(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : Je(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function Xe(e2, t2, n2) {
  return (t2 = Ze(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function Ze(e2) {
  var t2 = Qe(e2, "string");
  return U(t2) == "symbol" ? t2 : t2 + "";
}
function Qe(e2, t2) {
  if (U(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (U(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function $e(e2) {
  var n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  p() && p().components ? a(e2) : n2 ? e2() : t(e2);
}
var et = 0;
function tt(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n2 = i(!1), r2 = i(e2), a2 = i(null), o2 = Ve() ? window.document : void 0, s2 = t2.document, c2 = s2 === void 0 ? o2 : s2, l2 = t2.immediate, u2 = l2 === void 0 || l2, d2 = t2.manual, p2 = d2 !== void 0 && d2, h2 = t2.name, g2 = h2 === void 0 ? `style_${++et}` : h2, _2 = t2.id, v2 = _2 === void 0 ? void 0 : _2, y2 = t2.media, b2 = y2 === void 0 ? void 0 : y2, x2 = t2.nonce, S2 = x2 === void 0 ? void 0 : x2, C2 = t2.first, w2 = C2 !== void 0 && C2, T2 = t2.onMounted, E2 = T2 === void 0 ? void 0 : T2, D2 = t2.onUpdated, ee2 = D2 === void 0 ? void 0 : D2, O2 = t2.onLoad, k2 = O2 === void 0 ? void 0 : O2, A2 = t2.props, j2 = A2 === void 0 ? {} : A2, M2 = function() {
  }, N2 = function(t3) {
    var i2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (c2) {
      var o3 = Ye(Ye({}, j2), i2), s3 = o3.name || g2, l3 = o3.id || v2, u3 = o3.nonce || S2;
      a2.value = c2.querySelector(`style[data-primevue-style-id="${s3}"]`) || c2.getElementById(l3) || c2.createElement("style"), a2.value.isConnected || (r2.value = t3 || e2, B(a2.value, { type: "text/css", id: l3, media: b2, nonce: u3 }), w2 ? c2.head.prepend(a2.value) : c2.head.appendChild(a2.value), Ke(a2.value, "data-primevue-style-id", s3), B(a2.value, o3), a2.value.onload = function(e3) {
        return k2?.(e3, { name: s3 });
      }, E2?.(s3)), !n2.value && (M2 = f(r2, function(e3) {
        a2.value.textContent = e3, ee2?.(s3);
      }, { immediate: !0 }), n2.value = !0);
    }
  };
  return u2 && !p2 && $e(N2), { id: v2, name: g2, el: a2, css: r2, unload: function() {
    c2 && n2.value && (M2(), he(a2.value) && c2.head.removeChild(a2.value), n2.value = !1, a2.value = null);
  }, load: N2, isLoaded: m(n2) };
}
function W(e2) {
  "@babel/helpers - typeof";
  return W = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, W(e2);
}
var nt;
var rt;
var it;
var at;
function ot(e2, t2) {
  return dt(e2) || ut(e2, t2) || ct(e2, t2) || st();
}
function st() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ct(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return lt(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? lt(e2, t2) : void 0;
  }
}
function lt(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function ut(e2, t2) {
  var n2 = e2 == null ? null : typeof Symbol < "u" && e2[Symbol.iterator] || e2["@@iterator"];
  if (n2 != null) {
    var r2, i2, a2, o2, s2 = [], c2 = !0, l2 = !1;
    try {
      if (a2 = (n2 = n2.call(e2)).next, t2 !== 0) for (; !(c2 = (r2 = a2.call(n2)).done) && (s2.push(r2.value), s2.length !== t2); c2 = !0) ;
    } catch (e3) {
      l2 = !0, i2 = e3;
    } finally {
      try {
        if (!c2 && n2.return != null && (o2 = n2.return(), Object(o2) !== o2)) return;
      } finally {
        if (l2) throw i2;
      }
    }
    return s2;
  }
}
function dt(e2) {
  if (Array.isArray(e2)) return e2;
}
function ft(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function G(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? ft(Object(n2), !0).forEach(function(t3) {
      pt(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : ft(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function pt(e2, t2, n2) {
  return (t2 = mt(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function mt(e2) {
  var t2 = ht(e2, "string");
  return W(t2) == "symbol" ? t2 : t2 + "";
}
function ht(e2, t2) {
  if (W(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (W(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
function K(e2, t2) {
  return t2 ||= e2.slice(0), Object.freeze(Object.defineProperties(e2, { raw: { value: Object.freeze(t2) } }));
}
var q = { name: "base", css: function(e2) {
  var t2 = e2.dt;
  return `
.p-hidden-accessible {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    opacity: 0;
    overflow: hidden;
    padding: 0;
    pointer-events: none;
    position: absolute;
    white-space: nowrap;
    width: 1px;
}

.p-overflow-hidden {
    overflow: hidden;
    padding-right: ${t2("scrollbar.width")};
}
`;
}, style: qe, classes: {}, inlineStyles: {}, load: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n2 = (arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : function(e3) {
    return e3;
  })(x(nt ||= K(["", ""]), e2));
  return y(n2) ? tt(O(n2), G({ name: this.name }, t2)) : {};
}, loadCSS: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  return this.load(this.css, e2);
}, loadStyle: function() {
  var e2 = this, t2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  return this.load(this.style, t2, function() {
    var r2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
    return T.transformCSS(t2.name || e2.name, `${r2}${x(rt ||= K(["", ""]), n2)}`);
  });
}, getCommonTheme: function(e2) {
  return T.getCommon(this.name, e2);
}, getComponentTheme: function(e2) {
  return T.getComponent(this.name, e2);
}, getDirectiveTheme: function(e2) {
  return T.getDirective(this.name, e2);
}, getPresetTheme: function(e2, t2, n2) {
  return T.getCustomPreset(this.name, e2, t2, n2);
}, getLayerOrderThemeCSS: function() {
  return T.getLayerOrderCSS(this.name);
}, getStyleSheet: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (this.css) {
    var n2 = b(this.css, { dt: E }) || "", r2 = O(x(it ||= K(["", "", ""]), n2, e2)), i2 = Object.entries(t2).reduce(function(e3, t3) {
      var n3 = ot(t3, 2), r3 = n3[0], i3 = n3[1];
      return e3.push(`${r3}="${i3}"`) && e3;
    }, []).join(" ");
    return y(r2) ? `<style type="text/css" data-primevue-style-id="${this.name}" ${i2}>${r2}</style>` : "";
  }
  return "";
}, getCommonThemeStyleSheet: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  return T.getCommonStyleSheet(this.name, e2, t2);
}, getThemeStyleSheet: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n2 = [T.getStyleSheet(this.name, e2, t2)];
  if (this.style) {
    var r2 = this.name === "base" ? "global-style" : `${this.name}-style`, i2 = x(at ||= K(["", ""]), b(this.style, { dt: E })), a2 = O(T.transformCSS(r2, i2)), o2 = Object.entries(t2).reduce(function(e3, t3) {
      var n3 = ot(t3, 2), r3 = n3[0], i3 = n3[1];
      return e3.push(`${r3}="${i3}"`) && e3;
    }, []).join(" ");
    y(a2) && n2.push(`<style type="text/css" data-primevue-style-id="${r2}" ${o2}>${a2}</style>`);
  }
  return n2.join("");
}, extend: function(e2) {
  return G(G({}, this), {}, { css: void 0, style: void 0 }, e2);
} };
var J = { _loadedStyleNames: /* @__PURE__ */ new Set(), getLoadedStyleNames: function() {
  return this._loadedStyleNames;
}, isStyleNameLoaded: function(e2) {
  return this._loadedStyleNames.has(e2);
}, setLoadedStyleName: function(e2) {
  this._loadedStyleNames.add(e2);
}, deleteLoadedStyleName: function(e2) {
  this._loadedStyleNames.delete(e2);
}, clearLoadedStyleNames: function() {
  this._loadedStyleNames.clear();
} };
function gt() {
  return `${arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "pc"}${u().replace("v-", "").replaceAll("-", "_")}`;
}
var _t = q.extend({ name: "common" });
function Y(e2) {
  "@babel/helpers - typeof";
  return Y = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Y(e2);
}
function vt(e2) {
  return Ct(e2) || yt(e2) || xt(e2) || bt();
}
function yt(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function X(e2, t2) {
  return Ct(e2) || St(e2, t2) || xt(e2, t2) || bt();
}
function bt() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function xt(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return Z(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? Z(e2, t2) : void 0;
  }
}
function Z(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function St(e2, t2) {
  var n2 = e2 == null ? null : typeof Symbol < "u" && e2[Symbol.iterator] || e2["@@iterator"];
  if (n2 != null) {
    var r2, i2, a2, o2, s2 = [], c2 = !0, l2 = !1;
    try {
      if (a2 = (n2 = n2.call(e2)).next, t2 === 0) {
        if (Object(n2) !== n2) return;
        c2 = !1;
      } else for (; !(c2 = (r2 = a2.call(n2)).done) && (s2.push(r2.value), s2.length !== t2); c2 = !0) ;
    } catch (e3) {
      l2 = !0, i2 = e3;
    } finally {
      try {
        if (!c2 && n2.return != null && (o2 = n2.return(), Object(o2) !== o2)) return;
      } finally {
        if (l2) throw i2;
      }
    }
    return s2;
  }
}
function Ct(e2) {
  if (Array.isArray(e2)) return e2;
}
function wt(e2, t2) {
  var n2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), n2.push.apply(n2, r2);
  }
  return n2;
}
function Q(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var n2 = arguments[t2] == null ? {} : arguments[t2];
    t2 % 2 ? wt(Object(n2), !0).forEach(function(t3) {
      $(e2, t3, n2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(n2)) : wt(Object(n2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(n2, t3));
    });
  }
  return e2;
}
function $(e2, t2, n2) {
  return (t2 = Tt(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function Tt(e2) {
  var t2 = Et(e2, "string");
  return Y(t2) == "symbol" ? t2 : t2 + "";
}
function Et(e2, t2) {
  if (Y(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (Y(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var Dt = { name: "BaseComponent", props: { pt: { type: Object, default: void 0 }, ptOptions: { type: Object, default: void 0 }, unstyled: { type: Boolean, default: void 0 }, dt: { type: Object, default: void 0 } }, inject: { $parentInstance: { default: void 0 } }, watch: { isUnstyled: { immediate: !0, handler: function(e2) {
  w.off("theme:change", this._loadCoreStyles), e2 || (this._loadCoreStyles(), this._themeChangeListener(this._loadCoreStyles));
} }, dt: { immediate: !0, handler: function(e2, t2) {
  var n2 = this;
  w.off("theme:change", this._themeScopedListener), e2 ? (this._loadScopedThemeStyles(e2), this._themeScopedListener = function() {
    return n2._loadScopedThemeStyles(e2);
  }, this._themeChangeListener(this._themeScopedListener)) : this._unloadScopedThemeStyles();
} } }, scopedStyleEl: void 0, rootEl: void 0, uid: void 0, $attrSelector: void 0, beforeCreate: function() {
  var e2, t2, n2, r2, i2, a2, o2, s2, c2, l2, u2 = this.pt?._usept, d2 = u2 ? (e2 = this.pt) == null || (e2 = e2.originalValue) == null ? void 0 : e2[this.$.type.name] : void 0;
  (n2 = (u2 ? (t2 = this.pt) == null || (t2 = t2.value) == null ? void 0 : t2[this.$.type.name] : this.pt) || d2) == null || (n2 = n2.hooks) == null || (r2 = n2.onBeforeCreate) == null || r2.call(n2);
  var f2 = (i2 = this.$primevueConfig) == null || (i2 = i2.pt) == null ? void 0 : i2._usept, p2 = f2 ? (a2 = this.$primevue) == null || (a2 = a2.config) == null || (a2 = a2.pt) == null ? void 0 : a2.originalValue : void 0;
  (c2 = (f2 ? (o2 = this.$primevue) == null || (o2 = o2.config) == null || (o2 = o2.pt) == null ? void 0 : o2.value : (s2 = this.$primevue) == null || (s2 = s2.config) == null ? void 0 : s2.pt) || p2) == null || (c2 = c2[this.$.type.name]) == null || (c2 = c2.hooks) == null || (l2 = c2.onBeforeCreate) == null || l2.call(c2), this.$attrSelector = gt(), this.uid = this.$attrs.id || this.$attrSelector.replace("pc", "pv_id_");
}, created: function() {
  this._hook("onCreated");
}, beforeMount: function() {
  this.rootEl = V(R(this.$el) ? this.$el : this.$el?.parentElement, `[${this.$attrSelector}]`), this.rootEl && (this.rootEl.$pc = Q({ name: this.$.type.name, attrSelector: this.$attrSelector }, this.$params)), this._loadStyles(), this._hook("onBeforeMount");
}, mounted: function() {
  this._hook("onMounted");
}, beforeUpdate: function() {
  this._hook("onBeforeUpdate");
}, updated: function() {
  this._hook("onUpdated");
}, beforeUnmount: function() {
  this._hook("onBeforeUnmount");
}, unmounted: function() {
  this._removeThemeListeners(), this._unloadScopedThemeStyles(), this._hook("onUnmounted");
}, methods: { _hook: function(e2) {
  if (!this.$options.hostName) {
    var t2 = this._usePT(this._getPT(this.pt, this.$.type.name), this._getOptionValue, `hooks.${e2}`), n2 = this._useDefaultPT(this._getOptionValue, `hooks.${e2}`);
    t2?.(), n2?.();
  }
}, _mergeProps: function(e2) {
  var t2 = [...arguments].slice(1);
  return ee(e2) ? e2.apply(void 0, t2) : n.apply(void 0, t2);
}, _load: function() {
  J.isStyleNameLoaded("base") || (q.loadCSS(this.$styleOptions), this._loadGlobalStyles(), J.setLoadedStyleName("base")), this._loadThemeStyles();
}, _loadStyles: function() {
  this._load(), this._themeChangeListener(this._load);
}, _loadCoreStyles: function() {
  var e2;
  !J.isStyleNameLoaded(this.$style?.name) && (e2 = this.$style) != null && e2.name && (_t.loadCSS(this.$styleOptions), this.$options.style && this.$style.loadCSS(this.$styleOptions), J.setLoadedStyleName(this.$style.name));
}, _loadGlobalStyles: function() {
  var e2 = this._useGlobalPT(this._getOptionValue, "global.css", this.$params);
  y(e2) && q.load(e2, Q({ name: "global" }, this.$styleOptions));
}, _loadThemeStyles: function() {
  var e2;
  if (!(this.isUnstyled || this.$theme === "none")) {
    if (!T.isStyleNameLoaded("common")) {
      var t2, n2, r2 = ((t2 = this.$style) == null || (n2 = t2.getCommonTheme) == null ? void 0 : n2.call(t2)) || {}, i2 = r2.primitive, a2 = r2.semantic, o2 = r2.global, s2 = r2.style;
      q.load(i2?.css, Q({ name: "primitive-variables" }, this.$styleOptions)), q.load(a2?.css, Q({ name: "semantic-variables" }, this.$styleOptions)), q.load(o2?.css, Q({ name: "global-variables" }, this.$styleOptions)), q.loadStyle(Q({ name: "global-style" }, this.$styleOptions), s2), T.setLoadedStyleName("common");
    }
    if (!T.isStyleNameLoaded(this.$style?.name) && (e2 = this.$style) != null && e2.name) {
      var c2, l2, u2, d2, f2 = ((c2 = this.$style) == null || (l2 = c2.getComponentTheme) == null ? void 0 : l2.call(c2)) || {}, p2 = f2.css, m2 = f2.style;
      (u2 = this.$style) == null || u2.load(p2, Q({ name: `${this.$style.name}-variables` }, this.$styleOptions)), (d2 = this.$style) == null || d2.loadStyle(Q({ name: `${this.$style.name}-style` }, this.$styleOptions), m2), T.setLoadedStyleName(this.$style.name);
    }
    if (!T.isStyleNameLoaded("layer-order")) {
      var h2, g2, _2 = (h2 = this.$style) == null || (g2 = h2.getLayerOrderThemeCSS) == null ? void 0 : g2.call(h2);
      q.load(_2, Q({ name: "layer-order", first: !0 }, this.$styleOptions)), T.setLoadedStyleName("layer-order");
    }
  }
}, _loadScopedThemeStyles: function(e2) {
  var t2, n2, r2 = (((t2 = this.$style) == null || (n2 = t2.getPresetTheme) == null ? void 0 : n2.call(t2, e2, `[${this.$attrSelector}]`)) || {}).css, i2 = this.$style?.load(r2, Q({ name: `${this.$attrSelector}-${this.$style.name}` }, this.$styleOptions));
  this.scopedStyleEl = i2.el;
}, _unloadScopedThemeStyles: function() {
  var e2;
  (e2 = this.scopedStyleEl) == null || (e2 = e2.value) == null || e2.remove();
}, _themeChangeListener: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function() {
  };
  J.clearLoadedStyleNames(), w.on("theme:change", e2);
}, _removeThemeListeners: function() {
  w.off("theme:change", this._loadCoreStyles), w.off("theme:change", this._load), w.off("theme:change", this._themeScopedListener);
}, _getHostInstance: function(e2) {
  return e2 ? this.$options.hostName ? e2.$.type.name === this.$options.hostName ? e2 : this._getHostInstance(e2.$parentInstance) : e2.$parentInstance : void 0;
}, _getPropValue: function(e2) {
  return this[e2] || this._getHostInstance(this)?.[e2];
}, _getOptionValue: function(e2) {
  var t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  return C(e2, t2, n2);
}, _getPTValue: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, r2 = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !0, i2 = /./g.test(t2) && !!n2[t2.split(".")[0]], a2 = this._getPropValue("ptOptions") || this.$primevueConfig?.ptOptions || {}, o2 = a2.mergeSections, s2 = o2 === void 0 || o2, c2 = a2.mergeProps, l2 = c2 !== void 0 && c2, u2 = r2 ? i2 ? this._useGlobalPT(this._getPTClassValue, t2, n2) : this._useDefaultPT(this._getPTClassValue, t2, n2) : void 0, d2 = i2 ? void 0 : this._getPTSelf(e2, this._getPTClassValue, t2, Q(Q({}, n2), {}, { global: u2 || {} })), f2 = this._getPTDatasets(t2);
  return s2 || !s2 && d2 ? l2 ? this._mergeProps(l2, u2, d2, f2) : Q(Q(Q({}, u2), d2), f2) : Q(Q({}, d2), f2);
}, _getPTSelf: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = [...arguments].slice(1);
  return n(this._usePT.apply(this, [this._getPT(e2, this.$name)].concat(t2)), this._usePT.apply(this, [this.$_attrsPT].concat(t2)));
}, _getPTDatasets: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t2 = "data-pc-", n2 = e2 === "root" && y(this.pt?.["data-pc-section"]);
  return e2 !== "transition" && Q(Q({}, e2 === "root" && Q(Q($({}, `${t2}name`, v(n2 ? this.pt?.["data-pc-section"] : this.$.type.name)), n2 && $({}, `${t2}extend`, v(this.$.type.name))), {}, $({}, `${this.$attrSelector}`, ""))), {}, $({}, `${t2}section`, v(e2)));
}, _getPTClassValue: function() {
  var e2 = this._getOptionValue.apply(this, arguments);
  return S(e2) || D(e2) ? { class: e2 } : e2;
}, _getPT: function(e2) {
  var t2 = this, n2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", r2 = arguments.length > 2 ? arguments[2] : void 0, i2 = function(e3) {
    var i3 = arguments.length > 1 && arguments[1] !== void 0 && arguments[1], a2 = r2 ? r2(e3) : e3, o2 = v(n2), s2 = v(t2.$name);
    return (i3 && o2 === s2 ? void 0 : a2?.[o2]) ?? a2;
  };
  return e2 != null && e2.hasOwnProperty("_usept") ? { _usept: e2._usept, originalValue: i2(e2.originalValue), value: i2(e2.value) } : i2(e2, !0);
}, _usePT: function(e2, t2, n2, r2) {
  var i2 = function(e3) {
    return t2(e3, n2, r2);
  };
  if (e2 != null && e2.hasOwnProperty("_usept")) {
    var a2 = e2._usept || this.$primevueConfig?.ptOptions || {}, o2 = a2.mergeSections, s2 = o2 === void 0 || o2, c2 = a2.mergeProps, l2 = c2 !== void 0 && c2, u2 = i2(e2.originalValue), d2 = i2(e2.value);
    return u2 === void 0 && d2 === void 0 ? void 0 : S(d2) ? d2 : S(u2) ? u2 : s2 || !s2 && d2 ? l2 ? this._mergeProps(l2, u2, d2) : Q(Q({}, u2), d2) : d2;
  }
  return i2(e2);
}, _useGlobalPT: function(e2, t2, n2) {
  return this._usePT(this.globalPT, e2, t2, n2);
}, _useDefaultPT: function(e2, t2, n2) {
  return this._usePT(this.defaultPT, e2, t2, n2);
}, ptm: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  return this._getPTValue(this.pt, e2, Q(Q({}, this.$params), t2));
}, ptmi: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r2 = n(this.$_attrsWithoutPT, this.ptm(e2, t2));
  return r2 != null && r2.hasOwnProperty("id") && (r2.id ??= this.$id), r2;
}, ptmo: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  return this._getPTValue(e2, t2, Q({ instance: this }, n2), !1);
}, cx: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  return this.isUnstyled ? void 0 : this._getOptionValue(this.$style.classes, e2, Q(Q({}, this.$params), t2));
}, sx: function() {
  var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, n2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (t2) {
    var r2 = this._getOptionValue(this.$style.inlineStyles, e2, Q(Q({}, this.$params), n2));
    return [this._getOptionValue(_t.inlineStyles, e2, Q(Q({}, this.$params), n2)), r2];
  }
} }, computed: { globalPT: function() {
  var e2 = this;
  return this._getPT(this.$primevueConfig?.pt, void 0, function(t2) {
    return b(t2, { instance: e2 });
  });
}, defaultPT: function() {
  var e2 = this;
  return this._getPT(this.$primevueConfig?.pt, void 0, function(t2) {
    return e2._getOptionValue(t2, e2.$name, Q({}, e2.$params)) || b(t2, Q({}, e2.$params));
  });
}, isUnstyled: function() {
  return this.unstyled === void 0 ? this.$primevueConfig?.unstyled : this.unstyled;
}, $id: function() {
  return this.$attrs.id || this.uid;
}, $inProps: function() {
  var e2 = Object.keys(this.$.vnode?.props || {});
  return Object.fromEntries(Object.entries(this.$props).filter(function(t2) {
    var n2 = X(t2, 1)[0];
    return e2?.includes(n2);
  }));
}, $theme: function() {
  return this.$primevueConfig?.theme;
}, $style: function() {
  return Q(Q({ classes: void 0, inlineStyles: void 0, load: function() {
  }, loadCSS: function() {
  }, loadStyle: function() {
  } }, (this._getHostInstance(this) || {}).$style), this.$options.style);
}, $styleOptions: function() {
  var e2;
  return { nonce: (e2 = this.$primevueConfig) == null || (e2 = e2.csp) == null ? void 0 : e2.nonce };
}, $primevueConfig: function() {
  return this.$primevue?.config;
}, $name: function() {
  return this.$options.hostName || this.$.type.name;
}, $params: function() {
  var e2 = this._getHostInstance(this) || this.$parent;
  return { instance: this, props: this.$props, state: this.$data, attrs: this.$attrs, parent: { instance: e2, props: e2?.$props, state: e2?.$data, attrs: e2?.$attrs } };
}, $_attrsPT: function() {
  return Object.entries(this.$attrs || {}).filter(function(e2) {
    return X(e2, 1)[0]?.startsWith("pt:");
  }).reduce(function(e2, t2) {
    var n2 = X(t2, 2), r2 = n2[0], i2 = n2[1];
    return Z(vt(r2.split(":"))).slice(1)?.reduce(function(e3, t3, n3, r3) {
      return !e3[t3] && (e3[t3] = n3 === r3.length - 1 ? i2 : {}), e3[t3];
    }, e2), e2;
  }, {});
}, $_attrsWithoutPT: function() {
  return Object.entries(this.$attrs || {}).filter(function(e2) {
    var t2 = X(e2, 1)[0];
    return !(t2 != null && t2.startsWith("pt:"));
  }).reduce(function(e2, t2) {
    var n2 = X(t2, 2), r2 = n2[0];
    return e2[r2] = n2[1], e2;
  }, {});
} } };
export {ke as A,ye as B,Le as C,ve as D,we as E,H as F,Ve as G,Re as H,xe as I,V as J,pe as K,ae as L,We as M,Ke as N,ue as O,ie as P,Ue as R,M as S,he as T,_e as U,ce as V,ne as W,j as X,Ge as Y,Fe as _,ze as a,P as b,de as c,De as d,me as f,Oe as g,Ae as h,le as i,be as j,N as k,Be as l,Ee as m,J as n,Pe as o,He as p,Ce as q,q as r,je as s,Dt as t,Te as u,fe as w,Se as x,Ne as y,I as z};
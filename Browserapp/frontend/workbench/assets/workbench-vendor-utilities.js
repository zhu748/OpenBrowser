// Driver.js tour renderer and the workbench equality implementation.
import { A as p, B as m, C as h, D as g, E as _, F as v, G as y, H as b, I as x, K as S, L as ee, M as C, N as te, O as ne, P as re, R as ie, S as ae, T as oe, U as se, V as ce, W as le, _ as ue, b as de, j as fe, k as pe, w as he, x as ge, y as w, z as _e } from "./dist-NctnpPRe.js";
var qu = {};
var Ju;
function Yu(e5 = {}) {
  qu = { animate: !0, allowClose: !0, overlayClickBehavior: "close", overlayOpacity: 0.7, smoothScroll: !1, disableActiveInteraction: !1, showProgress: !1, stagePadding: 10, stageRadius: 5, popoverOffset: 10, showButtons: ["next", "previous", "close"], disableButtons: [], overlayColor: "#000", ...e5 };
}
function T(e5) {
  return e5 ? qu[e5] : qu;
}
function Xu(e5) {
  Ju = e5;
}
function Zu() {
  return Ju;
}
var Qu = {};
function $u(e5, t2) {
  Qu[e5] = t2;
}
function ed(e5) {
  var t2;
  (t2 = Qu[e5]) == null || t2.call(Qu);
}
function td() {
  Qu = {};
}
function nd(e5, t2, n2, r2) {
  return (e5 /= r2 / 2) < 1 ? n2 / 2 * e5 * e5 + t2 : -n2 / 2 * (--e5 * (e5 - 2) - 1) + t2;
}
function rd(e5) {
  let t2 = 'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])';
  return e5.flatMap((e6) => {
    let n2 = e6.matches(t2), r2 = Array.from(e6.querySelectorAll(t2));
    return [...n2 ? [e6] : [], ...r2];
  }).filter((e6) => getComputedStyle(e6).pointerEvents !== "none" && sd(e6));
}
function id(e5) {
  if (!e5 || od(e5)) return;
  let t2 = T("smoothScroll"), n2 = e5.offsetHeight > window.innerHeight;
  e5.scrollIntoView({ behavior: !t2 || ad(e5) ? "auto" : "smooth", inline: "center", block: n2 ? "start" : "center" });
}
function ad(e5) {
  if (!e5 || !e5.parentElement) return;
  let t2 = e5.parentElement;
  return t2.scrollHeight > t2.clientHeight;
}
function od(e5) {
  let t2 = e5.getBoundingClientRect();
  return t2.top >= 0 && t2.left >= 0 && t2.bottom <= (window.innerHeight || document.documentElement.clientHeight) && t2.right <= (window.innerWidth || document.documentElement.clientWidth);
}
function sd(e5) {
  return !!(e5.offsetWidth || e5.offsetHeight || e5.getClientRects().length);
}
var cd = {};
function ld(e5, t2) {
  cd[e5] = t2;
}
function E(e5) {
  return e5 ? cd[e5] : cd;
}
function ud() {
  cd = {};
}
function dd(e5, t2, n2, r2) {
  let i2 = E("__activeStagePosition"), a2 = i2 || n2.getBoundingClientRect(), o2 = r2.getBoundingClientRect();
  i2 = { x: nd(e5, a2.x, o2.x - a2.x, t2), y: nd(e5, a2.y, o2.y - a2.y, t2), width: nd(e5, a2.width, o2.width - a2.width, t2), height: nd(e5, a2.height, o2.height - a2.height, t2) }, hd(i2), ld("__activeStagePosition", i2);
}
function fd(e5) {
  if (!e5) return;
  let t2 = e5.getBoundingClientRect(), n2 = { x: t2.x, y: t2.y, width: t2.width, height: t2.height };
  ld("__activeStagePosition", n2), hd(n2);
}
function pd() {
  let e5 = E("__activeStagePosition"), t2 = E("__overlaySvg");
  if (!e5) return;
  if (!t2) {
    console.warn("No stage svg found.");
    return;
  }
  let n2 = window.innerWidth, r2 = window.innerHeight;
  t2.setAttribute("viewBox", `0 0 ${n2} ${r2}`);
}
function md(e5) {
  let t2 = gd(e5);
  document.body.appendChild(t2), Dd(t2, (e6) => {
    e6.target.tagName === "path" && ed("overlayClick");
  }), ld("__overlaySvg", t2);
}
function hd(e5) {
  let t2 = E("__overlaySvg");
  if (!t2) {
    md(e5);
    return;
  }
  let n2 = t2.firstElementChild;
  if (n2?.tagName !== "path") throw Error("no path element found in stage svg");
  n2.setAttribute("d", _d(e5));
}
function gd(e5) {
  let t2 = window.innerWidth, n2 = window.innerHeight, r2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  r2.classList.add("driver-overlay", "driver-overlay-animated"), r2.setAttribute("viewBox", `0 0 ${t2} ${n2}`), r2.setAttribute("xmlSpace", "preserve"), r2.setAttribute("xmlnsXlink", "http://www.w3.org/1999/xlink"), r2.setAttribute("version", "1.1"), r2.setAttribute("preserveAspectRatio", "xMinYMin slice"), r2.style.fillRule = "evenodd", r2.style.clipRule = "evenodd", r2.style.strokeLinejoin = "round", r2.style.strokeMiterlimit = "2", r2.style.zIndex = "10000", r2.style.position = "fixed", r2.style.top = "0", r2.style.left = "0", r2.style.width = "100%", r2.style.height = "100%";
  let i2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  return i2.setAttribute("d", _d(e5)), i2.style.fill = T("overlayColor") || "rgb(0,0,0)", i2.style.opacity = `${T("overlayOpacity")}`, i2.style.pointerEvents = "auto", i2.style.cursor = "auto", r2.appendChild(i2), r2;
}
function _d(e5) {
  let t2 = window.innerWidth, n2 = window.innerHeight, r2 = T("stagePadding") || 0, i2 = T("stageRadius") || 0, a2 = e5.width + r2 * 2, o2 = e5.height + r2 * 2, s2 = Math.min(i2, a2 / 2, o2 / 2), c2 = Math.floor(Math.max(s2, 0)), l2 = e5.x - r2 + c2, u2 = e5.y - r2, d2 = a2 - c2 * 2, f2 = o2 - c2 * 2;
  return `M${t2},0L0,0L0,${n2}L${t2},${n2}L${t2},0Z
    M${l2},${u2} h${d2} a${c2},${c2} 0 0 1 ${c2},${c2} v${f2} a${c2},${c2} 0 0 1 -${c2},${c2} h-${d2} a${c2},${c2} 0 0 1 -${c2},-${c2} v-${f2} a${c2},${c2} 0 0 1 ${c2},-${c2} z`;
}
function vd() {
  let e5 = E("__overlaySvg");
  e5 && e5.remove();
}
function yd() {
  let e5 = document.getElementById("driver-dummy-element");
  if (e5) return e5;
  let t2 = document.createElement("div");
  return t2.id = "driver-dummy-element", t2.style.width = "0", t2.style.height = "0", t2.style.pointerEvents = "none", t2.style.opacity = "0", t2.style.position = "fixed", t2.style.top = "50%", t2.style.left = "50%", document.body.appendChild(t2), t2;
}
function bd(e5) {
  let { element: t2 } = e5, n2 = typeof t2 == "function" ? t2() : typeof t2 == "string" ? document.querySelector(t2) : t2;
  n2 ||= yd(), Sd(n2, e5);
}
function xd() {
  let e5 = E("__activeElement"), t2 = E("__activeStep");
  e5 && (fd(e5), pd(), Fd(e5, t2));
}
function Sd(e5, t2) {
  let n2 = Date.now(), r2 = E("__activeStep"), i2 = E("__activeElement") || e5, a2 = !i2 || i2 === e5, o2 = e5.id === "driver-dummy-element", s2 = i2.id === "driver-dummy-element", c2 = T("animate"), l2 = t2.onHighlightStarted || T("onHighlightStarted"), u2 = t2?.onHighlighted || T("onHighlighted"), d2 = r2?.onDeselected || T("onDeselected"), f2 = T(), p2 = E();
  !a2 && d2 && d2(s2 ? void 0 : i2, r2, { config: f2, state: p2, driver: Zu() }), l2 && l2(o2 ? void 0 : e5, t2, { config: f2, state: p2, driver: Zu() });
  let m2 = !a2 && c2, h2 = !1;
  Ad(), ld("previousStep", r2), ld("previousElement", i2), ld("activeStep", t2), ld("activeElement", e5);
  let g2 = () => {
    if (E("__transitionCallback") !== g2) return;
    let a3 = Date.now() - n2, s3 = 400 - a3 <= 200;
    t2.popover && s3 && !h2 && m2 && (jd(e5, t2), h2 = !0), T("animate") && a3 < 400 ? dd(a3, 400, i2, e5) : (fd(e5), u2 && u2(o2 ? void 0 : e5, t2, { config: T(), state: E(), driver: Zu() }), ld("__transitionCallback", void 0), ld("__previousStep", r2), ld("__previousElement", i2), ld("__activeStep", t2), ld("__activeElement", e5)), window.requestAnimationFrame(g2);
  };
  ld("__transitionCallback", g2), window.requestAnimationFrame(g2), id(e5), !m2 && t2.popover && jd(e5, t2), i2.classList.remove("driver-active-element", "driver-no-interaction"), i2.removeAttribute("aria-haspopup"), i2.removeAttribute("aria-expanded"), i2.removeAttribute("aria-controls"), (t2.disableActiveInteraction ?? T("disableActiveInteraction")) && e5.classList.add("driver-no-interaction"), e5.classList.add("driver-active-element"), e5.setAttribute("aria-haspopup", "dialog"), e5.setAttribute("aria-expanded", "true"), e5.setAttribute("aria-controls", "driver-popover-content");
}
function Cd() {
  var e5;
  (e5 = document.getElementById("driver-dummy-element")) == null || e5.remove(), document.querySelectorAll(".driver-active-element").forEach((e6) => {
    e6.classList.remove("driver-active-element", "driver-no-interaction"), e6.removeAttribute("aria-haspopup"), e6.removeAttribute("aria-expanded"), e6.removeAttribute("aria-controls");
  });
}
function wd() {
  let e5 = E("__resizeTimeout");
  e5 && window.cancelAnimationFrame(e5), ld("__resizeTimeout", window.requestAnimationFrame(xd));
}
function Td(e5) {
  if (!E("isInitialized") || e5.key !== "Tab" && e5.keyCode !== 9) return;
  let t2 = E("__activeElement"), n2 = E("popover")?.wrapper, r2 = rd([...n2 ? [n2] : [], ...t2 ? [t2] : []]), i2 = r2[0], a2 = r2[r2.length - 1];
  e5.preventDefault(), e5.shiftKey ? (r2[r2.indexOf(document.activeElement) - 1] || a2)?.focus() : (r2[r2.indexOf(document.activeElement) + 1] || i2)?.focus();
}
function Ed(e5) {
  var t2;
  ((t2 = T("allowKeyboardControl")) == null || t2) && (e5.key === "Escape" ? ed("escapePress") : e5.key === "ArrowRight" ? ed("arrowRightPress") : e5.key === "ArrowLeft" && ed("arrowLeftPress"));
}
function Dd(e5, t2, n2) {
  let r2 = (t3, r3) => {
    let i2 = t3.target;
    e5.contains(i2) && ((!n2 || n2(i2)) && (t3.preventDefault(), t3.stopPropagation(), t3.stopImmediatePropagation()), r3?.(t3));
  };
  document.addEventListener("pointerdown", r2, !0), document.addEventListener("mousedown", r2, !0), document.addEventListener("pointerup", r2, !0), document.addEventListener("mouseup", r2, !0), document.addEventListener("click", (e6) => {
    r2(e6, t2);
  }, !0);
}
function Od() {
  window.addEventListener("keyup", Ed, !1), window.addEventListener("keydown", Td, !1), window.addEventListener("resize", wd), window.addEventListener("scroll", wd);
}
function kd() {
  window.removeEventListener("keyup", Ed), window.removeEventListener("resize", wd), window.removeEventListener("scroll", wd);
}
function Ad() {
  let e5 = E("popover");
  e5 && (e5.wrapper.style.display = "none");
}
function jd(e5, t2) {
  let n2 = E("popover");
  n2 && document.body.removeChild(n2.wrapper), n2 = Ld(), document.body.appendChild(n2.wrapper);
  let { title: r2, description: i2, showButtons: a2, disableButtons: o2, showProgress: s2, nextBtnText: c2 = T("nextBtnText") || "Next &rarr;", prevBtnText: l2 = T("prevBtnText") || "&larr; Previous", progressText: u2 = T("progressText") || "{current} of {total}" } = t2.popover || {};
  n2.nextButton.innerHTML = c2, n2.previousButton.innerHTML = l2, n2.progress.innerHTML = u2, r2 ? (n2.title.innerHTML = r2, n2.title.style.display = "block") : n2.title.style.display = "none", i2 ? (n2.description.innerHTML = i2, n2.description.style.display = "block") : n2.description.style.display = "none";
  let d2 = a2 || T("showButtons"), f2 = s2 || T("showProgress") || !1, p2 = d2?.includes("next") || d2?.includes("previous") || f2;
  n2.closeButton.style.display = d2.includes("close") ? "block" : "none", p2 ? (n2.footer.style.display = "flex", n2.progress.style.display = f2 ? "block" : "none", n2.nextButton.style.display = d2.includes("next") ? "block" : "none", n2.previousButton.style.display = d2.includes("previous") ? "block" : "none") : n2.footer.style.display = "none";
  let m2 = o2 || T("disableButtons") || [];
  m2 != null && m2.includes("next") && (n2.nextButton.disabled = !0, n2.nextButton.classList.add("driver-popover-btn-disabled")), m2 != null && m2.includes("previous") && (n2.previousButton.disabled = !0, n2.previousButton.classList.add("driver-popover-btn-disabled")), m2 != null && m2.includes("close") && (n2.closeButton.disabled = !0, n2.closeButton.classList.add("driver-popover-btn-disabled"));
  let h2 = n2.wrapper;
  h2.style.display = "block", h2.style.left = "", h2.style.top = "", h2.style.bottom = "", h2.style.right = "", h2.id = "driver-popover-content", h2.setAttribute("role", "dialog"), h2.setAttribute("aria-labelledby", "driver-popover-title"), h2.setAttribute("aria-describedby", "driver-popover-description");
  let g2 = n2.arrow;
  g2.className = "driver-popover-arrow", h2.className = `driver-popover ${t2.popover?.popoverClass || T("popoverClass") || ""}`.trim(), Dd(n2.wrapper, (n3) => {
    let r3 = n3.target, i3 = t2.popover?.onNextClick || T("onNextClick"), a3 = t2.popover?.onPrevClick || T("onPrevClick"), o3 = t2.popover?.onCloseClick || T("onCloseClick");
    if (r3.closest(".driver-popover-next-btn")) return i3 ? i3(e5, t2, { config: T(), state: E(), driver: Zu() }) : ed("nextClick");
    if (r3.closest(".driver-popover-prev-btn")) return a3 ? a3(e5, t2, { config: T(), state: E(), driver: Zu() }) : ed("prevClick");
    if (r3.closest(".driver-popover-close-btn")) return o3 ? o3(e5, t2, { config: T(), state: E(), driver: Zu() }) : ed("closeClick");
  }, (e6) => !(n2 != null && n2.description.contains(e6)) && !(n2 != null && n2.title.contains(e6)) && typeof e6.className == "string" && e6.className.includes("driver-popover")), ld("popover", n2);
  let _2 = t2.popover?.onPopoverRender || T("onPopoverRender");
  _2 && _2(n2, { config: T(), state: E(), driver: Zu() }), Fd(e5, t2), id(h2);
  let v2 = rd([h2, ...e5.classList.contains("driver-dummy-element") ? [] : [e5]]);
  v2.length > 0 && v2[0].focus();
}
function Md() {
  let e5 = E("popover");
  if (!(e5 != null && e5.wrapper)) return;
  let t2 = e5.wrapper.getBoundingClientRect(), n2 = T("stagePadding") || 0, r2 = T("popoverOffset") || 0;
  return { width: t2.width + n2 + r2, height: t2.height + n2 + r2, realWidth: t2.width, realHeight: t2.height };
}
function Nd(e5, t2) {
  let { elementDimensions: n2, popoverDimensions: r2, popoverPadding: i2, popoverArrowDimensions: a2 } = t2;
  return e5 === "start" ? Math.max(Math.min(n2.top - i2, window.innerHeight - r2.realHeight - a2.width), a2.width) : e5 === "end" ? Math.max(Math.min(n2.top - r2?.realHeight + n2.height + i2, window.innerHeight - r2?.realHeight - a2.width), a2.width) : e5 === "center" ? Math.max(Math.min(n2.top + n2.height / 2 - r2?.realHeight / 2, window.innerHeight - r2?.realHeight - a2.width), a2.width) : 0;
}
function Pd(e5, t2) {
  let { elementDimensions: n2, popoverDimensions: r2, popoverPadding: i2, popoverArrowDimensions: a2 } = t2;
  return e5 === "start" ? Math.max(Math.min(n2.left - i2, window.innerWidth - r2.realWidth - a2.width), a2.width) : e5 === "end" ? Math.max(Math.min(n2.left - r2?.realWidth + n2.width + i2, window.innerWidth - r2?.realWidth - a2.width), a2.width) : e5 === "center" ? Math.max(Math.min(n2.left + n2.width / 2 - r2?.realWidth / 2, window.innerWidth - r2?.realWidth - a2.width), a2.width) : 0;
}
function Fd(e5, t2) {
  let n2 = E("popover");
  if (!n2) return;
  let { align: r2 = "start", side: i2 = "left" } = t2?.popover || {}, a2 = r2, o2 = e5.id === "driver-dummy-element" ? "over" : i2, s2 = T("stagePadding") || 0, c2 = Md(), l2 = n2.arrow.getBoundingClientRect(), u2 = e5.getBoundingClientRect(), d2 = u2.top - c2.height, f2 = d2 >= 0, p2 = window.innerHeight - (u2.bottom + c2.height), m2 = p2 >= 0, h2 = u2.left - c2.width, g2 = h2 >= 0, _2 = window.innerWidth - (u2.right + c2.width), v2 = _2 >= 0, y2 = !f2 && !m2 && !g2 && !v2, b2 = o2;
  if (o2 === "top" && f2 ? v2 = g2 = m2 = !1 : o2 === "bottom" && m2 ? v2 = g2 = f2 = !1 : o2 === "left" && g2 ? v2 = f2 = m2 = !1 : o2 === "right" && v2 && (g2 = f2 = m2 = !1), o2 === "over") {
    let e6 = window.innerWidth / 2 - c2.realWidth / 2, t3 = window.innerHeight / 2 - c2.realHeight / 2;
    n2.wrapper.style.left = `${e6}px`, n2.wrapper.style.right = "auto", n2.wrapper.style.top = `${t3}px`, n2.wrapper.style.bottom = "auto";
  } else if (y2) {
    let e6 = window.innerWidth / 2 - c2?.realWidth / 2;
    n2.wrapper.style.left = `${e6}px`, n2.wrapper.style.right = "auto", n2.wrapper.style.bottom = "10px", n2.wrapper.style.top = "auto";
  } else if (g2) {
    let e6 = Math.min(h2, window.innerWidth - c2?.realWidth - l2.width), t3 = Nd(a2, { elementDimensions: u2, popoverDimensions: c2, popoverPadding: s2, popoverArrowDimensions: l2 });
    n2.wrapper.style.left = `${e6}px`, n2.wrapper.style.top = `${t3}px`, n2.wrapper.style.bottom = "auto", n2.wrapper.style.right = "auto", b2 = "left";
  } else if (v2) {
    let e6 = Math.min(_2, window.innerWidth - c2?.realWidth - l2.width), t3 = Nd(a2, { elementDimensions: u2, popoverDimensions: c2, popoverPadding: s2, popoverArrowDimensions: l2 });
    n2.wrapper.style.right = `${e6}px`, n2.wrapper.style.top = `${t3}px`, n2.wrapper.style.bottom = "auto", n2.wrapper.style.left = "auto", b2 = "right";
  } else if (f2) {
    let e6 = Math.min(d2, window.innerHeight - c2.realHeight - l2.width), t3 = Pd(a2, { elementDimensions: u2, popoverDimensions: c2, popoverPadding: s2, popoverArrowDimensions: l2 });
    n2.wrapper.style.top = `${e6}px`, n2.wrapper.style.left = `${t3}px`, n2.wrapper.style.bottom = "auto", n2.wrapper.style.right = "auto", b2 = "top";
  } else if (m2) {
    let e6 = Math.min(p2, window.innerHeight - c2?.realHeight - l2.width), t3 = Pd(a2, { elementDimensions: u2, popoverDimensions: c2, popoverPadding: s2, popoverArrowDimensions: l2 });
    n2.wrapper.style.left = `${t3}px`, n2.wrapper.style.bottom = `${e6}px`, n2.wrapper.style.top = "auto", n2.wrapper.style.right = "auto", b2 = "bottom";
  }
  y2 ? n2.arrow.classList.add("driver-popover-arrow-none") : Id(a2, b2, e5);
}
function Id(e5, t2, n2) {
  let r2 = E("popover");
  if (!r2) return;
  let i2 = n2.getBoundingClientRect(), a2 = Md(), o2 = r2.arrow, s2 = a2.width, c2 = window.innerWidth, l2 = i2.width, u2 = i2.left, d2 = a2.height, f2 = window.innerHeight, p2 = i2.top, m2 = i2.height;
  o2.className = "driver-popover-arrow";
  let h2 = t2, g2 = e5;
  if (t2 === "top" ? (u2 + l2 <= 0 ? (h2 = "right", g2 = "end") : u2 + l2 - s2 <= 0 && (h2 = "top", g2 = "start"), u2 >= c2 ? (h2 = "left", g2 = "end") : u2 + s2 >= c2 && (h2 = "top", g2 = "end")) : t2 === "bottom" ? (u2 + l2 <= 0 ? (h2 = "right", g2 = "start") : u2 + l2 - s2 <= 0 && (h2 = "bottom", g2 = "start"), u2 >= c2 ? (h2 = "left", g2 = "start") : u2 + s2 >= c2 && (h2 = "bottom", g2 = "end")) : t2 === "left" ? (p2 + m2 <= 0 ? (h2 = "bottom", g2 = "end") : p2 + m2 - d2 <= 0 && (h2 = "left", g2 = "start"), p2 >= f2 ? (h2 = "top", g2 = "end") : p2 + d2 >= f2 && (h2 = "left", g2 = "end")) : t2 === "right" && (p2 + m2 <= 0 ? (h2 = "bottom", g2 = "start") : p2 + m2 - d2 <= 0 && (h2 = "right", g2 = "start"), p2 >= f2 ? (h2 = "top", g2 = "start") : p2 + d2 >= f2 && (h2 = "right", g2 = "end")), !h2) o2.classList.add("driver-popover-arrow-none");
  else {
    o2.classList.add(`driver-popover-arrow-side-${h2}`), o2.classList.add(`driver-popover-arrow-align-${g2}`);
    let e6 = n2.getBoundingClientRect(), i3 = o2.getBoundingClientRect(), a3 = T("stagePadding") || 0, s3 = e6.left - a3 < window.innerWidth && e6.right + a3 > 0 && e6.top - a3 < window.innerHeight && e6.bottom + a3 > 0;
    t2 === "bottom" && s3 && (i3.x > e6.x && i3.x + i3.width < e6.x + e6.width ? r2.wrapper.style.transform = "translateY(0)" : (o2.classList.remove(`driver-popover-arrow-align-${g2}`), o2.classList.add("driver-popover-arrow-none"), r2.wrapper.style.transform = `translateY(-${a3 / 2}px)`));
  }
}
function Ld() {
  let e5 = document.createElement("div");
  e5.classList.add("driver-popover");
  let t2 = document.createElement("div");
  t2.classList.add("driver-popover-arrow");
  let n2 = document.createElement("header");
  n2.id = "driver-popover-title", n2.classList.add("driver-popover-title"), n2.style.display = "none", n2.innerText = "Popover Title";
  let r2 = document.createElement("div");
  r2.id = "driver-popover-description", r2.classList.add("driver-popover-description"), r2.style.display = "none", r2.innerText = "Popover description is here";
  let i2 = document.createElement("button");
  i2.type = "button", i2.classList.add("driver-popover-close-btn"), i2.setAttribute("aria-label", "Close"), i2.innerHTML = "&times;";
  let a2 = document.createElement("footer");
  a2.classList.add("driver-popover-footer");
  let o2 = document.createElement("span");
  o2.classList.add("driver-popover-progress-text"), o2.innerText = "";
  let s2 = document.createElement("span");
  s2.classList.add("driver-popover-navigation-btns");
  let c2 = document.createElement("button");
  c2.type = "button", c2.classList.add("driver-popover-prev-btn"), c2.innerHTML = "&larr; Previous";
  let l2 = document.createElement("button");
  return l2.type = "button", l2.classList.add("driver-popover-next-btn"), l2.innerHTML = "Next &rarr;", s2.appendChild(c2), s2.appendChild(l2), a2.appendChild(o2), a2.appendChild(s2), e5.appendChild(i2), e5.appendChild(t2), e5.appendChild(n2), e5.appendChild(r2), e5.appendChild(a2), { wrapper: e5, arrow: t2, title: n2, description: r2, footer: a2, previousButton: c2, nextButton: l2, closeButton: i2, footerButtons: s2, progress: o2 };
}
function Rd() {
  var e5;
  let t2 = E("popover");
  t2 && ((e5 = t2.wrapper.parentElement) == null || e5.removeChild(t2.wrapper));
}
function zd(e5 = {}) {
  Yu(e5);
  function t2() {
    T("allowClose") && u2();
  }
  function n2() {
    let e6 = T("overlayClickBehavior");
    if (T("allowClose") && e6 === "close") u2();
    else if (typeof e6 == "function") {
      let t3 = E("__activeStep");
      e6(E("__activeElement"), t3, { config: T(), state: E(), driver: Zu() });
    } else e6 === "nextStep" && r2();
  }
  function r2() {
    let e6 = E("activeIndex"), t3 = T("steps") || [];
    if (e6 === void 0) return;
    let n3 = e6 + 1;
    t3[n3] ? l2(n3) : u2();
  }
  function i2() {
    let e6 = E("activeIndex"), t3 = T("steps") || [];
    if (e6 === void 0) return;
    let n3 = e6 - 1;
    t3[n3] ? l2(n3) : u2();
  }
  function a2(e6) {
    (T("steps") || [])[e6] ? l2(e6) : u2();
  }
  function o2() {
    if (E("__transitionCallback")) return;
    let e6 = E("activeIndex"), t3 = E("__activeStep"), n3 = E("__activeElement");
    if (e6 === void 0 || t3 === void 0 || E("activeIndex") === void 0) return;
    let r3 = t3.popover?.onPrevClick || T("onPrevClick");
    if (r3) return r3(n3, t3, { config: T(), state: E(), driver: Zu() });
    i2();
  }
  function s2() {
    if (E("__transitionCallback")) return;
    let e6 = E("activeIndex"), t3 = E("__activeStep"), n3 = E("__activeElement");
    if (e6 === void 0 || t3 === void 0) return;
    let i3 = t3.popover?.onNextClick || T("onNextClick");
    if (i3) return i3(n3, t3, { config: T(), state: E(), driver: Zu() });
    r2();
  }
  function c2() {
    E("isInitialized") || (ld("isInitialized", !0), document.body.classList.add("driver-active", T("animate") ? "driver-fade" : "driver-simple"), Od(), $u("overlayClick", n2), $u("escapePress", t2), $u("arrowLeftPress", o2), $u("arrowRightPress", s2));
  }
  function l2(e6 = 0) {
    let t3 = T("steps");
    if (!t3) {
      console.error("No steps to drive through"), u2();
      return;
    }
    if (!t3[e6]) {
      u2();
      return;
    }
    ld("__activeOnDestroyed", document.activeElement), ld("activeIndex", e6);
    let n3 = t3[e6], r3 = t3[e6 + 1], i3 = t3[e6 - 1], a3 = n3.popover?.doneBtnText || T("doneBtnText") || "Done", o3 = T("allowClose"), s3 = n3.popover?.showProgress === void 0 ? T("showProgress") : n3.popover?.showProgress, c3 = (n3.popover?.progressText || T("progressText") || "{{current}} of {{total}}").replace("{{current}}", `${e6 + 1}`).replace("{{total}}", `${t3.length}`), d3 = n3.popover?.showButtons || T("showButtons"), f2 = ["next", "previous", ...o3 ? ["close"] : []].filter((e7) => !(d3 != null && d3.length) || d3.includes(e7)), p2 = n3.popover?.onNextClick || T("onNextClick"), m2 = n3.popover?.onPrevClick || T("onPrevClick"), h2 = n3.popover?.onCloseClick || T("onCloseClick");
    bd({ ...n3, popover: { showButtons: f2, nextBtnText: r3 ? void 0 : a3, disableButtons: [...i3 ? [] : ["previous"]], showProgress: s3, progressText: c3, onNextClick: p2 || (() => {
      r3 ? l2(e6 + 1) : u2();
    }), onPrevClick: m2 || (() => {
      l2(e6 - 1);
    }), onCloseClick: h2 || (() => {
      u2();
    }), ...n3?.popover || {} } });
  }
  function u2(e6 = !0) {
    let t3 = E("__activeElement"), n3 = E("__activeStep"), r3 = E("__activeOnDestroyed"), i3 = T("onDestroyStarted");
    if (e6 && i3) {
      i3(!t3 || t3?.id === "driver-dummy-element" ? void 0 : t3, n3, { config: T(), state: E(), driver: Zu() });
      return;
    }
    let a3 = n3?.onDeselected || T("onDeselected"), o3 = T("onDestroyed");
    if (document.body.classList.remove("driver-active", "driver-fade", "driver-simple"), kd(), Rd(), Cd(), vd(), td(), ud(), t3 && n3) {
      let e7 = t3.id === "driver-dummy-element";
      a3 && a3(e7 ? void 0 : t3, n3, { config: T(), state: E(), driver: Zu() }), o3 && o3(e7 ? void 0 : t3, n3, { config: T(), state: E(), driver: Zu() });
    }
    r3 && r3.focus();
  }
  let d2 = { isActive: () => E("isInitialized") || !1, refresh: wd, drive: (e6 = 0) => {
    c2(), l2(e6);
  }, setConfig: Yu, setSteps: (e6) => {
    ud(), Yu({ ...T(), steps: e6 });
  }, getConfig: T, getState: E, getActiveIndex: () => E("activeIndex"), isFirstStep: () => E("activeIndex") === 0, isLastStep: () => {
    let e6 = T("steps") || [], t3 = E("activeIndex");
    return t3 !== void 0 && t3 === e6.length - 1;
  }, getActiveStep: () => E("activeStep"), getActiveElement: () => E("activeElement"), getPreviousElement: () => E("previousElement"), getPreviousStep: () => E("previousStep"), moveNext: r2, movePrevious: i2, moveTo: a2, hasNextStep: () => {
    let e6 = T("steps") || [], t3 = E("activeIndex");
    return t3 !== void 0 && !!e6[t3 + 1];
  }, hasPreviousStep: () => {
    let e6 = T("steps") || [], t3 = E("activeIndex");
    return t3 !== void 0 && !!e6[t3 - 1];
  }, highlight: (e6) => {
    c2(), bd({ ...e6, popover: e6.popover ? { showButtons: [], showProgress: !1, progressText: "", ...e6.popover } : void 0 });
  }, destroy: () => {
    u2(!1);
  } };
  return Xu(d2), d2;
}
function NT() {
}
function PT(e5, t2) {
  return e5 === t2 || Number.isNaN(e5) && Number.isNaN(t2);
}
function FT(e5, t2, n2) {
  return IT(e5, t2, void 0, void 0, void 0, void 0, n2);
}
function IT(e5, t2, n2, r2, i2, a2, o2) {
  let s2 = o2(e5, t2, n2, r2, i2, a2);
  if (s2 !== void 0) return s2;
  if (typeof e5 == typeof t2) switch (typeof e5) {
    case "bigint":
    case "string":
    case "boolean":
    case "symbol":
    case "undefined":
      return e5 === t2;
    case "number":
      return e5 === t2 || Object.is(e5, t2);
    case "function":
      return e5 === t2;
    case "object":
      return LT(e5, t2, a2, o2);
  }
  return LT(e5, t2, a2, o2);
}
function LT(e5, t2, n2, r2) {
  if (Object.is(e5, t2)) return !0;
  let i2 = le(e5), a2 = le(t2);
  if (i2 === "[object Arguments]" && (i2 = v), a2 === "[object Arguments]" && (a2 = v), i2 !== a2) return !1;
  switch (i2) {
    case ie:
      return e5.toString() === t2.toString();
    case re:
      return PT(e5.valueOf(), t2.valueOf());
    case h:
    case oe:
    case _e:
      return Object.is(e5.valueOf(), t2.valueOf());
    case x:
      return e5.source === t2.source && e5.flags === t2.flags;
    case pe:
      return e5 === t2;
  }
  n2 ??= /* @__PURE__ */ new Map();
  let o2 = n2.get(e5), s2 = n2.get(t2);
  if (o2 != null && s2 != null) return o2 === t2;
  n2.set(e5, t2), n2.set(t2, e5);
  try {
    switch (i2) {
      case te:
        if (e5.size !== t2.size) return !1;
        for (let [i3, a3] of e5.entries()) if (!t2.has(i3) || !IT(a3, t2.get(i3), i3, e5, t2, n2, r2)) return !1;
        return !0;
      case ee: {
        if (e5.size !== t2.size) return !1;
        let i3 = Array.from(e5.values()), a3 = Array.from(t2.values());
        for (let o3 = 0; o3 < i3.length; o3++) {
          let s3 = i3[o3], c2 = a3.findIndex((i4) => IT(s3, i4, void 0, e5, t2, n2, r2));
          if (c2 === -1) return !1;
          a3.splice(c2, 1);
        }
        return !0;
      }
      case de:
      case b:
      case se:
      case m:
      case ce:
      case ae:
      case C:
      case p:
      case fe:
      case ge:
      case g:
      case ne:
        if (S(e5) !== S(t2) || e5.length !== t2.length) return !1;
        for (let i3 = 0; i3 < e5.length; i3++) if (!IT(e5[i3], t2[i3], i3, e5, t2, n2, r2)) return !1;
        return !0;
      case w:
        return e5.byteLength === t2.byteLength && LT(new Uint8Array(e5), new Uint8Array(t2), n2, r2);
      case he:
        return e5.byteLength !== t2.byteLength || e5.byteOffset !== t2.byteOffset ? !1 : LT(new Uint8Array(e5), new Uint8Array(t2), n2, r2);
      case _:
        return e5.name === t2.name && e5.message === t2.message;
      case v: {
        if (!(LT(e5.constructor, t2.constructor, n2, r2) || ue(e5) && ue(t2))) return !1;
        let i3 = [...Object.keys(e5), ...y(e5)], a3 = [...Object.keys(t2), ...y(t2)];
        if (i3.length !== a3.length) return !1;
        for (let a4 = 0; a4 < i3.length; a4++) {
          let o3 = i3[a4], s3 = e5[o3];
          if (!Object.hasOwn(t2, o3)) return !1;
          let c2 = t2[o3];
          if (!IT(s3, c2, o3, e5, t2, n2, r2)) return !1;
        }
        return !0;
      }
      default:
        return !1;
    }
  } finally {
    n2.delete(e5), n2.delete(t2);
  }
}
function RT(e5, t2) {
  return FT(e5, t2, NT);
}
export { zd as driver, RT as deepEqual };

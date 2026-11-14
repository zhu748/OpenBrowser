import {r as e} from "./basecomponent-ClhuVxJN.js";
var t = `
    .p-paginator {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        background: dt('paginator.background');
        color: dt('paginator.color');
        padding: dt('paginator.padding');
        border-radius: dt('paginator.border.radius');
        gap: dt('paginator.gap');
    }

    .p-paginator-content {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: dt('paginator.gap');
    }

    .p-paginator-content-start {
        margin-inline-end: auto;
    }

    .p-paginator-content-end {
        margin-inline-start: auto;
    }

    .p-paginator-page,
    .p-paginator-next,
    .p-paginator-last,
    .p-paginator-first,
    .p-paginator-prev {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        user-select: none;
        overflow: hidden;
        position: relative;
        background: dt('paginator.nav.button.background');
        border: 0 none;
        color: dt('paginator.nav.button.color');
        min-width: dt('paginator.nav.button.width');
        height: dt('paginator.nav.button.height');
        transition:
            background dt('paginator.transition.duration'),
            color dt('paginator.transition.duration'),
            outline-color dt('paginator.transition.duration'),
            box-shadow dt('paginator.transition.duration');
        border-radius: dt('paginator.nav.button.border.radius');
        padding: 0;
        margin: 0;
    }

    .p-paginator-page:focus-visible,
    .p-paginator-next:focus-visible,
    .p-paginator-last:focus-visible,
    .p-paginator-first:focus-visible,
    .p-paginator-prev:focus-visible {
        box-shadow: dt('paginator.nav.button.focus.ring.shadow');
        outline: dt('paginator.nav.button.focus.ring.width') dt('paginator.nav.button.focus.ring.style') dt('paginator.nav.button.focus.ring.color');
        outline-offset: dt('paginator.nav.button.focus.ring.offset');
    }

    .p-paginator-page:not(.p-disabled):not(.p-paginator-page-selected):hover,
    .p-paginator-first:not(.p-disabled):hover,
    .p-paginator-prev:not(.p-disabled):hover,
    .p-paginator-next:not(.p-disabled):hover,
    .p-paginator-last:not(.p-disabled):hover {
        background: dt('paginator.nav.button.hover.background');
        color: dt('paginator.nav.button.hover.color');
    }

    .p-paginator-page.p-paginator-page-selected {
        background: dt('paginator.nav.button.selected.background');
        color: dt('paginator.nav.button.selected.color');
    }

    .p-paginator-current {
        color: dt('paginator.current.page.report.color');
    }

    .p-paginator-pages {
        display: flex;
        align-items: center;
        gap: dt('paginator.gap');
    }

    .p-paginator-jtp-input .p-inputtext {
        max-width: dt('paginator.jump.to.page.input.max.width');
    }

    .p-paginator-first:dir(rtl),
    .p-paginator-prev:dir(rtl),
    .p-paginator-next:dir(rtl),
    .p-paginator-last:dir(rtl) {
        transform: rotate(180deg);
    }
`;
function n(e2) {
  "@babel/helpers - typeof";
  return n = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, n(e2);
}
function r(e2, t2, n2) {
  return (t2 = i(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function i(e2) {
  var t2 = a(e2, "string");
  return n(t2) == "symbol" ? t2 : t2 + "";
}
function a(e2, t2) {
  if (n(e2) != "object" || !e2) return e2;
  var r2 = e2[Symbol.toPrimitive];
  if (r2 !== void 0) {
    var i2 = r2.call(e2, t2);
    if (n(i2) != "object") return i2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var o = e.extend({ name: "paginator", style: t, classes: { paginator: function(e2) {
  var t2 = e2.instance, n2 = e2.key;
  return ["p-paginator p-component", r({ "p-paginator-default": !t2.hasBreakpoints() }, `p-paginator-${n2}`, t2.hasBreakpoints())];
}, content: "p-paginator-content", contentStart: "p-paginator-content-start", contentEnd: "p-paginator-content-end", first: function(e2) {
  return ["p-paginator-first", { "p-disabled": e2.instance.$attrs.disabled }];
}, firstIcon: "p-paginator-first-icon", prev: function(e2) {
  return ["p-paginator-prev", { "p-disabled": e2.instance.$attrs.disabled }];
}, prevIcon: "p-paginator-prev-icon", next: function(e2) {
  return ["p-paginator-next", { "p-disabled": e2.instance.$attrs.disabled }];
}, nextIcon: "p-paginator-next-icon", last: function(e2) {
  return ["p-paginator-last", { "p-disabled": e2.instance.$attrs.disabled }];
}, lastIcon: "p-paginator-last-icon", pages: "p-paginator-pages", page: function(e2) {
  var t2 = e2.props;
  return ["p-paginator-page", { "p-paginator-page-selected": e2.pageLink - 1 === t2.page }];
}, current: "p-paginator-current", pcRowPerPageDropdown: "p-paginator-rpp-dropdown", pcJumpToPageDropdown: "p-paginator-jtp-dropdown", pcJumpToPageInputText: "p-paginator-jtp-input" } });
export {o as t};
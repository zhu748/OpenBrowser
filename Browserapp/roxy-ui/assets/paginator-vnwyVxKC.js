import {J as e,P as t,W as n,X as r,Y as i,Z as a,b as o,en as s,f as c,h as l,i as u,in as d,lt as f,m as p,nn as ee,p as m,q as h,ut as g,v as _} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {N as v,t as y} from "./basecomponent-ClhuVxJN.js";
import {t as b} from "./baseicon-Z_5Hqu9u.js";
import {t as x} from "./ripple-DKjDc6yC.js";
import {t as S} from "./style-CGO5sn8o.js";
import {t as C} from "./inputnumber-BD6BwCgc.js";
import {t as w} from "./select-Cc8zLK4m.js";
import {t as te} from "./angleright-CRY6qWAP.js";
var T = { name: "AngleDoubleLeftIcon", extends: b };
function ne(e2) {
  return O(e2) || D(e2) || E(e2) || re();
}
function re() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function E(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return k(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? k(e2, t2) : void 0;
  }
}
function D(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function O(e2) {
  if (Array.isArray(e2)) return k(e2);
}
function k(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function ie(e2, r2, i2, a2, o2, s2) {
  return n(), l("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), ne(r2[0] ||= [c("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M5.71602 11.164C5.80782 11.2021 5.9063 11.2215 6.00569 11.221C6.20216 11.2301 6.39427 11.1612 6.54025 11.0294C6.68191 10.8875 6.76148 10.6953 6.76148 10.4948C6.76148 10.2943 6.68191 10.1021 6.54025 9.96024L3.51441 6.9344L6.54025 3.90855C6.624 3.76126 6.65587 3.59011 6.63076 3.42254C6.60564 3.25498 6.525 3.10069 6.40175 2.98442C6.2785 2.86815 6.11978 2.79662 5.95104 2.7813C5.78229 2.76598 5.61329 2.80776 5.47112 2.89994L1.97123 6.39983C1.82957 6.54167 1.75 6.73393 1.75 6.9344C1.75 7.13486 1.82957 7.32712 1.97123 7.46896L5.47112 10.9991C5.54096 11.0698 5.62422 11.1259 5.71602 11.164ZM11.0488 10.9689C11.1775 11.1156 11.3585 11.2061 11.5531 11.221C11.7477 11.2061 11.9288 11.1156 12.0574 10.9689C12.1815 10.8302 12.25 10.6506 12.25 10.4645C12.25 10.2785 12.1815 10.0989 12.0574 9.96024L9.03158 6.93439L12.0574 3.90855C12.1248 3.76739 12.1468 3.60881 12.1204 3.45463C12.0939 3.30045 12.0203 3.15826 11.9097 3.04765C11.7991 2.93703 11.6569 2.86343 11.5027 2.83698C11.3486 2.81053 11.19 2.83252 11.0488 2.89994L7.51865 6.36957C7.37699 6.51141 7.29742 6.70367 7.29742 6.90414C7.29742 7.1046 7.37699 7.29686 7.51865 7.4387L11.0488 10.9689Z", fill: "currentColor" }, null, -1)]), 16);
}
T.render = ie;
var A = { name: "AngleDoubleRightIcon", extends: b };
function ae(e2) {
  return le(e2) || ce(e2) || se(e2) || oe();
}
function oe() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function se(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return j(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? j(e2, t2) : void 0;
  }
}
function ce(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function le(e2) {
  if (Array.isArray(e2)) return j(e2);
}
function j(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function ue(e2, r2, i2, a2, o2, s2) {
  return n(), l("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), ae(r2[0] ||= [c("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M7.68757 11.1451C7.7791 11.1831 7.8773 11.2024 7.9764 11.2019C8.07769 11.1985 8.17721 11.1745 8.26886 11.1312C8.36052 11.088 8.44238 11.0265 8.50943 10.9505L12.0294 7.49085C12.1707 7.34942 12.25 7.15771 12.25 6.95782C12.25 6.75794 12.1707 6.56622 12.0294 6.42479L8.50943 2.90479C8.37014 2.82159 8.20774 2.78551 8.04633 2.80192C7.88491 2.81833 7.73309 2.88635 7.6134 2.99588C7.4937 3.10541 7.41252 3.25061 7.38189 3.40994C7.35126 3.56927 7.37282 3.73423 7.44337 3.88033L10.4605 6.89748L7.44337 9.91463C7.30212 10.0561 7.22278 10.2478 7.22278 10.4477C7.22278 10.6475 7.30212 10.8393 7.44337 10.9807C7.51301 11.0512 7.59603 11.1071 7.68757 11.1451ZM1.94207 10.9505C2.07037 11.0968 2.25089 11.1871 2.44493 11.2019C2.63898 11.1871 2.81949 11.0968 2.94779 10.9505L6.46779 7.49085C6.60905 7.34942 6.68839 7.15771 6.68839 6.95782C6.68839 6.75793 6.60905 6.56622 6.46779 6.42479L2.94779 2.90479C2.80704 2.83757 2.6489 2.81563 2.49517 2.84201C2.34143 2.86839 2.19965 2.94178 2.08936 3.05207C1.97906 3.16237 1.90567 3.30415 1.8793 3.45788C1.85292 3.61162 1.87485 3.76975 1.94207 3.9105L4.95922 6.92765L1.94207 9.9448C1.81838 10.0831 1.75 10.2621 1.75 10.4477C1.75 10.6332 1.81838 10.8122 1.94207 10.9505Z", fill: "currentColor" }, null, -1)]), 16);
}
A.render = ue;
var M = { name: "AngleLeftIcon", extends: b };
function de(e2) {
  return F(e2) || P(e2) || N(e2) || fe();
}
function fe() {
  throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function N(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return I(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? I(e2, t2) : void 0;
  }
}
function P(e2) {
  if (typeof Symbol < "u" && e2[Symbol.iterator] != null || e2["@@iterator"] != null) return Array.from(e2);
}
function F(e2) {
  if (Array.isArray(e2)) return I(e2);
}
function I(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function L(e2, r2, i2, a2, o2, s2) {
  return n(), l("svg", t({ width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, e2.pti()), de(r2[0] ||= [c("path", { d: "M8.75 11.185C8.65146 11.1854 8.55381 11.1662 8.4628 11.1284C8.37179 11.0906 8.28924 11.0351 8.22 10.965L4.72 7.46496C4.57955 7.32433 4.50066 7.13371 4.50066 6.93496C4.50066 6.73621 4.57955 6.54558 4.72 6.40496L8.22 2.93496C8.36095 2.84357 8.52851 2.80215 8.69582 2.81733C8.86312 2.83252 9.02048 2.90344 9.14268 3.01872C9.26487 3.134 9.34483 3.28696 9.36973 3.4531C9.39463 3.61924 9.36303 3.78892 9.28 3.93496L6.28 6.93496L9.28 9.93496C9.42045 10.0756 9.49934 10.2662 9.49934 10.465C9.49934 10.6637 9.42045 10.8543 9.28 10.995C9.13526 11.1257 8.9448 11.1939 8.75 11.185Z", fill: "currentColor" }, null, -1)]), 16);
}
M.render = L;
var R = { name: "BasePaginator", extends: y, props: { totalRecords: { type: Number, default: 0 }, rows: { type: Number, default: 0 }, first: { type: Number, default: 0 }, pageLinkSize: { type: Number, default: 5 }, rowsPerPageOptions: { type: Array, default: null }, template: { type: [Object, String], default: "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown" }, currentPageReportTemplate: { type: null, default: "({currentPage} of {totalPages})" }, alwaysShow: { type: Boolean, default: !0 } }, style: S, provide: function() {
  return { $pcPaginator: this, $parentInstance: this };
} };
var z = { name: "CurrentPageReport", hostName: "Paginator", extends: y, props: { pageCount: { type: Number, default: 0 }, currentPage: { type: Number, default: 0 }, page: { type: Number, default: 0 }, first: { type: Number, default: 0 }, rows: { type: Number, default: 0 }, totalRecords: { type: Number, default: 0 }, template: { type: String, default: "({currentPage} of {totalPages})" } }, computed: { text: function() {
  return this.template.replace("{currentPage}", this.currentPage).replace("{totalPages}", this.pageCount).replace("{first}", this.pageCount > 0 ? this.first + 1 : 0).replace("{last}", Math.min(this.first + this.rows, this.totalRecords)).replace("{rows}", this.rows).replace("{totalRecords}", this.totalRecords);
} } };
function B(e2, r2, i2, a2, o2, s2) {
  return n(), l("span", t({ class: e2.cx("current") }, e2.ptm("current")), d(s2.text), 17);
}
z.render = B;
var V = { name: "FirstPageLink", hostName: "Paginator", extends: y, props: { template: { type: Function, default: null } }, methods: { getPTOptions: function(e2) {
  return this.ptm(e2, { context: { disabled: this.$attrs.disabled } });
} }, components: { AngleDoubleLeftIcon: T }, directives: { ripple: x } };
function pe(e2, i2, o2, s2, c2, u2) {
  var d2 = r("ripple");
  return g((n(), l("button", t({ class: e2.cx("first"), type: "button" }, u2.getPTOptions("first"), { "data-pc-group-section": "pagebutton" }), [(n(), m(a(o2.template || "AngleDoubleLeftIcon"), t({ class: e2.cx("firstIcon") }, u2.getPTOptions("firstIcon")), null, 16, ["class"]))], 16)), [[d2]]);
}
V.render = pe;
var H = { name: "JumpToPageDropdown", hostName: "Paginator", extends: y, emits: ["page-change"], props: { page: Number, pageCount: Number, disabled: Boolean, templates: null }, methods: { onChange: function(e2) {
  this.$emit("page-change", e2);
} }, computed: { pageOptions: function() {
  for (var e2 = [], t2 = 0; t2 < this.pageCount; t2++) e2.push({ label: String(t2 + 1), value: t2 });
  return e2;
} }, components: { JTPSelect: w } };
function me(e2, t2, r2, o2, c2, l2) {
  var u2 = i("JTPSelect");
  return n(), m(u2, { modelValue: r2.page, options: l2.pageOptions, optionLabel: "label", optionValue: "value", "onUpdate:modelValue": t2[0] ||= function(e3) {
    return l2.onChange(e3);
  }, class: s(e2.cx("pcJumpToPageDropdown")), disabled: r2.disabled, unstyled: e2.unstyled, pt: e2.ptm("pcJumpToPageDropdown"), "data-pc-group-section": "pagedropdown" }, _({ _: 2 }, [r2.templates.jumptopagedropdownicon ? { name: "dropdownicon", fn: f(function(e3) {
    return [(n(), m(a(r2.templates.jumptopagedropdownicon), { class: s(e3.class) }, null, 8, ["class"]))];
  }), key: "0" } : void 0]), 1032, ["modelValue", "options", "class", "disabled", "unstyled", "pt"]);
}
H.render = me;
var U = { name: "JumpToPageInput", hostName: "Paginator", extends: y, inheritAttrs: !1, emits: ["page-change"], props: { page: Number, pageCount: Number, disabled: Boolean }, data: function() {
  return { d_page: this.page };
}, watch: { page: function(e2) {
  this.d_page = e2;
} }, methods: { onChange: function(e2) {
  e2 !== this.page && (this.d_page = e2, this.$emit("page-change", e2 - 1));
} }, computed: { inputArialabel: function() {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.jumpToPageInputLabel : void 0;
} }, components: { JTPInput: C } };
function he(e2, t2, r2, a2, o2, c2) {
  var l2 = i("JTPInput");
  return n(), m(l2, { ref: "jtpInput", modelValue: o2.d_page, class: s(e2.cx("pcJumpToPageInputText")), "aria-label": c2.inputArialabel, disabled: r2.disabled, "onUpdate:modelValue": c2.onChange, unstyled: e2.unstyled, pt: e2.ptm("pcJumpToPageInputText") }, null, 8, ["modelValue", "class", "aria-label", "disabled", "onUpdate:modelValue", "unstyled", "pt"]);
}
U.render = he;
var W = { name: "LastPageLink", hostName: "Paginator", extends: y, props: { template: { type: Function, default: null } }, methods: { getPTOptions: function(e2) {
  return this.ptm(e2, { context: { disabled: this.$attrs.disabled } });
} }, components: { AngleDoubleRightIcon: A }, directives: { ripple: x } };
function ge(e2, i2, o2, s2, c2, u2) {
  var d2 = r("ripple");
  return g((n(), l("button", t({ class: e2.cx("last"), type: "button" }, u2.getPTOptions("last"), { "data-pc-group-section": "pagebutton" }), [(n(), m(a(o2.template || "AngleDoubleRightIcon"), t({ class: e2.cx("lastIcon") }, u2.getPTOptions("lastIcon")), null, 16, ["class"]))], 16)), [[d2]]);
}
W.render = ge;
var G = { name: "NextPageLink", hostName: "Paginator", extends: y, props: { template: { type: Function, default: null } }, methods: { getPTOptions: function(e2) {
  return this.ptm(e2, { context: { disabled: this.$attrs.disabled } });
} }, components: { AngleRightIcon: te }, directives: { ripple: x } };
function _e(e2, i2, o2, s2, c2, u2) {
  var d2 = r("ripple");
  return g((n(), l("button", t({ class: e2.cx("next"), type: "button" }, u2.getPTOptions("next"), { "data-pc-group-section": "pagebutton" }), [(n(), m(a(o2.template || "AngleRightIcon"), t({ class: e2.cx("nextIcon") }, u2.getPTOptions("nextIcon")), null, 16, ["class"]))], 16)), [[d2]]);
}
G.render = _e;
var K = { name: "PageLinks", hostName: "Paginator", extends: y, inheritAttrs: !1, emits: ["click"], props: { value: Array, page: Number }, methods: { getPTOptions: function(e2, t2) {
  return this.ptm(t2, { context: { active: e2 === this.page } });
}, onPageLinkClick: function(e2, t2) {
  this.$emit("click", { originalEvent: e2, value: t2 });
}, ariaPageLabel: function(e2) {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.pageLabel.replace(/{page}/g, e2) : void 0;
} }, directives: { ripple: x } };
var ve = ["aria-label", "aria-current", "onClick", "data-p-active"];
function ye(e2, i2, a2, s2, c2, f2) {
  var p2 = r("ripple");
  return n(), l("span", t({ class: e2.cx("pages") }, e2.ptm("pages")), [(n(!0), l(u, null, h(a2.value, function(r2) {
    return g((n(), l("button", t({ key: r2, class: e2.cx("page", { pageLink: r2 }), type: "button", "aria-label": f2.ariaPageLabel(r2), "aria-current": r2 - 1 === a2.page ? "page" : void 0, onClick: function(e3) {
      return f2.onPageLinkClick(e3, r2);
    } }, { ref_for: !0 }, f2.getPTOptions(r2 - 1, "page"), { "data-p-active": r2 - 1 === a2.page }), [o(d(r2), 1)], 16, ve)), [[p2]]);
  }), 128))], 16);
}
K.render = ye;
var q = { name: "PrevPageLink", hostName: "Paginator", extends: y, props: { template: { type: Function, default: null } }, methods: { getPTOptions: function(e2) {
  return this.ptm(e2, { context: { disabled: this.$attrs.disabled } });
} }, components: { AngleLeftIcon: M }, directives: { ripple: x } };
function be(e2, i2, o2, s2, c2, u2) {
  var d2 = r("ripple");
  return g((n(), l("button", t({ class: e2.cx("prev"), type: "button" }, u2.getPTOptions("prev"), { "data-pc-group-section": "pagebutton" }), [(n(), m(a(o2.template || "AngleLeftIcon"), t({ class: e2.cx("prevIcon") }, u2.getPTOptions("prevIcon")), null, 16, ["class"]))], 16)), [[d2]]);
}
q.render = be;
var J = { name: "RowsPerPageDropdown", hostName: "Paginator", extends: y, emits: ["rows-change"], props: { options: Array, rows: Number, disabled: Boolean, templates: null }, methods: { onChange: function(e2) {
  this.$emit("rows-change", e2);
} }, computed: { rowsOptions: function() {
  var e2 = [];
  if (this.options) for (var t2 = 0; t2 < this.options.length; t2++) e2.push({ label: String(this.options[t2]), value: this.options[t2] });
  return e2;
} }, components: { RPPSelect: w } };
function xe(e2, t2, r2, o2, c2, l2) {
  var u2 = i("RPPSelect");
  return n(), m(u2, { modelValue: r2.rows, options: l2.rowsOptions, optionLabel: "label", optionValue: "value", "onUpdate:modelValue": t2[0] ||= function(e3) {
    return l2.onChange(e3);
  }, class: s(e2.cx("pcRowPerPageDropdown")), disabled: r2.disabled, unstyled: e2.unstyled, pt: e2.ptm("pcRowPerPageDropdown"), "data-pc-group-section": "pagedropdown" }, _({ _: 2 }, [r2.templates.rowsperpagedropdownicon ? { name: "dropdownicon", fn: f(function(e3) {
    return [(n(), m(a(r2.templates.rowsperpagedropdownicon), { class: s(e3.class) }, null, 8, ["class"]))];
  }), key: "0" } : void 0]), 1032, ["modelValue", "options", "class", "disabled", "unstyled", "pt"]);
}
J.render = xe;
function Y(e2) {
  "@babel/helpers - typeof";
  return Y = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Y(e2);
}
function X(e2, t2) {
  return we(e2) || Ce(e2, t2) || Z(e2, t2) || Se();
}
function Se() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Z(e2, t2) {
  if (e2) {
    if (typeof e2 == "string") return Q(e2, t2);
    var n2 = {}.toString.call(e2).slice(8, -1);
    return n2 === "Object" && e2.constructor && (n2 = e2.constructor.name), n2 === "Map" || n2 === "Set" ? Array.from(e2) : n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? Q(e2, t2) : void 0;
  }
}
function Q(e2, t2) {
  (t2 == null || t2 > e2.length) && (t2 = e2.length);
  for (var n2 = 0, r2 = Array(t2); n2 < t2; n2++) r2[n2] = e2[n2];
  return r2;
}
function Ce(e2, t2) {
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
function we(e2) {
  if (Array.isArray(e2)) return e2;
}
var $ = { name: "Paginator", extends: R, inheritAttrs: !1, emits: ["update:first", "update:rows", "page"], data: function() {
  return { d_first: this.first, d_rows: this.rows };
}, watch: { first: function(e2) {
  this.d_first = e2;
}, rows: function(e2) {
  this.d_rows = e2;
}, totalRecords: function(e2) {
  this.page > 0 && e2 && this.d_first >= e2 && this.changePage(this.pageCount - 1);
} }, mounted: function() {
  this.createStyle();
}, methods: { changePage: function(e2) {
  var t2 = this.pageCount;
  if (e2 >= 0 && e2 < t2) {
    this.d_first = this.d_rows * e2;
    var n2 = { page: e2, first: this.d_first, rows: this.d_rows, pageCount: t2 };
    this.$emit("update:first", this.d_first), this.$emit("update:rows", this.d_rows), this.$emit("page", n2);
  }
}, changePageToFirst: function(e2) {
  this.isFirstPage || this.changePage(0), e2.preventDefault();
}, changePageToPrev: function(e2) {
  this.changePage(this.page - 1), e2.preventDefault();
}, changePageLink: function(e2) {
  this.changePage(e2.value - 1), e2.originalEvent.preventDefault();
}, changePageToNext: function(e2) {
  this.changePage(this.page + 1), e2.preventDefault();
}, changePageToLast: function(e2) {
  this.isLastPage || this.changePage(this.pageCount - 1), e2.preventDefault();
}, onRowChange: function(e2) {
  this.d_rows = e2, this.changePage(this.page);
}, createStyle: function() {
  var e2 = this;
  if (this.hasBreakpoints() && !this.isUnstyled) {
    var t2;
    this.styleElement = document.createElement("style"), this.styleElement.type = "text/css", v(this.styleElement, "nonce", (t2 = this.$primevue) == null || (t2 = t2.config) == null || (t2 = t2.csp) == null ? void 0 : t2.nonce), document.body.appendChild(this.styleElement);
    var n2 = "", r2 = Object.keys(this.template), i2 = {};
    r2.sort(function(e3, t3) {
      return parseInt(e3) - parseInt(t3);
    }).forEach(function(t3) {
      i2[t3] = e2.template[t3];
    });
    for (var a2 = 0, o2 = Object.entries(Object.entries(i2)); a2 < o2.length; a2++) {
      var s2 = X(o2[a2], 2), c2 = s2[0], l2 = X(s2[1], 1)[0], u2 = void 0, d2 = void 0;
      d2 = l2 !== "default" && typeof Object.keys(i2)[c2 - 1] == "string" ? Number(Object.keys(i2)[c2 - 1].slice(0, -2)) + 1 + "px" : Object.keys(i2)[c2 - 1], u2 = Object.entries(i2)[c2 - 1] ? `and (min-width:${d2})` : "", n2 += l2 === "default" ? `
                            @media screen ${u2} {
                                .p-paginator[${this.$attrSelector}],
                                    display: flex;
                                }
                            }
                        ` : `
.p-paginator-${l2} {
    display: none;
}
@media screen ${u2} and (max-width: ${l2}) {
    .p-paginator-${l2} {
        display: flex;
    }

    .p-paginator-default{
        display: none;
    }
}
                    `;
    }
    this.styleElement.innerHTML = n2;
  }
}, hasBreakpoints: function() {
  return Y(this.template) === "object";
}, getAriaLabel: function(e2) {
  return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria[e2] : void 0;
} }, computed: { templateItems: function() {
  var e2 = {};
  if (this.hasBreakpoints()) {
    for (var t2 in e2 = this.template, e2.default || (e2.default = "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"), e2) e2[t2] = this.template[t2].split(" ").map(function(e3) {
      return e3.trim();
    });
    return e2;
  }
  return e2.default = this.template.split(" ").map(function(e3) {
    return e3.trim();
  }), e2;
}, page: function() {
  return Math.floor(this.d_first / this.d_rows);
}, pageCount: function() {
  return Math.ceil(this.totalRecords / this.d_rows);
}, isFirstPage: function() {
  return this.page === 0;
}, isLastPage: function() {
  return this.page === this.pageCount - 1;
}, calculatePageLinkBoundaries: function() {
  var e2 = this.pageCount, t2 = Math.min(this.pageLinkSize, e2), n2 = Math.max(0, Math.ceil(this.page - t2 / 2)), r2 = Math.min(e2 - 1, n2 + t2 - 1), i2 = this.pageLinkSize - (r2 - n2 + 1);
  return n2 = Math.max(0, n2 - i2), [n2, r2];
}, pageLinks: function() {
  for (var e2 = [], t2 = this.calculatePageLinkBoundaries, n2 = t2[0], r2 = t2[1], i2 = n2; i2 <= r2; i2++) e2.push(i2 + 1);
  return e2;
}, currentState: function() {
  return { page: this.page, first: this.d_first, rows: this.d_rows };
}, empty: function() {
  return this.pageCount === 0;
}, currentPage: function() {
  return this.pageCount > 0 ? this.page + 1 : 0;
}, last: function() {
  return Math.min(this.d_first + this.rows, this.totalRecords);
} }, components: { CurrentPageReport: z, FirstPageLink: V, LastPageLink: W, NextPageLink: G, PageLinks: K, PrevPageLink: q, RowsPerPageDropdown: J, JumpToPageDropdown: H, JumpToPageInput: U } };
function Te(r2, a2, o2, s2, d2, f2) {
  var g2 = i("FirstPageLink"), _2 = i("PrevPageLink"), v2 = i("NextPageLink"), y2 = i("LastPageLink"), b2 = i("PageLinks"), x2 = i("CurrentPageReport"), S2 = i("RowsPerPageDropdown"), C2 = i("JumpToPageDropdown"), w2 = i("JumpToPageInput");
  return r2.alwaysShow || f2.pageLinks && f2.pageLinks.length > 1 ? (n(), l("nav", ee(t({ key: 0 }, r2.ptmi("paginatorContainer"))), [(n(!0), l(u, null, h(f2.templateItems, function(i2, o3) {
    return n(), l("div", t({ key: o3, ref_for: !0, ref: "paginator", class: r2.cx("paginator", { key: o3 }) }, { ref_for: !0 }, r2.ptm("root")), [r2.$slots.container ? e(r2.$slots, "container", { key: 0, first: d2.d_first + 1, last: f2.last, rows: d2.d_rows, page: f2.page, pageCount: f2.pageCount, pageLinks: f2.pageLinks, totalRecords: r2.totalRecords, firstPageCallback: f2.changePageToFirst, lastPageCallback: f2.changePageToLast, prevPageCallback: f2.changePageToPrev, nextPageCallback: f2.changePageToNext, rowChangeCallback: f2.onRowChange, changePageCallback: f2.changePage }) : (n(), l(u, { key: 1 }, [r2.$slots.start ? (n(), l("div", t({ key: 0, class: r2.cx("contentStart") }, { ref_for: !0 }, r2.ptm("contentStart")), [e(r2.$slots, "start", { state: f2.currentState })], 16)) : p("", !0), c("div", t({ class: r2.cx("content") }, { ref_for: !0 }, r2.ptm("content")), [(n(!0), l(u, null, h(i2, function(e2) {
      return n(), l(u, { key: e2 }, [e2 === "FirstPageLink" ? (n(), m(g2, { key: 0, "aria-label": f2.getAriaLabel("firstPageLabel"), template: r2.$slots.firsticon || r2.$slots.firstpagelinkicon, onClick: a2[0] ||= function(e3) {
        return f2.changePageToFirst(e3);
      }, disabled: f2.isFirstPage || f2.empty, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "template", "disabled", "unstyled", "pt"])) : e2 === "PrevPageLink" ? (n(), m(_2, { key: 1, "aria-label": f2.getAriaLabel("prevPageLabel"), template: r2.$slots.previcon || r2.$slots.prevpagelinkicon, onClick: a2[1] ||= function(e3) {
        return f2.changePageToPrev(e3);
      }, disabled: f2.isFirstPage || f2.empty, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "template", "disabled", "unstyled", "pt"])) : e2 === "NextPageLink" ? (n(), m(v2, { key: 2, "aria-label": f2.getAriaLabel("nextPageLabel"), template: r2.$slots.nexticon || r2.$slots.nextpagelinkicon, onClick: a2[2] ||= function(e3) {
        return f2.changePageToNext(e3);
      }, disabled: f2.isLastPage || f2.empty, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "template", "disabled", "unstyled", "pt"])) : e2 === "LastPageLink" ? (n(), m(y2, { key: 3, "aria-label": f2.getAriaLabel("lastPageLabel"), template: r2.$slots.lasticon || r2.$slots.lastpagelinkicon, onClick: a2[3] ||= function(e3) {
        return f2.changePageToLast(e3);
      }, disabled: f2.isLastPage || f2.empty, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "template", "disabled", "unstyled", "pt"])) : e2 === "PageLinks" ? (n(), m(b2, { key: 4, "aria-label": f2.getAriaLabel("pageLabel"), value: f2.pageLinks, page: f2.page, onClick: a2[4] ||= function(e3) {
        return f2.changePageLink(e3);
      }, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "value", "page", "unstyled", "pt"])) : e2 === "CurrentPageReport" ? (n(), m(x2, { key: 5, "aria-live": "polite", template: r2.currentPageReportTemplate, currentPage: f2.currentPage, page: f2.page, pageCount: f2.pageCount, first: d2.d_first, rows: d2.d_rows, totalRecords: r2.totalRecords, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["template", "currentPage", "page", "pageCount", "first", "rows", "totalRecords", "unstyled", "pt"])) : e2 === "RowsPerPageDropdown" && r2.rowsPerPageOptions ? (n(), m(S2, { key: 6, "aria-label": f2.getAriaLabel("rowsPerPageLabel"), rows: d2.d_rows, options: r2.rowsPerPageOptions, onRowsChange: a2[5] ||= function(e3) {
        return f2.onRowChange(e3);
      }, disabled: f2.empty, templates: r2.$slots, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "rows", "options", "disabled", "templates", "unstyled", "pt"])) : e2 === "JumpToPageDropdown" ? (n(), m(C2, { key: 7, "aria-label": f2.getAriaLabel("jumpToPageDropdownLabel"), page: f2.page, pageCount: f2.pageCount, onPageChange: a2[6] ||= function(e3) {
        return f2.changePage(e3);
      }, disabled: f2.empty, templates: r2.$slots, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["aria-label", "page", "pageCount", "disabled", "templates", "unstyled", "pt"])) : e2 === "JumpToPageInput" ? (n(), m(w2, { key: 8, page: f2.currentPage, onPageChange: a2[7] ||= function(e3) {
        return f2.changePage(e3);
      }, disabled: f2.empty, unstyled: r2.unstyled, pt: r2.pt }, null, 8, ["page", "disabled", "unstyled", "pt"])) : p("", !0)], 64);
    }), 128))], 16), r2.$slots.end ? (n(), l("div", t({ key: 1, class: r2.cx("contentEnd") }, { ref_for: !0 }, r2.ptm("contentEnd")), [e(r2.$slots, "end", { state: f2.currentState })], 16)) : p("", !0)], 64))], 16);
  }), 128))], 16)) : p("", !0);
}
$.render = Te;
export {$ as t};
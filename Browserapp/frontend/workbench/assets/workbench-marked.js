// Marked parser and default HTML renderer.
function Qr() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var $r = Qr();
function ei(e4) {
  $r = e4;
}
var ti = { exec: () => null };
function Q(e4, t2 = "") {
  let n2 = typeof e4 == "string" ? e4 : e4.source, r2 = { replace: (e5, t3) => {
    let i2 = typeof t3 == "string" ? t3 : t3.source;
    return i2 = i2.replace(ri.caret, "$1"), n2 = n2.replace(e5, i2), r2;
  }, getRegex: () => new RegExp(n2, t2) };
  return r2;
}
var ni = (() => {
  try {
    return !0;
  } catch {
    return !1;
  }
})();
var ri = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (e4) => RegExp(`^( {0,3}${e4})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}#`), htmlBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}<(?:[a-z].*>|!--)`, "i"), blockquoteBeginRegex: (e4) => RegExp(`^ {0,${Math.min(3, e4 - 1)}}>`) };
var ii = /^(?:[ \t]*(?:\n|$))+/;
var ai = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var oi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var si = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var ci = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var li = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var ui = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var di = Q(ui).replace(/bull/g, li).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var fi = Q(ui).replace(/bull/g, li).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var pi = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var mi = /^[^\n]+/;
var hi = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var gi = Q(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", hi).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var _i = Q(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, li).getRegex();
var vi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var yi = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var bi = Q("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", yi).replace("tag", vi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var xi = Q(pi).replace("hr", si).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vi).getRegex();
var Si = { blockquote: Q(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", xi).getRegex(), code: ai, def: gi, fences: oi, heading: ci, hr: si, html: bi, lheading: di, list: _i, newline: ii, paragraph: xi, table: ti, text: mi };
var Ci = Q("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", si).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vi).getRegex();
var wi = { ...Si, lheading: fi, table: Ci, paragraph: Q(pi).replace("hr", si).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ci).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vi).getRegex() };
var Ti = { ...Si, html: Q(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", yi).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: ti, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: Q(pi).replace("hr", si).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", di).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Ei = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var Di = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var Oi = /^( {2,}|\\)\n(?!\s*$)/;
var ki = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var Ai = /[\p{P}\p{S}]/u;
var ji = /[\s\p{P}\p{S}]/u;
var Mi = /[^\s\p{P}\p{S}]/u;
var Ni = Q(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, ji).getRegex();
var Pi = /(?!~)[\p{P}\p{S}]/u;
var Fi = /(?!~)[\s\p{P}\p{S}]/u;
var Ii = /(?:[^\s\p{P}\p{S}]|~)/u;
var Li = Q(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", ni ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var Ri = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var zi = Q(Ri, "u").replace(/punct/g, Ai).getRegex();
var Bi = Q(Ri, "u").replace(/punct/g, Pi).getRegex();
var Vi = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var Hi = Q(Vi, "gu").replace(/notPunctSpace/g, Mi).replace(/punctSpace/g, ji).replace(/punct/g, Ai).getRegex();
var Ui = Q(Vi, "gu").replace(/notPunctSpace/g, Ii).replace(/punctSpace/g, Fi).replace(/punct/g, Pi).getRegex();
var Wi = Q("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Mi).replace(/punctSpace/g, ji).replace(/punct/g, Ai).getRegex();
var Gi = Q(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, Ai).getRegex();
var Ki = Q("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Mi).replace(/punctSpace/g, ji).replace(/punct/g, Ai).getRegex();
var qi = Q(/\\(punct)/, "gu").replace(/punct/g, Ai).getRegex();
var Ji = Q(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var Yi = Q(yi).replace("(?:-->|$)", "-->").getRegex();
var Xi = Q("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Yi).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var Zi = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
var Qi = Q(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", Zi).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var $i = Q(/^!?\[(label)\]\[(ref)\]/).replace("label", Zi).replace("ref", hi).getRegex();
var ea = Q(/^!?\[(ref)\](?:\[\])?/).replace("ref", hi).getRegex();
var ta = Q("reflink|nolink(?!\\()", "g").replace("reflink", $i).replace("nolink", ea).getRegex();
var na = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var ra = { _backpedal: ti, anyPunctuation: qi, autolink: Ji, blockSkip: Li, br: Oi, code: Di, del: ti, delLDelim: ti, delRDelim: ti, emStrongLDelim: zi, emStrongRDelimAst: Hi, emStrongRDelimUnd: Wi, escape: Ei, link: Qi, nolink: ea, punctuation: Ni, reflink: $i, reflinkSearch: ta, tag: Xi, text: ki, url: ti };
var ia = { ...ra, link: Q(/^!?\[(label)\]\((.*?)\)/).replace("label", Zi).getRegex(), reflink: Q(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Zi).getRegex() };
var aa = { ...ra, emStrongRDelimAst: Ui, emStrongLDelim: Bi, delLDelim: Gi, delRDelim: Ki, url: Q(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", na).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: Q(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", na).getRegex() };
var oa = { ...aa, br: Q(Oi).replace("{2,}", "*").getRegex(), text: Q(aa.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var sa = { normal: Si, gfm: wi, pedantic: Ti };
var ca = { normal: ra, gfm: aa, breaks: oa, pedantic: ia };
var la = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var ua = (e4) => la[e4];
function da(e4, t2) {
  if (t2) {
    if (ri.escapeTest.test(e4)) return e4.replace(ri.escapeReplace, ua);
  } else if (ri.escapeTestNoEncode.test(e4)) return e4.replace(ri.escapeReplaceNoEncode, ua);
  return e4;
}
function fa(e4) {
  try {
    e4 = encodeURI(e4).replace(ri.percentDecode, "%");
  } catch {
    return null;
  }
  return e4;
}
function pa(e4, t2) {
  let n2 = e4.replace(ri.findPipe, (e5, t3, n3) => {
    let r3 = !1, i2 = t3;
    for (; --i2 >= 0 && n3[i2] === "\\"; ) r3 = !r3;
    return r3 ? "|" : " |";
  }).split(ri.splitPipe), r2 = 0;
  if (n2[0].trim() || n2.shift(), n2.length > 0 && !n2.at(-1)?.trim() && n2.pop(), t2)
    if (n2.length > t2) n2.splice(t2);
    else for (; n2.length < t2; ) n2.push("");
  for (; r2 < n2.length; r2++) n2[r2] = n2[r2].trim().replace(ri.slashPipe, "|");
  return n2;
}
function ma(e4, t2, n2) {
  let r2 = e4.length;
  if (r2 === 0) return "";
  let i2 = 0;
  for (; i2 < r2; ) {
    let a2 = e4.charAt(r2 - i2 - 1);
    if (a2 === t2 && !n2) i2++;
    else if (a2 !== t2 && n2) i2++;
    else break;
  }
  return e4.slice(0, r2 - i2);
}
function ha(e4, t2) {
  if (e4.indexOf(t2[1]) === -1) return -1;
  let n2 = 0;
  for (let r2 = 0; r2 < e4.length; r2++) if (e4[r2] === "\\") r2++;
  else if (e4[r2] === t2[0]) n2++;
  else if (e4[r2] === t2[1] && (n2--, n2 < 0)) return r2;
  return n2 > 0 ? -2 : -1;
}
function ga(e4, t2 = 0) {
  let n2 = t2, r2 = "";
  for (let t3 of e4) if (t3 === "	") {
    let e5 = 4 - n2 % 4;
    r2 += " ".repeat(e5), n2 += e5;
  } else r2 += t3, n2++;
  return r2;
}
function _a(e4, t2, n2, r2, i2) {
  let a2 = t2.href, o2 = t2.title || null, s2 = e4[1].replace(i2.other.outputLinkReplace, "$1");
  r2.state.inLink = !0;
  let c2 = { type: e4[0].charAt(0) === "!" ? "image" : "link", raw: n2, href: a2, title: o2, text: s2, tokens: r2.inlineTokens(s2) };
  return r2.state.inLink = !1, c2;
}
function va(e4, t2, n2) {
  let r2 = e4.match(n2.other.indentCodeCompensation);
  if (r2 === null) return t2;
  let i2 = r2[1];
  return t2.split(`
`).map((e5) => {
    let t3 = e5.match(n2.other.beginningSpace);
    if (t3 === null) return e5;
    let [r3] = t3;
    return r3.length >= i2.length ? e5.slice(i2.length) : e5;
  }).join(`
`);
}
var ya = class {
  options;
  rules;
  lexer;
  constructor(e4) {
    this.options = e4 || $r;
  }
  space(e4) {
    let t2 = this.rules.block.newline.exec(e4);
    if (t2 && t2[0].length > 0) return { type: "space", raw: t2[0] };
  }
  code(e4) {
    let t2 = this.rules.block.code.exec(e4);
    if (t2) {
      let e5 = t2[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: t2[0], codeBlockStyle: "indented", text: this.options.pedantic ? e5 : ma(e5, `
`) };
    }
  }
  fences(e4) {
    let t2 = this.rules.block.fences.exec(e4);
    if (t2) {
      let e5 = t2[0], n2 = va(e5, t2[3] || "", this.rules);
      return { type: "code", raw: e5, lang: t2[2] ? t2[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t2[2], text: n2 };
    }
  }
  heading(e4) {
    let t2 = this.rules.block.heading.exec(e4);
    if (t2) {
      let e5 = t2[2].trim();
      if (this.rules.other.endingHash.test(e5)) {
        let t3 = ma(e5, "#");
        (this.options.pedantic || !t3 || this.rules.other.endingSpaceChar.test(t3)) && (e5 = t3.trim());
      }
      return { type: "heading", raw: t2[0], depth: t2[1].length, text: e5, tokens: this.lexer.inline(e5) };
    }
  }
  hr(e4) {
    let t2 = this.rules.block.hr.exec(e4);
    if (t2) return { type: "hr", raw: ma(t2[0], `
`) };
  }
  blockquote(e4) {
    let t2 = this.rules.block.blockquote.exec(e4);
    if (t2) {
      let e5 = ma(t2[0], `
`).split(`
`), n2 = "", r2 = "", i2 = [];
      for (; e5.length > 0; ) {
        let t3 = !1, a2 = [], o2 = 0;
        for (; o2 < e5.length; o2++) if (this.rules.other.blockquoteStart.test(e5[o2])) a2.push(e5[o2]), t3 = !0;
        else if (!t3) a2.push(e5[o2]);
        else break;
        e5 = e5.slice(o2);
        let s2 = a2.join(`
`), c2 = s2.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        n2 = n2 ? `${n2}
${s2}` : s2, r2 = r2 ? `${r2}
${c2}` : c2;
        let l2 = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c2, i2, !0), this.lexer.state.top = l2, e5.length === 0) break;
        let u2 = i2.at(-1);
        if (u2?.type === "code") break;
        if (u2?.type === "blockquote") {
          let t4 = u2, a3 = t4.raw + `
` + e5.join(`
`), o3 = this.blockquote(a3);
          i2[i2.length - 1] = o3, n2 = n2.substring(0, n2.length - t4.raw.length) + o3.raw, r2 = r2.substring(0, r2.length - t4.text.length) + o3.text;
          break;
        }
        if (u2?.type === "list") {
          let t4 = u2, a3 = t4.raw + `
` + e5.join(`
`), o3 = this.list(a3);
          i2[i2.length - 1] = o3, n2 = n2.substring(0, n2.length - u2.raw.length) + o3.raw, r2 = r2.substring(0, r2.length - t4.raw.length) + o3.raw, e5 = a3.substring(i2.at(-1).raw.length).split(`
`);
        }
      }
      return { type: "blockquote", raw: n2, tokens: i2, text: r2 };
    }
  }
  list(e4) {
    let t2 = this.rules.block.list.exec(e4);
    if (t2) {
      let n2 = t2[1].trim(), r2 = n2.length > 1, i2 = { type: "list", raw: "", ordered: r2, start: r2 ? +n2.slice(0, -1) : "", loose: !1, items: [] };
      n2 = r2 ? `\\d{1,9}\\${n2.slice(-1)}` : `\\${n2}`, this.options.pedantic && (n2 = r2 ? n2 : "[*+-]");
      let a2 = this.rules.other.listItemRegex(n2), o2 = !1;
      for (; e4; ) {
        let n3 = !1, r3 = "", s3 = "";
        if (!(t2 = a2.exec(e4)) || this.rules.block.hr.test(e4)) break;
        r3 = t2[0], e4 = e4.substring(r3.length);
        let c2 = ga(t2[2].split(`
`, 1)[0], t2[1].length), l2 = e4.split(`
`, 1)[0], u2 = !c2.trim(), d2 = 0;
        if (this.options.pedantic ? (d2 = 2, s3 = c2.trimStart()) : u2 ? d2 = t2[1].length + 1 : (d2 = c2.search(this.rules.other.nonSpaceChar), d2 = d2 > 4 ? 1 : d2, s3 = c2.slice(d2), d2 += t2[1].length), u2 && this.rules.other.blankLine.test(l2) && (r3 += l2 + `
`, e4 = e4.substring(l2.length + 1), n3 = !0), !n3) {
          let t3 = this.rules.other.nextBulletRegex(d2), n4 = this.rules.other.hrRegex(d2), i3 = this.rules.other.fencesBeginRegex(d2), a3 = this.rules.other.headingBeginRegex(d2), o3 = this.rules.other.htmlBeginRegex(d2), f2 = this.rules.other.blockquoteBeginRegex(d2);
          for (; e4; ) {
            let p2 = e4.split(`
`, 1)[0], m2;
            if (l2 = p2, this.options.pedantic ? (l2 = l2.replace(this.rules.other.listReplaceNesting, "  "), m2 = l2) : m2 = l2.replace(this.rules.other.tabCharGlobal, "    "), i3.test(l2) || a3.test(l2) || o3.test(l2) || f2.test(l2) || t3.test(l2) || n4.test(l2)) break;
            if (m2.search(this.rules.other.nonSpaceChar) >= d2 || !l2.trim()) s3 += `
` + m2.slice(d2);
            else {
              if (u2 || c2.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || i3.test(c2) || a3.test(c2) || n4.test(c2)) break;
              s3 += `
` + l2;
            }
            u2 = !l2.trim(), r3 += p2 + `
`, e4 = e4.substring(p2.length + 1), c2 = m2.slice(d2);
          }
        }
        i2.loose || (o2 ? i2.loose = !0 : this.rules.other.doubleBlankLine.test(r3) && (o2 = !0)), i2.items.push({ type: "list_item", raw: r3, task: !!this.options.gfm && this.rules.other.listIsTask.test(s3), loose: !1, text: s3, tokens: [] }), i2.raw += r3;
      }
      let s2 = i2.items.at(-1);
      if (s2) s2.raw = s2.raw.trimEnd(), s2.text = s2.text.trimEnd();
      else return;
      i2.raw = i2.raw.trimEnd();
      for (let e5 of i2.items) {
        if (this.lexer.state.top = !1, e5.tokens = this.lexer.blockTokens(e5.text, []), e5.task) {
          if (e5.text = e5.text.replace(this.rules.other.listReplaceTask, ""), e5.tokens[0]?.type === "text" || e5.tokens[0]?.type === "paragraph") {
            e5.tokens[0].raw = e5.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), e5.tokens[0].text = e5.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let e6 = this.lexer.inlineQueue.length - 1; e6 >= 0; e6--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[e6].src)) {
              this.lexer.inlineQueue[e6].src = this.lexer.inlineQueue[e6].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let t3 = this.rules.other.listTaskCheckbox.exec(e5.raw);
          if (t3) {
            let n3 = { type: "checkbox", raw: t3[0] + " ", checked: t3[0] !== "[ ]" };
            e5.checked = n3.checked, i2.loose ? e5.tokens[0] && ["paragraph", "text"].includes(e5.tokens[0].type) && "tokens" in e5.tokens[0] && e5.tokens[0].tokens ? (e5.tokens[0].raw = n3.raw + e5.tokens[0].raw, e5.tokens[0].text = n3.raw + e5.tokens[0].text, e5.tokens[0].tokens.unshift(n3)) : e5.tokens.unshift({ type: "paragraph", raw: n3.raw, text: n3.raw, tokens: [n3] }) : e5.tokens.unshift(n3);
          }
        }
        if (!i2.loose) {
          let t3 = e5.tokens.filter((e6) => e6.type === "space");
          i2.loose = t3.length > 0 && t3.some((e6) => this.rules.other.anyLine.test(e6.raw));
        }
      }
      if (i2.loose) for (let e5 of i2.items) {
        e5.loose = !0;
        for (let t3 of e5.tokens) t3.type === "text" && (t3.type = "paragraph");
      }
      return i2;
    }
  }
  html(e4) {
    let t2 = this.rules.block.html.exec(e4);
    if (t2) return { type: "html", block: !0, raw: t2[0], pre: t2[1] === "pre" || t2[1] === "script" || t2[1] === "style", text: t2[0] };
  }
  def(e4) {
    let t2 = this.rules.block.def.exec(e4);
    if (t2) {
      let e5 = t2[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n2 = t2[2] ? t2[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r2 = t2[3] ? t2[3].substring(1, t2[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t2[3];
      return { type: "def", tag: e5, raw: t2[0], href: n2, title: r2 };
    }
  }
  table(e4) {
    let t2 = this.rules.block.table.exec(e4);
    if (!t2 || !this.rules.other.tableDelimiter.test(t2[2])) return;
    let n2 = pa(t2[1]), r2 = t2[2].replace(this.rules.other.tableAlignChars, "").split("|"), i2 = t2[3]?.trim() ? t2[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], a2 = { type: "table", raw: t2[0], header: [], align: [], rows: [] };
    if (n2.length === r2.length) {
      for (let e5 of r2) this.rules.other.tableAlignRight.test(e5) ? a2.align.push("right") : this.rules.other.tableAlignCenter.test(e5) ? a2.align.push("center") : this.rules.other.tableAlignLeft.test(e5) ? a2.align.push("left") : a2.align.push(null);
      for (let e5 = 0; e5 < n2.length; e5++) a2.header.push({ text: n2[e5], tokens: this.lexer.inline(n2[e5]), header: !0, align: a2.align[e5] });
      for (let e5 of i2) a2.rows.push(pa(e5, a2.header.length).map((e6, t3) => ({ text: e6, tokens: this.lexer.inline(e6), header: !1, align: a2.align[t3] })));
      return a2;
    }
  }
  lheading(e4) {
    let t2 = this.rules.block.lheading.exec(e4);
    if (t2) {
      let e5 = t2[1].trim();
      return { type: "heading", raw: t2[0], depth: t2[2].charAt(0) === "=" ? 1 : 2, text: e5, tokens: this.lexer.inline(e5) };
    }
  }
  paragraph(e4) {
    let t2 = this.rules.block.paragraph.exec(e4);
    if (t2) {
      let e5 = t2[1].charAt(t2[1].length - 1) === `
` ? t2[1].slice(0, -1) : t2[1];
      return { type: "paragraph", raw: t2[0], text: e5, tokens: this.lexer.inline(e5) };
    }
  }
  text(e4) {
    let t2 = this.rules.block.text.exec(e4);
    if (t2) return { type: "text", raw: t2[0], text: t2[0], tokens: this.lexer.inline(t2[0]) };
  }
  escape(e4) {
    let t2 = this.rules.inline.escape.exec(e4);
    if (t2) return { type: "escape", raw: t2[0], text: t2[1] };
  }
  tag(e4) {
    let t2 = this.rules.inline.tag.exec(e4);
    if (t2) return !this.lexer.state.inLink && this.rules.other.startATag.test(t2[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t2[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t2[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t2[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: t2[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: t2[0] };
  }
  link(e4) {
    let t2 = this.rules.inline.link.exec(e4);
    if (t2) {
      let e5 = t2[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(e5)) {
        if (!this.rules.other.endAngleBracket.test(e5)) return;
        let t3 = ma(e5.slice(0, -1), "\\");
        if ((e5.length - t3.length) % 2 == 0) return;
      } else {
        let e6 = ha(t2[2], "()");
        if (e6 === -2) return;
        if (e6 > -1) {
          let n3 = (t2[0].indexOf("!") === 0 ? 5 : 4) + t2[1].length + e6;
          t2[2] = t2[2].substring(0, e6), t2[0] = t2[0].substring(0, n3).trim(), t2[3] = "";
        }
      }
      let n2 = t2[2], r2 = "";
      if (this.options.pedantic) {
        let e6 = this.rules.other.pedanticHrefTitle.exec(n2);
        e6 && (n2 = e6[1], r2 = e6[3]);
      } else r2 = t2[3] ? t2[3].slice(1, -1) : "";
      return n2 = n2.trim(), this.rules.other.startAngleBracket.test(n2) && (n2 = this.options.pedantic && !this.rules.other.endAngleBracket.test(e5) ? n2.slice(1) : n2.slice(1, -1)), _a(t2, { href: n2 && n2.replace(this.rules.inline.anyPunctuation, "$1"), title: r2 && r2.replace(this.rules.inline.anyPunctuation, "$1") }, t2[0], this.lexer, this.rules);
    }
  }
  reflink(e4, t2) {
    let n2;
    if ((n2 = this.rules.inline.reflink.exec(e4)) || (n2 = this.rules.inline.nolink.exec(e4))) {
      let e5 = t2[(n2[2] || n2[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
      if (!e5) {
        let e6 = n2[0].charAt(0);
        return { type: "text", raw: e6, text: e6 };
      }
      return _a(n2, e5, n2[0], this.lexer, this.rules);
    }
  }
  emStrong(e4, t2, n2 = "") {
    let r2 = this.rules.inline.emStrongLDelim.exec(e4);
    if (!(!r2 || !r2[1] && !r2[2] && !r2[3] && !r2[4] || r2[4] && n2.match(this.rules.other.unicodeAlphaNumeric)) && (!(r2[1] || r2[3]) || !n2 || this.rules.inline.punctuation.exec(n2))) {
      let n3 = [...r2[0]].length - 1, i2, a2, o2 = n3, s2 = 0, c2 = r2[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c2.lastIndex = 0, t2 = t2.slice(-1 * e4.length + n3); (r2 = c2.exec(t2)) !== null; ) {
        if (i2 = r2[1] || r2[2] || r2[3] || r2[4] || r2[5] || r2[6], !i2) continue;
        if (a2 = [...i2].length, r2[3] || r2[4]) {
          o2 += a2;
          continue;
        }
        if ((r2[5] || r2[6]) && n3 % 3 && !((n3 + a2) % 3)) {
          s2 += a2;
          continue;
        }
        if (o2 -= a2, o2 > 0) continue;
        a2 = Math.min(a2, a2 + o2 + s2);
        let t3 = [...r2[0]][0].length, c3 = e4.slice(0, n3 + r2.index + t3 + a2);
        if (Math.min(n3, a2) % 2) {
          let e5 = c3.slice(1, -1);
          return { type: "em", raw: c3, text: e5, tokens: this.lexer.inlineTokens(e5) };
        }
        let l2 = c3.slice(2, -2);
        return { type: "strong", raw: c3, text: l2, tokens: this.lexer.inlineTokens(l2) };
      }
    }
  }
  codespan(e4) {
    let t2 = this.rules.inline.code.exec(e4);
    if (t2) {
      let e5 = t2[2].replace(this.rules.other.newLineCharGlobal, " "), n2 = this.rules.other.nonSpaceChar.test(e5), r2 = this.rules.other.startingSpaceChar.test(e5) && this.rules.other.endingSpaceChar.test(e5);
      return n2 && r2 && (e5 = e5.substring(1, e5.length - 1)), { type: "codespan", raw: t2[0], text: e5 };
    }
  }
  br(e4) {
    let t2 = this.rules.inline.br.exec(e4);
    if (t2) return { type: "br", raw: t2[0] };
  }
  del(e4, t2, n2 = "") {
    let r2 = this.rules.inline.delLDelim.exec(e4);
    if (r2 && (!r2[1] || !n2 || this.rules.inline.punctuation.exec(n2))) {
      let n3 = [...r2[0]].length - 1, i2, a2, o2 = n3, s2 = this.rules.inline.delRDelim;
      for (s2.lastIndex = 0, t2 = t2.slice(-1 * e4.length + n3); (r2 = s2.exec(t2)) !== null; ) {
        if (i2 = r2[1] || r2[2] || r2[3] || r2[4] || r2[5] || r2[6], !i2 || (a2 = [...i2].length, a2 !== n3)) continue;
        if (r2[3] || r2[4]) {
          o2 += a2;
          continue;
        }
        if (o2 -= a2, o2 > 0) continue;
        a2 = Math.min(a2, a2 + o2);
        let t3 = [...r2[0]][0].length, s3 = e4.slice(0, n3 + r2.index + t3 + a2), c2 = s3.slice(n3, -n3);
        return { type: "del", raw: s3, text: c2, tokens: this.lexer.inlineTokens(c2) };
      }
    }
  }
  autolink(e4) {
    let t2 = this.rules.inline.autolink.exec(e4);
    if (t2) {
      let e5, n2;
      return t2[2] === "@" ? (e5 = t2[1], n2 = "mailto:" + e5) : (e5 = t2[1], n2 = e5), { type: "link", raw: t2[0], text: e5, href: n2, tokens: [{ type: "text", raw: e5, text: e5 }] };
    }
  }
  url(e4) {
    let t2;
    if (t2 = this.rules.inline.url.exec(e4)) {
      let e5, n2;
      if (t2[2] === "@") e5 = t2[0], n2 = "mailto:" + e5;
      else {
        let r2;
        do
          r2 = t2[0], t2[0] = this.rules.inline._backpedal.exec(t2[0])?.[0] ?? "";
        while (r2 !== t2[0]);
        e5 = t2[0], n2 = t2[1] === "www." ? "http://" + t2[0] : t2[0];
      }
      return { type: "link", raw: t2[0], text: e5, href: n2, tokens: [{ type: "text", raw: e5, text: e5 }] };
    }
  }
  inlineText(e4) {
    let t2 = this.rules.inline.text.exec(e4);
    if (t2) {
      let e5 = this.lexer.state.inRawBlock;
      return { type: "text", raw: t2[0], text: t2[0], escaped: e5 };
    }
  }
};
var ba = class e2 {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e4) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e4 || $r, this.options.tokenizer = this.options.tokenizer || new ya(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let t2 = { other: ri, block: sa.normal, inline: ca.normal };
    this.options.pedantic ? (t2.block = sa.pedantic, t2.inline = ca.pedantic) : this.options.gfm && (t2.block = sa.gfm, t2.inline = this.options.breaks ? ca.breaks : ca.gfm), this.tokenizer.rules = t2;
  }
  static get rules() {
    return { block: sa, inline: ca };
  }
  static lex(t2, n2) {
    return new e2(n2).lex(t2);
  }
  static lexInline(t2, n2) {
    return new e2(n2).inlineTokens(t2);
  }
  lex(e4) {
    e4 = e4.replace(ri.carriageReturn, `
`), this.blockTokens(e4, this.tokens);
    for (let e5 = 0; e5 < this.inlineQueue.length; e5++) {
      let t2 = this.inlineQueue[e5];
      this.inlineTokens(t2.src, t2.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e4, t2 = [], n2 = !1) {
    for (this.tokenizer.lexer = this, this.options.pedantic && (e4 = e4.replace(ri.tabCharGlobal, "    ").replace(ri.spaceLine, "")); e4; ) {
      let r2;
      if (this.options.extensions?.block?.some((n3) => (r2 = n3.call({ lexer: this }, e4, t2)) ? (e4 = e4.substring(r2.raw.length), t2.push(r2), !0) : !1)) continue;
      if (r2 = this.tokenizer.space(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        r2.raw.length === 1 && n3 !== void 0 ? n3.raw += `
` : t2.push(r2);
        continue;
      }
      if (r2 = this.tokenizer.code(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        n3?.type === "paragraph" || n3?.type === "text" ? (n3.raw += (n3.raw.endsWith(`
`) ? "" : `
`) + r2.raw, n3.text += `
` + r2.text, this.inlineQueue.at(-1).src = n3.text) : t2.push(r2);
        continue;
      }
      if ((r2 = this.tokenizer.fences(e4)) || (r2 = this.tokenizer.heading(e4)) || (r2 = this.tokenizer.hr(e4)) || (r2 = this.tokenizer.blockquote(e4)) || (r2 = this.tokenizer.list(e4)) || (r2 = this.tokenizer.html(e4))) {
        e4 = e4.substring(r2.raw.length), t2.push(r2);
        continue;
      }
      if (r2 = this.tokenizer.def(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        n3?.type === "paragraph" || n3?.type === "text" ? (n3.raw += (n3.raw.endsWith(`
`) ? "" : `
`) + r2.raw, n3.text += `
` + r2.raw, this.inlineQueue.at(-1).src = n3.text) : this.tokens.links[r2.tag] || (this.tokens.links[r2.tag] = { href: r2.href, title: r2.title }, t2.push(r2));
        continue;
      }
      if ((r2 = this.tokenizer.table(e4)) || (r2 = this.tokenizer.lheading(e4))) {
        e4 = e4.substring(r2.raw.length), t2.push(r2);
        continue;
      }
      let i2 = e4;
      if (this.options.extensions?.startBlock) {
        let t3 = 1 / 0, n3 = e4.slice(1), r3;
        this.options.extensions.startBlock.forEach((e5) => {
          r3 = e5.call({ lexer: this }, n3), typeof r3 == "number" && r3 >= 0 && (t3 = Math.min(t3, r3));
        }), t3 < 1 / 0 && t3 >= 0 && (i2 = e4.substring(0, t3 + 1));
      }
      if (this.state.top && (r2 = this.tokenizer.paragraph(i2))) {
        let a2 = t2.at(-1);
        n2 && a2?.type === "paragraph" ? (a2.raw += (a2.raw.endsWith(`
`) ? "" : `
`) + r2.raw, a2.text += `
` + r2.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a2.text) : t2.push(r2), n2 = i2.length !== e4.length, e4 = e4.substring(r2.raw.length);
      } else if (r2 = this.tokenizer.text(e4)) {
        e4 = e4.substring(r2.raw.length);
        let n3 = t2.at(-1);
        n3?.type === "text" ? (n3.raw += (n3.raw.endsWith(`
`) ? "" : `
`) + r2.raw, n3.text += `
` + r2.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = n3.text) : t2.push(r2);
      } else if (e4) {
        let t3 = "Infinite loop on byte: " + e4.charCodeAt(0);
        if (this.options.silent) {
          console.error(t3);
          break;
        }
        throw Error(t3);
      }
    }
    return this.state.top = !0, t2;
  }
  inline(e4, t2 = []) {
    return this.inlineQueue.push({ src: e4, tokens: t2 }), t2;
  }
  inlineTokens(e4, t2 = []) {
    this.tokenizer.lexer = this;
    let n2 = e4, r2 = null;
    if (this.tokens.links) {
      let e5 = Object.keys(this.tokens.links);
      if (e5.length > 0) for (; (r2 = this.tokenizer.rules.inline.reflinkSearch.exec(n2)) !== null; ) e5.includes(r2[0].slice(r2[0].lastIndexOf("[") + 1, -1)) && (n2 = n2.slice(0, r2.index) + "[" + "a".repeat(r2[0].length - 2) + "]" + n2.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r2 = this.tokenizer.rules.inline.anyPunctuation.exec(n2)) !== null; ) n2 = n2.slice(0, r2.index) + "++" + n2.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let i2;
    for (; (r2 = this.tokenizer.rules.inline.blockSkip.exec(n2)) !== null; ) i2 = r2[2] ? r2[2].length : 0, n2 = n2.slice(0, r2.index + i2) + "[" + "a".repeat(r2[0].length - i2 - 2) + "]" + n2.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n2 = this.options.hooks?.emStrongMask?.call({ lexer: this }, n2) ?? n2;
    let a2 = !1, o2 = "";
    for (; e4; ) {
      a2 || (o2 = ""), a2 = !1;
      let r3;
      if (this.options.extensions?.inline?.some((n3) => (r3 = n3.call({ lexer: this }, e4, t2)) ? (e4 = e4.substring(r3.raw.length), t2.push(r3), !0) : !1)) continue;
      if ((r3 = this.tokenizer.escape(e4)) || (r3 = this.tokenizer.tag(e4)) || (r3 = this.tokenizer.link(e4))) {
        e4 = e4.substring(r3.raw.length), t2.push(r3);
        continue;
      }
      if (r3 = this.tokenizer.reflink(e4, this.tokens.links)) {
        e4 = e4.substring(r3.raw.length);
        let n3 = t2.at(-1);
        r3.type === "text" && n3?.type === "text" ? (n3.raw += r3.raw, n3.text += r3.text) : t2.push(r3);
        continue;
      }
      if ((r3 = this.tokenizer.emStrong(e4, n2, o2)) || (r3 = this.tokenizer.codespan(e4)) || (r3 = this.tokenizer.br(e4)) || (r3 = this.tokenizer.del(e4, n2, o2)) || (r3 = this.tokenizer.autolink(e4)) || !this.state.inLink && (r3 = this.tokenizer.url(e4))) {
        e4 = e4.substring(r3.raw.length), t2.push(r3);
        continue;
      }
      let i3 = e4;
      if (this.options.extensions?.startInline) {
        let t3 = 1 / 0, n3 = e4.slice(1), r4;
        this.options.extensions.startInline.forEach((e5) => {
          r4 = e5.call({ lexer: this }, n3), typeof r4 == "number" && r4 >= 0 && (t3 = Math.min(t3, r4));
        }), t3 < 1 / 0 && t3 >= 0 && (i3 = e4.substring(0, t3 + 1));
      }
      if (r3 = this.tokenizer.inlineText(i3)) {
        e4 = e4.substring(r3.raw.length), r3.raw.slice(-1) !== "_" && (o2 = r3.raw.slice(-1)), a2 = !0;
        let n3 = t2.at(-1);
        n3?.type === "text" ? (n3.raw += r3.raw, n3.text += r3.text) : t2.push(r3);
      } else if (e4) {
        let t3 = "Infinite loop on byte: " + e4.charCodeAt(0);
        if (this.options.silent) {
          console.error(t3);
          break;
        }
        throw Error(t3);
      }
    }
    return t2;
  }
};
var xa = class {
  options;
  parser;
  constructor(e4) {
    this.options = e4 || $r;
  }
  space(e4) {
    return "";
  }
  code({ text: e4, lang: t2, escaped: n2 }) {
    let r2 = (t2 || "").match(ri.notSpaceStart)?.[0], i2 = e4.replace(ri.endingNewline, "") + `
`;
    return r2 ? '<pre><code class="language-' + da(r2) + '">' + (n2 ? i2 : da(i2, !0)) + `</code></pre>
` : "<pre><code>" + (n2 ? i2 : da(i2, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: e4 }) {
    return `<blockquote>
${this.parser.parse(e4)}</blockquote>
`;
  }
  html({ text: e4 }) {
    return e4;
  }
  def(e4) {
    return "";
  }
  heading({ tokens: e4, depth: t2 }) {
    return `<h${t2}>${this.parser.parseInline(e4)}</h${t2}>
`;
  }
  hr(e4) {
    return `<hr>
`;
  }
  list(e4) {
    let t2 = e4.ordered, n2 = e4.start, r2 = "";
    for (let t3 = 0; t3 < e4.items.length; t3++) {
      let n3 = e4.items[t3];
      r2 += this.listitem(n3);
    }
    let i2 = t2 ? "ol" : "ul", a2 = t2 && n2 !== 1 ? ' start="' + n2 + '"' : "";
    return "<" + i2 + a2 + `>
` + r2 + "</" + i2 + `>
`;
  }
  listitem(e4) {
    return `<li>${this.parser.parse(e4.tokens)}</li>
`;
  }
  checkbox({ checked: e4 }) {
    return "<input " + (e4 ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e4 }) {
    return `<p>${this.parser.parseInline(e4)}</p>
`;
  }
  table(e4) {
    let t2 = "", n2 = "";
    for (let t3 = 0; t3 < e4.header.length; t3++) n2 += this.tablecell(e4.header[t3]);
    t2 += this.tablerow({ text: n2 });
    let r2 = "";
    for (let t3 = 0; t3 < e4.rows.length; t3++) {
      let i2 = e4.rows[t3];
      n2 = "";
      for (let e5 = 0; e5 < i2.length; e5++) n2 += this.tablecell(i2[e5]);
      r2 += this.tablerow({ text: n2 });
    }
    return r2 &&= `<tbody>${r2}</tbody>`, `<table>
<thead>
` + t2 + `</thead>
` + r2 + `</table>
`;
  }
  tablerow({ text: e4 }) {
    return `<tr>
${e4}</tr>
`;
  }
  tablecell(e4) {
    let t2 = this.parser.parseInline(e4.tokens), n2 = e4.header ? "th" : "td";
    return (e4.align ? `<${n2} align="${e4.align}">` : `<${n2}>`) + t2 + `</${n2}>
`;
  }
  strong({ tokens: e4 }) {
    return `<strong>${this.parser.parseInline(e4)}</strong>`;
  }
  em({ tokens: e4 }) {
    return `<em>${this.parser.parseInline(e4)}</em>`;
  }
  codespan({ text: e4 }) {
    return `<code>${da(e4, !0)}</code>`;
  }
  br(e4) {
    return "<br>";
  }
  del({ tokens: e4 }) {
    return `<del>${this.parser.parseInline(e4)}</del>`;
  }
  link({ href: e4, title: t2, tokens: n2 }) {
    let r2 = this.parser.parseInline(n2), i2 = fa(e4);
    if (i2 === null) return r2;
    e4 = i2;
    let a2 = '<a href="' + e4 + '"';
    return t2 && (a2 += ' title="' + da(t2) + '"'), a2 += ">" + r2 + "</a>", a2;
  }
  image({ href: e4, title: t2, text: n2, tokens: r2 }) {
    r2 && (n2 = this.parser.parseInline(r2, this.parser.textRenderer));
    let i2 = fa(e4);
    if (i2 === null) return da(n2);
    e4 = i2;
    let a2 = `<img src="${e4}" alt="${da(n2)}"`;
    return t2 && (a2 += ` title="${da(t2)}"`), a2 += ">", a2;
  }
  text(e4) {
    return "tokens" in e4 && e4.tokens ? this.parser.parseInline(e4.tokens) : "escaped" in e4 && e4.escaped ? e4.text : da(e4.text);
  }
};
var Sa = class {
  strong({ text: e4 }) {
    return e4;
  }
  em({ text: e4 }) {
    return e4;
  }
  codespan({ text: e4 }) {
    return e4;
  }
  del({ text: e4 }) {
    return e4;
  }
  html({ text: e4 }) {
    return e4;
  }
  text({ text: e4 }) {
    return e4;
  }
  link({ text: e4 }) {
    return "" + e4;
  }
  image({ text: e4 }) {
    return "" + e4;
  }
  br() {
    return "";
  }
  checkbox({ raw: e4 }) {
    return e4;
  }
};
var Ca = class e3 {
  options;
  renderer;
  textRenderer;
  constructor(e4) {
    this.options = e4 || $r, this.options.renderer = this.options.renderer || new xa(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Sa();
  }
  static parse(t2, n2) {
    return new e3(n2).parse(t2);
  }
  static parseInline(t2, n2) {
    return new e3(n2).parseInline(t2);
  }
  parse(e4) {
    this.renderer.parser = this;
    let t2 = "";
    for (let n2 = 0; n2 < e4.length; n2++) {
      let r2 = e4[n2];
      if (this.options.extensions?.renderers?.[r2.type]) {
        let e5 = r2, n3 = this.options.extensions.renderers[e5.type].call({ parser: this }, e5);
        if (n3 !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(e5.type)) {
          t2 += n3 || "";
          continue;
        }
      }
      let i2 = r2;
      switch (i2.type) {
        case "space":
          t2 += this.renderer.space(i2);
          break;
        case "hr":
          t2 += this.renderer.hr(i2);
          break;
        case "heading":
          t2 += this.renderer.heading(i2);
          break;
        case "code":
          t2 += this.renderer.code(i2);
          break;
        case "table":
          t2 += this.renderer.table(i2);
          break;
        case "blockquote":
          t2 += this.renderer.blockquote(i2);
          break;
        case "list":
          t2 += this.renderer.list(i2);
          break;
        case "checkbox":
          t2 += this.renderer.checkbox(i2);
          break;
        case "html":
          t2 += this.renderer.html(i2);
          break;
        case "def":
          t2 += this.renderer.def(i2);
          break;
        case "paragraph":
          t2 += this.renderer.paragraph(i2);
          break;
        case "text":
          t2 += this.renderer.text(i2);
          break;
        default: {
          let e5 = 'Token with "' + i2.type + '" type was not found.';
          if (this.options.silent) return console.error(e5), "";
          throw Error(e5);
        }
      }
    }
    return t2;
  }
  parseInline(e4, t2 = this.renderer) {
    this.renderer.parser = this;
    let n2 = "";
    for (let r2 = 0; r2 < e4.length; r2++) {
      let i2 = e4[r2];
      if (this.options.extensions?.renderers?.[i2.type]) {
        let e5 = this.options.extensions.renderers[i2.type].call({ parser: this }, i2);
        if (e5 !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i2.type)) {
          n2 += e5 || "";
          continue;
        }
      }
      let a2 = i2;
      switch (a2.type) {
        case "escape":
          n2 += t2.text(a2);
          break;
        case "html":
          n2 += t2.html(a2);
          break;
        case "link":
          n2 += t2.link(a2);
          break;
        case "image":
          n2 += t2.image(a2);
          break;
        case "checkbox":
          n2 += t2.checkbox(a2);
          break;
        case "strong":
          n2 += t2.strong(a2);
          break;
        case "em":
          n2 += t2.em(a2);
          break;
        case "codespan":
          n2 += t2.codespan(a2);
          break;
        case "br":
          n2 += t2.br(a2);
          break;
        case "del":
          n2 += t2.del(a2);
          break;
        case "text":
          n2 += t2.text(a2);
          break;
        default: {
          let e5 = 'Token with "' + a2.type + '" type was not found.';
          if (this.options.silent) return console.error(e5), "";
          throw Error(e5);
        }
      }
    }
    return n2;
  }
};
var wa = class {
  options;
  block;
  constructor(e4) {
    this.options = e4 || $r;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e4) {
    return e4;
  }
  postprocess(e4) {
    return e4;
  }
  processAllTokens(e4) {
    return e4;
  }
  emStrongMask(e4) {
    return e4;
  }
  provideLexer(e4 = this.block) {
    return e4 ? ba.lex : ba.lexInline;
  }
  provideParser(e4 = this.block) {
    return e4 ? Ca.parse : Ca.parseInline;
  }
};
var Ta = new class {
  defaults = Qr();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = Ca;
  Renderer = xa;
  TextRenderer = Sa;
  Lexer = ba;
  Tokenizer = ya;
  Hooks = wa;
  constructor(...e4) {
    this.use(...e4);
  }
  walkTokens(e4, t2) {
    let n2 = [];
    for (let r2 of e4) switch (n2 = n2.concat(t2.call(this, r2)), r2.type) {
      case "table": {
        let e5 = r2;
        for (let r3 of e5.header) n2 = n2.concat(this.walkTokens(r3.tokens, t2));
        for (let r3 of e5.rows) for (let e6 of r3) n2 = n2.concat(this.walkTokens(e6.tokens, t2));
        break;
      }
      case "list": {
        let e5 = r2;
        n2 = n2.concat(this.walkTokens(e5.items, t2));
        break;
      }
      default: {
        let e5 = r2;
        this.defaults.extensions?.childTokens?.[e5.type] ? this.defaults.extensions.childTokens[e5.type].forEach((r3) => {
          let i2 = e5[r3].flat(1 / 0);
          n2 = n2.concat(this.walkTokens(i2, t2));
        }) : e5.tokens && (n2 = n2.concat(this.walkTokens(e5.tokens, t2)));
      }
    }
    return n2;
  }
  use(...e4) {
    let t2 = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e4.forEach((e5) => {
      let n2 = { ...e5 };
      if (n2.async = this.defaults.async || n2.async || !1, e5.extensions && (e5.extensions.forEach((e6) => {
        if (!e6.name) throw Error("extension name required");
        if ("renderer" in e6) {
          let n3 = t2.renderers[e6.name];
          n3 ? t2.renderers[e6.name] = function(...t3) {
            let r2 = e6.renderer.apply(this, t3);
            return r2 === !1 && (r2 = n3.apply(this, t3)), r2;
          } : t2.renderers[e6.name] = e6.renderer;
        }
        if ("tokenizer" in e6) {
          if (!e6.level || e6.level !== "block" && e6.level !== "inline") throw Error("extension level must be 'block' or 'inline'");
          let n3 = t2[e6.level];
          n3 ? n3.unshift(e6.tokenizer) : t2[e6.level] = [e6.tokenizer], e6.start && (e6.level === "block" ? t2.startBlock ? t2.startBlock.push(e6.start) : t2.startBlock = [e6.start] : e6.level === "inline" && (t2.startInline ? t2.startInline.push(e6.start) : t2.startInline = [e6.start]));
        }
        "childTokens" in e6 && e6.childTokens && (t2.childTokens[e6.name] = e6.childTokens);
      }), n2.extensions = t2), e5.renderer) {
        let t3 = this.defaults.renderer || new xa(this.defaults);
        for (let n3 in e5.renderer) {
          if (!(n3 in t3)) throw Error(`renderer '${n3}' does not exist`);
          if (["options", "parser"].includes(n3)) continue;
          let r2 = n3, i2 = e5.renderer[r2], a2 = t3[r2];
          t3[r2] = (...e6) => {
            let n4 = i2.apply(t3, e6);
            return n4 === !1 && (n4 = a2.apply(t3, e6)), n4 || "";
          };
        }
        n2.renderer = t3;
      }
      if (e5.tokenizer) {
        let t3 = this.defaults.tokenizer || new ya(this.defaults);
        for (let n3 in e5.tokenizer) {
          if (!(n3 in t3)) throw Error(`tokenizer '${n3}' does not exist`);
          if (["options", "rules", "lexer"].includes(n3)) continue;
          let r2 = n3, i2 = e5.tokenizer[r2], a2 = t3[r2];
          t3[r2] = (...e6) => {
            let n4 = i2.apply(t3, e6);
            return n4 === !1 && (n4 = a2.apply(t3, e6)), n4;
          };
        }
        n2.tokenizer = t3;
      }
      if (e5.hooks) {
        let t3 = this.defaults.hooks || new wa();
        for (let n3 in e5.hooks) {
          if (!(n3 in t3)) throw Error(`hook '${n3}' does not exist`);
          if (["options", "block"].includes(n3)) continue;
          let r2 = n3, i2 = e5.hooks[r2], a2 = t3[r2];
          t3[r2] = wa.passThroughHooks.has(n3) ? (e6) => {
            if (this.defaults.async && wa.passThroughHooksRespectAsync.has(n3)) return (async () => {
              let n4 = await i2.call(t3, e6);
              return a2.call(t3, n4);
            })();
            let r3 = i2.call(t3, e6);
            return a2.call(t3, r3);
          } : (...e6) => {
            if (this.defaults.async) return (async () => {
              let n5 = await i2.apply(t3, e6);
              return n5 === !1 && (n5 = await a2.apply(t3, e6)), n5;
            })();
            let n4 = i2.apply(t3, e6);
            return n4 === !1 && (n4 = a2.apply(t3, e6)), n4;
          };
        }
        n2.hooks = t3;
      }
      if (e5.walkTokens) {
        let t3 = this.defaults.walkTokens, r2 = e5.walkTokens;
        n2.walkTokens = function(e6) {
          let n3 = [];
          return n3.push(r2.call(this, e6)), t3 && (n3 = n3.concat(t3.call(this, e6))), n3;
        };
      }
      this.defaults = { ...this.defaults, ...n2 };
    }), this;
  }
  setOptions(e4) {
    return this.defaults = { ...this.defaults, ...e4 }, this;
  }
  lexer(e4, t2) {
    return ba.lex(e4, t2 ?? this.defaults);
  }
  parser(e4, t2) {
    return Ca.parse(e4, t2 ?? this.defaults);
  }
  parseMarkdown(e4) {
    return (t2, n2) => {
      let r2 = { ...n2 }, i2 = { ...this.defaults, ...r2 }, a2 = this.onError(!!i2.silent, !!i2.async);
      if (this.defaults.async === !0 && r2.async === !1) return a2(Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof t2 > "u" || t2 === null) return a2(Error("marked(): input parameter is undefined or null"));
      if (typeof t2 != "string") return a2(Error("marked(): input parameter is of type " + Object.prototype.toString.call(t2) + ", string expected"));
      if (i2.hooks && (i2.hooks.options = i2, i2.hooks.block = e4), i2.async) return (async () => {
        let n3 = i2.hooks ? await i2.hooks.preprocess(t2) : t2, r3 = await (i2.hooks ? await i2.hooks.provideLexer(e4) : e4 ? ba.lex : ba.lexInline)(n3, i2), a3 = i2.hooks ? await i2.hooks.processAllTokens(r3) : r3;
        i2.walkTokens && await Promise.all(this.walkTokens(a3, i2.walkTokens));
        let o2 = await (i2.hooks ? await i2.hooks.provideParser(e4) : e4 ? Ca.parse : Ca.parseInline)(a3, i2);
        return i2.hooks ? await i2.hooks.postprocess(o2) : o2;
      })().catch(a2);
      try {
        i2.hooks && (t2 = i2.hooks.preprocess(t2));
        let n3 = (i2.hooks ? i2.hooks.provideLexer(e4) : e4 ? ba.lex : ba.lexInline)(t2, i2);
        i2.hooks && (n3 = i2.hooks.processAllTokens(n3)), i2.walkTokens && this.walkTokens(n3, i2.walkTokens);
        let r3 = (i2.hooks ? i2.hooks.provideParser(e4) : e4 ? Ca.parse : Ca.parseInline)(n3, i2);
        return i2.hooks && (r3 = i2.hooks.postprocess(r3)), r3;
      } catch (e5) {
        return a2(e5);
      }
    };
  }
  onError(e4, t2) {
    return (n2) => {
      if (n2.message += `
Please report this to https://github.com/markedjs/marked.`, e4) {
        let e5 = "<p>An error occurred:</p><pre>" + da(n2.message + "", !0) + "</pre>";
        return t2 ? Promise.resolve(e5) : e5;
      }
      if (t2) return Promise.reject(n2);
      throw n2;
    };
  }
}();
function $(e4, t2) {
  return Ta.parse(e4, t2);
}
($.options = $.setOptions = function(e4) {
  return Ta.setOptions(e4), $.defaults = Ta.defaults, ei($.defaults), $;
});
($.getDefaults = Qr);
($.defaults = $r);
($.use = function(...e4) {
  return Ta.use(...e4), $.defaults = Ta.defaults, ei($.defaults), $;
});
($.walkTokens = function(e4, t2) {
  return Ta.walkTokens(e4, t2);
});
($.parseInline = Ta.parseInline);
($.Parser = Ca);
($.parser = Ca.parse);
($.Renderer = xa);
($.TextRenderer = Sa);
($.Lexer = ba);
($.lexer = ba.lex);
($.Tokenizer = ya);
($.Hooks = wa);
($.parse = $);
export { $ as marked, xa as Renderer };

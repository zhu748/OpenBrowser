import {c as e,i as t,n,r,t as i} from "./isValid-D6rH8LLp.js";
var a = {};
function o() {
  return a;
}
function s(e2, t2) {
  let r2 = o(), i2 = t2?.weekStartsOn ?? t2?.locale?.options?.weekStartsOn ?? r2.weekStartsOn ?? r2.locale?.options?.weekStartsOn ?? 0, a2 = n(e2, t2?.in), s2 = a2.getDay(), c2 = (s2 < i2 ? 7 : 0) + s2 - i2;
  return a2.setDate(a2.getDate() - c2), a2.setHours(0, 0, 0, 0), a2;
}
function c(e2, t2) {
  return s(e2, { ...t2, weekStartsOn: 1 });
}
function l(e2, t2) {
  let i2 = n(e2, t2?.in), a2 = i2.getFullYear(), o2 = r(i2, 0);
  o2.setFullYear(a2 + 1, 0, 4), o2.setHours(0, 0, 0, 0);
  let s2 = c(o2), l2 = r(i2, 0);
  l2.setFullYear(a2, 0, 4), l2.setHours(0, 0, 0, 0);
  let u2 = c(l2);
  return i2.getTime() >= s2.getTime() ? a2 + 1 : i2.getTime() >= u2.getTime() ? a2 : a2 - 1;
}
function u(e2) {
  let t2 = n(e2), r2 = new Date(Date.UTC(t2.getFullYear(), t2.getMonth(), t2.getDate(), t2.getHours(), t2.getMinutes(), t2.getSeconds(), t2.getMilliseconds()));
  return r2.setUTCFullYear(t2.getFullYear()), +e2 - r2;
}
function d(e2, ...t2) {
  let n2 = r.bind(null, e2 || t2.find((e3) => typeof e3 == "object"));
  return t2.map(n2);
}
function f(e2, t2) {
  let r2 = n(e2, t2?.in);
  return r2.setHours(0, 0, 0, 0), r2;
}
function p(e2, n2, r2) {
  let [i2, a2] = d(r2?.in, e2, n2), o2 = f(i2), s2 = f(a2), c2 = +o2 - u(o2), l2 = +s2 - u(s2);
  return Math.round((c2 - l2) / t);
}
function m(e2, t2) {
  let n2 = l(e2, t2), i2 = r(t2?.in || e2, 0);
  return i2.setFullYear(n2, 0, 4), i2.setHours(0, 0, 0, 0), c(i2);
}
function h(e2, t2) {
  let r2 = n(e2, t2?.in);
  return r2.setFullYear(r2.getFullYear(), 0, 1), r2.setHours(0, 0, 0, 0), r2;
}
var g = { lessThanXSeconds: { one: "less than a second", other: "less than {{count}} seconds" }, xSeconds: { one: "1 second", other: "{{count}} seconds" }, halfAMinute: "half a minute", lessThanXMinutes: { one: "less than a minute", other: "less than {{count}} minutes" }, xMinutes: { one: "1 minute", other: "{{count}} minutes" }, aboutXHours: { one: "about 1 hour", other: "about {{count}} hours" }, xHours: { one: "1 hour", other: "{{count}} hours" }, xDays: { one: "1 day", other: "{{count}} days" }, aboutXWeeks: { one: "about 1 week", other: "about {{count}} weeks" }, xWeeks: { one: "1 week", other: "{{count}} weeks" }, aboutXMonths: { one: "about 1 month", other: "about {{count}} months" }, xMonths: { one: "1 month", other: "{{count}} months" }, aboutXYears: { one: "about 1 year", other: "about {{count}} years" }, xYears: { one: "1 year", other: "{{count}} years" }, overXYears: { one: "over 1 year", other: "over {{count}} years" }, almostXYears: { one: "almost 1 year", other: "almost {{count}} years" } };
var _ = (e2, t2, n2) => {
  let r2, i2 = g[e2];
  return r2 = typeof i2 == "string" ? i2 : t2 === 1 ? i2.one : i2.other.replace("{{count}}", t2.toString()), n2?.addSuffix ? n2.comparison && n2.comparison > 0 ? "in " + r2 : r2 + " ago" : r2;
};
function v(e2) {
  return (t2 = {}) => {
    let n2 = t2.width ? String(t2.width) : e2.defaultWidth;
    return e2.formats[n2] || e2.formats[e2.defaultWidth];
  };
}
var y = { date: v({ formats: { full: "EEEE, MMMM do, y", long: "MMMM do, y", medium: "MMM d, y", short: "MM/dd/yyyy" }, defaultWidth: "full" }), time: v({ formats: { full: "h:mm:ss a zzzz", long: "h:mm:ss a z", medium: "h:mm:ss a", short: "h:mm a" }, defaultWidth: "full" }), dateTime: v({ formats: { full: "{{date}} 'at' {{time}}", long: "{{date}} 'at' {{time}}", medium: "{{date}}, {{time}}", short: "{{date}}, {{time}}" }, defaultWidth: "full" }) };
var b = { lastWeek: "'last' eeee 'at' p", yesterday: "'yesterday at' p", today: "'today at' p", tomorrow: "'tomorrow at' p", nextWeek: "eeee 'at' p", other: "P" };
var x = (e2, t2, n2, r2) => b[e2];
function S(e2) {
  return (t2, n2) => {
    let r2 = n2?.context ? String(n2.context) : "standalone", i2;
    if (r2 === "formatting" && e2.formattingValues) {
      let t3 = e2.defaultFormattingWidth || e2.defaultWidth, r3 = n2?.width ? String(n2.width) : t3;
      i2 = e2.formattingValues[r3] || e2.formattingValues[t3];
    } else {
      let t3 = e2.defaultWidth, r3 = n2?.width ? String(n2.width) : e2.defaultWidth;
      i2 = e2.values[r3] || e2.values[t3];
    }
    let a2 = e2.argumentCallback ? e2.argumentCallback(t2) : t2;
    return i2[a2];
  };
}
var C = { ordinalNumber: (e2, t2) => {
  let n2 = Number(e2), r2 = n2 % 100;
  if (r2 > 20 || r2 < 10) switch (r2 % 10) {
    case 1:
      return n2 + "st";
    case 2:
      return n2 + "nd";
    case 3:
      return n2 + "rd";
  }
  return n2 + "th";
}, era: S({ values: { narrow: ["B", "A"], abbreviated: ["BC", "AD"], wide: ["Before Christ", "Anno Domini"] }, defaultWidth: "wide" }), quarter: S({ values: { narrow: ["1", "2", "3", "4"], abbreviated: ["Q1", "Q2", "Q3", "Q4"], wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"] }, defaultWidth: "wide", argumentCallback: (e2) => e2 - 1 }), month: S({ values: { narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], abbreviated: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], wide: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] }, defaultWidth: "wide" }), day: S({ values: { narrow: ["S", "M", "T", "W", "T", "F", "S"], short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], wide: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] }, defaultWidth: "wide" }), dayPeriod: S({ values: { narrow: { am: "a", pm: "p", midnight: "mi", noon: "n", morning: "morning", afternoon: "afternoon", evening: "evening", night: "night" }, abbreviated: { am: "AM", pm: "PM", midnight: "midnight", noon: "noon", morning: "morning", afternoon: "afternoon", evening: "evening", night: "night" }, wide: { am: "a.m.", pm: "p.m.", midnight: "midnight", noon: "noon", morning: "morning", afternoon: "afternoon", evening: "evening", night: "night" } }, defaultWidth: "wide", formattingValues: { narrow: { am: "a", pm: "p", midnight: "mi", noon: "n", morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening", night: "at night" }, abbreviated: { am: "AM", pm: "PM", midnight: "midnight", noon: "noon", morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening", night: "at night" }, wide: { am: "a.m.", pm: "p.m.", midnight: "midnight", noon: "noon", morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening", night: "at night" } }, defaultFormattingWidth: "wide" }) };
function w(e2) {
  return (t2, n2 = {}) => {
    let r2 = n2.width, i2 = r2 && e2.matchPatterns[r2] || e2.matchPatterns[e2.defaultMatchWidth], a2 = t2.match(i2);
    if (!a2) return null;
    let o2 = a2[0], s2 = r2 && e2.parsePatterns[r2] || e2.parsePatterns[e2.defaultParseWidth], c2 = Array.isArray(s2) ? E(s2, (e3) => e3.test(o2)) : T(s2, (e3) => e3.test(o2)), l2;
    l2 = e2.valueCallback ? e2.valueCallback(c2) : c2, l2 = n2.valueCallback ? n2.valueCallback(l2) : l2;
    let u2 = t2.slice(o2.length);
    return { value: l2, rest: u2 };
  };
}
function T(e2, t2) {
  for (let n2 in e2) if (Object.prototype.hasOwnProperty.call(e2, n2) && t2(e2[n2])) return n2;
}
function E(e2, t2) {
  for (let n2 = 0; n2 < e2.length; n2++) if (t2(e2[n2])) return n2;
}
function D(e2) {
  return (t2, n2 = {}) => {
    let r2 = t2.match(e2.matchPattern);
    if (!r2) return null;
    let i2 = r2[0], a2 = t2.match(e2.parsePattern);
    if (!a2) return null;
    let o2 = e2.valueCallback ? e2.valueCallback(a2[0]) : a2[0];
    o2 = n2.valueCallback ? n2.valueCallback(o2) : o2;
    let s2 = t2.slice(i2.length);
    return { value: o2, rest: s2 };
  };
}
var O = { code: "en-US", formatDistance: _, formatLong: y, formatRelative: x, localize: C, match: { ordinalNumber: D({ matchPattern: /^(\d+)(th|st|nd|rd)?/i, parsePattern: /\d+/i, valueCallback: (e2) => parseInt(e2, 10) }), era: w({ matchPatterns: { narrow: /^(b|a)/i, abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i, wide: /^(before christ|before common era|anno domini|common era)/i }, defaultMatchWidth: "wide", parsePatterns: { any: [/^b/i, /^(a|c)/i] }, defaultParseWidth: "any" }), quarter: w({ matchPatterns: { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](th|st|nd|rd)? quarter/i }, defaultMatchWidth: "wide", parsePatterns: { any: [/1/i, /2/i, /3/i, /4/i] }, defaultParseWidth: "any", valueCallback: (e2) => e2 + 1 }), month: w({ matchPatterns: { narrow: /^[jfmasond]/i, abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i }, defaultMatchWidth: "wide", parsePatterns: { narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i], any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i] }, defaultParseWidth: "any" }), day: w({ matchPatterns: { narrow: /^[smtwf]/i, short: /^(su|mo|tu|we|th|fr|sa)/i, abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i, wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i }, defaultMatchWidth: "wide", parsePatterns: { narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i], any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i] }, defaultParseWidth: "any" }), dayPeriod: w({ matchPatterns: { narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i, any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i }, defaultMatchWidth: "any", parsePatterns: { any: { am: /^a/i, pm: /^p/i, midnight: /^mi/i, noon: /^no/i, morning: /morning/i, afternoon: /afternoon/i, evening: /evening/i, night: /night/i } }, defaultParseWidth: "any" }) }, options: { weekStartsOn: 0, firstWeekContainsDate: 1 } };
function k(e2, t2) {
  let r2 = n(e2, t2?.in);
  return p(r2, h(r2)) + 1;
}
function A(t2, r2) {
  let i2 = n(t2, r2?.in), a2 = +c(i2) - m(i2);
  return Math.round(a2 / e) + 1;
}
function j(e2, t2) {
  let i2 = n(e2, t2?.in), a2 = i2.getFullYear(), c2 = o(), l2 = t2?.firstWeekContainsDate ?? t2?.locale?.options?.firstWeekContainsDate ?? c2.firstWeekContainsDate ?? c2.locale?.options?.firstWeekContainsDate ?? 1, u2 = r(t2?.in || e2, 0);
  u2.setFullYear(a2 + 1, 0, l2), u2.setHours(0, 0, 0, 0);
  let d2 = s(u2, t2), f2 = r(t2?.in || e2, 0);
  f2.setFullYear(a2, 0, l2), f2.setHours(0, 0, 0, 0);
  let p2 = s(f2, t2);
  return +i2 >= +d2 ? a2 + 1 : +i2 >= +p2 ? a2 : a2 - 1;
}
function M(e2, t2) {
  let n2 = o(), i2 = t2?.firstWeekContainsDate ?? t2?.locale?.options?.firstWeekContainsDate ?? n2.firstWeekContainsDate ?? n2.locale?.options?.firstWeekContainsDate ?? 1, a2 = j(e2, t2), c2 = r(t2?.in || e2, 0);
  return c2.setFullYear(a2, 0, i2), c2.setHours(0, 0, 0, 0), s(c2, t2);
}
function N(t2, r2) {
  let i2 = n(t2, r2?.in), a2 = +s(i2, r2) - M(i2, r2);
  return Math.round(a2 / e) + 1;
}
function P(e2, t2) {
  return (e2 < 0 ? "-" : "") + Math.abs(e2).toString().padStart(t2, "0");
}
var F = { y(e2, t2) {
  let n2 = e2.getFullYear(), r2 = n2 > 0 ? n2 : 1 - n2;
  return P(t2 === "yy" ? r2 % 100 : r2, t2.length);
}, M(e2, t2) {
  let n2 = e2.getMonth();
  return t2 === "M" ? String(n2 + 1) : P(n2 + 1, 2);
}, d(e2, t2) {
  return P(e2.getDate(), t2.length);
}, a(e2, t2) {
  let n2 = e2.getHours() / 12 >= 1 ? "pm" : "am";
  switch (t2) {
    case "a":
    case "aa":
      return n2.toUpperCase();
    case "aaa":
      return n2;
    case "aaaaa":
      return n2[0];
    default:
      return n2 === "am" ? "a.m." : "p.m.";
  }
}, h(e2, t2) {
  return P(e2.getHours() % 12 || 12, t2.length);
}, H(e2, t2) {
  return P(e2.getHours(), t2.length);
}, m(e2, t2) {
  return P(e2.getMinutes(), t2.length);
}, s(e2, t2) {
  return P(e2.getSeconds(), t2.length);
}, S(e2, t2) {
  let n2 = t2.length, r2 = e2.getMilliseconds();
  return P(Math.trunc(r2 * 10 ** (n2 - 3)), t2.length);
} };
var I = { am: "am", pm: "pm", midnight: "midnight", noon: "noon", morning: "morning", afternoon: "afternoon", evening: "evening", night: "night" };
var L = { G: function(e2, t2, n2) {
  let r2 = +(e2.getFullYear() > 0);
  switch (t2) {
    case "G":
    case "GG":
    case "GGG":
      return n2.era(r2, { width: "abbreviated" });
    case "GGGGG":
      return n2.era(r2, { width: "narrow" });
    default:
      return n2.era(r2, { width: "wide" });
  }
}, y: function(e2, t2, n2) {
  if (t2 === "yo") {
    let t3 = e2.getFullYear(), r2 = t3 > 0 ? t3 : 1 - t3;
    return n2.ordinalNumber(r2, { unit: "year" });
  }
  return F.y(e2, t2);
}, Y: function(e2, t2, n2, r2) {
  let i2 = j(e2, r2), a2 = i2 > 0 ? i2 : 1 - i2;
  return t2 === "YY" ? P(a2 % 100, 2) : t2 === "Yo" ? n2.ordinalNumber(a2, { unit: "year" }) : P(a2, t2.length);
}, R: function(e2, t2) {
  return P(l(e2), t2.length);
}, u: function(e2, t2) {
  return P(e2.getFullYear(), t2.length);
}, Q: function(e2, t2, n2) {
  let r2 = Math.ceil((e2.getMonth() + 1) / 3);
  switch (t2) {
    case "Q":
      return String(r2);
    case "QQ":
      return P(r2, 2);
    case "Qo":
      return n2.ordinalNumber(r2, { unit: "quarter" });
    case "QQQ":
      return n2.quarter(r2, { width: "abbreviated", context: "formatting" });
    case "QQQQQ":
      return n2.quarter(r2, { width: "narrow", context: "formatting" });
    default:
      return n2.quarter(r2, { width: "wide", context: "formatting" });
  }
}, q: function(e2, t2, n2) {
  let r2 = Math.ceil((e2.getMonth() + 1) / 3);
  switch (t2) {
    case "q":
      return String(r2);
    case "qq":
      return P(r2, 2);
    case "qo":
      return n2.ordinalNumber(r2, { unit: "quarter" });
    case "qqq":
      return n2.quarter(r2, { width: "abbreviated", context: "standalone" });
    case "qqqqq":
      return n2.quarter(r2, { width: "narrow", context: "standalone" });
    default:
      return n2.quarter(r2, { width: "wide", context: "standalone" });
  }
}, M: function(e2, t2, n2) {
  let r2 = e2.getMonth();
  switch (t2) {
    case "M":
    case "MM":
      return F.M(e2, t2);
    case "Mo":
      return n2.ordinalNumber(r2 + 1, { unit: "month" });
    case "MMM":
      return n2.month(r2, { width: "abbreviated", context: "formatting" });
    case "MMMMM":
      return n2.month(r2, { width: "narrow", context: "formatting" });
    default:
      return n2.month(r2, { width: "wide", context: "formatting" });
  }
}, L: function(e2, t2, n2) {
  let r2 = e2.getMonth();
  switch (t2) {
    case "L":
      return String(r2 + 1);
    case "LL":
      return P(r2 + 1, 2);
    case "Lo":
      return n2.ordinalNumber(r2 + 1, { unit: "month" });
    case "LLL":
      return n2.month(r2, { width: "abbreviated", context: "standalone" });
    case "LLLLL":
      return n2.month(r2, { width: "narrow", context: "standalone" });
    default:
      return n2.month(r2, { width: "wide", context: "standalone" });
  }
}, w: function(e2, t2, n2, r2) {
  let i2 = N(e2, r2);
  return t2 === "wo" ? n2.ordinalNumber(i2, { unit: "week" }) : P(i2, t2.length);
}, I: function(e2, t2, n2) {
  let r2 = A(e2);
  return t2 === "Io" ? n2.ordinalNumber(r2, { unit: "week" }) : P(r2, t2.length);
}, d: function(e2, t2, n2) {
  return t2 === "do" ? n2.ordinalNumber(e2.getDate(), { unit: "date" }) : F.d(e2, t2);
}, D: function(e2, t2, n2) {
  let r2 = k(e2);
  return t2 === "Do" ? n2.ordinalNumber(r2, { unit: "dayOfYear" }) : P(r2, t2.length);
}, E: function(e2, t2, n2) {
  let r2 = e2.getDay();
  switch (t2) {
    case "E":
    case "EE":
    case "EEE":
      return n2.day(r2, { width: "abbreviated", context: "formatting" });
    case "EEEEE":
      return n2.day(r2, { width: "narrow", context: "formatting" });
    case "EEEEEE":
      return n2.day(r2, { width: "short", context: "formatting" });
    default:
      return n2.day(r2, { width: "wide", context: "formatting" });
  }
}, e: function(e2, t2, n2, r2) {
  let i2 = e2.getDay(), a2 = (i2 - r2.weekStartsOn + 8) % 7 || 7;
  switch (t2) {
    case "e":
      return String(a2);
    case "ee":
      return P(a2, 2);
    case "eo":
      return n2.ordinalNumber(a2, { unit: "day" });
    case "eee":
      return n2.day(i2, { width: "abbreviated", context: "formatting" });
    case "eeeee":
      return n2.day(i2, { width: "narrow", context: "formatting" });
    case "eeeeee":
      return n2.day(i2, { width: "short", context: "formatting" });
    default:
      return n2.day(i2, { width: "wide", context: "formatting" });
  }
}, c: function(e2, t2, n2, r2) {
  let i2 = e2.getDay(), a2 = (i2 - r2.weekStartsOn + 8) % 7 || 7;
  switch (t2) {
    case "c":
      return String(a2);
    case "cc":
      return P(a2, t2.length);
    case "co":
      return n2.ordinalNumber(a2, { unit: "day" });
    case "ccc":
      return n2.day(i2, { width: "abbreviated", context: "standalone" });
    case "ccccc":
      return n2.day(i2, { width: "narrow", context: "standalone" });
    case "cccccc":
      return n2.day(i2, { width: "short", context: "standalone" });
    default:
      return n2.day(i2, { width: "wide", context: "standalone" });
  }
}, i: function(e2, t2, n2) {
  let r2 = e2.getDay(), i2 = r2 === 0 ? 7 : r2;
  switch (t2) {
    case "i":
      return String(i2);
    case "ii":
      return P(i2, t2.length);
    case "io":
      return n2.ordinalNumber(i2, { unit: "day" });
    case "iii":
      return n2.day(r2, { width: "abbreviated", context: "formatting" });
    case "iiiii":
      return n2.day(r2, { width: "narrow", context: "formatting" });
    case "iiiiii":
      return n2.day(r2, { width: "short", context: "formatting" });
    default:
      return n2.day(r2, { width: "wide", context: "formatting" });
  }
}, a: function(e2, t2, n2) {
  let r2 = e2.getHours() / 12 >= 1 ? "pm" : "am";
  switch (t2) {
    case "a":
    case "aa":
      return n2.dayPeriod(r2, { width: "abbreviated", context: "formatting" });
    case "aaa":
      return n2.dayPeriod(r2, { width: "abbreviated", context: "formatting" }).toLowerCase();
    case "aaaaa":
      return n2.dayPeriod(r2, { width: "narrow", context: "formatting" });
    default:
      return n2.dayPeriod(r2, { width: "wide", context: "formatting" });
  }
}, b: function(e2, t2, n2) {
  let r2 = e2.getHours(), i2;
  switch (i2 = r2 === 12 ? I.noon : r2 === 0 ? I.midnight : r2 / 12 >= 1 ? "pm" : "am", t2) {
    case "b":
    case "bb":
      return n2.dayPeriod(i2, { width: "abbreviated", context: "formatting" });
    case "bbb":
      return n2.dayPeriod(i2, { width: "abbreviated", context: "formatting" }).toLowerCase();
    case "bbbbb":
      return n2.dayPeriod(i2, { width: "narrow", context: "formatting" });
    default:
      return n2.dayPeriod(i2, { width: "wide", context: "formatting" });
  }
}, B: function(e2, t2, n2) {
  let r2 = e2.getHours(), i2;
  switch (i2 = r2 >= 17 ? I.evening : r2 >= 12 ? I.afternoon : r2 >= 4 ? I.morning : I.night, t2) {
    case "B":
    case "BB":
    case "BBB":
      return n2.dayPeriod(i2, { width: "abbreviated", context: "formatting" });
    case "BBBBB":
      return n2.dayPeriod(i2, { width: "narrow", context: "formatting" });
    default:
      return n2.dayPeriod(i2, { width: "wide", context: "formatting" });
  }
}, h: function(e2, t2, n2) {
  if (t2 === "ho") {
    let t3 = e2.getHours() % 12;
    return t3 === 0 && (t3 = 12), n2.ordinalNumber(t3, { unit: "hour" });
  }
  return F.h(e2, t2);
}, H: function(e2, t2, n2) {
  return t2 === "Ho" ? n2.ordinalNumber(e2.getHours(), { unit: "hour" }) : F.H(e2, t2);
}, K: function(e2, t2, n2) {
  let r2 = e2.getHours() % 12;
  return t2 === "Ko" ? n2.ordinalNumber(r2, { unit: "hour" }) : P(r2, t2.length);
}, k: function(e2, t2, n2) {
  let r2 = e2.getHours();
  return r2 === 0 && (r2 = 24), t2 === "ko" ? n2.ordinalNumber(r2, { unit: "hour" }) : P(r2, t2.length);
}, m: function(e2, t2, n2) {
  return t2 === "mo" ? n2.ordinalNumber(e2.getMinutes(), { unit: "minute" }) : F.m(e2, t2);
}, s: function(e2, t2, n2) {
  return t2 === "so" ? n2.ordinalNumber(e2.getSeconds(), { unit: "second" }) : F.s(e2, t2);
}, S: function(e2, t2) {
  return F.S(e2, t2);
}, X: function(e2, t2, n2) {
  let r2 = e2.getTimezoneOffset();
  if (r2 === 0) return "Z";
  switch (t2) {
    case "X":
      return z(r2);
    case "XXXX":
    case "XX":
      return B(r2);
    default:
      return B(r2, ":");
  }
}, x: function(e2, t2, n2) {
  let r2 = e2.getTimezoneOffset();
  switch (t2) {
    case "x":
      return z(r2);
    case "xxxx":
    case "xx":
      return B(r2);
    default:
      return B(r2, ":");
  }
}, O: function(e2, t2, n2) {
  let r2 = e2.getTimezoneOffset();
  switch (t2) {
    case "O":
    case "OO":
    case "OOO":
      return "GMT" + R(r2, ":");
    default:
      return "GMT" + B(r2, ":");
  }
}, z: function(e2, t2, n2) {
  let r2 = e2.getTimezoneOffset();
  switch (t2) {
    case "z":
    case "zz":
    case "zzz":
      return "GMT" + R(r2, ":");
    default:
      return "GMT" + B(r2, ":");
  }
}, t: function(e2, t2, n2) {
  return P(Math.trunc(e2 / 1e3), t2.length);
}, T: function(e2, t2, n2) {
  return P(+e2, t2.length);
} };
function R(e2, t2 = "") {
  let n2 = e2 > 0 ? "-" : "+", r2 = Math.abs(e2), i2 = Math.trunc(r2 / 60), a2 = r2 % 60;
  return a2 === 0 ? n2 + String(i2) : n2 + String(i2) + t2 + P(a2, 2);
}
function z(e2, t2) {
  return e2 % 60 == 0 ? (e2 > 0 ? "-" : "+") + P(Math.abs(e2) / 60, 2) : B(e2, t2);
}
function B(e2, t2 = "") {
  let n2 = e2 > 0 ? "-" : "+", r2 = Math.abs(e2), i2 = P(Math.trunc(r2 / 60), 2), a2 = P(r2 % 60, 2);
  return n2 + i2 + t2 + a2;
}
var V = (e2, t2) => {
  switch (e2) {
    case "P":
      return t2.date({ width: "short" });
    case "PP":
      return t2.date({ width: "medium" });
    case "PPP":
      return t2.date({ width: "long" });
    default:
      return t2.date({ width: "full" });
  }
};
var H = (e2, t2) => {
  switch (e2) {
    case "p":
      return t2.time({ width: "short" });
    case "pp":
      return t2.time({ width: "medium" });
    case "ppp":
      return t2.time({ width: "long" });
    default:
      return t2.time({ width: "full" });
  }
};
var U = { p: H, P: (e2, t2) => {
  let n2 = e2.match(/(P+)(p+)?/) || [], r2 = n2[1], i2 = n2[2];
  if (!i2) return V(e2, t2);
  let a2;
  switch (r2) {
    case "P":
      a2 = t2.dateTime({ width: "short" });
      break;
    case "PP":
      a2 = t2.dateTime({ width: "medium" });
      break;
    case "PPP":
      a2 = t2.dateTime({ width: "long" });
      break;
    default:
      a2 = t2.dateTime({ width: "full" });
  }
  return a2.replace("{{date}}", V(r2, t2)).replace("{{time}}", H(i2, t2));
} };
var W = /^D+$/;
var G = /^Y+$/;
var K = ["D", "DD", "YY", "YYYY"];
function q(e2) {
  return W.test(e2);
}
function J(e2) {
  return G.test(e2);
}
function Y(e2, t2, n2) {
  let r2 = X(e2, t2, n2);
  if (console.warn(r2), K.includes(e2)) throw RangeError(r2);
}
function X(e2, t2, n2) {
  let r2 = e2[0] === "Y" ? "years" : "days of the month";
  return `Use \`${e2.toLowerCase()}\` instead of \`${e2}\` (in \`${t2}\`) for formatting ${r2} to the input \`${n2}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
var Z = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var Q = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var $ = /^'([^]*?)'?$/;
var ee = /''/g;
var te = /[a-zA-Z]/;
function ne(e2, t2, r2) {
  let a2 = o(), s2 = r2?.locale ?? a2.locale ?? O, c2 = r2?.firstWeekContainsDate ?? r2?.locale?.options?.firstWeekContainsDate ?? a2.firstWeekContainsDate ?? a2.locale?.options?.firstWeekContainsDate ?? 1, l2 = r2?.weekStartsOn ?? r2?.locale?.options?.weekStartsOn ?? a2.weekStartsOn ?? a2.locale?.options?.weekStartsOn ?? 0, u2 = n(e2, r2?.in);
  if (!i(u2)) throw RangeError("Invalid time value");
  let d2 = t2.match(Q).map((e3) => {
    let t3 = e3[0];
    if (t3 === "p" || t3 === "P") {
      let n2 = U[t3];
      return n2(e3, s2.formatLong);
    }
    return e3;
  }).join("").match(Z).map((e3) => {
    if (e3 === "''") return { isToken: !1, value: "'" };
    let t3 = e3[0];
    if (t3 === "'") return { isToken: !1, value: re(e3) };
    if (L[t3]) return { isToken: !0, value: e3 };
    if (t3.match(te)) throw RangeError("Format string contains an unescaped latin alphabet character `" + t3 + "`");
    return { isToken: !1, value: e3 };
  });
  s2.localize.preprocessor && (d2 = s2.localize.preprocessor(u2, d2));
  let f2 = { firstWeekContainsDate: c2, weekStartsOn: l2, locale: s2 };
  return d2.map((n2) => {
    if (!n2.isToken) return n2.value;
    let i2 = n2.value;
    (!r2?.useAdditionalWeekYearTokens && J(i2) || !r2?.useAdditionalDayOfYearTokens && q(i2)) && Y(i2, t2, String(e2));
    let a3 = L[i2[0]];
    return a3(u2, i2, s2.localize, f2);
  }).join("");
}
function re(e2) {
  let t2 = e2.match($);
  return t2 ? t2[1].replace(ee, "'") : e2;
}
export {d as d,ne as t};
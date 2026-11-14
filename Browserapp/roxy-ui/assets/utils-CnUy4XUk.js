import {o as e} from "./rolldown-runtime-BCiCTKAo.js";
import {h as n,m as r,qt as i,ti as a} from "./utils-BIWenCnY.js";
import {i as o} from "./cookie-CqdL0VrU.js";
import {t as s} from "./format-_cvrr_iF.js";
import {t as c} from "./exceljs.min-DfecxsXL.js";
var l = e(c(), 1);
function u(e2) {
  return e2.match(/^(?!:)(?<platform>https?:\/\/[^:\s[\]{}]+)?(?::?(?<username>[^:[\]{}\s]+)(?::(?<password>[^:[\]{}\s]+))?(?::(?<twoFactor>[^:[\]{}\s]+))?)?(?:\[(?<linkedEmail>[^[\]]+)\])?(?:\{(?<remark>[^{}]+)\})?$/)?.groups ?? {};
}
function d(e2) {
  return e2 == null || e2 === "" ? "" : typeof e2 == "object" && e2 && "text" in e2 ? String(e2.text).trim() : String(e2).trim();
}
async function f() {
  let { coreVersion: e2 } = await r();
  return { os: "Windows", osVersion: "11", coreVersion: e2[0]?.value ?? "", browserVersion: null, isLanguageBaseIp: !0, language: "sq-AL", isDisplayLanguageBaseIp: !0, displayLanguage: "sq-AL", defaultOpenUrl: [], isTimeZone: !0, timeZone: "GMT-01:00 America/Scoresbysund", position: 1, isPositionBaseIp: !0, longitude: "", latitude: "", precisionPos: "1000", forbidAudio: !0, forbidImage: !0, forbidMedia: !0, positionSwitch: !0, openWidth: 1e3, openHeight: 1e3, windowRatioPosition: "0,0,tl", resolutionType: !1, resolutionX: "1280", resolutionY: "720", fontType: !1, webRTC: 2, webGL: !0, webGLInfo: 1, webGpu: "webgl", canvas: !0, audioContext: !0, speechVoices: !0, doNotTrack: !0, clientRects: !0, deviceInfo: !0, deviceNameSwitch: !0, macInfo: !0, hardwareConcurrent: "12", deviceMemory: "8", disableSsl: !1, disableSslList: [], portScanProtect: !0, portScanList: "", useGpu: !0, sandboxPermission: !1, startupParam: "", isDisplayName: !1, syncBookmark: !1, syncHistory: !1, syncTab: !0, syncCookie: !0, syncExtensions: !1, syncPassword: !0, syncIndexedDb: !1, syncLocalStorage: !0, clearCacheFile: !1, clearCookie: !1, clearLocalStorage: !1, randomFingerprint: !1, forbidSavePassword: !0, stopOpenNet: !1, stopOpenIP: !1, stopOpenPosition: !1, openWorkbench: 1, searchEngine: "Google", openBookmarks: !1, syncSessionStorage: !1, ipChangeRemind: 2, enableGoogleLogin: 2, blockDomainList: "", allowDomainList: "" };
}
async function p() {
  let e2 = $t("\u4E3E\u4F8B"), [o2, s2] = await Promise.all([r(), n.platform.userGetSearchEnginesList()]), { os: c2, version: l2 } = o2.os.reduce((t2, n2, r2) => {
    let i2 = `${e2}${r2 + 1}: ${n2.label}`, a2 = o2[`osversion_${n2.value.toLocaleLowerCase()}`].map((e3) => e3.value).join("\u3001");
    return t2.os.push(i2), t2.version.push(`${n2.label}: ${a2}`), t2;
  }, { os: [], version: [] }), d2 = o2.coreVersion?.map((e3) => e3.value) ?? [], f2 = o2.firefoxCoreVersion?.map((e3) => e3.value) ?? [], p2 = [];
  return s2.code === 0 && s2.data && (p2 = s2.data.map((t2, n2) => `${e2}${n2 + 1}: ${t2.code}`)), [{ header: $t("\u7A97\u53E3\u540D\u79F0"), key: "windowName", required: !0, placeholder: $t("\u4E3A\u6D4F\u89C8\u5668\u7A97\u53E3\u547D\u540D\uFF08\u5FC5\u586B\u9879\uFF09"), example: `${e2}: Roxytest` }, { header: $t("\u64CD\u4F5C\u7CFB\u7EDF"), key: "os", required: !0, placeholder: $t(`\u64CD\u4F5C\u7CFB\u7EDF\uFF08\u5FC5\u586B\u9879\uFF09
\u5982: Windows`), example: c2.join(`
`) }, ...a() ? [{ header: $t("\u6D4F\u89C8\u5668\u5185\u6838"), key: "coreType", required: !0, placeholder: $t(`\u6D4F\u89C8\u5668\u5185\u6838\uFF08\u5FC5\u586B\u9879\uFF09
\u5982: Chrome`), example: [i.Chrome, i.Firefox].map((t2) => `${e2}: ${t2}`).join(`
`) }, { header: $t("\u5185\u6838\u7248\u672C"), key: "coreVersion", placeholder: $t(`\u5185\u6838\u7248\u672C\uFF0C\u5982\uFF1A{version}
\u6BCF\u884C\u53EA\u80FD\u586B\u5199\u4E00\u4E2A,\u7559\u7A7A\u5219\u81EA\u52A8\u4F7F\u7528\u5BF9\u5E94\u5185\u6838\u6700\u65B0\u7248\u672C`, { version: d2[0] ?? "149" }), example: `${$t("\u53EF\u7528\u5185\u6838\u7248\u672C:")}
RoxyChrome: ${d2.join("\u3001")}
RoxyFirefox: ${f2.join("\u3001")}` }] : [], { header: $t("\u7CFB\u7EDF\u7248\u672C"), key: "osVersion", width: 50, placeholder: $t(`\u64CD\u4F5C\u7CFB\u7EDF\u7248\u672C, \u5982: 11
\u6BCF\u884C\u53EA\u80FD\u586B\u5199\u4E00\u4E2A, \u7559\u7A7A\u5219\u81EA\u52A8\u4F7F\u7528\u5BF9\u5E94\u64CD\u4F5C\u7CFB\u7EDF\u6700\u65B0\u7248\u672C`), example: `${$t("\u53EF\u7528\u7684\u7CFB\u7EDF\u7248\u672C:")}
${l2.join(`
`)}` }, { header: $t("\u4EE3\u7406 IP \u7C7B\u578B"), key: "proxyCategory", placeholder: $t('\u4EE3\u7406 IP \u7C7B\u578B, \u5982: SOCKS5, \u7559\u7A7A\u5219\u81EA\u52A8\u4F7F\u7528 "\u76F4\u8FDE"'), example: `${e2}1: SOCKS5
${e2}2: HTTP
${e2}3: HTTPS
${e2}4: SSH` }, { header: $t("\u4EE3\u7406 IP \u4FE1\u606F"), key: "proxyInfo", width: 70, placeholder: "richText", example: `${e2}1: 192.168.0.1:8800
${e2}2: 192.168.0.1:8800:roxytest:roxypass
${e2}3: 192.168.0.1:8800:roxytest:roxypass[http://refresh.roxy.com]
${e2}4: ipv6:192.168.0.1:8800:roxytest:roxypass`, richText: [{ text: `${$t("\u8BF7\u52A1\u5FC5\u6309\u7167\u6B64\u987A\u5E8F\u683C\u5F0F\u586B\u5199:")}
` }, { font: { color: { argb: "EF4444" } }, text: `${$t("\u3010\u4EE3\u7406 IP \u4E3B\u673A:\u4EE3\u7406 IP \u7AEF\u53E3:\u4EE3\u7406 IP \u7528\u6237\u540D:\u4EE3\u7406 IP \u5BC6\u7801[\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL]\u3011")}
` }, { font: { color: { argb: "EF4444" } }, text: `${$t("\u5176\u4E2D \u4EE3\u7406 IP \u7528\u6237\u540D\u3001\u4EE3\u7406 IP \u5BC6\u7801\u3001[\u52A8\u6001\u4EE3\u7406 IP \u5237\u65B0 URL] \u4E3A\u9009\u586B")}
` }, { text: $t("\u82E5\u7F51\u7EDC\u534F\u8BAE\u4E3Aipv6, \u8BF7\u5728\u4EE3\u7406 IP \u4FE1\u606F\u6700\u524D\u7AEF\u6DFB\u52A0 ipv6:") }] }, { header: $t("\u5E73\u53F0\u8D26\u53F7"), key: "windowPlatformList", width: 90, placeholder: "richText", example: `${e2}: 
[
  "https://x.com/:roxy1:123",
  "https://www.tiktok.com/:roxy2:456",
  "https://www.youtube.com/:roxy3:789:roxy_2fa"
]`, richText: [{ text: $t("\u4EC5\u652F\u6301 JSON \u683C\u5F0F\u7684\u6570\u7EC4, \u53EF\u652F\u6301\u586B\u5199\u591A\u4E2A\u8D26\u53F7, \u591A\u4E2A\u8D26\u53F7\u8BF7\u4F7F\u7528\u82F1\u6587\u9017\u53F7\u9694\u5F00! ") }, { font: { color: { argb: "EF4444" } }, text: $t("\u9700\u8981\u7528 [ ] \u5305\u542B\uFF01") }, { text: `${$t(`\u8BF7\u52A1\u5FC5\u6309\u7167\u793A\u4F8B\u586B\u5199
`)}` }, { font: { color: { argb: "EF4444" } }, text: `${$t("\u3010\u5E73\u53F0:\u8D26\u53F7:\u5BC6\u7801:2FA\u3011")}` }], formatValue: (value) => {
    const rows = JSON.parse(value || "[]");
    if (!Array.isArray(rows)) throw Error("\u5E73\u53F0\u8D26\u53F7\u5FC5\u987B\u662F JSON \u6570\u7EC4");
    return rows.map((value2) => {
      if (typeof value2 != "string") throw Error("\u5E73\u53F0\u8D26\u53F7\u683C\u5F0F\u9519\u8BEF");
      const item = u(value2);
      if (!Object.keys(item).length) throw Error("\u5E73\u53F0\u8D26\u53F7\u683C\u5F0F\u9519\u8BEF");
      return { platformUrl: item.platform, platformUserName: item.username || "", platformPassword: item.password || "", platformEfa: item.twoFactor || "" };
    });
  } }, { header: $t("\u81EA\u5B9A\u4E49\u6253\u5F00 URL"), key: "defaultOpenUrl", width: 60, placeholder: "richText", example: `${e2}: 
["https://www.facebook.com", "https://www.tiktok.com"]`, richText: [{ text: $t("\u542F\u52A8\u6D4F\u89C8\u5668\u65F6\u540C\u65F6\u6253\u5F00\u7684\u6807\u7B7E\u9875\uFF0C\u9700\u8981\u7528 ") }, { font: { color: { argb: "EF4444" } }, text: $t("\u9700\u8981\u7528 [ ] \u5305\u542B\uFF01") }, { text: $t(`\u591A\u4E2A\u6807\u7B7E\u9875\u8BF7\u4F7F\u7528\u82F1\u6587\u9017\u53F7\u9694\u5F00!
\u7F51\u5740\u524D\u8BF7\u52A0 http:// \u6216 https:// \u5426\u5219\u65E0\u6548!`) }], formatValue: (value) => {
    const rows = JSON.parse(value || "[]");
    if (!Array.isArray(rows)) throw Error("\u6253\u5F00\u7F51\u5740\u5FC5\u987B\u662F JSON \u6570\u7EC4");
    return rows;
  } }, { header: "Cookie", key: "cookie", placeholder: "richText", width: 60, example: `${e2}1 (JSON): 
[{"name":"fb","path":"/","domain":".facebook.com"}]
${e2}2 (Name=Value): 
domain=.x.com; name=value; ...`, richText: [{ text: $t(`\u652F\u6301\u683C\u5F0F: JSON\u3001Netscape\u3001Name=Value
`) }, { font: { color: { argb: "EF4444" } }, text: $t(`JSON \u683C\u5F0F\u9700\u8981\u7528 [ ] \u5305\u542B
Name=Value / Netscape \u76F4\u63A5\u586B\u5199\u6587\u672C
`) }, { text: $t("Name=Value \u672A\u5199 domain \u65F6\uFF0C\u4F1A\u4ECE\u300C\u5E73\u53F0\u8D26\u53F7\u300D\u5217\u83B7\u53D6\u5E76\u6309\u884C\u586B\u5145") }] }, { header: $t("\u7A97\u53E3\u5907\u6CE8"), key: "windowRemark", placeholder: $t("\u6B64\u5904\u586B\u5199\u8BE5\u6D4F\u89C8\u5668\u7A97\u53E3\u7684\u5907\u6CE8\u4FE1\u606F! "), example: "", formatValue: (e3) => e3?.trim?.() || "" }, { header: "User-Agent", key: "userAgent", placeholder: "richText", example: `${e2}: 
Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.99 Safari/537.36`, richText: [{ font: { color: { argb: "EF4444" } }, text: $t("\u82E5\u65E0\u9700\u6307\u5B9A UA, \u5219\u53EF\u4E0D\u586B\u5199;") }, { text: $t("\u82E5\u586B\u5199, \u8BF7\u52A1\u5FC5\u786E\u4FDD UA \u683C\u5F0F\u6B63\u786E\u3002") }] }, { header: $t("\u641C\u7D22\u5F15\u64CE"), key: "searchEngine", placeholder: $t("\u6D4F\u89C8\u5668\u7A97\u53E3\u6253\u5F00\u65F6\u5730\u5740\u680F\u4F7F\u7528\u7684\u641C\u7D22\u5F15\u64CE\uFF0C\u7559\u7A7A\u5219\u9ED8\u8BA4\u4F7F\u7528Google!"), example: p2.join(`
`) }];
}
async function m(e2 = {}) {
  let t2 = new l.default.Workbook(), n2 = t2.addWorksheet("Sheet1");
  n2.properties.defaultRowHeight = 30;
  let r2 = await p(), i2 = e2.afterAddColumns?.(r2) || r2;
  n2.columns = i2.map((e3) => {
    let { key: t3, header: n3, width: r3 } = e3;
    return { key: t3, header: n3, width: r3 || 50, style: { alignment: { wrapText: !0, horizontal: "left", vertical: "top" } } };
  });
  let a2 = n2.getRow(1);
  a2.height = 30, a2.eachCell((e3, t3) => {
    let n3 = i2[t3 - 1];
    e3.style = { font: { bold: !0, name: "Arial", color: { argb: n3.required ? "FFFFFF" : "000000" } }, alignment: { horizontal: "center", vertical: "middle" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: n3.required ? "ed7676" : "fef08a" } }, border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } } };
  }), await g(n2), await e2.afterAddExplain?.(n2);
  let o2 = await t2.xlsx.writeBuffer(), c2 = new Blob([o2], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), u2 = document.createElement("a");
  u2.href = URL.createObjectURL(c2), u2.download = `roxy_template_${s(/* @__PURE__ */ new Date(), "yyyyMMdd_HHmmss")}.xlsx`, u2.click(), URL.revokeObjectURL(u2.href);
}
async function h() {
  let e2 = (await p()).map(({ header: e3, key: t3, example: n3, placeholder: r3, richText: i3 }) => ({ header: e3, key: t3, desc: (i3 ? i3.map((e4) => e4.text).join("") : r3).split(`
`).join(`
	`), example: ["cookie", "windowPlatformList", "defaultOpenUrl", "userAgent"].includes(t3) ? n3.split(`
`).map((e4) => e4.trimStart()).join("") : n3.split(`
`).join(`
		`) })), t2 = [{ windowName: "name1", os: "Windows", ...a() ? { coreType: "Chrome", coreVersion: "149" } : {}, osVersion: 11, proxyCategory: "HTTP", proxyInfo: "www.proxy.com:80:username:password", windowPlatformList: '["https://x.com/:roxy1:123", "https://www.tiktok.com/:roxy2:456", "https://www.youtube.com/:roxy3:789:roxy_2fa"]', defaultOpenUrl: '["https://www.google.com/", "https://x.com/"]', cookie: '[{ "domain": "example", "expires": 0, "httpOnly": false, "name": "X-AB", "path": "xxx", "priority": "Medium", "sameParty": false, "sameSite": "None", "secure": true, "session": false, "size": 36, "sourcePort": 0, "sourceScheme": "Secure", "value": "xxxx" }]', windowRemark: "remark1", userAgent: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.99 Safari/537.36", searchEngine: "Google" }, { windowName: "name2", os: "iOS", ...a() ? { coreType: "Firefox", coreVersion: "146" } : {}, osVersion: 17, proxyCategory: "HTTP", proxyInfo: "www.proxy.com:81:username:password", windowPlatformList: '["https://x.com/:roxy1:123", "https://www.tiktok.com/:roxy2:456", "https://www.youtube.com/:roxy3:789:roxy_2fa"]', defaultOpenUrl: '["https://www.google.com/", "https://x.com/"]', cookie: '[{ "domain": "example", "expires": 0, "httpOnly": false, "name": "X-AB", "path": "xxx", "priority": "Medium", "sameParty": false, "sameSite": "None", "secure": true, "session": false, "size": 36, "sourcePort": 0, "sourceScheme": "Secure", "value": "xxxx" }]', windowRemark: "remark2", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/146.0 Mobile/15E148 Safari/605.1.15", searchEngine: "Google" }], n2 = `${$t("*\u5982\u9700\u67E5\u770B\u5B8C\u6574\u6848\u4F8B, \u8BF7\u8DF3\u8F6C\u81F3\u6587\u672C\u6700\u540E, \u5982\u679C\u60A8\u662F\u7B2C\u4E00\u6B21\u4F7F\u7528 txt \u6A21\u677F\u5BFC\u5165, \u5EFA\u8BAE\u60A8\u6309\u987A\u5E8F\u9605\u8BFB\u3002")}

${e2.map((e3) => `- ${e3.key}  (${e3.header})
	${e3.desc}
		${e3.example}`).join(`

`)}

${$t(`{sign1}
\u6BCF\u4E2A\u7A97\u53E3\u4E4B\u95F4\u8BF7\u7528 {sign2} \u8FDB\u884C\u5206\u9694\uFF08\u6700\u5C114\u4E2A{sign}\uFF09\u3002\u6CE8\u610F\uFF0C\u5907\u6CE8\u5185\u5C3D\u91CF\u4E0D\u542B\u7A7A\u884C\u3002\u5982\u5B58\u5728\u7A7A\u884C\uFF0C\u53EF\u80FD\u4F1A\u5BFC\u81F4\u8BC6\u522B\u5931\u8D25\u3002
\u5BFC\u5165\u4E24\u4E2A\u7A97\u53E3\uFF0C\u793A\u4F8B\u5982\u4E0B\uFF1A`, { sign: "#", sign1: "#".repeat(40), sign2: "#".repeat(10) })}

${t2.map((e3) => Object.entries(e3).map(([e4, t3]) => `${e4}=${t3}`).join(`
`)).join(`

${"#".repeat(40)}

`)}

${"#".repeat(40)}

${$t("\u5BFC\u5165\u65F6\uFF0C\u8BF7\u5220\u9664\u672C\u884C\u53CA\u5176\u4EE5\u4E0A\u7684\u6240\u6709\u5185\u5BB9\u3002")}

`, r2 = new Blob([n2], { type: "text/plain" }), i2 = document.createElement("a");
  i2.href = URL.createObjectURL(r2), i2.download = `roxy_template_${s(/* @__PURE__ */ new Date(), "yyyyMMdd_HHmmss")}.txt`, document.body.appendChild(i2), i2.click(), document.body.removeChild(i2);
}
async function g(e2) {
  let t2 = await p();
  e2.addRow(t2.map((e3) => e3.placeholder)), e2.addRow(t2.map((e3) => e3.example)), e2.getRow(2).eachCell({ includeEmpty: !0 }, (e3, n3) => {
    e3.value === "richText" && (e3.value = { richText: t2[n3 - 1].richText });
  }), e2.mergeCells(4, 1, 4, t2.length), e2.getRow(4).height = 80;
  let n2 = e2.getCell(4, 1);
  n2.value = $t(`\u8BF4\u660E: 
1. \u6570\u636E\u8BF7\u4ECE\u7B2C 5 \u884C\u5F00\u59CB\u5F55\u5165, \u524D 4 \u884C\u4E0D\u8981\u5220\u9664\u548C\u5904\u7406, \u7CFB\u7EDF\u4F1A\u9ED8\u8BA4\u4ECE\u7B2C 5 \u884C\u5F00\u59CB\u5BFC\u5165, \u52A1\u5FC5\u4E25\u683C\u6309\u7167\u8BF4\u660E\u89C4\u8303\u5F55\u5165, \u5426\u5219\u65E0\u6CD5\u5BFC\u5165\u6210\u529F! 
2. \u7EA2\u8272\u5217\u4E3A\u5FC5\u586B\u9879, \u5176\u4ED6\u4E3A\u9009\u586B\u9879, \u6BCF\u6B21\u5BFC\u5165\u4E0D\u53EF\u8D85\u8FC7 {count} \u6761, \u6570\u636E\u8FC7\u591A, \u8BF7\u5206\u6B21\u5BFC\u5165!
3. \u8BF7\u52FF\u5728\u6587\u672C\u4E2D\u6DFB\u52A0\u8D85\u94FE\u63A5, \u8FD9\u53EF\u80FD\u4F1A\u5BFC\u81F4\u89E3\u6790\u6570\u636E\u5931\u8D25\u3002`, { count: 200 }), n2.alignment = { wrapText: !0, horizontal: "left", vertical: "middle" };
}
function _(e2) {
  return e2 == null || e2 === "" ? "" : typeof e2 == "object" && e2 && "text" in e2 ? String(e2.text).trim() : String(e2).trim();
}
function v(e2) {
  let t2 = typeof e2.cookie == "string" ? e2.cookie : _(e2.cookie);
  return e2.cookie = o(t2, e2.windowPlatformList ?? []), e2;
}
async function y(e2) {
  try {
    let t2 = [], n2 = new l.default.Workbook(), r2 = await p();
    return await n2.xlsx.load(await e2.arrayBuffer()), n2.eachSheet((e3) => {
      e3.eachRow((e4, n3) => {
        if (n3 >= 5) {
          let i2 = r2.map((t3, n4) => {
            let r3 = e4.values[n4 + 1];
            if (t3.key === "cookie") return [t3.key, _(r3)];
            let i3 = t3.formatValue?.(r3?.text || r3) || r3;
            return [t3.key, i3];
          }), a2 = { rowNum: n3, ...Object.fromEntries(i2) };
          v(a2), a2.os?.toLocaleUpperCase() === "IOS" && (a2.os = a2.os.toLocaleUpperCase(), typeof a2.osVersion == "number" && (a2.osVersion = a2.osVersion.toFixed(1))), t2.push(a2);
        }
      });
    }), t2;
  } catch (e3) {
    throw Error("Excel \u89E3\u6790\u5931\u8D25: " + e3.message);
  }
}
async function b(e2) {
  const fields = await p(), keys = new Set(fields.map((field) => field.key));
  return (await e2.text()).split(/#{4,}/).map((part) => part.trim()).filter(Boolean).map((part, index) => {
    const values = Object.fromEntries(part.split(/\r?\n/).map((line) => {
      const [key, ...rest] = line.trim().split("=");
      return keys.has(key) ? [key, rest.join("=")] : [];
    }).filter((row2) => row2.length)), array = (value, label) => {
      const rows = JSON.parse(value || "[]");
      if (!Array.isArray(rows)) throw Error(label + " \u5FC5\u987B\u662F JSON \u6570\u7EC4");
      return rows;
    }, accounts = array(values.windowPlatformList, "\u5E73\u53F0\u8D26\u53F7").map((value) => {
      if (typeof value != "string") throw Error("\u5E73\u53F0\u8D26\u53F7\u683C\u5F0F\u9519\u8BEF");
      const item = u(value);
      if (!Object.keys(item).length) throw Error("\u5E73\u53F0\u8D26\u53F7\u683C\u5F0F\u9519\u8BEF");
      return { platformUrl: item.platform, platformUserName: item.username || "", platformPassword: item.password || "", platformEfa: item.twoFactor || "" };
    }), row = { ...values, rowNum: index + 1, windowPlatformList: accounts, defaultOpenUrl: array(values.defaultOpenUrl, "\u6253\u5F00\u7F51\u5740"), cookie: values.cookie || "" };
    return v(row), row.os?.toUpperCase() === "IOS" && (row.os = "IOS"), row;
  });
}
function x() {
  return $t("\u672A\u547D\u540D\u7A97\u53E3");
}
async function S() {
  try {
    let { code: e2, data: t2 } = await n.window.userGetWindowSortNumList();
    if (e2 !== 0 || t2?.windowSortNum == null) return;
    let r2 = t2.windowSortNum || 1;
    return `${s(/* @__PURE__ */ new Date(), "yyMMdd")}-${r2}`;
  } catch (e2) {
    console.error("[fetchDefaultWindowName] failed to resolve window name", e2);
    return;
  }
}
function C(e2) {
  return !!String(e2 ?? "").trim();
}
export {x as a,b as c,f as i,d as l,h as n,C as o,S as r,y as s,m as t,u as u};
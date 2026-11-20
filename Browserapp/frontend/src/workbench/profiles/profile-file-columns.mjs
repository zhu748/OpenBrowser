import { h as api, m as loadDictionary, qt as Engine, ti as hasKernelFields } from './utils-BIWenCnY.js';
import { cellText, parseAccounts, parseStartupUrls } from './workbench-profile-file-values.js';

export async function importColumns() {
  const example = $t('举例');
  const [dictionary, engines] = await Promise.all([loadDictionary(), api.platform.userGetSearchEnginesList()]);
  const systems = dictionary.os.map((os, index) => `${example}${index + 1}: ${os.label}`);
  const systemVersions = dictionary.os.map(os => {
    const versions = dictionary[`osversion_${os.value.toLocaleLowerCase()}`].map(item => item.value).join('、');
    return `${os.label}: ${versions}`;
  });
  const chromeVersions = dictionary.coreVersion?.map(item => item.value) ?? [];
  const firefoxVersions = dictionary.firefoxCoreVersion?.map(item => item.value) ?? [];
  const searchEngines = engines.code === 0 ? (engines.data ?? []).map((engine, index) => `${example}${index + 1}: ${engine.code}`) : [];
  return [
    { header: $t("窗口名称"),
      key: "windowName",
      required: !0,
      placeholder: $t("为浏览器窗口命名（必填项）"),
      example: `${example}: Roxytest` },
    { header: $t("操作系统"),
      key: "os",
      required: !0,
      placeholder: $t(`操作系统（必填项）
如: Windows`),
      example: systems.join('\n') },
    ...(hasKernelFields() ? [{ header: $t("浏览器内核"),
      key: "coreType",
      required: !0,
      placeholder: $t(`浏览器内核（必填项）
如: Chrome`),
      example: [Engine.Chrome, Engine.Firefox].map((t2) => `${example}: ${t2}`).join('\n') }, { header: $t("内核版本"),
      key: "coreVersion",
      placeholder: $t(`内核版本，如：{version}
每行只能填写一个,留空则自动使用对应内核最新版本`, { version: chromeVersions[0] ?? "149" }),
      example: `${$t("可用内核版本:")}
RoxyChrome: ${chromeVersions.join("、")}
RoxyFirefox: ${firefoxVersions.join("、")}` }] : []),
    { header: $t("系统版本"),
      key: "osVersion",
      width: 50,
      placeholder: $t(`操作系统版本, 如: 11
每行只能填写一个, 留空则自动使用对应操作系统最新版本`),
      example: `${$t("可用的系统版本:")}
${systemVersions.join('\n')}` },
    { header: $t("代理 IP 类型"),
      key: "proxyCategory",
      placeholder: $t('代理 IP 类型, 如: SOCKS5, 留空则自动使用 "直连"'),
      example: `${example}1: SOCKS5
${example}2: HTTP
${example}3: HTTPS
${example}4: SSH` },
    { header: $t("代理 IP 信息"),
      key: "proxyInfo",
      width: 70,
      placeholder: "richText",
      example: `${example}1: 192.168.0.1:8800
${example}2: 192.168.0.1:8800:roxytest:roxypass
${example}3: 192.168.0.1:8800:roxytest:roxypass[http://refresh.roxy.com]
${example}4: ipv6:192.168.0.1:8800:roxytest:roxypass`,
      richText: [{ text: `${$t("请务必按照此顺序格式填写:")}
` }, { font: { color: { argb: "EF4444" } }, text: `${$t("【代理 IP 主机:代理 IP 端口:代理 IP 用户名:代理 IP 密码[动态代理 IP 刷新 URL]】")}
` }, { font: { color: { argb: "EF4444" } }, text: `${$t("其中 代理 IP 用户名、代理 IP 密码、[动态代理 IP 刷新 URL] 为选填")}
` }, { text: $t("若网络协议为ipv6, 请在代理 IP 信息最前端添加 ipv6:") }] },
    { header: $t("平台账号"),
      key: "windowPlatformList",
      width: 90,
      placeholder: "richText",
      example: `${example}: 
[
  "https://x.com/:roxy1:123",
  "https://www.tiktok.com/:roxy2:456",
  "https://www.youtube.com/:roxy3:789:roxy_2fa"
]`,
      richText: [{ text: $t("仅支持 JSON 格式的数组, 可支持填写多个账号, 多个账号请使用英文逗号隔开! ") }, { font: { color: { argb: "EF4444" } }, text: $t("需要用 [ ] 包含！") }, { text: `${$t(`请务必按照示例填写
`)}` }, { font: { color: { argb: "EF4444" } }, text: `${$t("【平台:账号:密码:2FA】")}` }],
      formatValue: parseAccounts },
    { header: $t("自定义打开 URL"),
      key: "defaultOpenUrl",
      width: 60,
      placeholder: "richText",
      example: `${example}: 
["https://www.facebook.com", "https://www.tiktok.com"]`,
      richText: [{ text: $t("启动浏览器时同时打开的标签页，需要用 ") }, { font: { color: { argb: "EF4444" } }, text: $t("需要用 [ ] 包含！") }, { text: $t(`多个标签页请使用英文逗号隔开!
网址前请加 http:// 或 https:// 否则无效!`) }],
      formatValue: parseStartupUrls },
    { header: "Cookie",
      key: "cookie",
      placeholder: "richText",
      width: 60,
      example: `${example}1 (JSON): 
[{"name":"fb","path":"/","domain":".facebook.com"}]
${example}2 (Name=Value): 
domain=.x.com; name=value; ...`,
      richText: [{ text: $t(`支持格式: JSON、Netscape、Name=Value
`) }, { font: { color: { argb: "EF4444" } }, text: $t(`JSON 格式需要用 [ ] 包含
Name=Value / Netscape 直接填写文本
`) }, { text: $t("Name=Value 未写 domain 时，会从「平台账号」列获取并按行填充") }] },
    { header: $t("窗口备注"),
      key: "windowRemark",
      placeholder: $t("此处填写该浏览器窗口的备注信息! "),
      example: "",
      formatValue: cellText },
    { header: "User-Agent",
      key: "userAgent",
      placeholder: "richText",
      example: `${example}: 
Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.99 Safari/537.36`,
      richText: [{ font: { color: { argb: "EF4444" } }, text: $t("若无需指定 UA, 则可不填写;") }, { text: $t("若填写, 请务必确保 UA 格式正确。") }] },
    { header: $t("搜索引擎"),
      key: "searchEngine",
      placeholder: $t("浏览器窗口打开时地址栏使用的搜索引擎，留空则默认使用Google!"),
      example: searchEngines.join('\n') }
  ];
}

export const templateInstructions = () => $t(`说明: 
1. 数据请从第 5 行开始录入, 前 4 行不要删除和处理, 系统会默认从第 5 行开始导入, 务必严格按照说明规范录入, 否则无法导入成功! 
2. 红色列为必填项, 其他为选填项, 每次导入不可超过 {count} 条, 数据过多, 请分次导入!
3. 请勿在文本中添加超链接, 这可能会导致解析数据失败。`, { count: 200 });

export function textTemplate(fields, kernels) {
  const singleLine = new Set(['cookie', 'windowPlatformList', 'defaultOpenUrl', 'userAgent']);
  const help = fields.map(({ header, key, example, placeholder, richText }) => ({
    header, key, desc: (richText ? richText.map(part => part.text).join('') : placeholder).replaceAll('\n', '\n\t'),
    example: singleLine.has(key) ? example.split('\n').map(line => line.trimStart()).join('') : example.replaceAll('\n', '\n\t\t'),
  }));
  const examples = [{ windowName: "name1", os: "Windows", ...kernels ? { coreType: "Chrome", coreVersion: "149" } : {}, osVersion: 11, proxyCategory: "HTTP", proxyInfo: "www.proxy.com:80:username:password", windowPlatformList: '["https://x.com/:roxy1:123", "https://www.tiktok.com/:roxy2:456", "https://www.youtube.com/:roxy3:789:roxy_2fa"]', defaultOpenUrl: '["https://www.google.com/", "https://x.com/"]', cookie: '[{ "domain": "example", "expires": 0, "httpOnly": false, "name": "X-AB", "path": "xxx", "priority": "Medium", "sameParty": false, "sameSite": "None", "secure": true, "session": false, "size": 36, "sourcePort": 0, "sourceScheme": "Secure", "value": "xxxx" }]', windowRemark: "remark1", userAgent: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.99 Safari/537.36", searchEngine: "Google" },
    { windowName: "name2", os: "iOS", ...kernels ? { coreType: "Firefox", coreVersion: "146" } : {}, osVersion: 17, proxyCategory: "HTTP", proxyInfo: "www.proxy.com:81:username:password", windowPlatformList: '["https://x.com/:roxy1:123", "https://www.tiktok.com/:roxy2:456", "https://www.youtube.com/:roxy3:789:roxy_2fa"]', defaultOpenUrl: '["https://www.google.com/", "https://x.com/"]', cookie: '[{ "domain": "example", "expires": 0, "httpOnly": false, "name": "X-AB", "path": "xxx", "priority": "Medium", "sameParty": false, "sameSite": "None", "secure": true, "session": false, "size": 36, "sourcePort": 0, "sourceScheme": "Secure", "value": "xxxx" }]', windowRemark: "remark2", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/146.0 Mobile/15E148 Safari/605.1.15", searchEngine: "Google" }];
  return `${$t("*如需查看完整案例, 请跳转至文本最后, 如果您是第一次使用 txt 模板导入, 建议您按顺序阅读。")}

${help.map(field => `- ${field.key}  (${field.header})
	${field.desc}
		${field.example}`).join(`

`)}

${$t(`{sign1}
每个窗口之间请用 {sign2} 进行分隔（最少4个{sign}）。注意，备注内尽量不含空行。如存在空行，可能会导致识别失败。
导入两个窗口，示例如下：`, { sign: "#", sign1: "#".repeat(40), sign2: "#".repeat(10) })}

${examples.map(sample => Object.entries(sample).map(([key, value]) => `${key}=${value}`).join(`
`)).join(`

${"#".repeat(40)}

`)}

${"#".repeat(40)}

${$t("导入时，请删除本行及其以上的所有内容。")}

`;
}

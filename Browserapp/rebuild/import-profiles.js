"use strict";
const { parseProxyInput } = require("../network/proxy-config");
const OS = new Set(["Windows", "macOS", "Linux", "Android", "IOS"]);
function importRows(payload) {
  if (
    !Array.isArray(payload.excelData) ||
    !payload.excelData.length ||
    payload.excelData.length > 200
  )
    throw Error("一次只能导入 1–200 个窗口");
  if (
    Buffer.byteLength(JSON.stringify(payload.excelData), "utf8") >
    5 * 1024 * 1024
  )
    throw Error("导入内容不能超过 5 MiB");
  return payload.excelData.map((row, index) => {
    const label = "第 " + (row?.rowNum || index + 1) + " 行: ";
    try {
      if (!row || typeof row !== "object" || Array.isArray(row))
        throw Error("无效记录");
      const name = String(row.windowName || "").trim();
      if (!name || name.length > 200)
        throw Error("窗口名称必填，最多 200 字符");
      if (!OS.has(row.os)) throw Error("不支持的操作系统");
      const coreType = row.coreType || payload.coreType || "Chrome";
      if (!["Chrome", "Firefox"].includes(coreType))
        throw Error("不支持的浏览器内核");
      for (const field of ["windowPlatformList", "defaultOpenUrl"])
        if (row[field] !== undefined && !Array.isArray(row[field]))
          throw Error(field + " 必须是数组");
      if (
        row.windowPlatformList?.length > 20 ||
        row.defaultOpenUrl?.length > 50
      )
        throw Error("账号或启动网址数量超限");
      const value = {
        ...row,
        windowName: name,
        coreType,
        proxyCategory: "noproxy",
      };
      value.useLatestCore = !row.coreVersion;
      delete value.id;
      delete value.dirId;
      delete value.windowId;
      value.proxyInfoList = [{ isDirect: true, proxyCategory: "noproxy" }];
      const category = String(row.proxyCategory || "").toUpperCase();
      if (
        category &&
        !["DIRECT", "NOPROXY", "不使用", "直连"].includes(category)
      ) {
        if (!["HTTP", "HTTPS", "SOCKS5"].includes(category))
          throw Error("不支持的代理类型");
        let raw = String(row.proxyInfo || "").trim(),
          refreshUrl = "";
        const refresh = raw.match(/\[(https?:\/\/[^\]]+)\]$/i);
        if (refresh) {
          refreshUrl = new URL(refresh[1]).href;
          raw = raw.slice(0, refresh.index);
        }
        raw = raw.replace(/^ipv6:/i, "");
        if (!raw) throw Error("请填写代理信息");
        const proxy = parseProxyInput({
          protocol: category.toLowerCase(),
          raw,
        });
        if (!proxy) throw Error("代理信息无效");
        value.proxyCategory = category;
        value.proxyInfoList = [
          {
            host: proxy.host,
            port: proxy.port,
            protocol: category,
            proxyCategory: category,
            proxyUserName: proxy.username,
            proxyPassword: proxy.password,
          },
        ];
        value._importRefreshUrl = refreshUrl;
      }
      return value;
    } catch (error) {
      throw Error(label + error.message);
    }
  });
}
module.exports = { importRows };

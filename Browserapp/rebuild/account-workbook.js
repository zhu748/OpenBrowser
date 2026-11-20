"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { readXlsxSheets } = require("./profile-import-xlsx");
const { buildZip } = require("../automation/zip-writer");

const fields = [
  ["平台", "platformUrl", "url"],
  ["账号", "platformUserName", "username"],
  ["密码", "platformPassword", "password"],
  ["2FA", "platformEfa", "totpSecret"],
  ["备注", "platformRemarks", "remark"],
  ["平台名称", "platformName", "platform"],
];
const headers = new Map(fields.flatMap(([label, field, alias]) => [[label, field], [field, field], [alias, field]]));
headers.set("平台网址", "platformUrl");
headers.set("用户名", "platformUserName");

function textAccounts(text) {
  return text.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return null;
    if (line.includes("\t")) {
      const parts = line.split("\t");
      if (parts.length >= 2 && parts.length <= 6 && parts[1].trim())
        return Object.fromEntries(parts.map((value, column) => [fields[column][1], value]));
    } else {
      const match = line.trim().match(/^(?:(https?:\/\/[^:\s[\]{}]+):)?([^:\s[\]{}]+)(?::([^:\s[\]{}]+))?(?::([^:\s[\]{}]+))?(?:\[[^[\]]+\])?(?:\{([^{}]+)\})?$/)?.slice(1);
      if (match) return Object.fromEntries(match.map((value, column) => [fields[column][1], value ?? ""]));
    }
    throw Error("TXT 第 " + (index + 1) + " 行格式无效");
  }).filter(Boolean);
}

async function workbookAccounts(bytes) {
  for await (const rows of readXlsxSheets(bytes, { maxRows: 501, limitMessage: "每次可导入 1–500 个账号" })) {
    if (!rows.length) continue;
    const [header, ...data] = rows;
    const columns = new Map(header.cells.map(cell => [cell.column, headers.get(cell.text.trim())]));
    if (![...columns.values()].includes("platformUserName")) throw Error("XLSX 缺少账号列");
    return data.map(row => {
      const fields = row.cells.filter(cell => columns.get(cell.column));
      if (fields.some(cell => cell.formula)) throw Error("XLSX 第 " + row.number + " 行包含公式，请使用实际值");
      const values = Object.fromEntries(fields.map(cell => [columns.get(cell.column), cell.text]));
      if (!values.platformUserName?.trim()) throw Error("XLSX 第 " + row.number + " 行缺少账号");
      return values;
    });
  }
  return [];
}

async function selectAccounts(service) {
  const selection = await service.dialog.showOpenDialog(service.window(), {
    properties: ["openFile"], filters: [{ name: "账号文件", extensions: ["xlsx", "txt"] }],
  });
  const filename = selection.filePaths?.[0];
  if (selection.canceled || !filename) return { canceled: true };
  const extension = path.extname(filename).toLowerCase();
  if (![".xlsx", ".txt"].includes(extension)) throw Error("请选择 XLSX 或 UTF-8 TXT 文件");
  const stat = await fs.lstat(filename);
  const limit = 5 * 1024 * 1024;
  if (!stat.isFile() || stat.size > limit) throw Error("请选择不超过 5 MiB 的普通文件");
  const data = await fs.readFile(filename);
  if (data.length > limit) throw Error("账号文件超过 5 MiB");
  const values = extension === ".xlsx" ? await workbookAccounts(data) :
    textAccounts(new TextDecoder("utf-8", { fatal: true }).decode(data));
  if (!values.length || values.length > 500) throw Error("每次可导入 1–500 个账号");
  return { filename: path.basename(filename), values };
}

function xml(value) {
  return String(value ?? "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function buildWorkbook(accounts) {
  const spreadsheet = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const documentRels = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const packageRels = "http://schemas.openxmlformats.org/package/2006/relationships";
  const rows = [fields.map(([label]) => label), ...accounts.map(account => fields.map(([, , key]) => account[key]))];
  const content = rows.map((row, index) => {
    const id = index + 1;
    return '<row r="' + id + '">' + row.map((value, column) => '<c r="' + String.fromCharCode(65 + column) + id +
      '" t="inlineStr"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>').join("") + "</row>";
  }).join("");
  return buildZip([
    { name: "[Content_Types].xml", data: '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/accounts.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: "_rels/.rels", data: '<Relationships xmlns="' + packageRels + '"><Relationship Id="workbook" Type="' +
      documentRels + '/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: "xl/workbook.xml", data: '<workbook xmlns="' + spreadsheet + '" xmlns:r="' + documentRels +
      '"><sheets><sheet name="Accounts" sheetId="1" r:id="sheet"/></sheets></workbook>' },
    { name: "xl/_rels/workbook.xml.rels", data: '<Relationships xmlns="' + packageRels +
      '"><Relationship Id="sheet" Type="' + documentRels + '/worksheet" Target="worksheets/accounts.xml"/></Relationships>' },
    { name: "xl/worksheets/accounts.xml", data: '<worksheet xmlns="' + spreadsheet + '"><sheetData>' + content + "</sheetData></worksheet>" },
  ]);
}

async function exportAccounts(service, accounts, template = false) {
  const selection = await service.dialog.showSaveDialog(service.window(), {
    defaultPath: template ? "openbrowser-account-template.xlsx" : "openbrowser-accounts.xlsx",
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });
  if (selection.canceled || !selection.filePath) return { canceled: true };
  await fs.writeFile(selection.filePath, buildWorkbook(accounts), { mode: 0o600 });
  return { count: accounts.length };
}

module.exports = { selectAccounts, exportAccounts };

'use strict';

const { TextDecoder } = require('node:util');

const COLUMNS = {
  windowName: ['窗口名称', 'Window Name', 'Profile Name'],
  os: ['操作系统', 'Operating System', 'System'],
  coreType: ['浏览器内核', 'Browser Core'],
  coreVersion: ['内核版本', 'Core Version'],
  osVersion: ['系统版本', 'OS Version'],
  proxyCategory: ['代理 IP 类型', 'Proxy Type'],
  proxyInfo: ['代理 IP 信息', 'Proxy Information'],
  windowPlatformList: ['平台账号', 'Platform Accounts'],
  defaultOpenUrl: ['自定义打开 URL', 'Startup URLs'],
  cookie: ['Cookies'],
  windowRemark: ['窗口备注', '备注', 'Remark'],
  userAgent: ['User Agent'],
  searchEngine: ['搜索引擎', 'Search Engine'],
};
const headers = new Map(Object.entries(COLUMNS).flatMap(([key, aliases]) =>
  [key, ...aliases].map(name => [name.trim().toLowerCase(), key])));

// Match the instruction opening of current EN/CN templates and the short
// legacy directives, not a heading or arbitrary reference to row 5.
const templateInstructions = [
  /^说明\s*[:：]\s*(?:1\.\s*数据请从第\s*5\s*行开始录入[,，]|从第\s*5\s*行导入[。.]?$)/,
  /^instructions?\s*[:：]\s*(?:1\.\s*please start entering data from row\s+5\.\s|start entering data from row\s+5\.?$)/i,
];

function jsonArray(value, label) {
  if (!value) return [];
  let parsed;
  try { parsed = JSON.parse(value); }
  catch (_) { throw Error(`${label}必须是 JSON 数组`); }
  if (!Array.isArray(parsed)) throw Error(`${label}必须是 JSON 数组`);
  return parsed;
}

function platformAccount(value) {
  if (typeof value !== 'string' || value.length > 4096) throw Error('平台账号格式无效');
  const pattern = /^(?!:)(https?:\/\/[^:\s\[\]{}]+)?(?::?([^:\s\[\]{}]+)(?::([^:\s\[\]{}]+))?(?::([^:\s\[\]{}]+))?)?(?:\[[^\[\]]+\])?(?:\{[^{}]+\})?$/i;
  const fields = pattern.exec(value);
  if (!fields || (!fields[1] && !fields[2])) throw Error('平台账号格式无效');
  const [, platformUrl = '', platformUserName = '', platformPassword = '', platformEfa = ''] = fields;
  return { platformUrl, platformUserName, platformPassword, platformEfa };
}

function formatRow(values, rowNum) {
  try {
    const row = { ...values, rowNum };
    if (row.os?.toUpperCase() === 'IOS') row.os = 'IOS';
    if (row.coreVersion?.toLowerCase() === 'latest') delete row.coreVersion;
    if (row.defaultOpenUrl) {
      row.defaultOpenUrl = jsonArray(row.defaultOpenUrl, '启动网址');
      if (row.defaultOpenUrl.some(value => typeof value !== 'string')) throw Error('启动网址必须是字符串');
    }
    if (row.windowPlatformList) {
      const accounts = jsonArray(row.windowPlatformList, '平台账号');
      if (accounts.length > 20) throw Error('每个窗口最多 20 个平台账号');
      row.windowPlatformList = accounts.map(platformAccount);
    }
    return row;
  } catch (error) { throw Error(`第 ${rowNum} 行：${error.message}`); }
}

function textRows(bytes) {
  // Windows editors can export .txt as BOM-marked UTF-16. Do not guess the
  // encoding of unmarked files or replace malformed characters silently.
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le'
    : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  const text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  let values = {}, first = 0;
  const rows = [];
  function finish() {
    if (first) rows.push(formatRow(values, first));
    values = {};
    first = 0;
    if (rows.length > 200) throw Error('一次只能导入 1–200 个窗口');
  }
  for (const [index, line] of text.split(/\r\n|\n|\r/).entries()) {
    if (/^\s*#{4,}\s*$/.test(line)) { finish(); continue; }
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    if (!Object.hasOwn(COLUMNS, key)) continue;
    if (!first) first = index + 1;
    if (Object.hasOwn(values, key)) throw Error(`第 ${index + 1} 行：重复字段 ${key}`);
    values[key] = line.slice(separator + 1).trim();
  }
  finish();
  return rows;
}

function sheetRows(sheet) {
  if (!sheet.length) return [];
  const [header, ...body] = sheet;
  const columns = new Map();
  for (const cell of header.cells) {
    const field = headers.get(cell.text.trim().toLowerCase());
    if (!field) continue;
    if ([...columns.values()].includes(field)) throw Error(`XLSX 表头重复字段 ${field}`);
    columns.set(cell.column, field);
  }
  if (![...columns.values()].includes('windowName') || ![...columns.values()].includes('os')) {
    throw Error('XLSX 表头需要窗口名称和操作系统列');
  }
  // Published templates put the instruction in the leading name column.
  const hasInstructions = body.some(row => row.number === 4 && row.cells.length === 1
    && row.cells[0].column === header.cells[0].column
    && columns.get(row.cells[0].column) === 'windowName'
    && templateInstructions.some(pattern => pattern.test(row.cells[0].text.trim())));
  const rows = [];
  for (const row of body) {
    if (hasInstructions && row.number < 5) continue;
    const values = {};
    for (const cell of row.cells) {
      const key = columns.get(cell.column);
      if (!key) continue;
      if (cell.formula) throw Error(`第 ${row.number} 行：${key} 请填写值，不能使用公式`);
      values[key] = cell.text.trim();
    }
    if (Object.keys(values).length) rows.push(formatRow(values, row.number));
  }
  return rows;
}

async function parseProfileImport(file) {
  if (file.type === 'text/plain') return textRows(file.bytes);
  const { readXlsxSheets } = require('./profile-import-xlsx');
  const rows = [];
  for await (const sheet of readXlsxSheets(file.bytes)) {
    rows.push(...sheetRows(sheet));
    if (rows.length > 200) throw Error('一次只能导入 1–200 个窗口');
  }
  return rows;
}

module.exports = { parseProfileImport };

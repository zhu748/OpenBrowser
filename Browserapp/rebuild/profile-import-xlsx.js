'use strict';

const { posix } = require('node:path');
const { TextDecoder } = require('node:util');
const yauzl = require('yauzl');
const { SaxesParser } = require('saxes');

const MAX_XML_BYTES = 16 * 1024 * 1024;
const WORKBOOK = 'xl/workbook.xml';
const RELATIONSHIPS = 'xl/_rels/workbook.xml.rels';
const localName = name => name.split(':').at(-1);

function openWorkbook(bytes) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(Buffer.from(bytes), { lazyEntries: true, autoClose: false, strictFileNames: true }, (error, zip) => {
      if (error) reject(error);
      else resolve(zip);
    });
  });
}

function indexEntries(zip) {
  return new Promise((resolve, reject) => {
    if (zip.entryCount > 1024) { reject(Error('XLSX 包含过多文件')); return; }
    const entries = new Map();
    zip.on('error', reject);
    zip.on('entry', entry => {
      if (entries.has(entry.fileName)) { reject(Error('XLSX 包含重复文件')); return; }
      entries.set(entry.fileName, entry);
      zip.readEntry();
    });
    zip.once('end', () => resolve(entries));
    zip.readEntry();
  });
}

async function readXml(zip, entry, budget) {
  if (!entry) throw Error('XLSX 缺少工作簿或工作表');
  if (entry.uncompressedSize > budget.left) throw Error('XLSX 解压内容超过 16 MiB');
  const stream = await new Promise((resolve, reject) => {
    zip.openReadStream(entry, (error, value) => error ? reject(error) : resolve(value));
  });
  const chunks = [];
  for await (const chunk of stream) {
    budget.left -= chunk.length;
    if (budget.left < 0) throw Error('XLSX 解压内容超过 16 MiB');
    chunks.push(chunk);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
}

function scanXml(xml, { open, close, text } = {}) {
  const parser = new SaxesParser();
  parser.on('error', () => { throw Error('XLSX 工作簿 XML 格式无效'); });
  parser.on('doctype', () => { throw Error('XLSX 工作簿不支持 XML 文档类型声明'); });
  if (open) parser.on('opentag', tag => open(localName(tag.name), tag.attributes));
  if (close) parser.on('closetag', tag => close(localName(tag.name)));
  if (text) { parser.on('text', text); parser.on('cdata', text); }
  parser.write(xml).close();
}

function workbookParts(workbook, relationships) {
  const sheetIds = [];
  scanXml(workbook, { open(name, attributes) {
    if (name === 'sheet') {
      const id = Object.entries(attributes).find(([key]) => key.includes(':') && localName(key) === 'id')?.[1];
      if (id) sheetIds.push(id);
    }
  } });
  const sheets = new Map();
  let strings;
  scanXml(relationships, { open(name, a) {
    if (name !== 'Relationship' || a.TargetMode === 'External' || typeof a.Target !== 'string') return;
    const type = a.Type?.split('/').at(-1);
    if (type !== 'worksheet' && type !== 'sharedStrings') return;
    const target = posix.resolve('/xl', a.Target);
    if (!target.startsWith('/xl/')) throw Error('XLSX 工作簿路径无效');
    if (type === 'worksheet') sheets.set(a.Id, target.slice(1));
    else strings = target.slice(1);
  } });
  const parts = sheetIds.map(id => sheets.get(id)).filter(Boolean);
  if (!parts.length) throw Error('XLSX 没有可读取的工作表');
  return { sheets: parts, strings: strings || 'xl/sharedStrings.xml' };
}

function sharedStrings(xml) {
  const values = [];
  let value, reading = false, phonetics = false;
  scanXml(xml, {
    open(name) {
      if (name === 'si') value = '';
      if (name === 'rPh') phonetics = true;
      if (name === 't' && value !== undefined && !phonetics) reading = true;
    },
    text(part) { if (reading) value += part; },
    close(name) {
      if (name === 't') reading = false;
      if (name === 'rPh') phonetics = false;
      if (name === 'si') { values.push(value); value = undefined; }
    },
  });
  return values;
}

function worksheetRows(xml, strings, maxRows, limitMessage) {
  const rows = [];
  let row, rowNumber = 0, cell, field;
  scanXml(xml, {
    open(name, a) {
      if (name === 'row') row = { number: Number(a.r) || rowNumber + 1, cells: [] };
      if (name === 'c' && row) cell = { column: /^[A-Z]{1,3}/.exec(a.r || '')?.[0], type: a.t, text: '', formula: false };
      if (cell && (name === 'v' || (name === 't' && cell.type === 'inlineStr'))) field = name;
      if (cell && name === 'f') cell.formula = true;
    },
    text(part) { if (cell && field) cell.text += part; },
    close(name) {
      if (name === field) field = undefined;
      if (name === 'c' && cell) {
        if (!cell.column) throw Error('XLSX 单元格缺少列编号');
        if (cell.type === 's') {
          if (!/^\d+$/.test(cell.text) || strings[Number(cell.text)] === undefined) throw Error('XLSX 字符串索引无效');
          cell.text = strings[Number(cell.text)];
        }
        if (cell.text.trim() || cell.formula) row.cells.push(cell);
        cell = undefined;
      }
      if (name === 'row' && row) {
        rowNumber = row.number;
        if (row.cells.length) rows.push(row);
        if (rows.length > maxRows) throw Error(limitMessage);
        row = undefined;
      }
    },
  });
  return rows;
}

async function* readXlsxSheets(bytes, { maxRows = 204, limitMessage = '一次只能导入 1–200 个窗口' } = {}) {
  const zip = await openWorkbook(bytes);
  try {
    const entries = await indexEntries(zip);
    const budget = { left: MAX_XML_BYTES };
    const workbook = await readXml(zip, entries.get(WORKBOOK), budget);
    const relationships = await readXml(zip, entries.get(RELATIONSHIPS), budget);
    const { sheets, strings } = workbookParts(workbook, relationships);
    const values = entries.has(strings) ? sharedStrings(await readXml(zip, entries.get(strings), budget)) : [];
    for (const sheet of sheets) yield worksheetRows(await readXml(zip, entries.get(sheet), budget), values, maxRows, limitMessage);
  } finally { zip.close(); }
}

module.exports = { readXlsxSheets };

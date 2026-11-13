(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBrowserCsv = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
'use strict';

/** Feed UTF-8-decoded chunks without retaining the full source or split lines. */
function createCsvParser(onRow, { maxFieldChars = Infinity, maxColumns = Infinity } = {}) {
  let row = [], parts = [], state = 'field', wasQuoted = false, started = false;
  let fieldChars = 0;
  const append = (part) => {
    fieldChars += part.length;
    if (fieldChars > maxFieldChars) throw new Error('CSV field exceeds the character limit');
    parts.push(part);
  };
  let first = true, skipLF = false, ended = false;
  const finishField = () => {
    const field = parts.join('');
    if (row.length >= maxColumns) throw new Error('CSV row exceeds the column limit');
    row.push(wasQuoted ? field : field.trim());
    parts = []; fieldChars = 0; wasQuoted = false; state = 'field';
  };
  const finishRow = () => { finishField(); onRow(row); row = []; started = false; };
  return {
    write(source) {
      if (ended) throw new Error('CSV parser has ended');
      if (typeof source !== 'string') throw new TypeError('CSV chunks must be strings');
      let start = 0;
      const flush = (end) => { if (end > start) append(source.slice(start, end)); };
      for (let index = 0; index < source.length; index += 1) {
        const ch = source[index];
        if (first) { first = false; if (ch === '\ufeff') { start = index + 1; continue; } }
        if (skipLF) { skipLF = false; if (ch === '\n') { start = index + 1; continue; } }
        if (state === 'quoted') {
          if (ch === '"') { flush(index); start = index + 1; state = 'quote'; }
          continue;
        }
        if (state === 'quote' && ch === '"') {
          append('"'); state = 'quoted'; start = index + 1; continue;
        }
        if (ch === ',') {
          flush(index); finishField(); start = index + 1; started = true;
        } else if (ch === '\n' || ch === '\r') {
          flush(index);
          if (started) finishRow();
          start = index + 1; skipLF = ch === '\r';
        } else if (state === 'quote' || state === 'closed') {
          if (ch !== ' ' && ch !== '\t') throw new Error('Invalid CSV: unexpected character after closing quote');
          state = 'closed'; start = index + 1;
        } else if (ch === '"' && !parts.length && index === start) {
          state = 'quoted'; wasQuoted = true; started = true; start = index + 1;
        } else started = true;
      }
      flush(source.length);
    },
    end() {
      if (ended) return;
      ended = true;
      if (state === 'quoted') throw new Error('Invalid CSV: unterminated quoted field');
      if (started) finishRow();
    },
  };
}

function createCsvRecordParser({ maxRows = Infinity, ...limits } = {}) {
  let headers;
  const records = [];
  const parser = createCsvParser((row) => {
    if (!headers) { headers = row.map((item) => item.trim()); return; }
    if (records.length >= maxRows) throw new Error('CSV exceeds the row limit');
    records.push(Object.fromEntries(row.map((item, index) => [headers[index] || ('col' + index), item])));
  }, limits);
  return { ...parser, records };
}

function parseCsvRecords(source) {
  const { write, end, records } = createCsvRecordParser();
  write(source); end();
  return records;
}

function csvCell(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  let source = String(text);
  // CSV formula injection: scraped content starting with =, +, -, @ (or a
  // tab/CR, which Excel also honors as a formula introducer) executes as a
  // formula when the export is opened in a spreadsheet app. Prefix with a
  // single quote — the standard neutralizer — so the value renders as text.
  if (/^[=+\-@\t\r]/.test(source)) source = "'" + source;
  return `"${source.includes('"') ? source.replace(/"/g, '""') : source}"`;
}

// Account exports carry an encoding column so spreadsheet-safe formula
// prefixes can be removed on reimport without changing passwords beginning
// with a literal apostrophe. Ordinary third-party CSV is never decoded.
function reversibleCsvCell(value) {
  const source = String(value ?? '');
  return csvCell(source.startsWith("'") ? "'" + source : source);
}

function decodeReversibleCsvCell(value) {
  return /^'[=+\-@\t\r']/.test(value) ? value.slice(1) : value;
}

/** Bounded batches avoid constructing a second, complete export in memory. */
function* csvChunks(records, fields, formatCell = csvCell) {
  let chunk = '';
  // Emit directly: a nested generator plus fields.map allocated two objects
  // for every exported record, even though the values are consumed once.
  for (let rowIndex = -1; rowIndex < records.length; rowIndex += 1) {
    const record = rowIndex < 0 ? null : records[rowIndex];
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      let value = field;
      if (rowIndex >= 0) value = record != null && Object.hasOwn(record, field) ? record[field] ?? '' : '';
      const cell = (index ? ',' : '') + formatCell(value);
      if (chunk.length + cell.length > 64 * 1024 && chunk) { yield chunk; chunk = ''; }
      chunk += cell;
    }
    chunk += '\n';
    if (chunk.length >= 64 * 1024) { yield chunk; chunk = ''; }
  }
  if (chunk) yield chunk;
}

return { createCsvParser, createCsvRecordParser, parseCsvRecords, csvCell, csvChunks, reversibleCsvCell, decodeReversibleCsvCell };
});

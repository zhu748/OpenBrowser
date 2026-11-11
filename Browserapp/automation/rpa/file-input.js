'use strict';

const { createReadStream } = require('node:fs');
const { StringDecoder } = require('node:string_decoder');
const { createCsvRecordParser } = require('./csv');
const READ_CHUNK_BYTES = 64 * 1024;
const INPUT_LIMITS = Object.freeze({ maxBytes: 32 * 1024 * 1024, maxRows: 100000, maxFieldChars: 1024 * 1024, maxColumns: 1000 });

async function* inputChunks(filename, check, limits) {
  let bytes = 0;
  const decoder = new StringDecoder('utf8');
  for await (const chunk of createReadStream(filename, { highWaterMark: READ_CHUNK_BYTES })) {
    check(); bytes += chunk.length;
    if (bytes > limits.maxBytes) throw new Error('RPA input exceeds the byte limit');
    yield decoder.write(chunk);
  }
  check();
  const tail = decoder.end();
  if (tail) yield tail;
}

async function readCsvRecords(filename, check = () => {}, options = {}) {
  const limits = { ...INPUT_LIMITS, ...options };
  const parser = createCsvRecordParser(limits);
  for await (const chunk of inputChunks(filename, check, limits)) {
    check(); parser.write(chunk);
  }
  check(); parser.end();
  return parser.records;
}

async function readTextLines(filename, check = () => {}, options = {}) {
  const limits = { ...INPUT_LIMITS, ...options };
  const lines = [];
  let pending = [];
  let lineChars = 0;
  const append = (part) => {
    lineChars += part.length;
    if (lineChars > limits.maxFieldChars) throw new Error('Text line exceeds the character limit');
    pending.push(part);
  };
  const addLine = (line) => {
    if (!line.length) return;
    if (lines.length >= limits.maxRows) throw new Error('Text input exceeds the row limit');
    lines.push(line);
  };
  for await (const chunk of inputChunks(filename, check, limits)) {
    check();
    let start = 0, end;
    while ((end = chunk.indexOf('\n', start)) !== -1) {
      if (end > start) append(chunk.slice(start, end));
      const value = pending.join('');
      const line = value.endsWith('\r') ? value.slice(0, -1) : value;
      addLine(line);
      pending = []; lineChars = 0; start = end + 1;
    }
    if (start < chunk.length) append(chunk.slice(start));
  }
  check();
  const remainder = pending.join('');
  addLine(remainder);
  return lines;
}

async function readJsonRecords(filename, check = () => {}, options = {}) {
  const limits = { ...INPUT_LIMITS, ...options };
  const chunks = [];
  for await (const chunk of inputChunks(filename, check, limits)) chunks.push(chunk);
  check();
  const records = JSON.parse(chunks.join(''));
  if (!Array.isArray(records)) throw new Error('useExcel JSON content must be an array');
  if (records.length > limits.maxRows) throw new Error('JSON input exceeds the row limit');
  check();
  return records;
}

module.exports = { readCsvRecords, readTextLines, readJsonRecords, INPUT_LIMITS };

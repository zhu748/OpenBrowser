'use strict';

const { createReadStream } = require('node:fs');
const { createCsvRecordParser } = require('./csv');
const READ_CHUNK_BYTES = 64 * 1024;

async function readCsvRecords(filename, check = () => {}) {
  const parser = createCsvRecordParser();
  for await (const chunk of createReadStream(filename, { encoding: 'utf8', highWaterMark: READ_CHUNK_BYTES })) {
    check(); parser.write(chunk);
  }
  check(); parser.end();
  return parser.records;
}

async function readTextLines(filename, check = () => {}) {
  const lines = [];
  let pending = [];
  for await (const chunk of createReadStream(filename, { encoding: 'utf8', highWaterMark: READ_CHUNK_BYTES })) {
    check();
    let start = 0, end;
    while ((end = chunk.indexOf('\n', start)) !== -1) {
      if (end > start) pending.push(chunk.slice(start, end));
      const value = pending.join('');
      const line = value.endsWith('\r') ? value.slice(0, -1) : value;
      if (line.length) lines.push(line);
      pending = []; start = end + 1;
    }
    if (start < chunk.length) pending.push(chunk.slice(start));
  }
  check();
  const remainder = pending.join('');
  if (remainder.length) lines.push(remainder);
  return lines;
}

module.exports = { readCsvRecords, readTextLines };

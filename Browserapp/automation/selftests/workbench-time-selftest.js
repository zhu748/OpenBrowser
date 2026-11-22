'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  // Import the workbench formatter with the bundled asset aliases stubbed.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-workbench-time-'));
  const actualNow = Date.now;
  const now = Date.parse('2026-11-22T12:00:00Z');
  Date.now = () => now;
  globalThis.$t = (key, values) => key.replace(/\{(\w+)\}/g, (_, name) => values[name]);
  try {
    const file = path.join(root, 'workbench-utilities.mjs');
    const source = path.resolve(__dirname, '../../frontend/src/workbench/shared/workbench-utilities.mjs');
    await Promise.all([
      fs.copyFile(source, file),
      fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}'),
      fs.writeFile(path.join(root, 'workbench-vendor-utilities.js'), 'export const driver = null, deepEqual = null;'),
      fs.writeFile(path.join(root, 'workbench-image-assets.js'), 'export const images = {};'),
      fs.writeFile(path.join(root, 'workbench-table.js'), 'export const sortDirection = null;'),
    ]);
    const { fr: formatTime } = await import(pathToFileURL(file).href);
    assert.equal(formatTime(String(now - 2 * 60_000)), '2分钟前', 'numeric text must advance past “just now”');
    assert.equal(formatTime(now - 2 * 60 * 60_000), '2小时前');
    assert.equal(formatTime('2026-11-20T10:12:34.000Z'), '2天前');
    assert.equal(formatTime('2026-11-01T23:12:34-02:00'), '2026/11/01', 'old ISO timestamps omit time and retain the supplied calendar day');
    assert.equal(formatTime('2026-11-10 14:20:30'), '2026/11/10', 'old local strings keep their existing date format');
    assert.equal(formatTime(new Date('2026-11-01T06:00:00Z')), '2026/11/01');
    assert.equal(formatTime(Date.parse('2026-11-01T06:00:00Z')), '2026/11/01');
    assert.equal(formatTime('not a timestamp'), '--');
    assert.equal(formatTime(null), '--');
    assert.equal(formatTime(now), '刚刚');
    assert.equal(formatTime(now + 60_000), '刚刚', 'future timestamps keep their existing label');
    console.log('WORKBENCH_TIME_SELFTEST OK (refresh epoch, translated relative times, old dates, invalid input)');
  } finally {
    Date.now = actualNow;
    delete globalThis.$t;
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { parseProfileImport } = require('../../rebuild/profile-import-formats');
const { cell, workbookFixture } = require('../../rebuild/selftest-profile-xlsx.cjs');

function row(number, values) {
  return `<row r="${number}">${Object.entries(values).map(([column, value]) => cell(column + number, value)).join('')}</row>`;
}

function parse(...rows) {
  return parseProfileImport({
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    bytes: workbookFixture([rows.join('')]),
  });
}

test('a note in an ignored first column cannot drop preceding records', async () => {
  for (const note of ['Review row 5 against notes', 'Instructions: Review row 5 against notes']) {
    const rows = await parse(
      row(1, { A: 'Notes', B: 'windowName', C: 'os' }),
      row(2, { B: 'First', C: 'Windows' }),
      row(3, { B: 'Second', C: 'Linux' }),
      row(4, { A: note }),
      row(5, { B: 'Third', C: 'macOS' }),
    );
    assert.deepEqual(rows.map(({ rowNum, windowName }) => [rowNum, windowName]),
      [[2, 'First'], [3, 'Second'], [5, 'Third']]);
  }
});

test('a window name mentioning row 5 remains data for ordinary validation', async () => {
  const rows = await parse(
    row(1, { A: 'windowName', B: 'os' }),
    row(2, { A: 'First', B: 'Windows' }),
    row(4, { A: 'Follow-up for row 5' }),
    row(5, { A: 'Next', B: 'macOS' }),
  );
  assert.deepEqual(rows.map(({ rowNum, windowName }) => [rowNum, windowName]),
    [[2, 'First'], [4, 'Follow-up for row 5'], [5, 'Next']]);
});

test('explicit legacy template notes still skip the help and example rows', async () => {
  const { default: english } = await import('../../frontend/src/workbench/locales/en.mjs');
  const { default: chinese } = await import('../../frontend/src/workbench/locales/zh-CN.mjs');
  const instructionKey = Object.keys(chinese).find(key => key.startsWith('说明: \n1. 数据请从第 5 行'));
  assert.ok(instructionKey, 'shipped template instruction message');
  const templates = [
    { headers: { A: chinese['窗口名称'], B: chinese['操作系统'] }, note: chinese[instructionKey] },
    { headers: { A: 'Window Name', B: 'Operating System' }, note: english[instructionKey] },
    { headers: { A: 'windowName', B: 'os' }, note: '说明：从第 5 行导入' },
    { headers: { A: english['窗口名称'], B: english['操作系统'] }, note: english[instructionKey] },
  ];
  for (const { headers, note } of templates) {
    const rows = await parse(
      row(1, headers),
      row(2, { A: 'Example name', B: 'Required OS' }),
      row(3, { A: 'Example profile', B: 'Linux' }),
      row(4, { A: note.replace('{count}', '200') }),
      row(5, { A: 'Real profile', B: 'macOS' }),
    );
    assert.deepEqual(rows, [{ rowNum: 5, windowName: 'Real profile', os: 'macOS' }]);
  }
});

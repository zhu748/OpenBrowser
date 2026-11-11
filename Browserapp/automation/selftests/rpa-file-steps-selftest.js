'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { RpaEngine } = require('../rpa-engine');
const { OUTPUT_DIRECTORY } = require('../rpa/paths');
const { parseCsvRecords, createCsvRecordParser, csvChunks } = require('../rpa/csv');

async function main() {
  const records = [
    { name: '  quoted spaces  ', text: 'first\nsecond', other: 'a,"b"', unicode: '中文😀' },
    { name: '', text: 'first\r\n\r\nlast', other: '', unicode: 'é' },
  ];
  const fields = Object.keys(records[0]);
  const encoded = [...csvChunks(records, fields)].join('');
  assert.deepEqual(parseCsvRecords(encoded), records, 'exported cells round-trip including whitespace and quoted blank lines');
  const specialFields = ['constructor', 'toString', '__proto__'];
  const specialRecords = [{}, JSON.parse('{"constructor":"own","toString":"text","__proto__":"literal"}')];
  assert.deepEqual(parseCsvRecords([...csvChunks(specialRecords, specialFields)].join('')), [
    { constructor: '', toString: '', ['__proto__']: '' }, specialRecords[1],
  ], 'only own record fields are exported; prototype member names remain valid columns');
  for (const input of [encoded, '\ufeffa,b\r\n"x""y",z\r\n\n"",\n', 'name\n"a" \n']) {
    for (let width = 1; width <= 64; width += 1) {
      const parser = createCsvRecordParser();
      parser.write('');
      for (let start = 0; start < input.length; start += width) parser.write(input.slice(start, start + width));
      parser.end();
      assert.deepEqual(parser.records, parseCsvRecords(input), 'all chunk boundaries preserve quotes, BOM, CRLF and Unicode');
    }
  }
  const incomplete = createCsvRecordParser(); incomplete.write('name\n"unfinished');
  assert.throws(() => incomplete.end(), /unterminated/);
  assert.deepEqual(parseCsvRecords('\ufeffname,value\r\n\r\na, b \r\nx,y\r'), [
    { name: 'a', value: 'b' }, { name: 'x', value: 'y' },
  ], 'BOM, empty lines, unquoted trimming, CRLF and CR remain supported');
  assert.deepEqual(parseCsvRecords('name,value\n"",\n'), [{ name: '', value: '' }]);
  assert.deepEqual(parseCsvRecords('name,value\na\n'), [{ name: 'a' }], 'short records keep their existing shape');
  assert.throws(() => parseCsvRecords('name\n"unfinished'), /unterminated/);
  assert.throws(() => parseCsvRecords('name\n"closed"junk'), /after closing quote/);
  assert.deepEqual(parseCsvRecords('__proto__,constructor\na,b\n')[0].__proto__, 'a', 'special header keys are data');

  await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const temp = await fs.mkdtemp(path.join(OUTPUT_DIRECTORY, 'file-steps-'));
  try {
    const rpa = new RpaEngine({ engine: {}, store: null });
    // Isolate outputs while keeping the real input path sandbox and dispatch.
    const output = path.join(temp, 'roundtrip.csv');
    rpa.outputPath = () => output;
    const ctx = { variables: { records }, remarks: [], log: async () => {} };
    await rpa.executeStep(0, { type: 'exportExcel', data: '${records}' }, ctx);
    assert.equal(await fs.readFile(output, 'utf8'), encoded);
    await rpa.executeStep(0, { type: 'useExcel', path: output, variable: 'loaded' }, ctx);
    assert.deepEqual(ctx.variables.loaded, records, 'actual file actions share the same CSV contract');

    const specialContext = { variables: rpa.initialVariables({}), remarks: [] };
    await rpa.executeStep(0, { type: 'useExcel', path: output, variable: '__proto__' }, specialContext);
    assert.deepEqual(specialContext.variables.__proto__, records);
    assert.equal(Object.getPrototypeOf(specialContext.variables), null, 'file steps cannot alter task variable prototypes');
    const emptyContext = { remarks: [] };
    await rpa.executeStep(0, { type: 'variableOperation', params: {
      type: 'set', variableObjList: [{ key: '__proto__', value: { marker: true } }],
    } }, emptyContext);
    assert.equal(Object.getPrototypeOf(emptyContext.variables), null, 'direct step execution also creates a safe dictionary');
    assert.deepEqual(emptyContext.variables.__proto__, { marker: true });

    // Enough data to cross write boundaries, with a cancellation during I/O.
    ctx.variables.records = Array.from({ length: 4000 }, (_, n) => ({ n, text: '测试😀'.repeat(20) }));
    let checks = 0;
    const cancelled = { ...ctx, isCancelled: () => ++checks > 2 };
    await assert.rejects(rpa.executeStep(0, { type: 'exportExcel', data: '${records}' }, cancelled), /cancelled/);
    assert.equal(await fs.readFile(output, 'utf8'), encoded, 'cancelled exports preserve the previous complete file');
    assert.deepEqual(await fs.readdir(temp), ['roundtrip.csv'], 'cancelled export removes its temporary file');
    await rpa.executeStep(0, { type: 'exportExcel', data: '${records}' }, ctx);
    assert.deepEqual(parseCsvRecords(await fs.readFile(output, 'utf8')), ctx.variables.records.map(({ n, text }) => ({ n: String(n), text })));

    const cyclic = {}; cyclic.self = cyclic;
    ctx.variables.records = [{ value: cyclic }];
    await fs.writeFile(output, 'previous');
    await assert.rejects(rpa.executeStep(0, { type: 'exportExcel', data: '${records}' }, ctx), /circular/);
    assert.equal(await fs.readFile(output, 'utf8'), 'previous');
    assert.deepEqual(await fs.readdir(temp), ['roundtrip.csv']);
    await fs.writeFile(output, 'name\n"unfinished');
    await rpa.executeStep(0, { type: 'useExcel', path: output, optional: true, variable: 'loaded' }, ctx);
    assert.deepEqual(ctx.variables.loaded, []);
    await assert.rejects(rpa.executeStep(0, { type: 'useExcel', path: output }, ctx), /unterminated/);
    const json = path.join(temp, 'data.json');
    await fs.writeFile(json, JSON.stringify(records));
    await rpa.executeStep(0, { type: 'useExcel', path: json, variable: 'loaded' }, ctx);
    assert.deepEqual(ctx.variables.loaded, records);
    const textFile = path.join(temp, 'lines.txt');
    const longLine = 'x'.repeat(65535);
    const source = longLine + '\r\n中文😀\n\n' + '无换行'.repeat(50000) + '\r';
    await fs.writeFile(textFile, source);
    await rpa.executeStep(0, { type: 'importText', path: textFile, variable: 'lines' }, ctx);
    assert.deepEqual(ctx.variables.lines, source.split(/\r?\n/).filter(Boolean), 'streamed text preserves CRLF across reads and long final lines');
    const largeCsv = path.join(temp, 'large.csv');
    await fs.writeFile(largeCsv, 'text\n"' + '中文😀\r\n""'.repeat(20000) + '"\n');
    await rpa.executeStep(0, { type: 'useExcel', path: largeCsv, variable: 'large' }, ctx);
    assert.equal(ctx.variables.large[0].text, '中文😀\r\n"'.repeat(20000));
    ctx.variables.large = ['preserved'];
    let cancelledRead = false;
    await assert.rejects(rpa.executeStep(0, { type: 'useExcel', path: largeCsv, variable: 'large', optional: true }, {
      ...ctx, isCancelled: () => { if (cancelledRead) return true; cancelledRead = true; return false; },
    }), /cancelled/);
    assert.deepEqual(ctx.variables.large, ['preserved'], 'optional reads cannot publish partial results on cancellation');
    console.log('RPA_FILE_STEPS_SELFTEST OK (round-trip, multi-chunk files, cancellation, atomic failure, optional input, dispatch)');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

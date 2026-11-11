'use strict';

/** Local file actions; browser/session orchestration belongs to rpa-engine.js. */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { getVariableValue } = require('./variables');
const { OUTPUT_DIRECTORY, resolveSafeRpaPath } = require('./paths');
const { csvCell, csvChunks } = require('./csv');
const { readCsvRecords, readTextLines, readJsonRecords } = require('./file-input');

module.exports = {
  async stepSaveData({ ctx, params, text }) {
    const filename = this.outputPath(text(params.name || 'data'), '.txt');
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.appendFile(filename, text(params.template ?? params.content ?? '') + '\n', 'utf8');
    if (ctx?.log) await ctx.log('saved data: ' + filename);
    return;
  },

  async stepExportExcel({ ctx, params, variables, text }) {
    const records = this.exportRecords(params, variables);
    const fieldSet = new Set();
    if (!Array.isArray(params.fields) || !params.fields.length) {
      for (const record of records) for (const field of Object.keys(record || {})) fieldSet.add(field);
    }
    const fields = Array.isArray(params.fields) && params.fields.length ? params.fields.map(String) : [...fieldSet];
    const filename = this.outputPath(text(params.name || 'export'), '.csv');
    await fs.mkdir(path.dirname(filename), { recursive: true });
    const temporary = filename + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
    let handle;
    try {
      handle = await fs.open(temporary, 'wx');
      for (const chunk of csvChunks(records, fields, (cell) => this.csvCell(cell))) {
        this.assertTaskAlive(ctx);
        await handle.writeFile(chunk, 'utf8');
      }
      await handle.close(); handle = null;
      this.assertTaskAlive(ctx);
      await fs.rename(temporary, filename);
    } finally {
      await handle?.close();
      await fs.rm(temporary, { force: true });
    }
    if (ctx?.log) await ctx.log('exported CSV: ' + filename);
    return;
  },

  async stepUseExcel({ ctx, params, variables, text }) {
    const targetVar = params.variable || 'data';
    const skippable = (
      params.isSkip === true
      || params.isSkip === 1
      || params.isSkip === '1'
      || params.isSkip === 'true'
      || params.optional === true
      || params.optional === '1'
      || params.optional === 'true'
    );
    let filePath = text(
      params.path
      ?? params.filePath
      ?? params.file
      ?? params.dataExcelPath
      ?? params.excelPath
      ?? params.content
    ).trim();
    if (!filePath || /\$\{[^}]+\}/.test(filePath)) {
      if (!skippable) {
        throw new Error(
          filePath
            ? 'useExcel path is unresolved (' + filePath + '); set the template variable to a local CSV/JSON file'
            : 'useExcel requires a CSV or JSON file path'
        );
      }
      variables[targetVar] = [];
      if (ctx?.log) {
        await ctx.log('useExcel skipped: no spreadsheet path configured (set a CSV/JSON path in template variables)');
      }
      return;
    }

    let safePath;
    try {
      safePath = await this.resolveSpreadsheetPath(filePath);
    } catch (error) {
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: ' + error.message);
        return;
      }
      throw error;
    }

    const extension = path.extname(safePath).toLowerCase();
    if (extension === '.xlsx' || extension === '.xls') {
      const message = 'useExcel does not read .xlsx/.xls yet; convert to .csv or .json and set the path variable';
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: ' + message);
        return;
      }
      throw new Error(message);
    }
    if (extension !== '.csv' && extension !== '.json') {
      const message = 'useExcel currently accepts .csv or .json (got ' + extension + ')';
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: ' + message);
        return;
      }
      throw new Error(message);
    }

    const check = () => this.assertTaskAlive(ctx);
    if (extension === '.csv') {
      try { variables[targetVar] = await readCsvRecords(safePath, check); }
      catch (error) {
        check();
        if (!skippable) throw error;
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: cannot read or parse CSV ' + safePath + ' (' + error.message + ')');
        return;
      }
      if (ctx?.log) await ctx.log(`useExcel loaded ${variables[targetVar].length} row(s) from ${safePath}`);
      return;
    }

    let records;
    try { records = await readJsonRecords(safePath, check); }
    catch (error) {
      check();
      if (!skippable) throw error;
      variables[targetVar] = [];
      if (ctx?.log) await ctx.log('useExcel skipped: cannot read or parse JSON ' + safePath + ' (' + error.message + ')');
      return;
    }
    variables[targetVar] = records;
    if (ctx?.log) await ctx.log(`useExcel loaded ${records.length} row(s) from ${safePath}`);
    return;
  },

  async stepImportText({ ctx, params, variables, text }) {
    const filePath = text(params.path || params.filePath || params.file);
    if (!filePath) throw new Error('importText requires a file path');
    const resolved = resolveSafeRpaPath(filePath);
    variables[params.variable || 'textLines'] = await readTextLines(resolved, () => this.assertTaskAlive(ctx));
    return;
  },

  outputPath(name, extension) {
    const raw = String(name || 'output').replace(/[\\/:*?"<>|]+/g, '_').replace(/^\.+$/, 'output');
    const suffix = path.extname(raw) ? '' : extension;
    return resolveSafeRpaPath(path.join(OUTPUT_DIRECTORY, raw + suffix));
  },

  csvCell(value) {
    return csvCell(value);
  },

  exportRecords(params, variables) {
    const candidate = getVariableValue(params.data || params.content || params.variable || '', variables);
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') return [candidate];
    const list = Object.values(variables).find(Array.isArray);
    return Array.isArray(list) ? list : [];
  },
};

#!/usr/bin/env node
'use strict';

/**
 * Regenerates automation/data/locale/i18n-data.js — the browser-side bridge that
 * carries the JSON locale catalogs into the sandboxed renderer (no require/fs
 * there). i18n.js loads the very same JSON through require() under Node; this
 * script embeds those bytes so both environments see identical data.
 * i18n-selftest.js fails the gate when the bridge is stale relative to the JSON
 * source of truth, so hand edits to either side are caught.
 *
 * Run: node scripts/build-i18n-data.js
 */

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(APP_ROOT, 'automation', 'data', 'locale');
const OUTPUT_PATH = path.join(DATA_DIR, 'i18n-data.js');

// Insertion order matches the CATALOGS literal in i18n.js.
const CATALOG_FILES = [
  ['zh-CN', 'zh-CN.json'],
  ['en', 'en.json'],
  ['ja', 'ja.json'],
  ['vi', 'vi.json'],
  ['fr', 'fr.json'],
  ['de', 'de.json'],
  ['th', 'th.json'],
  ['id', 'id.json'],
];

function loadLocaleJsonData() {
  const readJson = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  const catalogs = {};
  for (const [code, file] of CATALOG_FILES) catalogs[code] = readJson(file);
  return {
    catalogs,
    uiZhEn: readJson('ui-zh-en.json'),
    runtimeZhEn: readJson('runtime-zh-en.json'),
  };
}

function buildI18nDataSource(data) {
  return [
    '(function (global) {',
    "  'use strict';",
    '  // GENERATED FILE — do not edit by hand. Regenerate with: node scripts/build-i18n-data.js',
    '  // Source of truth: automation/data/locale/*.json (loaded by i18n.js).',
    '  global.__OB_I18N_LOCALE_DATA__ = ' + JSON.stringify(data, null, 2) + ';',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ].join('\n');
}

function isUpToDate() {
  try {
    return fs.readFileSync(OUTPUT_PATH, 'utf8') === buildI18nDataSource(loadLocaleJsonData());
  } catch (_) {
    return false;
  }
}

function regenerate() {
  const data = loadLocaleJsonData();
  fs.writeFileSync(OUTPUT_PATH, buildI18nDataSource(data));
  return OUTPUT_PATH;
}

if (require.main === module) {
  const out = regenerate();
  console.log('wrote ' + path.relative(APP_ROOT, out));
}

module.exports = { loadLocaleJsonData, buildI18nDataSource, isUpToDate, regenerate, OUTPUT_PATH, DATA_DIR };

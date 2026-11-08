#!/usr/bin/env node
/**
 * Verify the 代理 (proxy page) alignment with the reference frontend:
 * check-result details (位置/时区/ISP/检测时间) persisted + shown, toolbar
 * filter / delete-failed / clear-all / export / selected-count, import parse
 * feedback (duplicates + missing lines + 500 cap), refresh-URL field, and
 * i18n coverage for every new string.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); else console.log('ok  ' + msg); };

const main = (async () => {
// 1. Store persists rich check details and keeps previous values on failure.
const { ProxyStore } = require('./automation/proxy-store');
const storeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-align-'));
const store = new ProxyStore(path.join(storeDir, 'proxies.json'));
const item = await store.create({ name: 'align-a', protocol: 'socks5', host: '10.0.0.8', port: 1080, raw: 'socks5://10.0.0.8:1080' });
await store.markCheck(item.id, {
  ip: '45.12.33.7', country: 'United States', countryCode: 'US',
  city: 'Dallas', timezone: 'America/Chicago', isp: 'Contabo', latencyMs: 210, networkType: 'hosting',
});
const checked = store.get(item.id);
assert(checked.lastIp === '45.12.33.7', 'store keeps lastIp');
assert(checked.lastCountry === 'United States', 'store persists lastCountry');
assert(checked.lastCity === 'Dallas', 'store persists lastCity');
assert(checked.lastTimezone === 'America/Chicago', 'store persists lastTimezone');
assert(checked.lastIsp === 'Contabo', 'store persists lastIsp');
assert(checked.lastCheckOk === true, 'store keeps lastCheckOk');
assert(typeof checked.lastCheck === 'string' && !Number.isNaN(Date.parse(checked.lastCheck)), 'store stamps lastCheck');
// A later failed check keeps the previous verified exit details (degradation source).
await store.markCheckError(item.id, { errorClass: 'timeout', latencyMs: 3000 });
const failed = store.get(item.id);
assert(failed.lastCheckOk === false && failed.lastCity === 'Dallas', 'failed check keeps previous details');

// 2. UI pure helpers (ui-proxy.js is function-declarations-only, so it can be
// evaluated as-is in Node without a DOM; the proxy parse helpers it calls live
// in renderer.js and are extracted by name, with a pass-through tx() stub).
global.window = undefined;
const uiSource = read('ui/ui-proxy.js');
const rendererSource = read('renderer.js');
function extractFn(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start > 0, `renderer defines ${name}`);
  // Walk past the parameter list (which may contain destructuring braces),
  // then match the function-body braces.
  let i = source.indexOf('(', start);
  let paren = 0;
  for (; i < source.length; i++) {
    if (source[i] === '(') paren++;
    else if (source[i] === ')') { paren--; if (!paren) { i++; break; } }
  }
  while (i < source.length && source[i] !== '{') i++;
  let depth = 0; let end = -1;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') { depth--; if (!depth) { end = i + 1; break; } }
  }
  assert(end > start, `extract ${name}`);
  return source.slice(start, end);
}
const parseHelpers = ['decodeProxyPartForUi', 'normalizeProxyProtocolForUi', 'splitProxyRemarkForUi', 'proxyHostForUi', 'encodeProxyHostForUi', 'buildProxyUiValue']
  .map((name) => extractFn(rendererSource, name)).join('\n\n');
const sandbox = new Function(
  'const tx = (s) => String(s);\n' + parseHelpers + '\n' + uiSource
  + '\nreturn { formatProxyCheckTime, matchesProxyFilter, buildProxyExportText, normalizeProxyImportLines, parseProxyInputForUi };',
)();
const { formatProxyCheckTime, matchesProxyFilter, buildProxyExportText, normalizeProxyImportLines } = sandbox;

assert(formatProxyCheckTime('not-a-date') === '—', 'formatProxyCheckTime rejects garbage');
const justNow = formatProxyCheckTime(new Date().toISOString());
assert(justNow === '刚刚', `formatProxyCheckTime relative label, got ${justNow}`);
const minutesAgo = formatProxyCheckTime(new Date(Date.now() - 5 * 60_000).toISOString());
assert(minutesAgo === '5 分钟前', `relative minutes label, got ${minutesAgo}`);
const old = formatProxyCheckTime(new Date(Date.now() - 3 * 86_400_000).toISOString());
assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(old), `absolute fallback, got ${old}`);

const fItem = { lastCheckOk: true };
assert(matchesProxyFilter(fItem, 'all') && matchesProxyFilter(fItem, 'ok'), 'filter ok/all');
assert(!matchesProxyFilter(fItem, 'fail') && !matchesProxyFilter(fItem, 'unchecked'), 'filter excludes others');
assert(matchesProxyFilter({ lastCheckOk: null }, 'unchecked') && !matchesProxyFilter({ lastCheckOk: null }, 'ok'), 'filter unchecked');

const exportText = buildProxyExportText([
  { raw: 'socks5://u:p@10.0.0.8:1080' },
  { raw: '', host: '10.0.0.9', port: 8080 },
]);
assert(exportText === 'socks5://u:p@10.0.0.8:1080\n10.0.0.9:8080\n', 'export builds importable lines');

const parsed = normalizeProxyImportLines(
  [
    'socks5://u:p@10.0.0.8:1080#美东01',
    'socks5://u:p@10.0.0.8:1080#dup-in-input',
    'not-a-proxy',
    '10.0.0.9:8080',
    '# comment',
  ],
  [{ protocol: 'socks5', host: '10.0.0.9', port: 8080, username: '' }],
  'socks5',
  500,
);
assert(parsed.drafts.length === 1 && parsed.drafts[0].host === '10.0.0.8', 'import keeps unique new line');
assert(parsed.duplicates === 2, `import filters duplicates (input + library), got ${parsed.duplicates}`);
assert(parsed.missing.length === 1 && parsed.missing[0] === 3, `import reports missing line number, got ${JSON.stringify(parsed.missing)}`);
assert(parsed.drafts[0].remark === '美东01', 'import keeps remark');
const capped = normalizeProxyImportLines(Array.from({ length: 505 }, (_, i) => `10.1.${Math.floor(i / 250)}.${i % 250}:8080`), [], 'socks5', 500);
assert(capped.drafts.length === 500 && capped.truncated === true, 'import enforces the 500 cap');

// 3. Page structure: toolbar controls, 检测时间 column, refresh-URL field, dialog feedback.
const html = read('index.html');
for (const probe of [
  'id="proxy-export-selected"', 'id="proxy-delete-failed"', 'id="proxy-clear-all"',
  'id="proxy-filter"', 'id="proxy-selected-count"', 'data-i18n="proxies.checkTime"',
  'id="proxy-refresh-url"', 'data-i18n="proxies.filterAll"',
]) ok(html.includes(probe), `index.html has ${probe}`);

// 4. Wiring: handlers + reference feedback strings.
const wiring = read('ui/ui-proxy-wiring.js');
for (const probe of [
  "$('#proxy-delete-failed')", "$('#proxy-clear-all')", "$('#proxy-export-selected')",
  "$('#proxy-filter')", 'proxies.deleteFailedConfirm', 'proxies.clearAllConfirm',
  'proxies.importParsed', 'proxies.importDuplicates', 'proxies.importMissing',
  'proxies.importTruncated', 'buildProxyExportText(items)', 'normalizeProxyImportLines(text, proxyLibrary',
  'proxies.locationLabel', 'proxies.timezoneLabel', 'proxies.testSuccess',
  'proxies.deleteConfirmNamed',
]) ok(wiring.includes(probe), `wiring has ${probe}`);
ok(wiring.includes('anchor.download = `proxies-'), 'export triggers a download');

// 5. renderProxies: filter + time cell + exit tooltip + selected chip.
for (const probe of [
  "matchesProxyFilter(item, filter)", "formatProxyCheckTime(item.lastCheck)",
  "t('proxies.selected', { n })", "t('proxies.emptyFiltered')", "t('proxies.locationLabel')",
  "$('#proxy-filter')?.value || 'all'",
]) ok(uiSource.includes(probe), `renderProxies has ${probe}`);

// 6. i18n: zh + en coverage for every new key (and the zh literals used by
// static HTML / tx() resolve through the zh catalog values).
global.localStorage = { store: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); } };
const I = require('./i18n.js');
const keys = [
  'proxies.selected', 'proxies.empty', 'proxies.emptyFiltered', 'proxies.filterAll', 'proxies.filterOk',
  'proxies.filterFail', 'proxies.filterUnchecked', 'proxies.filterAria', 'proxies.checkTime',
  'proxies.locationLabel', 'proxies.timezoneLabel', 'proxies.testSuccess', 'proxies.deleteConfirmNamed',
  'proxies.deleteDone', 'proxies.deleteFailed', 'proxies.deleteFailedConfirm', 'proxies.deleteFailedDone',
  'proxies.noFailed', 'proxies.clearAll', 'proxies.clearAllConfirm', 'proxies.confirmClear', 'proxies.clearAllDone',
  'proxies.exportSelected', 'proxies.exportDone', 'proxies.exportEmpty', 'proxies.importParsed',
  'proxies.importDuplicates', 'proxies.importMissing', 'proxies.importMissingOnly', 'proxies.importTruncated',
  'proxies.refreshUrlLabel', 'proxies.refreshUrlHint', 'proxies.refreshUrlHintLong',
  'proxies.importListLabel', 'proxies.importFormatHint',
];
I.setPreference('zh-CN', { persist: false, silent: true });
for (const key of keys) {
  const zh = I.t(key);
  ok(zh && zh !== key, `zh has ${key}`);
  assert(I.t(key) !== '', `zh ${key} non-empty`);
}
I.setPreference('en', { persist: false, silent: true });
for (const key of keys) ok(I.t(key) !== key, `en has ${key}`);
I.setPreference('en', { persist: false, silent: true });
ok(I.t('proxies.selected', { n: 3 }) === '3 proxies selected', 'en selected interpolates');
ok(I.t('proxies.deleteFailedConfirm', { n: 2 }).includes('2'), 'en confirm interpolates');
I.setPreference('zh-CN', { persist: false, silent: true });
ok(I.t('proxies.selected', { n: 3 }).includes('3'), 'zh selected interpolates');

// 7. Runtime zh→en fragments for relative check times.
I.setPreference('en', { persist: false, silent: true });
const translated = I.translateChineseUiText ? I.translateChineseUiText('5 分钟前') : null;
ok(translated === '5 min ago', `relative time translates, got ${translated}`);

if (fails.length) {
  console.error('\nFAILURES:\n' + fails.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('PASS proxy-page-alignment-selftest');
})();
main.then(() => {}, (error) => { console.error(error); process.exit(1); });

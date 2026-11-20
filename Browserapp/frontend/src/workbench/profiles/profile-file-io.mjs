import { h as api, m as loadDictionary, ti as hasKernelFields } from './utils-BIWenCnY.js';
import { i as cookiesFromImport } from './cookie-CqdL0VrU.js';
import { t as formatDate } from './format-_cvrr_iF.js';
import { o as toESM } from './rolldown-runtime-BCiCTKAo.js';
import { t as loadExcel } from './exceljs.min-DfecxsXL.js';
import { cellText, parseAccountLine, parseAccounts, parseStartupUrls } from './workbench-profile-file-values.js';
import { importColumns, templateInstructions, textTemplate } from './workbench-profile-file-columns.js';

const excelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function download(body, type, extension) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `roxy_template_${formatDate(new Date(), 'yyyyMMdd_HHmmss')}.${extension}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const newWorkbook = () => new (toESM(loadExcel(), 1).default.Workbook)();
const alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };

async function downloadWorkbook({ afterAddColumns, afterAddExplain } = {}) {
  const book = newWorkbook();
  const sheet = book.addWorksheet('Sheet1');
  sheet.properties.defaultRowHeight = 30;
  const standard = await importColumns();
  const columns = afterAddColumns?.(standard) || standard;
  sheet.columns = columns.map(({ key, header, width = 50 }) => ({ key, header, width, style: { alignment } }));
  const headings = sheet.getRow(1);
  headings.height = 30;
  const border = Object.fromEntries(['top', 'left', 'bottom', 'right'].map(side => [side, { style: 'thin' }]));
  headings.eachCell((cell, column) => {
    const required = columns[column - 1].required;
    cell.style = { font: { bold: true, name: 'Arial', color: { argb: required ? 'FFFFFF' : '000000' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: required ? 'ed7676' : 'fef08a' } }, border };
  });
  sheet.addRow(columns.map(({ richText, placeholder }) => richText ? { richText } : placeholder));
  sheet.addRow(columns.map(({ example }) => example));
  sheet.mergeCells(4, 1, 4, standard.length);
  sheet.getRow(4).height = 80;
  const instructions = sheet.getCell(4, 1);
  instructions.value = templateInstructions();
  instructions.alignment = { ...alignment, vertical: 'middle' };
  await afterAddExplain?.(sheet);
  download(await book.xlsx.writeBuffer(), excelType, 'xlsx');
}

async function downloadText() {
  download(textTemplate(await importColumns(), hasKernelFields()), 'text/plain', 'txt');
}

function parseRow(values, rowNum, isWorkbook) {
  const row = { rowNum, ...values };
  row.cookie = cookiesFromImport(cellText(row.cookie), row.windowPlatformList ?? []);
  if (row.os?.toUpperCase?.() === 'IOS') {
    row.os = 'IOS';
    if (isWorkbook && typeof row.osVersion === 'number') row.osVersion = row.osVersion.toFixed(1);
  }
  return row;
}

async function readWorkbook(file) {
  try {
    const book = newWorkbook();
    const columns = await importColumns();
    const rows = [];
    await book.xlsx.load(await file.arrayBuffer());
    book.eachSheet(sheet => {
      sheet.eachRow((row, number) => {
        if (number < 5) return;
        const fields = columns.map(({ key, formatValue }, index) => {
          const cell = row.values[index + 1];
          return [key, formatValue ? formatValue(cell?.text || cell) : cell];
        });
        rows.push(parseRow(Object.fromEntries(fields), number, true));
      });
    });
    return rows;
  } catch (error) { throw Error(`Excel 解析失败: ${error.message}`, { cause: error }); }
}

async function readText(file) {
  const keys = new Set((await importColumns()).map(({ key }) => key));
  const text = await file.text();
  const rows = [];
  for (const part of text.split(/^\s*#{4,}\s*$/m)) {
    const fields = [];
    for (const line of part.split(/\r?\n/)) {
      const [key, ...values] = line.trim().split('=');
      if (values.length && keys.has(key)) fields.push([key, values.join('=')]);
    }
    if (!fields.length) continue;
    const row = Object.fromEntries(fields);
    row.windowPlatformList = parseAccounts(row.windowPlatformList);
    row.defaultOpenUrl = parseStartupUrls(row.defaultOpenUrl);
    rows.push(parseRow(row, rows.length + 1, false));
  }
  return rows;
}

const defaultNameLabel = () => $t('未命名窗口');
const hasProfileName = name => Boolean(String(name ?? '').trim());
async function allocateWindowName() {
  try {
    const { code, data } = await api.window.userGetWindowSortNumList();
    if (code === 0 && data?.windowSortNum != null) return `${formatDate(new Date(), 'yyMMdd')}-${data.windowSortNum || 1}`;
  } catch (error) { console.error('[fetchDefaultWindowName] failed to resolve window name', error); }
}

async function defaultTemplate() {
  const { coreVersion } = await loadDictionary();
  return {
    os: 'Windows', osVersion: '11', coreVersion: coreVersion?.[0]?.value ?? '', browserVersion: null,
    isLanguageBaseIp: true, language: 'sq-AL', isDisplayLanguageBaseIp: true, displayLanguage: 'sq-AL', defaultOpenUrl: [],
    isTimeZone: true, timeZone: 'GMT-01:00 America/Scoresbysund', position: 1, isPositionBaseIp: true,
    longitude: '', latitude: '', precisionPos: '1000', forbidAudio: true, forbidImage: true, forbidMedia: true,
    positionSwitch: true, openWidth: 1000, openHeight: 1000, windowRatioPosition: '0,0,tl', resolutionType: false,
    resolutionX: '1280', resolutionY: '720', fontType: false, webRTC: 2, webGL: true, webGLInfo: 1, webGpu: 'webgl',
    canvas: true, audioContext: true, speechVoices: true, doNotTrack: true, clientRects: true, deviceInfo: true, deviceNameSwitch: true,
    macInfo: true, hardwareConcurrent: '12', deviceMemory: '8', disableSsl: false, disableSslList: [], portScanProtect: true, portScanList: '',
    useGpu: true, sandboxPermission: false, startupParam: '', isDisplayName: false, syncBookmark: false, syncHistory: false,
    syncTab: true, syncCookie: true, syncExtensions: false, syncPassword: true, syncIndexedDb: false, syncLocalStorage: true,
    clearCacheFile: false, clearCookie: false, clearLocalStorage: false, randomFingerprint: false, forbidSavePassword: true,
    stopOpenNet: false, stopOpenIP: false, stopOpenPosition: false, openWorkbench: 1, searchEngine: 'Google', openBookmarks: false,
    syncSessionStorage: false, ipChangeRemind: 2, enableGoogleLogin: 2, blockDomainList: '', allowDomainList: '',
  };
}

export { defaultNameLabel as a, readText as c, defaultTemplate as i, cellText as l, downloadText as n, hasProfileName as o,
  allocateWindowName as r, readWorkbook as s, downloadWorkbook as t, parseAccountLine as u };

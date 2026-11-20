'use strict';
const { buildZip } = require('../automation/zip-writer');

const spreadsheet = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationships = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const packageRelationships = 'http://schemas.openxmlformats.org/package/2006/relationships';

function workbookFixture(sheetData, { shared = '' } = {}) {
  const sheets = sheetData.map((_, index) => `${index + 1}`);
  return buildZip([
    { name: '[Content_Types].xml', data: `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map(id => `<Override PartName="/xl/worksheets/sheet${id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}${shared ? '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' : ''}</Types>` },
    { name: '_rels/.rels', data: `<Relationships xmlns="${packageRelationships}"><Relationship Id="doc" Type="${relationships}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<workbook xmlns="${spreadsheet}" xmlns:r="${relationships}"><sheets>${sheets.map(id => `<sheet name="Windows${id}" r:id="r${id}" sheetId="${id}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<Relationships xmlns="${packageRelationships}">${sheets.map(id => `<Relationship Id="r${id}" Type="${relationships}/worksheet" Target="worksheets/sheet${id}.xml"/>`).join('')}</Relationships>` },
    ...sheetData.map((rows, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, data: `<worksheet xmlns="${spreadsheet}"><sheetData>${rows}</sheetData></worksheet>` })),
    ...(shared ? [{ name: 'xl/sharedStrings.xml', data: `<sst xmlns="${spreadsheet}">${shared}</sst>` }] : []),
  ]);
}

function cell(ref, text) {
  const encoded = String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<c r="${ref}" t="inlineStr"><is><t>${encoded}</t></is></c>`;
}

module.exports = { workbookFixture, cell };

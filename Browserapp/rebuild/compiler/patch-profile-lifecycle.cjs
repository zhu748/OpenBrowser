'use strict';

const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const dir = 'work/rebuild/stage/assets';
fs.copyFileSync('Browserapp/rebuild/workbench-profile-lifecycle.mjs', path.join(dir, 'workbench-profile-lifecycle.js'));
const file = path.join(dir, 'useProfileOpenState-GCrr7PDa.js');
let source = fs.readFileSync(file, 'utf8');
const edits = [], parse = code => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
let completion = 0, hydration = 0;
walk.simple(parse(source), {
  BinaryExpression(node) {
    if (node.operator !== '===' || node.right.value !== 100 || node.left.type !== 'MemberExpression'
      || node.left.property.name !== 'percent' || node.left.object.property?.name !== 'data') return;
    const receiver = source.slice(node.left.object.object.start, node.left.object.object.end);
    edits.push({ start: node.start, end: node.end, text: '(' + source.slice(node.start, node.end) + '&&!'+receiver+'.uploading)' });
    completion++;
  },
  CallExpression(node) {
    if (node.callee.object?.name !== 'Reflect' || node.callee.property?.name !== 'set') return;
    const value = node.arguments[2];
    if (value?.type !== 'ObjectExpression' || value.properties.length !== 1 || value.properties[0].key.name !== 'data') return;
    const row = source.slice(value.properties[0].value.start, value.properties[0].value.end);
    edits.push({ start: value.end - 1, end: value.end - 1,
      text: ',uploading:Boolean('+row+'.uploading),code:'+row+'.code||0,message:'+row+'.errorMessage' });
    hydration++;
  },
});
if (completion !== 1 || hydration !== 1) throw Error('Profile lifecycle frontend boundaries changed');
for (const e of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, e.start) + e.text + source.slice(e.end);
parse(source);
fs.writeFileSync(file, source);

// Retain the short original labels while exposing the actual current wait in
// the native button tooltip (e.g. process startup versus fingerprint verify).
const buttonFile = path.join(dir, 'renewal-reminder-drawer-C9_4HaAB.js');
source = fs.readFileSync(buttonFile, 'utf8');
const titles = [];
walk.simple(parse(source), { ObjectExpression(node) {
  const id = node.properties.find(p => p.key?.name === 'id' && p.value.type === 'MemberExpression' && p.value.property.name === 'btnId');
  if (!id) return;
  const props = source.slice(id.value.object.start, id.value.object.end);
  titles.push({ start: node.end - 1, end: node.end - 1,
    text: ',title:'+props+'.openMessage['+props+'.data.dirId]?.data?.detail||""' });
} });
if (titles.length !== 1) throw Error('Profile progress button boundary changed');
for (const e of titles) source = source.slice(0, e.start) + e.text + source.slice(e.end);
parse(source);fs.writeFileSync(buttonFile, source);

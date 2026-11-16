'use strict';

const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { patchSource, replaceExactly } = require('./patch-source.cjs');
const root = 'work/rebuild/stage/assets';
const parse = source => acorn.parse(source, { sourceType: 'module', ecmaVersion: 'latest' });

// Tutorials depend on a removed remote video catalogue. Remove the component,
// including its default-slot banner/button, instead of hiding a broken action.
const tutorialFile = path.join(root, 'tutorial-video-Cb-jkf_V.js');
let source = fs.readFileSync(tutorialFile, 'utf8');
const exported = parse(source).body.flatMap(node => node.specifiers || []).find(node => node.exported?.name === 't');
if (!exported) throw Error('Tutorial component export changed');
source = patchSource(source, { [exported.local.name]: '{render:()=>null}' }, {}, 'local tutorial removal');
fs.writeFileSync(tutorialFile, source);

// The three-dot trigger and a native right-click share the real row menu.
const menuFile = path.join(root, 'renewal-reminder-drawer-C9_4HaAB.js');
source = fs.readFileSync(menuFile, 'utf8');
const edits = [];
walk.simple(parse(source), {
  ConditionalExpression(node) {
    if (source.slice(node.test.start, node.test.end).includes('contextMenuGuideStatus')
        && source.slice(node.alternate.start, node.alternate.end).includes('right-click.mp4')) {
      edits.push({ start: node.start, end: node.end, text: source.slice(node.consequent.start, node.consequent.end) });
    }
  },
});
if (edits.length !== 1) throw Error('Row context-menu tutorial boundary changed');
for (const { start, end, text } of edits) source = source.slice(0, start) + text + source.slice(end);
parse(source);
fs.writeFileSync(menuFile, source);

const draftImport = "import {serializeFingerprintDraft,restoreFingerprintDraft,refreshFingerprintDraft,invalidateFingerprintDraft} from './workbench-fingerprint-draft.js';\n";
fs.copyFileSync('Browserapp/rebuild/workbench-fingerprint-draft.mjs', path.join(root, 'workbench-fingerprint-draft.js'));

// The archived form serializer is also used at create/edit submission. Carry
// the generated seed and UA intent through that same path, not a UI-only copy.
const utilsFile = path.join(root, 'utils-BIWenCnY.js');
source = fs.readFileSync(utilsFile, 'utf8');
const serializerExport = parse(source).body.flatMap(node => node.specifiers || []).find(node => node.exported?.name === 's');
const serializer = parse(source).body.find(node => node.type === 'FunctionDeclaration' && node.id.name === serializerExport?.local.name);
if (!serializer || serializer.params[0].type !== 'Identifier') throw Error('Form serializer boundary changed');
const body = source.slice(serializer.body.start + 1, serializer.body.end - 1);
source = source.slice(0, serializer.body.start) + `{return serializeFingerprintDraft(${serializer.params[0].name},(()=>{${body}})());}` + source.slice(serializer.body.end);
fs.writeFileSync(utilsFile, draftImport + source);

const formFile = path.join(root, 'form-inputs-CnnG6T0O.js');
source = fs.readFileSync(formFile, 'utf8');
source = patchSource(source, {}, {
  A: "const rows=await refreshFingerprintDraft(e,{read:h,apply:a,find:n,request:p=>ge(p).then(result=>result.data)});return rows.length>0;",
  P: "const options={...N,...t};return refreshFingerprintDraft(e,{read:h,apply:a,find:n,count:options.count,preview:options.preview,request:p=>globalThis.electronAPI.send('util:genRandomFingerprint',p,p.count)});",
}, 'fingerprint draft delivery');
source = replaceExactly(source, 'return q.push(Z,Q,X,$),', 'return q.push(Z,Q,X,$),restoreFingerprintDraft(q,a),', 'fingerprint draft restoration');
const formEdits = [];
walk.simple(parse(source), {
  Property(node) {
    if (node.value.type !== 'ArrowFunctionExpression' && node.value.type !== 'FunctionExpression') return;
    const value = source.slice(node.value.start, node.value.end);
    if (node.key.name === 'change' && value.includes('_custom_ua') && value.includes('!0'))
      formEdits.push({ start: node.value.body.end - 1, end: node.value.body.end - 1, text: ';invalidateFingerprintDraft(q);' });
    if (node.key.name === 'iconClick' && value.includes('UA刷新成功')) {
      const expression = node.value.body.body[0]?.expression;
      if (expression?.type !== 'SequenceExpression' || expression.expressions.length !== 2) throw Error('UA refresh feedback boundary changed');
      const [refresh, notify] = expression.expressions;
      formEdits.push({ start: node.value.body.start, end: node.value.body.end,
        text: `{if(${source.slice(refresh.start, refresh.end)})${source.slice(notify.start, notify.end)};}` });
    }
  },
});
if (formEdits.length !== 2) throw Error('UA manual-edit/feedback boundaries changed');
for (const { start, end, text } of formEdits.sort((a, b) => b.start - a.start)) source = source.slice(0, start) + text + source.slice(end);
const stringValue = node => node?.type === 'TemplateLiteral' && !node.expressions.length
  ? node.quasis[0].value.cooked : node?.value;
const uaFields = [];
walk.simple(parse(source), { ObjectExpression(node) {
  if (!node.properties.some(p => p.key?.name === 'name' && stringValue(p.value) === 'userAgent')
    || !node.properties.some(p => p.key?.name === 'iconClick')) return;
  uaFields.push(node.end - 1);
} });
if (uaFields.length !== 1) throw Error('Firefox UA policy field boundary changed');
source = source.slice(0, uaFields[0]) + ',randomHelp:"Firefox 使用内核标准 UA；一键随机指纹可更新其他参数"' + source.slice(uaFields[0]);
parse(source);
fs.writeFileSync(formFile, draftImport + source);

// The UA-specific action communicates Firefox's native-format policy. The
// separate whole-fingerprint action remains available and refreshes its seed.
const controlsFile = path.join(root, 'useAsyncGate-D7VA7DLY.js');
source = fs.readFileSync(controlsFile, 'utf8');
let uaSetup;
walk.simple(parse(source), { ObjectExpression(node) {
  if (node.properties.some(p => p.key?.name === '__name' && stringValue(p.value) === 'user-agent-field'))
    uaSetup = node.properties.find(p => p.key?.name === 'setup')?.value;
} });
if (!uaSetup || uaSetup.params[0]?.type !== 'Identifier') throw Error('UA control setup boundary changed');
const uaProps = uaSetup.params[0].name, controlEdits = [];
const uaDisabled = 'findUaPolicyField('+uaProps+'.inputsGroup[0]||[],"coreType")?.value?.value==="Firefox"';
walk.simple(uaSetup.body, { CallExpression(node) {
  const props = node.arguments[1], dynamic = node.arguments.at(-1);
  if (props?.type !== 'ObjectExpression' || !props.properties.some(p => p.key?.name === 'icon'
    && stringValue(p.value) === 'base/rx_ic_shuffle')) return;
  if (dynamic?.type !== 'ArrayExpression') throw Error('UA random button dynamic properties changed');
  controlEdits.push({ start: props.end - 1, end: props.end - 1,
    text: ',disabled:('+uaDisabled+'),title:('+uaDisabled+')?'+uaProps+'.input.randomHelp:undefined' });
  controlEdits.push({ start: dynamic.end - 1, end: dynamic.end - 1, text: ',"disabled","title"' });
} });
if (controlEdits.length !== 2) throw Error('UA random button boundary changed');
for (const e of controlEdits.sort((a, b) => b.start - a.start)) source = source.slice(0, e.start) + e.text + source.slice(e.end);
source = "import {a as findUaPolicyField} from './utils-BIWenCnY.js';\n" + source;
parse(source);fs.writeFileSync(controlsFile, source);

const bootstrapFile = path.join(root, 'bootstrap.js');
source = fs.readFileSync(bootstrapFile, 'utf8');
source = replaceExactly(source, "const initialPath=location.hash.slice(1)||'/browser/list';",
  "const initialPath=await installWorkspaceNavigation(router,{url:location.href,dialogKind,request:(...args)=>globalThis.__localRequest(...args),events:callback=>globalThis.rebuild.onEvent(callback)});",
  'standalone workbench navigation');
fs.writeFileSync(bootstrapFile, "import {installWorkspaceNavigation} from './workbench-navigation.js';\n" + source);
fs.copyFileSync('Browserapp/rebuild/workbench-navigation.mjs', path.join(root, 'workbench-navigation.js'));

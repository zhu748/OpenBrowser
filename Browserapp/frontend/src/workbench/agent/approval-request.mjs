import { toolFamily, toolLabel } from './workbench-tool-event-labels.js';

const string = value => typeof value === 'string' ? value : '';
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const array = value => Array.isArray(value) ? value : [];
const primitive = value => ['string', 'boolean', 'number'].includes(typeof value) ? value : null;
const variants = new Set(['primary', 'secondary', 'danger']);
const decisions = new Set(['approve', 'reject', 'edit']);

function optionFrom(input) {
  const { id, label, value, variant, legacyDecisionType } = record(input);
  if (!string(id) || !string(label)) return;
  return { id, label, value: primitive(value), variant: variants.has(variant) ? variant : undefined,
    legacyDecisionType: decisions.has(legacyDecisionType) ? legacyDecisionType : undefined };
}

function controlFrom(input) {
  const { id, kind, label, required, options, placeholder, defaultValue } = record(input);
  if (!string(id)) return;
  const base = { id, kind, label: string(label) || undefined, required: required === true };
  if (kind === 'choice') {
    const choices = array(options).map(optionFrom).filter(Boolean);
    if (choices.length) return { ...base, options: choices };
  } else if (kind === 'text' || kind === 'textarea') {
    return { ...base, placeholder: string(placeholder) || undefined, defaultValue: string(defaultValue) || undefined };
  }
}

function subjectFrom(value, index) {
  const { id, title, name, description, input, diff } = record(value);
  if (!string(title)) return;
  return { id: string(id) || `subject-${index}`, title, name: string(name) || undefined,
    description: string(description) || undefined, input, diff: string(diff) || undefined };
}

function readQuestion(value) {
  const { header, id, question, options } = record(value);
  if (!string(header) || header.length > 12 || !string(id) || !string(question)) return;
  const choices = array(options).map(item => {
    const { label, description } = record(item);
    return string(label) && string(description) ? { label, description } : undefined;
  }).filter(Boolean);
  if (choices.length >= 2 && choices.length <= 3) return { header, id, question, options: choices };
}

function readQuestions(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 3) return;
  const questions = raw.map(readQuestion);
  if (questions.every(Boolean)) return questions;
}

const requestId = conversationId => `hitl-${conversationId}-${Date.now()}`;
function currentRequest(conversationId, runId, payload) {
  const { title, prompt, description, subjects, controls, questions } = payload;
  const clarificationQuestions = readQuestions(questions);
  const fields = array(controls).map(controlFrom).filter(Boolean);
  if (!fields.length && !clarificationQuestions?.length) return;
  return { id: string(payload.id) || string(payload.requestId) || string(payload.interruptsId) || requestId(conversationId), conversationId, runId,
    title: string(title) || $t('请求批准'), prompt: clarificationQuestions?.[0]?.question || string(prompt) || $t('RoxyAgent 需要您的输入才能继续'),
    description: string(description) || undefined, status: 'pending', subjects: array(subjects).map(subjectFrom).filter(Boolean), controls: fields,
    values: Object.fromEntries(Object.entries(record(payload.values)).map(([id, value]) => [id, primitive(value)])),
    ...(clarificationQuestions && { clarificationQuestions }), source: { kind: 'agent-hitl', payload } };
}

const basename = value => value.split(/[\\/]/).filter(Boolean).at(-1) || value;
function patchFiles(input) {
  const { operation, patch } = record(input);
  const path = string(record(operation).path);
  if (path) return [basename(path)];
  const files = [];
  const text = typeof input === 'string' ? input : string(patch);
  for (const line of text.split(/\r?\n/)) {
    const match = /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/.exec(line);
    if (match?.[1].trim()) files.push(basename(match[1].trim()));
  }
  return [...new Set(files)];
}

function describeArgument(tool, args) {
  if (tool === 'apply_patch') return patchFiles(args).join('、');
  const values = array(args).filter(string);
  if (values.length) return values.join('、');
  const input = record(args);
  const dirIds = Array.isArray(input.dirIds) ? input.dirIds.filter(string) : [input.dirId].filter(string);
  if (dirIds.length) return dirIds.join('、');
  const path = string(input.file_path) || string(input.path);
  if (path) return basename(path);
  if (string(input.cmd)) return input.cmd;
  if (string(input.url) && tool !== 'browser_navigate' && tool !== 'browser_tabs') return input.url;
  const first = Object.values(input).find(value => value != null);
  if (first === undefined || typeof first === 'string') return first ?? '';
  try { return JSON.stringify(first); }
  catch { return String(first); }
}

function verbFor(name, input) {
  const family = toolFamily(name);
  const text = toolLabel(name, 'running', input);
  const plainUse = $t('使用工具：{name}', { name: '' });
  if ((plainUse && text.startsWith(plainUse)) || text === $t('使用工具：{name}', { name: family })) return family.replaceAll('_', ' ');
  for (const prefix of [$t('正在'), '正在']) if (prefix && text.startsWith(prefix)) return text.slice(prefix.length);
  return text;
}

function actionTitle({ name, args }) {
  const verb = verbFor(name, args);
  if (verb !== verbFor(name)) return verb;
  const detail = describeArgument(toolFamily(name), args);
  return detail && !verb.includes(detail) ? `${verb} ${detail}` : verb;
}

function legacyRequest(conversationId, runId, payload, titles) {
  const id = string(payload.interruptsId) || requestId(conversationId);
  const subjects = array(payload.actionRequests).map((value, index) => {
    const { name, args, diff } = record(value);
    const action = string(name) || `action_${index + 1}`;
    return { id: `${id}-subject-${index}`, title: titles?.[index] || actionTitle({ name: action, args }), name: action,
      input: args, diff: string(diff) || undefined };
  });
  if (!subjects.length) return;
  const multiple = subjects.length > 1;
  const prompt = multiple ? $t('允许 Roxy Agent 执行 {count} 项操作吗？', { count: subjects.length }) :
    $t('允许 Roxy Agent {verb} 吗？', { verb: subjects[0].title });
  return { id, conversationId, runId, title: $t('请求批准'), prompt, description: multiple ? subjects.map(subject => subject.title).join(', ') : undefined,
    status: 'pending', subjects, controls: [{ id: 'approval', kind: 'choice', required: true, options: [
      { id: 'deny', label: $t('拒绝'), value: 'reject', variant: 'secondary', legacyDecisionType: 'reject' },
      { id: 'allow', label: $t('允许'), value: 'approve', variant: 'primary', legacyDecisionType: 'approve' },
      { id: 'full-access', label: $t('完全访问权限'), value: 'full-access', variant: 'primary', legacyDecisionType: 'approve' },
    ] }], values: { approval: null }, source: { kind: 'legacy-agent-interrupt', payload } };
}

export function readApprovalRequest(conversationId, runId, input, { actionTitles } = {}) {
  const payload = record(input);
  return currentRequest(conversationId, runId, payload) ?? legacyRequest(conversationId, runId, payload, actionTitles);
}

export function approvalDecisions(request, { values }) {
  if (request.source?.kind === 'agent-hitl' && request.source.payload?.requestKind === 'clarification') {
    return [{ type: 'answer', answer: string(values.answer) }];
  }
  const choice = request.controls.find(control => control.kind === 'choice' && control.id === 'approval');
  const legacy = choice?.options.find(option => option.value === values.approval)?.legacyDecisionType;
  const type = legacy || (values.approval === 'approve' ? 'approve' : 'reject');
  return Array.from({ length: Math.max(1, request.subjects.length) }, () => ({ type }));
}

import { An as scriptMention, Cn as parseReference, xn as skillMention, yn as windowMentions } from './utils-BIWenCnY.js';
import { mentionName, updateProfileLabels, windowNames } from './workbench-profile-token-labels.js';

const inputKinds = new Set(['input', 'textarea', 'url', 'project']);
const validSkill = path => typeof path === 'string' && /^[a-z0-9][a-z0-9._-]{0,80}$/i.test(path.trim());
const tokenPattern = () => /\[(@profile|@script):([^\]]*)\]\(([^)]*)\)|\[(input|textarea|url|project):([^\]]+)\](?:\(([^)]*)\))?|\[\$([^\]]+)\]\(([^)]*)\)/g;
const linkPattern = () => /\[((?:\\.|[^\]\\\n])*)\]\(((?:\\.|[^)\\\n])*)\)/g;
const ids = value => value.split(',').map(id => id.trim()).filter(Boolean);
const dates = new Set(['今天日期', "today's date", 'сегодняшняя дата']);

function dateVariable(value, date = new Date()) {
  const pad = number => String(number).padStart(2, '0');
  return dates.has(value.trim().toLowerCase()) ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : value;
}

function reference(value) {
  if (!value) return;
  try { return parseReference(value).value; }
  catch { return undefined; }
}

function fromMatch(match) {
  const [, marker, title, target, field, fieldTitle, fieldValue, skill, skillPath] = match;
  const kind = marker === '@profile' ? 'profile' : marker === '@script' ? 'script' : field ?? 'skill';
  const result = { index: match.index ?? 0, kind, raw: match[0], target: target ?? fieldValue ?? skillPath ?? '', title: title || fieldTitle || skill || '' };
  const ref = kind === 'script' && reference(result.target);
  if (ref) result.templateRef = ref;
  if (kind === 'skill' && validSkill(result.target)) result.skillPath = result.target.trim();
  return result;
}

export const promptNormalizedTokens = prompt => Array.from(prompt.matchAll(tokenPattern()), fromMatch);
export const hasPromptTokens = prompt => promptNormalizedTokens(prompt).some(token => token.kind === 'profile' || inputKinds.has(token.kind) || token.templateRef || token.skillPath);

export function missingInputs(prompt) {
  const tokens = promptNormalizedTokens(prompt);
  if (!tokens.some(token => token.kind === 'skill' && token.skillPath)) return [];
  return [...new Set(tokens.filter(token => inputKinds.has(token.kind) && !token.target.trim()).map(token => token.title))];
}

export function invalidTemplateReferences(prompt) {
  return [...new Set(promptNormalizedTokens(prompt).filter(token => token.kind === 'script' && !token.templateRef).map(token => token.title || token.target))];
}

export function filterSuggestions(items, query) {
  const search = query.trim().toLowerCase();
  if (!search) return items;
  return items.filter(({ title, label, description, kind, id, group, template, payload = {} }) =>
    [title, label, description, kind, id, group, template?.prompt, payload.dirIds, payload.dirId,
      payload.skillPath, payload.skillSlug, payload.templateRef].some(value => typeof value === 'string' && value.toLowerCase().includes(search)));
}

export function parseUrlInput(value) {
  const text = value?.trim() ?? '';
  const scheme = /^(https?):\/\//i.exec(text);
  return scheme ? { protocol: `${scheme[1].toLowerCase()}://`, value: text.slice(scheme[0].length) } : { protocol: 'https://', value: text.replace(/^\/\//, '') };
}

function urlValue(raw) {
  const { protocol, value } = parseUrlInput(raw);
  return value ? protocol + value : '';
}

export const suggestionProfileIds = item => ids(item.payload.dirIds || item.payload.dirId || item.id);

export function serializeToken({ kind, title, id, payload, template }) {
  if (inputKinds.has(kind)) {
    const value = payload.value?.trim() ?? '';
    return `[${kind}:${title || id}](${kind === 'url' ? urlValue(value) : value})`;
  }
  if (kind === 'profile') return windowMentions(suggestionProfileIds({ id, payload }));
  if (kind === 'template') return formatTemplatePrompt({ template });
  if (kind === 'script') {
    const ref = reference(payload.templateRef);
    return ref ? scriptMention(title, ref) : '';
  }
  return validSkill(payload.skillPath) ? skillMention(title, payload.skillPath.trim()) : '';
}

export function formatTemplatePrompt({ template }, { includeAuxiliaryPrompt = true } = {}) {
  return [template?.tokens.map(serializeToken).join(' '), includeAuxiliaryPrompt && template?.prompt.trim()].filter(Boolean).join(' ').trim();
}

function labelsIn(payload) {
  if (!payload.profileLabels) return [];
  try { const labels = JSON.parse(payload.profileLabels); return Array.isArray(labels) ? labels.filter(value => typeof value === 'string') : []; }
  catch { return []; }
}

export function buildProfileToken(items, allowEmpty) {
  if (!items.length && !allowEmpty) return;
  const windowIds = items.flatMap(suggestionProfileIds);
  const labels = items.flatMap(item => {
    const entries = labelsIn(item.payload);
    const fallback = mentionName(item.payload.displayLabel || item.label || item.title);
    return suggestionProfileIds(item).map((id, index) => entries[index] || fallback || id);
  });
  updateProfileLabels(windowIds.map((id, index) => ({ id, label: labels[index] || id })));
  const title = `Window × ${windowIds.length}`;
  const dirIds = windowIds.join(',');
  return { id: dirIds, kind: 'profile', title, label: title, description: '', iconName: 'roxy-agent/rx-ic-token-profile',
    group: 'Windows', payload: { dirIds, count: String(windowIds.length), profileLabels: JSON.stringify(labels) } };
}

const tokenTitle = token => [token?.title, token?.label, token?.payload?.name].find(value => typeof value === 'string' && value.trim())?.trim() || '';
function inputToken(title, value, kind) {
  return { id: `${kind}:${title}`, kind, title, label: title, description: '', iconName: kind === 'url' ? 'roxy-agent/rx-ic-url' : 'roxy-agent/rx-ic-prompts',
    group: 'Inputs', payload: { name: title, value: kind === 'url' ? urlValue(value) : value } };
}

function suggestedToken(token, { profiles, slashItems }) {
  const { kind, title, target, raw } = token;
  if (inputKinds.has(kind)) return suggestionTokenNode(inputToken(title, kind === 'input' ? dateVariable(target) : target, kind));
  if (kind === 'profile') {
    const records = ids(target).map(id => {
      const label = windowNames([id])[0] || id;
      return profiles.find(item => item.id === id || item.payload.dirId === id) ||
        { id, kind, title: label, label, description: '', iconName: 'country-code/US', group: 'Windows', payload: { dirId: id } };
    });
    return suggestionTokenNode(buildProfileToken(records, true));
  }
  const isSkill = kind === 'skill';
  const id = isSkill ? token.skillPath : token.templateRef;
  if (!id) return { type: 'text', text: raw };
  const field = isSkill ? 'skillPath' : 'templateRef';
  const item = slashItems.find(item => item.kind === kind && item.payload[field] === id) ||
    { id, kind, title, label: title, description: '', iconName: isSkill ? 'roxy-agent/rx-ic-skills' : 'roxy-agent/rx-ic-scripts',
      group: isSkill ? 'Skills' : 'Scripts', payload: { [field]: id } };
  return suggestionTokenNode(item);
}

export const suggestionTokenNode = item => ({ type: 'agentToken', attrs: item });
const unescapeLink = value => value.replace(/\\([\\[\]()])/g, '$1');

function inlineNodes(text, context) {
  const tokens = tokenPattern();
  const links = linkPattern();
  const nodes = [];
  let offset = 0;
  while (offset < text.length) {
    tokens.lastIndex = links.lastIndex = offset;
    const token = tokens.exec(text);
    const link = links.exec(text);
    const match = token && (!link || token.index <= link.index) ? token : link;
    if (!match) break;
    if (match.index > offset) nodes.push({ type: 'text', text: text.slice(offset, match.index) });
    if (match === token) nodes.push(suggestedToken(fromMatch(token), context));
    else {
      const [, title, value] = link;
      const label = unescapeLink(title);
      const href = unescapeLink(value);
      nodes.push(label && href ? { type: 'text', text: label, marks: [{ type: 'link', attrs: { href, markdownSource: link[0] } }] } :
        { type: 'text', text: link[0] });
    }
    offset = match.index + match[0].length;
  }
  if (offset < text.length) nodes.push({ type: 'text', text: text.slice(offset) });
  return nodes;
}

export function parsePromptDocument(text, context) {
  const tokens = promptNormalizedTokens(text);
  let offset = 0;
  let start = 0;
  const lines = [];
  for (let position = text.indexOf('\n'); position >= 0; position = text.indexOf('\n', position + 1)) {
    while (tokens[offset] && tokens[offset].index + tokens[offset].raw.length <= position) offset++;
    if (tokens[offset] && position >= tokens[offset].index) continue;
    lines.push(text.slice(start, position));
    start = position + 1;
  }
  lines.push(text.slice(start));
  return { type: 'doc', content: lines.map(line => ({ type: 'paragraph', content: inlineNodes(line, context) })) };
}

function linked(node) { return node?.type === 'text' && node.marks?.find(mark => mark.type === 'link')?.attrs; }
const linkTarget = node => linked(node)?.href?.trim() ?? '';
function serializeLeaf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'agentToken') return serializeToken(node.attrs);
  if (node.type === 'mention') return windowMentions([node.attrs.id]);
  return (node.content ?? []).map(serializeLeaf).join('');
}

function serializeParagraph(nodes) {
  const parts = [];
  let mentions = [];
  let whitespace = '';
  function flush() {
    if (mentions.length) parts.push(windowMentions(mentions));
    if (whitespace) parts.push(whitespace);
    mentions = [];
    whitespace = '';
  }
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.type === 'mention') { mentions.push(node.attrs.id); whitespace = ''; continue; }
    if (node.type === 'text' && mentions.length && /^\s+$/.test(node.text || '')) { whitespace = node.text; continue; }
    flush();
    const url = linkTarget(node);
    if (!url) { parts.push(serializeLeaf(node)); continue; }
    const fragments = [serializeLeaf(node)];
    while (linkTarget(nodes[index + 1]) === url) fragments.push(serializeLeaf(nodes[++index]));
    const label = fragments.join('');
    const next = serializeLeaf(nodes[index + 1]);
    const raw = linked(node)?.markdownSource;
    const escaped = `[${label.replace(/[\\[\]]/g, '\\$&')}](${url.replace(/[\\()]/g, '\\$&')})`;
    if (raw && label === url) parts.push(raw);
    else parts.push(!label || label === url && (!next || /^\s/u.test(next)) ? url : escaped);
  }
  flush();
  return parts.join('');
}

export function serializePromptDocument(document) {
  const lines = [];
  function visit(node) {
    if (node?.type === 'paragraph') lines.push(serializeParagraph(node.content ?? []));
    else node?.content?.forEach(visit);
  }
  visit(document);
  return lines.join('\n').trim();
}

export function replaceInputTokensByLabel(document, title, value, kind = 'input') {
  const label = title.trim();
  function update(node) {
    if (node?.type === 'agentToken' && node.attrs?.kind === kind && tokenTitle(node.attrs) === label) {
      const attrs = node.attrs;
      return { ...node, attrs: { ...attrs, title: label, label: attrs.label || label,
        payload: { ...attrs.payload, name: label, value: kind === 'url' ? urlValue(value) : value } } };
    }
    return Array.isArray(node?.content) ? { ...node, content: node.content.map(update) } : node;
  }
  return update(document);
}

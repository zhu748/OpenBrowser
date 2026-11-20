const homeCache = 'agent-console:home-official-templates:v1';
const unread = 'agent-console:unread-template-keys';
const drawerUnread = 'agent-console:unread-template-drawer-keys';

function storage(value) {
  if (value !== undefined) return value ?? undefined;
  try { return globalThis.window?.localStorage; }
  catch { return undefined; }
}

function read(key, from) {
  try { return JSON.parse(storage(from)?.getItem(key) ?? 'null'); }
  catch { return null; }
}

function save(key, value, to) {
  try { storage(to)?.setItem(key, JSON.stringify(value)); }
  catch { /* Storage can be unavailable in a private window. */ }
}

const record = value => value && typeof value === 'object' && !Array.isArray(value);
const finite = value => Number.isFinite(value);
const nullableText = value => typeof value === 'string' || value === null;
const isCategory = row => record(row) && finite(row.id) && typeof row.slug === 'string' && 'name' in row && finite(row.sortOrder) && finite(row.enabled);
function isLabel(row) {
  return isCategory(row) && finite(row.categoryId) && isCategory(row.category) && (typeof row.color === 'string' || row.color === null);
}

function isTemplate(row) {
  return record(row) && finite(row.id) && typeof row.slug === 'string' && typeof row.templateType === 'string' &&
    'name' in row && 'description' in row && (row.iconInfo === null || record(row.iconInfo)) && finite(row.sortOrder) &&
    typeof row.isHot === 'boolean' && record(row.metadata) && Array.isArray(row.labels) && row.labels.every(isLabel) &&
    Array.isArray(row.labelIds) && row.labelIds.every(finite) && nullableText(row.createdAt) && nullableText(row.updatedAt);
}

export function readHomeTemplates(from) {
  const value = read(homeCache, from);
  if (value?.version === 1 && finite(value.updatedAt) && value.updatedAt >= 0 && Array.isArray(value.templates) && value.templates.every(isTemplate)) {
    return { templates: value.templates, updatedAt: value.updatedAt };
  }
}

export function storeHomeTemplates(templates, to, updatedAt = Date.now()) {
  save(homeCache, { version: 1, templates: templates.slice(0, 8), updatedAt }, to);
}

function keyFor(template) {
  const workspace = typeof template.workspaceId === 'string' ? template.workspaceId.trim() : '';
  if (workspace && Number.isSafeInteger(template.id) && template.id > 0) return `${workspace}:${template.id}`;
}

function keys(key, from) {
  const value = read(key, from);
  return new Set(Array.isArray(value) ? value.filter(value => typeof value === 'string' && value) : []);
}

export const loadTemplateUnread = from => keys(unread, from);
export const loadUserTemplateReadState = from => keys(drawerUnread, from);
export function userTemplateIsUnread(state, template) {
  const key = keyFor(template);
  return Boolean(key && state.has(key));
}

function mark(key, template, to, add) {
  const state = keys(key, to);
  const id = keyFor(template);
  if (id) {
    if (add) state.add(id);
    else state.delete(id);
    save(key, [...state].slice(-500), to);
  }
  return state;
}

export function markTemplateUnread(template, to) {
  mark(drawerUnread, template, to, true);
  return mark(unread, template, to, true);
}

export function markTemplateRead(template, to) {
  mark(drawerUnread, template, to, false);
  return mark(unread, template, to, false);
}

export const markUserTemplateRead = (template, to) => mark(drawerUnread, template, to, false);

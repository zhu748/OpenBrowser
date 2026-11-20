const record = value => value && typeof value === 'object' && !Array.isArray(value);
const trimmed = value => typeof value === 'string' ? value.trim() : '';
const points = value => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function readTheme(raw) {
  if (!record(raw)) return;
  const light = trimmed(raw.light);
  const dark = trimmed(raw.dark);
  if (light || dark) return { ...(light && { light }), ...(dark && { dark }) };
}

function readIconInfo(raw) {
  if (!record(raw)) return null;
  const icon = readTheme(raw.icon);
  const primaryColor = readTheme(raw.primaryColor);
  const bgColor = readTheme(raw.bgColor);
  return icon || primaryColor || bgColor ? { ...(icon && { icon }), ...(primaryColor && { primaryColor }), ...(bgColor && { bgColor }) } : null;
}

export function themedValue(value, dark) {
  return (dark ? value?.dark || value?.light : value?.light || value?.dark) || '';
}

export function isImageSource(url) {
  return /^(?:(?:https?:)?\/\/|(?:data|blob|file):|\.{0,2}\/)/.test(url) || /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(url);
}

function text(value) {
  if (Array.isArray(value)) return value.filter(trimmed).join('\n\n');
  return trimmed(value) ? value : '';
}

export function localizedText(value, locale) {
  const plain = text(value);
  if (plain || !record(value)) return plain;
  const language = locale?.split('-')[0]?.toLowerCase();
  const languages = language === 'zh' ? ['zh', 'cn'] : [language, ...(language === 'en' ? ['us'] : []), 'en', 'zh', 'cn', 'ru'];
  const candidates = [...languages.filter(Boolean).map(code => value[code]), ...Object.values(value)];
  return candidates.map(text).find(Boolean) || '';
}

export function readTemplatePrompt(template, locale) {
  const value = template?.templateType === 'skill' ? template.metadata?.usageExample : template?.metadata?.prompt;
  return localizedText(value, locale);
}

export function expectResult(result, fallback) {
  if (!record(result) || result.code !== 0) throw Error(typeof result?.message === 'string' ? result.message : fallback);
}

export function unwrapResult(result, fallback) {
  expectResult(result, fallback);
  if (!record(result.data)) throw Error(typeof result.message === 'string' ? result.message : fallback);
  return result.data;
}

export function readTemplatePage(result, fallback) {
  const page = unwrapResult(result, fallback);
  if (!Array.isArray(page.items) || [page.total, page.offset, page.limit].some(value => typeof value !== 'number')) throw Error(fallback);
  return page;
}

export function parseOfficialTemplates(result, fallback) {
  expectResult(result, fallback);
  if (!Array.isArray(result.data)) throw Error(fallback);
  return result.data;
}

export function unwrapUpload(result, fallback) {
  const data = unwrapResult(result, fallback);
  if (['fileId', 'ossUrl', 'sha512', 'filename'].some(key => typeof data[key] !== 'string')) throw TypeError(fallback);
  return data;
}

export function queryString(options) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, String(item));
  }
  return query.toString();
}

const kinds = new Set(['prompt', 'script', 'skill']);
export const templateKind = type => kinds.has(type) ? type : undefined;
export const normalizeSlug = value => trimmed(value) || undefined;
export const reservedSlug = value => normalizeSlug(value)?.toLowerCase().startsWith('official-') ?? false;

export function officialTemplateCard(template, locale) {
  const { id, slug, name, description, templateType, iconInfo, labels, isHot, approxPoints, metadata } = template;
  return { id, slug, title: localizedText(name, locale) || slug, description: localizedText(description, locale),
    kind: templateKind(templateType) ?? templateKind(templateType?.replace(/s$/, '')) ?? 'prompt', iconInfo: readIconInfo(iconInfo),
    labels: (labels ?? []).map(label => ({ id: label.id, label: localizedText(label.name, locale) || label.slug })),
    isHot, approxPoints: points(approxPoints), version: typeof metadata?.version === 'string' ? metadata.version : undefined, official: true };
}

export function parseTemplate(template) {
  const { id, workspaceId, templateType, name, description, source, officialTemplateId, isTopped, toppedAt } = template;
  const kind = templateKind(templateType);
  if (!kind) return;
  const metadata = record(template.metadata) ? template.metadata : {};
  return { id, workspaceId, kind, name, description: trimmed(description), source, officialTemplateId,
    iconInfo: readIconInfo(metadata.iconInfo), metadata, isTopped: Boolean(isTopped), toppedAt: toppedAt ?? null,
    approxPoints: points(template.approxPoints) ?? points(metadata.approxPoints) };
}

export function installedTemplates(templates) {
  const result = new Map();
  for (const template of templates) {
    const id = template.officialTemplateId;
    if (typeof id === 'number' && !result.has(id)) result.set(id, template);
  }
  return result;
}

export const patchTemplate = ({ name, description, metadata }) => ({ name, description: description || null, metadata });
export function createTemplate(values) {
  const kind = values.officialTemplateId === undefined ? { template_type: values.templateType } : { official_template_id: values.officialTemplateId };
  return { ...kind, ...patchTemplate(values) };
}

const time = value => points(Date.parse(value)) ?? -Infinity;
export function sortTemplates(templates) {
  return [...templates].sort((a, b) => Number(b.isTopped) - Number(a.isTopped) ||
    (a.isTopped && b.isTopped ? time(b.toppedAt) - time(a.toppedAt) : 0));
}

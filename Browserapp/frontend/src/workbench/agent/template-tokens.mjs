const templateRef = /^(official|user):([1-9]\d*)$/;
class TemplateReferenceError extends Error {
  code = 'invalid_template_ref';
  constructor() {
    super('Invalid template reference. Expected official:<positive id> or user:<positive id>.');
    this.name = 'TemplateRefParseError';
  }
}
function formatReference(namespace, id) {
  if (!['official', 'user'].includes(namespace) || !Number.isSafeInteger(id) || id <= 0) throw new TemplateReferenceError();
  return `${namespace}:${id}`;
}
function parseReference(value) {
  const match = typeof value === 'string' && templateRef.exec(value);
  if (!match) throw new TemplateReferenceError();
  const [, namespace, rawId] = match;
  const id = Number(rawId);
  return { namespace, id, value: formatReference(namespace, id) };
}
function validReference(value) {
  try { parseReference(value); return true; }
  catch { return false; }
}
function normalizeReference(reference) {
  return parseReference(typeof reference === 'string' ? reference : formatReference(reference.namespace, reference.id));
}
function scriptMention(name, reference) {
  const { value } = normalizeReference(reference);
  return `[@script:${name}](${value})`;
}
const variableMention = (label, value) => `[$${label}](${value.trim()})`;
const windowMentions = ids => `[@profile:${ids.length}](${ids.join(',')})`;
function selectedWindowIds(text) {
  const ids = new Set();
  for (const match of text.matchAll(/\[@profile:[^\]\r\n]*\]\(([^)\r\n]*)\)/g)) {
    for (const id of match[1].split(',').map(value => value.trim()).filter(Boolean)) ids.add(id);
  }
  return [...ids];
}
function validateTemplate(text) {
  const missing = new Set();
  for (const match of text.matchAll(/\[(?:input|textarea|url|project):([^\]]+)\](?:\(([^)]*)\))?/g)) {
    if (!match[2]?.trim()) missing.add(match[1]);
  }
  return { hasProfileSelection: text.includes('[@profile:'), missingInputLabels: [...missing] };
}
export { scriptMention as An, parseReference as Cn, validReference as On, validateTemplate as Sn,
  normalizeReference as jn, selectedWindowIds as kn, formatReference as wn, variableMention as xn, windowMentions as yn };

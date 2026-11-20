import { toRaw } from './workbench-vue.js';
import { AjvDraft7, Ajv2019, Ajv2020, addFormats, deriveUiSchema, schemaDefaults } from './workbench-jsonforms.js';

export class ParameterError extends Error {}

export const isParameterDraft = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const schemaMaps = ['$defs', 'definitions', 'dependentSchemas', 'patternProperties', 'properties'];
const schemaChildren = ['additionalItems', 'additionalProperties', 'allOf', 'anyOf', 'contains', 'contentSchema', 'dependencies',
  'else', 'if', 'items', 'not', 'oneOf', 'prefixItems', 'propertyNames', 'then', 'unevaluatedItems', 'unevaluatedProperties'];

export function readSchema(raw) {
  if (raw == null || raw === '') return null;
  let schema = raw;
  if (typeof raw === 'string') {
    try { schema = JSON.parse(raw); }
    catch { throw new ParameterError('脚本入参 Schema 必须是合法的 JSON'); }
  }
  if (!isParameterDraft(schema)) throw new ParameterError('脚本入参 Schema 必须是 JSON 对象');
  const { type } = schema;
  if (typeof type === 'string' && type !== 'object') throw new ParameterError("脚本入参 Schema 的顶层 type 必须是 'object'");
  if (Array.isArray(type) && !type.includes('object')) throw new ParameterError("脚本入参 Schema 的顶层 type 必须包含 'object'");
  return schema;
}

const joinedText = list => list.filter(item => typeof item === 'string').join('\n');
export function schemaText(value, locale = 'en') {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return joinedText(value);
  if (!isParameterDraft(value)) return '';
  const language = (locale || 'en').toLowerCase();
  const order = /^(zh|cn)/.test(language) ? ['zh', 'cn'] : language.startsWith('ru') ? ['ru'] : ['en', 'us'];
  for (const key of new Set([...order, 'en', 'us', 'zh', 'cn', 'ru'])) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    if (Array.isArray(candidate) && candidate.some(item => typeof item === 'string')) return joinedText(candidate);
  }
  return '';
}

function copySchema(raw, update) {
  const result = structuredClone(raw);
  function visit(schema) {
    if (Array.isArray(schema)) { schema.forEach(visit); return; }
    if (!isParameterDraft(schema)) return;
    update(schema);
    for (const key of schemaMaps) if (isParameterDraft(schema[key])) Object.values(schema[key]).forEach(visit);
    for (const key of schemaChildren) visit(schema[key]);
  }
  visit(result);
  return result;
}

export function localizeSchema(raw, locale) {
  return copySchema(raw, schema => {
    for (const key of ['title', 'description']) {
      const text = schemaText(schema[key], locale);
      if (text) schema[key] = text;
    }
  });
}

function removeDebug(raw, hide) {
  return copySchema(raw, schema => {
    if (Array.isArray(schema.required)) schema.required = schema.required.filter(key => key !== 'debug');
    if (!isParameterDraft(schema.properties) || !Object.hasOwn(schema.properties, 'debug')) return;
    if (hide) delete schema.properties.debug;
    else schema.properties.debug = {};
  });
}

export const normalizeSchema = raw => removeDebug(raw, false);
export const createUiSchema = raw => deriveUiSchema(removeDebug(raw, true));

function cloneDraft(value) {
  const raw = toRaw(value);
  if (Array.isArray(raw)) return raw.map(cloneDraft);
  if (isParameterDraft(raw)) return Object.fromEntries(Object.entries(raw).map(([key, child]) => [key, cloneDraft(child)]));
  return raw;
}

const missing = value => value == null || typeof value === 'string' && !value.trim() || Array.isArray(value) && value.length === 0;
function mergeDefaults(defaults, draft) {
  if (!isParameterDraft(defaults) || !isParameterDraft(draft)) return cloneDraft(missing(draft) ? defaults : draft);
  const merged = new Map(Object.entries(cloneDraft(draft)));
  for (const [key, value] of Object.entries(defaults)) merged.set(key, mergeDefaults(value, merged.get(key)));
  return Object.fromEntries(merged);
}

function defaultsIn(schema, root) {
  const ownDefault = schema.default !== undefined;
  const defaults = cloneDraft(schemaDefaults(schema, root));
  if (ownDefault && !isParameterDraft(defaults)) return { found: true, value: defaults };
  if (!isParameterDraft(schema.properties)) return ownDefault ? { found: true, value: defaults } : { found: false };
  const entries = new Map(isParameterDraft(defaults) ? Object.entries(defaults) : []);
  for (const [key, child] of Object.entries(schema.properties)) {
    if (!isParameterDraft(child)) continue;
    const nested = defaultsIn(child, root);
    if (nested.found) entries.set(key, mergeDefaults(nested.value, entries.get(key)));
  }
  return ownDefault || entries.size ? { found: true, value: Object.fromEntries(entries) } : { found: false };
}

export function defaultParameters(schema) {
  const result = defaultsIn(schema, schema);
  return isParameterDraft(result.value) ? result.value : {};
}

export const createParameterDraft = (schema, draft = {}) => mergeDefaults(defaultParameters(schema), draft);

export function createValidator(schema) {
  const dialect = typeof schema.$schema === 'string' ? schema.$schema : '';
  const Ajv = dialect.includes('2020-12') ? Ajv2020 : dialect.includes('2019-09') ? Ajv2019 : AjvDraft7;
  const validator = new Ajv({ allErrors: true, verbose: true, strict: false, addUsedSchema: false });
  addFormats(validator);
  return validator;
}

export function validateParameters(schema, draft, locale) {
  const localized = localizeSchema(schema, locale);
  const validate = createValidator(localized).compile(localized);
  return validate(draft) ? [] : [...(validate.errors ?? [])];
}

export function serializeParameters(draft, errors = []) {
  const error = errors[0];
  if (error) {
    const property = error.keyword === 'required' ? String(error.params.missingProperty ?? '') : '';
    const field = [error.instancePath.replace(/^\//, '').replaceAll('/', '.'), property].filter(Boolean).join('.') || '$';
    throw new ParameterError(`${field} ${error.message || '校验失败'}`);
  }
  if (!isParameterDraft(draft)) throw new ParameterError('脚本参数必须是 JSON 对象');
  return cloneDraft(draft);
}

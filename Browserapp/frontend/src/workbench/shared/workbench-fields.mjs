import { serializeFingerprintDraft } from './workbench-fingerprint-draft.js';

function findField(fields, name) {
  for (const field of fields) {
    if (field.name === name) return field;
    if (Array.isArray(field.items)) {
      const nested = findField(field.items, name);
      if (nested) return nested;
    }
  }
}
function selectFields(fields, names) {
  const requested = new Set(names);
  const found = new Map();
  function visit(items) {
    for (const field of items ?? []) {
      const children = Array.isArray(field) ? field : field.items;
      if (Array.isArray(children)) visit(children);
      else if (requested.has(field.name) && !found.has(field.name)) found.set(field.name, field);
    }
  }
  visit(fields);
  return names.map(name => found.get(name)).filter(Boolean);
}
const missing = value => value === null || value === undefined || value === '';
function validateField(field) {
  if (field.required && missing(field.value)) {
    field.invalid = true;
    field.errorMsg = $t('"{name}" 是必填项', { name: field.label || field.placeholder });
    throw Error(field.errorMsg);
  }
  if (field.invalid || (typeof field.validator === 'function' && !field.validator(field))) {
    field.invalid = true;
    throw Error(field.errorMsg || `Input '${field.name}' is invalid`);
  }
}
function readFields(fields, defaults = {}, options = {}) {
  const { keyName = 'name', valueName = 'value', validate = true } = options;
  const data = { ...defaults };
  const names = new Set();
  for (const field of fields ?? []) {
    if (field.visible === false || field.separator) continue;
    if (names.has(field.name)) throw Error(`Duplicate input.name '${field.name}' found in inputs`);
    if (validate) validateField(field);
    const key = field[keyName];
    if (field.items) Object.assign(data, readFields(field.items, {}, options));
    else if (key?.trim()) {
      const value = field[valueName];
      data[key] = typeof field.formatValue === 'function' ? field.formatValue(field, fields, data) : value?.value ?? value ?? '';
      names.add(key);
    }
  }
  return data;
}
function fingerprintFields(groups, defaults = {}, keys) {
  const data = Array.isArray(groups) ? groups.reduce((values, items) => Object.assign(values, readFields(items, values, keys)), { ...defaults }) : [];
  return serializeFingerprintDraft(groups, data);
}
function updateFields(fields, names, property, value) {
  const keys = new Set([].concat(names));
  function visit(items) {
    for (const field of items) {
      if (keys.has(field.name)) field[property] = value;
      if (Array.isArray(field.items)) visit(field.items);
    }
  }
  visit(fields);
}
const changeVisibility = (fields, names, value) => updateFields(fields, names, 'visible', value);
const changeValue = (fields, names, value) => updateFields(fields, names, 'value', value);
function applyValues(fields, values) {
  for (const field of fields) {
    if (Array.isArray(field)) { applyValues(field, values); continue; }
    if (field.name && !missing(values[field.name])) {
      const value = values[field.name];
      if (field.type === 'select' && !field.optionValue) {
        const option = field.options.find(option => option.value === value);
        if (option) { field.value = option; field.invalid = false; }
      } else { field.value = value; field.invalid = false; }
    }
    if (Array.isArray(field.items)) applyValues(field.items, values);
  }
}
function filterValues(values, keep = Boolean) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => keep(value)));
}
const matchesOrDefault = (value, expected, fallback) => value === undefined ? fallback : value === expected;
export { findField as a, selectFields as i, readFields as o, fingerprintFields as s, applyValues as d, updateFields as l,
  changeVisibility as f, changeValue as u, filterValues as r, matchesOrDefault as c };

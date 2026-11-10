'use strict';

// Variable copying, interpolation and result snapshots have no browser/store dependencies.
// Detach nested variables for concurrent tasks, including cyclic inputs.
function cloneVariableValue(value) {
  if (value === null || typeof value !== 'object') return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) {
    try { return structuredClone(value); } catch (_) {
      // A function in a cyclic input also makes structuredClone fail. Preserve
      // callable leaves, while still detaching every mutable nested object.
      const seen = new Map();
      const copy = (item) => {
        if (item === null || typeof item !== 'object') return item;
        if (seen.has(item)) return seen.get(item);
        const result = Array.isArray(item) ? [] : {};
        seen.set(item, result);
        for (const [key, child] of Object.entries(item)) {
          Object.defineProperty(result, key, { value: copy(child), enumerable: true, writable: true, configurable: true });
        }
        return result;
      };
      return copy(value);
    }
  }
}

// Result payloads carry the extracted values: strings are capped at
// RPA_RESULT_CHAR_LIMIT per value; structure is kept whole. Task logs keep the
// original full-content behavior — store growth is bounded by task-history
// pruning and the store size budget, not by log trimming.
const PARSED_RESULT_CHAR_LIMIT = Number(process.env.OPENBROWSER_RPA_RESULT_CHAR_LIMIT);

const RPA_RESULT_CHAR_LIMIT = Number.isFinite(PARSED_RESULT_CHAR_LIMIT) && PARSED_RESULT_CHAR_LIMIT > 0
  ? Math.floor(PARSED_RESULT_CHAR_LIMIT)
  : 20000;

/** Per-string cap for result payloads; structure (arrays/objects) is kept, only string length is capped. */
function capResultString(text) {
  return text.length > RPA_RESULT_CHAR_LIMIT
    ? text.slice(0, RPA_RESULT_CHAR_LIMIT) + `…[truncated ${text.length - RPA_RESULT_CHAR_LIMIT} chars]`
    : text;
}

/**
 * Cycle-safe copy of final task variables for process_result and the API
 * response. Strings are capped per RPA_RESULT_CHAR_LIMIT; everything else is
 * kept whole.
 */
function snapshotVariables(variables) {
  const clone = (value, seen) => {
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'bigint') return String(value);
    if (typeof value === 'string') return capResultString(value);
    if (value == null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    try {
      if (Array.isArray(value)) return value.map((item) => clone(item, seen));
      const out = {};
      for (const [key, item] of Object.entries(value)) {
        Object.defineProperty(out, key, { value: clone(item, seen), enumerable: true, writable: true, configurable: true });
      }
      return out;
    } finally {
      seen.delete(value);
    }
  };
  const copied = {};
  for (const [key, value] of Object.entries(variables || {})) {
    Object.defineProperty(copied, key, { value: clone(value, new Set()), enumerable: true, writable: true, configurable: true });
  }
  return copied;
}

function interpolate(value, variables = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
    const result = variables[String(key).trim()];
    return result == null ? '' : String(result);
  });
}

function getVariableValue(value, variables = {}) {
  if (Array.isArray(value)) return value.map((item) => getVariableValue(item, variables));
  if (typeof value !== 'string') return value;
  const match = value.match(/^\$\{([^}]+)\}$/);
  return match ? variables[match[1].trim()] : interpolate(value, variables);
}

function resolveConditionValue(input, variables = {}) {
  if (Array.isArray(input)) {
    return input.map((item) => resolveConditionValue(item, variables));
  }
  if (input == null) return input;
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  const match = trimmed.match(/^\$\{([^}]+)\}$/);
  if (match) {
    return variables[match[1].trim()];
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;

  if (Object.prototype.hasOwnProperty.call(variables, trimmed)) {
    return variables[trimmed];
  }
  if (trimmed.includes('${')) {
    return interpolate(trimmed, variables);
  }
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return undefined;
  }
  return input;
}

module.exports = { cloneVariableValue, capResultString, snapshotVariables, interpolate, getVariableValue, resolveConditionValue };

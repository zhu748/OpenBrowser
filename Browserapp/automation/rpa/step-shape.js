'use strict';

/** Marketplace exports may wrap executor parameters in params.config. */
function resolveStepParams(step) {
  const raw = step.params && typeof step.params === 'object' ? step.params : step;
  return raw.config && typeof raw.config === 'object' ? raw.config : raw;
}

/** Match execution precedence; recovery branches use the original params bag. */
function resolveStepChildren(step, key) {
  if (Array.isArray(step[key])) return step[key];
  const params = key === 'errorChildren' ? step.params : resolveStepParams(step);
  return Array.isArray(params?.[key]) ? params[key] : null;
}

/** Boolean-like workflow flags arrive as true / 1 / '1' / 'true' depending on
 *  the marketplace export; one spelling policy for every step handler. */
function truthyFlag(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

module.exports = { resolveStepParams, resolveStepChildren, truthyFlag };

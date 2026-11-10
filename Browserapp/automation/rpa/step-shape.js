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

module.exports = { resolveStepParams, resolveStepChildren };

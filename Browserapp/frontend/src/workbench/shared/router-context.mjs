import { inject } from './workbench-vue.js';
import { g as tryOnScopeDispose } from './dist-ufdnm93_.js';

const isAbsolutePath = path => path.startsWith('/');
const isComponent = value => value !== null && (typeof value === 'object' || typeof value === 'function' &&
  ('displayName' in value || 'props' in value || '__vccOpts' in value));
const isModule = value => value.__esModule || value[Symbol.toStringTag] === 'Module' || value.default && isComponent(value.default);
const assign = Object.assign;
const isArray = Array.isArray;
const noop = () => {};
function mapParams(mapper, params) {
  const mapped = {};
  for (const key in params) mapped[key] = isArray(params[key]) ? params[key].map(mapper) : mapper(params[key]);
  return mapped;
}
function fromDefaults(defaults, source) {
  const selected = {};
  for (const key in defaults) selected[key] = key in source ? source[key] : defaults[key];
  return selected;
}
const navigationFailure = Symbol();
function failNavigation(type, details) {
  return assign(Error(), { type, [navigationFailure]: true }, details);
}
function isNavigationFailure(error, types) {
  return error instanceof Error && navigationFailure in error && (types == null || Boolean(error.type & types));
}

const matchedRouteKey = Symbol();
const viewDepthKey = Symbol();
const routerKey = Symbol();
const routeLocationKey = Symbol();
const routerViewLocationKey = Symbol();
const useRouter = () => inject(routerKey);
const useRoute = () => inject(routeLocationKey);

const listeners = new Map();
const events = {
  all: listeners,
  on(type, handler) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(handler);
  },
  off(type, handler) {
    const handlers = listeners.get(type);
    if (!handlers) return;
    if (!handler) listeners.set(type, []);
    else if (handlers.includes(handler)) handlers.splice(handlers.indexOf(handler), 1);
  },
  emit(type, payload) {
    for (const handler of listeners.get(type)?.slice() ?? []) handler(payload);
    for (const handler of listeners.get('*')?.slice() ?? []) handler(type, payload);
  },
};
function onWorkbenchEvent(type, handler) {
  events.on(type, handler);
  tryOnScopeDispose(() => events.off(type, handler));
}

export { routerKey as _, mapParams as a, useRouter as b, isAbsolutePath as c, isNavigationFailure as d, isComponent as f,
  routeLocationKey as g, noop as h, onWorkbenchEvent as i, isArray as l, fromDefaults as m, assign as o, matchedRouteKey as p,
  events as r, failNavigation as s, isModule as u, routerViewLocationKey as v, viewDepthKey as x, useRoute as y };

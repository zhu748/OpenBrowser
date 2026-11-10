'use strict';

const assert = require('node:assert/strict');
const { allowedMethodsForPath, resolveApiRoute, validateApiRoutes } = require('../api/route-registry');
const { LocalApiServer } = require('../local-api-server');

validateApiRoutes(LocalApiServer.prototype);
assert.throws(() => validateApiRoutes({}), /handler missing/i);
for (const alias of ['/api/v1/user/list', '/api/v2/browser-profile/list', '/api/profiles']) {
  assert.deepEqual(allowedMethodsForPath(alias), ['GET']);
  assert.equal(resolveApiRoute('GET', alias), 'routeProfileList');
  assert.equal(resolveApiRoute('POST', alias), null);
}
assert.deepEqual(allowedMethodsForPath('/api/rpa/templates/example/install'), ['POST']);
assert.equal(resolveApiRoute('POST', '/api/rpa/templates/example/install'), 'routeRpaTemplateInstall');
assert.equal(resolveApiRoute('DELETE', '/api/rpa/templates/example'), 'routeRpaTemplateDelete');
assert.deepEqual(allowedMethodsForPath('/api/rpa/tasks/delete'), ['POST'], 'exact method gate takes precedence over prefixes');
assert.equal(resolveApiRoute('POST', '/api/rpa/tasks/delete'), 'routeRpaTasksDelete');
assert.equal(allowedMethodsForPath('/unknown'), null);
assert.equal(resolveApiRoute('GET', '__proto__'), null);
assert.equal(resolveApiRoute('toString', '/api/profiles'), null);
assert.throws(() => allowedMethodsForPath('/api/profiles').push('DELETE'), TypeError, 'callers cannot widen the HTTP gate');
console.log('API_ROUTE_REGISTRY_SELFTEST OK (aliases, verbs, prefix precedence, inherited keys, immutable method gates)');

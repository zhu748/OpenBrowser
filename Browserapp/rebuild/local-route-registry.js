"use strict";

// Routing and execution policy share one definition. Only LocalService owns
// the mutation queue and rollback; handlers never create a second queue.
/** @typedef {{name: string, handle: Function, execution: 'read'|'serial'|'parallel',
 * requiresLocalData: boolean}} LocalRoute */
function createLocalRouteRegistry(groups) {
  const exact = new Map();
  const prefixes = [];
  const names = new Set();
  for (const group of groups) {
    for (const [name, handle, execution, requiresLocalData = true] of group) {
      if (typeof name !== "string" || !name.includes(":"))
        throw Error("Invalid local route name: " + name);
      if (names.has(name)) throw Error("Duplicate local route: " + name);
      if (typeof handle !== "function")
        throw Error("Missing local handler: " + name);
      if (!["read", "serial", "parallel"].includes(execution))
        throw Error("Missing local execution policy: " + name);
      if (typeof requiresLocalData !== "boolean" || (!requiresLocalData && execution !== "parallel"))
        throw Error("Invalid local data policy: " + name);
      names.add(name);
      const route = Object.freeze({ name, handle, execution, requiresLocalData });
      if (name.endsWith(":")) prefixes.push(route);
      else exact.set(name, route);
    }
  }
  // A more specific namespace must not inherit a broader namespace's handler
  // or execution policy merely because it was declared later.
  const lookupPrefixes = [...prefixes].sort((a, b) => b.name.length - a.name.length);
  return Object.freeze({
    resolve: (method) =>
      exact.get(method) ||
      lookupPrefixes.find((route) => method.startsWith(route.name)) ||
      unavailable,
    entries: Object.freeze([...exact.values(), ...prefixes]),
  });
}

const unavailable = Object.freeze({
  execution: "serial",
  requiresLocalData: true,
  async handle(_service, _payload, method) {
    throw Object.assign(Error("未实现本地接口: " + method), {
      code: "LOCAL_CHANNEL_UNIMPLEMENTED",
    });
  },
});

const registry = createLocalRouteRegistry([
  require("./routes/profiles"),
  require("./routes/collections"),
  require("./routes/preferences"),
  require("./routes/host"),
  require("./routes/proxies"),
  require("./routes/transfer"),
  require("./routes/delegates"),
]);

module.exports = {
  createLocalRouteRegistry,
  resolveLocalRoute: registry.resolve,
  localRoutes: registry.entries,
};

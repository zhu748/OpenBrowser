'use strict';

/** Validate every contribution before installing methods on the engine. */
function installEngineModules(prototype, modules) {
  const pending = new Map();
  const owners = Object.create(null);
  for (const [owner, contribution] of modules) {
    for (const key of Reflect.ownKeys(contribution)) {
      const descriptor = Object.getOwnPropertyDescriptor(contribution, key);
      if (!descriptor.enumerable) continue;
      if (!Object.hasOwn(descriptor, 'value')) throw new Error(`Engine module ${owner} exports an accessor: ${String(key)}`);
      if (key in prototype || pending.has(key)) {
        throw new Error(`Engine member collision: ${String(key)} (${owners[key] || 'BrowserEngine'} / ${owner})`);
      }
      pending.set(key, descriptor.value);
      owners[key] = owner;
    }
  }
  if (!Object.isExtensible(prototype)) throw new Error('Engine prototype is not extensible');
  for (const [key, value] of pending) {
    Object.defineProperty(prototype, key, { value, writable: true, configurable: true, enumerable: true });
  }
  return Object.freeze(owners);
}

module.exports = { installEngineModules };

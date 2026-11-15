'use strict';

// Runs unchanged in documents and workers. A native WebIDL receiver check
// must not consult the page-writable constructor property of a real object.
async function receiverShadowSnapshot() {
  const result = {};
  const objects = [
    ['navigator', navigator, ['userAgent', 'platform', 'hardwareConcurrency', 'languages']],
    ['screen', globalThis.screen, ['width', 'height']],
    ['uaData', navigator.userAgentData, ['brands', 'mobile', 'platform']],
  ];
  for (const [name, receiver, keys] of objects) {
    if (!receiver) continue;
    const read = async () => {
      const values = {};
      for (const key of keys) {
        let proto = Object.getPrototypeOf(receiver), getter;
        while (proto && !getter) {
          getter = Object.getOwnPropertyDescriptor(proto, key)?.get;
          proto = Object.getPrototypeOf(proto);
        }
        if (getter) values[key] = getter.call(receiver);
      }
      if (name === 'uaData') {
        values.json = receiver.toJSON();
        values.hints = await receiver.getHighEntropyValues(['architecture', 'uaFullVersion']);
      }
      return values;
    };
    const before = await read();
    const descriptor = Object.getOwnPropertyDescriptor(receiver, 'constructor');
    const nativeApply = Reflect.apply;
    let reads = 0, applyReads = 0;
    try {
      Reflect.apply = () => { applyReads++;throw Error('Mutable Reflect.apply must not be used'); };
      Object.defineProperty(receiver, 'constructor', { configurable: true,
        get() { reads++;throw Error('Receiver constructor must not be read'); } });
      result[name] = { before, after: await read(), reads, applyReads };
    } finally {
      Reflect.apply = nativeApply;
      if (descriptor) Object.defineProperty(receiver, 'constructor', descriptor);
      else delete receiver.constructor;
    }
  }
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  if (descriptor?.configurable) {
    const genuine = navigator, proto = Object.getPrototypeOf(genuine);
    const fake = Object.create(proto);
    let reads = 0, errorName;
    Object.defineProperty(fake, 'constructor', { get() { reads++;throw Error('Forged constructor read'); } });
    try {
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: fake });
      const getter = Object.getOwnPropertyDescriptor(proto, 'hardwareConcurrency').get;
      try { getter.call(fake); } catch (error) { errorName = error.name; }
    } finally { Object.defineProperty(globalThis, 'navigator', descriptor); }
    result.navigator.forgery = { errorName, reads };
  }
  return result;
}

module.exports = { receiverShadowSnapshot };

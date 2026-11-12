'use strict';

const fs = require('node:fs');
const path = require('node:path');
const acornSource = fs.readFileSync(path.join(__dirname, '../../vendor/acorn-runtime.js'), 'utf8');

// Serialized into each realm. No flags or source-passing hooks are installed
// on WorkerGlobalScope. The same-origin registry uses the private bridge.
function installWorkerConstructors(workerCore, nativeLike, bridgeToken) {
  const realm = globalThis;
  const NativeWorker = realm.Worker, NativeSharedWorker = realm.SharedWorker;
  const NativeBlob = realm.Blob, NativeXHR = realm.XMLHttpRequest;
  const nativeURL = realm.URL;
  const createUrl = nativeURL?.createObjectURL, revokeUrl = nativeURL?.revokeObjectURL;
  const nativeAdd = realm.EventTarget?.prototype?.addEventListener;
  const nativeRemove = realm.EventTarget?.prototype?.removeEventListener;
  const nativeStop = realm.Event?.prototype?.stopImmediatePropagation;
  const nativeMessageData = realm.MessageEvent && Object.getOwnPropertyDescriptor(realm.MessageEvent.prototype, 'data')?.get;
  const nativeCrypto = realm.crypto;
  const randomValues = nativeCrypto?.getRandomValues;
  const nativeIsTrustedUrl = realm.trustedTypes?.isScriptURL;
  const nativeTrustedUrlString = realm.TrustedScriptURL?.prototype?.toString;
  if (!NativeBlob || !createUrl || !NativeWorker && !NativeSharedWorker) return;
  const disguise = (proxy, original) => nativeLike(proxy, original, original.name, original.length, true);
  let parser;
  const getParser = () => parser || (parser = /* PRIVATE_PARSER */ null);
  const getRegistry = (win, value) => {
    try {
      const fn = win.Function.prototype.toString;
      const result = Reflect.apply(fn, fn, [bridgeToken, 'sharedWorkers', value]);
      if (!result) return null;
      Map.prototype.has.call(result.entries, null); Map.prototype.has.call(result.owners, null);
      return result;
    } catch (_) { return null; }
  };
  let coordinator = realm;
  if (typeof realm.window === 'object') {
    const seen = new Set();
    for (;;) {
      if (seen.has(coordinator)) break;
      seen.add(coordinator);
      let next;
      try {
        if (coordinator.parent && coordinator.parent !== coordinator) {
          void coordinator.parent.Function.prototype;
          next = coordinator.parent;
        } else if (coordinator.opener && !coordinator.opener.closed) {
          void coordinator.opener.Function.prototype;
          next = coordinator.opener;
        }
      } catch (_) {}
      if (!next || seen.has(next)) break;
      coordinator = next;
    }
  }
  const registry = getRegistry(coordinator) || getRegistry(realm)
    || getRegistry(coordinator, { entries: new Map(), owners: new Map(), pending: new WeakMap() })
    || getRegistry(realm, { entries: new Map(), owners: new Map(), pending: new WeakMap() })
    || { entries: new Map(), owners: new Map(), pending: new WeakMap() };
  // A participating window can become an opener after its own opener closes
  // or is detached. Descendants must still find the same canonical registry.
  getRegistry(realm, registry);
  const owner = {
    urls: new Set(),
    mint(text) { return Reflect.apply(createUrl, nativeURL, [new NativeBlob([text], { type: 'application/javascript' })]); },
    revoke(url) { return Reflect.apply(revokeUrl, nativeURL, [url]); },
  };
  const release = (entry) => {
    for (const url of entry.resources.splice(0)) entry.owner.revoke(url);
  };
  const markRevoked = (url) => {
    const creator = registry.owners.get(url);
    creator?.urls.delete(url);
    registry.owners.delete(url);
    const entry = registry.entries.get(url);
    if (entry) { release(entry); entry.revoked = true; entry.owner = null; }
  };
  // Keep rewritten URLs owned by the same document as the original Blob URL.
  if (typeof NativeSharedWorker === 'function') {
    const create = disguise(new Proxy(createUrl, {
      apply(target, receiver, args) {
        const url = Reflect.apply(target, receiver, args);
        registry.owners.set(url, owner); owner.urls.add(url);
        return url;
      },
    }), createUrl);
    Object.defineProperty(nativeURL, 'createObjectURL', { ...Object.getOwnPropertyDescriptor(nativeURL, 'createObjectURL'), value: create });
    const revoke = disguise(new Proxy(revokeUrl, {
      apply(target, receiver, args) {
        let normalized;
        const forwarded = args.slice();
        if (forwarded.length) {
          const input = forwarded[0];
          forwarded[0] = { [Symbol.toPrimitive]() { normalized = `${input}`; return normalized; } };
        }
        const result = Reflect.apply(target, receiver, forwarded);
        if (normalized !== undefined) markRevoked(normalized);
        return result;
      },
    }), revokeUrl);
    Object.defineProperty(nativeURL, 'revokeObjectURL', { ...Object.getOwnPropertyDescriptor(nativeURL, 'revokeObjectURL'), value: revoke });
    if (typeof realm.window === 'object' && nativeAdd) Reflect.apply(nativeAdd, realm, ['pagehide', (event) => {
      if (!event.persisted) for (const url of [...owner.urls]) markRevoked(url);
    }]);
  }
  const readSource = (url) => {
    if (url.startsWith('data:')) {
      const comma = url.indexOf(',');
      if (comma < 0) return null;
      const metadata = url.slice(5, comma), body = url.slice(comma + 1).split('#')[0];
      if (/;base64$/i.test(metadata)) {
        const raw = atob(decodeURIComponent(body));
        return new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)));
      }
      return decodeURIComponent(body);
    }
    if (!NativeXHR) return null;
    const xhr = new NativeXHR(); xhr.open('GET', url, false); xhr.send(null);
    return xhr.status === 200 || xhr.status === 0 ? xhr.responseText : null;
  };
  const analyze = (source) => {
    const syntax = getParser(), options = { ecmaVersion: 'latest', allowHashBang: true };
    let position = source.startsWith('#!') ? (source.includes('\n') ? source.indexOf('\n') + 1 : source.length) : 0;
    let directive = true, expressionEnd = position, depth = 0, previous = null, isModule = false;
    const iterator = syntax.tokenizer(source, options);
    let current;
    try {
      current = iterator.getToken();
      let next = iterator.getToken(), afterNext = iterator.getToken();
      while (current.type.label !== 'eof') {
        const label = current.type.label;
        if (directive && current.start >= expressionEnd) {
          if (label === 'string') {
            let expression;
            try { expression = syntax.parseExpressionAt(source, current.start, options); }
            catch (_) {
              try { expression = syntax.parseExpressionAt(source, current.start, { ...options, sourceType: 'module' }); } catch (_) {}
            }
            if (expression && expression.type === 'Literal' && typeof expression.value === 'string') {
              position = expressionEnd = expression.end;
            } else directive = false;
          } else if (label === ';') position = expressionEnd = current.end;
          else directive = false;
        }
        const qualified = previous === '.' || previous === '?.';
        if (!qualified && label === 'import' && (next.type.label === '.' && afterNext.value === 'meta' || depth === 0 && !['(', '.'].includes(next.type.label))) isModule = true;
        if (!qualified && label === 'export' && depth === 0) isModule = true;
        if (label === '{' || label === '${') depth++;
        else if (label === '}') depth = Math.max(0, depth - 1);
        previous = label; current = next; next = afterNext; afterNext = iterator.getToken();
      }
    } catch (_) {
      // Leave malformed programs to the native parser; never repair their syntax.
    }
    return { position, module: isModule };
  };
  const prefix = (url) => workerCore + '(' + JSON.stringify(url) + ', ' + installWorkerConstructors.toString() + ');';
  const prepare = (url, shared) => {
    if (!/^(blob|data):/.test(url)) return null;
    if (shared && registry.entries.has(url)) return { entry: registry.entries.get(url), fresh: false };
    let source;
    try { source = readSource(url); } catch (_) { source = null; }
    if (source === null) throw new DOMException('Unable to initialize the configured worker source.', 'SecurityError');
    const creator = registry.owners.get(url) || owner;
    const entry = { url: null, owner: creator, resources: [], revoked: false, signal: null };
    const mint = (text) => {
      if (url.startsWith('data:')) return 'data:application/javascript;charset=utf-8,' + encodeURIComponent(text);
      const minted = creator.mint(text); entry.resources.push(minted); return minted;
    };
    const hashbangEnd = source.startsWith('#!') ? (source.includes('\n') ? source.indexOf('\n') + 1 : source.length) : 0;
    const parsed = analyze(source);
    let position = hashbangEnd, text;
    if (parsed.module) {
      // Static dependencies execute before the entry body. A first, synchronous
      // side-effect import installs identity before the original dependency graph.
      let install = prefix(url);
      if (!shared && url.startsWith('blob:')) {
        entry.signal = Array.from(Reflect.apply(randomValues, nativeCrypto, [new Uint32Array(4)]), (n) => n.toString(16)).join('-');
        install += '\n;postMessage(' + JSON.stringify({ ready: entry.signal }) + ');';
      }
      const prefixUrl = mint(install);
      text = source.slice(0, position) + '\nimport ' + JSON.stringify(prefixUrl) + ';\nimport.meta.url = '
        + JSON.stringify(url) + ';\n' + source.slice(position);
    } else {
      position = parsed.position;
      text = source.slice(0, position) + '\n;' + prefix(url) + '\n;' + source.slice(position);
    }
    entry.url = mint(text);
    return { entry, fresh: true };
  };
  const watch = (worker, entry) => {
    if (!entry.signal || !nativeAdd) return;
    const done = () => {
      registry.pending.delete(worker);
      release(entry);
      Reflect.apply(nativeRemove, worker, ['message', ready, true]);
      Reflect.apply(nativeRemove, worker, ['error', done, true]);
    };
    const ready = (event) => {
      const data = nativeMessageData ? Reflect.apply(nativeMessageData, event, []) : event.data;
      if (!data || data.ready !== entry.signal) return;
      Reflect.apply(nativeStop, event, []); done();
    };
    registry.pending.set(worker, done);
    Reflect.apply(nativeAdd, worker, ['message', ready, true]);
    Reflect.apply(nativeAdd, worker, ['error', done, true]);
  };
  const install = (key, Original, shared) => {
    if (typeof Original !== 'function') return;
    let proxy;
    proxy = new Proxy(Original, {
      construct(target, args, newTarget) {
        let replacement, normalizedUrl, succeeded = false;
        const forwarded = args.slice(), input = args[0];
        const trusted = typeof nativeIsTrustedUrl === 'function' && Reflect.apply(nativeIsTrustedUrl, realm.trustedTypes, [input]);
        if (trusted && nativeTrustedUrlString && /^(blob|data):/.test(Reflect.apply(nativeTrustedUrlString, input, []))) {
          throw new DOMException('Trusted inline worker sources cannot be initialized with this configuration.', 'SecurityError');
        }
        if (args.length && !trusted) forwarded[0] = { [Symbol.toPrimitive]() {
          const url = `${input}`; normalizedUrl = url; replacement = prepare(url, shared);
          return replacement ? replacement.entry.url : url;
        } };
        try {
          const result = Reflect.construct(target, forwarded, newTarget === proxy ? target : newTarget);
          succeeded = true;
          if (replacement) {
            const { entry, fresh } = replacement;
            if (shared) {
              // Keep a Blob's canonical prepared URL for its native lifetime.
              // Data URLs are deterministic and need no document-owned cache.
              if (fresh && normalizedUrl.startsWith('blob:')) registry.entries.set(normalizedUrl, entry);
            } else watch(result, entry);
          }
          return result;
        } finally {
          if (replacement && replacement.fresh && (!shared || !succeeded)) {
            const { entry } = replacement;
            // The native constructor has captured its entry Blob. Module helper
            // URLs must stay alive until the private ready message or an error.
            if (!succeeded || !entry.signal) release(entry);
            else { entry.owner.revoke(entry.url); entry.resources.splice(entry.resources.indexOf(entry.url), 1); }
          }
        }
      },
    });
    disguise(proxy, Original);
    Object.defineProperty(realm, key, { ...Object.getOwnPropertyDescriptor(realm, key), value: proxy });
    const constructor = Object.getOwnPropertyDescriptor(Original.prototype, 'constructor');
    if (constructor?.configurable || constructor?.writable) Object.defineProperty(Original.prototype, 'constructor', { ...constructor, value: proxy });
  };
  if (typeof NativeWorker?.prototype?.terminate === 'function') {
    const original = NativeWorker.prototype.terminate;
    const terminate = disguise(new Proxy(original, {
      apply(target, receiver, args) {
        const value = Reflect.apply(target, receiver, args);
        registry.pending.get(receiver)?.();
        return value;
      },
    }), original);
    Object.defineProperty(NativeWorker.prototype, 'terminate', { ...Object.getOwnPropertyDescriptor(NativeWorker.prototype, 'terminate'), value: terminate });
  }
  install('Worker', NativeWorker, false);
  install('SharedWorker', NativeSharedWorker, true);
}

const parserFactory = `(function () { const exports = {}; const module = { exports };\n${acornSource}\nreturn module.exports; })()`;
const installerSource = installWorkerConstructors.toString().replace('/* PRIVATE_PARSER */ null', () => parserFactory);
function workerConstructorPatch({ workerSource }) {
  return `\n;(${installerSource})(${JSON.stringify(String(workerSource))}, nativeLike, BRIDGE_TOKEN);\n`;
}
workerConstructorPatch.installerSource = installerSource;
workerConstructorPatch.parserSourceBytes = acornSource.length;
workerConstructorPatch.workerRuntime = `\nif (typeof constructorInstaller === 'function') constructorInstaller(
  '(' + originalToString.call(installWorkerIdentity) + ')', nativeLike, BRIDGE_TOKEN);\n`;
module.exports = workerConstructorPatch;

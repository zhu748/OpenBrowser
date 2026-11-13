'use strict';

// This factory is serialized into both document and worker closures. Bound
// retained UTF-16 keys as well as entry count; oversized text is never kept.
function createTextMetricJitterCache(origin, seed, { maxEntries = 512, maxBytes = 256 * 1024 } = {}) {
  const entries = new Map();
  let bytes = 0;
  return {
    get size() { return entries.size; },
    get bytes() { return bytes; },
    get(font, text) {
      // Prefixing the font length avoids ambiguous font/text boundaries.
      const prefix = font.length + ':';
      const weight = (prefix.length + font.length + text.length) * 2 + 16;
      const cacheable = weight <= maxBytes;
      const key = cacheable ? prefix + font + text : null;
      const cached = cacheable ? entries.get(key) : null;
      if (cached) {
        entries.delete(key); entries.set(key, cached);
        return cached;
      }
      const hashKey = origin + ':' + seed + ':' + font + ':' + text;
      let h = 0;
      for (let i = 0; i < hashKey.length; i++) h = ((h << 5) - h + hashKey.charCodeAt(i)) | 0;
      const value = { jitter: (h % 100) / 10000, widthJitter: ((h % 200) - 100) / 10000 };
      if (cacheable) {
        entries.set(key, value); bytes += weight;
        while (entries.size > maxEntries || bytes > maxBytes) {
          const oldest = entries.keys().next().value;
          bytes -= oldest.length * 2 + 16; entries.delete(oldest);
        }
      }
      return value;
    },
  };
}

module.exports = { createTextMetricJitterCache, runtimeSource: `${createTextMetricJitterCache.toString()}\n` };

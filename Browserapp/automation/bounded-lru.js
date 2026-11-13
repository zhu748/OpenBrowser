'use strict';

/** A cache with independent entry and retained-byte ceilings. Oversized values
 * are returned to callers by their producer, but never retained by the cache. */
class BoundedLru {
  constructor({ maxEntries, maxBytes, sizeOf }) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1
      || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || typeof sizeOf !== 'function') {
      throw new TypeError('Invalid bounded cache configuration');
    }
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
    this.sizeOf = sizeOf;
    this.items = new Map();
    this.bytes = 0;
  }

  get size() { return this.items.size; }

  get(key) {
    const entry = this.items.get(key);
    if (!entry) return undefined;
    this.items.delete(key);
    this.items.set(key, entry);
    return entry.value;
  }

  delete(key) {
    const entry = this.items.get(key);
    if (!entry) return false;
    this.bytes -= entry.bytes;
    return this.items.delete(key);
  }

  set(key, value) {
    const bytes = this.sizeOf(value) + String(key).length * 2;
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError('Invalid cache entry size');
    this.delete(key);
    if (bytes > this.maxBytes) return false;
    this.items.set(key, { value, bytes });
    this.bytes += bytes;
    while (this.size > this.maxEntries || this.bytes > this.maxBytes) {
      this.delete(this.items.keys().next().value);
    }
    return true;
  }

  clear() { this.items.clear(); this.bytes = 0; }
}

module.exports = { BoundedLru };

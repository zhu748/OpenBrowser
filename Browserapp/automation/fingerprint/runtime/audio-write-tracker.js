'use strict';

function createAudioWriteTracker() {
  const authored = new WeakMap(), processed = new WeakMap();
  return {
    isProcessed(buffer, channel) { return processed.get(buffer)?.has(channel) || false; },
    spansFor(buffer, channel) { return authored.get(buffer)?.get(channel) || null; },
    record(buffer, channel, start, length, bufferLength) {
      if (processed.get(buffer)?.has(channel)) return;
      if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(length) || length <= 0
        || !Number.isSafeInteger(bufferLength) || start >= bufferLength) return;
      let from = start, end = Math.min(bufferLength, start + length);
      let channels = authored.get(buffer);
      if (!channels) { channels = new Map(); authored.set(buffer, channels); }
      const next = [];
      let inserted = false;
      for (const span of channels.get(channel) || []) {
        if (span[1] < from) next.push(span);
        else if (span[0] > end) {
          if (!inserted) { next.push([from, end]); inserted = true; }
          next.push(span);
        } else { from = Math.min(from, span[0]); end = Math.max(end, span[1]); }
      }
      if (!inserted) next.push([from, end]);
      channels.set(channel, next);
    },
    contains(spans, index) {
      let low = 0, high = (spans?.length || 0) - 1;
      while (low <= high) {
        const middle = (low + high) >>> 1, span = spans[middle];
        if (index < span[0]) high = middle - 1;
        else if (index >= span[1]) low = middle + 1;
        else return true;
      }
      return false;
    },
    finish(buffer, channel) {
      let channels = processed.get(buffer);
      if (!channels) { channels = new Set(); processed.set(buffer, channels); }
      channels.add(channel);
      const spans = authored.get(buffer);
      spans?.delete(channel);
      if (!spans?.size) authored.delete(buffer);
    },
  };
}

module.exports = { createAudioWriteTracker, runtimeSource: `${createAudioWriteTracker.toString()}\n` };

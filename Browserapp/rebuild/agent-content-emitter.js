"use strict";

// Keep the first token immediate, then combine adjacent model deltas before
// assigning event sequences. A terminal event never overtakes pending text.
function createContentEmitter(emit, onError, { interval = 24, maximum = 8192,
  setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let parts = [], length = 0, timer, first = true, closed = false, failure;
  function flush() {
    if (timer !== undefined) { clearTimer(timer); timer = undefined; }
    if (failure) throw failure;
    if (!parts.length) return;
    const text = parts.join(""); parts = []; length = 0;
    emit(text);
  }
  return {
    push(text) {
      if (closed) throw Error("Model content emitter is closed");
      if (failure) throw failure;
      if (!text) return;
      parts.push(text); length += text.length;
      if (first || length >= maximum) { first = false; flush(); }
      else if (timer === undefined) timer = setTimer(() => {
        try { flush(); }
        catch (error) { failure = error; onError(error); }
      }, interval);
    },
    close() { closed = true; flush(); },
  };
}

module.exports = { createContentEmitter };

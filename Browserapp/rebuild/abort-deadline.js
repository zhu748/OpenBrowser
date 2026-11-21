"use strict";

/**
 * Rooted deadline signal for AbortSignal compositions.
 *
 * AbortSignal.timeout() composed inline into AbortSignal.any() is only
 * weakly referenced on older Node runtimes (reproduced on 22.13.0: a write
 * deadline never fired and the awaiting promise hung forever at 0 CPU until
 * the CI script budget killed it; later Node releases hold the composite's
 * sources strongly). The CI matrix deliberately pins the oldest supported
 * Node, so every deadline that participates in an AbortSignal.any() chain —
 * or is handed to code that may drop its last strong reference — must come
 * from here instead: an explicit setTimeout stays strongly rooted in the
 * timer map until it fires, immune to premature collection. The timer is
 * unref'd so it never keeps an otherwise-idle process alive.
 */
function deadlineSignal(ms, message = "operation timeout") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(Error(message)), ms);
  if (typeof timer.unref === "function") timer.unref();
  return controller.signal;
}

module.exports = { deadlineSignal };

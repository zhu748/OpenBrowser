'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
// M-1/M-2 (wave 4): the shared timezone core lives in
// timezone-fragment.js (one source for both realms); the audio-context
// perturbation block is document-only (workers expose no AudioContext).
// This shell pins the document realm: replaceMethod (stack stripping) and
// the document header docs. The fragment chain continues after this one
// (screen/graphics/webrtc/media/gpu-storage), so no IIFE closer here.
const { timezoneFragment, audioFragment } = require('./timezone-fragment');

module.exports = timezoneFragment({
  replaceHelper: 'replaceMethod',
  headerComment: `  // --- timezone spoofing (Intl.DateTimeFormat & Date) ---
  // The engine can already be in the target zone on its own (the CDP timezone override does exactly
  // that), and re-implementing the same surfaces on top of a correct engine is pure difference: the
  // zone name V8 prints for years outside the modern range, the TypeError the accessors owe a
  // receiver that is not a Date, and the number of times an options getter is read would all change
  // while nothing is hidden. So the script layer stays out of the way unless the engine is still
  // reporting some other zone.
`,
}) + audioFragment({ replaceHelper: 'replaceMethod' });

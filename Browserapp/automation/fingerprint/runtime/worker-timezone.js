'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
// M-1/M-2 (wave 4): the shared timezone core lives in
// timezone-fragment.js (one source for both realms). This shell pins the
// worker realm: replace (the worker bootstrap's helper, no stack stripping)
// and the worker header docs. The fragment chain continues after this one
// (graphics/gpu-storage), so no IIFE closer here.
const { timezoneFragment } = require('./timezone-fragment');

module.exports = timezoneFragment({
  replaceHelper: 'replace',
  headerComment: `  // Same guard as the page copy: the engine may already be in the target zone, and re-implementing
  // the Date and Intl surfaces on top of a correct engine only adds differences.
`,
});

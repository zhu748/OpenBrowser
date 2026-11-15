'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Locate packaged or checkout-local font subsets without caching the working directory. */
function resolveFontSubsetRoot() {
  const candidates = [
    path.resolve(__dirname, '..', 'assets', 'font-subsets'),
    path.resolve(__dirname, '..', '..', 'assets', 'font-subsets'),
    path.resolve(process.cwd(), 'Browserapp', 'assets', 'font-subsets'),
    path.resolve(process.cwd(), 'assets', 'font-subsets'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.json'))) {
      return candidate;
    }
  }
  return candidates[0];
}

module.exports = { resolveFontSubsetRoot };

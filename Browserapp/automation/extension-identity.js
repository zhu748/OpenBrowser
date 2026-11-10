'use strict';

const path = require('node:path');
const { extensionIdFromPublicKey } = require('./crx-reader');

/** Windows path comparisons fold case; POSIX paths retain distinct casing. */
function extensionPathKey(value, platform = process.platform) {
  if (!value) return '';
  return platform === 'win32' ? path.win32.resolve(value).toLowerCase() : path.resolve(value);
}

// Chromium hashes native path bytes; Windows uses UTF-16 and an uppercase drive.
function extensionIdFromPath(value, platform = process.platform) {
  let absolute = platform === 'win32' ? path.win32.resolve(value) : path.resolve(value);
  if (platform === 'win32') absolute = absolute.replace(/^[a-z]:/, (drive) => drive.toUpperCase());
  return extensionIdFromPublicKey(Buffer.from(absolute, platform === 'win32' ? 'utf16le' : 'utf8'));
}

module.exports = { extensionPathKey, extensionIdFromPath };

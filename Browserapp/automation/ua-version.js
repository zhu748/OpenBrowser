'use strict';

const crypto = require('node:crypto');

function versionParts(version, engine) {
  const text = String(version || '');
  if (!/^\d+(?:\.\d+){1,3}$/.test(text) || Number(text.split('.')[0]) < 1)
    throw Error('Invalid browser version');
  const parts = text.split('.');
  const prefixLength = engine === 'firefox' ? 2 : 3;
  return Array.from({ length: prefixLength }, (_, index) => parts[index] || '0');
}

function productVersion(userAgent, engine) {
  return String(userAgent || '').match(engine === 'firefox'
    ? /Firefox\/(\d+\.\d+\.\d+)(?![\d.])/i
    : /(?:Chrome|Chromium|CriOS)\/(\d+\.\d+\.\d+\.\d+)(?![\d.])/i)?.[1];
}

// Preserve the selected kernel's branch and sample a patch in [1, 255],
// uniformly excluding the last displayed value when it belongs to this branch.
function randomUaPatchVersion(kernelVersion, { engine = 'chromium', previousUserAgent = '', randomInt = crypto.randomInt } = {}) {
  const prefix = versionParts(kernelVersion, engine).join('.');
  const previous = productVersion(previousUserAgent, engine);
  const patch = previous?.startsWith(prefix + '.') ? Number(previous.split('.').at(-1)) : 0;
  const excluded = Number.isInteger(patch) && patch >= 1 && patch <= 255 ? patch : 0;
  let selected = randomInt(excluded ? 254 : 255) + 1;
  if (excluded && selected >= excluded) selected++;
  return prefix + '.' + selected;
}

// A saved random patch survives launch and reload. If the selected kernel is
// upgraded, carry the patch onto the new branch while following its major.
function resolveUaPatchVersion(kernelVersion, userAgent, engine = 'chromium') {
  const previous = productVersion(userAgent, engine);
  if (!previous) return null;
  const patch = Number(previous.split('.').at(-1));
  if (!Number.isInteger(patch) || patch < 1 || patch > 255) return null;
  return [...versionParts(kernelVersion, engine), String(patch)].join('.');
}

module.exports = { randomUaPatchVersion, resolveUaPatchVersion };

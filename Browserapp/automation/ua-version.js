'use strict';

const { randomInt } = require('node:crypto');
const publishedVersions = require('./data/chrome-release-versions.json').versions;
const FALLBACK_PATCH_RADIUS = 8;

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

// A saved random patch survives launch and reload. If the selected kernel is
// upgraded, carry the patch onto the new branch while following its major.
function resolveUaPatchVersion(kernelVersion, userAgent, engine = 'chromium') {
  const previous = productVersion(userAgent, engine);
  if (!previous) return null;
  const patch = Number(previous.split('.').at(-1));
  if (!Number.isInteger(patch) || patch < 1 || patch > 255) return null;
  return [...versionParts(kernelVersion, engine), String(patch)].join('.');
}

function publishedVersionsFor(kernelVersion, os) {
  const major = String(kernelVersion).match(/^(\d+)(?:\.|$)/)?.[1];
  return major && Object.hasOwn(publishedVersions, os) ? publishedVersions[os][major] || [] : [];
}

function chromePatchRange(kernelVersion) {
  const match = String(kernelVersion || '').match(/^([1-9]\d*\.\d+\.[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) return null;
  const patch = Number(match[2]);
  if (!Number.isSafeInteger(patch + FALLBACK_PATCH_RADIUS)) return null;
  return { prefix: `${match[1]}.`, first: Math.max(0, patch - FALLBACK_PATCH_RADIUS), last: patch + FALLBACK_PATCH_RADIUS };
}

function pickRandomChromeVersion(kernelVersion, os, previousUserAgent) {
  const previous = productVersion(previousUserAgent, 'chromium');
  let versions = publishedVersionsFor(kernelVersion, os);
  if (!versions.length) {
    const range = chromePatchRange(kernelVersion);
    if (!range) return kernelVersion;
    versions = Array.from({ length: range.last - range.first + 1 }, (_, index) => range.prefix + (range.first + index));
  }
  const candidates = versions.length > 1 ? versions.filter(version => version !== previous) : versions;
  return candidates[randomInt(candidates.length)];
}

function resolveRandomChromeVersion(kernelVersion, os, userAgent) {
  const version = productVersion(userAgent, 'chromium');
  if (publishedVersionsFor(kernelVersion, os).includes(version)) return version;
  // Preserve a fallback previously chosen for this build even when an updated
  // catalog supplies published versions for subsequent rerolls.
  const range = chromePatchRange(kernelVersion);
  if (range && version?.startsWith(range.prefix)) {
    const patch = Number(version.slice(range.prefix.length));
    if (patch >= range.first && patch <= range.last && version === range.prefix + patch) return version;
  }
  return kernelVersion;
}

module.exports = { resolveUaPatchVersion, pickRandomChromeVersion, resolveRandomChromeVersion };

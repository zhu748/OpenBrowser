'use strict';

const { randomInt } = require('node:crypto');
const publishedVersions = require('./data/chrome-release-versions.json').versions;

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

function pickPublishedChromeVersion(kernelVersion, os, previousUserAgent) {
  const previous = productVersion(previousUserAgent, 'chromium');
  const versions = publishedVersionsFor(kernelVersion, os);
  const candidates = versions.length > 1 ? versions.filter(version => version !== previous) : versions;
  return candidates.length ? candidates[randomInt(candidates.length)] : kernelVersion;
}

function resolvePublishedChromeVersion(kernelVersion, os, userAgent) {
  const version = productVersion(userAgent, 'chromium');
  return publishedVersionsFor(kernelVersion, os).includes(version) ? version : kernelVersion;
}

module.exports = { resolveUaPatchVersion, pickPublishedChromeVersion, resolvePublishedChromeVersion };

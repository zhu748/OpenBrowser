'use strict';

const { navigateFirefoxStartup } = require('./firefox-fingerprint');

async function firefoxContext(item) {
  if (!item.bidiConnection?.command || item.stopping || item.cleanedUp) throw new Error('Firefox session is unavailable');
  const { contexts = [] } = await item.bidiConnection.command('browsingContext.getTree', { maxDepth: 0 }, 5000);
  const context = contexts.find((entry) => entry.context === item.bidiContext)?.context || contexts[0]?.context;
  if (!context) throw new Error('Firefox has no open page');
  return context;
}

async function navigateFirefox(item, url) {
  const context = await firefoxContext(item);
  // Reuse verified context emulation and per-origin permission preparation.
  await navigateFirefoxStartup(item.bidiConnection, context, [url]);
}

async function screenshotFirefox(item, format) {
  const context = await firefoxContext(item);
  const result = await item.bidiConnection.command('browsingContext.captureScreenshot', {
    context, origin: 'viewport', format: { type: format === 'jpeg' ? 'image/jpeg' : 'image/png' },
  }, 15000);
  if (!result.data) throw new Error('Firefox returned no screenshot');
  return result.data;
}

module.exports = { firefoxContext, navigateFirefox, screenshotFirefox };

"use strict";

// Compatibility entry for engine callers; endpoint rules belong to networking.
const identity = require("../network/proxy-identity");

async function retryProxyOperation(operation, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      lastError = error;
      if (/authentication failed|username or password|rejected available authentication/i.test(String(error?.message || "")) || attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }
  throw lastError;
}

module.exports = { ...identity, retryProxyOperation };

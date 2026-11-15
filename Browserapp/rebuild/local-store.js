"use strict";
const fs = require("node:fs/promises");
const credentials = require("../credential-crypto");

// Keep the existing filename and logical schema; only the on-disk envelope
// changes. All startup readers must use this decoder as well as LocalService.
async function readLocalStore(file) {
  const bytes = await fs.readFile(file);
  const legacy = credentials.getFormat(bytes) === "plaintext";
  const data = legacy ? JSON.parse(bytes.toString("utf8")) : credentials.decryptCredentialJson(bytes);
  if (!data || data.version !== 1) throw Error("Unsupported local store version");
  return { data, legacy };
}
function encodeLocalStore(data) {
  return credentials.encryptCredentialJson(data);
}
module.exports = { readLocalStore, encodeLocalStore };

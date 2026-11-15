"use strict";

const fs = require("node:fs");
const path = require("node:path");
const repo = path.resolve(__dirname, "../../..");

// Developer runs stay out of versioned release evidence. The acceptance runner
// passes its explicit output directory to every child through this variable.
function resolveEvidencePath(segments) {
  const root = path.resolve(repo, process.env.OPENBROWSER_EVIDENCE_DIR || "work/rebuild/evidence");
  const target = path.resolve(root, ...segments);
  if (target !== root && !target.startsWith(root + path.sep))
    throw Error("Evidence path escapes its output directory");
  return target;
}

function evidenceDirectory(...segments) {
  const directory = resolveEvidencePath(segments);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function evidencePath(...segments) {
  const file = resolveEvidencePath(segments);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return file;
}

module.exports = { evidenceDirectory, evidencePath };

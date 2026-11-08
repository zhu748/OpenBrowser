"use strict";

const fsp = require("fs/promises");
const path = require("path");

const STARTUP_DIAGNOSTIC_LIMIT = 16 * 1024;

function appendDiagnosticOutput(current, chunk) {
  const value = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk || "");
  return (String(current || "") + value).slice(-STARTUP_DIAGNOSTIC_LIMIT);
}

function formatBrowserStartupError(error, child, diagnostic = {}) {
  const base = String(error?.message || error || "Browser startup failed").trim();
  if (base.includes("[executable=")) return base;
  const details = [];
  if (diagnostic.launchBinary) details.push(`executable=${diagnostic.launchBinary}`);
  if (diagnostic.profileRoot) details.push(`profile=${diagnostic.profileRoot}`);
  if (child?.pid) details.push(`pid=${child.pid}`);
  if (child?.exitCode !== null && child?.exitCode !== undefined) details.push(`exitCode=${child.exitCode}`);
  if (child?.signalCode) details.push(`signal=${child.signalCode}`);
  const output = [diagnostic.stderr, diagnostic.stdout]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (output.length) details.push(`browserOutput=${output.join(" | ")}`);
  return details.length ? `${base} [${details.join("; ")}]` : base;
}

// Serialized appends/rotations: concurrent profile starts can fail at the same
// moment, and the old unsynchronized read-modify-write truncation silently
// dropped records appended between the read and the write (and could cut a
// JSON line mid-UTF8-sequence).
let diagnosticWriteChain = Promise.resolve();

async function appendStartupDiagnosticLocked(file, line) {
  await fsp.appendFile(file, line, "utf8");
  const stat = await fsp.stat(file);
  if (stat.size > 512 * 1024) {
    // Rotate by rename, not in-place truncation: readers and concurrent
    // appenders keep a consistent view, and no torn JSON lines are produced.
    await fsp.rename(file, `${file}.1`).catch(() => {});
    await fsp.writeFile(file, "", "utf8").catch(() => {});
  }
}

async function writeBrowserStartupDiagnostic(userDataPath, record) {
  try {
    const logDir = path.join(userDataPath, "logs");
    await fsp.mkdir(logDir, { recursive: true });
    const file = path.join(logDir, "browser-startup.log");
    const line = JSON.stringify({ at: new Date().toISOString(), ...record }) + "\n";
    const previous = diagnosticWriteChain;
    let release;
    diagnosticWriteChain = new Promise((resolve) => { release = resolve; });
    try {
      await previous;
      await appendStartupDiagnosticLocked(file, line);
    } finally {
      release();
    }
  } catch (_) {}
}

module.exports = {
  STARTUP_DIAGNOSTIC_LIMIT,
  appendDiagnosticOutput,
  formatBrowserStartupError,
  writeBrowserStartupDiagnostic,
};

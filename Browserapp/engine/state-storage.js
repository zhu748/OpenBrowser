"use strict";

const fsp = require("fs/promises");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
// 引擎状态文件含代理凭据/Cookies，落盘一律走 credential-crypto 加密（读路径兼容明文旧档并自动迁移）
const credentialCrypto = require("../credential-crypto");

const TRANSIENT_WRITE_ERRORS = new Set(["ENOENT", "EEXIST", "EINVAL", "EBUSY", "EAGAIN"]);

// Engine state / lockfile policy version. Bumping invalidates persisted engine
// state and stored lock metadata written by older policies (compared on init
// and on proxy-store hydration in engine.js / engine/init.js).
const KERNEL_POLICY_VERSION = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Directory handles are unsupported on some Windows filesystems.
async function syncDirectory(directory) {
  try {
    const handle = await fsp.open(directory, "r");
    try { await handle.sync(); }
    finally { await handle.close(); }
  } catch (_) {}
}

async function writeRawAtomically(filePath, value, mode = 0o600) {
  const directory = path.dirname(filePath);
  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await fsp.mkdir(directory, { recursive: true });
    const temporary = `${filePath}.tmp-${process.pid}-${crypto.randomBytes(8).toString("hex")}`;
    let handle = null;
    try {
      handle = await fsp.open(temporary, "wx", mode);
      await handle.writeFile(value, "utf8");
      await handle.sync();
      await handle.close();
      handle = null;
      await fsp.rename(temporary, filePath);
      await syncDirectory(directory);
      return;
    } catch (error) {
      lastError = error;
      if (handle) await handle.close().catch(() => {});
      await fsp.rm(temporary, { force: true }).catch(() => {});
      if (!TRANSIENT_WRITE_ERRORS.has(error?.code) || attempt === 3) throw error;
      await sleep(5 * (attempt + 1));
    }
  }
  throw lastError || new Error("atomic write failed");
}

// .bak refresh throttle: refreshing the backup on every write doubles the IO
// of the persist path (read old + write .bak + write new). Within the window
// the existing .bak keeps the last refreshed version — recovery may lose at
// most BAK_REFRESH_INTERVAL_MS of state, which the debounced persist cadence
// makes acceptable.
const BAK_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const bakLastRefreshAt = new Map();

async function writeJsonAtomically(filePath, value, mode = 0o600) {
  const shouldRefreshBak = (bakLastRefreshAt.get(filePath) || 0) + BAK_REFRESH_INTERVAL_MS <= Date.now();
  if (shouldRefreshBak) {
    let previous = null;
    try {
      // Preserve encrypted bytes as-is; encrypt legacy plaintext before it
      // becomes a long-lived recovery copy containing cookies or credentials.
      previous = await fsp.readFile(filePath);
    } catch (error) {
      // Only a missing primary permits the write without a recovery copy.
      if (error.code !== "ENOENT") throw error;
    }
    if (previous != null) {
      const backup = credentialCrypto.isEncrypted(previous) ? previous : credentialCrypto.encryptCredential(previous);
      await writeRawAtomically(`${filePath}.bak`, backup, mode);
      bakLastRefreshAt.set(filePath, Date.now());
    }
    // ENOENT leaves no timestamp recorded: the next write must still be able
    // to produce the first .bak as soon as a previous file exists.
  }
  const payload = credentialCrypto.isEncrypted(value)
    ? value
    : credentialCrypto.encryptCredential(typeof value === "string" ? value : JSON.stringify(value));
  await writeRawAtomically(filePath, payload, mode);
}

class EngineStateUnavailableError extends Error {
  constructor(cause, source = "primary engine state") {
    super(`Cannot use the ${source}; existing files were preserved: ${cause.message}`, { cause });
    this.code = cause.code || "ENGINE_STATE_UNAVAILABLE";
    if (cause.errno !== undefined) this.errno = cause.errno;
  }
}

function inspectSQLiteDatabase(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw new EngineStateUnavailableError(error, "SQLite database");
  }
  // Only a matching main database authorizes SQLite to open/replay these
  // files. A fresh open may overwrite the last surviving recovery evidence.
  for (const suffix of ["-wal", "-shm"]) {
    try {
      fs.lstatSync(filePath + suffix);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw new EngineStateUnavailableError(error, "SQLite sidecar");
    }
    throw new EngineStateUnavailableError(new Error("SQLite sidecar exists without its database file"), "SQLite storage");
  }
  return null;
}

async function readEngineStateCandidate(filePath, { source } = {}) {
  let raw;
  try {
    raw = await fsp.readFile(filePath);
  } catch (error) {
    if (source && error.code !== "ENOENT") throw new EngineStateUnavailableError(error, source);
    throw error;
  }
  let jsonText;
  try {
    jsonText = credentialCrypto.isEncrypted(raw)
      ? credentialCrypto.decryptCredential(raw)
      : raw.toString("utf8");
  } catch (error) {
    if (source) throw new EngineStateUnavailableError(error, source);
    throw error;
  }
  // Only content we could read and decode has evidence of a bad JSON format.
  const saved = JSON.parse(jsonText);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    throw new Error("引擎状态文件格式无效");
  }
  return { path: filePath, saved };
}

async function readWorkspaceSnapshot(filePath, source) {
  const state = await readEngineStateCandidate(filePath, { source });
  // Older snapshots may omit this collection. An explicit wrong shape is
  // corrupt, not an empty workspace. Other users of the JSON reader (such as
  // the restore journal) keep their separate schema.
  if (Object.hasOwn(state.saved, "profiles") && !Array.isArray(state.saved.profiles)) {
    throw new Error("引擎状态文件的 profiles 字段必须为数组");
  }
  return state;
}

async function loadEngineStartupState(filePath) {
  let primaryError;
  try {
    return { ...await readWorkspaceSnapshot(filePath, "primary engine state"), recovered: false };
  } catch (error) {
    if (error instanceof EngineStateUnavailableError) throw error;
    primaryError = error;
  }

  try {
    const backup = await readWorkspaceSnapshot(filePath + ".bak", "committed engine backup");
    return { ...backup, recovered: true, corruptPrimary: primaryError.code !== "ENOENT" };
  } catch (error) {
    if (error instanceof EngineStateUnavailableError) throw error;
    if (error.code !== "ENOENT") throw new EngineStateUnavailableError(error, "committed engine backup");
  }
  if (primaryError.code !== "ENOENT") throw new EngineStateUnavailableError(primaryError);

  // A staging file has not passed the atomic rename. Never promote it, or
  // assume this is a fresh workspace when only an interrupted write remains.
  const base = path.basename(filePath);
  let names;
  try {
    names = await fsp.readdir(path.dirname(filePath));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new EngineStateUnavailableError(error, "engine state directory");
  }
  if (names.some(name => name.startsWith(base + ".tmp-") || name.startsWith(base + ".bak.tmp-"))) {
    throw new EngineStateUnavailableError(new Error("Only uncommitted staging files are available"), "committed engine state");
  }
  return null;
}

async function preserveCorruptEngineState(filePath) {
  const target = `${filePath}.corrupt-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  try {
    await fsp.rename(filePath, target);
  } catch (error) {
    // Otherwise the subsequent persist could replace the remaining good backup
    // with the malformed primary before the recovered state has been written.
    throw new EngineStateUnavailableError(error, "primary engine state archive");
  }
}

module.exports = {
  KERNEL_POLICY_VERSION,
  EngineStateUnavailableError,
  inspectSQLiteDatabase,
  writeRawAtomically,
  syncDirectory,
  writeJsonAtomically,
  readEngineStateCandidate,
  loadEngineStartupState,
  preserveCorruptEngineState,
};

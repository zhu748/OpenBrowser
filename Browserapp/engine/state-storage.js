"use strict";

const fsp = require("fs/promises");
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
      try {
        const directoryHandle = await fsp.open(directory, "r");
        try { await directoryHandle.sync(); }
        finally { await directoryHandle.close(); }
      } catch (_) {}
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
      const raw = await fsp.readFile(filePath);
      previous = raw;
    } catch (error) {
      if (error.code === "ENOENT") previous = null;
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

async function readEngineStateCandidate(filePath) {
  const raw = await fsp.readFile(filePath);
  const jsonText = credentialCrypto.isEncrypted(raw)
    ? credentialCrypto.decryptCredential(raw)
    : raw.toString("utf8");
  const saved = JSON.parse(jsonText);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    throw new Error("引擎状态文件格式无效");
  }
  return { path: filePath, saved };
}

async function engineStateRecoveryCandidates(filePath) {
  const directory = path.dirname(filePath);
  const base = path.basename(filePath);
  let names = [];
  try {
    names = await fsp.readdir(directory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  // Only .bak and .tmp-<pid>-<hex> can ever exist: writeRawAtomically builds
  // temporary files as `${filePath}.tmp-<pid>-<hex>` (renamed away on success),
  // so a bare `${filePath}.tmp` was listed here but never produced by any code
  // path — a dead candidate. The .tmp-* sweep below covers every real temp file.
  const candidates = [
    `${filePath}.bak`,
    ...names.filter((name) => name.startsWith(base + ".tmp-")).map((name) => path.join(directory, name)),
  ];
  const valid = [];
  for (const candidate of [...new Set(candidates)]) {
    try {
      const state = await readEngineStateCandidate(candidate);
      const stat = await fsp.stat(candidate);
      valid.push({ ...state, mtimeMs: stat.mtimeMs });
    } catch (_) {}
  }
  return valid.sort((left, right) => right.mtimeMs - left.mtimeMs);
}

async function preserveCorruptEngineState(filePath) {
  const target = `${filePath}.corrupt-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  try {
    await fsp.rename(filePath, target);
    return target;
  } catch (_) {
    return null;
  }
}

module.exports = {
  KERNEL_POLICY_VERSION,
  writeRawAtomically,
  writeJsonAtomically,
  readEngineStateCandidate,
  engineStateRecoveryCandidates,
  preserveCorruptEngineState,
};

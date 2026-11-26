"use strict";

// Revision-checked launch publication and persistent identity migration, shared by both engines.
const crypto = require("node:crypto");
const { profileWriteGuard } = require("./profile-write-guard");

async function readKernelVersion(engine, browser) {
  return engine.kernelManager?.readInstalledVersion
    ? engine.kernelManager.readInstalledVersion(browser) : browser.version;
}

function mergeLaunchProfileUpdate(engine, snapshot, assertCurrent) {
  if (!snapshot || typeof snapshot !== "object") return null;
  assertCurrent();
  const live = engine.profiles.get(snapshot.id);
  if (!live)
    throw Object.assign(new Error("环境已被删除，已停止启动"), {
      code: "PROFILE_STALE_REV",
    });
  const next = engine.sanitizeProfile(snapshot);
  engine.profiles.set(next.id, next);
  engine.invalidateStatusCache?.();
  return next;
}

const pendingFingerprintSeeds = new WeakMap();

async function ensureLegacyFingerprintSeed(engine, profile) {
  if (!profile) return false;
  let pending = pendingFingerprintSeeds.get(engine);
  if (!pending) {
    pending = new Map();
    pendingFingerprintSeeds.set(engine, pending);
  }
  const live = engine.profiles.get(profile.id);
  const existing = pending.get(profile.id);
  if (existing && !live)
    throw Object.assign(new Error("环境已被删除，已停止指纹身份迁移。"), {
      code: "FINGERPRINT_IDENTITY_CHANGED",
    });
  const seed = String(
    live?.fingerprintSeed || profile.fingerprintSeed || "",
  ).trim();
  if (seed && !existing) {
    profile.fingerprintSeed = seed;
    return false;
  }
  const chosen = seed || crypto.randomBytes(16).toString("hex");
  profile.fingerprintSeed = chosen;
  if (existing?.seed === chosen && existing.status === "pending") {
    await existing.promise;
    return true;
  }
  // Write only the seed onto the latest row; never replace concurrent edits
  // with the startup routine's older snapshot.
  engine.profiles.set(profile.id, {
    ...(live || profile),
    fingerprintSeed: chosen,
  });
  const entry = { seed: chosen, status: "pending", promise: null };
  pending.set(profile.id, entry);
  entry.promise = Promise.resolve()
    .then(async () => {
      try {
        await engine.persist();
      } catch (cause) {
        throw Object.assign(
          new Error("指纹种子保存失败，已停止启动；请检查存储后重试。", {
            cause,
          }),
          {
            code: "FINGERPRINT_SEED_PERSIST_FAILED",
          },
        );
      }
      if (engine.profiles.get(profile.id)?.fingerprintSeed !== chosen) {
        throw Object.assign(
          new Error("保存期间指纹身份已被修改，请重新启动环境。"),
          { code: "FINGERPRINT_IDENTITY_CHANGED" },
        );
      }
      if (pending.get(profile.id) === entry) pending.delete(profile.id);
    })
    .catch((error) => {
      entry.status = "failed";
      throw error;
    });
  await entry.promise;
  return true;
}

async function prepareLaunchFingerprintSeed(engine, profile, assertCurrent) {
  assertCurrent();
  const pending = ensureLegacyFingerprintSeed(engine, profile);
  let guard;
  try {
    guard = profileWriteGuard(engine, profile.id);
  } catch (error) {
    // The seed writer can already be running when a maintenance check fails.
    await pending.catch(() => {});
    throw error;
  }
  await pending;
  guard();
  return guard;
}

module.exports = { mergeLaunchProfileUpdate, ensureLegacyFingerprintSeed, prepareLaunchFingerprintSeed, readKernelVersion };

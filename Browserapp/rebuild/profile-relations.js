"use strict";

const { assertProfileId } = require("../automation/isolation");
const associationFields = new Set(["groupId", "group_name", "tag"]);

function pendingRecovery(cause) {
  return Object.assign(new Error("无法确认窗口关联恢复目标；已保留恢复记录，请在存储可用后重试", { cause }), {
    code: "PROFILE_RELATIONS_RECOVERY_PENDING",
  });
}

function readRecoveryTarget(engine, id) {
  try {
    const loaded = engine.profiles.has(id);
    let confirmed;
    if (engine.usingSqlite === true) {
      // SQLite may retain a row that could not be loaded. Conversely, a
      // live row missing from SQLite is not a confirmed committed target.
      confirmed = engine.sqliteStore?.hasProfile?.(id) === loaded;
    } else {
      // Successful JSON initialization loads the entire selected snapshot.
      confirmed = engine.usingSqlite === false && !engine.sqliteStore && typeof engine.storageRecovery === "boolean";
    }
    // During this recovery boot, absence from the selected backup cannot
    // tell us whether a journal target was actually deleted.
    if (confirmed && (loaded || engine.storageRecovery !== true)) {
      if (!loaded) return null;
      const snapshot = engine.profileForEdit(id);
      if (snapshot?.profile?.id === id && Number.isSafeInteger(snapshot.rev) && snapshot.rev > 0) return snapshot;
    }
  } catch (cause) {
    throw pendingRecovery(cause);
  }
  throw pendingRecovery();
}

// The journal lives in the same encrypted document as the metadata. Replacing
// that document commits the metadata and clears its journal in one operation.
async function restoreProfileRelations(engine, journal) {
  if (!Array.isArray(journal) || !journal.length) throw Error("窗口关联恢复记录无效");
  const changes = [];
  const conflicts = [];
  for (const { id, before, after } of journal) {
    const keys = Object.keys(after || {});
    if (!keys.length || !before || keys.length !== Object.keys(before).length ||
        keys.some(key => !associationFields.has(key) || typeof after[key] !== "string" || typeof before[key] !== "string"))
      throw Error("窗口关联恢复记录无效");
    const profileId = assertProfileId(id);
    const current = readRecoveryTarget(engine, profileId);
    if (!current) continue;
    // Another edit may have changed these relationships. Restore only the
    // exact changes written by the interrupted operation.
    if (keys.every(key => current.profile[key] === before[key])) continue;
    if (keys.every(key => current.profile[key] === after[key]))
      changes.push({ ...current.profile, ...before, rev: current.rev });
    else conflicts.push(profileId);
  }
  if (changes.length) await engine.commitProfiles(changes, { checkRevisions: true });
  return conflicts;
}

async function profileRelations(service, changes, updateMetadata) {
  if (!changes.length) {
    updateMetadata();
    await service.save();
    return true;
  }
  const originalMetadata = { ...service.data };
  const journal = changes.map(({ original, patch }) => ({
    id: original.id,
    before: Object.fromEntries(Object.keys(patch).map(key => [key, original[key]])),
    after: patch,
  }));
  service.data.pendingProfileRelations = journal;
  await service.save();
  let applied = false;
  try {
    await service.engine.commitProfiles(changes.map(({ original, patch, baseRev }) => ({
      ...original, ...patch, rev: baseRev,
    })), { checkRevisions: true });
    applied = true;
    updateMetadata();
    delete service.data.pendingProfileRelations;
    await service.save();
    return true;
  } catch (error) {
    service.data = originalMetadata;
    let conflicts = [];
    try {
      if (applied) conflicts = await restoreProfileRelations(service.engine, journal);
      await service.save();
    } catch (rollbackError) {
      throw Object.assign(new AggregateError([error, rollbackError], "窗口关联保存失败，后续请求将重新尝试恢复"), {
        code: "PROFILE_RELATIONS_RECOVERY_PENDING",
      });
    }
    if (conflicts.length) {
      throw Object.assign(new AggregateError([error], "本地元数据修改失败且窗口关联回滚不完整，已保留并发修改"), {
        remainingIds: conflicts,
      });
    }
    throw error;
  }
}

module.exports = { profileRelations, restoreProfileRelations };

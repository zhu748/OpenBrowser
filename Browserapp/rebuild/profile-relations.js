"use strict";
const { isDeepStrictEqual } = require("node:util");
// The profile store and local metadata have separate commits. Compensate only
// fields written here, with fresh revisions, so unrelated concurrent edits survive.
async function profileRelations(engine, changes, saveMetadata) {
  const committed = [];
  const rollback = async () => {
    const errors = [];
    for (const row of [...committed].reverse()) {
      try {
        const current = engine.profileForEdit(row.original.id);
        if (Object.keys(row.patch).some((key) =>
          !isDeepStrictEqual(current.profile[key], row.patch[key])))
          throw Error("关联回滚冲突，窗口关联已被另一个编辑器修改: " + row.original.id);
        await engine.applyProfileCommands([{
          kind: "modify", id: row.original.id, baseRev: current.rev,
          profile: { ...current.profile, ...Object.fromEntries(
            Object.keys(row.patch).map((key) => [key, row.original[key]])) },
        }], { delta: true });
      } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new AggregateError(errors, "窗口关联回滚不完整，请检查冲突窗口");
  };
  try {
    for (let index = 0; index < changes.length; index += 200) {
      const chunk = changes.slice(index, index + 200);
      await engine.applyProfileCommands(chunk.map((row) => ({
        kind: "modify", id: row.original.id, baseRev: row.baseRev,
        profile: { ...row.original, ...row.patch },
      })), { delta: true });
      committed.push(...chunk);
    }
    return await saveMetadata();
  } catch (error) {
    try { await rollback(); }
    catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "本地元数据修改失败且窗口关联回滚不完整");
    }
    throw error;
  }
}
module.exports = { profileRelations };

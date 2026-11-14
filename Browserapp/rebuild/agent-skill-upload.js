"use strict";
const fs = require("node:fs/promises"), path = require("node:path"), crypto = require("node:crypto");
const { importSkillArchive } = require("./skill-packages");
const { saveFields } = require("./agent-store");
async function installSkill(service, file) {
  const previous = structuredClone(service.data.skills);
  try {
    return await importSkillArchive(file, path.join(service.root, "skills"), async row => {
      await saveFields(service, { skills: service.data.skills.filter(skill => skill.slug !== row.slug).concat(row) });
    });
  } catch (error) { if (!error.committed) service.data.skills = previous; throw error; }
}
async function removeSkill(service, slug) {
  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9._-]{0,80}$/i.test(slug)) throw Error("无效的 Skill 名称");
  if (service.active.size) throw Error("请先停止 Agent 任务再删除 Skill");
  const builtin = (await service.request("skills:list")).find(row => row.slug === slug);
  if (builtin?.builtin) throw Error("内置 Skill 只能停用");
  const row = service.data.skills.find(item => item.slug === slug);
  if (!row) throw Error("Skill 不存在");
  if (service.data.templates.some(template => {
    const metadata = template.metadata || {};
    return [metadata.skillSlug, metadata.packageSlug, metadata.slug, metadata.skillMetadata?.slug].includes(slug);
  })) throw Error("请先删除引用此 Skill 的模板");
  const target = path.join(service.root, "skills", slug), backup = target + ".delete-" + crypto.randomUUID();
  let moved = false, committed = false;
  try {
    if (row.root) {
      if (path.resolve(row.root) !== path.resolve(target) || (await fs.lstat(target)).isSymbolicLink())
        throw Error("Skill 包路径越界");
      await fs.rename(target, backup); moved = true;
    }
    await saveFields(service, { skills: service.data.skills.filter(item => item.slug !== slug) }); committed = true;
    if (moved) await fs.rm(backup, { recursive: true, force: true });
    return true;
  } catch (error) {
    if (committed) throw Object.assign(Error("Skill 已删除，但文件清理失败: " + error.message), { committed: true, cause: error });
    try { if (moved) await fs.rename(backup, target); }
    catch (rollbackError) { throw new AggregateError([error, rollbackError], "Skill 删除失败且文件恢复不完整"); }
    throw error;
  }
}
async function uploadSkill(service, input) {
  if (typeof input.filename !== "string" || !/\.zip$/i.test(input.filename) ||
      path.basename(input.filename) !== input.filename) throw Error("仅支持 .zip Skill 包");
  if (typeof input.data !== "string" || input.data.length > Math.ceil(16 * 1024 * 1024 / 3) * 4 ||
      input.data.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(input.data))
    throw Error("Skill 压缩包编码无效或超过 16 MiB");
  const bytes = Buffer.from(input.data, "base64");
  if (!bytes.length || bytes.length > 16 * 1024 * 1024 || bytes.toString("base64") !== input.data) throw Error("Skill 压缩包尺寸无效");
  await fs.mkdir(service.root, { recursive: true, mode: 0o700 });
  const temporary = path.join(service.root, ".skill-upload-" + crypto.randomUUID());
  try {
    await fs.writeFile(temporary, bytes, { mode: 0o600 });
    const row = await installSkill(service, temporary);
    const description = row.content.match(/^description:\s*(.+)$/m)?.[1] || "";
    return { code: 0, data: {
      fileId: row.slug, ossUrl: "",
      sha512: crypto.createHash("sha512").update(bytes).digest("hex"),
      filename: input.filename, contentType: "application/zip", fileSize: bytes.length,
      packageSlug: row.slug, packageName: row.slug, packageDescription: description,
      skillMetadata: { name: row.slug, description },
      fileCount: row.files.length, files: row.files, skillMdPath: "SKILL.md",
    } };
  } finally { await fs.rm(temporary, { force: true }); }
}
module.exports = { installSkill, uploadSkill, removeSkill };

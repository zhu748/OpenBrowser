"use strict";
const fs = require("node:fs/promises"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  yauzl = require("yauzl");
async function importSkillArchive(file, root, commit) {
  const stat = await fs.stat(file);
  if (stat.size > 16 * 1024 * 1024) throw Error("Skill 压缩包不能超过 16 MiB");
  const archive = await fs.readFile(file);
  const entries = await new Promise((resolve, reject) =>
    yauzl.fromBuffer(
      archive,
      { lazyEntries: true, validateEntrySizes: true },
      (error, zip) => {
        if (error) return reject(error);
        const rows = [];
        let bytes = 0;
        zip.on("error", reject);
        zip.on("end", () => resolve(rows));
        zip.on("entry", (entry) => {
          const name = entry.fileName,
            mode = (entry.externalFileAttributes >>> 16) & 0xffff;
          if ((mode & 0xf000) === 0xa000) {
            zip.close();
            reject(Error("Skill 包不能包含符号链接"));
            return;
          }
          if (name.endsWith("/")) {
            zip.readEntry();
            return;
          }
          bytes += entry.uncompressedSize;
          if (rows.length >= 1000 || bytes > 64 * 1024 * 1024) {
            zip.close();
            reject(Error("Skill 包解压后过大"));
            return;
          }
          if (
            name.includes("\\") ||
            name.split("/").some((p) => p === "..") ||
            path.posix.isAbsolute(name) ||
            /^[a-z]:/i.test(name)
          ) {
            zip.close();
            reject(Error("Skill 包包含越界路径"));
            return;
          }
          zip.openReadStream(entry, (error, stream) => {
            if (error) {
              zip.close();
              reject(error);
              return;
            }
            const chunks = [];
            let actual = 0;
            stream.on("error", reject);
            stream.on("data", (chunk) => {
              actual += chunk.length;
              if (
                actual > entry.uncompressedSize ||
                actual > 64 * 1024 * 1024
              ) {
                stream.destroy(Error("Skill 文件尺寸不匹配"));
                return;
              }
              chunks.push(chunk);
            });
            stream.on("end", () => {
              rows.push({ name, data: Buffer.concat(chunks) });
              zip.readEntry();
            });
          });
        });
        zip.readEntry();
      },
    ),
  );
  const docs = entries.filter(
    (e) => path.posix.basename(e.name) === "SKILL.md",
  );
  if (docs.length !== 1) throw Error("Skill 包必须包含一个 SKILL.md");
  const doc = docs[0];
  if (doc.data.length > 200000) throw Error("SKILL.md 不能超过 200 KB");
  const content = doc.data.toString("utf8");
  const slug = content.match(
    /^name:\s*['"]?([a-z0-9][a-z0-9._-]{0,80})['"]?\s*$/im,
  )?.[1];
  if (!slug) throw Error("SKILL.md 缺少有效的 name");
  const prefix = path.posix.dirname(doc.name),
    base = prefix === "." ? "" : prefix + "/";
  if (entries.some((e) => !e.name.startsWith(base)))
    throw Error("Skill 文件必须位于 SKILL.md 所在的目录内");
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const temp = path.join(root, ".install-" + crypto.randomUUID()),
    target = path.join(root, slug),
    backup = target + ".backup-" + crypto.randomUUID();
  await fs.mkdir(temp, { mode: 0o700 });
  let backed = false;
  let installed = false;
  let committed = false;
  try {
    for (const e of entries) {
      const relative = e.name.slice(base.length);
      if (!relative) continue;
      const dest = path.join(temp, relative);
      if (!dest.startsWith(temp + path.sep)) throw Error("Skill 路径越界");
      await fs.mkdir(path.dirname(dest), { recursive: true, mode: 0o700 });
      await fs.writeFile(dest, e.data, { mode: 0o600 });
    }
    try {
      await fs.rename(target, backup);
      backed = true;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    try {
      await fs.rename(temp, target);
      installed = true;
    } catch (e) {
      throw e;
    }
    const row = {
      slug,
      content,
      root: target,
      files: entries.map((e) => e.name.slice(base.length)),
      enabled: true,
    };
    // Keep the old package until its metadata is durable, too.
    if (commit) await commit(row);
    committed = !!commit;
    if (backed) await fs.rm(backup, { recursive: true, force: true });
    return row;
  } catch (error) {
    if (committed) throw Object.assign(Error("Skill 已安装，但旧文件清理失败: " + error.message), { committed: true, cause: error });
    try {
      if (installed) await fs.rm(target, { recursive: true, force: true });
      if (backed) await fs.rename(backup, target);
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Skill 安装失败且文件恢复不完整");
    }
    throw error;
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}
module.exports = { importSkillArchive };

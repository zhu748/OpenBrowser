"use strict";
const fs = require("node:fs/promises"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  credentials = require("../credential-crypto");
const LIMIT = 10 * 1024 * 1024,
  TOTAL = 20 * 1024 * 1024;
function fileName(value) {
  if (
    typeof value !== "string" ||
    value.length > 500 ||
    !value ||
    value.includes("\\") ||
    value
      .split("/")
      .some(
        (part) =>
          !part || part === "." || part === ".." || /[\x00-\x1f]/.test(part),
      )
  )
    throw Error("附件名称无效");
  return value;
}
function mime(bytes) {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (/^GIF8[79]a/.test(bytes.subarray(0, 6).toString("ascii")))
    return "image/gif";
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!text.includes("\0")) return "text/plain";
  } catch {
    /* Binary files need a supported decoder; never pass mojibake as text. */
  }
  throw Error(
    "附件暂支持 UTF-8 文本和 PNG/JPEG/GIF/WebP 图片；此文件未发送给模型",
  );
}
class AgentFiles {
  constructor({ root, dialog, window }) {
    Object.assign(this, {
      root: path.join(root, "attachments"),
      dialog,
      window,
    });
    this.queue = Promise.resolve();
  }
  async load() {
    if (!this.loading)
      this.loading = (async () => {
        await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
        try {
          this.index = credentials.decryptCredentialJson(
            await fs.readFile(path.join(this.root, "index.enc")),
          );
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          this.index = { files: [], grants: {} };
        }
        if (
          !Array.isArray(this.index.files) ||
          !this.index.grants ||
          typeof this.index.grants !== "object"
        )
          throw Error("附件索引格式无效");
      })();
    return this.loading;
  }
  async commit(files, grant) {
    await this.load();
    if (this.closing) throw Error("附件服务正在关闭");
    const run = this.queue.then(async () => {
      const next = {
        files: [...this.index.files, ...files],
        grants: { ...this.index.grants, ...grant },
      };
      const temp = path.join(this.root, crypto.randomUUID() + ".tmp");
      try {
        await fs.writeFile(temp, credentials.encryptCredentialJson(next), {
          mode: 0o600,
        });
        await fs.rename(temp, path.join(this.root, "index.enc"));
      } finally {
        await fs.rm(temp, { force: true });
      }
      this.index = next;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  metadata(file) {
    return {
      fileId: file.fileId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      url: "obui://app/agent-files/" + file.fileId,
      localUrl: "obui://app/agent-files/" + file.fileId,
    };
  }
  async write(bytes, name) {
    if (this.closing) throw Error("附件服务正在关闭");
    fileName(name);
    if (bytes.length > LIMIT) throw Error("单个附件不能超过 10 MiB");
    const record = {
      fileId: crypto.randomUUID(),
      fileName: name,
      mimeType: mime(bytes),
      size: bytes.length,
    };
    await fs.writeFile(
      path.join(this.root, record.fileId + ".enc"),
      credentials.encryptCredentialJson({ data: bytes.toString("base64") }),
      { flag: "wx", mode: 0o600 },
    );
    return record;
  }
  async upload(p) {
    await this.load();
    if (
      typeof p.data !== "string" ||
      p.data.length > Math.ceil(LIMIT / 3) * 4 ||
      p.data.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(p.data)
    )
      throw Error("附件编码或大小无效");
    const bytes = Buffer.from(p.data, "base64");
    if (bytes.toString("base64") !== p.data) throw Error("附件编码无效");
    const record = await this.write(bytes, p.fileName);
    try {
      await this.commit([record]);
    } catch (error) {
      await fs.rm(path.join(this.root, record.fileId + ".enc"), {
        force: true,
      });
      throw error;
    }
    return this.metadata(record);
  }
  async choose() {
    await this.load();
    const choice = await this.dialog.showOpenDialog(this.window(), {
      properties: ["openFile"],
    });
    if (this.closing) throw Error("附件服务正在关闭");
    if (choice.canceled || !choice.filePaths?.[0]) return null;
    return this.importPath(choice.filePaths[0]);
  }
  async importPath(selected) {
    // Only called with the native picker result; renderer-supplied paths never
    // authorize reads. The stored grant names immutable encrypted snapshots.
    await this.load();
    const selectedStat = await fs.lstat(selected);
    if (
      selectedStat.isSymbolicLink() ||
      (!selectedStat.isFile() && !selectedStat.isDirectory())
    )
      throw Error("不能选择符号链接或特殊文件");
    const root = await fs.realpath(selected),
      entries = [];
    let size = 0,
      directories = 0;
    const walk = async (file, relative, depth) => {
      if (depth > 8 || ++directories > 500)
        throw Error("附件文件夹层级或条目过多");
      const stat = await fs.lstat(file);
      if (stat.isSymbolicLink()) throw Error("附件文件夹包含符号链接");
      const real = await fs.realpath(file);
      if (real !== root && !real.startsWith(root + path.sep))
        throw Error("附件路径越界");
      if (stat.isDirectory()) {
        for (const name of (await fs.readdir(file)).sort())
          await walk(
            path.join(file, name),
            relative ? relative + "/" + name : name,
            depth + 1,
          );
      } else {
        if (
          !stat.isFile() ||
          stat.size > LIMIT ||
          entries.length >= 100 ||
          (size += stat.size) > TOTAL
        )
          throw Error("附件最多 100 个文件、合计 20 MiB、单个 10 MiB");
        const handle = await fs.open(file, "r");
        try {
          const current = await handle.stat();
          if (
            current.dev !== stat.dev ||
            current.ino !== stat.ino ||
            current.size !== stat.size
          )
            throw Error("附件在读取期间发生变化，请重新选择");
          const bytes = Buffer.alloc(stat.size + 1),
            { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
          if (bytesRead !== stat.size)
            throw Error("附件在读取期间发生变化，请重新选择");
          entries.push({
            name: relative || path.basename(file),
            bytes: bytes.subarray(0, bytesRead),
          });
        } finally {
          await handle.close();
        }
      }
    };
    await walk(root, "", 0);
    if (!entries.length) throw Error("所选文件夹为空");
    // Validate all formats before writing even the first snapshot.
    for (const entry of entries) {
      mime(entry.bytes);
      fileName(entry.name);
    }
    const records = [];
    try {
      for (const entry of entries)
        records.push(await this.write(entry.bytes, entry.name));
      await this.commit(records, {
        [root]: records.map((record) => record.fileId),
      });
    } catch (error) {
      await Promise.all(
        records.map((record) =>
          fs.rm(path.join(this.root, record.fileId + ".enc"), { force: true }),
        ),
      );
      throw error;
    }
    return {
      path: root,
      type: selectedStat.isDirectory() ? "dir" : "file",
      name: path.basename(root),
      files: records.map((record) => this.metadata(record)),
    };
  }
  async get(id) {
    await this.load();
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id))
      throw Error("附件 ID 无效");
    const record = this.index.files.find((file) => file.fileId === id);
    if (!record) throw Error("附件不存在");
    const raw = credentials.decryptCredentialJson(
      await fs.readFile(path.join(this.root, id + ".enc")),
    );
    const bytes = Buffer.from(raw.data, "base64");
    if (
      bytes.length !== record.size ||
      bytes.length > LIMIT ||
      mime(bytes) !== record.mimeType
    )
      throw Error("附件校验失败");
    return { ...record, bytes };
  }
  async context(messages, provider) {
    await this.load();
    const ids = [
      ...new Set(
        messages.flatMap((message) =>
          (message.attachments || []).map((file) => file.fileId),
        ),
      ),
    ];
    const records = ids.map((id) =>
      this.index.files.find((file) => file.fileId === id),
    );
    if (records.some((file) => !file))
      throw Error("历史附件已丢失，请重新选择");
    const images = records.filter((file) => file.mimeType.startsWith("image/"));
    if (
      images.length > 8 ||
      images.reduce((sum, file) => sum + file.size, 0) > TOTAL
    )
      throw Error("当前上下文图片超过 8 张 / 20 MiB，请新建会话或减少附件");
    const data = new Map(
      await Promise.all(
        images.map(async (file) => [
          file.fileId,
          (await this.get(file.fileId)).bytes.toString("base64"),
        ]),
      ),
    );
    return messages.map(({ attachments, ...message }) => {
      if (!attachments?.length) return message;
      const text =
        message.content +
        "\n\n附件（使用 read_attachment 按 fileId 读取文本，不要根据文件名推断内容）：\n" +
        attachments
          .map(
            (file) =>
              `${file.fileName}: ${file.fileId} (${file.mimeType}, ${file.size} bytes)`,
          )
          .join("\n");
      const pictures = attachments.filter((file) => data.has(file.fileId));
      if (provider === "ollama")
        return {
          ...message,
          content: text,
          ...(pictures.length
            ? { images: pictures.map((file) => data.get(file.fileId)) }
            : {}),
        };
      return {
        ...message,
        content: pictures.length
          ? [
              { type: "text", text },
              ...pictures.map((file) => ({
                type: "image_url",
                image_url: {
                  url:
                    "data:" +
                    file.mimeType +
                    ";base64," +
                    data.get(file.fileId),
                },
              })),
            ]
          : text,
      };
    });
  }
  async read(p, allowed) {
    if (!allowed?.has(p.fileId)) throw Error("此附件不属于当前会话授权范围");
    const file = await this.get(p.fileId);
    if (file.mimeType.startsWith("image/"))
      return {
        fileName: file.fileName,
        mimeType: file.mimeType,
        imageAlreadyInContext: true,
      };
    const offset = p.offset ?? 0,
      length = p.length ?? 12000;
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(length) ||
      length < 1 ||
      length > 12000
    )
      throw Error("附件读取范围无效");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(file.bytes);
    return {
      fileName: file.fileName,
      offset,
      content: text.slice(offset, offset + length),
      totalCharacters: text.length,
      hasMore: offset + length < text.length,
    };
  }
  async resolve(payload) {
    await this.load();
    const ids = (payload.attachments || []).map((file) => file.fileId);
    for (const file of payload.localAttachments || []) {
      const grant = this.index.grants[file.localPath];
      if (!Array.isArray(grant))
        throw Error("附件路径没有原生选择授权，请重新选择文件");
      ids.push(...grant);
    }
    const unique = [...new Set(ids)];
    if (unique.length > 100) throw Error("最多 100 个附件");
    if (
      unique.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id))
    )
      throw Error("附件 ID 无效");
    const metadata = unique.map((id) =>
      this.index.files.find((file) => file.fileId === id),
    );
    if (metadata.some((file) => !file)) throw Error("附件不存在");
    if (metadata.reduce((sum, file) => sum + file.size, 0) > TOTAL)
      throw Error("附件合计不能超过 20 MiB");
    const files = await Promise.all(unique.map((id) => this.get(id)));
    if (files.reduce((sum, file) => sum + file.size, 0) > TOTAL)
      throw Error("附件合计不能超过 20 MiB");
    if (files.filter((file) => file.mimeType.startsWith("image/")).length > 8)
      throw Error("单次最多 8 张图片");
    return files.map((file) => this.metadata(file));
  }
  async export(p) {
    const url = new URL(p.filePath);
    if (
      url.protocol !== "obui:" ||
      url.hostname !== "app" ||
      url.username ||
      url.password ||
      url.port ||
      !url.pathname.startsWith("/agent-files/")
    )
      throw Error("仅能下载本地附件");
    const file = await this.get(url.pathname.slice(13));
    const picked = await this.dialog.showSaveDialog(this.window(), {
      defaultPath: path.basename(p.fileName || file.fileName),
    });
    if (picked.canceled || !picked.filePath) return { canceled: true };
    await fs.writeFile(picked.filePath, file.bytes);
    return { canceled: false, path: picked.filePath };
  }
}
module.exports = { AgentFiles, mime, fileName };

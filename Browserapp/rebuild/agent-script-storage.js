"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { writeRawAtomically } = require("../engine/state-storage");
const credentials = require("../credential-crypto");

const MAX_FILE = 10 * 1024 * 1024;
const MAX_OUTPUT = 20 * 1024 * 1024;
const MAX_NAMESPACE = 1024 * 1024;
const MAX_NAMESPACES = 20;
const queues = new Map();

function virtualPath(value, rootAllowed = false) {
  if (typeof value !== "string" || value.length > 300 || /[\\:\x00-\x1f]/.test(value))
    throw Error("脚本文件路径无效");
  const parts = value.split("/").filter(part => part && part !== ".");
  if ((!rootAllowed && !parts.length) || parts.some(part => part === ".."))
    throw Error("脚本路径必须位于任务输出目录");
  return parts.join("/");
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function csv({ columns, rows }) {
  if (!columns.length) return "";
  return [columns, ...rows.map(row => columns.map(key => Object.hasOwn(row, key) ? row[key] : ""))]
    .map(values => values.map(csvCell).join(",")).join("\n") + "\n";
}

function storePath(root, kind, name) {
  if (typeof name !== "string" || !name.trim() || name.length > 150 || /[/\\:\x00-\x1f]/.test(name) || /^\.{1,2}$/.test(name))
    throw Error("脚本存储名称无效");
  const key = createHash("sha256").update(kind + "\0" + name).digest("hex");
  return path.join(root, key + ".enc");
}

function serialized(key, operation) {
  const operationPromise = (queues.get(key) || Promise.resolve()).then(operation);
  const tail = operationPromise.catch(() => {});
  queues.set(key, tail);
  void tail.then(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });
  return operationPromise;
}

function createScriptStorage(root, signal) {
  const artifacts = new Map();
  const directories = new Set([""]);
  let bytes = 0;

  function store(file, data) {
    file = virtualPath(file);
    signal.throwIfAborted();
    const previous = artifacts.get(file);
    const size = bytes - (previous?.length || 0) + data.length;
    if (data.length > MAX_FILE || size > MAX_OUTPUT || (artifacts.size >= 100 && !artifacts.has(file)))
      throw Error("脚本文件超过输出限额");
    if (directories.has(file)) throw Error("输出路径是目录：" + file);
    ensureDirectory(path.posix.dirname(file));
    artifacts.set(file, data);
    bytes = size;
    return () => {
      if (artifacts.get(file) !== data) return;
      if (previous) artifacts.set(file, previous);
      else artifacts.delete(file);
      bytes += (previous?.length || 0) - data.length;
    };
  }

  function ensureDirectory(dir) {
    const parents = [];
    for (; dir && dir !== "."; dir = path.posix.dirname(dir)) {
      if (artifacts.has(dir)) throw Error("输出路径是文件：" + dir);
      parents.push(dir);
    }
    for (const parent of parents) directories.add(parent);
  }

  function read(file) {
    file = virtualPath(file);
    const value = artifacts.get(file);
    if (!value) throw Object.assign(Error("任务工作区文件不存在：" + file), { code: "ENOENT" });
    return value;
  }

  function file(method, [name, content, options]) {
    signal.throwIfAborted();
    const key = virtualPath(name, true);
    switch (method) {
      case "mkdir":
        return ensureDirectory(key);
      case "readFile": {
        const data = read(key);
        const encoding = typeof content === "string" ? content : content?.encoding;
        return encoding ? data.toString(encoding) : data;
      }
      case "writeFile":
      case "appendFile": {
        if (typeof content !== "string" && !Buffer.isBuffer(content)) throw Error("脚本文件内容必须为文本或字节");
        const next = Buffer.isBuffer(content) ? content : Buffer.from(content, typeof options === "string" ? options : options?.encoding);
        store(key, method === "appendFile" && artifacts.has(key) ? Buffer.concat([artifacts.get(key), next]) : next);
        return;
      }
      case "readdir": {
        if (!directories.has(key)) throw Error("任务工作区目录不存在：" + key);
        const prefix = key ? key + "/" : "";
        return [...new Set([...directories, ...artifacts.keys()].filter(p => p.startsWith(prefix) && p !== key)
          .map(p => p.slice(prefix.length).split("/")[0]))].sort();
      }
      case "exists": return artifacts.has(key) || directories.has(key);
      default: throw Error("脚本文件操作无效");
    }
  }

  function access(kind, [name, method, key, value]) {
    if (!root) throw Error("任务未关联本地脚本存储");
    const target = storePath(root, kind, name);
    return serialized(root, async () => {
      signal.throwIfAborted();
      let data, exists = true;
      try { data = credentials.decryptCredentialJson(await fs.readFile(target)); }
      catch (error) {
        if (error.code !== "ENOENT") throw error;
        exists = false;
        data = kind === "table" ? { columns: [], rows: [] } : {};
      }
      let result;
      if (kind === "table") {
        if (method === "all") return data.rows;
        if (method === "clear") data = { columns: [], rows: [] };
        else if (method === "append") {
          const rows = Array.isArray(key) ? key : [key];
          if (rows.some(row => !row || Array.isArray(row) || typeof row !== "object" ||
            Object.values(row).some(cell => cell !== null && typeof cell === "object")))
            throw Error("表格行必须是扁平的对象");
          if (!rows.length) return;
          if (!data.columns.length) data.columns = [...new Set(rows.flatMap(Object.keys))];
          if (!data.columns.length) return;
          for (const row of rows) data.rows.push(Object.fromEntries(data.columns.map(column =>
            [column, Object.hasOwn(row, column) ? row[column] : ""])));
        } else throw Error("无效的脚本表格操作");
      } else {
        if (["get", "has", "delete", "set"].includes(method) && (typeof key !== "string" || key.length > 512))
          throw Error("无效的脚本存储键");
        if (method === "keys") return Object.keys(data);
        if (method === "all") return data;
        if (method === "has") return Object.hasOwn(data, key);
        if (method === "get") return Object.hasOwn(data, key) ? data[key] : undefined;
        if (method === "clear") data = {};
        else if (method === "delete") {
          result = Object.hasOwn(data, key);
          if (!result) return false;
          delete data[key];
        } else if (method === "set") {
          if (value === undefined) throw Error("存储值必须为 JSON 数据");
          Object.defineProperty(data, key, { value, enumerable: true, configurable: true, writable: true });
        } else throw Error("无效的脚本存储操作");
      }

      const json = JSON.stringify(data);
      if (Buffer.byteLength(json) > MAX_NAMESPACE) throw Error("脚本存储空间超过 1 MiB");
      signal.throwIfAborted();
      await fs.mkdir(root, { recursive: true, mode: 0o700 });
      if (!exists && (await fs.readdir(root)).filter(file => /^[a-f0-9]{64}\.enc$/.test(file)).length >= MAX_NAMESPACES)
        throw Error("脚本模板最多保存 20 个表格和键值空间");
      signal.throwIfAborted();
      const safeName = name.replace(/[%<>\x22|?*]/g, character => "%" + character.charCodeAt(0).toString(16));
      const suffix = kind === "table" ? ".csv" : ".kv.json";
      // Reserve the export before committing shared state. A quota failure
      // must never report a failed write after persisting it.
      const rollback = store(safeName + suffix, Buffer.from(kind === "table" ? csv(data) : json));
      try { await writeRawAtomically(target, credentials.encryptCredentialJson(data)); }
      catch (error) { rollback(); throw error; }
      return result;
    });
  }

  return { access, file, read, store, artifacts };
}

module.exports = { createScriptStorage, virtualPath, MAX_FILE };

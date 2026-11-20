"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const credentials = require("../credential-crypto");
const { writeRawAtomically } = require("../engine/state-storage");
const { CHUNK_SIZE, shouldChunk, prepareMessageChunks, pageChunks } = require("./agent-message-chunks");
const { collectAttachmentIds } = require("./agent-attachment-references");

const FORMAT = "OpenBrowserAgentRecords", BASE_VERSION = 2, SEGMENTED_VERSION = 3;
const FIELDS = { conversation: ["messages", "checkpoint"], log: ["events", "messages", "checkpoint", "input"] };
const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const LAZY = Symbol("agent record");
const lanes = new Map();
const digest = text => crypto.createHash("sha256").update(text).digest("hex");
const fault = message => Object.assign(Error(message), { code: "AGENT_STORE_INVALID" });
const recordId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : 0;

function serialized(root, operation) {
  const previous = lanes.get(root) || Promise.resolve();
  const pending = previous.catch(() => {}).then(operation);
  lanes.set(root, pending);
  pending.finally(() => { if (lanes.get(root) === pending) lanes.delete(root); }).catch(() => {});
  return pending;
}

function metadata(record, fields) {
  return Object.fromEntries(Object.keys(record).filter(key => !fields.includes(key)).map(key => [key, record[key]]));
}

function validateManifest(value) {
  if (value.format !== FORMAT || ![BASE_VERSION, SEGMENTED_VERSION].includes(value.version) || value.state?.version !== 1)
    throw fault("Unsupported Agent record store");
  for (const kind of ["conversations", "logs"]) {
    if (!Array.isArray(value[kind])) throw fault("Invalid Agent record index");
    const ids = new Set();
    for (const entry of value[kind]) {
      if (!entry?.meta || typeof entry.meta.id !== "string" || !entry.meta.id || ids.has(entry.meta.id) ||
          !KEY.test(entry.body?.key || "") || !/^[a-f0-9]{64}$/.test(entry.body?.digest || "") ||
          !Array.isArray(entry.body.fields)) throw fault("Invalid or duplicate Agent record reference");
      const type = kind === "conversations" ? "conversation" : "log";
      if (new Set(entry.body.fields).size !== entry.body.fields.length || entry.body.fields.some(field => !FIELDS[type].includes(field)))
        throw fault("Invalid Agent record fields");
      if (Object.hasOwn(entry.body, "templateReference") &&
          (!Number.isSafeInteger(entry.body.templateReference) || entry.body.templateReference < 0))
        throw fault("Invalid Agent template reference");
      if (Object.hasOwn(entry.body, "messageChunks")) {
        const chunks = entry.body.messageChunks;
        if (type !== "conversation" || value.version !== SEGMENTED_VERSION || entry.body.fields.includes("messages") ||
            !Array.isArray(chunks) || chunks.some((chunk, i) => !KEY.test(chunk?.key || "") ||
              !/^[a-f0-9]{64}$/.test(chunk.digest || "") || chunk.fields?.length !== 1 || chunk.fields[0] !== "messages" ||
              !Array.isArray(chunk.ids) || !chunk.ids.length || chunk.ids.length > CHUNK_SIZE ||
              (i < chunks.length - 1 && chunk.ids.length !== CHUNK_SIZE) ||
              chunk.ids.some(id => id !== null && typeof id !== "string"))) {
          throw fault("Invalid Agent message index");
        }
      }
      ids.add(entry.meta.id);
    }
  }
  return value;
}

function references(index) {
  return [...index.conversations, ...index.logs].flatMap(({ body }) => [body, ...(body.messageChunks || [])]);
}

class AgentStateStore {
  constructor(root) {
    this.root = path.resolve(root);
    this.file = path.join(this.root, "state.enc");
    this.directory = path.join(this.root, "records");
    this.cache = new Map();
    this.raw = null;
    this.commits = 0;
    this.stats = { format: BASE_VERSION, bodyReads: 0, lastWrite: null };
  }

  async currentBytes() {
    try { return await fsp.readFile(this.file); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  }

  async load() {
    this.cache.clear();
    this.raw = await this.currentBytes();
    if (!this.raw) {
      const entries = await fsp.readdir(this.root).catch(error => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      const files = await fsp.readdir(this.directory).catch(error => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      const recovery = entries.some(name => name === "records.initialized" || name === "state.previous.enc" ||
        /^state\.legacy(?:-[a-f0-9-]+)?\.enc$/.test(name));
      if (recovery || files.length) throw fault("Agent index is missing; existing recovery records were preserved");
      return null;
    }
    const value = credentials.decryptCredentialJson(this.raw);
    this.base = JSON.stringify(value);
    if (value.version === 1 && value.format === undefined) { this.stats.format = 1; return value; }
    if (!credentials.isEncrypted(this.raw)) throw fault("Agent record index must be encrypted");
    const index = validateManifest(value);
    this.stats.format = index.version;
    const data = { ...index.state, conversations: [], logs: [] };
    for (const [kind, list] of [["conversation", index.conversations], ["log", index.logs]]) {
      for (const entry of list) {
        const item = { ...entry.meta };
        this.cache.set(kind + ":" + item.id, entry.body);
        this.lazyBody(item, kind, entry.body);
        data[kind === "conversation" ? "conversations" : "logs"].push(item);
      }
    }
    // Detect missing records at startup without decrypting every
    // historical body. Authentication is checked on demand, before use.
    await this.verifyFiles(index);
    return data;
  }

  lazyBody(item, kind, reference) {
    const materialize = () => {
      const body = this.readBody(kind, item.id, reference);
      for (const field of reference.fields)
        Object.defineProperty(item, field, { value: body[field], writable: true, enumerable: true, configurable: true });
    };
    for (const field of reference.fields) {
      const get = () => { materialize(); return item[field]; };
      get[LAZY] = reference.key;
      Object.defineProperty(item, field, { enumerable: true, configurable: true, get,
        set: value => { materialize(); item[field] = value; } });
    }
    if (reference.messageChunks) {
      const get = () => {
        const value = reference.messageChunks.flatMap(chunk => this.readBody("messages", item.id, chunk).messages);
        Object.defineProperty(item, "messages", { value, writable: true, enumerable: true, configurable: true });
        return value;
      };
      get[LAZY] = reference.key;
      Object.defineProperty(item, "messages", { enumerable: true, configurable: true, get,
        set: value => Object.defineProperty(item, "messages", { value, writable: true, enumerable: true, configurable: true }) });
    }
  }

  readBody(kind, owner, reference) {
    const file = this.recordPath(reference.key);
    const directory = fs.lstatSync(this.directory);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw fault("Invalid Agent records directory");
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw fault("Invalid Agent record file");
    const raw = fs.readFileSync(file);
    return this.decodeBody(kind, owner, reference, raw);
  }

  async readRecord(kind, owner, reference) {
    const file = this.recordPath(reference.key);
    const directory = await fsp.lstat(this.directory);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw fault("Invalid Agent records directory");
    const stat = await fsp.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw fault("Invalid Agent record file");
    return this.decodeBody(kind, owner, reference, await fsp.readFile(file));
  }

  decodeBody(kind, owner, reference, raw) {
    if (!credentials.isEncrypted(raw)) throw fault("Agent history record must be encrypted");
    const record = credentials.decryptCredentialJson(raw);
    if (record.version !== 1 || record.kind !== kind || record.owner !== owner || record.key !== reference.key ||
        !record.value || typeof record.value !== "object" || Array.isArray(record.value) ||
        digest(JSON.stringify(record.value)) !== reference.digest ||
        Object.keys(record.value).sort().join() !== [...reference.fields].sort().join())
      throw fault("Agent record authentication or identity check failed");
    if (kind === "messages" && (!Array.isArray(record.value.messages) ||
        record.value.messages.length !== reference.ids.length ||
        record.value.messages.some((row, i) => (typeof row?.id === "string" ? row.id : null) !== reference.ids[i]))) {
      throw fault("Agent message index does not match the record");
    }
    this.stats.bodyReads++;
    return record.value;
  }

  segmentedPage(conversation, cursor, limit) {
    const reference = this.cache.get("conversation:" + conversation.id);
    const getter = Object.getOwnPropertyDescriptor(conversation, "messages")?.get;
    if (!reference?.messageChunks || getter?.[LAZY] !== reference.key) return null;
    return pageChunks(reference.messageChunks, cursor, limit, chunk => this.readRecord("messages", conversation.id, chunk));
  }

  recordPath(key) {
    if (!KEY.test(key)) throw fault("Invalid Agent record key");
    return path.join(this.directory, key + ".enc");
  }

  eventCount(id) { return this.cache.get("log:" + id)?.eventCount || 0; }

  templateReference(conversation) {
    const descriptor = Object.getOwnPropertyDescriptor(conversation, "checkpoint");
    if (!descriptor) return 0;
    if (Object.hasOwn(descriptor, "value")) return recordId(descriptor.value?.taskMeta?.templateId);
    const key = "conversation:" + conversation.id, reference = this.cache.get(key);
    if (!reference) throw fault("Missing Agent template reference");
    if (Object.hasOwn(reference, "templateReference")) return reference.templateReference;
    // Older V2 indexes did not project this reference. Read it once without
    // materializing the conversation; the next index commit retains the result.
    const body = this.readBody("conversation", conversation.id, reference);
    const value = recordId(body.checkpoint?.taskMeta?.templateId);
    this.cache.set(key, { ...reference, templateReference: value });
    return value;
  }

  async verifyFiles(index) {
    const entries = references(index);
    if (!entries.length) return;
    const directory = await fsp.lstat(this.directory);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw fault("Invalid Agent records directory");
    const files = new Map((await fsp.readdir(this.directory, { withFileTypes: true })).map(entry => [entry.name, entry]));
    for (const entry of entries) {
      const file = files.get(entry.key + ".enc");
      if (!file?.isFile() || file.isSymbolicLink()) throw fault("Agent history record is missing; the index was preserved");
    }
  }

  prepare(data, scope) {
    const result = { format: FORMAT, version: Math.max(BASE_VERSION, this.stats.format),
      state: metadata(data, ["conversations", "logs"]), conversations: [], logs: [] };
    const records = [], cache = new Map();
    for (const [kind, collection] of [["conversation", "conversations"], ["log", "logs"]]) {
      const selected = scope ? new Set(scope[collection] || []) : null;
      const ids = new Set();
      for (const item of data[collection]) {
        if (typeof item.id !== "string" || !item.id || ids.has(item.id)) throw fault("Invalid or duplicate Agent record ID");
        ids.add(item.id);
        const old = this.cache.get(kind + ":" + item.id);
        const fields = FIELDS[kind].filter(field => Object.hasOwn(item, field));
        const lazyFields = old && old.fields.length + Number(Boolean(old.messageChunks));
        const lazy = old && fields.length === lazyFields &&
          fields.every(field => Object.getOwnPropertyDescriptor(item, field)?.get?.[LAZY] === old.key);
        let body = old;
        if (!old || !lazy && (!selected || selected.has(item.id))) {
          const value = Object.fromEntries(fields.map(field => [field, item[field]]));
          let text = "";
          let messageChunks;
          if (kind === "conversation" && Array.isArray(value.messages)) {
            if (!old?.messageChunks && value.messages.length <= 32) text = JSON.stringify(value);
            if (shouldChunk(value.messages, old?.messageChunks, text)) {
              const firstDirty = scope?.historyFrom?.get(item.id) || 0;
              messageChunks = prepareMessageChunks(value.messages, old?.messageChunks, firstDirty,
                (payload, previous) => this.planRecord(records, "messages", item.id, payload, previous));
              delete value.messages;
              text = "";
            }
          }
          body = this.planRecord(records, kind, item.id, value, old, text);
          if (messageChunks) body = { ...body, messageChunks };
          else if (body.messageChunks) { body = { ...body }; delete body.messageChunks; }
          if (kind === "conversation") body = { ...body, templateReference: recordId(value.checkpoint?.taskMeta?.templateId) };
        }
        if (body.messageChunks) result.version = SEGMENTED_VERSION;
        cache.set(kind + ":" + item.id, body);
        result[collection].push({ meta: metadata(item, FIELDS[kind]), body });
      }
    }
    return { text: JSON.stringify(result), records, cache, version: result.version };
  }

  planRecord(records, kind, owner, value, previous, text = "") {
    text ||= JSON.stringify(value);
    const hash = digest(text);
    if (previous?.digest === hash && Array.isArray(previous.attachmentIds)) return previous;
    const attachmentIds = [...collectAttachmentIds(value)];
    if (previous?.digest === hash) return { ...previous, attachmentIds };
    const reference = { key: crypto.randomUUID(), digest: hash,
      fields: Object.keys(value).filter(field => value[field] !== undefined),
      eventCount: Array.isArray(value.events) ? value.events.length : 0, attachmentIds };
    records.push({ kind, owner, reference, text });
    return reference;
  }

  save(data, scope) {
    // Freeze strings before the first I/O await. Live model events can mutate
    // shared arrays while encrypted records are being synced to disk.
    const plan = this.prepare(data, scope);
    return serialized(this.root, () => this.publish(plan));
  }

  async publish(plan) {
    await fsp.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const directory = await fsp.lstat(this.directory);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw fault("Invalid Agent records directory");
    const current = await this.currentBytes();
    if (!Buffer.from(current || []).equals(Buffer.from(this.raw || []))) {
      const text = current && JSON.stringify(credentials.decryptCredentialJson(current));
      if (text !== this.base) throw Object.assign(Error("Agent storage changed in another session; reload before saving"), { code: "AGENT_STORE_CHANGED" });
    }
    const written = [];
    let committed = false, bytes = 0, backupBytes = 0, migrating = false;
    try {
      for (const record of plan.records) {
        const file = this.recordPath(record.reference.key);
        const header = JSON.stringify({ version: 1, kind: record.kind, owner: record.owner, key: record.reference.key });
        const payload = credentials.encryptCredential(header.slice(0, -1) + ',"value":' + record.text + '}');
        await writeRawAtomically(file, payload);
        written.push(file); bytes += payload.length;
      }
      if (current) {
        const old = credentials.decryptCredentialJson(current);
        migrating = old.version === 1;
        const backup = old.version === 1 ? "state.legacy.enc" : "state.previous.enc";
        if (backup === "state.legacy.enc") backupBytes = await this.preserveLegacy(current);
        else { await writeRawAtomically(path.join(this.root, backup), current); backupBytes = current.length; }
      }
      const payload = credentials.encryptCredential(plan.text);
      await writeRawAtomically(this.file, payload);
      committed = true;
      this.raw = payload; this.base = plan.text; this.cache = plan.cache;
      this.stats.format = plan.version;
      this.stats.lastWrite = { records: written.length, recordBytes: bytes, indexBytes: payload.length, backupBytes };
      if (!this.initialized) {
        try { await writeRawAtomically(path.join(this.root, "records.initialized"), "Agent records v2\n"); this.initialized = true; }
        catch (error) { this.stats.maintenanceError = error.code || "AGENT_RECORD_MARKER_FAILED"; }
      }
      if (++this.commits % 32 === 0 || migrating) {
        try { await this.collectNow(); }
        catch (error) { this.stats.maintenanceError = error.code || "AGENT_RECORD_CLEANUP_FAILED"; }
      }
    } finally {
      if (!committed) await Promise.all(written.map(file => fsp.rm(file, { force: true }).catch(() => {})));
    }
  }

  async preserveLegacy(raw) {
    let file = path.join(this.root, "state.legacy.enc");
    const bytes = credentials.isEncrypted(raw) ? raw : credentials.encryptCredential(raw);
    try {
      const previous = await fsp.readFile(file);
      if (previous.equals(bytes)) return 0;
      file = path.join(this.root, "state.legacy-" + crypto.randomUUID() + ".enc");
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    await writeRawAtomically(file, bytes);
    return bytes.length;
  }

  collect() { return serialized(this.root, () => this.collectNow()); }

  attachmentReferences() {
    return serialized(this.root, async () => {
      const names = await fsp.readdir(this.root);
      const snapshots = names.filter(name => /^(state|state\.previous|state\.legacy(?:-[a-f0-9-]+)?)\.enc$/.test(name));
      if (!snapshots.includes("state.enc") && (this.raw || snapshots.length)) throw fault("Agent index is missing");
      const attached = new Set(), visited = new Set();
      const visit = async (kind, id, reference) => {
        if (visited.has(reference.key)) return;
        visited.add(reference.key);
        if (Array.isArray(reference.attachmentIds)) {
          for (const fileId of reference.attachmentIds) attached.add(fileId);
        } else {
          collectAttachmentIds(await this.readRecord(kind, id, reference), attached);
        }
      };
      for (const name of snapshots) {
        const raw = await fsp.readFile(path.join(this.root, name));
        const value = credentials.decryptCredentialJson(raw);
        if (value.version === 1 && value.format === undefined) { collectAttachmentIds(value, attached); continue; }
        const index = validateManifest(value);
        for (const [kind, rows] of [["conversation", index.conversations], ["log", index.logs]]) {
          for (const { meta, body } of rows) {
            await visit(kind, meta.id, body);
            for (const chunk of body.messageChunks || []) await visit("messages", meta.id, chunk);
          }
        }
      }
      return attached;
    });
  }

  async collectNow() {
    const keep = new Set();
    for (const name of ["state.enc", "state.previous.enc"]) {
      let raw;
      try { raw = await fsp.readFile(path.join(this.root, name)); }
      catch (error) { if (error.code === "ENOENT") continue; throw error; }
      const index = credentials.decryptCredentialJson(raw);
      if (index.version === 1) continue;
      validateManifest(index);
      for (const reference of references(index)) keep.add(reference.key + ".enc");
    }
    for (const entry of await fsp.readdir(this.directory, { withFileTypes: true })) {
      if (!entry.isFile() || !KEY.test(entry.name.slice(0, -4)) || !entry.name.endsWith(".enc") || keep.has(entry.name)) continue;
      await fsp.rm(path.join(this.directory, entry.name));
    }
  }
}

module.exports = { AgentStateStore };

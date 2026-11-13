'use strict';

const fs = require('node:fs/promises');
const credentialCrypto = require('../credential-crypto');
const { writeJsonAtomically } = require('../engine/state-storage');
const LIMIT = 16 * 1024 * 1024;

function checkedRecords(values) {
  if (!Array.isArray(values) || values.length > 5000) throw new Error('转移记录列表无效');
  let size = 0;
  const seen = new Set();
  return values.map((value) => {
    if (!value || typeof value !== 'object' || !/^[A-Za-z0-9_-]{1,100}$/.test(value.id || '')) throw new Error('转移记录 ID 无效');
    if (typeof value.transferCode !== 'string' || value.transferCode.length > LIMIT) throw new Error('转移记录内容无效或过大');
    if (seen.has(value.id)) throw new Error('转移记录 ID 重复');
    seen.add(value.id);
    const serialized = JSON.stringify(value);
    size += Buffer.byteLength(serialized);
    if (size > LIMIT) throw new Error('转移记录超过 16 MiB，请先移除不再需要的记录');
    return JSON.parse(serialized);
  });
}

class TransferStore {
  constructor(file) { this.file = file; this.records = new Map(); this.queue = Promise.resolve(); this.loadError = null; }
  async load() {
    try { await this.read(); this.loadError = null; }
    catch (cause) {
      this.loadError = Object.assign(new Error('转移记录无法读取，原文件已保留，请修复后重启', { cause }), { code: 'TRANSFER_STORE_UNAVAILABLE' });
      throw this.loadError;
    }
  }
  async read() {
    let raw;
    try { raw = await fs.readFile(this.file); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    const body = JSON.parse(credentialCrypto.isEncrypted(raw) ? credentialCrypto.decryptCredential(raw) : raw.toString('utf8'));
    if (body.version !== 1) throw new Error('转移记录文件版本无效');
    const records = checkedRecords(body.records);
    if (!credentialCrypto.isEncrypted(raw)) await writeJsonAtomically(this.file, { version: 1, records });
    this.records = new Map(records.map((value) => [value.id, value]));
  }
  list() { if (this.loadError) throw this.loadError; return structuredClone([...this.records.values()]); }
  change(update) {
    const operation = this.queue.then(async () => {
      if (this.loadError) throw this.loadError;
      const records = new Map(this.records);
      update(records);
      const values = checkedRecords([...records.values()]);
      await writeJsonAtomically(this.file, { version: 1, records: values });
      this.records = new Map(values.map((value) => [value.id, value]));
      return this.list();
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
  import(values) {
    const records = checkedRecords(values);
    return this.change((next) => { for (const value of records) if (!next.has(value.id)) next.set(value.id, value); });
  }
  remove(id) { return this.change((next) => { next.delete(String(id)); }); }
  flush() { return this.queue; }
}

module.exports = { TransferStore };

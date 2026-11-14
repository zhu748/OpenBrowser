'use strict';

const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const credentialCrypto = require('../credential-crypto');
const { writeJsonAtomically } = require('../engine/state-storage');

const MAX_ACCOUNTS = 5000;
const FIELDS = ['platform', 'url', 'name', 'username', 'password', 'totpSecret', 'remark', 'createdAt'];

function normalizeAccount(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('账号格式无效');
  const id = value.id == null ? 'acc-' + crypto.randomUUID() : String(value.id);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('账号 ID 无效');
  const result = { id };
  for (const key of FIELDS) {
    if (value[key] != null && typeof value[key] !== 'string') throw new Error('账号字段无效：' + key);
    const text = value[key] || '';
    if (text.length > (key === 'remark' ? 20000 : 4096)) throw new Error('账号字段过长：' + key);
    result[key] = text;
  }
  if (!result.username.trim()) throw new Error('请输入账号用户名');
  if (result.url) {
    const url = new URL(result.url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('平台网址无效');
  }
  result.createdAt ||= new Date().toISOString();
  return result;
}

function redactAccount({ password, totpSecret, ...metadata }) {
  return { ...metadata, hasPassword: Boolean(password), hasTotpSecret: Boolean(totpSecret) };
}

class AccountStore {
  constructor(file) {
    this.file = file;
    this.accounts = new Map();
    this.queue = Promise.resolve();
    this.loadError = null;
  }

  async load() {
    try { await this.read(); this.loadError = null; }
    catch (cause) {
      this.loadError = Object.assign(new Error('账号库无法读取，原文件已保留，请修复后重启', { cause }), { code: 'ACCOUNT_STORE_UNAVAILABLE' });
      throw this.loadError;
    }
  }

  async read() {
    let raw;
    try { raw = await fs.readFile(this.file); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    // Never overwrite an unreadable credential file with an empty account list.
    const text = credentialCrypto.isEncrypted(raw) ? credentialCrypto.decryptCredential(raw) : raw.toString('utf8');
    const body = JSON.parse(text);
    if (body.version !== 1 || !Array.isArray(body.accounts) || body.accounts.length > MAX_ACCOUNTS) throw new Error('账号库格式无效');
    const accounts = body.accounts.map(normalizeAccount);
    if (new Set(accounts.map((a) => a.id)).size !== accounts.length) throw new Error('账号 ID 重复');
    if (!credentialCrypto.isEncrypted(raw)) await writeJsonAtomically(this.file, { version: 1, accounts });
    this.accounts = new Map(accounts.map((account) => [account.id, account]));
  }

  list() { if (this.loadError) throw this.loadError; return [...this.accounts.values()].map(redactAccount); }

  get(id) {
    if (this.loadError) throw this.loadError;
    const account = this.accounts.get(String(id));
    if (!account) throw new Error('账号不存在');
    return { ...account };
  }

  mutate(change) {
    const operation = this.queue.then(async () => {
      if (this.loadError) throw this.loadError;
      const next = new Map(this.accounts);
      const transaction = await change(next);
      try {
        if (next.size > MAX_ACCOUNTS) throw new Error('账号数量超过 5000 条');
        await writeJsonAtomically(this.file, { version: 1, accounts: [...next.values()] });
      }
      catch (error) {
        try { await transaction?.rollback?.(); }
        catch (rollbackError) { throw new AggregateError([error, rollbackError], '账号保存失败且窗口关联回滚失败，请检查关联状态'); }
        throw error;
      }
      this.accounts = next;
      return this.list();
    });
    this.queue = operation.catch(() => {});
    return operation;
  }

  import(values) {
    if (!Array.isArray(values) || values.length > MAX_ACCOUNTS) return Promise.reject(new Error('账号列表无效或超过 5000 条'));
    // Clone and validate before queuing: callers cannot mutate a pending write.
    const accounts = values.map(normalizeAccount);
    const unspecifiedDates = new Set(accounts.filter((_account, index) => !values[index].createdAt).map((account) => account.id));
    if (new Set(accounts.map((a) => a.id)).size !== accounts.length) return Promise.reject(new Error('账号 ID 重复'));
    return this.mutate((next) => {
      for (const account of accounts) {
        const existing = next.get(account.id);
        if (existing && unspecifiedDates.has(account.id)) account.createdAt = existing.createdAt;
        if (existing && JSON.stringify(existing) !== JSON.stringify(account)) throw new Error('账号 ID 冲突：' + account.id);
        next.set(account.id, account);
      }
    });
  }

  remove(id) { return this.mutate((next) => { next.delete(String(id)); }); }
  flush() { return this.queue; }
}

module.exports = { AccountStore, normalizeAccount, redactAccount };

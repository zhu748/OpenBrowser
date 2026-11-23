'use strict';

const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
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

function unavailable(cause) {
  return Object.assign(new Error('账号库无法读取，原文件已保留，请修复后重启', { cause }), { code: 'ACCOUNT_STORE_UNAVAILABLE' });
}

async function confirmAbsentAccountStore(file) {
  const name = path.basename(file);
  const backup = name + '.bak';
  const entries = await fs.readdir(path.dirname(file)).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  // Existing recovery evidence is not authoritative data to replay, but it
  // does rule out a new empty library. Inspect names, not their contents.
  if (entries.some(entry => entry === name || entry === backup ||
    entry.startsWith(name + '.tmp-') || entry.startsWith(backup + '.tmp-')))
    throw new Error('发现账号库文件、备份或暂存，无法确认是空库');
}

class AccountStore {
  constructor(file, { recoverProfileChanges } = {}) {
    this.file = file;
    this.recoverProfileChanges = recoverProfileChanges;
    this.accounts = new Map();
    this.queue = Promise.resolve();
    this.loadError = null;
    this.checkFirstWrite = false;
  }

  async load() {
    try { await this.read(); this.loadError = null; }
    catch (cause) {
      this.loadError = unavailable(cause);
      throw this.loadError;
    }
  }

  async read() {
    let raw;
    try { raw = await fs.readFile(this.file); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await confirmAbsentAccountStore(this.file);
      this.checkFirstWrite = true;
      return;
    }
    // Never overwrite an unreadable credential file with an empty account list.
    const text = credentialCrypto.isEncrypted(raw) ? credentialCrypto.decryptCredential(raw) : raw.toString('utf8');
    const body = JSON.parse(text);
    if (body.version !== 1 || !Array.isArray(body.accounts) || body.accounts.length > MAX_ACCOUNTS) throw new Error('账号库格式无效');
    const accounts = body.accounts.map(normalizeAccount);
    if (new Set(accounts.map((a) => a.id)).size !== accounts.length) throw new Error('账号 ID 重复');
    const pending = Object.hasOwn(body, 'pendingProfileChanges');
    if (pending) {
      if (!this.recoverProfileChanges) throw new Error('账号库需要恢复窗口关联');
      await this.recoverProfileChanges(body.pendingProfileChanges);
    }
    if (pending || !credentialCrypto.isEncrypted(raw)) await writeJsonAtomically(this.file, { version: 1, accounts });
    this.accounts = new Map(accounts.map((account) => [account.id, account]));
    this.checkFirstWrite = false;
  }

  list() { if (this.loadError) throw this.loadError; return [...this.accounts.values()].map(redactAccount); }

  get(id) {
    if (this.loadError) throw this.loadError;
    const account = this.accounts.get(String(id));
    if (!account) throw new Error('账号不存在');
    return { ...account };
  }

  runExclusive(change) {
    const operation = this.queue.then(async () => {
      if (this.loadError) throw this.loadError;
      return change();
    });
    this.queue = operation.catch(() => {});
    return operation;
  }

  mutate(change) {
    return this.runExclusive(async () => {
      const next = new Map(this.accounts);
      const transaction = await change(next);
      if (next.size > MAX_ACCOUNTS) throw new Error('账号数量超过 5000 条');
      const previous = { version: 1, accounts: [...this.accounts.values()] };
      const journalFile = this.file;
      if (this.checkFirstWrite) {
        // Load may have admitted a virgin library well before the first save.
        // Recheck inside this store's queue, without claiming cross-process CAS.
        try { await confirmAbsentAccountStore(journalFile); }
        catch (cause) { this.loadError = unavailable(cause); throw this.loadError; }
      }
      if (transaction) {
        // One atomic replacement later commits the new account rows and removes this journal.
        await writeJsonAtomically(journalFile, { ...previous, pendingProfileChanges: transaction.journal });
      }
      try {
        await transaction?.apply();
        await writeJsonAtomically(this.file, { version: 1, accounts: [...next.values()] });
      }
      catch (error) {
        if (!transaction) throw error;
        let conflicts;
        try {
          conflicts = await transaction.rollback();
          await writeJsonAtomically(journalFile, previous);
        } catch (rollbackError) {
          this.loadError = new AggregateError([error, rollbackError], '账号保存失败，重启后将尝试恢复窗口关联');
          this.loadError.code = 'ACCOUNT_STORE_RECOVERY_PENDING';
          throw this.loadError;
        }
        if (conflicts.length) throw Object.assign(new AggregateError([error], '账号保存失败，已保留其他编辑器的关联修改'), { remainingIds: conflicts });
        throw error;
      }
      this.accounts = next;
      this.checkFirstWrite = false;
      return this.list();
    });
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

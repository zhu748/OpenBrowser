'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { AccountStore } = require('../account-store');
const { TransferStore } = require('../transfer-store');
const crypto = require('../../credential-crypto');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-account-store-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  crypto.resetLocalMasterKeyCache();
  const file = path.join(root, 'accounts.enc');
  const account = { id: 'a', username: 'test@example.test', password: 'PASSWORD_SENTINEL', totpSecret: 'TOTP_SENTINEL', remark: 'comma, quote" and\nnewline', url: 'https://example.test' };
  try {
    const store = new AccountStore(file);
    await store.load();
    assert.deepEqual(store.list(), []);
    const rows = await store.import([account]);
    assert.equal(rows[0].hasPassword, true);
    assert.equal(rows[0].hasTotpSecret, true);
    assert.equal(rows[0].password, undefined);
    assert.equal(rows[0].totpSecret, undefined);
    const migrationStore = new AccountStore(path.join(root, 'idempotent.enc'));
    await migrationStore.import([{ ...account, createdAt: '2000-01-01T00:00:00.000Z' }]);
    await migrationStore.import([account]);
    assert.equal(migrationStore.get(account.id).createdAt, '2000-01-01T00:00:00.000Z', 'retrying a legacy import without a timestamp is idempotent');
    const raw = await fs.readFile(file);
    assert.ok(crypto.isEncrypted(raw));
    assert.ok(!raw.includes(Buffer.from(account.password)));
    assert.ok(!raw.includes(Buffer.from(account.totpSecret)));
    const reloaded = new AccountStore(file);
    await reloaded.load();
    assert.equal(reloaded.get('a').password, account.password);
    assert.equal(reloaded.get('a').remark, account.remark);
    await Promise.all([reloaded.import([{ id: 'b', username: 'b' }]), reloaded.import([{ id: 'c', username: 'c' }])]);
    assert.equal(reloaded.list().length, 3, 'overlapping imports cannot overwrite one another');
    await reloaded.remove('b');
    assert.equal(reloaded.list().length, 2);
    const transferFile = path.join(root, 'transfers.enc');
    const transfers = new TransferStore(transferFile);
    const transfer = { id: 'transfer-a', transferCode: 'OBTRF1:TRANSFER_SECRET_SENTINEL', snapshot: { cookies: 'COOKIE_SENTINEL' } };
    await transfers.load();
    await transfers.import([transfer]);
    assert.throws(() => transfers.import([transfer, transfer]), /ID 重复/);
    const transferBytes = await fs.readFile(transferFile);
    assert.ok(crypto.isEncrypted(transferBytes));
    assert.ok(!transferBytes.includes(Buffer.from('TRANSFER_SECRET_SENTINEL')));
    assert.ok(!transferBytes.includes(Buffer.from('COOKIE_SENTINEL')));
    const history = new TransferStore(transferFile);
    await history.load();
    assert.deepEqual(history.list(), [transfer]);
    await history.remove(transfer.id);
    assert.deepEqual(history.list(), []);
    const badFile = path.join(root, 'not-a-directory');
    await fs.writeFile(badFile, 'keep');
    const failing = new AccountStore(path.join(badFile, 'accounts.enc'));
    await assert.rejects(failing.import([account]));
    assert.deepEqual(failing.list(), [], 'failed writes never publish accounts');
    const corrupt = Buffer.from('corrupt credential file');
    await fs.writeFile(file, corrupt);
    const damaged = new AccountStore(file);
    await assert.rejects(damaged.load());
    await assert.rejects(damaged.import([account]), { code: 'ACCOUNT_STORE_UNAVAILABLE' });
    assert.deepEqual(await fs.readFile(file), corrupt, 'unreadable credentials remain recoverable');
    const optionalFile = path.join(root, 'platform-accounts.enc');
    await fs.writeFile(optionalFile, corrupt);
    const { startAutomation } = require('../index');
    let recovered = false;
    const stack = await startAutomation({ app: { getPath: () => root, getVersion: () => '1.0.0' },
      engine: { profiles: new Map(), running: new Map(), status: () => [], setProxyStore: async () => {} }, port: 0,
      beforeApiStart: async () => { recovered = true; } });
    try {
      assert.equal(recovered, true, 'optional stores cannot prevent restore recovery');
      assert.ok(stack.info.port > 0, 'unrelated local API remains available');
      assert.throws(() => stack.accountStore.list(), { code: 'ACCOUNT_STORE_UNAVAILABLE' });
      await assert.rejects(stack.accountStore.import([account]), { code: 'ACCOUNT_STORE_UNAVAILABLE' });
      assert.deepEqual(await fs.readFile(optionalFile), corrupt);
    } finally { await stack.stop(); }
    const { createCsvParser, csvCell, reversibleCsvCell, decodeReversibleCsvCell } = require('../../shared/csv');
    const source = [account.username, account.password, account.remark].map(csvCell).join(',');
    const decoded = [];
    const parser = createCsvParser((row) => decoded.push(row));
    parser.write(source); parser.end();
    assert.deepEqual(decoded, [[account.username, account.password, account.remark]]);
    assert.ok(csvCell('=1+1').includes("'=1+1"));
    const special = ['=1+1', '+password', '-pass', '@pass', "'=literal", "'literal", "''literal", 'ordinary'];
    const cells = [];
    const safeParser = createCsvParser((row) => cells.push(...row));
    safeParser.write(special.map(reversibleCsvCell).join(',')); safeParser.end();
    assert.deepEqual(cells.map(decodeReversibleCsvCell), special, 'spreadsheet safety must preserve exact credential values on reimport');
    console.log('ACCOUNT_STORE_SELFTEST OK (encrypted disk, redacted list, restart, concurrency, failure rollback, corrupt preservation, CSV roundtrip)');
  } finally {
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = previousKey;
    crypto.resetLocalMasterKeyCache();
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

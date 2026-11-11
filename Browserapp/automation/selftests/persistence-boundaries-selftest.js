'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ProxyStore } = require('../proxy-store');
const { RpaStore } = require('../rpa-store');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-persistence-boundaries-'));
  const failures = [];
  async function check(name, run) {
    try { await run(); console.log('ok  ' + name); }
    catch (error) { failures.push(error); console.error('FAIL ' + name + ': ' + error.message); }
  }
  try {
    const file = path.join(root, 'proxies.json');
    const store = new ProxyStore(file, { encrypted: false });
    await store.load();
    await store.create({ id: 'proxy', raw: 'http://proxy.test:8080' });
    await check('flush persists checks still waiting for setImmediate', async () => {
      const update = store.markCheck('proxy', { ip: '192.0.2.1' });
      try {
        await store.flush();
        assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).items[0].lastIp, '192.0.2.1');
      } finally { await update; }
    });
    await check('flush drains checks arriving during a write', async () => {
      const persist = store._persistData;
      let trailing, once = true;
      store._persistData = async function (...args) {
        if (once) { once = false; trailing = this.markCheck('proxy', { ip: '192.0.2.3' }); }
        return persist.apply(this, args);
      };
      const update = store.markCheck('proxy', { ip: '192.0.2.2' });
      try {
        await store.flush();
        assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).items[0].lastIp, '192.0.2.3');
      } finally { await update; await trailing; store._persistData = persist; }
    });
    await check('flush propagates a pending check write failure and later mutations recover', async () => {
      const persist = store._persistData;
      store._persistData = async () => { throw new Error('check persistence failed'); };
      const update = store.markCheck('proxy', { ip: '192.0.2.4' }).catch((error) => error);
      try { await assert.rejects(store.flush(), /check persistence failed/); }
      finally { await update; store._persistData = persist; }
      await store.update('proxy', { name: 'recovered' });
      await store.flush();
      assert.equal(store.get('proxy').name, 'recovered');
    });
    await check('missing check IDs reject individually including the empty string', async () => {
      const missing = store.markCheck('', {}).then(() => null, (error) => error);
      const valid = store.markCheck('proxy', { ip: '192.0.2.5' });
      const [error, result] = await Promise.all([missing, valid]);
      assert.match(error?.message || '', /代理不存在/);
      assert.equal(result.lastIp, '192.0.2.5');
    });

    await check('RPA quit flush includes an edit arriving during file replacement', async () => {
      const target = path.join(root, 'rpa-drain.json');
      const rpa = new RpaStore(target);
      const rename = fs.rename;
      let trailing, once = true;
      fs.rename = async (...args) => {
        if (args[1] === target && once) {
          once = false;
          rpa.data.config.marker = 'trailing';
          trailing = rpa.save();
        }
        return rename(...args);
      };
      const first = rpa.save();
      try {
        await rpa.flush();
        const saved = JSON.parse(await fs.readFile(target, 'utf8'));
        assert.equal(saved.config.marker, 'trailing');
      } finally { await first; await trailing; fs.rename = rename; }
    });

    for (const kind of ['proxy', 'rpa']) {
      await check(`${kind} closes directory handles after unsupported fsync`, async () => {
        const open = fs.open;
        let closed = 0;
        fs.open = async (...args) => {
          if (args[0] === root && args[1] === 'r') return {
            sync: async () => { throw Object.assign(new Error('unsupported fsync'), { code: 'EINVAL' }); },
            close: async () => { closed += 1; },
          };
          return open.apply(fs, args);
        };
        const target = path.join(root, kind + '-directory.json');
        try {
          if (kind === 'proxy') await store._writeAtomic(target, '{}');
          else await new RpaStore(target)._writeAtomic();
          JSON.parse(await fs.readFile(target, 'utf8'));
          assert.equal(closed, 1, 'every opened directory handle must close');
        } finally { fs.open = open; }
      });
    }
  } finally { await fs.rm(root, { recursive: true, force: true }); }
  assert.equal(failures.length, 0, `${failures.length} persistence boundary checks failed`);
  console.log('PERSISTENCE_BOUNDARIES_SELFTEST OK');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

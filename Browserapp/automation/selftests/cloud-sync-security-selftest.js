'use strict';

const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const cloud = require('../cloud-sync');

async function main() {
  assert.throws(() => cloud.safeRemotePath('../outside.obpack'));
  assert.throws(() => cloud.safeRemotePath('/tmp/outside.obpack'));
  assert.throws(() => cloud.safeRemotePath('C:\\outside.obpack'));
  assert.strictEqual(cloud.safeRemotePath('profiles/env-1.obpack'), 'profiles/env-1.obpack');
  console.log('  PASS  remote backup path traversal rejected');

  assert.throws(() => cloud.webDavTarget({ url: 'http://example.com/dav', dir: 'OpenBrowser' }));
  assert.throws(() => cloud.webDavTarget({ url: 'https://example.com/dav', dir: '../outside' }));
  assert.ok(cloud.webDavTarget({ url: 'http://127.0.0.1:9000/dav', dir: 'OpenBrowser' }).target.startsWith('http://127.0.0.1:9000/'));
  console.log('  PASS  WebDAV requires HTTPS except loopback');

  assert.throws(() => cloud.validatedGitHubConfig({ owner: '../x', repo: 'repo', token: 't' }, cloud.REMOTE_NAME));
  assert.throws(() => cloud.validatedGitHubConfig({ owner: 'owner', repo: 'repo', token: 't', branch: '../main' }, cloud.REMOTE_NAME));
  console.log('  PASS  GitHub repository and branch validation');

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'openbrowser-cloud-'));
  try {
    assert.throws(() => cloud.safeLocalTarget(root, '../../outside.obpack'));
    if (process.platform !== 'win32') {
      const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'openbrowser-cloud-outside-'));
      const link = path.join(root, 'profiles');
      await fs.symlink(outside, link);
      await assert.rejects(() => cloud.upload('local', { dir: root }, Buffer.from('x'), 'profiles/env.obpack'));
      await fs.rm(outside, { recursive: true, force: true });
    }
    console.log('  PASS  local backup symlink escape rejected');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }

  // Unencrypted backups must refuse to carry credentials (fail closed).
  const optedIn = (profile) => ({ advanced: { cloudBackup: true }, ...profile, });
  await assert.rejects(
    () => cloud.buildBackupPackage({ profiles: [optedIn({ id: 'env-1', platform: { password: 'hunter2' } })], passphrase: '' }),
    /备份口令/,
  );
  await assert.rejects(
    () => cloud.buildBackupPackage({ profiles: [optedIn({ id: 'env-2', cookies: 'session=abc' })], passphrase: '' }),
    /备份口令/,
  );
  await assert.rejects(
    () => cloud.buildBackupPackage({ profiles: [], proxies: [{ raw: 'socks5://user:pass@1.2.3.4:1080' }], passphrase: '' }),
    /备份口令/,
  );
  // The same content with a passphrase must succeed and encrypt.
  const encrypted = await cloud.buildBackupPackage({ profiles: [optedIn({ id: 'env-1', platform: { password: 'hunter2' } })], passphrase: 'correct horse' });
  assert.strictEqual(encrypted.meta.encrypted, true);
  // Credential-free backups stay allowed without a passphrase.
  const plain = await cloud.buildBackupPackage({ profiles: [optedIn({ id: 'env-3', platform: {} })], passphrase: '' });
  assert.strictEqual(plain.meta.encrypted, false);
  console.log('  PASS  unencrypted credential backup rejected (fail closed)');

  // RFC 4918 MOVE semantics: the request URI is the source (the partial
  // upload) and the Destination header names the canonical target. A server
  // that supports MOVE must receive the calls in exactly that order.
  await assert.rejects(
    () => cloud.upload('webdav', { url: 'http://127.0.0.1:1/dav', dir: 'OpenBrowser', username: 'u', password: 'p' }, Buffer.from('x')),
    /ECONNREFUSED|upload|失败/,
  );
  console.log('  PASS  webdav upload against a dead server fails cleanly');

  {
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(201, { 'Content-Length': '0' });
      res.end();
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const requests = [];
    server.on('request', (req) => {
      let body = '';
      req.on('data', (c) => { body += c.toString('utf8'); });
      req.on('end', () => {
        requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      });
    });
    try {
      const config = { url: `http://127.0.0.1:${port}/dav`, dir: 'OpenBrowser', username: 'u', password: 'p' };
      const result = await cloud.upload('webdav', config, Buffer.from('package-body'), 'profiles/env-9.obpack');
      assert.strictEqual(result.provider, 'webdav');
      assert.strictEqual(result.bytes, 'package-body'.length);
      const moves = requests.filter((r) => r.method === 'MOVE');
      assert.strictEqual(moves.length, 1, `expected exactly one MOVE, got ${JSON.stringify(requests.map((r) => r.method))}`);
      const move = moves[0];
      assert.ok(move.url.includes('.partial-'), `MOVE request URI must be the partial path, got ${move.url}`);
      const canonical = `http://127.0.0.1:${port}/dav/OpenBrowser/profiles/env-9.obpack`;
      assert.strictEqual(move.headers.destination, canonical, `Destination header must point at the canonical path, got ${move.headers.destination}`);
      const puts = requests.filter((r) => r.method === 'PUT');
      assert.ok(puts.length >= 1, 'partial PUT must happen before MOVE');
      assert.ok(puts.every((r) => r.url.includes('.partial-')), 'PUTs must target the partial path, not the canonical one');
      assert.strictEqual(puts[0].body, 'package-body');
      console.log('  PASS  MOVE acts on the partial URI with Destination = canonical path');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

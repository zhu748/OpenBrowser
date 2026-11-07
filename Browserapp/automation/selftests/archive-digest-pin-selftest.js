'use strict';

/**
 * Self-test for kernel archive digest pinning.
 *
 * Covers the local TOFU registry that turns a re-download of a versioned
 * kernel URL into a byte-exact comparison, plus the feed-digest extraction
 * that becomes mandatory the moment a feed starts publishing checksums.
 * Everything runs against a throwaway temp directory; no network involved.
 */

const assert = require('assert');
const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const crypto = require('crypto');

const {
  isVersionedArchiveUrl,
  extractFeedDigest,
  pinnedArchiveSha256,
  pinArchiveSha256,
} = require('../browser-kernel');

const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}
async function checkAsync(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const CFT_URL = 'https://storage.googleapis.com/chrome-for-testing-public/131.0.6778.204/linux64/chrome-linux64.zip';
const ROLLING_URL = 'https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb';

(async () => {
  check('versioned URLs are pinnable, rolling ones are not', () => {
    assert.strictEqual(isVersionedArchiveUrl(CFT_URL, '131.0.6778.204'), true);
    assert.strictEqual(isVersionedArchiveUrl(ROLLING_URL, 'stable'), false, 'rolling "current" URL must never be pinned');
    assert.strictEqual(isVersionedArchiveUrl(ROLLING_URL, ''), false);
    assert.strictEqual(isVersionedArchiveUrl('', '131.0.6778.204'), false);
    assert.strictEqual(isVersionedArchiveUrl('https://x.test/latest.zip', '131.0.6778.204'), false, 'url must embed the version');
  });

  check('feed digest extraction accepts the shapes a feed may grow', () => {
    const good = sha256(Buffer.from('kernel'));
    assert.deepStrictEqual(extractFeedDigest({ version: '1', sha256: good }, 'linux64'), { sha256: good });
    assert.deepStrictEqual(extractFeedDigest({ version: '1', sha256Hex: good.toUpperCase() }, 'linux64'), { sha256: good }, 'case-insensitive');
    assert.deepStrictEqual(
      extractFeedDigest({ version: '1', checksums: { linux64: good } }, 'linux64'),
      { sha256: good }
    );
    assert.deepStrictEqual(
      extractFeedDigest({ version: '1', checksums: { linux64: { sha256: good } } }, 'linux64'),
      { sha256: good }
    );
    const md5 = crypto.createHash('md5').update('k').digest('hex');
    assert.deepStrictEqual(extractFeedDigest({ version: '1', md5 }, 'linux64'), { md5 });
    // Nothing published → nothing enforced.
    assert.deepStrictEqual(extractFeedDigest({ version: '1' }, 'linux64'), {});
    assert.deepStrictEqual(extractFeedDigest(null, 'linux64'), {});
    // Garbage must not masquerade as a digest.
    assert.deepStrictEqual(extractFeedDigest({ version: '1', sha256: 'not-hex!' }, 'linux64'), {});
    assert.deepStrictEqual(extractFeedDigest({ version: '1', sha256: 'deadbeef' }, 'linux64'), {}, 'wrong length rejected');
    // Per-platform checksums for another platform are ignored.
    assert.deepStrictEqual(extractFeedDigest({ checksums: { macos: good } }, 'linux64'), {});
  });

  await checkAsync('a pinned digest round-trips and is enforced on lookup', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'kernel-pin-'));
    const digest = sha256(Buffer.from('archive-bytes'));
    assert.strictEqual(await pinnedArchiveSha256(root, CFT_URL), null, 'nothing pinned yet');
    assert.strictEqual(await pinArchiveSha256(root, CFT_URL, digest), true);
    assert.strictEqual(await pinnedArchiveSha256(root, CFT_URL), digest);

    // Overwriting the same URL updates the pin.
    const digest2 = sha256(Buffer.from('archive-bytes-v2'));
    await pinArchiveSha256(root, CFT_URL, digest2);
    assert.strictEqual(await pinnedArchiveSha256(root, CFT_URL), digest2, 'latest pin wins');
  });

  await checkAsync('malformed pins are ignored instead of trusted', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'kernel-pin-'));
    // Hand-written legacy / corrupted registry shapes.
    await fsp.writeFile(path.join(root, 'archive-digests.json'), JSON.stringify({
      pins: {
        'https://x.test/a.zip': { sha256: 'deadbeef' },
        'https://x.test/b.zip': 'zzzz',
        'https://x.test/c.zip': { sha256: 42 },
      },
    }));
    assert.strictEqual(await pinnedArchiveSha256(root, 'https://x.test/a.zip'), null, 'wrong length ignored');
    assert.strictEqual(await pinnedArchiveSha256(root, 'https://x.test/b.zip'), null, 'non-hex ignored');
    assert.strictEqual(await pinnedArchiveSha256(root, 'https://x.test/c.zip'), null, 'non-string ignored');
    assert.strictEqual(await pinArchiveSha256(root, 'https://x.test/d.zip', 'nope'), false, 'refuses to pin garbage');
  });

  await checkAsync('a corrupted registry file degrades to empty, not to a crash', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'kernel-pin-'));
    await fsp.writeFile(path.join(root, 'archive-digests.json'), '{not json');
    assert.strictEqual(await pinnedArchiveSha256(root, CFT_URL), null);
    const digest = sha256(Buffer.from('x'));
    assert.strictEqual(await pinArchiveSha256(root, CFT_URL, digest), true, 'rewrites a valid registry');
    assert.strictEqual(await pinnedArchiveSha256(root, CFT_URL), digest);
  });

  await checkAsync('the registry stays bounded', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'kernel-pin-'));
    const many = 40;
    for (let i = 0; i < many; i += 1) {
      await pinArchiveSha256(root, `https://x.test/v${i}.zip`, sha256(Buffer.from(String(i))));
    }
    const raw = JSON.parse(await fsp.readFile(path.join(root, 'archive-digests.json'), 'utf8'));
    const keys = Object.keys(raw.pins);
    assert.strictEqual(keys.length, 32, 'only the newest 32 pins survive');
    assert.strictEqual(await pinnedArchiveSha256(root, 'https://x.test/v0.zip'), null, 'oldest evicted');
    assert.strictEqual(await pinnedArchiveSha256(root, 'https://x.test/v39.zip'), sha256(Buffer.from('39')), 'newest kept');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.err}`}`);
  }
  console.log(`\nARCHIVE_DIGEST_PIN_SELFTEST ${failed.length ? 'FAILED' : 'OK'} ${passed}/${results.length}`);
  if (failed.length) process.exitCode = 1;
})();

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const Module = require('node:module');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-review-update-'));
  const originalFetch = global.fetch;
  const originalOverride = process.env.OPENBROWSER_ALLOW_UNSIGNED_UPDATE;
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const trustPath = require.resolve('../update-trust');
    const shippedTrust = require('../update-trust');
    const trust = new Module(trustPath, module);
    trust.filename = trustPath;
    trust.paths = Module._nodeModulePaths(path.dirname(trustPath));
    trust._compile((await fs.readFile(trustPath, 'utf8')).replace(shippedTrust.trustedPublicKeys()[0],
      publicKey.export({ type: 'spki', format: 'der' }).toString('base64')), trustPath);
    let opened = 0;
    const file = require.resolve('../app-update');
    const update = new Module(file, module);
    update.filename = file;
    update.paths = Module._nodeModulePaths(path.dirname(file));
    const requireOriginal = update.require.bind(update);
    update.require = (name) => {
      if (name === 'electron') return { app: { getVersion: () => '1.0.27', getPath: () => root },
        shell: { openPath: async () => { opened++; return ''; }, showItemInFolder() {} } };
      if (name === './update-trust') return trust.exports;
      return requireOriginal(name);
    };
    update._compile(await fs.readFile(file, 'utf8'), file);
    const api = update.exports;
    const { packageArtifactStem } = require('../../scripts/package-portable');
    for (const [platform, arch, packageArch, suffix] of [
      ['win32', 'x64', 'x86_64', '-setup.exe'], ['linux', 'x64', 'x86_64', '.tar.gz'],
      ['darwin', 'x64', 'x86_64', '.dmg'], ['darwin', 'arm64', 'arm64', '.dmg'],
    ]) assert.equal(api.updateAssetName(platform + ':' + arch), packageArtifactStem(platform, packageArch) + suffix,
      'updater must request the actual online installer for ' + platform + '/' + arch);
    const asset = api.updateAssetName();
    assert.ok(asset);
    const payload = Buffer.from('audit fixture - never execute');
    const manifest = Buffer.from(crypto.createHash('sha256').update(payload).digest('hex') + '  ' + asset + '\n');
    const signed = crypto.sign(null, manifest, privateKey);
    let scenario = 'valid';
    global.fetch = async (url, options = {}) => {
      if (url.endsWith('/releases.atom')) return new Response('<feed><entry><id>https://github.com/zhu748/OpenBrowser/releases/tag/v9.0.0</id></entry></feed>');
      if (options.method === 'HEAD') return scenario === 'head-blocked'
        ? new Response(null, { status: 403 })
        : new Response(null, { headers: { 'content-length': String(payload.length) } });
      if (url.endsWith('/releases/tags/v9.0.0')) return Response.json({ assets: [{ name: asset, size: payload.length,
        browser_download_url: 'https://github.com/zhu748/OpenBrowser/releases/download/v9.0.0/' + asset }] });
      if (url.endsWith('SHA256SUMS.txt.sig')) {
        if (scenario === 'missing') return new Response('', { status: 404 });
        if (scenario === 'network') throw new Error('connection reset');
        if (scenario === 'server') return new Response('', { status: 500 });
        if (scenario === 'empty') return new Response(Buffer.alloc(0));
        if (scenario === 'large') return new Response(Buffer.alloc(4097));
        return new Response(scenario === 'invalid' ? Buffer.alloc(64) : signed);
      }
      if (url.endsWith('SHA256SUMS.txt')) return new Response(manifest);
      if (url.endsWith(asset)) return new Response(scenario === 'tampered' ? Buffer.from('tampered bytes') : payload);
      throw new Error('Unexpected URL: ' + url);
    };
    process.env.OPENBROWSER_ALLOW_UNSIGNED_UPDATE = '1';
    for (scenario of ['missing', 'network', 'server', 'empty', 'large', 'invalid', 'tampered']) {
      await assert.rejects(api.downloadAppUpdate(), /signature|SHA-256/i, scenario);
      assert.equal(opened, 0, scenario + ' must never reach the OS');
      assert.deepEqual(await fs.readdir(root), [], scenario + ' removes the failed installer');
    }
    scenario = 'valid';
    const result = await api.downloadAppUpdate();
    assert.equal(result.signed, true); assert.equal(result.verified, true); assert.equal(opened, 1);
    assert.deepEqual(await fs.readFile(result.path), payload);
    scenario = 'head-blocked';
    const fallback = await api.downloadAppUpdate();
    assert.equal(fallback.signed, true);assert.equal(fallback.verified, true);assert.equal(opened, 2,
      'a blocked HEAD still resolves the signed platform installer through the release API');
    const workflow = await fs.readFile(path.join(__dirname, '../../../.github/workflows/build-installers.yml'), 'utf8');
    const verification = workflow.indexOf('update-trust-tool.js verify');
    const signing = workflow.indexOf('update-trust-tool.js sign');
    assert.ok(signing > 0 && signing < verification, 'the exact manifest is signed before verification');
    assert.ok(workflow.includes('${{ secrets.OPENBROWSER_UPDATE_SIGNING_KEY }}'), 'CI has an explicit encrypted signing-key binding');
    assert.ok(verification > 0 && verification < workflow.lastIndexOf('--draft=false'), 'publication follows signature verification');
    for (const platform of ['win32:x64', 'linux:x64', 'darwin:x64', 'darwin:arm64']) {
      assert.ok(workflow.includes(api.updateAssetName(platform)), 'updater asset must match the published installer: ' + platform);
    }
    console.log('REVIEW_UPDATE_SELFTEST OK (signed success, missing/bad/unavailable signatures, tampering, cleanup, publish gate)');
  } finally {
    global.fetch = originalFetch;
    if (originalOverride === undefined) delete process.env.OPENBROWSER_ALLOW_UNSIGNED_UPDATE;
    else process.env.OPENBROWSER_ALLOW_UNSIGNED_UPDATE = originalOverride;
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

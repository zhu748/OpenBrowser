'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildMacLauncher } = require('../mac-launcher');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-diagnostic-'));
  const oldLog = process.env.OPENBROWSER_FP_LOG;
  process.env.OPENBROWSER_FP_LOG = path.join(root, 'fingerprint.log');
  try {
    const { fpLog } = require('../fingerprint-debug-log');
    await fpLog('test', { tabUrls: [{ url: 'https://u:synthetic-password@example.test/?access_token=synthetic-token#synthetic-fragment' }],
      live: { href: 'http://127.0.0.1/?token=synthetic-session' }, nested: { token: 'synthetic-secret' } });
    const text = await fs.readFile(process.env.OPENBROWSER_FP_LOG, 'utf8');
    for (const secret of ['synthetic-password', 'synthetic-token', 'synthetic-fragment', 'synthetic-session', 'synthetic-secret']) assert.equal(text.includes(secret), false, secret);
    assert.ok(text.includes('example.test'));
    const script = buildMacLauncher({ kernelRoot: '/tmp/space and \'quote $(false) `false`', label: '7' });
    assert.equal(script.includes('EXTRA+=(--no-sandbox)'), false);
    assert.equal(script.includes('EXTRA+=(--remote-allow-origins=*)'), false);
    if (process.platform !== 'win32') {
      const parsed = spawnSync('bash', ['-n'], { input: script, encoding: 'utf8' }); assert.equal(parsed.status, 0, parsed.stderr);
      const assignment = script.split('\n').find((line) => line.startsWith('KERNEL_ROOT='));
      const evaluated = spawnSync('bash', ['-c', assignment + '\nprintf "%s" "$KERNEL_ROOT"'], { encoding: 'utf8' });
      assert.equal(evaluated.status, 0); assert.equal(evaluated.stdout, '/tmp/space and \'quote $(false) `false`');
    }
    console.log('DIAGNOSTIC_LAUNCHER_SELFTEST OK (nested URL/secret redaction, sandbox defaults, restricted origins, shell literals)');
  } finally {
    if (oldLog === undefined) delete process.env.OPENBROWSER_FP_LOG; else process.env.OPENBROWSER_FP_LOG = oldLog;
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

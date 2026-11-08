const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const cdp = require('./cdp');

function userDataRoot() {
  if (process.env.OPENBROWSER_USER_DATA) return process.env.OPENBROWSER_USER_DATA;
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'openbrowser');
  if (process.platform === 'win32') return path.join(os.APPDATA || '', 'openbrowser');
  return path.join(os.homedir(), '.config', 'openbrowser');
}

function isPidAlive(pid) {
  try { process.kill(Number(pid), 0); return true; } catch (error) {
    return error?.code === 'EPERM'; // exists but owned by another user
  }
}

/**
 * Residual DevToolsActivePort + a port since reused by a different environment
 * would previously Browser.close() the NEW environment through the stale file.
 * The instance lock is written at launch with the child pid; only close when
 * that pid still owns the same root. No lock (Firefox roots, wiped roots,
 * pre-lock-version leftovers) means nothing attests ownership: skip. The port
 * is then released by the kernel's exit, never by this tool.
 */
async function lockOwnerPid(root) {
  try {
    const raw = await fs.readFile(path.join(root, '.openbrowser-instance.lock'), 'utf8');
    const parsed = JSON.parse(raw);
    const pid = Number(parsed?.pid ?? parsed?.ownerPid);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (_) { return null; }
}

async function main() {
  const root = path.join(userDataRoot(), 'browser-profiles-v2');
  let names = [];
  try { names = await fs.readdir(root); } catch (_) { process.stdout.write(JSON.stringify({ closed: 0, root })); return; }
  let closed = 0;
  let skipped = 0;
  for (const name of names) {
    const profileRoot = path.join(root, name);
    try {
      const owner = await lockOwnerPid(profileRoot);
      if (!owner || !isPidAlive(owner)) {
        // No attestation, or the recorded browser is gone: the DevToolsActivePort
        // content is stale by definition. Closing through it could hit whatever
        // environment now listens on that port — the exact wrong-profile window.
        skipped += 1;
        continue;
      }
      const raw = await fs.readFile(path.join(profileRoot, 'DevToolsActivePort'), 'utf8');
      const port = Number(raw.split(/\r?\n/)[0]);
      const version = await (await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(3000) })).json();
      await cdp.call(version.webSocketDebuggerUrl, 'Browser.close');
      closed += 1;
    } catch (_) { skipped += 1; }
  }
  process.stdout.write(JSON.stringify({ closed, skipped, root }));
}

main().catch((error) => {
  process.stderr.write(String(error && error.message || error));
  process.exitCode = 1;
});

#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawnSync } = require('node:child_process');

function tool(command, args, env) {
  const result = spawnSync(command, args, { env, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true });
  return {
    available: !result.error && result.status === 0,
    version: String(result.stdout || '').trim().split('\n')[0],
    ...(result.error ? { error: result.error.code || result.error.message } : {}),
    ...(result.status !== 0 ? { exitCode: result.status, detail: String(result.stderr || '').slice(-4000) } : {}),
  };
}

async function socketProbe(address) {
  return new Promise((resolve) => {
    const server = net.createServer();
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close(() => resolve(error ? { available: false, error: error.code || error.message } : { available: true }));
    };
    const timer = setTimeout(() => finish(new Error('socket probe timed out')), 3000);
    server.once('error', finish);
    try { server.listen(address, () => finish()); }
    catch (error) { finish(error); }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf('--toolchain-root');
  if (index >= 0 && (!args[index + 1] || args[index + 1].startsWith('--'))) throw new Error('--toolchain-root requires a directory');
  const root = index >= 0 ? path.resolve(args[index + 1]) : process.env.OPENBROWSER_TOOLCHAIN_ROOT;
  const env = { ...process.env };
  if (root) {
    env.CARGO_HOME = path.join(root, 'cargo');
    env.RUSTUP_HOME = path.join(root, 'rustup');
    env.PATH = path.join(root, 'cargo', 'bin') + path.delimiter + env.PATH;
  }
  const [major, minor] = process.versions.node.split('.').map(Number);
  const report = {
    node: { version: process.version, available: major > 22 || (major === 22 && minor >= 12) },
    rust: Object.fromEntries([
      ['cargo', ['cargo', ['--version']]], ['rustc', ['rustc', ['--version']]],
      ['rustfmt', ['rustfmt', ['--version']]], ['clippy', ['cargo', ['clippy', '--version']]],
    ].map(([name, [command, parameters]]) => [name, tool(command, parameters, env)])),
  };
  const chromium = env.OPENBROWSER_CHROMIUM_BINARY || 'chromium';
  const firefox = env.OPENBROWSER_FIREFOX_BINARY || (root ? path.join(root, 'firefox', process.platform === 'win32' ? 'firefox.exe' : 'firefox') : 'firefox');
  report.chromium = tool(chromium, ['--version'], env);
  report.firefox = tool(firefox, ['--version'], env);
  try {
    const electron = require('electron');
    report.electron = { path: electron, ...tool(electron, ['-p', 'process.versions.electron'], { ...env, ELECTRON_RUN_AS_NODE: '1' }) };
  } catch (error) { report.electron = { available: false, error: error.message }; }
  let temporary;
  try {
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-environment-'));
    report.temp = { path: os.tmpdir(), writable: true };
    report.tcp = await socketProbe({ host: '127.0.0.1', port: 0 });
    report.unixSocket = process.platform === 'win32' ? { required: false }
      : await socketProbe(path.join(temporary, 'socket'));
    if ((args.includes('--probe-native') || args.includes('--strict')) && report.chromium.available) {
      const result = spawnSync(chromium, [
        '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking',
        '--no-first-run', '--no-default-browser-check', '--proxy-server=http://127.0.0.1:9',
        '--user-data-dir=' + path.join(temporary, 'chromium'), '--dump-dom', 'about:blank',
      ], { env, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true });
      report.chromium.launch = { available: !result.error && result.status === 0,
        exitCode: result.status, detail: String(result.stderr || result.error?.message || '').slice(-4000) };
    }
  } catch (error) { report.temp = { path: os.tmpdir(), writable: false, error: error.code || error.message }; }
  finally { if (temporary) await fs.rm(temporary, { recursive: true, force: true, maxRetries: 3 }); }
  report.toolsReady = report.node.available && Object.values(report.rust).every((entry) => entry.available)
    && report.electron.available && report.firefox.available && report.chromium.available
    && report.temp?.writable === true && report.tcp?.available === true;
  report.headlessEnvironmentReady = report.toolsReady && report.chromium.launch?.available === true;
  report.desktopPrerequisitesReady = report.toolsReady
    && (process.platform === 'win32' || report.unixSocket?.available === true)
    && (process.platform !== 'linux' || Boolean(env.DISPLAY || env.WAYLAND_DISPLAY));
  console.log(JSON.stringify(report, null, 2));
  if (args.includes('--strict') && !report.headlessEnvironmentReady) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');

// Parallel probe wrapper: the serial chain of 15s-timeout tool calls
// (4 rust tools + 2 browsers + electron) took up to ~75s+ on machines where a
// tool was missing — each absent binary burns its full timeout. Bounded
// fan-out keeps the report shape identical.
function toolAsync(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env, encoding: 'utf8', windowsHide: true });
    let stdout = '', stderr = '', timer;
    const finish = (result) => {
      clearTimeout(timer);
      resolve(result);
    };
    timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (_) {}
      finish({ available: false, version: '', error: 'ETIMEDOUT', exitCode: null, detail: stderr.slice(-4000) });
    }, 15000);
    child.stdout?.on('data', (chunk) => { if (stdout.length < 1024 * 1024) stdout += chunk; });
    child.stderr?.on('data', (chunk) => { if (stderr.length < 8192) stderr += chunk; });
    child.on('error', (error) => finish({
      available: false, version: '', error: error.code || error.message,
    }));
    child.on('close', (code) => finish({
      available: code === 0,
      version: String(stdout || '').trim().split('\n')[0],
      ...(code !== 0 ? { exitCode: code, detail: String(stderr || '').slice(-4000) } : {}),
    }));
  });
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
    node: { version: process.version, available: major >= 24 || (major === 22 && minor >= 13) },
  };
  const chromium = env.OPENBROWSER_CHROMIUM_BINARY || 'chromium';
  const firefox = env.OPENBROWSER_FIREFOX_BINARY || (root ? path.join(root, 'firefox', process.platform === 'win32' ? 'firefox.exe' : 'firefox') : 'firefox');
  // All probes run concurrently: total wall time is the slowest single
  // probe instead of the sum of seven 15s timeouts.
  const rustProbes = [
    ['cargo', ['cargo', ['--version']]], ['rustc', ['rustc', ['--version']]],
    ['rustfmt', ['rustfmt', ['--version']]], ['clippy', ['cargo', ['clippy', '--version']]],
  ];
  const [rustResults, chromiumResult, firefoxResult, electronResult] = await Promise.all([
    Promise.all(rustProbes.map(async ([name, [command, parameters]]) => [name, await toolAsync(command, parameters, env)]))
      .then((entries) => Object.fromEntries(entries)),
    toolAsync(chromium, ['--version'], env),
    toolAsync(firefox, ['--version'], env),
    (async () => {
      try {
        const electron = require('electron');
        return { path: electron, ...await toolAsync(electron, ['-p', 'process.versions.electron'], { ...env, ELECTRON_RUN_AS_NODE: '1' }) };
      } catch (error) { return { available: false, error: error.message }; }
    })(),
  ]);
  report.rust = rustResults;
  report.chromium = chromiumResult;
  report.firefox = firefoxResult;
  report.electron = electronResult;
  let temporary;
  try {
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-environment-'));
    report.temp = { path: os.tmpdir(), writable: true };
    report.tcp = await socketProbe({ host: '127.0.0.1', port: 0 });
    report.unixSocket = process.platform === 'win32' ? { required: false }
      : await socketProbe(path.join(temporary, 'socket'));
    if ((args.includes('--probe-native') || args.includes('--strict')) && report.chromium.available) {
      const result = await toolAsync(chromium, [
        '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking',
        '--no-first-run', '--no-default-browser-check', '--proxy-server=http://127.0.0.1:9',
        '--user-data-dir=' + path.join(temporary, 'chromium'), '--dump-dom', 'about:blank',
      ], env);
      report.chromium.launch = { available: result.available && result.exitCode === undefined,
        exitCode: result.exitCode ?? (result.available ? 0 : 1),
        detail: String(result.detail || result.error || '').slice(-4000) };
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

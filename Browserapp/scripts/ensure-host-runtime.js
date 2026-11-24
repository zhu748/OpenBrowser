#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { installedHostEntry, lockedElectronPackage, inspectLockedElectronRuntime } = require('./resolve-host-dist');

function packageRoot(appRoot) {
  let found = null;
  for (const name of ['desktop-shell', 'electron']) {
    const candidate = path.join(appRoot, 'node_modules', name);
    if (!fs.existsSync(path.join(candidate, 'package.json'))) continue;
    if (hasRuntime(candidate)) return candidate;
    found ||= candidate;
  }
  return found;
}

function hasRuntime(root, platform = process.platform, arch = process.arch) {
  if (!root) return false;
  try {
    installedHostEntry(root, platform, arch);
    return true;
  } catch (_) {
    return false;
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with code ${result.status}`);
}

function resolveNpmCommand(args) {
  if (process.platform !== 'win32') return { command: 'npm', args };

  const nodeRoot = path.dirname(process.execPath);
  const npmCli = path.join(nodeRoot, 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (fs.existsSync(npmCli)) {
    return { command: process.execPath, args: [npmCli, ...args] };
  }

  return { command: 'cmd.exe', args: ['/d', '/s', '/c', 'npm', ...args] };
}

function ensureHostRuntime(appRoot) {
  let root = packageRoot(appRoot);
  if (hasRuntime(root)) return root;

  if (!root) {
    console.log('[runtime] installing OpenBrowser dependencies');
    const npm = resolveNpmCommand(['install', '--force', '--include=dev']);
    run(npm.command, npm.args, appRoot);
    root = packageRoot(appRoot);
  }

  if (!root) throw new Error('缺少桌面运行时 npm 包。请在 Browserapp 目录执行 npm install --force --include=dev。');

  const installer = path.join(root, 'install.js');
  if (fs.existsSync(installer)) {
    console.log('[runtime] downloading platform runtime');
    run(process.execPath, [installer], appRoot);
  }

  if (!hasRuntime(root)) {
    throw new Error('当前平台的桌面运行时安装失败。请在 Browserapp 目录执行 npm install --force --include=dev。');
  }
  return root;
}

function ensureLockedElectronRuntime(appRoot, arch, { platform = process.platform, invoke = run } = {}) {
  try {
    const { root, dist } = lockedElectronPackage(appRoot);
    // Retain the local download if npm is installed but there is no runtime
    // yet. Do not merge a download into a partial, mixed or wrong-arch dist.
    if (!fs.lstatSync(dist, { throwIfNoEntry: false })) {
      const installer = path.join(root, 'install.js');
      if (!fs.lstatSync(installer, { throwIfNoEntry: false })?.isFile()) throw Error('Missing Electron installer');
      console.log('[runtime] downloading locked Electron runtime');
      invoke(process.execPath, [installer], appRoot);
    }
    return inspectLockedElectronRuntime(appRoot, platform, arch);
  } catch (error) {
    throw new Error('Cannot package Electron. Run npm ci --include=dev with a clean dependency tree. ' + error.message, { cause: error });
  }
}

if (require.main === module) ensureHostRuntime(path.resolve(__dirname, '..'));

module.exports = { ensureHostRuntime, ensureLockedElectronRuntime, hasRuntime, resolveNpmCommand };

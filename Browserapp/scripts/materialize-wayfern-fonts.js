#!/usr/bin/env node
'use strict';

/**
 * Materialize the shared wayfern font tree into the Windows kernel seed.
 *
 * wayfern_fonts 去重（docs/wayfern-fonts-dedup-plan.md 阶段 1）：
 *   kernels/wayfern-fonts/             共享正本（git-LFS 追踪，原 windows-x64 份 git mv 而来）
 *   kernels/windows-x64/wayfern_fonts/ 物化副本（打包与 Windows 开发模式需要）
 *
 * - 幂等：目标已存在且逐文件大小一致时不做任何写入；目标中的多余文件不删除。
 * - 源为 git-LFS 指针时（未 lfs pull 的检出）直接报错并给出恢复命令，
 *   绝不把 130 字节指针复制成"字体"。
 * - 只处理 Windows 侧。macOS 侧字体嵌在已签名的 Wayfern.app 内
 *   （Contents/_CodeSignature 已入库），任何改动都会使签名失效，本脚本绝不触碰；
 *   其去重见方案文档阶段 3（需 macOS 机器重签后才能删）。
 *
 * Usage:
 *   node scripts/materialize-wayfern-fonts.js           # 物化（幂等）
 *   node scripts/materialize-wayfern-fonts.js --check   # 只检查不写入；未物化退出码 2
 *   node scripts/materialize-wayfern-fonts.js --help
 *
 * Env（自测/CI 覆盖路径用）：
 *   OPENBROWSER_WAYFERN_FONTS_SRC / OPENBROWSER_WAYFERN_FONTS_DEST
 */

const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const DEFAULT_SRC = path.join(appRoot, 'kernels', 'wayfern-fonts');
const DEFAULT_DEST = path.join(appRoot, 'kernels', 'windows-x64', 'wayfern_fonts');

// 复用 fetch-kernels.js 的指针检测（与 kernels:fetch 术语一致）；不可用时退回本地实现。
let isLfsPointerFile;
try {
  ({ isLfsPointerFile } = require('./fetch-kernels'));
} catch (_) { /* fall back to the local copy below */ }
if (typeof isLfsPointerFile !== 'function') {
  const LFS_POINTER_PREFIX = 'version https://git-lfs';
  isLfsPointerFile = (file) => {
    try {
      const fd = fs.openSync(file, 'r');
      try {
        const buf = Buffer.alloc(LFS_POINTER_PREFIX.length + 8);
        const read = fs.readSync(fd, buf, 0, buf.length, 0);
        return buf.subarray(0, read).toString('utf8').startsWith(LFS_POINTER_PREFIX);
      } finally {
        fs.closeSync(fd);
      }
    } catch (_) {
      return false;
    }
  };
}

function listFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { continue; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) stack.push(full);
      else if (entry.isFile()) files.push(path.relative(root, full));
    }
  }
  files.sort();
  return files;
}

function resolvePaths(options = {}) {
  return {
    src: options.src || process.env.OPENBROWSER_WAYFERN_FONTS_SRC || DEFAULT_SRC,
    dest: options.dest || process.env.OPENBROWSER_WAYFERN_FONTS_DEST || DEFAULT_DEST,
  };
}

function materializeWayfernFonts(options = {}) {
  const { src, dest } = resolvePaths(options);
  if (!fs.existsSync(src)) {
    throw new Error(`wayfern font canonical tree missing: ${src}\n`
      + '  (expected kernels/wayfern-fonts, see docs/wayfern-fonts-dedup-plan.md)');
  }
  const relFiles = listFiles(src);
  if (!relFiles.length) {
    throw new Error(`wayfern font canonical tree is empty: ${src}`);
  }
  const pointerFiles = relFiles.filter((rel) => isLfsPointerFile(path.join(src, rel)));
  if (pointerFiles.length > 0) {
    throw new Error(
      `kernels/wayfern-fonts 仍是 git-LFS 指针（${pointerFiles.length}/${relFiles.length} 个占位文件，`
      + `例如 ${pointerFiles[0]}），真实字体尚未物化，拒绝把指针复制成字体。\n`
      + '请先执行其一：\n'
      + '  npm run kernels:fetch     # 从内核 Release 资产拉取（windows-x64 归档已含物化后的字体树）\n'
      + '  git lfs pull --include "Browserapp/kernels/wayfern-fonts/**"   # 或全量 git lfs pull\n'
      + '然后重跑 npm run fonts:materialize。'
    );
  }

  let copied = 0;
  let skipped = 0;
  let missing = 0;
  for (const rel of relFiles) {
    const source = path.join(src, rel);
    const target = path.join(dest, rel);
    const sourceSize = fs.statSync(source).size;
    let targetSize = -1;
    try { targetSize = fs.statSync(target).size; } catch (_) { /* absent */ }
    if (targetSize === sourceSize) { skipped += 1; continue; }
    if (options.checkOnly) { missing += 1; continue; }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied += 1;
  }
  const destFiles = fs.existsSync(dest) ? listFiles(dest) : [];
  return {
    src,
    dest,
    sourceFiles: relFiles.length,
    destFiles: destFiles.length,
    copied,
    skipped,
    missing,
    upToDate: copied === 0 && missing === 0,
  };
}

function printHelp() {
  console.log([
    'Usage: node scripts/materialize-wayfern-fonts.js [--check]',
    '',
    '把共享字体正本 kernels/wayfern-fonts 物化（复制）进 Windows 内核种子',
    'kernels/windows-x64/wayfern_fonts。幂等：已存在且大小一致的文件跳过，',
    '目标中的多余文件不删除。源仍是 git-LFS 指针时直接失败并提示先',
    '`npm run kernels:fetch` 或 `git lfs pull`。macOS 侧（已签名 .app 内）不动。',
    '',
    '  --check   只检查物化状态，不写入；未物化时退出码 2（CI 门禁用）',
    '  --help    显示本帮助',
  ].join('\n'));
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) { printHelp(); return 0; }
  const checkOnly = args.includes('--check');
  try {
    const summary = materializeWayfernFonts({ checkOnly });
    if (checkOnly) {
      console.log(`[fonts] check: ${summary.upToDate ? 'MATERIALIZED' : 'NOT MATERIALIZED'}`
        + ` (${summary.sourceFiles} source files, ${summary.skipped} in place, ${summary.missing} missing)`);
      return summary.upToDate ? 0 : 2;
    }
    console.log(`[fonts] ${summary.upToDate ? 'already materialized' : 'materialized'}:`
      + ` ${summary.sourceFiles} files (${summary.copied} copied, ${summary.skipped} up-to-date)`
      + ` -> ${path.relative(appRoot, summary.dest)}`);
    return 0;
  } catch (error) {
    console.error(`[fonts] ERROR: ${error.message}`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { materializeWayfernFonts, DEFAULT_SRC, DEFAULT_DEST };

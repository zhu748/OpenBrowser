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
 * - 内核外置翻转兼容（docs/kernel-externalization.md §5）：翻转后正本
 *   kernels/wayfern-fonts 不在工作区（sparse 排除）也不在仓库（git rm），但
 *   Release 归档打包前已物化字体，种子自带完整副本。此时不再硬失败：
 *   物化副本已就绪（见 assessDestFontTree）→ 返回 upToDate（退出码 0）；
 *   物化副本缺失/不完整 → 报错并给出两条恢复路径（Release 归档 / 本地
 *   bootstrap）。该判定绝不把 LFS 指针当字体（指针占位视为未就绪）。
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

// 字体树按伪装 OS 分四个区（docs/wayfern-fonts-dedup-plan.md §1：android=208 /
// macos=370 / ubuntu=561 / win11=1018，无分区外文件）。判定"物化副本已就绪"
// 沿用 selftest:fontnative 配对门禁的阈值：每分区文件数 > 100。
const FONT_OS_PARTITIONS = Object.freeze(['android', 'macos', 'ubuntu', 'win11']);
const MIN_FILES_PER_OS_PARTITION = 100;

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

/**
 * 判定物化副本（kernels/<platform>/wayfern_fonts）单独是否已就绪。
 * 翻转后正本缺席时没有可对照的源树，因此"完整性"沿用本模块既有原语做
 * 单侧判定：listFiles 递归清点 + isLfsPointerFile 指针检测（130 字节 LFS
 * 指针占位绝不视为字体）；四 OS 分区齐全且每分区文件数 > 100（阈值与
 * selftest:fontnative 的"natives 与字体包不拆散"配对门禁一致，Release
 * 归档由完整正本构建，正常副本必然满足）。
 */
function assessDestFontTree(dest) {
  const files = fs.existsSync(dest) ? listFiles(dest) : [];
  const partitions = {};
  for (const rel of files) {
    const os = rel.split(/[\\/]/)[0];
    partitions[os] = (partitions[os] || 0) + 1;
  }
  const pointerFiles = files.filter((rel) => isLfsPointerFile(path.join(dest, rel))).length;
  const problems = [];
  if (files.length === 0) problems.push('materialized tree missing or empty');
  for (const os of FONT_OS_PARTITIONS) {
    if ((partitions[os] || 0) <= MIN_FILES_PER_OS_PARTITION) {
      problems.push(`partition ${os}/ has ${partitions[os] || 0} files (needs > ${MIN_FILES_PER_OS_PARTITION})`);
    }
  }
  if (pointerFiles > 0) problems.push(`${pointerFiles} git-LFS pointer files (not real fonts)`);
  return { ready: problems.length === 0, files: files.length, partitions, pointerFiles, problems };
}

/** 正本缺席且物化副本不可用时的报错：给出两条恢复路径（docs/kernel-externalization.md）。 */
function flipRecoveryError(src, dest, assessment) {
  return new Error(
    `wayfern font canonical tree missing: ${src}\n`
    + '  (内核外置翻转后属正常状态，但 Windows 种子必须已携带物化字体；'
    + 'docs/kernel-externalization.md §5)\n'
    + `  kernels/windows-x64/wayfern_fonts 未就绪: ${assessment.problems.join('; ')}\n`
    + '请先执行其一恢复种子：\n'
    + '  A) 从已发布 kernel Release 归档获取种子（归档打包前已物化字体）：\n'
    + '     npm run kernels:fetch -- --platform windows-x64 --tag <kernels-vN>\n'
    + '  B) 本地 bootstrap（docs/kernel-externalization.md §3）：在仍有正本'
    + 'kernels/wayfern-fonts（LFS 已物化）的检出上运行 npm run fonts:materialize，\n'
    + '     再把物化后的 kernels/windows-x64 种子带到本机。'
  );
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
    // 内核外置翻转后（docs/kernel-externalization.md §5）：正本不在工作区
    // （sparse 排除）也不在仓库（git rm），但 Release 归档打包前已物化字体，
    // 种子本身完整。此时不再无条件 throw（三处调用点：CI 物化步骤、
    // prepare-bundled-kernel windows 分支、package-portable 都依赖本函数）：
    //   - 物化副本已就绪（assessDestFontTree）→ upToDate 返回（退出码 0）；
    //   - 物化副本缺失/不完整 → 报错并给出两条恢复路径。
    const assessment = assessDestFontTree(dest);
    if (!assessment.ready) throw flipRecoveryError(src, dest, assessment);
    return {
      src,
      dest,
      srcAbsent: true,
      sourceFiles: 0,
      destFiles: assessment.files,
      copied: 0,
      skipped: assessment.files,
      missing: 0,
      upToDate: true,
      partitions: assessment.partitions,
    };
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
    '正本缺席（内核外置翻转后状态）时：kernels/windows-x64/wayfern_fonts 已',
    '就绪（非指针、四 OS 分区齐全）则按 upToDate 返回（退出码 0）；缺失或不',
    '完整则报错并列出恢复路径（Release 归档 fetch / docs §3 本地 bootstrap）。',
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
    if (summary.srcAbsent) {
      // 翻转后状态：正本缺席，但 Release 归档自带的物化副本已就绪。
      if (checkOnly) {
        console.log(`[fonts] check: MATERIALIZED (正本缺席（翻转后状态）、种子已含物化字体: ${summary.destFiles} files in place)`);
        return 0;
      }
      console.log(`[fonts] 正本缺席（翻转后状态）、种子已含物化字体: nothing to do`
        + ` (${summary.destFiles} files in place -> ${path.relative(appRoot, summary.dest)})`);
      return 0;
    }
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

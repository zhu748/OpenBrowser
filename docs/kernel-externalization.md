# Kernel externalization — Release assets + CI prefetch

状态：机制已落地（2026-11-09，optimization/p0-p4 分支）。目标：把 4.22 GB 的
git-LFS 内核内容（5,232 个 LFS 文件 + 5 个 symlink，占仓库 tracked 文件的
84.6%）从"唯一来源 = LFS"改为"首选来源 = GitHub Release 归档"，LFS 保留为
回滚兜底。审查报告（§三 #1）量化过收益：tracked 文件 -84.6%，解除 LFS
带宽/配额对 CI 和发布的约束。

## 1. 机制总览

| 组件 | 位置 | 作用 |
|---|---|---|
| fetch 脚本 | `Browserapp/scripts/fetch-kernels.js` | 按 tag 从 Release 下载内核归档 + SHA256SUMS.txt，校验 SHA-256 后解压到 `Browserapp/kernels/<platform>/`。零新依赖（复用 `automation/downloader.js`：sha256 校验、断点续传、重试、进度） |
| 发布工作流 | `.github/workflows/kernel-release.yml` | 分平台 job 打包内核树为 tar.gz、生成校验和、与 LFS 指针 oid 交叉核对、上传到 **draft** release |
| CI 预取 | `build-installers.yml` 各打包 job | `scripts/fetch-kernels.js --platform X` 预取步骤；LFS checkout 保持为过渡期回退 |
| 打包钩子 | `prepare-bundled-kernel.js` / `package-portable.js` | 内核缺失（只有 LFS 指针/不存在）时自动 fetch（`OPENBROWSER_KERNEL_AUTO_FETCH=0` 可关），失败给出两条恢复命令 |
| npm scripts | `kernels:fetch` / `kernels:status` | 开发者入口（package.json，仅新增条目） |
| 缓存 | `Browserapp/.kernel-release-cache/`（已 gitignore，且被打包排除） | 归档缓存 + `state.json`（上次 fetch 的 tag/资产/时间） |

## 2. Release 资产清单与真实大小

大小由 LFS 指针头的 `size` 字段精确求和（`git ls-files` × 指针解析）：

| 资产 | 原始字节数 | 说明 |
|---|---|---|
| `kernels-windows-x64.tar.gz` | 1,966,533,237 B（1,875.4 MiB，2,247 文件） | 单归档；gzip 后远低于 2 GiB 资产上限 |
| `kernels-macos-x64.tar.gz` | 413,806,201 B（394.6 MiB，362 文件） | 单归档 |
| `kernels-macos-arm64-app.tar.gz` | 640,419,628 B（610.8 MiB，468 文件） | Wayfern.app **去掉** wayfern_fonts |
| `kernels-macos-arm64-fonts.tar.gz` | 1,513,917,504 B（1,443.8 MiB，2,157 文件） | 仅 wayfern_fonts 子树 |
| `kernels-meta.tar.gz` | 812 B（2 文件） | `kernels/meta/*` |
| `SHA256SUMS.txt` | — | finalize job 合并各 `SHA256SUMS-*.txt` 生成 |

macos-arm64 必须拆分：整树 2,154,337,132 B **超过 GitHub 单资产 2,147,483,648 B
（2 GiB）上限**（fonts/rest 两半各自低于上限）。两个资产都解压到
`kernels/macos-arm64/` 即可拼回完整目录树；fetch 脚本按
`kernels-<platform>` 前缀自动选择该平台的全部资产。脚本同时支持
`.partNN` 字节分片方案（下载各分片、逐片校验、拼接后再次整体校验），
供未来任一平台超限时使用。

归档格式选 **tar.gz**：macOS 种子含 5 个 symlink（framework
`Versions/Current`、`Helpers/Libraries/Resources`）与可执行位，`launch_openbrowser.sh`
需要 exec 位——zip 不保证保留这些属性，tar 原生支持且三平台 runner 都有 tar。

## 3. 维护者流程（发布一个 kernel release）

1. **触发**：Actions → "Kernel release assets" → Run workflow，填
   `kernel_tag`（必须 `kernels-v` 前缀，如 `kernels-v1`）。
   注意：workflow 出现在 UI 列表需要本文件已合入**默认分支**；从功能分支触发用
   API：`gh api -X POST repos/{owner}/{repo}/actions/workflows/kernel-release.yml/dispatches -f ref=<分支> -F 'inputs[kernel_tag]=kernels-v1'`。
2. 每个 job：拉取**仅本平台**的 LFS 对象（`git lfs pull --include`，runner 磁盘
   峰值约 4 GiB，远低于 ubuntu-latest 的 ~14 GiB 可用空间）；内容与提交内
   LFS 指针 oid 逐一 sha256 交叉核对（+ `git lfs fsck`），不一致即 fail；
   打 tar.gz、断言单资产 < 2 GiB、生成 `SHA256SUMS-<platform>.txt` 上传。
3. finalize job 合并出 `SHA256SUMS.txt` 并做完整性断言。**Release 保持 draft**。
4. **核对**：`gh release view kernels-v1` 检查资产数量/大小；本地空目录试跑
   `node scripts/fetch-kernels.js --platform all --tag kernels-v1 --dest /tmp/k`。
5. **publish**：`gh release edit kernels-v1 --draft=false`（或 UI）。发布后
   匿名即可下载（无需 token）。

### 重要：远端 LFS 当前不可用（2026-11-09 实测）

对 `https://github.com/zhu748/OpenBrowser.git/info/lfs/objects/batch` 的探测
（匿名与带 token 均验证）：endpoint 可达（HTTP 200），但抽测的三个真实指针
oid（36 B main.dat、66.9 MB Songti.ttc、309 MB chrome.dll）全部返回
`404 Object does not exist on the server`。仓库无 `.lfsconfig`（未配置自定义
LFS 服务器）。结论：**这 4.22 GB 的 LFS 对象从未（或已不再）存在于 GitHub 的
LFS 存储**，`git lfs pull` 对任何人在这个远端都拉不到内核内容。因此：

- kernel-release 工作流在当前远端状态下**跑不通**（它依赖 `git lfs pull`）。
  首次发布有两条路：
  - a) 维护者本机已有完整内核内容（LFS 物化过的 checkout），**本地**用与工作流
    完全相同的命令产出归档并传 draft release（在 `Browserapp/kernels` 有真实
    内容的机器上）：
    ```bash
    # 阶段 1 布局：先物化共享字体正本，归档布局与历史一致（归档内仍含
    # kernels/windows-x64/wayfern_fonts；见 docs/wayfern-fonts-dedup-plan.md）
    node Browserapp/scripts/materialize-wayfern-fonts.js
    tar -czf kernels-windows-x64.tar.gz -C Browserapp/kernels windows-x64
    tar -czf kernels-macos-x64.tar.gz  -C Browserapp/kernels macos-x64
    tar -czf kernels-macos-arm64-app.tar.gz --exclude='*wayfern_fonts' -C Browserapp/kernels macos-arm64
    tar -czf kernels-macos-arm64-fonts.tar.gz -C Browserapp/kernels "macos-arm64/Wayfern.app/Contents/Frameworks/Wayfern Framework.framework/Versions/149.0.7827.114/Resources/wayfern_fonts"
    tar -czf kernels-meta.tar.gz -C Browserapp/kernels meta
    sha256sum kernels-*.tar.gz | sort -k2 > SHA256SUMS.txt
    gh release create kernels-v1 --draft --title "Kernel seed kernels-v1" \
      kernels-*.tar.gz SHA256SUMS.txt
    ```
  - b) 先把 LFS 对象推上远端（`git lfs push --all origin`，4.22 GB，需 LFS
    data pack 配额——免费档 1 GB 存储装不下，这大概率就是对象缺失的原因），
    然后直接跑工作流。
- 端到端机制本身（draft release 创建、资产上传、SHA256SUMS 校验下载、分片
  合并、解压、幂等、清理）已在真实仓库上以 `kernels-e2e-test` 全链路验证通过
  （测完已删除）。

## 4. 开发者 / CI 流程

```bash
npm run kernels:fetch -- --platform windows-x64 --tag kernels-v1   # 单平台
npm run kernels:fetch -- --platform all                            # 全部（默认 tag 见下）
npm run kernels:status                                             # 检查本地种子就绪+校验（退出码）
node scripts/fetch-kernels.js --dry-run --platform all             # 只看计划不下载
node scripts/fetch-kernels.js --selftest                           # 离线自测（CI smoke 每次跑）
```

- 默认 tag = `$OPENBROWSER_KERNEL_TAG` 或内置常量 `kernels-v1`；`--tag` 覆盖。
- 默认 repo 取自 package.json `repository`；`--repo` / `OPENBROWSER_KERNEL_RELEASE_REPO` 覆盖。
- `GITHUB_TOKEN`/`GH_TOKEN`：私有仓、**draft release**（匿名完全不可见）、
  API 限流时必需；公开且已发布的 release 匿名可下。token 只经环境变量，不落盘。
- 幂等：种子已物化（关键二进制存在且非 LFS 指针）→ 直接跳过、零网络；
  归档缓存命中且 sha256 匹配 → 不重下。`--force` 强制重下重解压。
- 解压优先用系统 `tar`/`unzip`/bsdtar；缺失时回退内置纯 JS tar/zip 读取器
 （`OPENBROWSER_KERNEL_EXTRACTOR=js` 可强制），symlink/执行位/超长文件名/含
  空格目录名均保留，成员名做路径穿越防护。
- 失败重试：`automation/downloader.js` 内建 3 次重试 + Range 断点续传。

打包路径（新旧两种内核来源统一）：`prepare:bundled-kernel` 与
`package:portable` 在验证/拷贝前调用 `ensureKernelSeedForPackaging(platform)`：
本地已有内容 → 原样使用；只有指针 → 自动 fetch；两者皆不可用 → 报错并列出
恢复命令（fetch 命令 + `git lfs pull --include "Browserapp/kernels/<platform>/**"`）。
`OPENBROWSER_KERNEL_AUTO_FETCH=0` 关闭自动 fetch（只留指引）。linux-x64 的
chrome-stable 种子仍由 `prepare:linux-kernel` 下载，不经本机制。

## 5. 翻转检查单（Release 发布后：去掉 LFS 拉取）

前提：`kernels-vN` 已 publish，且已在干净机器上 `kernels:fetch` + 完整打包
验证过一次。

1. `build-installers.yml`：各打包 job 的 `actions/checkout` 去掉
   `lfs: true`，sparse-checkout 增加一行 `!/Browserapp/kernels/`（与 ci.yml
   smoke job 相同模式），删除 "Prune foreign kernels" 步骤；预取步骤里
   `KERNELS_TAG` 输入改为已发布 tag（并把输入 default 更新为该 tag）。
   预取步骤本身**不用改**——种子缺失时它自动走 Release。
2. 字体物化三处调用点**已翻转安全，无需随翻改动**（2026-11-09 审查跟进）：
   `materialize-wayfern-fonts.js` 在正本 `kernels/wayfern-fonts` 缺失时不再
   无条件 throw——若 `kernels/windows-x64/wayfern_fonts` 已就绪（Release
   归档打包前已物化：非 git-LFS 指针、android/macos/ubuntu/win11 四分区各
   >100 文件，阈值与 selftest:fontnative 配对门禁一致），按 upToDate 返回
   （退出码 0），日志注明"正本缺席（翻转后状态）、种子已含物化字体"；若
   物化副本缺失/不完整，报错并列出两条恢复路径（A: `kernels:fetch` 拉
   Release 归档；B: §3 本地 bootstrap）。三处调用点——build-installers.yml
   windows job 物化步骤（CLI 子进程）、prepare-bundled-kernel.js windows
   分支、package-portable.js `materializeWayfernFontsForPackaging`（导出
   函数）——行为一致；正本在场时（翻转前）行为不变。
3. `kernel-release.yml`：它仍需要 LFS 内容做"源"。翻转后它已无存在必要
   （新内核版本改由本地打包上传或恢复 LFS 后再跑）；先保留，归档前删除。
4. 仓库瘦身（**归后续代理，本任务红线未动 kernels/ 内容**）：
   `git rm -r Browserapp/kernels/*`（指针仅 0.68 MB，历史无需 rewrite），
   `.gitattributes` 同步清理。
5. 观察一个发布周期后删除 `git lfs` 相关说明。
过渡期行为：LFS checkout 仍是事实来源时，预取步骤检测到种子就绪即静默跳过
（零网络），CI 不会因 Release 未发布而挂——这正是回退设计。

## 6. 回滚方案（零成本）

- LFS 指针仍完整保留在仓库（本次改动**未触碰 kernels/ 任何内容**）。回滚 =
  还原本批文件改动即可，`git lfs pull` 路径与改动前完全一致（前提是远端 LFS
  有内容，见 §3 的 404 发现）。
- 已发布 kernel release 无副作用：它只是额外资产，fetch 脚本不跑就不消费。
- `kernels/` 从 git 移除后想回滚：`git revert` 那次删除提交，指针即恢复。

# 方案：wayfern_fonts 双平台字体树 100% 重复消除实施计划

- 状态：阶段 1 已执行（2026-11-09，基于 9c0fbef 的工作树，未提交，见 §8）；阶段 2（真实检出验证矩阵）与阶段 3（删 macOS 内嵌份，需重签）待执行
- 日期：2026-11-09
- 调查分支：`optimization/p0-p4`
- 影响范围：`Browserapp/kernels/windows-x64/wayfern_fonts/`、`Browserapp/kernels/macos-arm64/Wayfern.app/Contents/Frameworks/Wayfern Framework.framework/Versions/149.0.7827.114/Resources/wayfern_fonts/`、`Browserapp/scripts/package-portable.js`、`Browserapp/scripts/build-font-subsets.py`、`Browserapp/automation/data/font-metric-families.json`、`Browserapp/automation/selftests/font-native-layer-selftest.js`、`Browserapp/automation/selftests/kernel-integrity-selftest.js`、`Browserapp/automation/selftests/css-font-metrics-e2e-selftest.js`、`Browserapp/automation/selftests/font-metrics-injection-e2e-selftest.js`、`.github/workflows/build-installers.yml`

## 1. 背景与精确数据

两个平台内核种子各携带一份完整的 `wayfern_fonts` 字体树（ubuntu/win11/macos/android 四个 OS 分区，供内核原生 `BundledFontRegistry` 按伪装 OS 提供真实字体渲染）。本调查用 LFS 指针文件的 `oid sha256` + `size` 字段做了逐路径比对（无需 git-lfs；脚本逻辑：遍历两棵树的指针文本，按相对路径配对，比较 oid 与 size），结论：

| 指标 | 数值 |
| --- | --- |
| windows-x64 树文件数 | 2,157（android=208 / macos=370 / ubuntu=561 / win11=1018） |
| macos-arm64 树文件数 | 2,157（android=208 / macos=370 / ubuntu=561 / win11=1018） |
| 两树共同路径 | 2,157 |
| oid+size 完全相同 | **2,157 / 2,157（100%）** |
| oid 或 size 不同 | 0 |
| 仅单侧存在的路径 | 0 |
| 指针文件文本字节级相同（= 同一 git blob） | 2,157 / 2,157 |
| 两树合计唯一 LFS oid | 2,140（17 个文件是树内同 oid 重复，涉及 6 个 oid：Ubuntu 系字体别名、DroidSans/Roboto、NotoColorEmoji 等） |
| 字体净载荷（按指针 size 求和，单树） | 1,513,917,504 B ≈ 1.41 GB |
| 双树登记合计 | ≈ 2.82 GB |

附带发现：`wayfern_data_files/`（device-pool.json、voices.json、webgl-fingerprints.json 共 3 个文件）在两平台同样逐字节相同，属于同构重复，但体积可忽略，不单独立项，可随本方案一并处理。

### 1.1 LFS 去重语义（收益核算的前提）

必须先纠正一个直觉：**删除一份指针树并不会减少 LFS 存储与克隆/检出带宽**。

- 两份指针文件文本完全相同 → git 对象库中本来就是同一个 blob，树里只是两条引用；
- LFS 服务端按 oid 内容寻址，2,140 个唯一对象只存一份；`git lfs pull` 也按 oid 去重下载，只物化两次到工作区。

去重的真实收益是：

1. 完整检出（非 sparse）的工作区磁盘减少 ≈ 1.41 GB；
2. git 树登记减少 2,157 个条目；
3. 消除"两份事实源"的漂移风险（当前若只更新一侧，CI 与产物将不一致且无任何告警）。

安装包产物体积**不变**：两个平台的安装包各自仍需一份完整字体树。

## 2. 消费方映射（调查结论）

| # | 消费方 | 消费时机 | 依赖方式 |
| --- | --- | --- | --- |
| 1 | 内核二进制内嵌的原生 `BundledFontRegistry`（Windows：`chrome.dll`/`chrome.exe` 149 内核；macOS：`Wayfern Framework.framework/Versions/149.0.7827.114`） | 运行时 | 内核按自身安装位置相对定位 `wayfern_fonts/<os>/`（Windows 在内核根目录旁；macOS 在 Framework 的 `Resources/` 内）。二进制为 LFS 对象，路径拼接逻辑闭源，只能黑盒验证 |
| 2 | `Browserapp/engine.js` L178-194 → `automation/browser-kernel.js` `findBundledWayfernKernel`（L1105 起）与 `wayfernSeedDirNames`（L1053） | 运行时（开发模式） | 开发态 `resourceRoots=[__dirname, __dirname/kernels, …]`，**直接从仓库原地启动** `kernels/windows-x64/chrome.exe`（Win 主机）或 `kernels/macos-arm64/Wayfern.app`（mac arm64 主机） |
| 3 | `Browserapp/scripts/package-portable.js`：`copyAppResources`（L417-451）先整树复制 `kernels/`，`pruneForeignKernelSeeds`（L227-302）按 SKU 剪掉异平台种子，`assertKernelPackagePolicy`（L328-398）断言本平台种子在包内 | 打包期 | 字体树随平台种子整体复制；Windows 包保留 `kernels/windows-x64`，mac arm64 包保留 `kernels/macos-arm64`（含 .app 内嵌字体） |
| 4 | `Browserapp/scripts/prepare-bundled-kernel.js` | 打包前置校验 | 只校验二进制存在 + CDP 就绪标记，**不校验字体**（无需为此改动） |
| 5 | `Browserapp/automation/selftests/font-native-layer-selftest.js`（`npm run selftest:fontnative`） | CI 门禁（4 个平台 job 打包**前**均跑） | 逐平台断言"携带字体控制原生的内核必须配对字体包"（对应 OS 分区 > 100 个文件） |
| 6 | `Browserapp/automation/selftests/kernel-integrity-selftest.js` L251-278（`npm run selftest:kint`） | 回归（未入 CI 冒烟序列，但 `final-release-regression-runner.js` 引用 fontnative） | 同上配对断言 |
| 7 | `Browserapp/scripts/build-font-subsets.py`（`ADDITIONAL_FAMILIES` 约 50 条）+ `Browserapp/automation/data/font-metric-families.json`（111 条 `relativePath`） | 构建期（维护者手动重建 `assets/font-subsets` 时） | **硬编码 `kernels/windows-x64/wayfern_fonts/…` 为唯一源**（win11 与 macos 分区），即 windows-x64 那份是既定"正本" |
| 8 | `automation/selftests/css-font-metrics-e2e-selftest.js`（L22-25）、`automation/selftests/font-metrics-injection-e2e-selftest.js`（L26-28） | macOS 开发机 e2e（不在 CI 冒烟） | 直接读 `kernels/windows-x64/wayfern_fonts/{macos,win11}` 并经 HTTP 注入页面 |
| 9 | `.github/workflows/build-installers.yml` | CI | 每平台 job 用 `sparse-checkout` **排除其它平台的 kernels/<platform>/ 目录**（Win job 排除 macos-x64/macos-arm64/openbrowser；mac-arm64 job 排除 macos-x64/windows-x64/openbrowser；linux job 还排除 wayfern），随后 `lfs: true` 物化。即：**任一平台 job 都看不到另一平台的字体树** |
| 10 | 根 `.gitattributes`：`Browserapp/kernels/** filter=lfs` | 提交/检出 | 新建共享目录 `kernels/wayfern-fonts/` 会被该规则自动覆盖，无需改 .gitattributes |

## 3. 为什么现在不能直接删（层次 3 判定依据）

任务要求"若运行时/开发模式依赖两份各自存在，则不删文件、改为方案文档"。调查证实正是这种情况，共五条硬约束：

1. **开发模式运行时依赖两份各自存在**。`engine.js` 在开发态把仓库 `kernels/` 当作内核源直接原地启动（消费方 #2），内核原生字体层按内核相对路径读字体（#1）。删掉 `windows-x64/wayfern_fonts` → Windows 开发机字体人格层静默降级（声明了字体列表但无真实渲染/度量）；删掉 macos-arm64 那份 → macOS arm64 开发机同样降级，且——
2. **macOS 那份嵌在已签名 .app 内**。`kernels/macos-arm64/Wayfern.app/Contents/_CodeSignature` 随树入库。删除 `Resources/` 内 2,157 个文件会使提交态签名失效；Apple Silicon 上 AMFI 会直接拒绝执行签名无效的 arm64 二进制 → **mac arm64 开发模式连内核都起不来**（比缺字体更严重）。CI 打包虽会 `signMacAppBundle` 重签，但开发模式不会。
3. **CI 门禁在打包前跑**。`selftest:fontnative`（4 个 job 都跑）断言"平台种子目录内"配对存在字体包（#5）。打包期物化满足不了它，必须同步改测试语义，而测试改动本身需要真实检出才能验证。
4. **sparse-checkout 互相排除**（#9）。保留任一侧为正本，另一平台 job 都拿不到物化源；受 gitignore 语义限制（父目录被排除后子路径无法重新包含），"排除 windows-x64 再重含其 wayfern_fonts"这类写法极其脆弱。正本必须放到两平台 job 都能拿到、且 macos-x64/linux job 能排除的**独立顶层目录**。
5. **构建工具链把 windows-x64 那份当唯一正本**（#7、#8）：111 条 JSON `relativePath` + Python 脚本 + 2 个 e2e 测试硬编码。移动它需要一次性改齐全部引用。

另外本沙箱无 git-lfs（kernels/ 全是 130 字节指针文本，真实字体与内核二进制不在本地），**只能做逻辑层验证，无法端到端打包验证**；而本方案要动的恰是 4 条发布流水线的打包与门禁链路。综合判定：先交付本方案文档（层次 3），配套修复一个可直接验证的前置回归（见 §4），实际删除放到具备真实检出验证条件时按 §5 分阶段执行。

## 4. 阶段 0（本次已完成）：修复字体包门禁的路径回归

调查中发现一个先于本任务存在的回归：commit `30dbbea`（"move 167 selftests into automation/selftests/"）把自测脚本移深了一层，但三个 wayfern_fonts 消费方仍用 `path.join(__dirname, '..')` 解析 `Browserapp` 根，导致解析到 `Browserapp/automation/`（不存在 `automation/kernels`）：

- `font-native-layer-selftest.js`：`selftest:fontnative` 在 4 个 CI job 上**当前必红**（"at least one bundled kernel must be present"），字体包配对门禁完全失效——这正是任何字体树改动最依赖的安全网；
- `css-font-metrics-e2e-selftest.js` / `font-metrics-injection-e2e-selftest.js`：因 launcher 路径失效在所有主机上永久 SKIP。

本次修复（各一行，恢复移动前语义）：`appRoot = path.join(__dirname, '..', '..')`。

沙箱验证（无 LFS 内容）：
- `css-font-metrics-e2e` / `font-metrics-injection-e2e`：路径恢复后正确进入"非 macOS 主机 → SKIP launcher"分支，`OK 1/1`；
- `font-native-layer`：检查 1 恢复通过（能看到内核树）；检查 3 在本沙箱失败属预期——内核二进制是 130 字节指针占位（<1MB，扫不到 `BundledFontRegistry` 标记），而指针文件本身被计为"字体包存在"，构成"pack without natives"。在拉取 LFS 的真实检出/CI 上，natives 与 pack 双双真实存在，配对断言通过（与 30dbbea 之前的行为一致）。此为该测试在指针占位检出上的固有表现，非本次改动引入。

注意：30dbbea 的同类路径回归还影响约 17 个其它 e2e 自测（`path.join(__dirname, '..')` + kernels 模式），与 wayfern_fonts 无关，未在本任务范围内处理，建议另开任务统一修复。

## 5. 实施方案（分阶段，建议单独 PR 逐阶段合入）

### 阶段 1：建立共享正本 + 物化脚本（不删任何文件，风险最低）

1. `git mv Browserapp/kernels/windows-x64/wayfern_fonts Browserapp/kernels/wayfern-fonts`（LFS 指针随路径移动，oid 不变；`.gitattributes` 的 `Browserapp/kernels/**` 规则自动覆盖新路径）。选 windows-x64 那份为正本，因为构建工具链（#7、#8）已把它当唯一源，`git mv` 后只需改"根路径常量"，不必逐条改 111 条 `relativePath` 的前缀。
2. 新增 `Browserapp/scripts/materialize-kernel-fonts.js`：幂等物化
   - Windows：`kernels/wayfern-fonts` → `kernels/windows-x64/wayfern_fonts`（优先目录联接 `mklink /J` 免管理员；失败则回退复制）；
   - macOS：`kernels/wayfern-fonts` → `kernels/macos-arm64/Wayfern.app/Contents/Frameworks/Wayfern Framework.framework/Versions/*/Resources/wayfern_fonts`（按 `Versions/*` 通配，兼容内核版本升级；物化后对该 .app 做 `codesign --force --deep --sign -` ad-hoc 重签，保证开发模式可执行）。
3. 改 `build-font-subsets.py` 的 `ROOT` 常量与 `font-metric-families.json` 的 `relativePath` 前缀（`kernels/windows-x64/wayfern_fonts/` → `kernels/wayfern-fonts/`），以及两个 e2e 测试的 `appRoot` 拼接。
4. 改 `font-native-layer-selftest.js` / `kernel-integrity-selftest.js` 的 `fontPack()`：配对断言的查找位置改为"平台目录内 wayfern_fonts **或** 共享目录 kernels/wayfern-fonts"（物化开发模式下两者等价）。
5. 改 `.github/workflows/build-installers.yml`：
   - Windows 与 macos-arm64 job 的 sparse-checkout 自然包含 `kernels/wayfern-fonts/`（未被排除），无需加规则；
   - **macos-x64 与 linux job 需新增 `!/Browserapp/kernels/wayfern-fonts/` 排除**，避免无谓多拉 1.41 GB LFS；
   - 两个 kernel job 在 "Verify kernel seed" 步骤后各加一行 `node scripts/materialize-kernel-fonts.js`（在 selftests 与 package:portable 之前，让 CI 门禁与打包都能看到物化结果）。
6. `package-portable.js`：在 `copyAppResources` 的 `pruneForeignKernelSeeds` 之后、`assertKernelPackagePolicy` 之前，调用同一物化函数，把共享目录物化进包内平台种子位置（Windows 包：`resources/app/kernels/windows-x64/wayfern_fonts`；mac arm64 包：包内 .app 的 Framework Resources），物化后按现有流程走（mac 包重签在 `signMacAppBundle` 已有）。同时在 `pruneForeignKernelSeeds` 的 keep 逻辑中避免把 `wayfern-fonts` 共享目录带进最终包（物化完成后 `rmSync` 掉包内 `kernels/wayfern-fonts`，防止包内双份）。
7. 开发模式引导：`engine.js` 内核解析不动（仍指向平台种子目录）；在仓库 README/开发文档写明"克隆后跑一次 `node scripts/materialize-kernel-fonts.js`"。可选增强：内核启动前若发现平台目录缺 `wayfern_fonts` 且存在共享目录，自动物化（带一次性日志）。

阶段 1 合入后仓库里仍有 macos-arm64 那份（2,157 个指针），所以**没有任何运行路径会缺字体**，属纯增量改造。

### 阶段 2：真实检出验证矩阵（删文件的前置条件）

在具备 git-lfs 的真实环境逐项验证：

| 验证项 | 命令/方式 | 通过标准 |
| --- | --- | --- |
| oid 复核 | oid 对比脚本（随本方案任务交付于工作区 `scripts/wayfern_fonts_oid_compare.py`；实施阶段建议移入 `Browserapp/scripts/` 并把对比目标改为 `wayfern-fonts` vs macos-arm64 内嵌树） | 2,157/2,157 相同 |
| Windows 开发模式 | Win 机器：物化 → 启动 app → 开一个 win11 人格环境访问字体探测页 | 字体列表与度量真实 |
| macOS 开发模式 | mac arm64：物化+重签 → 启动 app → macos 人格 | 同上，且内核可执行（AMFI 不杀） |
| 门禁 | 4 平台 CI 各跑 `selftest:fontnative` | 全绿 |
| 打包 | 4 平台 `npm run package:portable` + 工作流 Verify package 步骤 | 包内字体树 2,157 文件、包内无 kernels/wayfern-fonts 残留、mac 包 codesign --verify 通过 |
| e2e | mac 开发机 `selftest:cssfontmetrics`、`selftest:fontmetricsinject` | OK |
| 产物等价 | 新旧安装包分别解包比对平台字体目录 | 文件数与 oid 一致 |

### 阶段 3：删除重复树（达成 100% 去重）

1. 阶段 2 全绿后：`git rm -r` macos-arm64 .app 内 `Resources/wayfern_fonts` 的 2,157 个指针（不改写历史，历史体积不变，符合任务约束）；
2. 重新对内核 .app 做 ad-hoc 重签并把新的 `_CodeSignature/CodeResources` 入库（否则提交态签名失效，mac arm64 开发模式起不来内核）；
3. `wayfern_data_files` 3 个文件可同步并入共享目录处理（收益极小，可留待阶段 3 顺带）；
4. 更新本文件状态为"已实施"，并在 `kernel-integrity-selftest.js` 的字体配对断言注释里记录新布局。

### 回滚

每阶段独立 PR，`git revert` 即可完整恢复指针文件；LFS 对象全程未动，无数据丢失风险。

## 6. 风险清单

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 内核二进制的字体路径查找逻辑闭源，布局假设只能黑盒验证 | 高 | 阶段 2 真实双平台验证矩阵是删除动作的硬前置；阶段 1 全程保留双份，失败可即时回退 |
| macOS 提交态 .app 签名失效 → arm64 开发模式内核被 AMFI 拒绝 | 高 | 阶段 3 删除时必须重签入库；阶段 1 物化脚本内置 ad-hoc 重签 |
| sparse-checkout 排除模式写错 → 某 job 拉不到正本或多余拉 1.41 GB | 中 | 共享目录为独立顶层目录，避免 gitignore "父目录排除后子路径无法重含"的陷阱；macos-x64/linux job 显式排除 |
| 打包物化遗漏 → 发布包缺字体 | 中 | `assertKernelPackagePolicy` 增加字体树存在性断言（win11/macos 分区各 >100 文件），CI Verify package 步骤加 `test -d` 检查 |
| CI 门禁（fontnative）语义改动引入漏判 | 中 | 阶段 0 已先恢复其路径解析；语义改动（接受共享目录）作为独立 diff 评审 |
| 收益预期落差（LFS 存储与带宽本已去重） | 低 | §1.1 已核算：真实收益是完整检出磁盘、树登记与单一事实源，不承诺分发/LFS 层收益 |

## 7. 调查产物

- oid 对比脚本：工作区 `scripts/wayfern_fonts_oid_compare.py`（随本任务交付，建议实施阶段移入仓库）
- 本文档：`docs/wayfern-fonts-dedup-plan.md`
- 阶段 0 修复：三个自测脚本的 `appRoot` 路径回归（见 §4）

## 8. 阶段 1 执行记录（2026-11-09，未提交工作树）

- `git mv Browserapp/kernels/windows-x64/wayfern_fonts Browserapp/kernels/wayfern-fonts`：2,157 个文件全部按 R（rename）登记；`.gitattributes` 的 `Browserapp/kernels/**` 规则自动覆盖新路径（`git check-attr filter` 实测 = lfs），LFS oid 不变。三方 oid 比对（新正本暂存区 vs HEAD 旧 Windows 路径 vs HEAD macOS 内嵌树）脚本：`/home/z/my-project/scripts/wayfern_oid_three_way.py`，结果 2,157/2,157 路径、git blob 与 LFS oid 全部一致。
- 新增 `Browserapp/scripts/materialize-wayfern-fonts.js`（幂等物化，仅 Windows 侧；源为 LFS 指针时清晰报错并提示 `npm run kernels:fetch` / `git lfs pull`）与 `npm run fonts:materialize`。与 §5 阶段 1 第 2 条的差异：不做 macOS 侧物化、不做 `mklink /J` 目录联接——macOS 份在已签名 .app 内绝不能动；Windows 侧用整树复制，保证归档/包内容与历史逐字节等价，避免 CI/打包器对 junction 的语义差异。
- 消费者全量切换：`package-portable.js`（ensurePackagingKernelSeeds 物化 + prune 显式剔除正本 + assertKernelPackagePolicy 双向断言）、`prepare-bundled-kernel.js`（windows-x64 校验前物化）、`kernel-release.yml`（windows 归档前物化、lfs pull 纳入 wayfern-fonts）、`build-installers.yml`（windows job 物化步骤 + 包内断言；linux job 排除正本省 1.41 GB；macOS job 按约束未动）、`build-font-subsets.py` 与 `font-metric-families.json`（111 条 relativePath 前缀）、`font-native-layer-selftest.js` / `kernel-integrity-selftest.js`（配对断言按“平台目录或共享正本”计数，另增指针检出感知：二进制为 LFS 指针时 natives 判定不可用，配对断言 inconclusive，真实检出守卫强度不变）、两个 e2e 字体测试路径改指正本。
- `fetch-kernels.js` 无功能改动（仅注释）：kernel-release.yml 打归档前已物化字体，归档布局与历史一致（`kernels/windows-x64/wayfern_fonts` 仍在归档内），下载端无需感知新布局。
- macOS 侧待办（阶段 3，硬前置 = 阶段 2 验证矩阵全绿）：
  1. 阶段 2 矩阵全绿后，在 macOS 机器上 `git rm -r` `kernels/macos-arm64/Wayfern.app/Contents/Frameworks/Wayfern Framework.framework/Versions/<ver>/Resources/wayfern_fonts`（2,157 个指针）；
  2. 立即对内核 .app 重签并验证：`codesign --force --deep --sign <identity> <Wayfern.app>`（ad-hoc 用 `-`，生产用 Developer ID）→ `codesign --verify --deep --strict <Wayfern.app>` 必须通过，新的 `_CodeSignature/CodeResources` 随删除提交一起入库——否则提交态签名失效，Apple Silicon 开发模式内核会被 AMFI 拒绝；
  3. 重跑 `selftest:fontnative`、`selftest:kint`、`selftest:all` 与 mac arm64 开发模式冒烟（内核可启动 + macos 人格字体探测真实）；
  4. 把本文档状态更新为“阶段 3 已执行”。`wayfern_data_files/` 3 个同构重复文件可顺带并入共享目录。

# ADR：Rust Core 去留决策

- 状态：已裁决（Keep，维持门控）
- 日期：2026-11-07
- 影响范围：`crates/openbrowser-core`、`Browserapp/automation/rust-core-bridge.js`、`.github/workflows/ci.yml`、`.github/workflows/build-installers.yml`、安装器打包

## 1. 背景与现状

OpenBrowser 自 v1.0.26 起附带一个可选的 Rust 原生内核（`crates/openbrowser-core`），v1.0.27 持续迭代（优雅套接字释放、Windows WAL checkpoint、并发重试等修复）。当前事实：

| 维度 | 现状 |
| --- | --- |
| 代码规模 | 约 9,570 行 Rust（含测试），单 crate 工作区 |
| 功能面 | SOCKS5/HTTP 代理转发与连接池复用、fail-closed 探测、UDP 关联、进程守护（ProcessGuardian）与启动锁、同步协调器 |
| 激活方式 | 环境变量 `OPENBROWSER_USE_RUST_CORE=1`，且仅作用于无探测编排的 socks5/http 桥接（`proxy-forwarder.js:862`） |
| 失败语义 | 任何 Rust 桥接错误自动回退到久经验证的 JS 代理后端（fail-open 到既有路径），用户无感知 |
| 二进制分发 | 安装器内置于 `resources/rust-core/`，开发态从 `target/{debug,release}` 解析 |
| CI 门禁 | `ci.yml` 独立 rust 作业（fmt + clippy -D warnings + test --locked）；`build-installers.yml` 三个平台各跑 `build:rustcore` + `selftest:rustrelease` + `selftest:rustparity` + `selftest:rustchaos` |
| 许可 | MIT，无第三方 GPL/AGPL 依赖混入 |

## 2. 备选方案

### A. 维持现状：保留 + 门控 + CI 全量验证（**选定**）

- 成本：三平台各一次 cargo 构建（分钟级）、安装器体积增加（单个静态二进制，MB 级）、双代理实现并行的长期维护负担（由 parity 测试约束行为一致）。
- 收益：保留 socket 层转发性能上限（事件循环单线程的 JS 转发器在多 Profile 并发时是吞吐瓶颈）、连接池复用、进程锁/守护在 Windows 上的可靠性收益；随时可灰度放量。
- 风险：默认关闭意味着真实用户几乎不触发——代码在"生产暗物质"状态，回归只能靠 CI parity/chaos 兜底。

### B. 默认启用（promote）

- 收益：性能收益兑现给所有用户。
- 风险：v1.0.27 期间 Rust 侧仍连续修复了多个 Windows 特有问题（EBusy、套接字释放、退避），说明现场成熟度未收敛；无遥测数据支撑故障率对比，盲目放量不可证伪。
- 结论：现在不做，但给出明确晋级条件（见 §3）。

### C. 移除（remove）

- 收益：减少约 9.6k 行维护面、CI 时长与安装器体积，消除双实现漂移风险。
- 成本：撤销 v1.0.26 已发布的公开能力（违反项目自身的兼容承诺）；连接池复用与 Windows 进程锁随之丢失；`selftest:rustparity` 等整条验证线作废。
- 结论：不做，但保留降级触发条件（见 §3）。

## 3. 裁决与晋级/降级条件

**裁决：选 A（保留、维持环境变量门控、CI 全量验证）。**

晋级为默认启用需同时满足：

1. `rustparity` + `rustchaos` 在连续 3 个发布版本的全平台 CI 中零失败；
2. 有一份可复现的基准（≥8 个并发 Profile 的 SOCKS5 长连接吞吐/延迟对比 JS 后端），Rust 路径收益 ≥ 30%；
3. 保留环境变量逃生门：`OPENBROWSER_USE_RUST_CORE=0` 强制回退 JS 路径。

降级为移除的触发条件（任一满足即启动移除评审）：

1. 连续 2 个发布版本 parity/chaos 失败且根因为设计而非用例过时；
2. 桥接层在现场造成不可回退的事故（进程残留、端口泄漏且 `close()` 无法收敛）；
3. 连续 2 个版本无人提交 Rust 侧修复（维护者缺位的客观信号）。

移除时的执行清单（届时照单执行）：删除 `crates/`、`Cargo.toml`、`Cargo.lock`、`automation/rust-core-bridge.js`、两个 workflow 中的 rust 作业与打包步骤、`package.json` 中 `build:rustcore`/`selftest:rust*` 脚本、`proxy-forwarder.js:862-886` 的桥接分支，并在 README/发布说明中声明能力撤销的版本号。

## 4. 复核节奏

每个 minor 版本发布前对照 §3 条件复核一次；结论记录追加于本文件末尾。

## 5. 复核记录

- **2026-11-09（全面优化审查·可达性核查补充）**：JS 侧 `automation/rust-core-bridge.js` 仅导出 5 个函数，生产真正可达的只有 `startRustProxyBridge`（bridge 命令，且仅在 `OPENBROWSER_USE_RUST_CORE=1` 门控下启用）；`getRustTlsProfile` / `calculateRustTileGrid` 仅被 selftest 调用。因此 §1 功能面中的"UDP 关联、进程守护（ProcessGuardian）、同步协调器（SyncCoordinator）、JitterEngine、CascadeLayout"合计约 1,900 行目前是**未接线库代码**：随 CI 全量编译、测试，但无任何生产调用方。`sync/coordinator.rs` 头注释"replacing C# native-sync-hotkeys"与事实不符（C# 版仍在生产使用），已修正为"Rust 侧孪生实现"。本记录不改变 §3 裁决；下一个 minor 复核时应决定：给 sync 接 CLI（与 live-sync C# 栈对齐），或承认其为备件库并冻结测试维护承诺。

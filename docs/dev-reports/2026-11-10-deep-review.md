# 深度审查：执行边界、下载、DNS 与凭据备份

日期：2026-11-10。基线提交：`f082bef`。改动保留在工作区，未提交或推送。

## 审查结论与验收范围

本次按六轮推进：每轮检查代码、复现边界问题、修复并运行专项检查，再进入下一轮。重点是能由代码和本地测试确认的数据一致性、执行正确性、凭据保护与多余 I/O。已确认并纳入本次修改的问题均有回归覆盖。

这不是对整个项目无缺陷、性能已达理论最优的证明。真实内核、桌面 UI、Windows/macOS 原生操作和发布包的验收尚未完成；本报告把它们与已通过的检查分别列出。

## 项目结构与关键约束

| 层次 | 主要入口 | 本次关注点 |
| --- | --- | --- |
| Electron 宿主与 UI | `Browserapp/main.js`、`preload.js`、`renderer.js`、`main/`、`ui/` | 可信 IPC、分层边界、测试注册、状态刷新 |
| Profile 引擎 | `engine.js`、`engine/` | 启停状态、会话查询、独立 Profile、持久化串行队列 |
| 自动化控制 | `automation/local-api-server.js`、`mcp-server.js`、`rpa-engine.js` | API 鉴权和载荷约束、任务取消、总期限、标签页路由 |
| 持久化 | `engine/state-storage.js`、`profile-store-sqlite.js`、`proxy-store.js`、`local-settings.js` | 原子替换、备份恢复、加密、合并写入 |
| 网络 | `downloader.js`、`doh-resolver.js`、`proxy-forwarder.js` | 重定向凭据、断点恢复、响应体上限、代理协议兼容 |
| 可选 Rust 核心 | `crates/openbrowser-core/src/{proxy,sync,process,tls}` | 编译与既有协议、并发、边界、生命周期测试，以及 JS 桥接实测 |

项目已有大量回归脚本和历次优化。`scripts/selftest-all.js` 的 SUITE 是内核无关测试的唯一注册表；真实浏览器脚本和 Rust 桥接验收有独立前提。Rust 的 TLS 编码能力也不能等同于已经集成生产 TLS 传输。

## 六轮修复与复核

| 轮次 | 复现或代码确认的问题 | 修复与复核 |
| --- | --- | --- |
| 1：RPA 执行边界 | 嵌套循环的子步骤没有统一取消/期限检查；错误恢复可能吞掉取消；长等待忽略总期限；任务期限在启动浏览器后才开始计时 | 统一 `assertTaskAlive()`；在步骤前后、恢复入口、页面查询前后及轮询路径检查；等待按剩余期限切片；打字逐字符检查；初始化与启动时间计入预算。新增执行预算回归，复核生命周期、自动化、打字与输入检查 |
| 2：下载正确性与 I/O | 跨来源重定向仍携带 Cookie；Authorization 仅按 host 判断，未覆盖协议变化；304 无正文被当成下载成功并替换旧文件；无哈希断点恢复仍重读整个旧文件 | 按 origin 剥离 Authorization/Cookie/Cookie2；仅接受最终 2xx 响应；只在实际计算哈希时重读旧文件。下载回归 41/41，包括既有哈希续传、重试、取消和损坏区间检查 |
| 3：原子写入资源释放 | 目录 `sync()` 抛错时跳过 `close()`，在不支持目录同步的文件系统上持续泄漏句柄 | 将目录句柄关闭放入 `finally`；注入 `EINVAL`，确认主文件有效且目录关闭一次；复核原子写入和引擎持久化 |
| 4：多标签页与嵌套环境 | goto/reload 默认操作首标签，goback 未传上下文；嵌套 openNewBrowser 没有保存/恢复原标签 ID；导航响应里的 `errorText` 未传播 | 三种导航共用上下文选页，缺少标签时 goto 仍可新建页面；报告导航失败；切换环境时清空、退出时恢复标签状态。新增标签路由回归，覆盖非首标签与子流程异常 |
| 5：DNS 边界 | 域名按字符数检查，未计算标签长度字节和结尾根标签；空标签被静默忽略；DoH 正文无上限，错误状态正文也未取消 | 校验完整 DNS wire name 的 255 字节上限；拒绝内部空标签；复用流式读取器限制正文至 65,535 字节；超限和 HTTP 错误取消正文。DoH 回归 45/45 |
| 6：凭据备份与验收可靠性 | 旧明文状态/代理库迁移时，`.bak` 仍保存明文凭据；已加密代理主文件或从旧备份恢复时也可能留下历史明文 `.bak`；自动化测试使用 PID 命名的共享文件，重复运行可能读到另一轮密钥加密的内容 | 新生成的状态备份和代理备份加密；代理加载/恢复时升级有效的历史明文备份；验证解密后数据不丢失；自动化测试改为独立临时目录；凭据测试直接调用生产设置迁移，替代自写模拟。凭据检查 59/59，复核代理持久化 |

新增的内核无关回归已纳入 SUITE。既有 `state-storage-selftest.js` 也纳入聚合入口，并删除未被消费的同名 npm 重复别名，保留单一注册表约束。

RPA 期限仍是协作式约束：已提交的 CDP 命令和共享浏览器启动需要等待底层完成或其自身期限，不会强行杀死共享浏览器或回滚网页已发生的副作用。预算为 0 的既有无限制行为保留。

备份加密保留加密文件原始字节，旧明文备份在加密后仍能恢复。损坏的诊断副本保持原状；本次没有扫描或清理任意历史目录。引擎 JSON 的备份保护在该状态文件写入时生效，代理有效历史备份在加载/恢复时升级。

## 下载性能实测

命令：`cd Browserapp && node scripts/benchmark-download-resume.js f082bef`。Node v24.22.1，真实回环 HTTP Range 响应，已有 32 MiB 断点文件，新增 4 KiB；每个版本预热 1 次，测量 5 次取中位数。每次核对完整文件内容。

| 指标 | 基线 | 修复后 |
| --- | ---: | ---: |
| 下载路径中位耗时 | 51.072 ms | 2.688 ms |
| 旧断点文件额外重读 | 33,554,432 字节 | 0 字节 |
| 新下载字节 | 4,096 | 4,096 |

该样例约快 19 倍，确定性的收益是省去整个旧断点文件的重复读取。它不代表应用整体提速比例，也不代表公网下载速率；启用 MD5/SHA-256 的续传仍需要读取旧内容以保证完整性。原始结果见 [基准 JSON](2026-11-10-deep-review-resume-benchmark.json)。

## 环境与验证

补齐了 npm 开发依赖、Electron 43.1.1 和 Rust 1.99.1 工具链；现有 Chromium 为 156.0.8078.79。测试临时目录使用工作区内可写目录。未改动仓库锁文件或升级应用依赖版本。

| 检查 | 结果 |
| --- | --- |
| 基线 Node 聚合 | 107 通过、2 个 macOS 专用跳过、0 失败 |
| 修复后 Node 聚合 | 110 通过、2 个 macOS 专用跳过、0 失败；共 112 个注册脚本 |
| ESLint | 0 错误、0 告警 |
| Rust `cargo test --workspace --locked` | 117 通过、0 失败 |
| JS/Rust 真实代理桥接 parity | 8/8，包含实际目标服务器与字节传递 |
| Rust chaos | 5/5，包含 15 次启停、进程强杀、无响应上游、50 并发连接、布局边界 |
| 人类输入专项 | 打字 19/19、输入 30/30 |
| 补丁 | `git diff --check` 通过 |
| Chromium RPA 集成 | 已新增可运行脚本；当前宿主限制导致无法完成，未计入通过 |

在 `Browserapp/` 内可复核：

```bash
npm ci --include=dev --ignore-scripts
npm run lint
npm run selftest:all
npm run selftest -- rpabudgetexecution
npm run selftest -- rpatabrouting
npm run selftest -- statestorage
npm run selftest -- credentials
npm run selftest -- download
npm run selftest -- doh
node scripts/benchmark-download-resume.js f082bef
```

Rust 测试在仓库根目录运行 `cargo test --workspace --locked`；构建后的 Node 桥接验收分别为 `npm run selftest:rustparity` 和 `npm run selftest:rustchaos`。

## 未完成的真实环境验收

新增 `npm run selftest:rpae2e` 使用真实 Chromium、真实本地网页和生产 CDP/RPA 方法，检查选中标签的导航/刷新/后退、可信输入事件和结果变量。它通过 `OPENBROWSER_TEST_CHROMIUM_PATH` 选择可执行文件；容器确有需要时，可显式设置仅用于测试的 `OPENBROWSER_TEST_NO_SANDBOX=1`。

当前本地 Chromium 报 `socket() failed: Operation not permitted`，无法创建 ProcessSingleton 所需的 Unix socket；隔离浏览器访问工作区测试服务又报 `ERR_CONNECTION_REFUSED`。安装缺失依赖不能解除该宿主限制。因此这项测试、桌面渲染与原生窗口操作不能标为成功。

Windows/macOS 原生控制、平台专用指纹内核、Git LFS 内核物化、安装包升级及真实网络吞吐仍需在支持的目标系统验收。后续性能优化应以真实桌面事件循环延迟、IPC 体积、内存和并发浏览器负载为依据；本地 CPU/I/O 基准不足以替代这些数据。

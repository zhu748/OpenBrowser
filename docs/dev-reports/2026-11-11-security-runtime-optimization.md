# 安全、执行边界与恢复优化

日期：2026-11-11（Asia/Shanghai）。基线：`main` / `e0f51c4`。

本轮根据实际源码和独立故障复现进行修改，覆盖凭据、JSON/SQLite 存储、RPA、更新器、商店下载、输入预算、诊断提示和 CI。未调整版本号，未提交或推送，也未触发发布。

## 修改与行为

| 问题 | 当前行为 | 关键位置 |
| --- | --- | --- |
| 解密失败缓存按 salt 扩散 | 缓存键包含完整密文及口令的摘要；损坏记录不会阻止正常兄弟记录解密 | `credential-crypto.js` |
| 加密失败写入明文 | 事务拒绝写入并保留已提交密文；旧明文行即使字段未变化，也在下次保存时加密 | `automation/profile-store-sqlite.js` |
| 主密钥无法持久化时使用会话密钥 | 拒绝凭据写入；不覆盖损坏/不可读密钥；使用独占创建、fsync，并协调并发创建者 | `credential-crypto.js` |
| 环境超过 5000 条后截断 | JSON 和 SQLite 加载全部可解码环境；完整 UI 同步不再被 5000 条上限拒绝 | `engine/init.js`、`engine/profile-sync.js` |
| 缺失签名降级更新 | 后续版本必须有可信 Ed25519 签名；404、网络错误、空/超长签名及校验失败均不能运行安装器。仅精确历史版本 1.0.27 保留兼容分支 | `automation/app-update.js` |
| Windows 更新资源名称错位 | 更新器匹配发布的 `OpenBrowser-Windows-x86_64-with-kernel-setup.exe` | `automation/app-update.js` |
| 未签名安装包直接发布 | 发布终结任务验证离线签名后才把草稿转为正式版本 | `.github/workflows/build-installers.yml` |
| 正则阻塞主进程 | 自定义正则在独立 Worker 中执行；最多 1 秒，支持取消，等待 Worker 终止后释放执行容量 | `automation/rpa/regex.js`、`regex-worker.js` |
| 超时任务继续占用底层资源却释放槽位 | 超时拒绝调用方并发送 AbortSignal；底层工作实际结束后才释放槽位。默认最多等待 10000 项，排队取消立即回收容量 | `automation/task-scheduler.js` |
| 商店抓取未接入取消 | 页面、图片和 CRX 下载接收调用方取消；带取消的请求独立执行，避免一个调用方中断其他调用方共享的请求 | `chrome-store-metadata.js`、`automation/store-fetch.js` |
| 单任务绕过 RPA 并发限制 | 计划、API 和 IPC 单任务共用任务体队列，并发上限 8；同一环境流程串行，重复任务拒绝执行 | `automation/rpa-engine.js` |
| 执行中的任务可删除、成功删除报告不一致 | API/IPC 保护运行和排队任务；存储返回明确的 deleted 字段 | `automation/api/rpa-routes.js`、`main/automation-ipc.js`、`rpa-store.js` |
| RPA 变量及结果明文落盘 | 使用既有 credential-crypto 加密和原子替换；旧 JSON 成功读取后迁移；密钥不匹配时保留原文件并拒绝重置 | `automation/rpa-store.js` |
| 大文件输入没有预算 | CSV/文本/JSON 最多 32 MiB、100000 行；CSV 最多 1000 列，CSV 字段/文本行最多 1048576 个 UTF-16 码元；保留流式读取和取消语义 | `automation/rpa/file-input.js`、`csv.js` |
| 故障只有控制台日志 | 设置页和应用日志显示环境解码、备份恢复、RPA 隔离及代理异常摘要；不返回原始失败记录；提供八种 UI 语言 | `automation/storage-diagnostics.js`、`main.js`、`renderer.js`、语言目录 |
| 事件循环 p95/p99 测量错误 | 使用完整直方图 percentile，附带 max 和样本数；修复模拟 HTTP 请求结束重复计数、状态水位及数据库关闭 | `automation/event-loop-monitor.js`、`scripts/benchmark-real-load.js` |

RPA 存储预算限制的是加密前的数据字节数；最终文件额外包含加密信封。通用调度器无法强制终止忽略 AbortSignal 的任意 JavaScript Promise：这类工作继续占用其槽位，防止越过资源上限；商店批处理另有总期限，避免排队调用永远等待。

## 回归覆盖

新增四个脚本并注册到唯一 SUITE 清单：

- `reviewstorage`：损坏/正常密文交错、加密故障事务保留、旧明文行迁移、两个后端 5001 条环境、完整 UI 同步、RPA 加密迁移、错密钥保留、损坏密钥拒绝及 8 个进程并发创建密钥。
- `reviewruntime`：队列容量、超时后真实资源占用、排队取消、商店底层取消、单任务并发限制、同环境互斥、活跃任务删除保护、正则超时及取消。
- `reviewupdate`：真实下载入口的签名成功、签名缺失/网络故障/HTTP 500/空/超长/伪造签名、包篡改、失败文件清理及四平台发布资源契约。正向测试在隔离模块中使用临时 Ed25519 信任根，不修改生产公钥，也不执行安装器。
- `reviewinputmetrics`：字节/行/字段/列预算、多块 UTF-8 输入、取消、直方图读取以及诊断脱敏。

商店响应专项另外增加页面、图片和 CRX 的实际流读取取消；已有持久化测试更新为验证解密后的完整数据。

CI 新增 Ubuntu / Windows / macOS × Node 22 / 24 的六组合边界回归。这里只配置工作流，未把远端运行结果计入本轮本地通过数。

本轮最终检查结果：

| 检查 | 实际结果 |
| --- | --- |
| ESLint 全量 | 通过，0 error、0 warning |
| SUITE 内核无关聚合 | 148 通过、2 个 macOS 内核限定脚本跳过、0 失败 |
| MCP HTTP/stdio 专项 | 61 个检查通过；另含于聚合 |
| 商店元数据专项 | 13/13 通过 |
| 发布静态及变异检查 | 31/31 通过 |
| YAML 解析 | 两个修改后的工作流均通过；新矩阵为 6 个组合 |
| 10/100/1000 环境本地基准 | 完成，原始 JSON 随报告保存 |
| git diff --check | 通过 |

最初新增测试的两处夹具错误和恢复提醒缺失翻译均已修正；上表统计来自修正后的检查，不将此前失败运行计作通过。

## 本地性能观察

原始数据：[security-runtime-benchmark.json](2026-11-11-security-runtime-benchmark.json)。Node 24.22.1，真实引擎和 SQLite；浏览器会话由固定 20ms 响应的本地 HTTP 服务模拟。每个规模分别执行 50 次全量和 50 次增量轮询。

| 环境数 | 全量构建/序列化 p95 | 增量构建/序列化 p95 | 全量平均响应 | 增量平均响应 | 轮询期间事件循环 p99 / max |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 0.557 ms | 2.638 ms | 35815 B | 1080 B | 3.009 / 30.294 ms |
| 100 | 6.279 ms | 4.204 ms | 358904 B | 10514 B | 2.009 / 14.754 ms |
| 1000 | 32.347 ms | 8.142 ms | 3601055 B | 106859 B | 1.944 / 36.897 ms |

增量平均值包含首个全量响应和水位。10 环境场景增量的固定开销高于全量。会话查询的两位并发调用者共享在途查询：10 个会话产生 10 个 HTTP 请求、返回 20 行；100 个会话产生 100 个请求、返回 200 行，峰值并发 8、失败 0。

这些是本机观察数据，基准期间环境存在其他测试负载；不能替代 Electron 布局/绘制、真实浏览器负载或严格的改动前后对比。旧均值分桶测量与本轮直方图分位数也不能直接比较。

复现：

```sh
cd Browserapp
npm ci --include=dev --ignore-scripts
npm run lint
npm run selftest:all
node scripts/benchmark-real-load.js --sizes 10,100,1000 --json
```

代理环境可能需要 `NODE_USE_ENV_PROXY=0`，并将 TMPDIR 指向存在且可写的临时目录。

## 发布操作变化

1. 四平台安装包上传到草稿后，终结任务生成并上传精确的 `SHA256SUMS.txt`。
2. 签名尚不存在时，任务失败并保留草稿。下载该清单，在离线签名机执行 `node Browserapp/automation/update-trust-tool.js sign SHA256SUMS.txt --key <私钥文件>`。
3. 上传 `SHA256SUMS.txt.sig` 到同一草稿，然后仅重跑失败的终结任务，保持安装包字节不变。任务使用应用中已有公钥验证后才正式发布。

无需把私钥交给 GitHub Actions。重建安装包后必须重新生成并签署清单。缺失真实签名时，本地测试不会代签或替换生产信任根。

## 实机验收边界

本地没有 Cargo，未编译 Rust；没有运行真实 Electron/Chromium/Firefox 或 Windows/macOS 桌面与安装包。Rust 源码没有改动。后续发布仍需在实际平台验证系统密钥服务、Worker 打包可达性、恢复提醒、浏览器启动退出及签名安装。

大入口的进一步拆分和跨进程崩溃恢复事务仍属于后续工程。本轮按职责新增小模块并保持现有入口，未将文件变短当作性能优化结论。

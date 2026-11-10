# 代码分类与维护入口

本次执行边界、下载、DNS 与凭据备份的深度复核见 [六轮审查记录](dev-reports/2026-11-10-deep-review.md)。

本项目由 Electron 桌面宿主、浏览器环境引擎、UI、自动化服务、网络代理和可选 Rust 核心组成。下面按职责定位源码；生成数据、浏览器内核和检查工具分别维护。

| 类别 | 入口与目录 | 负责的工作 |
| --- | --- | --- |
| 桌面宿主 | `Browserapp/main.js`、`preload.js`、`host-bridge.js` | 窗口、IPC、退出顺序、宿主能力桥接 |
| 扩展 IPC | `Browserapp/main/extensions-ipc.js` | 扩展安装/分配/删除路由和有界重启；通过宿主传入的可信 IPC 注册函数挂载 |
| 内核 IPC | `Browserapp/main/kernel-ipc.js` | 14 个内核查询、下载、安装、校验、固定版本和文件选择频道；使用同一可信注册入口 |
| 环境 IPC | `Browserapp/main/profile-ipc.js` | 12 个环境管理频道，统一移除前的同步选择清理；同步状态由宿主持有并通过回调注入 |
| UI 交互 | `Browserapp/renderer.js`、`ui/`、`renderer-*.js` | DOM、表单、交互状态、页面切换 |
| 分组界面 | `Browserapp/ui/ui-groups.js` | 分组页面、编辑对话框、删除分组、批量移动环境；事件绑定由 renderer 负责 |
| 列表数据逻辑 | `Browserapp/ui/ui-profile-list.js` | 搜索、分组过滤、收藏/运行状态筛选、高级筛选、排序、分页、统计；同时支持浏览器和 CommonJS |
| 环境状态合并 | `Browserapp/ui/ui-profile-state.js` | 启动时按 ID 合并 UI 与引擎环境，恢复凭据和代理，保留列表顺序；通过回调注入校验及代理策略 |
| 事件刷新调度 | `Browserapp/ui/ui-refresh-scheduler.js` | 合并事件、串行刷新、保留执行期间的迟到请求、暂停及恢复；不依赖 DOM |
| 引擎协调 | `Browserapp/engine.js` | 公开 `BrowserEngine`、生命周期协调、状态快照、持久化调度 |
| 引擎领域模块 | `Browserapp/engine/` | 启动、Firefox 启动、清理、Profile CRUD、代理、指纹交付、资源限制、扩展管理 |
| 环境同步准备 | `Browserapp/engine/profile-sync.js` | 暂存校验、凭据恢复、代理合并、扩展继承和网络失效记录；整批成功后才发布到引擎 |
| 会话查询 | `Browserapp/engine/session-api.js` | 跨 UI/API 共享有界查询队列，合并同一运行实例的重叠查询，过滤退出及重启后的旧结果 |
| 扩展管理 | `Browserapp/engine/extensions-api.js` | 读取元数据、安装/重载/删除、分配、按扩展汇总环境；通过 prototype mixin 保持原调用接口 |
| 本地控制面 | `Browserapp/automation/local-api-server.js`、`mcp-server.js`、`protocol/` | HTTP/MCP 路由、输入和权限校验、协议转换 |
| 自动化执行 | `Browserapp/automation/rpa-engine.js`、`rpa-store.js`、`task-queue.js`、`task-scheduler.js` | 步骤执行、任务记录、并发与排队 |
| RPA 容量策略 | `Browserapp/automation/rpa-store-budget.js` | 按 UTF-8 字节预算回收旧任务、日志与结果；保留最新任务、pending/running 任务及计划/模板 |
| 持久化 | `Browserapp/engine/persistence.js`、`engine/state-storage.js`、`automation/profile-store-sqlite.js`、`local-settings.js`、`coalesced-writer.js` | 引擎保存/退出排空/导出、原子替换、SQLite、设置、合并写入、凭据加密 |
| 浏览器通信与同步 | `Browserapp/cdp.js`、`live-sync-v5.js`、`automation/window-sync-bridge.js`、`native-*.cs` | CDP、窗口/输入同步、原生平台能力 |
| 网络与代理 | `Browserapp/proxy-forwarder.js`、`automation/proxy-store.js`、`doh-resolver.js`、`downloader.js` | SOCKS/HTTP、代理探测、DNS、下载 |
| 商店响应读取 | `Browserapp/chrome-store-metadata.js`、`automation/response-body.js` | 商店页面/图标/CRX 下载与缓存、正文读取字节限制和流取消 |
| 指纹构建与注入 | `Browserapp/automation/fingerprint/`、`user-agent.js`、`kernel-init-sync.js` | Persona 构造、主页面/Worker 注入、内核字段映射 |
| Rust 核心 | `crates/openbrowser-core/src/{proxy,sync,process,tls}` | 可选代理桥、同步/进程/TLS 库；生产接线范围见 `rust-core-decision.md` |
| 构建与开发工具 | `Browserapp/scripts/`、`.github/workflows/` | 启动、打包、获取内核、检查注册表、性能基准、CI |
| 自动检查 | `Browserapp/automation/selftests/`、各目录 `*-selftest.js` | Node 单元/集成检查、真实内核检查；是否进入聚合执行由 SUITE 注册表决定 |
| 手动审计工具 | `Browserapp/automation/*audit*.js`、`final-release-regression-runner.js` | 对抗审计和发布验收；运行前确认内核、系统、网络及数据目录前提 |
| 数据与资源 | `Browserapp/automation/data/`、`assets/`、`kernels/` | 生成语言数据、字体/图像、第三方内核；内核存在指针文件时仍需物化和校验 |

## 已建立的模块边界

- `renderer.js` 从 `window.OpenBrowserProfileList` 调用数据操作；DOM 创建和事件处理继续由 UI 层负责。`index.html` 必须先加载列表模块，加载顺序由自测检查。
- `OpenBrowserProfileState` 和 `OpenBrowserRefreshScheduler` 同样先于 renderer 加载，仅各暴露一个命名空间；数据合并和刷新调度可在 Node 中独立验证，无需添加跨脚本函数全局变量。
- 状态事件的刷新在前一个请求结束后再调度下一次；执行期间的多个事件合并为一次后续刷新。窗口隐藏时保留待办，重新可见时恢复。直接调用的其他刷新入口仍有各自行为。
- `filterProfiles` 的参数包含查询、分组、顶部标签、高级条件、运行状态查询和排序。字段定义集中在列表模块；高级标签筛选与字段搜索均支持 `tag` 和 `tags`。
- `summarizeProfiles` 每次调用构建新统计。一次列表渲染将同一份统计传给分组栏和标签栏，避免额外扫描，也能反映对 Profile 对象的原地修改。
- `extensions-api.js` 沿用引擎现有 mixin 方式。调用方继续使用 `engine.listExtensions()` 等方法；扩展分配修改负责失效状态缓存和发出通知。
- `persistence.js` 统一引擎保存、退出排空和状态导出。`flushPersistence()` 会传播写入失败，并等待执行期间新增的请求。通用合并写入器的 `keepAlive` 选项仅在请求等待期间维持命令行进程生命期。
- `syncProfiles()` 每次校验传入对象，不依据可变对象的引用跳过校验；写入只经过统一 `persist()`，避免在合并写入前重复扫描、哈希及保存。SQLite 元数据及扩展 UPSERT 通过 SQL 条件跳过内容相同的行，无需维护额外快照缓存。
- 同步准备阶段不修改 live Map 或已有分配 Set；全部输入通过后才发布。重复 ID 按输入顺序合并，后一个脱敏输入可继承前一个暂存记录的凭据。数据库失败时仍保留待重试的内存状态，输入校验的原子性与数据库原子性分别由各层负责。
- `ProfileStoreSqlite.saveEngineState()` 在一个外层事务内保存元数据、扩展、分配、Profile。11 处原事务模板共用同步 `withTransaction()`；嵌套调用使用保存点。回滚统一失效 Profile 哈希和分配快照，避免重试跳过未提交数据。分组和其他存储有各自的保存入口。
- Profile 哈希分两段写入 SHA-256，中间使用 NUL 分隔，避免对整个 Profile JSON 再做一次 JSON 转义。哈希仅用于内存差异缓存，关闭数据库连接时也会清空。
- `sessions()` 同一引擎最多并发查询 8 个环境，同一运行对象和端口的重叠调用共享请求。查询前后均检查运行实例，保持输出顺序和逐项错误。数量较大时有排队等待；CDP HTTP 的默认 5 秒绝对期限会真正销毁超时连接，调度器不会提前释放仍在执行 I/O 的名额。
- `ProfileStoreSqlite.saveAssignmentsDiffed()` 比较独立的 Set 快照，将变化的环境分配写入一个事务。直接分配、删除扩展/环境和关闭数据库会失效快照；返回给调用方的 Set 不与快照共享可变对象。
- UA 构建器直接生成规范的脚本，不再由 `engine.js` 在加载时替换导出函数；CDP 的旧脚本兼容修正仍保留。
- 异步任务的 `drain()` 等待调度器完成通知。它包含等待期间新入队的任务；`destroy()` 拒绝排队任务，等待正在运行的任务结算后才完成排空。
- RPA 分开记录运行与排队任务，支持排队取消；全部停止也覆盖正在创建记录的计划。正在执行的步骤仍按协作式取消处理，运行标记由 `finally` 释放。
- RPA 自动启动先发布共享 Promise，再进行可能异步的日志写入；同一环境的并发调用复用该 Promise。
- RPA 私有存储使用紧凑 JSON，容量回收与实际文件使用相同的字节口径。可回收历史记录采用批量移除，每条任务的尺寸在一次回收中缓存使用。
- 商店的页面、图标和 CRX 共用 `readResponseBuffer()`，按字节执行 4 MiB、2 MiB、120 MiB 限制。页面/图标的超时涵盖完整正文读取，拒绝或超限时取消流；不支持流的兼容适配器只能在缓冲完成后检查大小。

## 修改时的维护约定

1. 新增规则优先放入已有领域模块。无 DOM 的数据计算使用明确输入和返回值，避免再增加跨脚本全局变量。
2. 修改引擎 Profile、运行态或扩展分配时，检查 `status()` 快照缓存的失效时机。
3. 批量变更先校验完整输入，再修改状态；数据库支持整批事务时一次提交。磁盘目录删除与数据库事务仍是两个阶段，不能假定它们有共同回滚能力。
4. 新增内核无关自测登记在 `scripts/selftest-all.js` 的 SUITE 中，使用 `npm run selftest -- <name>` 调用。真实内核检查单独声明所需平台和内核。
5. 性能改动同时保留行为检查和可重复测量。`scripts/benchmark-review.js` 比较局部 CPU 路径，桌面性能另行记录事件循环延迟、IPC 载荷、内存和浏览器数量。

## 本地检查

在 `Browserapp/` 执行，使用 Node 22.12 或更新版本；`TMPDIR` 需指向真实存在、可写的目录。

```bash
npm ci --include=dev --ignore-scripts
npm run lint
npm run selftest:all
npm run selftest -- profile-list
npm run selftest -- extensionsapi
npm run selftest -- profilebatch
npm run selftest -- sched
npm run selftest -- crx
npm run selftest -- ui-modules
npm run selftest -- enginepersistence
npm run selftest -- sqliteassignments
npm run selftest -- uabuilder
npm run selftest -- groupsui
npm run selftest -- rpalifecycle
npm run selftest -- rpabudget
npm run selftest -- rpaopen
npm run selftest -- extensionsipc
npm run selftest -- kernelipc
npm run selftest -- profilesync
npm run selftest -- profilestate
npm run selftest -- refreshscheduler
npm run selftest -- sqlitenoop
npm run selftest -- storeresponse
npm run selftest -- enginetransaction
npm run selftest -- enginesessions
npm run selftest -- cdpdeadline
npm run selftest -- profileipc
node scripts/benchmark-review.js 0c06ae8
node scripts/benchmark-persistence.js
node scripts/benchmark-rpa-budget.js 0c06ae8
node scripts/benchmark-maintenance.js 65ddc51
node scripts/benchmark-session-persistence.js 65ddc51
```

后续拆分重点及本轮证据见 [性能与可维护性审查](dev-reports/2026-11-10-performance-maintainability-review.md)。
继续优化的结果见 [第二轮持久化与模块边界优化](dev-reports/2026-11-10-round2-persistence-and-modules.md)。
RPA 与主进程的后续改动见 [第三轮 RPA 生命周期与容量回收](dev-reports/2026-11-10-round3-rpa-lifecycle-and-budget.md)。
本次同步、刷新、下载与分类复审见 [项目复审与优化记录](dev-reports/2026-11-10-project-review.md)。
下一轮查询并发、事务和哈希优化见 [会话与事务优化记录](dev-reports/2026-11-10-next-optimization.md)。

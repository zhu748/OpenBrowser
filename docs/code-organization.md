# 代码分类与维护入口

本次执行边界、下载、DNS 与凭据备份的深度复核见 [六轮审查记录](dev-reports/2026-11-10-deep-review.md)。

本项目由 Electron 桌面宿主、浏览器环境引擎、UI、自动化服务、网络代理和可选 Rust 核心组成。下面按职责定位源码；生成数据、浏览器内核和检查工具分别维护。

| 类别 | 入口与目录 | 负责的工作 |
| --- | --- | --- |
| 桌面宿主 | `Browserapp/main.js`、`preload.js`、`host-bridge.js` | 窗口、IPC、退出顺序、宿主能力桥接 |
| 扩展 IPC | `Browserapp/main/extensions-ipc.js` | 扩展安装/分配/删除路由和有界重启；通过宿主传入的可信 IPC 注册函数挂载 |
| 内核 IPC | `Browserapp/main/kernel-ipc.js` | 14 个内核查询、下载、安装、校验、固定版本和文件选择频道；使用同一可信注册入口 |
| 环境 IPC | `Browserapp/main/profile-ipc.js` | 15 个环境管理频道，统一移除前的同步选择清理；同步状态由宿主持有并通过回调注入 |
| IPC 结果契约 | `Browserapp/shared/ipc-result.js` | 环境修改命令和编辑快照通过普通对象传递结果；在 renderer 中重建带 code/stale 的错误，避免 Electron/contextBridge 丢失自定义 Error 字段 |
| 编辑会话 | `Browserapp/ui/ui-profile-commands.js` | 打开时读取字段与版本号配对的引擎快照；过期/取消的请求不显示。先确认单环境命令成功，再发布本地数据；冲突不自动重试旧表单 |
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
| API 路由定义 | `Browserapp/automation/api/route-registry.js` | 每组别名只定义一次 HTTP 方法及处理器；方法门禁与路由分发共用定义，并在加载时校验处理器 |
| 自动化执行 | `Browserapp/automation/rpa-engine.js`、`rpa-store.js`、`task-queue.js`、`task-scheduler.js` | 步骤执行、任务记录、并发与排队 |
| RPA 动作注册 | `Browserapp/automation/rpa/step-registry.js` | 每个执行器集中声明动作别名；分发、支持范围和处理器校验由同一份数据生成。执行图校验限制循环引用、深度和总步骤数 |
| RPA 文件路径 | `Browserapp/automation/rpa/paths.js` | 输出与文件输入的物理路径校验；解析已存在的父目录，拒绝子路径中的外逃/悬空链接。表格导入保留 Desktop/Documents/Downloads、OneDrive 等明确允许的目录 |
| RPA 容量策略 | `Browserapp/automation/rpa-store-budget.js` | 按 UTF-8 字节预算回收旧任务、日志与结果；保留最新任务、pending/running 任务及计划/模板 |
| RPA 变量 | `Browserapp/automation/rpa/variables.js` | 无浏览器依赖的变量复制、插值、条件值解析与结果快照；循环对象隔离可变子对象，BigInt 结果转为十进制字符串，特殊键不改变对象原型 |
| 持久化 | `Browserapp/engine/persistence.js`、`engine/state-storage.js`、`automation/profile-store-sqlite.js`、`local-settings.js`、`coalesced-writer.js` | 引擎保存/退出排空/导出、原子替换、SQLite、设置、合并写入、凭据加密 |
| 浏览器通信与同步 | `Browserapp/cdp.js`、`live-sync-v5.js`、`automation/window-sync-bridge.js`、`native-*.cs` | CDP、窗口/输入同步、原生平台能力 |
| 网络与代理 | `Browserapp/proxy-forwarder.js`、`automation/proxy-store.js`、`doh-resolver.js`、`downloader.js` | SOCKS/HTTP、代理探测、DNS、下载 |
| 地址与探测数据 | `Browserapp/network/address-policy.js`、`network/probe-results.js` | 共用主机名/IP 规范化、内网与 metadata 分类，以及无 I/O 的探测响应归一化和错误分类 |
| 代理配置 | `Browserapp/network/proxy-config.js` | 代理输入解析、规范化、浏览器端点与脱敏显示；proxy-forwarder.js 保留既有公开导出 |
| 通用出站请求 | `Browserapp/network/outbound.js` | 代理提取/刷新 URL 的校验、重定向与正文大小限制。与模板同步共用 socket 实际使用的 DNS 答案校验，metadata 始终禁止；内网策略由调用方显式决定 |
| HTTP 传输 | `Browserapp/network/http-request.js` | Node HTTP/HTTPS 的字节上限、完整响应读取、重定向与连接清理；一个绝对期限覆盖整条重定向链，支持 AbortSignal。代理出站、模板同步及内核元数据共同使用 |
| 内核归档 | `Browserapp/automation/kernel/archive.js` | 归档成员校验、解压、符号链接检查和安全安装路径；内核选择与安装编排仍由 browser-kernel.js 负责 |
| 内核摘要信任 | `Browserapp/automation/kernel/archive-trust.js` | 摘要读取、提取、原子文件写入与有界记录；同进程按目录串行合并 pin 写入，查询等待此前已入队的写入 |
| 内核元数据 | `Browserapp/automation/kernel/metadata.js` | 可信主机 JSON/文本读取；每跳校验目标，响应限额按 UTF-8 传输字节执行，内核选择与安装编排不再重复实现流读取 |
| 商店响应读取 | `Browserapp/chrome-store-metadata.js`、`automation/response-body.js` | 商店页面/图标/CRX 下载与缓存、正文读取字节限制和流取消 |
| 指纹构建与注入 | `Browserapp/automation/fingerprint/`、`user-agent.js`、`kernel-init-sync.js` | Persona 构造、主页面/Worker 注入、内核字段映射 |
| Rust 核心 | `crates/openbrowser-core/src/{proxy,sync,process,tls}` | 可选代理桥、同步/进程/TLS 库；生产接线范围见 `rust-core-decision.md` |
| 构建与开发工具 | `Browserapp/scripts/`、`.github/workflows/` | 启动、打包、获取内核、检查注册表、性能基准、CI |
| 发布资源清单 | `Browserapp/scripts/runtime-manifest.js` | 显式列出顶层运行入口及资源领域，保留原生辅助程序和供应商树；排除开发、自测与审计工具，并检查复制后的目录 |
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
6. 修改命令的 `id` 必须与 `profile.id` 相同且目标已存在；创建环境继续使用现有创建/同步入口。不要通过全量同步绕开编辑版本冲突。
7. `profiles:apply-commands` 和 `profiles:editor-state` 返回 `{ ipcResult: 1, ok, value/error }`。preload 原样转发普通数据，renderer 在 contextBridge 之后调用 `unwrapIpcResult()`。其他既有 IPC 返回格式不变。
8. 状态轮询继续脱敏。每次打开编辑器，仅可信 UI 使用 `profileForEdit()` 获取完整字段及配对版本号；表单不能使用轮询缓存里的新版本号搭配本地旧字段。发生冲突时可刷新源数据供重新编辑，当前旧草稿不获得新版本号。调用方需要在编辑器打开后执行操作时，应 `await openProfileEditor()` 并检查返回值。
9. 新增顶层运行文件必须加入发布清单。自测应验证实际复制及本地 require/HTML 资源闭包；供应商内核、字体与扩展资源树保持原结构。
10. 新的后台模块不能依赖浏览器全局对象，UI 不能依赖宿主进程全局对象。ESLint 对 engine/main/network/kernel/API 与 UI/shared 的相应边界进行检查。
11. Profile revision 是引擎存活期间的单调序号，调用方只比较是否相同，不假设某一环境每次恰好加一。删除/重建与 clear 不重用旧序号；无需为所有历史 ID 保留永久计数表。
12. 出站 DNS 策略应直接作为 socket 的 lookup 使用，检查同一次查询的所有答案；不要先单独查询/检查，再让 socket 重新解析。该策略接线范围是 `network/outbound.js` 和模板同步；浏览器自身及代理上游的解析有各自策略。
13. HTTP 的 socket 空闲超时不能代替总期限。共享传输在响应 end 前保留绝对期限，并处理 error/aborted/提前 close；拒绝和跳转会销毁旧连接。跨 origin 跳转移除 Cookie、Authorization 等敏感头，每跳仍由调用方 URL 策略校验。模板请求保留原有不自动跟随跳转的行为。
14. 静态 RPA 执行图最多允许 64 层嵌套、10,000 个步骤，超过限制或包含循环引用时明确拒绝。任务在分配浏览器前检查；商店预处理也检查图形边界。动作是否可执行与图是否安全分别判断，便于展示暂不支持的商店模板。
15. RPA 文件路径必须同时满足逻辑目录和物理目录边界，新增文件也要检查已存在的父目录。允许的根目录本身可重定向到 OneDrive 等位置，但其子链接不能外逃。路径验证与后续文件操作仍是两个阶段，不构成防御其他进程并发替换路径的原子文件系统沙箱。

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
npm run selftest -- addresspolicy
npm run selftest -- profilecommands
npm run selftest -- editorsave
npm run selftest -- runtimemanifest
npm run selftest -- apiroutes
npm run selftest -- rpavariables
npm run selftest -- editoropen
npm run selftest -- outbounddns
npm run selftest -- archiveconcurrency
npm run selftest -- httpboundaries
npm run selftest -- rparegistry
npm run selftest -- rpapaths
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

# 代码分类与维护入口

## 第五轮：MCP 连接并发、停用边界与资源释放（2026-11-16）

前四轮已完成执行/恢复边界、分记录加密与按需读取、流式事件合并、闲置会话回收及模板引用索引。进入本轮前，第四轮记录的 16 个文件哈希均与工作区一致；其最后一次完整回归为 266 通过、1 部分执行、6 跳过、0 失败。源码与生成资产仍是本地修改，未提交或推送。

- `rebuild/agent-mcp-pool.js` 按服务串行复用连接，同时最多进行 4 个不同服务的初始化/验证。同名服务不会重复握手；排队取消会释放等待项和名额，失败初始化不发布半成品工具快照。发现顺序仍与配置顺序一致，总工具数超过 200 时停止本次发现。
- 停用、删除或改配置会使该服务的旧连接代次失效。工具在等待连接完成后再次核对启用状态、配置和实际连接归属，不能在配置已停用但连接尚未关闭的间隙调用远端。已经发送的请求无法承诺撤销远端副作用。
- 窗口范围受限的任务立即返回空 MCP 工具列表，不等待无关的慢验证。退出会中止临时验证和排队/初始化操作，再关闭持有连接；清理失败仍保留所有权以便再次关闭。
- `rebuild/agent-mcp-connection.js` 独立处理 stdio/HTTP 传输。HTTP 错误、类型错误和会话错误都释放响应正文；请求校验响应 ID，SSE 支持多行、分块 CRLF、UTF-8 和服务端 ping，客户端回包可以正常接受 HTTP 202。无匹配结果的已结束响应及时报错；服务端请求回包同时最多 32 个，超过上限关闭连接，回包写入也有绝对期限。
- stdio 写入等待可取消，取消通知有自己的期限，stdin 背压不能无限阻塞退出。关闭共用同一结果，失败可重试；等待直接启动进程的退出并关闭继承管道，必要时强制结束该进程。不声明终止服务自行脱离的全部后台进程。
- `automation/selftests/agent-mcp-lifecycle-selftest.js` 使用真实 HTTP/子进程验证慢服务隔离、并发复用/上限、排队取消恢复、停用竞态、临时连接退出、失败关闭重试、工具预算、响应释放/ID/SSE，以及背压和继承管道。旧综合验收改为等待新的连接所有者操作，HTTP 夹具的释放支持重复调用。
- MCP 与授权桌面脚本在刷新后按实际入口重新打开 MCP 弹窗或会话；已加入三平台桌面 CI。新 Node 生命周期门禁使用上一轮补齐的生产依赖环境。

```sh
cd Browserapp
npm run selftest -- agentmcplifecycle
npm run selftest -- rebuild:mcp
node scripts/benchmark-agent-mcp.js --output ../work/agent-mcp/report.json
node rebuild/agent-mcp-ui-selftest.cjs
node rebuild/agent-approval-ui-selftest.cjs
```

MCP 基准使用 8 个本地服务夹具，每次握手等待 60 ms，取三次发现耗时的中位数；可用 `--baseline` 指定旧 MCP 模块对照。它不代表真实远端服务或模型推理速度。剩余结构工作仍包括超长单会话的分段读写、主进程已解密正文的回收、归档界面的逐步替换与原生跨平台发布验证。

## 第四轮：闲置会话回收与模板引用索引（2026-11-16）

- `rebuild/agent-conversation-cache.mjs` 统一闲置正文及运行事件的回收。保留原来的 3 条闲置会话预算，淘汰时同时释放消息、原始事件、运行状态和进度；元数据、未发送草稿、附件预览及排队提示词保留。当前查看、仍在运行和待审批的会话不参与淘汰，因此这不是进程总内存上限。
- `compiler/patch-workbench.cjs` 将上述规则接入原聊天界面；缓存命中时更新访问顺序，异步历史详情发布后重新登记缓存，防止迟到响应绕过上限。修改编译源并生成 `roxy-ui/assets/agent-conversation-cache.js`，不修改归档输入。
- `agent-state-store.js` 在加密 V2 索引的正文引用中附加可选 `templateReference`，正文保存时同步计算。模板编号不再为寻找检查点引用而展开全部会话；内存中已编辑的检查点仍优先参与编号计算，防止复用历史模板 ID。
- 早期 V2 索引没有该字段时，在第一次确实需要编号引用时校验并读取对应正文，临时提取引用而不展开惰性会话。后续成功的索引保存保留这些投影；失败或损坏不会当成零引用。新字段不更改正文加密格式，整个 `local-agent/` 目录及原密钥的备份规则继续适用。
- `automation/selftests/agent-retention-selftest.js` 同时覆盖独立策略、实际生成的缓存入口和详情发布代码、1000 条会话回收、当前/运行/审批保护、草稿保留、迟到响应以及旧索引兼容。真实桌面验收覆盖 10 个后台模型夹具回合、当前正文和草稿保留、淘汰后重新加载，以及 200 条历史下从原模板弹窗创建模板时零正文读取。
- CI 的 Node 22/24 三平台边界门禁安装锁定的生产依赖并禁用安装脚本。Agent 调度依赖 `cron-parser`，不能把服务级验收放进完全没有依赖的环境；该门禁不需要下载 Electron 或浏览器。

```sh
cd Browserapp
npm run selftest -- agentretention
node scripts/benchmark-agent-retention.js --output ../work/agent-retention/report.json
node rebuild/agent-conversation-cache-ui-selftest.cjs
node rebuild/agent-history-ui-selftest.cjs
```

保留量基准执行实际生成的缓存入口，使用普通状态夹具；序列化字节不是进程堆占用。模板编号基准比较相同加密记录上的原检查点扫描与索引投影，不含索引加载、保存和模型推理耗时。长时间保持打开的单个会话、活跃会话和用户草稿仍可能较大。

## 第三轮：流式事件与前端历史保留（2026-11-16）

- `rebuild/agent-content-emitter.js` 保持首个模型正文片段立即发布，后续片段按约 24 ms 或 8,192 个 UTF-16 码元的阈值合并，再由 Agent 分配连续的原子事件序号。阈值不拆分单个提供商片段；事件循环忙碌时定时器可能延后。正常结束、错误和取消都先排空待发布文字并清理定时器，定时发布失败会终止该模型请求。
- `run.partialAnswer` 与已发布序号一起更新，日志快照不包含尚未发布的尾部，避免打开日志后下一条增量重复显示。SSE/NDJSON 完成标记、响应预算与工具参数校验保持原有规则。
- 原界面的序号范围替换逻辑由 `compiler/patch-workbench.cjs` 校正：`startSequence === sequence` 是追加事件，只有真正的多序号范围才替换同键片段。修改编译源并重新生成，不直接改归档输入。
- `agent-channel.js` 仅为已打开且尚在缓存内的日志维护增量正文，未打开日志只保留摘要；已打开详情共用 `agent-task-history.mjs` 的 12 条缓存。加载期间的事件合并为一次尾随读取，不能用缺少前文的尾部覆盖完整快照。附件更新按用户消息 ID 合并，日志增量同时核对会话和运行 ID。
- 后端完成保存并淘汰超过 500 条上限的日志后，通知界面删除对应摘要和详情，避免持续运行时前端列表无限增长。
- `automation/selftests/agent-streaming-selftest.js` 验证真实 HTTP 分段、原子事件与范围回放、截断和取消、快照序号一致性、日志淘汰及前端缓存竞态。`rebuild/agent-streaming-ui-selftest.cjs` 使用真实 Electron，验证暂停提供商、重连和页面重载后的中文/emoji 正文与最终存储一致。

```sh
cd Browserapp
npm run selftest -- agentstreaming
node scripts/benchmark-agent-streaming.js --output ../work/agent-streaming/report.json
node rebuild/agent-streaming-ui-selftest.cjs
```

流式基准使用本地 HTTP 模型夹具和真实 Agent 事件序列化；可用 `--baseline` 指定先前的 completion 模块、`--channel-baseline` 指定先前的 channel 源码做对照。前端保留量来自实际 channel 源码和轻量 ref 夹具，序列化字节不等同于进程堆占用；耗时是本机单次样本，不作为推理速度或延迟保证。

## 第二轮：Agent 历史记录与按需读取（2026-11-16）

- `rebuild/agent-state-store.js` 将 `state.enc` 升级为加密的 V2 索引，会话正文/检查点和日志正文分别放在 `local-agent/records/` 的独立加密记录中。内容变化才生成新记录；索引原子替换后才提交内存状态。配置和已读等元数据保存不读取历史正文，模型运行只声明当前会话/日志的正文变更范围。
- 原 V1 文件在迁移前以 `state.legacy.enc` 保留，迁移中断不发布半成品索引。保存失败清理本次新记录且不更新指纹缓存；上一索引保存在 `state.previous.enc`，清理只回收当前及上一索引都不引用的旧记录。`records.initialized` 防止已经建立的空历史库在索引丢失时被误当新库。
- 启动只加载索引及检查引用文件是否存在；首次使用某条会话/日志时校验加密、记录身份和摘要并读取正文。损坏记录报错，不回退为空历史。存储所有者通过 `AgentService.writeQueue` 串行调用；不同实例的过期快照拒绝覆盖。成功的关闭共用结果，失败的关闭允许重试。
- 备份/转移必须包含整个 `local-agent/` 目录，不能只复制 V2 `state.enc`。旧程序不识别 V2；`state.legacy.enc` 是迁移时恢复点，不含迁移后的新增历史，不应自动覆盖当前索引。
- `rebuild/agent-history.js` 提供不含正文/输入/检查点的日志摘要，以及去除重复事件载荷的按需详情。原完整日志接口保留兼容；默认工作台重连使用 `taskLogs:summary`，打开日志才请求 `logs:detail`。界面读取会话分页时省略后端保留的检查点。
- `rebuild/agent-task-history.mjs` 管理详情请求合并、最多 12 条已打开详情的缓存、选择切换和重连/删除后的迟到响应。列表刷新保留当前详情；选中日志变化时合并一次尾随刷新。
- 附件正文及索引共用可靠文件写入函数，先同步正文再发布索引；索引提交失败回收新附件，临时读取失败可重试。

```sh
cd Browserapp
npm run selftest -- agentstore
npm run selftest -- agenthistory
node scripts/benchmark-agent-history.js --output ../work/agent-history-performance/report.json
node rebuild/agent-tasks-ui-selftest.cjs
node rebuild/agent-history-ui-selftest.cjs
```

历史基准使用模拟正文、真实加密和文件同步；分别记录一次性迁移成本、元数据读取及热保存成本，不能将其解释为真实大模型推理性能。新格式保留按会话读取的内存边界，超长单会话的正文仍会整体读取和保存。

## 执行边界与性能门禁（2026-11-16）

- `rebuild/agent-completion.js` 负责 OpenAI SSE/Ollama NDJSON 协议、响应预算与完成状态。提前结束、长度截断或拒绝不能发布完成，也不能执行收到一半的工具回合。
- `rebuild/agent-browser-tools.js` 持有每次工具调用的 CDP 客户端。取消会关闭该客户端并等待操作结束，保留用户浏览器；已发送的导航或已发生的副作用不能承诺撤销。
- `rebuild/context-window.js` 将压缩摘要保留在 tool 消息，兼容清理旧检查点生成的 system 摘要后缀。任务授权仍由执行层单独校验。
- 该轮 Agent 与工作台本地存储共用 `engine/state-storage.js` 的文件同步、原子替换及失败清理，保留当时的加密文件格式。本轮历史记录的 V2 迁移见上方章节。
- SQLite 的 `record_decode_failures` 保留损坏分组/扩展的原始记录，诊断只返回计数。批量扩展保存保留隔离记录与分配；导出拒绝静默缺项。修复后读取或显式删除会清理对应诊断。
- `profiles:count` 返回缓存投影中的未删除环境数量；`workbench-usage.mjs` 合并侧栏计数刷新，避免读取全量环境 DTO，并隔离卸载后的迟到响应。
- `scripts/selftest-all.js` 的原生条目必须声明 `runtimes`，可声明 `argsByRuntime`。`scripts/native-test-runner.js` 从同一注册表生成 Chromium/Firefox 门禁；跳过、部分通过及超时均阻止通过，CI 保留逐项报告和日志。
- `scripts/benchmark-workbench.js` 运行默认 `obui://app` 界面，测量真实搜索提交、翻页、选择和计数载荷，包含 IPC、SQLite 与绘制等待；旧 `benchmark-real-render.js` 继续覆盖兼容界面。交互预算与纯渲染预算分别维护。

```sh
cd Browserapp
npm run selftest -- agentboundaries
npm run selftest -- metadatarecovery
npm run selftest -- workbenchusage
npm run selftest -- nativeplan
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome node scripts/native-test-runner.js --runtime chromium
OPENBROWSER_FIREFOX_BINARY=/absolute/path/to/firefox node scripts/native-test-runner.js --runtime firefox
node scripts/benchmark-workbench.js --sizes 10,100,1000 --interaction-budget-ms 1500 --output ../work/workbench-performance/report.json
```

## 当前模块边界与重构约束

默认界面由 `rebuild/compiler/` 从锁定输入生成到 `roxy-ui/`；旧版
`renderer.js` / `ui/` 仍由 `OPENBROWSER_ROXY_UI=0` 启用。生成产物、第三方
输入和历史证据分别管理，不把它们作为手写业务代码批量格式化或删除。

| 模块 | 职责与维护约束 |
| --- | --- |
| `rebuild/local-service.js` | 依赖接线、本地数据加载、原子保存、串行写入与失败回滚；不承载领域分发分支 |
| `rebuild/profile-dto.js` | 工作台与引擎字段转换；高级选项和噪声字段双向共用映射；原 `local-service` 导出保持兼容 |
| `rebuild/profile-fields.js` | 双向字段别名与窗口位置编码；不进行 I/O 或加载代理转发器 |
| `rebuild/local-route-registry.js` | 从领域表注册处理器与执行策略，拒绝重名、缺失处理器及缺失策略 |
| `rebuild/routes/` | `profiles`、`collections`、`preferences`、`host`、`proxies`、`transfer` 与现有服务委派；处理器显式接收 service，不反向导入宿主服务 |
| `engine/launch-profile.js` | 启动结果的修订号校验与持久指纹身份迁移；Chromium/Firefox 共用，不依赖具体启动实现 |
| `engine/launch-preparation.js` | 共用的代理准备、资源闸、出口定位、IP 策略及发布；启动器保留内核选择、进程创建和资源释放 |
| `main/fatal-error.js` | 未捕获异常的单次关闭与 15 秒退出上限；停止新 IPC，退出码为 1，跳过退出自动备份 |
| `automation/shutdown.js` | 按顺序尝试全部关闭与存储排空，汇总原始失败；并发调用共用一次尝试，失败后允许重试 |
| `automation/fingerprint/persona-locale.js`、`persona-display.js`、`consistency.js` | 指纹语言链、GPU/屏幕投影与组装后诊断；生成器保留随机抽样顺序和历史 seed 语义 |
| `automation/fingerprint/persona-ua.js` | UA 与 Client Hints 意图解析、字段别名、严格模式及实际内核版本；无 I/O，不修改输入对象 |
| `automation/user-agent.js`、`automation/fingerprint/runtime/ua-bootstrap.js` | 宿主 UA 构建与浏览器安装分开维护；安装函数只接收 JSON 配置和私有 token，源码直接接受 lint |
| `rebuild/workbench-notifications.mjs` | 可独立 lint 和行为测试的通知状态、内容转义与已读操作；生成器只注入 Vue 绑定和导入 |
| `rebuild/workbench-table.mjs` | 表格只采纳当前请求的结果，失败时保留现有列表。环境列表合并后台刷新并校正已消失的页码。 |
| `rebuild/workbench-api-settings.mjs` | 按顺序保存 API 设置，使用主进程的确认更新表单，同时保留确认期间的输入。密钥轮换走独立 IPC。 |
| `rebuild/workbench-navigation.mjs`、`rebuild/workspace-windows.js` | 主进程分配原生功能窗口，渲染进程在初始路由完成后接收待处理的导航。 |
| `engine/launch-preferences.js` | Chromium 搜索偏好写入与启动数据清理；进程、锁和失败清理由启动编排持有 |
| `engine/launch-display.js` | 时区参数校验与桌面显示查询；旧引擎导出保持兼容 |
| `engine/browser-exit.js` | 两种浏览器的退出/错误清理接线，以及发布 running item 前发生的退出重放 |
| `shared/default-preferences.js` | 无 I/O 的偏好默认值和规范化；存储层不再反向依赖 profile runtime policy |
| `shared/seeded-random.js` | 确定性随机序列；变更必须保持既有 seed 的输出兼容 |
| `automation/font-subset-path.js` | 两种字体交付路径共用的资源定位顺序，不缓存工作目录 |
| `rebuild/compiler/patch-source.cjs` | 通用 AST 补丁；每个目标必须恰好命中一次，编辑不得重叠，输出语法通过后才能写入 |

代理转发实现是引擎的必需能力。模块加载错误保留原始异常，不安装空代理桥或
伪造直连配置；纯配置解析直接依赖 `network/proxy-config.js`。

`LocalService` 的 parallel 策略用于不修改本地 JSON 的独立引擎/网络操作，
不等同于“只读”。local JSON 变更仍由一个队列串行执行，失败恢复前一个快照；
跨引擎与本地元数据的关联变更继续使用 `profile-relations.js` 的补偿流程。
read 策略在同一队列中等待先前写入完成，只复制返回值，不复制整个仓库。
Agent 与 Cookie Robot 也通过领域表分发；Agent 声明使用自己的存储，
Cookie Robot 继续等待本地元数据加载。不得将本地 JSON 修改登记为 read。
嵌套命名空间按最长前缀分发，精确路由优先，不依赖声明顺序。
新增接口必须在领域表同时声明处理器和执行策略。ESLint 对新领域处理器执行
100 行函数上限、禁止 DOM 全局及反向依赖；不把此门槛直接套到全部历史代码。

### 测试与构建入口

`rebuild/acceptance-manifest.json` 保留工作台验收清单；
`scripts/workbench-test-registry.js` 声明运行条件并供聚合门禁和独立验收共用。
全部 Node 工作台验收均自动进入 `scripts/selftest-all.js`。界面测试通过
`selftest-helpers.cjs` 在系统临时目录创建独立数据根，不依赖先前构建留下的目录。

```sh
cd Browserapp
npm run selftest -- localroutes
npm run selftest -- compilerpatches
npm run selftest -- enginedependencies
npm run selftest -- workbenchregistry
npm run selftest -- rebuild:skills
node rebuild/acceptance-runner.cjs --list
node rebuild/acceptance-runner.cjs --runtime node --output work/acceptance-node
npm run inventory:modules
npm run selftest:all
npm run lint -- --max-warnings 0
npm run rebuild:ui
```

日常构建、自测和独立验收默认将证据写入 `work/rebuild/evidence/`。
`OPENBROWSER_EVIDENCE_DIR` 可指定统一输出根目录，相对路径以仓库根目录解析。
独立验收的 `--output` 同样相对仓库根目录解析，并传递给全部子测试。
发布验收更新历史证据时显式指定 `--output docs/rebuild/evidence`；
构建和单项检查则设置同名环境变量。常规检查不改写受跟踪的历史结果。
每项验收有独立超时，记录退出码、终止信号及源码哈希；部分 runtime 的运行
结果明确标记范围，不能解释为完整桌面验收。已纳入通用 runner 的重复 npm
入口移除后，统一使用 `npm run selftest -- rebuild:<name>`。

需要浏览器的桌面验收可显式设置 `OPENBROWSER_TEST_KERNEL_BINARY` 为已安装的
独立浏览器路径。测试辅助函数通过生产内核管理器验证后，将该路径写入各自
临时数据根的内核元数据；不修改开发者的设置，也不依赖首次下载恰好先于表单
操作完成。未设置时保留原首次启动行为，系统浏览器路径仍按生产策略拒绝。

兼容层裁决：旧界面仍保留；`live-sync-v5.js` 继承 V4，不能单独删除 V4；
Rust 代理桥仍受开关控制，未接线库能力的后续裁决继续遵循
`rust-core-decision.md`。其他领域的大规模迁移应按能力对照逐项执行。

`inventory:modules` 按来源、职责、维护状态和安装包资源策略输出
`work/module-inventory.json`，包含新增但未忽略的源码。分类是路径清单，
不代替动态加载和功能可达性证明。`fingerprint-pool`、`task-queue`、
`aspect-manager`、`window-command-bus` 保留测试源码，明确排除出安装包。
旧 UI、V4/V5 同步基类与受门控 Rust 能力继续保留兼容契约。

新增的启动准备、异常边界、通知、语言/显示投影与证据定位模块使用
100 行函数上限及显式错误处理门槛。单项行为回归包括
`fatalerror`、`workbenchnotifications`、扩展后的 `localroutes`、
`compilerpatches`、`workbenchregistry` 和 `fpalign`。
`node rebuild/maintenance-ui-selftest.cjs` 验证真实 Electron 通知弹层、
内容转义、已读操作及异常退出码，并进入三平台桌面 CI。

### 第二轮：取消、关闭与构建边界

- 启动准备在异步资源检查、出口检测、持久化返回后重新检查生命周期和配置修订。
  进度监听回调触发的停止同样有效；取消后的网络结果不能发布或继续启动内核。
- `engine.beginShutdown()` 设置永久关闭屏障；普通 `stopAll()` 仍可停止后重启，
  应用退出后则拒绝新启动，并取消等待中的启动续程。
- 正常退出保留本地服务、浏览器、存储的原有关闭顺序。致命异常提前启动同一份
  浏览器排空 Promise，避免某个本地服务挂起时将外部浏览器留给已退出的宿主。
- 自动化关闭失败也会阻止退出备份；浏览器停止未确认时不读取浏览器数据。
  各自动化关闭步骤始终继续尝试，AggregateError 保留失败步骤和原始 cause。
- `patchComponentSetups` 与普通 AST 补丁共用单次匹配、重叠检查及语法检查。
  组件只替换 setup 行为并保留原 render 表达式，校验成功后才写回文件。
- 清单区分默认工作台 CSS 与兼容 UI，并细分内核、API、存储和原生集成。

新增 Node 回归：`launchpreparation`、`automationshutdown`；已有 `lifecycle`、
`compilerpatches`、`localroutes` 补充相应边界。真实挂起回归需要独立内核：

```sh
OPENBROWSER_TEST_KERNEL_BINARY=/absolute/path/to/chrome \
  node rebuild/quit-failure-selftest.cjs --fatal-hang
```

该用例也进入 Chromium 原生 CI，明确检查浏览器进程在宿主退出之前消失。

### 第三轮：UA 随机与跨上下文注入

- `automation/editor-ua.js` 负责编辑器请求与已保存配置的合并；省略 OS/版本时
  复用已有值，显式切换 OS 时不沿用旧系统版本。Firefox 移动端预览与实际启动
  使用同一支持范围。
- `automation/user-agent.js` 分开解析 Navigator 平台与 Client Hints 平台，校验
  随机池和 uint32 seed，复制品牌条目以免一次修改污染其他环境。
  有效 seed 保留原抽样顺序和权重；自定义矛盾配置继续由一致性校验拒绝。
- UAData 接收者由原生 getter 校验，兼容 Chromium 每次读取产生新对象的行为。
  不使用 `instanceof` 接受伪造对象；两个文档分支共用高熵结果构造。
- 文档与 Worker 的可选 `formFactors` 请求等待原生能力探测，CDP 与请求头
  使用相同设备分类。Worker 交付修订提升为 9，持久指纹算法仍为 1/2。

`uarandomcontracts` 验证配置合并、平台、随机池和数组隔离；`fprealms` 验证
新对象、首次异步请求、返回值隔离和非法接收者。`uarealmsnative` 使用真实内核，
对照未注入环境核对 Windows/Android 配置在文档、iframe、Dedicated Worker、
Shared Worker、Service Worker 中的 UA、Client Hints 和 HTTP 请求头，已加入
Chromium 原生 CI。内核路径通过 `OPENBROWSER_CHROMIUM_BINARY` 指定。

144 份既有生成结果在排除私有交付桥 token 后保持一致，覆盖六种 OS 和两种
持久指纹版本。该回归与真实 Linux Chromium 检查不代表已验证原生 Windows、
macOS、Gecko、WebKit 或物理移动设备。后续优先补齐这些平台的同类门禁，
并继续核实移动设备目录的数据来源。UA 运行时代码拆分见下一轮记录。

### 第四轮：UA 源码边界与双内核验证

- `user-agent.js` 从 1,200 余行缩减为约 570 行；约 640 行安装逻辑转为可直接
  lint 的函数源码，移除一个未使用的辅助函数。宿主保留数据构建、HMAC token
  和序列化，浏览器函数不引用 Node API。
- `persona-ua.js` 承接生成器中的 UA 意图阶段，保留随机抽样位置和权重。
  Client Hints 的驼峰与下划线别名在入口统一处理，已保存配置保持不变。
  先前被忽略的版本字段现在参与一致性检查，严格模式仍优先使用实际内核。
- 修正注入配置说明中过时的 metadata fallback 差异，保留真实的 realm 差异。
- Firefox Worker 门禁复用生产初始化时的首个标签页，覆盖三个 Worker 的
  prefs 字段、HTTPS Worker 脚本改写和带认证的上游代理链，已进入原生 CI。
  CI 安装 NSS 工具，通过临时 profile 的信任库导入测试 CA。

本轮用 AST 对比确认安装函数与原模板的有效逻辑一致；144 份完整指纹回放
连同私有交付桥字段保持一致。既有生成门禁继续覆盖 240 份 V1 身份、2,000
份 V2 配置及跨宿主回放。别名检查覆盖三个配置来源、自定义/生成 UA、规范
字段优先级、严格模式和矛盾版本拒绝。

本地原生验证使用 Linux Chromium 159 与 Playwright Firefox 159：前者覆盖
UA 跨 realm 及 Windows/Android/iOS 配置的原生 API 合约，后者覆盖 V1/V2
文档、iframe、HTTP UA、数据保留和上述 Worker 交付范围。这不证明原生
Windows/macOS、WebKit、物理移动设备或所有 Firefox Worker 来源已经通过。
后续优先将同类原生门禁扩展到其他宿主平台，继续拆分 Worker 模板中的共享
协议逻辑，并核实移动设备目录中的型号、系统版本和 GPU 来源。

## 配置一致性与恢复约定（2026-11-12）

- `engine/profile-publication.js` 是环境同步与编辑命令的统一发布/持久化入口。合并写入失败时，关联的失败编辑回滚到原始状态；已经成功的后续写入和独立扩展分配不被旧失败覆盖。
- UI 启动以引擎为配置来源，仅在空引擎时迁移旧 UI 数据。现有环境的 `profiles:sync` 必须携带读到的 `rev`；API 更新也经过维护/删除检查。新增、复制、导入、代理应用与批量偏好只发送选中环境，支持 `{delta:true}` 返回。
- 主窗口可提前绘制，但第一次 `system:info` 等待完整的存储/自动化/IPC 初始化屏障。`OpenBrowserApp.whenReady()` 可供真实桌面检查等待，不能用固定延时替代；`OPENBROWSER_USER_DATA` 可显式选择隔离的数据目录。
- `cloud-ops.createBackupPackage` 统一处理手动备份、文件导出与单环境推送。完整凭据由引擎读取，UI 只传 ID 和选项。包含浏览器文件时，环境必须停止；读取期间持有维护占用，未合并的 SQLite WAL 明确拒绝。超限或不可读条目记录在 `meta.skippedFiles` / `backupWarnings`，UI 显示不完整提示。
- `automation/cloud/restore-state.js` 在修改文件或元数据前保存加密的 `cloud-restore-pending.obstate`。恢复涉及的全部 ID（包括只有配置的环境）取得占用；代理库恢复另有维护令牌。失败会补偿文件、代理、分组、环境和扩展分配；补偿失败保留占用和原始恢复材料。
- 自动化 API 启动前检查恢复日志。未提交的操作补偿回滚，已持久化提交决定的操作完成清理；重试可重复执行。此流程依赖当前数据根、凭据密钥与文件系统可用，不构成跨设备的分布式事务。
- 状态 IPC 在实际接收的行上使用不透明游标；引擎保留最多 8 份只读版本索引。历史过期或未知实例回退全量，旧对象水位仍兼容；界面替换行数组后丢弃旧游标，在途旧响应不能覆盖新编辑。
- 指纹日志在写入端统一处理嵌套 URL 和敏感键。MCP 使用公共 HTTP 传输，认证重试共用总期限，并处理正文截断、取消及按字节限额。
- `automation/mac-launcher.js` 独立生成 Dock 启动脚本。环境编号外的路径使用 shell 字面量转义；启动器不自动补 `--no-sandbox` 或宽泛远程调试 origin。新增桌面 CI 在 Linux、Windows、macOS 上执行真实 Electron/IPC/SQLite/DOM 行为检查，供应商内核仍需对应平台验收。

新增回归入口：`optimizationintegration`、`restorejournal`、`diagnosticlauncher`、`mcptransport`、扩展后的 `statusrefresh`，以及需要 Linux 显示服务的 `appstartup`。验证摘要保存在 `dev-reports/2026-11-12-optimization-verification.json`。

环境补齐、Rust 连接池过期回收、原生测试清理和基准口径修正见 [环境与原生验证续轮](dev-reports/2026-11-12-environment-native-optimization.md)；工具路径与复现命令见 [开发环境说明](dev-environment.md)。

保存退避、代理并发与验证归属、共享通信隔离和出口状态一致性的四轮审查见 [2026-11-12 深度审查与优化](dev-reports/2026-11-12-review-boundaries.md)。改前改后对照脚本为 `Browserapp/scripts/benchmark-review-boundaries.js`。

调度公平性、状态响应精简与恢复跨重启保护见 [调度、状态响应与恢复中断保护优化](dev-reports/2026-11-11-queue-status-recovery-optimization.md)。

本轮凭据、存储完整性、RPA 并发与正则隔离、更新签名和性能测量见 [安全、执行边界与恢复优化](dev-reports/2026-11-11-security-runtime-optimization.md)。

- `automation/rpa/regex.js` 与 `regex-worker.js`：有界、可终止的自定义正则执行。
- `automation/event-loop-monitor.js`：直接读取事件循环直方图分位数，不对均值取分位数。
- `automation/storage-diagnostics.js`：对 UI 输出脱敏后的恢复提醒，原始失败记录保留在存储层。
- 所有 RPA 执行入口共用任务体调度；超时不能在底层工作结束前释放资源槽位。
- 环境加载和完整 UI 同步不能按显示数量截断；RPA 输入预算与环境存储完整性分别管理。

代理/RPA 退出排空、设置读写与恢复、API 密钥并发的后续四轮检查见 [持久化与并发优化记录](dev-reports/2026-11-11-persistence-concurrency-followup.md)。

DNS、下载连接、RPA 变量隔离和 CSV 导出的本次五轮检查见 [网络与 RPA 复核记录](dev-reports/2026-11-11-network-rpa-csv-review.md)。

本轮列表 DOM 更新、RPA 步骤契约与任务记录整理见 [2026-11-11 项目复审](dev-reports/2026-11-11-review-followup.md)。

后续队列、批量操作、同步文本和显示缓存的连续迭代见 [优化与复审记录](dev-reports/2026-11-11-iterative-optimization.md)。

本次执行边界、下载、DNS 与凭据备份的深度复核见 [六轮审查记录](dev-reports/2026-11-10-deep-review.md)。

CDP 连接复用、RPA 文件操作、API 嵌套凭据和状态索引的本次复核见 [通信与文件处理审查](dev-reports/2026-11-10-cdp-rpa-and-response-review.md)。

后续扩展同步、会话选择竞争与流式导入优化见 [同步与流式输入复审](dev-reports/2026-11-10-sync-session-and-streaming-review.md)。

本项目由 Electron 桌面宿主、浏览器环境引擎、UI、自动化服务、网络代理和可选 Rust 核心组成。下面按职责定位源码；生成数据、浏览器内核和检查工具分别维护。

| 类别 | 入口与目录 | 负责的工作 |
| --- | --- | --- |
| 桌面宿主 | `Browserapp/main.js`、`preload.js`、`host-bridge.js` | 窗口、IPC、退出顺序、宿主能力桥接 |
| 扩展 IPC | `Browserapp/main/extensions-ipc.js` | 扩展安装/分配/删除路由和有界重启；通过宿主传入的可信 IPC 注册函数挂载 |
| 内核 IPC | `Browserapp/main/kernel-ipc.js` | 14 个内核查询、下载、安装、校验、固定版本和文件选择频道；使用同一可信注册入口 |
| 环境 IPC | `Browserapp/main/profile-ipc.js` | 15 个环境管理频道，统一移除前的同步选择清理；同步状态由宿主持有并通过回调注入 |
| 自动化 IPC | `Browserapp/main/automation-ipc.js` | 22 个 RPA、模版、API Key 与 MCP 频道；注入可信注册入口，并在每次调用时获取当前自动化服务及窗口。临时步骤先校验再创建任务 |
| IPC 结果契约 | `Browserapp/shared/ipc-result.js` | 环境修改命令和编辑快照通过普通对象传递结果；在 renderer 中重建带 code/stale 的错误，避免 Electron/contextBridge 丢失自定义 Error 字段 |
| 数值与坐标契约 | `Browserapp/shared/profile-values.js` | UI/Node 共用无宿主依赖的有限数值、经纬度及成对坐标校验；空值、布尔值及越界坐标不能成为有效位置 |
| 代理脱敏 | `Browserapp/shared/proxy-redact.js` | 浏览器与 Node 共用一份字符串脱敏实现；`automation/proxy-redact.js` 保留原有 require 入口 |
| UI 持久化 | `Browserapp/ui/ui-state-store.js` | 通过回调读写存储和当前状态，统一立即保存、日志/出口事件合并保存、退出排空、配额降级与凭据脱敏；降级保留规范的 note/tag 字段 |
| 编辑会话 | `Browserapp/ui/ui-profile-commands.js` | 打开与保存控制器通过明确回调访问状态；过期/取消的请求不显示。代理关联使用第一次保存返回的版本，不能借用后台刷新的新版本重试旧草稿 |
| UI 交互 | `Browserapp/renderer.js`、`ui/`、`renderer-*.js` | DOM、表单、交互状态、页面切换 |
| 分组界面 | `Browserapp/ui/ui-groups.js` | 分组页面、编辑对话框、删除分组、批量移动环境；事件绑定由 renderer 负责 |
| 列表数据逻辑 | `Browserapp/ui/ui-profile-list.js` | 搜索、分组过滤、收藏/运行状态筛选、高级筛选、排序、分页、统计；同时支持浏览器和 CommonJS |
| 列表行更新 | `Browserapp/ui/ui-profile-rows.js` | 维护显示字段的缓存键，按可见页 ID 复用、替换、移动及删除行；未变化的行保持原 DOM 位置；renderer 提供行构造和选择状态 |
| 环境批量集合 | `Browserapp/ui/ui-profile-batch.js` | 按 ID 集合线性移除、回收或恢复环境；保留顺序和已有记录引用，供批量操作与回滚共用 |
| 同步文本数据 | `Browserapp/ui/ui-sync-text.js` | 文本分行、顺序/随机分发及游标、会话数字排序；每次排序只建立一份会话索引，编号解析与 DOM 无关 |
| 环境状态合并 | `Browserapp/ui/ui-profile-state.js` | 启动时按 ID 合并环境并恢复匹配的备用代理凭据。轮询合并只复制变化行，未变化时保留数组和对象引用；明确的 null 清除旧出口信息 |
| 事件刷新调度 | `Browserapp/ui/ui-refresh-scheduler.js` | 合并事件、串行刷新、保留执行期间的迟到请求、暂停及恢复；不依赖 DOM |
| 引擎协调 | `Browserapp/engine.js` | 公开 `BrowserEngine`、生命周期协调、状态快照、持久化调度 |
| 引擎成员组合 | `Browserapp/engine/compose.js` | 安装前检查全部领域贡献的重名、访问器和继承成员覆盖；`BrowserEngine.methodOwners` 提供只读成员归属，保留原调用接口 |
| 环境维护占用 | `Browserapp/engine/profile-maintenance.js` | 同步检查并占用整批环境；恢复文件期间阻止启动、删除、回收、缓存清理和外部同步，内部提交使用持有者令牌 |
| 引擎状态投影 | `Browserapp/engine/status-api.js` | 脱敏快照、配置 Map 缓存版本和运行状态增量；statusRev 跟踪运行变化，rev 继续用于编辑冲突；可信 UI 响应省略其未使用的水位表，默认公开返回格式兼容 |
| 状态刷新控制器 | `Browserapp/ui/ui-status-controller.js` | 从真实行构造水位，共享直接/调度 IPC、线性合并增量并丢弃旧快照响应；full 响应直接复用 rows |
| 会话选择控制器 | `Browserapp/ui/ui-session-controller.js` | 无 DOM 的会话选择合并及串行刷新；响应返回后读取当前勾选和同步状态，迟到调用共享一次后续刷新并等待其完成 |
| 云恢复文件暂存 | `Browserapp/automation/cloud/file-restore.js` | 整批验证后暂存新文件，保留原文件用于失败回滚；清单/新文件落盘后才提交；跨重启检查未完成目录，成功提交/回滚的残留可自动清理 |
| 引擎领域模块 | `Browserapp/engine/` | 启动、Firefox 启动、清理、Profile CRUD、代理、指纹交付、资源限制、扩展管理 |
| 启动参数策略 | `Browserapp/engine/launch-arguments.js` | 构建基础与最终 Chromium 参数；通过输入传入代理端点、DPI 和窗口位置，返回拒绝的自定义参数。进程、锁和资源清理由启动编排持有 |
| 环境同步准备 | `Browserapp/engine/profile-sync.js` | 暂存校验、凭据恢复、代理合并、扩展继承和网络失效记录；整批成功后才发布到引擎 |
| 会话查询 | `Browserapp/engine/session-api.js` | 跨 UI/API 共享有界查询队列，合并同一运行实例的重叠查询，过滤退出及重启后的旧结果 |
| 扩展管理 | `Browserapp/engine/extensions-api.js` | 读取元数据、安装/重载/删除、分配、按扩展汇总环境；通过 prototype mixin 保持原调用接口 |
| 本地控制面 | `Browserapp/automation/local-api-server.js`、`mcp-server.js`、`protocol/` | HTTP/MCP 路由、输入和权限校验、协议转换 |
| API 路由定义 | `Browserapp/automation/api/route-registry.js` | 每组别名只定义一次 HTTP 方法及处理器；方法门禁与路由分发共用定义，构造服务时校验完整处理器集合 |
| API 领域处理器 | `Browserapp/automation/api/*-routes.js`、`controllers.js` | 环境/浏览器、代理、同步、RPA、应用/扩展分属独立控制器，各自显式持有依赖；HTTP 服务只负责传输、认证及分发 |
| API 输入与响应 | `Browserapp/automation/api/input.js`、`profile-ids.js`、`responses.js` | 外部字段别名转换、ID 选择解析、公共响应封装及凭据脱敏；输入规则与网络服务器分离 |
| API 嵌套凭据 | `Browserapp/automation/api/responses.js` | 主账号、多账号、2FA 和备用代理统一脱敏，保留引擎持有的原始数据；复制环境清空所有账号行 |
| API CDP 地址 | `Browserapp/automation/api/devtools.js` | 查询真实浏览器 GUID；列表查询最多并发 8 项，同一运行实例复用在途请求，退出/重启的旧结果丢弃。每次尝试的 600ms 期限落实到 HTTP 连接 |
| 自动化执行 | `Browserapp/automation/rpa-engine.js`、`rpa-store.js`、`task-queue.js`、`task-scheduler.js` | 步骤执行、任务记录、并发与排队 |
| 自动化调度 | `Browserapp/automation/task-scheduler.js` | 全局并发上限与每个 key 的 FIFO 共用队列；等待 key 不占执行槽，取消可从队列中直接移除；超时后仍等底层工作结束才释放 key 和槽位 |
| RPA 动作注册与分析 | `Browserapp/automation/rpa/step-registry.js` | 每个执行器集中声明动作别名；一次有界遍历同时提供未支持动作与敏感能力统计，执行图校验限制循环引用、深度和总步骤数 |
| RPA 步骤结构 | `Browserapp/automation/rpa/step-shape.js` | 执行器、校验器与模板预处理共用参数包和分支读取规则；支持 params.config，保持顶层数组优先及异常分支的既有语义 |
| RPA 任务记录 | `Browserapp/automation/rpa/task-records.js` | 单条与批量创建共用字段和默认值；按原顺序线性清理最旧终态记录，保留 pending/running 任务 |
| RPA 文件路径 | `Browserapp/automation/rpa/paths.js` | 输出与文件输入的物理路径校验；解析已存在的父目录，拒绝子路径中的外逃/悬空链接。表格导入保留 Desktop/Documents/Downloads、OneDrive 等明确允许的目录 |
| RPA 文件动作 | `Browserapp/automation/rpa/file-steps.js`、`rpa/csv.js` | 文本/CSV/JSON 文件动作与 CSV 编解码；保留 RpaEngine 的公开方法，导出按块写临时文件，成功后替换目标，失败或取消时清理临时文件 |
| RPA 流式输入 | `Browserapp/automation/rpa/file-input.js` | CSV/文本按 64 KiB 读取并检查取消，CSV 状态跨块保留；结果完成后才发布到变量，JSON 仍按完整文档读取 |
| RPA 容量策略 | `Browserapp/automation/rpa-store-budget.js` | 按 UTF-8 字节预算回收旧任务、日志与结果；保留最新任务、pending/running 任务及计划/模板 |
| RPA 变量 | `Browserapp/automation/rpa/variables.js` | 无浏览器依赖的变量复制、插值、条件值解析与结果快照；循环对象隔离可变子对象，BigInt 结果转为十进制字符串，特殊键不改变对象原型 |
| 持久化 | `Browserapp/engine/persistence.js`、`engine/state-storage.js`、`automation/profile-store-sqlite.js`、`local-settings.js`、`coalesced-writer.js` | 引擎保存/退出排空/导出、原子替换、SQLite、设置、合并写入、凭据加密 |
| 浏览器通信与同步 | `Browserapp/cdp.js`、`live-sync-v5.js`、`automation/window-sync-bridge.js`、`native-*.cs` | CDP、窗口/输入同步、原生平台能力 |
| CDP 长连接 | `Browserapp/network/cdp-connection.js` | RPA、池化命令与窗口同步共用握手、命令多路复用及退出结算；cdp.js 负责连接池和浏览器发现，live-sync-v4.js 保留构造参数及同步专用超时的兼容入口 |
| 扩展页面同步 | `Browserapp/automation/sync/extension-pages.js` | 当前分配对应的扩展身份、缓存、捕获许可、页面索引及连接生命周期；注入文本和 binding 名由同步宿主显式传入 |
| 扩展路径身份 | `Browserapp/automation/extension-identity.js` | 安装与同步共用路径比较和 Chromium 路径 ID；Windows 折叠比较大小写，POSIX 保留大小写 |
| 扩展安装通信 | `Browserapp/extension-pipe.js` | 安装器管道帧、命令结算、进程退出和扩展协调；EOF/写入错误立即清理并拒绝后续命令，关闭进程使用一个 5 秒等待期限 |
| 网络与代理 | `Browserapp/proxy-forwarder.js`、`automation/proxy-store.js`、`doh-resolver.js`、`downloader.js` | SOCKS/HTTP、代理探测、DNS、下载 |
| 地址与探测数据 | `Browserapp/network/address-policy.js`、`network/probe-results.js` | 共用主机名/IP 规范化、内网与 metadata 分类，以及无 I/O 的探测响应归一化和错误分类 |
| 代理配置 | `Browserapp/network/proxy-config.js` | 代理输入解析、规范化、浏览器端点与脱敏显示；proxy-forwarder.js 保留既有公开导出 |
| 代理身份 | `Browserapp/network/proxy-identity.js` | 纯端点、协议、账号身份比较及环境关联 ID 规则；原 engine/proxy-helpers.js 兼容转发，并保留重试编排 |
| 代理分配统计 | `Browserapp/automation/proxy-usage.js` | 分配容量校验和使用统计；每次快照建立关联 ID/端点索引，保持手填无协议端点的兼容匹配，不缓存跨快照的可变记录 |
| 云同步领域 | `Browserapp/automation/cloud/` | merge.js 处理配置冲突与远端来源；package-crypto.js 维护 OBE1 兼容和异步密钥计算；profile-data.js 处理有界文件读写；limits.js 共用写入/恢复限制；transport.js 适配共享 HTTP 传输 |
| 云同步编排 | `Browserapp/automation/cloud-sync.js`、`cloud-ops.js` | 前者保留包构建及提供商接口，后者协调宿主状态、设置和恢复。浏览器数据仅在远端配置被选中时恢复，代理保存失败必须上抛 |
| 通用出站请求 | `Browserapp/network/outbound.js` | 代理提取/刷新 URL 的校验、重定向与正文大小限制。与模板同步共用 socket 实际使用的 DNS 答案校验，metadata 始终禁止；内网策略由调用方显式决定 |
| HTTP 传输 | `Browserapp/network/http-request.js` | Node HTTP/HTTPS 的字节上限、完整响应读取、重定向与连接清理；一个绝对期限覆盖整条重定向链，支持 AbortSignal。代理出站、模板同步及内核元数据共同使用 |
| 内核归档 | `Browserapp/automation/kernel/archive.js` | 归档成员校验、解压、符号链接检查和安全安装路径；内核选择与安装编排仍由 browser-kernel.js 负责 |
| 内核发现 | `Browserapp/automation/kernel/discovery.js` | 平台路径、文件树查找、打包资源发现和版本清单读取；不下载、不启动进程、不修改安装元数据。browser-kernel.js 保持原有公开导出 |
| 内核摘要信任 | `Browserapp/automation/kernel/archive-trust.js` | 摘要读取、提取、原子文件写入与有界记录；同进程按目录串行合并 pin 写入，查询等待此前已入队的写入 |
| 内核元数据 | `Browserapp/automation/kernel/metadata.js` | 可信主机 JSON/文本读取；每跳校验目标，响应限额按 UTF-8 传输字节执行，内核选择与安装编排不再重复实现流读取 |
| 商店响应读取 | `Browserapp/chrome-store-metadata.js`、`automation/response-body.js` | 商店页面/图标/CRX 下载与缓存、正文读取字节限制和流取消 |
| 指纹构建与注入 | `Browserapp/automation/fingerprint/`、`user-agent.js`、`kernel-init-sync.js` | Persona 构造、主页面/Worker 注入、内核字段映射 |
| 注入运行片段 | `Browserapp/automation/fingerprint/runtime/`、`runtime-source.js` | 页面按 9 个领域、Worker 按 4 个领域组织；固定顺序拼接到原有 IIFE，不新增页面全局变量或额外函数作用域。构建配置、缓存及字体载荷编排保留在原入口 |
| Rust 核心 | `crates/openbrowser-core/src/{proxy,sync,process,tls}` | 可选代理桥、同步/进程/TLS 库；生产接线范围见 `rust-core-decision.md` |
| 构建与开发工具 | `Browserapp/scripts/`、`.github/workflows/` | 启动、打包、获取内核、检查注册表、性能基准、CI |
| 发布资源清单 | `Browserapp/scripts/runtime-manifest.js` | 显式列出顶层运行入口及资源领域，保留原生辅助程序和供应商树；排除开发、自测与审计工具，并检查复制后的目录 |
| 自动检查 | `Browserapp/automation/selftests/`、各目录 `*-selftest.js` | Node 单元/集成检查、真实内核检查；是否进入聚合执行由 SUITE 注册表决定 |
| 手动审计工具 | `Browserapp/automation/*audit*.js`、`final-release-regression-runner.js` | 对抗审计和发布验收；运行前确认内核、系统、网络及数据目录前提 |
| 数据与资源 | `Browserapp/automation/data/`、`assets/`、`kernels/` | 生成语言数据、字体/图像、第三方内核；内核存在指针文件时仍需物化和校验 |

## 已建立的模块边界

- `renderer.js` 从 `window.OpenBrowserProfileList` 调用数据操作；DOM 创建和事件处理继续由 UI 层负责。`index.html` 必须先加载列表模块，加载顺序由自测检查。
- 列表行位置、显示缓存键和复用规则由 `OpenBrowserProfileRows` 维护；未变化页不得重新移动节点，选择变化只更新复选框。新增渲染字段需同步更新 `ui-profile-rows.js` 中的 `profileRenderKey()`。
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
16. `syncProfiles()` 已等待持久化完成，创建/复制 API 不再补写第二次。直接修改 Map 的入口仍负责保存和缓存失效。
17. 自定义位置无效时不回退到其他来源，保持未知；合法的 `(0, 0)` 继续有效。API 的 `geolocation` 参数非法时返回 HTTP 400；旧数据清洗将非法坐标对转换为两个 null。
18. API 新处理器加入对应领域控制器和路由注册表；不再向 HTTP 服务添加业务方法。编辑器保存测试直接调用公开控制器，不截取 renderer 源码。
19. UI 初始化的首次脱敏保存必须发生在缓存和告警状态初始化后；日志与出口事件共用 `uiStateStore.request()`，立即保存会消费待写请求，pagehide/beforeunload 只排空待写状态。
20. 非显式 UI 同步中的多账号凭据只按相同行号和用户名恢复；明确的 credentialsAction=replace/clear 不恢复旧值。备用代理优先按行和端点恢复，唯一端点才允许跨行匹配。
21. 修改注入片段必须检查完整拼接后的脚本，保持片段顺序和共享词法变量可见性；单个片段本身并非独立运行脚本。
22. 云备份包流程调用异步加密/解密，原同步 encryptPayload/decryptPayload 只保留兼容入口。新旧 KDF 成本的 OBE1 包都必须可恢复，异步改动不能取消认证或复用 IV。
23. 云恢复配置和浏览器文件共用 mergeProfileState 的来源结果；local-wins 和本地时间较新的冲突不能写入远端文件。写入前检查整批 ID 及运行状态；文件、代理、设置和引擎存储仍不是一个共同事务。
24. 浏览器数据的写入和恢复使用 cloud/limits.js 的同一组上限；零剩余额度不能回退默认值。备份读取必须按实际字节限额，不能只相信先前 stat 的文件大小。

25. 恢复文件与配置的维护占用在第一次异步 I/O 前整批取得，并持续到回滚和元数据保存结束；失败回滚保留占用及恢复目录，不能继续启动该环境。跨重启补偿依靠加密恢复日志和文件清单，不能仅凭内存占用判定恢复完成。
26. 云恢复的旧 overwrite/remote-wins 参数现在明确表示“同 ID 云端优先，本地独有环境/分组/代理保留”。恢复只向引擎提交选中远端记录；引擎值优先于 renderer 脱敏快照，返回实际引擎列表。公开纯 mergeProfiles 的旧覆盖计算接口保留。
27. 状态水位使用 statusRev 的不透明字符串，包含引擎实例与运行状态版本；编辑命令继续比较数值 rev。启动/停止/端口/网络/扩展变化不能被配置版本未变而漏掉。
28. UI 游标绑定实际接收的内存行，不单独持久化；替换行后退回对象水位或完整同步。full 响应直接使用 rows，不能再请求一次完整状态。等待期间若编辑替换了行数组，旧响应必须丢弃。无变化增量保留数组引用。

29. 状态版本索引随快照数组复用，按只读对象传递；替换行或版本必须生成新数组。不得原地改写 status() 返回的数据或 UI 控制器持有的行。索引复用不改变脱敏、移除检测或旧响应丢弃规则。
30. CSV 引号内的换行、逗号、双引号和首尾空格是单元格数据；仅非引号字段继续 trim。CSV/文本输入按块解码，取消时不发布部分结果；导出按块写入并检查取消。JSON 输入及导入后的结果仍完整驻留内存，暂不添加输入大小上限。
31. 扩展捕获许可来自当前分配；空分配不允许捕获任何扩展页面。实际浏览器 ID 必须对应分配路径，不能把全部 loadedExtensions 当成授权。缺少实际 ID 时使用 manifest.key 或 Chromium 的路径身份算法。
32. 同步停止需要同时关闭已建立连接和在途握手；异步恢复点检查会话代次、主环境及连接归属，禁止旧连接回写新会话的 Map。
33. 会话列表刷新在响应提交时读取当前选择，避免回滚 IPC 期间的新操作；执行期间的新请求共享后续刷新，其 Promise 等待后续请求实际完成。
34. 扩展安装和同步使用同一份路径身份规则。不能在 POSIX 平台统一 toLowerCase；安装器退出监听在发送 Browser.close 前注册，进程退出后不再等待命令响应或重新创建退出等待。

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
npm run selftest -- profilevalues
npm run selftest -- apiinventory
npm run selftest -- launcharguments
npm run selftest -- automationipc
npm run selftest -- uistatestore
npm run selftest -- enginecompose
npm run selftest -- cloudmaintenance
npm run selftest -- statusrefresh
npm run selftest -- cloudrestore
npm run selftest -- cloudcrypto
npm run selftest -- cloudtransport
npm run selftest -- proxyusage
node scripts/benchmark-ui-polling.js 9ae738a 10000
node scripts/benchmark-review.js 0c06ae8
node scripts/benchmark-persistence.js
node scripts/benchmark-rpa-budget.js 0c06ae8
node scripts/benchmark-maintenance.js 65ddc51
node scripts/benchmark-session-persistence.js 65ddc51
node scripts/benchmark-snapshot-paths.js 0e66932
node scripts/benchmark-status-merge.js c8c4102
```

后续拆分重点及本轮证据见 [性能与可维护性审查](dev-reports/2026-11-10-performance-maintainability-review.md)。
继续优化的结果见 [第二轮持久化与模块边界优化](dev-reports/2026-11-10-round2-persistence-and-modules.md)。
RPA 与主进程的后续改动见 [第三轮 RPA 生命周期与容量回收](dev-reports/2026-11-10-round3-rpa-lifecycle-and-budget.md)。
本次同步、刷新、下载与分类复审见 [项目复审与优化记录](dev-reports/2026-11-10-project-review.md)。
下一轮查询并发、事务和哈希优化见 [会话与事务优化记录](dev-reports/2026-11-10-next-optimization.md)。
API 控制器、启动参数、内核发现和编辑保存的本轮调整见 [模块分类与校验优化记录](dev-reports/2026-11-10-modular-optimization.md)。
UI 状态持久化、注入领域片段及引擎成员组合见 [第二轮 UI 与注入模块优化](dev-reports/2026-11-10-round2-ui-and-injection.md)。
本轮云同步及代理统计优化见 [云同步与代理统计复审](dev-reports/2026-11-10-cloud-proxy-review.md)。

后续维护占用、文件回滚和运行状态增量修复见 [恢复与状态刷新优化](dev-reports/2026-11-10-restore-status-followup.md)。

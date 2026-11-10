# 项目复审：性能、代码分类与可维护性

日期：2026-11-11（Asia/Shanghai）。工作区起点：`main` / `4867888`。本报告仅使用本轮读取的源码、复现结果和检查结果；未把仓库已有审查报告的通过数算作本轮结果。

## 范围和判断

项目已有较好的基础：Electron IPC 按领域拆分，状态快照和增量刷新有缓存，CDP 连接复用，SQLite 差异保存，JSON 合并写入，发布清单会检查本地依赖和 HTML 资源闭包。继续优化应优先消除重复工作，并让校验和执行共用规则。

本轮梳理了 UI/宿主、引擎和持久化、RPA/API/MCP、网络通信、内核管理、Rust 核心与 CI 的目录和主要入口。重点阅读和修改集中于列表刷新、RPA 执行图及任务存储。采用结构盘点、关键调用链阅读、故障复现、回归检查和局部基准；不是对全部源码逐行证明，也不是实际浏览器吞吐或跨平台桌面验收。

排除内核和资源目录后，当前源码清单包含 556 个 `.js`、3 个 `.mjs`、44 个 `.rs`、7 个 `.cs` 文件，包含生产代码、测试和开发工具。较大的生产入口仍包括 `renderer.js` 4,773 行、`live-sync-v5.js` 2,240 行、`browser-kernel.js` 2,206 行、`proxy-forwarder.js` 1,698 行和 `main.js` 1,559 行。文件长度用于判断拆分成本，不直接等同于性能缺陷。

## 已复现和处理的问题

| 优先级 | 位置 | 原问题与影响 | 本轮修改 |
| --- | --- | --- | --- |
| P1 | `automation/rpa/step-registry.js`、`rpa-engine.js` | 执行器读取 `params.config.children` 或 `config.children`，校验器只读取顶层或 params；包装结构内的未知动作、循环引用和超深嵌套可能漏检 | 提取 `rpa/step-shape.js`，执行、校验和模板预处理共用参数包及分支读取；新增实际执行与校验对照检查 |
| P1 | `automation/rpa-store.js` | `countSensitiveSteps()` 递归时重新进入外层方法，深度每次归零；循环引用可抛出 RangeError，且漏掉 elseChildren、errorChildren、params 内的操作及 action 别名 | 合并到注册表的有界分析遍历；复用 64 层、10,000 步及祖先检测；能力统计按实际执行器别名归类 |
| P2 | `renderer.js` | 行更新从空锚点开始，未变化行被轮流 append 到末尾；顺序最终正确，但每次刷新都移动全部行 | 提取 `ui/ui-profile-rows.js`，从首个实际节点向后对齐；已在正确位置的行不插入、不移除；保留选择更新 |
| P2 | `automation/rpa-store.js` | 最旧终态任务逐条 splice；当大量活跃任务留在数组尾部时，重复移动尾部，出现平方级工作量 | `rpa/task-records.js` 先确定删除位置，再原地线性压实；保留任务对象、数组和相对顺序及活跃任务保护语义 |
| P2 | `automation/rpa-store.js` | 单条和批量创建各自维护完整任务字段，默认值易分叉；批量插入把整批记录展开成函数参数 | 统一 `createTaskRecord()`；单条创建委托批量入口，共用一次保存；批量使用数组连接 |
| P2 | `automation/selftests/mcp-control-selftest.js` | 两个真实存储文件写死 `/tmp`，绕过 TMPDIR，导致无该目录的环境无法运行，也不适用于 Windows | 使用 `os.tmpdir()` 和 path.join；成功结束时清理 RPA 存储文件 |

模板列表原先分别执行动作校验和能力统计，现在一次分析同时返回两种结果。无效模板仍遵循原有拒绝策略；异常恢复分支保留执行器原先从顶层或原始 params 取值的语义。

现有大入口得到局部精简：`renderer.js` 从 4,800 行变为 4,773 行，`rpa-store.js` 从 1,084 行变为 1,011 行；新模块承担被提取的职责。总行数不是验收指标，新增测试和明确接口会增加项目行数。

## 代码分类与边界

完整入口表更新在 [代码分类与维护入口](../code-organization.md)。本轮新增和统一的边界如下：

| 类别 | 维护位置 | 调用方向 |
| --- | --- | --- |
| 列表数据 | `ui/ui-profile-list.js` | 搜索、排序、分页；不创建 DOM |
| 列表行更新 | `ui/ui-profile-rows.js` | renderer 传入可见页、渲染键、行构造函数与选择集合 |
| RPA 步骤结构 | `automation/rpa/step-shape.js` | 执行器、注册表、模板预处理共同依赖；不依赖浏览器或存储 |
| RPA 动作与图分析 | `automation/rpa/step-registry.js` | 动作别名、未支持动作、遍历预算及敏感能力统计 |
| RPA 任务记录 | `automation/rpa/task-records.js` | 字段构造与历史保留；不写磁盘 |
| 存储编排 | `automation/rpa-store.js` | 调用记录与图分析模块，负责持久化和模板业务 |
| 检查与基准 | `automation/selftests/`、`scripts/benchmark-review-followup.js` | 新回归加入 SUITE；开发工具由既有发布清单排除 |

## 本轮性能数据

原始结果：[review-followup-benchmark.json](2026-11-11-review-followup-benchmark.json)。基准直接从 `4867888` 提取原实现与当前入口对比，任务耗时经过 2 次预热，取后续 5 次中位数。

| 场景 | 原实现 | 当前实现 |
| --- | ---: | ---: |
| 10 行未变化列表，100 次刷新 | 1,000 次行插入 | 0 次 |
| 50 行未变化列表，100 次刷新 | 5,000 次行插入 | 0 次 |
| 100 行未变化列表，100 次刷新 | 10,000 次行插入 | 0 次 |
| 1,000 条任务历史清理 | 0.105 ms | 0.126 ms |
| 10,000 条任务历史清理 | 1.775 ms | 0.613 ms |
| 20,000 条任务历史清理 | 21.646 ms | 1.331 ms |

列表数据来自 DOM 行为模型中的插入调用计数，没有测量 Chrome 布局、绘制或焦点行为。任务场景是前半段终态、后半段活跃，保留上限 100；活跃任务仍全部保留，这是专门触发旧实现重复搬移的压力场景。小规模数据中新增索引有常数开销，本次 1,000 条记录慢约 0.021 ms；大规模场景约快 2.9 倍和 16.3 倍。不能据此声称整应用获得相同提速。

复现命令，在 Browserapp 目录执行：

```sh
node scripts/benchmark-review-followup.js 4867888
npm run selftest -- profilerows
npm run selftest -- rpataskrecords
npm run selftest -- rparegistry
npm run lint
```

## 检查结果与限制

新增检查覆盖列表不变时零移动、选择变化、节点身份、重排、单行替换、翻页、重复 ID；RPA 条件/异常/包装分支、别名、共享子流程、循环、深度与步数预算；任务单条/批量契约、默认值、活跃任务保护和大历史清理。UI 加载检查确认新模块在 renderer 消费前加载。

| 本轮检查 | 实际结果 |
| --- | --- |
| 内核无关聚合 `scripts/selftest-all.js` | 140 通过，2 个 macOS 限定脚本跳过，0 失败；共 142 个注册脚本 |
| ESLint 全量 | 通过，0 error、0 warning |
| MCP 真实本地 HTTP/stdio 专项 | 61 个检查全部通过 |
| 列表缓存/Tab 既有专项 | 11 个检查全部通过 |
| 新列表行、任务记录、步骤边界及 UI 加载检查 | 全部通过，并已纳入聚合 |
| 与原始实现对比的局部基准 | 完成，保留 JSON 结果及可复现脚本 |
| `git diff --check` | 通过 |

最初的完整基线运行因本地代理及写死 `/tmp` 的旧自测中断，因此没有声称获得完整改动前通过数。列表操作次数与任务清理耗时的改动前数据来自基准直接读取的 `4867888` 原实现，不依赖该次中断的自测结果。

本环境的 Node 默认代理会影响本地回环测试，且没有默认 `/tmp`，因此检查显式设置 `NODE_USE_ENV_PROXY=0` 和指向工作区的 TMPDIR。未下载 Electron 二进制或浏览器内核。没有 Cargo，Rust 仅阅读主要模块，未修改或编译；未运行 Windows/macOS 原生窗口、真实 Electron/Chromium、安装器和多浏览器压力测试。

## 后续优化顺序

| 优先级 | 现有证据 | 建议与验收条件 |
| --- | --- | --- |
| P1 | renderer 仍有 4,773 行，依赖经典脚本共享状态；ESLint 对部分共享脚本关闭 unused 检查 | 接着提取批量环境操作和同步文本分发，明确依赖注入；每次迁移运行加载/行为检查，再做真实桌面交互验收 |
| P1 | 目前缺少本轮真实桌面数据；仓库已有 `benchmark-real-render.js`、`benchmark-real-load.js` | 在真实环境按 10/100/1,000 配置测 UI 渲染、主进程事件循环 p95/p99、IPC 字节和内存，再选择下一处性能改动 |
| P2 | `task-scheduler.js` pending 无容量上限；超时只结束等待，不终止底层工作 | 为调用方明确队列容量和取消语义，再引入可配置上限/AbortSignal；检查超时任务重叠、关闭和失败重试 |
| P2 | `engine/cdp-hardening.js` 通过精确字符串匹配修补注入源码 | 将修补逻辑逐步移到脚本构建阶段，减少源码文本耦合；需要主页面、iframe、Worker 的真实内核回归 |
| P2 | main、内核管理、代理和同步入口仍较大；JS/Rust 并存 | 继续按职责拆分代理 IPC、内核提供商和同步映射；保持现有公开入口，依靠 parity/chaos 及跨平台检查约束行为 |
| P3 | 根目录自测、automation 审计和运行代码并存；发布已有资源过滤与闭包检查 | 分批整理开发工具到 scripts/selftests，并同步相对路径、SUITE、npm 与 CI；迁移收益主要是定位和维护成本 |

本轮修改保留在本地工作区，未创建提交或推送。

# 第三轮前后端契约审查

本轮继续找到了实际缺口，已修复并重跑。56 项功能回归、15 项原生专项、真实 X11 全局按键、48 个状态的明暗 96 组原 render 截图比较均通过。截图 RGB 容差为 0；这证明列明状态在本环境一致，不代表所有平台和任意状态已经穷尽。

冻结运行目录：2376 个文件，SHA256 `458ef29a988f22a20899fbe795cef60c2a78c47735f55947e8369a37b0b36d35`。每个实际执行的测试记录启动前 SHA256 与执行后未变断言；最终核对还与当前文件比对。历史失败与中断尝试保留，没有删除、跳过或放宽失败断言。

## 本轮修复

| 未对齐的行为 | 根因与修复 | 验证 |
| --- | --- | --- |
| Skill 编辑后不能执行原包 | 原编辑表单仅提交 metadata.prompt，后端覆盖整对象；按字段合并并保留文件、slug 和包引用 | 原弹窗编辑后，真实任务的模型输入仍含包正文 |
| 任务排序随开关跳位 | 忽略原 created_at 参数；显式映射字段并使用稳定 ID 次排序 | 创建时间与修改时间相反的夹具 |
| 任务保存后不能立即执行 | 原表单合法传 null，统一校验拒绝；旧执行器又直接读 metadata.prompt | 任务接受 null，模板仍校验对象；原启动器安全回退模板提示词，原 UI 断言 null 保持且产生两次真实模型请求 |
| 已读返回制造无 ID 会话，旧轮次清掉新未读 | 原 UI 需要会话 DTO；桥丢第二个 runId 参数；后端返回 true | 显式 {id,runId}，按最新轮次条件修改，返回 DTO；运行结束落盘未读 |
| 刷新后附件消失 | 历史存储字段与原组件 metadata.attachments 不同 | 历史 DTO 映射；真实刷新后仍有两张附件卡和已解码图片 |
| 长历史一次全量返回，没有分页 | Native 忽略 limit/cursor | 按实际 limit=5 和消息 ID 游标分批读取；22 轮真实 SSE、44 条消息，逐页读齐且无重复；追加期间游标仍稳定 |
| 回放后假运行，菜单持续隐藏 | 原子事件错误地都声明 startSequence=1，原 Jl 无法连续推进 | 原子事件 startSequence=sequence；自身本地协议 1 有界迁移到 2，实际加密重启验证 |
| 异常退出后永久 running | 原来只改状态，没有给回放流终态 | 保存内部 interrupted、保留 checkpoint/权限，补带 process_exit 的取消事件，不标记模型成功 |
| 元数据保存失败仍改变内存，失败草稿被别的保存落盘 | 多操作先修改共享对象，异步写入跨域相互捕获 | 同一写入回合生成快照，原子 rename 成功后再发布字段；配置/会话/记录/Skill/置顶/MCP/日志覆盖真实故障和并发 |
| 删除期间启动或不可用 Skill 遗留空会话 | 删除等待写盘前无预留；创建会话早于 Skill 校验 | 先预留删除并拒绝新运行，先校验可用 Skill；关闭后内部 start 也拒绝 |
| 首次迁移写盘失败后永远无法重试 | loadPromise 保留 reject，内存中又有半加载数据 | 清理失败加载状态；下一次真实请求重新读取原加密文件，成功后才启动调度 |
| 会话菜单只能 hover 触发 | 原焦点事件只在尚未挂载的 Popover 触发器上 | 将原焦点事件接到会话行，行内焦点移动不卸载；原 Tab/Enter→重命名→刷新→确认删除 |

[25 个 Native 契约场景](evidence/review-3/agent-contracts.json) · [原界面端到端记录](evidence/review-3/agent-contracts-ui.json) · [任务真实执行](evidence/agent-tasks-ui-selftest.json) · [附件真实刷新](evidence/agent-files-ui-selftest.json)。

## 截图与来源

| 状态 | 实际截图 |
| --- | --- |
| 原 Skill 编辑并保留原包 | [截图](evidence/review-3/skill-edit.png) |
| 重启后的后台未读 | [截图](evidence/review-3/conversation-unread.png) |
| 分批加载到最早历史 | [截图](evidence/review-3/conversation-history.png) |
| 原附件刷新仍可显示 | [截图](evidence/agent-attachments-reloaded.png) |
| 完整工作台与圈选区域 | [浅色](evidence/visual/workbench-full-light-production.png) / [深色](evidence/visual/workbench-full-dark-production.png) |
| 原 render 与当前逐例对照 | [96 组画廊](evidence/visual-comparison.html) / [逐例像素结果](evidence/visual-parity-selftest.json) |

413 个独立原 render、152 个模块登记来源；12 个 render 有已记录的品牌、本地化、商业删除和键盘语义差异。三个没有独立原 render 的云端外壳明确排除。20504 条保留原样式声明逐项匹配；本地新增内容不计作原版页面证明。

## 接线、删除与额外能力

静态分发审计覆盖 305 个使用点、169 种调用，[{'file': 'AgentSettingsRoute-BB9ba93X.js', 'line': 8, 'expression': 'globalThis.__agentRequest("mcp:" + method, p2)'}, {'file': 'local-api.js', 'line': 589, 'expression': 'request("agent:" + method, payload)'}, {'file': 'local-api.js', 'line': 595, 'expression': 'globalThis.__agentRequest(method, { id: args[0], runId: args[1] })'}, {'file': 'local-api.js', 'line': 595, 'expression': 'globalThis.__agentRequest(method, {\n  data: args[0],\n  mimeType: args[1],\n  fileName: args[2],\n  conversationId: args[3]\n})'}, {'file': 'local-api.js', 'line': 607, 'expression': 'globalThis.__agentRequest(method, { id: args[0], ...args[1] })'}, {'file': 'local-api.js', 'line': 607, 'expression': 'globalThis.__agentRequest(method, { id: args[0], title: args[1] })'}, {'file': 'local-api.js', 'line': 607, 'expression': 'globalThis.__agentRequest(method, args[0] || {})'}, {'file': 'local-api.js', 'line': 625, 'expression': 'globalThis.__agentRequest(key + "." + method, { filename: file.name, data })'}, {'file': 'local-api.js', 'line': 627, 'expression': 'globalThis.__agentRequest(key + "." + method, payload)'}, {'file': 'local-pages.js', 'line': 5, 'expression': 'globalThis.__localRequest(method, payload)'}, {'file': 'workbench-chrome.js', 'line': 5, 'expression': 'globalThis.__localRequest(method, payload)'}] 个动态转发单列；精确核对 Native 分支与 ops handler，静态缺口为 0。三项原脚本沙箱能力仍明确拒绝。静态存在分支不足以证明返回契约，以上真实界面流程和故障回归补上了本轮发现的缺口。[契约](CHANNEL-MAP.md) · [完整 AST 审计](evidence/backend-contract-audit.json)。

本轮额外补齐历史分页、附件恢复、异常退出终态、自身事件迁移、元数据隔离提交和会话键盘菜单；理由分别是控制长会话 IPC、保留实际附件、避免假运行、兼容自身旧数据、防止失败草稿泄漏和保证键盘可操作。[额外能力](EXTRA-FEATURES.md)。

生产树的原商业/云端文本黑名单为 0；AST 解码的 52 个商业组件关注名称也为 0。运行前端直接出网 API 为 0，CSP connect-src 'none' 与请求过滤仍保留，实际 UI 外部请求记录为空。[grep](evidence/commerce-grep.txt) · [解码关注清单](evidence/review-3/component-audit.json) · [传输审计](evidence/renderer-transports.json)。原归档、编译器和按要求保留的翻译键不算生产树 grep 范围。

## 失败记录与边界

初始缺口、MCP/日志/跨保存并发故障、事件范围、异常退出、加载重试和空配置启动失败均保存在 evidence/review-3；完整运行的失败尝试和命令日志在 [尝试目录](evidence/acceptance-attempts/) 留存。磁盘曾因旧测试复制内核低于原 8GiB 门槛；只清理已结束且可重建的随机测试数据，保留日志/截图/证据，门槛不变，[清理清单](evidence/review-3/temp-cleanup.json)。

本轮列明清单没有未关闭失败。未测 Windows/macOS、人工系统选择、多台物理显示器、实际扬声器、全部系统 DPI 和任意字段/动效组合；三平台安装包未生成。模型使用真实本地 HTTP SSE/NDJSON 夹具，不冒充公网模型或实际安装的 Ollama 模型。原任意脚本沙箱未迁移；agent-worker.jsc 与 roxybrowser-openapi-mcp.jsc 这块没读懂，没有执行或宣称兼容。[边界](BLOCKERS.md)。

[全部命令及来源](evidence/phase4-command-results.json) · [原生专项](evidence/native-regression-selftest.json) · [真实桌面](evidence/desktop-shortcuts-selftest.json) · [最终证据核对](evidence/final-verification.json) · [症状/根因/修法/文件:行](BUGS-FOUND.md) · [自主决定](DEVIATIONS.md)。

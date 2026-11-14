# 第三阶段：补齐剩余交互与视觉验收

正在实施；本文件只记录事实，不提前声明通过。

## Cookie Robot 逆向契约

原主进程 `browser:startCookieRobot({dirIds,customParams,robotParams})` 先批量启动，再逐窗口运行。原 `AfterLaunchTask.cookieRobot` 为每个 URL 新建标签，第一个 URL 关闭原标签；等页面和部分图片加载，在文档或主应用容器随机滚动，直到底部；非滚动页重试三次；可关闭窗口，支持 Firefox BiDi。

本地适配继续使用 OpenBrowser 的启动、隔离、代理、指纹、Cookie 和停止流程，使用现有 CDP / BiDi。独立任务记录加密落盘；取消与异常保留逐页结果。原弹窗与确认流程保持。

实施决定：原循环无上限，可能在无限滚动站点永不结束。增加每页 2000 次 / 5 分钟上限，触发时记录失败并继续其他网址，不伪报成功。最多 200 个排队窗口、4 个并行执行，1–100 个 HTTP(S) URL。启动参数只接受原界面提供的开关及 headless；不引入任意命令执行。

Firefox 连接归原引擎所有，任务只清理自有网络拦截和订阅，不释放整个引擎会话。补齐原引擎忽略临时 Firefox headless / 图片开关的问题，配置不写回窗口偏好。

Cookie Robot 的真实 Chrome/Firefox、原弹窗、禁图/媒体拦截、Cookie、取消、重复任务与超限失败已通过，见 `evidence/cookie-robot-ui-selftest.json`。初次落盘与退出竞态、非法整批参数、加密重读见 `cookie-robot-selftest.json`。

附件服务已完成 OpenAI/Ollama 实际 HTTP 与读取工具测试；原附件按钮、File 输入、缩略图、模型往返、图片预览/Escape 与实际导出均通过，见 `agent-files-selftest.json` / `agent-files-ui-selftest.json`。原生文件选择只固定返回路径，确实读取磁盘。

平台账号原列表、创建、编辑、绑定、刷新和明暗主题已通过，证据：[账号服务](evidence/accounts-selftest.json)、[账号页面](evidence/accounts-ui-selftest.json)。绑定与删除继续使用原 AccountStore/ProfileStore，列表脱敏，显式编辑/查看/导出才读取机密。

扩展中心保留原列表、目录/压缩包导入和项目分配弹窗，原云推荐组件、团队分支、每日配额查询与 OSS 调用物理删除。受原生文件选择授权后导入自有目录，ZIP/CRX 路径和展开大小有界；原子提交关联。新建窗口及跨项目移动遵守已选项目。原固定菜单通过原引擎写启动 Preferences，真实 Chrome service worker 的 `chrome.action.getUserSettings().isOnToolbar` 为 true。证据：[扩展服务](evidence/extensions-selftest.json)、[扩展页面](evidence/extensions-ui-selftest.json)。更新失败恢复旧目录和旧元数据，内置扩展不能删除。

原窗口右键菜单的桌面快捷方式与默认浏览器已接回系统。Linux 桌面文件经真实 `desktop-file-validate`，HTTP/HTTPS 经真实 `xdg-mime` 设置并查询；独立 XDG 目录避免改动当前桌面默认值。第二个真实 Electron 进程经过单实例通道启动指定 Chrome 窗口，并实际打开本地 URL。证据：[系统入口服务](evidence/host-actions-selftest.json)、[原菜单与单实例启动](evidence/host-actions-ui-selftest.json)。Windows/macOS 分支尚未在相应系统运行，不能算跨平台通过。

刷新会丢失原路由的问题已修复；账号与扩展页面实际重载保持原位置。自定义 Chromium 兼容性探针改为 headless，真实内核校验不依赖 X 会话。

静态可达 API/channel 当前均有适配，未映射项为 0，详见 [ADAPTER-MAP.json](ADAPTER-MAP.json)。此结论不等于所有动态路径或参数组合通过。全项目仍在验收；本地 API、原权限交互、外部 MCP 页面已接回，继续逐状态视觉对照。


## API、MCP 与原授权卡

恢复原 `api-keys-qLZdcspG.js` 页面及 CSS，接原 Native LocalApiServer / ApiKeyStore / stdio MCP。支持实际启停、端口切换、LAN 绑定、密钥旋转、重启恢复；原重置/允许 LAN 确认保留。付费频率说明、升级跳转、云 LLM 代理查询、Roxy npm 安装指令和外链物理删除，改为原生配置和本地参考文档。独立真实 Electron Node 模式 MCP 进程完成 initialize、列举 67 个工具、调用 list_profiles 并拿到真实窗口；证据 `local-api-selftest.json` / `local-api-ui-selftest.json`。

恢复原 `approval_requested/resolved` 与 `conversation.approval.submit` 契约。原“请求批准”模式等待用户；允许才调用工具，拒绝把真实错误返回模型；完全访问仅按原决定提升当前运行，仍保留窗口范围。取消/30 分钟超时不执行工具并清理等待。授权事件先加密保存；新的 activeEvents IPC 恢复活动任务，待批准时刷新保留原卡片。真实原三个按钮和实际 ProfileStore 写入、刷新、模型返回已通过，证据 `agent-approval-selftest.json` / `agent-approval-ui-selftest.json`。

CodeMirror 验收暴露图裁剪漏掉顶层注册循环，现只保留写入已保留模块绑定的注册循环；EditorView 用 Vue markRaw 保持身份，避免类实例被深代理。没有删除错误断言；修复后实际配置更新、密钥旋转、主题及重启页面错误为 0。

顶部身份菜单已按原 Avatar/TieredMenu/作用域恢复，内容只含本地身份、设置、语言与原主题子菜单；移除原团队、礼券和登录退出行为。额外的顶层主题太阳按钮移入原主题菜单，验收脚本改为实际打开原菜单选择模式，主题断言保留。原主题菜单的实际选择、账号、扩展、API、圈选控件与独立弹窗安全回归已通过。


## 项目管理与提交边界

默认项目使用独立虚拟 ID `local-default`，映射到 Native 空 groupId，不创建假分组。补齐原 `user_info`、窗口计数、`projectId` 和固定 DTO，恢复原项目详情组件与父子路由。原创建、固定、重载侧栏、默认/分组筛选、重命名、删除回归默认项目已实际操作通过，见 `projects-ui-selftest.json`、`management-ui-selftest.json`。默认项目不能重命名或删除。创建弹窗删成员状态时遗留的加载遮罩引用已删除，失败时 finally 释放提交忙状态。

扩展元数据提交成功后，清理备份失败不得回滚新文件。现在明确报 `EXTENSION_CLEANUP_FAILED`，保留已提交新版本和关联、退出重试清理。真实 rm 失败注入已证明文件/元数据保持一致，见 `extensions-selftest.json`。

## 外部 MCP 工具

恢复 `AgentSettingsRoute-BB9ba93X.js` 原 MCP 服务列表/命令行/HTTP 表单与原设置侧栏。全部请求改本地 IPC，Native 配置加密，与现有 API/MCP 服务端分开。保存和重载不自动连接；用户点验证/启用或发送配置了工具的任务才连接。支持 stdio 与 Streamable HTTP JSON/SSE、session、工具发现/调用、关闭、取消通知。原 UI 的新增、验证、启用、编辑/改名、重载、停用、删除、暗色已通过真实本地 HTTP 服务，renderer 出网为 0。

模型得到稳定的服务命名空间工具；没有完全访问时仍展示原授权卡，批准后才实际调用。限定窗口任务不暴露外部 MCP 工具，调用端也拒绝，因为外部服务不遵守 Native 窗口范围。真实模型/stdio/HTTP、认证失败、循环分页、重名工具、2 MiB 上限、取消、加密重启、文件失败回滚见 `agent-mcp-selftest.json` / `agent-mcp-ui-selftest.json`。

边界：最多 32 个服务、合计 200 工具、20 页工具发现、2 MiB 请求/响应、20 秒单请求；无 shell 命令拼接。用户命令由引号词法拆成 exe/argv。未实现服务器向客户端请求 sampling/elicitation，明确返回 JSON-RPC 方法不支持。原 MCP 更新程序不恢复，随本地应用发布。Windows/macOS 进程启动还需要目标平台验收。

## 视觉证据方法

初轮 12 页 × 明暗两套共 24 组精确 RGB 比较通过，过程日志 `work/rebuild/visual-parity-paired-fixed.log`；当前正在扩展编辑、空态、选中、项目/模板/扩展/任务弹窗和 MCP 各状态，最新结论以 `visual-parity-selftest.json` 为准，不能以历史通过覆盖新增失败。

基线从只读归档提取独立 Vue render，记录原文件和每个函数 SHA-256；商业删除、扩展/项目本地化使用明确列出的共同前处理。基线与当前 render 在同一 Vue 实例切换，使用各自独立 VNode 缓存、同一本地数据，不复用另一方缓存。每次先要求三张连续全屏截图字节相同，再进行严格 0 差异比较。这个方法消除重载之间的不同绘制身份/色阶噪声，不采用像素容差；有限动画完成、无限动画与 SMIL 固定在同一帧，仅对测试生效。实际动效还需单独验收。

`visual-reference-provenance.json` 明确列出无法独立还原 render 的组件；本地新管理页没有原 render，不能因此算一比一通过。`style-provenance.json` 核对保留 CSS 每项的原文件、选择器、条件、属性和值，本地新增样式另列。新增未声明绑定审计会拒绝遗留局部变量；第三方库的环境探测与兼容分支逐文件单列，不能用全局白名单盖过真实缺失变量。


## 当前扩展验收

48 组精确 RGB 对照已通过，覆盖窗口/hover/选择/空态、创建/编辑、窗口模板弹窗、项目/创建弹窗/详情、代理、账号/创建、扩展/上传弹窗、API、Agent、任务/创建弹窗、模板/编辑弹窗及 MCP 列表/stdio/HTTP，均含 light/dark。每组有原/当前完整截图、主内容裁剪与差分图，见 `visual-parity-selftest.json`、`evidence/visual/`。404 个原 render 纳入基线；4 个不能独立对照的组件仍在 provenance 明示，不能据此宣称全项目一比一完毕。

40 个真实命令回归通过，见 `phase3-command-results.json`。初次主题探针入口、直连定位、内核元数据的三个失败保留在 attempts 与原日志；修复后使用实际菜单/公开服务重跑通过，没有移除状态或出网断言。

定位和内核维护请求现读取环境代理：内核元数据/下载显式选择 Node 内置 proxyEnv agent，NO_PROXY、域名白名单、重定向密钥边界、摘要、截断、取消仍保留。该 agent 不修改全局网络，也不改变浏览器环境各自的直连/代理路线。真实 Mozilla 160.0 目录、安装、Firefox 启停与实际定位/窗口代理检测均已通过。另发现单标签代理服务名误交公网 DoH，已改用系统 DNS，减少超时并避免把本机服务名发往公网；公开代理域名仍保留原 DoH 与可观测降级。

原“最大下载速度”对应 NetworkInformation.downlinkMax，不是实际传输限速；原“省流模式”对应 saveData。映射已补齐，真实 Chrome 文档/worker 的 saveData/downlink/rtt 已验证。当前 Chrome 157 没有原生 downlinkMax，按现有指纹策略不虚构新 API 属性，明确记入限制。原按图片体积过滤仍需单独实现/验收，不能将现有全部图片开关冒充该能力。

本阶段最后更新：最新完整回归 48 项通过（首次同步失败及四次修复后真实重跑保留），78 组原 render 明暗/子窗对照精确 0 差异；原 render 基线现为 406 个、5 个当前 render 有变化、3 个明确的云端外壳无独立基线。当前资源 1558 文件/973 JS，SDK 89 方法、固定 send/invoke 77、静态未映射 0。新增原分组内核升级、四个本地 Skill 模板商城、网络指纹字段、Chromium 图片体积过滤和独立媒体开关均有原 UI/实际后端证据。原同步映射并发/陈旧快照/停止中分配已修复并加入确定性失败探针。以 REPORT 与最新 JSON 为准；未宣称全量一比一或三平台通过。

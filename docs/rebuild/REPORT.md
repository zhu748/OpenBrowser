# OpenBrowser 重建验收报告

默认入口已改为本地 Roxy 原工作台，跳过并移除登录。窗口、存储、代理、内核和自动化继续使用 OpenBrowser 原后端。圈选的标签、工具栏、定位/更新/通知/刷新、AI 分组、分页均可实际操作；用量卡按用户答复显示本地数量 / ∞，按钮进入内核管理。

**本环境验收清单全部通过：56 项功能回归、15 项原生专项、真实 X11 全局快捷键，以及 48 个状态的明暗 96 组原渲染截图，精确 0 像素差异。** 整轮 2376 个运行文件摘要未变，最终检查同时核对当前文件和实际执行的测试 SHA256。环境是 Linux、Electron 43.8.8、标准 Chrome 157 与 Firefox 160；未测平台和兼容边界列在文末，不冒充跨平台或无限状态验收。

## 第三轮追加审查结论

发现并修复了静态 channel 存在却契约不匹配的缺口。完整回归使用修复后的冻结目录重新执行，失败尝试和原断言均保留。[本轮详情](REVIEW-3.md)；[第二轮历史](REVIEW-2.md)。

- 修复原 Skill 编辑仅提交提示词时丢包引用，及任务创建时间排序、空配置任务无法立即执行。
- 修复会话已读返回和轮次参数、附件历史 DTO、真实分页、回放事件范围及异常退出的假运行状态；原界面 22 轮实际模型请求，向上逐页读齐 44 条消息，无重复。会话菜单可经 Tab/Enter 完成重命名和确认删除。
- 配置、会话、记录、Skill、目录置顶、MCP 和删除日志均在原子落盘后发布元数据；真实 rename 故障与跨域并发写入验证失败草稿不会被其他保存带入磁盘。保留原实时模型消息，不以整份旧快照覆盖。
- 新增 25 个 Native 契约场景和原界面端到端用例。当前静态审计为 305 个使用点、169 种静态调用、11 个动态转发；三个旧脚本沙箱入口仍明确拒绝，不冒充接通。解码后的 52 个商业组件关注名称和原文本黑名单均为 0。

## 截图与原版对照

[本地逐例对照画廊](evidence/visual-comparison.html) 可切换原归档 render、当前 render、完整截图和差分；[逐例记录](evidence/visual-parity-selftest.json) 记录尺寸、主题、zoom、稳定帧哈希和变化像素。

| 范围 | 当前实现 | 原归档 render |
| --- | --- | --- |
| 完整工作台 / 圈选区域 | [浅色](evidence/visual/workbench-full-light-production.png) / [深色](evidence/visual/workbench-full-dark-production.png) | [浅色](evidence/visual/workbench-full-light-reference.png) / [深色](evidence/visual/workbench-full-dark-reference.png) |
| 原更新弹层 | [当前](evidence/visual/workbench-updates-light-production.png) | [原版](evidence/visual/workbench-updates-light-reference.png) |
| 原通知弹层 | [当前](evidence/visual/workbench-notifications-light-production.png) | [原版](evidence/visual/workbench-notifications-light-reference.png) |
| 创建完整表单 | [当前](evidence/visual/create-advanced-light-production.png) | [原版](evidence/visual/create-advanced-light-reference.png) |
| 原内核升级确认 | [当前](evidence/visual/kernel-upgrade-dialog-light-production.png) | [原版](evidence/visual/kernel-upgrade-dialog-light-reference.png) |
| 原同步独立设置窗 | [当前](evidence/visual/sync-preferences-base-dark-production.png) | [原版](evidence/visual/sync-preferences-base-dark-reference.png) |

来源检查登记 413 个独立原 render、152 个文件；12 个当前 render 有差异，包含可访问性属性、本地链接和已记录的商业删除/品牌替换。商业咨询组件删除后登记的独立原 render 不含该组件。未提供独立原 render 的三个外壳为：全局云 provider、Agent 商业页脚、团队/礼券/登录身份菜单。它们按要求删除/本地化，不把共用本地外壳冒充原版像素证明。[原 render 来源/哈希/绑定记录](evidence/visual-reference-provenance.json)。

原/当前函数在同一 Vue 实例切换，各自使用独立 VNode 缓存；数据、字体、主题、滚动位置和尺寸相同。每次先断言连续三帧稳定，再比较 RGB，容差 0；动效固定在相同帧。完整顶部弹层、折叠侧栏、输入焦点、125% 应用缩放已进入这 96 组。保留样式 20504 条声明逐项匹配原文件/选择器/条件/属性/值；本地新增样式另列，不拿它们计入原样式通过数。[样式证据](evidence/style-provenance.json)。

## 必需功能接线

原扫描为 275 处直接调用、144 个 channel 表达式、332 个云端端点。目前 89 个 SDK 方法、77 个固定 send/invoke channel 已适配，原 SDK 范围内可达静态未映射为 0；本轮另外增加直接 RPC/Agent/ops/回调引用审计，不能据旧计数推断完整契约。[参数/实现位置](ADAPTER-MAP.json) · [Channel 契约](CHANNEL-MAP.md)。

| 能力 | 真实实现与证据 |
| --- | --- |
| 窗口创建/启停/编辑/删除/分组 | 原列表/表单 → ProfileStore/BrowserEngine；收藏、回收站、版本冲突、分页搜索和项目详情；[核心界面](evidence/ui-smoke.json)、[圈选](evidence/circled-ui-selftest.json)、[项目](evidence/projects-ui-selftest.json) |
| 完整表单 | 代理、指纹、平台账号、Cookie、偏好双向映射；批量逐窗保存，非法指纹整批拒绝；[网络字段](evidence/network-form-selftest.json)、[图片表单](evidence/image-size-ui-selftest.json)、[媒体](evidence/media-preferences-selftest.json) |
| 代理与双内核 | 原 ProxyStore/检测、官方目录下载校验与实际启动；原升级弹窗按 Chrome/Firefox 分组，UA/WebGL 随升级更新；[代理/公网](evidence/network-ui-selftest.json)、[双内核](evidence/kernels-ui-selftest.json)、[升级](evidence/kernel-upgrade-ui-selftest.json) |
| 窗口模板与本地转移 | 原保存模板表单、本地完整配置、原生选择文件并真实 JSON 导出/导入；新 ID、代理/Cookie/项目保留；[管理 UI](evidence/management-ui-selftest.json)、[原生回归](evidence/native-regression-selftest.json) |
| AI Agent | 原聊天、OpenAI SSE/Ollama NDJSON、本地密钥加密、原人工授权卡、真实浏览器工具、取消及刷新回放；[协议](evidence/agent-selftest.json)、[工具](evidence/agent-browser-selftest.json)、[授权](evidence/agent-approval-ui-selftest.json) |
| Skill 管理 | 四包文本/引用、本地编辑/启停/ZIP、原创建模板弹窗实际上传；原模板商城从实际启用 Skill 生成目录，获取落个人模板；[Skill](evidence/skill-packages-selftest.json)、[原商城](evidence/template-catalog-ui-selftest.json) |
| 任务/API/MCP | 原任务、模板、日志页；本地 cron/IANA 时区计划；原 API 页面接 LocalApiServer/ApiKeyStore/67 工具；原 AgentSettings 实为 MCP 页，接加密 stdio/HTTP 客户端；[任务](evidence/agent-tasks-ui-selftest.json)、[API](evidence/local-api-ui-selftest.json)、[MCP](evidence/agent-mcp-ui-selftest.json) |

## 额外搬迁与修复

| 名称 | 理由 / 结果 |
| --- | --- |
| 日志 replay、context compaction、checkpoint | 任务过程可回溯、长会话有界、可从已保存上下文及授权范围继续；完整历史仍本地保留 |
| 原同步选择页、浮条和四种独立弹窗 | 可见入口均有真实操作；双 Chrome 输入/网址/布局、暂停恢复及关闭屏障；[同步](evidence/sync-browser-ui-selftest.json)、[原弹窗](evidence/sync-dialogs-ui-selftest.json) |
| 标准 Chrome 主控配色及恢复 | 私有命令缺失也能实际标记外框；原种子/灰色/第三方主题与活动标签恢复，原包被清理后使用快照；[服务](evidence/master-color-selftest.json)、[真实外框](evidence/master-color-visual-selftest.json)、[外框截图](evidence/master-frame-blue.png) |
| Firefox 图片体积过滤 | 同一原请求链按解码字节过滤，旧缓存不可绕过；就绪、上限和停止清理；[证据](evidence/firefox-image-size-selftest.json) |
| 最大网络速率原生 getter | 启用 Chromium NetInfoDownlinkMax 后，文档和 Worker 的最大速率/类型真实生效；属于指纹，未冒充带宽限速 |
| Cookie Robot、附件、平台账号、扩展中心 | 原可见 UI 接实际 Cookie/文件往返、加密账号库、目录/ZIP/CRX 快照与真实 Chrome 扩展加载；[Robot](evidence/cookie-robot-selftest.json)、[附件](evidence/agent-files-ui-selftest.json)、[账号](evidence/accounts-ui-selftest.json)、[扩展](evidence/extensions-ui-selftest.json) |
| TXT/XLSX 导入、缓存、环境代理 | 保留已有配置和登录，明确版本不被覆盖；维护与下载尊重用户环境代理/NO_PROXY |
| Linux 快捷方式/默认浏览器/全局按键 | 原菜单实际注册系统入口；X11 按键打开原设置窗、真实进程冲突与退出释放；[系统入口](evidence/host-actions-ui-selftest.json)、[按键](evidence/desktop-shortcuts-selftest.json)、[桌面截图](evidence/desktop-shortcut-screen.png) |
| 指纹与同步所有权收敛 | 修复新页导航误关闭浏览器、映射竞争、陈旧快照删页和停止后发布；16 项重注入断言仍保留真实错误失败；[原生专项](evidence/native-regression-selftest.json) |
| 历史分页/重启恢复/隔离提交 | 长会话分批 IPC、附件刷新保留、异常退出补准确终态、失败草稿不串入其他保存；[25 场景](evidence/review-3/agent-contracts.json)、[原 UI](evidence/review-3/agent-contracts-ui.json) |
| 冻结来源/生产依赖闭包 | 56 项测试开始前 hash、结束未变及全树摘要；真实复制运行目录启动，编译器/验收工具不入生产包；[命令](evidence/phase4-command-results.json)、[打包目录](evidence/packaging-selftest.json) |

详细名称、价值、实现和验收见 [EXTRA-FEATURES.md](EXTRA-FEATURES.md)。每处修复的症状、根因、修法、文件:行和验证见 [BUGS-FOUND.md](BUGS-FOUND.md)。偏离原静态推断、探针纠正与本地内容边界见 [DEVIATIONS.md](DEVIATIONS.md)。

## 删除、品牌与零出网

- 运行产物物理删除登录、付费墙、购买/结算/积分/团队/推荐、营销资源与原 SDK HTTP 工厂；332 个 `/user_*` 云端端点工厂不在默认运行树。共清理 133 项资源，包含无用通用资源，不把它们全部说成付费资源。[清单](evidence/removed-resources.json)。
- [grep 原命令与范围](evidence/commerce-grep.txt)：`pay-wall`、`last-pay-modal`、`/user_*` 等黑名单 **0 匹配文件**。按要求保留的翻译键、不可变原归档和逆向编译器不冒充全仓 0 命中。
- 生成前端直接 fetch/XHR/WebSocket/EventSource/sendBeacon 为 **0**；`_2.fetch` 为本地回调。[AST 传输审计](evidence/renderer-transports.json)。CSP `connect-src 'none'`、请求过滤、精确文档 IPC 和协议 realpath 边界均有实际探针；界面测试外部请求数组为空。代理/模型/用户配置 MCP/内核维护由主进程执行，被管理浏览器正常上网。
- 五卷完整镜像 2063 文件、web 1874 / main 113 / agent 71 / tools 3 / 根 2，原 JS 1162；镜像未改、不打包。`obui://app/index.html` 支持绝对 import，无需逐 chunk 改路径。[归档](evidence/archive-check.json)。
- 当前产物 1556 文件、973 JS。原非商业主题 1006 声明值未改，商业变量删除 48；三语言每种 4892 原键保留，品牌改值；Logo 来自 Browserapp/assets。[UI 审计](evidence/ui-audit.json)、[模块/自由绑定](evidence/module-links.json)。

## 验收边界与还剩什么

本环境清单没有未关闭的功能失败。独立的本地内核目录、窗口模板文件管理、LLM 配置、Skill 和文件交换内容按本地协议新增，使用原组件和主题；它们不是某个原云端页面的独立像素基线。原 Header/更新/通知/MCP/列表/创建/任务/模板等已有对应页面使用原 render。不能把新增内容或三个已删除外壳也算作 96 组的原版证明。

未测试 Windows/macOS、实际扬声器、人工系统选择框、多台物理显示器和任意动效帧/字段组合；125% 应用缩放不等于验证所有系统 DPI。未生成三平台安装包，已验收的是实际复制运行目录。模型协议使用真实本地 HTTP SSE/NDJSON 夹具，不冒充公网付费模型或已安装真实 Ollama 模型。文件测试固定原生选择返回路径后确实读写磁盘。

四个 Skill 是知识/引用迁移，不是旧 SDK/任意脚本环境兼容；原 `/api/scripts` 沙箱、旧自动化扩展和旧启动页确实检视过，评估后未迁移。`agent-worker.jsc`、`roxybrowser-openapi-mcp.jsc` **这块没读懂**，未执行，也不冒充原字节码兼容。附件支持已列明的文本/图片格式和容量。[完整边界](BLOCKERS.md)。

## 复跑与证据

```bash
cd /workspace/OpenBrowser/Browserapp
npm start
npm run selftest:rebuild:acceptance      # 56 项；含真实外框用例，需要 X11
node rebuild/native-regression-selftest.cjs
node rebuild/desktop-shortcuts-selftest.cjs
npm run rebuild:visual-reference
npm run selftest:rebuild:visual          # 完整 48 状态 / 明暗 96 组
node rebuild/build-evidence-gallery.cjs
node rebuild/gallery-ui-selftest.cjs
npm run audit:rebuild:styles
node rebuild/compiler/backend-contract-audit.cjs
node rebuild/compiler/audit-components.cjs
node rebuild/compiler/audit-native.cjs
npm run verify:rebuild:evidence
```

重新构建使用 `npm run rebuild:ui`，需完整 `/workspace/roxy-src`。真实桌面用例需要 Xvfb/xdotool/ImageMagick/xwininfo/Python Pillow，可使用 `OPENBROWSER_TEST_DISPLAY` 和 `OPENBROWSER_TEST_XDOTOOL` 指定；本环境使用独立 :91 及工作目录解包的 Debian 工具，运行时设置相应 LD_LIBRARY_PATH。其余 Electron 用例使用自身 headless 参数。`OPENBROWSER_ROXY_UI=0` 仅保留旧开发界面排查入口。

[最终证据核对](evidence/final-verification.json) 核对 72 份指定证据记录（含历史阶段记录，当前执行以 phase4-command-results 为准）、当前 1556 个前端文件、341 个 Native/开发入口代码文件、56 个实际执行测试的 hash，以及整轮 2376 运行文件摘要和文档链接；它不重跑测试。历史失败日志与混合来源失败运行均在 [尝试目录](evidence/acceptance-attempts/) 留档。全仓 lint 通过。提交前将新增文件加入索引后，git diff --cached --check 检出原模板字符串及 Skill 文档继承的行尾空白，原值保留；此格式检查不声称通过，详见 [提交说明](PUBLISH-NOTES.md)。

本轮最终冻结运行摘要：`458ef29a988f22a20899fbe795cef60c2a78c47735f55947e8369a37b0b36d35`，2376 个文件；56 项来源前后未变。停止的失败运行及原日志保留于尝试目录，第三轮初始缺口证据位于 evidence/review-3/。

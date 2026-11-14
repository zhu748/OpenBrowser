# 定位与修复记录

包含本次集成引入的问题与逆向发现的问题，不把它们都冒充原仓库缺陷。验证的完整边界见证据 JSON 与 BLOCKERS。

| 症状 | 根因 | 修法 | 文件:行 | 验证 |
| --- | --- | --- | --- | --- |
| 绝对资源路径在 file 文档加载失败 | 原产物按站点根路径构建 | 注册标准 obui 协议，限制路径与真实文件边界 | Browserapp/rebuild/protocol.js:8 | 真实 Electron 与协议/越界测试 |
| 路由后 IPC 被判不可信 | history 路径改掉 index 文档 URL | hash 路由保留文档路径 | Browserapp/rebuild/compiler/patch-local.cjs:71 | core UI 真实读写与陈旧版本拒绝 |
| 启动等待互相阻塞 | 模块顶层请求等待 startupReady，而启动等待文档加载 | 异步启动函数不阻塞模块求值 | Browserapp/rebuild/compiler/patch-local.cjs:300 | 默认入口启动与全部 Electron 探针 |
| Error 的 code/stale 跨 IPC 丢失 | Error 自定义属性不由 contextBridge 保留 | 复用 ipcResult 数据封装并还原领域错误 | Browserapp/rebuild/renderer-bridge.js:27 | 真实过期编辑返回 PROFILE_STALE_REV |
| 文件交换等请求无法克隆 Vue 响应式对象 | Proxy 不符合 Electron structured clone | 递归复制 DTO，显式拒绝函数、符号和循环 | Browserapp/rebuild/renderer-bridge.js:6 | 完整文件交换 UI 真实读写 |
| 删除商业区后 Vue block 更新崩溃 | 编译 block 需要合法 VNode | 用合法 block comment 替换商业子树 | Browserapp/rebuild/compiler/commerce.cjs:291 | 创建、列表和管理 UI 错误数组为空 |
| 部分原组件按钮或确认框空白 | 图裁剪没有保留组件 render 赋值语句 | 保留被引用绑定的成员赋值依赖 | Browserapp/rebuild/compiler/slice.cjs:198 | 原删除确认和保存模板交互通过 |
| 空项目初始化选择 undefined | 本地身份误用 viewer 枚举 | 使用逆向得到的 OWNER=3 | Browserapp/rebuild/compiler/prepare.cjs:33 | 空项目创建与原项目 UI 通过 |
| 模板 ID 变成 NaN | 原 UI 将 ID 转 Number，本地使用 UUID | 改用有校验的递增数字 ID | Browserapp/rebuild/local-service.js:1129 | 八并发保存与重启、原模板 UI |
| 并发写入覆盖元数据 | 请求并发修改同一 JSON 对象 | 串行变更、内存回滚、临时文件原子重命名 | Browserapp/rebuild/local-service.js:710 | 并发模板、失败后恢复和重启测试 |
| 长启动或网络探测阻塞列表读取 | 所有本地请求使用同一串行队列 | 将原后端拥有并发控制的读取、进程与探测独立调度 | Browserapp/rebuild/local-service.js:688 | 真实启动期间状态轮询通过 |
| 批量创建忽略逐窗指纹/代理/账号 | 单个 DTO 直接复用到所有窗口 | 按索引组装并一次校验后提交，主进程读取账号机密 | Browserapp/rebuild/local-service.js:815 | 真实 BrowserEngine 批量及失败原子性测试 |
| 批量修改后半批失败但前半批已写入 | 逐条 await 提交 | 先组装全部版本化命令，再交原后端提交 | Browserapp/rebuild/local-service.js:921 | 缺失第二 ID 时第一条未改动 |
| 代理端口编辑后仍使用旧地址 | 列表 DTO 携带旧 raw URL，优先于新 host/port | 编辑字段存在时移除旧规范 URL | Browserapp/rebuild/renderer-bridge.js:172 | 代理 UI 9999→9998 的后端最终值断言 |
| 80/443 端口代理丢失端口 | URL.href 会省略默认端口，而原解析器需要显式端口 | 规范化主机与认证后保留显式端口 | Browserapp/rebuild/local-service.js:99 | 端口 80 和特殊认证字符往返 |
| SSL 开关错误放宽证书验证的风险 | 把密码套件屏蔽误当证书错误忽略 | 映射 sslBlacklist，保留原证书校验 | Browserapp/rebuild/local-service.js:251 | 断言不启用 ignoreHttpsError |
| 图片、音视频开关语义颠倒 | 字段名 forbid 与实际 true=开启 的 UI 标签相反 | 反向映射 blockImages/Video/Sound | Browserapp/rebuild/local-service.js:176 | 三个开关双向测试 |
| 窗口定位三字段无法解析 | 原值是 x,y,anchor，适配只认两字段 | 解析前两个比例并映射原后端位置枚举 | Browserapp/rebuild/local-service.js:165 | 1,0.5,tr 与 mr 往返 |
| 多账号 URL 保存后丢失 | 原 sanitizer 的账号白名单缺 url | 补充 URL 白名单，不替换原存储 | Browserapp/engine/profile-sanitizer.js:122 | 两账号不同 URL 持久化测试 |
| Firefox 编辑切换 Chrome 后仍是 Firefox | 映射沿用 base.engine | 显式 coreType 优先，拒绝未知内核类型 | Browserapp/rebuild/local-service.js:26 | 双向内核类型回归 |
| 清空平台账号或代理后旧数据还在 | 空数组跳过映射，直连标记只读取根 DTO | 显式空账号数组清除机密，读取代理行的 noproxy 标记 | Browserapp/rebuild/local-service.js:59 | 清空账号及代理恢复 Direct 的回归 |
| 最后打开时间一直为 -- | 原前端承担的更新时间在新入口缺失 | 真实启动成功后按版本更新元数据 | Browserapp/rebuild/local-service.js:885 | 真实进程启动及后端状态探针 |
| 跨机器导入引用不存在的代理 ID | 交换文件携带源代理库关联 ID | 内嵌完整代理、清除关联 ID、按名称重建目标分组 | Browserapp/rebuild/local-service.js:1478 | 两个独立后端目录真实交换，认证与 Cookie 保留 |
| 删除分组后仍显示旧组名 | 只清 groupId，遗留 group_name | 同时清除两个字段，并恢复旧窗口仍引用的组 | Browserapp/rebuild/local-service.js:1094 | 旧组恢复、移除与交换分组测试 |
| 字体切换生成的数据没有保存 | 原 form 使用 font 分号字符串，适配只看 fontType | 解析并映射原后端 fingerprint.fonts，读回同步格式 | Browserapp/rebuild/local-service.js:255 | 三个字体完整往返 |
| 原任务选择模板后提示词为空 | 产物把模板正文覆盖成缺失的 task.metadata.prompt | 无任务覆盖时回退模板正文 | Browserapp/rebuild/compiler/patch-local.cjs:557 | 原任务立即执行预填，真实 SSE 回复与计划日志 |
| 检查点续跑可能失去窗口范围 | 检查点只保存上下文 | 连同 fullAccess、allowedProfileIds 和 taskMeta 保存恢复 | Browserapp/rebuild/agent-service.js:325 | 真实 resume 请求与权限范围断言 |
| 超大模型流或非法工具索引消耗内存 | 响应大小与 tool_call index 未约束 | 每轮 2 MiB、最多 64 个有效工具索引 | Browserapp/rebuild/agent-service.js:772 | 真实 HTTP 超大流与非法索引拒绝测试 |
| 退出时计划任务仍可能新建运行 | 仅清理定时器但不等待进行中的 tick | 关闭标记阻止新任务，等待 tick 后中止并保存运行 | Browserapp/rebuild/agent-service.js:704 | 调度/取消服务回归与 Electron 退出 |
| Skill 编辑可覆盖包根目录的风险 | 保存接口曾接受任意扩展字段 | 仅接受 slug/content/enabled，读取 realpath 限定包内 | Browserapp/rebuild/agent-service.js:25 | 越界、符号链接、根路径白名单与引用读取回归 |
| 构建失败或并发构建破坏可用界面 | 直接覆盖运行目录，共用 stage/output | 独占锁，审计后原子替换，失败回滚旧目录 | Browserapp/rebuild/compiler/build.cjs:9 | build-guard 实测拒绝并发且 UI 哈希不变 |
| 打包后 Agent 依赖不可用 | 旧打包器排除全部 node_modules | 复制真实生产依赖闭包，拒绝意外依赖 | Browserapp/main/production-dependencies.js:24 | 六包打包目录实际 require 通过 |
| UI 等待提前通过掩盖失败 | 当前 Playwright waitForFunction(async false) 直接返回 | 改成 Node await 轮询，保留最终状态断言 | Browserapp/rebuild/selftest-helpers.cjs:3 | 独立复现及全部受影响 UI 重跑 |
| 同步浮条样式使整个工作台无法点击 | 原透明独立窗口 CSS 对 html/body 禁用事件 | 限定到浮条路由 | Browserapp/rebuild/compiler/purge-resources.cjs:43 | 真实按钮点击与卸载监听测试 |
| 普通窗口行变淡且多出表格内边距 | 同步列表 CSS 含全局 table/row 规则 | 整份同步列表样式限定同步路由 | Browserapp/rebuild/compiler/purge-resources.cjs:46 | 普通行计算 opacity=1，截图无额外内边距 |
| 新建窗口后列表缓存不刷新 | 原组件不知道 Native profile 变更事件 | 发出本地变更事件，使原表格失效重取 | Browserapp/rebuild/renderer-bridge.js:112 | 直接后端创建 21 条后列表和用量同步显示 |
| 旧查询覆盖新结果、失败后一直加载 | 原表格没有请求序号与 finally | 每实例最新请求生效，finally 释放当前忙状态 | Browserapp/rebuild/compiler/patch-local.cjs:744 | 搜索/分页、错误回归及请求序号检查 |
| 默认搜索不筛选 | name_remark 被当成未知专用搜索键 | 将它归入名称/备注的组合查询 | Browserapp/rebuild/renderer-bridge.js:210 | 21 条搜索仅剩 21，清空恢复全部 |
| 更新/通知弹层 offsetHeight null | await 后 DOM event.currentTarget 已清空 | 同步捕获按钮 target，再传入原 Popover | Browserapp/rebuild/compiler/patch-workbench.cjs:10 | 两个真实弹层均无页面错误 |
| 同步选择被免费套餐状态误禁用 | 原主进程返回的能力字段在本地桥缺失 | 按真实 Chrome 能力提供 canUseSyncControl，Firefox 仍不支持 | Browserapp/rebuild/renderer-bridge.js:646 | 选择页能力标记与真实双窗口探针 |
| 反复开关页面积累监听 | 订阅缺少组件卸载清理 | onScopeDispose 自动解绑，窗口事件及计时器清理 | Browserapp/rebuild/renderer-bridge.js:776 | 三次挂载/卸载订阅均释放 |
| 真实同步已 active，但输入不到从控 | 全屏桥删除全局 CDP 回调，而输入监听器每次仍读取该全局 | 输入监听保留闭包引用；默认执行上下文先装输入再隐藏全局 | Browserapp/live-sync-v4.js:31 | 双真实 Chrome 输入、暂停/恢复/停止通过；全局仍隐藏，原品牌泄漏回归 10/10 |
| 同步默认上下文安装存在竞态 | Runtime.executionContextCreated 先隐藏回调可使输入脚本找不到 binding | 该上下文按输入脚本→全屏脚本的顺序初始化 | Browserapp/live-sync-v5.js:1236 | 真实双 Chrome 与暂停恢复端到端回归 |
| 代理测试结果保存抛未接线错误 | 原代理与窗口检测结果使用独立 SDK 方法 | 新增结果写回与代理绑定适配，仍使用原 Store 和版本化命令 | Browserapp/rebuild/local-service.js:1424 | 原后端绑定、检测结果持久化与删除关联保护测试 |
| 删除已关联代理使窗口留下失效 ID | 直接删库不检查窗口关联 | 拒绝删除仍被窗口或回收站引用的代理，先解除关联 | Browserapp/rebuild/local-service.js:1455 | 真实代理绑定后删除被拒绝，解除后删除成功 |
| 定位按钮把直连当成代理检测而失败 | 原 engine.testProxy 明确只检测代理出口 | 使用现有 lookupDirectCountry；仅用户触发才查询，合并并发探测 | Browserapp/rebuild/host-network.js:4 | 定位按钮与配置代理的测速/结果写回均已真实联网通过；渲染端外部请求为零 |
| 侧栏窗口/项目菜单没有原选中态 | 本地路由展开为同级重定向记录，RouterLink 不匹配父级 | 恢复父子路由，保留原路由名与原 active 样式 | Browserapp/rebuild/compiler/patch-local.cjs:789 | 真实列表→创建→点击侧栏返回，两个页面均有 active；核心与管理 UI 重跑通过 |
| 打包探针没有启动实际复制的运行目录 | 原探针仅检查资源过滤谓词和依赖加载，示例 Skill 路径并不存在 | 检查真实资源存在，复制运行树并审计，再启动真实 Electron 读取本地窗口 | Browserapp/rebuild/packaging-selftest.cjs:57 | 真实复制目录启动成功，六个生产依赖可加载、无前端出网；明确排除用户内核和安装包验收 |
| 固定尺寸独立弹窗初始只有 1×1 | 当前 Electron 合成器创建隐藏、不可缩放子窗时没有应用预期内容区 | 显式设置原内容尺寸后锁定；首个布局前显示窗口并等待有效视口 | Browserapp/rebuild/dialog-windows.js:69 | 真实 Electron 原生内容区尺寸与原组件截图，安全探针通过 |
| 特殊弹窗名可命中对象原型成员 | 直接用 SPECS[kind] 读取继承属性 | 只接受字符串且 Object.hasOwn 的四个弹窗名 | Browserapp/rebuild/dialog-windows.js:34 | 真实 __proto__/constructor/越界名均拒绝，窗口数不增加 |
| 串行仿真选项原后端不生效 | 原控制器只对整个 fan-out 延迟一次 | AsyncLocalStorage 隔离单次转发上下文，逐从控延迟；保留扩展与失效会话判断 | Browserapp/live-sync-v5.js:1649 | 原控制器串/并行时间、失效代次取消；真实 UI 读回串行参数 |
| 切换输入开关后排队事件仍可能执行 | 只在入队时检查开关，延迟期间未复查 | 出队、延迟结束及串行逐窗前复查当前输入门禁 | Browserapp/live-sync-v5.js:997 | 实际控制器延迟中关闭点击后没有转发；真实同步回归 |
| 批量输入后从控又被清空 | 清空操作产生 change，它归入点击同步；旧排队事件和独立 CDP 流仍会回传 | 临时关闭键盘/点击，排空转发，调用原文本 runner，再用控制器 CDP 流屏障后恢复 | Browserapp/rebuild/sync-service.js:284 | 双真实 Chrome 替换/追加/差异文本均稳定，无重复或延迟清空 |
| 批量打开网址出现重复标签 | 向主控和每个从控都创建标签，同时原控制器自动镜像主控 | 活跃同步只向主控提交；暂停时逐窗口提交 | Browserapp/rebuild/sync-service.js:321 | 真实两浏览器每个网址恰好一次的断言通过 |
| 从当前页打开实际改了第一个标签 | 原主进程 navigate 分支调用选择首个标签的 cdp.navigate | 该操作改用 cdp.activeTab 对目标标签导航 | Browserapp/main.js:1308 | 真实打开三标签，保留首个并替换活动页；从控同步一致 |
| Linux 快捷键设置写到了另一个平台分支 | 原前端 navigator.platform 非 Win 时编辑 mac，桥按非 darwin 选择 windows | 按 win32/windows，其余/mac 与原组件保持一致 | Browserapp/rebuild/sync-service.js:21 | 源码分支核对、注册冲突/保留旧键/退出释放测试；物理按键跨平台未验收 |
| 退出后在途操作可能重新注册快捷键 | 仅在退出开始时清除，队列之后仍可注册 | 关闭接收并等待队列，再释放自有快捷键；退出期间拒绝快捷键动作 | Browserapp/rebuild/sync-service.js:415 | 关闭后请求拒绝，所有自有键释放；真实 Electron 退出 |
| 侧栏直接进入同步页未恢复持久化偏好 | 旧恢复只放在 open channel，RouterLink 绕过它 | 开始同步前始终从本地设置恢复 | Browserapp/rebuild/renderer-bridge.js:562 | 真实双浏览器和原设置保存回归 |
| 主控颜色可能伪报保存成功 | 标准 Chrome 没有 Roxy 的 Browser.setColor，旧桥忽略此字段 | 先修复旧桥假成功；现已进一步实现原生主题替代，见本轮记录 | Browserapp/automation/sync/master-window-color.js:75 | 原失败日志保留；当前标准 Chrome 真实颜色与原主题恢复通过 |
| TXT 结尾分隔符生成空记录 | 原解析器没有过滤空片段 | 过滤空片段，保留原字段及账号语法 | Browserapp/rebuild/compiler/patch-local.cjs:999 | 真实带末尾分隔符的两条 TXT 经原页面创建恰好两条 |
| 非法账号/网址 JSON 被当成空数组 | 原解析使用带 [] 回退的 JSON 帮助函数 | 严格解析并检查数组，原页面显示解析错误 | Browserapp/rebuild/compiler/patch-local.cjs:1025 | 真实非法 TXT 错误区可见，原后端数量不增加 |
| 导入分析和文件读取错误不显示 | 原上传函数只 console.log 或解析器返回空数组 | 保留原错误区/Toast，所有解析和 IPC 拒绝进入明确失败路径 | Browserapp/rebuild/compiler/patch-local.cjs:1196 | 真实 TXT/XLSX/非法文本界面通过；本地取消与文件大小验证 |
| 混合 OS 导入按同一系统生成指纹 | 原分组只有内核类型/版本，OS 来自全局表单 | 分组键及指纹调用增加逐行 OS 与系统版本 | Browserapp/rebuild/compiler/patch-local.cjs:1132 | 真实混合 Linux/Windows 导入，原后端系统字段正确；参数结构已检查 |
| 导入明确版本被全局最新设置覆盖 | 合并后 useLatestCore 优先于逐行 coreVersion | 逐行显式版本关闭 latest，空值才跟随最新 | Browserapp/rebuild/import-profiles.js:42 | 原后端重启后仍保存 Chrome 157 / Firefox 160，UI XLSX/TXT 读回 157 |
| 导入提交拒绝可能遗留阻塞进度框 | 原提交等待没有处理 IPC 抛错 | 转入原 code/msg 失败分支，保留错误并关闭进度框 | Browserapp/rebuild/compiler/patch-local.cjs:1173 | 源码失败分支检查与服务整批拒绝测试；磁盘失败的 UI 注入尚未做 |
| 缓存入口未接线且仍含云端清理分支 | 原菜单同时处理本地与云端缓存 | 物理删除云端选项/SDK 调用，本地两模式复用原清理/维护/边界工具 | Browserapp/rebuild/profile-cache.js:24 | 真实 UI 删除磁盘缓存；Cookie/插件两模式、Firefox、忙状态、越界批量预检均通过 |
| 选择文件期间占住元数据写队列 | 原新增文件选择被放入串行变更队列 | 只读选择与有界文件读取独立调度，导入提交仍串行 | Browserapp/rebuild/local-service.js:696 | 真实选择返回和原页面导入；分派检查，未模拟长时间挂起的原生对话框 |
| 本地不限量兼容值仍是固定十万 | ABI 兼容用户对象沿用了有限数字 | 改为 Infinity；仅保留每次批量操作的性能上限 | Browserapp/rebuild/compiler/prepare.cjs:27 | 编译产物检查；原用量卡与文件导入回归 |
| 退出时 Agent 保存失败会跳过浏览器停止 | 原顺序 Promise 链在 shutdown 拒绝后直接进入总 catch | 并行收敛两个本地服务退出，分别记录失败，再继续 stopAll 与持久化 | Browserapp/main.js:1558 | 真实运行 Chrome，注入 Agent shutdown 拒绝后 PID 消失，诊断日志含原失败 |
| 独立弹窗不继承深色且无法响应主题切换 | 主题 Store 只由主布局创建，而独立路由绕过布局 | 所有文档在根组件 setup 初始化原主题 Store，保留原持久化与 BroadcastChannel | Browserapp/rebuild/compiler/patch-local.cjs:55 | 原深色子窗与跨窗口切换探针；结果见 dialog-security-selftest |
| 无同步会话打开偏好设置时尺寸请求拒绝 | 原组件允许没有主控时得到空尺寸，桥强制要求选择窗口 | 无选择时返回 null，由原组件采用空默认值；有效选择仍检查进程 | Browserapp/rebuild/sync-service.js:133 | 无浏览器的真实偏好弹窗与安全探针 |
| 通用错误事件无人监听，失败提示不可见 | 把错误发到 rich-html 事件总线的 showToast，但原组件没有订阅 | 在根 setup 接入原 useToast 服务，按原 tr 分组展示；避免已通知错误重复弹出 | Browserapp/rebuild/compiler/patch-local.cjs:55 | 真实未知 channel 抛 LOCAL_CHANNEL_UNIMPLEMENTED 且原 Toast 可见，控制台与前端外部请求为空 |
| 未接 Cookie Robot 仍关闭输入框，像是已经启动 | 原确认回调没有等待 send，也没有保留拒绝路径 | 等待真实 IPC，失败保留原表单与输入并显示错误；仍明确标记能力未接线 | Browserapp/rebuild/compiler/patch-local.cjs:1216 | 真实原表单确认后仍可见、输入不丢失、RPA 任务数 0、没有启动浏览器 |
| Cookie Robot 等原弹层窗口编号只显示 -1 | 本地窗口 DTO 缺少原组件读取的 workspaceName | 补本地固定 workspaceId/name；无团队或云端行为 | Browserapp/rebuild/local-service.js:368 | 真实原弹层断言编号 OPE-1；原后端服务回归通过 |
| 窗口表项目列只剩图标而没有默认项目文字 | 原后端无分组是空 ID/名称，原表格直接渲染 projectName | 仅在 UI 查询适配把空项目显示为原默认项目翻译，不写入分组或更改原数据 | Browserapp/rebuild/renderer-bridge.js:200 | 真实圈选工作台断言默认项目可见并重拍明暗截图；有分组行继续用原名称 |
| Cookie Robot 退出时可能饿死首个落盘 | 任务已预留但执行器未注册，退出循环没有让出 I/O | 等待在途保存时让出事件循环，再终止并标记任务 | Browserapp/rebuild/cookie-robot.js:692 | cookie-robot-selftest 注入首保存延迟，退出完成 |
| Firefox Robot 临时启动开关无效 | 原 Firefox 分支未接收 launchOptions | 只在该次启动使用 headless/禁图，不改窗口偏好 | Browserapp/engine/start-firefox.js:148 | 真实 Firefox 160 Headless、图片未请求，存储偏好不变 |
| Robot 关闭后新 Cookie 未写入窗口交换数据 | 主进程 cookie 快照只在旧云备份分支 | 停止前经原 CDP/BiDi 读取并提交原版本化配置 | Browserapp/rebuild/cookie-robot.js:435 | 真实 Chrome/Firefox 本地站点 Cookie 写入并读回 |
| 大 Cookie JSON 被截断成无效内容 | 原 sanitizer 静默 slice(0,500000) | 超过原上限则整条拒绝，不写损坏 JSON | Browserapp/engine/profile-sanitizer.js:16 | 服务测试超大 Cookie 拒绝且窗口数不增加 |
| 附件在上传完成前被忽略 | 原本地 Agent 立即调用模型且 Blob 不能经结构化 DTO 保留 | 原附件完成事件作为模型前置门禁；字节上传形成加密快照 | Browserapp/rebuild/agent-service.js:269 | 原 UI 原生选文件/PNG 上传，HTTP 模型实际收到文本和图片 |
| 模型可能读取未授权的附件路径 | 仅文件名或 renderer 传来的路径不能证明访问授权 | 原生选择授权不可变快照，工具只读当前会话 UUID 集合 | Browserapp/rebuild/agent-files.js:332 | 跨范围、路径、符号链接、超限批量、实际 OpenAI/Ollama 通过 |
| 账号库绑定在往返后丢失 | 原字段适配没有保留库 accountId，编辑后成为手工副本 | 保存合法稳定 ID；选择时在主进程读取原账号库 | Browserapp/engine/profile-sanitizer.js:121 | accounts-selftest 绑定、更新、解绑、删除与重启通过 |
| 账号编辑可能把旧密码清空 | 脱敏列表被直接当完整编辑数据 | 显式编辑/查看/导出时读取机密；常规列表继续脱敏 | Browserapp/rebuild/compiler/patch-local.cjs:1326 | 原抽屉真实密码、修改用户名后密码不变，UI 明暗回归 |
| 账号库写盘失败可能留下已变更窗口 | 账号库和配置分属两种持久化 | 批量原命令提交后，失败按最新 revision 补偿原账号字段，保留并发备注 | Browserapp/rebuild/accounts.js:50 | 真实文件失败回滚，保留并发备注，旧记录加密重启通过 |
| 刷新丢失当前页面 | 启动脚本无条件 replace 到 browser/list | 初次进入工作台，有效 hash 路由刷新保持 | Browserapp/rebuild/compiler/patch-local.cjs:879 | 平台账号/扩展真实刷新后仍在原页面 |
| 扩展导入失败却关闭原弹窗 | 父回调 catch 吞掉拒绝，子弹窗继续关闭 | 通知后重抛，原输入框与重试路径保留 | Browserapp/rebuild/compiler/patch-extensions.cjs:53 | 扩展本地导入/原项目分配 UI；磁盘失败与目录恢复服务测试 |
| 扩展按项目分配可能半批成功 | 先取消再添加分两次保存 | 原原子发布工具一次保存元数据及所有关联，失败还原 | Browserapp/rebuild/extensions.js:156 | 真实写盘失败前后关联不变；后建窗口与移动项目继承 |
| 原扩展固定按钮只保存 UI 值 | 原生启动偏好没有该映射 | 按 Chromium key/path 身份在启动前写入 pinned_extensions | Browserapp/engine.js:619 | 原固定菜单实际操作，真实 Chrome service worker isOnToolbar=true |
| 还残留试用及续费组件闭包 | 旧扫描只看已知关键词，组合 chunk 同时含本地内核与商业代码 | 按 AST 组件名删除真实商业体，保留本地内核体 | Browserapp/rebuild/compiler/ui-audit.cjs:15 | 新 __name 商业扫描为 0，构建守卫通过 |
| 自定义内核探针在无 X 会话失败 | 兼容性探针启动 GUI，但不需要交互 | 探针使用 Chromium headless，保持独立用户目录和协议校验 | Browserapp/automation/browser-kernel.js:2061 | 扩展和系统入口 UI 经真实 kernel:set-custom 验证 Chrome 157 |
| 快捷方式只打开主界面不启动指定窗口 | 没有单实例/首次启动的 profile CLI 处理 | 校验窗口和 URL，等待原后端 ready，使用原进程与 CDP/BiDi | Browserapp/main.js:138 | 真实第二个 Electron 进程启动指定 Chrome 并打开本地 fixture URL |
| 默认浏览器可能虚报成功 | OS 注册函数或 xdg-mime 的返回码不能证明默认处理器已改变 | 查询 HTTP/HTTPS 默认应用，成功才提示；需要系统确认时明确说明 | Browserapp/rebuild/host-actions.js:50 | 原菜单真实注册并查询独立 XDG；Windows/macOS 仍未验证 |
| 空 XDG_CONFIG_HOME 时 xdg-mime 返回 0 却未保存 | 系统脚本先 touch 后 mkdir，首次目录缺失 | 先建配置目录，再用原工具设置并查询验证 | Browserapp/rebuild/host-actions.js:47 | 新建独立配置目录的真实 xdg-mime 测试通过 |
| 项目表格打不开默认项目 | 适配默认行遗漏 user_info，原操作菜单直接 find | 统一默认/自建项目 DTO、窗口计数和固定状态 | Browserapp/rebuild/local-service.js:1004 | 原项目列表、默认/分组详情、固定与重载的真实 UI 回归 |
| 固定项目失败或侧栏无记录 | 固定请求没有名称；顶部项目接口返回数组而原组件读取 rows | 仅固定允许省略名称，返回 rows/total，并保留默认项目虚拟 ID | Browserapp/rebuild/renderer-bridge.js:378 | 原菜单固定、重载出现在侧栏、取消固定均通过 |
| 项目详情落入通用窗口列表 | 旧父子路由指向 list，没有项目标题和原过滤容器 | 恢复 project-item 原组件；默认项目映射为空 Native groupId | Browserapp/rebuild/compiler/patch-projects.cjs:28 | 详情仅显示目标项目窗口，默认项目不可改名/删除 |
| 创建项目弹窗报 G 未定义 | 删除成员加载状态后还保留成员专用遮罩 | 连同遮罩删除；提交 finally 复位；保留原名称与按钮 | Browserapp/rebuild/compiler/patch-projects.cjs:14 | 原创建、编辑、删除项目完整闭环与 management UI |
| 扩展清理失败倒退已提交文件 | 元数据提交与清理共用回滚 catch | 标记提交边界，清理失败明确报错并退出重试，不回滚新文件 | Browserapp/rebuild/extensions.js:120 | 注入真实备份 rm 失败，新版本文件/元数据/关联一致，后续清理成功 |
| 代理创建还残留购买回调和空 catch | 只移除 buyProxy 声明，没有移除 onBuy 与闭包 | 物理删除整个回调和事件属性；增加全产物未声明绑定检查 | Browserapp/rebuild/compiler/commerce.cjs:435 | 绑定审计实际发现 R 未定义；修复后构建检查 0 未声明局部引用 |
| 原 API JSON 编辑器抛类实例身份错误 | Vue ref 深代理 CodeMirror EditorView | markRaw 保存编辑器实例；保留原语法高亮与复制交互 | Browserapp/rebuild/compiler/patch-api.cjs:32 | 原 API 实际配置/密钥轮换与 MCP 示例渲染，console/pageerror 0 |
| 原 JSON 编辑器注册对象为空 | 图裁剪遗漏写已保留变量的顶层循环 | 只保留写入保留模块绑定的 for/for-in/for-of 注册循环 | Browserapp/rebuild/compiler/slice.cjs:219 | 原 CodeMirror 实际创建、原 API 页面和配置复制通过 |
| 证据校验读取已移动 staging 文件 | 哈希索引记录临时输出路径，构建安装后路径失效 | 读 staging 内容生成 hash，索引使用稳定运行目录相对路径 | Browserapp/rebuild/compiler/audit.cjs:110 | 当前运行文件逐项 hash 检查，不把历史 staging 当运行产物 |
| 刷新时待批准卡消失 | 原事件通道只接收实时事件 | 重连读取 activeEvents，原 sequence/revision 去重 | Browserapp/rebuild/agent-channel.js:90 | 原允许/拒绝/完全访问按钮与刷新后仍待批准，不重发模型请求 |
| 等待授权落盘时批准后取消仍可能执行 | 批准 Promise 已 resolve，但后续取消发生于异步保存期间 | 保存后与工具前再次检查 abort；等待 Promise 立即挂拒绝观察 | Browserapp/rebuild/agent-approval.js:12 | 暂停实际 save，批准后取消，未创建窗口且无未处理拒绝 |
| MCP 工具分页可无限循环或重名覆盖 | 外部服务 cursor 可循环，工具名称可重复 | 真实协议层限制 20 页/200 工具并拒绝重复名 | Browserapp/rebuild/agent-mcp.js:96 | 实际 HTTP 循环 A/B/A 与重名响应均拒绝，连接释放 |
| MCP 服务命令含空格路径重编辑后损坏 | 原表单零参数命令未加引号，重存被拆成多个词 | 回填命令与参数统一 JSON 引号，Native 无 shell 词法解析 | Browserapp/rebuild/compiler/patch-mcp.cjs:6 | 真实 stdio 带空格文件名、参数、环境变量；原 UI HTTP 编辑/改名通过 |
| 限定窗口任务可通过外部工具绕过范围 | 外部服务并不执行 Native allowedProfileIds | 不向限定窗口任务提供外部工具，调用端也明确拒绝 | Browserapp/rebuild/agent-mcp.js:135 | 实际工具表为空且直接调用拒绝，外部请求计数不变 |
| 原控件重载丢失已保存偏好 | Native 设置已落盘，但本地 Pinia userConfig 只创建固定默认值，SDK 读写也未发布 | 启动合并实际保存值；原 SDK 读写后发布到同一响应式 store，更新时保留其他字段 | Browserapp/rebuild/renderer-bridge.js:37 | 真实 Electron SDK 即时状态、重载和主动刷新往返通过 |
| Agent 保存失败遗留 MCP 子进程 | 保存在 shutdown 顺序 await 前，异常跳过后续 MCP 清理 | 保存/附件/MCP 清理 allSettled，全部收敛后汇总抛出原错误 | Browserapp/rebuild/agent-service.js:748 | 注入保存失败，实际 stdio PID 消失、HTTP session 关闭、保存错误仍抛出 |
| 内核下载和主动公网定位在环境代理网络下失败 | 维护请求强制直连；代理主机单标签名又被发送给公开 DoH | 维护请求显式使用环境代理与 NO_PROXY，本地代理服务名改系统 DNS，保持窗口自己的代理路由 | Browserapp/network/environment-agent.js:6 | environment-network 与 proxy-forwarder DoH 7/7；真实网络定位与 Mozilla 目录/下载 UI 通过 |
| 公网定位时区被本机 UTC 覆盖 | 结果合并时用主机字段覆盖探测字段 | 保留探测到的地区时区，单列真实出口路由名称 | Browserapp/rebuild/host-network.js:4 | 真实 network-ui 查询与持久化通过；首次只读本地网卡 |
| 网络模拟往返丢失省流与最大速率 | UI DTO 和网络指纹字段命名不一致 | saveFlowMode→saveData，maxDownloadSpeed→downlinkMax；在原生属性存在时包装 getter；后续补显式 NetInfoDownlinkMax，见本轮记录 | Browserapp/engine/profile-sanitizer.js:429 | 真实 Chrome 文档/worker 省流生效，后续真实文档/Worker 最大值与类型也已通过，见本轮记录 |
| 设置正图片阈值后所有图片都被禁止 | 旧映射把图片关闭直接映射 blockImages，丢弃大小条件 | 独立 imageMaxBytes，同一 Fetch owner 内有界读流，超限阻止，停止释放 | Browserapp/automation/image-size-filter.js:3 | 六种真实 HTTP 图片（已知/未知/压缩长度）和流读取中停止通过；原表单明暗/创建/回填通过 |
| 仅静音会同时禁止视频 | sanitizer 合并 blockSound→blockVideo，启动参数和 Firefox 也共用条件 | 声音与视频独立，Chrome 静音不改视频策略，Firefox 音量单独配置 | Browserapp/engine/profile-sanitizer.js:257 | media-preferences 真实 Chrome 参数、视频请求允许/禁止与 Firefox 配置生成通过；不宣称物理声音已测 |
| 旧 CSS 管线自测在失败后跳过仍打印全通过 | 正则未正确提取生产方法；跳过分支未检查已累积失败 | AST 提取实际方法，保留 Fetch 注册顺序断言，跳过明确记 STATIC PASS / runtime SKIPPED | Browserapp/automation/selftests/css-font-response-wiring-selftest.js:77 | Linux 静态 5 项通过；macOS 字体资源对应运行分支明确跳过，不能视为 runtime PASS |
| 原批量操作浮条无法用键盘打开菜单 | 原点击 div 无 role/tabindex/键盘事件 | 保留原 DOM/class，增加语义焦点与 Enter/Space，禁用项不可触发 | Browserapp/rebuild/compiler/patch-local.cjs:1445 | 原批量升级 UI 使用真实键盘 Enter 触发；结果见 kernel-upgrade-ui-selftest |
| 图片阈值截图比较出现焦点轮廓差异 | Tab 把焦点留在下一视频开关，独立 render 切换导致原生焦点环重新绘制 | 固定此表单状态为真实点击说明文字失焦；焦点专项另验，不加像素容差 | Browserapp/rebuild/visual-parity-selftest.cjs:35 | 56 组独立原 render 对照精确 0 差异；历史失败和稳定截图哈希保留 |
| 批量内核升级显示成功但 UA/WebGL 未变化 | profiles:patch 只处理公共字段，丢弃逐窗 fingerDetail | 按 ids 逐一合并指纹；条数或 UA 不完整则整批拒绝，仍走原 ProfileStore 版本命令 | Browserapp/rebuild/local-service.js:923 | 真实 Chrome/Firefox 分组原弹窗升级、两条 UA 落盘；服务负例保证无变更 |
| 模板商城读取真实空库而没有可用本地内容 | 旧 catalog 未生成，获取只有 official ID 时又缺少名称/Skill 元数据 | 目录读取本机已启用 Skill；稳定 ID、获取解析本地引用、标签返回真实独立集合 | Browserapp/rebuild/agent-template-catalog.js:3 | 四卡原 UI 获取→我的模板→刷新与明暗通过；Native 启停和加密重启通过 |
| 模板变更保存失败后内存与磁盘分叉 | 原记录处理直接改集合和置顶对象，未回滚，也未与调度串行 | 模板/任务/调度共用队列，失败恢复当前集合，退出等待记录操作；被任务引用的模板不能删除 | Browserapp/rebuild/agent-records.js:41 | 8 并发唯一 ID、创建/更新/置顶/删除四种写盘拒绝后原集合保持；原计划任务真实执行回归通过 |
| 同步批量开网址稍后丢失已打开标签 | 刷新与输入转发并发分配同一目标，映射发布滞后；主从目标快照不原子，清理可能依据陈旧主控列表 | 统一映射/转发/清理队列，提前登记保留目标，旧快照缺目标时重读；清理前核对主控；代次失效停止并回收迟到新标签 | Browserapp/live-sync-v5.js:1475 | 原双 Chrome 弹窗连续三次通过及最终生命周期回归；确定性分配阻塞/旧快照/停止中分配测试通过，原失败日志保留 |
| 新增验收工具可能被生产资源树打包 | rebuild 目录按域准入，只排除 selftest/compiler 名称 | 显式排除验收 runner/清单/证据核对/画廊生成/Python 差分工具，保留 Native 运行模块 | Browserapp/scripts/runtime-manifest.js:33 | 真实复制树审计与复制目录 Electron 启动通过；加入工具路径拒绝断言 |
| Firefox 图片体积阈值被直接拒绝 | 原 BiDi 分支没有响应体读取/过滤层 | 临时 Firefox 响应流扩展按解码字节有界过滤，缓存绕过、就绪握手及退出端口/缓冲清理 | Browserapp/automation/firefox-image-filter.js:28 | 真实 Firefox 已知/未知/gzip/重定向、旧缓存、Cookie、读取中停止及随机能力路径拒绝通过 |
| 标准 Chrome 不支持同步主控颜色 | 原 Browser.setColor 是私有内核命令 | 保留私有能力优先；标准内核使用真实本地主题，恢复原种子/灰色/第三方主题及原活动标签 | Browserapp/automation/sync/master-window-color.js:74 | 原颜色选择器、真实三点 RGB 截图、原主题恢复、多标签及重启遗留恢复通过 |
| 切换主题可能丢失原第三方主题 | Chrome 撤销提示持有旧主题；禁用/启用新主题存在异步自动卸载 | 先备份纯主题；把安装提示归属临时控制页后回收，显式恢复原活动标签；原主题缺失时从原目录/快照恢复 | Browserapp/automation/sync/master-window-color.js:61 | 真实第三方主题恢复、实际重启、灰色主题及安装拒绝回滚通过；失败历史保留 |
| 浏览器设置页/新标签页可能卡住 | 网页指纹脚本进入 Chrome 自己的特权组件 DOM | document-start 遇到特权 origin 直接返回；后续普通网页继续原指纹注入 | Browserapp/automation/fingerprint/injection-script.js:239 | 真实 Chrome 设置页保持 Linux 原生身份，回普通网页恢复 Win32；注入缓存/payload/顺序/worker 专项通过 |
| 真实窗口启动后总带元数据更新警告 | 用只允许公共字段的 patch 写 lastOpenedAt | 经原版本门禁提交完整 modify 命令，不扩大 patch 白名单 | Browserapp/rebuild/local-service.js:885 | 真实 Native 启动不含 warningMessages，ISO 时间实际保存；版本/IPC 回归通过 |
| 原网络表单最大速率只保存不生效 | 桌面 Chromium 默认未启用可选 downlinkMax/type 原生 getter | 显式网络指纹启用 Chromium NetInfoDownlinkMax，原注入器继续包装真实 getter | Browserapp/engine/launch-arguments.js:64 | 真实文档与 Worker 均读取 type=wifi、downlinkMax=3000，saveData/downlink/rtt 保持通过 |
| 删除主控窗口可能早于主题/同步清理 | 旧 beforeRemove 回调和 IPC 删除按同步函数调用 | 删除/移入回收站/清空指定项 await 清理屏障，清理失败不执行删除 | Browserapp/main/profile-ipc.js:9 | 15 channel IPC、异步阻塞/清理拒绝与版本/元数据测试通过 |
| 点一条通知会标记所有通知已读 | Native notifications:read 未处理 ids | 有 ids 时仅修改指定记录；无 ids 仍为原全部已读；校验参数 | Browserapp/rebuild/local-service.js:1256 | 原通知/全部已读 UI 与 Native 精确选择回归 |
| 验收记录可能把执行后修改的测试当作已测版本 | 原 runner 在测试结束才计算测试 hash，且没有整轮来源快照 | 启动前记录测试 hash，结束检查未变；前后计算运行树 hash，保留旧尝试和原日志 | Browserapp/rebuild/acceptance-runner.cjs:6 | 完整冻结运行树重跑，所有测试来源及运行文件来源一致；最终核对还会与当前测试 hash 对比 |
| 新建标签立即导航会被巡检错误关闭整个浏览器 | 自动附加正在准备并校验暂停文档，watch 同时接管该目标；所有者还可能在 HTTP 快照之后才出现 | 共享实时会话所有权；watch 在每次 await 后检查未就绪所有者并延后；只由实际所有者验证后恢复目标，真实错误仍拒绝 | Browserapp/engine/runtime-settings.js:24 | 真实两页立即导航与原浏览器工具回归；16 项重注入测试包含快照后所有者、未验证标记及真实错误/失败所有者必须拒绝 |
| 恢复快照主题后再次配色可能删除正在使用的快照 | 备份源和目标为同一个目录时先删除目标 | 先验证纯主题/容量边界，同目录直接保留已有快照，不删除复制源 | Browserapp/automation/sync/master-window-color.js:63 | 真实安装带公钥主题→原目录和注册项被清理→从快照恢复→再次配色并恢复，原 ID 与文件均保留 |


## 第二轮全面审查修复

初次失败证据保留在 [数据一致性失败](evidence/review-2/consistency-before.json)、[重连失败](evidence/review-2/agent-reconnect-before.json) 和 [商业资源发现](evidence/review-2/commerce-before.json)。修复没有删除失败断言。

| 症状 | 根因 | 修法 | 文件:行 | 验证 |
| --- | --- | --- | --- | --- |
| 删除任务、模板或标签后，新记录可能占用旧 ID，历史日志/筛选器指向新对象 | 按剩余记录最大 ID 分配，删除最高项后退回旧值 | 持久化高水位；迁移扫描历史引用；删除前记住旧 ID；保存失败恢复计数 | Browserapp/rebuild/local-record-ids.js:16 | review-2/consistency.json：删除/重启、历史日志引用、迁移与保存失败 |
| 删除分组/标签写盘失败后，元数据恢复但窗口实际关联已丢失 | 原 ProfileStore 与本地 JSON 分属两个提交 | 分批 200 个原生 modify；失败仅按最新 revision 恢复本次关联字段；保留并发备注；冲突明确 AggregateError | Browserapp/rebuild/profile-relations.js:5 | review-2/consistency.json：分组/标签故障、201 窗口成功/第二批失败、并发关联冲突 |
| 分页内拖动项目会把未选项目移动到前面 | 全局 indexOf 排序把未选 ID 当作 -1 | 仅替换被选项目原位置，校验重复/不存在 ID，默认项目维持独立位置 | Browserapp/rebuild/local-service.js:1110 | review-2/consistency.json：四项目中间两项重排 |
| 保存筛选器排序后，重新读取恢复插入顺序 | settings.filterSort 已保存但 filters:list 没应用 | 读取使用稳定排序；重命名同步排序记录 | Browserapp/rebuild/local-service.js:1176 | review-2/consistency.json：c/a/b 与实际读取一致 |
| Agent 断线重连无效、日志初始化失败仍显示 connected | 重连重用首次 Promise，info 成功后过早设置连接状态 | 实际重试 info/日志/活动事件；合并并发握手；全部同步成功后 ready；缓存初始化期间事件并按运行序号去重 | Browserapp/rebuild/agent-channel.js:99 | review-2/agent-reconnect.json：首次/日志失败、四并发重连、真实 SSE 单次事件 |
| 原模板置顶、目录详情参数或返回形状不匹配 | numeric ID 被 Object.assign 丢弃；置顶返回仍包在 code/data；漏 templateIdOrSlug | 规范化标量 ID，置顶仅向原调用者解包；详情接受 ID/slug；列表忽略 HTTP paramsSerializer | Browserapp/rebuild/renderer-bridge.js:845 | review-2/template-ui.json：原 UI 置顶/取消、重载、目录调用 |
| 原版创建模板弹窗无法上传 Skill ZIP | Blob 经普通 DTO 变空对象且缺少 namespace 后端处理 | FileReader 有界 Base64；Native 校验编码/ZIP、SHA512、多文件包；文件安装和加密元数据共同提交/回滚 | Browserapp/rebuild/agent-skill-upload.js:43 | review-2/template-ui.json：原文件输入→模板→实际任务；consistency：覆盖包写盘失败回滚 |
| 原个人模板删除先调用缺失的 deleteInstalledSkill，且可能先删掉被任务使用的共享 Skill | 前端先删安装包再删模板，两个动作没有共同引用检查 | 模板页只调用版本化记录删除；模板引用检查先执行；模板删除保留共享库；库删除独立校验引用并事务删除磁盘目录 | Browserapp/rebuild/compiler/patch-local.cjs:1449 | review-2/template-ui.json：原确认框、引用拒绝不丢 Skill；consistency：库删除故障恢复及目录实际删除 |
| 去对话运行导入的 Skill 指向错误的旧统一安装目录 | 原 UI 假设统一 library/skills/installed 路径，Token 校验仍强制该旧目录；本地根不同会使提示词直接变空 | 生成原 Token 的 target 和解析校验共同改为 Native read_skill 使用的本地 slug，不拼不存在的路径；保留首次真实聊天失败记录 template-chat-before.json | Browserapp/rebuild/compiler/patch-local.cjs:1466 | review-2/template-ui.json：原去对话运行 target 与第二次模型请求 |
| 未知 Agent 记录方法可能意外更新或创建记录 | 仅凭 create/update/delete 前缀决定操作 | 精确 namespace/action 白名单；旧脚本沙箱明确拒绝；创建永远不复用传入 ID 对应的旧对象 | Browserapp/rebuild/agent-records.js:5 | review-2/consistency.json：updateAnything、officialScripts 写操作明确拒绝且不修改数据 |
| 商业扫码入口通过了原静态黑名单 | 定制模板/商城咨询横幅、共享弹窗和两张客服二维码未被原英文规则覆盖 | 物理删除两个入口、组件/调用/样式和二维码；扩展 AST、资源清理与 grep 黑名单 | Browserapp/rebuild/compiler/commerce.cjs:217 | commerce-before.json 留下发现时文件 hash；新 static-audit、commerce-grep、原模板 UI 入口不存在断言 |
| SDK/channel 数量齐全仍漏掉真实前后端契约缺口 | 原审计只看 userX 与 electronAPI，没追直接本地 RPC、ops、Agent namespace/回调 | 新增作用域感知 AST 审计，追踪 utils.N 客户端绑定与传递的函数引用；精确到 Native 分支/主进程 handler；动态与未迁移接口单列 | Browserapp/rebuild/compiler/backend-contract-audit.cjs:6 | backend-contract-audit.json；305 静态使用点、169 个唯一能力、10 个动态转发单列，不把存在分支当返回契约证明 |
| 配色返回后原活动标签偶发仍隐藏 | CDP 激活/关闭 ACK 不代表原生页及 renderer 可见状态已稳定；原实现单次读取选中态、返回前未等待恢复 | 选中态稳定采样；激活控制页/恢复原页均等待真实可见屏障；关闭控制页等待目标移除，保留所有失败路径 | Browserapp/automation/sync/master-window-color.js:14 | 真实 X11 原断言不变；额外注入每次 ACK 后三次陈旧 hidden 响应，要求等待屏障并实际检查其他标签隐藏；修前 master-color-visual-before.json 留档 |


## 第三轮契约审查

本轮清理可重建数据时还暴露了验收工具对旧随机目录的硬编码依赖：Cookie Robot 测试引用已经结束的 kernel-ui-vnqmVf 中的 Firefox 下载包。改用 work/rebuild/fixtures/firefox-160.0 稳定缓存；缓存不存在时从固定官方地址重新下载，严格核对之前已记录的 SHA256 后才写入/解包，不重新信任新 hash。位置：Browserapp/rebuild/cookie-robot-ui-selftest.cjs:55。[缺失包原失败](evidence/review-3/cookie-fixture-before.json)；真实双内核 Robot、滚动、Cookie、偏好和取消断言全部保留。

[初始失败](evidence/review-3/agent-contracts-before.json)、[跨保存并发失败](evidence/review-3/cross-store-before.json)、[MCP/日志失败](evidence/review-3/mcp-log-before.json)、[事件范围失败](evidence/review-3/event-ranges-before.json)、[中断回放失败](evidence/review-3/interrupted-before.json)、[实际加载重试失败](evidence/review-3/load-retry-before.json) 均保留。原字段和失败断言未删除。

完整回归又检出 nullable 任务配置：先被统一校验拒绝，修正后暴露原启动器直接读取空 metadata.prompt 的第二处错误。[空值校验修前](evidence/review-3/nullable-before.json)、[实际原 UI 启动失败](evidence/review-3/tasks-null-before.json) 均保留。任务接受 null，模板仍要求对象；启动器安全读取可选任务提示词并回退模板提示词。位置：Browserapp/rebuild/agent-records.js:133 与 Browserapp/rebuild/compiler/patch-local.cjs:530。原 agent-tasks-ui-selftest 新增空值保持断言，真实创建→立即执行→预填模板提示词→两次模型请求通过，不修改原失败断言。

| 症状 | 根因 | 修法 | 文件:行 | 验证 |
| --- | --- | --- | --- | --- |
| 编辑 Skill 提示词后包、文件清单和 slug 丢失 | 原弹窗编辑仅传 metadata.prompt；后端按整份 metadata 覆盖 | 将 metadata 按字段合并并校验对象，保留包引用 | Browserapp/rebuild/agent-records.js:147 | 原编辑弹窗→保存→真实任务仍读取包正文 |
| 任务列表按 created_at 获取时被最近编辑顺序打乱 | 排序只区分 name 和 updatedAt，忽略原界面的 created_at | 显式映射创建/更新时间别名，拒绝未知字段，稳定 ID 次排序 | Browserapp/rebuild/agent-records.js:80 | Native 固定时间夹具验证创建顺序与更新时间不同仍正确 |
| 已读接口可能在 UI 产生 undefined 会话记录，旧轮次请求误清新未读 | 原 qf 需要会话 DTO；Native 返回 true，桥又把第二参数字符串展开丢掉 runId | 桥传 {id,runId}；Native 校验最新轮次并返回会话对象，完成/失败/取消后保存未读，列表按实际更新时间排 | Browserapp/rebuild/agent-conversations.js:59 | 旧/新轮次 Native 断言；真实后台会话刷新、已读和重命名操作 |
| 刷新聊天后文本/图片附件消失 | 原组件读 metadata.attachments，本地历史存在 attachments | 历史 DTO 映射为原组件契约，不改附件存储/授权边界 | Browserapp/rebuild/agent-conversations.js:13 | 原附件测试新增刷新和图片自然尺寸、两卡数量断言 |
| 长会话没有实际分页，首次 IPC 返回全部历史 | Native 忽略 limit/cursor，固定 hasMore=false | 按消息 ID 游标取最近窗口，校验数量和跨会话游标；追加消息不移动旧游标 | Browserapp/rebuild/agent-conversations.js:35 | 原界面每页 5 条；22 真实模型回合逐页加载全部 44 消息且不重复 |
| 模型/会话/已读/删除日志写盘失败后仍在内存呈现成功修改 | 先改共享对象再 await 文件写入，失败未恢复 | 单写入队列中生成独立快照；原子 rename 后在同一写入回合发布字段，清理临时文件 | Browserapp/rebuild/agent-service.js:138 | 六种操作注入保存失败；实际 rename 失败、并发配置合并和重启读盘 |
| 失败模板/Skill/MCP 修改能借另一次配置保存偷偷落盘 | 各实体虽局部回滚，未提交草稿已放进共享 data，被其他排队快照捕获 | 模板/任务/计数/目录置顶/Skill/MCP 同样只在成功落盘后发布；保留域内队列并共用写入队列 | Browserapp/rebuild/agent-store.js:4 | 真实文件门禁：配置成功、后续实体 rename 失败；核对加密磁盘与内存完全一致 |
| 不可用 Skill 任务失败后留下空会话；关闭期间内部 start 可晚发新运行 | 创建会话早于 Skill 可用性检查，内部 start 缺 closing 检查 | 先验证包，再创建会话；内部 start 同样拒绝关闭标记 | Browserapp/rebuild/agent-records.js:191 | 无包/已停用任务失败后会话数量 0；关闭标记下无消息和活动运行 |
| 已结束的长聊天重载后变成运行中，禁用会话菜单 | 每条原子事件 startSequence 恒为 1，原 Jl 连续区间校验拒绝历史终态 | 原子事件 startSequence=sequence；旧本地格式迁移为事件协议 2，修正会话及日志的三处事件数组 | Browserapp/rebuild/agent-events.js:3 | 修前事件范围失败记录；迁移实际加密落盘；原 UI 多轮刷新后可重命名/删除 |
| 异常退出后的历史仍显示运行中，检查点无法清楚呈现中断 | 只改 Native 状态 interrupted，没有原界面支持的终态事件 | 启动恢复补 run_cancelled/process_exit，保留检查点；DTO 映射 cancelled 并带 interrupted=true，不宣称成功 | Browserapp/rebuild/agent-events.js:24 | 模拟进程遗留运行数据、重新实例化、事件/日志终止及权限检查点保持 |
| 迁移写盘暂时失败后重连永久失败 | loadPromise 缓存拒绝，后续 info 始终读取失败 Promise | 加载失败释放 Promise 和未提交 data，后续重新读盘；失败不覆盖原文件 | Browserapp/rebuild/agent-service.js:91 | 实际 rename 首次失败、第二次 info 成功；失败后旧事件格式仍在磁盘 |
| 会话菜单键盘无法进入，Tab 过渡又可能使触发器被卸载 | 菜单仅由 hover/子触发器 focus 揭示；行缺焦点事件，直接 blur 清除会删掉即将获得焦点的子节点 | 行复用原 focus 回调；blur 仅在 relatedTarget 离开整行时清理，不改样式或 DOM 结构 | Browserapp/rebuild/compiler/patch-local.cjs:1469 | 真实已结束会话聚焦→Tab→Enter→原菜单与删除确认；原 RGB 对照另行重跑 |

## 前端独立构建修复

症状：干净仓库缺少 `/workspace/roxy-src` 时 `npm run rebuild:ui` 直接失败。根因：8 个编译/审计入口各自硬编码外部默认路径，build 还把无关主进程、Agent 和工具的全镜像数量作为构建前提。修法：仓库内保存实际必需的 1875 个原字节输入，所有入口共用解析和逐文件 SHA256 校验，保留失败预检、构建锁与原审计断言。位置：Browserapp/rebuild/compiler/source.cjs:1、build.cjs:27。10 项输入与失败路径检查已通过；独立检出及产物比较见 [构建报告](BUILD-REPRODUCIBILITY.md)。

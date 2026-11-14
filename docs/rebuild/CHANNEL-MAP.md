# Channel 与本地适配映射

原归档直接调用扫描为 275 处、144 个 channel 表达式，端点清单 332 个。完整原参数表达式与位置见 [CHANNEL-INVENTORY.json](CHANNEL-INVENTORY.json)。当前适配及未接调用的位置/参数由 AST 生成在 [ADAPTER-MAP.json](ADAPTER-MAP.json)。动态拼串仍不能视为穷尽扫描。

默认界面的 `rebuild:request(method,payload)` 只接受已登记主窗口/四种独立子窗的精确 index 文档，等待 startupReady。`ipcResult:1` 保留 code、stale 等错误字段；渲染端转为原组件的 `{code,data,msg}`。未知 method/channel 明确抛错；渲染桥使用原 Toast 显示“未执行”，不伪造成功。

| 能力 | 本地方法与契约 | 验证 |
| --- | --- | --- |
| 窗口 CRUD、回收站、分组与标签 | profiles:* → 原 BrowserEngine；id/rev 乐观版本、列表脱敏、编辑显式读取机密 | 服务回归及真实原 UI 增/启/停/改/删/恢复 |
| 批量创建与全表单 | profiles:create-batch/fromRoxy；逐窗指纹/代理/账号，1..100，整批校验 | 原后端逐窗值与失败原子性；全字段限制见 BLOCKERS |
| 搜索、排序、分页 | 原窗口查询方法 → 本地原后端快照筛选；queryKey/queryValue、项目/OS/内核/标签等，返回 rows/total | 21 条真实翻页、跳页和名称/备注搜索 |
| 代理 | proxies:list/read/create-many/update/delete/detect/refresh/extract/export/duplicates → 原 ProxyStore 与网络模块 | 原代理列表编辑与删除、本地重复检查；绑定/解除与检测结果写回有服务层回归 |
| 平台账号 | accounts:list/create/update/bind/delete + 原 AccountStore + 主进程 resolveInputs | 原列表/创建/编辑、绑定/解绑，稳定 ID，显式机密读取，写盘失败补偿 |
| 模板与文件交换 | templates:list/save/delete；transfer:export/import；版本1、20MiB、200窗口上限、新 ID | 原表单存模板、JSON 磁盘读写，跨独立目录导入代理与分组 |
| 内核 | app:getCoreList/ops.kernel* → 原内核管理器 | Chrome 157、Firefox 160 真实 PID；官方目录/下载/摘要校验 |
| Agent | agent:* → 本地 AgentService；OpenAI SSE/Ollama NDJSON；密钥加密 | 原聊天组件真实模型流，工具、取消、续跑、日志、计划任务 |
| Skill | agent:skills:* 与 read_skill/read_skill_file | 四包文本、ZIP 包边界和引用读取 |
| 同步与原弹窗 | syncControl:* → sync:* / 原 ops；ui:dialog:* → 登记窗口服务；实际 PID 文本、URL、布局、偏好与自有快捷键 | 真实双 Chrome 文本、标签恰好一次、活动页替换、边界；子窗尺寸/暗色/来源校验；颜色私有命令未支持 |
| TXT/XLSX 导入 | profiles:choose-import / analyse-import / import，5 MiB、1–200 条、逐行系统/版本、整批校验后写原后端 | 真实原上传、预览和创建，非法 JSON 数量不变 |
| 本地缓存 | profiles:clear-cache，partial/all；整批预检、原维护锁和路径边界 | 实际文件删除，保留 Cookie/登录数据；云端模式已删除 |
| 顶部定位 | host:network；初始只读本地网卡，probe=true 才用原后端探测 | 前端没有 fetch/WebSocket；不填固定公网地址 |
| 通知 | notifications:list/read，activity:append 保存本地记录 | 原组件弹层真实读取与已读保存 |
| 本地 API / 内置 MCP | api:get/set/status/check-port/mcp-config/reference；原 LocalApiServer 与 ApiKeyStore | 密钥/端口/启停/LAN 与真实 stdio 67 工具 |
| 外部 MCP 客户端 | agent:mcp:list/upsert/import/test/enable/disable/delete；stdio/Streamable HTTP，配置加密 | 真协议/session/认证/取消/分页失败/模型授权，原设置页增改删/暗色 |
| Agent 授权与重连 | conversation.approval.submit + activeEvents，approvalId/decisions/sequence | 允许/拒绝/完全访问与刷新、不重执行 |

领域错误保留 PROFILE_STALE_REV、PROFILE_NOT_FOUND、LOCAL_CHANNEL_UNIMPLEMENTED、CONTEXT_LIMIT；启动失败保留原后端错误，不能把失败变成成功状态。原 SDK HTTP 工厂与 /user_* 路径不在运行产物中。

## SDK DTO 方法

backend 空白表示经辅助函数、本地组装或特殊分支处理，完整实现位置仍可从行号检查；不是未实现标记。

| 方法 | 参数形状 | 直接后端调用 | renderer-bridge.js 行 |
| --- | --- | --- | --- |
| userAnalysisWindowInfoCreate | p | profiles:analyse-import | 193 |
| userImportWindowInfoV2Create | p | profiles:import | 194 |
| userGetWindowInfoListList | p = {} |  | 195 |
| userGetWindowInfoV2List | p | profiles:read | 301 |
| userGetWindowInfoList | p | profiles:read | 312 |
| userAddWindowInfoV2Create | p | profiles:create | 314 |
| userMdfWindowInfoSingleV2Create | p | profiles:update, profiles:patch | 315 |
| userDelWindowInfoBatchCreate | p | profiles:delete | 319 |
| userMdfWindowSyncV2Create | p | profiles:list | 320 |
| userMdfWindowDataBatchCreate | p | profiles:edit-data | 328 |
| userDelWindowInfoCreate | p | profiles:purge | 329 |
| userDelWindowInfoRecycleCreate | p | profiles:purge | 330 |
| userGetUaWebglV2List | p | fingerprint:preview | 331 |
| userGetDeviceNameV2List | p | fingerprint:preview | 332 |
| userGetMacAddrV2List | p | fingerprint:preview | 333 |
| userGetBrowserVersionInfoList |  | kernels:list | 334 |
| userGetWindowStatusInfoCreate | p | profiles:list | 338 |
| userRestoreWindowInfoCreate | p | profiles:restore | 340 |
| userCopyWindowInfoCreate | p | profiles:clone | 341 |
| userBatchWindowInfoV2Create | p | profiles:create-batch | 342 |
| userGetWindowSortNumList |  | profiles:list | 343 |
| userGetWindowFilterNameListList |  | filters:list | 346 |
| userUpdateWindowFilterNameCreate | p | filters:save | 347 |
| userAddWindowFilterNameCreate | p | filters:save | 348 |
| userDeleteWindowFilterNameCreate | p | filters:delete | 349 |
| userUpdateWindowFilterSortCreate | p | settings:set | 350 |
| userGetWindowTemplateListList |  | templates:list | 352 |
| userAddWindowTemplateInfoCreate | p | templates:save | 353 |
| userMdfWindowTemplateInfoCreate | p | templates:save | 354 |
| userDeleteWindowTemplateInfoCreate | p | templates:delete | 355 |
| userGetUserConfigList |  |  | 357 |
| userSetUserConfigCreate | p | settings:set | 358 |
| userGetUserApiList |  | api:get | 359 |
| userSetUserApiCreate | p | api:set | 360 |
| userChangeUsernameCreate | p | settings:set | 361 |
| userGetProjectInfoByWorkspaceList | p = {} | groups:list | 365 |
| userGetPluginListList | p | extensions:list | 369 |
| userFixedPluginToWindowCreate | p | extensions:pin | 370 |
| userUploadChromePluginsV2Create | p | extensions:store | 371 |
| userUploadPluginInfoCreate | p | extensions:finish | 372 |
| userAddPluginToWindowCreate | p | extensions:assign | 373 |
| userGetPluginInfoByIdList | p | extensions:read | 374 |
| userCheckAllPluginsVersionList | p | extensions:reload | 375 |
| userUpgradePluginsCreate | p | extensions:reload | 376 |
| userBatchDelPluginInfoCreate | p | extensions:remove | 377 |
| userGetTopProjectInfoList |  | groups:list | 378 |
| userAddProjectInfoCreate | p | groups:save | 379 |
| userMdfProjectInfoCreate | p | groups:save | 380 |
| userDelProjectInfoCreate | p | groups:delete | 381 |
| userMdfProjectSortCreate | p | groups:sort | 383 |
| userGetProxyListMergedList |  |  | 384 |
| userGetProxyAllCountriesList |  | proxies:list | 385 |
| userGetProxyProvidersTypeList |  |  | 393 |
| userGetProxyVendorListList |  | proxies:list | 394 |
| userGetProxyTableSortOrderList |  | settings:get | 400 |
| userSaveProxyTableSortOrderCreate | p | settings:set | 402 |
| userGetProxyModuleListList |  |  | 404 |
| userGetProxyModuleV2List |  |  | 405 |
| userGetProxyModuleList |  |  | 406 |
| userGetProxyDetailMergedList | p | proxies:read | 407 |
| userGetRandomAvailableProxyMergedList |  | proxies:list | 409 |
| userBatchCheckProxyImportCreate | p | proxies:duplicates | 415 |
| userMdfProxyBindWindowCreate | p | proxies:bind | 416 |
| userBatchMdfProxyModuleCheckCreate | p | proxies:save-results | 417 |
| userMdfWindowProxyCheckBatchCreate | p | profiles:proxy-results | 418 |
| userAddProxyModuleV2Create | p | proxies:create-many | 420 |
| userMdfProxyModuleCreate | p | proxies:update | 422 |
| userDelProxyModuleV2Create | p | proxies:delete | 433 |
| userMdfWindowInfoBatchV2Create | p | profiles:patch | 435 |
| userGetProjectListList |  | groups:list | 441 |
| userGetLabelInfoList |  | labels:list | 442 |
| userAddLabelInfoCreate | p | labels:save | 446 |
| userMdfLabelInfoCreate | p | labels:save | 447 |
| userDelLabelInfoCreate | p | labels:delete | 448 |
| userGetWindowPlatformAccountListList |  | profiles:list | 449 |
| userGetPlatformInfoList |  |  | 462 |
| userGetPlatformInfoV2List | p = {} | accounts:list | 476 |
| userAddPlatformInfoCreate | p | accounts:create | 477 |
| userAddPlatformInfoBatchCreate | p | accounts:create | 478 |
| userMdfPlatformInfoCreate | p | accounts:update | 482 |
| userMdfPlatformBindWindowCreate | p | accounts:bind | 483 |
| userDelPlatformInfoCreate | p | accounts:delete | 484 |
| userGetSearchEnginesList |  |  | 485 |
| userGetWindowTableSortOrderList |  | settings:get | 497 |
| userSaveWindowTableSortOrderCreate | p | settings:set | 499 |
| userCheckWindowTotalCountList |  |  | 501 |
| userGetQuickCreateTemplateList |  | settings:get | 502 |
| userAddQuickCreateTemplateCreate | p | settings:set | 504 |
| userMdfQuickCreateTemplateCreate | p | settings:set | 506 |

## send / invoke

| Channel | 参数 | 直接后端调用 | 行 |
| --- | --- | --- | --- |
| api:getStatus |  | api:status | 534 |
| util:checkPort | port | api:check-port | 535 |
| util:genApiKey |  | ops.rotateApiKey | 536 |
| browser:createDesktopShortcut | p | host:shortcut | 537 |
| browser:setAsDefaultBrowser | p | host:default-browser | 538 |
| util:getCommonRequestHeaders |  |  | 539 |
| extension:getSelectedExtensionInfo | kind | extensions:select | 540 |
| extension:stageLocal | p | extensions:stage | 541 |
| extension:getExtensionInfo | id | extensions:exists | 542 |
| extension:showExtensionDir | id | extensions:show | 543 |
| extension:download | rows | extensions:verify | 544 |
| extension:remove | ids | extensions:verify-removed | 546 |
| dialog:selectFileOrDirInfo |  | agent:files:choose | 547 |
| app:downloadLocalFile | payload | agent:files:export | 553 |
| syncControl:open |  | settings:get, sync:restore | 554 |
| syncControl:close |  | sync:shortcuts:clear | 558 |
| syncControl:start | ids | settings:get, sync:restore, ops.startSync | 562 |
| syncControl:stop |  | ops.stopSync | 568 |
| syncControl:pause |  | sync:shortcuts:clear, ops.stopSync | 573 |
| syncControl:resume |  | settings:get, sync:restore, ops.getSyncState, ops.startSync | 577 |
| syncControl:getSyncWindowCount |  | ops.getSyncState, profiles:list | 583 |
| syncControl:showAll |  | ops.getSyncState, ops.windowAction | 589 |
| syncControl:doLayout | p | sync:layout | 595 |
| syncControl:openPreferencesDialog | p | ui:dialog:open | 596 |
| syncControl:openBatchInputsDialog | p | ui:dialog:open | 598 |
| syncControl:openOpenSitesDialog |  | ui:dialog:open | 600 |
| syncControl:openSyncingWindowListDialog |  | ui:dialog:open | 602 |
| syncControl:closePreferencesDialog |  | ui:dialog:close | 604 |
| syncControl:closeBatchInputsDialog |  | ui:dialog:close | 605 |
| syncControl:closeOpenSitesDialog |  | ui:dialog:close | 606 |
| syncControl:closeSyncingWindowListDialog |  | ui:dialog:close | 607 |
| syncControl:resizePreferencesDialog | p | ui:dialog:resize | 608 |
| syncControl:resizeBatchInputsDialog | p | ui:dialog:resize | 609 |
| syncControl:getMainControlDirId |  | ops.getSyncState | 610 |
| syncControl:getMainControlBrowserSize |  | sync:master-bounds | 614 |
| syncControl:batchInputText | p | sync:batch-text | 615 |
| syncControl:openSites | p | sync:open-sites | 616 |
| syncControl:checkShortcutKeysIsOccupied | p | sync:shortcuts:check | 617 |
| syncControl:registerShortcut | p | sync:shortcuts:register | 619 |
| syncControl:changeSyncSettings | p | sync:settings | 636 |
| syncControl:getAllSyncingWindows |  | ops.getSyncState, profiles:list | 637 |
| app:getMacAddress |  | host:mac | 649 |
| proxy:detect | p | proxies:detect | 650 |
| proxy:detectNetwork |  | host:network | 651 |
| proxy:refreshUrl | url | proxies:refresh | 652 |
| proxy:extract | url | proxies:extract | 653 |
| proxy:export | p | proxies:export | 654 |
| util:removeProject |  |  | 656 |
| browser:batchRemove | ids | profiles:purge | 657 |
| browser:clearCache | p | profiles:clear-cache | 658 |
| browser:exportProfiles | payload | transfer:export | 659 |
| util:genRandomFingerprint | p, count | fingerprint:preview | 660 |
| util:callRandomFingerprintFunc | functions | fingerprint:preview | 662 |
| util:genRandomFonts |  | fingerprint:preview | 678 |
| app:isMainWindow |  |  | 680 |
| app:showCurrentWebviewWindow |  | ui:dialog:show | 681 |
| app:resizeWindow | p | ui:dialog:resize | 682 |
| app:getAppVersion |  | ops.getInfo | 683 |
| app:getSoftConfig |  | settings:get | 684 |
| app:saveSoftConfig | p | settings:set | 685 |
| app:getCoreList |  | kernels:list | 686 |
| app:setSystemTheme | p | settings:set | 704 |
| browser:getOpenedBrowser |  | profiles:list | 705 |
| browser:getOpenedBrowserMessage |  | profiles:list | 713 |
| browser:batchLaunch | ids |  | 715 |
| browser:startCookieRobot | payload | cookie-robot:start | 716 |
| browser:chunkBrowsersByScreen | ids | ops.windowAction | 718 |
| browser:openBatchLayout | p | ops.windowAction | 724 |
| browser:batchRelaunch | ids |  | 739 |
| browser:batchClose | ids | profiles:stop | 740 |
| browser:isProcessExists | ids | profiles:list | 742 |
| browser:open | p | profiles:start | 746 |
| browser:close | p | profiles:stop | 748 |
| syncControl:unifyTabs |  | ops.tabAction | 620 |
| syncControl:closeOtherTabs |  | ops.tabAction | 620 |
| syncControl:closeCurrentTab |  | ops.tabAction | 620 |
| syncControl:closeBlankTabs |  | ops.tabAction | 620 |

## 静态扫描未映射调用

当前表为空表示可达静态调用均有适配；不证明动态路径、参数组合和系统平台均已验收。

| 类型 | 名称 | 产物位置 |
| --- | --- | --- |

动态表达式 `X.value ? syncControl:getAllSyncingWindows : browser:getOpenedBrowser` 的两个分支均已映射。更复杂的动态路径仍需结合运行探针检查。

## 最终补齐的原生契约

- 原 `forbiddenPictureSize` KB → `advanced.imageMaxBytes`，显式 0 为全部禁图，正值按响应解码大小过滤。Chrome 使用原 Fetch owner；Firefox 使用临时响应流扩展，启动握手完成后才允许页面继续。Firefox 缓存暂时绕过，防止旧大图缓存漏检；请求保持原代理、Cookie 与请求链。
- `saveFlowMode` → `saveData`；`maxDownloadSpeed` → `downlinkMax`。显式网络指纹启用 Chromium 自带 `NetInfoDownlinkMax`，文档与 Worker 的真实 getter 均按配置返回最大值和连接类型；这是指纹信息，未冒充下载带宽限速。
- `syncControl:changeSyncSettings` → `sync:settings`。原颜色选择器实际修改主控浏览器；`sync:apply-color/reset-color` 用于主进程生命周期。先尝试私有命令，标准 Chrome 使用本地主题；主题状态文件版本 1，原主题/活动标签/异常重启恢复，失败回滚。
- `notifications:list/append/read` 绑定本地记录。`read({ids})` 仅标记指定项；省略 ids 表示全部已读。原通知 render 接入，团队通知代码已裁剪。
- `sync:shortcuts:check/register` 接真实 Electron globalShortcut，重复或系统占用拒绝，失败保留原绑定。真实 X11 按键及第二进程接管已验证。
- 巡检不是第二个指纹注入所有者：`fingerprintSessionStates` 发布当前自动附加状态；watch 对正在准备的目标延后，并在 await 后重新检查。目标仍须由原所有者实际校验，ready 目标的真实错误与已失败所有者仍返回错误。


## 第二轮契约补齐

新增 [后端契约审计](evidence/backend-contract-audit.json) 覆盖直接本地 RPC、ops、Agent namespace 和作用域内传递的客户端回调；不能再用原 SDK 的 0 未映射推断全部参数/返回值匹配。10 个动态转发位置仍单列，脚本沙箱的三个明确拒绝接口也单列，不计为已实现。

| 入口 | 参数 / 返回 / 失败契约 | 验收 |
| --- | --- | --- |
| userTemplates.uploadUserTemplateSkill | 原 UI `{file: File}` → `{filename,data:Base64}`，ZIP ≤16 MiB，展开 ≤64 MiB/1000 文件；返回 `{code:0,data:{fileId,ossUrl:"",sha512,filename,contentType,fileSize,packageSlug,packageName,packageDescription,skillMetadata,fileCount,files,skillMdPath}}`；ossUrl 为空兼容字段，本地不需要云地址；失败恢复旧包和元数据 | 原版弹窗真实文件输入、多引用文件、任务实际读取；覆盖保存故障 |
| userTemplates.topUserTemplate / untopUserTemplate、templates.topOfficialTemplate / untopOfficialTemplate | 支持原调用的 numeric ID；Native 统一 `{code,data}`，桥只对置顶方法向原调用方解包 `{id,isTopped,toppedAt}`；加密持久化，目录置顶按稳定 slug 保存 | 原更多菜单、重载、取消置顶、目录列表 |
| templates.getOfficialTemplate | `{templateIdOrSlug}` / `{id}` / `{templateId}`，返回原 `{code,data}`；不存在或已停用明确失败；列表第二参数 HTTP serializer 不进入 IPC | 真实 renderer→Native 调用及目录获取原回归 |
| userTemplates.deleteUserTemplate | 检查任务引用后删除模板记录；不先调用旧 deleteInstalledSkill、不删除共享 Skill 库 | 原确认框、任务引用拒绝且包仍存在 |
| skills:delete | 只允许本地自定义 Skill；正在运行 Agent/仍被模板引用/内置包拒绝；包目录改名、元数据持久化、删除备份；保存失败恢复原目录与集合，提交后清理错误明确标记 committed | Native 实际文件删除与注入写盘故障 |
| 原 Skill Token | target 使用 slug，对应 Native read_skill / read_skill_reference 的授权包解析；不再拼旧统一安装根路径 | 原“去对话运行”及真实模型请求 |
| groups:delete / labels:delete | 原版本化修改每批 ≤200，跨元数据失败补偿；并发无关字段保留，同关联冲突明确报错 | 201 窗口、第二批失败、并发备注/关联 |
| groups:sort / filters:list | 项目只重排所选位置；筛选器读取应用已保存 sort_data | Native 顺序断言 |
| Agent reconnect | 首次后台连接、显式重新握手、日志快照和活动回放全部成功才 connected/ready；四次并发请求合并；原 IPC listener 始终一个，回放/实时按运行序号去重 | 两种注入错误、真实 SSE 无重复事件 |


## 第三轮新增契约核对

原任务 `userTasks.createUserTask/updateUserTask.metadata` 支持 null（不指定并发），省略时保留原值，显式 null 清空；模板 metadata 仍需对象。原任务执行器读取覆盖提示词时允许空配置并回退模板提示词，见 agent-records.js:133 与 compiler/patch-local.cjs:530。

| 入口 | 对齐后的参数/返回/失败语义 | 证据 |
| --- | --- | --- |
| userTemplates.updateUserTemplate | 原编辑 Skill 只提交 metadata.prompt，必须保留此前包字段；metadata 必须为对象，显式同名字段可覆盖 | review-3/agent-contracts-ui.json 的原弹窗及实际任务 |
| userTasks.listUserTasks | sortBy=created_at / updated_at / name 正确映射；稳定 ID 次排序 | review-3/agent-contracts.json |
| markConversationRead(conversationId,runId) | 桥转 {id,runId}；返回会话 DTO；过时轮次返回最新未读状态而不清新消息 | Native 新旧轮次、原侧栏已读；原逆向 SQL 亦用 latest_run_id 条件 |
| conversationDetail(id,{limit,cursor}) | 消息 ID 游标、最近页，返回 conversation/messages/hasMore/nextCursor；原 UI limit=5，每次向上加载；追加消息不改变旧游标，坏游标拒绝 | 22 个真实 HTTP SSE 回合、44 条原消息节点及实际 cursor 参数 |
| 历史消息附件 | 返回 metadata.attachments，字段 fileId/fileName/mimeType/size/url/localUrl；仍由原 obui 加密附件协议服务 | 原附件测试刷新后 2 卡及真实图片加载 |
| conversationList / updateConversation / deleteConversation | 实际更新时间排序，原重命名/删除菜单真实持久化；删除写盘期间禁止同会话新启动；所有元数据先落盘后发布 | 真实 UI、写盘故障、删除/启动门禁 |
| Agent 事件 | 原子事件 startSequence=sequence；协议 2；旧本地协议 1 迁移会话/日志/日志消息内的事件数组 | 迁移 JSON 真加密读回，原历史解析器不再滞留 running |
| 重启中断回放 | Native interrupted 保留；原界面 DTO 为 cancelled + interrupted:true；事件补明确 process_exit 中断，不伪造成功，检查点/权限仍保留 | Native 重启夹具与真实历史 UI |
| Agent 数据提交 | config/conversations/log deletion/templates/tasks/recordIds/catalogTopped/skills/mcpServers 同一写入队列；未提交草稿不能被其他域快照捕获 | 真 rename 门禁/失败和磁盘-内存比较 |

静态审计本轮包含 11 个动态转发位置（新增已读方法转发分支），仍不把这些动态表达式算作穷尽证明。三个旧脚本沙箱入口依旧明确拒绝。

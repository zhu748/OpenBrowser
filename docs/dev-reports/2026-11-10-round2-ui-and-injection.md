# 第二轮：UI 状态、注入领域与引擎成员边界

本轮接续上一轮未提交工作树，保留其全部改动。目标是收拢 UI 持久化和状态合并，拆分大型注入源码，并使引擎成员组合中的覆盖错误在启动时明确失败。

## UI 状态和凭据

- 新增 `ui/ui-state-store.js`，通过明确回调读取状态和存储。日志与出口状态使用同一合并定时器；立即保存会取消待写任务；页面退出事件同步排空待写状态。
- 修复旧启动清理：此前首次 `save()` 位于 `const save` 初始化之前，ReferenceError 被捕获后，旧 localStorage 中的凭据未被立即清理。首次写入现在位于状态、缓存及配额告警变量初始化之后。
- 代理脱敏移入 `shared/proxy-redact.js`，UI 和后台直接共用实现，原 Node 入口保留兼容转发。UI 存储统一清除 Cookie、主账号/多账号密码与 TOTP，以及备用代理的 URI 凭据。
- 备用代理重载优先按相同行与端点恢复凭据；跨行恢复只接受唯一端点，避免同一代理服务器的不同账号被恢复成同一个账号。
- 引擎同步补齐多账号行的凭据恢复。只有非显式操作、传入账号凭据全部为空、行号与用户名一致时才恢复原值；明确的 replace/clear 保持用户请求。
- 配额降级复用已脱敏快照，不再再次规范化整组环境；修复精简快照只保留历史 `notes/tags`、遗漏规范字段 `note/tag` 的问题。
- `mergeExitState()` 只复制变化行。明确的 null 可以清除旧坐标，合法的零坐标仍被保留。无变化时数组和所有环境对象保持原引用。

## 注入代码分类

`injection-script.js` 保留配置计算、UA、字体载荷与缓存编排；`worker-injection.js` 保留 Worker 配置。运行代码由 `runtime-source.js` 按固定顺序拼接：

| 页面领域 | 职责 |
| --- | --- |
| bootstrap | 初始配置、稳定性辅助函数、原生方法桥接 |
| navigator | 身份、权限和基础浏览器接口 |
| timezone-audio | 时区及音频 |
| fonts | 字体枚举和度量保护 |
| screen | 屏幕、窗口和子窗口 |
| graphics | Canvas、WebGL、ClientRects |
| webrtc | WebRTC |
| media | 媒体设备、语音、电池、连接与蓝牙 |
| gpu-storage | WebGPU 和存储额度 |

Worker 分为 bootstrap、timezone、graphics、gpu-storage 四部分。片段仍处于原有 IIFE 的共享词法作用域中，不增加页面可见变量，不把相互依赖的片段当成独立脚本执行。

与本轮开始前的构建器完成 108 次输出比较，覆盖 Windows、macOS、Linux、Android、iOS，三种稳定性模式、字体开启/关闭、完整/临时注入和 Worker，并包含重复缓存路径；输出逐字节一致，字体桥接状态副作用也一致。

| 入口文件 | 本轮前 | 本轮后 |
| --- | ---: | ---: |
| `automation/fingerprint/injection-script.js` | 5,565 | 275 |
| `automation/fingerprint/worker-injection.js` | 1,592 | 75 |
| `renderer.js` | 4,945 | 4,829 |

这是职责迁移后的入口规模；运行片段仍在仓库中，最长片段 927 行。没有把迁移行数计为功能删除。

## 引擎组合

`engine/compose.js` 在安装前检查全部 12 组领域贡献，拒绝重复成员、继承成员覆盖和导出访问器。现有 85 个贡献成员保持原函数/常量身份及调用接口。只读 `BrowserEngine.methodOwners` 用于定位成员所属模块；现有共享 this 的架构仍保留，后续领域服务迁移可以据此定位边界。

## 验证与测量

- 新增 UI 状态存储与引擎成员组合自测；安全检查改为调用真实脱敏模块，避免截取 renderer 源码。
- UI 自测覆盖旧数据清理、后台保存合并、最新状态读取、退出排空、配额失败、观测回调失败、备用代理恢复以及 10,000 环境的对象引用保持。
- 多账号同步自测覆盖凭据保留、用户名重排隔离和明确清除。
- 聚合测试：130 个脚本中 128 个通过，2 个 macOS 专用脚本跳过，0 个失败。
- 最终 ESLint 无规则错误或警告，`git diff --check` 通过；收尾的 UI 状态、Worker 存储行为和成员组合定向检查也通过。

可重复的结构性测量命令：

```bash
cd Browserapp
node scripts/benchmark-ui-polling.js 9ae738a 10000
```

在无变化的 10,000 环境样本中，旧轮询替换了 10,000 个环境对象和列表数组，新轮询替换 0 个并保留数组。结果保存于 [轮询测量数据](2026-11-10-round2-ui-polling-benchmark.json)。这个测量统计对象引用替换，不代表总堆分配为零、真实桌面延迟改进比例或受支持的实际环境数量上限。

本轮未运行真实 Electron/浏览器、跨平台图形端到端测试及 Rust 构建测试。注入输出一致和 Node 检查通过不能替代真实内核验证。

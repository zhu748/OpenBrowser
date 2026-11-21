# OpenBrowser 界面重建

默认本地工作台已接 OpenBrowser 原后端。Linux 验收清单全部通过：56 项功能、15 项原生专项、真实 X11 全局按键、96 组明暗原 render 对照精确 0 差异。

[完整验收报告](REPORT.md) · [逐例截图画廊](evidence/visual-comparison.html) · [最新命令](evidence/phase4-command-results.json) · [当前代码证据核对](evidence/final-verification.json)

```bash
cd /workspace/OpenBrowser/Browserapp
npm ci
npm start
```

`npm run rebuild:ui` 从 `Browserapp/frontend/` 和本地桥接模块生成 `roxy-ui/`。`node rebuild/compiler/source-selftest.cjs` 在隔离目录重建并逐文件校验产物，也验证缓存复用和中断恢复。历史视觉对照所用的旧前端保存在 Git 历史中。详细命令见 [独立构建说明](BUILD-REPRODUCIBILITY.md) 和 [验收报告](REPORT.md)。

[缺陷与文件:行](BUGS-FOUND.md) · [Channel](CHANNEL-MAP.md) · [额外功能及理由](EXTRA-FEATURES.md) · [实施决定](DEVIATIONS.md) · [环境/兼容边界](BLOCKERS.md)。PHASE-2/PHASE-3 为历史阶段，以 REPORT 和最新 JSON 为准；历史失败不作为通过凭据。

[第二轮全面审查与修复](REVIEW-2.md)：54 项冻结功能回归及完整 96 组对照已重跑，包含新增原模板上传/聊天/删除和 Agent 重连故障验证。

[第三轮契约审查与修复](REVIEW-3.md)：新增 25 个 Native 场景及原界面端到端契约验证，完整 56 项冻结回归与 96 组对照重新通过。

当前优化增加了工作台后端测试门禁和独立的 Electron 异步回归：

```bash
cd Browserapp
npm run rebuild:ui
npm run selftest:all
node rebuild/optimization-ui-selftest.cjs
# 定向运行同一注册表中的后端回归
npm run selftest -- rebuild:optimization
npm run selftest -- rebuild:agent
npm run selftest -- rebuild:sync-service
```

环境列表在主进程筛选、排序和分页，只展开当前页；项目、标签和代理关联使用同一状态快照的索引。Agent 会话列表仅返回元数据，检查点绑定任务和轮次，取消信号覆盖 MCP 初始化与工具发现。编辑器要求提交读取时的版本，并明确区分未修改凭据与清空凭据。

`rebuild-local.json` 保留原文件名，但内容改为项目统一的凭据加密格式，覆盖窗口模板和快捷模板中的 Cookie、密码等字段。旧明文配置首次加载时原子迁移；解密或迁移失败会保留原文件并报错。API 启动和默认浏览器启动器共用兼容读取器。迁移后的文件不能直接交给旧版本读取，迁移、重启读取和损坏保护由 `optimization-selftest.cjs` 验证。更换 Agent 模型服务的提供商或地址源时，不会自动转发原服务保存的 API key。

上面的 56 项功能和 96 组图像对照属于历史验收。本轮新增门禁覆盖安全、数据保存、分页与异步行为，不将历史图像对照计作本轮重新执行。

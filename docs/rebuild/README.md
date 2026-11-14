# OpenBrowser 界面重建

默认本地工作台已接 OpenBrowser 原后端。Linux 验收清单全部通过：56 项功能、15 项原生专项、真实 X11 全局按键、96 组明暗原 render 对照精确 0 差异。

[完整验收报告](REPORT.md) · [逐例截图画廊](evidence/visual-comparison.html) · [最新命令](evidence/phase4-command-results.json) · [当前代码证据核对](evidence/final-verification.json)

```bash
cd /workspace/OpenBrowser/Browserapp
npm ci
npm start
```

已生成 roxy-ui 可直接运行。重建使用 npm run rebuild:ui，需要 /workspace/roxy-src 的完整五卷镜像。详细复跑命令与 X11 依赖见报告。

[缺陷与文件:行](BUGS-FOUND.md) · [Channel](CHANNEL-MAP.md) · [额外功能及理由](EXTRA-FEATURES.md) · [实施决定](DEVIATIONS.md) · [环境/兼容边界](BLOCKERS.md)。PHASE-2/PHASE-3 为历史阶段，以 REPORT 和最新 JSON 为准；历史失败不作为通过凭据。

[第二轮全面审查与修复](REVIEW-2.md)：54 项冻结功能回归及完整 96 组对照已重跑，包含新增原模板上传/聊天/删除和 Agent 重连故障验证。

[第三轮契约审查与修复](REVIEW-3.md)：新增 25 个 Native 场景及原界面端到端契约验证，完整 56 项冻结回归与 96 组对照重新通过。

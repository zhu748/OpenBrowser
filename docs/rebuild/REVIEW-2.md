# 第二轮全面审查与修复

本文件保留第二轮历史结论；当前验收见 [REPORT.md](REPORT.md)。当时的 [完整命令](evidence/review-2-final/commands.json) 与 [核对记录](evidence/review-2-final/final-verification.json) 已独立留档；其他公共截图/专项记录随最新回归更新。

结论：本轮列明的 Linux 验收全部通过；此前实现并非没有缺口，本轮已复现、修复并补回归。没有声称全部平台、无限状态或旧脚本环境“完美兼容”。

## 修复与证据

| 发现 | 修复与实际验收 |
| --- | --- |
| 主控配色后活动标签偶发隐藏 | 原断言在整轮真实 X11 回归中失败；新增关闭/激活及可见状态完成屏障，再以三次陈旧 hidden 响应检查等待；[修前](evidence/review-2/master-color-visual-before.json)、[修后](evidence/master-color-visual-selftest.json) |
| ID 被删除项复用 | 加密/本地元数据持久化高水位；重启、旧日志引用迁移及保存故障；[13 场景](evidence/review-2/consistency.json)、[修前失败](evidence/review-2/consistency-before.json) |
| 项目/标签删除只回滚一边 | 每批 200 个原生版本化修改，跨存储补偿只恢复关联字段；201 个窗口、第二批故障、并发备注/关联冲突均验证 |
| 排序保存但读取不一致 | 项目只替换所选位置；筛选器读取已保存的排序、重命名同步排序项 |
| Agent 重连没有真正重试 | 重新握手/日志同步/活动回放；部分初始化不得标记 ready；四次并发合并；真实模型事件不重复；[修后](evidence/review-2/agent-reconnect.json)、[修前](evidence/review-2/agent-reconnect-before.json) |
| 原创建模板缺少 Skill 上传 | 原文件输入和原弹窗 → 有界 ZIP/多文件保存 → 原模板卡 → 实际 Agent 任务/SSE；覆盖保存失败恢复原包 |
| 模板置顶/详情参数和返回不匹配 | scalar ID、templateIdOrSlug、原列表 serializer、返回解包与重载持久化；[真实 UI 全流程](evidence/review-2/template-ui.json) |
| Skill 聊天 Token 变空/错误路径 | 生成和解析校验同时改用本地 slug；原“去对话运行”真实发送及第二次模型请求；[修前](evidence/review-2/template-chat-before.json) |
| 删除模板先删共享 Skill | 先检查模板引用并持久化；保留共享库；显式删除库时校验引用、元数据与目录共同补偿；原确认框和磁盘删除验证 |
| 商业客服二维码被遗漏 | 删除个人模板咨询入口、商城横幅、弹窗、样式、两张二维码；[发现时 hash](evidence/review-2/commerce-before.json)、[新 grep](evidence/commerce-grep.txt)、[组件名称关注清单](evidence/review-2/component-audit.json) |
| 静态审计漏直接 RPC/Agent/ops/回调 | 新作用域感知 AST 与精确 Native 分支/主进程 handler；[完整记录](evidence/backend-contract-audit.json)。305 使用点/169 种静态调用，10 动态转发单列；三个旧脚本沙箱接口明确拒绝，不算接通 |

[完整 bug 根因/修法/文件:行](BUGS-FOUND.md) · [契约](CHANNEL-MAP.md) · [自主决定](DEVIATIONS.md) · [额外能力](EXTRA-FEATURES.md)。

## 截图

| 原组件状态 | 本轮真实截图 |
| --- | --- |
| 原版上传 Skill 弹窗 | [浅色](evidence/review-2/skill-upload-light.png) |
| 原更多菜单置顶持久化 | [浅色](evidence/review-2/template-pin-light.png) |
| 已保存 Skill 模板 | [深色](evidence/review-2/skill-template-dark.png) |
| 48 状态 / 明暗 96 组逐像素对照 | [完整画廊](evidence/visual-comparison.html)、[0 容差逐例记录](evidence/visual-parity-selftest.json) |

## 通过范围

54 项完整命令及来源 SHA256、15 项原生专项、真实 X11 全局快捷键，以及 96 组原 render 对照均重新执行。当前源码、构建产物、Native 文件和文档链接由最终核对再检查。所有 UI 记录未出现外部请求。发现二维码时主动停止的整轮回归以失败留档，没有沿用其通过结论。没有删除或放宽失败断言。

[完整命令与日志](evidence/review-2-final/commands.json) · [原生](evidence/native-regression-selftest.json) · [桌面](evidence/desktop-shortcuts-selftest.json) · [最终核对](evidence/review-2-final/final-verification.json)。

Windows/macOS、人工系统选择、实际扬声器、物理多屏和任意字段/动效组合未测试。三平台安装包未生成。旧任意脚本沙箱不迁移，两个 .jsc 仍标明“这块没读懂”。这些边界没有计入通过数，详见 [BLOCKERS.md](BLOCKERS.md)。

本轮冻结运行摘要：`bddd4a08f3278d1f0281e02d506e20604292702c9e0c9b7982bbb6c441f646bb`，2373 个运行文件、1556 个 UI 文件、338 个 Native 文件；原 render 413 个 / 152 个模块；保留原样式 20504 条声明均匹配。

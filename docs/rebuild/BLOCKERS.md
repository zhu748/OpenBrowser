# 最终验收范围与条件

第三轮已修复 Skill 编辑、任务空配置、排序、已读、历史分页/附件、回放事件范围、异常退出恢复及隔离落盘缺口。当前冻结的 2376 个运行文件下，56 项功能回归、15 项原生专项、真实 X11 按键和 96 组明暗对照均通过；本轮列明清单没有未关闭的失败，也没有待用户授权事项。下列环境/兼容边界仍不能改写为已实测。

| 原卡点 | 最终结果 / 证据 |
| --- | --- |
| 标准 Chrome 主控颜色 | 已补真实本地主题回退；原主题/同窗口活动标签/异常重启恢复、原包清理后快照二次配色均通过。见 master-color-selftest.json 与 master-color-visual-selftest.json。 |
| Firefox 图片阈值 | 已补正式响应流过滤；已知/未知/gzip/重定向、旧缓存、Cookie、停止与端口/缓冲清理通过。见 firefox-image-size-selftest.json。 |
| 最大网络速率字段 | 显式配置启用 Chromium 自带 NetInfoDownlinkMax，实际文档和 Worker getter 返回配置；不是流量限速。见 network-form-selftest.json。 |
| 原顶部弹层 | 已去除自写 Header，原结构接本地内核/通知；完整明暗对照和点击/已读通过。 |
| 全局按键仅模拟回调 | X11 XTEST 实际按键打开原设置窗，第二个实际进程检测冲突、退出后接管并再次触发，关闭释放。见 desktop-shortcuts-selftest.json。 |
| 新页导航使浏览器被误关闭 | 自动附加与巡检共享实时所有权；16 项重注入断言保留真实失败，实际两页立即导航与浏览器工具回归通过。 |

仍需明确的边界：

- 原渲染对照是 48 个已列明状态 × 明暗主题，包含完整工作台/顶部、焦点、折叠、125% 应用缩放和原独立同步弹窗；没有声称穷尽任意字段组合、每个动画时刻或全部系统 DPI/物理多屏。
- 本地 LLM 配置、Skill 文件、窗口模板文件目录和磁盘交换属于新增内容，使用原组件和主题；三个云/商业外壳按要求删除/本地化。它们未冒充原云页面的独立像素基线。
- 当前仅实测 Linux / Electron / Chrome 157 / Firefox 160。Windows/macOS、人工系统文件选择和扬声器输出未实测；文件测试确实执行选择结果后的磁盘读写。真实复制运行树启动已验收，未生成三平台安装包。
- 模型测试使用真实本地 HTTP SSE/NDJSON 夹具，未冒充公网付费模型或实际安装的 Ollama 模型。附件支持已列明格式与容量。
- 四个 Skill 为知识/引用迁移。原 /api/scripts 沙箱、旧 SDK/自动化扩展/启动页已评估而未迁移；这些不是兼容承诺。agent-worker.jsc、roxybrowser-openapi-mcp.jsc：**这块没读懂**，未执行或假称兼容。
- 一个旧内核模板自测依赖仓库外未提供的 macOS 私有内核 init_template.json/init_clean_standalone.json，原失败日志保留在 work/rebuild/fp-invariants-current.log；它不计入本次通过的 15 项原生专项。没有伪造缺失文件或把跳过记为通过。

商业/端点/前端传输/资源与绑定审计通过。`pay-wall`、`last-pay-modal`、`/user_*` 黑名单在明示运行范围内 0 命中。首次功能失败、差分、探针条件错误和混合版本运行均留档；最新结论见 [REPORT.md](REPORT.md) 和 [final-verification.json](evidence/final-verification.json)。

## 已关闭：外部前端构建输入依赖

默认构建、静态/样式审计及视觉基线不再依赖仓库外目录。全新 Git 检出、独立 npm 缓存、删除旧产物后的构建通过，1556 文件逐字节一致；10 项负例与输入完整性检查通过。没有因此宣称重跑整套 UI 回归或验证 Windows 真机，详见 [独立构建记录](BUILD-REPRODUCIBILITY.md)。

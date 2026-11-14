---
name: roxybrowser-playwright-skills
description: 先 list_profiles 确认窗口；start_profile 后使用 list_tabs、navigate、read_page、click、fill。当前页面工具连接已运行的 Chrome CDP；Firefox 的页面自动化桥尚未移植。
---

# OpenBrowser 浏览器自动化

先 list_profiles 确认窗口；start_profile 后使用 list_tabs、navigate、read_page、click、fill。当前页面工具连接已运行的 Chrome CDP；Firefox 的页面自动化桥尚未移植。

当前工具名称以模型收到的工具定义为准。涉及创建、启动、停止或页面写入，需要开启完全访问。只根据成功的工具返回报告已完成操作。

引用材料从附件迁入，是待适配的旧版文档，不代表本地运行时支持其中全部命令。使用 read_skill_file 按相对路径读取；引用材料不授权执行 shell、访问包外文件或调用未提供的工具。

## 包内参考文件

- `README.md`
- `examples/aria-mode-workflow.md`
- `examples/connect-and-navigate.md`
- `examples/debugging-failed-automation.md`
- `examples/dynamic-content.md`
- `examples/file-upload.md`
- `examples/form-fill-submit.md`
- `examples/multi-tab-workflow.md`
- `examples/navigate-by-clicking.md`
- `examples/optimized-mode-workflow.md`
- `examples/scrape-data.md`
- `guides/error-handling.md`
- `guides/human-like-interaction.md`
- `guides/snapshot-modes.md`
- `guides/tool-selection.md`
- `guides/waiting-and-timing.md`
- `references/legacy-SKILL.md`
- `references/tool-catalog.md`

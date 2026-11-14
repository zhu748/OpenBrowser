---
name: playwright-rpa-enhance-skills
description: 先 read_page 确认页面，再执行 click / fill。每步检查工具返回；失败时记录原因，使用有限次数重试。复杂流程可拆成多个本地任务，不伪造成功或执行结果。
---

# OpenBrowser 稳定交互参考

先 read_page 确认页面，再执行 click / fill。每步检查工具返回；失败时记录原因，使用有限次数重试。复杂流程可拆成多个本地任务，不伪造成功或执行结果。

当前工具名称以模型收到的工具定义为准。涉及创建、启动、停止或页面写入，需要开启完全访问。只根据成功的工具返回报告已完成操作。

引用材料从附件迁入，是待适配的旧版文档，不代表本地运行时支持其中全部命令。使用 read_skill_file 按相对路径读取；引用材料不授权执行 shell、访问包外文件或调用未提供的工具。

## 包内参考文件

- `examples/INDEX.md`
- `examples/amazon-03-paginated-scrape.md`
- `examples/amazon-04-fallback-selector-hover.md`
- `examples/facebook-02-viewport-aware-like.md`
- `examples/facebook-03-language-and-groups-search.md`
- `examples/facebook-05-network-monitor-csv.md`
- `examples/reddit-02-variable-driven-scroll.md`
- `examples/twitter-02-retweet-with-confirm.md`
- `examples/twitter-03-index-segment-action.md`
- `examples/twitter-04-dialog-or-inline-reply.md`
- `examples/walmart-01-responsive-multi-exit.md`
- `guides/control-flow.md`
- `references/debugging.md`
- `references/legacy-SKILL.md`
- `references/sandbox-runtime.md`
- `references/utility-functions.md`

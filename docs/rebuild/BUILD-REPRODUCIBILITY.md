# 前端独立构建

```bash
git clone https://github.com/zhu748/OpenBrowser.git
cd OpenBrowser/Browserapp
npm ci
npm run rebuild:ui
node rebuild/compiler/source-selftest.cjs
```

不需要原始分卷、`/workspace/roxy-src` 或 `ROXY_SOURCE`。只构建前端、不启动 Electron 时，可在安装依赖前设置 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`，省略与前端构建无关的 Electron 二进制下载；正常运行应用仍需要安装 Electron。

原构建在 8 个编译/审计入口默认读取仓库外的固定路径，并要求整份 2063 文件镜像。缺少目录时在预检阶段失败。[修前复现](evidence/build-source-before.json)。

现在默认从当前检出的 `Browserapp/rebuild/compiler/vendor/roxy-ui` 读取必需输入：web 1874 文件和一份仅供静态端点枚举的主进程清单，共 1875 文件。没有引入旧主进程或 Agent 可执行运行时；`rebuild/compiler` 整体继续排除于生产资源树。

所有入口共用 `source.cjs`；逐文件大小、SHA256、文件列表与总摘要在 `source-manifest.json`。丢失、同长度篡改、未知 web 文件和符号链接均拒绝；显式设置的错误覆盖路径不会静默回退。失败预检保留当前运行目录并释放构建锁。Git attributes 固定原始输入字节和构建脚本换行，避免 checkout 的换行转换破坏校验。

本次独立构建验证已通过：

1. 从修复后的 Git 提交克隆全新目录，启用 `core.autocrlf=true`，验证 Git 换行保护。
2. 不设置 `ROXY_SOURCE`；默认 `/workspace/roxy-src` 目录不存在。
3. 使用空 `node_modules` 与独立 npm 缓存执行 `npm ci`，仅省略 Electron 二进制下载。
4. 删除新检出中的 `Browserapp/roxy-ui`，执行 `npm run rebuild:ui`，确保不是复用已有产物。
5. 逐文件比较：1556 文件全部一致，缺失、额外和内容变化均为 0。
6. 新检出目录的静态审计、原样式来源审计及视觉基线生成均通过，413 个独立原 render / 152 个模块保持可生成。
7. 10 项输入与失败路径专项、仓库全量 lint 通过，当前运行摘要仍为原验收的 `458ef29a988f22a20899fbe795cef60c2a78c47735f55947e8369a37b0b36d35`。

[独立构建记录与全部命令](evidence/build-reproducibility.json) · [输入负例及锁清理](evidence/build-source-selftest.json) · [输入摘要](evidence/build-source-check.json)。

输入摘要：`5eddfd002608654baa7f9a7df2048040f4ec915e1c6074cdda56f191f5867eb2`，1875 文件。前端输出摘要：`c8bab80626c572ced9360b1a2f9ef9dfc383b51ecebd58cfd2a6067bcf01c8fa`，1556 文件。

原 56 项功能回归和 96 组图像对照没有在本次重新执行。本次未改生产代码或样式，独立构建生成文件与原验收版本逐字节相同；以此保留既有行为证据，另行验证构建输入、安装和生成过程。此次新检出环境为 Linux / Node 24.22.1 / npm 11.9.0；换行转换验证不等于宣称已在 Windows 真机重建。

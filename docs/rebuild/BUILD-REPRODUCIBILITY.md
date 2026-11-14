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

第一轮已在默认外部目录不存在且未设置覆盖变量时成功构建，1556 个产物文件与此前已验收版本逐字节相同；新检出目录验证结果将在完成后补入本页。原 56 项功能回归和 96 组图像对照不会冒充本次重新执行；本次以构建输入负例、独立构建和产物逐字节比较验证此修改。

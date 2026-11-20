# 前端独立构建

```bash
git clone https://github.com/zhu748/OpenBrowser.git
cd OpenBrowser/Browserapp
npm ci
npm run rebuild:ui
node rebuild/compiler/source-selftest.cjs
```

默认构建读取仓库里的前端源码、仍在使用的预编译模块和静态资源，生成 `Browserapp/roxy-ui/`。只构建前端时，可以在安装依赖前设置 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`。

## 默认工作台源码

- `Browserapp/frontend/src/workbench/` 保存默认工作台的 Vue 组件、业务逻辑、样式、主题、语言包和 SVG 图标源码。
- `Browserapp/frontend/workbench/` 保存入口 HTML、Vue、PrimeVue、CodeMirror 等第三方运行库及图片和字体。直接复制的脚本和样式须在 `workbench-vendor-modules.json` 中明确登记。
- `Browserapp/frontend/workbench-entries.json` 记录源码到运行时路径的映射。兼容模块继续提供原有导出名。默认入口 `npm start` 先构建，再启动 Electron。

默认构建在隔离目录运行模块链接、资源和 IPC 契约审计，通过后才替换运行目录。`node rebuild/compiler/source-selftest.cjs` 在临时目录移除原始归档、旧产物和补丁脚本后重新生成完整工作台，并逐文件比较 SHA256。发布流水线始终从这个入口构建，安装包只收录运行目录。

`workbench-source-provenance.json` 从默认入口追踪模块引用和已加载的样式表。构建会拒绝未登记的复制脚本与样式，以及找不到源码来源的已加载样式。`npm run selftest:rebuild:full-workbench -- /path/to/archive/roxy-ui` 分别从完整旧目录和当前构建加载页面，并对照截图、错误状态和动画帧。

## 独立源码工作台

源码位于 `Browserapp/frontend/`。在 `Browserapp` 运行 `npm run start:source` 会构建至 `frontend/dist/` 并启动 Electron。`npm run build:renderer` 只构建，`npm run typecheck:renderer` 检查类型。完整的 `npm run rebuild:ui` 会用同一个入口生成 `roxy-ui/source-frontend/` 供打包使用。发布目录可通过环境变量 `OPENBROWSER_RENDERER=source` 启动该界面。

源码工作台包含窗口列表与分页搜索、启动和停止、单个与批量创建、TXT/XLSX 导入、回收站、模板和内核管理。窗口和模板表单可以维护项目、操作系统、浏览器内核版本、启动网址、窗口尺寸和常用启动偏好。它沿用已有 preload、IPC 与本地数据。其余高级设置、Agent 和窗口同步可通过默认启动入口使用。

源码代理库支持查询、协议过滤、新增与批量新增、编辑、检测、导出和删除。窗口与模板表单可使用直连或选择代理库记录。关联中的代理仍由后端保护。普通代理列表只传递简要信息，打开编辑表单时才读取认证字段。

## 管理页面源码

`frontend/src/management/` 维护独立源码版的项目、平台账号、扩展和 API/MCP 设置。`/projects/list`、`/account/list`、`/extensions` 和 `/api-keys` 默认使用与历史本地工作台相同的界面，添加 `?renderer=source` 可进入源码预览。两个入口共用本地 IPC 和数据。

- 项目页支持新建、改名、排序、固定、删除和查看项目窗口。项目内创建窗口会预选对应项目，删除项目后现有窗口移至默认项目。
- 平台账号支持单条录入、粘贴、TXT/XLSX 导入、Excel 模板、编辑、搜索、关联窗口及导出。账号编辑默认保留已保存的凭据，Excel 导出默认只含摘要。
- 已安装扩展列表显示扩展来源、项目和更新状态，支持按名称或说明搜索、分页和跳转。行内操作支持工具栏固定、检查本地清单、更新和分配。勾选后可批量检查更新和移除。统一的上传弹窗支持本地目录和 ZIP/CRX，Chrome 应用商店扩展按网址添加。空项目也可保存安装规则。
- API/MCP 页使用现有主进程服务，支持启停、端口校验、局域网绑定、密钥轮换和本地文档。端口与密钥用真实本地 HTTP 请求验收。

在 `Browserapp` 执行 `npm run rebuild:ui` 后，可运行 `node rebuild/source-management-ui-selftest.cjs`。执行 `npm run build:renderer` 后，再用 `node rebuild/source-management-ui-selftest.cjs --source` 验证独立源码版。两种模式都保存实际 Electron 截图和检查结果。

完成这两种构建后，`npm run selftest:rebuild:source-visual` 比较独立工作台的开发版和打包版截图。测试覆盖扩展中心、窗口、导入、回收站、模板、内核、代理、项目、账号、API 和本地文档。扩展中心另外保存工作台源码预览的截图，并核对图标尺寸、点击区域、表格行高、分页栏和弹窗入场动画。测试锁定弹窗在 75 毫秒的画面，并验证减少动态效果和窄窗口的表格滚动。截图、差异图和报告保存在 `work/rebuild/evidence/source-workbench-visual/`。

窗口同步的选窗、工具栏、列表和弹窗源码位于 `frontend/src/workbench/`。默认入口使用已有同步服务和原生弹窗。真实 Chrome 回归覆盖主控选择、输入镜像、暂停、恢复与停止。

## 窗口文件导入

窗口列表的「导入窗口」通过系统文件选择器读取 UTF-8 TXT 或 XLSX，先验证并预览，再确认写入。每次支持 1–200 条记录，选取文件不得超过 5 MiB。TXT 使用 `windowName=名称`、`os=Linux` 等字段，窗口之间用独立一行 `####` 分隔。XLSX 支持旧模板的说明行，也支持带 `windowName` 和 `os` 列名的普通工作表。用于导入的单元格填写实际值，公式会报告行号。

默认工作台也会在 `/templates` 和 `/kernels` 加载源码页。访问 `/templates?renderer=legacy` 或 `/kernels?renderer=legacy` 可在默认工作台中切回相应旧页面。模块加载失败时，默认工作台会回退并记录原因。

`node rebuild/compiler/source-selftest.cjs` 会在没有旧前端和归档输入的临时目录独立构建，并和打包产物逐文件对比。`node rebuild/source-workbench-ui-selftest.cjs` 验证真实 Electron 的操作流程。`node rebuild/packaging-selftest.cjs` 还会在只保留源码工作台产物的生产目录里运行同一套流程。

运行 `npm run build:renderer` 和 `npm run rebuild:ui` 后，可用 `node rebuild/source-proxy-visual-selftest.cjs` 做源码代理库逐像素对照。参照图来自独立构建，对照图来自仅含源码前端的生产目录。场景包括亮暗主题、列表与空态、表单入场中间帧，以及系统开启减少动态效果时的表单。脚本使用 Python 3 和 Pillow，图片、差异图与统计写入 `work/rebuild/evidence/source-proxy-visual/`。

## 历史视觉对照

旧版完整前端保存在 Git 提交 `96f3d557c91d9c1c9f3bac52119749c488d28d62`。默认构建只使用当前源码。完整目录对照测试分别加载两套前端，在同一 Electron 和本地数据上比较截图、交互和动画。运行需安装 Python 3 与 Pillow。以下命令在 `Browserapp` 中执行。

```bash
baseline=$(mktemp -d)
git -C .. archive 96f3d557c91d9c1c9f3bac52119749c488d28d62 Browserapp/roxy-ui | tar -x -C "$baseline"
npm run rebuild:ui
npm run selftest:rebuild:full-workbench -- "$baseline/Browserapp/roxy-ui"
```

报告和截图生成到 `work/rebuild/evidence/full-workbench-parity/`。测试通过入口文件哈希确认实际加载的是两个不同的构建目录。此前的归档裁剪与样式来源记录仍可在 Git 历史和[历史验收报告](REPORT.md)查阅。

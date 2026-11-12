# 本地构建与原生测试环境

适用于开发和回归检查。Node 依赖、Rust 工具链及浏览器二进制相互独立；安装 npm 包不等于具备浏览器测试条件。

## 环境检查

在 `Browserapp` 目录运行：

```sh
npm run check:environment
npm run check:environment -- --probe-native
```

检查脚本输出 JSON：Node 最低版本、Cargo/rustc/rustfmt/Clippy、Electron Node 模式、浏览器版本、临时目录写入、TCP / Unix socket 以及可选的 Chromium 启动结果。`--strict` 会执行 Chromium 启动检查，并在无界面测试环境条件不足时返回 2。

`toolsReady` 表示工具和基本 I/O 条件可用，`headlessEnvironmentReady` 还要求 Chromium 实际启动成功。`desktopPrerequisitesReady` 单独检查桌面基础条件；这些字段不代替项目原生门禁或完整桌面验收。

## 本次工作区的已安装工具

2026-11-12 补齐的工具放在仓库外的工作区目录，未修改系统安装或用户启动配置：

| 工具 | 路径或版本 |
| --- | --- |
| Node | 24.22.1，现有运行时 |
| Electron | 43.8.8，`Browserapp/node_modules/electron/dist/electron` |
| Rust / Cargo | 1.99.1，工作区 `toolchains/cargo/bin/` |
| rustfmt / Clippy | 与该工具链一同安装 |
| Firefox | 160.0，工作区 `toolchains/firefox/firefox` |
| Chrome for Testing | 157.0.8103.78，工作区 `toolchains/chrome-linux64/chrome` |
| 系统 Chromium | 156.0.8078.79，`/usr/bin/chromium`；可用于独立原生门禁，应用的自定义内核入口按产品策略拒绝系统浏览器路径 |
| Xvfb | 21.1.16，工作区 `toolchains/display/usr/bin/Xvfb`；Debian 官方包在用户目录解包 |

本工作区可通过下面的 shell 配置复用这些工具；换机器后应将 `OPENBROWSER_TOOLCHAIN_ROOT` 改成实际安装位置：

```sh
export OPENBROWSER_TOOLCHAIN_ROOT=/workspace/work/openbrowser-opt/toolchains
export CARGO_HOME="$OPENBROWSER_TOOLCHAIN_ROOT/cargo"
export RUSTUP_HOME="$OPENBROWSER_TOOLCHAIN_ROOT/rustup"
export PATH="$CARGO_HOME/bin:$PATH"
export CARGO_TARGET_DIR=/workspace/work/openbrowser-opt/cargo-target
export TMPDIR=/workspace/work/openbrowser-opt/tmp
export OPENBROWSER_FIREFOX_BINARY="$OPENBROWSER_TOOLCHAIN_ROOT/firefox/firefox"
export OPENBROWSER_CHROMIUM_BINARY="$OPENBROWSER_TOOLCHAIN_ROOT/chrome-linux64/chrome"
export OPENBROWSER_NATIVE_NO_SANDBOX=1
export OPENBROWSER_RUST_CORE_BINARY="$PWD/Browserapp/rust-core/openbrowser-core"
export OPENBROWSER_MASTER_KEY_FILE=/workspace/work/openbrowser-opt/master.key
export OPENBROWSER_FP_LOG=/workspace/work/openbrowser-opt/logs/fingerprint.log
```

这里的 `OPENBROWSER_NATIVE_NO_SANDBOX=1` 是当前受限测试容器的原生门禁选项，测试仅访问回环页面；不应复制为桌面浏览器的生产默认配置。其他开发机器可在保留浏览器自身 sandbox 的条件下运行。

也可以直接检查指定的工具目录，不修改当前 shell：

```sh
npm run check:environment -- --toolchain-root /workspace/work/openbrowser-opt/toolchains --strict
```

该参数会为检查进程配置 Cargo/rustup 和 Firefox 路径；Chromium 仍使用 `OPENBROWSER_CHROMIUM_BINARY`，或默认的 `chromium` 命令。

## 重新安装的官方来源

Rust 使用 [官方 rustup 安装说明](https://rust-lang.org/tools/install/)；将 `CARGO_HOME`、`RUSTUP_HOME` 指向可写目录，以 `--profile minimal --component rustfmt --component clippy --no-modify-path` 安装所需组件。本次安装器及 stable 清单保留在工作区 `toolchains/`。

Firefox 使用 [Mozilla 下载入口](https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US)。本次下载后的版本经二进制 `--version` 和项目真实门禁确认。

Chrome for Testing 来自 [官方 JSON 清单](https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json) 中 Stable / linux64 的 `chrome` 项。下载清单与压缩包保留在工作区 `toolchains/`。Electron 使用锁定 npm 包内的安装脚本及校验和下载；需要代理的 Node 下载可单次设置 `NODE_USE_ENV_PROXY=1`，保留宿主代理与 CA 配置。

虚拟显示可使用系统 `xvfb-run -a`，或运行用户目录中的 Xvfb（当前会话已运行 `:99`）：

```sh
LD_LIBRARY_PATH="$OPENBROWSER_TOOLCHAIN_ROOT/display/usr/lib/x86_64-linux-gnu" \
  "$OPENBROWSER_TOOLCHAIN_ROOT/display/usr/bin/Xvfb" :99 -screen 0 1920x1080x24 -nolisten tcp -ac
```

在另一个 shell 设置 `DISPLAY=:99`。自定义字体/窗口/安装器的 Windows/macOS 专有行为不能用 Linux Xvfb 验收。

## 验证命令

完成上面的环境配置后，在仓库根目录执行：

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cd Browserapp
npm run build:rustcore
npm run selftest:rustparity
npm run selftest:rustchaos
npm run selftest:rustrelease
npm run lint -- --max-warnings 0
node scripts/selftest-all.js
node scripts/benchmark-real-load.js --json
node scripts/selftest-one.js optimizationintegration
node scripts/selftest-one.js restorejournal
node scripts/selftest-one.js diagnosticlauncher
node scripts/selftest-one.js mcptransport
DISPLAY=:99 node_modules/electron/dist/electron --no-sandbox scripts/benchmark-real-render.js --sizes 10,100,1000 --require-kernel --json
DISPLAY=:99 node scripts/selftest-one.js appstartup
```

桌面基准把 userData 和 SQLite 放在临时目录，并等待真实 UI 初始化完成。`--require-kernel` 要求独立浏览器实际启动、会话查询和停止；`--skip-kernel` 用于仅验证 Electron/DOM/IPC/SQLite 的三平台 CI，两者不能混淆。Rust 构建脚本遵循 `CARGO_TARGET_DIR`，发布产物仍复制到既有 `Browserapp/rust-core/` 目录。

完整 Electron DOM 性能基准另需可用显示服务：按 `scripts/benchmark-real-render.js` 头部说明，通过 Electron CLI 和 Xvfb 或真实桌面运行。只通过 Electron 的 Node 模式版本检查，不表示窗口、IPC 或页面绘制已经验证。Windows/macOS 原生窗口和定制 macOS 内核仍需对应平台运行。

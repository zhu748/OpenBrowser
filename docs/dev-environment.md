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
| Electron | 43.1.1，`Browserapp/node_modules/electron/dist/electron` |
| Rust / Cargo | 1.99.1，工作区 `toolchains/cargo/bin/` |
| rustfmt / Clippy | 与该工具链一同安装 |
| Firefox | 160.0，工作区 `toolchains/firefox/firefox` |
| Chrome Headless Shell | 157.0.8103.78，工作区 `toolchains/chrome-headless-shell-linux64/chrome-headless-shell` |
| 完整系统 Chromium | 156.0.8078.79，`/usr/bin/chromium`；本宿主的 Unix socket 权限阻止其启动 |

本工作区可通过下面的 shell 配置复用这些工具；换机器后应将 `OPENBROWSER_TOOLCHAIN_ROOT` 改成实际安装位置：

```sh
export OPENBROWSER_TOOLCHAIN_ROOT=/workspace/scratch/fcc145c5a183/toolchains
export CARGO_HOME="$OPENBROWSER_TOOLCHAIN_ROOT/cargo"
export RUSTUP_HOME="$OPENBROWSER_TOOLCHAIN_ROOT/rustup"
export PATH="$CARGO_HOME/bin:$PATH"
export TMPDIR=/workspace/scratch/fcc145c5a183/tmp
export NODE_USE_ENV_PROXY=0
export OPENBROWSER_FIREFOX_BINARY="$OPENBROWSER_TOOLCHAIN_ROOT/firefox/firefox"
export OPENBROWSER_CHROMIUM_BINARY="$OPENBROWSER_TOOLCHAIN_ROOT/chrome-headless-shell-linux64/chrome-headless-shell"
export OPENBROWSER_NATIVE_NO_SANDBOX=1
export OPENBROWSER_RUST_CORE_BINARY=/workspace/scratch/fcc145c5a183/OpenBrowser/Browserapp/rust-core/openbrowser-core
```

这里的 `OPENBROWSER_NATIVE_NO_SANDBOX=1` 是当前受限测试容器的原生门禁选项，测试仅访问回环页面；不应复制为桌面浏览器的生产默认配置。其他开发机器可在保留浏览器自身 sandbox 的条件下运行。

也可以直接检查指定的工具目录，不修改当前 shell：

```sh
npm run check:environment -- --toolchain-root /workspace/scratch/fcc145c5a183/toolchains --strict
```

该参数会为检查进程配置 Cargo/rustup 和 Firefox 路径；Chromium 仍使用 `OPENBROWSER_CHROMIUM_BINARY`，或默认的 `chromium` 命令。

## 重新安装的官方来源

Rust 使用 [官方 rustup 安装说明](https://rust-lang.org/tools/install/)；将 `CARGO_HOME`、`RUSTUP_HOME` 指向可写目录，以 `--profile minimal --component rustfmt --component clippy --no-modify-path` 安装所需组件。本次安装器及 stable 清单保留在工作区 `toolchains/`。

Firefox 使用 [Mozilla 下载入口](https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US)。本次下载后的版本经二进制 `--version` 和项目真实门禁确认。

Chrome Headless Shell 来自 [Chrome for Testing 官方 JSON 清单](https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json) 中 Stable / linux64 项。它是[官方提供的独立无界面实现](https://developer.chrome.com/docs/automation-and-testing/headless-chrome-shell)，可用于本轮原生测试，但不能等同完整 Chrome 窗口行为。下载清单与压缩包保留在工作区 `toolchains/`。

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
```

完整 Electron DOM 性能基准另需可用显示服务：按 `scripts/benchmark-real-render.js` 头部说明，通过 Electron CLI 和 Xvfb 或真实桌面运行。只通过 Electron 的 Node 模式版本检查，不表示窗口、IPC 或页面绘制已经验证。Windows/macOS 原生窗口和定制 macOS 内核仍需对应平台运行。

<div align="center">

<img src="./assets/openbrowser-title.svg" alt="OpenBrowser" width="820">

[![Version](https://img.shields.io/badge/version-1.0.27-blue)](https://github.com/zhu748/OpenBrowser)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Ubuntu-lightgrey)](https://github.com/zhu748/OpenBrowser)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Node](https://img.shields.io/badge/Node.js-LTS-339933.svg)](https://nodejs.org/)

**Multi-language support / 多国语言支持**

🇺🇸 **English** · 🇨🇳 [中文](./README_CN.md)

**Local fingerprint browser · Isolated Chromium profiles · Proxy / fingerprint / sync / RPA**

</div>

---

## Overview

OpenBrowser is a local desktop fingerprint browser for managing multiple isolated Chromium environments. It combines profile isolation, proxy configuration, browser fingerprint controls, extension management, window synchronization, a local API, MCP integration, and local RPA workflows in one desktop app.

The app supports multiple UI languages, currently including English and Chinese.

> Read the [disclaimer](./DISCLAIMER.md) before use. OpenBrowser does not guarantee anonymity, unique fingerprints, or compatibility with any specific website.

## Contents

- [Screenshots](#screenshots)
- [Key features](#key-features)
- [Supported platforms](#supported-platforms)
- [Quick start](#quick-start)
- [Packaging](#packaging)
- [Self-tests](#self-tests)
- [Project layout](#project-layout)
- [Data and security](#data-and-security)

## Screenshots

| Overview | Environments |
| :---: | :---: |
| ![Overview](./docs/screenshots/openbrowser-overview.png) | ![Environments](./docs/screenshots/environment-management.png) |
| Main navigation and module entry points | Profiles, start/stop controls, and groups |

| Profile / fingerprint | Local settings |
| :---: | :---: |
| ![Profile editor](./docs/screenshots/profile-fingerprint-editor.png) | ![Settings](./docs/screenshots/automation-and-system.png) |
| Proxy, fingerprint, and extension settings | Theme, language, and system options |

## Key features

| Area | What it provides |
| --- | --- |
| **Profile isolation** | Separate Chromium profiles so cookies, cache, and storage do not mix. |
| **Batch management** | Groups, tags, bulk start/stop, logs, and window sizing. |
| **Proxy support** | HTTP / HTTPS / SOCKS proxies per environment, with egress checks. |
| **Fingerprint controls** | Platform, language, timezone, user agent, Canvas, WebGL, WebRTC, and more. |
| **Extension center** | Built-in, recommended, and local extensions loaded per environment. |
| **Window sync** | CDP-based synchronization for clicks, scrolling, input, and tabs. |
| **Local RPA** | Flows for navigation, waiting, clicking, typing, and screenshots. |
| **Local API / MCP** | Local integration endpoint on `127.0.0.1:50325` by default. |
| **Independent kernel** | Download a standalone Chromium kernel or use a custom local path. |
| **Multi-version kernels** | One kernel per major release, like mainstream fingerprint browsers: Chrome for Testing offers its latest build for every major (145/146/147…, under `kernels/chromium-versions/<version>`), and official Firefox releases cover every generation (`kernels/firefox/<version>`, tarball / DMG / MSI per platform, SHA-256 verified from Mozilla's SHA256SUMS). Any installed version can be pinned as the default kernel. |
| **Firefox engine** | Per-profile engine choice (Chromium or Firefox). Firefox environments launch with UA / language / proxy / telemetry prefs applied via `user.js`, no CDP required. RPA and window sync stay Chromium-only by design. |
| **Extension install** | Install extensions inside the browser itself — Chrome Web Store "Add to Chrome" or Firefox add-ons — and the install persists in the profile across restarts (no blocking launch switches, profile prep merges `Preferences` instead of clobbering, retention/cache cleanup never touches `Default/Extensions`). The App Center adds batch install (built-in apps, one-click store imports, local folders) with per-profile enable/disable via `--load-extension`. |
| **Backup options** | Local, WebDAV, GitHub, and cloud-drive backups when explicitly enabled. |

## Supported platforms

| Platform | Architecture | Status |
| --- | --- | --- |
| Windows | x86_64 | ✅ Supported |
| macOS | x86_64 | ✅ Supported |
| macOS | arm64 | ✅ Supported |
| Ubuntu | x86_64 | ✅ Supported |

## Quick start

Requires Node.js LTS and npm.

```bash
cd Browserapp
npm ci --include=dev
npm run selftest -- environment   # quick smoke check (one registered test)
npm start
```

Or use the launcher scripts from the repository root:

| Platform | Launcher |
| --- | --- |
| macOS | [`start-test.command`](./start-test.command) |
| Windows | [`start-test.cmd`](./start-test.cmd) |
| Ubuntu | [`start-test.sh`](./start-test.sh) |

## Packaging

```bash
cd Browserapp
# Optional: OPENBROWSER_PACKAGE_ARCH=x86_64 or arm64
# Ubuntu x86_64 only: explicitly fetch the Chrome for Testing package seed.
npm run prepare:linux-kernel
npm run package:portable
```

Build output is written to `Browserapp/dist/`.

| Platform | Output notes |
| --- | --- |
| Windows | Includes `START.cmd`. |
| macOS | Includes `OpenBrowser.app` and `启动.command`. |
| Ubuntu x86_64 | Includes an `OpenBrowser-…tar.gz` portable archive and launcher. |

Ubuntu packages include Chrome for Testing under
`kernels/chrome-for-testing/chrome-linux64`; the application never downloads a
kernel at runtime. Run the package as a normal desktop user, not with `sudo`.
If required, install the standard Electron/Chromium desktop libraries:

```bash
sudo apt-get install libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcups2 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2
```

## Self-tests

The SUITE registry in `Browserapp/scripts/selftest-all.js` is the single list of
registered tests; `npm run selftest -- <name>` resolves a registry name (or a
unique file-name prefix) and runs that one test.

```bash
cd Browserapp
npm run selftest -- list     # print every registered test
npm run selftest -- cloud    # run one test (name / unique file-name prefix)
npm run selftest:all         # aggregate kernel-free suite (what CI runs)
```

Kernel/display-bound tests (real Chromium needed) are not in the registry and
keep their individual npm scripts, for example:

```bash
npm run selftest:protocol
npm run selftest:kernel
```

## Project layout

```text
OpenBrowser/
├── Browserapp/            # App source
├── docs/screenshots/      # Screenshots
├── start-test.command     # macOS launcher
├── start-test.cmd         # Windows launcher
├── start-test.sh          # Ubuntu launcher
├── DISCLAIMER.md
├── LICENSE
├── README.md              # English documentation
└── README_CN.md           # Chinese documentation
```

This repository contains source code, documentation, and — via [Git LFS](https://git-lfs.com/) — the platform kernel seeds used for packaging: the Windows x64 and macOS arm64 kernels are checked in under `Browserapp/kernels/` (LFS), the macOS x86_64 OpenBrowser 148 runtime is checked in as regular files, and Ubuntu x86_64 builds fetch Chrome Stable explicitly during CI packaging. It never includes profiles, cookies, proxy credentials, or installers. Clone with `git lfs install && git clone …` to receive the kernel seeds.

## Data and security

- The local API binds to loopback by default.
- If `OPENBROWSER_API_KEY` is set, requests must include the `api-key` header.
- Browser startup failures are appended to the local-only `browser-startup.log` under the user's OpenBrowser data directory. Inspect it with `npm run log:startup` from `Browserapp/`; logs are ignored by Git.
- Third-party notices are documented in [`THIRD-PARTY-NOTICES.md`](./Browserapp/THIRD-PARTY-NOTICES.md).
- Cloud backup integrations only connect outward after explicit user configuration.
- **Backups that contain account credentials (cookies / passwords / 2FA / proxy logins / browser data) are only uploaded when a backup passphrase is set** — unencrypted credential uploads are rejected.
- The updater checks installer SHA-256 and the Ed25519 signature in `SHA256SUMS.txt.sig`. Future releases with missing, invalid or unavailable signatures are refused; only the exact historical version `1.0.27` retains the legacy compatibility policy.
- RPA plans, variables and results are encrypted at rest. Existing JSON stores migrate after a successful read; use application import/export instead of editing storage files.
- Credential writes are refused when the local key cannot be read or durably saved. Preserve the original key and data files for recovery.
- RPA CSV/text/JSON inputs are limited to 32 MiB and 100,000 rows. CSV allows at most 1,000 columns; CSV fields and text lines allow at most 1,048,576 UTF-16 code units. Split larger inputs.
- RPA tasks share eight execution slots and run serially per task profile. Waiting tasks can be cancelled without occupying execution slots.
- Interrupted browser-data restores block launching or deleting the affected data until their recovery directories have been reviewed. Completed restores clean up leftover staging directories on the next launch.

## Documentation

- [Automation module](./Browserapp/automation/README.md)
- [Disclaimer](./DISCLAIMER.md)
- [Third-party notices](./Browserapp/THIRD-PARTY-NOTICES.md)

---

<details>
<summary>Third-party kernel sources</summary>

<br>

The independent kernel comes from [Donut Browser](https://github.com/zhom/donutbrowser) / [Wayfern](https://wayfern.com/) by [zhom](https://github.com/zhom). Update feed: [wayfern.json](https://donutbrowser.com/wayfern.json). Terms: [Wayfern ToS](https://wayfern.com/tos).

Kernel seeds for Windows x64 and macOS arm64 are stored in this repository through Git LFS under `Browserapp/kernels/` and are consumed by CI packaging; macOS x86_64 packages use the checked-in OpenBrowser 148 runtime; Ubuntu x86_64 packages fetch Chrome Stable from Google during CI. Runtime kernel updates still follow the official feed.

</details>

## License

[MIT](./LICENSE)

---

<div align="center">

If OpenBrowser is useful to you, a Star is appreciated ⭐

</div>

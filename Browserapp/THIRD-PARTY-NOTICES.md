# Third-party notices

This is the maintained inventory for both the repository and packaged
application. OpenBrowser's root MIT license covers its original code; it does
not replace the licenses or redistribution terms of the components below.

## chrome-power

- Source: https://github.com/zmzimpl/chrome-power-app
- License: GNU Affero General Public License v3.0 (AGPL-3.0)
- Local reference supplied by the user: `chrome-power-app-main`

The Windows background-input portion of `native-input-mirror.cs` adapts the
open-source project's documented/native approach: identify the master Chrome
window, map window-relative coordinates to each controlled Chrome window, and
deliver `WM_MOUSE*` / `WM_KEY*` messages without repeatedly activating those
windows. The code has been integrated and modified for this application's C#
runtime and is distributed with corresponding source.

The complete upstream license text is included as `LICENSE.chrome-power.txt`.

### Native helper provenance status

The chrome-power attribution above records a declared upstream source. The
`native-*.cs` source headers still carry `SPDX-License-Identifier: UNLICENSED`;
they have not been reconciled with that attribution on a per-file basis. The
attribution is not evidence that every helper is covered by AGPL or MIT.
Record the exact upstream revision, adapted files and applicable license before
changing those headers or claiming a uniform redistribution license.

## Platform font subsets

`assets/font-subsets/` contains platform-oriented font subsets and its family
index. Windows and macOS families include proprietary Microsoft, Apple and
Apple-licensed fonts. Subsetting or converting fonts does not itself grant
redistribution rights, and the project MIT license does not cover those rights.
The repository does not contain a complete per-font redistribution-rights record.

For Linux and Android families, retain and verify the applicable upstream
license texts (including SIL OFL, Apache and any font exceptions). An index
entry or an OS label is not sufficient license evidence. Resolve proprietary
font payloads through redistribution permission, user-supplied local assets,
or verified open replacements before claiming distributable coverage.

## Archived frontend inputs

`rebuild/compiler/vendor/roxy-ui/` contains supplied, precompiled UI inputs.
Their exact bytes and file list are pinned by `source-manifest.json`; see the
vendor README for the build boundary. Hashes establish integrity, not authorship
or redistribution permission. Record the input supplier, upstream revision and
applicable license separately. Patching, pruning or renaming generated output
does not establish a new license for the original assets.

The compiler inputs are excluded from installers. The generated `roxy-ui/`
assets are packaged, so provenance must cover the retained generated material.

## Vue.js

The window templates page bundles the npm Vue.js runtime under the MIT license.
Its exact version is locked in `package-lock.json`, and its license ships at
`roxy-ui/source-frontend/VUE-LICENSE.txt`.

## Fuse.js

The workbench uses Fuse.js 7.4.1 for local search in form controls. The MIT
license ships with the npm dependency at `node_modules/fuse.js/LICENSE`.

## XLSX import XML parsing

The local XLSX import uses Saxes (ISC) and XMLChars (MIT). Their license files
ship with the production npm dependencies. Versions are locked in `package-lock.json`.

## Browser kernels

Browser kernels are downloaded at runtime and are neither Git LFS objects in
the current source tree nor preinstalled in application installers. Kernel
downloads have their own integrity and version checks; those checks do not
replace their upstream license and trademark requirements. The Electron host
and its embedded Chromium are distributed separately as described below.

## Desktop host runtime

- Version: 43.8.8
- Package: `electron` (npm)
- License: MIT

The portable release embeds a desktop application host and its bundled Chromium
engine. The host license is included as `runtime/LICENSE`; Chromium and bundled
component notices are included as `runtime/LICENSES.chromium.html`.

## rcedit

- Version: 5.0.2
- Package: `rcedit` (npm)
- License: MIT
- Usage: build-time only

`rcedit` is used only while building the Windows portable package to set the project icon and version metadata. It is not loaded by the application at runtime.

## Installer asset provenance

| Installer paths | Evidence to record before redistribution |
| --- | --- |
| `roxy-ui/` | Supplier, revision and license for the retained precompiled scripts, styles, images and fonts. The build input hashes are recorded in `rebuild/compiler/source-manifest.json`. |
| `assets/font-subsets/` and `assets/fonts/` | Upstream family, exact source and applicable redistribution terms for each shipped font. The development directory `assets/fonts/_preview/` is excluded. |
| `native-*.cs` and Windows helper executables | Upstream revision, adapted files and applicable license per helper. Preserve the source corresponding to each Windows executable. |

## Acorn

- Version: 8.19.0
- Source: https://github.com/acornjs/acorn
- License: MIT

The unmodified parser is bundled at `automation/vendor/acorn.js`. Private worker
preparation embeds the compact `acorn-runtime.js`, generated reproducibly by
`scripts/build-worker-parser.js` without changing token spelling or line breaks.
The full MIT license is included in that runtime and in `automation/vendor/acorn.LICENSE`.

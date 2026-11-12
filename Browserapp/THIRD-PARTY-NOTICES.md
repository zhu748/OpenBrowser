# Third-party notices

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

## Acorn

- Version: 8.19.0
- Source: https://github.com/acornjs/acorn
- License: MIT

The unmodified parser is bundled at `automation/vendor/acorn.js`. Private worker
preparation embeds the compact `acorn-runtime.js`, generated reproducibly by
`scripts/build-worker-parser.js` without changing token spelling or line breaks.
The full MIT license is included in that runtime and in `automation/vendor/acorn.LICENSE`.
